// RT-BANK-R4C: why does BOAX's accounting differ between main and the branch at its day-494 close although no accounting code changed?
// Prints BOAX's cash, shares, price, BIS around the day-450 regulator check and just before/after the close.
(() => {
const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
Math.random = mulberry(12345); init(Object.assign(defCfg(), { tut: 0, seed: 12345 })); mdl = null;
const e0 = earn;
earn = function (c) { const hit = c.tk === 'BOAX' && S.day === 494; const pre = hit && { cs: c.cs, A: c.A, D: c.D, sh: c.sh, p: c.p, bis: c.bis }; e0(c); if (hit) console.log('  close day 494: before the close cs ' + pre.cs.toFixed(3) + ' A ' + pre.A.toFixed(3) + ' D ' + pre.D.toFixed(3) + ' sh ' + pre.sh.toFixed(2) + ' | op ' + c.er.op.toFixed(4) + ' tax ' + c.er.tax.toFixed(4) + ' wo ' + c.er.wo.toFixed(4) + ' ni ' + c.ni.toFixed(4) + ' | cs after ' + c.cs.toFixed(3)) };
for (let d = 0; d < 495; d++) { step(); if (mdl) G.mk(mdl.o.length - 1); const b = S.co.find(x => x.tk === 'BOAX'); if (d + 1 >= 449 && d + 1 <= 451) console.log('  day ' + S.day + ': cs ' + b.cs.toFixed(3) + ' sh ' + b.sh.toFixed(2) + ' price ' + b.p.toFixed(1) + ' bis ' + b.bis) }
})();
