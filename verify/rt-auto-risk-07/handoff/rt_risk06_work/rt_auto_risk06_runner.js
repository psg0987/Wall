/** RT-AUTO-RISK-06: FROZEN OUT-OF-SAMPLE VALIDATION RUNNER. No inference or production policy changes. Original Wall read-only. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),assert=require('node:assert/strict');
const h=require('../RT_AUTO_ENGINE_V22_REVIEW/rt_auto_engine_harness_v2_2.js');
const repo=path.join(__dirname,'../rt_risk_work/repo');
const SHA={
 'src/base_v5.js':'d278af42a465b031b38b5486d6b8200658b1f39f',
 'src/data.js':'bc2b9185f408119d82c5c8557e251d10a85ddea1',
 'src/core.js':'6cbadf23935a0128db7b717e50dcb259911d0a0f',
 'src/sim.js':'1d710c4100d94e23d1d1f66de312d39eea70b334',
 'src/act1.js':'6e31ec63edf368ec53223061086d840deae979cb',
 'src/act2.js':'90924dc0f6dbac92e683fef8f2459214048ff90a',
 'src/ui1.js':'062a5d61cba56129b6a258febe2e0c938facabfb',
 'src/ui2.js':'0aba1d0153190e0ce53d0c84b76459e81b2e99a4',
 'tests/stub.js':'5e80cde69b8407da0cce7b44e263a17a36d3d9ff',
 'build/build.py':'43a644841bebaec55b9a7243637e0c86f63b811c'};
for(const [p,sha] of Object.entries(SHA)){
 const got=cp.execFileSync('git',['hash-object',path.join(repo,p)],{encoding:'utf8'}).trim();assert.equal(got,sha,`Source blob mismatch ${p}`);
}
const bundle={head:'8b6ed6e6695e0d042836a54f301076c533b55d53', verification:'ten Git blob hashes matched', stub:fs.readFileSync(path.join(repo,'tests/stub.js'),'utf8'),game:fs.readFileSync(path.join(repo,'src/base_v5.js'),'utf8')+'\n'+['data.js','core.js','sim.js','act1.js','act2.js','ui1.js','ui2.js'].map(f=>fs.readFileSync(path.join(repo,'src',f),'utf8')).join('\n')};
const candidatePolicy=String.raw`
function __riskPolicy(x,arm){
 const r=rating(x),roa=x.ni*4/Math.max(1,x.A),gap=x.kd?0:S.dg[x.i]-S.cg[x.i];
 const tc=x.A*(x.kd===2?.25:x.kd===1?.08:.06),e=eq(x),roe=e>0?x.ni*4/e:-1;
 if(arm==='A4R'||arm==='A4G'){
  if(x.kd){const stress=r>=3||x.ni<=0||(x.kd===2&&S.mood<-.15);
   x.g=stress?0:.04;x.pay=(stress||x.nol>x.A*.02||x.cs<tc*.5)?0:.3;x.sweep=r>=3?2:1;
  }else{
   const halt=r>=4||(r===3&&(x.ni<=0||x.cs<tc*.5||gap<-.02))||(x.ni<0&&x.cs<tc);
   x.g=halt?0:roa>.1&&r<=2&&gap>-.01?.1:.04;
   x.pay=(r>=4||x.ni<=0||x.nol>x.A*.05||(r===3&&x.cs<tc))?0:r===3?.15:.3;
   x.sweep=r>=3||x.ni<=0?2:1;
   x.ps=r<=3&&roa>.06&&(r<=2||x.cs>=tc*.5)?1:0;
   // RISK-05 sensitivity arm: profitable r=3 firms retain 4% instead of A4R's 0% growth.
   // Other levers remain identical to A4R, so this ONLY isolates the profitable growth brake.
   if(arm==='A4G'&&r===3&&x.ni>0&&x.g===0)x.g=.04;
  }
 }else if(arm==='A5'){
  if(x.kd){const stress=r>=3||x.ni<=0||(x.kd===2&&S.mood<-.15);
   x.g=stress?0:r<=1&&roe>.12&&x.cs>=tc?.08:.04;
   x.pay=(stress||x.nol>0||x.cs<tc)?0:r===2?.2:.3;
   x.sweep=r>=2?2:1;
  }else{
   const halt=r>=4||(r===3&&(x.ni<=0||x.cs<tc||gap<-.02))||(x.ni<=0&&x.cs<tc);
   const hyper=roa>.1&&r<=2&&gap>-.01&&(x.cs>=tc*.5||roa>.14);
   x.g=halt?0:hyper?.1:.04;
   x.pay=(r>=4||x.ni<=0||x.nol>x.A*.03||x.cs<tc)?0:r===3?.15:.3;
   x.sweep=r>=2||x.g<.1?2:1;
   x.ps=r<=3&&roa>.06&&x.cs>=tc*.5?1:0;
  }
 }else throw Error('Unknown candidate arm '+arm);
 if(x.i===HOLD){x.g=0;x.ps=0;x.pay=0}
}
`;
const seed=Number(process.argv[2]||104729),track=process.argv[3]||'normal',arm=process.argv[4]||'A2',days=Number(process.argv[5]||180),out=process.argv[6],firmSlot=Number(process.argv[7]||0);
const catalogOnly=process.argv.includes('--catalog');
const directOff=process.argv.includes('--direct-events-off');
assert.ok(Number.isInteger(seed)&&seed>0);assert.ok(Number.isInteger(firmSlot)&&firmSlot>=0);
assert.ok(['normal','distress','margin','recovery','combined','combined_recovery','bank','insurance'].includes(track));assert.ok(['A2','A4R','A4G'].includes(arm));
const init=h.makeContext(bundle,seed);
const candidates=vm.runInContext(`S.co.filter(c=>!c.dead&&!c.priv&&!mine(c)&&!c.own.P&&!c.ctl&&held(c)<39&&c.A>300).map(c=>({id:c.id,idx:c.id,tk:c.tk,industry:c.i,kd:c.kd,A:c.A,startEq:eq(c),cs:c.cs,D:c.D,g:c.g,pay:c.pay,sweep:c.sweep,ps:c.ps,p:c.p,sh:c.sh,initRating:rating(c)}))`,init);
let choices;
if(track==='bank')choices=candidates.filter(c=>c.kd===1);
else if(track==='insurance')choices=candidates.filter(c=>c.kd===2);
else if(['distress','margin','recovery','combined','combined_recovery'].includes(track))choices=candidates.filter(c=>{
  if(c.kd!==0||c.initRating<2||c.initRating>3)return false;
  // Pre-register eligibility on the Day-0 hypothetical balance sheet, BEFORE any outcome simulation.
  // Keep natural high debt instead of forgiving it to reach target leverage.
  const nonDebt=c.startEq+c.D-c.cs+c.A*.02;
  const proposedDebt=nonDebt*1.15/2.15;
  const effectiveDebt=Math.max(c.D,proposedDebt);
  const e=nonDebt-effectiveDebt;
  return e>0 && effectiveDebt/e>=1 && effectiveDebt/e<1.6;
});
else choices=candidates.filter(c=>c.kd===0&&c.initRating<=2);
choices.sort((a,b)=>(a.industry-b.industry)||(a.idx-b.idx));
const targetCount=5;
if(choices.length<targetCount)throw Error('Not enough eligible companies; do not silently reduce K');
if(firmSlot>=targetCount)throw Error('firmSlot must be 0..4');
// Rotate stratified company slots by a seed-derived index. No outcome-dependent choice.
const offset=(Math.imul(seed^(seed>>>16),0x9e3779b1)>>>0)%choices.length;
const selected=Array.from({length:targetCount},(_,j)=>choices[(Math.floor((j+.5)*choices.length/targetCount)+offset)%choices.length]);
if(new Set(selected.map(x=>x.idx)).size!==targetCount)throw Error('Duplicate selection');
if(catalogOnly){console.log(JSON.stringify({seed,track,candidateCount:choices.length,selected:selected.map(({idx,tk,industry,kd,initRating})=>({idx,tk,industry,kd,initRating})),industries:[...new Set(choices.map(x=>x.industry))].sort((a,b)=>a-b)}));process.exit(0)}
const firm=selected[firmSlot];const ctx=h.makeContext(bundle,seed);h.instrument(ctx,firm,'A2',false);
ctx.__riskInputs={arm,track,firmSlot};
ctx.__riskDirectEventsOff=directOff;
vm.runInContext(`(function(){
 const c=__rtTargetFirm,inputs=__riskInputs;
 if(__riskDirectEventsOff){
   // Disable scheduled and autonomous EV2 interactions only. Keep macro shocks,
   // random company operations, rivals, and original seeded stochastic engine.
   S.cfg.evf=0;S.nev=99999999;S.evq=[];
 }
 if(['distress','combined','combined_recovery'].includes(inputs.track)){
    c.cs=c.A*.02;
    const other=eq(c)+c.D,de=1.15,target=other*de/(1+de);
    c.D=Math.max(c.D,target); // Never forgive naturally higher debt.
    S.prime+=2;
    // Firm-specific margin shock for combined crisis; no sector-demand spike or forced recovery.
    if(inputs.track==='combined'||inputs.track==='combined_recovery'){
       c.edge=(c.edge||0)-.035;c.hqb=(c.hqb||0)-.035;
       globalThis.__riskRecovery={edgeDelta:.035,hqbDelta:.035};
    }
    secUpd();
    if(rating(c)!==3)throw Error('Target stress rating 3 not achieved, actual '+rating(c));
 }else if(inputs.track==='margin'||inputs.track==='recovery'){
    // Moderate hypothetical firm-specific shock, with optional partial recovery after day 360.
    // Do not change book A/D at day zero. Separate nonrecovering and recovering cohorts.
    globalThis.__riskRecovery={edgeDelta:.035,hqbDelta:.035};
    c.edge=(c.edge||0)-.035;c.hqb=(c.hqb||0)-.035;
    S.prime=9.5;secUpd();
 }else if(inputs.track==='bank'||inputs.track==='insurance'){
    S.prime=9.5;S.mood=-.25;
    // Do not inject a fictitious debt burden: preserve real balance sheet; macro-only stress.
 }
 globalThis.__riskStarting={day:S.day,rating:rating(c),equity:eq(c),A:c.A,cs:c.cs,D:c.D,prime:S.prime,mood:S.mood,edge:c.edge,hqb:c.hqb,sectorGap:c.kd?null:S.dg[c.i]-S.cg[c.i]};
 const prev=autop;
 ${candidatePolicy}
 autop=function(x){prev(x);if(x!==c)return;if(inputs.arm!=='A2')__riskPolicy(x,inputs.arm);
   const d=__rtLog.decisions[__rtLog.decisions.length-1];d.g=x.g;d.pay=x.pay;d.sweep=x.sweep;d.ps=x.ps;d.candidate=inputs.arm;
 };
 // Re-evaluate known Day-0 balance-sheet stress (credit rating / cash) at control activation.
 // c.ni is pre-shock and is not described as a post-shock earnings observation.
 // Record whether policy decisions are made on the stale baseline NI in telemetry.
 globalThis.__riskDay0NiIsPreShock=inputs.track!=='normal';
 autop(c);
 secUpd(); // Day-0 policy changes affect sector supply immediately.
 const prevCP=__rtCheckpoint;
 globalThis.__riskSums={daysRating4:0,daysRating5:0,daysRating6:0,peakRating:rating(c),minEquity:eq(c),minCash:c.cs,bankRegDays:0,bankDividendProhibitionDays:0,firstRating4Day:null,firstInsolventDay:null,firstControlLostDay:null,firstChapter11Day:null,firstDelistDay:null,highestBk:0};
 __riskSums.playerCashDiv=0;__riskSums.playerGrossDiv=0;__riskSums.fixedStakeGrossDiv=0;
 __riskSums.preWipeoutDaysRating4=0;__riskSums.preWipeoutInsolventDays=0;__riskSums.preWipeoutObservedDays=0;
 const origPayDiv=payDiv;
 payDiv=function(x,dv){if(x===c){
   const actualPct=(x.own.P||0)/100;
   __riskSums.playerCashDiv+=dv*actualPct*.6;
   __riskSums.playerGrossDiv+=dv*actualPct;
   if(mine(x))__riskSums.fixedStakeGrossDiv+=dv*.6;
 }return origPayDiv(x,dv)};
 globalThis.__riskD0=__rtLog.decisions.length?{...__rtLog.decisions[0]}:null;
 globalThis.__rtCheckpoint=function(){
   const x=__rtTargetFirm,q=__riskSums,r=rating(x),e=eq(x);
   if(S.day>0&&x.bk===0&&!x.dead&&mine(x)){
      q.preWipeoutObservedDays++;
      if(r>=4)q.preWipeoutDaysRating4++;
      if(e<=0)q.preWipeoutInsolventDays++;
   }
   prevCP();
   if(r>=4){q.daysRating4++;if(q.firstRating4Day===null)q.firstRating4Day=S.day;}if(r>=5)q.daysRating5++;if(r===6)q.daysRating6++;
   if(e<=0&&q.firstInsolventDay===null)q.firstInsolventDay=S.day;
   if(!mine(x)&&q.firstControlLostDay===null)q.firstControlLostDay=S.day;
   if(x.bk>0&&q.firstChapter11Day===null)q.firstChapter11Day=S.day;
   if(x.dead&&q.firstDelistDay===null)q.firstDelistDay=S.day;
   q.highestBk=Math.max(q.highestBk,x.bk||0);
   q.peakRating=Math.max(q.peakRating,r);q.minEquity=Math.min(q.minEquity,e);q.minCash=Math.min(q.minCash,x.cs);
   if(x.breg)q.bankRegDays++;if(x.dban)q.bankDividendProhibitionDays++;
 };
})()`,ctx,{timeout:15000});
firm.startEq=vm.runInContext('__riskStarting.equity',ctx);
if(process.argv.includes('--validate-stress')){
 const z=vm.runInContext('({start:__riskStarting,target:__rtTargetFirm.tk,day:S.day,initialPolicy:({g:__rtTargetFirm.g,pay:__rtTargetFirm.pay,sweep:__rtTargetFirm.sweep,ps:__rtTargetFirm.ps}),baselineNIPreShock:__riskDay0NiIsPreShock})',ctx);
 console.log(JSON.stringify({seed,track,arm,firmSlot,...z}));
 process.exit(0);
}
const script=new vm.Script(`(function(){
 for(let d=1;d<=${days};d++){
   if(d===361&&['recovery','combined_recovery'].includes(__riskInputs.track)){
      const x=__rtTargetFirm,b=__riskRecovery;
      // Remove exactly the original firm-level additive shock, preserving endogenous changes.
      x.edge+=b.edgeDelta;x.hqb+=b.hqbDelta;
      __rtLog.events.push({day:S.day+1,type:'firm_margin_shock_removed',ticker:x.tk});
   }
   step();
   for(let j=0;j<20;j++){
     if(!mdl&&!S.ev2&&!S.ev)break;
     if(S.ev2){const a=S.ev2,e=EV2.find(z=>z.id===a.id),c=S.co[a.c];
       if(!e||!c||c.dead){S.ev2=null;mdl=null;continue}
       if(a.m==='own')G.ev2Pick('mg');else{const ch=e.ai(c,a.x);if(Array.isArray(ch)&&Number.isFinite(ch[1]))a.v=ch[1];G.ev2Pick(Array.isArray(ch)?ch[0]:ch)}
       __rtLog.events.push({day:S.day,type:'ev2',id:a.id,mode:a.m});
     }else if(mdl){const m=mdl;if(m.o&&m.o.length)G.mk(m.o.length-1);else mdl=null;
       __rtLog.events.push({day:S.day,type:'modal'});
     }else if(S.ev){G.evPick('n');__rtLog.events.push({day:S.day,type:'ev_fallback'});}
     if(j===19)throw Error('Modal loop exceeded on '+S.day);
   }
   __rtLog.days++;__rtCheckpoint();
 }
})()`);
const begin=Date.now();script.runInContext(ctx,{timeout:240000});
const result=h.worldResult(ctx,firm,seed,arm);
const finish=vm.runInContext(`({stress:__riskStarting,risk:__riskSums,decisions:__rtLog.decisions.map(z=>({...z})),rawDebt:__rtTargetFirm.D,cash:__rtTargetFirm.cs,kd:__rtTargetFirm.kd,bankData:__rtTargetFirm.bkr||null,dead:!!__rtTargetFirm.dead,remainingPlayerStake:__rtTargetFirm.own.P||0,finalControl:mine(__rtTargetFirm),day0NiIsPreShock:__riskDay0NiIsPreShock})`,ctx);
const stake0=60, stake=finish.remainingPlayerStake;
const initialPlayerBook=firm.startEq*stake0/100;
// Control-loss/wipeout is a conservative project-specific terminal proxy, NOT real investor wealth:
// minority shares and cash proceeds from takeovers/liquidations are not fully accounted for.
const wipeout=finish.dead||finish.risk.firstChapter11Day!==null||finish.risk.firstControlLostDay!==null;
const nonNegFinalEq=Math.max(0,result.finalEq);
const actualTerminalBook=wipeout?0:nonNegFinalEq*stake/100;
const stakeAdjustedPlayerBookReturnPct=100*((actualTerminalBook+finish.risk.playerCashDiv)-initialPlayerBook)/initialPlayerBook;
// Diagnostic only: fix initial stake and use pretax dividends, but allow policy-induced event outcomes.
const terminalStakeBook=wipeout?0:nonNegFinalEq*.6;
const cleanPlayerBookReturnPct=100*((terminalStakeBook+finish.risk.fixedStakeGrossDiv)-initialPlayerBook)/initialPlayerBook;
const changes=result.decisions.reduce((acc,d,i,arr)=>acc+(i>0&&(['g','pay','sweep','ps'].some(k=>d[k]!==arr[i-1][k]))?1:0),0);
const full={...result,seed,track,arm,days,firmSlot,risk05Mode:directOff?'direct_ev2_disabled':'baseline_ev2',risk05GrowthVariant:arm==='A4G',elapsedMs:Date.now()-begin,tk:firm.tk,verifiedSources:SHA,sourceSHA:bundle.head,
 stakeAdjustedPlayerBookReturnPct,cleanPlayerBookReturnPct,wipeout,playerCashDiv:finish.risk.playerCashDiv,playerGrossDiv:finish.risk.playerGrossDiv,fixedStakeGrossDiv:finish.risk.fixedStakeGrossDiv,policyChangeCount:changes,
 eventLog:vm.runInContext('__rtLog.events.map(z=>({...z}))',ctx),...finish};
if(result.days!==days||!Number.isFinite(result.finalEq)||result.quarterCount<1)throw Error('Incomplete result');
if(out)fs.writeFileSync(out,JSON.stringify(full,null,2));
console.log(JSON.stringify({seed,track,arm,days,firmSlot,tk:firm.tk,startRating:finish.stress.rating,endRating:result.finalRating,bookPct:result.bookReturnPct,playerBookPct:stakeAdjustedPlayerBookReturnPct,cleanPlayerBookPct:cleanPlayerBookReturnPct,playerStake:stake,ch11:finish.risk.firstChapter11Day,equity:result.finalEq,dividends:result.cumDiv,shortfalls:result.cashShortCount,worstRating:result.worstRating,daysRating4:finish.risk.daysRating4,bankRegDays:finish.risk.bankRegDays,decisionCount:result.decisions.length,ms:full.elapsedMs}));
