# Support custom treaties with explicit consent, conditional activation, and defined enforcement

Status: open. GitHub: https://github.com/uncomposed/the-last-race/issues/1

## Problem

In the first played quarter, three of five rivals pledged a slowdown and both governments began monitoring, automatically establishing a treaty. The player had received no common public control finding explaining this coalition. The visible announcements establish willingness to pledge; they do not establish compelling shared evidence, negotiated participation, or durable restraint.

This can make the agreement label suggest more coordination and evidential support than the mechanism actually establishes. This report concerns policy incentives, treaty formation, and player explanation separately; it does not assume that every early coalition is implausible or that unanimity should always be required.

## Reproduction

Start `full-28` with seed `codex-table-2026-10-14` in an independent session directory. Stage, in order:

```text
secure 1
train small pretraining reasoning coding
ship third-party
quarter
end
feed
view
```

At the Q2 2025 opening, the public treaty members are Antropic, DeepQuest, and Metamind. Both governments have monitoring 1. The player feed includes their slowdown claims, possible construction by DeepQuest and Metamind, and possible training by OpenBrain and xSpace. Our private opening control audit is not shared public evidence. No hidden save contents or rival private audits were inspected for this report.

## Mechanisms and diagnostic evidence

- `src/engine.ts`, `study` and `createRun`: each company receives a separate noisy private opening control audit. Their particular results and motives are not visible to the player.
- `src/policy.ts`, `chooseIntervention`: a self slowdown announcement costs 1M and zero compute. An eligible pledge receives mission value `(1 - controlMean) * 8`. Its score does not explicitly price future foregone training or condition participation on competitor commitments. Other actions may still outrank the pledge.
- `src/campaign.ts`, `campaignQuarterEnd`: three active pledges and monitoring of at least 1 by each government automatically establish a treaty; no negotiation or shared evidence threshold is required.
- A diagnostic using only scenario defaults, without any evidence updates or access to the played run's hidden state, gives government verification score 4.925 versus growth score 2.3. All five rivals have positive standalone pledge scores at the prior: OpenBrain 2.32, Antropic 4.57, Metamind 1.88, DeepQuest 2.64, xSpace 1.88. These scores establish baseline incentives, not the actual cause of each observed rival choice.
- Pledges last four quarters. Build is permitted. Training under an active established treaty can register defection; automated policy suppresses training only when the actor is pledged and its racing-pressure belief is below 0.6. The successful coordinated-slowdown ending has stronger participation and duration requirements than initial treaty formation.

Inference: early buy-in may arise from default preferences, low immediate pledge cost, and the formation threshold without a strong common evidential trigger. This reproduction alone does not establish how often that happens across seeds.

## Evaluation and possible changes

### Requested treaty behavior from owner play

The owner wants configurable agreements that companies can explicitly accept or decline. Joining must not be inferred from a generic public announcement or automatically imposed by an unrelated participation threshold. Preserve the early-coalition reproduction below as evidence of why this matters.

Separate the following layers:

- **Terms:** specify which training, deployment, construction, leasing, or compute expansion activities are covered, with limits, exceptions, duration, withdrawal, and renewal terms. Define model and resource coverage explicitly.
- **Consent:** an identifiable proposal with a fixed terms version, explicit acceptance or rejection per actor, and consent to material amendments. The player must be able to inspect and pass on the actual terms.
- **Activation:** agreed prerequisites distinct from sanctions. Examples requested by the owner include participation counts, compute thresholds, and frontier-model counts; the owner's reference to users should support a clearly defined covered-user threshold if end users are intended, rather than silently equating users with companies. Specify whether thresholds mean counts, absolute capacity, or a share of a declared denominator, how conditions combine, and whether activation is suspended when coverage falls.
- **Verification:** evidence for prerequisite satisfaction and compliance, uncertainty about concealed activity, inspection authority, and what each participant can actually observe. Actual hidden coverage must not silently become public knowledge.
- **Enforcement and incentives:** identify the enforcing actor, authority, resources, breach procedure, and consequences. Distinguish treaty sanctions from external pressures such as permit access or government restrictions. Each must have an implemented causal mechanism before being represented as a reason to join; protests, seizure, and permit denial are not present in the current engine.

The owner's current play preference is to remain outside an agreement absent demonstrated warning shots or concrete pressure, and to prioritize revenue and current/future compute. This preference is not a requirement to make every company share that objective or to prohibit voluntary precautionary cooperation.

Acceptance additions:

1. Proposing, accepting, declining, amending, activating, expiring, and breaching a treaty are distinct inspectable events. Declining a proposal alone is not a breach.
2. A signed agreement remains pending until its exact activation conditions are met. Tests cover below/equal/above each threshold and loss of required coverage, with no activation based merely on three generic pledges.
3. Treaty terms determine whether building compute while pausing frontier training is compliant. Policy opportunity costs and credibility updates use those terms consistently.
4. Sanctions arise through the specified enforcement mechanism. No automatic seizure, permit denial, or social backlash is invented as a substitute for missing mechanics.
5. The player can inspect expected sacrifices, conditional benefits, activation evidence, uncertainty, and consequences before accepting. Diagnostics distinguish coalition preferences from warning-driven or pressure-driven participation.

Compare the existing policy against explicit future opportunity costs, conditional participation based on relevant competitors, and an explanation that distinguishes parallel pledges from a coordinated monitored agreement. Determine which behavior is intended before selecting an implementation.

Validation should:

1. Compare no-evidence, favorable-control, adverse-control, and credible public-warning cases while holding resources and objective weights fixed. Attribute changes to evidence, preferences, resource constraints, and participation rules separately.
2. Check whether zero-compute pledges are selected as residual feasible actions after higher-ranked work, rather than responses to a warning.
3. Contrast partial coalitions with coalitions covering the capability frontier; include a strong nonparticipant and differing beliefs about defection.
4. Verify the intended treatment of construction, leases, training, withdrawal, expiry, and renewal. Keep actual behavior separate from detected evidence and credibility updates.
5. Measure formation, renewal, defection, and sustained slowdown over multiple seeds. Do not use equal ending frequencies or a forced absence of early treaties as the success criterion.
6. Expose a player-safe causal explanation without leaking rival private audits, resources, plans, or hidden traits.

Acceptance: the intended formation criteria are explicit and tested; prior-driven versus evidence-driven participation can be distinguished in diagnostics; player wording reflects the commitment actually achieved; and sustained cooperation is evaluated separately from initial pledges. Stop after these criteria are demonstrated with representative counterexamples, rather than tuning until one transcript looks plausible.
