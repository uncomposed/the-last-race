# Connected lab loop — 0.3

This is an implemented, synthetic 12-quarter scenario alongside the original 28-quarter scope. It is not calibrated AI forecasting and has not passed human acceptance. The active implementation order and stopping gates are in PLAN.md.

## State and knowledge

`src/lab.ts` is a pure transition module included in replay identity. Each company owns Compact 1 and General 1 and can access Vendor General. Training completion adds a persistent candidate. Hidden task abilities, long-workflow penalties and autonomous hazard are drawn once by stable model identity; viewing or evaluating never redraws them. The legacy known capability scalar remains a frontier proxy for political/end-state mechanisms, not task performance. Coding/science training in lab mode does not grant automatic revenue/safety.

Task observations distinguish coding, assistance and research; supervised and autonomous harnesses; short and long workflows. Tool permissions are fixed by the harness preset in this bounded slice. There is no arbitrary harness editor or automatic research-productivity feedback yet.

A standard evaluation costs 6M and one compute for eight trials; holdout costs 10M and two compute for sixteen independent trials. Both use one intervention. Results arrive next opening. Each model/task/harness/duration/suite can be commissioned once per company. Separate context posteriors use twenty support points; synthetic likelihoods assume independent trials conditional on stable performance. Observed production is a distinct dated source and updates the matching context at the next opening. No result transfers automatically to other tasks, durations or permission levels. These task estimates currently admit measured results fully; the legacy world/rival beliefs retain receptivity, conviction and Respond mechanics. Reliability evidence does not update containment beliefs.

Pending results, model truth, rival inventories and undetected incidents are excluded from ordinary selectors, previews and explanations. A terminal reveal includes them. Production receipts expose work actually observed, not the latent probability. Model views show broad priors, five probability bins, estimates and evidence IDs. These are model conventions, not empirically calibrated confidence intervals.

## Serving and markets

`deploy` costs 4M and one move for positive requested capacity, or zero cash and one move to suspend. One deployment per task and one change per task per quarter keep the management surface bounded. The same action replaces a model, changes supervision/duration or reduces capacity. No implicit training or evaluation is bundled into it.

All strategic costs are reserved first. Existing and newly configured service then reserves affordable capacity within the remaining compute/cash and the standing cash floor; routine product/safety/lease work uses the remaining ledger. Service can throttle, with requested and funded capacity shown. No resolution income funds prior commitments. Throttling is allowed because these are capacity offers, not guaranteed customer contracts. Allocation priority follows stable deployment IDs, an explicit simplification; the UI must show foregone work.

Each requested/funded unit costs 1M operations plus 1M if supervised. Vendor service adds 1M per unit and uses vendor compute, with six requested units shared across the company's deployments. Own compact models serve two short work units per compute; general/candidate models serve one. Long work doubles compute. Capacity is reserved before customers arrive, so unused capacity still costs money.

Public demand is separate for each task and duration, changes by keyed scenario draws, and grows slowly. Short service cannot satisfy long-workflow demand. Companies compete using observed reputation, with stable allocation ties and funded capacity limits. Successful short work earns 5M; successful long work earns 7M. Revenue is realized service income for the resolved quarter, not a guaranteed recurring annuity. Reputations respond to service outcomes. Routine product work improves existing reputation up to its cap, never directly increments revenue. Previews show exact commitments and a belief-based full-allocation ceiling/range; actual demand allocation and success remain uncertain.

## Incidents and response

Serving autonomous work creates a new exposure opportunity every quarter, including vendor service. Attempt, containment and detection are separate keyed draws; hidden control effectiveness caps mitigation. Supervised service excludes autonomous tool access in this slice, has higher operating cost, and receives a reliability benefit. This does not assert that supervision eliminates all real-world risks.

An observed uncontained failure lowers that deployment's reputation; a contained warning does not receive the same penalty. Suspension, replacement with an older/other model, or restriction to supervision marks the observed incident's response and changes future service/cost/exposure. Continuing without a change leaves autonomous exposure active. Detected incidents enter the owner's control-evidence feed and support Respond with an ordinary deployment action. There is no generic fine/protest table, insurance, recall law, or simulated downstream third-party harm model. Frontier failures use the retained aggregate frontier mechanism for catastrophic termination, an acknowledged simplification.

## Repairs and continuation

Rivals filter candidates through campaign validation and a complete prospective plan, including exhausted parent budgets, regional caps and staged work. Player and rivals retain three versus two strategic slots; this asymmetry is explicit in rules.

Slowdown verification uses typed observed training or a defined monitored-absence opportunity. Construction and funding cannot establish a violation of a no-training promise. Renewals record their time intervals without creating independent claim evidence. A later observed violation can overturn an earlier absence-based assessment; repeated identical verdicts do not farm credibility. Custom treaties and public enforcement decisions remain later work.

A standing mandate costs one move to change and persists. It sets routine preference, a reserve for delegated operations and a compute target above serving demand. Explicit strategic actions may spend the reserve. Lease selection requires a forecast shortage; current temporary leases are excluded from next-quarter supply. No mandate grants extra strategic actions.

`full-28` stays explicitly scored. `business-28` and `lab-12` pause at new political milestones with `continue_campaign` or `conclude_campaign`; neither costs a move. Continue opens the next quarter exactly once without replaying income, costs or incidents. No terminal report or hidden reveal is generated until conclusion. Already-recorded milestone families do not repeatedly interrupt the campaign. The declared horizon, insolvency and physical loss of control remain terminal. Renewal/withdrawal and verification still have the limits of the legacy fixed agreement; configurable terms are R4.

## Compatibility and auditing

The old Stage 2b source and identity are preserved under `compat/stage-2b`; original saves are not migrated. The new default session directory is `.last-race-v3`. The engine version is 0.3.0; format 2 remains structurally readable only with its exact source/scenario identity.

Run `npm run check`, `npm run verify:lab` and `npm run simulate`. The lab checks cover evidence omission/reversal, misleading samples, cross-task preferences, recurring resources, competition, response alternatives, private-state perturbation, CLI/MCP checkpoints, milestone replay and cross-runtime equality. The matched policies in `scripts/lab-witnesses.ts` use public estimates and views. Compare terminal metrics with their horizons; twelve diagnostic runs are not a representative balance study. Preserve original and replacement ending witnesses rather than tuning rules to keep a preferred seed outcome.
