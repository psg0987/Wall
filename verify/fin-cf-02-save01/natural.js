// RT-FIN-CF-02-SAVE-01 investigation: natural play, no player action. Every eqCash call (company, amount, calling game function and its
// src/<file>:<line>) and every day on which a live company holds a pending eqq / ncq: which game paths leave an amount waiting for the close that an
// export could carry over. Read-only (eqCash / ch11 are wrapped only to log, then call the real function). Run with run.py next to this file.
(()=>{
const mulb=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const f2=x=>(+x).toFixed(2);
const MAP=JSON.parse(process.env.GAME_MAP||'[]');
const src=l=>{let f=null;for(const m of MAP)if(l>=m[1])f=m;return f?'src/'+f[0]+':'+(l-f[1]+1):'line '+l};
const fr=()=>{const st=new Error().stack.split('\n');const l=st[3]||'';const m=l.match(/at (?:Object\.)?([\w$.<>]+)?\s*\(?.*?:(\d+):\d+\)?$/);return m?(m[1]||'anon')+' '+src(+m[2]):'?'};
const e0=eqCash;let LOG=[];eqCash=function(c,x){if(c&&x&&isFinite(x))LOG.push({day:S.day,tk:c.tk,kd:c.kd,mine:mine(c),x,src:fr()});return e0(c,x)};
const n0=ch11;let CH=[];ch11=function(c,why){const D0=c.D,r=n0(c,why);CH.push({day:S.day,tk:c.tk,why,src:fr(),R:D0-c.D,ncq:c.ncq});return r};
for(const seed of [20261016,777,12345]){Math.random=mulb(seed);init(Object.assign(defCfg(),{tut:0,seed}));mdl=null;LOG=[];CH=[];let pe=0,pn=0,peC=0;
  for(let d=0;d<720;d++){step();if(mdl)G.mk(mdl.o.length-1);const p=S.co.filter(c=>!c.dead&&c.eqq),q=S.co.filter(c=>!c.dead&&c.ncq);if(p.length){pe++;peC+=p.length}if(q.length)pn++}
  const by={};for(const l of LOG){const k=l.src+(l.kd?' (financial company)':'')+(l.mine?' (mine)':'');by[k]=by[k]||{n:0,sum:0,ex:[]};by[k].n++;by[k].sum+=l.x;if(by[k].ex.length<3)by[k].ex.push(l.tk+' day '+l.day+' '+f2(l.x))}
  console.log(`seed ${seed}: 720 days | days on which >=1 live company holds a pending eqq: ${pe} (company-days ${peC}) | days with a pending ncq: ${pn} | eqCash calls ${LOG.length}`);
  for(const k in by)console.log(`   eqCash from ${k}: ${by[k].n} call(s), total ${f2(by[k].sum)} (e.g. ${by[k].ex.join('; ')})`);
  const chs={};for(const c of CH){const k=c.src+' "'+c.why+'"';chs[k]=(chs[k]||0)+1}console.log('   ch11 calls: '+(CH.length?Object.entries(chs).map(([k,n])=>k+' x'+n).join('; '):'none'))}
})();
