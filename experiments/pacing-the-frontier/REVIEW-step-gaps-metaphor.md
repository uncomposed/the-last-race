# Review: the step-gap work, the metaphor, and what the project is for

[[ai gen]] 2026-10-30, fresh-eyes review of `HANDOFF-step-gaps-metaphor.md`, the memories, the nine backtest reports on branch `claude/gap-crossing-backtesting-340d58`, and the step-gap code (commit `b9542fd`). I ran no simulations. One subagent checked the reports' code claims against `prototype.html`; its findings are in section 7. Status of everything here: opinion and inference, marked as such.

## 1. The short version

1. The project has two goals it states and one it does not. The stated ones: teach intuition for racing dynamics and optimal stopping (README, spec), and make each daily teach a sourced lesson about the AI race (memory `daily-lessons-from-seeds`). The unstated one, which every design choice leans on: make the player **feel the race dilemma**. Going slow alone loses the race. Everyone going fast risks everyone. That is the thesis of the shared extinction roll, and it is the only mechanism in the game that says it.
2. Three days and roughly 1.3 million bot races went into the platformer economy (height, speed, box shapes, strikes). None went into whether the dilemma is felt. There is still no record of a human playtest of step gaps anywhere in the reports. By your own status ladder, nothing is past `verified`.
3. Near-zero falls are not a generator bug. They are the logical consequence of three rules held at once: every box is crossable by construction, bots have perfect hands, and "falls come from being forced, not misjudgement". Those three together guarantee no falls. One has to go, and your newest idea (opaque boxes) quietly repeals the third. I think that is the right one to repeal, and the handoff is right to flag it.
4. The metaphor paragraph describes what a box **is**, not what the player **decides**. A mechanism is a decision under a tradeoff. The missing ingredient is not box shape. It is uncertainty about the box plus a reason to go first. Both are cheap to add, and one of them reuses code that already exists (the sight shadow).
5. The experiments were rigorous about the wrong question. The held-out seed discipline, paired deltas and audits all worked. They measured which of twelve hand-written bots wins, under a rule set that cannot produce the thing you care about. Rigor on the wrong question is what "banal" felt like.

## 2. Goals, explicit and implicit, and how we are doing

| # | Goal | Where it is stated | Status (my reading) |
|---|---|---|---|
| 1 | Intuition for racing dynamics and optimal stopping | README, spec | `implemented`. Never measured on a person. Bots do not have intuition. |
| 2 | Each daily teaches a sourced lesson matching its briefing | memory, PR 11 | Shipped. "Lesson coverage" is measured as a bot strategy beating a foil by 3 SE. That shows the seed rewards the strategy; it does not show a player learns anything. |
| 3 | Different maps reward different strategies | DESIGN-NOTES item 7, memory `design-rules-are-opinions` | Partly `verified` by bots. The class-share flip with long boxes reproduces. The per-seed "diversity" signal sits at the noise floor in every report that measured it. |
| 4 | Falls and extinction happen, and mean something | your dictate 5, spec | Oscillating. v1 35 percent, v2 1.2, v3 13.6, step gaps 0.1, sweep back to 5. Each time it was chased with a knob (`dropH`, `gapScale`, `NOWARN`), never produced by a mechanism the player can reason about. |
| 5 | The player feels the dilemma: go first and risk, or wait and let a rival pay | unstated, but it is why the roll is shared | Not addressed by any step-gap report. The open question "does leading stay worth it?" from 27 October is still open. |
| 6 | Honesty about what the work shows | CLAUDE.md, every report | Strong. Every report states its limits. The audit's line "better for the game is not shown by bots" is the most important sentence in the folder. |
| 7 | Spend your attention sparingly | CLAUDE.md | Poor. Nine reports, 1,087 lines, 479 MB of raw data, for a conclusion you could have reached from one hand track and one phone playtest. |

Inference, not fact: goal 5 is the one you mean when you say "serves the metaphor". The others are either done or are measurement stand-ins for it.

## 3. The dictates, taken skeptically

Numbered as in the handoff's section 1.

1. **Metaphor first, mechanism second, data last.** Agree with the order. Disagree that the metaphor is ready. Your paragraph lists box shapes (tall-thin, tall-wide, too wide, impossible). Shapes are content. The mechanism needs a decision. I would state it as: *I can see the near face but not the far edge. I can go now at the height I have, stop and build until I can see over while rivals pass and maybe blind me, or wait for a rival to go first and learn from their body.* Those are the three postures of the real race: race, pause, follow. The bots already exist for all three (Sprinter, Steward, follower). The box does not create the decision today because the answer is printed on screen.
2. **Much less data, much faster tests.** Agree, and I would go further. The cheapest high-information test available has never been run: you play five hand-written segments on your phone and say which one felt like a decision. That is the only test that can move anything to `human_validated`, and it costs an evening. Your 2026-09-24 retrospective says this already.
3. **Challenge the rules.** Done below, section 4.
4. **Do not protect the campaign or the daily.** Agree. One cost to name, not to protect: the campaign is live, ghosts and replays hash the sim, and the leaderboard plan depends on that hash. Step mode is already a separate switch. Keep it that way until a mechanism is human-validated, then rework the campaign on purpose rather than by drift.
5. **Falls must happen.** Agree with the symptom. I would not set a fall *rate* as the target, because that is how the last three rounds went wrong. The target is: after a fall, the player can say why, and what they would do differently. Forced falls ("a crawler blinded me") give no story. Falls from a wrong guess about a hidden width ("I thought it was narrow") give exactly the story the metaphor wants.

On **"hang the generator"**: the generator is about a hundred lines, and the part that guarantees crossability is two of them (`stepFit` and the `riseOf` cap; the daily's infeasible filter lives in the test harness, not the game). You do not need to throw it out. You need to remove the guarantee and add what is missing. Removing the guarantee alone, without hidden width, gives only forced falls: a bot that knows a box is impossible stops, leaves a barrier, and traps the lab behind. The scenario lab already saw that trap (50 to 63 percent extinction, crawl the only winner). So the structural problem is in the rules, and the generator obeys them.

## 4. The rules in the memory, challenged

From `step-gap-design-rules`, each with a metaphor reading, because rules without one are the ones to doubt.

1. **No walls; too low means enter through the side and sink.** Physics rule, no metaphor reading given. What does sinking across a box mean? Deploying a capability you half understand and losing control slowly? If nobody can say, it is tuning, not design. Keep it for now, since it works, but it should not block a cleaner rule.
2. **Scrapes cost a strike.** Keep. The scenario lab showed it is load-bearing, and the metaphor reading is good (a near miss with civilisational stakes).
3. **Falls from being forced, not misjudgement; the bar makes choices certain.** Repeal. This rule, plus "every box is crossable", is why nobody falls. It also contradicts the metaphor sentence "we simply do not know". Your opaque-box idea already repeals it. Say so explicitly so the next session does not try to keep both.
4. **Every box is crossable** (implicit; it lives in the code, not in the memory). This is the rule that did the most damage, and it was never written down as a rule. Replace with: every box is crossable *by some posture*, and the player may not know which until they commit.
5. **Barriers come from a stopped lab, as tall as that lab.** Keep as one kind. Your newer two-kind barrier idea (slip-ups and research breakthroughs) overloads height. Spec says height is controls and safety, max speed is capability. A research breakthrough is capability. If a rare big barrier is crossed by height, the metaphor says safety work unlocks capability, which is backwards. Either the research barrier is passed by *speed* (scale) or crossing it *grants* speed. Pick one before building it.
6. **Boxes needing near-max height are rare.** Moot while height is free, as the reports say. Becomes live only after the economy or the segment idea makes height scarce for someone.
7. **At most 3 stop-and-reverse per map.** The data says it holds at p75 and fails at the tail. Fine as a tuning target. Not a metaphor rule.
8. **Occlusion by crawling is intended.** Keep. It is the anti-free-rider move (secrecy), and it becomes much more interesting once following a rival is a real posture (section 5).
9. **Some boxes may be scrape-only.** Keep. Under hidden width it stops being a special case.

Two memory-level problems:

- `daily-lessons-from-seeds` says never a hand-made map; `design-rules-are-opinions` says start with hand-written tracks. They are not contradictory (ship versus test), but a fresh session could conflate them. The first also says the generator must vary enough for every lesson; if the generator is rewritten, the whole lesson-search pipeline (3 SE filter, held-out noise) is void and should not be protected either.
- The metaphor in the handoff's section 2 is "Cole's words, tidied", and the memory's version is another tidying. Two layers of tidying by two agents drift. I would ask you to dictate the thesis as one paragraph, put it verbatim at the top of the spec, and never let an agent tidy it.

## 5. What is missing: uncertainty and a reason to go first

### 5a. Opaque boxes, done with code that exists

The sim already has a line-of-sight rule for labs: a lab ahead casts a shadow, and a taller lab sees past it only from where its line of sight over the other's head meets the ground. Apply the same rule to a box. A box of rise *r* at distance *d* hides its own far edge from a lab of height *h* unless the lab's sight line over the box top reaches the ground before the far edge. That happens when the width is at least *d · r / (h − r)*, and never when *h ≤ r*. (Inference from the spec's description of the shadow; I have not checked the shadow code's exact geometry.)

What this buys, with no new concepts:

- Height becomes information as well as margin. That is exactly "sight and height are your controls and safety".
- The reveal distance shrinks as you approach. The decision is whether you will see the far edge before you pass your braking point. Sight, height, speed and width meet in one geometric fact the player can learn to feel.
- The "your jump now" bar can say "clean / scrape / fall" once the far edge is in view, and "at least N wide, unknown beyond" before that. It never has to lie.
- A rival's crossing or fall reveals the far edge to everyone. Waiting becomes a real posture (5b).

### 5b. A reason to go first, and a reason not to

Today crossing first raises the frontier's ceilings and gives rivals 40 percent of that. Labs far behind the frontier invest up to three times faster. Nothing raises anyone's research speed for crossing (section 7, item 5). Both are diffusion mechanics: the sim rewards being behind. Your metaphor wants the leader's gamble to pay in capability. Both forces exist in the real race (distillation and open weights help followers; compute compounding helps leaders), and which dominates is the actual empirical question of AI race dynamics. The game could make that the seed's hidden variable, but that is a later idea.

Cheaper now: make going first pay in *information advantage and time*, which it already does in principle, and make waiting pay in *safety*. With opaque boxes, the free-rider posture (wait for a rival to size the box with their body) is attractive, the crawl-occlusion posture is its counter, and the shared roll means the free-rider still pays if the rival falls. That is the dilemma in one segment, with no new economy.

### 5c. Your segment idea

Barrier height before a box sets whether labs arrive mediocre or maxed. The economy lab says this is true for fast labs (0.96 of ceiling with barriers, 0.62 without) and not for the rest, whose own split fills the meter anyway. So the lever moves one class. That is enough for the gamble segment to exist: fast labs arrive low and must gamble, builders arrive high. Worth one test, but measure the right thing. Not "which probe wins the track", which is dominated by the three easy boxes and the singularity. Measure arrival height over ceiling and the outcome, per probe class, per segment. One table, rows are classes, columns are the two segment types.

## 6. The experiments, taken skeptically

1. **"Fast-low does not exist in the sim" is partly circular.** No probe plays fast-low (the scenario lab says so in its own limits). A conclusion about a posture nobody tried is a conclusion about the probe set.
2. **The hand tracks dilute their own feature.** Base track: four boxes at rise 0.55 and width 0.8 of the fit, all easy by construction, with one feature box. The winner is decided by the easy boxes and the singularity. A sharper test is one segment, one box, three postures.
3. **The diversity signal is noise, and every report says so.** Effective count about 10 at 2 draws, split-half agreement 50 percent against 29 percent by chance. Then the next report runs 169,000 races on the same metric. Reproducing a bot-versus-bot result on fresh seeds proves the simulator is deterministic, not that the game is better.
4. **The campaign was the hidden objective function.** Every lab ends by checking whether its recommendation breaks the nine lessons, and change 4 plus long boxes breaks seven. You had said you do not care about the campaign, and the labs still optimised for it. That is where much of the "small tweaks to the same knobs" came from.
5. **The audit is the best document in the folder.** It separated "the timing fix makes boxes clearable" (verified) from "it is better for the game" (not shown), and it found the bar was silently assuming a bad press point. Adopt the timing fix. It is a bug fix, not a design change, and it is not why nobody falls. The reason is section 3, item 3.
6. **The process memories were followed and were not enough.** `sim-effects-need-heldout-seeds` and `cheap-agent-fanout-needs-judge` are measurement rules. They worked. What they lack is a gate before measurement: can bots answer this question at all? For "is the dilemma felt", the answer is no, and no held-out block fixes that.

## 7. Code claims, checked

A subagent read `prototype.html` at `ffe5f0f` (branch `340d58`) and quoted the lines. Summary, with what it changes.

1. **Investment rate is `1 − v/top`, confirmed.** Also: a lab 250 or more units behind the frontier invests up to 3 times faster (`M`, `K.refill`). Being behind is rewarded in the code, not just in the v1 notes.
2. **"Stopping builds speed, not height" is wrong.** The rate scales all three meters equally. A stopped lab invests at the full rate in whatever split it holds, and a bot stopped before a box uses 15/85/0 (sight/height/speed). The handoff's section 4, item 5, carries this misstatement from the scenario report. The true kernel is only that any investment needs speed below top.
3. **Spill, partly as described.** Labs in view that are shorter than the barrier gain up to a third of its height. The crasher itself gains only when it clears a barrier it had crashed into before. Defaults are spill 33, barrier scale 140.
4. **Every box is crossable by construction, confirmed.** Width is capped at the clean width for a lab at the level's ceiling, times `stepFit` (103 percent). Rise is capped at 0.975 of the ceiling or ceiling plus half a jump. There is **no** infeasible-seed filter in the game; where one exists it is in the test harness. The handoff's "the daily also rejects seeds" refers to the harness, not shipped code.
5. **There is no research boost.** Nothing raises the invest rate or `K.invest` when a lab crosses anything. What crossing first gives: the lab's caps on all three meters rise to the next level, and every rival's caps rise by 40 percent of that step. Later crossers get the full new cap too. A scrape in step mode still levels the scraper up while costing a strike. So the metaphor sentence "pays off in capability" is half true: caps rise, research speed does not, and rivals get 40 percent for free. This is the diffusion-beats-compounding point in 5b, now confirmed in code.
6. **Jump arc confirmed.** The arc is flat from 15 to 85 percent of its duration. The bar and the bot press assume the peak is at the face (a literal 0.5, not a named constant). Jump height is a flat 34 and does not depend on the height stat or on speed; speed sets duration and reach.
7. **Sight is a range only.** The moment a box's near edge is in range, bots know its rise and width exactly (up to their skill noise). Boxes cast no shadow. Shadows come only from labs, with eye height equal to the lab's height plus its body. So 5a is a new rule, but it is the existing lab-shadow rule with a box as the occluder.
8. **Probes.** Ten probes, none with a low height share at high pace. The nearest is rush (pace 0.93, 62 percent speed, 35 percent height). None sets the side-entry flag. The "fast-low does not exist" conclusion is about the probe set.

## 8. What I would do next, in order

1. **You dictate the thesis.** One paragraph: what the player decides at a box, and what going first and waiting each cost. It goes verbatim at the top of the spec. Twenty minutes.
2. **One hand-written segment, three postures, one table.** Hidden width via the box shadow (5a). Bots: rush, build-until-you-can-see-over, wait-for-a-rival. Twenty draws. Columns: who crossed, who fell, who won, extinction. Half a day. What would show it wrong: if the three postures produce the same outcome, hidden width is not the lever. *Done the same day: see `check/hidden-width/HIDDEN-WIDTH.md`. The postures come apart, the rusher is always blind at commit, waiting beats building, and nobody finishes a box past 1.86 times the fit.*
3. **You play it on your phone.** Five segments, five minutes each. You say which felt like a decision. This is the first `human_validated` data point in the project.
4. **Adopt the timing fix** (`BOXU` 0.25 for bots and the bar, with a press-point marker on the bar). Separate small change.
5. **Only then** touch the generator: drop the crossability guarantee, keep the shapes, add the segment lever from 5c.
6. **Do not** run another sweep until step 3 has happened.

## 9. What this review does not show

- I ran nothing. Section 5a's geometry is inferred from the spec's shadow description; the subagent confirmed the shadow rule exists for labs (eye at height plus body) but I did not check its exact arithmetic.
- "The dilemma is not felt" is an inference from the absence of any human record, not a measurement.
- I did not read `tuning.md`, `boxes.md`, `daily.md` or `campaign.md` in full, only their headers and the audit's reproduction of their claims.
