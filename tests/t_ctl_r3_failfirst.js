// RT-PREMERGE-FIX-01-R3 — fail-first regression tests, source-free/test-only phase.
// Positive assertions describe expected R3 behavior; failures on FIX are intentional.
let errs=0, fails=0;
const ok=(x,msg)=>{console.log((x?'ok ':'FAIL ')+msg);if(!x)fails++};
const pre=(x,msg)=>{console.log((x?'pre ':'ERR  ')+msg);if(!x)errs++};
const safe=(fn)=>{try{return {value:fn(),error:null}}catch(e){return {value:null,error:String(e)}}};
const mul=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
function world(seed){Math.random=mul(seed);init(Object.assign(defCfg(),{tut:0,seed}));mdl=null;S.spd=0;sel=-1;pg='';S.apAll=0}
function isolate(c){for(const k of Object.keys(c.own))setOwn(c,k,0);for(const t of Object.keys(c.pos))setOwn(S.co[+t],'c'+c.id,0)}
function companies(n){const L=S.co.filter(c=>!c.dead&&!c.priv&&!c.kd&&c.i!==HOLD&&c.bk===0&&c.ctl!=='P');const x=[L[40],L[200],L[360],L[120],L[280]].slice(0,n).sort((a,b)=>a.id-b.id);pre(x.length===n&&x.every(Boolean),`fixture has ${n} ordinary companies`);x.forEach(isolate);return x}
const isPending=c=>c.ctl==='?';

// R3-01: K5: mutual 60% control offers two grounded fixed points.
// When no prior grounded full solution is supplied, do not invent a company controller.
{
  world(6101);const [a,b]=companies(2);
  setOwn(a,'c'+b.id,60);setOwn(b,'c'+a.id,60);
  a.ctl=b.ctl=null;ctlAll();
  ok(isPending(a)&&isPending(b),'R3-01 mutual 60% + null previous: both AMBIG; actual '+JSON.stringify([a.ctl,b.ctl]));
  const x=JSON.stringify([a.ctl,b.ctl]);ctlAll();
  ok(JSON.stringify([a.ctl,b.ctl])===x,'R3-01 AMBIG stable on re-evaluation');
}

// R3-02: a previous but groundless P-control fixed point must not be retained.
// Player has ZERO direct equity in the two-company cycle.
{
  world(6102);const [a,b]=companies(2);
  setOwn(a,'c'+b.id,40);setOwn(b,'c'+a.id,60);
  a.ctl=b.ctl='P';ctlAll();
  ok(!mine(a)&&!mine(b),'R3-02 zero-direct-equity fake [P,P] revoked, actual '+JSON.stringify([a.ctl,b.ctl]));
  ok(a.ctl!=='P'&&b.ctl!=='P','R3-02 no phantom P controller persisted');
}

// R3-03: R2 counterexample, uniquely grounded [P,P,P].
{
  world(6103);const [a,b,c]=companies(3);
  setOwn(a,'P',50);setOwn(a,'c'+b.id,35);setOwn(a,'r1',15);
  setOwn(b,'c'+c.id,20);setOwn(b,'r1',30);setOwn(b,'c'+a.id,25);
  setOwn(c,'c'+a.id,50);setOwn(c,'P',5);
  a.ctl=b.ctl=c.ctl=null;ctlAll();
  ok([a,b,c].every(mine),'R3-03 R2 three-company control EXACT P/P/P, actual '+JSON.stringify([a.ctl,b.ctl,c.ctl]));
}

// R3-04: unresolved shareholders must not collapse into a SINGLE synthetic shareholder.
// Rendering must not crash; roots must retain shareholder identity.
{
  world(6104);const [a,b,t]=companies(3);
  a.ctl=b.ctl='?';
  const ra=root('c'+a.id),rb=root('c'+b.id);
  ok(ra!==rb&&ra!=='P'&&rb!=='P','R3-04 two distinct unresolved shareholders have distinct root tokens '+JSON.stringify([ra,rb]));
  const d1=safe(()=>rootName('?c'+a.id)),d2=safe(()=>rootName('?'));
  ok(!d1.error&&!d2.error&&String(d1.value).includes('판정 보류')&&String(d2.value).includes('판정 보류'),'R3-04 unresolved root labels render as 판정 보류 '+JSON.stringify([d1,d2]));
  setOwn(t,'P',25);setOwn(t,'c'+a.id,15);setOwn(t,'c'+b.id,15);
  const v=safe(()=>dscScan(t,1));
  ok(!v.error,'R3-04 disclosure scan tolerates distinct unresolved owners '+v.error);
}

// R3-05: under an R3-grounded multi-solution K7 group, a child of q0
// is P-controlled under one q0 state but r1-controlled under another.
// The child must NOT be falsely awarded to P when q0 is AMBIG.
{
  world(6105);const q=companies(4),K=i=>'c'+q[i].id;
  const owns=[{r0:35,r1:35,[K(1)]:20,[K(2)]:10},{P:40,[K(2)]:45,[K(3)]:15},{P:15,r0:15,r1:25,[K(0)]:30,[K(3)]:15},{P:20,r0:25,[K(0)]:10,[K(1)]:20}];
  q.forEach((c,i)=>{for(const [h,v] of Object.entries(owns[i]))setOwn(c,h,v);c.ctl=null});
  const t=S.co.filter(c=>!c.dead&&!c.priv&&!c.kd&&c.i!==HOLD&&c.bk===0&&!q.includes(c)&&c.ctl!=='P')[100];
  pre(!!t,'R3-05 downstream company available');
  if(t){isolate(t);setOwn(t,'P',45);setOwn(t,'c'+q[0].id,40);setOwn(t,'r1',15);
    ctlAll();
    ok(!mine(t)&&isPending(t),'R3-05 K7 ambiguous q0 propagates to dependent child; actual '+JSON.stringify({q0:q[0].ctl,child:t.ctl}));
  }
}

// R3-06: unknown controller is not an ordinary neutral company.
{
  world(6106);const [a]=companies(1);a.ctl='?';
  ok(!mine(a),'R3-06 player operation blocked on unresolved controller');
  ok(Boolean(a.ctl),'R3-06 unresolved company not selected by !ctl neutral checks');
  const saved=S.te;S.te=a.id;teOK();ok(S.te==='P','R3-06 trade entity reverts to player on unresolved company');S.te=saved;
}

// R3-07: a non-controlled / unresolved firm is NOT automatically a neutral AI firm.
// Use earn() on one isolated real-company fixture with deterministic random=0,
// forcing the pre-existing bond-issuance branch to attempt to execute.
{
  world(6107);const [c]=companies(1);
  c.ctl='?';c.ap=0;c.sweep=1;c.bond=0;c.bh=0;c.pa=0;
  c.A=1000;c.cs=500;c.D=220;c.g=0;c.nol=0;c.pill=0;c.dead=0;
  const before={bond:c.bond,D:c.D,cs:c.cs};const keep=_R;_R=()=>0;
  const out=safe(()=>earn(c));_R=keep;
  pre(!out.error,'R3-07 real earnings fixture executes '+out.error);
  if(!out.error)ok(c.bond===0,'R3-07 unresolved firm cannot issue neutral-AI bonds; bond '+c.bond);
}
console.log('errs',errs,'fails',fails);
if(errs||fails)process.exitCode=1;
