"""RT-ORCH-04-C-R2 mock-API trust-boundary tests; no network or writes."""
from __future__ import annotations

import base64
import copy
import json
import unittest

from rt_orch_evidence import EvidenceError
from rt_orch_trusted_guard import MANIFEST_PATH, approved_entry, review
from test_rt_orch_evidence import FakeReader, BASE, HEAD, BRANCH


def entry():
    return {"pr_number": 13, "issue_number": 123, "head_sha": HEAD,
            "branch": BRANCH, "risk_class": "C1",
            "allowed_paths": ["verify/rt_orch_evidence.py"]}


class PolicyReader(FakeReader):
    def __init__(self):
        super().__init__()
        self.policy = {"schema_version": 1, "repository": "psg0987/Wall",
                       "approvals": [entry()]}
        self.manifest_missing = False
        self.manifest_data_override = None
        self.manifest_paths = []

    def object(self, path):
        if path.startswith("/contents/"):
            self.manifest_paths.append(path)
            if self.manifest_missing:
                raise EvidenceError("API_READ_FAILED")
            if self.manifest_data_override is None:
                b = json.dumps(self.policy).encode("utf-8")
            else:
                b = self.manifest_data_override
            return {"type": "file", "path": MANIFEST_PATH, "encoding": "base64",
                    "content": base64.b64encode(b).decode("ascii")}
        return super().object(path)


def run(reader=None):
    return review(reader or PolicyReader(), 13, BASE, HEAD)


class TrustedGuardTests(unittest.TestCase):
    def blocked(self, reason, reader):
        with self.assertRaisesRegex(EvidenceError, "^" + reason):
            run(reader)

    def test_positive_base_owned_manifest(self):
        r = PolicyReader()
        result = run(r)
        self.assertEqual(result["verdict"], "PASS")
        self.assertEqual(result["approved_issue"], 123)
        self.assertEqual(r.manifest_paths, ["/contents/" + MANIFEST_PATH + "?ref=" + BASE])

    def test_no_manifest_is_blocked(self):
        r = PolicyReader(); r.manifest_missing = True
        self.blocked("API_READ_FAILED", r)

    def test_no_approval_is_blocked(self):
        r = PolicyReader(); r.policy["approvals"] = []
        self.blocked("APPROVAL_MISSING", r)

    def test_duplicate_approval_is_blocked(self):
        r = PolicyReader(); r.policy["approvals"].append(copy.deepcopy(entry()))
        self.blocked("DUPLICATE_OR_INVALID_APPROVALS", r)

    def test_head_change_requires_new_approval(self):
        r = PolicyReader(); r.policy["approvals"][0]["head_sha"] = "c" * 40
        self.blocked("APPROVAL_SCOPE_MISMATCH", r)

    def test_branch_mismatch_is_blocked(self):
        r = PolicyReader(); r.policy["approvals"][0]["branch"] = "exp/other"
        self.blocked("APPROVED_BRANCH_MISMATCH", r)

    def test_policy_fails_for_unapproved_change(self):
        r = PolicyReader(); r.files[0]["filename"] = "src/core.js"
        self.blocked("SCOPE_BLOCKED:OUTSIDE_ALLOWLIST:src/core.js", r)

    def test_policy_cannot_approve_golden(self):
        r = PolicyReader(); r.policy["approvals"][0]["allowed_paths"] = ["tests/golden.json"]
        self.blocked("UNSAFE_APPROVED_PATHS", r)

    def test_policy_cannot_approve_workflow(self):
        r = PolicyReader(); r.policy["approvals"][0]["allowed_paths"] = [".github/workflows/ci.yml"]
        self.blocked("UNSAFE_APPROVED_PATHS", r)

    def test_stale_main_before_manifest_is_blocked(self):
        r = PolicyReader(); r.main_sha = "c" * 40
        self.blocked("STALE_TRUSTED_BASE", r)

    def test_malformed_manifest_is_blocked(self):
        r = PolicyReader(); r.manifest_data_override = b"{not json}"
        self.blocked("INVALID_TRUSTED_MANIFEST", r)

    def test_manifest_schema_is_checked(self):
        r = PolicyReader(); r.policy["schema_version"] = 2
        self.blocked("INVALID_TRUSTED_MANIFEST", r)

    def test_missing_issue_number_is_blocked(self):
        r = PolicyReader(); del r.policy["approvals"][0]["issue_number"]
        self.blocked("APPROVAL_SCOPE_MISMATCH", r)

    def test_duplicate_approved_paths_are_blocked(self):
        r = PolicyReader(); r.policy["approvals"][0]["allowed_paths"] *= 2
        self.blocked("UNSAFE_APPROVED_PATHS", r)

    def test_moving_pr_head_is_blocked(self):
        r = PolicyReader(); r.last_head_sha = "c" * 40
        self.blocked("CURRENT_BRANCH_SHA_MISMATCH", r)

    def test_non_draft_pr_is_blocked(self):
        r = PolicyReader(); r.pr["draft"] = False
        self.blocked("PR_NOT_OPEN_DRAFT", r)


if __name__ == "__main__":
    unittest.main()
