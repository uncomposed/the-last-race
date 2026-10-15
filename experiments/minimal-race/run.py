"""Run a paired experiment: baseline core vs one variant, same seeds.

    python3 run.py                                   # baseline only
    python3 run.py --variant variants/h01_x.py       # paired comparison
    python3 run.py --variant variants/h01_x.py --trace 7   # narrate one seed

A variant module may define either or both:
    make_config(base: dict) -> dict      # modify a deep copy of the base config
    class VariantWorld(core.World): ...   # override hook methods
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import statistics as st
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import core      # noqa: E402
import metrics   # noqa: E402


def load_variant(path):
    spec = importlib.util.spec_from_file_location("variant", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def build(mod, seed):
    conf = core.make_base_config()
    if mod is not None and hasattr(mod, "make_config"):
        conf = mod.make_config(conf)
    cls = getattr(mod, "VariantWorld", core.World) if mod is not None else core.World
    return cls(seed, conf)


def run_many(mod, seeds):
    rows = []
    for s in seeds:
        w = build(mod, s).run()
        rows.append(metrics.run_metrics(w))
    return rows


def paired_deltas(base_rows, var_rows):
    out = {}
    keys = ("outcome_t", "lead_changes", "frontier_gap_mean", "pacts_formed", "pact_breaks",
            "defect_quarters", "open_weights", "incidents", "disruptions", "bankruptcies",
            "sentiment_crashes", "strategy_switches", "public_max", "hazard_belief_err",
            "capex_gt_rev_q_first12")
    for k in keys:
        d = [v[k] - b[k] for b, v in zip(base_rows, var_rows)
             if b[k] is not None and v[k] is not None]
        if len(d) >= 2:
            out[k] = dict(mean=round(st.mean(d), 4), se=round(st.stdev(d) / len(d) ** 0.5, 4))
    cat = lambda r: 1 if (r["outcome"] or "").startswith("catastrophe") else 0
    d = [cat(v) - cat(b) for b, v in zip(base_rows, var_rows)]
    out["catastrophe_rate"] = dict(mean=round(st.mean(d), 4), se=round(st.stdev(d) / len(d) ** 0.5, 4))
    same = sum(1 for b, v in zip(base_rows, var_rows) if b["outcome"] == v["outcome"])
    out["same_outcome_share"] = round(same / len(base_rows), 3)
    return out


def trace(mod, seed):
    w = build(mod, seed).run()
    print(f"seed {seed} unknowns: " + ", ".join(f"{k}={v:.2f}" for k, v in w.unk.items()))
    for e in w.events:
        if e["kind"] == "switch":
            continue
        rest = {k: v for k, v in e.items() if k not in ("t", "kind")}
        print(f"  Q{e['t']:>2} {e['kind']:<18} {rest}")
    last = w.history[-1]
    print("final C:", last["C"])
    print("final S:", last["S"])
    print("final cash:", last["cash"])
    print("outcome:", w.outcome)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--variant")
    ap.add_argument("--seeds", type=int, default=300)
    ap.add_argument("--out")
    ap.add_argument("--trace", type=int)
    a = ap.parse_args()
    mod = load_variant(a.variant) if a.variant else None
    if a.trace is not None:
        trace(mod, a.trace)
        return
    seeds = list(range(a.seeds))
    base_rows = run_many(None, seeds)
    result = dict(baseline=metrics.summarize(base_rows))
    if mod is not None:
        var_rows = run_many(mod, seeds)
        result["variant"] = metrics.summarize(var_rows)
        result["paired_deltas"] = paired_deltas(base_rows, var_rows)
        result["variant_path"] = a.variant
    text = json.dumps(result, indent=1, default=str)
    if a.out:
        with open(a.out, "w") as f:
            f.write(text)
    print(text)


if __name__ == "__main__":
    main()
