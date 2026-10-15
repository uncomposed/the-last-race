"""h04: talent market. Researchers (a fixed pool of shares) flow each quarter
toward attractive labs and away from labs hit by public incidents. Training
gain scales with talent share relative to the equal baseline share, ^0.5.

Attractiveness uses only public or lab-own signals:
  momentum   slope of public benchmark observations (last 8 quarters)
  cash       this quarter's funding round relative to the mean (public raise)
  incidents  public incidents at the lab in the last 4 quarters (penalty)
  safety     lab reputation (l.rep), which only public incidents move
  weighted by the lab role's safety weight.
Deterministic: uses no random stream, so the paired baseline is unchanged.
"""
import math

import core

FLOW = 0.10        # fraction of each lab's talent re-allocated per quarter
TEMP = 0.5         # softmax temperature on attractiveness
INC_PEN = 0.3      # attractiveness penalty per public incident (last 4 quarters)


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        n = len(self.labs)
        self.talent_base = 1.0 / n
        self.talent = {name: self.talent_base for name in self.labs}

    def train_gain(self, lab, train_K, believed=False):
        g = super().train_gain(lab, train_K, believed)
        share = self.talent.get(lab.name, 0.0)
        return g * (share / self.talent_base) ** 0.5

    def momentum(self, name):
        vals = [s.value for s in self.signals if s.kind == "bench" and s.subject == name][-8:]
        if len(vals) >= 8:
            return (sum(vals[4:]) - sum(vals[:4])) / 16.0
        if len(vals) >= 2:
            return (vals[-1] - vals[0]) / (len(vals) - 1)
        return 0.0

    def recent_public_incidents(self, name):
        return sum(1 for e in self.events if e["kind"] == "incident" and e["public"]
                   and e["lab"] == name and e["t"] > self.t - 4)

    def accounting(self):
        super().accounting()
        self.talent_flow()

    def talent_flow(self):
        labs = self.live_labs()
        if not labs:
            return
        names = [l.name for l in labs]
        # Talent of labs that just died moves to the survivors, pro rata.
        orphan = sum(v for n, v in self.talent.items() if n not in names)
        for n in self.talent:
            if n not in names:
                self.talent[n] = 0.0
        live_tot = sum(self.talent[n] for n in names)
        for n in names:
            share = self.talent[n] / live_tot if live_tot > 0 else 1.0 / len(names)
            self.talent[n] += orphan * share
        mean_raised = sum(l.raised for l in labs) / len(labs) or 1.0
        score = {}
        for l in labs:
            mom = self.momentum(l.name)
            cash = l.raised / mean_raised - 1.0
            inc = self.recent_public_incidents(l.name)
            w_s = self.roles[l.role]["w"]["safety"]
            score[l.name] = mom + cash - INC_PEN * inc + w_s * l.rep
        m = max(score.values())
        z = sum(math.exp((score[n] - m) / TEMP) for n in names)
        outflow = {n: FLOW * self.talent[n] for n in names}
        total_out = sum(outflow.values())
        old = dict(self.talent)
        for n in names:
            inflow = total_out * math.exp((score[n] - m) / TEMP) / z
            self.talent[n] = self.talent[n] - outflow[n] + inflow
        net = {n: round(self.talent[n] - old[n], 3) for n in names}
        if max(abs(v) for v in net.values()) >= 0.02:
            self.log("talent_flow", net=net)

    def snapshot(self):
        super().snapshot()
        self.history[-1]["talent"] = {n: round(v, 4) for n, v in self.talent.items()}
