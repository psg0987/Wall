"""RT-ORCH-07-FEEDBACK-01: side-effect-free feedback handoff simulator.

No network requests, repository writes, PR edits, or automation dispatch.
A valid candidate is NOT user authorization or proof of review provenance.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

SHA40 = re.compile(r"^[0-9a-f]{40}$")
D0_DOC = re.compile(r"^docs/[A-Za-z0-9_-]+\.md$")
WORK_ID = re.compile(r"^RT-ORCH-[A-Z0-9-]{2,70}$")
CODE = re.compile(r"^[A-Z][A-Z0-9_]{2,70}$")
MAX_REPAIRS = 2


def valid_sha(value):
    return isinstance(value, str) and SHA40.fullmatch(value) is not None


def inspect(pr, authorization, review, ci, history):
    """Validate a *supplied* snapshot and return reason codes.

    The caller-supplied authorization and review objects are NOT authenticated.
    Even a CANDIDATE result MUST NOT start Claude or modify GitHub.
    """
    if not all(isinstance(x, dict) for x in
               (pr, authorization, review, ci, history)):
        return {"verdict": "BLOCKED", "reasons": ["INVALID_INPUT"]}

    reasons = []
    add = reasons.append
    if pr.get("repository") != "psg0987/Wall":
        add("WRONG_REPOSITORY")
    if pr.get("state") != "open" or pr.get("draft") is not True:
        add("PR_NOT_OPEN_DRAFT")
    number = pr.get("number")
    base, head = pr.get("base_sha"), pr.get("head_sha")
    if type(number) is not int or number <= 0:
        add("INVALID_PR_NUMBER")
    if not valid_sha(base) or not valid_sha(head) or base == head:
        add("INVALID_SHA")
    work_id = authorization.get("work_id")
    if not isinstance(work_id, str) or not WORK_ID.fullmatch(work_id):
        add("INVALID_WORK_ID")
    if (authorization.get("repository") != pr.get("repository")
            or authorization.get("pr_number") != number
            or authorization.get("base_sha") != base):
        add("APPROVAL_SNAPSHOT_MISMATCH")
    allowed = authorization.get("allowed_paths")
    if (not isinstance(allowed, list) or len(allowed) != 1
            or not isinstance(allowed[0], str)
            or D0_DOC.fullmatch(allowed[0]) is None):
        add("UNSAFE_APPROVAL_SCOPE")
    changed = pr.get("changed_paths")
    if (not isinstance(changed, list) or len(changed) != 1
            or not all(isinstance(x, str) for x in changed)
            or not isinstance(allowed, list) or changed != allowed):
        add("CHANGESET_NOT_APPROVED")
    if (review.get("reviewer") != "gpt-work"
            or review.get("work_id") != work_id
            or review.get("pr_number") != number
            or review.get("reviewed_sha") != head):
        add("REVIEW_STALE_OR_WRONG_SOURCE")
    status = review.get("status")
    if status != "CHANGES_REQUESTED":
        add("NO_ACTIONABLE_REVIEW")
    findings = review.get("findings")
    if not isinstance(findings, list) or not (1 <= len(findings) <= 5):
        add("INVALID_FINDINGS")
    else:
        for finding in findings:
            if (not isinstance(finding, dict)
                    or finding.get("severity") not in ("P1", "P2")
                    or not isinstance(finding.get("code"), str)
                    or not CODE.fullmatch(finding["code"])
                    or not isinstance(allowed, list)
                    or finding.get("path") not in allowed):
                add("UNSAFE_FINDING")
                break
    if (ci.get("pr_number") != number or ci.get("tested_head") != head
            or ci.get("status") not in ("PASS", "FAIL", "PENDING")):
        add("CI_EVIDENCE_MISMATCH")
    if type(history.get("completed_repairs")) is not int:
        add("INVALID_REPAIR_HISTORY")
    elif history["completed_repairs"] >= MAX_REPAIRS or history["completed_repairs"] < 0:
        add("RETRY_LIMIT_REACHED")
    seen = history.get("reviewed_heads")
    if not isinstance(seen, list) or not all(valid_sha(s) for s in seen):
        add("INVALID_DEDUP_HISTORY")
    elif head in seen:
        add("DUPLICATE_HEAD")

    if reasons:
        return {"verdict": "BLOCKED", "reasons": sorted(set(reasons)),
                "authorization": "NOT_VERIFIED"}
    return {
        "verdict": "CANDIDATE_ONLY",
        "reasons": ["OWNER_APPROVAL_PROVENANCE_UNVERIFIED",
                    "GPT_REVIEW_PROVENANCE_UNVERIFIED",
                    "NO_CLAUDE_REPAIR_TRIGGER_CONNECTED"],
        "work_id": work_id,
        "pr_number": number,
        "reviewed_head": head,
        "next_attempt": history["completed_repairs"] + 1,
        "authorization": "NOT_VERIFIED",
        "may_dispatch": False,
    }


def main(args):
    if len(args) != 6:
        print("usage: feedback_contract.py pr.json approval.json review.json ci.json history.json",
              file=sys.stderr)
        return 2
    try:
        values = [json.loads(Path(p).read_text(encoding="utf-8")) for p in args[1:]]
        result = inspect(*values)
    except (OSError, ValueError, UnicodeError, TypeError):
        result = {"verdict": "BLOCKED", "reasons": ["INPUT_READ_ERROR"],
                  "authorization": "NOT_VERIFIED"}
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0 if result["verdict"] == "CANDIDATE_ONLY" else 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
