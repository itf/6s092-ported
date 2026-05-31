/**
 * questions.js
 * Renders question blocks and handles answer checking.
 * Each question type exports a render(vars, qid, onScore) → HTMLElement.
 */

import { checkExpression, runCodeTests, evalPythonExpr } from './py-runner.js';

// ── Utilities ─────────────────────────────────────────────────────────────────

let _cmInstances = {};

/** Render markdown+katex inside a container. */
export function renderMath(el) {
  if (window.renderMathInElement) {
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: false,
    });
  }
}

function makeEl(tag, cls, ...children) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  for (const c of children) {
    if (typeof c === 'string') el.innerHTML += c;
    else if (c) el.appendChild(c);
  }
  return el;
}

function feedbackEl(cls, msg) {
  const el = makeEl('div', 'feedback-msg ' + cls, msg);
  return el;
}

function btn(label, cls) {
  const b = document.createElement('button');
  b.className = 'btn ' + cls;
  b.textContent = label;
  return b;
}

/** Render marked markdown with KaTeX (synchronous). */
function renderMarkdown(text) {
  if (!text) return '';
  // marked is global
  const html = marked.parse(text, { breaks: false });
  return html;
}

// ── Individual question renderers ─────────────────────────────────────────────

/**
 * Multiple choice question.
 * vars: { csq_options, csq_soln, csq_renderer?, csq_prompt?, csq_npoints? }
 */
function renderMultipleChoice(vars, qid, onScore, onSaveAnswer, savedAnswer) {
  const options = vars.csq_options || [];
  const renderer = vars.csq_renderer || 'dropdown';
  const soln = vars.csq_soln;   // array of 0/1 for checkbox, or string for radio/dropdown
  const prompt = vars.csq_prompt || '';
  const npoints = vars.csq_npoints ?? 1;
  const explanation = vars.csq_explanation || '';

  const box = makeEl('div', 'question-box');

  // Prompt
  if (prompt) {
    const pEl = makeEl('div', 'question-prompt', renderMarkdown(prompt));
    box.appendChild(pEl);
  }

  let getSelected;
  let answerArea;

  if (renderer === 'checkbox') {
    // Checkboxes — soln is array [0,1,0,...]
    answerArea = makeEl('div', 'mc-options');
    const checkboxes = options.map((opt, i) => {
      const row = makeEl('div', 'mc-option');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = `${qid}-opt${i}`;
      // Restore saved state
      if (savedAnswer?.checkboxes) cb.checked = !!savedAnswer.checkboxes[i];
      const label = document.createElement('label');
      label.htmlFor = cb.id;
      label.innerHTML = renderMarkdown(opt);
      row.appendChild(cb);
      row.appendChild(label);
      if (cb.checked) row.classList.add('selected');
      row.addEventListener('click', (e) => {
        if (e.target !== cb) cb.checked = !cb.checked;
        row.classList.toggle('selected', cb.checked);
        onSaveAnswer({ checkboxes: checkboxes.map(({ cb }) => cb.checked) });
      });
      return { row, cb };
    });
    checkboxes.forEach(({ row }) => answerArea.appendChild(row));

    getSelected = () => checkboxes.map(({ cb }) => cb.checked ? 1 : 0);

  } else if (renderer === 'radio') {
    answerArea = makeEl('div', 'mc-options');
    const radios = options.map((opt, i) => {
      const row = makeEl('div', 'mc-option');
      const rb = document.createElement('input');
      rb.type = 'radio';
      rb.name = `${qid}-radio`;
      rb.id = `${qid}-opt${i}`;
      rb.value = opt;
      if (savedAnswer?.value === opt) rb.checked = true;
      const label = document.createElement('label');
      label.htmlFor = rb.id;
      label.innerHTML = renderMarkdown(opt);
      row.appendChild(rb);
      row.appendChild(label);
      if (rb.checked) row.classList.add('selected');
      row.addEventListener('click', (e) => {
        if (e.target !== rb) { rb.checked = true; }
        answerArea.querySelectorAll('.mc-option').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
        onSaveAnswer({ value: rb.value });
      });
      return { row, rb };
    });
    radios.forEach(({ row }) => answerArea.appendChild(row));

    getSelected = () => {
      const checked = radios.find(({ rb }) => rb.checked);
      return checked ? checked.rb.value : null;
    };

  } else {
    // dropdown (default)
    answerArea = document.createElement('div');
    const sel = document.createElement('select');
    sel.className = 'mc-select';
    sel.appendChild(new Option('— select —', ''));
    options.forEach(opt => {
      const o = new Option(opt.replace(/<[^>]+>/g, ''), opt);
      sel.appendChild(o);
    });
    if (savedAnswer?.value) sel.value = savedAnswer.value;
    sel.addEventListener('change', () => onSaveAnswer({ value: sel.value }));
    answerArea.appendChild(sel);
    getSelected = () => sel.value || null;
  }

  box.appendChild(answerArea);

  // Controls
  const controls = makeEl('div', 'question-controls');
  const submitBtn = btn('Check', 'btn btn-primary btn-sm');
  const viewBtn = btn('View Answer', 'btn btn-secondary btn-sm');
  controls.appendChild(submitBtn);
  controls.appendChild(viewBtn);
  box.appendChild(controls);

  const feedback = makeEl('div', 'feedback-area');
  box.appendChild(feedback);

  function check(showAnswer = false) {
    const selected = getSelected();
    feedback.innerHTML = '';

    let correct = false;

    if (renderer === 'checkbox') {
      // Compare arrays
      const sel = selected;
      const solnArr = Array.isArray(soln) ? soln : [];
      correct = solnArr.length === sel.length && solnArr.every((s, i) => (s ? 1 : 0) === sel[i]);

      if (showAnswer) {
        // Highlight correct/wrong options
        answerArea.querySelectorAll('.mc-option').forEach((row, i) => {
          row.classList.remove('correct-ans', 'wrong-ans');
          if (solnArr[i]) row.classList.add('correct-ans');
        });
      }
    } else {
      const sel = selected;
      // soln is the correct option value (string)
      correct = sel !== null && (
        sel === soln ||
        sel === String(soln) ||
        (Array.isArray(soln) && soln.includes(sel))
      );

      if (showAnswer) {
        const solnVal = Array.isArray(soln) ? soln[0] : soln;
        answerArea.querySelectorAll('.mc-option').forEach((row, i) => {
          row.classList.remove('correct-ans', 'wrong-ans');
          if (options[i] === solnVal) row.classList.add('correct-ans');
        });
      }
    }

    if (showAnswer) {
      feedback.appendChild(feedbackEl('info', `Answer shown above.`));
    } else {
      feedback.appendChild(feedbackEl(correct ? 'correct' : 'wrong',
        correct ? '✓ Correct!' : '✗ Incorrect. Try again.'));
    }

    if (explanation && (correct || showAnswer)) {
      const expEl = makeEl('div', 'explanation-box', renderMarkdown(explanation));
      feedback.appendChild(expEl);
    }

    box.classList.toggle('answered-correct', correct);
    box.classList.toggle('answered-wrong', !correct && !showAnswer);

    if (correct) onScore(npoints, npoints);
    else onScore(0, npoints);
  }

  submitBtn.addEventListener('click', () => check(false));
  viewBtn.addEventListener('click', () => check(true));

  return box;
}

/**
 * Expression question.
 * vars: { csq_soln, csq_prompt?, csq_funcs?, csq_error_on_unknown_variable? }
 */
function renderExpression(vars, qid, onScore, onSaveAnswer, savedAnswer) {
  const soln = vars.csq_soln;  // string or array
  const prompt = vars.csq_prompt || '';
  const npoints = vars.csq_npoints ?? 1;
  const explanation = vars.csq_explanation || '';

  const box = makeEl('div', 'question-box');
  if (prompt) box.appendChild(makeEl('div', 'question-prompt', renderMarkdown(prompt)));

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'expr-input';
  input.placeholder = 'Enter expression…';
  if (savedAnswer?.text) input.value = savedAnswer.text;
  input.addEventListener('input', () => onSaveAnswer({ text: input.value }));
  box.appendChild(input);

  const controls = makeEl('div', 'question-controls');
  const submitBtn = btn('Check', 'btn btn-primary btn-sm');
  const viewBtn = btn('View Answer', 'btn btn-secondary btn-sm');
  controls.appendChild(submitBtn);
  controls.appendChild(viewBtn);
  box.appendChild(controls);

  const feedback = makeEl('div', 'feedback-area');
  box.appendChild(feedback);

  async function check(showAnswer = false) {
    feedback.innerHTML = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Checking…';

    if (showAnswer) {
      const solnStr = Array.isArray(soln) ? soln.join(' or ') : soln;
      feedback.appendChild(feedbackEl('info', `Answer: ${solnStr}`));
      if (explanation) feedback.appendChild(makeEl('div', 'explanation-box', renderMarkdown(explanation)));
      submitBtn.disabled = false;
      submitBtn.textContent = 'Check';
      return;
    }

    const studentExpr = input.value.trim();
    if (!studentExpr) {
      feedback.appendChild(feedbackEl('wrong', 'Please enter an expression.'));
      submitBtn.disabled = false;
      submitBtn.textContent = 'Check';
      return;
    }

    const result = await checkExpression(
      studentExpr,
      Array.isArray(soln) ? soln : [soln],
      null  // csq_funcs are already in page context
    );

    feedback.appendChild(feedbackEl(result.correct ? 'correct' : 'wrong',
      result.correct ? '✓ ' + result.message : '✗ ' + result.message));

    if (result.correct && explanation) {
      feedback.appendChild(makeEl('div', 'explanation-box', renderMarkdown(explanation)));
    }

    box.classList.toggle('answered-correct', result.correct);
    box.classList.toggle('answered-wrong', !result.correct);
    onScore(result.correct ? npoints : 0, npoints);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Check';
  }

  submitBtn.addEventListener('click', () => check(false));
  viewBtn.addEventListener('click', () => check(true));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') check(false); });

  return box;
}

/**
 * Smallbox / number — string or numeric comparison.
 */
function renderTextInput(vars, qid, onScore, onSaveAnswer, savedAnswer, isNumber = false) {
  const soln = vars.csq_soln;
  const prompt = vars.csq_prompt || '';
  const npoints = vars.csq_npoints ?? 1;

  const box = makeEl('div', 'question-box');
  if (prompt) box.appendChild(makeEl('div', 'question-prompt', renderMarkdown(prompt)));

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'expr-input';
  input.placeholder = isNumber ? 'Enter number…' : 'Enter answer…';
  if (savedAnswer?.text) input.value = savedAnswer.text;
  input.addEventListener('input', () => onSaveAnswer({ text: input.value }));
  box.appendChild(input);

  const controls = makeEl('div', 'question-controls');
  const submitBtn = btn('Check', 'btn btn-primary btn-sm');
  const viewBtn = btn('View Answer', 'btn btn-secondary btn-sm');
  controls.appendChild(submitBtn);
  controls.appendChild(viewBtn);
  box.appendChild(controls);

  const feedback = makeEl('div', 'feedback-area');
  box.appendChild(feedback);

  function check(showAnswer = false) {
    feedback.innerHTML = '';
    const userAns = input.value.trim();

    if (showAnswer) {
      const s = Array.isArray(soln) ? soln.join(' or ') : String(soln);
      feedback.appendChild(feedbackEl('info', `Answer: ${s}`));
      return;
    }

    let correct = false;
    if (Array.isArray(soln)) {
      correct = soln.map(String).includes(userAns);
    } else if (isNumber) {
      correct = Math.abs(parseFloat(userAns) - parseFloat(soln)) < 1e-6;
    } else {
      correct = userAns === String(soln);
    }

    feedback.appendChild(feedbackEl(correct ? 'correct' : 'wrong',
      correct ? '✓ Correct!' : '✗ Incorrect.'));
    box.classList.toggle('answered-correct', correct);
    box.classList.toggle('answered-wrong', !correct);
    onScore(correct ? npoints : 0, npoints);
  }

  submitBtn.addEventListener('click', () => check(false));
  viewBtn.addEventListener('click', () => check(true));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') check(false); });
  return box;
}

/**
 * Python literal — compare Python representations.
 * vars: { csq_soln, csq_prompt? }
 */
function renderPythonLiteral(vars, qid, onScore, onSaveAnswer, savedAnswer) {
  const soln = vars.csq_soln;
  const prompt = vars.csq_prompt || '';
  const npoints = vars.csq_npoints ?? 1;

  const box = makeEl('div', 'question-box');
  if (prompt) box.appendChild(makeEl('div', 'question-prompt', renderMarkdown(prompt)));

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'expr-input';
  input.placeholder = 'Enter Python value…';
  if (savedAnswer?.text) input.value = savedAnswer.text;
  input.addEventListener('input', () => onSaveAnswer({ text: input.value }));
  box.appendChild(input);

  const controls = makeEl('div', 'question-controls');
  const submitBtn = btn('Check', 'btn btn-primary btn-sm');
  const viewBtn = btn('View Answer', 'btn btn-secondary btn-sm');
  controls.appendChild(submitBtn);
  controls.appendChild(viewBtn);
  box.appendChild(controls);

  const feedback = makeEl('div', 'feedback-area');
  box.appendChild(feedback);

  async function check(showAnswer = false) {
    feedback.innerHTML = '';
    if (showAnswer) {
      feedback.appendChild(feedbackEl('info', `Answer: ${repr(soln)}`));
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Checking…';
    const userInput = input.value.trim();
    const r = await evalPythonExpr(userInput);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Check';

    if (r.error) {
      feedback.appendChild(feedbackEl('wrong', '✗ Error: ' + r.error));
      return;
    }
    // Compare repr
    const solnRepr = await evalPythonExpr(repr(soln));
    const correct = r.repr === solnRepr.repr;
    feedback.appendChild(feedbackEl(correct ? 'correct' : 'wrong',
      correct ? '✓ Correct!' : `✗ Got ${r.repr}, expected ${solnRepr.repr}`));
    box.classList.toggle('answered-correct', correct);
    box.classList.toggle('answered-wrong', !correct);
    onScore(correct ? npoints : 0, npoints);
  }

  submitBtn.addEventListener('click', () => check(false));
  viewBtn.addEventListener('click', () => check(true));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') check(false); });
  return box;
}

/** JS repr of a Python value (best-effort). */
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

/**
 * Python code question.
 * vars: { csq_soln, csq_initial?, csq_tests?, csq_code_pre?, csq_code_post?, csq_prompt? }
 */
function renderPythonCode(vars, qid, onScore, onSaveAnswer, savedAnswer) {
  const soln = vars.csq_soln || '';
  const initial = vars.csq_initial || '';
  const tests = vars.csq_tests || vars.tests || [];
  const codePre = vars.csq_code_pre || '';
  const codePost = vars.csq_code_post || '';
  const prompt = vars.csq_prompt || '';
  const npoints = vars.csq_npoints ?? (tests.length || 1);

  const box = makeEl('div', 'question-box');
  if (prompt) box.appendChild(makeEl('div', 'question-prompt', renderMarkdown(prompt)));

  // Code editor
  const editorWrap = makeEl('div', 'code-editor-wrap');
  const textarea = document.createElement('textarea');
  // Restore saved code, else use initial template
  textarea.value = savedAnswer?.code || initial || '# Write your solution here\n';
  editorWrap.appendChild(textarea);
  box.appendChild(editorWrap);

  // Initialize CodeMirror
  let cm;
  requestAnimationFrame(() => {
    cm = CodeMirror.fromTextArea(textarea, {
      mode: 'python',
      theme: 'dracula',
      lineNumbers: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      indentUnit: 4,
      tabSize: 4,
      indentWithTabs: false,
      extraKeys: {
        Tab: (cm) => {
          if (cm.somethingSelected()) {
            cm.indentSelection('add');
          } else {
            cm.replaceSelection('    ', 'end');
          }
        },
      },
    });
    _cmInstances[qid] = cm;
    cm.on('change', () => onSaveAnswer({ code: cm.getValue() }));
  });

  const controls = makeEl('div', 'question-controls');
  const runBtn = btn('▶ Run Tests', 'btn btn-primary btn-sm');
  const viewBtn = btn('View Solution', 'btn btn-secondary btn-sm');
  controls.appendChild(runBtn);
  if (soln && soln.indexOf('Solution will be posted') === -1) {
    controls.appendChild(viewBtn);
  }
  box.appendChild(controls);

  const output = makeEl('div', 'test-results');
  box.appendChild(output);

  async function runTests(showSolution = false) {
    output.innerHTML = '';
    if (showSolution) {
      const solBox = makeEl('div', 'code-output', soln);
      output.appendChild(makeEl('p', '', '<strong>Solution:</strong>'));
      output.appendChild(solBox);
      return;
    }

    runBtn.disabled = true;
    runBtn.textContent = '⏳ Running…';

    const userCode = cm ? cm.getValue() : textarea.value;
    const results = await runCodeTests(userCode, soln, tests, codePre, codePost);

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    if (results.length === 0) {
      output.appendChild(feedbackEl('info', 'No tests defined.'));
    } else {
      const summary = feedbackEl(
        passed === total ? 'correct' : passed > 0 ? 'partial' : 'wrong',
        `${passed}/${total} tests passed`
      );
      output.appendChild(summary);

      const table = makeEl('div', 'test-results');
      const showExpectedUpTo = Math.ceil(results.length / 3);
      results.forEach((r, i) => {
        const row = makeEl('div', 'test-result-row');
        const icon = makeEl('span', 'test-icon', r.passed ? '✅' : '❌');
        let detail = `Test ${i+1}: <code>${escapeHtml(r.test_code)}</code>`;
        // Only show expected answer for first 1/3 of tests
        if (i < showExpectedUpTo) {
          detail += ` — expected <code>${escapeHtml(String(r.soln_output))}</code>`;
        }
        if (r.error) {
          detail += ` — <span style="color:#dc3545">${escapeHtml(r.error)}</span>`;
        } else if (!r.passed) {
          detail += `, got <code>${escapeHtml(String(r.user_output))}</code>`;
        }
        const desc = makeEl('span', '');
        desc.innerHTML = detail;
        row.appendChild(icon);
        row.appendChild(desc);
        // Show print output if any
        if (r.stdout && r.stdout.trim()) {
          const printOut = makeEl('pre', 'test-stdout', r.stdout);
          row.appendChild(printOut);
        }
        table.appendChild(row);
      });
      output.appendChild(table);
    }

    box.classList.toggle('answered-correct', passed === total && total > 0);
    box.classList.toggle('answered-wrong', passed < total);
    onScore(passed, total);

    runBtn.disabled = false;
    runBtn.textContent = '▶ Run Tests';
  }

  runBtn.addEventListener('click', () => runTests(false));
  viewBtn.addEventListener('click', () => runTests(true));

  return box;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Multiexpression question.
 * vars: { csq_expressions: [["$x=$", ["2","3"]], ...] }
 */
function renderMultiExpression(vars, qid, onScore, onSaveAnswer, savedAnswer) {
  const expressions = vars.csq_expressions || [];
  const npoints = vars.csq_npoints ?? 1;

  const box = makeEl('div', 'question-box');
  const prompt = vars.csq_prompt || '';
  if (prompt) box.appendChild(makeEl('div', 'question-prompt', renderMarkdown(prompt)));

  const inputs = expressions.map(([label, solns], i) => {
    const row = makeEl('div', '', label + ' ');
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'expr-input';
    inp.style.width = '150px';
    inp.dataset.solns = JSON.stringify(solns);
    if (savedAnswer?.values?.[i]) inp.value = savedAnswer.values[i];
    inp.addEventListener('input', () => {
      onSaveAnswer({ values: inputs.map(i => i.value) });
    });
    row.appendChild(inp);
    box.appendChild(row);
    return inp;
  });

  const controls = makeEl('div', 'question-controls');
  const submitBtn = btn('Check', 'btn btn-primary btn-sm');
  controls.appendChild(submitBtn);
  box.appendChild(controls);

  const feedback = makeEl('div', 'feedback-area');
  box.appendChild(feedback);

  async function check() {
    feedback.innerHTML = '';
    let allCorrect = true;
    for (const inp of inputs) {
      const solns = JSON.parse(inp.dataset.solns);
      const result = await checkExpression(inp.value.trim(), solns, null);
      if (!result.correct) { allCorrect = false; break; }
    }
    feedback.appendChild(feedbackEl(allCorrect ? 'correct' : 'wrong',
      allCorrect ? '✓ Correct!' : '✗ One or more answers are incorrect.'));
    onScore(allCorrect ? npoints : 0, npoints);
  }

  submitBtn.addEventListener('click', check);
  return box;
}

/**
 * Check yourself block.
 */
export function renderCheckyourself(text, showhide) {
  const box = makeEl('div', 'checkyourself-box');
  box.appendChild(makeEl('div', 'cky-header', '🤔 Check Yourself'));
  box.innerHTML += renderMarkdown(text);
  if (showhide) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'showhide-btn';
    toggleBtn.textContent = 'Show answer';
    box.appendChild(toggleBtn);
    const content = makeEl('div', 'showhide-content', renderMarkdown(showhide));
    content.style.display = 'none';
    box.appendChild(content);
    toggleBtn.addEventListener('click', () => {
      const hidden = content.style.display === 'none';
      content.style.display = hidden ? '' : 'none';
      toggleBtn.textContent = hidden ? 'Hide answer' : 'Show answer';
    });
  }
  return box;
}

// ── Main dispatch ──────────────────────────────────────────────────────────────

let _qCounter = 0;

/**
 * Render a question segment.
 * @param {string} qtype - question type string
 * @param {object} vars  - parsed csq_* variables
 * @param {object} callbacks - { onScore, onSaveAnswer, savedAnswer }
 * @returns HTMLElement
 */
export function renderQuestion(qtype, vars, callbacks = {}) {
  const {
    onScore = () => {},
    onSaveAnswer = () => {},
    savedAnswer = null,
  } = typeof callbacks === 'function' ? { onScore: callbacks } : callbacks;

  const qid = `q${++_qCounter}`;

  switch (qtype) {
    case 'multiplechoice':
      return renderMultipleChoice(vars, qid, onScore, onSaveAnswer, savedAnswer);
    case 'expression':
      return renderExpression(vars, qid, onScore, onSaveAnswer, savedAnswer);
    case 'smallbox':
      return renderTextInput(vars, qid, onScore, onSaveAnswer, savedAnswer, false);
    case 'number':
      return renderTextInput(vars, qid, onScore, onSaveAnswer, savedAnswer, true);
    case 'pythonliteral':
      return renderPythonLiteral(vars, qid, onScore, onSaveAnswer, savedAnswer);
    case 'pythoncode':
      return renderPythonCode(vars, qid, onScore, onSaveAnswer, savedAnswer);
    case 'multiexpression':
      return renderMultiExpression(vars, qid, onScore, onSaveAnswer, savedAnswer);
    default: {
      const el = makeEl('div', 'question-box');
      el.innerHTML = `<em>Unknown question type: <code>${escapeHtml(qtype)}</code></em>`;
      return el;
    }
  }
}

/** Reset the question counter (call when navigating to a new page). */
export function resetQuestionCounter() { _qCounter = 0; }
