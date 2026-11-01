"""RT-ORCH-08: offline SQLite queue, no GitHub/Claude/Work calls."""
from __future__ import annotations

import json
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from rt_orch_queue import OfflineQueue, QueueBlocked


def task(n=1, *, pr=33, attempt=0, head=None):
    return {
        'task_id': f'RT-ORCH-08-TEST-{n}',
        'event_key': f'evt-rt-orch-08-event-{n}',
        'repository': 'psg0987/Wall',
        'pr_number': pr,
        'base_sha': '0' * 40,
        'head_sha': head or f'{n:040x}',
        'allowed_path': 'docs/rt-orch-08.md',
        'attempt': attempt,
        'approved_by': 'psg0987',
        'owner_verified': True,
        'source_run_authenticated': True,
    }


class QueueTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.db = str(Path(self.tmp.name) / 'queue.sqlite3')
        self.queue_id = 'rt-orch-08-test-queue'
        self.q = OfflineQueue.bootstrap(self.db,self.queue_id)

    def blocked(self, reason, spec):
        with self.assertRaisesRegex(QueueBlocked, f'^{reason}$'):
            self.q.stage(spec)

    def test_stage_is_never_authorization(self):
        out = self.q.stage(task())
        self.assertEqual(out['status'], 'STAGED_UNTRUSTED')
        self.assertEqual(out['approval_provenance'], 'UNVERIFIED')
        self.assertIs(out['may_dispatch'], False)

    def test_fake_approval_flags_ignored(self):
        self.q.stage(task())
        self.assertIs(self.q.claim_for_simulation('sim')['may_dispatch'], False)

    def test_snapshot_is_persistent_after_reopen(self):
        self.q.stage(task())
        self.assertEqual(OfflineQueue(self.db,self.queue_id).snapshot()['tasks'][0]['state'], 'STAGED')

    def test_normal_claim_and_finish_is_only_simulated(self):
        self.q.stage(task())
        claim=self.q.claim_for_simulation('worker-1')
        self.assertEqual(claim['status'], 'SIMULATION_CLAIMED')
        self.assertFalse(claim['may_dispatch'])
        final=self.q.finish_simulation(claim['task_id'],claim['claim_token'],claim['head_sha'],True)
        self.assertEqual(final['status'], 'FINISHED')
        self.assertFalse(final['may_dispatch'])
        self.assertEqual(self.q.snapshot()['tasks'][0]['state'],'FINISHED')

    def test_atomic_claim_two_threads_one_winner(self):
        self.q.stage(task())
        def try_claim(n):
            return OfflineQueue(self.db,self.queue_id).claim_for_simulation(f'w{n}')
        with ThreadPoolExecutor(max_workers=2) as pool:
            out=list(pool.map(try_claim,[1,2]))
        statuses=sorted(x['status'] for x in out)
        self.assertEqual(statuses,['BLOCKED_RUNNING','SIMULATION_CLAIMED'])

    def test_multiple_tasks_fifo(self):
        self.q.stage(task(1,pr=33))
        self.q.stage(task(2,pr=34))
        a=self.q.claim_for_simulation('worker')
        self.assertEqual(a['task_id'],task(1)['task_id'])
        self.q.finish_simulation(a['task_id'],a['claim_token'],a['head_sha'],True)
        b=self.q.claim_for_simulation('worker')
        self.assertEqual(b['task_id'],task(2)['task_id'])

    def test_claim_reopened_db_still_blocks(self):
        self.q.stage(task())
        self.q.claim_for_simulation('worker')
        self.assertEqual(OfflineQueue(self.db,self.queue_id).claim_for_simulation('second')['status'],'BLOCKED_RUNNING')

    def test_crashed_claim_requires_manual_quarantine(self):
        self.q.stage(task())
        self.q.claim_for_simulation('worker')
        reopened=OfflineQueue(self.db,self.queue_id)
        self.assertEqual(reopened.claim_for_simulation('another')['status'],'BLOCKED_RUNNING')
        self.assertEqual(reopened.quarantine_interrupted_claims()['count'],1)
        self.assertEqual(reopened.claim_for_simulation('another')['status'],'QUEUE_HALTED')
        self.assertTrue(reopened.snapshot()['halted'])

    def test_manual_quarantine_without_claim_no_halt(self):
        self.assertEqual(self.q.quarantine_interrupted_claims()['count'],0)
        self.assertFalse(self.q.snapshot()['halted'])

    def test_stale_sha_halts_all_following_tasks(self):
        self.q.stage(task(1,pr=33))
        self.q.stage(task(2,pr=34))
        c=self.q.claim_for_simulation('worker')
        self.assertEqual(self.q.finish_simulation(c['task_id'],c['claim_token'],'f'*40,True)['status'],'BLOCKED_STALE')
        self.assertEqual(self.q.claim_for_simulation('other')['status'],'QUEUE_HALTED')

    def test_failure_halts_queue(self):
        self.q.stage(task())
        c=self.q.claim_for_simulation('worker')
        self.assertEqual(self.q.finish_simulation(c['task_id'],c['claim_token'],c['head_sha'],False)['status'],'FAILED')
        self.assertTrue(self.q.snapshot()['halted'])

    def test_invalid_observed_head_halts(self):
        self.q.stage(task())
        c=self.q.claim_for_simulation('worker')
        self.assertEqual(self.q.finish_simulation(c['task_id'],c['claim_token'],'NOT_A_SHA',True)['status'],'BLOCKED_STALE')

    def test_invalid_claim_token_blocked(self):
        self.q.stage(task())
        c=self.q.claim_for_simulation('worker')
        with self.assertRaisesRegex(QueueBlocked,'INVALID_CLAIM_TOKEN_OR_STATE'):
            self.q.finish_simulation(c['task_id'],'forged',c['head_sha'],True)
        self.assertEqual(self.q.snapshot()['tasks'][0]['state'],'CLAIMED')

    def test_replayed_finish_denied(self):
        self.q.stage(task())
        c=self.q.claim_for_simulation('worker')
        self.q.finish_simulation(c['task_id'],c['claim_token'],c['head_sha'],True)
        with self.assertRaises(QueueBlocked):
            self.q.finish_simulation(c['task_id'],c['claim_token'],c['head_sha'],True)

    def test_duplicate_exact_event_denied(self):
        self.q.stage(task(1,pr=33))
        x=task(2,pr=34);x['event_key']=task(1)['event_key']
        self.blocked('DUPLICATE_TASK_OR_HEAD_OR_EVENT',x)

    def test_duplicate_pr_head_denied(self):
        self.q.stage(task(1))
        x=task(2,pr=33,head=task(1)['head_sha'])
        self.blocked('INVALID_ATTEMPT_TRANSITION',x)

    def test_duplicate_task_id_denied(self):
        self.q.stage(task(1,pr=33))
        x=task(1,pr=34);x['event_key']='evt-another-event-222'
        self.blocked('DUPLICATE_TASK_OR_HEAD_OR_EVENT',x)

    def test_allowed_docs_one_file_only(self):
        self.q.stage(task())

    def test_financial_path_denied(self):
        x=task(); x['allowed_path']='src/sim.js'
        self.blocked('SCOPE_DENIED',x)

    def test_workflow_path_denied(self):
        x=task();x['allowed_path']='.github/workflows/ci.yml'
        self.blocked('SCOPE_DENIED',x)

    def test_golden_path_denied(self):
        x=task();x['allowed_path']='tests/golden.json'
        self.blocked('SCOPE_DENIED',x)

    def test_path_traversal_denied(self):
        x=task();x['allowed_path']='docs/../src/ui2.js'
        self.blocked('SCOPE_DENIED',x)

    def test_nested_doc_not_allowed(self):
        x=task();x['allowed_path']='docs/a/b.md'
        self.blocked('SCOPE_DENIED',x)

    def test_wrong_repository_denied(self):
        x=task();x['repository']='someone/Wall'
        self.blocked('REPOSITORY_DENIED',x)

    def test_uppercase_sha_denied(self):
        x=task();x['head_sha']='A'*40
        self.blocked('INVALID_SHA',x)

    def test_same_base_head_denied(self):
        x=task();x['head_sha']=x['base_sha']
        self.blocked('SAME_BASE_HEAD',x)

    def test_boolean_attempt_denied(self):
        x=task();x['attempt']=True
        self.blocked('REPAIR_LIMIT',x)

    def test_invalid_pr_id_denied(self):
        x=task();x['pr_number']=True
        self.blocked('INVALID_PR',x)

    def test_invalid_event_key_denied(self):
        x=task();x['event_key']='';self.blocked('INVALID_EVENT_KEY',x)

    def test_invalid_task_id_denied(self):
        x=task();x['task_id']='BAD';self.blocked('INVALID_TASK_ID',x)

    def test_missing_field_denied(self):
        x=task();del x['head_sha'];self.blocked('MISSING_FIELD',x)

    def test_repair_attempt_requires_previous(self):
        self.blocked('MISSING_PREVIOUS_ATTEMPT',task(2,attempt=1))

    def test_repair_attempt_not_allowed_while_claimed(self):
        self.q.stage(task(1,attempt=0))
        self.q.claim_for_simulation('worker')
        self.blocked('INVALID_ATTEMPT_TRANSITION',task(2,attempt=1))

    def test_only_two_repair_attempts(self):
        for a in (0,1,2):
            x=task(a+1,attempt=a)
            self.q.stage(x)
            c=self.q.claim_for_simulation('worker')
            self.q.finish_simulation(c['task_id'],c['claim_token'],c['head_sha'],True)
        self.blocked('REPAIR_LIMIT',task(4,attempt=3))
        self.assertEqual(len(self.q.snapshot()['tasks']),3)

    def test_invalid_attempt_order_denied(self):
        self.q.stage(task(1,attempt=0))
        c=self.q.claim_for_simulation('worker')
        self.q.finish_simulation(c['task_id'],c['claim_token'],c['head_sha'],True)
        self.blocked('INVALID_ATTEMPT_TRANSITION',task(3,attempt=2))

    def test_cannot_enqueue_if_halted(self):
        self.q.stage(task(1))
        c=self.q.claim_for_simulation('worker')
        self.q.finish_simulation(c['task_id'],c['claim_token'],c['head_sha'],False)
        self.blocked('QUEUE_HALTED',task(2,pr=34))

    def test_empty_queue_returns_no_dispatch(self):
        out=self.q.claim_for_simulation('worker')
        self.assertEqual(out['status'],'EMPTY')
        self.assertFalse(out['may_dispatch'])

    def test_invalid_worker_denied(self):
        with self.assertRaisesRegex(QueueBlocked,'INVALID_WORKER'):
            self.q.claim_for_simulation('worker;rm -rf /')

    def test_cli_can_stage_and_snapshot_offline(self):
        jsonfile=Path(self.tmp.name)/'spec.json'
        jsonfile.write_text(json.dumps(task()),encoding='utf-8')
        script=str(Path(__file__).with_name('rt_orch_queue.py'))
        a=subprocess.run([sys.executable,script,self.db,'stage','--queue-id',self.queue_id,'--input',str(jsonfile)],capture_output=True,text=True)
        self.assertEqual(a.returncode,0,a.stderr)
        self.assertFalse(json.loads(a.stdout)['may_dispatch'])
        b=subprocess.run([sys.executable,script,self.db,'snapshot','--queue-id',self.queue_id],capture_output=True,text=True)
        self.assertEqual(b.returncode,0,b.stderr)
        self.assertEqual(json.loads(b.stdout)['tasks'][0]['state'],'STAGED')

    def test_cli_duplicate_is_nonzero(self):
        self.q.stage(task())
        jsonfile=Path(self.tmp.name)/'spec.json'
        jsonfile.write_text(json.dumps(task()),encoding='utf-8')
        script=str(Path(__file__).with_name('rt_orch_queue.py'))
        a=subprocess.run([sys.executable,script,self.db,'stage','--queue-id',self.queue_id,'--input',str(jsonfile)],capture_output=True,text=True)
        self.assertEqual(a.returncode,2)
        self.assertEqual(json.loads(a.stdout)['status'],'BLOCKED')


    def test_pr_above_sqlite_integer_range_denied(self):
        x=task();x['pr_number']=2**63
        self.blocked('INVALID_PR',x)

    def test_largest_valid_sqlite_pr_number_accepted(self):
        x=task();x['pr_number']=2**63-1
        self.assertEqual(self.q.stage(x)['status'],'STAGED_UNTRUSTED')

    def test_parallel_subprocess_claim_one_winner(self):
        self.q.stage(task())
        script=str(Path(__file__).with_name('rt_orch_queue.py'))
        cmd=[sys.executable,script,self.db,'claim','--queue-id',self.queue_id]
        p1=subprocess.Popen([*cmd,'--worker','process1'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        p2=subprocess.Popen([*cmd,'--worker','process2'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        a,e1=p1.communicate(timeout=12)
        b,e2=p2.communicate(timeout=12)
        self.assertEqual(sorted([json.loads(a)['status'],json.loads(b)['status']]),
                         ['BLOCKED_RUNNING','SIMULATION_CLAIMED'],(e1,e2))
        self.assertEqual(sorted([p1.returncode,p2.returncode]),[0,2])

    def test_sql_unique_index_rejects_same_pr_head(self):
        self.q.stage(task())
        x=task(2,pr=33,attempt=1,head=task()['head_sha'])
        sql=('INSERT INTO tasks (task_id,event_key,repository,pr_number,base_sha,'
             'head_sha,allowed_path,attempt,state) VALUES (?,?,?,?,?,?,?,?,?)')
        conn=sqlite3.connect(self.db)
        try:
            with self.assertRaisesRegex(sqlite3.IntegrityError,'tasks.pr_number, tasks.head_sha'):
                conn.execute(sql,tuple(x[k] for k in
                    ('task_id','event_key','repository','pr_number','base_sha',
                     'head_sha','allowed_path','attempt'))+('STAGED',))
        finally:
            conn.rollback();conn.close()

    def test_partial_unique_index_rejects_second_claim(self):
        self.q.stage(task(1,pr=33));self.q.stage(task(2,pr=34))
        self.q.claim_for_simulation('worker')
        conn=sqlite3.connect(self.db)
        try:
            with self.assertRaises(sqlite3.IntegrityError):
                conn.execute("UPDATE tasks SET state='CLAIMED' WHERE task_id=?",(task(2,pr=34)['task_id'],))
        finally:
            conn.rollback();conn.close()

    def test_cli_failed_simulation_returns_nonzero(self):
        self.q.stage(task())
        c=self.q.claim_for_simulation('worker')
        script=str(Path(__file__).with_name('rt_orch_queue.py'))
        proc=subprocess.run([sys.executable,script,self.db,'finish','--queue-id',self.queue_id,
                             '--task-id',c['task_id'],'--token',c['claim_token'],
                             '--observed-head',c['head_sha'],'--fail'],
                            capture_output=True,text=True)
        self.assertEqual(proc.returncode,2,proc.stderr)
        self.assertEqual(json.loads(proc.stdout)['status'],'FAILED')

    def test_cli_stale_sha_returns_nonzero(self):
        self.q.stage(task())
        c=self.q.claim_for_simulation('worker')
        script=str(Path(__file__).with_name('rt_orch_queue.py'))
        proc=subprocess.run([sys.executable,script,self.db,'finish','--queue-id',self.queue_id,
                             '--task-id',c['task_id'],'--token',c['claim_token'],
                             '--observed-head','f'*40],capture_output=True,text=True)
        self.assertEqual(proc.returncode,2,proc.stderr)
        self.assertEqual(json.loads(proc.stdout)['status'],'BLOCKED_STALE')

    def test_cli_queue_halted_returns_nonzero(self):
        self.q.stage(task())
        c=self.q.claim_for_simulation('worker')
        self.q.finish_simulation(c['task_id'],c['claim_token'],c['head_sha'],False)
        script=str(Path(__file__).with_name('rt_orch_queue.py'))
        proc=subprocess.run([sys.executable,script,self.db,'claim','--queue-id',self.queue_id],capture_output=True,text=True)
        self.assertEqual(proc.returncode,2)
        self.assertEqual(json.loads(proc.stdout)['status'],'QUEUE_HALTED')

    def test_cli_db_busy_structured_block(self):
        conn=sqlite3.connect(self.db,timeout=0.1)
        try:
            conn.execute('BEGIN EXCLUSIVE')
            script=str(Path(__file__).with_name('rt_orch_queue.py'))
            proc=subprocess.run([sys.executable,script,self.db,'snapshot','--queue-id',self.queue_id],
                                capture_output=True,text=True,timeout=12)
            self.assertEqual(proc.returncode,2,proc.stderr)
            self.assertEqual(json.loads(proc.stdout)['reason'],'DB_BUSY')
        finally:
            conn.rollback();conn.close()



    def test_uninitialized_path_does_not_create_new_queue(self):
        missing=str(Path(self.tmp.name)/'uninitialized.sqlite3')
        with self.assertRaisesRegex(QueueBlocked,'QUEUE_NOT_INITIALIZED'):
            OfflineQueue(missing,self.queue_id)
        self.assertFalse(Path(missing).exists())

    def test_wrong_queue_id_rejected(self):
        with self.assertRaisesRegex(QueueBlocked,'QUEUE_ID_MISMATCH'):
            OfflineQueue(self.db,'rt-orch-08-another-queue')

    def test_changed_db_path_with_different_id_rejected(self):
        other=str(Path(self.tmp.name)/'another.sqlite3')
        OfflineQueue.bootstrap(other,'rt-orch-08-another-queue')
        self.q.path=other
        with self.assertRaisesRegex(QueueBlocked,'QUEUE_ID_MISMATCH'):
            self.q.claim_for_simulation('worker')

    def test_duplicate_bootstrap_never_resets_history(self):
        self.q.stage(task())
        with self.assertRaisesRegex(QueueBlocked,'QUEUE_ALREADY_EXISTS'):
            OfflineQueue.bootstrap(self.db,self.queue_id)
        self.assertEqual(self.q.snapshot()['tasks'][0]['state'],'STAGED')

    def test_invalid_queue_id_rejected(self):
        with self.assertRaisesRegex(QueueBlocked,'INVALID_QUEUE_ID'):
            OfflineQueue(self.db,'random')

    def test_cli_wrong_path_fails_closed_without_creating_db(self):
        missing=str(Path(self.tmp.name)/'never-before-seen.sqlite3')
        script=str(Path(__file__).with_name('rt_orch_queue.py'))
        proc=subprocess.run([sys.executable,script,missing,'stage',
                             '--queue-id',self.queue_id,'--input','missing.json'],
                            capture_output=True,text=True)
        self.assertEqual(proc.returncode,2)
        self.assertEqual(json.loads(proc.stdout)['reason'],'QUEUE_NOT_INITIALIZED')
        self.assertFalse(Path(missing).exists())

    def test_cli_explicit_init_then_duplicate_init_is_refused(self):
        other=str(Path(self.tmp.name)/'created-via-cli.sqlite3')
        script=str(Path(__file__).with_name('rt_orch_queue.py'))
        cmd=[sys.executable,script,other,'init','--queue-id',self.queue_id]
        a=subprocess.run(cmd,capture_output=True,text=True)
        self.assertEqual(a.returncode,0,a.stderr)
        self.assertEqual(json.loads(a.stdout)['status'],'INITIALIZED')
        b=subprocess.run(cmd,capture_output=True,text=True)
        self.assertEqual(b.returncode,2)
        self.assertEqual(json.loads(b.stdout)['reason'],'QUEUE_ALREADY_EXISTS')

    def test_identity_check_each_operation(self):
        self.q.stage(task())
        # Tamper with expected DB ID after construction: every operation must refuse.
        conn=sqlite3.connect(self.db)
        try:
            conn.execute("UPDATE control SET value=? WHERE key='queue_id'",('rt-orch-08-another-queue',))
            conn.commit()
        finally:
            conn.close()
        with self.assertRaisesRegex(QueueBlocked,'QUEUE_ID_MISMATCH'):
            self.q.snapshot()



    def test_cloned_database_same_id_different_path_is_denied(self):
        self.q.stage(task())
        copied=str(Path(self.tmp.name)/'copied.sqlite3')
        shutil.copyfile(self.db,copied)
        with self.assertRaisesRegex(QueueBlocked,'QUEUE_PATH_MISMATCH'):
            OfflineQueue(copied,self.queue_id)

    def test_runtime_db_copy_path_is_denied(self):
        copied=str(Path(self.tmp.name)/'copied.sqlite3')
        shutil.copyfile(self.db,copied)
        self.q.path=copied
        with self.assertRaisesRegex(QueueBlocked,'QUEUE_PATH_MISMATCH'):
            self.q.claim_for_simulation('worker')

    def test_identity_must_be_rechecked_under_write_transaction(self):
        # The connection identity is valid, then another connection tampers
        # with the DB ID before BEGIN IMMEDIATE. The in-tx check must refuse.
        original=self.q._connect
        conn=original()
        attacker=sqlite3.connect(self.db)
        try:
            attacker.execute("UPDATE control SET value=? WHERE key='queue_id'",
                             ('rt-orch-08-another-queue',))
            attacker.commit()
        finally:
            attacker.close()
        self.q._connect=lambda:conn
        try:
            with self.assertRaisesRegex(QueueBlocked,'QUEUE_ID_MISMATCH'):
                self.q.stage(task())
        finally:
            self.q._connect=original
            conn.close()
        check=sqlite3.connect(self.db)
        try:
            self.assertEqual(check.execute('SELECT COUNT(*) FROM tasks').fetchone()[0],0)
        finally:
            check.close()

    def test_invalid_halt_control_is_fail_closed(self):
        conn=sqlite3.connect(self.db)
        try:
            conn.execute("UPDATE control SET value='unknown' WHERE key='halted'")
            conn.commit()
        finally:
            conn.close()
        with self.assertRaisesRegex(QueueBlocked,'INVALID_HALT_CONTROL'):
            self.q.claim_for_simulation('worker')

    def test_missing_halt_control_is_fail_closed(self):
        conn=sqlite3.connect(self.db)
        try:
            conn.execute("DELETE FROM control WHERE key='halted'")
            conn.commit()
        finally:
            conn.close()
        with self.assertRaisesRegex(QueueBlocked,'INVALID_HALT_CONTROL'):
            self.q.claim_for_simulation('worker')



if __name__=='__main__':
    unittest.main()
