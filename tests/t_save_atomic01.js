// RT-SAVE-ATOMIC-01 (Claude), written BEFORE the fix. Save / restore atomicity and the async autosave race.
// R  races (packS is async: JSON.stringify(S) is taken at the call, compression finishes later; a gate holds the first pack open):
//    R1 per restore path (세이브 가져오기 G.imp, 슬롯 G.ld, 파일 G.fLoad, 클라우드 G.cLoad): an autosave of game A is still packing when game B is
//       restored; A's pack then completes. The local save must end as B (B's save request is not lost, A's old pack does not land after B).
//    R2 Android saveNow (synchronous JSON write, window.Android stub) while an older async pack is in flight: the newer write stays.
//    R3 the 8-second timer calls save() again while a pack is in flight: the second request is not lost (the newer state lands).
// F  restore failures per path, forced: F1 save that breaks in v8fix, F2 evMd throws, F3 the device write fails (stSet false),
//    F4 render throws after the restore is complete. Rule: if the player is told 실패, the game object, its content, the control results
//    (CTLQ / CTLS), the screen state (sel, pg, mdl) and the speed are the old ones and the local save still holds A (also after an autosave and
//    a restart); if the restore is complete (F4) the player is told it succeeded and the local save holds B.
// S  success per path: when the success toast appears the local save already holds B (a restart right after boots B); open CEO event window
//    restored and decided once.
let errs = 0, fails = 0; const ok = (x, m) => { console.log((x ? 'ok ' : 'FAIL ') + m); if (!x) fails++ }; const pre = (x, m) => { if (!x) { errs++; console.log('ERR precondition ' + m) } };
const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const world = (seed, days) => { Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); S.tut = 99; mdl = null; S.spd = 0; sel = -1; pg = ''; for (let d = 0; d < days; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null } S.ev2 = null; S.sp0 = null };
const sleep = ms => new Promise(r => setTimeout(r, ms)), settle = async () => { for (let k = 0; k < 200; k++) { await sleep(5); if (!saving) { await sleep(20); if (!saving) return } } };
let toasts = []; { const t0 = toast; toast = m => { toasts.push({ m, local: stGet('raider7') }); t0(m) } }
global.FileReader = class { readAsText(f) { this.result = f.__t; Promise.resolve().then(() => this.onload()) } };
const id = s => s ? [s.seed, s.day] : null, localId = async () => { const x = stGet('raider7'); if (!x) return null; try { return id(await loadStr(x)) } catch (e) { return 'bad' } };
const C0 = cldInit;
const cloudOf = t => { const Z = 180000, n = Math.ceil(t.length / Z) || 1, docs = { s1: { n } }; for (let j = 0; j < n; j++) docs['s1p' + j] = { x: t.slice(j * Z, (j + 1) * Z) }; return { uid: 'u', db: { collection: () => ({ doc: k => ({ get: async () => ({ exists: !!docs[k], data: () => docs[k] }) }) }) } } };
// run one restore path with code t and wait until it has told the player something and every save has settled
const PATHS = {
  imp: async t => { G.imp(); document.getElementById('ipt').value = t; const f = mcb; closeMd(); await f() },
  ld: async t => { localStorage.setItem('r6s4', t); await G.ld(4) },
  fLoad: async t => { const n = toasts.length; G.fLoad({ files: [{ __t: t }] }); for (let k = 0; k < 400 && toasts.length === n; k++) await sleep(5) },
  cLoad: async t => { cldInit = async () => cloudOf(t); try { await G.cLoad(1) } finally { cldInit = C0 } } };
const OKMSG = /불러왔/, FAILMSG = /실패|호환되지|형식|아니에요/;
// gate: the next packS call snapshots S at once (as packS does) but completes only when the gate opens
let gateOpen = null; const pk0 = packS; function gateNext() { let open; const g = new Promise(r => open = r); let used = false; packS = async function () { const p = pk0.apply(this, arguments); if (!used) { used = true; packS = pk0; await g } return p }; gateOpen = open }
(async () => {
  world(902, 40); const B = await packS(1), Bid = id(S);
  world(903, 10); { const c = S.co.filter(x => !x.dead && !x.priv && !x.kd && x.i !== HOLD && x.bk === 0)[3]; for (const k of Object.keys(c.own)) setOwn(c, k, 0); setOwn(c, 'P', 60); ctlAll(); S.ceo = c.id;
    const e = EV2.find(z => z.id !== 'offer' && z.el(c) && z.o && z.o.length >= 2 && !z.sl) || EV2.find(z => z.id !== 'offer' && z.o && z.o.length >= 2 && !z.sl);
    S.ev2 = { id: e.id, c: c.id, x: e.mk(c), v: 0, m: 'ceo' }; S.spd = 0; S.sp0 = 3; S.ceo = -1 } const E = await packS(1), Eid = id(S), Eev = S.ev2.id;
  const freshA = async () => { world(901, 20); S.spd = 2; await save(); await settle(); toasts = []; pre(JSON.stringify(await localId()) === JSON.stringify(id(S)), 'local save holds game A ' + JSON.stringify(id(S))); return id(S) };
  // ---------- R1 race per path
  for (const [name, run] of Object.entries(PATHS)) { const Aid = await freshA(); step(); gateNext(); save(); /* A's autosave is packing */ await run(B); await settle();
    const after = await localId(); gateOpen(); await settle(); const fin = await localId(); const told = toasts.map(x => x.m).join(' | ');
    ok(OKMSG.test(told) && JSON.stringify(id(S)) === JSON.stringify(Bid) && JSON.stringify(fin) === JSON.stringify(Bid), 'R1 ' + name + ': B restored while A was packing; after A\'s pack completes the local save is ' + JSON.stringify(fin) + ' (B ' + JSON.stringify(Bid) + ', before the gate opened ' + JSON.stringify(after) + '); told "' + told + '"') }
  // ---------- R2 Android synchronous saveNow vs an older async pack
  { await freshA(); const store = {}; global.Android = { load: k => store[k] || null, save: (k, v) => { store[k] = v; return true } }; global.window = { Android: global.Android }; try {
      gateNext(); save(); for (let d = 0; d < 5; d++) step(); const newer = id(S); if (typeof window.andPause === 'function') window.andPause(); else saveNow(); const atPause = JSON.parse(store.raider7 || 'null'); gateOpen(); await settle();
      const fin = await localId(); ok(JSON.stringify(fin) === JSON.stringify(newer), 'R2 Android: andPause / saveNow wrote day ' + (atPause && atPause.day) + ' at once; the older pack that completes later does not overwrite it (local ' + JSON.stringify(fin) + ', want ' + JSON.stringify(newer) + ')') } finally { delete global.window; delete global.Android } }
  // ---------- R3 timer save() while a pack is in flight
  { await freshA(); gateNext(); save(); for (let d = 0; d < 3; d++) step(); const newer = id(S); save(); gateOpen(); await settle(); const fin = await localId();
    ok(JSON.stringify(fin) === JSON.stringify(newer), 'R3 second save() during a pack is not lost: local ' + JSON.stringify(fin) + ', want ' + JSON.stringify(newer)) }
  // ---------- F forced failures per path
  const BAD = '{"v":13,"co":[null],"R":[],"d":[],"mxd":[]}';
  const inject = { F1: [BAD, () => () => {}], F2: [E, () => { const f0 = evMd; evMd = () => { throw new Error('forced evMd') }; return () => { evMd = f0 } }],
    F3: [B, () => { const s0 = localStorage.setItem; localStorage.setItem = (k, v) => { if (k === 'raider7') throw new Error('quota'); return s0(k, v) }; return () => { localStorage.setItem = s0 } }],
    F4: [B, () => { const r0 = render; let n = 0; render = function () { if (S.seed === 902 && n++ === 0) throw new Error('forced render'); return r0.apply(this, arguments) }; return () => { render = r0 } }] };
  for (const [fk, [code, arm]] of Object.entries(inject)) for (const [name, run] of Object.entries(PATHS)) {
    const Aid = await freshA(); sel = 7; pg = 'auto'; mdl = null; const S0 = S, j0 = JSON.stringify(S), q0 = CTLQ, g0 = CTLS, spd0 = S.spd, L0 = stGet('raider7');
    const undo = arm(); let thrown = null; try { await run(code) } catch (e) { thrown = e.message || String(e) } finally { undo() } await settle();
    const told = toasts.map(x => x.m).join(' | '), now = id(S), local1 = await localId();
    if (fk === 'F4') { ok(OKMSG.test(told) && !FAILMSG.test(told) && JSON.stringify(now) === JSON.stringify(Bid) && JSON.stringify(local1) === JSON.stringify(Bid), fk + ' ' + name + ' render throws after the restore: told "' + told + '", game ' + JSON.stringify(now) + ', local ' + JSON.stringify(local1) + (thrown ? ', threw ' + thrown : '')); continue }
    const kept = S === S0 && JSON.stringify(S) === j0 && CTLQ === q0 && CTLS === g0 && sel === 7 && pg === 'auto' && !mdl && S.spd === spd0, l1 = stGet('raider7') === L0;
    await save(); await settle(); const l2 = JSON.stringify(await localId()) === JSON.stringify(Aid); let runs = true; try { for (let d = 0; d < 2; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null } } catch (e) { runs = e.message }
    ok(FAILMSG.test(told) && !OKMSG.test(told) && kept && l1 && l2 && runs === true && !thrown, fk + ' ' + name + ': told "' + told + '"; old game, control results, screen and speed kept ' + kept + '; local save kept ' + l1 + '; after an autosave / restart still A ' + l2 + '; runs on ' + runs + (thrown ? '; threw ' + thrown : '')) }
  // ---------- S success per path: local save holds the new game when success is shown; open CEO event
  for (const [name, run] of Object.entries(PATHS)) { await freshA(); await run(E); const t = toasts.find(x => OKMSG.test(x.m)); let atToast = null; if (t && t.local) try { atToast = id(await loadStr(t.local)) } catch (e) {}
    const st = { ev2: S.ev2 && S.ev2.m, win: !!(mdl && mdl.ev2), spd: S.spd, sp0: S.sp0 };
    ok(!!t && JSON.stringify(atToast) === JSON.stringify(Eid) && st.ev2 === 'own' && st.win && st.spd === 0 && st.sp0 === 3, 'S ' + name + ': local save when "' + (t && t.m) + '" was shown: ' + JSON.stringify(atToast) + ' (want ' + JSON.stringify(Eid) + '); window restored, paused, speed 3 kept ' + JSON.stringify(st));
    if (st.win) { const e = EV2.find(z => z.id === Eev), go0 = e.go; let ran = 0; e.go = function () { ran++; return go0.apply(this, arguments) }; G.mk(0); for (let d = 0; d < 3; d++) { step(); mdl = null } e.go = go0; await settle();
      ok(ran === 1 && !S.ev2 && S.spd === 3, 'S ' + name + ': decided once (ran ' + ran + '), event closed, speed 3') } }
  console.log('errs', errs, 'fails', fails);
})();
