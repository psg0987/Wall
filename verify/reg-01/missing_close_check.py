"""REG-01 error classification check: make the 'no usable bank close' situation artificially and confirm that
tests/t_reg01_bank_imp_wo.js reports `ERR  FIXTURE INVALID` (errs > 0, test FAILS) and never throws a JavaScript exception.
The test source is changed in memory only (nothing on disk). usage: python3 build/build.py && python3 verify/reg-01/missing_close_check.py"""
import os, re, subprocess, sys, tempfile
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V)); T = os.path.join(R, 'tests')
rd = lambda p: open(p, encoding='utf-8').read()
SEED = ("Math.random=(()=>{let a=20261016;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);"
        "t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();\n")
game, stub, test0 = rd(os.path.join(R, 'dist', 'game.js')), rd(os.path.join(T, 'stub.js')), rd(os.path.join(T, 't_reg01_bank_imp_wo.js'))
VARIANTS = [
    ('V0 unchanged test', [], True),
    ('V1 the bank never closes (run stops after 20 days, before the day-60 close)', [('play(120, () => rec);', 'play(20, () => rec);')], False),
    ('V2 the bank is gone after the close of case C only', [('const R = { kind, opt, b, c, T, rec, entry, impN };', 'if (rec && kind === "C" && !opt.noImp && !opt.dropWo) rec.dead = true;\n  const R = { kind, opt, b, c, T, rec, entry, impN };')], False),
    ('V3 close recorded but the statement tabs not read (R.cf missing)', [('if (rec && !b.dead) {', 'if (false) {')], False),
    ('V4 only one twin has no close (twin Cimp stops after 20 days)', [('play(120, () => rec);', 'play(opt.dropWo && !opt.noImp ? 20 : 120, () => rec);')], False),
]
bad = 0
for label, edits, should_pass in VARIANTS:
    t = test0
    for a, b in edits:
        if t.count(a) != 1: print('SETUP ERROR', label, t.count(a)); sys.exit(2)
        t = t.replace(a, b)
    code = SEED + stub + '\n' + game + '\n' + t
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(code); p = f.name
    out = subprocess.run(['node', p], capture_output=True, text=True, timeout=900, env=dict(os.environ, TESTS_DIR=T)); os.unlink(p)
    txt = out.stdout + out.stderr; m = re.findall(r'errs (\d+) fails (\d+)', txt)
    passed = bool(m) and m[-1] == ('0', '0') and out.returncode == 0
    exc = [l for l in txt.splitlines() if re.search(r'TypeError|ReferenceError|Cannot read|is not defined|at .*\.js:\d+', l)]
    errl = [l for l in txt.splitlines() if l.startswith('ERR  FIXTURE INVALID')]
    other = [l for l in txt.splitlines() if l.startswith('ERR') and not l.startswith('ERR  FIXTURE INVALID')]
    good = passed if should_pass else (not passed and bool(m) and int(m[-1][0]) > 0 and bool(errl) and not exc and not other)
    bad += not good
    print(('ok   ' if good else 'BAD  ') + label + ' -> ' + ('PASS' if passed else 'FAIL') + ', summary ' + (' '.join(m[-1]) if m else 'none') + ', FIXTURE INVALID lines ' + str(len(errl)) + ', other ERR ' + str(len(other)) + ', exceptions ' + str(len(exc)))
    for l in (errl + other + exc)[:4]: print('       ' + l[:200])
print('error classification works' if not bad else str(bad) + ' problem(s)'); sys.exit(1 if bad else 0)
