"""h16 ablation: disable retaliation (sab_retal_p = 0), keep first strikes.

Three arms on seeds 0..299, paired by seed:
- base: core baseline (no variant)
- full: h16 as specified (retaliation on)
- ablate: h16 with sab_retal_p = 0 (strikes still happen, retaliation never fires)

Attribution of the takeoff delay: full minus ablate isolates the retaliation
spiral. ablate minus base shows what first strikes alone do.
Writes results/h16_ablation.json. Run from the minimal-race folder.
"""
import json
import os
import sys
import statistics as st
from collections import Counter
from types import SimpleNamespace

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
os.chdir(ROOT)

import run  # noqa: E402
import metrics  # noqa: E402

h16 = run.load_variant(os.path.join(ROOT, "variants", "h16_sabotage_spiral.py"))


def _no_retal(base):
    base = h16.make_config(base)
    base["cfg"]["sab_retal_p"] = 0.0  # World reads settings from base["cfg"]
    return base


ABL = SimpleNamespace(make_config=_no_retal, VariantWorld=h16.VariantWorld)


def ev_summary(w):
    sab = [e for e in w.events if e["kind"] == "sabotage"]
    ret = [e for e in w.events if e["kind"] == "retaliation"]
    return dict(
        n_sab=len(sab),
        n_ret=len(ret),
        K_lost=round(sum(e["lost"] for e in sab + ret), 3),
        first_sab_t=min((e["t"] for e in sab), default=None),
    )


def ms(xs):
    n = len(xs)
    if n == 0:
        return dict(n=0)
    m = st.mean(xs)
    se = st.stdev(xs) / n ** 0.5 if n > 1 else None
    return dict(n=n, mean=round(m, 4), se=None if se is None else round(se, 4),
                sig=bool(se is not None and abs(m) > 2 * se))


def main():
    seeds = list(range(300))
    arms = {"base": [], "full": [], "ablate": []}
    ev = {"full": [], "ablate": []}
    for s in seeds:
        wb = run.build(None, s).run()
        arms["base"].append(metrics.run_metrics(wb))
        wf = run.build(h16, s).run()
        arms["full"].append(metrics.run_metrics(wf))
        ev["full"].append(ev_summary(wf))
        wa = run.build(ABL, s).run()
        arms["ablate"].append(metrics.run_metrics(wa))
        ev["ablate"].append(ev_summary(wa))

    out = {}
    out["sanity_full_vs_base"] = run.paired_deltas(arms["base"], arms["full"])
    out["ablate_vs_base"] = run.paired_deltas(arms["base"], arms["ablate"])
    out["full_minus_ablate"] = run.paired_deltas(arms["ablate"], arms["full"])

    for arm in ("full", "ablate"):
        e = ev[arm]
        out[f"{arm}_share_seeds_with_strike"] = round(sum(x["n_sab"] > 0 for x in e) / len(e), 4)
        out[f"{arm}_mean_sabotage_per_seed"] = round(st.mean(x["n_sab"] for x in e), 3)
        out[f"{arm}_mean_retaliation_per_seed"] = round(st.mean(x["n_ret"] for x in e), 3)
        out[f"{arm}_mean_K_lost_per_seed"] = round(st.mean(x["K_lost"] for x in e), 3)
        out[f"{arm}_outcome_dist"] = dict(Counter(r["outcome"] for r in arms[arm]))
    out["base_outcome_dist"] = dict(Counter(r["outcome"] for r in arms["base"]))

    # Same first strike in both arms? Retaliation only fires after a detected strike,
    # so the first sabotage should match exactly.
    same_first = sum(f["first_sab_t"] == a["first_sab_t"]
                     for f, a in zip(ev["full"], ev["ablate"]))
    out["share_seeds_same_first_sabotage_t"] = round(same_first / len(seeds), 4)

    # Subset: seeds where the ablation had at least one strike.
    idx = [i for i, x in enumerate(ev["ablate"]) if x["n_sab"] > 0]
    d_ab = [arms["ablate"][i]["outcome_t"] - arms["base"][i]["outcome_t"] for i in idx]
    d_fa = [arms["full"][i]["outcome_t"] - arms["ablate"][i]["outcome_t"] for i in idx]
    out["struck_seeds_n"] = len(idx)
    out["struck_seeds_outcome_t_ablate_minus_base"] = ms(d_ab)
    out["struck_seeds_outcome_t_full_minus_ablate"] = ms(d_fa)

    path = os.path.join(ROOT, "results", "h16_ablation.json")
    with open(path, "w") as f:
        json.dump(out, f, indent=2, default=str)

    def show(label, d):
        for k in ("outcome_t", "catastrophe_rate", "open_weights", "sentiment_crashes"):
            if k in d:
                v = d[k]
                print(f"{label:24s} {k:20s} mean {v['mean']:+.4f} se {v['se']:.4f} sig {abs(v['mean']) > 2 * v['se']}")

    show("full_vs_base", out["sanity_full_vs_base"])
    show("ablate_vs_base", out["ablate_vs_base"])
    show("full_minus_ablate", out["full_minus_ablate"])
    for k in ("full_share_seeds_with_strike", "ablate_share_seeds_with_strike",
              "full_mean_sabotage_per_seed", "ablate_mean_sabotage_per_seed",
              "full_mean_retaliation_per_seed", "ablate_mean_retaliation_per_seed",
              "full_mean_K_lost_per_seed", "ablate_mean_K_lost_per_seed",
              "share_seeds_same_first_sabotage_t", "struck_seeds_n"):
        print(k, out[k])
    print("struck ablate_minus_base", out["struck_seeds_outcome_t_ablate_minus_base"])
    print("struck full_minus_ablate", out["struck_seeds_outcome_t_full_minus_ablate"])
    print("full dist", out["full_outcome_dist"])
    print("ablate dist", out["ablate_outcome_dist"])
    print("base dist", out["base_outcome_dist"])


if __name__ == "__main__":
    main()
