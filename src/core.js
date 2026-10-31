// ---- core: utils, state, ownership & control, valuation, wallets ----
let _R=Math.random;
const $=id=>document.getElementById(id),rnd=()=>_R(),nz=()=>rnd()-.5;
const esc=s=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const F=n=>{const a=Math.abs(n),s=n<0?"-":"";return s+(a>=1e4?(a/1e4).toFixed(2)+"조":a<10?a.toFixed(2)+"억":Math.round(a).toLocaleString()+"억")};
const W=n=>Math.round(n).toLocaleString()+"원";
const P1=n=>{n=Math.abs(n)<.05?0:n;return(n>=0?"+":"")+n.toFixed(1)+"%"};
const ds=d=>{d=d==null?S.day:d;return ((S&&S.y0||2027)+(d/360|0))+"년 "+((d%360/30|0)+1)+"월 "+(d%30+1)+"일"};
let S,tab="h",sel=-1,pg="",fl=-1,so=0,tf=-1,lim=120,mseg=0,tt=0,AI=null,busy=0,lastAI=0,mdl=null,aiTxt={},aiQ="";
const L=(m,t)=>{S.log.unshift("["+ds()+"] "+m);if(S.log.length>90)S.log.length=90;if(t){toast(m);if(NTE.test(m))note(m,/^(⚠|💥|🚨)/.test(m)?"w":"i");if(S.imp){S.imp.unshift("["+ds()+"] "+m);if(S.imp.length>60)S.imp.length=60}}};
const eco=m=>{L(m);S.eco.unshift("["+ds()+"] "+m);if(S.eco.length>50)S.eco.length=50};
function toast(m){const e=$("ts");if(!e)return;e.textContent=m;e.hidden=false;clearTimeout(tt);tt=setTimeout(()=>e.hidden=true,2600)}
const tkGen=used=>{let t;do t=Array.from({length:4},()=>"ABCDEFGHIJKLMNOPQRSTUVWXYZ"[rnd()*26|0]).join("");while(used.has(t));used.add(t);return t};
function mk(tk,n,i,A,ipo){const kd=i===12?1:i===13?2:0,E=A*(kd?.09+rnd()*.03:ipo?.8:.45+rnd()*.3),cs=A*(kd===2?.25:kd===1?.08:ipo?.3:.04+rnd()*.04);
const c={tk,n,i,kd,A,cs,D:A+cs-E,gw:0,sh:A/2,own:{},bs:{},pos:{},g:kd?.05:ipo?.15:.04,pay:ipo?0:kd?.4:.3,mg:ipo?nz()*3:0,nol:ipo?A*.05:0,sp:0,sb:0,bh:0,pill:0,priv:0,dead:0,off:rnd()*90|0,
ni:A*(kd?.0035:ipo?.005:.016),eqi:0,dr:0,rm:-99,bk:0,ds:0,edge:ipo?(rnd()<.45?.01:-.05):0,cnt:0,vol:kd?.022:ipo?.08:.03+rnd()*.025+(i===1?.01:0),ctl:null,surp:0,cook:0,lit:0,pt:0,fo:0,sweep:1};
c.pni=c.ni;c.p=E*1e4/c.sh*(kd?1.3:ipo?1.6:1.1+nz()*.4);c.tg=c.p;c.hist=[Math.round(c.p)];c.hl=[[c.hist[0],c.hist[0]]];c.dh=c.dl=c.p;return c}
// FIN-CF-03A: a new company has no deal before it was made, so its acquisition ledger covers every row it will have, including the
// rebuilt rows of a new game (S.day - 720 at the earliest): the start is put one day before those.
function addCo(c){c.id=S.co.length;S.co.push(c);S.cd=1;if(c.acd==null)c.acd=S.day-721;if(S.v>=8)v8prep(c);return c}
// ---- ownership: c.own[holderKey]=pct, holderKey: "P" player, "rN" rival, "cK" company K ----
function setOwn(c,k,v){if(v<=1e-6){delete c.own[k];delete c.bs[k];if(k[0]==="c")delete S.co[+k.slice(1)].pos[c.id]}else{c.own[k]=v;if(k[0]==="c")S.co[+k.slice(1)].pos[c.id]=1}S.cd=1;c.oc=1}
const held=c=>{let t=0;for(const k in c.own)t+=c.own[k];return t};
const pub=c=>Math.max(0,100-held(c));
// RT-PREMERGE-FIX-01-R3 — experimental control solver, local-only, NOT APPROVED for main.
let CTLQ=null, CTLS=null;
const isCtlPending=c=>!!c&&!c.dead&&c.ctl==="?";
const root=k=>{if(k[0]!=="c")return k;const h=S.co[+k.slice(1)];return h&&h.ctl==="?"?"?c"+h.id:h&&h.ctl||k};
// RT-PREMERGE-FIX-01-R3-R3B: per-SCC memory cache (never saved). The SCC step below reads only: its members, each member's own map (keys,
// exact stake values, entry order), for a stake held by a company outside the SCC that company's final label in this call (result[h]), the
// members' previous labels (fast path and KEEP) and the policy constants. The key holds all of these (JSON arrays, so different inputs never
// share a key), so a hit equals a fresh computation. Stored results are copies; a hit hands out copies. Autopilot and other side effects run
// after publishing and are never cached. Emptied on a new game (init) and on every restore (v8fix). 128 entries, least recently used dropped.
const CTL_POLICY="R3-R3B:grounded-closure|keep-verified-prev|common-else-AMBIG|nodes5000|members8|product4096";
const CTLC={on:true,max:128,map:new Map(),hit:0,miss:0,evict:0,size(){return this.map.size},clear(){this.map.clear()}};
function ctlAll(founded,opt){
  opt=opt||{};
  const before=S.co.map(c=>c.dead?null:c.ctl),n=S.co.length,edges=Array.from({length:n},()=>[]),reverse=Array.from({length:n},()=>[]);
  for(const target of S.co){if(target.dead)continue;for(const key of Object.keys(target.own))if(key[0]==="c"){
    const h=+key.slice(1);if(h>=0&&h<n&&S.co[h]&&!S.co[h].dead){edges[h].push(target.id);reverse[target.id].push(h)}
  }}
  // Iterative Kosaraju, then an explicit SCC DAG topological sort. No recursion proportional to company count.
  const seen=new Uint8Array(n),order=[];
  for(let st=0;st<n;st++){if(seen[st]||S.co[st].dead)continue;seen[st]=1;const stack=[[st,0]];
    while(stack.length){const e=stack[stack.length-1],v=e[0];if(e[1]<edges[v].length){const w=edges[v][e[1]++];if(!seen[w]){seen[w]=1;stack.push([w,0])}}
    else{order.push(v);stack.pop()}}
  }
  const comp=Array(n).fill(-1),groups=[];
  for(let i=order.length-1;i>=0;i--){const v=order[i];if(comp[v]>=0)continue;const id=groups.length,part=[],stack=[v];comp[v]=id;
    while(stack.length){const u=stack.pop();part.push(u);for(const w of reverse[u])if(comp[w]===-1){comp[w]=id;stack.push(w)}}groups.push(part)
  }
  const dag=groups.map(()=>new Set()),indeg=groups.map(()=>0);
  for(let v=0;v<n;v++)if(comp[v]>=0)for(const w of edges[v])if(comp[w]!==comp[v]&&!dag[comp[v]].has(comp[w])){dag[comp[v]].add(comp[w]);indeg[comp[w]]++}
  const queue=[];for(let i=0;i<groups.length;i++)if(!indeg[i])queue.push(i);
  const result=Array(n).fill(null),Q=Array(n).fill(null),GINFO=[];
  // RT-PREMERGE-FIX-01-R3-R3: every cyclic SCC has its own fixed limit of 5000 DFS nodes (plus <= 8 members, <= 4096 candidate combinations).
  // No limit depends on how many other cycles exist, so unrelated cycles cannot change an SCC's result (R3-R2 divided 50000 by their number).
  const LIMIT=5000;
  const exact=(id,v)=>{result[id]=v;Q[id]={st:v===null?"EXACT_NONE":"EXACT",poss:[v]}};
  const pending=(id,st,poss)=>{result[id]="?";Q[id]={st,poss:poss||"ANY"}};
  const evalOne=(c,local)=>{const g=new Map();for(const [key,pct] of Object.entries(c.own)){
    let r=key;if(key[0]==="c"){const h=+key.slice(1),v=local&&local.has(h)?local.get(h):result[h];r=v==null?key:v}
    g.set(r,(g.get(r)||0)+pct)
  }
    let win=null,max=0,runner=0;for(const [r,pct] of g){if(pct>max){runner=max;max=pct;win=r}else if(pct>runner)runner=pct}
    return max>=20&&max>runner+1e-9&&win!=="c"+c.id?win:null;
  };
  const evalUncertain=(c)=>{const unknown=[];for(const key of Object.keys(c.own))if(key[0]==="c"){
      const h=+key.slice(1);if(Q[h]&&Q[h].st!=="EXACT"&&Q[h].st!=="EXACT_NONE")unknown.push(h)
    }
    const uniq=[...new Set(unknown)];if(!uniq.length)return {label:evalOne(c,null),poss:null};
    let combinations=1,options=[];
    for(const h of uniq){let p=Q[h].poss;if(!Array.isArray(p))p=null;
      // A null possibility means this holding is independently controlled by company h.
      if(!p){combinations=Infinity;break}
      const labels=[...new Set(p.map(v=>v===null?"c"+h:v))];options.push(labels);combinations*=labels.length;
    }
    if(combinations<=64){const got=new Set(),map=new Map();
      function visit(i){if(i===uniq.length){got.add(evalOne(c,map));return}for(const value of options[i]){map.set(uniq[i],value);visit(i+1)}}visit(0);
      if(got.size===1)return {label:[...got][0],poss:null};return {label:"?",poss:[...got]}
    }
    // Sound sufficient dominance test: every unresolved share may be assigned to any opponent.
    let U=0;const assigned=new Map();for(const h of uniq){U+=c.own["c"+h]||0;assigned.set(h,"__unassigned__"+h)}
    const weights=new Map();for(const [key,pct] of Object.entries(c.own)){
      let r=key;if(key[0]==="c"){const h=+key.slice(1);if(assigned.has(h))continue;const v=result[h];r=v==null?key:v}
      weights.set(r,(weights.get(r)||0)+pct)
    }
    let winner=null,max=0,second=0;for(const [r,v] of weights){if(v>max){second=max;max=v;winner=r}else if(v>second)second=v}
    if(max>=20&&max>second+U+1e-9&&winner!=="c"+c.id)return {label:winner,poss:null};
    if(max+U<20)return {label:null,poss:null};
    return {label:"?",poss:"ANY"};
  };
  const grounded=(ids,values)=>{
    const local=new Map(ids.map((id,i)=>[id,values[i]])),cert=new Set(ids.filter(id=>local.get(id)===null));
    for(let round=0;round<ids.length;round++){
      let changed=false;
      for(const id of ids){if(cert.has(id))continue;const label=local.get(id),c=S.co[id];let sw=0,other=0;
        const g=new Map();for(const [key,pct] of Object.entries(c.own)){
          let r=key,h=-1;if(key[0]==="c"){h=+key.slice(1);const v=local.has(h)?local.get(h):result[h];r=v==null?key:v}
          g.set(r,(g.get(r)||0)+pct);
          if(r===label&&(h<0||!local.has(h)||cert.has(h)))sw+=pct;
        }
        for(const [r,v] of g)if(r!==label&&v>other)other=v;
        if(sw>=20&&sw>other+1e-9){cert.add(id);changed=true}
      }
      if(!changed)break;
    }
    return cert.size===ids.length;
  };
  const ctlKey=ids=>{const inS=new Set(ids),parts=[CTL_POLICY,ids.slice()];
    for(const id of ids){const c=S.co[id],e=[];for(const [k,v] of Object.entries(c.own)){let ext=null;if(k[0]==="c"){const h=+k.slice(1);if(!inS.has(h))ext=[result[h]===undefined?"u":result[h]===null?"n":"s",result[h]==null?"":result[h]]}e.push([k,String(v),ext])}
      parts.push([id,c.dead?1:0,before[id]===undefined?["u"]:["v",before[id]],e])}
    return JSON.stringify(parts)};
  while(queue.length){const gi=queue.shift(),ids=groups[gi];for(const dep of dag[gi])if(!--indeg[dep])queue.push(dep);
    const cyclic=ids.length>1||edges[ids[0]].includes(ids[0]);
    if(!cyclic){const id=ids[0],r=evalUncertain(S.co[id]);r.label==="?"?pending(id,"DEP",r.poss):exact(id,r.label);continue}
    // A pending upstream SCC must not be projected as independent null.
    const outsiders=new Set();for(const id of ids)for(const h of reverse[id])if(comp[h]!==gi&&Q[h]&&!["EXACT","EXACT_NONE"].includes(Q[h].st))outsiders.add(h);
    if(outsiders.size){for(const id of ids)pending(id,"DEP","ANY");GINFO.push({members:ids,status:"DEP_UPSTREAM"});continue}
    // R3-R3B: canonical member order (ascending id) before the cache key and the SCC step; the step itself re-sorts by candidate-set size.
    ids.sort((a,b)=>a-b);
    let ck=null;if(CTLC.on){ck=ctlKey(ids);const h=CTLC.map.get(ck);
      if(h){CTLC.map.delete(ck);CTLC.map.set(ck,h);CTLC.hit++;for(const [id,r,st,poss] of h.out){result[id]=r;Q[id]={st,poss:Array.isArray(poss)?poss.slice():poss}}
        GINFO.push(Object.assign({},h.info,{members:h.info.members.slice()}));continue}
      CTLC.miss++}
    const g0=GINFO.length;
    (()=>{
    // R3-R3 fast path: when the previous labels of the whole SCC are complete (no "?", no missing label) and they are a fixed point that passes
    // the grounded closure, they are one of the supported solutions and the policy keeps them - the full search would return the same labels
    // (KEEP), so they are kept at once, even for an SCC over the search limits. Status EXACT_PREV_VERIFIED: uniqueness is not established.
    // Anything else (incomplete, not a fixed point, not grounded, e.g. phantom control) goes to the normal search and never inherits control.
    {const prev=ids.map(id=>before[id]);if(prev.every(v=>v===null||(typeof v==="string"&&v!=="?"))){const local=new Map(ids.map((id,j)=>[id,prev[j]]));
      if(ids.every(id=>evalOne(S.co[id],local)===local.get(id))&&grounded(ids,prev)){for(let j=0;j<ids.length;j++)exact(ids[j],prev[j]);GINFO.push({members:ids,status:"EXACT_PREV_VERIFIED",limit:LIMIT,nodes:0});return}}}
    const owners=new Set([null]);for(const id of ids)for(const key of Object.keys(S.co[id].own)){
      if(key[0]!=="c")owners.add(key);else {const h=+key.slice(1);if(comp[h]===gi)owners.add("c"+h);else owners.add(result[h]||"c"+h)}
    }
    // All reachable labels are a safe SUPerset; no direct-share pruning is used.
    const baseDomain=[...owners].filter(x=>x!=="?");
    // R3-R2: members enumerated by candidate-set size (ascending); ties keep id order, which changes only the order solutions are found, not the
    // node count. The full DFS node count 1 + d1 + d1*d2 + ... is computed before searching and compared with the fixed per-SCC limit.
    ids.sort((a,b)=>(baseDomain.length-(owners.has("c"+a)?1:0))-(baseDomain.length-(owners.has("c"+b)?1:0))||a-b);
    const domains=ids.map(id=>baseDomain.filter(x=>x!=="c"+id));
    const product=domains.reduce((x,d)=>x*d.length,1);let planned=1;for(let i=0,p=1;i<domains.length;i++){p*=domains[i].length;planned+=p}
    if(ids.length>8||product>4096||planned>LIMIT){for(const id of ids)pending(id,"APPROX","ANY");GINFO.push({members:ids,status:"BUDGET_EXCEEDED",product,planned,limit:LIMIT});return}
    const fixed=[];let nodes=0,completed=true;const state=[];
    function visit(i){if(++nodes>planned){completed=false;return}if(i===ids.length){const local=new Map(ids.map((id,j)=>[id,state[j]]));
        if(ids.every((id)=>evalOne(S.co[id],local)===local.get(id))&&grounded(ids,state))fixed.push(state.slice());return;
      }
      for(const v of domains[i]){state[i]=v;visit(i+1);if(!completed)return}
    }
    visit(0);
    if(!completed){for(const id of ids)pending(id,"APPROX","ANY");GINFO.push({members:ids,status:"BUDGET_EXCEEDED",product,planned,limit:LIMIT,nodes});return}
    if(!fixed.length){for(const id of ids)pending(id,"APPROX","ANY");GINFO.push({members:ids,status:"NO_SUPPORTED",product,planned,limit:LIMIT,nodes});return}
    const old=ids.map(id=>before[id]),keep=fixed.find(c=>c.every((v,i)=>v===old[i]));
    for(let i=0;i<ids.length;i++){
      const poss=[...new Set(fixed.map(x=>x[i]))],value=keep?keep[i]:poss.length===1?poss[0]:"?";
      value==="?"?pending(ids[i],"AMBIG",poss):exact(ids[i],value)
    }
    GINFO.push({members:ids,status:keep?"EXACT_MULTI_KEPT":fixed.length===1?"EXACT_UNIQUE":"EXACT_MULTI_AMBIG",product,planned,limit:LIMIT,nodes,solutions:fixed.length});
    })();
    if(ck!==null){const info=GINFO[GINFO.length-1];if(GINFO.length===g0+1&&info){
      CTLC.map.set(ck,{out:ids.map(id=>[id,result[id],Q[id].st,Array.isArray(Q[id].poss)?Q[id].poss.slice():Q[id].poss]),info:Object.assign({},info,{members:info.members.slice()})});
      if(CTLC.map.size>CTLC.max){CTLC.map.delete(CTLC.map.keys().next().value);CTLC.evict++}}}
  }
  // Publish only after every result is computed, never partially during SCC exploration.
  CTLQ=Q;CTLS=GINFO;
  for(const c of S.co)c.ctl=c.dead?null:result[c.id];
  S.cd=0;
  if(!opt.silent&&typeof autop==="function")for(const c of S.co){
    if(c.dead||c.ctl!=="P"||before[c.id]==="P"||c.id===founded)continue;
    if(S.apAll)c.ap=1;if(c.ap)autop(c)
  }
}

const grp=(c,r)=>{let t=0;for(const k in c.own)if(root(k)===r)t+=c.own[k];return t};
const mine=c=>c.ctl==="P"&&!c.dead;
const rootName=r=>!r?"일반 주주":r[0]==="?"?"판정 보류":r==="P"?"나":r[0]==="r"?S.R[+r.slice(1)].n:S.co[+r.slice(1)]?S.co[+r.slice(1)].tk+" 그룹":"불명확한 주주";
const hName=k=>k==="P"?"나":k[0]==="r"?S.R[+k.slice(1)].n:S.co[+k.slice(1)].tk;
function topRival(c,me){let b=0;const g={};for(const k in c.own){const r=root(k);if(r!==me)g[r]=(g[r]||0)+c.own[k]}for(const r in g)if(g[r]>b)b=g[r];return b}
// ---- valuation ----
const mc=c=>c.p*c.sh/1e4;
const hv=(c,pct,d)=>pct/100*(c.priv?pvv(c,d||0):mc(c));
function pfv(c,d){let v=0;for(const t in c.pos){const k=S.co[t],p=k.own["c"+c.id];if(p&&!k.dead)v+=hv(k,p,(d||0)+1)}return v}
function eq(c,d){d=d||0;return c.A+c.cs+c.gw-c.D+(c.fmg||0)+(d>3?0:pfv(c,d))}
const rating=c=>{const e=eq(c);if(e<=0)return 6;const r=c.D/e/(c.kd?9:1);return r<.3?0:r<.6?1:r<1?2:r<1.6?3:r<2.5?4:5};
const val=c=>c.own.P?hv(c,c.own.P):0;
const spv=c=>c.sb-mc(c)*c.sp/100,bd=c=>1-[0,.01,.03,.07,.14,.25,.5][rating(c)],bv=c=>c.bh*bd(c),gbv=()=>S.gb*S.bp/100;
const ncdf=x=>{const t=1/(1+.2316419*Math.abs(x)),p=.3989423*Math.exp(-x*x/2)*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return x>0?1-p:p};
function bs(S0,K,T,s,r,call){const sq=s*Math.sqrt(T),d1=(Math.log(S0/K)+(r+s*s/2)*T)/sq,d2=d1-sq;return call?S0*ncdf(d1)-K*Math.exp(-r*T)*ncdf(d2):K*Math.exp(-r*T)*ncdf(-d2)-S0*ncdf(-d1)}
const opv=o=>{const c=S.co[o.i];return c.dead?0:o.nsh*bs(c.p,o.k,Math.max(1,o.exp-S.day)/360,c.vol*9,S.prime/100,o.t==="C")/1e4};
const cmv=()=>S.cm.reduce((a,m)=>a+m.h*m.p/1e8,0);
function nw(){let v=S.cash-S.loan+gbv()+cmv()+(S.fm||0)+(S.cx?cxv()+ppVal():0)+(S.etf?etfV():0)+(S.ow?owVal():0)+(S.eo?eoVal():0);for(const c of S.co){if(c.dead)continue;if(c.own.P)v+=hv(c,c.own.P);if(c.sp)v+=spv(c);if(c.bh)v+=bv(c);if(c.pa)v+=c.pa*(rating(c)<6?1:.3)}for(const o of S.op)v+=opv(o);return v}
const rnw=id=>{const r=S.R[id];let v=r.cash;for(const c of S.co){const p=c.own["r"+id];if(!c.dead&&p)v+=hv(c,p)}return v};
const alive=()=>S.co.filter(c=>!c.dead);
const tot=i=>{let t=0;for(const c of S.co)if(c.i===i&&!c.dead)t+=c.A;return t};
const share=c=>c.A/(tot(c.i)||1);
const myShare=i=>{let t=0;for(const c of S.co)if(c.i===i&&mine(c))t+=c.A;return t/(tot(i)||1)};
const ref10=h=>{const n=h.length;return n>1&&S.day%10<5?h[n-2]:h[n-1]},chg=c=>c.hn?c.ch:c.hist&&c.hist.length?c.p/ref10(c.hist)-1:0;
const tn=c=>mc(c)>=3000?0:mc(c)>=500?1:2;
// ---- wallets: entity e = "P" (player) or company index ----
const ctlBank=()=>S.co.some(c=>c.kd===1&&mine(c));
const pLine=()=>DIF[S.df].line+(ctlBank()?1.5:0);
const pRoom=()=>Math.max(0,nw()*pLine()-S.loan);
const cLine=c=>c.kd?0:[1.2,1.1,1,.85,.6,.35,0][rating(c)]*(S.prime>8.5?.85:S.prime<6.75?1.15:1);
const cRoom=c=>c.frz||(S.co[c.ln]&&S.co[c.ln].breg)?0:Math.max(0,eq(c)*cLine(c)-c.D);
const eCash=e=>e==="P"?S.cash:S.co[e].cs;
const eRoom=e=>e==="P"?pRoom():cRoom(S.co[e]);
const eAvail=e=>eCash(e)+eRoom(e);
const eKey=e=>e==="P"?"P":"c"+e;
const eName=e=>e==="P"?"나":S.co[e].tk;
function ePay(e,x){if(x>eAvail(e)+1e-9)return 0;if(e==="P"){S.cash-=x;if(S.cash<0){S.loan-=S.cash;S.cash=0}}else{const c=S.co[e];c.cs-=x;if(c.cs<0){c.D-=c.cs;c.cs=0}}return 1}
function teOK(){if(S.te!=="P"){const c=S.co[S.te];if(!c||!mine(c))S.te="P"}return S.te}
// pay holder k the amount x for shares of company c being taken (handles tax + basis)
function payK(c,k,x){const b=c.bs[k]||0,g=x-b;
if(k==="P"){let t=0;if(g>0){const u=Math.min(S.loss,g);S.loss-=u;t=(g-u)*.22}else S.loss-=g;S.cash+=x-t;return x-t}
if(k[0]==="r"){S.R[+k.slice(1)].cash+=x;return x}
const h=S.co[+k.slice(1)];let t=0;if(g>0){const u=Math.min(h.nol,g);h.nol-=u;t=(g-u)*Math.min(.2,ctax(h))}else h.nol-=g;h.cs+=x-t;return x-t}
const rec=(t,c,a,e)=>{S.tx.unshift({d:ds(),day:S.day,ci:c&&c.id!=null?c.id:-1,t,tk:c?c.tk:"-",a,e:e==null?eName(S.te):e});if(S.tx.length>120)S.tx.length=120;if(c)c.cnt++};
const defCfg=()=>({df:1,nr:4,rv:RIV.slice(0,4).map(x=>x.slice()),cash:500,mode:0,goal:0,vol:1,eth:1,tut:1});
function secUpd(){if(!S.dg)return;SEC.forEach((_,i)=>{let a=0,ag=0;for(const c of S.co)if(c.i===i&&!c.dead){a+=c.A;ag+=c.A*c.g}S.cg[i]=a?ag/a:.04;S.dg[i]=.04+(S.d[i]+S.mxd[i])*2})}
function migrate(s){if(!s)return null;if(s.v>=7)return s;if(s.v!==6)return null;s.v=7;
s.cfg={df:s.df,nr:s.R.length,rv:s.R.map(r=>[r.n,r.s]),cash:s.n0,mode:0,goal:0,vol:1,eth:s.cheat,tut:0};
s.mxd=SEC.map(()=>0);s.mx=null;s.dg=SEC.map(()=>.04);s.cg=SEC.map(()=>.04);s.qs={nw:s.nm,div:0,ctl:0};s.qr=null;s.won=0;s.aiP=s.aiP||"rule";return s}
function init(cfg){CTLC.clear();if(typeof cfg==="number")cfg=Object.assign(defCfg(),{df:cfg,cash:DIF[cfg].cash});cfg=cfg||defCfg();const seed=cfg.seed!=null?cfg.seed:(seedOf(cfg.seedT)||newSeed());cfg.seed=seed;_R=mkR(seed,-7);
const df=cfg.df,us=S&&S.us||0,aiP=S&&S.aiP||"rule",used=new Set(),D0=DIF[df];
S={v:13,seed,y0:2027,spl:1,cfg,gn:String(cfg.gn||"").trim().slice(0,12),day:0,spd:1,acc:0,k:0,df,cheat:cfg.eth?1:0,cash:cfg.cash,n0:cfg.cash,loan:0,loss:0,prime:7.5,gdp:3,mood:0,d:SEC.map(()=>0),mxd:SEC.map(()=>0),mx:null,dg:SEC.map(()=>.04),cg:SEC.map(()=>.04),ix:100,te:"P",ceo:-1,heat:0,imm:0,hon:0,over:0,rank:0,nwh:[cfg.cash],nm:cfg.cash,us,aiP,ai:0,
tx:[],eco:[],wl:[],al:[],ach:{},fl:{},st:{ipo:0,del:0,ma:0},fd:[],op:[],ft:{q:0,lx:100},gb:0,bp:100,ev:null,nev:120,tut:cfg.tut?0:99,cd:1,co:[],qs:{nw:cfg.cash,div:0,ctl:0},qr:null,won:0,
cm:CM0.map(([k,n,u,p,v])=>({k,n,u,p,v,f:p,h:0,b:0,hist:[p]})),R:rvList(cfg).map(([n,s],j)=>({n,s,cash:[2500,3500,5000,3000,4000][j%5]*D0.rc})),
log:["새 게임 시작 ("+D0.n+", 라이벌 "+cfg.nr+"명). 순자산을 불려 '월가의 황제'에 도전하세요. 위쪽 '거래 주체' 칩으로 나 대신 내 회사를 앞세워 거래할 수 있어요."]};
const db=dbForNewGame();db.forEach((l,i)=>(l||[]).forEach(([tk,n],k)=>{if(used.has(tk))return;used.add(tk);used.add(n);addCo(mk(tk,n,i,Math.round((isFin(i)?(i===12?4000:3000):9000)*Math.exp(-k*.23)*(.7+rnd()*.6)),0))}));
SEC.forEach((_,i)=>{if(i===HOLD)return;const n0=isFin(i)?10:Math.max(6,15-(db[i]||[]).length);for(let k=0;k<n0;k++){let n;do n=rnd()<.5?AW[rnd()*AW.length|0]+" "+SB[i][rnd()*3|0]:KP[rnd()*KP.length|0]+KS[i][rnd()*3|0];while(used.has(n));used.add(n);addCo(mk(tkGen(used),n,i,Math.round((isFin(i)?1500:2500)*Math.exp(-rnd()*2.2)),0))}});
if(S.R.length)for(const c of S.co)if(rnd()<.5)setOwn(c,"r"+(rnd()*S.R.length|0),1+(rnd()*7|0));
for(let j=0;j<70;j++){const a=S.co[rnd()*S.co.length|0],b=S.co[rnd()*S.co.length|0];if(a===b||b.own["c"+a.id]||a.own["c"+b.id]||mc(b)>mc(a)*.6)continue;
const pct=Math.min(pub(b)-5,6+rnd()*26);if(pct<3)continue;const x=mc(b)*pct/100;if(a.cs<x){a.D+=x-a.cs;a.cs=x}a.cs-=x;setOwn(b,"c"+a.id,pct);b.bs["c"+a.id]=x}
ctyAssign(0);S.cty12=1;if(cfg.scn)scnInit(cfg.scn);if(cfg.spec){S.cash=0;S.n0=1;S.nm=0;S.nwh=[0];S.spd=10;S.tut=99;S.qs.nw=0}
ctlAll();secUpd();v8fix();for(const c of S.co)dscScan(c,1)}

// ---- v8: lenders (c.ln), bonds (c.bond/cpn/bmat), player advances (c.pa), productivity (c.ps/q), autopilot (c.ap) ----
const banks=()=>S.co.filter(c=>c.kd===1&&!c.dead);
function pickBank(ex){const b=banks().filter(x=>x!==ex);if(!b.length)return -1;let t=0;for(const x of b)t+=x.A;let r=rnd()*t;for(const x of b){r-=x.A;if(r<=0)return x.id}return b[0].id}
function v8prep(c){if(c.bond==null){c.bond=0;c.cpn=0;c.bmat=0;c.pa=0;c.frz=0;c.lc=0;c.ps=0;c.q=0;c.ap=0;c.er=null}if(c.ln==null)c.ln=c.kd?-1:pickBank();if(c.woq==null)c.woq=0;if(c.ncq==null)c.ncq=0;if(c.cfd==null)c.cfd=S.day;if(c.eqq==null)c.eqq=0;if(c.isd==null)c.isd=S.day;if(c.acd==null)c.acd=S.day}
function bankFix(){for(const c of S.co){v8prep(c);if(!c.kd&&!c.dead&&(c.ln<0||!S.co[c.ln]||S.co[c.ln].dead)){c.ln=pickBank();c.frz=0}}}
const loanOf=c=>c.kd?0:Math.max(0,c.D-c.bond-(c.pa||0));
const bondSpace=c=>Math.max(0,c.bond-c.bh);
function seedBonds(){for(const c of S.co){if(c.kd||c.dead||c.bond>0||rnd()>.45)continue;const x=Math.min(c.D*(.2+rnd()*.3),Math.max(0,eq(c)));if(x<5)continue;c.bond=x;c.cpn=S.prime+SPR[rating(c)]+1+nz();c.bmat=S.day+360+(rnd()*3240|0)}}
function v8fix(){const old=S.v<11,o12=S.v<12;S.v=12;v9pad();if(old)v11mig();bankFix();if(!S.fs)S.fs=[];if(!S.imp)S.imp=[];if(S.ms==null)S.ms=0;if(S.apAll==null)S.apAll=0;if(!S.bseed){seedBonds();S.bseed=1}
for(const c of S.co)if(c.bh>c.bond){c.bond=c.bh;c.cpn=c.cpn||S.prime+3;c.bmat=c.bmat||S.day+1800}v11prep();v12prep();if(o12)v12mig();
// RT-PREMERGE-FIX-01-R3-R1: pending control ("?") is saved as ctl null plus the list S.ctlp, so a build without R3 reads a plain
// "no controller" instead of a label it would keep forever. Loading puts "?" back before the silent re-check below (same result as before saving).
if(Array.isArray(S.ctlp))for(const id of S.ctlp){const c=S.co[id];if(c&&!c.dead&&c.ctl==null)c.ctl="?"}delete S.ctlp;
Object.defineProperty(S,"toJSON",{value:ctlSaveForm,enumerable:false,configurable:true,writable:true});
CTLQ=null;CTLS=null;CTLC.clear();ctlAll(undefined,{silent:true})}
function ctlSaveForm(){const p=[],co=S.co.map(c=>{if(c.ctl!=="?")return c;p.push(c.id);return Object.assign({},c,{ctl:null})});const o=Object.assign({},S,{co});if(p.length)o.ctlp=p;return o}

// ---- v9: holding-company sector, countries of incorporation, founding rules, CEO pay ----
SEC.push(["지주회사",.01]);KS.push(["홀딩스","지주","인베스트먼트"]);SB.push(["Holdings","Group","Partners"]);
const HOLD=14;
const CTRY=[["한국",{tax:.35,res:12,vm:1,gr:0,fx:.2,pol:0,lab:1.3,reg:0,rg:"아시아"},"적대적 인수가 가장 어렵고 노조 활동이 활발해요"],["미국",{tax:.3,res:-6,vm:1.1,gr:.3,fx:0,pol:0,lab:.8,reg:0,rg:"미주"},"주가 +10% 프리미엄, 대신 인수당하기 쉬워요"],
["싱가포르",{tax:.25,res:4,vm:1,gr:.2,fx:.1,pol:0,lab:.4,reg:0,rg:"아시아"},"세금과 방어력이 무난하고 노사 관계가 안정적이에요"],["케이맨 제도",{tax:.1,res:4,vm:.9,gr:0,fx:0,pol:0,lab:.2,reg:6,rg:"조세회피처"},"주가 10% 할인, 감독원 주목도가 계속 오릅니다"],
["일본",{tax:.3,res:10,vm:.95,gr:-.4,fx:.2,pol:0,lab:.5,reg:0,rg:"아시아"},"상호 지분이 많아 인수가 어렵고 성장이 느려요"],["중국",{tax:.25,res:15,vm:.85,gr:1.2,fx:.3,pol:1.2,lab:.3,reg:2,rg:"아시아"},"성장이 빠르지만 정부 개입과 국유화 위험이 커요"],
["대만",{tax:.2,res:6,vm:1,gr:.6,fx:.2,pol:.2,lab:.5,reg:0,rg:"아시아"},"반도체 생태계, 낮은 세금"],["홍콩",{tax:.165,res:2,vm:.9,gr:.2,fx:.1,pol:.4,lab:.3,reg:1,rg:"아시아"},"세금이 낮고 자유롭지만 규제 변화 위험이 있어요"],
["인도",{tax:.25,res:8,vm:1.15,gr:1.5,fx:.4,pol:.3,lab:1.2,reg:1,rg:"아시아"},"고성장·고밸류, 규제와 환율 변동이 커요"],["베트남",{tax:.2,res:6,vm:.9,gr:1.3,fx:.4,pol:.4,lab:.6,reg:1,rg:"아시아"},"제조업 이전으로 빠르게 성장해요"],
["인도네시아",{tax:.22,res:6,vm:.9,gr:1,fx:.5,pol:.6,lab:.8,reg:1,rg:"아시아"},"자원 부국, 환율 변동이 커요"],["호주",{tax:.3,res:0,vm:1,gr:.3,fx:.3,pol:0,lab:.8,reg:0,rg:"아시아"},"광업·자원 강국, 무난한 규칙"],
["캐나다",{tax:.265,res:0,vm:1,gr:.2,fx:.2,pol:0,lab:.8,reg:0,rg:"미주"},"자원·금융 중심, 안정적이에요"],["멕시코",{tax:.3,res:4,vm:.85,gr:.5,fx:.5,pol:.5,lab:.9,reg:1,rg:"미주"},"생산 기지 이전 수혜, 치안·환율 위험"],
["브라질",{tax:.34,res:6,vm:.8,gr:.5,fx:.7,pol:.8,lab:1.1,reg:1,rg:"미주"},"원자재 강국, 높은 금리와 환율 변동"],["아르헨티나",{tax:.35,res:6,vm:.6,gr:.3,fx:1,pol:2,lab:1.5,reg:1,rg:"미주"},"물가 폭등과 국유화 위험, 대신 매우 싸요"],
["영국",{tax:.25,res:-4,vm:1,gr:.1,fx:.2,pol:0,lab:.8,reg:0,rg:"유럽"},"금융 중심지, 인수가 쉬운 편이에요"],["독일",{tax:.3,res:8,vm:.95,gr:.1,fx:.1,pol:0,lab:1,reg:0,rg:"유럽"},"제조 강국, 노동자 경영 참여로 방어력이 높아요"],
["프랑스",{tax:.25,res:8,vm:1,gr:.1,fx:.1,pol:.2,lab:1.6,reg:0,rg:"유럽"},"명품 강국, 파업이 잦아요"],["스위스",{tax:.15,res:10,vm:1.1,gr:.1,fx:.05,pol:0,lab:.3,reg:0,rg:"유럽"},"낮은 세금과 안정된 통화, 밸류가 비싸요"],
["네덜란드",{tax:.25,res:12,vm:1.05,gr:.1,fx:.1,pol:0,lab:.6,reg:0,rg:"유럽"},"지주회사 천국, 재단 구조로 방어가 강해요"],["아일랜드",{tax:.125,res:0,vm:1,gr:.4,fx:.1,pol:0,lab:.5,reg:2,rg:"조세회피처"},"법인세 12.5%, 감독원 주목도가 조금 올라요"],
["룩셈부르크",{tax:.17,res:4,vm:1,gr:.1,fx:.1,pol:0,lab:.3,reg:2,rg:"조세회피처"},"지주회사 구조에 유리해요"],["스웨덴",{tax:.206,res:6,vm:1.05,gr:.2,fx:.2,pol:0,lab:.9,reg:0,rg:"유럽"},"차등의결권, 가문이 지배하는 기업이 많아요"],
["덴마크",{tax:.22,res:8,vm:1.05,gr:.2,fx:.05,pol:0,lab:.7,reg:0,rg:"유럽"},"해운·제약 강국, 재단 소유가 많아 인수가 어려워요"],["스페인",{tax:.25,res:4,vm:.9,gr:.3,fx:.1,pol:.1,lab:1.1,reg:0,rg:"유럽"},"관광·은행, 경기에 민감해요"],
["벨기에",{tax:.25,res:6,vm:1,gr:.1,fx:.1,pol:0,lab:1,reg:0,rg:"유럽"},"주류·화학, 지주회사 문화"],["이스라엘",{tax:.23,res:2,vm:1.1,gr:.8,fx:.3,pol:.5,lab:.4,reg:0,rg:"중동"},"기술 스타트업 강국, 지정학 위험"],
["아랍에미리트",{tax:.09,res:6,vm:1,gr:.7,fx:0,pol:.3,lab:.1,reg:1,rg:"중동"},"법인세 9%, 노조가 거의 없어요"],["사우디아라비아",{tax:.2,res:12,vm:.95,gr:.6,fx:0,pol:.6,lab:.1,reg:1,rg:"중동"},"오일머니, 국가 주도 경제"]];
const ctax=c=>c.cty!=null?CTRY[c.cty][1].tax:.35,cres=c=>c.cty!=null?CTRY[c.cty][1].res:0,cvm=c=>c.cty!=null?CTRY[c.cty][1].vm:1;
const fMin=s=>s===12||s===13?1000:s===HOLD?50:100;
const fCost=s=>s===HOLD?5:s===12||s===13?50:10;
const fdLeft=()=>{const a=(S.fd||[]).filter(d=>S.day-d<720),b=a.filter(d=>S.day-d<360);return Math.max(0,Math.min(3-a.length,2-b.length))};
const gName=()=>S.gn?S.gn+" 그룹":"내 그룹";
function v9pad(){for(const k of ["d","mxd","dg","cg"]){if(!S[k])continue;while(S[k].length<SEC.length)S[k].push(k==="dg"||k==="cg"?.04:0)}if(!S.fd)S.fd=[];if(S.gn==null)S.gn=""}
// private companies: book value plus a 10% premium on operating assets (none while a new company is still seasoning)
function pvv(c,d){const e=eq(c,d);return e>0?e+(c.sz>S.day?0:Math.min(c.A,e)*.1):0}
// IPO price from earnings and book value (0.8x ~ 1.5x book), adjusted for country of incorporation
function ipoPx(c){const bps=Math.max(eq(c),1)*1e4/c.sh,eps=c.ni*4e4/c.sh,fv=eps>0?.7*eps*11+.3*bps:bps*.7;return Math.max(60,Math.min(bps*1.5,Math.max(bps*.8,fv))*cvm(c))}
// CEO compensation (manual: salary from adjusted capitalization excluding cash and investments, min 0.2M;
// year-end bonus 1.5/3/5x for consecutive >15% earnings growth while CEO, doubled at 51% control, at least 1x at 51%)
function ceoSal(c){const x=c.kd?0:c.cs+pfv(c),adj=(c.priv?eq(c):mc(c))-x;return Math.max(1,adj*.003)}
function ceoCo(){const c=S.co[S.ceo];return S.ceo>=0&&c&&!c.dead&&mine(c)?c:null}
function ceoDay(){const c=ceoCo();return c?ceoSal(c)/360*.6:0}
function ceoPay(){const c=ceoCo();if(!c)return 0;const s=ceoSal(c)/360;c.cs-=s;if(c.cs<0){c.D-=c.cs;c.cs=0}return s*.6}
function ceoBonus(){for(const c of S.co){if(c.dead)continue;if(c.id===S.ceo){(c.yh=c.yh||[]).push(c.yni||0);if(c.yh.length>5)c.yh.shift()}c.yni=0}
const c=ceoCo();if(!c)return;const g51=grp(c,"P")>=51,h=c.yh||[],yrs=Math.min(h.length-1,Math.floor((S.day-(S.ceoD||0))/360));let k=0;
for(let j=h.length-1;j>0&&k<yrs;j--){if(h[j-1]>0&&h[j]>h[j-1]*1.15)k++;else break}
let m=k>=3?5:k===2?3:k===1?1.5:0;if(g51)m=Math.max(1,m*2);if(!m)return;const b=ceoSal(c)*m;c.cs-=b;if(c.cs<0){c.D-=c.cs;c.cs=0}S.cash+=b*.6;
L("💼 "+c.tk+" CEO 연말 보너스 "+F(b)+" (연봉의 "+m+"배"+(g51?", 51% 이상 지배라 2배":"")+") · 세후 "+F(b*.6),1)}

// ---- v11: 33 sectors (30 industries + bank, insurance, holding), sector drivers modelled on the original's Appendix D ----
// new industries are appended after HOLD (14) so old saves keep their sector indices
[["화학",.038],["조선·해운",.034],["방산·우주",.042],["2차전지·친환경",.046],["유통·이커머스",.033],["식음료",.036],["패션·화장품",.042],["의료기기·헬스케어",.047],["호텔·레저",.038],
["전력·가스",.032],["자동차부품",.035],["기계·장비",.038],["인터넷·플랫폼",.05],["전자·가전",.041],["광업·귀금속",.04],["농업·비료",.035],["주류·담배",.044],["육운·철도",.034]].forEach(x=>SEC.push(x));
KS.push(["케미칼","화학","소재"],["중공업","조선","해운"],["에어로","방산","스페이스"],["에너지솔루션","배터리","그린"],["리테일","마트","커머스"],["식품","푸드","음료"],["패션","뷰티","코스메틱"],["메디칼","헬스케어","의료"],["호텔","리조트","레저"],
["전력","가스","에너지"],["모비스","오토파츠","부품"],["기계","정밀","엔지니어링"],["플랫폼","닷컴","인터넷"],["전자","일렉트릭","디스플레이"],["광업","골드","마이닝"],["농산","비료","팜"],["주류","양조","담배"],["운수","철도","익스프레스"]);
SB.push(["Chemical","Polymer","Materials"],["Heavy","Marine","Shipping"],["Defense","Aerospace","Space"],["Battery","Cell","Green"],["Retail","Mart","Commerce"],["Foods","Beverage","Kitchen"],["Fashion","Beauty","Apparel"],["Medical","Health","Care"],["Hotels","Resorts","Leisure"],
["Power","Gas","Utility"],["Auto Parts","Components","Drive"],["Machinery","Industries","Robotics"],["Online","Digital","Web"],["Electronics","Display","Devices"],["Mining","Gold","Metals"],["Agri","Farms","Fertilizer"],["Brewing","Spirits","Tobacco"],["Rail","Express","Transport"]);
// sector groups (like the original's group tickers on the quote bar)
const GRP=[["TECH","기술"],["CONS","소비"],["INDU","산업재"],["MATL","소재·에너지"],["HLTH","헬스케어"],["FINL","금융"],["UTIL","통신·유틸"]];
// per sector: grp, vol (1-10 like the original), typical demand growth, sensitivities (gdp, oil, rate, gold, btc), links [[sector,weight]], asset turnover, gross margin, spending label, market beta
const SX=[
{g:0,v:6,dg:.12,gdp:.4,oil:0,rate:-.4,to:.8,gm:.7,rd:"R&D",b:1.2},
{g:0,v:9,dg:.10,gdp:.8,oil:0,rate:-.3,to:.7,gm:.5,rd:"R&D",b:1.5},
{g:1,v:5,dg:.04,gdp:1,oil:-.6,rate:-.3,to:1,gm:.2,rd:"R&D",b:1.1},
{g:5,v:10,dg:.08,gdp:.8,oil:0,rate:-.2,btc:.3,to:.25,gm:.6,rd:"광고·마케팅",b:1.4},
{g:4,v:7,dg:.10,gdp:.1,oil:0,rate:-.2,to:.5,gm:.65,rd:"R&D",b:.8},
{g:3,v:6,dg:.05,gdp:.5,oil:1,rate:0,to:.9,gm:.3,rd:"생산성 투자",b:.9},
{g:1,v:2,dg:.05,gdp:.3,oil:-.1,rate:0,to:1.3,gm:.4,rd:"광고·마케팅",b:.7},
{g:1,v:6,dg:.08,gdp:.3,oil:0,rate:-.2,to:.8,gm:.55,rd:"광고·마케팅",b:1.1},
{g:2,v:7,dg:.06,gdp:.9,oil:-1,rate:0,to:.9,gm:.2,rd:"생산성 투자",b:1.1},
{g:2,v:8,dg:.05,gdp:.9,oil:0,rate:-1.2,to:.7,gm:.15,rd:"생산성 투자",b:1.2},
{g:6,v:3,dg:.04,gdp:.2,oil:0,rate:-.3,to:.5,gm:.55,rd:"광고·마케팅",b:.6},
{g:3,v:5,dg:.03,gdp:1,oil:0,rate:0,lk:[[2,.3],[9,.3]],to:.9,gm:.15,rd:"R&D",b:1.1},
{g:5,v:4,dg:0,gdp:.5,oil:0,rate:.4,to:.08,gm:.6,rd:"생산성 투자",b:1},
{g:5,v:3,dg:0,gdp:.3,oil:0,rate:.2,to:.25,gm:.4,rd:"생산성 투자",b:.8},
{g:5,v:3,dg:0,gdp:.3,oil:0,rate:0,to:.05,gm:.9,rd:"생산성 투자",b:.9},
{g:3,v:6,dg:.05,gdp:.8,oil:-.4,rate:0,to:.9,gm:.2,rd:"R&D",b:1.1},
{g:2,v:8,dg:.04,gdp:.7,oil:.2,rate:0,lk:[[5,.3]],to:.7,gm:.12,rd:"생산성 투자",b:1.3},
{g:2,v:3,dg:.07,gdp:.1,oil:0,rate:0,lk:[[8,.2]],to:.7,gm:.2,rd:"R&D",b:.7},
{g:3,v:9,dg:.15,gdp:.5,oil:.4,rate:-.6,to:.7,gm:.2,rd:"R&D",b:1.5},
{g:1,v:4,dg:.06,gdp:.6,oil:-.1,rate:-.2,to:1.8,gm:.28,rd:"광고·마케팅",b:.9},
{g:1,v:1,dg:.04,gdp:.1,oil:-.2,rate:0,to:1.2,gm:.35,rd:"광고·마케팅",b:.5},
{g:1,v:4,dg:.05,gdp:.6,oil:0,rate:0,to:1.1,gm:.55,rd:"광고·마케팅",b:.9},
{g:4,v:3,dg:.09,gdp:.2,oil:0,rate:-.2,to:.8,gm:.6,rd:"R&D",b:.8},
{g:1,v:6,dg:.06,gdp:1,oil:-.3,rate:-.2,to:.5,gm:.45,rd:"광고·마케팅",b:1.2},
{g:6,v:2,dg:.03,gdp:.2,oil:-.5,rate:-.8,to:.4,gm:.3,rd:"생산성 투자",b:.5},
{g:2,v:4,dg:.05,gdp:.8,oil:-.2,rate:0,lk:[[2,.6]],to:1.1,gm:.17,rd:"R&D",b:1},
{g:2,v:7,dg:.05,gdp:1.2,oil:0,rate:-.2,lk:[[1,.2],[16,.2]],to:.9,gm:.25,rd:"R&D",b:1.2},
{g:0,v:9,dg:.15,gdp:.4,oil:0,rate:-.6,to:.7,gm:.6,rd:"광고·마케팅",b:1.4},
{g:0,v:6,dg:.07,gdp:.7,oil:0,rate:-.2,lk:[[1,.2]],to:1,gm:.25,rd:"R&D",b:1.1},
{g:3,v:9,dg:.03,gdp:.6,oil:0,rate:0,gold:1,to:.5,gm:.35,rd:"생산성 투자",b:1},
{g:3,v:3,dg:.05,gdp:.2,oil:-.5,rate:0,to:.8,gm:.25,rd:"생산성 투자",b:.6},
{g:1,v:1,dg:.02,gdp:0,oil:0,rate:0,to:.7,gm:.55,rd:"광고·마케팅",b:.4},
{g:2,v:3,dg:.03,gdp:.7,oil:-.4,rate:0,to:.6,gm:.3,rd:"생산성 투자",b:.8}];
const isFin=i=>i===12||i===13,isInd=i=>i!==12&&i!==13&&i!==HOLD;
const INDS=SEC.map((_,i)=>i).filter(isInd),PICKS=SEC.map((_,i)=>i).filter(i=>i!==HOLD);
const grpOf=i=>(SX[i]||SX[0]).g;
// parody names for the new industries (and better homes for a few existing ones in new games)
const DBX=["DOWC Dowe Chemical|LGHW 엘지화확|BASP Basfe|DUPX DuPonte|LTCH 롯대케미칼|KPCX 금효석유화학|LYBX LyondellBasel|SHNX Shin-Etsue",
"HDKS 에이치디한국조선|SSHI 삼송중공업|HWOC 한와오숀|PNOC 팬오숀|MTSH Mitsubishe Heavy|ZIMX Zimm Shipping|HMMX 에이치엠해운",
"LMTX Lockheel|RTXN Raytheone|NOCX Northrop Grummen|GDXX General Dynamix|HWAR 한와에어로|LIGX 엘아이쥐넥스원|KAIX 한국항공우줘|SPCX SpaceEx",
"LGES 엘쥐에너지솔루숀|SDIX 삼송에스디아이|SKON 에스크온|ECPB 에코프로빔|POFM 포스크퓨처엠|CATL CATLL|ENPH Enphaze|FSLR First Solarr",
"WMTX Walmark|COSW Costcow|KUKG 쿠콩|LOTX 롯대쇼핑|EMAR 이마크|SHSG 신세게|TGTX Targett|BABX Alibabba",
"KOKX Coca-Colo|PEPS PepsiCola|OTGI 오뚝이식품|NSHM 농삼|NESX Nestlay|CJCJ 씨제이제일젤당|ORNX 오리언|KHCX Kraft Heinzz",
"NKEX Nikee|LVMX LVMHH|AMRP 아모래퍼시픽|LGHH 엘쥐생활건강|ELXX Estée Lauda|FNFX 에프엔프|ADDX Adidaz",
"MDTX Medtronix|ISRG Intuitive Surgicle|UNHX UnitedHealth Grupp|ABTX Abbot Labz|SYKX Strykar|OSTM 오스톰임플란트|CLSX 클래시즈",
"MARX Marriot|HLTX Hilten|BKNG Booking Holdingz|AIRX Airbnd|HNTR 하나투얼|KWLD 강원랜트|PRDX 파라다이즈|HTLS 호텔실라",
"KEPX 한국전럭|KOGS 한국가스공샤|DUKX Duke Energee|SOCX Southern Companie|EXCX Exelonn|NGGX National Gridd",
"HMOB 현다이모비스|HNSY 한온시스탬|DNSO Densoe|BOSX Boschh|MGAX Magna Internationale|APTV Aptivv|HKTR 한국타이야",
"CATP Caterpiller|DEER John Deer|DSBC 두산밥켓|HDIC 에이치디인프라코어|ABBX ABBB Robotics|FANX Fanuk|SMCX SMC Pneumatix",
"NAVR 네이비어|KKAO 카카우|METX Metaverse Platforms|SHOP Shopifly|BIDU Baidoo|MELI MercadoLibra|TCHX Tencente|PINX Pinterestt",
"LGEX 엘쥐전자|SNYX Sonyy|PNSX Panasonik|LGDP 엘쥐디스플레이|SSEM 삼송전기|XMIX Xiaomee",
"FRPT Freeporte Copper|NEMX Newmontt|BHPX BHP Billitan|RIOX Rio Tintoe|BARX Barrick Goldd|VALX Valee|KZNC 고려아엔",
"NTRX Nutrienn|MOSX Mosaik|ADMX Archer Daniel|CTVA Cortevva|BUNX Bungee|NHFX 남해화확",
"BUDX AB InBevv|DEOX Diageoh|PMIX Philip Morriz|KTGX 케이티엔쥐|HTJR 하이뜨진로|LTCS 롯대칠성|BTIX British Americana Tobacco",
"UNPX Union Pacifick|CSXT CSX Transportt|CNRX Canadian Nationall|JBHT JB Huntt|ODFL Old Dominionn|HJSH 한짐"].map(pl);
// sector-level macro regimes reach the new industries too
{const X={pan:{23:-.03,22:.015,27:.01,19:.006},semi:{28:.008,26:.006},re:{11:-.008,26:-.004},en:{15:-.008,24:-.01,18:.012,30:-.006}};for(const e of MXE)if(X[e.id])Object.assign(e.d,X[e.id])}
function dbForNewGame(){const moved=new Set(DBX.flat().map(x=>x[0])),db=DB.map(l=>l.filter(x=>!moved.has(x[0])));db[HOLD]=[];DBX.forEach((l,k)=>db[15+k]=l);return db}
const PSN=i=>(SX[i]||SX[0]).rd;
// old saves: open the new industries with a few listings each
function v11mig(){const used=new Set();for(const c of S.co){used.add(c.tk);used.add(c.n)}let k=0;
DBX.forEach((l,j)=>{const i=15+j;let m=0;for(const [tk,n] of l){if(m>=4)break;if(used.has(tk)||used.has(n))continue;used.add(tk);used.add(n);addCo(mk(tk,n,i,Math.round(9000*Math.exp(-m*.35)*(.6+rnd()*.5)),0));m++;k++}
while(m<4){let n;do n=KP[rnd()*KP.length|0]+KS[i][rnd()*3|0];while(used.has(n));used.add(n);addCo(mk(tkGen(used),n,i,Math.round(2000*Math.exp(-rnd()*1.5)),0));m++;k++}});
ctlAll();L("📢 거래소에 새 업종 18개가 열렸습니다 (화학, 조선·해운, 방산·우주, 2차전지·친환경 등). "+k+"개 회사가 새로 상장됐어요.",1)}

function rvList(cfg){if(cfg.spec)return RIV.filter(x=>PERS[x[1]]).concat(RIV.filter(x=>["raid","act","idx"].includes(x[1])).slice(0,3)).map(x=>x.slice());const a=cfg.rv.slice(0,cfg.nr).map(x=>x.slice());
if(cfg.df>=4){const m={idx:"qg",val:"vg",mom:"gg",act:"ag",raid:"vg"};a.forEach((x,j)=>{if(j%2===0&&m[x[1]])x[1]=m[x[1]]})}return a}
function v12mig(){for(const c of S.co)dscScan(c,1);L("🆕 v12 업데이트: 원자재·주식·코인 선물, 코인 생태계, 옵션 쓰기, 금리 스왑, ETF, 30개국, 블랙 스완, 물가·중앙은행·금리 곡선, 업종별 사업 모델, 은행 BIS, 회사 사건 30종, AI 코치, 리서치, 명령어, 챌린지가 추가됐어요. 메뉴를 열어 보세요.",1)}