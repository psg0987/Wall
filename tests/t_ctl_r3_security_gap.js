// R3 security: an ambiguous company cannot authorize new voluntary swap termination.
// Existing contractual swQ settlement should remain possible and is tested separately.
let errs=0,fails=0;const ok=(v,msg)=>{console.log((v?'ok ':'FAIL ')+msg);if(!v)fails++};
const mul=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
Math.random=mul(765321);init(Object.assign(defCfg(),{seed:765321,tut:0}));mdl=null;S.spd=0;
const candidates=S.co.filter(c=>!c.dead&&!c.priv&&!c.kd&&c.i!==HOLD&&c.ctl!=='P');const a=candidates[40],b=candidates[200];
for(const c of [a,b]){for(const k of Object.keys(c.own))setOwn(c,k,0);for(const id of Object.keys(c.pos))setOwn(S.co[+id],'c'+c.id,0)}
setOwn(a,'c'+b.id,60);setOwn(b,'c'+a.id,60);a.ctl=b.ctl=null;ctlAll();
ok(a.ctl==='?'&&b.ctl==='?','fixture AMBIG company')
a.cs=Math.max(a.cs,500);const x={e:a.id,cp:S.co.find(c=>!c.dead&&c.kd===1).id,N:100,t:'P',K:S.prime,dir:1,st:S.day,en:S.day+360,lp:0,tp:0};S.irs=[x];
const old=a.cs;G.swEnd(0);if(typeof mcb==='function')mcb();
ok(S.irs.includes(x)&&a.cs===old,'voluntary swap termination prohibited after losing authority');
console.log('errs',errs,'fails',fails)
