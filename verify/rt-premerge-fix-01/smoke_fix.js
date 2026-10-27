// RT-PREMERGE-FIX-01 browser smoke (Claude): the fix branch page in its site form (build/site.py skeleton + dist/raider.html) in Chromium,
// 412x915 mobile viewport EMULATION (not a Galaxy device). Checks the new parts by real taps:
//   W1 자동경영 관리 shows the bulk scope (현재 지배 중인 N개 회사에만 적용) and the separate card for companies controlled later, both readable
//      inside the 412 px layout (no horizontal scroll, the card's text not clipped); W2 tapping the card's toggle flips S.apAll and the label;
//   W3 전체 OFF with the option ON: toast says companies controlled later will still be ON, S.apAll unchanged;
//   W4 founding through the founding page (G.fdOpen, choices, 설립 button tap) with the option ON: preset kept, 자동 경영 OFF; then 자동 경영 ON on
//      the company page applies the rule once; W5 an 11-level reverse chain made in the page settles in one ctlAll (the page's own code);
//   no page error (blocked Google Fonts request kept apart).
// usage: node verify/rt-premerge-fix-01/smoke_fix.js BRANCH_SITE.html   (env SHOTS=dir)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), crypto = require('crypto');
const file = process.argv[2]; let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ }; const SHOTS = process.env.SHOTS || '/tmp';
(async () => {
  console.log('page ' + path.basename(file) + ' sha256 ' + crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'));
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(), errs = [], net = []; p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()) });
  p.on('requestfailed', r => { if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(r.url())) net.push(r.url()) });
  await p.goto('file://' + path.resolve(file)); await p.waitForFunction(() => typeof S !== 'undefined' && S && Array.isArray(S.co)); await p.waitForTimeout(400);
  await p.evaluate(() => { const s0 = 20261027; Math.random = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 })(s0);
    init(Object.assign(defCfg(), { tut: 0, seed: s0 })); mdl = null; S.spd = 0; S.apAll = 1; pg = ''; sel = -1;
    for (const c of S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i !== HOLD && c.bk === 0).slice(0, 4)) setOwn(c, 'P', 60); ctlAll();
    window.__log = []; const a0 = autop; autop = function (c) { const o = a0(c); window.__log.push({ id: c.id, g: c.g, pay: c.pay, sweep: c.sweep, ps: c.ps }); return o };
    window.__toasts = []; const t0 = toast; toast = m => { window.__toasts.push(String(m)); return t0(m) }; G.pg('set'); render() });
  await p.getByRole('button', { name: '자동경영 일괄 관리' }).tap(); await p.waitForTimeout(150);
  const n = await p.evaluate(() => S.co.filter(mine).length);
  const scope = p.getByText(`현재 지배 중인 ${n}개 회사에만 적용`, { exact: false }), card = p.getByText('앞으로 새로 지배하는 회사: 자동경영 켜짐');
  const box = await card.boundingBox(), note = await p.getByText('직접 설립한 회사는', { exact: false }).boundingBox(), w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  ok(await scope.isVisible() && await card.isVisible() && box && note && note.x >= 0 && note.x + note.width <= 412 + .5 && w[0] <= w[1] && w[1] === 412, 'W1 bulk scope (' + n + ' companies) and the option card are shown inside 412 px (scrollWidth ' + w[0] + ')');
  await p.screenshot({ path: path.join(SHOTS, 'fix_auto_page.png') });
  await p.getByRole('button', { name: '새로 지배하는 회사 자동경영 끄기' }).tap(); await p.waitForTimeout(100);
  const off = await p.evaluate(() => S.apAll), offLab = await p.getByText('앞으로 새로 지배하는 회사: 자동경영 꺼짐').isVisible();
  await p.getByRole('button', { name: '새로 지배하는 회사 자동경영 켜기' }).tap(); await p.waitForTimeout(100);
  ok(off === 0 && offLab && await p.evaluate(() => S.apAll) === 1, 'W2 the card toggle switches the option off and on, label follows');
  await p.getByRole('button', { name: '전체 OFF' }).tap(); await p.waitForTimeout(100); const ts = await p.evaluate(() => window.__toasts.slice(-1)[0] || '');
  ok(ts.includes('앞으로 새로 지배하는 회사는 자동경영이 켜집니다') && await p.evaluate(() => S.apAll === 1 && S.co.filter(c => mine(c) && c.ap).length === 0), 'W3 전체 OFF with the option ON: all held OFF, option still ON, toast: ' + ts);
  // W4 founding through the founding page with real taps on the page's own controls
  const sec = await p.evaluate(() => { S.cash = 1e7; G.fdOpen(); const s = S.co.find(c => !c.dead && !c.kd && c.i !== HOLD).i; G.fdSet('sec', s); FD.pre = 0; FD.fo = 'P'; FD.cap = fMin(s) * 2; render(); return s });
  const n0 = await p.evaluate(() => S.co.length), go = p.locator('button[onclick="G.fdGo()"]'); const hasGo = await go.count(); if (hasGo) await go.first().tap(); else await p.evaluate(() => G.fdGo()); await p.waitForTimeout(150);
  const f = await p.evaluate(n0 => { const c = S.co.length > n0 ? S.co[S.co.length - 1] : null; return c && { id: c.id, mine: mine(c), ap: c.ap, g: c.g, ps: c.ps, calls: window.__log.filter(x => x.id === c.id).length } }, n0);
  ok(f && f.mine && f.ap === 0 && f.g === .2 && f.ps === 2 && f.calls === 0, 'W4 founding (' + (hasGo ? '설립 button tapped' : 'G.fdGo') + ') with the option ON: preset g .2 / R&D 2 kept, 자동 경영 OFF, no decision ' + JSON.stringify(f));
  await p.evaluate(id => { G.pick(id) }, f.id); await p.waitForTimeout(100); const apBtn = p.locator(`[onclick="G.ap(${f.id})"]`); const nb = await apBtn.count();
  if (nb) { await apBtn.first().scrollIntoViewIfNeeded(); await apBtn.first().tap() } else await p.evaluate(id => G.ap(id), f.id); await p.waitForTimeout(100);
  const f2 = await p.evaluate(id => { const c = S.co[id]; return { ap: c.ap, calls: window.__log.filter(x => x.id === id).length, g: c.g, ps: c.ps } }, f.id);
  ok(f2.ap === 1 && f2.calls === 1, 'W4 자동 경영 ON on the founded company (' + (nb ? 'company page button tapped' : 'G.ap') + '): one decision, now g ' + f2.g + ' / R&D ' + f2.ps);
  // W5 11-level chain in the page
  const ch = await p.evaluate(() => { const L = S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i !== HOLD && c.bk === 0 && !mine(c)), ms = []; for (let k = 0; k < 11; k++) ms.push(L[Math.floor(k * (L.length - 1) / 10)]);
    for (const c of ms) { for (const k of Object.keys(c.own)) setOwn(c, k, 0); for (const t of Object.keys(c.pos)) setOwn(S.co[+t], 'c' + c.id, 0) } ms.sort((a, b) => a.id - b.id);
    setOwn(ms[10], 'P', 60); for (let k = 10; k > 0; k--) setOwn(ms[k - 1], 'c' + ms[k].id, 60); window.__log.length = 0; ctlAll(); return { mine: ms.filter(mine).length, ap: ms.filter(c => c.ap).length, calls: window.__log.length, cd: S.cd } });
  ok(ch.mine === 11 && ch.ap === 11 && ch.calls >= 11 && ch.cd === 0, 'W5 11-level reverse chain in the page: one ctlAll, 11 controlled, 11 ON ' + JSON.stringify(ch));
  const real = errs.filter(e => !(net.length && /ERR_TUNNEL_CONNECTION_FAILED/.test(e))); ok(real.length === 0, 'page: no page error' + (real.length ? ' ' + real.slice(0, 3) : '') + (net.length ? ' (blocked Google Fonts request not counted)' : ''));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
