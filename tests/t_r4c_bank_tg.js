// RT-BANK-R4C (approved 2026-10-20): on the day a borrower first enters chapter 11, the lending bank's write-off reaches the
// market's target price (tg). Design: docs/MODEL.md, "은행 대손 (RT-BANK-001)".
//
// WHAT THE CHANGE IS (src/sim.js): the cut ch11x makes (assets -30% of the loan, queued in woq) is followed, on the same day, by
// a new tg for the bank = tgCalc(bank), and tgCalc values the bank on epsV: while woq > 0 the trailing year is the three newest
// published quarters plus the waiting quarter at consensus (est) minus the waiting loss per share; otherwise epsT as before.
// Nothing is booked: eh, ni, er, yni, eqi, fq, est, jx, pd and the price are untouched; woBook still books the loss once at the
// close and clears woq BEFORE the close's tgCalc, so the loss is in the pending term or in eh, never in both.
//
// WHERE THE EXPECTED VALUES COME FROM (nothing is copied from a run): the SPEC functions below (muOf, refTg, epsSpec, epsTrail)
// are written here from the design, not from sim.js, and are evaluated on the inputs captured before the cut (eh, est, ni, sh,
// the loan the borrower owes at entry) and on the live book equity. Rules that already existed (the 30% cut, who is paid how
// much in kill) are taken from their code.
//   [I] identities: valuation equity = A + cs + gw - D + fmg + pfv; assets after the cut = before - w; eh/ni/er untouched by the cut.
//   [S] the R4C spec: tg = the existing formula on the spec EPS; the temporary term is released at the close; each loss once.
//   [O] observations that are only logged, never judged (price tables, negative-equity prices, the rights-issue refresh).
// A line starting `ERR  FIXTURE INVALID` means the test world is not the one the expectations assume; a line starting `FAIL`
// means the game computed something different from the expectation in a valid world. Both fail the test.
//
// CASES  A no write-off = the old result (every tgCalc call of 3 natural runs; a default with no loan; no lender)
//        B one write-off (default-day tg, the close, no double counting, no other field touched, short history, loan-to-own
//          stake, and the same world with the code as it was before R4C)
//        C several write-offs (same quarter = one combined write-off; across quarters)   D two banks, the same day
//        E the bank is settled before its close (R2)   F equity at or below zero after the cut (logged)
//        G rights issue and bank run between the default and the close; G3 the AI's 1:10 reverse split in between
//        S saves (autosave, export, a save written before R4C) between the default and the close   H natural BOAX (seed 12345, day 431 -> 494, 286.97)
let errs = 0, fails = 0;
(async () => {   // own scope: the game already has globals such as A and B
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ };
const pre = (c, m) => { console.log((c ? 'pre  ' : 'ERR  FIXTURE INVALID: ') + m); if (!c) errs++ };
const info = m => console.log('info ' + m);
const fx = (x, d) => x == null || !isFinite(x) ? String(x) : (+x).toFixed(d);
const f1 = x => fx(x, 1), f2 = x => fx(x, 2), f4 = x => fx(x, 4);
const near = (a, b, t) => Math.abs(a - b) <= (t == null ? 1e-9 : t) * Math.max(1, Math.abs(a), Math.abs(b));
const BE = c => c.A + c.cs + c.gw - c.D + (c.fmg || 0);
const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const sum = a => a.reduce((x, y) => x + y, 0), last = (a, n) => a.slice(Math.max(0, a.length - n));
const clone = o => JSON.parse(JSON.stringify(o));
const keysChanged = (x, y) => [...new Set([...Object.keys(x), ...Object.keys(y)])].filter(k => JSON.stringify(x[k]) !== JSON.stringify(y[k]));

// ---- the SPEC (written from the design) -------------------------------------------------------------------------------
const muOf = c => Math.max(4, Math.min(26, 7 + c.g * 55 + (7.5 - S.prime) * 1.1 + S.mood * 8));
// valOf(c): the existing target-price formula for the state of company c NOW (equity, shares, growth, rates, mood fixed), as a function of the EPS it is valued on
const valOf = c => { const mu = muOf(c), bps = Math.max(0, eq(c)) * 1e4 / c.sh, cv = cvm(c), hold = c.i === HOLD; return eps => { let t = Math.max(60, eps > 0 ? .7 * eps * mu + .3 * bps : bps * .45); if (hold) t = Math.max(t, bps * .85); return t * cv } };
const refTg = (c, eps) => valOf(c)(eps);
// trailing-12-month EPS of published quarters (annualised over the quarters that exist, at most four)
const epsTrail = s => { const l = last(s.eh, 4); return l.length ? sum(l) * 4 / l.length : s.ni * 4e4 / s.sh };
// the core EPS the market expects for the waiting quarter: the analysts' estimate; without one the average of the last four quarters; without any this quarter's EPS
const coreSpec = s => s.est != null && isFinite(s.est) ? s.est : s.eh.length ? sum(last(s.eh, 4)) / Math.min(4, s.eh.length) : s.ni * 1e4 / s.sh;
// the trailing year as it will stand after the waiting report if that report meets consensus: three newest published quarters + (core - loss per share)
const epsSpec = (s, w, core) => { const prev = last(s.eh, 3), q = (core == null ? coreSpec(s) : core) - w * 1e4 / s.sh; return (q + sum(prev)) * 4 / (prev.length + 1) };

// ---- worlds --------------------------------------------------------------------------------------------------------------
// seed 12345, mulberry(20261016). Banks: assets 1,000, cash 20, deposits 1,020 - E (book equity E, BIS = E/10 %), conservative
// allocation, llr 10, no holders, history eh = e (8 quarters), est = e, close days 60, 150, 240 (off 60), tg = tgCalc, price = tg.
// Borrower i (the first non-banks) owes its bank L; its first chapter 11 is forced on `day` (coDay hook). stake 0: its assets are
// 12 L, so the loan is below 10% of them and the bank takes no stake; stake 1: just before the default its assets are set to 150
// (BOAX-like: the bank takes 80% of the borrower, loan-to-own). The borrower's own closes fall outside the observed window.
function snap(b) {
  return { day: S.day, tg: b.tg, p: b.p, jx: b.jx || 0, eq: eq(b), BE: BE(b), pfv: pfv(b), A: b.A, cs: b.cs, D: b.D, sh: b.sh, woq: b.woq || 0, ni: b.ni, est: b.est, eh: (b.eh || []).slice(),
    g: b.g, prime: S.prime, mood: S.mood, yni: b.yni, eqi: b.eqi, surp: b.surp || 0 }
}
function world(cfg) {
  Math.random = mulberry(20261016);
  init(Object.assign(defCfg(), { tut: 0, seed: 12345 })); mdl = null;
  const banks = S.co.filter(x => x.kd === 1 && !x.dead).slice(0, cfg.nb), pool = S.co.filter(x => !x.kd && !x.dead && !mine(x) && x.bk === 0 && !x.priv);
  banks.forEach((b, i) => {
    b.A = 1000; b.cs = 20; b.D = 1020 - (cfg.Es ? cfg.Es[i] : cfg.E); b.gw = 0; if (!b.ba) bankInit(b); b.bm = 0; Object.assign(b.ba, BAP.safe); b.llr = 10; b.ds = 0; b.eqi = 0; b.off = 60; b.surp = 0; b.jx = 0;
    b.eh = Array(cfg.ehLen).fill(cfg.e); b.est = cfg.e; b.tg = tgCalc(b); b.p = b.tg; b.pc = b.p; b.nf = 0;
  });
  const defs = cfg.defs.map((d, i) => {
    const x = pool[d.pi == null ? i : d.pi], b = banks[d.bank || 0], L = d.L, stake = d.stake == null ? cfg.stake : d.stake;
    let off = ((d.day == null ? 0 : d.day) + 75) % 90; if (off === 60) off = 70;
    x.ln = b.id; x.pa = 0; x.bh = 0; x.A = Math.max(150, 12 * L); x.cs = 0; x.gw = 0; x.D = L; x.bond = 0; x.bk = 0; x.sweep = 0; x.off = off;
    return Object.assign({}, d, { x, b, L, stake, done: 0 });
  });
  return { banks, defs, bor: defs.map(d => d.x) };
}
function natWorld(seed) { Math.random = mulberry(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; return { banks: [], defs: [], bor: [] } }

// one run. Hooks record (a) every first chapter 11 of a borrower with a live bank: the bank before/after ch11x and the expected
// tg, computed on the spot from the state before the cut, (b) every bank close: the state before/after and the expected tg from
// the confirmed records, (c) a daily series of every bank that had a cut (and of every fixture bank), (d) every regulator check
// (bankQ). `main`: emulate the code before R4C (epsV = epsT, the bank's tg put back after the cut) to compare everything else.
function run(cfg) {
  cfg = Object.assign({ nb: 1, e: 17.5, E: 160, ehLen: 8, stake: 0, defs: [{ L: 200, day: 100 }], last: 162, main: 0, nat: 0, onDay: null, beforeDay: null }, cfg);
  const W = cfg.nat ? natWorld(cfg.nat) : world(cfg), R = { cfg, W, cuts: [], closes: [], series: {}, qs: [], err: null };
  const x0 = ch11x, e0 = earn, cd0 = coDay, q0 = bankQ, ev0 = epsV, as0 = aiSplits;
  const ser = b => R.series[b.id] || (R.series[b.id] = []);
  W.banks.forEach(ser);
  if (cfg.main) epsV = c => epsT(c);
  if (!cfg.nat) aiSplits = () => {};      // the AI's random 1:10 reverse split of cheap stocks is tested on its own (G3); here it would make worlds incomparable
  ch11x = function (x, why) {
    const b = x.bk === 0 && S.co[x.ln];
    if (!(b && !b.dead && b.kd === 1)) return x0(x, why);
    const loan = loanOf(x), s0 = snap(b), full0 = clone(b), fresh0 = tgCalc(b);
    x0(x, why);
    const w = (b.woq || 0) - s0.woq;
    if (cfg.main && w > 0) b.tg = s0.tg;
    const s1 = snap(b), val = valOf(b);
    R.cuts.push({ day: S.day, bank: b, borrower: x, loan, w, s0, s1, fresh0, changed: keysChanged(full0, clone(b)), val, expTg: val(epsSpec(s0, s1.woq)), tgBook: val(epsTrail(s0)), tgNow: b.tg, stakeNow: x.own['c' + b.id] || 0, bTg: x.tg, bP: x.p });
    ser(b);
  };
  earn = function (x) {
    if (x.kd !== 1 || x.dead) return e0(x);
    const pr = snap(x);
    e0(x);
    if (x.dead || !x.er || x.er.d !== S.day) return;
    const post = snap(x);
    R.closes.push({ day: S.day, bank: x, pre: pr, post, er: Object.assign({}, x.er), expTg: valOf(x)(epsTrail(post)) * (1 + pr.surp), bk: x.bk, epsVAfter: epsV(x), epsTAfter: epsT(x) });
  };
  bankQ = function () {
    const bs = S.co.filter(z => !z.dead && z.kd === 1 && R.series[z.id]).map(z => [z, snap(z), tgCalc(z)]);
    q0();
    for (const [z, a, fa] of bs) R.qs.push({ day: S.day, bank: z, a, b: snap(z), freshA: fa, freshB: z.dead ? null : tgCalc(z) });
  };
  coDay = function (x, rm) {
    const d = W.defs.find(z => z.x === x);
    if (d && !d.done && d.day != null && S.day === d.day && !x.bk) { d.done = 1; if (d.stake) x.A = 150; ch11(x, 'R4C') }
    return cd0(x, rm);
  };
  try {
    let guard = 0;
    while (S.day < cfg.last && guard++ < 5000) {
      if (cfg.beforeDay) cfg.beforeDay(R, S.day + 1);
      step(); if (mdl) G.mk(mdl.o.length - 1);
      for (const id in R.series) { const b = S.co[id]; R.series[id].push({ d: S.day, p: b.p, tg: b.tg, jx: b.jx || 0, woq: b.woq || 0, sh: b.sh, dead: !!b.dead, eq: b.dead ? null : eq(b), A: b.A }) }
      if (cfg.onDay) cfg.onDay(R, S.day);
    }
  } catch (e) { R.err = e; errs++; console.log('ERR  ' + (e && e.stack || e)) }
  finally { ch11x = x0; earn = e0; coDay = cd0; bankQ = q0; epsV = ev0; aiSplits = as0 }
  return R;
}
const closeAfter = (R, b, day) => R.closes.find(z => z.bank === b && z.day > day);
const at = (R, b, d) => ((R.series[b.id] || []).find(z => z.d === d) || {});

// ---- the checks of ONE write-off, used by every case ---------------------------------------------------------------------
const MAY_CHANGE = ['A', 'woq', 'tg', 'pos'];
function checkCut(tag, R, cut, o) {
  o = o || {};
  const { s0, s1 } = cut;
  if (o.positive != null) pre((epsSpec(s0, s1.woq) > 0) === o.positive, tag + ': regime ' + (o.positive ? 'mild' : 'strong') + ': the spec valuation EPS is ' + f4(epsSpec(s0, s1.woq)) + (o.positive ? ' (> 0, the EPS term decides tg)' : ' (< 0, tg follows the book-value branch)'));
  ok(cut.w > 0 && near(cut.w, .3 * cut.loan, 1e-12), tag + ': write-off ' + f4(cut.w) + ' = 30% of the loan ' + f4(cut.loan) + ' owed at the default (the existing rule, sim.js ch11x)');
  ok(near(s1.A, s0.A - cut.w) && near(s1.BE, s0.BE - cut.w), tag + ': assets ' + f4(s0.A) + ' -> ' + f4(s1.A) + ', book equity without the stake ' + f4(s0.BE) + ' -> ' + f4(s1.BE) + ' (both down by the write-off)');
  ok(near(s1.eq, s1.BE + s1.pfv), tag + ': equity used for valuation ' + f4(s1.eq) + ' = book ' + f4(s1.BE) + ' + stake value ' + f4(s1.pfv) + (o.stake ? ' (loan-to-own stake ' + f1(cut.stakeNow) + '%)' : ''));
  ok(near(cut.tgNow, cut.expTg, 1e-9), tag + ': target price on the default day ' + f4(cut.tgNow) + ' = the existing formula on the spec EPS ' + f4(epsSpec(s0, s1.woq)) + ' (expected ' + f4(cut.expTg) + ')');
  ok(cut.tgNow < s0.tg, tag + ': target price fell ' + f1(s0.tg) + ' -> ' + f1(cut.tgNow) + ' (the book-equity part alone would give ' + f1(cut.tgBook) + ')');
  ok(cut.bTg === cut.bP, tag + ': the borrower\'s own chapter 11 reset is untouched: its target price ' + f4(cut.bTg) + ' = its new price ' + f4(cut.bP));
  ok(s1.p === s0.p && s1.jx === s0.jx, tag + ': no price shock on the default day: price ' + f4(s0.p) + ' -> ' + f4(s1.p) + ', jump term ' + f4(s0.jx) + ' -> ' + f4(s1.jx));
  ok(cut.changed.every(k => MAY_CHANGE.includes(k)) && ['A', 'woq', 'tg'].every(k => cut.changed.includes(k)), tag + ': the bank record changed in ' + cut.changed.join(', ') + ' only (allowed: A, woq, tg' + (o.stake ? ', pos for the stake' : '') + ')');
  ok(s1.eh.join() === s0.eh.join() && s1.ni === s0.ni && s1.yni === s0.yni && s1.eqi === s0.eqi && s1.est === s0.est, tag + ': eh, ni, yni, eqi, est unchanged by the default (the loss is not booked early)');
}
// the close that follows: loss booked once, temporary term gone, tg from the confirmed EPS, and no double counting
function checkClose(tag, R, cut, cl, sc) {
  if (!cl) { pre(false, tag + ': the bank had no close after the default'); return }
  const w = cl.pre.woq, eh0 = sc ? cut.s0.eh.map(x => +(x * sc).toFixed(1)) : cut.s0.eh;
  pre(cl.pre.eh.join() === eh0.join(), tag + ': no other close between the default and this one (eh before the close = eh before the default)');
  ok(near(cl.er.wo || 0, w, 1e-12) && w > 0 && cl.post.woq === 0, tag + ': the close on day ' + cl.day + ' books ' + f4(cl.er.wo) + ' of ' + f4(w) + ' waiting, nothing left waiting (' + cl.post.woq + ')');
  const core = (cl.post.ni + w) * 1e4 / cl.post.sh;                                   // the quarter's EPS before the write-off, from the confirmed net income
  ok(near(cl.post.eh[cl.post.eh.length - 1], Math.round(cl.post.ni * 1e5 / cl.post.sh) / 10, 1e-12), tag + ': the loss sits once in the published quarter: EPS ' + f1(cl.post.eh[cl.post.eh.length - 1]) + ' = core ' + f1(core) + ' - loss ' + f1(w * 1e4 / cl.post.sh));
  ok(cl.epsVAfter === cl.epsTAfter && near(cl.epsVAfter, epsTrail(cl.post), 1e-12), tag + ': after the close the valuation EPS is the confirmed trailing EPS ' + f4(cl.epsTAfter) + ' (the temporary term is released)');
  ok(near(cl.post.tg, cl.expTg, 1e-9), tag + ': target price after the close ' + f4(cl.post.tg) + ' = existing formula on the confirmed EPS (expected ' + f4(cl.expTg) + ')');
  // no double counting: had the quarter come in at exactly the core EPS it was reported at, the default-day valuation EPS is the close's trailing EPS (up to the 0.1 rounding of eh)
  const e1 = epsSpec(Object.assign({}, cut.s0, { sh: cl.post.sh, eh: eh0 }), w, core), e2 = epsTrail(cl.post), n = Math.min(4, cl.post.eh.length);
  ok(Math.abs(e1 - e2) <= .0501 * 4 / n, tag + ': no double counting: valuation EPS before the close, had the quarter met its own core EPS, ' + f4(e1) + ' = trailing EPS after it ' + f4(e2));
}
function table(tag, R, cut, cl) {
  const b = cut.bank, row = [['before', () => [cut.s0.p, cut.s0.tg]], ['default instant', () => [cut.s1.p, cut.tgNow]]];
  for (const [l, d] of [['default day end', cut.day], ['d+10', cut.day + 10]].concat(cl ? [['close-1', cl.day - 1], ['close', cl.day], ['c+1', cl.day + 1], ['c+10', cl.day + 10], ['c+30', cl.day + 30]] : []))
    row.push([l, () => { const z = at(R, b, d); return [z.p, z.tg] }]);
  info(tag + ' price/target: ' + row.map(([l, f]) => { const [p, t] = f(); return l + ' ' + (p == null ? '-' : f1(p) + '/' + f1(t)) }).join(' | '));
}

// =============================================================================================================================
try {
// ---- A: no write-off = the old result ---------------------------------------------------------------------------------------
console.log('-- TC-R4C-A no write-off: identical to the existing valuation');
{
  // A1 every tgCalc call of natural play: without a waiting loss the target is the existing formula on epsT; with one the spec EPS
  for (const seed of [12345, 777, 20261016]) {
    natWorld(seed);
    const t0 = tgCalc; let n = 0, nw = 0; const bad = [];
    tgCalc = function (c) {
      const v = t0(c), w = c.woq || 0, s = { eh: c.eh || [], est: c.est, ni: c.ni, sh: c.sh }, x = refTg(c, w > 0 ? epsSpec(s, w) : epsTrail(s));
      n++; if (w > 0) nw++; if (!near(v, x, 1e-12)) bad.push((c.tk || c.id) + ' day ' + S.day + (w > 0 ? ' (waiting ' + f2(w) + ')' : '') + ': ' + f4(v) + ' vs ' + f4(x));
      return v;
    };
    let thrown = null;
    try { for (let d = 0; d < 720; d++) { step(); if (mdl) G.mk(mdl.o.length - 1) } } catch (e) { thrown = e }
    tgCalc = t0;
    ok(!thrown && n > 0 && bad.length === 0, 'TC-R4C-A1 natural seed ' + seed + ' x 720 days: ' + n + ' target-price calculations (' + nw + ' of them with a write-off waiting) all equal to the spec' + (bad.length ? ' MISMATCH ' + bad.slice(0, 3).join('; ') : '') + (thrown ? ' ERROR ' + thrown.message : ''));
  }
  // A2 a default whose debt to the bank is all bonds: nothing is written off, the bank's target price is not touched
  { const R = run({ defs: [{ L: 200, day: 100 }], last: 110, beforeDay: (R, d) => { if (d === 99) S.mood += .4; if (d === 100) { const x = R.W.bor[0]; x.bond = x.D } } });
    const x = R.W.bor[0], b = R.W.banks[0], c = R.cuts[0], z0 = at(R, b, 99), z1 = at(R, b, 100);
    pre(!!c && x.bk === 1, 'TC-R4C-A2 world: the borrower is in chapter 11 (bk ' + x.bk + '), loan to the bank at the default ' + (c && f4(c.loan)));
    if (c) pre(Math.abs(c.fresh0 / c.s0.tg - 1) > .02, 'TC-R4C-A2 the stored target price is stale (mood moved by .4 since the last close): the formula on today\'s inputs gives ' + f4(c.fresh0) + ' vs stored ' + f4(c.s0.tg) + ', so a refresh would show');
    if (c) ok(c.loan === 0 && c.w === 0 && !c.changed.includes('tg') && !c.changed.includes('A') && z1.tg === z0.tg && z1.woq === 0, 'TC-R4C-A2 nothing written off (' + f4(c.w) + '): the bank record changed in [' + c.changed.join(', ') + '], target price ' + f4(z0.tg) + ' -> ' + f4(z1.tg)); }
  // A3 a default with no lender: no bank anywhere is touched
  { let fresh = null; const R = run({ defs: [{ L: 200, day: 100 }], last: 106, beforeDay: (R, d) => { if (d === 99) S.mood += .4; if (d === 100) { R.W.bor[0].ln = -1; fresh = tgCalc(R.W.banks[0]) } } });
    const x = R.W.bor[0], b = R.W.banks[0], z0 = at(R, b, 99), z1 = at(R, b, 100);
    pre(Math.abs(fresh / z0.tg - 1) > .02, 'TC-R4C-A3 the stored target price is stale (mood moved by .4): the formula on today\'s inputs gives ' + f4(fresh) + ' vs stored ' + f4(z0.tg));
    ok(R.cuts.length === 0 && x.bk === 1 && z1.tg === z0.tg && b.woq === 0, 'TC-R4C-A3 default without a lender: borrower bk ' + x.bk + ', no write-off, the bank target price stays ' + f4(z1.tg)); }
}

// ---- B: one write-off ---------------------------------------------------------------------------------------------------------
// "strong": the waiting quarter's loss per share is larger than the yearly EPS, so the valuation EPS is negative and tg follows the
// book-value branch of the formula (bps x .45), whatever the size of the loss. "mild": the valuation EPS stays positive, so the size
// of the EPS term, the window and the estimate all change tg. Both are needed: the strong cases cannot see a wrong EPS term.
console.log('-- TC-R4C-B one write-off (strong = valuation EPS < 0, mild = valuation EPS > 0)');
const REG = [['strong', 200, false], ['mild', 30, true]];
for (const [rg, L, positive] of REG) {
  const tag = 'TC-R4C-B1 (' + rg + ')', B1 = run({ defs: [{ L, day: 100 }] }), cut = B1.cuts[0], cl = cut && closeAfter(B1, cut.bank, cut.day);
  pre(!!cut && B1.cuts.length === 1 && cut.day === 100 && !!cl && cl.day === 150 && !cl.bk && !cl.bank.dead, tag + ' world: one default on day ' + (cut && cut.day) + ', bank close on day ' + (cl && cl.day) + ' (' + B1.cuts.length + ' write-offs)');
  if (cut && cl) {
    checkCut(tag, B1, cut, { positive }); checkClose(tag, B1, cut, cl); table(tag, B1, cut, cl);
    // the target price stays where the default day put it until the close (no rights issue or bank run falls inside)
    const mid = B1.series[cut.bank.id].filter(z => z.d >= cut.day && z.d < cl.day);
    ok(mid.length > 40 && mid.every(z => z.tg === cut.tgNow && z.woq === cut.s1.woq), tag + ' from the default day to the day before the close the target price stays ' + f4(cut.tgNow) + ' and the loss stays queued (' + mid.length + ' days)');
    // B4 the same world with the code as it was before R4C: the bank's accounting is the same; only the target price and the price path differ
    const M = run({ defs: [{ L, day: 100 }], main: 1 }), mc0 = M.cuts[0], mk = mc0 && closeAfter(M, mc0.bank, mc0.day), t4 = 'TC-R4C-B4 (' + rg + ')';
    pre(!!mc0 && !!mk, t4 + ' world: the old-code run has the same default and close (' + (mc0 && mc0.day) + ', ' + (mk && mk.day) + ')');
    if (mc0 && mk) {
      const diff = ['A', 'cs', 'D', 'sh', 'ni', 'yni', 'eqi', 'est'].filter(k => mk.post[k] !== cl.post[k]).concat(mk.post.eh.join() === cl.post.eh.join() ? [] : ['eh'], JSON.stringify(mk.er) === JSON.stringify(cl.er) ? [] : ['er']);
      ok(diff.length === 0, t4 + ' the close on day ' + cl.day + ' is the same as with the old code (assets, cash, deposits, shares, net income, yearly income, EPS history, estimate, results): differing ' + (diff.join(',') || 'none'));
      ok(mc0.s1.tg === mc0.s0.tg && cut.tgNow !== mc0.s1.tg, t4 + ' the old code leaves the target price at ' + f1(mc0.s1.tg) + ' on the default day; R4C puts it at ' + f1(cut.tgNow));
      info(t4 + ' bank price, old code / R4C: ' + [100, 110, 149, 150, 151, 160].map(d => 'day ' + d + ' ' + f1(at(M, mc0.bank, d).p) + ' / ' + f1(at(B1, cut.bank, d).p)).join(' | '));
    }
  }
  // B2 BOAX-like: the bank takes a loan-to-own stake; the stake value enters equity (instantly); the same checks
  const t2 = 'TC-R4C-B2 (' + rg + ', loan-to-own)', B2 = run({ stake: 1, defs: [{ L, day: 100 }] }), c2 = B2.cuts[0], k2 = c2 && closeAfter(B2, c2.bank, c2.day);
  pre(!!c2 && c2.stakeNow > 0 && !!k2 && !k2.bk && !k2.bank.dead, t2 + ' world: loan-to-own stake ' + (c2 && f1(c2.stakeNow)) + '%, close on day ' + (k2 && k2.day));
  if (c2 && k2) { checkCut(t2, B2, c2, { stake: 1, positive }); ok(c2.changed.includes('pos') && c2.s1.pfv > 0, t2 + ' the stake is registered on the bank (pos) and valued ' + f4(c2.s1.pfv)); checkClose(t2, B2, c2, k2); table(t2, B2, c2, k2) }
}
// B3 short history (positive regime): a bank with no published quarter yet, and one with two (its first close, day 60)
for (const [ehLen, L, lab] of [[0, 12, 'no published quarter'], [2, 30, 'two published quarters']]) {
  const tag = 'TC-R4C-B3 (' + lab + ')', R = run({ ehLen, defs: [{ L, day: 40 }], last: 72 }), c = R.cuts[0], k = c && closeAfter(R, c.bank, c.day);
  pre(!!c && !!k && k.day === 60 && c.s0.eh.length === ehLen && !k.bk, tag + ' world: default day ' + (c && c.day) + ', close day ' + (k && k.day) + ', published quarters at the default ' + (c && c.s0.eh.length));
  if (c && k) { checkCut(tag, R, c, { positive: true }); checkClose(tag, R, c, k) }
}

// ---- C: several write-offs ---------------------------------------------------------------------------------------------------
console.log('-- TC-R4C-C several write-offs');
for (const [rg, L1, L2, positive] of [['strong', 150, 250, false], ['mild', 20, 30, true]]) {
  // C1 two borrowers of one bank default in the same quarter (days 95 and 100): the same as one borrower with the sum of both loans
  const tag = 'TC-R4C-C1 (' + rg + ')', X = run({ defs: [{ L: L1, day: 95, pi: 0 }, { L: L2, day: 100, pi: 1 }] }), [x1, x2] = X.cuts, kx = x2 && closeAfter(X, x2.bank, x2.day);
  pre(X.cuts.length === 2 && !!kx && kx.day === 150 && !kx.bk, tag + ' world: two write-offs on days ' + (x1 && x1.day) + ' and ' + (x2 && x2.day) + ', one close on day ' + (kx && kx.day));
  if (x1 && x2 && kx) {
    checkCut(tag + ' first', X, x1);
    ok(near(x2.s1.woq, x1.w + x2.w, 1e-12) && near(x2.s0.woq, x1.w, 1e-12), tag + ' second default: waiting ' + f4(x2.s0.woq) + ' + ' + f4(x2.w) + ' = ' + f4(x2.s1.woq) + ' (each loss once)');
    const e12 = epsSpec(x1.s0, x1.w + x2.w);
    pre((e12 > 0) === positive, tag + ' regime: valuation EPS with both losses ' + f4(e12));
    ok(near(x2.tgNow, x2.val(e12), 1e-9) && x2.s0.eh.join() === x1.s0.eh.join() && x2.s0.est === x1.s0.est, tag + ' second default: target price ' + f4(x2.tgNow) + ' = formula on the spec EPS with BOTH losses once, built from the history before the first default (EPS ' + f4(e12) + ')');
    ok(x2.tgNow < x1.tgNow && x2.changed.every(k => MAY_CHANGE.includes(k)), tag + ' second default: target price ' + f1(x1.tgNow) + ' -> ' + f1(x2.tgNow) + ', bank record changed in ' + x2.changed.join(', ') + ' only');
    checkClose(tag, X, x1, kx);
    ok(near(kx.er.wo, x1.w + x2.w, 1e-12), tag + ' the close books both losses in one line: ' + f4(kx.er.wo) + ' = ' + f4(x1.w) + ' + ' + f4(x2.w));
    const Y = run({ defs: [{ L: L1 + L2, day: 100 }] }), y = Y.cuts[0], ky = y && closeAfter(Y, y.bank, y.day);
    pre(!!y && !!ky && near(y.loan, x1.loan + x2.loan, 1e-9), tag + ' single-borrower world: loan ' + (y && f4(y.loan)) + ' vs the two loans ' + f4(x1.loan + x2.loan));
    if (y && ky) {
      const d = ['A', 'cs', 'D', 'woq', 'eq', 'tg'].filter(k => !near(y.s1[k], x2.s1[k], 1e-9));
      ok(d.length === 0, tag + ' after the second default the bank is the same as after one combined write-off (assets, cash, deposits, waiting loss, equity, target price ' + f4(x2.tgNow) + ' vs ' + f4(y.tgNow) + '): differing ' + (d.join(',') || 'none'));
      ok(near(ky.post.tg, kx.post.tg, 1e-9) && near(ky.er.ni, kx.er.ni, 1e-9) && near(ky.er.wo, kx.er.wo, 1e-12) && ky.post.eh.join() === kx.post.eh.join(), tag + ' and the close is the same: net income ' + f4(kx.er.ni) + ' vs ' + f4(ky.er.ni) + ', target price ' + f4(kx.post.tg) + ' vs ' + f4(ky.post.tg));
    }
  }
}
{
  // C2 a second default after the first one's close: the first loss is already in eh (once), only the new one is pending
  const Z = run({ defs: [{ L: 30, day: 100, pi: 0 }, { L: 15, day: 200, pi: 1 }], last: 252 }), [z1, z2] = Z.cuts, k1 = z1 && closeAfter(Z, z1.bank, z1.day), k2 = z2 && closeAfter(Z, z2.bank, z2.day);
  pre(Z.cuts.length === 2 && !!k1 && !!k2 && k1.day === 150 && k2.day === 240 && !k1.bk && !k2.bk, 'TC-R4C-C2 world: defaults on days ' + (z1 && z1.day) + ', ' + (z2 && z2.day) + '; closes on days ' + (k1 && k1.day) + ', ' + (k2 && k2.day));
  if (z1 && z2 && k1 && k2) {
    checkCut('TC-R4C-C2 first', Z, z1, { positive: true }); checkClose('TC-R4C-C2 first', Z, z1, k1); checkCut('TC-R4C-C2 second', Z, z2, { positive: true }); checkClose('TC-R4C-C2 second', Z, z2, k2);
    ok(z2.s0.woq === 0 && near(z2.s1.woq, z2.w) && near(k2.er.wo, z2.w, 1e-12), 'TC-R4C-C2 the second quarter waits only for its own loss (' + f4(z2.s1.woq) + ') and books only that (' + f4(k2.er.wo) + '), not ' + f4(z1.w + z2.w));
    ok(z2.s0.eh.join() === k1.post.eh.join(), 'TC-R4C-C2 the first loss is in the published EPS history once (last quarter ' + f1(k1.post.eh[k1.post.eh.length - 1]) + ') and the second default is valued on top of it: target ' + f1(z2.tgNow));
  }
}

// ---- D: two banks, the same day -----------------------------------------------------------------------------------------------
console.log('-- TC-R4C-D two banks default on the same day (bank 1 mild, bank 2 strong)');
{
  const d0 = { bank: 0, L: 30, day: 100, pi: 0 }, d1 = { bank: 1, L: 200, day: 100, pi: 1 };
  const D12 = run({ nb: 2, defs: [d0, d1] }), D1 = run({ nb: 2, defs: [d0, Object.assign({}, d1, { day: null })] }), D2 = run({ nb: 2, defs: [Object.assign({}, d0, { day: null }), d1] });
  const cutOf = (R, bank) => R.cuts.find(z => z.bank === R.W.banks[bank]);
  const a12 = cutOf(D12, 0), b12 = cutOf(D12, 1), a1 = cutOf(D1, 0), b2 = cutOf(D2, 1);
  pre(D12.cuts.length === 2 && D1.cuts.length === 1 && D2.cuts.length === 1 && !!a12 && !!b12 && !!a1 && !!b2, 'TC-R4C-D world: write-offs ' + D12.cuts.length + ' (both banks), ' + D1.cuts.length + ' (bank 1 only), ' + D2.cuts.length + ' (bank 2 only)');
  if (a12 && b12 && a1 && b2) {
    checkCut('TC-R4C-D bank 1', D12, a12, { positive: true }); checkCut('TC-R4C-D bank 2', D12, b12, { positive: false });
    ok(a12.w !== b12.w && near(a12.tgNow, a1.tgNow, 1e-12) && near(a12.s1.woq, a1.s1.woq, 0), 'TC-R4C-D bank 1 on the day both default: target ' + f4(a12.tgNow) + ' = when only it defaults ' + f4(a1.tgNow) + ' (write-offs differ: ' + f2(a12.w) + ' / ' + f2(b12.w) + ')');
    ok(near(b12.tgNow, b2.tgNow, 1e-12) && near(b12.s1.woq, b2.s1.woq, 0), 'TC-R4C-D bank 2 on the day both default: target ' + f4(b12.tgNow) + ' = when only it defaults ' + f4(b2.tgNow));
    const o2 = D1.W.banks[1], o1 = D2.W.banks[0];
    ok(at(D1, o2, 101).tg === at(D1, o2, 99).tg && at(D1, o2, 100).woq === 0 && at(D2, o1, 101).tg === at(D2, o1, 99).tg && at(D2, o1, 100).woq === 0, 'TC-R4C-D the bank whose borrower does not default keeps its target price and queues nothing');
    const k12a = closeAfter(D12, a12.bank, 100), k12b = closeAfter(D12, b12.bank, 100), k1 = closeAfter(D1, a1.bank, 100), k2 = closeAfter(D2, b2.bank, 100);
    pre(!!k12a && !!k12b && !!k1 && !!k2, 'TC-R4C-D every bank has its close');
    if (k12a && k12b && k1 && k2) {
      checkClose('TC-R4C-D bank 1', D12, a12, k12a); checkClose('TC-R4C-D bank 2', D12, b12, k12b);
      ok(near(k12a.post.tg, k1.post.tg, 1e-12) && near(k12a.er.wo, k1.er.wo, 0) && near(k12a.er.ni, k1.er.ni, 1e-12) && near(k12b.post.tg, k2.post.tg, 1e-12) && near(k12b.er.wo, k2.er.wo, 0) && near(k12b.er.ni, k2.er.ni, 1e-12), 'TC-R4C-D each close is the same as in the world where only that bank is hit (targets ' + f4(k12a.post.tg) + ' / ' + f4(k12b.post.tg) + ', write-offs ' + f4(k12a.er.wo) + ' / ' + f4(k12b.er.wo) + ')');
    }
  }
}

// ---- E: the bank is settled before its close (R2) -----------------------------------------------------------------------------
console.log('-- TC-R4C-E the bank is settled before its close (kill: bankruptcy m=.02, nationalisation m=.6, takeover m=1.3)');
for (const m of [.02, .6, 1.3]) {
  const rec = {};
  const R = run({ last: 125, defs: [{ L: 200, day: 100 }],
    beforeDay: (R, d) => { if (d === 99) { const b = R.W.banks[0]; setOwn(b, 'P', 20); b.bs.P = 0; S.loss = 0 } },
    onDay: (R, d) => { if (d === 105 && !rec.done) { rec.done = 1; const b = R.W.banks[0]; rec.mc = mc(b); rec.cash0 = S.cash; kill(b, m); rec.cash1 = S.cash } } });
  const cut = R.cuts[0], b = R.W.banks[0];
  pre(!!cut && rec.done && b.dead === 1, 'TC-R4C-E (m=' + m + ') world: default on day ' + (cut && cut.day) + ', the bank is settled on day 105');
  if (cut && rec.done) {
    checkCut('TC-R4C-E (m=' + m + ')', R, cut);
    ok(near(rec.cash1 - rec.cash0, .78 * .2 * rec.mc * m, 1e-9), 'TC-R4C-E (m=' + m + ') the player\'s 20% is paid at market cap ' + f4(rec.mc) + ' x ' + m + ' less 22% tax: ' + f4(rec.cash1 - rec.cash0) + ' (the existing rule, core.js payK / sim.js kill; the lower target price changes no payout formula)');
    ok(near(b.woq, cut.w, 1e-12), 'TC-R4C-E (m=' + m + ') the waiting loss stays on the dead bank, as before R4C (R2): woq ' + f4(b.woq) + ' (nothing books it)');
    ok(S.co.every(c => isFinite(c.p) && c.p > 0 && isFinite(c.tg)) && R.err == null, 'TC-R4C-E (m=' + m + ') twenty days after the settlement every price and target is finite and positive, no error');
  }
}

// ---- F: equity at or below zero after the cut (logged, not judged) ------------------------------------------------------------
console.log('-- TC-R4C-F bank equity at or below zero after the cut (no new price floor; the cases are material for a separate decision)');
for (const L of [500, 533.34, 600, 800]) {
  const R = run({ defs: [{ L, day: 100 }], last: 175 }), c = R.cuts[0], k = c && closeAfter(R, c.bank, c.day);
  pre(!!c && !!k, 'TC-R4C-F (loan ' + L + ') world: default day ' + (c && c.day) + ', bank close ' + (k && k.day));
  if (c && k) {
    const z = R.series[c.bank.id].filter(q => q.d >= c.day && q.d <= k.day + 12);
    ok(isFinite(c.tgNow) && c.tgNow > 0 && near(c.tgNow, c.expTg, 1e-9), 'TC-R4C-F (loan ' + L + ') book equity ' + f1(c.s0.eq) + ' -> ' + f1(c.s1.eq) + ': target price ' + f4(c.tgNow) + ' = the existing formula on the spec EPS (' + f4(c.expTg) + ') with no extra floor or guard');
    ok(z.every(q => isFinite(q.p) && q.p >= 60 && isFinite(q.tg) && q.tg > 0), 'TC-R4C-F (loan ' + L + ') price and target stay finite and at or above the existing 60 floor on every day from the default to the close + 12 (lowest price ' + f1(Math.min(...z.map(q => q.p))) + ')');
    ok(near(k.er.wo, c.w, 1e-12) && k.post.woq === 0 && near(k.post.tg, k.expTg, 1e-9), 'TC-R4C-F (loan ' + L + ') the close books the write-off once (' + f4(k.er.wo) + ') and clears the queue; the bank\'s own chapter 11 at the close: bk ' + k.bk + ', equity at the close ' + f1(k.post.eq) + ', target ' + f1(k.post.tg));
    info('TC-R4C-F (loan ' + L + ') target: before ' + f1(c.s0.tg) + ', book-only ' + f1(c.tgBook) + ', R4C ' + f1(c.tgNow) + ' | price: default ' + f1(c.s0.p) + ' -> d+10 ' + f1(at(R, c.bank, c.day + 10).p) + ', close-1 ' + f1(at(R, c.bank, k.day - 1).p) + ', close ' + f1(at(R, c.bank, k.day).p) + ', c+1 ' + f1(at(R, c.bank, k.day + 1).p) + ', c+12 ' + f1(at(R, c.bank, k.day + 12).p) + ' | target after the close ' + f1(k.post.tg));
  }
}

// ---- G: rights issue and bank run between the default and the close (differences traced, equality not forced) ------------------
console.log('-- TC-R4C-G regulator check on day 90, between the default (day 75) and the close (day 150)');
for (const [L, lab] of [[300, 'rights issue (BIS 7.7% after the cut)'], [500, 'rights issue and bank run (BIS 1.2% after the cut)']]) {
  const R = run({ defs: [{ L, day: 75 }], last: 162 }), c = R.cuts[0], k = c && closeAfter(R, c.bank, c.day), q = c && R.qs.find(z => z.day === 90 && z.bank === c.bank), tag = 'TC-R4C-G (' + lab + ')';
  pre(!!c && !!k && !!q && q.b.sh > q.a.sh && !k.bk, tag + ' world: default day ' + (c && c.day) + ', the day-90 check issued shares ' + (q && f2(q.a.sh) + ' -> ' + f2(q.b.sh)) + ', close day ' + (k && k.day));
  if (c && k && q) {
    checkCut(tag, R, c);
    ok(near(q.b.sh, q.a.sh * 1.1, 1e-12) && near(q.b.p, q.a.p * .95, 1e-12) && q.b.woq === q.a.woq, tag + ' the issue is the existing rule: shares x1.1, price x0.95, the waiting loss ' + f4(q.b.woq) + ' untouched by it' + (q.b.jx < q.a.jx ? '; bank run jump ' + f4(q.b.jx - q.a.jx) : ''));
    ok(q.b.tg === q.a.tg && q.a.tg === c.tgNow, tag + ' KNOWN LIMIT: the regulator check does not refresh the target price (' + f4(q.a.tg) + ' -> ' + f4(q.b.tg) + '), as before R4C');
    info(tag + ' had it been refreshed: target ' + f1(q.freshA) + ' before the check, ' + f1(q.freshB) + ' after it (shares ' + f2(q.a.sh) + ' -> ' + f2(q.b.sh) + ', equity ' + f1(q.a.eq) + ' -> ' + f1(q.b.eq) + ', waiting loss per share ' + f2(c.s1.woq * 1e4 / q.a.sh) + ' -> ' + f2(c.s1.woq * 1e4 / q.b.sh) + ')');
    ok(isFinite(q.freshB) && q.freshB > 0, tag + ' the valuation stays well-defined after the issue (loss per share on the NEW share count, finite positive target ' + f1(q.freshB) + ')');
    checkClose(tag, R, c, k);
    ok(near(k.post.eh[k.post.eh.length - 1], Math.round(k.post.ni * 1e5 / k.post.sh) / 10, 0), tag + ' the published EPS divides the loss by the shares at the close (' + f2(k.post.sh) + '); target ' + f1(c.tgNow) + ' (default day) -> ' + f1(k.post.tg) + ' (after the close): the difference is the issue and the close, not a leftover of the temporary term');
    table(tag, R, c, k);
  }
}

// ---- G3: the AI's 1:10 reverse split of a cheap stock between the default and the close (the default drives the price under 1,000) ---
console.log('-- TC-R4C-G3 reverse split 1:10 of the bank on day 120, between the default (day 100) and the close (day 150)');
{
  const rec = {};
  const R = run({ defs: [{ L: 200, day: 100 }], last: 162, onDay: (R, d) => { if (d === 120 && !rec.done) { rec.done = 1; const b = R.W.banks[0]; rec.b = b; rec.tg0 = b.tg; rec.v0 = tgCalc(b); rec.w0 = b.woq; rec.eq0 = eq(b); splitDo(b, .1, 1); rec.tg1 = b.tg; rec.v1 = tgCalc(b); rec.w1 = b.woq; rec.eq1 = eq(b) } } });
  const c = R.cuts[0], k = c && closeAfter(R, c.bank, c.day), tag = 'TC-R4C-G3';
  pre(!!c && !!k && rec.done && !k.bk, tag + ' world: default day ' + (c && c.day) + ', split on day 120, close day ' + (k && k.day));
  if (c && k && rec.done) {
    checkCut(tag, R, c);
    ok(near(rec.tg1, rec.tg0 * 10, 1e-12) && rec.w1 === rec.w0 && near(rec.eq1, rec.eq0, 1e-12), tag + ' the split scales the stored target price x10 (' + f2(rec.tg0) + ' -> ' + f2(rec.tg1) + '); the waiting loss ' + f4(rec.w1) + ' and the equity ' + f4(rec.eq1) + ' are not per-share numbers and do not change');
    ok(near(rec.v1, rec.v0 * 10, 2e-3), tag + ' the valuation after the split is the valuation before it x10 (' + f2(rec.v0) + ' -> ' + f2(rec.v1) + '): loss per share, EPS history, estimate and shares are all rescaled together, nothing is counted twice');
    checkClose(tag, R, c, k, 10);
    table(tag, R, c, k);
  }
}

// ---- S: saves ---------------------------------------------------------------------------------------------------------------------
console.log('-- TC-R4C-S save and load between the default and the close (autosave and export formats; a save written before R4C)');
{
  const ref = run({ defs: [{ L: 30, day: 100 }], last: 162 }), rc = ref.cuts[0], rk = rc && closeAfter(ref, rc.bank, rc.day);
  pre(!!rc && !!rk, 'TC-R4C-S reference run (no saving): default day ' + (rc && rc.day) + ', close day ' + (rk && rk.day));
  for (const [fmt, strip, stale] of [['autosave (full)', 0, 0], ['export (packS(1), histories left out)', 1, 0], ['save written before R4C (target price still the stale value)', 0, 1]]) {
    const tag = 'TC-R4C-S ' + fmt, R = run({ defs: [{ L: 30, day: 100 }], last: 101 }), b = R.W.banks[0], id = b.id, c = R.cuts[0];
    const keep = { tg: b.tg, woq: b.woq, eh: b.eh.join(), est: b.est, p: b.p, sh: b.sh };
    pre(!!c && keep.woq > 0 && keep.tg === c.tgNow, tag + ' world: saved on day ' + S.day + ' with ' + f4(keep.woq) + ' waiting and target ' + f4(keep.tg));
    if (stale) b.tg = c.s0.tg;                                                           // what a save written by the code before R4C holds
    const txt = await packS(strip), s2 = await loadStr(txt); S = s2; v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null;   // what importing a save does
    const b2 = S.co[id];
    ok(b2 !== b && near(b2.woq, keep.woq, 0) && b2.tg === (stale ? c.s0.tg : keep.tg), tag + ': after loading woq ' + f4(b2.woq) + ', target ' + f4(b2.tg) + (stale ? ' (not re-valued retroactively: the stale ' + f4(c.s0.tg) + ' stays until the close)' : ' (as saved)'));
    let cl = null, tgMid = true;
    const e0 = earn;
    earn = function (x) {
      if (x.id !== id) return e0(x);
      const pr = snap(x); e0(x);
      if (x.er && x.er.d === S.day && !cl) { const post = snap(x); cl = { day: S.day, pre: pr, post, er: Object.assign({}, x.er), expTg: valOf(x)(epsTrail(post)) * (1 + pr.surp) } }
    };
    try { for (let d = 0; d < 80 && !cl; d++) { step(); if (mdl) G.mk(mdl.o.length - 1); if (!cl && S.co[id].tg !== b2.tg && S.co[id].woq > 0) tgMid = false } } finally { earn = e0 }
    ok(!!cl && cl.day === rk.day && near(cl.er.wo || 0, keep.woq, 1e-12) && cl.post.woq === 0, tag + ': the close after loading (day ' + (cl && cl.day) + ') books ' + f4(cl && cl.er.wo) + ' once, nothing left waiting');
    ok(tgMid, tag + ': the target price does not move between loading and the close');
    if (cl) {
      ok(near(cl.post.tg, cl.expTg, 1e-9), tag + ': target price after that close ' + f4(cl.post.tg) + ' = existing formula on the confirmed EPS (' + f4(cl.expTg) + ')');
      if (!strip) ok(cl.er.ni === rk.er.ni && cl.er.wo === rk.er.wo && cl.post.eh.join() === rk.post.eh.join() && near(cl.post.tg, rk.post.tg, 1e-12), tag + ': same close as the run without saving (net income ' + f4(cl.er.ni) + ' vs ' + f4(rk.er.ni) + ', target ' + f4(cl.post.tg) + ' vs ' + f4(rk.post.tg) + ')');
    }
  }
}

// ---- H: the natural BOAX case -----------------------------------------------------------------------------------------------------
console.log('-- TC-R4C-H natural play, seed 12345: BOAX writes off its loan to JYNR (default day 431, close day 494, 286.97)');
{
  const H = run({ nat: 12345, last: 560 }), c = H.cuts.find(z => z.bank.tk === 'BOAX'), k = c && closeAfter(H, c.bank, c.day);
  pre(!!c && c.day === 431 && c.borrower.tk === 'JYNR' && near(c.w, 286.97, 1e-4) && !!k && k.day === 494, 'TC-R4C-H world: ' + (c && c.bank.tk) + ' / ' + (c && c.borrower.tk) + ' default day ' + (c && c.day) + ', write-off ' + (c && f4(c.w)) + ', close day ' + (k && k.day) + ' (' + H.cuts.length + ' write-offs in 560 days)');
  if (c && k) {
    checkCut('TC-R4C-H', H, c, { stake: 1 }); checkClose('TC-R4C-H', H, c, k);
    info('TC-R4C-H stale-target check: stored target before the default ' + f4(c.s0.tg) + ', the formula on that day\'s inputs ' + f4(c.fresh0) + ' (difference ' + f4(100 * (c.fresh0 / c.s0.tg - 1)) + '%): the re-valuation moves the target by the write-off plus any drift since the last close');
    const mid = H.series[c.bank.id].filter(z => z.d >= c.day && z.d < k.day);
    ok(mid.length > 50 && mid.every(z => z.tg === c.tgNow), 'TC-R4C-H the target price stays ' + f4(c.tgNow) + ' from the default to the day before the close (' + mid.length + ' days)');
    table('TC-R4C-H', H, c, k);
    info('TC-R4C-H target: before ' + f1(c.s0.tg) + ' | default day: book-only ' + f1(c.tgBook) + ', with the waiting loss ' + f1(c.tgNow) + ' | after the close ' + f1(k.post.tg));
  }
}
} catch (e) { errs++; console.log('ERR  ' + (e && e.stack || e)) }
})().catch(e => { errs++; console.log('ERR  ' + (e && e.stack || e)) }).finally(() => console.log('errs', errs, 'fails', fails));
