// RT-PREMERGE-FIX-01-R3 integration audit (Claude): pending (ctl "?") company authority, restore and rollback data. Engine = build under test.
const mul=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
let errs=0,fails=0;const ok=(x,m)=>{console.log((x?'ok   ':'FAIL ')+m);if(!x)fails++};const info=m=>console.log('info '+m);
{const iso=c=>{for(const k of Object.keys(c.own))setOwn(c,k,0);for(const t of Object.keys(c.pos))setOwn(S.co[+t],'c'+c.id,0)};
 const world=seed=>{Math.random=mul(seed);init(Object.assign(defCfg(),{tut:0,seed}));mdl=null;S.spd=0;sel=-1;pg=''};
 // phantom P cycle: P had control of A; A 60% of B, B 40% of A; P sold everything -> AMBIG ("?") for A and B
 const mk=seed=>{world(seed);const L=S.co.filter(c=>!c.dead&&!c.priv&&!c.kd&&c.i!==HOLD&&c.bk===0),A=L[30],B=L[300];iso(A);iso(B);
   setOwn(A,'P',35);setOwn(B,'c'+A.id,60);ctlAll();setOwn(A,'c'+B.id,40);ctlAll();A.ap=1;B.ap=1;setOwn(A,'P',0);ctlAll();return {A,B}};
 const {A,B}=mk(5);
 info('phantom cycle after P sold: A.ctl '+A.ctl+' B.ctl '+B.ctl+' CTLQ '+JSON.stringify([CTLQ[A.id],CTLQ[B.id]]));
 ok(A.ctl==='?'&&B.ctl==='?'&&!mine(A)&&!mine(B),'A1 phantom P control removed: both pending, mine false');
 S.te=A.id;teOK();ok(S.te==='P','A2 teOK resets a pending trading entity to P');
 info('A3 eAvail(pending A) = '+eAvail(A.id)+' ; ePay(A.id, 1) = '+ePay(A.id,1));
 const calls=[];const a0=autop;autop=function(c){calls.push(c.id);return a0(c)};
 const g0=[A.g,A.pay];G.ap(A.id);ok(A.ap===1&&calls.length===0,'A4 G.ap on a pending company does nothing (ap stays as saved, no decision)');
 for(let d=0;d<120;d++){step();if(S.ev2)S.ev2=null;mdl=null}ok(!calls.includes(A.id)&&!calls.includes(B.id),'A5 120 days: no autopilot decision for pending companies (ap flags kept: '+A.ap+','+B.ap+')');
 // autonomous paths that still use a pending company's cash (not gated by the patch): count over random runs by forcing pending companies
 // hqQ: growth drift for !mine&&!c.ap — pending company with ap 0
 B.ap=0;const gB=B.g;hqQ&&hqQ();info('A6 hqQ growth drift on pending B (ap 0): g '+gB+' -> '+B.g+(B.g!==gB?' (CHANGED: AI management still acts)':' (unchanged)'));
 // white knight candidate filter (act2.js:179 uses !x.ctl)
 info('A7 white-knight filter !x.ctl for pending A: '+(!A.ctl?'eligible':'excluded'));
 // optCp counterparty and loan-sale buyer filters only use !mine: pending companies are eligible
 info('A8 optCp / loan-sale / event acquirer / activist buyback filters use !mine only: pending A eligible = '+(!mine(A)));
 // restore: pack and load through migrate + v8fix (the shared step of the 5 restore paths)
 const js=JSON.stringify(S),s2=migrate(JSON.parse(js));const apBefore=[A.ap,B.ap];calls.length=0;S=s2;v8fix();
 const A2=S.co[A.id],B2=S.co[B.id];ok(A2.ctl==='?'&&B2.ctl==='?'&&calls.length===0&&A2.ap===apBefore[0]&&B2.ap===apBefore[1],'A9 restore (migrate+v8fix): pending kept, no autopilot, ap unchanged');
 // a save whose labels are phantom P (as written by old code) -> restore re-verifies
 for(const c of [A2,B2])c.ctl='P';const s3=migrate(JSON.parse(JSON.stringify(S)));S=s3;calls.length=0;v8fix();
 ok(S.co[A.id].ctl==='?'&&S.co[B.id].ctl==='?'&&calls.length===0,'A10 old save with phantom P labels: restore re-verifies to pending, no autopilot');
 require('fs').writeFileSync(process.env.SAVE_OUT||'/dev/null',JSON.stringify(S));info('A11 wrote a save with pending companies '+A.id+','+B.id+' for the rollback check');
}
console.log('errs',errs,'fails',fails);
