// RT-AUTO-RISK-07: the A4R risk-defensive autopilot rule for ordinary companies (autop, src/sim.js).
// A4R is the nonfinancial branch of RT-AUTO-RISK-06's frozen research runner rt_auto_risk06_runner.js (sha256 4093762398e09a12e2ac82d7dd621ea27b3d92818bf469e347b680a87d74ba63,
// __riskPolicy(x,'A4R') else-branch), applied only when c.kd === 0 && c.i !== HOLD, after the existing rule (A2). Banks, insurers and holding companies keep A2.
// The expected values below are an independent transcription of the two rules (A2 = autop of main 8b6ed6e; A4R = the runner branch), evaluated on the
// inputs autop actually saw (rating from the real rating(), ni, A, cs, nol, sector gap), never read back from autop.
// pre: = precondition (ERR FIXTURE INVALID), ok: = computed check (FAIL).
let errs = 0, fails = 0;
(async () => {
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ };
const pre = (c, m) => { console.log((c ? 'pre  ' : 'ERR  FIXTURE INVALID: ') + m); if (!c) errs++ };
const mulb = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const KEYS = ['g', 'pay', 'sweep', 'ps'];
// ---- the two rules (inputs: r, ni, A, cs, nol, gap, kd, hold, ps0 = ps before the call: A2 leaves ps alone for financial companies) ----------------
function A2(x) { const roa = x.ni * 4 / Math.max(1, x.A), o = {};
  o.g = x.r >= 4 ? 0 : roa > .1 && x.r <= 2 && x.gap > -.01 ? .1 : .04; o.pay = x.r >= 4 || x.nol > x.A * .05 ? 0 : .3; o.sweep = x.r >= 3 ? 2 : 1; o.ps = x.kd ? x.ps0 : x.r <= 3 && roa > .06 ? 1 : 0;
  if (x.hold) { o.g = 0; o.ps = 0; o.pay = 0 } return o }
function A4R(x) { const o = A2(x); if (x.kd || x.hold) return o; const r = x.r, roa = x.ni * 4 / Math.max(1, x.A), tc = x.A * .06, gap = x.gap;
  const halt = r >= 4 || (r === 3 && (x.ni <= 0 || x.cs < tc * .5 || gap < -.02)) || (x.ni < 0 && x.cs < tc);
  o.g = halt ? 0 : roa > .1 && r <= 2 && gap > -.01 ? .1 : .04; o.pay = (r >= 4 || x.ni <= 0 || x.nol > x.A * .05 || (r === 3 && x.cs < tc)) ? 0 : r === 3 ? .15 : .3;
  o.sweep = r >= 3 || x.ni <= 0 ? 2 : 1; o.ps = r <= 3 && roa > .06 && (r <= 2 || x.cs >= tc * .5) ? 1 : 0; return o }
const inputs = c => ({ r: rating(c), ni: c.ni, A: c.A, cs: c.cs, nol: c.nol || 0, gap: c.kd ? 0 : S.dg[c.i] - S.cg[c.i], kd: c.kd, hold: c.i === HOLD, ps0: c.ps });
const same = (a, b) => KEYS.every(k => a[k] === b[k]);
const show = o => KEYS.map(k => k + ' ' + o[k]).join(', ');
// every real autop call is checked against the rule for its inputs
const CALLS = [], AUTOP_SRC = autop.toString();   // the autop of the game this test runs on (before the wrapper below)
{ const a0 = autop; autop = function (c) { const x = inputs(c); a0(c); const got = { g: c.g, pay: c.pay, sweep: c.sweep, ps: c.ps }; CALLS.push({ c, x, got, day: S.day }); return undefined } }
function startWorld(seed) { Math.random = mulb(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; sel = -1; pg = ''; CALLS.length = 0 }   // no company selected from an earlier world
// player-company event modals are answered with the event's own management proposal (e.ai), other modals with the last option: no human decision
function stepD() { step(); if (S.ev2) { const ev = S.ev2, e = EV2.find(z => z.id === ev.id), c = S.co[ev.c]; S.ev2 = null; mdl = null; if (e && c && !c.dead) { const [k, v] = e.ai(c, ev.x); e.go(c, ev.x, k, v) } } if (mdl) G.mk(mdl.o.length - 1) }
const mkMine = c => { setOwn(c, 'P', 60); ctlAll(); return mine(c) };
// holding companies exist only when the player founds one (G.fdGo, sector HOLD): found it through the real path
const mkHold = () => { S.cash = Math.max(S.cash, 1e6); G.fdOpen(); FD.sec = HOLD; FD.cap = 300; FD.fo = 'P'; G.fdGo(); const c = S.co[S.co.length - 1]; return c && c.i === HOLD && mine(c) ? c : null };
const lastClose = c => c.fq[c.fq.length - 1][0];
function nextClose(c) { const l0 = lastClose(c); for (let i = 0; i < 200 && !c.dead; i++) { stepD(); if (c.fq && c.fq.length && lastClose(c) !== l0) return true } return false }
console.log('-- harness ready');

// ================================================================================================================================
// G0 source guard: the A4R statements are in autop exactly as in the frozen runner (x. -> c.)
// ================================================================================================================================
console.log('\n-- G0 source of autop');
{ const a = AUTOP_SRC;
  const FROZEN = ['const halt=r>=4||(r===3&&(c.ni<=0||c.cs<tc*.5||gap<-.02))||(c.ni<0&&c.cs<tc);', 'c.g=halt?0:roa>.1&&r<=2&&gap>-.01?.1:.04;',
    'c.pay=(r>=4||c.ni<=0||c.nol>c.A*.05||(r===3&&c.cs<tc))?0:r===3?.15:.3;', 'c.sweep=r>=3||c.ni<=0?2:1;', 'c.ps=r<=3&&roa>.06&&(r<=2||c.cs>=tc*.5)?1:0;'];
  ok(FROZEN.every(s => a.includes(s)) && a.includes('if(!c.kd&&c.i!==HOLD){const tc=c.A*.06;') && !/A4G|\.g=\.04;?\s*}/.test(a.replace(/c\.g=halt\?0:[^;]*;/, '')),
    'G0 autop holds the five frozen A4R statements verbatim, guarded by !c.kd && c.i !== HOLD with tc = 6% of assets, and no A4G growth restore');
  ok(a.indexOf('if(!c.kd&&c.i!==HOLD)') > a.indexOf('c.sweep=r>=3?2:1;') && a.lastIndexOf('if(c.i===HOLD){c.g=0;c.ps=0;c.pay=0}') > a.indexOf('if(!c.kd&&c.i!==HOLD)'), 'G0 order: the existing A2 lines, then A4R, then the holding-company override') }

// ================================================================================================================================
// G1 boundary grid on real company objects: real rating(), every input combination around the thresholds
// ================================================================================================================================
console.log('\n-- G1 boundary grid (rating from the real rating() of a copy of a real company, D set to reach the band)');
{ startWorld(20261016); const base = { 0: S.co.find(c => !c.dead && !c.kd && c.i !== HOLD && !c.priv), 1: S.co.find(c => !c.dead && c.kd === 1), 2: S.co.find(c => !c.dead && c.kd === 2) };
  const hold = mkHold(); pre(base[0] && base[1] && base[2] && hold, 'G1 template companies ' + [base[0], base[1], base[2], hold].map(c => c && c.tk).join(' '));
  const BAND = [.15, .45, .8, 1.3, 2, 3]; let n = 0, badR = 0, bad = [], normal = 0, normalSame = 0, diff = 0;
  for (const [kd, t] of [[0, base[0]], [1, base[1]], [2, base[2]], ['H', hold]]) for (let r = 0; r <= 6; r++) for (const ni of [-50, -1, 0, 1, 20, 40, 80])
    for (const cp of [0, .01, .029, .03, .031, .059, .06, .061, .2]) for (const gp of [-.04, -.021, -.02, -.011, -.01, 0, .02]) for (const nolp of [0, .05, .051]) {
      const c = Object.assign(Object.create(Object.getPrototypeOf(t)), t); c.own = t.own; c.A = 1000; c.gw = 0; c.cs = 1000 * cp; c.ni = ni; c.nol = 1000 * nolp; c.ps = 1;
      const pf = pfv(c), tot = c.A + c.cs + c.gw + pf, k = c.kd ? 9 : 1; c.D = r === 6 ? tot + 10 : BAND[r] * k * tot / (1 + BAND[r] * k);
      const i0 = c.i, d0 = S.dg[i0]; S.dg[i0] = S.cg[i0] + gp;
      const x = inputs(c); if (x.r !== r) { badR++; S.dg[i0] = d0; continue }
      const w2 = A2(x), w4 = A4R(x); autop(c); const got = CALLS.pop().got; S.dg[i0] = d0; n++;
      if (!same(got, w4)) bad.push(`${t.tk} r${r} ni${ni} cash${cp} gap${gp} nol${nolp}: got ${show(got)} want ${show(w4)}`);
      if (kd === 0 && r <= 2 && ni > 0) { normal++; if (same(w2, w4) && same(got, w2)) normalSame++ } if (!same(w2, w4)) diff++ }
  pre(badR === 0 && n > 10000, 'G1 ' + n + ' cases, every intended rating reached by the real rating() (' + badR + ' missed)');
  ok(!bad.length, 'G1 every case: autop = A4R for ordinary companies, = A2 for banks / insurers / holding companies' + (bad.length ? ' | ' + bad.length + ' off, e.g. ' + bad.slice(0, 3).join('; ') : ''));
  ok(normal > 0 && normalSame === normal, 'G1 ordinary companies with r <= 2 and ni > 0: ' + normalSame + ' / ' + normal + ' cases decide exactly as A2 (g, pay, sweep, ps)');
  pre(diff > 1000, 'G1 the rules differ in ' + diff + ' cases (all of them ordinary companies in distress)') }

// ================================================================================================================================
// G2 real engine: natural play with the autopilot on (G.ap: Day-0 activation), every autop call checked; ordinary, financial and holding companies
// ================================================================================================================================
console.log('\n-- G2 natural play, autopilot on through G.ap on day 0, 720 days, every autop call compared with the rule for its inputs');
for (const seed of [20261016, 777]) {
  startWorld(seed); const ord = S.co.filter(c => !c.dead && !c.kd && c.i !== HOLD && !c.priv && c.bk === 0).sort((a, b) => a.A - b.A), pick = [];
  for (let k = 0; k < 10; k++) pick.push(ord[Math.floor(k * (ord.length - 1) / 9)]);
  pick.push(S.co.find(c => !c.dead && c.kd === 1 && !c.priv), S.co.find(c => !c.dead && c.kd === 2 && !c.priv)); pick.forEach(mkMine); pick.push(mkHold());
  pre(pick.every(Boolean) && pick.every(mine), 'G2 seed ' + seed + ': ' + pick.length + ' companies controlled by the player (' + pick.map(c => c.tk).join(' ') + ')');
  const d0 = CALLS.length; for (const c of pick) G.ap(c.id); const day0 = CALLS.slice(d0);
  ok(day0.length === pick.length && pick.every(c => c.ap === 1) && day0.every(k => k.day === 0), 'G2 seed ' + seed + ': G.ap turned the autopilot on and ran autop at once on day 0 for all ' + day0.length);
  for (let d = 0; d < 720; d++) stepD();
  const mineCalls = CALLS.filter(k => pick.includes(k.c)), wrong = mineCalls.filter(k => !same(k.got, (k.x.kd || k.x.hold) ? A2(k.x) : A4R(k.x)));
  const ordC = mineCalls.filter(k => !k.x.kd && !k.x.hold), nrm = ordC.filter(k => k.x.r <= 2 && k.x.ni > 0), def = ordC.filter(k => !same(A2(k.x), A4R(k.x)));
  ok(!wrong.length && mineCalls.length > 50, 'G2 seed ' + seed + ': ' + mineCalls.length + ' autop calls (' + ordC.length + ' ordinary, ' + (mineCalls.length - ordC.length) + ' financial / holding) all decide by their rule' + (wrong.length ? ' | ' + wrong.length + ' wrong, e.g. ' + wrong.slice(0, 2).map(k => k.c.tk + '@' + k.day + ' got ' + show(k.got)).join('; ') : ''));
  ok(nrm.every(k => same(k.got, A2(k.x))), 'G2 seed ' + seed + ': ' + nrm.length + ' normal profitable calls (r <= 2, ni > 0) decide exactly as A2');
  console.log('  info seed ' + seed + ': ordinary calls where A4R and A2 differ (defensive rule acted): ' + def.length + (def.length ? ' e.g. ' + def.slice(0, 3).map(k => k.c.tk + '@' + k.day + ' r' + k.x.r + ' ni ' + k.x.ni.toFixed(1)).join('; ') : '')) }

// ================================================================================================================================
// G3 forced distress with the real rating(): an ordinary company, then the same states on a bank, an insurer, a holding company
// ================================================================================================================================
console.log('\n-- G3 distress states made on real companies (debt raised to reach the rating), autopilot switched on');
{ startWorld(20261016); const P = S.co.find(c => !c.dead && !c.kd && c.i !== HOLD && !c.priv && c.bk === 0 && c.A > 3000), B = S.co.find(c => !c.dead && c.kd === 1 && !c.priv),
    I = S.co.find(c => !c.dead && c.kd === 2 && !c.priv), H = mkHold();
  pre([P, B, I].every(c => c && mkMine(c)) && H, 'G3 controlled: ' + [P, B, I, H].map(c => c && c.tk).join(' '));
  const setR = (c, r) => { const k = c.kd ? 9 : 1, tot = c.A + c.cs + c.gw + pfv(c), BAND = [.15, .45, .8, 1.3, 2, 3]; c.D = r === 6 ? tot + 10 : BAND[r] * k * tot / (1 + BAND[r] * k) };
  const CASES = [['loss, cash short (halt)', 2, -10, .02], ['rating 3, profitable, cash fine', 3, 20, .1], ['rating 3, profitable, cash short', 3, 20, .02], ['rating 4', 4, 20, .1], ['insolvent (rating 6)', 6, -30, .01], ['normal', 1, 40, .1]];
  for (const c of [P, B, I, H]) for (const [lab, r, ni, cp] of CASES) {
    c.ap = 0; c.ni = ni * c.A / 1000; c.cs = c.A * cp; c.nol = 0; setR(c, r); const x = inputs(c); if (x.r !== r) { pre(false, 'G3 ' + c.tk + ' ' + lab + ': rating ' + x.r + ' want ' + r); continue }
    G.ap(c.id); const k = CALLS[CALLS.length - 1], want = (c.kd || c.i === HOLD) ? A2(x) : A4R(x), a2 = A2(x);
    ok(k && k.c === c && same(k.got, want), 'G3 ' + c.tk + ' (kd ' + c.kd + (c.i === HOLD ? ', HOLD' : '') + ') ' + lab + ': ' + show(k.got) + (c.kd || c.i === HOLD ? ' = A2' : ' = A4R' + (same(a2, want) ? ' (= A2 here)' : ' (A2 would give ' + show(a2) + ')')));
    G.ap(c.id) } }

// ================================================================================================================================
// G4 ON / OFF and manual management: off keeps manual values through the close; on applies the rule at the close
// ================================================================================================================================
console.log('\n-- G4 autopilot ON / OFF and manual settings');
{ startWorld(20261016); const c = S.co.find(x => !x.dead && !x.kd && x.i !== HOLD && !x.priv && x.bk === 0 && x.A > 3000), o = S.co.find(x => !x.dead && !x.kd && x.i !== HOLD && !x.priv && x !== c && !mine(x));
  pre(c && mkMine(c) && o && !mine(o), 'G4 controlled ' + (c && c.tk) + ', not controlled ' + (o && o.tk));
  const n0 = CALLS.length; G.ap(o.id); ok(!o.ap && CALLS.length === n0, 'G4 G.ap on a company the player does not control does nothing (ap ' + o.ap + ')');
  G.ap(c.id); ok(c.ap === 1 && CALLS.length === n0 + 1, 'G4 ON: ap 1 and autop ran at once'); G.ap(c.id); ok(c.ap === 0, 'G4 OFF: ap 0');
  G.mg(c.id, 'pay', .5); G.mg(c.id, 'g', .07); const n1 = CALLS.length; nextClose(c);
  ok(c.pay === .5 && c.g === .07 && !CALLS.slice(n1).some(k => k.c === c), 'G4 OFF through a close: manual pay ' + c.pay + ' and g ' + c.g + ' kept, autop not called');
  G.ap(c.id); const n2 = CALLS.length; nextClose(c); const ks = CALLS.slice(n2).filter(k => k.c === c);
  ok(ks.length === 1 && same(ks[0].got, A4R(ks[0].x)) && c.pay === ks[0].got.pay, 'G4 ON through a close: autop called once by earn, decided by A4R (' + (ks[0] && show(ks[0].got)) + ')') }

// ================================================================================================================================
// G5 saves: full and export restore keep ap; the next close decides by A4R; an old version-8 save loads and closes with the autopilot on
// ================================================================================================================================
console.log('\n-- G5 save compatibility');
for (const strip of [0, 1]) { startWorld(20261016); const c = S.co.find(x => !x.dead && !x.kd && x.i !== HOLD && !x.priv && x.bk === 0 && x.A > 3000); mkMine(c); G.ap(c.id); const id = c.id;
  const txt = await packS(strip), s = await loadStr(txt); S = s; v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null; const C = S.co[id];
  ok(C.ap === 1 && mine(C) && !/\b(a4r|A4R|risk)\b/i.test(Object.keys(C).join(' ')), (strip ? 'G5 export' : 'G5 full') + ' save: ap kept (' + C.ap + '), no new save field');
  const n = CALLS.length; nextClose(C); const ks = CALLS.slice(n).filter(k => k.c === C);
  ok(ks.length === 1 && same(ks[0].got, A4R(ks[0].x)), (strip ? 'G5 export' : 'G5 full') + ' save: the next close decides by A4R (' + (ks[0] && show(ks[0].got)) + ')') }
{ const fs = require('fs'), path = require('path'); const s = migrate(JSON.parse(fs.readFileSync(path.join(process.env.TESTS_DIR, 'fixtures', 'save8.json'), 'utf8'))); S = s; v8fix(); mdl = null;
  const c = S.co.find(x => !x.dead && !x.kd && x.i !== HOLD && !x.priv && x.bk === 0 && x.fq && x.fq.length); pre(!!c && mkMine(c), 'G5 old save (save8.json, version ' + S.v + ' after migrate): controlled ' + (c && c.tk));
  G.ap(c.id); const n = CALLS.length; nextClose(c); const ks = CALLS.slice(n).filter(k => k.c === c);
  ok(ks.length === 1 && same(ks[0].got, A4R(ks[0].x)) && KEYS.every(k => Number.isFinite(c[k])), 'G5 old save: a close with the autopilot on decides by A4R, values finite (' + (ks[0] && show(ks[0].got)) + ')') }

// ================================================================================================================================
// G6 chapter 11: an autopilot company pushed into insolvency goes through chapter 11 as before; A4R then defends
// ================================================================================================================================
console.log('\n-- G6 chapter 11 with the autopilot on');
{ startWorld(20261016); const c = S.co.find(x => !x.dead && !x.kd && x.i !== HOLD && !x.priv && x.bk === 0 && x.A > 3000); mkMine(c); G.ap(c.id);
  let ch = 0; { const x0 = ch11x; ch11x = function (z, w) { if (z === c) ch++; return x0(z, w) } }
  nextClose(c); for (let i = 0; i < 80; i++) stepD(); c.D = (c.A + c.cs + c.gw + pfv(c)) * 1.5; const n = CALLS.length; nextClose(c);
  const ks = CALLS.slice(n).filter(k => k.c === c);
  ok(ch === 1 && !c.dead && c.bk === 1 && KEYS.every(k => Number.isFinite(c[k])), 'G6 insolvent at the close: chapter 11 ran once (bk ' + c.bk + ', dead ' + !!c.dead + ')');
  ok(ks.length === 1 && ks[0].x.r === 6 && same(ks[0].got, A4R(ks[0].x)) && ks[0].got.g === 0 && ks[0].got.pay === 0 && ks[0].got.sweep === 2, 'G6 the autopilot decided before chapter 11 by A4R on rating 6: ' + (ks[0] && show(ks[0].got)));
  const n2 = CALLS.length; nextClose(c); const k2 = CALLS.slice(n2).filter(k => k.c === c);
  // ch11x wipes every stake (setOwn(c, k, 0)), so the player loses control and earn's `c.ap && mine(c)` no longer calls autop (existing rule, unchanged)
  ok(!(c.own.P > 0) && !mine(c) && k2.length === 0, 'G6 the close after chapter 11: player stake ' + (c.own.P || 0) + ', control lost, autop not called (' + k2.length + ' calls)') }

console.log('\nerrs', errs, 'fails', fails);
})().catch(e => { console.log('ERR exception ' + (e && e.stack || e)); console.log('errs', 1, 'fails', 0) });
