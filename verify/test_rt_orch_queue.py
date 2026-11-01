"""RT-ORCH-08: offline SQLite queue, no GitHub/Claude/Work calls."""
from __future__ import annotations

import json
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
        self.q = OfflineQueue(self.db)

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
        self.assertEqual(OfflineQueue(self.db).snapshot()['tasks'][0]['state'], 'STAGED')

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
            return OfflineQueue(self.db).claim_for_simulation(f'w{n}')
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
        self.assertEqual(OfflineQueue(self.db).claim_for_simulation('second')['status'],'BLOCKED_RUNNING')

    def test_crashed_claim_requires_manual_quarantine(self):
        self.q.stage(task())
        self.q.claim_for_simulation('worker')
        reopened=OfflineQueue(self.db)
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
        a=subprocess.run([sys.executable,script,self.db,'stage','--input',str(jsonfile)],capture_output=True,text=True)
        self.assertEqual(a.returncode,0,a.stderr)
        self.assertFalse(json.loads(a.stdout)['may_dispatch'])
        b=subprocess.run([sys.executable,script,self.db,'snapshot'],capture_output=True,text=True)
        self.assertEqual(b.returncode,0,b.stderr)
        self.assertEqual(json.loads(b.stdout)['tasks'][0]['state'],'STAGED')

    def test_cli_duplicate_is_nonzero(self):
        self.q.stage(task())
        jsonfile=Path(self.tmp.name)/'spec.json'
        jsonfile.write_text(json.dumps(task()),encoding='utf-8')
        script=str(Path(__file__).with_name('rt_orch_queue.py'))
        a=subprocess.run([sys.executable,script,self.db,'stage','--input',str(jsonfile)],capture_output=True,text=True)
        self.assertEqual(a.returncode,2)
        self.assertEqual(json.loads(a.stdout)['status'],'BLOCKED')


if __name__=='__main__':
    unittest.main()
