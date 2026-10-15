"""Metrics and stylized-pattern checks, version 2.

Same public API as metrics.py: run_metrics(world) -> dict, summarize(rows) ->
dict, and PATTERNS / INTEREST dicts of name -> (description, fn(rows) ->
(value, passed)).

Why a v2: in round 1 several checks were saturated and could never fail (P1
capex>revenue, P5 open-weight laggard share, P6 first government action, I3
switch count). Every check here has a two-sided band ("too much" is also
unrealistic or uninteresting), and most are time-ordered: they ask whether A
happens before B, not just whether A happens.

Thresholds are judgment calls about what "looks like the real race", not
measured targets. Each has a one-line rationale in RATIONALE so it can be
argued with.

Written defensively for the core v2 event contract: if an event kind or a
history field never appears, the metric reports 0 or None and the check
reports value None / passed False instead of crashing. Works on the v1 core
too (bloc and deployed are read from w.labs when history lacks them).
"""
from __future__ import annotations

import math
import statistics as st

TAKEOFF_KINDS = ("unipolar", "multipolar", "catastrophe_takeoff")
ACCEL_KINDS = ("subsidy_on", "export_controls")
RESTRAIN_KINDS = ("regulate_on", "disclosure_on")
REG_WINDOW = 4      # quarters: incident -> regulation counts as "warning shot"
REACT_WINDOW = 2    # quarters after a shock in which switches count as reactions
MECHANISMS = {      # informational fire rates: name -> event kinds that count
    "theft_attempt": ("theft_attempt",),
    "theft_success": ("theft_success",),
    "theft_detected": ("theft_detected",),
    "sabotage": ("sabotage",),
    "consolidation": ("consolidate",),
    "disclosure": ("disclosure_on",),
    "export_controls": ("export_controls",),
    "regulate_off": ("regulate_off",),
    "regulation": ("regulate_on",),
    "subsidy": ("subsidy_on",),
    "pact": ("pact_form",),
    "open_weights": ("open_weights",),
    "disruption": ("disruption",),
    "bankruptcy": ("bankrupt",),
    "incident_public": (),   # special-cased below
}


# --------------------------------------------------------------------------
# Per-run metrics
# --------------------------------------------------------------------------

def _get(d, k, default=None):
    try:
        v = d.get(k, default)
    except AttributeError:
        return default
    return default if v is None else v


def _bloc_of(w, lab, q=None):
    if q is not None:
        b = _get(_get(q, "bloc", {}), lab)
        if b is not None:
            return b
    labs = getattr(w, "labs", {}) or {}
    obj = labs.get(lab)
    return getattr(obj, "bloc", None)


def _leaders(h):
    out = []
    for q in h:
        C = _get(q, "C", {})
        alive = [n for n, a in _get(q, "alive", {}).items() if a and n in C]
        out.append(max(alive, key=lambda n: C[n]) if alive else None)
    return out


def _durable_changes(leaders, hold=2):
    """Lead changes where the new leader holds for >= `hold` quarters.
    Filters single-quarter flips between near-equal labs."""
    cur = leaders[0] if leaders else None
    n = 0
    for i in range(1, len(leaders)):
        x = leaders[i]
        if x is None or x == cur:
            continue
        if all(leaders[j] == x for j in range(i, min(len(leaders), i + hold))) and i + hold <= len(leaders):
            n += 1
            cur = x
    return n


def _ratio(h, lo, hi):
    qs = h[lo:hi]
    if not qs:
        return None
    cap = sum(_get(q, "capex", 0.0) for q in qs)
    rev = sum(_get(q, "revenue", 0.0) for q in qs)
    return cap / rev if rev > 1e-9 else None


def run_metrics(w):
    h = list(getattr(w, "history", []) or [])
    ev = list(getattr(w, "events", []) or [])
    cfg = getattr(w, "cfg", {}) or {}
    unk = dict(getattr(w, "unk", {}) or {})
    T = len(h)
    t_end = (_get(h[-1], "t", T - 1) + 1) if h else 0
    kinds = [e.get("kind") for e in ev]
    by = {}
    for i, e in enumerate(ev):
        by.setdefault(e.get("kind"), []).append((i, e))

    def evs(k):
        return [e for _, e in by.get(k, [])]

    # --- leadership (truth capability among live labs)
    leaders = _leaders(h)
    lead_changes = sum(1 for a, b in zip(leaders, leaders[1:]) if a != b)
    durable = _durable_changes(leaders)
    leader0 = leaders[0] if leaders else None
    leader_persist = None
    if leaders:
        leader_persist = int(leaders[min(16, T - 1)] == leader0)
    gaps = []
    for q in h:
        C = _get(q, "C", {})
        alive = [n for n, a in _get(q, "alive", {}).items() if a and n in C]
        cs = sorted((C[n] for n in alive), reverse=True)
        if len(cs) >= 3 and cs[0] > 0:
            gaps.append((cs[0] - cs[2]) / cs[0])

    # --- money
    capex_gt_rev = sum(1 for q in h[:12] if _get(q, "capex", 0.0) > _get(q, "revenue", 0.0))
    ratio_early = _ratio(h, 0, 8)
    ratio_late = _ratio(h, 12, 21) if T >= 16 else None
    ratio_falls = (int(ratio_late < ratio_early)
                   if ratio_early is not None and ratio_late is not None else None)
    sent = [_get(q, "sentiment", 0.0) for q in h]
    crashes = sum(1 for a, b in zip(sent, sent[1:]) if a > 0 and b / a < 0.75)
    crash_ts = [_get(h[i + 1], "t", i + 1) for i, (a, b) in enumerate(zip(sent, sent[1:]))
                if a > 0 and b / a < 0.75]
    # Boom then bust: sentiment rises >= 30% above its start, then later falls
    # >= 30% below that running peak.
    boom_bust = 0
    if sent:
        s0, peak = sent[0], sent[0]
        for s in sent[1:]:
            if peak >= 1.3 * s0 and s <= 0.7 * peak:
                boom_bust = 1
                break
            peak = max(peak, s)

    # --- incidents and regulation (time-ordered via event-list order)
    incidents = evs("incident")
    pub_inc = [(i, e) for i, e in by.get("incident", []) if e.get("public")]

    def inc_bloc(e):
        return e.get("bloc") or _bloc_of(w, e.get("lab"))

    reg_on = by.get("regulate_on", [])
    reg_after = 0
    for i, e in reg_on:
        g = e.get("gov")
        if any(j < i and inc_bloc(x) == g and 0 <= e["t"] - x["t"] <= REG_WINDOW
               for j, x in pub_inc):
            reg_after += 1
    # Base rate: share of (gov, quarter) cells that sit inside such a window,
    # so the check can tell "regulation follows incidents" from "incidents are
    # everywhere".
    govs = sorted({e.get("gov") for e in ev if e.get("gov") is not None} |
                  {inc_bloc(e) for _, e in pub_inc if inc_bloc(e) is not None}) or ["A", "B"]
    cells = covered = 0
    for g in govs:
        ts = [x["t"] for _, x in pub_inc if inc_bloc(x) == g]
        for q in range(t_end):
            cells += 1
            covered += any(0 <= q - t <= REG_WINDOW for t in ts)

    # --- government first moves
    gov_first = next((k for k in kinds if k in ACCEL_KINDS + RESTRAIN_KINDS), None)
    first_by_gov = {}
    for e in ev:
        if e.get("kind") in ACCEL_KINDS + RESTRAIN_KINDS and e.get("gov") not in first_by_gov:
            first_by_gov[e.get("gov")] = e["kind"]

    # --- pacts
    lifetimes = []
    open_pact = None
    for e in ev:
        k = e.get("kind")
        if k == "pact_form":
            if open_pact is not None:
                lifetimes.append(e["t"] - open_pact)
            open_pact = e["t"]
        elif k in ("pact_break", "pact_expire") and open_pact is not None:
            lifetimes.append(e["t"] - open_pact)
            open_pact = None
    if open_pact is not None:
        lifetimes.append(t_end - open_pact)   # censored at end of run

    # --- open weights
    opens = evs("open_weights")
    ow_lag_believed = sum(1 for e in opens if (e.get("rank") or 0) >= 3)
    hist_by_t = {_get(q, "t"): q for q in h}
    ow_lag = 0
    for e in opens:     # truth rank at that quarter; fall back to the event's own rank
        q = hist_by_t.get(e.get("t"))
        C = _get(q, "C", {}) if q else {}
        if e.get("lab") in C:
            alive = [n for n, a in _get(q, "alive", {}).items() if a and n in C]
            rank = 1 + sum(1 for n in alive if C[n] > C[e["lab"]])
        else:
            rank = e.get("rank") or 0
        ow_lag += rank >= 3

    # --- reactions: switch rate after shocks vs background
    shock_ts = sorted({x["t"] for _, x in pub_inc} | set(crash_ts))
    react_q = {t + d for t in shock_ts for d in range(1, REACT_WINDOW + 1)}
    sw_by_t = {}
    for e in evs("switch"):
        sw_by_t[e["t"]] = sw_by_t.get(e["t"], 0) + 1
    r_sw = r_lq = b_sw = b_lq = 0
    for q in h:
        t = _get(q, "t", 0)
        nlab = sum(1 for a in _get(q, "alive", {}).values() if a)
        if t in react_q:
            r_sw += sw_by_t.get(t, 0)
            r_lq += nlab
        else:
            b_sw += sw_by_t.get(t, 0)
            b_lq += nlab

    # --- beliefs
    hz_lo, hz_hi = (cfg.get("unknowns", {}) or {}).get("hazard", (0.0, 1.0))
    true_h = unk.get("hazard")
    hb = _get(h[-1], "hazard_belief", {}) if h else {}
    labs = getattr(w, "labs", {}) or {}
    lab_err = [abs(hb[n] - true_h) for n in labs if n in hb and true_h is not None]
    spread = ((max(hb.values()) - min(hb.values())) / max(1e-9, hz_hi - hz_lo)) if hb else None

    pub_vals = [v for q in h for v in (_get(q, "public", {}) or {}).values()]
    out = getattr(w, "outcome", None) or {}
    mech = {}
    for name, ks in MECHANISMS.items():
        mech[name] = int(bool(pub_inc)) if name == "incident_public" else int(any(k in by for k in ks))

    return dict(
        seed=getattr(w, "seed", None),
        horizon=cfg.get("T", t_end),
        outcome=out.get("kind"),
        outcome_t=out.get("t"),
        winner=out.get("winner"),
        winner_bloc=out.get("bloc") or (_bloc_of(w, out.get("winner")) if out.get("winner") else None),
        quarters=T,
        # v1 keys kept for run.py paired_deltas
        capex_gt_rev_q_first12=capex_gt_rev,
        lead_changes=lead_changes,
        frontier_gap_mean=st.mean(gaps) if gaps else None,
        pacts_formed=len(evs("pact_form")),
        pact_breaks=len(evs("pact_break")),
        defect_quarters=len(evs("defect")),
        open_weights=len(opens),
        incidents=len(incidents),
        disruptions=len(evs("disruption")),
        bankruptcies=len(evs("bankrupt")),
        sentiment_crashes=crashes,
        strategy_switches=len(evs("switch")),
        public_max=max(pub_vals, default=0.0),
        hazard_belief_err=(st.mean(lab_err) / hz_hi) if lab_err and hz_hi else None,
        unknowns=unk,
        # v2 additions
        durable_lead_changes=durable,
        leader0=leader0,
        leader_persists_q16=leader_persist,
        capex_rev_ratio_q0_7=ratio_early,
        capex_rev_ratio_q12_20=ratio_late,
        capex_ratio_falls=ratio_falls,
        boom_bust=boom_bust,
        incidents_public=len(pub_inc),
        regulate_on=len(reg_on),
        regulate_on_after_incident=reg_after,
        incident_window_cells=cells,
        incident_window_covered=covered,
        gov_first_action=gov_first,
        gov_first_by_gov=first_by_gov,
        pact_lifetimes=lifetimes,
        pact_expires=len(evs("pact_expire")),
        open_weights_by_laggard=ow_lag,
        open_weights_by_laggard_believed=ow_lag_believed,
        open_weights_first_t=min((e["t"] for e in opens), default=None),
        react_switches=r_sw, react_labq=r_lq, bg_switches=b_sw, bg_labq=b_lq,
        hazard_belief_spread=spread,
        acquisitions=len(evs("acquired")),
        thefts=len(evs("theft_success")),
        sabotages=len(evs("sabotage")),
        consolidations=len(evs("consolidate")),
        subsidy_events=len(evs("subsidy_on")),
        export_controls=int("export_controls" in by),
        mechanisms=mech,
    )


# --------------------------------------------------------------------------
# Aggregates
# --------------------------------------------------------------------------

def _frac(rows, pred, among=None):
    rows = [r for r in rows if among is None or among(r)]
    return (sum(1 for r in rows if pred(r)) / len(rows)) if rows else None


def _med(xs):
    xs = [x for x in xs if x is not None]
    return st.median(xs) if xs else None


def _mean(xs):
    xs = [x for x in xs if x is not None]
    return st.mean(xs) if xs else None


def _in(x, lo, hi):
    return x is not None and lo <= x <= hi


def _r(x, n=3):
    if isinstance(x, float):
        return round(x, n)
    if isinstance(x, tuple):
        return tuple(_r(v, n) for v in x)
    return x


def _corr(a, b):
    if len(a) < 3:
        return 0.0
    ma, mb = st.mean(a), st.mean(b)
    va = sum((x - ma) ** 2 for x in a)
    vb = sum((y - mb) ** 2 for y in b)
    if va <= 0 or vb <= 0:
        return 0.0
    return sum((x - ma) * (y - mb) for x, y in zip(a, b)) / math.sqrt(va * vb)


def outcome_entropy(rows):
    counts = {}
    for r in rows:
        counts[r["outcome"]] = counts.get(r["outcome"], 0) + 1
    n = len(rows)
    return -sum(c / n * math.log2(c / n) for c in counts.values()) if n else 0.0


def unknown_importance(rows):
    """Correlation of each hidden unknown with catastrophe and takeoff time."""
    res = {}
    if not rows:
        return res
    bad = [1.0 if (r["outcome"] or "").startswith("catastrophe") else 0.0 for r in rows]
    tk = [float(r["outcome_t"]) if r["outcome"] != "no_takeoff" and r["outcome_t"] is not None
          else float((r.get("horizon") or 40) + 5) for r in rows]
    for k in rows[0]["unknowns"]:
        xs = [r["unknowns"].get(k, 0.0) for r in rows]
        res[k] = dict(r_catastrophe=round(_corr(xs, bad), 3), r_takeoff_time=round(_corr(xs, tk), 3))
    return res


def _max_imp(R):
    imp = unknown_importance(R)
    return max((max(abs(v["r_catastrophe"]), abs(v["r_takeoff_time"])) for v in imp.values()),
               default=0.0)


def _takeoff_wins(R):
    return [r for r in R if r["outcome"] in TAKEOFF_KINDS and r["winner"]]


# ---- individual checks: each returns (value, passed)

def _leader(R):
    persist = _frac(R, lambda r: r["leader_persists_q16"] == 1,
                    among=lambda r: r["leader_persists_q16"] is not None)
    churn = _frac(R, lambda r: r["durable_lead_changes"] >= 1)
    return (persist, churn), _in(persist, 0.40, 0.85) and _in(churn, 0.35, 0.90)


def _revenue(R):
    falls = _frac(R, lambda r: r["capex_ratio_falls"] == 1,
                  among=lambda r: r["capex_ratio_falls"] is not None)
    early = _med(r["capex_rev_ratio_q0_7"] for r in R)
    return (falls, early), _in(falls, 0.50, 0.95) and _in(early, 1.3, 6.0)


def _warning(R):
    n = sum(r["regulate_on"] for r in R)
    hit = sum(r["regulate_on_after_incident"] for r in R)
    cells = sum(r["incident_window_cells"] for r in R)
    base = sum(r["incident_window_covered"] for r in R) / cells if cells else None
    share = hit / n if n else None
    lift = (share - base) if share is not None and base is not None else None
    return (share, base, n), _in(share, 0.60, 0.95) and lift is not None and lift >= 0.15


def _pacts(R):
    formed = _frac(R, lambda r: r["pacts_formed"] > 0)
    life = _med(x for r in R for x in r["pact_lifetimes"])
    return (formed, life), _in(formed, 0.15, 0.60) and _in(life, 2, 6)


def _open(R):
    tot = sum(r["open_weights"] for r in R)
    lag = sum(r["open_weights_by_laggard"] for r in R) / tot if tot else None
    any_ = _frac(R, lambda r: r["open_weights"] > 0)
    return (any_, lag), _in(any_, 0.30, 0.95) and _in(lag, 0.70, 0.95)


def _accel(R):
    f = _frac(R, lambda r: r["gov_first_action"] in ACCEL_KINDS,
              among=lambda r: r["gov_first_action"] is not None)
    return f, _in(f, 0.60, 0.95)


def _backlash(R):
    f = _frac(R, lambda r: r["disruptions"] > 0)
    return f, _in(f, 0.10, 0.60)


def _boom(R):
    f = _frac(R, lambda r: r["boom_bust"] == 1)
    return f, _in(f, 0.15, 0.70)


def _bloc(R):
    W = _takeoff_wins(R)
    f = (sum(1 for r in W if r["winner_bloc"] == "B") / len(W)) if W else None
    return f, _in(f, 0.10, 0.45)


def _entropy(R):
    e = outcome_entropy(R)
    return round(e, 3), _in(e, 1.2, 2.3)


def _winner_spread(R):
    W = _takeoff_wins(R)
    if not W:
        return None, False
    c = {}
    for r in W:
        c[r["winner"]] = c.get(r["winner"], 0) + 1
    top = max(c.values()) / len(W)
    return top, _in(top, 0.30, 0.65)


def _unknowns(R):
    m = _max_imp(R)
    return round(m, 3), _in(m, 0.25, 0.85)


def _react(R):
    rs, rl = sum(r["react_switches"] for r in R), sum(r["react_labq"] for r in R)
    bs, bl = sum(r["bg_switches"] for r in R), sum(r["bg_labq"] for r in R)
    if not rl or not bl or not bs:
        return None, False
    lift = (rs / rl) / (bs / bl)
    return lift, _in(lift, 1.2, 5.0)


def _beliefs(R):
    m = _med(r["hazard_belief_spread"] for r in R)
    return m, _in(m, 0.15, 0.60)


PATTERNS = {
    "R1_leader_persists_with_churn":
        ("Q0 leader still leads at Q16 (or end) in 40-85% of seeds, and a durable (>=2q) lead "
         "change happens in 35-90%", _leader),
    "R2_revenue_catches_up":
        ("Capex/revenue falls from Q0-7 to Q12-20 in 50-95% of seeds; median Q0-7 ratio 1.3-6",
         _revenue),
    "R3_warning_shots_precede_regulation":
        ("60-95% of regulate_on follow a same-bloc public incident within 4q, and that share "
         "beats the base rate of such windows by >=0.15", _warning),
    "R4_pacts_rare_and_short":
        ("Pacts form in 15-60% of seeds; median pact lifetime 2-6 quarters", _pacts),
    "R5_laggards_open_weights":
        ("Open-weight releases in 30-95% of seeds; 70-95% of releases from true rank>=3 at "
         "release", _open),
    "R6_accelerate_before_restraint":
        ("First government action is subsidy/export control in 60-95% of seeds with any action",
         _accel),
    "R7_backlash_sometimes":
        ("Physical disruption from public backlash in 10-60% of seeds", _backlash),
    "R8_boom_then_bust":
        ("Sentiment rises >=30% then falls >=30% from its peak in 15-70% of seeds", _boom),
    "R9_bloc_competition":
        ("Bloc B wins 10-45% of takeoffs that have a winner", _bloc),
}

INTEREST = {
    "I1_outcome_variety":
        ("Outcome entropy 1.2-2.3 bits", _entropy),
    "I2_no_inevitable_winner":
        ("Top winning role takes 30-65% of takeoff wins", _winner_spread),
    "I3_unknowns_matter":
        ("Max |r| of a hidden unknown with catastrophe or takeoff time is 0.25-0.85", _unknowns),
    "I4_actors_react":
        ("Lab switch rate in the 2q after a public incident or sentiment crash is 1.2-5x the "
         "background rate", _react),
    "I5_beliefs_diverge":
        ("Median end-of-run hazard-belief spread across actors is 0.15-0.60 of the prior range",
         _beliefs),
}

RATIONALE = {
    "R1_leader_persists_with_churn":
        "The real race has had a sticky leader with real challengers; never or always changing is a toy.",
    "R2_revenue_catches_up":
        "Build-out runs ahead of revenue early, then revenue grows into it; a ratio that never falls is a bubble with no story, one that always falls is too tidy.",
    "R3_warning_shots_precede_regulation":
        "Governments mostly regulate after visible harm, not on a schedule; 100% would mean no anticipatory rules at all, which also isn't true.",
    "R4_pacts_rare_and_short":
        "Voluntary lab restraint commitments are uncommon and erode within a year or two; permanent pacts or none at all are both unrealistic.",
    "R5_laggards_open_weights":
        "Open weights are mostly a challenger's move, but near-frontier labs have released too; 100% laggard share is too clean.",
    "R6_accelerate_before_restraint":
        "Major states subsidized and restricted exports before they regulated, but some (EU-style) regulated first, so 100% is too clean.",
    "R7_backlash_sometimes":
        "Physical backlash against AI is possible but not routine.",
    "R8_boom_then_bust":
        "Investment manias usually overshoot and correct, but a correction is not guaranteed within ten years.",
    "R9_bloc_competition":
        "The second bloc is a real contender but behind on chips and capital; near-zero or parity wins both look wrong.",
    "I1_outcome_variety":
        "Replays should feel different, but not like a die roll with no structure.",
    "I2_no_inevitable_winner":
        "The favourite should be favoured, not inevitable; under 30% means roles stopped mattering.",
    "I3_unknowns_matter":
        "Hidden world parameters should shape the story, but not decide it alone; above 0.85 choices barely matter.",
    "I4_actors_react":
        "Actors should visibly respond to shocks; over 5x means they only ever move on shocks.",
    "I5_beliefs_diverge":
        "Different roles should read the same evidence differently, but not live in unrelated worlds.",
}


def mechanism_fire_rates(rows):
    keys = rows[0]["mechanisms"].keys() if rows else []
    return {k: round(_frac(rows, lambda r, k=k: r["mechanisms"].get(k, 0) == 1) or 0.0, 3)
            for k in keys}


def _score(table, rows):
    out = {}
    for k, (desc, fn) in table.items():
        try:
            val, ok = fn(rows)
        except Exception as exc:   # a check must never take the run down
            val, ok = f"error: {type(exc).__name__}: {exc}", False
        out[k] = dict(desc=desc, value=_r(val), passed=bool(ok), why=RATIONALE.get(k))
    return out


def summarize(rows):
    n = len(rows)
    outcomes, winners = {}, {}
    for r in rows:
        outcomes[r["outcome"]] = outcomes.get(r["outcome"], 0) + 1
        if r["winner"]:
            winners[r["winner"]] = winners.get(r["winner"], 0) + 1
    patt = _score(PATTERNS, rows)
    inter = _score(INTEREST, rows)
    numeric = {}
    for key in ("outcome_t", "capex_gt_rev_q_first12", "capex_rev_ratio_q0_7",
                "capex_rev_ratio_q12_20", "lead_changes", "durable_lead_changes",
                "frontier_gap_mean", "pacts_formed", "pact_breaks", "pact_expires",
                "defect_quarters", "open_weights", "incidents", "incidents_public", "disruptions",
                "bankruptcies", "acquisitions", "open_weights_first_t", "sentiment_crashes", "strategy_switches",
                "public_max", "hazard_belief_err", "hazard_belief_spread", "regulate_on",
                "subsidy_events", "export_controls", "thefts", "sabotages", "consolidations"):
        numeric[key] = _mean(r.get(key) for r in rows)
    return dict(
        n=n,
        outcomes={k: round(v / n, 3) for k, v in sorted(outcomes.items(), key=str)} if n else {},
        winners={k: round(v / n, 3) for k, v in sorted(winners.items())} if n else {},
        patterns=patt,
        interest=inter,
        patterns_passed=sum(1 for v in patt.values() if v["passed"]),
        interest_passed=sum(1 for v in inter.values() if v["passed"]),
        means={k: _r(v, 4) for k, v in numeric.items()},
        unknown_importance=unknown_importance(rows),
        mechanism_fire_rates=mechanism_fire_rates(rows),
    )
