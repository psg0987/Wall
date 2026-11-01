"""Offline unit tests; these are NOT executed by the existing full-suite CI."""

from __future__ import annotations

import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from rt_orch_gate import evaluate, safe_path


SHA_BASE = "a" * 40
SHA_HEAD = "b" * 40
BRANCH = "exp/rt-orch-04-a-gate"
FILE = "verify/rt_orch_gate.py"


def good():
    return {
        "repository": "psg0987/Wall", "base_ref": "main",
        "base_sha": SHA_BASE, "expected_base_sha": SHA_BASE,
        "head_sha": SHA_HEAD, "expected_head_sha": SHA_HEAD,
        "branch": BRANCH,
        "allowed_paths": [FILE, "verify/test_rt_orch_gate.py"],
        "changes": [{"filename": FILE, "status": "added"}],
        "open_pull_requests": [], "pr_list_complete": True,
        "current_pr_number": None,
    }


class GateTests(unittest.TestCase):
    def test_good_snapshot(self):
        self.assertEqual(evaluate(good()), [])

    def test_repo_and_branch_constraints(self):
        for key, val, reason in [
            ("repository", "unknown/Wall", "REPO_MISMATCH"),
            ("base_ref", "develop", "BASE_REF_MISMATCH"),
            ("branch", "main", "INVALID_EXPERIMENT_BRANCH"),
        ]:
            with self.subTest(key=key):
                data = good(); data[key] = val
                self.assertIn(reason, evaluate(data))

    def test_sha_mismatch_and_missing(self):
        for key, val, code in [
            ("base_sha", "c" * 40, "BASE_SHA_MISMATCH"),
            ("head_sha", "c" * 40, "HEAD_SHA_MISMATCH"),
            ("base_sha", "not-a-sha", "INVALID_SHA:base_sha"),
            ("head_sha", None, "INVALID_SHA:head_sha"),
        ]:
            with self.subTest(key=key, val=val):
                d = good(); d[key] = val
                self.assertIn(code, evaluate(d))

    def test_empty_commit_range(self):
        d = good(); d["head_sha"] = d["expected_head_sha"] = SHA_BASE
        self.assertIn("EMPTY_COMMIT_RANGE", evaluate(d))

    def test_allowlist_non_members_are_blocked(self):
        d = good(); d["changes"] = [{"filename": "src/core.js", "status": "modified"}]
        self.assertIn("OUTSIDE_ALLOWLIST:src/core.js", evaluate(d))

    def test_golden_always_blocked_even_when_allowlisted(self):
        d = good(); d["allowed_paths"].append("tests/golden.json")
        d["changes"] = [{"filename": "tests/golden.json", "status": "modified"}]
        e = evaluate(d)
        self.assertIn("PROTECTED_ALLOWED_PATH:tests/golden.json", e)
        self.assertIn("PROTECTED_FILE_CHANGE:tests/golden.json", e)

    def test_workflow_and_deploy_paths_blocked(self):
        for path in [".github/workflows/ci.yml", "android/app/build.gradle", "index.html", "build/build.py"]:
            with self.subTest(path=path):
                d = good(); d["allowed_paths"].append(path)
                d["changes"] = [{"filename": path, "status": "modified"}]
                self.assertIn("PROTECTED_FILE_CHANGE:" + path, evaluate(d))

    def test_rename_old_and_new_paths_must_be_allowed(self):
        d = good(); d["changes"] = [{"filename": FILE, "previous_filename": "src/core.js", "status": "renamed"}]
        self.assertIn("OUTSIDE_ALLOWLIST:src/core.js", evaluate(d))
        d["allowed_paths"].append("src/core.js")
        self.assertEqual(evaluate(d), [])

    def test_missing_rename_origin_is_blocked(self):
        d = good(); d["changes"] = [{"filename": FILE, "status": "renamed"}]
        self.assertIn("MISSING_PREVIOUS_PATH", evaluate(d))

    def test_duplicate_open_pr(self):
        d = good()
        d["open_pull_requests"] = [{"number": 17, "state": "open", "head": {"ref": BRANCH, "repo": {"full_name": "psg0987/Wall"}}}]
        self.assertIn("DUPLICATE_OPEN_PR:17", evaluate(d))
        d["current_pr_number"] = 17
        self.assertEqual(evaluate(d), [])

    def test_other_fork_not_duplicate(self):
        d = good()
        d["open_pull_requests"] = [{"number": 18, "state": "open", "head": {"ref": BRANCH, "repo": {"full_name": "external/Wall"}}}]
        self.assertEqual(evaluate(d), [])

    def test_incomplete_snapshot_fail_closed(self):
        for value in [None, False, "yes"]:
            with self.subTest(value=value):
                d = good(); d["pr_list_complete"] = value
                self.assertIn("PR_LIST_UNVERIFIED", evaluate(d))
        d = good(); d.pop("open_pull_requests")
        self.assertIn("INVALID_PR_LIST", evaluate(d))

    def test_unrecognized_pr_shape_fail_closed(self):
        d = good(); d["open_pull_requests"] = [{"number": 8, "head": {"ref": BRANCH}}]
        self.assertIn("INVALID_PR_ENTRY", evaluate(d))

    def test_disallow_unsafe_paths(self):
        for path in ["../src/core.js", "/tmp/evil", "src//core.js", "src\\core.js", "src/./core.js", "src/a b.js", ""]:
            with self.subTest(path=path):
                self.assertFalse(safe_path(path))
                d = good(); d["allowed_paths"] = [path]
                self.assertIn("UNSAFE_ALLOWED_PATH", evaluate(d))

    def test_incomplete_or_duplicate_changes(self):
        d = good(); d["changes"] = []
        self.assertIn("INVALID_CHANGESET", evaluate(d))
        d = good(); d["changes"].append({"filename": FILE, "status": "added"})
        self.assertIn("DUPLICATE_CHANGE_ENTRY:" + FILE, evaluate(d))
        d = good(); d["changes"] = [{"filename": FILE, "status": "unknown"}]
        self.assertIn("INVALID_CHANGE_ENTRY", evaluate(d))

    def test_cli_success_and_blocked_exit(self):
        script = Path(__file__).with_name("rt_orch_gate.py")
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "evidence.json"
            path.write_text(json.dumps(good()), encoding="utf-8")
            r = subprocess.run([sys.executable, str(script), str(path)], capture_output=True, text=True)
            self.assertEqual(r.returncode, 0)
            self.assertEqual(json.loads(r.stdout)["verdict"], "PASS")
            d = good(); d["changes"] = [{"filename": "tests/golden.json", "status": "modified"}]
            path.write_text(json.dumps(d), encoding="utf-8")
            r = subprocess.run([sys.executable, str(script), str(path)], capture_output=True, text=True)
            self.assertEqual(r.returncode, 2)
            self.assertIn("PROTECTED_FILE_CHANGE:tests/golden.json", json.loads(r.stdout)["reasons"])


if __name__ == "__main__":
    unittest.main()
