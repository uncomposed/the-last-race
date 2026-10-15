"""h11 verification sweep (bargaining area).

Question: is pact durability steep in pact_verify (a threshold), or linear?

Verification does two jobs in core.py, and they pull in opposite directions:
  1. labs_decide: a pact member stays compliant unless the utility gain from
     defecting exceeds pact_verify * penalty. Higher verify deters defection.
  2. observe: a member's training scale is seen with probability
     max(train_detect, pact_verify). A caught violation breaks the pact in
     diplomacy(). Higher verify therefore can raise breaks even while it
     lowers defection.
train_detect is a floor on member detection and is the only detection channel
for non-members. When train_detect >= pact_verify, verify has no effect on
what labs observe, and only its deterrence job remains.

Settings are read inside make_config from environment variables, so one file
covers the whole grid:
    H11_VERIFY (default 0.8), H11_DETECT (default 0.15)
Baseline is pact_verify 0.30, train_detect 0.15 (BASE_CONFIG). Running with
H11_VERIFY=0.30 H11_DETECT=0.15 should reproduce the baseline exactly. That is
the sanity check that the logging hook does not change outcomes.

VariantWorld.observe only logs. It draws no random numbers and changes no state:
    "violation" = a member's training fraction is above pact_cap (truth)
    "verify_hit" = a member's violating training signal was observed
"""
import os

import core

DEFAULT_VERIFY = 0.8
DEFAULT_DETECT = 0.15


def make_config(base):
    base["cfg"]["pact_verify"] = float(os.environ.get("H11_VERIFY", DEFAULT_VERIFY))
    base["cfg"]["train_detect"] = float(os.environ.get("H11_DETECT", DEFAULT_DETECT))
    return base


class VariantWorld(core.World):
    def observe(self):
        super().observe()
        if not self.pact:
            return
        cap = self.cfg["pact_cap"] + 1e-9
        members = self.pact["members"]
        for l in self.live_labs():
            if l.name in members and l.train_frac > cap:
                self.log("violation", lab=l.name)
        for s in getattr(self, "_new_signals", []):
            if s.kind == "train" and s.subject in members and s.value > cap:
                self.log("verify_hit", lab=s.subject)
