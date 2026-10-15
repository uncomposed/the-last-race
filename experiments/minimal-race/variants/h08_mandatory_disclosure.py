"""H08: mandatory incident disclosure (detect = 1 for every lab).

Hypothesis: when every incident must become public, regulation and pact
formation rise, catastrophe falls, and public-backlash disruptions rise.
Transparency trades physical disruption for safety.

Mechanism (config only, no new events):
- The hidden per-seed `detect` chance (0.3-0.9) is pinned to 1.0 by setting
  its range to (1.0, 1.0). Every incident then gets public=True in
  core.incidents(), which the existing code already routes three ways:
  * observers: public signals reach every government and lab belief, so the
    hazard belief moves and government regulation and pact proposals respond;
  * public_opinion: each public incident adds to bloc-local and global
    backlash, which can trigger disruptions;
  * the lab's reputation (x0.9 instead of x0.98) and sentiment (x0.95).

RNG: uniform(1.0, 1.0) still consumes one draw from rng_unk, and incidents()
still draws one rng_evt number for the public test, so the paired baseline's
draws stay aligned.

Caveat: the `unknowns` dict in the JSON for this variant reports detect=1.0,
so unknown_importance() sees a constant there.
"""
import core


def make_config(base):
    base["cfg"]["unknowns"]["detect"] = (1.0, 1.0)
    return base
