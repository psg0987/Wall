"""Make the pre-fix export save used by tests/t_fincf02_save01.js (FIX-OLD case).
The save is written by the game as it was BEFORE the FIN-CF-02-SAVE-01 fix (main d82f847), with the export format a player copies
('세이브 내보내기', packS(1): WSR1: + deflate + base64; price histories, quarter records and indexes are left out and rebuilt on load).
usage: python3 verify/fin-cf-02-save01/make_old_save.py      (needs git history; writes tests/fixtures/old_save_d82f847_seed20261016_day127.wsr)
What it does: assembles game.js from `git show d82f847:src/...` (same order as build/build.py), runs it in node with the same seeded Math.random
and stub as tests/run.py, and plays seed 20261016:
  - the player takes 60% of PNPL (the first plain listed company, as the FIN-CF-02 tests pick it), two PNPL closes (the last on day 117),
    and 5 days later a 10% rights issue (G.mg 'iss'): its cash waits in PNPL.eqq for the next close (day 207);
  - on the same day a second company with a live bank lender gets an asset write-down and its bank calls the whole loan (callLoan, the
    loan-call path of tests/t_fincf01_relief.js F2b): chapter 11 outside the close, the relief waits in ncq for that company's next close;
  - plays on to day 127 (10 days after PNPL's close) and saves with packS(1).
So the file holds a pending eqq and a pending ncq that a pre-fix export carries over. The amounts are printed (measured around the calls)."""
import os, subprocess, sys, tempfile, hashlib
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V))
REV = 'd82f84764fdf242de4956ed9d53521a479cc80a9'
OUT = os.path.join(R, 'tests', 'fixtures', 'old_save_d82f847_seed20261016_day127.wsr')
show = lambda p: subprocess.run(['git', '-C', R, 'show', REV + ':' + p], capture_output=True, text=True, check=True).stdout
PARTS = ['data.js', 'core.js', 'sim.js', 'act1.js', 'act2.js', 'ui1.js', 'ui2.js']
game = show('src/base_v5.js') + '\n' + '\n'.join(show('src/' + f) for f in PARTS)
SEED = ("Math.random=(()=>{let a=20261016;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);"
        "t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();\n")
play = r"""(async () => {
const f2 = x => (+x).toFixed(2);
init(Object.assign(defCfg(), { tut: 0, seed: 20261016 })); mdl = null;
const T = S.co.find(c => !c.dead && !c.kd && !c.priv && !mine(c) && !c.own.P && c.bk === 0 && c.A > 3000);
setOwn(T, 'P', 60); ctlAll();
const nextClose = c => { const l0 = c.fq[c.fq.length - 1]; for (let i = 0; i < 400 && !c.dead; i++) { step(); if (c.fq[c.fq.length - 1] !== l0) return } };
nextClose(T); nextClose(T); const C = T.fq[T.fq.length - 1][0];
for (let i = 0; i < 5; i++) step();
const c0 = T.cs, d0 = T.D; G.mg(T.id, 'iss', .1); const X = (T.cs - c0) - (T.D - d0);
// the second company: plain, live bank lender, its own quarter open from before today until after the save day
const save = C + 10;
const Y = S.co.find(c => c !== T && !c.dead && !c.kd && !c.priv && !mine(c) && !c.own.P && c.bk === 0 && c.ln >= 0 && S.co[c.ln] && !S.co[c.ln].dead && S.co[c.ln].kd === 1 && c.A > 3000
  && c.fq && c.fq.length && c.fq[c.fq.length - 1][0] < S.day && c.fq[c.fq.length - 1][0] + 90 > save);
const D0 = Y.D; Y.cs = 0; { const Xd = Y.D - Y.cs - Y.gw - pfv(Y); Y.A = 0.7 * Xd / 1.25 / (1 + Y.g / 4) }
const paid = callLoan(S.co[Y.ln], Y, 1); const RY = Y.ncq;
while (S.day < save) step();
const txt = await packS(1);
require('fs').writeFileSync(process.env.OUT, txt);
console.log('day ' + S.day + ' | ' + T.tk + ' (id ' + T.id + '): last close ' + C + ', issue on day ' + (C + 5) + ' cash ' + f2(X) + ', eqq at save ' + f2(T.eqq) + ', next close ' + (C + 90));
console.log('      ' + Y.tk + ' (id ' + Y.id + '): last close ' + Y.fq[Y.fq.length - 1][0] + ', loan call on day ' + (C + 5) + ' paid ' + f2(paid) + ', chapter 11 bk ' + Y.bk + ', debt ' + f2(D0) + ' -> ' + f2(Y.D) + ', ncq at save ' + f2(Y.ncq) + ' (relief ' + f2(RY) + ')');
console.log('      other companies with a pending eqq: ' + S.co.filter(c => !c.dead && c.eqq && c !== T).map(c => c.tk + ' ' + f2(c.eqq)).join(', ') + ' | pending ncq: ' + S.co.filter(c => !c.dead && c.ncq && c !== Y).map(c => c.tk + ' ' + f2(c.ncq)).join(', '));
})().catch(e => { console.log('ERR', e && e.stack || e); process.exitCode = 1 });"""
stub = open(os.path.join(R, 'tests', 'stub.js'), encoding='utf-8').read()
with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
    f.write(SEED + stub + '\n' + game + '\n' + play); p = f.name
out = subprocess.run(['node', p], capture_output=True, text=True, env=dict(os.environ, OUT=OUT)); os.unlink(p)
print(out.stdout + out.stderr, end='')
if out.returncode or 'ERR' in out.stdout: sys.exit(out.returncode or 1)
print('wrote', os.path.relpath(OUT, R), os.path.getsize(OUT), 'bytes, sha256', hashlib.sha256(open(OUT, 'rb').read()).hexdigest())
