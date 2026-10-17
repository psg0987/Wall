"""RT-BANK-001-R1: is the cash flow fix display-only? Runs the same situations with the game before the fix (src/ of
commit 41d77d2 = 1ec5891, rebuilt from git) and after it (dist/game.js), and compares.
- the TC-BANK-07 bank (write-off 60 reported on day 150) and JYNR (impairment 1823.05 on day 431, seed 12345):
  game values (exact cash change, financing cash flow of the statement, net income, EPS, tax, dividends, woq, llr,
  write-off/impairment records) must be identical; operating cash flow, other and free cash flow may change
- what the 현금흐름 tab shows in the operating section (net income, depreciation, adjustment, operating cash flow)
- 720-day whole-game state for seeds 12345, 777, 20261016 must be identical
usage: python3 build/build.py && python3 verify/rt-bank-001/r1_before_after.py      (exit 1 if a game value differs)"""
import json, os, subprocess, sys, tempfile
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V))
REV = '41d77d2'
show = lambda p: subprocess.run(['git', '-C', R, 'show', REV + ':' + p], capture_output=True, text=True, check=True).stdout
PARTS = ['data.js', 'core.js', 'sim.js', 'act1.js', 'act2.js', 'ui1.js', 'ui2.js']
old = show('src/base_v5.js') + '\n' + '\n'.join(show('src/' + f) for f in PARTS)
new = open(os.path.join(R, 'dist', 'game.js'), encoding='utf-8').read()
SEED = ("Math.random=(()=>{let a=20261016;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);"
        "t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();\n")
PLAY = r"""(() => {
const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const play = (days, stop) => { for (let d = 0; d < days; d++) { step(); if (mdl) G.mk(mdl.o.length - 1); if (stop && stop()) return true } return false };
const out = {};
function tabRows(c) {
  sel = -1; pg = ''; tab = 'h'; S.spd = 0; G.pick(c.id); G.stab('f'); G.fseg(3); render();
  const h = document.getElementById('sh').innerHTML, cell = lab => ([...((h.split('<td>' + lab + '</td>')[1] || '').split('</tr>')[0]).matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m => m[1])[0]);
  return ['순이익', '감가상각(비현금)', '지분법·상각 조정', '영업활동 현금흐름', '설비투자', '잉여현금흐름 FCF', '재무활동 현금흐름', '기타·투자 매매', '현금 증감'].map(k => k + ' ' + cell(k)).join(' | ');
}
function stmt(c) { const L = fqL(c), q = L[L.length - 1], d = fqDerive(c, q, L[L.length - 2]); return { cfo: d.cfo, oth: d.oth, fcf: d.fcf, cff: d.cff, dc: d.dc } }
{ // the TC-BANK-07 bank
  Math.random = mulberry(20261016);
  init(Object.assign(defCfg(), { tut: 0, seed: 12345 })); mdl = null;
  const b = S.co.find(x => x.kd === 1 && !x.dead), c = S.co.filter(x => !x.kd && !x.dead && !mine(x) && x.bk === 0 && !x.priv && x.id !== b.id).find(x => x.id > b.id);
  b.A = 1000; b.cs = 100; b.D = 850; b.gw = 0; if (!b.ba) bankInit(b); b.llr = 10;
  c.ln = b.id; c.bond = 0; c.pa = 0; c.bh = 0; c.A = 150; c.cs = 0; c.gw = 0; c.D = 200; c.bk = 0; c.off = b.off;
  const closes = [], e0 = earn; earn = function (x) { e0(x); if (x === b && b.er && b.er.d === S.day) closes.push({ cs: b.cs, er: Object.assign({}, b.er), eh: b.eh[b.eh.length - 1], woq: b.woq, llr: b.llr }) };
  play(160); earn = e0;
  const r = closes.find(x => x.er.d === 150), p = closes.find(x => x.er.d === 60), s = stmt(b);
  out.bank = { game: { day: r.er.d, cashChangeExact: r.cs - p.cs, financing: s.cff, ni: r.er.ni, eps: r.eh, tax: r.er.tax, dividends: r.er.dv, woq: r.woq, llr: r.llr, wo: r.er.wo },
    statement: { cfo: s.cfo, other: s.oth, fcf: s.fcf }, tab: tabRows(b) };
}
{ // JYNR impairment, seed 12345
  Math.random = mulberry(20261016);
  init(Object.assign(defCfg(), { tut: 0, seed: 12345 })); mdl = null;
  let hit = null; const i0 = impair; impair = function (c, wd) { i0(c, wd); if (!hit) hit = { c, wd } };
  const last = {}, e0 = earn; let rec = null;
  earn = function (x) { e0(x); if (!x.er || x.er.d !== S.day) return; if (hit && hit.c === x && !rec) rec = { cs: x.cs, prev: last[x.id], er: Object.assign({}, x.er), eh: x.eh[x.eh.length - 1] }; last[x.id] = x.cs };
  play(720, () => hit); impair = i0; earn = e0;
  const s = stmt(hit.c);
  out.impair = { game: { company: hit.c.tk, day: rec.er.d, cashChangeExact: rec.cs - rec.prev, financing: s.cff, ni: rec.er.ni, eps: rec.eh, tax: rec.er.tax, dividends: rec.er.dv, imp: rec.er.imp },
    statement: { cfo: s.cfo, other: s.oth, fcf: s.fcf }, tab: tabRows(hit.c) };
}
out.seeds = {};
for (const SEED of [12345, 777, 20261016]) {
  Math.random = mulberry(20261016);
  init(Object.assign(defCfg(), { tut: 0, seed: SEED })); mdl = null; play(720);
  const r = x => Math.round(x * 1e6) / 1e6, live = S.co.filter(c => !c.dead);
  out.seeds[SEED] = require('crypto').createHash('sha256').update(JSON.stringify(live.map(c => [c.tk, r(c.p), r(c.A), r(c.D), r(c.cs), r(c.sh), r(c.ni), r(c.woq || 0), r(c.llr || 0)]))).digest('hex').slice(0, 16);
}
console.log(JSON.stringify(out));
})();"""
stub = open(os.path.join(R, 'tests', 'stub.js'), encoding='utf-8').read()
res = {}
for name, game in [('before', old), ('after', new)]:
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(SEED + stub + '\n' + game + '\n' + PLAY); p = f.name
    o = subprocess.run(['node', p], capture_output=True, text=True); os.unlink(p)
    if o.returncode: print(o.stdout + o.stderr); sys.exit(2)
    res[name] = json.loads(o.stdout.strip().splitlines()[-1])
bad = 0
for case in ['bank', 'impair']:
    b, a = res['before'][case], res['after'][case]
    print('== ' + case)
    for k in b['game']:
        same = b['game'][k] == a['game'][k]; bad += not same
        print('  %-16s before %-22s after %-22s %s' % (k, b['game'][k], a['game'][k], 'same' if same else 'DIFFERENT'))
    for k in b['statement']:
        print('  %-16s before %-22s after %-22s (statement line, may change)' % ('statement ' + k, round(b['statement'][k], 4), round(a['statement'][k], 4)))
    print('  tab before: ' + b['tab']); print('  tab after:  ' + a['tab'])
print('== 720-day whole-game state')
for s in res['before']['seeds']:
    same = res['before']['seeds'][s] == res['after']['seeds'][s]; bad += not same
    print('  seed %-9s before %s after %s %s' % (s, res['before']['seeds'][s], res['after']['seeds'][s], 'same' if same else 'DIFFERENT'))
print('ALL GAME VALUES IDENTICAL' if not bad else str(bad) + ' game value(s) differ'); sys.exit(1 if bad else 0)
