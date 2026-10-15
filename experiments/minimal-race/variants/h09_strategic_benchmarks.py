"""h09: strategic public benchmarks.

Claim under test: when labs can hype or sandbag public benchmarks, rivals
mis-estimate each other, which should increase racing and speed takeoff even
though no lab's real capability changed.

Mechanism: after the normal observation step, each published benchmark
("bench" signal) is shifted. A lab that believes it is at or above its rivals'
believed capability publishes a lower number (sandbagging). A lab that believes
it is behind publishes a higher number (hype). Magnitude is SHADE or HYPE times
a uniform draw in [0.5, 1.5] from a dedicated stream, rng_bias.

Only the published value changes. deployed_C, trust weights and the belief
filter in core.internalize() are untouched. Rivals and investors read the same
Signal objects, so both see the shifted value. Investor funding also moves
(capital_market reads recent bench signals). That is a confound, not a
belief-only effect.

Leader/laggard uses the publisher's own deployed_C and its own beliefs about
rivals. It never reads truth about rivals.
"""
import random

import core

SHADE = 3.0   # sandbagging: leaders publish this much lower (about 2 bench_noise sd)
HYPE = 3.0    # hype: laggards publish this much higher


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        self.rng_bias = random.Random(f"{seed}:bias")

    def observe(self):
        super().observe()
        if self.t == 0:
            return
        for s in getattr(self, "_new_signals", []):
            if s.kind != "bench" or s.subject not in self.labs:
                continue
            lab = self.labs[s.subject]
            B = self.beliefs[lab.name]
            rival_top = max((e.mu for e in B.cap.values()), default=0.0)
            mag = self.rng_bias.uniform(0.5, 1.5)
            if lab.deployed_C >= rival_top:
                role, delta = "leader", -SHADE * mag
            else:
                role, delta = "laggard", HYPE * mag
            s.value = s.value + delta
            self.log("bench_bias", lab=lab.name, role=role,
                     true=round(lab.deployed_C, 3), shown=round(s.value, 3),
                     delta=round(delta, 3))
