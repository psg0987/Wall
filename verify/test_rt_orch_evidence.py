"""Offline fake-API tests for RT-ORCH-04-B. Not yet registered in CI."""

import copy
import json
import unittest
from unittest.mock import patch

from rt_orch_evidence import (EvidenceError, GithubReader, collect, safe_path,
                              REPOSITORY, PAGE_SIZE)

BASE = "a" * 40
HEAD = "b" * 40
BRANCH = "exp/rt-orch-04-b-evidence"


def pr(number=13):
    return {"number": number, "state": "open", "draft": True, "changed_files": 1,
            "updated_at": "2026-11-01T00:00:00Z",
            "head": {"sha": HEAD, "ref": BRANCH, "repo": {"full_name": REPOSITORY}},
            "base": {"sha": BASE, "ref": "main", "repo": {"full_name": REPOSITORY}}}


def summary(number=13, branch=BRANCH, repo=REPOSITORY):
    return {"number": number, "state": "open", "head": {"ref": branch, "repo": {"full_name": repo}}}


class FakeReader(GithubReader):
    def __init__(self):
        self.pr = pr()
        self.last_pr = None
        self.files = [{"filename": "verify/rt_orch_evidence.py", "status": "added"}]
        self.open_prs = [summary()]
        self.main_sha = BASE
        self.head_sha = HEAD
        self.last_main_sha = None
        self.last_head_sha = None
        self.calls = {}

    def object(self, path):
        self.calls[path] = self.calls.get(path, 0) + 1
        count = self.calls[path]
        if path == "/pulls/13":
            return copy.deepcopy(self.last_pr if count > 1 and self.last_pr else self.pr)
        if path == "/git/ref/heads/main":
            return {"object": {"sha": self.last_main_sha if count > 1 and self.last_main_sha else self.main_sha}}
        if path == "/git/ref/heads/" + BRANCH:
            return {"object": {"sha": self.last_head_sha if count > 1 and self.last_head_sha else self.head_sha}}
        raise AssertionError("unexpected endpoint " + path)

    def all_pages(self, path):
        if path == "/pulls/13/files":
            return copy.deepcopy(self.files)
        if path == "/pulls":
            return copy.deepcopy(self.open_prs)
        raise AssertionError("unexpected collection " + path)


def build(reader=None, allow=None, **kw):
    reader = reader or FakeReader()
    args = dict(reader=reader, pr_number=13, expected_base_sha=BASE,
                expected_head_sha=HEAD,
                allowed_paths=["verify/rt_orch_evidence.py"] if allow is None else allow)
    args.update(kw)
    return collect(**args)


class EvidenceTests(unittest.TestCase):
    def blocked(self, code, reader=None, **kwargs):
        with self.assertRaisesRegex(EvidenceError, "^" + code + "$"):
            build(reader=reader, **kwargs)

    def test_valid_snapshot_and_rechecks(self):
        r = FakeReader()
        snap = build(r)
        self.assertEqual(snap["changes"], [{"filename": "verify/rt_orch_evidence.py", "status": "added"}])
        self.assertEqual(snap["head_sha"], HEAD)
        self.assertEqual(snap["open_pull_requests"][0]["number"], 13)
        self.assertTrue(snap["pr_list_complete"])
        self.assertEqual(r.calls["/pulls/13"], 2)
        self.assertEqual(r.calls["/git/ref/heads/main"], 2)
        self.assertEqual(r.calls["/git/ref/heads/" + BRANCH], 2)
        self.assertTrue(snap["collector"]["snapshot_is_not_transactional"])

    def test_expected_sha_mismatches_are_blocked(self):
        self.blocked("HEAD_SHA_MISMATCH", expected_head_sha="c" * 40)
        self.blocked("BASE_SHA_MISMATCH", expected_base_sha="c" * 40)
        self.blocked("INVALID_EXPECTED_SHA", expected_base_sha="a")

    def test_current_ref_mismatch(self):
        r = FakeReader(); r.main_sha = "c" * 40
        self.blocked("CURRENT_MAIN_SHA_MISMATCH", reader=r)
        r = FakeReader(); r.head_sha = "c" * 40
        self.blocked("CURRENT_BRANCH_SHA_MISMATCH", reader=r)

    def test_second_read_detects_moving_refs(self):
        r = FakeReader(); r.last_main_sha = "c" * 40
        self.blocked("STALE_MAIN_SHA", reader=r)
        r = FakeReader(); r.last_head_sha = "c" * 40
        self.blocked("STALE_HEAD_SHA", reader=r)
        r = FakeReader(); r.last_pr = pr(); r.last_pr["head"]["sha"] = "c" * 40
        self.blocked("STALE_PR_SNAPSHOT", reader=r)

    def test_changed_file_list_incomplete(self):
        r = FakeReader(); r.pr["changed_files"] = 2
        self.blocked("INCOMPLETE_FILE_LIST", reader=r)
        r = FakeReader(); r.files = []
        self.blocked("INCOMPLETE_FILE_LIST", reader=r)

    def test_changed_file_rename_requires_origin(self):
        r = FakeReader(); r.files[0]["status"] = "renamed"
        self.blocked("INVALID_PREVIOUS_FILENAME", reader=r)
        r.files[0]["previous_filename"] = "src/core.js"
        snap = build(r)
        self.assertEqual(snap["changes"][0]["previous_filename"], "src/core.js")

    def test_reject_duplicate_changed_file(self):
        r = FakeReader(); r.files.append(dict(r.files[0])); r.pr["changed_files"] = 2
        self.blocked("INVALID_FILE_LIST", reader=r)

    def test_open_pr_list_missing_self(self):
        r = FakeReader(); r.open_prs = []
        self.blocked("CURRENT_PR_MISSING_FROM_OPEN_LIST", reader=r)

    def test_open_pr_list_duplicate_ids(self):
        r = FakeReader(); r.open_prs.append(summary())
        self.blocked("INVALID_OPEN_PR_LIST", reader=r)

    def test_duplicate_branch_evidence_preserved(self):
        r = FakeReader(); r.open_prs.append(summary(17))
        snap = build(r)
        self.assertEqual(len(snap["open_pull_requests"]), 2)
        self.assertEqual(snap["current_pr_number"], 13)

    def test_pr_state_and_head_repo(self):
        r = FakeReader(); r.pr["draft"] = False
        self.blocked("PR_NOT_OPEN_DRAFT", reader=r)
        r = FakeReader(); r.pr["head"]["repo"]["full_name"] = "external/Wall"
        self.blocked("HEAD_REPO_MISMATCH", reader=r)

    def test_path_safety_and_allowlist(self):
        for path in ["../core.js", "src//core.js", "src\\core.js", "/tmp/file", "a/./b", "docs/space file.md"]:
            with self.subTest(path=path):
                self.assertFalse(safe_path(path))
                self.blocked("INVALID_ALLOWLIST_PATH", allow=[path])
        self.blocked("INVALID_ALLOWLIST_PATH", allow=["x.js", "x.js"])

    def test_full_page_without_link_probes_more(self):
        class PageReader(GithubReader):
            def __init__(self):
                self.page_calls = []
            def get_json(self, path):
                self.page_calls.append(path)
                if path.endswith("&page=1"):
                    return [{"n": i} for i in range(PAGE_SIZE)], ""
                return [{"n": 100}], ""
        r = PageReader()
        result = r.all_pages("/pulls")
        self.assertEqual(len(result), 101)
        self.assertEqual(len(r.page_calls), 2)

    def test_paginated_next_link(self):
        class PageReader(GithubReader):
            def get_json(self, path):
                if path.endswith("&page=1"):
                    return [{"n": 1}], '<https://api.github.com/next>; rel="next"'
                return [{"n": 2}], ""
        self.assertEqual(len(PageReader().all_pages("/pulls")), 2)

    def test_fail_closed_when_pagination_never_ends(self):
        class Endless(GithubReader):
            def get_json(self, path):
                return [{"n": i} for i in range(PAGE_SIZE)], '<x>; rel="next"'
        with self.assertRaises(EvidenceError) as c:
            Endless().all_pages("/pulls")
        self.assertIn(str(c.exception), ["COLLECTION_TOO_LARGE", "PAGINATION_LIMIT_EXCEEDED"])

    def test_malformed_list_cannot_succeed(self):
        class Bad(GithubReader):
            def get_json(self, path):
                return {"error": "truncated"}, ""
        with self.assertRaisesRegex(EvidenceError, "INVALID_PAGE_RESPONSE"):
            Bad().all_pages("/pulls")

    def test_no_network_or_writes_during_fake_tests(self):
        with patch("rt_orch_evidence.urlopen", side_effect=AssertionError("network attempt")):
            self.assertTrue(build(FakeReader())["collector"]["pagination_exhausted"])


if __name__ == "__main__":
    unittest.main()
