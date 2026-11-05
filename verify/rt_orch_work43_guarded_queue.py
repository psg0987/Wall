"""WORK-43-R3 offline queue/witness coordinated guard, not a distributed transaction.

No external side effects or authorization. Needs an independent monotonic
checkpoint service before any real actor dispatch can be considered.
"""
from __future__ import annotations
from rt_orch_work43_witness import GuardBlocked

class OfflineGuardedQueue:
    """Offline guarded simulation. Direct queue writes and shared rollback remain unsafe."""
    def __init__(self, queue, witness):
        if not hasattr(queue,'snapshot') or not hasattr(witness,'check'):
            raise GuardBlocked('INVALID_QUEUE_OR_WITNESS')
        self.queue, self.witness = queue, witness

    def preflight(self):
        self.witness.check(self.queue.snapshot())
        return {'status':'OFFLINE_PREFLIGHT_ONLY','may_dispatch':False,
                'approval_authenticated':False,'review_authenticated':False}

    def _simulate(self, operation, *args):
        self.preflight()
        result=operation(*args)
        try:
            self.witness.observe(self.queue.snapshot())
        except Exception as exc:
            raise GuardBlocked('UNACKNOWLEDGED_QUEUE_EFFECT_STOP_AND_RECONCILE') from exc
        if result.get('may_dispatch') is not False:
            raise GuardBlocked('QUEUE_PERMISSION_INVARIANT_BROKEN')
        return {**result,'may_dispatch':False,'may_merge':False,
                'may_deploy':False,'approval_authenticated':False,
                'review_authenticated':False}

    def stage(self, spec):
        return self._simulate(self.queue.stage,spec)

    def claim_for_simulation(self, worker):
        return self._simulate(self.queue.claim_for_simulation,worker)

    def finish_simulation(self, task_id, token, observed_head, succeeded):
        return self._simulate(self.queue.finish_simulation,task_id,token,observed_head,succeeded)

    def quarantine_interrupted_claims(self):
        return self._simulate(self.queue.quarantine_interrupted_claims)

    def cancel(self, pr, head, reason):
        self.preflight()
        return self.witness.cancel(pr,head,reason)
