# Proposal: a hand-built campaign, "The Last Race"

[[ai gen]] Written by Claude, 2026-11-04, at Cole's request: review the box and lesson work of the past week and propose a full hand-built campaign to play locally. Status: a proposal. Opinion and inference are marked. Every number comes from a file named next to it or from the experiment in section 6. Nothing here is `human_validated`.

Read with: `check/hidden-width/HIDDEN-WIDTH.md`, `check/segments/SEGMENTS.md`, `check/lessons/ROUND2.md`, `check/segmath/SEGMENT-MATH.md` and `check/lessons/campaign/` (all on branch `claude/segment-math`), and the frontier-router note in `ai-pacing` (branch `claude/ai-capability-frontier-ni9scf`, `research_notes/frontier-router/README.md`).

## 1. The short version

1. **The week worked, and the judge is the reason we know it.** Hidden width is the first mechanism you validated by playing ("almost precisely what I was hoping for"). The segment math explains in one table why nine of ten round 2 maps failed. Measure Twice is the first map designed from equations, and it passes the judge. Warning Signs passes too.
2. **The judge is measuring the right thing for a single map and the wrong thing for a campaign.** It asks "is the lesson the *only* way to win this map?" A campaign teaches by contrast: what won the last three maps kills you on this one. That needs a second test, at the level of an act: no single habit coasts through it, and one reading rule a person can follow beats every habit (section 4). It measures what a player actually carries forward: a habit, and when to drop it.
3. **The failures are content.** Max-out and its cousins ("fill, then floor it") beat or tied almost every lesson map. That is not noise. It is the honest truth of a world where every risk fits under the ceiling: scaling is safety. The campaign should teach that first, on purpose, and then break it. The adversaries' winning strategies (fill then floor it, stay ahead and tall so the rival can't see, free-ride, prepare blind for the worst) are each a real-world posture. They belong on maps, as lessons.
4. **The four regimes from the segment math are the story.** Regime 1: slack, scale wins. Regime 2: buy what the risk needs. Regime 3: looking wins. Regime 4: the race won't let you be safe. That is the arc of the AI race as the research tells it, in order. The fifth act is the one the game cannot reach today: when no player can be safe, change the race. That is where `ai-pacing` lives (the public-frontier reference, the leapfrog ratchet), and the router note gives a mechanic for it that fits the game exactly.
5. **Build it on the lesson harness, not on `prototype.html`.** The harness already has boxes, hidden width, peek, the new spill rule, hand-built maps and Next. The main game carries the daily, the leaderboard hash and ghosts, and every sim change there costs a re-vendor. Port to main once the campaign has been played.
6. **The missing piece is a reference reader, not more maps.** The win matrix (section 6) shows the campaign shape already exists in bot play. Fill-first habits win 93% of the proposed Act I and 29% of Act III. In Act IV nothing wins more than 48%. What is missing is one reading strategy a person can follow on every map, in one sentence, that wins Acts II and III. `cpRead` is the candidate: never run faster than you can stop within what you can see, and stop once you have seen more box than you can clear. Today it is the best single strategy only on the campaign maps it was written for. Make it the lesson strategy for every Teach and Exam map, and design the maps around it.
7. **Pick one jump mode and judge in it.** With auto-jump on (the page default), the lesson strategy is the best strategy on only 6 of 17 lesson maps. Spend It Once's lesson strategy wins 100% jumping by hand (`judged/final.md`) and 0% with auto-jump, and three small-risks lessons fall to 7.5 to 15%. A map works in one mode. I recommend auto-jump, since that is what a new player has.
8. **First playable is small.** Enough maps for Acts I to IV exist today. A campaign shell (act list, a question card, a debrief card with the variant reveal, progress) is the only new code. That is one session's work, and it gets you playing.

## 2. Review: what the boxes and lessons work established

### What holds up

1. **Hidden width is the right core mechanic.** It turned a box from a jump puzzle into a decision under uncertainty, with no new concepts: the far edge appears as your eye clears the top, so sight, height, speed and width meet in one geometric fact. Your own play found the pack dynamic without being told: tailgating into the unknown is how a pack dives together. The jump peek (a peek shows a face, never a width) is a good metaphor in its own right: an evaluation that tells you a hazard exists but not its size.
2. **The designer, adversary, judge split.** Round 1 designers checked their maps against foils they chose themselves; you found max-out in an evening. Round 2's held-out judge caught a designer's +25 that was a tie on fresh seeds. This is the most valuable process in the folder. Keep it.
3. **The segment math.** It replaced searching with a reason. "Information only has value when what you learn changes what you should do" is now an equation: looking pays only when the race's slack lands between the narrow variant's need and the wide one's. Measure Twice then showed the equations can design a map, once four missing terms (jump mode, back-up, the ledger, shadows) were added.
4. **Honesty.** Every report says what it does not show. Keep it in the campaign's own text (section 7).

### What I would change

1. **Uniqueness per map is too strict a bar for a campaign.** Round 2 ended with 0 of 10 maps passing, then 1 of 3 in the campaign round. Some lessons are inherently "this is the best of several reasonable plays", and some are "the play that has worked so far is now wrong". Neither passes a uniqueness test, and both teach. Section 4 gives each map a role and a test that fits the role.
2. **The adversary's output is treated as a defeat. It is a lesson mine.** Footsteps "failed" because the adversary found that staying just ahead and taller hides the box from the Racer, so the Racer never floors it. That is strategic opacity, a real dynamic (lesson A6 territory, and the secrecy half of the openness debate). It should be a map whose lesson it is. Likewise fill-then-floor (the scaling era), prepare-blind-for-the-worst (regime 2), and free-riding (the fast follower).
3. **Height and speed are near-perfect substitutes at a box** (SEGMENT-MATH, consequence 1). Read through the metaphor, that says a more capable lab crosses a capability jump as safely as a more careful one. That undercuts the tension the game exists for. It is also part of why max-out wins: whatever you buy, it helps at the box. The fix is to give the two different jobs at the landing: an **overshoot box** with a barrier or a second box just past the landing, so arriving fast and low is a crash. In the story: capability that outruns control. ROUND2 already proposed it as idea 1; it should be a box species, not a one-off.
4. **Two terms are overpowered, and the math says by how much.** Waiting behind a crosser is six to eight times as strong as building (narrowing). A lab 500 behind pays a third as much per point (refill). Both are real-world forces (diffusion, cheap catch-up), so they should stay, but as *chapter variables*, not constants. Act IV turns them up, Act V asks who sets them.
5. **Retries are variant shopping.** A player who retries a map until a lucky variant lets them through has done exactly what the router note's section 4 describes (27 private variants; keep the best). The campaign should neither forbid retries nor hide them. It should show the player their own record (section 5, the tally).
6. **The harness doesn't look like a campaign yet.** I rebuilt the lesson page and loaded Measure Twice in a headless browser. The lesson header sits above the game like a test page. The first card is still the main game's: "Race three rival labs to the finish", with Daily, Campaign and "Achievements 0 / 12", none of which belong to these maps. The committed `lessons.html` is also stale: it lacks the campaign and Measure Twice maps and runs the old spill rule, so rebuild it before playing.
7. **Warning Signs asks you to remember evidence the screen forgets.** Its lesson is that barrier heights predict box widths. In play, a barrier scrolls off and nothing keeps it. A lab would keep a ledger. Marking each barrier's height and each seen box's width on the minimap shows what the lab already knows, so it carries no hidden answer, and it makes the pattern (and later, the pattern breaking) visible.
8. **The thesis is still not dictated.** The step-gaps review asked you for one paragraph, verbatim at the top of the spec. Section 9 gives a draft only so you have something to strike through; the words should be yours.

## 3. The arc: five acts, one regime each

Each act has one sentence the player should be able to say at the end of it, a regime target from the segment math, and a set of maps. Maps marked **exists** are on `claude/segment-math` today; **retune** means it exists but needs work; **new** means it does not exist.

### Act I. Scale Is Enough (regime 1, then 2)

*"Build while you run, fill up, floor it. The ceiling keeps you safe."*

The honest early era. Every box fits under the ceiling, so a full lab clears it. The player learns the controls and forms the habit that later acts will break. A fill-first habit is the intended winner, and the judge's test here is the reverse of the usual one: the habit must win.

| Map | Role | Source | What the player sees |
|---|---|---|---|
| The Gate | Feel | the gate from `prototype.html`, as a segment (new, small) | Run moves you; a wall you can't jump makes you stop and Build Height |
| The Unknown Box, narrow variants only | Feel | segment 1 (retune: narrow half only) | The first hidden box. Everyone who is full clears it |
| Clean Record | Teach | segment 8 (exists; fill-first wins 100%, rush 0%) | Every rival is on its last strike and you have none. Fill first and you never need to spend one |
| The Breakthrough Wall | Teach | segment 9 (exists; rush and fill-first win 100%) | A wall that needs height. Clearing it in view lifts the labs behind you |
| The Pack Dives Together | Teach (regime 2) | `see-early-pack` (exists; max-out and fill-first 80%, its own reading lesson 85%) | Prepare for the worst blind; it's cheap enough. Rename it for this act |

Win rates in this section are bot play, auto-jump on, seeds 1001 to 1040 (section 6).

### Act II. The Box You Can't See Into (regime 3)

*"Looking costs time. It's worth it when the answer changes what I'd do."*

The ceiling still covers the widest box, but the race no longer leaves time to fill for it. Only a lab that knows the width is both safe and on time.

| Map | Role | Source | What the player sees |
|---|---|---|---|
| Measure Twice | Teach | `look-pays` (exists, **passes** the judge, +30; matrix: its lesson 100%, next best 60%) | A low box, 55 or 95 wide. Your rival sees further. Slow enough to stop where you learn the answer |
| Warning Signs | Teach | `cp-signs` (exists, **passes** the judge, +18, 10 of 13; on seeds 1001 to 1040 only +5 over fill-first, so watch it) | Tall barriers mean a wide box. The road tells you before the box does |
| Tailgating in Fog | Feel | segment 3 with peek (exists; four strategies tie at 60%) | Behind an equal-height rival you see nothing. Hop to see the face, or get in front |
| The Beacon and the Quiet One | Teach | segment 6 (retune: nothing wins more than 32.5%) | The tall box everyone watches, then the low one that is the real danger |

Act II is the weakest act today. Only Measure Twice is clearly won by looking. This is where design time goes (section 8, M1).

### Act III. The Pattern Breaks (traps)

*"What has worked so far is evidence, not a promise."*

Maps that look like Acts I and II and are not. The test is that the habit loses badly, not that one strategy is unique.

| Map | Role | Source | What the player sees |
|---|---|---|---|
| The Pattern Breaks | Trap | `cp-break` (exists; reader 100%, +45 at default, holds 8 of 13; matrix: max-out 32.5%, fill-first 67.5%) | The last box is sized to the leader's raised ceiling. Followers who trusted the rhythm fall |
| Overshoot | Trap | new: the overshoot box (section 2, change 3) | Max-out arrives fast and low and hits the barrier past the landing |
| Rising Stakes | Feel | segment 7 (retune: extinction 55% is too harsh; fill-first wins 2.5%) | Three boxes, fall odds 5, 25 and 50. The same mistake costs more higher up |
| Look Before You Leap | Exam | `cp-look` (retune: fails, −5) | Mixed variants from Acts I to III. Only reading the road wins across them |

### Act IV. Other People's Dice (regime 4)

*"I can play perfectly and still lose, to someone else's fall or someone else's speed."*

Multipolar. Diffusion is turned up. Here the race will not let you be both safe and on time, and the maps should make that felt rather than solvable.

| Map | Role | Source | What the player sees |
|---|---|---|---|
| Everyone Else Is Rushing | Feel | segment 2 (exists; extinction 48 to 63% whatever you play; with auto-jump nothing wins more than 7.5%) | Three rushers. Their falls roll your dice |
| Who Goes First? | Teach | segment 4 (exists; building wins 62.5%) | Everyone stopped at the box. Rivals lose patience at 6, 12, 20 s |
| The Fast Follower | Teach | segment 10 (retune: one variant today, and fill-first wins 82.5%) | Follow across a narrowing box, or go first and take the ceiling? |
| Footsteps, or Spend It Once | Teach | `close-footsteps` or `close-spend`, relabelled: the adversary's `y-pace` is the lesson (retune; with auto-jump it is best on both, 45% and 55%, but by small margins) | Stay just ahead and taller, and the rival behind never sees the box. Opacity is a weapon |
| The Pack Behind You | Teach | segment 11 (exists; best 62.5%, a reader) | Your tailers stop with you and hide the box from a latecomer. Stopping quietly hides the hazard from whoever comes next |
| The Minefield | Feel | `steward-minefield` (exists; about 6 seeds in 40 nobody can win; its Steward wins 65%) | A careful lab can't just stop; it has to stay near the front |

### Act V. Change the Race (the rules are the lever)

*"When nobody can be safe and win, the question is who writes the rules, and what they reference."*

Each map is played twice, once under the default rules and once under a rule change, and the debrief puts the two results side by side. This is the one act where a map is allowed to set rule knobs, because the rule is the lesson (LESSONS.md forbids it today; section 8, decision 5).

| Map | Rule pair | Source | What the player sees |
|---|---|---|---|
| The Ratchet | the pace line references the best rival, then only outsiders | new: the pace line (below) | With two careful labs referencing each other, the line climbs and boxes arrive at speed. Referencing the outsider holds it |
| Same Track, Different Rules | follower share 40 then 70; or build rate 14 then 10 | an Act II or III map at a rule where the judge grid says it flips (`JUDGE.md`: Pattern Breaks loses at build 10) | Your careful play loses only because care got slower. The rule, not you, decided |
| The Last Gap | default, then the player's chosen rule | segment 12 (singularity: 3x speed, laggy controls) | Preparation happens before the transition. Then: pick the rule you want for the last race |

**The pace line**, a new mechanic and the one I would most like to build. It is `ai-pacing` K4 and K6 as a drawing on the track. A line runs ε ahead of a *reference* lab. A lab past the line is in hostile review: its Build is forced to sight and height (the crash-cap code already does this), and it takes a strike if it stays past it longer than a few seconds. The rule's only setting is who the reference is:

1. **Reference: the best other lab.** You and the Steward both obey it. Each of you may lead the other by ε, so you take turns, and the line climbs at k·ε per cycle. The router note's ratchet result, felt: more cooperators, faster frontier (`ai-pacing` Q17, proposed; 1.0, 3.3, 5.0 and 8.3 Elo a month for 1, 2, 3 and 5 signatories, model on assumed inputs).
2. **Reference: the outsider only.** A slow non-signatory sets the line. Now the pack moves at its pace, the race leaves slack, and Acts II and III's reading pays again.

That is regime 4 turned into regime 3 by a rule, which is the whole thesis of the research in one map pair. Two more router ideas fit without new code: the line is drawn with a blur as wide as the measurement noise, so a lab inside the blur can't be ruled against (you can't police finer than you can see), and the variant-shopping tally (section 5).

**The finale.** The Last Gap, played once under rules the player chooses from those they met in Act V. The end card quotes K2 plainly: the aim is to slow and condition the conversion of capability into irreversible power, not to freeze it. And it says what the game is: a cartoon of that argument, not evidence for it.

## 4. Four map roles, four tests

Each map gets one role. The judge stays; it gets a test per role and one at the level of an act.

| Role | What it is for | Pass test (judge seeds, auto-jump) |
|---|---|---|
| **Teach** | The lesson strategy is how you win | Today's test: beats the best adversary by 15 at default. Rule-set robustness is reported, not required: a break says which rule the lesson leans on, and that is Act V's material |
| **Trap** | The habit from earlier maps loses | The previous act's winning strategy loses by 30 or more to the best strategy, and some strategy a person could find wins at least 60% |
| **Feel** | A dynamic the player should live through, not solve | Not degenerate: no strategy wins 100% without stopping or looking, and fewer than 1 seed in 5 is unwinnable by every strategy. Then a human note |
| **Exam** | Reading which map you are on | The chapter test below, on the act's maps |

**The chapter test** is the new idea, in two parts:

1. **Habit gap.** The best single fixed strategy's mean win rate over the act's maps, against the mean of each map's own best. A large gap means no one habit coasts through the act.
2. **Reader margin.** The reference reader (`cpRead` or its successor) against the best fixed strategy that never reads. The habit gap alone only shows that the maps have different winners. The reader margin shows that one rule a person can follow beats every habit. Pass: +15 in Acts II and III, on judge seeds.

Act I and Act IV run the test the other way round. In Act I, a habit should beat the reader: that is the scaling era. In Act IV, nothing should do well: that is regime 4.

Two process rules carry over unchanged: designers never see the judge's seeds, and every number is reported with the seed block it came from.

## 5. Where intuition is formed: the debrief

Bots showed that maps can reward a posture. Whether a person learns from it is decided after the race, when they can see why. The campaign shell needs four debrief pieces. All four are display only; none changes the sim.

1. **The variant reveal.** "The box was 95 wide. You committed at 140 out, before you could see past 55." Segments already have "After the race: what was this variant?".
2. **Three ghosts.** The same seed, raced headless by Rush, Build and Read, drawn as ghosts over a replay of your run. The sim is deterministic and `exp.mjs` already runs any posture as lab 0, so this is a few headless runs and the ghost drawing that `prototype.html` already has. Contrast on the very race you just ran is the cheapest intuition there is.
3. **Your own ensemble.** Retries redraw the variant (a seed is the map's dice, as on the campaign page). The map card keeps a tally: "9 tries: 4 narrow, 5 wide. Crossed 7, fell 2." After a win after many tries, a line from the router note: "A real release counts every try, not the best one." No penalty, just the count. This is variant shopping made visible, and it teaches distributions without a single percentage.
4. **The story card.** Professor Postmortem, one real-world story per map, with its source (the lesson catalog and the briefings already hold most of them), and one honest line on what the map exaggerates.

At the end of each act, "you raced like" runs over the act's races. If your posture shifts between Act I and Act III, the game has measured a change of habit in a person, the first evidence of the kind the project has never had. It is already computed per race.

## 6. Experiment: does a chapter test separate today's maps?

[[ai gen]] Run on 2026-11-04 by a subagent, in a scratch copy of `claude/segment-math`. Bot play only, auto-jump on (`chill:1`, as `judge.mjs --chill 1`), seeds 1001 to 1040 (never the judge's 9001 and up). 70 strategies (every posture in the pool, including each map's lesson strategy, run on every map) × 29 maps (12 segments, 14 lesson maps, 3 draft campaign maps). 81,200 races, 8.5 minutes on 4 cores. Built with `node build.mjs --all`, which includes the segments. The tables and the runner were kept out of the repo. Ask if you want them committed.

One standard error on a 40-seed win rate near 50% is about 8 points, so gaps under about 15 are ties. "Best of 70" picks the luckiest estimate, so per-map bests are optimistic.

### Habit gap over map sets

| Maps | Best single fixed strategy | Its mean | Mean of each map's best | Gap |
|---|---|---|---|---|
| All 29 | steady cruise at 120 (`x-steady120`) | 44.9 | 73.4 | 28.4 |
| 14 lesson maps | Run 40 max-out (`y-run40`) | 46.1 | 81.3 | 35.2 |
| 12 segments | fill first (`x-fill`) | 45.8 | 63.8 | 17.9 |
| Look, Warning Signs, Pattern Breaks | the reader (`cpRead`) | 74.2 | 85.0 | 10.8 |

Across the lesson maps no habit gets past 47%. The per-map winners differ that much. Over all 20,944 sets of 4 to 6 lesson maps, the median gap is 24.6 points. The three campaign maps are the exception, and for the right reason: one reader wins all three, so the gap is small *because* the reader is the fixed strategy.

### Reader margin: is there one rule a person can follow?

Over the 17 lesson and draft maps, the reader-like strategies average 36 to 46% (`sr-care` 46.0, `cpRead` 38.4, `lpLook` 35.7). The best non-reading habit averages 47.4% (`x-steady110`). **So across today's maps, no reading rule beats a habit.** On the three campaign maps it does: `cpRead` 74.2 against the best non-reader's 61.7, about +12. That is about two standard errors, so promising but not settled.

### The five acts, with today's maps

These act sets were chosen after seeing the matrix, so treat this as a sketch of the shape, not a test of it.

| Act (maps used) | Fill-first habit (`x-fill`) | Best reader | Best of all | What it says |
|---|---|---|---|---|
| I: Clean Record, Breakthrough Wall, Pack Dives Together | 93.3 | 35.0 (`sr-care`) | 93.3 | The habit forms honestly: fill up and go wins |
| II: Measure Twice, Warning Signs, Tailgating, Beacon | 33.8 | 48.1 (`lpLook`) | 48.1 | Weak. Only Measure Twice is clearly won by looking |
| III: Pattern Breaks, Rising Stakes, Look Before You Leap | 29.2 | 65.0 (`sr-care`) | 65.0 | The trap works: the Act I habit drops 64 points, and reading wins the act |
| IV: Rushing, Who Goes First, Fast Follower, Footsteps, Pack Behind You, Minefield | 43.8 | 35.0 (`cpRead`) | 47.5 (a Steward that stays near the front) | Regime 4 as intended: nothing does well. On Everyone Else Is Rushing nothing wins more than 7.5% |

What it shows: in bot play, today's maps already have the campaign's shape at Acts I, III and IV. The work is in Act II and in a single reader that wins Acts II and III.

Other findings:

1. **Spend It Once flips with auto-jump.** Max-out, fill-first and blind prep win 0%, and its lesson strategy wins 0%. Only "stay ahead and tall" (`y-pace`, 55%) and Run 40 max-out (47.5%) win. I had it in Act I; it moves to Act IV as an opacity map.
2. **The segments are mostly degenerate under the Feel test.** Fill-first wins 100% on Clean Record and The Last Gap, and rush wins 100% on the Breakthrough Wall. That suits Act I and does not suit The Last Gap as a finale, so the finale needs its own design pass.
3. **Only about 10 of the 70 strategies are ever uniquely best on a map.** The pool's real diversity is small: steady cruise at 110 to 120, fill-first, stay ahead and tall, careful prep, early-seeing, Measure Twice's look. That is a manageable set of habits for a player to name, and a good list for the "you raced like" kinds of the campaign.

## 7. The text on screen

Rules for every card, from the research side (`ai-pacing` CANONICALITY.md and its evidence labels):

1. Name what is accepted research position, what is hypothesis, and what is a model on assumed inputs. The pace line is a proposal (`ai-pacing` I12, Q17); say so.
2. Never show a win share or an ensemble share as a probability of anything in the world.
3. Each act's card includes one critique of the race framing (lesson catalog section C): race talk can start a race (Cave and Ó hÉigeartaigh 2018); the rush is a choice (Gebru and others); AI as a normal technology (Narayanan and Kapoor). Act V's "Same Track, Different Rules" is the honest map for these.
4. Questions on the map card, lessons on the debrief card. If the question has to carry the lesson, the map has failed (LESSONS.md rule 1).

## 8. Build plan

All local. Serve `check/` with `python3 -m http.server` and play.

| Step | What | Size | You do |
|---|---|---|---|
| M0 | Rebuild `lessons.html` with `--all` (the segments included). Campaign shell on the lesson harness: its own start card (not the main game's), act list, map card with the question, retries redraw the variant, debrief card with the variant reveal and the tally, progress in `localStorage`, auto-jump on. Load the maps that exist today for Acts I to IV (section 3) | one session | Play Acts I to IV. Per map, say in a line what the decision was |
| M1 | The reference reader: one sentence, one posture, run on every Teach and Exam map. Then Act II: redesign Beacon and add one more regime 3 map from `design.mjs`, until the reader margin passes. The Gate and the narrow Unknown Box for Act I | one to two sessions | Play Act II again, then Act III right after Act I: does the habit carry? |
| M2 | The overshoot box for Act III; retune Rising Stakes, Fast Follower and the opacity map for Act IV; the minimap ledger | one to two sessions | Play III and IV |
| M3 | Act V: the pace line (a new sim rule, behind a knob), the map pairs, a finale designed for it | two sessions | Play V |
| M4 | Three ghosts and the story cards | one session | Play the whole campaign through |
| Later | Port to `prototype.html` behind a switch; re-vendor the sim for the leaderboard | | |

**Decisions that are yours.**

1. Dictate the thesis (section 9).
2. Accept the four roles and the chapter test, or keep uniqueness for every map.
3. The jump mode for the campaign: auto-jump (my recommendation) or by hand. Maps are designed and judged in one.
4. The reference reader's sentence. `cpRead`'s, as a starting point: "Never run faster than you can stop within what you can see. Once you've seen more box than you can clear, stop and build."
5. Let Act V maps set rule knobs.
6. The pace line: hostile review as forced sight and height, or as a strike, or both.
7. Whether a "nobody fell" mark joins the star on Act IV maps: a second objective that rewards shared survival without changing who wins.

## 9. A draft thesis, to strike through

Only so you have something to edit. Not to be kept as is.

> A box is a risk nobody can size until someone is committed to it. You can go now, stop and look, or wait for a rival to go first and learn from their body. Going first pays in ceiling; waiting pays in safety; looking pays only when the answer would change what you do. Early in the race the ceiling covers every risk, and scale is safety. Later it doesn't, and the race leaves no time to look. A careful lab can't fix that by playing better. It can only be fixed by changing what the race rewards.

## 10. What this does not show

1. Nothing here is played. The only `human_validated` mechanism is the hidden-width box itself.
2. The pace line and the overshoot box are designs on paper. Neither has been built or judged.
3. The chapter test's numbers (section 6) are bot play on one seed block, and the act sets were picked after seeing them.
4. The research mapping covers `ai-pacing`'s accepted core and the router note. The off-Earth model is left out: its lesson (when you give up leverage matters more than trade) needs a two-sided game the racing frame doesn't have, and its shares must never be read as odds.
