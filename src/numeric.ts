/** double-ordered-v1. No platform transcendental functions or ambient random state. */
export function assertFinite(value: number, label = 'number'): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value === 0 ? 0 : value;
}
export function integer(value: number, label = 'integer'): number {
  assertFinite(value, label);
  if (!Number.isSafeInteger(value)) throw new Error(`${label} must be a safe integer`);
  return value === 0 ? 0 : value;
}
export function sum(values: readonly number[]): number {
  let total = 0;
  for (const value of values) total = assertFinite(total + assertFinite(value));
  return total;
}
export function clamp(value: number, min: number, max: number): number {
  assertFinite(value); assertFinite(min); assertFinite(max);
  if (min > max) throw new Error('Invalid clamp bounds');
  return value < min ? min : value > max ? max : value;
}
export function interpolate(table: ReadonlyArray<readonly [number, number]>, x: number): number {
  assertFinite(x);
  if (!table.length) throw new Error('Empty lookup table');
  for (let i = 0; i < table.length; i++) {
    assertFinite(table[i][0]); assertFinite(table[i][1]);
    if (i > 0 && table[i][0] <= table[i - 1][0]) throw new Error('Lookup coordinates must increase');
  }
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [right, high] = table[i]; const [left, low] = table[i - 1];
    if (x <= right) return assertFinite(low + (high - low) * ((x - left) / (right - left)));
  }
  return table[table.length - 1][1];
}
/** Canonical JSON is serialization, not a substitute for ordered transitions. */
export function canonical(value: unknown): string {
  const active = new Set<object>();
  function visit(v: unknown): string {
    if (v === null) return 'null';
    if (typeof v === 'number') return JSON.stringify(assertFinite(v));
    if (typeof v === 'string' || typeof v === 'boolean') return JSON.stringify(v);
    if (typeof v !== 'object') throw new Error('Non-JSON value');
    if (active.has(v)) throw new Error('Cyclic value');
    active.add(v);
    let result: string;
    if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) if (!(i in v)) throw new Error('Sparse arrays are not canonical JSON');
      result = '[' + v.map(visit).join(',') + ']';
    } else {
      const proto = Object.getPrototypeOf(v);
      if (proto !== Object.prototype && proto !== null) throw new Error('Non-JSON object');
      result = '{' + Object.keys(v).sort().map(key => JSON.stringify(key) + ':' + visit((v as Record<string, unknown>)[key])).join(',') + '}';
    }
    active.delete(v);
    return result;
  }
  return visit(value);
}
// Portable polynomial checksum. Every integer intermediate is < 2^53.
// Not cryptographic. Source identity uses SHA-256 from the build script.
function checksum(text: string, initial: number): number {
  const modulus = 2147483647;
  let result = initial;
  for (let i = 0; i < text.length; i++) {
    const next = result * 131 + text.charCodeAt(i);
    result = next - Math.floor(next / modulus) * modulus;
  }
  return result;
}
export function hash(value: unknown): string {
  const text = canonical(value);
  return checksum(text, 5381).toString(16).padStart(8, '0') + checksum(text, 104729).toString(16).padStart(8, '0');
}
/** v1 keyed draws. Two mixing passes keep nearby event keys from nearby draws. */
export function random(seed: string, key: string): number {
  const input = canonical(['keyed-v1', seed, key]);
  let n = checksum(input, 104729);
  const modulus = 2147483647;
  // Park–Miller shuffle, explicit integer modulo via quotient rounding.
  for (let i = 0; i < 4; i++) {
    const next = (n + 1) * 48271;
    n = next - Math.floor(next / modulus) * modulus;
  }
  return n / modulus;
}
