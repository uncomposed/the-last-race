"""h14: government consolidation of domestic labs (variant h14a: bloc B only).

Hypothesis: a government that believes its bloc is behind, or that hazard is
high, consolidates its domestic labs into one national project. Expected:
bloc-level unipolar outcomes, fewer and larger actors.

The trigger reads only the government's beliefs (B.cap[...].mu and
B.hazard), which is what the base government_decide already uses. The
absorbing lab is chosen by believed capability. No truth (self.unk, rival
true C/S) is read.
"""
from __future__ import annotations

import core

MERGE_BLOCS = ("B",)     # h14a: bloc B only. h14b would be ("A", "B").
GAP_BEHIND = -1.0        # believed own-minus-best-rival gap below this = behind
HAZ_HIGH = 0.5           # believed hazard as a fraction of the unknown range
N_QUARTERS = 4           # consecutive quarters the trigger must hold


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        # Plain counters. No rng draws, so paired baseline streams are unchanged.
        self.trigger_run = {b: 0 for b in MERGE_BLOCS}
        self.merged = {b: False for b in MERGE_BLOCS}

    def government_decide(self):
        super().government_decide()
        hz_hi = self.cfg["unknowns"]["hazard"][1]
        for b in MERGE_BLOCS:
            if self.merged[b]:
                continue
            own_labs = [l for l in self.live_labs() if l.bloc == b]
            if len(own_labs) < 2:
                continue
            B = self.beliefs[f"gov{b}"]
            own = max(B.cap[l.name].mu for l in own_labs)
            other = max((B.cap[l.name].mu for l in self.live_labs() if l.bloc != b), default=0.0)
            gap = own - other
            hz = B.hazard.mean() / hz_hi
            trig = gap < GAP_BEHIND or hz > HAZ_HIGH
            self.trigger_run[b] = self.trigger_run[b] + 1 if trig else 0
            if self.trigger_run[b] >= N_QUARTERS:
                self.consolidate(b, gap, hz)
                self.merged[b] = True

    def consolidate(self, b, gap, hz):
        B = self.beliefs[f"gov{b}"]
        members = [l for l in self.live_labs() if l.bloc == b]
        target = max(members, key=lambda l: B.cap[l.name].mu)
        for l in members:
            if l is target:
                continue
            # Absorbed labs hand over compute, cash, pipeline and the best
            # model they hold. Open-weight releases already public stay public.
            target.K += l.K
            target.cash += l.cash
            target.pipeline.extend(l.pipeline)
            target.C = max(target.C, l.C)
            target.S = max(target.S, l.S)
            target.deployed_C = max(target.deployed_C, l.deployed_C)
            target.open_weights = target.open_weights or l.open_weights
            l.K, l.cash, l.pipeline = 0.0, 0.0, []
            l.alive = False
            l.in_pact = False
            self.log("merged", lab=l.name, into=target.name, bloc=b)
        self.log("consolidate", bloc=b, into=target.name, gap=round(gap, 3), hazard=round(hz, 3))
