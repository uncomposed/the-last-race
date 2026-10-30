# Step gaps: tuning strikes, extinction odds and no-warning boxes

[[ai gen]] 29 October 2026. Bot play only. Status: `verified` (checks run), not `human_validated`.

Box-competent probe for reuse: `steps-bt-results/tuning/boxprobe.mjs` exports `runBoxRace(cfg, {mode, base})` (modes `none`, `crawl`, `crawlOcc`, `crawlBar`, `crawlBoth`, `smart`; `cfg` is a harness `campaignConfig`/`dailyConfig` object or `{seed, roster, knobs, consts, strikesYou, chill, steps}`). The harness's `runRace` has no per-step hook, so it cannot drive these; `none` matches `runRace` exactly (40 of 40 seeds). Best general-purpose choice: `crawl` with a strong base, for example `{mode: 'crawl', base: 'gamble'}`.

## Short answer

Recommended values. All the evidence here is from held-out blocks: free seeds 2000–2999 (11 players, 11,000 races per setting) and campaign noise ids 100–199 (10 probes, 27,000 races per setting).

1. **Strikes: give the player one more strike, and leave the rivals at 3.** `K.strikes` stays 3. Campaign `CAMP_DIFF` goes from 4/3/2 to **Easy 5, Medium 4, Hard 3**. For free play and the daily, set the player's strikes to 4 (`setPlayerStrikes(K.strikes + 1)`). That is a code change, because today only the campaign sets player strikes. Do not raise `K.strikes` for everyone.
2. **Extinction odds: keep `p1` 4, `pstep` 10, `singOdds` 30.** A fall is already 43% likely to end everyone in free play, and 16% in the campaign. With chill off, extinction per race is already at or above the steps-off level.
3. **NOWARN: keep 0.12.** It gives about 0.44 no-warning boxes per free map and 0.56 per campaign map, and it is the main source of falls, so it keeps extinction alive.
4. **RISEFLOOR:** held at 0.9; box shapes belong to another agent now. In calibration it barely moved dissolution (0.6 to 1.0 changed it by at most 2 points).

Why player-only strikes. The table shows lesson-probe mean win with SE, and paired deltas against the current setting:

| Setting | Free play | Campaign Medium |
|---|---|---|
| steps off (reference) | 19.2% (+1.1 ± 0.6) | 22.8% |
| steps on, now (all 3) | 18.1 ± 0.4% | 13.0 ± 0.4% |
| steps on, player 4, rivals 3 | **25.4% (+7.3 ± 0.3)** | **22.8% (+9.9 ± 0.3)** |
| steps on, everyone 5 | 19.7% (+1.6 ± 0.5) | not run held out |

Box-competent probes (held-out free, paired deltas): the player-only +1 adds +3.0 ± 0.5 for crawlOcc and +3.0 ± 0.6 for crawl:gamble. Raising everyone to 5 costs them −12.9 ± 1.6 and −18.8 ± 1.6, because rivals stop dissolving.

Campaign difficulty triple, held out (lesson-probe mean win):

| Difficulty | Steps off, shipped strikes | Steps on, proposed strikes | Paired delta |
|---|---|---|---|
| Easy | 25.9% (4) | 28.4% (5) | +2.6 ± 0.8 |
| Medium | 22.8% (3) | 22.8% (4) | +0.0 ± 0.4 |
| Hard | 16.2% (2) | 13.0% (3) | −3.3 ± 0.5 |

Hard ends up about 3 points harder than before and Easy about 3 points easier. The proposed triple keeps the three tiers clearly apart. With player strikes at 4, scrapes still matter: 28.7% of Medium races end with a scrape among the dissolving strikes, and 51.6% end one strike from dissolution or dissolved (steps off: 8.7% and 42.5%).

The pre-registered held-out predictions (in `tuning/prereg.txt`) held: (a) player-only +1 restores the mean to within 2 points of steps off at Medium (0.0) but overshoots free play (+6.2 over steps off); (b) global 5 cuts crawl:gamble by 18.8 points; (c) extinction per fall is 43% in free play but 16% in the campaign, below my 30–50% range; (d) the forced share is 3.3%.

## How this was run

- Harness `check/steps-bt.mjs`, unchanged. My scripts and raw rows are in `steps-bt-results/tuning/` (`sweep.mjs`, `run.mjs`, `an.mjs`, `gridan.mjs`, `sighttrap.mjs`, `stan.mjs`, `boxprobe.mjs`, `bpsweep.mjs`, `tower-probe.mjs`, `tower-force.mjs`, `raw/*.json`). Predictions were written to `tuning/prereg.txt` before each sweep, with the result added after.
- Free play: steps on, chill on (the free default), all three rivals, the custom bot plus the 10 lesson probes, no jitter. Campaign: steps forced on for all nine maps (CAMP_STEPS is false in the page), chill off, the 10 lesson probes with rival-noise jitter, rivals at `K.strikes`, the player at the difficulty's strikes.
- Calibration: free seeds 0–999, campaign noise ids 1–50 (grids used 0–499 and 1–30). Held out: free seeds 2000–2999, campaign noise ids 100–199. Every number in the Short answer and in the held-out tables comes from the held-out blocks only.
- Standard errors are clustered by seed (all players on one seed are one cluster). Deltas are paired on the same seed, player, map and tier. Anything under 3 SE is marked provisional.
- RISEFLOOR is held at 0.9 (box shapes now belong to another agent).

## Two views of the players

The lesson probes were tuned on maps without boxes, and they carry speed into boxes. That is exactly what the design says not to do. So every result below is given in two views:

1. **Lesson probes** as they are (what an untrained player might do).
2. **Box-competent probes** from `boxprobe.mjs`. `crawl` slows to a crawl (speed 4) 15–45 short of each box face for up to 4 s, so it reaches the box from near rest and takes a measured run-up. `crawlOcc` crawls only when a rival is close behind (Cole's occluder). `crawlBar` and `crawlBoth` do the same at barriers. `smart` stops and builds until the page's own flight model predicts a clean crossing.

Calibration, free play, chill on (1000 seeds, win rate with SE, own dissolution):

| Player | Win | Own dissolution | Scrapes per race |
|---|---|---|---|
| custom bot (lesson style) | 17.6 ± 1.2% | 54% | 0.77 |
| crawl (custom base) | 21.0 ± 1.3% | 1% | 0.11 |
| crawlOcc | 31.0 ± 1.5% | 6% | 0.12 |
| crawl, gamble base | 29.9 ± 1.4% | 5% | 0.19 |
| smart (stop and build) | 7.0 ± 0.8% | 40% | 0.11 |
| best lesson probe (gamble) | 26.1% | 56% | 0.73 |

So "the probes play steps badly" is a large part of it. Simply not carrying speed into a box cuts the custom bot's own dissolution from 54% to 1%. `smart` removes scrapes too, but it stands still so long that rivals win. It also picks up barrier crashes it would otherwise have avoided, so it is not a good model of a skilled player.

In the campaign (chill off), `crawl` on the gamble base wins 49.0 ± 2.0% at Medium against 26.5% for the best lesson probe. In the daily, `crawl` stalls into time-outs on solo days, so the daily is not a fair test of these probes (see Limits).

## Held-out details

Free, seeds 2000–2999, chill on (lesson probes plus custom bot):

| Setting | Win | Player dissolved | Extinction per race | Per fall | Player falls | No-warning: boxes per map / met per race / player falls | Rival dissolutions per race |
|---|---|---|---|---|---|---|---|
| steps off | 19.2 ± 0.4% | 13.1% | 12.3% | 28% of 4748 | 7.8% | none | 0.39 |
| steps on, now | 18.1 ± 0.4% | 38.8% | 3.4% | 43% of 875 | 2.4% | 0.44 / 0.36 / 1.5% | 1.43 |
| player 4 | 25.4 ± 0.5% | 23.7% | 3.4% | 43% of 867 | 2.7% | 0.44 / 0.39 / 1.7% | 1.39 |
| everyone 5 | 19.7 ± 0.4% | 11.4% | 2.8% | 43% of 720 | 2.4% | 0.44 / 0.41 / 1.6% | 0.33 |

Campaign, noise ids 100–199, chill off, rivals at 3:

| Player strikes | Steps | Win | Dissolved | Extinction per race | Per fall | Player falls | No-warning falls |
|---|---|---|---|---|---|---|---|
| 2 | off | 16.2% | 41.5% | 9.9% | 30% | 9.0% | none |
| 3 | off | 22.8% | 24.4% | 10.0% | 30% | 10.4% | none |
| 4 | off | 25.9% | 11.1% | 10.7% | 30% | 12.5% | none |
| 2 | on | 5.1% | 65.4% | 10.1% | 15% | 20.0% | 9.2% |
| 3 | on | 13.0% | 48.9% | 10.6% | 16% | 22.9% | 10.1% |
| 4 | on | 22.8% | 31.6% | 11.0% | 16% | 25.4% | 10.5% |
| 5 | on | 28.4% | 22.0% | 11.7% | 17% | 27.5% | 10.7% |

Box-competent probes, held out (win, own dissolution):

| Probe | Free, player 3 | Free, player 4 | Free, everyone 5 | Campaign Medium 3 | Campaign 4 |
|---|---|---|---|---|---|
| plain custom | 14.8% (54%) | 24.4% (31%) | 23.3% (17%) | 10.5% (44%) | 13.1% (24%) |
| crawl | 21.6% (1%) | 22.0% (0%) | 4.1% (0%) | 17.4% (2%) | 18.0% (1%) |
| crawlOcc | 29.0% (7%) | 32.0% (3%) | 16.1% (0%) | 24.1% (27%) | 28.9% (15%) |
| crawlBar | 24.9% (3%) | | | 20.3% (29%) | 34.0% (10%) |
| crawlBoth | 25.1% (3%) | | | 26.2% (36%) | 42.0% (16%) |
| crawl, gamble base | 28.1% (5%) | 31.1% (2%) | 9.3% (0%) | 48.5% (31%) | 56.9% (21%) |
| best lesson probe, steps off | 35.2% (balanced) | | | 42.3% (runup) | |

Steps off, barrier crawling: free 16.0% against 28.4% for plain custom. In the campaign at 3 strikes it is 25.3% against 17.0%. So the barrier tactic hurts in free play with steps off but helps in the campaign.

Sight trap, held out (202,262 encounters): free 80.9%, committed 15.8%, forced 3.3%. Forced encounters end 81.2% clean, 17.9% scrape, 0.5% fall and 0.4% extinction. They cause 58 of 875 falls and 27 of 377 extinctions. Of forced encounters, 72.5% were occluded in time, and lab 0's shadow was among the hiders in 27.3%. The player meets 0.18 forced boxes per race, and 4.9% of races contain one that ends in a scrape or fall.

## 1. Is dissolution the limiting factor?

**For lesson-style play, yes. For box-competent play, no.** Calibration, free play, chill on:

- Lesson probes: own dissolution is 39.6% with steps on and 13.3% with steps off. Mean win is 18.0% against 19.1%, and the custom bot's is 17.6% against 29.0%.
- Rivals dissolve far more: 1.46 of 3 rivals per race with steps on, against 0.40 with steps off. Rival bots also carry speed into boxes. Much of a box-competent player's win rate comes from rivals dissolving.
- Strikes come from two places. Scrapes are about two thirds of them, and nearly all scrapes (19,300 of 20,900) happen at boxes the lab could have stopped for. Barrier crashes rose too: fresh barrier crashes per race (all labs) went from 3.8 with steps off to 6.3 with steps on. About 42% of those barriers came into view too late to brake, in both modes.

**Global strikes against player-only strikes** (calibration, free, chill on; win rate):

| Setting | Lesson-probe mean | Custom bot | crawl:gamble | crawlOcc | Rival dissolutions per race |
|---|---|---|---|---|---|
| strikes 3 (now) | 18.0% | 17.6% | 29.9% | 31.0% | 1.46 |
| all labs 4 | 19.2% | 19.4% | 18.4% | 22.7% | 0.75 |
| all labs 5 | 20.3% | 22.9% | 12.1% | 14.4% | 0.33 |
| player only 4 | 24.8% | n/a | 31.1% (held out) | 32.0% (held out) | 1.42 |
| player only 5 | 30.4% | n/a | not run | not run | 1.40 |

Raising strikes for everyone brings dissolution back to steps-off levels, but it moves win rate for lesson play by only 1–2 points. It also cuts the box-competent probes' win rate by more than half, because rivals stop dissolving. Raising strikes for the player only helps lesson play a lot and costs box-competent play nothing (they rarely dissolve anyway).

**How often scrapes matter** (campaign calibration, noise 1–30, rivals at 3):

| Player strikes | Lesson mean win | Dissolved | Dissolved with a scrape among the strikes | Ended on the last strike or dissolved |
|---|---|---|---|---|
| steps off, 3 | 22.2% | 24.1% | 9.0% | 42.6% |
| 2 | 5.5% | 64.2% | 50.7% | 82.4% |
| 3 | 13.4% | 47.9% | 41.8% | 67.7% |
| 4 | 22.7% | 31.7% | 28.5% | 50.3% |
| 5 | 28.5% | 21.9% | 21.3% | 34.0% |
| 6 | 33.7% | 14.6% | 14.6% | 23.2% |

At player strikes 4, scrapes still decide 28.5% of races, and half of all races end one strike from dissolution. So a scrape still costs something you can feel. At 6, scrapes barely matter.

## 2. Extinction

**Extinction is rare only with chill on.** Calibration:

| Mode | Extinction per race, steps off | Extinction per race, steps on | Extinction per fall, steps on |
|---|---|---|---|
| free, chill on | 12.4% | 3.1% | 36% of 945 falls |
| free, chill off | n/a | 15.6% | 25% of 6908 falls |
| campaign, chill off | 9.9% | 12.1% | 18% of 9017 falls (steps off 30%) |

With chill off, bots fall more with steps on than off (campaign player falls 23% of races against 10%), so extinction is not rare there. The chill auto-jump is what makes falls rare in free play.

Odds sweep (free, chill on, seeds 0–499, NOWARN 0.12): raising p1/pstep from 4/10 to 10/12 moves extinction per race from 2.2% to 2.8% and per fall from 32% to 42%. The change is under 3 SE. Falls are rare enough that odds are a weak lever. They change how scary one fall is, not how often extinction happens.

**Where falls come from** (calibration, all labs, 945 falls):

- 732 at no-warning boxes, 182 at floored boxes, and 31 at the singularity. Per box reached, a fall happens at 5.0% of no-warning boxes, 0.12% of floored boxes, and 0.10% at the singularity.
- Too slow against too short: 772 falls were too slow but high enough at the face, 33 too slow and short, 123 at full speed but high enough (too wide for the speed), and 17 at full speed and short. Both kinds Cole expects happen. Too slow dominates; short at full speed is rare (1.8%).

### The sight trap ("how often does that happen where the snap situation hits?")

Each box encounter of every lab is classed at the moment the box first becomes known (public, remembered from view, or behind it). The test is the page's own braking distance `v²/2·DEC` against the distance to the face, then the flight model at the speed reachable by the face and the current height.

| Class (calibration, 202,263 encounters) | Share | Clean | Scrape | Fall | Extinction |
|---|---|---|---|---|---|
| free choice (could brake) | 81.3% | 87.7% | 11.7% | 0.3% | 0.2% |
| committed but clears | 15.6% | 98.4% | 1.5% | 0.0% | 0.0% |
| forced (cannot brake, cannot clear clean) | 3.1% | 81.3% | 17.7% | 0.6% | 0.4% |

**Answer: the snap happens at about 3% of box encounters (3.3% held out), and it actually hurts (a scrape or worse) at about 0.6% of encounters.** For the player that is 0.18 forced boxes per race, and 4.4% of races contain a forced box that ends in a scrape or fall. Forced encounters cause 6% of falls (60 of 945) and 7% of extinctions (24 of 344). Most falls (846) are at boxes the lab could have stopped for. The forced class is an upper bound: 81% of "forced" boxes still end clean, because the box narrows when another lab crosses it, and because spill can add height.

By sight at the encounter, the forced share rises with sight (2.0% below 150, 4.5% above 450), because high-sight labs are also later in the race and faster. Comparing probes is cleaner: bold (sight 228) is forced at 12.3% of boxes and rush (220) at 7.6%, while scout (554) is at 3.0% and runup (528) at 2.0%.

**Occlusion.** 75.5% of forced encounters were boxes that were inside sight range earlier but hidden by another lab's shadow, at a time when the lab could still have braked. Lab 0's shadow was one of the hiders in 27.6% of forced encounters. Occluded forced boxes cause 3.4% of falls and 4.1% of extinctions (lab 0's shadow: 1.5% and 2.0%). So occlusion is the main way a snap happens, but snaps are a small source of falls.

### The crawl occluder (calibration, free, chill on, custom base)

| Variant | Win | Rival strikes per race | Rival dissolutions | Rival falls | Extinction triggered by a rival | Own run ended by a rival's lost roll |
|---|---|---|---|---|---|---|
| plain custom | 17.6% | 5.91 | 1.34 | 0.05 | 1.7% | 0.8% |
| crawl at boxes, always | 21.0% | 6.70 | 1.68 | 0.10 | 3.7% | 3.7% |
| crawl at boxes when rivals behind | 31.0% | 6.68 | 1.66 | 0.08 | 2.8% | 2.8% |
| crawl at barriers only | 25.4% | 6.62 | 1.62 | 0.10 | 3.7% | 3.6% |
| both | 25.2% | 6.92 | 1.75 | 0.09 | 3.4% | 3.4% |
| barriers only, steps off | 13.2% | 4.41 | 0.50 | 0.49 | 14.1% | 14.1% |
| plain custom, steps off | 29.0% | 3.66 | 0.30 | 0.33 | 8.4% | 8.4% |

- Most of the crawl's gain is its own box play: crawling always already cuts own dissolution from 54% to 1%.
- The occlusion part is modest. Rivals take about 0.8 more strikes and 0.3 more dissolutions per race, and fall about twice as often (0.05 to 0.08–0.10 per race). The risk Cole named is real: the player's own run ends from a rival's lost roll in 2.8–3.7% of races, against 0.8%.
- No variant is dominant. Against the best lesson probe on the same seeds (gamble, 26.1%), crawlOcc is +4.9 ± 2.2 points and the barrier variants are −0.7 to −0.9. All are under 3 SE. With chill off, crawlOcc is +9.5 ± 1.6 over the best probe (runup), and crawl on the gamble base is +11.6 ± 1.7.
- Barrier crawling is not a good tactic with steps off: 13.2% against 29.0%. Rivals fall more (0.49 per race) and lose the roll for everyone (14.1% of races). With steps on it gains about 8 points over plain play, but crawling at boxes alone gains more.

## 3. No-warning boxes (NOWARN)

Free, chill on, seeds 0–499, strikes 3, odds 4/10/30:

| NOWARN | No-warning boxes per map | Player meets one (per race) | Player falls at one | All player falls | Extinction per race | Lesson mean win |
|---|---|---|---|---|---|---|
| 0 (calibration, 1000 seeds) | 0 | 0 | 0 | 0.7% | 1.1% | 19.2% |
| 0.06 | 0.16 | 0.14 | 0.7% | 1.4% | 1.9% | 18.9% |
| 0.12 (now) | 0.37 | 0.31 | 1.5% | 2.1% | 2.2% | 18.4% |
| 0.20 | 0.60 | 0.50 | 2.5% | 3.1% | 3.4% | 18.1% |

Per box met, a player falls about 5% of the time with chill on. In the campaign with chill off, it is 29% (0.36 met per race, 10.6% of races end in a no-warning fall). No-warning boxes cause most falls, so NOWARN is in effect the "how often can extinction happen" knob. Win rate barely moves.

## 4. Interactions (small grid)

Free, chill on, seeds 0–499. Odds `o` = 4/10/30, `h` = 10/12/30.

| Strikes | NOWARN | Odds | Lesson mean win | Player dissolved | Extinction per race | Per fall | Rival dissolutions |
|---|---|---|---|---|---|---|---|
| 3 | 0.06 | o / h | 18.9% | 40.1% | 1.9% / 2.2% | 42% / 50% | 1.47 |
| 3 | 0.12 | o / h | 18.4% | 39.8% | 2.2% / 2.8% | 32% / 42% | 1.47 |
| 3 | 0.20 | o / h | 18.1% | 39.3% | 3.4% / 4.4% | 31% / 41% | 1.44 |
| 5 | 0.06 | o / h | 20.9% | 12.3% | 2.1% / 2.5% | 47% / 57% | 0.34 |
| 5 | 0.12 | o / h | 20.9% | 11.9% | 2.5% / 3.0% | 38% / 49% | 0.34 |
| 5 | 0.20 | o / h | 20.3% | 11.7% | 3.6% / 4.4% | 35% / 45% | 0.33 |

The knobs barely interact. Strikes set dissolution. NOWARN sets how many falls there are. Odds scale extinction per fall. None of them moves the others' effect by more than about 1 point.

## crawlTower = 0: real, not a bug

1. **Stops do leave barriers.** In 300 free seeds (chill on), 190 barriers were installed. 53 of them had a lab behind, and labs met them 104 times.
2. **No rival ever hit one, because none was ever short enough.** At the moment of installing, every lab behind could already reach over it. Reach (height + `C.JUMP` 34) minus barrier height was at least +14, with a median of +33. When labs met the barrier, the margin was at least +28. Chill off: 148 installs, 61 encounters, 0 crashes, same margins. A barrier is as tall as the installer's height (`installBarrier`, prototype.html line 2077), the installer built to about the box's rise, and followers share the same level ceiling plus catch-up investment. So a follower is almost always within one jump.
3. **The counter works.** When followers' heights were forced to 0 at the moment of installing (`tower-force.mjs`), the tower branch fired 10 times (`l.st.tc++`, line 2562).
4. **Answers to the specific questions:**
   - What installs a barrier: a lab within `C.STEPD + 110` = 260 of the face that stands still (|v| < 0.5) for 0.3 s sets `stopG` (line 2525). Its next move forward at v > 1 installs (line 2526). Below height 8 nothing is installed (line 2078), and only a taller barrier replaces one (line 2079). A crawl never installs one, since speed never drops under 0.5.
   - The barrier is a physical obstacle whatever the lab knows: the collision in `stepLab` (lines 2556–2566) checks `towerOf` and nothing else. In step mode it costs bounce and speed, never a strike (line 2567, by design).
   - The `stepDone` sign at line 2082 is right: `m.x >= stepX(g)` exempts only labs already at or past the barrier's spot. Labs still behind it are not exempted.
   - Rivals going "straight into the box" behind a crawling player is occlusion (the shadow in `shadows`, line 2171), not a missing barrier.

## What would show this is wrong

1. **People do not carry speed into boxes.** If real players already play like `crawl`, they almost never dissolve, and the extra strike does little. Telemetry or playtests would show this: the share of human races dissolved with a scrape among the strikes, set against the 28.7% (Medium, player 4) the lesson probes give. If people sit far below that, keep 3.
2. **People scrape far more than the lesson probes.** If human dissolution with player 4 is still above about 40% at Medium, the +1 is not enough.
3. **Free play overshoots.** Held out, player 4 puts free play 6 points above steps off. If Cole wants free play to match steps off exactly, a player-only 4 is too generous there. A smaller fix would be needed, for example 4 only while chill is off.
4. **Rivals.** The rival bots dissolve 1.4 of 3 per race with steps on, against 0.4 with steps off. If that makes races feel empty, the fix belongs in the rival policy (not carrying speed into boxes), not in `K.strikes`. Raising `K.strikes` cut the box-competent probes' wins by 13–19 points.
5. **Extinction.** If chill-on players report that falls never matter, raise `p1`/`pstep` to 10/12. In calibration that moved free-play extinction from 2.2% to 2.8% per race (under 3 SE), and it would also push the campaign above 11%.

## Limits of a bot-only test

- **No human model.** Every player is a perfect-handed bot (skill 100: no timing error, no misjudged distance). Humans will scrape, fall and misjudge more. Cole says the "your jump now" bar makes a box's outcome certain before committing, which makes human falls a choice more than a mistake. That is assumed here, not measured. The coordinator's earlier misjudging-player variant was dropped on that basis, and nothing here rests on it.
- **The box-competent probes are hand-written controllers** over a bot policy. They show what is achievable, not what people do. `smart` is a poor player (it stands still too long), and `crawl` stalls into time-outs on daily solo days, so the daily was not fairly tested with them.
- **Chill decides the extinction story.** Free play was run with chill on, the campaign with chill off. The two give opposite answers on whether extinction is rare.
- **Rivals are the same bots** that play boxes badly. A rival policy change would move every win rate here.
- **Campaign with steps forced on all nine maps,** with no map-specific `boxes` overrides beyond what the maps already carry. The campaign rework agent may change maps, which would change these numbers.
- **The daily was not tuned here.** The daily agent found that steps on drops the daily solo to 4–7% for the lesson probes. The player-only +1 should help there as it does in free play, but I did not run the daily on held-out dates.
- **Selection bias.** "Best probe" columns take the maximum of 11 players on the same block and are biased upward. Paired deltas against a probe chosen in calibration are the fairer comparison.
