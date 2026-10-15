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
const secure = z.object({ type: z.literal('secure'), amount: z.union([z.literal(1), z.literal(2)]) }).strict();
const investigate = z.object({ type: z.literal('investigate'), topic: z.literal('control') }).strict();
const response = z.discriminatedUnion('type', [secure, investigate]);
const action = z.discriminatedUnion('type', [
  z.object({ type: z.literal('train'), scale: z.enum(['small', 'large']), method: z.enum(['pretraining', 'rl']), focuses: z.tuple([focus, focus]) }).strict(),
  z.object({ type: z.literal('ship'), model: z.enum(['own', 'third-party']) }).strict(),
  secure, investigate,
]);
function output(result: ServiceResult) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(result) }], structuredContent: result as unknown as Record<string, unknown>, isError: !result.ok };
}

export function createMcpServer(service = new RunService()): McpServer {
  const server = new McpServer({ name: 'the-last-race', version: '0.1.0' });
  server.registerTool('create_run', {
    description: 'Create a synthetic Stage 2a run. Returns runId, actorId, revision and public view. Session creation is not a player intervention.',
    inputSchema: z.object({ seed: nonempty, scenarioId: z.enum(['core-12', 'one-quarter']).default('core-12') }).strict(),
  }, ({ seed, scenarioId }) => output(service.create(seed, scenarioId)));
  server.registerTool('resume_run', {
    description: 'Import a compatible serialized offline save into a new session handle. Save text contains hidden world secrets; never narrate its raw contents.',
    inputSchema: z.object({ serialized: nonempty.max(5_000_000) }).strict(),
  }, ({ serialized }) => output(service.resume(serialized)));
  server.registerTool('save_run', {
    description: 'Export an explicitly labeled recoverable save as serialized text. CONTAINS HIDDEN SECRETS. No filesystem paths are accepted; client decides where to preserve the artifact.',
    inputSchema: z.object(runSchema).strict(), annotations: { readOnlyHint: true },
  }, ({ runId }) => output(service.save(runId)));
  const inspections: Array<[string, Inspection, string]> = [
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
  server.registerTool('override_belief', { description: 'Spend one move to impose a control-effectiveness conviction for four quarters, replace it, or remove it with null. Evidence continues learning underneath.', inputSchema: z.object({ ...mutationSchema, topic: z.literal('control'), conviction: z.number().min(0).max(1).nullable() }).strict() },
    input => issue(input, { type: 'override_belief', topic: input.topic, conviction: input.conviction }));
  server.registerTool('respond_to_evidence', { description: 'Spend one move to reassess a detected processed flagged item at full receptivity and force a feasible secure/investigate response. Normal costs still apply.', inputSchema: z.object({ ...mutationSchema, evidenceId: nonempty, response }).strict() },
    input => issue(input, { type: 'respond_to_evidence', evidenceId: input.evidenceId, response: input.response }));
  server.registerTool('end_turn', { description: 'Commit feasible routine and strategic spending, resolve rivals and effects, and open the next quarter. Conflicts must first be corrected.', inputSchema: z.object(mutationSchema).strict() },
    input => issue(input, { type: 'end_turn' }));
  server.registerTool('propose_wildcard', { description: 'Wildcard proposals are unavailable in Stage 2a. Stage 2b requires explicit human approval; this tool cannot spend moves or alter the run.', inputSchema: z.object({ ...mutationSchema, proposal: nonempty.max(4000) }).strict(), annotations: { readOnlyHint: true } },
    ({ runId }) => {
      const current = service.inspect(runId, 'view');
      if (!current.ok) return output(current);
      return output({ ok: false, runId, actorId: current.actorId, revision: current.revision, error: { code: 'UNAVAILABLE_STAGE_2A', message: 'Wildcards are a Stage 2b feature and require human approval. No state or moves changed.' } });
    });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createMcpServer().connect(new StdioServerTransport()).catch(error => {
    console.error('MCP startup failed:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
