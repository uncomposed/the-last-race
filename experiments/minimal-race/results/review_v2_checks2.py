import collections, core
c = collections.Counter(); seq = collections.Counter(); pact = collections.Counter()
for s in range(300):
    w = core.World(s).run()
    for e in w.events:
        if e["kind"] == "acquired":
            c[(e["lab"], e["by"])] += 1
        if e["kind"] == "bankrupt":
            c["bankrupt_t<=8"] += e["t"] <= 8
    order = [e["kind"] for e in w.events if e["kind"] in ("consolidate", "bankrupt")]
    seq[tuple(order[:2])] += 1
    for e in w.events:
        if e["kind"] in ("pact_form",):
            pact["formed"] += 1
    # pact continuing with < pact_min live members
    w2 = core.World(s)
    flagged = False
    while w2.t < w2.cfg["T"] and w2.outcome is None:
        w2.step()
        if w2.pact and sum(w2.labs[n].alive for n in w2.pact["members"]) < w2.cfg["pact_min"] and not flagged:
            pact["pact_below_min_live"] += 1; flagged = True
print(c.most_common(12)); print(seq.most_common(6)); print(dict(pact))
