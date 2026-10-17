// Money-conservation check on the quarterly close (earn): across one close, the change in a company's book equity
// (operating assets + cash + goodwill - debt; holdings excluded) must equal
//   net income - equity-method share - dividends received - dividends paid + capital transactions (er.cap: chapter 11)
// (the two subtracted incomes are not cash of this close: one is a share of another company's profit, the other
// reached the cash account when it was paid). Any residual is money created or destroyed outside the income statement.
// Spec: docs/MODEL.md section "Quarterly close". Tolerance 1e-6 of equity.
let errs = 0, fails = 0;
const BE = c => c.A + c.cs + c.gw - c.D + (c.fmg || 0);
for (const SEED of [12345, 777]) {
  init(Object.assign(defCfg(), { tut: 0, seed: SEED })); mdl = null;
  const e0 = earn; let n = 0, cooked = 0, bad = [];
  earn = function (c) {
    // a cooked-books quarter reports invented profit on purpose (docs/MODEL.md): not a money check
    const b = BE(c), ck = !!c.cook; e0(c); if (c.dead || !c.er) return; if (ck) { cooked++; return } n++;
    const er = c.er, res = (BE(c) - b) - (er.ni - er.eq - er.dr - er.dv + (er.cap || 0));
    if (Math.abs(res) > 1e-6 * Math.max(1, Math.abs(b))) bad.push(c.tk + ' day ' + S.day + ' residual ' + res.toFixed(3) + ' (equity ' + b.toFixed(1) + ', NI ' + er.ni.toFixed(2) + ')');
  };
  for (let d = 0; d < 720; d++) { step(); if (mdl) G.mk(mdl.o.length - 1) }
  earn = e0;
  console.log('seed', SEED, 'quarterly closes', n, 'mismatches', bad.length, 'skipped (cooked books)', cooked);
  for (const x of bad.slice(0, 5)) { console.log('FAIL', x) }
  fails += bad.length;
}
console.log('errs', errs, 'fails', fails);
