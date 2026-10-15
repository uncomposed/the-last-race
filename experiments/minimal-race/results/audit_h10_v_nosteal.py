"""h10: covert espionage and weight theft by the behind bloc.

Each quarter, a government that believes its bloc is behind (by its own belief
layer) may attempt theft against the lab it believes is the rival leader.
Attempt odds fall as the target's security S rises relative to its capability C.
Success lifts the thief bloc's best lab to max(C, 0.9 * target C) (truth layer).
Detection is a separate roll; a detected theft forces export controls and gives
victim-bloc labs a temporary boost to the safety template score.
"""
import random

import core

BOOST_QUARTERS = 4
BOOST_BONUS = 0.5


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        self.rng_esp = random.Random(f"{seed}:espionage")
        self.boost_until = {}          # victim bloc -> last quarter of safety boost

    def resolve_rnd(self):
        super().resolve_rnd()
        self.espionage()

    def espionage(self):
        for b in self.govs_conf:
            victim = "B" if b == "A" else "A"
            B = self.beliefs[f"gov{b}"]
            own = [l for l in self.live_labs() if l.bloc == b]
            rivals = [l for l in self.live_labs() if l.bloc == victim]
            if not own or not rivals or self.t < 4:
                continue
            own_mu = max(B.cap[l.name].mu for l in own)
            riv_mu = max(B.cap[l.name].mu for l in rivals)
            if own_mu >= riv_mu:
                continue                              # not behind by belief
            tgt = max(rivals, key=lambda l: B.cap[l.name].mu)   # believed leader
            ratio = min(1.0, tgt.S / max(tgt.C, 1e-6))
            p_att = 0.3 * max(0.1, 1.0 - ratio)                 # security deters
            if self.rng_esp.random() >= p_att:
                continue
            self.log("theft_attempt", thief=b, target=tgt.name)
            if self.rng_esp.random() < 0.5:                     # success roll
                thief = max(own, key=lambda l: l.C)
                new_C = max(thief.C, 0.9 * tgt.C)
                self.log("theft_success", thief=thief.name, target=tgt.name,
                         C_before=round(thief.C, 3), C_after=round(new_C, 3))
                pass
            p_det = 0.5 * self.unk["detect"]
            if self.rng_esp.random() < p_det:
                self.log("theft_detected", victim=victim, target=tgt.name)
                self.boost_until[victim] = self.t + BOOST_QUARTERS
                if not self.export_controls:
                    self.export_controls = True
                    self.log("export_controls", gov=victim, reason="theft")

    def score_template(self, lab, name, tpl):
        u = super().score_template(lab, name, tpl)
        if name == "safety" and self.t <= self.boost_until.get(lab.bloc, -1):
            u += BOOST_BONUS
        return u
