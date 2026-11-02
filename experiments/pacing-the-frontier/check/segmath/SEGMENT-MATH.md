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
