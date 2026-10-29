// RT-PREMERGE-FIX-01-R3-R2 (Claude), written BEFORE the fix.
// B  search budget must not depend on processing order: per cyclic SCC a fixed limit min(5000, floor(50000 / number of cyclic SCCs)), the DFS
//    node count planned before searching (members enumerated by candidate-set size), APPROX when the plan exceeds the limit. Same holdings under
//    different company numberings -> same EXACT/APPROX statuses and the same P control (incl. the 20-SCC counterexample of R3-R1).
// L  G.lbuy: a pending (ctl "?") selling bank makes no autonomous loan sale (neither when opening nor at confirm).
// F  pending company: no new bond issuance, no discretionary debt sweep; contractual settlement kept (bond maturity, futures margin call).
let errs = 0, fails = 0; const ok = (x, m) => { console.log((x ? 'ok ' : 'FAIL ') + m); if (!x) fails++ }; const pre = (x, m) => { if (!x) { errs++; console.log('ERR precondition ' + m) } };
const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const world = seed => { Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; S.spd = 0; sel = -1; pg = ''; S.apAll = 0 };
const iso = c => { for (const k of Object.keys(c.own)) setOwn(c, k, 0); for (const t of Object.keys(c.pos)) setOwn(S.co[+t], 'c' + c.id, 0) };
const ords = () => S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i !== HOLD && c.bk === 0);
const pend = (x, y) => { iso(x); iso(y); setOwn(y, 'c' + x.id, 60); setOwn(x, 'c' + y.id, 60); x.ctl = y.ctl = null; ctlAll(); return x.ctl === '?' && y.ctl === '?' };
const closeMdl = () => { mdl = null; mcb = null };
// G groups of 4 companies, each a dense cycle (P p%, r0 r%, r1 r%, q% from each other member) -> 7 candidates per member, product 2401, 2801 DFS nodes.
// numbering 'A' = consecutive ids, 'B' = spread in reverse, 'C' = interleaved. Returns per group: statuses and number of P-controlled members.
function dense(G, numbering, P, r, q) { world(7); const L = ords().slice(0, 4 * G); L.forEach(iso); L.forEach(c => c.ctl = null);
  const pick = numbering === 'A' ? g => L.slice(4 * g, 4 * g + 4) : numbering === 'B' ? g => [0, 1, 2, 3].map(k => L[4 * G - 1 - (g + G * k)]) : (() => { const N = 4 * G, gcd = (a, b) => b ? gcd(b, a % b) : a, mul = [37, 31, 29, 23, 13, 11, 7, 3].find(x => gcd(x, N) === 1 && x % N !== 1); return g => [0, 1, 2, 3].map(k => L[((4 * g + k) * mul) % N]) })();   // a permutation (multiplier coprime with N)
  const groups = []; const used = new Set(); for (let g = 0; g < G; g++) { const m = pick(g); m.forEach(c => used.add(c.id)); groups.push(m) }
  if (used.size !== 4 * G) return null;
  groups.forEach((m, g) => { for (const c of m) { setOwn(c, 'P', P + g / 100); setOwn(c, 'r0', r); setOwn(c, 'r1', r); for (const d of m) if (d !== c) setOwn(c, 'c' + d.id, q) } });
  const t0 = Date.now(); ctlAll(); const ms = Date.now() - t0;
  return { ms, st: groups.map(m => [...new Set(m.map(c => CTLQ[c.id] && CTLQ[c.id].st))].join('/')), mine: groups.map(m => m.filter(mine).length), info: CTLS } }

// ---------- B1 / B2 the R3-R1 counterexample (20 dense SCCs), two variants, three numberings
for (const [tag, P, r, q] of [['B1 (no P control)', 10, 10, 20], ['B2 (P is the grounded controller)', 40, 5, 15]]) {
  const res = ['A', 'B', 'C'].map(nb => dense(20, nb, P, r, q)); pre(res.every(Boolean), tag + ' numberings valid');
  const same = res.every(x => JSON.stringify(x.st) === JSON.stringify(res[0].st) && JSON.stringify(x.mine) === JSON.stringify(res[0].mine));
  ok(same, tag + ': 20 identical-structure SCCs under 3 company numberings give the same statuses and P control — A ' + JSON.stringify(res[0].st.map(s => s[0])) + ' / B ' + JSON.stringify(res[1].st.map(s => s[0])) + ' / C ' + JSON.stringify(res[2].st.map(s => s[0])) + ' | P-controlled A ' + res[0].mine.join('') + ' B ' + res[1].mine.join('') + ' C ' + res[2].mine.join('') + ' | ms ' + res.map(x => x.ms).join('/')) }
// ---------- B3 limit and planned node count (expectations of the R3-R2 budget rule updated in R3-R3A after that rule was removed)
{ const two = dense(2, 'A', 40, 5, 15), twenty = dense(20, 'A', 40, 5, 15);
  const g2 = two.info.filter(x => x.members && x.members.length === 4), g20 = twenty.info.filter(x => x.members && x.members.length === 4);
  ok(two.st.every(s => s === 'EXACT') && g2.every(x => x.limit === 5000 && x.planned === 2801 && x.nodes === 2801), 'B3 2 cyclic SCCs: limit min(5000, 25000) = 5000, planned DFS nodes 2801 = visited, EXACT ' + JSON.stringify(g2.map(x => [x.limit, x.planned, x.nodes, x.status])));
  // RT-PREMERGE-FIX-01-R3-R3A: the R3-R2 rule (limit floor(50000/K)) was removed in R3-R3; every cyclic SCC has its own 5000-node limit.
  ok(twenty.st.every(s => s === 'EXACT') && g20.every(x => x.limit === 5000 && x.planned === 2801 && x.nodes === 2801), 'B3 20 cyclic SCCs: each keeps its own limit 5000 >= planned 2801 -> searched and EXACT ' + JSON.stringify(g20.slice(0, 2).map(x => [x.limit, x.planned, x.nodes, x.status])));
  // B3b/B3c (R3-R3A, opposite cases): a real search limit is still APPROX, with or without 19 unrelated dense SCCs around it
  const over = (withOthers, kind) => { world(8); const L = ords().slice(0, 90); L.forEach(iso); L.forEach(c => c.ctl = null);
    const m = kind === 'product' ? L.slice(0, 5) : L.slice(0, 9);
    if (kind === 'product') for (const c of m) { setOwn(c, 'P', 40); setOwn(c, 'r0', 4); setOwn(c, 'r1', 4); for (const d of m) if (d !== c) setOwn(c, 'c' + d.id, 13) }   // 5 members x 8 candidates: product 32768 > 4096
    else for (let i = 0; i < 9; i++) { setOwn(m[i], 'P', 30); setOwn(m[(i + 1) % 9], 'c' + m[i].id, 25) }                                                            // 9 members > 8, no previous state
    if (withOthers) for (let g = 0; g < 19; g++) { const o = L.slice(10 + 4 * g, 14 + 4 * g); for (const c of o) { setOwn(c, 'P', 40); setOwn(c, 'r0', 5); setOwn(c, 'r1', 5); for (const d of o) if (d !== c) setOwn(c, 'c' + d.id, 15) } }
    ctlAll(); const x = CTLS.find(z => z.members && z.members.includes(m[0].id)) || {}; return { st: m.map(c => (CTLQ[c.id] || {}).st), mine: m.filter(mine).length, status: x.status, product: x.product, limit: x.limit } };
  for (const kind of ['product', 'size']) { const alone = over(0, kind), crowd = over(1, kind);
    ok(alone.st.every(s => s === 'APPROX') && alone.status === 'BUDGET_EXCEEDED' && alone.mine === 0 && JSON.stringify(alone) === JSON.stringify(crowd), 'B3' + (kind === 'product' ? 'b candidate product ' + alone.product + ' > 4096' : 'c 9 members > 8') + ': APPROX (BUDGET_EXCEEDED), no P control, same with 19 unrelated SCCs around ' + JSON.stringify(alone)) } }
// ---------- B4 mixed structures (dense SCCs, 2-cycles with P, a downstream chain) under 3 numberings
{ const run = nb => { world(9); const L = ords().slice(0, 40); L.forEach(iso); L.forEach(c => c.ctl = null); const N = L.length;
    const at = nb === 'A' ? i => L[i] : nb === 'B' ? i => L[N - 1 - i] : i => L[(i * 17) % N];
    const sig = []; for (let g = 0; g < 3; g++) { const m = [0, 1, 2, 3].map(k => at(4 * g + k)); for (const c of m) { setOwn(c, 'P', 40 + g); setOwn(c, 'r0', 5); setOwn(c, 'r1', 5); for (const d of m) if (d !== c) setOwn(c, 'c' + d.id, 15) } sig.push(m) }
    for (let g = 0; g < 4; g++) { const a = at(12 + 2 * g), b = at(13 + 2 * g); setOwn(a, 'P', 30 + g); setOwn(b, 'c' + a.id, 60); setOwn(a, 'c' + b.id, 25); sig.push([a, b]) }
    const chain = [0, 1, 2, 3, 4, 5].map(k => at(20 + k)); setOwn(chain[0], 'c' + sig[0][0].id, 60); for (let k = 1; k < 6; k++) setOwn(chain[k], 'c' + chain[k - 1].id, 60); sig.push(chain);
    ctlAll(); return sig.map(m => m.map(c => (CTLQ[c.id] && CTLQ[c.id].st) + ':' + (mine(c) ? 'P' : '-')).join(',')) };
  const a = run('A'), b = run('B'), c = run('C'); ok(JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(a) === JSON.stringify(c), 'B4 mixed structures under 3 numberings: identical status and control per structure ' + JSON.stringify(a.map(s => s.split(',')[0]))) }

// ---------- L1 / L2 G.lbuy with a pending selling bank
{ world(201); const bl = S.co.filter(c => !c.dead && c.kd === 1 && !c.priv), B0 = bl[0], L0 = bl[1], x = ords()[22], q = ords()[401]; setOwn(B0, 'P', 60); ctlAll(); B0.cs = 1e7; x.ln = L0.id; x.D = Math.max(x.D, 100);
  pre(mine(B0) && pend(L0, q), 'L1 my bank and a pending selling bank'); const cs = B0.cs; closeMdl(); G.lbuy(B0.id, x.id); const f = mcb; if (f) f(); closeMdl();
  ok(x.ln === L0.id && B0.cs === cs, 'L1 lbuy from a pending selling bank: no sale (loan at ' + x.ln + ', selling bank ' + L0.id + ')') }
{ world(202); const bl = S.co.filter(c => !c.dead && c.kd === 1 && !c.priv), B0 = bl[0], L0 = bl[1], x = ords()[23], q = ords()[402]; setOwn(B0, 'P', 60); ctlAll(); B0.cs = 1e7; x.ln = L0.id; x.D = Math.max(x.D, 100);
  const cs = B0.cs; closeMdl(); G.lbuy(B0.id, x.id); const f = mcb; pre(typeof f === 'function' && !!mdl, 'L2 dialog opened while the selling bank is normal'); pre(pend(L0, q), 'L2 selling bank turned pending');
  if (f) f(); closeMdl(); ok(x.ln === L0.id && B0.cs === cs, 'L2 lbuy confirmed after the selling bank became pending: no sale') }

// ---------- F pending company finance
// F1-F3: 30 pending pairs and 30 companies without a controller, 200 days (bond issuance, debt sweep and bond maturity run at quarterly closes)
{ world(301); const L = ords(), P = [], Z = []; for (let k = 0; k < 30; k++) { const x = L[2 * k], y = L[2 * k + 1]; if (pend(x, y)) P.push(x, y) } for (const c of L.slice(100)) { if (Z.length >= 30) break; if (!c.ctl && c.ctl !== '?') Z.push(c) }
  pre(P.length >= 50 && Z.length === 30, 'F pending set ' + P.length + ', control set ' + Z.length);
  const prep = (c, k) => { c.bond = 0; c.pa = 0; c.sweep = 2; c.cs = c.A; c.D = Math.max(c.D, c.A * .5); if (k % 5 === 0) { c.bond = 20; c.cpn = 5; c.bmat = S.day + 1; c.D += 20 } };
  P.forEach(prep); Z.forEach(prep); const mat = [P.filter((c, k) => k % 5 === 0), Z.filter((c, k) => k % 5 === 0)];
  const st = { iss: [0, 0], sweep: [0, 0], days: 0 }; const D0 = new Map([...P, ...Z].map(c => [c.id, c.D])), bond0 = new Map([...P, ...Z].map(c => [c.id, c.bond]));
  for (let d = 0; d < 200; d++) { const pendNow = new Set(P.filter(c => c.ctl === '?').map(c => c.id)); const before = new Map([...P, ...Z].map(c => [c.id, [c.bond, c.D, c.cs]]));
    step(); if (S.ev2) S.ev2 = null; mdl = null; st.days++;
    for (const [grp, list] of [[0, P], [1, Z]]) for (const c of list) { if (grp === 0 && !pendNow.has(c.id)) continue; const [b, D, cs] = before.get(c.id);
      if (b === 0 && c.bond > 0) { st.iss[grp]++; if (grp === 1) { c.bond = 0; c.cpn = 0 } } if (c.D < D - Math.max(1, c.A * .2) && c.cs < cs - Math.max(1, c.A * .2)) st.sweep[grp]++ } }
  pre(st.iss[1] > 0 && st.sweep[1] > 0, 'F companies without a controller do issue bonds (' + st.iss[1] + ') and sweep cash into debt (' + st.sweep[1] + ') in 200 days');
  ok(st.iss[0] === 0, 'F1 pending companies: no new bond issued in 200 days (control set: ' + st.iss[1] + ')');
  ok(st.sweep[0] === 0, 'F2 pending companies: no discretionary debt sweep in 200 days (control set: ' + st.sweep[1] + ')');
  const pm = mat[0].filter(c => c.ctl === '?'); pre(pm.length > 0, 'F3 pending companies with a maturing bond');
  ok(pm.every(c => c.bond === 0) && mat[1].every(c => c.bond === 0), 'F3 existing bonds still mature and are repaid (contract): pending ' + pm.filter(c => c.bond === 0).length + '/' + pm.length + ', control ' + mat[1].filter(c => c.bond === 0).length + '/' + mat[1].length) }
{ world(304); const [x, y] = [ords()[32], ords()[232]]; pre(pend(x, y), 'F4 pending pair'); const k = Object.keys(FSZ).find(k => S.cm.find(m => m.k === k)); const u = 'C:' + k, m = S.day + 90;
  x.cs = 1e6; S.fx.push({ u, m, q: 1, px: futPx(u, m), mg: 1e-6, e: x.id, dep: 0 }); const cs = x.cs; futDay(); const p = S.fx.find(z => z.e === x.id);
  ok(!!p && p.mg > 1e-6 && x.cs < cs, 'F4 pending company: futures margin call still paid from its cash (contract, ' + (cs - x.cs).toFixed(3) + ')') }
console.log('errs', errs, 'fails', fails);
