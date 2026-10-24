"""FIN-CF-02-SAVE-01 (A1): do the tests catch wrong implementations? Runs the tests against deliberately broken copies of the fixed game.
usage: python3 verify/fin-cf-02-save01/mutation_check.py        (JOBS=2 runs two mutants at a time)
Each edit is applied in memory to the game assembled from src/ (same order as build/build.py); src/ and dist/ are not touched. Every mutant must make
tests/t_fincf02_save01.js fail (the scenarios that fail are listed); the unmodified game must pass. The existing tests whose 7 assertions the fix
changed (t_fincf02_issue.js, t_fincf01_relief.js) run on every mutant too, and the report says whether they also catch it."""
import ast, os, re, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V)); T = os.path.join(R, 'tests')
rd = lambda p: open(p, encoding='utf-8').read()
b = ast.parse(rd(os.path.join(R, 'build', 'build.py')))
PARTS = [ast.literal_eval(n.value) for n in b.body if isinstance(n, ast.Assign) and any(getattr(t, 'id', '') == 'PARTS' for t in n.targets)][0]
t = ast.parse(rd(os.path.join(T, 'run.py')))
SEED = [ast.literal_eval(n.value) for n in t.body if isinstance(n, ast.Assign) and any(getattr(x, 'id', '') == 'SEED' for x in n.targets)][0]
game0 = rd(os.path.join(R, 'src', 'base_v5.js')) + '\n' + '\n'.join(rd(os.path.join(R, 'src', f)) for f in PARTS); stub = rd(os.path.join(T, 'stub.js'))
NEW, OLD = 't_fincf02_save01.js', ['t_fincf02_issue.js', 't_fincf01_relief.js']
QB = 'c.cfd=S.day-720;c.ncq=0;delete c.isq;c.isd=S.day-720;c.eqq=0;'          # the fix in qBack
HEAD = 'function qBack(c){if(c.priv&&c.fo)return;'
STRIP = 'k==="wd"?undefined:v)'                                                # packS(1): the keys an export leaves out
CONF = 'if(c.eqq){const dq=Math.round(S.day);'                                 # earn(): the close confirms eqq
PREP_E, PREP_N = 'if(c.eqq==null)c.eqq=0;', 'if(c.ncq==null)c.ncq=0;'         # v8prep: defaults only when missing
MUTANTS = [('none (the fixed game)', []),
    ('M1 qBack keeps the waiting share-issue cash eqq (the defect)', [(QB, 'c.cfd=S.day-720;c.ncq=0;delete c.isq;c.isd=S.day-720;')]),
    ('M2 the clearing runs before the c.priv&&c.fo return (a founded company loses its waiting contribution)', [(HEAD, 'function qBack(c){c.eqq=0;c.ncq=0;if(c.priv&&c.fo)return;'), (QB, 'c.cfd=S.day-720;delete c.isq;c.isd=S.day-720;')]),
    ('M3 cleared when the export is written (packS(1), option D) instead of on the restore', [(STRIP, 'k==="wd"?undefined:k==="eqq"||k==="ncq"?0:v)'), (QB, 'c.cfd=S.day-720;delete c.isq;c.isd=S.day-720;')]),
    ('M4 the first close after a restore drops everything waiting, also trades made after the restore', [(QB, QB + 'c.xr=1;'), (CONF, 'if(c.xr){c.eqq=0;delete c.xr}' + CONF)]),
    ('M5 eqq cleared in v8prep instead (every load, full saves too, and bankFix every 30 days)', [(QB, 'c.cfd=S.day-720;c.ncq=0;delete c.isq;c.isd=S.day-720;'), (PREP_E, 'c.eqq=0;')]),
    ('M6a qBack keeps the waiting relief ncq (option A without A1)', [(QB, 'c.cfd=S.day-720;delete c.isq;c.isd=S.day-720;c.eqq=0;')]),
    ('M6b ncq cleared in v8prep instead (every load, full saves too, and bankFix every 30 days)', [(QB, 'c.cfd=S.day-720;delete c.isq;c.isd=S.day-720;c.eqq=0;'), (PREP_N, 'c.ncq=0;')]),
    ('M7 cleared only after day 0 (like the FIN-CF-03A ledger start)', [(QB, 'c.cfd=S.day-720;if(S.day>0)c.ncq=0;delete c.isq;c.isd=S.day-720;if(S.day>0)c.eqq=0;')]),
]
def run(game, name):
    code = SEED + stub + '\n' + game + '\n' + rd(os.path.join(T, name))
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(code); p = f.name
    out = subprocess.run(['node', p], capture_output=True, text=True, timeout=3600, env=dict(os.environ, TESTS_DIR=T)); os.unlink(p)
    txt = out.stdout + out.stderr; m = re.findall(r'errs (\d+) fails (\d+)', txt)
    return (bool(m) and m[-1] == ('0', '0') and out.returncode == 0), (m[-1] if m else ('?', '?')), [l for l in txt.splitlines() if l.startswith('FAIL') or l.startswith('ERR')]
def one(mu):
    label, edits = mu; game = game0
    for a, b in edits:
        n = game.count(a)
        if n != 1: return (mu, None, 'SETUP ERROR snippet found %d times: %s' % (n, a[:70]), None, None)
        game = game.replace(a, b)
    ok_new, cnt, fl = run(game, NEW)
    old = {o: run(game, o)[:2] for o in OLD}
    return (mu, ok_new, cnt, fl, old)
bad = 0
with ThreadPoolExecutor(max_workers=int(os.environ.get('JOBS', '2'))) as ex: results = list(ex.map(one, MUTANTS))
for (label, edits), ok_new, cnt, fl, old in results:
    if ok_new is None: print('SETUP ERROR', label, cnt); sys.exit(2)
    scen = []
    for l in fl:
        m = re.match(r'^(?:FAIL|ERR  FIXTURE INVALID:) (S1/S12|S\d+[a-z]?|FIX-OLD)', l)
        k = m.group(1) if m else '?'
        if k not in scen: scen.append(k)
    oldtxt = ', '.join('%s %s' % (o, 'passes' if v[0] else 'FAILS (errs %s fails %s)' % v[1]) for o, v in old.items())
    if not edits:
        good = ok_new and all(v[0] for v in old.values())
        print(('ok  ' if good else 'BAD ') + label + ': ' + ('t_fincf02_save01 passes' if ok_new else 't_fincf02_save01 FAILS ' + str(cnt)) + ' | ' + oldtxt)
    else:
        good = not ok_new
        print(('ok  ' if good else 'BAD ') + label + ': ' + ('CAUGHT by t_fincf02_save01 (errs %s fails %s) in %s' % (cnt[0], cnt[1], ', '.join(scen)) if not ok_new else 'NOT caught by t_fincf02_save01') + ' | ' + oldtxt)
    bad += not good
print('ALL MUTANTS CAUGHT, unmodified game passes' if not bad else '%d problem(s)' % bad); sys.exit(1 if bad else 0)
