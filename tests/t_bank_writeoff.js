// TC-BANK-01 (RT-BANK-001): a borrower's first chapter 11 makes its bank write off 30% of the loan.
// Fixed scenario: bank assets 1,000억, cash 100억, deposits 1,000억 (book equity 100억); borrower's bank loan 200억
// (no bonds, no player loan), first chapter 11 -> expected write-off 60억.
//
// Expectation under test (proposed, see docs/VERIFY.md RT-BANK-001): the bank's book equity (A + cash + gw - D)
// may change only through its reported results. Across [just before the write-off -> the bank's next quarterly close]
//   change in book equity = net income - equity-method share - dividends received - dividends paid + recorded capital items
// This is the same identity tests/t_clean_surplus.js checks inside one close, applied to the whole window.
// The test does not prescribe HOW the loss reaches the results (direct expense, loan-loss reserve, tax effect).
let errs = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ };
const BE = c => c.A + c.cs + c.gw - c.D + (c.fmg || 0);
const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };

// build the same fixed scenario every time (same seeds), so two runs can be compared
function scenario() {
  Math.random = mulberry(20261016);
  init(Object.assign(defCfg(), { tut: 0, seed: 12345 })); mdl = null;
  const b = S.co.find(x => x.kd === 1 && !x.dead);
  const c = S.co.find(x => !x.kd && !x.dead && !mine(x) && x.bk === 0 && x.id !== b.id);
  b.A = 1000; b.cs = 100; b.D = 1000; b.gw = 0;
  if (!b.ba) bankInit(b);                        // the loan-loss reserve llr starts at 1% of assets
  c.ln = b.id; c.bond = 0; c.pa = 0; c.bh = 0; c.A = 150; c.cs = 0; c.gw = 0; c.D = 200; c.bk = 0;
  return { b, c };
}

// run 1: the real sequence
let { b, c } = scenario();
const loan0 = loanOf(c), A0 = b.A, cs0 = b.cs, D0 = b.D, be0 = BE(b), ni0 = b.ni, llr0 = b.llr, er0 = b.er;
console.log('before   bank A ' + A0 + ', cash ' + cs0 + ', deposits ' + D0 + ', book equity ' + be0 + ', reserve llr ' + llr0.toFixed(4) + ' | borrower loan ' + loan0 + ', chapter 11 count ' + c.bk);
ch11(c, 'TC-BANK-01');
const wo = A0 - b.A;
console.log('after ch11   bank A ' + b.A + ', book equity ' + BE(b) + ', NI field ' + (b.ni === ni0 ? 'unchanged' : b.ni) + ', quarter record ' + (b.er === er0 ? 'unchanged' : 'changed') + ', reserve llr ' + b.llr.toFixed(4) + ', bank stake in borrower ' + ((c.own['c' + b.id] || 0).toFixed(1)) + '%');
ok(Math.abs(wo - 0.3 * loan0) < 1e-9 && Math.abs(wo - 60) < 1e-9, 'write-off = 30% of the 200 loan = 60 (got ' + wo + ')');
earn(b);
const er = b.er, explained = er.ni - er.eq - er.dr - er.dv + (er.cap || 0), moved = BE(b) - be0, res = moved - explained;
console.log('bank close   NI ' + er.ni.toFixed(4) + ' (op ' + er.op.toFixed(4) + ', tax ' + er.tax.toFixed(4) + ', dividends ' + er.dv.toFixed(4) + '), provision in close ' + (b.bkr ? b.bkr.prov.toFixed(4) : '-') + ', reserve llr ' + b.llr.toFixed(4));
console.log('window   book equity moved ' + moved.toFixed(4) + ', explained by results ' + explained.toFixed(4) + ', unexplained ' + res.toFixed(4));
const niWith = er.ni;

// run 2: identical, but the bank's assets are given back right after the write-off (no loss); only the loss differs
// (diagnostic print only, no assertion. Since the RT-BANK-001 fix the write-off is also queued for the next close in
// woq, so the run with no loss clears that too)
({ b, c } = scenario());
ch11(c, 'TC-BANK-01');
b.A += wo;
b.woq = 0;
earn(b);
const niWithout = b.er.ni;
console.log('counterfactual   bank NI without the loss ' + niWithout.toFixed(4) + ' -> NI difference caused by the 60 loss ' + (niWith - niWithout).toFixed(4));

ok(Math.abs(res) <= 1e-6 * Math.max(1, Math.abs(be0)), 'bank book-equity change over write-off + next close is explained by its results (unexplained ' + res.toFixed(4) + ')');
console.log('errs', errs, 'fails', fails);
