// FIN-CF-03A (approved 2026-10-24, design docs/FIN-CF-03A-DESIGN-R2.md at commit 1f07f49 on branch fin-cf-03a-design-r2): the 현금흐름 tab
// must not show debt that came over without cash as borrowing, and must show the cash of an acquisition on its own rows.
//
// THE DEFECT (main d553d3e): fqDerive takes 차입 증감 = dD + R (R: FIN-CF-01 relief) with dD = the change of the recorded debt. Debt that
// grows without any cash is shown as borrowing and the plug '기타·투자 매매' takes it back with the opposite sign: the target's debt taken
// over in absorb() (sim.js, all four acquisition paths), the LBO debt G.tender puts on the target, the hidden debt hqQ finds. The cash of the
// acquisition (cash paid, the target's cash coming in) disappears in 기타·투자 매매. (Banks' / insurers' quarterly growth gr is FIN-CF-03B: since
// 2026-10-25 it is taken out of 차입 증감 too (ncG), and the checks below expect that; tests/t_fincf03b_gr.js tests it.)
//
// THE DESIGN THESE TESTS PIN (field names are part of the design):
//  - acqAdd(c, key, x) adds an unrounded amount to c.acq (the quarter that has not closed); keys aD / aP / aC = debt taken over / cash paid /
//    cash brought in by an EXTERNAL acquisition, iD / iP / iC = the same when the acquirer already held MORE THAN 50% of the target directly
//    just before the deal (internal absorption: G.liq, or G.merge / maTick of an own listed subsidiary), lD = LBO debt (on the target),
//    hD = hidden debt found.
//  - earn(): right before qPush, c.acr[Math.round(S.day)] += c.acq (all 8 keys), c.acq = null. qPush drops keys older than the oldest kept
//    row and deletes acr when empty. kill(): acq = null, acr deleted. qBack() (a save without quarter rows is restored): acr deleted,
//    acq = null, and on a restore (S.day > 0) c.acd = S.day. addCo(): c.acd = S.day - 721 (a new company: every row it will have is covered,
//    also the rebuilt rows of a new game, which reach S.day - 720). v8prep(): c.acd = S.day when missing (a save made before FIN-CF-03A).
//  - fqDerive(): row state 'old' (q.d <= acd: no record used), 'part' (prev.d <= acd < q.d: the record is used, the tab marks it ◐),
//    'full' (prev.d > acd). ncA = aD + iD + lD + hD comes out of 차입 증감 / 재무활동; 인수 순현금 = aC - aP, 자회사 흡수·투자회수(순현금)
//    = iC - iP; 기타 = dc - cfo + capex - cff - 인수 순현금 - 자회사 흡수. A negative 차입 증감 stays negative.
//
// WHERE THE EXPECTED VALUES COME FROM (nothing is read back from the ledger to build an expected value):
//  - each deal: snapshots of the acquirer's and the target's cash / debt / stakes right around the call of the real game function
//    (cash paid = cash drop + overflow borrowed), the classification from the stake taken before the call;
//  - quarter totals: a write tracer on cs and D of the companies involved, labelled by the writing game function, with the raw values at
//    each close; 'real cash borrowing' = raw debt change - the non-cash writes (absorb, LBO, hidden debt, chapter-11 relief).
//  - the statement rows are compared with these at the rounding of the quarter rows (r1: integers from 10 up, two rows in a difference: 1.0).
let errs = 0, fails = 0;
(async () => {
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ };
const pre = (c, m) => { console.log((c ? 'pre  ' : 'ERR  FIXTURE INVALID: ') + m); if (!c) errs++ };
const info = m => console.log('info ' + m);
const f2 = x => x == null ? 'n/a' : (Math.abs(x) < 1e-9 ? 0 : +x).toFixed(2);
const mulb = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
const SEED = 20261016, TOLE = 1e-9, TOLR = 1.0;
const KEYS = ['aD', 'aP', 'aC', 'iD', 'iP', 'iC', 'lD', 'hD'];
const zero = () => ({ aD: 0, aP: 0, aC: 0, iD: 0, iP: 0, iC: 0, lD: 0, hD: 0 });
const same = (a, b, tol) => KEYS.every(k => Math.abs(((a || {})[k] || 0) - ((b || {})[k] || 0)) <= (tol == null ? TOLE : tol));
const shR = r => r ? KEYS.filter(k => Math.abs(r[k] || 0) > 1e-12).map(k => k + ' ' + f2(r[k])).join(', ') || 'all 0' : 'none';

// ---- harness ---------------------------------------------------------------------------------------------------------------------------
let ADD = [];   // every acqAdd call of the current world (see below)
function startWorld(seed) { Math.random = mulb(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; ADD = []; resetOracle() }
const pickTarget = skip => S.co.find(c => !c.dead && !c.kd && !c.priv && !mine(c) && !c.own.P && c.bk === 0 && c.A > 3000 && !(skip || []).includes(c.id));
function nextClose(T) { const l0 = T.fq[T.fq.length - 1]; for (let i = 0; i < 400 && !T.dead; i++) { step(); if (T.fq[T.fq.length - 1] !== l0) return true } return false }
const daysToClose = T => 90 - ((S.day - T.fq[T.fq.length - 1][0]) % 90);
const waitDays = (T, n) => { const w = Math.max(0, Math.min(n, daysToClose(T) - 1)); for (let i = 0; i < w; i++) step() };
const lastRows = T => { const L = fqL(T); return { q: L[L.length - 1], p: L[L.length - 2], L } };
const rowDays = T => T.fq.map(r => r[0]);
// the 현금흐름 tab as rendered (row(label) = the cells of that row, newest quarter first)
function cfTab(c) {
  sel = -1; pg = ''; tab = 'h'; S.spd = 0; G.pick(c.id); G.stab('f'); G.fseg(3); render();
  const h = document.getElementById('sh').innerHTML, row = lab => { const part = h.split('<td>' + lab + '</td>')[1]; return part == null ? null : [...part.split('</tr>')[0].matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m => m[1]) };
  return { h, clean: !/NaN|undefined|Infinity|\[object/.test(h), row };
}
const reload = async strip => { const txt = await packS(strip), s = await loadStr(txt); S = s; v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null; return txt };
// a save written before FIN-CF-03A: the company objects simply have no acq / acr / acd
const legacy = async strip => { const raw = clone(S); for (const x of raw.co) { delete x.acq; delete x.acr; delete x.acd; if (strip) delete x.fq } if (strip) delete raw.IX; S = migrate(raw); v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null };
// every acqAdd call (the game's and the test's), so the expected confirmed record of a close is built from the calls, not from acr
{ const a0 = acqAdd; acqAdd = function (c, k, x) { if (c && x && isFinite(x)) ADD.push({ id: c.id, k, x, day: S.day, tk: c.tk }); return a0(c, k, x) } }
const callsBetween = (id, d0, d1) => { const r = zero(); for (const a of ADD) if (a.id === id && a.day > d0 && a.day <= d1) r[a.k] += a.x; return r };

// ---- the measurement oracle (P2): what each deal really moved, measured around the real game calls; it never reads acq / acr --------------
// CS: snapshot (cash, debt, stakes of every company) taken when an acquisition caller starts; absorb reads it at entry:
//   cash paid = (cash at the caller's start - cash at absorb entry) + (debt at absorb entry - debt at the caller's start)  [shortfall borrowed]
//   internal  = the acquirer's direct stake in the target at the caller's start > 50
// G.tender: LBO debt = the target's debt change in the call. hqQ: hidden debt = the debt change of a company whose '숨은 부채' bomb went off.
// earn: at each close the measured amounts of the quarter become OR.rec[id][row day]; the ledger is compared right there (MIS).
let OR, EVT, MIS, CS = null, NATCHK = null, CLOSEIDX = {};   // CLOSEIDX[id][row day] = number of measured events when that row closed
function resetOracle() { OR = { pend: {}, rec: {} }; EVT = []; MIS = []; CS = null; CLOSEIDX = {}; TR.clear() }
const oAdd = (id, k, x) => { if (!x) return; const p = OR.pend[id] || (OR.pend[id] = zero()); p[k] += x };
const snapAll = () => { const m = new Map(); for (const c of S.co) m.set(c.id, { cs: c.cs, D: c.D, own: Object.assign({}, c.own) }); return m };
const measured = (f0, label) => function () { const o = CS; CS = { m: snapAll(), label }; try { return f0.apply(this, arguments) } finally { CS = o } };
maTick = measured(maTick, 'maTick'); G.merge = measured(G.merge, 'G.merge'); G.liq = measured(G.liq, 'G.liq');
const OFFER = EV2.find(z => z.id === 'offer'); OFFER.go = measured(OFFER.go, 'offer');
{ const f0 = absorb; absorb = function (a, t) {
    const s = CS, b = s && s.m.get(a.id), st = s ? (((s.m.get(t.id) || {}).own || {})['c' + a.id] || 0) : NaN;
    const ev = { label: s ? s.label : 'UNMEASURED', day: S.day, a: a.id, t: t.id, atk: a.tk, ttk: t.tk, tctl: t.ctl, tD: t.D, tcs: t.cs, stake: st, int: st > 50, paid: b ? (b.cs - a.cs) + (a.D - b.D) : NaN };
    const r = f0.apply(this, arguments);
    oAdd(a.id, ev.int ? 'iD' : 'aD', ev.tD); oAdd(a.id, ev.int ? 'iP' : 'aP', ev.paid); oAdd(a.id, ev.int ? 'iC' : 'aC', ev.tcs); EVT.push(ev); return r } }
{ const f0 = G.tender; G.tender = function (i, prem, lbo) { const c = S.co[i], D0 = c && c.D, p0 = c && c.priv; const r = f0.apply(this, arguments);
    if (c && lbo && !p0 && c.priv) { oAdd(c.id, 'lD', c.D - D0); EVT.push({ label: 'LBO', day: S.day, t: c.id, ttk: c.tk, lD: c.D - D0 }) } return r } }
{ const f0 = hqQ; hqQ = function () { const b = new Map(S.co.map(c => [c.id, { D: c.D, k: c.tb && S.day >= c.tb.d ? c.tb.k : null }])); const r = f0.apply(this, arguments);
    for (const c of S.co) { const x = b.get(c.id); if (x && x.k === '숨은 부채' && c.D - x.D) { oAdd(c.id, 'hD', c.D - x.D); EVT.push({ label: 'hidden', day: S.day, t: c.id, ttk: c.tk, hD: c.D - x.D }) } } return r } }
{ const f0 = kill; kill = function (c) { if (c) { delete OR.pend[c.id]; delete OR.rec[c.id] } return f0.apply(this, arguments) } }
{ const f0 = earn; earn = function (c) { const l0 = c.fq && c.fq.length ? c.fq[c.fq.length - 1] : null; const r = f0.apply(this, arguments);
    if (!c.dead && c.fq && c.fq.length && c.fq[c.fq.length - 1] !== l0) { const d = c.fq[c.fq.length - 1][0], p = OR.pend[c.id];
      if (p) { const rec = OR.rec[c.id] || (OR.rec[c.id] = {}), o = rec[d] || (rec[d] = zero()); for (const k of KEYS) o[k] += p[k]; delete OR.pend[c.id] }
      if (OR.rec[c.id]) { const d0 = c.fq[0][0]; for (const k in OR.rec[c.id]) if (+k < d0) delete OR.rec[c.id][k] }
      (CLOSEIDX[c.id] = CLOSEIDX[c.id] || {})[d] = EVT.length;
      const tt = TR.get(c.id); if (tt && tt.obj === c) tt.log.push({ mark: 1, day: d, raw: { cs: c.cs, D: c.D } });
      const want = (OR.rec[c.id] || {})[d], got = (c.acr || {})[d];
      if (NATCHK) NATCHK(c, d);
      if (!same(got, want) || c.acq != null) MIS.push(c.tk + ' row ' + d + ': ledger ' + shR(got) + (c.acq ? ' (acq not cleared)' : '') + ' vs measured ' + shR(want)) } return r } }
// after a save round trip the oracle follows the documented policy: an export drops pending and confirmed records (qBack), except companies qBack skips
const oracleAfterLoad = strip => { if (!strip) return; for (const c of S.co) if (!(c.priv && c.fo)) { delete OR.pend[c.id]; delete OR.rec[c.id] } };
// the ledger against the oracle for some companies: pending and every confirmed key
function ledgerCheck(lab, ids) { const bad = [];
  for (const id of ids) { const c = S.co[id]; if (!same(c.acq, OR.pend[id])) bad.push(c.tk + ' acq ' + shR(c.acq) + ' vs measured ' + shR(OR.pend[id]));
    for (const k of new Set([...Object.keys(c.acr || {}), ...Object.keys(OR.rec[id] || {})])) if (!same((c.acr || {})[k], (OR.rec[id] || {})[k])) bad.push(c.tk + ' acr[' + k + '] ' + shR((c.acr || {})[k]) + ' vs measured ' + shR((OR.rec[id] || {})[k])) }
  const m = MIS.filter(x => ids.some(id => x.startsWith(S.co[id].tk + ' ')));
  ok(!bad.length && !m.length, lab + ': ledger (acq, every acr key) = the measured deals' + (bad.length || m.length ? ' | ' + bad.concat(m).slice(0, 4).join('; ') : '')); return !bad.length && !m.length }
// write tracer on cs / D of a company (labelled by the innermost game function), with marks at its closes and the raw values there
const TR = new Map();
const frame = () => { for (const l of new Error().stack.split('\n').slice(3)) { const m = l.match(/at (?:Object\.|new )?([\w$.]+) \(/); if (m && !/^(set|trace|frame)$/.test(m[1])) return m[1] } return '?' };
function trace(c) { if (TR.has(c.id)) return TR.get(c.id); const t = { log: [], v: { cs: c.cs, D: c.D, A: c.A }, obj: c }; TR.set(c.id, t);
  for (const k of ['cs', 'D', 'A']) Object.defineProperty(c, k, { configurable: true, enumerable: true, get() { return t.v[k] }, set(x) { const d = x - t.v[k]; t.v[k] = x; if (d) t.log.push({ k, d, fr: frame(), day: S.day }) } });
  return t }
// the quarter that ends with row d of company c, from the tracer: raw debt / cash change between the two closes and the writes by function;
// the non-cash debt writes the design takes out: absorb (debt taken over), G.tender (LBO), hqQ without a cash write of its own (hidden debt;
// the lawsuit bomb pays cash and borrows the shortfall), ch11x (FIN-CF-01 relief). Everything else is cash borrowing or repayment.
function quarterOf(c, d) { const t = TR.get(c.id); if (!t) return null; const ms = t.log.map((e, j) => e.mark ? j : -1).filter(j => j >= 0), ib = ms.findIndex(j => t.log[j].day === d);
  if (ib < 1) return null; const ja = ms[ib - 1], jb = ms[ib], w = t.log.slice(ja + 1, jb), p = t.log[ja].raw, q = t.log[jb].raw, by = {};
  const hqCash = new Set(w.filter(e => e.k === 'cs' && e.fr === 'hqQ').map(e => e.day));
  const nc = { absorb: 0, lbo: 0, hidden: 0, relief: 0, growth: 0 };
  // FIN-CF-03B: a financial company's growth at the close is an A write of +x by earn followed at once by a D write of the same +x (no cash)
  for (let j = 0; j < w.length; j++) { const e = w[j]; by[e.k + ':' + e.fr] = (by[e.k + ':' + e.fr] || 0) + e.d; if (e.k !== 'D') continue; const a = w[j - 1];
    if (c.kd && e.fr === 'earn' && a && a.k === 'A' && a.fr === 'earn' && Math.abs(a.d - e.d) < 1e-9) nc.growth += e.d; else if (e.fr === 'absorb') nc.absorb += e.d; else if (e.fr === 'G.tender') nc.lbo += e.d; else if (e.fr === 'hqQ' && !hqCash.has(e.day)) nc.hidden += e.d; else if (e.fr === 'ch11x') nc.relief += e.d }
  return { dD: q.D - p.D, dc: q.cs - p.cs, by, nc, cashBorrow: (q.D - p.D) - nc.absorb - nc.lbo - nc.hidden - nc.relief - nc.growth, raw: { p, q } } }
const evIn = (id, d0, d1, f) => EVT.filter(e => e.a === id && e.day > d0 && e.day <= d1 && (!f || f(e)));
console.log('-- harness ready');

// ================================================================================================================================
// P1 ledger skeleton and lifecycle (records injected with acqAdd where the game has not recorded anything)
// ================================================================================================================================
console.log('\n-- P1 ledger skeleton and lifecycle (SYNTHETIC amounts injected with acqAdd on a real simulated company, seed ' + SEED + ')');
{
  startWorld(SEED);
  const all = S.co.filter(c => !c.dead);
  ok(all.every(c => c.acd === -721) && all.every(c => c.acq == null && c.acr == null), 'L0 new game (day ' + S.day + '): every company (' + all.length + ') has acd = -721 and no acq / acr');
  ok(all.every(c => c.fq && c.fq.length === 8 && c.fq[0][0] === -720), 'L0 the rebuilt rows of a new game reach day -720 (> acd), so none of them is before the ledger');
  let T = pickTarget(); const id = T.id; pre(!!T, 'L fixture company ' + (T && T.tk));
  nextClose(T); nextClose(T); waitDays(T, 20);
  // L1 / L2: two amounts in one quarter, one of them added twice
  const d0 = T.fq[T.fq.length - 1][0];
  acqAdd(T, 'aD', 12.3456789); acqAdd(T, 'aC', 3.2); step(); acqAdd(T, 'aD', .0000001); acqAdd(T, 'hD', 7.75);
  ok(T.acq && Math.abs(T.acq.aD - 12.3456790) < 1e-12 && T.acq.aC === 3.2 && T.acq.hD === 7.75 && T.acq.iD === 0, 'L1 pending acq holds the unrounded sums of the quarter: ' + shR(T.acq));
  nextClose(T); const r1d = T.fq[T.fq.length - 1][0];
  const want1 = callsBetween(id, d0, r1d);
  ok(T.acq == null && T.acr && T.acr[r1d] && same(T.acr[r1d], want1) && Object.keys(T.acr[r1d]).length === 8, 'L2 the close moves it to acr[' + r1d + '] (the row day) = the sum of the calls of the quarter (' + shR(want1) + '), acq cleared, 8 keys');
  ok(rowDays(T).includes(r1d) && Object.keys(T.acr).every(k => rowDays(T).includes(+k)), 'L2 every key of acr is the day of a kept quarter row');
  // L3: a second quarter keeps its own key, the first one stays as it was
  waitDays(T, 30); acqAdd(T, 'iD', 5); acqAdd(T, 'iC', 1.5); acqAdd(T, 'lD', 2);
  const first = clone(T.acr[r1d]); nextClose(T); const r2d = T.fq[T.fq.length - 1][0], want2 = callsBetween(id, r1d, r2d);
  ok(T.acr[r2d] && same(T.acr[r2d], want2) && same(T.acr[r1d], first), 'L3 two quarters, two keys: acr[' + r2d + '] = ' + shR(want2) + '; acr[' + r1d + '] unchanged = ' + shR(first));
  // L4: a quarter with no call makes no key
  nextClose(T); const r3d = T.fq[T.fq.length - 1][0], want3 = callsBetween(id, r2d, r3d), any3 = KEYS.some(k => want3[k]);
  ok(any3 ? same(T.acr[r3d], want3) : T.acr[r3d] == null, 'L4 a quarter ' + (any3 ? 'with game records only: ' + shR(want3) : 'without any record adds no key (acr[' + r3d + '] ' + JSON.stringify(T.acr[r3d]) + ')'));
  // SV10: keys leave together with their rows; acr is deleted when the last one goes
  let goneAt = null, keptRight = true;
  for (let k = 0; k < 9 && T.acr && T.acr[r1d]; k++) { nextClose(T); const dmin = T.fq[0][0]; if (T.acr) for (const key in T.acr) if (+key < dmin) keptRight = false; if (!T.acr || !T.acr[r1d]) goneAt = dmin }
  ok(goneAt != null && goneAt > r1d && keptRight, 'SV10 acr[' + r1d + '] is dropped when its row leaves the 8 kept rows (oldest row now ' + goneAt + '), never earlier, no key older than the oldest row');
  const prevDay = (T, d) => { const j = rowDays(T).indexOf(d); return j > 0 ? T.fq[j - 1][0] : d - 90 };
  const gameKeys = T.acr ? Object.keys(T.acr) : [], gameOnly = gameKeys.every(k => same(T.acr[k], callsBetween(id, prevDay(T, +k), +k)));
  ok(T.acr == null || gameOnly, 'SV10 what is left in acr after the injected quarters are gone is only what the game recorded (' + (T.acr ? gameKeys.length + ' key(s)' : 'acr deleted') + ')');
  // SV8: kill clears the ledger
  acqAdd(T, 'aD', 1); if (!T.acr) { nextClose(T); acqAdd(T, 'aD', 1) }
  pre(T.acq && T.acr, 'SV8 fixture: pending and confirmed records exist before kill');
  kill(T, 1, 1);
  ok(T.dead && T.acq == null && T.acr == null && T.acd != null, 'SV8 kill: acq null, acr deleted (acd kept: ' + T.acd + ')');
}
{ // SV7: a company made during the game
  startWorld(SEED); for (let i = 0; i < 100; i++) step();
  const n0 = S.co.length, c = newCo(3); const d = S.day;
  ok(S.co.length === n0 + 1 && c.acd === d - 721 && c.acq == null && c.acr == null, 'SV7 newCo on day ' + d + ': acd = ' + c.acd + ' (day - 721), no records');
  let rows = 0; for (let i = 0; i < 200 && rows < 2; i++) { step(); rows = c.fq ? c.fq.length : 0 }
  const L = fqL(c); ok(L.length >= 2 && L[0].d > c.acd, 'SV7 its rows (first ' + (L[0] && L[0].d) + ') all lie after acd, the second row is a fully recorded quarter even when the first close is on the day it was made');
}
{ // SV1 / SV5 / legacy: saves
  for (const [fmt, strip] of [['autosave (full)', 0], ['export (packS(1))', 1]]) {
    startWorld(SEED); let T = pickTarget(); const id = T.id; nextClose(T); waitDays(T, 20); acqAdd(T, 'aD', 40); nextClose(T); waitDays(T, 20); acqAdd(T, 'iC', 9.5); acqAdd(T, 'hD', 1.25);
    const acq0 = clone(T.acq), acr0 = clone(T.acr), acd0 = T.acd;
    await reload(strip); T = S.co[id]; const ld = S.day;
    if (!strip) ok(JSON.stringify(T.acq) === JSON.stringify(acq0) && JSON.stringify(T.acr) === JSON.stringify(acr0) && T.acd === acd0, 'SV1 ' + fmt + ': acq ' + shR(T.acq) + ', acr (' + Object.keys(T.acr || {}).length + ' key) and acd ' + T.acd + ' come back exactly');
    else ok(T.acq == null && T.acr == null && T.acd === S.day && T.fq.length === 8, 'SV5 ' + fmt + ': the rows are rebuilt (qBack), the pending record is dropped (it is inside the rebuilt starting debt), acr deleted, acd = load day ' + S.day + ' (got ' + T.acd + ')');
    const dl = T.fq[T.fq.length - 1][0]; nextClose(T); const rd = T.fq[T.fq.length - 1][0];
    if (!strip) ok(T.acr && same(T.acr[rd], callsBetween(id, dl, rd)), 'SV1 ' + fmt + ': the next close confirms the pending record carried through the save: ' + shR(T.acr && T.acr[rd]));
    else { const w = callsBetween(id, ld, rd), any = KEYS.some(k => w[k]); ok(any ? T.acr && same(T.acr[rd], w) : !T.acr || !T.acr[rd], 'SV5 ' + fmt + ': the next close holds only what was recorded after loading (' + shR(T.acr && T.acr[rd]) + ')') }
  }
  startWorld(SEED); for (let i = 0; i < 150; i++) step(); const d = S.day; await legacy(0);
  ok(S.co.filter(c => !c.dead).every(c => c.acd === d && c.acq == null && c.acr == null), 'LG a save made before FIN-CF-03A (no acq / acr / acd) gets acd = the load day ' + d + ' for every company (v8prep)');
  startWorld(SEED); for (let i = 0; i < 150; i++) step(); await legacy(1);
  ok(S.co.filter(c => !c.dead && !(c.priv && c.fo)).every(c => c.acd === S.day && c.fq.length === 8), 'LG an old export (no rows): v8prep and qBack both start the ledger on the load day ' + S.day);
}

// ================================================================================================================================
// P2 recording: every deal path through the real game functions, ledger against the measurement oracle
// ================================================================================================================================
const mkMine = T => { setOwn(T, 'P', 60); ctlAll(); return mine(T) };
const smallOf = (T, f, extra) => S.co.find(c => !c.dead && !c.priv && !c.kd && c !== T && !mine(c) && mc(c) < mc(T) * f && c.i !== HOLD && c.D > 50 && (!extra || extra(c)));
const lastD = T => T.fq[T.fq.length - 1][0];
const delta = (a, b) => { const r = zero(); for (const k of KEYS) r[k] = ((b || {})[k] || 0) - ((a || {})[k] || 0); return r };
const SCN = {};   // scenario results kept for the statement checks (P3)
// the row that closed last: ledger = oracle, and the debt the tracer saw written by each non-cash path = the record of that path
function rowLedger(lab, T, ids) {
  const d = lastD(T), rec = (T.acr || {})[d], qo = quarterOf(T, d);
  ledgerCheck(lab, ids || [T.id]);
  if (qo) ok(Math.abs(qo.nc.absorb - ((rec || {}).aD || 0) - ((rec || {}).iD || 0)) <= TOLE && Math.abs(qo.nc.lbo - ((rec || {}).lD || 0)) <= TOLE && Math.abs(qo.nc.hidden - ((rec || {}).hD || 0)) <= TOLE,
    lab + ': debt written by absorb ' + f2(qo.nc.absorb) + ' / LBO ' + f2(qo.nc.lbo) + ' / hidden debt ' + f2(qo.nc.hidden) + ' (tracer) = record aD+iD / lD / hD of row ' + d + ' (' + shR(rec) + ')');
  return { d, rec, qo } }

// ---- P3 statement check of one row: A = the sum identity (holds by construction), B = item by item from measured amounts --------------------
// measured (never the ledger): the deals of the quarter from the oracle events (only those after the ledger start in a partly recorded quarter,
// none in a quarter closed before it), the raw debt writes from the tracer. Expected statement values use the rounded quarter rows, so the
// raw tracer comparison of 차입 증감 has the row rounding tolerance TOLR (two rounded debt rows), plus the rounding of the row gr (0.5 at 10 and above,
// 0.05 below) when FIN-CF-03B takes that rounded gr out; everything else is exact (1e-6).
const STAT = { rows: 0, tracer: 0, maxB: 0 };
function stmtCheck(lab, T, d, o) { o = o || {};
  const L = fqL(T), j = L.findIndex(x => x.d === d), q = L[j], p = L[j - 1]; if (!q || !p) return pre(false, lab + ': row ' + d + ' with a previous row');
  const s = fqDerive(T, q, p), fin = T.kd, dep = fin ? 0 : q.A * .02, cfo = q.ni - q.eq + q.ga + dep + (q.imp || 0) + (q.wo || 0), capex = fin ? 0 : q.gr + dep, dD = q.D - p.D, dc = q.cs - p.cs;
  const st = q.d <= T.acd ? 'old' : p.d <= T.acd ? 'part' : 'full', from = st === 'part' ? T.acd : p.d;
  // the events of the quarter by order (a deal on a close day after that close belongs to the next quarter, as in the game), by day when a close was not seen
  const ci = CLOSEIDX[T.id] || {}, i0 = ci[p.d], i1 = ci[d], inQ = (e, k) => i0 != null && i1 != null ? k >= i0 && k < i1 : e.day > p.d && e.day <= d;
  const ev = st === 'old' ? [] : EVT.filter((e, k) => inQ(e, k) && e.day > from - (st === 'part' ? 0 : 1e9)), ab = ev.filter(e => e.a === T.id && e.tD != null), ext = ab.filter(e => !e.int), int = ab.filter(e => e.int);
  const lbo = ev.filter(e => e.label === 'LBO' && e.t === T.id).reduce((a, e) => a + e.lD, 0), hid = ev.filter(e => e.label === 'hidden' && e.t === T.id).reduce((a, e) => a + e.hD, 0);
  const ncA = ab.reduce((a, e) => a + e.tD, 0) + lbo + hid, maN = ext.reduce((a, e) => a + e.tcs - e.paid, 0), inN = int.reduce((a, e) => a + e.tcs - e.paid, 0);
  // FIN-CF-03B: a bank's / insurer's growth gr (row value) is not borrowing when the row is fully recorded and the previous row is a real close
  const ncG = fin && st === 'full' && p.d > 0 && Number.isFinite(q.gr) ? q.gr : 0;
  const borrowW = dD + s.nc - ncA - ncG, cffW = borrowW - q.dv + s.iss, othW = dc - cfo + capex - cffW - maN - inN, othOld = dc - cfo + capex - (dD + s.nc - q.dv + s.iss);
  const bad = [], chk = (c, m) => { if (!c) bad.push(m) };
  chk(s.st === st, 'row state ' + s.st + ' want ' + st);
  chk((s.ncG || 0) === ncG && Math.abs(s.ncA - ncA) <= 1e-6 && Math.abs(s.maN - maN) <= 1e-6 && Math.abs(s.inN - inN) <= 1e-6, 'ncG ' + f2(s.ncG) + ' want ' + f2(ncG) + ', ncA/maN/inN ' + f2(s.ncA) + '/' + f2(s.maN) + '/' + f2(s.inN) + ' want measured ' + f2(ncA) + '/' + f2(maN) + '/' + f2(inN));
  chk(Math.abs(s.cff + q.dv - s.iss - borrowW) <= 1e-6 && Math.abs(s.cff - cffW) <= 1e-6 && Math.abs(s.oth - othW) <= 1e-6, '차입 ' + f2(s.cff + q.dv - s.iss) + ' / 재무 ' + f2(s.cff) + ' / 기타 ' + f2(s.oth) + ' want ' + f2(borrowW) + ' / ' + f2(cffW) + ' / ' + f2(othW));
  const A = Math.abs(dc - (s.cfo - s.capex + s.cff + s.maN + s.inN + s.oth)), A2 = Math.abs((s.oth - othOld) - (ncA + ncG - maN - inN));
  chk(A <= 1e-6 && A2 <= 1e-6, 'A: identity off by ' + A + ', shift from the old plug off by ' + A2);
  if (o.expect) for (const [k, v] of Object.entries(o.expect)) { const g = { b: s.cff + q.dv - s.iss, f: s.cff, m: s.maN, i: s.inN, o: s.oth }[k]; chk(Math.abs(g - v) <= .01, k + ' ' + f2(g) + ' want R2 ' + f2(v)) }
  const qo = st === 'full' ? quarterOf(T, d) : null; if (qo) { const e = Math.abs((s.cff + q.dv - s.iss) - qo.cashBorrow); STAT.tracer++; STAT.maxB = Math.max(STAT.maxB, e); chk(e <= TOLR + (ncG ? (Math.abs(q.gr) >= 9.5 ? .5 : .05) : 0), 'B: 차입 증감 ' + f2(s.cff + q.dv - s.iss) + ' vs raw real borrowing from the debt writes ' + f2(qo.cashBorrow) + ' (rounding only allowed: two rounded debt rows' + (ncG ? ' + the rounded row gr taken out (FIN-CF-03B)' : '') + ')') }
  STAT.rows++;
  if (o.quiet && !bad.length) return true;
  let ui = '';
  if (!o.noUI && !T.dead) { const t = cfTab(T), cols = L.slice().reverse(), jj = cols.findIndex(x => x.d === d), ce = n => { const r = t.row(n); return r ? r[jj] : undefined }, h = st === 'part' ? '◐' : '', e = s.est ? '≈' : '';
    const want = { '차입 증감': s.unk ? '미확인' : h ? h + fN(borrowW) : fN(borrowW), '재무활동 현금흐름': s.unk ? '미확인' : e || h ? e + h + fN(cffW) : fN(cffW), '기타·투자 매매': s.unk ? '미확인' : e || h ? e + h + fN(othW) : fN(othW) };
    if (ext.length) want['인수 순현금'] = h + fN(maN); if (int.length) want['자회사 흡수·투자회수(순현금)'] = h + fN(inN);
    if (ncA) want['└ 인수·흡수·LBO·숨은 부채로 늘어난 부채(비현금, 위 차입·재무활동에서 뺌)'] = h + fN(ncA);
    for (const n in want) chk(ce(n) === want[n], 'tab ' + n + ' shows ' + ce(n) + ' want ' + want[n]);
    if (o.noNewRows) chk(!/<td>인수 순현금|<td>자회사 흡수|<td>└ 인수·흡수/.test(t.h), 'tab shows an acquisition row without any deal');
    chk(t.clean, 'NaN / undefined in the tab'); ui = ' | tab: ' + Object.keys(want).map(n => n.replace(/\(.*$/, '').replace('└ 인수·흡수·LBO·숨은 부채로 늘어난 부채', '비현금 부채') + ' ' + ce(n)).join(', ') }
  ok(!bad.length, lab + ' [' + st + ']: 차입 ' + f2(s.cff + q.dv - s.iss) + ', 재무 ' + f2(s.cff) + ', 인수 순현금 ' + f2(s.maN) + ', 자회사 흡수 ' + f2(s.inN) + ', 기타 ' + f2(s.oth) + ', 비현금 부채 ' + f2(s.ncA) + ' = measured' + (qo ? '; raw real borrowing ' + f2(qo.cashBorrow) : '') + ui + (bad.length ? ' | ' + bad.slice(0, 4).join('; ') : ''));
  return !bad.length }
const EXP = { K1: { b: .20, f: -50.80, m: 103.03, o: -1.23 }, K2: { b: 1361.52, f: 1285.52, m: -1959.23, o: -.39 }, K3: { b: -.14, f: -69.14, m: -191.17, o: .31 },
  K4: { b: .45, f: .45, m: 0, o: -.45 }, K5: { b: .56, f: -58.44, i: 74.92, o: -.48 }, K10: { b: .05, f: -7.35, m: 109.71, o: -3.46 } };   // FIN-CF-03B: was b 66.05 / f 58.65 / o -69.46 with the bank's growth gr 66 (no cash) in 차입 증감
function scn(key, o, expect) { SCN[key] = o; const T = S.co[o.id]; for (const d of o.ds || [o.d]) stmtCheck(key + ' statement row ' + d, T, d, { expect }) }
console.log('\n-- P2 deals through the real game functions (seed ' + SEED + '; stakes and cash set with setOwn / fields where a case needs exact numbers)');

// ---- Gemini C1 / C2 (game call level: only the deal's own cash moves are compared, as the case says no other cash moves) ----
{ startWorld(SEED); const T = pickTarget(); mkMine(T); nextClose(T); nextClose(T); waitDays(T, 20); const x = smallOf(T, .3); setOwn(x, 'P', 55); ctlAll();
  let ev = null, a0 = null; for (let k = 0; k < 10 && !x.dead; k++) { T.cs = 500; T.D = 200; x.cs = 100; x.D = 100; a0 = clone(T.acq); const n = EVT.length; S.te = T.id; G.merge(x.id, 40); if (EVT.length > n) ev = EVT[n] }
  pre(ev && x.dead, 'C1-g fixture: stock merger of ' + x.tk + ' into ' + T.tk + ' went through (' + (ev ? 'stake before ' + f2(ev.stake) + '%' : 'refused') + ')');
  ok(Math.abs(T.cs - 600) <= TOLE && Math.abs(T.D - 300) <= TOLE, 'C1-g acquirer after the deal: cash ' + f2(T.cs) + ' (500 + 100), debt ' + f2(T.D) + ' (200 + 100)');
  ok(same(delta(a0, T.acq), Object.assign(zero(), { aD: 100, aC: 100 })) && ev && !ev.int && Math.abs(ev.paid) <= TOLE, 'C1-g recorded by the deal: ' + shR(delta(a0, T.acq)) + ' = external, debt taken over 100, cash paid 0, cash brought in 100');
  nextClose(T); rowLedger('C1-g close', T); scn('C1', { id: T.id, d: lastD(T) }, EXP.C1) }
{ startWorld(SEED); const big = z => S.co.filter(y => !y.dead && !y.priv && !y.kd && y.i === z.i && y !== z && !mine(y));
  const c = S.co.find(z => !z.dead && !z.priv && !z.kd && !mine(z) && !z.own.P && z.bk === 0 && z.A > 800 && z.i !== HOLD && big(z).length); mkMine(c); const a = big(c).sort((p, q) => mc(q) - mc(p))[0];
  nextClose(a); nextClose(a); waitDays(a, 20); setOwn(c, 'c' + a.id, 0); a.cs = 1000; a.D = 500; c.cs = 200; c.D = 300; c.p = 300 * 1e4 / c.sh; ctlAll();
  const a0 = clone(a.acq), n = EVT.length; const msg = OFFER.go(c, { a: a.id, pr: 0 }, 'yes'); const ev = EVT[n];
  pre(!!ev && c.dead, 'C2-g fixture: ' + msg + ' (price = market value ' + f2(300) + ', acquirer held 0%)');
  ok(Math.abs(a.cs - 900) <= 1e-6 && Math.abs(a.D - 800) <= 1e-6, 'C2-g acquirer after the deal: cash ' + f2(a.cs) + ' (1000 - 300 + 200), debt ' + f2(a.D) + ' (500 + 300, nothing borrowed)');
  ok(same(delta(a0, a.acq), Object.assign(zero(), { aD: 300, aP: ev.paid, aC: 200 })) && Math.abs(ev.paid - 300) <= 1e-6 && !ev.int, 'C2-g recorded: ' + shR(delta(a0, a.acq)) + ' = external, debt 300, cash paid 300 (measured ' + f2(ev.paid) + '), cash in 200');
  nextClose(a); rowLedger('C2-g close', a); scn('C2', { id: a.id, d: lastD(a) }, EXP.C2) }
{ startWorld(SEED); const H = pickTarget(); mkMine(H); const C = smallOf(H, .2); H.cs += mc(C) * 3; S.te = H.id; G.tender(C.id, 90, 0);
  pre(C.priv && (C.own['c' + H.id] || 0) >= 99.9, 'C1-i fixture: ' + H.tk + ' owns 100% of the private ' + C.tk + ' after a tender');
  nextClose(H); waitDays(H, 20); H.cs = 500; H.D = 200; C.cs = 100; C.D = 100; const a0 = clone(H.acq), n = EVT.length; G.liq(C.id); const ev = EVT[n];
  ok(C.dead && Math.abs(H.cs - 600) <= TOLE && Math.abs(H.D - 300) <= TOLE, 'C1-i G.liq: parent cash ' + f2(H.cs) + ', debt ' + f2(H.D));
  ok(ev && ev.int && same(delta(a0, H.acq), Object.assign(zero(), { iD: 100, iC: 100 })), 'C1-i recorded as INTERNAL absorption (stake ' + f2(ev && ev.stake) + '%): ' + shR(delta(a0, H.acq)) + ', nothing in the external keys');
  nextClose(H); rowLedger('C1-i close', H); scn('C1i', { id: H.id, d: lastD(H) }, EXP.C1i) }

// ---- audit cases K1 K2 K3 K4 K5 K10 (same scenarios as RT-FIN-CF-03-AUDIT / R2 section 6) ----
{ startWorld(SEED); const T = pickTarget(); mkMine(T); trace(T); nextClose(T); nextClose(T); waitDays(T, 30);
  const x = S.co.find(c => !c.dead && !c.priv && !c.kd && c !== T && !mine(c) && mc(c) < mc(T) * .3 && c.i !== HOLD); setOwn(x, 'P', 55); ctlAll(); S.te = T.id;
  const n = EVT.length; G.merge(x.id, 40); const ev = EVT[n]; nextClose(T);
  ok(ev && !ev.int && ev.stake === 0 && ev.tctl === 'P', 'K1 sister merger (target controlled by the player, acquirer held ' + f2(ev && ev.stake) + '%): external by the direct-stake rule');
  const r = rowLedger('K1', T); ok(r.rec && Math.abs(r.rec.aD - 1117.80) < .005 && Math.abs(r.rec.aC - 103.03) < .005 && r.rec.aP === 0, 'K1 record ' + shR(r.rec) + ' (R2: debt 1,117.80, cash in 103.03, paid 0)'); scn('K1', { id: T.id, d: r.d }, EXP.K1) }
{ startWorld(SEED); const big = z => S.co.filter(y => !y.dead && !y.priv && !y.kd && y.i === z.i && y !== z && mc(y) > mc(z) * 1.5);
  const c = S.co.find(z => !z.dead && !z.priv && !z.kd && !mine(z) && !z.own.P && z.bk === 0 && z.A > 800 && z.i !== HOLD && z.D > 100 && big(z).length); mkMine(c);
  let a = big(c).sort((p, q) => mc(q) - mc(p))[0]; a.cs = Math.max(a.cs, mc(c) * 1.6); setOwn(c, 'c' + a.id, 10); ctlAll(); trace(a);
  nextClose(a); nextClose(a); waitDays(a, 30); const x = OFFER.mk(c); if (x.a !== a.id) { a = S.co[x.a]; trace(a) }
  const own = c.own['c' + a.id] || 0, P = mc(c) * (1 + x.pr / 100), D0 = a.D, n = EVT.length; OFFER.go(c, x, 'yes'); const ev = EVT[n], borrowed = (a.D - D0) - ev.tD;
  ok(ev && !ev.int && Math.abs(ev.paid - P * (100 - own) / 100) <= 1e-6, 'K2 offer, acquirer held ' + f2(own) + '%: cash paid measured ' + f2(ev && ev.paid) + ' = price ' + f2(P) + ' x ' + f2(100 - own) + '% (the stake it held is not paid again)');
  ok(borrowed > 1, 'K2 the acquirer was short of cash: ' + f2(borrowed) + ' borrowed in the deal (real new borrowing; the record keeps only the debt taken over ' + f2(ev.tD) + ')');
  nextClose(a); const r = rowLedger('K2', a); ok(r.rec && Math.abs(r.rec.aD - ev.tD) <= TOLE && Math.abs(r.rec.aP - ev.paid) <= TOLE && Math.abs(r.rec.aC - ev.tcs) <= TOLE, 'K2 record ' + shR(r.rec)); scn('K2', { id: a.id, d: r.d, borrowed }, EXP.K2) }
{ startWorld(SEED); for (let i = 0; i < 200; i++) { if (i === 100) for (const c of S.co) if (!c.dead && !c.priv && !mine(c)) trace(c); step() } let ev = null;
  for (let k = 0; k < 400 && !ev; k++) { const n = EVT.length; maTick(); if (EVT.length > n) ev = EVT[n] }
  const ac = S.co[ev.a]; pre(!!ev, 'K3 fixture: maTick bought ' + ev.ttk + ' for ' + ac.tk); nextClose(ac);
  ok(!ev.int && ev.paid > 0, 'K3 maTick: external, cash paid measured ' + f2(ev.paid) + ' (stake before ' + f2(ev.stake) + '%)');
  const r = rowLedger('K3', ac); scn('K3', { id: ac.id, d: r.d }, EXP.K3) }
{ startWorld(SEED); const T = pickTarget(); trace(T); nextClose(T); nextClose(T); waitDays(T, 30); S.cash = 1e7; S.te = 'P'; let ok1 = 0, D0 = 0;
  for (const pr of [60, 90, 140]) { D0 = T.D; G.tender(T.id, pr, 1); if (T.priv) { ok1 = 1; break } }
  pre(ok1, 'K4 fixture: LBO of ' + T.tk + ' went through'); const lD = T.D - D0; nextClose(T);
  const r = rowLedger('K4', T); ok(r.rec && Math.abs(r.rec.lD - lD) <= TOLE && r.rec.aD === 0 && r.rec.iD === 0, 'K4 target record lD ' + f2(r.rec && r.rec.lD) + ' = its debt change in G.tender ' + f2(lD) + '; the player (acquirer) has no company record'); scn('K4', { id: T.id, d: r.d }, EXP.K4) }
{ startWorld(SEED); const H = pickTarget(); mkMine(H); const C = S.co.find(c => !c.dead && !c.priv && !c.kd && c !== H && !mine(c) && mc(c) < mc(H) * .2 && c.i !== HOLD && c.D > 50);
  H.cs += mc(C) * 3; S.te = H.id; G.tender(C.id, 90, 0); trace(H); nextClose(H); nextClose(H); nextClose(H); waitDays(H, 30); const n = EVT.length; G.liq(C.id); const ev = EVT[n]; nextClose(H);
  ok(ev && ev.int && ev.stake >= 99.9 && Math.abs(ev.paid) <= TOLE, 'K5 G.liq: internal absorption of the 100% subsidiary, cash paid ' + f2(ev && ev.paid));
  const r = rowLedger('K5', H); ok(r.rec && r.rec.iD > 0 && r.rec.aD === 0 && r.rec.aC === 0, 'K5 record ' + shR(r.rec) + ' (internal keys only)'); scn('K5', { id: H.id, d: r.d }, EXP.K5) }
{ startWorld(SEED); const banksL = S.co.filter(c => !c.dead && c.kd === 1 && !c.priv && !mine(c)).sort((p, q) => mc(q) - mc(p)); const T = banksL[0]; mkMine(T);
  const x = banksL.find(c => c !== T && mc(c) < mc(T) * .3); setOwn(x, 'P', 55); ctlAll(); trace(T); nextClose(T); nextClose(T); waitDays(T, 30);
  let tries = 0; const n = EVT.length; for (; tries < 12 && EVT.length === n; tries++) { S.te = T.id; G.merge(x.id, 60) } const ev = EVT[n]; nextClose(T);
  ok(ev && !ev.int, 'K10 bank merger after ' + tries + ' tries (refused tries cost advisory fees, no record): external, deposits taken over ' + f2(ev && ev.tD));
  const r = rowLedger('K10', T); ok(r.rec && Math.abs(r.rec.aD - ev.tD) <= TOLE && r.qo && r.qo.by['D:earn'] > 0, 'K10 record ' + shR(r.rec) + '; the quarter growth gr written by earn (' + f2(r.qo && r.qo.by['D:earn']) + ') is not in the record (FIN-CF-03B)'); scn('K10', { id: T.id, d: r.d }, EXP.K10) }

// ---- mixed and boundary deals ----
{ // X1 one quarter: external stock merger + internal absorption of a 100% subsidiary + a bond issue (real borrowing) on the same company
  startWorld(SEED); const H = pickTarget(); mkMine(H); const C = smallOf(H, .2); H.cs += mc(C) * 3; S.te = H.id; G.tender(C.id, 90, 0); trace(H);
  nextClose(H); nextClose(H); waitDays(H, 20); const x = smallOf(H, .3, c => c !== C); setOwn(x, 'P', 55); ctlAll();
  const n = EVT.length; for (let k = 0; k < 10 && !x.dead; k++) { S.te = H.id; G.merge(x.id, 40) } G.liq(C.id); H.bond = 0; const D0 = H.D; G.bissue(H.id, .1); const bond = H.D - D0; nextClose(H);
  const evs = EVT.slice(n), ext = evs.filter(e => e.a === H.id && !e.int), int = evs.filter(e => e.a === H.id && e.int);
  ok(ext.length === 1 && int.length === 1 && bond > 0, 'X1 fixture-check: one external (' + (ext[0] && ext[0].ttk) + ') and one internal (' + (int[0] && int[0].ttk) + ') absorption, bond ' + f2(bond) + ' in one quarter');
  const r = rowLedger('X1', H); ok(r.rec && Math.abs(r.rec.aD - ext[0].tD) <= TOLE && Math.abs(r.rec.iD - int[0].tD) <= TOLE && Math.abs(r.rec.aC - ext[0].tcs) <= TOLE && Math.abs(r.rec.iC - int[0].tcs) <= TOLE, 'X1 each kind in its own keys, each debt once: ' + shR(r.rec));
  scn('X1', { id: H.id, d: r.d, bond }, EXP.X1) }
{ // X2 maTick absorbs its own 60% subsidiary (acquirer controlled by a rival, so the filter t.ctl !== "c"+ac.id lets it through) and pays the 40%
  startWorld(SEED); for (let i = 0; i < 60; i++) step(); const cand = S.co.filter(c => !c.dead && !c.priv && !mine(c) && rating(c) <= 2 && !c.kd).sort((x, y) => mc(y) - mc(x)).slice(0, 30);
  let ac = null, t = null; for (const a of cand) { const ts = S.co.filter(z => !z.dead && z.i === a.i && z !== a && !z.priv && !mine(z) && mc(z) < mc(a) * .25 && z.pill < S.day); if (ts.length) { ac = a; t = ts[0]; break } }
  for (const k of Object.keys(ac.own)) setOwn(ac, k, 0); setOwn(ac, 'r0', 60); for (const k of Object.keys(t.own)) setOwn(t, k, 0); setOwn(t, 'c' + ac.id, 60); t.bs['c' + ac.id] = mc(t) * .6; ctlAll(); trace(ac);
  let ev = null; for (let k = 0; k < 6000 && !ev && !ac.dead && !t.dead; k++) { const n = EVT.length; maTick(); ev = EVT.slice(n).find(e => e.a === ac.id && e.t === t.id) || null }
  pre(!!ev, 'X2 fixture: maTick made ' + ac.tk + ' absorb its own subsidiary ' + t.tk);
  ok(ev && ev.int && ev.stake === 60 && ev.paid > 0, 'X2 internal absorption with cash for the other 40%: paid ' + f2(ev && ev.paid) + ' (stake before ' + f2(ev && ev.stake) + '%)');
  nextClose(ac); const r = rowLedger('X2', ac); ok(r.rec && Math.abs(r.rec.iP - ev.paid) <= TOLE && Math.abs(r.rec.iC - ev.tcs) <= TOLE && Math.abs(r.rec.iD - ev.tD) <= TOLE, 'X2 record ' + shR(r.rec)); scn('X2', { id: ac.id, d: r.d }, EXP.X2) }
{ // X3 two external stock mergers in one quarter; X4 two more in two later quarters, all inside the 8 kept rows
  startWorld(SEED); const H = pickTarget(); mkMine(H); trace(H); nextClose(H); nextClose(H); waitDays(H, 20);
  const merge = f => { const x = smallOf(H, f, c => !c.own['c' + H.id]); setOwn(x, 'P', 55); ctlAll(); for (let k = 0; k < 10 && !x.dead; k++) { S.te = H.id; G.merge(x.id, 40) } return x };
  const xa = merge(.1), xb = merge(.1); nextClose(H); const r3 = rowLedger('X3', H), e3 = evIn(H.id, r3.d - 90, r3.d);
  ok(xa.dead && xb.dead && e3.length === 2 && r3.rec && Math.abs(r3.rec.aD - e3[0].tD - e3[1].tD) <= TOLE, 'X3 two deals in one quarter add up in one key: aD ' + f2(r3.rec && r3.rec.aD) + ' = ' + f2(e3[0] && e3[0].tD) + ' + ' + f2(e3[1] && e3[1].tD));
  waitDays(H, 20); merge(.1); nextClose(H); const d4 = lastD(H); nextClose(H); waitDays(H, 20); merge(.1); nextClose(H); const d5 = lastD(H);
  for (let k = 0; k < 3; k++) nextClose(H);
  ok(H.acr && H.acr[r3.d] && H.acr[d4] && H.acr[d5] && rowDays(H).includes(r3.d), 'X4 records of three different quarters (' + r3.d + ', ' + d4 + ', ' + d5 + ') are all kept while their rows are visible');
  ledgerCheck('X4 all quarters', [H.id]); scn('X34', { id: H.id, ds: [r3.d, d4, d5] }, EXP.X34) }
{ // X5 / X7 hidden debt found on a company that also absorbs in the quarter (bomb injected: the game's hqQ runs it)
  startWorld(SEED); const H = pickTarget(); mkMine(H); trace(H); nextClose(H); nextClose(H); waitDays(H, 20); const x = smallOf(H, .3); setOwn(x, 'P', 55); ctlAll();
  for (let k = 0; k < 10 && !x.dead; k++) { S.te = H.id; G.merge(x.id, 40) } H.tb = { d: S.day, s: .3, k: '숨은 부채' }; const A0 = H.A; hqQ(); H.bond = 0; const D0 = H.D; G.bissue(H.id, .1); const bond = H.D - D0;
  const hid = EVT.filter(e => e.label === 'hidden' && e.t === H.id).pop(); nextClose(H);
  ok(hid && Math.abs(hid.hD - A0 * .1) <= 1e-6, 'X5 hidden debt found: debt +' + f2(hid && hid.hD) + ' (= assets x 0.1, ' + f2(A0 * .1) + ')');
  const r = rowLedger('X5', H); ok(r.rec && Math.abs(r.rec.hD - hid.hD) <= TOLE && r.rec.aD > 0, 'X5 hidden debt and debt taken over in their own keys: ' + shR(r.rec)); scn('X5', { id: H.id, d: r.d, bond }, EXP.X5) }
{ // X6 LBO of a target by a company, then the 100% LBO target absorbed into it (G.liq) in the same quarter: the LBO debt comes over once
  startWorld(SEED); const H = pickTarget(); mkMine(H); const C = smallOf(H, .2); H.cs += mc(C) * 5; trace(H); trace(C); nextClose(H); nextClose(H); waitDays(H, 20);
  let D0 = 0; for (const pr of [60, 90, 140]) { D0 = C.D; S.te = H.id; G.tender(C.id, pr, 1); if (C.priv) break } const lD = C.D - D0;
  pre(C.priv && (C.own['c' + H.id] || 0) >= 99.9 && lD > 0, 'X6 fixture: LBO of ' + C.tk + ' by ' + H.tk + ' (debt put on the target ' + f2(lD) + ')');
  ok(C.acq && Math.abs(C.acq.lD - lD) <= TOLE, 'X6 the target records the LBO debt while it lives: lD ' + f2(C.acq && C.acq.lD));
  const cD = C.D, n = EVT.length; G.liq(C.id); const ev = EVT[n];
  ok(C.dead && C.acq == null && C.acr == null, 'X6 the absorbed target is killed with its records (acq ' + JSON.stringify(C.acq) + ', acr ' + JSON.stringify(C.acr) + ')');
  nextClose(H); const r = rowLedger('X6', H);
  ok(r.rec && ev.int && Math.abs(r.rec.iD - cD) <= TOLE && r.rec.lD === 0 && cD >= lD, 'X6 the parent records the whole target debt ' + f2(cD) + ' (LBO debt ' + f2(lD) + ' inside it) once, as internal, and no lD of its own: ' + shR(r.rec)); scn('X6', { id: H.id, d: r.d }, EXP.X6) }
{ // CH chain: B absorbs C (C's debt moves to B), then A absorbs B: A takes B's whole debt once; same quarter and across quarters
  for (const across of [0, 1]) { startWorld(SEED); const A = pickTarget(); mkMine(A); const B = smallOf(A, .4, c => c.D > 100); mkMine(B); const C = smallOf(B, .5, c => c !== A && !c.own['c' + B.id]); setOwn(C, 'P', 55); ctlAll();
    trace(A); nextClose(A); nextClose(A); waitDays(A, 10); const lab = 'CH ' + (across ? 'across quarters' : 'same quarter');
    const BD0 = B.D, CD = C.D; for (let k = 0; k < 10 && !C.dead; k++) { S.te = B.id; G.merge(C.id, 40) } pre(C.dead, lab + ' fixture: ' + B.tk + ' absorbed ' + C.tk);
    if (across) { nextClose(B); nextClose(A) }
    const bRec = clone(across ? B.acr : B.acq); ok(across ? !!(bRec && Object.keys(bRec).length) : !!(bRec && bRec.aD > 0), lab + ': B holds its own ' + (across ? 'confirmed' : 'pending') + ' record of C (aD ' + f2(across ? Object.values(bRec || {}).reduce((s, r) => s + r.aD, 0) : bRec && bRec.aD) + ')');
    const BD = B.D, a0 = clone(A.acq); for (let k = 0; k < 10 && !B.dead; k++) { S.te = A.id; G.merge(B.id, 40) } pre(B.dead, lab + ' fixture: ' + A.tk + ' absorbed ' + B.tk);
    const got = delta(a0, A.acq).aD;
    ok(Math.abs(got - BD) <= TOLE && Math.abs(got - (BD + CD)) > 1, lab + ': A records B\'s debt at the deal ' + f2(BD) + ' once (B before C ' + f2(BD0) + ' + C ' + f2(CD) + ' are inside it; double counting would give ' + f2(BD + CD) + '): got ' + f2(got));
    ok(B.acq == null && B.acr == null && C.acq == null && C.acr == null, lab + ': B and C are killed with their pending and confirmed records');
    nextClose(A); rowLedger(lab, A); scn('CH' + across, { id: A.id, d: lastD(A) }) } }
{ // X8 / X9 one quarter: an absorption, a share issue (FIN-CF-02) and a chapter-11 relief (FIN-CF-01) on the same company
  startWorld(SEED); const H = pickTarget(); mkMine(H); trace(H); nextClose(H); nextClose(H); waitDays(H, 20); const x = smallOf(H, .3); setOwn(x, 'P', 55); ctlAll();
  for (let k = 0; k < 10 && !x.dead; k++) { S.te = H.id; G.merge(x.id, 40) } const cs0 = H.cs; G.mg(H.id, 'iss', .1); const iss = H.cs - cs0; const D0 = H.D; ch11x(H, 'FIN-CF-03A test'); const R = D0 - H.D;
  nextClose(H); const d = lastD(H);
  ok(H.rlf && H.rlf.d === d && Math.abs(H.rlf.R - R) <= TOLE && H.isq && Math.abs(H.isq[d] - iss) <= TOLE, 'X8 FIN-CF-01 relief ' + f2(R) + ' and FIN-CF-02 issue ' + f2(iss) + ' keep their own ledgers (rlf, isq) in the same row ' + d);
  rowLedger('X8', H); scn('X8', { id: H.id, d }, EXP.X8) }
{ // F1 refused or rejected deals record nothing
  startWorld(SEED); const T = pickTarget(); mkMine(T); nextClose(T); waitDays(T, 20); 
  let refused = 0, kept = true; for (const c of S.co.filter(c => !c.dead && !c.priv && !c.kd && c !== T && !mine(c) && mc(c) < mc(T) * .3).slice(0, 25)) { const n = EVT.length, cs0 = T.cs, a0 = clone(T.acq); S.te = T.id; G.merge(c.id, 0);
    if (EVT.length === n && !c.dead && T.cs < cs0) { refused++; kept = kept && JSON.stringify(T.acq) === JSON.stringify(a0) } if (refused >= 3) break }
  const y = pickTarget([T.id]); const D0 = y.D; S.cash = 1e7; S.te = 'P'; G.tender(y.id, 0, 1); const tenderRefused = !y.priv;
  const big = S.co.find(z => !z.dead && !z.priv && !z.kd && z.i === T.i && z !== T && !mine(z)) || S.co.find(z => !z.dead && !z.priv && !z.kd && z !== T && !mine(z)); if (big) OFFER.go(T, { a: big.id, pr: 30 }, 'no');
  ok(refused >= 1 && kept, 'F1 ' + refused + ' refused stock merger(s) (advisory fee paid) leave the acquirer\'s record as it was: ' + shR(T.acq));
  ok(tenderRefused ? y.acq == null && y.D === D0 : true, 'F1 a refused LBO tender (premium 0%) puts no debt and no record on the target' + (tenderRefused ? '' : ' (not refused here: not checked)'));
  ok(!big || !T.dead, 'F1 a rejected takeover offer absorbs nothing (' + (big ? T.tk + ' alive' : 'no bidder') + ')') }


// ================================================================================================================================
// P3 statement and tab
// ================================================================================================================================
console.log('\n-- P3 Gemini cases on the statement formula (hand-made rows, no other cash; a fake company carrying only the record)');
{ const row = (d, cs, D) => ({ d, rev: 0, op: 0, rd: 0, it: 0, ii: 0, ga: 0, eq: 0, dr: 0, tax: 0, ni: 0, dv: 0, gr: 0, cs, A: 0, gw: 0, pv: 0, D, bond: 0, pa: 0, sh: 100, p: 1, imp: 0, wo: 0 });
  const unit = (lab, pc, pD, qc, qD, rec, want) => { const c = { i: 0, kd: 0, acd: -721, acr: { 180: Object.assign(zero(), rec) } }, d = fqDerive(c, row(180, qc, qD), row(90, pc, pD));
    const g = { b: d.cff + 0 - d.iss, f: d.cff, m: d.maN, i: d.inN, o: d.oth, dc: d.dc, ncA: d.ncA };
    ok(Object.entries(want).every(([k, v]) => Math.abs(g[k] - v) <= 1e-9) && Math.abs(d.dc - (d.cfo - d.capex + d.cff + d.maN + d.inN + d.oth)) <= 1e-9, lab + ': ' + Object.keys(want).map(k => k + ' ' + f2(g[k]) + ' (want ' + f2(want[k]) + ')').join(', ')) };
  unit('C1-u Gemini C1 (cash 500 / debt 200 + target cash 100 / debt 100, shares 300, cash 0)', 500, 200, 600, 300, { aD: 100, aC: 100 }, { b: 0, f: 0, m: 100, o: 0, dc: 100, ncA: 100 });
  unit('C2-u Gemini C2 (cash 1000 / debt 500 + target cash 200 / debt 300, cash 300)', 1000, 500, 900, 800, { aD: 300, aP: 300, aC: 200 }, { b: 0, f: 0, m: -100, o: 0, dc: -100, ncA: 300 });
  unit('C3-u cash short (cash 100 / debt 0 + target cash 50 / debt 200, cash 300: 200 borrowed)', 100, 0, 50, 400, { aD: 200, aP: 300, aC: 50 }, { b: 200, f: 200, m: -250, o: 0, dc: -50, ncA: 200 });
  unit('C1-i-u internal absorption with the C1 numbers', 500, 200, 600, 300, { iD: 100, iC: 100 }, { b: 0, f: 0, m: 0, i: 100, o: 0, dc: 100 });
  unit('C4-u LBO debt only on the target (debt +700, no cash)', 50, 100, 50, 800, { lD: 700 }, { b: 0, f: 0, m: 0, o: 0, dc: 0, ncA: 700 });
  unit('C5-u hidden debt only (debt +80, no cash): the corrected 차입 증감 can go negative when debt was also repaid (repay 30)', 100, 500, 70, 550, { hD: 80 }, { b: -30, f: -30, o: 0, dc: -30, ncA: 80 }) }
{ // C3-g the same cash shortfall through the offer event: the shortfall is real new borrowing and stays in 차입 증감
  startWorld(SEED); const big = z => S.co.filter(y => !y.dead && !y.priv && !y.kd && y.i === z.i && y !== z && !mine(y));
  const c = S.co.find(z => !z.dead && !z.priv && !z.kd && !mine(z) && !z.own.P && z.bk === 0 && z.A > 800 && z.i !== HOLD && big(z).length); mkMine(c); const a = big(c).sort((p, q) => mc(q) - mc(p))[0];
  nextClose(a); nextClose(a); waitDays(a, 20); setOwn(c, 'c' + a.id, 0); a.cs = 100; a.D = 0; c.cs = 50; c.D = 200; c.p = 300 * 1e4 / c.sh; ctlAll(); const a0 = clone(a.acq), n = EVT.length; OFFER.go(c, { a: a.id, pr: 0 }, 'yes'); const ev = EVT[n];
  ok(Math.abs(a.cs - 50) <= 1e-6 && Math.abs(a.D - 400) <= 1e-6 && same(delta(a0, a.acq), Object.assign(zero(), { aD: 200, aP: ev.paid, aC: 50 })) && Math.abs(ev.paid - 300) <= 1e-6,
    'C3-g offer with cash 100 for a price 300: cash ' + f2(a.cs) + ' (0 + 50), debt ' + f2(a.D) + ' (200 borrowed + 200 taken over); recorded ' + shR(delta(a0, a.acq)) + ' (the 200 borrowed is not in the record)');
  nextClose(a); rowLedger('C3-g close', a); scn('C3', { id: a.id, d: lastD(a) }) }
{ // K6 banks and insurers in a quarter without any FIN-CF-03A event: no 03A row; since FIN-CF-03B the growth gr (no cash) is out of 차입 증감
  startWorld(SEED); for (const kd of [1, 2]) { const B = S.co.find(c => !c.dead && c.kd === kd && !c.priv && c.fq && c.fq.length >= 2); trace(B); nextClose(B); nextClose(B); const d = lastD(B);
    const L = fqL(B), q = L[L.length - 1], p = L[L.length - 2], s = fqDerive(B, q, p), old = q.D - p.D + s.nc - q.dv + s.iss;
    ok(!(B.acr && B.acr[d]) && p.d > 0 && Math.abs(s.cff - (old - q.gr)) <= 1e-9 && s.ncG === q.gr && s.ncA === 0 && s.maN === 0 && s.inN === 0, 'K6 ' + B.tk + ' (kd ' + kd + ') row ' + d + ': no record, 재무활동 ' + f2(s.cff) + ' = the old formula ' + f2(old) + ' minus the growth gr ' + f2(q.gr) + ' (no cash; 차입 증감 ' + f2(s.cff + q.dv - s.iss) + ')');
    stmtCheck('K6 ' + B.tk + ' statement', B, d, { noNewRows: 1, expect: kd === 1 ? { b: 0, f: -6.2, o: .2 } : { b: 0, f: -5.4, o: -.6 } }) } }   // FIN-CF-03B: was b 49 / f 42.8 / o -48.8 and b 28 / f 22.6 / o -28.6 (gr 49 / 28 in 차입 증감)

console.log('\n-- P3 save boundaries on the statement and the tab (an old save is a save without acq / acr / acd)');
{ const setup = () => { startWorld(SEED); const T = pickTarget(); mkMine(T); nextClose(T); nextClose(T); return T };
  const sister = (T, f) => { const x = smallOf(T, f, c => !c.own['c' + T.id]); setOwn(x, 'P', 55); ctlAll(); for (let k = 0; k < 10 && !x.dead; k++) { S.te = T.id; G.merge(x.id, 40) } return x };
  for (const [tag, before, after] of [['SV2 deal after loading an old save (the GPT-6 example)', 0, 1], ['SV3 deal before the save only (not recorded)', 1, 0], ['SV4 one deal before the save, one after loading', 1, 1]]) {
    let T = setup(); const id = T.id, C = lastD(T); for (let i = 0; i < 5; i++) step(); if (before) sister(T, .3); while (S.day < C + 10) step(); await legacy(0); T = S.co[id]; const ld = S.day;
    pre(T.acd === ld && T.acq == null, tag + ': loaded on day ' + ld + ', ledger starts there (acd ' + T.acd + ')');
    while (S.day < C + 30) step(); if (after) sister(T, before ? .2 : .3); nextClose(T); const d = lastD(T);
    stmtCheck(tag, T, d); const note = cfNote(T);
    ok(note.includes('◐ 부분 기록 분기(' + qLab(d)) && note.includes('기록 전 분기('), tag + ': footnotes name ' + qLab(d) + ' as partly recorded and the quarters closed before loading as not recorded') }
  { let T = setup(); const id = T.id; while (daysToClose(T) > 1) step(); nextClose(T); const C = lastD(T); pre(S.day === C, 'SV11 fixture: saved on the close day ' + C);
    await legacy(0); T = S.co[id]; for (let i = 0; i < 20; i++) step(); sister(T, .3); nextClose(T); stmtCheck('SV11 old save written on a close day: the next quarter (previous row on the load day) is partly recorded', T, lastD(T)) }
  { let T = setup(); const id = T.id; waitDays(T, 20); sister(T, .3); const pend = clone(T.acq); await reload(1); oracleAfterLoad(1); T = S.co[id]; const ld = S.day;
    ok(pend && pend.aD > 0 && T.acq == null && T.acd === ld, 'SV5 export with a deal waiting (aD ' + f2(pend && pend.aD) + '): dropped on loading, ledger starts on day ' + ld);
    for (let i = 0; i < 10; i++) step(); sister(T, .2); nextClose(T); stmtCheck('SV5 the first real quarter after an export is partly recorded (only the deal after loading is used)', T, lastD(T));
    ok(!cfNote(T).includes('기록 전 분기(' + qLab(fqL(T)[fqL(T).length - 1].d)), 'SV5 the rebuilt quarters are listed as not recorded, the real one as partly recorded') }
  { let T = setup(); const t = cfTab(T); ok(!/◐|부분 기록|기록 전 분기/.test(t.h) && T.acd === -721, 'SV6 new game: no ◐ and no ledger footnote in a fresh company\'s tab') }
  { let T = setup(); const id = T.id; waitDays(T, 20); sister(T, .3); const acq0 = clone(T.acq); await reload(0); T = S.co[id];
    ok(JSON.stringify(T.acq) === JSON.stringify(acq0), 'SV1 autosave keeps the deal waiting for the close: ' + shR(T.acq)); nextClose(T); stmtCheck('SV1 the quarter of a deal saved before its close is fully recorded', T, lastD(T)) } }

// ---- natural play: every close of every company, ledger = oracle; nothing absorbed outside the measured callers ----
console.log('\n-- P2 natural play, 3 seeds x 720 days, no player action: every close of every company compared with the measured deals');
for (const seed of [20261016, 777, 12345]) { startWorld(seed); const st0 = Object.assign({}, STAT), badRows = [], evRows = [];
  NATCHK = (c, d) => { if (c.fq.length < 2) return; const ok0 = fails; const good = stmtCheck('N' + seed + ' ' + c.tk + ' row ' + d, c, d, { quiet: 1, noUI: 1 }); if (!good) badRows.push(c.tk + ' ' + d); else if (c.acr && c.acr[d]) evRows.push(c.tk + ' ' + d) };
  for (let d = 0; d < 720; d++) { for (const c of S.co) if (!c.dead) trace(c); step() } NATCHK = null;
  ok(!badRows.length, 'N' + seed + ' statement: every close row with a previous row (' + (STAT.rows - st0.rows) + ' rows, ' + (STAT.tracer - st0.tracer) + ' compared with the raw debt writes, max |차입 증감 - raw real borrowing| ' + f2(STAT.maxB) + ') matches the measured amounts; rows with a FIN-CF-03A record: ' + evRows.length + (evRows.length ? ' (' + evRows.slice(0, 6).join(', ') + ')' : '') + (badRows.length ? ' | failing ' + badRows.slice(0, 4).join(', ') : ''));
  const lab = EVT.reduce((o, e) => (o[e.label] = (o[e.label] || 0) + 1, o), {}), alive = S.co.filter(c => !c.dead).map(c => c.id);
  ok(!MIS.length, 'N' + seed + ' ' + Object.entries(lab).map(([k, v]) => k + ' ' + v).join(', ') + ': every close of every company (' + S.co.length + ' companies) confirmed exactly the measured amounts' + (MIS.length ? ' | ' + MIS.slice(0, 3).join('; ') : ''));
  ok(!EVT.some(e => e.label === 'UNMEASURED'), 'N' + seed + ' no absorb outside maTick / G.merge / G.liq / offer');
  ledgerCheck('N' + seed + ' end state (pending and kept records of the ' + alive.length + ' live companies)', alive) }

// ---- GUARD: every debt write in the source is classified; the non-cash ones have their record right there ----
console.log('\n-- P2 GUARD debt writes in the source');
{ const fs = require('fs'), path = require('path'), dir = path.join(process.env.TESTS_DIR, '..', 'src');
  const code = t => t.split('\n').map(l => /^\s*\/\//.test(l) ? ' '.repeat(l.length) : l).join('\n');
  // [class, signature around the write]; 'cash' = real borrowing / repayment (stays in 차입 증감), 'ledger' = non-cash with its record,
  // 'gr' = banks' / insurers' growth (FIN-CF-03B, stays), 'norow' = before any row or on a company that is being removed
  const KNOWN = [['ledger absorb', /a\.D\+=t\.D/, /acqAdd\(a,ki\?"iD":"aD",t\.D\)/], ['ledger LBO', /const lb=P\*\.7;c\.D\+=lb;acqAdd\(c,"lD",lb\)/], ['ledger hidden debt', /const hx=c\.A\*\.1;c\.D\+=hx;acqAdd\(c,"hD",hx\)/],
    ['ledger FIN-CF-01 relief', /c\.D=Math\.max\(0,c\.A\+c\.cs\+c\.gw\+pfv\(c\)-\.15\*c\.A\);c\.ncq=/], ['gr FIN-CF-03B', /if\(c\.kd\)c\.D\+=gr/],
    ['cash overflow', /if\((\w+)\.cs<0\)\{\1\.D-=\1\.cs;\1\.cs=0\}/], ['cash borrow', /c\.D\+=x;c\.cs\+=x;L\(c\.tk\+" 은행 차입/], ['cash repay', /c\.cs-=x;c\.D-=x;L\(c\.tk\+" 부채 상환/],
    ['cash special-dividend borrowing', /c\.D\+=a;payDiv\(c,a\)/], ['cash bond issue', /c\.D\+=x;const r=rating\(c\);c\.cs\+=x\*\.985/], ['cash bond call', /c\.D-=face;/],
    ['cash advance', /c\.pa=\(c\.pa\|\|0\)\+x;c\.D\+=x;c\.cs\+=x/], ['cash advance repaid', /c\.pa-=x;c\.D-=x;c\.cs-=x/], ['cash advance', /T\.pa=\(T\.pa\|\|0\)\+x;T\.D\+=x;T\.cs\+=x/], ['cash advance repaid', /Fc\.pa-=y;Fc\.D-=y;Fc\.cs-=y/],
    ['cash close repayment', /c\.cs-=x;c\.D-=x\}\}\}/], ['cash loan called', /x\.D-=paid;b\.cs\+=paid/], ['cash bank run', /c\.cs-=p1;c\.A=Math\.max\(0,c\.A-rest\/\.9\);c\.D-=w/], ['cash asset sale', /c\.D-=p;c\.cs\+=r-p/],
    ['norow init cross holdings', /if\(a\.cs<x\)\{a\.D\+=x-a\.cs;a\.cs=x\}/], ['norow absorbed target', /t\.A=0;t\.cs=0;t\.D=0/], ['norow founding', /c\.D=c\.A\+c\.cs-E/], ['norow founding', /c\.cs=E-c\.A;c\.D=0|c\.cs=E\*\.15;c\.D=0/]];
  const sites = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js'))) { const t = code(fs.readFileSync(path.join(dir, f), 'utf8')); const re = /\b(\w+)\.D\s*(\+=|-=|\*=|\/=|=(?!=))/g; let m;
    while ((m = re.exec(t))) { const win = t.slice(Math.max(0, m.index - 90), m.index + 70), ln = t.slice(0, m.index).split('\n').length;
      const hit = KNOWN.filter(([, sig]) => { const r = new RegExp(sig.source, 'g'); let x; while ((x = r.exec(win))) { const at = Math.max(0, m.index - 90) + x.index; if (at <= m.index && m.index < at + x[0].length) return true } return false });
      sites.push({ f, ln, v: m[1] + '.D' + m[2], cls: hit.length === 1 ? hit[0][0] : hit.length ? 'AMBIGUOUS ' + hit.map(h => h[0]).join('/') : null, rec: hit.length === 1 && hit[0][2] ? hit[0][2].test(t.slice(m.index - 400, m.index + 400)) : true }) } }
  pre(sites.length === 47, 'GUARD the source writes a company debt D in ' + sites.length + ' places (47 on main d553d3e; a new one must be classified here)');
  for (const s of sites) ok(s.cls && !/^AMBIGUOUS/.test(s.cls) && s.rec, 'GUARD ' + s.f + ':' + s.ln + ' ' + s.v + ' -> ' + (s.cls || 'UNCLASSIFIED: is it cash? if not, it needs an acqAdd record') + (s.rec ? '' : ' (record missing next to it)'));
  const cnt = sites.reduce((o, s) => (o[(s.cls || '?').split(' ')[0]] = (o[(s.cls || '?').split(' ')[0]] || 0) + 1, o), {}); info('GUARD classes: ' + JSON.stringify(cnt));
  const absorbCalls = fs.readdirSync(dir).filter(x => x.endsWith('.js')).reduce((a, f) => a.concat([...code(fs.readFileSync(path.join(dir, f), 'utf8')).matchAll(/(?<!function )\babsorb\(([^)]*\([^)]*\)[^)]*|[^)]*)\)/g)].map(x => f + ' ' + x[0])), []);
  const WANT = ['absorb(ac,t,pay,pay)', 'absorb(a,x,q.nv,0)', 'absorb(h,c,-hv(c,100),0)', 'absorb(a,c,P,cp)'];
  ok(absorbCalls.length === 4 && absorbCalls.every(x => WANT.includes(x.split(' ')[1])), 'GUARD absorb is called in 4 places and every call passes the cash paid as its 4th argument: ' + absorbCalls.join(' | ')) }

console.log('\nerrs', errs, 'fails', fails);
})().catch(e => { console.log('ERR exception ' + (e && e.stack || e)); console.log('errs', 1, 'fails', 0) });
