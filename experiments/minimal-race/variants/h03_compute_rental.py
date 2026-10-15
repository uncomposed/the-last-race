"""h03: quarterly spot rental market for idle compute.

Labs whose current template has a low train share (<= RENT_LOW) offer RENT_OFFER
of their installed K. Labs with a high train share (>= RENT_HIGH) and cash bid,
capped by RENT_BUDGET of cash and RENT_MAX_FRAC of their own K. One uniform price
per quarter clears the market (bisection on bid demand). Rented units move K
only during resolve_rnd, product_market and incidents, then are restored before
public_opinion. Cash moves borrower -> lender. Deterministic: no new random stream.
Decisions read only own template, own K and cash, and the public chip_price.
"""
import core

RENT_OFFER = 0.25      # share of K a low-train lab offers
RENT_LOW = 0.30        # train share at or below which a lab is a lender
RENT_HIGH = 0.45       # train share at or above which a lab is a bidder
RENT_MIN_CASH = 1.0    # bidders need more than this much cash
RENT_BUDGET = 0.5      # share of cash a bidder may spend on rent
RENT_MAX_FRAC = 0.5    # max rented units as share of own K
RENT_RATE = 0.25       # base rent per unit per quarter, as a multiple of chip_price
EPS = 1e-9


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        self._rent_moves = []

    def train_share(self, lab):
        _, tr, ts, sv = self.templates[lab.template]
        return tr / (tr + ts + sv)

    def compute_market(self):
        super().compute_market()
        self._rent_moves = self.rent_market()

    def rent_market(self):
        lenders, bidders = [], []
        for l in self.live_labs():
            if l.K <= 0:
                continue
            share = self.train_share(l)
            if share <= RENT_LOW + EPS:
                lenders.append((l, RENT_OFFER * l.K))
            elif share >= RENT_HIGH - EPS and l.cash > RENT_MIN_CASH:
                bidders.append((l, RENT_BUDGET * l.cash, RENT_MAX_FRAC * l.K))
        supply = sum(o for _, o in lenders)
        if supply <= EPS or not bidders:
            return []

        def demand(p):
            return [min(cap, bud / p) for _, bud, cap in bidders]

        p = RENT_RATE * self.chip_price
        if sum(demand(p)) > supply:          # raise price until bids fit supply
            lo, hi = p, p * 1000.0
            for _ in range(40):
                mid = (lo + hi) / 2
                if sum(demand(mid)) > supply:
                    lo = mid
                else:
                    hi = mid
            p = hi
        dq = demand(p)
        D = sum(dq)
        traded = min(D, supply)
        if traded <= EPS:
            return []
        moves = []
        for (b, _, _), q in zip(bidders, dq):
            for lend, offer in lenders:
                u = (offer / supply) * (q / D) * traded
                if u > EPS:
                    moves.append((lend, b, u))
                    lend.cash += p * u
                    b.cash -= p * u
        self.log("rent_clear", traded=round(traded, 3), price=round(p, 4),
                 lenders=len(lenders), borrowers=len(bidders))
        return moves

    def resolve_rnd(self):
        for lend, b, u in self._rent_moves:
            lend.K -= u
            b.K += u
        super().resolve_rnd()

    def public_opinion(self):
        for lend, b, u in self._rent_moves:
            lend.K += u
            b.K -= u
        self._rent_moves = []
        super().public_opinion()
