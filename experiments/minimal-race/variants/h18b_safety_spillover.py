"""h18b: same as h18_safety_spillover.py with spillover rate 0.6 (sweep point).

After the normal R&D step, each live lab's safety gain this quarter spills over
to every other live lab at RATE. See h18_safety_spillover.py for details.
"""
import core

RATE = 0.6          # h18b spillover rate


def make_config(base):
    return base


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        self.spill_emit = {n: 0.0 for n in self.labs}
        self.spill_recv = {n: 0.0 for n in self.labs}

    def resolve_rnd(self):
        labs = self.live_labs()
        before = {l.name: l.S for l in labs}
        super().resolve_rnd()
        gains = {l.name: l.S - before[l.name] for l in labs}
        n = len(labs)
        if n < 2 or sum(gains.values()) <= 0:
            return
        for l in labs:
            others = [gains[o.name] for o in labs if o.name != l.name]
            inc = RATE * sum(others) / (n - 1)
            l.S += inc
            self.spill_recv[l.name] += inc
        for name, g in gains.items():
            self.spill_emit[name] += RATE * g
        self.log("spillover", total=round(sum(RATE * g for g in gains.values()), 4),
                 by=max(gains, key=gains.get))
