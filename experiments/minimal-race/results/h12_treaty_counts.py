"""Count treaty events for the h12 variant over the same 300 seeds as the paired run.

    python3 results/h12_treaty_counts.py 300
"""
import os
import statistics as st
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

import run  # noqa: E402

N = int(sys.argv[1]) if len(sys.argv) > 1 else 300
mod = run.load_variant(os.path.join(os.path.dirname(HERE), "variants", "h12_intergov_treaty.py"))
form_seeds = exit_seeds = both_seeds = 0
forms_total = exits_total = violations_total = 0
form_qs, exit_qs = [], []
for s in range(N):
    w = run.build(mod, s).run()
    forms = [e for e in w.events if e["kind"] == "treaty_form"]
    exits = [e for e in w.events if e["kind"] == "treaty_exit"]
    viol = [e for e in w.events if e["kind"] == "treaty_violation"]
    forms_total += len(forms)
    exits_total += len(exits)
    violations_total += len(viol)
    if forms:
        form_seeds += 1
        form_qs.append(forms[0]["t"])
        if all(v > 0 for v in forms[0]["trigger"].values()):
            both_seeds += 1
    if exits:
        exit_seeds += 1
        exit_qs.append(exits[0]["t"])
print(f"seeds={N}")
print(f"seeds_with_treaty_form={form_seeds} ({form_seeds / N:.3f})")
print(f"seeds_with_treaty_exit={exit_seeds} ({exit_seeds / N:.3f})")
print(f"treaty_form_events={forms_total} treaty_exit_events={exits_total} treaty_violation_events={violations_total}")
print(f"forms_with_both_blocs_incident_trigger={both_seeds}/{form_seeds}")
if form_qs:
    print(f"first_form_quarter_median={st.median(form_qs)} mean={st.mean(form_qs):.2f}")
if exit_qs:
    print(f"first_exit_quarter_median={st.median(exit_qs)} mean={st.mean(exit_qs):.2f}")
