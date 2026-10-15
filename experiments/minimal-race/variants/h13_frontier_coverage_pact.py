"""h13: frontier-coverage pact requirement.

Claim under test: pacts that must cover the two labs each proposer believes
are the capability frontier form less often, last longer, and reduce
catastrophe more per pact formed than pacts that only need pact_min members.

Mechanism: the proposal logic in core.World.diplomacy() is reproduced exactly,
with one added condition. After the conditional best-response loop produces
the joiners set, the proposer computes its believed top-2 labs by capability
and forms the pact only if both are in joiners (and len(joiners) >= pact_min,
as before). Otherwise nothing forms and a "pact_reject_coverage" event is
logged when the size test alone would have passed.

Belief-only: the proposer ranks labs using its own C (its own state) and
B.cap[*].mu (its beliefs about rivals). It never reads self.labs[*].C of rivals
or self.unk. No new randomness is drawn, so the paired baseline draws are
unchanged. Pact breaks, expiry and defection are unchanged (super() handles
the in-pact branch).
"""
import core


class VariantWorld(core.World):
    def believed_top2(self, proposer):
        """Proposer's believed top-2 live labs by capability (own C plus rivals' mu)."""
        B = self.beliefs[proposer.name]
        est = {proposer.name: proposer.C}
        for n, e in B.cap.items():
            if n in self.labs and self.labs[n].alive:
                est[n] = e.mu
        ranked = sorted(est, key=lambda n: est[n], reverse=True)
        return set(ranked[:2])

    def diplomacy(self):
        if self.pact:
            # Breaks and expiry follow the baseline rules.
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
        if missing:
            self.log("pact_reject_coverage", proposer=worried.name,
                     top2=sorted(top2), missing=missing, size=len(joiners))
            return
        self.pact = dict(members=joiners, start=self.t, verify=c["pact_verify"], kind="lab")
        for n in joiners:
            self.labs[n].in_pact = True
        self.log("pact_form", members=sorted(joiners), proposer=worried.name,
                 covers_top2=sorted(top2))
