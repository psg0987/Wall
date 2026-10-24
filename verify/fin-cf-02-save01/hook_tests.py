"""RT-FIN-CF-02-SAVE-01 investigation (2026-10-24): predicted effect of options A / A1 on the EXISTING tests, without changing any source or test
file. The 17 test files of tests/run.py are assembled exactly as tests/run.py does (seeded Math.random + stub + game + test), with a runtime hook
inserted between the game and the test that wraps qBack:
  none = no hook (must reproduce 17/17 of main)
  A    = after qBack, eqq = 0 for the company it rebuilt (qBack returns at once for c.priv&&c.fo, so those are skipped)
  A1   = A + ncq = 0
The game is assembled in memory from src/ like run.py (nothing written). Prints PASS / FAIL per file and every FAIL / ERR line.
usage: python3 verify/fin-cf-02-save01/hook_tests.py <none|A|A1> [name-filter]"""
import ast, hashlib, os, re, subprocess, sys, tempfile
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V)); T = os.path.join(R, 'tests')
rd = lambda p: open(p, encoding='utf-8').read()
b = ast.parse(rd(os.path.join(R, 'build', 'build.py')))
PARTS = [ast.literal_eval(n.value) for n in b.body if isinstance(n, ast.Assign) and any(getattr(t, 'id', '') == 'PARTS' for t in n.targets)][0]
t = ast.parse(rd(os.path.join(T, 'run.py')))
G = {x.targets[0].id: ast.literal_eval(x.value) for x in t.body if isinstance(x, ast.Assign) and getattr(x.targets[0], 'id', '') in ('SEED', 'TESTS')}
SEED, TESTS = G['SEED'], G['TESTS']
HOOKS = {'none': '',
         'A': ';(()=>{const q0=qBack;qBack=function(c){const r=q0(c);if(!(c.priv&&c.fo))c.eqq=0;return r}})();\n',
         'A1': ';(()=>{const q0=qBack;qBack=function(c){const r=q0(c);if(!(c.priv&&c.fo)){c.eqq=0;c.ncq=0}return r}})();\n'}
mode = sys.argv[1]; flt = sys.argv[2] if len(sys.argv) > 2 else ''
game = rd(os.path.join(R, 'src', 'base_v5.js')) + '\n' + '\n'.join(rd(os.path.join(R, 'src', f)) for f in PARTS); stub = rd(os.path.join(T, 'stub.js'))
print('game sha256 ' + hashlib.sha256(game.encode('utf-8')).hexdigest()[:16] + ' | hook ' + mode + ' | ' + str(len(TESTS)) + ' test files', flush=True)
bad = 0
for name, pre in TESTS:
    if flt not in name: continue
    code = SEED + stub + '\n' + (rd(os.path.join(T, pre)) + '\n' if pre else '') + game + '\n' + HOOKS[mode] + rd(os.path.join(T, name))
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(code); p = f.name
    out = subprocess.run(['node', p], capture_output=True, text=True, timeout=3600, env=dict(os.environ, TESTS_DIR=T))
    os.unlink(p)
    txt = out.stdout + out.stderr
    m = re.findall(r'errs (\d+) fails (\d+)', txt)
    ok = bool(m) and m[-1] == ('0', '0') and out.returncode == 0
    bad += not ok
    print(('PASS ' if ok else 'FAIL ') + name + (' (errs %s fails %s)' % m[-1] if m else ' (no summary line)') + ('' if ok else '\n' + '\n'.join('   ' + l for l in txt.splitlines() if l.startswith('FAIL') or l.startswith('ERR') or 'Error' in l)[:6000]), flush=True)
print('ALL PASS' if not bad else '%d test file(s) failed' % bad)
