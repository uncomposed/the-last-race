import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getResearch, quarterOpening, researchForAction } from '../src/research.js';
import { RunService } from '../src/service.js';
import { CliSession, parseAction } from '../src/cli.js';
import { createRun, listActions, saveRun } from '../src/engine.js';

test('research is gated by quarter opening, including direct IDs and action previews', () => {
  assert.equal(quarterOpening(0), '2025-01-01');
  assert.equal(quarterOpening(2), '2025-07-01');
  assert.equal(quarterOpening(27), '2031-10-01');
  for (const q of [0, 1]) {
    const index = getResearch(q);
    assert.equal(index.cases!.length, 5);
    assert.doesNotMatch(JSON.stringify(index), /sycophancy|agentic-misalignment/i);
    for (const id of ['agentic-misalignment', 'sycophancy-review', 'sycophancy-release']) {
      assert.equal(getResearch(q, id).card, null);
      assert.deepEqual(getResearch(q, id), getResearch(q, 'unknown'));
      assert.ok(!JSON.stringify(researchForAction(q, { type: 'ship', model: 'own' })).includes(id));
    }
  }
  assert.equal(getResearch(2).cases!.length, 8);
  assert.ok(getResearch(2, 'agentic-misalignment').card);
  assert.deepEqual(getResearch(27).cases, getResearch(2).cases);
  for (const q of [-1, 28, NaN, 0.5]) assert.throws(() => getResearch(q));
});

test('case provenance retains original records, corrections, mirrors and uncertainty', async () => {
  const snapshot = JSON.parse(await readFile(new URL('../research/supplied-dataset.json', import.meta.url), 'utf8'));
  assert.equal(snapshot.records.length, 13);
  assert.equal(snapshot.coverage.length, 30);
  assert.equal(snapshot.coverage.filter((r: { Status: string }) => r.Status === 'NOT FOUND').length, 27);
  const records = new Map(snapshot.records.map((r: { Record_ID: string }) => [r.Record_ID, r]));
  for (const item of getResearch(27).cases!) {
    const card = getResearch(27, item.id).card!;
    assert.ok(card.limitation && card.tradeoff && card.decision && card.sources.length);
    for (const id of card.recordIds) assert.ok(records.has(id));
    for (const source of card.sources) assert.equal(new URL(source).protocol, 'https:');
  }
  const apollo = getResearch(0, 'in-context-scheming').card!;
  assert.match(apollo.sources[0], /apolloresearch/);
  assert.equal(snapshot.records.find((r: { Record_ID: string }) => r.Record_ID === 'D1-0002').Source_URL, 'https://arxiv.org/abs/2412.14093');
  assert.deepEqual(getResearch(0, 'fukushima-assumptions').card!.recordIds, ['D2-0005', 'F3-0001']);
  assert.match(getResearch(0, 'fukushima-assumptions').card!.limitation, /no power price/);
  assert.equal(getResearch(2, 'sycophancy-review').card!.caseGroup, getResearch(2, 'sycophancy-release').card!.caseGroup);
  const ship = researchForAction(2, { type: 'ship', model: 'own' });
  assert.equal(ship.briefings.filter(c => c.id.startsWith('sycophancy')).length, 1);
});

test('all suggested commands parse and briefing reads cannot change simulation state', async () => {
  const service = new RunService();
  const created = service.create('research-compatibility');
  const before = service.save(created.runId!);
  const baseline = createRun('research-compatibility', 'full-28');
  const baselineSave = saveRun(baseline);
  assert.equal((before.data as { serialized: string }).serialized, baselineSave);
  for (const item of getResearch(27).cases!) {
    const card = getResearch(27, item.id).card!;
    for (const command of card.commands) {
      if (['feed', 'beliefs', 'plan', 'quarter'].includes(command)) continue;
      const action = parseAction(command.replace(/^preview /, '').split(' '));
      assert.ok(service.preview(created.runId!, action).ok);
    }
    service.inspect(created.runId!, 'research', item.id);
  }
  for (const entry of listActions(baseline)) {
    const result = service.preview(created.runId!, entry.action);
    const [{ research, ...original }] = result.data as Array<typeof entry & { research: unknown }>;
    assert.ok(research);
    assert.deepEqual(original, entry);
  }
  assert.deepEqual(service.save(created.runId!), before);
  const invalidResponse = service.command(created.runId!, {
    actorId: created.actorId!, expectedRevision: created.revision!, idempotencyKey: 'reference-is-not-evidence',
    payload: { type: 'respond_to_evidence', evidenceId: 'alignment-faking', response: { type: 'secure', amount: 1 } },
  });
  assert.equal(invalidResponse.ok, false);
  assert.deepEqual(service.save(created.runId!), before);
  assert.equal(service.resume(baselineSave).ok, true);
  const copy = getResearch(0, 'alignment-faking');
  copy.card!.sources[0] = 'mutated';
  assert.notEqual(getResearch(0, 'alignment-faking').card!.sources[0], 'mutated');
  assert.equal(service.inspect('missing', 'research').ok, false);
});

test('CLI discovers research, prints sources, and unlocks reports during ordinary play', async () => {
  const session = new CliSession();
  assert.match(session.start('research-cli'), /use research/);
  assert.match((await session.line('research')).text, /alignment-faking/);
  assert.match((await session.line('research alignment-faking')).text, /https:\/\/www.anthropic.com/);
  assert.match((await session.line('research agentic-misalignment')).text, /No available research/);
  assert.match((await session.line('preview train small rl science agency')).text, /Oversight can become a target/);
  assert.match((await session.line('view')).text, /3 of 3 moves remaining/);
  for (let q = 0; q < 2; q++) assert.doesNotMatch((await session.line('end')).text, /Rejected|Error/);
  assert.match((await session.line('research agentic-misalignment')).text, /2025-06-20/);
  assert.match((await session.line('research extra arguments')).text, /Unexpected arguments/);
});
