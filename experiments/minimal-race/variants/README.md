# Writing a variant

These instructions are for core v2. Round 1 variants (`h01`–`h20`) were written
against core v1 and use its `rng_*` streams; reproduce them at commit `2950ff2`
(`git switch --detach 2950ff2`), not on the current core.

A variant tests one hypothesis against the shared core. Never edit `core.py`,
`metrics.py` or `run.py`; every experiment must be scored by the same code.

A variant file may define either or both:

```python
import core

def make_config(base):
    base["cfg"]["pact_verify"] = 0.8        # base is already a deep copy
    base["roles"]["safety"]["receptivity"] = 1.0
    return base

class VariantWorld(core.World):
    def capital_market(self):               # override any hook method
        super().capital_market()
        ...
```

`import core` works because `run.py` puts this folder on the path.

Hook methods, called in this order each quarter by `World.step()`:
`arrive_compute`, `observe`, `internalize`, `government_decide`, `covert_ops`, `diplomacy`,
`labs_decide`, `compute_market`, `capital_market`, `resolve_rnd`,
`product_market`, `incidents`, `public_opinion`, `accounting`, `check_end`,
`snapshot`. Helpers: `score_template`, `softmax_pick`, `join_value`,
`train_gain`, `believed_exposure`, `maybe_open_weights`, `end_pact`, `log`.

Rules:
- Keep truth, observation and belief separate. An actor may only decide using
  `self.beliefs[name]`, its own lab state, and public signals. Never let a
  decision read `self.unk` or a rival's true `C`/`S`.
- Randomness is keyed: `self.u("purpose", self.t, actor)` returns a uniform
  draw fixed by (seed, key); `self.gauss(sd, ...)` and `self.expo(...)` work the
  same way. Give every new draw a purpose name nobody else uses, so a variant
  never shifts the paired baseline's luck. Never import `random`.
- Optional mechanisms can be switched off with `base["cfg"]["mech"][name] = False`
  (see `BASE_CONFIG["mech"]`); `knockouts.py` does this for each one.
- Record new notable events with `self.log("kind", ...)` so traces show them.
- New hidden unknowns go in `base["cfg"]["unknowns"]` as `(low, high)` and are
  read from `self.unk`.
- Metrics only see what `metrics.run_metrics` reads. If your mechanism needs a
  new number, compute it from `self.events` or `self.history` in your own
  analysis script in `results/`, and report it separately.

Run:

```sh
python3 run.py --variant variants/hNN_name.py --seeds 300 --out results/hNN_name.json
python3 run.py --variant variants/hNN_name.py --trace 5
```

The JSON has `baseline`, `variant` and `paired_deltas` (same seeds, variant
minus baseline, with standard errors). Patterns P1–P8 are realism checks;
I1–I4 are interestingness checks. Thresholds are judgment calls, not data.
