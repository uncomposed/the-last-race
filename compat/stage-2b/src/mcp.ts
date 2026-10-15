import { pathToFileURL } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { RunService, type ServiceResult, type Inspection } from './service.js';
import type { CommandPayload } from './types.js';

const nonempty = z.string().min(1);
const runSchema = { runId: nonempty };
const mutationSchema = {
  ...runSchema, actorId: nonempty, idempotencyKey: nonempty,
  expectedRevision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
};
const focus = z.enum(['reasoning', 'coding', 'science', 'agency']);
const concealment = z.union([z.literal(0), z.literal(1), z.literal(2)]).optional();
const topic = z.enum(['control', 'racing', 'capability', 'safety', 'credibility']);
const ruling = z.object({ effect: z.enum(['capacity', 'cash', 'safety']), amount: z.number().int(), price: z.number().int(), delay: z.number().int(), duration: z.number().int().nullable(), upkeep: z.number().int(), visibility: z.enum(['public', 'physical', 'covert']) }).strict();
const secure = z.object({ type: z.literal('secure'), amount: z.union([z.literal(1), z.literal(2)]), concealment }).strict();
const investigate = z.object({ type: z.literal('investigate'), topic, targetId: nonempty.optional() }).strict();
const action = z.discriminatedUnion('type', [
  z.object({ type: z.literal('train'), scale: z.enum(['small', 'large']), method: z.enum(['pretraining', 'rl']), focuses: z.tuple([focus, focus]), concealment }).strict(),
  z.object({ type: z.literal('ship'), model: z.enum(['own', 'third-party']) }).strict(),
  secure, investigate,
  z.object({ type: z.literal('build'), regionId: nonempty, scale: z.enum(['small', 'large']), power: z.enum(['grid', 'clean']), layout: z.enum(['concentrated', 'distributed']), concealment }).strict(),
  z.object({ type: z.literal('fund'), source: z.enum(['parent', 'external']), amount: z.union([z.literal(20), z.literal(40)]) }).strict(),
  z.object({ type: z.literal('announce'), claim: z.enum(['racing', 'safety', 'slowdown']), targetId: nonempty, value: z.boolean() }).strict(),
]);
const response = action;
function output(result: ServiceResult) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(result) }], structuredContent: result as unknown as Record<string, unknown>, isError: !result.ok };
}

export function createMcpServer(service = new RunService()): McpServer {
  const server = new McpServer({ name: 'the-last-race', version: '0.2.0' });
  server.registerTool('create_run', {
    description: 'Create a synthetic headless campaign. Returns runId, actorId, revision and public view. Session creation is not a player intervention.',
    inputSchema: z.object({ seed: nonempty, scenarioId: z.enum(['full-28', 'full-28-skeptical', 'full-28-low-detection', 'core-12', 'one-quarter']).default('full-28') }).strict(),
  }, ({ seed, scenarioId }) => output(service.create(seed, scenarioId)));
  server.registerTool('list_runs', { description: 'Recover durable session handles after restart; only player-visible summaries are returned.', inputSchema: z.object({}).strict(), annotations: { readOnlyHint: true } }, () => output(service.sessions()));
  server.registerTool('resume_run', {
    description: 'Import a compatible serialized offline save into a new session handle. Save text contains hidden world secrets; never narrate its raw contents.',
    inputSchema: z.object({ serialized: nonempty.max(5_000_000) }).strict(),
  }, ({ serialized }) => output(service.resume(serialized)));
  server.registerTool('save_run', {
    description: 'Export an explicitly labeled recoverable save as serialized text. CONTAINS HIDDEN SECRETS. No filesystem paths are accepted; client decides where to preserve the artifact.',
    inputSchema: z.object(runSchema).strict(), annotations: { readOnlyHint: true },
  }, ({ runId }) => output(service.save(runId)));
  const inspections: Array<[string, Inspection, string]> = [
    ['get_final_reveal', 'reveal', 'Explicit terminal-only reveal of hidden outcomes and undetected evidence; unavailable during play.'],
    ['preview_quarter', 'quarter', 'Preview ordered own-company effects, shared commitments, projects and remaining slots before ending the quarter.'],
    ['get_view', 'view', 'Inspect the current player-visible company, quarter, moves and resources.'],
    ['get_plan', 'plan', 'Inspect delegated routine plan, costs, conflicts and rationale.'],
    ['get_beliefs', 'beliefs', 'Inspect evidence posterior, probability bins, current conviction and company receptivity.'],
    ['get_feed', 'feed', 'Inspect detected player evidence and its interpretation status.'],
    ['get_rivals', 'rivals', 'Inspect observable rival information; private traits and plans remain concealed.'],
    ['get_rules', 'rules', 'Inspect scenario rules, synthetic assumptions and controls.'],
  ];
  for (const [name, kind, description] of inspections) {
    server.registerTool(name, { description, inputSchema: z.object(runSchema).strict(), annotations: { readOnlyHint: true } },
      ({ runId }) => output(service.inspect(runId, kind)));
  }
  server.registerTool('get_research', {
    description: 'Read dated historical research briefings available at this quarter opening. Omit id for the index; provide a case id for sources, limits and decision tradeoffs. Read-only reference material, not game evidence or calibrated probabilities.',
    inputSchema: z.object({ ...runSchema, id: nonempty.optional() }).strict(), annotations: { readOnlyHint: true },
  }, ({ runId, id }) => output(service.inspect(runId, 'research', id)));
  server.registerTool('list_actions', { description: 'List intervention presets or preview the exact optional action, including custom training choices. Returns costs, effect, visibility, detection estimates and current feasibility without spending a move.', inputSchema: z.object({ ...runSchema, action: action.optional() }).strict(), annotations: { readOnlyHint: true } },
    ({ runId, action: requestedAction }) => output(requestedAction ? service.preview(runId, requestedAction) : service.inspect(runId, 'actions')));
  server.registerTool('explain', { description: 'Explain a permitted public plan/evidence/action identifier or the current plan.', inputSchema: z.object({ ...runSchema, id: nonempty.optional() }).strict(), annotations: { readOnlyHint: true } },
    ({ runId, id }) => output(service.inspect(runId, 'explain', id)));
  const issue = (input: { runId: string; actorId: string; idempotencyKey: string; expectedRevision: number }, payload: CommandPayload) =>
    output(service.command(input.runId, { actorId: input.actorId, idempotencyKey: input.idempotencyKey, expectedRevision: input.expectedRevision, payload }));
  server.registerTool('take_action', { description: 'Spend one of three quarterly moves. Preview costs first; staged actions commit with the routine plan at end_turn.', inputSchema: z.object({ ...mutationSchema, action }).strict() },
    input => issue(input, { type: 'take_action', action: input.action }));
  server.registerTool('override_plan_item', { description: 'Spend one move to replace or veto the identified routine item. Explicit choices persist through plan revisions.', inputSchema: z.object({ ...mutationSchema, itemId: nonempty, choice: z.enum(['veto', 'lease', 'product', 'safety']) }).strict() },
    input => issue(input, { type: 'override_plan_item', itemId: input.itemId, choice: input.choice }));
  server.registerTool('override_belief', { description: 'Spend one move to impose a control-effectiveness conviction for four quarters, replace it, or remove it with null. Evidence continues learning underneath.', inputSchema: z.object({ ...mutationSchema, topic, targetId: nonempty.optional(), conviction: z.number().min(0).max(1).nullable() }).strict() },
    input => issue(input, { type: 'override_belief', topic: input.topic, ...(input.targetId ? { targetId: input.targetId } : {}), conviction: input.conviction }));
  server.registerTool('respond_to_evidence', { description: 'Spend one move to reassess a detected processed flagged item at full receptivity and force a feasible ordinary action response. Normal costs still apply.', inputSchema: z.object({ ...mutationSchema, evidenceId: nonempty, response }).strict() },
    input => issue(input, { type: 'respond_to_evidence', evidenceId: input.evidenceId, response: input.response }));
  server.registerTool('end_turn', { description: 'Commit feasible routine and strategic spending, resolve rivals and effects, and open the next quarter. Conflicts must first be corrected.', inputSchema: z.object(mutationSchema).strict() },
    input => issue(input, { type: 'end_turn' }));
  server.registerTool('propose_wildcard', { description: 'Propose a bounded typed local ruling. Spends no move or resources. Return the priced, timed proposal for human review.', inputSchema: z.object({ ...mutationSchema, proposal: nonempty.max(4000), ruling }).strict() },
    input => issue(input, { type: 'propose_wildcard', proposal: input.proposal, ruling: input.ruling }));
  server.registerTool('decide_wildcard', { description: 'Record an explicit HUMAN acceptance or rejection of the exact proposal. Never infer approval or auto-approve. Include the human’s attribution/statement. No move is spent.', inputSchema: z.object({ ...mutationSchema, proposalId: nonempty, decision: z.enum(['accept', 'reject']), humanApproval: nonempty.min(3).max(500) }).strict() },
    input => issue(input, { type: 'decide_wildcard', proposalId: input.proposalId, decision: input.decision, humanApproval: input.humanApproval }));
  server.registerTool('apply_wildcard', { description: 'Apply an explicitly human-accepted proposal from this quarter once per run. Spends one of the three ordinary slots and pays the stated price.', inputSchema: z.object({ ...mutationSchema, proposalId: nonempty }).strict() },
    input => issue(input, { type: 'apply_wildcard', proposalId: input.proposalId }));
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createMcpServer(new RunService(process.env.LAST_RACE_SESSION_DIR ?? '.last-race')).connect(new StdioServerTransport()).catch(error => {
    console.error('MCP startup failed:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
