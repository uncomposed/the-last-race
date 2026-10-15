"""Mechanism check for h19 (herding). Not part of the fixed metrics.

Runs baseline and variant on the same seeds and measures:
  - imitate events, and how many of them actually change a template
  - switch events, and the share that happen in a quarter with >=2 switches
  - boom-bust: quarters with a one-quarter sentiment drop >25%, and max drawdown
Usage: python3 results/h19_sync_check.py variants/h19_imitation_decisions.py 300
"""
import json
import os
import statistics as st
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

import run  # noqa: E402

variant_path = os.path.join(ROOT, sys.argv[1]) if len(sys.argv) > 1 else None
n = int(sys.argv[2]) if len(sys.argv) > 2 else 300
seeds = range(n)


def stats(world):
    ev = world.events
    imit = [e for e in ev if e["kind"] == "imitate"]
    imit_changes = [e for e in imit if e["frm"] != e["to"]]
    sw = [e for e in ev if e["kind"] == "switch"]
    per_q = Counter(e["t"] for e in sw)
    sync_sw = sum(1 for e in sw if per_q[e["t"]] >= 2)
    sent = [h.get("sentiment") for h in world.history]
    sent = [s for s in sent if s is not None]
    crash_q = 0
    peak, mdd = None, 0.0
    for a, b in zip(sent, sent[1:]):
        if a and b / a < 0.75:
            crash_q += 1
    for s in sent:
        peak = s if peak is None else max(peak, s)
        if peak:
            mdd = max(mdd, 1 - s / peak)
    return dict(
        imitate=len(imit),
        imitate_changes=len(imit_changes),
        switches=len(sw),
        switch_in_multi_quarters=sync_sw,
        sentiment_crash_quarters=crash_q,
        max_drawdown=mdd,
    )


base_rows, var_rows = [], []
mod = run.load_variant(variant_path)
for s in seeds:
    base_rows.append(stats(run.build(None, s).run()))
    var_rows.append(stats(run.build(mod, s).run()))


def summ(rows):
    keys = rows[0].keys()
    return {k: round(st.mean(r[k] for r in rows), 4) for k in keys}


def paired(k):
    d = [v[k] - b[k] for b, v in zip(base_rows, var_rows)]
    return dict(mean=round(st.mean(d), 4), se=round(st.stdev(d) / len(d) ** 0.5, 4))


out = dict(
    n=len(list(seeds)),
    baseline=summ(base_rows),
    variant=summ(var_rows),
    paired={k: paired(k) for k in base_rows[0].keys()},
)
dst = os.path.join(HERE, "h19_sync_check.json")
with open(dst, "w") as f:
    json.dump(out, f, indent=1)
print(json.dumps(out, indent=1))
