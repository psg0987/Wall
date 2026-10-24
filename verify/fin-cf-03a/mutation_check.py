"""FIN-CF-03A: does tests/t_fincf03_acq.js catch wrong implementations? Runs the test against deliberately broken copies of the game.
usage: python3 build/build.py && python3 verify/fin-cf-03a/mutation_check.py        (JOBS=2 runs two mutants at a time; OLD=0 skips the information runs)
Each edit is applied in memory to dist/game.js AND to a temporary copy of src/ (the test's GUARD reads the source files), so src/ and dist/ are
not touched. Each mutant must make the new test fail; the unmodified game must pass. For information the FIN-CF-01 and FIN-CF-02 tests run on the
same mutants (they were not written for FIN-CF-03A and are not expected to catch them).
Mutants marked SURVIVES are expected to pass: they change nothing that can differ in any reachable world (reason in the label, also in
docs/VERIFY.md); a SURVIVES mutant that is caught, or a normal mutant that is not caught, is a problem."""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V)); T = os.path.join(R, 'tests')
rd = lambda p: open(p, encoding='utf-8').read()
SEED = ("Math.random=(()=>{let a=20261016;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);"
        "t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();\n")
NEW, OLD = 't_fincf03_acq.js', (['t_fincf01_relief.js', 't_fincf02_issue.js'] if os.environ.get('OLD', '1') != '0' else [])
game0, stub = rd(os.path.join(R, 'dist', 'game.js')), rd(os.path.join(T, 'stub.js'))
SRC = {f: rd(os.path.join(R, 'src', f)) for f in os.listdir(os.path.join(R, 'src')) if f.endswith('.js')}
REC = '{const ki=(t.own["c"+a.id]||0)>50;acqAdd(a,ki?"iD":"aD",t.D);acqAdd(a,ki?"iP":"aP",cashPaid||0);acqAdd(a,ki?"iC":"aC",t.cs)}'
ADD = 'function acqAdd(c,k,x){if(!c||!x||!isFinite(x))return;const p=c.acq||(c.acq={aD:0,aP:0,aC:0,iD:0,iP:0,iC:0,lD:0,hD:0});p[k]+=x}'
CONF = 'if(c.acq){const dq=Math.round(S.day),r=c.acr=c.acr||{},o=r[dq]||(r[dq]={aD:0,aP:0,aC:0,iD:0,iP:0,iC:0,lD:0,hD:0});for(const k of ACQK)o[k]+=c.acq[k]||0;c.acq=null}'
PRUNE = 'if(c.acr){const d0=c.fq[0][0];for(const k in c.acr)if(+k<d0)delete c.acr[k];if(!Object.keys(c.acr).length)delete c.acr}'
KILL = 'c.eqq=0;delete c.isq;c.acq=null;delete c.acr}'
QB = 'delete c.acr;c.acq=null;if(S.day>0)c.acd=S.day;'
ADDCO = 'if(c.acd==null)c.acd=S.day-721;'
PREP = 'if(c.isd==null)c.isd=S.day;if(c.acd==null)c.acd=S.day}'
ST = 'st=!prev||!c?null:c.acd==null||prev.d>c.acd?"full":q.d<=c.acd?"old":"part",A3=(st==="part"||st==="full")&&c.acr&&c.acr[q.d]||null,'
NCA = 'ncA=A3?A3.aD+A3.iD+A3.lD+A3.hD:0,maN=A3?A3.aC-A3.aP:0,inN=A3?A3.iC-A3.iP:0,'
CFF = 'cff=prev?dD+nc-ncA-q.dv+iss:null,'
OTH = 'oth=prev?dc-cfo+capex-cff-maN-inN:null,'
CFM = 'cfM=(d,e,v)=>e||d.st==="part"?(e?"≈":"")+(d.st==="part"?"◐":"")+fN(v):v;'
ROWB = '["차입 증감",(q,d)=>d.cff==null?null:d.unk?"미확인":cfM(d,0,d.cff+q.dv-d.iss)]'
# (label, edits, survives)
MUTANTS = [('none (the unmodified game)', [], False),
    # recording at the deal paths
    ('R1 absorb records nothing', [(REC, '')], False),
    ('R2 every absorption is internal (stake > 50% test replaced by >= 0)', [(REC, REC.replace('>50', '>=0'))], False),
    ('R3 every absorption is external (G.liq / own subsidiary not recognised)', [(REC, REC.replace('>50', '>100'))], False),
    ('R4 the debt of an internal absorption is also put in the external key (counted twice)', [(REC, REC.replace('acqAdd(a,ki?"iD":"aD",t.D);', 'acqAdd(a,ki?"iD":"aD",t.D);if(ki)acqAdd(a,"aD",t.D);'))], False),
    ('R5 absorb ignores the cash paid', [(REC, REC.replace('cashPaid||0', '0'))], False),
    ('R6 absorb ignores the cash brought in', [(REC, REC.replace('acqAdd(a,ki?"iC":"aC",t.cs)', ''))], False),
    ('R7 absorb records the debt after it moved (0)', [(REC, REC.replace('acqAdd(a,ki?"iD":"aD",t.D);', ''))], False),
    ('R8 maTick passes no cash paid', [('absorb(ac,t,pay,pay)', 'absorb(ac,t,pay,0)')], False),
    ('R9 maTick passes the full price, also for the stake already held', [('absorb(ac,t,pay,pay)', 'absorb(ac,t,pay,pr)')], False),
    ('R10 offer passes the full price, also for the 10% already held', [('absorb(a,c,P,cp)', 'absorb(a,c,P,P)')], False),
    ('R11 offer passes no cash paid', [('absorb(a,c,P,cp)', 'absorb(a,c,P,0)')], False),
    ('R12 G.merge passes the share value as cash paid', [('absorb(a,x,q.nv,0)', 'absorb(a,x,q.nv,q.nv)')], False),
    ('R13 G.liq passes the subsidiary value as cash paid', [('absorb(h,c,-hv(c,100),0)', 'absorb(h,c,-hv(c,100),hv(c,100))')], False),
    ('R14 the LBO debt is not recorded', [('acqAdd(c,"lD",lb)', '0')], False),
    ('R15 the LBO debt is recorded as debt taken over', [('acqAdd(c,"lD",lb)', 'acqAdd(c,"aD",lb)')], False),
    ('R16 the hidden debt is not recorded', [('acqAdd(c,"hD",hx)', '0')], False),
    ('R17 acqAdd records nothing', [(ADD, 'function acqAdd(c,k,x){}')], False),
    ('R18 acqAdd overwrites instead of adding', [(ADD, ADD.replace('p[k]+=x', 'p[k]=x'))], False),
    # the ledger
    ('L1 the close never confirms (acq stays pending)', [(CONF, '')], False),
    ('L2 the close does not clear acq (next quarter counts it again)', [(CONF, CONF.replace(';c.acq=null}', '}'))], False),
    ('L3 the close keeps only the newest quarter (one record, like R1 of the design)', [(CONF, CONF.replace('r=c.acr=c.acr||{}', 'r=c.acr={}'))], False),
    ('L4 the close records one day late', [(CONF, CONF.replace('dq=Math.round(S.day)', 'dq=Math.round(S.day)+1'))], False),
    ('L5 the close overwrites acr[day] instead of adding (a company closes at most once a day, so the slot is always empty)', [(CONF, CONF.replace('o[k]+=c.acq[k]||0', 'o[k]=c.acq[k]||0'))], True),
    ('L6 old records are never pruned', [(PRUNE, '')], False),
    ('L7 pruning keeps only the newest row', [(PRUNE, PRUNE.replace('c.fq[0][0]', 'c.fq[c.fq.length-1][0]'))], False),
    ('L8 kill leaves acq and acr on the dead company', [(KILL, 'c.eqq=0;delete c.isq}')], False),
    ('L9 qBack keeps the pending deal of a restored export', [(QB, 'delete c.acr;if(S.day>0)c.acd=S.day;')], False),
    ('L10 qBack keeps the old records', [(QB, 'c.acq=null;if(S.day>0)c.acd=S.day;')], False),
    ('L11 qBack does not move the ledger start on a restore', [(QB, 'delete c.acr;c.acq=null;')], False),
    ('L12 qBack moves the ledger start also in a new game (day 0)', [(QB, 'delete c.acr;c.acq=null;c.acd=S.day;')], False),
    ('L13 addCo starts the ledger on the day of creation (S.day, not before the rebuilt rows)', [(ADDCO, 'if(c.acd==null)c.acd=S.day;')], False),
    ('L14 addCo gives no start (v8prep then uses S.day)', [(ADDCO, '')], False),
    ('L15 v8prep gives an old save no start (acd missing)', [(PREP, 'if(c.isd==null)c.isd=S.day}')], False),
    # the statement
    ('F1 a partly recorded quarter ignores its record (R1 rule led3)', [(ST, ST.replace('q.d<=c.acd?"old":"part"', '"old"'))], False),
    ('F2 a partly recorded quarter is shown as fully recorded (no ◐)', [(ST, ST.replace('q.d<=c.acd?"old":"part"', 'q.d<=c.acd?"old":"full"'))], False),
    ('F3 a row whose previous row is ON the ledger start counts as fully recorded (>= instead of >)', [(ST, ST.replace('prev.d>c.acd', 'prev.d>=c.acd'))], False),
    ('F4 a row closed before the ledger uses a record (no record can exist for such a row)', [(ST, ST.replace('(st==="part"||st==="full")&&', ''))], True),
    ('F5 차입 / 재무활동 keep the non-cash debt (the old statement)', [(CFF, 'cff=prev?dD+nc-q.dv+iss:null,')], False),
    ('F6 the external acquisition cash stays in 기타', [(OTH, 'oth=prev?dc-cfo+capex-cff-inN:null,')], False),
    ('F7 the internal absorption cash stays in 기타', [(OTH, 'oth=prev?dc-cfo+capex-cff-maN:null,')], False),
    ('F8 the debt of an internal absorption is not taken out', [(NCA, NCA.replace('A3.aD+A3.iD+', 'A3.aD+'))], False),
    ('F9 the LBO debt is not taken out', [(NCA, NCA.replace('+A3.lD', ''))], False),
    ('F10 the hidden debt is not taken out', [(NCA, NCA.replace('+A3.hD', ''))], False),
    ('F11 internal and external net cash swapped', [(NCA, 'ncA=A3?A3.aD+A3.iD+A3.lD+A3.hD:0,maN=A3?A3.iC-A3.iP:0,inN=A3?A3.aC-A3.aP:0,')], False),
    ('F12 net cash = cash paid - cash in (sign)', [(NCA, NCA.replace('maN=A3?A3.aC-A3.aP:0', 'maN=A3?A3.aP-A3.aC:0'))], False),
    ('F13 banks\' growth gr taken out too (FIN-CF-03B leaking in)', [(NCA, NCA.replace('ncA=A3?A3.aD+A3.iD+A3.lD+A3.hD:0', 'ncA=(A3?A3.aD+A3.iD+A3.lD+A3.hD:0)+(fin?q.gr:0)'))], False),
    # the tab
    ('U1 no ◐ on the cells of a partly recorded quarter', [(CFM, 'cfM=(d,e,v)=>e?"≈"+fN(v):v;')], False),
    ('U2 negative 차입 증감 shown as 0', [(ROWB, ROWB.replace('cfM(d,0,d.cff+q.dv-d.iss)', 'cfM(d,0,Math.max(0,d.cff+q.dv-d.iss))'))], False),
    ('U3 the 인수 순현금 row never shown', [('...(cfAx(c,"ax")?', '...(false?')], False),
    ('U4 the 자회사 흡수·투자회수 row never shown', [('...(cfAx(c,"ix")?', '...(false?')], False),
    ('U5 the non-cash debt memo row never shown', [('...(cfAx(c,"ncA")?', '...(false?')], False),
    ('U6 the FIN-CF-03A footnotes are removed', [('return cfNoteR(c)+cfNoteE(c)+cfNoteA(c)}', 'return cfNoteR(c)+cfNoteE(c)}')], False),
    # coverage
    ('G1 a new non-cash debt write without a record (accounting fraud bomb also books debt)', [('if(b.k==="분식회계"){c.A*=.9;', 'if(b.k==="분식회계"){c.A*=.9;c.D+=c.A*.01;')], False),
]
def run(game, name, srcdir):
    code = SEED + stub + '\n' + game + '\n' + rd(os.path.join(T, name))
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(code); p = f.name
    out = subprocess.run(['node', p], capture_output=True, text=True, timeout=2400, env=dict(os.environ, TESTS_DIR=os.path.join(srcdir, 'tests'))); os.unlink(p)
    txt = out.stdout + out.stderr; m = re.findall(r'errs (\d+) fails (\d+)', txt)
    passed = bool(m) and m[-1] == ('0', '0') and out.returncode == 0
    fl = [l for l in txt.splitlines() if l.startswith('FAIL') or l.startswith('ERR') or 'Error' in l]
    return passed, fl
def one(mu):
    label, edits, survives = mu; game = game0; src = dict(SRC)
    for a, b in edits:
        n = game.count(a)
        if n != 1: return (mu, None, 'SETUP ERROR snippet found %d times in dist: %s' % (n, a[:70]), [])
        game = game.replace(a, b)
        hit = [f for f in src if a in src[f]]
        if len(hit) != 1 or src[hit[0]].count(a) != 1: return (mu, None, 'SETUP ERROR snippet not once in src: %s' % a[:70], [])
        src[hit[0]] = src[hit[0]].replace(a, b)
    d = tempfile.mkdtemp(prefix='fincf03a_mut_'); os.makedirs(os.path.join(d, 'src')); shutil.copytree(T, os.path.join(d, 'tests'))
    for f, t in src.items(): open(os.path.join(d, 'src', f), 'w', encoding='utf-8').write(t)
    try:
        ok_new, fl = run(game, NEW, d)
        old = [t for t in OLD if not run(game, t, d)[0]] if edits else []
    finally: shutil.rmtree(d, ignore_errors=True)
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
          ((' | FIN-CF-01/02 tests: ' + (', '.join(old) + ' also fail' if old else 'pass (not their subject)')) if edits and OLD else ''), flush=True)
    for l in sorted(fl, key=lambda l: not l.startswith('FAIL'))[:2]: print('       ' + l[:230], flush=True)
print('%d mutants; ' % (len(MUTANTS) - 1) + ('ALL MUTANTS CAUGHT (documented survivors aside), unmodified game passes' if not bad else str(bad) + ' problem(s)')); sys.exit(1 if bad else 0)
