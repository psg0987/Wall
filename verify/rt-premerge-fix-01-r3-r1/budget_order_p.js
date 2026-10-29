// R3-R1 item 6: does the per-call SCC budget (50,000 nodes, shared in processing order) make the authority result depend on company numbering?
// variant: P 40% (+g/100), r0 5, r1 5, 15% from each other member — P is the grounded controller of every group when solved
// budget runs out after about 17 groups. Each group has its own P stake (10 + g/100 %) as its identity. Same structures, two numberings.
let errs=0,fails=0;
{const mul=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const run=numbering=>{Math.random=mul(7);init(Object.assign(defCfg(),{tut:0,seed:7}));mdl=null;S.spd=0;
  const iso=c=>{for(const k of Object.keys(c.own))setOwn(c,k,0);for(const t of Object.keys(c.pos))setOwn(S.co[+t],'c'+c.id,0)};
  const L=S.co.filter(c=>!c.dead&&!c.priv&&!c.kd&&c.i!==HOLD&&c.bk===0).slice(0,80);L.forEach(iso);L.forEach(c=>c.ctl=null);
  const pick=numbering==='A'?g=>L.slice(4*g,4*g+4):g=>[0,1,2,3].map(k=>L[79-(g+20*k)]);   // B: group members spread over the id range in reverse
  const G=[];for(let g=0;g<20;g++){const m=pick(g);G.push(m);for(const c of m){setOwn(c,'P',40+g/100);setOwn(c,'r0',5);setOwn(c,'r1',5);for(const d of m)if(d!==c)setOwn(c,'c'+d.id,15)}}
  const t0=Date.now();ctlAll();const ms=Date.now()-t0;
  return {ms,status:G.map(m=>{const st=[...new Set(m.map(c=>CTLQ[c.id]&&CTLQ[c.id].st))].join('/');return st}),mineCount:G.map(m=>m.filter(mine).length)}};
 const a=run('A'),b=run('B');
 console.log('info numbering A ('+a.ms+' ms): group statuses',JSON.stringify(a.status));
 console.log('info numbering B ('+b.ms+' ms): group statuses',JSON.stringify(b.status));
 const diff=a.status.map((s,g)=>s!==b.status[g]?g:null).filter(x=>x!==null);
 console.log('info groups whose status differs between numberings:',JSON.stringify(diff),'| P-controlled companies per group A',JSON.stringify(a.mineCount),'B',JSON.stringify(b.mineCount));
 console.log(diff.length?'RESULT order-dependent: same structures, different authority depending on company numbering':'RESULT no difference');}
console.log('errs 0 fails 0');
