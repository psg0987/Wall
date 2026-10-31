// RT-CTL-CLOUD-LOAD-01 (Claude), written BEFORE the fix. 클라우드 불러오기 (G.cLoad) against a mock cloud store (cldInit stubbed; same
// collection / doc / get / exists / data shape the page uses). Invariant for every case: the result the player is told matches what happened —
//   success: toast "…불러왔어요", S is the cloud game, screen reset (sel -1, pg ""), autosave holds the cloud game;
//   failure: toast "불러오기 실패…" (or 빈 슬롯 / 쓸 수 없어요), S is the same object with the same content, the local save is unchanged,
//            and an autosave right after (the 8-second timer) still writes the old game, and the old game keeps running.
// Cases: L1 normal, L2 network error on get, L3 missing piece, L4 garbled code, L5 JSON that is not a save, L6 save with no companies,
//        L7 save that breaks during restore (v8fix), L8 empty slot, L9 no cloud on this screen, L10 open CEO event restored as its window
//        (controlling-holder route after resigning, paused, decided once, speed back).
let errs = 0, fails = 0; const ok = (x, m) => { console.log((x ? 'ok ' : 'FAIL ') + m); if (!x) fails++ }; const pre = (x, m) => { if (!x) { errs++; console.log('ERR precondition ' + m) } };
const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const world = (seed, days) => { Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); S.tut = 99; mdl = null; S.spd = 0; sel = -1; pg = ''; for (let d = 0; d < days; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null } S.ev2 = null; S.sp0 = null };
const tick = async (n = 30) => { for (let k = 0; k < n; k++) await new Promise(r => setTimeout(r, 0)) };
let lastToast = ''; { const t0 = toast; toast = m => { lastToast = m; t0(m) } }
const cloud = (t, { missing = -1, failGet = false, slot = 1 } = {}) => { const Z = 180000, n = Math.ceil(t.length / Z) || 1, docs = { ['s' + slot]: { n, d: 'x', w: 0, t: 0, v: 12 } };
  for (let j = 0; j < n; j++) if (j !== missing) docs['s' + slot + 'p' + j] = { x: t.slice(j * Z, (j + 1) * Z) };
  return { uid: 'u', db: { collection: () => ({ doc: k => ({ get: async () => { if (failGet) throw { code: 'unavailable' }; return { exists: !!docs[k], data: () => docs[k] } } }) }) } } };
const C0 = cldInit; const useCloud = c => { cldInit = async () => c };
const local = async () => { const x = stGet('raider7'); if (!x) return null; const s = await loadStr(x); return s ? [s.seed, s.day] : 'bad' };
(async () => {
  world(902, 40); const B = await packS(1); const Bid = [S.seed, S.day];
  world(901, 20); await save(); await tick(); const A0 = JSON.stringify(S), Aid = [S.seed, S.day], L0 = stGet('raider7'); pre(JSON.stringify(await local()) === JSON.stringify(Aid), 'local save holds the current game ' + JSON.stringify(Aid));
  async function failCase(tag, cloud, want) { const S0 = S, j0 = JSON.stringify(S); sel = 7; pg = 'auto'; lastToast = ''; if (cloud === null) cldInit = async () => null; else useCloud(cloud);
    let thrown = null; try { await G.cLoad(1) } catch (e) { thrown = e } await tick(); cldInit = C0;
    const same = S === S0 && JSON.stringify(S) === j0, l1 = stGet('raider7') === L0; await save(); await tick(); const l2 = JSON.stringify(await local()) === JSON.stringify(Aid);
    let runs = true; try { const s0 = S; for (let d = 0; d < 3; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null } runs = S === s0 } catch (e) { runs = 'threw ' + e.message }
    ok(want.test(lastToast) && same && l1 && l2 && runs === true && !thrown && sel === 7 && pg === 'auto', tag + ': toast "' + lastToast + '"; game kept ' + same + ', local save kept ' + l1 + ', autosave after still the old game ' + l2 + ', game runs on ' + runs + ', screen kept ' + (sel === 7 && pg === 'auto') + (thrown ? ', threw ' + thrown : ''));
    // put the reference game back for the next case (old game advanced 3 days in the check above)
    world(901, 20); await save(); await tick() }
  // ---------- L1 normal restore
  { useCloud(cloud(B)); sel = 7; pg = 'auto'; lastToast = ''; const S0 = S; await G.cLoad(1); for (let w = 0; w < 100 && saving; w++) await new Promise(r => setTimeout(r, 10)); await tick(); cldInit = C0;
    const st = { toast: lastToast, swapped: S !== S0, id: [S.seed, S.day], sel, pg, mdl: !!mdl, local: await local() };
    ok(/불러왔어요/.test(st.toast) && st.swapped && JSON.stringify(st.id) === JSON.stringify(Bid) && st.sel === -1 && st.pg === '' && !st.mdl && JSON.stringify(st.local) === JSON.stringify(Bid), 'L1 normal: cloud game loaded and saved locally, screen reset ' + JSON.stringify(st));
    let runs = true; try { for (let d = 0; d < 3; d++) { step(); if (S.ev2) S.ev2 = null; mdl = null } } catch (e) { runs = e.message } ok(runs === true, 'L1 the loaded game runs (3 days) ' + runs);
    world(901, 20); await save(); await tick() }
  await failCase('L2 network error on get', cloud(B, { failGet: true }), /불러오기 실패/);
  await failCase('L3 missing piece', cloud(B + B.slice(5) + B.slice(5), { missing: 0 }), /불러오기 실패/);
  await failCase('L4 garbled code', cloud('WSR1:@@not-base64@@'), /불러오기 실패/);
  await failCase('L5 JSON that is not a save', cloud('{"a":1}'), /불러오기 실패/);
  await failCase('L6 save with no companies', cloud('{"v":13,"co":[]}'), /불러오기 실패/);
  await failCase('L7 save that breaks during restore (v8fix)', cloud('{"v":13,"co":[null],"R":[],"d":[],"mxd":[]}'), /불러오기 실패/);
  { const c = cloud(B); c.db = { collection: () => ({ doc: () => ({ get: async () => ({ exists: false, data: () => null }) }) }) }; await failCase('L8 empty slot', c, /빈 슬롯/) }
  await failCase('L9 no cloud on this screen', null, /쓸 수 없어요/);
  // ---------- L10 open CEO event in the cloud save
  { world(903, 10); const c = S.co.filter(x => !x.dead && !x.priv && !x.kd && x.i !== HOLD && x.bk === 0)[3]; for (const k of Object.keys(c.own)) setOwn(c, k, 0); setOwn(c, 'P', 60); ctlAll(); S.ceo = c.id;
    const e = EV2.find(z => z.id !== 'offer' && z.el(c) && z.o && z.o.length >= 2 && !z.sl) || EV2.find(z => z.id !== 'offer' && z.o && z.o.length >= 2 && !z.sl), x = e.mk(c);
    S.ev2 = { id: e.id, c: c.id, x, v: 0, m: evWho(c) }; S.spd = 3; S.sp0 = 3; S.spd = 0; S.ceo = -1; pre(S.ev2.m === 'ceo' && mine(c), 'L10 cloud save with an open CEO-mode event, CEO resigned, control kept');
    const T = await packS(1); world(901, 20); S.spd = 1; await save(); await tick(); const go0 = e.go; let ran = 0; e.go = function () { ran++; return go0.apply(this, arguments) };
    useCloud(cloud(T)); await G.cLoad(1); await tick(); cldInit = C0; const st = { ev2: S.ev2 && [S.ev2.id, S.ev2.m], win: !!(mdl && mdl.ev2), keys: mdl && mdl.o ? mdl.o.map(o => o[1]).join(',') : '', spd: S.spd, sp0: S.sp0, ran, toast: lastToast };
    ok(st.ev2 && st.ev2[0] === e.id && st.win && st.keys === 'mg,int' && st.spd === 0 && st.sp0 === 3 && ran === 0, 'L10 event window restored as the controlling-holder window, paused, nothing carried out ' + JSON.stringify(st));
    if (st.win) { G.mk(0); const a = { ran, ev2: !!S.ev2, win: !!mdl, spd: S.spd }; for (let d = 0; d < 5; d++) { step(); mdl = null } ok(ran === 1 && !a.ev2 && !a.win && a.spd === 3, 'L10 경영진에게 맡기기 → carried out once, closed, speed back to 3; 5 more days: carried out ' + ran + ' time(s) ' + JSON.stringify(a)) }
    e.go = go0 }
  console.log('errs', errs, 'fails', fails);
})();
