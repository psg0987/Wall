// ---- actions part 1: trading, finance, derivatives, commodities ----
const G={};
// sell pct of company c held by holder k at price-per-1% p1 (억). Handles partial basis & tax.
function sellK(c,k,pct,p1){const own=c.own[k]||0;pct=Math.min(pct,own);if(pct<=0)return 0;const full=c.bs[k]||0,b=full*pct/own;c.bs[k]=b;const net=payK(c,k,p1*pct);setOwn(c,k,own-pct);if(c.own[k])c.bs[k]=full-b;return net}
function covX(c,pct){pct=Math.min(pct,c.sp);if(pct<=0)return null;const cost=mc(c)*pct/100*(1+pct/100*1.5),sb=c.sb*pct/c.sp,g=sb-cost,t=Math.max(0,g)*.22;S.cash+=g-t;if(g>0)S.fl.sh=1;c.sp-=pct;c.sb-=sb;if(c.sp<.01){c.sp=0;c.sb=0}c.p*=1+pct/100*1.5;rec("환매",c,cost,"나");return g-t}
function settleX(c,m){settleNew(c,m);if(c.sp>0)covX(c,100);S.op=S.op.filter(o=>{if(o.i!==c.id)return true;S.cash+=o.nsh*Math.max(0,o.t==="C"?c.p*m-o.k:o.k-c.p*m)/1e4;return false})}
const cost1=(c,pct)=>mc(c)*pct/100*(1+pct/100*.8)*1.01;
function afterCtl(c,was){ctlAll();if(was!=="P"&&mine(c)){if(was&&was[0]==="r")S.fl.steal=1;if(S.apAll)c.ap=1;L("🏆 "+c.tk+" 경영권 확보! ("+eName(S.te)+" 명의)",1);return 1}if(was==="P"&&!mine(c)){L("⚠ "+c.tk+" 경영권을 잃었습니다",1);return 1}return 0}
G.buy=(i,pct)=>{const c=S.co[i],e=teOK(),k=eKey(e);if(c.dead||c.priv)return;if(e===i)return toast("자기 회사 주식은 경영 메뉴의 '자사주 매입'을 쓰세요");
pct=Math.min(pct,pub(c)-c.sp-4);if(pct<=.05)return toast("시장에 남은 물량이 부족합니다");const x=cost1(c,pct);
if(!ePay(e,x))return toast("자금 부족: 필요 "+F(x)+", "+eName(e)+" 가용 "+F(eAvail(e)));const was=c.ctl;
setOwn(c,k,(c.own[k]||0)+pct);c.bs[k]=(c.bs[k]||0)+x;c.p*=1+pct/100*1.5*frX(c);c.xv=(c.xv||0)+c.sh*pct/100;rec("매수",c,x);if(!afterCtl(c,was))toast(c.tk+" "+pct.toFixed(1)+"% 매수 ("+F(x)+", "+eName(e)+")");render()};
G.ctrl=i=>{const c=S.co[i],n=Math.max(20,topRival(c,"P")+1)-grp(c,"P");if(mine(c))return toast("이미 경영권이 있습니다");G.buy(i,Math.max(.5,n))};
G.buyMax=i=>{const c=S.co[i],e=teOK();let lo=0,hi=Math.max(0,pub(c)-c.sp-4);const a=eAvail(e);if(cost1(c,hi)<=a)return G.buy(i,hi);for(let k=0;k<30;k++){const m=(lo+hi)/2;cost1(c,m)<=a?lo=m:hi=m}if(lo<.1)return toast("자금 부족");G.buy(i,lo)};
G.sell=(i,pct)=>{const c=S.co[i],e=teOK(),k=eKey(e),own=c.own[k]||0;if(c.priv)return toast("비상장 회사는 상장하거나 청산해야 팔 수 있어요");if(own<=0)return toast(eName(e)+" 명의 보유 지분이 없습니다");
pct=Math.min(pct,own);const was=c.ctl,p1=mc(c)/100*(1-pct/100*1.2)*.99,net=sellK(c,k,pct,p1);c.p*=1-pct/100*2.5;c.xv=(c.xv||0)+c.sh*pct/100;rec("매도",c,p1*pct);if(!afterCtl(c,was))toast(c.tk+" 매도 "+F(net)+" 수령 ("+eName(e)+")");render()};
G.short=(i,pct)=>{const c=S.co[i];if(c.priv||c.dead)return;pct=Math.min(pct,pub(c)-c.sp-4);if(pct<=0)return toast("공매도할 물량이 없습니다");
const x=mc(c)*pct/100*(1-pct/100*1.2),sv=S.co.reduce((a,z)=>a+(z.sp>0&&!z.dead?mc(z)*z.sp/100:0),0)+x;if(nw()<sv*.5)return toast("증거금 부족: 순자산이 공매도 평가액의 50% 이상이어야 해요");
c.sp+=pct;c.sb+=x;c.p*=1-pct/100*1.2;rec("공매도",c,x,"나");toast(c.tk+" "+pct+"% 공매도 ("+F(x)+")");render()};
G.cover=(i,pct)=>{const c=S.co[i],r=covX(c,pct);if(r==null)return toast("공매도 포지션이 없습니다");toast(c.tk+" 환매 손익 "+F(r));render()};
G.gbuy=x=>{if(!ePay("P",x*S.bp/100*1.002))return toast("자금 부족");S.gb+=x;rec("국채 매수",null,x,"나");toast("국채 "+F(x)+" 매수");render()};
G.gsell=x=>{x=Math.min(x,S.gb);if(x<=0)return toast("보유 국채가 없습니다");S.cash+=x*S.bp/100*.998;S.gb-=x;rec("국채 매도",null,x,"나");render()};
G.bbuy=(i,x)=>{const c=S.co[i];if(c.dead||c.priv)return;x=Math.min(x,bondSpace(c));if(x<=0)return toast(c.bond>0?"시장에 남은 회사채가 없습니다":"이 회사는 발행한 회사채가 없습니다");if(!ePay("P",x*bd(c)*1.003))return toast("자금 부족");c.bh+=x;rec("회사채",c,x*bd(c),"나");toast(c.tk+" 회사채 "+F(x)+" 매수 (수익률 약 "+(S.prime+SPR[rating(c)]+1).toFixed(1)+"%)");render()};
G.bsell=(i,x)=>{const c=S.co[i];x=Math.min(x,c.bh);if(x<=0)return toast("보유 회사채가 없습니다");S.cash+=x*bd(c)*.997;c.bh-=x;render()};
const optPx=(c,t,d,m)=>c.sh*.01*bs(c.p,c.p*m,d/360,c.vol*9,S.prime/100,t==="C")/1e4*1.05;
G.opt=(i,t,d,m)=>{const c=S.co[i];if(c.dead||c.priv)return;if(S.op.length>=20)return toast("옵션은 최대 20건까지 보유할 수 있어요");const pr=optPx(c,t,d,m);
if(!ePay("P",pr))return toast("프리미엄이 부족합니다: "+F(pr));S.op.push({i,t,k:c.p*m,nsh:c.sh*.01,exp:S.day+d,pr});rec(t==="C"?"콜옵션":"풋옵션",c,pr,"나");toast("옵션 매수 "+F(pr));render()};
G.oclose=n=>{const o=S.op[n];if(!o)return;const v=opv(o)*.97;S.cash+=v;if(v>o.pr)S.fl.op=1;S.op.splice(n,1);render()};
G.fut=q=>{const n=S.ft.q+q;if(Math.abs(n)*S.ix*.2>S.cash+pRoom()&&Math.abs(n)>Math.abs(S.ft.q))return toast("증거금이 부족합니다");S.cash-=Math.abs(q)*S.ix*.001;S.ft.q=n;S.ft.lx=S.ix;toast("지수선물 "+(n>0?"매수 ":n<0?"매도 ":"")+Math.abs(n)+"계약");render()};
G.cbuy=(j,x)=>{const m=S.cm[j];if(!ePay("P",x*1.005))return toast("자금 부족");m.h+=x*1e8/m.p;m.b+=x*1.005;rec(m.n+" 매수",{tk:m.k},x,"나");toast(m.n+" "+F(x)+" 매수");render()};
G.csell=(j,f)=>{const m=S.cm[j];if(m.h<=0)return toast("보유 수량이 없습니다");const u=m.h*f,x=u*m.p/1e8*.995,b=m.b*f,g=x-b,t=g>0?g*.22:0;if(g>0)S.fl.cm=1;S.cash+=x-t;m.h-=u;m.b-=b;if(m.h<1e-9){m.h=0;m.b=0}rec(m.n+" 매도",{tk:m.k},x,"나");toast(m.n+" 매도 "+F(x-t));render()};
G.wl=i=>{const k=S.wl.indexOf(i);k<0?S.wl.push(i):S.wl.splice(k,1);render()};
G.alert=(i,pc)=>{if(S.al.length>=30)return toast("알림은 최대 30개");const c=S.co[i];S.al.push({i,d:pc>0?1:-1,px:c.p*(1+pc/100)});toast("알림 설정: "+W(c.p*(1+pc/100)));render()};
G.borrow=x=>{x=Math.min(x,pRoom());if(x<=0)return toast("개인 대출 한도를 다 썼습니다");S.loan+=x;S.cash+=x;render()};
G.repay=x=>{x=Math.min(x,S.loan,S.cash);if(x<=0)return toast("갚을 현금이나 대출이 없습니다");S.cash-=x;S.loan-=x;render()};
G.cborrow=(i,x)=>{const c=S.co[i];if(!mine(c))return;x=Math.min(x,cRoom(c));if(x<=0)return toast(c.tk+" 대출 한도가 없습니다");c.D+=x;c.cs+=x;L(c.tk+" 은행 차입 "+F(x),1);render()};
G.crepay=(i,x)=>{const c=S.co[i];if(!mine(c))return;x=Math.min(x,c.cs,c.kd?c.D:loanOf(c));if(x<=0)return toast("갚을 현금이나 은행 대출이 없습니다");c.cs-=x;c.D-=x;L(c.tk+" 부채 상환 "+F(x),1);render()};
G.adv=(i,x)=>{const c=S.co[i];if(!mine(c))return;if(x>0){if(!ePay("P",x))return toast("개인 자금 부족");c.cs+=x;if(c.own.P)c.bs.P=(c.bs.P||0)+x;L("개인 자금 "+F(x)+"을 "+c.tk+"에 자본 투입",1)}render()};
G.setTE=e=>{S.te=e;teOK();closeMd();toast("거래 주체: "+eName(S.te));render()};
