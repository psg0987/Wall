// RT-AUTO-UX-01 independent probe (Claude). Runs on the branch (verify/fin-cf-02-save01/run.py) AND on base main b421980
// (verify/fin-cf-02-save01/run_test_on_rev.py b421980 verify/rt-auto-ux-01/probe.js), so every behaviour change of the patch is shown side by side.
// Sections that need the new functions (G.autoBulk, autoOpsPg) print 'n/a on base'. Each line is 'ok'/'FAIL' on the branch;
// lines marked 'info' only report a value (used to compare base vs branch).
const crypto = require('crypto');
let errs = 0, fails = 0; const ok = (x, m) => { console.log((x ? 'ok   ' : 'FAIL ') + m); if (!x) fails++ }; const info = m => console.log('info ' + m);
const NEW = typeof G.autoBulk === 'function'; console.log('build: ' + (NEW ? 'branch (G.autoBulk present)' : 'base (no G.autoBulk)'));
const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const world = seed => { Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; S.spd = 0; sel = -1; pg = ''; S.apAll = 0 };
const ordin = () => S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i !== HOLD && c.ctl !== 'P' && c.bk === 0);
const take = (c, v = 60) => { setOwn(c, 'P', v); ctlAll(); return mine(c) };
const mkHold = () => { S.cash = Math.max(S.cash, 1e6); G.fdOpen(); FD.sec = HOLD; FD.cap = 300; FD.fo = 'P'; G.fdGo(); mdl = null; pg = ''; const c = S.co[S.co.length - 1]; return c && c.i === HOLD ? c : null };
const adv = n => { for (let d = 0; d < n; d++) { step(); if (S.ev2) { const ev = S.ev2, e = EV2.find(z => z.id === ev.id), c = S.co[ev.c]; S.ev2 = null; mdl = null; if (e && c && !c.dead) { const [k, v] = e.ai(c, ev.x); e.go(c, ev.x, k, v) } } if (mdl) G.mk(mdl.o.length - 1) } };
const CALLS = []; const a0 = autop; autop = function (c) { const x = { id: c.id, r: rating(c), ni: c.ni, A: c.A, cs: c.cs, nol: c.nol, kd: c.kd, i: c.i, dg: S.dg[c.i], cg: S.cg[c.i], ps0: c.ps }; const o = a0(c); x.got = { g: c.g, pay: c.pay, sweep: c.sweep, ps: c.ps }; CALLS.push(x); return o };
function ref(x) { // RISK-06 A4R statement (ordinary) and A2 (bank / insurer), HOLD 0/0/0 — written here, not read from the game
  const { r, ni, A, cs, nol, kd, i, dg, cg, ps0 } = x, roa = ni * 4 / Math.max(1, A), gap = kd ? 0 : dg - cg;
  let s = { g: r >= 4 ? 0 : roa > .1 && r <= 2 && gap > -.01 ? .1 : .04, pay: r >= 4 || nol > A * .05 ? 0 : .3, sweep: r >= 3 ? 2 : 1, ps: kd ? ps0 : (r <= 3 && roa > .06 ? 1 : 0) };
  if (!kd && i !== HOLD) { const tc = A * .06, halt = r >= 4 || (r === 3 && (ni <= 0 || cs < tc * .5 || gap < -.02)) || (ni < 0 && cs < tc);
    s = { g: halt ? 0 : roa > .1 && r <= 2 && gap > -.01 ? .1 : .04, pay: (r >= 4 || ni <= 0 || nol > A * .05 || (r === 3 && cs < tc)) ? 0 : r === 3 ? .15 : .3, sweep: r >= 3 || ni <= 0 ? 2 : 1, ps: r <= 3 && roa > .06 && (r <= 2 || cs >= tc * .5) ? 1 : 0 } }
  if (i === HOLD) s = { ...s, g: 0, ps: 0, pay: 0 }; return s }
const same = (a, b) => a.g === b.g && a.pay === b.pay && a.sweep === b.sweep && a.ps === b.ps;
const hashS = () => crypto.createHash('sha256').update(JSON.stringify(S)).digest('hex').slice(0, 16);

// ---------- P1 pagination (25 per page)
if (NEW) { world(20261026); const pool = ordin(); for (const c of pool.slice(0, 60)) setOwn(c, 'P', 60); ctlAll();
  const all = S.co.filter(mine).sort((a, b) => a.id - b.id).map(c => c.id); pg = 'auto';
  const rowsOf = h => [...h.matchAll(/G\.ap\((\d+)\)/g)].map(m => +m[1]), lab = h => (h.match(/(\d+) \/ (\d+) 페이지/) || []).slice(1).join('/');
  const prevDis = h => /<button class="" onclick="G\.autoPage\(-?\d+\)" disabled>이전/.test(h), nextDis = h => /<button class="" onclick="G\.autoPage\(\d+\)" disabled>다음/.test(h);
  const seen = [], pages = [];
  for (let p = 0; p < 3; p++) { G.autoPage(p); const h = page(); pages.push([rowsOf(h).length, lab(h), prevDis(h), nextDis(h)]); seen.push(...rowsOf(h)) }
  const L3 = all.length - 50; ok(all.length >= 51 && all.length <= 75, 'P1 ' + all.length + ' controlled companies (60 taken directly + those they control indirectly)');
  ok(JSON.stringify(pages) === JSON.stringify([[25, '1/3', true, false], [25, '2/3', false, false], [L3, '3/3', false, true]]), 'P1 pages 25/25/' + L3 + ', labels 1/3 2/3 3/3, 이전 disabled only on 1, 다음 only on 3 ' + JSON.stringify(pages));
  ok(JSON.stringify(seen) === JSON.stringify(all), 'P1 pages list every controlled company once, in id order');
  G.autoPage(99); let h = page(); ok(lab(h) === '3/3' && rowsOf(h).length === L3, 'P1 page 99 clamps to the last page');
  G.autoPage(-5); h = page(); ok(lab(h) === '1/3', 'P1 negative page clamps to 1');
  G.autoPage(2); for (const id of all.slice(20)) setOwn(S.co[id], 'P', 0); ctlAll(); const left = S.co.filter(mine).length; h = page(); ok(lab(h) === '1/1' && rowsOf(h).length === left && left <= 25, 'P1 after giving up the companies of pages 2-3 while on page 3, the page clamps to 1/1 with ' + left + ' rows');
  ok(!/NaN|undefined/.test(h), 'P1 no NaN/undefined in the page');
  G.autoPage(0); for (const c of S.co) if (c.own.P) setOwn(c, 'P', 0); ctlAll(); h = page(); ok(/아직 지배하는 회사가 없습니다/.test(h) && /disabled>전체 ON/.test(h), 'P1 zero companies: empty message, bulk buttons disabled');
} else info('P1 n/a on base');

// ---------- P2 bulk ON on ordinary + bank + insurer + HOLD: each decision = its existing rule; OFF keeps the parameters
{ world(20261016); const o = ordin()[2], b = S.co.find(c => !c.dead && c.kd === 1 && !c.priv), n = S.co.find(c => !c.dead && c.kd === 2 && !c.priv);
  take(o); take(b); take(n); const h = mkHold(); info('P2 founded HOLD ' + (h && mine(h)) + ' ap after founding ' + (h && h.ap));
  if (NEW) { for (const c of S.co.filter(mine)) { c.ap = 0 } CALLS.length = 0; G.autoBulk(1);
    const set = S.co.filter(mine); ok(set.every(c => c.ap === 1) && CALLS.length === set.length, 'P2 bulk ON: ' + set.length + ' controlled (ordinary, bank, insurer, HOLD) ON, one autop each');
    ok(CALLS.every(x => same(x.got, ref(x))), 'P2 every bulk decision equals the existing rule (A4R ordinary, A2 bank/insurer, HOLD 0/0/0) ' + CALLS.map(x => (x.kd ? 'kd' + x.kd : x.i === HOLD ? 'HOLD' : 'ord') + JSON.stringify(x.got)).join(' '));
    const snap = JSON.stringify(set.map(c => [c.g, c.pay, c.sweep, c.ps])); G.autoBulk(0); ok(set.every(c => c.ap === 0) && JSON.stringify(set.map(c => [c.g, c.pay, c.sweep, c.ps])) === snap && CALLS.length === set.length, 'P2 bulk OFF: all OFF, parameters unchanged, no autop');
    // bulk touches only controlled companies
    const notMine = S.co.filter(c => !c.dead && !mine(c) && c.ap); ok(notMine.length === 0, 'P2 no uncontrolled company has ap set');
  } else info('P2 bulk n/a on base');
}

// ---------- P3 manual OFF protection: apAll on, OFF company stays OFF through ctlAll and 200 days; no autop for it
{ world(20261016); S.apAll = 1; const x = ordin()[3]; take(x); x.ap = 0; CALLS.length = 0; ctlAll(); ctlAll(); adv(200);
  ok(mine(x) ? x.ap === 0 && !CALLS.some(z => z.id === x.id) : true, 'P3 apAll ON, manually OFF company (still controlled: ' + mine(x) + ') stays OFF through ctlAll and 200 days, no autop call for it'); }

// ---------- P4 lose control and regain
for (const all of [0, 1]) { world(20261016); S.apAll = all; const x = ordin()[4]; take(x); x.ap = 0; setOwn(x, 'P', 0); ctlAll(); const lost = !mine(x); CALLS.length = 0;
  take(x); info(`P4 apAll=${all} manual OFF, lost (${lost}) and regained via setOwn+ctlAll: ap=${x.ap} autop calls=${CALLS.length}`);
  world(20261016); S.apAll = all; const y = ordin()[4]; take(y); y.ap = 1; setOwn(y, 'P', 0); ctlAll(); CALLS.length = 0; take(y); info(`P4 apAll=${all} flag ON kept while not controlled, regained: ap=${y.ap} autop calls=${CALLS.length}`);
  // the player's own buy (G.buy -> afterCtl)
  world(20261016); S.apAll = all; S.cash = 1e7; const z = ordin().filter(c => pub(c) > 70)[0]; z.ap = 0; CALLS.length = 0; G.buy(z.id, 60); info(`P4 apAll=${all} G.buy 60% of ${z.tk}: mine=${mine(z)} ap=${z.ap} autop calls=${CALLS.length}`) }

// ---------- P5 founding (G.fdGo) with the founder's preset
for (const all of [0, 1]) { world(20261016); S.apAll = all; S.cash = 1e6; CALLS.length = 0; G.fdOpen(); FD.sec = ordin()[0].i; FD.cap = 300; FD.fo = 'P'; FD.pre = 0; G.fdGo(); mdl = null; pg = '';
  const c = S.co[S.co.length - 1]; info(`P5 apAll=${all} founded ${SEC[c.i][0]} preset 0 (growth .2, R&D 2): ap=${c.ap} g=${c.g} ps=${c.ps} pay=${c.pay} autop calls=${CALLS.length}`) }

// ---------- P6 control gained without a player action: P holds 1 point less than the largest holder (another company); it sells; the next step's ctlAll
for (const all of [0, 1]) { world(20261016); S.apAll = all; let x = null, k = null;
  for (const c of ordin()) { const kk = Object.keys(c.own).filter(q => q[0] === 'c' && c.own[q] >= 22).sort((a, b) => c.own[b] - c.own[a])[0]; if (kk) { x = c; k = kk; break } }
  setOwn(x, 'P', x.own[k] - 1); ctlAll(); const before = mine(x); x.ap = 0; CALLS.length = 0; setOwn(x, k, 0); step();
  info(`P6 apAll=${all} P ${x.own.P.toFixed(1)}% behind holder ${k} -> holder sells, next step's ctlAll: was mine ${before}, now mine ${mine(x)} ap=${x.ap} autop calls for it=${CALLS.filter(z => z.id === x.id).length}`) }

// ---------- P7 whole-game state after natural play (compare base vs branch hashes)
{ world(777); adv(360); info('P7a no player control, 360 days: state ' + hashS()) }
{ world(777); const p = ordin().sort((a, b) => b.A - a.A).filter((_, i) => i % 9 === 3).slice(0, 8); p.forEach(c => take(c)); p.forEach(c => G.ap(c.id)); adv(360); info('P7b 8 controlled, 자동 경영 ON at day 0, apAll 0, 360 days: state ' + hashS() + ' autop calls ' + CALLS.length) }
{ world(777); S.apAll = 1; const p = ordin().sort((a, b) => b.A - a.A).filter((_, i) => i % 9 === 3).slice(0, 8); p.forEach(c => take(c)); adv(360); info('P7c 8 controlled with apAll 1 (set before taking control), 360 days: state ' + hashS() + ' ap ' + p.map(c => c.ap).join('')) }
console.log('errs', errs, 'fails', fails);
