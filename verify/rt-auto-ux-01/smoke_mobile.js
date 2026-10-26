// RT-AUTO-UX-01 browser smoke (Claude): the branch game page (dist/raider.html from build/build.py) in Chromium with a 412x915 mobile viewport
// (screen-size EMULATION, not a Galaxy device). Old saves are made by the released pages themselves:
//   v24 = index.html of main b421980 (sha256 688a5b5d...), v25 = index.html of release-v25 999450654 (sha256 dc61ae51...).
// The branch page: build/build.py, then the build/site.py skeleton + dist/raider.html written to a scratch file (index.html is not touched).
// In each old page: fixed-seed world; the player takes 60% of ordinary P and Q, bank B, insurer I, founds holding H; 자동 경영 ON for P,B,I,H,
// ON then OFF for Q (manual OFF); v24 save with 'new control auto' (S.apAll) OFF, v25 save with it ON; 120 days; full save + export code.
// In the branch page, per save: S1 boot from the full save, S2 import the export code (세이브 가져오기): flags and parameters equal, nothing recomputed;
// S3 one day later Q is still OFF and no flag changed; S4 real taps at 412x915: 설정 -> 자동경영 일괄 관리, 전체 OFF, 전체 ON (each decision = rule),
// row tap 자동경영 끄기, no horizontal scroll; S5 60 more companies: 다음/다음/이전 taps, 25 rows per page; S6 지분 구조도 -> 자동경영 관리;
// S7 indirect control through the real buy path (거래 주체 = P's company, G.buy 60%) with the option ON: ON + one decision = rule;
// S8 forced distress: ordinary A4R (differs from A2), bank/insurer A2, HOLD 0/0/0. No page error in any page (blocked Google Fonts kept apart).
// BRANCH.html must be the site form of the page (build/site.py skeleton with the viewport meta) — dist/raider.html alone has no viewport meta and lays out at 980 px.
// usage: node verify/rt-auto-ux-01/smoke_mobile.js V24.html V25.html BRANCH.html   (env SHOTS=dir for screenshots)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), crypto = require('crypto');
const [v24, v25, br] = process.argv.slice(2); const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ }; const SHOTS = process.env.SHOTS || '/tmp';
async function open(b, file, pre) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  const errs = [], net = []; const p = await ctx.newPage(); p.on('pageerror', e => errs.push('pageerror ' + e.message));
  p.on('requestfailed', r => { if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(r.url())) net.push(r.url().split('?')[0]) });
  p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()) });
  if (pre) await p.addInitScript(v => { try { if (!localStorage.getItem('__s')) { localStorage.setItem('raider7', v); localStorage.setItem('__s', '1') } } catch (e) {} }, pre);
  await p.goto('file://' + path.resolve(file)); await p.waitForFunction(() => typeof S !== 'undefined' && S && Array.isArray(S.co)); await p.waitForTimeout(500);
  await p.evaluate(H); return { ctx, p, real: () => errs.filter(e => !(net.length && /ERR_TUNNEL_CONNECTION_FAILED/.test(e))), net };
}
const H = `window.__adv = n => { for (let d = 0; d < n; d++) { step(); if (S.ev2) { const ev = S.ev2, e = EV2.find(z => z.id === ev.id), c = S.co[ev.c]; S.ev2 = null; mdl = null; if (e && c && !c.dead) { const [k, v] = e.ai(c, ev.x); e.go(c, ev.x, k, v) } } if (mdl) G.mk(mdl.o.length - 1) } S.spd = 0 };
window.__sum = () => ({ day: S.day, apAll: S.apAll, n: S.co.length, co: S.co.map(c => [c.tk, c.ctl || '', c.ap || 0, c.g, c.pay, c.sweep, c.ps]) });
window.__ref = x => { const { r, ni, A, cs, nol, kd, i, dg, cg, ps0 } = x, roa = ni * 4 / Math.max(1, A), gap = kd ? 0 : dg - cg;
  let s = { g: r >= 4 ? 0 : roa > .1 && r <= 2 && gap > -.01 ? .1 : .04, pay: r >= 4 || nol > A * .05 ? 0 : .3, sweep: r >= 3 ? 2 : 1, ps: kd ? ps0 : (r <= 3 && roa > .06 ? 1 : 0) }; const a2 = { ...s };
  if (!kd && i !== HOLD) { const tc = A * .06, halt = r >= 4 || (r === 3 && (ni <= 0 || cs < tc * .5 || gap < -.02)) || (ni < 0 && cs < tc);
    s = { g: halt ? 0 : roa > .1 && r <= 2 && gap > -.01 ? .1 : .04, pay: (r >= 4 || ni <= 0 || nol > A * .05 || (r === 3 && cs < tc)) ? 0 : r === 3 ? .15 : .3, sweep: r >= 3 || ni <= 0 ? 2 : 1, ps: r <= 3 && roa > .06 && (r <= 2 || cs >= tc * .5) ? 1 : 0 } }
  if (i === HOLD) s = { ...s, g: 0, ps: 0, pay: 0 }; return { s, a2 } };
window.__wrap = () => { if (window.__a0) return; window.__a0 = autop; window.__log = []; autop = function (c) { const x = { id: c.id, r: rating(c), ni: c.ni, A: c.A, cs: c.cs, nol: c.nol, kd: c.kd, i: c.i, dg: S.dg[c.i], cg: S.cg[c.i], ps0: c.ps }; const o = window.__a0(c); x.got = { g: c.g, pay: c.pay, sweep: c.sweep, ps: c.ps }; window.__log.push(x); return o } };
window.__same = (a, b) => a.g === b.g && a.pay === b.pay && a.sweep === b.sweep && a.ps === b.ps;`;
const MAKE = apAll => `(() => { const s0 = 20261026; Math.random = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 })(s0);
  init(Object.assign(defCfg(), { tut: 0, seed: s0 })); mdl = null; pg = ''; sel = -1; S.spd = 0; S.apAll = 0;
  const ok0 = c => !c.dead && !c.priv && c.bk === 0 && c.i !== HOLD, big = a => a.sort((x, y) => y.A - x.A), ord = big(S.co.filter(c => ok0(c) && !c.kd));
  const P = ord[3], Q = ord[6], B = big(S.co.filter(c => ok0(c) && c.kd === 1))[1], I = big(S.co.filter(c => ok0(c) && c.kd === 2))[1];
  for (const c of [P, Q, B, I]) setOwn(c, 'P', 60); ctlAll(); S.cash = Math.max(S.cash, 1e6); G.fdOpen(); FD.sec = HOLD; FD.cap = 300; FD.fo = 'P'; G.fdGo(); mdl = null; const Hc = S.co[S.co.length - 1];
  for (const c of [P, B, I, Hc]) G.ap(c.id); G.ap(Q.id); G.ap(Q.id); S.apAll = ${apAll}; pg = ''; sel = -1; window.__adv(120);
  return { P: P.id, Q: Q.id, B: B.id, I: I.id, H: Hc.id } })()`;
(async () => {
  const b = await chromium.launch(); console.log('branch page ' + path.basename(br) + ' sha256 ' + sha(br));
  for (const [tag, file, apAll] of [['v24', v24, 0], ['v25', v25, 1]]) {
    console.log('== ' + tag + ' save from ' + path.basename(file) + ' sha256 ' + sha(file));
    const O = await open(b, file); const ID = await O.p.evaluate(MAKE(apAll)); await O.p.evaluate(() => save()); await O.p.waitForTimeout(300);
    const full = await O.p.evaluate(() => localStorage.getItem('raider7')), exp = await O.p.evaluate(() => packS(1)), ref = await O.p.evaluate('window.__sum()');
    const q = ref.co[ID.Q]; ok(full.startsWith('WSR1:') && exp.startsWith('WSR1:') && q[2] === 0 && ref.co[ID.P][2] === 1 && ref.apAll === apAll, tag + ' save made on day ' + ref.day + ': P,B,I,H ON, Q manual OFF, new-control option ' + (apAll ? 'ON' : 'OFF') + ' (full ' + Math.round(full.length / 1024) + 'KB, export ' + Math.round(exp.length / 1024) + 'KB)');
    ok(O.real().length === 0, tag + ' page: no page error' + (O.real().length ? ' ' + O.real().slice(0, 2) : '')); await O.ctx.close();
    // S1 full save boot
    const A = await open(b, br, full); let s = await A.p.evaluate('window.__sum()');
    ok(JSON.stringify(s) === JSON.stringify(ref), 'S1 ' + tag + ' full save boots in the branch: day, option, every company ctl/ap/g/pay/sweep/ps equal');
    // S2 export import
    const Bp = await open(b, br); await Bp.p.evaluate(() => G.imp()); await Bp.p.fill('#ipt', exp); await Bp.p.evaluate(() => mcb()); await Bp.p.waitForTimeout(300);
    s = await Bp.p.evaluate('window.__sum()'); ok(JSON.stringify(s) === JSON.stringify(ref), 'S2 ' + tag + ' export code imports through 세이브 가져오기: all equal');
    ok(Bp.real().length === 0, 'S2 page: no page error'); await Bp.ctx.close();
    // S3 one day
    await A.p.evaluate('window.__wrap(); window.__adv(1)'); s = await A.p.evaluate('window.__sum()');
    ok(s.co.every((c, k) => c[2] === ref.co[k][2]) && s.co[ID.Q][2] === 0, 'S3 one day after loading: no 자동 경영 flag changed, Q still OFF');
    // S4 real taps
    await A.p.evaluate(() => { G.pg('set') }); await A.p.getByRole('button', { name: '자동경영 일괄 관리' }).tap(); await A.p.waitForTimeout(150);
    ok(await A.p.evaluate(() => pg === 'auto'), 'S4 설정 -> 자동경영 일괄 관리 tap opens the page');
    const mine0 = await A.p.evaluate(() => S.co.filter(mine).length), rows0 = await A.p.locator('button', { hasText: /^자동경영 (끄기|켜기)$/ }).count();
    ok(rows0 === Math.min(25, mine0), 'S4 rows ' + rows0 + ' for ' + mine0 + ' controlled companies');
    await A.p.evaluate(() => window.__log.length = 0); await A.p.getByRole('button', { name: '전체 OFF' }).tap(); await A.p.waitForTimeout(100);
    let st = await A.p.evaluate(() => ({ on: S.co.filter(c => mine(c) && c.ap).length, calls: window.__log.length }));
    ok(st.on === 0 && st.calls === 0, 'S4 전체 OFF tap: all OFF, no decision run');
    await A.p.getByRole('button', { name: '전체 ON' }).tap(); await A.p.waitForTimeout(100);
    st = await A.p.evaluate(() => ({ on: S.co.filter(c => mine(c) && c.ap).length, n: S.co.filter(mine).length, calls: window.__log.length, bad: window.__log.filter(x => !window.__same(x.got, window.__ref(x).s)).length }));
    ok(st.on === st.n && st.calls === st.n && st.bad === 0, 'S4 전체 ON tap: ' + st.on + '/' + st.n + ' ON, ' + st.calls + ' decisions, all equal the rule');
    await A.p.locator('button', { hasText: /^자동경영 끄기$/ }).first().tap(); await A.p.waitForTimeout(100);
    st = await A.p.evaluate(() => S.co.filter(c => mine(c) && !c.ap).length); ok(st === 1, 'S4 row tap 자동경영 끄기: exactly one company OFF');
    const ov = await A.p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); ok(ov[1] === 412 && ov[0] <= ov[1], 'S4 layout width 412 and no horizontal scroll (scrollWidth ' + ov[0] + ', width ' + ov[1] + ')');
    await A.p.screenshot({ path: path.join(SHOTS, tag + '_auto_page.png') });
    // S5 pagination
    await A.p.evaluate(() => { const c = S.co.filter(c => !c.dead && !c.priv && !mine(c) && !c.kd && c.i !== HOLD && c.bk === 0).slice(0, 60); for (const x of c) setOwn(x, 'P', 60); ctlAll(); render() });
    const n2 = await A.p.evaluate(() => S.co.filter(mine).length), lab = async () => (await A.p.locator('text=/\\d+ \\/ \\d+ 페이지/').first().textContent()).match(/(\d+) \/ (\d+)/).slice(1).join('/');
    const NP = Math.ceil(n2 / 25), seq = [await lab()]; for (let k = 1; k < NP; k++) { await A.p.getByRole('button', { name: '다음' }).tap(); await A.p.waitForTimeout(80); seq.push(await lab()) }
    const lastRows = await A.p.locator('button', { hasText: /^자동경영 (끄기|켜기)$/ }).count(), nextDis = await A.p.getByRole('button', { name: '다음' }).isDisabled();
    await A.p.getByRole('button', { name: '이전' }).tap(); await A.p.waitForTimeout(80); seq.push(await lab());
    ok(seq.join(',') === [...Array(NP).keys()].map(k => (k + 1) + '/' + NP).concat([(NP - 1) + '/' + NP]).join(',') && lastRows === n2 - 25 * (NP - 1) && nextDis, 'S5 ' + n2 + ' companies: taps 다음 x' + (NP - 1) + ', 이전 -> pages ' + seq.join(' ') + ', last page ' + lastRows + ' rows, 다음 disabled there');
    await A.p.screenshot({ path: path.join(SHOTS, tag + '_auto_page_last.png'), fullPage: true });
    // S6 ownership map entry
    await A.p.evaluate(() => { G.pg('own') }); await A.p.waitForTimeout(80); const ownOk = await A.p.evaluate(() => pg === 'own');
    if (ownOk) { await A.p.getByRole('button', { name: '자동경영 관리' }).first().tap(); await A.p.waitForTimeout(80) }
    ok(ownOk && await A.p.evaluate(() => pg === 'auto'), 'S6 지분 구조도 -> 자동경영 관리 tap opens the page');
    // S7 indirect control through the real buy path
    const ind = await A.p.evaluate(Pid => { S.apAll = 1; const via = S.co[Pid]; via.cs = Math.max(via.cs, 1e6); const t = S.co.find(c => !c.dead && !c.priv && !mine(c) && !c.kd && c.i !== HOLD && c.bk === 0 && pub(c) > 75 && mc(c) < 2e4);
      window.__log.length = 0; G.setTE(Pid); G.buy(t.id, 60); G.setTE('P'); const x = window.__log.filter(z => z.id === t.id);
      return { tk: t.tk, mine: mine(t), via: t.own['c' + Pid] || 0, ap: t.ap, calls: x.length, rule: x.length === 1 && window.__same(x[0].got, window.__ref(x[0]).s) } }, ID.P);
    ok(ind.mine && ind.via >= 50 && ind.ap === 1 && ind.calls === 1 && ind.rule, 'S7 거래 주체 = P company buys 60% of ' + ind.tk + ' (indirect control, option ON): ON, one decision equal to the rule ' + JSON.stringify(ind));
    // S8 forced distress
    const fd = await A.p.evaluate(ID => { const out = {}; for (const k of ['P', 'B', 'I', 'H']) { const c = S.co[ID[k]]; if (c.dead || !mine(c)) { out[k] = 'skip'; continue } c.ap = 1; c.ni = -Math.abs(c.A) * (k === 'P' || k === 'H' ? .01 : 1e-5); if (k === 'P') c.cs = c.A * .01;
      window.__log.length = 0; autop(c); const x = window.__log[0], r = window.__ref(x); out[k] = { r: x.r, got: x.got, rule: window.__same(x.got, r.s), a2: window.__same(x.got, r.a2) } } return out }, ID);
    ok(fd.P.rule && !fd.P.a2 && fd.B.rule && fd.B.a2 && fd.I.rule && fd.I.a2 && fd.H.rule && fd.H.got.g === 0 && fd.H.got.pay === 0 && fd.H.got.ps === 0, 'S8 forced distress: ordinary A4R (not A2) ' + JSON.stringify(fd.P.got) + ', bank A2 r' + fd.B.r + ', insurer A2 r' + fd.I.r + ', HOLD 0/0/0');
    ok(A.real().length === 0, 'S1-S8 branch page: no page error' + (A.real().length ? ' ' + A.real().slice(0, 3) : '') + (A.net.length ? ' (blocked Google Fonts request not counted)' : '')); await A.ctx.close();
  }
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
