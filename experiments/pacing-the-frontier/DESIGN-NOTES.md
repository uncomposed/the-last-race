# Design notes: review of prototype 0.1 and agreed directions

27 October 2026. Items 1 to 5 and 7 of the agreed directions are implemented in `prototype.html` version 2, and items 6 and 9 in version 3 (see `README.md`). Items 8 and 10 are not. `spec.html` still describes version 1. The review numbers below come from bot-against-bot runs of the unchanged version 1 prototype; the version 2 bot numbers are in the last section. Neither comes from human play.

## What the bot runs showed

500 seeds per configuration. Lab 0 was driven by a bot policy against the Sprinter, Steward and Gambler.

- **Extinction is set by the Sprinter, not by the player.** About 35% of games end in the roll whatever safe policy lab 0 plays, because the Sprinter falls in about 99% of runs. The falls are mostly at gaps 3 and 4, usually about 25 units short. Odds added per gap is the only knob that moves this: 5% at 0 points, 35% at 10, 64% at 20.
- **Barriers do nothing.** Barrier placement skips anything from 240 before a gap to 90 past it. Since the tower moved 150 ahead of the gap, that leaves three barriers on the track, at 28, 31.2 and 34.4. The bare jump is 34, so no lab needs height to clear them, and no lab hit a barrier in 300 games. The only crashes are into towers.
- **Crashing is cheap.** A crash is a 0.5 s stop plus −40% top speed for 5 s. A stopped lab invests at the full rate, so a crash is nearly a free pit stop that also teaches everyone else.
- **Seeds add little variety.** A seed jitters gap widths by ±20%, draws the bots' gambles and draws the fall rolls. Track length, gap positions and barrier heights are fixed. With the jitter off, the winner is decided by policy alone, and winning times stay within about ±1.6 s of 38 s.
- **Two knobs are inert.** Followers' share of a level-up and the gap-narrowing distance give identical results at every value tried. Labs sit at their ceiling only 1.8% of the time, so the ceilings never bind.
- **The best fixed pace is 0.6–0.7**, which wins about 60% of games. The pace slider starts at 0.9, which wins 0–5%.
- **The split is a sharp edge when it is fixed.** At pace 0.7, a 20/60/20 split wins 59%, 34/33/33 wins 7.6%, and all height wins 0%. A player changing the split on the fly avoids most of this.
- **Being behind is rewarded.** The same Steward policy wins 32% starting third and 9% starting first. The likely cause is the up-to-3× refill for labs behind the frontier.
- **Information leaks.**
  - The hint line gives the distance to hidden gaps within 900 ("Gap 2 is about 393 ahead but hidden").
  - The minimap marks every gap.
  - The canvas draws every barrier.
  - The bots check barrier distance whatever their sight.
- **One random stream serves the track, the bot gambles and the fall rolls.** The same seed can play out differently depending on what the human does.
- **The README and design page disagree on numbers.** The README says a quarter to two fifths of games end in extinction, the design page a third to a half; the measured share is 35–50%. The design page's ceilings (100/140/200/290) don't match `CAPS` in the code.

## Agreed directions

1. **[Implemented in version 2] Barrier crash: bounce back.** Throw the lab backward at e × impact speed, decelerating at the braking rate. The bounce distance is then (e·v)²/(2·DEC), and never goes past `backLimit`.
2. **[Implemented in version 2] Barrier crash: forced speed cap.** Afterwards, cap top speed at the speed from which the lab could stop within its sight, until it has travelled a set distance past the barrier. This replaces the timed penalty. No investment penalty for now; add one only if needed.
3. **[Implemented in version 2] Gap near miss is a scrape.** A gap's floor is the starting height. A lab that reaches the far side before dropping to that floor scrapes through: it loses height and gets a speed cap scaled to the drop. A full miss means out, then the roll. Every failure costs ground or height plus a period of forced caution.
4. **[Implemented in version 2, with line of sight added later] One visibility rule.** Barriers and gaps are hidden until they are inside a lab's sight. A feature becomes permanently public when two labs see it at the same time, or when a lab crashes into it. The frontier relies on its own sight. Followers see the public map ahead of them. A reckless bot uses public knowledge, so it stops at known gaps it can't cross, and it stays dangerous when it leads into unseen ones.
5. **[Implemented in version 2] Fix barrier placement**, so barriers exist and need height.
6. **[Implemented in version 3, see "Version 3 bot results" for what differs] Singularity: the last gap.**
   - It is the widest gap, with the highest fall odds.
   - A lead buys time to rebalance into sight or extra height before crossing, while followers close in. The first lab across gets the full ceiling growth.
   - Past it, top speed is beyond human reaction time plus braking. Controls stay available, but acting is mostly a guess. A lab under a crash or scrape cap may be slow enough to act meaningfully.
   - Entering first does not guarantee finishing first, or at all. Labs can still hit barriers and scrape gaps inside.
   - Players extrapolate the map they crossed to choose the balance that will carry them through.
   - *Differences from the plan.* See "Version 3 bot results": inside the stretch acceleration is multiplied by the same factor as top speed (otherwise a lab could not get near it before the finish); braking is not, so a lab cannot brake in time. Gaps inside the stretch are capped at 0.9 of the singularity's width so that it stays the widest gap, which makes them easy at the faster speed. Falls inside the stretch roll at the singularity gap's base odds, without `singOdds`. The first lab across the gap gets a final ceiling of the last regime plus 40 (`C.SINGUP`) rather than a new `CAPS` entry.
7. **[Implemented in version 2] Seeds vary length and height.**
   - A seed draws a track profile: the number of gaps, their spacing and the finish, plus a hidden difficulty curve.
   - Barrier heights and gap widths both come from that curve, so barriers already seen are evidence about gaps not yet seen.
   - How closely they are coupled can vary by seed, from well signposted to deceptive.
   - The curve must be smooth enough for the extrapolation in item 6 to be possible.
   - The best strategy should depend on the seed. Dense, tall barriers should send the Sprinter to the back.
   - Use separate random streams for the track, the bots and the rolls.
8. **Incan Gold structure.**
   - The seed announces the hazard mix but not the order.
   - A first encounter warns (a scrape) and a repeat bites.
   - A session is three to five runs with a running score. Extinction zeroes that run for everyone, so the shared roll matters even after you are out.
9. **[Implemented in version 3; the on-screen hold button is "Floor it"] Controls.**
   - A triangle picker for the split, with hotkeys for the corners and centre.
   - Pace acts as a cruise level.
   - Hold keys give full acceleration forward or back.
   - Reflexes are meant to matter.
   - *Differences from the plan.* The triangle has hotkeys for the centre and the edge midpoints as well (`1` to `7`). While a lab is capped the picker shows the forced Sight/Height midpoint and keeps the player's own point as a dashed ring. Holding forward (`ArrowRight` or `D`) sets pace to 100% and invests nothing. Reverse wins if both are held. A gate at the start (about x = 150 to 200, jump plus 16 to 20) makes the first seconds a lesson in standing still to build height, and the base top speed fell from 90 to 50 so the opening is slow.
10. **The roll is a moment.** Freeze the action, show the odds, then roll.

## Open questions

- Does leading stay worth it? The frontier carries the discovery risk, the tower and the full gap. Its offsetting advantages are features only it has seen, and the full ceiling growth at the singularity.
- Should crossing a gap reveal it? The tower already shows that the gap exists. If it is revealed, is the width shown the full width or the narrowed width followers face?
- Should bots' appetite for risk respond to how close the race is? Rivals would then gamble more in a tight race and less when someone leads comfortably, so the player shapes extinction risk without controlling it.
- How should scoring work? One option is placings counted only when the world survives, so a lab's fall costs it something beyond its own exit.

## Version 2 bot results

27 October 2026. Prototype 0.2, default knobs, seeds 1 to 500, lab 0 driven by the `custom` bot (pace 0.75, cautious, 25/50/25 split) against the Sprinter, Steward and Gambler. Bot play only, no human playtest. Ensemble shares are outcomes of this sampling of seeds, not calibrated probabilities. Replication: `PF.run(seed,'custom')` in the page, one run per seed.

The generator keeps every track feasible: no gap is wider than 65% of the coverage a lab at that regime's ceiling has (smallest ceiling coverage to width ratio seen was 1.54), no barrier is taller than the regime's height ceiling plus jump minus 6, every stretch between gaps has at least two barriers, and no barrier sits in a gap's tower-to-landing zone. Widths and heights are scaled around a reference lab (`HREF0/1`, `WREF0/1` in the code), which was set from measured bot coverage once, not tuned to a target winner.

**Determinism.** 100 seeds: identical barriers, gaps, finish and rolls whatever lab 0 is (custom, steward, human); 100 distinct tracks; the rolls are unchanged by a human playing a different game; two headless runs of one seed and policy give identical results.

**Outcomes** (500 games)

| | Custom | Sprinter | Steward | Gambler |
|---|---|---|---|---|
| Win share | 42.2% | 5.4% | 9.6% | 41.6% |
| Barrier crashes per game | 0.04 | 0.57 | 0.00 | 0.81 |
| Tower crashes per game | 0.02 | 0.00 | 0.00 | 0.01 |
| Scrapes per game | 0.03 | 0.79 | 0.02 | 0.81 |
| Falls per game | 0.01 | 0.01 | 0.00 | 0.00 |
| Games with at least one barrier crash | 4.4% | 55.8% | 0.0% | 75.2% |

Extinction (a fall plus a roll ended everyone) 1.2%. Nobody-left 0%. Timeouts 0%. No lab stood still for more than 60 s. Every lab crossed gap 1 in every game.

| | p10 | median | p90 |
|---|---|---|---|
| Game time (s) | 28.2 | 43.3 | 57.6 |
| Track length | 1972 | 3346 | 4830 |

Track length ranged 1772 to 5322, so the tails are wider than the 2000 to 4500 aimed at. Gap counts were 97, 104, 98, 112 and 89 games for 3 to 7 gaps.

**By profile shape** (share of games won, 500 seeds)

| Shape | n | Custom | Sprinter | Steward | Gambler | Extinction |
|---|---|---|---|---|---|---|
| Steady climb | 114 | 53% | 5% | 11% | 31% | 0% |
| Early wall | 134 | 21% | 3% | 0% | 76% | 0% |
| Staircase | 125 | 50% | 8% | 15% | 26% | 1% |
| Late cliff | 127 | 47% | 6% | 13% | 31% | 4% |

The best policy does depend on the seed: the Gambler wins about three games in four on an early wall and about a quarter to a third elsewhere, and the cautious Custom bot is the reverse. Signposting matters less: Custom wins 44% well signposted, 37% mixed, 46% deceptive. By gap count, Custom falls from 57% at 3 gaps to 29% at 7 and the Steward rises from 2% to 24%.

**Visibility.** At the end of a game 99.8% of barriers and 100% of gaps were public, and 99.9% of both were public before the first lab reached them. The labs run as a pack, so two of them nearly always have a feature in sight together. The leader's private information edge exists only when it gets further ahead of the runner-up than the runner-up's sight.

**What looks off**

- **Extinction is almost gone.** The scrape forgives a miss of about `v * dropH * h`, and at the default `dropH` equal to the air time per height, that doubles the effective coverage for a tall lab. In version 1 about 35% of games ended in the roll. Sensitivity, 300 seeds: `gapScale` 130 gives 11.0% extinction, `dropH` 5 gives 17.7%, both together 25.3%. Barrier scale 130 gives 0.3% extinction but raises barrier crashes to 1.4 per game for the Sprinter and lifts its win share to 14%.
- **Crashes still pay.** A crashed lab stops and invests, so tall barriers make the Sprinter and Gambler taller, not slower. The bounce and the speed cap cost distance, but the Sprinter's win share is 5% in the default world and rises with taller barriers. Not tested: an investment penalty (item 2 said to add one only if needed).
- **The Steward almost never wins.** It caps speed to what it can see and so crawls.
- **Little is private.** See Visibility. If followers are meant to rely on public knowledge, the rule needs a distance condition or a stricter notion of "at the same time".

## Line of sight and extinction

27 October 2026, a follow-up to the version 2 results, which showed almost no private knowledge and almost no extinction.

**Diagnosis.** The co-observation rule was not what made everything public. In 200 seeds, the lab that first knew a gap was the frontier lab 83% of the time, and a second lab knew it a median 0.45 s later, almost always through its own sight, because the labs run as a pack. Changing what "public" means only affects the third and fourth labs.

**Changes**

- **Line of sight.** A lab ahead casts a sight shadow. A lab no taller than the one ahead sees nothing past it. A taller lab sees past it only from where its line of sight over the other lab's head meets the ground. A hard "taller sees everything" cut-off did nothing, because the runner-up is taller than the leader 82% of the time, but usually only by about 3.
- **Memory.** A lab remembers features it has had in view. Without this, a careful lab that saw a gap and then lost it into a shadow ran into it.
- **Mutual sight.** Co-observation now needs the two labs within sight of each other.
- **Forced split while capped.** After a crash or scrape, held-back effort goes half to sight and half to height, none to max speed.
- **Careful bots wait.** The Steward and Custom bots no longer charge a known gap after 10 s, and do not overtake a slower lab whose shadow hides the track.
- **Run-up zones.** The clear zone in front of a gap is now as long as the run-up a lab at the ceiling needs from a standstill. Before this, some wide late gaps could not be crossed from a stop, and careful bots waited until the time limit.
- **Default `dropH` 15 → 5.** A scrape now forgives a third of the air time that height adds, not all of it.

**Results** (default knobs, seeds 5000 to 5499, lab 0 = `custom`, bot play only)

- **Private knowledge.** The first lab to know a gap has it to itself for a median 1.7 s (p90 3.9 s), up from 0.45 s. That is roughly the time the leader takes to cover its own sight.
- **Extinction.** 20.8% of games end in the roll, and 0.4% hit the time limit. Falls in 500 games: Sprinter 199, Gambler 81, Steward 27, Custom 7.
- **Wins.**

  | Custom | Gambler | Sprinter | Steward |
  |---|---|---|---|
  | 35.8% | 28.4% | 10.6% | 4.0% |

- **Length.** Track length 1794 to 6054 (median 3446). Winning time p10/median/p90: 29/45/61 s.

| Shape | n | Extinction | Custom | Gambler | Sprinter | Steward |
|---|---|---|---|---|---|---|
| Early wall | 130 | 8% | 33 | 63 | 22 | 2 |
| Steady climb | 129 | 25% | 52 | 26 | 13 | 5 |
| Staircase | 134 | 16% | 55 | 40 | 12 | 5 |
| Late cliff | 107 | 37% | 39 | 13 | 6 | 8 |

(Win columns are game counts.)

**Still off**

- **The Steward wins 4%.** It caps speed to its sight and now also waits behind slower labs.
- **The leader's private window is short.** The leader sees a feature only as far as its own sight, so its edge is about one sight length of travel. A longer edge would need a longer lead or more sight.

## Version 3 bot results

27 October 2026. Prototype 0.3, default knobs, seeds 5000 to 5499, lab 0 driven by the `custom` bot, bot play only. Ensemble shares are outcomes of this sampling of seeds, not calibrated probabilities. Replication: `PF.run(seed,'custom')`. The same numbers came out of the page in Chromium and out of the simulation code loaded in node (6 seeds compared field by field). Version 2 and "Line of sight" numbers above are from earlier prototypes and are not comparable seed for seed: the generator now draws more numbers per track.

**What changed in the rules.** Base top speed 90 to 50. A gate at the start. The last gap is the singularity (widest gap, `singOdds` +30 points, the first lab across gets the final ceiling). After it, an 800 to 1500 stretch of barriers and 0 to 2 gaps continues the difficulty curve past its end (difficulty may exceed 1 there, up to 1.5), with top speed and acceleration times 3, human controls 0.25 s late, bots locked to their crossing pace and split unless capped. Careful bots (Steward, Custom) wait before the singularity gap and fill sight and height (35/65) until both meters are full or the next lab behind is within a sight length. Gap widths were rescaled for the slower speed (`WREF0/1` 112/36 to 84/30). One bot change beyond the brief: a safe bot no longer stops for a gap it cannot yet cross while it is inside a crash or scrape cap, because nothing can go to max speed there and it waited until the time limit (seed 5345, found by the first ensemble).

**Hard requirements.**

- Timeouts 0.0% (0 of 500). No lab that was still in the race stood still for more than 12.1 s.
- Feasibility, all 500 tracks, 2724 gaps. The ratio is jump coverage at the ceiling (speed and height at the regime a lab has when it reaches that gap, speed times 3 inside the stretch) over the gap's full width. The zone ratio is the clear distance before the gap over the distance needed to reach the edge speed from a standstill (at the stretch's accelerations inside it). The zone is measured from the previous barrier or gap, so it does not include the crash cap distance.

  | Gap class | n | Min coverage ratio | Min zone ratio |
  |---|---|---|---|
  | Regular | 1974 | 1.54 | 1.41 |
  | Singularity | 500 | 1.25 | 1.40 |
  | Inside the stretch | 250 | 5.82 | 6.40 |

  The singularity gap was the widest gap in every track. No barrier is taller than its regime's height ceiling plus jump minus 6. The gate is public, at x 150 to 200, with the first gap at least 300 beyond it.
- The first lab across the singularity won 221 of 434 games (50.9%). In 66 games nobody crossed it (everyone fell or the roll ended the run first).

**Outcomes** (500 games)

| | Custom | Sprinter | Steward | Gambler |
|---|---|---|---|---|
| Win share | 40.6% | 5.6% | 3.0% | 37.2% |
| Crossed the singularity gap | 82.8% | 46.2% | 52.4% | 76.4% |
| First across the singularity (of 434 games) | 251 | 13 | 8 | 162 |
| Barrier crashes per game, whole track (gate included) | 0.23 | 0.99 | 0.00 | 0.61 |
| Scrapes per game, whole track | 0.08 | 0.23 | 0.01 | 0.41 |
| Falls per game, whole track | 0.05 | 0.39 | 0.01 | 0.15 |
| Falls into the singularity gap per game | 0.02 | 0.05 | 0.01 | 0.07 |
| Barrier crashes per game inside the stretch | 0.18 | 0.00 | 0.00 | 0.11 |
| Scrapes per game inside the stretch | 0.00 | 0.00 | 0.00 | 0.00 |
| Falls into gaps inside the stretch per game | 0.00 | 0.00 | 0.00 | 0.00 |

Extinction (a fall plus a roll ended everyone): 13.6%. Of those, 8.0% of all games came from a fall into the singularity gap, 5.6% from earlier gaps and 0.0% from gaps inside the stretch. Nobody-left 0%. Before the change extinction was 20.8% and the wins were Custom 35.8%, Gambler 28.4%, Sprinter 10.6%, Steward 4.0%.

| | p10 | median | p90 |
|---|---|---|---|
| Game time (s), all games | 38.3 | 55.3 | 71.1 |
| Track length | 2977 | 4134 | 5634 |

Track length ranged 2508 to 6380. The distance from the singularity gap's far edge to the finish ranged 892 to 1589. 256 tracks had no gap inside the stretch, 238 had one and 6 had two.

**The gate** (500 games, every lab cleared it in every game). Seconds from the start line to clearing the gate: Custom median 8.1 (p10 7.5, p90 8.8, max 9.2), Sprinter 7.3 (max 8.1), Steward 8.5 (max 9.5), Gambler 7.1 (max 8.7). Most of that is the walk at pace 70% of a top speed of 50. Time spent stopped before clearing it: Custom median 0.7 s (p90 1.4, max 1.7), Steward 0.4 s (max 1.3), Sprinter 0.1 s (max 0.6), Gambler 0.0 s (max 0.1). The Sprinter hit the gate in 493 games and the Gambler in 215. A crash at the gate costs them little: they build height while the bounce slows them, so it works like a pit stop, as with the "crashes are cheap" finding above.

**By profile shape** (game counts of wins, 500 seeds)

| Shape | n | Extinction | of which at the singularity | Custom | Gambler | Sprinter | Steward |
|---|---|---|---|---|---|---|---|
| Early wall | 130 | 3 (2%) | 0 | 72 | 53 | 0 | 2 |
| Steady climb | 129 | 20 (16%) | 6 | 45 | 41 | 15 | 8 |
| Staircase | 134 | 20 (15%) | 13 | 47 | 60 | 5 | 2 |
| Late cliff | 107 | 25 (23%) | 21 | 39 | 32 | 8 | 3 |

**What looks off**

- **The stretch is mild.** Barrier crashes inside the stretch are 0.1 to 0.2 per game for the labs that get there, and there were no scrapes or falls inside the gaps in 500 games. Labs that cross the singularity arrive with a mean reach (height plus jump) of 206 (p10 149, p90 288, first 200 seeds), against a mean stretch barrier height of 174 (p10 116, p90 235). The cause for gaps is structural: the singularity gap must stay the widest and crossable at normal speed, and a gap inside the stretch is crossed at three times the speed, so its coverage ratio is 5.8 or more. Speed-scaled gaps that bite would need the singularity to stop being the widest gap, or the stretch's gaps to be wider than it. Only a capped (slow) lab is at risk there.
- **Extinction is concentrated at the singularity.** 8.0 of the 13.6 points, and 20 of the 25 late-cliff extinctions at the singularity. The odds there are 54% (3 gaps) to 94% (7 gaps), because `singOdds` adds 30 to a base that already rises 10 per gap.
- **First across wins about half.** The first lab across wins 51% of its games, so it is an edge but not a guarantee. The final ceiling (+40) and the careful bots' wait both feed it. This was not tuned.
- **The Steward still wins 3%** and the Sprinter 6%. The Gambler (37%) is close to Custom (41%), and wins more than Custom on staircase tracks.
- **Games are longer.** Median 55 s against 41 s, since the opening is slower and the track is about 700 longer. From the first lab crossing the singularity to the finish took a mean 7.5 s (p10 4.7, p90 11.6) in the first 200 seeds.
- **Not tested.** Human play, and the reaction lag and the "Beyond your loop" readout with a person. The lag was checked in the simulation: a pace change reaches the lab 0.27 s later inside the stretch, immediately outside it and immediately while capped.

## Three strikes (experiment)

27 October 2026. Prototype 0.3 plus the `strikes` rule, seeds 5000 to 5499, lab 0 driven by the `custom` bot, bot play only. Ensemble shares are outcomes of this sampling of seeds, not calibrated probabilities. Replication: set `PF.K.strikes` and `PF.K.barScale`, then call `PF.run(seed,'custom')`.

**The rule.** A strike is the first crash into a blockade the lab has not crashed into before: a barrier (the gate included) or, with `strikeTower` on, a tower. A repeat crash into the same blockade is free. The government dissolves a lab at `strikes` strikes: out at once, and it gets no later level-ups. Dissolution never rolls for extinction; only a fall into a gap does. A version that rolled on dissolution was tried and removed. `wary` makes a bot on its last strike stop for every blockade it cannot clear.

**Defaults changed.** `strikes` 3, `strikeTower` 1, `wary` 1, and `barScale` 100 to 140 (heights are still capped at the regime's height ceiling plus jump minus 6, so every barrier stays clearable). All results in earlier sections were produced at `barScale` 100. With `strikes` 0 and `barScale` 100 the numbers of "Version 3 bot results" reproduce exactly (Custom 203, Gambler 186, Sprinter 28, Steward 15 wins; 68 extinctions).

**At the old barrier height the rule almost never fires.** Strikes per 500 games (a lab's own count, gate included): Sprinter 495, Gambler 307, Custom 122, Steward 2. The Sprinter's 495 is almost all the gate, which it hits in 493 of 500 games. Nobody reached three strikes in 2000 lab-games at `barScale` 100. At 2 strikes 33 labs were dissolved (Gambler 28, Custom 3, Sprinter 2).

**Barrier height sweep** (500 games per row, `wary` on). "Off" is `strikes` 0, "3 strikes" is `strikes` 3. Wins are Custom / Gambler / Steward / Sprinter. Dissolved is Custom / Sprinter / Steward / Gambler. Wins do not sum to 500 because of extinctions and time-outs.

| Barrier scale | Rule | Wins | Dissolved | Games ended by the roll |
|---|---|---|---|---|
| 100 | Off | 203 / 186 / 15 / 28 | 0 | 68 |
| 100 | 3 strikes | 203 / 186 / 15 / 28 | 0 / 0 / 0 / 0 | 68 |
| 120 | Off | 153 / 187 / 38 / 55 | 0 | 64 |
| 120 | 3 strikes | 155 / 181 / 41 / 56 | 1 / 3 / 0 / 17 | 64 |
| 130 | Off | 146 / 165 / 65 / 59 | 0 | 62 |
| 130 | 3 strikes | 147 / 152 / 72 / 61 | 2 / 13 / 0 / 35 | 63 |
| **140** | Off | 141 / 157 / 81 / 63 | 0 | 55 |
| **140** | 3 strikes | 148 / 136 / 93 / 62 | 8 / 33 / 0 / 71 | 56 |
| 150 | Off | 145 / 160 / 80 / 52 | 0 | 57 |
| 150 | 3 strikes | 149 / 133 / 99 / 54 | 6 / 33 / 0 / 82 | 58 |

140 is the default. At 140 with the rule on, dissolution takes 71 of 500 Gambler runs (14%), 33 Sprinter runs (6.6%), 8 Custom runs (1.6%) and no Steward runs. The rule moves wins from the Gambler (157 to 136) to the Steward (81 to 93) and leaves extinction almost where it was (55 to 56), since dissolved labs do not roll. Taller barriers alone shift wins toward the Steward (15 wins at 100, 81 at 140 with the rule off) and the Sprinter (28 to 63), and cut the games the roll ends from 68 to 55.

**Findings and caveats**

- **The gate is a free strike for reckless labs.** The Sprinter hits it in 493 of 500 games, so for the Sprinter 3 strikes behaves like 2. The Gambler hits it in 215. Not tested: exempting the gate.
- **Dissolution falls on the labs that already crash most** (Gambler, then Sprinter). The careful Custom and Steward almost never reach it.
- **Bots do not react until their last strike** (and only if `wary` is on). A human who counts strikes can change how they play, so these rates describe the bots and not a human. Not tested: human play.
- **Time-outs.** At barrier scale 120 and above, 2 to 7 games in 500 time out, whether or not the rule is on (5 at the new default). At 140 the five stuck games (seeds 5149, 5245, 5278, 5422, 5491) were inspected but not traced through the bot logic. In three a careful bot stood still for 220 to 250 s with full sight and height, two of those under a crash cap, where the forced split gives max speed nothing. In two a bot stood in the stretch past the singularity with its frozen input. The causes are not established. They also occur with the rule off, so they are not caused by it. They only end a game when no lab that could finish is moving. Traced and fixed later; see "Two bot deadlocks".
- **A deadlock this exposed.** A careful bot that brakes for the singularity gap can slide over the edge at pace 0, and the frozen input kept it still to the time limit. It needs few live labs to show, and 3 of 500 games hit it at 2 strikes. A bot that has stood still for 15 s past the gap now drops its frozen input. The longest stop with the input frozen in version 3 was 12.1 s, and the baseline numbers did not change.

## Two bot deadlocks

28 October 2026. Prototype 0.3 with the `strikes` defaults above, seeds 5000 to 5499, lab 0 driven by the `custom` bot, bot play only. Replication: `PF.run(seed,'custom')`. The same numbers came out of the simulation code loaded in node, which reproduced the "Three strikes" baseline exactly before the change.

**What was wrong.** A seed sweep found two ways for a careful bot (Steward or Custom) to stand still until the time limit. They explain all five time-outs listed under "Three strikes".

- **A crash cap that runs past a gap.** `botPlan` took the whole distance left under a crash or scrape cap off the run-up, even when the capped speed was more than the jump needs. A bot whose cap ended beyond the gap's edge decided it could not reach the speed and stopped. The cap only ends when the lab moves, so it never ended. A careful lab behind it would not pass it blind, so it stopped too. Example: seed 210, Custom against the Steward alone, a barrier 197 before the singularity gap and `capDist` 200. The jump needs about 93 and the capped top speed is about 195. Seeds 5149, 5245 and 5278 were this case: in 5149 the capped Steward stood alone, in 5245 the Steward stood behind a capped Custom, and in 5278 the capped Steward stood before a gap inside the stretch.
- **A reverse input locked past the singularity.** A bot that crosses the singularity gap while its plan says to back up for a run-up locked that reverse input. At its back limit its speed flipped between -0.52 and 0 every step. Each flip reset its stillness timer, so the 15 s release never fired. Example: seed 1784, Custom against the Steward alone; the Steward is the one stuck. Seeds 5422 and 5491 were this case.

**Changes**

- **The cap shortens the run-up only when the jump needs more than the capped speed.** Otherwise the whole distance to the edge counts, and the pace for the jump is set against the capped top speed.
- **A locked input never reverses.** The bot keeps the pace and split it crossed with, with reverse cleared. A bot that crossed while backing up has a locked pace of 0. It stops, then the existing 15 s release hands it back to its plan. Not tested: locking at the bot's base pace instead, which changed 18 more outcomes in a trial run.

**Results** (500 games). Wins are Custom / Gambler / Steward / Sprinter.

| | Wins | Games ended by the roll | Nobody left | Time-outs |
|---|---|---|---|---|
| Before | 148 / 136 / 93 / 62 | 56 | 0 | 5 |
| Run-up fix only | 151 / 136 / 98 / 64 | 48 | 1 | 2 (5422, 5491) |
| Lock fix only | 151 / 136 / 92 / 62 | 56 | 0 | 3 (5149, 5245, 5278) |
| Both | 154 / 136 / 97 / 64 | 48 | 1 | 0 |

- **Time-outs** fell from 5 to 0. The longest stop by a lab still in the race fell from 251 s to 18.3 s (seed 5491, the Steward, which includes its 15 s stop past the gap).
- **The run-up fix changes far more than the time-outs.** It changes the result of 36 games. The cause is not only the deadlock: before the fix, careful bots also stopped for 2 to 8 s under a cap before ordinary gaps, then went on. Time spent stopped under a cap that runs past the next gap's edge, by careful bots: 28 stops, 594 s in total, before (two of them the 240 to 250 s time-outs); 30 stops, 17 s in total and none longer than 3.6 s, after. The shorter stops move wins to Custom, the Steward and the Sprinter and cut the games the roll ends from 56 to 48 (9 games no longer end in the roll and 1 newly does). That mechanism was not traced game by game. Seed 5149 now ends with nobody left instead of a time-out.
- **The lock fix changes 5 games.** It ends two time-outs, and in 5127, 5307 and 5446 the Steward now stops for 15 s past the gap, and Custom wins instead of the Steward. In 500 games 45 locked inputs had reverse set before the fix.

**Not fixed.** A wider sweep (seeds 1 to 3000) cut time-outs a lot but did not end them. With the full field, time-outs fell from 14 to 1 at the default split and from 20 to 3 at a 15/75/10 split. With Custom against the Steward alone, they fell from 469 to 144 and from 274 to 32. Three remaining kinds were seen, and each also timed out before the change:

- **Go/reverse chatter.** Two careful bots sit at the edge of the run-up they need, and their plans flip between go and reverse every step (seed 62, Steward alone).
- **Capped below the jump speed.** A capped bot needs more top speed than it has. The forced split sends nothing to max speed, and the cap ends past the gap (seed 16, Steward alone).
- **A Steward moving back and forth inside the stretch** (seed 2647, full field).

Traced and fixed later; see "Waiting that cannot help".

## Waiting that cannot help

28 October 2026. Prototype 0.3 with the fixes of "Two bot deadlocks", seeds 5000 to 5499, lab 0 driven by the `custom` bot, bot play only. Replication: `PF.run(seed,'custom')`. "Steward alone" means `PF.newGame(seed,'custom')`, then `out=true` on labs 1 and 3, then stepping until `G.over`. The 15/75/10 runs set `PF.POL.custom.w`. All numbers came out of the simulation code loaded in node, which reproduced the "Two bot deadlocks" numbers exactly before the change. Three seeds were checked on the page in Chromium and matched.

**What was wrong.** The three kinds left under "Not fixed" are two causes. In each a careful bot waits for something that cannot happen.

- **The reverse stopped 2 short of the run-up.** A bot backs up while `gd` is less than `dNeed`, but the go test passes at `dNeed` minus 2. While backing up its negative speed also counts as run-up speed in that test, so the test passes a little sooner still. The bot turned to go there, rolled forward a fraction, failed the test, and backed up again, every few steps until the time limit. Example: seed 62, Steward alone, both bots near x 1380 before the gap at 1488 (W 186). The jump needs 84.8, so the go test passes at `gd` 107.9 and `dNeed` is 109.9. Seed 2647 is the same case, not something inside the stretch: the Steward is the only lab left (the other three fell into gap 3) and chatters at x 1900, before gap 4 at 2105.
- **A capped bot stood still with nothing left to gain.** Seed 16, Steward alone: Custom hit a barrier, cleared it, and is capped until 984. It sees the gap at 982 (W 158) from x 774. It needs 86. Its raw top speed is 70, and its sight and height are at the ceiling of 90, so waiting cannot help it: under the cap the forced split sends nothing to max speed. Only another lab crossing first could help, by narrowing the gap. The Steward stood 24 behind Custom, blind: a careful bot closes on a slower lab only until 25 behind it, and Custom, at the same height, hides everything past it. So the Steward never saw the gap and never crossed. With the commit below in place, this case was 121 of the 124 Steward-alone time-outs at the default split. In 112 the Steward stood behind the capped Custom. In 9 Custom was the only lab left. The other 3 (seeds 1232, 1858, 2069) were a Steward alone at the singularity gap with its back to the tower. In 2069 it is 128 from the edge and `dNeed` is 136, with `room` 0. It cannot back up, and the 1.06 speed margin and 0.9 acceleration margin say the run-up is too short.

**Changes**

- **A careful bot that starts backing up for a run-up keeps backing up until `gd` reaches `dNeed`.** The hold applies only while the bot is not rolling forward (speed below 1). A bot that chose reverse while still moving forward is not held. Holding it in one trial stopped a Steward from taking a go that opened up as the gap narrowed, and it fell. The hold covers careful bots only. The Gambler has its 10 s limit on backing up, so it cannot chatter forever, and holding it too changed 21 games.
- **A careful bot may pull level with a lab that has stood still for 2 s.** A lab standing still is on solid ground, and once the bot is level with it, its shadow ends. A moving slower lab is still kept 25 ahead.
- **A last resort for a bot that cannot get better.** A bot that has stood still for 20 s before a gap goes for the jump if three things hold: its sight and height are full, its max speed is full or it is capped, and no other lab is still racing. It does not back up again for that gap.

Not done: clamping the run-up speed at 0 while backing up. With the hold in place it is not needed for the time-outs, and it changes 15 more games. In all 15 the Gambler is the first lab to play differently. Also not done: the last resort without the "no other lab" and max speed conditions. Steward alone at 15/75/10 it fired 103 times in 91 games, against 6 with them, and 51 of those bots fell (26 games ended in the roll). Most of those waits would have ended without it: without the last resort, stops with sight and height full that ended on their own lasted up to 35 s at the default split and up to 77 s at 15/75/10.

**Time-outs, seeds 1 to 3000**

| | Full field, 25/50/25 | Full field, 15/75/10 | Steward alone, 25/50/25 | Steward alone, 15/75/10 |
|---|---|---|---|---|
| Before | 1 | 3 | 144 | 32 |
| Hold only | 0 | 3 | 124 | 17 |
| Pull level only | 1 | 2 | 24 | 16 |
| Last resort only | 1 | 2 | 132 | 20 |
| All but the hold | 1 | 1 | 14 | 11 |
| All but pull level | 0 | 1 | 112 | 4 |
| All but the last resort | 0 | 2 | 11 | 6 |
| All three | 0 | 0 | 0 | 0 |

- **Each change is needed.** Taking any one out leaves time-outs.
- **The last resort is rare.** In the four sweeps it fired 0, 2, 13 and 6 times (21 in all). That is close to the time-outs left without it. 17 of the 21 bots were capped and 4 were not. 7 cleared the gap, 12 scraped across and 2 fell (both Custom alone at 15/75/10; neither game ended in the roll).
- **Seed 16 now plays on.** The Steward pulls level with the stopped Custom at 23.9 s. It is first across gap 2 at 34.4 s, and Custom crosses at 39.0 s on the narrowed gap. The game ends with nobody left: Custom is dissolved on its third strike past the singularity, and the Steward falls into the singularity gap and rolls over the odds. Seeds 62 and 2647 end in wins.

**Results, seeds 5000 to 5499.** Wins are Custom / Gambler / Steward / Sprinter.

| | Wins | Games ended by the roll | Nobody left | Time-outs | Games changed |
|---|---|---|---|---|---|
| Before | 154 / 136 / 97 / 64 | 48 | 1 | 0 | |
| Hold only | 155 / 135 / 97 / 64 | 48 | 1 | 0 | 6 |
| Pull level only | 150 / 135 / 102 / 64 | 48 | 1 | 0 | 8 |
| Last resort only | 154 / 136 / 97 / 64 | 48 | 1 | 0 | 0 |
| All three | 150 / 135 / 102 / 64 | 48 | 1 | 0 | 13 |

- **The baseline wins change**, from 154 / 136 / 97 / 64 to 150 / 135 / 102 / 64, with 48 roll endings as before. No game in this range timed out before, so the changes come from how the bots play ordinary games.
- **Pulling level moves 5 wins to the Steward.** In 6 of its 8 games the lab the Steward pulls level with stands still past the singularity with a locked pace of 0 (Custom in 5, the Gambler in 1). That is the stop the lock fix of "Two bot deadlocks" brought in. Before, the Steward waited 25 behind it until the 15 s release. Seeds 5127, 5307 and 5446, the three that the lock fix moved from the Steward to Custom, go back to the Steward. In 5118 and 5258 the Steward only closed in on a stopped lab. Careful bots pulled level with or passed a still lab 62 times, against 42 before.
- **The hold changes 6 games.** In 5003, 5212, 5353 and 5496, Custom backing up at 16 to 29 used to turn to go about 2 short of `dNeed`. Now it backs up the whole way. In 5447 the Steward chattered for 2.2 s, then went. 5118 changes with either change and was not traced.
- **The last resort never fires in these 500 games.** The longest stop by a lab still in the race is 18.3 s (seed 5491, the Steward), as before.
