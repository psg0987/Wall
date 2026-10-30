// R3-R3B: same as r3-r2/natural_hash.js, run with cache OFF then ON (env CACHE=0|1); also prints cache hits/misses.
// natural play, no player action: JSON state hash after 720 days, seeds 101, 202, 303 (same script on every engine)
let errs=0,fails=0;
{const crypto=require('crypto'),mul=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 CTLC.on=process.env.CACHE!=='0';for(const seed of [101,202,303]){CTLC.hit=CTLC.miss=CTLC.evict=0;Math.random=mul(seed);init(Object.assign(defCfg(),{tut:0,seed}));mdl=null;S.spd=0;for(let d=0;d<720;d++){step();if(S.ev2)S.ev2=null;mdl=null}
  const o=JSON.parse(JSON.stringify(S));delete o.ctlp;console.log('hash seed '+seed+' '+crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex').slice(0,16)+' pending '+S.co.filter(c=>c.ctl==='?').length+' | cache '+(CTLC.on?'ON':'OFF')+' hits '+CTLC.hit+' misses '+CTLC.miss+' evictions '+CTLC.evict+' size '+CTLC.size())}}
console.log('errs 0 fails 0');
