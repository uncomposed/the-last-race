"""h05 demand split: paired baseline vs leverage variant, split by hidden demand.

Run from the minimal-race folder:
    python3 results/h05_analysis.py > results/h05_analysis.json
"""
import json
import os
import statistics as st
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

import metrics  # noqa: E402
import run      # noqa: E402

mod = run.load_variant(os.path.join(ROOT, "variants", "h05_leverage_bubble.py"))
seeds = list(range(300))
KEYS = ["sentiment_crashes", "bankruptcies", "outcome_t", "capex_gt_rev_q_first12",
        "strategy_switches", "hazard_belief_err"]
EV = ["borrow", "interest", "debt_call", "forced_sale", "debt_writeoff"]

rows = []
for s in seeds:
    bw = run.build(None, s).run()
    vw = run.build(mod, s).run()
    b = metrics.run_metrics(bw)
    v = metrics.run_metrics(vw)
    counts = {k: sum(1 for e in vw.events if e["kind"] == k) for k in EV}
    counts["borrow_lab_seeds"] = int(counts["borrow"] > 0)
    counts["debt_call_seeds"] = int(counts["debt_call"] > 0)
    rows.append((b, v, counts))

med = st.median(b["unknowns"]["demand"] for b, _, _ in rows)


def delta_stats(pairs, k):
    d = [v[k] - b[k] for b, v in pairs if b[k] is not None and v[k] is not None]
    if len(d) < 2:
        return None
    m = st.mean(d)
    se = st.stdev(d) / len(d) ** 0.5
    return dict(mean=round(m, 4), se=round(se, 4), sig_2se=abs(m) > 2 * se)


def summarize(pairs):
    cat = lambda r: 1 if (r["outcome"] or "").startswith("catastrophe") else 0
    out = dict(n=len(pairs))
    out["baseline_outcomes"] = {}
    out["variant_outcomes"] = {}
    for b, v in pairs:
        out["baseline_outcomes"][b["outcome"]] = out["baseline_outcomes"].get(b["outcome"], 0) + 1
        out["variant_outcomes"][v["outcome"]] = out["variant_outcomes"].get(v["outcome"], 0) + 1
    n = len(pairs)
    out["baseline_outcomes"] = {k: round(c / n, 3) for k, c in sorted(out["baseline_outcomes"].items(), key=str)}
    out["variant_outcomes"] = {k: round(c / n, 3) for k, c in sorted(out["variant_outcomes"].items(), key=str)}
    out["deltas"] = {k: delta_stats(pairs, k) for k in KEYS}
    dc = [cat(v) - cat(b) for b, v in pairs]
    out["deltas"]["catastrophe_rate"] = dict(
        mean=round(st.mean(dc), 4), se=round(st.stdev(dc) / n ** 0.5, 4),
        sig_2se=abs(st.mean(dc)) > 2 * st.stdev(dc) / n ** 0.5)
    out["same_outcome_share"] = round(sum(1 for b, v in pairs if b["outcome"] == v["outcome"]) / n, 3)
    return out


low = [(b, v) for b, v, _ in rows if b["unknowns"]["demand"] < med]
high = [(b, v) for b, v, _ in rows if b["unknowns"]["demand"] >= med]
ev_summary = {}
for k in EV + ["borrow_lab_seeds", "debt_call_seeds"]:
    ev_summary[k] = dict(
        low_mean=round(st.mean(c[k] for _, _, c in rows if rows[0] and c and _ is not None and
                               next(bb for bb, vv, cc in rows if cc is c)["unknowns"]["demand"] < med), 3),
        all_mean=round(st.mean(c[k] for _, _, c in rows), 3))

out = dict(
    demand_median=round(med, 4),
    all=summarize([(b, v) for b, v, _ in rows]),
    low_demand=summarize(low),
    high_demand=summarize(high),
    event_counts_variant_all_seeds={k: sum(c[k] for _, _, c in rows) for k in EV},
    seeds_with_borrow=sum(c["borrow_lab_seeds"] for _, _, c in rows),
    seeds_with_debt_call=sum(c["debt_call_seeds"] for _, _, c in rows),
)
print(json.dumps(out, indent=1, default=str))
