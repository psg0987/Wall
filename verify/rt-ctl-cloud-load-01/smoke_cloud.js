// RT-CTL-CLOUD-LOAD-01 browser smoke (Claude): 클라우드 저장·불러오기 through the real settings buttons, with a MOCK cloud (window.claude.use
// stubbed before the page loads: an in-memory db with collection(path).doc(id).get()/set() and a user id). No real claude.ai account is used.
// Chromium (Playwright) 412x915 mobile EMULATION, not a Galaxy device. PAGE.html = site form of the branch page.
// K1 page 1: CEO event open (3× speed, then the event window), CEO resigned (function call: the window covers the button), 설정 → 클라우드 1 저장 tap.
// K2 page 2 (other local game, same mock cloud): 클라우드 목록 보기 → 클라우드 1 불러오기 taps → controlling-holder window, paused, speed 3 kept,
//    nothing carried out; 경영진에게 맡기기 tap → carried out once, speed 3; the autosave holds the cloud game.
// K3 page 3 (other local game; cloud 2 = a piece missing, cloud 3 = a save that breaks during restore): 불러오기 taps → toast 실패, the game and
//    the local save are unchanged, and after the page's own 8-second autosave timer the local save still holds the old game.
// usage: node verify/rt-ctl-cloud-load-01/smoke_cloud.js PAGE.html   (env SHOTS=dir)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), crypto = require('crypto');
const PAGE = process.argv[2], SHOTS = process.env.SHOTS || '/tmp'; let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ }; const info = m => console.log('info ' + m);
const MOCK = docs0 => { const docs = Object.assign({}, docs0 || {}); window.__cloud = docs;
  const db = { collection: p => ({ doc: id => ({ get: async () => ({ exists: (p + '/' + id) in docs, data: () => docs[p + '/' + id] }), set: async v => { docs[p + '/' + id] = JSON.parse(JSON.stringify(v)) } }) }) };
  window.claude = { use: async n => n === 'db' ? db : n === 'user' ? { id: async () => 'u1' } : null } };
async function open(b, docs, local, seed) { const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }); const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_TUNNEL/.test(m.text())) errs.push('console ' + m.text()) });
  await p.addInitScript(MOCK, docs); if (local) await p.addInitScript(v => { try { if (!localStorage.getItem('__s')) { localStorage.setItem('raider7', v); localStorage.setItem('__s', '1') } } catch (e) {} }, local);
  await p.goto('file://' + path.resolve(PAGE)); await p.waitForFunction(() => typeof S !== 'undefined' && S && Array.isArray(S.co)); await p.waitForTimeout(500);
  if (seed) await p.evaluate(sd => { Math.random = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 })(sd);
    init(Object.assign(defCfg(), { tut: 0, seed: sd })); S.tut = 99; mdl = null; pg = ''; sel = -1; S.spd = 0; for (let d = 0; d < 20; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null } S.ev2 = null; render() }, seed);
  await p.evaluate(() => { window.__toast = () => { const e = document.getElementById('ts'); return e && !e.hidden ? e.textContent : '' } }); return { ctx, p, errs } }
const tap = async (p, onclick) => { const l = p.locator(`[onclick="${onclick}"]`).first(); await l.scrollIntoViewIfNeeded(); await l.tap(); await p.waitForTimeout(150) };
const tapText = async (p, t) => { const l = p.getByRole('button', { name: t }).first(); await l.scrollIntoViewIfNeeded(); await l.tap(); await p.waitForTimeout(150) };
const modal = p => p.evaluate(() => { const m = document.getElementById('md'); return m && !m.hidden ? { o: mdl && mdl.o ? mdl.o.map(o => o[0]) : [], text: m.innerText.replace(/\s+/g, ' ') } : null });
const localId = p => p.evaluate(async () => { const x = localStorage.getItem('raider7'); if (!x) return null; const s = await loadStr(x); return s ? [s.seed, s.day] : 'bad' });
(async () => { const b = await chromium.launch(); console.log('page ' + path.basename(PAGE) + ' sha256 ' + crypto.createHash('sha256').update(fs.readFileSync(PAGE)).digest('hex'));
  // ---------- K1 save to the mock cloud through the button
  const A = await open(b, {}, null, 20261041);
  const ev = await A.p.evaluate(() => { const c = S.co.filter(x => !x.dead && !x.priv && !x.kd && x.i !== HOLD && x.bk === 0)[3]; for (const k of Object.keys(c.own)) setOwn(c, k, 0); setOwn(c, 'P', 60); ctlAll(); S.ceo = c.id; render();
    const e = EV2.find(z => z.id !== 'offer' && z.el(c) && z.o && z.o.length >= 2 && !z.sl) || EV2.find(z => z.id !== 'offer' && z.o && z.o.length >= 2 && !z.sl); return { c: c.id, tk: c.tk, e: e.id, ai: e.ai(c, e.mk(c))[0] } });
  await tap(A.p, 'G.spd(3)'); await A.p.evaluate(([X, E]) => { const c = S.co[X], e = EV2.find(z => z.id === E), x = e.mk(c); S.ev2 = { id: e.id, c: X, x, v: 0, m: evWho(c) }; evMd(); render() }, [ev.c, ev.e]);
  await A.p.evaluate(X => G.mg(X, 'ceo'), ev.c); // the event window covers the company screen: function call
  const a0 = await A.p.evaluate(() => ({ m: S.ev2.m, spd: S.spd, sp0: S.sp0, ceo: S.ceo, id: [S.seed, S.day] })); ok(a0.m === 'ceo' && a0.spd === 0 && a0.sp0 === 3 && a0.ceo === -1, 'K1 open CEO-mode event, paused (speed 3 kept), CEO resigned, control kept ' + JSON.stringify(a0));
  await A.p.evaluate(() => { closeMd(); S.spd = 0; G.pg('set') }); await A.p.evaluate(() => { S.sp0 = 3; S.spd = 0 });   // closing the window to reach the settings page gave the speed back: put the paused state back for the save
  await tap(A.p, 'G.cList()'); await tap(A.p, 'G.cSave(1)'); await A.p.waitForTimeout(800); const docs = await A.p.evaluate(() => window.__cloud), t1 = await A.p.evaluate(() => __toast());
  ok(Object.keys(docs).some(k => /\/s1$/.test(k)) && /저장했어요/.test(t1), 'K1 설정 → 클라우드 목록 보기 → 클라우드 1 저장 taps: mock cloud has ' + Object.keys(docs).length + ' docs, toast "' + t1 + '"');
  ok(A.errs.length === 0, 'K1 page: no page error ' + A.errs.slice(0, 2).join(' | ')); await A.ctx.close();
  // ---------- K2 load from the mock cloud through the button
  const B2 = await open(b, docs, null, 20261042); await B2.p.evaluate(() => save()); await B2.p.waitForTimeout(500); const own0 = await localId(B2.p);
  await B2.p.evaluate(E => { const e = EV2.find(z => z.id === E); window.__go0 = e.go; window.__goes = []; e.go = function (c, x, k, v) { window.__goes.push([k, v]); return window.__go0.apply(this, arguments) } }, ev.e);
  await B2.p.evaluate(() => G.pg('set')); await tap(B2.p, 'G.cList()'); await B2.p.waitForTimeout(300); await tap(B2.p, 'G.cLoad(1)'); await B2.p.waitForTimeout(800);
  const md = await modal(B2.p), k2 = await B2.p.evaluate(() => ({ id: [S.seed, S.day], m: S.ev2 && S.ev2.m, spd: S.spd, sp0: S.sp0, goes: window.__goes.length, toast: __toast(), pg, sel }));
  ok(JSON.stringify(k2.id) === JSON.stringify(a0.id) && md && md.o[0] === '경영진에게 맡기기' && /^개입한다/.test(md.o[1] || '') && !/CEO로서 직접 결정합니다/.test(md.text) && k2.m === 'own' && k2.spd === 0 && k2.sp0 === 3 && k2.goes === 0 && /불러왔어요/.test(k2.toast),
    'K2 클라우드 목록 보기 → 클라우드 1 불러오기 taps: cloud game ' + JSON.stringify(k2.id) + ' (local game was ' + JSON.stringify(own0) + '), window [' + (md && md.o.join(' / ')) + '], paused, nothing carried out, toast "' + k2.toast + '"');
  await B2.p.screenshot({ path: path.join(SHOTS, 'K2_cloud_restored_window.png') });
  const lw = await localId(B2.p); ok(JSON.stringify(lw) === JSON.stringify(a0.id), 'K2 the autosave after the load holds the cloud game ' + JSON.stringify(lw));
  await tapText(B2.p, '경영진에게 맡기기'); await B2.p.waitForTimeout(1200); const k2b = await B2.p.evaluate(() => ({ goes: window.__goes.slice(), ev2: !!S.ev2, md: !!mdl, spd: S.spd }));
  ok(k2b.goes.length === 1 && k2b.goes[0][0] === ev.ai && !k2b.ev2 && !k2b.md && k2b.spd === 3, 'K2 경영진에게 맡기기 tap → management plan "' + ev.ai + '" carried out once, event closed, speed 3, 1.2 s of play: still once ' + JSON.stringify(k2b));
  ok(B2.errs.length === 0, 'K2 page: no page error ' + B2.errs.slice(0, 2).join(' | ')); await B2.ctx.close();
  // ---------- K3 failures through the button: missing piece (cloud 2), save that breaks during restore (cloud 3)
  const bad = Object.assign({}, docs); const P = 'data/users/u1/'; bad[P + 's2'] = Object.assign({}, docs[P + 's1']); for (const k of Object.keys(docs)) if (k.startsWith(P + 's1p')) bad[P + 's2' + k.slice(P.length + 2)] = docs[k];
  delete bad[P + 's2p0']; bad[P + 's3'] = { n: 1, d: 'broken', w: 0, t: 0, v: 12 }; bad[P + 's3p0'] = { x: '{"v":13,"co":[null],"R":[],"d":[],"mxd":[]}' };
  const C3 = await open(b, bad, null, 20261043); await C3.p.evaluate(() => save()); await C3.p.waitForTimeout(500); const own3 = await localId(C3.p);
  for (const [slot, want] of [[2, /조각 누락/], [3, /복원 오류/]]) {
    await C3.p.evaluate(() => G.pg('set')); if (await C3.p.locator('[onclick="G.cList()"]').count()) { await tap(C3.p, 'G.cList()'); await C3.p.waitForTimeout(300) } const j0 = await C3.p.evaluate(() => JSON.stringify(S)); await tap(C3.p, `G.cLoad(${slot})`); await C3.p.waitForTimeout(500);
    const r = await C3.p.evaluate(j0 => ({ same: JSON.stringify(S) === j0, toast: __toast(), pg }), j0); const l1 = await localId(C3.p);
    ok(r.same && want.test(r.toast) && JSON.stringify(l1) === JSON.stringify(own3), 'K3 클라우드 ' + slot + ' 불러오기 tap: toast "' + r.toast + '", game unchanged ' + r.same + ', local save unchanged ' + JSON.stringify(l1)) }
  await C3.p.waitForTimeout(9000); const l9 = await localId(C3.p), still = await C3.p.evaluate(() => [S.seed, S.day]);
  ok(JSON.stringify(l9) === JSON.stringify(own3) && JSON.stringify(still) === JSON.stringify(own3), 'K3 after the page\'s 8-second autosave timer: local save still the old game ' + JSON.stringify(l9) + ', running game ' + JSON.stringify(still));
  await C3.p.screenshot({ path: path.join(SHOTS, 'K3_cloud_failure.png') }); ok(C3.errs.length === 0, 'K3 page: no page error ' + C3.errs.slice(0, 2).join(' | ')); await C3.ctx.close();
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
