from pathlib import Path
import concurrent.futures as cf,subprocess,json,time,hashlib,sys
R=Path(__file__).resolve().parent
P=json.loads((R/'PROTOCOL_LOCK.json').read_text())
RUNNER=R/'rt_auto_risk06_runner.js'
P['runnerSHA256']=hashlib.sha256(RUNNER.read_bytes()).hexdigest()
(R/'PROTOCOL_EXECUTION_LOCK.json').write_text(json.dumps(P,indent=2))
JOBS=[(seed,track,slot,arm) for seed in P['seeds'] for track in P['tracks'] for slot in P['firmSlots'] for arm in P['arms']]
assert len(JOBS)==100

def run(job):
 seed,track,slot,arm=job
 dst=R/'raw'/f'{seed}_{track}_slot{slot}_{arm}.json'
 if dst.exists():
  try:
   z=json.loads(dst.read_text())
   if (z['seed'],z['track'],z['firmSlot'],z['arm'],z['days'])==(seed,track,slot,arm,720): return ('EXISTING',job,'')
  except Exception: pass
 tmp=dst.with_suffix('.part')
 args=['node',str(RUNNER),str(seed),track,arm,'720',str(tmp),str(slot),'--direct-events-off']
 try:
  r=subprocess.run(args,capture_output=True,text=True,timeout=220)
  if r.returncode: raise RuntimeError(f'Exit {r.returncode}: {r.stderr[-1000:]}')
  z=json.loads(tmp.read_text())
  assert (z['seed'],z['track'],z['firmSlot'],z['arm'],z['days'])==(seed,track,slot,arm,720)
  assert z['sourceSHA']==P['baseline']
  assert z['risk05Mode']=='direct_ev2_disabled'
  assert len(z['decisions'])>0
  tmp.replace(dst)
  return ('PASS',job,'')
 except Exception as e:
  tmp.unlink(missing_ok=True)
  return ('FAIL',job,repr(e))
print('PREREG', P['seeds'], 'RUNNER SHA',P['runnerSHA256'], flush=True)
start=time.monotonic();results=[]
with cf.ThreadPoolExecutor(max_workers=8) as pool:
 futures=[pool.submit(run,j) for j in JOBS]
 for f in cf.as_completed(futures):
  v=f.result();results.append(v)
  if v[0]=='FAIL': print('FAIL',v,flush=True)
  if len(results)%10==0 or len(results)==len(JOBS):
   print('PROGRESS',len(results),'/',len(JOBS),'PASS',sum(z[0]!='FAIL' for z in results),'FAIL',sum(z[0]=='FAIL' for z in results),'ELAPSED',round(time.monotonic()-start,1),flush=True)
(R/'RUN_LOG.json').write_text(json.dumps({'results':results,'pass':sum(z[0]!='FAIL' for z in results),'fail':sum(z[0]=='FAIL' for z in results),'elapsedSecs':round(time.monotonic()-start,2)},indent=2))
if any(z[0]=='FAIL' for z in results):sys.exit(2)
