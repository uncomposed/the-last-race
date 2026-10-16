"""Core v3: depreciation on vs off (= core v2), paired on the same seeds.

Reports outcome and winner shares, every realism/interest check value, and
paired deltas (v3 minus v2) for the run metrics plus frontier wins, bloc-B
wins and catastrophe. Optional --set overrides a cfg value in the v3 arm only
(for calibration on seeds 0-299).

    python3 results/v3_depreciation.py --start 0 --seeds 300
    python3 results/v3_depreciation.py --start 1000 --seeds 1000 --out results/v3_depreciation_heldout.json
"""
import argparse
import json
import os
import statistics as st
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)
import core      # noqa: E402
import metrics   # noqa: E402
from run import paired_deltas  # noqa: E402


def rows(seeds, dep, overrides=()):
    conf = core.make_base_config()
    conf["cfg"]["mech"]["depreciation"] = dep
    for k, v in overrides:
        conf["cfg"][k] = v
    out = []
    for s in seeds:
        m = metrics.run_metrics(core.World(s, conf).run())
        m["frontier_win"] = int(m["winner"] == "frontier")
        m["bloc_b_win"] = int(m["winner"] in ("challenger", "state"))
        m["catastrophe"] = int((m["outcome"] or "").startswith("catastrophe"))
        out.append(m)
    return out


def se(d):
    return st.stdev(d) / len(d) ** 0.5


def brief(summ):
    checks = {k: dict(value=v["value"], passed=v["passed"])
              for k, v in {**summ["patterns"], **summ["interest"]}.items()}
    return dict(outcomes=summ["outcomes"], winners=summ["winners"],
                patterns_passed=summ["patterns_passed"], interest_passed=summ["interest_passed"],
                checks=checks, means=summ["means"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", type=int, default=0)
    ap.add_argument("--seeds", type=int, default=300)
    ap.add_argument("--set", nargs=2, action="append", default=[], metavar=("KEY", "VALUE"),
                    help="override a cfg value in the depreciation arm")
    ap.add_argument("--out")
    a = ap.parse_args()
    seeds = list(range(a.start, a.start + a.seeds))
    over = [(k, float(v)) for k, v in a.set]
    v2, v3 = rows(seeds, False), rows(seeds, True, over)
    pd = paired_deltas(v2, v3)
    for k in ("frontier_win", "bloc_b_win", "catastrophe"):
        d = [y[k] - x[k] for x, y in zip(v2, v3)]
        pd[k] = dict(mean=round(st.mean(d), 4), se=round(se(d), 4))
    pd["same_outcome_and_winner"] = round(sum(x["outcome"] == y["outcome"] and x["winner"] == y["winner"]
                                              for x, y in zip(v2, v3)) / len(seeds), 3)
    out = dict(seeds=[seeds[0], seeds[-1]], overrides=dict(over),
               v2=brief(metrics.summarize(v2)), v3=brief(metrics.summarize(v3)), paired_v3_minus_v2=pd)
    text = json.dumps(out, indent=1, default=str)
    if a.out:
        with open(a.out, "w") as f:
            f.write(text)
    print(text)


if __name__ == "__main__":
    main()
