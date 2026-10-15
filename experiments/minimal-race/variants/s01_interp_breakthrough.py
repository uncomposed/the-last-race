"""Scenario s01: a mechanistic-interpretability breakthrough.

At a seed-determined quarter (uniform 8..24) interpretability suddenly works.
Three readings of what that means, chosen with INTERP_MODE:

  safety   (default) alignment research gets twice as productive for everyone;
           every actor receives strong evidence about the true hazard level
           ("we can see what models are doing"), filtered by its receptivity;
           pact verification becomes much better (models can be audited).
  dual     as safety, plus the same insight speeds capability training 25%.
  onelab   the breakthrough happens at the safety lab only: it alone gets the
           productivity gain and the hazard evidence; others benefit only
           through what it publishes (spillover) and the public signal of an
           incident-free audit is absent.

The world mechanics read the true hazard to generate the evidence; actors
only ever see the tempered evidence, never the value itself.
"""
import math
import os

import core

MODE = os.environ.get("INTERP_MODE", "safety")
# For decomposition: which parts of the shared breakthrough apply.
PARTS = set(os.environ.get("INTERP_PARTS", "prod,legible,verify").split(","))


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        self.t_break = 8 + int(self.u("interp_quarter") * 17)
        self.broke = False

    def internalize(self):
        super().internalize()
        if self.t != self.t_break:
            return
        self.broke = True
        self.log("interp_breakthrough", mode=MODE)
        lo, hi = self.cfg["unknowns"]["hazard"]
        sd = 0.08 * (hi - lo)
        truth = self.unk["hazard"]
        # The audit reading is noisy but centred on the truth.
        reading = truth + self.gauss(sd, "interp_reading")
        who = list(self.beliefs) if MODE != "onelab" else ["safety"]
        if MODE != "onelab" and "legible" not in PARTS:
            who = []
        for name in who:
            B = self.beliefs[name]
            B.hazard.update(lambda h, r=reading: -((h - r) ** 2) / (2 * sd ** 2), B.receptivity)
        if MODE != "onelab" and "verify" in PARTS:
            self.cfg = dict(self.cfg, pact_verify=max(self.cfg["pact_verify"], 0.7))
            if self.pact:
                self.pact["verify"] = max(self.pact["verify"], 0.7)

    def resolve_rnd(self):
        if not self.broke:
            return super().resolve_rnd()
        # Boost safety productivity (and capability, in dual mode) for this quarter.
        base_cfg = self.cfg
        boosted = dict(base_cfg)
        if MODE in ("safety", "dual") and "prod" in PARTS:
            boosted["safety_k"] = base_cfg["safety_k"] * 2.0
        if MODE == "dual":
            boosted["train_k"] = base_cfg["train_k"] * 1.25
        self.cfg = boosted
        before = {l.name: l.S for l in self.live_labs()}
        super().resolve_rnd()
        self.cfg = base_cfg
        if MODE == "onelab" and self.labs["safety"].alive:
            l = self.labs["safety"]
            own_gain = l.safety_gain
            l.S += own_gain          # doubled at the breakthrough lab only
            l.safety_gain = 2 * own_gain
