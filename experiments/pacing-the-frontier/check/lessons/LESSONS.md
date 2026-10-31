# Lesson maps: hand-built maps that each teach one lesson

[[ai gen]] Written by Claude, 2026-10-31. This is the brief and the rules for anyone building lesson maps, human or agent.

## The goal

Cole wants maps that each teach one real lesson about AI racing, through the boxes and barriers, so that a player comes away having felt it. Later the best of these become the spec for the procedural generator: it should learn to make maps with the same features. So a good lesson map is:

1. **Felt, not explained.** The header asks one question. The track, rivals and box make the answer matter. If the header has to carry the lesson, the map has failed.
2. **A real choice.** The lesson strategy should beat its foil in a way the player can see happen. A claim like "careful never falls" is cheap: in the example map, Build never falls but never wins either.
3. **Robust.** The lesson should survive the game being retuned. It should rest on what labs can see, and in what order, with wide margins, not on a box tuned to within a few percent of someone's reach.
4. **Varied.** Each lesson gets two or three maps that teach it through clearly different mechanisms (what you can see, how the rivals behave, barriers, strikes, the order of boxes), not the same map with a different width.

## The game, briefly

Read `../segments/SEGMENTS.md` (twelve hand-built segments and what the bots showed), `../hidden-width/HIDDEN-WIDTH.md` (the hidden-width box, the first mechanism Cole validated by playing), and `../segments/segments-sim.js` (the map format and bot postures). In short:

- Labs race along a track. Each has three meters, sight, height and speed, under a ceiling that rises with every box crossed. Building fills the meters; running moves you.
- **Boxes** are risks no one can size in advance. A box's far edge is hidden until you can see over its top, or until someone has crossed, scraped or fallen there. Clear it clean, scrape it (costs a strike), or fall in (that lab is out, and everyone rolls the box's extinction odds).
- **Barriers** are jumped with height plus jump. Crashing into a track barrier costs speed and a strike. A lab that stops in front of a box and builds leaves a barrier of its own height there; labs behind that crash into it lose speed but no strike. Clearing a barrier in view of rivals spills some of its height to them.
- **Sight shadow:** a lab ahead hides the road from labs behind of equal or lower height. **Peek:** in the air, your eye rises, so you can see a box's face over a rival, never its width. Bots peek when shadowed. Rush never peeks.
- **First across** a box gets the next ceiling. Every other lab gets the follower share of the raise. A crossed box narrows for everyone behind as the first lab moves on past it.
- Strikes: three dissolve a lab. The first lab to the finish wins; nobody scores for surviving.

Cole's settled rules are in his notes, and he treats them as opinions open to challenge: falls should come from being forced (too little sight to brake or build), not from misjudging; no more than about three stop-and-reverses per map; some boxes may allow only a scrape.

## The rule knobs (read `KNOBS.md`)

Six knobs are the rules the game will be tuned with: fall odds, follower share, narrowing distance, sight per point, build rate and strikes. **A map never sets them.** `check.mjs --grid` reruns your claim at each one's low and high value. A break is information, not failure: it says which rule your lesson leans on. Report it plainly.

Fall odds are the one exception in spirit: each box sets its own odds (`segBox(..., {odds: 25})`), because how much a box can end the world is part of the map. The rule knob scales them all.

## The format

Put your maps in `<your-lesson>/maps.js`. See `example/maps.js`. A map is a segment (fields as in `segments-sim.js`: `labs`, `track`, `q`, `meta`, `look`) plus:

- `key`: short, unique, lowercase with dashes; used in links (`?map=key`)
- `lesson`: the lesson's name, shown in the header
- `postures`: what "you" plays in the check (default `rush`, `build`, `wait`)
- `claim`: `{text, score(t), need}`. `t[posture]` is `{win, fall, diss, ext, none}` in percent; the claim holds when `score(t) >= need`

You can add postures for your lesson in the same file: `SGP.myname = function(l, g, st) {...}` (runs once a box is next and seen), `SGC.myname = function(l) {...}` (runs while cruising; return `null` for the default bot), `NOPEEK.myname = 1` (never hops to peek). Prefix posture names with your lesson key so they don't collide.

## The loop

```
node build.mjs --only <your-lesson>
node check.mjs --only <your-lesson> --grid
node check.mjs --only <your-lesson> --heldout --grid
```

- Tune on seeds 1 to 40 (the default). Report the held-out block (`--heldout`, seeds 1001 to 1040) too, and never tune on it.
- One map takes about 10 seconds for the full grid.
- Every map is also run against **maxout** (in `lessons-sim.js`): build height and speed while running, never look, then floor it. Cole found it by playing, and it beat two maps' lessons. If maxout wins as often as your lesson's strategy, the map doesn't teach it.
- To play: serve `check/` over http (`python3 -m http.server 8765 --directory experiments/pacing-the-frontier/check`) and open `/lessons/<your-lesson>/page.html?map=<key>`. Add `&rules=share:70` to play under a rule variant.

## What to hand back

In `<your-lesson>/NOTES.md`, short, for a reader who listens by text-to-speech:

1. For each map: the lesson in one sentence, how a player sees it happen (what's on screen at the moment of choice), the claim, the base table, the held-out score, and the grid line ("holds in 11 of 13; breaks at share 70").
2. What you tried that didn't work, in a line each. That's as useful as what did.
3. Any rule change you think the lesson needs, as a proposal with the metaphor reason. Don't make it.
4. What isn't shown. Bots aren't people, and nothing here is `human_validated` until Cole plays it.

## Limits for agents

- Write only inside your own lesson folder. Don't edit `build.mjs`, `check.mjs`, `lessons-sim.js`, the segments or hidden-width files, or another lesson's folder. If the harness blocks you, say so in NOTES.md.
- Don't run `node build.mjs` without `--only` (it writes the shared `lessons.html`).
- Don't commit, push or switch branches.
- Never invent a source or a number. Every figure comes from a check you ran.
