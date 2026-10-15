"""h17: labs learn the AI-R&D automation strength from their own growth.

Claim under test: the baseline fixes each lab's belief about automation at 0.3
while the hidden value sits anywhere in (0,1). If labs instead learn automation
from their own realized training gains, labs in strong-automation seeds detect
the feedback loop once they are above C_AUTO and race harder. Predicted effect:
more unipolar outcomes and earlier takeoff in those seeds.

Mechanism:
- Each lab holds a GridBelief over automation in (0,1), prior mean 0.3.
- resolve_rnd: a lab above C_AUTO that is at or ahead of every rival estimate in
  its own beliefs compares its realized training gain with the gain it would get
  with no automation boost. The ratio gives an implied automation value a_obs.
  A Gaussian likelihood (sd AUTO_SD), tempered by the lab's receptivity, updates
  the belief. Gain sits in the baseline's own formula, so the scaling exponent
  and base constant are treated as known to the lab (disclosed simplification).
- Decisions: score_template calls train_gain(believed=True). This variant
  replaces the fixed 0.3 with the lab's belief mean, so a higher belief raises
  expected training value and shifts template choice toward training.
- Event: "auto_detect" is logged once per lab when its belief mean first exceeds
  DETECT_AT.

Decisions read only beliefs and the lab's own state. The update uses no new
random stream, so the paired baseline is not shifted.
"""
import core

AUTO_SD = 0.2
DETECT_AT = 0.5


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        n = self.cfg["grid"]
        self.auto_belief = {name: core.GridBelief(0.0, 1.0, n, 0.3) for name in self.labs}
        self.detected = set()

    def train_gain(self, lab, train_K, believed=False):
        if not believed or train_K <= 0:
            return super().train_gain(lab, train_K, believed)
        # Baseline believed gain uses auto=0.3. Swap in the lab's belief mean.
        x = max(0.0, lab.C / self.cfg["C_AUTO"] - 1)
        g = super().train_gain(lab, train_K, believed=True)
        mu = self.auto_belief[lab.name].mean()
        return g / (1 + 0.3 * x) * (1 + mu * x)

    def resolve_rnd(self):
        pre = {n: l.C for n, l in self.labs.items() if l.alive}
        tks = {}
        for l in self.live_labs():
            build, train, safety, serve = self.templates[l.template]
            tot = train + safety + serve
            reg = self.gov_policy[l.bloc]["regulate"]
            tks[l.name] = l.K * train / tot * (1 - 0.5 * reg)
            # Gain without automation boost, read at the pre-training C.
            x = max(0.0, l.C / self.cfg["C_AUTO"] - 1)
            tks[l.name] = (tks[l.name], self.train_gain(l, tks[l.name], believed=True) / (1 + 0.3 * x))
        super().resolve_rnd()
        C_AUTO = self.cfg["C_AUTO"]
        for l in self.live_labs():
            x = max(0.0, pre[l.name] / C_AUTO - 1)
            B = self.beliefs[l.name]
            tK, g_base = tks[l.name]
            if x <= 0 or tK <= 0:
                continue
            if not all(pre[l.name] >= e.mu for e in B.cap.values()):
                continue  # not on the frontier by own beliefs: leak pull would bias the read
            obs = l.C - pre[l.name]
            if obs <= 0 or g_base <= 0:
                continue
            a_obs = ((obs / g_base) - 1) / x
            belief = self.auto_belief[l.name]

            def ll(a, o=a_obs):
                return -((a - o) ** 2) / (2 * AUTO_SD ** 2)

            belief.update(ll, B.receptivity)
            m = belief.mean()
            if m > DETECT_AT and l.name not in self.detected:
                self.detected.add(l.name)
                self.log("auto_detect", lab=l.name, belief=round(m, 3))
