// RT-CTL-PREFINAL-FIX-02: why the natural seed-202 hash changed. Same script on the base (run_test_on_rev.py a909cbb) and on the fix (run.py).
// Natural play exactly as natural_hash.js (seed 202, 720 days, no player action) plus read-only probes: every BSF.bankFail call (day, failing
// bank, borrowers, random numbers used, where borrowers went), a daily state hash (to find the first day that differs), the number of companies
// pointing at a dead bank each day, and totals at day 720 (player cash, net worth, live banks' assets / cash, all companies' debt and cash).
let errs = 0, fails = 0;
{ const crypto = require('crypto'), mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
  const h = () => { const o = JSON.parse(JSON.stringify(S)); delete o.ctlp; return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex').slice(0, 12) }, f = x => x.toFixed(2), sum = (a, g) => a.reduce((s, x) => s + g(x), 0);
  const seed = 202; Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; S.spd = 0;
  const bf0 = BSF.bankFail; BSF.bankFail = function () { const R0 = _R; let n = 0; _R = () => { n++; return R0() }; const d0 = new Set(S.co.filter(c => c.dead).map(c => c.id)), pre = new Map(banks().map(b => [b.id, S.co.filter(x => !x.dead && x.ln === b.id)]));
    try { return bf0.apply(this, arguments) } finally { _R = R0; const X = S.co.find(c => c.kd === 1 && c.dead && !d0.has(c.id)); const B = X ? pre.get(X.id) : [];
      console.log('bankFail day ' + S.day + ': ' + (X ? X.tk : 'none') + ', borrowers ' + B.length + ', random numbers ' + n + ', to the failing bank itself ' + B.filter(x => x.ln === (X && X.id)).length + ', to -1 ' + B.filter(x => x.ln < 0).length + ', assignment ' + crypto.createHash('sha256').update(B.map(x => x.ln).join(',')).digest('hex').slice(0, 12)) } };
  const daily = [], deadRef = []; for (let d = 0; d < 720; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null; daily.push(h()); const k = S.co.filter(x => !x.dead && !x.kd && x.ln >= 0 && (!S.co[x.ln] || S.co[x.ln].dead)).length; if (k) deadRef.push(S.day + ':' + k) }
  console.log('DAILY ' + daily.join(','));
  console.log('days with companies pointing at a dead bank (day:count): ' + (deadRef.length ? deadRef.length + ' days, first ' + deadRef.slice(0, 12).join(' ') + (deadRef.length > 12 ? ' ... last ' + deadRef.slice(-3).join(' ') : '') : 'none'));
  const lb = banks(), co = S.co.filter(c => !c.dead && !c.kd); console.log('day 720 totals: player cash ' + f(S.cash) + ', net worth ' + f(nw()) + ', live banks ' + lb.length + ' A ' + f(sum(lb, b => b.A)) + ' cs ' + f(sum(lb, b => b.cs)) + ', companies alive ' + S.co.filter(c => !c.dead).length + ' debt ' + f(sum(co, c => c.D)) + ' cash ' + f(sum(co, c => c.cs)) + ', chapter-11 count ' + sum(S.co, c => c.bk || 0) + ', delisted ' + S.st.del);
  const o = JSON.parse(JSON.stringify(S)); delete o.ctlp; console.log('hash seed 202 ' + crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex').slice(0, 16)) }
console.log('errs 0 fails 0');
