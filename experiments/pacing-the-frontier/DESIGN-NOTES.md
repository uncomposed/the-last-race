# Design notes: review of prototype 0.1 and agreed directions

27 October 2026. Nothing here is implemented yet. `prototype.html` and `spec.html` still describe version 1. All numbers below come from bot-against-bot runs of the unchanged prototype, not from human play.

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

1. **Barrier crash: bounce back.** Throw the lab backward at e × impact speed, decelerating at the braking rate. The bounce distance is then (e·v)²/(2·DEC), and never goes past `backLimit`.
2. **Barrier crash: forced speed cap.** Afterwards, cap top speed at the speed from which the lab could stop within its sight, until it has travelled a set distance past the barrier. This replaces the timed penalty. No investment penalty for now; add one only if needed.
3. **Gap near miss is a scrape.** A gap's floor is the starting height. A lab that reaches the far side before dropping to that floor scrapes through: it loses height and gets a speed cap scaled to the drop. A full miss means out, then the roll. Every failure costs ground or height plus a period of forced caution.
4. **One visibility rule.** Barriers and gaps are hidden until they are inside a lab's sight. A feature becomes permanently public when two labs see it at the same time, or when a lab crashes into it. The frontier relies on its own sight. Followers see the public map ahead of them. A reckless bot uses public knowledge, so it stops at known gaps it can't cross, and it stays dangerous when it leads into unseen ones.
5. **Fix barrier placement**, so barriers exist and need height.
6. **Singularity: the last gap.**
   - It is the widest gap, with the highest fall odds.
   - A lead buys time to rebalance into sight or extra height before crossing, while followers close in. The first lab across gets the full ceiling growth.
   - Past it, top speed is beyond human reaction time plus braking. Controls stay available, but acting is mostly a guess. A lab under a crash or scrape cap may be slow enough to act meaningfully.
   - Entering first does not guarantee finishing first, or at all. Labs can still hit barriers and scrape gaps inside.
   - Players extrapolate the map they crossed to choose the balance that will carry them through.
7. **Seeds vary length and height.**
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
9. **Controls.**
   - A triangle picker for the split, with hotkeys for the corners and centre.
   - Pace acts as a cruise level.
   - Hold keys give full acceleration forward or back.
   - Reflexes are meant to matter.
10. **The roll is a moment.** Freeze the action, show the odds, then roll.

## Open questions

- Does leading stay worth it? The frontier carries the discovery risk, the tower and the full gap. Its offsetting advantages are features only it has seen, and the full ceiling growth at the singularity.
- Should crossing a gap reveal it? The tower already shows that the gap exists. If it is revealed, is the width shown the full width or the narrowed width followers face?
- Should bots' appetite for risk respond to how close the race is? Rivals would then gamble more in a tight race and less when someone leads comfortably, so the player shapes extinction risk without controlling it.
- How should scoring work? One option is placings counted only when the world survives, so a lab's fall costs it something beyond its own exit.
