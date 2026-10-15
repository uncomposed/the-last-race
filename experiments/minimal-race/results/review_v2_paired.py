import collections, statistics as st, math, core
N = 300
def summarize(cls, label):
    out = collections.Counter(); first = []; zero_gain = 0; succ = 0
    by_eff = collections.defaultdict(list); hz = []
    for s in range(N):
        w = cls(s).run()
        out[w.outcome["kind"]] += 1
        out["winB"] += w.outcome.get("bloc") == "B"
        cons = [e for e in w.events if e["kind"] == "consolidate" and e["gov"] == "B"]
        out["consB"] += bool(cons)
        out["theftB"] += any(e["kind"] == "theft_attempt" and e["gov"] == "B" for e in w.events)
        out["sabB"] += any(e["kind"] == "sabotage" and e["gov"] == "B" for e in w.events)
        for e in w.events:
            if e["kind"] == "theft_success":
                succ += 1; zero_gain += e["gain"] == 0
        by_eff[min(2, int((w.unk["b_efficiency"] - 0.75) / 0.7 * 3))].append(bool(cons))
        hz.append(st.median(B.hazard.mean() for B in w.beliefs.values()) / w.unk["hazard"])
    print(label, dict(out), "theft_success zero-gain %d/%d" % (zero_gain, succ),
          "consB by b_eff tercile", [round(sum(v)/len(v), 2) for k, v in sorted(by_eff.items())],
          "hazard belief/truth median %.2f" % st.median(hz))

class SameBlocAcq(core.World):
    def accounting(self):
        orig = self.live_labs
        # restrict buyers to same bloc by temporarily filtering during bankruptcy
        c = self.cfg
        for l in self.live_labs():
            l.cash -= c["upkeep"] * l.K
            if l.cash < -2.0:
                l.alive = False
                self.log("bankrupt", lab=l.name)
                buyers = [x for x in self.live_labs() if x.name != l.name and x.bloc == l.bloc]
                if buyers:
                    acq = max(buyers, key=lambda x: x.cash); acq.K += 0.5 * l.K
                    self.log("acquired", lab=l.name, by=acq.name)
            l.cash += c["upkeep"] * l.K if False else 0.0
        # rest of accounting (sentiment) copied from core
        prev = self.last_market_rev
        if prev > 0.05:
            growth = self.market_rev / prev - 1
            surprise = growth - self.expected_rev_growth
            self.sentiment *= math.exp(c["sentiment_eta"] * max(-0.5, min(0.5, surprise)))
        hype = sum(max(0.0, l.C - l.deployed_C * 0.95) for l in self.live_labs())
        self.expected_rev_growth = 0.7 * self.expected_rev_growth + 0.3 * (0.03 + 0.02 * hype)
        self.sentiment = max(0.15, min(3.0, self.sentiment))
        self.last_market_rev = self.market_rev

class NoExport(core.World):
    def government_decide(self):
        self.export_controls = True  # sentinel to block trigger
        super().government_decide()
        self.export_controls = False
    def compute_market(self):
        self.export_controls = False
        super().compute_market()

class HazardExposure(core.World):
    def believed_exposure(self, who, split=False):
        r = super().believed_exposure(who, split)
        f = 0.55   # approx true per-lab exposure factor 0.3*train_frac + serve share
        return (r[0] * f, r[1] * f) if split else r * f

summarize(core.World, "base     ")
summarize(SameBlocAcq, "samebloc ")
summarize(NoExport, "noexport ")
summarize(HazardExposure, "hzexpo   ")
