// RT-AUTO-UX-01: real main engine, no mocks of autop/ctlAll/afterCtl.
let errs=0, fails=0;
const ok=(x,msg)=>{console.log((x?'ok ':'FAIL ')+msg); if(!x)fails++};
const mul=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
Math.random=mul(20261026);
init(Object.assign(defCfg(),{tut:0,seed:20261026}));mdl=null;S.spd=0;S.apAll=0;
const findNonFin=()=>S.co.find(c=>!c.dead&&!c.kd&&c.i!==HOLD&&c.ctl!=='P'&&!c.priv&&c.A>100);
const a=findNonFin();ok(!!a,'ordinary acquisition fixture');
setOwn(a,'P',60);ctlAll();ok(mine(a)&&!a.ap,'global OFF does not force autopilot when control acquired');
const b=findNonFin();
setOwn(b,'P',60);ctlAll();
const other=S.co.find(z=>z!==a&&z!==b&&!z.dead&&z.kd===1&&!z.priv&&z.ctl!=='P');
setOwn(other,'P',60);ctlAll();
const controlled=S.co.filter(mine);ok(controlled.length===3,'three controlled companies, including a bank');
let calls=[];const realAutop=autop;autop=function(z){calls.push(z.id);return realAutop(z)};
G.autoBulk(1);ok(controlled.every(z=>z.ap===1)&&calls.length===3,'bulk ON enables only controlled and recalculates each once');
const snapshot=controlled.map(z=>[z.id,z.g,z.pay,z.sweep,z.ps]);
G.autoBulk(1);ok(calls.length===3,'bulk ON idempotent');
G.autoBulk(0);ok(controlled.every(z=>z.ap===0),'bulk OFF disables controlled');
ok(JSON.stringify(snapshot)===JSON.stringify(controlled.map(z=>[z.id,z.g,z.pay,z.sweep,z.ps])),'bulk OFF preserves the last management parameters');
G.autoBulk(0);ok(calls.length===3,'bulk OFF idempotent');
G.ap(a.id);ok(a.ap===1&&calls.length===4,'individual ON applies existing policy once');
G.ap(a.id);ok(a.ap===0&&calls.length===4,'individual OFF never applies policy');
S.apAll=1;
const d=findNonFin();d.g=.333;d.pay=.777;const pre=calls.length;
setOwn(d,'P',60);ctlAll();ok(mine(d)&&d.ap===1&&calls.length===pre+1&&calls.at(-1)===d.id,'new direct control triggers exactly one immediate policy application');
ok(d.g!==.333&&d.pay!==.777,'new control does not retain old manual business policy');
ctlAll();ok(calls.length===pre+1,'repeated ctlAll does not duplicate policy');
G.ap(d.id);ctlAll();ok(d.ap===0&&calls.length===pre+1,'manually OFF remains OFF through ctlAll');
// Ownership via an already-controlled company; exercise indirect control via root('c'+id).
const indirect=S.co.find(z=>z.ctl!=='P'&&!z.dead&&!z.kd&&z.i!==HOLD&&!z.priv);
const count=calls.length;
setOwn(indirect,'c'+a.id,60);ctlAll();
ok(mine(indirect)&&indirect.ap===1&&calls.length===count+1,'indirect company ownership transition gets immediate policy');
// Without a global auto-on option, a pre-existing OFF flag stays OFF on a new acquisition.
S.apAll=0;
const f=findNonFin(),num=calls.length;setOwn(f,'P',60);ctlAll();
ok(mine(f)&&!f.ap&&calls.length===num,'new acquisition with global setting OFF stays manual');
const pg0=pg;pg='auto';const html=page();ok(html.includes('자동경영 관리')&&html.includes('전체 ON')&&html.includes('전체 OFF')&&html.includes('자동경영 끄기'),'dashboard displays all status controls');
pg=pg0;G.autoPage(50);pg='auto';const last=page();ok(!last.includes('NaN')&&!last.includes('undefined'),'dashboard pagination bounds are safe');
console.log('errs',errs,'fails',fails);

