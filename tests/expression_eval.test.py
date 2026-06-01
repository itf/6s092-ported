"""
tests/expression_eval.test.py
E2E tests for _evaluate_expression using the exact csq_funcs defined in
6s092/courses/IAP19/preload.py.  Run with:  python3 tests/expression_eval.test.py
"""
import sys, math, cmath, pathlib

ROOT = pathlib.Path(__file__).parent.parent
PY_RUNNER = (ROOT / 'js' / 'py-runner.js').read_text()

start = PY_RUNNER.index('await pyodide.runPythonAsync(`') + len('await pyodide.runPythonAsync(`')
end   = PY_RUNNER.index('`);', start)
exec(compile(PY_RUNNER[start:end], '<py-runner-bootstrap>', 'exec'), globals())

passed = failed = 0

def test(name, fn):
    global passed, failed
    try:
        fn()
        print(f'  \u2705  {name}')
        passed += 1
    except AssertionError as e:
        print(f'  \u274c  {name}')
        print(f'       {e}')
        failed += 1

# ── Reproduce preload.py csq_funcs exactly ───────────────────────────────────
def _calc_assymptotics(letter):
    calc_func = lambda x: 1
    if letter == "O":      calc_func = lambda c: c**3*1.6006-c**2
    elif letter == "Theta": calc_func = lambda c: -c**3*0.06006+c**2*0.2
    elif letter == "Omega": calc_func = lambda c: -c**3*0.16006+c**2*0.1
    def f(*args):
        if len(args) >= 1:
            x = args[0]
            return calc_func(x + sum(args[1:]))
    return f

csq_funcs = {
    "T":     (lambda c: c**3*0.6006+c**2,    str),
    "O":     (_calc_assymptotics("O"),        str),
    "theta": (_calc_assymptotics("Theta"),    str),
    "Theta": (_calc_assymptotics("Theta"),    str),
    "log":   (cmath.log,                      str),
    "ln":    (cmath.log,                      str),
    "fact":  (math.factorial,                 str),
    "Omega": (_calc_assymptotics("Omega"),    str),
}

def check(student, solns):
    return _evaluate_expression(student, solns, csq_funcs)

# ── Tests ─────────────────────────────────────────────────────────────────────
print('\nexpression_eval — PS03 / preload.py csq_funcs regression')

def t_log_two_args():
    ok, msg = check('log(n,10)', ['log(n,10)', 'log(n,10)+1'])
    assert ok, f'log(n,10): {msg}'
test('log(n,10) accepted', t_log_two_args)

def t_log_one_arg():
    ok, msg = check('log(n)', ['log(n)'])
    assert ok, f'log(n): {msg}'
test('log(n) accepted', t_log_one_arg)

def t_theta():
    ok, msg = check('Theta(n)', ['Theta(n)'])
    assert ok, f'Theta(n): {msg}'
test('Theta(n) accepted', t_theta)

def t_fact():
    # fact(n) fails with float n (math.factorial requires int) — that's expected.
    # The important thing is it no longer fails with a list error.
    ok, msg = check('fact(n)', ['fact(n)'])
    assert 'list' not in msg, f'fact(n) still has list error: {msg}'
test('fact(n) no longer has list error', t_fact)

def t_no_list_error():
    ok, msg = check('log(n,10)', ['log(n,10)', 'log(n,10)+1'])
    assert 'must be real number, not list' not in msg, f'BUG: {msg}'
test('log(n,10) does not produce "must be real number, not list"', t_no_list_error)

def t_theta_no_concat_error():
    ok, msg = check('Theta(n)', ['Theta(n)'])
    assert 'concatenate list' not in msg, f'BUG: {msg}'
test('Theta(n) does not produce list concatenation error', t_theta_no_concat_error)

def t_fact_no_list_error():
    ok, msg = check('fact(n)', ['fact(n)'])
    assert 'list' not in msg, f'BUG: {msg}'
test('fact(n) does not produce list error', t_fact_no_list_error)

print(f'\n  {passed} passed, {failed} failed')
sys.exit(failed)
