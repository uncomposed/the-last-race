"""h18 analysis: safety-lab influence under spillover, and takeoff timing.

metrics.py does not compute these. This script re-runs seeds 0..299 for the
baseline and both spillover rates, reads each variant world's spill_emit and
history, and writes results/h18_analysis.json.

    cd experiments/minimal-race
    python3 results/h18_analysis.py
"""
import collections
import importlib.util
import json
import os
import statistics as st
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
EXP = os.path.dirname(HERE)
sys.path.insert(0, EXP)
import run  # noqa: E402  (run.build applies make_config and VariantWorld)

SEEDS = 300
TAKEOFF = {"catastrophe_takeoff", "unipolar", "multipolar"}


def load(name):
    path = os.path.join(EXP, "variants", name)
    spec = importlib.util.spec_from_file_location(name[:-3], path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


ARMS = {"base": None, "r03": load("h18_safety_spillover.py"), "r06": load("h18b_safety_spillover.py")}


def is_cat(r):
    return (r["outcome"] or "").startswith("catastrophe")


def per_seed(mod, seed):
    w = run.build(mod, seed).run()
    res = dict(outcome=(w.outcome or {}).get("kind"), outcome_t=(w.outcome or {}).get("t"))
    if mod is None:
        return res
    emit = w.spill_emit
    tot = sum(emit.values())
    c0 = w.history[0]["C"]
    res.update(
        n_spill=sum(1 for e in w.events if e["kind"] == "spillover"),
        exported_safety=emit["safety"],
        exported_total=tot,
        safety_emit_share=(emit["safety"] / tot) if tot > 0 else None,
        safety_C0_share=c0["safety"] / sum(c0.values()),
        safety_rank_C0=1 + sum(1 for n, c in c0.items() if n != "safety" and c > c0["safety"]),
    )
    return res


def mean(xs):
    xs = [x for x in xs if x is not None]
    return round(st.mean(xs), 4) if xs else None


def paired_takeoff(base, var):
    d = [v["outcome_t"] - b["outcome_t"] for b, v in zip(base, var)
         if b["outcome"] in TAKEOFF and v["outcome"] in TAKEOFF]
    if len(d) < 2:
        return dict(n=len(d), mean=None, se=None)
    return dict(n=len(d), mean=round(st.mean(d), 4), se=round(st.stdev(d) / len(d) ** 0.5, 4))


def paired_cat(base, var):
    d = [(1 if is_cat(v) else 0) - (1 if is_cat(b) else 0) for b, v in zip(base, var)]
    return dict(mean=round(st.mean(d), 4), se=round(st.stdev(d) / len(d) ** 0.5, 4))


results = {name: [per_seed(mod, s) for s in range(SEEDS)] for name, mod in ARMS.items()}
base = results["base"]
out = {"baseline_check": dict(outcome_t_mean=mean([r["outcome_t"] for r in base]),
                              catastrophe_rate=mean([1.0 if is_cat(r) else 0.0 for r in base]))}
for name in ("r03", "r06"):
    var = results[name]
    cat = paired_cat(base, var)
    ratios = [v["safety_emit_share"] / v["safety_C0_share"] for v in var if v["safety_emit_share"] is not None]
    out[name] = dict(
        rate=ARMS[name].RATE,
        spillover_events_mean=mean([v["n_spill"] for v in var]),
        exported_safety_mean=mean([v["exported_safety"] for v in var]),
        exported_total_mean=mean([v["exported_total"] for v in var]),
        safety_emit_share_mean=mean([v["safety_emit_share"] for v in var]),
        safety_C0_share_mean=mean([v["safety_C0_share"] for v in var]),
        influence_ratio_mean=round(st.mean(ratios), 3) if ratios else None,
        safety_rank_C0_counts=dict(sorted(collections.Counter(v["safety_rank_C0"] for v in var).items())),
        catastrophe_rate=mean([1.0 if is_cat(v) else 0.0 for v in var]),
        catastrophe_delta=cat,
        catastrophe_sig=abs(cat["mean"]) > 2 * cat["se"],
        takeoff_outcome_t_paired=paired_takeoff(base, var),
    )
    t = out[name]["takeoff_outcome_t_paired"]
    t["sig"] = (t["mean"] is not None) and abs(t["mean"]) > 2 * t["se"]
path = os.path.join(HERE, "h18_analysis.json")
with open(path, "w") as f:
    json.dump(out, f, indent=1)
print(json.dumps(out, indent=1))
print("wrote", path)
