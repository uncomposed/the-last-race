"""Per-seed paired deltas for H08 (mandatory disclosure) metrics that the
summary JSON does not carry as paired statistics. Reruns baseline and variant
on the same 300 seeds used by run.py. Writes results/h08_analysis.json.

    python3 results/h08_analysis.py
"""
import json
import os
import statistics as st
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

import run  # noqa: E402

VARIANT = os.path.join(ROOT, "variants", "h08_mandatory_disclosure.py")
SEEDS = list(range(300))
FIELDS = ["regulate_events", "subsidy_events", "incidents", "incidents_public",
          "pacts_formed", "disruptions"]


def paired(base, var, key):
    d = [v[key] - b[key] for b, v in zip(base, var) if b[key] is not None and v[key] is not None]
    return dict(mean=round(st.mean(d), 4), se=round(st.stdev(d) / len(d) ** 0.5, 4), n=len(d))


def is_kind(row, prefix):
    return 1 if (row["outcome"] or "").startswith(prefix) else 0


def paired_binary(base, var, fn):
    d = [fn(v) - fn(b) for b, v in zip(base, var)]
    return dict(mean=round(st.mean(d), 4), se=round(st.stdev(d) / len(d) ** 0.5, 4), n=len(d))


def main():
    mod = run.load_variant(VARIANT)
    base = run.run_many(None, SEEDS)
    var = run.run_many(mod, SEEDS)
    out = {"fields": {k: paired(base, var, k) for k in FIELDS}}
    out["catastrophe_incident"] = paired_binary(base, var, lambda r: is_kind(r, "catastrophe_incident"))
    out["catastrophe_takeoff"] = paired_binary(base, var, lambda r: is_kind(r, "catastrophe_takeoff"))
    out["catastrophe_any"] = paired_binary(base, var, lambda r: is_kind(r, "catastrophe"))
    out["real_at_2se"] = {k: abs(v["mean"]) > 2 * v["se"] for k, v in out["fields"].items()}
    for k in ("catastrophe_incident", "catastrophe_takeoff", "catastrophe_any"):
        v = out[k]
        out["real_at_2se"][k] = abs(v["mean"]) > 2 * v["se"]
    text = json.dumps(out, indent=1)
    with open(os.path.join(HERE, "h08_analysis.json"), "w") as f:
        f.write(text)
    print(text)


if __name__ == "__main__":
    main()
