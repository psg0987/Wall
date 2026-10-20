"""FIN-CF-01: the branch against main (f4a825d) on the same seeds. Runs both builds side by side and compares the WHOLE game state (JSON of S) after every day.
usage: python3 verify/fin-cf-01/main_vs_branch.py [out-dir]       (main is read with `git show f4a825d:src/...`, the branch from the working tree src/)
The only fields the branch adds are ncq (relief waiting for the close), rlf (confirmed relief {d,R}) and cfd (day the company's relief ledger starts); they are left out of
the state before hashing (the replacer below), and nothing else may differ: prices, cash, debt, quarter records (fq, all 24 numbers), RNG, tg, ... every day.
Cases: three plain simulations (seed 12345 contains a chapter 11 inside earn() on day 431), and two scripted ones in which a loan call pushes a company into chapter 11
OUTSIDE earn() (the callLoan path, player/rival-bank only, never in an AI-only simulation) so that path is compared too. After the last day the next three Math.random()
values of both builds are compared (same RNG position)."""
import ast, hashlib, json, os, subprocess, sys, tempfile
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = sys.argv[1] if len(sys.argv) > 1 else tempfile.mkdtemp(prefix='fincf01_mvb_')
os.makedirs(OUT, exist_ok=True)
MAIN = 'f4a825d02b5cefcd512eea266bfd90d5f5e78157'
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
const skip = new Set(['ncq', 'rlf', 'cfd']);
const out = [];
for (const [seed, days, sc] of CASES) {
  Math.random = mulberry(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null;
  let acted = 0;
  for (let d = 0; d < days; d++) {
    if (sc && S.day === sc.day && !acted) {       // scripted: a loan call that ends in chapter 11 outside earn() (and a direct ch11 of a healthy company)
      const T = S.co.find(c => !c.dead && !c.kd && !c.priv && !mine(c) && !c.own.P && c.bk === 0 && c.ln >= 0 && S.co[c.ln] && !S.co[c.ln].dead && S.co[c.ln].kd === 1 && c.A > 3000);
      if (sc.kind === 'callLoan') { const X = T.D - T.cs - T.gw - pfv(T); T.cs = 0; T.A = 0.7 * X / 1.25 / (1 + T.g / 4); callLoan(S.co[T.ln], T, 1) } else ch11(T, 'script');
      acted = T.id + 1; out.push(seed + ' ' + S.day + ' ACT ' + T.tk + ' bk ' + T.bk);
    }
    step(); if (mdl) G.mk(mdl.o.length - 1);
    const j = JSON.stringify(S, (k, v) => skip.has(k) ? undefined : v);
    out.push(seed + ' ' + S.day + ' ' + crypto.createHash('md5').update(j).digest('hex'));
  }
  out.push(seed + ' END rng ' + [Math.random(), Math.random(), Math.random()].map(x => x.toFixed(12)).join(','));
  if (sc) out.push(seed + ' END scripted-action-done ' + acted);
}
console.log(out.join('\n'));
})();
'''
def build(game, tag, cases):
    pre = 'const CASES=%s;\n' % json.dumps(cases)
    code = SEED + stub + '\n' + game + '\n' + pre + PROBE
    f = tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8'); f.write(code); f.close(); return f.name
CASES = [[20261016, 720, None], [777, 720, None], [12345, 560, None], [20261016, 400, {'day': 150, 'kind': 'callLoan'}], [777, 400, {'day': 120, 'kind': 'ch11'}]]
procs = {}
for tag, game in (('main', game_main), ('branch', game_branch)):
    p = build(game, tag, CASES); procs[tag] = (subprocess.Popen(['node', p], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True), p)
res = {}
for tag, (pr, p) in procs.items():
    o, e = pr.communicate(); os.unlink(p)
    if pr.returncode != 0: print('PROBE FAILED', tag, e[-800:]); sys.exit(2)
    res[tag] = o.strip().splitlines()
open(OUT + '/hashes_main.txt', 'w').write('\n'.join(res['main'])); open(OUT + '/hashes_branch.txt', 'w').write('\n'.join(res['branch']))
assert len(res['main']) == len(res['branch']), (len(res['main']), len(res['branch']))
bad = 0; first = {}
for a, c in zip(res['main'], res['branch']):
    if a != c:
        k = a.split()[0] + '/' + (a.split()[2] if a.split()[1] == 'END' else '')
        if a.split()[0] not in first: first[a.split()[0]] = (a, c)
for seed, days, sc in CASES:
    lines = [l for l in res['main'] if l.split()[0] == str(seed) and l.split()[1] != 'END']
    key = str(seed)
    tag = '%d days%s' % (days, ' + scripted ' + sc['kind'] + ' on day %d' % sc['day'] if sc else '')
    same = all(a == c for a, c in zip(res['main'], res['branch']) if a.split()[0] == key)
    print('seed %d (%s): %s' % (seed, tag, 'the whole game state (without ncq/rlf/cfd) and the RNG position are identical on every day (main == branch)' if same else 'DIFFERENT, first at %s | %s' % first[key]))
    bad += not same
act = [l for l in res['branch'] if ' ACT ' in l]
for l in act: print('   scripted action:', l)
print('ALL IDENTICAL' if not bad else '%d case(s) differ' % bad); sys.exit(1 if bad else 0)
