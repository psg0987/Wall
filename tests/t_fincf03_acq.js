// FIN-CF-03A (approved 2026-10-24, design docs/FIN-CF-03A-DESIGN-R2.md at commit 1f07f49 on branch fin-cf-03a-design-r2): the 현금흐름 tab
// must not show debt that came over without cash as borrowing, and must show the cash of an acquisition on its own rows.
//
// THE DEFECT (main d553d3e): fqDerive takes 차입 증감 = dD + R (R: FIN-CF-01 relief) with dD = the change of the recorded debt. Debt that
// grows without any cash is shown as borrowing and the plug '기타·투자 매매' takes it back with the opposite sign: the target's debt taken
// over in absorb() (sim.js, all four acquisition paths), the LBO debt G.tender puts on the target, the hidden debt hqQ finds. The cash of the
// acquisition (cash paid, the target's cash coming in) disappears in 기타·투자 매매. (Banks' / insurers' quarterly growth gr is FIN-CF-03B,
// left as it is here.)
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
function startWorld(seed) { Math.random = mulb(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; ADD = [] }
const pickTarget = skip => S.co.find(c => !c.dead && !c.kd && !c.priv && !mine(c) && !c.own.P && c.bk === 0 && c.A > 3000 && !(skip || []).includes(c.id));
function nextClose(T) { const l0 = T.fq[T.fq.length - 1]; for (let i = 0; i < 400 && !T.dead; i++) { step(); if (T.fq[T.fq.length - 1] !== l0) return true } return false }
const daysToClose = T => 90 - ((S.day - T.fq[T.fq.length - 1][0]) % 90);
const waitDays = (T, n) => { const w = Math.max(0, Math.min(n, daysToClose(T) - 1)); for (let i = 0; i < w; i++) step() };
const lastRows = T => { const L = fqL(T); return { q: L[L.length - 1], p: L[L.length - 2], L } };
const rowDays = T => T.fq.map(r => r[0]);
const reload = async strip => { const txt = await packS(strip), s = await loadStr(txt); S = s; v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null; return txt };
// a save written before FIN-CF-03A: the company objects simply have no acq / acr / acd
const legacy = async strip => { const raw = clone(S); for (const x of raw.co) { delete x.acq; delete x.acr; delete x.acd; if (strip) delete x.fq } if (strip) delete raw.IX; S = migrate(raw); v8fix(); S.bgs = 0; col(); secUpd(); sel = -1; pg = ''; mdl = null };
// every acqAdd call (the game's and the test's), so the expected confirmed record of a close is built from the calls, not from acr
{ const a0 = acqAdd; acqAdd = function (c, k, x) { if (c && x && isFinite(x)) ADD.push({ id: c.id, k, x, day: S.day, tk: c.tk }); return a0(c, k, x) } }
const callsBetween = (id, d0, d1) => { const r = zero(); for (const a of ADD) if (a.id === id && a.day > d0 && a.day <= d1) r[a.k] += a.x; return r };
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

console.log('\nerrs', errs, 'fails', fails);
})().catch(e => { console.log('ERR exception ' + (e && e.stack || e)); console.log('errs', 1, 'fails', 0) });
