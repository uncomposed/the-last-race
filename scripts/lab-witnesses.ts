import { createRun, execute, getModels, getView, listActions } from '../src/engine.js';
import type { Action, CommandPayload, RunState } from '../src/types.js';

export type LabStrategy = 'product' | 'frontier' | 'integrator' | 'cooperation';
export function runLabStrategy(seed: string, strategy: LabStrategy): RunState {
  let state = createRun(seed, 'lab-12');
  const commit = (payload: CommandPayload) => {
    const result = execute(state, { actorId: state.playerId, expectedRevision: state.revision, idempotencyKey: `lab-policy:${state.revision}`, payload });
    if (!result.ok) throw new Error(result.error?.message); state = result.state;
  };
  const attempt = (action: Action) => { try { if (listActions(state, action)[0].feasible) commit({ type: 'take_action', action }); } catch { /* unavailable observed choice; retain resources */ } };
  while (state.phase !== 'ended') {
    if (state.phase === 'milestone') { commit({ type: 'continue_campaign' }); continue; }
    if (state.quarter === 0) commit({ type: 'set_mandate', mandate: { routine: strategy === 'frontier' ? 'automatic' : 'product', cashFloor: 10, computeTarget: strategy === 'frontier' ? 4 : 0 } });
    const view = getView(state); const models = getModels(state)!; const task = 'coding';
    if (view.player.cash < 30 && view.campaign!.remainingParentBudget >= 20) attempt({ type: 'fund', source: 'parent', amount: 20 });
    if (strategy === 'cooperation' && state.quarter % 3 === 0) attempt({ type: 'announce', claim: 'slowdown', targetId: state.playerId, value: true });
    if (strategy === 'frontier' && state.quarter < 8) attempt({ type: 'train', scale: 'small', method: 'pretraining', focuses: ['reasoning', 'coding'] });
    const candidates = models.models.filter(m => strategy === 'integrator' ? m.ownerId === 'vendor' : m.ownerId === state.playerId);
    for (const model of candidates) {
      const assessment = model.assessments.find(a => a.task === task && a.harness === 'supervised' && a.duration === 'short')!;
      if (!assessment.evidenceIds.length) attempt({ type: 'evaluate', modelId: model.id, task, harness: 'supervised', duration: 'short', suite: 'standard' });
    }
    const ranked = [...candidates].sort((a, b) => b.assessments.find(x => x.task === task && x.harness === 'supervised' && x.duration === 'short')!.expectedSuccess - a.assessments.find(x => x.task === task && x.harness === 'supervised' && x.duration === 'short')!.expectedSuccess);
    const desired = ranked[0]; const existing = models.deployments.find(d => d.task === task);
    const capacity = strategy === 'integrator' ? 6 : 4;
    if (desired && (!existing || existing.modelId !== desired.id || existing.capacity !== capacity)) attempt({ type: 'deploy', modelId: desired.id, task, harness: 'supervised', duration: 'short', capacity });
    if (strategy === 'cooperation' && view.player.safety < 8) attempt({ type: 'secure', amount: 1 });
    if (strategy === 'frontier' && !view.campaign!.assets.length && view.player.cash > 60 && !view.projects.some(p => p.kind === 'build')) attempt({ type: 'build', regionId: 'texas', scale: 'small', power: 'grid', layout: 'concentrated' });
    commit({ type: 'end_turn' });
  }
  return state;
}
