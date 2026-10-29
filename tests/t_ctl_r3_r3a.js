// RT-PREMERGE-FIX-01-R3-R3A (Claude), written BEFORE the fix: the sector share page (shrPg) groups companies by controller. Pending companies
// (ctl "?") have no controller; unrelated pending companies must not be summed into one "group". Real controller groups (P) still add up.
let errs = 0, fails = 0; const ok = (x, m) => { console.log((x ? 'ok ' : 'FAIL ') + m); if (!x) fails++ }; const pre = (x, m) => { if (!x) { errs++; console.log('ERR precondition ' + m) } };
const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
Math.random = mul(401); init(Object.assign(defCfg(), { tut: 0, seed: 401 })); mdl = null; S.spd = 0;
{ const iso = c => { for (const k of Object.keys(c.own)) setOwn(c, k, 0); for (const t of Object.keys(c.pos)) setOwn(S.co[+t], 'c' + c.id, 0) };
  const sec = INDS.find(i => S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i === i && c.bk === 0).length >= 8), L = S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i === sec && c.bk === 0);
  const [x1, y1, x2, y2, p1, p2] = L; [x1, y1, x2, y2, p1, p2].forEach(iso); [x1, y1, x2, y2].forEach(c => c.ctl = null);
  setOwn(y1, 'c' + x1.id, 60); setOwn(x1, 'c' + y1.id, 60); setOwn(y2, 'c' + x2.id, 60); setOwn(x2, 'c' + y2.id, 60); setOwn(p1, 'P', 60); setOwn(p2, 'P', 60); ctlAll();
  const pend = [x1, y1, x2, y2]; pre(pend.every(c => c.ctl === '?') && mine(p1) && mine(p2), 'two unrelated pending pairs and two P companies in sector ' + sec);
  SHI = sec; const h = shrPg(), bar = (h.match(/지배 그룹별<\/div><div class="bar"[^>]*>(.*?)<\/div>/) || [])[1] || '', segs = [...bar.matchAll(/<i style="width:([\d.]+)%;[^"]*" title="([^"]*)"><\/i>/g)].map(m => ({ w: +m[1], t: m[2] }));
  const a = S.co.filter(c => !c.dead && c.i === sec), tot = a.reduce((s, c) => s + c.A, 0), share = c => +(c.A / tot * 100).toFixed(1);
  const pseg = segs.filter(s => s.t.includes('판정 보류')), mySeg = segs.filter(s => s.t === '나');
  pre(segs.length > 0, 'bar parsed (' + segs.length + ' segments)');
  ok(pseg.length === 4 && pend.every(c => pseg.some(s => s.t.includes(c.tk) && Math.abs(s.w - share(c)) < .11)), 'S1 4 unrelated pending companies are 4 separate entries, each with its own share: ' + JSON.stringify(pseg));
  ok(mySeg.length === 1 && Math.abs(mySeg[0].w - +((p1.A + p2.A) / tot * 100).toFixed(1)) < .11, 'S2 the real controller group (나) still adds up its companies: ' + JSON.stringify(mySeg));
  const legend = (h.match(/지배 그룹별.*?<div class="mu num">(.*?)<\/div>/) || [])[1] || ''; ok(!/판정 보류 \d+%/.test(legend) || pend.some(c => legend.includes(c.tk)), 'S3 the legend does not show a merged "판정 보류 NN%" group: ' + legend) }
console.log('errs', errs, 'fails', fails);
