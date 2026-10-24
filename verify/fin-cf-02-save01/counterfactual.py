"""RT-FIN-CF-02-SAVE-01 investigation (2026-10-24, read-only): is clearing the pending amounts at the export restore (options A / A1) invisible to the
game? Runs counterfactual.js once per variant (current, fixA, fixA1) in separate node processes through run.py and compares the outputs line by line
(daily whole-state hashes without the recording-only ledger fields, and the random-stream positions at the end of every scenario).
usage: python3 verify/fin-cf-02-save01/counterfactual.py [out-dir]"""
import os, subprocess, sys, tempfile
V = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else tempfile.mkdtemp(prefix='save01_cf_')
os.makedirs(OUT, exist_ok=True)
VARS = ['current', 'fixA', 'fixA1']
procs = {v: subprocess.Popen([sys.executable, os.path.join(V, 'run.py'), os.path.join(V, 'counterfactual.js')], stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                             text=True, env=dict(os.environ, VARIANT=v)) for v in VARS}
res = {}
for v, p in procs.items():
    o, _ = p.communicate(); open(os.path.join(OUT, 'counterfactual_' + v + '.txt'), 'w').write(o); res[v] = o.strip().splitlines()
    if p.returncode or 'ERR' in o: print('RUN FAILED', v, o[-800:]); sys.exit(2)
body = {v: [l for l in res[v] if not l.startswith('game sha256') and ' | pending companies' not in l] for v in VARS}
for v in VARS:
    for l in res[v]:
        if l.startswith('game sha256') or ' | pending companies' in l: print(v + ': ' + l)
bad = 0
for v in VARS[1:]:
    assert len(body[v]) == len(body['current']), (v, len(body[v]), len(body['current']))
    diff = [(a, b) for a, b in zip(body['current'], body[v]) if a != b]
    print('%s vs current: %d lines compared (daily state hashes + end-of-scenario random draws), %s' % (v, len(body[v]), 'ALL IDENTICAL' if not diff else '%d differ, first: %s | %s' % (len(diff), diff[0][0], diff[0][1])))
    bad += bool(diff)
for l in body['current']:
    if ' END ' in l: print('   ' + l)
print('output files in ' + OUT); sys.exit(1 if bad else 0)
