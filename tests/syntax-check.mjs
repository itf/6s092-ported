/**
 * tests/syntax-check.mjs
 * Verifies all app JS files parse without syntax errors.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';

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

const appJsDir = new URL('../app/js', import.meta.url).pathname;
const files = readdirSync(appJsDir)
  .filter(f => extname(f) === '.js')
  .map(f => join(appJsDir, f));

console.log('\nsyntax-check.mjs — JS files in app/js/');

for (const file of files) {
  const name = file.split('/').pop();
  test(name + ' has valid syntax', () => {
    // Use node --check with --input-type=module to handle ES module imports
    const src = readFileSync(file, 'utf8');
    execFileSync(process.execPath, ['--input-type=module', '--check'], {
      input: src,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  });
}

// Also check for the ?? mixed with || or && without parens
console.log('\nsyntax-check.mjs — nullish coalescing precedence');

for (const file of files) {
  const name = file.split('/').pop();
  test(name + ' no unparenthesized ?? mixed with || or &&', () => {
    const src = readFileSync(file, 'utf8');
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      // Remove string literals to avoid false positives
      const stripped = line.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '""');
      if (/\?\?[^()\n]*(\|\||&&)/.test(stripped) || /(\|\||&&)[^()\n]*\?\?/.test(stripped)) {
        throw new Error(`Line ${i + 1}: possible ?? precedence issue: ${line.trim()}`);
      }
    });
  });
}

console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
