// RT-FIN-CF-02-SAVE-01 investigation (2026-10-24, read-only). One variant per process (VARIANT=current | fixA | fixA1), run by counterfactual.py:
// every scenario starts a world, exports (packS(1)) and restores it; fixA then sets the pending eqq of every company whose rows qBack rebuilt (live, not
// c.priv&&c.fo) to 0 (option A), fixA1 also the pending chapter-11 relief ncq (option A1). Then 360 days are played and a hash of the whole state S
// WITHOUT eqq / isq / ncq / rlf (the recording-only ledger fields) is printed every day, and at the end the next draws of the game's own random stream
// (_R; the game never draws from Math.random after init) and of a day-keyed stream wR(4). The caller compares the variants line by line: clearing the
// pending amounts must not change anything else. Separate processes, because the test stub keeps a few UI settings (S.sp0 / apc / ff / apr) across
// worlds started one after another in one process.
(async()=>{
const crypto=require('crypto');
const mulb=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const V=process.env.VARIANT;
function startWorld(seed){Math.random=mulb(seed);init(Object.assign(defCfg(),{tut:0,seed}));mdl=null}
const pickTarget=()=>S.co.find(c=>!c.dead&&!c.kd&&!c.priv&&!mine(c)&&!c.own.P&&c.bk===0&&c.A>3000);
function nextClose(T){const l0=T.fq[T.fq.length-1];for(let i=0;i<400&&!T.dead;i++){step();if(T.fq[T.fq.length-1]!==l0)return true}return false}
const daysToClose=T=>90-((S.day-T.fq[T.fq.length-1][0])%90);
const waitDays=(T,n)=>{const w=Math.max(0,Math.min(n,daysToClose(T)-1));for(let i=0;i<w;i++)step()};
const reload=async strip=>{const txt=await packS(strip),s=await loadStr(txt);S=s;v8fix();S.bgs=0;col();secUpd();sel=-1;pg='';mdl=null};
const defic=c=>{const X=c.D-c.cs-c.gw-pfv(c);c.A=0.7*X/1.25/(1+c.g/4)};   // as tests/t_fincf01_relief.js
const SKIP=new Set(['eqq','isq','ncq','rlf']);const h=()=>crypto.createHash('md5').update(JSON.stringify(S,(k,v)=>SKIP.has(k)?undefined:v)).digest('hex').slice(0,12);
const SC=[
 ['player issue 10% mid-quarter, export',20261016,async()=>{const T=pickTarget();setOwn(T,'P',60);ctlAll();nextClose(T);nextClose(T);waitDays(T,30);G.mg(T.id,'iss',.1)}],
 ['player buyback 5%, export',20261016,async()=>{const T=pickTarget();setOwn(T,'P',60);ctlAll();T.cs+=T.A;nextClose(T);nextClose(T);waitDays(T,30);G.mg(T.id,'bb',5)}],
 ['natural play to day 540, export',20261016,async()=>{for(let d=0;d<540;d++)step()}],
 ['natural play to day 555, export',12345,async()=>{for(let d=0;d<555;d++)step()}],
 ['natural play to day 225, export',20261016,async()=>{for(let d=0;d<225;d++)step()}],
 ['chapter-11 relief waiting for its close through the loan-call path callLoan (as test F2b), export',20261016,async()=>{const T=pickTarget();nextClose(T);nextClose(T);waitDays(T,30);const b=S.co[T.ln];T.cs=0;defic(T);callLoan(b,T,1)}]];
const out=[];
for(const [lab,seed,prep] of SC){startWorld(seed);await prep();const pend=S.co.filter(c=>!c.dead&&c.eqq).length+'/'+S.co.filter(c=>!c.dead&&c.ncq).length;await reload(1);
  let cleared=0;if(V==='fixA'||V==='fixA1')for(const c of S.co)if(!c.dead&&!(c.priv&&c.fo)){if(c.eqq){c.eqq=0;cleared++}if(V==='fixA1'&&c.ncq){c.ncq=0;cleared++}}
  out.push(lab+' | pending companies eqq/ncq '+pend+(V!=='current'?' | cleared '+cleared:''));
  for(let d=0;d<360;d++){step();out.push(lab+' '+S.day+' '+h())}
  out.push(lab+' END game rng (_R) '+[_R(),_R(),_R()].map(x=>x.toFixed(12)).join(',')+' | day-keyed wR(4) '+wR(4)().toFixed(12))}
console.log(out.join('\n'));
})().catch(e=>console.log('ERR',e&&e.stack||e));
