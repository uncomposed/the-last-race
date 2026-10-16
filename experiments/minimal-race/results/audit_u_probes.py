"""Auditor probes for round 3 (u_unseating). New file; edits nothing.

    python3 results/audit_u_probes.py replicate   # seeds 500-999
    python3 results/audit_u_probes.py nudge       # main knob x0.7 / x1.3, seeds 0-499
    python3 results/audit_u_probes.py struct      # rule-structure probes, seeds 0-499
    python3 results/audit_u_probes.py checks      # R1/R8 detail, seeds 0-499
"""
import json
import math
import os
import statistics as st
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.argv, _argv = sys.argv[:1], sys.argv
import u_analysis as A   # noqa: E402
sys.argv = _argv
import core              # noqa: E402
import metrics           # noqa: E402

U = A.U
KEYS = ("frontier_win", "bloc_b_win", "catastrophe", "frontier_leads_end")


def d(base, var, k):
    xs = [v[k] - b[k] for b, v in zip(base, var)]
    m, s = st.mean(xs), A.se(xs)
    return [round(m, 4), round(s, 4), "SIG" if s > 0 and abs(m) > 2 * s else ""]


def d_t(base, var):
    xs = [(v["outcome_t"] or 0) - (b["outcome_t"] or 0) for b, v in zip(base, var)]
    m, s = st.mean(xs), A.se(xs)
    return [round(m, 3), round(s, 3), "SIG" if s > 0 and abs(m) > 2 * s else ""]


def summary(base, var):
    out = {k: d(base, var, k) for k in KEYS}
    out["outcome_t"] = d_t(base, var)
    out["lead_changes"] = d(base, var, "lead_changes")
    return out


def run_rows(seeds, cls, conf):
    out = []
    for s in seeds:
        import copy
        w = cls(s, copy.deepcopy(conf)).run()
        m = metrics.run_metrics(w)
        m.update(A.unseat_metrics(w))
        out.append(m)
    return out


def conf_for(only=None, off=(), patch=None):
    c = U.make_config(core.make_base_config(), only=only, off=off)
    if patch:
        patch(c)
    return c


def base_rows(seeds):
    return [dict(metrics.run_metrics(w), **A.unseat_metrics(w))
            for w in (core.World(s, core.make_base_config()).run() for s in seeds)]


# ---------------------------------------------------------------- replicate
def replicate():
    seeds = list(range(500, 1000))
    base = base_rows(seeds)
    out = {"seeds": "500-999"}
    allr = run_rows(seeds, U.VariantWorld, conf_for())
    out["all_vs_base"] = summary(base, allr)
    out["levels"] = dict(base_frontier=st.mean(r["frontier_win"] for r in base),
                         all_frontier=st.mean(r["frontier_win"] for r in allr),
                         base_cat=st.mean(r["catastrophe"] for r in base),
                         all_cat=st.mean(r["catastrophe"] for r in allr))
    out["all_rates"] = A.rates(allr)
    for m in U.UNSEAT:
        r = run_rows(seeds, U.VariantWorld, conf_for(only={m}))
        out[f"only_{m}"] = summary(base, r)
        out[f"only_{m}_rates"] = {k: v for k, v in A.rates(r).items()
                                  if k in ("seizures", "crises_by_lab", "decrees_by_lab",
                                           "attack_detected_share", "attacks_by_attacker")}
        k = run_rows(seeds, U.VariantWorld, conf_for(off={m}))
        out[f"ko_{m}_vs_all"] = summary(allr, k)
    return out


# ---------------------------------------------------------------- nudges
def scale_range(rng, f):
    lo, hi = rng
    return (min(0.95, lo * f), min(0.95, hi * f))


NUDGE = {
    "supply_shock": lambda u, f: u.update(shock_depth=scale_range(u["shock_depth"], f),
                                          blockade_depth=scale_range(u["blockade_depth"], f)),
    "targeted_scrutiny": lambda u, f: u.update(decree_threshold=u["decree_threshold"] * f),
    "seizure": lambda u, f: u.update(seize_threshold=u["seize_threshold"] * f),
    "governance": lambda u, f: u.update(tension_threshold=u["tension_threshold"] * f),
    "king": lambda u, f: u.update(king_try={k: v * f for k, v in u["king_try"].items()}),
}


def nudge():
    seeds = list(range(500))
    base = base_rows(seeds)
    out = {}
    for m, fn in NUDGE.items():
        for f in (0.7, 1.3):
            def patch(c, fn=fn, f=f):
                u = dict(c["cfg"]["u"])
                fn(u, f)
                c["cfg"]["u"] = u
            r = run_rows(seeds, U.VariantWorld, conf_for(only={m}, patch=patch))
            out[f"only_{m}_x{f}"] = summary(base, r)
            ra = A.rates(r)
            out[f"only_{m}_x{f}"]["detail"] = {k: v for k, v in ra.items()
                                                if k in ("seizures", "runs_with_decree", "runs_with_crisis",
                                                         "mean_attacks", "runs_with_supply_shock")}
    # all five, every knob nudged together
    for f in (0.7, 1.3):
        def patch(c, f=f):
            u = dict(c["cfg"]["u"])
            for fn in NUDGE.values():
                fn(u, f)
            c["cfg"]["u"] = u
        r = run_rows(seeds, U.VariantWorld, conf_for(patch=patch))
        out[f"all_x{f}"] = summary(base, r)
    # nationalize-vs-dissolve knob
    for f in (0.7, 1.3):
        def patch(c, f=f):
            u = dict(c["cfg"]["u"])
            u["seize_keep_gap"] = u["seize_keep_gap"] * f
            c["cfg"]["u"] = u
        r = run_rows(seeds, U.VariantWorld, conf_for(only={"seizure"}, patch=patch))
        out[f"seize_keep_gap_x{f}"] = A.rates(r).get("seizures")
    return out


# ---------------------------------------------------------------- structure probes
class NoStaffMultiplier(U.VariantWorld):
    """Governance with staff fear = leadership fear (no (1+2*discount) boost)."""
    def governance(self):
        # (1 + 2*d) with d=0 is 1, so staff_fear = leader_fear; restore after.
        real = {}
        for l in self.live_labs():
            real[l.name] = self.beliefs[l.name].self_discount
            self.beliefs[l.name].self_discount = 0.0
        try:
            super().governance()
        finally:
            for n, v in real.items():
                # an ouster halves the discount: apply that to the real value
                if self.beliefs[n].self_discount == 0.0:
                    self.beliefs[n].self_discount = v
                    for e in self.events:
                        if e["t"] == self.t and e["kind"] == "crisis" and e["lab"] == n and e["how"] == "ouster":
                            self.beliefs[n].self_discount = v * 0.5


class NoChampion(U.VariantWorld):
    """Decrees without national-champion protection."""
    def decrees(self):
        saved = {b: dict(g["w"]) for b, g in self.govs_conf.items()}
        for g in self.govs_conf.values():
            g["w"] = dict(g["w"], nation=0.0)
        try:
            super().decrees()
        finally:
            for b, g in self.govs_conf.items():
                g["w"] = saved[b]


class BChips(core.World):
    """Baseline core, bloc B gets 30% more chip access under export controls."""
    def compute_market(self):
        c = self.cfg
        supply = c["chip_supply0"] * (1 + c["chip_supply_growth"]) ** self.t
        orders = {}
        for l in self.live_labs():
            build = self.templates[l.template][0]
            spend = build * max(0.0, l.cash) * 0.5
            if l.bloc == "B" and self.export_controls:
                spend *= 0.78
            orders[l.name] = spend
        total = sum(orders.values())
        self.chip_price = c["chip_price0"] * max(1.0, total / max(1e-6, c["chip_price0"] * supply)) ** 0.7
        for l in self.live_labs():
            spend = orders[l.name]
            units = spend / self.chip_price
            if l.bloc == "B" and self.export_controls:
                units *= 0.91
            l.cash -= spend
            l.capex = spend
            if units > 0:
                l.pipeline.append((self.t + c["compute_lag"], units))


def struct():
    seeds = list(range(500))
    base = base_rows(seeds)
    out = {}
    r = run_rows(seeds, NoStaffMultiplier, conf_for(only={"governance"}))
    out["governance_no_staff_multiplier"] = summary(base, r)
    out["governance_no_staff_multiplier"]["crises_by_lab"] = A.rates(r).get("crises_by_lab")
    out["governance_no_staff_multiplier"]["runs_with_crisis"] = A.rates(r).get("runs_with_crisis")
    r = run_rows(seeds, NoChampion, conf_for(only={"targeted_scrutiny"}))
    out["scrutiny_no_champion_protection"] = summary(base, r)
    out["scrutiny_no_champion_protection"]["decrees_by_lab"] = A.rates(r).get("decrees_by_lab")
    # decree protection actually applied to the frontier (original rule)
    r0 = []
    for s in seeds:
        w = U.VariantWorld(s, conf_for(only={"targeted_scrutiny"})).run()
        r0 += [e for e in w.events if e["kind"] == "decree"]
    fr = [e for e in r0 if e["lab"] == "frontier"]
    out["decree_events"] = dict(n=len(r0), frontier=len(fr),
                                frontier_protected_gt0=sum(1 for e in fr if e["protected"] > 0))
    # bloc B: capital vs chips (baseline core, no unseating mechanisms)
    def cap(c):
        c["cfg"]["bloc_b_market_access"] *= 1.3
    cb = core.make_base_config()
    cap(cb)
    rc = [dict(metrics.run_metrics(w), **A.unseat_metrics(w)) for w in
          (core.World(s, cb).run() for s in seeds)]
    out["bloc_b_capital_x1.3"] = summary(base, rc)
    rk = [dict(metrics.run_metrics(w), **A.unseat_metrics(w)) for w in
          (BChips(s, core.make_base_config()).run() for s in seeds)]
    out["bloc_b_chip_access_x1.3"] = summary(base, rk)
    # nationalized state lab loses its state subsidy multiplier
    n_state_nat = 0
    for s in seeds:
        w = U.VariantWorld(s, conf_for(only={"seizure"})).run()
        n_state_nat += sum(1 for e in w.events if e["kind"] == "nationalize" and e["lab"] == "state")
    out["state_lab_nationalized_runs"] = n_state_nat
    return out


def checks():
    seeds = list(range(500))
    base = base_rows(seeds)
    allr = run_rows(seeds, U.VariantWorld, conf_for())
    sb, sa = metrics.summarize(base), metrics.summarize(allr)
    out = {}
    for k in ("R1_leader_persists_with_churn", "R8_boom_then_bust"):
        out[k] = dict(base=sb["patterns"][k], all=sa["patterns"][k])
    return out


if __name__ == "__main__":
    mode = _argv[1]
    res = dict(replicate=replicate, nudge=nudge, struct=struct, checks=checks)[mode]()
    text = json.dumps(res, indent=1, default=str)
    with open(os.path.join(HERE, f"audit_u_{mode}.json"), "w") as f:
        f.write(text)
    print(text)
