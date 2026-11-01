"""RT-ORCH-04-C: experimental, fail-closed A+B integration.

This script is a PROTOTYPE. --allow is caller-supplied and NOT an authenticated
Issue authorization. No safe production gate until policy comes from a trusted
base-branch configuration and the check becomes required in GitHub rulesets.
Read-only GitHub REST GET; no merge/push/deploy operations.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

from rt_orch_evidence import GithubReader, collect, EvidenceError
from rt_orch_gate import evaluate


def check(reader, pr_number, expected_base_sha, expected_head_sha, allowed_paths):
    """Capture live GitHub data, then evaluate the entire snapshot; fail closed."""
    evidence = collect(reader, pr_number, expected_base_sha, expected_head_sha, allowed_paths)
    return evaluate(evidence), evidence


def main(argv=None):
    parser = argparse.ArgumentParser(description="Experimental RT-ORCH-04-C live safety gate")
    parser.add_argument("--pr", required=True, type=int)
    parser.add_argument("--base-sha", required=True)
    parser.add_argument("--head-sha", required=True)
    parser.add_argument("--allow", required=True, action="append")
    args = parser.parse_args(argv)
    try:
        errors, evidence = check(
            GithubReader(os.environ.get("GITHUB_TOKEN")),
            args.pr, args.base_sha, args.head_sha, args.allow,
        )
    except (EvidenceError, KeyError, TypeError, AttributeError, ValueError, OSError) as exc:
        reason = str(exc) if isinstance(exc, EvidenceError) else "INVALID_EVIDENCE"
        print(json.dumps({"verdict": "BLOCKED", "reasons": [reason]}), flush=True)
        return 2
    result = {"verdict": "PASS" if not errors else "BLOCKED",
              "reasons": errors, "pr": args.pr,
              "base_sha": evidence["base_sha"], "head_sha": evidence["head_sha"],
              "changed_files": len(evidence["changes"])}
    print(json.dumps(result, sort_keys=True), flush=True)
    return 2 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
