# Campaign lesson probes

These are the scripts that picked and re-checked the campaign seeds on 28 October 2026 (PR 12, then the review fixes in PR 16). They were rescued from a temporary folder, so they are working tools rather than polished code. Bot play only.

- `lib.mjs` loads the simulation from `../../prototype.html` and runs the probe strategies, which are defined in `strats.json`.
- `themes.mjs` lists each map's lesson strategy, its rival strategies and the pass rule.
- `eval.mjs <seeds> <noiseStart> <noiseCount> <out.jsonl> [rosters]` counts wins per strategy. Example: `node eval.mjs 1823 1 2 out.jsonl S`.
- `par.sh lo hi noiseStart noiseCount tag [rosters]` splits a seed range across 8 processes.
- `short.mjs`, `sel.mjs`, `repc.mjs`, `final.mjs` and `ship.mjs` screen candidates, select them on one noise block, report from another, and check the shipped noise. `follow.mjs`, `dgrid.mjs` and `fstat.mjs` are the Slipstream follower search.
- The `*_out*.txt` and `old*_report.txt` files are the reports behind the tables in `DESIGN-NOTES.md`.

The large raw screening files (about 1.7 MB of JSONL) were not kept. Rerun `par.sh` to regenerate them. Keep held-out blocks separate: tune on one noise block and report from another.
