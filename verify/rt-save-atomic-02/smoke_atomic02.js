// RT-SAVE-ATOMIC-02 browser smoke (Claude). Chromium (Playwright) 412x915 mobile EMULATION, not a Galaxy device; Android is a JS stub
// (window.Android.load/save over localStorage keys "nat_*" so it survives a reload), not the APK's native bridge.
// I1 game A shows company T's 인수 tab; game B (lots of cash) is pasted and loaded while its device write is held 2 s; during the hold the old
//    screen's "+50%" 공개매수 button for T and the 3× speed button are tapped (real taps). B must end exactly as saved (cash, T's holders,
//    speed), the local save must be that B, and after the restore a tap works again.
// I2 same with the device write failing (localStorage.setItem throws for raider7): taps during the hold do nothing (no action, no message, no
//    redraw of the new game); 실패; game A unchanged;
//    a tap works again afterwards.
// I3 Android stub: native file = A, Android.save → false, localStorage works. B pasted: no success that a restart cannot see (reload).
// usage: node verify/rt-save-atomic-02/smoke_atomic02.js PAGE.html
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), crypto = require('crypto');
const PAGE = process.argv[2]; let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ };
const WORLD = ([sd, cash]) => { Math.random = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 })(sd);
  init(Object.assign(defCfg(), { tut: 0, seed: sd })); S.tut = 99; mdl = null; pg = ''; sel = -1; S.spd = 0; for (let d = 0; d < 20; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null } S.ev2 = null; if (cash) S.cash = cash; render() };
const ANDROID = () => { window.Android = { load: k => localStorage.getItem('nat_' + k), save: (k, v) => { if (localStorage.getItem('__natfail') === '1' || !/^[a-z0-9]{1,24}$/.test(k)) return false; localStorage.setItem('nat_' + k, v); return true } } };
async function open(b, android) { const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }); const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_TUNNEL/.test(m.text())) errs.push('console ' + m.text()) });
  if (android) await p.addInitScript(ANDROID); await p.goto('file://' + path.resolve(PAGE)); await ready(p); return { ctx, p, errs } }
const ready = async p => { await p.waitForFunction(() => typeof S !== 'undefined' && S && Array.isArray(S.co)); await p.waitForTimeout(500);
  await p.evaluate(() => { window.__toasts = []; const t0 = toast; toast = m => { window.__toasts.push(m); t0(m) }; window.__rsb = () => typeof RSB !== 'undefined' && !!RSB;
    window.__renders = []; const r0 = render; render = function () { if (window.__rsb()) window.__renders.push(S.seed); return r0.apply(this, arguments) } }) };
const tapText = async (p, t) => { const l = p.getByRole('button', { name: t }).first(); await l.scrollIntoViewIfNeeded(); await l.tap(); await p.waitForTimeout(150) };
const tapRaw = async (p, onclick) => { const l = p.locator(`[onclick="${onclick}"]`).first(); try { await l.tap({ timeout: 3000, force: true }); return true } catch (e) { return 'not tappable: ' + e.message.split('\n')[0] } };
const waitToast = async (p, re, ms = 10000) => { for (let k = 0; k < ms / 50; k++) { const t = await p.evaluate(() => window.__toasts.join(' | ')); if (re.test(t)) return t; await p.waitForTimeout(50) } return p.evaluate(() => window.__toasts.join(' | ')) };
const snap = (p, T) => p.evaluate(T => ({ id: [S.seed, S.day], cash: +S.cash.toFixed(4), T: JSON.stringify(S.co[T].own), priv: S.co[T].priv || 0, spd: S.spd, apAll: S.apAll }), T);
const localSnap = (p, T) => p.evaluate(async T => { const x = stGet('raider7'); if (!x) return null; const s = await loadStr(x); return { id: [s.seed, s.day], cash: +s.cash.toFixed(4), T: JSON.stringify(s.co[T].own), priv: s.co[T].priv || 0, spd: s.spd } }, T);
const hold = (p, ms, failWrite) => p.evaluate(([ms, fw]) => { const pk = packS; packS = async function () { const r = pk.apply(this, arguments); packS = pk; await new Promise(x => setTimeout(x, ms)); return r };
  if (fw) { const s0 = localStorage.setItem.bind(localStorage); window.__s0 = s0; localStorage.setItem = (k, v) => { if (k === 'raider7') throw new Error('quota'); return s0(k, v) } } }, [ms, failWrite]);
(async () => { const b = await chromium.launch(); console.log('page ' + path.basename(PAGE) + ' sha256 ' + crypto.createHash('sha256').update(fs.readFileSync(PAGE)).digest('hex'));
  const M = await open(b); await M.p.evaluate(WORLD, [20261062, 1e7]); const Bc = await M.p.evaluate(() => packS(1));
  const T = await M.p.evaluate(() => S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i !== HOLD && c.bk === 0 && !mine(c) && topRival(c, 'P') < 10 && !(c.pill > S.day) && mc(c) < 3e4)[5].id); const Bref = await snap(M.p, T); await M.ctx.close();
  for (const [tag, failWrite] of [['I1', false], ['I2', true]]) {
    const P = await open(b); await P.p.evaluate(WORLD, [20261061, 1e7]); await P.p.evaluate(() => save()); await P.p.waitForTimeout(600); const Aref = await snap(P.p, T);
    await P.p.evaluate(T => { pg = ''; G.pick(T); stab = 'a'; render() }, T); await hold(P.p, 2000, failWrite);
    await P.p.evaluate(() => G.imp()); await P.p.fill('#ipt', Bc); await tapText(P.p, '불러오기'); await P.p.waitForTimeout(300);
    const during = await P.p.evaluate(() => ({ rsb: window.__rsb(), seed: S.seed })); const t1 = await tapRaw(P.p, `G.tender(${T},50)`); const t2 = await tapRaw(P.p, 'G.spd(3)');
    const told = await waitToast(P.p, /불러왔|실패/); await P.p.waitForTimeout(400); if (failWrite) await P.p.evaluate(() => { localStorage.setItem = window.__s0 });
    const now = await snap(P.p, T), loc = await localSnap(P.p, T), rend = await P.p.evaluate(() => window.__renders.slice());
    console.log('info ' + tag + ' during the hold: ' + JSON.stringify(during) + '; taps: tender ' + t1 + ', 3× ' + t2 + '; renders while committing ' + JSON.stringify(rend));
    if (!failWrite) ok(/불러왔/.test(told) && !/공개매수/.test(told) && rend.length === 0 && JSON.stringify(now) === JSON.stringify(Bref) && JSON.stringify(loc) === JSON.stringify({ id: Bref.id, cash: Bref.cash, T: Bref.T, priv: Bref.priv, spd: Bref.spd }),
      tag + ' taps on the old screen while B commits: told "' + told + '"; game ' + JSON.stringify(now) + ' vs saved B ' + JSON.stringify(Bref) + '; local ' + JSON.stringify(loc));
    else ok(/실패/.test(told) && !/불러왔/.test(told) && !/공개매수/.test(told) && rend.length === 0 && JSON.stringify(now) === JSON.stringify(Aref), tag + ' device write fails, taps during the commit: told "' + told + '"; game ' + JSON.stringify(now) + ' vs A ' + JSON.stringify(Aref));
    await P.p.evaluate(() => { closeMd(); sel = -1; pg = ''; S.spd = 0; render() }); await tapRaw(P.p, 'G.spd(3)'); await P.p.waitForTimeout(150); const sp = await P.p.evaluate(() => S.spd); await P.p.evaluate(() => { S.spd = 0 });
    ok(sp === 3, tag + ' after the restore a tap works again (3× → speed ' + sp + ')'); ok(P.errs.length === 0, tag + ' page: no page error ' + P.errs.slice(0, 2).join(' | ')); await P.ctx.close() }
  // ---------- I3 Android native write fails
  { const P = await open(b, true); await P.p.evaluate(WORLD, [20261061, 0]); await P.p.evaluate(() => save()); await P.p.waitForTimeout(800); const Aid = await P.p.evaluate(() => [S.seed, S.day]);
    const nat0 = await P.p.evaluate(async () => { const s = await loadStr(localStorage.getItem('nat_raider7')); return [s.seed, s.day] }); await P.p.evaluate(() => localStorage.setItem('__natfail', '1'));
    await P.p.evaluate(() => G.imp()); await P.p.fill('#ipt', Bc); await tapText(P.p, '불러오기'); const told = await waitToast(P.p, /불러왔|실패/); await P.p.waitForTimeout(400); const now = await P.p.evaluate(() => [S.seed, S.day]);
    await P.p.reload(); await ready(P.p); const after = await P.p.evaluate(() => [S.seed, S.day]);
    const consistent = /불러왔/.test(told) ? JSON.stringify(after) === JSON.stringify(now) : /실패/.test(told) && JSON.stringify(now) === JSON.stringify(Aid) && JSON.stringify(after) === JSON.stringify(Aid);
    ok(consistent, 'I3 Android.save false (native file ' + JSON.stringify(nat0) + '): B pasted → "' + told + '", game ' + JSON.stringify(now) + ', after a reload ' + JSON.stringify(after));
    ok(P.errs.length === 0, 'I3 page: no page error ' + P.errs.slice(0, 2).join(' | ')); await P.ctx.close() }
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
