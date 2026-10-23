// FIN-CF-02 (approved 2026-10-23; policies P1-P3, docs/MODEL.md): the '증자·출자(자사주)' line of the 현금흐름 tab must be the cash the
// company really received from issuing shares or from a cash capital contribution (or paid for its own shares), not "share-count change x
// close price". Written first as failing tests on main 151b138 (95 failures, 0 fixture errors), then the change was made.
//
// THE DEFECT (src/ui1.js fqDerive, main 151b138): iss = (q.sh - prev.sh) * q.p / 1e4. The quarter record holds only the share count and
// the CLOSE price, so every issue / buyback priced at anything else (discount issue x.95, placement x.98, buyback x1.05, option strike,
// bailout cash A x .15, government stake x.7 ...) is valued wrongly, a share-count change with no cash at all (stock merger
// consideration) is shown as cash raised, and a split / reverse split leaves a rounding residue (the recorded share counts are rounded,
// and splitDo rescales the old rows with a second rounding). '기타·투자 매매' (oth, the plug) takes the error with the opposite sign.
//
// THE DESIGN THESE TESTS PIN (proposal "A", ledger like FIN-CF-01; field names are part of the design):
//  - eqCash(c, x): every game path that issues or buys back shares for cash (and a cash capital contribution, policy P2) adds the cash
//    x the company really received (+) or paid (-) to c.eqq. Non-cash share-count changes (splitDo, stock-merger consideration,
//    founding) do not call it (policy P3: merger shares are 0; the target's debt and cash coming over are FIN-CF-03, not checked here).
//  - earn(): right before qPush, c.isq[Math.round(S.day)] = c.eqq (only when non-zero), c.eqq = 0; keys older than the oldest kept
//    row are dropped. kill() clears eqq and isq. qBack() (export import rebuilds the past rows) drops isq, keeps a pending eqq, and
//    moves the ledger start c.isd to S.day - 720 (like c.cfd of FIN-CF-01).
//  - v8prep(): eqq = 0, isd = S.day (the load day) when missing — its own start day, NOT c.cfd: a save made with FIN-CF-01 but
//    before FIN-CF-02 has cfd and no issue ledger.
//  - fqDerive(): a row whose previous row is AFTER c.isd uses iss = c.isq[q.d] || 0 (exact). A previous row ON the ledger start closed before the
//    save was loaded, and a trade after that close on the same day is not in the ledger: that row counts as an older row (case LG-SD). An older row (legacy) whose share count
//    changed keeps the old estimate (sh change x close price) and is flagged est: the tab shows '≈' before 증자·출자 / 재무활동 / 기타 of
//    that quarter with a footnote '분기 말 주가 기준 추정' (policy P1). An older row whose share count did not change takes the ledger amount
//    (a contribution recorded after loading) or 0, unflagged. The tab line is named '증자·출자(자사주)' (policy P2).
//
// WHERE THE EXPECTED VALUES COME FROM (nothing is copied from the statement code):
//  - cash events: snapshots of the company's cash c.cs and debt c.D right around the call of the real game function:
//    real = (cs after - cs before) - (D after - D before)   (a buyback paid beyond the cash on hand is borrowed: that part is debt, in dD)
//    cross-checked with the other side where there is one: the player's cash (S.cash + S.loan), the white knight's cash, the bailout
//    amount handed to the event.
//  - non-cash share changes: 0 by construction (no money changes hands).
//  - natural play: traps on cs / D / sh of every company record the writing frame; the cash of a share event is the cash / debt
//    write next to the share write from the same function and line.
//  - expected oth = dc - cfo + capex - (dD + R - dv + real), all other pieces from the quarter's own rows: so the oth check isolates
//    the share-issue piece.
// Tolerance TOLI 0.01: the design stores the exact amount, so the only error is float noise.
let errs = 0, fails = 0;
(async () => {
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ };
const pre = (c, m) => { console.log((c ? 'pre  ' : 'ERR  FIXTURE INVALID: ') + m); if (!c) errs++ };
const info = m => console.log('info ' + m);
const TOLI = .01;
const f2 = x => x == null ? 'n/a' : (Math.abs(x) < 1e-9 ? 0 : +x).toFixed(2);
const mulb = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
const SEED = 20261016;

// ---- harness --------------------------------------------------------------------------------------------------------------------------
const POST = {}; let hooked = 0;
function hook() { if (hooked) return; hooked = 1; const e0 = earn; earn = function (c) { const l0 = c.fq && c.fq[c.fq.length - 1], r = e0(c); if (!c.dead && c.fq && c.fq[c.fq.length - 1] !== l0 && POST[c.id]) { const f = POST[c.id]; POST[c.id] = null; f(c) } return r } }
function startWorld(seed) { Math.random = mulb(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; hook(); for (const k in POST) POST[k] = null }
const pickTarget = skip => S.co.find(c => !c.dead && !c.kd && !c.priv && !mine(c) && !c.own.P && c.bk === 0 && c.A > 3000 && !(skip || []).includes(c.id));
function nextClose(T) { const l0 = T.fq[T.fq.length - 1]; for (let i = 0; i < 400 && !T.dead; i++) { step(); if (T.fq[T.fq.length - 1] !== l0) return true } return false }
const daysToClose = T => 90 - ((S.day - T.fq[T.fq.length - 1][0]) % 90);
const waitDays = (T, n) => { const w = Math.max(0, Math.min(n, daysToClose(T) - 1)); for (let i = 0; i < w; i++) step() };
function trapSh(T) { let v = T.sh; const n = []; Object.defineProperty(T, 'sh', { configurable: true, enumerable: true, get() { return v }, set(x) { if (Math.abs(x - v) > 1e-12) n.push(1); v = x } }); return { n, off() { Object.defineProperty(T, 'sh', { configurable: true, enumerable: true, writable: true, value: v }) } } }
const snap = T => ({ cs: T.cs, D: T.D, sh: T.sh, p: T.p, pc: S.cash - (S.loan || 0) });
// call the real game function, measure the cash it moved for T
function measure(T, act) { const s0 = snap(T); const note = act(T); const s1 = snap(T); return { real: (s1.cs - s0.cs) - (s1.D - s0.D), dsh: s1.sh - s0.sh, s0, s1, note, player: s1.pc - s0.pc } }
const mkMine = T => { setOwn(T, 'P', 60); ctlAll(); return mine(T) };
const lastRows = T => { const L = fqL(T); return { q: L[L.length - 1], p: L[L.length - 2], L } };
function cfTab(c) {
  sel = -1; pg = ''; tab = 'h'; S.spd = 0; G.pick(c.id); G.stab('f'); G.fseg(3); render();
  const h = document.getElementById('sh').innerHTML, row = lab => { const part = h.split('<td>' + lab)[1]; return part == null ? null : [...part.split('</tr>')[0].matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m => m[1]) };
  return { h, clean: !/NaN|undefined|Infinity|\[object/.test(h), row, text: h.replace(/<[^>]*>/g, '') };   // the stub's textContent is always '', so the text is taken from the HTML
}
// the tab's number format (fN in ui1.js) read back: '–' = nothing, '1.23조' = 12,300억, '1,234' = 1234
const LINE = '증자·출자(자사주)';
const cellNum = s => s == null ? NaN : s === '–' ? 0 : /조$/.test(s) ? parseFloat(s.replace(/[≈,]/g, '')) * 1e4 : parseFloat(s.replace(/[≈,]/g, ''));
const DISP = [];   // display error table for the report: label, real cash, statement value, shown cell, shown - real
// the row check: statement vs the independent cash; ui: the newest column of the rendered tab (q must be the newest row)
function rowCheck(label, T, q, p, real, extra, ui) {
  const d = fqDerive(T, q, p), dep = T.kd ? 0 : q.A * .02, cfo = q.ni - q.eq + q.ga + dep + (q.imp || 0) + (q.wo || 0), capex = T.kd ? 0 : q.gr + dep;
  const dD = q.D - p.D, R = d.nc || 0, cffW = dD + R - q.dv + real, othW = (q.cs - p.cs) - cfo + capex - cffW;
  console.log(`  ${label}: ${T.tk} row ${q.d} | share count ${p.sh} -> ${q.sh}, close price ${q.p} | real cash ${f2(real)} | statement 증자·출자 ${f2(d.iss)} (error ${f2(d.iss - real)})${extra ? ' | ' + extra : ''}`);
  ok(Math.abs(d.iss - real) <= TOLI, label + ' 증자·출자(자사주) ' + f2(d.iss) + ' = cash really received/paid ' + f2(real));
  ok(Math.abs(d.cff - cffW) <= TOLI, label + ' 재무활동 ' + f2(d.cff) + ' = dD + R - dv + real cash = ' + f2(cffW));
  ok(Math.abs(d.oth - othW) <= TOLI, label + ' 기타·투자 매매 ' + f2(d.oth) + ' = ' + f2(othW) + ' (does not absorb the share issue)');
  ok(Math.abs((d.cff + q.dv - d.iss) - (dD + R)) <= 1e-9 && Math.abs(d.dc - (q.cs - p.cs)) <= 1e-9 && d.est === false, label + ' 차입 증감 (= dD + R) and 현금 증감 untouched; a recorded row is not flagged as an estimate (est ' + d.est + ')');
  if (ui !== false && !T.dead && !T.priv) {
    const t = cfTab(T), L = fqL(T), j = L.length - 1 - L.findIndex(x => x.d === q.d), ce = n => (t.row(n) || [])[j];
    const want = { [LINE]: real === 0 || Math.abs(real) < 1e-12 ? '–' : fN(real), '재무활동 현금흐름': fN(cffW), '기타·투자 매매': fN(othW) }, bad = [];
    for (const n in want) if (ce(n) !== want[n]) bad.push(n + ' shows ' + ce(n) + ' want ' + want[n]);
    ok(t.clean && !bad.length && !t.h.includes('<td>증자(자사주)') && !/≈/.test(t.h), label + ' UI: the newest column shows ' + LINE + ' ' + ce(LINE) + ', 재무활동 ' + ce('재무활동 현금흐름') + ', 기타 ' + ce('기타·투자 매매') + ' (no ≈, the old label is gone)' + (bad.length ? ' | ' + bad.join('; ') : ''));
    DISP.push([label, real, d.iss, ce(LINE), cellNum(ce(LINE)) - real]);
  }
  return d;
}
// one case: [mine] -> 2 closes -> wait -> act -> next close -> check the row
function runCase(label, o) {
  startWorld(o.seed || SEED); const T = o.target ? o.target() : pickTarget(); if (!T) return pre(false, label + ' target');
  if (o.mine && !mkMine(T)) return pre(false, label + ' make the target mine');
  nextClose(T); nextClose(T); if (o.prep) o.prep(T); waitDays(T, o.wait == null ? 30 : o.wait);
  const tr = trapSh(T); const ms = []; for (const a of [].concat(o.act)) { ms.push(measure(T, a)); if (o.between) o.between(T) }
  const n0 = tr.n.length; nextClose(T); tr.off();
  const real = o.cash0 ? 0 : ms.reduce((a, m) => a + m.real, 0), dsh = ms.reduce((a, m) => a + m.dsh, 0);
  pre(n0 === ms.length * 1 || o.anyWrites, label + ' the share count was written by the action only (' + n0 + ' write(s)), none until the close (' + (tr.n.length - n0) + ')');
  pre(tr.n.length === n0, label + ' no other share-count change before the close');
  if (o.pre) o.pre(T, ms);
  const { q, p } = lastRows(T); const d = rowCheck(label, T, q, p, real, o.cash0 ? 'NON-CASH share change ' + f2(dsh) + ' (expected 0)' : 'true share change ' + f2(dsh));
  if (o.post) o.post(T, ms, q, p, d);
  return { T, ms, q, p, d, real };
}
const EVf = s => EV2.find(e => String(e.go).includes(s));
console.log('-- harness ready');

// ================================================================================================================================
// C: cash share transactions (SYNTHETIC timing: the real game functions on a real simulated company, seed 20261016)
// ================================================================================================================================
console.log('\n-- TC-CF02-C cash share transactions');
runCase('C1 rights issue 10% (G.mg iss)', { mine: 1, act: T => G.mg(T.id, 'iss', .1), pre: (T, [m]) => pre(m.dsh > 0 && Math.abs(m.real - m.s0.sh * m.s0.p / 1e4 * .1 * .95) < 1e-6, 'C1 cash = market cap x 10% x .95 before the issue: ' + f2(m.real)) });
runCase('C2 rights issue 10%, one day before the close', { mine: 1, wait: 400, act: T => G.mg(T.id, 'iss', .1) });
runCase('C3 buyback 5% (G.mg bb, company cash)', { mine: 1, act: T => G.mg(T.id, 'bb', 5), pre: (T, [m]) => pre(m.real < 0 && m.dsh < 0, 'C3 cash paid ' + f2(m.real)) });
runCase('C3b buyback 5% beyond the cash on hand (the shortfall is borrowed)', { mine: 1, prep: T => { T.cs = 1 }, act: T => G.mg(T.id, 'bb', 5),
  pre: (T, [m]) => pre(m.s1.D > m.s0.D && m.real < 0, 'C3b the buyback borrowed ' + f2(m.s1.D - m.s0.D) + '; the share cash is still the full price ' + f2(m.real)) });
runCase('C4 private placement 10% to me (G.pp)', { mine: 1, prep: () => { S.cash = 1e6 }, act: T => { S.te = 'P'; G.pp(T.id, 10) }, pre: (T, [m]) => pre(Math.abs(m.real + m.player) < 1e-6, 'C4 company cash in ' + f2(m.real) + ' = my cash out ' + f2(-m.player)) });
runCase('C5 option exercise 2% at a strike of 60% of the price (G.eoX)', { prep: T => { S.cash = 1e6; S.ceo = T.id; S.eo = [{ i: T.id, pct: 2, k: 1, v: S.day - 1, x: S.day + 900 }] },
  act: T => { S.ceo = T.id; S.eo[0].k = Math.round(T.p * .6); G.eoX(0) }, pre: (T, [m]) => pre(m.dsh > 0 && Math.abs(m.real + m.player) < 1e-6, 'C5 strike cash ' + f2(m.real) + ' = my cash out ' + f2(-m.player)) });
{ let x0 = 0; runCase('C6 bailout (event bail): cash A x .15, shares / .7', { mine: 1, act: T => { x0 = T.A * .15; S.ev = { id: 'bail', c: T.id, x: x0 }; G.evPick('buy') }, pre: (T, [m]) => pre(Math.abs(m.real - x0) < 1e-6 && m.dsh > 0, 'C6 cash = the bailout amount handed to the event ' + f2(x0)) }) }
runCase('C7 event: credit downgrade -> share issue 10%', { act: T => { const e = EVf('재무구조 개선'); return e.go(T, e.mk(T), 'iss') } });
runCase('C8 event: activist -> buyback 5%', { prep: T => { T.cs += T.A }, act: T => { const e = EVf('행동주의 요구 수용'); return e.go(T, e.mk(T), 'yes') } });
runCase('C9 event: buyback 4%', { prep: T => { T.cs += T.A }, act: T => { const e = EVf('자사주 매입 보류'); return e.go(T, e.mk(T), 'go', 4) } });
runCase('C10 event: government buys a 30% stake', { act: T => { const e = EVf('정부에 지분 30%'); return e.go(T, e.mk(T), 'deal') } });
{ let w = null; runCase('C11 white knight 10% (G.wk)', { mine: 1, act: T => { const cs0 = S.co.map(c => c.cs); G.wk(T.id, 10); w = S.co.find((c, j) => c !== T && c.cs < cs0[j] - 1e-9) ; T._wk = w && cs0[w.id] - w.cs },
  pre: (T, [m]) => { pre(!!w && Math.abs(m.real - T._wk) < 1e-6, 'C11 company cash in ' + f2(m.real) + ' = the white knight ' + (w && w.tk) + "'s cash out " + f2(T._wk)); delete T._wk } }) }
runCase('C12 new shares bought by me (money move "pp")', { mine: 1, prep: () => { S.cash = 1e6 }, act: T => { MV = { fr: 'P', to: T.id, how: 'pp', amt: 300, y: -1, f: 1 }; G.mvGo() },
  pre: (T, [m]) => pre(m.dsh > 0 && Math.abs(m.real - 300) < 1e-6 && Math.abs(m.player + 300) < 1e-6, 'C12 cash 300 moved from me to the company: ' + f2(m.real)) });
// greenmail: random success (rnd < own/25; a 20% stake already gives control here, so 9%). A refused try costs me a 3억 fee and moves neither the company's cash nor its shares,
// so the tries run inside one measurement until one succeeds.
runCase('C13 greenmail of a 9% stake (G.gm, company pays 1.25 x price)', { prep: T => { setOwn(T, 'P', 9); ctlAll(); S.cash = 1e6; pre(!mine(T), 'C13 a 9% stake gives no control (greenmail needs that)') },
  act: T => { for (let t = 0; t < 40; t++) { S.te = 'P'; const sh0 = T.sh; G.gm(T.id); if (T.sh < sh0) return 'try ' + (t + 1) } return 'never' },
  pre: (T, [m]) => pre(m.dsh < 0 && m.real < 0 && m.note !== 'never', 'C13 greenmail succeeded (' + m.note + '): company paid ' + f2(m.real) + ' for ' + f2(-m.dsh) + ' shares') });
// rival activist (persTick, strategy 'ag'): a rival with 7%+ demands a buyback; the company accepts with probability .6 and pays mc x n% x 1.05.
// A refused try changes nothing on the company; e.dm (demand made) is reset so the next try can ask again.
{ let want = null;
  runCase('C14 rival activist -> company buyback (persTick, strategy ag)', { prep: T => { T.cs += T.A },
    act: T => { const id = 0, r = S.R[id]; r.s = 'ag'; rvPrep(r); setOwn(T, 'r' + id, 8); r.pos[T.id] = { px: T.p * 10, d: S.day, why: 'test' };
      for (let t = 0; t < 60; t++) { const sh0 = T.sh, n = Math.min(5, pub(T) - 1); want = -(mc(T) * n / 100 * 1.05); r.pos[T.id].dm = 0; persTick(r, id, 1); if (T.sh < sh0) return 'try ' + (t + 1) } return 'never' },
    pre: (T, [m]) => pre(m.dsh < 0 && m.note !== 'never' && Math.abs(m.real - want) < 1e-6, 'C14 the rival\'s demand was accepted (' + m.note + '): company paid ' + f2(m.real) + ' = market cap x 5% x 1.05 = ' + f2(want)) }) }
runCase('M1 issue 10% then buyback 5% in one quarter', { mine: 1, act: [T => G.mg(T.id, 'iss', .1), T => G.mg(T.id, 'bb', 5)], between: () => { for (let i = 0; i < 5; i++) step() } });
runCase('M2 issue 10% then a 1:10 reverse split in one quarter (the split adds no cash)', { mine: 1, act: [T => G.mg(T.id, 'iss', .1), T => { splitDo(T, .1, 1) }] });

// ================================================================================================================================
// N: share-count changes with no cash
// ================================================================================================================================
console.log('\n-- TC-CF02-N share-count changes without cash (expected 0)');
runCase('N1 10:1 split (splitDo)', { act: T => { splitDo(T, 10, 1) }, cash0: 1, pre: (T, [m]) => pre(Math.abs(m.real) < 1e-9 && m.dsh > 0, 'N1 split moved no cash') });
runCase('N2 1:10 reverse split (splitDo)', { act: T => { splitDo(T, .1, 1) }, cash0: 1, pre: (T, [m]) => pre(Math.abs(m.real) < 1e-9 && m.dsh < 0, 'N2 reverse split moved no cash') });
{ let x = null, x0 = null;
  runCase('N3 stock merger, acquirer side (G.merge): new shares are the payment, no cash', { mine: 1, cash0: 1,
    act: T => { x = S.co.find(c => !c.dead && !c.priv && !c.kd && c !== T && !mine(c) && mc(c) < mc(T) * .3 && c.i !== HOLD); setOwn(x, 'P', 55); ctlAll(); x0 = { cs: x.cs, D: x.D }; S.te = T.id; const m0 = S.st.ma; G.merge(x.id, 40); T._m = S.st.ma > m0 },
    pre: (T, [m]) => { pre(T._m && m.dsh > 0, 'N3 merged ' + (x && x.tk) + ' (shares +' + f2(m.dsh) + ')'); pre(Math.abs(m.s1.cs - m.s0.cs - x0.cs) < 1e-6 && Math.abs(m.s1.D - m.s0.D - x0.D) < 1e-6, 'N3 the acquirer took over the target cash ' + f2(x0.cs) + ' and debt ' + f2(x0.D) + ' (FIN-CF-03, not checked here)'); delete T._m } });
}

// ================================================================================================================================
// T: timing, saves, retention, death
// ================================================================================================================================
console.log('\n-- TC-CF02-T timing, saves, retention, death');
{ // SD: issue on a close day right after the company's own close: belongs to the NEXT quarter
  startWorld(SEED); const T = pickTarget(); mkMine(T); nextClose(T); nextClose(T); let m = null;
  POST[T.id] = c => { m = measure(c, c2 => G.mg(c2.id, 'iss', .1)) }; nextClose(T); pre(!!m && m.dsh > 0, 'SD issued right after the close of day ' + lastRows(T).q.d);
  { const { q, p } = lastRows(T); const d = fqDerive(T, q, p); ok(Math.abs(d.iss) <= TOLI, 'SD the quarter that just closed shows no issue: ' + f2(d.iss)) }
  nextClose(T); { const { q, p } = lastRows(T); rowCheck('SD next quarter', T, q, p, m.real) }
}
const reload = async strip => { const txt = await packS(strip), s = await loadStr(txt); S = s; v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null; return txt };
for (const [fmt, strip] of [['autosave (full)', 0], ['export (packS(1))', 1]]) {
  startWorld(SEED); let T = pickTarget(); mkMine(T); const id = T.id; nextClose(T); nextClose(T); waitDays(T, 30);
  const m = measure(T, c => G.mg(c.id, 'iss', .1)); const eqq0 = T.eqq;
  await reload(strip); T = S.co[id]; const ld = S.day;
  ok(T.eqq != null && Math.abs(T.eqq - m.real) <= TOLI && eqq0 != null, 'SV ' + fmt + ': the pending issue cash survives the save: eqq ' + f2(T.eqq) + ' (before saving ' + f2(eqq0) + ', real ' + f2(m.real) + ')');
  nextClose(T); const { q, p } = lastRows(T);
  if (!strip) {
    rowCheck('SV ' + fmt + ' next close', T, q, p, m.real);
    // a confirmed amount must survive the next save too (full save keeps fq and isq together)
    const isq0 = clone(T.isq); await reload(0); T = S.co[id]; const L = fqL(T), d = fqDerive(T, L[L.length - 1], L[L.length - 2]);
    ok(JSON.stringify(T.isq) === JSON.stringify(isq0) && Math.abs(d.iss - m.real) <= TOLI && d.est === false, 'SV ' + fmt + ': a confirmed quarter survives a second save: isq ' + JSON.stringify(T.isq) + ', row shows ' + f2(d.iss));
  } else {
    const d = fqDerive(T, q, p);
    ok(Math.abs(d.iss - m.real) <= TOLI && d.est === false && T.isd === ld - 720 && p.d > T.isd, 'SV ' + fmt + ': the rebuilt past rows are not legacy rows (isd ' + T.isd + ' = load day ' + ld + ' - 720 < previous row ' + p.d + '); the next close shows the real cash ' + f2(m.real) + ': ' + f2(d.iss));
    ok(!fqL(T).some((x, j, a) => j && fqDerive(T, x, a[j - 1]).est), 'SV ' + fmt + ': no rebuilt quarter is shown as an estimate');
    // export again with the amount now CONFIRMED: the rebuilt quarters replace the real ones, so the confirmed record goes with them
    const isq1 = clone(T.isq); await reload(1); T = S.co[id]; const L3 = fqL(T);
    ok(isq1 && Object.keys(isq1).length && T.isq == null && L3.every((x, j) => !j || fqDerive(T, x, L3[j - 1]).iss === 0) && T.eqq === 0, 'SV ' + fmt + ': exporting after the close drops the confirmed record ' + JSON.stringify(isq1) + ' together with the real rows (isq ' + JSON.stringify(T.isq) + '); the rebuilt quarters show no issue');
  }
}
{ // ABS: a company with a pending issue is absorbed by another (absorb -> kill); the acquirer's own ledger is untouched
  startWorld(SEED); const T = pickTarget(); mkMine(T); nextClose(T); waitDays(T, 20); G.mg(T.id, 'iss', .1); const n1 = T.eqq;
  const ac = S.co.find(x => !x.dead && !x.kd && !x.priv && x !== T && x.i === T.i); pre(!!ac && n1 > 0, 'ABS acquirer ' + (ac && ac.tk) + ', pending ' + f2(n1));
  ac.eqq = 7; ac.isq = { 1: 3 }; let thrown = null; try { absorb(ac, T, 0) } catch (e) { thrown = e && e.message }
  ok(!thrown && T.dead && T.eqq === 0 && T.isq == null && ac.eqq === 7 && JSON.stringify(ac.isq) === '{"1":3}', 'ABS absorbed target: dead ' + T.dead + ', eqq ' + T.eqq + ', isq ' + JSON.stringify(T.isq) + '; acquirer eqq ' + ac.eqq + ' isq ' + JSON.stringify(ac.isq) + ' (planted, untouched)' + (thrown ? ' [' + thrown + ']' : ''));
  ac.eqq = 0; delete ac.isq;
}
{ // RET: 9 closes with an issue in the 2nd quarter; the ledger keeps only dates of visible rows; then the row leaves
  startWorld(SEED); const T = pickTarget(); mkMine(T); nextClose(T); waitDays(T, 20); const m = measure(T, c => G.mg(c.id, 'iss', .1)); nextClose(T); const dIss = lastRows(T).q.d;
  ok(T.isq && Math.abs((T.isq[dIss] || 0) - m.real) <= TOLI && T.eqq === 0, 'RET the close confirms isq[' + dIss + '] = ' + f2(T.isq && T.isq[dIss]) + ' (real ' + f2(m.real) + '), eqq back to 0: ' + T.eqq);
  nextClose(T); { const L = fqL(T), j = L.findIndex(x => x.d === dIss), d = j >= 1 ? fqDerive(T, L[j], L[j - 1]) : null;
    ok(j === L.length - 2 && d && Math.abs(d.iss - m.real) <= TOLI && T.isq && Math.abs(T.isq[dIss] - m.real) <= TOLI, 'RET one close later the issue row (now second newest) still shows the recorded cash ' + f2(d && d.iss) + ' (isq ' + JSON.stringify(T.isq) + ')') }
  for (let i = 0; i < 7; i++) nextClose(T);
  const ds = T.fq.map(r => r[0]); ok((T.isq == null || Object.keys(T.isq).every(k => +k >= ds[0])) && !(T.isq && dIss in T.isq), 'RET after 8 more closes the confirmed amount of a row that left the 8-quarter window is dropped: isq ' + JSON.stringify(T.isq));
}
{ // KILL: a company with a pending issue dies
  startWorld(SEED); const T = pickTarget(); mkMine(T); nextClose(T); waitDays(T, 20); G.mg(T.id, 'iss', .1); pre(T.sh > 0, 'KILL issued');
  const had = T.eqq; kill(T, 0); ok(T.dead && (T.eqq === 0) && T.isq == null && had > 0, 'KILL kill() clears the pending (' + f2(had) + ') and confirmed issue cash: eqq ' + T.eqq + ', isq ' + JSON.stringify(T.isq));
  let thrown = null; for (let i = 0; i < 100; i++) { try { step() } catch (e) { thrown = e && e.message; break } }
  ok(!thrown && T.eqq === 0 && T.isq == null, 'KILL 100 days later nothing reappeared on the dead company' + (thrown ? ' [' + thrown + ']' : ''));
}

// ================================================================================================================================
// P2: cash capital contribution (money move "cap"): external cash, no new shares
// ================================================================================================================================
console.log('\n-- TC-CF02-P2 capital contribution and a loan (control)');
{
  // 'cap' is offered only to an owner of 99.9% or more (mvMethods); with less, mvFix silently switches the method to a loan.
  startWorld(SEED); const T = pickTarget(); setOwn(T, 'P', 100); ctlAll(); nextClose(T); nextClose(T); waitDays(T, 30); S.cash = 1e6;
  pre(mine(T) && mvMethods('P', T.id).some(x => x[0] === 'cap'), 'P2 I own 100% of ' + T.tk + ', so 현금 출자 is offered');
  const m = measure(T, c => { MV = { fr: 'P', to: c.id, how: 'cap', amt: 250, y: -1, f: 1 }; G.mvGo() });
  pre(Math.abs(m.real - 250) < 1e-6 && Math.abs(m.player + 250) < 1e-6 && m.dsh === 0, 'P2 the contribution is external cash: company +' + f2(m.real) + ', my cash ' + f2(m.player) + ', shares unchanged (' + f2(m.dsh) + ')');
  nextClose(T); const { q, p } = lastRows(T); const d0 = fqDerive(T, q, p);
  info('P2 today the 250 shows in 증자 ' + f2(d0.iss) + ' / 기타 ' + f2(d0.oth) + ' (no share-count change, so the old rule sees no equity financing)');
  rowCheck('P2 capital contribution (policy: equity financing from the owner)', T, q, p, m.real);
}
{
  startWorld(SEED); const T = pickTarget(); mkMine(T); nextClose(T); nextClose(T); waitDays(T, 30); S.cash = 1e6;
  const m = measure(T, c => { MV = { fr: 'P', to: c.id, how: 'adv', amt: 250, y: -1, f: 1 }; G.mvGo() });
  nextClose(T); const { q, p } = lastRows(T); const d = fqDerive(T, q, p);
  ok(Math.abs(d.iss) <= TOLI && (d.cff + q.dv - d.iss) - (q.D - p.D) === 0 && q.D - p.D > 240, 'P2-control a loan from me (adv) is debt: 증자 ' + f2(d.iss) + ', 차입 증감 ' + f2(d.cff + q.dv - d.iss) + ' includes the +250 (real ' + f2(m.real) + ')');
}

// ================================================================================================================================
// LG: an old save (no issue ledger): the estimate is kept and labeled (policy P1)
// ================================================================================================================================
console.log('\n-- TC-CF02-LG old save');
{
  startWorld(SEED); let T = pickTarget(); mkMine(T); const id = T.id; nextClose(T); nextClose(T); waitDays(T, 30); G.mg(T.id, 'iss', .1); nextClose(T); nextClose(T);
  const raw = clone(S); for (const x of raw.co) { delete x.eqq; delete x.isq; delete x.isd } S = migrate(raw); v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null; T = S.co[id];
  const L = fqL(T), Ds = L.map((q, j) => j ? fqDerive(T, q, L[j - 1]) : null), jr = L.findIndex((q, j) => j && q.sh !== L[j - 1].sh);
  pre(jr > 0, 'LG the old save has a quarter whose share count changed (' + (jr > 0 ? qLab(L[jr].d) : '-') + ')');
  if (jr > 0) {
    const q = L[jr], p = L[jr - 1], old = (q.sh - p.sh) * q.p / 1e4;
    ok(Math.abs(Ds[jr].iss - old) < 1e-9, 'LG the legacy row keeps the old estimate ' + f2(old) + ' (not re-estimated, not zeroed): ' + f2(Ds[jr].iss));
    ok(Ds[jr].est === true && L.every((x, j) => !j || j === jr || !Ds[j].est), 'LG only that row is flagged est (est ' + Ds[jr].est + ')');
    ok(T.isd === S.day && T.eqq === 0, 'LG after loading: isd = load day ' + T.isd + ' (' + S.day + '), eqq ' + T.eqq);
    const t = cfTab(T), col = L.length - 1 - jr, ce = n => (t.row(n) || [])[col], dj = Ds[jr];
    const want = { [LINE]: '≈' + fN(dj.iss), '재무활동 현금흐름': '≈' + fN(dj.cff), '기타·투자 매매': '≈' + fN(dj.oth), '차입 증감': fN(dj.cff + q.dv - dj.iss) }, bad = [];
    for (const n in want) if (ce(n) !== want[n]) bad.push(n + ' shows ' + ce(n) + ' want ' + want[n]);
    const others = L.map((x, j) => j).filter(j => j !== jr && j > 0).some(j => [LINE, '재무활동 현금흐름', '기타·투자 매매'].some(n => /≈/.test((t.row(n) || [])[L.length - 1 - j] || '')));
    if (others) bad.push('a recorded quarter shows ≈');
    const note = /※ ≈ 분기 말 주가 기준 추정\(([^)]*)\)/.exec(t.text);
    ok(t.clean && !bad.length && !!note && note[1] === qLab(q.d) && /기록된 금액이 아니에요/.test(t.text), 'LG the tab: ≈ on ' + LINE + ' ' + ce(LINE) + ' / 재무활동 ' + ce('재무활동 현금흐름') + ' / 기타 ' + ce('기타·투자 매매') + ' of ' + qLab(q.d) + ' only (차입 증감 ' + ce('차입 증감') + ' plain); footnote "분기 말 주가 기준 추정(' + (note && note[1]) + ')" says it is not a recorded amount' + (bad.length ? ' | ' + bad.join('; ') : ''));
    const keep = Ds.map(x => x && x.dc);
    // this save was written on a close day (the load day is the newest row's day): the next quarter's previous row is ON the ledger start, so it is
    // an older row (a same-day trade after that close could be missing, case LG-SD); with no share-count change it shows 0 unflagged. The one after is recorded.
    nextClose(T); { const L2 = fqL(T), q2 = L2[L2.length - 1], p2 = L2[L2.length - 2], d2 = fqDerive(T, q2, p2);
      ok(p2.d === T.isd && q2.sh === p2.sh && d2.est === false && Math.abs(d2.iss) <= TOLI, 'LG the quarter after loading starts ON the ledger start (previous row ' + p2.d + ' = isd ' + T.isd + '): an older row, no share-count change, so 0 and not flagged (est ' + d2.est + ')') }
    nextClose(T); { const L2 = fqL(T), q2 = L2[L2.length - 1], p2 = L2[L2.length - 2], d2 = fqDerive(T, q2, p2), led = p2.d > T.isd;
      ok(led && d2.est === false && Math.abs(d2.iss) <= TOLI, 'LG the next quarter is inside the ledger (previous row ' + p2.d + ' > isd ' + T.isd + '): recorded, est ' + d2.est + ', 증자·출자 ' + f2(d2.iss)) }
    info('LG the legacy row moved one column; cash changes of the old rows unchanged: ' + keep.filter(x => x != null).length + ' rows');
  }
}
// LG-SD: an old save written on a close day AFTER the close and after a same-day share issue. The ledger starts on that day (isd = load day =
// the row day), the issue is not in it, so the next quarter must stay an estimate (≈) and must not show the incomplete ledger as recorded.
{
  startWorld(SEED); let T = pickTarget(); mkMine(T); const id = T.id; nextClose(T); nextClose(T); let m = null;
  POST[T.id] = c => { m = measure(c, c2 => G.mg(c2.id, 'iss', .1)) }; nextClose(T); const dClose = lastRows(T).q.d;
  pre(!!m && m.dsh > 0 && S.day === dClose, 'LG-SD issued ' + f2(m && m.real) + ' on close day ' + dClose + ' after the close; the save is written that day');
  const raw = clone(S); for (const x of raw.co) { delete x.eqq; delete x.isq; delete x.isd } S = migrate(raw); v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null; T = S.co[id];
  nextClose(T); const { q, p } = lastRows(T); const d = fqDerive(T, q, p);
  pre(p.d === T.isd && q.sh !== p.sh, 'LG-SD the next row\'s previous row is ON the ledger start (' + p.d + ' = isd ' + T.isd + ') and the share count changed');
  ok(d.est === true && Math.abs(d.iss - (q.sh - p.sh) * q.p / 1e4) < 1e-9 && !(T.isq && T.isq[q.d]), 'LG-SD that quarter is an estimate (≈' + f2(d.iss) + ', real ' + f2(m.real) + ' not in the old save), not an incomplete ledger shown as recorded (est ' + d.est + ')');
}
// LG-ST: the quarter that is running when an old save is loaded straddles the ledger start (its previous row is before isd)
for (const [lab, act, want] of [
  ['contribution after loading, no share-count change: the recorded amount is used', T => { S.cash = 1e6; MV = { fr: 'P', to: T.id, how: 'cap', amt: 180, y: -1, f: 1 }; G.mvGo() }, 'ledger'],
  ['share issue after loading: the quarter is still an estimate (the shares changed in a quarter that began before the ledger)', T => { G.mg(T.id, 'iss', .1) }, 'est']]) {
  startWorld(SEED); let T = pickTarget(); setOwn(T, 'P', 100); ctlAll(); const id = T.id; nextClose(T); nextClose(T); waitDays(T, 20);
  const raw = clone(S); for (const x of raw.co) { delete x.eqq; delete x.isq; delete x.isd } S = migrate(raw); v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null; T = S.co[id];
  pre(mine(T) && T.isd === S.day, 'LG-ST loaded an old save mid-quarter (day ' + S.day + ', isd ' + T.isd + ')'); waitDays(T, 10);
  const m = measure(T, act); nextClose(T); const { q, p } = lastRows(T); const d = fqDerive(T, q, p);
  pre(p.d < T.isd && T.isd <= q.d, 'LG-ST the row straddles the ledger start (' + p.d + ' < ' + T.isd + ' <= ' + q.d + ')');
  if (want === 'ledger') ok(d.est === false && Math.abs(d.iss - m.real) <= TOLI && m.dsh === 0, 'LG-ST ' + lab + ': 증자·출자 ' + f2(d.iss) + ' = ' + f2(m.real) + ', not flagged');
  else ok(d.est === true && Math.abs(d.iss - (q.sh - p.sh) * q.p / 1e4) < 1e-9, 'LG-ST ' + lab + ': est ' + d.est + ', 증자·출자 ≈' + f2(d.iss) + ' (recorded cash ' + f2(m.real) + ' is kept in isq but not shown for this one quarter: documented limit)');
}

// ================================================================================================================================
// NAT: natural play (no player actions)
// ================================================================================================================================
console.log('\n-- TC-CF02-NAT natural play (seed 20261016 and 12345, 720 days, every company)');
const fr = () => { const l = new Error().stack.split('\n')[3] || ''; const m = l.match(/at (?:Object\.)?([\w$.<>]+)?\s*\(?.*?:(\d+):\d+\)?$/); return m ? (m[1] || 'anon') + '@' + m[2] : '?' };
const NATSRC = new Set();
for (const seed of [20261016, 12345]) {
  startWorld(seed); const W = new Map(), seen = new Set(), closes = []; let seq = 0;
  const trap = c => { if (seen.has(c)) return; seen.add(c); const log = []; W.set(c.id, log); for (const k of ['cs', 'D', 'sh']) { let v = c[k]; Object.defineProperty(c, k, { configurable: true, enumerable: true, get() { return v }, set(x) { const o = v; v = x; if (Math.abs(x - o) > (k === 'sh' ? 1e-9 : 1e-12)) log.push({ k, d: x - o, s: fr(), q: seq++, day: S.day }) } }) } };
  POST.nat = null; const e1 = earn; earn = function (c) { const l0 = c.fq && c.fq[c.fq.length - 1], r = e1(c); if (!c.dead && c.fq && c.fq[c.fq.length - 1] !== l0) closes.push({ id: c.id, q: seq++ }); return r };
  for (let d = 0; d < 720; d++) { for (const c of S.co) trap(c); step() }
  earn = e1;
  let n = 0;
  for (const [id, log] of W) {
    const c = S.co[id]; if (c.dead || !c.fq) continue; const ev = [];
    for (let i = 0; i < log.length; i++) { const w = log[i]; if (w.k !== 'sh') continue; let cash = 0, nw = 0; for (const j of [i - 2, i - 1, i + 1, i + 2]) { const u = log[j]; if (u && u.k !== 'sh' && u.s === w.s && u.day === w.day) { cash += u.k === 'cs' ? u.d : -u.d; nw++ } } ev.push({ q: w.q, s: w.s, cash, nw }); NATSRC.add(w.s.split('@')[0]) }
    if (!ev.length) continue; const L = fqL(c), cl = closes.filter(x => x.id === id).map(x => x.q).slice(-L.length);
    for (let j = 1; j < L.length; j++) { const es = ev.filter(e => e.q > cl[j - 1] && e.q < cl[j]); if (!es.length) continue; n++;
      const real = es.reduce((a, e) => a + e.cash, 0), d = fqDerive(c, L[j], L[j - 1]), src = [...new Set(es.map(e => e.s))].join(',');
      ok(Math.abs(d.iss - real) <= TOLI, `NAT seed ${seed} ${c.tk}${c.kd ? '(bank)' : ''} row ${L[j].d} [${src}] 증자 ${f2(d.iss)} = real cash ${f2(real)} (error ${f2(d.iss - real)})`) }
  }
  pre(n > 0, 'NAT seed ' + seed + ': ' + n + ' visible quarter row(s) with a share-count change');
}
{ const known = ['go', 'bankQ', 'splitDo'], extra = [...NATSRC].filter(x => !known.includes(x));
  ok(!extra.length, 'NAT every share-count writer seen in natural play is a known path (' + [...NATSRC].join(', ') + '; known: AI events, bank capital raise, AI splits)' + (extra.length ? ' | UNKNOWN: ' + extra.join(', ') : '')) }

// ================================================================================================================================
// GUARD: every place in the source that writes a share count is classified (cash -> eqCash, or listed as non-cash)
// ================================================================================================================================
console.log('\n-- TC-CF02-GUARD ledger coverage of the source');
{
  const fs = require('fs'), path = require('path'), dir = path.join(process.env.TESTS_DIR, '..', 'src');
  const NONCASH = [['splitDo', 'function splitDo('], ['stock merger', 'rescale(a,a.sh/ns);a.sh=ns'], ['founding', 'c.sh=Math.max(10,E/2)']];
  // each cash site must have ITS OWN eqCash call right next to it (120 characters before / 60 after the share write), on the same company
  // variable, and no eqCash call may be claimed by two sites: a call that belongs to a neighbouring path does not count.
  // calls only: the definition 'function eqCash(' and comment lines do not count
  const CALL = /(?<!function )eqCash\((\w+),/g, code = t => t.split('\n').map(l => /^\s*\/\//.test(l) ? ' '.repeat(l.length) : l).join('\n');
  const sites = [], used = new Set();
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js'))) { const t = fs.readFileSync(path.join(dir, f), 'utf8'); const re = /\b(\w+)\.sh\s*(\+=|-=|\*=|\/=|=(?!=))/g; let m;
    const calls = [...code(t).matchAll(CALL)].map(x => ({ at: x.index, v: x[1], key: f + ':' + x.index }));
    while ((m = re.exec(t))) { if (m[1] === 'fl') continue; const ln = t.slice(0, m.index).split('\n').length, nc = NONCASH.find(([, s]) => t.slice(Math.max(0, m.index - 200), m.index + 200).includes(s));
      const near = calls.filter(x => x.at >= m.index - 120 && x.at <= m.index + 60 && x.v === m[1] && !used.has(x.key)).sort((a, b) => Math.abs(a.at - m.index) - Math.abs(b.at - m.index))[0];
      if (near && !nc) used.add(near.key);
      sites.push({ f, ln, v: m[1], nc: nc && nc[0], led: !!near }) } }
  pre(sites.length === 17, 'GUARD the source writes a share count in ' + sites.length + ' places (17 known on main 151b138; a new one must be classified here)');
  for (const s of sites) ok(s.nc ? !s.led : s.led, 'GUARD ' + s.f + ':' + s.ln + ' (' + s.v + '.sh)' + (s.nc ? ' non-cash (' + s.nc + '): no eqCash next to it' : ' cash share transaction records its own cash with eqCash(' + s.v + ', ...)'));
  const a2 = fs.readFileSync(path.join(dir, 'act2.js'), 'utf8'), ci = a2.indexOf('if(how==="cap")'), capCall = ci > 0 && /T\.cs\+=x;eqCash\(T,x\)/.test(a2.slice(ci, ci + 300));
  ok(capCall, 'GUARD act2.js money move "cap" (capital contribution) records the cash it puts in T with eqCash(T, x) (policy P2)');
  const all = fs.readdirSync(dir).filter(x => x.endsWith('.js')).reduce((a, f) => a + (code(fs.readFileSync(path.join(dir, f), 'utf8')).match(CALL) || []).length, 0);
  ok(all === used.size + (capCall ? 1 : 0), 'GUARD every eqCash call in the source belongs to exactly one classified cash path (' + all + ' calls = ' + used.size + ' share sites + ' + (capCall ? 1 : 0) + ' contribution)');
}

console.log('\n-- display error table (억원): case | real cash | statement | shown cell | shown - real');
for (const r of DISP) console.log('disp ' + r[0] + ' | ' + f2(r[1]) + ' | ' + f2(r[2]) + ' | ' + r[3] + ' | ' + f2(r[4]));
console.log('\nerrs', errs, 'fails', fails);
})().catch(e => { console.log('ERR exception ' + (e && e.stack || e)); console.log('errs', 1, 'fails', 0) });
