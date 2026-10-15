"""Example only: stronger pact verification. Not one of the hypotheses."""


def make_config(base):
    base["cfg"]["pact_verify"] = 0.8
    return base
