// FIN-CF-02-SAVE-01 (option A1, approved 2026-10-24; design docs/FIN-CF-02-SAVE-01-DESIGN.md, GPT-6 independent design review PASS): restoring an
// EXPORT save must not count a share trade or a chapter-11 debt relief made before the save a second time in the first real quarter after the restore.
// Written first as failing tests on main d82f847 (log verify/fin-cf-02-save01/test_on_main_d82f847_2026-10-24.log), then the change was made.
//
// THE DEFECT (main d82f847): an export save (packS(1): code copy, cloud, file) leaves the quarter rows fq out. On restore v8fix -> v11prep -> bfill ->
// qBack (src/sim.js) rebuilds 8 past rows from the state AT THE RESTORE (cash, debt and assets x one scale per row, shares unscaled), so the rebuilt
// previous quarter already holds every share trade and every chapter-11 relief made before the save. qBack reset the ledger starts (isd, cfd) and dropped
// the confirmed records (isq, rlf) but KEPT the pending amounts: eqq (FIN-CF-02 share-issue cash) and ncq (FIN-CF-01 relief). The first real close then
// confirmed them and the statement counted them again: 증자·출자 / 재무활동 +X with 기타 -X, or 차입 증감 / 재무활동 +R with 기타 -R.
// THE RULE (A1): qBack sets eqq = 0 and ncq = 0 for every company whose rows it rebuilds (not c.priv && c.fo, which it skips). A full save (rows kept,
// qBack does not run) keeps both pending amounts as before. A trade made after the restore is recorded as usual.
//
// WHERE THE EXPECTED VALUES COME FROM (nothing is taken from the statement code):
//  - X: cash of a share trade before the save, Z: cash of a share trade after the restore, both = (cs after - cs before) - (D after - D before) around
//    the real game call (the FIN-CF-02 test convention). R: debt before - debt after around ch11x (wrapped only to read the numbers).
//  - the premise of each export case is checked on the rebuilt previous row P against the state at the restore (cs_L, D_L, A_L, sh_L): its scale is
//    read back from its assets (sc = P.A / A_L); P.sh = round(sh_L); P.cs = cs_L x sc; P.D = D_L x sc; i.e. the previous quarter already holds the trade.
//  - the expected row: 증자·출자 = Z; 재무활동 = dD + R - ncA - dv + Z; 기타 = (q.cs - p.cs) - cfo + capex - 재무활동 - maN - inN; 차입 증감 = dD + R - ncA,
//    with dD, dv, cfo, capex from the two rows (the same formula as rowCheck in t_fincf02_issue.js); R = the relief that belongs to the row.
//  - preconditions (pre: ERR FIXTURE INVALID) are kept apart from the computed checks (ok: FAIL), so a broken scenario is never counted as a pass or a fail.
// Tolerances: TOLI 0.01 for amounts the ledgers keep unrounded (float noise only); TOLB 1.5 for the premise check on the rounded rebuilt rows (whole
// numbers, scale read back from a rounded number), while every trade checked is far bigger (> 100) than TOLB.
let errs = 0, fails = 0;
(async () => {
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ };
const pre = (c, m) => { console.log((c ? 'pre  ' : 'ERR  FIXTURE INVALID: ') + m); if (!c) errs++ };
const info = m => console.log('info ' + m);
const TOLI = .01, TOLB = 1.5;
const f2 = x => x == null ? 'n/a' : (Math.abs(x) < 1e-9 ? 0 : +x).toFixed(2);
const mulb = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const SEED = 20261016;

// ---- harness ------------------------------------------------------------------------------------------------------------------------------
// relief ledger: ch11x wrapped only to read the debt before and after (the game code runs unchanged)
const RL = []; { const x0 = ch11x; ch11x = function (c, why) { const D0 = c.D; x0(c, why); RL.push({ id: c.id, day: S.day, R: c.dead ? null : D0 - c.D }) } }
function startWorld(seed) { Math.random = mulb(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; RL.length = 0 }
const plain = c => !c.dead && !c.kd && !c.priv && !mine(c) && !c.own.P && c.bk === 0 && c.A > 3000;
const pickTarget = skip => S.co.find(c => plain(c) && !(skip || []).includes(c.id));                                       // as t_fincf02_issue.js
const pickLoan = skip => S.co.find(c => plain(c) && c.ln >= 0 && S.co[c.ln] && !S.co[c.ln].dead && S.co[c.ln].kd === 1 && !(skip || []).includes(c.id)); // as t_fincf01_relief.js
const mkMine = T => { setOwn(T, 'P', 60); ctlAll(); return mine(T) };
function nextClose(T) { const l0 = T.fq && T.fq[T.fq.length - 1]; for (let i = 0; i < 400 && !T.dead; i++) { step(); if (T.fq && T.fq[T.fq.length - 1] !== l0) return true } return false }
const lastD = T => T.fq[T.fq.length - 1][0];
const daysToClose = T => 90 - ((S.day - lastD(T)) % 90);
const waitDays = (T, n) => { const w = Math.max(0, Math.min(n, daysToClose(T) - 1)); for (let i = 0; i < w; i++) step() };
const measure = (T, act) => { const c0 = T.cs, d0 = T.D, s0 = T.sh; act(T); return { X: (T.cs - c0) - (T.D - d0), dsh: T.sh - s0, sh: T.sh } };
const issue = T => measure(T, c => G.mg(c.id, 'iss', .1)), buyback = T => measure(T, c => G.mg(c.id, 'bb', 5));
const defic = c => { const X = c.D - c.cs - c.gw - pfv(c); c.A = 0.7 * X / 1.25 / (1 + c.g / 4) };                       // as t_fincf01_relief.js
// restores: export = packS(1) -> loadStr -> v8fix (what the paste / cloud / file paths run); full = the same with packS() (slots, autosave)
const restore = async strip => { const txt = await packS(strip), s = await loadStr(txt); S = s; v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null; return txt };
// the real paste path: the import dialog (G.imp) and its handler (mcb) with the code in the text box, as a player does it
async function pasteRestore(txt) { const s0 = S; G.imp(); document.getElementById('ipt').value = txt; await mcb(); return S !== s0 }
const atLoad = T => ({ cs: T.cs, D: T.D, A: T.A, sh: T.sh, day: S.day, bk: T.bk });
// share-count trap: records the calling game functions of every change of c.sh (as the NAT case of t_fincf02_issue.js)
const fnames = () => new Error().stack.split('\n').slice(2, 9).map(l => (l.match(/at (?:Object\.)?([\w$.]+)/) || [])[1]).filter(Boolean);
function trapSh(c) { let v = c.sh; const w = []; Object.defineProperty(c, 'sh', { configurable: true, enumerable: true, get() { return v }, set(x) { if (Math.abs(x - v) > 1e-9) w.push(fnames()); v = x } }); return { w, off() { Object.defineProperty(c, 'sh', { configurable: true, enumerable: true, writable: true, value: v }) } } }
const lastRows = T => { const L = fqL(T); return { q: L[L.length - 1], p: L[L.length - 2], L } };
// premise of an export case: the rebuilt previous row is made from the state at the restore, which already holds the trade (amount, field)
function rebuiltHolds(lab, T, ld, amt, key) {
  const L = fqL(T), P = L[L.length - 1], sc = P.A / ld.A, v = key === 'D' ? ld.D : ld.cs, w = v * sc, wo = (v - amt) * sc;
  pre(L.length === 8 && P.d === ld.day - 90 && P.sh === Math.round(ld.sh) && Math.abs(P[key === 'D' ? 'D' : 'cs'] - w) <= TOLB && Math.abs(P[key === 'D' ? 'D' : 'cs'] - wo) > 50,
    lab + ': the 8 rows are rebuilt; the previous quarter (day ' + P.d + ') is made from the state at the restore: shares ' + P.sh + ' = ' + f2(ld.sh) + ', ' + (key === 'D' ? 'debt' : 'cash') + ' ' + P[key === 'D' ? 'D' : 'cs'] + ' = ' + f2(v) + ' x ' + sc.toFixed(5) + ' = ' + f2(w) + ' (without the ' + (key === 'D' ? 'relief' : 'trade') + ' it would be ' + f2(wo) + ')');
  return { P, sc };
}
// the expected row from the two rows and the measured amounts (independent of fqDerive); A = { ncA, maN, inN } of FIN-CF-03A, 0 unless given
function expectRow(lab, T, q, p, Z, R, A) {
  A = Object.assign({ ncA: 0, maN: 0, inN: 0 }, A || {});
  const d = fqDerive(T, q, p), dep = T.kd ? 0 : q.A * .02, cfo = q.ni - q.eq + q.ga + dep + (q.imp || 0) + (q.wo || 0), capex = T.kd ? 0 : q.gr + dep;
  const dD = q.D - p.D, borrowW = dD + R - A.ncA, cffW = borrowW - q.dv + Z, dc = q.cs - p.cs, othW = dc - cfo + capex - cffW - A.maN - A.inN;
  console.log(`  ${lab}: ${T.tk} row ${q.d} vs ${p.d} | measured: share cash after the restore Z ${f2(Z)}, relief in the row R ${f2(R)} | statement 증자·출자 ${f2(d.iss)}, 차입 증감 ${f2(d.cff + q.dv - d.iss)}, 재무활동 ${f2(d.cff)}, 기타 ${f2(d.oth)}, 현금 증감 ${f2(d.dc)}, nc ${f2(d.nc)}, est ${d.est}, st ${d.st}`);
  ok(Math.abs(d.iss - Z) <= TOLI && d.est === false, lab + ': 증자·출자(자사주) ' + f2(d.iss) + ' = cash of share trades after the restore ' + f2(Z) + ', not an estimate');
  ok(Math.abs(d.nc - R) <= TOLI && Math.abs((d.cff + q.dv - d.iss) - borrowW) <= TOLI, lab + ': 차입 증감 ' + f2(d.cff + q.dv - d.iss) + ' = dD ' + f2(dD) + ' + R ' + f2(R) + (A.ncA ? ' - ncA ' + f2(A.ncA) : '') + ' = ' + f2(borrowW) + ' (nc ' + f2(d.nc) + ')');
  ok(Math.abs(d.cff - cffW) <= TOLI && Math.abs(d.oth - othW) <= TOLI && Math.abs(d.dc - dc) <= 1e-9, lab + ': 재무활동 ' + f2(d.cff) + ' = ' + f2(cffW) + ', 기타·투자 매매 ' + f2(d.oth) + ' = ' + f2(othW) + ' (현금 증감 ' + f2(dc) + ' unchanged)');
  return { d, cffW, othW, borrowW, dc };
}
// the 현금흐름 tab as the player sees it (same helper as t_fincf01_relief.js); column 0 = the newest quarter
function cfTab(c) {
  sel = -1; pg = ''; tab = 'h'; S.spd = 0; G.pick(c.id); G.stab('f'); G.fseg(3); render();
  const h = document.getElementById('sh').innerHTML, row = lab => { const part = h.split('<td>' + lab + '</td>')[1]; return part == null ? null : [...part.split('</tr>')[0].matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m => m[1]) };
  return { h, clean: !/NaN|undefined|Infinity|\[object/.test(h), row, text: h.replace(/<[^>]*>/g, '') };
}
// the newest column of the tab against the expected row; ◐ = FIN-CF-03A partly recorded quarter (prev.d <= acd < q.d), from acd and the row days
function uiRow(lab, T, q, p, Z, e) {
  const t = cfTab(T), cell = n => (t.row(n) || [])[0], h = T.acd != null && p.d <= T.acd && q.d > T.acd ? '◐' : '', bad = [];
  const want = { '증자·출자(자사주)': Z ? fN(Z) : '–', '차입 증감': h + fN(e.borrowW), '재무활동 현금흐름': h + fN(e.cffW), '기타·투자 매매': h + fN(e.othW), '현금 증감': fN(e.dc) };
  for (const n in want) if (cell(n) !== want[n]) bad.push(n + ' shows ' + cell(n) + ' want ' + want[n]);
  const note = /※ ◐ 부분 기록 분기\(([^)]*)\)/.exec(t.text);
  if (h && !(note && note[1].includes(qLab(q.d)))) bad.push('no ◐ footnote naming ' + qLab(q.d));
  if (!h && note && note[1].includes(qLab(q.d))) bad.push('◐ footnote names ' + qLab(q.d) + ' although it is not partly recorded');
  if (/≈/.test(Object.keys(want).map(cell).join(''))) bad.push('≈ shown');
  ok(t.clean && !bad.length, lab + ' UI: newest column ' + Object.keys(want).map(n => n + ' ' + cell(n)).join(' | ') + (h ? ' | ◐ footnote ' + qLab(q.d) : '') + (bad.length ? ' | ' + bad.join('; ') : ''));
}
console.log('-- harness ready');

// ================================================================================================================================
// S1 the reported case (460.60) through the real export and paste functions; S12 its tab
// ================================================================================================================================
console.log('\n-- S1 rights issue 5 days after the close, packS(1) export 10 days after the close, paste restore (G.imp + mcb), first real close');
{
  startWorld(SEED); let T = pickTarget(); pre(!!T && mkMine(T), 'S1 target ' + (T && T.tk) + ' controlled by the player'); const id = T.id;
  nextClose(T); nextClose(T); const C = lastD(T); for (let i = 0; i < 5; i++) step();
  const m = issue(T); pre(Math.abs(m.X - 460.60) < .01 && m.dsh > 0 && Math.abs(T.eqq - m.X) <= TOLI, 'S1 issue on day ' + S.day + ': cash X ' + f2(m.X) + ' (the reported 460.60), waiting in eqq ' + f2(T.eqq));
  while (S.day < C + 10) step();
  const txt = await packS(1); pre(/^WSR1:/.test(txt) && !/"fq"/.test(txt), 'S1 export code written by packS(1) (WSR1:, ' + txt.length + ' chars)');
  const done = await pasteRestore(txt); T = S.co[id]; const ld = atLoad(T);
  pre(done && T && S.day === C + 10, 'S1 the paste handler replaced the game with the code (day ' + S.day + ')');
  ok(T.eqq === 0, 'S1 after the restore the pending issue cash is 0: eqq ' + f2(T.eqq) + ' (X ' + f2(m.X) + ' is inside the rebuilt quarters)');
  rebuiltHolds('S1', T, ld, m.X, 'cs');
  nextClose(T); const { q, p } = lastRows(T);
  pre(q.sh === Math.round(ld.sh) && p.d === ld.day - 90, 'S1 no share trade after the restore (shares at the close ' + q.sh + ' = at the restore ' + f2(ld.sh) + '), so Z = 0');
  const e = expectRow('S1', T, q, p, 0, 0);
  ok(!(T.isq && T.isq[q.d]), 'S1 nothing was confirmed for the first real quarter: isq ' + JSON.stringify(T.isq));
  uiRow('S1/S12', T, q, p, 0, e);
}

// ================================================================================================================================
// S2 buyback (negative cash), S3 X before + Z after, S4 Z on the restore day
// ================================================================================================================================
console.log('\n-- S2 buyback 5%, export, restore');
{
  startWorld(SEED); let T = pickTarget(); mkMine(T); const id = T.id; T.cs += T.A; nextClose(T); nextClose(T); waitDays(T, 30);
  const m = buyback(T); pre(m.X < -100 && m.dsh < 0 && Math.abs(T.eqq - m.X) <= TOLI, 'S2 buyback cash ' + f2(m.X) + ' waiting in eqq');
  await restore(1); T = S.co[id]; const ld = atLoad(T);
  ok(T.eqq === 0, 'S2 after the export restore eqq ' + f2(T.eqq) + ' (the buyback is inside the rebuilt quarters)');
  rebuiltHolds('S2', T, ld, m.X, 'cs');
  nextClose(T); const { q, p } = lastRows(T); pre(q.sh === Math.round(ld.sh), 'S2 no share trade after the restore (Z = 0)');
  expectRow('S2', T, q, p, 0, 0);
}
console.log('\n-- S3 issue X before the export, issue Z 10 days after the restore');
{
  startWorld(SEED); let T = pickTarget(); mkMine(T); const id = T.id; nextClose(T); nextClose(T); waitDays(T, 20);
  const mX = issue(T); pre(mX.X > 100, 'S3 X ' + f2(mX.X));
  await restore(1); T = S.co[id]; const ld = atLoad(T); rebuiltHolds('S3', T, ld, mX.X, 'cs');
  for (let i = 0; i < 10; i++) step(); const mZ = issue(T); pre(mZ.X > 100 && daysToClose(T) > 0, 'S3 Z ' + f2(mZ.X) + ' on day ' + S.day + ', before the close');
  ok(Math.abs(T.eqq - mZ.X) <= TOLI, 'S3 waiting after the restore: only Z ' + f2(T.eqq) + ' (X ' + f2(mX.X) + ' is not)');
  nextClose(T); const { q, p } = lastRows(T); pre(q.sh === Math.round(mZ.sh), 'S3 no other share trade (shares ' + q.sh + ' = after Z ' + f2(mZ.sh) + ')');
  expectRow('S3', T, q, p, mZ.X, 0);
}
console.log('\n-- S4 issue X before the export, issue Z on the restore day right after the restore (no day passes)');
{
  startWorld(SEED); let T = pickTarget(); mkMine(T); const id = T.id; nextClose(T); nextClose(T); waitDays(T, 30);
  const mX = issue(T); await restore(1); T = S.co[id]; const ld = atLoad(T); rebuiltHolds('S4', T, ld, mX.X, 'cs');
  const mZ = issue(T); pre(S.day === ld.day && mZ.X > 100, 'S4 Z ' + f2(mZ.X) + ' on the restore day ' + S.day + ' (X ' + f2(mX.X) + ')');
  nextClose(T); const { q, p } = lastRows(T); pre(q.sh === Math.round(mZ.sh), 'S4 no other share trade');
  const e = expectRow('S4', T, q, p, mZ.X, 0);
  uiRow('S4', T, q, p, mZ.X, e);
}

// ================================================================================================================================
// S5 / S6 close-day boundaries
// ================================================================================================================================
console.log('\n-- S5 boundaries with a trade waiting at the export (a: one day before the close, c: same day right after the close, d: two exports)');
for (const [lab, prep] of [
  ['S5a', async T => { waitDays(T, 200); const m = issue(T); pre(daysToClose(T) === 1, 'S5a issue and export on day ' + S.day + ', the day before the close'); return m }],
  ['S5c', async T => { waitDays(T, 200); nextClose(T); const m = issue(T); pre(S.day === lastD(T), 'S5c the close of day ' + S.day + ' ran, then the issue, then the export the same day'); return m }],
  ['S5d', async T => { waitDays(T, 20); const m = issue(T); const id = T.id; await restore(1); pre(S.co[id].eqq === 0 || S.co[id].eqq > 100, 'S5d first export and restore done (eqq ' + f2(S.co[id].eqq) + ')'); return m }]]) {
  startWorld(SEED); let T = pickTarget(); mkMine(T); const id = T.id; nextClose(T); nextClose(T);
  const m = await prep(T); T = S.co[id]; pre(m.X > 100, lab + ' X ' + f2(m.X));
  await restore(1); T = S.co[id]; const ld = atLoad(T);
  ok(T.eqq === 0, lab + ' after the export restore eqq ' + f2(T.eqq));
  rebuiltHolds(lab, T, ld, m.X, 'cs');
  nextClose(T); const { q, p } = lastRows(T); pre(q.sh === Math.round(ld.sh), lab + ' no share trade after the restore (Z = 0)');
  expectRow(lab, T, q, p, 0, 0);
}
console.log('\n-- S6 boundaries with nothing waiting (controls: b no trade, export right after the close; e the close confirmed the trade before the export)');
for (const [lab, prep] of [
  ['S6b', async T => { waitDays(T, 200); nextClose(T); return 0 }],
  ['S6e', async T => { waitDays(T, 20); issue(T); nextClose(T); return 0 }]]) {
  startWorld(SEED); let T = pickTarget(); mkMine(T); const id = T.id; nextClose(T); nextClose(T);
  await prep(T); pre(T.eqq === 0 && T.ncq === 0, lab + ' nothing waiting at the export (eqq ' + f2(T.eqq) + ')');
  await restore(1); T = S.co[id]; const ld = atLoad(T);
  ok(T.eqq === 0 && T.isq == null, lab + ' after the restore: eqq ' + f2(T.eqq) + ', confirmed records dropped with the real rows (isq ' + JSON.stringify(T.isq) + ')');
  nextClose(T); const { q, p } = lastRows(T); pre(q.sh === Math.round(ld.sh), lab + ' no share trade after the restore');
  expectRow(lab, T, q, p, 0, 0);
}

// ================================================================================================================================
// S7 full save keeps the pending amount (rows kept, qBack does not run)
// ================================================================================================================================
console.log('\n-- S7 control: the same trade through a FULL save (packS(), autosave and slots)');
{
  startWorld(SEED); let T = pickTarget(); mkMine(T); const id = T.id; nextClose(T); nextClose(T); const C = lastD(T); waitDays(T, 30);
  const m = issue(T); await restore(0); T = S.co[id];
  ok(Math.abs(T.eqq - m.X) <= TOLI && lastD(T) === C, 'S7 after the full restore the pending cash is kept: eqq ' + f2(T.eqq) + ' = X ' + f2(m.X) + ', real rows kept (last ' + lastD(T) + ')');
  nextClose(T); const { q, p } = lastRows(T); pre(p.d === C && q.sh === Math.round(m.sh), 'S7 the previous row is the real close ' + C + ' (before the trade); no other share trade');
  expectRow('S7', T, q, p, m.X, 0);
  ok(T.isq && Math.abs((T.isq[q.d] || 0) - m.X) <= TOLI, 'S7 the close confirmed X: isq ' + JSON.stringify(T.isq));
}

// ================================================================================================================================
// S8 natural play: AI companies with a waiting amount at an export (AI events, bank capital raises)
// ================================================================================================================================
console.log('\n-- S8 natural play (no player action), export at a day with AI companies waiting');
for (const [seed, day] of [[SEED, 540], [12345, 555]]) {
  startWorld(seed); for (let d = 0; d < day; d++) step();
  const pend = S.co.filter(c => !c.dead && c.eqq).map(c => ({ id: c.id, tk: c.tk, eqq: c.eqq, mine: mine(c) }));
  pre(pend.length > 0 && pend.every(x => !x.mine), 'S8 seed ' + seed + ' day ' + S.day + ': AI companies waiting ' + pend.map(x => x.tk + ' ' + f2(x.eqq)).join(', '));
  await restore(1); const ld = {}; for (const x of pend) ld[x.id] = atLoad(S.co[x.id]); const L0 = S.day;
  ok(pend.every(x => S.co[x.id].eqq === 0), 'S8 seed ' + seed + ' after the export restore nothing waits: ' + pend.map(x => x.tk + ' ' + f2(S.co[x.id].eqq)).join(', '));
  // play until every one of them has closed once after the restore (fewer than 91 days, so none closes twice); traps on the share count record
  // which game function changed it: a split (splitDo, AI splits of non-player companies) moves no cash, anything else would be a share trade
  const closed = c => c.dead || fqL(c).some(r => r.d > L0), tr = {}; for (const x of pend) tr[x.id] = trapSh(S.co[x.id]);
  for (let n = 0; n < 100 && !pend.every(x => closed(S.co[x.id])); n++) step();
  for (const x of pend) tr[x.id].off();
  for (const x of pend) {
    const c = S.co[x.id]; if (c.dead) { info('S8 ' + x.tk + ' died before its first close'); continue }
    const L = fqL(c), j = L.findIndex(r => r.d > L0), q = L[j], p = L[j - 1], w = tr[x.id].w, splits = w.filter(st => st.includes('splitDo')).length;
    pre(j > 0 && p.d === L0 - 90 && w.length === splits && c.bk === ld[x.id].bk && !mine(c), 'S8 ' + x.tk + ': first real row ' + (q && q.d) + ' after the rebuilt ' + (p && p.d) + '; share-count changes after the restore ' + w.length + ' (splits ' + splits + ', no cash), no chapter 11 (bk ' + c.bk + ') -> Z = 0, R = 0');
    if (j > 0) expectRow('S8 seed ' + seed + ' ' + x.tk + (c.kd ? ' (financial)' : ''), c, q, p, 0, 0);
  }
}

// ================================================================================================================================
// S9 a company the player founded (c.priv && c.fo): qBack returns at once, nothing changes
// ================================================================================================================================
console.log('\n-- S9 founded private company with a cash contribution waiting at the export (qBack does not touch it)');
{
  startWorld(SEED); S.cash = 1e6; G.fdOpen(); FD.sec = 3; FD.cap = 300; FD.fo = 'P'; G.fdGo(); let c = S.co[S.co.length - 1]; const id = c.id;
  pre(c.priv && c.fo, 'S9 founded ' + c.tk + ' (priv ' + c.priv + ', fo ' + c.fo + ')');
  nextClose(c); nextClose(c); waitDays(c, 20);
  const m = measure(c, x => { MV = { fr: 'P', to: x.id, how: 'cap', amt: 50, y: -1, f: 1 }; G.mvGo() }); pre(Math.abs(m.X - 50) < 1e-9 && Math.abs(c.eqq - 50) < 1e-9, 'S9 contribution 50 waiting');
  await restore(1); c = S.co[id];
  ok(Math.abs(c.eqq - 50) < 1e-9 && (c.fq || []).length === 0, 'S9 qBack skipped it: eqq ' + f2(c.eqq) + ' kept, rows not rebuilt (' + (c.fq || []).length + ')');
  nextClose(c); ok(c.fq.length === 1 && c.isq && Math.abs(c.isq[lastD(c)] - 50) < 1e-9, 'S9 first close: one row without a previous row (no cash-flow column), the contribution recorded under it: isq ' + JSON.stringify(c.isq));
  nextClose(c); const { q, p } = lastRows(c); ok(Math.abs(fqDerive(c, q, p).iss) <= TOLI, 'S9 second close: 증자·출자 ' + f2(fqDerive(c, q, p).iss));
}

// ================================================================================================================================
// S10 export restore, then a full save of that state (what the paste / cloud / file paths write at once), restored
// ================================================================================================================================
console.log('\n-- S10 export restore -> trade Z -> full save -> full restore (the autosave chain)');
{
  startWorld(SEED); let T = pickTarget(); mkMine(T); const id = T.id; nextClose(T); nextClose(T); waitDays(T, 30);
  const mX = issue(T); await restore(1); T = S.co[id]; const ld = atLoad(T); rebuiltHolds('S10', T, ld, mX.X, 'cs');
  const mZ = issue(T); await restore(0); T = S.co[id];
  ok(Math.abs(T.eqq - mZ.X) <= TOLI, 'S10 the full save keeps what waits after the export restore: eqq ' + f2(T.eqq) + ' = Z ' + f2(mZ.X) + ' (X ' + f2(mX.X) + ' is not waiting)');
  nextClose(T); const { q, p } = lastRows(T); pre(q.sh === Math.round(mZ.sh), 'S10 no other share trade');
  expectRow('S10', T, q, p, mZ.X, 0);
}

// ================================================================================================================================
// S11 day 0
// ================================================================================================================================
console.log('\n-- S11 issue on day 0, export and restore on day 0 (qBack keeps the FIN-CF-03A start on day 0)');
{
  startWorld(SEED); let T = pickTarget(); mkMine(T); const id = T.id; const m = issue(T); pre(S.day === 0 && m.X > 100, 'S11 issue on day 0: X ' + f2(m.X));
  await restore(1); T = S.co[id]; const ld = atLoad(T);
  ok(T.eqq === 0 && T.acd === -721, 'S11 after the restore eqq ' + f2(T.eqq) + ', FIN-CF-03A start unchanged on day 0 (acd ' + T.acd + ')');
  rebuiltHolds('S11', T, ld, m.X, 'cs');
  nextClose(T); const { q, p } = lastRows(T); pre(q.sh === Math.round(ld.sh), 'S11 no share trade after the restore');
  const e = expectRow('S11', T, q, p, 0, 0); ok(e.d.st === 'full', 'S11 the first real row is fully recorded (st ' + e.d.st + '): no ◐ on day 0'); uiRow('S11', T, q, p, 0, e);
}

// ================================================================================================================================
// S13 FIN-CF-03A: an acquisition and a share issue both waiting at the export
// ================================================================================================================================
console.log('\n-- S13 stock merger (FIN-CF-03A record waiting) and a rights issue in the same quarter, export, restore');
{
  startWorld(SEED); let T = pickTarget(); mkMine(T); const id = T.id; nextClose(T); nextClose(T); waitDays(T, 30);
  const x = S.co.find(c => !c.dead && !c.priv && !c.kd && c !== T && !mine(c) && mc(c) < mc(T) * .3 && c.i !== HOLD); setOwn(x, 'P', 55); ctlAll(); S.te = T.id; G.merge(x.id, 40);
  pre(x.dead && T.acq && (T.acq.aD + T.acq.iD) > 100, 'S13 ' + T.tk + ' absorbed ' + x.tk + ': acquisition record waiting ' + JSON.stringify(T.acq && { aD: +f2(T.acq.aD), iD: +f2(T.acq.iD) }));
  const m = issue(T); pre(m.X > 100, 'S13 issue X ' + f2(m.X));
  await restore(1); T = S.co[id]; const ld = atLoad(T);
  ok(T.acq == null && T.acr == null && T.acd === ld.day, 'S13 FIN-CF-03A as before: acquisition record dropped (acq ' + JSON.stringify(T.acq) + '), ledger start = restore day (acd ' + T.acd + ')');
  ok(T.eqq === 0, 'S13 eqq ' + f2(T.eqq) + ' after the restore');
  rebuiltHolds('S13', T, ld, m.X, 'cs');
  nextClose(T); const { q, p } = lastRows(T); pre(q.sh === Math.round(ld.sh), 'S13 no share trade after the restore');
  const e = expectRow('S13', T, q, p, 0, 0);
  ok(e.d.st === 'part' && e.d.ncA === 0 && e.d.maN === 0 && e.d.inN === 0, 'S13 FIN-CF-03A row as before: partly recorded (st ' + e.d.st + '), no acquisition amounts (ncA ' + f2(e.d.ncA) + ', maN ' + f2(e.d.maN) + ', inN ' + f2(e.d.inN) + ')');
  uiRow('S13', T, q, p, 0, e);
}

// ================================================================================================================================
// S14 / S15 FIN-CF-01: a chapter-11 relief waiting at the save (the loan-call path, outside the close)
// ================================================================================================================================
console.log('\n-- S14 loan call -> chapter 11 outside the close (relief waiting), export, restore (the 1,786.57 case)');
for (const [lab, strip] of [['S14 export', 1], ['S15 full save (control)', 0]]) {
  startWorld(SEED); let T = pickLoan(); const id = T.id; pre(!!T, lab + ' target ' + (T && T.tk) + ' with bank lender ' + (T && S.co[T.ln].tk));
  nextClose(T); nextClose(T); const C = lastD(T); waitDays(T, 30);
  const D0 = T.D, n0 = RL.length; T.cs = 0; defic(T); const paid = callLoan(S.co[T.ln], T, 1); const rel = RL.slice(n0).filter(r => r.id === id && r.R != null), R = rel.reduce((a, r) => a + r.R, 0);
  pre(rel.length === 1 && Math.abs(R - 1786.57) < .01 && Math.abs(T.ncq - R) <= TOLI && T.rlf == null, lab + ': loan call paid ' + f2(paid) + ', chapter 11 on day ' + S.day + ': relief R ' + f2(R) + ' (measured around ch11x; debt ' + f2(D0) + ' -> ' + f2(T.D) + '), waiting in ncq');
  await restore(strip); T = S.co[id]; const ld = atLoad(T);
  if (strip) {
    ok(T.ncq === 0 && T.rlf == null, lab + ': after the export restore ncq ' + f2(T.ncq) + ', no relief record (rlf ' + JSON.stringify(T.rlf) + ')');
    rebuiltHolds(lab, T, ld, -R, 'D');
  } else ok(Math.abs(T.ncq - R) <= TOLI && lastD(T) === C, lab + ': after the full restore the relief still waits: ncq ' + f2(T.ncq) + ', real rows kept');
  nextClose(T); const { q, p } = lastRows(T); pre(q.sh === Math.round(ld.sh) && T.bk === ld.bk, lab + ': no share trade and no further chapter 11 after the restore');
  const Rrow = strip ? 0 : R;
  ok(strip ? T.rlf == null : (T.rlf && T.rlf.d === q.d && Math.abs(T.rlf.R - R) <= TOLI), lab + ': relief record after the close ' + JSON.stringify(T.rlf) + (strip ? ' (none: the relief is inside the rebuilt quarters)' : ' (the relief belongs to this quarter)'));
  const e = expectRow(lab, T, q, p, 0, Rrow);
  if (strip) uiRow(lab, T, q, p, 0, e);
}

// ================================================================================================================================
// S16 control: amounts already CONFIRMED by a close (isq, rlf) go with the real rows at a later export (unchanged rule). With A1 the export cases of
// t_fincf02_issue.js (SV, line 187) and t_fincf01_relief.js (SV (b)) no longer start from a record carried over from before the first export, so
// this case keeps both records alive explicitly.
// ================================================================================================================================
console.log('\n-- S16 control: an issue and a relief in one quarter, confirmed by the close, then an export: the records go with the real rows');
{
  startWorld(SEED); let T = pickLoan(); mkMine(T); const id = T.id; nextClose(T); nextClose(T); waitDays(T, 30);
  const m = issue(T), n0 = RL.length; T.cs = 0; defic(T); callLoan(S.co[T.ln], T, 1); const R = RL.slice(n0).filter(r => r.id === id && r.R != null).reduce((a, r) => a + r.R, 0);
  pre(m.X > 100 && R > 100 && !T.dead, 'S16 ' + T.tk + ': issue X ' + f2(m.X) + ' and relief R ' + f2(R) + ' waiting in the same quarter');
  nextClose(T); const d1 = lastD(T);
  pre(T.isq && Math.abs(T.isq[d1] - m.X) <= TOLI && T.rlf && T.rlf.d === d1 && Math.abs(T.rlf.R - R) <= TOLI && T.eqq === 0 && T.ncq === 0, 'S16 the close of day ' + d1 + ' confirmed both: isq ' + JSON.stringify(T.isq) + ', rlf ' + JSON.stringify(T.rlf));
  await restore(1); T = S.co[id]; const L = fqL(T), D = L.map((x, j) => j ? fqDerive(T, x, L[j - 1]) : null);
  ok(T.isq == null && T.rlf == null && T.eqq === 0 && T.ncq === 0 && D.every(x => !x || (x.iss === 0 && x.nc === 0)), 'S16 after the export restore the confirmed records went with the real rows (isq ' + JSON.stringify(T.isq) + ', rlf ' + JSON.stringify(T.rlf) + '); no rebuilt quarter shows an issue or a relief');
}

// ================================================================================================================================
// FIX-OLD an export code written by the game BEFORE the fix (main d82f847; tests/fixtures/README.md), pasted into this build
// ================================================================================================================================
console.log('\n-- FIX-OLD export code written before the fix (pending issue cash on PNPL, pending relief on MCSF), paste restore, first closes');
{
  const fs = require('fs'), path = require('path'), txt = fs.readFileSync(path.join(process.env.TESTS_DIR, 'fixtures', 'old_save_d82f847_seed20261016_day127.wsr'), 'utf8').trim();
  startWorld(1);
  const raw = await unpackS(txt), rp = raw.co.find(c => c.tk === 'PNPL'), ry = raw.co.find(c => c.tk === 'MCSF');
  pre(raw.day === 127 && raw.co.every(c => !('fq' in c)) && !raw.IX && rp && Math.abs(rp.eqq - 460.60) < .01 && ry && Math.abs(ry.ncq - 1558.02) < .01,
    'FIX-OLD the file: day ' + raw.day + ', export format (no quarter rows, no indexes), PNPL eqq ' + f2(rp && rp.eqq) + ', MCSF ncq ' + f2(ry && ry.ncq) + ' waiting');
  const done = await pasteRestore(txt); pre(done && S.day === 127, 'FIX-OLD pasted through the import dialog (day ' + S.day + ')');
  const P0 = S.co.find(c => c.tk === 'PNPL'), Y = S.co.find(c => c.tk === 'MCSF'), lp = atLoad(P0), ly = atLoad(Y);
  ok(P0.eqq === 0 && Y.ncq === 0, 'FIX-OLD after the restore nothing waits: PNPL eqq ' + f2(P0.eqq) + ', MCSF ncq ' + f2(Y.ncq));
  rebuiltHolds('FIX-OLD PNPL', P0, lp, rp.eqq, 'cs');
  rebuiltHolds('FIX-OLD MCSF', Y, ly, -ry.ncq, 'D');
  for (const [c, l, lab] of [[Y, ly, 'FIX-OLD MCSF'], [P0, lp, 'FIX-OLD PNPL']]) {
    nextClose(c); if (c.dead) { pre(false, lab + ' died before its first close'); continue }
    const { q, p } = lastRows(c); pre(q.sh === Math.round(l.sh) && c.bk === l.bk, lab + ': no share trade and no further chapter 11 after the restore');
    ok(c.rlf == null, lab + ': no relief record after its first close (rlf ' + JSON.stringify(c.rlf) + ')');
    expectRow(lab, c, q, p, 0, 0);
  }
}

console.log('\nerrs', errs, 'fails', fails);
})().catch(e => { console.log('ERR exception ' + (e && e.stack || e)); console.log('errs', 1, 'fails', 0) });
