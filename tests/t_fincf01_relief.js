// FIN-CF-01 (policy C, approved 2026-10-20): the 현금흐름 tab must not show the non-cash debt cut of a chapter 11 as cash repaid.
//
// THE DEFECT (src/ui1.js fqDerive, on main f4a825d): the statement takes 차입 증감 / 재무활동 = dD - dv + iss with dD = the change of the
// recorded debt between two quarter rows. ch11x (src/sim.js) sets the debt of a company that enters chapter 11 to
// max(0, assets + cash + goodwill + stakes - 15% of assets) without any cash moving, so the cut showed up as repaid debt, and the other line
// (oth = dc - cfo + capex - cff, the plug) absorbed the same amount with the opposite sign.
//
// THE CHANGE: ch11x keeps R = debt before - debt after (signed) in c.ncq; earn() confirms it as c.rlf = {d, R} right before the quarter
// record is pushed (and zeroes ncq); fqDerive applies R only to the row whose date is exactly rlf.d: cff = dD + R - dv + iss, so
// 차입 증감 = dD + R and oth loses the R it used to absorb. The 24-number fq record, RNG and the economy are untouched.
// A save from before the ledger has no R: it is never estimated. A quarter that may hold an unrecorded relief is shown '미확인'
// (d.unk) in 차입 증감 / 재무활동 / 기타 only, with a footnote saying why and what that cannot tell.
//
// WHERE THE EXPECTED VALUES COME FROM (nothing is copied from a run): a ledger kept outside the game's own statement code.
//  - R of every relief = debt before minus debt after, read around ch11x (hook below), unrounded.
//  - the cash actually raised or repaid by borrowing, a share issue, asset sales and cash spending is injected by this script or
//    read from traps on c.cs / c.D / c.sh that record the call stack of every write (fsAdd / fsTick = asset-market trades = real
//    investing cash; callLoan = real repayment; ch11x = the non-cash relief).
//  - expected cash financing   cffReal = dD(true, unrounded) + R - dividend + cash raised by the share issue
//  - expected other cash line  othClean = dc(true) - (cfo - capex)(independent from the quarter's own pieces) - cffReal,
//    cross-checked by the closure  othClean = asset-market cash - cash spent.
// Tolerance TOL 3.5: the statement works from the rounded quarter records (r1: whole numbers from 10 up, one decimal below), and up to
// seven rounded numbers meet in one comparison; every relief tested is far bigger (R > 100) so a miss of R is not hidden by it.
// The SPEC (specCF) states the new rule on the recorded rows and must agree with fqDerive exactly (1e-9) for every row of every case.
//
// SYNTHETIC vs NATURAL: F1-F6, F2b, the negative/outside-earn/same-day cases and the save cases inject events into a real simulated
// company (labelled 'SYNTHETIC'); TC-CF01-N is a natural run (seed 12345, no player action, nothing injected).
// Not in scope (must stay as on main): er.cap / FIN-EQ-01 (asserted unchanged below), FIN-CF-02 (share issue valued at the close price),
// FIN-CF-03 (bank/insurer deposits, mergers), R2, R3-C, R4-C.
let errs = 0, fails = 0;
(async () => {   // own scope: the game already has globals such as A and B
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ };
const pre = (c, m) => { console.log((c ? 'pre  ' : 'ERR  FIXTURE INVALID: ') + m); if (!c) errs++ };
const info = m => console.log('info ' + m);
const TOL = 3.5;
const near = (a, b, t) => Math.abs(a - b) <= (t == null ? TOL : t);
const f1 = x => x == null ? 'n/a' : (+x).toFixed(1), f2 = x => x == null ? 'n/a' : (Math.abs(x) < 1e-9 ? 0 : +x).toFixed(2);
const mulb = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
const names = e => e.stack.split('\n').slice(2, 10).map(l => (l.match(/at (?:Object\.)?([\w$.]+)/) || [])[1]).filter(Boolean);
const has = (st, ...n) => n.some(x => st.includes(x));
const NOTE_RLF = '└ 법정관리 부채 감면(비현금, 위 차입·재무활동에서 뺌)';

// ---- the ledger: hooks around ch11x and earn (they only observe; the game code runs unchanged) -----------------------------------------
const LED = { ch11: [], closes: {}, cur: null, pre: {}, post: {}, err: 0 };
let hooked = 0;
function hook() {
  if (hooked) return; hooked = 1;
  const x0 = ch11x, e0 = earn;
  ch11x = function (c, why) {
    const D0 = c.D, A0 = c.A, cs0 = c.cs, bk0 = c.bk, idx = (LED.closes[c.id] || []).length;
    x0(c, why);
    const rec = { id: c.id, tk: c.tk, day: S.day, why, bk0, inEarn: LED.cur === c.id, idx };
    if (c.dead) rec.killed = 1; else Object.assign(rec, { R: D0 - c.D, sale: c.cs - cs0, dA: c.A - A0, D0, D1: c.D });
    LED.ch11.push(rec);
  };
  earn = function (c) {
    const was = LED.cur; LED.cur = c.id; const hp = LED.pre[c.id]; if (hp) hp(c);
    const last0 = c.fq && c.fq[c.fq.length - 1], pre2 = { A: c.A, D: c.D, cs: c.cs, g: c.g };
    const r = e0(c); LED.cur = was;
    if (!c.dead && c.fq && c.fq[c.fq.length - 1] !== last0) {
      (LED.closes[c.id] = LED.closes[c.id] || []).push({ d: Math.round(S.day) });
      const hq = LED.post[c.id]; if (hq) hq(c, { post: snap(c), er: c.er ? Object.assign({}, c.er) : null, day: S.day, gr: pre2.A * pre2.g / 4 });
    }
    return r;
  };
}
const snap = c => ({ D: c.D, cs: c.cs, A: c.A, sh: c.sh, p: c.p, gw: c.gw });
function startWorld(seed) { Math.random = mulb(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; hook(); LED.ch11 = []; LED.closes = {}; LED.pre = {}; LED.post = {}; LED.cur = null }
// a plain public company with a live bank lender whose quarters we can drive
const pickTarget = skip => S.co.find(c => !c.dead && !c.kd && !c.priv && !mine(c) && !c.own.P && c.bk === 0 && c.ln >= 0 && S.co[c.ln] && !S.co[c.ln].dead && S.co[c.ln].kd === 1 && c.A > 3000 && !(skip || []).includes(c.id));
// run until T's next close; hp = called just before earn(T), hq = called right after earn(T) (same day, before the rest of the day)
function nextClose(T, hp, hq) {
  let out = null; LED.pre[T.id] = hp || null;
  LED.post[T.id] = (c, o) => { out = o; if (hq) hq(c, o) };
  try { for (let i = 0; i < 400 && !out && !T.dead; i++) step() } finally { LED.pre[T.id] = null; LED.post[T.id] = null }
  return out;
}
// cash-attribution traps: record the call stack of every write to cs / D / sh of T
function trapOn(T, log) {
  const v = {}; for (const k of ['cs', 'D', 'sh']) { v[k] = T[k]; Object.defineProperty(T, k, { configurable: true, enumerable: true, get() { return v[k] }, set(x) { const o = v[k]; v[k] = x; if (Math.abs(x - o) > 1e-12) log.push({ k, d: x - o, st: names(new Error()) }) } }) }
  return () => { for (const k of ['cs', 'D', 'sh']) Object.defineProperty(T, k, { configurable: true, enumerable: true, writable: true, value: v[k] }) };
}
// ---- the SPEC of the new rule, on recorded rows (independent of fqDerive) -------------------------------------------------------------
// the share-issue piece (FIN-CF-02, approved 2026-10-23, written here from the design, independent of fqDerive): a quarter whose previous row is
// after the company's issue-ledger start (c.isd) takes the recorded cash c.isq[row day] (splits and stock-merger shares add nothing); an older quarter whose
// share count changed keeps the old estimate (share-count change x close price) and is an estimate (est, shown with ≈); an older quarter whose share count
// did not change takes the recorded amount or 0. Until FIN-CF-02 this SPEC used 'share-count change x close price' for every row, i.e. it copied that defect.
const issRule = (c, q, p) => { const led = c.isd != null && p.d > c.isd, dsh = q.sh !== p.sh; return led || !dsh ? { iss: (c.isq && c.isq[q.d]) || 0, est: false } : { iss: (q.sh - p.sh) * q.p / 1e4, est: true } };
const specCF = (c, q, p, R) => { const fin = c.kd, dep = fin ? 0 : q.A * .02, cfo = q.ni - q.eq + q.ga + dep + (q.imp || 0) + (q.wo || 0), capex = fin ? 0 : q.gr + dep, dD = q.D - p.D,
  ir = issRule(c, q, p), iss = ir.iss, dc = q.cs - p.cs,
  // FIN-CF-03B: a bank's / insurer's growth gr (row value, no cash) is out of 차입 증감 when the row is fully recorded (FIN-CF-03A acd) and the previous row is a real close
  ncG = fin && (c.acd == null || p.d > c.acd) && p.d > 0 && Number.isFinite(q.gr) ? q.gr : 0, cff = dD + R - ncG - q.dv + iss;
  return { cfo, capex, dD, iss, est: ir.est, cff, dc, oth: dc - cfo + capex - cff, borrow: dD + R - ncG, ncG } };
// R that belongs to each visible row, from the ledger: the relief with idx k happened while the company had closed k times, so it belongs to the (k+1)th close
function ledgerR(T) { const cl = LED.closes[T.id] || [], map = {}; for (const r of LED.ch11) if (r.id === T.id && !r.killed) { const row = cl[r.idx]; if (row) map[row.d] = (map[row.d] || 0) + r.R } return map }
function rowCheck(T, label) {
  const L = fqL(T), map = ledgerR(T); let bad = [], n = 0;
  for (let j = 1; j < L.length; j++) {
    const q = L[j], p = L[j - 1], d = fqDerive(T, q, p), R = map[q.d] || 0, s = specCF(T, q, p, R); n++;
    for (const k of ['cfo', 'capex', 'cff', 'dc', 'oth']) if (!(Math.abs(d[k] - s[k]) <= 1e-9 * Math.max(1, Math.abs(s[k])))) bad.push(qLab(q.d) + ' ' + k + ' game ' + f2(d[k]) + ' spec ' + f2(s[k]));
    if (Math.abs(d.cff + q.dv - d.iss - s.borrow) > 1e-9 * Math.max(1, Math.abs(s.borrow))) bad.push(qLab(q.d) + ' 차입 증감 game ' + f2(d.cff + q.dv - d.iss) + ' spec ' + f2(s.borrow));
    if (Math.abs(d.nc - R) > 1e-9) bad.push(qLab(q.d) + ' nc game ' + f2(d.nc) + ' ledger R ' + f2(R));
    if (Math.abs(d.iss - s.iss) > 1e-9 || d.est !== s.est) bad.push(qLab(q.d) + ' 증자·출자 game ' + f2(d.iss) + (d.est ? ' (est)' : '') + ' spec ' + f2(s.iss) + (s.est ? ' (est)' : ''));
  }
  ok(!bad.length, label + ': every visible quarter row (' + n + ') = the SPEC with the ledger R (cff = dD + R - dv + iss; cfo, capex, dc unchanged; iss by the FIN-CF-02 rule)' + (bad.length ? ' | ' + bad.slice(0, 4).join('; ') : ''));
}
// the 현금흐름 tab as rendered
function cfTab(c) {
  sel = -1; pg = ''; tab = 'h'; S.spd = 0; G.pick(c.id); G.stab('f'); G.fseg(3); render();
  const h = document.getElementById('sh').innerHTML, row = lab => { const part = h.split('<td>' + lab + '</td>')[1]; return part == null ? null : [...part.split('</tr>')[0].matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m => m[1]) };
  return { h, clean: !/NaN|undefined|Infinity|\[object/.test(h), row, text: h.replace(/<[^>]*>/g, '') };   // the stub's textContent is always '': the text is taken from the HTML (until FIN-CF-02 two checks read '' here)
}
const cols = c => fqL(c).slice().reverse();     // newest first, the order of the tab's columns
console.log('-- harness ready');

// ================================================================================================================================
// quarter-by-quarter ledger driver (SYNTHETIC events injected by the case; the company is a real simulated one, seed 20261016)
// ================================================================================================================================
const SEED = 20261016;
let nCase = 0;
function runSeq(label, quarters, seed) {
  startWorld(seed || SEED); const T = pickTarget();
  pre(!!T, label + ': target ' + (T && T.tk) + ' (kd ' + (T && T.kd) + ') lender ' + (T && S.co[T.ln].tk) + ' A ' + f1(T && T.A) + ' D ' + f1(T && T.D) + ' cs ' + f1(T && T.cs) + ' bk ' + (T && T.bk));
  nextClose(T); nextClose(T); const res = [];
  for (const q of quarters) {
    const S0 = snap(T), L0 = LED.ch11.length, log = [], untrap = trapOn(T, log); let out = null, ev = {};
    try {
      ev = q.start ? (q.start(T) || {}) : {};
      out = nextClose(T, q.pre ? c => q.pre(c, ev) : null, q.after ? (c, o) => { q.after(T, ev, o) } : null);
    } finally { untrap() }
    if (!out || T.dead) { res.push({ dead: 1, name: q.name }); console.log('  (' + q.name + ': company gone, dead=' + T.dead + ')'); if (q.afterDead) q.afterDead(T, ev); continue }
    const rel = LED.ch11.slice(L0).filter(x => x.id === T.id && !x.killed), R = rel.reduce((a, x) => a + x.R, 0);
    const inv = log.filter(l => l.k === 'cs' && has(l.st, 'fsAdd', 'fsTick')).reduce((a, l) => a + l.d, 0);
    const paidLoan = log.filter(l => l.k === 'D' && has(l.st, 'callLoan') && !has(l.st, 'ch11x')).reduce((a, l) => a + l.d, 0);
    const Bnet = ev.Bnet || 0, issCash = ev.issCash || 0, spent = ev.spent || 0;
    const shW = log.filter(l => l.k === 'sh'), splitOnly = shW.length > 0 && shW.every(l => has(l.st, 'splitDo'));
    pre(!shW.length || splitOnly || ev.issCash != null, q.name + ': every share-count change in the quarter is known (' + shW.length + ' write(s): ' + (shW.length ? (splitOnly ? 'splits only' : 'an injected real share issue') : 'none') + ')');
    const L = fqL(T), Q = L[L.length - 1], P = L[L.length - 2], d = fqDerive(T, Q, P), er = out.er;
    const dD = out.post.D - S0.D, dc = out.post.cs - S0.cs, dv = er.dv, imp = er.imp || 0, wo = er.wo || 0;
    const cffReal = dD + R - dv + issCash, cm = er.ni - er.eq + er.ga + imp + wo - out.gr, othClean = dc - cm - cffReal;
    const r = { name: q.name, R, rel, inv, spent, Bnet, issCash, dD, dc, dv, cffReal, othClean, cffG: d.cff, othG: d.oth, dcG: d.dc, ncG: d.nc, iss: d.iss, capEr: er.cap, closure: othClean - (inv - spent), day: out.day, paidLoan, d, Q, P };
    res.push(r);
    console.log('  --- ' + q.name + ' (close day ' + out.day + ', ' + (rel.length ? 'relief inside ' + (rel[0].inEarn ? 'earn()' : 'callLoan/ch11, outside earn()') : 'no relief') + ')');
    console.log('  ledger : relief R ' + f2(R) + ' | asset-market cash ' + f2(inv) + ' | injected borrow ' + f2(Bnet) + ' | injected issue cash ' + f2(issCash) + ' | injected spending ' + f2(spent) + ' | loan-call repayment ' + f2(-paidLoan) + ' | dividend ' + f2(dv));
    console.log('  true   : dD ' + f2(dD) + ' | dc ' + f2(dc) + ' | cfo-capex(indep.) ' + f2(cm) + ' | cff(real cash) ' + f2(cffReal) + ' | oth(clean) ' + f2(othClean));
    console.log('  game   : cff ' + f2(d.cff) + ' | oth ' + f2(d.oth) + ' | 차입 증감 ' + f2(d.cff + Q.dv - d.iss) + ' | nc ' + f2(d.nc) + ' | rlf ' + JSON.stringify(T.rlf) + ' | ncq ' + T.ncq);
    if (splitOnly && ev.issCash == null) ok(d.iss === 0 && Q.sh !== P.sh && !d.est, q.name + ': the share count changed only by a split (' + P.sh + ' -> ' + Q.sh + ', no cash): 증자·출자 ' + f2(d.iss) + ' (the old rule showed ' + f2((Q.sh - P.sh) * Q.p / 1e4) + ')');
    if (q.check) q.check(r, T, rel, ev);
    rowCheck(T, q.name);
  }
  return { T, res };
}
const defic = c => { const X = c.D - c.cs - c.gw - pfv(c); c.A = 0.7 * X / 1.25 / (1 + c.g / 4) };   // non-cash asset write-down so that earn()'s own equity test trips (chapter 11 inside earn)
const noRelief = (r, T, lab) => { ok(r.rel.length === 0 && r.ncG === 0 && T.ncq === 0, lab + ': no relief, nothing pending (nc ' + r.ncG + ', ncq ' + T.ncq + ')') };
const cashOk = (r, lab) => { ok(near(r.cffG, r.cffReal) && near(r.othG, r.othClean), lab + ': cff ' + f1(r.cffG) + ' vs expected ' + f1(r.cffReal) + ' (err ' + f2(r.cffG - r.cffReal) + '); other ' + f1(r.othG) + ' vs expected ' + f1(r.othClean) + ' (err ' + f2(r.othG - r.othClean) + ')') };

// ---- F1 ordinary borrowing and repayment (SYNTHETIC) --------------------------------------------------------------------------------
console.log('\n-- TC-CF01-F1 ordinary borrowing then repayment: nothing changes (no relief, no ledger entry)');
const F1 = runSeq('F1', [
  { name: 'F1a borrow 300 in the quarter', start: c => { c.D += 300; c.cs += 300; return { Bnet: 300 } }, check: (r, T) => { noRelief(r, T, 'F1a'); cashOk(r, 'F1a'); ok(T.rlf == null, 'F1a no rlf record exists (' + JSON.stringify(T.rlf) + ')'); ok(near(r.cffG, r.dD - r.dv + r.iss), 'F1a cff = dD - dividend + issue (dD ' + f2(r.dD) + '): the old formula is kept when there is no relief') } },
  { name: 'F1b repay 120 in the next quarter', start: c => { const x = Math.min(120, c.cs * .5); c.D -= x; c.cs -= x; return { Bnet: -x } }, check: (r, T) => { noRelief(r, T, 'F1b'); cashOk(r, 'F1b') } }]);

// ---- F2 relief only, inside earn() ---------------------------------------------------------------------------------------------------
console.log('\n-- TC-CF01-F2 chapter-11 relief only, inside earn() (SYNTHETIC: a non-cash asset write-down makes earn()\'s own equity test trip)');
let F2;
{
  F2 = runSeq('F2', [{ name: 'F2 relief quarter', pre: defic, check: (r, T, rel) => {
    ok(rel.length === 1 && rel[0].inEarn, 'F2 exactly one relief, inside earn() (' + rel.length + ')'); if (rel.length !== 1) return;
    ok(r.R > 100, 'F2 relief R = ' + f2(r.R) + ' (non-cash; the forced asset sale cash ' + f2(rel[0].sale) + ' is a separate investing inflow)');
    ok(T.rlf && T.rlf.d === r.day && T.rlf.d === r.Q.d && Math.abs(T.rlf.R - r.R) < 1e-9 && T.ncq === 0, 'F2 rlf = {d: ' + (T.rlf && T.rlf.d) + ', R: ' + f2(T.rlf && T.rlf.R) + '} = the close day ' + r.day + ' and the ledger R ' + f2(r.R) + ' exactly; ncq back to ' + T.ncq);
    cashOk(r, 'F2');
    ok(near(r.d.cff - (r.dD - r.dv + r.d.iss), r.R) && near(r.d.cff + r.Q.dv - r.d.iss, r.dD + r.R), 'F2 the row takes R out of the borrowing line: cff = dD + R - dv + iss; 차입 증감 = dD + R = ' + f2(r.d.cff + r.Q.dv - r.d.iss) + ' (dD ' + f2(r.dD) + ' + R ' + f2(r.R) + ')');
    ok(near(r.closure, 0), 'F2 independent cash closure: oth_clean ' + f2(r.othClean) + ' = asset-market cash ' + f2(r.inv) + ' (residual ' + f2(r.closure) + ')');
    const a = -rel[0].dA; ok(near(r.capEr, r.R - .25 * a, .01), 'F2 er.cap is UNCHANGED (FIN-EQ-01 not touched): ' + f2(r.capEr) + ' = R ' + f2(r.R) + ' - 0.25 x forced sale ' + f2(a));
    ok(r.dD < 0 && near(r.dD - r.cffReal, -r.R + r.dv - r.issCash), 'F2 dD ' + f2(r.dD) + ' and the real cash financing ' + f2(r.cffReal) + ' differ by R ' + f2(r.R) + ' (the old statement showed dD)');
  } }]);
}

// ---- F3 relief + cash borrowing in the same quarter ----------------------------------------------------------------------------------
console.log('\n-- TC-CF01-F3 relief and cash borrowing in the same quarter (SYNTHETIC)');
runSeq('F3', [{ name: 'F3', start: c => { c.D += 250; c.cs += 250; return { Bnet: 250 } }, pre: defic, check: (r, T, rel) => {
  ok(rel.length === 1, 'F3 one relief'); if (rel.length !== 1) return; cashOk(r, 'F3'); ok(near(r.closure, 0), 'F3 independent closure residual ' + f2(r.closure));
  ok(Math.abs(T.rlf.R - r.R) < 1e-9, 'F3 rlf.R ' + f2(T.rlf.R) + ' = ledger R ' + f2(r.R));
  info('F3 dD ' + f2(r.dD) + ' = relief -' + f2(r.R) + ' + cash borrowing (netted inside chapter 11, which re-sets D from assets + cash)') } }]);

// ---- F4 relief + regular dividend + share issuance -----------------------------------------------------------------------------------
console.log('\n-- TC-CF01-F4 relief with a regular dividend and a real share issue (the game\'s credit-downgrade event, issue 10%; SYNTHETIC timing)');
// until FIN-CF-02 this case wrote c.sh and c.cs directly (an issue no game path makes) and recorded the close-price mismatch as out of scope; it now uses the
// real transaction function, measures its cash independently (cash - debt around the call) and requires the statement to match it
const EVf = t => EV2.find(e => String(e.go).includes(t));
runSeq('F4', [{ name: 'F4', start: c => { const e = EVf('재무구조 개선'), cs0 = c.cs, D0 = c.D, sh0 = c.sh; e.go(c, e.mk(c), 'iss'); const cash = (c.cs - cs0) - (c.D - D0), dsh = c.sh - sh0; c.pay = .5; c.edge = (c.edge || 0) + .08;
    c.A *= .8; const A2 = c.A * (1 + c.g / 4), Y = 1.25 * A2 + c.gw + pfv(c) - c.D + .1 * c.A; c.D += Y; c.cs += Y; const sp = c.cs; c.cs = 0; return { issCash: cash, dsh, Bnet: Y, spent: sp } },
  check: (r, T, rel, ev) => {
    ok(rel.length === 1, 'F4 one relief'); if (rel.length !== 1) return; ok(r.dv > 1, 'F4 regular dividend paid ' + f2(r.dv));
    pre(ev.dsh > 0 && r.issCash > 1, 'F4 the event issued ' + f2(ev.dsh) + ' shares for ' + f2(r.issCash) + ' (measured around the call)');
    const old = (r.Q.sh - r.P.sh) * r.Q.p / 1e4; info('F4 the old rule (share-count change x close price; chapter 11 reset the price) would show ' + f2(old) + ' (error ' + f2(old - r.issCash) + ')');
    ok(Math.abs(r.iss - r.issCash) <= .01 && !r.d.est, 'F4 증자·출자 ' + f2(r.iss) + ' = the cash really raised ' + f2(r.issCash));
    cashOk(r, 'F4 (relief R ' + f2(r.R) + ' and the issue both accounted)');
    ok(Math.abs(T.rlf.R - r.R) < 1e-9 && near(r.closure, 0), 'F4 rlf.R = ledger R; independent closure residual ' + f2(r.closure)) } }]);

// ---- F5 second relief = delisting; nothing may be left behind -----------------------------------------------------------------------
console.log('\n-- TC-CF01-F5 a second relief is a delisting (SYNTHETIC)');
runSeq('F5', [{ name: 'F5 second relief right after the first (same day, after the close)', pre: defic,
  after: (c, ev, o) => { ev.bk1 = c.bk; ev.rlfAfterFirst = clone(c.rlf); ev.ncq1 = c.ncq; try { ch11(c, 'second relief attempt, same day') } catch (e) { ev.thrown = e && e.message } ev.bk2 = c.bk; ev.dead = c.dead },
  afterDead: (T, ev) => {
    ok(ev.bk1 === 1 && ev.rlfAfterFirst && ev.rlfAfterFirst.R > 100 && ev.ncq1 === 0, 'F5 first relief: bk ' + ev.bk1 + ', rlf ' + JSON.stringify(ev.rlfAfterFirst) + ', ncq ' + ev.ncq1);
    ok(!ev.thrown && ev.bk2 === 2 && ev.dead === 1, 'F5 second attempt: bk ' + ev.bk2 + ' = delisting (dead), no exception' + (ev.thrown ? ' [' + ev.thrown + ']' : ''));
    ok(T.ncq === 0 && !('rlf' in T) && T.fq.length === 0, 'F5 the dead company keeps no relief fields: ncq ' + T.ncq + ', rlf ' + JSON.stringify(T.rlf) + ', fq rows ' + T.fq.length);
    const killed = LED.ch11.filter(x => x.id === T.id && x.killed); ok(killed.length === 1, 'F5 the delisting relief is not a ledger entry (killed: ' + killed.length + ')') } }]);
{
  // pending relief (outside earn) and then the second relief before the close: the delisting must clear ncq
  startWorld(SEED); const T = pickTarget(); nextClose(T); nextClose(T);
  let thrown = null; defic(T); ch11(T, 'test first'); const n1 = T.ncq, R1 = LED.ch11[LED.ch11.length - 1].R;
  pre(T.bk === 1 && n1 > 100 && Math.abs(n1 - R1) < 1e-9, 'F5b first relief outside earn: bk ' + T.bk + ', ncq ' + f2(n1) + ' = ledger R ' + f2(R1));
  try { ch11(T, 'test second') } catch (e) { thrown = e && e.message }
  ok(!thrown && T.dead === 1 && T.ncq === 0 && !('rlf' in T), 'F5b a pending ncq of ' + f2(n1) + ' is cleared by the delisting: dead ' + T.dead + ', ncq ' + T.ncq + ', rlf ' + JSON.stringify(T.rlf) + (thrown ? ' [' + thrown + ']' : ''));
  for (let i = 0; i < 100 && errs === 0; i++) { try { step() } catch (e) { errs++; console.log('ERR  step after delisting threw: ' + (e && e.stack || e)); break } }
  ok(T.dead === 1 && T.ncq === 0 && !('rlf' in T), 'F5b 100 days later nothing reappeared on the dead company (ncq ' + T.ncq + ', rlf ' + JSON.stringify(T.rlf) + ')');
}
{
  // acquisition of a company with a pending relief: absorb -> kill. The acquirer's own fields are not touched.
  startWorld(SEED); const T = pickTarget(); nextClose(T); nextClose(T);
  const ac = S.co.find(x => !x.dead && !x.kd && !x.priv && x !== T && x.i === T.i && x.bk === 0); pre(!!ac, 'F5c acquirer ' + (ac && ac.tk));
  defic(T); ch11(T, 'test pending before acquisition'); const n1 = T.ncq; pre(n1 > 100, 'F5c pending relief ' + f2(n1)); ac.ncq = 7; const rlfA = clone(ac.rlf); let thrown = null;
  try { absorb(ac, T, 0) } catch (e) { thrown = e && e.message }
  ok(!thrown && T.dead === 1 && T.ncq === 0 && !('rlf' in T) && ac.ncq === 7 && JSON.stringify(ac.rlf) === JSON.stringify(rlfA), 'F5c acquired target had ncq ' + f2(n1) + ': after absorb dead ' + T.dead + ', ncq ' + T.ncq + ', rlf ' + JSON.stringify(T.rlf) + '; acquirer ncq ' + ac.ncq + ' (untouched, 7 planted) rlf ' + JSON.stringify(ac.rlf) + (thrown ? ' [' + thrown + ']' : ''));
  for (let i = 0; i < 100; i++) { try { step() } catch (e) { errs++; console.log('ERR  step after acquisition threw: ' + (e && e.stack || e)); break } }
}

// ---- F2b relief through callLoan, outside earn() --------------------------------------------------------------------------------------
console.log('\n-- TC-CF01-F2b relief reached through callLoan (outside earn(); only the player or a rival bank can do this) (SYNTHETIC)');
runSeq('F2b', [{ name: 'F2b', start: c => { const b = S.co[c.ln], sp = c.cs; c.cs = 0; defic(c); const be0 = bkE(c), ncq0 = c.ncq; callLoan(b, c, 1); return { spent: sp, eqJump: bkE(c) - be0, ncqAfter: c.ncq, ncq0, rlfBefore: clone(c.rlf), bk: c.bk } }, check: (r, T, rel, ev) => {
  ok(rel.length === 1 && !rel[0].inEarn, 'F2b relief happened outside earn() (' + rel.length + ')'); if (rel.length !== 1) return;
  ok(ev.ncq0 === 0 && Math.abs(ev.ncqAfter - rel[0].R) < 1e-9 && ev.rlfBefore == null, 'F2b between the call and the close the amount waits in ncq: ' + f2(ev.ncqAfter) + ' = ledger R ' + f2(rel[0].R) + ' (rlf not yet set: ' + JSON.stringify(ev.rlfBefore) + ')');
  ok(Math.abs(T.rlf.R - r.R) < 1e-9 && T.rlf.d === r.Q.d && T.ncq === 0, 'F2b at the close ncq becomes rlf {d ' + T.rlf.d + ', R ' + f2(T.rlf.R) + '} and ncq is ' + T.ncq);
  ok(r.capEr == null, 'F2b er.cap is still ABSENT on this path (' + (r.capEr == null ? 'absent' : f2(r.capEr)) + '): FIN-EQ-01 / the callLoan er.cap omission is deliberately not fixed here');
  cashOk(r, 'F2b (loan-call cash repayment ' + f2(-r.paidLoan) + ' correctly stays in financing)'); ok(near(r.closure, 0), 'F2b closure residual ' + f2(r.closure)) } }]);

// ---- F6 the quarter after a relief --------------------------------------------------------------------------------------------------
console.log('\n-- TC-CF01-F6 relief quarter, then the next quarter');
runSeq('F6', [{ name: 'F6a relief quarter', pre: defic, check: (r, T) => { ok(T.rlf && Math.abs(T.rlf.R - r.R) < 1e-9, 'F6a relief recorded: ' + JSON.stringify(T.rlf)) } },
  { name: 'F6b next quarter (no events)', check: (r, T) => { ok(r.rel.length === 0 && r.ncG === 0 && T.ncq === 0, 'F6b the next quarter has no relief and takes no R (nc ' + r.ncG + ')'); cashOk(r, 'F6b'); ok(T.rlf && T.rlf.d < r.Q.d, 'F6b the old rlf (day ' + (T.rlf && T.rlf.d) + ') stays but matches only its own quarter, not the new day ' + r.Q.d);
    const L = fqL(T), j = L.findIndex(q => q.d === T.rlf.d); ok(j >= 1 && fqDerive(T, L[j], L[j - 1]).nc === T.rlf.R, 'F6b the relief row is still corrected while visible (row ' + j + ', nc ' + f2(j >= 1 ? fqDerive(T, L[j], L[j - 1]).nc : null) + ')') } }]);
console.log('\n-- done with the F cases');
// ================================================================================================================================
// the tab as rendered: every cash-flow cell against the SPEC (independent of fqDerive); the memo row only when a relief is visible
// ================================================================================================================================
// opt.R: {rowDay: R} the relief amounts the tab must take out (from the ledger); opt.unk: row days that must read '미확인'
// the design rule for '미확인' (written from the approved design, independent of fqDerive): the row has a previous row, no recorded relief of its own, the company has a
// chapter-11 history (bk > 0), the previous row lies before the company's ledger started (c.cfd), and the quarter-end equity is about 15% of assets (what the reset leaves behind)
const specUnk = (T, q, p) => !!(p && !(T.rlf && T.rlf.d === q.d) && T.bk > 0 && T.cfd != null && p.d < T.cfd && q.A > 0 && Math.abs(q.A + q.cs + q.gw + q.pv - q.D - .15 * q.A) <= 3);
function uiCheck(T, lab, opt) {
  opt = opt || {}; const Rm = opt.R || {}, t = cfTab(T), L = cols(T), fin = T.kd, bad = [];
  const unkSpec = L.filter((q, j) => specUnk(T, q, L[j + 1])).map(q => q.d), unk = opt.unk || unkSpec;
  if (opt.unk && (opt.unk.length !== unkSpec.length || opt.unk.some(d => !unkSpec.includes(d)))) bad.push('expected unconfirmed rows ' + opt.unk.join(',') + ' but the design rule gives ' + unkSpec.join(','));
  const rowV = n => t.row(n);
  const cellsOf = { b: rowV('차입 증감'), f: rowV('재무활동 현금흐름'), o: rowV('기타·투자 매매'), dc: rowV('현금 증감'), cfo: rowV('영업활동 현금흐름'), fcf: rowV('잉여현금흐름 FCF'), cap: rowV('설비투자') };
  for (const k in cellsOf) if (!cellsOf[k] || cellsOf[k].length !== L.length) bad.push('row ' + k + ' has ' + (cellsOf[k] && cellsOf[k].length) + ' cells for ' + L.length + ' quarters');
  if (!bad.length) L.forEach((q, j) => {
    const p = L[j + 1], lb = qLab(q.d), u = unk.includes(q.d);
    if (!p) { for (const k of ['b', 'f', 'o', 'dc']) if (cellsOf[k][j] !== '–') bad.push(lb + ' oldest quarter ' + k + ' = ' + cellsOf[k][j]); return }
    const R = Rm[q.d] || 0, dep = fin ? 0 : q.A * .02, cfo = q.ni - q.eq + q.ga + dep + (q.imp || 0) + (q.wo || 0), capex = fin ? 0 : q.gr + dep, ir = issRule(T, q, p), iss = ir.iss, e = ir.est ? '≈' : '';
    // FIN-CF-03B (added 2026-10-25): a bank's / insurer's growth gr (no cash) is out of 차입 증감 in a fully recorded row after a real close
    const ncG = fin && (T.acd == null || p.d > T.acd) && p.d > 0 && Number.isFinite(q.gr) ? q.gr : 0;
    const borrow = q.D - p.D + R - ncG, cff = borrow - q.dv + iss, dc = q.cs - p.cs, oth = dc - cfo + capex - cff;
    // FIN-CF-03A (added 2026-10-24): a quarter that began on or before the acquisition-ledger start (T.acd, the load day of a restored save) and
    // ended after it is 'partly recorded' and its 차입 / 재무활동 / 기타 cells carry '◐' (design R2 4-1); this SPEC has no acquisition term, so
    // a visible quarter with an acquisition record is reported as outside it (none of these cases has one)
    const half = T.acd != null && p.d <= T.acd && q.d > T.acd ? '◐' : ''; if (T.acr && T.acr[q.d]) bad.push(lb + ' has a FIN-CF-03A acquisition record, which this SPEC does not cover');
    const want = { b: u ? '미확인' : half + fN(borrow), f: u ? '미확인' : e + half + fN(cff), o: u ? '미확인' : e + half + fN(oth), dc: fN(dc), cfo: fN(cfo), cap: fin ? '–' : fN(-capex), fcf: fin ? '–' : fN(cfo - capex) };
    for (const k in want) if (cellsOf[k][j] !== want[k]) bad.push(lb + ' ' + k + ' shows ' + cellsOf[k][j] + ' want ' + want[k]);
  });
  const memo = t.row(NOTE_RLF), vis = L.some((q, j) => L[j + 1] && Rm[q.d]);
  if (vis !== !!memo) bad.push('memo row ' + (memo ? 'shown' : 'hidden') + ' but a relief is ' + (vis ? 'visible' : 'not visible'));
  if (memo && !bad.length) L.forEach((q, j) => { const w = L[j + 1] && Rm[q.d] ? fN(Rm[q.d]) : '–'; if (memo[j] !== w) bad.push(qLab(q.d) + ' memo shows ' + memo[j] + ' want ' + w) });
  const note = /※ 미확인 분기\(([^)]*)\)/.exec(t.h);
  const wantLabs = unk.map(d => qLab(d)); if (!!note !== !!unk.length || (note && wantLabs.some(x => !note[1].includes(x)))) bad.push('unconfirmed footnote ' + (note ? '[' + note[1] + ']' : 'absent') + ' want quarters ' + wantLabs.join(','));
  ok(t.clean && !bad.length, lab + ': the 현금흐름 tab (' + L.length + ' quarters) shows 차입 증감 / 재무활동 / 기타 / 현금 증감 / 영업 / 설비투자 / FCF exactly as the SPEC; memo row ' + (memo ? 'shown' : 'hidden') + (unk.length ? '; 미확인 in ' + wantLabs.join(',') : '') + (t.clean ? '' : ' [NaN/undefined in the page]') + (bad.length ? ' | ' + bad.slice(0, 5).join('; ') : ''));
  return t;
}

// ---- N1 negative relief, ch11 called outside earn() ---------------------------------------------------------------------------------
console.log('\n-- TC-CF01-N1 negative relief: a healthy company forced into chapter 11 is re-levered; ch11 called outside earn() (SYNTHETIC)');
{
  const run = runSeq('N1', [{ name: 'N1 forced chapter 11 of a healthy company', start: c => { ch11(c, 'forced, healthy'); return { ncqAfter: c.ncq, rlfAfter: clone(c.rlf) } }, check: (r, T, rel, ev) => {
    ok(rel.length === 1 && !rel[0].inEarn && rel[0].R < -100, 'N1 the relief happened outside earn() and is NEGATIVE: R = ' + f2(rel[0] && rel[0].R) + ' (debt before ' + f2(rel[0] && rel[0].D0) + ', after ' + f2(rel[0] && rel[0].D1) + ')'); if (rel.length !== 1) return;
    ok(Math.abs(ev.ncqAfter - rel[0].R) < 1e-9 && ev.rlfAfter == null, 'N1 ncq keeps the sign while it waits: ' + f2(ev.ncqAfter) + ' (rlf not yet set)');
    ok(T.rlf && T.rlf.R < 0 && Math.abs(T.rlf.R - r.R) < 1e-9 && T.rlf.d === r.Q.d && T.ncq === 0, 'N1 rlf = {d ' + (T.rlf && T.rlf.d) + ', R ' + f2(T.rlf && T.rlf.R) + '} negative, equal to the ledger R');
    cashOk(r, 'N1'); ok(near(r.closure, 0), 'N1 independent cash closure residual ' + f2(r.closure));
    ok(r.dD > 0 && near(r.d.cff + r.Q.dv - r.d.iss, r.dD + r.R) && r.d.cff + r.Q.dv - r.d.iss < r.dD, 'N1 the debt row rose by ' + f2(r.dD) + ' but 차입 증감 shows ' + f2(r.d.cff + r.Q.dv - r.d.iss) + ' = dD + R: the non-cash increase is taken out'); } }]);
  const T = run.T, t = uiCheck(T, 'N1 UI', { R: ledgerR(T) }); const m = t.row(NOTE_RLF);
  ok(m && m[0].startsWith('-') && m[0] === fN(T.rlf.R), 'N1 UI the memo row shows the negative amount in the relief column: ' + (m && m.join(' | ')));
}

// ---- B1 a bank in chapter 11 (outside earn): same rule, banks have no capex/FCF row values -----------------------------------------
console.log('\n-- TC-CF01-B1 a bank (kd 1) forced into chapter 11 outside earn() (SYNTHETIC; bank/insurer deposits and mergers are FIN-CF-03, not touched)');
{
  startWorld(SEED); const T = S.co.find(c => !c.dead && c.kd === 1 && !c.priv && !mine(c) && !c.own.P && c.bk === 0 && c.A > 3000); pre(!!T, 'B1 bank ' + (T && T.tk));
  nextClose(T); nextClose(T); const S0 = snap(T); defic(T); ch11(T, 'forced bank'); const rec = LED.ch11[LED.ch11.length - 1];
  // FIN-CF-03B: the bank's growth at the close (earn: c.A += gr, then c.D += gr, no cash) measured from the writes, to take it out of the true borrowing
  const gw = [], gv = { A: T.A, D: T.D }; for (const k of ['A', 'D']) Object.defineProperty(T, k, { configurable: true, enumerable: true, get() { return gv[k] }, set(x) { if (x !== gv[k]) gw.push({ k, d: x - gv[k], f: names(new Error()) }); gv[k] = x } });
  const o = nextClose(T); for (const k of ['A', 'D']) Object.defineProperty(T, k, { configurable: true, enumerable: true, writable: true, value: gv[k] });
  const G = gw.reduce((a, e, j) => a + (e.k === 'D' && j && gw[j - 1].k === 'A' && Math.abs(gw[j - 1].d - e.d) < 1e-9 && String(e.f).includes('earn') ? e.d : 0), 0);
  if (!T.dead && o) {
    ok(rec && !rec.killed && T.rlf && Math.abs(T.rlf.R - rec.R) < 1e-9 && T.ncq === 0, 'B1 bank relief R = ' + f2(rec && rec.R) + ' recorded: rlf ' + JSON.stringify(T.rlf));
    const L = fqL(T), Q = L[L.length - 1], P = L[L.length - 2], d = fqDerive(T, Q, P), er = o.er;
    ok(G > 1 && near(d.cff - d.iss + Q.dv, (o.post.D - S0.D) + rec.R - G, TOL), 'B1 bank 차입 증감 ' + f2(d.cff - d.iss + Q.dv) + ' = dD(true) ' + f2(o.post.D - S0.D) + ' + R ' + f2(rec.R) + ' - growth (no cash, FIN-CF-03B) ' + f2(G));
    rowCheck(T, 'B1'); uiCheck(T, 'B1 UI', { R: ledgerR(T) });
  } else ok(false, 'B1 the bank died or did not close (dead ' + T.dead + ')');
}

// ---- SD relief on the same day AFTER the close ---------------------------------------------------------------------------------------
console.log('\n-- TC-CF01-SD relief on the same day after the company\'s close (outside earn(), before the day ends): it belongs to the NEXT close (SYNTHETIC)');
{
  startWorld(SEED); const T = pickTarget(); nextClose(T); nextClose(T); const log = [], untrap = trapOn(T, log); let ev = {};
  const o1 = nextClose(T, null, (c, o) => { const L = fqL(c), d0 = fqDerive(c, L[L.length - 1], L[L.length - 2]); ev = { S1: o.post, mark: log.length, day: o.day, row1: L[L.length - 1], cff1: d0.cff, oth1: d0.oth, nc1: d0.nc }; defic(c); ch11(c, 'same day, after the close');
    ev.rec = LED.ch11[LED.ch11.length - 1]; ev.ncq = c.ncq; ev.rlf = clone(c.rlf) });
  ok(ev.rec && !ev.rec.inEarn && ev.rec.R > 100 && Math.abs(ev.ncq - ev.rec.R) < 1e-9 && ev.rlf == null, 'SD relief R ' + f2(ev.rec && ev.rec.R) + ' on close day ' + ev.day + ' after earn(): waits in ncq (' + f2(ev.ncq) + '), rlf not set (' + JSON.stringify(ev.rlf) + ')');
  { const L = fqL(T), q = L[L.length - 1], d = fqDerive(T, q, L[L.length - 2]); ok(q.d === ev.day && d.nc === 0 && d.cff === ev.cff1 && d.oth === ev.oth1 && T.rlf == null, 'SD the row of the close that came BEFORE the relief is unchanged: nc ' + d.nc + ', cff ' + f2(d.cff) + ' (was ' + f2(ev.cff1) + '), rlf ' + JSON.stringify(T.rlf)) }
  const o2 = nextClose(T); untrap();
  const L = fqL(T), Q = L[L.length - 1], P = L[L.length - 2], d = fqDerive(T, Q, P), er = o2.er;
  const dD = o2.post.D - ev.S1.D, dc = o2.post.cs - ev.S1.cs, R = ev.rec.R, dv = er.dv, cm = er.ni - er.eq + er.ga + (er.imp || 0) + (er.wo || 0) - o2.gr;
  const inv = log.slice(ev.mark).filter(l => l.k === 'cs' && has(l.st, 'fsAdd', 'fsTick')).reduce((a, l) => a + l.d, 0), shL = log.slice(ev.mark).filter(l => l.k === 'sh'), shch = shL.length, splitOnly = shch > 0 && shL.every(l => has(l.st, 'splitDo'));
  pre(!shch || splitOnly, 'SD share-count changes in the quarter: ' + shch + (shch ? (splitOnly ? ' (all by splits: no cash)' : ' NOT all splits') : ''));
  const cffReal = dD + R - dv + 0, othClean = dc - cm - cffReal;   // no share cash in this quarter (splits only, classified above from the call stacks)
  ok(P.d === ev.day && Q.d === o2.day && P.d === ev.row1.d, 'SD the next row (day ' + Q.d + ') follows the pre-relief row (day ' + P.d + ')');
  ok(T.rlf && T.rlf.d === Q.d && Math.abs(T.rlf.R - R) < 1e-9 && T.ncq === 0 && d.nc === R, 'SD at the next close ncq becomes rlf {d ' + (T.rlf && T.rlf.d) + ', R ' + f2(T.rlf && T.rlf.R) + '} and the next row takes it (nc ' + f2(d.nc) + ')');
  if (splitOnly) ok(d.iss === 0 && !d.est, 'SD the split moved no cash: 증자·출자 ' + f2(d.iss) + ' (the old rule showed ' + f2((Q.sh - P.sh) * Q.p / 1e4) + ')');
  ok(near(d.cff, cffReal) && near(d.oth, othClean) && near(othClean, inv), 'SD next-row cff ' + f2(d.cff) + ' vs expected ' + f2(cffReal) + ' (err ' + f2(d.cff - cffReal) + '); other ' + f2(d.oth) + ' vs ' + f2(othClean) + ' (err ' + f2(d.oth - othClean) + '); closure vs asset-market cash ' + f2(inv) + ': ' + f2(othClean - inv));
  rowCheck(T, 'SD'); uiCheck(T, 'SD UI', { R: ledgerR(T) });
}

// ---- RET retention: the relief row ages through the 8-quarter window ------------------------------------------------------------------
console.log('\n-- TC-CF01-RET 8-quarter retention: the corrected row shifts one column per quarter and leaves the window (SYNTHETIC relief, then 9 quiet closes)');
{
  const run = runSeq('RET', [{ name: 'RET relief quarter', pre: defic }]); const T = run.T; pre(T.bk === 1 && !!T.rlf, 'RET relief recorded ' + JSON.stringify(T.rlf));
  const rd = T.rlf.d, R = T.rlf.R, L0 = fqL(T), j0 = L0.findIndex(q => q.d === rd); const ref = fqDerive(T, L0[j0], L0[j0 - 1]);
  pre(j0 === L0.length - 1 && ref.nc === R, 'RET relief row is the newest of ' + L0.length + ' rows, nc ' + f2(ref.nc));
  for (let k = 1; k <= 9; k++) {
    nextClose(T); if (T.dead) { errs++; console.log('ERR  FIXTURE INVALID: RET company died in quarter ' + k); break }
    const L = fqL(T), j = L.findIndex(q => q.d === rd), want = k <= 7 ? 7 - k : -1;
    let line = 'RET +' + k + ' quarters: rows ' + L.length + ', relief row at index ' + j + ' (expected ' + want + ')';
    let good = L.length === 8 && j === want;
    if (j >= 1) { const d = fqDerive(T, L[j], L[j - 1]); good = good && d.nc === R && Math.abs(d.cff - ref.cff) < 1e-12 && Math.abs(d.oth - ref.oth) < 1e-12; line += ' | still corrected: nc ' + f2(d.nc) + ', cff ' + f2(d.cff) + ' = first value ' + f2(ref.cff) }
    else line += ' | no previous quarter to compare with: ' + (j === 0 ? 'oldest row, cff ' + fqDerive(T, L[0], undefined).cff : 'row gone, rlf kept but inert');
    ok(good, line);
    const t = uiCheck(T, 'RET +' + k + ' UI', { R: ledgerR(T) }); const memoWant = j >= 1; ok(!!t.row(NOTE_RLF) === memoWant, 'RET +' + k + ' memo row ' + (memoWant ? 'shown' : 'hidden') + ' as the relief row is ' + (memoWant ? 'visible with a previous quarter' : 'not comparable / gone'));
    rowCheck(T, 'RET +' + k);
  }
  ok(T.rlf && T.rlf.d === rd && T.rlf.R === R && fqL(T).every((q, j, a) => !j || fqDerive(T, q, a[j - 1]).nc === 0), 'RET after the row left the window the record stays (' + JSON.stringify(T.rlf) + ') and no visible row takes it');
}

// ================================================================================================================================
// saves
// ================================================================================================================================
const reload = async strip => { const txt = await packS(strip), s = await loadStr(txt); S = s; v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null; return txt };
console.log('\n-- TC-CF01-SV saves: a relief waiting for its close, and a confirmed relief, through autosave (full) and export (packS(1)) (SYNTHETIC)');
for (const [fmt, strip] of [['autosave (full)', 0], ['export (packS(1), histories left out)', 1]]) {
  const tag = 'SV ' + fmt;
  // (a) saved between the relief and the close
  startWorld(SEED); let T = pickTarget(); const id = T.id; nextClose(T); nextClose(T); const S0 = snap(T); defic(T); ch11(T, 'pending at save'); const rec = LED.ch11[LED.ch11.length - 1], rowsBefore = T.fq.length;
  pre(!rec.killed && rec.R > 100 && Math.abs(T.ncq - rec.R) < 1e-9 && T.rlf == null, tag + ' (a) saved on day ' + S.day + ' with ncq ' + f2(T.ncq) + ' waiting');
  const txt = await reload(strip); let T2 = S.co[id];
  // full save: the real rows are kept and the relief belongs to the next quarter, so it must still wait. Export (FIN-CF-02-SAVE-01, A1): qBack rebuilds
  // the past rows from the debt at the restore, which is already the debt after the cut (verify/fin-cf-02-save01/old_expectations_proof log: rebuilt
  // previous debt 1746 = 1753.98 x 0.99559, not 3146.54 before the cut), so the relief is inside the previous quarter and nothing may wait any more.
  const Rw = strip ? 0 : rec.R;
  ok(T2 !== T && T2.ncq === Rw && T2.rlf == null, tag + ' (a) after loading ncq ' + T2.ncq + ' = ' + Rw + (strip ? ' (the relief ' + f2(rec.R) + ' is inside the rebuilt quarters)' : ' (nothing lost)') + ', rlf ' + JSON.stringify(T2.rlf));
  ok(strip ? T2.fq.length === 8 && !/"fq"/.test(txt) : T2.fq.length === rowsBefore, tag + ' (a) histories: ' + (strip ? 'left out of the file, rebuilt as ' : 'kept, ') + T2.fq.length + ' rows');
  const o = nextClose(T2);
  const L = fqL(T2), Q = L[L.length - 1], P = L[L.length - 2], d = fqDerive(T2, Q, P);
  ok(strip ? (T2.rlf == null && T2.ncq === 0 && d.nc === 0) : (T2.rlf && T2.rlf.d === Q.d && T2.rlf.R === rec.R && T2.ncq === 0 && d.nc === rec.R), tag + ' (a) ' + (strip ? 'the close after the load has no relief to confirm (it is inside the rebuilt previous quarter)' : 'the close after the load confirms it') + ': rlf ' + JSON.stringify(T2.rlf) + ', ncq ' + T2.ncq + ', row nc ' + f2(d.nc));
  const s = specCF(T2, Q, P, Rw); ok(Math.abs(d.cff - s.cff) < 1e-9 && Math.abs(d.oth - s.oth) < 1e-9, tag + ' (a) the row follows the SPEC with R ' + f2(Rw) + ': cff ' + f2(d.cff) + ', other ' + f2(d.oth));
  if (!strip) { const cffReal = (o.post.D - S0.D) + rec.R - o.er.dv; ok(near(d.cff - d.iss, cffReal), tag + ' (a) and matches the true cash financing ' + f2(cffReal) + ' (rows kept, so the previous quarter is the real one)') }
  uiCheck(T2, tag + ' (a) UI', strip ? {} : { R: { [Q.d]: rec.R } });
  // (b) saved after the confirmation
  const rl = clone(T2.rlf); await reload(strip); T2 = S.co[id];
  if (strip) { { const tx = cfTab(T2).text; ok(!tx.includes('미확인') && !/법정관리 이력/.test(tx) && T2.cfd === S.day - 720, tag + ' (b) export: the rebuilt past quarters are not legacy rows (cfd ' + T2.cfd + ' = load day - 720): no 미확인 cell, no chapter-11-history warning'); } ok(T2.rlf == null && !fqL(T2).some((q, j, a) => j && fqDerive(T2, q, a[j - 1]).nc), tag + ' (b) export: the confirmed record is dropped together with the real rows it described (qBack builds new past quarters): rlf ' + JSON.stringify(T2.rlf)); uiCheck(T2, tag + ' (b) UI', {}) }
  else { const L2 = fqL(T2), j = L2.findIndex(q => q.d === rl.d); ok(JSON.stringify(T2.rlf) === JSON.stringify(rl) && j >= 1 && fqDerive(T2, L2[j], L2[j - 1]).nc === rl.R, tag + ' (b) rlf ' + JSON.stringify(T2.rlf) + ' kept, relief row still corrected'); uiCheck(T2, tag + ' (b) UI', { R: { [rl.d]: rl.R } }) }
  // the world goes on without exceptions
  for (let i = 0; i < 100; i++) step(); ok(Number.isFinite(T2.D) && Number.isFinite(T2.cs) && (T2.ncq === 0 || T2.dead), tag + ' 100 more days ran without an exception; ncq ' + T2.ncq);
}


// ================================================================================================================================
// saves written BEFORE the ledger: no ncq / rlf / cfd on any company. An unknown R is never estimated and never called confirmed.
// ================================================================================================================================
console.log('\n-- TC-CF01-LG saves written before the ledger (SYNTHETIC reliefs, then the new fields removed from the save)');
const legacy = async (slots) => { const raw = clone(S); for (const x of raw.co) { delete x.ncq; delete x.rlf; delete x.cfd; delete x.eqq; delete x.isq; delete x.isd; if (slots && x.fq) x.fq = x.fq.map(r => r.slice(0, slots)) } S = migrate(raw); v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null };
const keys5 = ['cfo', 'capex', 'dc', 'fcf', 'dep'];
for (const slots of [0, 22]) {
  const tag = 'LG' + (slots ? ' (22-number rows of the oldest saves)' : '');
  startWorld(SEED); let T = pickTarget(); const id = T.id; nextClose(T); nextClose(T); nextClose(T, defic); nextClose(T);
  const L0 = fqL(T), D0 = L0.map((q, j) => j ? fqDerive(T, q, L0[j - 1]) : null), rd = T.rlf.d, R0 = T.rlf.R;
  pre(T.bk === 1 && !!T.rlf && L0.length === 8 && L0.findIndex(q => q.d === rd) === 6, tag + ' world: relief R ' + f2(R0) + ' booked in the quarter ' + qLab(rd) + ', one quiet quarter after it');
  const rows0 = clone(T.fq); await legacy(slots); T = S.co[id]; const L = fqL(T), Ds = L.map((q, j) => j ? fqDerive(T, q, L[j - 1]) : null);
  ok(S.co.every(x => x.ncq === 0 && x.cfd === S.day && !('rlf' in x) && x.eqq === 0 && x.isd === S.day && !('isq' in x)), tag + ': after loading every company has ncq 0, cfd = the load day ' + S.day + ', no rlf; and (FIN-CF-02) eqq 0, isd = the load day, no isq (' + S.co.length + ' companies)');
  ok(L.length === 8 && JSON.stringify(T.fq) === JSON.stringify(slots ? rows0.map(r => r.slice(0, slots)) : rows0), tag + ': the quarter rows are exactly as saved (' + T.fq.length + ' rows, ' + [...new Set(T.fq.map(r => r.length))].join('/') + ' numbers each; nothing is rewritten on load)');
  ok(Ds.every((d, j) => !j || keys5.every(k => Math.abs(d[k] - D0[j][k]) < 1e-9)), tag + ': operating cash flow, capex, FCF, depreciation and cash change are the same as before the fields were removed (all rows)');
  const unkDays = L.filter((q, j) => Ds[j] && Ds[j].unk).map(q => q.d);
  ok(unkDays.length === 1 && unkDays[0] === rd, tag + ': exactly the relief quarter ' + qLab(rd) + ' is flagged unconfirmed (flagged: ' + unkDays.map(qLab).join(',') + ')');
  const jr = L.findIndex(q => q.d === rd), q = L[jr], p = L[jr - 1];
  ok(Ds[jr].nc === 0 && Math.abs(Ds[jr].cff - (q.D - p.D - q.dv + (q.sh !== p.sh ? (q.sh - p.sh) * q.p / 1e4 : 0))) < 1e-9, tag + ': no R is estimated: the number kept behind the label is the old formula (nc ' + Ds[jr].nc + ', cff ' + f2(Ds[jr].cff) + ' = dD - dv + iss)');
  ok(T.rlf == null && !cfRl(T), tag + ': nothing is claimed as a confirmed relief (rlf ' + JSON.stringify(T.rlf) + ', memo row condition ' + cfRl(T) + ')');
  const t = uiCheck(T, tag + ' UI', { R: {}, unk: [rd] });
  ok(t.h.includes('확정한 것은 아니에요') && t.h.includes('법정관리 이력') && t.h.includes('약 15%') && t.h.includes('놓친 분기가 있을 수') && !t.row(NOTE_RLF), tag + ' UI: the footnote states the basis (chapter-11 history + equity ~15% of assets), that it is not a confirmation, and that quarters can be missed; no memo row');
  // later closes of the loaded world: the first new row still spans the load day, the second is fully inside the ledger
  const o1 = nextClose(T), o2 = nextClose(T); const L2 = fqL(T), a = L2[L2.length - 1], b = L2[L2.length - 2], c2 = L2[L2.length - 3];
  const dA = fqDerive(T, a, b), dB = fqDerive(T, b, c2);
  ok(b.d < S.day && T.cfd < b.d && !dA.unk && dA.nc === 0, tag + ': a quarter whose previous row is inside the ledger (cfd ' + T.cfd + ' <= previous row ' + b.d + ') is never flagged: unk ' + dA.unk);
  { const fake = Object.assign({}, T), qq = Object.assign({}, a), pp = Object.assign({}, b); const rr = Object.keys(a).map(k => a[k]);
    const cheat = fqo(T.fq[T.fq.length - 1].slice()); cheat.D = cheat.A + cheat.cs + cheat.gw + cheat.pv - .15 * cheat.A; const dd = fqDerive(T, cheat, b);
    ok(!dd.unk, tag + ': even with the 15% signature planted in a post-ledger quarter it is not flagged (bk ' + T.bk + ')'); }
  for (let i = 0; i < 60; i++) step(); ok(Number.isFinite(T.D) && T.ncq === 0, tag + ': 60 more days ran without an exception');
}
{
  // the rule, condition by condition (table over shallow copies of one legacy company; each variant breaks exactly one condition)
  startWorld(SEED); let T = pickTarget(); const id = T.id; nextClose(T); nextClose(T); nextClose(T, defic); nextClose(T); await legacy(); T = S.co[id];
  const L = fqL(T), jr = L.findIndex((q, j) => j && specUnk(T, q, L[j - 1])); const q = L[jr], p = L[jr - 1]; pre(jr > 0, 'LG table: the relief quarter ' + qLab(q.d) + ' matches the design rule in the loaded world');
  const U = (over, qo) => fqDerive(Object.assign({}, T, over), Object.assign({}, q, qo || {}), p).unk;
  const rows = [
    ['all conditions hold', U({}), true],
    ['bk = 0 (never in chapter 11): the 16 small-company look-alikes found in the investigation', U({ bk: 0 }), false],
    ['a recorded relief matches this quarter (rlf.d = the row date)', U({ rlf: { d: q.d, R: 1 } }), false],
    ['the previous row is not before the ledger start (cfd <= previous row)', U({ cfd: p.d }), false],
    ['the company has no cfd (field missing): nothing is claimed', U({ cfd: null }), false],
    ['equity is not about 15% of assets (planted D 400 higher)', U({}, { D: q.D + 400 }), false],
    ['equity is 15% +/- 3 at the edge (D 2.9 higher still counts)', U({}, { D: q.D + 2.9 }), true],
    ['just outside the +/- 3 band (D 3.2 higher)', U({}, { D: q.D + 3.2 }), false],
    ['assets 0', U({}, { A: 0 }), false]];
  for (const [lab, got, want] of rows) ok(got === want, 'LG table: ' + lab + ' -> ' + (got ? 'unconfirmed' : 'normal') + (got === want ? '' : ' (expected ' + (want ? 'unconfirmed' : 'normal') + ')'));
  ok(fqDerive(Object.assign({}, T), q, undefined).unk === false, 'LG table: the oldest row (no previous quarter) is never flagged');
  // a company without any chapter-11 history keeps its table untouched even when its last row looks like a reset
  const U2 = S.co.find(x => !x.dead && !x.kd && x.bk === 0 && x.fq && x.fq.length >= 3 && x.id !== id); const lr = U2.fq[U2.fq.length - 1]; lr[17] = lr[14] + lr[13] + lr[15] + lr[16] - .15 * lr[14];
  const Lq = fqL(U2), dq = fqDerive(U2, Lq[Lq.length - 1], Lq[Lq.length - 2]); const tu = uiCheck(U2, 'LG look-alike (bk 0) UI', { R: {} });
  ok(!dq.unk && cfNoteR(U2) === '' && cfNote(U2) === cfNoteE(U2) && !/미확인|법정관리 이력/.test(tu.text), 'LG a bk = 0 company whose last row has the 15% signature (planted) shows plain numbers and no chapter-11 footnote (flagged ' + dq.unk + (cfNoteE(U2) ? '; only the FIN-CF-02 estimate footnote' : '') + ')');
}
{
  // false negative that cannot be closed: a relief reached through callLoan in a save that never recorded it, signature or not
  startWorld(SEED); let T = pickTarget(); const id = T.id; nextClose(T); nextClose(T);
  const b = S.co[T.ln], sp = T.cs; T.cs = 0; defic(T); callLoan(b, T, 1); nextClose(T); nextClose(T);
  pre(T.bk === 1, 'LG-FN callLoan-route relief happened (R ' + f2(LED.ch11.filter(x => x.id === id).pop().R) + ')'); const rdFN = T.rlf.d; await legacy(); T = S.co[id];
  const L = fqL(T), Ds = L.map((q, j) => j ? fqDerive(T, q, L[j - 1]) : null), j = L.findIndex(q => q.d === rdFN), flagged = Ds[j].unk, note = cfNote(T);
  ok(flagged || /법정관리 이력/.test(note), 'LG-FN relief quarter ' + qLab(rdFN) + ': ' + (flagged ? 'flagged unconfirmed' : 'NOT detected by the signature (residual ' + f2(L[j].A + L[j].cs + L[j].gw + L[j].pv - L[j].D - .15 * L[j].A) + '); the company-level warning is shown instead, so it is never silent') + (flagged ? '' : ' [documented false negative]'));
  ok(T.rlf == null && Ds[j].nc === 0, 'LG-FN the relief amount is not guessed (nc ' + Ds[j].nc + ')');
  uiCheck(T, 'LG-FN UI', { R: {} });
}
{
  // a relief that was waiting for its close when the old save was written: ncq did not exist, the amount is gone
  startWorld(SEED); let T = pickTarget(); const id = T.id; nextClose(T); nextClose(T); defic(T); ch11(T, 'pending in an old save'); pre(T.ncq > 100, 'LG-IF pending relief ' + f2(T.ncq));
  await legacy(); T = S.co[id]; ok(T.ncq === 0 && T.rlf == null && T.bk === 1, 'LG-IF after loading: ncq ' + T.ncq + ' (unknown, not estimated), rlf ' + JSON.stringify(T.rlf) + ', bk ' + T.bk);
  nextClose(T); const L = fqL(T), Q = L[L.length - 1], P = L[L.length - 2], d = fqDerive(T, Q, P), note = cfNote(T);
  ok(T.rlf == null && T.ncq === 0 && d.nc === 0, 'LG-IF the next close confirms nothing (rlf ' + JSON.stringify(T.rlf) + ', nc ' + d.nc + ')');
  ok(d.unk || /법정관리 이력/.test(note), 'LG-IF the quarter that spans the lost relief is ' + (d.unk ? 'flagged unconfirmed' : 'not matched by the signature (residual ' + f2(Q.A + Q.cs + Q.gw + Q.pv - Q.D - .15 * Q.A) + ') but the company-level warning is shown') + ': never presented as an ordinary quarter');
  uiCheck(T, 'LG-IF UI', { R: {} });
}

// ================================================================================================================================
// N: a natural run (seed 12345; no player action, nothing injected)
// ================================================================================================================================
console.log('\n-- TC-CF01-N natural run: seed 12345, JYNR (chapter 11 inside earn() on its own), 620 days, no injected events');
{
  startWorld(12345); const T = S.co.find(c => c.tk === 'JYNR'); pre(!!T, 'N target ' + (T && T.tk) + ' (kd ' + (T && T.kd) + ')');
  const log = [], closes = []; const un = trapOn(T, log);
  LED.post[T.id] = (c, o) => closes.push({ day: Math.round(S.day), post: o.post, er: o.er, gr: o.gr, logTo: log.length, fq: c.fq.map(r => r.slice()), bk: c.bk, rlf: clone(c.rlf), ncq: c.ncq });
  for (let i = 0; i < 620 && !T.dead; i++) step(); un(); LED.post[T.id] = null;
  const rel = LED.ch11.filter(x => x.id === T.id && !x.killed);
  pre(rel.length === 1 && rel[0].inEarn, 'N JYNR had exactly one relief, inside earn(), on day ' + (rel[0] && Math.round(rel[0].day)) + ': R ' + f2(rel[0] && rel[0].R) + ' (investigated on main: 848.42)');
  const k = closes.findIndex(c => c.day >= rel[0].day), a = closes[k - 1], b = closes[k], seg = log.slice(a.logTo, b.logTo), R = rel[0].R;
  const Q = fqo(b.fq[b.fq.length - 1]), P = fqo(b.fq[b.fq.length - 2]); const Tc = { rlf: b.rlf, bk: b.bk, i: T.i, kd: T.kd, cfd: T.cfd };
  const d = fqDerive(Tc, Q, P), er = b.er, dD = b.post.D - a.post.D, dc = b.post.cs - a.post.cs, dv = er.dv, cm = er.ni - er.eq + er.ga + (er.imp || 0) + (er.wo || 0) - b.gr;
  const inv = seg.filter(l => l.k === 'cs' && has(l.st, 'fsAdd', 'fsTick')).reduce((s, l) => s + l.d, 0), shch = seg.filter(l => l.k === 'sh').length, cffReal = dD + R - dv, othClean = dc - cm - cffReal;
  ok(b.rlf && b.rlf.d === b.day && Math.abs(b.rlf.R - R) < 1e-9 && b.ncq === 0, 'N at the close of day ' + b.day + ' rlf = {d ' + (b.rlf && b.rlf.d) + ', R ' + f2(b.rlf && b.rlf.R) + '} = the ledger R, ncq ' + b.ncq);
  info('N ledger: dD ' + f2(dD) + ' | relief R ' + f2(R) + ' | dividend ' + f2(dv) + ' | share-count writes ' + shch + ' | asset-market cash ' + f2(inv) + ' | dc ' + f2(dc) + ' | cfo-capex(indep.) ' + f2(cm));
  ok(near(cffReal, 0, TOL) && shch === 0, 'N the true cash financing of the quarter is ' + f2(cffReal) + ' (the debt fell by exactly the relief; nothing was repaid in cash)');
  ok(near(d.cff, cffReal) && near(d.oth, othClean) && near(othClean, inv), 'N game cff ' + f2(d.cff) + ' vs expected ' + f2(cffReal) + ' (main showed ' + f2(dD) + '); other ' + f2(d.oth) + ' vs ' + f2(othClean) + ' (closure vs asset-market cash ' + f2(inv) + ')');
  const nx = closes[k + 1]; if (nx) { const Q2 = fqo(nx.fq[nx.fq.length - 1]), P2 = fqo(nx.fq[nx.fq.length - 2]), d2 = fqDerive({ rlf: nx.rlf, bk: nx.bk, i: T.i, kd: T.kd, cfd: T.cfd }, Q2, P2);
    const dD2 = nx.post.D - b.post.D, inv2 = log.slice(b.logTo, nx.logTo).filter(l => l.k === 'cs' && has(l.st, 'fsAdd', 'fsTick')).reduce((s, l) => s + l.d, 0), dv2 = nx.er.dv, dc2 = nx.post.cs - b.post.cs, cm2 = nx.er.ni - nx.er.eq + nx.er.ga + (nx.er.imp || 0) + (nx.er.wo || 0) - nx.gr;
    ok(d2.nc === 0 && near(d2.cff, dD2 - dv2) && near(d2.oth, dc2 - cm2 - (dD2 - dv2)) && near(dc2 - cm2 - (dD2 - dv2), inv2), 'N the next quarter (day ' + nx.day + ') is ordinary: nc ' + d2.nc + ', cff ' + f2(d2.cff) + ' vs ' + f2(dD2 - dv2) + ', other ' + f2(d2.oth)) }
  ok(S.co.every(c => (!c.rlf || c.bk > 0) && c.ncq === 0 || c.dead), 'N after 620 days only companies with a chapter-11 history carry an rlf (' + S.co.filter(c => c.rlf).map(c => c.tk).join(',') + '), no ncq is left waiting');
  ok(S.co.every(c => c.dead || !c.fq || c.fq.every(r => r.length === 24 || r.length === 22) && c.fq.length <= 8), 'N the quarter record is unchanged: 8 rows at most, 24 numbers (22 in back-filled rows) for every company');
  rowCheck(T, 'N JYNR'); uiCheck(T, 'N JYNR UI', { R: ledgerR(T) });
}


// ---- F8 the same displayed debt change, two different compositions ------------------------------------------------------------------------
console.log('\n-- TC-CF01-F8 same debt change in the rows, different compositions: a chapter-11 relief (non-cash) vs a cash repayment funded by an asset sale (SYNTHETIC)');
{
  const one = (label, start, hp) => { startWorld(SEED); const T = pickTarget(); nextClose(T); nextClose(T); const S0 = snap(T), L0 = LED.ch11.length; if (start) start(T); const o = nextClose(T, hp);
    const L = fqL(T), Q = L[L.length - 1], P = L[L.length - 2], d = fqDerive(T, Q, P), R = LED.ch11.slice(L0).filter(x => x.id === T.id && !x.killed).reduce((a, x) => a + x.R, 0), dD = o.post.D - S0.D, cffReal = dD + R - o.er.dv;
    console.log('     ' + label.padEnd(46) + 'true dD ' + f2(dD).padStart(9) + ' | relief R ' + f2(R).padStart(8) + ' | real cash financing ' + f2(cffReal).padStart(9) + ' | shown 재무활동 ' + f2(d.cff).padStart(9) + ' | shown 기타 ' + f2(d.oth).padStart(8)); return { dD, R, d, cffReal, T } };
  const X = one('X relief (non-cash)', null, defic);
  let lo = 0, hi = -X.dD, Y = null;
  for (let k = 0; k < 12; k++) { const x = (lo + hi) / 2; Y = one('Y cash repayment ' + f1(x) + ' (asset sale funds it)', c => { c.A -= x * 1.2; c.cs += x * 1.2; c.D -= x; c.cs -= x }, null); if (Y.dD < X.dD) hi = x; else lo = x; if (Math.abs(Y.dD - X.dD) < 1.5) break }
  pre(Math.abs(Y.dD - X.dD) < 3 && X.R > 100 && Y.R === 0, 'F8 fixture: true debt change X ' + f2(X.dD) + ' vs Y ' + f2(Y.dD) + '; relief X ' + f2(X.R) + ', Y ' + f2(Y.R));
  ok(near(X.d.cff, X.cffReal) && near(Y.d.cff, Y.cffReal), 'F8 each statement matches its own real cash financing: X shows ' + f1(X.d.cff) + ' (real ' + f1(X.cffReal) + '), Y shows ' + f1(Y.d.cff) + ' (real ' + f1(Y.cffReal) + ')');
  ok(Math.abs(X.d.cff - Y.d.cff) > .5 * X.R, 'F8 the two statements are told apart: financing differs by ' + f1(Math.abs(X.d.cff - Y.d.cff)) + ' although the debt rows changed by the same ' + f1(X.dD) + ' (main showed the same number for both)');
}

// ---- END OF CASES ----
})().catch(e => { errs++; console.log('ERR  ' + (e && e.stack || e)) }).finally(() => console.log('errs', errs, 'fails', fails));
