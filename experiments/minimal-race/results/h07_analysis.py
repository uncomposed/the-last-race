"""h07 analysis: signed lab vs government hazard beliefs over time, paired.

Run from the minimal-race folder:
    python3 results/h07_analysis.py
Writes results/h07_analysis.json. Uses history["hazard_belief"], normalized by hz_hi.
"""
import json
import os
import statistics as st
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

import run  # noqa: E402

SEEDS = range(300)
CHECK_T = [0, 4, 8, 12, 16, 20, 24, 28, 32]


def series(mod):
    """Return per-seed: {t: (lab_mean_norm, gov_mean_norm, lab_gov_gap, true_norm)} and end-state info."""
    out = []
    for s in SEEDS:
        w = run.build(mod, s).run()
        hz_hi = w.cfg["unknowns"]["hazard"][1]
        true_h = w.unk["hazard"] / hz_hi
        per_t = {}
        for q in w.history:
            hb = q["hazard_belief"]
            labs = [hb[n] / hz_hi for n in w.labs if n in hb]
            govs = [hb[n] / hz_hi for n in ("govA", "govB") if n in hb]
            if not labs or not govs:
                continue
            lm, gm = st.mean(labs), st.mean(govs)
            per_t[q["t"]] = dict(lab=lm, gov=gm, gap=lm - gm)
        last = w.history[-1]["hazard_belief"]
        end_lab = st.mean(last[n] / hz_hi for n in w.labs if n in last)
        end_gov = st.mean(last[n] / hz_hi for n in ("govA", "govB") if n in last)
        out.append(dict(seed=s, true=true_h, per_t=per_t,
                        end_lab_signed=end_lab - true_h, end_gov_signed=end_gov - true_h))
    return out


def agg(rows, key):
    vals = [r["per_t"][key] for r in rows if key in r["per_t"]]
    return vals


def summarize(rows):
    res = {}
    for t in CHECK_T:
        cells = [r["per_t"][t] for r in rows if t in r["per_t"]]
        if len(cells) < 2:
            continue
        res[t] = dict(
            n=len(cells),
            lab=round(st.mean(c["lab"] for c in cells), 4),
            gov=round(st.mean(c["gov"] for c in cells), 4),
            gap=round(st.mean(c["gap"] for c in cells), 4),
        )
    res["end_lab_signed_err"] = round(st.mean(r["end_lab_signed"] for r in rows), 4)
    res["end_gov_signed_err"] = round(st.mean(r["end_gov_signed"] for r in rows), 4)
    return res


def paired(base, var):
    """Mean and se of variant minus baseline on same seeds, per checkpoint gap and end signed errors."""
    out = {}
    for t in CHECK_T:
        d = [v["per_t"][t]["gap"] - b["per_t"][t]["gap"]
             for b, v in zip(base, var) if t in b["per_t"] and t in v["per_t"]]
        if len(d) >= 2:
            out[f"gap_t{t}"] = dict(mean=round(st.mean(d), 4), se=round(st.stdev(d) / len(d) ** 0.5, 4))
    for k in ("end_lab_signed", "end_gov_signed"):
        d = [v[k] - b[k] for b, v in zip(base, var)]
        out[k] = dict(mean=round(st.mean(d), 4), se=round(st.stdev(d) / len(d) ** 0.5, 4))
    return out


def main():
    mod = run.load_variant(os.path.join(ROOT, "variants", "h07_motivated_reasoning.py"))
    base = series(None)
    var = series(mod)
    result = dict(
        baseline=summarize(base),
        variant=summarize(var),
        paired=paired(base, var),
    )
    with open(os.path.join(HERE, "h07_analysis.json"), "w") as f:
        json.dump(result, f, indent=1)
    print(json.dumps(result, indent=1))


if __name__ == "__main__":
    main()
