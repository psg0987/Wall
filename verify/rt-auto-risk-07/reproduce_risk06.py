"""RT-AUTO-RISK-07: does the integrated autop of this branch reproduce RT-AUTO-RISK-06's A4R worlds in the real engine?
The frozen research runner (rt_auto_risk06_runner.js, sha256 4093762398e0...) runs one 720-day world for one target company: arm 'A2' leaves autop
as the game has it, arm 'A4R' calls the research __riskPolicy after it. On this branch autop itself applies A4R to ordinary companies, so the runner's
arm 'A2' on the branch game must give exactly the raw A4R result of the same (seed, track, slot) recorded in RISK-06.
Setup (in a temporary folder, the handoff package is not changed): the handoff's three sibling folders are copied; rt_risk_work/repo/src/sim.js is
replaced by this branch's src/sim.js; in the copied runner ONLY the expected git blob hash of src/sim.js is replaced by this branch's (the runner checks
the ten source hashes before it runs). Nothing else of the runner, the harness or the other sources changes.
Compared: the whole raw JSON, except the fields that name the arm or the run (arm, elapsedMs, risk05GrowthVariant, verifiedSources, and 'candidate' in
each decision record). As a control, the A2 raw worlds of the same slots are run on the unmodified handoff with arm 'A2' (must also match).
usage: python3 verify/rt-auto-risk-07/reproduce_risk06.py [handoff.zip | handoff-dir] [JOBS] [--worlds N | --check-only]
  default: the committed verify/rt-auto-risk-07/RT_AUTO_RISK_07_CLAUDE_HANDOFF.zip (the package GPT-6 recovered, kept byte for byte). Before anything
  runs, the ZIP's sha256 and every file in HANDOFF_MANIFEST.sha256 are checked; --check-only stops there; --worlds N runs only the first N worlds
  (the two designated replay worlds of verify06.py first). The 2026-10-26 log was made from the same files extracted to a folder (50 worlds)."""
import hashlib, json, os, pathlib, re, shutil, subprocess, sys, tempfile, zipfile
from concurrent.futures import ThreadPoolExecutor
V = pathlib.Path(__file__).resolve().parent; REPO = V.parents[1]
ZIP_SHA = '0c10f964f3c8d875a191146a0ca9c4ddc6aa6a74e5611571d799ec610285d057'
opt = sys.argv[1:]; args = [a for i, a in enumerate(opt) if not a.startswith('--') and not (i and opt[i - 1] == '--worlds')]
SRC = pathlib.Path(args[0]).resolve() if args else V / 'RT_AUTO_RISK_07_CLAUDE_HANDOFF.zip'; JOBS = int(args[1]) if len(args) > 1 else 2
NW = int(opt[opt.index('--worlds') + 1]) if '--worlds' in opt else None
_tmpH = tempfile.TemporaryDirectory()
if SRC.suffix == '.zip':
    zsha = hashlib.sha256(SRC.read_bytes()).hexdigest(); assert zsha == ZIP_SHA, 'handoff ZIP sha256 ' + zsha + ' is not ' + ZIP_SHA
    with zipfile.ZipFile(SRC) as z: z.extractall(_tmpH.name)
    H = pathlib.Path(_tmpH.name)
else: H = SRC
man = [l.split('  ', 1) for l in (V / 'HANDOFF_MANIFEST.sha256').read_text().splitlines() if l.strip()]
badf = [f for h, f in man if not (H / f).is_file() or hashlib.sha256((H / f).read_bytes()).hexdigest() != h]
extra = sorted(str(p.relative_to(H)) for p in H.rglob('*') if p.is_file()) != sorted(f for _, f in man)
print('handoff ' + str(SRC.name) + (' sha256 ' + ZIP_SHA[:16] + '... OK' if SRC.suffix == '.zip' else '') + ' | manifest ' + str(len(man)) + ' files: ' + ('ALL MATCH' if not badf and not extra else 'MISMATCH ' + str(badf[:5]) + (' + extra/missing files' if extra else '')), flush=True)
if badf or extra: sys.exit(2)
if '--check-only' in opt: sys.exit(0)
SKIP = {'arm', 'elapsedMs', 'risk05GrowthVariant', 'verifiedSources'}
def clean(z):
    z = {k: v for k, v in z.items() if k not in SKIP}
    if isinstance(z.get('decisions'), list): z['decisions'] = [{k: v for k, v in d.items() if k != 'candidate'} for d in z['decisions']]
    return z
def tree(root, sim=None):
    for d in ('rt_risk06_work', 'rt_risk_work', 'RT_AUTO_ENGINE_V22_REVIEW'): shutil.copytree(H / d, root / d, ignore=shutil.ignore_patterns('raw'))
    if sim:
        shutil.copyfile(sim, root / 'rt_risk_work/repo/src/sim.js')
        blob = subprocess.run(['git', 'hash-object', str(root / 'rt_risk_work/repo/src/sim.js')], capture_output=True, text=True, check=True).stdout.strip()
        r = root / 'rt_risk06_work/rt_auto_risk06_runner.js'; s = r.read_text(encoding='utf-8')
        old = "'src/sim.js':'1d710c4100d94e23d1d1f66de312d39eea70b334'"; assert s.count(old) == 1; r.write_text(s.replace(old, "'src/sim.js':'%s'" % blob), encoding='utf-8')
        return blob
def run(root, seed, track, slot, arm, out):
    p = subprocess.run(['node', str(root / 'rt_risk06_work/rt_auto_risk06_runner.js'), str(seed), track, arm, '720', str(out), str(slot), '--direct-events-off'], capture_output=True, text=True, timeout=900)
    if p.returncode: return 'ERROR ' + p.stderr[-400:]
    return json.loads(out.read_text())
raw = sorted((H / 'rt_risk06_work/raw').glob('*.json')); assert len(raw) == 100, len(raw)
worlds = sorted({re.match(r'(\d+)_(\w+?)_slot(\d+)_(A2|A4R)\.json', f.name).groups()[:3] for f in raw})
if NW:   # the two worlds verify06.py replays come first
    p6 = json.loads((H / 'rt_risk06_work/PROTOCOL_EXECUTION_LOCK.json').read_text()); first = [(str(p6['seeds'][0]), 'normal', '0'), (str(p6['seeds'][-1]), 'combined', '4')]
    worlds = ([w for w in first if w in worlds] + [w for w in worlds if w not in first])[:NW]
with tempfile.TemporaryDirectory() as tmp:
    tb, tm = pathlib.Path(tmp) / 'branch', pathlib.Path(tmp) / 'main'; tb.mkdir(); tm.mkdir()
    blob = tree(tb, REPO / 'src/sim.js'); tree(tm)
    print('branch src/sim.js git blob ' + blob + ' | worlds ' + str(len(worlds)) + ' x (branch A2 vs raw A4R, handoff A2 vs raw A2)', flush=True)
    def one(w):
        seed, track, slot = w; res = []
        for root, arm_raw in ((tb, 'A4R'), (tm, 'A2')):
            orig = json.loads((H / 'rt_risk06_work/raw' / f'{seed}_{track}_slot{slot}_{arm_raw}.json').read_text())
            got = run(root, seed, track, slot, 'A2', pathlib.Path(tmp) / f'{root.name}_{seed}_{track}_{slot}.json')
            if isinstance(got, str): res.append((arm_raw, got)); continue
            a, b = clean(orig), clean(got); diff = sorted(k for k in set(a) | set(b) if a.get(k) != b.get(k))
            res.append((arm_raw, 'MATCH' if not diff else 'DIFF ' + ','.join(diff[:8])))
        return w, res
    with ThreadPoolExecutor(JOBS) as ex: results = list(ex.map(one, worlds))
bad = 0
for (seed, track, slot), res in results:
    print(f'{seed} {track} slot{slot}: ' + ' | '.join(f'{"branch A2 = raw A4R" if a == "A4R" else "handoff A2 = raw A2"}: {r}' for a, r in res)); bad += sum(r != 'MATCH' for _, r in res)
print('ALL %d WORLDS MATCH (branch = raw A4R, handoff = raw A2)' % len(results) if not bad else '%d comparison(s) differ' % bad); sys.exit(1 if bad else 0)
