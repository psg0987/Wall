// RT-SAVE-ATOMIC-02 (Claude), written BEFORE the fix.
// N  Android storage: reads prefer the native copy (Android.load) and fall back to localStorage. Stub: Android.load returns the native file,
//    Android.save returns false (native write fails), localStorage works.
//    N1 per restore path (G.imp, G.ld, G.fLoad, G.cLoad): restoring B must not be reported as a success that a restart cannot see. If the player is
//       told it succeeded, a restart (stGet) must give B; if told it failed, the game is A and a restart gives A.
//    N2 slot save G.sv with an older native slot: no "저장했습니다" when the slot that will be read back is the old one.
//    N3 autosave save() resolves false when the write cannot be read back.
//    N4 compatibility: a key the native side has no file for (load → null) still falls back to localStorage and reads back (unchanged);
//       a native copy still wins over localStorage on read (unchanged); web (no Android): localStorage only (unchanged).
// Q  N5 a second restore requested while one is committing (packS held): refused; the first finishes as itself (game and local save = B).
//    N6 G.mk (불러오기 button of 세이브 가져오기): its render() runs before the game is swapped; no render() while the commit is in progress.
let errs = 0, fails = 0; const ok = (x, m) => { console.log((x ? 'ok ' : 'FAIL ') + m); if (!x) fails++ }; const pre = (x, m) => { if (!x) { errs++; console.log('ERR precondition ' + m) } };
const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const world = (seed, days) => { Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); S.tut = 99; mdl = null; S.spd = 0; sel = -1; pg = ''; for (let d = 0; d < days; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null } S.ev2 = null; S.sp0 = null };
const sleep = ms => new Promise(r => setTimeout(r, ms)), settle = async () => { for (let k = 0; k < 200; k++) { await sleep(5); if (!saving) { await sleep(20); if (!saving) return } } };
let toasts = []; { const t0 = toast; toast = m => { toasts.push(m); t0(m) } }
global.FileReader = class { readAsText(f) { this.result = f.__t; Promise.resolve().then(() => this.onload()) } };
const id = s => s ? [s.seed, s.day] : null, readBack = async k => { const x = stGet(k || 'raider7'); if (!x) return null; try { return id(await loadStr(x)) } catch (e) { return 'bad' } };
const C0 = cldInit, cloudOf = t => { const Z = 180000, n = Math.ceil(t.length / Z) || 1, docs = { s1: { n } }; for (let j = 0; j < n; j++) docs['s1p' + j] = { x: t.slice(j * Z, (j + 1) * Z) }; return { uid: 'u', db: { collection: () => ({ doc: k => ({ get: async () => ({ exists: !!docs[k], data: () => docs[k] }) }) }) } } };
const PATHS = {
  imp: async t => { G.imp(); document.getElementById('ipt').value = t; const f = mcb; closeMd(); await f() },
  ld: async t => { localStorage.setItem('r6s4', t); await G.ld(4) },   // the slot itself lives in localStorage (native has no r6s4): read back through stGet's fallback
  fLoad: async t => { const n = toasts.length; G.fLoad({ files: [{ __t: t }] }); for (let k = 0; k < 400 && toasts.length === n; k++) await sleep(5) },
  cLoad: async t => { cldInit = async () => cloudOf(t); try { await G.cLoad(1) } finally { cldInit = C0 } } };
const OK = /불러왔|저장했/, BAD = /실패|호환되지|형식|아니에요/;
const NVS = {}; let nvFail = false; const android = () => { global.Android = { load: k => NVS[k] || null, save: (k, v) => { if (nvFail || !/^[a-z0-9]{1,24}$/.test(k)) return false; NVS[k] = v; return true } }; global.window = { Android: global.Android } };
const web = () => { delete global.Android; delete global.window };
(async () => {
  world(912, 30); const B = await packS(1), Bid = id(S); world(913, 15); const Cc = await packS(1), Cid = id(S);
  // ---------- N1
  for (const [name, run] of Object.entries(PATHS)) { android(); nvFail = false; world(911, 20); await save(); await settle(); const Aid = id(S); pre(JSON.stringify(id(await loadStr(NVS.raider7))) === JSON.stringify(Aid), 'N1 native file holds A');
    nvFail = true; toasts = []; const S0 = S; await run(B); await settle(); const told = toasts.join(' | '), now = id(S), rb = await readBack();
    const consistent = OK.test(told) ? JSON.stringify(now) === JSON.stringify(Bid) && JSON.stringify(rb) === JSON.stringify(Bid) : BAD.test(told) && S === S0 && JSON.stringify(rb) === JSON.stringify(Aid);
    ok(consistent && !(OK.test(told) && JSON.stringify(rb) !== JSON.stringify(Bid)), 'N1 ' + name + ' (Android.save false, native A): told "' + told + '", game ' + JSON.stringify(now) + ', restart reads ' + JSON.stringify(rb));
    nvFail = false; web() }
  // ---------- N2 slot save with an older native slot
  { android(); nvFail = false; world(911, 20); await G.sv(1); const old = await readBack('r6s1'); for (let d = 0; d < 5; d++) step(); nvFail = true; toasts = []; await G.sv(1); const rb = await readBack('r6s1'), told = toasts.join(' | ');
    ok(!(OK.test(told) && JSON.stringify(rb) !== JSON.stringify(id(S))), 'N2 G.sv(1) with Android.save false and an older native slot ' + JSON.stringify(old) + ': told "' + told + '", slot read back ' + JSON.stringify(rb) + ', game ' + JSON.stringify(id(S))); nvFail = false; web() }
  // ---------- N3 autosave result
  { android(); nvFail = false; world(911, 20); await save(); await settle(); for (let d = 0; d < 3; d++) step(); nvFail = true; const r = await save(); const rb = await readBack();
    ok(r === (JSON.stringify(rb) === JSON.stringify(id(S))), 'N3 save() resolved ' + r + ' and the restart reads ' + JSON.stringify(rb) + ' (game ' + JSON.stringify(id(S)) + ')'); nvFail = false; web() }
  // ---------- N4 compatibility
  { android(); nvFail = false; world(911, 20); delete NVS.zz9; const okNo = stSet('zz9', 'v1') && stGet('zz9') === 'v1'; delete NVS.zz9; NVS.zz8 = 'native'; localStorage.setItem('zz8', 'web'); const prio = stGet('zz8') === 'native';
    const okBad = stSet('Bad_Key', 'v2') && stGet('Bad_Key') === 'v2'; web(); const okWeb = stSet('zz7', 'w') && stGet('zz7') === 'w' && localStorage.getItem('zz7') === 'w';
    ok(okNo && prio && okBad && okWeb, 'N4 native write ok + read back ' + okNo + '; native copy wins on read ' + prio + '; key the native side refuses → localStorage, read back ' + okBad + '; web localStorage ' + okWeb) }
  // ---------- N5 second restore while the first commits
  { web(); world(911, 20); await save(); await settle(); toasts = []; const pk0 = packS; let open; const gate = new Promise(r => open = r); let used = false;
    packS = async function () { const p = pk0.apply(this, arguments); if (!used) { used = true; packS = pk0; await gate } return p };
    localStorage.setItem('r6s5', Cc); const p1 = PATHS.imp(B); await sleep(40); const mid = id(S); const p2 = G.ld(5); await sleep(40); open(); await p1; await p2; await settle();
    const rb = await readBack(), told = toasts.join(' | ');
    ok(JSON.stringify(id(S)) === JSON.stringify(Bid) && JSON.stringify(rb) === JSON.stringify(Bid) && /세이브를 불러왔어요/.test(told) && !/슬롯 5을 불러왔습니다/.test(told), 'N5 slot 5 asked while B commits (game during the commit ' + JSON.stringify(mid) + '): told "' + told + '", game ' + JSON.stringify(id(S)) + ', local ' + JSON.stringify(rb) + ' (want B ' + JSON.stringify(Bid) + ', slot refused)') }
  // ---------- N6 G.mk and render
  { web(); world(911, 20); await save(); await settle(); const A = S, r0 = render; const log = []; render = function () { log.push({ a: S === A, rsb: !!RSB }); return r0.apply(this, arguments) };
    G.imp(); document.getElementById('ipt').value = B; const iy = mdl.o.findIndex(o => o[1] === 'y'); log.length = 0; G.mk(iy); const atMk = log.slice(); for (let k = 0; k < 400 && !toasts.some(t => /세이브를 불러왔어요/.test(t)) && !(S !== A && !RSB); k++) await sleep(5); await settle(); render = r0;
    ok(atMk.length >= 1 && atMk.every(x => x.a && !x.rsb) && !log.some(x => x.rsb), 'N6 G.mk(불러오기): renders at the tap ' + JSON.stringify(atMk) + ' show the old game; renders during the commit ' + log.filter(x => x.rsb).length + '; game now ' + JSON.stringify(id(S))) }
  console.log('errs', errs, 'fails', fails);
})();
