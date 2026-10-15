"""h18: safety research as a public good (interpretability transfer).

After the normal R&D step, each live lab's safety gain this quarter (the
increase in its S) spills over to every other live lab. Recipient j receives
RATE * mean(gains of the other labs), so each emitter contributes RATE * its
gain in total. No new randomness, and C is never touched, so takeoff timing is
only affected through lab decisions (perceived gap via S in score_template).
"""
import core

RATE = 0.3          # h18a spillover rate


def make_config(base):
    return base


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        self.spill_emit = {n: 0.0 for n in self.labs}   # total safety gain each lab exported
        self.spill_recv = {n: 0.0 for n in self.labs}   # total safety gain each lab imported

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
