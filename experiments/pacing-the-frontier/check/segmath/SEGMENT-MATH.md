# Segment math

[[ai gen]] Written by Claude, 2026-11-02, at Cole's request: equations instead of searches, so we can say which strategy wins a segment before anyone races it. Status: the box equations are verified against the sim's own flight rule. The regime predictions for the ten round 2 maps are compared with the judge below. Nothing here is human_validated.

Run it:

```
node segmath.mjs --verify
node segmath.mjs
```

## The short version

1. Every point a lab invests costs it a fixed slice of time: 1/14 of a second when it leads.
2. Whether a lab clears a box is a simple formula in its height, its speed and the box's rise and width.
3. Put those together with when the first rival reaches the end of the segment, and you get a budget. Comparing the budget with what the box needs gives one of four regimes. Only one of them makes looking the way to win.
4. Nine of the ten round 2 maps have no variant in that regime. That's why the judge found a no-look strategy winning every one of them.

## The equations

All numbers come from `check/hidden-width/page-hidden.html`, which has the same `K` and `C` as the lesson pages. Points are sight, height and speed, as in the sim.

### 1. The budget

A lab invests `invest × M × (1 − v / top)` points per second (the `stepLab` investment line). `invest` is 14. `top` is its top speed, `50 + 0.85 × speed points`. `M` is the catch-up bonus, `1 + (how far behind the leader) / 250`, capped at 3 (the refill knob). Add that up over any trip of length `L` that took time `t`:

`points invested = invest × M × (t − L / top)`

This holds whatever the lab's speed did on the way: speeding up, cruising, braking or standing. The one exception is a stretch with the throttle floored, which invests nothing. So the price of a point is `1 / (invest × M)` seconds of arrival time: 1/14 s when you lead, as little as 1/42 s when you are 500 behind.

### 2. The box

A jump at speed `v` carries `carry(v) = v × jumpDur(v)`, which is `0.56 v + 38` across the usual speed range. With height `H`, a box of rise `R` is cleared clean up to the width

- `clean = carry(v) × (0.75 − asin((R − H) / 74.8) / π)` when the box is taller than the lab but within its 34 of jump, and
- `clean = carry(v) × (0.75 + (H − R) / 235)` when the lab is at least as tall as the box.

For small `R − H` the first is almost exactly `carry(v) × (0.75 − (R − H) / 235)`. The lab lands at all (a scrape, not a fall) up to

`land = carry(v) × (0.75 + H / 235)`

A lab more than 34 below the rise can't clear it clean at all: it goes in through the side.

`--verify` integrates the sim's own `flightAlt` over 180 combinations of height, speed and rise. The closed forms match it to within 0.001 track units.

Two consequences:

1. **Height and speed are near-perfect substitutes at a box.** A point of either buys about 0.3 to 0.36 of width. So a choice between those two pools means nothing at a box. Their other jobs do differ: height for barriers and for seeing over boxes, speed for reaching the finish.
2. **The scrape band grows with the box's rise:** `land − clean ≈ carry(v) × R / 235`. A tall box gives a wide warning band; a low box gives almost none. This is the "no warning shot" shape from Cole's rules, in one line.

### 3. Barriers set a floor

A lab gets past a barrier of height `B` only with `height + 34 ≥ B`, so everyone past it has height of at least `B − 34`. Labs that watch someone cross it gain up to `B × 33%` (spill). So the lowest height anyone can have at the next box is known in advance.

### 4. Following

A crossed box narrows behind the first lab across. Its width becomes `W / (1 + d / 125)`, where `d` is how far the leader is past the box's face (the `stepL0` knob, 25, times 5). A second of waiting behind a crosser running at 90 cuts the box by about 40%. A second of building buys about 14 × 0.33 ≈ 5 width. On a box 90 wide, waiting is six to eight times as strong as building. This is why free-riding kept winning in round 1.

## The four regimes

For each segment (where you start, one box with its width variants, the rivals, and where the segment ends):

1. **The race clock.** It's the time the first rival that gets across the box reaches the end of the segment. The end is the finish, or the next obstacle.
2. **Your budget.** It's the points you can invest and still beat that rival to the end, from equation 1.
3. **Need.** It's the fewest height and speed points that keep you out of the box (a scrape at worst), from equation 2. The table also shows the clean need.
4. **Fill.** It's what filling height and speed to the ceiling costs.

Then, for each width variant:

| Regime | When | What wins | What it teaches |
|---|---|---|---|
| 1 | budget ≥ fill | max out, never look | nothing; a lull at best |
| 2 | budget ≥ the widest variant's need | prepare for the worst, blind | "buy what this risk needs" |
| 3 | budget ≥ this variant's need, < the widest's | only a lab that knows the width is both safe and on time | seeing early wins |
| 4 | budget < this variant's need | nobody is both safe and on time: gamble, follow, or lose | the race won't let you be safe |

In seconds: looking pays when the race leaves you more slack than the narrowest variant needs and less than the widest needs. Divide the needs by 14 to get those seconds. That window is printed for every map.

## The ten round 2 maps

Each map is reduced to the box its lesson is about (`maps.mjs`, with what each reduction leaves out). The rival postures are reduced to three:

- **go:** floor it when the box comes into sight.
- **dash:** floor it from 250 out.
- **stop:** stand short, learn the width, build what it needs, then go.

| Map | Regime (share of seeds) | Slack the race leaves | Window where looking pays | Judge: best adversary vs lesson | Agrees? |
|---|---|---|---|---|---|
| Footsteps | 1 (50%), 3 (25%), 4 (25%) | 2.1 to 16.5 s | 0 to 3.4 s | y-pace 100 vs 90 | **No**: see below |
| The Leader’s Wall | 1 | unlimited (no racer gets across) | 0.1 to 1.7 s | y-look 100 vs 100 | yes |
| Spend It Once | 1 | 19 s | 5.1 to 6.4 s | x-se-ready 100 vs 100 | yes |
| Too Late to Brake | 1 | 9.2 to 11.9 s | 0 to 4.7 s | x-fill 100 vs 98 | yes |
| The Box Behind the Box | 1 | 7.3 to 8.7 s | 0 to 3.1 s | x-fill 100 vs 93 | yes |
| The Pack Dives Together | 1 | 6.9 to 8.9 s | 0 to 3.1 s | maxout 100 vs 90 | yes |
| Still in the Air | 1 | 1.2 s | none (every box needs 0) | x-hopfast 100 vs 95 | yes |
| Six Unknown Boxes | 1 | 4.8 s | 0 to 0.1 s | x-steady120 58 vs 48 | yes |
| The Last Box | 2 | 0.5 s | none | x-hop 100 vs 100 | yes |
| The Minefield | 1 (60%), 4 (40%) | −1.9 to 5.4 s | 0 to 2.8 s | y-prep 68 vs 50 | partly |

Prediction: on a map with no regime 3 variant, a strategy that never looks ties or beats any lesson about looking. The judge's best adversary on all ten maps is a no-look strategy (y-look looks, but only after standing and filling height, and on The Leader's Wall nobody else gets across, so what it sees changes nothing).

1. **Eight agree outright.** On seven maps the race leaves more slack than the widest box needs, often two or three times more. The rivals start far back, cruise slowly, or never get across. On The Last Box, filling is just out of reach but no box needs anything.
2. **Footsteps disagrees, and the reason is useful.** It's the only map with a regime 3 variant: with the Racer on your tail and a box of normal width, only a lab that knows the width is safe and on time. Yet y-pace wins every seed without looking. It stays just ahead of the Racer and taller than it, and that hides the box from the Racer, so the Racer never floors it. The equations treat the Racer's timetable as fixed. Sight shadows let you change a rival's timetable, and that's outside the model. Shadows are the next thing to add.
3. **The Minefield partly agrees.** In its narrow 40%, the rushers start ahead and are faster, so you can't beat them to box 2 unless they fall later (regime 4). The model looks at box 1 only, so it can't say how often they fall at boxes 2 and 3. The judge found about 6 seeds in 40 that nobody can win.

## What this doesn't show

1. **Top speed:** the budget uses your top speed at the start, so it slightly undercounts a lab that builds speed on the way.
2. **Catch-up bonus:** for rivals it's taken from their start gap and held fixed.
3. **Postures:** the three rival postures are simplifications of the real ones. Pounce, the wall, the painted line and sight shadows are left out. Each map's `left` note says what.
4. **One box per map:** for maps with several boxes, only the lesson's box is modelled. Strike budgets across several boxes (Still in the Air, The Last Box, Six Unknown Boxes) aren't modelled yet.
5. **Runs only checked by bots:** the regime only says which kind of strategy can win. Bot play confirmed it for nine maps; nobody has played to check it.

## What it means for the generator

1. **Design backwards from the regime.** Pick the regime a segment should be in, then solve for the rival's timing, the distance to the box and the widths. Regime 3 needs the slack to land inside a window that's a few seconds wide: between the narrow variant's need and the wide one's, divided by 14. Today's maps leave 7 to 19 seconds.
2. **Segments knit by addition.** The budget identity adds across segments, so a run is a sequence of regimes, such as a lull, a "buy what you need" box, then a box that looks the same but is regime 3 or 4. That's the "easier than expected here doesn't mean easier next" lesson, built in.
3. **Two knobs are overpowered, and the math says by how much.** First, narrowing: waiting behind a crosser is six to eight times as strong as building. Second, refill: a lab 500 behind pays a third as much per point, which is part of why standing still at the start to fill works. Both should be fixed, or deliberately priced, before new maps are built on them.
4. **The knobs map onto terms:**
   - investment rate is the price of time;
   - refill is `M`;
   - narrowing is the following term;
   - strikes and fall odds are what a scrape or a fall costs;
   - sight per point, braking from sight, and peek set when you learn the width, which decides whether regime 3 is reachable at all (seeing the width before your braking distance, about 226 at top speed).
5. **Bots become an audit, not a search.** One bot run per finished segment, against the adversary pool, catches mechanisms the equations miss. Footsteps' shadow trick is the example.

## First design from the equations: Measure Twice (2026-11-02)

[[ai gen]] Status: implemented, audited, **failed**. `design.mjs` solves for one box with a narrow and a wide variant and one rival who plans once it sees the width. The map is `check/lessons/look-pays/maps.js`. Build it with `node build.mjs --only look-pays`.

On paper the last version works:

- narrow box: the race leaves you 22 points of slack, and bracing blind for the wide box needs 32;
- wide box: the rival stops to build, and you have 87.

The judge disagrees (seeds 9001 to 9040, one run each):

| Jump mode | Looking wins | Best adversary | Verdict |
|---|---|---|---|
| auto-jump (the page's default) | 70% | build 95% | fail |
| by hand | 100% | max-out 100% | fail (no lesson) |

The narrow variant behaved as designed in the sim in some versions: max-out and fill-first lost every narrow seed while looking won every one. Four things the equations leave out broke the rest. Each was found by tracing a single seed.

1. **Sight shadows decide who can look.** A lab ahead hides the box from a lab behind it. With the rival behind you, you blind it, so it never learns the width and floors it into the wide box. With it a little ahead, you pass it before it sees, with the same result. A rival can only plan if it learns the width before anyone overtakes it. That's a timing constraint the equations now need.
2. **The run-up.** A lab that learns the width late and stops close to the box can't reach top speed again before the face. Height needs no run-up, so a late looker should buy height. `design.mjs` now prices the run-up from where you stop (`standNeed`).
3. **Speed points pay for themselves.** The budget uses your starting top speed. But a speed point raises top speed by 0.85, which saves `0.85 × D / top²` seconds over the `D` still to run, and it costs 1/14 s. So it pays back whenever the road left is longer than `top² / 12`: about 480 at top speed 75, 720 at 92, and 1,000 at the ceiling. On a box 700 out, everyone arrives with speed full no matter what. This is a big part of why max-out keeps winning. The budget needs a speed-payback term, or labs should start segments near the speed ceiling.
4. **Auto-jump changes the box equations.** With auto-jump the take-off comes later in the arc (`u0 = 0.3 / jumpDur` instead of 0.25), so the flight after it is shorter. At top speed and full height, the landing width falls from about 104 to about 96. The same box that everyone falls into with auto-jump, everyone clears jumping by hand. The formulas above are for jumping by hand. They need a chill version, and a map has to be designed for one mode.

What this means: the equations got the narrow variant right whenever the sim matched their assumptions, so the approach holds up. But looking can only win when the rival can look too, and in this sim that is mostly a question of shadows and overtaking. Next: add those four terms to the calculator, then design again.

## Second design, with the four terms: Measure Twice passes (2026-11-02)

[[ai gen]] Status: implemented and verified by the judge. Not yet played by Cole, so not human_validated.

`terms.mjs` adds the four terms, each checked against the sim's own code (`node terms.mjs`):

1. **Jump mode.** Box widths for auto-jump and for jumping by hand. Exact in 192 cases.
2. **Backing up.** A lab can always back up for a run-up (Cole: a stopped lab's guard doesn't block it), so a late stop costs time, not the crossing. Matches the sim within 0.002 s.
3. **The ledger.** A lab's time is the distance at its top speed, plus every point it buys divided by the build rate, plus what flooring it costs. Exact. Two results follow:
   - speed bought early pays itself back over more road than `top² / 12`;
   - a lab that speeds up from rest without flooring it gets `14 × top / 80` points free (13 to 19).
4. **Shadows.** The sim's rule, used as constraints: the rival must see the width before you catch it, and you must pass it before you need to see.

`design.mjs` turns these into closed-form times for the rival and for four ways to play (look, rush, blind prep, fill). It then searches design parameters (not races) for designs where looking beats the rival in both variants while blind prep, fill and rush each lose one. 159 designs pass, with margins under a second. The chosen one:

- **The box:** 600 out, rise 10, either 55 or 95 wide, with the finish 80 past it. Falls roll 40%.
- **You:** sight 45, height 20, speed 60. You're short, so you can tell the width only from 132 out, and you slow to 62 to be able to stop there.
- **The rival:** 50 ahead with sight 70, height 50, speed 30. It floors it, and it can tell the width from 332 out, before you catch it at about 294.

| | Rival | Look | Rush | Blind prep | Fill |
|---|---|---|---|---|---|
| Narrow, predicted | 10.0 s | 9.2 s | 8.5 s | 10.9 s | 11.0 s |
| Wide, predicted | 22.7 s | 21.7 s | falls | | |

The judge (seeds 9001 to 9040, 33 adversaries, 13 rule sets) passes it in both jump modes. Looking wins 100%. The best adversary, a rush-style strategy, wins 70%: every narrow seed and no wide one. Seed 9004 (wide) ran close to the prediction: you finished in 20.6 s against 21.7 predicted, and the rival crossed at 20.4. The map loses its margin only at the two build-rate extremes (10 and 18 points a second), as expected. The build rate is the price of time, so it moves every budget.

What this does not show:

1. **I wrote the rival.** The judge tests your strategies against it, not whether a lab would play like that.
2. **Two-variant knowledge.** The bots use the rule "seeing past 55 without the far edge means wide". A player has to be told the two widths, and the map's text does that.
3. **One segment, not a run.** It starts with speed mostly bought (60 of 70), which sidesteps the speed payback rather than fixing it.
4. **Nobody has played it.**

## Barrier spillover: the new rule, judged at 0, 40 and 80 (2026-11-02)

[[ai gen]] Cole asked for a spill dial and a more balanced formula. The new rule (built into the lesson pages by `lessons/build.mjs`; knob table in `lessons/KNOBS.md`): a lab that clears a barrier lifts each lab behind it that saw it by `spill`% × (min(wall, crosser's height) − watcher's height), once per barrier per watcher. The old rule gave a third of the wall's height from every crossing in view, labs ahead included. Five hand-written scenarios match the worked numbers (one crosser at 50 or 90; three crossers do not stack; a watcher above the crosser gains nothing).

Judge, seeds 9001-9040, auto-jump on. Lesson strategy's win rate, then the margin over the best adversary:

| Map | Old rule (33% of wall) | New, spill 0 | New, spill 40 | New, spill 80 |
|---|---|---|---|---|
| Measure Twice | 100%, +30, **pass** | same | same | same |
| Still in the Air (`sr-landing`) | 75%, −25 | 30%, −70 | 10%, −90 | 5%, −95 |
| The Last Box (`sr-lastbox`) | 83%, −17 | 0%, −98 | 0%, −98 | 0%, −93 |
| The Minefield | 58%, −5 | 60%, −5 | 60%, −5 | 60%, −5 |
| The other seven | unchanged | unchanged | unchanged | unchanged |

What it shows:

1. **The amount barely matters on today's maps; the rule does.** Between 0 and 80, only Still in the Air moves. The new rule pays only when the crosser is taller than the watcher, and these maps rarely make that happen. A generator that wants spill to matter has to build height differences into the pack.
2. **The Last Box ran on the old rule's free height.** On seed 9001 "you" gained 62 height by watching an equal-height rival cross four walls (17 + 2 + 18 + 25). Under the new rule an equal-height watcher learns nothing, arrives short and scrapes. That is the rule doing what it was meant to do; the map's lesson strategy has to be redesigned, not the rule loosened.
3. **Still in the Air gets worse as spill rises** (30% to 5%): spill lifts the rivals behind you more than it lifts you.
4. **Measure Twice still passes**, unchanged: its rival is the taller lab and is ahead, so nothing spills to it.

What it does not show: bot play only, one seed block, auto-jump only (jump by hand not run), and no map yet built to test spill on purpose. Status: verified, not human_validated.
