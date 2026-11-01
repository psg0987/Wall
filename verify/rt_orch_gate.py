"""RT-ORCH-04-A: fail-closed, OFFLINE review of a captured PR evidence snapshot.

Run: python3 verify/rt_orch_gate.py evidence.json
Exit 0: snapshot satisfies policy; exit 2: blocked/missing/invalid evidence.

SECURITY BOUNDARY: A supplied JSON snapshot is NOT independently authenticated.
An upstream trusted reader must capture complete PR/changed-file lists and SHA values
from GitHub. This prototype is NOT attached to CI or a merge protection rule.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import PurePosixPath
from typing import Any

SHA = re.compile(r"^[0-9a-fA-F]{40}$")
SEGMENT = re.compile(r"^[A-Za-z0-9_.-]+$")
ALLOWED_STATUSES = frozenset({"added", "modified", "removed", "renamed", "copied", "changed"})
BLOCKED_FILES = frozenset({"tests/golden.json", "index.html", ".gitmodules", ".github/CODEOWNERS"})
BLOCKED_DIRS = (".github/workflows/", "android/", "build/", "native/")


def safe_path(path: Any) -> bool:
    """Only exact, unambiguous repository-relative POSIX paths are accepted."""
    return (
        isinstance(path, str)
        and bool(path)
        and not path.startswith("/")
        and "\\" not in path
        and "\x00" not in path
        and all(seg not in ("", ".", "..") and SEGMENT.fullmatch(seg) for seg in path.split("/"))
        and str(PurePosixPath(path)) == path
    )


def protected(path: str) -> bool:
    return path in BLOCKED_FILES or any(path.startswith(d) for d in BLOCKED_DIRS)


def evaluate(evidence: Any) -> list[str]:
    """Return blocking reason codes. No filesystem/network/write operations."""
    errors: list[str] = []
    if not isinstance(evidence, dict):
        return ["INVALID_EVIDENCE"]

    repo = evidence.get("repository")
    if repo != "psg0987/Wall":
        errors.append("REPO_MISMATCH")
    if evidence.get("base_ref") != "main":
        errors.append("BASE_REF_MISMATCH")

    for field in ("base_sha", "expected_base_sha", "head_sha", "expected_head_sha"):
        if not isinstance(evidence.get(field), str) or not SHA.fullmatch(evidence[field]):
            errors.append("INVALID_SHA:" + field)
    if not any(x.startswith("INVALID_SHA:") for x in errors):
        if evidence["base_sha"].lower() != evidence["expected_base_sha"].lower():
            errors.append("BASE_SHA_MISMATCH")
        if evidence["head_sha"].lower() != evidence["expected_head_sha"].lower():
            errors.append("HEAD_SHA_MISMATCH")
        if evidence["head_sha"].lower() == evidence["base_sha"].lower():
            errors.append("EMPTY_COMMIT_RANGE")

    branch = evidence.get("branch")
    if not isinstance(branch, str) or not branch.startswith("exp/") or not safe_path(branch):
        errors.append("INVALID_EXPERIMENT_BRANCH")

    allow = evidence.get("allowed_paths")
    if not isinstance(allow, list) or not 1 <= len(allow) <= 6:
        errors.append("INVALID_ALLOWLIST")
        allow_set: set[str] = set()
    else:
        allow_set = set()
        for path in allow:
            if not safe_path(path):
                errors.append("UNSAFE_ALLOWED_PATH")
                continue
            if path in allow_set:
                errors.append("DUPLICATE_ALLOWED_PATH")
            allow_set.add(path)
            if protected(path):
                errors.append("PROTECTED_ALLOWED_PATH:" + path)

    changes = evidence.get("changes")
    if not isinstance(changes, list) or not 1 <= len(changes) <= 12:
        errors.append("INVALID_CHANGESET")
    else:
        seen = set()
        for change in changes:
            if (not isinstance(change, dict) or not isinstance(change.get("status"), str)
                    or change["status"] not in ALLOWED_STATUSES):
                errors.append("INVALID_CHANGE_ENTRY")
                continue
            new_path = change.get("filename")
            old_path = change.get("previous_filename")
            paths = [new_path]
            if change["status"] in ("renamed", "copied"):
                if old_path is None:
                    errors.append("MISSING_PREVIOUS_PATH")
                else:
                    paths.append(old_path)
            elif old_path is not None:
                errors.append("UNEXPECTED_PREVIOUS_PATH")
            for path in paths:
                if not safe_path(path):
                    errors.append("UNSAFE_CHANGED_PATH")
                    continue
                if protected(path):
                    errors.append("PROTECTED_FILE_CHANGE:" + path)
                if path not in allow_set:
                    errors.append("OUTSIDE_ALLOWLIST:" + path)
            if isinstance(new_path, str):
                if new_path in seen:
                    errors.append("DUPLICATE_CHANGE_ENTRY:" + new_path)
                seen.add(new_path)

    # A partial or absent PR list is a blocker. A JSON boolean is only a claim;
    # completeness and freshness MUST be established by the upstream reader.
    if evidence.get("pr_list_complete") is not True:
        errors.append("PR_LIST_UNVERIFIED")
    prs = evidence.get("open_pull_requests")
    if not isinstance(prs, list):
        errors.append("INVALID_PR_LIST")
    else:
        current_pr = evidence.get("current_pr_number")
        if current_pr is not None and (type(current_pr) is not int or current_pr <= 0):
            errors.append("INVALID_CURRENT_PR")
        for pr in prs:
            if not isinstance(pr, dict) or type(pr.get("number")) is not int or pr["number"] <= 0:
                errors.append("INVALID_PR_ENTRY")
                continue
            head = pr.get("head")
            if pr.get("state") != "open" or not isinstance(head, dict):
                errors.append("INVALID_PR_ENTRY")
                continue
            pr_repo = head.get("repo")
            if not isinstance(pr_repo, dict) or not isinstance(pr_repo.get("full_name"), str) or not isinstance(head.get("ref"), str):
                errors.append("INVALID_PR_ENTRY")
                continue
            if (
                head["ref"] == branch
                and pr_repo["full_name"].lower() == "psg0987/wall"
                and pr["number"] != current_pr
            ):
                errors.append("DUPLICATE_OPEN_PR:" + str(pr["number"]))

    return sorted(set(errors))


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("Usage: python3 verify/rt_orch_gate.py evidence.json", file=sys.stderr)
        return 2
    try:
        with open(argv[1], encoding="utf-8") as f:
            evidence = json.load(f)
        errors = evaluate(evidence)
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError, TypeError) as exc:
        print(json.dumps({"verdict": "BLOCKED", "reasons": ["EVIDENCE_READ_ERROR"], "detail": str(exc)}, ensure_ascii=False))
        return 2
    print(json.dumps({"verdict": "PASS" if not errors else "BLOCKED", "reasons": errors}, ensure_ascii=False))
    return 2 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
