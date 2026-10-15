import { createInterface } from 'node:readline';
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { RunService, type ServiceResult, type Inspection } from './service.js';
import type { Action, CommandPayload, Focus, ResponseAction } from './types.js';

export const HELP = `The Last Race — Stage 2a synthetic strategy prototype
Your company runs routine operations. You have three interventions per quarter.
Inspect the plan and beliefs, make sacrifices, then end the quarter.

Usage: npm run play -- [--seed TEXT] [--scenario core-12|one-quarter]
       npm run play -- --resume FILE
       npm run play -- --demo [--seed TEXT]

Inspection: view | plan | beliefs | feed | rivals | actions | rules | explain [ID]
  preview ACTION      inspect any exact action without spending a move
  preview train small rl reasoning agency
Interventions (each spends one move):
  train small|large pretraining|rl FOCUS FOCUS
    FOCUS: reasoning, coding, science, agency (choose two different focuses)
    reasoning adds capability; coding adds recurring revenue; science adds safety;
    agency adds capability and risk. RL also adds capability and risk.
    Effects arrive when training completes; actions shows exact current previews.
  ship own|third-party
  secure 1|2
  investigate
  veto ITEM_ID
  plan-set ITEM_ID lease|product|safety
  belief NUMBER       impose a 0..1 control-effectiveness conviction for four quarters
  belief clear        remove a conviction
  respond EVIDENCE_ID secure 1|2
  respond EVIDENCE_ID investigate
Other commands:
  end                 commit the quarter (resolve resource conflicts first)
  save FILE           write a recoverable save containing hidden secrets
  resume FILE         resume a compatible save
  new SEED [SCENARIO]  start another run
  help | quit

Use quotes around file paths or seeds containing spaces. Wildcards arrive in Stage 2b.
An automated demo proves playability; the owner must still complete the human fun gate.`;

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
    `${player.name}: cash ${player.cash}M · compute ${player.compute} · capability ${player.capability} · product ${player.product} · safety ${player.safety} · revenue ${player.revenue}M/q · influence ${player.influence}`,
  ];
  if (view.phase === 'planning') rows.push(`Shared ledger: cash ${resources.committedCash}/${resources.availableCash}M committed; compute ${resources.committedCompute}/${resources.availableCompute} committed.`);
  if (Array.isArray(resources.conflicts) && resources.conflicts.length) rows.push(`Resolve before ending: ${resources.conflicts.join('; ')}`);
  if (Array.isArray(view.interventions) && view.interventions.length && view.phase === 'planning') {
    rows.push('Staged interventions:');
    for (const raw of view.interventions) {
      const entry = record(raw), action = record(entry.action);
      const detail = action.type === 'train' ? `${action.scale} ${action.method} (${(action.focuses as string[]).join(', ')})` : action.type === 'ship' ? action.model : action.type === 'secure' ? action.amount : action.topic;
      rows.push(`  ${entry.id}: ${action.type} ${detail} — ${entry.cashCost}M, ${entry.computeCost} compute${entry.forcedByEvidence ? `; responds to ${entry.forcedByEvidence}` : ''}`);
    }
  }
  if (Array.isArray(view.projects) && view.projects.length) {
    rows.push('Training projects:');
    for (const raw of view.projects) {
      const project = record(raw);
      rows.push(`  ${project.id}: ${project.remaining} openings left; +${project.gain} capability; focuses ${(project.focuses as string[]).join(', ')}`);
    }
  }
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
  const [type, first, second, third, fourth] = args;
  if (type === 'train' && args.length === 5 && ['small', 'large'].includes(first) && ['pretraining', 'rl'].includes(second) && focuses.includes(third) && focuses.includes(fourth))
    return { type, scale: first as 'small' | 'large', method: second as 'pretraining' | 'rl', focuses: [third as Focus, fourth as Focus] };
  if (type === 'ship' && args.length === 2 && ['own', 'third-party'].includes(first)) return { type, model: first as 'own' | 'third-party' };
  if (type === 'secure' && args.length === 2 && ['1', '2'].includes(first)) return { type, amount: Number(first) as 1 | 2 };
  if (type === 'investigate' && args.length === 1) return { type, topic: 'control' };
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
  start(seed: string, scenarioId = 'core-12'): string { return this.accept(this.service.create(seed, scenarioId)); }
  inspect(kind: Inspection): ServiceResult { return this.service.inspect(this.runId, kind); }
  private issue(payload: CommandPayload): string {
    return this.accept(this.service.command(this.runId, { actorId: this.actorId, expectedRevision: this.revision, idempotencyKey: `cli-${randomUUID()}`, payload }));
  }
  async line(line: string): Promise<{ text: string; quit?: boolean }> {
    try {
      const args = words(line);
      const name = args.shift();
      if (!name) return { text: '' };
      if (name === 'quit' || name === 'exit') return { text: 'Run left in memory. Use save before quitting to keep progress.', quit: true };
      if (name === 'help') return { text: HELP };
      if (name === 'new') {
        if (!args[0] || args.length > 2) throw new Error('Usage: new SEED [core-12|one-quarter]');
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
      const inspections: Record<string, Inspection> = { view: 'view', plan: 'plan', beliefs: 'beliefs', feed: 'feed', rivals: 'rivals', actions: 'actions', rules: 'rules', explain: 'explain' };
      if (name in inspections) {
        if (args.length > (name === 'explain' ? 1 : 0)) throw new Error(`Unexpected arguments for ${name}.`);
        return { text: this.accept(this.service.inspect(this.runId, inspections[name], args[0])) };
      }
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
        if (response.type !== 'secure' && response.type !== 'investigate') throw new Error('Respond supports secure or investigate.');
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
  let seed = 'first-race', scenario = 'core-12', resumeFile = '', demo = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--demo') demo = true;
    else if (['--seed', '--scenario', '--resume'].includes(args[i]) && args[i + 1]) {
      const flag = args[i++];
      if (flag === '--seed') seed = args[i]; else if (flag === '--scenario') scenario = args[i]; else resumeFile = args[i];
    } else throw new Error(`Unknown or incomplete argument: ${args[i]}. Use --help.`);
  }
  const session = new CliSession();
  console.log('The Last Race — synthetic Stage 2a prototype. Type help for commands.');
  console.log(resumeFile ? (await session.line(`resume "${resumeFile}"`)).text : session.start(seed, scenario));
  if (demo) {
    console.log('Automated demonstration; this does not pass the human fun gate.');
    for (let quarter = 0; quarter < 12; quarter++) {
      if (record(session.inspect('view').data).phase === 'ended') break;
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
