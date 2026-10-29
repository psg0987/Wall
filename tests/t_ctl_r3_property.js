// Independent combinatorial check of small cyclic structures; experimental snapshot only.
let errs=0,fails=0,checked=0,caseNo=0,details=[];
const pre=(v,n)=>{if(!v){errs++;console.log('ERR '+n)}};
const ok=(v,n)=>{if(!v){fails++;if(details.length<8)details.push(n)}};
const mul=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const isolate=c=>{for(const k of Object.keys(c.own))setOwn(c,k,0);for(const t of Object.keys(c.pos))setOwn(S.co[+t],'c'+c.id,0)};
function expected(cs){
 const ids=cs.map(c=>c.id),poss=cs.map((c,i)=>[null,'P','r1',...ids.filter(v=>v!==c.id).map(v=>'c'+v)]),got=[];
 const state=new Map();
 function ev(c){const g={};for(const [k,v] of Object.entries(c.own)){let r=k;if(k[0]==='c'&&state.has(+k.slice(1))){r=state.get(+k.slice(1))||k}g[r]=(g[r]||0)+v}
   let max=0,runner=0,winner=null;for(const [r,v] of Object.entries(g)){if(v>max){runner=max;max=v;winner=r}else if(v>runner)runner=v}return max>=20&&max>runner+1e-9&&winner!=='c'+c.id?winner:null;
 }
 function ground(){const g=new Set(ids.filter(id=>state.get(id)===null));for(let pass=0;pass<ids.length;pass++){
 let grow=false;for(const c of cs){if(g.has(c.id))continue;const target=state.get(c.id),parts={},support=[];let sw=0;
 for(const [k,v] of Object.entries(c.own)){const h=k[0]==='c'?+k.slice(1):-1,r=state.has(h)?state.get(h)||k:k;parts[r]=(parts[r]||0)+v;if(r===target&&(!state.has(h)||g.has(h)))sw+=v}
 let maxOther=0;for(const [r,v] of Object.entries(parts))if(r!==target)maxOther=Math.max(maxOther,v);
 if(sw>=20&&sw>maxOther+1e-9){g.add(c.id);grow=true}}
 if(!grow)break}
 return g.size===ids.length}
 function go(i){if(i===cs.length){if(cs.every(c=>ev(c)===state.get(c.id))&&ground())got.push(ids.map(id=>state.get(id)));return}for(const v of poss[i]){state.set(ids[i],v);go(i+1)}}go(0);return got;
}
for(let j=0;j<60;j++){
 const seed=12000+j,ran=mul(seed);Math.random=mul(seed);init(Object.assign(defCfg(),{tut:0,seed}));mdl=null;S.spd=0;S.apAll=0;pg='';
 const n=2+(j%2),L=S.co.filter(c=>!c.dead&&!c.priv&&!c.kd&&c.i!==HOLD&&c.bk===0&&c.ctl!=='P');const cs=[L[40],L[200],L[360]].slice(0,n);pre(cs.every(Boolean),'company fixture');cs.forEach(isolate);
 for(let i=0;i<n;i++){const c=cs[i],next=cs[(i+1)%n];let x=[25,30,40,50,60][Math.floor(ran()*5)],pp=[0,15,25,35][Math.floor(ran()*4)],rv=[0,15,25,30][Math.floor(ran()*4)];
   if(pp+rv+x>95)rv=0;if(pp+rv+x>95)pp=0;
   setOwn(c,'c'+next.id,x);if(pp)setOwn(c,'P',pp);if(rv)setOwn(c,'r1',rv);
 }
 const fps=expected(cs);cs.forEach(c=>c.ctl=null);ctlAll();const actual=cs.map(c=>c.ctl);
 if(!fps.length){ok(cs.every(c=>c.ctl==='?'),'C'+j+' no supported solutions but granted control '+JSON.stringify(actual));continue}
 const prev=fps.find(a=>a.every(v=>v===null));
 if(prev){ok(actual.every(v=>v===null),'C'+j+' valid prior null solution not preserved '+JSON.stringify(actual));continue}
 if(fps.length===1){ok(actual.every((v,i)=>v===fps[0][i]),'C'+j+' unique supported mismatch '+JSON.stringify({actual,fps}));continue}
 const common=actual.map((_,i)=>fps.every(f=>f[i]===fps[0][i])?fps[0][i]:'?');
 ok(actual.every((v,i)=>v===common[i]),'C'+j+' multi supported common mismatch '+JSON.stringify({actual,common,fps}));
 checked++;
}
console.log('independent randomized cyclic fixtures 60, multi ambiguous checks '+checked+', errs '+errs+', fails '+fails);
for(const d of details)console.log('FAIL '+d);
if(errs||fails)process.exitCode=1;
