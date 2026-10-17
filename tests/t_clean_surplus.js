// Money-conservation check on the quarterly close (earn): across one close, the change in a company's book equity
// (operating assets + cash + goodwill - debt; holdings excluded) must equal
//   net income - equity-method share - dividends received - dividends paid + capital transactions (er.cap: chapter 11)
//   + bank loan write-off reported in this close (er.wo)
// The subtracted incomes and the added write-off are in this close's net income, but they moved book equity at another
// time than this close:
// - equity-method share: a share of another company's profit, never cash of this company
// - dividends received: reached the cash account when they were paid, earlier in the quarter
// - bank loan write-off (RT-BANK-001): left the bank's assets on the day its borrower went into chapter 11, earlier in
//   the quarter. The bank's first close after that day reports it in net income (docs/MODEL.md), so net income is
//   lower by er.wo while book equity does not move by it in this close. Adding it back is the mirror image of
//   subtracting dividends received. Across the whole window (write-off day -> that close) no extra term is needed:
//   tests/t_bank_writeoff.js checks that.
// The added term must not be able to hide anything else, so this test also checks every write-off end to end:
// - each one booked in ch11x cuts the bank's assets by exactly the amount it queues (woq)
// - each close reports exactly what was waiting before it (er.wo), no more and no less, and leaves nothing waiting
// - per seed: write-offs booked = write-offs reported + write-offs still waiting
// Any residual is money created or destroyed outside the income statement.
// Spec: docs/MODEL.md section "Quarterly close". Tolerance 1e-6 of equity.
let errs = 0, fails = 0;
const BE = c => c.A + c.cs + c.gw - c.D + (c.fmg || 0);
const off = (a, b) => Math.abs(a - b) > 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
for (const SEED of [12345, 777]) {
  init(Object.assign(defCfg(), { tut: 0, seed: SEED })); mdl = null;
  const e0 = earn, x0 = ch11x; let n = 0, cooked = 0, bad = [], booked = 0, nBooked = 0, reported = 0, nReported = 0;
  ch11x = function (c, why) {
    const b = S.co[c.ln], live = !!(b && !b.dead), A0 = live ? b.A : 0, q0 = live ? (b.woq || 0) : 0;
    x0(c, why);
    if (!live) return;
    const cut = A0 - b.A, queued = (b.woq || 0) - q0;
    if (queued > 0) { booked += queued; nBooked++ }
    if (off(cut, queued)) bad.push(b.tk + ' day ' + S.day + ' write-off: assets cut ' + cut.toFixed(3) + ' but queued ' + queued.toFixed(3));
  };
  earn = function (c) {
    // a cooked-books quarter reports invented profit on purpose (docs/MODEL.md): not a money check
    const b = BE(c), ck = !!c.cook, w0 = c.woq || 0; e0(c);
    const closed = !!(c.er && c.er.d === S.day), wo = closed ? (c.er.wo || 0) : 0;
    if (wo) { reported += wo; nReported++ }   // counted even when the company died in this close
    if (closed && off(wo, w0)) bad.push(c.tk + ' day ' + S.day + ' close reported write-off ' + wo.toFixed(3) + ' but ' + w0.toFixed(3) + ' was waiting');
    if (closed && (c.woq || 0) !== 0) bad.push(c.tk + ' day ' + S.day + ' close left ' + c.woq.toFixed(3) + ' of write-off waiting');
    if (c.dead || !c.er) return; if (ck) { cooked++; return } n++;
    const er = c.er, res = (BE(c) - b) - (er.ni - er.eq - er.dr - er.dv + (er.cap || 0) + (er.wo || 0));
    if (Math.abs(res) > 1e-6 * Math.max(1, Math.abs(b))) bad.push(c.tk + ' day ' + S.day + ' residual ' + res.toFixed(3) + ' (equity ' + b.toFixed(1) + ', NI ' + er.ni.toFixed(2) + ')');
  };
  for (let d = 0; d < 720; d++) { step(); if (mdl) G.mk(mdl.o.length - 1) }
  earn = e0; ch11x = x0;
  const waiting = S.co.reduce((a, c) => a + (c.woq || 0), 0);
  if (Math.abs(booked - reported - waiting) > 1e-6 * Math.max(1, booked)) bad.push('write-offs booked ' + booked.toFixed(3) + ' != reported ' + reported.toFixed(3) + ' + still waiting ' + waiting.toFixed(3));
  console.log('seed', SEED, 'quarterly closes', n, 'mismatches', bad.length, 'skipped (cooked books)', cooked,
    '| bank write-offs booked', nBooked, '(' + booked.toFixed(2) + '), reported in closes', nReported, '(' + reported.toFixed(2) + '), still waiting', waiting.toFixed(2));
  for (const x of bad.slice(0, 5)) { console.log('FAIL', x) }
  fails += bad.length;
}
console.log('errs', errs, 'fails', fails);
