"""h13 v2: frontier-coverage pact with a join-value margin.

Adjustment from v1. In v1 the top-2 labs always clear join_value > 0 in the
final pruning set (margins 0.002 to 0.12), so the coverage rule never rejected
a pact and the variant was identical to baseline. v2 also requires each
believed top-2 lab to have join_value > COVER_MARGIN in the final joiners set.
COVER_MARGIN = 0.05 is a judgment call, not a measured value.

Belief-only, same as v1: ranking uses own C and B.cap[*].mu; no new RNG draws.
"""
import core

COVER_MARGIN = 0.05


class VariantWorld(core.World):
    def believed_top2(self, proposer):
        B = self.beliefs[proposer.name]
        est = {proposer.name: proposer.C}
        for n, e in B.cap.items():
            if n in self.labs and self.labs[n].alive:
                est[n] = e.mu
        ranked = sorted(est, key=lambda n: est[n], reverse=True)
        return set(ranked[:2])

    def diplomacy(self):
        if self.pact:
            super().diplomacy()
            return
        c = self.cfg
        labs = self.live_labs()
        if not labs:
            return
        worried = max(labs, key=lambda l: self.beliefs[l.name].hazard.mean())
        hz_hi = c["unknowns"]["hazard"][1]
        if self.beliefs[worried.name].hazard.mean() / hz_hi < 0.4:
            return
        joiners = {l.name for l in labs}
        for _ in range(3):
            nxt = set()
            for l in labs:
                if self.join_value(l, joiners) > 0:
                    nxt.add(l.name)
            joiners = nxt
        if len(joiners) < c["pact_min"]:
            return
        top2 = self.believed_top2(worried)
        missing = sorted(top2 - joiners)
        weak = sorted(n for n in top2 & joiners
                      if self.join_value(self.labs[n], joiners) <= COVER_MARGIN)
        if missing or weak:
            self.log("pact_reject_coverage", proposer=worried.name,
                     top2=sorted(top2), missing=missing, weak=weak, size=len(joiners))
            return
        self.pact = dict(members=joiners, start=self.t, verify=c["pact_verify"], kind="lab")
        for n in joiners:
            self.labs[n].in_pact = True
        self.log("pact_form", members=sorted(joiners), proposer=worried.name,
                 covers_top2=sorted(top2))
