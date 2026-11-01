"""RT-ORCH-04-B: read-only GitHub API evidence collector for RT-ORCH-04-A.

Prototype only. Nothing is added to CI/rulesets. An authenticated, trusted execution
environment and an authorized issue-to-allowlist binding are still required.

Usage:
  python3 verify/rt_orch_evidence.py --pr 13 \
    --base-sha <40-hex> --head-sha <40-hex> \
    --allow verify/rt_orch_gate.py --allow verify/test_rt_orch_gate.py

Prints a JSON evidence snapshot on success; exits 2 on missing, stale, malformed,
truncated, or unverifiable GitHub data. Does not write to GitHub or disk.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

REPOSITORY = "psg0987/Wall"
API = "https://api.github.com/repos/psg0987/Wall"
SHA = re.compile(r"^[0-9a-fA-F]{40}$")
SEGMENT = re.compile(r"^[A-Za-z0-9_.-]+$")
MAX_FILES = 3000
PAGE_SIZE = 100
MAX_PAGES = 31  # fail closed on unexpectedly long collections
MAX_RESPONSE_BYTES = 4 * 1024 * 1024


class EvidenceError(Exception):
    """Unsafe or incomplete snapshot; never treated as success."""


def require(condition: bool, code: str):
    if not condition:
        raise EvidenceError(code)


def safe_path(path):
    return (isinstance(path, str) and bool(path)
            and not path.startswith("/") and "\\" not in path
            and all(p not in ("", ".", "..") and SEGMENT.fullmatch(p)
                    for p in path.split("/")))


def sha40(value):
    return isinstance(value, str) and SHA.fullmatch(value) is not None


class GithubReader:
    """Transport is narrowly scoped to fixed public GitHub REST repo endpoints."""

    def __init__(self, token=None):
        self.token = token or None

    def get_json(self, path):
        require(isinstance(path, str) and path.startswith("/") and not path.startswith("//"), "INVALID_API_PATH")
        req = Request(API + path, headers={
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "rt-orch-04b-readonly",
            **({"Authorization": "Bearer " + self.token} if self.token else {}),
        }, method="GET")
        try:
            with urlopen(req, timeout=15) as resp:
                require(resp.status == 200, "API_RESPONSE_NOT_200")
                raw = resp.read(MAX_RESPONSE_BYTES + 1)
                require(len(raw) <= MAX_RESPONSE_BYTES, "OVERSIZE_RESPONSE")
                value = json.loads(raw.decode("utf-8"))
                link = resp.headers.get("Link", "")
                return value, link
        except (HTTPError, URLError, TimeoutError, OSError, ValueError, UnicodeError) as exc:
            # Never print URL, response body, auth token, or user-supplied data.
            raise EvidenceError("API_READ_FAILED") from exc

    def object(self, path):
        result, _ = self.get_json(path)
        require(isinstance(result, dict), "INVALID_API_OBJECT")
        return result

    def all_pages(self, path):
        require("?" not in path and path.startswith("/"), "INVALID_PAGE_PATH")
        items = []
        for page in range(1, MAX_PAGES + 1):
            data, link = self.get_json(path + f"?per_page={PAGE_SIZE}&page={page}")
            require(isinstance(data, list) and len(data) <= PAGE_SIZE, "INVALID_PAGE_RESPONSE")
            require(all(isinstance(x, dict) for x in data), "INVALID_PAGE_ITEM")
            items.extend(data)
            require(len(items) <= MAX_FILES, "COLLECTION_TOO_LARGE")
            next_link = 'rel="next"' in link
            require(not (next_link and len(data) == 0), "EMPTY_PAGE_WITH_NEXT")
            # Full page without Link: probe one more page instead of silently
            # assuming the first 100 entries represent the complete list.
            if not next_link and len(data) < PAGE_SIZE:
                return items
        raise EvidenceError("PAGINATION_LIMIT_EXCEEDED")


def pr_fingerprint(pr):
    require(isinstance(pr, dict), "INVALID_PR")
    require(isinstance(pr.get("head"), dict) and isinstance(pr.get("base"), dict), "INVALID_PR_REFS")
    return (pr.get("number"), pr.get("state"), pr.get("draft"),
            pr["head"].get("sha"), pr["head"].get("ref"),
            pr["base"].get("sha"), pr["base"].get("ref"),
            pr.get("changed_files"), pr.get("updated_at"))


def collect(reader, pr_number, expected_base_sha, expected_head_sha, allowed_paths):
    """Read PR/files/open PRs and re-read refs. Never silently allow partial data."""
    require(type(pr_number) is int and pr_number > 0, "INVALID_PR_NUMBER")
    require(sha40(expected_base_sha) and sha40(expected_head_sha), "INVALID_EXPECTED_SHA")
    require(isinstance(allowed_paths, list) and 1 <= len(allowed_paths) <= 6,
            "INVALID_ALLOWLIST")
    require(all(safe_path(x) for x in allowed_paths) and len(set(allowed_paths)) == len(allowed_paths),
            "INVALID_ALLOWLIST_PATH")
    pr = reader.object(f"/pulls/{pr_number}")
    first = pr_fingerprint(pr)
    require(pr.get("number") == pr_number and pr.get("state") == "open" and pr.get("draft") is True,
            "PR_NOT_OPEN_DRAFT")
    require(pr["base"].get("ref") == "main" and pr["base"].get("repo", {}).get("full_name") == REPOSITORY,
            "PR_BASE_MISMATCH")
    require(pr["head"].get("repo") is not None and pr["head"]["repo"].get("full_name") == REPOSITORY,
            "HEAD_REPO_MISMATCH")
    branch = pr["head"].get("ref")
    require(safe_path(branch) and branch.startswith("exp/"), "UNSAFE_HEAD_BRANCH")
    require(sha40(pr["head"].get("sha")) and sha40(pr["base"].get("sha")), "INVALID_PR_SHA")
    require(pr["head"]["sha"].lower() == expected_head_sha.lower(), "HEAD_SHA_MISMATCH")
    require(pr["base"]["sha"].lower() == expected_base_sha.lower(), "BASE_SHA_MISMATCH")
    nfiles = pr.get("changed_files")
    require(type(nfiles) is int and 1 <= nfiles <= MAX_FILES, "INVALID_CHANGED_FILES_COUNT")

    branch_path = "/git/ref/heads/" + quote(branch, safe="/")
    main_path = "/git/ref/heads/main"
    main_initial = reader.object(main_path)
    branch_initial = reader.object(branch_path)
    require(main_initial.get("object", {}).get("sha") == expected_base_sha,
            "CURRENT_MAIN_SHA_MISMATCH")
    require(branch_initial.get("object", {}).get("sha") == expected_head_sha,
            "CURRENT_BRANCH_SHA_MISMATCH")

    files = reader.all_pages(f"/pulls/{pr_number}/files")
    require(len(files) == nfiles, "INCOMPLETE_FILE_LIST")
    names = [f.get("filename") for f in files]
    require(all(safe_path(n) for n in names) and len(set(names)) == len(names), "INVALID_FILE_LIST")
    changes = []
    for file in files:
        status = file.get("status")
        require(isinstance(status, str), "INVALID_FILE_STATUS")
        item = {"filename": file["filename"], "status": status}
        if status in ("renamed", "copied"):
            old = file.get("previous_filename")
            require(safe_path(old), "INVALID_PREVIOUS_FILENAME")
            item["previous_filename"] = old
        changes.append(item)

    open_prs = reader.all_pages("/pulls")
    numbers = [p.get("number") for p in open_prs]
    require(all(type(n) is int and n > 0 for n in numbers) and len(set(numbers)) == len(numbers),
            "INVALID_OPEN_PR_LIST")
    require(pr_number in numbers, "CURRENT_PR_MISSING_FROM_OPEN_LIST")
    summaries = []
    for item in open_prs:
        require(item.get("state") == "open" and isinstance(item.get("head"), dict),
                "INVALID_OPEN_PR")
        hr = item["head"].get("repo")
        require(isinstance(hr, dict) and isinstance(hr.get("full_name"), str)
                and isinstance(item["head"].get("ref"), str), "INVALID_OPEN_PR_HEAD")
        summaries.append({"number": item["number"], "state": "open", "head": {
            "ref": item["head"]["ref"], "repo": {"full_name": hr["full_name"]}}})

    end_pr = reader.object(f"/pulls/{pr_number}")
    require(pr_fingerprint(end_pr) == first, "STALE_PR_SNAPSHOT")
    require(reader.object(main_path).get("object", {}).get("sha") == expected_base_sha,
            "STALE_MAIN_SHA")
    require(reader.object(branch_path).get("object", {}).get("sha") == expected_head_sha,
            "STALE_HEAD_SHA")

    return {
        "repository": REPOSITORY,
        "base_ref": "main", "base_sha": pr["base"]["sha"],
        "expected_base_sha": expected_base_sha,
        "head_sha": pr["head"]["sha"], "expected_head_sha": expected_head_sha,
        "branch": branch,
        "allowed_paths": allowed_paths, "changes": changes,
        "pr_list_complete": True, "open_pull_requests": summaries,
        "current_pr_number": pr_number,
        "collector": {"version": "RT-ORCH-04-B-v1", "api": "GitHub REST", "two_pass_ref_check": True,
                      "pagination_exhausted": True, "snapshot_is_not_transactional": True,
                      "authorization_scope_unverified": True},
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description="Read-only RT-ORCH-04-B evidence collector")
    parser.add_argument("--pr", required=True, type=int)
    parser.add_argument("--base-sha", required=True)
    parser.add_argument("--head-sha", required=True)
    parser.add_argument("--allow", required=True, action="append")
    args = parser.parse_args(argv)
    try:
        evidence = collect(GithubReader(os.environ.get("GITHUB_TOKEN")), args.pr,
                           args.base_sha, args.head_sha, args.allow)
    except (EvidenceError, KeyError, TypeError, AttributeError) as exc:
        code = str(exc) if isinstance(exc, EvidenceError) else "MALFORMED_API_DATA"
        print(json.dumps({"verdict": "BLOCKED", "reason": code}), file=sys.stderr)
        return 2
    print(json.dumps(evidence, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
