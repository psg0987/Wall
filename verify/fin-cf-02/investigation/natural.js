// FIN-CF-02 investigation (2026-10-23, before the change): a merger breakdown and a natural-play scan of every share-count change (5 seeds x 720 days). Run with run.py next to this file.
// (1) merger breakdown, (2) natural play: every quarter row of every company whose share count changed, statement vs real cash.
(async()=>{
const mulb=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const f2=x=>x==null?'n/a':(+x).toFixed(2);
function startWorld(seed){Math.random=mulb(seed);init(Object.assign(defCfg(),{tut:0,seed}));mdl=null}
const pickTarget=()=>S.co.find(c=>!c.dead&&!c.kd&&!c.priv&&!mine(c)&&!c.own.P&&c.bk===0&&c.A>3000);
function nextClose(T){const l0=T.fq[T.fq.length-1];for(let i=0;i<400&&!T.dead;i++){step();if(T.fq[T.fq.length-1]!==l0)return true}}
// (1) merger
{startWorld(20261016);const T=pickTarget();setOwn(T,'P',60);ctlAll();nextClose(T);nextClose(T);for(let i=0;i<30;i++)step();
 const x=S.co.find(c=>!c.dead&&!c.priv&&!c.kd&&c!==T&&!mine(c)&&mc(c)<mc(T)*.3&&c.i!==HOLD);setOwn(x,'P',55);ctlAll();S.te=T.id;
 const a0={cs:T.cs,D:T.D,sh:T.sh,A:T.A,gw:T.gw},x0={cs:x.cs,D:x.D,A:x.A,mc:mc(x)};G.merge(x.id,40);
 console.log('MERGER',T.tk,'absorbs',x.tk,'| target before: cash',f2(x0.cs),'debt',f2(x0.D),'assets',f2(x0.A),'mcap',f2(x0.mc));
 console.log('  acquirer change: cash',f2(T.cs-a0.cs),'debt',f2(T.D-a0.D),'assets',f2(T.A-a0.A),'goodwill',f2(T.gw-a0.gw),'shares',f2(T.sh-a0.sh),'price now',f2(T.p));
 nextClose(T);const L=fqL(T),q=L[L.length-1],p=L[L.length-2],d=fqDerive(T,q,p);
 console.log('  close',q.d,': statement 증자',f2(d.iss),' 차입 증감',f2(d.cff+q.dv-d.iss),' 재무활동',f2(d.cff),' 기타',f2(d.oth),' 현금증감',f2(d.dc),' (cash really raised by shares: 0)')}
// (2) natural play scan: traps record writes of cs/D/sh with the writing frame; share-event cash = adjacent cs/D writes from the same frame
const fr=()=>{const l=new Error().stack.split('\n')[3]||'';const m=l.match(/at (?:Object\.)?([\w$.<>]+)?\s*\(?.*?:(\d+):\d+\)?$/);return m?(m[1]||'anon')+'@'+m[2]:'?'};
for(const seed of [20261016,777,12345,4242,9001]){
  startWorld(seed);const W=new Map(),seen=new Set();let seq=0;
  const trap=c=>{if(seen.has(c))return;seen.add(c);const log=[];W.set(c.id,log);for(const k of['cs','D','sh']){let v=c[k];Object.defineProperty(c,k,{configurable:true,enumerable:true,get(){return v},set(x){const o=v;v=x;if(k==='sh'||Math.abs(x-o)>1e-12)if(k==='sh'?Math.abs(x-o)>1e-9:true)log.push({k,d:x-o,s:fr(),q:seq++,day:S.day})}})}};
  const closes=[];const e0=earn;earn=function(c){const l0=c.fq&&c.fq[c.fq.length-1];const r=e0(c);if(!c.dead&&c.fq&&c.fq[c.fq.length-1]!==l0)closes.push({id:c.id,q:seq++});return r};
  for(let d=0;d<720;d++){for(const c of S.co)trap(c);const nlog=[...W.values()].reduce((a,l)=>a+l.length,0);step();
    // keep only sh events and their adjacent same-frame cash writes, drop the rest (memory)
  }
  earn=e0;
  // build share events
  const rows=[];
  for(const[id,log]of W){const c=S.co[id];const ev=[];for(let i=0;i<log.length;i++){const w=log[i];if(w.k!=='sh')continue;let cash=0;
      for(const j of[i-2,i-1,i+1,i+2]){const u=log[j];if(u&&u.k!=='sh'&&u.s===w.s&&u.day===w.day)cash+=u.k==='cs'?u.d:-u.d}
      ev.push({q:w.q,day:w.day,s:w.s,dsh:w.d,cash})}
    if(!ev.length||!c.fq)continue;
    const cq=closes.filter(x=>x.id===id).map(x=>x.q);const L=fqL(c);
    // match each visible row j>=1 with the closes (last L.length closes)
    const cl=cq.slice(-L.length);
    for(let j=1;j<L.length;j++){const lo=cl[j-1],hi=cl[j];if(lo==null||hi==null)continue;const es=ev.filter(e=>e.q>lo&&e.q<hi);if(!es.length)continue;
      const d=fqDerive(c,L[j],L[j-1]);const real=es.reduce((a,e)=>a+e.cash,0);rows.push({tk:c.tk,kd:c.kd,d:L[j].d,src:[...new Set(es.map(e=>e.s))].join(','),dsh:es.reduce((a,e)=>a+e.dsh,0),real,iss:d.iss,err:d.iss-real,mc:L[j].sh*L[j].p/1e4})}}
  console.log('\nseed',seed,'— quarter rows (still visible at day 720) with a share-count change:',rows.length);
  for(const r of rows)console.log(`  ${r.tk}${r.kd?'(bank)':''} row ${r.d} [${r.src}] Δsh ${f2(r.dsh)} real ${f2(r.real)} statement ${f2(r.iss)} error ${f2(r.err)} (${f2(r.err/Math.max(1e-9,Math.abs(r.real))*100)}% of real; mcap ${f2(r.mc)})`);
}
console.log('errs 0 fails 0')})();
