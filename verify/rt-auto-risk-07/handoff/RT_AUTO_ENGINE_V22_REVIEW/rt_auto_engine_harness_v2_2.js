/**
 * RT-AUTO-ENGINE-HARNESS-V2.2 (GPT-6 independently patched Gemini v2.1; REAL ENGINE NOT RUN)
 * Engine integration: NOT RUN against full psg0987/Wall source in this environment.
 * Run OUTSIDE the repository; reads source/test stubs only; never writes the repository.
 * Usage:
 * node rt_auto_engine_harness_v2.js /path/to/Wall --smoke
 * node rt_auto_engine_harness_v2.js /path/to/Wall --seeds=20261016,777,12345 --firms=11 --days=720
 * Results are written next to this harness unless --out=/path/to/results.json is specified.
 */
"use strict";
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), cp = require("node:child_process"), assert = require("node:assert/strict");
const EXPECTED_SHA = "8b6ed6e6695e0d042836a54f301076c533b55d53";
const PARTS = ["data.js", "core.js", "sim.js", "act1.js", "act2.js", "ui1.js", "ui2.js"];
const POLICIES = ["A0", "A1", "A2", "A3"];
const R0 = "ORIGINAL", R3 = "BALANCED";
function mulberry(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = Math.imul(t ^ (t >>> 7), 61 | t) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function parseArgs(argv) {
  const o={repo: path.resolve(argv[0]||"."), seeds:[20261016,777,12345], firms:11, days:720, out:path.join(__dirname,"rt_auto_engine_results_v2.json"), smoke:false,day0Autop:true};
  for (const x of argv.slice(1)) {
    if(x==="--smoke") {o.smoke=true; o.seeds=[777];o.firms=1;o.days=180;}
    else if(x==="--no-day0-autop") o.day0Autop=false;
    else if(x.startsWith("--seeds=")) o.seeds=x.slice(8).split(",").map(Number);
    else if(x.startsWith("--firms=")) o.firms=Number(x.slice(8));
    else if(x.startsWith("--days=")) o.days=Number(x.slice(7));
    else if(x.startsWith("--out=")) o.out=path.resolve(x.slice(6));
    else throw new Error("Unknown argument: "+x);
  }
  assert.ok(o.seeds.length && o.seeds.every(Number.isInteger),"Seed must be an integer");
  assert.ok(Number.isInteger(o.firms)&&o.firms>=1&&o.firms<=30,"firms must be 1..30");
  assert.ok(Number.isInteger(o.days)&&o.days>=1&&o.days<=3600,"days must be 1..3600");
  return o;
}
function getGitHead(repo){return cp.execFileSync("git",["rev-parse","HEAD"],{cwd:repo,encoding:"utf8"}).trim()}
function sourceBundle(repo){
  const head=getGitHead(repo);assert.equal(head,EXPECTED_SHA,"Incorrect Git HEAD; checkout the exact reviewed commit");
  const dirty=cp.execFileSync("git",["status","--porcelain","--","src","tests","build"],{cwd:repo,encoding:"utf8"}).trim();
  assert.equal(dirty,"","Source/test/build files must be clean");
  const load=(relative)=>fs.readFileSync(path.join(repo,relative),"utf8");
  const game=load("src/base_v5.js")+"\n"+PARTS.map(f=>load("src/"+f)).join("\n");
  const stub=load("tests/stub.js");
  for(const s of ["function init(","function step(","function earn(","function autop(","function ctlAll("])
    assert.ok(game.includes(s),"Missing engine symbol: "+s);
  return {game,stub,head};
}
function makeContext(bundle, seed){
  const ctx=vm.createContext({ console, setTimeout:()=>0, clearTimeout:()=>{}, setInterval:()=>0, clearInterval:()=>{}, requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{} });
  const seedJS=`Math.random=(${mulberry.toString()})(${JSON.stringify(seed)});var global=globalThis;\n`;
  // Actual game's test harness loads stub BEFORE game, then build/build.py's order.
  vm.runInContext(seedJS+bundle.stub+"\nrequestAnimationFrame = () => 0;\ncancelAnimationFrame = () => {};\n"+bundle.game,ctx,{filename:"assembled_real_game.js",timeout:60000});
  vm.runInContext(`init(Object.assign(defCfg(),{tut:0,seed:${JSON.stringify(seed)}})); mdl=null;`,ctx,{timeout:60000});
  const initProof=vm.runInContext(`({seed:S.seed,day:S.day,count:S.co.length})`,ctx);
  assert.equal(initProof.seed,seed,"World seed not initialized as requested");
  assert.equal(initProof.day,0,"World did not start at day zero");
  assert.ok(initProof.count>=10,"Insufficient companies");
  return ctx;
}
function eligibleTargets(bundle, seed, max){
  const c=makeContext(bundle,seed);
  const rows=vm.runInContext(`S.co.map((x,idx)=>({x,idx})).filter(({x})=>!x.dead&&!x.priv&&!x.kd&&x.i!==HOLD&&!mine(x)&&!x.own.P&&!x.ctl&&held(x)<39&&x.A>300)
    .map(({x,idx})=>({id:x.id==null?idx:x.id,idx,tk:x.tk,industry:x.i,A:x.A,startEq:eq(x),cs:x.cs,D:x.D,g:x.g,pay:x.pay,sweep:x.sweep,ps:x.ps,p:x.p,sh:x.sh}))`,c);
  assert.ok(rows.length>=max,`Only ${rows.length} eligible companies, requested ${max}`);
  // Deterministic industry-diverse selection: sorted by company ID, spaced across roster.
  const seen=new Set(),selected=[];
  for(let j=0;j<max;j++){const idx=Math.floor((j+.5)*rows.length/max);let at=idx;while(seen.has(at))at=(at+1)%rows.length;seen.add(at);selected.push(rows[at]);}
  return JSON.parse(JSON.stringify(selected));
}
function instrument(ctx,meta,arm,day0Autop=true){
  if(typeof meta!=="object")meta={id:meta,idx:meta,tk:null};
  ctx.__rtConfig={id:meta.id,idx:meta.idx ?? meta.id,tk:meta.tk,arm,day0Autop};
  vm.runInContext(`(function(){
    const cfg=__rtConfig, arm=cfg.arm;
    const c=(cfg.tk&&S.co.find(x=>x&&x.tk===cfg.tk))||S.co.find(x=>x&&x.id===cfg.id)||S.co[cfg.idx];if(!c||c.dead)throw new Error('Target is absent or dead');
    globalThis.__rtTargetFirm=c;
    const pre={A:c.A,cs:c.cs,D:c.D,gw:c.gw,sh:c.sh,g:c.g,pay:c.pay,sweep:c.sweep,ps:c.ps};
    if(arm!=='A0'){
      if(held(c)>=40||c.ctl||c.own.P)throw new Error('Cannot grant 60% without exceeding ownership constraints');
      setOwn(c,'P',60);ctlAll();if(!mine(c))throw new Error('Control assignment did not produce mine(c)');
      for(const k of Object.keys(pre))if(c[k]!==pre[k])throw new Error('Financial state changed when adding ownership: '+k);
    }
    globalThis.__rtLog={quarters:0,div:0,cashShort:0,cashShortAmount:0,events:[],decisions:[],maxDE:0,insolventDays:0,worstRating:0,days:0,finished:false,initial:pre,arm};
    const origAutop=autop;
    autop=function(x){
      if(x!==__rtTargetFirm)return origAutop(x);
      const r=rating(x),roa=x.ni*4/Math.max(1,x.A),gap=x.kd?0:S.dg[x.i]-S.cg[x.i];
      origAutop(x); // Preserve pay, sweep, ps, HOLD and ordinary calculations.
      if(arm==='A3'&&(typeof HOLD==='undefined'||x.i!==HOLD))x.g=r>=4?0:roa>.11&&r<=1&&gap>.005?.12:roa>.07&&r<=2&&gap>-.01?.07:r===3||gap<=-.02?.02:.04;
      __rtLog.decisions.push({day:S.day,g:x.g,pay:x.pay,ps:x.ps,sweep:x.sweep,r,roa,gap});
    };
    // Mirror the actual G.ap activation: an immediate decision on day 0.
    if(arm==='A2'||arm==='A3'){c.ap=1;if(cfg.day0Autop)autop(c)}else c.ap=0;
    let insideEarn=false,negativeCs=0;
    const cashDescriptor=Object.getOwnPropertyDescriptor(c,'cs');
    if(cashDescriptor&&!cashDescriptor.configurable)throw new Error('Cannot instrument cs safely');
    let cv=c.cs;
    Object.defineProperty(c,'cs',{configurable:true,enumerable:true,get(){return cv},set(v){
      if(insideEarn&&v<Math.min(0,cv))negativeCs+=Math.min(0,cv)-v;
      cv=v;
    }});
    const origEarn=earn;
    earn=function(x){if(x!==__rtTargetFirm)return origEarn(x);
      const oldDay=S.day;negativeCs=0;insideEarn=true;
      let rv;try{rv=origEarn(x)}finally{insideEarn=false}
      __rtLog.quarters++;
      if(negativeCs>0){__rtLog.cashShort++;__rtLog.cashShortAmount+=negativeCs}
      if(x.er&&x.er.d===oldDay&&Number.isFinite(x.er.dv))__rtLog.div+=x.er.dv;
      return rv;
    };
    globalThis.__rtCheckpoint=function(){
      const x=__rtTargetFirm, e=eq(x),r=rating(x);
      if(e>0&&Number.isFinite(x.D/e))__rtLog.maxDE=Math.max(__rtLog.maxDE,x.D/e);
      else __rtLog.insolventDays++;
      __rtLog.worstRating=Math.max(__rtLog.worstRating,r);
    };
    __rtCheckpoint();
  })()`,ctx,{timeout:15000});
}
function runWorld(ctx, days){
  let hardDialogs=0;
  for(let d=1;d<=days;d++){
    vm.runInContext("step()",ctx,{timeout:60000});
    // Always resolve event choices; never leave a world paused in an undisclosed modal.
    for(let j=0;j<20;j++){
      const ev=vm.runInContext(`({ev2:!!S.ev2,evMode:S.ev2&&S.ev2.m,modal:!!mdl,options:mdl&&mdl.o&&mdl.o.length,ev:!!S.ev})`,ctx);
      if(!ev.modal&&!ev.ev2&&!ev.ev)break;
      hardDialogs++;
      if(ev.ev2){
        vm.runInContext(`(function(){const a=S.ev2,e=EV2.find(z=>z.id===a.id),c=S.co[a.c];
          if(!e||!c||c.dead){S.ev2=null;mdl=null;return}
          if(a.m==='own')G.ev2Pick('mg');
          else {const choice=e.ai(c,a.x);if(Array.isArray(choice)&&Number.isFinite(choice[1]))a.v=choice[1];G.ev2Pick(Array.isArray(choice)?choice[0]:choice)}
          __rtLog.events.push({day:S.day,type:'ev2',id:a.id,mode:a.m});
        })()`,ctx,{timeout:30000});
      }else if(ev.modal){
        vm.runInContext(`(function(){const m=mdl;if(m&&Array.isArray(m.o)&&m.o.length){G.mk(m.o.length-1)}else{mdl=null};__rtLog.events.push({day:S.day,type:'modal',title:m.t})})()`,ctx,{timeout:30000});
      }else if(ev.ev){
        vm.runInContext(`(function(){G.evPick('n');__rtLog.events.push({day:S.day,type:'ev_fallback'})})()`,ctx,{timeout:30000});
      }
      if(j===19)throw new Error(`Modal loop exceeded at day ${d}`);
    }
    vm.runInContext(`__rtLog.days++;__rtCheckpoint()`,ctx,{timeout:15000});
    if(d===days){const actual=vm.runInContext("S.day",ctx);assert.equal(actual,days,"Unexpected day progression")}
  }
  return hardDialogs;
}
function worldResult(ctx,meta,seed,arm){
  ctx.__meta=meta;
  const r=vm.runInContext(`(function(){const c=__rtTargetFirm;return {
      tk:c.tk,dead:!!c.dead,eq:eq(c),A:c.A,cs:c.cs,D:c.D,price:c.p,shares:c.sh,
      rating:rating(c),growth:c.g,quality:c.q||0,initial:S.day,
      log:__rtLog,initialPrice:__meta.p,initialShares:__meta.sh
    }})()`,ctx);
  function safe(v){return Number.isFinite(v)?v:null}
  const out={seed,firmId:meta.id,tk:meta.tk,industry:meta.industry,arm,initialEq:meta.startEq,finalEq:safe(r.eq),cumDiv:safe(r.log.div),
    bookEqPlusDiv:safe(r.eq+r.log.div),bookReturnPct:meta.startEq>0?safe(100*(r.eq+r.log.div-meta.startEq)/meta.startEq):null,
    alive:!r.dead&&r.eq>0,finalRating:r.rating,worstRating:r.log.worstRating,
    finalDE:r.eq>0?safe(r.D/r.eq):null,maxDE:safe(r.log.maxDE),insolventDays:r.log.insolventDays,cashShortCount:r.log.cashShort,
    cashShortAmount:safe(r.log.cashShortAmount),quarterCount:r.log.quarters,events:r.log.events.length,days:r.log.days,
    decisions:r.log.decisions.map(x=>Object.assign({},x)),
    finalPrice:safe(r.price), initialPrice:safe(meta.p), initialShares:safe(meta.sh),finalShares:safe(r.shares)};
  // No TSR field: the book-value proxy is not a traded-shareholder total return.
  assert.equal(out.days,r.initial,"Telemetry is missing simulated days");
  assert.ok(out.days>0 && Number.isFinite(out.finalEq),"Invalid final equity");
  assert.ok(Number.isFinite(out.cumDiv),"Invalid dividends");
  assert.ok(Number.isFinite(out.bookReturnPct),"Invalid book proxy return");
  return out;
}
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null}
function pairedSummary(rows){
  const groups=new Map();for(const row of rows){const k=`${row.seed}:${row.firmId}`;if(!groups.has(k))groups.set(k,{});groups.get(k)[row.arm]=row}
  const pairs=[['A3','A2'],['A2','A1'],['A1','A0']];
  return pairs.map(([a,b])=>{
    const diffs=[],bySeed=new Map();for(const [key,g] of groups){assert.ok(g[a]&&g[b],`Missing pair ${a} ${b} in ${key}`);
      const t=g[a],c=g[b],delta={seed:t.seed,firmId:t.firmId,bookVal:t.bookEqPlusDiv-c.bookEqPlusDiv,eq:t.finalEq-c.finalEq,div:t.cumDiv-c.cumDiv,
        bookReturn:t.bookReturnPct-c.bookReturnPct,cashShort:t.cashShortCount-c.cashShortCount,alive:Number(t.alive)-Number(c.alive)};
      diffs.push(delta);if(!bySeed.has(t.seed))bySeed.set(t.seed,[]);bySeed.get(t.seed).push(delta.bookReturn);
    }
    return {comparison:`${a}-${b}`,pairs:diffs.length,seeds:bySeed.size,
      meanBookReturnDiffPct:mean(diffs.map(x=>x.bookReturn)),seedMeans:[...bySeed].map(([seed,z])=>({seed,meanBookReturnDiffPct:mean(z)})),
      meanBookValDiff:mean(diffs.map(x=>x.bookVal)),meanEquityDiff:mean(diffs.map(x=>x.eq)),
      meanDividendDiff:mean(diffs.map(x=>x.div)),meanCashShortDiff:mean(diffs.map(x=>x.cashShort)),
      bookWinRate:mean(diffs.map(x=>Number(x.bookVal>0))),paired:diffs};
  });
}
function execute(config){
  const bundle=sourceBundle(config.repo);const rows=[];let run=0;
  for(const seed of config.seeds){const targets=eligibleTargets(bundle,seed,config.firms);
    for(const firm of targets){for(const arm of POLICIES){
      const ctx=makeContext(bundle,seed);
      const idx=firm.idx??firm.id;
      const initial=vm.runInContext(`({A:S.co[${idx}].A,cs:S.co[${idx}].cs,D:S.co[${idx}].D,e:eq(S.co[${idx}]),tk:S.co[${idx}].tk})`,ctx);
      assert.equal(initial.tk,firm.tk);assert.equal(initial.A,firm.A);assert.equal(initial.e,firm.startEq);
      instrument(ctx,firm,arm,config.day0Autop);runWorld(ctx,config.days);rows.push(worldResult(ctx,firm,seed,arm));
      run++;console.log(`RUN ${run}: seed=${seed}, ${firm.tk}, ${arm}, equity=${rows.at(-1).finalEq.toFixed(3)}, dividends=${rows.at(-1).cumDiv.toFixed(3)}`);
    }}
  }
  const summary=pairedSummary(rows);
  const result={status:"REAL_ENGINE_EXECUTION",sourceSHA:bundle.head,config:{seeds:config.seeds,firms:config.firms,days:config.days,policies:POLICIES,day0Autop:config.day0Autop},rows,summary};
  fs.writeFileSync(config.out,JSON.stringify(result,null,2));
  console.log(`Wrote ${rows.length} rows to ${config.out}`);
  for(const s of summary)console.log(s.comparison,`mean bookReturn difference=${s.meanBookReturnDiffPct.toFixed(3)} percentage points, seed clusters=${s.seeds}`);
  return result;
}
module.exports={mulberry,parseArgs,sourceBundle,makeContext,eligibleTargets,instrument,runWorld,worldResult,pairedSummary,execute};
if(require.main===module){try{execute(parseArgs(process.argv.slice(2)))}catch(e){console.error(`FAILED (NOT PASS): ${e.stack||e}`);process.exitCode=1}}
