'use strict';
// This synthetic unit test checks formula equivalence, NOT in-game behavior or API integration.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=__dirname;
const source=fs.readFileSync(path.join(root,'rt_risk06_work/rt_auto_risk06_runner.js'),'utf8');
const found=source.match(/const candidatePolicy=String\.raw`([\s\S]*?)`;/);
if(!found)throw Error('Cannot find frozen candidatePolicy in RISK-06 runner');
const original=fs.readFileSync(path.join(root,'rt_risk_work/repo/src/sim.js'),'utf8');
const begin=original.indexOf('function autop(c){');
const end=original.indexOf('const MIS=',begin);
if(begin<0||end<0)throw Error('Cannot find original autop(c)');
const baseline=original.slice(begin,end);
const proposed=fs.readFileSync(path.join(root,'A4R_NONFIN_INTEGRATION_REFERENCE.js'),'utf8');
const make=()=>{
 const s={Math,HOLD:999,S:{dg:new Array(100).fill(.06),cg:new Array(100).fill(.06)},rating:(c)=>c._r,eq:(c)=>c.A+c.cs-c.D};
 vm.createContext(s);vm.runInContext(baseline+'\n'+found[1]+'\n'+proposed,s);
 return s;
};
const x=make();let n=0,finance=0,normal=0;
// Deterministic exhaustive boundary grid, no random seed or ungrounded environment values.
for(const kd of [0,1,2])for(const industry of [0,12,999])for(const r of [0,1,2,3,4,5,6])
for(const ni of [-100,-1,0,1,20,55,150])for(const cashPct of [0,.01,.029,.03,.059,.06,.061,.1,.5])for(const gap of [-.04,-.02,-.019,-.01,0,.02]){
  const c={kd,i:industry,_r:r,A:1000,ni,cs:1000*cashPct,D:200,nol:0,g:0,pay:0,sweep:0,ps:0};
  x.S.dg[industry]=gap+.06;
  const ref={...c},got={...c};
  x.autop(ref);
  if(!kd&&industry!==999)x.__riskPolicy(ref,'A4R');
  x.autopMerged(got);
  for(const key of ['g','pay','sweep','ps'])assert.equal(got[key],ref[key],`Mismatch ${key}: ${JSON.stringify(c)}`);
  if(kd||industry===999)finance++;if(!kd&&industry!==999&&r<=2&&ni>0)normal++;
  n++;
}
console.log(`PASS: ${n} boundary-grid cases matched RISK-06 policy + original A2 baseline; ${finance} financial/HOLD preserved; ${normal} normal nonfinancial cases`);
