// R3-R1 rollback check, step 1 (run on the R1 build): a game with pending companies, saved the way the game saves (JSON.stringify(S) / packS)
let errs=0,fails=0;
{const mul=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 Math.random=mul(5);init(Object.assign(defCfg(),{tut:0,seed:5}));mdl=null;S.spd=0;
 const iso=c=>{for(const k of Object.keys(c.own))setOwn(c,k,0);for(const t of Object.keys(c.pos))setOwn(S.co[+t],'c'+c.id,0)};
 const L=S.co.filter(c=>!c.dead&&!c.priv&&!c.kd&&c.i!==HOLD&&c.bk===0),A=L[30],B=L[300];iso(A);iso(B);setOwn(A,'P',35);setOwn(B,'c'+A.id,60);ctlAll();setOwn(A,'c'+B.id,40);ctlAll();A.ap=1;B.ap=1;setOwn(A,'P',0);ctlAll();
 for(let d=0;d<10;d++){step();if(S.ev2)S.ev2=null;mdl=null}
 const js=JSON.stringify(S);require('fs').writeFileSync(process.env.SAVE_OUT,js);const o=JSON.parse(js);
 console.log('info R1 build: live ctl',A.ctl,B.ctl,'| saved ctl',o.co[A.id].ctl,o.co[B.id].ctl,'| ctlp',JSON.stringify(o.ctlp),'| "?" anywhere in saved co:',o.co.some(c=>c.ctl==='?'));}
console.log('errs 0 fails 0');
