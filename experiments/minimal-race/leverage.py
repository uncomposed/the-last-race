"""Decision leverage map.

For a player seat (one lab), apply ONE strategic intervention at ONE quarter
and compare the outcome with the same seed untouched. Keyed randomness means
the only difference between the two runs is the intervention and what it
causes.

Questions this answers:
  1. How often can a single intervention change the outcome at all?
  2. Is there a dominant intervention (the game would be solved)?
  3. Does timing matter?
  4. Do the company's interest and the world's interest pull apart?
  5. Does the best move depend on hidden unknowns, and can the player read
     that from beliefs available at the time?

A placebo (+0.01 cash) measures the noise floor: how often a trivial nudge
flips the ending through threshold effects alone.

    python3 leverage.py --seeds 200 --out results/leverage.json
"""
from __future__ import annotations

import argparse
import json
import math
import os
import statistics as st
import sys
from multiprocessing import Pool

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import core  # noqa: E402

DURATION = 4   # quarters a forced plan or conviction lasts, as in the game

# Each intervention costs one of the player's three moves in the game.
INTERVENTIONS = {
    "null":           "do nothing (control)",
    "placebo":        "+0.01 cash (noise floor)",
    "force_race":     "override plan: race for 4 quarters",
    "force_safety":   "override plan: safety-heavy for 4 quarters",
    "force_pause":    "override plan: pause training for 4 quarters",
    "force_product":  "override plan: product-heavy for 4 quarters",
    "force_build":    "override plan: build-heavy for 4 quarters",
    "fear":           "belief conviction: hazard is high (4 quarters)",
    "calm":           "belief conviction: hazard is low (4 quarters)",
    "propose_pact":   "propose a pact now, even if nobody is worried yet",
    "open_weights":   "release weights openly now",
    "safety_push":    "one-off alignment push: 3 cash for +3 safety",
    "fundraise":      "raise 5 cash now",
    "lobby_regulate": "lobby own government to regulate (4 quarters)",
    "lobby_subsidy":  "lobby own government for subsidy (4 quarters)",
    "warn_public":    "public warning: raise public concern in both blocs",
}


class PlayerWorld(core.World):
    def __init__(self, seed, seat, kind, quarter, config=None):
        super().__init__(seed, config)
        self.seat, self.kind, self.q = seat, kind, quarter
        self.conviction = None      # GridBelief swapped in during decisions
        self.saved_hazard = None

    def active(self):
        return self.q <= self.t < self.q + DURATION

    def step(self):
        lab = self.labs[self.seat]
        self.arrive_compute()
        self.observe()
        self.internalize()
        if self.t == self.q and lab.alive:
            self.apply_once(lab)
        self.swap_in_conviction()
        self.government_decide()
        self.apply_lobbying(lab)
        self.covert_ops()
        self.diplomacy()
        self.labs_decide()
        self.swap_out_conviction()
        self.compute_market()
        self.capital_market()
        self.resolve_rnd()
        self.product_market()
        self.incidents()
        self.public_opinion()
        self.accounting()
        self.check_end()
        self.snapshot()
        self.t += 1

    # ---- one-off effects at the chosen quarter
    def apply_once(self, lab):
        k = self.kind
        if k == "placebo":
            lab.cash += 0.01
        elif k == "safety_push" and lab.cash > 3.0:
            lab.cash -= 3.0
            lab.S += 3.0
        elif k == "fundraise":
            lab.cash += 5.0
        elif k == "open_weights" and not lab.open_weights:
            lab.open_weights = True
            self.log("open_weights", lab=lab.name, rank=0, player=True)
        elif k == "warn_public":
            for b in self.public:
                self.public[b] += 0.5
        elif k in ("fear", "calm"):
            lo, hi = self.cfg["unknowns"]["hazard"]
            self.conviction = core.GridBelief(lo, hi, self.cfg["grid"],
                                              0.85 if k == "fear" else 0.1, concentration=12.0)
        elif k == "propose_pact" and not self.pact:
            self.force_pact(lab)
        self.log("player", lab=lab.name, action=k)

    def force_pact(self, proposer):
        labs = self.live_labs()
        joiners = {l.name for l in labs}
        for _ in range(3):
            joiners = {l.name for l in labs
                       if l.name == proposer.name or self.join_value(l, joiners) > 0}
        if len(joiners) >= self.cfg["pact_min"]:
            self.pact = dict(members=joiners, start=self.t, verify=self.cfg["pact_verify"], kind="lab")
            for n in joiners:
                self.labs[n].in_pact = True
            self.log("pact_form", members=sorted(joiners), proposer=proposer.name)

    # ---- belief conviction: decisions use it, evidence keeps updating underneath
    def swap_in_conviction(self):
        if self.conviction is not None and self.active():
            B = self.beliefs[self.seat]
            self.saved_hazard, B.hazard = B.hazard, self.conviction

    def swap_out_conviction(self):
        if self.saved_hazard is not None:
            self.beliefs[self.seat].hazard = self.saved_hazard
            self.saved_hazard = None

    # ---- lobbying adjusts own government's policy while active
    def apply_lobbying(self, lab):
        if not self.active() or not lab.alive:
            return
        pol = self.gov_policy[lab.bloc]
        if self.kind == "lobby_regulate":
            pol["regulate"] = min(1.0, pol["regulate"] + 0.3)
        elif self.kind == "lobby_subsidy":
            pol["subsidy"] = min(1.0, pol["subsidy"] + 0.3)

    # ---- forced plan
    def labs_decide(self):
        forced = {"force_race": "race", "force_safety": "safety", "force_pause": "pause",
                  "force_product": "product", "force_build": "build"}.get(self.kind)
        super().labs_decide()
        lab = self.labs[self.seat]
        if forced and self.active() and lab.alive:
            if lab.in_pact and self.templates[forced][1] > self.cfg["pact_cap"] + 1e-9:
                self.log("defect", lab=lab.name, template=forced)
            lab.template = forced


def scores(w, seat):
    """Company score for the seat and world score (both 0..1)."""
    o = w.outcome
    cat = o["kind"].startswith("catastrophe")
    alive = w.labs[seat].alive
    if cat:
        company = 0.0
    elif o["winner"] == seat:
        company = 1.0
    elif alive:
        company = 0.3
    else:
        company = 0.0
    return company, 0.0 if cat else 1.0


def believed_hazard_at(seed, q, seat):
    """What the seat believed about hazard at quarter q in the untouched run
    (information a player would have when choosing)."""
    w = core.World(seed)
    while w.t <= q and w.outcome is None:
        w.step()
    lo, hi = w.cfg["unknowns"]["hazard"]
    return (w.beliefs[seat].hazard.mean() - lo) / (hi - lo)


def job(args):
    seed, seat, quarters = args
    base = PlayerWorld(seed, seat, "null", -99).run()
    b_comp, b_world = scores(base, seat)
    rows = []
    for q in quarters:
        if q >= base.outcome["t"]:
            continue          # the run ended before this quarter in the baseline
        for kind in INTERVENTIONS:
            if kind == "null":
                continue
            w = PlayerWorld(seed, seat, kind, q).run()
            comp, world = scores(w, seat)
            rows.append(dict(seed=seed, seat=seat, q=q, kind=kind,
                             d_company=comp - b_comp, d_world=world - b_world,
                             flipped=w.outcome["kind"] != base.outcome["kind"]
                             or w.outcome["winner"] != base.outcome["winner"]))
    return dict(seed=seed, seat=seat, base_company=b_comp, base_world=b_world,
                base_outcome=base.outcome["kind"], base_t=base.outcome["t"],
                unk=base.unk, rows=rows)


def corr(a, b):
    if len(a) < 3:
        return 0.0
    ma, mb = st.mean(a), st.mean(b)
    va = sum((x - ma) ** 2 for x in a)
    vb = sum((y - mb) ** 2 for y in b)
    return 0.0 if va <= 0 or vb <= 0 else sum((x - ma) * (y - mb) for x, y in zip(a, b)) / math.sqrt(va * vb)


def analyse(results, quarters):
    out = {}
    seats = sorted({r["seat"] for r in results})
    kinds = [k for k in INTERVENTIONS if k != "null"]
    for seat in seats:
        R = [r for r in results if r["seat"] == seat]
        rows = [x for r in R for x in r["rows"]]
        by = lambda f: [x for x in rows if f(x)]
        placebo_flip = st.mean([x["flipped"] for x in by(lambda x: x["kind"] == "placebo")] or [0])
        table = {}
        for k in kinds:
            ks = by(lambda x, k=k: x["kind"] == k)
            if not ks:
                continue
            table[k] = dict(
                flip_rate=round(st.mean(x["flipped"] for x in ks), 3),
                d_world=round(st.mean(x["d_world"] for x in ks), 3),
                d_company=round(st.mean(x["d_company"] for x in ks), 3),
                by_quarter={q: round(st.mean([x["d_world"] for x in ks if x["q"] == q] or [0]), 3)
                            for q in quarters})
        # Best single move per (seed, quarter), for the world and for the company.
        best_world, best_comp, any_help_world, conflict = {}, {}, [], []
        cells = {}
        for x in rows:
            cells.setdefault((x["seed"], x["q"]), []).append(x)
        for cell in cells.values():
            cell = [x for x in cell if x["kind"] != "placebo"]
            bw = max(cell, key=lambda x: (x["d_world"], x["d_company"]))
            bc = max(cell, key=lambda x: (x["d_company"], x["d_world"]))
            if bw["d_world"] > 0:
                best_world[bw["kind"]] = best_world.get(bw["kind"], 0) + 1
            if bc["d_company"] > 0:
                best_comp[bc["kind"]] = best_comp.get(bc["kind"], 0) + 1
            any_help_world.append(bw["d_world"] > 0)
            conflict.append(bc["d_company"] > 0 and bc["d_world"] < 0)
        n_cells = len(cells)
        # Does the world-value of the top moves depend on the hidden hazard,
        # and on what the seat believed at the time?
        unk_by_seed = {r["seed"]: r["unk"] for r in R}
        dep = {}
        for k in ("fear", "calm", "force_safety", "force_race", "propose_pact", "warn_public", "safety_push"):
            ks = [x for x in rows if x["kind"] == k and x["q"] in (quarters[1], quarters[2])]
            if len(ks) > 10:
                dep[k] = dict(
                    r_hazard_truth=round(corr([unk_by_seed[x["seed"]]["hazard"] for x in ks],
                                              [x["d_world"] for x in ks]), 3))
        out[seat] = dict(
            seeds=len(R),
            baseline_catastrophe=round(1 - st.mean(r["base_world"] for r in R), 3),
            placebo_flip_rate=round(placebo_flip, 3),
            interventions=table,
            cells=n_cells,
            share_cells_some_move_saves_world=round(st.mean(any_help_world), 3),
            share_cells_company_best_hurts_world=round(st.mean(conflict), 3),
            best_for_world=dict(sorted(best_world.items(), key=lambda kv: -kv[1])),
            best_for_company=dict(sorted(best_comp.items(), key=lambda kv: -kv[1])),
            depends_on_hidden_hazard=dep,
        )
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", type=int, default=200)
    ap.add_argument("--seats", default="frontier,state,safety")
    ap.add_argument("--quarters", default="0,4,8,12,16")
    ap.add_argument("--out")
    a = ap.parse_args()
    quarters = [int(x) for x in a.quarters.split(",")]
    jobs = [(s, seat, quarters) for seat in a.seats.split(",") for s in range(a.seeds)]
    with Pool(max(1, (os.cpu_count() or 2) - 1)) as p:
        results = p.map(job, jobs, chunksize=4)
    summary = analyse(results, quarters)
    if a.out:
        with open(a.out, "w") as f:
            json.dump(dict(summary=summary, raw=results), f)
    print(json.dumps(summary, indent=1))


if __name__ == "__main__":
    main()
