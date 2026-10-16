"""Null check for core v3: with depreciation switched off, does the current
core reproduce core v2 exactly?

Loads core v2 from git (commit 3f1add9, the round 3 commit) into a separate
module, runs both on the same seeds, and compares every quarter's snapshot,
every logged event, and the outcome.

    python3 results/v3_null_check.py --seeds 300 --start 0
    python3 results/v3_null_check.py --seeds 1000 --start 1000
"""
import argparse
import importlib.util
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)
import core  # noqa: E402

V2_REF = "3f1add9"


def load_v2():
    src = subprocess.run(["git", "show", f"{V2_REF}:experiments/minimal-race/core.py"],
                         cwd=HERE, capture_output=True, text=True, check=True).stdout
    path = os.path.join(tempfile.mkdtemp(), "core_v2.py")
    with open(path, "w") as f:
        f.write(src)
    spec = importlib.util.spec_from_file_location("core_v2", path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["core_v2"] = mod
    spec.loader.exec_module(mod)
    return mod


def fingerprint(w):
    return repr((w.history, w.events, w.outcome))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", type=int, default=300)
    ap.add_argument("--start", type=int, default=0)
    a = ap.parse_args()
    v2 = load_v2()
    conf = core.make_base_config()
    conf["cfg"]["mech"]["depreciation"] = False
    diff = []
    for s in range(a.start, a.start + a.seeds):
        if fingerprint(core.World(s, conf).run()) != fingerprint(v2.World(s).run()):
            diff.append(s)
    print(f"seeds {a.start}-{a.start + a.seeds - 1}: {a.seeds - len(diff)} identical, "
          f"{len(diff)} differ{': ' + str(diff[:20]) if diff else ''}")
    sys.exit(1 if diff else 0)


if __name__ == "__main__":
    main()
