// RT-FIN-CF-02-SAVE-01 investigation (2026-10-24, read-only): more boundaries. Run with run.py next to this file.
// "A" = right after the export restore, the pending eqq of every company whose rows qBack rebuilt is set to 0 (what option A would do inside qBack).
(async()=>{
const mulb=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const f2=x=>x==null?'n/a':(Math.abs(x)<1e-9?0:+x).toFixed(2);
const SEED=20261016;
function startWorld(seed){Math.random=mulb(seed);init(Object.assign(defCfg(),{tut:0,seed}));mdl=null}
const pickTarget=()=>S.co.find(c=>!c.dead&&!c.kd&&!c.priv&&!mine(c)&&!c.own.P&&c.bk===0&&c.A>3000);
function nextClose(T){const l0=T.fq&&T.fq[T.fq.length-1];for(let i=0;i<400&&!T.dead;i++){step();if(T.fq&&T.fq[T.fq.length-1]!==l0)return true}return false}
const lastD=T=>T.fq[T.fq.length-1][0];
const daysToClose=T=>90-((S.day-lastD(T))%90);
const waitDays=(T,n)=>{const w=Math.max(0,Math.min(n,daysToClose(T)-1));for(let i=0;i<w;i++)step()};
const reload=async strip=>{const txt=await packS(strip),s=await loadStr(txt);S=s;v8fix();S.bgs=0;col();secUpd();sel=-1;pg='';mdl=null;return txt};
const measure=(T,f)=>{const c0=T.cs,d0=T.D;f();return (T.cs-c0)-(T.D-d0)};
function row(T){const L=fqL(T),q=L[L.length-1],p=L[L.length-2],d=fqDerive(T,q,p);return{q,p,d}}
// the cash-flow tab as the player sees it (same helper as tests/t_fincf02_issue.js); column 0 = the newest quarter
function cfTab(c){sel=-1;pg='';tab='h';S.spd=0;G.pick(c.id);G.stab('f');G.fseg(3);render();
  const h=document.getElementById('sh').innerHTML,row=lab=>{const part=h.split('<td>'+lab)[1];return part==null?null:[...part.split('</tr>')[0].matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m=>m[1])};
  return{h,row,text:h.replace(/<[^>]*>/g,'')}}
const fixA=()=>{for(const c of S.co)if(!c.dead&&!(c.priv&&c.fo))c.eqq=0};
const show=(lab,r)=>console.log(`  ${lab}: row ${r.q.d} vs ${r.p.d} | 증자·출자 ${f2(r.d.iss)} | 재무활동 ${f2(r.d.cff)} | 기타 ${f2(r.d.oth)} | 현금 증감 ${f2(r.d.dc)} | est ${r.d.est} | st ${r.d.st}`);
const base=async()=>{startWorld(SEED);const T=pickTarget();setOwn(T,'P',60);ctlAll();nextClose(T);nextClose(T);waitDays(T,30);const X=measure(T,()=>G.mg(T.id,'iss',.1));return{T,X}};

console.log('\n[E10] issue X before the export, then issue Z on the restore day right after the restore (no day passes)');
for(const v of ['current','A']){const {T,X}=await base();await reload(1);const T2=S.co[T.id];if(v==='A')fixA();const ld=S.day;const Z=measure(T2,()=>G.mg(T2.id,'iss',.1));
  nextClose(T2);const r=row(T2);if(v==='current')console.log(`  X ${f2(X)} before the export, Z ${f2(Z)} on restore day ${ld}`);show(v,r)}

console.log('\n[E11] autosave chain: export restore -> the game writes a FULL save at once (paste / cloud / file load call save()) -> that full save is restored');
for(const v of ['current','A at the export restore']){const {T,X}=await base();await reload(1);if(v!=='current')fixA();const e1=S.co[T.id].eqq;await reload(0);const T2=S.co[T.id];
  nextClose(T2);const r=row(T2);console.log(`  ${v}: eqq in the full save ${f2(e1)} (X ${f2(X)}); restored from the full save: the rebuilt rows are kept, qBack does not run`);show(v,r)}
console.log('  -> a full save written by a build WITHOUT the fix after an export restore keeps X; a fixed build loading it cannot clear it (no qBack on a full restore)');

console.log('\n[E12] option C: move the ledger start of a rebuilt company to the restore day (isd = load day instead of load day - 720)');
{const {T,X}=await base();await reload(1);const T2=S.co[T.id];T2.isd=S.day;nextClose(T2);const r=row(T2);show('isd = load day',r);
 const L=fqL(T2);console.log(`  rebuilt rows shown as estimates: ${L.filter((q,j)=>j&&fqDerive(T2,q,L[j-1]).est).length}; previous row ${r.p.d} < isd ${T2.isd}: led false, share count unchanged (dsh false) -> the rule still takes the ledger amount (X ${f2(X)})`)}

console.log('\n[E13] the tab cells of the first real row after the export restore (newest column)');
for(const v of ['current','A']){const {T,X}=await base();await reload(1);const T2=S.co[T.id];if(v==='A')fixA();nextClose(T2);const t=cfTab(T2);
 const cell=n=>(t.row(n)||[])[0];console.log(`  ${v}: 증자·출자(자사주) "${cell('증자·출자(자사주)')}" | 차입 증감 "${cell('차입 증감')}" | 재무활동 "${cell('재무활동 현금흐름')}" | 기타 "${cell('기타·투자 매매')}" | 현금 증감 "${cell('현금 증감')}" | page clean ${!/NaN|undefined|Infinity|\[object/.test(t.h)}`);
 const m=/※ ◐ 부분 기록 분기\(([^)]*)\)[^※]*/.exec(t.text);console.log(`    ◐ footnote: ${m?m[0].trim():'none'} | ≈ footnote: ${/※ ≈/.test(t.text)?'yes':'none'}`)}

console.log('\n[E14] day-0 export: a share issue on day 0 (before any day passes), export, restore on day 0 (qBack keeps acd on day 0)');
for(const v of ['current','A']){startWorld(SEED);const T=pickTarget();setOwn(T,'P',60);ctlAll();const X=measure(T,()=>G.mg(T.id,'iss',.1));await reload(1);const T2=S.co[T.id];const e=T2.eqq;if(v==='A')fixA();
  nextClose(T2);const r=row(T2);console.log(`  ${v}: X ${f2(X)}, eqq after restore ${f2(e)}, isd ${T2.isd}, acd ${T2.acd}`);show(v,r)}
})().catch(e=>console.log('ERR',e&&e.stack||e));
