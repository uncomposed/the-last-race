import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, execute, listActions } from '../src/engine.js';
import type { Action, CommandPayload, RunState } from '../src/types.js';

function accept(state: RunState, payload: CommandPayload): RunState {
  const result = execute(state, { actorId: state.playerId, expectedRevision: state.revision, idempotencyKey: `risk:${state.revision}`, payload });
  assert.equal(result.ok, true, result.error?.message);
  return result.state;
}
const train: Action = { type: 'train', scale: 'small', method: 'rl', focuses: ['reasoning', 'agency'] };
function playerIncident(state: RunState) {
  const trace = state.traces.find(item => item.actorId === state.playerId && item.kind === 'private-incident');
  assert.ok(trace);
  return trace.details as { actionRisk: number; mitigation: number; risk: number; attempt: boolean; success: boolean; detected: boolean };
}

test('arbitrarily large safety spending cannot exceed the hidden mitigation ceiling', () => {
  let state = createRun('risk-ceiling', 'one-quarter');
  // Counterfactual verification fixture, not a playable or resumable save.
  state.hidden.controlEffectiveness = 0.2;
  state.actors[state.playerId].safety = 1_000_000;
  state = accept(state, { type: 'take_action', action: train });
  state = accept(state, { type: 'end_turn' });
  const incident = playerIncident(state);
  assert.ok(incident.mitigation <= 0.2);
  assert.ok(incident.risk >= incident.actionRisk * 0.8);
  assert.ok(incident.risk > 0);
});

test('Secure before Train lowers exposure risk; a later Secure does not retroactively protect training', () => {
  const resolve = (first: boolean) => {
    let state = createRun('risk-order', 'one-quarter');
    const actions: Action[] = first ? [{ type: 'secure', amount: 1 }, train] : [train, { type: 'secure', amount: 1 }];
    for (const action of actions) state = accept(state, { type: 'take_action', action });
    return accept(state, { type: 'end_turn' });
  };
  const early = resolve(true); const late = resolve(false);
  assert.equal(early.actors.deepcent.safety, late.actors.deepcent.safety);
  assert.ok(playerIncident(early).risk < playerIncident(late).risk);
  let previewState = createRun('risk-order');
  const before = listActions(previewState, train)[0];
  previewState = accept(previewState, { type: 'take_action', action: { type: 'secure', amount: 1 } });
  assert.ok(listActions(previewState, train)[0].expectedContainmentRisk! < before.expectedContainmentRisk!);
});

test('separate attempt, containment and detection pathways have seeded witnesses', () => {
  const witnesses = new Set<string>();
  // Retained witnesses found by a bounded search, so this is not a stochastic test.
  for (const i of [0, 1, 2, 159, 197]) {
    let state = createRun(`incident-witness:${i}`, 'one-quarter');
    state = accept(state, { type: 'take_action', action: train });
    state = accept(state, { type: 'end_turn' });
    const event = playerIncident(state);
    if (!event.attempt) {
      assert.equal(event.success, false); assert.equal(event.detected, false);
      witnesses.add('no-attempt');
    } else if (event.success) witnesses.add(event.detected ? 'detected-failure' : 'hidden-failure');
    else witnesses.add(event.detected ? 'warning-shot' : 'undetected-contained-attempt');
  }
  assert.deepEqual([...witnesses].sort(), ['detected-failure', 'hidden-failure', 'no-attempt', 'undetected-contained-attempt', 'warning-shot']);
});
