# The Last Race

**The company runs itself; you intervene three times per quarter.** Play DeepCent from Q1 2025 through a maximum of Q4 2031, alongside five rival companies and limited US/China government actors.

This is the **0.3 connected lab prototype** from [PLAN.md](PLAN.md). The repaired Stage 2b campaign remains available. The engine, CLI and local MCP cover the full action surface, 12 regions, resource expansion, local human-approved wildcards, strategic evidence, and eight ending families. Parameters are synthetic game conventions, not research estimates. Human acceptance remains pending; technical completion does not establish enjoyment.

Historical research now appears in action previews and the `research` command. Eight dated briefings connect experiments, a deployment incident, organizational review and historical analogies to existing decisions. These inform the player; they do not numerically calibrate the simulation. See [research integration and source audit](docs/RESEARCH.md).

## Connected model and deployment loop

Run the bounded 12-quarter prototype:

```sh
npm run play:lab -- --seed discovery:5
```

```text
brief
models
mandate product 10 0
evaluate deepcent:compact coding supervised short standard
evaluate deepcent:general coding supervised short standard
quarter
end
models
deploy deepcent:compact coding supervised short 4
quarter
end
```

This sequence uses three opening interventions. The compact coding preference is a retained evaluation witness for this seed, not a universal strategy. `models` includes coding, assistance and research assessments under supervised/autonomous and short/long conditions. Training creates persistent candidates with unknown task performance. Evaluations and observed production update only the matching conditions. Reusing a model/context/suite is rejected; `holdout` buys an independent larger sample.

`deploy MODEL TASK HARNESS DURATION CAPACITY` creates or changes one task deployment; capacity zero suspends it. It reserves recurring cash and compute, may throttle to the remaining budget, competes for shared demand in that task/duration segment, and earns revenue for successful service. Supervision costs more and restricts autonomous tool access; autonomous service has continuing containment exposure. Vendor service pays recurring fees and shares a six-unit contract limit across your deployments. Use an older model, restrict to supervision, or suspend to respond to an observed incident.

`mandate ROUTINE CASH_FLOOR ADDITIONAL_COMPUTE_TARGET` costs one intervention to change, persists across quarters, and does not spend repeat slots. Its reserve applies to delegated operations; explicit strategic actions can spend the reserve. Compute target is a buffer beyond serving demand. `brief` shows current commitments, throttled service, recent evidence and projects. `quarter` separates exact costs from uncertain income.

`lab-12` and `business-28` offer `continue` or `conclude` at political milestones. Only conclusion unlocks hidden outcomes. `full-28` retains explicitly scored terminal objectives; `business-28` retains its legacy economy and does not silently enable the lab prototype. The CLI/MCP default remains `full-28` until human acceptance of the new loop.

The browser decision interface, configurable treaties, government resource contracts, data acquisition and distillation remain the next milestones. The lab economy is synthetic and has not passed the human fun gate. See [lab contracts](docs/LAB-LOOP.md).

## Play and recover

Requires Node.js 20 or later.

```sh
npm ci
npm run build
npm run play -- --seed first-race
```

```text
help
plan
rules
beliefs
actions
preview build texas small grid distributed
train small pretraining reasoning coding
ship own
quarter
end
```

`quarter` previews the ordered company effects, shared cash/compute commitments, projects and remaining moves. `actions` previews presets; `preview ACTION` previews any exact supported configuration. `rules` lists regions, permitted actions, and ending precedence. Costs are reserved until resolution. Funding and new capacity cannot finance already-staged commitments; new construction first progresses at the next opening.

```text
research
research alignment-faking
preview train small rl science agency
research fukushima-assumptions
```

Research readings are free. Full briefings include sources, limitations, decision tradeoffs and suggested commands. The April–June 2025 reports first become available at the July 2025 opening. Briefing IDs are reference IDs, not evidence IDs for `respond`.

Actions: Train, Ship (own or third-party harness), Secure, Investigate (control or a rival’s racing/capability/safety/credibility), Build, Fund, Announce, and paid concealment on Build/Train/Secure. Plan overrides, four-quarter belief convictions and Respond share the same three slots. `help` provides complete syntax.

Production CLI and MCP automatically checkpoint every accepted command under `.last-race-v3/`, keeping a previous checkpoint. Only one process may own a session directory. Restarting the CLI without a seed or scenario continues the latest run. `sessions` lists recovered runs; `use run-1` selects one. `--session-dir DIRECTORY` selects an independent session. MCP uses `LAST_RACE_SESSION_DIR` for the equivalent override.

```text
save my-run.json
quit
```

```sh
npm run play -- --resume my-run.json
npm run play -- --scenario core-12 --seed core-test
npm run play -- --scenario one-quarter --seed smoke-test
```

Stage 2b saves require their preserved engine; there is no implicit migration:

```sh
npm run play:stage-2b -- --session-dir .last-race-codex-table
```

The new engine uses a separate default checkpoint directory. See [Stage 2b recovery](compat/stage-2b/README.md). Offline saves contain recoverable hidden information. Resume verifies source/scenario identity and deterministic replay; modified or incompatible saves fail closed. Do not narrate raw saves as player knowledge. `reveal` is an explicit terminal-only reveal. Recover a damaged checkpoint by preserving the damaged file and explicitly resuming its matching `.json.previous` file; it may lose the last accepted revision.

## Local wildcard rulings

A wildcard is one typed local ruling, once per run, using **one ordinary move**. Proposal and human review spend no moves or resources. The exact ruling records effect, amount, price, delay, duration, upkeep and visibility; executable code and unbounded effects are rejected.

The formerly blocked Q1 can now continue after Train and Ship:

```text
wildcard-propose "Purchase durable compute" capacity 4 12 0 permanent 1 physical
```

Read the returned proposal ID and terms. After the human explicitly approves those exact terms:

```text
wildcard-accept PROPOSAL_ID "Human approval of the displayed terms"
wildcard-apply PROPOSAL_ID
quarter
end
```

This purchases four persistent compute units at resolution for 12M, with 1M upkeep per subsequent opening. It consumes the third slot and grants no fourth intervention. `wildcard-reject ID "reason"` rejects an offer without resource spending. Unaccepted, rejected, stale-quarter or already-used proposals cannot be applied. Clients must never invent human acceptance; local attribution is recorded, not cryptographically authenticated.

## MCP

Configure a stdio MCP client after building:

```json
{
  "mcpServers": {
    "the-last-race": {
      "command": "node",
      "args": ["/absolute/path/to/the-last-race/dist/src/mcp.js"],
      "env": { "LAST_RACE_SESSION_DIR": "/absolute/path/to/the-last-race/.last-race" }
    }
  }
}
```

`list_runs` recovers checkpointed run IDs. `create_run` defaults to `full-28`. Read with `get_view`, `get_plan`, `preview_quarter`, `get_beliefs`, `get_feed`, `get_rivals`, `list_actions`, `explain` and `get_rules`. Mutate with `take_action`, `override_plan_item`, `override_belief`, `respond_to_evidence`, `propose_wildcard`, `decide_wildcard`, `apply_wildcard` and `end_turn`. Every mutation requires actor identity, expected revision and an idempotency key. Exact retries are safe; invalid and stale commands cannot partially mutate a run.

`get_research` accepts `runId` and an optional case `id`. It returns only reports available at that run's quarter opening. `list_actions` includes up to three relevant briefings per action, with multiple reports about one case collapsed to the latest available report.

`save_run` exports a secret-bearing artifact; `resume_run` imports one. No client-provided filesystem paths are accepted by these tools. `get_final_reveal` requires a completed run. No model API key, hosted adjudicator or external paid service is used.

## Verify and audit

```sh
npx playwright install chromium webkit
npm run check
npm run simulate
```

Checks include numerical boundaries, knowledge isolation, the failed owner transcript, durable restart, real MCP command execution, 28-quarter play, and ordinary-command witnesses for all eight endings. Node, Chromium and WebKit compare exact canonical states and traces. Simulations retain separate company and societal metrics across paired policies, control priors and detection assumptions; they do not force equal win rates.

Read [the mechanism contracts](docs/CONTRACTS.md), [numerical contract](docs/NUMERICS.md), [validation record](docs/VALIDATION.md) and [human acceptance requirements](docs/ACCEPTANCE.md). Diagnostic variants `full-28-skeptical` and `full-28-low-detection` change the control prior and non-public signal detection, respectively. These small synthetic comparisons are not Stage 3 research validation.

## Original saves

The original owner saves are unchanged. Their compatible source and built engine were preserved under `compat/stage-2a/` and verified against both saved artifacts. Continue them using:

```sh
npm run play:legacy -- --resume owner-first-chat.json
```

That preserved prototype retains its original scope. New full campaigns reproduce the failed transcript and support the purchase flow; old saves are not silently migrated into changed rules.

Apache-2.0. Parody organizations and synthetic regulatory blocs do not describe actual companies, sovereignty, or government behavior. Browser/map play, research calibration, a scenario compiler and hosted contributions remain later stages.
