// REG-01 (RT-BANK-001 follow-up, approved 2026-10-18): a bank close in which the asset impairment (imp, `impair`) and the
// bank loan write-off (wo, `woBook`) both happen, against the three other combinations. Design report: 2026-10-18.
//
// WHAT IS CHECKED, in one bank close (the bank's first close, day 60; no bankQ day (90) falls inside, so no rights issue):
//   A  impairment only         D  neither              B  write-off only          C  both
//   T0 = before the borrower's first chapter 11     T1 = right after the 30% cut (ch11x)
//   T2 = just before the bank's close (earn)        T3 = after the close (impair, the bank's own chapter 11 included)
// plus four "twins" of case C on ONE economic path: the queued write-off dropped right after the cut (so woBook has nothing
// to report) and/or `impair` doing nothing (earn has already cut the assets, impair only books the charge). Same balance
// sheet, cash, debt, tax, dividends and reserve in all four; net income differs by exactly the charge that is left out.
//
// WHERE THE EXPECTED VALUES COME FROM (nothing is copied from a run):
//   [I] accounting identities that hold whatever the game rules are: cash roll-forward, book-equity change of a close,
//       net income = sum of its parts, the window T0 -> T3 (the cut is already inside net income).
//   [R] rules written in the code (file:line in the message), evaluated on the inputs and on the snapshot taken just before
//       the close: 30% cut (sim.js ch11x), growth A*g/4 (earn), tax = ctax*pre, dividends, the ds streak and impair
//       thresholds (earn), the bank's own chapter 11 and its debt relief, the llr roll-forward (bankOp).
//   [M] a rule of the CURRENT game model that is not an identity: cfo = cp - tax + dr (cash profit minus tax plus dividends
//       received; the non-cash charges are added back). Passing says the game follows its model, not that the model is right.
//   [O] observations that are only logged, never judged: dD, cap, cff, oth (FIN-CF-01: a chapter 11 debt relief is not
//       cash, but fqDerive shows it in 'financing' and 'other'; open accounting-model review item, docs/MODEL.md).
//
// FIXTURE vs CALCULATION FAILURES: a line starting `ERR  FIXTURE INVALID` means the test world is not the one the
// expectations assume (a precondition); a line starting `FAIL` means the game computed something different from the
// expectation in a valid world. Both fail the test (errs / fails), with different labels.
//
// SYNTHETIC vs NATURAL: cases A..D are built states. `ds` (the distress streak), the equity-method loss `eqi` and the
// bank's capital are SET so that the paths run; on the test seeds 12345/777/20261016 x 720 days no bank has ever
// impaired, and none has had both. This test proves the arithmetic of the path, not that the path is reached in play.
// The last part scans natural play on two seeds, reports what happens (information) and judges only the closes where an
// imp or wo does occur.
//
// NOT COVERED (see docs/MODEL.md, REG-01): the ds streak made by the write-off itself, two real closes (statement quarter
// with a real previous quarter), a bank that dies in the close, several borrowers, a player-owned bank, parent >= 80%.
let errs = 0, fails = 0;
(() => {   // own scope: the game already has globals such as A and B
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ };
const pre = (c, m) => { console.log((c ? 'pre  ' : 'ERR  FIXTURE INVALID: ') + m); if (!c) errs++ };
const f4 = x => x == null ? '-' : (+x).toFixed(4), f1 = x => x == null ? '-' : (+x).toFixed(1);
const near = (a, b, t) => Math.abs(a - b) <= (t == null ? 1e-9 : t) * Math.max(1, Math.abs(a), Math.abs(b));
const BE = c => c.A + c.cs + c.gw - c.D + (c.fmg || 0);
const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const play = (days, stop) => { for (let d = 0; d < days; d++) { step(); if (mdl) G.mk(mdl.o.length - 1); if (stop && stop()) return true } return false };
const ePart = v => Math.abs(v) >= 10 ? 0.5 : 0.05;              // largest r1 rounding error of a recorded value
const ROW_NC = '손상·대손상각(비현금 조정)';
const num = s => s == null || s === '–' ? null : s.endsWith('조') ? parseFloat(s) * 1e4 : parseFloat(s.replace(/,/g, ''));
const shownErr = s => s.endsWith('조') ? 50 : Math.abs(num(s)) >= 10 ? 0.5 : 0.05;

// ---- the tabs as rendered ------------------------------------------------------------------------------------------
function opSection(c) {      // operating section of the 현금흐름 tab, newest quarter first, and the values behind it
  sel = -1; pg = ''; tab = 'h'; S.spd = 0; G.pick(c.id); G.stab('f'); G.fseg(3); render();
  const h = document.getElementById('sh').innerHTML;
  const row = lab => { const part = h.split('<td>' + lab + '</td>')[1]; return part == null ? null : [...part.split('</tr>')[0].matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m => m[1]) };
  const cols = fqL(c).slice().reverse(), rec = c.fq.slice().reverse();
  return { clean: !/NaN|undefined|Infinity|\[object/.test(h), ni: row('순이익'), dep: row('감가상각(비현금)'), adj: row('지분법·상각 조정'), nc: row(ROW_NC), cfo: row('영업활동 현금흐름'),
    want: cols.map((q, j) => { const d = fqDerive(c, q, cols[j + 1]); return { ni: q.ni, dep: d.dep, adj: q.ga - q.eq, imp: q.imp || 0, wo: q.wo || 0, nc: (q.imp || 0) + (q.wo || 0), cfo: d.cfo, fields: rec[j].length } }) };
}
function incomeStmt(c) {     // income statement (손익) tab; column 0 is the last-4-quarters total, column 1 the newest quarter
  sel = -1; pg = ''; tab = 'h'; S.spd = 0; G.pick(c.id); G.stab('f'); G.fseg(1); render();
  const h = document.getElementById('sh').innerHTML;
  return { clean: !/NaN|undefined|Infinity|\[object/.test(h), has: lab => h.includes('<td>' + lab + '</td>'),
    cells: lab => [...((h.split('<td>' + lab + '</td>')[1] || '').split('</tr>')[0]).matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m => m[1]) };
}

// ---- the world -----------------------------------------------------------------------------------------------------
// seed 12345, mulberry(20261016); the first bank: assets 1,000, cash 20, deposits 960 (book equity 60), llr 10, a pending
// equity-method loss eqi = -100 (SYNTHETIC: makes net income negative whatever the write-off, so the ds streak runs the
// same way with and without it), a 25% holder; the first non-bank company is the borrower (assets 150, debt 200 owed to
// the bank, equity -50: its own close puts it into chapter 11).
const KIND = { A: { ds: 3, def: false, imp: true }, B: { ds: 0, def: true, imp: false }, C: { ds: 3, def: true, imp: true }, D: { ds: 0, def: false, imp: false } };
function world(kind) {
  const k = KIND[kind];
  Math.random = mulberry(20261016);
  init(Object.assign(defCfg(), { tut: 0, seed: 12345 })); mdl = null;
  const b = S.co.find(x => x.kd === 1 && !x.dead);
  const pool = S.co.filter(x => !x.kd && !x.dead && !mine(x) && x.bk === 0 && !x.priv && x.id !== b.id), c = pool[0], parent = pool.find(x => x !== c && !b.own['c' + x.id]);
  b.A = 1000; b.cs = 20; b.D = 960; b.gw = 0; if (!b.ba) bankInit(b); b.llr = 10; b.ds = k.ds; b.eqi = -100;
  setOwn(b, 'c' + parent.id, 25); ctlAll();
  if (k.def) { c.ln = b.id; c.bond = 0; c.pa = 0; c.bh = 0; c.A = 150; c.cs = 0; c.gw = 0; c.D = 200; c.bk = 0 }
  return { b, c, parent };
}
// run one world to the bank's first close. opt.dropWo: the queued write-off is dropped right after the cut; opt.noImp:
// impair() books nothing (the assets are cut by earn before it is called)
function run(kind, opt) {
  opt = opt || {};
  const { b, c, parent } = world(kind), T = {}; let rec = null, entry = null, impN = 0;
  const x0 = ch11x, e0 = earn, i0 = impair, h0 = ch11;
  ch11x = function (x, why) {
    if (x !== c || x.bk !== 0 || T.A0 != null) return x0(x, why);
    T.day0 = S.day; T.A0 = b.A; T.loan = loanOf(x); T.BE0 = BE(b); T.dr0 = b.dr || 0; T.llr0 = b.llr; const q0 = b.woq || 0;
    x0(x, why);
    T.A1 = b.A; T.queued = (b.woq || 0) - q0; T.llr1 = b.llr; if (opt.dropWo) b.woq = q0;
  };
  ch11 = function (x, why) { if (x === b && !entry) entry = { eq: eq(b), A: b.A, D: b.D, pfv: pfv(b) }; return h0(x, why) };
  impair = function (x, wd) { if (x === b) { impN++; if (opt.noImp) return } return i0(x, wd) };
  earn = function (x) {
    if (x !== b) return e0(x);
    const s = { day: S.day, A: b.A, cs: b.cs, gw: b.gw, D: b.D, pfv: pfv(b), eq: eq(b), BE: BE(b), woq: b.woq || 0, ds: b.ds, nol: b.nol, prime: S.prime, g: b.g, sh: b.sh,
      eqi: b.eqi, dr: b.dr || 0, llr: b.llr, bk: b.bk, yni: b.yni || 0, pay: b.pay, dban: b.dban, taxRate: ctax(b), par: !!cPar(b) };
    const pe0 = parent.eqi; e0(x);
    if (b.er && b.er.d === S.day && !rec) rec = { s, er: Object.assign({}, b.er), A: b.A, cs: b.cs, gw: b.gw, D: b.D, BE: BE(b), ni: b.ni, yni: b.yni, eh: b.eh[b.eh.length - 1],
      fq: b.fq[b.fq.length - 1].slice(), llr: b.llr, bkr: Object.assign({}, b.bkr), ba: Object.assign({}, b.ba), bk: b.bk, ds: b.ds, woq: b.woq, sh: b.sh, dead: b.dead, pd: parent.eqi - pe0 };
  };
  play(120, () => rec);
  ch11x = x0; earn = e0; impair = i0; ch11 = h0;
  const R = { kind, opt, b, c, T, rec, entry, impN };
  if (rec && !b.dead) {
    const L = fqL(b), q = L[L.length - 1], pv = L[L.length - 2], d = fqDerive(b, q, pv);
    R.cf = { cfo: d.cfo, cff: d.cff, oth: d.oth, dc: d.dc, dD: q.D - pv.D, q }; R.op = opSection(b); R.is = incomeStmt(b);
  }
  return R;
}

// ---- expected values: from the inputs (fixture + snapshot T2) and the stated rules, never from the run's own outputs ----
function expectOf(R) {
  const { T, rec, opt, kind } = R, s = rec.s, er = rec.er, K = KIND[kind], E = {};
  E.ls = K.def ? 0.3 * T.loan : 0;                                 // [R] sim.js ch11x: 30% of the borrower's bank loan
  E.woRep = K.def && !opt.dropWo ? E.ls : 0;                       //     what woBook reports in this close
  E.gr = s.A * s.g / 4;                                            // [R] sim.js earn: growth (A and D grow together for a bank)
  E.iinc = s.cs * (s.prime - 2) / 400;                             // [R] earn: interest income on cash
  E.cp = er.op - er.it + E.iinc;                                   //     er.op / er.it are inputs of this close (bankOp), judged elsewhere
  E.pre = E.cp - s.gw * .025;                                      // [R] earn: pre-tax (goodwill amortization 2.5% of gw)
  E.tax = E.pre * s.taxRate;                                       // [R] cTax: no loss carryforward, no parent
  E.dv = Math.max(0, E.cp - E.tax + s.dr) * (s.dban ? 0 : s.pay);  // [R] earn: dividends
  E.niPre = E.pre - E.tax + s.eqi + s.dr;                          // [R] earn: net income before write-off and impairment
  E.cs3 = s.cs + E.cp - E.tax - E.dv;                              // [I] cash roll-forward
  E.A0i = s.A + E.gr; E.Dgr = s.D + E.gr;
  E.eEntry = s.eq + (E.cp - E.tax) - E.dv;                         // [I] equity just before the ds test: retained cash profit; A and D grew together
  E.ratio = E.Dgr / Math.max(E.eEntry, 1);
  E.ds1 = (E.niPre - E.woRep < 0 && E.ratio > 12) ? s.ds + 1 : 0;  // [R] earn: distress streak (bank: debt / equity > 12)
  E.fires = E.ds1 >= 4 && E.eEntry > -0.3 * E.A0i;                 // [R] earn: impairment
  E.wd = E.fires ? E.eEntry + 0.3 * E.A0i : 0;                     // [R] earn: assets cut until equity = -30% of assets
  E.impRep = E.fires && !opt.noImp ? E.wd : 0;
  E.A3 = E.A0i - E.wd;
  E.D3 = E.fires ? Math.max(0, E.A3 + E.cs3 + s.gw + s.pfv - 0.15 * E.A3) : E.Dgr;   // [R] ch11x: debt reset so that equity = 15% of assets
  E.cap = E.fires ? E.Dgr - E.D3 : 0;                              // [R] ch11: capital transaction = debt relief
  E.ni = E.niPre - E.woRep - E.impRep;
  const loans = rec.bkr.BL + rec.bkr.NB * (rec.ba.mt + rec.ba.sb + rec.ba.cl), loss = rec.bkr.loss;
  E.llr = s.llr - loss + (loss + Math.max(0, loans * .012 - (s.llr - loss)) * .5);    // [R] bankOp: reserve roll-forward (memo value)
  E.cfo = E.cp - E.tax + s.dr;                                     // [M] model rule: non-cash charges are added back
  return E;
}

// ---- one world ---------------------------------------------------------------------------------------------------
function check(R, E, label) {
  const { T, rec, entry, opt, kind } = R, s = rec.s, er = rec.er, K = KIND[kind], full = !opt.dropWo && !opt.noImp, q = fqo(rec.fq);
  const imp = er.imp || 0, wo = er.wo || 0, cap = er.cap || 0;
  // preconditions
  pre(!!rec && !rec.dead && s.day % 90 === R.b.off && s.day < 90, label + ': the bank\'s first close ran on day ' + s.day + ' (before the first bankQ day), bank alive');
  pre(K.def ? (T.A0 != null && T.day0 < s.day && T.day0 % 90 !== R.b.off) : T.A0 == null, label + ': ' + (K.def ? 'the borrower defaulted on day ' + T.day0 + ', before the close, on a day that is not a bank close day' : 'no borrower defaulted'));
  pre(s.woq === (K.def && !opt.dropWo ? T.queued : 0), label + ': waiting before the close ' + f4(s.woq) + ' = ' + (K.def && !opt.dropWo ? 'what the cut queued ' + f4(T.queued) : '0'));
  pre(s.A === (K.def ? T.A1 : 1000), label + ': T2 assets ' + f4(s.A) + ' = T1 ' + (K.def ? f4(T.A1) : '(no cut) 1000') + ': nothing else moved the assets between the cut and the close');
  pre(s.ds === K.ds && s.nol === 0 && !s.par && !s.dban && s.pay > 0 && E.pre > 0 && rec.sh === s.sh && s.eq > 0,
    label + ': ds ' + s.ds + ', no loss carryforward, no parent, dividends allowed, pre-tax ' + f4(E.pre) + ' > 0, no share issue, equity ' + f4(s.eq) + ' > 0');
  pre(E.fires === K.imp, label + ': this case ' + (K.imp ? 'has' : 'has no') + ' impairment by the rule (ds -> ' + E.ds1 + ', debt/equity ' + E.ratio.toFixed(1) + ', equity before test ' + f4(E.eEntry) + ')');
  pre(!E.fires || (entry && near(entry.pfv, s.pfv) && E.cs3 <= 1.5 * 0.08 * E.A0i), label + ': holdings value unchanged until the impairment and no cash sweep (cash ' + f4(E.cs3) + ' <= ' + f4(1.5 * 0.08 * E.A0i) + ')');
  // [R] the cut and the three asset points
  if (K.def) {
    ok(near(T.queued, E.ls) && near(T.A1, T.A0 - E.ls) && T.llr1 === T.llr0,
      label + ' [R] T0->T1: loan ' + f4(T.loan) + ', cut and queued ' + f4(T.queued) + ' = 30% = ' + f4(E.ls) + ', assets ' + f4(T.A0) + ' -> ' + f4(T.A1) + ', llr untouched (' + f4(T.llr0) + ')');
  }
  ok((R.impN > 0) === E.fires, label + ' [R] the impairment happens exactly when the rule says (ds streak and thresholds): ' + (R.impN > 0) + ' vs ' + E.fires);
  ok(near(rec.A, E.A3), label + ' [R] T3 assets ' + f4(rec.A) + ' = T2 ' + f4(s.A) + ' + growth ' + f4(E.gr) + ' - impairment ' + f4(E.wd));
  const cut = s.A + E.gr - rec.A;                                  // asset side: how much the close took off the assets
  ok(near(cut, E.wd) && near(imp, E.impRep), label + ' [R] the close cut ' + f4(cut) + ' from the assets (expected ' + f4(E.wd) + ' = equity before test + 0.3 x assets) and the write-off cut none: record imp ' + f4(imp) + ' (expected ' + f4(E.impRep) + ')');
  ok(near(wo, E.woRep) && rec.woq === 0, label + ' [R] write-off reported ' + f4(wo) + ' (expected ' + f4(E.woRep) + '), nothing waiting after (' + rec.woq + ')');
  // [R] the bank's own chapter 11 after an impairment
  if (E.fires) ok(near(entry.eq, -0.3 * E.A0i) && rec.bk === s.bk + 1 && rec.ds === 0 && near(cap, E.cap) && near(rec.D, E.D3),
    label + ' [R] impairment leaves equity ' + f4(entry.eq) + ' = -30% of assets ' + f4(-0.3 * E.A0i) + ' -> the bank\'s chapter 11 (' + s.bk + '->' + rec.bk + '), debt ' + f4(E.Dgr) + ' -> ' + f4(rec.D) + ', debt relief cap ' + f4(cap) + ' (expected ' + f4(E.cap) + ')');
  else ok(rec.bk === s.bk && cap === 0 && near(rec.D, E.Dgr) && rec.ds === E.ds1, label + ' [R] no chapter 11, no debt relief, debt ' + f4(rec.D) + ', ds ' + s.ds + ' -> ' + rec.ds);
  // net income, tax, dividends, cash
  ok(near(er.ni, E.ni) && near(rec.ni, E.ni), label + ' [R] net income ' + f4(er.ni) + ' = before charges ' + f4(E.niPre) + ' - write-off ' + f4(E.woRep) + ' - impairment ' + f4(E.impRep));
  ok(near(er.ni, er.op - er.it + E.iinc - er.ga - er.tax + er.eq + er.dr - imp - wo), label + ' [I] statement adds up: operating profit - interest + interest income - amortization - tax + equity-method + dividends - impairment - write-off = net income');
  ok(near(er.tax, E.tax) && near(er.dv, E.dv), label + ' [R] tax ' + f4(er.tax) + ' = ' + (s.taxRate * 100).toFixed(0) + '% of pre-tax ' + f4(E.pre) + ' and dividends ' + f4(er.dv) + ' are the same whatever was written off or impaired');
  ok(near(rec.cs, E.cs3), label + ' [I] cash ' + f4(s.cs) + ' -> ' + f4(rec.cs) + ' = + cash profit - tax - dividends = ' + f4(E.cs3) + ' (no write-off or impairment moved cash)');
  // [I] book-equity identity of the close, and of the whole window T0 -> T3
  if (full) {
    const res = (rec.BE - s.BE) - (er.ni - er.eq - er.dr - er.dv + cap + wo);
    ok(Math.abs(res) <= 1e-6 * Math.max(1, Math.abs(s.BE)), label + ' [I] book equity change of the close = net income - equity-method - dividends received - dividends paid + capital transactions + write-off already out of the assets: residual ' + f4(res));
    if (K.def) { const w = (rec.BE - T.BE0) - (er.ni - er.eq - T.dr0 - er.dv + cap); ok(Math.abs(w) <= 1e-6 * Math.max(1, Math.abs(T.BE0)), label + ' [I] window T0 -> T3: the cut is inside net income, one deduction only: residual ' + f4(w)) }
  }
  // records
  ok(rec.fq.length === 24 && q.d === s.day && Math.abs(q.ni - E.ni) <= ePart(E.ni) + 1e-9 && Math.abs(q.imp - E.impRep) <= ePart(E.impRep) + 1e-9 && Math.abs(q.wo - E.woRep) <= ePart(E.woRep) + 1e-9,
    label + ' [R] quarter record: day ' + q.d + ', ni ' + q.ni + ', imp ' + q.imp + ', wo ' + q.wo + ' (' + rec.fq.length + ' fields)');
  ok(Math.abs(rec.eh - E.ni * 1e4 / s.sh) <= 0.05 + 1e-9 && near(rec.yni - s.yni, E.ni) && near(rec.pd, 0.25 * E.ni),
    label + ' [R] EPS record ' + rec.eh + ' won (net income x 1e4 / shares = ' + (E.ni * 1e4 / s.sh).toFixed(2) + '), yearly net income +' + f4(rec.yni - s.yni) + ', 25% holder\'s equity-method income ' + f4(rec.pd) + ' = 25% of net income ' + f4(0.25 * E.ni));
  ok(near(rec.llr, E.llr) && near(rec.llr, rec.s.llr - rec.bkr.loss + rec.bkr.prov), label + ' [R] reserve llr ' + f4(s.llr) + ' -> ' + f4(rec.llr) + ' = roll-forward of the statistical loss only (expected ' + f4(E.llr) + '); write-off and impairment do not touch it');
  // cash flow statement and tabs
  const exactCfo = er.ni - er.eq + er.ga + imp + wo, bound = [q.ni, q.eq, q.ga, q.imp, q.wo].reduce((a, v) => a + ePart(v), 0);
  ok(near(exactCfo, E.cfo) && Math.abs(R.cf.cfo - E.cfo) <= bound + 1e-9, label + ' [M] model rule cfo = cash profit - tax + dividends received: ' + f4(E.cfo) + '; add-back form ' + f4(exactCfo) + '; statement shows ' + f1(R.cf.cfo) + ' (rounding allowed ' + bound.toFixed(2) + ')');
  const nc = E.impRep + E.woRep, shown = R.op.nc != null;
  ok(R.op.clean && shown === nc > 0 && (!shown || (R.op.nc.length === R.op.want.length && R.op.nc[0] === fN(q.imp + q.wo))) && R.op.want.every(w => Math.abs(w.ni + w.dep + w.adj + w.nc - w.cfo) <= 1e-9 * Math.max(1, Math.abs(w.cfo))),
    label + ' [R] 현금흐름 tab: row ' + ROW_NC + ' ' + (shown ? 'shown = imp + wo = ' + R.op.nc[0] : 'hidden') + ' (expected ' + (nc > 0 ? 'shown ' + fN(q.imp + q.wo) : 'hidden') + '), record fields ' + R.op.want.map(w => w.fields).join('/'));
  { const parts = j => [R.op.ni[j], R.op.dep[j], R.op.adj[j]].concat(shown ? [R.op.nc[j]] : []);
    const gaps = R.op.want.map((w, j) => { const ps = parts(j); return { gap: ps.reduce((a, x) => a + num(x), 0) - num(R.op.cfo[j]), tol: ps.concat([R.op.cfo[j]]).reduce((a, x) => a + shownErr(x), 0) } });
    const worst = gaps.reduce((m, g) => Math.abs(g.gap) - g.tol > Math.abs(m.gap) - m.tol ? g : m, gaps[0]);
    ok(gaps.every(g => Math.abs(g.gap) <= g.tol), label + ' [R] in every quarter the rows above add up to operating cash flow (on screen worst gap ' + f1(worst.gap) + ' vs allowed ' + worst.tol.toFixed(2) + '; newest ' + parts(0).join(' + ') + ' = ' + R.op.cfo[0] + ')') }
  { const I = R.is, ce = I.cells;
    ok(I.clean && I.has('자산 손상차손') === q.imp > 0 && I.has('대손상각비') === q.wo > 0 && (!(q.imp > 0) || ce('자산 손상차손')[1] === fN(-q.imp)) && (!(q.wo > 0) || ce('대손상각비')[1] === fN(-q.wo)) &&
      ce('순이익')[1] === fN(q.ni) && ce('EPS (원)')[1] === Math.round(q.ni * 1e4 / q.sh).toLocaleString(),
      label + ' [R] 손익 tab: 자산 손상차손 row ' + (I.has('자산 손상차손') ? ce('자산 손상차손')[1] : 'hidden') + ', 대손상각비 row ' + (I.has('대손상각비') ? ce('대손상각비')[1] : 'hidden') + ', net income ' + ce('순이익')[1] + ', EPS ' + ce('EPS (원)')[1]) }
  // [O] recorded only
  console.log('info ' + label + ' [O] FIN-CF-01, recorded only, not judged: debt change dD ' + f1(R.cf.dD) + ' | debt relief cap ' + f4(cap) + ' | financing cff ' + f1(R.cf.cff) + ' | other oth ' + f1(R.cf.oth) + ' | cash change ' + f1(R.cf.dc) + ' (previous quarter row is the synthetic start-of-game row)');
}

console.log('-- REG-01 cases A (impairment only), B (write-off only), C (both), D (neither): SYNTHETIC inputs (ds, eqi, capital set), expectations from stated rules');
const run1 = {};
try {
  for (const kind of ['A', 'B', 'C', 'D']) {
    const R = run(kind), tag = 'case ' + kind;
    run1[kind] = R;
    if (!R.rec) { pre(false, tag + ': the bank closed within 120 days'); continue }
    R.E = expectOf(R); check(R, R.E, tag);
  }

  // ---- four twins of case C on one economic path ---------------------------------------------------------------
  console.log('-- REG-01 twins of case C: same economic path, the charge left out is the only difference');
  const tw = { C: run1.C, Cwo: run('C', { noImp: true }), Cimp: run('C', { dropWo: true }), C0: run('C', { dropWo: true, noImp: true }) };
  for (const k of ['Cwo', 'Cimp', 'C0']) { const R = tw[k]; if (!R.rec) { pre(false, 'twin ' + k + ': the bank closed'); continue } R.E = expectOf(R); check(R, R.E, 'twin ' + k) }
  if (tw.C.rec && tw.Cwo.rec && tw.Cimp.rec && tw.C0.rec) {
    const rs = [tw.C, tw.Cwo, tw.Cimp, tw.C0], E = tw.C.E, v = (R, f) => f(R.rec);
    const sameAll = f => rs.every(R => near(v(R, f), v(rs[0], f), 1e-12));
    ok(sameAll(r => r.A) && sameAll(r => r.cs) && sameAll(r => r.D) && sameAll(r => r.gw) && sameAll(r => r.bk) && sameAll(r => r.ds) && sameAll(r => r.sh) && sameAll(r => r.er.cap || 0) && sameAll(r => r.er.tax) && sameAll(r => r.er.dv) && sameAll(r => r.er.op) && sameAll(r => r.llr),
      'twins [I] same economic path in all four: assets ' + f4(rs[0].rec.A) + ', cash ' + f4(rs[0].rec.cs) + ', debt ' + f4(rs[0].rec.D) + ', debt relief ' + f4(rs[0].rec.er.cap) + ', tax ' + f4(rs[0].rec.er.tax) + ', dividends ' + f4(rs[0].rec.er.dv) + ', reserve ' + f4(rs[0].rec.llr));
    const n = k => tw[k].rec.er.ni;
    ok(near(n('C0') - n('Cwo'), E.ls) && near(n('C0') - n('Cimp'), E.wd) && near(n('C0') - n('C'), E.ls + E.wd) && near(n('Cwo') - n('C'), E.wd) && near(n('Cimp') - n('C'), E.ls),
      'twins [R] net income differs by exactly the charge left out: neither ' + f4(n('C0')) + ', write-off only ' + f4(n('Cwo')) + ', impairment only ' + f4(n('Cimp')) + ', both ' + f4(n('C')) + ' (write-off ' + f4(E.ls) + ', impairment ' + f4(E.wd) + ')');
    const exact = R => R.rec.er.ni - R.rec.er.eq + R.rec.er.ga + (R.rec.er.imp || 0) + (R.rec.er.wo || 0);
    ok(rs.every(R => near(exact(R), exact(rs[0]))) && near(exact(rs[0]), E.cfo), 'twins [M] exact operating cash flow is the same in all four: ' + rs.map(exact).map(f4).join(' / ') + ' = cash profit - tax + dividends received ' + f4(E.cfo));
    const rb = R => [fqo(R.rec.fq)].map(q => [q.ni, q.eq, q.ga, q.imp, q.wo].reduce((a, x) => a + ePart(x), 0))[0];
    ok(rs.every(R => rs.every(S2 => Math.abs(R.cf.cfo - S2.cf.cfo) <= rb(R) + rb(S2) + 1e-9)), 'twins [M] operating cash flow on the tab agrees across the four within rounding: ' + rs.map(R => f1(R.cf.cfo)).join(' / '));
    // three routes to the impairment amount: the rule (equity side), the asset side, the net income side
    const viaAssets = tw.C.rec.s.A + E.gr - tw.C.rec.A, viaNi = n('C0') - n('Cimp');
    ok(near(viaAssets, E.wd) && near(viaNi, E.wd) && near(tw.C.rec.er.imp, E.wd), 'twins [R/I] impairment amount by three routes: rule ' + f4(E.wd) + ' | assets ' + f4(viaAssets) + ' | net income difference ' + f4(viaNi) + ' | record ' + f4(tw.C.rec.er.imp));
  }
} catch (e) { errs++; console.log('ERR  ' + (e && e.stack || e)) }

// ---- natural play (information); judged only where an imp or wo happens ---------------------------------------------
console.log('-- natural play, two seeds x 720 days: what happens to banks (information); a close with imp or wo is judged by the net income statement identity');
try {
  for (const SEED of [12345, 777]) {
    init(Object.assign(defCfg(), { tut: 0, seed: SEED })); mdl = null;
    const e0 = earn, st = { closes: 0, wo: 0, imp: 0, both: 0, bad: [] };
    earn = function (x) {
      if (x.kd !== 1) return e0(x);
      const cs0 = x.cs, pr = S.prime, ck = !!x.cook; e0(x);
      if (x.dead || !x.er || x.er.d !== S.day || ck) return;
      const er = x.er, imp = er.imp || 0, wo = er.wo || 0; st.closes++; if (imp) st.imp++; if (wo) st.wo++; if (imp && wo) st.both++;
      if (imp || wo) { const sum = er.op - er.it + cs0 * (pr - 2) / 400 - er.ga - er.tax + er.eq + er.dr - imp - wo; if (!near(sum, er.ni)) st.bad.push(x.tk + ' day ' + S.day + ': ' + f4(sum) + ' vs ' + f4(er.ni)) }
    };
    for (let d = 0; d < 720; d++) { step(); if (mdl) G.mk(mdl.o.length - 1) }
    earn = e0;
    ok(st.bad.length === 0, 'natural seed ' + SEED + ': ' + st.closes + ' bank closes; with write-off ' + st.wo + ', with impairment ' + st.imp + ', with both ' + st.both + ' (reaching the combined case in play is not shown on these seeds)' + (st.bad.length ? ' MISMATCH ' + st.bad.join('; ') : ''));
  }
} catch (e) { errs++; console.log('ERR  ' + (e && e.stack || e)) }
})();
console.log('errs', errs, 'fails', fails);
