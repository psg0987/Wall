"""Run a test file of the working tree against the game code of another commit (default: main d82f847, the code before the FIN-CF-02-SAVE-01
fix), assembled exactly like tests/run.py does (seeded Math.random + tests/stub.js + game + test), without checking anything out.
usage: python3 verify/fin-cf-02-save01/run_test_on_rev.py [rev] [test-file]
       default rev d82f84764fdf242de4956ed9d53521a479cc80a9, default test tests/t_fincf02_save01.js
Prints the test output, the summary line and the exit code the runner would give (0 = errs 0 and fails 0)."""
import ast, hashlib, os, re, subprocess, sys, tempfile
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V)); T = os.path.join(R, 'tests')
REV = sys.argv[1] if len(sys.argv) > 1 else 'd82f84764fdf242de4956ed9d53521a479cc80a9'
TEST = sys.argv[2] if len(sys.argv) > 2 else os.path.join(T, 't_fincf02_save01.js')
rd = lambda p: open(p, encoding='utf-8').read()
show = lambda p: subprocess.run(['git', '-C', R, 'show', REV + ':' + p], capture_output=True, text=True, check=True).stdout
b = ast.parse(show('build/build.py'))
PARTS = [ast.literal_eval(n.value) for n in b.body if isinstance(n, ast.Assign) and any(getattr(t, 'id', '') == 'PARTS' for t in n.targets)][0]
t = ast.parse(rd(os.path.join(T, 'run.py')))
SEED = [ast.literal_eval(n.value) for n in t.body if isinstance(n, ast.Assign) and any(getattr(x, 'id', '') == 'SEED' for x in n.targets)][0]
game = show('src/base_v5.js') + '\n' + '\n'.join(show('src/' + f) for f in PARTS)
print('game of ' + REV[:7] + ' sha256 ' + hashlib.sha256(game.encode('utf-8')).hexdigest()[:16] + ' | test ' + os.path.relpath(TEST, R) + ' sha256 ' + hashlib.sha256(rd(TEST).encode('utf-8')).hexdigest()[:16], flush=True)
code = SEED + rd(os.path.join(T, 'stub.js')) + '\n' + game + '\n' + rd(TEST)
with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(code); p = f.name
o = subprocess.run(['node', p], capture_output=True, text=True, timeout=3600, env=dict(os.environ, TESTS_DIR=T)); os.unlink(p)
txt = (o.stdout + o.stderr).rstrip(); print(txt)
m = re.findall(r'errs (\d+) fails (\d+)', txt); okk = bool(m) and m[-1] == ('0', '0') and o.returncode == 0
print('exit code', 0 if okk else 1); sys.exit(0 if okk else 1)
