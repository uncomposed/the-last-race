# Numerical and knowledge contract

## Typed layers

- Scenario: validated fixture quantities, support points, display boundaries, costs, risk lookup table and provenance.
- World: authoritative actor resources, projects, hidden control ceiling and private incident history.
- Observation: per-observer evidence with detection, ambiguity, credibility and admitted receptivity.
- Belief: an independent finite posterior over a latent constant, plus a separate expiring policy conviction. The engine has one latent control constant and independent per-rival strategic assessments. A separately labeled conditional frontier extrapolation is derived from capability and an explicit training-rate assumption; it is not a latent posterior or a forecast. No joint inference is claimed.
- Policy/plan: expected benefit scores, switching costs, one delegated operation, staged interventions and a shared ledger.
- Command: actor, revision, idempotency key and intent; accepted intent is replayed in order.
- Verification: private causal traces and full replay artifacts. Player explanations expose only permitted information.

## double-ordered-v1

Authoritative real arithmetic uses IEEE doubles with explicit operation/reduction order and no native exponential, logarithmic or fractional-power functions. Piecewise-linear risk uses scenario knots. Grid updates enumerate all 20 support points. Sorted actor and evidence order plus stable option IDs determine ties. No inference sampling or BigInt is used.

Cash is integer millions of synthetic credits, compute is integer capacity units, and quarters/moves/revisions are integers. Exact-threshold counters must be safe integers. Resource costs have no implicit fractional rounding. Numerical helpers reject non-finite input and zero-width lookup intervals. All-zero weighted evidence retains the prior and emits an incompatible-observation diagnostic. All posteriors normalize after each update.

The admitted likelihood is `1 + credibility * (1 - ambiguity) * receptivity * (likelihood - 1)`. Receptivity zero therefore yields uninformative evidence. Respond replaces the original item's receptivity with one and recomputes unique observations from the original prior in fixed order. It never applies the same observation a second time. Display bins sum mass at their constituent support points, using `(lower, upper]` intervals (the first also includes the lower boundary).

`keyed-v1` draws are portable integer polynomial mixing followed by four Park–Miller steps. Integer modulo is evaluated with a declared floor of the quotient; intermediates remain below 2^53. This integer bookkeeping and decimal formatting are distinct from nonlinear simulation effects. Keys include event/observer identity rather than mutable RNG position. The generator is a reproducibility primitive, not cryptographic randomness. Grid inference uses no draws.

Canonical JSON sorts object keys, preserves array order, normalizes negative zero and rejects non-JSON/non-finite values. A portable content checksum identifies scenario records. The build generates a SHA-256 source hash for the engine. Replay records source identity, scenario identity, numerical version, model variant, seed and committed commands. Neither checksum nor serialization proves transition determinism: tests compare full results across Node V8 and browser engines.

## Model boundaries and falsification

The synthetic control ceiling is a latent draw on the declared grid. Safety spending cannot remove risk above that ceiling. Interpretation and organizational action are separate gates; observing evidence does not imply accepting it or acting on it. Routine policy and rivals cannot inspect the true ceiling or player private intentions.

Test the boundaries by changing a hidden trait while holding player observations fixed: views, previews and current policy should not disclose that trait. Invalid and stale commands must leave canonical state unchanged. Same-seed command transcripts must reproduce the full authoritative state. Four-quarter convictions must expire to the updated posterior, not the original prior. Replacing an evidence contribution must agree with one recomputation at full receptivity.

The design intentionally prioritizes a playable independent model over a generalized joint-inference framework. Add correlated inference only when a documented decision/explanation failure demonstrates the need. Synthetic balancing results cannot validate empirical takeoff forecasts or safety claims.
