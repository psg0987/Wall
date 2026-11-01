"""RT-ORCH-04-C-R2 candidate: base-owned approval manifest, read-only PR audit.

SECURITY: ONLY run this file from trusted BASE branch with pull_request_target.
Never checkout or execute a PR HEAD, and never give the PR an --allow override.
This draft is NOT a required status check and is NOT production-enforced.

Approvals are stored at verify/rt-orch-approved-prs.json in an immutable base
commit. The current production main has no such manifest: fail closed.
"""
from __future__ import annotations

import argparse
import base64
import binascii
import json
import os
import re
import sys

from rt_orch_ci_gate import check
from rt_orch_evidence import EvidenceError, GithubReader, REPOSITORY, sha40
from rt_orch_gate import protected, safe_path

MANIFEST_PATH = "verify/rt-orch-approved-prs.json"
MAX_POLICY_BYTES = 65536

# C1 is intentionally narrower than the generic offline A gate. Never allow
# a C1 approved PR to edit its verifier, approval manifest, CI definitions,
# financial engine, build infrastructure, or test harness.
C1_UI_FILES = frozenset({"src/ui1.js", "src/ui2.js"})
C1_TEST_FILE = re.compile(r"^tests/t[a-zA-Z0-9_]+\.js$")


def c1_safe_path(path):
    if not safe_path(path) or protected(path):
        return False
    if path in C1_UI_FILES:
        return True
    if isinstance(path, str) and C1_TEST_FILE.fullmatch(path):
        return path not in {"tests/t_golden.js"}
    return False



def ensure(condition, reason):
    if not condition:
        raise EvidenceError(reason)


def approved_entry(reader, base_sha, pr_number, head_sha):
    """Return one approval pinned to the trusted base SHA, never to the PR tree."""
    ensure(sha40(base_sha) and sha40(head_sha), "INVALID_TRUSTED_SHA")
    ensure(type(pr_number) is int and pr_number > 0, "INVALID_TRUSTED_PR")
    current_main = reader.object("/git/ref/heads/main")
    ensure(current_main.get("object", {}).get("sha") == base_sha,
           "STALE_TRUSTED_BASE")
    # GitHub REST contents by immutable COMMIT SHA. Not HEAD, not PR files.
    obj = reader.object("/contents/" + MANIFEST_PATH + "?ref=" + base_sha)
    ensure(obj.get("type") == "file" and obj.get("path") == MANIFEST_PATH
           and obj.get("encoding") == "base64" and isinstance(obj.get("content"), str),
           "INVALID_TRUSTED_MANIFEST")
    try:
        encoded = obj["content"].replace("\n", "")
        raw = base64.b64decode(encoded, validate=True)
        ensure(len(raw) <= MAX_POLICY_BYTES, "TRUSTED_MANIFEST_TOO_LARGE")
        policy = json.loads(raw.decode("utf-8"))
    except (ValueError, UnicodeError, binascii.Error) as exc:
        raise EvidenceError("INVALID_TRUSTED_MANIFEST") from exc
    ensure(isinstance(policy, dict)
           and policy.get("schema_version") == 1
           and policy.get("repository") == REPOSITORY
           and isinstance(policy.get("approvals"), list),
           "INVALID_TRUSTED_MANIFEST")
    approvals = policy["approvals"]
    ensure(len(approvals) <= 100 and all(isinstance(x, dict) for x in approvals),
           "INVALID_TRUSTED_APPROVALS")
    numbers = [x.get("pr_number") for x in approvals]
    ensure(all(type(n) is int and n > 0 for n in numbers)
           and len(numbers) == len(set(numbers)), "DUPLICATE_OR_INVALID_APPROVALS")
    matches = [x for x in approvals if x["pr_number"] == pr_number]
    ensure(len(matches) == 1, "APPROVAL_MISSING")
    entry = matches[0]
    ensure(entry.get("risk_class") == "C1"
           and type(entry.get("issue_number")) is int and entry["issue_number"] > 0
           and entry.get("head_sha") == head_sha
           and isinstance(entry.get("branch"), str)
           and entry["branch"].startswith("exp/"),
           "APPROVAL_SCOPE_MISMATCH")
    paths = entry.get("allowed_paths")
    ensure(isinstance(paths, list) and 1 <= len(paths) <= 6
           and all(c1_safe_path(p) for p in paths)
           and len(set(paths)) == len(paths),
           "UNSAFE_APPROVED_PATHS")
    return entry


def review(reader, pr_number, base_sha, head_sha):
    """Use only base-pinned approval plus fresh GitHub REST evidence."""
    entry = approved_entry(reader, base_sha, pr_number, head_sha)
    errors, evidence = check(reader, pr_number, base_sha, head_sha, entry["allowed_paths"])
    ensure(not errors, "SCOPE_BLOCKED:" + ",".join(errors))
    ensure(evidence.get("branch") == entry["branch"], "APPROVED_BRANCH_MISMATCH")
    # The collector checks PR/main/head refs before and after the REST reads.
    return {
        "verdict": "PASS",
        "pr": pr_number,
        "head_sha": head_sha,
        "base_sha": base_sha,
        "approved_issue": entry["issue_number"],
        "changed_files": len(evidence["changes"]),
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description="Trusted base-source gate candidate")
    parser.add_argument("--pr", required=True, type=int)
    parser.add_argument("--base-sha", required=True)
    parser.add_argument("--head-sha", required=True)
    args = parser.parse_args(argv)
    try:
        result = review(GithubReader(os.environ.get("GITHUB_TOKEN")),
                        args.pr, args.base_sha, args.head_sha)
    except (EvidenceError, KeyError, AttributeError, TypeError, ValueError, OSError) as exc:
        reason = str(exc) if isinstance(exc, EvidenceError) else "INVALID_TRUSTED_EVIDENCE"
        print(json.dumps({"verdict": "BLOCKED", "reasons": [reason]}))
        return 2
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
