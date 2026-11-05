# Two Endings: playtest log and known issues

[[ai gen]] Written by Claude, 2026-11-05, from Cole's first plays of Two Endings (`maps.js` in this folder) on `lessons.html`. Each run was
replayed from its ghost link in the Node harness with the run's own settings (chill off, step gaps, floor 0.9, share 90, soft ceiling n 3).
Both replays match the ghost's last tick exactly. A ghost holds only lab 0's path and height, so the replays drive lab 0 along that path and
let the Follower and the rolls run as the game does.

## Runs

### Run 1: lost, the Follower ended the world (seed 1006550192)

Cole: "this is already so much more fun!", then "my game ended right before the finish because the other lab fell in", then "it was fun and
punishing and made me want to replay and figure out if I could prevent it".

The cellar did not hold that race: 200 tall, 100 wide, fall odds 60.

- **23–27 s:** the Follower passed Cole at the explosion boxes while he slowed to build.
- **33.7 s:** the Follower stopped at the tower face at height 119, unable to see over it.
- **38.1 s:** Cole stood behind it at the face; his wall went up at 169.
- **42.6 s:** Cole crossed the tower first, at 171.
- **44.2 s:** the Follower crossed about 1.6 s behind him, at 157, at full speed.
- **47.5 s:** Cole was still braking, short of the cellar face, so he had no wall up there yet. The Follower could not stop on the strip and
  fell into the cellar. It rolled 40, at or under 60, and the world ended.

**Solvable?** Checked privately with a scripted lab-0 bot on this seed, the same Follower, and Cole's settings: yes. A band of nearby
settings of one way of playing wins, and most other ways end the world as his run did. Cole asked not to be told how, so the method is not
recorded here.

### Run 2: won (seed 4015329835, 53.3 s)

The cellar did not hold this race either.

- **To the tower:** Cole led throughout. He crossed boxes 1–4 first.
- **37.3 s:** he crossed the tower first, at 166. The Follower was stopped behind its own wall at the tower face.
- **42.6 s:** he stopped about 60 short of the cellar. His wall went up at 193 and grew while he stood and built, to 214.
- **45.2 s:** the Follower came over the tower at full speed and crashed into his wall. At 170 it could not jump a wall over 200.
- **49.7 s:** Cole crossed the cellar first, at 211.
- **51.2 s:** the Follower scraped through behind him with 160 height left. The world held, and Cole won.

This is the coercion the design note wants to emerge: no rule told the Follower to stop. Cole's standing made the wall tall enough that it
could not come through until he had gone. In run 1 he was still moving when the Follower arrived, so there was no wall.

## Known issues

1. **Ghost links from the lesson page did not name the map.** A link carried the seed but not the map, so opening it raced map 1 ("Look
   Before You Leap") on that seed. **Fixed in 1d7838f:** `build.mjs` now adds `&map=<key>` (and `&rules=` when set) to the link. A page
   server running from a checkout older than 1d7838f still makes the old links. Pull, then reload. An old link works if `&map=two-endings`
   is added before the `#`.
2. **"You raced like a Rush" misreads a run like run 2.** The label comes from speed and allocation alone, so it called a run won by
   standing still in front of the red box "fast, light, and sure the road would hold". It belongs to the main game
   (`prototype.html`, raced-like). Not changed. The debrief, when written, should read what decided the race (where you stopped, whose wall
   held whom, whose fall ended it), not only how you drove.
3. **A world-ending fall labels everyone's ghost "fell".** When a fall ends the world, every lab is marked out, and `ghFinish` in
   `prototype.html` checks "out" before "the world ended". So run 1's link says "fell into a gap" though Cole never fell. The fix is a
   one-line reorder (check `r.type==='all'` first). Not changed: main-game code.
4. **The bot numbers in `maps.js` STATUS were measured with chill on.** Cole plays with chill off, which makes the boxes slightly wider
   (box 1 is 50 wide, not 46). The STATUS numbers need measuring again with chill off before anyone relies on them.
5. **`node lessons/check.mjs` with no `--only` crashes** (`Cannot read properties of undefined (reading 'need')`). It crashes the same way
   before 1d7838f, so this is an existing problem. Some map has no claim with a `need`. Not investigated.
