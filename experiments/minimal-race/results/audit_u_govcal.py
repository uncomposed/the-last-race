"""Auditor probe: governance without the (1 + 2*self_discount) staff-fear boost,
with the tension threshold lowered to restore the original crisis rate (~77%).
Seeds 0-499. New file; edits nothing.

    python3 results/audit_u_govcal.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import audit_u_probes as P   # noqa: E402

seeds = list(range(500))
base = P.base_rows(seeds)
out = {}
for thr in (1.0, 0.7, 0.5, 0.35):
    def patch(c, thr=thr):
        u = dict(c["cfg"]["u"])
        u["tension_threshold"] = thr
        c["cfg"]["u"] = u
    r = P.run_rows(seeds, P.NoStaffMultiplier, P.conf_for(only={"governance"}, patch=patch))
    s = P.summary(base, r)
    rt = P.A.rates(r)
    s["runs_with_crisis"] = rt.get("runs_with_crisis")
    s["crises_by_lab"] = rt.get("crises_by_lab")
    s["safety_win"] = sum(1 for x in r if x["winner"] == "safety") / len(r)
    out[f"no_multiplier_threshold_{thr}"] = s
text = json.dumps(out, indent=1)
with open(os.path.join(HERE, "audit_u_govcal.json"), "w") as f:
    f.write(text)
print(text)
