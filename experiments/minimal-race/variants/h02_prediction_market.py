"""h02: a public prediction market on hazard.

Each quarter the live labs trade on the hazard rate. A lab's price is its own
hazard belief, which already contains any private incident knowledge it holds.
The market price is the cash-weighted mean of those beliefs. It is published as
a public "market" signal that every actor sees, governments included.

Each actor then internalizes the price as a noisy Gaussian pseudo-observation.
The pull is tempered by receptivity * MARKET_NUDGE, so an actor that already
ignores evidence also ignores the price. Decisions still read only beliefs,
lab state and public signals. Nothing here reads self.unk.

No new random stream is needed: the market is deterministic given beliefs.
"""
import core

MARKET_NUDGE = 0.3     # extra tempering on the price, multiplied by receptivity
PRICE_SD_FRAC = 0.2    # price pseudo-observation sd, as a fraction of hazard range
ALARM_FRAC = 0.4       # same "worried" threshold diplomacy() uses


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        self.price = None
        self.price_hist = []      # (t, price), for analysis scripts
        self._alarmed = False
        lo, hi = self.cfg["unknowns"]["hazard"]
        self._sig = PRICE_SD_FRAC * (hi - lo)

    def internalize(self):
        super().internalize()
        if self.t == 0:
            return
        self.market_price()
        self.nudge_beliefs()

    def market_price(self):
        labs = self.live_labs()
        if not labs:
            return
        # Cash-weighted: richer labs trade more. Clamp so broke labs still count a little.
        wts = {l.name: max(0.1, l.cash) for l in labs}
        z = sum(wts.values())
        p = sum(wts[l.name] * self.beliefs[l.name].hazard.mean() for l in labs) / z
        self.price = p
        self.price_hist.append((self.t, p))
        self.signals.append(core.Signal(self.t, "market", "hazard", p, public=True))
        hi = self.cfg["unknowns"]["hazard"][1]
        self.log("market_price", price=round(p, 4), frac=round(p / hi, 3))
        if not self._alarmed and p / hi >= ALARM_FRAC:
            self._alarmed = True
            self.log("price_alarm", price=round(p, 4))

    def nudge_beliefs(self):
        # Price is computed once from lab beliefs above; every actor is then
        # nudged toward that same value, so the update order does not matter.
        p = self.price
        sig2 = 2 * self._sig * self._sig
        for B in self.beliefs.values():
            B.hazard.update(lambda h, p=p, s=sig2: -((h - p) ** 2) / s,
                            B.receptivity * MARKET_NUDGE)
