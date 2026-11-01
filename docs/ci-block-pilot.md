# CI block pilot (AUTO-SETUP-11)

Experiment record only; this file changes no game behaviour.

- Purpose: check that the ruleset `main-ci-protection` blocks a PR to `main` while the required check `full-suite` fails, and lets it through again once the cause is removed.
- Run 1: `tests/t_ci_guard_probe.js` (comments only) is added but not registered in `tests/run.py` → the CI registration check must fail `full-suite`.
- Run 2: the probe file is removed (this document stays) → `full-suite` must pass again.
- The pilot PR is closed without merging. Branch `exp/rt-ci-block-01` and its Actions logs are kept as evidence.
