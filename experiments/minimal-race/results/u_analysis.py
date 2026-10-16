"""Round 3 analysis: five unseating mechanisms, singly, combined, and knocked out.

    python3 results/u_analysis.py --null --seeds 300        # all-off must equal the core
    python3 results/u_analysis.py --rates --seeds 300       # fire rates only (calibration)
    python3 results/u_analysis.py --start 1000 --seeds 1000 --out results/u_unseating_heldout.json

Conditions, all on the same seeds:
    baseline            core v2
    only:<m>            one mechanism on
    all                 all five on
    all-minus:<m>       knockout inside the combined world

Paired deltas are condition minus baseline (singles, all) or minus `all`
(knockouts). A delta counts if |mean| > 2 x standard error.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import statistics as st
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

import core      # noqa: E402
import metrics   # noqa: E402
from run import paired_deltas  # noqa: E402

spec = importlib.util.spec_from_file_location("u_unseating", os.path.join(ROOT, "variants", "u_unseating.py"))
U = importlib.util.module_from_spec(spec)
spec.loader.exec_module(U)

EVENT_KINDS = ("supply_shock", "decree", "near_miss", "seize_declined", "nationalize", "dissolve",
               "crisis", "leak", "king_attack", "disruption")


def unseat_metrics(w):
    out = w.outcome or {}
    winner = out.get("winner")
    fr = w.labs["frontier"]
    leaders = metrics._leaders(w.history)
    ev = w.events
    r = dict(
        frontier_win=int(winner == "frontier"),
        frontier_private_win=int(winner == "frontier" and not getattr(fr, "nationalized", False)),
        bloc_a_win=int(out.get("bloc") == "A"),
        bloc_b_win=int(out.get("bloc") == "B"),
        frontier_leads_end=int(bool(leaders) and leaders[-1] == "frontier"),
        frontier_fate=getattr(fr, "fate", None) or ("alive" if fr.alive else "dead"),
        catastrophe=int((out.get("kind") or "").startswith("catastrophe")),
        winner=winner,
        winner_bloc=out.get("bloc"),
    )
    for k in EVENT_KINDS:
        r[f"n_{k}"] = sum(1 for e in ev if e["kind"] == k)
    r["shock_cause"] = next((e["cause"] for e in ev if e["kind"] == "supply_shock"), None)
    r["decree_labs"] = [e["lab"] for e in ev if e["kind"] == "decree"]
    r["crisis_detail"] = [(e["lab"], e["how"]) for e in ev if e["kind"] == "crisis"]
    r["attacks"] = [(e["lab"], e["target"], e["how"], e["ok"], e["detected"], e["retaliation"])
                    for e in ev if e["kind"] == "king_attack"]
    r["seized"] = [(e["kind"], e["lab"]) for e in ev if e["kind"] in ("nationalize", "dissolve")]
    return r


def world(seed, only=None, off=(), base=False):
    if base:
        return core.World(seed, core.make_base_config()).run()
    conf = U.make_config(core.make_base_config(), only=only, off=off)
    return U.VariantWorld(seed, conf).run()


def rows(seeds, **kw):
    out = []
    for s in seeds:
        w = world(s, **kw)
        m = metrics.run_metrics(w)
        m.update(unseat_metrics(w))
        out.append(m)
    return out


def se(xs):
    return st.stdev(xs) / len(xs) ** 0.5 if len(xs) > 1 else 0.0


UKEYS = ("frontier_win", "frontier_private_win", "bloc_a_win", "bloc_b_win", "frontier_leads_end")


def paired_u(base, var):
    out = {}
    for k in UKEYS:
        d = [v[k] - b[k] for b, v in zip(base, var)]
        out[k] = dict(mean=round(st.mean(d), 4), se=round(se(d), 4))
    return out


def rates(rs):
    n = len(rs)
    out = {f"runs_with_{k}": round(sum(1 for r in rs if r[f"n_{k}"] > 0) / n, 3) for k in EVENT_KINDS}
    out["mean_attacks"] = round(st.mean(r["n_king_attack"] for r in rs), 3)
    att = [a for r in rs for a in r["attacks"]]
    if att:
        by = {}
        for a in att:
            by[a[0]] = by.get(a[0], 0) + 1
        out["attacks_by_attacker"] = dict(sorted(by.items()))
        tg = {}
        for a in att:
            tg[a[1]] = tg.get(a[1], 0) + 1
        out["attacks_by_target"] = dict(sorted(tg.items()))
        out["attack_ok_share"] = round(sum(a[3] for a in att) / len(att), 3)
        out["attack_detected_share"] = round(sum(a[4] for a in att) / len(att), 3)
        out["attack_retaliation_share"] = round(sum(a[5] for a in att) / len(att), 3)
        hw = {}
        for a in att:
            hw[a[2]] = hw.get(a[2], 0) + 1
        out["attacks_by_kind"] = dict(sorted(hw.items()))
    cr = [c for r in rs for c in r["crisis_detail"]]
    if cr:
        by = {}
        for lab, how in cr:
            by[f"{lab}:{how}"] = by.get(f"{lab}:{how}", 0) + 1
        out["crises_by_lab"] = dict(sorted(by.items()))
    dl = [x for r in rs for x in r["decree_labs"]]
    if dl:
        by = {}
        for lab in dl:
            by[lab] = by.get(lab, 0) + 1
        out["decrees_by_lab"] = dict(sorted(by.items()))
    sz = [x for r in rs for x in r["seized"]]
    if sz:
        by = {}
        for kind, lab in sz:
            by[f"{kind}:{lab}"] = by.get(f"{kind}:{lab}", 0) + 1
        out["seizures"] = dict(sorted(by.items()))
    causes = {}
    for r in rs:
        if r["shock_cause"]:
            causes[r["shock_cause"]] = causes.get(r["shock_cause"], 0) + 1
    if causes:
        out["shock_causes"] = {k: round(v / n, 3) for k, v in sorted(causes.items())}
    fates = {}
    for r in rs:
        fates[r["frontier_fate"]] = fates.get(r["frontier_fate"], 0) + 1
    out["frontier_fate"] = {k: round(v / n, 3) for k, v in sorted(fates.items(), key=str)}
    return out


def headline(rs):
    n = len(rs)
    s = metrics.summarize(rs)
    a_wins = [r for r in rs if r["bloc_a_win"]]
    return dict(
        outcomes=s["outcomes"],
        winners=s["winners"],
        frontier_win=round(sum(r["frontier_win"] for r in rs) / n, 3),
        frontier_private_win=round(sum(r["frontier_private_win"] for r in rs) / n, 3),
        frontier_share_of_bloc_a_wins=round(sum(r["frontier_win"] for r in a_wins) / len(a_wins), 3) if a_wins else None,
        bloc_b_win=round(sum(r["bloc_b_win"] for r in rs) / n, 3),
        frontier_leads_end=round(sum(r["frontier_leads_end"] for r in rs) / n, 3),
        catastrophe=round(sum(r["catastrophe"] for r in rs) / n, 3),
        lead_changes=round(st.mean(r["lead_changes"] for r in rs), 3),
        durable_lead_changes=round(st.mean(r["durable_lead_changes"] for r in rs), 3),
        checks={k: v["passed"] for k, v in {**s["patterns"], **s["interest"]}.items()},
        rates=rates(rs),
    )


def compare(base, var):
    pd = paired_deltas(base, var)
    pd.update(paired_u(base, var))
    sig = {k: v["mean"] for k, v in pd.items()
           if isinstance(v, dict) and v["se"] > 0 and abs(v["mean"]) > 2 * v["se"]}
    return dict(significant=sig, deltas=pd)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", type=int, default=500)
    ap.add_argument("--start", type=int, default=0, help="first seed")
    ap.add_argument("--null", action="store_true")
    ap.add_argument("--rates", action="store_true")
    ap.add_argument("--out")
    a = ap.parse_args()
    seeds = list(range(a.start, a.start + a.seeds))
    if a.null:
        bad = 0
        for s in seeds:
            b = world(s, base=True)
            v = world(s, only=set())
            if b.history != v.history or b.outcome != v.outcome or b.events != v.events:
                bad += 1
        print(json.dumps(dict(seeds=len(seeds), mismatches=bad)))
        return
    if a.rates:
        out = {}
        for m in U.UNSEAT:
            out[m] = rates(rows(seeds, only={m}))
        out["all"] = rates(rows(seeds))
        print(json.dumps(out, indent=1))
        return
    base = rows(seeds, base=True)
    allr = rows(seeds)
    out = dict(seeds=len(seeds), first_seed=a.start, baseline=headline(base), all=headline(allr),
               all_vs_baseline=compare(base, allr), single={}, knockout={})
    for m in U.UNSEAT:
        r = rows(seeds, only={m})
        out["single"][m] = dict(headline=headline(r), vs_baseline=compare(base, r))
        k = rows(seeds, off={m})
        h = headline(k)
        out["knockout"][m] = dict(headline=h, vs_all=compare(allr, k),
                                  check_flips=[c for c, v in h["checks"].items()
                                               if v != out["all"]["checks"][c]])
    text = json.dumps(out, indent=1, default=str)
    if a.out:
        with open(a.out, "w") as f:
            f.write(text)
    print(text)


if __name__ == "__main__":
    main()
