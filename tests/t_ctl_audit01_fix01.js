// RT-CTL-AUDIT-01-FIX-01 (Claude), written BEFORE the fix. Two authority edges from GPT-6's independent audit.
// A  G.ev2Pick: an event opened while I was CEO (S.ev2.m "ceo") must not run as a CEO decision after I resigned as CEO before confirming,
//    while I still control the company. Normal CEO decisions, the controlling holder's board route (manage / intervene) and an approved
//    intervention ("int") keep working.
// B  G.chbank / G.bkPick: a bank whose control is pending (ctl "?") must not be chosen as the new lending bank, and the bank list must say
//    '판정 보류' for it instead of '중립'. Neutral and own banks stay selectable; leaving a pending bank stays possible. (Existing loans at a
//    pending bank: interest / repayment / maturity are checked across revisions by verify/rt-ctl-audit-01-fix-01/loan_hash.js.)
let errs = 0, fails = 0; const ok = (x, m) => { console.log((x ? 'ok ' : 'FAIL ') + m); if (!x) fails++ }; const pre = (x, m) => { if (!x) { errs++; console.log('ERR precondition ' + m) } };
const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const world = seed => { Math.random = mul(seed); init(Object.assign(defCfg(), { tut: 0, seed })); mdl = null; S.spd = 0; sel = -1; pg = ''; S.apAll = 0; S.ev2 = null };
const iso = c => { for (const k of Object.keys(c.own)) setOwn(c, k, 0); for (const t of Object.keys(c.pos)) setOwn(S.co[+t], 'c' + c.id, 0) };
const ords = () => S.co.filter(c => !c.dead && !c.priv && !c.kd && c.i !== HOLD && c.bk === 0);
// one of my companies with an event that has a slider-free player choice; e.go is wrapped to record what is carried out
function setup(seed, pP) { world(seed); const c = ords()[3]; iso(c); setOwn(c, 'P', pP); ctlAll(); pre(mine(c), 'my company');
  const e = EV2.find(z => z.id !== 'offer' && z.el(c) && z.o && z.o.length >= 2) || EV2.find(z => z.id !== 'offer' && z.o && z.o.length >= 2); const x = e.mk(c);
  const calls = [], go0 = e.go; e.go = function (c2, x2, k, v) { calls.push([k, v]); return go0.apply(this, arguments) };
  return { c, e, x, calls, done: () => { e.go = go0; mdl = null; S.ev2 = null } } }
const playerKey = e => e.o[e.o.length - 1][1];

// ---------- A1 CEO when the event opened, resigned (G.mg 'ceo' toggle) before confirming, still the controlling holder
{ const t = setup(601, 60); G.mg(t.c.id, 'ceo'); pre(S.ceo === t.c.id, 'A1 I am CEO'); S.ev2 = { id: t.e.id, c: t.c.id, x: t.x, v: 0, m: evWho(t.c) }; pre(S.ev2.m === 'ceo', 'A1 event opened in CEO mode');
  G.mg(t.c.id, 'ceo'); pre(S.ceo !== t.c.id && mine(t.c), 'A1 resigned as CEO, control kept'); const k = playerKey(t.e); pre(t.e.ai(t.c, t.x)[0] !== k, 'A1 player choice differs from the management plan'); G.ev2Pick(k);
  ok(!t.calls.some(x => x[0] === k), 'A1 the old CEO-mode choice "' + k + '" is not carried out after resigning (carried out: ' + JSON.stringify(t.calls) + ')');
  ok(!S.ev2 || S.ev2.m === 'own', 'A1 the event is closed or handed back to the controlling-holder route (ev2 ' + JSON.stringify(S.ev2 && S.ev2.m) + ')'); t.done() }
// ---------- A2 normal CEO decision still carried out with the player's choice and value
{ const t = setup(602, 60); G.mg(t.c.id, 'ceo'); S.ev2 = { id: t.e.id, c: t.c.id, x: t.x, v: 0, m: evWho(t.c) }; pre(S.ev2.m === 'ceo', 'A2 CEO mode'); const k = playerKey(t.e); G.ev2Pick(k);
  ok(t.calls.length === 1 && t.calls[0][0] === k && !S.ev2, 'A2 CEO decision "' + k + '" carried out once: ' + JSON.stringify(t.calls)); t.done() }
// ---------- A3 controlling holder, not CEO: leave it to management -> management's plan is carried out
{ const t = setup(603, 60); pre(S.ceo !== t.c.id, 'A3 not CEO'); S.ev2 = { id: t.e.id, c: t.c.id, x: t.x, v: 0, m: evWho(t.c) }; pre(S.ev2.m === 'own', 'A3 own mode');
  const [a] = t.e.ai(t.c, t.x); G.ev2Pick('mg'); ok(t.calls.length === 1 && t.calls[0][0] === a && !S.ev2, 'A3 management decision "' + a + '" carried out: ' + JSON.stringify(t.calls)); t.done() }
// ---------- A4 controlling holder intervenes; board approves -> "int" mode -> the player's choice is carried out
{ const t = setup(604, 60); S.ev2 = { id: t.e.id, c: t.c.id, x: t.x, v: 0, m: evWho(t.c) }; const R0 = _R; _R = () => 0; G.ev2Pick('int'); _R = R0;
  pre(S.ev2 && S.ev2.m === 'int' && t.calls.length === 0, 'A4 board approved the intervention'); const k = playerKey(t.e); G.ev2Pick(k);
  ok(t.calls.length === 1 && t.calls[0][0] === k && !S.ev2, 'A4 approved intervention: player choice "' + k + '" carried out: ' + JSON.stringify(t.calls)); t.done() }
// ---------- A5 controlling holder intervenes; board refuses -> management's plan
{ const t = setup(605, 60); S.ev2 = { id: t.e.id, c: t.c.id, x: t.x, v: 0, m: evWho(t.c) }; const R0 = _R; _R = () => .999; const [a] = t.e.ai(t.c, t.x); G.ev2Pick('int'); _R = R0;
  ok(t.calls.length === 1 && t.calls[0][0] === a && !S.ev2, 'A5 refused intervention: management decision "' + a + '" carried out: ' + JSON.stringify(t.calls)); t.done() }
// ---------- A6 approved intervention ("int") stays valid while I keep control (no CEO right needed)
{ const t = setup(606, 60); S.ev2 = { id: t.e.id, c: t.c.id, x: t.x, v: 0, m: 'int' }; const k = playerKey(t.e); G.ev2Pick(k);
  ok(t.calls.length === 1 && t.calls[0][0] === k, 'A6 int mode, not CEO: player choice "' + k + '" carried out: ' + JSON.stringify(t.calls)); t.done() }

// ---------- A7 (added after the fix) after resigning, the handed-back event follows the controlling-holder route: board options shown, 'mg' runs management's plan
{ const t = setup(607, 60); G.mg(t.c.id, 'ceo'); S.ev2 = { id: t.e.id, c: t.c.id, x: t.x, v: 0, m: evWho(t.c) }; G.mg(t.c.id, 'ceo'); G.ev2Pick(playerKey(t.e));
  const opts = mdl && mdl.o ? mdl.o.map(o => o[1]).join(',') : ''; const [a] = t.e.ai(t.c, t.x); G.ev2Pick('mg');
  ok(opts === 'mg,int' && t.calls.length === 1 && t.calls[0][0] === a && !S.ev2, 'A7 handed-back event shows [' + opts + '] and then runs management decision "' + a + '": ' + JSON.stringify(t.calls)); t.done() }

// ---------- B: a pending bank (two banks holding 60% of each other, no previous label)
function bankWorld(seed) { world(seed); const bs = S.co.filter(c => !c.dead && c.kd === 1 && !c.priv); const [p1, p2] = bs; iso(p1); iso(p2); setOwn(p1, 'c' + p2.id, 60); setOwn(p2, 'c' + p1.id, 60); p1.ctl = p2.ctl = null; ctlAll();
  pre(p1.ctl === '?' && p2.ctl === '?', 'B pending banks ' + p1.tk + ' / ' + p2.tk);
  const nb = bs.find(b => b !== p1 && b !== p2 && !b.ctl), c = ords().find(x => x.ln >= 0 && x.ln !== p1.id && x.ln !== p2.id && x.ln !== (nb && nb.id)); iso(c); setOwn(c, 'P', 60); ctlAll(); pre(mine(c) && !!nb, 'B my borrower and a neutral bank');
  return { p1, p2, nb, c } }
const fin = c => JSON.stringify([c.ln, c.frz, c.cs, c.D]);
// ---------- B1 G.chbank to a pending bank is refused, nothing charged
{ const w = bankWorld(611), f0 = fin(w.c); G.chbank(w.c.id, w.p1.id); mdl = null;
  ok(fin(w.c) === f0, 'B1 G.chbank to the pending bank ' + w.p1.tk + ' refused: lending bank, credit freeze, cash and debt unchanged (' + f0 + ' -> ' + fin(w.c) + ')') }
// ---------- B2 the bank list labels the pending bank '판정 보류', not '중립'
{ const w = bankWorld(612); G.bkPick(w.c.id); const h = (mdl && mdl.h) || ''; mdl = null; const row = (h.split('<div class="sr"').find(r => r.includes('G.bkGo(' + w.c.id + ',' + w.p1.id + ')')) || '');
  pre(row.length > 0, 'B2 pending bank listed'); ok(row.includes('판정 보류') && !row.includes('중립'), 'B2 pending bank row says 판정 보류: ' + (row.match(/<div class="mu">([^<]*)/) || [])[1]);
  const nrow = (h.split('<div class="sr"').find(r => r.includes('G.bkGo(' + w.c.id + ',' + w.nb.id + ')')) || ''); ok(!nrow || nrow.includes('중립'), 'B2 neutral bank row still says 중립') }
// ---------- B3 neutral and own banks stay selectable; leaving a pending bank stays possible
{ const w = bankWorld(613); G.chbank(w.c.id, w.nb.id); mdl = null; ok(w.c.ln === w.nb.id, 'B3 change to a neutral bank still works');
  const mb = S.co.find(b => !b.dead && b.kd === 1 && b !== w.p1 && b !== w.p2 && b !== w.nb); iso(mb); setOwn(mb, 'P', 60); ctlAll(); pre(mine(mb), 'B3 my bank'); G.chbank(w.c.id, mb.id); mdl = null; ok(w.c.ln === mb.id, 'B3 change to my bank still works');
  w.c.ln = w.p1.id; G.chbank(w.c.id, w.nb.id); mdl = null; ok(w.c.ln === w.nb.id, 'B3 a borrower of the pending bank can still move to a neutral bank') }
console.log('errs', errs, 'fails', fails);
