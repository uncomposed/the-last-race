"""Knockout test: does each optional mechanism earn its place?

Runs the full core and, for each mechanism in cfg["mech"], the same seeds
with that one mechanism switched off. A mechanism earns its place if removing
it changes a realism/interest check, an outcome share, or a paired metric by
more than 2 standard errors.

    python3 knockouts.py --seeds 300 --out results/v2_knockouts.json
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import core      # noqa: E402
import metrics   # noqa: E402
from run import paired_deltas  # noqa: E402


def run_rows(conf, seeds):
    return [metrics.run_metrics(core.World(s, conf).run()) for s in seeds]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", type=int, default=300)
    ap.add_argument("--out")
    a = ap.parse_args()
    seeds = list(range(a.seeds))
    base_rows = run_rows(core.make_base_config(), seeds)
    base = metrics.summarize(base_rows)
    checks = lambda s: {k: v["passed"] for k, v in {**s["patterns"], **s["interest"]}.items()}
    out = {"baseline": {"outcomes": base["outcomes"], "winners": base["winners"],
                        "checks": checks(base)}, "knockouts": {}}
    for mech in core.BASE_CONFIG["mech"]:
        conf = core.make_base_config()
        conf["cfg"]["mech"][mech] = False
        rows = run_rows(conf, seeds)
        summ = metrics.summarize(rows)
        pd = paired_deltas(base_rows, rows)
        sig = {k: v["mean"] for k, v in pd.items()
               if isinstance(v, dict) and v["se"] > 0 and abs(v["mean"]) > 2 * v["se"]}
        flips = [k for k, v in checks(summ).items() if v != checks(base)[k]]
        out["knockouts"][mech] = {"outcomes": summ["outcomes"], "winners": summ["winners"],
                                  "check_flips": flips, "significant_deltas": sig,
                                  "same_outcome_share": pd["same_outcome_share"]}
    text = json.dumps(out, indent=1)
    if a.out:
        with open(a.out, "w") as f:
            f.write(text)
    print(text)


if __name__ == "__main__":
    main()
