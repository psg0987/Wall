// RT-PREMERGE-FIX-01 regression tests (Claude), written BEFORE the fix. On the UX branch 9999851 the K1-K4, K7, F1-F3 and U1-U3 checks fail.
// K  control calculation (ctlAll): one call settles any chain depth; holding cycles end in a stable state; same result as the old 7-sweep loop
//    whenever that loop had settled (K0 oracle); loss / regain of a whole chain in one call; banks and holding companies in a chain keep their rule.
// F  founding (G.fdGo) with 'new control auto' (S.apAll) ON keeps the founder's preset and leaves 자동 경영 OFF; an explicit ON then applies
//    the existing rule; acquiring an existing company still gets the rule at once.
// R  regain policy record (unchanged policy, written down): what happens to 자동 경영 when control is lost and regained.
// U  the 자동경영 관리 page and settings say that 전체 ON/OFF acts on the companies held now, and S.apAll on companies controlled later.
let errs = 0, fails = 0; const ok = (x, m) => { console.log((x ? 'ok ' : 'FAIL ') + m); if (!x) fails++ };
const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const world = seed => { Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; S.spd = 0; sel = -1; pg = ''; S.apAll = 0 };
const CALLS = []; const a0 = autop; autop = function (c) { const x = { id: c.id, r: rating(c), ni: c.ni, A: c.A, cs: c.cs, nol: c.nol, kd: c.kd, i: c.i, dg: S.dg[c.i], cg: S.cg[c.i], ps0: c.ps }; const o = a0(c); x.got = { g: c.g, pay: c.pay, sweep: c.sweep, ps: c.ps }; CALLS.push(x); return o };
const TOASTS = []; const t0 = toast; toast = m => { TOASTS.push(String(m)); return t0(m) };
function ref(x) { // existing rule, written here from RISK-06 A4R (ordinary) / A2 (bank, insurer) / HOLD 0-0-0, not read from the game
  const { r, ni, A, cs, nol, kd, i, dg, cg, ps0 } = x, roa = ni * 4 / Math.max(1, A), gap = kd ? 0 : dg - cg;
  let s = { g: r >= 4 ? 0 : roa > .1 && r <= 2 && gap > -.01 ? .1 : .04, pay: r >= 4 || nol > A * .05 ? 0 : .3, sweep: r >= 3 ? 2 : 1, ps: kd ? ps0 : (r <= 3 && roa > .06 ? 1 : 0) };
  if (!kd && i !== HOLD) { const tc = A * .06, halt = r >= 4 || (r === 3 && (ni <= 0 || cs < tc * .5 || gap < -.02)) || (ni < 0 && cs < tc);
    s = { g: halt ? 0 : roa > .1 && r <= 2 && gap > -.01 ? .1 : .04, pay: (r >= 4 || ni <= 0 || nol > A * .05 || (r === 3 && cs < tc)) ? 0 : r === 3 ? .15 : .3, sweep: r >= 3 || ni <= 0 ? 2 : 1, ps: r <= 3 && roa > .06 && (r <= 2 || cs >= tc * .5) ? 1 : 0 } }
  if (i === HOLD) s = { ...s, g: 0, ps: 0, pay: 0 }; return s }
const same = (a, b) => a.g === b.g && a.pay === b.pay && a.sweep === b.sweep && a.ps === b.ps;
const ordin = () => S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i !== HOLD && c.bk === 0 && c.ctl !== 'P');
const isolate = c => { for (const k of Object.keys(c.own)) setOwn(c, k, 0); for (const t of Object.keys(c.pos)) setOwn(S.co[+t], 'c' + c.id, 0) };
const pickIso = n => { const L = ordin(), out = []; for (let k = 0; k < n; k++) out.push(L[Math.floor(k * (L.length - 1) / Math.max(1, n - 1))]); out.forEach(isolate); return out.sort((a, b) => a.id - b.id) };
// reverse chain: P holds 60% of the member with the highest id, each member 60% of the next lower id (each old sweep settles one level only)
const chain = ms => { setOwn(ms[ms.length - 1], 'P', 60); for (let k = ms.length - 1; k > 0; k--) setOwn(ms[k - 1], 'c' + ms[k].id, 60) };
const callsOn = ids => CALLS.filter(x => ids.includes(x.id));
const found = (sec, fo, pre) => { S.cash = Math.max(S.cash, 1e7); const n0 = S.co.length; G.fdOpen(); G.fdSet('sec', sec); FD.pre = pre; FD.fo = fo; FD.cap = fMin(sec) * 2; G.fdGo(); mdl = null; pg = ''; return S.co.length > n0 ? S.co[S.co.length - 1] : null };
// the old loop (main b421980 / UX branch): at most 7 sweeps, run on a copy of the controller array; returns the copy and whether it had settled
function oldLoop() { const ctl = S.co.map(c => c.dead ? null : c.ctl), rootc = k => { if (k[0] !== 'c') return k; const h = S.co[+k.slice(1)]; return h && ctl[h.id] || k };
  for (let it = 0; it < 7; it++) { let ch = 0; for (const c of S.co) { if (c.dead) continue; const g = {}; for (const k in c.own) { const r = rootc(k); g[r] = (g[r] || 0) + c.own[k] }
    let b = null, m = 0, m2 = 0; for (const r in g) { const v = g[r]; if (v > m) { m2 = m; m = v; b = r } else if (v > m2) m2 = v } let n = m >= 20 && m > m2 + 1e-9 ? b : null; if (n === 'c' + c.id) n = null; if (n !== ctl[c.id]) { ctl[c.id] = n; ch = 1 } } if (!ch) return { ctl, settled: true } }
  return { ctl, settled: false } }

// ---------- K0 oracle: wherever the old loop settled, the new ctlAll gives the same controllers
{ let cmp = 0, eq = 0, uns = 0; for (const seed of [11, 22, 33]) { world(seed); const L = ordin();
    for (let d = 0; d < 240; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null;
      if (d % 8 === 0) { const a = L[(d * 7 + seed) % L.length], b = L[(d * 13 + seed * 3) % L.length]; if (!a.dead && !a.priv) setOwn(a, 'P', Math.min(pub(a) + (a.own.P || 0) - 1, 21 + d % 30)); if (a !== b && !a.dead && !b.dead && !b.priv && pub(b) > 15) setOwn(b, 'c' + a.id, 12 + d % 10) }
      if (d % 4 === 0) { const o = oldLoop(); ctlAll(); if (o.settled) { cmp++; if (S.co.every((c, k) => c.ctl === o.ctl[k])) eq++ } else uns++ } } }
  ok(cmp >= 150 && eq === cmp, `K0 ${cmp} real states where the old 7-sweep loop settled: new ctlAll gives the same controllers in ${eq} (old loop unsettled in ${uns})`); }

// ---------- K1 11-level reverse chain, one call, with new-control auto ON
{ world(20261027); S.apAll = 1; const ms = pickIso(11), ids = ms.map(c => c.id); chain(ms); CALLS.length = 0; ctlAll();
  const ctl = ms.map(c => c.ctl), cl = callsOn(ids);
  ok(ms.every(mine) && S.cd === 0, 'K1 11-level reverse chain: one ctlAll makes all 11 controlled by P, S.cd 0 — controllers ' + JSON.stringify(ctl));
  ok(cl.length === 11 && new Set(cl.map(x => x.id)).size === 11 && ms.every(c => c.ap === 1), 'K1 new-control auto: 11 companies ON, one decision each (' + cl.length + ')');
  ok(cl.every(x => same(x.got, ref(x))), 'K1 every decision equals the existing rule (A4R)');
  // ---------- K2 loss of the whole chain in one call
  setOwn(ms[10], 'P', 0); ctlAll(); ok(ms.every(c => !mine(c)) && S.cd === 0, 'K2 P sells the top stake: one ctlAll removes control of all 11 — controllers ' + JSON.stringify(ms.map(c => c.ctl)));
  // ---------- K3 regain in one call (flags were left ON, option now OFF)
  S.apAll = 0; CALLS.length = 0; setOwn(ms[10], 'P', 60); ctlAll(); const c3 = callsOn(ids);
  ok(ms.every(mine) && c3.length === 11 && c3.every(x => same(x.got, ref(x))), 'K3 regain: one ctlAll gives back all 11; their kept 자동 경영 ON flags each run the rule once (' + c3.length + ')'); }

// ---------- K4 a 200-level chain and ordinary worlds: one call, time
{ world(7); const ms = pickIso(200); chain(ms); const t = Date.now(); ctlAll(); const dt = Date.now() - t;
  ok(ms.every(mine) && S.cd === 0 && dt < 3000, 'K4 200-level reverse chain settles in one call (' + dt + ' ms)');
  world(7); const t2 = Date.now(); for (let k = 0; k < 200; k++) { S.cd = 1; ctlAll() } const dt2 = Date.now() - t2; ok(dt2 < 4000, 'K4 ordinary world: 200 ctlAll calls ' + dt2 + ' ms (' + (dt2 / 200).toFixed(2) + ' ms each)');
  for (const n of [1, 25, 26, 66]) { world(20261027 + n); const L = ordin().slice(0, n); for (const c of L) setOwn(c, 'P', 60); ctlAll(); const m = S.co.filter(mine).length;
    pg = 'auto'; G.autoPage(0); const h = page(), lab = (h.match(/(\d+) \/ (\d+) 페이지/) || []).slice(1).join('/'); CALLS.length = 0; G.autoBulk(1); pg = '';
    ok(L.every(mine) && m >= n && lab === '1/' + Math.max(1, Math.ceil(m / 25)) && CALLS.length === m, `K4 ${n} companies taken: ${m} controlled (indirect included), page 1/${Math.ceil(m / 25)}, 전체 ON ${CALLS.length} decisions`) } }

// ---------- K5 pure two-company cycle, K6 cycle with P, K7 a cycle whose sweeps flip forever
{ world(5); const [a, b] = pickIso(2); setOwn(b, 'c' + a.id, 60); setOwn(a, 'c' + b.id, 60); ctlAll(); const s1 = [a.ctl, b.ctl]; ctlAll(); step(); const s2 = [a.ctl, b.ctl];
  ok(JSON.stringify(s1) === JSON.stringify(s2) && !mine(a) && !mine(b) && S.cd === 0, 'K5 A 60% of B and B 60% of A: ends, stable over calls, not P ' + JSON.stringify(s1)); }
{ world(6); const [a, b] = pickIso(2); setOwn(a, 'P', 30); setOwn(b, 'c' + a.id, 60); setOwn(a, 'c' + b.id, 25); ctlAll(); ok(mine(a) && mine(b), 'K6 P 30% of A, A 60% of B, B 25% of A: both controlled by P'); }
{ world(8); const q = pickIso(4), K = i => 'c' + q[i].id; // found by a search over random holding graphs: from 'no controller' the old sweeps flip between two states forever
  const own = [{ r0: 35, r1: 35, [K(1)]: 20, [K(2)]: 10 }, { P: 40, [K(2)]: 45, [K(3)]: 15 }, { P: 15, r0: 15, r1: 25, [K(0)]: 30, [K(3)]: 15 }, { P: 20, r0: 25, [K(0)]: 10, [K(1)]: 20 }];
  q.forEach((c, i) => { for (const k in own[i]) setOwn(c, k, own[i][k]) }); q.forEach(c => c.ctl = null); const o = oldLoop();
  ctlAll(); const s = [JSON.stringify(q.map(c => c.ctl))]; for (let k = 0; k < 5; k++) { S.cd = 1; ctlAll(); s.push(JSON.stringify(q.map(c => c.ctl))) }
  ok(!o.settled, 'K7 the old 7-sweep loop does not settle this cycle (precondition)');
  ok(new Set(s).size === 1 && S.cd === 0, 'K7 new ctlAll ends and gives the same controllers on 6 calls in a row ' + s[0] + (new Set(s).size > 1 ? ' then ' + [...new Set(s)].slice(1).join(' ') : ''));
  ok(q.every(c => !mine(c)), 'K7 no company of the flipping cycle is counted as P-controlled'); }

// ---------- K8 a dead company in a chain, K9 bank / insurer / holding company in a chain
{ world(9); const ms = pickIso(5); chain(ms); ms[2].dead = 1; ctlAll(); ok(ms[2].ctl === null && mine(ms[4]) && mine(ms[3]) && !mine(ms[1]) && !mine(ms[0]), 'K8 dead middle company: its controller null, the chain stops below it ' + JSON.stringify(ms.map(c => c.ctl))); }
{ world(10); const h = found(HOLD, 'P', 1); const bk = S.co.find(c => !c.dead && c.kd === 1 && !c.priv), ins = S.co.find(c => !c.dead && c.kd === 2 && !c.priv), [o] = pickIso(1); [bk, ins].forEach(isolate);
  S.apAll = 1; CALLS.length = 0; setOwn(ins, 'c' + h.id, 60); setOwn(bk, 'c' + ins.id, 60); setOwn(o, 'c' + bk.id, 60); ctlAll(); const cl = callsOn([bk.id, ins.id, o.id]);
  ok(h && mine(h) && [bk, ins, o].every(mine) && cl.length === 3 && cl.every(x => same(x.got, ref(x))), 'K9 founded HOLD -> insurer -> bank -> ordinary, option ON: all controlled in one call, decisions A2 / A2 / A4R ' + cl.map(x => (x.kd ? 'kd' + x.kd : 'ord') + JSON.stringify(x.got)).join(' '));
  CALLS.length = 0; G.ap(h.id); ok(h.ap === 1 && CALLS.length === 1 && CALLS[0].got.g === 0 && CALLS[0].got.pay === 0 && CALLS[0].got.ps === 0, 'K9 explicit ON on the HOLD: 0 / 0 / 0'); }

// ---------- F founding keeps the founder's preset
{ world(21); S.apAll = 1; const sec = ordin()[0].i; CALLS.length = 0; const c = found(sec, 'P', 0);
  ok(c && mine(c) && c.ap === 0 && c.g === .2 && c.ps === (isInd(sec) ? 2 : 0) && !CALLS.some(x => x.id === c.id), 'F1 founding with new-control auto ON: 자동 경영 stays OFF, preset kept (g ' + (c && c.g) + ', ps ' + (c && c.ps) + '), no decision run');
  CALLS.length = 0; G.ap(c.id); ok(c.ap === 1 && CALLS.length === 1 && same(CALLS[0].got, ref(CALLS[0])), 'F1 explicit 자동 경영 ON afterwards: the existing rule once ' + JSON.stringify(CALLS[0] && CALLS[0].got)); }
{ world(22); const x = ordin()[5]; setOwn(x, 'P', 60); ctlAll(); x.cs = Math.max(x.cs, 1e6); S.apAll = 1; const sec = ordin()[1].i; CALLS.length = 0; const c = found(sec, x.id, 0);
  ok(c && mine(c) && c.own['c' + x.id] === 100 && c.ap === 0 && c.g === .2 && !CALLS.some(z => z.id === c.id), 'F2 founding through a controlled company (indirect control) with the option ON: preset kept, OFF, no decision'); }
{ world(23); S.apAll = 1; CALLS.length = 0; const c = found(12, 'P', 0);
  ok(c && mine(c) && c.kd === 1 && c.ap === 0 && c.g === .05 && !CALLS.some(z => z.id === c.id), 'F3 founding a bank with the option ON: preset g .05 kept, OFF, no decision');
  CALLS.length = 0; G.ap(c.id); ok(CALLS.length === 1 && same(CALLS[0].got, ref(CALLS[0])), 'F3 explicit ON on the founded bank: A2 rule'); }
{ world(24); S.apAll = 1; S.cash = 1e8; const z = ordin().filter(c => pub(c) > 70)[0]; CALLS.length = 0; G.buy(z.id, 60); const cl = CALLS.filter(x => x.id === z.id);
  ok(mine(z) && z.ap === 1 && cl.length === 1 && same(cl[0].got, ref(cl[0])), 'F4 buying 60% of an existing company with the option ON: ON and the rule at once (unchanged)'); }
{ world(25); S.apAll = 1; const c = found(ordin()[0].i, 'P', 0); setOwn(c, 'P', 0); ctlAll(); CALLS.length = 0; setOwn(c, 'P', 100); ctlAll();
  ok(mine(c) && c.ap === 1 && CALLS.filter(x => x.id === c.id).length === 1, 'F5 a founded company lost and controlled again later counts as an acquisition: ON, one decision'); }

// ---------- R regain policy record (unchanged)
for (const all of [0, 1]) { world(30 + all); S.apAll = all; const [x] = pickIso(1); setOwn(x, 'P', 60); ctlAll(); x.ap = 0; setOwn(x, 'P', 0); ctlAll(); CALLS.length = 0; setOwn(x, 'P', 60); ctlAll();
  ok(all ? x.ap === 1 && CALLS.length === 1 : x.ap === 0 && CALLS.length === 0, `R1 option ${all ? 'ON' : 'OFF'}: a manually OFF company that loses and regains control is ${all ? 'ON again with one decision' : 'still OFF, no decision'}`) }
{ world(32); S.apAll = 0; const [x] = pickIso(1); setOwn(x, 'P', 60); ctlAll(); x.ap = 1; setOwn(x, 'P', 0); ctlAll(); CALLS.length = 0; setOwn(x, 'P', 60); ctlAll(); ok(x.ap === 1 && CALLS.length === 1, 'R2 option OFF, flag left ON while not controlled: regained, decision at once'); }
{ world(33); S.apAll = 1; const [x] = pickIso(1); setOwn(x, 'P', 60); ctlAll(); x.ap = 0; CALLS.length = 0; for (let k = 0; k < 5; k++) { S.cd = 1; ctlAll() } for (let d = 0; d < 120; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null }
  ok(!mine(x) || (x.ap === 0 && !CALLS.some(z => z.id === x.id)), 'R3 option ON, manual OFF kept while control is kept (ctlAll x5, 120 days)'); }

// ---------- U wording: 전체 ON/OFF = companies held now; the option = companies controlled later
{ world(40); const L = ordin().slice(0, 3); L.forEach(c => setOwn(c, 'P', 60)); ctlAll(); const n = S.co.filter(mine).length;
  for (const all of [1, 0]) { S.apAll = all; pg = 'auto'; G.autoPage(0); const h = page(); pg = '';
    ok(h.includes(`현재 지배 중인 ${n}개 회사에만 적용`) && h.includes('앞으로 새로 지배하는 회사: 자동경영 ' + (all ? '켜짐' : '꺼짐')) && h.includes('G.apAll()') && h.includes('직접 설립한 회사는') && h.includes('지배권을 잃었다가 다시 얻으면'),
      'U1 자동경영 관리 page, option ' + (all ? 'ON' : 'OFF') + ': bulk scope (held now), option state + toggle, founding and regain notes') }
  S.apAll = 1; pg = 'set'; const st = page(); pg = ''; ok(st.includes('앞으로 새로 지배하는 회사 자동 경영: 켜짐') && !st.includes('새로 지배한 회사 자동 경영'), 'U2 settings button names the option as for companies controlled from now on');
  TOASTS.length = 0; G.autoBulk(0); ok(TOASTS.some(t => /지배 회사 \d+곳 자동경영 꺼짐/.test(t) && t.includes('앞으로 새로 지배하는 회사는 자동경영이 켜집니다')), 'U3 전체 OFF with the option ON: the toast says companies controlled later will still be ON — ' + TOASTS.slice(-1)[0]); }
console.log('errs', errs, 'fails', fails);
