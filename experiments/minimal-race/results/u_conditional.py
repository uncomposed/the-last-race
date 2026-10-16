"""Round 3: effects conditional on a mechanism actually firing.

For each mechanism alone (and all five together), split seeds by whether the
mechanism fired, and report paired deltas (variant minus baseline) within
each group. Seeds are the same as u_analysis.py.

    python3 results/u_conditional.py --start 1000 --seeds 1000 --out results/u_conditional_heldout.json
"""
import argparse
import json
import os
import statistics as st
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.argv, _argv = sys.argv[:1], sys.argv
import u_analysis as A   # noqa: E402
sys.argv = _argv

FIRED = {
    "supply_shock": lambda r: r["n_supply_shock"] > 0,
    "blockade": lambda r: r["shock_cause"] == "blockade",
    "accident": lambda r: r["shock_cause"] == "accident",
    "targeted_scrutiny": lambda r: "frontier" in r["decree_labs"],
    "seizure": lambda r: any(lab == "frontier" for _, lab in r["seized"]),
    "governance": lambda r: any(lab == "frontier" for lab, _ in r["crisis_detail"]),
    "king": lambda r: any(a[1] == "frontier" and a[3] for a in r["attacks"]),
}
MECH_OF = {"blockade": "supply_shock", "accident": "supply_shock"}
KEYS = ("frontier_win", "bloc_b_win", "catastrophe", "frontier_leads_end")


def group(base, var, idx):
    out = dict(n=len(idx))
    for k in KEYS:
        d = [var[i][k] - base[i][k] for i in idx]
        out[k] = dict(mean=round(st.mean(d), 3), se=round(A.se(d), 3)) if len(d) > 1 else None
    d = [(var[i]["outcome_t"] or 0) - (base[i]["outcome_t"] or 0) for i in idx]
    out["outcome_t"] = dict(mean=round(st.mean(d), 3), se=round(A.se(d), 3)) if len(d) > 1 else None
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", type=int, default=500)
    ap.add_argument("--start", type=int, default=0, help="first seed")
    ap.add_argument("--out")
    a = ap.parse_args()
    seeds = list(range(a.start, a.start + a.seeds))
    base = A.rows(seeds, base=True)
    allr = A.rows(seeds)
    singles = {m: A.rows(seeds, only={m}) for m in A.U.UNSEAT}
    out = {}
    for name, fired in FIRED.items():
        var = singles[MECH_OF.get(name, name)]
        yes = [i for i, r in enumerate(var) if fired(r)]
        no = [i for i, r in enumerate(var) if not fired(r)]
        yes_all = [i for i, r in enumerate(allr) if fired(r)]
        out[name] = dict(alone_fired=group(base, var, yes), alone_not_fired=group(base, var, no),
                         all_fired=group(base, allr, yes_all))
    text = json.dumps(out, indent=1)
    if a.out:
        with open(a.out, "w") as f:
            f.write(text)
    print(text)


if __name__ == "__main__":
    main()
