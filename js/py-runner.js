/**
 * py-runner.js
 * Manages the Pyodide instance and exposes a Python execution API.
 */

let _pyodide = null;
let _loadPromise = null;
let _statusCallbacks = [];

export function onStatusChange(cb) { _statusCallbacks.push(cb); }

function setStatus(status, msg) {
  _statusCallbacks.forEach(cb => cb(status, msg));
}

/** Load Pyodide (only once). Returns promise that resolves to pyodide instance. */
export async function getPyodide() {
  if (_pyodide) return _pyodide;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    setStatus('loading', 'Loading Python runtime…');
    try {
      const pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
      });
      // Load micropip and sympy for expression evaluation
      setStatus('loading', 'Installing sympy…');
      await pyodide.loadPackage(['sympy']);
      // Install shared catsoop-compat environment
      await _installCatsoopEnv(pyodide);
      _pyodide = pyodide;
      setStatus('ready', 'Python ready');
      return pyodide;
    } catch (err) {
      setStatus('error', 'Python failed: ' + err.message);
      throw err;
    }
  })();
  return _loadPromise;
}

/** Install the catsoop-compatible Python environment. */
async function _installCatsoopEnv(pyodide) {
  await pyodide.runPythonAsync(`
import random as _random_mod
import sys
import json
import ast
import math

# ── Stubs for catsoop server-side globals (gracefully ignored client-side) ────
cs_user_info = {'role': 'Student', 'name': 'You', 'username': 'student'}
cs_url_root = 'localhost'
cs_course = 'IAP19'
cs_content_header = ''

class _ModuleStub:
    """Silently absorbs any attribute access / calls."""
    def __getattr__(self, name):
        return self
    def __call__(self, *a, **kw):
        return self
    def get_subdirs(self, *a, **kw):
        return []
    def realize_time(self, *a, **kw):
        return ''
    def long_timestamp(self, *a, **kw):
        return ''

csm_loader = _ModuleStub()
csm_check = _ModuleStub()
csm_time = _ModuleStub()

# ── cs_random: mimics the catsoop random object ──────────────────────────────
class _CSRandom:
    def __init__(self):
        self._rng = _random_mod.Random()
    def seed(self, s):
        self._rng.seed(s)
    def randint(self, a, b):
        return self._rng.randint(a, b)
    def random(self):
        return self._rng.random()
    def choice(self, seq):
        return self._rng.choice(seq)
    def shuffle(self, lst):
        self._rng.shuffle(lst)
    def sample(self, population, k):
        return self._rng.sample(population, k)

cs_random = _CSRandom()

# ── cs_print ──────────────────────────────────────────────────────────────────
_cs_print_buf = []
def cs_print(*args, **kwargs):
    sep = kwargs.get('sep', ' ')
    _cs_print_buf.append(sep.join(str(a) for a in args))

# ── tutor ─────────────────────────────────────────────────────────────────────
class tutor:
    @staticmethod
    def init_random(page_path='', username='anonymous'):
        import hashlib
        seed_str = (page_path + username).encode()
        seed = int(hashlib.md5(seed_str).hexdigest(), 16) % (2**32)
        cs_random.seed(seed)

# ── Shared context dict (updated by preload.py execution) ────────────────────
_page_context = {
    'cs_random': cs_random,
    'cs_print': cs_print,
    'tutor': tutor,
    'cs_user_info': cs_user_info,
    'cs_url_root': cs_url_root,
    'cs_course': cs_course,
    'csm_loader': csm_loader,
    'csm_check': csm_check,
    'csm_time': csm_time,
}

# ── Expression evaluator ─────────────────────────────────────────────────────
def _normalize_expr(expr):
    """Convert catsoop/math expression syntax to Python-evaluable syntax."""
    # Strip LaTeX curly braces used for grouping: a^{n+1} -> a^(n+1)
    # Do this BEFORE converting ^ to ** so the braces become parens
    expr = expr.replace('{', '(').replace('}', ')')
    # Replace ^ with ** for exponentiation
    expr = expr.replace('^', '**')
    # Strip common LaTeX artifacts students might type
    expr = expr.replace('\\\\cdot', '*').replace('\\\\left', '').replace('\\\\right', '')
    expr = expr.replace('\\cdot', '*').replace('\\left', '').replace('\\right', '')
    return expr

def _evaluate_expression(student_expr, soln_exprs, csq_funcs=None,
                         error_on_unknown=False, num_tests=10):
    """
    Numerically evaluate student expression against solution(s).
    csq_funcs: dict of name -> (eval_lambda, display_lambda)
    Returns (correct: bool, message: str)
    """
    if isinstance(soln_exprs, str):
        soln_exprs = [soln_exprs]

    student_expr = _normalize_expr(student_expr)
    soln_exprs = [_normalize_expr(s) for s in soln_exprs]

    # Find free variables (single lowercase letters + n, common names)
    def find_vars(expr):
        try:
            tree = ast.parse(expr, mode='eval')
        except SyntaxError:
            return set()
        names = {node.id for node in ast.walk(tree) if isinstance(node, ast.Name)}
        # Remove known function names
        builtins_names = {'True','False','None','abs','round','int','float','str','len',
                          'min','max','sum','pow','sqrt','log','log2','log10','sin','cos',
                          'tan','exp','pi','e'}
        if csq_funcs:
            builtins_names |= set(csq_funcs.keys())
        return names - builtins_names

    all_vars = find_vars(student_expr)
    for s in soln_exprs:
        all_vars |= find_vars(s)

    # Build evaluation environment
    def make_env(var_values):
        env = {
            'sqrt': math.sqrt, 'log': math.log, 'log2': math.log2,
            'log10': math.log10, 'sin': math.sin, 'cos': math.cos,
            'tan': math.tan, 'exp': math.exp, 'abs': abs,
            'pi': math.pi, 'e': math.e,
        }
        if csq_funcs:
            for fname, (fn, _) in csq_funcs.items():
                # fn takes a list of args
                env[fname] = lambda *args, _fn=fn: _fn(list(args))
        env.update(var_values)
        return env

    import random
    rng = random.Random(42)

    for _ in range(num_tests):
        var_vals = {v: rng.uniform(2, 8) for v in all_vars}
        # Avoid zero denominators – use primes-ish values
        env = make_env(var_vals)
        try:
            stud_val = eval(student_expr, {"__builtins__": {}}, env)
        except Exception as ex:
            return (False, f"Error evaluating your answer: {ex}")

        matched = False
        for soln in soln_exprs:
            try:
                soln_val = eval(soln, {"__builtins__": {}}, env)
                if soln_val == 0:
                    if abs(stud_val) < 1e-9:
                        matched = True
                        break
                elif abs((stud_val - soln_val) / soln_val) < 1e-6:
                    matched = True
                    break
            except Exception:
                pass

        if not matched:
            return (False, "Incorrect — values don't match numerically.")

    return (True, "Correct!")


# ── Python code tester ────────────────────────────────────────────────────────
def _run_code_tests(user_code, soln_code, tests, code_pre='', code_post=''):
    """
    Run each test against user code and solution code.
    Returns list of dicts: {test_code, passed, user_output, soln_output, error, stdout}
    """
    import sys, io
    results = []
    for t in tests:
        test_code = t.get('code', '')

        def run_code(base_code):
            ns = {}
            old_stdout = sys.stdout
            sys.stdout = captured = io.StringIO()
            full = code_pre + "\\n" + base_code + "\\n" + code_post + "\\n" + test_code
            try:
                exec(full, ns)
                printed = captured.getvalue()
                return ns.get('ans', None), None, printed
            except Exception as ex:
                printed = captured.getvalue()
                return None, str(ex), printed
            finally:
                sys.stdout = old_stdout

        user_ans, user_err, user_stdout = run_code(user_code)
        soln_ans, soln_err, _           = run_code(soln_code)

        if user_err:
            results.append({'test_code': test_code, 'passed': False,
                             'user_output': None, 'soln_output': repr(soln_ans),
                             'error': user_err, 'stdout': user_stdout})
        else:
            passed = (repr(user_ans) == repr(soln_ans))
            results.append({'test_code': test_code, 'passed': passed,
                             'user_output': repr(user_ans), 'soln_output': repr(soln_ans),
                             'error': None, 'stdout': user_stdout})
    return results
`);
}

/**
 * Execute a <python> block from content.md.
 * Returns { output: string[], error: string|null }
 * `output` is the list of cs_print() calls concatenated.
 * `extraContext` dict is merged into _page_context before execution.
 */
export async function runContentPython(code, extraContext = {}) {
  const pyodide = await getPyodide();
  try {
    // Clear print buffer
    pyodide.runPython('_cs_print_buf.clear()');
    // Set extra context values in Python globals
    for (const [k, v] of Object.entries(extraContext)) {
      pyodide.globals.set('_extra_' + k, v);
    }
    // Run code with page context
    const extraKeys = Object.keys(extraContext);
    const extraInject = extraKeys.map(k => `_exec_ns['${k}'] = _extra_${k}`).join('\n');
    const wrapped = `
_exec_ns = dict(_page_context)
_exec_ns['__builtins__'] = __builtins__
${extraInject}
try:
    exec(${JSON.stringify(code)}, _exec_ns)
except Exception as _exec_err:
    import traceback as _tb
    _cs_print_buf.append('<!-- Python error: ' + _tb.format_exc() + ' -->')
# propagate any csq_ or cs_ vars set in block back to page context
for _k, _v in _exec_ns.items():
    if _k.startswith('cs_') or _k.startswith('csq_') or _k in ('tutor', 'tests', 'is_correct', 'csq_funcs'):
        _page_context[_k] = _v
`;
    pyodide.runPython(wrapped);
    const output = pyodide.runPython('list(_cs_print_buf)').toJs();
    return { output: Array.from(output), error: null };
  } catch (err) {
    console.warn('Content Python error:', err);
    return { output: [], error: err.message };
  }
}

/**
 * Evaluate a <question> block: parse csq_* variables using the current page context.
 * Returns a plain JS object.
 */
export async function parseQuestionCode(code) {
  const pyodide = await getPyodide();
  try {
    pyodide.globals.set('_qcode', code);
    const jsonStr = pyodide.runPython(`
_qns = dict(_page_context)
_qns['__builtins__'] = __builtins__
try:
    exec(_qcode, _qns)
except Exception as _qe:
    _qns['_parse_error'] = str(_qe)
_qvars = {}
for _k, _v in _qns.items():
    if _k.startswith('csq_') or _k in ('tests', 'is_correct'):
        if _k == 'csq_funcs':
            # Store the name of the key in page context so checkExpression can use it
            _page_context['csq_funcs'] = _v
            _qvars['_has_csq_funcs'] = True
            continue
        if _k == 'csq_tests' or _k == 'tests':
            # Serialize tests: only keep 'code' key, skip callables
            try:
                serialized = []
                for t in (_v if isinstance(_v, list) else []):
                    if isinstance(t, dict):
                        serialized.append({'code': t.get('code', '')})
                    else:
                        serialized.append({'code': str(t)})
                _qvars[_k] = serialized
            except Exception:
                pass
            continue
        try:
            import json as _jj
            _jj.dumps(_v, default=str)
            _qvars[_k] = _v
        except Exception:
            try:
                _qvars[_k] = str(_v)
            except Exception:
                pass
import json as _j2
_j2.dumps(_qvars, default=str)
`);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.warn('parseQuestionCode error:', err);
    return { _parse_error: err.message };
  }
}

/**
 * Check an expression answer numerically.
 */
export async function checkExpression(studentExpr, solnExprs, _unused) {
  const pyodide = await getPyodide();
  try {
    pyodide.globals.set('_student_expr', studentExpr);
    pyodide.globals.set('_soln_exprs', pyodide.toPy(
      Array.isArray(solnExprs) ? solnExprs : [solnExprs]
    ));
    const result = pyodide.runPython(`
import json as _j
_csq_funcs = _page_context.get('csq_funcs', None)
_correct, _msg = _evaluate_expression(_student_expr, list(_soln_exprs), _csq_funcs)
_j.dumps({'correct': _correct, 'message': _msg})
`);
    return JSON.parse(result);
  } catch (err) {
    return { correct: false, message: 'Error: ' + err.message };
  }
}

/**
 * Run pythoncode question tests.
 */
export async function runCodeTests(userCode, solnCode, tests, codePre, codePost) {
  const pyodide = await getPyodide();
  try {
    pyodide.globals.set('_user_code', userCode);
    pyodide.globals.set('_soln_code', solnCode);
    pyodide.globals.set('_tests', pyodide.toPy(tests));
    pyodide.globals.set('_code_pre', codePre || '');
    pyodide.globals.set('_code_post', codePost || '');

    const result = pyodide.runPython(`
import json as _j
_res = _run_code_tests(_user_code, _soln_code, [dict(t) for t in _tests],
                        _code_pre, _code_post)
_j.dumps(_res)
`);
    return JSON.parse(result);
  } catch (err) {
    return [{ passed: false, error: err.message, test_code: '', user_output: null, soln_output: null }];
  }
}

/**
 * Execute arbitrary Python for pythonliteral / number questions.
 * Returns { result: any, error: string|null }
 */
export async function evalPythonExpr(expr) {
  const pyodide = await getPyodide();
  try {
    pyodide.globals.set('_eval_expr', expr);
    const jsonStr = pyodide.runPython(`
import json as _j
try:
    _eval_result = eval(_eval_expr, {'__builtins__': __builtins__})
    _j.dumps({'result': _eval_result, 'repr': repr(_eval_result)})
except Exception as _e:
    _j.dumps({'error': str(_e)})
`);
    return JSON.parse(jsonStr);
  } catch (err) {
    return { error: err.message };
  }
}

/** Set a page-level seed for random questions (call once per page load). */
export async function initPageRandom(pagePath) {
  const pyodide = await getPyodide();
  pyodide.globals.set('_page_path', pagePath);
  pyodide.runPython(`tutor.init_random(_page_path)`);
}

/** Reset page context for a new page load. */
export async function resetPageContext() {
  const pyodide = await getPyodide();
  pyodide.runPython(`
_page_context = {
    'cs_random': cs_random,
    'cs_print': cs_print,
    'tutor': tutor,
    'cs_user_info': cs_user_info,
    'cs_url_root': cs_url_root,
    'cs_course': cs_course,
    'csm_loader': csm_loader,
    'csm_check': csm_check,
    'csm_time': csm_time,
}
`);
}
