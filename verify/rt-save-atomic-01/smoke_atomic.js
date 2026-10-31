// RT-SAVE-ATOMIC-01 browser smoke (Claude). Chromium (Playwright) 412x915 mobile EMULATION, not a Galaxy device; no real cloud, no Android device.
// Real taps where a control exists (세이브 가져오기 paste + 불러오기, 설정 → 슬롯 불러오기, input type=file); faults are injected with page.evaluate.
// B1 game A's autosave is still packing (packS held 1.5 s) when B is pasted and loaded; right after the success toast the page is reloaded: B boots.
// B2 a save code that breaks during restore is pasted: 실패, game A kept; after the page's own 8-second autosave timer and a reload: A boots.
// B3 슬롯 불러오기 tap; reload right after the success toast: the slot game boots (before: the slot was not written to the autosave at once).
// B4 파일 가져오기 with evMd forced to throw (the save has an open event): 실패, game A kept, reload: A boots.
// B5 파일 가져오기 of the same save without the fault: event window restored, paused; 경영진에게 맡기기 tap → carried out once; reload → no event.
// usage: node verify/rt-save-atomic-01/smoke_atomic.js PAGE.html
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const PAGE = process.argv[2]; let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ };
const WORLD = sd => { Math.random = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 })(sd);
  init(Object.assign(defCfg(), { tut: 0, seed: sd })); S.tut = 99; mdl = null; pg = ''; sel = -1; S.spd = 0; for (let d = 0; d < 20; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null } S.ev2 = null; render() };
async function open(b) { const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }); const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_TUNNEL/.test(m.text())) errs.push('console ' + m.text()) });
  await p.goto('file://' + path.resolve(PAGE)); await ready(p); return { ctx, p, errs } }
const ready = async p => { await p.waitForFunction(() => typeof S !== 'undefined' && S && Array.isArray(S.co)); await p.waitForTimeout(500);
  await p.evaluate(() => { window.__toasts = []; const t0 = toast; toast = m => { window.__toasts.push(m); t0(m) } }) };
const gid = p => p.evaluate(() => [S.seed, S.day]);
const tap = async (p, onclick) => { const l = p.locator(`[onclick="${onclick}"]`).first(); await l.scrollIntoViewIfNeeded(); await l.tap(); await p.waitForTimeout(150) };
const tapText = async (p, t) => { const l = p.getByRole('button', { name: t }).first(); await l.scrollIntoViewIfNeeded(); await l.tap(); await p.waitForTimeout(150) };
const waitToast = async (p, re, ms = 8000) => { for (let k = 0; k < ms / 50; k++) { const t = await p.evaluate(() => window.__toasts.join(' | ')); if (re.test(t)) return t; await p.waitForTimeout(50) } return p.evaluate(() => window.__toasts.join(' | ')) };
const paste = async (p, code) => { await p.evaluate(() => G.imp()); await p.fill('#ipt', code); await tapText(p, '불러오기') };
(async () => { const b = await chromium.launch(); console.log('page ' + path.basename(PAGE) + ' sha256 ' + crypto.createHash('sha256').update(fs.readFileSync(PAGE)).digest('hex'));
  // codes: game B (seed 20261052) and game E (seed 20261053 with an open CEO-mode event, CEO resigned, paused at speed 3)
  const M = await open(b); await M.p.evaluate(WORLD, 20261052); const Bc = await M.p.evaluate(() => packS(1)), Bid = await gid(M.p);
  await M.p.evaluate(WORLD, 20261053); const ev = await M.p.evaluate(() => { const c = S.co.filter(x => !x.dead && !x.priv && !x.kd && x.i !== HOLD && x.bk === 0)[3]; for (const k of Object.keys(c.own)) setOwn(c, k, 0); setOwn(c, 'P', 60); ctlAll(); S.ceo = c.id;
    const e = EV2.find(z => z.id !== 'offer' && z.el(c) && z.o && z.o.length >= 2 && !z.sl) || EV2.find(z => z.id !== 'offer' && z.o && z.o.length >= 2 && !z.sl); S.ev2 = { id: e.id, c: c.id, x: e.mk(c), v: 0, m: 'ceo' }; S.spd = 0; S.sp0 = 3; S.ceo = -1; return { e: e.id, ai: e.ai(c, e.mk(c))[0] } });
  const Ec = await M.p.evaluate(() => packS(1)), Eid = await gid(M.p); const fE = path.join(os.tmpdir(), 'raider-atomic-E.txt'); fs.writeFileSync(fE, Ec); await M.ctx.close();
  const BAD = '{"v":13,"co":[null],"R":[],"d":[],"mxd":[]}';
  // ---------- B1
  { const P = await open(b); await P.p.evaluate(WORLD, 20261051); await P.p.evaluate(() => save()); await P.p.waitForTimeout(600); const Aid = await gid(P.p);
    await P.p.evaluate(() => { const pk = packS; packS = async function () { const r = pk.apply(this, arguments); packS = pk; await new Promise(x => setTimeout(x, 1500)); return r }; S.day += 0; save() });   // A's autosave: held 1.5 s
    await paste(P.p, Bc); const t = await waitToast(P.p, /불러왔|실패/); await P.p.reload(); await ready(P.p); const after = await gid(P.p); await P.p.waitForTimeout(2000); await P.p.reload(); await ready(P.p); const later = await gid(P.p);
    ok(/불러왔/.test(t) && JSON.stringify(after) === JSON.stringify(Bid) && JSON.stringify(later) === JSON.stringify(Bid), 'B1 A ' + JSON.stringify(Aid) + ' packing, B pasted → "' + t + '"; reload right after: ' + JSON.stringify(after) + ', reload 2 s later: ' + JSON.stringify(later) + ' (want B ' + JSON.stringify(Bid) + ')');
    ok(P.errs.length === 0, 'B1 page: no page error ' + P.errs.slice(0, 2).join(' | ')); await P.ctx.close() }
  // ---------- B2
  { const P = await open(b); await P.p.evaluate(WORLD, 20261051); await P.p.evaluate(() => save()); await P.p.waitForTimeout(600); const Aid = await gid(P.p); const j0 = await P.p.evaluate(() => JSON.stringify(S, (k, v) => k === 'k' ? undefined : v));
    await paste(P.p, BAD); const t = await waitToast(P.p, /불러왔|실패/); const r = await P.p.evaluate(j0 => ({ same: JSON.stringify(S, (k, v) => k === 'k' ? undefined : v) === j0, md: !!mdl }), j0);
    await P.p.waitForTimeout(9000); await P.p.reload(); await ready(P.p); const after = await gid(P.p);
    ok(/실패/.test(t) && !/불러왔/.test(t) && r.same && JSON.stringify(after) === JSON.stringify(Aid), 'B2 broken save pasted → "' + t + '", game A kept ' + r.same + '; after the 8-second autosave timer and a reload: ' + JSON.stringify(after) + ' (want A ' + JSON.stringify(Aid) + ')');
    ok(P.errs.length === 0, 'B2 page: no page error ' + P.errs.slice(0, 2).join(' | ')); await P.ctx.close() }
  // ---------- B3
  { const P = await open(b); await P.p.evaluate(WORLD, 20261051); await P.p.evaluate(() => save()); await P.p.waitForTimeout(600);
    await P.p.evaluate(c => { stSet('r6s3', c); stSet('r6m3', JSON.stringify({ d: 'B', w: 0 })); G.pg('set') }, Bc); await tap(P.p, 'G.ld(3)'); const t = await waitToast(P.p, /불러왔|실패/); await P.p.reload(); await ready(P.p); const after = await gid(P.p);
    ok(/불러왔/.test(t) && JSON.stringify(after) === JSON.stringify(Bid), 'B3 설정 → 슬롯 3 불러오기 tap → "' + t + '"; reload right after: ' + JSON.stringify(after) + ' (want ' + JSON.stringify(Bid) + ')');
    ok(P.errs.length === 0, 'B3 page: no page error ' + P.errs.slice(0, 2).join(' | ')); await P.ctx.close() }
  // ---------- B4 / B5
  { const P = await open(b); await P.p.evaluate(WORLD, 20261051); await P.p.evaluate(() => save()); await P.p.waitForTimeout(600); const Aid = await gid(P.p);
    await P.p.evaluate(() => { window.__evMd = evMd; evMd = () => { throw new Error('forced evMd') }; G.pg('set') }); await P.p.locator('input[type=file][onchange="G.fLoad(this)"]').first().setInputFiles(fE);
    const t = await waitToast(P.p, /불러왔|실패|아니에요/); await P.p.evaluate(() => { evMd = window.__evMd }); const now = await gid(P.p); await P.p.reload(); await ready(P.p); const after = await gid(P.p);
    ok(!/불러왔/.test(t) && JSON.stringify(now) === JSON.stringify(Aid) && JSON.stringify(after) === JSON.stringify(Aid), 'B4 파일 가져오기 with the event window failing → "' + t + '", game ' + JSON.stringify(now) + ', reload: ' + JSON.stringify(after) + ' (want A ' + JSON.stringify(Aid) + ')');
    await P.p.evaluate(E => { const e = EV2.find(z => z.id === E); window.__go0 = e.go; window.__goes = []; e.go = function (c, x, k, v) { window.__goes.push(k); return window.__go0.apply(this, arguments) }; G.pg('set') }, ev.e);
    await P.p.locator('input[type=file][onchange="G.fLoad(this)"]').first().setInputFiles(fE); const t5 = await waitToast(P.p, /불러왔/); const st = await P.p.evaluate(() => ({ id: [S.seed, S.day], m: S.ev2 && S.ev2.m, win: !!(mdl && mdl.ev2), spd: S.spd, sp0: S.sp0 }));
    ok(/불러왔/.test(t5) && JSON.stringify(st.id) === JSON.stringify(Eid) && st.m === 'own' && st.win && st.spd === 0 && st.sp0 === 3, 'B5 파일 가져오기 → "' + t5.split(' | ').pop() + '": event window restored (controlling holder), paused, speed 3 kept ' + JSON.stringify(st));
    await tapText(P.p, '경영진에게 맡기기'); await P.p.waitForTimeout(1500); const g = await P.p.evaluate(() => ({ goes: window.__goes.slice(), ev2: !!S.ev2, spd: S.spd })); await P.p.evaluate(() => save()); await P.p.waitForTimeout(800);
    await P.p.reload(); await ready(P.p); const z = await P.p.evaluate(() => ({ ev2: !!S.ev2, md: !!mdl }));
    ok(g.goes.length === 1 && g.goes[0] === ev.ai && !g.ev2 && g.spd === 3 && !z.ev2 && !z.md, 'B5 경영진에게 맡기기 tap → carried out once ' + JSON.stringify(g) + '; reload: no event, no window ' + JSON.stringify(z));
    ok(P.errs.length === 0, 'B4/B5 page: no page error ' + P.errs.slice(0, 2).join(' | ')); await P.ctx.close() }
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
