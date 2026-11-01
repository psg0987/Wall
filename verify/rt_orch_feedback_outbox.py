"""RT-ORCH-07-FEEDBACK-02 offline outbox planner; NO delivery side effects.

Input records are not authenticated by this module. A successful plan is NEVER
permission to start Claude, write GitHub, approve a PR, merge, or deploy.
"""
from __future__ import annotations

import hashlib
import json
import re

from rt_orch_feedback_contract import inspect, valid_sha

SAFE_CODE = re.compile(r"^[A-Z][A-Z0-9_]{2,70}$")
MAX_ITEMS = 5


def make_plan(pr, approval, review, ci, history, existing):
    """Return a canonical *unpublished* repair proposal or fail closed.

    The caller must separately authenticate every input's origin and freshness.
    No trust is gained from claim fields in JSON or GitHub comments.
    """
    if not isinstance(existing, list):
        return {"state": "BLOCKED", "reasons": ["INVALID_OUTBOX_LEDGER"],
                "may_publish": False, "may_dispatch": False}
    checked = inspect(pr, approval, review, ci, history)
    if checked.get("verdict") != "CANDIDATE_ONLY":
        return {"state": "BLOCKED", "reasons": checked.get("reasons", ["CONTRACT_FAILED"]),
                "may_publish": False, "may_dispatch": False}
    if ci.get("status") not in ("PASS", "FAIL"):
        return {"state": "BLOCKED", "reasons": ["CI_NOT_TERMINAL"],
                "may_publish": False, "may_dispatch": False}
    issue = approval.get("origin_issue_number")
    if type(issue) is not int or issue <= 0:
        return {"state": "BLOCKED", "reasons": ["ORIGIN_ISSUE_UNVERIFIED"],
                "may_publish": False, "may_dispatch": False}
    review_run = review.get("work_run_id")
    if not (isinstance(review_run, str) and
            re.fullmatch(r"[0-9a-f]{8}-[0-9a-f-]{27,35}", review_run)):
        return {"state": "BLOCKED", "reasons": ["REVIEW_RUN_ID_UNVERIFIED"],
                "may_publish": False, "may_dispatch": False}
    source = review.get("source_delivery")
    if source != "PRIVATE_WORK_RESULT":
        return {"state": "BLOCKED", "reasons": ["UNSUPPORTED_REVIEW_SOURCE"],
                "may_publish": False, "may_dispatch": False}
    findings = review.get("findings")
    if not (isinstance(findings, list) and 1 <= len(findings) <= MAX_ITEMS):
        return {"state": "BLOCKED", "reasons": ["INVALID_FINDINGS"],
                "may_publish": False, "may_dispatch": False}
    safe_findings = []
    for f in findings:
        if not (isinstance(f, dict) and f.get("severity") in ("P1", "P2")
                and isinstance(f.get("code"), str) and SAFE_CODE.fullmatch(f["code"])
                and isinstance(f.get("path"), str)
                and f["path"] in approval["allowed_paths"]):
            return {"state": "BLOCKED", "reasons": ["INVALID_FINDING_PAYLOAD"],
                    "may_publish": False, "may_dispatch": False}
        # Never copy untrusted text, suggested shell commands, or arbitrary URLs.
        safe_findings.append({"severity": f["severity"], "code": f["code"],
                              "path": f["path"]})
    safe_findings.sort(key=lambda f: (f["path"], f["code"], f["severity"]))
    if len({(f["path"], f["code"]) for f in safe_findings}) != len(safe_findings):
        return {"state": "BLOCKED", "reasons": ["DUPLICATE_FINDING"],
                "may_publish": False, "may_dispatch": False}
    key_src = (f"psg0987/Wall#{pr['number']}@{pr['head_sha']}:"
               f"{approval['work_id']}:repair:{checked['next_attempt']}")
    key = hashlib.sha256(key_src.encode("utf-8")).hexdigest()
    if not all(isinstance(x, dict) and isinstance(x.get("key"), str)
               and re.fullmatch(r"[0-9a-f]{64}", x["key"])
               and x.get("state") in ("STAGED", "DELIVERED", "ACKED", "STOPPED")
               for x in existing):
        return {"state": "BLOCKED", "reasons": ["INVALID_OUTBOX_LEDGER"],
                "may_publish": False, "may_dispatch": False}
    if any(x["key"] == key for x in existing):
        return {"state": "BLOCKED", "reasons": ["DUPLICATE_DELIVERY_KEY"],
                "may_publish": False, "may_dispatch": False}
    envelope = {
        "schema": "RT-ORCH-FEEDBACK-v1",
        "repository": "psg0987/Wall",
        "work_id": approval["work_id"],
        "origin_issue_number": issue,
        "pr_number": pr["number"],
        "base_sha": pr["base_sha"],
        "reviewed_head": pr["head_sha"],
        "work_run_id": review_run,
        "attempt": checked["next_attempt"],
        "allowed_paths": list(approval["allowed_paths"]),
        "findings": safe_findings,
        "delivery_key": key,
        "merge_approval": "USER_REQUIRED",
        "deploy_approval": "USER_REQUIRED",
    }
    return {
        "state": "STAGING_PROPOSAL_ONLY",
        "reasons": ["REVIEW_PROVENANCE_NOT_AUTHENTICATED",
                    "OWNER_APPROVAL_NOT_AUTHENTICATED",
                    "NO_CONNECTED_PUBLISHER_OR_CLAUDE_REPAIR_CONSUMER"],
        "envelope": envelope,
        "may_publish": False,
        "may_dispatch": False,
    }


def encode_plan(plan):
    """Stable JSON suitable for offline comparison; no network/filesystem writes."""
    return json.dumps(plan, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
