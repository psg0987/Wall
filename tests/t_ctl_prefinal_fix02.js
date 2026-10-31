// RT-CTL-PREFINAL-FIX-02 (Claude), written BEFORE the fix. Findings F1, F2, F3, F5 of RT-CTL-PREFINAL-SMOKE-01.
// F1 evMd: a window for an event saved in CEO mode, drawn while I am no longer CEO but still control the company, is the controlling-holder
//    window (경영진에게 맡기기 / 개입한다), not the CEO window. CEO window while CEO, approved intervention ("int") and own mode are unchanged.
// F2 restore paths 세이브 가져오기 (G.imp + mcb), 슬롯 불러오기 (G.ld), 파일 가져오기 (G.fLoad); boot (bootRest) already reopens it and is
//    checked in the browser smoke. 클라우드 (G.cLoad) is not in this test: it fails before reaching that point (verify/rt-ctl-prefinal-fix-02/cloud_load_repro.js).
//    a saved open event comes back as its window, nothing is carried out by the restore, the game stays paused while the window is open,
//    deciding carries it out exactly once and gives back the speed that was running before the event. A save without event: no window.
// F3 company screen: when the current lending bank is pending (ctl "?"), the 경영 tab 거래 은행 line and the 개요 tab 차입 현황 show
//    '지배권 판정 보류'; neutral / rival / own banks keep their wording.
// F5 BSF.bankFail: no borrower is re-assigned to the failing bank itself; with no other live bank the borrower has no lending bank (-1);
//    borrowers' debt / cash and the other banks' assets are not changed by the re-assignment.
let errs = 0, fails = 0; const ok = (x, m) => { console.log((x ? 'ok ' : 'FAIL ') + m); if (!x) fails++ }; const pre = (x, m) => { if (!x) { errs++; console.log('ERR precondition ' + m) } };
const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const world = seed => { Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); S.tut = 99; mdl = null; S.spd = 0; sel = -1; pg = ''; S.apAll = 0; S.ev2 = null; S.sp0 = null };
const iso = c => { for (const k of Object.keys(c.own)) setOwn(c, k, 0); for (const t of Object.keys(c.pos)) setOwn(S.co[+t], 'c' + c.id, 0) };
const ords = () => S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i !== HOLD && c.bk === 0);
const evOf = c => EV2.find(z => z.id !== 'offer' && z.el(c) && z.o && z.o.length >= 2 && !z.sl) || EV2.find(z => z.id !== 'offer' && z.o && z.o.length >= 2 && !z.sl);
const keys = () => mdl && mdl.o ? mdl.o.map(o => o[1]).join(',') : '';
const html = () => (mdl && ((mdl.h || '') + (mdl.b || ''))) || '';
function open(seed, m) { world(seed); const c = ords()[3]; iso(c); setOwn(c, 'P', 60); ctlAll(); const e = evOf(c), x = e.mk(c); if (m === 'ceo' || m === 'ceo-resigned') S.ceo = c.id;
  S.ev2 = { id: e.id, c: c.id, x, v: 0, m: evWho(c) }; if (m === 'int') S.ev2.m = 'int'; if (m === 'ceo-resigned') S.ceo = -1; return { c, e } }
(async () => {
  // ---------- F1
  { const { c, e } = open(801, 'ceo-resigned'); pre(S.ev2.m === 'ceo' && mine(c) && S.ceo !== c.id, 'F1a saved CEO-mode event, CEO resigned, control kept'); evMd();
    ok(keys() === 'mg,int' && !/CEO로서 직접 결정합니다/.test(html()), 'F1a window drawn after resigning: controlling-holder options [' + keys() + '], no CEO wording'); mdl = null }
  { const { c, e } = open(802, 'ceo'); pre(S.ev2.m === 'ceo', 'F1b CEO mode'); evMd(); ok(keys() === e.o.map(o => o[1]).join(',') && /CEO로서 직접 결정합니다/.test(html()) && S.ev2.m === 'ceo', 'F1b CEO: CEO window [' + keys() + ']'); mdl = null }
  { const { c, e } = open(803, 'int'); evMd(); ok(keys() === e.o.map(o => o[1]).join(',') && /이사회 승인을 받아 직접 결정합니다/.test(html()) && S.ev2.m === 'int', 'F1c approved intervention, not CEO: player options kept [' + keys() + ']'); mdl = null }
  { const { c } = open(804, 'own'); evMd(); ok(keys() === 'mg,int' && S.ev2.m === 'own', 'F1d own mode unchanged [' + keys() + ']'); mdl = null }
  // ---------- F2 restore paths
  global.FileReader = class { readAsText(f) { this.result = f.__t; Promise.resolve().then(() => this.onload()) } };
  const PATHS = {
    imp: async t => { G.imp(); document.getElementById('ipt').value = t; const f = mcb; closeMd(); await f() },   // as G.mk does for 불러오기: closeMd, then the handler
    ld: async t => { stSet('r6s4', t); await G.ld(4) },
    fLoad: async t => { G.fLoad({ files: [{ __t: t }] }); for (let k = 0; k < 20; k++) await new Promise(r => setTimeout(r, 0)) } };
  for (const [name, load] of Object.entries(PATHS)) {
    for (const kind of ['ceo-resigned', 'own']) { const { c, e } = open(810, kind); S.spd = 3; S.sp0 = S.spd; S.spd = 0; pre(S.ev2.m === (kind === 'own' ? 'own' : 'ceo'), 'F2 ' + name + ' save made with the event window open (paused, speed 3 kept to give back; mode ' + S.ev2.m + ')');   // fixture corrected after the fix: evMd here would already turn ceo into own (F1)
      const t = await packS(1); mdl = null; world(811); S.spd = 1; const go0 = e.go; let ran = 0; e.go = function () { ran++; return go0.apply(this, arguments) };
      await load(t); const st = { ev2: S.ev2 && [S.ev2.id, S.ev2.c, S.ev2.m], win: !!(mdl && mdl.ev2), keys: keys(), spd: S.spd, sp0: S.sp0, ran };
      ok(st.ev2 && st.ev2[0] === e.id && st.ev2[1] === c.id && st.win && st.spd === 0 && ran === 0 && st.keys === 'mg,int', 'F2 ' + name + ' (' + kind + '): saved event window restored [' + st.keys + '], paused, nothing carried out ' + JSON.stringify(st));
      if (st.win) { const [a] = e.ai(S.co[c.id], S.ev2.x); G.mk(0); const after = { ran, ev2: !!S.ev2, win: !!mdl, spd: S.spd };
        ok(ran === 1 && !after.ev2 && !after.win && after.spd === 3, 'F2 ' + name + ' (' + kind + '): 경영진에게 맡기기 → carried out once, event closed, speed back to 3 ' + JSON.stringify(after)) }
      e.go = go0 }
    { world(812); S.spd = 3; const t = await packS(1); world(813); S.spd = 1; await load(t); ok(!mdl && !S.ev2 && S.spd === 3, 'F2 ' + name + ' save without an event: no window, speed as saved (' + S.spd + ')') } }
  // ---------- F2e the restored window is not replaced by a new event while it is open (60 days stepped directly)
  { const { c, e } = open(814, 'own'); S.spd = 3; S.sp0 = 3; S.spd = 0; const t = await packS(1); world(815); await PATHS.ld(t); const id0 = S.ev2 && S.ev2.id;
    for (let d = 0; d < 60; d++) step(); ok(!!mdl && mdl.ev2 && S.ev2 && S.ev2.id === id0 && S.ev2.c === c.id, 'F2e 60 days with the restored window open: the same event is still waiting (' + id0 + ')'); mdl = null; S.ev2 = null }
  // ---------- F3
  { world(820); const bs = banks().filter(b => !b.priv).sort((x, y) => y.A - x.A), [p1, p2] = bs; iso(p1); iso(p2); setOwn(p1, 'c' + p2.id, 60); setOwn(p2, 'c' + p1.id, 60); p1.ctl = p2.ctl = null; ctlAll();
    const nb = bs.find(b => b !== p1 && b !== p2 && !b.ctl), rb = bs.filter(b => b !== p1 && b !== p2 && b !== nb && !b.ctl)[0], mb = bs.filter(b => b !== p1 && b !== p2 && b !== nb && b !== rb && !b.ctl)[0];
    iso(rb); setOwn(rb, 'r0', 60); iso(mb); setOwn(mb, 'P', 60); const c = ords().find(x => ![p1, p2, nb, rb, mb].some(b => b.id === x.ln)); iso(c); setOwn(c, 'P', 60); ctlAll();
    pre(p1.ctl === '?' && !nb.ctl && rb.ctl === 'r0' && mine(mb) && mine(c), 'F3 pending / neutral / rival / own banks and my borrower');
    const scr = (b, t) => { c.ln = b.id; pg = ''; G.pick(c.id); stab = t; render(); return document.getElementById('sh').innerHTML };
    const bankLine = h => (h.match(/<h4>거래 은행<\/h4><div class="mu">([^<]*)/) || [])[1] || '', loanRow = h => (h.match(/차입 현황<\/b>[\s\S]*?거래 은행[\s\S]*?<\/div>/) || [''])[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const r = {}; for (const [k, b] of [['pending', p1], ['neutral', nb], ['rival', rb], ['mine', mb]]) r[k] = [bankLine(scr(b, 'm')), loanRow(scr(b, 'o'))];
    console.log('info F3 ' + JSON.stringify(r));
    ok(/지배권 판정 보류/.test(r.pending[0]) && /지배권 판정 보류/.test(r.pending[1]), 'F3 pending current bank: 경영 탭 "' + r.pending[0] + '", 개요 탭 차입 현황 shows 지배권 판정 보류');
    ok(!/판정 보류/.test(r.neutral.join()) && /라이벌/.test(r.rival[0]) && !/판정 보류/.test(r.rival.join()) && /내 은행/.test(r.mine[0]) && !/판정 보류/.test(r.mine.join()), 'F3 neutral / rival / own wording unchanged');
    const f0 = JSON.stringify([c.ln, c.frz, c.cs, c.D, cRoom(c)]); c.ln = p1.id; scr(p1, 'm'); scr(p1, 'o'); c.ln = JSON.parse(f0)[0]; ok(JSON.stringify([c.ln, c.frz, c.cs, c.D, cRoom(c)]) === f0, 'F3 drawing the screen changes no financial value'); mdl = null; pg = ''; sel = -1 }
  // ---------- F5
  const fail = X => { const top = S.co.filter(c => c.kd === 1 && !c.dead && !mine(c)).sort((x, y) => y.A - x.A).slice(0, 3), k = top.indexOf(X); if (k < 0) return null; const R0 = _R; let n = 0;
    _R = () => { n++; return n === 1 ? (k + .5) / top.length : R0() }; try { BSF.bankFail() } finally { _R = R0 } return n };
  for (const seed of [831, 832, 833, 834, 835]) { world(seed); const X = banks().filter(b => !mine(b)).sort((a, b) => b.A - a.A)[0], Bs = S.co.filter(x => !x.dead && x.ln === X.id);
    const fin0 = JSON.stringify(Bs.map(x => [x.D, x.cs])), others = banks().filter(b => b !== X), A0 = JSON.stringify(others.map(b => [b.id, b.A, b.cs]));
    const n = fail(X); pre(n != null && X.dead === 1 && Bs.length > 5, 'F5 ' + seed + ' ' + X.tk + ' failed with ' + Bs.length + ' borrowers');
    const dead = Bs.filter(x => !S.co[x.ln] || S.co[x.ln].dead);
    ok(dead.length === 0, 'F5a seed ' + seed + ': borrowers pointing at a dead bank after bankFail: ' + dead.length + '/' + Bs.length + ' (to the failing bank itself: ' + Bs.filter(x => x.ln === X.id).length + ')');
    ok(JSON.stringify(Bs.map(x => [x.D, x.cs])) === fin0 && JSON.stringify(others.map(b => [b.id, b.A, b.cs])) === A0, 'F5b seed ' + seed + ': borrowers\' debt and cash, other banks\' assets and cash unchanged by the re-assignment') }
  { world(840); const X = banks().filter(b => !mine(b)).sort((a, b) => b.A - a.A)[0], Bs = S.co.filter(x => !x.dead && x.ln === X.id);
    for (const b of banks()) if (b !== X) b.dead = 1;   // fixture: every other bank is gone
    const n = fail(X); pre(n != null && X.dead === 1 && banks().length === 0, 'F5c only the failing bank was alive');
    ok(Bs.every(x => x.ln === -1), 'F5c no live bank left: borrowers have no lending bank (-1): ' + Bs.filter(x => x.ln === -1).length + '/' + Bs.length);
    bankFix(); const x0 = Bs[0]; let err = null; try { cRoom(x0); lnm(x0) } catch (e) { err = e.message }
    ok(Bs.every(x => x.ln === -1) && !err && lnm(x0) === '없음', 'F5c next monthly bankFix with no bank: still -1, screen shows "없음", credit room computes (' + err + ')') }
  console.log('errs', errs, 'fails', fails);
})();
