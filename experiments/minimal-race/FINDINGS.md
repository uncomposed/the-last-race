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

---

# Round 3: five ways to unseat the frontier lab — 16 October 2026

Status: `verified` (null equivalence, an independent audit of the first version, and held-out reruns after the fixes). Not `human_validated`. The fixed code was not re-audited independently. All quantities are synthetic.

## Question

The frontier lab is hard to dislodge in core v2. Partly that's because almost every shock is bloc-wide (regulation, subsidies, export controls, sentiment), which keeps the order inside a bloc unchanged. Partly it's because a lab can die only through bankruptcy or a merger. Round 3 adds lab-specific shocks and lets actors try to cause them (`variants/u_unseating.py`):

1. **Supply shock.** A leading-edge chip or memory chokepoint fails, either by accident or through a bloc-B blockade. Bloc A loses most new supply for 4–12 quarters. Bloc B runs mostly on domestic older-node chips, so under export controls it is barely exposed. A blockade is always attributed: it brings sanctions on bloc B's capital and raises bloc A's hostility.
2. **Targeted scrutiny.** Public incidents raise scrutiny of the lab that caused them. Investors discount that lab, protesters target it, and a government can impose a lab-specific consent decree unless it is shielding a national champion in a close race.
3. **Seizure.** A public near miss at a capable lab can lead its government to nationalize it or dissolve it.
4. **Governance crisis.** Staff hold their own hazard belief, built from the same evidence as leadership's but without the motivated discount. Racing on a large unsafety gap builds tension until there is an exodus (plus possible whistleblowing) or a board ouster.
5. **Going for the king.** Labs that believe the leader is about to win leak its private incidents, lobby for a decree against it, or poach its staff. If a leak or lobbying campaign is detected, it backfires on the attacker, more so if the attack also failed, and the victim gains a licence to retaliate.

Method: predictions were written in the variant before any run. Fire rates were calibrated on seeds 0–299, looking only at how often each mechanism fires, against judgment-call anchors listed in the variant docstring. Headline results use held-out seeds 1000–1999. With all five switched off, the variant reproduces the core exactly. Scripts: `results/u_analysis.py`, `u_conditional.py`, `u_supply_diag.py`; outputs `results/u_*_heldout.json`. The `results/u_*_v1.json` files are the first version on seeds 0–499, which the audit (`results/audit_u_*`) checked; they predate the fixes below.

## Results (held-out seeds 1000–1999, paired, standard error in brackets)

All five together: frontier-lab wins fall from 43.0% to 36.1% (−6.9 points, se 1.4). The frontier still leads at the end in 38% of runs, down from 47%. Bloc-B wins rise 3.0 points (1.3). Catastrophe falls 4.4 points (0.9). Takeoff comes 1.3 quarters later, and lead changes rise 0.24 per run. No realism or interest check flips. The frontier's share of bloc-A wins falls from 57% to 50%, so most of what it loses goes to other bloc-A labs.

| Mechanism | Alone: frontier wins | Alone: bloc-B wins | Alone: catastrophe | Knockout from all five: frontier wins | How often it hits the frontier |
|---|---|---|---|---|---|
| Supply shock | −0.5 (0.5) | +0.5 (0.5) | −0.3 (0.3) | −0.4 (0.5) | a shock in 26% of runs |
| Targeted scrutiny | **−4.6 (1.2)** | **+3.2 (1.1)** | **−2.1 (0.7)** | **+5.0 (1.2)** | a decree in 25% of runs |
| Seizure | −0.4 (0.4) | +0.2 (0.3) | +0.2 (0.3) | −0.2 (0.4) | seized in 2.8% of runs |
| Governance | +0.3 (0.9) | −1.7 (0.8) | −0.8 (0.5) | +0.5 (0.8) | a crisis in 46% of runs |
| Going for the king | −1.7 (0.8) | −0.1 (0.7) | −0.1 (0.5) | +1.8 (0.9) | a successful attack in 28% of runs |

Knockout signs are reversed (removing scrutiny gives frontier wins back). Removing scrutiny also raises catastrophe 2.7 points (0.8). Removing governance raises it 1.4 (0.6), and removing the supply shock raises it 1.0 (0.4); both slow takeoff.

In runs where a mechanism actually hit the frontier, frontier wins changed by these amounts (alone; these groups are chosen after the fact, so they describe rather than prove a cause):

- Seizure: −32 points (n = 28).
- A decree: −16 points, with bloc B +9.5 and catastrophe −7.5.
- A successful attack: −5.3 points.
- A governance crisis: −2.4 points (not significant).

Supply diagnostic (`u_supply_diag.py`): a forced deep shock at quarter 4 raises bloc-B wins 5.4 points (1.3) and leaves frontier wins unchanged (+0.5). Add 5%-per-quarter depreciation of installed compute, about a five-year chip life, and it becomes −11.2 frontier / +15.5 bloc B.

## Predictions

| Prediction | Verdict |
|---|---|
| P1 supply: bloc B gains; order inside bloc A holds | **Supported for forced early shocks** (+5.4 bloc B, frontier unchanged). Organic shocks barely matter: a blockade fires only when bloc A is already believed near takeoff (that is how the rule is written), and installed compute never wears out. |
| P2 scrutiny: frontier wins fall; national-champion protection blunts it | **Supported, small.** −4.6 held-out; the sign is the same on all three seed blocks (−2.8, −1.6, −4.6). The blunting half is refuted: protection applied to only 33 of 246 frontier decrees in the audit, and removing it barely changes the effect. |
| P3 seizure: rare; nationalization more common than dissolution | Fire rate was calibrated, so that half is no test. **The split is refuted:** the frontier is dissolved more often than nationalized (16 vs 12 held-out; 11 vs 4 on calibration seeds). Inference: near misses come late, when bloc A believes it is comfortably ahead. |
| P4 governance: crises concentrate at the frontier; safety lab gains | **Refuted.** Crises do concentrate there (532 vs 414 at the incumbent), but neither frontier wins nor safety-lab wins move. A first-version effect (−4 points) came from a staff-fear multiplier the audit flagged. |
| P5 king: incumbent attacks most; most attacks undetected; lead changes rise; frontier falls a few points | **Partly.** The incumbent attacks most (31%), partly by construction. 54% go undetected, a share set by parameters. Lead changes +0.06 (3.6 se). Frontier −1.7 (2.2 se). |
| All five: frontier 25–30%; catastrophe flat | **Refuted.** Frontier 36% (the stated falsifier was "above 35%"), and catastrophe fell 4.4 points. |

## What the audit changed

The independent audit (Opus) reproduced every number exactly and found no rule violations. The first version's results did not hold up as well:

1. **Effects shrank about 40–50% on fresh seeds.** All five together went from −9.2 to −5.4. That looks like selection: calibration and reporting used overlapping seeds, and about a hundred deltas were screened (inference). Every headline here now comes from seeds that neither calibration nor the audit touched.
2. **The governance effect came from a construction choice.** Staff fear was leadership's fear times (1 + 2 × motivated discount), which tripled the frontier's tension. It is now a separate, undiscounted belief.
3. **Dissolution copied know-how to every rival** instead of splitting it. Fixed.
4. **Smaller fixes:** a nationalized state lab lost its subsidy rate, a lobbying decree blocked real ones, scrutiny accrued with its mechanism off, and fate bookkeeping was wrong.
5. **"Bloc B is capital-constrained, not chip-constrained" was wrong.** Both bind: +30% capital gives bloc B +6.0 points of wins, and +30% chip access gives +3.4.

## Lessons for the model

1. **Lab-specific accountability is what unseats the leader.** It hits the frontier where it is exposed (its own incidents), and it is the only mechanism whose knockout clearly matters. Bloc-wide shocks keep the order inside a bloc.
2. **Punishing the frontier lowers catastrophe mainly by delaying takeoff,** not by making the winner safer. The frontier's losses go mostly to other bloc-A labs, with bloc B gaining about 3 points.
3. **Installed compute is a moat because it never depreciates.** A chokepoint failure only slows growth. Adding depreciation to the core is the most realistic fix this round points to; it would make supply shocks matter (−11 frontier, +15 bloc B when early).
4. **Seizure is decisive but rare.** It is a tail event, so averages hide it. The game should show it as a possible ending path rather than expect it to show up in averages.
5. **Rival attacks and feuds are small.** Turnabout keeps escalation in check: attacks succeed 26% of the time and about half are detected.
6. **Known simplifications:** at most one supply shock per run; during a shock, labs keep the cash for chips they can't buy; the leader-targeting and fire rates are set by rule, not derived.

## Lessons about the method

Calibrate on one block of seeds, report on another, and treat any delta below about 3 standard errors as provisional. A single seed block plus a 2-standard-error screen across many metrics overstated effects by about half.

---

# Core v3: installed compute depreciates — 16 October 2026

Status: `verified` (null check on 1,300 seeds, 300-seed knockouts, held-out reruns). Not `human_validated`. This change has not had an independent audit. All quantities are synthetic.

## What changed

1. **Installed compute wears out:** 5% per quarter (`cfg["depreciation"]`), about a five-year chip life. The switch is `cfg["mech"]["depreciation"]`, on by default, so `knockouts.py` now tests it.
2. **Worn-out compute is retired at the start of accounting, before upkeep.** A lab stops paying upkeep on retired chips. Distressed sales, bankruptcy prices and acquisitions all see only what is still installed. Compute on order does not wear out until it arrives.
3. **Labs plan with it** (`score_template`):
   - Today's compute counts at its average remaining share over the 4-quarter horizon.
   - New orders count at their average share over the quarters they are usable.
   - Upkeep is priced on the shrinking stock.
   - The bonus for compute that outlasts the horizon is scaled by what is left at the end.
4. **Null check** (`results/v3_null_check.py`): with the switch off, all 1,300 seeds (0–299 and 1000–1999) match core v2 at commit `3f1add9` exactly, including every quarterly snapshot, every event and the outcome.
5. **The defaults were not retuned.** There are two reasons:
   - Chip supply binds in only about 4% of quarters, because labs are short of cash, not chips. So the natural knob (more supply to replace worn-out chips) does nothing.
   - Retuning any shared parameter would break the null check.

   Instead, a diagnostic **timing-matched** arm raises training productivity (`train_k` 0.55 → 0.64) in the depreciation arm only. It was calibrated on seeds 0–299 so that mean takeoff matches v2 (17.5 against 17.7 quarters). It separates "the world got slower" from "compute wears out".
6. **`results/u_supply_diag.py` now switches core depreciation off**, because it applies its own. It still reproduces round 3's held-out output exactly.

The v2 numbers below come from rerunning v2 now (switch off). They do not come from the core v2 table above, which predates the takeoff-draw fix. Winners are identical either way; outcome kinds differ slightly.

## Results (held-out seeds 1000–1999, paired, v3 minus v2, standard error in brackets)

| | v3 as shipped | Timing-matched |
|---|---|---|
| Takeoff | **+3.0 quarters later** (0.12) | −0.1 (0.11) |
| Frontier wins (v2: 43.0%) | 45.6%, +2.6 (1.8) | **49.1%, +6.1 (1.7)** |
| Incumbent wins (v2: 31.1%) | 25.4% | 21.5% |
| Bloc-B wins (v2: 24.9%) | 26.7%, +1.8 (1.5) | 27.9%, +3.0 (1.5) |
| Catastrophe (v2: 50.3%) | 48.2%, −2.1 (1.0) | 53.0%, +2.7 (0.9) |
| Bankruptcies per run (v2: about 0.9) | **−0.69** (0.02) | **−0.69** (0.02) |
| Lead changes per run | 0.0 (0.04) | −0.11 (0.04) |
| Same ending and winner as v2 | 43% | 46% |

The calibration seeds agree: timing-matched frontier wins rose +6.4 on seeds 0–299 and +6.1 held-out, so the effect did not shrink on fresh seeds.

**Checks.** On held-out seeds, v2 passes 6 of 9 realism checks and 3 of 5 interest checks.

1. v3 as shipped passes 5 and 3. R5 (laggards release open weights) fails because open weights now appear in 95.2% of seeds, just over the 95% ceiling: runs are 3 quarters longer, so more labs fall far enough behind to release.
2. On seeds 0–299, R7 (backlash sometimes) also failed by a hair (60.3% against a 60% ceiling). It passes held-out (55%).
3. Timing-matched: no check flips.
4. The checks that already failed still fail. R8 (boom then bust) moves further out of band, from 73% to 86% of seeds. I4 (actors react to shocks) stays at about 1.0, so depreciation does not touch the main open problem.

## Why: v2 had an upkeep trap

In v2, compute never wears out. A lab pays upkeep on everything it ever bought and can shed it only through a distressed sale. With depreciation, upkeep shrinks along with the stock. Counts on seeds 0–299 (calibration seeds, so descriptive):

| | v2 | v3 |
|---|---|---|
| Frontier lab bankrupt | 55 of 300 runs | 11 |
| Incumbent buys the bankrupt frontier | 52 | 11 |
| Incumbent buys any lab, then wins | 67 | 20 |
| Lab-quarters in distressed selling | 2,784 | 1,111 |

So a sizeable part of the incumbent's v2 wins came from outlasting the frontier and buying its compute. That is where v3's frontier gain and incumbent loss come from. Inference: v2's cash crunch was mostly this trap, not racing being unaffordable.

## Knockouts (seeds 0–299, `results/v3_knockouts.json`)

Every v2 verdict holds.

1. **Funding in decisions** is still essential, and stronger. Removing it moves state wins from 21% to 39% (v2: 20 → 28) and incumbent wins from 30% to 8%.
2. **Theft** is still small. Removing it now makes takeoff 0.3 quarters later and adds a few pacts. It still does not earn its place on outcomes.
3. **Check flips are not informative this time.** R7 sits right at its band edge in the v3 baseline on these seeds, so any knockout that lowers disruption (funding, disclosure, sabotage) flips it back. Motivated reasoning flips R5 the same way. In v2, consolidation flipped R5 and disclosure and sabotage flipped R8; none of them do now.
4. **Depreciation's own knockout is v2:** takeoff 3.0 quarters earlier, bankruptcies +0.78 per run, frontier wins 43% → 40%, incumbent 30% → 35%. R5 and R7 flip back to pass. 71% of seeds keep the same ending.

## Supply shocks revisited (`results/v3_supply.py`, held-out)

1. **A forced deep shock at quarter 4** (as in round 3): frontier −11.7 (1.6), bloc B +16.0 (1.5), takeoff 2.8 quarters later. Round 3 with depreciation bolted on (labs not planning for it) gave −11.2 and +15.5. Planning for depreciation barely changes this.
2. **The organic supply shock** (natural chokepoint failures plus blockades; it fires in 33% of runs): frontier −1.4 (0.6), bloc B +1.6 (0.6). On v2 it was −0.5 (0.5) and +0.5 (0.5). That is about three times larger, but still small and under 3 standard errors, so it is provisional. It stays small because organic shocks come late: a blockade fires only when bloc A is believed near takeoff.

**Correction to round 3's lesson 3.** Depreciation does make an early supply shock matter. On its own, though, it strengthens the frontier instead of eroding a moat. The frontier's v2 weakness was not a permanent compute moat for others; it was an upkeep trap that killed the frontier in about one run in five.

## What this does not show

1. **Nothing is calibrated to the real world.** 5% per quarter is a round number for a roughly five-year accounting life. Real chips can stay useful longer, or become uneconomic sooner when a new generation arrives. The model has wear, not obsolescence.
2. **Labs cannot retire compute by choice,** buy used compute, or sell it except under distress. Depreciation therefore works partly as free downsizing, which is one reason bankruptcies fall. A model with voluntary retirement might show a smaller effect.
3. **The bankruptcy explanation is descriptive** (counts on calibration seeds), not a separate controlled test.
4. **Several effects are under 3 standard errors and are provisional:** untuned frontier +2.6, every bloc-B change except the forced shock, the organic supply shock, and timing-matched catastrophe +2.7.
5. **The timing-matched arm uses one knob** (`train_k`). Another knob could match timing with different side effects.
6. **Earlier variant results were run against core v2** (round 1 against v1). Rerunning them on v3 gives different numbers; to reproduce them, switch depreciation off.
7. **No independent audit** of this change.

## Files

- `core.py`: v3, with the switch and the rate in the config.
- `results/v3_null_check.py`: compares against core v2 loaded from git.
- `results/v3_depreciation.py`: outputs `v3_depreciation_calib.json` (seeds 0–299), `v3_depreciation_heldout.json` and `v3_depreciation_timing_matched_heldout.json`.
- `results/v3_knockouts.json`: from `python3 knockouts.py --seeds 300`.
- `results/v3_supply.py`: outputs `v3_supply_heldout.json`.
- `results/u_supply_diag.py`: one added line, which pins core depreciation off.
