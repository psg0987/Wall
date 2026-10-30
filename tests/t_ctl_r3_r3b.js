// RT-PREMERGE-FIX-01-R3-R3B (Claude), written BEFORE the fix.
// C  per-SCC memory cache (global CTLC: on, size, max 128, hit/miss/evict counters, clear()). A hit must give exactly what a fresh computation
//    gives (labels, CTLQ status and possible-controller lists, CTLS entry); it is keyed by members, their stakes, the outside holders' final
//    labels, the members' previous labels and the policy version; new game / restore start empty; no autopilot or authority side effect cached.
// G  authority: G.bkSet confirm (numModal go) after control is lost; G.ev2Pick (player's own decision) after control is lost / pending.
let errs = 0, fails = 0; const ok = (x, m) => { console.log((x ? 'ok ' : 'FAIL ') + m); if (!x) fails++ }; const pre = (x, m) => { if (!x) { errs++; console.log('ERR precondition ' + m) } };
const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const world = seed => { Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; S.spd = 0; sel = -1; pg = ''; S.apAll = 0 };
const iso = c => { for (const k of Object.keys(c.own)) setOwn(c, k, 0); for (const t of Object.keys(c.pos)) setOwn(S.co[+t], 'c' + c.id, 0) };
const ords = () => S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i !== HOLD && c.bk === 0);
const C = () => typeof CTLC !== 'undefined' ? CTLC : null;
const k7 = m => { const c = i => 'c' + m[i].id, own = [{ r0: 35, r1: 35, [c(1)]: 20, [c(2)]: 10 }, { P: 40, [c(2)]: 45, [c(3)]: 15 }, { P: 15, r0: 15, r1: 25, [c(0)]: 30, [c(3)]: 15 }, { P: 20, r0: 25, [c(0)]: 10, [c(1)]: 20 }]; m.forEach((x, i) => { for (const k in own[i]) setOwn(x, k, own[i][k]) }) };
const dense = m => { for (const c of m) { setOwn(c, 'P', 40); setOwn(c, 'r0', 5); setOwn(c, 'r1', 5); for (const d of m) if (d !== c) setOwn(c, 'c' + d.id, 15) } };
// full observable outcome of one ctlAll: labels, CTLQ (status + possible controllers), CTLS without node counts
const snap = () => JSON.stringify({ ctl: S.co.map(c => c.ctl), q: (CTLQ || []).map(q => q && [q.st, q.poss]), s: (CTLS || []).map(x => [x.status, [...x.members].sort((a, b) => a - b), x.solutions == null ? null : x.solutions]) });
// run ctlAll on the same state with the cache on and off; returns both outcomes (labels restored in between)
function onOff() { const c = C(), before = S.co.map(z => z.ctl); if (c) c.on = true; S.cd = 1; ctlAll(); const a = snap(); S.co.forEach((z, k) => z.ctl = before[k]); if (c) c.on = false; S.cd = 1; ctlAll(); const b = snap(); if (c) c.on = true; return { a, b } }
const st = () => { const c = C(); return c ? { hit: c.hit, miss: c.miss, evict: c.evict, size: c.size() } : null };

// ---------- C1 repeat -> hit, identical to a fresh computation
{ world(501); const m = ords().slice(0, 4); m.forEach(iso); m.forEach(c => c.ctl = null); k7(m); ctlAll(); pre(m.every(c => c.ctl === '?'), 'C1 AMBIG SCC');
  const s0 = st(); const r = onOff(); const s1 = st(); ctlAll(); const s2 = st();
  ok(!!s0 && s2.hit > s1.hit, 'C1 same input again: cache hit (' + JSON.stringify([s0, s1, s2]) + ')'); ok(r.a === r.b, 'C1 cache on and off give the same labels, statuses and possible controllers') }
// ---------- C2 change inside the SCC -> miss and a correct result
{ world(502); const m = ords().slice(0, 4); m.forEach(iso); m.forEach(c => c.ctl = null); k7(m); ctlAll(); ctlAll(); const s0 = st(); setOwn(m[1], 'P', 41); ctlAll(); const s1 = st();
  ok(!!s0 && s1.miss > s0.miss, 'C2 a stake inside the SCC changed: miss'); setOwn(m[1], 'P', 40); const r = onOff(); ok(r.a === r.b, 'C2 cache on/off identical after the change') }
// ---------- C3 upstream label change -> miss and a correct result
{ world(503); const L = ords(), m = L.slice(0, 4), u = L[10]; [...m, u].forEach(iso); m.forEach(c => c.ctl = null); k7(m); setOwn(m[0], 'c' + u.id, 5); ctlAll(); ctlAll(); const s0 = st();
  setOwn(u, 'P', 60); ctlAll(); const s1 = st(); pre(mine(u), 'C3 upstream holder now controlled by P');
  ok(!!s0 && s1.miss > s0.miss, 'C3 the outside holder\'s final label changed (c' + u.id + ' -> P): miss'); const r = onOff(); ok(r.a === r.b, 'C3 cache on/off identical after the upstream change') }
// ---------- C4 P -> ? -> P with stakes changed and restored
{ world(504); const m = ords().slice(0, 4); m.forEach(iso); m.forEach(c => c.ctl = null); dense(m); ctlAll(); pre(m.every(mine), 'C4 P controls the dense SCC');
  const seq = []; for (const [k, v] of [['r0', 45], ['r0', 5], ['r0', 45], ['r0', 5]]) { m.forEach(c => setOwn(c, k, v)); const r = onOff(); seq.push([r.a === r.b, m.map(c => c.ctl).join('')]) }
  ok(seq.every(x => x[0]), 'C4 every step identical with cache on/off: ' + JSON.stringify(seq.map(x => x[1])));
  ok(seq[0][1] !== 'PPPP' && seq[1][1] === 'PPPP' && seq[2][1] !== 'PPPP' && seq[3][1] === 'PPPP', 'C4 control follows the stakes each time (no authority kept from the cache): ' + seq.map(x => x[1]).join(' -> ')) }
// ---------- C5 new game and restore start with an empty cache
{ world(505); const m = ords().slice(0, 4); m.forEach(iso); m.forEach(c => c.ctl = null); k7(m); ctlAll(); ctlAll(); const c = C(); pre(!!c && c.size() > 0, 'C5 cache filled');
  world(505); ok(!!c && c.size() === 0 || (c && c.size() <= 1), 'C5 new game: cache emptied (size ' + (c && c.size()) + ')');
  const m2 = ords().slice(0, 4); m2.forEach(iso); m2.forEach(z => z.ctl = null); k7(m2); ctlAll(); const o = JSON.parse(JSON.stringify(S)); const h0 = c ? c.hit : 0; S = migrate(o); v8fix();
  ok(!!c && c.hit === h0, 'C5 restore: the silent re-check uses no entry made before the restore (hits ' + h0 + ' -> ' + (c && c.hit) + ')') }
// ---------- C6 SCC composition change and a member's death
{ world(506); const L = ords(), m = L.slice(0, 4), x = L[20]; [...m, x].forEach(iso); m.forEach(c => c.ctl = null); k7(m); ctlAll(); ctlAll();
  setOwn(x, 'c' + m[0].id, 30); setOwn(m[0], 'c' + x.id, 10); let r = onOff(); ok(r.a === r.b, 'C6 a fifth company joins the cycle: cache on/off identical');
  m[2].dead = 1; r = onOff(); ok(r.a === r.b && m[2].ctl === null, 'C6 a member dies: cache on/off identical, the dead company has no controller') }
// ---------- C7 128 entries max, least recently used evicted
{ world(507); const L = ords(); const pairs = []; for (let k = 0; k < 130; k++) { const a = L[2 * k], b = L[2 * k + 1]; if (!a || !b) break; pairs.push([a, b]) } pre(pairs.length === 130, 'C7 130 pairs');
  const c = C(); if (c) c.clear(); for (const [a, b] of pairs) { iso(a); iso(b) } S.co.forEach(z => { if (!z.dead) z.ctl = null });
  for (const [a, b] of pairs) { setOwn(a, 'P', 30); setOwn(b, 'c' + a.id, 60); setOwn(a, 'c' + b.id, 25) } ctlAll();
  ok(!!c && c.size() === 128 && c.evict >= 2, 'C7 130 cyclic SCCs: cache holds 128, evicted ' + (c && c.evict)) }
// ---------- C8 lockstep worlds with the cache on and off: whole game state equal after 240 active days
{ const run = on => { world(508); const c = C(); if (c) { c.clear(); c.on = on } const L = ords();
    for (let d = 0; d < 240; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null; if (d % 6 === 0) { const a = L[(d * 7) % L.length], b = L[(d * 13 + 5) % L.length]; if (a !== b && !a.dead && !b.dead && !a.priv && !b.priv) { if (pub(b) > 15) setOwn(b, 'c' + a.id, 12 + d % 10); if (pub(a) > 15) setOwn(a, 'c' + b.id, 10 + d % 9); if (pub(a) > 25) setOwn(a, 'P', 21 + d % 20); ctlAll() } } }
    if (c) c.on = true; return [JSON.stringify(S), S.co.filter(z => z.ctl === '?').length, S.co.filter(mine).length, c ? c.hit : 0] };
  const a = run(true), b = run(false); ok(!!C() && a[0] === b[0], 'C8 240 active days (cross holdings every 6 days): whole state identical with cache on and off (pending ' + a[1] + ', mine ' + a[2] + ', hits ' + a[3] + ')') }
// ---------- C9 a hit returns copies: changing CTLQ after a hit does not change the cache
{ world(509); const m = ords().slice(0, 4); m.forEach(iso); m.forEach(c => c.ctl = null); k7(m); ctlAll(); ctlAll(); const p = CTLQ[m[0].id].poss; if (Array.isArray(p)) p.push('TAMPER'); CTLQ[m[0].id].st = 'TAMPER';
  ctlAll(); ok(CTLQ[m[0].id].st === 'AMBIG' && !(CTLQ[m[0].id].poss || []).includes('TAMPER'), 'C9 tampering with CTLQ after a hit does not leak into the next hit') }

// ---------- C10 (added after the fix) fuzz: 12 companies, random cross holdings changed 400 times; cache on/off compared after every change
{ world(510); const m = ords().slice(0, 12); m.forEach(iso); m.forEach(c => c.ctl = null); const R = mul(99), keys = ['P', 'r0', 'r1', 'r2']; let same = 0, n = 0; const seen = {};
  for (let it = 0; it < 400; it++) { const a = m[R() * 12 | 0], b = m[R() * 12 | 0]; if (a === b) continue; const k = R() < .6 ? 'c' + b.id : keys[R() * 4 | 0];
    setOwn(a, k, R() < .2 ? 0 : 5 + (R() * 9 | 0) * 5); if (held(a) > 100) setOwn(a, k, 0); const r = onOff(); n++; if (r.a === r.b) same++; for (const c of m) { const q = CTLQ[c.id]; if (q) seen[q.st] = (seen[q.st] || 0) + 1 } }
  ok(same === n && n > 300, 'C10 ' + n + ' random changes: cache on/off identical every time (' + same + '/' + n + '); statuses seen ' + JSON.stringify(seen) + '; cache hits ' + (C() && C().hit)) }

{ world(520); const all = ords().slice(0, 18); all.forEach(iso); all.forEach(c => c.ctl = null); const G = [0, 1, 2, 3, 4, 5].map(g => all.slice(3 * g, 3 * g + 3)), R = mul(77), keys = ['P', 'r0', 'r1'];
  let same = 0, n = 0; const seen = {};
  for (let it = 0; it < 600; it++) { const g = G[R() * 6 | 0], a = g[R() * 3 | 0], b = g[R() * 3 | 0]; if (a === b) continue; const k = R() < .55 ? 'c' + b.id : keys[R() * 3 | 0];
    setOwn(a, k, R() < .15 ? 0 : 10 + (R() * 9 | 0) * 5); if (held(a) > 100) setOwn(a, k, 0); const r = onOff(); n++; if (r.a === r.b) same++; for (const c of all) { const q = CTLQ[c.id]; if (q) seen[q.st] = (seen[q.st] || 0) + 1 } }
  ok(same === n && n > 350 && seen.AMBIG > 0 && seen.EXACT > 0, 'C10b 6 groups of 3, ' + n + ' random changes: cache on/off identical every time (' + same + '/' + n + '); statuses seen ' + JSON.stringify(seen)) }

// ---------- C11 (added after the fix) real P -> ? -> P -> ? transitions, stakes put back to the exact earlier values each time
{ world(511); const m = ords().slice(0, 4); m.forEach(iso); m.forEach(c => c.ctl = null); const put = f => { m.forEach(iso); f(m) }; put(dense); ctlAll(); pre(m.every(mine), 'C11 P controls first');
  const seq = []; let hits0 = C().hit; for (const f of [k7, dense, k7, dense, k7]) { put(f); const r = onOff(); seq.push([r.a === r.b, m.map(c => c.ctl === 'P' ? 'P' : c.ctl === '?' ? '?' : 'x').join('')]) }
  const hits = C().hit - hits0;
  ok(seq.every(x => x[0]) && seq.map(x => x[1]).join(' ') === '???? PPPP ???? PPPP ????', 'C11 P->?->P->?->P->? identical with cache on/off and labels follow the stakes: ' + seq.map(x => x[1]).join(' -> ') + ' (cache hits during the steps ' + hits + ')') }

// ---------- G1 G.bkSet confirmed after control of the bank was lost
{ world(511); const b = S.co.find(c => !c.dead && c.kd === 1 && !c.priv); setOwn(b, 'P', 60); ctlAll(); pre(mine(b), 'G1 my bank'); const k = Object.keys(b.ba)[0], ba = JSON.stringify(b.ba);
  G.bkSet(b.id, k); const o = NMd; pre(!!o && typeof o.go === 'function', 'G1 dialog opened'); setOwn(b, 'P', 0); ctlAll(); if (o) o.go(Math.round(b.ba[k] * 100) === 30 ? 40 : 30); mdl = null;
  ok(JSON.stringify(b.ba) === ba, 'G1 bkSet confirmed after control was lost: asset mix unchanged') }
// ---------- G2 G.ev2Pick: the player's decision after control was lost / became pending
for (const how of ['lost', 'pending']) { world(512 + (how === 'lost' ? 0 : 1)); const L = ords(), c = L[3], y = L[300]; iso(c); setOwn(c, 'P', 60); ctlAll(); pre(mine(c), 'G2 my company');
  const e = EV2.find(z => z.id !== 'offer' && z.el(c) && z.o && z.o.length) || EV2.find(z => z.id !== 'offer'); const x = e.mk(c); S.ev2 = { id: e.id, c: c.id, x, v: 0, m: 'ceo' };
  let ran = 0; const go0 = e.go; e.go = function () { ran++; return go0.apply(this, arguments) };
  if (how === 'lost') { setOwn(c, 'P', 0); ctlAll() } else { iso(c); iso(y); setOwn(y, 'c' + c.id, 60); setOwn(c, 'c' + y.id, 60); c.ctl = y.ctl = null; ctlAll(); pre(c.ctl === '?', 'G2 pending') }
  G.ev2Pick(e.o[0][1]); e.go = go0; mdl = null; ok(ran === 0 && !S.ev2, 'G2 ev2Pick after control ' + how + ': the decision is not carried out (ran ' + ran + ') and the event is closed') }
console.log('errs', errs, 'fails', fails);
