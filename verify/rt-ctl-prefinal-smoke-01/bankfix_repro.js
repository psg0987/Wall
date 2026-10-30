// RT-CTL-PREFINAL-SMOKE-01 item 4 (Claude, read-only reproduction, no src change): automatic lending-bank assignment (pickBank) when a pending
// bank (ctl "?") exists. pickBank draws among all live banks weighted by assets (A) — it does not look at control. Three callers:
//   P1 bankFix (monthly in step, and in v8fix = every restore): borrowers whose bank is dead / missing get pickBank()
//   P2 BSF.bankFail (black-swan event): borrowers of the failing bank get pickBank() BEFORE the failing bank is killed
//   P3 v8prep (old saves without c.ln): pickBank()
// For each seed: the two largest banks hold 60% of each other (pending); a neutral bank X with borrowers dies (kill); bankFix runs.
// Prints where X's borrowers went, the loan face moved to pending banks, the pending banks' loan book / assets before and after, freeze reset.
// Then: BSF.bankFail with a fixed failing bank (who receives, incl. the failing bank itself), restore path (v8fix), a borrower moved to a
// pending bank going to chapter 11 (loan-to-own stake for the pending bank), and how often pickBank runs in 720 natural days.
let errs = 0, fails = 0;
{ const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
  const iso = c => { for (const k of Object.keys(c.own)) setOwn(c, k, 0); for (const t of Object.keys(c.pos)) setOwn(S.co[+t], 'c' + c.id, 0) };
  const world = seed => { Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; S.spd = 0;
    const bs = banks().filter(b => !b.priv).sort((x, y) => y.A - x.A), [p1, p2] = bs; iso(p1); iso(p2); setOwn(p1, 'c' + p2.id, 60); setOwn(p2, 'c' + p1.id, 60); p1.ctl = p2.ctl = null; ctlAll();
    return { p1, p2, bs } };
  const f1 = x => x.toFixed(1), shareA = (P, all) => P.reduce((s, b) => s + b.A, 0) / all.reduce((s, b) => s + b.A, 0);
  let tot = { borrowers: 0, toPend: 0, face: 0, faceP: 0 };
  console.log('== P1 bankFix after a neutral bank dies (seeds 701..710)');
  for (let seed = 701; seed <= 710; seed++) { const { p1, p2 } = world(seed); const pend = [p1, p2]; if (p1.ctl !== '?' || p2.ctl !== '?') { console.log('ERR seed ' + seed + ' not pending'); errs++; continue }
    const X = banks().filter(b => !b.ctl && b !== p1 && b !== p2).map(b => [b, S.co.filter(x => !x.dead && x.ln === b.id).length]).sort((a, b) => b[1] - a[1])[0][0];
    const Bs = S.co.filter(x => !x.dead && x.ln === X.id); Bs.forEach(x => { x.frz = X.id + 1 }); const bl0 = pend.map(bankBL), A0 = pend.map(b => b.A), sh = shareA(pend, banks().filter(b => b !== X));
    kill(X, .02); bankFix(); const toP = Bs.filter(x => pend.some(b => b.id === x.ln)), face = Bs.reduce((s, x) => s + loanOf(x), 0), faceP = toP.reduce((s, x) => s + loanOf(x), 0);
    tot.borrowers += Bs.length; tot.toPend += toP.length; tot.face += face; tot.faceP += faceP;
    console.log('seed ' + seed + ': ' + X.tk + ' died, ' + Bs.length + ' borrowers -> ' + toP.length + ' to pending ' + p1.tk + '/' + p2.tk + ' (expected share by assets ' + (sh * 100).toFixed(0) + '%); loan face ' + f1(faceP) + ' of ' + f1(face) +
      '; pending loan book ' + bl0.map(f1).join('/') + ' -> ' + pend.map(bankBL).map(f1).join('/') + '; pending assets A ' + A0.map(f1).join('/') + ' -> ' + pend.map(b => f1(b.A)).join('/') + '; freezes reset ' + Bs.filter(x => !x.frz).length + '/' + Bs.length + '; pending still ' + pend.map(b => b.ctl).join(','));
  }
  console.log('P1 total: ' + tot.toPend + '/' + tot.borrowers + ' borrowers and ' + f1(tot.faceP) + ' of ' + f1(tot.face) + ' loan face moved to a pending bank');
  console.log('== P2 BSF.bankFail (failing bank fixed to the largest neutral bank, seeds 711..715)');
  for (let seed = 711; seed <= 715; seed++) { const { p1, p2 } = world(seed); const pend = [p1, p2];
    const X = banks().filter(b => !b.ctl && b !== p1 && b !== p2 && !mine(b)).sort((a, b) => b.A - a.A)[0]; const Bs = S.co.filter(x => !x.dead && x.ln === X.id);
    const others = banks().filter(b => !mine(b)).sort((x, y) => y.A - x.A).slice(0, 3); const R0 = _R; let n = 0; const k = others.indexOf(X);
    // bankFail draws the failing bank from the 3 largest non-mine banks with rnd(); force the draw to X when it is among them, else skip
    if (k < 0) { console.log('seed ' + seed + ': ' + X.tk + ' not among the 3 largest non-mine banks, skipped'); continue }
    _R = () => { n++; return n === 1 ? (k + .5) / others.length : R0() }; BSF.bankFail(); _R = R0;
    const toP = Bs.filter(x => pend.some(b => b.id === x.ln)), self = Bs.filter(x => x.ln === X.id);
    console.log('seed ' + seed + ': ' + X.tk + ' failed (dead ' + X.dead + '), ' + Bs.length + ' borrowers -> ' + toP.length + ' to pending, ' + self.length + ' to the failing bank itself (re-assigned at the next monthly bankFix)');
    if (self.length) { bankFix(); console.log('  after the next bankFix: ' + self.filter(x => pend.some(b => b.id === x.ln)).length + '/' + self.length + ' of those to pending') } }
  console.log('== P1 on restore (v8fix): a borrower whose bank is dead in the save');
  { const { p1, p2 } = world(721); const X = banks().filter(b => !b.ctl && b !== p1 && b !== p2)[2]; const Bs = S.co.filter(x => !x.dead && x.ln === X.id); kill(X, .02);
    const o = JSON.parse(JSON.stringify(S)); S = migrate(o); v8fix(); const P = [p1.id, p2.id]; console.log('seed 721: ' + Bs.length + ' borrowers of dead ' + X.tk + ' re-assigned on restore: ' + Bs.map(x => S.co[x.id].ln).filter(l => P.includes(l)).length + ' to pending, pending after restore ' + P.map(i => S.co[i].ctl).join(',')) }
  console.log('== Effect: a borrower moved to a pending bank goes to chapter 11 (existing loan-to-own rule)');
  { const { p1, p2 } = world(731); const x = S.co.filter(c => !c.dead && !c.kd && !c.priv && c.i !== HOLD && c.bk === 0 && loanOf(c) > c.A * .1)[0]; x.ln = p1.id; const A0 = p1.A, own0 = x.own['c' + p1.id] || 0;
    ch11(x, 'repro'); console.log('seed 731: ' + x.tk + ' (loan ' + f1(loanOf(x)) + ') at pending ' + p1.tk + ' -> chapter 11: write-off from bank A ' + f1(A0 - p1.A) + ', pending bank stake ' + f1(own0) + ' -> ' + f1(x.own['c' + p1.id] || 0) + '%, borrower ctl ' + JSON.stringify(x.ctl) + ' (CTLQ ' + JSON.stringify(CTLQ && CTLQ[x.id]) + ')') }
  console.log('== How often pickBank runs in natural play (seeds 101/202/303 x 720 days, no player action; natural runs have no pending company)');
  for (const seed of [101, 202, 303]) { Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; S.spd = 0; let calls = 0, pendAt = 0; const pb = pickBank;
    pickBank = function () { calls++; const r = pb(); if (S.co[r] && S.co[r].ctl === '?') pendAt++; return r };
    for (let d = 0; d < 720; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null } pickBank = pb; console.log('seed ' + seed + ': pickBank calls ' + calls + ', to a pending bank ' + pendAt + ', banks alive ' + banks().length) } }
console.log('errs', errs, 'fails', fails);
