# The Last Race: Pacing the Frontier

A small side-scrolling racing game about AI labs racing to the frontier. You race three rival labs to the finish. Holding back pace buys sight, height and speed; a fall into a gap can end the run for every lab. It is made for intuition, not prediction: every number is a game convention.

**Play:** <https://uncomposed.github.io/the-last-race/>, on desktop or a phone (landscape works best). Or open `experiments/pacing-the-frontier/prototype.html` in a browser; there is no build step.

- Free play on a random track, or a nine-map campaign with stars, medals and chill stars.
- Rules, knobs and query parameters: [`experiments/pacing-the-frontier/README.md`](experiments/pacing-the-frontier/README.md).
- Measurements behind the bots, maps and difficulty: [`experiments/pacing-the-frontier/DESIGN-NOTES.md`](experiments/pacing-the-frontier/DESIGN-NOTES.md).
- Check that race results did not change: `node experiments/pacing-the-frontier/check/sim-check.mjs`.
- Check that a recorded run replays to the same result (what a leaderboard server relies on): `node experiments/pacing-the-frontier/check/replay-check.mjs`.

The earlier lab-management campaign (TypeScript engine, CLI, MCP server, simulations and research notes) lives on the [`lab-campaign`](https://github.com/uncomposed/the-last-race/tree/lab-campaign) branch.

Background reading: [AI 2027](https://ai-2027.com/), its hopeful companion [AI 2040: Plan A](https://ai-2040.com/), and [80,000 Hours on risks from AI](https://80000hours.org/problem-profiles/artificial-intelligence/).

Licensed under [Apache-2.0](LICENSE).
