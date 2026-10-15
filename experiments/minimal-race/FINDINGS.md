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
