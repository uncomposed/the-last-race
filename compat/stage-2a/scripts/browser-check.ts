import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRun } from '../src/engine.js';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { chromium, webkit } from 'playwright';
import { runtimeFixture } from './runtime-fixture.js';

const nodeResult = runtimeFixture();
const bundle = await build({ stdin: { contents: "import { runtimeFixture } from './scripts/runtime-fixture.ts'; globalThis.fixture = runtimeFixture;", resolveDir: process.cwd(), sourcefile: 'runtime-entry.ts', loader: 'ts' }, bundle: true, write: false, platform: 'browser', format: 'iife', target: 'es2022' });
const results: Array<{ runtime: string; version: string; checksum: string; records: number; equalToNode: boolean }> = [{ runtime: 'Node', version: process.version, checksum: nodeResult.checksum, records: nodeResult.records.length, equalToNode: true }];
const configuredChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromiumExecutable = configuredChromium ?? (existsSync(macChrome) ? macChrome : undefined);
for (const [name, browserType, options] of [
  ['Chromium', chromium, { ...(chromiumExecutable ? { executablePath: chromiumExecutable } : {}), headless: true }],
  ['WebKit', webkit, { headless: true }],
] as const) {
  const browser = await browserType.launch(options);
  try {
    const page = await browser.newPage(); await page.setContent('<!doctype html><title>Deterministic engine fixture</title>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const browserResult = await page.evaluate(() => (globalThis as unknown as { fixture: typeof runtimeFixture }).fixture());
    // Compare every exact transition string, including decision traces; checksum is a report convenience.
    assert.deepEqual(browserResult, nodeResult, `${name} transition or numerical fixture mismatch`);
    results.push({ runtime: name, version: browser.version(), checksum: browserResult.checksum, records: browserResult.records.length, equalToNode: true });
  } finally { await browser.close(); }
}
const report = { identities: ['one-quarter', 'core-12'].map(id => createRun('identity-only', id).identity), fixtureVersion: nodeResult.fixtureVersion, comparison: 'Exact canonical numerical, authoritative transition, decision trace, and player-selector equality; hashes are supplementary.', scenarios: ['one-quarter', 'core-12'], seedsPerScenario: 3, caveat: 'Synthetic Stage 1/2a technical verification; no human fun acceptance, empirical calibration, or later-stage ending coverage is implied.', results };
await mkdir(resolve('artifacts'), { recursive: true }); await writeFile(resolve('artifacts/browser-check.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
