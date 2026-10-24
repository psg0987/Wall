// RT-FIN-CF-02-SAVE-01 investigation (2026-10-24, read-only): the ACTUAL call order on one company, logged by wrappers around the real functions
// (each wrapper only logs and calls the original): eqCash, v8fix, v8prep, v11prep, bfill, qBack, earn, qPush, fqDerive. Scenario = R0 of repro.js
// (seed 20261016, PNPL, issue 5 days after the close, export 10 days after the close, first real close). Run with run.py next to this file.
(async()=>{
const mulb=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const f2=x=>x==null?String(x):(Math.abs(x)<1e-9?0:+x).toFixed(2);
Math.random=mulb(20261016);init(Object.assign(defCfg(),{tut:0,seed:20261016}));mdl=null;
const T0=S.co.find(c=>!c.dead&&!c.kd&&!c.priv&&!mine(c)&&!c.own.P&&c.bk===0&&c.A>3000),ID=T0.id;setOwn(T0,'P',60);ctlAll();
const st=c=>`eqq ${f2(c.eqq)}, isq ${JSON.stringify(c.isq)}, isd ${c.isd}, rows ${c.fq?c.fq.length:'none'}${c.fq&&c.fq.length?' (last '+c.fq[c.fq.length-1][0]+')':''}`;
let ON=false,n=0;const log=m=>{if(ON)console.log(`  ${String(++n).padStart(2)} day ${S.day}: ${m}`)};
const isT=c=>c&&c.id===ID&&S.co[ID]===c;
const wrap=(name,pre,post)=>{const f0=globalThis[name]||eval(name);const w=function(...a){const p=pre?pre(...a):null;const r=f0.apply(this,a);if(post)post(p,r,...a);return r};eval(name+'=w')};
wrap('eqCash',(c,x)=>isT(c)?st(c):null,(p,r,c,x)=>{if(p)log(`eqCash(${c.tk}, ${f2(x)})  [${p}] -> [${st(c)}]`)});
wrap('v8fix',()=>log('v8fix() start'),()=>log('v8fix() end'));
wrap('v8prep',c=>isT(c)?st(c):null,(p,r,c)=>{if(p)log(`  v8prep(${c.tk})  [${p}] -> [${st(c)}]  (sets eqq / isd only when missing)`)});
wrap('v11prep',()=>{if(S.IX)return null;log('  v11prep() start: no S.IX -> full rebuild (coPrep, then bfill)');return 1},p=>{if(p)log('  v11prep() end')});
wrap('bfill',()=>log('    bfill() start'),()=>log('    bfill() end'));
wrap('qBack',c=>isT(c)?st(c):null,(p,r,c)=>{if(p)log(`      qBack(${c.tk})  [${p}] -> [${st(c)}]`)});
wrap('earn',c=>isT(c)?st(c):null,(p,r,c)=>{if(p&&c.fq&&c.fq.length&&c.fq[c.fq.length-1][0]===Math.round(S.day))log(`earn(${c.tk}) close  [${p}] -> [${st(c)}]`)});
wrap('fqDerive',null,(p,d,c,q,prev)=>{if(isT(c)&&prev&&q.d===c.fq[c.fq.length-1][0])log(`fqDerive(${c.tk}, row ${q.d}, previous ${prev.d}): led ${prev.d>c.isd} (prev.d ${prev.d} > isd ${c.isd}), dsh ${q.sh!==prev.sh} (${prev.sh} -> ${q.sh}), iss ${f2(d.iss)}, est ${d.est}, cff ${f2(d.cff)}, oth ${f2(d.oth)}, dc ${f2(d.dc)}`)});
function nextClose(T){const l0=T.fq[T.fq.length-1];for(let i=0;i<400&&!T.dead;i++){step();if(T.fq[T.fq.length-1]!==l0)return true}return false}
nextClose(T0);nextClose(T0);const C=T0.fq[T0.fq.length-1][0];for(let i=0;i<5;i++)step();
console.log(`[T] ${T0.tk}: last close ${C}; trade, export (packS(1)), restore (loadStr + v8fix as the paste path does), first real close, statement`);
ON=true;G.mg(ID,'iss',.1);while(S.day<C+10)step();
log(`packS(1): ${T0.tk} [${st(T0)}] written to the export text (fq left out)`);const txt=await packS(1);
const s=await loadStr(txt);log(`loadStr -> migrate: ${s.co[ID].tk} [${st(s.co[ID])}]`);S=s;v8fix();S.bgs=0;col();secUpd();sel=-1;pg='';mdl=null;
const T=S.co[ID];log(`after the restore: ${T.tk} [${st(T)}]`);nextClose(T);
const L=fqL(T);fqDerive(T,L[L.length-1],L[L.length-2]);ON=false;
})().catch(e=>console.log('ERR',e&&e.stack||e));
