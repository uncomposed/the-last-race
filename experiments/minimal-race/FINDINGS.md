# Round 1 findings — 20 mechanism hypotheses

15 October 2026. Status: `verified` (each experiment was rerun by an independent auditor and reproduced exactly). Not `human_validated`. All quantities are synthetic; nothing here is calibrated to the real world.

## Setup

- Shared core: `core.py` (belief-driven actors, no language model in decisions), fixed scoring in `metrics.py`, paired runner `run.py`. Core hashes were unchanged by every experiment.
- Each hypothesis: one Haiku 5.5 agent implemented a variant and ran 300 paired seeds; an independent auditor (Opus 5.5) checked rules, re-ran the numbers, and corrected the verdict where needed.
- A paired delta counts as real only if |mean| > 2 × standard error.
- Cost: about 2.7M subagent tokens across both rounds. 8 of 20 Haiku agents failed on the first attempt (4 context overflow, 4 schema failures); 6 had finished their files, 2 were re-run.

## Baseline

Outcomes over 300 seeds: unipolar takeoff 49%, catastrophic takeoff 28%, multipolar 14%, catastrophic incident 9%. The frontier lab wins about 73% of the time. Passes 6 of 8 realism patterns and 3 of 4 interest checks. Fails: leaders rarely change (P3), pacts rarely form (P4), beliefs don't diverge enough (I4).

## Results (audited verdicts)

| ID | Mechanism | Verdict | What actually happened |
|---|---|---|---|
| h01 | Investors fund revenue, not momentum | inconclusive | No lab decision reads funding, so the mechanism had no channel to change behaviour. |
| h02 | Prediction market on hazard | partly | Hazard-belief error falls; no effect on pacts or regulation. One reported effect was an artifact. |
| h03 | Compute rental market | partly | Lead changes +0.85, but the leaders rent most, not the laggards. |
| h04 | Talent market | partly | No more lead changes. Takeoff 3.9 quarters earlier, catastrophe +11 points, safety lab wins 1% → 13%. |
| h05 | Leverage and bubbles | refuted | Debt acts as a lifeline: fewer bankruptcies. The bust path barely fires. |
| h06 | Belief-filter strength | partly | Stubborn actors: beliefs diverge (I4 passes), fewer pacts. Fully Bayesian actors converge on a wrong answer. |
| h07 | Motivated reasoning | partly | Lab–government belief gap widens; pacts fall about 40%. |
| h08 | Mandatory incident disclosure | refuted (safety half) | More regulation, more pacts, much more protest damage, and catastrophe *rises* +8 points. |
| h09 | Gamed benchmarks | partly | Lead changes +0.86, takeoff slightly *later*, mostly via investors reading doctored numbers. |
| h10 | Espionage and weight theft | partly | Bloc B catch-up, unipolar 49% → 36%, catastrophe +8 points. Security spiral half not supported. |
| h11 | Verification strength | partly | Defection drops steeply then plateaus; pacts break at the same rate. |
| h12 | Government treaty | inconclusive | Trigger and exit rules built the claim in. |
| h13 | Pacts need frontier coverage | refuted | Rule never binds as specified; margin version cuts pacts without making them last. |
| h14 | National consolidation | partly | Bloc B wins 14% → 24%, but merge fires on schedule (quarter 3), not from belief change. |
| h15 | Power constraint | inconclusive | Bloc A is power-bound from the start; bloc B's faster build almost never matters. |
| h16 | Sabotage spiral | partly | First strikes delay takeoff; retaliation adds little. Trigger fires in 97% of seeds. |
| h17 | Labs learn automation strength | inconclusive | Learning step had a self-reference bug; labs barely learned. |
| h18 | Safety spillover | partly | Incidents fall sharply; takeoff earlier, not later. |
| h19 | Imitation in decisions | refuted (herding) | No herding. Frontier wins 73% → 54%, incumbent 12% → 28%. |
| h20 | Robustness of patterns | refuted | No pattern flips under any setting change; several pattern checks are too coarse to ever flip. |

## Lessons for the model

1. **A market only changes behaviour if its price enters someone's decision.** Capital, debt and talent markets moved money around but labs never priced their funding conditions, so h01 and h05 had no channel.
2. **Triggers should be belief crossings, not schedules.** Consolidation, sabotage and power constraints fired at fixed times or almost always. They need to depend on beliefs that change during the run.
3. **The belief filter matters, and misspecified world models matter more.** Every actor assumes rivals' safety is 40% of capability. Under that wrong model, more open-minded updating makes beliefs more confidently wrong. This can be a deliberate feature: give each role its own model of the world.
4. **Coordination is rare and fragile here, and it is not the main lever on catastrophe.** Pacts form in about 10% of seeds. What moves catastrophe most: the seed's hidden hazard, takeoff speed (anything that speeds takeoff raises it), and safety spillover.
5. **The frontier lab's lead is sticky.** Only noise, imitation, low demand, theft or consolidation loosen it. Whether that is realistic is an open question; the real race has had persistent leaders with real churn.
6. **Hidden unknowns drive the story.** Hazard alone correlates about 0.6 with catastrophe. That supports seeds with different underlying worlds as a replay mechanism.

## Core fixes needed before round 2

1. Keyed random draws (common random numbers). A small change currently reshuffles 56–64% of seed outcomes, which makes paired comparisons noisy.
2. Pact cheating is counted twice in beliefs (`internalize` and `diplomacy`).
3. The investor window reads the last 60 signals of any kind; any new signal type shrinks it.
4. Pattern checks: replace the saturated ones (P1, P5, P6, I3) with sharper, time-ordered tests.

## Lessons about the cheap-agent method

The egg-drop pattern held: many cheap attempts, a capable judge. Haiku agents often built the claim into the rule (h11, h12, h13, h14, h15), attributed side effects to the wrong cause, or wrote dead code. Auditors corrected verdicts in roughly half the experiments. Without the audit stage, about a quarter of the conclusions would have been wrong.

---

# Core v2 — 15 October 2026

Status: `implemented` and `verified` (300-seed runs, knockouts, an adversarial code review whose confirmed issues were fixed). Not `human_validated`. Round 1 variants run only against core v1 at commit `2950ff2`.

## What changed

1. **Keyed randomness.** Every draw is a hash of (seed, purpose, quarter, actor). After switching one mechanism off, 75–97% of seeds keep the same ending, up from 36–44% in round 1.
2. **Labs price their funding outlook.** Investor sentiment and recent raises now enter strategy scores.
3. **Each role has its own world model** (what it assumes about rivals' safety) **and a motivated-reasoning discount** on its own incidents.
4. **New mechanisms, each switchable:** safety spillover, mandatory disclosure, weight theft, sabotage, consolidation. Government triggers depend on beliefs (falling behind, rival near takeoff, fear rising above its prior), not on fixed quarters.
5. **Two new hidden unknowns:** bloc B's compute efficiency ("more with less") and when demand arrives.
6. **Fixes:** pact cheating counted once, and trust can now rise with observed compliance. Investors read per-lab benchmark history. Demand learning uses public benchmarks from the right quarter. Incident learning accounts for private incidents and exposure. Bankrupt labs are bought only within their bloc, at a price. Distressed labs sell compute before defaulting. Dead labs leave pacts. Planning prices the upkeep of new compute.
7. **Sharper checks** (`metrics.py`): two-sided bands where too much is also unrealistic, and several time-ordered tests.

## Results over 300 seeds

Outcomes: catastrophic takeoff 38%, unipolar 30%, multipolar 20%, catastrophic incident 11%. Winners: frontier 40%, incumbent 35%, state 20%, challenger 3%, safety 1%.

| Check | v1 | v2 | Note |
|---|---|---|---|
| R1 leader persists with churn | pass | pass | |
| R2 revenue catches up | fail | fail | Check design issue: revenue starts near zero, so the ratio always falls. |
| R3 warning shots precede regulation | pass | pass | 84% of new regulation follows a public incident within 4 quarters (base rate 51%). |
| R4 pacts rare and short | fail | pass | Pacts form in 37% of seeds; median life 2 quarters. |
| R5 laggards release open weights | fail | pass | |
| R6 states accelerate before restraint | fail | fail | Bloc B subsidizes from quarter 0. Arguably realistic; left alone. |
| R7 backlash sometimes | pass | pass | |
| R8 boom then bust | pass | fail (borderline) | 71% of seeds, band 15–70%. |
| R9 bloc competition | pass | pass | |
| I1 outcome variety | pass | pass | |
| I2 no inevitable winner | fail | pass | Top role wins 42% of takeoffs (was 76%). |
| I3 hidden unknowns matter | pass | pass | |
| I4 actors react to shocks | fail | fail | **Main open problem.** See below. |
| I5 beliefs diverge | fail | fail (borderline) | 0.14 against a 0.15 floor; role world models are what lift it. |

## Knockouts: which mechanisms earn a place in the minimal set

| Mechanism removed | Effect (paired, > 2 standard errors) | Verdict |
|---|---|---|
| Funding in decisions | Frontier wins 40% → 51%, incumbent 35% → 13%, catastrophe −7 points, takeoff 2.3 quarters later | **Essential.** Capital markets punishing a slowdown is the strongest dynamic in the model. |
| Disclosure | Pacts −0.11 per run, protest damage −1.2, takeoff earlier | Keep. Transparency trades protest damage for coordination. |
| Consolidation | Incidents +1.3, takeoff later, open-weight check flips | Keep. |
| Spillover | Incidents +0.7, disruptions +0.4 | Keep. |
| Role world models | Pacts −0.06; belief divergence check flips | Keep; this is the belief layer you wanted. |
| Motivated reasoning | Pacts +0.05 when removed | Small; optional. |
| Sabotage | Small effects on incidents and timing | Optional. |
| Theft | Takeoff +0.14 quarters, nothing else | **Does not earn its place** at current settings, despite firing in 32% of seeds. |

## Main open problem: actors do not react to shocks

Lab strategy switches are no more frequent after a public incident or an investor crash than at other times (ratio about 1.0). Two causes were measured:

1. Template scores are nearly tied: best and second-best differ by about 0.08, while the softmax temperature is 0.35, so choice is mostly noise. Lowering the noise to 0.05 did not create reactions.
2. The risk term is small next to the lead and profit terms, so a hazard-belief change of a few percent cannot flip a choice.

This matters for the game: if beliefs move but choices do not, a player's three interventions will not propagate either. It is the first thing to address before a decision-leverage study.

---

# Decision leverage map and interpretability breakthrough — 15 October 2026

Status: `verified` (deterministic runs; the null intervention reproduces the untouched core exactly). Not `human_validated`.

## Method fix found along the way

The takeoff catastrophe draw was keyed to the quarter, so any intervention that shifted takeoff by one quarter re-rolled the dice regardless of safety. It now uses one latent draw per seed, so a smaller unsafety gap can only lower catastrophe risk. With the fix, the placebo (+0.01 cash) changes the ending in under 1% of cases.

## Leverage map (`leverage.py`)

200 seeds × 3 player seats (frontier, state, safety) × 15 single interventions × 5 timings (quarters 0, 4, 8, 12, 16).

1. **Single moves are consequential but not steering.** Interventions change the ending in 5–52% of cases (placebo under 1%), yet the best average effect on catastrophe is 3 points. Even choosing the best move with hindsight saves the world in only 5–10% of seed-quarter cells.
2. **For the company, the game is solved: race.** Forcing a race plan is the best company move in most cells for every seat, and raises the seat's score while costing the world 1–2 points. Fundraising is second.
3. **The real dilemma exists only for the leader.** A frontier-lab pause is the one move that helps the world at every timing (+3 points, more when late), at a large company cost (−0.18).
4. **Belief and coordination levers do nothing.** Fear or calm convictions, proposing a pact, and public warnings have near-zero effect. A single actor cannot start a pact.
5. **The best move does not depend on the hidden world** (|r| < 0.12 with true hazard). Learning about the world would not help the player choose.

Implication for the three-intervention game: as the model stands, interventions reshuffle the company's fortunes but barely steer the world, and learning does not pay. Both trace to the open problem: actors do not react to what others do or to new evidence.

## Interpretability breakthrough (`variants/s01_interp_breakthrough.py`)

At a seed-determined quarter between 8 and 24, interpretability starts working. 400 paired seeds.

| Version | Catastrophe change | Other |
|---|---|---|
| Shared: safety research ×2, everyone sees true hazard, pacts verifiable | −8.7 points (se 1.5) | pacts +0.22, takeoff 0.5 quarters later |
| Dual-use: as above, plus capabilities train 25% faster | −6.5 points (se 1.3) | takeoff 0.4 quarters earlier |
| One lab: only the safety lab gets it; others via its publications | 0.0 | no effect; the safety lab rarely leads |

Decomposition of the shared version: productivity −5.2 points; legibility (knowing the true hazard) 0.0 but pacts +0.12; verification −1.3; legibility plus verification −1.8 with pacts +0.21.

Readings (model results, not claims about the world):
1. A breakthrough's value depends on whether it reaches the labs at the frontier.
2. Most of the value is mechanical (safety work gets cheaper), not informational.
3. Knowing the truth about hazard changes beliefs and pact formation but not behaviour that matters for catastrophe, which is the same reaction problem seen in the leverage map.
