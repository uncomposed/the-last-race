"""Core v3: does the round 3 supply shock matter once compute depreciates?

Round 3 (`u_supply_diag.py`) bolted naive depreciation onto core v2: compute
wore out but labs did not plan for it. Here depreciation comes from the core,
so labs also plan with it. Contrasts, same seeds, all with core depreciation on:

    forced   calm (no shock ever) vs a forced deep shock at quarter 4, as in round 3
    organic  the core vs the round 3 supply-shock mechanism alone (natural chokepoint
             failures plus bloc-B blockades), as in round 3's "alone" column

    python3 results/v3_supply.py --start 1000 --seeds 1000 --out results/v3_supply_heldout.json
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.argv, _argv = sys.argv[:1], sys.argv
import u_analysis as A     # noqa: E402
import u_supply_diag as D  # noqa: E402
sys.argv = _argv
import core                # noqa: E402
import metrics             # noqa: E402


def run(seeds, world):
    out = []
    for s in seeds:
        w = world(s)
        m = metrics.run_metrics(w)
        m.update(A.unseat_metrics(w))
        out.append(m)
    return out


def forced_world(force):
    def make(s):
        conf = A.U.make_config(core.make_base_config(), only={"supply_shock"})
        conf["cfg"]["unknowns"]["chokepoint_hazard"] = (0.0, 0.0)
        return D.make(force, 0.0)(s, conf).run()
    return make


def organic_world(on):
    def make(s):
        conf = A.U.make_config(core.make_base_config(), only={"supply_shock"} if on else set())
        return A.U.VariantWorld(s, conf).run()
    return make


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", type=int, default=300)
    ap.add_argument("--start", type=int, default=0)
    ap.add_argument("--out")
    a = ap.parse_args()
    seeds = list(range(a.start, a.start + a.seeds))
    calm, early = run(seeds, forced_world(False)), run(seeds, forced_world(True))
    base, shock = run(seeds, organic_world(False)), run(seeds, organic_world(True))
    out = dict(seeds=[seeds[0], seeds[-1]],
               forced=D.contrast(calm, early),
               organic=D.contrast(base, shock),
               organic_shock_share=round(sum(r["n_supply_shock"] > 0 for r in shock) / len(seeds), 3),
               levels=dict(calm_frontier=round(sum(r["frontier_win"] for r in calm) / len(seeds), 3),
                           calm_bloc_b=round(sum(r["bloc_b_win"] for r in calm) / len(seeds), 3)))
    text = json.dumps(out, indent=1)
    if a.out:
        with open(a.out, "w") as f:
            f.write(text)
    print(text)


if __name__ == "__main__":
    main()
