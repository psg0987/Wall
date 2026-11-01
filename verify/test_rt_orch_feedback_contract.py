"""RT-ORCH-07 synthetic feedback-loop inputs; no GitHub/Claude/Work calls."""
from __future__ import annotations

import copy
import unittest

from rt_orch_feedback_contract import inspect


def fixture():
    doc = "docs/rt-orch-03-e2e-04.md"
    pr = {"repository": "psg0987/Wall", "state": "open", "draft": True,
          "number": 25, "base_sha": "a" * 40, "head_sha": "b" * 40,
          "changed_paths": [doc]}
    approval = {"work_id": "RT-ORCH-03-E2E-04", "repository": "psg0987/Wall",
                "pr_number": 25, "base_sha": "a" * 40,
                "allowed_paths": [doc]}
    review = {"reviewer": "gpt-work", "work_id": "RT-ORCH-03-E2E-04",
              "pr_number": 25, "reviewed_sha": "b" * 40,
              "status": "CHANGES_REQUESTED",
              "findings": [{"severity": "P2", "code": "MISSING_NOTE",
                            "path": doc}]}
    ci = {"pr_number": 25, "tested_head": "b" * 40, "status": "PASS"}
    history = {"completed_repairs": 0, "reviewed_heads": []}
    return pr, approval, review, ci, history


class FeedbackContractTests(unittest.TestCase):
    def blocked(self, expected, parts):
        result = inspect(*parts)
        self.assertEqual(result["verdict"], "BLOCKED", result)
        self.assertIn(expected, result["reasons"])

    def test_positive_is_only_candidate_not_dispatch(self):
        result = inspect(*fixture())
        self.assertEqual(result["verdict"], "CANDIDATE_ONLY")
        self.assertFalse(result["may_dispatch"])
        self.assertEqual(result["authorization"], "NOT_VERIFIED")
        self.assertEqual(result["next_attempt"], 1)

    def test_wrong_repository(self):
        x = list(fixture()); x[0]["repository"] = "other/Wall"
        self.blocked("WRONG_REPOSITORY", x)

    def test_non_draft_pr(self):
        x = list(fixture()); x[0]["draft"] = False
        self.blocked("PR_NOT_OPEN_DRAFT", x)

    def test_closed_pr(self):
        x = list(fixture()); x[0]["state"] = "closed"
        self.blocked("PR_NOT_OPEN_DRAFT", x)

    def test_invalid_sha(self):
        x = list(fixture()); x[0]["head_sha"] = "ABC"
        self.blocked("INVALID_SHA", x)

    def test_same_base_and_head(self):
        x = list(fixture()); x[0]["base_sha"] = "b" * 40
        self.blocked("INVALID_SHA", x)

    def test_unapproved_work_id(self):
        x = list(fixture()); x[1]["work_id"] = "user-supplied-text"
        self.blocked("INVALID_WORK_ID", x)

    def test_review_wrong_head(self):
        x = list(fixture()); x[2]["reviewed_sha"] = "c" * 40
        self.blocked("REVIEW_STALE_OR_WRONG_SOURCE", x)

    def test_wrong_review_source(self):
        x = list(fixture()); x[2]["reviewer"] = "claim-gpt"
        self.blocked("REVIEW_STALE_OR_WRONG_SOURCE", x)

    def test_wrong_review_pr(self):
        x = list(fixture()); x[2]["pr_number"] = 26
        self.blocked("REVIEW_STALE_OR_WRONG_SOURCE", x)

    def test_approval_base_mismatch(self):
        x = list(fixture()); x[1]["base_sha"] = "c" * 40
        self.blocked("APPROVAL_SNAPSHOT_MISMATCH", x)

    def test_protected_financial_file_cannot_be_allowed(self):
        x = list(fixture()); x[1]["allowed_paths"] = ["src/sim.js"]
        self.blocked("UNSAFE_APPROVAL_SCOPE", x)

    def test_workflow_cannot_be_allowed(self):
        x = list(fixture()); x[1]["allowed_paths"] = [".github/workflows/ci.yml"]
        self.blocked("UNSAFE_APPROVAL_SCOPE", x)

    def test_path_traversal_cannot_be_allowed(self):
        x = list(fixture()); x[1]["allowed_paths"] = ["docs/../src/sim.js"]
        self.blocked("UNSAFE_APPROVAL_SCOPE", x)

    def test_changed_files_outside_scope(self):
        x = list(fixture()); x[0]["changed_paths"] = ["docs/different.md"]
        self.blocked("CHANGESET_NOT_APPROVED", x)

    def test_multiple_files_are_blocked(self):
        x = list(fixture()); x[0]["changed_paths"].append("tests/golden.json")
        self.blocked("CHANGESET_NOT_APPROVED", x)

    def test_review_pass_is_not_auto_fix(self):
        x = list(fixture()); x[2]["status"] = "PASS"
        self.blocked("NO_ACTIONABLE_REVIEW", x)

    def test_p3_is_not_auto_fix(self):
        x = list(fixture()); x[2]["findings"][0]["severity"] = "P3"
        self.blocked("UNSAFE_FINDING", x)

    def test_p0_must_escalate(self):
        x = list(fixture()); x[2]["findings"][0]["severity"] = "P0"
        self.blocked("UNSAFE_FINDING", x)

    def test_findings_cannot_direct_financial_edit(self):
        x = list(fixture()); x[2]["findings"][0]["path"] = "src/sim.js"
        self.blocked("UNSAFE_FINDING", x)

    def test_unknown_ci_sha(self):
        x = list(fixture()); x[3]["tested_head"] = "c" * 40
        self.blocked("CI_EVIDENCE_MISMATCH", x)

    def test_pending_ci_not_claimed_pass(self):
        x = list(fixture()); x[3]["status"] = "PENDING"
        result = inspect(*x)
        self.assertEqual(result["verdict"], "CANDIDATE_ONLY")
        self.assertFalse(result["may_dispatch"])

    def test_retry_limit_two(self):
        x = list(fixture()); x[4]["completed_repairs"] = 2
        self.blocked("RETRY_LIMIT_REACHED", x)

    def test_second_attempt_only_candidate(self):
        x = list(fixture()); x[4]["completed_repairs"] = 1
        result = inspect(*x)
        self.assertEqual(result["next_attempt"], 2)
        self.assertFalse(result["may_dispatch"])

    def test_no_duplicate_head(self):
        x = list(fixture()); x[4]["reviewed_heads"] = ["b" * 40]
        self.blocked("DUPLICATE_HEAD", x)

    def test_invalid_history(self):
        x = list(fixture()); x[4]["reviewed_heads"] = ["invalid"]
        self.blocked("INVALID_DEDUP_HISTORY", x)

    def test_missing_findings(self):
        x = list(fixture()); x[2]["findings"] = []
        self.blocked("INVALID_FINDINGS", x)

    def test_no_arbitrary_code_in_reason_field(self):
        x = list(fixture()); x[2]["findings"][0]["code"] = "__import__('os').system('echo hi')"
        self.blocked("UNSAFE_FINDING", x)

    def test_untrusted_objects_not_authorized_even_with_flag(self):
        x = list(fixture())
        x[1]["approved_by"] = "psg0987"
        x[1]["owner_verified"] = True
        x[2]["signed"] = True
        result = inspect(*x)
        self.assertEqual(result["authorization"], "NOT_VERIFIED")
        self.assertFalse(result["may_dispatch"])

    def test_invalid_inputs(self):
        self.assertEqual(inspect(None, {}, {}, {}, {})["reasons"], ["INVALID_INPUT"])

    def test_boolean_attempt_rejected(self):
        x = list(fixture()); x[4]["completed_repairs"] = True
        self.blocked("INVALID_REPAIR_HISTORY", x)


if __name__ == "__main__":
    unittest.main()
