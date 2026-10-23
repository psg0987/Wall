"""FIN-CF-01 mutants re-run on the FIN-CF-02 code (2026-10-23): the same 33 mutants as verify/fin-cf-01/mutation_check.py, with the four code
snippets that FIN-CF-02 extended (the close in earn, kill, v8prep, the 재무활동 and 기타 rows) re-anchored on the new text; the replacements still remove exactly
the FIN-CF-01 behaviour. Purpose: show that changing tests/t_fincf01_relief.js for FIN-CF-02 did not weaken it.
usage: python3 build/build.py && python3 verify/fin-cf-02/fincf01_mutation_recheck.py

Original description: does tests/t_fincf01_relief.js catch wrong implementations? Runs the test against deliberately broken copies of the built game
(dist/game.js changed in memory only; src/ and dist/ are not touched).
usage: python3 build/build.py && python3 verify/fin-cf-01/mutation_check.py
Each mutant must make the new test fail; the unmodified game must pass. For information the older cash-flow test (t_bank_writeoff_cashflow.js) runs on the same mutants.
Mutants marked SURVIVES are expected to pass: they change nothing that can differ in any reachable world (reason in the label, also in docs/VERIFY.md);
a SURVIVES mutant that is caught, or a normal mutant that is not caught, is a problem."""
import os, re, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V)); T = os.path.join(R, 'tests')
rd = lambda p: open(p, encoding='utf-8').read()
SEED = ("Math.random=(()=>{let a=20261016;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);"
        "t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();\n")
NEW, OLD = 't_fincf01_relief.js', ['t_bank_writeoff_cashflow.js']
game0, stub = rd(os.path.join(R, 'dist', 'game.js')), rd(os.path.join(T, 'stub.js'))
REC = 'c.ncq=(c.ncq||0)+(D0-c.D);'
CONF = 'if(c.ncq){c.rlf={d:Math.round(S.day),R:c.ncq};c.ncq=0}if(c.eqq){'
NC = 'nc=prev&&c&&c.rlf&&c.rlf.d===q.d&&isFinite(c.rlf.R)?c.rlf.R:0,'
CFF = 'cff=prev?dD+nc-q.dv+iss:null'
UNKC = 'c.bk>0&&c.cfd!=null&&prev.d<c.cfd&&q.A>0&&Math.abs(q.A+q.cs+q.gw+q.pv-q.D-.15*q.A)<=3,'
QB = 'c.fq=[];delete c.rlf;c.cfd=S.day-720;'
KILL = 'c.wd=null;c.ncq=0;delete c.rlf;'
PREP = 'if(c.ncq==null)c.ncq=0;if(c.cfd==null)c.cfd=S.day;'
ROWB = '["차입 증감",(q,d)=>d.cff==null?null:d.unk?"미확인":d.cff+q.dv-d.iss]'
ROWF = '["재무활동 현금흐름",(q,d)=>d.unk?"미확인":d.est?"≈"+fN(d.cff):d.cff,"b"]'
ROWO = '["기타·투자 매매",(q,d)=>d.unk?"미확인":d.est?"≈"+fN(d.oth):d.oth]'
MEMO = '...(cfRl(c)?[['
CFRL = 'const cfRl=c=>!!(c.rlf&&c.rlf.R&&fqL(c).slice(1).some(q=>q.d===c.rlf.d));'
STRIP = 'k==="hr"||k==="hv"||k==="fq"||k==="IX"||k==="hm"||k==="w10"||k==="wd"?undefined:v'
NOTE2 = 'if(c.bk>0&&c.cfd!=null&&L.some((q,j)=>j&&!(c.rlf&&c.rlf.d===q.d)&&L[j-1].d<c.cfd))return'
NOTE1 = 'if(u.length)return `<div'
# (label, edits, survives)
MUTANTS = [
    ('none (the unmodified game)', [], False),
    # recording R
    ('M1 ch11x records nothing', [(REC, '')], False),
    ('M2 R has the wrong sign (debt after - debt before)', [(REC, 'c.ncq=(c.ncq||0)+(c.D-D0);')], False),
    ('M3 R is rounded to a whole number', [(REC, 'c.ncq=(c.ncq||0)+Math.round(D0-c.D);')], False),
    ('M4 R is recorded as the forced-sale-adjusted cap instead (R - 0.25 x asset sale)', [(REC, 'c.ncq=(c.ncq||0)+(D0-c.D)-.25*(A00-c.A);'), ('const D0=c.D;c.D=Math.max(0,', 'const D0=c.D,A00=c.A+.15*c.A/.85;c.D=Math.max(0,')], False),
    ('M5 ch11x overwrites ncq instead of adding (a second relief cannot exist: bk >= 2 is a delisting)', [(REC, 'c.ncq=(D0-c.D);')], True),
    # confirming it at the close
    ('M6 the close never zeroes ncq (the amount is re-confirmed on every later close)', [(CONF, 'if(c.ncq){c.rlf={d:Math.round(S.day),R:c.ncq}}if(c.eqq){')], False),
    ('M7 the close records rlf.d one day late', [(CONF, 'if(c.ncq){c.rlf={d:Math.round(S.day)+1,R:c.ncq};c.ncq=0}if(c.eqq){')], False),
    ('M8 the close zeroes ncq before reading it (R = 0)', [(CONF, 'if(c.ncq){c.ncq=0;c.rlf={d:Math.round(S.day),R:c.ncq}}if(c.eqq){')], False),
    ('M9 the close never confirms (ncq stays, rlf never set)', [(CONF, 'if(c.eqq){')], False),
    # applying it in the statement
    ('M10 R is applied to every visible row (no date match)', [(NC, 'nc=prev&&c&&c.rlf&&isFinite(c.rlf.R)?c.rlf.R:0,')], False),
    ('M11 R is applied to the newest row only', [(NC, 'nc=prev&&c&&c.rlf&&c.fq&&c.fq[c.fq.length-1][0]===q.d&&isFinite(c.rlf.R)?c.rlf.R:0,')], False),
    ('M12 R is applied with the wrong sign', [(CFF, 'cff=prev?dD-nc-q.dv+iss:null')], False),
    ('M13 R is not applied (the old statement)', [(CFF, 'cff=prev?dD-q.dv+iss:null')], False),
    ('M14 R is also taken out of the dividend/issue part (cff = dD + R - dv + iss + R)', [(CFF, 'cff=prev?dD+nc-q.dv+iss+nc:null')], False),
    ('M15 the 차입 증감 row still shows the raw debt change (R only in 재무활동)', [(ROWB, '["차입 증감",(q,d)=>d.cff==null?null:d.unk?"미확인":d.cff+q.dv-d.iss-d.nc]')], False),
    ('M16 the memo row is never shown', [(MEMO, '...(false?[[')], False),
    ('M17 the memo row is always shown', [(MEMO, '...(true?[[')], False),
    ('M18 the memo row is shown for a relief row that has no previous quarter', [(CFRL, 'const cfRl=c=>!!(c.rlf&&c.rlf.R&&fqL(c).some(q=>q.d===c.rlf.d));')], False),
    # paths: death, save, defaults
    ('M19 kill leaves ncq and rlf on the dead company', [(KILL, 'c.wd=null;')], False),
    ('M20 qBack keeps the old rlf when it rebuilds the past quarters', [(QB, 'c.fq=[];c.cfd=S.day-720;')], False),
    ('M21 qBack does not mark the rebuilt rows as post-ledger (cfd not set)', [(QB, 'c.fq=[];delete c.rlf;')], False),
    ('M22 the export format drops ncq (strip list)', [(STRIP, 'k==="hr"||k==="hv"||k==="fq"||k==="IX"||k==="hm"||k==="w10"||k==="wd"||k==="ncq"?undefined:v')], False),
    ('M23 v8prep does not default ncq', [(PREP, 'if(c.cfd==null)c.cfd=S.day;')], False),
    ('M24 v8prep does not default cfd (no old-save marking at all)', [(PREP, 'if(c.ncq==null)c.ncq=0;')], False),
    # the old-save marking
    ('M25 unconfirmed without the chapter-11 history condition (bk > 0 removed)', [(UNKC, 'c.cfd!=null&&prev.d<c.cfd&&q.A>0&&Math.abs(q.A+q.cs+q.gw+q.pv-q.D-.15*q.A)<=3,')], False),
    ('M26 unconfirmed without the 15% signature', [(UNKC, 'c.bk>0&&c.cfd!=null&&prev.d<c.cfd&&q.A>0,')], False),
    ('M27 unconfirmed also after the ledger started (cfd condition removed)', [(UNKC, 'c.bk>0&&q.A>0&&Math.abs(q.A+q.cs+q.gw+q.pv-q.D-.15*q.A)<=3,')], False),
    ('M28 the signature band is +/-30 instead of +/-3', [(UNKC, 'c.bk>0&&c.cfd!=null&&prev.d<c.cfd&&q.A>0&&Math.abs(q.A+q.cs+q.gw+q.pv-q.D-.15*q.A)<=30,')], False),
    ('M29 a quarter with its own recorded relief can still be unconfirmed', [('unk=prev&&!(c&&c.rlf&&c.rlf.d===q.d)&&c&&', 'unk=prev&&c&&')], False),
    ('M30 only 차입 증감 is marked 미확인 (재무활동 shows the number)', [(ROWF, '["재무활동 현금흐름",(q,d)=>d.est?"≈"+fN(d.cff):d.cff,"b"]')], False),
    ('M31 기타·투자 매매 is not marked 미확인', [(ROWO, '["기타·투자 매매",(q,d)=>d.est?"≈"+fN(d.oth):d.oth]')], False),
    ('M32 the old-save company warning (second footnote) is removed', [(NOTE2, 'if(false)return')], False),
    ('M33 the unconfirmed footnote is removed', [(NOTE1, 'if(false)return `<div')], False),
]
def run(game, name):
    code = SEED + stub + '\n' + game + '\n' + rd(os.path.join(T, name))
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(code); p = f.name
    out = subprocess.run(['node', p], capture_output=True, text=True, timeout=900, env=dict(os.environ, TESTS_DIR=T)); os.unlink(p)
    txt = out.stdout + out.stderr; m = re.findall(r'errs (\d+) fails (\d+)', txt)
    passed = bool(m) and m[-1] == ('0', '0') and out.returncode == 0
    fl = [l for l in txt.splitlines() if l.startswith('FAIL') or l.startswith('ERR') or 'Error' in l]
    return passed, fl
def one(mu):
    label, edits, survives = mu; game = game0
    for a, b in edits:
        n = game.count(a)
        if n != 1: return (mu, None, 'SETUP ERROR snippet found %d times: %s' % (n, a[:70]), [])
        game = game.replace(a, b)
    ok_new, fl = run(game, NEW)
    old = [t for t in OLD if not run(game, t)[0]] if edits else []
    return (mu, ok_new, old, fl)
bad = 0
with ThreadPoolExecutor(max_workers=int(os.environ.get('JOBS', '2'))) as ex: results = list(ex.map(one, MUTANTS))
for (label, edits, survives), ok_new, old, fl in results:
    if ok_new is None: print('SETUP ERROR', label, old); sys.exit(2)
    good = ok_new if (not edits or survives) else not ok_new
    bad += not good
    nf = sum(l.startswith('FAIL') for l in fl); ne = len(fl) - nf
    kind = 'passes' if ok_new else 'CAUGHT by the new test (%d FAIL = calculation differs, %d ERR = precondition/other)' % (nf, ne)
    print(('ok   ' if good else 'BAD  ') + label + ' -> ' + (('SURVIVES (expected, documented) ' if survives else '') + kind if edits else kind) +
          ((' | older cash-flow test: ' + (', '.join(old) if old else 'does not catch it')) if edits else ''), flush=True)
    for l in sorted(fl, key=lambda l: not l.startswith('FAIL'))[:2]: print('       ' + l[:230], flush=True)
print('ALL MUTANTS CAUGHT (documented survivors aside), unmodified game passes' if not bad else str(bad) + ' problem(s)'); sys.exit(1 if bad else 0)
