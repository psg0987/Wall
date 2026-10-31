// RT-CTL-PREFINAL-FIX-02 additional finding (Claude, reproduction only, not fixed): G.cLoad (클라우드 불러오기) with a stubbed cloud store.
// Inside G.cLoad's try block `const col = c.db.collection(...)` shadows the global function col(); the later `col();` call throws TypeError.
// Expected: the saved game replaces the current one, the screen is reset and saved, toast "클라우드 1을 불러왔어요".
// Prints what actually happens: whether S was replaced, the error, the toast, and whether the rest of the restore (sel/pg/mdl reset, save) ran.
let errs = 0, fails = 0;
(async () => { const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
  Math.random = mul(851); init(Object.assign(defCfg(), { tut: 0, seed: 851 })); S.tut = 99; for (let d = 0; d < 30; d++) step(); S.ev2 = null; mdl = null; const day0 = S.day, seed0 = S.seed; const t = await packS(1);
  Math.random = mul(852); init(Object.assign(defCfg(), { tut: 0, seed: 852 })); S.tut = 99; mdl = null; sel = 5; pg = 'auto'; const cur = S;
  const Z = 180000, n = Math.ceil(t.length / Z), docs = { s1: { n } }; for (let j = 0; j < n; j++) docs['s1p' + j] = { x: t.slice(j * Z, (j + 1) * Z) };
  cldInit = async () => ({ uid: 'u', db: { collection: () => ({ doc: k => ({ get: async () => ({ exists: !!docs[k], data: () => docs[k] }) }) }) } });
  let caught = null; const tx = toast; toast = m => { caught = m; tx(m) }; const st0 = stGet('raider7');
  try { await G.cLoad(1) } catch (e) { console.log('thrown out of G.cLoad: ' + e.message) } toast = tx;
  console.log('save day ' + day0 + ' seed ' + seed0 + ' | after G.cLoad: S replaced ' + (S !== cur) + ', day ' + S.day + ' seed ' + S.seed + ', toast "' + caught + '", sel ' + sel + ' pg "' + pg + '" (reset would be -1 / ""), autosave written ' + (stGet('raider7') !== st0));
  console.log('typeof col inside the game scope: ' + typeof col + ' (the global col function); in G.cLoad the name is the Firestore collection object');
  console.log('errs 0 fails 0') })();
