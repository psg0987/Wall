// RT-PREMERGE-FIX-01-R2 (Claude): GPT-6 review counterexample P1, reproduced with the real game engine's ctlAll(). Test only — no game code change.
// Holdings (rest held by ordinary shareholders):  A: P 50, B 35, r1 15   B: C 20, r1 30, A 25   C: A 50, P 5
// A, B, C are three real companies made free of every other holding (no owners, no stakes in others). Roles go to ascending ids A < B < C
// (sweep order = id order) for the main cases; X0 records the other five orders.
// Expected (independent fixed-point check, X1): the only state where every company's controller equals what its holders give is [P, P, P].
// X2 start [null, null, null] -> ctlAll must give [P, P, P];  X3 start [P, P, P] -> [P, P, P];  X4 autopilot: with S.apAll ON, the three new
// P-controlled companies are ON with one decision each.  X5 the same holdings through the old 7-sweep loop (main b421980 / UX 9999851), recorded.
let errs = 0, fails = 0; const ok = (x, m) => { console.log((x ? 'ok ' : 'FAIL ') + m); if (!x) fails++ }; const info = m => console.log('info ' + m);
const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const world = seed => { Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; S.spd = 0; sel = -1; pg = ''; S.apAll = 0 };
const CALLS = []; const a0 = autop; autop = function (c) { CALLS.push(c.id); return a0(c) };
const isolate = c => { for (const k of Object.keys(c.own)) setOwn(c, k, 0); for (const t of Object.keys(c.pos)) setOwn(S.co[+t], 'c' + c.id, 0) };
const ROLES = ['A', 'B', 'C'];
const HOLD_SPEC = { A: { P: 50, B: 35, r1: 15 }, B: { C: 20, r1: 30, A: 25 }, C: { A: 50, P: 5 } };
// set up: three isolated ordinary companies; order = which role gets the lowest / middle / highest id
function setup(seed, order = ['A', 'B', 'C']) { world(seed);
  const L = S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i !== HOLD && c.bk === 0 && c.ctl !== 'P'), three = [L[40], L[200], L[360]];
  three.forEach(isolate); three.sort((a, b) => a.id - b.id); const R = {}; order.forEach((role, k) => R[role] = three[k]);
  const key = v => v === 'P' || v === 'r1' ? v : 'c' + R[v].id;
  for (const role of ROLES) for (const [h, v] of Object.entries(HOLD_SPEC[role])) setOwn(R[role], key(h), v);
  const name = v => v == null ? null : v === 'P' || v[0] === 'r' ? v : (ROLES.find(r => 'c' + R[r].id === v) || v);   // controller as A/B/C/P/r1/null
  const iso = three.every(c => Object.keys(c.pos).every(t => three.some(z => z.id === +t)) && Object.keys(c.own).every(k => k === 'P' || k === 'r1' || three.some(z => 'c' + z.id === k)));
  return { R, key, name, iso, ids: ROLES.map(r => R[r].id) } }
const state = (X) => ROLES.map(r => X.name(X.R[r].ctl));
const setState = (X, s) => ROLES.forEach((r, k) => X.R[r].ctl = s[k] == null ? null : s[k] === 'P' || s[k] === 'r1' ? s[k] : 'c' + X.R[s[k]].id);
// ---------- independent rule, written here (not the game's root/ctlAll): controller of one company from a given state of all three
function evalOne(role, st) { const g = {}; for (const [h, v] of Object.entries(HOLD_SPEC[role])) { const r = h === 'P' || h === 'r1' ? h : (st[ROLES.indexOf(h)] || h); g[r] = (g[r] || 0) + v }
  let b = null, m = 0, m2 = 0; for (const r in g) { const v = g[r]; if (v > m) { m2 = m; m = v; b = r } else if (v > m2) m2 = v } let n = m >= 20 && m > m2 + 1e-9 ? b : null; if (n === role) n = null; return n }
// ---------- X1 every combination of controllers: which are fixed points?
{ const dom = r => [null, 'P', 'r1', ...ROLES.filter(x => x !== r)], fps = []; let n = 0;
  for (const a of dom('A')) for (const b of dom('B')) for (const c of dom('C')) { n++; const st = [a, b, c]; if (ROLES.every((r, k) => evalOne(r, st) === st[k])) fps.push(st) }
  info('X1 ' + n + ' controller combinations checked with the independent rule; fixed points: ' + JSON.stringify(fps));
  ok(fps.length === 1 && JSON.stringify(fps[0]) === '["P","P","P"]', 'X1 the only fixed point is [P,P,P]');
  // the independent sweep (same order A, B, C) from [null,null,null]: the sequence of states
  let st = [null, null, null]; const seq = [JSON.stringify(st)]; for (let k = 0; k < 9; k++) { for (const r of ROLES) st[ROLES.indexOf(r)] = evalOne(r, st); seq.push(JSON.stringify(st)) }
  info('X1 independent sweeps (id order A<B<C) from [null,null,null]: ' + seq.join(' -> ')); }
// ---------- X2 start [null,null,null]
{ const X = setup(20261027); ok(X.iso, 'X2 precondition: A, B, C hold / are held only as specified (ids ' + X.ids.join(',') + ')');
  setState(X, [null, null, null]); ctlAll(); const s1 = state(X); setState(X, [null, null, null]); ctlAll(); ctlAll(); const s2 = state(X);
  info('X2 actual after ctlAll from [null,null,null]: ' + JSON.stringify(s1) + ' (second call: ' + JSON.stringify(s2) + '), S.cd ' + S.cd);
  ok(JSON.stringify(s1) === '["P","P","P"]', 'X2 start [null,null,null]: expected [P,P,P], actual ' + JSON.stringify(s1)); }
// ---------- X3 start [P,P,P]
{ const X = setup(20261027); setState(X, ['P', 'P', 'P']); ctlAll(); const s1 = state(X);
  info('X3 actual after ctlAll from [P,P,P]: ' + JSON.stringify(s1));
  ok(JSON.stringify(s1) === '["P","P","P"]', 'X3 start [P,P,P]: expected [P,P,P], actual ' + JSON.stringify(s1)); }
// ---------- X4 autopilot impact (S.apAll ON)
{ const X = setup(20261027); S.apAll = 1; X.R.A.ap = X.R.B.ap = X.R.C.ap = 0; setState(X, [null, null, null]); CALLS.length = 0; ctlAll();
  const r = ROLES.map(k => ({ ctl: X.name(X.R[k].ctl), mine: mine(X.R[k]), ap: X.R[k].ap || 0, calls: CALLS.filter(id => id === X.R[k].id).length }));
  info('X4 S.apAll ON, start [null,null,null]: ' + JSON.stringify(r));
  ok(r.every(z => z.mine && z.ap === 1 && z.calls === 1), 'X4 expected: all three P-controlled, 자동 경영 ON, one decision each; actual mine ' + r.map(z => z.mine).join('/') + ', ap ' + r.map(z => z.ap).join('/') + ', decisions ' + r.map(z => z.calls).join('/'));
  const Y = setup(20261027); S.apAll = 1; ROLES.forEach(k => Y.R[k].ap = 0); setState(Y, ['P', 'P', 'P']); CALLS.length = 0; ctlAll();
  info('X4 S.apAll ON, start [P,P,P] (already controlled, so no new control): ' + JSON.stringify(ROLES.map(k => ({ ctl: Y.name(Y.R[k].ctl), ap: Y.R[k].ap || 0, calls: CALLS.filter(id => id === Y.R[k].id).length })))); }
// ---------- X5 the old 7-sweep loop (main b421980 / UX 9999851) on the same holdings, run on a copy
{ const X = setup(20261027); const old = start => { setState(X, start); const ctl = S.co.map(c => c.dead ? null : c.ctl), rootc = k => { if (k[0] !== 'c') return k; const h = S.co[+k.slice(1)]; return h && ctl[h.id] || k };
    let it = 0, settled = false; for (; it < 7; it++) { let ch = 0; for (const c of S.co) { if (c.dead) continue; const g = {}; for (const k in c.own) { const r = rootc(k); g[r] = (g[r] || 0) + c.own[k] }
      let b = null, m = 0, m2 = 0; for (const r in g) { const v = g[r]; if (v > m) { m2 = m; m = v; b = r } else if (v > m2) m2 = v } let n = m >= 20 && m > m2 + 1e-9 ? b : null; if (n === 'c' + c.id) n = null; if (n !== ctl[c.id]) { ctl[c.id] = n; ch = 1 } } if (!ch) { settled = true; break } }
    const save = ROLES.map(r => X.R[r].ctl); ROLES.forEach(r => X.R[r].ctl = ctl[X.R[r].id]); const s = state(X); ROLES.forEach((r, k) => X.R[r].ctl = save[k]); return { s, settled } };
  for (const st of [[null, null, null], ['P', 'P', 'P']]) { const o = old(st); info('X5 old 7-sweep loop from ' + JSON.stringify(st) + ': ' + JSON.stringify(o.s) + (o.settled ? ' (settled)' : ' (not settled after 7 sweeps)')) } }
// ---------- X0 the other id orders (sweep order differs), start [null,null,null] — recorded, and compared with the fixed point
{ const perms = [['A', 'B', 'C'], ['A', 'C', 'B'], ['B', 'A', 'C'], ['B', 'C', 'A'], ['C', 'A', 'B'], ['C', 'B', 'A']], res = [];
  for (const p of perms) { const X = setup(20261027, p); setState(X, [null, null, null]); ctlAll(); res.push(p.join('<') + ': ' + JSON.stringify(state(X))) }
  info('X0 ids in order ' + res.join(' | ')); }
console.log('errs', errs, 'fails', fails);
