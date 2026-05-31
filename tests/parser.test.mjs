/**
 * tests/parser.test.mjs
 * Node.js tests for the content-parser module.
 * Run with: node tests/parser.test.mjs
 */

import { parseSegments } from '../app/js/parser.js';
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

// ── parseSegments ─────────────────────────────────────────────────────────────

console.log('\nparser.js — parseSegments');

test('pure markdown returns single markdown segment', () => {
  const segs = parseSegments('# Hello\nSome text');
  assert.equal(segs.length, 1);
  assert.equal(segs[0].type, 'markdown');
  assert.ok(segs[0].text.includes('Hello'));
});

test('extracts python block', () => {
  const md = 'before\n<python>\nprint("hi")\n</python>\nafter';
  const segs = parseSegments(md);
  assert.equal(segs.length, 3);
  assert.equal(segs[0].type, 'markdown');
  assert.equal(segs[1].type, 'python');
  assert.ok(segs[1].code.includes('print("hi")'));
  assert.equal(segs[2].type, 'markdown');
});

test('extracts multiplechoice question', () => {
  const md = `<question multiplechoice>
csq_soln = [1,0,1]
csq_options = ['a','b','c']
</question>`;
  const segs = parseSegments(md);
  assert.equal(segs.length, 1);
  assert.equal(segs[0].type, 'question');
  assert.equal(segs[0].qtype, 'multiplechoice');
  assert.ok(segs[0].code.includes("csq_soln"));
});

test('extracts expression question', () => {
  const md = `Text before\n<question expression>\ncsq_soln = "n^2"\n</question>\nText after`;
  const segs = parseSegments(md);
  assert.equal(segs.length, 3);
  assert.equal(segs[1].type, 'question');
  assert.equal(segs[1].qtype, 'expression');
});

test('extracts checkyourself without showhide', () => {
  const md = `<checkyourself>\nIs this true?\n</checkyourself>`;
  const segs = parseSegments(md);
  assert.equal(segs.length, 1);
  assert.equal(segs[0].type, 'checkyourself');
  assert.ok(segs[0].text.includes('Is this true?'));
  assert.equal(segs[0].showhide, undefined);
});

test('extracts checkyourself with showhide', () => {
  const md = `<checkyourself>\nQuestion?\n<showhide>\nYes!\n</showhide>\n</checkyourself>`;
  const segs = parseSegments(md);
  assert.equal(segs.length, 1);
  assert.equal(segs[0].type, 'checkyourself');
  assert.ok(segs[0].text.includes('Question?'));
  assert.ok(segs[0].showhide.includes('Yes!'));
});

test('handles multiple questions in sequence', () => {
  const md = `
<question multiplechoice>
csq_soln = [1,0]
csq_options = ['a','b']
</question>
<question expression>
csq_soln = "n^2"
</question>
`;
  const segs = parseSegments(md);
  const questions = segs.filter(s => s.type === 'question');
  assert.equal(questions.length, 2);
  assert.equal(questions[0].qtype, 'multiplechoice');
  assert.equal(questions[1].qtype, 'expression');
});

test('handles content with no special tags', () => {
  const md = `# Just markdown\n\nNo questions here.`;
  const segs = parseSegments(md);
  assert.equal(segs.filter(s => s.type === 'markdown').length, 1);
  assert.equal(segs.filter(s => s.type === 'question').length, 0);
});

test('mixed segments in order', () => {
  const md = `intro\n<python>\nx=1\n</python>\nmiddle\n<question smallbox>\ncsq_soln='hi'\n</question>\nend`;
  const segs = parseSegments(md);
  assert.equal(segs[0].type, 'markdown');
  assert.equal(segs[1].type, 'python');
  assert.equal(segs[2].type, 'markdown');
  assert.equal(segs[3].type, 'question');
  assert.equal(segs[4].type, 'markdown');
});

test('case-insensitive tag matching', () => {
  const md = `<Python>\ncode\n</Python>`;
  const segs = parseSegments(md);
  assert.equal(segs.length, 1);
  assert.equal(segs[0].type, 'python');
});

test('empty content returns no segments', () => {
  const segs = parseSegments('   \n  ');
  assert.equal(segs.length, 0);
});

test('real PS01 snippet parses correctly', () => {
  const md = `
# Asymptotics

## Big O Notation

Order the following functions:

<question multiplechoice>
csq_renderer = "checkbox"
csq_soln = [1,1,1]
csq_options =  ['$(n),\\ (n+4),\\ (5n)$',
 '$(n+4),\\ (5n),\\ (n)$',
 '$(5n),\\ (n+4),\\ (n)$']
</question>

<checkyourself>
Is $n^2 \\in O(n^3)$?
<showhide>
Yes.
</showhide>
</checkyourself>
`;
  const segs = parseSegments(md);
  const types = segs.map(s => s.type);
  assert.ok(types.includes('markdown'));
  assert.ok(types.includes('question'));
  assert.ok(types.includes('checkyourself'));
  const q = segs.find(s => s.type === 'question');
  assert.equal(q.qtype, 'multiplechoice');
  const cky = segs.find(s => s.type === 'checkyourself');
  assert.ok(cky.showhide.includes('Yes.'));
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
