// R3 integration: restore paths in Chromium 412x915 emulation with a save holding pending (ctl "?") companies. Cloud restore NOT RUN (network/account).
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
const file = process.argv[2], tmp = process.argv[3]; let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ };
(async () => { const b = await chromium.launch();
  const open = async pre => { const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message)); if (pre) await p.addInitScript(([k, v]) => { try { if (!localStorage.getItem('__s')) { localStorage.setItem(k, v); localStorage.setItem('__s', '1') } } catch (e) {} }, pre);
    await p.goto('file://' + path.resolve(file)); await p.waitForFunction(() => typeof S !== 'undefined' && S && Array.isArray(S.co)); await p.waitForTimeout(400); return { ctx, p, errs } };
  const M = await open(); const made = await M.p.evaluate(async () => { Math.random = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 })(5);
    init(Object.assign(defCfg(), { tut: 0, seed: 5 })); mdl = null; S.spd = 0; pg = ''; const iso = c => { for (const k of Object.keys(c.own)) setOwn(c, k, 0); for (const t of Object.keys(c.pos)) setOwn(S.co[+t], 'c' + c.id, 0) };
    const L = S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i !== HOLD && c.bk === 0), A = L[30], B = L[300]; iso(A); iso(B); setOwn(A, 'P', 35); setOwn(B, 'c' + A.id, 60); ctlAll(); setOwn(A, 'c' + B.id, 40); ctlAll(); A.ap = 1; B.ap = 1; setOwn(A, 'P', 0); ctlAll();
    return { A: A.id, B: B.id, ctl: [A.ctl, B.ctl], snap: [A.g, A.pay, B.g, B.pay, A.ap, B.ap], full: await packS(), exp: await packS(1) } });
  ok(made.ctl.join() === '?,?', 'save made with A, B pending (ctl "?"), ap 1/1'); await M.ctx.close(); fs.writeFileSync(tmp, made.exp);
  const check = async (P, tag) => { const r = await P.p.evaluate(m => { const A = S.co[m.A], B = S.co[m.B]; return { ctl: [A.ctl, B.ctl], mine: [mine(A), mine(B)], snap: [A.g, A.pay, B.g, B.pay, A.ap, B.ap], q: typeof CTLQ !== 'undefined' && CTLQ ? [CTLQ[m.A] && CTLQ[m.A].st, CTLQ[m.B] && CTLQ[m.B].st] : null, te: S.te } }, made);
    ok(r.ctl.join() === '?,?' && !r.mine[0] && !r.mine[1] && JSON.stringify(r.snap) === JSON.stringify(made.snap) && r.q && r.q.join() === 'AMBIG,AMBIG' && P.errs.length === 0, tag + ': pending kept (' + (r.q || []).join('/') + '), mine false, g/pay/ap unchanged (no autopilot on restore), no page error') };
  let P = await open(['raider7', made.full]); await check(P, 'R1 boot from autosave'); await P.ctx.close();
  P = await open(['r6s1', made.full]); await P.p.evaluate(() => G.ld(1)); await P.p.waitForTimeout(400); await check(P, 'R2 save slot (G.ld)'); await P.ctx.close();
  P = await open(); await P.p.evaluate(() => G.imp()); await P.p.fill('#ipt', made.exp); await P.p.evaluate(() => mcb()); await P.p.waitForTimeout(400); await check(P, 'R3 save code import'); await P.ctx.close();
  P = await open(); await P.p.evaluate(() => { G.pg('set') }); await P.p.locator('input[type=file]').setInputFiles(tmp);   // the file input lives on the settings screen (set12)
  await P.p.waitForTimeout(800); await check(P, 'R4 file import (input type=file -> G.fLoad)'); await P.ctx.close();
  console.log('NOT RUN R5 cloud restore (needs network and an account)');
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
