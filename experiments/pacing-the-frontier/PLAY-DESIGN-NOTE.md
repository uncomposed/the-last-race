# Design note: what the player gets better at

[[ai gen]] Written by Claude, 2026-11-05, after Cole's playtest of `check/lessons/lessons.html`. Not built. Nothing here has been played or measured. Mark it up; nothing gets built until this note is agreed.

## What the playtest showed

- **Every map fell in one or two tries,** with no thinking and no change of strategy, even jumping by hand. Map 5 was the exception, and only because its wall rule was broken (fixed in `2bc6e55`).
- **There were few surprises and nothing to get better at,** within a race or across the campaign.
- **The card handed over the answer** before the race started.
- **The lesson maps went backwards from the old campaign.** That campaign already had long tracks with mixed boxes and walls, rival rosters and difficulty tiers (`DESIGN-NOTES.md`, "Campaign maps").

**Why.** Each map was built to make a claim pass: one bot strategy beats about four other bot strategies by 15 points. Nobody checked what a person does without thinking: drive sensibly, slow down for anything big. If that is enough to win, the map teaches nothing, however well its claim holds.

## 1. The core skill

**Reading a box from what you can see, and deciding how much to give up to see more.**

From the cues in front of you, judge whether you can clear the box and what lies past it. The cues are:
- how tall the face is;
- how much of the top you can see from your eye height;
- what rivals ahead do, including whether they fall;
- what the road so far has been like.

Then choose how fast to arrive and where to stop. Stopping costs ground, and it is also what puts up a wall behind you.

This is a judgment, not a rule, and judgments improve with practice. It also maps straight onto the thesis. You can't size an alignment problem until you're close to it. The choice is how much capability you hold back to see further, and how much your rivals' choices make that affordable.

**What getting better looks like.**
- Fewer stops that turn out to be unnecessary, and fewer leaps that turn out to be mistakes.
- Spotting earlier when a road is turning wide.
- Reading rivals as information: a lab that stops ahead of you is telling you something.
- Planting walls on purpose, not by accident.

## 2. The race: many decisions, each with feedback

- **Length:** a race lasts 60 to 120 seconds and has 6 to 10 boxes and walls, not one box.
- **One read per box:** each box is a read-and-commit about every 5 to 10 seconds.
- **Every read gets an answer within seconds.** You clear it, scrape it, take a strike, or watch a rival fall ahead of you. You find out before the next box, not at the debrief.
- **Each road has a character.** A road has a hidden mix of box kinds, and early boxes are evidence about later ones. Reading the road, not only the box, is the second skill.

## 3. Across the campaign: what carries over

- **Strikes and the extinction count run across an act,** as you asked.
  - A careless race costs you the next one: you start the next race already one strike down.
  - Extinctions add up to a world tally that the act's ending reports.
- **Acts, not lessons.** An act is a run of races in one hidden world (a speed world or a wide world, open roads or close ones). Part of the job is working out which world you're in from how the first races go.
- **The answer is never on the card.** The card shows the situation: who is racing and what you can see. Rules and reasons appear in the debrief, after you've raced.

## 4. Where surprises come from

- **Box kinds whose clues sometimes lie,** introduced once the clue has been learned. Examples:
  - a tall face with a short top;
  - a low box with a hidden landing (the second-order box);
  - a box right behind a box.
- **Rivals that adapt instead of running scripts.** The test suite's rivals already exist. A rival that tails you, one that bluffs a stop, and one that plants walls should each appear.
- **The world itself changes mid-act.** The road turns wide just as the habit from the first races sets in. This is the "Pattern Breaks" idea at the scale of an act, not of one map.
- **Walls as a weapon.** With the new rule, stopping puts a wall up behind you. Leading and stopping blocks the pack, so a close race becomes a game of chicken over who stops first. That is your Treaty Wall, found by play instead of explained.

## 5. Difficulty that rises with skill

- **Later acts give less:** less sight, closer rivals, clues that lie more often, and fewer strikes carried over.
- **Hand-jumping is an option, not the difficulty.** Most of the difficulty should be in the reading.

## 6. How we check it, before you play it

The bot claim stays as a floor. The acceptance test is new:

- **A "sensible driver" bot must lose.** It cruises, slows for anything big, and stops when unsure. It should lose most acts (target: wins under a third). If it wins, the act teaches nothing.
- **A skilled reader must win clearly.** That is a bot that reads clues and rivals well (target: at least twice the sensible driver's wins).
- **Memorizing must not work.** Every race draws its road from the act's hidden world, so the same race plays differently on a replay.
- **Only you decide whether it's fun.** Bots can only show that the obvious play fails and the skilled play wins.

## What this would drop

- The one-lesson map as the unit of the campaign. The existing maps can stay in the lesson harness as a reference.
- Showing the hint and the explanation before play.
- Judging a map by "bot A beats bot B".

## Questions for you

1. Is "reading a box, and choosing how much to give up to see further" the right core skill? Or should it be something else, such as managing the race against rivals, or timing?
2. Should an act be one hidden world that you have to work out, or should the world sometimes be announced?
3. How harsh should carried-over strikes be? For example: dissolved means the act is lost, or dissolved means you restart that race with a penalty.
4. Should the old nine campaign tracks be the starting point for the new acts? I'd recommend it: they already have the length and variety.

## Known side effect of today's wall rule

Too Late to Brake's claim now fails (37 to 0). The bot that braces for the worst stops at the box, and its wall most likely holds the rival behind it (`check/lessons/EXPERIMENTS.md`). That is the rule doing what was asked. Leading and stopping is now strong everywhere, and any new act needs to be designed with that in mind. No map was changed.
