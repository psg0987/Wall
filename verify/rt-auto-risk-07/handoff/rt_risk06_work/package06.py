from pathlib import Path
import zipfile,hashlib,json
BASE=Path('/mnt/data'); R=BASE/'rt_risk06_work'; root=BASE/'rt_risk_work'/'repo'
out=BASE/'RT_AUTO_RISK_06_RESULTS_AND_AUDIT.zip'
needed=['PROTOCOL_LOCK.json','PROTOCOL_EXECUTION_LOCK.json','CATALOG_LOCK.json','RUN_LOG.json','PAIRED06.csv','SUMMARY06.json','VERIFICATION06.json','REPORT_RISK06.md','README_REPRODUCE.md','rt_auto_risk06_runner.js','run_batch06.py','analyze06.py','verify06.py','write_report06.py','package06.py','batch.log']
source=['src/base_v5.js','src/data.js','src/core.js','src/sim.js','src/act1.js','src/act2.js','src/ui1.js','src/ui2.js','tests/stub.js','build/build.py']
harness=BASE/'RT_AUTO_ENGINE_V22_REVIEW'/'rt_auto_engine_harness_v2_2.js'
assert len(list((R/'raw').glob('*.json')))==100
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=7) as z:
 for n in needed:z.write(R/n,arcname='rt_risk06_work/'+n)
 for p in sorted((R/'raw').glob('*.json')):z.write(p,arcname='rt_risk06_work/raw/'+p.name)
 for n in source:z.write(root/n,arcname='rt_risk_work/repo/'+n)
 z.write(harness,arcname='RT_AUTO_ENGINE_V22_REVIEW/rt_auto_engine_harness_v2_2.js')
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 print(json.dumps({'file':str(out),'size':out.stat().st_size,'entries':len(z.namelist()),'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}))
