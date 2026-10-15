"""h16 analysis: sabotage and retaliation counts per seed, and whether the takeoff
delay concentrates in struck seeds.

Strike counts come from w.events (kinds "sabotage" and "retaliation"), which
metrics.py does not count. Paired deltas are variant minus baseline on the same
seeds, with se, and the rule |mean| > 2*se for "real".

Run from the minimal-race folder:
    python3 results/h16_analysis.py
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

VARIANT = os.path.join(ROOT, "variants", "h16_sabotage_spiral.py")
SEEDS = list(range(300))
OUT = os.path.join(HERE, "h16_analysis.json")


def mse(xs):
    if len(xs) < 2:
        return None, None
    return round(st.mean(xs), 4), round(st.stdev(xs) / len(xs) ** 0.5, 4)


def main():
    mod = run.load_variant(VARIANT)
    per = []
    for s in SEEDS:
        wb = run.build(None, s).run()
        wv = run.build(mod, s).run()
        rb, rv = metrics.run_metrics(wb), metrics.run_metrics(wv)
        ev = [e for e in wv.events if e["kind"] in ("sabotage", "retaliation")]
        sab = [e for e in ev if e["kind"] == "sabotage"]
        ret = [e for e in ev if e["kind"] == "retaliation"]
        per.append(dict(
            seed=s,
            n_sab=len(sab), n_ret=len(ret),
            n_det=sum(1 for e in ev if e["detected"]),
            lost=round(sum(e["lost"] for e in ev), 2),
            d_t=(None if rv["outcome_t"] is None or rb["outcome_t"] is None
                 else rv["outcome_t"] - rb["outcome_t"]),
            d_cat=(1 if (rv["outcome"] or "").startswith("catastrophe") else 0)
                  - (1 if (rb["outcome"] or "").startswith("catastrophe") else 0),
        ))

    n = len(per)
    struck = [p for p in per if p["n_sab"] + p["n_ret"] > 0]
    unstruck = [p for p in per if p["n_sab"] + p["n_ret"] == 0]
    dt_struck = [p["d_t"] for p in struck if p["d_t"] is not None]
    dt_unstruck = [p["d_t"] for p in unstruck if p["d_t"] is not None]
    dt_all = [p["d_t"] for p in per if p["d_t"] is not None]

    summary = dict(
        n=n,
        share_seeds_with_sabotage=round(sum(p["n_sab"] > 0 for p in per) / n, 3),
        share_seeds_with_retaliation=round(sum(p["n_ret"] > 0 for p in per) / n, 3),
        share_seeds_with_detected_strike=round(sum(p["n_det"] > 0 for p in per) / n, 3),
        mean_sabotage_per_seed=round(st.mean(p["n_sab"] for p in per), 3),
        mean_retaliation_per_seed=round(st.mean(p["n_ret"] for p in per), 3),
        mean_K_destroyed_per_seed=round(st.mean(p["lost"] for p in per), 3),
        outcome_t_delta_all=dict(zip(("mean", "se"), mse(dt_all))),
        outcome_t_delta_struck_seeds=dict(n=len(struck), **dict(zip(("mean", "se"), mse(dt_struck)))),
        outcome_t_delta_unstruck_seeds=dict(n=len(unstruck), **dict(zip(("mean", "se"), mse(dt_unstruck)))),
        catastrophe_delta_struck_seeds=dict(zip(("mean", "se"), mse([p["d_cat"] for p in struck]))),
        catastrophe_delta_unstruck_seeds=dict(zip(("mean", "se"), mse([p["d_cat"] for p in unstruck]))),
    )
    # Dose response: does more destruction line up with later takeoff?
    xs = [p["lost"] for p in per if p["d_t"] is not None]
    ys = [p["d_t"] for p in per if p["d_t"] is not None]
    if len(xs) > 2 and st.pstdev(xs) > 0 and st.pstdev(ys) > 0:
        mx, my = st.mean(xs), st.mean(ys)
        cov = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / len(xs)
        summary["corr_K_destroyed_vs_outcome_t_delta"] = round(cov / (st.pstdev(xs) * st.pstdev(ys)), 3)

    with open(OUT, "w") as f:
        json.dump(dict(summary=summary, per_seed=per), f, indent=1)
    print(json.dumps(summary, indent=1))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
