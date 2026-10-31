// RT-CTL-PREFINAL-FIX-02 browser smoke (Claude): RT-CTL-PREFINAL-SMOKE-01's smoke with the C part rewritten for F1/F2 (4 restore paths: boot, import,
// slot, file; speed / pause; decide once; no second run) and the E check turned into an assertion for F3.
// Based on RT-CTL-PREFINAL-SMOKE-01 browser smoke (Claude). Chromium (Playwright) with a 412x915 mobile viewport = screen-size EMULATION, not a Galaxy device.
// PAGE.html must be the site form of the branch page (build/site.py skeleton + dist/raider.html), written to a scratch file.
// World set-up (who holds what) is done with game functions in page.evaluate (fixtures); every action under test is a real tap on the rendered UI,
// except where a modal covers the control (said in the line). Navigation to a page/company uses G.pg / G.pick (the same calls the menu makes).
// A  자동경영: 전체 ON/OFF, 회사 화면 자동 경영 버튼, 관리 화면 행 버튼, 새로 지배하는 회사 옵션 ON/OFF + 공개매수 탭, 저장 → 재시작/코드 가져오기 복원
// C  CEO 사건창: CEO 취임 탭, 사건창이 열린 채 CEO 사임(사건창이 화면을 덮어 함수 호출) → 저장 → 재시작 복원 → CEO 선택지 탭 → 지배주주 경로
//    + 코드 가져오기·슬롯 복원에서 같은 저장
// D  판정 보류 은행: 은행 변경 목록 표시와 행 탭 차단, 중립 은행 행 탭은 변경
// E  기존 거래 은행이 판정 보류일 때 회사 화면 표시 (기록)
// usage: node verify/rt-ctl-prefinal-smoke-01/smoke_prefinal.js PAGE.html   (env SHOTS=dir for screenshots)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), crypto = require('crypto');
const PAGE = process.argv[2]; const SHOTS = process.env.SHOTS || '/tmp'; let fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++ }; const info = m => console.log('info ' + m);
const H = `window.__sum = () => ({ day: S.day, apAll: S.apAll, ceo: S.ceo, ev2: S.ev2 ? [S.ev2.id, S.ev2.c, S.ev2.m] : null, co: S.co.map(c => [c.tk, c.ctl || '', c.ap || 0, c.g, c.pay, c.sweep, c.ps, c.ln]) });
window.__ref = x => { const { r, ni, A, cs, nol, kd, i, dg, cg, ps0 } = x, roa = ni * 4 / Math.max(1, A), gap = kd ? 0 : dg - cg;
  let s = { g: r >= 4 ? 0 : roa > .1 && r <= 2 && gap > -.01 ? .1 : .04, pay: r >= 4 || nol > A * .05 ? 0 : .3, sweep: r >= 3 ? 2 : 1, ps: kd ? ps0 : (r <= 3 && roa > .06 ? 1 : 0) };
  if (!kd && i !== HOLD) { const tc = A * .06, halt = r >= 4 || (r === 3 && (ni <= 0 || cs < tc * .5 || gap < -.02)) || (ni < 0 && cs < tc);
    s = { g: halt ? 0 : roa > .1 && r <= 2 && gap > -.01 ? .1 : .04, pay: (r >= 4 || ni <= 0 || nol > A * .05 || (r === 3 && cs < tc)) ? 0 : r === 3 ? .15 : .3, sweep: r >= 3 || ni <= 0 ? 2 : 1, ps: r <= 3 && roa > .06 && (r <= 2 || cs >= tc * .5) ? 1 : 0 } }
  if (i === HOLD) s = { ...s, g: 0, ps: 0, pay: 0 }; return s };
window.__wrap = () => { if (window.__a0) return; window.__a0 = autop; window.__log = []; autop = function (c) { const x = { id: c.id, r: rating(c), ni: c.ni, A: c.A, cs: c.cs, nol: c.nol, kd: c.kd, i: c.i, dg: S.dg[c.i], cg: S.cg[c.i], ps0: c.ps }; const o = window.__a0(c); x.got = { g: c.g, pay: c.pay, sweep: c.sweep, ps: c.ps }; window.__log.push(x); return o } };
window.__same = (a, b) => a.g === b.g && a.pay === b.pay && a.sweep === b.sweep && a.ps === b.ps;
window.__rule = ids => window.__log.filter(x => !ids || ids.includes(x.id)).every(x => window.__same(x.got, window.__ref(x)));
window.__world = seed => { Math.random = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 })(seed);
  init(Object.assign(defCfg(), { tut: 0, seed })); S.tut = 99; mdl = null; pg = ''; sel = -1; S.spd = 0; S.apAll = 0; S.ev2 = null; closeMd(); S.spd = 0; render() };
window.__iso = c => { for (const k of Object.keys(c.own)) setOwn(c, k, 0); for (const t of Object.keys(c.pos)) setOwn(S.co[+t], 'c' + c.id, 0) };
window.__ords = () => S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i !== HOLD && c.bk === 0);
window.__toast = () => { const e = document.getElementById('ts'); return e && !e.hidden ? e.textContent : '' };`;
async function open(b, pre) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  const errs = [], net = []; const p = await ctx.newPage(); p.on('pageerror', e => errs.push('pageerror ' + e.message));
  p.on('requestfailed', r => { if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(r.url())) net.push(r.url().split('?')[0]) });
  p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()) });
  if (pre) await p.addInitScript(v => { try { if (!localStorage.getItem('__s')) { localStorage.setItem('raider7', v); localStorage.setItem('__s', '1') } } catch (e) {} }, pre);
  await p.goto('file://' + path.resolve(PAGE)); await p.waitForFunction(() => typeof S !== 'undefined' && S && Array.isArray(S.co)); await p.waitForTimeout(500);
  await p.evaluate(H); return { ctx, p, real: () => errs.filter(e => !(net.length && /ERR_TUNNEL_CONNECTION_FAILED/.test(e))) } }
const tapOn = async (p, onclick) => { const l = p.locator(`[onclick="${onclick}"]`).first(); await l.scrollIntoViewIfNeeded(); await l.tap(); await p.waitForTimeout(120) };
const tapText = async (p, re) => { const l = p.getByRole('button', { name: re }).first(); await l.scrollIntoViewIfNeeded(); await l.tap(); await p.waitForTimeout(120) };
const modal = p => p.evaluate(() => { const m = document.getElementById('md'); return m && !m.hidden ? { t: mdl && mdl.t, o: mdl && mdl.o ? mdl.o.map(o => o[0]) : [], text: m.innerText.replace(/\s+/g, ' ').slice(0, 400) } : null });
const pickCo = (p, id, tab) => p.evaluate(([id, tab]) => { closeMd(); pg = ''; G.pick(id); if (tab) { stab = 'o'; render() } }, [id, tab]);

(async () => { const b = await chromium.launch(); console.log('page ' + path.basename(PAGE) + ' sha256 ' + crypto.createHash('sha256').update(fs.readFileSync(PAGE)).digest('hex'));
  // ================= A 자동경영 =================
  console.log('== A 자동경영 (seed 20261031)');
  const A = await open(b); await A.p.evaluate('window.__world(20261031); window.__wrap()');
  const ID = await A.p.evaluate(() => { const o = __ords().sort((x, y) => y.A - x.A), bk = S.co.filter(c => !c.dead && !c.priv && c.kd === 1 && c.bk === 0).sort((x, y) => y.A - x.A);
    const mineSet = [o[3], o[6], o[9], o[12], bk[2]]; for (const c of mineSet) setOwn(c, 'P', 60); ctlAll(); S.cash = 1e7; render();
    const tg = __ords().filter(c => !mine(c) && topRival(c, 'P') < 10 && !(c.pill > S.day) && mc(c) < 3e4 && !mineSet.some(m => m.i === c.i)).sort((x, y) => x.A - y.A);
    return { mine: mineSet.map(c => c.id), X: o[3].id, T1: tg[5].id, T2: tg[9].id } });
  // A1 전체 ON / OFF
  await A.p.evaluate(() => { G.pg('set') }); await tapText(A.p, '자동경영 일괄 관리'); ok(await A.p.evaluate(() => pg === 'auto'), 'A1 설정 → 자동경영 일괄 관리 tap opens the page');
  await A.p.evaluate(() => window.__log.length = 0); await tapText(A.p, '전체 ON');
  let st = await A.p.evaluate(() => ({ on: S.co.filter(c => mine(c) && c.ap).length, n: S.co.filter(mine).length, calls: window.__log.length, rule: window.__rule(), t: __toast() }));
  ok(st.on === st.n && st.calls === st.n && st.rule, 'A1 전체 ON tap: ' + st.on + '/' + st.n + ' ON, ' + st.calls + ' decisions, each equal to the A4R rule; toast "' + st.t + '"');
  await A.p.evaluate(() => window.__log.length = 0); await tapText(A.p, '전체 OFF');
  st = await A.p.evaluate(() => ({ on: S.co.filter(c => mine(c) && c.ap).length, calls: window.__log.length, t: __toast() })); ok(st.on === 0 && st.calls === 0, 'A1 전체 OFF tap: 0 ON, no decision run; toast "' + st.t + '"');
  await A.p.screenshot({ path: path.join(SHOTS, 'A1_auto_page.png') });
  // A2 회사 화면 버튼 + 관리 화면 행 버튼
  await pickCo(A.p, ID.X); await tapOn(A.p, "G.stab('m')"); const apBtn = `G.ap(${ID.X})`; const lab0 = (await A.p.locator(`[onclick="${apBtn}"]`).first().textContent()).trim();
  await A.p.evaluate(() => window.__log.length = 0); await tapOn(A.p, apBtn);
  st = await A.p.evaluate(X => ({ ap: S.co[X].ap, calls: window.__log.filter(x => x.id === X).length, all: window.__log.length, rule: window.__rule([X]), t: __toast() }), ID.X); const lab1 = (await A.p.locator(`[onclick="${apBtn}"]`).first().textContent()).trim();
  ok(st.ap === 1 && st.calls === 1 && st.all === 1 && st.rule, 'A2 회사 화면 경영 탭 "' + lab0 + '" tap → ON, one decision (= rule), button now "' + lab1 + '", toast "' + st.t + '"');
  await A.p.screenshot({ path: path.join(SHOTS, 'A2_company_ops_on.png') });
  await A.p.evaluate(() => window.__log.length = 0); await tapOn(A.p, apBtn); st = await A.p.evaluate(X => ({ ap: S.co[X].ap, calls: window.__log.length }), ID.X);
  ok(st.ap === 0 && st.calls === 0, 'A2 tap again → OFF, no decision run');
  await A.p.evaluate(() => { closeMd(); sel = -1; G.pg('auto') }); await A.p.evaluate(() => window.__log.length = 0); await tapText(A.p, /^자동경영 켜기$/);
  st = await A.p.evaluate(() => ({ on: S.co.filter(c => mine(c) && c.ap).length, calls: window.__log.length, rule: window.__rule() })); ok(st.on === 1 && st.calls === 1 && st.rule, 'A2 관리 화면 행 "자동경영 켜기" tap → exactly one ON, one decision (= rule)');
  // A3 새로 지배하는 회사 옵션 + 공개매수
  const optBefore = await A.p.evaluate(() => S.apAll); await tapText(A.p, '새로 지배하는 회사 자동경영 켜기'); const optOn = await A.p.evaluate(() => S.apAll);
  ok(optBefore === 0 && optOn === 1, 'A3 "새로 지배하는 회사 자동경영 켜기" tap → option ON (S.apAll ' + optBefore + ' → ' + optOn + ')');
  for (const [tag, T, want] of [['ON', ID.T1, 1], ['OFF', ID.T2, 0]]) {
    if (tag === 'OFF') { await A.p.evaluate(() => { closeMd(); sel = -1; G.pg('auto') }); await tapText(A.p, '새로 지배하는 회사 자동경영 끄기'); ok(await A.p.evaluate(() => S.apAll) === 0, 'A3 "새로 지배하는 회사 자동경영 끄기" tap → option OFF') }
    await pickCo(A.p, T); await tapOn(A.p, "G.stab('a')"); await A.p.evaluate(() => window.__log.length = 0); const before = await A.p.evaluate(T => [mine(S.co[T]), S.co[T].ap || 0], T);
    await tapOn(A.p, `G.tender(${T},50)`);
    st = await A.p.evaluate(T => { const c = S.co[T]; return { tk: c.tk, mine: mine(c), priv: c.priv, own: c.own.P, ap: c.ap || 0, calls: window.__log.filter(x => x.id === T).length, other: window.__log.filter(x => x.id !== T).length, rule: window.__rule([T]), log: S.log && S.log[0] ? String(S.log[0].t || S.log[0]).slice(0, 60) : '' } }, T);
    ok(!before[0] && st.mine && st.ap === want && st.calls === want && st.other === 0 && st.rule, 'A3 option ' + tag + ': 인수 탭 "+50%" 공개매수 tap on ' + st.tk + ' → controlled (P ' + st.own + '%, private ' + st.priv + '), 자동경영 ' + (st.ap ? 'ON' : 'OFF') + ', decisions ' + st.calls + (want ? ' (= rule)' : ''));
  }
  // A4 저장 → 재시작 / 코드 가져오기
  await A.p.evaluate(() => { closeMd(); sel = -1; pg = ''; render() }); const ref = await A.p.evaluate('window.__sum()'); await A.p.evaluate(() => save()); await A.p.waitForTimeout(400);
  const full = await A.p.evaluate(() => localStorage.getItem('raider7')), exp = await A.p.evaluate(() => packS(1));
  info('A4 save: ' + ref.co.filter(c => c[1] === 'P').length + ' controlled, ' + ref.co.filter(c => c[1] === 'P' && c[2]).length + ' 자동경영 ON, option ' + ref.apAll + ', full ' + Math.round(full.length / 1024) + 'KB, export ' + Math.round(exp.length / 1024) + 'KB');
  ok(A.real().length === 0, 'A page: no page error ' + A.real().slice(0, 2).join(' | ')); await A.ctx.close();
  const R1 = await open(b, full); let s = await R1.p.evaluate('window.__sum()'); ok(JSON.stringify(s) === JSON.stringify(ref), 'A4 재시작(자동 저장에서 부팅): day, option, every company ctl/ap/g/pay/sweep/ps/bank equal');
  await R1.p.evaluate('window.__wrap(); for (let d = 0; d < 3; d++) { step(); if (S.ev2) { S.ev2 = null; mdl = null } } S.spd = 0'); s = await R1.p.evaluate('window.__sum()');
  ok(s.co.every((c, k) => c[2] === ref.co[k][2]) && s.apAll === ref.apAll, 'A4 3 days after boot: no 자동경영 flag changed, option kept'); ok(R1.real().length === 0, 'A4 boot page: no page error'); await R1.ctx.close();
  const R2 = await open(b); await R2.p.evaluate(() => G.imp()); await R2.p.fill('#ipt', exp); await tapText(R2.p, '불러오기'); await R2.p.waitForTimeout(300); s = await R2.p.evaluate('window.__sum()');
  ok(JSON.stringify(s) === JSON.stringify(ref), 'A4 세이브 가져오기 (코드 붙여넣기 → 불러오기 tap): all equal'); ok(R2.real().length === 0, 'A4 import page: no page error'); await R2.ctx.close();

  // ================= C CEO 사건창 =================
  console.log('== C CEO 사건창 저장 → CEO가 아닌 상태로 복원, 4 paths (seed 20261032)');
  const C = await open(b); await C.p.evaluate('window.__world(20261032)');
  const cx = await C.p.evaluate(() => { const c = __ords()[3]; __iso(c); setOwn(c, 'P', 60); ctlAll(); render(); const e = EV2.find(z => z.id !== 'offer' && z.el(c) && z.o && z.o.length >= 2 && !z.sl) || EV2.find(z => z.id !== 'offer' && z.el(c) && z.o && z.o.length >= 2);
    return { id: c.id, tk: c.tk, e: e.id, keys: e.o.map(o => o[1]), labels: e.o.map(o => o[0]), ai: e.ai(c, e.mk(c))[0] } });
  await pickCo(C.p, cx.id); await tapOn(C.p, "G.stab('m')"); await tapOn(C.p, `G.mg(${cx.id},'ceo')`); ok(await C.p.evaluate(X => S.ceo === X && mine(S.co[X]), cx.id), 'C0 경영 탭 "내가 CEO 취임" tap → CEO of ' + cx.tk);
  await tapOn(C.p, 'G.pick(-1)'); await tapOn(C.p, 'G.spd(3)');   // close the company sheet (닫기), then the 3× speed button const spd0 = await C.p.evaluate(() => S.spd); ok(spd0 === 3, 'C0 "3×" speed tap → speed 3');
  await C.p.evaluate(([X, E]) => { const c = S.co[X], e = EV2.find(z => z.id === E), x = e.mk(c); S.ev2 = { id: e.id, c: X, x, v: e.sl ? +(e.sv(c, x)).toFixed(2) : 0, m: evWho(c) }; evMd(); render() }, [cx.id, cx.e]);
  let md = await modal(C.p); ok(!!md && /CEO로서 직접 결정합니다/.test(md.text) && (await C.p.evaluate(() => [S.ev2.m, S.spd, S.sp0].join())) === 'ceo,0,3', 'C0 사건창 opened in CEO mode, game paused (speed 0, 3 kept): "' + (md && md.t) + '" [' + (md && md.o.join(' / ')) + ']');
  await C.p.evaluate(X => G.mg(X, 'ceo'), cx.id); // the event modal covers the company screen, so the resign button cannot be tapped: function call
  const res = await C.p.evaluate(X => ({ ceo: S.ceo, mine: mine(S.co[X]), m: S.ev2 && S.ev2.m }), cx.id); ok(res.ceo !== cx.id && res.mine && res.m === 'ceo', 'C0 resigned as CEO while the window is open (G.mg call), control kept, saved mode still ceo ' + JSON.stringify(res));
  await C.p.evaluate(() => save()); await C.p.waitForTimeout(400); const cfull = await C.p.evaluate(() => localStorage.getItem('raider7')), cexp = await C.p.evaluate(() => packS(1));
  ok(C.real().length === 0, 'C page: no page error'); await C.ctx.close();
  const tmpf = path.join(require('os').tmpdir(), 'raider-ceo-event-save.txt'); fs.writeFileSync(tmpf, cexp);
  const wrapGo = P => P.evaluate(E => { const e = EV2.find(z => z.id === E); window.__go0 = e.go; window.__goes = []; e.go = function (c, x, k, v) { window.__goes.push([k, v]); return window.__go0.apply(this, arguments) } }, cx.e);
  const PATHS = [['C1 재시작 (자동 저장에서 부팅)', 'boot'], ['C2 세이브 가져오기 (코드 붙여넣기 → 불러오기 tap)', 'import'], ['C3 슬롯 불러오기 (설정 → 슬롯 3 불러오기 tap)', 'slot'], ['C4 파일 가져오기 (input type=file)', 'file']];
  for (const [tag, how] of PATHS) {
    const P2 = await open(b, how === 'boot' ? cfull : null); if (how !== 'boot') await wrapGo(P2.p);
    if (how === 'import') { await P2.p.evaluate(() => G.imp()); await P2.p.fill('#ipt', cexp); await tapText(P2.p, '불러오기') }
    else if (how === 'slot') { await P2.p.evaluate(v => { stSet('r6s3', v); stSet('r6m3', JSON.stringify({ d: 'test', w: 0 })); G.pg('set') }, cexp); const n = await P2.p.locator('[onclick="G.ld(3)"]').count(); if (n) await tapOn(P2.p, 'G.ld(3)'); else { info(tag + ': no 불러오기 button for slot 3 on the settings page, G.ld(3) called'); await P2.p.evaluate(() => G.ld(3)) } }
    else if (how === 'file') { await P2.p.evaluate(() => G.pg('set')); await P2.p.waitForTimeout(150); info(tag + ': file inputs on the settings page ' + await P2.p.locator('input[type=file]').count()); await P2.p.locator('input[type=file][onchange="G.fLoad(this)"]').first().setInputFiles(tmpf) }
    await P2.p.waitForTimeout(500); if (how === 'boot') await wrapGo(P2.p);
    md = await modal(P2.p); const r = await P2.p.evaluate(X => ({ ceo: S.ceo, mine: mine(S.co[X]), m: S.ev2 && S.ev2.m, spd: S.spd, sp0: S.sp0, goes: window.__goes.length }), cx.id);
    ok(r.ceo !== cx.id && r.mine && md && md.o[0] === '경영진에게 맡기기' && /^개입한다/.test(md.o[1] || '') && !/CEO로서 직접 결정합니다/.test(md.text) && r.m === 'own' && r.spd === 0 && r.sp0 === 3 && r.goes === 0,
      tag + ': window restored as the controlling-holder window [' + (md && md.o.join(' / ')) + '], no CEO wording, paused (speed ' + r.spd + ', ' + r.sp0 + ' kept), nothing carried out by the restore');
    await P2.p.screenshot({ path: path.join(SHOTS, how + '_restored_window.png') });
    const d0 = await P2.p.evaluate(() => S.day); await P2.p.waitForTimeout(1500); const d1 = await P2.p.evaluate(() => [S.day, !!mdl, S.ev2 && S.ev2.id]);
    ok(d1[0] === d0 && d1[1] && d1[2] === cx.e, tag + ': 1.5 s later the game has not moved (day ' + d0 + ' → ' + d1[0] + ') and the same event is waiting');
    await tapText(P2.p, '경영진에게 맡기기'); await P2.p.waitForTimeout(150); const a = await P2.p.evaluate(() => ({ goes: window.__goes.slice(), ev2: !!S.ev2, md: !!mdl, spd: S.spd }));
    ok(a.goes.length === 1 && a.goes[0][0] === cx.ai && !a.ev2 && !a.md && a.spd === 3, tag + ': "경영진에게 맡기기" tap → management plan "' + cx.ai + '" carried out once, event closed, speed back to ' + a.spd);
    if (how === 'boot') { await P2.p.evaluate(() => { S.spd = 0 }); await P2.p.evaluate(() => save()); await P2.p.waitForTimeout(400); const again = await P2.p.evaluate(() => localStorage.getItem('raider7')); await P2.ctx.close();
      const P3 = await open(b, again); const z = await P3.p.evaluate(() => ({ ev2: !!S.ev2, md: !!mdl })); ok(!z.ev2 && !z.md, 'C1 save after deciding and boot again: no event, no window (not carried out twice)'); ok(P3.real().length === 0, 'C1 second boot: no page error'); await P3.ctx.close() }
    else { ok(P2.real().length === 0, tag + ': no page error'); await P2.ctx.close() } }

  // ================= D / E 판정 보류 은행 =================
  console.log('== D/E 판정 보류 은행 (seed 20261033)');
  const D = await open(b); await D.p.evaluate('window.__world(20261033)');
  const dx = await D.p.evaluate(() => { const bs = S.co.filter(c => !c.dead && c.kd === 1 && !c.priv).sort((x, y) => y.A - x.A), [p1, p2] = bs; __iso(p1); __iso(p2); setOwn(p1, 'c' + p2.id, 60); setOwn(p2, 'c' + p1.id, 60); p1.ctl = p2.ctl = null; ctlAll();
    const nb = bs.find(b => b !== p1 && b !== p2 && !b.ctl), rb = bs.find(b => b.ctl && b.ctl[0] === 'r'), c = __ords().find(x => x.ln !== p1.id && x.ln !== p2.id && x.ln !== nb.id); __iso(c); setOwn(c, 'P', 60); ctlAll(); S.cash = 1e6; render();
    return { p1: p1.id, p1tk: p1.tk, p1ctl: p1.ctl, p2ctl: p2.ctl, nb: nb.id, nbtk: nb.tk, rb: rb ? rb.tk : null, c: c.id, ctk: c.tk, ln0: c.ln } });
  ok(dx.p1ctl === '?' && dx.p2ctl === '?', 'D0 pending banks ' + dx.p1tk + ' (largest bank) and its pair; my company ' + dx.ctk + ' borrows from bank #' + dx.ln0);
  const fin = () => D.p.evaluate(X => { const c = S.co[X]; return [c.ln, c.frz, +c.cs.toFixed(6), +c.D.toFixed(6)] }, dx.c);
  // find the tab with the 은행 변경 button
  await pickCo(D.p, dx.c); let tabF = null; for (const t of ['m', 'f', 'o']) { await tapOn(D.p, `G.stab('${t}')`); if (await D.p.locator(`[onclick="G.bkPick(${dx.c})"]`).count()) { tabF = t; break } }
  ok(!!tabF, 'D1 "은행 변경" button found on tab ' + tabF);
  const rowsOf = () => D.p.evaluate(() => [...document.querySelectorAll('#md .sr')].map(r => r.innerText.replace(/\s+/g, ' ').trim()));
  if (tabF) { await tapOn(D.p, `G.bkPick(${dx.c})`); const rows = await rowsOf(); const pr = rows.find(r => r.includes(dx.p1tk)) || '', nr = rows.find(r => r.includes(dx.nbtk)) || '';
    info('D1 bank list rows: ' + JSON.stringify(rows));
    ok(/판정 보류/.test(pr) && !/중립/.test(pr) && /중립/.test(nr), 'D1 은행 목록: pending ' + dx.p1tk + ' row "' + pr + '", neutral row "' + nr + '"'); await D.p.screenshot({ path: path.join(SHOTS, 'D1_bank_list.png') });
    const f0 = await fin(); await tapOn(D.p, `G.bkGo(${dx.c},${dx.p1})`); const t1 = await D.p.evaluate(() => __toast()), f1 = await fin();
    ok(JSON.stringify(f0) === JSON.stringify(f1) && /판정 보류/.test(t1), 'D2 tap the pending bank row: refused, toast "' + t1 + '", bank/freeze/cash/debt unchanged ' + JSON.stringify(f0));
    await D.p.screenshot({ path: path.join(SHOTS, 'D2_refused_toast.png') });
    await tapOn(D.p, `G.bkPick(${dx.c})`); await tapOn(D.p, `G.bkGo(${dx.c},${dx.nb})`); const f2 = await fin(); ok(f2[0] === dx.nb && f2[2] <= f0[2], 'D3 tap the neutral bank row: changed to ' + dx.nbtk + ' (fee from cash ' + (f0[2] - f2[2]).toFixed(3) + ')') }
  const myb = await D.p.evaluate(X => { pg = ''; G.pick(X); stab = 'm'; render(); return [...document.querySelectorAll('[onclick^="G.chbank("]')].map(e => e.textContent.trim()) }, dx.c);
  ok(!myb.some(t => t.includes(dx.p1tk)), 'D4 경영 탭 "(내 은행)으로 변경" buttons do not include the pending bank: ' + JSON.stringify(myb));
  // E display of a current bank that is pending
  const texts = {}; const vis = 'e => e.offsetParent !== null';
  const rbk = await D.p.evaluate(([P1, NB]) => { let r = S.co.find(b => !b.dead && b.kd === 1 && b.ctl && b.ctl[0] === 'r'); if (!r) { r = S.co.filter(b => !b.dead && b.kd === 1 && !b.priv && !b.ctl && b.id !== NB).sort((x, y) => y.A - x.A)[0]; __iso(r); setOwn(r, 'r0', 60); ctlAll() } const m = S.co.find(b => !b.dead && b.kd === 1 && !b.priv && !b.ctl && b.id !== NB && b !== r); __iso(m); setOwn(m, 'P', 60); ctlAll(); return [r.ctl && r.ctl[0] === 'r' ? r.id : null, mine(m) ? m.id : null] }, [dx.p1, dx.nb]);
  for (const [k, bank] of [['pending', dx.p1], ['neutral', dx.nb], ['rival (fixture r0 60%)', rbk[0]], ['mine (fixture P 60%)', rbk[1]]]) { if (bank == null) { texts[k] = ['(fixture failed)']; continue }
    await D.p.evaluate(([X, B]) => { closeMd(); S.co[X].ln = B; pg = ''; G.pick(X); stab = 'm'; render() }, [dx.c, bank]);
    const t = await D.p.evaluate(() => [...document.querySelectorAll('h4')].filter(h => h.offsetParent !== null && h.textContent.trim() === '거래 은행').map(h => '경영 탭 거래 은행: ' + (h.nextElementSibling ? h.nextElementSibling.innerText.trim() : '')));
    await D.p.evaluate(() => { stab = 'o'; render() });
    t.push(...await D.p.evaluate(() => [...document.querySelectorAll('.pn')].filter(e => e.offsetParent !== null && /^차입 현황/.test(e.innerText.trim())).map(e => '개요 탭 차입 현황: ' + e.innerText.replace(/\s+/g, ' ').trim())));
    texts[k] = t; if (k === 'pending') { await D.p.screenshot({ path: path.join(SHOTS, 'E_pending_current_bank_overview.png'), fullPage: true }); await D.p.evaluate(() => { stab = 'm'; render() }); await D.p.screenshot({ path: path.join(SHOTS, 'E_pending_current_bank_ops.png'), fullPage: true }) } }
  for (const k of Object.keys(texts)) info('E current bank ' + k + ': ' + JSON.stringify(texts[k]));
  const pendNote = texts.pending.some(t => /판정 보류|보류/.test(t));
  ok(texts.pending.length >= 2 && texts.pending.every(t => /지배권 판정 보류/.test(t)) && !texts.neutral.some(t => /보류/.test(t)) && !texts['rival (fixture r0 60%)'].some(t => /보류/.test(t)) && !texts['mine (fixture P 60%)'].some(t => /보류/.test(t)), 'E company screen (visible text only): a pending current bank shows ' + (pendNote ? '지배권 판정 보류 on both lines' : 'NO 판정 보류 note') + ', neutral bank unchanged' + (texts['rival (fixture r0 60%)'].some(t => /라이벌/.test(t)) ? '; the rival bank gets a warning' : '') + (texts['mine (fixture P 60%)'].some(t => /내 은행/.test(t)) ? ', my bank gets "내 은행"' : ''));
  ok(D.real().length === 0, 'D/E page: no page error'); await D.ctx.close();
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
