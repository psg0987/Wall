// RT-BANK-001 after the fix: the bank loan write-off beyond TC-BANK-01 (tests/t_bank_writeoff.js).
// Policy (docs/MODEL.md, 부실 처리): a borrower's first chapter 11 cuts 30% of its bank loan from the bank's assets that
// day and queues the same amount in the bank's woq. The bank's first close after that reports it once in net income,
// after tax like an impairment: tax, loss carryforward and dividends do not change. The stake the bank receives is not
// offset against it (cost 0) and the loan-loss reserve llr is not touched.
//   TC-BANK-02  event order with real days: write-off on another day than the bank's close / on the bank's close day
//               with the borrower closing first / on the bank's close day with the bank closing first
//   TC-BANK-03  reported once: the next closes report nothing; two write-offs before one close are reported together, once
//   TC-BANK-04  saves: save after the write-off and load before the close (autosave and export formats); old saves
//               without the new field (one written by the game before the fix, one with the new fields removed)
//   TC-BANK-05  records: net income, er, fq, EPS history, yearly net income, a parent's equity-method income, statement
//   TC-BANK-06  policy: tax, loss carryforward, dividends, provisions unchanged; stake not offset; llr untouched;
//               the TC-BANK-01 scenario with the starting llr set explicitly
let errs = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ };
const BE = c => c.A + c.cs + c.gw - c.D + (c.fmg || 0);
const same = (a, b, t) => Math.abs(a - b) <= (t == null ? 1e-9 : t) * Math.max(1, Math.abs(a), Math.abs(b));
const f4 = x => x == null ? '-' : (+x).toFixed(4);
const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const play = (days, stop) => { for (let d = 0; d < days; d++) { step(); if (mdl) G.mk(mdl.o.length - 1); if (stop && stop()) return true } return false };
const KINDS = ['another day', 'same day, borrower closes first', 'same day, bank closes first'];

// Same start as TC-BANK-01 (seed 12345, the first bank with assets 1,000 and cash 100, a borrower owing it 200 with
// assets 150) except deposits 850 instead of 1,000 (book equity 250) and llr set to 10. With equity 100 a 60 write-off
// leaves a BIS ratio of 6.4%, and the regulator's check on day 90 (inside the 'bank closes first' window) then makes the
// bank issue shares and stops its dividend; the share issue moves equity outside the results and is not recorded as a
// capital transaction (a separate known gap, not part of this fix). With equity 250 the ratio stays near 20%, so no
// regulator action falls inside any window here. The borrower is insolvent (equity -50, below -25% of its assets), so
// its own close puts it into chapter 11.
function world(kind) {
  Math.random = mulberry(20261016);
  init(Object.assign(defCfg(), { tut: 0, seed: 12345 })); mdl = null;
  const b = S.co.find(x => x.kd === 1 && !x.dead);
  const pool = S.co.filter(x => !x.kd && !x.dead && !mine(x) && x.bk === 0 && !x.priv && x.id !== b.id);
  const sick = x => { x.ln = b.id; x.bond = 0; x.pa = 0; x.bh = 0; x.A = 150; x.cs = 0; x.gw = 0; x.D = 200; x.bk = 0 };
  const c = kind === KINDS[1] ? pool.find(x => x.id < b.id) : kind === KINDS[2] ? pool.find(x => x.id > b.id) : pool[0];
  b.A = 1000; b.cs = 100; b.D = 850; b.gw = 0; if (!b.ba) bankInit(b); b.llr = 10;
  sick(c); if (kind !== KINDS[0]) c.off = b.off;
  return { b, c, pool, sick };
}
// Watch one bank: each first chapter 11 of the given borrowers (equity and dividends received just before the cut,
// the cut, the amount queued) and each close of the bank (record, amount waiting before and after, equity right after),
// numbered in the order they ran. opt.drop removes the queued amount right after the cut (a twin with the same balance
// sheet but nothing to report); opt.parent records a holder's equity-method income around each close of the bank.
function watch(b, borrowers, opt) {
  opt = opt || {};
  const t = { wo: [], closes: [], order: [], n: 0 }, x0 = ch11x, e0 = earn;
  ch11x = function (x, why) {
    if (!borrowers.includes(x) || x.bk !== 0) return x0(x, why);
    const be = BE(b), A0 = b.A, q0 = b.woq || 0, loan = loanOf(x), dr = b.dr, llr = b.llr, closedToday = !!(b.er && b.er.d === S.day);
    x0(x, why);
    const w = { n: ++t.n, day: S.day, who: x, loan, cut: A0 - b.A, queued: (b.woq || 0) - q0, be, dr, closedToday, llr0: llr, llr1: b.llr,
      stake: x.own['c' + b.id] || 0, cost: x.bs['c' + b.id], stakeValue: hv(x, x.own['c' + b.id] || 0) };
    if (opt.drop) b.woq = q0;
    t.wo.push(w);
  };
  earn = function (x) {
    if (x === b || borrowers.includes(x)) t.order.push((x === b ? 'bank' : 'borrower ' + x.tk) + ' @' + S.day);
    if (x !== b) return e0(x);
    const waiting = b.woq || 0, cs0 = b.cs, pe0 = opt.parent ? opt.parent.eqi : 0;
    e0(x);
    if (b.er && b.er.d === S.day) t.closes.push({ n: ++t.n, day: S.day, er: Object.assign({}, b.er), waiting, left: b.woq || 0, be: BE(b), cs0,
      iinc: cs0 * (S.prime - 2) / 400, fq: b.fq[b.fq.length - 1].slice(), eh: b.eh[b.eh.length - 1], sh: b.sh, ni: b.ni, yni: b.yni, nol: b.nol,
      cs: b.cs, D: b.D, A: b.A, llr: b.llr, bkr: Object.assign({}, b.bkr), parentEqi: opt.parent ? opt.parent.eqi - pe0 : null });
  };
  t.stop = () => { ch11x = x0; earn = e0 };
  t.after = w => t.closes.find(cl => cl.n > w.n);                       // the bank's first close after a write-off
  return t;
}
// Equity moved from just before the (first) write-off to just after the close that reports it, against that close's
// results. Dividends received before the window were cash before it, so they come out as in the per-close identity;
// dividends received inside the window are cash inside it and stay in.
const windowRes = (w, cl) => (cl.be - w.be) - (cl.er.ni - cl.er.eq - w.dr - cl.er.dv + (cl.er.cap || 0));
const tol = w => 1e-6 * Math.max(1, Math.abs(w.be));
// the bank's first close day after a write-off made on day d (same day only if the bank had not closed yet that day)
const firstCloseDay = (b, w) => { if (w.day % 90 === b.off && !w.closedToday) return w.day; let d = w.day + 1; while (d % 90 !== b.off) d++; return d };

(async () => {
  // ---------------------------------------------------------------------------------------------------------------
  console.log('-- TC-BANK-02 event order (real days) and TC-BANK-03 reported once');
  for (const kind of KINDS) {
    const { b, c } = world(kind), t = watch(b, [c]);
    play(400, () => t.wo.length && t.closes.filter(cl => cl.n > t.wo[0].n).length >= 3);
    t.stop();
    const w = t.wo[0];
    ok(!!w, kind + ': the borrower went into its first chapter 11 at its own close (' + c.tk + ', bank ' + b.tk + ' closes on day % 90 = ' + b.off + ')');
    if (!w) continue;
    const first = t.after(w), later = t.closes.filter(cl => cl.n > w.n && cl !== first), before = t.closes.filter(cl => cl.n < w.n);
    console.log('     write-off day ' + w.day + ' (' + t.order.filter(o => o.endsWith('@' + w.day)).join(' > ') + '), loan ' + f4(w.loan) + ', cut ' + f4(w.cut) +
      ' | bank closes after it: ' + t.closes.filter(cl => cl.n > w.n).map(cl => 'day ' + cl.day + ' reported ' + f4(cl.er.wo || 0)).join(', '));
    if (kind === KINDS[0]) ok(w.day % 90 !== b.off, kind + ': write-off day ' + w.day + ' is not a bank close day');
    if (kind === KINDS[1]) ok(w.day % 90 === b.off && !w.closedToday && t.order.indexOf('borrower ' + c.tk + ' @' + w.day) < t.order.indexOf('bank @' + w.day), kind + ': on day ' + w.day + ' the borrower closed (and defaulted) before the bank closed');
    if (kind === KINDS[2]) ok(w.day % 90 === b.off && w.closedToday && t.order.indexOf('bank @' + w.day) < t.order.indexOf('borrower ' + c.tk + ' @' + w.day), kind + ': on day ' + w.day + ' the bank closed before the borrower closed (and defaulted)');
    ok(same(w.cut, 0.3 * w.loan) && same(w.queued, w.cut), kind + ': assets cut by 30% of the loan ' + f4(w.loan) + ' = ' + f4(w.cut) + ', same amount queued ' + f4(w.queued));
    ok(!!first && first.day === firstCloseDay(b, w), kind + ': reported by the bank close on day ' + (first && first.day) + ' (first close after the write-off: day ' + firstCloseDay(b, w) + ')');
    if (!first) continue;
    ok(same(first.waiting, w.queued) && same(first.er.wo || 0, w.queued) && first.left === 0, kind + ': that close reports ' + f4(first.er.wo) + ', what was waiting (' + f4(first.waiting) + '), and leaves nothing waiting (' + first.left + ')');
    ok(before.every(cl => !cl.er.wo), kind + ': no close before the write-off reports anything (' + before.map(cl => 'day ' + cl.day).join(', ') + ')');
    const res = windowRes(w, first);
    ok(Math.abs(res) <= tol(w), kind + ': equity from just before the write-off to just after that close is explained by its results (unexplained ' + f4(res) + ')');
    // TC-BANK-03: the same write-off is not reported again
    ok(later.length >= 2 && later.every(cl => !cl.er.wo && cl.waiting === 0 && cl.left === 0 && !cl.fq[23]),
      'TC-BANK-03 ' + kind + ': the next ' + later.length + ' closes report nothing (' + later.map(cl => 'day ' + cl.day + ' er.wo ' + (cl.er.wo || 0) + ', fq ' + cl.fq[23]).join('; ') + ')');
    const total = t.closes.reduce((a, cl) => a + (cl.er.wo || 0), 0);
    ok(same(total, w.queued), 'TC-BANK-03 ' + kind + ': reported in all closes together ' + f4(total) + ' = booked ' + f4(w.queued));
  }
  {
    // two borrowers of the same bank default before one close (days 25 and 40; the bank closes on day 60)
    const { b, c, pool, sick } = world(KINDS[0]), c2 = pool.find(x => x !== c && x.off !== b.off && !Object.keys(x.pos).length);
    sick(c2); c2.off = 40;
    const t = watch(b, [c, c2]);
    play(300, () => t.wo.length >= 2 && t.closes.filter(cl => cl.n > t.wo[1].n).length >= 2);
    t.stop();
    const [w1, w2] = t.wo, first = w2 && t.after(w2);
    ok(!!(w1 && w2) && t.after(w1) === first, 'TC-BANK-03 two write-offs (' + (w1 ? 'day ' + w1.day + ' ' + f4(w1.cut) : '-') + ', ' + (w2 ? 'day ' + w2.day + ' ' + f4(w2.cut) : '-') + ') before one bank close (day ' + (first && first.day) + ')');
    if (w1 && w2 && first) {
      ok(same(first.er.wo || 0, w1.queued + w2.queued) && first.left === 0, 'TC-BANK-03 that close reports both together once: ' + f4(first.er.wo) + ' = ' + f4(w1.queued + w2.queued));
      ok(t.closes.filter(cl => cl.n > first.n).every(cl => !cl.er.wo), 'TC-BANK-03 the closes after it report nothing (' + t.closes.filter(cl => cl.n > first.n).map(cl => 'day ' + cl.day).join(', ') + ')');
      const res = windowRes(w1, first);
      ok(Math.abs(res) <= tol(w1), 'TC-BANK-03 equity from before the first write-off to that close is explained by its results (unexplained ' + f4(res) + ')');
    }
  }

  // ---------------------------------------------------------------------------------------------------------------
  console.log('-- TC-BANK-04 saves');
  // reference run without saving
  let ref;
  { const { b, c } = world(KINDS[0]), t = watch(b, [c]); play(200, () => t.wo.length && t.after(t.wo[0])); t.stop(); ref = { w: t.wo[0], cl: t.wo[0] && t.after(t.wo[0]) } }
  for (const [fmt, strip] of [['autosave (full)', 0], ['export (packS(1), histories left out)', 1]]) {
    const { b, c } = world(KINDS[0]); let t = watch(b, [c]);
    play(200, () => t.wo.length && S.day > t.wo[0].day);                  // the day after the write-off, before the close
    t.stop();
    const w = t.wo[0], day = S.day, txt = await packS(strip);
    const s = await loadStr(txt); S = s; v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null;   // what importing a save does
    const b2 = S.co[b.id], c2 = S.co[c.id];
    ok(b2 !== b && same(b2.woq, w.queued, 0), 'TC-BANK-04 ' + fmt + ': saved on day ' + day + ' with ' + f4(w.queued) + ' waiting, loaded: woq ' + f4(b2.woq));
    t = watch(b2, [c2]); play(200, () => t.closes.length > 0); t.stop();
    const cl = t.closes[0];
    ok(!!cl && same(cl.er.wo || 0, w.queued) && cl.left === 0, 'TC-BANK-04 ' + fmt + ': the close after loading (day ' + (cl && cl.day) + ') reports ' + f4(cl && cl.er.wo) + ' once, nothing left waiting');
    if (cl) {
      const res = windowRes(w, cl);
      ok(Math.abs(res) <= tol(w), 'TC-BANK-04 ' + fmt + ': equity from before the write-off (before saving) to that close is explained by its results (unexplained ' + f4(res) + ')');
      if (!strip) ok(ref.cl && cl.day === ref.cl.day && cl.er.ni === ref.cl.er.ni && cl.er.wo === ref.cl.er.wo && cl.be === ref.cl.be && cl.er.tax === ref.cl.er.tax && cl.er.dv === ref.cl.er.dv,
        'TC-BANK-04 ' + fmt + ': same close as the run without saving (NI ' + f4(cl.er.ni) + ' vs ' + f4(ref.cl && ref.cl.er.ni) + ', equity ' + f4(cl.be) + ' vs ' + f4(ref.cl && ref.cl.be) + ')');
    }
  }
  {
    // an old save, written by the game before the fix (commit 1ecdc53; tests/fixtures/README.md): no woq anywhere
    const fs = require('fs'), path = require('path'), txt = fs.readFileSync(path.join(process.env.TESTS_DIR, 'fixtures', 'old_save_1ecdc53_seed12345_day440.wsr'), 'utf8').trim();
    init(Object.assign(defCfg(), { tut: 0, seed: 1 })); mdl = null;
    const raw = await unpackS(txt);
    ok(raw.co.every(x => !('woq' in x)) && raw.day === 440, 'TC-BANK-04 old save: day ' + raw.day + ', ' + raw.co.length + ' companies, none has a woq field');
    S = migrate(raw); v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null;
    ok(S.co.every(x => x.woq === 0), 'TC-BANK-04 old save: after loading every company has woq = 0');
    const boax = S.co.find(x => x.tk === 'BOAX');
    // play on to day 500 and check every close like tests/t_clean_surplus.js, plus nothing reported or left waiting
    const e0 = earn; let n = 0, bad = [], boaxClose = null;
    earn = function (x) {
      const be = BE(x), ck = !!x.cook, w0 = x.woq || 0; e0(x);
      if (!x.er || x.er.d !== S.day) return;
      if (x.er.wo || w0 || x.woq) bad.push(x.tk + ' day ' + S.day + ' write-off reported ' + (x.er.wo || 0) + ', waiting ' + w0 + ' -> ' + x.woq);
      if (x === boax) boaxClose = { day: S.day, wo: x.er.wo || 0, row: x.fq[x.fq.length - 1].length };
      if (x.dead || ck) return; n++;
      const er = x.er, res = (BE(x) - be) - (er.ni - er.eq - er.dr - er.dv + (er.cap || 0) + (er.wo || 0));
      if (Math.abs(res) > 1e-6 * Math.max(1, Math.abs(be))) bad.push(x.tk + ' day ' + S.day + ' residual ' + res.toFixed(3));
    };
    let thrown = null;
    try { play(60) } catch (e) { thrown = e }
    earn = e0;
    ok(!thrown, 'TC-BANK-04 old save: played days 441-' + S.day + ' without errors' + (thrown ? ' (' + thrown.message + ')' : ''));
    ok(n > 100 && bad.length === 0, 'TC-BANK-04 old save: ' + n + ' closes balance and none reports or keeps a write-off' + (bad.length ? ': ' + bad.slice(0, 3).join('; ') : ''));
    ok(!!boaxClose && boaxClose.day === 494 && boaxClose.wo === 0 && boaxClose.row === 24,
      'TC-BANK-04 old save: BOAX (wrote off 286.97 on day 431, before the save, in the old version) closes on day ' + (boaxClose && boaxClose.day) + ' reporting ' + (boaxClose && boaxClose.wo) + ' (no catch-up for write-offs made before the fix), new record row has ' + (boaxClose && boaxClose.row) + ' fields');
    sel = -1; pg = ''; tab = 'h'; S.spd = 0; G.pick(boax.id); G.stab('f'); G.fseg(1); render();
    const h = document.getElementById('sh').innerHTML;
    ok(h.includes('순이익') && !h.includes('대손상각비') && !/NaN|undefined|Infinity|\[object/.test(h), 'TC-BANK-04 old save: BOAX income statement renders clean (old 22-field and new 24-field quarter rows mixed), no write-off row');
  }
  {
    // a new save with the new fields removed (what any save written before the fix looks like for them)
    const { b, c } = world(KINDS[0]), t = watch(b, [c]);
    play(200, () => t.wo.length && S.day > t.wo[0].day); t.stop();
    const raw = JSON.parse(JSON.stringify(S));
    for (const x of raw.co) { delete x.woq; if (x.er) delete x.er.wo; if (x.fq) x.fq = x.fq.map(r => r.slice(0, 23)) }
    S = migrate(raw); v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null;
    ok(S.co.every(x => x.woq === 0), 'TC-BANK-04 new save with the new fields removed: after loading every company has woq = 0');
    const b2 = S.co[b.id], t2 = watch(b2, []); let thrown = null;
    try { play(200, () => t2.closes.length >= 2) } catch (e) { thrown = e }
    t2.stop();
    ok(!thrown && t2.closes.length >= 2 && t2.closes.every(cl => !cl.er.wo && cl.left === 0 && cl.fq.length === 24 && cl.fq[23] === 0),
      'TC-BANK-04 new save with the new fields removed: the bank closes ' + t2.closes.map(cl => 'day ' + cl.day).join(', ') + ' with nothing reported' + (thrown ? ' (error ' + thrown.message + ')' : ''));
  }

  // ---------------------------------------------------------------------------------------------------------------
  console.log('-- TC-BANK-05 records and TC-BANK-06 policy (twin runs: same world, the twin drops the queued amount)');
  const twin = drop => {
    const { b, c, pool } = world(KINDS[0]), parent = pool.find(x => x !== c && !b.own['c' + x.id]);
    setOwn(b, 'c' + parent.id, 25); ctlAll();                              // a company holding 25% of the bank (equity method)
    const t = watch(b, [c], { drop, parent }); play(200, () => t.wo.length && t.after(t.wo[0])); t.stop();
    return { b, c, w: t.wo[0], cl: t.wo[0] && t.after(t.wo[0]) };
  };
  const A = twin(false), B = twin(true);
  ok(!!(A.cl && B.cl) && A.cl.day === B.cl.day, 'twins reached the same bank close (day ' + (A.cl && A.cl.day) + ')');
  if (A.cl && B.cl) {
    const wo = A.w.queued, a = A.cl, z = B.cl, last = fqo(a.fq);
    console.log('     write-off ' + f4(wo) + ' | NI ' + f4(a.er.ni) + ' vs twin ' + f4(z.er.ni) + ' | tax ' + f4(a.er.tax) + '/' + f4(z.er.tax) + ' | dividends ' + f4(a.er.dv) + '/' + f4(z.er.dv) + ' | EPS ' + a.eh + '/' + z.eh);
    ok(same(a.er.wo, wo) && !z.er.wo, 'TC-BANK-05 er.wo = ' + f4(a.er.wo) + ' (twin: none)');
    ok(same(a.er.ni, z.er.ni - wo) && a.er.ni === a.ni, 'TC-BANK-05 net income = twin - write-off: ' + f4(a.er.ni) + ' = ' + f4(z.er.ni) + ' - ' + f4(wo) + ', and er.ni is the bank\'s ni');
    ok(same(a.er.ni, a.er.op - a.er.it + a.iinc - a.er.ga - a.er.tax + a.er.eq + a.er.dr - (a.er.imp || 0) - (a.er.wo || 0)),
      'TC-BANK-05 statement adds up: operating profit - interest + interest income - amortization - tax + equity-method + dividends - impairment - write-off = net income');
    ok(last.d === a.day && last.ni === r1(a.er.ni) && last.wo === r1(wo) && last.imp === 0 && a.fq.length === 24, 'TC-BANK-05 fq row of that close: day ' + last.d + ', ni ' + last.ni + ', wo ' + last.wo + ', imp ' + last.imp + ' (' + a.fq.length + ' fields)');
    ok(a.eh === Math.round(a.er.ni * 1e5 / a.sh) / 10 && Math.abs(a.eh * a.sh / 1e4 - a.er.ni) <= 0.05 * a.sh / 1e4 + 1e-9 && a.eh < z.eh, 'TC-BANK-05 EPS history ' + a.eh + ' won matches net income (twin ' + z.eh + ')');
    ok(same(a.yni, z.yni - wo, 1e-9), 'TC-BANK-05 yearly net income lower by the write-off: ' + f4(a.yni) + ' vs ' + f4(z.yni));
    ok(same(a.parentEqi, 0.25 * a.er.ni) && same(a.parentEqi - z.parentEqi, -0.25 * wo), 'TC-BANK-05 25% holder\'s equity-method income from this close ' + f4(a.parentEqi) + ' = 25% of net income (twin ' + f4(z.parentEqi) + ')');
    sel = -1; pg = ''; tab = 'h'; S.spd = 0; G.pick(B.b.id); G.stab('f'); G.fseg(1); render();
    const hz = document.getElementById('sh').innerHTML;
    // the last world played is the twin B; rebuild A to look at its statement
    const A2 = twin(false); sel = -1; pg = ''; tab = 'h'; S.spd = 0; G.pick(A2.b.id); G.stab('f'); G.fseg(1); render();
    const h = document.getElementById('sh').innerHTML, cells = lab => [...((h.split('<td>' + lab + '</td>')[1] || '').split('</tr>')[0]).matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m => m[1]);
    const lastA2 = fqo(A2.b.fq[A2.b.fq.length - 1]);
    ok(!hz.includes('대손상각비') && h.includes('대손상각비') && cells('대손상각비')[1] === fN(-lastA2.wo), 'TC-BANK-05 income statement shows a 대손상각비 row only with a write-off: ' + cells('대손상각비').slice(0, 3).join(' | '));
    ok(cells('EPS (원)')[1] === Math.round(lastA2.ni * 1e4 / lastA2.sh).toLocaleString() && cells('순이익')[1] === fN(lastA2.ni) && !/NaN|undefined|Infinity|\[object/.test(h),
      'TC-BANK-05 statement EPS ' + cells('EPS (원)')[1] + ' and net income ' + cells('순이익')[1] + ' match the quarter record');
    // TC-BANK-06 policy
    ok(a.er.tax === z.er.tax && a.nol === z.nol && a.er.dv === z.er.dv && a.er.op === z.er.op, 'TC-BANK-06 tax ' + f4(a.er.tax) + ', loss carryforward ' + f4(a.nol) + ', dividends ' + f4(a.er.dv) + ', operating profit ' + f4(a.er.op) + ' same as the twin');
    ok(a.cs === z.cs && a.D === z.D && a.A === z.A && a.be === z.be, 'TC-BANK-06 balance sheet after the close same as the twin (the loss already left the assets on the write-off day)');
    ok(a.bkr.loss === z.bkr.loss && a.bkr.prov === z.bkr.prov && a.llr === z.llr, 'TC-BANK-06 statistical loss ' + f4(a.bkr.loss) + ' and provision ' + f4(a.bkr.prov) + ' unchanged, both still charged (overlap kept, docs/MODEL.md)');
    ok(A.w.llr0 === A.w.llr1 && a.llr === z.llr, 'TC-BANK-06 llr untouched by the write-off (' + f4(A.w.llr0) + ' before and after) and by reporting it');
    ok(A.w.stake === 80 && A.w.cost === 0 && same(A.w.queued, 0.3 * A.w.loan), 'TC-BANK-06 stake received ' + A.w.stake + '% at cost ' + A.w.cost + ' (worth ' + f4(A.w.stakeValue) + '), not offset: write-off stays 30% of the loan = ' + f4(A.w.queued));
  }
  {
    // the TC-BANK-01 scenario (tests/t_bank_writeoff.js) with the starting llr set explicitly
    const scen = llr => {
      Math.random = mulberry(20261016);
      init(Object.assign(defCfg(), { tut: 0, seed: 12345 })); mdl = null;
      const b = S.co.find(x => x.kd === 1 && !x.dead), c = S.co.find(x => !x.kd && !x.dead && !mine(x) && x.bk === 0 && x.id !== b.id);
      b.A = 1000; b.cs = 100; b.D = 1000; b.gw = 0; if (!b.ba) bankInit(b); if (llr != null) b.llr = llr;
      c.ln = b.id; c.bond = 0; c.pa = 0; c.bh = 0; c.A = 150; c.cs = 0; c.gw = 0; c.D = 200; c.bk = 0;
      return { b, c };
    };
    for (const llr of [null, 0, 10]) {
      let { b, c } = scen(llr); const be0 = BE(b), l0 = b.llr;
      ch11(c, 'TC-BANK-06'); const wo = 1000 - b.A; earn(b);
      const er = b.er, res = (BE(b) - be0) - (er.ni - er.eq - er.dr - er.dv + (er.cap || 0)), ni = er.ni, wo1 = er.wo;
      ({ b, c } = scen(llr)); ch11(c, 'TC-BANK-06'); b.woq = 0; earn(b);
      ok(same(wo, 60) && same(wo1, 60) && Math.abs(res) <= 1e-6 * Math.max(1, Math.abs(be0)) && same(ni, b.er.ni - 60),
        'TC-BANK-06 TC-BANK-01 with starting llr ' + f4(l0) + (llr == null ? ' (inherited, as in TC-BANK-01)' : '') + ': write-off ' + f4(wo) + ', reported ' + f4(wo1) + ', unexplained ' + f4(res) + ', NI ' + f4(ni) + ' = ' + f4(b.er.ni) + ' - 60');
    }
  }
})().catch(e => { errs++; console.log('ERR ' + (e && e.stack || e)) }).finally(() => console.log('errs', errs, 'fails', fails));
