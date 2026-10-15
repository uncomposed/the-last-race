"""h20c: robustness sweep. Inertia bonus 0.5 (base 0.15). Config only."""
import core  # noqa: F401


def make_config(base):
    base["cfg"]["inertia"] = 0.5
    return base
