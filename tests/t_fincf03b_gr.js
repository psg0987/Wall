// FIN-CF-03B (design A, approved 2026-10-25; GPT-6 independent design review conditional PASS): a bank's / insurer's quarterly growth gr is not borrowing.
// Written first as failing tests on main 40a4d7f, then the change was made.
//
// THE DEFECT (main 40a4d7f): earn() (src/sim.js) grows every company by gr = A x g / 4 at the close. A financial company (c.kd) books it as
// `c.A += gr; c.D += gr` (deposits / insurance liabilities fund the new assets, no cash moves); fqDerive (src/ui1.js) has capex 0 for financial
// companies and puts the whole debt change dD into 차입 증감 / 재무활동, so gr showed as cash borrowing and 기타·투자 매매 took it back with the opposite sign.
// THE RULE (A): fqDerive sets ncG = q.gr (the growth stored in the quarter row, index 12) when the company is financial, the row is fully recorded
// (st 'full', FIN-CF-03A), the previous row exists and is a real close (prev.d > 0: rows qBack rebuilds at day 0 are dated before day 0, and rows rebuilt
// by an export restore make the first real row 'part'), and q.gr is a finite number; otherwise 0. 차입 증감 = dD + R - ncA - ncG, 재무활동 = 차입 증감 - dv
// + 증자; 기타 follows the cash identity. A memo row '└ 예금·보험부채 증감 ...' shows ncG.
//
// WHERE THE EXPECTED VALUES COME FROM (nothing is taken from the statement code):
//  - every write of c.A / c.D / c.cs on the company is trapped with the calling function: inside earn() the growth line is an A write of +x followed at
//    once by a D write of the same +x (financial) or a cs write (others). Raw growth G = that x (unrounded); raw cash debt change = every other D write of
//    the quarter, minus what FIN-CF-01 (relief R, measured around ch11x) and FIN-CF-03A (acquisition debt, from the acr record) already take out.
//  - the quarter rows are rounded by qPush (r1: whole numbers at 10 and above, one decimal below). So row-vs-raw checks use TOLR: the debt change of two
//    rounded rows is off by up to rq(q.D) + rq(p.D) and the rounded gr by up to rq(gr), rq = 0.5 for values >= 10, 0.05 below; row-vs-row checks (the formula on the row
//    numbers) use TOLI 1e-6.
//  - preconditions (pre: ERR FIXTURE INVALID) are kept apart from the computed checks (ok: FAIL).
let errs = 0, fails = 0;
(async () => {
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ };
const pre = (c, m) => { console.log((c ? 'pre  ' : 'ERR  FIXTURE INVALID: ') + m); if (!c) errs++ };
const TOLI = 1e-6, rq = x => Math.abs(x) >= 9.5 ? .5 : .05;                    // r1 rounding of one row value (qPush)
const tolRow = (q, p, G) => rq(q.D) + rq(p.D) + rq(G);                          // dD of two rounded rows + the rounded gr
const f2 = x => x == null ? 'n/a' : (Math.abs(x) < 5e-10 ? 0 : +x).toFixed(2);
const mulb = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const SEED = 20261016;

// ---- harness ------------------------------------------------------------------------------------------------------------------------------
let inEarn = null; const LOG = new Map(), RL = [];
{ const e0 = earn; earn = function (c) { inEarn = c; try { return e0(c) } finally { inEarn = null } } }
{ const x0 = ch11x; ch11x = function (c, why) { const D0 = c.D; x0(c, why); RL.push({ id: c.id, day: S.day, R: c.dead ? null : D0 - c.D }) } }
function trap(c) {
  const v = { A: c.A, D: c.D, cs: c.cs }, rec = { w: [] }; LOG.set(c.id, rec);
  for (const k of ['A', 'D', 'cs']) Object.defineProperty(c, k, { configurable: true, enumerable: true, get() { return v[k] }, set(x) { const d = x - v[k]; if (d) rec.w.push({ k, d, e: inEarn === c, day: S.day }); v[k] = x } });
}
// raw growth and raw cash debt change of the quarter (after the previous close's earn, up to and including this close's earn)
function oracle(c, p, q) {
  const w = LOG.get(c.id).w.filter(x => x.day > p.d && x.day <= q.d); let G = 0, Dall = 0, seen = 0;
  for (let i = 0; i < w.length; i++) { const a = w[i], b = w[i + 1];
    if (a.e && a.k === 'A' && b && b.e && (c.kd ? b.k === 'D' && Math.abs(b.d - a.d) < 1e-9 : b.k === 'cs')) { G += a.d; seen++; if (c.kd) i++; continue }
    if (a.k === 'D') Dall += a.d }
  const R = RL.filter(r => r.id === c.id && r.R != null && r.day > p.d && r.day <= q.d).reduce((s, r) => s + r.R, 0), A3 = c.acr && c.acr[q.d], ncA = A3 ? A3.aD + A3.iD + A3.lD + A3.hD : 0;
  return { G, seen, cash: Dall + R - ncA, R, ncA };     // Dall: D writes other than growth; + R: relief lowered D without cash; - ncA: debt taken over without cash
}
function startWorld(seed) { Math.random = mulb(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; LOG.clear(); RL.length = 0 }
const stepD = () => { step(); if (mdl) G.mk(mdl.o.length - 1) };
function nextClose(c) { const l0 = c.fq[c.fq.length - 1]; for (let i = 0; i < 200 && !c.dead; i++) { stepD(); if (c.fq[c.fq.length - 1] !== l0) return true } return false }
const toEve = c => { const L = c.fq[c.fq.length - 1][0]; while (S.day < L + 89) stepD() };   // the day before the next close
const pickFin = kd => S.co.find(c => !c.dead && c.kd === kd && !c.priv && !mine(c) && !c.own.P && c.bk === 0 && c.A > 1000);
const plain = () => S.co.find(c => !c.dead && !c.kd && !c.priv && !mine(c) && !c.own.P && c.bk === 0 && c.A > 3000);
const last = c => { const L = fqL(c); return { q: L[L.length - 1], p: L[L.length - 2], L } };
const borrowOf = (q, d) => d.cff + q.dv - d.iss;
const restore = async strip => { const txt = await packS(strip), s = await loadStr(txt); S = s; v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null };
// the row: rule (row numbers) and measurement (raw writes); 'want' = 'corrected' | 'kept' (rebuilt previous row: no correction)
function rowCheck(lab, c, want) {
  const { q, p } = last(c), d = fqDerive(c, q, p), o = oracle(c, p, q), b = borrowOf(q, d), dD = q.D - p.D, R = d.nc, ncA = d.ncA;
  const g = c.kd && want === 'corrected' ? q.gr : 0, bW = dD + R - ncA - g, cffW = bW - q.dv + d.iss, othW = (q.cs - p.cs) - d.cfo + d.capex - cffW - d.maN - d.inN;
  console.log(`  ${lab}: ${c.tk} kd ${c.kd} g ${f2(c.g)} row ${q.d} vs ${p.d} st ${d.st} | raw growth ${f2(o.G)} (row gr ${f2(q.gr)}), raw cash debt change ${f2(o.cash)}, R ${f2(o.R)}, ncA ${f2(o.ncA)} | statement 차입 ${f2(b)}, 재무 ${f2(d.cff)}, 기타 ${f2(d.oth)}, ncG ${f2(d.ncG)}`);
  pre(o.seen === 1 || (c.g === 0 && o.seen === 0 && q.gr === 0), lab + ': the growth line of earn ran once in the quarter (raw growth ' + f2(o.G) + (c.g === 0 ? '; g 0 writes nothing' : '') + ')');
  ok(Math.abs(q.gr - o.G) <= rq(o.G) + 1e-9, lab + ': row gr ' + f2(q.gr) + ' = raw growth ' + f2(o.G) + ' rounded by qPush');
  ok((d.ncG || 0) === g, lab + ': ncG ' + f2(d.ncG) + ' = ' + (g ? 'row gr ' + f2(g) : '0 (' + (c.kd ? 'previous row rebuilt / not fully recorded' : 'not a financial company') + ')'));
  ok(Math.abs(b - bW) <= TOLI && Math.abs(d.cff - cffW) <= TOLI && Math.abs(d.oth - othW) <= TOLI, lab + ': 차입 증감 ' + f2(b) + ' = dD ' + f2(dD) + (R ? ' + R ' + f2(R) : '') + (ncA ? ' - ncA ' + f2(ncA) : '') + (g ? ' - gr ' + f2(g) : '') + ' = ' + f2(bW) + ', 재무 ' + f2(d.cff) + ' = ' + f2(cffW) + ', 기타 ' + f2(d.oth) + ' = ' + f2(othW));
  if (want === 'corrected' || !c.kd) ok(Math.abs(b - o.cash) <= tolRow(q, p, o.G) + 1e-9, lab + ': 차입 증감 ' + f2(b) + ' = the cash borrowing measured from the debt writes ' + f2(o.cash) + ' (within the row rounding)');
  else ok(Math.abs(b - o.cash - o.G) <= 60 && (d.ncG || 0) === 0, lab + ': not corrected (the previous row is rebuilt, its debt is made from the state at day 0 / the restore): 차입 증감 ' + f2(b));
  return { q, p, d, o, b };
}
function cfTab(c) {
  sel = -1; pg = ''; tab = 'h'; S.spd = 0; G.pick(c.id); G.stab('f'); G.fseg(3); render();
  const h = document.getElementById('sh').innerHTML, row = lab => { const part = h.split('<td>' + lab + '</td>')[1]; return part == null ? null : [...part.split('</tr>')[0].matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m => m[1]) };
  return { h, clean: !/NaN|undefined|Infinity|\[object/.test(h), row, text: h.replace(/<[^>]*>/g, '') };
}
const MEMO = '└ 예금·보험부채 증감(자산과 함께 늘거나 줄어 현금 없음, 위 차입·재무활동에서 뺌)';
console.log('-- harness ready');

// ================================================================================================================================
// F1-F3 natural closes: bank, insurer, ordinary company (control)
// ================================================================================================================================
console.log('\n-- F1 bank, F2 insurer, F3 ordinary company: three real closes after the first one');
{ startWorld(SEED); const B = pickFin(1), I = pickFin(2), P = plain(); pre(!!(B && I && P), 'F1-F3 companies ' + [B, I, P].map(c => c && c.tk).join(' '));
  [B, I, P].forEach(trap); for (const c of [B, I, P]) nextClose(c);
  for (const [lab, c] of [['F1 bank', B], ['F2 insurer', I], ['F3 ordinary', P]]) for (let k = 0; k < 3; k++) { nextClose(c); rowCheck(lab + ' #' + (k + 1), c, 'corrected') } }

// ================================================================================================================================
// F4 cash borrowing and growth in the same quarter; F5 growth 0, negative, extreme
// ================================================================================================================================
console.log('\n-- F4 bank: cash runs short at the close (earn borrows it: real cash borrowing) and the growth of the same quarter');
{ startWorld(SEED); const B = pickFin(1); trap(B); nextClose(B); nextClose(B); toEve(B); const need = B.cs + 50; B.cs -= need; const bk0 = B.bk; nextClose(B);
  pre(B.bk === bk0 && !B.rlf, 'F4 no chapter 11 (bk ' + B.bk + '), cash taken out ' + f2(need));
  const r = rowCheck('F4', B, 'corrected'); pre(r.o.cash > 10 && r.o.G > 10, 'F4 both are there: cash borrowing ' + f2(r.o.cash) + ', growth ' + f2(r.o.G)) }
console.log('\n-- F5 growth rate set right before the close: 0, -0.08, +0.6 (bank and insurer)');
for (const kd of [1, 2]) for (const g of [0, -0.08, 0.6]) { startWorld(SEED); const c = pickFin(kd); trap(c); nextClose(c); nextClose(c); toEve(c); c.g = g; nextClose(c);
  const r = rowCheck('F5 kd ' + kd + ' g ' + g, c, 'corrected'); if (g === 0) ok(r.d.ncG === 0 && r.q.gr === 0, 'F5 g 0: nothing to take out (gr ' + f2(r.q.gr) + ')'); if (g < 0) ok(r.d.ncG < 0, 'F5 negative growth is taken out with its sign (ncG ' + f2(r.d.ncG) + ')') }

// ================================================================================================================================
// F6 FIN-CF-03A bank merger + growth; F7 FIN-CF-01 bank relief + growth
// ================================================================================================================================
console.log('\n-- F6 bank merger (deposits taken over: FIN-CF-03A ncA) and growth in the same quarter');
{ startWorld(SEED); const banksL = S.co.filter(c => !c.dead && c.kd === 1 && !c.priv && !mine(c)).sort((p, q) => mc(q) - mc(p)); const T = banksL[0]; setOwn(T, 'P', 60); ctlAll();
  const x = banksL.find(c => c !== T && mc(c) < mc(T) * .3); setOwn(x, 'P', 55); ctlAll(); trap(T); nextClose(T); nextClose(T); for (let i = 0; i < 30; i++) stepD();
  let tries = 0; for (; tries < 12 && !x.dead; tries++) { S.te = T.id; G.merge(x.id, 60) } pre(x.dead, 'F6 ' + T.tk + ' absorbed ' + x.tk + ' after ' + tries + ' tries');
  nextClose(T); const r = rowCheck('F6', T, 'corrected'); pre(r.o.ncA > 100 && r.o.G > 10, 'F6 both are there: deposits taken over (ncA) ' + f2(r.o.ncA) + ', growth ' + f2(r.o.G)) }
console.log('\n-- F7 bank chapter 11 outside the close (FIN-CF-01 relief R) and growth in the same quarter');
{ startWorld(SEED); const B = pickFin(1); trap(B); nextClose(B); nextClose(B); for (let i = 0; i < 30; i++) stepD();
  const X = B.D - B.cs - B.gw - pfv(B); B.A = 0.7 * X / 1.25 / (1 + B.g / 4); ch11(B, 'forced bank');
  pre(!B.dead && B.ncq > 100, 'F7 relief waiting ' + f2(B.ncq)); nextClose(B); const r = rowCheck('F7', B, 'corrected'); pre(r.o.R > 100 && Math.abs(r.d.nc - r.o.R) <= 1e-6, 'F7 relief in the row: R ' + f2(r.o.R) + ', nc ' + f2(r.d.nc) + ', growth ' + f2(r.o.G)) }

// ================================================================================================================================
// F8 rebuilt rows: a new game's first real close and an export restore's first real close are not corrected; the next ones are
// ================================================================================================================================
console.log('\n-- F8 rows rebuilt by qBack: day-0 rows, the first real close after them, an export restore (first real row part, second full), a full save');
{ startWorld(SEED); const B = pickFin(1); const L0 = fqL(B), D0 = L0.map((q, j) => j ? fqDerive(B, q, L0[j - 1]) : null);
  ok(L0.every(q => q.d < 0) && D0.every(d => !d || d.ncG === 0), 'F8 day 0: the ' + L0.length + ' rebuilt rows (days ' + L0[0].d + '..' + L0[L0.length - 1].d + ') get no correction');
  trap(B); nextClose(B); rowCheck('F8 first real close (previous row rebuilt at day 0)', B, 'kept');
  nextClose(B); rowCheck('F8 second real close', B, 'corrected');
  for (let i = 0; i < 20; i++) stepD(); await restore(0); let C = S.co[B.id]; trap(C); nextClose(C); rowCheck('F8 full save restore, next close', C, 'corrected');
  for (let i = 0; i < 20; i++) stepD(); await restore(1); C = S.co[B.id]; trap(C);
  const Lr = fqL(C); ok(Lr.slice(1).every((q, j) => fqDerive(C, q, Lr[j]).ncG === 0), 'F8 export restore: no rebuilt row is corrected (8 rows, all before the restore day ' + S.day + ')');
  nextClose(C); { const { q, p } = last(C), d = fqDerive(C, q, p); ok(d.st === 'part' && d.ncG === 0, 'F8 export restore, first real row: st ' + d.st + ' (◐), ncG ' + f2(d.ncG) + ' (previous row rebuilt)') }
  nextClose(C); rowCheck('F8 export restore, second real row', C, 'corrected') }

// ================================================================================================================================
// F9 the tab: memo row, 차입 증감 cell, no NaN; ordinary company has no memo row
// ================================================================================================================================
console.log('\n-- F9 the 현금흐름 tab');
{ startWorld(SEED); const B = pickFin(1), P = plain(); trap(B); for (let k = 0; k < 3; k++) nextClose(B); nextClose(P);
  const t = cfTab(B), memo = t.row(MEMO), bor = t.row('차입 증감'), L = fqL(B).slice().reverse(), D = L.map((q, j) => j + 1 < L.length ? fqDerive(B, q, L[j + 1]) : null);
  const wantMemo = D.map(d => d && d.ncG ? fN(d.ncG) : '–'), wantB = D.map((d, j) => !d || d.cff == null ? '' : (d.st === 'part' ? '◐' : '') + fN(borrowOf(L[j], d)));
  ok(t.clean && memo && memo.slice(0, 3).join('|') === wantMemo.slice(0, 3).join('|') && memo[0] === fN(L[0].gr), 'F9 bank: memo row ' + JSON.stringify(memo && memo.slice(0, 4)) + ' = row gr of the corrected quarters ' + JSON.stringify(wantMemo.slice(0, 4)));
  ok(bor && bor.slice(0, 3).join('|') === wantB.slice(0, 3).join('|'), 'F9 bank: 차입 증감 cells ' + JSON.stringify(bor && bor.slice(0, 3)) + ' = ' + JSON.stringify(wantB.slice(0, 3)));
  const tp = cfTab(P); ok(tp.clean && tp.row(MEMO) == null, 'F9 ordinary company: no memo row') }

// ================================================================================================================================
// F10 a row without a usable gr (missing / not finite): ncG 0, no NaN
// ================================================================================================================================
console.log('\n-- F10 rows without a usable gr');
{ startWorld(SEED); const B = pickFin(1); nextClose(B); nextClose(B); const { q, p } = last(B);
  for (const [lab, v] of [['missing', undefined], ['NaN', NaN], ['Infinity', Infinity], ['null', null]]) { const q2 = Object.assign({}, q, { gr: v }), d = fqDerive(B, q2, p);
    ok(d.ncG === 0 && [d.cff, d.oth].every(Number.isFinite) && Math.abs(d.cff - (q.D - p.D + d.nc - d.ncA - q.dv + d.iss)) <= TOLI, 'F10 gr ' + lab + ': ncG 0, 재무 ' + f2(d.cff) + ' (dD unchanged), 기타 ' + f2(d.oth)) } }

// ================================================================================================================================
// F11 natural census: every real close of every financial company, one seed x 720 days
// ================================================================================================================================
console.log('\n-- F11 census: seed 777, 720 days, every financial company, every close whose previous row is a real fully recorded close');
{ startWorld(777); const fin = S.co.filter(c => c.kd && !c.dead); fin.forEach(trap); const seen = new Map(); let n = 0, bad = [], kept = 0;
  for (let d = 0; d < 720; d++) { stepD();
    for (const c of fin) { if (c.dead || !c.fq || c.fq.length < 2) continue; const qd = c.fq[c.fq.length - 1][0]; if (seen.get(c.id) === qd) continue; seen.set(c.id, qd);
      const { q, p } = last(c), x = fqDerive(c, q, p); if (!(p.d > 0) || x.st !== 'full') { kept++; continue }
      const o = oracle(c, p, q), b = borrowOf(q, x); n++; if (x.ncG !== q.gr || Math.abs(b - o.cash) > tolRow(q, p, o.G) + 1e-9) bad.push(c.tk + '@' + q.d + ' 차입 ' + f2(b) + ' cash ' + f2(o.cash) + ' ncG ' + f2(x.ncG)) } }
  pre(n > 200, 'F11 ' + n + ' corrected closes checked (' + kept + ' closes after a rebuilt / partly recorded row skipped)');
  ok(!bad.length, 'F11 every corrected close: ncG = row gr and 차입 증감 = measured cash borrowing within the row rounding' + (bad.length ? ': ' + bad.length + ' off, e.g. ' + bad.slice(0, 4).join('; ') : '')) }

console.log('\nerrs', errs, 'fails', fails);
})().catch(e => { console.log('ERR exception ' + (e && e.stack || e)); console.log('errs', 1, 'fails', 0) });
