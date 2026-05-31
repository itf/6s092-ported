/**
 * tests/questions.test.mjs
 * Tests for question rendering helpers that don't need a DOM or Pyodide.
 * Tests focus on the repr() helper and score callback wiring logic.
 */

import assert from 'node:assert/strict';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${e.message}`);
    failed++;
  }
}

// ── repr helper (extracted for testing without DOM) ───────────────────────────
function repr(v) {
  if (v === null) return 'None';
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return String(v);
    return String(v);
  }
  if (Array.isArray(v)) return '[' + v.map(repr).join(', ') + ']';
  return JSON.stringify(v);
}

console.log('\nquestions.js — repr helper');

test('null → None', () => assert.equal(repr(null), 'None'));
test('true → True', () => assert.equal(repr(true), 'True'));
test('false → False', () => assert.equal(repr(false), 'False'));
test('integer', () => assert.equal(repr(42), '42'));
test('float', () => assert.equal(repr(3.14), '3.14'));
test('string', () => assert.equal(repr('hello'), '"hello"'));
test('list', () => assert.equal(repr([1, 2, 3]), '[1, 2, 3]'));
test('nested list', () => assert.equal(repr([[1, 2], [3]]), '[[1, 2], [3]]'));
test('mixed list', () => assert.equal(repr([1, 'a', null, true]), '[1, "a", None, True]'));

// ── Question var defaults ─────────────────────────────────────────────────────
console.log('\nquestions.js — npoints default logic');

function getNpoints(vars, testsLen) {
  const tests = vars.csq_tests || vars.tests || [];
  return vars.csq_npoints ?? (tests.length || 1);
}

test('npoints defaults to 1 with no tests', () => {
  assert.equal(getNpoints({}), 1);
});

test('npoints uses csq_npoints when set', () => {
  assert.equal(getNpoints({ csq_npoints: 5 }), 5);
});

test('npoints uses tests length when available', () => {
  assert.equal(getNpoints({ csq_tests: [{code:'a'},{code:'b'}] }), 2);
});

test('npoints uses csq_npoints over tests length', () => {
  assert.equal(getNpoints({ csq_npoints: 10, csq_tests: [{code:'a'}] }), 10);
});

test('npoints zero tests falls back to 1', () => {
  assert.equal(getNpoints({ csq_tests: [] }), 1);
});

// ── Multiple choice correctness logic ────────────────────────────────────────
console.log('\nquestions.js — checkbox correctness');

function checkCheckbox(selected, soln) {
  const solnArr = Array.isArray(soln) ? soln : [];
  return solnArr.length === selected.length && solnArr.every((s, i) => (s ? 1 : 0) === selected[i]);
}

test('all correct checkboxes', () => assert.ok(checkCheckbox([1,0,1], [1,0,1])));
test('wrong checkbox answer', () => assert.ok(!checkCheckbox([0,0,1], [1,0,1])));
test('empty solution matches empty selection', () => assert.ok(checkCheckbox([], [])));
test('length mismatch is wrong', () => assert.ok(!checkCheckbox([1,0], [1,0,1])));

// ── Expression normalization (^ → **, LaTeX braces) ──────────────────────────
console.log('\nquestions.js — expression normalization');

function normalizeExpr(expr) {
  // Mirror the Python _normalize_expr logic
  expr = expr.replace(/\{([^}]*)\}/g, '($1)');   // {x} → (x)
  expr = expr.replace(/\^/g, '**');               // ^ → **
  expr = expr.replace(/\\cdot\b/g, '*');
  expr = expr.replace(/\\left|\\right/g, '');
  return expr;
}

test('^ converted to **', () => assert.equal(normalizeExpr('n^2'), 'n**2'));
test('n^1.01 converted', () => assert.equal(normalizeExpr('n^1.01'), 'n**1.01'));
test('no ^ unchanged', () => assert.equal(normalizeExpr('n*log(n)'), 'n*log(n)'));
test('multiple ^ converted', () => assert.equal(normalizeExpr('n^2 + n^3'), 'n**2 + n**3'));
test('(5n)^2 converted', () => assert.equal(normalizeExpr('(5*n)^2'), '(5*n)**2'));
test('LaTeX ^{c} converted to **(c)', () => assert.equal(normalizeExpr('a*(n/b)^{c}'), 'a*(n/b)**(c)'));
test('LaTeX n^{1.01} converted', () => assert.equal(normalizeExpr('n^{1.01}'), 'n**(1.01)'));
test('LaTeX n^{2} converted', () => assert.equal(normalizeExpr('n^{2}'), 'n**(2)'));
test('bare {expr} converted to parens', () => assert.equal(normalizeExpr('a*{n/b}^c'), 'a*(n/b)**c'));

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
