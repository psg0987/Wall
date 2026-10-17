// TC-BANK-07 (RT-BANK-001-R1, GPT review 2026-10-17): the cash flow statement must not treat the bank loan write-off as
// cash. fqDerive (src/ui1.js) computes operating cash flow as cfo = ni - eq + ga + dep and puts whatever else moved cash
// into '기타·투자 매매' (oth = dc - cfo + capex - cff). woBook (src/sim.js) lowers net income by the write-off while no
// cash moves: the loan left the bank's assets on the borrower's chapter 11 day. So the write-off must change neither
// operating cash flow nor the other line.
// Expected (a correct statement): the bank that reports the write-off and its twin that does not (same world; the twin
// drops the queued amount right after the cut, so the same balance sheet and the same cash, net income higher by the
// write-off) show the same cash change, the same operating cash flow and the same other cash flow. The statement works
// from the rounded quarter records (r1: whole numbers from 10 up, one decimal below, so up to 0.5 off each), and at most
// three rounded values meet in one comparison: tolerance 1.1.
// Expected to FAIL now: the statement has not been changed yet (report first, fix after review).
// Second case (added after review, same rule): an asset impairment. earn cuts the assets and impair lowers net income,
// no cash moves, so operating cash flow, the other line and free cash flow must not move either. Compared with a replay
// of the same seed in which impair does nothing (assets still cut). Tolerance there: the rounding bound of the three
// rounded values that meet (0.5 each from 10 up, 0.05 below).
// Both cases also check that the twins really are alike apart from net income (cash change, financing, capital
// spending, depreciation, share issues, dividends, the equity-method/amortization adjustment) and that the 현금흐름 tab
// shows what fqDerive computes.
// Third part (display, approved after the R1 fix): the tab must show the add-back on its own row, '손상·대손상각(비현금
// 조정)' = imp + wo as a positive amount, hidden when no quarter on the tab has either; and the rows above operating cash
// flow must add up to it in every quarter: exactly for the values behind them, and on screen within rounding (each shown
// number up to 0.5 off from 10 up and 0.05 below, as r1 rounds the records; 50 for amounts shown in 조). Cases: write-off
// only, impairment only, neither (twice), old records (rows of the v23 format without wo, and a save written before the
// fix).
let errs = 0, fails = 0;
(async () => {   // own scope: the game already has globals such as A and B
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ };
const f4 = x => x == null ? '-' : (+x).toFixed(4), f1 = x => x == null ? '-' : (+x).toFixed(1);
const TOL = 1.1;
const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const play = (days, stop) => { for (let d = 0; d < days; d++) { step(); if (mdl) G.mk(mdl.o.length - 1); if (stop && stop()) return true } return false };
// the cash flow statement of company c for its latest quarter, as computed for the 현금흐름 tab, and as rendered there
function cashflow(c) {
  const L = fqL(c), q = L[L.length - 1], prev = L[L.length - 2], d = fqDerive(c, q, prev);
  sel = -1; pg = ''; tab = 'h'; S.spd = 0; G.pick(c.id); G.stab('f'); G.fseg(3); render();
  const h = document.getElementById('sh').innerHTML, cell = lab => ([...((h.split('<td>' + lab + '</td>')[1] || '').split('</tr>')[0]).matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m => m[1])[0]);
  return { day: q.d, prevDay: prev.d, ni: q.ni, wo: q.wo || 0, imp: q.imp || 0, dc: d.dc, cfo: d.cfo, cff: d.cff, oth: d.oth, capex: d.capex,
    dep: d.dep, iss: d.iss, fcf: d.fcf, dv: q.dv, adj: q.ga - q.eq, dD: prev ? q.D - prev.D : null,
    shown: { ni: cell('순이익'), cfo: cell('영업활동 현금흐름'), oth: cell('기타·투자 매매'), dc: cell('현금 증감'), fcf: cell('잉여현금흐름 FCF'), cff: cell('재무활동 현금흐름') } };
}
const line = (lab, x) => console.log('     ' + lab + ': write-off ' + f4(x.wo) + ' | NI ' + f4(x.ni) + ' | cash change: exact ' + f4(x.cashExact) + ', statement ' + f1(x.cf.dc) +
  ' | CFO ' + f1(x.cf.cfo) + ' | financing ' + f1(x.cf.cff) + ' | other ' + f1(x.cf.oth) + '   (tab shows: NI ' + x.cf.shown.ni + ', CFO ' + x.cf.shown.cfo + ', other ' + x.cf.shown.oth + ', cash change ' + x.cf.shown.dc + ')');
// everything in the statement except net income and the lines derived from it must be the same in the two twins
const alike = (a, b, exactA, exactB) => a.dc === b.dc && a.cff === b.cff && a.capex === b.capex && a.dep === b.dep && a.iss === b.iss && a.dv === b.dv && a.adj === b.adj && a.dD === b.dD &&
  exactA.cash === exactB.cash && exactA.debt === exactB.debt;
const alikeMsg = (a, exactA) => 'exact cash change ' + f4(exactA.cash) + ', exact debt change ' + f4(exactA.debt) + ', statement: cash change ' + f1(a.dc) + ', financing ' + f1(a.cff) +
  ', capital spending ' + f1(a.capex) + ', depreciation ' + f1(a.dep) + ', share issue ' + f1(a.iss) + ', dividends ' + f1(a.dv) + ', equity-method/amortization adjustment ' + f1(a.adj);
// the tab shows the derived numbers (fN: the statement's number format). Banks and insurers (fin) have no free cash
// flow line: fqDerive still computes a number, the tab shows '–' (row: fin?null:d.fcf)
const shownOk = (x, fin) => x.shown.cfo === fN(x.cfo) && x.shown.oth === fN(x.oth) && x.shown.dc === fN(x.dc) && x.shown.cff === fN(x.cff) && x.shown.fcf === (fin ? '–' : fN(x.fcf));
const ePart = v => Math.abs(v) >= 10 ? 0.5 : 0.05;          // largest r1 rounding error of a recorded value
// the operating section of the 현금흐름 tab in every quarter column (newest first): what is shown, and the values behind it
const ROW_NC = '손상·대손상각(비현금 조정)';
const num = s => s == null || s === '–' ? null : s.endsWith('조') ? parseFloat(s) * 1e4 : parseFloat(s.replace(/,/g, ''));
const shownErr = s => s.endsWith('조') ? 50 : Math.abs(num(s)) >= 10 ? 0.5 : 0.05;
function opSection(c) {
  sel = -1; pg = ''; tab = 'h'; S.spd = 0; G.pick(c.id); G.stab('f'); G.fseg(3); render();
  const h = document.getElementById('sh').innerHTML;
  const row = lab => { const part = h.split('<td>' + lab + '</td>')[1]; return part == null ? null : [...part.split('</tr>')[0].matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m => m[1]) };
  const cols = fqL(c).slice().reverse(), rec = c.fq.slice().reverse();
  return { clean: !/NaN|undefined|Infinity|\[object/.test(h), ni: row('순이익'), dep: row('감가상각(비현금)'), adj: row('지분법·상각 조정'), nc: row(ROW_NC), cfo: row('영업활동 현금흐름'),
    want: cols.map((q, j) => { const d = fqDerive(c, q, cols[j + 1]); return { ni: q.ni, dep: d.dep, adj: q.ga - q.eq, imp: q.imp || 0, wo: q.wo || 0, nc: (q.imp || 0) + (q.wo || 0), cfo: d.cfo, fields: rec[j].length } }) };
}
function opCheck(s, label, expect) {
  const hasNc = s.want.some(w => w.nc !== 0), shown = s.nc != null;
  ok(s.clean && hasNc === (expect === 'shown') && shown === hasNc, label + ': row ' + ROW_NC + ' ' + (shown ? 'shown' : 'hidden') + ' (imp + wo non-zero in ' + s.want.filter(w => w.nc !== 0).length +
    ' of ' + s.want.length + ' quarters; record fields ' + s.want.map(w => w.fields).join('/') + ')');
  if (shown) ok(s.nc.length === s.want.length && s.want.every((w, j) => w.nc >= 0 && s.nc[j] === fN(w.nc)), label + ': the row shows imp + wo as a positive add-back: ' + s.nc.join(' | '));
  const exact = s.want.every(w => Math.abs(w.ni + w.dep + w.adj + w.nc - w.cfo) <= 1e-9 * Math.max(1, Math.abs(w.cfo)));
  const parts = j => [s.ni[j], s.dep[j], s.adj[j]].concat(shown ? [s.nc[j]] : []);
  const gaps = s.want.map((w, j) => { const ps = parts(j), sum = ps.reduce((a, x) => a + num(x), 0); return { gap: sum - num(s.cfo[j]), tol: ps.concat([s.cfo[j]]).reduce((a, x) => a + shownErr(x), 0) } });
  const worst = gaps.reduce((m, g) => Math.abs(g.gap) - g.tol > Math.abs(m.gap) - m.tol ? g : m, gaps[0]);
  ok(exact && gaps.every(g => Math.abs(g.gap) <= g.tol), label + ': in every quarter the rows above add up to operating cash flow (on screen, worst gap ' + f1(worst.gap) + ' vs allowed ' + worst.tol.toFixed(2) +
    '; latest quarter ' + parts(0).join(' + ') + ' = ' + s.cfo[0] + ')');
}

// The world of TC-BANK-02 'same day, bank closes first' (tests/t_bank_writeoff_cases.js): seed 12345, the first bank
// with assets 1,000, cash 100, deposits 850, llr 10; an insolvent borrower owing it 200 closes right after the bank on
// day 60 and defaults. The bank's day-60 close comes before the write-off, so the quarter that reports it (day 60 ->
// day 150) runs between two real closes of the bank.
function twin(drop) {
  Math.random = mulberry(20261016);
  init(Object.assign(defCfg(), { tut: 0, seed: 12345 })); mdl = null;
  const b = S.co.find(x => x.kd === 1 && !x.dead);
  const c = S.co.filter(x => !x.kd && !x.dead && !mine(x) && x.bk === 0 && !x.priv && x.id !== b.id).find(x => x.id > b.id);
  b.A = 1000; b.cs = 100; b.D = 850; b.gw = 0; if (!b.ba) bankInit(b); b.llr = 10;
  c.ln = b.id; c.bond = 0; c.pa = 0; c.bh = 0; c.A = 150; c.cs = 0; c.gw = 0; c.D = 200; c.bk = 0; c.off = b.off;
  const x0 = ch11x, e0 = earn, closes = []; let cut = null;
  ch11x = function (x, why) { if (x !== c || x.bk !== 0) return x0(x, why); const A0 = b.A, q0 = b.woq || 0; x0(x, why); cut = { day: S.day, amount: A0 - b.A, after: closes.length }; if (drop) b.woq = q0 };
  earn = function (x) { e0(x); if (x === b && b.er && b.er.d === S.day) closes.push({ day: S.day, cs: b.cs, D: b.D, er: Object.assign({}, b.er) }) };
  play(200, () => cut && closes.length > cut.after);
  ch11x = x0; earn = e0;
  const rep = cut && closes[cut.after], last = cut && closes[cut.after - 1];
  return { b, cut, rep, wo: rep ? rep.er.wo || 0 : 0, ni: rep ? rep.er.ni : null, cashExact: rep && last ? rep.cs - last.cs : null,
    exact: { cash: rep && last ? rep.cs - last.cs : null, debt: rep && last ? rep.D - last.D : null }, cf: cashflow(b), op: opSection(b) };
}
console.log('-- TC-BANK-07 cash flow statement of the quarter that reports a bank write-off (RT-BANK-001-R1)');
const A = twin(false), B = twin(true);
ok(!!(A.cut && B.cut && A.rep && B.rep) && A.rep.day === B.rep.day && A.cf.day === A.rep.day && A.cf.prevDay === A.cut.day,
  'both twins: write-off on day ' + (A.cut && A.cut.day) + ' after the bank\'s close that day, next close day ' + (A.rep && A.rep.day) + ' (statement quarter ' + A.cf.prevDay + ' -> ' + A.cf.day + ')');
line('reports the write-off', A); line('twin, nothing reported', B);
ok(A.wo > 0 && B.wo === 0 && Math.abs(A.ni - (B.ni - A.wo)) <= 1e-9 * Math.max(1, Math.abs(B.ni)), 'net income differs by exactly the write-off: ' + f4(A.ni) + ' = ' + f4(B.ni) + ' - ' + f4(A.wo));
ok(A.cashExact === B.cashExact && A.cf.dc === B.cf.dc, 'the write-off moved no cash: cash change ' + f4(A.cashExact) + ' vs ' + f4(B.cashExact) + ' (statement ' + f1(A.cf.dc) + ' vs ' + f1(B.cf.dc) + ')');
ok(Math.abs(A.cf.cfo - B.cf.cfo) <= TOL, 'R1 operating cash flow does not move with the non-cash write-off: ' + f1(A.cf.cfo) + ' vs twin ' + f1(B.cf.cfo) + ' (difference ' + f1(A.cf.cfo - B.cf.cfo) + ', allowed ' + TOL + ')');
ok(Math.abs(A.cf.oth - B.cf.oth) <= TOL, 'R1 the other cash flow line does not absorb the write-off: ' + f1(A.cf.oth) + ' vs twin ' + f1(B.cf.oth) + ' (difference ' + f1(A.cf.oth - B.cf.oth) + ', allowed ' + TOL + ')');
// comparison conditions and the tab (added after review)
ok(alike(A.cf, B.cf, A.exact, B.exact), 'the twins differ only in net income: ' + alikeMsg(A.cf, A.exact) + ' (same in the twin)');
ok(A.cf.capex === 0 && B.cf.capex === 0 && A.cf.shown.fcf === '–' && B.cf.shown.fcf === '–', 'a bank has no capital spending (' + f1(A.cf.capex) + ') and the tab shows no free cash flow line (' + A.cf.shown.fcf + ')');
ok(shownOk(A.cf, 1) && shownOk(B.cf, 1), 'the 현금흐름 tab shows the computed lines: CFO ' + A.cf.shown.cfo + ' / ' + B.cf.shown.cfo + ', financing ' + A.cf.shown.cff + ' / ' + B.cf.shown.cff + ', other ' + A.cf.shown.oth + ' / ' + B.cf.shown.oth);
// records written before the imp/wo fields existed (the history rows made at the start of the game have 22 fields):
// the statement reads both as 0, so operating cash flow there is ni - eq + ga + dep, and the tab renders numbers
{
  const b = B.b, L = fqL(b), old = b.fq.map((r, j) => r.length < 24 ? j : -1).filter(j => j > 0);
  const same0 = old.length > 0 && old.every(j => { const q = L[j], d = fqDerive(b, q, L[j - 1]); return Number.isFinite(d.cfo) && d.cfo === q.ni - q.eq + q.ga + d.dep && Number.isFinite(d.oth) });
  sel = -1; pg = ''; tab = 'h'; S.spd = 0; G.pick(b.id); G.stab('f'); G.fseg(3); render();
  const h = document.getElementById('sh').innerHTML;
  ok(same0 && !/NaN|undefined|Infinity|\[object/.test(h), 'records without the imp/wo fields (' + old.length + ' of ' + b.fq.length + ' rows, ' + (old.length ? b.fq[old[0]].length : '-') + ' fields) read them as 0, and the tab renders clean');
}

// ---- second case: asset impairment (impair). Finds the first impairment on the test seeds, then replays the seed
// with impair doing nothing: earn has already cut the assets, only the net income charge is left out.
console.log('-- TC-BANK-07 second case: cash flow statement of the quarter with an asset impairment (impair)');
const imp0 = impair, earn0 = earn;
function firstImpairment(seed, quiet) {
  Math.random = mulberry(20261016);
  init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null;
  let hit = null; const last = {};
  impair = function (c, wd) { if (!quiet) imp0(c, wd); if (!hit) hit = { c, wd, day: S.day } };
  earn = function (x) {
    earn0(x); if (!x.er || x.er.d !== S.day) return;
    if (hit && hit.c === x && hit.day === S.day && !hit.after) hit.after = { cs: x.cs, D: x.D, er: Object.assign({}, x.er), before: last[x.id] };
    last[x.id] = { cs: x.cs, D: x.D };
  };
  play(720, () => hit);
  impair = imp0; earn = earn0;
  if (hit) { hit.cf = cashflow(hit.c); hit.exact = hit.after && hit.after.before ? { cash: hit.after.cs - hit.after.before.cs, debt: hit.after.D - hit.after.before.D } : { cash: null, debt: null } }
  if (hit) {
    hit.op = opSection(hit.c);
    // the same company's records in the format of the game before the bank write-off existed (v23: 23 fields, imp but
    // no wo; the history rows made at the start keep their 22 fields)
    if (!quiet) { hit.c.fq = hit.c.fq.map(r => r.slice(0, 23)); hit.op23 = opSection(hit.c) }
  }
  return hit;
}
let found = null;
for (const seed of [12345, 777, 4242]) { const h = firstImpairment(seed, false); if (h) { found = { seed, a: h }; break } }
ok(!!found, 'an impairment happened within 720 days on the test seeds');
if (found) {
  const a = found.a, b = firstImpairment(found.seed, true); found.b = b;
  ok(!!(b && b.c.id === a.c.id && b.day === a.day && a.after && b.after && a.after.before && b.after.before) && a.cf.day === a.day && b.cf.day === a.day,
    'seed ' + found.seed + ' day ' + a.day + ' ' + a.c.tk + ' (alive ' + !a.c.dead + ', write-down ' + f4(a.wd) + '): the replay without the charge reaches the same quarter (' + a.cf.prevDay + ' -> ' + a.cf.day + ')');
  if (b && b.after && a.after) {
    const ca = a.cf, cb = b.cf, niA = a.after.er.ni, niB = b.after.er.ni, bound = ePart(niA) + ePart(a.wd) + ePart(niB);
    console.log('     reports the impairment: write-down ' + f4(a.wd) + ' | NI ' + f4(niA) + ' | cash change: exact ' + f4(a.exact.cash) + ', statement ' + f1(ca.dc) + ' | CFO ' + f1(ca.cfo) + ' | capital spending ' + f1(ca.capex) + ' | FCF ' + f1(ca.fcf) + ' | financing ' + f1(ca.cff) + ' | other ' + f1(ca.oth) + '   (tab: CFO ' + ca.shown.cfo + ', FCF ' + ca.shown.fcf + ', other ' + ca.shown.oth + ')');
    console.log('     replay, no charge:      write-down ' + f4(0) + ' | NI ' + f4(niB) + ' | cash change: exact ' + f4(b.exact.cash) + ', statement ' + f1(cb.dc) + ' | CFO ' + f1(cb.cfo) + ' | capital spending ' + f1(cb.capex) + ' | FCF ' + f1(cb.fcf) + ' | financing ' + f1(cb.cff) + ' | other ' + f1(cb.oth) + '   (tab: CFO ' + cb.shown.cfo + ', FCF ' + cb.shown.fcf + ', other ' + cb.shown.oth + ')');
    ok(Math.abs(niA - (niB - a.wd)) <= 1e-9 * Math.max(1, Math.abs(niB)) && ca.imp > 0 && cb.imp === 0, 'net income differs by exactly the write-down: ' + f4(niA) + ' = ' + f4(niB) + ' - ' + f4(a.wd) + ' (record imp ' + f1(ca.imp) + ' / ' + f1(cb.imp) + ')');
    ok(a.after.er.tax === b.after.er.tax && a.after.er.dv === b.after.er.dv, 'tax ' + f4(a.after.er.tax) + ' and dividends ' + f4(a.after.er.dv) + ' are the same in both');
    ok(alike(ca, cb, a.exact, b.exact), 'the twins differ only in net income: ' + alikeMsg(ca, a.exact) + ' (same in the replay)');
    ok(Math.abs(ca.cfo - cb.cfo) <= bound, 'R1 operating cash flow does not move with the non-cash write-down: ' + f1(ca.cfo) + ' vs replay ' + f1(cb.cfo) + ' (difference ' + f1(ca.cfo - cb.cfo) + ', allowed ' + bound + ')');
    ok(Math.abs(ca.oth - cb.oth) <= bound, 'R1 the other cash flow line does not absorb the write-down: ' + f1(ca.oth) + ' vs replay ' + f1(cb.oth) + ' (difference ' + f1(ca.oth - cb.oth) + ', allowed ' + bound + ')');
    ok(ca.fcf != null && cb.fcf != null && Math.abs(ca.fcf - cb.fcf) <= bound, 'R1 free cash flow does not move with the non-cash write-down: ' + f1(ca.fcf) + ' vs replay ' + f1(cb.fcf) + ' (difference ' + f1(ca.fcf - cb.fcf) + ', allowed ' + bound + ')');
    ok(!a.c.kd && shownOk(ca, 0) && shownOk(cb, 0), 'the 현금흐름 tab shows the computed lines: CFO ' + ca.shown.cfo + ' / ' + cb.shown.cfo + ', FCF ' + ca.shown.fcf + ' / ' + cb.shown.fcf + ', other ' + ca.shown.oth + ' / ' + cb.shown.oth);
  }
}

// ---- third part: the add-back on its own row of the 현금흐름 tab
console.log('-- TC-BANK-07 third part: the 현금흐름 tab shows the non-cash add-back on its own row');
opCheck(A.op, 'write-off only (bank, write-off ' + f1(A.wo) + ' reported on day ' + (A.rep && A.rep.day) + ')', 'shown');
ok(A.op.want[0].wo > 0 && A.op.want.every(w => w.imp === 0), 'write-off only: the latest quarter carries wo ' + f1(A.op.want[0].wo) + ', no quarter carries imp');
opCheck(B.op, 'neither (the twin that reports nothing)', 'hidden');
if (found && found.b) {
  opCheck(found.a.op, 'impairment only (' + found.a.c.tk + ', write-down ' + f1(found.a.wd) + ' on day ' + found.a.day + ')', 'shown');
  ok(found.a.op.want[0].imp > 0 && found.a.op.want.every(w => w.wo === 0), 'impairment only: the latest quarter carries imp ' + f1(found.a.op.want[0].imp) + ', no quarter carries wo');
  opCheck(found.b.op, 'neither (the replay without the charge)', 'hidden');
  opCheck(found.a.op23, 'old records in the v23 format (' + found.a.c.tk + ', rows cut to 23 fields: imp kept, no wo)', 'shown');
  ok(found.a.op23.want.every(w => w.fields <= 23 && w.wo === 0) && found.a.op23.want[0].imp > 0, 'old records: every row has 22 or 23 fields, wo reads as 0, imp ' + f1(found.a.op23.want[0].imp) + ' still shown');
}
{
  // a real save written by the game before the fix (tests/fixtures/README.md), played on to day 500
  const fs = require('fs'), path = require('path'), txt = fs.readFileSync(path.join(process.env.TESTS_DIR, 'fixtures', 'old_save_1ecdc53_seed12345_day440.wsr'), 'utf8').trim();
  Math.random = mulberry(20261016); init(Object.assign(defCfg(), { tut: 0, seed: 1 })); mdl = null;
  S = migrate(await unpackS(txt)); v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null;
  play(60);
  const boax = S.co.find(x => x.tk === 'BOAX'), s = opSection(boax);
  opCheck(s, 'old save from before the fix (commit 1ecdc53), BOAX after its day-494 close', 'hidden');
  ok(s.want.some(w => w.fields < 24) && s.want.some(w => w.fields === 24), 'old save: BOAX mixes rows without the new fields (' + s.want.filter(w => w.fields < 24).length + ') and new rows (' + s.want.filter(w => w.fields === 24).length + ')');
}
})().catch(e => { errs++; console.log('ERR ' + (e && e.stack || e)) }).finally(() => console.log('errs', errs, 'fails', fails));
