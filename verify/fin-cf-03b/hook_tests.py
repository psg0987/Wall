"""RT-FIN-CF-03B-DESIGN-01 (read-only): predict which existing assertions the proposed fix would change, without touching src/.
Each test is assembled like tests/run.py, with a hook between the game and the test that wraps fqDerive to imitate option A:
for a financial company (c.kd) whose row and previous row are both real closes (st 'full' and prev.d > 0), the quarter growth q.gr
is taken out of 차입 증감 / 재무활동 (cff -= gr, oth += gr). usage: python3 hook_tests.py none|A"""
import ast, os, re, subprocess, sys, tempfile
R = __import__("os").path.dirname(__import__("os").path.dirname(__import__("os").path.dirname(__import__("os").path.abspath(__file__)))); T = R + "/tests"; MODE = __import__("sys").argv[1]
rd = lambda p: open(p, encoding='utf-8').read()
b = ast.parse(rd(R + '/build/build.py')); PARTS = [ast.literal_eval(n.value) for n in b.body if isinstance(n, ast.Assign) and any(getattr(t, 'id', '') == 'PARTS' for t in n.targets)][0]
t = ast.parse(rd(T + '/run.py'))
SEED = [ast.literal_eval(n.value) for n in t.body if isinstance(n, ast.Assign) and any(getattr(x, 'id', '') == 'SEED' for x in n.targets)][0]
TESTS = [ast.literal_eval(n.value) for n in t.body if isinstance(n, ast.Assign) and any(getattr(x, 'id', '') == 'TESTS' for x in n.targets)][0]
game = rd(R + '/src/base_v5.js') + '\n' + '\n'.join(rd(R + '/src/' + f) for f in PARTS)
HOOK = {'none': '', 'A': r'''
{ const f0 = fqDerive; fqDerive = function (c, q, prev) { const d = f0(c, q, prev);
  if (d && prev && c && c.kd && d.st === 'full' && prev.d > 0 && q.gr) { d.cff -= q.gr; d.oth += q.gr; d.ncG = q.gr } else if (d) d.ncG = 0; return d } }
'''}[MODE]
bad = 0
for name, pre in TESTS:
    code = SEED + rd(T + '/stub.js') + '\n' + (rd(T + '/' + pre) + '\n' if pre else '') + game + '\n' + HOOK + '\n' + rd(T + '/' + name)
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(code); p = f.name
    o = subprocess.run(['node', p], capture_output=True, text=True, timeout=1800, env=dict(os.environ, TESTS_DIR=T)); os.unlink(p)
    txt = o.stdout + o.stderr; m = re.findall(r'errs (\d+) fails (\d+)', txt); ok = bool(m) and m[-1] == ('0', '0') and o.returncode == 0
    bad += not ok; print(('PASS ' if ok else 'FAIL ') + name + ('' if ok else ' ' + str(m[-1] if m else '?')), flush=True)
    if not ok:
        for l in txt.splitlines():
            if l.startswith('FAIL') or l.startswith('ERR'): print('   ' + l[:330])
print('hook', MODE, ':', len(TESTS) - bad, '/', len(TESTS), 'files pass')
