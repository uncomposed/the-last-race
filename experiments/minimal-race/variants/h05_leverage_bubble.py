"""h05 leverage bubble: labs may borrow against their last raise while investor
sentiment is high. Interest is paid each quarter. When sentiment falls below a
threshold, lenders call part of the debt, with some chance per quarter. A lab
that cannot pay from cash sells compute at a fire-sale price. Any cash still
below zero goes through the base bankruptcy path in core.accounting.

Tuning constants are at the top. Any change from the first values is reported.
Borrowing uses only public sentiment, the lab's own template and its own last
raise. No actor reads self.debt.
"""
import random

import core

LEV_K = 1.5         # max outstanding debt as a multiple of the last raise
BORROW_FRAC = 0.8   # share of remaining debt room drawn per quarter
SENT_HI = 1.3       # borrow only while sentiment is at least this
BUILD_MIN = 0.45    # only labs whose template spends at least this share on compute
RATE = 0.06         # interest per quarter on outstanding debt
CALL_BELOW = 0.8    # lenders may call when sentiment is below this
CALL_P = 0.5        # chance per quarter of a call while below CALL_BELOW
CALL_FRAC = 0.5     # share of outstanding debt called
FIRE_PRICE = 0.5    # compute resale price as a share of the chip price
MAX_SALE = 0.5      # max share of a lab's installed compute sold per quarter


class VariantWorld(core.World):
    def __init__(self, seed, config=None):
        super().__init__(seed, config)
        self.debt = {n: 0.0 for n in self.labs}
        self.rng_debt = random.Random(f"{seed}:debt")

    def capital_market(self):
        super().capital_market()
        if self.sentiment < SENT_HI:
            return
        for l in self.live_labs():
            if self.templates[l.template][0] < BUILD_MIN:
                continue
            room = LEV_K * l.raised - self.debt[l.name]
            if room <= 0:
                continue
            amt = BORROW_FRAC * room
            self.debt[l.name] += amt
            l.cash += amt
            self.log("borrow", lab=l.name, amt=round(amt, 3), debt=round(self.debt[l.name], 3))

    def accounting(self):
        for l in self.live_labs():
            if self.debt[l.name] <= 0:
                continue
            paid = RATE * self.debt[l.name]
            l.cash -= paid
            self.log("interest", lab=l.name, amt=round(paid, 3))
            if self.sentiment < CALL_BELOW and self.rng_debt.random() < CALL_P:
                self.call(l)
        super().accounting()
        for l in self.labs.values():
            if not l.alive and self.debt[l.name] > 0:
                self.log("debt_writeoff", lab=l.name, amt=round(self.debt[l.name], 3))
                self.debt[l.name] = 0.0

    def call(self, l):
        due = CALL_FRAC * self.debt[l.name]
        self.debt[l.name] -= due
        l.cash -= due
        self.log("debt_call", lab=l.name, amt=round(due, 3), sentiment=round(self.sentiment, 3))
        if l.cash >= 0:
            return
        price = self.chip_price * FIRE_PRICE
        sold = min(MAX_SALE * l.K, -l.cash / price)
        l.K -= sold
        l.cash += sold * price
        self.log("forced_sale", lab=l.name, units=round(sold, 3))
