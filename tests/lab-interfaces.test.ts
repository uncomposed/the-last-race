import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CliSession } from '../src/cli.js';
import { RunService, type ServiceResult } from '../src/service.js';
import type { CommandPayload } from '../src/types.js';

test('CLI lab actions, mandate, previews and checkpoint recovery work through the public session', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lab-cli-'));
  const service = new RunService(directory); const cli = new CliSession(service);
  try {
    const opening = cli.start('discovery:5', 'lab-12');
    assert.match(opening, /Deployments/); assert.match(opening, /Available actions: train, evaluate, deploy/); assert.doesNotMatch(opening, /Available actions: train, ship/);
    for (const command of ['brief', 'models', 'models all', 'mandate product 10 0', 'preview evaluate deepcent:compact coding supervised short standard', 'evaluate deepcent:compact coding supervised short standard', 'evaluate deepcent:general coding supervised short standard', 'quarter', 'end', 'deploy deepcent:compact coding supervised short 4', 'end']) {
      const result = await cli.line(command); assert.doesNotMatch(result.text, /^(Rejected|Error)|evaluate undefined|deploy undefined/, command);
    }
    const before = cli.inspect('models'); service.close();
    const recovered = new RunService(directory);
    try { assert.deepEqual(recovered.inspect(before.runId!, 'models'), before); } finally { recovered.close(); }
  } finally { service.close(); await rm(directory, { recursive: true, force: true }); }
});

test('real MCP exposes lab and business controls with schema validation and public-only results', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lab-mcp-'));
  const client = new Client({ name: 'lab-test', version: '1' });
  try {
    await client.connect(new StdioClientTransport({ command: process.execPath, args: ['--import', 'tsx', 'src/mcp.ts'], cwd: process.cwd(), stderr: 'pipe', env: { ...Object.fromEntries(Object.entries(process.env).filter((e): e is [string, string] => e[1] !== undefined)), LAST_RACE_SESSION_DIR: directory } }));
    const call = async (name: string, args: Record<string, unknown>) => {
      const raw = await client.callTool({ name, arguments: args }); const result = raw.structuredContent as unknown as ServiceResult;
      assert.equal(result?.ok, true, JSON.stringify(raw)); return result;
    };
    let run = await call('create_run', { seed: 'discovery:5', scenarioId: 'lab-12' });
    const issue = async (payload: CommandPayload) => { const { type, ...params } = payload; run = await call(type, { runId: run.runId, actorId: run.actorId, expectedRevision: run.revision, idempotencyKey: `mcp:${run.runId}:${run.revision}`, ...params }); };
    await issue({ type: 'set_mandate', mandate: { routine: 'product', cashFloor: 10, computeTarget: 0 } });
    await issue({ type: 'take_action', action: { type: 'evaluate', modelId: 'deepcent:compact', task: 'coding', harness: 'supervised', duration: 'short', suite: 'standard' } });
    await issue({ type: 'end_turn' });
    const models = await call('get_models', { runId: run.runId }); assert.doesNotMatch(JSON.stringify(models), /"modelTruth"|"hazard"|"abilities"/);
    await issue({ type: 'take_action', action: { type: 'deploy', modelId: 'deepcent:compact', task: 'coding', harness: 'supervised', duration: 'short', capacity: 4 } });
    await call('preview_quarter', { runId: run.runId }); await call('get_brief', { runId: run.runId }); await issue({ type: 'end_turn' });
    const invalid = await client.callTool({ name: 'take_action', arguments: { runId: run.runId, actorId: run.actorId, expectedRevision: run.revision, idempotencyKey: 'invalid', action: { type: 'deploy', modelId: 'deepcent:compact', task: 'coding', harness: 'supervised', duration: 'short', capacity: -1 } } });
    assert.equal(invalid.isError, true);
    run = await call('create_run', { seed: 'campaign:0', scenarioId: 'business-28' });
    for (let i = 0; i < 28 && (run.data as { view?: { phase: string }; phase?: string }).view?.phase !== 'milestone'; i++) await issue({ type: 'end_turn' });
    await issue({ type: 'continue_campaign' });
    assert.equal((run.data as { view: { phase: string; report: unknown } }).view.phase, 'planning');
    assert.equal((run.data as { view: { report: unknown } }).view.report, null);
  } finally { await client.close(); await rm(directory, { recursive: true, force: true }); }
});
