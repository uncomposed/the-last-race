"""Smoke test: run N seeds of the current core through metrics and print a
compact summary. Missing v2 event kinds must not crash.

    python3 results/metrics_selftest.py [N] [--core path/to/core.py]

--core loads a specific core file (for example a copy of the v1 core from
git: git show 2950ff2:experiments/minimal-race/core.py > /tmp/core_v1.py).
"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)

import metrics    # noqa: E402

args = sys.argv[1:]
core_path = None
if "--core" in args:
    i = args.index("--core")
    core_path = args[i + 1]
    del args[i:i + 2]
if core_path:
    spec = importlib.util.spec_from_file_location("core_under_test", core_path)
    core = importlib.util.module_from_spec(spec)
    sys.modules["core_under_test"] = core
    spec.loader.exec_module(core)
else:
    import core      # noqa: E402
n = int(args[0]) if args else 50
print(f"core: {core_path or os.path.join(HERE, 'core.py')}")
rows = [metrics.run_metrics(core.World(s, core.make_base_config()).run()) for s in range(n)]
S = metrics.summarize(rows)
print(f"n={S['n']} outcomes={S['outcomes']}")
print(f"winners={S['winners']}")
for sec in ("patterns", "interest"):
    print(f"{sec}: {S[sec + '_passed']}/{len(S[sec])} pass")
    for k, v in S[sec].items():
        print(f"  {'PASS' if v['passed'] else 'fail'} {k:<38} {v['value']}")
print("mechanism_fire_rates:", {k: v for k, v in S["mechanism_fire_rates"].items()})

# Defensive check: empty world and a world with no events/history must not crash.
class Empty:
    seed, history, events, cfg, unk, labs, outcome = 0, [], [], {}, {}, {}, None
r = metrics.run_metrics(Empty())
metrics.summarize([r, r])
metrics.summarize([])
print("empty-world check: ok")
