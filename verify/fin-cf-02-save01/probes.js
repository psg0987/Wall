// RT-FIN-CF-02-SAVE-01 investigation (2026-10-24, read-only). Run with run.py next to this file.
// (1) Does the game draw from Math.random after init? (2) How many draws of the game's own stream (_R) does a restore take (export vs full save)?
// (3) Option E cost: how much bigger would an export be if the quarter rows fq were kept?
(async()=>{
const mulb=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
let nM=0;const base=mulb(20261016);Math.random=()=>{nM++;return base()};
init(Object.assign(defCfg(),{tut:0,seed:20261016}));mdl=null;const afterInit=nM;
for(let d=0;d<200;d++){step();if(mdl)G.mk(mdl.o.length-1)}
console.log(`[P1] Math.random calls: during init ${afterInit}, during 200 days of play ${nM-afterInit}`);
const count=async strip=>{const txt=await packS(strip),s=await loadStr(txt);const keep=S;S=s;let n=0;const r0=_R;_R=function(){n++;return r0()};try{v8fix()}finally{_R=r0}const out={n,len:txt.length};S=keep;return out};
const ex=await count(1),fu=await count(0);
console.log(`[P2] draws from the game stream during v8fix: export restore ${ex.n} (bfill and qBack rebuild histories), full restore ${fu.n} | export code ${ex.len} chars, full save ${fu.len} chars (day ${S.day})`);
const strip=new Set(['hr','hv','fq','IX','hm','w10','wd']),keepFq=new Set(['hr','hv','IX','hm','w10','wd']);
const js=set=>JSON.stringify(S,(k,v)=>set.has(k)?undefined:v);
const pack=async j=>{if(typeof CompressionStream==='undefined')return null;const cs=new CompressionStream('deflate');const w=cs.writable.getWriter();w.write(new TextEncoder().encode(j));w.close();const b=new Uint8Array(await new Response(cs.readable).arrayBuffer());return Math.ceil(b.length/3)*4};
for(const D of [200,720]){while(S.day<D){step();if(mdl)G.mk(mdl.o.length-1)}
  const a=js(strip),b=js(keepFq),pa=await pack(a),pb=await pack(b),real=(await packS(1)).length;
  console.log(`[P3] day ${S.day}: export JSON ${a.length} chars, with fq kept ${b.length} (+${((b.length/a.length-1)*100).toFixed(1)}%) | deflate+base64 ${pa} -> ${pb} (+${((pb/pa-1)*100).toFixed(1)}%) | the real export code ${real} chars`)}
})().catch(e=>console.log('ERR',e&&e.stack||e));
