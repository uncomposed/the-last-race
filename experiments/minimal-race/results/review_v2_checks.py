import collections, statistics as st, core
N = 300
ev = collections.defaultdict(list)
cnt = collections.Counter()
dem_ratio = collections.defaultdict(list); hz_pairs = collections.defaultdict(list)
first_gapB = []; trueB_behind = []
outc = collections.Counter()
for s in range(N):
    w = core.World(s)
    pact_dead = False
    while w.t < w.cfg["T"] and w.outcome is None:
        w.step()
        if w.pact and any(not w.labs[n].alive for n in w.pact["members"]):
            pact_dead = True
    if w.outcome is None: w.outcome = dict(kind="no_takeoff")
    outc[w.outcome["kind"]] += 1
    cnt["pact_with_dead_member"] += pact_dead
    kinds = collections.defaultdict(list)
    for e in w.events: kinds[e["kind"]].append(e)
    for k in ("consolidate","theft_attempt","theft_success","sabotage","export_controls","pact_form","bankrupt","acquired","catastrophe","disclosure_on"):
        if kinds[k]:
            cnt[k+"_seeds"] += 1
    for e in kinds["consolidate"]: ev["consolidate_"+e["gov"]].append(e["t"])
    for k in ("theft_attempt","sabotage"):
        for g in "AB":
            ts = [e["t"] for e in kinds[k] if e["gov"]==g]
            if ts: ev[f"{k}_{g}_first_t"].append(ts[0]); ev[f"{k}_{g}_n"].append(len(ts))
    if kinds["export_controls"]: ev["export_first_t"].append(kinds["export_controls"][0]["t"])
    for e in kinds["acquired"]:
        if w.labs[e["lab"]].bloc != w.labs[e["by"]].bloc: cnt["cross_bloc_acquisition"] += 1
        cnt["acquisition"] += 1
    ts = [e["t"] for e in kinds["catastrophe"]]
    if len(ts) != len(set(ts)): cnt["catastrophe_overwrite"] += 1
    for n, B in w.beliefs.items():
        dem_ratio[n].append(B.demand.mean() / w.unk["demand"])
        hz_pairs[n].append((B.hazard.mean(), w.unk["hazard"]))
        if B.defect_b != 2.0: cnt["defect_b_changed"] += 1
    gB = w.gap_hist["B"]; first_gapB.append(gB[4] if len(gB) > 4 else None)
    for l in w.labs.values():
        if not l.alive and l.in_pact: cnt["dead_lab_in_pact_flag"] += 1
print("outcomes", dict(outc))
print(dict(cnt))
for k, v in sorted(ev.items()):
    print(k, "n=%d" % len(v), "median=%.1f" % st.median(v), "min=%d" % min(v), "hist<=6:", sum(1 for x in v if x <= 6))
print("demand belief/truth (median, by actor):", {n: round(st.median(v), 2) for n, v in dem_ratio.items()})
def corr(p):
    a = [x for x, _ in p]; b = [y for _, y in p]
    return round(st.correlation(a, b), 2), round(st.median([x/y for x, y in p]), 2)
print("hazard belief vs truth (corr, median ratio):", {n: corr(v) for n, v in hz_pairs.items()})
g4 = [x for x in first_gapB if x is not None]
print("govB believed gap at t=4: median %.2f, frac < -3: %.2f, frac < -4: %.2f" % (st.median(g4), sum(x < -3 for x in g4)/len(g4), sum(x < -4 for x in g4)/len(g4)))
