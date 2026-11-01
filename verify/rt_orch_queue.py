"""RT-ORCH-08-A: persistent, fail-closed OFFLINE queue simulator.

Never invokes Claude, GPT Work, GitHub, subprocesses or network requests.
SQLite is the *only* side effect. The status FINISHED means a simulated
claim was acknowledged, NOT that a PR was edited, reviewed or approved.

External approval and review origin are deliberately NOT authenticated by this
module. All responses set may_dispatch=False.
"""
from __future__ import annotations

import json
import re
import sqlite3
import uuid
from contextlib import contextmanager
from pathlib import Path

REPO = "psg0987/Wall"
SHA_RE = re.compile(r"[a-f0-9]{40}\Z")
TASK_RE = re.compile(r"RT-ORCH-[A-Z0-9-]{2,70}\Z")
EVENT_RE = re.compile(r"evt-[A-Za-z0-9_-]{4,116}\Z")
PATH_RE = re.compile(r"docs/[A-Za-z0-9_-]+\.md\Z")
MAX_REPAIRS = 2


class QueueBlocked(ValueError):
    """Safe refusal. The message is a stable reason code."""


def _valid_sha(value):
    return isinstance(value, str) and bool(SHA_RE.fullmatch(value))


def _validate(s):
    if not isinstance(s, dict):
        raise QueueBlocked("INVALID_TASK")
    required = ("task_id", "event_key", "repository", "pr_number",
                "base_sha", "head_sha", "allowed_path", "attempt")
    if any(k not in s for k in required):
        raise QueueBlocked("MISSING_FIELD")
    if (not isinstance(s["task_id"], str)
            or not TASK_RE.fullmatch(s["task_id"])):
        raise QueueBlocked("INVALID_TASK_ID")
    if (not isinstance(s["event_key"], str)
            or not EVENT_RE.fullmatch(s["event_key"])):
        raise QueueBlocked("INVALID_EVENT_KEY")
    if s["repository"] != REPO:
        raise QueueBlocked("REPOSITORY_DENIED")
    if (type(s["pr_number"]) is not int
            or not 1 <= s["pr_number"] <= 2**63 - 1):
        raise QueueBlocked("INVALID_PR")
    if not _valid_sha(s["base_sha"]) or not _valid_sha(s["head_sha"]):
        raise QueueBlocked("INVALID_SHA")
    if s["base_sha"] == s["head_sha"]:
        raise QueueBlocked("SAME_BASE_HEAD")
    if (not isinstance(s["allowed_path"], str)
            or not PATH_RE.fullmatch(s["allowed_path"])):
        raise QueueBlocked("SCOPE_DENIED")
    if (type(s["attempt"]) is not int
            or not 0 <= s["attempt"] <= MAX_REPAIRS):
        raise QueueBlocked("REPAIR_LIMIT")


def _result(status, **extra):
    return {"status": status, "may_dispatch": False,
            "approval_provenance": "UNVERIFIED", **extra}


class OfflineQueue:
    """An atomic and durable demonstration, not an authorization service."""

    def __init__(self, filename):
        self.path = str(Path(filename))
        # Preserve state across close/reopen. Must not share connection across threads.
        conn = self._connect()
        try:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS tasks (
                    seq INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_id TEXT NOT NULL UNIQUE,
                    event_key TEXT NOT NULL UNIQUE,
                    repository TEXT NOT NULL,
                    pr_number INTEGER NOT NULL,
                    base_sha TEXT NOT NULL,
                    head_sha TEXT NOT NULL,
                    allowed_path TEXT NOT NULL,
                    attempt INTEGER NOT NULL,
                    state TEXT NOT NULL CHECK(state IN
                      ('STAGED','CLAIMED','FINISHED','FAILED','BLOCKED_STALE','BLOCKED_CRASH')),
                    claim_token TEXT,
                    UNIQUE (pr_number, head_sha),
                    UNIQUE (pr_number, attempt)
                );
                CREATE UNIQUE INDEX IF NOT EXISTS one_claimed_task
                    ON tasks(state) WHERE state='CLAIMED';
                CREATE TABLE IF NOT EXISTS control (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                INSERT OR IGNORE INTO control(key, value) VALUES('halted','0');
            """)
        finally:
            conn.close()

    def _connect(self):
        conn = sqlite3.connect(self.path, isolation_level=None, timeout=5)
        conn.execute("PRAGMA busy_timeout=5000")
        return conn

    @contextmanager
    def _tx(self):
        conn = self._connect()
        try:
            conn.execute("BEGIN IMMEDIATE")
            yield conn
            conn.execute("COMMIT")
        except Exception:
            if conn.in_transaction:
                conn.execute("ROLLBACK")
            raise
        finally:
            conn.close()

    @staticmethod
    def _halted(conn):
        return conn.execute("SELECT value FROM control WHERE key='halted'").fetchone()[0] == '1'

    @staticmethod
    def _halt(conn):
        conn.execute("UPDATE control SET value='1' WHERE key='halted'")

    def stage(self, spec):
        """Queue an untrusted candidate; never treat JSON as owner approval."""
        _validate(spec)
        with self._tx() as conn:
            if self._halted(conn):
                raise QueueBlocked("QUEUE_HALTED")
            previous = conn.execute(
                "SELECT attempt,state FROM tasks WHERE pr_number=? ORDER BY attempt DESC LIMIT 1",
                (spec["pr_number"],)).fetchone()
            if previous is None:
                if spec["attempt"] != 0:
                    raise QueueBlocked("MISSING_PREVIOUS_ATTEMPT")
            elif previous[1] != 'FINISHED' or spec["attempt"] != previous[0] + 1:
                raise QueueBlocked("INVALID_ATTEMPT_TRANSITION")
            try:
                conn.execute("""INSERT INTO tasks
                    (task_id,event_key,repository,pr_number,base_sha,head_sha,allowed_path,attempt,state)
                    VALUES (?,?,?,?,?,?,?,?, 'STAGED')""",
                    tuple(spec[k] for k in (
                        "task_id", "event_key", "repository", "pr_number", "base_sha",
                        "head_sha", "allowed_path", "attempt")))
            except sqlite3.IntegrityError as exc:
                raise QueueBlocked("DUPLICATE_TASK_OR_HEAD_OR_EVENT") from exc
        return _result("STAGED_UNTRUSTED", task_id=spec["task_id"])

    def claim_for_simulation(self, worker):
        """Atomically claim at most one globally; never dispatch agents."""
        if not isinstance(worker, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,40}", worker):
            raise QueueBlocked("INVALID_WORKER")
        with self._tx() as conn:
            if self._halted(conn):
                return _result("QUEUE_HALTED")
            if conn.execute("SELECT 1 FROM tasks WHERE state='CLAIMED'").fetchone():
                return _result("BLOCKED_RUNNING")
            row = conn.execute("""SELECT task_id,pr_number,head_sha
                FROM tasks WHERE state='STAGED' ORDER BY seq LIMIT 1""").fetchone()
            if row is None:
                return _result("EMPTY")
            token = uuid.uuid4().hex
            conn.execute("UPDATE tasks SET state='CLAIMED',claim_token=? WHERE task_id=?",
                         (token, row[0]))
            return _result("SIMULATION_CLAIMED", task_id=row[0], pr_number=row[1],
                           head_sha=row[2], claim_token=token, worker=worker)

    def finish_simulation(self, task_id, token, observed_head, succeeded):
        """One-time acknowledgement; a stale HEAD freezes all future claims."""
        with self._tx() as conn:
            row = conn.execute("SELECT state,claim_token,head_sha FROM tasks WHERE task_id=?",
                               (task_id,)).fetchone()
            if row is None or row[0] != 'CLAIMED' or row[1] != token:
                raise QueueBlocked("INVALID_CLAIM_TOKEN_OR_STATE")
            if not _valid_sha(observed_head) or row[2] != observed_head:
                state = 'BLOCKED_STALE'
                self._halt(conn)
            elif succeeded is True:
                state = 'FINISHED'
            else:
                state = 'FAILED'
                self._halt(conn)
            conn.execute("UPDATE tasks SET state=?,claim_token=NULL WHERE task_id=?",
                         (state,task_id))
        return _result(state, task_id=task_id)

    def quarantine_interrupted_claims(self):
        """Manual safety check after a crash; NEVER silently rerun a claim."""
        with self._tx() as conn:
            n = conn.execute("UPDATE tasks SET state='BLOCKED_CRASH',claim_token=NULL WHERE state='CLAIMED'").rowcount
            if n:
                self._halt(conn)
        return _result("QUARANTINED", count=n)

    def snapshot(self):
        conn = self._connect()
        try:
            conn.execute("BEGIN")  # Both reads observe the same SQLite snapshot.
            rows=conn.execute("SELECT task_id,pr_number,head_sha,attempt,state FROM tasks ORDER BY seq").fetchall()
            halted=self._halted(conn)
            conn.execute("COMMIT")
        except Exception:
            if conn.in_transaction:
                conn.execute("ROLLBACK")
            raise
        finally:
            conn.close()
        return _result("SNAPSHOT", halted=halted,
                       tasks=[dict(zip(("task_id","pr_number","head_sha","attempt","state"),r)) for r in rows])


def main():
    """Safe offline commands; no execution or publishing operations exist."""
    import argparse
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("database")
    ap.add_argument("command",choices=("stage", "claim", "finish", "quarantine", "snapshot"))
    ap.add_argument("--input",help="task JSON filename (stage only)")
    ap.add_argument("--worker",default="offline")
    ap.add_argument("--task-id")
    ap.add_argument("--token")
    ap.add_argument("--observed-head")
    ap.add_argument("--fail",action="store_true")
    args=ap.parse_args()
    try:
        q=OfflineQueue(args.database)
        if args.command=="stage":
            if not args.input:
                raise QueueBlocked("MISSING_INPUT_FILE")
            output=q.stage(json.loads(Path(args.input).read_text(encoding="utf-8")))
        elif args.command=="claim":
            output=q.claim_for_simulation(args.worker)
        elif args.command=="finish":
            output=q.finish_simulation(args.task_id,args.token,args.observed_head,not args.fail)
        elif args.command=="quarantine":
            output=q.quarantine_interrupted_claims()
        else:
            output=q.snapshot()
    except QueueBlocked as exc:
        output=_result("BLOCKED", reason=str(exc))
    except sqlite3.OperationalError as exc:
        reason="DB_BUSY" if "locked" in str(exc).lower() or "busy" in str(exc).lower() else "STORAGE_ERROR"
        output=_result("BLOCKED", reason=reason)
    except (sqlite3.Error, ValueError, OSError, OverflowError):
        output=_result("BLOCKED", reason="INPUT_OR_STORAGE_ERROR")
    print(json.dumps(output,sort_keys=True,ensure_ascii=False))
    unsafe_status={"BLOCKED","BLOCKED_RUNNING","QUEUE_HALTED","FAILED","BLOCKED_STALE"}
    if output["status"] in unsafe_status or (output["status"]=="QUARANTINED" and output["count"]>0):
        return 2
    return 0


if __name__=="__main__":
    raise SystemExit(main())
