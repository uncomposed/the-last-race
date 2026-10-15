import { createInterface } from 'node:readline';
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { RunService, type ServiceResult, type Inspection } from './service.js';
import type { Action, CommandPayload, Focus, ResponseAction, Topic, WildcardRuling, Task, Harness, Duration, RoutineChoice } from './types.js';

export const HELP = `The Last Race — synthetic lab and campaign prototype
Your company runs routine operations. You have three interventions per quarter.
Inspect the plan and beliefs, make sacrifices, then end the quarter.

Usage: npm run play -- [--seed TEXT] [--scenario lab-12|business-28|full-28|core-12|one-quarter]
       npm run play -- --resume FILE
       npm run play -- --demo [--seed TEXT]

Inspection: brief | models [all] (lab-12) | reveal (terminal only) | quarter | view | plan | beliefs | feed | rivals | actions | rules | explain [ID]
  research [CASE_ID]   dated case briefings, sources, limits and decision tradeoffs
  preview ACTION      inspect any exact action without spending a move
  preview train small rl reasoning agency
Interventions (each spends one move):
  train small|large pretraining|rl FOCUS FOCUS
    FOCUS: reasoning, coding, science, agency (choose two different focuses)
    Legacy campaigns: reasoning adds capability; coding adds revenue; science adds safety;
    agency adds capability and risk. RL also adds capability and risk.
    Lab-12: focuses bias candidate strengths; no free revenue or safety.
    Effects arrive when training completes; actions shows exact current previews.
  ship own|third-party (legacy campaigns)
  evaluate MODEL_ID coding|assistance|research supervised|autonomous short|long standard|holdout
  deploy MODEL_ID coding|assistance|research supervised|autonomous short|long CAPACITY
    lab-12 only; capacity 0 suspends, 1–8 requests serving capacity. Vendor limit: 6.
    Evaluations arrive next opening; training creates an uncertain model candidate.
  mandate automatic|hold|lease|product|safety CASH_FLOOR ADDITIONAL_COMPUTE_TARGET
  secure 1|2
  investigate [control|racing|capability|safety|credibility [RIVAL_ID]]
  build REGION_ID small|large grid|clean concentrated|distributed
  fund parent|external 20|40
  announce racing|safety|slowdown TARGET_ID true|false
  conceal 1|2 ACTION  paid modifier on Build, Train or Secure
  belief-target TOPIC RIVAL_ID NUMBER|clear
  veto ITEM_ID
  plan-set ITEM_ID lease|product|safety
  belief NUMBER       impose a 0..1 control-effectiveness conviction for four quarters
  belief clear        remove a conviction
  respond EVIDENCE_ID secure 1|2
  respond EVIDENCE_ID ACTION   force any feasible ordinary action; no wildcard bypass
Wildcard (one applied ruling per run; one ordinary slot):
  wildcard-propose "DESCRIPTION" capacity|cash|safety AMOUNT PRICE DELAY DURATION|permanent UPKEEP public|physical|covert
  wildcard-accept ID "HUMAN APPROVAL" | wildcard-reject ID "REASON"
  wildcard-apply ID
Other commands:
  details             print the complete structured player view
  sessions            list automatically checkpointed runs
  use RUN_ID          continue an existing local run
  continue | conclude resolve a pending political milestone (no move)
  end                 commit the quarter (resolve resource conflicts first)
  save FILE           write a recoverable save containing hidden secrets
  resume FILE         resume a compatible save
  new SEED [SCENARIO]  start another run
  help | quit

Use quotes around file paths or seeds containing spaces. Production CLI/MCP sessions checkpoint every accepted command. --session-dir DIR selects the checkpoint directory.
An automated demo verifies execution; the owner must still complete the human fun gate.`;

function label(key: string): string { return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase(); }
function scalar(value: unknown): string {
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  if (value === null) return 'none';
  return String(value);
}
/** Plain printer receives public selector data only, never authoritative RunState. */
export function formatPublic(value: unknown, depth = 0): string {
  const indent = '  '.repeat(depth);
  if (Array.isArray(value)) {
    if (!value.length) return `${indent}(none)`;
    if (value.every(item => item === null || typeof item !== 'object')) return `${indent}${value.map(scalar).join(', ')}`;
    return value.map((item, index) => `${indent}[${index + 1}]\n${formatPublic(item, depth + 1)}`).join('\n');
  }
  if (value && typeof value === 'object') return Object.entries(value).map(([key, item]) =>
    item && typeof item === 'object' ? `${indent}${label(key)}:\n${formatPublic(item, depth + 1)}` : `${indent}${label(key)}: ${scalar(item)}`,
  ).join('\n');
  return `${indent}${scalar(value)}`;
}
function record(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function printView(value: unknown): string {
  const view = record(value), player = record(view.player), resources = record(view.resources);
  const rows = [
    `${view.quarterLabel} · ${view.phase} · ${view.movesRemaining} of 3 moves remaining`,
    `${player.name}: cash ${player.cash}M · compute ${player.compute} · ${view.lab ? 'frontier progress' : 'capability'} ${player.capability}${view.lab ? '' : ` · product ${player.product}`} · safety ${player.safety} · ${view.lab ? 'last-quarter revenue' : 'revenue'} ${player.revenue}${view.lab ? 'M' : 'M/q'} · influence ${player.influence}`,
  ];
  rows.push('Research: use research for cases available this quarter; action previews include relevant decision briefings.');
  if (view.phase === 'planning') rows.push(`Shared ledger: cash ${resources.committedCash}/${resources.availableCash}M committed; compute ${resources.committedCompute}/${resources.availableCompute} committed.`);
  if (Array.isArray(resources.conflicts) && resources.conflicts.length) rows.push(`Resolve before ending: ${resources.conflicts.join('; ')}`);
  if (Array.isArray(view.interventions) && view.interventions.length && view.phase === 'planning') {
    rows.push('Staged interventions:');
    for (const raw of view.interventions) {
      const entry = record(raw), action = record(entry.action);
      const detail = action.type === 'evaluate' || action.type === 'deploy' ? `${action.modelId} / ${action.task} / ${action.harness} / ${action.duration} / ${action.type === 'evaluate' ? action.suite : 'capacity ' + action.capacity}` : action.type === 'build' ? `${action.regionId} ${action.scale} ${action.power} ${action.layout}` : action.type === 'fund' ? `${action.source} ${action.amount}M` : action.type === 'announce' ? `${action.claim}=${action.value} about ${action.targetId}` : action.type === 'wildcard' ? `${record(action.ruling).effect} ${record(action.ruling).amount}` : action.type === 'train' ? `${action.scale} ${action.method} (${(action.focuses as string[]).join(', ')})` : action.type === 'ship' ? action.model : action.type === 'secure' ? action.amount : action.topic;
      rows.push(`  ${entry.id}: ${action.type} ${detail} — ${entry.cashCost}M, ${entry.computeCost} compute${entry.forcedByEvidence ? `; responds to ${entry.forcedByEvidence}` : ''}`);
    }
  }
  if (Array.isArray(view.projects) && view.projects.length) {
    rows.push('Projects:');
    for (const raw of view.projects) {
      const project = record(raw);
      rows.push(`  ${project.id}: ${project.remaining} openings left; ${project.kind === 'build' ? 'capacity asset' : '+' + project.gain + ' capability; focuses ' + (project.focuses as string[]).join(', ')}`);
    }
  }
  if (view.campaign) {
    const campaign = record(view.campaign);
    rows.push(`Next opening obligations: ${campaign.nextOpeningOperatingCost}M including base upkeep. Parent budget remaining: ${campaign.remainingParentBudget}M.`);
    const assets = campaign.assets as Array<Record<string, unknown>>;
    if (assets.length) rows.push('Capacity assets:\n' + assets.map(a => `  ${a.regionId}: +${a.capacity} capacity, ${a.upkeep}M/q upkeep, expires ${a.expiresQuarter ?? 'never'}`).join('\n'));
    const obligations = campaign.obligations as Array<Record<string, unknown>>;
    if (obligations.length) rows.push('Funding obligations:\n' + obligations.map(o => `  ${o.source}: ${o.payment}M at openings ${o.startQuarter} through ${Number(o.endQuarter) - 1}`).join('\n'));
    const governments = campaign.governments as Array<Record<string, unknown>>;
    rows.push('Governments: ' + governments.map(g => `${g.name}: ${g.stance}, monitoring ${g.monitoring}`).join('; '));
    const treaty = record(campaign.treaty), verification = record(campaign.verification);
    rows.push(`Agreement: ${treaty.establishedQuarter === null ? 'not established' : 'members ' + (treaty.members as string[]).join(', ')}. Verification: ${verification.establishedQuarter === null ? 'not established' : verification.invalidatedBy ? 'invalidated' : 'established'}.`);
    const proposals = campaign.proposals as Array<Record<string, unknown>>;
    if (proposals.length) {
      rows.push('Wildcard proposals (acceptance requires an explicit human decision):');
      for (const proposal of proposals.slice(-3)) rows.push(`  ${proposal.id} — ${proposal.status}\n${formatPublic(proposal.ruling, 2)}`);
    }
    rows.push(`Available actions: train, ${view.lab ? 'evaluate, deploy' : 'ship'}, secure, investigate, build, fund, announce; controls: mandate, veto/plan-set, belief/belief-target, respond, wildcard. Use actions, rules and quarter for previews.`);
  }
  if (view.lab) {
    const lab = record(view.lab);
    rows.push('Task performance is estimated separately from the frontier progress index.');
    rows.push('Lab: use models for task evidence, deployment terms and observed incidents; brief for current decisions.');
    rows.push('Deployments:\n' + formatPublic(lab.deployments, 1));
  }
  if (view.pendingMilestone) rows.push(`Political milestone: ${view.pendingMilestone}. Choose continue or conclude; hidden outcomes remain sealed until conclusion.`);
  if (view.report) rows.push(`Horizon assessment:\n${formatPublic(view.report, 1)}`);
  return rows.join('\n');
}
function printPlan(value: unknown): string {
  const plan = record(value);
  const rows = ['Routine plan:'];
  for (const item of Array.isArray(plan.items) ? plan.items : []) {
    const entry = record(item);
    rows.push(`  ${entry.id}: ${entry.choice} (${entry.cashCost}M, ${entry.computeCost} compute)${entry.overridden ? ' — your explicit override' : ''}\n  ${entry.reason}`);
  }
  if (Array.isArray(plan.conflicts) && plan.conflicts.length) rows.push(`Conflicts: ${plan.conflicts.join('; ')}`);
  return rows.join('\n');
}
function printData(value: unknown): string {
  const data = record(value);
  if (Array.isArray(data.models) && Array.isArray(data.deployments) && data.terms) {
    const rows = ['Model portfolio — estimated task success, not safety certification:'];
    for (const raw of data.models) {
      const model = record(raw);
      rows.push(`${model.id} — ${model.name}; ${model.vendorCost ? 'vendor fee ' + model.vendorCost + 'M per reserved unit' : model.throughput + ' short units per compute'}`);
      for (const rawAssessment of model.assessments as unknown[]) {
        const a = record(rawAssessment); const ids = a.evidenceIds as string[];
        if (ids.length || a.harness === 'supervised' && a.duration === 'short') rows.push(`  ${a.task} / ${a.harness} / ${a.duration}: ${(Number(a.expectedSuccess) * 100).toFixed(0)}% estimated; ${ids.length ? ids.length + ' evidence sources' : 'untested prior'}`);
      }
    }
    rows.push('Use models all for every condition, probability bins and evidence IDs.');
    rows.push('Recent evaluations and service evidence:\n' + formatPublic((data.evaluations as unknown[]).slice(-6), 1));
    rows.push('Deployments:\n' + formatPublic(data.deployments, 1));
    rows.push('Announced demand by task and duration:\n' + formatPublic(data.demand, 1));
    rows.push('Terms:\n' + formatPublic(data.terms, 1));
    if ((data.incidents as unknown[]).length) rows.push('Observed incidents:\n' + formatPublic(data.incidents, 1));
    return rows.join('\n');
  }
  if (data.view && data.plan) {
    const duplicate = record(data.receipt).duplicate === true ? 'Previously accepted command; no additional move spent.\n' : '';
    return duplicate + printView(data.view) + (record(data.view).phase === 'planning' ? '\n' + printPlan(data.plan) : '');
  }
  if (data.player && data.quarterLabel) return printView(data);
  if (Array.isArray(data.items) && data.actorId) return printPlan(data);
  return formatPublic(value);
}
function words(line: string): string[] {
  const tokens: string[] = [];
  let token = '', quote = '', active = false;
  for (const char of line.trim()) {
    if (quote) { if (char === quote) quote = ''; else token += char; active = true; }
    else if (char === '"' || char === "'") { quote = char; active = true; }
    else if (/\s/.test(char)) { if (active) { tokens.push(token); token = ''; active = false; } }
    else { token += char; active = true; }
  }
  if (quote) throw new Error('Close the quoted seed or file path.');
  if (active) tokens.push(token);
  return tokens;
}
const focuses = ['reasoning', 'coding', 'science', 'agency'];
export function parseAction(args: string[]): Action {
  const [type, first, second, third, fourth, fifth] = args;
  if ((type === 'evaluate' || type === 'deploy') && args.length === 6 && ['coding', 'assistance', 'research'].includes(second) && ['supervised', 'autonomous'].includes(third) && ['short', 'long'].includes(fourth)) {
    const context = { modelId: first, task: second as Task, harness: third as Harness, duration: fourth as Duration };
    if (type === 'evaluate' && ['standard', 'holdout'].includes(fifth)) return { type, ...context, suite: fifth as 'standard' | 'holdout' };
    if (type === 'deploy' && /^\d+$/.test(fifth)) return { type, ...context, capacity: Number(fifth) };
  }
  if (type === 'train' && args.length === 5 && ['small', 'large'].includes(first) && ['pretraining', 'rl'].includes(second) && focuses.includes(third) && focuses.includes(fourth))
    return { type, scale: first as 'small' | 'large', method: second as 'pretraining' | 'rl', focuses: [third as Focus, fourth as Focus] };
  if (type === 'ship' && args.length === 2 && ['own', 'third-party'].includes(first)) return { type, model: first as 'own' | 'third-party' };
  if (type === 'secure' && args.length === 2 && ['1', '2'].includes(first)) return { type, amount: Number(first) as 1 | 2 };
  if (type === 'investigate' && args.length <= 3 && (!first || ['control', 'racing', 'capability', 'safety', 'credibility'].includes(first))) return { type, topic: (first ?? 'control') as Topic, ...(second ? { targetId: second } : {}) };
  if (type === 'build' && args.length === 5 && ['small', 'large'].includes(second) && ['grid', 'clean'].includes(third) && ['concentrated', 'distributed'].includes(fourth)) return { type, regionId: first, scale: second as 'small' | 'large', power: third as 'grid' | 'clean', layout: fourth as 'concentrated' | 'distributed' };
  if (type === 'fund' && args.length === 3 && ['parent', 'external'].includes(first) && ['20', '40'].includes(second)) return { type, source: first as 'parent' | 'external', amount: Number(second) as 20 | 40 };
  if (type === 'announce' && args.length === 4 && ['racing', 'safety', 'slowdown'].includes(first) && ['true', 'false'].includes(third)) return { type, claim: first as 'racing' | 'safety' | 'slowdown', targetId: second, value: third === 'true' };
  if (type === 'conceal' && ['1', '2'].includes(first)) { const action = parseAction(args.slice(2)); if (action.type === 'build' || action.type === 'train' || action.type === 'secure') return { ...action, concealment: Number(first) as 1 | 2 }; }

  throw new Error('Invalid action. Type help for exact commands; actions shows previews and costs.');
}

export class CliSession {
  readonly service: RunService;
  private runId = '';
  private actorId = '';
  private revision = 0;
  constructor(service = new RunService()) { this.service = service; }
  private accept(result: ServiceResult): string {
    if (!result.ok) return `Rejected (${result.error?.code ?? 'ERROR'}): ${result.error?.message ?? 'Invalid request.'}`;
    this.runId = result.runId!; this.actorId = result.actorId!; this.revision = result.revision!;
    return `Run ${this.runId} · actor ${this.actorId} · revision ${this.revision}\n${printData(result.data)}`;
  }
  start(seed: string, scenarioId = 'full-28'): string { return this.accept(this.service.create(seed, scenarioId)); }
  inspect(kind: Inspection): ServiceResult { return this.service.inspect(this.runId, kind); }
  private issue(payload: CommandPayload): string {
    return this.accept(this.service.command(this.runId, { actorId: this.actorId, expectedRevision: this.revision, idempotencyKey: `cli-${randomUUID()}`, payload }));
  }
  async line(line: string): Promise<{ text: string; quit?: boolean }> {
    try {
      const args = words(line);
      const name = args.shift();
      if (!name) return { text: '' };
      if (name === 'models' && args.length === 1 && args[0] === 'all') return { text: formatPublic(this.service.inspect(this.runId, 'models').data) };
      if (name === 'details') return { text: formatPublic(this.service.inspect(this.runId, 'view').data) };
      if (name === 'sessions') return { text: formatPublic(this.service.sessions().data) };
      if (name === 'use' && args.length === 1) return { text: this.accept(this.service.inspect(args[0], 'view')) };
      if (name === 'quit' || name === 'exit') return { text: 'Session closed. Production sessions keep automatic checkpoints; explicit save exports a portable artifact.', quit: true };
      if (name === 'help') return { text: HELP };
      if (name === 'new') {
        if (!args[0] || args.length > 2) throw new Error('Usage: new SEED [full-28|core-12|one-quarter]');
        return { text: this.start(args[0], args[1]) };
      }
      if (name === 'resume') {
        if (args.length !== 1) throw new Error('Usage: resume FILE');
        return { text: this.accept(this.service.resume(await readFile(args[0], 'utf8'))) };
      }
      if (name === 'save') {
        if (args.length !== 1) throw new Error('Usage: save FILE');
        const result = this.service.save(this.runId);
        if (!result.ok) return { text: this.accept(result) };
        const artifact = result.data as { serialized: string };
        await writeFile(args[0], artifact.serialized, { encoding: 'utf8', mode: 0o600 });
        return { text: `Saved ${args[0]}. This recoverable artifact contains hidden world secrets.` };
      }
      if (name === 'preview') return { text: this.accept(this.service.preview(this.runId, parseAction(args))) };
      const inspections: Record<string, Inspection> = { models: 'models', brief: 'brief', reveal: 'reveal', quarter: 'quarter', view: 'view', plan: 'plan', beliefs: 'beliefs', feed: 'feed', rivals: 'rivals', actions: 'actions', rules: 'rules', explain: 'explain', research: 'research' };
      if (name in inspections) {
        if (args.length > (name === 'explain' || name === 'research' ? 1 : 0)) throw new Error(`Unexpected arguments for ${name}.`);
        return { text: this.accept(this.service.inspect(this.runId, inspections[name], args[0])) };
      }
      if (name === 'wildcard-propose' && args.length === 8) return { text: this.issue({ type: 'propose_wildcard', proposal: args[0], ruling: { effect: args[1] as WildcardRuling['effect'], amount: Number(args[2]), price: Number(args[3]), delay: Number(args[4]), duration: args[5] === 'permanent' ? null : Number(args[5]), upkeep: Number(args[6]), visibility: args[7] as WildcardRuling['visibility'] } }) };
      if (['wildcard-accept', 'wildcard-reject'].includes(name) && args.length === 2) return { text: this.issue({ type: 'decide_wildcard', proposalId: args[0], decision: name === 'wildcard-accept' ? 'accept' : 'reject', humanApproval: args[1] }) };
      if (name === 'wildcard-apply' && args.length === 1) return { text: this.issue({ type: 'apply_wildcard', proposalId: args[0] }) };
      if (name === 'belief-target' && args.length === 3) return { text: this.issue({ type: 'override_belief', topic: args[0] as Topic, targetId: args[1], conviction: args[2] === 'clear' ? null : Number(args[2]) }) };
      if (name === 'mandate' && args.length === 3) return { text: this.issue({ type: 'set_mandate', mandate: { routine: args[0] as 'automatic' | RoutineChoice, cashFloor: Number(args[1]), computeTarget: Number(args[2]) } }) };
      if ((name === 'continue' || name === 'conclude') && !args.length) return { text: this.issue({ type: name === 'continue' ? 'continue_campaign' : 'conclude_campaign' }) };
      if (name === 'end' && !args.length) return { text: this.issue({ type: 'end_turn' }) };
      if (name === 'veto' && args.length === 1) return { text: this.issue({ type: 'override_plan_item', itemId: args[0], choice: 'veto' }) };
      if (name === 'plan-set' && args.length === 2 && ['lease', 'product', 'safety'].includes(args[1])) return { text: this.issue({ type: 'override_plan_item', itemId: args[0], choice: args[1] as 'lease' | 'product' | 'safety' }) };
      if (name === 'belief' && args.length === 1) {
        const conviction = args[0] === 'clear' ? null : Number(args[0]);
        if (conviction !== null && (!Number.isFinite(conviction) || conviction < 0 || conviction > 1)) throw new Error('Conviction must be between 0 and 1, or clear.');
        return { text: this.issue({ type: 'override_belief', topic: 'control', conviction }) };
      }
      if (name === 'respond' && args.length >= 2) {
        const response = parseAction(args.slice(1));
        if (response.type === 'wildcard') throw new Error('Wildcards require their separate approval flow.');
        return { text: this.issue({ type: 'respond_to_evidence', evidenceId: args[0], response: response as ResponseAction }) };
      }
      return { text: this.issue({ type: 'take_action', action: parseAction([name, ...args]) }) };
    } catch (error) {
      return { text: `Error: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  if (args.includes('--help') || args.includes('-h')) { console.log(HELP); return; }
  let seed = 'first-race', scenario = 'full-28', resumeFile = '', demo = false, sessionDirectory = '.last-race-v3';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--demo') demo = true;
    else if (['--seed', '--scenario', '--resume', '--session-dir'].includes(args[i]) && args[i + 1]) {
      const flag = args[i++];
      if (flag === '--seed') seed = args[i]; else if (flag === '--scenario') scenario = args[i]; else if (flag === '--session-dir') sessionDirectory = args[i]; else resumeFile = args[i];
    } else throw new Error(`Unknown or incomplete argument: ${args[i]}. Use --help.`);
  }
  const session = new CliSession(new RunService(sessionDirectory));
  console.log('The Last Race — synthetic headless candidate. Type help for commands.');
  const existing = session.service.sessions().data as Array<{runId:string}>;
  const continueLatest = !resumeFile && !args.includes('--seed') && !args.includes('--scenario') && !demo && existing.length > 0;
  console.log(resumeFile ? (await session.line(`resume "${resumeFile}"`)).text : continueLatest ? (await session.line(`use ${existing.at(-1)!.runId}`)).text : session.start(seed, scenario));
  if (demo) {
    console.log('Automated demonstration; this does not pass the human fun gate.');
    for (let quarter = 0; quarter < 28; quarter++) {
      if (record(session.inspect('view').data).phase === 'ended') break;
      if (record(session.inspect('view').data).phase === 'milestone') console.log((await session.line('continue')).text);
      const preferred = quarter % 3 === 0 ? ['train', 'secure'] : quarter % 3 === 1 ? ['ship', 'investigate'] : ['secure', 'investigate'];
      for (const type of preferred) {
        const previews = session.inspect('actions').data as Array<{ action: Action; feasible: boolean }>;
        const candidate = previews.find(item => item.action.type === type && item.feasible);
        if (!candidate) { console.log(`\nDemo sacrifice: no feasible ${type} action in the current shared ledger.`); continue; }
        const action = candidate.action;
        const line = action.type === 'train' ? `train ${action.scale} ${action.method} ${action.focuses.join(' ')}` : action.type === 'ship' ? `ship ${action.model}` : action.type === 'secure' ? `secure ${action.amount}` : 'investigate';
        console.log(`\n> ${line}\n${(await session.line(line)).text}`);
      }
      console.log(`\n> end\n${(await session.line('end')).text}`);
    }
    console.log((await session.line('view')).text);
    return;
  }
  const input = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY && process.stdout.isTTY) });
  if (process.stdin.isTTY) { input.setPrompt('race> '); input.prompt(); }
  for await (const line of input) {
    const result = await session.line(line);
    if (result.text) console.log(result.text);
    if (result.quit) { input.close(); break; }
    if (process.stdin.isTTY) input.prompt();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1;
});
