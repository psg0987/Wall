"""WORK-43-R3 tests. OFFLINE simulation only; no real Claude/GPT/GitHub dispatch."""
import shutil
import tempfile
import unittest
from pathlib import Path
from rt_orch_queue import OfflineQueue, QueueBlocked
from rt_orch_work43_witness import OfflineWitness, GuardBlocked
from rt_orch_work43_guarded_queue import OfflineGuardedQueue

BASE='27abe48fd426a59148e528a3d11c87f64f29dd04'
def spec(i,pr,attempt=0):
    return dict(task_id=f'RT-ORCH-W43R3-{i}',event_key=f'evt-rt-orch-w43r3-{i}',
      repository='psg0987/Wall',pr_number=pr,base_sha=BASE,head_sha=f'{i+10000:040x}',
      allowed_path='docs/rt-orch-example.md',attempt=attempt)

class OfflineIntegration(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='w43-')
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)
        self.qp=self.root/'queue.sqlite'
        self.wp=self.root/'witness.sqlite'
        self.q=OfflineQueue.bootstrap(self.qp,'rt-orch-work43-r3-demo-01')
        self.w=OfflineWitness.bootstrap(self.wp,'w43-work43-r3-demo-01')
        self.g=OfflineGuardedQueue(self.q,self.w)

    def test_two_sequential_d0_simulations(self):
        for i in (1,2):
            t=spec(i,100+i)
            self.assertEqual(self.g.stage(t)['status'],'STAGED_UNTRUSTED')
            c=self.g.claim_for_simulation('offline')
            self.assertEqual(self.g.finish_simulation(t['task_id'],c['claim_token'],t['head_sha'],True)['status'],'FINISHED')
        self.assertEqual(self.w.status()['observations'],2)
        self.assertTrue(all(x['state']=='FINISHED' for x in self.q.snapshot()['tasks']))

    def test_rollback_of_queue_only_is_detected(self):
        t=spec(1,101)
        self.g.stage(t)
        shutil.copy2(self.qp,self.root/'oldqueue.db')
        c=self.g.claim_for_simulation('offline')
        self.g.finish_simulation(t['task_id'],c['claim_token'],t['head_sha'],True)
        shutil.copy2(self.root/'oldqueue.db',self.qp)
        with self.assertRaisesRegex(GuardBlocked,'TERMINAL_STATE_REWIND|STATE_ROLLBACK'):
            self.g.preflight()

    def test_cancel_persists_a_restart(self):
        t=spec(1,101);self.g.stage(t)
        self.g.cancel(101,t['head_sha'],'stop')
        w=OfflineWitness(self.wp,'w43-work43-r3-demo-01')
        with self.assertRaisesRegex(GuardBlocked,'CANCELLED_PR'):
            OfflineGuardedQueue(self.q,w).claim_for_simulation('offline')

    def test_attempt_history_does_not_reset_with_queue_rollback(self):
        t=spec(1,101);self.g.stage(t)
        shutil.copy2(self.qp,self.root/'oldqueue.db')
        for i in (1,2,3):
            s=spec(i,101,i-1)
            if i>1:self.g.stage(s)
            c=self.g.claim_for_simulation('offline')
            self.g.finish_simulation(s['task_id'],c['claim_token'],s['head_sha'],True)
        with self.assertRaises(QueueBlocked):
            self.g.stage(spec(4,101,3))
        shutil.copy2(self.root/'oldqueue.db',self.qp)
        with self.assertRaisesRegex(GuardBlocked,'ROLLBACK_OR_MISSING_TASK|TERMINAL_STATE_REWIND'):
            self.g.preflight()

    def test_stale_head_is_a_stop_not_a_pass(self):
        t=spec(1,101);self.g.stage(t)
        c=self.g.claim_for_simulation('offline')
        with self.assertRaisesRegex(GuardBlocked,'UNACKNOWLEDGED_QUEUE_EFFECT'):
            self.g.finish_simulation(t['task_id'],c['claim_token'],'f'*40,True)
        self.assertTrue(self.q.snapshot()['halted'])

    def test_bypass_write_not_authenticated(self):
        self.g.stage(spec(1,101))
        c=self.q.claim_for_simulation('direct')
        self.assertFalse(c['may_dispatch'])
        self.assertFalse(self.g.preflight()['may_dispatch'])
        self.assertEqual(self.g.claim_for_simulation('offline')['status'],'BLOCKED_RUNNING')

    def test_missing_witness_fails_closed(self):
        self.g.stage(spec(1,101))
        self.wp.unlink()
        with self.assertRaises(GuardBlocked):self.g.claim_for_simulation('offline')

    def test_both_queue_and_witness_rollback_is_UNDETECTED(self):
        t=spec(1,101);self.g.stage(t)
        shutil.copy2(self.qp,self.root/'oldqueue.db')
        shutil.copy2(self.wp,self.root/'oldwitness.db')
        c=self.g.claim_for_simulation('offline')
        self.g.finish_simulation(t['task_id'],c['claim_token'],t['head_sha'],True)
        shutil.copy2(self.root/'oldqueue.db',self.qp)
        shutil.copy2(self.root/'oldwitness.db',self.wp)
        self.assertFalse(self.g.preflight()['may_dispatch'])
        self.assertEqual(self.q.snapshot()['tasks'][0]['state'],'STAGED')

    def test_cancel_and_witness_shared_rollback_is_UNDETECTED(self):
        t=spec(1,101);self.g.stage(t)
        shutil.copy2(self.qp,self.root/'oldqueue.db')
        shutil.copy2(self.wp,self.root/'oldwitness.db')
        self.g.cancel(101,t['head_sha'],'stop')
        shutil.copy2(self.root/'oldqueue.db',self.qp)
        shutil.copy2(self.root/'oldwitness.db',self.wp)
        self.assertFalse(self.g.preflight()['may_dispatch'])
        self.assertEqual(self.w.status()['cancelled_prs'],0)

    def test_outputs_never_authorize(self):
        r=self.g.stage(spec(1,101))
        for k in ('may_dispatch','may_merge','may_deploy','approval_authenticated','review_authenticated'):
            self.assertIs(r[k],False)

if __name__=='__main__':unittest.main()
