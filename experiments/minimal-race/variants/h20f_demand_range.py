"""h20f: robustness sweep. Demand unknown range (0.2, 1.0) (base (0.4, 2.0)).

Per-seed demand draws use the same uniform quantile as baseline, rescaled
to the narrower range, so paired deltas compare identical quantiles.
"""
import core  # noqa: F401


def make_config(base):
    base["cfg"]["unknowns"]["demand"] = (0.2, 1.0)
    return base
