"""H06 analysis: catastrophe rate in high-hazard seeds, paired on the same seeds.

Run from the experiment folder:
    python3 results/h06_analysis.py
Writes results/h06_analysis.json.
"""
import json
import os
import statistics as st
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

import run     # noqa: E402
import metrics  # noqa: E402

SEEDS = list(range(300))
VARIANTS = {
    "h06_stubborn": os.path.join(ROOT, "variants", "h06_filter_strength.py"),
    "h06b_bayesian": os.path.join(ROOT, "variants", "h06b_bayesian_filter.py"),
}


def is_cat(row):
    return 1 if (row["outcome"] or "").startswith("catastrophe") else 0


def paired(base, var):
    d = [is_cat(v) - is_cat(b) for b, v in zip(base, var)]
    return dict(mean=round(st.mean(d), 4), se=round(st.stdev(d) / len(d) ** 0.5, 4), n=len(d))


def main():
    base_rows = run.run_many(None, SEEDS)
    hazards = {s: r["unknowns"]["hazard"] for s, r in zip(SEEDS, base_rows)}
    cutoff = sorted(hazards.values())[2 * len(SEEDS) // 3]
    top = [i for i, s in enumerate(SEEDS) if hazards[s] >= cutoff]
    out = dict(seeds=len(SEEDS), top_third_hazard_cutoff=round(cutoff, 4), top_third_n=len(top))
    out["baseline_catastrophe_rate_all"] = round(st.mean(is_cat(r) for r in base_rows), 4)
    out["baseline_catastrophe_rate_top"] = round(st.mean(is_cat(base_rows[i]) for i in top), 4)
    for name, path in VARIANTS.items():
        mod = run.load_variant(path)
        var_rows = run.run_many(mod, SEEDS)
        b_top = [base_rows[i] for i in top]
        v_top = [var_rows[i] for i in top]
        out[name] = dict(
            catastrophe_delta_all=paired(base_rows, var_rows),
            catastrophe_delta_top_third=paired(b_top, v_top),
            variant_catastrophe_rate_top=round(st.mean(is_cat(r) for r in v_top), 4),
            variant_hazard_spread_median=round(st.median(r["hazard_belief_spread"] for r in var_rows), 4),
            baseline_hazard_spread_median=round(st.median(r["hazard_belief_spread"] for r in base_rows), 4),
        )
    text = json.dumps(out, indent=1, default=str)
    with open(os.path.join(HERE, "h06_analysis.json"), "w") as f:
        f.write(text)
    print(text)


if __name__ == "__main__":
    main()
