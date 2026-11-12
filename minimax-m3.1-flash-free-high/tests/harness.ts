/**
 * Minimal, dependency free test harness.
 *
 * The project intentionally ships without runtime dependencies, so the tests
 * bring their own tiny runner instead of relying on a test framework.
 */

interface TestCase {
  name: string;
  fn: () => void;
}

interface Suite {
  name: string;
  cases: TestCase[];
}

const suites: Suite[] = [];
let current: Suite | null = null;

/** Groups test cases. */
export function describe(name: string, fn: () => void): void {
  const suite: Suite = { name, cases: [] };
  suites.push(suite);
  current = suite;
  fn();
  current = null;
}

/** Registers a single test case. */
export function it(name: string, fn: () => void): void {
  if (!current) throw new Error(`test "${name}" must be declared inside a describe block`);
  current.cases.push({ name, fn });
}

function stringify(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'bigint') return `${value}n`;
  if (value === undefined) return 'undefined';
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) =>
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

/** Asserts that two values are strictly equal. */
export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message ? `${message}: ` : ''}expected ${stringify(expected)} but got ${stringify(actual)}`);
  }
}

/** Asserts that two values are structurally equal. */
export function assertDeepEqual(actual: unknown, expected: unknown, message?: string): void {
  if (!deepEqual(actual, expected)) {
    throw new Error(
      `${message ? `${message}: ` : ''}expected ${stringify(expected)} but got ${stringify(actual)}`,
    );
  }
}

/** Asserts that a value is truthy. */
export function assertOk(value: unknown, message?: string): void {
  if (!value) throw new Error(`${message ? `${message}: ` : ''}expected a truthy value`);
}

/** Asserts that a value is not null or undefined. */
export function assertDefined<T>(value: T | null | undefined, message?: string): void {
  if (value === null || value === undefined) {
    throw new Error(`${message ? `${message}: ` : ''}expected a defined value`);
  }
}

/** Runs all registered suites and reports the result. */
export function run(): void {
  let passed = 0;
  const failures: string[] = [];

  for (const suite of suites) {
    console.log(`\n${suite.name}`);
    for (const testCase of suite.cases) {
      try {
        testCase.fn();
        passed++;
        console.log(`  ok  ${testCase.name}`);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        failures.push(`${suite.name} > ${testCase.name}: ${reason}`);
        console.log(`  FAIL ${testCase.name}`);
        console.log(`       ${reason}`);
      }
    }
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length > 0) throw new Error(`${failures.length} test(s) failed`);
}
