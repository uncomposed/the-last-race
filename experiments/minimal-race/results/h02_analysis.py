"""Paired analysis for h02: metrics not in paired_deltas, plus the 2-se rule.

Run from the minimal-race folder:
    python3 results/h02_analysis.py > results/h02_analysis.txt
"""
import os
import statistics as st
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

import run       # noqa: E402
import metrics   # noqa: E402

mod = run.load_variant(os.path.join(ROOT, "variants", "h02_prediction_market.py"))
seeds = list(range(300))
base = run.run_many(None, seeds)
var = run.run_many(mod, seeds)


def paired(key):
    d = [v[key] - b[key] for b, v in zip(base, var)
         if b.get(key) is not None and v.get(key) is not None]
    if len(d) < 2:
        return None
    m = st.mean(d)
    se = st.stdev(d) / len(d) ** 0.5
    return m, se, len(d)


print("key, mean_delta, se, |mean|/se, passes_2se")
for k in ("hazard_belief_err", "hazard_belief_spread", "regulate_events",
          "subsidy_events", "export_controls", "strategy_switches", "outcome_t"):
    r = paired(k)
    if r is None:
        print(f"{k}: missing in rows")
        continue
    m, se, n = r
    if se == 0:
        print(f"{k}, {m:.4f}, {se:.4f}, n/a, no (zero variance across seeds)  (n={n})")
        continue
    ratio = abs(m) / se
    print(f"{k}, {m:.4f}, {se:.4f}, {ratio:.2f}, {'yes' if ratio > 2 else 'no'}  (n={n})")
