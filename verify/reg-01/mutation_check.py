"""REG-01: does tests/t_reg01_bank_imp_wo.js catch wrong implementations? Runs the test against deliberately broken copies of the built game
(dist/game.js changed in memory only; src/ and dist/ are not touched).
usage: python3 build/build.py && python3 verify/reg-01/mutation_check.py
Each mutant must make the REG-01 test fail; the unmutated game must pass. For information the four older bank tests are run on the same mutants,
to show which mutants only REG-01 catches. Mutants marked SURVIVES are expected to pass: they change something the REG-01 scope excludes or that cannot
change any value in these cases (documented in docs/VERIFY.md); a SURVIVES mutant that is caught, or a normal mutant that is not caught, is a problem."""
import os, re, subprocess, sys, tempfile
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V)); T = os.path.join(R, 'tests')
rd = lambda p: open(p, encoding='utf-8').read()
SEED = ("Math.random=(()=>{let a=20261016;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);"
        "t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();\n")
NEW = 't_reg01_bank_imp_wo.js'
OLD = ['t_bank_writeoff.js', 't_clean_surplus.js', 't_bank_writeoff_cases.js', 't_bank_writeoff_cashflow.js']
game0, stub = rd(os.path.join(R, 'dist', 'game.js')), rd(os.path.join(T, 'stub.js'))
WB = 'function woBook(c){const w=c.woq||0;if(!(w>0))return;c.woq=0;c.ni-=w;'
CFO = 'cfo=q.ni-q.eq+q.ga+dep+(q.imp||0)+(q.wo||0),'
CUT = 'const ls=loanOf(c)*.3;b.A-=ls;b.woq=(b.woq||0)+ls;'
EHW = 'c.er.wo=(c.er.wo||0)+w;c.er.ni=c.ni;if(c.eh&&c.eh.length)c.eh[c.eh.length-1]=Math.round(c.ni*1e5/c.sh)/10;'
IMP = 'c.er.imp=(c.er.imp||0)+wd;c.er.ni=c.ni;if(c.eh&&c.eh.length)c.eh[c.eh.length-1]=Math.round(c.ni*1e5/c.sh)/10;'
ROWNC = 'q=>(q.imp||0)+(q.wo||0)]]'
# (label, edits, survives)
MUTANTS = [
    ('none (the unmodified game)', [], False),
    # the cut and the queue (T0 -> T1) and the single deduction
    ('N1 woBook cuts the assets a second time', [(WB, 'function woBook(c){const w=c.woq||0;if(!(w>0))return;c.woq=0;c.A-=w;c.ni-=w;')], False),
    ('N2 ch11x cuts the assets twice', [(CUT, 'const ls=loanOf(c)*.3;b.A-=2*ls;b.woq=(b.woq||0)+ls;')], False),
    ('N3 ch11x does not cut the assets (only queues)', [(CUT, 'const ls=loanOf(c)*.3;b.woq=(b.woq||0)+ls;')], False),
    ('N4 ch11x queues nothing (cut only, as before RT-BANK-001)', [(CUT, 'const ls=loanOf(c)*.3;b.A-=ls;')], False),
    ('N5 woBook is skipped in a close that also impairs (decided before the impairment is known: ds>=3)', [('woBook(c);c.eqi=0;', 'if(!(c.ds>=3))woBook(c);c.eqi=0;')], False),
    ('N6 woBook runs after the impairment (same net income; only the ds streak could see it)', [('if(c.eh.length>8)c.eh.shift();woBook(c);c.eqi=0;', 'if(c.eh.length>8)c.eh.shift();c.eqi=0;'),
        ('if(eq(c)<(c.kd?0:-.25*c.A)){ch11(c,"자본잠식");if(c.dead)return}', 'woBook(c);if(eq(c)<(c.kd?0:-.25*c.A)){ch11(c,"자본잠식");if(c.dead)return}')], True),
    # net income, EPS, yearly net income, parent
    ('N7 impairment overwrites the write-off in the quarter record', [(IMP, 'c.er.wo=0;' + IMP)], False),
    ('N8 impairment refreshes EPS from net income before the write-off', [(IMP, 'c.er.imp=(c.er.imp||0)+wd;c.er.ni=c.ni;if(c.eh&&c.eh.length)c.eh[c.eh.length-1]=Math.round((c.ni+(c.er.wo||0))*1e5/c.sh)/10;')], False),
    ('N9 write-off does not refresh EPS', [(EHW, 'c.er.wo=(c.er.wo||0)+w;c.er.ni=c.ni;')], False),
    ('N10 write-off not added to yearly net income', [('c.yni=(c.yni||0)-w;c.er.wo', 'c.er.wo')], False),
    ('N11 impairment counted twice in yearly net income', [('function impair(c,wd){c.ni-=wd;c.yni=(c.yni||0)-wd;', 'function impair(c,wd){c.ni-=wd;c.yni=(c.yni||0)-2*wd;')], False),
    ('N12 impairment does not reach the 25% holder', [('S.co[+k.slice(1)].eqi-=wd*c.own[k]/100;if(c.own.P||mine(c))L(c.tk+" 자산 손상', 'if(c.own.P||mine(c))L(c.tk+" 자산 손상')], False),
    ('N13 impairment books only half of the asset cut', [('function impair(c,wd){c.ni-=wd;c.yni=(c.yni||0)-wd;c.er.imp=(c.er.imp||0)+wd;', 'function impair(c,wd){wd=wd*.5;c.ni-=wd;c.yni=(c.yni||0)-wd;c.er.imp=(c.er.imp||0)+wd;')], False),
    # impairment amount and the bank's own chapter 11
    ('N14 impairment cuts to equity -20% of assets instead of -30%', [('c.A=Math.max(c.A*.2,c.A-(e+.3*c.A))', 'c.A=Math.max(c.A*.2,c.A-(e+.2*c.A))')], False),
    ('N15 impairment books the charge but does not cut the assets', [('c.A=Math.max(c.A*.2,c.A-(e+.3*c.A));const wd=a0-c.A;', 'const wd=a0-Math.max(c.A*.2,c.A-(e+.3*c.A));')], False),
    ('N16 debt relief not recorded as a capital transaction', [('c.er.cap=(c.er.cap||0)+(bkE(c)-b0)', 'c.er.cap=0')], False),
    # tax, dividends, reserve, cash
    ('N17 dividends reduced by the waiting write-off', [('dv=Math.max(0,cp-tax+c.dr)*(c.dban?0:c.pay)', 'dv=Math.max(0,cp-tax+c.dr-(c.woq||0))*(c.dban?0:c.pay)')], False),
    ('N18 tax reduced by the waiting write-off', [(',ga=c.gw*.025,pre=cp-ga;let tax=0;', ',ga=c.gw*.025,pre=cp-ga-(c.woq||0);let tax=0;')], False),
    ('N19 reserve llr reduced by the waiting write-off', [('c.llr=(c.llr==null?loans*.01:c.llr)-loss;', 'c.llr=(c.llr==null?loans*.01:c.llr)-loss-(c.woq||0);')], False),
    ('N20 write-off also taken from cash', [(WB, 'function woBook(c){const w=c.woq||0;if(!(w>0))return;c.woq=0;c.cs-=w;c.ni-=w;')], False),
    # cash flow statement and tabs
    ('N21 cash flow: adds back only the larger of impairment and write-off', [(CFO, 'cfo=q.ni-q.eq+q.ga+dep+Math.max(q.imp||0,q.wo||0),')], False),
    ('N22 cash flow: adds back impairment only', [(CFO, 'cfo=q.ni-q.eq+q.ga+dep+(q.imp||0),')], False),
    ('N23 cash flow: adds back write-off only', [(CFO, 'cfo=q.ni-q.eq+q.ga+dep+(q.wo||0),')], False),
    ('N24 cash flow tab row shows the larger of impairment and write-off', [(ROWNC, 'q=>Math.max(q.imp||0,q.wo||0)]]')], False),
    ('N25 income statement: impairment row shows the write-off', [('["자산 손상차손",q=>-(q.imp||0)]', '["자산 손상차손",q=>-(q.wo||0)]')], False),
    ('N26 quarter record misses the impairment (fq)', [('c.er.imp||0,c.er.wo||0]);', '0,c.er.wo||0]);')], False),
]
def run(game, name):
    code = SEED + stub + '\n' + game + '\n' + rd(os.path.join(T, name))
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(code); p = f.name
    out = subprocess.run(['node', p], capture_output=True, text=True, timeout=900, env=dict(os.environ, TESTS_DIR=T)); os.unlink(p)
    txt = out.stdout + out.stderr; m = re.findall(r'errs (\d+) fails (\d+)', txt)
    passed = bool(m) and m[-1] == ('0', '0') and out.returncode == 0
    fl = [l for l in txt.splitlines() if l.startswith('FAIL') or l.startswith('ERR') or 'Error' in l]
    return passed, fl
bad = 0
for label, edits, survives in MUTANTS:
    game = game0
    for a, b in edits:
        n = game.count(a)
        if n != 1: print('SETUP ERROR', label, 'snippet found', n, 'times:', a[:70]); sys.exit(2)
        game = game.replace(a, b)
    ok_new, fl = run(game, NEW)
    old = [t for t in OLD if not run(game, t)[0]] if edits else []
    good = ok_new if (not edits or survives) else not ok_new
    if survives and not ok_new: good = False
    bad += not good
    nf = sum(l.startswith('FAIL') for l in fl); ne = len(fl) - nf
    kind = 'passes' if ok_new else 'CAUGHT by REG-01 (%d FAIL = calculation differs, %d ERR = precondition/other)' % (nf, ne)
    print(('ok   ' if good else 'BAD  ') + label + ' -> ' + (('SURVIVES (expected, documented) ' if survives else '') + kind if edits else kind) +
          ((' | older bank tests: ' + (', '.join(old) if old else 'none catch it')) if edits else ''))
    for l in sorted(fl, key=lambda l: not l.startswith('FAIL'))[:3]: print('       ' + l[:230])
print('ALL MUTANTS CAUGHT (documented survivors aside), unmodified game passes' if not bad else str(bad) + ' problem(s)'); sys.exit(1 if bad else 0)
