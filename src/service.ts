import {
  createRun, execute, getView, getPlan, getBeliefs, getFeed, getRivals,
  listActions, explain, getRules, saveRun, resumeRun, previewQuarter, getFinalReveal, getModels, getBrief,
} from './engine.js';
import { Checkpoints } from './checkpoints.js';
import { getResearch, researchForAction } from './research.js';
import type { Action, Command, RunState } from './types.js';

export type Inspection = 'view' | 'plan' | 'beliefs' | 'feed' | 'rivals' | 'actions' | 'rules' | 'explain' | 'quarter' | 'reveal' | 'research' | 'models' | 'brief';
export interface ServiceResult {
  ok: boolean;
  runId?: string;
  actorId?: string;
  revision?: number;
  data?: unknown;
  error?: { code: string; message: string };
}
const selectors = { models: getModels, brief: getBrief, view: getView, plan: getPlan, beliefs: getBeliefs, feed: getFeed, rivals: getRivals, actions: listActions, rules: getRules, quarter: previewQuarter, reveal: getFinalReveal };
// Presentation enrichment stays outside the replay engine. Research never enters
// a belief update or consumes a random draw; existing saves retain their identity.
function actionsWithResearch(state: RunState, action?: Action) {
  return listActions(state, action).map(preview => ({ ...preview, research: researchForAction(state.quarter, preview.action) }));
}

/** Session handles never grant access to private world state. Only save exports secrets. */
export class RunService {
  private readonly runs = new Map<string, RunState>();
  private nextId = 1;
  private checkpoints?: Checkpoints;
  constructor(directory?: string) {
    if (directory) {
      this.checkpoints = new Checkpoints(directory);
      try {
        for (const [id, state] of this.checkpoints.load()) { this.runs.set(id, state); this.nextId = Math.max(this.nextId, Number(id.slice(4)) + 1); }
      } catch (error) { this.checkpoints.close(); throw error; }
    }
  }
  close(): void { this.checkpoints?.close(); }
  sessions(): ServiceResult {
    return { ok: true, data: [...this.runs].map(([runId, state]) => ({ runId, actorId: state.playerId, revision: state.revision, view: getView(state) })) };
  }
  private put(runId: string, state: RunState): void { this.checkpoints?.write(runId, state); this.runs.set(runId, state); }


  private envelope(runId: string, state: RunState, data: unknown): ServiceResult {
    return { ok: true, runId, actorId: state.playerId, revision: state.revision, data: structuredClone(data) };
  }
  private missing(): ServiceResult {
    return { ok: false, error: { code: 'RUN_NOT_FOUND', message: 'Unknown run ID. Create or resume a run in this server session.' } };
  }
  create(seed: string, scenarioId = 'full-28'): ServiceResult {
    try {
      if (typeof seed !== 'string' || !seed.trim()) throw new Error('Empty seed');
      const state = createRun(seed, scenarioId);
      const runId = `run-${this.nextId++}`;
      this.put(runId, state);
      return this.envelope(runId, state, getView(state));
    } catch {
      return { ok: false, error: { code: 'INVALID_RUN', message: 'Run creation failed. Use a nonempty seed and a supported scenario: lab-12, business-28, full-28, core-12 or one-quarter.' } };
    }
  }
  resume(serialized: string): ServiceResult {
    try {
      const state = resumeRun(serialized);
      const runId = `run-${this.nextId++}`;
      this.put(runId, state);
      return this.envelope(runId, state, getView(state));
    } catch {
      return { ok: false, error: { code: 'INVALID_SAVE', message: 'Save rejected: malformed, incompatible, or invalid replay artifact.' } };
    }
  }
  inspect(runId: string, kind: Inspection, id?: string): ServiceResult {
    const state = this.runs.get(runId);
    if (!state) return this.missing();
    const data = kind === 'research' ? getResearch(state.quarter, id)
      : kind === 'actions' ? actionsWithResearch(state)
      : kind === 'explain' ? explain(state, id) : selectors[kind](state);
    return this.envelope(runId, state, data);
  }
  preview(runId: string, action: Action): ServiceResult {
    const state = this.runs.get(runId);
    if (!state) return this.missing();
    try {
      return this.envelope(runId, state, actionsWithResearch(state, action));
    } catch {
      return { ok: false, runId, actorId: state.playerId, revision: state.revision,
        error: { code: 'INVALID_PREVIEW', message: 'Invalid action preview. Choose a supported action and valid parameters.' } };
    }
  }
  save(runId: string): ServiceResult {
    const state = this.runs.get(runId);
    if (!state) return this.missing();
    return this.envelope(runId, state, {
      artifactType: 'recoverable-local-save', containsSecrets: true,
      warning: 'This offline save contains hidden world information. Keep it separate from player-visible views.',
      serialized: saveRun(state),
    });
  }
  command(runId: string, command: Command): ServiceResult {
    const state = this.runs.get(runId);
    if (!state) return this.missing();
    if (!command || typeof command.actorId !== 'string' || !command.actorId ||
        typeof command.idempotencyKey !== 'string' || !command.idempotencyKey ||
        !Number.isSafeInteger(command.expectedRevision) || command.expectedRevision < 0) {
      return { ok: false, runId, actorId: state.playerId, revision: state.revision,
        error: { code: 'INVALID_COMMAND', message: 'Provide explicit actorId, a nonempty idempotencyKey, and a nonnegative integer expectedRevision.' } };
    }
    const result = execute(state, command);
    if (!result.ok) return { ok: false, runId, actorId: state.playerId, revision: state.revision, error: result.error };
    try { this.put(runId, result.state); } catch { return { ok: false, runId, error: { code: 'CHECKPOINT_FAILED', message: 'Could not persist the command; in-memory state unchanged. Inspect disk/recovery before retrying.' } }; }
    const receipt: Record<string, unknown> = {};
    for (const key of ['duplicate', 'revision', 'acceptedRevision']) {
      if (result.data && key in result.data) receipt[key] = result.data[key];
    }
    return this.envelope(runId, result.state, { receipt, view: getView(result.state), plan: getPlan(result.state) });
  }
}
