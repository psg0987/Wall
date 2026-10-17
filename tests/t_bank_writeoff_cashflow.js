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
// Also prints the same comparison for an asset impairment (impair, src/sim.js): diagnostic only, no assertion.
let errs = 0, fails = 0;
(() => {   // own scope: the game already has globals such as A and B
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
    shown: { ni: cell('순이익'), cfo: cell('영업활동 현금흐름'), oth: cell('기타·투자 매매'), dc: cell('현금 증감') } };
}
const line = (lab, x) => console.log('     ' + lab + ': write-off ' + f4(x.wo) + ' | NI ' + f4(x.ni) + ' | cash change: exact ' + f4(x.cashExact) + ', statement ' + f1(x.cf.dc) +
  ' | CFO ' + f1(x.cf.cfo) + ' | financing ' + f1(x.cf.cff) + ' | other ' + f1(x.cf.oth) + '   (tab shows: NI ' + x.cf.shown.ni + ', CFO ' + x.cf.shown.cfo + ', other ' + x.cf.shown.oth + ', cash change ' + x.cf.shown.dc + ')');

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
  earn = function (x) { e0(x); if (x === b && b.er && b.er.d === S.day) closes.push({ day: S.day, cs: b.cs, er: Object.assign({}, b.er) }) };
  play(200, () => cut && closes.length > cut.after);
  ch11x = x0; earn = e0;
  const rep = cut && closes[cut.after], last = cut && closes[cut.after - 1];
  return { b, cut, rep, wo: rep ? rep.er.wo || 0 : 0, ni: rep ? rep.er.ni : null, cashExact: rep && last ? rep.cs - last.cs : null, cf: cashflow(b) };
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

// diagnostic: the same comparison for an asset impairment (earn cuts the assets, impair lowers net income, no cash).
// Finds the first impairment on the test seeds, then replays the seed with impair doing nothing (assets still cut).
console.log('-- diagnostic (no assertion): the same for an asset impairment (impair)');
const imp0 = impair;
function firstImpairment(seed, quiet) {
  Math.random = mulberry(20261016);
  init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null;
  let hit = null;
  impair = function (c, wd) { if (!quiet) imp0(c, wd); if (!hit) hit = { c, wd, day: S.day } };
  play(720, () => hit);
  impair = imp0;
  return hit;
}
let found = null;
for (const seed of [12345, 777, 4242]) { const h = firstImpairment(seed, false); if (h) { found = { seed, h }; break } }
if (!found) console.log('     no impairment within 720 days on the test seeds');
else {
  const a = found.h, ca = cashflow(a.c), b = firstImpairment(found.seed, true), cb = b && b.c.id === a.c.id && b.day === a.day ? cashflow(b.c) : null;
  console.log('     seed ' + found.seed + ' day ' + a.day + ' ' + a.c.tk + ' (alive ' + !a.c.dead + '), write-down ' + f4(a.wd));
  if (cb) {
    console.log('     reports the impairment: NI ' + f1(ca.ni) + ', imp ' + f1(ca.imp) + ' | cash change ' + f1(ca.dc) + ' | CFO ' + f1(ca.cfo) + ' | other ' + f1(ca.oth));
    console.log('     twin, impair does nothing: NI ' + f1(cb.ni) + ', imp ' + f1(cb.imp) + ' | cash change ' + f1(cb.dc) + ' | CFO ' + f1(cb.cfo) + ' | other ' + f1(cb.oth));
    console.log('     -> same cash change: ' + (ca.dc === cb.dc) + '; CFO difference ' + f1(ca.cfo - cb.cfo) + ', other difference ' + f1(ca.oth - cb.oth) + ' (same problem if these are about -/+ the write-down)');
  } else console.log('     twin did not reach the same quarter');
}
})();
console.log('errs', errs, 'fails', fails);
