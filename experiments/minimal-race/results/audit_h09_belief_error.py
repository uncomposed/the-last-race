"""h09 analysis: rival-capability belief error and takeoff timing, baseline vs variant.

Metric not in metrics.py, so computed here (see variants/README.md).

  rival_belief_err (per seed) = mean over ordered lab pairs (a, b), a != b,
      of |beliefs[a].cap[b].mu - labs[b].deployed_C|, read at end of run.

Also reports paired deltas (variant minus baseline, same seeds) with se,
and the rule |mean| > 2*se for "real".

Run from the minimal-race folder:
    python3 results/h09_belief_error.py
"""
import json
import os
import statistics as st
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "variants"))

import run      # noqa: E402
import metrics  # noqa: E402

VARIANT = os.path.join(ROOT, "variants", "h09_strategic_benchmarks.py")
SEEDS = list(range(300))


def rival_belief_err(w):
    errs = []
    for a in w.labs:
        B = w.beliefs[a]
        for b, est in B.cap.items():
            if b in w.labs and b != a:
                errs.append(abs(est.mu - w.labs[b].deployed_C))
    return st.mean(errs) if errs else None


def collect(mod):
    rows = []
    for s in SEEDS:
        w = run.build(mod, s).run()
        m = metrics.run_metrics(w)
        m["rival_belief_err"] = rival_belief_err(w)
        m["takeoff_t"] = float(m["outcome_t"]) if m["outcome"] != "no_takeoff" else 45.0
        rows.append(m)
    return rows


def paired(base, var, key):
    d = [v[key] - b[key] for b, v in zip(base, var)
         if b[key] is not None and v[key] is not None]
    mean = st.mean(d)
    se = st.stdev(d) / len(d) ** 0.5
    return dict(n=len(d), mean=round(mean, 4), se=round(se, 4),
                real=abs(mean) > 2 * se)


def level(rows, key):
    xs = [r[key] for r in rows if r[key] is not None]
    return dict(n=len(xs), mean=round(st.mean(xs), 4),
                se=round(st.stdev(xs) / len(xs) ** 0.5, 4))


def main():
    base = collect(None)
    var = collect(run.load_variant(VARIANT))
    out = dict(
        variant_path="variants/h09_strategic_benchmarks.py",
        seeds="0..299",
        levels=dict(
            baseline=dict(rival_belief_err=level(base, "rival_belief_err"),
                          takeoff_t=level(base, "takeoff_t")),
            variant=dict(rival_belief_err=level(var, "rival_belief_err"),
                         takeoff_t=level(var, "takeoff_t")),
        ),
        paired=dict(
            rival_belief_err=paired(base, var, "rival_belief_err"),
            takeoff_t=paired(base, var, "takeoff_t"),
        ),
    )
    text = json.dumps(out, indent=1)
    with open(os.path.join(HERE, "audit_h09_belief_error.json"), "w") as f:
        f.write(text)
    print(text)


if __name__ == "__main__":
    main()
