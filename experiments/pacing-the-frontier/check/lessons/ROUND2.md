# Round 2: designer, adversary, judge

[[ai gen]] Written by Claude, 2026-10-31. The brief for round 2 of the lesson maps, and what happened. Read `LESSONS.md` first (format, harness, limits); this file changes what counts as done. Bot play only; nothing here is `human_validated`.

## Results: no map passes

Every judge run is on seeds 9001 to 9040, which no designer or adversary used. Full tables are in `judged/`.

| Judge run | Maps that pass (of 10) |
|---|---|
| Round 1 maps, stock pool (21 strategies) | 1: Still in the Air |
| Round 2 maps, stock pool | 8 |
| Round 2 maps, stock pool plus the adversaries' 12 strategies | 0 |
| The same, with chill mode on (auto-jump) | 0 |

1. **The designers improved their maps against the pool they could see.** Eight of ten passed it on the judge's seeds. The Minefield's designer measured +25 and +22 points on its own seeds; on the judge's seeds free-riding tied it. That's what a held-out judge is for.
2. **Two adversaries then beat or tied all ten.** Their strongest strategies, which a person would find:
   - **Fill, then floor it** (`x-fill`): stand at the start, fill height and speed, then go and never look. Ties or beats both See Early maps.
   - **Max-out with a lower Run slider** (`y-run40`): the old pool only tried max-out at Run 70. At most settings from Run 20 to 55 it wins Spend It Once every time. A close cousin, stop short of the box, fill height and speed, take the longest run-up and go blind (`x-se-ready`), ties Spend It Once and The Leader's Wall.
   - **Stay just ahead and tall** (`y-pace`): on Footsteps your height hides the box from the Racer, so it never floors it.
   - **Jump barriers early** (`x-hopfast`, `x-hop`): land just past the barrier, then jump the box fresh. Beats Still in the Air and The Last Box, but only when jumping by hand.
   - **Stand a run-up short at every box, fill, go** (`y-prep`): beats The Minefield by 18.
3. **The harness tested the wrong mode.** The page starts in chill mode (auto-jump, no Jump button). Every check until now ran with chill off, jumping by hand. With chill on, the early-jump exploits go, but several lessons collapse too: Spend It Once's lesson wins 0%, Six Unknown Boxes 3%. The maps were tuned for a mode a new player isn't in. `judge.mjs --chill 1` now tests it.
4. **Some lesson postures cheat.** The See Early posture checks for a second box before it's in view (`seChain`). Four Small Risks helpers read barrier positions or box widths without a visibility check. A lesson strategy has to be something a player can do, so those have to be fixed whatever else happens.

## What it says

The lessons that are about seeing or judging all lost to a strategy that ignores information: fill the meters, then go. **Information only has value when what you learn changes what you should do.** On every one of these maps, one action is best on every variant: be full, then go. So looking only costs time.

For a lesson about seeing to win, a map needs variants where the full-and-fast action is wrong. Some ideas:

1. A box where arriving at full speed is a mistake, such as a barrier or a second box just past the landing.
2. A box too wide for anyone, where the right move is to stop and let it narrow, or wait.
3. Rivals who punish a long stop at the start, so filling up first costs the race.

Each variant needs a different best response, so the only way to choose is to look. That's a design rule for round 3, and a test the judge can run: does any single fixed strategy win every variant? If so, the map can't teach looking.

## What this doesn't show

- One standard error on a 40-seed win rate near 50% is about 8 points, so gaps that small are ties.
- The adversaries' strategies are bots too. A person may find better ones, or fail to execute these.
- Fun isn't measured. Cole enjoyed The Last Box and The Minefield in round 1.

## Why round 2

Cole played round 1 and found max-out (build height and speed while running, never look, floor it) beating maps whose lessons four designers and an audit had signed off. The designers had checked their maps only against foils they picked themselves. Cole's rule since then: "The point is winning, not teaching a lesson. Our goal is to make the lesson the way to win."

So round 2 separates three jobs:

1. **Designer.** Names the winning strategy before building, then builds a map where that strategy is how you win. Tunes on seeds 1 to 40.
2. **Adversary.** A separate agent that reads the finished maps and writes new strategies (in `adversary/*.js`) to beat them. It doesn't read the designers' notes.
3. **Judge.** `judge.mjs`, on seeds 9001 to 9040, which no designer or adversary tunes on. A map passes when its lesson strategy beats the best adversary by 15 points at the default rules and beats the best adversary in at least 10 of the 13 rule sets. Only maps that pass go to Cole.

## For a designer

1. **Before tuning, write the lesson strategy in your NOTES.md**: one sentence a player could follow, and the posture that plays it. Put the posture name on the map as `strategy: 'name'`. You may not change it after you see the judge, because you don't run the judge.
2. **Play to win first.** Before you write a lesson posture, ask what a player who only wants to win does on this map. The pool in `lessons-sim.js` (`ADV`, plus `maxout`) is the start of that list, not the end. On round 1's maps the most common winner was free-riding: hold back until someone else shows the width, then go. Max-out was next.
3. **Reach for structure before numbers.** Round 1 tuned widths and odds. Try what's on the track and in what order: spacing, which lab is ahead, who can see what and when, how far the finish is past the last box, how the rivals behave, barriers, a second box. Track spacing matters a lot: max-out only works when there's open track to fill both meters before the box.
4. **Free-riding is a lesson too, but only on the map that teaches it.** Waiting for someone else to take the risk is the fast-follower story, and a map may teach it. On any other map, if waiting beats your lesson, the map teaches waiting. Ways to make waiting cost something: the finish is close past the box, so whoever crosses first wins; the rivals behind you are cautious, so nobody shows you the width; the first lab across takes a ceiling it needs later.
5. **Your loop.**
   ```
   node build.mjs --only <lesson>
   node exp.mjs --page <lesson>/page.html --map <key>
   node check.mjs --only <lesson> --map <key> --grid
   ```
   `exp.mjs` plays the whole pool and your strategy on seeds 1 to 40 and prints each one's win rate. You're aiming for your strategy at least 15 points above the best adversary, at the default rules and across the grid. You may also look at seeds 1001 to 1040 (`--start 1001`). **Never run `judge.mjs` and never use seeds 9001 and up.**
6. **What counts as a map.** It's fine to rebuild a map from scratch, keep its key and title, or retire it and add a new one. Keep two or three maps per lesson, with clearly different mechanisms. Keep the lesson honest to the source it came from (see your NOTES.md and `research/LESSON-CATALOG.md`).
7. **Rule changes are proposals.** The trial rules (`brake`, `brakesight`, `space`, `wallstop` in `RULES`) and the six knobs are not yours to set on a map. If your lesson needs one, say so in NOTES.md with the metaphor reason.

## For the adversary

1. Your job is to win, on each lesson map, by any strategy a person could play. Read the maps (`*/maps.js`: the track, the rivals and the lesson posture) and the sim, but not the designers' NOTES.md.
2. Write strategies in `adversary/*.js` as postures (`SGC.name`, `SGP.name`, `NOPEEK.name`, as in `lessons-sim.js`) and push each name onto `ADV`. Prefix names with `x-`. A strategy may be written for one map. It must use only what a player can see on screen: no reading hidden widths, future rival moves or the seed.
3. Your loop: `node build.mjs --only <lesson>`, then `node exp.mjs --page <lesson>/page.html --map <key>` on seeds 1 to 40 or 1001 to 1040. Never seeds 9001 and up, never `judge.mjs`.
4. Hand back in `adversary/NOTES.md`: per map, your best strategy in a sentence, its win rate against the lesson strategy's, and whether it's something a person would find.

## Hand back

In your NOTES.md, a new section "Round 2" at the top, short, for a reader who listens by text-to-speech:

1. Per map: the lesson strategy in one sentence, why it wins (what the player sees at the moment of choice), and the `exp.mjs` line: your strategy's win rate, the best adversary and its rate, on seeds 1 to 40 and 1001 to 1040.
2. The strongest strategy you found that isn't in the pool, if any. The adversary will look for it anyway.
3. What you tried that didn't work, a line each.
4. What isn't shown.
