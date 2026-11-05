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
6. **Strikes reset every race. If your lab is dissolved, or the world ends, the act is lost** (Cole, 2026-11-05: restarting that far back only wastes the player's time).
7. **Acts never announce their character.** The player works it out from play. This is a dark forest, not a cheerful, well-lit one. The debrief says what it was.

## Design for play first; bots are guard rails

The one-shot prototype was fun, and no bot test was involved. The lesson maps were built to pass bot claims, and they played boring. So design comes first: courses are built to be played, with races, rivals, barriers and variety, the way the prototype and the old campaign were. The bots are not the target. They only catch a few known failures before you play:

- **Max-out loses.** A max-out bot that fills height and speed and floors it, but still looks and stops when it sees trouble, loses most races in every act. The old max-out bot never looked, so it lost races that a person playing max-out with their eyes open wins. That is part of why the lesson checks passed while the maps played easy.
- **No single strategy dominates.** No one bot strategy is best on more than about a third of an act's maps.
- **Strikes happen.** Rivals are dissolved in a real share of races, and a bot that herds rivals into walls does better than one that doesn't.
- **A sensible driver loses.** The bot that cruises and slows for anything big loses most acts. A bot that reads the map and adapts wins clearly.
- **Replays differ.** The same race varies on replay, so it can't be memorized.

## Where to start

**Not the old nine tracks.** Cole: they were tested many times, and their barriers force near-maximum height before any box appears. So every lab arrives at the decision built the same way, and the only choice left is when to floor it. Adding the new mechanics doesn't change that.

**Different dominant strategies need a tight budget.** In the segment math, a lab's budget is the build it can buy before it must commit: invest × refill × (time − distance ÷ top speed). Need is what the hazards ask for. Wherever budget covers need, max-out wins (regime 1). That describes the old tracks, and, as played by a person who looks, most of the lesson maps too. A map gets its own dominant strategy only when its budget falls short of need in its own way:

- **Short spacing, tall walls:** build height only; sight is wasted.
- **Low walls, hidden wide boxes:** sight wins; height and speed alone fall in.
- **Small boxes, close race:** speed and nerve win; stopping hands the race away.
- **A reckless roster near a red box:** walls and baiting win; strike them out before they roll.

The first build should be two such maps, each about a minute long. Bots only check that max-out-with-eyes loses on both and that the winning build differs between them. Then Cole plays them, before anything else is built.

## Decided (Cole, 2026-11-05)

- Dissolved means the act is lost.
- Acts never announce their character.
- Strikes are already shown in the race.
- Coercion stays emergent: no special tools. Walls, sight shadows and rival temperaments create the openings.
- No fall odds during play. The box's red hatching already says it is bad. The exact number appears only when a fall rolls and in the debrief, so the lesson cards' "Falls roll N%" and the singularity panel's odds come out of play.

## Open

Nothing. The note is ready to build from once Cole says go.

## Known side effect of the new wall rule

Too Late to Brake's claim now fails (37 to 0). The bot that braces for the worst stops at the box, and its wall most likely holds the rival behind it (`check/lessons/EXPERIMENTS.md`). Leading and stopping is now strong everywhere. That fits this note, since walls become a weapon, but it needs designing for. No map was changed.
