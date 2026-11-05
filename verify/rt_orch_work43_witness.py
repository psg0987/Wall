"""RT-ORCH-WORK-43: offline, fail-closed witness prototype for PR #38 queue.

NOT an authenticated approval or execution gateway. NEVER dispatches agents,
network requests, subprocesses, GitHub calls, merges, or deploys. The witness
SQLite file MUST live in a *separately trusted* storage boundary in production;
a local demonstration cannot establish that trust boundary.
"""
from __future__ import annotations

import os
import re
import sqlite3
from pathlib import Path
from contextlib import closing

SHA = re.compile(r"[a-f0-9]{40}\Z")
STATES = frozenset({"STAGED", "CLAIMED", "FINISHED", "FAILED", "BLOCKED_STALE", "BLOCKED_CRASH"})
TERMINAL = frozenset({"FINISHED", "FAILED", "BLOCKED_STALE", "BLOCKED_CRASH"})
LEVEL = {"STAGED": 0, "CLAIMED": 1, **{x: 2 for x in TERMINAL}}


class GuardBlocked(ValueError):
    """Never retry or dispatch automatically after this exception."""


def _block(reason):
    raise GuardBlocked(reason)


def _snapshot_rows(snapshot):
    """Validate the public OfflineQueue.snapshot() output shape, not its origin."""
    if not isinstance(snapshot, dict) or snapshot.get("status") != "SNAPSHOT":
        _block("INVALID_SNAPSHOT")
    if type(snapshot.get("halted")) is not bool or not isinstance(snapshot.get("tasks"), list):
        _block("INVALID_SNAPSHOT")
    if snapshot.get("may_dispatch") is not False:
        _block("INVALID_PERMISSION_FLAG")
    if snapshot["halted"]:
        _block("QUEUE_HALTED")
    result = {}
    pairs = set()
    for row in snapshot["tasks"]:
        if not isinstance(row, dict):
            _block("INVALID_TASK")
        tid, pr, head, attempt, state = (row.get(k) for k in ("task_id", "pr_number", "head_sha", "attempt", "state"))
        if (not isinstance(tid, str) or not re.fullmatch(r"RT-ORCH-[A-Z0-9-]{2,70}", tid)
                or type(pr) is not int or pr <= 0 or not isinstance(head, str)
                or not SHA.fullmatch(head) or type(attempt) is not int or not 0 <= attempt <= 2
                or state not in STATES or tid in result or (pr, attempt) in pairs):
            _block("INVALID_OR_DUPLICATE_TASK")
        result[tid] = (pr, head, attempt, state)
        pairs.add((pr, attempt))
    for pr, attempt in pairs:
        if any((pr, prev) not in pairs for prev in range(attempt)):
            _block("MISSING_ATTEMPT_HISTORY")
        if attempt > 0 and not any(v[0] == pr and v[2] == attempt-1 and v[3] == "FINISHED"
                                   for v in result.values()):
            _block("PRIOR_ATTEMPT_NOT_FINISHED")
    return result


class OfflineWitness:
    """Monotonic *local* observation and persistent cancellation ledger."""
    def __init__(self, path, witness_id):
        self.path = Path(path).resolve(strict=False)
        self.witness_id = witness_id
        if not isinstance(witness_id, str) or not re.fullmatch(r"w43-[A-Za-z0-9_-]{5,90}", witness_id):
            _block("INVALID_WITNESS_ID")
        self._check_existing()

    @classmethod
    def bootstrap(cls, path, witness_id):
        p = Path(path).resolve(strict=False)
        if p.exists() or not p.parent.is_dir():
            _block("WITNESS_ALREADY_EXISTS_OR_PARENT_MISSING")
        fd = os.open(str(p), os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        os.close(fd)
        try:
            with closing(sqlite3.connect(f"file:{p}?mode=rw", uri=True, timeout=2)) as con:
                con.executescript("""
                CREATE TABLE control(id TEXT PRIMARY KEY, canonical_path TEXT NOT NULL,
                                     schema_version INTEGER NOT NULL CHECK(schema_version=1));
                CREATE TABLE observations(task_id TEXT PRIMARY KEY, pr INTEGER NOT NULL,
                    head TEXT NOT NULL, attempt INTEGER NOT NULL, state TEXT NOT NULL,
                    UNIQUE(pr,attempt));
                CREATE TABLE tombstones(pr INTEGER PRIMARY KEY, head TEXT NOT NULL,
                    reason TEXT NOT NULL);
                """)
                con.execute("INSERT INTO control VALUES(?,?,1)", (witness_id, str(p)))
                con.commit()
        except Exception:
            raise
        return cls(p, witness_id)

    def _connect(self):
        if not self.path.is_file():
            _block("WITNESS_MISSING")
        try:
            return sqlite3.connect(f"file:{self.path}?mode=rw", uri=True, timeout=2)
        except sqlite3.Error as e:
            raise GuardBlocked("WITNESS_UNAVAILABLE") from e

    def _identity(self, con):
        try:
            c = con.execute("SELECT id,canonical_path,schema_version FROM control").fetchall()
        except sqlite3.Error as e:
            raise GuardBlocked("WITNESS_CORRUPT") from e
        if c != [(self.witness_id, str(self.path), 1)]:
            _block("WITNESS_IDENTITY_MISMATCH")

    def _check_existing(self):
        with closing(self._connect()) as con:
            self._identity(con)

    @staticmethod
    def _check(rows, saved, cancelled):
        for tid, (pr, head, attempt, state) in saved.items():
            if tid not in rows:
                _block("ROLLBACK_OR_MISSING_TASK")
            current = rows[tid]
            if current[:3] != (pr, head, attempt):
                _block("TASK_IDENTITY_CHANGED")
            nxt = current[3]
            if state in TERMINAL and nxt != state:
                _block("TERMINAL_STATE_REWIND")
            if LEVEL[nxt] < LEVEL[state]:
                _block("STATE_ROLLBACK")
        if cancelled:
            _block("CANCELLED_PR_MANUAL_RECONCILIATION")
        if rows and any(row[3] in ("FAILED", "BLOCKED_STALE", "BLOCKED_CRASH") for row in rows.values()):
            _block("FAILED_OR_QUARANTINED")
        return "OBSERVATION_CONSISTENT_NOT_AUTHORIZED"

    def observe(self, snapshot):
        """Record a high-water checkpoint; returns NO execution permission."""
        rows = _snapshot_rows(snapshot)
        with closing(self._connect()) as con:
            try:
                con.execute("BEGIN IMMEDIATE")
                self._identity(con)
                saved = {tid: (pr,head,attempt,state) for tid,pr,head,attempt,state in con.execute(
                    "SELECT task_id,pr,head,attempt,state FROM observations")}
                cancelled = con.execute("SELECT pr FROM tombstones LIMIT 1").fetchone() is not None
                outcome = self._check(rows, saved, cancelled)
                for tid, (pr,head,attempt,state) in rows.items():
                    con.execute("""INSERT INTO observations VALUES(?,?,?,?,?)
                        ON CONFLICT(task_id) DO UPDATE SET state=excluded.state""",
                        (tid,pr,head,attempt,state))
                con.commit()
                return {"status": outcome, "observed_tasks":len(rows), "may_dispatch":False,
                        "approval_authenticated":False,"review_authenticated":False}
            except Exception:
                con.rollback()
                raise

    def check(self, snapshot):
        rows = _snapshot_rows(snapshot)
        with closing(self._connect()) as con:
            con.execute("BEGIN")
            self._identity(con)
            saved = {tid: (pr,head,attempt,state) for tid,pr,head,attempt,state in con.execute(
                "SELECT task_id,pr,head,attempt,state FROM observations")}
            cancelled = con.execute("SELECT pr FROM tombstones LIMIT 1").fetchone() is not None
            return {"status":self._check(rows,saved,cancelled),"may_dispatch":False}

    def cancel(self, pr, head, reason):
        """Persistent cancellation tombstone; never resurrect cancelled PRs."""
        if type(pr) is not int or pr <= 0 or not isinstance(head,str) or not SHA.fullmatch(head):
            _block("INVALID_CANCEL_TARGET")
        if not isinstance(reason,str) or not 1 <= len(reason) <= 160:
            _block("INVALID_CANCEL_REASON")
        with closing(self._connect()) as con:
            try:
                con.execute("BEGIN IMMEDIATE")
                self._identity(con)
                obs = con.execute("SELECT head,state FROM observations WHERE pr=? ORDER BY attempt DESC LIMIT 1",(pr,)).fetchone()
                if obs is None or obs[0] != head:
                    _block("UNOBSERVED_CANCEL_TARGET")
                old = con.execute("SELECT head FROM tombstones WHERE pr=?", (pr,)).fetchone()
                if old and old[0] != head:
                    _block("CANCEL_ALREADY_FROZEN")
                if not old:
                    con.execute("INSERT INTO tombstones VALUES(?,?,?)",(pr,head,reason))
                con.commit()
                return {"status":"CANCEL_PERSISTED_MANUAL_RECONCILIATION", "may_dispatch":False}
            except Exception:
                con.rollback()
                raise

    def status(self):
        with closing(self._connect()) as con:
            self._identity(con)
            return {"observations":con.execute("SELECT COUNT(*) FROM observations").fetchone()[0],
                    "cancelled_prs":con.execute("SELECT COUNT(*) FROM tombstones").fetchone()[0],
                    "may_dispatch":False,"origin_authenticated":False}
