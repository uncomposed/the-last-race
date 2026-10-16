"""Round 3 diagnostic: why does the supply shock barely matter?

Hypothesis: the shock only cuts new chip purchases, and core v2 has no
depreciation, so installed compute carries a lab through. Arms (same seeds):

    calm        supply_shock on but no shock ever fires (natural hazard 0, no blockade)
    early       a forced deep shock at quarter 4 (depth 0.85, 12 quarters)
    calm+dep    as calm, plus 5%/quarter depreciation of installed compute (~5-year life)
    early+dep   as early, plus the same depreciation

Depreciation is a diagnostic, not a proposed core change: it alters every
other dynamic too, so only the within-pair contrast is meaningful.

    python3 results/u_supply_diag.py --start 1000 --seeds 1000 --out results/u_supply_diag_heldout.json
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
import core              # noqa: E402
import metrics           # noqa: E402


def make(force, dep):
    class W(A.U.VariantWorld):
        def compute_market(self):
            if force and self.t == 4 and self.shock is None:
                self.start_shock("forced", (0.85, 0.85))
                self.shock["end"] = self.t + 12
            return super().compute_market()

        def maybe_blockade(self):
            return

        def accounting(self):
            if dep:
                for l in self.live_labs():
                    l.K *= 1 - dep
            super().accounting()
    return W


def run(seeds, force, dep):
    out = []
    for s in seeds:
        conf = A.U.make_config(core.make_base_config(), only={"supply_shock"})
        conf["cfg"]["mech"]["depreciation"] = False   # round 3 ran on core v2; dep is applied below
        conf["cfg"]["unknowns"]["chokepoint_hazard"] = (0.0, 0.0)
        w = make(force, dep)(s, conf).run()
        m = metrics.run_metrics(w)
        m.update(A.unseat_metrics(w))
        out.append(m)
    return out


def contrast(a, b):
    res = {}
    for k in ("frontier_win", "bloc_b_win", "catastrophe"):
        d = [y[k] - x[k] for x, y in zip(a, b)]
        res[k] = dict(mean=round(st.mean(d), 3), se=round(A.se(d), 3))
    d = [(y["outcome_t"] or 0) - (x["outcome_t"] or 0) for x, y in zip(a, b)]
    res["outcome_t"] = dict(mean=round(st.mean(d), 3), se=round(A.se(d), 3))
    res["same_outcome"] = round(sum(x["outcome"] == y["outcome"] and x["winner"] == y["winner"]
                                    for x, y in zip(a, b)) / len(a), 3)
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", type=int, default=500)
    ap.add_argument("--start", type=int, default=0, help="first seed")
    ap.add_argument("--dep", type=float, default=0.05)
    ap.add_argument("--out")
    a = ap.parse_args()
    seeds = list(range(a.start, a.start + a.seeds))
    calm, early = run(seeds, False, 0.0), run(seeds, True, 0.0)
    calm_d, early_d = run(seeds, False, a.dep), run(seeds, True, a.dep)
    out = dict(no_depreciation=contrast(calm, early), with_depreciation=contrast(calm_d, early_d),
               bloc_b_win_levels=dict(calm=st.mean(r["bloc_b_win"] for r in calm),
                                      calm_dep=st.mean(r["bloc_b_win"] for r in calm_d)))
    text = json.dumps(out, indent=1)
    if a.out:
        with open(a.out, "w") as f:
            f.write(text)
    print(text)


if __name__ == "__main__":
    main()
