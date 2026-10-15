# Stage 2b contracts

**Current revision:** the 0.3 repairs and optional lab/business scenarios are specified in [LAB-LOOP.md](LAB-LOOP.md) and the active PLAN.md milestones. They supersede conflicting descriptions of pledge verification, routine leases and terminal political outcomes below. `full-28` keeps scored endings and the legacy economy. The following remains the historical base contract.


PLAN.md is the product specification. The current implementation is a complete headless technical candidate; owner and non-specialist fun acceptance are separate and pending.

## Typed layers and decision order

- **Resources:** integer cash, quarterly compute allowance, persistent/expiring capacity assets, parent budget, and future repayments. None grants intervention slots.
- **Execution:** opening project completion/upkeep/observations; evidence interpretation and a delegated routine plan; up to three interventions; independent rival choices; one feasible ledger; ordered action resolution; revenue; ending evaluation.
- **Work:** Build, Train, Ship, Fund, Secure, Investigate, Announce. Plan/belief overrides, Respond and the once-per-run wildcard use the same slot budget. Proposal and human review are administrative records, not interventions.
- **Actors:** six companies use common option scoring. Governments score monitoring versus growth using the same objective-weight machinery and public evidence. Government policy does not receive private player intentions.
- **Knowledge:** authoritative world/traits, observations, independent grid beliefs, plans, commands, causal traces and permitted views remain separate. Terminal reveal is explicit.
- **Verification:** pure transition tests, recorded full-campaign witnesses, real CLI/MCP sessions, paired assumptions, cross-runtime state equality, then human acceptance. One layer cannot substitute for another.

`engine.ts`, `campaign.ts`, `policy.ts`, `beliefs.ts`, `scenario.ts`, `numeric.ts` and `types.ts` are browser-safe pure engine modules. I/O lives in `checkpoints.ts`, `service.ts`, `cli.ts` and `mcp.ts`. Replay identity hashes every engine module. New artifacts use format 2; compatible Stage 2a source remains under `compat/stage-2a/` for format-1 saves.

## Resources and timing

The base compute allowance resets each opening. A routine lease grants four additional units for the following quarter only. Build creates a separate construction project; completion adds an asset whose capacity recurs each quarter. Clean power and distributed facilities cost more and take longer, but reduce outage probability. Regional government verification adds a permit quarter. Regional power is a declared **per-company allocation**, avoiding hidden rival commitments leaking through feasibility errors. Jurisdictions are synthetic regulatory blocs, not claims about national sovereignty.

Assets have upkeep and may expire. Seeded regional outages temporarily halve affected capacity. Upkeep starts at delivery opening for construction and delayed purchases, or the next opening for immediate resolution purchases. New obligations are included in the next-opening affordability test; insolvency cannot silently forgive the player’s debts.

Fund proceeds arrive at resolution. Parent support draws down a finite 80M parent budget, costs influence, and carries eight payments. External financing carries eight stated repayments and a larger influence cost. Four outstanding obligations is the borrowing limit. Previews expose terms. A funding action cannot fund another commitment in the same quarter.

Routine product work and strategic launches have distinct effects. Strategic own-model revenue requires capability improvement since the prior own-model launch. Third-party harnesses have smaller gains. The synthetic recurring market ceiling is 40M; repeated exhausted launches still cost money and produce no free influence.

## Evidence and policy

Control uses one 20-point latent grid. Each rival additionally has independent 20-point racing, capability, safety and credibility assessments. Probability displays sum mass into five contiguous bins. Capability/safety assessments scale support by 40/20; these are coarse synthetic measures, not correlated inference. A conditional frontier timeline is labeled as an extrapolation.

Detection precedes interpretation and action. Public signals are always detected; physical/covert signals depend on intelligence and paid concealment. Internal interventions only produce external evidence through a separate keyed leak pathway. Previews use a declared observer-intelligence prior, never hidden traits.

Action signals and targeted investigations update strategic beliefs. Racing pressure changes leasing/training priorities; expected rival safety affects baseline safety planning. Announcements retain speaker, target, claim and time. The same repeated claim is one evidence source. Later detected evidence can corroborate or contradict a claim and change that receiver’s trust. Actual hidden behavior alone does not update receiver credibility.

False rumors have one independent opportunity per observer-quarter at a seeded exploratory propensity from 0%, 1%, 2%, 3%, 5%. Absence evidence requires an explicit investigation or government monitoring opportunity and retains a high ambiguity allowance for missed covert activity.

Overrides last current quarter plus three, keep learning underneath, and can address control or a specific rival/topic. Respond replaces the original contribution at full receptivity, retains credibility/ambiguity and overrides, can commit any feasible ordinary action (including expansion), pays its chosen cost, and bypasses inertia. Wildcards retain their separate human approval flow. Individual acted-on attribution requires a leave-one-out policy change.

## Endings

Scenario data stores horizon, thresholds, observation assumptions and ordered named ending rules. Conditions are deliberately bounded TypeScript mechanisms, not an expression language.

1. Loss of control: a successful frontier breakout is detected, discovered after two quarters, or exposed at the final reveal.
2. Failed slowdown: a company breaks an active monitored agreement and subsequently gains at least four capability points. A promise alone or a generic random failure does not suffice.
3. Verification broken: a completed agency-focused RL project, initiated above the paradigm threshold, invalidates an already established monitoring regime. Beginning research alone does not trigger the ending.
4. Coordinated slowdown: at least three active signatories, including every company within eight capability points of the leader, sustain four quiet quarters without defection.
5. Safe lead: at the horizon, player frontier leadership, substantial safety spending, a favorable evidence-based control assessment and no frontier breakout. A conviction alone cannot certify this outcome.
6. Winner takes all: at the horizon, one frontier company exceeds all others by the configured dominance gap.
7. Left behind: player cannot pay the next obligations or trails by the dominance threshold at the horizon.
8. Multipolar balance: remaining horizon states. This broad residual family is an explicit synthetic simplification; inspect the separate societal report.

Viability, influence and societal outcomes remain separate. A rival can be the winner. Low-capability containment incidents do not automatically imply frontier loss of control. Risk remains action risk × (1 − mitigation), with mitigation bounded by the hidden control ceiling and separate attempt/success/detection draws.

## Human wildcards and durability

A ruling has exactly one bounded effect (capacity, cash or safety), amount, price, delay, duration, upkeep and visibility. No arbitrary code, hidden-state condition or extra field is admitted. Minimum prices and effect bounds are enforced. Acceptance requires explicit human attribution of the exact current-quarter proposal; it is a local trust boundary, not authentication. Applying an accepted ruling consumes one ordinary slot once per run. A caller must never infer human approval.

The session service owns checkpoint writes; clients cannot choose paths through MCP tools. A directory lock excludes concurrent writers. Each accepted command is atomically renamed into its checkpoint with the prior checkpoint retained. A write failure does not publish the in-memory transition. Recovery validates replay. Exact idempotent retries survive process restart. Public selectors never read the checkpoint contents as player information.

## Comparison alternatives, omissions and stopping rules

The finite independent model is retained instead of a joint sampler. Per-company regional allocations are used instead of secret pooled reservations. Human bounded local rulings are used before a hosted adjudicator. These are explicit modeling/implementation choices, not empirical conclusions.

Audit by removing a consequential observation, reversing Secure/Train order, omitting an agreement or prior verification regime, retrying/rejecting commands, changing hidden rival information under the same view, exhausting launch returns, and changing only the declared prior/detection assumption on paired seeds. Stop for determinism, resource, knowledge-boundary or missing-ending failures. Do not add modeling machinery merely to make policies achieve equal outcomes.

The prior failure to catch is a successful demo being mistaken for a complete or enjoyable strategic surface. The human gate still requires meaningful sacrifices, understandable company behavior, and desire to replay from the owner and two non-specialists.
