"""h06b: fully Bayesian observe-to-belief filter.

Every lab and government gets receptivity 1.0 (likelihoods applied at full
strength) and attention 0.0 (no habituation, every surprise moves beliefs).
Config-only: no hooks overridden, no new randomness, no new events.

Prediction (H06): beliefs converge (I4 falls), and pact and catastrophe rates
move opposite to the stubborn filter (h06a).
"""
import core

RECEPTIVITY = 1.0
ATTENTION = 0.0


def make_config(base):
    for r in base["roles"].values():
        r["receptivity"] = RECEPTIVITY
        r["attention"] = ATTENTION
    for g in base["govs"].values():
        g["receptivity"] = RECEPTIVITY
        g["attention"] = ATTENTION
    return base
