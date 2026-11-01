"""RT-ORCH-04-C offline integration and fail-closed negative controls."""
from __future__ import annotations

import unittest

from rt_orch_ci_gate import check
from rt_orch_evidence import EvidenceError
from test_rt_orch_evidence import BASE, HEAD, FakeReader, summary


ALLOW = ["verify/rt_orch_evidence.py"]


def run(reader=None, allow=None):
    return check(reader or FakeReader(), 13, BASE, HEAD, ALLOW if allow is None else allow)


class CombinedGateTests(unittest.TestCase):
    def test_normal_allowed_change_passes(self):
        errors, evidence = run()
        self.assertEqual(errors, [])
        self.assertEqual(evidence["current_pr_number"], 13)

    def test_outside_allowlist_fails(self):
        r = FakeReader()
        r.files[0]["filename"] = "src/core.js"
        errors, _ = run(r)
        self.assertIn("OUTSIDE_ALLOWLIST:src/core.js", errors)

    def test_golden_fails_even_explicitly_allowlisted(self):
        r = FakeReader()
        r.files[0]["filename"] = "tests/golden.json"
        errors, _ = run(r, ["tests/golden.json"])
        self.assertIn("PROTECTED_FILE_CHANGE:tests/golden.json", errors)
        self.assertIn("PROTECTED_ALLOWED_PATH:tests/golden.json", errors)

    def test_workflow_fails_even_explicitly_allowlisted(self):
        r = FakeReader()
        r.files[0]["filename"] = ".github/workflows/ci.yml"
        errors, _ = run(r, [".github/workflows/ci.yml"])
        self.assertIn("PROTECTED_FILE_CHANGE:.github/workflows/ci.yml", errors)

    def test_deploy_build_fails(self):
        r = FakeReader()
        r.files[0]["filename"] = "android/app/build.gradle"
        errors, _ = run(r, ["android/app/build.gradle"])
        self.assertIn("PROTECTED_FILE_CHANGE:android/app/build.gradle", errors)

    def test_rename_origin_not_approved(self):
        r = FakeReader()
        r.files[0] = {"filename": "verify/rt_orch_evidence.py",
                      "previous_filename": "src/core.js", "status": "renamed"}
        errors, _ = run(r)
        self.assertIn("OUTSIDE_ALLOWLIST:src/core.js", errors)

    def test_duplicate_open_pr_blocks(self):
        r = FakeReader()
        r.open_prs.append(summary(17))
        errors, _ = run(r)
        self.assertIn("DUPLICATE_OPEN_PR:17", errors)

    def test_new_commit_during_capture_blocks(self):
        r = FakeReader()
        r.last_head_sha = "c" * 40
        with self.assertRaisesRegex(EvidenceError, "STALE_HEAD_SHA"):
            run(r)

    def test_main_change_during_capture_blocks(self):
        r = FakeReader()
        r.last_main_sha = "c" * 40
        with self.assertRaisesRegex(EvidenceError, "STALE_MAIN_SHA"):
            run(r)

    def test_truncated_file_list_blocks(self):
        r = FakeReader()
        r.pr["changed_files"] = 2
        with self.assertRaisesRegex(EvidenceError, "INCOMPLETE_FILE_LIST"):
            run(r)

    def test_empty_allowlist_blocks(self):
        with self.assertRaisesRegex(EvidenceError, "INVALID_ALLOWLIST"):
            run(allow=[])

    def test_invalid_status_blocks(self):
        r = FakeReader()
        r.files[0]["status"] = []
        errors, _ = run(r)
        self.assertIn("INVALID_CHANGE_ENTRY", errors)

    def test_protected_file_cannot_be_disguised(self):
        r = FakeReader()
        r.files[0]["filename"] = "verify/rt_orch_evidence.py"
        r.files[0]["status"] = "renamed"
        r.files[0]["previous_filename"] = "tests/golden.json"
        errors, _ = run(r)
        self.assertIn("PROTECTED_FILE_CHANGE:tests/golden.json", errors)


if __name__ == "__main__":
    unittest.main()
