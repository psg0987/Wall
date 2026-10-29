// ctlAll time and outcome by number of cyclic SCCs (Node, desktop). Dense 4-company SCCs (7 candidates each, 2801 planned nodes) and
// 2-company cycles (P 30%, B 60% of A, A 25% of B), mixed. Also the average call in an ordinary world.
let errs=0,fails=0;
{const mul=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const iso=c=>{for(const k of Object.keys(c.own))setOwn(c,k,0);for(const t of Object.keys(c.pos))setOwn(S.co[+t],'c'+c.id,0)};
 const ords=()=>S.co.filter(c=>!c.dead&&!c.priv&&!c.kd&&c.i!==HOLD&&c.bk===0);
 for(const [nd,n2] of [[1,0],[5,0],[10,0],[17,0],[18,0],[20,0],[10,40],[0,100],[0,150]]){Math.random=mul(7);init(Object.assign(defCfg(),{tut:0,seed:7}));mdl=null;
  const L=ords();const need=4*nd+2*n2;if(L.length<need){console.log('info skip',nd,n2,'only',L.length,'companies');continue}const U=L.slice(0,need);U.forEach(iso);U.forEach(c=>c.ctl=null);
  for(let g=0;g<nd;g++){const m=U.slice(4*g,4*g+4);for(const c of m){setOwn(c,'P',40);setOwn(c,'r0',5);setOwn(c,'r1',5);for(const d of m)if(d!==c)setOwn(c,'c'+d.id,15)}}
  for(let g=0;g<n2;g++){const a=U[4*nd+2*g],b=U[4*nd+2*g+1];setOwn(a,'P',30);setOwn(b,'c'+a.id,60);setOwn(a,'c'+b.id,25)}
  const ts=[];for(let k=0;k<5;k++){S.cd=1;const t0=process.hrtime.bigint();ctlAll();ts.push(Number(process.hrtime.bigint()-t0)/1e6)}ts.sort((a,b)=>a-b);
  const cyc=CTLS.filter(x=>x.members&&x.limit!=null),lim=cyc.length?cyc[0].limit:null,st={};for(const x of cyc)st[x.status]=(st[x.status]||0)+1;
  console.log(`info dense ${nd} + 2-cycles ${n2} = cyclic SCCs ${cyc.length}: limit ${lim}, statuses ${JSON.stringify(st)}, P-controlled ${U.filter(mine).length}/${need}, ctlAll median ${ts[2].toFixed(1)} ms (max ${ts[4].toFixed(1)})`)}
 Math.random=mul(101);init(Object.assign(defCfg(),{tut:0,seed:101}));mdl=null;const ts=[];for(let k=0;k<200;k++){S.cd=1;const t0=process.hrtime.bigint();ctlAll();ts.push(Number(process.hrtime.bigint()-t0)/1e6)}ts.sort((a,b)=>a-b);
 console.log(`info ordinary world (${S.co.length} companies, no cycle): ctlAll median ${ts[100].toFixed(2)} ms, p95 ${ts[190].toFixed(2)} ms`)}
console.log('errs 0 fails 0');
