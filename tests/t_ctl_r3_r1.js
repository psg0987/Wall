// RT-PREMERGE-FIX-01-R3-R1 (Claude), written BEFORE the fix. Pending control (ctl "?") must not act on its own or let a confirmed dialog move money
// after authority changed; a save must not carry "?" in ctl (old builds would keep it forever); ownership-independent finance stays.
// U  autonomous AI decisions of a pending company: hqQ growth drift, aiEvent candidate, event acquirer (offer.mk), loan-sale buyer bank,
//    activist-demanded buyback (persTick 'ag'), new option counterparty (optCp)
// C  confirm callbacks re-check authority and contract state right before money moves: G.etfMgr, G.lsell, G.lbuy, G.sqz
// K  kept: ePay itself has no blanket mine() guard; a pending company still closes its books (earn) and pays dividends to shareholders
// S  save form: JSON of S has no ctl "?"; pending ids travel in S.ctlp; loading restores "?" at once (no waiting for a next day)
let errs = 0, fails = 0; const ok = (x, m) => { console.log((x ? 'ok ' : 'FAIL ') + m); if (!x) fails++ }; const pre = (x, m) => { if (!x) { errs++; console.log('ERR precondition ' + m) } };
const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const world = seed => { Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; S.spd = 0; sel = -1; pg = ''; S.apAll = 0 };
const iso = c => { for (const k of Object.keys(c.own)) setOwn(c, k, 0); for (const t of Object.keys(c.pos)) setOwn(S.co[+t], 'c' + c.id, 0) };
// two companies holding 60% of each other and nothing else: two symmetric supported solutions -> both AMBIG ("?")
const pend = (x, y) => { iso(x); iso(y); setOwn(y, 'c' + x.id, 60); setOwn(x, 'c' + y.id, 60); x.ctl = y.ctl = null; ctlAll(); return x.ctl === '?' && y.ctl === '?' };
const ords = () => S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i !== HOLD && c.bk === 0 && c.ctl !== 'P');
const closeMdl = () => { mdl = null; mcb = null };

// ---------- U1 hqQ growth drift
{ world(101); const [x, y] = [ords()[10], ords()[200]]; pre(pend(x, y), 'U1 pending pair'); x.ap = 0; x.g = .1; x.hq = .9; hqQ(); ok(x.g === .1, 'U1 hqQ does not change the growth rate of a pending company (g ' + x.g + ')') }
// ---------- U2 aiEvent never picks a pending company
{ world(102); const [x, y] = [ords()[11], ords()[201]]; pre(pend(x, y), 'U2 pending pair'); let hit = 0; const saved = EV2.map(e => e.el);
  EV2.forEach((e, i) => { const el = saved[i]; e.el = c => { if (c.ctl === '?') hit++; return el(c) } }); for (let k = 0; k < 4000; k++) { const g0 = [x.g, x.cs, y.g, y.cs]; aiEvent(); mdl = null; S.ev2 = null }
  EV2.forEach((e, i) => e.el = saved[i]); ok(hit === 0, 'U2 4000 aiEvent calls: pending companies considered ' + hit + ' times') }
// ---------- U3 event acquirer (offer.mk) is never a pending company
{ world(103); const L = ords(), t = L.find(c => L.some(z => z !== c && z.i === c.i && mc(z) > mc(c) * 1.5)), x = t && L.find(z => z !== t && z.i === t.i && mc(z) > mc(t) * 1.5), y = L.find(z => z !== t && z !== x && z.i !== (t && t.i)); pre(!!x && pend(x, y), 'U3 pending acquirer candidate');
  x.cs = 1e7; const off = EV2.find(e => e.id === 'offer'); const r = off.mk(t); ok(r.a !== x.id, 'U3 offer.mk(target) does not choose the pending company as acquirer (chose ' + r.a + ', pending ' + x.id + ')') }
// ---------- U4 loan-sale buyer bank is never a pending bank
{ world(104); const B0 = S.co.find(c => !c.dead && c.kd === 1 && !c.priv), PB = S.co.find(c => !c.dead && c.kd === 1 && !c.priv && c !== B0), q = ords()[400], x = ords().find(c => c !== q);
  setOwn(B0, 'P', 60); ctlAll(); pre(mine(B0) && pend(PB, q), 'U4 my bank and a pending bank'); x.ln = B0.id; x.D = Math.max(x.D, 100); PB.A *= 100; PB.cs = 1e7; S.co.find(c => !c.dead && c.kd === 1 && c !== B0 && c !== PB && !c.priv).cs = 1e6; ctlAll();   // a normal buyer bank exists too (smaller assets than the pending one) pre(PB.ctl === '?', 'U4 still pending');
  G.lsell(B0.id, x.id); const f = mcb; pre(typeof f === 'function', 'U4 dialog opened'); if (f) f(); closeMdl(); ok(x.ln !== PB.id, 'U4 loan sale: the buyer is not the pending bank (loan now at ' + x.ln + ', pending ' + PB.id + ')') }
// ---------- U5 activist-demanded buyback by a pending company
{ world(105); const [x, y] = [ords()[12], ords()[202]]; pre(pend(x, y), 'U5 pending pair'); const r = S.R[0], id = 0; r.s = 'ag'; rvPrep(r); r.gn.agg = 1;
  const run = (c, keep) => { setOwn(c, 'r0', 8); c.pill = -1;   // persTick skips the round when no company has a past poison-pill date
    let done = 0; for (let k = 0; k < 30; k++) { r.pos = { [c.id]: { px: c.p * 10, dm: 0 } }; c.cs = mc(c); if (keep) c.ctl = keep; const sh = c.sh; persTick(r, id, 100); if (c.sh < sh) done++ } return done };
  const z = ords().find(c => c !== x && c !== y && !c.ctl); pre(run(z, null) > 0, 'U5 control company without a controller does the demanded buyback (fixture reaches the code)');
  const done = run(x, '?'); ok(done === 0, 'U5 30 activist demands: buybacks carried out by the pending company ' + done) }
// ---------- U6 option counterparty
{ world(106); const fin = S.co.filter(c => !c.dead && !c.priv && (c.kd === 2 || c.i === 3)), [x, y] = [fin[0], ords()[203]]; pre(pend(x, y), 'U6 pending insurer/securities'); x.cs = 1e6;
  const seen = []; for (let k = 0; k < 3000; k++) { S.eco.length = 0; optCp(ords()[5], 'C', 1, 100, 1); if (S.eco[0]) seen.push(S.eco[0]) } pre(seen.length > 100, 'U6 optCp produced counterparties');
  ok(!seen.some(m => m.includes(x.tk + '가 ')), 'U6 3000 option trades: the pending company is never the counterparty') }

// ---------- C1 G.etfMgr: control of the buying securities company lost while the dialog is open
{ world(111); const t = S.co.find(c => !c.dead && !c.priv && c.i === 3), e = S.etf && S.etf.find(z => z.mgr !== (t && t.id)); pre(!!t && !!e, 'C1 securities company and ETF');
  setOwn(t, 'P', 60); ctlAll(); S.te = t.id; t.cs = 1e7; const cs = t.cs; G.etfMgr(e.k); const f = mcb; pre(typeof f === 'function' && !!mdl, 'C1 dialog opened'); setOwn(t, 'P', 0); ctlAll(); if (f) f(); closeMdl();
  ok(e.mgr !== t.id && t.cs === cs, 'C1 etfMgr confirmed after control was lost: no purchase (mgr ' + e.mgr + ', cash change ' + (t.cs - cs) + ')') }
// ---------- C2 G.lsell: seller bank lost control before confirm
{ world(112); const B0 = S.co.find(c => !c.dead && c.kd === 1 && !c.priv), x = ords()[20]; setOwn(B0, 'P', 60); ctlAll(); pre(mine(B0), 'C2 my bank'); x.ln = B0.id; x.D = Math.max(x.D, 100); S.co.find(c => !c.dead && c.kd === 1 && c !== B0).cs = 1e6;   // a buyer bank with cash
  const cs = B0.cs; G.lsell(B0.id, x.id); const f = mcb; pre(typeof f === 'function' && !!mdl, 'C2 dialog opened'); setOwn(B0, 'P', 0); ctlAll(); if (f) f(); closeMdl(); ok(x.ln === B0.id && B0.cs === cs, 'C2 lsell confirmed after the seller bank left my control: no sale') }
{ world(113); const B0 = S.co.find(c => !c.dead && c.kd === 1 && !c.priv), x = ords()[21]; setOwn(B0, 'P', 60); ctlAll(); x.ln = B0.id; x.D = Math.max(x.D, 100);
  G.lsell(B0.id, x.id); const f = mcb; pre(typeof f === 'function' && !!mdl, 'C2b dialog opened'); x.ln = S.co.find(c => !c.dead && c.kd === 1 && c !== B0).id; const ln = x.ln; if (f) f(); closeMdl(); ok(x.ln === ln, 'C2b lsell confirmed after the loan moved to another bank: no sale') }
// ---------- C3 G.lbuy: buyer bank becomes pending before confirm
{ world(114); const banksL = S.co.filter(c => !c.dead && c.kd === 1 && !c.priv), B0 = banksL[0], L0 = banksL[1], x = ords()[22], q = ords()[401]; setOwn(B0, 'P', 60); ctlAll(); x.ln = L0.id; x.D = Math.max(x.D, 100); B0.cs = 1e7;
  const cs = B0.cs; G.lbuy(B0.id, x.id); const f = mcb; pre(typeof f === 'function' && !!mdl, 'C3 dialog opened'); pre(pend(B0, q), 'C3 my bank turned pending'); if (f) f(); closeMdl(); ok(x.ln === L0.id && B0.cs === cs, 'C3 lbuy confirmed by a bank that is now pending: no purchase (loan at ' + x.ln + ')') }
// ---------- C4 G.sqz: my group drops below 90% before confirm
{ world(115); const c = ords()[30]; iso(c); setOwn(c, 'P', 92); ctlAll(); S.te = 'P'; S.cash = 1e7; const cash = S.cash; G.sqz(c.id); const f = mcb; pre(typeof f === 'function' && !!mdl, 'C4 dialog opened'); setOwn(c, 'P', 50); ctlAll(); if (f) f(); closeMdl();
  ok(!c.priv && S.cash === cash, 'C4 squeeze-out confirmed after my stake fell to 50%: no purchase (priv ' + c.priv + ')') }

// ---------- K ownership-independent finance kept
{ world(121); const [x, y] = [ords()[13], ords()[204]]; pre(pend(x, y), 'K pending pair'); const cs = x.cs; ok(ePay(x.id, 1) === 1 && Math.abs(x.cs - (cs - 1)) < 1e-9, 'K1 ePay has no blanket authority guard (callers check)');
  setOwn(x, 'P', 10); x.ctl = '?'; ctlAll(); pre(x.ctl === '?', 'K2 still pending with P 10%'); const d0 = x.er ? x.er.d : -1; let paid = 0; const c0 = S.cash;
  for (let d = 0; d < 100 && (x.er ? x.er.d : -1) === d0; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null }
  ok((x.er ? x.er.d : -1) !== d0, 'K2 a pending company still closes its quarter (earn ran on day ' + (x.er && x.er.d) + ', dividend ' + (x.er && x.er.dv) + ')') }

// ---------- S save form
{ world(131); const [x, y] = [ords()[14], ords()[205]]; pre(pend(x, y), 'S pending pair'); const js = JSON.stringify(S), o = JSON.parse(js);
  ok(!o.co.some(c => c.ctl === '?') && Array.isArray(o.ctlp) && o.ctlp.includes(x.id) && o.ctlp.includes(y.id), 'S1 save JSON: no ctl "?"; pending ids in ctlp ' + JSON.stringify(o.ctlp));
  ok(x.ctl === '?' && y.ctl === '?', 'S2 the live game still shows them pending after saving');
  const q0 = [CTLQ[x.id].st, CTLQ[y.id].st]; S = migrate(o); v8fix(); const X = S.co[x.id], Y = S.co[y.id];
  ok(X.ctl === '?' && Y.ctl === '?' && CTLQ[x.id].st === q0[0] && CTLQ[y.id].st === q0[1] && !mine(X), 'S3 loading restores pending at once (' + CTLQ[x.id].st + '/' + CTLQ[y.id].st + '), no waiting for a next day') }
console.log('errs', errs, 'fails', fails);
