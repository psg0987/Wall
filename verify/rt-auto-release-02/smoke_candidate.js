// RT-AUTO-RELEASE-02-CANDIDATE: browser smoke of the release candidate FILES themselves (not the Node test harness).
// Chromium (Playwright), mobile viewport 412x915, file:// pages, fresh browser storage per context.
// A. In the RELEASED web v24 page (index.html of main b421980, sha256 688a5b5d...), a fixed-seed world: the player takes 60% of an ordinary
//    company P, a bank B and an insurer I, founds a holding company H, turns 자동 경영 on for all four, turns it on and off again for a second
//    ordinary company Q, plays 200 days; then the page's own autosave (localStorage raider7, full save) and the export code (packS(1), WSR1:)
//    are taken. These are real v24 saves of a game with autopilot on.
// B. For each candidate page (web index.html, APK assets/index.html):
//    B1 the v24 full save is put in localStorage before the page loads -> the page boots into it (old-save restore through the real boot path);
//    B2 a fresh page imports the v24 export code through the real 세이브 가져오기 flow (G.imp + its button);
//    B3 the committed old fixture saves (tests/fixtures *.wsr) are imported the same way;
//    B4 on the B1 world: autop is wrapped (inputs recorded, then the page's own autop runs) and 300 days are played; every call is checked against a
//       reference written here from the RISK-06 A4R statement (ordinary companies) and the A2 rule (bank, insurer: unchanged), HOLD: 0/0/0;
//    B5 forced distress on P, B, I, H (same field edit on each): P must follow A4R and differ from A2, B and I must stay on A2, H 0/0/0;
//    B6 자동 경영 OFF (G.ap) on P: no autop call for P afterwards, settings untouched across a close; ON again: one immediate call;
//    plus: no page error (pageerror) and no console error in any page.
// usage: node verify/rt-auto-release-02/smoke_candidate.js V24.html CANDIDATE.html [CANDIDATE2.html ...]
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), crypto = require('crypto');
const [v24, ...cands] = process.argv.slice(2); const REPO = path.resolve(__dirname, '../..');
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ };
const SEED = 20261026;
async function page(br, file, pre) {
  const ctx = await br.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [], net = []; const p = await ctx.newPage(); p.on('pageerror', e => errs.push('pageerror ' + e.message));
  // a failed load of an external Google Fonts file is this workspace's network allowlist, not the page: kept apart (net) and printed; every other console error counts
  p.on('requestfailed', r => { if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(r.url())) net.push(r.url().split('?')[0] + ' ' + r.failure().errorText) });
  p.on('console', m => { if (m.type() === 'error') errs.push({ t: 'console ' + m.text() }) });
  errs.real = () => errs.filter(e => typeof e === 'string' || !(/Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED/.test(e.t) && net.length)).map(e => e.t || e); errs.net = net;
  if (pre) await p.addInitScript(([k, v]) => { try { if (!localStorage.getItem('__seeded')) { localStorage.setItem(k, v); localStorage.setItem('__seeded', '1') } } catch (e) {} }, pre);
  await p.goto('file://' + path.resolve(file)); await p.waitForFunction(() => typeof S !== 'undefined' && S && Array.isArray(S.co)); await p.waitForTimeout(500); return { ctx, p, errs };
}
// in-page helpers, injected as source
const H = `
window.__adv = n => { for (let d = 0; d < n; d++) { step();
  if (S.ev2) { const ev = S.ev2, e = EV2.find(z => z.id === ev.id), c = S.co[ev.c]; S.ev2 = null; mdl = null; if (e && c && !c.dead) { const [k, v] = e.ai(c, ev.x); e.go(c, ev.x, k, v) } }
  if (mdl) G.mk(mdl.o.length - 1); if (S.over) break } S.spd = 0 };
window.__sum = () => ({ day: S.day, v: S.v, n: S.co.length, cash: +S.cash.toFixed(4), co: S.co.map(c => [c.tk, c.i, c.kd, !!c.dead, c.ap || 0, +(c.own.P || 0).toFixed(6), c.g, c.pay, c.sweep, c.ps]) });`;
// reference (written from the RISK-06 A4R statement, not copied from the page): returns {g,pay,sweep,ps} for A2 and for the shipped rule
function ref(x) {
  const { r, ni, A, cs, nol, kd, i, dg, cg, ps0, HOLD } = x, roa = ni * 4 / Math.max(1, A), gap = kd ? 0 : dg - cg;
  const a2 = { g: r >= 4 ? 0 : roa > .1 && r <= 2 && gap > -.01 ? .1 : .04, pay: r >= 4 || nol > A * .05 ? 0 : .3, sweep: r >= 3 ? 2 : 1, ps: kd ? ps0 : (r <= 3 && roa > .06 ? 1 : 0) };
  let s = { ...a2 };
  if (!kd && i !== HOLD) { const tc = A * .06, halt = r >= 4 || (r === 3 && (ni <= 0 || cs < tc * .5 || gap < -.02)) || (ni < 0 && cs < tc);
    s = { g: halt ? 0 : roa > .1 && r <= 2 && gap > -.01 ? .1 : .04, pay: (r >= 4 || ni <= 0 || nol > A * .05 || (r === 3 && cs < tc)) ? 0 : r === 3 ? .15 : .3,
          sweep: r >= 3 || ni <= 0 ? 2 : 1, ps: r <= 3 && roa > .06 && (r <= 2 || cs >= tc * .5) ? 1 : 0 } }
  if (i === HOLD) s = { ...s, g: 0, ps: 0, pay: 0 };
  return { a2, s };
}
const note = e => e.net.length ? ' (blocked external font request, not counted: ' + [...new Set(e.net)].join(', ') + ')' : '';
const same = (a, b) => a.g === b.g && a.pay === b.pay && a.sweep === b.sweep && a.ps === b.ps;
(async () => {
  const br = await chromium.launch();
  console.log('v24 page ' + path.basename(v24) + ' sha256 ' + sha(v24));
  // ---------- A: real v24 saves with autopilot on
  const A = await page(br, v24);
  await A.p.evaluate(H); const made = await A.p.evaluate(`(() => { Math.random = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 })(${SEED});
    init(Object.assign(defCfg(), { tut: 0, seed: ${SEED} })); mdl = null; pg = ''; sel = -1; S.spd = 0;
    const ok0 = c => !c.dead && !c.priv && c.bk === 0 && c.i !== HOLD, big = a => a.sort((x, y) => y.A - x.A);
    const P = big(S.co.filter(c => ok0(c) && !c.kd))[3], Q = big(S.co.filter(c => ok0(c) && !c.kd))[6], B = big(S.co.filter(c => ok0(c) && c.kd === 1))[1], I = big(S.co.filter(c => ok0(c) && c.kd === 2))[1];
    for (const c of [P, Q, B, I]) setOwn(c, 'P', 60); ctlAll();
    S.cash = Math.max(S.cash, 1e6); G.fdOpen(); FD.sec = HOLD; FD.cap = 300; FD.fo = 'P'; G.fdGo(); mdl = null; const Hc = S.co[S.co.length - 1];
    for (const c of [P, B, I, Hc]) G.ap(c.id); G.ap(Q.id); G.ap(Q.id); pg = ''; sel = -1; S.spd = 0;
    window.__adv(200);
    return { ids: { P: P.id, Q: Q.id, B: B.id, I: I.id, H: Hc.id }, hold: Hc.i === HOLD && mine(Hc), ap: [P, Q, B, I, Hc].map(c => c.ap || 0) } })()`);
  ok(made.hold && made.ap.join() === '1,0,1,1,1', 'v24: P,B,I and founded HOLD under 자동 경영, Q switched on and off (ap ' + made.ap.join() + ')');
  await A.p.evaluate(() => save()); await A.p.waitForTimeout(200);
  const v24Full = await A.p.evaluate(() => localStorage.getItem('raider7')), v24Exp = await A.p.evaluate(() => packS(1)), v24Sum = await A.p.evaluate('window.__sum()');
  ok(v24Full && v24Full.startsWith('WSR1:') && v24Exp.startsWith('WSR1:'), 'v24 full save (localStorage, ' + Math.round(v24Full.length / 1024) + 'KB) and export code (' + Math.round(v24Exp.length / 1024) + 'KB) taken on day ' + v24Sum.day + ', save version ' + v24Sum.v);
  ok(A.errs.real().length === 0, 'v24 page: no page/console error' + (A.errs.real().length ? ' ' + A.errs.real().slice(0, 3) : '') + note(A.errs)); await A.ctx.close();
  const ID = made.ids, fix = ['old_save_1ecdc53_seed12345_day440.wsr', 'old_save_d82f847_seed20261016_day127.wsr'];
  for (const cand of cands) {
    console.log('== candidate ' + path.relative(REPO, path.resolve(cand)) + ' sha256 ' + sha(cand));
    // ---------- B1 full save through the boot path
    const B1 = await page(br, cand, ['raider7', v24Full]);
    await B1.p.evaluate(H); const s1 = await B1.p.evaluate('window.__sum()');
    const keyEq = (a, b) => JSON.stringify(a.co.map(z => z.slice(0, 6))) === JSON.stringify(b.co.map(z => z.slice(0, 6)));
    ok(s1.day === v24Sum.day && s1.n === v24Sum.n && s1.cash === v24Sum.cash && keyEq(s1, v24Sum), 'B1 v24 full save boots: day ' + s1.day + ', ' + s1.n + ' companies, cash, ownership and 자동 경영 flags equal');
    ok(JSON.stringify(s1.co.map(z => z.slice(6))) === JSON.stringify(v24Sum.co.map(z => z.slice(6))), 'B1 restored g/pay/sweep/ps of every company equal the v24 save (nothing recomputed at load)');
    await B1.p.screenshot({ path: path.join(process.env.SHOTS || '/tmp', path.basename(path.dirname(path.resolve(cand))) + '_restored.png') });
    // ---------- B2 export code through 세이브 가져오기
    const B2 = await page(br, cand); await B2.p.evaluate(H);
    await B2.p.evaluate(() => G.imp()); await B2.p.fill('#ipt', v24Exp); await B2.p.evaluate(() => mcb()); await B2.p.waitForTimeout(300);
    const s2 = await B2.p.evaluate('window.__sum()');
    ok(s2.day === v24Sum.day && s2.n === v24Sum.n && keyEq(s2, v24Sum) && JSON.stringify(s2.co.map(z => z.slice(6))) === JSON.stringify(v24Sum.co.map(z => z.slice(6))), 'B2 v24 export code imports through 세이브 가져오기: same day, companies, ownership, flags and settings');
    // ---------- B3 committed old fixture saves
    for (const f of fix) { await B2.p.evaluate(() => G.imp()); await B2.p.fill('#ipt', fs.readFileSync(path.join(REPO, 'tests/fixtures', f), 'utf8')); await B2.p.evaluate(() => mcb()); await B2.p.waitForTimeout(300);
      const d = await B2.p.evaluate(() => [S.day, S.v, S.co.length]); ok(d[0] === +f.match(/day(\d+)/)[1] && d[1] === 12, 'B3 ' + f + ' imports: day ' + d[0] + ', save version ' + d[1] + ', ' + d[2] + ' companies') }
    ok(B2.errs.real().length === 0, 'B2/B3 page: no page/console error' + (B2.errs.real().length ? ' ' + B2.errs.real().slice(0, 3) : '') + note(B2.errs)); await B2.ctx.close();
    // ---------- B4 natural play on the restored world, every autop call checked
    await B1.p.evaluate(() => { window.__log = []; const a0 = autop; autop = function (c) { const x = { id: c.id, day: S.day, r: rating(c), ni: c.ni, A: c.A, cs: c.cs, nol: c.nol, kd: c.kd, i: c.i, dg: S.dg[c.i], cg: S.cg[c.i], ps0: c.ps, HOLD };
      const out = a0(c); x.got = { g: c.g, pay: c.pay, sweep: c.sweep, ps: c.ps }; window.__log.push(x); return out } });
    await B1.p.evaluate('window.__adv(300)'); const log = await B1.p.evaluate(() => window.__log);
    const cnt = { P: 0, B: 0, I: 0, H: 0, Q: 0 }, bad = [], dif = { P: 0 };
    for (const x of log) { const k = Object.keys(ID).find(z => ID[z] === x.id) || '?'; cnt[k] = (cnt[k] || 0) + 1; const e = ref(x); if (!same(x.got, e.s)) bad.push(k + '@' + x.day); if (k === 'P' && !same(e.a2, e.s)) dif.P++;
      if ((k === 'B' || k === 'I') && !same(e.a2, e.s)) bad.push(k + ' A2!=ref@' + x.day) }
    ok(bad.length === 0 && cnt.P > 0 && cnt.B > 0 && cnt.I > 0 && cnt.H > 0 && !cnt.Q, 'B4 300 days after restore: ' + log.length + ' autop calls (P ' + cnt.P + ', B ' + cnt.B + ', I ' + cnt.I + ', H ' + cnt.H + ', Q ' + (cnt.Q || 0) + ') all equal the reference' + (bad.length ? ' — mismatch ' + bad.slice(0, 5) : '') + '; P calls where A4R differs from A2: ' + dif.P);
    // B5b bank and insurer, mild distress (ni slightly negative, cash kept): rating stays low, so A4R applied to them WOULD differ; they must stay on A2
    for (const k of ['B', 'I']) { const res = await B1.p.evaluate(id => { const c = S.co[id], F = ['ni', 'g', 'pay', 'sweep', 'ps'], keep = F.map(f => c[f]); window.__log = [];
        for (const f of [1e-6, 1e-5, 1e-4, 1e-3]) { F.forEach((f2, n) => c[f2] = keep[n]); c.ni = -Math.abs(c.A) * f; autop(c) } F.forEach((f2, n) => c[f2] = keep[n]); return window.__log }, ID[k]);
      const hyp = x => ref({ ...x, kd: 0, i: -1, dg: 0, cg: 0 }).s, disc = res.filter(x => { const h = hyp(x), a = ref(x).a2; return h.g !== a.g || h.pay !== a.pay || h.sweep !== a.sweep });
      ok(res.length === 4 && res.every(x => same(x.got, ref(x).a2)) && disc.length > 0, 'B5b ' + k + ' mild distress, ratings ' + res.map(x => x.r).join('/') + ': all 4 calls on A2; ' + disc.length + ' of them are cases where the A4R statement would decide differently (e.g. rating ' + (disc[0] ? disc[0].r + ' A2 ' + JSON.stringify(disc[0].got) + ' vs A4R-if-applied ' + JSON.stringify(hyp(disc[0])) : '-') + ')') }
    // ---------- B5 forced distress
    const forced = await B1.p.evaluate(ids => { window.__log = []; const r = {}; for (const [k, id] of Object.entries(ids)) { if (k === 'Q') continue; const c = S.co[id]; if (c.dead || !c.ap) { r[k] = 'skip'; continue }
      c.ni = -Math.abs(c.A) * .01; c.cs = c.A * .01; autop(c) } return r }, ID);
    const flog = await B1.p.evaluate(() => window.__log);
    for (const x of flog) { const k = Object.keys(ID).find(z => ID[z] === x.id), e = ref(x);
      if (k === 'P') ok(same(x.got, e.s) && !same(e.a2, e.s), 'B5 P (ordinary, rating ' + x.r + ', ni<0, cash 1% of assets): A4R ' + JSON.stringify(x.got) + ' — A2 would be ' + JSON.stringify(e.a2));
      else if (k === 'H') ok(x.got.g === 0 && x.got.pay === 0 && x.got.ps === 0 && same(x.got, e.s), 'B5 H (HOLD): g 0, pay 0, ps 0 ' + JSON.stringify(x.got));
      else ok(same(x.got, e.a2), 'B5 ' + k + ' (' + (x.kd === 1 ? 'bank' : 'insurer') + ', rating ' + x.r + '): stays on A2 ' + JSON.stringify(x.got)) }
    ok(flog.length === 4, 'B5 forced distress reached P, B, I, H (' + flog.length + ' calls; skipped ' + JSON.stringify(forced) + ')');
    // ---------- B6 ON/OFF
    const onoff = await B1.p.evaluate(id => { const c = S.co[id]; window.__log = []; G.ap(id); const off = c.ap; c.g = .123; c.pay = .456; const n0 = c.er ? c.er.d : -1; let d = 0;
      while ((c.er ? c.er.d : -1) === n0 && d < 120 && !c.dead) { window.__adv(1); d++ } const after = { ap: c.ap, g: c.g, pay: c.pay, calls: window.__log.filter(x => x.id === id).length, closed: (c.er ? c.er.d : -1) !== n0 };
      G.ap(id); const on = { ap: c.ap, calls: window.__log.filter(x => x.id === id).length }; return { off, after, on } }, ID.P);
    ok(onoff.off === 0 && onoff.after.closed && onoff.after.calls === 0 && onoff.after.g === .123 && onoff.after.pay === .456, 'B6 자동 경영 OFF on P: a close passed with no autop call, manual-looking settings kept (g .123, pay .456)');
    ok(onoff.on.ap === 1 && onoff.on.calls === 1, 'B6 자동 경영 ON again: exactly one immediate autop call');
    ok(B1.errs.real().length === 0, 'B1/B4-B6 page: no page/console error' + (B1.errs.real().length ? ' ' + B1.errs.real().slice(0, 3) : '') + note(B1.errs)); await B1.ctx.close();
  }
  await br.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
