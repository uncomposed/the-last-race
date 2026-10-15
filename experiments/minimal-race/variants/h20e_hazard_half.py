"""h20e: robustness sweep. Hazard unknown range halved: (0.02, 0.50) -> (0.02, 0.26).

Caveat: this also changes the normalisation in metrics.hazard_belief_spread,
which divides by the hazard range top. Per-seed hazard draws use the same
uniform quantile as baseline, rescaled to the narrower range, so paired
deltas compare identical quantiles.
"""
import core  # noqa: F401


def make_config(base):
    lo, hi = base["cfg"]["unknowns"]["hazard"]
    base["cfg"]["unknowns"]["hazard"] = (lo, round(lo + (hi - lo) / 2, 4))
    return base
