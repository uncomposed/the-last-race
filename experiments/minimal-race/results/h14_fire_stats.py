"""h14a fire statistics: how often and when the bloc-B merge triggers across seeds.

    python3 results/h14_fire_stats.py

Reads only events and final state from the variant world. Writes nothing.
"""
import json
import os
import statistics as st
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "variants"))

import core                       # noqa: E402
import run                        # noqa: E402

mod = run.load_variant(os.path.join(os.path.dirname(HERE), "variants", "h14_consolidation.py"))
seeds = range(300)
fired, qs, absorbed, outcome_fired, outcome_base = [], [], [], {}, {}
base_rows = {r["seed"]: r for r in run.run_many(None, seeds)}
for s in seeds:
    w = run.build(mod, s).run()
    merges = [e for e in w.events if e["kind"] == "consolidate"]
    if merges:
        fired.append(s)
        qs.append(merges[0]["t"])
        absorbed.append(sum(1 for e in w.events if e["kind"] == "merged"))
        k = (w.outcome or {}).get("kind")
        outcome_fired[k] = outcome_fired.get(k, 0) + 1
    else:
        k = (w.outcome or {}).get("kind")
        outcome_base[k] = outcome_base.get(k, 0) + 1

res = dict(
    seeds=len(list(seeds)),
    fired_seeds=len(fired),
    fire_share=round(len(fired) / 300, 3),
    fire_quarter_median=st.median(qs) if qs else None,
    fire_quarter_min=min(qs) if qs else None,
    fire_quarter_max=max(qs) if qs else None,
    absorbed_labs_median=st.median(absorbed) if absorbed else None,
    outcomes_when_fired=dict(sorted(outcome_fired.items(), key=str)),
    outcomes_when_not_fired=dict(sorted(outcome_base.items(), key=str)),
)
print(json.dumps(res, indent=1))
