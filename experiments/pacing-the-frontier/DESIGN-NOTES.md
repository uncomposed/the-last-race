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
- **A bot past the point of no return floors it.** A bot that cannot stop before a known gap's edge goes over whatever it plans, and braking only shortens its jump. So a bot that meant to stop, back up or wait for that gap runs at full pace instead. The check is braking distance against the distance to the edge, with one step of slack. Its input then holds full pace, and so does what it locks at the singularity. A stop for a blockade still stands: a bot braking for a barrier past the gap that it cannot clear crosses at pace 0 and locks that, which is what it would choose anyway.
- **A locked input never reverses.** Reverse is cleared when the input is stored. Since the previous change no bot crosses the singularity with reverse set, so this is now only a guard.

**How often the new rule fires** (500 games, counting each approach once). The Steward, 166 times at the singularity: it arrives too fast to stop where it wanted to wait and fill its meters. Before, it braked anyway and slid over at low speed. Then it locked the brake for the stretch, where braking is not sped up, so it crawled and stood. Custom, 181 times at ordinary gaps and 44 at the singularity: it had been braking to back up for a longer run-up and sliding over anyway, often too slowly to clear the gap. The Gambler fires it 41 times, the Sprinter 3.

**Results** (500 games). Wins are Custom / Gambler / Steward / Sprinter.

| | Wins | Games ended by the roll | Nobody left | Time-outs |
|---|---|---|---|---|
| Before | 148 / 136 / 93 / 62 | 56 | 0 | 5 |
| Run-up fix only | 151 / 136 / 98 / 64 | 48 | 1 | 2 (5422, 5491) |
| Reverse-lock fix only | 151 / 136 / 92 / 62 | 56 | 0 | 3 (5149, 5245, 5278) |
| Both | 154 / 136 / 97 / 64 | 48 | 1 | 0 |
| **Both, plus flooring it past the point of no return (default)** | 154 / 124 / 132 / 50 | 40 | 0 | 0 |

Per lab, 500 games, before flooring it and after (both deadlock fixes in place):

| | Custom | Sprinter | Steward | Gambler |
|---|---|---|---|---|
| Falls | 25 → 2 | 135 → 134 | 3 → 0 | 42 → 33 |
| Falls into the singularity gap | 5 → 1 | 27 → 27 | 3 → 0 | 23 → 21 |
| Scrapes | 100 → 102 | 94 → 93 | 7 → 1 | 176 → 176 |
| Barrier crashes, whole track | 367 → 392 | 785 → 781 | 44 → 77 | 814 → 825 |
| Barrier crashes inside the stretch | 210 → 226 | 83 → 80 | 33 → 69 | 202 → 206 |
| Dissolved | 12 → 14 | 36 → 35 | 1 → 0 | 75 → 77 |

- **Time-outs** fell from 5 to 0 with the two deadlock fixes. The longest stop by a lab still in the race fell from 251 s to 17.8 s (seed 5149, the Steward).
- **The run-up fix changes far more than the time-outs.** It changes the result of 36 games. Before the fix, careful bots also stopped for 2 to 8 s under a cap before ordinary gaps, then went on. Careful bots' time stopped under a cap running past the next gap's edge: 28 stops, 594 s in total, before (two of them the 240 to 250 s time-outs); 30 stops, 17 s in total and none longer than 3.6 s, after. Those shorter stops moved wins to Custom, the Steward and the Sprinter. They also cut the games the roll ends from 56 to 48 (9 games no longer end in the roll and 1 newly does). That mechanism was not traced game by game.
- **The reverse-lock fix alone** changes 5 games: it ends two time-outs, and in 5127, 5307 and 5446 the Steward stops for 15 s past the gap and Custom wins instead. Flooring it replaces that 15 s stop, since the bot no longer crosses while backing up.
- **Flooring it changes 64 more games.** 45 move to the Steward and 10 away from it. The Steward stops losing time at the singularity: it is first across about as often as before (14 games against 18) but wins 132 games against 97. Careful bots nearly stop falling and the games the roll ends fall from 48 to 40. The cost is more barrier crashes past the gap, mostly in the stretch, where a bot that floored it keeps full pace. The singularity's first lab across won 137 of 462 games, against 147 of 455 before.
- **Locked pace 0 remains** for 103 crossings, all braking for a barrier past the gap that they cannot clear. The 15 s release fired in 6 games.
- **Tried and dropped.** (1) Locking a bot that crossed backing up at its base pace: 18 more results changed, but it treated those bots differently from bots that slid over while braking. (2) Flooring it whenever a committed bot would slow down, including for a barrier past the gap: 225 results changed (151 / 136 / 124 / 51, 36 games ended by the roll). It also drove careful bots into barriers they could not clear: Custom's barrier crashes 367 to 619 and dissolutions 12 to 38, the Steward's crashes 44 to 114.

**Not fixed.** A wider sweep (seeds 1 to 3000) cut time-outs a lot but did not end them. With the full field, time-outs fell from 14 to 0 at the default split and from 20 to 3 at a 15/75/10 split. With Custom against the Steward alone, they fell from 469 to 135 and from 274 to 14. Two remaining kinds were seen, and both also timed out before the change:

- **Go/reverse chatter.** Two careful bots sit at the edge of the run-up they need, and their plans flip between go and reverse every step (seed 62, Steward alone).
- **Capped below the jump speed.** A capped bot needs more top speed than it has. The forced split sends nothing to max speed, and the cap ends past the gap (seed 16, Steward alone).
- **A Steward moving back and forth inside the stretch** (seed 2647, full field).

Traced and fixed later; see "Waiting that cannot help". Flooring it (above) also ends this one.

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

## Both fixes together

28 October 2026. "Two bot deadlocks" (with flooring it) and "Waiting that cannot help" were written on separate branches, from the same starting point. Merged, the two changes touch different decisions in `botPlan`. Seeds 5000 to 5499, default knobs, lab 0 the `custom` bot:

| | Wins (Custom / Gambler / Steward / Sprinter) | Games ended by the roll | Time-outs |
|---|---|---|---|
| Two deadlocks with flooring it | 154 / 124 / 132 / 50 | 40 | 0 |
| Waiting fixes alone | 150 / 135 / 102 / 64 | 48 | 0 |
| Both | 149 / 125 / 136 / 50 | 40 | 0 |

The longest stop by a lab still in the race is 17.8 s. Over seeds 1 to 3000 at the default split there were no time-outs, either with the full field or with Custom against the Steward alone. The 15/75/10 sweeps were not rerun.

## Bot hands (skill) and chill mode

28 October 2026. Prototype 0.3 plus the `chill` and `skill` knobs (see `README.md`), on the code of "Both fixes together", with default knobs otherwise (`strikes` 3, `barScale` 140). Seeds 5000 to 5499. Lab 0 is the `custom` bot. Bot play only. Ensemble shares are outcomes of this sampling of seeds, not calibrated probabilities. With `chill` 1 and `skill` 100 (the defaults), the knobs change nothing: 149/125/136/50 wins and 40 roll endings, as in "Both fixes together".

**Amplitudes at skill 0** (`HANDS`), which scale linearly to nothing at 100. These are guesses, not measured from people:
- reaction lag: mean 0.40 s, SD 0.15 s;
- jump timing: SD 0.25 s;
- misjudgment: SD 20% of distance and of required speed.

The aim point is half a jump's duration before the obstacle. A jump lasts 0.5 to 1.6 s, so a barrier is cleared if the press lands within about ±0.35 of a jump's duration of that point (±0.17 s at the fastest).

**Rival skill, lab 0 kept perfect** (`SKILL.custom` 100). Wins are game counts out of 500. The per-game columns are Custom / Sprinter / Steward / Gambler.

| Chill | Skill | Custom | Gambler | Steward | Sprinter | Extinct | Time-out | Crashes/game | Falls/game | Dissolved |
|---|---|---|---|---|---|---|---|---|---|---|
| on | 0 | 141 | 125 | 128 | 55 | 51 | 0 | 0.85/1.43/0.23/1.46 | 0.00/0.25/0.02/0.16 | 15/30/1/49 |
| on | 30 | 135 | 124 | 146 | 57 | 37 | 0 | 0.89/1.49/0.22/1.50 | 0.00/0.23/0.01/0.10 | 8/22/2/54 |
| on | 70 | 142 | 143 | 128 | 54 | 33 | 0 | 0.86/1.56/0.16/1.60 | 0.00/0.24/0.00/0.07 | 13/30/0/68 |
| on | 100 | 149 | 125 | 136 | 50 | 40 | 0 | 0.78/1.56/0.15/1.66 | 0.00/0.27/0.00/0.07 | 14/35/0/77 |
| off | 0 | 194 | 99 | 94 | 39 | 68 | 2 | 1.13/1.82/0.78/1.82 | 0.01/0.29/0.05/0.18 | 43/116/18/141 |
| off | 30 | 168 | 104 | 123 | 58 | 43 | 1 | 1.17/1.76/0.60/1.82 | 0.00/0.24/0.01/0.10 | 32/97/8/118 |
| off | 70 | 147 | 125 | 129 | 59 | 36 | 0 | 1.12/1.74/0.43/1.88 | 0.00/0.26/0.00/0.07 | 35/81/4/126 |
| off | 100 | 153 | 122 | 141 | 44 | 39 | 0 | 1.08/1.79/0.42/1.96 | 0.01/0.27/0.00/0.06 | 36/91/2/143 |

**One component at a time** (chill off, rivals at skill 0, lab 0 perfect):

| Case | Custom | Gambler | Steward | Sprinter | Extinct | Time-out | Rival crashes/game | Rival falls/game |
|---|---|---|---|---|---|---|---|---|
| no noise | 153 | 122 | 141 | 44 | 39 | 0 | 4.17 | 0.34 |
| lag only | 137 | 122 | 142 | 51 | 48 | 0 | 4.12 | 0.32 |
| misjudgment only | 136 | 121 | 127 | 57 | 55 | 1 | 3.71 | 0.46 |
| jump timing only | 192 | 114 | 107 | 40 | 43 | 0 | 4.71 | 0.38 |
| all three | 194 | 99 | 94 | 39 | 68 | 2 | 4.42 | 0.52 |
| all three, amplitudes doubled | 266 | 33 | 48 | 18 | 109 | 1 | 5.52 | 0.98 |

**Findings**

- **With chill on, the presets barely change who wins.** Custom wins 135 to 149 at every skill. With 500 seeds, differences of about ±10 games are noise. Rivals crash, scrape and fall a little more at low skill. Crashes are cheap and work as pit stops, so most of that does not cost them the race.
- **With chill off, skill works as a difficulty setting at the low end.** Custom wins 194 at skill 0, 168 against Rookie, 147 against Pro and 153 against Machine. Pro and Machine are within noise of each other.
- **Jump timing is the component that behaves like a handicap.** On its own it lifts Custom from 153 to 192 wins and cuts the Steward from 141 to 107, with extinction about flat (39 to 43). Chill mode removes jump timing, so the presets mean much more with chill off.
- **Lag on its own changes little.** Before the fixes in "Waiting that cannot help" it lifted the Steward from 110 to 128 wins; now it leaves it at 142 against 141. The likely reason is that the Steward no longer waits 25 behind a stopped lab, but that was not traced.
- **Misjudgment mostly raises extinction** (39 to 55) through more falls. Every lab pays for a rival's fall through the shared roll, so sloppy rivals endanger the player more than they slow themselves.
- **Chill off is harder even with perfect hands.** At skill 100 the Steward crashes 0.42 times per game with chill off against 0.15 with it on. Auto-jump counts a full jump at every barrier, even in the middle of an earlier jump, so obstacles close together cost nothing with chill on. A human jumping by hand faces the same thing.
- **Doubling the amplitudes** makes the rivals collapse (Gambler 33 wins), but extinction nearly triples, to 109. That is not a usable easy mode.
- **Not tested.** Human play. Calibrating the amplitudes against a person's measured reaction time and jump timing. A setting that weights jump timing over lag and misjudgment.

## Last strike

28 October 2026, same setup (skill 100). The question was whether bots should behave differently on their last strike. `wary` 1 (the default) makes a bot on its last strike stop for every blockade it knows it cannot clear. `wary` 2 also caps its speed to what it can stop within its sight, as the Steward and Custom always do.

| Chill | Wary | Custom | Gambler | Steward | Sprinter | Extinct | Time-out | Dissolved C/Sp/St/G |
|---|---|---|---|---|---|---|---|---|
| on | 0 | 149 | 125 | 138 | 48 | 40 | 0 | 15/39/0/79 |
| on | 1 | 149 | 125 | 136 | 50 | 40 | 0 | 14/35/0/77 |
| on | 2 | 149 | 131 | 134 | 47 | 39 | 0 | 16/33/0/54 |
| off | 0 | 156 | 121 | 139 | 44 | 39 | 0 | 35/96/3/146 |
| off | 1 | 153 | 122 | 141 | 44 | 39 | 0 | 36/91/2/143 |
| off | 2 | 157 | 106 | 153 | 47 | 36 | 0 | 36/83/3/132 |

- **`wary` 1 does almost nothing** (Gambler dissolutions 79 to 77). It acts only on blockades the bot already knows about. A plausible reading, not traced: most third strikes come from barriers the bot reaches before it sees them.
- **`wary` 2 cuts Gambler dissolutions by about 30% with chill on** (77 to 54), and its wins rise slightly (125 to 131). With chill off the cut is smaller (143 to 132), and its wins fall (122 to 106). The Sprinter changes little: its strikes come mostly from the gate and from towers.
- The default stays at 1, so earlier results are unchanged.

Replication: in the page, set `PF.K.chill`, `PF.K.skill`, `PF.K.wary`, `PF.SKILL.custom=100` and, for the ablation, `PF.HANDS`, then call `PF.run(seed,'custom')` for seeds 5000 to 5499.

## Campaign maps

The nine campaign maps were re-measured on the current code (chill on, skill 100, wary 1) after the deadlock fixes, Floor it and bot hands changed how bots drive. Eight probe strategies played each map 40 times against each roster, with jitter on the probe and the seed's own bot and roll draws (what a player on that map faces). Six of the old nine still held; 210 (tied with scout), 1077 (no probe won), 175 (runup no longer won), 1863 and 63 (weak) were replaced from a sweep of seeds 1 to 3000. Wins out of 40 for the map's strategy, with the runner-up, all three rivals:

| Order | Seed | Strategy | Wins (runner-up) | Trick | 1★ / 2★ / 3★ rivals |
|---|---|---|---|---|---|
| 1 | 114 | runup | 39 (climber 2) | wide gaps from the start | S / SG / SP |
| 2 | 1784 | climber | 37 (bold 12) | six 173-high walls right after the singularity | S / SG / ALL |
| 3 | 1167 | gamble | 34 (drafter 2) | low walls after the gate, then seven wide gaps | S / SG / ALL |
| 4 | 717 | scout | 40 (gamble 1) | a 300 wall late, a hidden 253 gap behind it | S / ALL / SG |
| 5 | 2972 | balanced | 37 (gamble 5) | a 185 gap right after the singularity | SP / S / SG |
| 6 | 1548 | bold | 32 (climber 1) | an early singularity, then six 173 walls | S / SG / SP |
| 7 | 1115 | rush | 38 (balanced 9) | narrow early gaps, towers around the singularity | S / ALL / SP |
| 8 | 322 | drafter | 40 (bold 1) | a 451-wide singularity late | ALL / SG / SP |
| 9 | 199 | climber, harder | 31 (scout 9) | a staircase to 328 walls, a 491 singularity late | ALL / S / SP |

S = Steward alone, SG = Steward and Gambler, SP = Sprinter and Steward, ALL = all three. Tiers are ordered by measured difficulty (mean wins over the probes), not by the number of rivals. Since the earlier sweep the pattern flipped: Steward alone is now usually the easiest, Sprinter with Steward most often the hardest, and on 199 and 322 the full field is the easiest. On several maps the best strategy changes with the roster (for example scout wins 1115 and 1548 against Steward alone), so a star ladder does not always repeat the map's one lesson.

Caveats. A map is a fixed seed, so its bots and rolls are fixed too; with 40 other bot and roll draws only 114, 717, 2972 and 1548 keep a clear winner, so the other tricks partly ride on that seed's luck. With chill off, 114, 322 and 199 favour a different strategy (hand-timed jumps hit more tall barriers and rivals strike out early). Time-outs: 6 in 92,160 games. Scripts and CSVs were kept out of the repo.

## Campaign difficulty

28 October 2026. Campaign medals exist only with chill mode off: Easy, Medium and Hard earn bronze, silver and gold; a chill win earns a separate chill star with no difficulty choice (see `README.md`, "Campaign"). The question was which levers make Easy, Medium and Hard a clear, monotone ladder with chill off, keep each map's strategy where it was, and leave Medium at the current defaults.

Setup: the nine campaign maps and their three tiers, the eight probe strategies of "Campaign maps", 40 runs per cell with jitter on the probe only and the seed's own bot and roll draws (mode J, as in the map sweep). The probe (lab 0) keeps perfect hands (`SKILL.probe` 100), so it stands in for a decent player, not for any measured person. Default knobs otherwise. Each cell is the map strategy's wins / the mean wins over the eight probes, out of 40, for tiers 1★ · 2★ · 3★. Bot play only; shares are outcomes of this sampling, not calibrated probabilities.

**Rival skill alone (chill off, player strikes 3).**

| Map | Seed | Strategy | Rookie 30 | Pro 70 | Machine 100 |
|---|---|---|---|---|---|
| 1 | 114 | runup | 6/12 · 30/10 · 0/13 | 6/10 · 0/3 · 7/9 | 3/9 · 24/4 · 4/7 |
| 2 | 1784 | climber | 40/18 · 25/8 · 25/8 | 38/13 · 40/8 · 40/7 | 40/13 · 40/12 · 37/9 |
| 3 | 1167 | gamble | 0/7 · 5/6 · 11/6 | 0/10 · 0/3 · 0/2 | 0/9 · 34/7 · 32/7 |
| 4 | 717 | scout | 33/6 · 19/7 · 37/9 | 36/9 · 4/4 · 6/4 | 40/10 · 40/6 · 24/6 |
| 5 | 2972 | balanced | 27/15 · 14/18 · 21/11 | 25/13 · 17/16 · 17/11 | 40/17 · 27/20 · 15/15 |
| 6 | 1548 | bold | 30/13 · 36/10 · 33/4 | 23/13 · 37/9 · 31/4 | 26/13 · 36/8 · 30/4 |
| 7 | 1115 | rush | 0/10 · 2/2 · 0/3 | 0/6 · 16/3 · 0/2 | 0/7 · 37/6 · 0/3 |
| 8 | 322 | drafter | 0/4 · 13/4 · 7/10 | 0/5 · 7/6 · 10/11 | 0/8 · 4/6 · 4/6 |
| 9 | 199 | climber | 1/2 · 36/14 · 40/11 | 7/3 · 38/13 · 14/4 | 5/2 · 17/7 · 16/2 |
| All 27 | | | 491/239 (22.1%), strategy best in 9 | 419/200 (18.5%), strategy best in 9 | 575/221 (20.4%), strategy best in 14 |

Only 6 of the 27 cells get harder (or stay level) from Rookie to Pro to Machine on the mean, and Pro is harder than Machine overall. With chill on the presets are flat (mean 20.5%, 20.7%, 20.9%). Because a map fixes the bots' hands noise as well as the track, a skill change reshuffles each race rather than making the rivals uniformly better or worse, and low skill also cuts the number of cells where the map's strategy is best (9 of 27 at 30 and 70, 14 at 100). Rookie rivals together with more strikes (not shown) raised the mean but cut that count to 8, and to 4 at skill 0.

**Player strike limit (chill off, rivals at the defaults).** A new `PSTRIKES` override (null in free play) sets lab 0's own strike limit; the rivals keep `K.strikes` 3.

| Map | Seed | Strategy | Easy: 4 strikes | Medium: 3 | Hard: 2 |
|---|---|---|---|---|---|
| 1 | 114 | runup | 3/9 · 24/4 · 4/8 | 3/9 · 24/4 · 4/7 | 3/8 · 20/3 · 4/6 |
| 2 | 1784 | climber | 40/14 · 40/13 · 37/10 | 40/13 · 40/12 · 37/9 | 23/6 · 21/10 · 24/7 |
| 3 | 1167 | gamble | 0/9 · 34/8 · 32/7 | 0/9 · 34/7 · 32/7 | 0/9 · 32/7 · 36/6 |
| 4 | 717 | scout | 40/10 · 40/9 · 24/6 | 40/10 · 40/6 · 24/6 | 6/5 · 34/5 · 22/5 |
| 5 | 2972 | balanced | 40/17 · 27/20 · 15/15 | 40/17 · 27/20 · 15/15 | 39/10 · 27/13 · 15/8 |
| 6 | 1548 | bold | 26/13 · 36/8 · 30/4 | 26/13 · 36/8 · 30/4 | 24/13 · 34/8 · 28/4 |
| 7 | 1115 | rush | 0/15 · 38/6 · 0/8 | 0/7 · 37/6 · 0/3 | 0/6 · 0/0 · 0/2 |
| 8 | 322 | drafter | 1/9 · 4/8 · 8/7 | 0/8 · 4/6 · 4/6 | 0/6 · 1/3 · 1/3 |
| 9 | 199 | climber | 5/6 · 17/13 · 16/5 | 5/2 · 17/7 · 16/2 | 5/1 · 17/4 · 16/2 |
| All 27 | | | 581/260 (24.1%), strategy best in 13 | 575/221 (20.4%), strategy best in 14 | 432/159 (14.7%), strategy best in 14 |

The mean never rises from Easy to Hard in any of the 27 cells (it is flat in a few, such as 1548), and the map strategy's wins rise in only one (1167 3★, 32 to 36). Where the map's strategy is best does not move (13, 14 and 14 cells), and Medium is the current default exactly. Five strikes added little over four (24.5% against 24.1%), and strikes off 24.8%. Halving or raising the fall odds (`p1`, `pstep`, `singOdds`) changed the summed means by at most two games over all 27 cells, since your own fall loses the race either way.

**Choice.** Difficulty is your own strike limit only: Easy 4, Medium 3, Hard 2. Rivals are the same on every difficulty. The Ready card says so in one line ("Hard wins gold. Your lab has 2 strikes; rivals are the same.").

Caveats. The ladder is steeper downwards than upwards (Easy +3.7 points, Hard −5.7). The probe never misjudges a jump; a human with chill off crashes more, so the strike limit probably matters more for people than here. With chill off the map strategy is best in only 14 of 27 cells even at the defaults (as "Campaign maps" noted for 114, 322 and 199). The control lag past the singularity (`reaction`) affects only the human and was not measured. Scripts and CSVs were kept out of the repo.

## Gap strikes

28 October 2026. A scrape or drop across a gap is now a strike (`strikeGap`, default 1), and a lab that runs off an edge without jumping drops across at the scrape rate instead of falling at once, if it has the height. Bots always press jump, so the drop rule alone changed no bot result; the strike did (159 of the 300 reference games).

**Free play, 600 bot races (seeds 1001 to 1600), strikeGap 0 against 1.** Dissolved labs a race 0.20 to 0.41 (chill on) and 0.47 to 0.75 (chill off). Extinction stayed at about 8 to 9%. With chill off, wins moved toward the Steward (27% to 34%) and away from the Gambler (27% to 21%). One seed block.

**Campaign ladder, re-measured (chill off, 9 maps × 3 tiers × 8 probes × 40 runs, mode J).** The probe strategies behind "Campaign difficulty" were not kept, so they were rebuilt and fitted to that table. The fit is not an independent check: at strikeGap 0 the mean wins land within 1.8 points of the published row (24.1%, 21.7%, 16.5% against 24.1%, 20.4%, 14.7%), but the map strategies win about 12% less and are best in 10 cells rather than 13 or 14. The rule effect below is paired (same jitter, rule 0 against 1), which is the part to trust.

| All 27 | Easy (4 strikes) | Medium (3) | Hard (2) |
|---|---|---|---|
| strikeGap 0 (rebuilt probes) | 260 (24.1%) | 234 (21.7%) | 178 (16.5%) |
| strikeGap 1 | 253 (23.4%) | 222 (20.5%) | 150 (13.9%) |

At Medium the probe is dissolved in 23.0% of runs (was 17.5%); scrapes and drops are about 12% of its strikes. The ladder stays monotone in total; the mean rises from Easy to Hard in 4 of 27 cells by 1 or 2 games of 40 (114 2★, 1548 1★ to 3★), against 2 cells with the rebuilt probes under the old rule. The cost falls on the risky lessons: gamble on 1167 (Medium 31 to 21, Hard to 0 or 1) and rush on 1115 2★ (26 to 1 at Medium). Choice: keep Easy 4, Medium 3, Hard 2. Inference, not shown: 1167 and 1115 may now teach a different lesson than their names say; worth a hand playtest. Scripts and CSVs were kept out of the repo.
