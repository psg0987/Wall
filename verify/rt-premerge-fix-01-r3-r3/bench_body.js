// R3-R3 benchmark body (same code in Node and in Chromium). Worst-cost cyclic SCC: 4 members, 8 candidates each (P, r0, r1, r2, 4 members,
// null; self excluded), product 4096, planned DFS nodes 4681 (just under the 5000 limit). First call = full search; second = fast path.
function __bench(){const out=[],now=()=>(typeof performance!=='undefined'?performance.now():Date.now());
 const mul=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const iso=c=>{for(const k of Object.keys(c.own))setOwn(c,k,0);for(const t of Object.keys(c.pos))setOwn(S.co[+t],'c'+c.id,0)};
 for(const K of [1,10,20,50,100]){Math.random=mul(7);init(Object.assign(defCfg(),{tut:0,seed:7}));mdl=null;S.spd=0;
  const L=S.co.filter(c=>!c.dead&&!c.priv&&!c.kd&&c.i!==HOLD&&c.bk===0);if(L.length<4*K){out.push('K '+K+': skipped, only '+L.length+' companies');continue}
  const U=L.slice(0,4*K);U.forEach(iso);U.forEach(c=>c.ctl=null);
  for(let g=0;g<K;g++){const m=U.slice(4*g,4*g+4);for(const c of m){setOwn(c,'P',34);setOwn(c,'r0',5);setOwn(c,'r1',5);setOwn(c,'r2',5);for(const d of m)if(d!==c)setOwn(c,'c'+d.id,15)}}
  let t0=now();ctlAll();const first=now()-t0;const st1={};for(const x of CTLS.filter(x=>x.members&&x.members.length===4))st1[x.status]=(st1[x.status]||0)+1;const pl=(CTLS.find(x=>x.planned)||{}).planned;
  t0=now();S.cd=1;ctlAll();const second=now()-t0;const st2={};for(const x of CTLS.filter(x=>x.members&&x.members.length===4))st2[x.status]=(st2[x.status]||0)+1;
  out.push('K '+K+' worst-cost SCCs (planned '+pl+' nodes each): first ctlAll '+first.toFixed(1)+' ms '+JSON.stringify(st1)+', P controls '+U.filter(mine).length+'/'+U.length+' | next call '+second.toFixed(1)+' ms '+JSON.stringify(st2))}
 Math.random=mul(101);init(Object.assign(defCfg(),{tut:0,seed:101}));mdl=null;const ts=[];for(let k=0;k<200;k++){S.cd=1;const t0=now();ctlAll();ts.push(now()-t0)}ts.sort((a,b)=>a-b);
 out.push('ordinary world ('+S.co.length+' companies, no cycle): ctlAll median '+ts[100].toFixed(2)+' ms, p95 '+ts[190].toFixed(2)+' ms');return out}
