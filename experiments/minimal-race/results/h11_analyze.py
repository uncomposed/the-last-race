"""Summarize the h11 verification sweep (16 grid cells, 300 paired seeds each).

Run from the minimal-race folder:
    python3 results/h11_analyze.py
Reads results/h11_verification_sweep_v{V}_d{D}.json and prints a table and
per-verify marginals. Writes results/h11_verification_sweep_summary.json.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
VERIFY = [0.1, 0.5, 0.8, 0.95]
DETECT = [0.05, 0.15, 0.3, 0.5]


def cat_rate(summary):
    return sum(v for k, v in summary["outcomes"].items() if k.startswith("catastrophe"))


def load(v, d):
    with open(os.path.join(HERE, f"h11_verification_sweep_v{v}_d{d}.json")) as f:
        return json.load(f)


cells = {}
for v in VERIFY:
    for d in DETECT:
        r = load(v, d)
        m = r["variant"]["means"]
        pd = r["paired_deltas"]
        formed = m["pacts_formed"]
        cells[(v, d)] = dict(
            pacts_formed=formed,
            pact_breaks=m["pact_breaks"],
            defect_quarters=m["defect_quarters"],
            breaks_per_formed=(m["pact_breaks"] / formed) if formed else None,
            catastrophe_rate=cat_rate(r["variant"]),
            catastrophe_delta=pd["catastrophe_rate"],
            pacts_delta=pd["pacts_formed"],
            breaks_delta=pd["pact_breaks"],
            defect_delta=pd["defect_quarters"],
            same_outcome_share=pd["same_outcome_share"],
        )

base = load(0.1, 0.05)["baseline"]
base_cat = cat_rate(base)
base_means = base["means"]

print(f"Baseline (verify 0.30, detect 0.15): catastrophe rate {base_cat:.3f}, "
      f"pacts_formed {base_means['pacts_formed']:.4f}, pact_breaks {base_means['pact_breaks']:.4f}, "
      f"defect_quarters {base_means['defect_quarters']:.4f}")
print()
hdr = f"{'verify':>6} {'detect':>6} {'pacts':>7} {'breaks':>7} {'brk/frm':>8} {'defectQ':>8} {'cat':>6} {'dCat':>8} {'se':>6} {'dDefQ':>8}"
print(hdr)
for v in VERIFY:
    for d in DETECT:
        c = cells[(v, d)]
        bpf = f"{c['breaks_per_formed']:.2f}" if c["breaks_per_formed"] is not None else "n/a"
        print(f"{v:>6} {d:>6} {c['pacts_formed']:>7.4f} {c['pact_breaks']:>7.4f} {bpf:>8} "
              f"{c['defect_quarters']:>8.4f} {c['catastrophe_rate']:>6.3f} "
              f"{c['catastrophe_delta']['mean']:>+8.4f} {c['catastrophe_delta']['se']:>6.4f} "
              f"{c['defect_delta']['mean']:>+8.4f}")

print()
print("Marginal over detect (mean across 4 detect levels), per verify level:")
marg = {}
for v in VERIFY:
    rows = [cells[(v, d)] for d in DETECT]
    marg[v] = dict(
        catastrophe_rate=sum(r["catastrophe_rate"] for r in rows) / len(rows),
        pacts_formed=sum(r["pacts_formed"] for r in rows) / len(rows),
        pact_breaks=sum(r["pact_breaks"] for r in rows) / len(rows),
        defect_quarters=sum(r["defect_quarters"] for r in rows) / len(rows),
    )
    m = marg[v]
    print(f"  verify {v:>4}: cat {m['catastrophe_rate']:.3f}  pacts {m['pacts_formed']:.4f}  "
          f"breaks {m['pact_breaks']:.4f}  defectQ {m['defect_quarters']:.4f}")

print()
print("Threshold check per detect level (catastrophe rate by verify):")
threshold_report = {}
for d in DETECT:
    series = [cells[(v, d)]["catastrophe_rate"] for v in VERIFY]
    total = series[-1] - series[0]
    steps = [series[i + 1] - series[i] for i in range(len(series) - 1)]
    biggest = max(range(len(steps)), key=lambda i: abs(steps[i]))
    share = abs(steps[biggest]) / abs(total) if total else None
    threshold_report[d] = dict(series=series, steps=steps, biggest_step_share=share,
                               biggest_step_between=[VERIFY[biggest], VERIFY[biggest + 1]])
    print(f"  detect {d:>4}: " + "  ".join(f"v{v}={x:.3f}" for v, x in zip(VERIFY, series))
          + (f"  | largest step {VERIFY[biggest]}->{VERIFY[biggest + 1]} "
             f"holds {share:.0%} of the total change" if share is not None else "  | no total change"))

summary = dict(
    baseline=dict(catastrophe_rate=base_cat, pacts_formed=base_means["pacts_formed"],
                  pact_breaks=base_means["pact_breaks"], defect_quarters=base_means["defect_quarters"]),
    cells={f"v{v}_d{d}": c for (v, d), c in cells.items()},
    marginal_by_verify={str(v): m for v, m in marg.items()},
    threshold_by_detect={str(d): t for d, t in threshold_report.items()},
)
with open(os.path.join(HERE, "h11_verification_sweep_summary.json"), "w") as f:
    json.dump(summary, f, indent=1, default=str)
print()
print("wrote results/h11_verification_sweep_summary.json")
