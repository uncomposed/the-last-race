"""H01 (markets): investors fund trailing observed revenue and cash runway,
not benchmark level and momentum.

Only capital_market is overridden. Pool size, the open-weights bonus, bloc B
market access, and government subsidy are unchanged from core, so the only
difference from baseline is how the pool is split across labs.

Inputs used by the investor share (no rival ground truth, no hidden unknowns):
  - each lab's own product revenue, as reported in past quarters (rev_hist)
  - each lab's own cash and burn (capex plus upkeep), which are public filings
"""
import math

import core

REV_WINDOW = 4      # quarters of reported revenue investors average over
EPS = 1e-3          # keeps shares defined before any revenue exists
RUNWAY_CAP = 3.0    # cash / burn is clipped to [0.2, 3.0]
RUNWAY_LO = 0.2
LOG_EVERY = 8       # log allocation every 8 quarters to keep traces readable


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        self.rev_hist = {}   # lab name -> list of quarterly revenue, oldest first

    def capital_market(self):
        c = self.cfg
        labs = self.live_labs()
        if not labs:
            return
        pool = c["investor_base"] * self.sentiment * (1 + 0.05 * self.t)
        vals = {}
        for l in labs:
            # l.revenue still holds last quarter's value here, because
            # product_market runs after this hook.
            h = self.rev_hist.setdefault(l.name, [])
            h.append(l.revenue)
            window = h[-REV_WINDOW:]
            trail = sum(window) / len(window)
            burn = l.capex + c["upkeep"] * l.K + 1e-6
            runway = min(RUNWAY_CAP, max(RUNWAY_LO, l.cash / burn))
            v = (trail + EPS) * math.sqrt(runway)
            if l.open_weights:
                v *= 1.15
            if l.bloc == "B":
                v *= c["bloc_b_market_access"]
            vals[l.name] = v
        z = sum(vals.values())
        if self.t % LOG_EVERY == 0:
            self.log("capital_rev_alloc",
                     shares={k: round(v / z, 3) for k, v in vals.items()})
        for l in labs:
            r = pool * vals[l.name] / z
            l.cash += r
            l.raised = r
            l.cash += l.ext
            sub = self.gov_policy[l.bloc]["subsidy"]
            if sub > 0:
                l.cash += sub * (1.2 if l.role == "state" else 0.5)
