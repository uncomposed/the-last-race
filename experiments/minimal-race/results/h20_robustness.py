"""h20 robustness table: pattern flips and paired deltas for the six sensitivity variants.

Run from the minimal-race directory:
    python3 results/h20_robustness.py > results/h20_robustness.txt
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
VARIANTS = [
    ("h20a", "h20a_temp_low", "softmax_temp 0.1 (base 0.35)"),
    ("h20b", "h20b_temp_high", "softmax_temp 1.0 (base 0.35)"),
    ("h20c", "h20c_inertia_half", "inertia 0.5 (base 0.15)"),
    ("h20d", "h20d_horizon8", "horizon 8 (base 4)"),
    ("h20e", "h20e_hazard_half", "hazard range (0.02, 0.26) (base (0.02, 0.50))"),
    ("h20f", "h20f_demand_range", "demand range (0.2, 1.0) (base (0.4, 2.0))"),
]


def load(stem):
    with open(os.path.join(HERE, stem + ".json")) as f:
        return json.load(f)


def main():
    results = {tag: load(stem) for tag, stem, _ in VARIANTS}
    base = results["h20a"]["baseline"]
    for tag, d in results.items():
        assert d["baseline"]["patterns"] == base["patterns"], f"baseline differs in {tag}"
    print("Baseline (same across all runs, 300 seeds)")
    print("  patterns passed:", base["patterns_passed"], "of 8")
    print("  interest passed:", base["interest_passed"], "of 4")
    print()
    summary = {"baseline": {"patterns_passed": base["patterns_passed"],
                            "interest_passed": base["interest_passed"]}, "variants": {}}

    for tag, stem, desc in VARIANTS:
        d = results[tag]
        v = d["variant"]
        print(f"== {tag}: {desc}")
        print("  outcomes:", {k: v["outcomes"].get(k, 0) for k in base["outcomes"]})
        print("  baseline outcomes:", base["outcomes"])
        flips = []
        for k in base["patterns"]:
            bp, vp = base["patterns"][k], v["patterns"][k]
            if bp["passed"] != vp["passed"]:
                flips.append(f"{k}: {bp['passed']}->{vp['passed']} (value {bp['value']} -> {vp['value']})")
        for k in base["interest"]:
            bp, vp = base["interest"][k], v["interest"][k]
            if bp["passed"] != vp["passed"]:
                flips.append(f"{k}: {bp['passed']}->{vp['passed']} (value {bp['value']} -> {vp['value']})")
        print(f"  patterns passed: {v['patterns_passed']} of 8 (baseline {base['patterns_passed']})")
        print(f"  interest passed: {v['interest_passed']} of 4 (baseline {base['interest_passed']})")
        print("  flips:", "none" if not flips else "")
        for f_ in flips:
            print("    -", f_)
        print("  paired deltas (variant minus baseline), * = |mean| > 2*se:")
        pd = d["paired_deltas"]
        for k, val in pd.items():
            if isinstance(val, dict):
                sig = "*" if abs(val["mean"]) > 2 * val["se"] else " "
                print(f"    {sig} {k:26s} mean={val['mean']:>10} se={val['se']}")
            else:
                print(f"      {k:26s} {val}")
        summary["variants"][tag] = {
            "desc": desc,
            "patterns_passed": v["patterns_passed"],
            "interest_passed": v["interest_passed"],
            "flips": flips,
            "paired_deltas": pd,
        }
        print()

    with open(os.path.join(HERE, "h20_robustness.json"), "w") as f:
        json.dump(summary, f, indent=1, default=str)


if __name__ == "__main__":
    main()
