// FIN-CF-02 investigation (2026-10-23, before the change): 14 share-count events on one company, cash measured around the real game call vs the statement. Run with run.py next to this file.
// FIN-CF-02 reproduction (read-only investigation; nothing here is in the repo).
// Expected value = cash the company really received (or paid) in the share event, measured by snapshots of c.cs and c.D right around
// the call of the real game function: real = (cs after - cs before) - (D after - D before). Not taken from fqDerive.
(async()=>{
const mulb=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const f2=x=>x==null?'n/a':(+x).toFixed(2);
const SEED=20261016;
function startWorld(seed){Math.random=mulb(seed);init(Object.assign(defCfg(),{tut:0,seed}));mdl=null}
const pickTarget=skip=>S.co.find(c=>!c.dead&&!c.kd&&!c.priv&&!mine(c)&&!c.own.P&&c.bk===0&&c.A>3000&&!(skip||[]).includes(c.id));
function nextClose(T){const n0=T.fq.length,l0=T.fq[T.fq.length-1];for(let i=0;i<400&&!T.dead;i++){step();if(T.fq[T.fq.length-1]!==l0)return true}return false}
function daysToClose(T){return 90-((S.day-T.fq[T.fq.length-1][0])%90)}
function trapSh(T){let v=T.sh,n=[];Object.defineProperty(T,'sh',{configurable:true,enumerable:true,get(){return v},set(x){if(Math.abs(x-v)>1e-12)n.push(new Error().stack.split('\n')[2].trim().slice(0,60));v=x}});return{n,off(){Object.defineProperty(T,'sh',{configurable:true,enumerable:true,writable:true,value:v})}}}
const snap=T=>({cs:T.cs,D:T.D,sh:T.sh,p:T.p,cash:S.cash});
const R=[];
// run one case: prepare(T) -> wait `wait` days -> act(T) (the real game function) -> next close -> compare
function run(label,{prep,act,wait=30,seed=SEED,target,mineIt}){
  startWorld(seed);let T=target?target():pickTarget();if(!T){console.log('SKIP',label,'no target');return}
  if(mineIt){setOwn(T,'P',60);ctlAll();if(!mine(T)){console.log('SKIP',label,'not mine');return}}
  nextClose(T);nextClose(T);if(prep)prep(T);
  const w=Math.min(wait,daysToClose(T)-1);for(let i=0;i<w;i++)step();
  const tr=trapSh(T);const s0=snap(T);let note='';try{note=act(T)||''}catch(e){note='EXC '+e.message}
  const s1=snap(T);const nAct=tr.n.length;
  const real=(s1.cs-s0.cs)-(s1.D-s0.D),dSh=s1.sh-s0.sh,pEff=dSh?real*1e4/dSh:null,dayAct=S.day;
  nextClose(T);tr.off();const extra=tr.n.length-nAct;
  const L=fqL(T),q=L[L.length-1],p=L[L.length-2],d=fqDerive(T,q,p);
  const r={label,tk:T.tk,dayAct,dayClose:q.d,dSh,dShRec:q.sh-p.sh,p0:s0.p,p1:s1.p,pEff,pClose:q.p,real,iss:d.iss,err:d.iss-real,
    othShift:-(d.iss-real),cff:d.cff,borrow:d.cff+q.dv-d.iss,extraShWrites:extra,note:String(note).slice(0,60)};
  R.push(r);
  console.log(`\n[${label}] ${T.tk} act day ${dayAct} close day ${q.d} ${r.note}`);
  console.log(`  shares: true change ${f2(dSh)} (만주), recorded row change ${f2(r.dShRec)}; other share writes before close: ${extra}`);
  console.log(`  price: before ${f2(s0.p)} after ${f2(s1.p)} effective issue/buy price ${f2(pEff)} close price q.p ${q.p}`);
  console.log(`  cash really received(+)/paid(-) ${f2(real)}  vs  statement 증자(자사주) ${f2(d.iss)}  => error ${f2(r.err)}  (기타 line absorbs ${f2(r.othShift)})`);
  return {T,q,p,d,r};
}
const EVf=s=>EV2.find(e=>String(e.go).includes(s));

// C1/C2 player rights issue (G.mg 'iss'): cash r = mc*f*.95, shares *(1+f), price *(1-.3f)
run('C1 player rights issue 10%',{mineIt:1,act:T=>{G.mg(T.id,'iss',.1)}});
run('C2 player rights issue 30%',{mineIt:1,act:T=>{G.mg(T.id,'iss',.3)}});
run('C1e same, issued 5 days after a close',{mineIt:1,wait:5,act:T=>{G.mg(T.id,'iss',.1)}});
run('C1l same, issued 1 day before the close',{mineIt:1,wait:200,act:T=>{G.mg(T.id,'iss',.1)}});
// C3 player buyback (G.mg 'bb'): pays mc*n/100*1.05 via ePay(company)
run('C3 player buyback 5%',{mineIt:1,act:T=>{G.mg(T.id,'bb',5)}});
// C4 private placement to me (G.pp): cost N*p*.98
run('C4 private placement 10% (G.pp)',{mineIt:1,prep:()=>{S.te='P';S.cash=1e6},act:T=>{S.te='P';G.pp(T.id,10)}});
// C5 stock option exercise (G.eoX): cost at strike k
run('C5 option exercise 2% at 60% of price',{prep:T=>{S.cash=1e6;S.ceo=T.id;S.eo=[{i:T.id,pct:2,k:Math.round(T.p*.6),v:S.day-1,x:S.day+900}]},act:T=>{S.ceo=T.id;if(S.eo[0])S.eo[0].k=Math.round(T.p*.6);G.eoX(0)}});
// C6 bailout event (G.evPick 'bail'): cash A*.15, shares /.7
run('C6 bailout (bail event)',{mineIt:1,act:T=>{S.ev={id:'bail',c:T.id,x:T.A*.15};G.evPick('buy')}});
// C7..C10 AI events (EV2.go)
run('C7 event: credit downgrade -> issue 10%',{act:T=>{const e=EVf('재무구조 개선');return e.go(T,e.mk(T),'iss')}});
run('C8 event: activist -> buyback 5%',{prep:T=>{T.cs+=T.A},act:T=>{const e=EVf('행동주의 요구 수용');return e.go(T,e.mk(T),'yes')}});
run('C9 event: buyback 4%',{prep:T=>{T.cs+=T.A},act:T=>{const e=EVf('자사주 매입 보류');return e.go(T,e.mk(T),'go',4)}});
run('C10 event: government buys 30% stake',{act:T=>{const e=EVf('정부에 지분 30%');return e.go(T,e.mk(T),'deal')}});
// C11/C12 splits: no cash; past rows are rescaled
run('C11 AI 10:1 split',{act:T=>{splitDo(T,10,1)}});
run('C12 1:10 reverse split',{act:T=>{splitDo(T,.1,1)}});
// C13 issue and buyback in one quarter
run('C13 issue 10% then buyback 5% same quarter',{mineIt:1,act:T=>{G.mg(T.id,'iss',.1);for(let i=0;i<10;i++)step();G.mg(T.id,'bb',5)}});
// C14 stock merger: acquirer issues N shares for the target (no cash), target cash/debt absorbed (FIN-CF-03 area)
run('C14 stock merger (G.merge), acquirer side',{mineIt:1,act:T=>{const x=S.co.find(c=>!c.dead&&!c.priv&&!c.kd&&c!==T&&!mine(c)&&mc(c)<mc(T)*.3&&c.i!==HOLD);setOwn(x,'P',55);ctlAll();S.te=T.id;const m0=S.st.ma;G.merge(x.id,40);return (S.st.ma>m0?'merged ':'merge FAILED ')+x.tk+' cs '+f2(x.cs)+' D '+f2(x.D)}});

console.log('\n==== summary (억원) ====');
console.log('case | Δsh | real cash | statement 증자 | error | issue px | close px');
for(const r of R)console.log([r.label,f2(r.dSh),f2(r.real),f2(r.iss),f2(r.err),f2(r.pEff),r.pClose].join(' | '));
console.log('errs 0 fails 0')})();
