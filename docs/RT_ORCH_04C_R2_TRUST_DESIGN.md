# RT-ORCH-04-C-R2 — trusted-base CI proposal (NOT ACTIVE)

State: experimental Draft PR only. No merge, deployment, ruleset mutation, or new live automation.

## Threat addressed
The first 04-C probe uses a pull_request workflow and runs the PR's own edited CI file. A malicious PR can edit that workflow or its verifier. A self-reported job PASS cannot be a strong enforcement proof.

## Candidate boundary
- A separate pull_request_target workflow must be installed in trusted main by explicit owner approval, with a **read-only** GITHUB_TOKEN.
- Checkout only the base SHA. NEVER checkout, import, pip-install, build, or execute PR HEAD content in this job.
- Trusted verifier uses GitHub REST GET for current PR, file list, open PRs, base/head reference rechecks.
- No --allow CLI argument; allowlist and exact approved head SHA come ONLY from the manifest at `verify/rt-orch-approved-prs.json?ref=<verified-current-base-commit-sha>`.
- The manifest does **not currently exist on main**, so live runs must BLOCK until a separately approved, trustworthy approval mechanism is installed.
- PR SHA/branch/issue_number/risk_class=C1/allowlist must match exactly. Unsafe paths, Golden, workflow/build/deploy/Android, missing/duplicate records, changed SHA, incomplete lists => fail closed.
- The optional `approved_by` JSON field, GitHub Issue body, author-controlled PR labels, or an untrusted workflow cannot prove owner authorization. Do not use them as authority.
- Approval-list changes and verifier/workflow modifications need a dedicated OWNER-controlled maintenance path, separate from automated C1 PRs; these are never silently allowlisted.
- Current GitHub ruleset requires only `full-suite`. A proposed job is NOT a required check until verified and configured by the owner.

## Approval JSON example (for documentation, NOT authorized)
```json
{
  "schema_version": 1,
  "repository": "psg0987/Wall",
  "approvals": [{
    "pr_number": 999,
    "issue_number": 999,
    "risk_class": "C1",
    "head_sha": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "branch": "exp/approved-c1-change",
    "allowed_paths": ["src/ui2.js", "tests/t_example.js"]
  }]
}
```
No automated code-writing issue is authorized by this example. It is not stored under the active manifest path.

## Rollout prerequisites and unresolved limitations
1. Independent review and approval of this candidate, and real user-specified C1 task/approved file scope.
2. Owner-controlled, verifiable procedure to commit approval records without trusting a PR author, with a safe policy/workflow maintenance route and rollback.
3. Confirm GitHub's pull_request_target event policy permits this workflow; recent GitHub documentation announces changing default public-repo event enforcement. No unsafe override by default.
4. Install source/policy/workflow into trusted main only after approval and a verified no-policy fail-closed test. Approval record(s) can come later through the owner maintenance route.
5. Confirm the new check is actually reported on the correct head/merge commit and is recognized in repository ruleset, with expected GitHub App source.
6. Verify real GitHub merge prevention on a deliberately blocked test PR, including Golden, workflow, missing approval, SHA drift, canceled/pending check, and PR HEAD updates.
7. Keep full-suite separately required. Never treat a skipped/neutral check as a hard block without testing GitHub semantics.
8. Do not merge this experiment or deploy. This proposal proves design intent and mocked policy checks, not production enforcement.
