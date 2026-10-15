"""Power-binding stats for H15, computed from w.events over the same 300 seeds.
Run from minimal-race/: python3 results/h15_power_stats.py
"""
import json
import os
import statistics as st
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

import run  # noqa: E402

mod = run.load_variant(os.path.join(ROOT, "variants", "h15_power_constraint.py"))
out = {}
for b in ("A", "B"):
    seeds_bind, q_counts, first_q, excess_end = 0, [], [], []
    for s in range(300):
        w = run.build(mod, s).run()
        pb = [e for e in w.events if e["kind"] == "power_bind" and e["bloc"] == b]
        if pb:
            seeds_bind += 1
            q_counts.append(len(pb))
            first_q.append(pb[0]["t"])
            excess_end.append(pb[-1]["excess"])
    out[b] = dict(
        seeds_with_bind=seeds_bind,
        share_seeds_with_bind=round(seeds_bind / 300, 3),
        median_binding_quarters_when_bind=st.median(q_counts) if q_counts else None,
        median_first_bind_q=st.median(first_q) if first_q else None,
        median_last_excess_when_bind=round(st.median(excess_end), 3) if excess_end else None,
    )
path = os.path.join(HERE, "h15_power_stats.json")
with open(path, "w") as f:
    json.dump(out, f, indent=1)
print(json.dumps(out, indent=1))
