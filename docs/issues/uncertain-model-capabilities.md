# Model uncertain capabilities, beliefs about our own models, and task-specific evaluations

Status: open. GitHub: https://github.com/uncomposed/the-last-race/issues/2

## Problem

Training a model should leave the company uncertain about what it has produced, both during training and after completion. The player needs beliefs about their own models, evidence that can improve those beliefs, and meaningful choices about which model to use for a particular task.

The current engine exposes a single known company capability score. Training adds a deterministic gain, and training focuses produce fixed capability, revenue, safety, or exposure effects. There are no separately identified models, own-model capability beliefs, or task-specific evaluations. Adding visible coding, assistant, and research scores alone would preserve the central problem if those scores were treated as perfectly known abilities.

## Evidence from owner play and implementation

At Q3 2025 in the `full-28` run seeded `codex-table-2026-10-14`, DeepCent has capability 6 and product 5 after reasoning/coding training and launches. The owner asked how our models compare in coding, general assistance, and agentic research. The player view cannot answer that question: it has neither domain performance evidence nor estimates of our own models' task competence. This is missing simulation state and mechanics, not simply a missing dashboard.

- `src/types.ts`, `Actor` and `Project`: capability is one company-level scalar; training projects store a fixed gain and focuses. There is no model inventory or evaluation action.
- `src/policy.ts`, `trainingBenefits`: training scale, method, and focuses determine fixed gains and side effects.
- `src/engine.ts`, training project completion: completion directly adds the stored gain to company capability.
- `src/engine.ts`, `getBeliefs`: exposes control-effectiveness beliefs and rival aggregate assessments, but no beliefs about our own models' abilities.

No hidden save contents or rival private state were needed to identify this gap. This report describes a game design requirement; it does not claim that the current synthetic parameters estimate real AI capabilities.

## Requested behavior

Keep these layers distinct:

1. **Training intent and uncertainty:** a recipe and resource commitment describe what the company is trying to improve. Outcomes may differ from expectations, including unexpected strengths and weaknesses. Intermediate observations can inform beliefs without guaranteeing final results.
2. **Models and performance:** preserve identifiable model versions. Actual performance depends on the task and relevant conditions, including the harness or tools, available inference compute, and task duration. Coding, general assistance, and agentic research are initial areas of interest, not interchangeable labels for one global score.
3. **Evidence:** evaluations, learning curves, internal use, deployment feedback, and incidents reveal limited aspects of performance. Evidence records what was tested, model version, conditions, coverage, and uncertainty. A positive short-task result does not automatically establish reliable performance over a long autonomous workflow.
4. **Own-model beliefs:** maintain estimates and uncertainty for our own model/task combinations. Show what is observed, inferred, weakly supported, or untested. Training intentions and self-reported confidence must not expose hidden true abilities.
5. **Evaluations as decisions:** evaluations consume explicitly declared resources and time under the game's action economy. They produce evidence that can change estimates and model selection without changing the evaluated model's underlying abilities. Training and harness improvements can change performance and must be distinguishable from evaluation-only learning.
6. **Task-specific selection:** compare available models for a specified workload using expected performance, reliability, cost, latency, relevant conditions, and uncertainty. Explain why a model is preferred for that task and what evidence would change the choice. Preserve tradeoffs rather than imposing one universally best model.

The intended gameplay includes choosing between evaluating an existing model, training another candidate, improving a harness, or deploying with incomplete evidence. Discovering an overlooked strength can make an existing model useful without another training run. Discovering a weakness can justify changing deployments or gathering further evidence.

## Acceptance and audit

- A repeatable witness shows evaluation changing which of two existing models we select for a task, while the models' underlying abilities, harnesses, and conditions stay fixed. Merely revealing another deterministic capability gain does not satisfy this criterion.
- Witnesses show different models preferred for different tasks; no interface represents one aggregate capability number as a sufficient task ranking.
- Training can produce results above or below the company's prior expectations under declared scenario assumptions. Budget, training target, realized performance, and subsequent beliefs remain separate and auditable.
- Targeted evidence updates relevant estimates; it does not establish competence in untested domains or conditions. Repeated use of the same evidence is not counted as independent confirmation. Explain remaining uncertainty and evaluation limitations.
- Own-model beliefs can be mistaken. Public views, action previews, explanations, and model comparisons do not leak hidden abilities, rival knowledge, or evaluation outcomes before they are observed.
- Evaluation costs, timing, and any intervention-slot use are explicit. Players face a real opportunity cost between obtaining information and changing capabilities or deploying.
- An improvement through training or tooling is distinguished from an improvement in the company's estimate caused by evaluation. Comparisons identify the exact model version and tested configuration.
- Compare no evaluation, narrow evaluation, and task-relevant evaluation with fixed models and budgets. Check untested tasks and mismatched harnesses as counterexamples to overgeneralization. Include both useful discoveries and misleading evidence rather than forcing every evaluation to improve a decision.
- Preserve deterministic replay and checkpoint recovery for a fixed seed and command history. Define compatibility or migration explicitly before changing the active campaign's saved-state format or engine identity.

Completion requires demonstrated task-specific decisions under uncertainty and evidence-driven changes in those decisions. Stop when these behaviors and information boundaries are verified; a polished dashboard of known domain scores alone is insufficient.
