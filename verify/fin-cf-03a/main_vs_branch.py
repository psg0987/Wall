"""FIN-CF-03A: the branch against main (d553d3e) on the same seeds. Runs both builds side by side and compares the WHOLE game state (JSON of S) after every day.
usage: python3 verify/fin-cf-03a/main_vs_branch.py [out-dir]       (main is read with `git show d553d3e:src/...`, the branch from the working tree src/)
The only fields the branch adds are acq (acquisition / non-cash debt record waiting for the close), acr (confirmed records by row day) and acd (day the
company's ledger starts); they are left out of the state before hashing, and nothing else may differ: prices, cash, debt, shares, quarter records (fq, all
24 numbers), RNG, every day. Cases: three plain simulations (AI acquisitions by maTick, hidden-debt bombs) and scripted ones in which the deals of FIN-CF-03A
run on both builds through the real game functions: stock merger of an outside company and of a player-controlled sister company (G.merge), a tender
followed by the absorption of the 100% subsidiary (G.tender + G.liq), an LBO (G.tender lbo), an accepted takeover offer (event "offer"), an AI acquirer
holding 60% of a peer (maTick may absorb its own subsidiary), and full / export (rows left out, qBack rebuilds them) save round trips in the middle of a
run. After the last day the next three Math.random() values of both builds are compared (same RNG position)."""
import ast, hashlib, json, os, subprocess, sys, tempfile
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = sys.argv[1] if len(sys.argv) > 1 else tempfile.mkdtemp(prefix='fincf03a_mvb_')
os.makedirs(OUT, exist_ok=True)
MAIN = 'd553d3ebed522e0fdf03657d4460de6673bb2b5d'
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
const skip = new Set(['acq', 'acr', 'acd']);
const pick = () => S.co.find(c => !c.dead && !c.kd && !c.priv && !mine(c) && !c.own.P && c.bk === 0 && c.A > 3000);
const small = (T, f) => S.co.find(c => !c.dead && !c.priv && !c.kd && c !== T && !mine(c) && mc(c) < mc(T) * f && c.i !== HOLD && c.D > 50);
const roundTrip = strip => { const js = strip ? JSON.stringify(S, (k, v) => k === 'hr' || k === 'hv' || k === 'fq' || k === 'IX' || k === 'hm' || k === 'w10' || k === 'wd' ? undefined : v) : JSON.stringify(S); S = migrate(JSON.parse(js)); v8fix(); sel = -1; mdl = null };
let ST = {};
function act(kind, ci) {
  if (kind === 'merge-ext') { const T = pick(); setOwn(T, 'P', 60); ctlAll(); const x = small(T, .3); let n = 0; for (; n < 8 && !x.dead; n++) { S.te = T.id; G.merge(x.id, 60) } return T.tk + ' <- ' + x.tk + ' dead ' + x.dead + ' after ' + n }
  if (kind === 'merge-sister') { const T = pick(); setOwn(T, 'P', 60); ctlAll(); const x = small(T, .3); setOwn(x, 'P', 55); ctlAll(); S.te = T.id; G.merge(x.id, 40); return T.tk + ' <- ' + x.tk + ' (ctl P) dead ' + x.dead }
  if (kind === 'tender-liq') { const H = pick(); setOwn(H, 'P', 60); ctlAll(); const C = small(H, .2); H.cs += mc(C) * 3; S.te = H.id; G.tender(C.id, 90, 0); ST = { H: H.id, C: C.id }; return H.tk + ' tender ' + C.tk + ' priv ' + C.priv }
  if (kind === 'liq') { const C = S.co[ST.C]; if (C && C.priv && !C.dead) G.liq(C.id); return 'liq ' + (C && C.tk) + ' dead ' + (C && C.dead) }
  if (kind === 'lbo') { const T = pick(); S.cash = 1e7; S.te = 'P'; for (const pr of [60, 90, 140]) { G.tender(T.id, pr, 1); if (T.priv) break } return 'LBO ' + T.tk + ' priv ' + T.priv }
  if (kind === 'offer') { const big = z => S.co.filter(y => !y.dead && !y.priv && !y.kd && y.i === z.i && y !== z && mc(y) > mc(z) * 1.5);
    const c = S.co.find(z => !z.dead && !z.priv && !z.kd && !mine(z) && !z.own.P && z.bk === 0 && z.A > 800 && z.i !== HOLD && z.D > 100 && big(z).length); setOwn(c, 'P', 60); ctlAll();
    const a = big(c).sort((p, q) => mc(q) - mc(p))[0]; a.cs = Math.max(a.cs, mc(c) * 1.6); setOwn(c, 'c' + a.id, 10); ctlAll();
    const e = EV2.find(z => z.id === 'offer'); const x = e.mk(c); return e.go(c, x, 'yes') }
  if (kind === 'matick-own') { const cand = S.co.filter(c => !c.dead && !c.priv && !mine(c) && rating(c) <= 2 && !c.kd).sort((x, y) => mc(y) - mc(x)).slice(0, 30);
    for (const a of cand) { const t = S.co.find(z => !z.dead && z.i === a.i && z !== a && !z.priv && !mine(z) && mc(z) < mc(a) * .25 && z.pill < S.day); if (!t) continue;
      for (const k of Object.keys(a.own)) setOwn(a, k, 0); setOwn(a, 'r0', 60); for (const k of Object.keys(t.own)) setOwn(t, k, 0); setOwn(t, 'c' + a.id, 60); t.bs['c' + a.id] = mc(t) * .6; ctlAll(); return a.tk + ' (r0) holds 60% of ' + t.tk } return 'none' }
  if (kind === 'reload-full') { roundTrip(0); return 'full save round trip' }
  if (kind === 'reload-strip') { roundTrip(1); return 'export round trip (qBack)' }
}
const out = [];
CASES.forEach(([seed, days, acts], ci) => {
  Math.random = mulberry(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; ST = {};
  for (let d = 0; d < days; d++) {
    for (const [day, kind] of acts || []) if (S.day === day) out.push(ci + ' ' + S.day + ' ACT ' + kind + ' ' + act(kind, ci));
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
         [20261016, 400, [[147, 'merge-ext'], [250, 'reload-full']]],
         [20261016, 400, [[147, 'merge-sister'], [180, 'reload-strip']]],
         [777, 400, [[60, 'tender-liq'], [200, 'liq'], [260, 'reload-full']]],
         [12345, 400, [[120, 'lbo'], [150, 'reload-strip']]],
         [20261016, 400, [[150, 'offer']]],
         [20261016, 500, [[60, 'matick-own']]]]
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
for ci, (seed, days, acts) in enumerate(CASES):
    pairs = [(a, c) for a, c in zip(res['main'], res['branch']) if a.split()[0] == str(ci)]
    diff = [(a, c) for a, c in pairs if a != c]
    tag = 'seed %d, %d days%s' % (seed, days, ' + scripted ' + ', '.join('%s on day %d' % (k, d) for d, k in acts) if acts else '')
    print('case %d (%s): %s' % (ci, tag, 'the whole game state (without acq/acr/acd) and the RNG position are identical on every day (main == branch), %d lines' % len(pairs) if not diff else 'DIFFERENT, first at %s | %s' % diff[0]))
    bad += bool(diff)
for l in res['branch']:
    if ' ACT ' in l: print('   scripted action:', l)
print('ALL IDENTICAL' if not bad else '%d case(s) differ' % bad); sys.exit(1 if bad else 0)
