# RT-AUTO-RISK-06 — reproducibility

This package is intended to be extracted with its top-level directories under the same root. The runner assumes the extracted `rt_risk06_work`, `rt_risk_work`, and `RT_AUTO_ENGINE_V22_REVIEW` directories are siblings (the original research workspace layout). Node.js, Python 3 and Git CLI are required.

1. Run `python rt_risk06_work/analyze06.py` to reconstruct the 50 paired comparisons and summary from `raw/*.json`.
2. Run `python rt_risk06_work/verify06.py` to verify all 100 original worlds and independently replay two preselected 720-day worlds; this may take additional compute.
3. Run `python rt_risk06_work/run_batch06.py` to regenerate missing raw worlds; the script will preserve already-completed worlds. To regenerate all from scratch, use an empty separate `raw` directory and preserve this archive.

The policy and game source are fixed to commit `8b6ed6e6695e0d042836a54f301076c533b55d53`. This is an experimental policy comparison, NOT a deployed game release. The day-zero intervention assigns 60% player control without paying an acquisition price; it is not a trade-profit backtest. All 100 worlds run with direct EV2 events disabled; other stochastic mechanics remain.
