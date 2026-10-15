"""h16: covert sabotage of rival compute and a retaliation spiral.

Claim under test: when a government believes the rival bloc is close to
takeoff, covert sabotage of rival data centres becomes attractive. A detected
sabotage triggers retaliation against the originating bloc. The escalation
spiral destroys compute but delays takeoff.

Mechanism (all inside government_decide, after the baseline policy update):
- Initiation: government b strikes if its believed rival leader has capability
  mu >= sab_proximity * C_STAR, the rival is believed ahead of b's own bloc,
  and a draw from the sabotage stream passes sab_p. The target is the rival
  lab b believes leads. Effect: target.K *= (1 - sab_frac).
- Detection: a world process. Each strike is attributed with probability
  sab_detect. A detected strike queues a retaliation by the victim bloc.
- Retaliation: the next quarter the victim bloc's government strikes the
  believed leader of the attacker bloc with probability sab_retal_p. A
  retaliation is itself a strike, so it can be detected and queue another.
  Chains stop at sab_depth, and at most sab_max_per_q strikes run per quarter.

Belief-only decisions: the strike choice reads self.beliefs[f"gov{b}"] and
public policy state only. Detection is world truth, drawn in strike(), and no
actor reads it. The extra randomness uses rng_sab = random.Random(f"{seed}:sabotage"),
created in __init__, so the paired baseline's draws are not shifted.
"""
import random

import core


def make_config(base):
    c = base["cfg"]
    c["sab_proximity"] = 0.7     # believed rival mu / C_STAR needed to consider a strike
    c["sab_p"] = 0.5             # chance a qualifying government strikes this quarter
    c["sab_frac"] = 0.3          # fraction of target K destroyed per strike
    c["sab_detect"] = 0.5        # chance a strike is attributed to its author
    c["sab_retal_p"] = 0.8       # chance a victim government retaliates after attribution
    c["sab_depth"] = 3           # maximum retaliation chain length
    c["sab_max_per_q"] = 2       # strikes allowed per quarter, all governments together
    return base


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        self.rng_sab = random.Random(f"{seed}:sabotage")
        self.retal_queue = []    # (victim_bloc, attacker_bloc, depth) from detected strikes

    def believed_leader(self, gov, bloc):
        """Live lab in `bloc` that government `gov` believes has the highest capability."""
        B = self.beliefs[f"gov{gov}"]
        cands = [l for l in self.live_labs() if l.bloc == bloc]
        if not cands:
            return None
        return max(cands, key=lambda l: B.cap[l.name].mu)

    def strike(self, by, target, depth):
        lost = target.K * self.cfg["sab_frac"]
        target.K -= lost
        detected = self.rng_sab.random() < self.cfg["sab_detect"]
        kind = "sabotage" if depth == 0 else "retaliation"
        self.log(kind, by=by, target=target.name, lost=round(lost, 2),
                 detected=detected, depth=depth)
        if detected:
            self.retal_queue.append((target.bloc, by, depth + 1))

    def government_decide(self):
        super().government_decide()
        c = self.cfg
        budget = c["sab_max_per_q"]
        pending, self.retal_queue = self.retal_queue, []
        for victim, attacker_bloc, depth in pending:
            if depth > c["sab_depth"] or budget <= 0:
                continue
            if self.rng_sab.random() >= c["sab_retal_p"]:
                continue
            target = self.believed_leader(victim, attacker_bloc)
            if target is None:
                continue
            budget -= 1
            self.strike(victim, target, depth)
        for b in self.govs_conf:
            if budget <= 0:
                break
            rival_bloc = "B" if b == "A" else "A"
            B = self.beliefs[f"gov{b}"]
            own = max((B.cap[l.name].mu for l in self.live_labs() if l.bloc == b), default=0.0)
            rival = self.believed_leader(b, rival_bloc)
            if rival is None:
                continue
            rmu = B.cap[rival.name].mu
            if rmu < c["sab_proximity"] * c["C_STAR"] or rmu <= own:
                continue
            if self.rng_sab.random() >= c["sab_p"]:
                continue
            budget -= 1
            self.strike(b, rival, 0)
