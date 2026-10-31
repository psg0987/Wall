// RT-CTL-PREFINAL-FIX-02 F5 comparison script (Claude). Run the SAME script on the base (a909cbb, run_test_on_rev.py) and on the fix (run.py).
// Per seed: 30 days of play, then BSF.bankFail() with the game's own random draw (no forcing), then 330 more days (monthly bankFix included).
// Prints: random numbers consumed by bankFail, failing bank and borrowers, borrowers pointing at a dead bank right after the event and on each later
// day until none, where they went, financial totals right after the event and at day 360 (player cash, borrowers' debt/cash, live banks' assets/
// cash/write-off queue, chapter-11 count, bank loan-to-own stakes), and the state hash at day 360.
let errs = 0, fails = 0;
{ const crypto = require('crypto'), mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
  const f = x => x.toFixed(2), sum = (a, g) => a.reduce((s, x) => s + g(x), 0);
  const bankStake = c => sum(Object.entries(c.own).filter(([k]) => k[0] === 'c' && S.co[+k.slice(1)] && S.co[+k.slice(1)].kd === 1), ([, v]) => v);
  const tot = B => { const lb = banks(), Bl = B.filter(x => !x.dead); return 'cash ' + f(S.cash) + ' | borrowers D ' + f(sum(Bl, x => x.D)) + ' cs ' + f(sum(Bl, x => x.cs)) + ' | live banks ' + lb.length + ' A ' + f(sum(lb, b => b.A)) + ' cs ' + f(sum(lb, b => b.cs)) + ' woq ' + f(sum(lb, b => b.woq || 0)) +
    ' | ch11 total ' + S.co.reduce((s, c) => s + (c.bk || 0), 0) + ' | bank stakes in companies ' + f(sum(S.co.filter(c => !c.dead && !c.kd), bankStake)) };
  for (const seed of [861, 862, 863, 864, 865]) { Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); S.tut = 99; mdl = null; S.spd = 0;
    for (let d = 0; d < 30; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null }
    const before = new Map(banks().map(b => [b.id, S.co.filter(x => !x.dead && x.ln === b.id)])); const R0 = _R; let n = 0; _R = () => { n++; return R0() };
    const dead0 = new Set(S.co.filter(c => c.dead).map(c => c.id)); BSF.bankFail(); _R = R0;
    const X = S.co.find(c => c.kd === 1 && c.dead && !dead0.has(c.id)); if (!X) { console.log('seed ' + seed + ': no bank failed'); continue } const Bs = before.get(X.id);
    const deadRef = () => S.co.filter(x => !x.dead && !x.kd && x.ln >= 0 && (!S.co[x.ln] || S.co[x.ln].dead)).length;
    console.log('seed ' + seed + ' day ' + S.day + ': ' + X.tk + ' failed, ' + Bs.length + ' borrowers; random numbers used by bankFail ' + n + '; borrowers -> dead bank ' + Bs.filter(x => !S.co[x.ln] || S.co[x.ln].dead).length + ', -> -1 ' + Bs.filter(x => x.ln < 0).length + ', all companies pointing at a dead bank ' + deadRef());
    console.log('  assignment ' + crypto.createHash('sha256').update(Bs.map(x => x.ln).join(',')).digest('hex').slice(0, 12) + ' | after event: ' + tot(Bs));
    let days = []; for (let d = 0; d < 330; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null; const k = deadRef(); if (k && days.length < 40) days.push(S.day + ':' + k) }
    console.log('  later days with companies pointing at a dead bank (day:count, first 40): ' + (days.join(' ') || 'none'));
    console.log('  day ' + S.day + ': ' + tot(Bs));
    const o = JSON.parse(JSON.stringify(S)); delete o.ctlp; console.log('  state hash ' + crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex').slice(0, 16)) } }
console.log('errs 0 fails 0');
