"""h06a: stubborn observe-to-belief filter.

Every lab and government gets low receptivity (0.15, so likelihoods are heavily
tempered and priors dominate) and high attention (2.0 sd, so most surprises are
habituated away). Config-only: no hooks overridden, no new randomness, no new
events. Compare with the baseline on the same seeds via run.py.

Prediction (H06): belief divergence (I4) rises, pacts form less often, and
catastrophe rate is higher in high-hazard seeds.
"""
import core

RECEPTIVITY = 0.15
ATTENTION = 2.0


def make_config(base):
    for r in base["roles"].values():
        r["receptivity"] = RECEPTIVITY
        r["attention"] = ATTENTION
    for g in base["govs"].values():
        g["receptivity"] = RECEPTIVITY
        g["attention"] = ATTENTION
    return base
