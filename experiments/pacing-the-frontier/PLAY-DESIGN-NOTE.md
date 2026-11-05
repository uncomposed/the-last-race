# Design note: what the player gets better at

[[ai gen]] Written by Claude, 2026-11-05, after Cole's playtest of `check/lessons/lessons.html`; rewritten the same day around his reply. Not built. Nothing here has been played or measured. Mark it up; nothing gets built until this note is agreed.

## What the game is

The game is about **race dynamics**: understanding how a race plays out, then winning it and adapting as it changes. You play against the course and against the other labs at the same time, with three goals:

1. **Get to the end first.**
2. **Stay in the race.** Barriers give strikes, and strikes dissolve labs.
3. **Make sure nobody ends the game for everyone.** One reckless lab's fall can end the world, and yours with it.

These goals pull against each other, and how hard each one pulls changes from map to map. That tension is the game.

## Why this campaign is a desert

- **Max-out always wins.** Fill height and speed, then floor it. Nothing makes you pay for height or punishes speed, and every box pays to be taken at full speed.
- **Strikes never come up.** 12 of the 18 lesson maps have no barrier at all, and two more have only a low line or two low barriers (counted in `check/lessons/*/maps.js`). Without barriers, strikes can't happen. So no risky lab gets struck out early, and you have no way to herd one into a wall.
- **There's no variety.** One box, or a few of the same kind. There's nothing worth seeing past the next crest.
- **The card gives the answer.**

The earlier campaign had long tracks with walls, gaps, a singularity, rival rosters and difficulty tiers. The lesson maps dropped all of that.

## Three layers of skill

**Micro: the next few seconds.**
- Read a box or wall from what you can see.
- Pick a braking point and time the jump.
- Choose where to stop. Stopping now puts up a wall.
- Shade a rival out of sight of a hazard, or tuck in behind one.

**Macro: the whole race.**
- Spend investment across the course: how much height for the walls, how much sight for the boxes, how much speed for the finish.
- Pick when to lead and when to follow.
- **Coerce rivals.** Lead a reckless lab into a wall it can't see. Plant a wall it must stop for. Push the pack into a strike before the big box, so the risky labs are dissolved before they can roll the dice for everyone.
- Pick which box to spend your lead on.

**Meta: reading the map as it can be played.**
- Work out what this map rewards: risk or caution, racing or stopping, leading or tailing. The answer differs between maps and isn't on the card.
- Adapt when the map turns partway through.

## What the courses need

1. **Barriers that matter everywhere.**
   - Walls tall enough that height has to be paid for, in time and in speed you're not building.
   - Barriers are where strikes happen, so strikes become something you manage and something you inflict.
   - Hide some walls behind crests and behind rivals, so a lab running blind takes strikes.
2. **No single build wins every map.** Max-out has to have answers:
   - walls you can't clear on speed alone;
   - wide boxes that punish speed without sight;
   - close rivals that punish standing at the start to fill up;
   - maps where a fast, light lab beats a heavy one.
3. **Maps with a character.** Some reward risk (small boxes, low odds, a race decided on speed). Some reward caution (wide boxes, high odds, reckless rivals). Some change partway through.
4. **Rivals that create situations.** Each rival needs a temperament you can learn and exploit:
   - a sprinter you can bait into walls;
   - a steward that plants walls;
   - a gambler you need to strike out before the last box;
   - a tailer that uses your sight.

   Whether they adapt matters less than whether they give you openings.
5. **Something new past each crest.** That can be a new hazard kind, a rival's move, or a change in the road. The aim is a course you want to see the rest of.
6. **Strikes and the extinction count carry across an act.**

## How we check it, before you play it

These are bot tests run before handing it over. They can't show it's fun; only you can judge that.

- **Max-out loses.** The max-out bot (fill height and speed, floor it) loses most races in every act.
- **No single strategy dominates.** No one bot strategy is best on more than about a third of an act's maps.
- **Strikes happen.** Rivals are dissolved in a real share of races, and a bot that herds rivals into walls does better than one that doesn't.
- **A sensible driver loses.** The bot that cruises and slows for anything big loses most acts. A bot that reads the map and adapts wins clearly.
- **Replays differ.** The same race varies on replay, so it can't be memorized.

## Where to start

**The old nine campaign tracks, not the lesson maps.** They already have walls, strikes, rosters and length. The new mechanics (hidden-width boxes, the jump peek, sight shadows, walls that go up when you stop) get added to them. Then they're tuned until the tests above pass, and you play them.

## Questions for you

1. Coercion: is it enough to bait rivals into walls and plant walls in front of them, or do you want more direct tools? Examples: rivals that react to being shaded, or a way to signal a fake stop.
2. Should the extinction risk from a reckless rival be visible during the race (its odds, its strikes), so that striking it out is a choice you can see?
3. How harsh should carried-over strikes be? Options: dissolved means the act is lost, or you restart that race one strike down.
4. Should acts announce their character or leave it to be worked out? I'd lean to working it out, with the debrief saying what it was.

## Known side effect of the new wall rule

Too Late to Brake's claim now fails (37 to 0). The bot that braces for the worst stops at the box, and its wall most likely holds the rival behind it (`check/lessons/EXPERIMENTS.md`). Leading and stopping is now strong everywhere. That fits this note, since walls become a weapon, but it needs designing for. No map was changed.
