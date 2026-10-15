import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { RunService, type ServiceResult } from '../src/service.js';
import { CliSession, HELP } from '../src/cli.js';
import type { Command } from '../src/types.js';

function command(created: ServiceResult, payload: Command['payload'], key = 'test-key'): Command {
  return { actorId: created.actorId!, expectedRevision: created.revision!, idempotencyKey: key, payload };
}

test('service commands enforce identity, revisions, and exact idempotent retries', () => {
  const service = new RunService();
  const created = service.create('interface-check');
  assert.equal(created.ok, true);
  const runId = created.runId!;
  const before = service.save(runId);
  const original = command(created, { type: 'take_action', action: { type: 'secure', amount: 1 } });
  const wrongActor = service.command(runId, { ...original, actorId: 'openbrain' });
  assert.equal(wrongActor.ok, false);
  assert.deepEqual(service.save(runId), before);
  const missingIdentity = service.command(runId, { ...original, actorId: '' });
  assert.equal(missingIdentity.ok, false);
  assert.deepEqual(service.save(runId), before);
  const accepted = service.command(runId, original);
  assert.equal(accepted.ok, true);
  const after = service.save(runId);
  assert.equal(service.command(runId, original).ok, true);
  assert.deepEqual(service.save(runId), after);
  assert.equal(service.command(runId, { ...original, idempotencyKey: 'stale' }).ok, false);
  assert.equal(service.command(runId, { ...original, expectedRevision: accepted.revision!, payload: { type: 'end_turn' } }).ok, false);
  assert.deepEqual(service.save(runId), after);
});

test('save/resume labels secret artifact and ordinary service results stay public', () => {
  const service = new RunService();
  const created = service.create('secret-check');
  for (const kind of ['view', 'plan', 'beliefs', 'feed', 'rivals', 'actions', 'rules', 'explain', 'research'] as const) {
    const inspected = service.inspect(created.runId!, kind);
    assert.equal(inspected.ok, true);
    const text = JSON.stringify(inspected);
    for (const privateKey of ['"controlEffectiveness"', '"undetectedIncidents"', '"receipts"', '"traces"']) assert.equal(text.includes(privateKey), false, `${kind} leaks ${privateKey}`);
  }
  const artifact = service.save(created.runId!).data as { containsSecrets: boolean; serialized: string };
  assert.equal(artifact.containsSecrets, true);
  assert.ok(artifact.serialized.includes('hidden'));
  const resumed = service.resume(artifact.serialized);
  assert.equal(resumed.ok, true);
  assert.deepEqual(resumed.data, created.data);
  assert.equal(service.inspect('missing', 'view').ok, false);
  assert.equal(service.resume('{}').error?.code, 'INVALID_SAVE');
});

test('plain CLI supports quarter loop and local save/resume without printing artifact secrets', async () => {
  const session = new CliSession();
  const directory = await mkdtemp(join(tmpdir(), 'last-race-'));
  try {
    session.start('cli-test', 'one-quarter');
    for (const line of ['plan', 'beliefs', 'rivals', 'actions', 'rules', 'ship third-party', 'secure 1', 'investigate']) {
      const result = await session.line(line);
      assert.doesNotMatch(result.text, /^(Rejected|Error)/);
    }
    const filename = join(directory, 'my save.json');
    const saved = await session.line(`save "${filename}"`);
    assert.match(saved.text, /contains hidden world secrets/);
    assert.doesNotMatch(saved.text, /"hidden"/);
    assert.ok((await readFile(filename, 'utf8')).includes('hidden'));
    assert.match((await session.line('end')).text, /societal outcome|societalOutcome/);
    assert.match((await session.line(`resume "${filename}"`)).text, /revision 3/);
    assert.match(HELP, /respond EVIDENCE_ID/);
    assert.match((await session.line('secure 99')).text, /Invalid action/);
    assert.equal((await session.line('quit')).quit, true);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('exact custom action previews are public and mutation-free', async () => {
  const service = new RunService();
  const created = service.create('exact-preview');
  const before = service.save(created.runId!);
  const action = { type: 'train' as const, scale: 'small' as const, method: 'rl' as const, focuses: ['reasoning', 'agency'] as ['reasoning', 'agency'] };
  const preview = service.preview(created.runId!, action);
  assert.equal(preview.ok, true);
  assert.equal(preview.revision, created.revision);
  const options = preview.data as Array<{ action: unknown; effect: string }>;
  assert.equal(options.length, 1);
  assert.deepEqual(options[0].action, action);
  assert.match(options[0].effect, /Delayed capability gain 7/);
  assert.deepEqual(service.save(created.runId!), before);
  const session = new CliSession();
  session.start('exact-preview');
  const result = await session.line('preview train small rl reasoning agency');
  assert.match(result.text, /Delayed capability gain 7/);
  assert.match((await session.line('view')).text, /3 of 3 moves remaining/);
  assert.equal(service.preview('missing', action).error?.code, 'RUN_NOT_FOUND');
});

test('CLI exposes Train, plan replacements, conviction removal and Respond', async () => {
  const session = new CliSession();
  session.start('all-controls');
  const plan = session.inspect('plan').data as { items: Array<{ id: string }> };
  for (const line of ['belief 0.1', 'belief clear', `plan-set ${plan.items[0].id} safety`]) {
    assert.doesNotMatch((await session.line(line)).text, /^(Rejected|Error)/);
  }
  assert.match((await session.line('investigate')).text, /MOVE_LIMIT/);
  session.start('respond-controls');
  const feed = session.inspect('feed').data as Array<{ id: string; canRespond: boolean }>;
  const flagged = feed.find(item => item.canRespond)!;
  assert.ok(flagged);
  assert.doesNotMatch((await session.line(`respond ${flagged.id} secure 1`)).text, /^(Rejected|Error)/);
  assert.match((await session.line(`respond ${flagged.id} investigate`)).text, /ALREADY_RESPONDED/);
  session.start('train-controls');
  assert.doesNotMatch((await session.line('train small rl reasoning coding')).text, /^(Rejected|Error)/);
  const fresh = session.inspect('plan').data as { items: Array<{ id: string }> };
  assert.doesNotMatch((await session.line(`veto ${fresh.items[0].id}`)).text, /^(Rejected|Error)/);
});

test('real SDK stdio handshake, tool schema validation and a playable quarter', async () => {
  const sessionDir = await mkdtemp(join(tmpdir(), 'race-sdk-'));
  const transport = new StdioClientTransport({ env: { ...Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)), LAST_RACE_SESSION_DIR: sessionDir }, command: process.execPath, args: ['--import', 'tsx', 'src/mcp.ts'], cwd: process.cwd(), stderr: 'pipe' });
  const client = new Client({ name: 'interface-test', version: '1.0.0' });
  try {
    await client.connect(transport);
    const listed = await client.listTools();
    const names = listed.tools.map(tool => tool.name);
    for (const name of ['create_run', 'save_run', 'resume_run', 'get_view', 'get_plan', 'override_plan_item', 'get_beliefs', 'get_feed', 'get_rivals', 'list_actions', 'take_action', 'override_belief', 'respond_to_evidence', 'end_turn', 'explain', 'get_rules', 'propose_wildcard']) assert.ok(names.includes(name));
    for (const name of ['take_action', 'override_plan_item', 'override_belief', 'respond_to_evidence', 'end_turn']) {
      const schema = listed.tools.find(tool => tool.name === name)!.inputSchema;
      for (const field of ['actorId', 'idempotencyKey', 'expectedRevision']) assert.ok(schema.required?.includes(field));
    }
    const call = async (name: string, args: Record<string, unknown>): Promise<ServiceResult> => {
      const result = await client.callTool({ name, arguments: args });
      return result.structuredContent as unknown as ServiceResult;
    };
    const created = await call('create_run', { seed: 'mcp-quarter', scenarioId: 'one-quarter' });
    assert.equal(created.ok, true);
    const research = await call('get_research', { runId: created.runId, id: 'alignment-faking' });
    assert.equal(research.ok, true);
    assert.equal(research.revision, created.revision);
    assert.match(JSON.stringify(research.data), /anthropic.com/);
    const futureResearch = await call('get_research', { runId: created.runId, id: 'agentic-misalignment' });
    assert.equal((futureResearch.data as { card: unknown }).card, null);
    const custom = await call('list_actions', { runId: created.runId, action: { type: 'train', scale: 'small', method: 'rl', focuses: ['reasoning', 'agency'] } });
    assert.equal(custom.ok, true);
    assert.equal(custom.revision, created.revision);
    assert.equal((custom.data as unknown[]).length, 1);
    const invalid = await client.callTool({ name: 'end_turn', arguments: { runId: created.runId } });
    assert.equal(invalid.isError, true);
    const metadata = { runId: created.runId, actorId: created.actorId, expectedRevision: created.revision, idempotencyKey: 'sdk-secure' };
    const acted = await call('take_action', { ...metadata, action: { type: 'secure', amount: 1 } });
    assert.equal(acted.ok, true);
    const wildcard = await call('propose_wildcard', { ...metadata, expectedRevision: acted.revision, idempotencyKey: 'wildcard', proposal: 'Purchase compute', ruling: { effect: 'capacity', amount: 4, price: 12, delay: 0, duration: null, upkeep: 1, visibility: 'physical' } });
    assert.equal(wildcard.error?.code, 'INVALID_OR_INFEASIBLE');
    const ended = await call('end_turn', { ...metadata, expectedRevision: acted.revision, idempotencyKey: 'sdk-end' });
    assert.equal(ended.ok, true);
    assert.equal((ended.data as { view: { phase: string } }).view.phase, 'ended');
    const saved = await call('save_run', { runId: created.runId });
    const artifact = saved.data as { serialized: string; containsSecrets: boolean };
    assert.equal(artifact.containsSecrets, true);
    assert.equal((await call('resume_run', { serialized: artifact.serialized })).ok, true);
    const pathInjection = await client.callTool({ name: 'save_run', arguments: { runId: created.runId, path: '/tmp/should-not-write' } });
    assert.equal(pathInjection.isError, true);
  } finally { await client.close(); await rm(sessionDir, { recursive: true, force: true }); }
});
