import collections, core
ct = collections.Counter(); gate = [0, 0]; gate0 = 0; prop = collections.Counter()
for s in range(300):
    w = core.World(s)
    while w.t < w.cfg["T"] and w.outcome is None:
        labs = w.live_labs()
        if labs:
            worried = max(labs, key=lambda l: w.beliefs[l.name].hazard.mean())
            ok = w.hz_frac(worried.name) >= 0.4
            gate[0] += ok; gate[1] += 1; prop[worried.name] += ok
            if w.t == 0: gate0 += ok
        w.step()
    for e in w.events:
        if e["kind"] == "consolidate": ct[(e["gov"], e["t"])] += 1
print("consolidation (gov,t) top:", ct.most_common(6))
print("pact gate open in %.2f of quarters; open at t=0 in %d/300 seeds; gate-opening proposer:" % (gate[0]/gate[1], gate0), dict(prop))
