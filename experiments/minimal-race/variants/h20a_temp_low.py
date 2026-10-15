"""h20a: robustness sweep. Decision softmax temperature 0.1 (base 0.35). Config only."""
import core  # noqa: F401


def make_config(base):
    base["cfg"]["softmax_temp"] = 0.1
    return base
