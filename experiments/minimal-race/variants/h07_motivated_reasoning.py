"""h07 motivated reasoning: labs discount incident evidence about their own lab.

Own-lab incidents (signal subject == the lab itself) enter that lab's hazard
update with weight f = 1 - lead_weight * DISCOUNT, where lead_weight is the
role's w["lead"]. Other labs' incidents and quiet quarters (no incidents)
enter fully, because the Poisson exposure term is untouched.

Governments are unchanged: their n_eff equals the baseline incident count.
Everything else in internalize is a verbatim copy of core.World.internalize,
so the variant only differs where a lab receives its own incidents.
"""
import math

import core

DISCOUNT = 0.6


class VariantWorld(core.World):
    def internalize(self):
        if self.t == 0:
            return
        c = self.cfg
        new = self._new_signals
        nv = c["bench_noise"] ** 2
        for who, B in self.beliefs.items():
            for est in B.cap.values():
                est.predict()
            n_own = 0.0
            n_other = 0.0
            for s in new:
                if not s.public and who not in s.observers:
                    continue
                if s.kind == "bench" and s.subject in B.cap:
                    # Out-of-bloc sources are trusted less.
                    trust = 1.0
                    if who in self.labs and self.labs[s.subject].bloc != self.labs[who].bloc:
                        trust = 1.6
                    if who.startswith("gov") and self.labs[s.subject].bloc != who[-1]:
                        trust = 1.6
                    B.cap[s.subject].observe(s.value, nv * trust, B.attention)
                elif s.kind == "train" and s.subject in B.cap:
                    B.cap[s.subject].growth += 0.6 * s.value
                    if self.pact and s.subject in self.pact["members"] and s.value > c["pact_cap"] + 1e-9:
                        B.defect_a += 1.0
                elif s.kind == "incident":
                    if who in self.labs and s.subject == who:
                        n_own += 1
                    else:
                        n_other += 1
            B.incidents_seen += int(n_own + n_other)
            # Motivated discount: own-lab incidents count for less in a lab's
            # Poisson update. Governments and quiet quarters are unaffected.
            f = 1.0
            if who in self.labs and n_own > 0:
                f = 1.0 - self.roles[self.labs[who].role]["w"]["lead"] * DISCOUNT
                self.log("motivated_discount", lab=who, n_own=int(n_own), f=round(f, 2))
            n_eff = n_other + f * n_own
            exposure = self.believed_exposure(who)
            det = 1.0 if who in self.labs else 0.6

            def ll(h, n=n_eff, e=exposure, d=det):
                lam = max(1e-6, h * e * d)
                return n * math.log(lam) - lam
            B.hazard.update(ll, B.receptivity)
            # Demand update from aggregate observed revenue vs believed market.
            obs_rev = sum(s.value for s in new if s.kind == "revenue")
            pot = c["market0"] * self.adoption() * (self.frontier_deployed() / 10.0) ** 1.3
            if pot > 0.05:
                def lld(d, r=obs_rev, p=pot):
                    pred = d * p
                    return -((r - pred) ** 2) / (2 * (0.3 * pred + 0.2) ** 2)
                B.demand.update(lld, B.receptivity * 0.5)
