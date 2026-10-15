"""h20b: robustness sweep. Decision softmax temperature 1.0 (base 0.35). Config only."""
import core  # noqa: F401


def make_config(base):
    base["cfg"]["softmax_temp"] = 1.0
    return base
