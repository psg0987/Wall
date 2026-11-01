"""R4: offline, read-only audit of GitHub required-check evidence.

NOT a security gate. Supplied JSON is unauthenticated; even API-sourced data
cannot by itself demonstrate that GitHub enforced the ruleset against a merge.
Never use this output to authorize merging or code writing.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

SHA40 = re.compile(r"^[a-fA-F0-9]{40}$")
ACTION_JOB = re.compile(r"^https://github\.com/psg0987/Wall/actions/runs/([1-9][0-9]*)/job/([1-9][0-9]*)$")
EXPECTED_APP_ID = 15368
REQUIRED_GUARD = "rt-orch-trusted-guard"
EXPECTED_WORKFLOW = ".github/workflows/rt-orch-trusted-guard.yml"


def validate(ruleset, pr, check_runs, workflows):
    """Return immutable reason codes; an empty list is NOT approval to merge."""
    reasons = []
    if not isinstance(ruleset, dict) or ruleset.get("id") != 26300434:
        return ["RULESET_NOT_VERIFIED"]
    if (ruleset.get("enforcement") != "active"
            or "refs/heads/main" not in ruleset.get("conditions", {}).get("ref_name", {}).get("include", [])):
        reasons.append("RULESET_NOT_ACTIVE_FOR_MAIN")
    rules = ruleset.get("rules")
    if not isinstance(rules, list):
        return sorted(set(reasons + ["REQUIRED_CHECK_RULE_MISSING"]))
    status_rules = [r for r in rules if isinstance(r, dict) and r.get("type") == "required_status_checks"]
    if len(status_rules) != 1:
        return sorted(set(reasons + ["REQUIRED_CHECK_RULE_MISSING"]))
    p = status_rules[0].get("parameters")
    entries = p.get("required_status_checks") if isinstance(p, dict) else None
    if not isinstance(entries, list):
        return sorted(set(reasons + ["INVALID_REQUIRED_CHECKS"]))
    required = {}
    for entry in entries:
        if not isinstance(entry, dict) or not isinstance(entry.get("context"), str):
            reasons.append("INVALID_REQUIRED_CHECKS")
            continue
        name = entry["context"]
        if name in required:
            reasons.append("DUPLICATE_REQUIRED_CONTEXT")
        required[name] = entry.get("integration_id")
    for name in ("full-suite", REQUIRED_GUARD):
        if name not in required:
            reasons.append("MISSING_REQUIRED:" + name)
        elif required[name] != EXPECTED_APP_ID:
            reasons.append("UNEXPECTED_REQUIRED_APP:" + name)

    if not isinstance(pr, dict) or not isinstance(pr.get("head"), dict) or not isinstance(pr.get("base"), dict):
        return sorted(set(reasons + ["INVALID_PR"]))
    head_sha, base_sha = pr["head"].get("sha"), pr["base"].get("sha")
    if not isinstance(head_sha, str) or not SHA40.fullmatch(head_sha):
        reasons.append("INVALID_HEAD_SHA")
    if not isinstance(base_sha, str) or not SHA40.fullmatch(base_sha):
        reasons.append("INVALID_BASE_SHA")
    if pr.get("state") != "open" or pr["base"].get("ref") != "main":
        reasons.append("INVALID_PR_STATE")
    if not isinstance(check_runs, list):
        return sorted(set(reasons + ["INVALID_CHECK_LIST"]))
    if not isinstance(workflows, dict):
        return sorted(set(reasons + ["INVALID_WORKFLOW_EVIDENCE"]))

    for name in ("full-suite", REQUIRED_GUARD):
        runs = [x for x in check_runs if isinstance(x, dict) and x.get("name") == name]
        if not runs:
            reasons.append("CHECK_ABSENT:" + name)
            continue
        if len(runs) != 1:
            reasons.append("CHECK_DUPLICATE:" + name)
            continue
        c = runs[0]
        if c.get("head_sha") != head_sha:
            reasons.append("CHECK_WRONG_HEAD:" + name)
        if not isinstance(c.get("app"), dict) or c["app"].get("id") != EXPECTED_APP_ID:
            reasons.append("CHECK_UNTRUSTED_APP:" + name)
        if c.get("status") != "completed" or c.get("conclusion") != "success":
            reasons.append("CHECK_NOT_SUCCESS:" + name)

        details = c.get("details_url")
        match = ACTION_JOB.fullmatch(details) if isinstance(details, str) else None
        if not match or str(c.get("id")) != match.group(2):
            reasons.append("UNVERIFIED_RUN_LINK:" + name)
            continue
        run = workflows.get(match.group(1))
        if not isinstance(run, dict) or str(run.get("id")) != match.group(1):
            reasons.append("WORKFLOW_RUN_NOT_VERIFIED:" + name)
            continue
        if name == REQUIRED_GUARD:
            if run.get("path") != EXPECTED_WORKFLOW or run.get("event") != "pull_request_target":
                reasons.append("GUARD_WORKFLOW_SOURCE_MISMATCH")
            # A pull_request_target run generally uses BASE as run.head_sha.
            # Such a run cannot be assumed to satisfy a required HEAD check.
            if run.get("head_sha") != head_sha:
                reasons.append("GUARD_RUN_NOT_ON_PR_HEAD")
        else:
            if run.get("event") != "pull_request":
                reasons.append("FULL_SUITE_WRONG_EVENT")
        related = run.get("pull_requests")
        if not (isinstance(related, list)
                and any(isinstance(x, dict) and x.get("number") == pr.get("number")
                        for x in related)):
            reasons.append("RUN_PR_LINK_NOT_VERIFIED:" + name)
    return sorted(set(reasons))


def main(argv):
    if len(argv) != 5:
        print("usage: python rt_orch_r4_check_audit.py ruleset.json pr.json checks.json runs.json", file=sys.stderr)
        return 2
    try:
        objects = [json.loads(Path(path).read_text(encoding="utf-8")) for path in argv[1:]]
        checks = objects[2]
        if isinstance(checks, dict) and isinstance(checks.get("check_runs"), list):
            checks = checks["check_runs"]
        reasons = validate(objects[0], objects[1], checks, objects[3])
    except (OSError, UnicodeError, ValueError, TypeError, KeyError):
        reasons = ["EVIDENCE_READ_ERROR"]
    print(json.dumps({
        "verdict": "BLOCKED" if reasons else "CONSISTENT_SNAPSHOT_ONLY",
        "reasons": reasons,
        "does_not_authorize_merge": True,
    }, sort_keys=True))
    return 2 if reasons else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
