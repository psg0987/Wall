// ---- simulation: earnings, prices, ecosystem, rivals, commodities, regulator, events ----
function payDiv(c,dv){for(const k in c.own){const a=dv*c.own[k]/100;if(a<=0)continue;
if(k==="P"){S.cash+=a*.6;if(S.qs)S.qs.div+=a*.6}else if(k[0]==="r"){S.R[+k.slice(1)].cash+=a}else{const h=S.co[+k.slice(1)],p=c.own[k],t=h.i===HOLD||p>=80?0:p>=20?.05:.1;h.cs+=a*(1-t);if(p<20)h.dr+=a*(1-t)}}}
// asset impairment of a chronically distressed company: a loss of this quarter, reported like any other (docs/MODEL.md)
function impair(c,wd){c.ni-=wd;c.yni=(c.yni||0)-wd;c.er.imp=(c.er.imp||0)+wd;c.er.ni=c.ni;if(c.eh&&c.eh.length)c.eh[c.eh.length-1]=Math.round(c.ni*1e5/c.sh)/10;
for(const k in c.own)if(k[0]==="c"&&c.own[k]>=20)S.co[+k.slice(1)].eqi-=wd*c.own[k]/100;if(c.own.P||mine(c))L(c.tk+" 자산 손상차손 "+F(wd)+" (순이익에 반영)")}
// bank loan write-off (RT-BANK-001): ch11x takes 30% of a defaulted borrower's loan off the bank's assets on the day of the
// default and queues the same amount in woq. The bank's first close after that reports it once, after tax like an
// impairment: tax, loss carryforward and dividends were already computed and do not change (docs/MODEL.md). The default day also
// re-values the bank's target price (end of ch11x, epsV): the asset cut is in its book equity and the waiting loss in its valuation EPS.
function woBook(c){const w=c.woq||0;if(!(w>0))return;c.woq=0;c.ni-=w;c.yni=(c.yni||0)-w;c.er.wo=(c.er.wo||0)+w;c.er.ni=c.ni;if(c.eh&&c.eh.length)c.eh[c.eh.length-1]=Math.round(c.ni*1e5/c.sh)/10;
for(const k in c.own)if(k[0]==="c"&&c.own[k]>=20)S.co[+k.slice(1)].eqi-=w*c.own[k]/100;if(c.own.P||mine(c))L(c.tk+" 대손상각비 "+F(w)+" (순이익에 반영)")}
function earn(c){const r=rating(c),rt=(S.prime+SPR[r]*sprM())/100;let op;
if(c.kd===1)op=bankOp(c);else if(c.kd)op=c.A*(.0035+(S.prime-7.5)*.0002+c.mg*.0004+(c.kd===2?S.mood*.004:0)-Math.max(0,-S.mood-.15)*.012)*(1+eShock(c,.8));
else op=c.A*(SEC[c.i][1]+(S.dg[c.i]-S.cg[c.i])*.5+c.mg*.003+(c.g-.04)*.03+(share(c)>.5?.004:0)+c.edge)*(1+eShock(c,.6));
if(!c.kd){op-=c.A*(c.ps||0)*.0025;op+=c.A*(c.q||0)}if(c.ru>0){if(op>0)op*=1-c.ru*.08;c.ru--}if(c.kd!==1)op=opX(c,op);else{if(c.swq){op+=c.swq;c.swq=0}if(c.etfq){op+=c.etfq;c.etfq=0}if(c.sbx){op-=c.sbx;c.sbx=0}}
if(c.bond>c.D)c.bond=c.D;if((c.pa||0)>c.D-c.bond)c.pa=Math.max(0,c.D-c.bond);const bl=c.kd?0:Math.max(0,c.D-c.bond-(c.pa||0)),it=c.kd?0:bl*rt/4+c.bond*(c.cpn||0)/400+(c.pa||0)*S.prime/400;if(c.pa)S.cash+=c.pa*S.prime/400;
const rev=revQ(c),rdx=c.kd?0:c.A*(c.ps||0)*.0025,iinc=c.cs*(S.prime-2)/400,cp=op-it+iinc,ga=c.gw*.025,pre=cp-ga;let tax=0;
tax=cTax(c,pre);
c.gw-=ga;c.cs+=cp-tax;c.pni=c.ni;c.ni=pre-tax+c.eqi+c.dr;c.yni=(c.yni||0)+c.ni;
if(c.cook){c.ni=Math.abs(c.ni)*1.2+c.A*.004;c.cook=0;c.fr=1}
const smsg=surprise(c),dv=Math.max(0,cp-tax+c.dr)*(c.dban?0:c.pay);c.cs-=dv;payDiv(c,dv);exDiv(c,dv);anaUpd(c);
for(const k in c.own)if(k[0]==="c"&&c.own[k]>=20)S.co[+k.slice(1)].eqi+=c.ni*c.own[k]/100;
c.er={op,it,ga,tax,eq:c.eqi,dr:c.dr,ni:c.ni,dv,d:S.day};(c.eh=c.eh||[]).push(Math.round(c.ni*1e5/c.sh)/10);if(c.eh.length>8)c.eh.shift();woBook(c);c.eqi=0;c.dr=0;if(!c.kd)c.q=Math.max(0,Math.min(.009,(c.q||0)+(c.ps||0)*.0006-(c.ps?0:.0002)));if(c.ap&&mine(c))autop(c);
const gr=c.A*c.g/4;c.A+=gr;if(c.kd)c.D+=gr;else c.cs-=gr>0?gr:gr*.9;
if(c.cs<0){c.D-=c.cs;c.cs=0}if(c.bond>0&&S.day>=c.bmat){if(c.bh){S.cash+=c.bh;c.bh=0;L(c.tk+" 회사채 만기 상환",1)}c.bond=0;c.cpn=0}if(!c.kd&&c.bond===0&&!mine(c)&&rnd()<.05&&rating(c)<=4){const x=Math.min(loanOf(c)*.5,Math.max(0,eq(c)));if(x>5){c.bond=x;c.cpn=S.prime+SPR[rating(c)]+1;c.bmat=S.day+1800+(rnd()*1800|0)}}
if(c.sweep&&!mine(c)||c.sweep===2){const tc=c.A*(c.kd===2?.25:c.kd===1?.08:.06);if(c.cs>tc*1.5&&c.D>0){const x=Math.min(c.kd?c.D:loanOf(c),c.cs-tc);if(x>0){c.cs-=x;c.D-=x}}}
if(c.ni<0&&c.D/Math.max(eq(c),1)>(c.kd?12:1.2))c.ds++;else c.ds=0;
if(c.ds>=4){c.ds=0;const e=eq(c);if(e>-.3*c.A){const a0=c.A;c.A=Math.max(c.A*.2,c.A-(e+.3*c.A));const wd=a0-c.A;if(wd>0)impair(c,wd)}}
if(eq(c)<(c.kd?0:-.25*c.A)){ch11(c,"자본잠식");if(c.dead)return}
c.tg=tgCalc(c);if(c.surp){c.tg*=1+c.surp;c.jx=(c.jx||0)+Math.log(1+c.surp*.5);c.surp=0}
if(c.ncq){c.rlf={d:Math.round(S.day),R:c.ncq};c.ncq=0}if(c.eqq){const dq=Math.round(S.day);(c.isq=c.isq||{})[dq]=(c.isq[dq]||0)+c.eqq;c.eqq=0}if(c.acq){const dq=Math.round(S.day),r=c.acr=c.acr||{},o=r[dq]||(r[dq]={aD:0,aP:0,aC:0,iD:0,iP:0,iC:0,lD:0,hD:0});for(const k of ACQK)o[k]+=c.acq[k]||0;c.acq=null}qPush(c,[S.day,rev,op,rdx,it,iinc,ga,c.er.eq,c.er.dr,tax,c.ni,dv,gr,c.cs,c.A,c.gw,pfv(c),c.D,c.bond,c.pa||0,c.sh,c.p,c.er.imp||0,c.er.wo||0]);if(c.own.P||mine(c))L(c.tk+" 실적: 순이익 "+F(c.ni)+(smsg?" · "+smsg:"")+(c.own.P&&dv>0?" · 배당 "+F(dv*c.own.P/100*.6):""))}
// remove a company. m = multiple of market cap paid to holders; paid=true when caller already paid holders
function kill(c,m,paid){const v=mc(c)*m;settleNew(c,m);
if(c.sp>0){const x=c.sb-v*c.sp/100,t=Math.max(0,x)*.22;S.cash+=x-t;if(x>0)S.fl.sh=1;c.sp=0;c.sb=0}
if(c.bh>0){S.cash+=c.bh*(m>=1?1:m<.1?.1:.6);c.bh=0}if(c.pa){S.cash+=c.pa*(m>=1?1:.2);c.pa=0}
S.op=S.op.filter(o=>{if(o.i!==c.id)return true;S.cash+=o.nsh*Math.max(0,o.t==="C"?c.p*m-o.k:o.k-c.p*m)/1e4;return false});
for(const k of Object.keys(c.own)){if(!paid)payK(c,k,c.own[k]/100*v);setOwn(c,k,0)}
for(const t of Object.keys(c.pos))setOwn(S.co[t],"c"+c.id,0);
S.wl=S.wl.filter(x=>x!==c.id);if(S.ceo===c.id)S.ceo=-1;if(S.te===c.id)S.te="P";if(sel===c.id)sel=-1;c.dead=1;S.cd=1;c.hr=null;c.fq=[];c.hm=[];c.eh=[];c.xvd=null;c.w10=null;c.wd=null;c.ncq=0;delete c.rlf;c.eqq=0;delete c.isq;c.acq=null;delete c.acr}
// move target t's assets & holdings into acquirer a (after holders were settled)
// FIN-CF-03A: cashPaid = the cash the acquirer really paid for the deal (0 for shares or a 100% subsidiary). Recorded before anything moves:
// the acquirer's direct stake just before the deal decides external (aD/aP/aC) or internal absorption of its own subsidiary (> 50%, iD/iP/iC).
function absorb(a,t,paidVal,cashPaid){{const ki=(t.own["c"+a.id]||0)>50;acqAdd(a,ki?"iD":"aD",t.D);acqAdd(a,ki?"iP":"aP",cashPaid||0);acqAdd(a,ki?"iC":"aC",t.cs)}if(a.i===HOLD&&t.i!==HOLD&&t.A>0){a.i=t.i;if(t.kd){a.kd=t.kd;a.ln=-1}if(mine(a))L(a.tk+" 지주회사가 "+t.tk+"를 흡수해 "+SEC[t.i][0]+" 회사가 됐습니다",1)}const va=t.own["c"+a.id]?hv(t,t.own["c"+a.id]):0,et=eq(t);setOwn(t,"c"+a.id,0);
a.A+=t.A;a.cs+=t.cs;a.D+=t.D;a.gw+=t.gw+Math.max(0,paidVal+va-et);a.nol+=t.nol*.5;
for(const k of Object.keys(t.pos)){const x=S.co[k],p=x.own["c"+t.id],b=x.bs["c"+t.id]||0;setOwn(x,"c"+t.id,0);if(x!==a){setOwn(x,"c"+a.id,(x.own["c"+a.id]||0)+p);x.bs["c"+a.id]=(x.bs["c"+a.id]||0)+b}}
t.A=0;t.cs=0;t.D=0;t.gw=0;kill(t,1.3,1)}
function newCo(i,nm,sty){const used=new Set(S.co.map(c=>c.tk)),n=nm||AW[rnd()*AW.length|0]+" "+SB[i][rnd()*3|0],c=addCo(mk(tkGen(used),n,i,40+rnd()*260,1));c.cty=ctyPick(n);hqInit(c,1);S.st.ipo++;eco("🚀 신규 상장 "+c.tk+" "+n+" ("+SEC[i][0]+") 시총 "+F(mc(c))+(sty?" — "+sty:""));return c}
function ipoTick(){if(S.co.length-S.st.del-S.st.ma>560||rnd()>.35)return;const w=S.d.map((d,k)=>k===HOLD?0:Math.max(.2,1+d*60)*(S.co.some(c=>c.i===k&&!c.dead&&!c.priv)?1:2.5));let r=rnd()*w.reduce((a,b)=>a+b),i=0;while(i<SEC.length-1&&r>w[i]){r-=w[i];i++}if(i===HOLD)i=0;newCo(i)}
function maTick(){if(rnd()>.5)return;const a=S.co.filter(c=>!c.dead&&!c.priv&&!mine(c)&&rating(c)<=2&&!c.kd).sort((x,y)=>mc(y)-mc(x));if(!a.length)return;const ac=a[rnd()*Math.min(a.length,30)|0];
const ts=S.co.filter(t=>!t.dead&&t.i===ac.i&&t!==ac&&!t.priv&&!mine(t)&&t.ctl!=="c"+ac.id&&mc(t)<mc(ac)*.25&&t.pill<S.day);if(!ts.length)return;const t=ts[rnd()*ts.length|0],pr=mc(t)*1.3,ao=t.own["c"+ac.id]||0,pay=pr*(100-ao)/100;
for(const k of Object.keys(t.own)){if(k==="c"+ac.id)continue;const x=payK(t,k,t.own[k]/100*pr);if(k==="P")L("🤝 보유 중인 "+t.tk+" 지분이 인수되어 "+F(x)+" 현금화",1)}
ac.cs-=pay;if(ac.cs<0){ac.D-=ac.cs;ac.cs=0}S.st.ma++;eco("🤝 "+ac.tk+"가 "+t.tk+" "+t.n+" 인수 (프리미엄 30%, "+F(pay)+")");t.p*=1.3;for(const k of Object.keys(t.own))if(k!=="c"+ac.id)setOwn(t,k,0);absorb(ac,t,pay,pay)}
// rival buys b% of c, personally (via<0) or through a company it controls (via = company index)
function rbuy(r,id,c,b,via){const key=via>=0?"c"+via:"r"+id,x=mc(c)*b/100*(1+b/100*.8);if(pub(c)-c.sp<b+4)return 0;
if(via>=0){const k=S.co[via];if(k.cs<x)return 0;k.cs-=x}else{if(r.cash<x)return 0;r.cash-=x}
const was=c.ctl;setOwn(c,key,(c.own[key]||0)+b);c.bs[key]=(c.bs[key]||0)+x;c.p*=1+b/100*1.2;c.xv=(c.xv||0)+c.sh*b/100;ctlAll();
if(was==="P"&&!mine(c))L("⚠ "+r.n+"에게 "+c.tk+" 경영권을 빼앗겼습니다!",1);
else if(mine(c)&&grp(c,"r"+id)>=grp(c,"P")-5&&(c.wn||0)<S.day){c.wn=S.day+30;L("🦈 "+r.n+" 그룹이 "+c.tk+" 지분 "+grp(c,"r"+id).toFixed(0)+"% 확보 — 경영권 위협! (내 그룹 "+grp(c,"P").toFixed(0)+"%)",1)}return 1}
function rtender(r,id,c){const key="r"+id;if(c.pill>S.day||c.priv||c.dead)return;const h=grp(c,key),me=grp(c,"P");
if(me+cres(c)/2>=h){if(me>0){S.fl.def=1;L("🛡 "+c.tk+" 적대적 공개매수 방어 성공 ("+r.n+")",1)}return}
const P=mc(c)*1.3*(100-(c.own[key]||0))/100;if(r.cash<P*.7)return;r.cash-=Math.min(r.cash,P);const was=mine(c);settleX(c,1.3);
for(const k of Object.keys(c.own)){if(k===key)continue;const x=payK(c,k,c.own[k]/100*mc(c)*1.3);if(k==="P")L(c.tk+" 공개매수로 내 지분이 "+F(x)+"에 팔렸습니다",1);setOwn(c,k,0)}
setOwn(c,key,100);c.priv=1;c.pt=S.day;c.p*=1.3;S.st.ma++;ctlAll();if(S.te===c.id)S.te="P";if(S.ceo===c.id)S.ceo=-1;
eco("🦈 "+r.n+"이(가) "+c.tk+" "+c.n+"을(를) 적대적 공개매수로 인수 (비상장 전환)");if(was)L("⚠ "+c.tk+" 경영권을 "+r.n+"에게 빼앗겼습니다",1)}
function rivalTick(){const ag=(DIF[S.df]||DIF[1]).ra;
S.R.forEach((r,id)=>{const key="r"+id;r.cash+=r.cash*.05/360;if(PERS[r.s])return persTick(r,id,ag);if(rnd()>.12*ag)return;const a=S.co.filter(c=>!c.dead&&!c.priv&&c.pill<S.day);if(!a.length)return;let c,cap,b=1+(rnd()*3|0);
if(r.s==="raid"){const own=S.co.filter(k=>!k.dead&&k.ctl===key&&!k.priv&&k.cs>30).sort((x,y)=>y.cs-x.cs),fund=r.cash+(own[0]?own[0].cs:0);c=r.tg!=null?S.co[r.tg]:null;
if(!c||c.dead||c.priv||c.ctl===key||c.pill>S.day){const prey=S.df>=2||rnd()<.25?a.filter(k=>mine(k)&&grp(k,"P")<45&&mc(k)*.25<fund):[];
if(prey.length&&rnd()<(S.df>=2?.5:.25))c=prey[rnd()*prey.length|0];else{const q=a.filter(k=>k.ctl!==key&&!mine(k)&&mc(k)>100&&mc(k)*.25<fund*.8&&(k.p<k.tg*.95||k.cs>mc(k)*.3));c=q[rnd()*q.length|0]}r.tg=c?c.id:null}
if(!c)return;const via=own.length&&rnd()<.6?own[0].id:-1;if(via===c.id)return;rbuy(r,id,c,b+1,via);if(c.ctl===key){r.tg=null;eco("🦈 "+r.n+"이(가) "+c.tk+" "+c.n+" 경영권을 확보했습니다")}
const g=grp(c,key);if(c.ctl!==key&&g>=25&&g>grp(c,"P")&&rnd()<.08*ag)rtender(r,id,c);return}
if(r.s==="idx"){const q=a.filter(x=>mc(x)>1500);c=q[rnd()*q.length|0];cap=12}
else if(r.s==="val"){const q=a.filter(x=>x.ni>0&&x.p/(x.ni*4e4/x.sh)<11&&mc(x)>800);c=q[rnd()*q.length|0];cap=25}
else if(r.s==="act"){const q=a.filter(x=>x.p<x.tg*.85&&mc(x)<4000);c=q[rnd()*q.length|0];cap=30}
else{const q=a.slice().sort((x,y)=>chg(y)-chg(x));c=q[rnd()*8|0];cap=9}
if(!c)return;const h=c.own[key]||0;
if(r.s==="mom"&&h>0&&chg(c)<-.05){const s=Math.min(h,2+(rnd()*3|0));setOwn(c,key,h-s);r.cash+=mc(c)*s/100;c.p*=1-s/100*1.2;return}
if(h<cap)rbuy(r,id,c,b,-1);else if(rnd()<.3){const s=Math.min(h,2);setOwn(c,key,h-s);r.cash+=mc(c)*s/100}
if(r.s==="act"&&(c.own[key]||0)>=15&&rnd()<.06*ag)rtender(r,id,c)})}
function cmTick(dd){for(const m of S.cm){const cr=m.k==="BTC"||m.k==="ETH";if(cr&&S.cx){if(dd%10===0){m.hist.push(m.p);if(m.hist.length>31)m.hist.shift()}continue}m.f*=1+.02/360;
m.p*=1+nz()*m.v*3.4+(cr?S.mood*.003+.0005:(m.f/m.p-1)*.003);m.p=Math.max(m.f*.05,m.p);if(dd%10===0){m.hist.push(m.p);if(m.hist.length>31)m.hist.shift()}}
if(rnd()<.0015){const o=S.cm[2],u=rnd()<.5;o.p*=u?1.35:.72;S.mk.j+=u?-.008:.004;S.mk.jw=u?"유가 폭등":"유가 급락";L("🛢 "+(u?"중동 긴장 고조! 유가 폭등":"산유국 증산 합의, 유가 급락"),1)}
}
function investigate(){const w=Math.max(0,nw()),fine=Math.max(5,w*(.03+S.heat/1000)),fr=S.co.filter(c=>c.fr&&!c.dead);
if(S.heat>=100){S.over=2;S.spd=0;L("🚔 감독원 조사 끝에 구속되었습니다. 게임 종료.",1);return}
S.cash-=fine;fr.forEach(c=>{c.p*=.55;c.tg*=.7;c.fr=0});S.heat*=.35;S.fl.sv=1;
mdl={t:"감독원 조사",b:"금융감독원이 당신의 거래를 조사했습니다. 벌금 "+F(fine)+"을 냈습니다."+(fr.length?" 분식회계가 드러나 "+fr.map(c=>c.tk).join(", ")+" 주가가 폭락했습니다.":"")+" 주목도가 "+S.heat.toFixed(0)+"(으)로 내려갔습니다.",o:[["확인","ok"]]};S.sp0=S.spd;S.spd=0;L("⚖ 감독원 조사: 벌금 "+F(fine),1)}
function pickEvent(){const my=S.co.filter(c=>mine(c)&&!c.dead),lst=S.co.filter(c=>!c.dead&&!c.priv),r=a=>a[rnd()*a.length|0],cand=[];
if(S.cheat){cand.push(["ins",r(lst.filter(c=>mc(c)>300)),3+rnd()*12]);if(rnd()<.5)cand.push(["brb",null,Math.max(15,nw()*.02)]);
const ck=my.filter(c=>c.ni<0&&!c.priv);if(ck.length)cand.push(["cook",r(ck),0]);const pv=lst.filter(c=>topRival(c,"P")>=10&&!mine(c));if(pv.length)cand.push(["pr",r(pv),5+rnd()*10]);
const fr=my.filter(c=>c.i===3);if(fr.length)cand.push(["front",r(fr),fr[0].A*.01]);if(S.heat>=40)cand.push(["gift",null,10+S.heat/4])}
const bl=my.filter(c=>rating(c)===5);if(bl.length){const c=r(bl);cand.push(["bail",c,c.A*.15])}
if(!cand.length)return;const[id,c,x]=r(cand);if(!c&&id!=="brb"&&id!=="gift")return;S.ev={id,c:c?c.id:-1,x};const e=EV[id];
mdl={t:e.t,b:e.b.replace("{c}",c?c.tk+" "+c.n:"").replace("{x}",F(x)),o:e.o,ev:1};S.sp0=S.spd;S.spd=0}
const pyramid=()=>S.co.some(c=>mine(c)&&Object.keys(c.own).some(k=>{if(k[0]!=="c")return false;const h=S.co[+k.slice(1)];return mine(h)&&Object.keys(h.own).some(j=>j[0]==="c"&&mine(S.co[+j.slice(1)]))}));
const AC=[["fc","첫 경영권 확보",()=>S.co.some(mine)],["tn","공개매수 성공",()=>S.fl.tn],["w1","순자산 1,000억",()=>nw()>=1e3],["w2","순자산 1조",()=>nw()>=1e4],["w3","순자산 10조",()=>nw()>=1e5],
["py","지주회사 피라미드 (자회사의 자회사 지배)",pyramid],["mg","주식교환 합병 성공",()=>S.fl.mg],["lb","LBO 성공",()=>S.fl.lb],["sh","공매도 수익 실현",()=>S.fl.sh],
["bd","채권 100억 보유",()=>gbv()+S.co.reduce((a,c)=>a+(c.bh&&!c.dead?bv(c):0),0)>=100],["bk","은행 경영권 보유",ctlBank],["in","보험사 경영권 보유",()=>S.co.some(c=>c.kd===2&&mine(c))],
["ip","내가 세운 회사 상장",()=>S.fl.ip],["fd","회사 직접 설립",()=>S.fl.fd],["hd","지주회사 설립",()=>S.fl.hd],["inc","주식 현물출자 (Incorporate Yourself)",()=>S.fl.inc],["gm","그린메일 성공",()=>S.fl.gm],["c5","경영권 5개 보유",()=>S.co.filter(mine).length>=5],["c20","경영권 20개 보유",()=>S.co.filter(mine).length>=20],
["lq","회사 청산",()=>S.fl.lq],["op","옵션 수익 실현",()=>S.fl.op],["cm","원자재·코인 수익 실현",()=>S.fl.cm],["lw","소송 승소",()=>S.fl.lw],
["df","적대적 공개매수 방어",()=>S.fl.def],["stl","라이벌 회사 빼앗기",()=>S.fl.steal],["gl","도전 모드 목표 달성",()=>S.fl.goal],
["hn","청렴한 투자자 (위험한 제안 5회 거절)",()=>S.hon>=5],["sv","감독원 조사에서 살아남기",()=>S.fl.sv],["mo","한 업종 점유율 50% 독점",()=>SEC.some((_,i)=>i!==HOLD&&myShare(i)>.5)],["rk","라이벌 전원 추월",()=>S.R.length>0&&S.R.every((r,i)=>nw()>rnw(i))]];
function mxTick(){if(S.mx){S.mx.q--;if(S.mx.q<=0){const e=MXE.find(x=>x.id===S.mx.id);for(const k in e.d)S.mxd[k]-=e.d[k];L("✅ "+e.n+" 국면이 끝났습니다",1);S.mx=null}return}
if(rnd()<[.03,.06,.12][S.cfg?S.cfg.vol:1]){const e=MXE[rnd()*MXE.length|0];S.mx={id:e.id,q:e.q};for(const k in e.d)S.mxd[k]+=e.d[k];S.mood+=e.m;if(e.oil)S.cm[2].p*=e.oil;S.mk.j+=e.m*.06;S.mk.jw=e.n;S.sj=S.sj||[];S.sjw=S.sjw||[];for(const k in e.d){S.sj[k]=(S.sj[k]||0)+e.d[k]*1.5;S.sjw[k]=e.n}
if(e.pr){S.prime=Math.min(14,S.prime+e.pr);S.bp=Math.max(55,S.bp*(1-6*e.pr/100))}L(e.t,1);eco(e.t)}}
function qEnd(){const w=nw(),q=S.qs||{nw:w,div:0,ctl:0},my=S.co.filter(mine).length,y=(S.y0||2027)+((S.day-1)/360|0),qn=((S.day-1)%360/90|0)+1;
S.qr={t:y+"년 "+qn+"분기",nw:w,d:w-q.nw,p:q.nw?(w/q.nw-1)*100:0,div:q.div,ctl:my,dc:my-q.ctl};
L("📊 "+S.qr.t+" 결산: 순자산 "+F(w)+" ("+P1(S.qr.p)+"), 배당 수입 "+F(q.div)+", 지배 회사 "+my+"개");S.qs={nw:w,div:0,ctl:my};ctyHeat();mxTick()}
function goalChk(){const c=S.cfg;if(!c||!c.mode||S.won||mdl)return;const g=GOALS[c.goal],w=nw();
if(w>=g[2]){S.won=1;S.fl.goal=1;hofAdd("도전 달성: "+g[0]);mdl={t:"도전 달성!",b:ds()+"에 목표("+g[0]+")를 이뤘습니다. 기록은 명예의 전당에 남았고, 계속 플레이할 수 있어요.",o:[["계속하기","ok"]]};S.sp0=S.spd;S.spd=0}
else if(S.day>=g[1]){S.won=-1;mdl={t:"도전 실패",b:"기한 안에 목표("+g[0]+")를 이루지 못했습니다. 최종 순자산 "+F(w)+". 자유 모드로 계속할 수 있어요.",o:[["계속하기","ok"]]};S.sp0=S.spd;S.spd=0}}
function achk(){AC.forEach(([k,t,f])=>{if(!S.ach[k]&&f()){S.ach[k]=1;L("🏆 업적 달성: "+t,1)}})}
function step(){S.day++;const dd=S.day;dayR();v11prep();v12prep();if(S.cd)ctlAll();
if(dd%30===0){wRun(8,()=>{S.d=S.d.map(d=>d*.75+nz()*.008)});S.nm=nw();secUpd();goalChk();fsTick();rbank();bankFix();if(dd%360===0){ceoBonus();rvLearn()}}
if(dd%15===0)wRun(9,ipoTick);if(dd%30===10)wRun(10,maTick);if(dd%90===45)aiTick();
if(dd%90===0){wRun(3,()=>{qEnd();macroQ()});wRun(12,()=>{archQ();hqQ();bankQ();etfQ();swQ();rvQ();eoGrant()});
if(S.imm<dd)SEC.forEach((_,i)=>{const s=i!==HOLD?myShare(i):0;if(s>.5&&rnd()<.35){const f=S.co.find(c=>c.i===i&&mine(c));f.cs-=f.A*.03;if(f.cs<0){f.D-=f.cs;f.cs=0}L("⚖ 독점금지 소송! "+SEC[i][0]+" 점유율 "+(s*100|0)+"% → "+f.tk+" 벌금 "+F(f.A*.03),1)}})}
if(rnd()<.012){if(rnd()<.5){const i=PICKS[rnd()*PICKS.length|0],u=rnd()<.5;S.d[i]+=u?.012:-.012;(S.sj=S.sj||[])[i]=(u?1:-1)*(.02+rnd()*.02);(S.sjw=S.sjw||[])[i]=u?"수요 급증 소식":"수요 급감 소식";L(SEC[i][0]+" 업종 "+(u?"수요 급증 — 호황 조짐":"수요 급감 — 불황 조짐"))}
else{const c=S.co[rnd()*S.co.length|0];if(!c.dead&&!c.priv){const u=rnd()<.5;c.nf=(c.nf||0)+Math.log(u?1.12:.88);c.jx=(c.jx||0)+Math.log(u?1.1:.9);L(c.tk+(u?" 신제품 대박! 주가 급등":" 회계 의혹 터짐! 주가 폭락"),c.own.P>0||mine(c))}}}
wRun(11,()=>{macroD();bsTick();scnTick();sjqTick()});wRun(5,()=>cmTick(dd));wRun(6,cxTick);mktTick(dd);etfDay();futDay();optDay();corpDay(dd);rsTick();evqTick();if(!S.cfg.spec&&rnd()<.02*[0,.5,1,2][S.cfg.evf==null?2:S.cfg.evf])aiEvent();const X=S.ix;
if(S.ceo>=0&&!mine(S.co[S.ceo])){gpara(S.co[S.ceo]);S.ceo=-1}
S.cash+=ceoPay()-S.loan*(S.prime+1.5)/36500-2/90+gbv()*(S.yL||S.prime-2)/36000+S.ft.q*(X-S.ft.lx);S.ft.lx=X;
if(S.cash<0){S.loan-=S.cash;S.cash=0}
S.op=S.op.filter(o=>{if(o.exp>dd)return true;const c=S.co[o.i],v=c.dead?0:o.nsh*Math.max(0,o.t==="C"?c.p-o.k:o.k-c.p)/1e4;if(v>0){S.cash+=v;if(v>o.pr)S.fl.op=1;L("옵션 만기 행사: "+c.tk+" "+(o.t==="C"?"콜":"풋")+" +"+F(v),1)}else L("옵션 만기 소멸: "+c.tk);return false});
S.al=S.al.filter(a=>{const c=S.co[a.i];if(c.dead)return false;if(a.d>0?c.p>=a.px:c.p<=a.px){L("🔔 가격 알림 "+c.tk+" "+W(c.p),1);return false}return true});
rivalTick();
S.heat=Math.max(0,S.heat-.05);if(dd%30===0&&S.heat>30&&rnd()<(S.heat-30)/150&&!mdl)investigate();
if(--S.nev<=0){const f=[0,.5,1,2][S.cfg.evf==null?2:S.cfg.evf];S.nev=f?(90+rnd()*120)/f/Math.min(2,.7+.1*S.co.filter(mine).length):9999;if(f&&!mdl&&!S.cfg.spec)pickEvent2()}
if(S.cfg.spec){S.cash=0;S.loan=0;S.loss=0}let w=nw();const sv=S.co.reduce((a,c)=>a+(c.sp>0&&!c.dead?mc(c)*c.sp/100:0),0);
if(sv>0&&w<sv/3){L("⚠ 공매도 증거금 부족! 포지션 강제 환매",1);S.co.forEach(c=>{if(c.sp>0&&!c.dead)covX(c,100)});w=nw()}
if(S.loan>3*w&&S.loan>0){L("⚠ 마진콜! 대출이 순자산의 3배 초과 → 강제 매도",1);
for(const c of S.co.filter(c=>c.own.P&&!c.priv&&!c.dead).sort((a,b)=>val(b)-val(a))){if(S.loan<=3*nw())break;payK(c,"P",val(c)*.93);setOwn(c,"P",0);c.p*=.85;L(c.tk+" 지분 강제 매도")}
const p=Math.min(S.cash,S.loan);S.cash-=p;S.loan-=p;w=nw()}
if(w<=0&&!S.over&&!S.cfg.spec){S.over=1;S.spd=0}
if(dd%7===0){S.nwh.push(w);if(S.nwh.length>150)S.nwh.shift()}if(dd%10===0){(S.ixh=S.ixh||[]).push(+S.ix.toFixed(2));if(S.ixh.length>31)S.ixh.shift()}if(dd%10===0)achk();
coachDay();chlTick();hsTick();const rk=RK.reduce((a,r,i)=>w>=r[1]?i:a,0);if(rk>S.rank){S.rank=rk;L("🏅 칭호 승급: "+RK[rk][0],1)}}
async function aiInit(){try{if(typeof claude!=="undefined"&&claude.use)AI=await claude.use("sample")}catch(e){AI=null}}
async function aiTick(force){if(!S.ai||!aiOn()||busy||(!force&&Date.now()-lastAI<45000))return;busy=1;lastAI=Date.now();
try{const ref=alive().sort(()=>rnd()-.5).slice(0,30).map(c=>c.tk+":"+c.n+"("+SEC[c.i][0]+")").join(", ");
const r=await AI.json("한국어 가상 주식시장 게임의 시장 엔진입니다. 날짜 "+ds()+", 기준금리 "+S.prime.toFixed(1)+"%, GDP "+S.gdp.toFixed(1)+"%, 유가 "+W(S.cm[2].p)+"/배럴. 업종 번호: "+SEC.map((x,i)=>i+"="+x[0]).join(", ")+". 최근 뉴스: "+S.log.slice(0,3).join(" / ")+". 참고 종목: "+ref+". 현실감 있는 시장 이벤트를 만들어 주세요. 오직 JSON만 답하세요: {\"news\":[{\"tk\":\"참고 종목 티커\",\"headline\":\"40자 이내 한 줄 뉴스\",\"effect\":-1에서1사이숫자}],\"ipo\":[{\"name\":\"가상 신생기업명(20자 이내)\",\"sector\":업종번호,\"story\":\"30자 이내 한줄 소개\"}]}. news 2~3개, ipo 0~2개. 실존 기업이나 인물을 비방하지 말고 가상의 이야기만 쓰세요.",null,true);
(Array.isArray(r.news)?r.news:[]).slice(0,3).forEach(n=>{const c=S.co.find(x=>x.tk===String(n.tk)&&!x.dead);if(!c||c.priv)return;const e=Math.max(-1,Math.min(1,+n.effect||0));c.tg*=1+e*.08;c.p*=1+e*.04;eco("🤖 "+c.tk+": "+String(n.headline).slice(0,60))});
(Array.isArray(r.ipo)?r.ipo:[]).slice(0,2).forEach(n=>{const nm=String(n.name).replace(/[^\w가-힣 &.\-]/g,"").slice(0,20).trim(),i=(k=>k===HOLD?0:k)(Math.max(0,Math.min(SEC.length-1,n.sector|0)));if(nm)newCo(i,nm,String(n.story||"").slice(0,40))})}
catch(e){if(e&&["not_granted","blocked","nokey","na","off","http"].includes(e.code)){S.ai=0;toast(aiErr(e)+" 시장 엔진을 껐습니다")}else if(e&&e.code==="rate_limited")lastAI=Date.now()+120000}finally{busy=0}}

// ---- v8 sim: distressed asset market, loan calls, chapter 11, rival banks, autopilot, missions ----
function fsAdd(c,f,why){const a=c.A*f;if(a<1)return;c.A-=a;c.cs+=a*.75;if(S.fs&&S.fs.length<14)S.fs.push({i:c.i,A:a,px:a*.9,s:c.tk,why,exp:S.day+90})}
// chapter 11: old shareholders are wiped out and debt is cut so equity is 15% of assets — a debt-for-equity swap, i.e. a
// capital transaction (not income). Its effect on book equity is recorded as er.cap of the quarter it happens in.
const bkE=c=>c.A+c.cs+c.gw-c.D+(c.fmg||0);
function ch11(c,why){const b0=bkE(c);ch11x(c,why);if(!c.dead&&c.er&&c.er.d===S.day)c.er.cap=(c.er.cap||0)+(bkE(c)-b0)}
function ch11x(c,why){const had=c.own.P>0||mine(c);c.bk++;
if(c.bk>=2){S.st.del++;eco("🪦 "+c.tk+" "+c.n+" 상장폐지 ("+why+")"+(had?" — 내 지분 휴지조각!":""));if(had)toast(c.tk+" 상장폐지! 지분 소멸");kill(c,.02);return}
const b=S.co[c.ln];let wb=null;if(b&&!b.dead){const ls=loanOf(c)*.3;b.A-=ls;b.woq=(b.woq||0)+ls;if(ls>0)wb=b;if(mine(b))L(b.tk+" 은행: "+c.tk+" 부실로 대손 "+F(ls)+" (다음 결산 순이익에 반영)",1)}
if(!c.kd&&c.A>20)fsAdd(c,.15,"법정관리");eco("💥 "+c.tk+" 법정관리 ("+why+")"+(had?" — 내 지분 소멸!":""));if(had)toast(c.tk+" 법정관리! 지분 소멸");
if(c.pa)c.pa*=.3;for(const k of Object.keys(c.own))setOwn(c,k,0);c.priv=0;{const b=S.co[c.ln];if(b&&!b.dead&&b.kd===1&&loanOf(c)>c.A*.1){const st=Math.min(80,30+loanOf(c)/Math.max(1,c.A)*60);setOwn(c,"c"+b.id,st);c.bs["c"+b.id]=0;eco("🏦 "+b.tk+" 대출 출자전환 — 법정관리 "+c.tk+" 지분 "+st.toFixed(0)+"% 확보");if(mine(b))L("🏦 loan-to-own: "+b.tk+" 은행이 "+c.tk+" 지분 "+st.toFixed(0)+"%를 받았습니다",1);ctlAll()}}c.bh*=.4;c.bond*=.4;const D0=c.D;c.D=Math.max(0,c.A+c.cs+c.gw+pfv(c)-.15*c.A);c.ncq=(c.ncq||0)+(D0-c.D);if(c.bond>c.D)c.bond=c.D;if(c.pa>c.D-c.bond)c.pa=Math.max(0,c.D-c.bond);c.nol=0;c.mg=-1;c.p=Math.max(60,eq(c)*1e4/c.sh*.5);c.tg=c.p;if(wb&&!wb.dead)wb.tg=tgCalc(wb)}
// bank b calls fraction f of borrower x's bank loan; shortfall forces asset sales, then chapter 11
function callLoan(b,x,f){const amt=loanOf(x)*f;if(amt<1)return 0;let paid=Math.min(x.cs,amt);x.cs-=paid;let need=amt-paid;
if(need>0&&!x.kd){fsAdd(x,Math.min(.6,need/.75/Math.max(1,x.A)),"대출 회수");const p2=Math.min(x.cs,need);x.cs-=p2;paid+=p2;need-=p2}
x.D-=paid;b.cs+=paid;b.A-=paid;x.p*=.85;x.tg*=.9;x.lc=S.day+180;if(need>1)ch11(x,"대출 회수");return paid}
function fsTick(){if(!S.fs)S.fs=[];S.fs=S.fs.filter(f=>f.exp>S.day);
if(rnd()<.3){const q=S.co.filter(c=>!c.dead&&!c.kd&&!c.priv&&!mine(c)&&rating(c)>=4&&c.A>60),c=q[rnd()*q.length|0];if(c)fsAdd(c,.12,"유동성 위기")}
S.fs=S.fs.filter(f=>{if(rnd()>.2)return true;const q=S.co.filter(c=>!c.dead&&!c.kd&&!mine(c)&&c.i===f.i&&c.cs>=f.px),c=q[rnd()*q.length|0];if(!c)return true;c.cs-=f.px;c.A+=f.A;eco("⇄ "+c.tk+"가 "+f.s+"의 사업 자산 "+F(f.A)+" 인수");return false})}
function rbank(){if(S.df<2)return;for(const b of S.co){if(b.dead||b.kd!==1||!b.ctl||b.ctl[0]!=="r")continue;const r=S.R[+b.ctl.slice(1)];
for(const x of S.co){if(x.dead||x.ln!==b.id||!mine(x)||rating(x)<4||eq(x)<=0||(x.lc||0)>S.day||rnd()>.3)continue;x.frz=b.id+1;const p=callLoan(b,x,.5);L("🏦 "+r.n+"이(가) 지배하는 "+b.tk+" 은행이 "+x.tk+"의 대출 "+F(p)+"을 회수하고 신용을 동결했습니다! 거래 은행을 바꾸세요",1)}}}
function autop(c){const r=rating(c),roa=c.ni*4/Math.max(1,c.A),gap=c.kd?0:S.dg[c.i]-S.cg[c.i];
c.g=r>=4?0:roa>.1&&r<=2&&gap>-.01?.1:.04;c.pay=r>=4||c.nol>c.A*.05?0:.3;c.sweep=r>=3?2:1;if(!c.kd)c.ps=r<=3&&roa>.06?1:0;if(c.i===HOLD){c.g=0;c.ps=0;c.pay=0}}
const MIS=[["첫 주식 매수","시장 탭에서 회사를 골라 +1% 매수해 보세요.",()=>S.co.some(c=>c.own.P&&!c.dead),20,"m"],
["첫 경영권 확보","지분 20% 이상이면서 최대 그룹이 되면 경영권을 얻습니다. 종목 화면 매매 탭의 '경영권까지' 버튼을 써 보세요.",()=>S.co.some(mine),30,"scr"],
["회사를 거래 주체로","위쪽 '거래 주체' 칩을 눌러 내가 지배하는 회사를 고르세요.",()=>S.te!=="P",30,"te"],
["회사 돈으로 지분 매수","거래 주체가 회사인 상태에서 다른 회사 지분을 사세요.",()=>S.co.some(c=>!c.dead&&Object.keys(c.own).some(k=>k[0]==="c"&&mine(S.co[+k.slice(1)]))),50,"m"],
["지주회사 피라미드","내 자회사가 또 다른 회사의 경영권을 갖게 만드세요.",pyramid,80,"e"],
["회사채 발행","내 회사의 경영 탭에서 회사채를 발행해 인수 자금을 마련하세요.",()=>S.fl.bond,50,"e"],
["대형 인수","공개매수·LBO·주식교환 합병 중 하나를 성공시키세요.",()=>S.fl.tn||S.fl.mg||S.fl.lb,100,"scr"],
["은행 장악","은행 경영권을 잡으세요. 개인 대출 한도가 늘고 대출 회수 권한이 생깁니다.",ctlBank,150,"scr"],
["대출 회수","내 은행의 대출 장부에서 신용 BB 이하 회사의 대출을 회수해 흔들어 보세요.",()=>S.fl.call,100,"e"],
["회사 직접 세우기","메뉴의 '회사 설립'에서 지주회사를 세워 보세요. 자금 이동으로 보유 주식을 현물출자하면 받는 배당에 세금이 붙지 않습니다.",()=>S.fl.fd,50,"fd"],
["순자산 1조","제국을 키워 순자산 1조를 달성하세요.",()=>nw()>=1e4,0,null]];
function misChk(){if(S.ms==null||S.ms>=MIS.length)return;const m=MIS[S.ms];if(m[2]()){S.ms++;if(m[3])S.cash+=m[3];L("🎯 미션 완료: "+m[0]+(m[3]?" · 보상 "+F(m[3]):""),1)}}

// ---- v11 market engine: every daily move = market factor + sector factor + value pull + company-specific + events, each with a reason ----
// daily log returns are stored in rings of DH days, in units of 1/RU (5 basis points); open/high/low and volume are derived deterministically
const DH=250,RU=2000;// MP: value-pull speed (kv) and lasting-expectation memory (k*) and share (l*) for market (m), sector (s), company (n)
const MP={kv:.006,kn:.9999,ln:.8,ic:.45,ks:.9995,ls:.7,km:.998,lm:.6};
function gz(){let u=rnd();while(u<1e-12)u=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(6.283185307179586*rnd())}
const gzt=()=>{const z=gz();return rnd()<.035?z*2.5:z};
const hsh=(a,b,k)=>{let x=Math.imul(a+1,73856093)^Math.imul(b+7,19349663)^Math.imul(k+3,83492791);x=Math.imul(x^(x>>>13),1274126177);x^=x>>>16;return(x>>>0)/4294967296};
function coPrep(c){if(c.hr)return;const x=SX[c.i]||SX[0],t=tn(c);c.be=+(x.b*(.8+rnd()*.4)).toFixed(2);c.sg=+((.006+.0011*x.v)*[.75,1,1.35][t]*(.85+rnd()*.3)).toFixed(4);
c.tv=+(.004*[.6,1,1.6][t]*(.6+rnd()*.8)).toFixed(5);c.hr=new Array(DH).fill(0);c.hn=0;c.s10=0;c.hm=c.hm||[];c.pc=c.p;c.jx=c.jx||0;c.pd=0;c.pdn=0;c.wd=[0,0,0,0,0,0];c.w10=[0,0,0,0,0,0];c.ch=0;c.c1=0;c.xv=0;c.vd=0;c.fq=c.fq||[];if(c.est===undefined)c.est=null}
function ringGet(a,hn,n){n=Math.min(n,hn,DH);const out=new Array(n);for(let j=0;j<n;j++)out[j]=a[(hn-n+j)%DH];return out}
function ixNew(n,lv){return{n,v:lv,lv:new Array(DH).fill(Math.round(lv*100)),hn:0,hm:[],tv:null}}
function ixPush(o,lv,tv){const k=o.hn%DH;o.lv[k]=Math.round(lv*100);if(o.tv)o.tv[k]=Math.round(tv);o.hn++;o.v=lv}
const IXK=()=>["ALL","L50","SML",...GRP.map((_,g)=>"G"+g),...SEC.map((_,i)=>"S"+i),"VIX","RATE","BOND","YS","YL","FXR","INF"];
function ixName(k){return k==="ALL"?"WSR 종합":k==="L50"?"WSR 대형 50":k==="SML"?"WSR 중소형":k==="VIX"?"공포지수 (변동성)":k==="RATE"?"기준금리":k==="BOND"?"국채 가격":k==="YS"?"단기 국채 금리":k==="YL"?"장기 국채 금리":k==="FXR"?"원/달러 환율":k==="INF"?"물가 상승률":k[0]==="G"?GRP[+k.slice(1)][1]+" 그룹":SEC[+k.slice(1)][0]}
function v11prep(){if(!S.mk)S.mk={h:8e-5,r:0,j:0,jw:"",c:[0,0,0],why:""};if(!S.sf)S.sf=SEC.map(()=>0);while(S.sf.length<SEC.length)S.sf.push(0);if(!S.ns)S.ns=SEC.map(()=>0);while(S.ns.length<SEC.length)S.ns.push(0);if(!S.sw)S.sw=[];
let full=0;if(!S.IX){S.IX={};for(const k of IXK())S.IX[k]=ixNew(ixName(k),ixInit(k));for(const k of ["ALL","L50","SML"])S.IX[k].tv=new Array(DH).fill(0);full=1}
for(const k of IXK())if(!S.IX[k])S.IX[k]=ixNew(ixName(k),ixInit(k));for(const m of S.cm){if(!m.hr){m.hr=new Array(DH).fill(0);m.hn=0;m.hm=[];m.pc=m.p}}
if(!S.l50)l50Upd();if(S.wk7==null){S.wk7=SEC.map(()=>0);S.wkm=0}while(S.wk7.length<SEC.length)S.wk7.push(0);
if(full){for(const c of S.co){if(c.dead)continue;coPrep(c);if(c.hl&&c.hl.length>1)c.hl=[c.hl[c.hl.length-1]];if(c.hist&&c.hist.length>1)c.hist=[c.hist[c.hist.length-1]]}bfill();
// opening valuations: today's price gap to fair value is read as the market's standing expectation
for(const c of S.co)if(!c.dead&&!c.priv&&c.nf==null){c.tg=tgCalc(c);c.nf=+Math.max(-.6,Math.min(.6,Math.log(c.p/Math.max(1,c.tg)))).toFixed(4)}}}
// large-cap 50: rebalanced once a year with a buffer (members stay while ranked within the top 80), like real index rules
function l50Upd(){const a=S.co.filter(c=>!c.dead&&!c.priv).sort((x,y)=>mc(y)-mc(x)),rk=new Map(a.map((c,j)=>[c.id,j])),o=new Set((S.l50||[]).filter(id=>rk.has(id)&&rk.get(id)<80));for(const c of a){if(o.size>=50)break;o.add(c.id)}S.l50=[...o].sort((x,y)=>rk.get(x)-rk.get(y)).slice(0,50)}
// earnings shock: a persistent part (half-life ~2.5 years, like real business momentum) plus a small one-quarter wobble
function eShock(c,a){a*=1+(ctr(c).fx||0)*.5;c.pe=Math.max(-.5,Math.min(.5,(c.pe||0)*.93+a*.075*hgn(c.id,5)));return c.pe+(hu(c.id,8)-.5)*a*.35}
// fair value: 70% earnings power (TTM EPS × a P/E that rises with growth, falls with rates and fear) + 30% book value
function tgCalc(c){const eps=epsV(c),bps=Math.max(0,eq(c))*1e4/c.sh,mu=Math.max(4,Math.min(26,7+c.g*55+(7.5-S.prime)*1.1+S.mood*8));let t=Math.max(60,eps>0?.7*eps*mu+.3*bps:bps*.45);if(c.i===HOLD)t=Math.max(t,bps*.85);return t*cvm(c)}
// trailing-12-month EPS (원, annual): the market values a company on its last four quarters, not one noisy quarter
function epsT(c){const h=c.eh;if(!h||!h.length)return c.ni*4e4/c.sh;const n=Math.min(4,h.length);let s=0;for(let j=h.length-n;j<h.length;j++)s+=h[j];return s*4/n}
// EPS the target price is valued on. Normally epsT. While a bank has a loan write-off booked in its assets but not yet in its
// earnings (woq > 0, RT-BANK-R4C), the market already knows the quarter that will carry it, so the valuation uses the trailing
// year as it will stand after that report if the report meets consensus: the expected core EPS (est) minus the waiting loss per
// share, in place of the oldest quarter. This is the shape the close pushes into eh (core - wo, rounded), but it only reads: eh,
// ni, er, yni and the other records are untouched, and woBook clears woq before the close's tgCalc, so the loss is never in both.
function epsV(c){const w=c.woq||0;if(!(w>0))return epsT(c);const h=c.eh||[],m=h.length,n=Math.min(4,m+1),e1=c.ni*1e4/c.sh;
let core=c.est!=null&&isFinite(c.est)?c.est:null;if(core==null){const k=Math.min(4,m);core=k?h.slice(m-k).reduce((a,v)=>a+v,0)/k:e1}
let s=core-w*1e4/c.sh;for(let j=m-(n-1);j<m;j++)s+=h[j];return s*4/n}
// ---------- daily factors ----------
function mktDay(){const M=S.mk;M.h=Math.min(.0016,Math.max(2e-5,1.2e-6+.07*M.r*M.r+.91*M.h));const sd=Math.sqrt(M.h),b=.00012+S.mood*.0007,e=sd*gzt(),j=M.j||0;M.j=0;
const r=Math.max(-.2,Math.min(.15,b+j+e));M.r=r;M.c=[b,j,e];M.why=M.jw||"";M.jw="";
// size factor: small caps swing harder on macro shocks and go through their own multi-month in/out-of-favour phases
M.nm=(M.nm||0)*MP.km+MP.lm*(e+j);M.zd=(M.zd||0)*.995+.000022*gz();M.z=M.zd+.0035*gz()+.35*j;return r}
const SZX=[-.3,.2,.7];
function secDay(rO,rG,rB,dP){S.sw=[];const sj=S.sj||[];for(let i=0;i<SEC.length;i++){if(i===HOLD){S.sf[i]=0;continue}const x=SX[i]||SX[0];
const n0=(.0022+.0006*x.v)*gzt(),o=(x.oil||0)*.3*rO,gd=(x.gold||0)*.55*rG,bt=(x.btc||0)*.3*rB,rt=dP?-(x.rate||0)*dP/100*1.6:0,dm=.00012*(S.dg[i]-S.cg[i])/.01,ev=sj[i]||0;
const f=n0+o+gd+bt+rt+dm+ev+(x.fx||0)*.5*(S.fxd||0)+cycD(i);S.sf[i]=f;S.wk7[i]+=f;S.ns[i]=S.ns[i]*MP.ks+MP.ls*(n0+ev);
if(Math.abs(f)>.012){const ps=[[o,"유가 "+P1(rO*100)],[gd,"금값 "+P1(rG*100)],[bt,"코인 "+P1(rB*100)],[rt,dP>0?"금리 인상":"금리 인하"],[ev,S.sjw&&S.sjw[i]||"업종 뉴스"]].filter(z=>Math.abs(z[0])>.004).sort((a,b)=>Math.abs(b[0])-Math.abs(a[0]));
S.sw[i]=ps.length?ps[0][1]:f>0?"매수세 유입":"차익 실현 매물"}}S.sj=null;S.sjw=null}
// derived daily volume (만주): turnover base × activity (abnormal move, market move, earnings day) + recorded big trades
function vAt(c,dd,r,rm){const ab=Math.abs(r-c.be*rm)/Math.max(.004,c.sg);return c.tv*c.sh*(.7+.6*hsh(c.id,dd,11))*(1+.9*ab+.5*Math.abs(rm)/.01)*(dd%90===c.off?2.2:1)+((c.xvd&&c.xvd[dd])||0)}
// company day: returns total log return; records reasons
function coDay(c,rm){if(c.priv){c.p=Math.max(60,c.p+(c.tg-c.p)*.02);c.pc=c.p;return 0}if(!c.hr)coPrep(c);
// most of each company-specific move is lasting news: it shifts the market's expectation (nf), which fades only very slowly; the rest is noise pulled back to value.
// the small -ic·sg² term keeps the average (not the median) price change from news at zero, so volatile small caps don't out-earn big ones just by being volatile
const pc=c.pc||c.p,fl=Math.log(c.p/pc),m=c.be*rm+SZX[tn(c)]*(S.mk.z||0),s=S.sf[c.i]||0,nf=c.nf||0,v=MP.kv*Math.log(Math.max(1,c.tg)*Math.exp(nf+S.ns[c.i]+c.be*(S.mk.nm||0))/c.p),i0=c.sg*(hgz(c.id,0)-MP.ic*c.sg);c.nf=nf*MP.kn+MP.ln*i0;let e=c.jx||0;c.jx=0;if(c.pdn>0){e+=c.pd;c.pdn--}
{const np=Math.max(60,c.p*Math.exp(m+s+v+i0+e)),hi=pc*1.3,lo=pc*.7;c.lim=0;if(np>hi){c.jx+=Math.log(np/hi);c.p=hi;c.lim=1}else if(np<lo&&lo>60){c.jx+=Math.log(np/lo);c.p=lo;c.lim=-1}else c.p=np}const tot=Math.log(c.p/pc),q=Math.round(tot*RU),k=c.hn%DH,old=c.hn>=10?c.hr[(c.hn-10)%DH]:0;
c.hr[k]=q;c.hn++;c.s10=(c.s10==null?0:c.s10)+q-old;if(c.xv){(c.xvd=c.xvd||{})[S.day]=c.xv;c.xv=0}c.vd=vAt(c,S.day,tot,rm);
const w=c.wd,t=c.w10;w[0]=Math.round(m*1e4);w[1]=Math.round(s*1e4);w[2]=Math.round(v*1e4);w[3]=Math.round(i0*1e4);w[4]=Math.round(e*1e4);w[5]=Math.round(fl*1e4);for(let j=0;j<6;j++)t[j]=Math.round(t[j]*.9+w[j]);
c.c1=Math.exp(tot)-1;c.ch=Math.exp(c.s10/RU)-1;c.pc=c.p;return tot}
// ---------- daily closes / OHLC / volume rebuilt from the stored returns ----------
function mktRets(n){const o=S.IX.ALL,a=ringGet(o.lv,o.hn,n+1),out=new Array(n).fill(0),off=n+1-a.length;for(let j=1;j<a.length;j++)out[j-1+off]=Math.log(a[j]/a[j-1]);return out}
function dSeries(c,n){n=Math.min(n||DH,c.hn||0,DH);const r=ringGet(c.hr,c.hn,n),cl=new Array(n);let p=c.p;for(let j=n-1;j>=0;j--){cl[j]=p;p=p/Math.exp(r[j]/RU)}
const rm=mktRets(n),o=new Array(n),hi=new Array(n),lo=new Array(n),vol=new Array(n),d0=S.day-n+1,sd=Math.max(.008,c.sg+.006);
for(let j=0;j<n;j++){const pv=j?cl[j-1]:cl[j]/Math.exp(r[j]/RU),rr=r[j]/RU,dd=d0+j,h1=hsh(c.id,dd,1),h2=hsh(c.id,dd,2),h3=hsh(c.id,dd,3);
o[j]=pv*Math.exp(rr*(.15+.4*h1)+sd*.25*(h1-.5));hi[j]=Math.max(o[j],cl[j])*Math.exp(sd*.55*h2+Math.abs(rr)*.12*h2);lo[j]=Math.min(o[j],cl[j])*Math.exp(-sd*.55*h3-Math.abs(rr)*.12*h3);vol[j]=j===n-1&&c.vd?c.vd:vAt(c,dd,rr,rm[j])}
return{o,h:hi,l:lo,c:cl,v:vol,d0,n}}
function iSeries(o,n){n=Math.min(n||DH,o.hn||0,DH);const lv=ringGet(o.lv,o.hn,n).map(x=>x/100),tv=o.tv?ringGet(o.tv,o.hn,n):null,d0=S.day-n+1,op=[],hi=[],lo=[],sd=o.n.length;
for(let j=0;j<n;j++){const pv=j?lv[j-1]:lv[j],a=hsh(sd,d0+j,4),b=hsh(sd,d0+j,5),sp=Math.abs(lv[j]-pv)*.35+Math.abs(lv[j])*.003;op.push(pv+(lv[j]-pv)*.2*a);hi.push(Math.max(op[j],lv[j])+sp*a);lo.push(Math.min(op[j],lv[j])-sp*b)}
return{o:op,h:hi,l:lo,c:lv,v:tv,d0,n}}
function cSeries(m,n){n=Math.min(n||DH,m.hn||0,DH);const r=ringGet(m.hr,m.hn,n),cl=new Array(n);let p=m.p;for(let j=n-1;j>=0;j--){cl[j]=p;p=p/Math.exp(r[j]/RU)}
const o=[],hi=[],lo=[],d0=S.day-n+1,sd=m.k.length*7;for(let j=0;j<n;j++){const pv=j?cl[j-1]:cl[j],a=hsh(sd,d0+j,6),b=hsh(sd,d0+j,8),sp=Math.abs(cl[j]-pv)*.3+cl[j]*m.v*.25;o.push(pv+(cl[j]-pv)*.25*a);hi.push(Math.max(o[j],cl[j])+sp*a);lo.push(Math.min(o[j],cl[j])-sp*b)}
return{o,h:hi,l:lo,c:cl,v:null,d0,n}}
// ---------- history backfill so charts and statements are full from day one ----------
function bfill(){const T=DH,rm=[],rO=[],rG=[],rB=[];let h=8e-5,r=0;
for(let t=0;t<T;t++){h=Math.min(.0016,Math.max(2e-5,1.2e-6+.07*r*r+.91*h));r=.00012+Math.sqrt(h)*gzt();rm.push(r);rO.push(.021*.29*gzt());rG.push(.009*.29*gzt());rB.push(.038*.29*gzt())}
S.mk.h=Math.min(h,1.5e-4);const f=SEC.map((_,i)=>{const x=SX[i]||SX[0],a=[];for(let t=0;t<T;t++)a.push(i===HOLD?0:(.0022+.0006*x.v)*gzt()+(x.oil||0)*.3*rO[t]+(x.gold||0)*.55*rG[t]+(x.btc||0)*.3*rB[t]);return a});
const W=SEC.map(()=>new Array(T).fill(0)),WS=SEC.map(()=>new Array(T).fill(0)),L5=new Set(S.l50||[]),ag={},tv={};for(const k of ["ALL","L50","SML"]){ag[k]=new Array(T).fill(0);ag[k+"w"]=new Array(T).fill(0);tv[k]=new Array(T).fill(0)}
for(const c of S.co){if(c.dead)continue;coPrep(c);if(c.hn>=T)continue;const rs=[];for(let t=0;t<T;t++)rs.push(c.priv?0:c.be*rm[t]+f[c.i][t]+c.sg*gzt());
for(let t=0;t<T;t++)c.hr[t]=Math.round(rs[t]*RU);c.hn=T;c.pc=c.p;let s10=0;for(let t=T-10;t<T;t++)s10+=c.hr[t];c.s10=s10;c.ch=Math.exp(s10/RU)-1;
let p=c.p;const cl=new Array(T);for(let t=T-1;t>=0;t--){cl[t]=p;p/=Math.exp(c.hr[t]/RU)}
if(!c.priv){const w=mc(c),gk=L5.has(c.id)?"L50":"SML";for(let t=0;t<T;t++){const ww=w*cl[t]/c.p,rr=Math.exp(c.hr[t]/RU)-1;W[c.i][t]+=ww*rr;WS[c.i][t]+=ww;ag.ALL[t]+=ww*rr;ag.ALLw[t]+=ww;ag[gk][t]+=ww*rr;ag[gk+"w"][t]+=ww;
const vv=vAt(c,S.day-T+1+t,c.hr[t]/RU,rm[t])*cl[t]/1e4;tv.ALL[t]+=vv;tv[gk][t]+=vv}}
let mp=cl[0];c.hm=[];const mv=(.006+(c.sg||.015))*Math.sqrt(30);for(let k=0;k<24;k++){mp/=Math.exp(.004+mv*gzt()*.8);c.hm.unshift(Math.round(mp))}}
const fillIx=(k,ret,last)=>{const o=S.IX[k];if(!o)return;let lv=last;const a=new Array(T);for(let t=T-1;t>=0;t--){a[t]=lv;lv/=1+ret[t]}o.lv=a.map(x=>Math.round(x*100));o.hn=T;o.v=last;o.hm=[];let mp=a[0];for(let q=0;q<24;q++){mp/=Math.exp(.006+.045*gz());o.hm.unshift(+mp.toFixed(2))}};
for(const k of ["ALL","L50","SML"]){fillIx(k,ag[k].map((x,t)=>x/Math.max(1e-9,ag[k+"w"][t])),k==="ALL"?S.ix:S.IX[k].v);S.IX[k].tv=tv[k].map(Math.round)}
GRP.forEach((_,g)=>{const ret=new Array(T).fill(0),ws=new Array(T).fill(0);SEC.forEach((_,i)=>{if(grpOf(i)!==g)return;for(let t=0;t<T;t++){ret[t]+=W[i][t];ws[t]+=WS[i][t]}});fillIx("G"+g,ret.map((x,t)=>x/Math.max(1e-9,ws[t])),S.IX["G"+g].v)});
SEC.forEach((_,i)=>fillIx("S"+i,W[i].map((x,t)=>x/Math.max(1e-9,WS[i][t])),S.IX["S"+i].v));
{const o=S.IX.VIX;let hh=8e-5;const a=[];for(let t=0;t<T;t++){hh=1.2e-6+.07*rm[t]*rm[t]+.91*hh;a.push(Math.round(Math.sqrt(hh*360)*1e4))}o.lv=a;o.hn=T;o.v=a[T-1]/100}
for(const k of ["RATE","BOND","YS","YL","FXR","INF"]){const o=S.IX[k],v0=ixInit(k);if(!o)continue;o.lv=new Array(T).fill(Math.round(v0*100));o.hn=T;o.v=v0}
S.cm.forEach((m,j)=>{const rr=j===2?rO:j===0?rG:j===5?rB:null;for(let t=0;t<T;t++)m.hr[t]=Math.round((rr?rr[t]:m.v*.29*gzt())*RU);m.hn=T;m.pc=m.p});
S.ixh=ringGet(S.IX.ALL.lv,S.IX.ALL.hn,DH).filter((_,t)=>t%10===(DH-1)%10).map(x=>x/100).slice(-31);for(const c of S.co)if(!c.dead&&(!c.fq||!c.fq.length))qBack(c)}
// ---------- revenue model and quarterly statements ----------
function revQ(c){const x=SX[c.i]||SX[0];if(c.kd===1)return c.A*(S.prime+1.5)/400+c.A*.0015;if(c.kd===2)return c.A*.075/4+c.cs*Math.max(0,S.prime-2)/400;if(c.i===HOLD)return Math.max(0,c.cs*Math.max(0,S.prime-2)/400);
return Math.max(0,c.A*x.to/4*(1+2*(S.dg[c.i]-S.cg[c.i]))*(1+.03*hgn(c.id,13)))}
// record: [day,rev,op,rd,int exp,int inc,goodwill amort,equity-method,div income,tax,ni,div paid,capex growth,cash,A,gw,investments,D,bond,adv,shares,price,impairment,bank loan write-off]
const FQ=["d","rev","op","rd","it","ii","ga","eq","dr","tax","ni","dv","gr","cs","A","gw","pv","D","bond","pa","sh","p","imp","wo"],fqo=r=>{const o={};FQ.forEach((k,j)=>o[k]=r[j]);return o};
const r1=x=>Math.abs(x)>=10?Math.round(x):Math.round(x*10)/10;
// FIN-CF-02 share-issue cash ledger: every path that issues or buys back shares for cash, or takes a cash capital contribution, calls
// eqCash(company, cash really received (+) or paid (-)). The amount waits in c.eqq; earn() confirms it as c.isq[close day] just before the
// quarter record is pushed; fqDerive shows it as 증자·출자(자사주). Share-count changes without cash (splits, stock-merger consideration,
// founding) do not call it. Recording only: nothing in the simulation reads eqq / isq / isd.
function eqCash(c,x){if(c&&x&&isFinite(x))c.eqq=(c.eqq||0)+x}
// FIN-CF-03A acquisition / non-cash debt ledger. acqAdd(company, key, amount) adds to c.acq (created on first use), the record of the
// quarter that has not closed yet; earn() moves it to c.acr[close day] just before the quarter record is pushed; fqDerive takes the
// non-cash debt out of 차입 증감 and shows the acquisition cash on its own rows. Keys: aD / aP / aC = debt taken over / cash paid / cash
// brought in by an external acquisition, iD / iP / iC = the same for absorbing a company the acquirer already held more than 50% of
// directly, lD = LBO debt put on the target, hD = hidden debt found (hqQ). Unrounded amounts. c.acd = the day the ledger starts.
// Recording only: nothing in the simulation reads acq / acr / acd.
const ACQK=["aD","aP","aC","iD","iP","iC","lD","hD"];
function acqAdd(c,k,x){if(!c||!x||!isFinite(x))return;const p=c.acq||(c.acq={aD:0,aP:0,aC:0,iD:0,iP:0,iC:0,lD:0,hD:0});p[k]+=x}
function qPush(c,a){(c.fq=c.fq||[]).push(a.map((x,j)=>j===0||j===21?Math.round(x):r1(x)));if(c.fq.length>8)c.fq.shift();if(c.isq){const d0=c.fq[0][0];for(const k in c.isq)if(+k<d0)delete c.isq[k];if(!Object.keys(c.isq).length)delete c.isq}
if(c.acr){const d0=c.fq[0][0];for(const k in c.acr)if(+k<d0)delete c.acr[k];if(!Object.keys(c.acr).length)delete c.acr}}
function qBack(c){if(c.priv&&c.fo)return;const x=SX[c.i]||SX[0],g=x.dg||.03,rev0=revQ(c),pf=pfv(c);c.fq=[];delete c.rlf;c.cfd=S.day-720;delete c.isq;c.isd=S.day-720;
// FIN-CF-03A: the rebuilt rows are made from today's debt and cash, which already hold every deal before the save, so a deal still waiting
// in acq would be taken out of a debt change that does not contain it: drop it. Restoring a save (day > 0) starts the ledger today, so the
// first real quarter is marked partly recorded; a new game (day 0, no deal before it) keeps the start addCo gave.
delete c.acr;c.acq=null;if(S.day>0)c.acd=S.day;
for(let k=8;k>=1;k--){const sc=Math.exp(-g*k/4+.03*gz()),rev=rev0*sc,A=c.A*sc,opm=c.kd?.0035*c.A*sc:A*(SEC[c.i][1]+(S.dg[c.i]-S.cg[c.i])*.5)*(1+.22*gz()),
it=c.kd?0:loanOf(c)*sc*(S.prime+2)/400,ii=c.cs*sc*Math.max(0,S.prime-2)/400,pre=opm-it+ii,tax=Math.max(0,pre)*ctax(c),ni=pre-tax,dv=Math.max(0,ni)*c.pay,
p=closeAgo(c,k*90);qPush(c,[S.day-k*90,rev,opm,c.kd?0:A*(c.ps||0)*.0025,it,ii,0,0,0,tax,ni,dv,A*c.g/4,c.cs*sc,A,c.gw,pf*sc,c.D*sc,c.bond*sc,(c.pa||0),c.sh,p])}
c.eh=c.fq.map(r=>Math.round(r[10]*1e5/r[20])/10);c.est=c.eh.length?+(c.eh[c.eh.length-1]*(1+g/4)).toFixed(1):null}
function closeAgo(c,days){if(c.hr&&days<Math.min(DH,c.hn||0)){let s=0;for(let j=0;j<days;j++)s+=c.hr[(c.hn-1-j)%DH];return c.p/Math.exp(s/RU)}const hm=c.hm||[],k=hm.length-1-Math.floor((days-DH)/30);return hm[Math.max(0,Math.min(hm.length-1,k))]||c.p}
// ---------- earnings surprise vs consensus ----------
function surprise(c){const e1=c.ni*1e4/c.sh,est=c.est;let msg="";
if(est!=null&&!c.priv){const den=Math.max(Math.abs(est),Math.max(1,eq(c))*1e4/c.sh*.004),s=Math.max(-1.2,Math.min(1.2,(e1-est)/den)),k=Math.min(.2,Math.max(.06,(c.sg||.012)*9)),jp=Math.max(-.12,Math.min(.12,k*s+.006*hgn(c.id,9)));
c.jx=(c.jx||0)+jp;c.pd=.05*s/15;c.pdn=15;c.sur=+(s*100).toFixed(1);msg="EPS "+W(e1)+" (예상 "+W(est)+", "+(s>=0?"+":"")+(s*100).toFixed(0)+"%) → "+(jp>=0?"+":"")+(jp*100).toFixed(1)+"%"}
const h=(c.eh||[]).slice(-4),tr=h.length?h.reduce((a,b)=>a+b,0)/h.length:e1,gap=S.dg[c.i]-S.cg[c.i];c.est=+((.25*e1+.75*tr)*(1+c.g*.25+gap*1.5)*(1+.03*hgn(c.id,11))).toFixed(1);return msg}
// ---------- market commentary with reasons ----------
function wrap(kind,ret){const sf=kind==="w"?S.wk7:S.sf,live={};for(const c of S.co)if(!c.dead&&!c.priv)live[c.i]=1;const ix=SEC.map((s,i)=>[i,sf[i]]).filter(z=>z[0]!==HOLD&&live[z[0]]).sort((a,b)=>b[1]-a[1]),up=ix.slice(0,2),dn=ix.slice(-2).reverse(),M=S.mk;
const why=M.why||(Math.abs(S.mood)>.25?(S.mood>0?"투자심리 개선":"투자심리 위축"):ret>=0?"외국인·기관 매수세":"차익 실현 매물"),tx=([i,v])=>SEC[i][0]+" "+P1((Math.exp(v)-1)*100)+(kind==="d"&&S.sw[i]?"("+S.sw[i]+")":"");
L((kind==="w"?"🗞 주간 시황":"📊 시황")+": 종합 "+P1(ret*100)+" ("+S.ix.toFixed(1)+") — "+why+". 강세 "+up.map(tx).join(", ")+" / 약세 "+dn.map(tx).join(", "))}
// ---------- daily driver: called from step() ----------
function mktTick(dd){const cmr=S.cm.map(m=>{const r=Math.log(m.p/(m.pc||m.p));m.pc=m.p;m.hr[m.hn%DH]=Math.round(r*RU);m.hn++;return r});
const _g=_R;_R=wR(4);const rm=mktDay();secDay(cmr[2]||0,cmr[0]||0,cmr[5]||0,S.dPr||0);_R=_g;S.dPr=0;
const L5=new Set(S.l50),A=[0,0,0],Lg=[0,0,0],Sm=[0,0,0],gs=GRP.map(()=>[0,0]),ss=SEC.map(()=>[0,0]);
for(const c of S.co){if(c.dead)continue;if(dd%90===c.off){earn(c);if(c.dead)continue}const w0=(c.pc||c.p)*c.sh,tot=coDay(c,rm);
if(c.bh>0){const r=rating(c);if(r<6)S.cash+=c.bh*(c.cpn||S.prime+SPR[r]+1)/36000}if(c.sp>0)S.cash-=mc(c)*c.sp/100*.02/360;if(c.priv)continue;
const rr=Math.exp(tot)-1,tvv=(c.vd||0)*c.p/1e4,b=L5.has(c.id)?Lg:Sm;A[0]+=w0*rr;A[1]+=w0;A[2]+=tvv;b[0]+=w0*rr;b[1]+=w0;b[2]+=tvv;const g=gs[grpOf(c.i)],s=ss[c.i];g[0]+=w0*rr;g[1]+=w0;s[0]+=w0*rr;s[1]+=w0;
if(dd%30===0){(c.hm=c.hm||[]).push(Math.round(c.p));if(c.hm.length>60)c.hm.shift();if(c.xvd)for(const k in c.xvd)if(+k<dd-DH)delete c.xvd[k]}}
const ra=A[1]?A[0]/A[1]:0;S.ix*=1+ra;ixPush(S.IX.ALL,S.ix,A[2]);ixPush(S.IX.L50,S.IX.L50.v*(1+(Lg[1]?Lg[0]/Lg[1]:0)),Lg[2]);ixPush(S.IX.SML,S.IX.SML.v*(1+(Sm[1]?Sm[0]/Sm[1]:0)),Sm[2]);
GRP.forEach((_,g)=>{const o=S.IX["G"+g];ixPush(o,o.v*(1+(gs[g][1]?gs[g][0]/gs[g][1]:0)))});SEC.forEach((_,i)=>{const o=S.IX["S"+i];if(o)ixPush(o,o.v*(1+(ss[i][1]?ss[i][0]/ss[i][1]:0)))});
ixPush(S.IX.VIX,Math.sqrt(S.mk.h*360)*100);ixPush(S.IX.RATE,S.prime);ixPush(S.IX.BOND,S.bp);for(const k of ["YS","YL","FXR","INF"])if(S.IX[k])ixPush(S.IX[k],ixInit(k));
if(dd%30===0){for(const k of IXK()){const o=S.IX[k];o.hm.push(+o.v.toFixed(2));if(o.hm.length>60)o.hm.shift()}for(const m of S.cm){(m.hm=m.hm||[]).push(Math.round(m.p));if(m.hm.length>60)m.hm.shift()}if(dd%360===0)l50Upd()}
S.wkm+=Math.log(1+ra);if(Math.abs(ra)>=.015)wrap("d",ra);if(dd%7===0){wrap("w",Math.exp(S.wkm)-1);S.wk7=SEC.map(()=>0);S.wkm=0}}
