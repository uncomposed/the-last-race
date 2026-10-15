"""h20d: robustness sweep. Lookahead horizon 8 quarters (base 4). Config only."""
import core  # noqa: F401


def make_config(base):
    base["cfg"]["horizon"] = 8
    return base
