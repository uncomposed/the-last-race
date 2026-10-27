# Pacing the Frontier

A small side-scrolling pacing game about racing, stopping and building height, meant to give intuition for racing dynamics and optimal stopping. It is a separate experiment from the main campaign. Nothing here is calibrated to evidence. All numbers are game conventions to be tuned.

- `prototype.html` is a playable single-file version: one human and three bots (Sprinter, Steward, Gambler), with a panel of tuning knobs. Open it in a browser. No build step.
- `spec.html` is the design page: rules, animated scenes of each mechanic, tuning knobs and findings from bot simulations.

## Rules (version 1)

- Run, or hold back pace and split what you held back across **sight**, **height** and **max speed**. All three cost the same. Each fills only up to a ceiling.
- **Barriers** are visible, fixed heights that rise through the run. A barrier is cleared when jump plus height is at least its height. A crash stops you and cuts max speed for a few seconds, and you stay in front of it until you can cross.
- **Learning from barriers.** When a lab clears a barrier it earlier crashed into, every lab below that height gains up to a third of the barrier's height, never past it. A lab that clears a barrier in view of another lab gives that lab the same bump.
- **Shared sight.** Labs in view of each other are topped up to at least 75% of the best sight among them.
- **Gaps** are hidden until in sight and have a width, some of them wide. A jump covers speed at the edge times air time, and height adds air time, so a wide gap needs run-up speed as well as height. Acceleration from a standstill is slow, so a lab that stops too close to a wide gap cannot cross it without backing up first. Reverse is slow and cannot go past the last thing the lab cleared (hold Back up, or the left arrow). A fall takes that lab out, then a roll decides whether the run ends for everyone. The odds start low and rise at each gap.
- **Tower.** The first lab across a gap leaves the height it had when it crossed as a tower in front of the gap. Labs behind must clear the tower, which does not shrink, then cross the gap, which is narrower the further past it the leader is: full width divided by one plus that distance over 25.
- **Regimes.** Each gap crossed first lifts the ceilings. The frontier lab gets the full level-up, every other lab gets a share at once, and labs further behind refill faster.
- First lab over the finish line wins.

## Status

Prototype 0.1. Bot-versus-bot simulation showed that holding back is stronger than running at the starting investment rate, and that a quarter to two fifths of games end in extinction, mostly because the Sprinter or Gambler falls. This is a bot test, not a human playtest.

Open design items are listed at the end of `spec.html`. `DESIGN-NOTES.md` records a review of version 0.1 and the agreed directions for the next version.
