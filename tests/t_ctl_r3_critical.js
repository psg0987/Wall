// Experimental safety scenarios for the local prototype; MUST rerun on exact R2 HEAD before merge.
let errs=0,fails=0;const ok=(v,n)=>{console.log((v?'ok ':'FAIL ')+n);if(!v)fails++};const pre=(v,n)=>{console.log((v?'pre ':'ERR  ')+n);if(!v)errs++};
const mul=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const world=seed=>{Math.random=mul(seed);init(Object.assign(defCfg(),{tut:0,seed}));mdl=null;S.spd=0;S.apAll=0;pg='';sel=-1};
const iso=c=>{for(const k of Object.keys(c.own))setOwn(c,k,0);for(const t of Object.keys(c.pos))setOwn(S.co[+t],'c'+c.id,0)};
const pick=n=>{const l=S.co.filter(c=>!c.dead&&!c.priv&&!c.kd&&c.i!==HOLD&&c.bk===0&&c.ctl!=='P');const o=[];for(let i=0;i<n;i++)o.push(l[Math.floor(i*(l.length-1)/Math.max(1,n-1))]);o.forEach(iso);return o.sort((a,b)=>a.id-b.id)};
{
  world(7101);const [a,b,t]=pick(3);setOwn(a,'c'+b.id,60);setOwn(b,'c'+a.id,60);setOwn(t,'P',25);setOwn(t,'c'+a.id,15);setOwn(t,'c'+b.id,15);
  a.ctl=b.ctl=t.ctl=null;ctlAll();
  ok(a.ctl==='?'&&b.ctl==='?','C1 symmetric K5 upstream unresolved');
  ok(t.ctl==='?'&&CTLQ[t.id].st==='DEP','C1 child P25 vs combined upstream30 must be DEP, not fake exact P');
  const r1=root('c'+a.id),r2=root('c'+b.id);ok(r1!==r2&&r1!=='?'&&r2!=='?','C1 no synthetic ? root group merge');
}
{
  world(7102);const [a,b,t]=pick(3);setOwn(a,'c'+b.id,60);setOwn(b,'c'+a.id,60);setOwn(t,'P',70);setOwn(t,'c'+a.id,15);setOwn(t,'c'+b.id,15);
  a.ctl=b.ctl=t.ctl=null;ctlAll();
  ok(t.ctl==='P'&&CTLQ[t.id].st==='EXACT','C2 player direct 70% wins regardless of two ambiguous holders');
}
{
  world(7103);const [a,b]=pick(2);setOwn(a,'c'+b.id,40);setOwn(b,'c'+a.id,60);a.ctl=b.ctl='P';S.cd=0;
  const before=JSON.stringify(S);let saved=JSON.parse(before);S=saved;v8fix();
  ok(!mine(S.co[a.id])&&!mine(S.co[b.id]),'C3 loaded stale P/P revoked before UI/transactions');
  ok(S.cd===0&&!!CTLQ&&CTLQ.length===S.co.length,'C3 CTLQ regenerated in v8fix silent load');
}
{
  world(7104);const [a,b]=pick(2);setOwn(a,'c'+b.id,60);setOwn(b,'c'+a.id,60);a.ctl=b.ctl=null;ctlAll();
  const encoded=JSON.stringify(S);S=JSON.parse(encoded);CTLQ=null;CTLS=null;S.cd=0;v8fix();
  ok(S.co[a.id].ctl==='?'&&S.co[b.id].ctl==='?','C4 persisted ? controllers reverified and stay ambiguous on load');
  ok(CTLQ[a.id].st==='AMBIG'&&CTLQ[b.id].st==='AMBIG','C4 CTLQ reasons restored from source not saved');
}
console.log('errs',errs,'fails',fails);if(errs||fails)process.exitCode=1;
