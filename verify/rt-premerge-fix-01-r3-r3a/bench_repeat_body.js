// R3-R3A: repeated ctlAll with no ownership change. Per K in 1, 10, 20, 50: (a) AMBIG SCCs (K7 holdings: 4 grounded solutions, no common
// controller -> every call has no verified previous state -> full search, 2801 nodes each), (b) APPROX SCCs (5 dense members, product 32768 >
// 4096 -> rejected before any search), (c) verified SCCs (dense, P controls -> fast path). 1 warm-up call, then 10 timed calls.
function __benchRepeat(){const out=[],now=()=>(typeof performance!=='undefined'?performance.now():Date.now());
 const mul=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const iso=c=>{for(const k of Object.keys(c.own))setOwn(c,k,0);for(const t of Object.keys(c.pos))setOwn(S.co[+t],'c'+c.id,0)};
 const kinds={AMBIG:{n:4,mk:(m,K)=>{const [q0,q1,q2,q3]=m,c=i=>'c'+m[i].id;const own=[{r0:35,r1:35,[c(1)]:20,[c(2)]:10},{P:40,[c(2)]:45,[c(3)]:15},{P:15,r0:15,r1:25,[c(0)]:30,[c(3)]:15},{P:20,r0:25,[c(0)]:10,[c(1)]:20}];m.forEach((x,i)=>{for(const k in own[i])setOwn(x,k,own[i][k])})}},
  APPROX:{n:5,mk:m=>{for(const c of m){setOwn(c,'P',40);setOwn(c,'r0',4);setOwn(c,'r1',4);for(const d of m)if(d!==c)setOwn(c,'c'+d.id,13)}}},
  VERIFIED:{n:4,mk:m=>{for(const c of m){setOwn(c,'P',40);setOwn(c,'r0',5);setOwn(c,'r1',5);for(const d of m)if(d!==c)setOwn(c,'c'+d.id,15)}}}};
 for(const [kind,def] of Object.entries(kinds))for(const K of [1,10,20,50]){Math.random=mul(7);init(Object.assign(defCfg(),{tut:0,seed:7}));mdl=null;S.spd=0;
  const L=S.co.filter(c=>!c.dead&&!c.priv&&!c.kd&&c.i!==HOLD&&c.bk===0);const U=L.slice(0,def.n*K);U.forEach(iso);U.forEach(c=>c.ctl=null);for(let g=0;g<K;g++)def.mk(U.slice(def.n*g,def.n*g+def.n),K);
  ctlAll();const st={};for(const x of CTLS.filter(x=>x.members&&x.members.length===def.n))st[x.status]=(st[x.status]||0)+1;const ts=[];
  for(let r=0;r<10;r++){S.cd=1;const t0=now();ctlAll();ts.push(now()-t0)}ts.sort((a,b)=>a-b);const st2={};for(const x of CTLS.filter(x=>x.members&&x.members.length===def.n))st2[x.status]=(st2[x.status]||0)+1;
  out.push(kind+' x'+K+': status after 1st call '+JSON.stringify(st)+', during repeats '+JSON.stringify(st2)+', pending companies '+U.filter(c=>c.ctl==='?').length+'/'+U.length+' | repeated ctlAll median '+ts[5].toFixed(1)+' ms, max '+ts[9].toFixed(1)+' ms')}
 return out}
