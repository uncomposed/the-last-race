# Knob review: which knobs tune the game

[[ai gen]] Written by Claude, 2026-10-31, from the sim in `check/hidden-width/page-hidden.html` (the same `K` and `C` as `prototype.html`, plus peek). Status: a proposal. Only the lesson harness uses the six rule knobs so far; the main game is unchanged.

## The short answer to "where is the extinction knob?"

It exists, but it's split up and hard to find. When a lab falls into a box, everyone's extinction chance is:

- **Generated maps:** `K.p1 + K.pstep × level`, so 4% at the first box, 14% at the second, 24% at the third, capped at 95%. The singularity gap adds `K.singOdds` (30) on top.
- **Hand-built maps (segments, lessons):** each box sets its own odds (`segBox(..., {odds: 25})`).

The lesson harness adds one knob over both: **Fall odds** (`K.oddsX`, 100%), which scales every box's odds.

## The six rule knobs

These are the knobs we expect to tune the game with. Lesson maps are tested at the low and high value of each (`check.mjs --grid`), and maps may not set them, except Act V maps (section below).

| Rule | Knob | Default | Grid | What it means in the story |
|---|---|---|---|---|
| Fall odds | `oddsX` (new) | 100% | 50, 150 | How likely a fall ends the world |
| Follower share | `share` | 40% | 20, 70 | How much of a breakthrough leaks to labs that didn't take the risk |
| Narrowing distance | `stepL0` | 25 | 12, 50 | How fast the first crosser's knowledge reaches the pack: the box narrows behind it |
| Sight per point | `sightX` (new) | 100% | 70, 130 | What investing in seeing ahead buys |
| Build rate | `invest` | 14/s | 10, 18 | The price of stopping: how long care takes |
| Strikes | `strikes` | 3 | 2, 4 | How many near misses a lab survives |

Why these six: each is a lever the research catalog says matters (first-mover prize, shared learning, the value of information, the cost of caution, tolerance for near misses). I have not yet shown that each one changes which posture wins; the lesson grids will. Peek stays on and isn't varied: you decided to keep it in some form.

## Added 2026-11-02: barrier spillover (`spill`), the follow reward at barriers

Cole asked for a dial on how much height a lab gains by watching another clear a barrier. The old rule gave each watcher a third of the wall's height, from every crossing in view, labs ahead included. So a watcher could end up taller than the lab it watched, and three crossings in view lifted the whole pack to the wall.

The new rule (`K.spillRule` 1, the default in the lesson pages):

- **Gain** = `spill`% × (the smaller of the wall and the crosser's height, minus the watcher's height), capped at the watcher's ceiling.
- **Once per barrier per watcher**, and **only labs behind the crosser**. It also applies to box steps, with the step's rise as the wall.
- With `spill` below 100, a watcher never passes the lab it watched, so leading always pays.
- **For the generator**, it is a closed-form height floor for followers at the next box: `h' = h + spill × (min(B, h_crosser) − h)`, alongside the crossing floor `B − 34`.

| Rule | Knob | Default | Grid | What it means in the story |
|---|---|---|---|---|
| Barrier spillover | `spill` | 40% | 0, 80 | How much of a breakthrough leaks to the labs watching it happen |

It is an experiment rule for now (`exp:1` in `lessons-sim.js`), so it is not yet in the judge's 13-set grid; run it with `--rules spill:N`. `--rules spillrule:0,spill:33` restores the old rule. The Hard Lessons daily twist sets it to 0 and still works. The judge results at 0, 40 and 80 are in `segmath/SEGMENT-MATH.md`.

## Everything else, and what I'd do with it

The sim has 35 `K` knobs and 37 `C` constants. Grouped:

1. **Candidates to promote later (fixed for now).** `refill` 50 (labs behind build up to 3× faster: the old finding that being behind is rewarded), `singOdds` 30 and `singSpeed` 3 (the singularity). These matter for some lessons, but adding them would double the grid.
2. **Penalties.** `bounce`, `capDist`, `capSecs`, `scrapeCap`, `dropH` (how big a miss still counts as a scrape), `strikeTower`, `strikeGap`. These are fixed physics of a crash or scrape.
3. **Generator only.** `barScale`, `gapScale`, `stepW`, `stepV`, `stepFit`, `riseScale`, `singGap`, and the `C.RISE*`, `C.WID*`, `C.TW*`, `C.LEAN`, `C.NOWARN`, `C.RISEFLOOR`, `C.HREF*`, `C.WREF*` constants. These shape generated tracks and do nothing on a hand-built map. When the generator is rebuilt from the lessons, most of these should be replaced by the features the lessons need.
4. **Physics.** `C.JUMP`, `C.ACC`, `C.DEC`, `C.TOP0`, `C.CAPS`, `C.SIGHT0`, `C.AIR0`, `K.airH` (air time grows with height), `C.BOXU`, `C.SEEANG`, plus input feel (`C.COYOTE`, `C.JBUF`). Treat as fixed. The "care band" (a careful lab clears only about 10% wider than a cruising one) comes from these, not from any knob.
5. **Bots.** `wary`, `skill`, `reaction`, `HANDS`. How bots play, not the rules.
6. **Modes and hooks.** `stepGaps`, `occlude`, `revealOnCross`, `peek`, `chill` (auto-jump), and the daily-twist hooks `shareRiv`, `investYou`.

## Recommendation for the main game (not done; your call)

1. Show only the six rule knobs in the knob panel, named as above. Move groups 2 to 6 out of `K` into named constants, so the panel can't wander into physics.
2. Merge `p1`, `pstep` and `singOdds` into one "Fall odds" scale on top of the per-level curve.
3. Do it once the lessons are in, so the lessons tell us whether these six are the right six.

What would show this is wrong: a lesson agent that can't teach its lesson without changing a knob outside the six, or a grid where a lesson breaks on a knob nobody would ever tune.

Cost to know: any change to the sim in `prototype.html` changes `SIM_HASH`, so the leaderboard server has to re-vendor the sim.

## Added 2026-11-05: world dials, the speed limit, and Act V

[[ai gen]] From `CAMPAIGN-PROPOSAL.md` section 4b, adopted by Cole.

- **World dials** are the six rules above plus spill: facts about the race nobody knows. Each has a `says` line in `RULES` for the map card.
- **The policy dial** is the speed limit (`pace`, `K.paceCap`, 0 off). Every lab's top speed is capped at it, and investment uses the top speed without the cap, so the speed nobody may use goes into the meters. Off, nothing changes (checked by outcome hashes on all 26 earlier maps). `?rules=pace:80` sets it. Paced maps need boxes crossable at the limit; on maps sized for full speed, races stall (proposal section 6c).
- **Who may set a dial:** only Act V maps, one each, as `dial:'announced'`, `'hidden'` or `'policy'`. `dialCheck` stops the page from loading otherwise. `whatIf(base, fields)` builds a twin of another map with one dial changed.
- **The dial room** on the page lets a player set any of them for any map, overriding a map's own dial. It writes `?rules=` and keeps nothing.
