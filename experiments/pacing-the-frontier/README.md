# Pacing the Frontier

A small side-scrolling pacing game about racing, stopping and building height, meant to give intuition for racing dynamics and optimal stopping. It is a separate experiment from the main campaign. Nothing here is calibrated to evidence. All numbers are game conventions to be tuned.

- `prototype.html` is a playable single-file version: one human and three bots (Sprinter, Steward, Gambler), with a panel of tuning knobs. Open it in a browser. No build step.
- `spec.html` is the design page: rules, animated scenes of each mechanic, tuning knobs and findings from bot simulations.

## Rules (version 2)

- Run, or hold back pace and split what you held back across **sight**, **height** and **max speed**. All three cost the same. Each fills only up to a ceiling.
- **The seed sets the track.** It draws 3 to 7 gaps, their spacing and the finish (length about 2000 to 4500), a profile shape (steady climb, early wall, staircase, late cliff) and a hidden difficulty curve. Barrier heights and gap widths both come from that curve, so barriers already seen are evidence about gaps not yet seen. A per-seed noise sets how well signposted the world is: well signposted, mixed signals or deceptive. Every gap can be crossed by a lab at that regime's ceiling, and every barrier cleared by one at its height ceiling. The seed and a world label are shown, and `?seed=N` loads a seed. Track, bot gambles and fall rolls use three separate random streams, so nobody's actions move a roll.
- **Barriers** sit in every stretch between gaps, at least two where there is room. Early ones can be under jump height. Later ones need height. A barrier is cleared when jump plus height is at least its height.
- **One visibility rule.** A barrier, tower or gap is known to a lab when it is within that lab's sight ahead, the lab has passed it, or it is public. It becomes public when two labs still in the race have it in sight at once, when a lab crashes into it, or when a lab falls into or scrapes a gap. Towers are public once built. The gap behind a tower is not, unless the `revealOnCross` knob is on. You see only what your lab knows (canvas, minimap, hint text). Bots only act on what they know. The Sprinter never stops for a gap only it has seen, but stops and invests at a public gap it cannot cross.
- **Barrier or tower crash.** You are thrown back at half your impact speed (`bounce`) and slow to a stop at the braking rate, never past the last thing you cleared. A lab cannot pass until it can clear. Top speed is then capped at the speed you could stop from within your sight, until you are `capDist` (200) past it. Investment during the bounce follows the usual formula.
- **Learning from barriers.** When a lab clears a barrier it earlier crashed into, every lab below that height gains up to a third of the barrier's height, never past it. A lab that clears a barrier in view (the watcher's sight) of another lab gives that lab the same bump.
- **Gaps** have a width, some of them wide. A jump covers speed at the edge times air time, and height adds air time, so a wide gap needs run-up speed as well as height. Acceleration from a standstill is slow, so a lab that stops too close to a wide gap cannot cross it without backing up first. Reverse is slow and cannot go past the last thing the lab cleared (hold Back up, or the left arrow).
- **Scrape.** A gap's floor is ground level. A lab that leaves the edge at height h and falls short keeps moving while it drops to the floor, which takes `dropH` ms per unit of height. If it reaches the far side first, it scrapes: it loses the fraction of h it dropped, gets the stop-within-sight speed cap for `scrapeCap` (4) times the height lost past the gap, and the gap becomes public. It still counts as a crossing. A lab with no height cannot scrape. A bigger miss is a fall.
- **Fall.** A fall takes that lab out, then a roll decides whether the run ends for everyone. The odds start low and rise at each gap. Rolls are drawn at the start, by gap and by the nth fall there.
- **Tower.** The first lab across a gap leaves the height it had before the jump as a tower in front of the gap. Labs behind must clear the tower, which does not shrink, then cross the gap, which is narrower the further past it the leader is: full width divided by one plus that distance over 25.
- **Regimes.** Each gap crossed first lifts the ceilings. The frontier lab gets the full level-up, every other lab gets a share at once, and labs further behind refill faster.
- First lab over the finish line wins. Pace starts at 70%. The HUD shows how far you are behind the frontier ("Behind"). "Watch bots" makes lab 0 the Custom bot so a seed can be watched without playing.

## Status

Prototype 0.2. Implements the seeded track profile, one visibility rule, barrier bounce and speed cap, and the gap scrape from `DESIGN-NOTES.md`. Bot-versus-bot results are in `DESIGN-NOTES.md`, "Version 2 bot results". With the default knobs, extinction is rare in bot play (about 1% of games) because a scrape forgives about twice the miss that a clean jump does; the knobs move it. This is a bot test, not a human playtest.

Open design items are listed at the end of `spec.html` (which still describes version 1) and in `DESIGN-NOTES.md`.
