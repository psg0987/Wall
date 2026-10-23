"""FIN-CF-02: the branch against main (151b138) on the same seeds. Runs both builds side by side and compares the WHOLE game state (JSON of S) after every day.
usage: python3 verify/fin-cf-02/main_vs_branch.py [out-dir]       (main is read with `git show 151b138:src/...`, the branch from the working tree src/)
The only fields the branch adds are eqq (share-issue cash waiting for the close), isq (confirmed amounts by row day) and isd (day the company's issue ledger
starts); they are left out of the state before hashing, and nothing else may differ: prices, cash, debt, shares, quarter records (fq, all 24 numbers), RNG,
every day. Cases: three plain simulations (natural share events: AI events, bank capital raises, AI splits) and three scripted ones in which the PLAYER's share
paths run on both builds (rights issue + buyback, private placement + option exercise, cash contribution + new-share purchase + greenmail attempt), so the
eqCash calls on those paths are compared too. After the last day the next three Math.random() values of both builds are compared (same RNG position).
Each case is keyed by its index (the FIN-CF-01 script keyed by seed, so two cases with one seed were reported together)."""
import ast, hashlib, json, os, subprocess, sys, tempfile
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = sys.argv[1] if len(sys.argv) > 1 else tempfile.mkdtemp(prefix='fincf02_mvb_')
os.makedirs(OUT, exist_ok=True)
MAIN = '151b138f3e40922249a896532b586bfaa590abc3'
rd = lambda p: open(p, encoding='utf-8').read()
b = ast.parse(rd(R + '/build/build.py')); PARTS = [ast.literal_eval(n.value) for n in b.body if isinstance(n, ast.Assign) and any(getattr(t, 'id', '') == 'PARTS' for t in n.targets)][0]
t = ast.parse(rd(R + '/tests/run.py')); SEED = [ast.literal_eval(n.value) for n in t.body if isinstance(n, ast.Assign) and any(getattr(x, 'id', '') == 'SEED' for x in n.targets)][0]
git = lambda *a: subprocess.run(['git', '-C', R] + list(a), capture_output=True, text=True, check=True).stdout
game_branch = rd(R + '/src/base_v5.js') + '\n' + '\n'.join(rd(R + '/src/' + f) for f in PARTS)
game_main = git('show', MAIN + ':src/base_v5.js') + '\n' + '\n'.join(git('show', MAIN + ':src/' + f) for f in PARTS)
stub = rd(R + '/tests/stub.js')
PROBE = r'''
(() => {
const crypto = require('crypto');
const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const skip = new Set(['eqq', 'isq', 'isd']);
const out = [];
CASES.forEach(([seed, days, sc], ci) => {
  Math.random = mulberry(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null;
  let acted = '';
  for (let d = 0; d < days; d++) {
    if (sc && S.day === sc.day && !acted) {
      const T = S.co.find(c => !c.dead && !c.kd && !c.priv && !mine(c) && !c.own.P && c.bk === 0 && c.A > 3000); S.cash = 1e6;
      if (sc.kind === 'issue+buyback') { setOwn(T, 'P', 60); ctlAll(); G.mg(T.id, 'iss', .1); G.mg(T.id, 'bb', 5) }
      else if (sc.kind === 'placement+option') { setOwn(T, 'P', 60); ctlAll(); S.te = 'P'; G.pp(T.id, 10); S.ceo = T.id; S.eo = [{ i: T.id, pct: 2, k: Math.round(T.p * .6), v: S.day - 1, x: S.day + 900 }]; G.eoX(0) }
      else { setOwn(T, 'P', 100); ctlAll(); MV = { fr: 'P', to: T.id, how: 'cap', amt: 250, y: -1, f: 1 }; G.mvGo(); MV = { fr: 'P', to: T.id, how: 'pp', amt: 120, y: -1, f: 1 }; G.mvGo();
        const X = S.co.find(c => !c.dead && !c.kd && !c.priv && !mine(c) && c !== T); setOwn(X, 'P', 9); ctlAll(); S.te = 'P'; G.gm(X.id) }
      acted = T.tk + ' sh ' + T.sh.toFixed(3) + ' cs ' + T.cs.toFixed(3);
      out.push(ci + ' ' + S.day + ' ACT ' + sc.kind + ' ' + acted);
    }
    step(); if (mdl) G.mk(mdl.o.length - 1);
    const j = JSON.stringify(S, (k, v) => skip.has(k) ? undefined : v);
    out.push(ci + ' ' + S.day + ' ' + crypto.createHash('md5').update(j).digest('hex'));
  }
  out.push(ci + ' END rng ' + [Math.random(), Math.random(), Math.random()].map(x => x.toFixed(12)).join(','));
});
console.log(out.join('\n'));
})();
'''
def build(game, cases):
    code = SEED + stub + '\n' + game + '\n' + 'const CASES=%s;\n' % json.dumps(cases) + PROBE
    f = tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8'); f.write(code); f.close(); return f.name
CASES = [[20261016, 720, None], [777, 720, None], [12345, 720, None],
         [20261016, 400, {'day': 150, 'kind': 'issue+buyback'}], [777, 400, {'day': 120, 'kind': 'placement+option'}], [12345, 400, {'day': 200, 'kind': 'contribution+newshares+greenmail'}]]
procs = {}
for tag, game in (('main', game_main), ('branch', game_branch)):
    p = build(game, CASES); procs[tag] = (subprocess.Popen(['node', p], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True), p)
res = {}
for tag, (pr, p) in procs.items():
    o, e = pr.communicate(); os.unlink(p)
    if pr.returncode != 0: print('PROBE FAILED', tag, e[-800:]); sys.exit(2)
    res[tag] = o.strip().splitlines()
open(OUT + '/hashes_main.txt', 'w').write('\n'.join(res['main'])); open(OUT + '/hashes_branch.txt', 'w').write('\n'.join(res['branch']))
assert len(res['main']) == len(res['branch']), (len(res['main']), len(res['branch']))
bad = 0
for ci, (seed, days, sc) in enumerate(CASES):
    pairs = [(a, c) for a, c in zip(res['main'], res['branch']) if a.split()[0] == str(ci)]
    diff = [(a, c) for a, c in pairs if a != c]
    tag = 'seed %d, %d days%s' % (seed, days, ' + scripted player share actions (%s) on day %d' % (sc['kind'], sc['day']) if sc else '')
    print('case %d (%s): %s' % (ci, tag, 'the whole game state (without eqq/isq/isd) and the RNG position are identical on every day (main == branch), %d lines' % len(pairs) if not diff else 'DIFFERENT, first at %s | %s' % diff[0]))
    bad += bool(diff)
for l in res['branch']:
    if ' ACT ' in l: print('   scripted action:', l)
print('ALL IDENTICAL' if not bad else '%d case(s) differ' % bad); sys.exit(1 if bad else 0)
