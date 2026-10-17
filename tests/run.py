"""Build the game and run every test with a seeded Math.random (results repeat exactly).
usage: python3 tests/run.py [name-filter]      (UPDATE_GOLDEN=1 rewrites tests/golden.json, VERBOSE=1 prints each test's full output)"""
import os, re, subprocess, sys, tempfile
T = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(T)
subprocess.run([sys.executable, os.path.join(R, 'build', 'build.py')], check=True, stdout=subprocess.DEVNULL)
rd = lambda p: open(p, encoding='utf-8').read()
SEED = ("Math.random=(()=>{let a=20261016;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);"
        "t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();\n")
TESTS = [('t12_sim.js', None), ('t13_ui.js', None), ('t14_advisor.js', None), ('t18_ai_native.js', 'ai_native_fake.js'),
         ('t18_ai_web.js', None), ('t_clean_surplus.js', None), ('t_close_spec.js', None), ('t_impair_ui.js', None), ('t_bank_writeoff.js', None), ('t_bank_writeoff_cases.js', None), ('t_bank_writeoff_cashflow.js', None), ('t_golden.js', None)]
flt = sys.argv[1] if len(sys.argv) > 1 else ''
stub, game, bad = rd(os.path.join(T, 'stub.js')), rd(os.path.join(R, 'dist', 'game.js')), 0
for name, pre in TESTS:
    if flt not in name: continue
    code = SEED + stub + '\n' + (rd(os.path.join(T, pre)) + '\n' if pre else '') + game + '\n' + rd(os.path.join(T, name))
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(code); p = f.name
    out = subprocess.run(['node', p], capture_output=True, text=True, timeout=900, env=dict(os.environ, TESTS_DIR=T))
    os.unlink(p)
    txt = out.stdout + out.stderr
    if os.environ.get('VERBOSE'): print('---- ' + name + '\n' + txt.rstrip())
    m = re.findall(r'errs (\d+) fails (\d+)', txt)
    ok = bool(m) and m[-1] == ('0', '0') and out.returncode == 0
    bad += not ok
    print(('PASS ' if ok else 'FAIL ') + name + ('' if ok else '\n' + '\n'.join(l for l in txt.splitlines() if 'FAIL' in l or 'ERR' in l or 'Error' in l)[:1500]))
print('ALL PASS' if not bad else f'{bad} test file(s) failed'); sys.exit(1 if bad else 0)
