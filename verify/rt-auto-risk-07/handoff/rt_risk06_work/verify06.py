import json,hashlib,subprocess,tempfile,pathlib,math,os
R=pathlib.Path(__file__).resolve().parent
p=json.loads((R/'PROTOCOL_EXECUTION_LOCK.json').read_text())
assert hashlib.sha256((R/'rt_auto_risk06_runner.js').read_bytes()).hexdigest()==p['runnerSHA256']
files=list((R/'raw').glob('*.json'));assert len(files)==100,len(files)
checks=[]
for f in sorted(files):
 z=json.loads(f.read_text())
 assert z['sourceSHA']==p['baseline'] and z['days']==720 and z['risk05Mode']=='direct_ev2_disabled'
 assert z['risk']['preWipeoutObservedDays']<=720
 assert math.isclose(z['fixedStakeGrossDiv'],.6*z['cumDiv'],rel_tol=0,abs_tol=1e-6) or z['risk']['firstControlLostDay'] is not None, f
 assert z['stakeAdjustedPlayerBookReturnPct']>=-100.0000001,f
 assert z['cleanPlayerBookReturnPct']>=-100.0000001,f
 assert not any(e.get('type')=='ev2' for e in z['eventLog']), f
 checks.append({'file':f.name,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
replays=[]
for seed,track,slot,arm in [(p['seeds'][0],'normal',0,'A2'),(p['seeds'][-1],'combined',4,'A4R')]:
 fname=f'{seed}_{track}_slot{slot}_{arm}.json'; orig=json.loads((R/'raw'/fname).read_text())
 with tempfile.TemporaryDirectory() as tmp:
  dest=pathlib.Path(tmp)/fname
  res=subprocess.run(['node',str(R/'rt_auto_risk06_runner.js'),str(seed),track,arm,'720',str(dest),str(slot),'--direct-events-off'],capture_output=True,text=True,timeout=180)
  if res.returncode:raise RuntimeError(res.stderr[-1000:])
  rep=json.loads(dest.read_text())
  for obj in (orig,rep):obj.pop('elapsedMs',None)
  assert orig==rep, f'replay differs {fname}'
  replays.append({'world':fname,'matchIgnoringElapsedMs':True,'sha256':hashlib.sha256(json.dumps(orig,sort_keys=True).encode()).hexdigest()})
result={'task':'RT-AUTO-RISK-06','worlds':100,'rawChecks':len(checks),'replays':replays,'checks':{'runnerShaFrozen':True,'baselineHashes':True,'preWipeoutDurations':True,'dividendReconcilationConditional':True,'shareholderLimitedLiability':True,'directEV2Disabled':True},'rawFileSha256':checks}
(R/'VERIFICATION06.json').write_text(json.dumps(result,indent=2))
print('VERIFICATION PASS',len(checks),'worlds',len(replays),'replays')
