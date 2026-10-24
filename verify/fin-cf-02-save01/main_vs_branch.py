"""FIN-CF-02-SAVE-01 (A1): the branch against main (d82f847) on the same seeds. Runs both builds side by side, each in its own node process, and
compares the WHOLE game state (JSON of S) after every day, and the game's own random streams at the end of every case.
usage: python3 verify/fin-cf-02-save01/main_vs_branch.py [out-dir]      (main is read with `git show d82f847:src/...`, the branch from the working tree src/)
The fix only sets eqq and ncq to 0 when qBack rebuilds a company's rows (export restore); isq and rlf are what the next close makes of eqq and ncq.
Those four recording-only fields are left out of the state before hashing; nothing else may differ on any day: prices, cash, debt, shares, quarter
records (fq, all 24 numbers), the FIN-CF-03A fields acq / acr / acd, the ledger starts isd / cfd, ... Separately, a hash of ONLY those four fields shows
on how many days they differ (expected: none in the cases without an export restore of a waiting amount).
Random streams compared at the end: the main stream _R (re-made every day from (seed, day) by dayR) and a day-keyed stream wR(1); the game does not
use Math.random after init (verify/fin-cf-02-save01/probes.js [P1]), so it is not compared.
Cases: three natural runs (720 days, no player action, no restore) and scripted ones through the real game functions: player rights issue / buyback
then export restore (packS(1) -> loadStr -> v8fix, as the paste path), the same issue through a full save, natural exports with AI companies waiting
(seed 20261016 day 540 and 225, seed 12345 day 555), the loan-call relief (FIN-CF-01) then export, a FIN-CF-03A stock merger plus an issue then
export, a founded company's contribution then export, an issue on day 0 then export, and an export restore followed by a full save of it; then the
six scripted cases of the FIN-CF-03A comparison (verify/fin-cf-03a/main_vs_branch.py: stock merger of an outside company and of a sister company, tender
+ absorption, LBO, accepted takeover offer, AI acquirer holding 60% of a peer) with their save round trips (full / export) done through packS / loadStr."""
import ast, hashlib, json, os, subprocess, sys, tempfile
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = sys.argv[1] if len(sys.argv) > 1 else tempfile.mkdtemp(prefix='save01_mvb_')
os.makedirs(OUT, exist_ok=True)
MAIN = 'd82f84764fdf242de4956ed9d53521a479cc80a9'
rd = lambda p: open(p, encoding='utf-8').read()
b = ast.parse(rd(R + '/build/build.py')); PARTS = [ast.literal_eval(n.value) for n in b.body if isinstance(n, ast.Assign) and any(getattr(t, 'id', '') == 'PARTS' for t in n.targets)][0]
t = ast.parse(rd(R + '/tests/run.py')); SEED = [ast.literal_eval(n.value) for n in t.body if isinstance(n, ast.Assign) and any(getattr(x, 'id', '') == 'SEED' for x in n.targets)][0]
git = lambda *a: subprocess.run(['git', '-C', R] + list(a), capture_output=True, text=True, check=True).stdout
game_branch = rd(R + '/src/base_v5.js') + '\n' + '\n'.join(rd(R + '/src/' + f) for f in PARTS)
game_main = git('show', MAIN + ':src/base_v5.js') + '\n' + '\n'.join(git('show', MAIN + ':src/' + f) for f in PARTS)
stub = rd(R + '/tests/stub.js')
PROBE = r'''
(async () => {
const crypto = require('crypto');
const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const LEDGER = new Set(['eqq', 'isq', 'ncq', 'rlf']);
const hAll = () => crypto.createHash('md5').update(JSON.stringify(S, (k, v) => LEDGER.has(k) ? undefined : v)).digest('hex').slice(0, 12);
const hLed = () => crypto.createHash('md5').update(JSON.stringify(S.co.map(c => [c.eqq || 0, c.isq || null, c.ncq || 0, c.rlf || null]))).digest('hex').slice(0, 12);
const plain = c => !c.dead && !c.kd && !c.priv && !mine(c) && !c.own.P && c.bk === 0 && c.A > 3000;
const small = (T, f) => S.co.find(c => !c.dead && !c.priv && !c.kd && c !== T && !mine(c) && mc(c) < mc(T) * f && c.i !== HOLD && c.D > 50);
const reload = async strip => { const txt = await packS(strip), s = await loadStr(txt); S = s; v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null };
let T = null, F = null, ST = {};
const ACT = {
  pick: () => { T = S.co.find(plain); return T.tk },
  mine: () => { setOwn(T, 'P', 60); ctlAll(); return T.tk + ' mine ' + mine(T) },
  cash: () => { T.cs += T.A; return 'cash ' + T.cs.toFixed(2) },
  issue: () => { const c0 = T.cs, d0 = T.D; G.mg(T.id, 'iss', .1); return 'issue ' + ((T.cs - c0) - (T.D - d0)).toFixed(2) + ' eqq ' + (T.eqq || 0).toFixed(2) },
  buyback: () => { const c0 = T.cs, d0 = T.D; G.mg(T.id, 'bb', 5); return 'buyback ' + ((T.cs - c0) - (T.D - d0)).toFixed(2) },
  callloan: () => { const D0 = T.D; T.cs = 0; const X = T.D - T.cs - T.gw - pfv(T); T.A = 0.7 * X / 1.25 / (1 + T.g / 4); const p = callLoan(S.co[T.ln], T, 1); return 'loan call paid ' + p.toFixed(2) + ', debt ' + D0.toFixed(2) + ' -> ' + T.D.toFixed(2) + ', ncq ' + (T.ncq || 0).toFixed(2) },
  merge: () => { const x = S.co.find(c => !c.dead && !c.priv && !c.kd && c !== T && !mine(c) && mc(c) < mc(T) * .3 && c.i !== HOLD); setOwn(x, 'P', 55); ctlAll(); S.te = T.id; G.merge(x.id, 40); return T.tk + ' <- ' + x.tk + ' dead ' + x.dead + ' acq ' + JSON.stringify(T.acq && { aD: +T.acq.aD.toFixed(2) }) },
  found: () => { S.cash = 1e6; G.fdOpen(); FD.sec = 3; FD.cap = 300; FD.fo = 'P'; G.fdGo(); F = S.co[S.co.length - 1]; return 'founded ' + F.tk + ' priv ' + F.priv + ' fo ' + F.fo },
  cap: () => { MV = { fr: 'P', to: F.id, how: 'cap', amt: 50, y: -1, f: 1 }; G.mvGo(); return F.tk + ' eqq ' + (F.eqq || 0).toFixed(2) },
  pending: () => 'waiting eqq: ' + S.co.filter(c => !c.dead && c.eqq).map(c => c.tk + ' ' + c.eqq.toFixed(2)).join(', ') + ' | ncq: ' + S.co.filter(c => !c.dead && c.ncq).map(c => c.tk + ' ' + c.ncq.toFixed(2)).join(', '),
  // the six scripted cases of verify/fin-cf-03a/main_vs_branch.py (same calls), their save round trips done here through the real packS / loadStr path
  mergeext: () => { T = S.co.find(plain); setOwn(T, 'P', 60); ctlAll(); const x = small(T, .3); let n = 0; for (; n < 8 && !x.dead; n++) { S.te = T.id; G.merge(x.id, 60) } return T.tk + ' <- ' + x.tk + ' dead ' + x.dead + ' after ' + n },
  mergesister: () => { T = S.co.find(plain); setOwn(T, 'P', 60); ctlAll(); const x = small(T, .3); setOwn(x, 'P', 55); ctlAll(); S.te = T.id; G.merge(x.id, 40); return T.tk + ' <- ' + x.tk + ' (ctl P) dead ' + x.dead },
  tenderliq: () => { const H = S.co.find(plain); setOwn(H, 'P', 60); ctlAll(); const C = small(H, .2); H.cs += mc(C) * 3; S.te = H.id; G.tender(C.id, 90, 0); ST = { C: C.id }; T = H; return H.tk + ' tender ' + C.tk + ' priv ' + C.priv },
  liq: () => { const C = S.co[ST.C]; if (C && C.priv && !C.dead) G.liq(C.id); return 'liq ' + (C && C.tk) + ' dead ' + (C && C.dead) },
  lbo: () => { T = S.co.find(plain); S.cash = 1e7; S.te = 'P'; for (const pr of [60, 90, 140]) { G.tender(T.id, pr, 1); if (T.priv) break } return 'LBO ' + T.tk + ' priv ' + T.priv },
  offer: () => { const big = z => S.co.filter(y => !y.dead && !y.priv && !y.kd && y.i === z.i && y !== z && mc(y) > mc(z) * 1.5);
    const c = S.co.find(z => !z.dead && !z.priv && !z.kd && !mine(z) && !z.own.P && z.bk === 0 && z.A > 800 && z.i !== HOLD && z.D > 100 && big(z).length); setOwn(c, 'P', 60); ctlAll();
    const a = big(c).sort((p, q) => mc(q) - mc(p))[0]; a.cs = Math.max(a.cs, mc(c) * 1.6); setOwn(c, 'c' + a.id, 10); ctlAll();
    const e = EV2.find(z => z.id === 'offer'); const x = e.mk(c); T = a; return c.tk + ' offer from ' + a.tk + ': ' + String(e.go(c, x, 'yes')).slice(0, 80) },
  matickown: () => { const cand = S.co.filter(c => !c.dead && !c.priv && !mine(c) && rating(c) <= 2 && !c.kd).sort((x, y) => mc(y) - mc(x)).slice(0, 30);
    for (const a of cand) { const t = S.co.find(z => !z.dead && z.i === a.i && z !== a && !z.priv && !mine(z) && mc(z) < mc(a) * .25 && z.pill < S.day); if (!t) continue;
      for (const k of Object.keys(a.own)) setOwn(a, k, 0); setOwn(a, 'r0', 60); for (const k of Object.keys(t.own)) setOwn(t, k, 0); setOwn(t, 'c' + a.id, 60); t.bs['c' + a.id] = mc(t) * .6; ctlAll(); return a.tk + ' (r0) holds 60% of ' + t.tk } return 'none' },
  export: async () => { const id = T && T.id, fid = F && F.id; await reload(1); if (id != null) T = S.co[id]; if (fid != null) F = S.co[fid]; return 'export restore day ' + S.day + (T ? ' ' + T.tk + ' eqq ' + (T.eqq || 0).toFixed(2) + ' ncq ' + (T.ncq || 0).toFixed(2) : '') },
  full: async () => { const id = T && T.id, fid = F && F.id; await reload(0); if (id != null) T = S.co[id]; if (fid != null) F = S.co[fid]; return 'full restore day ' + S.day + (T ? ' ' + T.tk + ' eqq ' + (T.eqq || 0).toFixed(2) : '') },
};
const out = [];
for (let ci = 0; ci < CASES.length; ci++) {
  const [seed, days, acts] = CASES[ci];
  Math.random = mulberry(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; T = null; F = null; ST = {};
  let ledDiffDays = 0;
  for (let d = 0; d < days; d++) {
    for (const [day, list] of acts) if (S.day === day) for (const a of list.split(';')) out.push(ci + ' ' + S.day + ' ACT ' + a + ' ' + await ACT[a]());
    step(); if (mdl) G.mk(mdl.o.length - 1);
    out.push(ci + ' ' + S.day + ' ' + hAll());
    out.push(ci + ' ' + S.day + ' LED ' + hLed());
  }
  out.push(ci + ' END rng _R ' + [_R(), _R(), _R()].map(x => x.toFixed(12)).join(',') + ' | wR(1) ' + wR(1)().toFixed(12));
}
console.log(out.join('\n'));
})().catch(e => { console.log('PROBE ERROR ' + (e && e.stack || e)); process.exitCode = 2 });
'''
def build(game, cases):
    code = SEED + stub + '\n' + game + '\n' + 'const CASES=%s;\n' % json.dumps(cases) + PROBE
    f = tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8'); f.write(code); f.close(); return f.name
CASES = [[20261016, 720, []], [777, 720, []], [12345, 720, []],
         [20261016, 400, [[0, 'pick;mine'], [147, 'issue;export']]],
         [20261016, 400, [[0, 'pick;mine;cash'], [147, 'buyback;export']]],
         [20261016, 400, [[0, 'pick;mine'], [147, 'issue;full']]],
         [20261016, 720, [[540, 'pending;export']]],
         [20261016, 400, [[225, 'pending;export']]],
         [12345, 720, [[555, 'pending;export']]],
         [20261016, 400, [[0, 'pick'], [147, 'callloan;export']]],
         [20261016, 400, [[0, 'pick;mine'], [147, 'merge;issue;export']]],
         [20261016, 500, [[0, 'found'], [275, 'cap;export']]],
         [20261016, 300, [[0, 'pick;mine;issue;export']]],
         [20261016, 400, [[0, 'pick;mine'], [147, 'issue;export;issue;full']]],
         [20261016, 400, [[147, 'mergeext'], [250, 'full']]],
         [20261016, 400, [[147, 'mergesister'], [180, 'export']]],
         [777, 400, [[60, 'tenderliq'], [200, 'liq'], [260, 'full']]],
         [12345, 400, [[120, 'lbo'], [150, 'export']]],
         [20261016, 400, [[150, 'offer']]],
         [20261016, 500, [[60, 'matickown']]]]
procs = {}
for tag, game in (('main', game_main), ('branch', game_branch)):
    p = build(game, CASES); procs[tag] = (subprocess.Popen(['node', p], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True), p)
res = {}
for tag, (pr, p) in procs.items():
    o, e = pr.communicate(); os.unlink(p)
    if pr.returncode != 0 or 'PROBE ERROR' in o: print('PROBE FAILED', tag, (o + e)[-1500:]); sys.exit(2)
    res[tag] = o.strip().splitlines()
open(OUT + '/hashes_main.txt', 'w').write('\n'.join(res['main'])); open(OUT + '/hashes_branch.txt', 'w').write('\n'.join(res['branch']))
assert len(res['main']) == len(res['branch']), (len(res['main']), len(res['branch']))
print('main %s game sha256 %s | branch (working tree) game sha256 %s' % (MAIN[:7], hashlib.sha256(game_main.encode()).hexdigest()[:16], hashlib.sha256(game_branch.encode()).hexdigest()[:16]))
bad = 0
for ci, (seed, days, acts) in enumerate(CASES):
    pr = [(a, c) for a, c in zip(res['main'], res['branch']) if a.split()[0] == str(ci)]
    st = [(a, c) for a, c in pr if ' LED ' not in a and ' ACT ' not in a]
    led = [(a, c) for a, c in pr if ' LED ' in a]
    diff = [(a, c) for a, c in st if a != c]
    ledd = [(a, c) for a, c in led if a != c]
    tag = 'seed %d, %d days%s' % (seed, days, ' + ' + ', '.join('%s on day %d' % (k, d) for d, k in acts) if acts else ' (natural, no restore)')
    print('case %d (%s): %s | the four ledger fields differ on %d of %d days%s' % (ci, tag,
          'whole state without eqq/isq/ncq/rlf and the random streams identical on every day (main == branch, %d lines)' % len(st) if not diff else 'DIFFERENT, first at %s | %s' % diff[0],
          len(ledd), len(led), (' (from day ' + ledd[0][0].split()[1] + ')') if ledd else ''))
    bad += bool(diff)
    for a, c in pr:
        if ' ACT ' in a:
            print('   main  : ' + a.split(' ', 1)[1]);
            if c != a: print('   branch: ' + c.split(' ', 1)[1])
print('ALL IDENTICAL' if not bad else '%d case(s) differ' % bad); sys.exit(1 if bad else 0)
