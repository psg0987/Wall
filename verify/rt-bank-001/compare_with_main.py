"""What does the RT-BANK-001 fix change in whole games? Plays the fixed seeds for 720 days (no player actions) with the
game before the fix (commit 1ecdc53, rebuilt from git) and with the current build (dist/game.js), and prints a summary
of each. Same seeded Math.random and stub as tests/run.py. usage: python3 build/build.py && python3 verify/rt-bank-001/compare_with_main.py"""
import os, subprocess, sys, tempfile
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V))
REV = '1ecdc53e851d8a19b083122d19edfb40cfab60d5'
show = lambda p: subprocess.run(['git', '-C', R, 'show', REV + ':' + p], capture_output=True, text=True, check=True).stdout
PARTS = ['data.js', 'core.js', 'sim.js', 'act1.js', 'act2.js', 'ui1.js', 'ui2.js']
old = show('src/base_v5.js') + '\n' + '\n'.join(show('src/' + f) for f in PARTS)
new = open(os.path.join(R, 'dist', 'game.js'), encoding='utf-8').read()
SEED = ("Math.random=(()=>{let a=20261016;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);"
        "t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();\n")
PLAY = r"""(() => {
for (const SEED of [12345, 777, 20261016]) {
  init(Object.assign(defCfg(), { tut: 0, seed: SEED })); mdl = null;
  const wo = [], e0 = earn; earn = function (c) { e0(c); if (c.kd === 1 && c.er && c.er.d === S.day && c.er.wo) wo.push(c.tk + ' day ' + S.day + ' ' + c.er.wo.toFixed(2)) };
  let bk = 0; const x0 = ch11x; ch11x = function (c, why) { const b = S.co[c.ln]; if (c.bk === 0 && b && !b.dead && loanOf(c) > 0) bk++; return x0(c, why) };
  for (let d = 0; d < 720; d++) { step(); if (mdl) G.mk(mdl.o.length - 1) }
  earn = e0; ch11x = x0;
  const live = S.co.filter(c => !c.dead), r = x => Math.round(x * 1e6) / 1e6, crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(JSON.stringify(live.map(c => [c.tk, r(c.p), r(c.A), r(c.D), r(c.cs), r(c.sh)]))).digest('hex').slice(0, 16);
  console.log('seed ' + SEED + ': first chapter 11s with a bank loan ' + bk + ', write-offs reported ' + (wo.join('; ') || 'none') +
    ' | net worth ' + r(nw()) + ', market cap ' + r(live.reduce((a, c) => a + mc(c), 0)) + ', assets ' + r(live.reduce((a, c) => a + c.A, 0)) +
    ', debt ' + r(live.reduce((a, c) => a + c.D, 0)) + ', last-quarter NI ' + r(live.reduce((a, c) => a + (c.er ? c.er.ni : 0), 0)) + ', alive ' + live.length + ', state hash ' + hash);
}
})();"""
stub = open(os.path.join(R, 'tests', 'stub.js'), encoding='utf-8').read()
for name, game in [('before the fix (1ecdc53)', old), ('after the fix (dist/game.js)', new)]:
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(SEED + stub + '\n' + game + '\n' + PLAY); p = f.name
    out = subprocess.run(['node', p], capture_output=True, text=True); os.unlink(p)
    print('== ' + name); print((out.stdout + out.stderr).rstrip())
    if out.returncode: sys.exit(out.returncode)
