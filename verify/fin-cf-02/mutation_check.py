"""FIN-CF-02: does tests/t_fincf02_issue.js catch wrong implementations? Runs the test against deliberately broken copies of the game.
usage: python3 build/build.py && python3 verify/fin-cf-02/mutation_check.py        (JOBS=4 runs four mutants at a time)
Each edit is applied in memory to dist/game.js AND to a temporary copy of src/ (the test's GUARD reads the source files), so src/ and dist/ are
not touched. Each mutant must make the new test fail; the unmodified game must pass. For information the FIN-CF-01 test and the older cash-flow
test (t_bank_writeoff_cashflow.js) run on the same mutants.
Mutants marked SURVIVES are expected to pass: they change nothing that can differ in any reachable world (reason in the label, also in
docs/VERIFY.md); a SURVIVES mutant that is caught, or a normal mutant that is not caught, is a problem."""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V)); T = os.path.join(R, 'tests')
rd = lambda p: open(p, encoding='utf-8').read()
SEED = ("Math.random=(()=>{let a=20261016;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);"
        "t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();\n")
NEW, OLD = 't_fincf02_issue.js', ['t_fincf01_relief.js', 't_bank_writeoff_cashflow.js']
game0, stub = rd(os.path.join(R, 'dist', 'game.js')), rd(os.path.join(T, 'stub.js'))
SRC = {f: rd(os.path.join(R, 'src', f)) for f in os.listdir(os.path.join(R, 'src')) if f.endswith('.js')}
EQ = 'function eqCash(c,x){if(c&&x&&isFinite(x))c.eqq=(c.eqq||0)+x}'
CONF = 'if(c.eqq){const dq=Math.round(S.day);(c.isq=c.isq||{})[dq]=(c.isq[dq]||0)+c.eqq;c.eqq=0}'
PRUNE = 'if(c.isq){const d0=c.fq[0][0];for(const k in c.isq)if(+k<d0)delete c.isq[k];if(!Object.keys(c.isq).length)delete c.isq}'
KILL = 'c.ncq=0;delete c.rlf;c.eqq=0;delete c.isq}'
QB = 'delete c.isq;c.isd=S.day-720;'
PREP = 'if(c.eqq==null)c.eqq=0;if(c.isd==null)c.isd=S.day}'
RULE = 'led=!!(prev&&c&&c.isd!=null&&prev.d>c.isd),dsh=!!prev&&q.sh!==prev.sh,iss=!prev?0:led||!dsh?(c&&c.isq&&c.isq[q.d]||0):(q.sh-prev.sh)*q.p/1e4,est=!led&&dsh,'
ROWI = '["증자·출자(자사주)",(q,d)=>d.est?"≈"+fN(d.iss):d.iss||null]'
ROWF = '["재무활동 현금흐름",(q,d)=>d.unk?"미확인":d.est?"≈"+fN(d.cff):d.cff,"b"]'
ROWO = '["기타·투자 매매",(q,d)=>d.unk?"미확인":d.est?"≈"+fN(d.oth):d.oth]'
ROWB = '["차입 증감",(q,d)=>d.cff==null?null:d.unk?"미확인":d.cff+q.dv-d.iss]'
NOTE = 'function cfNote(c){return cfNoteR(c)+cfNoteE(c)}'
STRIP = 'k==="hr"||k==="hv"||k==="fq"||k==="IX"||k==="hm"||k==="w10"||k==="wd"?undefined:v'
# the 15 recorded cash paths (snippet as it stands -> the same without its eqCash call)
SITES = [('act2 G.mg rights issue', 'c.cs+=r;eqCash(c,r);c.sh*=1+f;'), ('act2 G.mg buyback', 'F(x));eqCash(c,-x);c.sh*=1-n/100;'),
         ('act2 G.gm greenmail', 'c.cs=0}eqCash(c,-pr);const net=payK'), ('act2 bailout event', 'c.cs+=x;eqCash(c,x);c.sh/=.7;'),
         ('act2 G.pp private placement', 'c.cs+=cost;eqCash(c,cost);c.p*=.98;'), ('act2 G.wk white knight', 'c.cs+=cost;eqCash(c,cost);c.p*=.97;'),
         ('act2 G.mvGo new shares (pp)', 'T.cs+=x;eqCash(T,x);T.p*=.98;'), ('act2 G.mvGo cash contribution (cap)', 'T.cs+=x;eqCash(T,x);T.bs[fk]'),
         ('ui2 G.eoX option exercise', 'c.cs+=cost;eqCash(c,cost);c.p=(c.p*sh0'), ('ui2 bankQ bank capital raise', 'c.cs+=iss*.9;eqCash(c,iss*.9);'),
         ('ui2 activist event buyback', 'c.cs-=x2;eqCash(c,-x2);c.sh*=.95;'), ('ui2 downgrade event issue', 'c.cs+=r;eqCash(c,r);c.sh*=1.1;rescale(c,1/1.1);fxj(c,-.03)'),
         ('ui2 buyback event', 'c.cs-=x2;eqCash(c,-x2);c.sh*=1-n/100;'), ('ui2 government stake event', 'c.cs+=cash;eqCash(c,cash);'),
         ('ui2 rival activist buyback (persTick)', 'c.cs-=x;eqCash(c,-x);c.sh*=1-n/100;')]
drop = lambda s: re.sub(r'eqCash\([^;]*\);', '', s, count=1)
# (label, edits, survives)
MUTANTS = [('none (the unmodified game)', [], False)]
MUTANTS += [('S%d %s records nothing' % (i + 1, lab), [(s, drop(s))], False) for i, (lab, s) in enumerate(SITES)]
MUTANTS += [
    # wrong amount at a path
    ('A1 rights issue recorded at the gross amount (no 5% discount)', [('c.cs+=r;eqCash(c,r);c.sh*=1+f;', 'c.cs+=r;eqCash(c,r/.95);c.sh*=1+f;')], False),
    ('A2 buyback recorded with the wrong sign', [('F(x));eqCash(c,-x);c.sh*=1-n/100;', 'F(x));eqCash(c,x);c.sh*=1-n/100;')], False),
    ('A3 greenmail recorded at 80% of the price paid', [('c.cs=0}eqCash(c,-pr);const net=payK', 'c.cs=0}eqCash(c,-pr*.8);const net=payK')], False),
    ('A4 bailout recorded as cash / .7', [('c.cs+=x;eqCash(c,x);c.sh/=.7;', 'c.cs+=x;eqCash(c,x/.7);c.sh/=.7;')], False),
    ('A5 option exercise recorded at the market price instead of the strike', [('c.cs+=cost;eqCash(c,cost);c.p=(c.p*sh0', 'c.cs+=cost;eqCash(c,N*c.p/1e4);c.p=(c.p*sh0')], False),
    ('A6 bank capital raise recorded gross (before the 10% cost)', [('c.cs+=iss*.9;eqCash(c,iss*.9);', 'c.cs+=iss*.9;eqCash(c,iss);')], False),
    # non-cash share changes must not be recorded
    ('N1 splitDo records the split as cash at the price', [('function splitDo(c,f,quiet){const d=1/f;c.sh*=f;', 'function splitDo(c,f,quiet){const d=1/f;eqCash(c,(f-1)*c.sh*c.p/1e4);c.sh*=f;')], False),
    ('N2 the stock merger records the new shares as cash', [('rescale(a,a.sh/ns);a.sh=ns;', 'rescale(a,a.sh/ns);eqCash(a,q.N*a.p/1e4);a.sh=ns;')], False),
    # the ledger
    ('E1 eqCash records nothing', [(EQ, 'function eqCash(c,x){}')], False),
    ('E2 eqCash records with the wrong sign', [(EQ, 'function eqCash(c,x){if(c&&x&&isFinite(x))c.eqq=(c.eqq||0)-x}')], False),
    ('E3 eqCash overwrites instead of adding', [(EQ, 'function eqCash(c,x){if(c&&x&&isFinite(x))c.eqq=x}')], False),
    ('E4 the close never zeroes eqq', [(CONF, 'if(c.eqq){const dq=Math.round(S.day);(c.isq=c.isq||{})[dq]=(c.isq[dq]||0)+c.eqq}')], False),
    ('E5 the close records the amount one day late', [(CONF, 'if(c.eqq){const dq=Math.round(S.day)+1;(c.isq=c.isq||{})[dq]=(c.isq[dq]||0)+c.eqq;c.eqq=0}')], False),
    ('E6 the close overwrites isq[day] instead of adding (a company closes at most once a day, so the slot is always empty)', [(CONF, 'if(c.eqq){const dq=Math.round(S.day);(c.isq=c.isq||{})[dq]=c.eqq;c.eqq=0}')], True),
    ('E7 the close never confirms (eqq stays pending)', [(CONF, '')], False),
    ('E8 old amounts are never pruned', [(PRUNE, '')], False),
    ('E9 pruning keeps only the newest row', [(PRUNE, PRUNE.replace('c.fq[0][0]', 'c.fq[c.fq.length-1][0]'))], False),
    ('E10 kill leaves eqq and isq on the dead company', [(KILL, 'c.ncq=0;delete c.rlf}')], False),
    ('E11 qBack keeps the old isq when it rebuilds the past quarters', [(QB, 'c.isd=S.day-720;')], False),
    ('E12 qBack does not move the ledger start (rebuilt rows look legacy)', [(QB, 'delete c.isq;')], False),
    ('E13 v8prep does not default isd (no ledger start at all)', [(PREP, 'if(c.eqq==null)c.eqq=0}')], False),
    ('E14 v8prep starts the issue ledger at the FIN-CF-01 day cfd', [(PREP, 'if(c.eqq==null)c.eqq=0;if(c.isd==null)c.isd=c.cfd}')], False),
    ('E15 v8prep does not default eqq', [(PREP, 'if(c.isd==null)c.isd=S.day}')], False),
    ('E16 the export format drops eqq (strip list)', [(STRIP, STRIP.replace('k==="wd"', 'k==="wd"||k==="eqq"'))], False),
    # the statement rule
    ('F1 a row whose previous row is ON the ledger start counts as recorded (>= instead of >: that close was before the save)', [(RULE, RULE.replace('prev.d>c.isd', 'prev.d>=c.isd'))], False),
    ('F2 legacy rows use the (empty) ledger instead of the estimate', [(RULE, RULE.replace('led||!dsh?', 'true?'))], False),
    ('F3 legacy estimates are never flagged', [(RULE, RULE.replace('est=!led&&dsh,', 'est=false,'))], False),
    ('F4 the old statement (share-count change x close price everywhere)', [(RULE, 'iss=prev&&q.sh!==prev.sh?(q.sh-prev.sh)*q.p/1e4:0,est=false,')], False),
    ('F5 a legacy row with no share-count change ignores the recorded amount', [(RULE, RULE.replace('led||!dsh?', 'led?').replace(':(q.sh-prev.sh)*q.p/1e4,', ':dsh?(q.sh-prev.sh)*q.p/1e4:0,'))], False),
    ('F6 every legacy row is flagged, share change or not', [(RULE, RULE.replace('est=!led&&dsh,', 'est=!led&&!!prev,'))], False),
    # the tab
    ('U1 no ≈ on the 증자·출자 cell', [(ROWI, '["증자·출자(자사주)",(q,d)=>d.iss||null]')], False),
    ('U2 no ≈ on 재무활동', [(ROWF, '["재무활동 현금흐름",(q,d)=>d.unk?"미확인":d.cff,"b"]')], False),
    ('U3 no ≈ on 기타·투자 매매', [(ROWO, '["기타·투자 매매",(q,d)=>d.unk?"미확인":d.oth]')], False),
    ('U4 ≈ also on 차입 증감 (which is exact)', [(ROWB, '["차입 증감",(q,d)=>d.cff==null?null:d.unk?"미확인":d.est?"≈"+fN(d.cff+q.dv-d.iss):d.cff+q.dv-d.iss]')], False),
    ('U5 the estimate footnote is removed', [(NOTE, 'function cfNote(c){return cfNoteR(c)}')], False),
    ('U6 the old line name 증자(자사주)', [(ROWI, ROWI.replace('증자·출자(자사주)', '증자(자사주)'))], False),
]
def run(game, name, srcdir):
    code = SEED + stub + '\n' + game + '\n' + rd(os.path.join(T, name))
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(code); p = f.name
    out = subprocess.run(['node', p], capture_output=True, text=True, timeout=1500, env=dict(os.environ, TESTS_DIR=os.path.join(srcdir, 'tests'))); os.unlink(p)
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
    d = tempfile.mkdtemp(prefix='fincf02_mut_'); os.makedirs(os.path.join(d, 'src')); shutil.copytree(T, os.path.join(d, 'tests'))
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
          ((' | other cash-flow tests: ' + (', '.join(old) if old else 'do not catch it')) if edits else ''), flush=True)
    for l in sorted(fl, key=lambda l: not l.startswith('FAIL'))[:2]: print('       ' + l[:230], flush=True)
print('%d mutants; ' % (len(MUTANTS) - 1) + ('ALL MUTANTS CAUGHT (documented survivors aside), unmodified game passes' if not bad else str(bad) + ' problem(s)')); sys.exit(1 if bad else 0)
