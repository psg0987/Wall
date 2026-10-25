"""FIN-CF-03B (A): do the tests catch wrong implementations? Each edit is applied in memory to the game assembled from src/ (as build/build.py);
src/ and dist/ are not touched. Every mutant must make tests/t_fincf03b_gr.js fail; the unmodified game must pass. The two existing tests whose
expectations changed (t_fincf03_acq.js, t_fincf01_relief.js) run on every mutant too.
usage: python3 verify/fin-cf-03b/mutation_check.py      (JOBS=2 by default)"""
import ast, os, re, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V)); T = os.path.join(R, 'tests')
rd = lambda p: open(p, encoding='utf-8').read()
b = ast.parse(rd(os.path.join(R, 'build', 'build.py')))
PARTS = [ast.literal_eval(n.value) for n in b.body if isinstance(n, ast.Assign) and any(getattr(t, 'id', '') == 'PARTS' for t in n.targets)][0]
t = ast.parse(rd(os.path.join(T, 'run.py')))
SEED = [ast.literal_eval(n.value) for n in t.body if isinstance(n, ast.Assign) and any(getattr(x, 'id', '') == 'SEED' for x in n.targets)][0]
game0 = rd(os.path.join(R, 'src', 'base_v5.js')) + '\n' + '\n'.join(rd(os.path.join(R, 'src', f)) for f in PARTS); stub = rd(os.path.join(T, 'stub.js'))
NEW, OLD = 't_fincf03b_gr.js', ['t_fincf03_acq.js', 't_fincf01_relief.js']
NCG = 'ncG=fin&&st==="full"&&prev&&prev.d>0&&Number.isFinite(q.gr)?q.gr:0,'
CFF = 'cff=prev?dD+nc-ncA-ncG-q.dv+iss:null'
MEMO = ',...(cfAx(c,"ncG")?[["└ 예금·보험부채 증감(자산과 함께 늘거나 줄어 현금 없음, 위 차입·재무활동에서 뺌)",(q,d)=>d.cff!=null&&d.ncG?d.ncG:null]]:[])'
MUTANTS = [('none (the fixed game)', []),
    ('M1 ncG not taken out of cff (the defect)', [(CFF, 'cff=prev?dD+nc-ncA-q.dv+iss:null')]),
    ('M2 sign reversed (cff + ncG)', [(CFF, 'cff=prev?dD+nc-ncA+ncG-q.dv+iss:null')]),
    ('M3 also on partly recorded rows (no st check)', [(NCG, 'ncG=fin&&prev&&prev.d>0&&Number.isFinite(q.gr)?q.gr:0,')]),
    ('M4 also after rows rebuilt at day 0 (no prev.d > 0)', [(NCG, 'ncG=fin&&st==="full"&&prev&&Number.isFinite(q.gr)?q.gr:0,')]),
    ('M5 every company, not only financial ones', [(NCG, 'ncG=st==="full"&&prev&&prev.d>0&&Number.isFinite(q.gr)?q.gr:0,')]),
    ('M6 no finite check (missing gr)', [(NCG, 'ncG=fin&&st==="full"&&prev&&prev.d>0?q.gr:0,')]),
    ('M7 positive growth only', [(NCG, 'ncG=fin&&st==="full"&&prev&&prev.d>0&&Number.isFinite(q.gr)&&q.gr>0?q.gr:0,')]),
    ('M8 memo row missing', [(MEMO, '')]),
]
def run(game, name):
    code = SEED + stub + '\n' + game + '\n' + rd(os.path.join(T, name))
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(code); p = f.name
    out = subprocess.run(['node', p], capture_output=True, text=True, timeout=3600, env=dict(os.environ, TESTS_DIR=T)); os.unlink(p)
    txt = out.stdout + out.stderr; m = re.findall(r'errs (\d+) fails (\d+)', txt)
    return (bool(m) and m[-1] == ('0', '0') and out.returncode == 0), (m[-1] if m else ('?', '?')), [l for l in txt.splitlines() if l.startswith('FAIL') or l.startswith('ERR')]
def one(mu):
    label, edits = mu; game = game0
    for a, b2 in edits:
        n = game.count(a)
        if n != 1: return (mu, None, 'SETUP ERROR snippet found %d times: %s' % (n, a[:70]), None, None)
        game = game.replace(a, b2)
    ok_new, cnt, fl = run(game, NEW)
    return (mu, ok_new, cnt, fl, {o: run(game, o)[:2] for o in OLD})
bad = 0
with ThreadPoolExecutor(max_workers=int(os.environ.get('JOBS', '2'))) as ex: results = list(ex.map(one, MUTANTS))
for (label, edits), ok_new, cnt, fl, old in results:
    if ok_new is None: print('SETUP ERROR', label, cnt); sys.exit(2)
    scen = []
    for l in fl:
        m = re.match(r'^(?:FAIL|ERR  FIXTURE INVALID:) (F\d+)', l); k = m.group(1) if m else '?'
        if k not in scen: scen.append(k)
    oldtxt = ', '.join('%s %s' % (o, 'passes' if v[0] else 'FAILS (errs %s fails %s)' % v[1]) for o, v in old.items())
    good = (ok_new and all(v[0] for v in old.values())) if not edits else not ok_new
    print(('ok  ' if good else 'BAD ') + label + ': ' + (('t_fincf03b_gr passes' if ok_new else 't_fincf03b_gr FAILS ' + str(cnt)) if not edits else ('CAUGHT by t_fincf03b_gr (errs %s fails %s) in %s' % (cnt[0], cnt[1], ', '.join(scen)) if not ok_new else 'NOT caught by t_fincf03b_gr')) + ' | ' + oldtxt)
    bad += not good
print('ALL MUTANTS CAUGHT, unmodified game passes' if not bad else '%d problem(s)' % bad); sys.exit(1 if bad else 0)
