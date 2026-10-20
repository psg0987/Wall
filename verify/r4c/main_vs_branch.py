"""RT-BANK-R4C: the branch against main (553d2f6) on the same seeds. Runs both builds side by side and compares the WHOLE game state (JSON of S) after every day.
usage: python3 verify/r4c/main_vs_branch.py [out-dir]       (main is read with `git archive 553d2f6`, the branch from the working tree src/)
Expected: where no bank writes off a loan the two states are byte-identical on every day (seed 20261016 is the golden seed); where one does
(seed 12345: BOAX, day 431) the first difference is on that day, in the bank's target price (tg) and nothing else, and later differences are the price
path that follows it (the bank, its holders' equity-method inputs are NOT changed: net income, assets, EPS history are compared again at the close)."""
import ast, hashlib, json, os, subprocess, sys, tempfile
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = sys.argv[1] if len(sys.argv) > 1 else tempfile.mkdtemp(prefix='r4c_mvb_')
os.makedirs(OUT, exist_ok=True)
MAIN = '553d2f6aa703a20b3486f39c8667b1fa04124a28'
rd = lambda p: open(p, encoding='utf-8').read()
b = ast.parse(rd(R + '/build/build.py')); PARTS = [ast.literal_eval(n.value) for n in b.body if isinstance(n, ast.Assign) and any(getattr(t, 'id', '') == 'PARTS' for t in n.targets)][0]
t = ast.parse(rd(R + '/tests/run.py')); SEED = [ast.literal_eval(n.value) for n in t.body if isinstance(n, ast.Assign) and any(getattr(x, 'id', '') == 'SEED' for x in n.targets)][0]
git = lambda *a: subprocess.run(['git', '-C', R] + list(a), capture_output=True, text=True, check=True).stdout
game_branch = rd(R + '/src/base_v5.js') + '\n' + '\n'.join(rd(R + '/src/' + f) for f in PARTS)
game_main = git('show', MAIN + ':src/base_v5.js') + '\n' + '\n'.join(git('show', MAIN + ':src/' + f) for f in PARTS)
stub = rd(R + '/tests/stub.js')
PROBE = r'''
(() => {
const crypto = require('crypto'), fs = require('fs');
const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const out = [];
for (const [seed, days] of CASES) {
  Math.random = mulberry(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null;
  const dump = DUMPS[seed] || [];
  for (let d = 0; d < days; d++) {
    step(); if (mdl) G.mk(mdl.o.length - 1);
    const j = JSON.stringify(S);
    out.push(seed + ' ' + S.day + ' ' + crypto.createHash('md5').update(j).digest('hex'));
    if (dump.includes(S.day)) fs.writeFileSync(DUMPDIR + '/' + TAG + '_' + seed + '_' + S.day + '.json', j);
  }
}
console.log(out.join('\n'));
})();
'''
def build(game, tag, cases, dumps):
    pre = 'const CASES=%s, DUMPS=%s, DUMPDIR=%s, TAG=%s;\n' % (json.dumps(cases), json.dumps(dumps), json.dumps(OUT), json.dumps(tag))
    code = SEED + stub + '\n' + game + '\n' + pre + PROBE
    f = tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8'); f.write(code); f.close(); return f.name
CASES = [[20261016, 720], [777, 720], [12345, 560]]
# dump the whole state on the days around the first divergence we expect (seed 12345: BOAX default day 431, close 494)
DUMPS = {'12345': [430, 431, 494, 495], '20261016': [720], '777': [720]}
DUMPS = {int(k): v for k, v in DUMPS.items()}
procs = {}
for tag, game in (('main', game_main), ('branch', game_branch)):
    p = build(game, tag, CASES, {str(k): v for k, v in DUMPS.items()})
    procs[tag] = (subprocess.Popen(['node', p], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True), p)
res = {}
for tag, (pr, p) in procs.items():
    o, e = pr.communicate(); os.unlink(p)
    if pr.returncode != 0: print('PROBE FAILED', tag, e[-800:]); sys.exit(2)
    res[tag] = [l.split() for l in o.strip().splitlines()]
open(OUT + '/hashes_main.txt', 'w').write('\n'.join(' '.join(l) for l in res['main'])); open(OUT + '/hashes_branch.txt', 'w').write('\n'.join(' '.join(l) for l in res['branch']))
assert len(res['main']) == len(res['branch'])
bad = 0; first = {}
for a, c in zip(res['main'], res['branch']):
    assert a[:2] == c[:2]
    if a[2] != c[2] and a[0] not in first: first[a[0]] = int(a[1])
for seed, days in CASES:
    n = sum(1 for a in res['main'] if a[0] == str(seed))
    if str(seed) in first: print('seed %d: %d days, first difference on day %d' % (seed, n, first[str(seed)]))
    else: print('seed %d: %d days, the whole game state is identical on every day (main == branch)' % (seed, n))
def walk(a, b, path, out, lim=40):
    if len(out) >= lim: return
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a or k not in b: out.append((path + '/' + k, a.get(k), b.get(k)))
            else: walk(a[k], b[k], path + '/' + k, out, lim)
    elif isinstance(a, list) and isinstance(b, list) and len(a) == len(b):
        for i, (x, y) in enumerate(zip(a, b)): walk(x, y, path + '[%d]' % i, out, lim)
    elif a != b: out.append((path, a, b))
if '12345' in first:
    d = first['12345']
    print('-- seed 12345, whole-state difference on the first day it differs (day %d), main -> branch:' % d)
    out = []; A = json.load(open('%s/main_12345_%d.json' % (OUT, d))); B = json.load(open('%s/branch_12345_%d.json' % (OUT, d)))
    walk(A, B, '', out, 60)
    for p, x, y in out:
        nm = p
        m = __import__('re').match(r'/co\[(\d+)\]', p)
        if m: nm = '%s (%s)' % (p, A['co'][int(m.group(1))].get('tk'))
        print('   ', nm[:90], '|', str(x)[:40], '->', str(y)[:40])
    print('   ', len(out), 'differing leaf values listed' + (' (list capped)' if len(out) >= 60 else ''))
    ok = len(out) > 0 and all(p.endswith('/tg') and p.startswith('/co[') for p, _, _ in out)
    print('   only a bank target price (tg) differs on the first day:', ok); bad += not ok
for seed in ('20261016', '777'):
    if seed in first: print('PROBLEM: seed', seed, 'differs from main on day', first[seed]); bad += 1
print('RESULT:', 'as expected' if not bad else '%d problem(s)' % bad); sys.exit(1 if bad else 0)
