const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch();
 for (const [f, pgv] of [[process.argv[2], 'set'], [process.argv[3], 'set'], [process.argv[3], 'auto']]) {
  const p = await (await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2.625 })).newPage();
  await p.goto('file://' + path.resolve(f)); await p.waitForFunction(() => typeof S !== 'undefined' && S && S.co);
  const r = await p.evaluate(v => { init(Object.assign(defCfg(), { tut: 0, seed: 5 })); mdl = null; S.spd = 0; for (const c of S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i !== HOLD).slice(0, 40)) setOwn(c, 'P', 60); ctlAll(); tab = 'h'; G.pg(v);
    const se = document.scrollingElement, sc = [...document.querySelectorAll('*')].filter(e => { const s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 5 }).map(e => (e.id || e.className || e.tagName) + ':' + e.clientHeight + '/' + e.scrollHeight);
    return { doc: se.scrollHeight, inner: innerHeight, scrollers: sc.slice(0, 4) } }, pgv);
  // reach the bottom of the page the user sees and check the last element is visible in the viewport
  await p.mouse.move(200, 500); for (let k = 0; k < 40; k++) await p.mouse.wheel(0, 2000); await p.waitForTimeout(200);
  const vis = await p.evaluate(v => { const el = v === 'auto' ? [...document.querySelectorAll('button')].find(b => b.textContent === '다음') : [...document.querySelectorAll('button')].find(b => b.textContent === '은퇴하기'); const r = el && el.getBoundingClientRect(); return r ? [Math.round(r.top), Math.round(r.bottom), innerHeight] : null }, pgv);
  console.log(path.basename(f), pgv, JSON.stringify(r), 'last control after scrolling to the end (top,bottom,viewport):', JSON.stringify(vis));
  await p.screenshot({ path: path.join(path.dirname(process.argv[2]), 'shots', path.basename(f) + '_' + pgv + '_end.png') }) }
 await b.close() })();
