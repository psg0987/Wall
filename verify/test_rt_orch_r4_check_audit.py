"""R4 offline check provenance scenarios, no external GitHub calls."""
from __future__ import annotations

import copy
import unittest

from rt_orch_r4_check_audit import validate, REQUIRED_GUARD

HEAD = "b" * 40
BASE = "a" * 40
APP = 15368


def fixtures():
    ruleset = {
        "id": 26300434, "enforcement": "active",
        "conditions": {"ref_name": {"include": ["refs/heads/main"]}},
        "rules": [{"type": "required_status_checks", "parameters": {
            "required_status_checks": [
                {"context": "full-suite", "integration_id": APP},
                {"context": REQUIRED_GUARD, "integration_id": APP}
            ]
        }}],
    }
    pr = {"number": 19, "state": "open", "head": {"sha": HEAD},
          "base": {"sha": BASE, "ref": "main"}}
    checks = [
        {"id": 1101, "name": "full-suite", "head_sha": HEAD,
         "app": {"id": APP}, "status": "completed", "conclusion": "success",
         "details_url": "https://github.com/psg0987/Wall/actions/runs/1001/job/1101"},
        {"id": 1102, "name": REQUIRED_GUARD, "head_sha": HEAD,
         "app": {"id": APP}, "status": "completed", "conclusion": "success",
         "details_url": "https://github.com/psg0987/Wall/actions/runs/1002/job/1102"},
    ]
    runs = {
        "1001": {"id": 1001, "event": "pull_request", "head_sha": HEAD,
                 "path": ".github/workflows/ci.yml", "pull_requests": [{"number": 19}]},
        "1002": {"id": 1002, "event": "pull_request_target", "head_sha": HEAD,
                 "path": ".github/workflows/rt-orch-trusted-guard.yml",
                 "pull_requests": [{"number": 19}]},
    }
    return ruleset, pr, checks, runs


class R4CheckAuditTests(unittest.TestCase):
    def test_structurally_consistent_snapshot_is_diagnostic_only(self):
        self.assertEqual(validate(*fixtures()), [])

    def test_current_ruleset_without_guard_is_not_sufficient(self):
        r, p, c, w = fixtures()
        r["rules"][0]["parameters"]["required_status_checks"].pop()
        self.assertIn("MISSING_REQUIRED:" + REQUIRED_GUARD, validate(r, p, c, w))

    def test_old_commit_success_does_not_cover_head(self):
        r, p, c, w = fixtures()
        c[1]["head_sha"] = BASE
        self.assertIn("CHECK_WRONG_HEAD:" + REQUIRED_GUARD, validate(r, p, c, w))

    def test_base_attributed_guard_check_is_not_accepted(self):
        r, p, c, w = fixtures()
        c[1]["head_sha"] = BASE
        w["1002"]["head_sha"] = BASE
        self.assertIn("CHECK_WRONG_HEAD:" + REQUIRED_GUARD, validate(r, p, c, w))

    def test_target_event_uses_base_ref_not_automatically_head(self):
        r, p, c, w = fixtures()
        w["1002"]["head_sha"] = BASE
        self.assertIn("GUARD_RUN_NOT_ON_PR_HEAD", validate(r, p, c, w))

    def test_skipped_and_neutral_fail_closed_in_audit(self):
        for conclusion in ("skipped", "neutral", "cancelled", "failure", None):
            with self.subTest(conclusion=conclusion):
                r, p, c, w = fixtures()
                c[1]["conclusion"] = conclusion
                self.assertIn("CHECK_NOT_SUCCESS:" + REQUIRED_GUARD, validate(r, p, c, w))

    def test_pending_is_not_success(self):
        r, p, c, w = fixtures()
        c[1]["status"] = "in_progress"
        c[1]["conclusion"] = None
        self.assertIn("CHECK_NOT_SUCCESS:" + REQUIRED_GUARD, validate(r, p, c, w))

    def test_check_forged_with_wrong_app(self):
        r, p, c, w = fixtures()
        c[1]["app"]["id"] = 42
        self.assertIn("CHECK_UNTRUSTED_APP:" + REQUIRED_GUARD, validate(r, p, c, w))

    def test_ruleset_expected_app_mismatch(self):
        r, p, c, w = fixtures()
        r["rules"][0]["parameters"]["required_status_checks"][1]["integration_id"] = 42
        self.assertIn("UNEXPECTED_REQUIRED_APP:" + REQUIRED_GUARD, validate(r, p, c, w))

    def test_duplicate_same_name_checks_block(self):
        r, p, c, w = fixtures()
        c.append(copy.deepcopy(c[1]))
        self.assertIn("CHECK_DUPLICATE:" + REQUIRED_GUARD, validate(r, p, c, w))

    def test_missing_check_blocks(self):
        r, p, c, w = fixtures()
        c.pop()
        self.assertIn("CHECK_ABSENT:" + REQUIRED_GUARD, validate(r, p, c, w))

    def test_wrong_workflow_path_blocks(self):
        r, p, c, w = fixtures()
        w["1002"]["path"] = ".github/workflows/ci.yml"
        self.assertIn("GUARD_WORKFLOW_SOURCE_MISMATCH", validate(r, p, c, w))

    def test_wrong_event_blocks(self):
        r, p, c, w = fixtures()
        w["1002"]["event"] = "pull_request"
        self.assertIn("GUARD_WORKFLOW_SOURCE_MISMATCH", validate(r, p, c, w))

    def test_no_source_run_blocks(self):
        r, p, c, w = fixtures()
        del w["1002"]
        self.assertIn("WORKFLOW_RUN_NOT_VERIFIED:" + REQUIRED_GUARD, validate(r, p, c, w))

    def test_run_link_must_match_job_id(self):
        r, p, c, w = fixtures()
        c[1]["details_url"] = "https://example.org/actions/runs/1002/job/1102"
        self.assertIn("UNVERIFIED_RUN_LINK:" + REQUIRED_GUARD, validate(r, p, c, w))

    def test_run_must_reference_exact_pr(self):
        r, p, c, w = fixtures()
        w["1002"]["pull_requests"] = [{"number": 17}]
        self.assertIn("RUN_PR_LINK_NOT_VERIFIED:" + REQUIRED_GUARD, validate(r, p, c, w))

    def test_wrong_ruleset_identity_blocks(self):
        r, p, c, w = fixtures()
        r["id"] = 999
        self.assertEqual(validate(r, p, c, w), ["RULESET_NOT_VERIFIED"])

    def test_inactive_ruleset_blocks(self):
        r, p, c, w = fixtures()
        r["enforcement"] = "evaluate"
        self.assertIn("RULESET_NOT_ACTIVE_FOR_MAIN", validate(r, p, c, w))

    def test_no_required_full_suite_blocks(self):
        r, p, c, w = fixtures()
        r["rules"][0]["parameters"]["required_status_checks"].pop(0)
        self.assertIn("MISSING_REQUIRED:full-suite", validate(r, p, c, w))

    def test_duplicate_required_check_names_block(self):
        r, p, c, w = fixtures()
        r["rules"][0]["parameters"]["required_status_checks"].append({"context": REQUIRED_GUARD, "integration_id": APP})
        self.assertIn("DUPLICATE_REQUIRED_CONTEXT", validate(r, p, c, w))


if __name__ == "__main__":
    unittest.main()
