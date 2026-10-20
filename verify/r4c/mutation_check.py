"""RT-BANK-R4C: does tests/t_r4c_bank_tg.js catch wrong implementations? Runs the test against deliberately broken copies of the built game
(dist/game.js changed in memory only; src/ and dist/ are not touched).
usage: python3 build/build.py && python3 verify/r4c/mutation_check.py
Each mutant must make the R4C test fail; the unmodified game must pass. For information the older bank tests (and REG-01) are run on the same mutants,
to show which mutants only the new test catches. Mutants marked SURVIVES are expected to pass: they change nothing that can differ in the test worlds
(documented in docs/VERIFY.md); a SURVIVES mutant that is caught, or a normal mutant that is not caught, is a problem."""
import os, re, subprocess, sys, tempfile
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V)); T = os.path.join(R, 'tests')
rd = lambda p: open(p, encoding='utf-8').read()
SEED = ("Math.random=(()=>{let a=20261016;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);"
        "t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();\n")
NEW = 't_r4c_bank_tg.js'
OLD = ['t_bank_writeoff.js', 't_bank_writeoff_cases.js', 't_reg01_bank_imp_wo.js']
game0, stub = rd(os.path.join(R, 'dist', 'game.js')), rd(os.path.join(T, 'stub.js'))
TG = 'function tgCalc(c){const eps=epsV(c),'
TGRET = 'return t*cvm(c)}'
REV = 'c.tg=c.p;if(wb&&!wb.dead)wb.tg=tgCalc(wb)}'
LOSS = 'let s=core-w*1e4/c.sh;for(let j=m-(n-1);j<m;j++)s+=h[j];return s*4/n}'
NWIN = 'n=Math.min(4,m+1)'
EST = 'let core=c.est!=null&&isFinite(c.est)?c.est:null;'
WB = 'c.woq=0;c.ni-=w;'
EARN_WB = 'woBook(c);c.eqi=0;'
EARN_TG = 'c.tg=tgCalc(c);if(c.surp){'
CUT = 'b.woq=(b.woq||0)+ls;if(ls>0)wb=b;'
GUARD = 'if(ls>0)wb=b;'
# (label, edits, survives)
MUTANTS = [
    ('none (the unmodified game)', [], False),
    # the valuation EPS
    ('M1 tgCalc values on epsT again (the waiting loss is not in the valuation EPS)', [(TG, 'function tgCalc(c){const eps=epsT(c),')], False),
    ('M2 the waiting loss is subtracted twice', [(LOSS, 'let s=core-2*w*1e4/c.sh;for(let j=m-(n-1);j<m;j++)s+=h[j];return s*4/n}')], False),
    ('M3 the waiting loss is not subtracted (only the book equity cut reaches tg)', [(LOSS, 'let s=core;for(let j=m-(n-1);j<m;j++)s+=h[j];return s*4/n}')], False),
    ('M4 the waiting quarter keeps all four old quarters and divides by one more (window off by one)', [(LOSS, 'let s=core-w*1e4/c.sh;for(let j=m-n;j<m;j++)if(j>=0)s+=h[j];return s*4/n}')], False),
    ('M5 the window does not count the waiting quarter (n = min(4, m))', [(NWIN, 'n=Math.min(4,m)')], False),
    ('M6 the expected core EPS ignores the analysts\' estimate (average of the history instead)', [(EST, 'let core=null;')], False),
    # when the temporary term goes away
    ('M7 woBook does not clear the queue (the loss stays in the valuation after the close)', [(WB, 'c.ni-=w;')], False),
    ('M8 the queue is cleared after the close\'s tgCalc (woBook moved behind the target price)', [(EARN_WB, 'c.eqi=0;'), (EARN_TG, 'c.tg=tgCalc(c);woBook(c);if(c.surp){')], False),
    # when and for whom the target price is set
    ('M9 no re-valuation on the default day (the old behaviour)', [(REV, 'c.tg=c.p}')], False),
    ('M10 every live bank is re-valued on a default, not only the lender', [(REV, 'c.tg=c.p;if(wb&&!wb.dead)for(const z of S.co)if(z.kd===1&&!z.dead)z.tg=tgCalc(z)}')], False),
    ('M11 the borrower is re-valued instead of its reset price being kept', [(REV, 'c.tg=tgCalc(c);if(wb&&!wb.dead)wb.tg=tgCalc(wb)}')], False),
    ('M12 the re-valuation also runs when nothing was written off (guard ls>0 removed)', [(CUT, 'b.woq=(b.woq||0)+ls;wb=b;')], False),
    ('M13 the re-valuation happens before the loan-to-own stake is registered (stake not in equity)', [(REV, 'c.tg=c.p}'), (CUT, 'b.woq=(b.woq||0)+ls;if(ls>0){wb=b;b.tg=tgCalc(b)}')], False),
    # things R4C must not do
    ('M14 an immediate price shock of -6% on the bank', [(REV, 'c.tg=c.p;if(wb&&!wb.dead){wb.tg=tgCalc(wb);wb.p*=.94}}')], False),
    ('M15 a jump term of -0.05 on the bank', [(REV, 'c.tg=c.p;if(wb&&!wb.dead){wb.tg=tgCalc(wb);wb.jx=(wb.jx||0)-.05}}')], False),
    ('M16 a post-default drift (pd/pdn) on the bank', [(REV, 'c.tg=c.p;if(wb&&!wb.dead){wb.tg=tgCalc(wb);wb.pd=-.003;wb.pdn=10}}')], False),
    ('M17 the loss is booked early in the yearly net income', [(REV, 'c.tg=c.p;if(wb&&!wb.dead){wb.tg=tgCalc(wb);wb.yni=(wb.yni||0)-wb.woq}}')], False),
    ('M18 the estimate is lowered by the loss (est manipulation)', [(REV, 'c.tg=c.p;if(wb&&!wb.dead){wb.tg=tgCalc(wb);wb.est-=wb.woq*1e4/wb.sh}}')], False),
    ('M19 a price floor for negative-equity banks inside tgCalc', [(TGRET, 'return c.kd===1&&eq(c)<0?Math.max(t*cvm(c),.15*c.A*1e4/c.sh*.5):t*cvm(c)}')], False),
    # several write-offs
    ('M20 a second write-off overwrites the queue instead of adding', [(CUT, 'b.woq=ls;if(ls>0)wb=b;')], False),
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
    kind = 'passes' if ok_new else 'CAUGHT by R4C test (%d FAIL = calculation differs, %d ERR = precondition/other)' % (nf, ne)
    print(('ok   ' if good else 'BAD  ') + label + ' -> ' + (('SURVIVES (expected, documented) ' if survives else '') + kind if edits else kind) +
          ((' | older bank tests/REG-01: ' + (', '.join(old) if old else 'none catch it')) if edits else ''), flush=True)
    for l in sorted(fl, key=lambda l: not l.startswith('FAIL'))[:3]: print('       ' + l[:230], flush=True)
print('ALL MUTANTS CAUGHT (documented survivors aside), unmodified game passes' if not bad else str(bad) + ' problem(s)'); sys.exit(1 if bad else 0)
