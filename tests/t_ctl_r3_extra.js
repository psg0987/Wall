// Extra local experimental validations; not a claim of exact remote HEAD regression.
let errs=0,fails=0;const ok=(v,n)=>{console.log((v?'ok ':'FAIL ')+n);if(!v)fails++};const pre=(v,n)=>{console.log((v?'pre ':'ERR  ')+n);if(!v)errs++};
const mul=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const world=(seed)=>{Math.random=mul(seed);init(Object.assign(defCfg(),{tut:0,seed}));mdl=null;S.spd=0;S.apAll=0;pg='';sel=-1};
const iso=c=>{for(const k of Object.keys(c.own))setOwn(c,k,0);for(const t of Object.keys(c.pos))setOwn(S.co[+t],'c'+c.id,0)};
const pick=n=>{const l=S.co.filter(c=>!c.dead&&!c.priv&&!c.kd&&c.i!==HOLD&&c.bk===0&&c.ctl!=='P'),o=[];
for(let i=0;i<n;i++)o.push(l[Math.floor(i*(l.length-1)/Math.max(1,n-1))]);o.forEach(iso);return o.sort((a,b)=>a.id-b.id)};
const stats=()=>({exact:CTLQ.filter(x=>x&&x.st==='EXACT').length,unc:CTLQ.filter(x=>x&&['AMBIG','APPROX','DEP'].includes(x.st)).length});
{
world(6201);const [a,b]=pick(2);setOwn(a,'P',30);setOwn(a,'c'+b.id,25);setOwn(b,'c'+a.id,60);a.ctl=b.ctl=null;ctlAll();ok(a.ctl==='P'&&b.ctl==='P','E1 K6 direct P 30 / indirect 60 -> P,P');
const a2=a.ctl,b2=b.ctl;ctlAll();ok(a.ctl===a2&&b.ctl===b2,'E2 K6 repeated call stable');
}
{
world(6202);const [a,b]=pick(2);setOwn(a,'c'+b.id,60);setOwn(b,'c'+a.id,60);
a.ctl=null;b.ctl='c'+a.id;ctlAll();ok(a.ctl===null&&b.ctl==='c'+a.id,'E3 K5 known valid prior state preserved');
}
{
world(6203);const q=pick(4),K=i=>'c'+q[i].id;
const own=[{r0:35,r1:35,[K(1)]:20,[K(2)]:10},{P:40,[K(2)]:45,[K(3)]:15},{P:15,r0:15,r1:25,[K(0)]:30,[K(3)]:15},{P:20,r0:25,[K(0)]:10,[K(1)]:20}];
q.forEach((c,i)=>{for(const [k,v] of Object.entries(own[i]))setOwn(c,k,v);c.ctl=null});
ctlAll();const found=CTLS.filter(x=>x.members.some(id=>q.some(c=>c.id===id)));pre(found.length===1,'E4 one K7 SCC');
const g=found[0];ok(g.solutions===4,'E4 K7 4 grounded fixed points (got '+g.solutions+')');ok(q.every(c=>c.ctl==='?'),'E4 no common controller from null K7 start');
const a=q.map(c=>c.ctl);ctlAll();ok(q.every((c,i)=>c.ctl===a[i]),'E5 K7 uncertainty idempotent');
}
{
world(6204);const ms=pick(200);setOwn(ms[199],'P',60);for(let i=199;i>0;i--)setOwn(ms[i-1],'c'+ms[i].id,60);
const t=Date.now();ctlAll();const msElapsed=Date.now()-t;ok(ms.every(c=>c.ctl==='P'),'E6 200-company reverse control chain resolves in one call');ok(msElapsed<3000,'E6 chain <3000ms in Node '+msElapsed+'ms');
}
{
world(6205);const [u,t]=pick(2);setOwn(u,'P',60);setOwn(t,'P',70);setOwn(t,'c'+u.id,30);u.ctl='?';t.ctl=null;
// protect a downstream firm whose controller is provably the player even if the parent is unknown
ctlAll();ok(t.ctl==='P','E7 downstream P 70% robust to unresolved upstream');
}
{
world(6206);const [a,b,t]=pick(3);setOwn(t,'P',45);setOwn(t,'c'+a.id,40);setOwn(t,'r1',15);a.ctl=b.ctl='?';
// Directly exercise the production-ready propagation rule for pre-existing uncertain controllers
CTLQ=S.co.map(c=>({st:c.ctl==='?'?'AMBIG':c.ctl===null?'EXACT_NONE':'EXACT',poss:c.ctl==='?'?['P','r1']:[c.ctl]}));
// Real calculation of t must *not* treat missing votes as independent null.
const ga=root('c'+a.id);ok(ga!==null&&ga.startsWith('?'),'E8 pending root is distinct from exact null');
}
console.log('errs',errs,'fails',fails);if(errs||fails)process.exitCode=1;
