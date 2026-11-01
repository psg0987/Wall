# RT-ORCH-04-C-R3 — pre-enforcement security decision record

**STATE: DESIGN + ISOLATED TESTS ONLY. DO NOT MERGE / DEPLOY / CHANGE RULESET.**
Repo: psg0987/Wall. Latest directly observed `main` = `27abe48fd426a59148e528a3d11c87f64f29dd04`.
R2 source PR #18 HEAD: `8c774206c14365d28817df2e5d4918e19551ac47`.
No automatic code-work approval is granted by this document.

## R3 security correction (P1)
R2 trusted-guard accepted any path that passed A's generic `safe_path()` and `protected()`.
In particular, an authorized C1 policy record could list:
- `verify/rt-orch-approved-prs.json` (approval list)
- `verify/rt_orch_trusted_guard.py` (guard implementation)
- `verify/rt_orch_gate.py` (verifier)
- `src/core.js` and `src/sim.js` (financial engine)

R3 adds a separate `c1_safe_path` scope rule: *only* the explicitly approved members of:
- `src/ui1.js`, `src/ui2.js`
- `tests/t*.js` conforming to the strict filename pattern, excluding `tests/t_golden.js`

Even these UI files are NOT automatically declared financially harmless; an independent review must check behavior. Everything else is blocked **for C1**. A manual maintenance workflow, finance changes, and docs require separately approved processes and should never be smuggled into C1.

## Actual GitHub ruleset snapshot — owner must verify again before changing it
Observed rule ID `26300434` = `main-ci-protection` (active), only `full-suite` required (GitHub Actions integration ID 15368), review approvals required = 0, strict up-to-date = false. No new R2/R3 gate is required.

## Trust and PR-check attribution limits
1. R2's candidate `pull_request_target` workflow is **not present on main**. GitHub loads event workflows from the default/base branch, so adding a candidate only on PR #18 or this R3 PR CANNOT prove it runs as a trusted check.
2. GitHub's public-repository `pull_request_target` default event policy is changing. The exact account's event policy / enforcement must be inspected before using it. Do **not** set any unsafe-PR-checkout override or disable event restrictions merely to force this to run.
3. The default `GITHUB_SHA` for `pull_request_target` is the PR **base** commit, not automatically the head/merge commit. A job's `success` must be proven to attach to the PR check GitHub Ruleset actually evaluates, for the latest PR SHA.
4. GitHub may treat required check conclusions `skipped` and `neutral` as successful. Avoid any job-level `if` that skips the required guard; test `pending/cancelled` handling in the actual UI and REST evidence.
5. Rulesets match check **names** and optionally GitHub App identity, NOT the workflow filename/event. A same-name check from a PR-modified workflow can be dangerous, especially if it shares the GitHub Actions app. Validate the exact check **source and commit attribution**, or prefer an independently controlled GitHub App / stronger native protection when this cannot be guaranteed. Do not claim GitHub Actions app binding alone proves distinct workflows.
6. `verify/rt-orch-approved-prs.json` does **not exist on main** (confirmed GitHub API 404); all unapproved C1 PRs must fail closed. A manifest placed inside an untrusted PR is not authorization.
7. The `issue_number` and `risk_class` fields are metadata; the guard does not authenticate the user's express approval or the issue author. An owner-controlled record is a prerequisite, not proven merely by a main-branch file if other agents may freely edit main through a PR.

## Safe, staged rollout — no automatic permission escalation
**R3 current completion condition:** offline regression, negative controls, GitHub rules and status model reviewed; candidate remains Draft. No main mutation.

**Preflight 1: owner approval procedure.** Specify *who* may create/revoke a C1 approval (the user, not Claude or GPT), how approved issue/PR/HEAD/paths are authenticated and recorded, and how user revocation works. Never trust a PR author-controlled CLI flag or PR body. Maintain evidence that the approval precedes execution.

**Preflight 2: maintenance escape route.** Define a separate owner-authorized maintenance route for guard/workflow/manifest changes. A guard that rejects every change to its own policy can lock the repo if made required before a maintenance path is ready. The current ruleset has `current_user_can_bypass=never`, so do not assume an owner bypass exists. Don't lower existing protection to escape this deadlock.

**Preflight 3: event/check semantics.** In a safely isolated trial, inspect Actions event-policy insights for `pull_request_target`; confirm that the trusted source ran from main, no untrusted HEAD checkout/execution, the check appeared on the PR, and GitHub considers it a valid required check for the exact latest HEAD or test-merge SHA. If it does not, stop and choose a different trusted check provider.

**Preflight 4: real adversarial evidence.** Show: approved C1 file PASS, protected Golden/workflow FAIL, unapproved policy file FAIL, duplicate PR FAIL, SHA update causes previous PASS invalidation, absent/pending/cancelled check does not permit merge, and spoofed duplicate check name does not bypass. Recheck real GitHub mergeability without actually merging.

**Preflight 5: order of installation.** Never add the new check as required until its trusted implementation, approval maintenance route, event availability, and check attribution are verified. Keep `full-suite` required throughout. Record before/after Ruleset snapshot and explicit user authorization for EACH main/ruleset change.

**GO/NO-GO:** Without a demonstrable, independently controlled approved-policy/update route and unspoofable/latest-SHA required check, the project must remain **NO-GO for unattended auto-merge**. Safe Draft PR creation with manual user review may continue; releases stay separately approved.

## Official references
- https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/troubleshooting-rules
