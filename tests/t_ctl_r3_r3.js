// RT-PREMERGE-FIX-01-R3-R3 (Claude), written BEFORE the fix.
// D  independent per-SCC limit (5000 DFS nodes, size <= 8, product <= 4096): unrelated cycles never remove existing control
//    (17 -> 18 dense SCCs; 10 dense + 40 small cycles), 20 dense SCCs under 3 company numberings -> same result, P keeps control.
// V  fast path: a complete previous state that is a fixed point AND passes the grounded closure is kept at once, with its own status
//    EXACT_PREV_VERIFIED (never EXACT_UNIQUE); it also keeps a verified SCC larger than the search limits; an unverified previous state
//    (phantom P) never grants control.
// A  no partial update: ctlAll publishes all labels together (an exception in the middle leaves every label as it was; autopilot sees the
//    final state only).
let errs = 0, fails = 0; const ok = (x, m) => { console.log((x ? 'ok ' : 'FAIL ') + m); if (!x) fails++ }; const pre = (x, m) => { if (!x) { errs++; console.log('ERR precondition ' + m) } };
const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const world = seed => { Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; S.spd = 0; sel = -1; pg = ''; S.apAll = 0 };
const iso = c => { for (const k of Object.keys(c.own)) setOwn(c, k, 0); for (const t of Object.keys(c.pos)) setOwn(S.co[+t], 'c' + c.id, 0) };
const ords = () => S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i !== HOLD && c.bk === 0);
// dense 4-company cycle where P is the grounded controller (P 40%, r0 5, r1 5, 15% from each other member): 7 candidates each, 2801 DFS nodes
const dense = m => { for (const c of m) { setOwn(c, 'P', 40); setOwn(c, 'r0', 5); setOwn(c, 'r1', 5); for (const d of m) if (d !== c) setOwn(c, 'c' + d.id, 15) } };
const small = (a, b) => { setOwn(a, 'P', 30); setOwn(b, 'c' + a.id, 60); setOwn(a, 'c' + b.id, 25) };
const info = id => (CTLS || []).find(x => x.members && x.members.includes(id)) || {};

// ---------- D1 17 -> 18 dense SCCs
{ world(7); const L = ords().slice(0, 72); L.forEach(iso); L.forEach(c => c.ctl = null); const G = []; for (let g = 0; g < 18; g++) G.push(L.slice(4 * g, 4 * g + 4));
  for (let g = 0; g < 17; g++) dense(G[g]); ctlAll(); const m17 = G.slice(0, 17).flat().filter(mine).length; pre(m17 === 68, 'D1 17 dense SCCs: P controls all 68 (' + m17 + ')');
  dense(G[17]); ctlAll(); const keep = G.slice(0, 17).flat().filter(mine).length, g18 = G[17].filter(mine).length;
  ok(keep === 68 && g18 === 4, 'D1 an 18th unrelated dense SCC: the 17 keep P control (' + keep + '/68), the new one is solved too (' + g18 + '/4)') }
// ---------- D2 20 dense SCCs, 3 numberings
{ const run = nb => { world(7); const L = ords().slice(0, 80); L.forEach(iso); L.forEach(c => c.ctl = null); const N = 80, gcd = (a, b) => b ? gcd(b, a % b) : a, k = [37, 31, 29].find(x => gcd(x, N) === 1);
    const at = nb === 'A' ? i => L[i] : nb === 'B' ? i => L[N - 1 - i] : i => L[(i * k) % N]; const G = []; for (let g = 0; g < 20; g++) { const m = [0, 1, 2, 3].map(j => at(4 * g + j)); dense(m); G.push(m) }
    ctlAll(); return G.map(m => m.map(c => (CTLQ[c.id] || {}).st + (mine(c) ? 'P' : '-')).join(',')) };
  const a = run('A'), b = run('B'), c = run('C'); ok(JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(a) === JSON.stringify(c), 'D2 20 dense SCCs under 3 numberings: identical statuses and control');
  ok(a.every(s => s === 'EXACTP,EXACTP,EXACTP,EXACTP'), 'D2 every one of the 20 SCCs is solved: P controls all 80 (' + a.filter(s => s === 'EXACTP,EXACTP,EXACTP,EXACTP').length + '/20 groups)') }
// ---------- D3 10 dense + 40 small cycles: no influence either way
{ const build = (withDense, withSmall) => { world(9); const L = ords().slice(0, 120); L.forEach(iso); L.forEach(c => c.ctl = null); const D = [], Sm = [];
    for (let g = 0; g < 10; g++) D.push(L.slice(4 * g, 4 * g + 4)); for (let g = 0; g < 40; g++) Sm.push([L[40 + 2 * g], L[41 + 2 * g]]);
    if (withDense) D.forEach(dense); if (withSmall) Sm.forEach(p => small(p[0], p[1])); ctlAll();
    return { d: D.map(m => m.map(c => (CTLQ[c.id] || {}).st + (mine(c) ? 'P' : '-')).join(',')), s: Sm.map(p => p.map(c => (CTLQ[c.id] || {}).st + (mine(c) ? 'P' : '-')).join(',')) } };
  const onlyD = build(1, 0), onlyS = build(0, 1), both = build(1, 1);
  ok(JSON.stringify(both.d) === JSON.stringify(onlyD.d) && onlyD.d.every(s => s === 'EXACTP,EXACTP,EXACTP,EXACTP'), 'D3 10 dense SCCs give the same result with or without 40 unrelated small cycles (P controls all 40: ' + both.d.filter(s => s === 'EXACTP,EXACTP,EXACTP,EXACTP').length + '/10 groups)');
  ok(JSON.stringify(both.s) === JSON.stringify(onlyS.s), 'D3 40 small cycles give the same result with or without the dense SCCs') }

// ---------- V1 fast path status on a stable SCC
{ world(11); const L = ords().slice(0, 4); L.forEach(iso); L.forEach(c => c.ctl = null); dense(L); ctlAll(); pre(L.every(mine), 'V1 solved once (full search)');
  ctlAll(); const x = info(L[0].id); ok(x.status === 'EXACT_PREV_VERIFIED' && !x.nodes && L.every(mine), 'V1 second call: the previous state is verified and kept without search, status ' + x.status + ' (nodes ' + x.nodes + ')');
  ok(x.status !== 'EXACT_UNIQUE', 'V1 a verified previous state is not reported as EXACT_UNIQUE') }
// ---------- V2 a verified previous state keeps a 9-company SCC (over the search size limit); an unverified one does not
{ world(12); const m = ords().slice(0, 9); m.forEach(iso); for (let i = 0; i < 9; i++) { setOwn(m[i], 'P', 30); setOwn(m[(i + 1) % 9], 'c' + m[i].id, 25) } // ring: P 30% + 25% from the previous member
  m.forEach(c => c.ctl = 'P'); ctlAll(); const x = info(m[0].id);
  ok(m.every(mine) && x.status === 'EXACT_PREV_VERIFIED', 'V2 9-company ring with a verified previous state [P x9]: kept (status ' + x.status + ', P controls ' + m.filter(mine).length + '/9)');
  world(13); const n = ords().slice(0, 9); n.forEach(iso); for (let i = 0; i < 9; i++) setOwn(n[(i + 1) % 9], 'c' + n[i].id, 40); n.forEach(c => c.ctl = 'P'); ctlAll(); const y = info(n[0].id);
  ok(n.every(c => !mine(c)) && y.status !== 'EXACT_PREV_VERIFIED', 'V2b 9-company ring without any P stake but saved as [P x9] (phantom): not verified, P controls none (status ' + y.status + ')') }
// ---------- V3 phantom P from a saved state (A 40% of B, B 60% of A, labels P/P) is rejected
{ world(14); const [a, b] = [ords()[30], ords()[300]]; iso(a); iso(b); setOwn(a, 'c' + b.id, 40); setOwn(b, 'c' + a.id, 60); a.ctl = b.ctl = 'P';
  const o = JSON.parse(JSON.stringify(S)); S = migrate(o); v8fix(); const A = S.co[a.id], B = S.co[b.id];
  ok(!mine(A) && !mine(B) && info(a.id).status !== 'EXACT_PREV_VERIFIED', 'V3 restored save with phantom P labels: rejected by the grounded check (' + A.ctl + ',' + B.ctl + ')') }

// ---------- A1 no partial update when ctlAll fails in the middle
{ world(15); const L = ords().slice(0, 8); L.forEach(iso); L.forEach(c => c.ctl = null); dense(L.slice(0, 4)); dense(L.slice(4, 8)); const before = S.co.map(c => c.ctl);
  const v = L[6], own = v.own; let reads = 0; Object.defineProperty(v, 'own', { configurable: true, get() { if (++reads > 6) throw new Error('injected'); return own } });
  let threw = false; try { ctlAll() } catch (e) { threw = true } Object.defineProperty(v, 'own', { configurable: true, writable: true, enumerable: true, value: own });
  pre(threw, 'A1 ctlAll interrupted by the injected error'); ok(S.co.every((c, k) => c.ctl === before[k]), 'A1 interrupted ctlAll: no label changed (no partial update)') }
{ world(16); const L = ords().slice(0, 8); L.forEach(iso); L.forEach(c => c.ctl = null); S.apAll = 1; dense(L.slice(0, 4)); dense(L.slice(4, 8)); const seen = []; const a0 = autop;
  autop = function (c) { seen.push(L.map(z => z.ctl).join()); return a0(c) }; ctlAll(); autop = a0; const fin = L.map(z => z.ctl).join();
  ok(seen.length === 8 && seen.every(s => s === fin), 'A2 autopilot (8 decisions) only ever sees the final labels') }
console.log('errs', errs, 'fails', fails);
