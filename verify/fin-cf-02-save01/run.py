"""RT-FIN-CF-02-SAVE-01 investigation (2026-10-24, read-only, before any change): runs one probe script against the game the same way tests/run.py
assembles a test (seeded Math.random + tests/stub.js + the game + the script). The game is assembled in memory from src/ exactly as build/build.py
writes dist/game.js (base_v5.js + the PARTS joined by newlines), so nothing is written to src/ or dist/; its sha256 prefix is printed first.
usage: python3 verify/fin-cf-02-save01/run.py verify/fin-cf-02-save01/<script>.js
Environment variables are passed through (counterfactual.js reads VARIANT). The logs next to this file were made on main d82f847
(game sha256 prefix 6930de85162a9dbf, the same game code as d9600e9)."""
import ast, hashlib, json, os, subprocess, sys, tempfile
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V)); T = os.path.join(R, 'tests')
rd = lambda p: open(p, encoding='utf-8').read()
b = ast.parse(rd(os.path.join(R, 'build', 'build.py')))
PARTS = [ast.literal_eval(n.value) for n in b.body if isinstance(n, ast.Assign) and any(getattr(t, 'id', '') == 'PARTS' for t in n.targets)][0]
t = ast.parse(rd(os.path.join(T, 'run.py')))
SEED = [ast.literal_eval(n.value) for n in t.body if isinstance(n, ast.Assign) and any(getattr(x, 'id', '') == 'SEED' for x in n.targets)][0]
game = rd(os.path.join(R, 'src', 'base_v5.js')) + '\n' + '\n'.join(rd(os.path.join(R, 'src', f)) for f in PARTS)
print('game sha256 ' + hashlib.sha256(game.encode('utf-8')).hexdigest()[:16] + ' | ' + os.path.basename(sys.argv[1]) + (' | VARIANT=' + os.environ['VARIANT'] if os.environ.get('VARIANT') else ''), flush=True)
pre = SEED + rd(os.path.join(T, 'stub.js')) + '\n'
code = pre + game + '\n' + rd(sys.argv[1])
# where each source file starts in the assembled file (1-based line), so a probe can turn a stack line into src/<file>:<line> (env GAME_MAP)
starts, ln = [], pre.count('\n') + 1
for i, f in enumerate(['base_v5.js'] + PARTS):
    starts.append([f, ln]); ln += rd(os.path.join(R, 'src', f)).count('\n') + 1
with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(code); p = f.name
o = subprocess.run(['node', p], capture_output=True, text=True, timeout=3600, env=dict(os.environ, TESTS_DIR=T, GAME_MAP=json.dumps(starts))); os.unlink(p)
print((o.stdout + o.stderr).rstrip())
