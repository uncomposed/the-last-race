"""H12: bilateral intergovernmental treaty (caps on all domestic labs).

A treaty forms only when both governments sign in the same quarter. Each signs
when its believed hazard and public temperature are high and it believes the
two blocs are at rough parity. Formation also requires at least one public
incident in each bloc so far (observed public signals only). A signed treaty
runs through the pact machinery: every live lab is in the pact, so the pact
cap applies, with stronger verification (TREATY_VERIFY) than lab pacts.
A government exits when it believes its own bloc reaches C_STAR first within
EXIT_H quarters; that ends the treaty.

Decisions use only government beliefs, public signals and lab state. Nothing
here reads self.unk or rivals' true C/S. No new random streams are needed.
"""
import core

GOV_HZ_MIN = 0.25     # believed hazard (fraction of range) needed to sign
PUB_MIN = 0.5         # public temperature needed to sign
PARITY = 8.0          # |believed capability gap| that counts as rough parity
EXIT_H = 8            # quarters a government projects capability ahead
TREATY_VERIFY = 0.6   # per-lab verification chance per quarter (lab pacts use 0.3)


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        self.treaty = None           # dict(start=t) while in force
        self.treaty_signs = {}       # bloc -> bool, set each quarter
        self.treaty_exit_by = None   # bloc whose government exits this quarter

    def public_incidents(self, bloc):
        """Public incidents seen so far in a bloc, from public signals only."""
        return sum(1 for s in self.signals if s.kind == "incident" and s.public
                   and s.t < self.t and self.labs[s.subject].bloc == bloc)

    def gov_gap(self, b):
        B = self.beliefs[f"gov{b}"]
        own = max((B.cap[l.name].mu for l in self.live_labs() if l.bloc == b), default=0.0)
        other = max((B.cap[l.name].mu for l in self.live_labs() if l.bloc != b), default=0.0)
        return own, other

    def projected(self, b, H):
        B = self.beliefs[f"gov{b}"]
        def top(same):
            return max((B.cap[l.name].mu + B.cap[l.name].growth * H
                        for l in self.live_labs() if (l.bloc == b) == same), default=0.0)
        return top(True), top(False)

    def government_decide(self):
        super().government_decide()
        hz_hi = self.cfg["unknowns"]["hazard"][1]
        self.treaty_signs = {}
        self.treaty_exit_by = None
        for b in self.govs_conf:
            B = self.beliefs[f"gov{b}"]
            own, other = self.gov_gap(b)
            hz = B.hazard.mean() / hz_hi
            self.treaty_signs[b] = (hz >= GOV_HZ_MIN and self.public[b] >= PUB_MIN
                                    and abs(own - other) <= PARITY)
            if self.treaty and self.treaty_exit_by is None:
                mine, rival = self.projected(b, EXIT_H)
                if mine >= self.cfg["C_STAR"] and mine > rival:
                    self.treaty_exit_by = b

    def diplomacy(self):
        if self.treaty:
            self.treaty_step()
            return
        if (all(self.treaty_signs.values())
                and self.public_incidents("A") >= 1 and self.public_incidents("B") >= 1):
            self.form_treaty()
            return
        super().diplomacy()

    def form_treaty(self):
        if self.pact:
            self.end_pact()
        members = {l.name for l in self.live_labs()}
        self.pact = dict(members=members, start=self.t, verify=TREATY_VERIFY, kind="treaty")
        for n in members:
            self.labs[n].in_pact = True
        self.treaty = dict(start=self.t)
        self.log("treaty_form", members=sorted(members),
                 trigger={b: self.public_incidents(b) for b in self.govs_conf})

    def treaty_step(self):
        caught = sorted({s.subject for s in getattr(self, "_new_signals", [])
                         if s.kind == "train" and s.subject in self.pact["members"]
                         and s.value > self.cfg["pact_cap"] + 1e-9})
        if caught:
            self.log("treaty_violation", violators=caught)
        if self.treaty_exit_by:
            self.log("treaty_exit", gov=self.treaty_exit_by,
                     trigger={b: self.public_incidents(b) for b in self.govs_conf})
            self.end_pact()
            self.treaty = None
