// RT-FIN-CF-02-SAVE-01 implementation (2026-10-24): why the 7 existing assertions that the A1 fix changes were wrong, shown with measured
// values on the CURRENT code (run on main d82f847 = before the fix; read-only). Run with run.py next to this file.
// It replays the two export cases of the existing tests step by step, exactly as they are written:
//   tests/t_fincf02_issue.js  SV 'export (packS(1))' (lines 170-188): assertions at lines 174, 183, 187
//   tests/t_fincf01_relief.js SV (a) export          (lines 351-364): assertions at lines 357, 361, 362, 364
// and measures what the rebuilt previous quarter is made of. qBack builds every rebuilt row k from the state at the restore:
// cash = cs_L * sc_k, debt = D_L * sc_k, assets = A_L * sc_k (one scale per row), shares = sh_L unscaled (src/sim.js qBack). The scale of
// the last rebuilt row is read back from its assets (sc = P.A / A_L), so the row's cash and debt can be compared with the state before
// and after the trade. If the previous quarter already holds the trade, the trade cannot be cash of the next quarter again.
(async()=>{
const mulb=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const f2=x=>x==null?'n/a':(Math.abs(x)<1e-9?0:+x).toFixed(2);
const SEED=20261016;
function startWorld(seed){Math.random=mulb(seed);init(Object.assign(defCfg(),{tut:0,seed}));mdl=null}
function nextClose(T){const l0=T.fq[T.fq.length-1];for(let i=0;i<400&&!T.dead;i++){step();if(T.fq[T.fq.length-1]!==l0)return true}return false}
const daysToClose=T=>90-((S.day-T.fq[T.fq.length-1][0])%90);
const waitDays=(T,n)=>{const w=Math.max(0,Math.min(n,daysToClose(T)-1));for(let i=0;i<w;i++)step()};
const reload=async strip=>{const txt=await packS(strip),s=await loadStr(txt);S=s;v8fix();S.bgs=0;col();secUpd();sel=-1;pg='';mdl=null;return txt};
const lastRows=T=>{const L=fqL(T);return{q:L[L.length-1],p:L[L.length-2],L}};
const cfoOf=(T,q)=>{const dep=T.kd?0:q.A*.02;return{cfo:q.ni-q.eq+q.ga+dep+(q.imp||0)+(q.wo||0),capex:T.kd?0:q.gr+dep}};

console.log('\n[P-02] tests/t_fincf02_issue.js SV export (packS(1)): PNPL, 10% rights issue 30 days after the close, export, restore the same day');
{const pickTarget=()=>S.co.find(c=>!c.dead&&!c.kd&&!c.priv&&!mine(c)&&!c.own.P&&c.bk===0&&c.A>3000);
 startWorld(SEED);let T=pickTarget();setOwn(T,'P',60);ctlAll();const id=T.id;nextClose(T);nextClose(T);waitDays(T,30);
 const s0={cs:T.cs,D:T.D,sh:T.sh};G.mg(T.id,'iss',.1);const s1={cs:T.cs,D:T.D,sh:T.sh,A:T.A};const X=(s1.cs-s0.cs)-(s1.D-s0.D);
 console.log(`  issue on day ${S.day}: cash ${f2(s0.cs)} -> ${f2(s1.cs)}, debt ${f2(s0.D)} -> ${f2(s1.D)}: X = ${f2(X)} | shares ${f2(s0.sh)} -> ${f2(s1.sh)} | eqq ${f2(T.eqq)}`);
 await reload(1);T=S.co[id];const ld=S.day,L0=fqL(T),P=L0[L0.length-1],sc=P.A/T.A;
 console.log(`  restored on day ${ld}: cash ${f2(T.cs)}, shares ${f2(T.sh)}, assets ${f2(T.A)} (the state saved after the issue) | eqq ${f2(T.eqq)} (line 174 expects ${f2(X)} here)`);
 console.log(`  rebuilt previous quarter (day ${P.d}): shares ${P.sh} = round(shares after the issue ${f2(s1.sh)}) ${P.sh===Math.round(s1.sh)?'YES':'NO'}; before the issue it would be ${Math.round(s0.sh)}`);
 console.log(`    scale from assets sc = ${P.A} / ${f2(T.A)} = ${sc.toFixed(5)} | cash ${P.cs} vs cash after the issue x sc = ${f2(s1.cs*sc)} (diff ${f2(P.cs-s1.cs*sc)}) | vs cash before the issue x sc = ${f2(s0.cs*sc)} (diff ${f2(P.cs-s0.cs*sc)})`);
 console.log(`    -> the rebuilt previous quarter already holds the issue cash (X x sc = ${f2(X*sc)}); it is not cash of the next quarter`);
 let shW=0;{let v=T.sh;Object.defineProperty(T,'sh',{configurable:true,enumerable:true,get(){return v},set(x){if(Math.abs(x-v)>1e-9)shW++;v=x}})}
 nextClose(T);{const v=T.sh;Object.defineProperty(T,'sh',{configurable:true,enumerable:true,writable:true,value:v})}
 const {q,p}=lastRows(T),d=fqDerive(T,q,p),{cfo,capex}=cfoOf(T,q),dD=q.D-p.D,R=d.nc||0,dc=q.cs-p.cs;
 const Z=0,cffZ=dD+R-q.dv+Z,othZ=dc-cfo+capex-cffZ,cffX=dD+R-q.dv+X,othX=dc-cfo+capex-cffX;
 console.log(`  first real close day ${q.d} (previous ${p.d}): share-count writes on PNPL after the restore ${shW} (no trade after the restore, so Z = 0) | statement 증자 ${f2(d.iss)} (line 183 expects X ${f2(X)})`);
 console.log(`    cash change dc = ${f2(dc)} | with 증자 = Z: 재무활동 ${f2(cffZ)}, 기타 ${f2(othZ)} | with 증자 = X (the old expectation): 재무활동 ${f2(cffX)}, 기타 ${f2(othX)} = the issue cash counted again in 재무활동 and taken back out of 기타`);
 console.log(`  line 187 (export again): needs a record confirmed by the first close; isq after that close ${JSON.stringify(T.isq)} = the pre-save X counted again, not a trade of the quarter`)}

console.log('\n[P-01] tests/t_fincf01_relief.js SV (a) export (packS(1), histories left out): chapter 11 right after the close, export, restore the same day');
{const pickTarget=()=>S.co.find(c=>!c.dead&&!c.kd&&!c.priv&&!mine(c)&&!c.own.P&&c.bk===0&&c.ln>=0&&S.co[c.ln]&&!S.co[c.ln].dead&&S.co[c.ln].kd===1&&c.A>3000);
 const defic=c=>{const X=c.D-c.cs-c.gw-pfv(c);c.A=0.7*X/1.25/(1+c.g/4)};
 startWorld(SEED);let T=pickTarget();const id=T.id;nextClose(T);nextClose(T);defic(T);const D0=T.D;ch11(T,'pending at save');const D1=T.D,Rr=D0-D1;
 console.log(`  ${T.tk} chapter 11 on day ${S.day}: debt ${f2(D0)} -> ${f2(D1)}: R = ${f2(Rr)} | ncq ${f2(T.ncq)}`);
 await reload(1);T=S.co[id];const L0=fqL(T),P=L0[L0.length-1],sc=P.A/T.A;
 console.log(`  restored on day ${S.day}: debt ${f2(T.D)} (after the relief), assets ${f2(T.A)} | ncq ${f2(T.ncq)} (line 357 expects ${f2(Rr)} here)`);
 console.log(`  rebuilt previous quarter (day ${P.d}): scale from assets sc = ${P.A} / ${f2(T.A)} = ${sc.toFixed(5)} | debt ${P.D} vs debt after the relief x sc = ${f2(D1*sc)} (diff ${f2(P.D-D1*sc)}) | vs debt before the relief x sc = ${f2(D0*sc)} (diff ${f2(P.D-D0*sc)})`);
 console.log(`    -> the rebuilt previous quarter already holds the relief (R x sc = ${f2(Rr*sc)}): its debt is the debt after the cut`);
 nextClose(T);const {q,p}=lastRows(T),d=fqDerive(T,q,p),dD=q.D-p.D;
 console.log(`  first real close day ${q.d} (previous ${p.d}): debt change dD = ${f2(dD)} (no relief inside it: both rows are after the cut) | statement nc ${f2(d.nc)}, rlf ${JSON.stringify(T.rlf)} (line 361 expects nc = R)`);
 console.log(`    차입 증감 with R added back (old SPEC, line 362 / UI line 364): ${f2(dD+Rr)} | without: ${f2(dD)} | the relief is counted as borrowing of a quarter whose debt change does not contain it`)}
console.log('\ndone')})().catch(e=>console.log('ERR',e&&e.stack||e));
