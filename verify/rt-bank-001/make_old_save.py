"""Make the old-version save used by tests/t_bank_writeoff_cases.js (TC-BANK-04).
The save is written by the game as it was before the RT-BANK-001 fix (commit 1ecdc53, main), so it has no woq field.
usage: python3 verify/rt-bank-001/make_old_save.py      (needs git history; writes tests/fixtures/old_save_1ecdc53_seed12345_day440.wsr)
What it does: assembles game.js from `git show 1ecdc53:src/...` (same order as build/build.py), runs it in node with the
same seeded Math.random and stub as tests/run.py, plays seed 12345 for 440 days with no player actions, and saves with
packS(1), the format a player copies with 'export save' (WSR1: gzip + base64; price histories and quarter records are
left out and rebuilt on load). Day 440 is 9 days after the bank BOAX wrote off 286.97 for JYNR's chapter 11 (day 431)
and before BOAX's next close (day 494)."""
import os, subprocess, sys, tempfile, hashlib
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V))
REV = '1ecdc53e851d8a19b083122d19edfb40cfab60d5'
OUT = os.path.join(R, 'tests', 'fixtures', 'old_save_1ecdc53_seed12345_day440.wsr')
show = lambda p: subprocess.run(['git', '-C', R, 'show', REV + ':' + p], capture_output=True, text=True, check=True).stdout
PARTS = ['data.js', 'core.js', 'sim.js', 'act1.js', 'act2.js', 'ui1.js', 'ui2.js']
game = show('src/base_v5.js') + '\n' + '\n'.join(show('src/' + f) for f in PARTS)
SEED = ("Math.random=(()=>{let a=20261016;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);"
        "t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();\n")
play = """(async () => {
init(Object.assign(defCfg(), { tut: 0, seed: 12345 })); mdl = null;
for (let d = 0; d < 440; d++) { step(); if (mdl) G.mk(mdl.o.length - 1) }
require('fs').writeFileSync(process.env.OUT, await packS(1));
const b = S.co.find(c => c.tk === 'BOAX');
console.log('day', S.day, 'BOAX assets', b.A.toFixed(2), 'last close', b.er.d, 'woq' in b ? 'woq present' : 'no woq field');
})();"""
stub = open(os.path.join(R, 'tests', 'stub.js'), encoding='utf-8').read()
with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
    f.write(SEED + stub + '\n' + game + '\n' + play); p = f.name
out = subprocess.run(['node', p], capture_output=True, text=True, env=dict(os.environ, OUT=OUT)); os.unlink(p)
print(out.stdout + out.stderr, end='')
if out.returncode: sys.exit(out.returncode)
print('wrote', os.path.relpath(OUT, R), os.path.getsize(OUT), 'bytes, sha256', hashlib.sha256(open(OUT, 'rb').read()).hexdigest())
