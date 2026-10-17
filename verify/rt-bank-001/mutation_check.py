"""Do the RT-BANK-001 tests (incl. R1, the cash flow statement) catch wrong implementations? Runs the bank tests against deliberately broken copies of the
built game (dist/game.js changed in memory only; src/ and dist/ are not touched).
usage: python3 build/build.py && python3 verify/rt-bank-001/mutation_check.py
Each mutant must make at least one of the listed tests fail; the unmutated game must pass all of them."""
import os, re, subprocess, sys, tempfile
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V)); T = os.path.join(R, 'tests')
rd = lambda p: open(p, encoding='utf-8').read()
SEED = ("Math.random=(()=>{let a=20261016;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);"
        "t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();\n")
TESTS = ['t_bank_writeoff.js', 't_clean_surplus.js', 't_bank_writeoff_cases.js', 't_bank_writeoff_cashflow.js']
game0, stub = rd(os.path.join(R, 'dist', 'game.js')), rd(os.path.join(T, 'stub.js'))
WB = 'function woBook(c){const w=c.woq||0;if(!(w>0))return;c.woq=0;c.ni-=w;'
MUTANTS = [
    ('none (the fixed game)', []),
    ('M1 the close never reports the write-off (woBook not called)', [('if(c.eh.length>8)c.eh.shift();woBook(c);', 'if(c.eh.length>8)c.eh.shift();')]),
    ('M2 reported but not cleared (would be reported again next close)', [(WB, 'function woBook(c){const w=c.woq||0;if(!(w>0))return;c.ni-=w;')]),
    ('M3 queued but not cut from assets on the default day', [('const ls=loanOf(c)*.3;b.A-=ls;b.woq=', 'const ls=loanOf(c)*.3;b.woq=')]),
    ('M4 cut from assets but not queued (the old behaviour)', [('b.A-=ls;b.woq=(b.woq||0)+ls;', 'b.A-=ls;')]),
    ('M5 reported before tax (tax and loss carryforward change)', [(',ga=c.gw*.025,pre=cp-ga;let tax=0;', ',ga=c.gw*.025,pre=cp-ga-(c.woq||0);let tax=0;'),
                                                                  (WB, 'function woBook(c){const w=c.woq||0;if(!(w>0))return;c.woq=0;c.er.wo=w;return;c.ni-=w;')]),
    ('M6 reported through operating profit (cash hit a second time)', [('if(c.sbx){op-=c.sbx;c.sbx=0}}', 'if(c.sbx){op-=c.sbx;c.sbx=0}if(c.woq){op-=c.woq;c.er0=c.woq;c.woq=0}}'),
                                                                       ('woBook(c);c.eqi=0;', 'if(c.er0){c.er.wo=c.er0;c.er0=0}c.eqi=0;')]),
    ('M7 reported twice as large', [('c.ni-=w;c.yni=(c.yni||0)-w;c.er.wo=(c.er.wo||0)+w;', 'c.ni-=2*w;c.yni=(c.yni||0)-2*w;c.er.wo=(c.er.wo||0)+2*w;')]),
    ('M8 stake value offset against the write-off', [('const ls=loanOf(c)*.3;b.A-=ls;b.woq=(b.woq||0)+ls;', 'const ls=loanOf(c)*.3;b.A-=ls;b.woq=(b.woq||0)+ls*.67;')]),
    ('M9 quarter record misses the write-off (fq)', [('c.er.imp||0,c.er.wo||0]);', 'c.er.imp||0,0]);')]),
    ('M10 old saves not given woq = 0', [('if(c.woq==null)c.woq=0}', '}')]),
    ('M11 parent equity-method income not corrected', [('S.co[+k.slice(1)].eqi-=w*c.own[k]/100;if(c.own.P||mine(c))L(c.tk+" 대손상각비', 'if(c.own.P||mine(c))L(c.tk+" 대손상각비')]),
    ('M12 cash flow: no add-back at all (the statement before R1)', [('cfo=q.ni-q.eq+q.ga+dep+(q.imp||0)+(q.wo||0),', 'cfo=q.ni-q.eq+q.ga+dep,')]),
    ('M13 cash flow: write-off not added back (impairment only)', [('cfo=q.ni-q.eq+q.ga+dep+(q.imp||0)+(q.wo||0),', 'cfo=q.ni-q.eq+q.ga+dep+(q.imp||0),')]),
    ('M14 cash flow: impairment not added back (write-off only)', [('cfo=q.ni-q.eq+q.ga+dep+(q.imp||0)+(q.wo||0),', 'cfo=q.ni-q.eq+q.ga+dep+(q.wo||0),')]),
    ('M15 cash flow: add-back counted twice', [('cfo=q.ni-q.eq+q.ga+dep+(q.imp||0)+(q.wo||0),', 'cfo=q.ni-q.eq+q.ga+dep+2*((q.imp||0)+(q.wo||0)),')]),
    ('M16 cash flow: records without imp/wo not read as 0', [('cfo=q.ni-q.eq+q.ga+dep+(q.imp||0)+(q.wo||0),', 'cfo=q.ni-q.eq+q.ga+dep+q.imp+q.wo,')]),
]
def run(game, name):
    code = SEED + stub + '\n' + game + '\n' + rd(os.path.join(T, name))
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(code); p = f.name
    out = subprocess.run(['node', p], capture_output=True, text=True, timeout=900, env=dict(os.environ, TESTS_DIR=T)); os.unlink(p)
    txt = out.stdout + out.stderr; m = re.findall(r'errs (\d+) fails (\d+)', txt)
    passed = bool(m) and m[-1] == ('0', '0') and out.returncode == 0
    first = next((l for l in txt.splitlines() if l.startswith('FAIL') or l.startswith('ERR') or 'Error' in l), '')
    return passed, first
bad = 0
for label, edits in MUTANTS:
    game = game0
    for a, b in edits:
        n = game.count(a)
        if n != 1: print('SETUP ERROR', label, 'snippet found', n, 'times:', a[:60]); sys.exit(2)
        game = game.replace(a, b)
    res = [(t,) + run(game, t) for t in TESTS]
    caught = [t for t, p, _ in res if not p]
    good = (not caught) if not edits else bool(caught)
    bad += not good
    print(('ok   ' if good else 'BAD  ') + label + ' -> ' + ('all pass' if not caught else 'caught by ' + ', '.join(caught)))
    for t, p, first in res:
        if not p: print('       ' + t + ': ' + first[:170])
print('ALL MUTANTS CAUGHT, fixed game passes' if not bad else str(bad) + ' problem(s)'); sys.exit(1 if bad else 0)
