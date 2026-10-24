// RT-FIN-CF-02-SAVE-01 investigation (2026-10-24, read-only; no game function is changed). Run with run.py next to this file.
// "current" = the game as it is (main d82f847). "A" = the SAME world in which, right after the export restore, the pending share-issue cash eqq of
// every company whose rows qBack rebuilt (live, not c.priv&&c.fo) is set to 0: what design option A would do inside qBack. Nothing else differs.
// Cash of a trade = (cs after - cs before) - (D after - D before) around the real game call (the FIN-CF-02 test convention), not taken from the statement.
// Export = packS(1) -> loadStr -> v8fix (the paste / cloud / file paths); full save = packS() (slots, autosave).
(async()=>{
const mulb=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const f2=x=>x==null?'n/a':(Math.abs(x)<1e-9?0:+x).toFixed(2);
const SEED=20261016;
function startWorld(seed){Math.random=mulb(seed);init(Object.assign(defCfg(),{tut:0,seed}));mdl=null}
const pickTarget=()=>S.co.find(c=>!c.dead&&!c.kd&&!c.priv&&!mine(c)&&!c.own.P&&c.bk===0&&c.A>3000);
const mkMine=T=>{setOwn(T,'P',60);ctlAll();return mine(T)};
function nextClose(T){const l0=T.fq&&T.fq[T.fq.length-1];for(let i=0;i<400&&!T.dead;i++){step();if(T.fq&&T.fq[T.fq.length-1]!==l0)return true}return false}
const lastD=T=>T.fq[T.fq.length-1][0];
const daysToClose=T=>90-((S.day-lastD(T))%90);
const waitDays=(T,n)=>{const w=Math.max(0,Math.min(n,daysToClose(T)-1));for(let i=0;i<w;i++)step()};
const reload=async strip=>{const txt=await packS(strip),s=await loadStr(txt);S=s;v8fix();S.bgs=0;col();secUpd();sel=-1;pg='';mdl=null;return txt};
const viaJson=()=>{const js=JSON.stringify(S,(k,v)=>k==="hr"||k==="hv"||k==="fq"||k==="IX"||k==="hm"||k==="w10"||k==="wd"?undefined:v);S=migrate(JSON.parse(js));v8fix();sel=-1;mdl=null};
const measure=(T,f)=>{const c0=T.cs,d0=T.D;f();return (T.cs-c0)-(T.D-d0)};
function row(T){const L=fqL(T),q=L[L.length-1],p=L[L.length-2],d=fqDerive(T,q,p);return{q,p,d,borrow:d.cff+q.dv-d.iss}}
const show=(lab,r)=>console.log(`  ${lab}: row ${r.q.d} vs previous ${r.p.d} | 증자·출자 ${f2(r.d.iss)} | 차입 증감 ${f2(r.borrow)} | 재무활동 ${f2(r.d.cff)} | 기타·투자 매매 ${f2(r.d.oth)} | 현금 증감 ${f2(r.d.dc)} | 영업 ${f2(r.d.cfo)} | est ${r.d.est} | st ${r.d.st} | nc ${f2(r.d.nc)}`);
const fixA=()=>{let n=0;for(const c of S.co)if(!c.dead&&!(c.priv&&c.fo)&&c.eqq){c.eqq=0;n++}return n};
const issue=T=>measure(T,()=>G.mg(T.id,'iss',.1)), buyback=T=>measure(T,()=>G.mg(T.id,'bb',5));
// eqCash calls after the restore, per company (to show what was recorded AFTER the restore)
let POSTEQ=null;{const e0=eqCash;eqCash=function(c,x){if(POSTEQ&&c&&x&&isFinite(x))POSTEQ[c.id]=(POSTEQ[c.id]||0)+x;return e0(c,x)}}

// ---------------- R0 the reported case (460.60) ----------------
console.log('\n[R0] the reported case: seed 20261016, issue 5 days after the close, export 10 days after the close, next close');
for(const [lab,load,fix] of [['current, export code (packS(1) -> loadStr)',()=>reload(1),0],['current, JSON strip emulation (used by the earlier report)',viaJson,0],['A',()=>reload(1),1]]){
  startWorld(SEED);const T=pickTarget();mkMine(T);nextClose(T);nextClose(T);const C=lastD(T);for(let i=0;i<5;i++)step();
  const X=issue(T),day=S.day;while(S.day<C+10)step();await load();const ld=S.day,T2=S.co[T.id],eqL=T2.eqq,isdL=T2.isd,csL=T2.cs,shL=T2.sh,L0=fqL(T2),ls=L0[L0.length-1];if(fix)fixA();
  nextClose(T2);const r=row(T2);
  console.log(`  ${lab}: ${T2.tk} last close ${C}, issue day ${day} cash ${f2(X)} | restore day ${ld}: eqq ${f2(eqL)}, isd ${isdL}, cash ${f2(csL)}, shares ${f2(shL)} | last rebuilt row ${ls.d}: cash ${f2(ls.cs)} (= ${f2(csL)} x ${(ls.cs/csL).toFixed(4)}, rounded), shares ${f2(ls.sh)} | after the close isq ${JSON.stringify(T2.isq)}`);show(lab,r)}

// ---------------- E1 issue mid-quarter, export, restore, next close ----------------
console.log('\n[E1] share issue mid-quarter -> export -> restore the same day -> first real close (current vs A in the same world)');
const E1={};
for(const v of ['current','A']){startWorld(SEED);const T=pickTarget();mkMine(T);nextClose(T);nextClose(T);const C=lastD(T);waitDays(T,30);
  const X=issue(T),eqqSave=T.eqq,shSave=T.sh,saveDay=S.day;await reload(1);const T2=S.co[T.id];const L=fqL(T2),ls=L[L.length-1],ld=S.day;
  if(v==='current')console.log(`  ${T2.tk}: last close day ${C}; issue on day ${saveDay}: cash +${f2(X)} (measured), eqq ${f2(eqqSave)}, shares ${f2(shSave)}; export and restore on day ${ld}
  after restore: eqq ${f2(T2.eqq)}, isq ${JSON.stringify(T2.isq)}, isd ${T2.isd} (= ${ld} - 720); ${L.length} rebuilt rows, the last one day ${ls.d}: cash ${f2(ls.cs)} = today's cash ${f2(T2.cs)} x scale ${(ls.cs/T2.cs).toFixed(4)} (rounded), shares ${f2(ls.sh)} = today's ${f2(T2.sh)} (already after the issue)`);
  if(v==='A')fixA();POSTEQ={};nextClose(T2);const post=POSTEQ[T2.id]||0;POSTEQ=null;
  const r=row(T2);E1[v]={r,X};show(v,r);console.log(`    share-issue cash recorded on ${T2.tk} after the restore (eqCash calls): ${f2(post)}`)}
{const a=E1.current,b=E1.A;console.log(`  difference current - A: 증자 ${f2(a.r.d.iss-b.r.d.iss)} | 재무활동 ${f2(a.r.d.cff-b.r.d.cff)} | 기타 ${f2(a.r.d.oth-b.r.d.oth)} | 현금 증감 ${f2(a.r.d.dc-b.r.d.dc)} | 차입 증감 ${f2(a.r.borrow-b.r.borrow)} | issue cash ${f2(a.X)}`)}

// ---------------- E2 control: full save ----------------
console.log('\n[E2] control: the same issue with a full save (packS(), quarter rows kept, qBack does not run)');
{startWorld(SEED);const T=pickTarget();mkMine(T);nextClose(T);nextClose(T);const C=lastD(T);waitDays(T,30);const X=issue(T);await reload(0);const T2=S.co[T.id];
 console.log(`  after restore: eqq ${f2(T2.eqq)}, isd ${T2.isd}, rows kept ${T2.fq.length}, last row day ${lastD(T2)} (the real close ${C}, before the issue)`);
 nextClose(T2);const r=row(T2);show('full save',r);
 const cffW=(r.q.D-r.p.D)+r.d.nc-r.q.dv+X,othW=r.d.dc-r.d.cfo+r.d.capex-cffW;
 console.log(`  with the measured issue cash ${f2(X)}: 재무활동 should be ${f2(cffW)}, 기타 ${f2(othW)} -> statement ${Math.abs(r.d.cff-cffW)<1e-6&&Math.abs(r.d.oth-othW)<1e-6?'MATCHES':'differs'} (the issue lies between two real closes)`)}

// ---------------- E3 buyback ----------------
console.log('\n[E3] buyback 5% mid-quarter -> export -> restore (the pending cash is negative)');
{const R={};for(const v of ['current','A']){startWorld(SEED);const T=pickTarget();mkMine(T);T.cs+=T.A;nextClose(T);nextClose(T);waitDays(T,30);const X=buyback(T);await reload(1);const T2=S.co[T.id];
  if(v==='current')console.log(`  buyback cash ${f2(X)} (measured), eqq after restore ${f2(T2.eqq)}`);if(v==='A')fixA();nextClose(T2);R[v]=row(T2);show(v,R[v])}
 console.log(`  difference current - A: 증자 ${f2(R.current.d.iss-R.A.d.iss)} | 기타 ${f2(R.current.d.oth-R.A.d.oth)} | 현금 증감 ${f2(R.current.d.dc-R.A.d.dc)}`)}

// ---------------- E4 a trade before the export and another after the restore ----------------
console.log('\n[E4] issue X before the export AND issue Z 10 days after the restore, same quarter');
{const R={};for(const v of ['current','A']){startWorld(SEED);const T=pickTarget();mkMine(T);nextClose(T);nextClose(T);waitDays(T,20);const X=issue(T);await reload(1);const T2=S.co[T.id];if(v==='A')fixA();
  for(let i=0;i<10;i++)step();const Z=issue(T2);nextClose(T2);R[v]=row(T2);if(v==='current')console.log(`  X ${f2(X)}, Z ${f2(Z)} (both measured)`);show(v,R[v]);R[v].Z=Z}
 console.log(`  cash of the quarter that is NOT in the rebuilt starting cash = Z ${f2(R.current.Z)}: current shows ${f2(R.current.d.iss)}, A ${f2(R.A.d.iss)}`)}

// ---------------- E5 boundaries around the close day ----------------
console.log('\n[E5] boundaries (export -> restore -> first real close). "misplaced" = 증자 shown - cash recorded after the restore');
const bnd=async(lab,prep)=>{const out=[];for(const v of ['current','A']){startWorld(SEED);const T=pickTarget();mkMine(T);nextClose(T);nextClose(T);await prep(T);const eq0=T.eqq,sd=S.day;await reload(1);const T2=S.co[T.id];const ld=S.day;
  if(v==='A')fixA();POSTEQ={};nextClose(T2);const post=POSTEQ[T2.id]||0;POSTEQ=null;const r=row(T2);out.push(`${v}: 증자 ${f2(r.d.iss)}, 기타 ${f2(r.d.oth)}, misplaced ${f2(r.d.iss-post)}`);
  if(v==='current')out.unshift(`pending at export ${f2(eq0)} (export day ${sd}) | first real row ${r.q.d} vs rebuilt ${r.p.d} (restore day ${ld})`)}
  console.log(`  ${lab}: ${out.join(' | ')}`)};
await bnd('(a) issue, export one day before the close',async T=>{waitDays(T,200);issue(T)});
await bnd('(b) export on the close day right after the close, no trade',async T=>{waitDays(T,200);nextClose(T)});
await bnd('(c) close, then an issue the same day after the close, then export',async T=>{waitDays(T,200);nextClose(T);issue(T)});
await bnd('(d) issue, then export twice (restore, export again) before any close',async T=>{waitDays(T,20);issue(T);await reload(1)});
await bnd('(e) issue, the close confirms it, then export',async T=>{waitDays(T,20);issue(T);nextClose(T)});

// ---------------- E6 natural play: one export of a world nobody touched ----------------
console.log('\n[E6] natural play (no player action), export on day 540 of seed 20261016 and day 555 of seed 12345: every company with a pending eqq, at its first real close');
for(const [seed,day] of [[SEED,540],[12345,555]])for(const v of ['current','A']){startWorld(seed);for(let d=0;d<day;d++)step();const pend=S.co.filter(c=>!c.dead&&c.eqq).map(c=>({id:c.id,tk:c.tk,kd:c.kd,eqq:c.eqq}));const h0=S.day;
  await reload(1);if(v==='A')fixA();POSTEQ={};const res=[];for(const p of pend){const c=S.co[p.id];let n=0;const l0=c.fq[c.fq.length-1];while(c.fq[c.fq.length-1]===l0&&n<200&&!c.dead){step();n++}
    if(c.dead)continue;const r=row(c);res.push({tk:p.tk,kd:p.kd,pend:p.eqq,shown:r.d.iss,oth:r.d.oth,post:POSTEQ[p.id]||0,d:r.q.d})}POSTEQ=null;
  console.log(`  seed ${seed} ${v}: export on day ${h0}, ${pend.length} compan${pend.length===1?'y':'ies'} with a pending eqq`);
  for(const x of res)console.log(`    ${x.tk}${x.kd?' (financial kd'+x.kd+')':''}: pending at export ${f2(x.pend)} | row ${x.d}: 증자 ${f2(x.shown)}, 기타 ${f2(x.oth)} | recorded after the restore ${f2(x.post)} | misplaced ${f2(x.shown-x.post)}`)}

// ---------------- E7 FIN-CF-01: a chapter-11 relief waiting for its close through an export ----------------
console.log('\n[E7] FIN-CF-01 relief waiting for its close (ncq) through an export. ch11 outside earn(): only callLoan does this in the game');
const defic=c=>{const X=c.D-c.cs-c.gw-pfv(c);c.A=0.7*X/1.25/(1+c.g/4)};   // as tests/t_fincf01_relief.js
for(const [lab,trig] of [['(a) ch11() called directly after an asset write-down (synthetic)',T=>{T.A*=.3;ch11(T,'test')}],
                         ['(b) the real loan-call path: callLoan(bank, company, 1) after a write-down (as test F2b)',T=>{const b=S.co[T.ln];T.cs=0;defic(T);callLoan(b,T,1)}]]){
  console.log('  '+lab);const R={};
  for(const v of ['current','ncq set to 0 after the restore','full save']){startWorld(SEED);const T=pickTarget();nextClose(T);nextClose(T);waitDays(T,30);const D0=T.D;trig(T);const nq=T.ncq,bk=T.bk;
    await reload(v==='full save'?0:1);const T2=S.co[T.id];const nqL=T2.ncq;if(v.startsWith('ncq'))T2.ncq=0;nextClose(T2);R[v]=row(T2);
    if(v==='current')console.log(`    ${T2.tk}: chapter 11 (bk ${bk}), relief R waiting ${f2(nq)} -> after the export restore ncq ${f2(nqL)}`);show('  '+v,R[v])}
  const a=R.current,c=R['ncq set to 0 after the restore'];console.log(`    current - ncq 0: 차입 증감 ${f2(a.borrow-c.borrow)} | 기타 ${f2(a.d.oth-c.d.oth)} | 현금 증감 ${f2(a.d.dc-c.d.dc)}`)}

// ---------------- E8 FIN-CF-03A ----------------
console.log('\n[E8] FIN-CF-03A acquisition waiting for its close (acq) through an export (qBack already drops it)');
{startWorld(SEED);const T=pickTarget();mkMine(T);nextClose(T);nextClose(T);waitDays(T,30);const x=S.co.find(c=>!c.dead&&!c.priv&&!c.kd&&c!==T&&!mine(c)&&mc(c)<mc(T)*.3&&c.i!==HOLD);setOwn(x,'P',55);ctlAll();S.te=T.id;G.merge(x.id,40);
 const a0=T.acq&&T.acq.aD;await reload(1);const T2=S.co[T.id];console.log(`  ${T2.tk} absorbed ${x.tk}: pending aD at export ${f2(a0)} -> after restore acq ${JSON.stringify(T2.acq)}, acd ${T2.acd} (restore day ${S.day}), eqq ${f2(T2.eqq)}`);nextClose(T2);const r=row(T2);show('03A',r);console.log(`  row state ${r.d.st}, ncA ${f2(r.d.ncA)}`)}

// ---------------- E9 a company I founded ----------------
console.log('\n[E9] founded private company (c.priv && c.fo: qBack returns at once) with a pending cash contribution through an export');
{startWorld(SEED);S.cash=1e6;G.fdOpen();FD.sec=3;FD.cap=300;FD.fo='P';G.fdGo();const c=S.co[S.co.length-1];console.log(`  founded ${c.tk}: priv ${c.priv}, fo ${c.fo}`);
 nextClose(c);nextClose(c);waitDays(c,20);const X=measure(c,()=>{MV={fr:'P',to:c.id,how:'cap',amt:50,y:-1,f:1};G.mvGo()});const p0=c.eqq;await reload(1);const c2=S.co[c.id];
 console.log(`  contribution ${f2(X)}, pending ${f2(p0)} -> after restore eqq ${f2(c2.eqq)}, rows ${c2.fq?c2.fq.length:'none'} (not rebuilt)`);nextClose(c2);const L1=fqL(c2);console.log(`  first close after restore: ${L1.length} row(s); the first row has no previous row, so it has no cash-flow column (isq ${JSON.stringify(c2.isq)})`);
 nextClose(c2);const r=row(c2);show('second close',r)}
console.log('\ndone')})().catch(e=>console.log('ERR',e&&e.stack||e));
