"""RT-BANK-R4C: price/target comparison of the natural BOAX case (seed 12345: JYNR's first chapter 11 on day 431 cuts BOAX's assets by 286.97,
BOAX's next close is day 494) between main (553d2f6) and the branch, plus every analyst rating change of BOAX in the window.
usage: python3 verify/r4c/price_compare.py"""
import ast, json, os, subprocess, sys, tempfile
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MAIN = '553d2f6aa703a20b3486f39c8667b1fa04124a28'
rd = lambda p: open(p, encoding='utf-8').read()
b = ast.parse(rd(R + '/build/build.py')); PARTS = [ast.literal_eval(n.value) for n in b.body if isinstance(n, ast.Assign) and any(getattr(t, 'id', '') == 'PARTS' for t in n.targets)][0]
t = ast.parse(rd(R + '/tests/run.py')); SEED = [ast.literal_eval(n.value) for n in t.body if isinstance(n, ast.Assign) and any(getattr(x, 'id', '') == 'SEED' for x in n.targets)][0]
git = lambda *a: subprocess.run(['git', '-C', R] + list(a), capture_output=True, text=True, check=True).stdout
games = {'main': git('show', MAIN + ':src/base_v5.js') + '\n' + '\n'.join(git('show', MAIN + ':src/' + f) for f in PARTS),
         'branch': rd(R + '/src/base_v5.js') + '\n' + '\n'.join(rd(R + '/src/' + f) for f in PARTS)}
PROBE = r'''
(() => {
const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
Math.random = mulberry(12345); init(Object.assign(defCfg(), { tut: 0, seed: 12345 })); mdl = null;
const rows = {}, ratings = [], DAYS = [429, 430, 431, 432, 436, 441, 446, 461, 476, 493, 494, 495, 499, 504, 524, 554];
let ar0 = null;
for (let d = 0; d < 560; d++) { step(); if (mdl) G.mk(mdl.o.length - 1); const b = S.co.find(x => x.tk === 'BOAX'); if (S.day >= 431 && ar0 != null && b.ar !== ar0) ratings.push('day ' + S.day + ': rating ' + ar0 + ' -> ' + b.ar + ' (target ' + b.atp + ', price ' + b.p.toFixed(1) + ')'); ar0 = b.ar; if (DAYS.includes(S.day)) rows[S.day] = { p: b.p, tg: b.tg, ar: b.ar, atp: b.atp, woq: b.woq || 0, eq: eq(b), ni: b.ni, cs: b.cs, sh: b.sh, jx: b.jx || 0 } }
console.log(JSON.stringify({ rows, ratings }));
})();
'''
res = {}
for tag, g in games.items():
    f = tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8'); f.write(SEED + rd(R + '/tests/stub.js') + '\n' + g + '\n' + PROBE); f.close()
    o = subprocess.run(['node', f.name], capture_output=True, text=True, timeout=900); os.unlink(f.name)
    if o.returncode: print('PROBE FAILED', tag, o.stderr[-600:]); sys.exit(2)
    res[tag] = json.loads(o.stdout.strip().splitlines()[-1])
print('BOAX, natural seed 12345 (default day 431, close day 494). price p and target tg: main | branch (R4C)')
print('%-5s %10s %10s | %10s %10s | %7s %7s | %s' % ('day', 'p main', 'tg main', 'p branch', 'tg branch', 'p b/m', 'woq', 'note'))
for d in sorted(res['main']['rows'], key=int):
    m, r = res['main']['rows'][d], res['branch']['rows'][d]
    note = {'430': 'day before the default', '431': 'JYNR chapter 11: BOAX assets -286.97, woq 286.97', '494': 'BOAX close: loss booked (er.wo 286.97), woq cleared', '495': 'day after the close'}.get(d, '')
    print('%-5s %10.1f %10.1f | %10.1f %10.1f | %7.3f %7.1f | %s' % (d, m['p'], m['tg'], r['p'], r['tg'], r['p'] / m['p'], r['woq'], note))
for tag in ('main', 'branch'):
    print('analyst rating changes of BOAX from day 431 (%s, -2 sell .. 2 buy; each step adds a -0.012 jump when market cap >= 1500): %d' % (tag, len(res[tag]['ratings']))); [print('   ', x[:150]) for x in res[tag]['ratings']]
