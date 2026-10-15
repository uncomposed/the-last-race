"""h17 analysis: unipolar share and takeoff timing split by automation-unknown terciles.

Rebuilds baseline and variant worlds (run.py does not return them) so per-seed
hidden automation values and auto_detect events are available.
    python3 results/h17_analysis.py > results/h17_analysis_stdout.txt
"""
import json
import os
import statistics as st
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

import run       # noqa: E402
import metrics   # noqa: E402

VARIANT = os.path.join(ROOT, "variants", "h17_learn_automation.py")
SEEDS = range(300)


def collect(mod):
    rows = []
    for s in SEEDS:
        w = run.build(mod, s).run()
        r = metrics.run_metrics(w)
        r["seed"] = s
        r["automation"] = w.unk["automation"]
        r["detected"] = any(e["kind"] == "auto_detect" for e in w.events)
        rows.append(r)
    return rows


def group_stats(rows):
    n = len(rows)
    uni = sum(1 for r in rows if r["outcome"] == "unipolar") / n if n else None
    tk = [r["outcome_t"] for r in rows
          if r["outcome"] not in (None, "no_takeoff") and r["outcome_t"] is not None]
    return dict(n=n,
                unipolar_share=round(uni, 3) if uni is not None else None,
                takeoff_n=len(tk),
                takeoff_t_mean=round(st.mean(tk), 2) if tk else None,
                takeoff_t_median=round(st.median(tk), 2) if tk else None,
                detected_share=round(sum(r["detected"] for r in rows) / n, 3) if n else None)


def main():
    base = collect(None)
    mod = run.load_variant(VARIANT)
    var = collect(mod)
    # Terciles on the hidden automation value, shared across arms (same seeds).
    autos = sorted(r["automation"] for r in base)
    t1, t2 = autos[len(autos) // 3], autos[2 * len(autos) // 3]

    def bucket(a):
        return "low" if a < t1 else ("mid" if a < t2 else "high")

    out = dict(cut_points=[round(t1, 3), round(t2, 3)], terciles={})
    for label in ("low", "mid", "high"):
        bi = [r for r in base if bucket(r["automation"]) == label]
        vi = [r for r in var if bucket(r["automation"]) == label]
        out["terciles"][label] = dict(baseline=group_stats(bi), variant=group_stats(vi))
    out["all"] = dict(baseline=group_stats(base), variant=group_stats(var))
    # Detection as a function of automation value, for the mechanism check.
    out["detected_by_tercile"] = {
        label: sum(1 for r in var if bucket(r["automation"]) == label and r["detected"])
        for label in ("low", "mid", "high")
    }
    text = json.dumps(out, indent=1)
    with open(os.path.join(HERE, "h17_analysis.json"), "w") as f:
        f.write(text)
    print(text)


if __name__ == "__main__":
    main()
