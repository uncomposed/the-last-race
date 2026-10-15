import { mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync, copyFileSync, existsSync, unlinkSync, openSync, closeSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { canonical } from './numeric.js';
import { resumeRun } from './engine.js';
import type { RunState } from './types.js';

/** One process owns a checkpoint directory. Atomic rename and one previous revision support recovery. */
export class Checkpoints {
  readonly directory: string;
  private readonly lock: string;
  constructor(directory: string) {
    this.directory = resolve(directory); mkdirSync(this.directory, { recursive: true, mode: 0o700 });
    this.lock = join(this.directory, 'session.lock');
    if (existsSync(this.lock)) {
      const pid = Number(readFileSync(this.lock, 'utf8'));
      let alive = true;
      try { process.kill(pid, 0); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ESRCH') alive = false; }
      if (alive || !Number.isSafeInteger(pid) || pid < 1) throw new Error('Checkpoint directory is owned by another live session. Use that session or a different --session-dir.');
      unlinkSync(this.lock);
    }
    const fd = openSync(this.lock, 'wx', 0o600); writeFileSync(fd, String(process.pid)); closeSync(fd);
    process.once('exit', () => this.close());
  }
  close(): void { if (existsSync(this.lock) && readFileSync(this.lock, 'utf8') === String(process.pid)) unlinkSync(this.lock); }
  load(): Array<[string, RunState]> {
    return readdirSync(this.directory).filter(name => /^run-\d+\.json$/.test(name)).sort().map(name => {
      const path = join(this.directory, name);
      try { return [name.slice(0, -5), resumeRun(readFileSync(path, 'utf8'))]; }
      catch { throw new Error(`Checkpoint ${name} failed replay validation. Preserve it; recover its .previous file explicitly or use the matching engine.`); }
    });
  }
  write(runId: string, state: RunState): void {
    if (!/^run-\d+$/.test(runId)) throw new Error('Invalid checkpoint identifier');
    const path = join(this.directory, `${runId}.json`); const temporary = `${path}.tmp`;
    writeFileSync(temporary, canonical(state), { mode: 0o600 });
    if (existsSync(path)) copyFileSync(path, `${path}.previous`);
    renameSync(temporary, path);
  }
}
