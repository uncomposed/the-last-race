# The Last Race playability report

14 October 2026

The Last Race has a working foundation for decisions under uncertainty: cash commitments, delayed compute, limited interventions, evidence, and incident risk can produce meaningful changes of strategy. My assessment after this run is that it is not yet a satisfying complete strategy game. Too many questions that determine a company's strategy have no representation, while several implemented mechanisms reward repetitive bookkeeping or end play before the player is finished making decisions.

I would preserve the resource ledger, project timing, knowledge boundaries, and distinction between beliefs and convictions. I would prioritize uncertain model capabilities and evaluations, a stronger connection between products and resource use, custom agreements, and incident response. Before adding broad content, I would fix routine planning, inconsistent pledge verification, rival feasibility, and continuation after a political milestone.

**Evidence and scope**

This was one owner-assisted, agent-executed run of `full-28`, seed `codex-table-2026-10-14`, ending at Q4 2026 after eight resolved quarters and thirty accepted mutations. The owner directed goals and challenged the model; the agent executed all game commands and later received authority to play extended intervals. This establishes neither an independent non-specialist usability result nor how frequently the observed ending occurs across seeds. The owner's request to continue is evidence of interest in continuing this company; it is not an answer to whether they want to replay a different strategy.

The [public command transcript](playtests/2026-10-14-commands.txt) preserves the accepted decisions and final permitted state. Findings below distinguish observed play, source-confirmed mechanics, and hypotheses requiring comparison runs. The source checks did not inspect the played save's hidden world or rival private audits. The terminal report itself disclosed the total incident count.

**What the game asked us to manage**

| Layer | What matters to play | Finding |
| --- | --- | --- |
| Resources | Cash, current compute, future capacity, operating costs, financing, interventions | Cash and time constrained choices. Compute became abundant without much ongoing work to consume it. |
| Work | Training, evaluation, deployment, construction, financing, safety, diplomacy | Several important work types are missing or compressed into generic actions. |
| Assets | Models, products, datasets, facilities, contracts | Facilities persist. Distinct models, datasets, products with customer demand, and negotiated contracts largely do not exist. |
| Knowledge | Hidden performance, observations, company estimates, policy convictions | World and rival beliefs exist; uncertainty about our own model performance does not. |
| Actors | Our company, competitors, governments, customers, enforcement bodies | Competitor signals matter, but government bargaining and customer responses offer little agency. |
| Consequences | Commercial growth, safety incidents, competitive position, political outcomes | Revenue can rise while development is paused. A political outcome can terminate an otherwise viable company. |

The criteria I use are whether a choice changes an outcome the player cares about, whether the player can understand why, whether the sacrifice is meaningful, whether uncertainty can be investigated, whether another strategy is plausible, and whether the resulting state invites another decision. More buttons or more uncertainty alone do not satisfy these criteria.

**The run in brief**

| Point in the run | Cash | Revenue per quarter | Normal compute capacity | Capability | Safety | Important development |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 2025 opening | 85M | 8M | 4 | 2 | 1 | Initial company after opening upkeep |
| Q3 2025 opening | 51M | 17M | 8 | 6 | 3 | First eight-unit facility already ordered |
| Q1 2026 opening | 38M | 23M | 4 | 9 | 6 | Detected containment failures at DeepCent and OpenBrain |
| Q3 2026 opening | 17M | 28M | 20 | 9 | 10 | Both eight-unit facilities online; training paused |
| Q4 2026 close | 36M | 32M | 20 | 9 | 10 | Automatic coordinated-slowdown ending |

Opening cash includes that opening's obligations. The last row is closing cash before another opening. At the ending, nineteen compute units remained unused after routine product work; twenty is capacity, not remaining compute. We ordered another four permanent units, due Q4 2027, that could never arrive in the terminated run. The final report disclosed three containment failures, one undetected at occurrence.

**What I would keep**

The separation between a decision slot, cash, and compute worked. We could not finance already committed work with money arriving at resolution. A new facility did not provide an extra intervention or retroactively supply training compute. These constraints made previews worth reading.

Delayed construction and recurring upkeep also worked. Choosing a later, cheaper facility changed future budgets, and seeing installed capacity replace leases provided an understandable payoff. Keep the explicit delivery date, persistent capacity, upkeep, layout, and power tradeoffs.

Ordered safety actions were consequential: Secure before Train or Ship improved the later action's expected mitigation. The distinction between a failure and a contained warning, between detection and occurrence, and between increased safety spending and an uncertain mitigation ceiling should remain.

The containment failure was the strongest narrative turn. It changed our strategy from capability growth and own-model launches to investigation, safety, product work, and third-party deployment. Respond provided a real way to reassess evidence at full receptivity without inventing a conviction or counting the observation twice.

The public selectors, exact action previews, and checkpoints supported the session. No accepted mutation failed in this run. That is useful session evidence, not a fresh audit of the broader technical test suite. Keep separate company and societal outcomes: a viable company and a slowdown label did not erase the campaign's failures.

**Changes I would make first**

| Priority | Change | Why it precedes additional breadth |
| --- | --- | --- |
| Immediate | Fix invalid rival choices, pledge verification, and zero-gain launch previews | These are local inconsistencies that can distort any later comparison. |
| Immediate | Make slowdown a milestone with an explicit continuation choice | Our request to keep operating was blocked, and a newly purchased asset became irrelevant. |
| Core next release | Model identifiable models, uncertain task abilities, own-model beliefs, and evaluations | The player cannot currently explain what their products can do or which model to deploy. |
| Core next release | Connect task demand, deployed models, inference costs, and compute utilization | Growth and compute ownership currently have a weak relationship once training stops. |
| Core next release | Make incidents create recovery and deployment decisions | The strongest event needs consequences beyond a belief update or terminal predicate. |
| Next | Custom agreements and one government bargaining mechanism | Cooperation needs inspectable terms, incentives, consent, verification, and enforcement. |
| Then | Data acquisition, distillation, and additional capacity contracts | These become meaningful when models, tasks, evidence, and resource use can express their effects. |

**Uncertain models and evaluations**

The owner could not answer where our models stood in coding, general assistance, or agentic research. The engine could not answer either. `Actor.capability` is one known number. Training applies a predetermined gain, coding adds recurring revenue, and science adds safety. There is no model inventory or belief about our own models' task performance. See [issue 2](https://github.com/uncomposed/the-last-race/issues/2).

Add distinct model versions with hidden, task-dependent performance and company estimates informed by evidence. Training choices should express intentions and uncertain outcomes. Evaluations should specify the model, task, harness, tools, duration, resources, and conditions tested. Include unknown strengths, unreliable long workflows, and disagreement between narrow evaluations and deployment experience.

Do not replace one perfectly known scalar with three perfectly known domain scores. The key decision is whether to evaluate an existing model, improve its harness, train another candidate, or deploy despite uncertainty. An older model may be the better choice for one workload after its overlooked strength is discovered.

The minimum proof is two unchanged models and an evaluation that changes which one we select for a specified task. Another task should plausibly favor the other model. Evidence should update relevant beliefs without revealing hidden abilities, and repeating the same evidence should not create independent confirmation. A small set of coding, assistant, and research tasks is sufficient for the next slice; a comprehensive benchmark catalog is not required.

**Revenue and compute need a common mechanism**

From Q1 2026 onward we stopped training, yet revenue rose from 23M to 32M through product work and a third-party launch. Routine product work costs 4M and adds up to 2M recurring revenue until the company's 40M ceiling. Owning more compute does not itself support a modeled customer workload, and revenue has no continuing inference-compute requirement. A third-party launch has zero compute cost in the current action model.

This makes a plausible route to financial growth available without understanding model performance, customer tasks, inference efficiency, or why a new facility is needed. It does not prove that route dominates every objective or seed. It does explain why commercial play became repetitive while our twenty compute units were mostly idle.

Introduce a small set of customer workloads, evaluated model suitability, service capacity, recurring inference cost, and uncertain demand. Preserve the option to run a profitable mature product without frontier training. Make third-party deployment exchange training exposure and capital requirements for ongoing vendor cost, dependency, or capacity limits. Product improvements can improve adoption, reliability, or pricing without guaranteeing the same recurring increment every quarter.

Compare a product business, a training-heavy lab, a compute-constrained business, and a third-party integrator under matched scenarios. Each should have a causal reason to buy, rent, reserve, or decline compute. Do not force construction to pay off simply because the player wants to build it. A project that demand cannot justify should remain a bad investment.

**Routine delegation should remove bookkeeping**

We overrode leasing with product work in five consecutive quarters. The company kept proposing more leased compute even with substantial installed capacity and little use for it. The score for leasing does not evaluate expected compute utilization or the existing asset fleet. A constructed comparison with four versus twenty available compute units returned the same routine ranking: lease, product, safety, hold. Source: `routineOptions` and `makePlan` in `src/policy.ts`.

The three-intervention limit should force sacrifices among strategy, evaluation, investment, and response. Spending one intervention every quarter to restate a persistent operating preference undermines the promise that the company runs itself.

Add standing operating mandates such as maintaining a cash floor, serving a chosen product segment, or leasing only against forecast demand. Changing a mandate can consume an intervention; repeatedly satisfying it should not. Let genuine exceptions still require an override, and keep switching costs when they represent a real organizational sacrifice. In a test with sufficient owned capacity and low forecast utilization, the company should explain why another lease is useful or prefer another operation.

**Treaties need terms and consent**

Three rivals pledged in the first quarter and automatically formed an agreement once both governments monitored. Public evidence did not establish a shared finding behind that coalition. Separate diagnostics showed that government verification and positive standalone pledge scores already exist at the no-evidence prior. This supports a baseline incentive explanation; it does not establish every rival's actual motive or the frequency of early treaties.

There is one global agreement with fixed pledge behavior. The owner wanted to inspect and decline terms, and to condition activation on participation, compute coverage, or frontier-model coverage. These are central strategic choices, not diplomatic decoration. See [issue 1](https://github.com/uncomposed/the-last-race/issues/1).

Separate a proposal, explicit acceptance, activation conditions, covered activities, verification, sanctions, duration, withdrawal, and amendment. Clarify whether a user threshold refers to covered end users or participating companies. Keep compliance with the terms separate from observed suspicious behavior.

One inconsistency needs a direct fix: building capacity is allowed under the pledge, but construction creates racing evidence that the generic credibility check can use to contradict a slowdown claim. The feed reported contradictions after construction signals. This should not imply that any allowed construction automatically establishes dishonesty. Verify claims against the actual agreed restriction and the evidence available to that observer.

Early precautionary cooperation can remain possible. Do not require a disaster before any actor may cooperate, make every actor share the player's commercial objectives, or tune toward universal refusal. Test conditional agreements both before and after a warning, with a powerful nonparticipant, ambiguous compliance evidence, and a genuinely consequential defection.

**Political outcomes should not erase the rest of the game**

The coordinated-slowdown ending at Q4 2026 blocked the requested continuation to Q2 2027. We had never joined; the rule only required companies within eight capability points of the leader, and the triggered condition implies we were farther behind. That competitive cost is legitimate evidence about our strategy. The arbitrary loss of access to our remaining company decisions is the playability problem.

Record this as a dated political milestone and offer an explicit scored ending or continuation. A formal scoring mode can retain terminal objectives, declared before starting. A business campaign should normally allow the player to operate under the new regime and see whether cooperation lasts. Physical world-ending events may warrant different terminal treatment; not every ending family should share one stop rule.

Expose an understandable warning about an approaching milestone and what remains uncertain. A private true capability threshold should not become a public exact leaderboard merely to explain a countdown. Test an excluded nonparticipant with long-lived assets, a signatory with an unfinished project, and continued play through renewal, expiry, defection, and renewed competition.

**Incidents need recovery decisions**

The detected DeepCent failure changed our choices, but the engine did not impose an operational incident cost, customer loss, recall, or requirement to remediate the affected deployment. Its direct consequences are evidence and, at the relevant frontier threshold, the breakout ending mechanism. The owner asked about governments, permits, protests, and compute seizure because those are potential reasons for a company to alter its behavior. Those pressures are not implemented merely because an event could be narrated.

Give incidents a declared scope, affected system, observed consequences, and a response phase. Possible decisions include suspending or restricting a deployment, rolling back to an older model, investigating, improving monitoring, absorbing a service outage, or accepting an inspection. Let severity, detection, evidence, and actor authority determine commercial or government responses. A contained warning should not automatically produce the same response as an uncontained failure.

Avoid a generic random punishment table that makes every failure cost cash or summon protesters. The test is whether the same incident supports multiple costly, understandable responses and whether policy changes follow a causal mechanism. Declining intervention should also have a modeled consequence or an explicit uncertainty, rather than disappearing into flavor text.

**Governments and resource contracts**

We could not ask the China Council to prioritize compute, pool resources, exchange inspections for access, or negotiate permits. Governments choose growth or verification, monitoring can increase, and verification adds a construction delay. Influence cannot be spent on a government action. Regional power allocations are per company, so there is no shared queue to bargain over.

Add one constrained government contract before building a large diplomacy system: a capacity reservation or permitting agreement with an identified supplier, finite allocation, price, delivery, obligations, and response to breach. Participation should have an opportunity cost for the government or another actor. Distinguish company cash, government authority, available power, hardware supply, political objectives, and verification evidence.

Pooling needs contributions, control rights, scheduling, access priority, exit terms, and consequences for shortages. Priority needs an actual queue or scarce allocation. These mechanics should precede claims that political support has solved our capacity problem. A wildcard can prototype one priced capacity effect, but it cannot establish a negotiated government policy or a multi-company pool.

**Data acquisition and distillation**

The owner's proposed routes to growth were unavailable. Add a small number of explicit data and distillation choices once uncertain models and evaluations exist. A data action should create rights or access, costs, time, coverage, and uncertainty about usefulness. Distillation should identify a teacher, access constraints, student resources, costs, and uncertain task outcomes. Measure its usefulness through evaluations and deployment economics rather than guaranteeing a cheaper copy of the teacher.

Compare buying data, generating data, using existing data, distilling, improving a harness, and doing nothing for a fixed workload and budget. Keep the initial choices coarse. Do not begin with a large data catalog or an architecture editor when the player still cannot evaluate two models.

**Rivals and information need a clearer surface**

The feed accumulated repeated absence reports, funding signals, and claim verifications. Full belief output repeatedly printed twenty-point grids. We needed source inspection to explain several ordinary strategic questions. Preserve the raw views for audit, but default to a quarterly brief: what changed, what it implies, what is uncertain, what we can investigate, and which pending costs or projects matter next.

Provide coarse public or estimated financial and capacity information with dates, ranges, and evidence provenance. Revenue rankings were unavailable even as estimates, so we could not place commercial growth against competitors. Preserve uncertainty about covert training and private plans. Do not turn a requested market comparison into an omniscient resource table.

Beliefs also need interpretable baselines. A training signal described as increased capability moved OpenBrain's estimated capability slightly downward from its very broad prior. That can be mathematically coherent when the observed level is below the prior expectation, but the current labels do not explain it. Use scenario-grounded public starting information where available, and distinguish evidence of growth from an estimate of absolute level. A 52 percent racing estimate should explain its modeled meaning and uncertainty, not imply a precisely defined binary event when the interface has not supplied one.

A constructed diagnostic confirmed another rival problem: with 20M cash and zero parent budget, Metamind selected `fund parent 20`; campaign validation rejected it as exhausted. `resolveQuarter` catches an invalid queued rival action and breaks planning instead of considering the next feasible option. This proves a failure path, not that it caused the actual rivals' behavior in this run. Filter against the same full feasibility rules used for execution, or continue to another candidate on a routine rejection. Test depleted funds, power caps, existing commitments, and insufficient compute. Also document that rivals currently receive two interventions while the player receives three; shared scoring does not imply identical action opportunities.

Exact previews should show expected own-model launch gain, marginal recurring revenue, remaining cash at later openings, asset utilization, and consequences for the delegated plan. A zero-gain own launch should be obvious before the player spends 14M. Distinguish free historical research briefings from paid in-world evaluations. I did not test the briefings enough to assess their engagement value; they should support a decision rather than lengthen every repeated preview.

**Features I would remove or reduce**

- Remove perfectly known model quality as the main strategic information surface. Retain aggregate summaries only as summaries of estimates and evidence.
- Remove automatic terminal treatment of a reversible political milestone in the business campaign.
- Remove repeated intervention costs for enforcing an unchanged operating mandate.
- Replace blanket slowdown claims and generic contradiction checks with commitments whose terms determine compliance.
- Reduce guaranteed recurring product increments that bypass task performance, demand, and serving costs.
- Reduce repetitive feed output and precision without explanatory meaning. Keep full grids and causal traces available on demand.
- Reduce fixed action values and hidden balance asymmetries that let rivals appear strategic while routinely selecting invalid or irrelevant work.

I would not remove uncertainty, delayed construction, the three-move limit, fog of war, organizational inertia, or uncomfortable safety tradeoffs. Each has demonstrated or plausible decision value. Their implementation needs to distinguish productive uncertainty and meaningful sacrifice from missing state and repeated correction.

**What I would not add yet**

I would defer a large event catalog, additional regions, more ending families, individual hiring, lawsuits, detailed model architecture, hosted adjudication, and a polished map. They do not resolve the questions that blocked this run. Keep the headless surface usable, but prove the decision loop before funding a broader presentation layer. Preserve deterministic replay and public information boundaries through every change; a saved campaign needs an explicit compatibility policy.

**My play also deserves criticism**

I bought future capacity while training was paused and utilization was low. That followed the owner's preference for future compute, but it lacked a demonstrated workload or financial return. A stronger plan would compare holding cash, reserving capacity, evaluating demand, and purchasing immediately. The game should make that comparison possible rather than guarantee a construction payoff.

The later third-party launch cost 14M for 1M additional recurring revenue: fourteen quarters of gross payback before any further costs. I treated it as a long-horizon purchase without adequately accounting for the chance that an early ending would make that horizon unavailable. The choice was mine; the missing continuation and milestone warning made its horizon harder to assess.

Pausing development improved safety spending and revenue stability but left us behind the frontier group. That is a real sacrifice, not evidence that a cautious strategy should always win. Remaining outside the treaty honored the owner's direction; once failures occurred, its weak terms still offered no tailored recovery or commercial benefit. Neither choice proves that treaty participation or further training would have produced a better overall outcome.

The owner delegating several quarters is not evidence of boredom by itself. The clearest negative engagement evidence is the repeated inability to express desired strategies and the forced stop when the owner asked to continue.

**A bounded next development cycle**

First fix rival feasibility, pledge verification, launch previews, and post-milestone continuation. Improve the quarterly brief and stop unnecessary leasing under a standing mandate. These repairs make later playtests easier to interpret.

Then build one connected loop with a small model portfolio, the three requested task areas, uncertain training outcomes, evaluations, deployed workloads, and compute costs. Add a modest incident response sequence to that loop. Prove that evaluating an existing model can change deployment and that serving a growing product creates a reason to acquire compute.

Next add one configurable agreement and one government capacity contract using those existing model and resource definitions. Validate consent, activation, compliance, and enforcement separately. Data acquisition and distillation can then become alternative investments inside the same loop.

Stop expanding scope when the owner and the two non-specialist testers required by `docs/ACCEPTANCE.md` can each explain the next routine choice, identify at least two meaningful sacrifices, make a task-specific model choice from evidence, and complete or voluntarily conclude a run. Record whether each wants another run and why. Do not infer replay intent from successful command execution.

Use matched seeds and resources to compare alternatives, omit supposedly decisive evidence to test its causal effect, and include counterexamples where evaluation is misleading, an investment is poor, a treaty never activates, or a government declines a deal. Track continued engagement, source-inspection needs, repetitive overrides, unused capacity, and unexpected termination. Do not use equal ending frequencies or more complicated state as the success criterion.

This run supports revising the core loop before more breadth. It supplies a completed terminal campaign and substantive owner feedback; it does not establish the full human fun gate. I would want another playtest after the model/evaluation, operating-policy, and continuation changes, because those changes could make a different strategy substantially different to play.

**Implementation and audit references**

| Reference | Relevant evidence |
| --- | --- |
| `src/types.ts`, `Actor`, `Project`, `CampaignState` | Current assets, scalar capability, belief types, and single treaty representation |
| `src/policy.ts`, `trainingBenefits`, `routineOptions`, `chooseIntervention` | Fixed training effects, lease ranking, pledge incentives, and rival funding selection |
| `src/campaign.ts`, `campaignSignal`, `campaignQuarterEnd`, `launchGain` | Construction signals, claim verification, government behavior, agreement thresholds, and launch returns |
| `src/engine.ts`, `incident`, `resolveQuarter`, `getBeliefs`, `listActions` | Incident effects, terminal checks, rival rejection behavior, permitted beliefs, and previews |
| `docs/ACCEPTANCE.md`, `docs/CONTRACTS.md`, `docs/VALIDATION.md` | Existing fun gate, explicit modeling choices, and previously reported technical validation |
| [Treaty issue](https://github.com/uncomposed/the-last-race/issues/1), [model capability issue](https://github.com/uncomposed/the-last-race/issues/2) | Owner-requested requirements already recorded on GitHub |

Two constructed source diagnostics accompanied this assessment: depleted parent funding was selected and then rejected; increasing available compute from four to twenty did not change routine option ranking. Their fixtures were separate from the played campaign. They do not establish the frequency of either behavior across seeds. A fresh in-memory replay of the thirty recorded commands matched the reported final company figures, installed and pending capacity, nonparticipation in the treaty, ending, quarter, and revision. The existing validation record describes prior technical checks; no new full test-suite result is claimed for this report.
