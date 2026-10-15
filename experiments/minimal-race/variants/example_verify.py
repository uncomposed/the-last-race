"""Example only: stronger pact verification. Not one of the 20 hypotheses."""
import core


def make_config(base):
    base["cfg"]["pact_verify"] = 0.8
    return base
