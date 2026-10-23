"""FIN-CF-02 investigation (2026-10-23, read-only, before the change): runs cases.js / natural.js against a built game, the same way tests/run.py does.
usage: python3 build/build.py && python3 verify/fin-cf-02/investigation/run.py verify/fin-cf-02/investigation/cases.js [game-root]
The logs next to this file were made on the code of main 151b138 (identical output on f4a825d). On the fixed code the statement numbers differ by design."""
import os, subprocess, sys, tempfile
V = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.dirname(os.path.dirname(os.path.dirname(V)))
R = sys.argv[2] if len(sys.argv) > 2 else REPO; T = os.path.join(REPO, 'tests')
SEED = ("Math.random=(()=>{let a=20261016;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);"
        "t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();\n")
rd = lambda p: open(p, encoding='utf-8').read()
code = SEED + rd(os.path.join(T, 'stub.js')) + '\n' + rd(os.path.join(R, 'dist', 'game.js')) + '\n' + rd(sys.argv[1])
with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(code); p = f.name
o = subprocess.run(['node', p], capture_output=True, text=True, timeout=1800, env=dict(os.environ, TESTS_DIR=T)); os.unlink(p)
print(o.stdout + o.stderr)
