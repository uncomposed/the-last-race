"""Fixed metrics and stylized-pattern checks. Every experiment is scored with
these same functions so results are comparable. Do not edit from a variant.

The pattern thresholds are judgment calls about what "looks like the real
race", not measured targets. They are listed in PATTERNS with plain-language
descriptions so they can be argued with.
"""
from __future__ import annotations

import math
import statistics as st


def run_metrics(w):
    h = w.history
    ev = w.events
    T = len(h)
    first12 = h[:12]
    capex_gt_rev = sum(1 for q in first12 if q["capex"] + q["raised"] * 0 > q["revenue"])
    # Lead changes and frontier bunching (truth).
    leaders = []
    gaps = []
    for q in h:
        alive = [n for n, a in q["alive"].items() if a]
        cs = sorted((q["C"][n] for n in alive), reverse=True)
        leaders.append(max(alive, key=lambda n: q["C"][n]) if alive else None)
        if len(cs) >= 3 and cs[0] > 0:
            gaps.append((cs[0] - cs[2]) / cs[0])
    lead_changes = sum(1 for a, b in zip(leaders, leaders[1:]) if a != b)
    kinds = [e["kind"] for e in ev]
    opens = [e for e in ev if e["kind"] == "open_weights"]
    gov_first = next((e["kind"] for e in ev if e["kind"] in
                      ("subsidy_on", "export_controls", "regulate_on")), None)
    pacts = [e for e in ev if e["kind"] == "pact_form"]
    breaks = [e for e in ev if e["kind"] == "pact_break"]
    defects = [e for e in ev if e["kind"] == "defect"]
    incidents = [e for e in ev if e["kind"] == "incident"]
    pub_inc = [e for e in incidents if e["public"]]
    switches = kinds.count("switch")
    sentiments = [q["sentiment"] for q in h]
    crashes = sum(1 for a, b in zip(sentiments, sentiments[1:]) if a > 0 and b / a < 0.75)
    # Belief error on hazard at the end (labs only).
    true_h = w.unk["hazard"]
    hb = h[-1]["hazard_belief"] if h else {}
    lab_err = [abs(hb[n] - true_h) for n in w.labs if n in hb]
    hz_hi = w.cfg["unknowns"]["hazard"][1]
    belief_spread = (max(hb.values()) - min(hb.values())) / hz_hi if hb else 0.0
    out = w.outcome or {}
    return dict(
        seed=w.seed,
        outcome=out.get("kind"),
        outcome_t=out.get("t"),
        winner=out.get("winner"),
        winner_bloc=out.get("bloc"),
        quarters=T,
        capex_gt_rev_q_first12=capex_gt_rev,
        lead_changes=lead_changes,
        frontier_gap_mean=st.mean(gaps) if gaps else None,
        pacts_formed=len(pacts),
        pact_breaks=len(breaks),
        defect_quarters=len(defects),
        open_weights=len(opens),
        open_weights_by_laggard=sum(1 for e in opens if e["rank"] >= 3),
        gov_first_action=gov_first,
        regulate_events=kinds.count("regulate_on"),
        subsidy_events=kinds.count("subsidy_on"),
        export_controls=int("export_controls" in kinds),
        incidents=len(incidents),
        incidents_public=len(pub_inc),
        disruptions=kinds.count("disruption"),
        bankruptcies=kinds.count("bankrupt"),
        sentiment_crashes=crashes,
        strategy_switches=switches,
        public_max=max((max(q["public"].values()) for q in h), default=0.0),
        hazard_belief_err=st.mean(lab_err) / hz_hi if lab_err else None,
        hazard_belief_spread=belief_spread,
        unknowns=dict(w.unk),
    )


def _frac(rows, pred):
    rows = list(rows)
    return sum(1 for r in rows if pred(r)) / max(1, len(rows))


def _med(xs):
    xs = [x for x in xs if x is not None]
    return st.median(xs) if xs else None


def _mean(xs):
    xs = [x for x in xs if x is not None]
    return st.mean(xs) if xs else None


def outcome_entropy(rows):
    counts = {}
    for r in rows:
        counts[r["outcome"]] = counts.get(r["outcome"], 0) + 1
    n = len(rows)
    return -sum(c / n * math.log2(c / n) for c in counts.values()) if n else 0.0


def unknown_importance(rows):
    """For each hidden unknown: correlation between its seed value and a bad
    outcome (catastrophe) and with takeoff timing. High values mean the seed's
    unknowns, not just roles, shape the story."""
    res = {}
    bad = [1.0 if (r["outcome"] or "").startswith("catastrophe") else 0.0 for r in rows]
    tk = [float(r["outcome_t"]) if r["outcome"] != "no_takeoff" else 45.0 for r in rows]
    keys = rows[0]["unknowns"].keys() if rows else []
    for k in keys:
        xs = [r["unknowns"][k] for r in rows]
        res[k] = dict(r_catastrophe=round(_corr(xs, bad), 3), r_takeoff_time=round(_corr(xs, tk), 3))
    return res


def _corr(a, b):
    if len(a) < 3:
        return 0.0
    ma, mb = st.mean(a), st.mean(b)
    va = sum((x - ma) ** 2 for x in a)
    vb = sum((y - mb) ** 2 for y in b)
    if va <= 0 or vb <= 0:
        return 0.0
    return sum((x - ma) * (y - mb) for x, y in zip(a, b)) / math.sqrt(va * vb)


# Stylized patterns. Each returns (value, passed).
PATTERNS = {
    "P1_capex_ahead_of_revenue":
        ("Median seed has capex above revenue in >=8 of the first 12 quarters",
         lambda R: (_med(r["capex_gt_rev_q_first12"] for r in R),
                    (_med(r["capex_gt_rev_q_first12"] for r in R) or 0) >= 8)),
    "P2_frontier_bunched":
        ("Median leader-to-3rd gap under 25% of leader capability",
         lambda R: (_med(r["frontier_gap_mean"] for r in R),
                    (_med(r["frontier_gap_mean"] for r in R) or 1) < 0.25)),
    "P3_leads_change":
        ("Median seed has at least 2 changes of capability leader",
         lambda R: (_med(r["lead_changes"] for r in R),
                    (_med(r["lead_changes"] for r in R) or 0) >= 2)),
    "P4_pacts_form_and_fail":
        ("Pacts form in >=25% of seeds, and >=40% of formed pacts break or see defection",
         lambda R: ((_frac(R, lambda r: r["pacts_formed"] > 0),
                     _fail_rate(R)),
                    _frac(R, lambda r: r["pacts_formed"] > 0) >= 0.25 and _fail_rate(R) >= 0.4)),
    "P5_laggards_open_weights":
        ("Open-weight releases happen in >=30% of seeds and >=70% come from rank>=3",
         lambda R: ((_frac(R, lambda r: r["open_weights"] > 0), _laggard_share(R)),
                    _frac(R, lambda r: r["open_weights"] > 0) >= 0.3 and _laggard_share(R) >= 0.7)),
    "P6_states_accelerate_first":
        ("In >=60% of seeds the first government action is subsidy or export control, not regulation",
         lambda R: (_frac(R, lambda r: r["gov_first_action"] in ("subsidy_on", "export_controls")),
                    _frac(R, lambda r: r["gov_first_action"] in ("subsidy_on", "export_controls")) >= 0.6)),
    "P7_backlash_sometimes":
        ("Physical disruption from public backlash in 10-60% of seeds (possible, not universal)",
         lambda R: (_frac(R, lambda r: r["disruptions"] > 0),
                    0.1 <= _frac(R, lambda r: r["disruptions"] > 0) <= 0.6)),
    "P8_boom_bust_possible":
        ("Investor sentiment crash (>25% drop in a quarter) in 15-70% of seeds",
         lambda R: (_frac(R, lambda r: r["sentiment_crashes"] > 0),
                    0.15 <= _frac(R, lambda r: r["sentiment_crashes"] > 0) <= 0.7)),
}

# Interestingness (is it worth playing / watching?), separate from realism.
INTEREST = {
    "I1_outcome_variety":
        ("Outcome entropy >= 1.2 bits across seeds",
         lambda R: (round(outcome_entropy(R), 3), outcome_entropy(R) >= 1.2)),
    "I2_unknowns_matter":
        ("Some hidden unknown has |r| >= 0.25 with catastrophe or takeoff time",
         lambda R: (_max_imp(R), _max_imp(R) >= 0.25)),
    "I3_actors_adapt":
        ("Median seed has >= 6 strategy switches across labs",
         lambda R: (_med(r["strategy_switches"] for r in R),
                    (_med(r["strategy_switches"] for r in R) or 0) >= 6)),
    "I4_beliefs_diverge":
        ("Median end-of-run hazard belief spread across actors >= 0.15 of range",
         lambda R: (_med(r["hazard_belief_spread"] for r in R),
                    (_med(r["hazard_belief_spread"] for r in R) or 0) >= 0.15)),
}


def _fail_rate(R):
    formed = sum(r["pacts_formed"] for r in R)
    failed = sum(min(r["pacts_formed"], r["pact_breaks"] + (1 if r["defect_quarters"] > 0 else 0)) for r in R)
    return failed / formed if formed else 0.0


def _laggard_share(R):
    tot = sum(r["open_weights"] for r in R)
    lag = sum(r["open_weights_by_laggard"] for r in R)
    return lag / tot if tot else 0.0


def _max_imp(R):
    imp = unknown_importance(R)
    return max((max(abs(v["r_catastrophe"]), abs(v["r_takeoff_time"])) for v in imp.values()), default=0.0)


def summarize(rows):
    outcomes = {}
    for r in rows:
        outcomes[r["outcome"]] = outcomes.get(r["outcome"], 0) + 1
    patt = {}
    for k, (desc, fn) in PATTERNS.items():
        val, ok = fn(rows)
        patt[k] = dict(desc=desc, value=val, passed=bool(ok))
    inter = {}
    for k, (desc, fn) in INTEREST.items():
        val, ok = fn(rows)
        inter[k] = dict(desc=desc, value=val, passed=bool(ok))
    numeric = {}
    for key in ("outcome_t", "capex_gt_rev_q_first12", "lead_changes", "frontier_gap_mean",
                "pacts_formed", "pact_breaks", "defect_quarters", "open_weights", "incidents",
                "incidents_public", "disruptions", "bankruptcies", "sentiment_crashes",
                "strategy_switches", "public_max", "hazard_belief_err", "hazard_belief_spread",
                "regulate_events", "subsidy_events", "export_controls"):
        numeric[key] = _mean(r[key] for r in rows)
    winners = {}
    for r in rows:
        if r["winner"]:
            winners[r["winner"]] = winners.get(r["winner"], 0) + 1
    return dict(
        n=len(rows),
        outcomes={k: round(v / len(rows), 3) for k, v in sorted(outcomes.items(), key=str)},
        winners={k: round(v / len(rows), 3) for k, v in sorted(winners.items())},
        patterns=patt,
        interest=inter,
        patterns_passed=sum(1 for v in patt.values() if v["passed"]),
        interest_passed=sum(1 for v in inter.values() if v["passed"]),
        means={k: (round(v, 4) if isinstance(v, float) else v) for k, v in numeric.items()},
        unknown_importance=unknown_importance(rows),
    )
