"""h19: imitation mixed into expected-utility choice (herding test).

Each quarter, each live lab draws from its own stream (rng_imit). With
probability P_IMITATE it copies the template it infers its highest-momentum
rival is running. Otherwise it chooses exactly as core.World.labs_decide does.

Inference uses only public signals and the lab's own beliefs:
  - rival set: labs with a bench signal this quarter (public)
  - momentum: the lab's own belief GaussEst.growth for that rival
  - rival template: the latest train signal seen for that rival (fresh within
    TRAIN_SIGNAL_MAX_AGE quarters), matched to the TEMPLATES entry with the
    nearest train fraction train/(train+safety+serve).
  Ties in that match (build vs balanced at 0.45; safety vs conserve at 0.30)
  keep the lab's current template if it is tied, else the first tied entry.
Imitation falls back to expected utility when there is no fresh signal, or
when the copied template would break an active pact's compute cap.
"""
import random

import core

P_IMITATE = 0.3
TRAIN_SIGNAL_MAX_AGE = 8


def _train_frac(tpl):
    build, train, safety, serve = tpl
    return train / max(1e-9, train + safety + serve)


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        self.rng_imit = random.Random(f"{seed}:imitate")
        self.p_imitate = self.cfg.get("imitate_p", P_IMITATE)

    def _imitation(self, lab):
        """Return (rival, template) the lab would copy, or (rival, None)."""
        B = self.beliefs[lab.name]
        now = getattr(self, "_new_signals", [])
        live_now = {s.subject for s in now if s.kind == "bench"}
        rivals = [n for n in live_now if n != lab.name and n in B.cap]
        if not rivals:
            return None, None
        top = max(rivals, key=lambda n: (B.cap[n].growth, n))
        target = None
        for s in reversed(self.signals[-300:]):
            if s.kind == "train" and s.subject == top:
                if self.t - s.t <= TRAIN_SIGNAL_MAX_AGE:
                    target = s.value
                break
        if target is None:
            return top, None
        fracs = {k: _train_frac(v) for k, v in self.templates.items()}
        dmin = min(abs(f - target) for f in fracs.values())
        cands = [k for k, f in fracs.items() if abs(f - target) <= dmin + 1e-9]
        pick = lab.template if lab.template in cands else cands[0]
        if lab.in_pact and self.templates[pick][1] > self.cfg["pact_cap"] + 1e-9:
            return top, None
        return top, pick

    def _eu_pick(self, lab):
        """Expected-utility choice, identical to core.World.labs_decide."""
        scores = {name: self.score_template(lab, name, tpl) for name, tpl in self.templates.items()}
        allowed = dict(scores)
        if lab.in_pact:
            compliant = {k: v for k, v in scores.items()
                         if self.templates[k][1] <= self.cfg["pact_cap"] + 1e-9}
            if compliant:
                best_c = max(compliant.values())
                best_all = max(scores.values())
                p_caught = self.pact["verify"]
                penalty = 1.5 + self.roles[lab.role]["w"]["safety"]
                if best_all - best_c <= p_caught * penalty:
                    allowed = compliant
        return self.softmax_pick(allowed, lab.template)

    def labs_decide(self):
        for l in self.live_labs():
            rival, choice = None, None
            if self.rng_imit.random() < self.p_imitate:
                rival, choice = self._imitation(l)
            if choice is None:
                choice = self._eu_pick(l)
            else:
                self.log("imitate", lab=l.name, rival=rival, frm=l.template, to=choice)
            if l.in_pact and self.templates[choice][1] > self.cfg["pact_cap"] + 1e-9:
                self.log("defect", lab=l.name, template=choice)
            if choice != l.template:
                self.log("switch", lab=l.name, frm=l.template, to=choice)
            l.template = choice
            self.maybe_open_weights(l)
