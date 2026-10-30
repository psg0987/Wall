// RT-CTL-AUDIT-01-FIX-01 B4: existing loans at a pending bank (ctl "?"). Two banks hold 60% of each other (pending); 5 ordinary companies already
// borrow from one of them. 400 days of play with no player action (interest, repayment, freezes, bond maturities, quarterly closes run as usual).
// Prints the borrowers' loan figures and a state hash. Run on the code before and after the fix with run_test_on_rev.py: the output must match.
let errs = 0, fails = 0;
{ const crypto = require('crypto'), mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
  for (const seed of [621, 622]) { Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; S.spd = 0;
    const iso = c => { for (const k of Object.keys(c.own)) setOwn(c, k, 0); for (const t of Object.keys(c.pos)) setOwn(S.co[+t], 'c' + c.id, 0) };
    const bs = S.co.filter(c => !c.dead && c.kd === 1 && !c.priv), [p1, p2] = bs; iso(p1); iso(p2); setOwn(p1, 'c' + p2.id, 60); setOwn(p2, 'c' + p1.id, 60); p1.ctl = p2.ctl = null; ctlAll();
    const B = S.co.filter(c => !c.dead && !c.kd && !c.priv && c.D > 0).slice(0, 5); B.forEach(c => { c.ln = p1.id }); ctlAll();
    console.log('seed ' + seed + ' pending banks ' + [p1.ctl, p2.ctl].join(',') + ' borrowers ' + B.map(c => c.tk).join(',') + ' at ' + p1.tk);
    const D0 = B.map(c => c.D); let pendDays = 0;
    for (let d = 0; d < 400; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null; if (p1.ctl === '?') pendDays++ }
    console.log('  pending days of ' + p1.tk + ': ' + pendDays + '/400; borrowers debt ' + D0.map(x => x.toFixed(1)).join(',') + ' -> ' + B.map(c => c.D.toFixed(1)).join(',') + '; bank ' + B.map(c => c.ln).join(',') + '; frz ' + B.map(c => c.frz || 0).join(','));
    const o = JSON.parse(JSON.stringify(S)); delete o.ctlp; console.log('  state hash ' + crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex').slice(0, 16)) } }
console.log('errs 0 fails 0');
