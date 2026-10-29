// node verify/rt-premerge-fix-01-r3-r3/bench_chromium.js PAGE.html bench_repeat_body.js — Chromium, CPU throttled 4x (CDP), 412x915
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
(async () => { const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true }), p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForFunction(() => typeof S !== 'undefined' && S && Array.isArray(S.co)); await p.waitForTimeout(300);
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const out = await p.evaluate(src => { (0, eval)(src); return __benchRepeat() }, fs.readFileSync(process.argv[3], 'utf8'));
  for (const l of out) console.log('info ' + l); console.log('page errors: ' + errs.length); await b.close() })().catch(e => { console.error(e); process.exit(2) });
