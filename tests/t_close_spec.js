// The quarterly close follows docs/MODEL.md section 1 to floating-point precision.
// For every close of an AI-run ordinary company (no bank/insurer, no parent with 80%+, no cooked books) where no bond
// matured or was issued and no impairment or chapter 11 happened, the close is recomputed from the documented
// formulas, starting from the state just before it and the reported operating profit, and compared item by item.
// Also counts how often each branch ran, so we know which rules the fixed seeds actually exercise
// (2026-10-17: never ran on these seeds: negative growth, player loans, sweep limited by the bank-loan balance).
let errs = 0, fails = 0;
const near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
const st = { closes: 0, checked: 0, skipped: 0, goodwill: 0, nolUsed: 0, lossToNol: 0, eqi: 0, dr: 0, payout0: 0, sweep: 0, sweepCapped: 0, shrink: 0, borrow: 0, playerLoan: 0 };
const bad = [];
function spec(p, op) {
  let { A, cs, gw, D, bond, pa } = p;
  if (bond > D) bond = D;
  if (pa > D - bond) pa = Math.max(0, D - bond);
  const sm = Math.max(.7, Math.min(2.5, 1 + ((p.csp || 1.8) / 1.8 - 1) * .6));
  const bl = Math.max(0, D - bond - pa);
  const it = bl * (p.prime + SPR[p.r] * sm) / 400 + bond * p.cpn / 400 + pa * p.prime / 400;
  const ii = cs * (p.prime - 2) / 400, cp = op - it + ii, ga = gw * .025, pt = cp - ga;
  const tax = pt > 0 ? (pt - Math.min(p.nol, pt)) * p.rate : 0;
  const ni = pt - tax + p.eqi + p.dr;
  const dv = Math.max(0, cp - tax + p.dr) * p.pay;
  cs += cp - tax - dv; gw -= ga;
  const gr = A * p.g / 4; A += gr; cs -= gr > 0 ? gr : gr * .9;
  let borrow = false, swept = false, capped = false;
  if (cs < 0) { D -= cs; cs = 0; borrow = true }
  if (p.sweep) { const tc = A * .06; if (cs > tc * 1.5 && D > 0) { const room = cs - tc, loan = Math.max(0, D - bond - pa), x = Math.min(loan, room); if (x > 0) { cs -= x; D -= x; swept = true; capped = loan < room } } }
  return { it, ga, tax, ni, dv, cs, D, A, gw, pt, gr, borrow, swept, capped, bond, pa };
}
for (const SEED of [12345, 777]) {
  init(Object.assign(defCfg(), { tut: 0, seed: SEED })); mdl = null;
  const e0 = earn;
  earn = function (c) {
    st.closes++;
    if (c.kd || mine(c) || c.cook || cPar(c) || c.dead) { e0(c); st.skipped++; return }
    const p = { A: c.A, cs: c.cs, gw: c.gw, D: c.D, bond: c.bond, cpn: c.cpn || 0, pa: c.pa || 0, r: rating(c), prime: S.prime, csp: S.csp,
      rate: ctax(c), nol: c.nol, pay: c.dban ? 0 : c.pay, g: c.g, eqi: c.eqi, dr: c.dr, sweep: !!((c.sweep && !mine(c)) || c.sweep === 2), bk: c.bk };
    e0(c);
    const s = spec(p, c.er ? c.er.op : 0);
    if (c.dead || !c.er || c.er.imp || c.er.cap || c.bk !== p.bk || c.bond !== s.bond) { st.skipped++; return }
    st.checked++;
    const items = [['interest', c.er.it, s.it], ['amortization', c.er.ga, s.ga], ['tax', c.er.tax, s.tax], ['net income', c.er.ni, s.ni],
      ['dividends', c.er.dv, s.dv], ['cash', c.cs, s.cs], ['debt', c.D, s.D], ['assets', c.A, s.A], ['goodwill', c.gw, s.gw]];
    const off = items.filter(([, g, w]) => !near(g, w));
    if (off.length) bad.push(c.tk + ' day ' + S.day + ': ' + off.map(([k, g, w]) => k + ' game ' + g.toFixed(4) + ' spec ' + w.toFixed(4)).join(', '));
    if (p.gw > 0) st.goodwill++;
    if (p.nol > 0 && s.pt > 0) st.nolUsed++;
    if (s.pt <= 0) st.lossToNol++;
    if (p.eqi) st.eqi++;
    if (p.dr) st.dr++;
    if (!p.pay) st.payout0++;
    if (s.swept) st.sweep++;
    if (s.capped) st.sweepCapped++;
    if (s.gr < 0) st.shrink++;
    if (s.borrow) st.borrow++;
    if (s.pa > 0) st.playerLoan++;
  };
  for (let d = 0; d < 720; d++) { step(); if (mdl) G.mk(mdl.o.length - 1) }
  earn = e0;
}
console.log(JSON.stringify(st));
for (const x of bad.slice(0, 8)) console.log('FAIL', x);
fails += bad.length;
if (st.checked < 3000) { fails++; console.log('FAIL too few closes checked: ' + st.checked) }
console.log('errs', errs, 'fails', fails);
