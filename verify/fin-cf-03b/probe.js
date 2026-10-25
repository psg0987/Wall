// RT-FIN-CF-03B-DESIGN-01 read-only probe (main 40a4d7f). Oracle: every write of c.A / c.D / c.cs is trapped; inside earn() the growth line
// `c.A+=gr; if(c.kd) c.D+=gr; else c.cs-=...` shows as an A write of +x immediately followed by a D write of +x (financial) or a cs write (others).
// Cash debt changes = every other D write. The statement is read from fqDerive (borrow = cff + dv - iss, as the tab's 차입 증감).
(async () => {
const mulb = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const f2 = x => (Math.abs(x) < 5e-10 ? 0 : x).toFixed(2);
let inEarn = null; const LOG = new Map();
const e0 = earn; earn = function (c) { inEarn = c; try { return e0(c) } finally { inEarn = null } };
function trap(c) {
  const v = { A: c.A, D: c.D, cs: c.cs }; const rec = { w: [] }; LOG.set(c.id, rec);
  for (const k of ['A', 'D', 'cs']) Object.defineProperty(c, k, { configurable: true, enumerable: true, get() { return v[k] }, set(x) { const d = x - v[k]; if (d) rec.w.push({ k, d, e: inEarn === c, day: S.day }); v[k] = x } });
}
function quarter(c, fromDay, toDay) { // writes after the previous close (exclusive) up to and including this close's earn
  const w = LOG.get(c.id).w.filter(x => x.day > fromDay && x.day <= toDay); let g = 0, dCash = 0, gAll = [];
  for (let i = 0; i < w.length; i++) { const a = w[i], b = w[i + 1];
    if (a.e && a.k === 'A' && b && b.e && ((c.kd && b.k === 'D' && Math.abs(b.d - a.d) < 1e-9) || (!c.kd && b.k === 'cs'))) { g += a.d; gAll.push(a.d); if (c.kd) { i++; continue } } }
  for (const x of w) if (x.k === 'D') dCash += x.d; if (c.kd) dCash -= g;
  return { g, dCash };
}
function row(c, lab, opt) {
  const L = fqL(c), q = L[L.length - 1], p = L[L.length - 2], d = fqDerive(c, q, p), borrow = d.cff + q.dv - d.iss;
  const o = quarter(c, p.d, q.d), dD = q.D - p.D;
  console.log(`${lab} ${c.tk} kd ${c.kd} g ${c.g.toFixed(4)} row ${q.d} vs ${p.d} st ${d.st} | oracle: growth ${f2(o.g)} (row gr ${f2(q.gr)}), cash debt change ${f2(o.dCash)} | rows: dD ${f2(dD)} | statement: 차입 증감 ${f2(borrow)}, 재무 ${f2(d.cff)}, 기타 ${f2(d.oth)}, 현금 증감 ${f2(d.dc)} | 차입 증감 − cash debt = ${f2(borrow - o.dCash)}${opt || ''}`);
  return { o, d, q, p, borrow };
}
function world(seed) { Math.random = mulb(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; LOG.clear() }
function nextClose(c) { const l0 = c.fq[c.fq.length - 1]; for (let i = 0; i < 200 && !c.dead; i++) { step(); if (mdl) G.mk(mdl.o.length - 1); if (c.fq[c.fq.length - 1] !== l0) return true } return false }
const pick = kd => S.co.find(c => !c.dead && c.kd === kd && !c.priv && c.bk === 0);
const plain = () => S.co.find(c => !c.dead && !c.kd && !c.priv && c.bk === 0 && c.A > 3000);

console.log('[P1] natural play seed 20261016, one bank, one insurer, one ordinary company, 3 real closes each after day 0');
world(20261016); { const cs = [pick(1), pick(2), plain()]; cs.forEach(trap);
  for (const c of cs) for (let k = 0; k < 3; k++) { nextClose(c); row(c, 'P1') } }

console.log('\n[P2] bank with real cash borrowing in the same quarter: right before its close cash is pushed below zero (earn borrows it)');
world(20261016); { const c = pick(1); trap(c); nextClose(c); for (let i = 0; i < 89; i++) { step(); if (mdl) G.mk(mdl.o.length - 1) } const bk0 = c.bk, need = c.cs + 50; c.cs -= need; console.log('   cash taken out before the close: ' + f2(need)); nextClose(c); const r = row(c, 'P2', ''); console.log(`   P2 check: bk ${bk0} -> ${c.bk}, relief rlf ${JSON.stringify(c.rlf)}, nc ${f2(r.d.nc)}, ncA ${f2(r.d.ncA)}; 차입 증감 − cash debt − nc = ${f2(r.borrow - r.o.dCash - r.d.nc)} vs growth ${f2(r.o.g)}`) }

console.log('\n[P3] growth boundaries on a bank and an insurer: g = 0, g = -0.08, g = +0.6 set right before the close');
for (const [kd, g] of [[1, 0], [1, -0.08], [1, 0.6], [2, 0], [2, -0.08], [2, 0.6]]) { world(20261016); const c = pick(kd); trap(c); nextClose(c); for (let i = 0; i < 89; i++) { step(); if (mdl) G.mk(mdl.o.length - 1) } c.g = g; nextClose(c); row(c, 'P3 g=' + g) }

console.log('\n[P4] rows qBack rebuilt at day 0 (new game): bank and insurer, statement of the newest rebuilt row');
world(20261016); for (const kd of [1, 2]) { const c = pick(kd), L = fqL(c), q = L[L.length - 1], p = L[L.length - 2], d = fqDerive(c, q, p);
  console.log(`P4 ${c.tk} kd ${kd} rebuilt row ${q.d} vs ${p.d} st ${d.st}: dD ${f2(q.D - p.D)}, row gr ${f2(q.gr)}, 차입 증감 ${f2(d.cff + q.dv - d.iss)}, 기타 ${f2(d.oth)}`) }

console.log('\n[P5] natural play census, 3 seeds x 720 days: every real close of every financial company, 차입 증감 − cash debt change vs row gr');
for (const seed of [20261016, 777, 12345]) { world(seed); const fin = S.co.filter(c => c.kd && !c.dead); fin.forEach(trap); const st = { n: 0, maxErr: 0, sumAbsG: 0, maxG: 0, minG: 0, neg: 0, d0: 0 };
  const seen = new Map(); for (let d = 0; d < 720; d++) { step(); if (mdl) G.mk(mdl.o.length - 1);
    for (const c of fin) { if (c.dead || !c.fq || c.fq.length < 2) continue; const q = c.fq[c.fq.length - 1]; if (q[0] <= 0 || seen.get(c.id) === q[0]) continue; seen.set(c.id, q[0]);
      const L = fqL(c), Q = L[L.length - 1], P = L[L.length - 2]; if (P.d <= 0) continue; const D = fqDerive(c, Q, P), o = quarter(c, P.d, Q.d), b = D.cff + Q.dv - D.iss;
      const err = Math.abs((b - o.dCash) - o.g); st.n++; st.maxErr = Math.max(st.maxErr, Math.abs(o.g - Q.gr)); st.sumAbsG += Math.abs(o.g); st.maxG = Math.max(st.maxG, o.g); st.minG = Math.min(st.minG, o.g); if (o.g < 0) st.neg++; if (err > 1) { st.d0++; console.log(`   mismatch ${c.tk} kd ${c.kd} row ${Q.d} vs ${P.d}: 차입 증감 ${f2(b)}, cash debt ${f2(o.dCash)}, growth ${f2(o.g)}, nc ${f2(D.nc)}, ncA ${f2(D.ncA)}, bk ${c.bk}, st ${D.st}`) } } }
  console.log(`P5 seed ${seed}: financial companies ${fin.length}, real closes ${st.n}, growth booked as 차입 증감 total |gr| ${f2(st.sumAbsG)}, max ${f2(st.maxG)}, min ${f2(st.minG)}, negative ${st.neg}, |oracle growth − row gr| max ${st.maxErr.toFixed(3)}, closes where 차입 증감 − cash debt ≠ growth (>1): ${st.d0}`) }
console.log('\ndone');
})().catch(e => console.log('PROBE ERROR ' + (e.stack || e)));
