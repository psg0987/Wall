# RT-ORCH-AUTO-BATCH-02 — Offline witness and authenticated review boundary

**DO NOT MERGE / DO NOT DEPLOY / NO AUTOMATED DISPATCH.**
This is a chained Draft PR against the existing PR #38 branch, not a standalone release.

## Baseline and scope
- Wall main fixed base: 27abe48fd426a59148e528a3d11c87f64f29dd04
- Parent PR #38 HEAD before this change: cb2c47b47361e2de1eb861261597603919ea9e02
- Work scope: WORK-43-R2 / WORK-43-R3 / WORK-42-R2 / WORK-44 gate evaluation
- Files restricted to verify/ and docs/. No source, game, CI, Secrets, permission, existing automation, main, Pages or APK modifications.

## WORK-43-R2: Independent-state requirement
Prior PR #38 SQLite queue checks fixed queue ID and canonical path, but a saved older DB restored to the same path can rewind task status, repair count and cancel state. The experimental witness stores observed task identities, status and PR-scoped cancellation tombstones separately.

The offline witness can detect rollback of **queue alone** while the witness remains intact. It cannot detect restoring **both databases** to the same old snapshot, or prove authentic owner cancellation. Separate files on one host are not an independent trust boundary.

## WORK-43-R3: Bounded integration
The guarded coordinator checks a queue snapshot against witness before and after offline operations:
stage -> claim_for_simulation -> finish_simulation. Every result denies actual execution. Cancellation is recorded only in the witness, is deliberately conservative, and does not revoke an already-running external effect. A crash between queue write and witness update creates an uncertain side effect that must be manually reconciled; automatic retries are forbidden.

The included Python integration cases cover two simulated D0 tasks, queue-only rollback, combined rollback vulnerability, restart, persistent cancellation when witness remains intact, repair 0/1/2 cap, stale HEAD, bypass edits and missing witness. These tests do NOT demonstrate two real GitHub/Claude/GPT runs and do not attest to CI.

Run in this branch:
PYTHONPATH=verify python3 -W error::ResourceWarning -m unittest -v test_rt_orch_work43_integration

## WORK-42-R2: Review origin still BLOCKED
GitHub review authorship, a verified commit, GitHub Actions OIDC and a manually copied Work ID are not a signed statement from the actual GPT Work execution. The documented Workspace Agents API can trigger and track certain runs, but is not a generally available external verifier of the review text produced by this personal Work review. The consumer cannot promote an arbitrary GitHub Issue, PR review, unsigned JSON or model's self-report into authorization.

Re-entry requires (a) an independently verifiable Work review receipt cryptographically bound to repository, PR, full head SHA, finding and reviewer identity, OR (b) explicitly approved untrusted-advisory D0-only policy with fixed exact patch independently preauthorized. Neither grants C1 or release permission.

## WORK-44: Remote two-job D0 gate
BLOCKED: secure origin/approval or safe narrow alternative, rollback-resistant central checkpoint, atomic claim plus fencing, persistent cancellation, exact HEAD recheck before effects, and timeout/restart reconciler are not jointly verified. The offline two-job unit test does not count as an E2E run.

## Safety rules
- Hard-code may_dispatch=false, may_merge=false, may_deploy=false in every test result.
- Never automatically retry a write with uncertain outcome.
- Source files were not modified, existing routines remain untouched.
- No long-lived secrets, token minting, new paid service or cloud deployment.
- Do not treat a successful test suite or GitHub CI on a PR as evidence of external Work review origin or owner approval.
- Draft review only. Any future deployment/Secrets/permissions/automation changes need separate user authorization.
