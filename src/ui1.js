// ---- UI part 1: building blocks + stock sheet ----
const B=(t,f,c,dis)=>`<button class="${c||""}" onclick="${f}"${dis?" disabled":""}>${t}</button>`;
const col=()=>{const r=document.documentElement.style;if(S.us){r.setProperty("--up","#12b76a");r.setProperty("--dn","#f04438")}else{r.removeProperty("--up");r.removeProperty("--dn")}};
function spark(h,w,ht){w=w||100;ht=ht||26;if(h.length<2)return"";const mx=Math.max(...h),mn=Math.min(...h),p=h.map((v,i)=>(i*w/(h.length-1)).toFixed(1)+","+(ht-2-(v-mn)/(mx-mn||1)*(ht-4)).toFixed(1)).join(" ");return `<svg width="${w}" height="${ht}" viewBox="0 0 ${w} ${ht}" aria-hidden="true"><polyline fill="none" stroke="${h[h.length-1]>=h[0]?"var(--up)":"var(--dn)"}" stroke-width="2" points="${p}"/></svg>`}
function obar(c){const me=grp(c,"P"),ot=Math.max(0,held(c)-me);return `<div class="bar"><i style="width:${me}%;background:var(--gold)"></i><i style="width:${ot}%;background:var(--bad)"></i></div>`}
const logo=c=>`<div class="lg" style="background:hsl(${c.i*26+200},38%,${c.kd?26:32}%)">${esc(c.tk.slice(0,2))}</div>`;
function badges(c){return(mine(c)?'<span class="bd me">내 지배</span>':c.ctl&&c.ctl[0]==="r"?'<span class="bd rv">라이벌</span>':"")+(c.priv?'<span class="bd">비상장</span>':"")+(c.lim>0&&!c.priv?'<span class="bd rv">상한가</span>':c.lim<0&&!c.priv?'<span class="bd" style="background:var(--dn);color:#fff">하한가</span>':"")}
function row(c,mode){const p=chg(c)*100,u=p>=0;let sub;
if(mode==="h")sub=F(val(c))+" · 직접 "+c.own.P.toFixed(1)+"%"+(grp(c,"P")>c.own.P+.05?" (그룹 "+grp(c,"P").toFixed(1)+"%)":"");
else sub=esc(c.n)+(grp(c,"P")>0?" · 그룹 "+grp(c,"P").toFixed(0)+"%":"");
return `<div class="rw" onclick="G.pick(${c.id})">${logo(c)}<div class="nm"><b>${esc(c.tk)}</b>${badges(c)}<div class="mu">${sub}</div></div><div class="r"><span class="pl ${u?"u":"d"}" data-pp="${c.id}">${W(c.p)}</span><div class="mu num ${u?"up":"dn"}" data-pc="${c.id}">${P1(p)}</div></div></div>`}
function income(){let d=0;for(const c of S.co)if(c.own.P&&!c.dead)d+=Math.max(0,c.ni)*c.pay*c.own.P/100*.6/90;return d+ceoDay()-S.loan*(S.prime+1.5)/36500-2/90+gbv()*(S.yL||S.prime-2)/36000}
function candles(c,w,h){w=w||300;h=h||110;const n=c.hist.length;if(n<3)return'<div class="mu">차트는 시간이 지나면 쌓입니다 (10일 봉)</div>';let mx=0,mn=1e15;for(let k=1;k<n;k++){mx=Math.max(mx,c.hl[k][0]);mn=Math.min(mn,c.hl[k][1])}
const y=v=>h-4-(v-mn)/(mx-mn||1)*(h-8),bw=w/(n-1);let s="";for(let k=1;k<n;k++){const o=c.hist[k-1],cl=c.hist[k],co=cl>=o?"var(--up)":"var(--dn)",x=(k-.5)*bw;
s+=`<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${y(c.hl[k][0]).toFixed(1)}" y2="${y(c.hl[k][1]).toFixed(1)}" stroke="${co}"/><rect x="${(x-bw*.3).toFixed(1)}" width="${(bw*.6).toFixed(1)}" y="${y(Math.max(o,cl)).toFixed(1)}" height="${Math.max(1,Math.abs(y(o)-y(cl))).toFixed(1)}" fill="${co}"/>`}
return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" aria-label="주가 차트">${s}</svg><div class="mu">10일 봉 · 최근 ${n-1}개 · 고가 ${W(mx)} · 저가 ${W(mn)}</div>`}
function holders(c){const g={};for(const k in c.own){const r=root(k);(g[r]=g[r]||[]).push([k,c.own[k]])}
const rows=Object.keys(g).map(r=>[r,g[r].reduce((a,x)=>a+x[1],0),g[r]]).sort((a,b)=>b[1]-a[1]).slice(0,6);
return rows.map(([r,t,l])=>`<div class="row" style="padding:3px 0"><span>${r==="P"?'<b class="gd">내 그룹</b>':esc(rootName(r))}${r===c.ctl?' <span class="bd '+(r==="P"?"me":"rv")+'">경영권</span>':""}<span class="mu"> ${l.length>1||l[0][0]!==r?l.map(([k,v])=>esc(hName(k))+" "+v.toFixed(1)+"%").join(", "):""}</span></span><b class="num">${t.toFixed(1)}%</b></div>`).join("")+`<div class="row mu" style="padding:3px 0"><span>일반 투자자</span><span class="num">${pub(c).toFixed(1)}%</span></div>`}
function entLine(){const e=teOK();return `<div class="row" style="margin:6px 0"><span class="mu">거래 주체 <b class="gd">${esc(eName(e))}</b> · 가용 ${F(eAvail(e))}</span>${B("바꾸기","G.pickTE()")}</div>`}
// ---- v8 UI: tabbed company sheet, screener, asset market, loan book, missions, news filter ----
const nxe=c=>(c.off-S.day%90+90)%90||90;
const lnm=c=>c.kd?"-":S.co[c.ln]&&!S.co[c.ln].dead?S.co[c.ln].tk:"없음";
const dyv=c=>c.pay*Math.max(0,c.ni)*4/Math.max(1,mc(c))*100;
const pe=c=>{const e=c.ni*4e4/c.sh;return e>0?c.p/e:999};
function sheet(i){const c=S.co[i],r=rating(c),m=mine(c),e=teOK(),pc=chg(c)*100,tabs=[["o","개요"]];
if(!c.priv)tabs.push(["t","매매"]);if(m)tabs.push(["m","경영"]);if(!c.priv&&!m&&e!==i)tabs.push(["a","인수"]);tabs.push(["f","재무"]);if(!tabs.some(t=>t[0]===stab))stab="o";
return `<div class="row"><span style="min-width:0"><b style="font-size:21px">${esc(c.tk)}</b>${badges(c)} <span class="mu">${esc(c.n)}</span></span><span class="bs" style="margin:0;flex:none">${B(S.wl.includes(i)?"★":"☆",`G.wl(${i})`)}${B("닫기","G.pick(-1)")}</span></div>
<div class="mu">${SEC[c.i][0]} · ${TN[tn(c)]}주${c.i===HOLD?"":" · 점유율 "+(share(c)*100).toFixed(0)+"%"} · 신용 ${RT[r]}${c.cty!=null?" · "+CTRY[c.cty][0]+" 법인":""}${c.sz>S.day?" · 시즈닝 "+(c.sz-S.day)+"일":""} · 경영권: ${esc(rootName(c.ctl))}${c.pill>S.day?" · 포이즌 필":""}${c.frz?" · 신용 동결":""}</div>
${c.priv?`<div class="row" style="margin-top:6px"><b class="big" style="font-size:26px">비상장</b><span class="mu num" style="text-align:right">자본 ${F(eq(c))}</span></div>`:`<div class="row" style="margin-top:6px"><b id="sp1" class="big ${pc>=0?"up":"dn"}" style="font-size:28px">${W(c.p)}</b><span id="sp2" class="mu num" style="text-align:right">오늘 ${P1((c.c1||0)*100)} · 10일 ${P1(pc)}<br>시총 ${F(mc(c))}</span></div>`}
<div class="stw"><div class="stb">${tabs.map(([k,t])=>B(t,`G.stab('${k}')`,"t-"+k+(stab===k?" on":""))).join("")}</div></div>`+(stab==="t"?sTr(c,i):stab==="m"?sMg(c,i):stab==="a"?sAq(c,i):stab==="f"?sFi(c,i):sOv(c,i))}
function sTr(c,i){const e=teOK(),eo=c.own[eKey(e)]||0,r=rating(c);
return `${entLine()}<div class="mu">${esc(eName(e))} 명의 보유 ${eo.toFixed(2)}%${e===i?" · 자기 회사 주식은 경영 탭의 자사주 매입을 쓰세요":""}</div><div class="bs">`+[1,5,10,20].map(n=>B("+"+n+"%",`G.buy(${i},${n})`)).join("")+B("경영권까지",`G.ctrl(${i})`,"p",mine(c))+B("최대",`G.buyMax(${i})`)+B("% 직접",`G.tq(${i},'b')`)+`</div><div class="bs">`+[1,5,25].map(n=>B("-"+n+"%",`G.sell(${i},${n})`,"",!eo)).join("")+B("전량 매도",`G.sell(${i},100)`,"",!eo)+B("% 직접",`G.tq(${i},'s')`,"",!eo)+`</div>
<h4>개인 투자 (나 명의)</h4><div class="mu">공매도 · 연 2% 대차 수수료 · 순자산이 공매도 평가액의 1/3 아래면 강제 환매</div><div class="bs">`+[1,5,10].map(n=>B("공매도 "+n+"%",`G.short(${i},${n})`,"d")).join("")+B("공매도 직접",`G.tq(${i},'x')`,"d")+(c.sp>0?B("전량 환매",`G.cover(${i},100)`):"")+`</div>
<div class="mu" style="margin-top:10px">${c.bond>0?`회사채 · ${RT[r]} · 쿠폰 ${c.cpn.toFixed(1)}% · 가격 ${(bd(c)*100).toFixed(0)} · 수익률 약 ${(c.cpn/bd(c)).toFixed(1)}% · 시장 잔량 ${F(bondSpace(c))}`:"이 회사는 발행한 회사채가 없습니다."}</div>${c.bond>0||c.bh>0?`<div class="bs">${B("+10억",`G.bbuy(${i},10)`,"",!bondSpace(c))}${B("+50억",`G.bbuy(${i},50)`,"",!bondSpace(c))}${c.bh>0?B("보유분 매도 ("+F(c.bh)+")",`G.bsell(${i},1e9)`):""}</div>`:""}
<div class="mu" style="margin-top:10px">옵션 · 행사가·만기·규모를 골라 사거나 쓸 수 있어요 (아래는 1% 빠른 매수)</div><div class="bs">${B("옵션 매수 (체인)",`G.otk(${i},'b')`,"p")}${B("옵션 쓰기 (매도)",`G.otk(${i},'w')`)}${(S.l50||[]).includes(i)?B("주식선물",`G.dvGo('f','S:${i}')`):""}</div><div class="bs">`+[["C",30,1,"콜 30일"],["C",90,1.1,"콜 90일 +10%"],["P",30,1,"풋 30일"],["P",90,.9,"풋 90일 -10%"]].map(([t,d,mm,l])=>B(l+" · "+F(optPx(c,t,d,mm)),`G.opt(${i},'${t}',${d},${mm})`)).join("")+`</div>
<div class="mu" style="margin-top:10px">가격 알림</div><div class="bs">`+[10,-10,25,-25].map(n=>B((n>0?"+":"")+n+"%",`G.alert(${i},${n})`)).join("")+`</div>`}
function sMg(c,i){const ok=ownerK(c);let h=mg12(c,i)+`<div class="bs">${S.te===i?B("거래 주체 선택됨 · 나로 되돌리기","G.setTE('P')","on"):B("이 회사를 거래 주체로",`G.setTE(${i})`)}${B("자금 이동",`G.mvOpen(${i})`)}${B("이름·티커 변경",`G.rename(${i})`)}${B("자동 경영: "+(c.ap?"켜짐":"꺼짐"),`G.ap(${i})`,c.ap?"on":"")}</div>${c.ap?`<div class="mu" style="margin-top:4px">분기마다 성장률·배당·투자를 알아서 조정합니다. 직접 바꿔도 다음 분기에 다시 조정돼요.</div>`:""}
<div class="mu" style="margin-top:10px">배당성향</div><div class="bs">`+[0,.3,.6,1].map(v=>B(v*100+"%",`G.mg(${i},'pay',${v})`,c.pay===v?"on":"")).join("")+B("직접 "+Math.round(c.pay*100)+"%",`G.adj(${i},'pay')`,[0,.3,.6,1].includes(c.pay)?"":"on")+`</div>`+(c.i===HOLD?`<div class="mu" style="margin-top:8px;line-height:1.6">지주회사는 사업 자산이 없어 성장률·R&D가 없습니다. 현금으로 다른 회사 지분을 사거나, 자산 매물 시장에서 사업 자산을 사서 그 업종 회사가 될 수 있어요.</div>`:`<div class="mu" style="margin-top:8px">성장률 (사업자산 증가 · 업종 설비 증가율에 반영)</div><div class="bs">`+[-.1,0,.04,.1,.2].map(v=>B(Math.round(v*100)+"%",`G.mg(${i},'g',${v})`,c.g===v?"on":"")).join("")+B("직접 "+Math.round(c.g*100)+"%",`G.adj(${i},'g')`,[-.1,0,.04,.1,.2].includes(c.g)?"":"on")+`</div>`)+
(c.kd||c.i===HOLD?"":`<div class="mu" style="margin-top:8px">${PSN(c.i)} (연간, 사업자산 대비) · 지금 효율 +${((c.q||0)*400).toFixed(1)}%p</div><div class="bs">`+[0,1,2,3].map(v=>B(v+"%",`G.ps(${i},${v})`,(c.ps||0)===v?"on":"")).join("")+B("직접 "+(c.ps||0)+"%",`G.adj(${i},'ps')`,[0,1,2,3].includes(c.ps||0)?"":"on")+`</div><div class="mu">당장은 이익이 줄지만 몇 분기 뒤 수익성이 올라갑니다. 투자를 멈춰도 효과는 천천히 사라집니다.</div>`)+
`<div class="bs" style="margin-top:8px">`+B("경영진 교체 (2억)",`G.mg(${i},'mgr')`)+B("구조조정",`G.mg(${i},'rs')`)+B(S.ceo===i?"CEO 사임 · 연봉 "+F(ceoSal(c)):"내가 CEO 취임 · 연봉 "+F(ceoSal(c)),`G.mg(${i},'ceo')`)+(c.priv?"":B("공모 유상증자",`G.adj(${i},'iss')`)+B("자사주 매입",`G.adj(${i},'bb')`)+B("포이즌 필 (5억)",`G.mg(${i},'pill')`))+B("남는 현금으로 부채 상환: "+(c.sweep===2?"켜짐":"꺼짐"),`G.mg(${i},'sw')`)+B("차입 특별배당",`G.mg(${i},'xd')`,"d")+`</div>
<h4>자금 조달</h4><div class="mu" style="line-height:1.6">현금 ${F(c.cs)} · 부채 ${F(c.D)} (은행 ${F(loanOf(c))} · 회사채 ${F(c.bond)} · 내 대여금 ${F(c.pa||0)}) · 은행 대출 여력 ${F(cRoom(c))}${c.frz?" · 신용 동결됨":""}</div>
<div class="bs">${B("은행 차입 +50억",`G.cborrow(${i},50)`)}${B("+200억",`G.cborrow(${i},200)`)}${B("상환 50억",`G.crepay(${i},50)`)}${B("전액 상환",`G.crepay(${i},1e9)`)}${B("금액 직접",`G.adj(${i},'borrow')`)}${B("상환 직접",`G.adj(${i},'repay')`)}</div>`+
(c.kd?"":c.bond>0?`<div class="mu" style="margin-top:8px">회사채 ${F(c.bond)} · 쿠폰 ${c.cpn.toFixed(1)}% · 만기 ${Math.max(0,(c.bmat-S.day)/360).toFixed(1)}년 · 시장가 ${(bd(c)*100).toFixed(0)}</div><div class="bs">${B("조기 상환 (시장가, 최대 105)",`G.bcall(${i})`)}</div>`:`<div class="mu" style="margin-top:8px">회사채 발행 · 10년 고정금리, 은행 한도와 따로 빌릴 수 있어요. 지금 쿠폰 약 ${(S.prime+SPR[rating(c)]+1).toFixed(1)}%</div><div class="bs">${B("자본의 20% 발행",`G.bissue(${i},.2)`)}${B("40% 발행",`G.bissue(${i},.4)`)}${B("직접 정하기",`G.adj(${i},'bond')`)}</div>`)+
(c.priv?"":`<div class="mu" style="margin-top:8px">사모 유상증자 · 거래 주체(${esc(eName(teOK()))})에게 신주를 배정해 지분을 굳힙니다</div><div class="bs">`+[5,10,20].map(p=>B(p+"% · "+F(c.sh*p/(100-p)*c.p*.98/1e4),`G.pp(${i},${p})`)).join("")+B("직접",`G.adj(${i},'pp')`)+B("백기사 배정",`G.adj(${i},'wk')`)+`</div>`)+
`<div class="mu" style="margin-top:8px">개인 자금 · 출자(100% 소유 회사만)는 지분 가치로, 대여는 기준금리 이자를 받는 채권으로 남습니다</div><div class="bs">${B("금액 정해서 옮기기",`G.mvOpen(${i})`,"p")}${(c.own.P||0)>=99.9?B("출자 50억",`G.adv(${i},50)`):""}${B("대여 50억",`G.advP(${i},50)`)}${B("대여 200억",`G.advP(${i},200)`)}${c.pa?B("대여금 회수",`G.advR(${i})`):""}</div>`;
if(!c.kd){const myb=banks().filter(b=>mine(b)&&b.id!==c.ln),lb=S.co[c.ln];h+=`<h4>사업 자산</h4><div class="mu">사업자산 ${F(c.A)} · 팔면 업종 설비가 줄어듭니다 (매각 비용 10%)</div><div class="bs">${B("10% 매각",`G.asell(${i},.1)`)}${B("25% 매각",`G.asell(${i},.25)`)}${B("직접",`G.adj(${i},'asell')`)}${B("자산 매물 시장","G.pg('fs')")}</div>
<h4>거래 은행</h4><div class="mu">${esc(lnm(c))}${lb&&lb.ctl&&lb.ctl[0]==="r"?" · 라이벌이 지배하는 은행이라 대출을 회수당할 수 있어요":lb&&mine(lb)?" · 내 은행":""}</div>`+(myb.length?`<div class="bs">`+myb.map(b=>B(esc(b.tk)+"(내 은행)으로 변경",`G.chbank(${i},${b.id})`)).join("")+`</div>`:"")}
if(c.kd===1){const bo=S.co.filter(x=>!x.dead&&x.ln===i);h+=`<h4>은행 업무</h4><div class="mu">대출 고객 ${bo.length}곳 · 대출 ${F(bo.reduce((a,x)=>a+loanOf(x),0))} · 신용 BB 이하 ${bo.filter(x=>rating(x)>=4).length}곳</div><div class="bs">${B("대출 장부 · 회수·동결",`G.loanbook(${i})`,"p")}</div>`}
const sub=Object.keys(c.pos).map(t=>S.co[t]).filter(x=>!x.dead&&x.own["c"+i]);if(sub.length)h+=`<h4>보유 지분 · 스핀오프</h4>`+sub.map(x=>`<div class="row" style="padding:5px 0"><span onclick="G.pick(${x.id})"><b>${esc(x.tk)}</b> <span class="mu">${x.own["c"+i].toFixed(1)}% · ${F(hv(x,x.own["c"+i]))}</span></span>${B("스핀오프",`G.spin(${i},${x.id})`)}</div>`).join("");
if(c.priv&&ok&&root(ok)==="P")h+=`<h4>비상장 회사</h4><div class="mu">100% 소유주: ${esc(hName(ok))}. ${c.sz>S.day?"시즈닝이 끝나는 "+(c.sz-S.day)+"일 뒤":"180일이 지나면"} 40%를 팔아 상장할 수 있고, 언제든 청산할 수 있습니다.${ok!=="P"?" 모회사 명의 청산은 비과세 흡수입니다.":""}</div><div class="bs">${B("상장 (40% 매각)",`G.ipoMy(${i})`,"p")}${B(ok==="P"?"청산 (예상 "+F(c.A*.88+c.cs+pfv(c)*.97-c.D)+")":"모회사에 흡수 청산",`G.liq(${i})`,"d")}</div>`;return h}
function sAq(c,i){const e=teOK(),ek=eKey(e),ac=e!=="P"?S.co[e]:null,own=c.own[ek]||0,base=mc(c)*(100-own)/100;
let h=`${entLine()}<h4>공개매수</h4><div class="mu">남은 주식 전부를 현금으로 삽니다. 프리미엄 20% 미만은 거절되기 쉽고, 외부 대주주가 10% 이상이면 35% 이상이 필요합니다.</div><div class="bs">`+[20,35,50].map(v=>B("+"+v+"% · "+F(base*(1+v/100)),`G.tender(${i},${v})`,"p")).join("")+B("프리미엄 직접",`G.aq(${i},'t')`)+`</div>`;
if(!c.kd)h+=`<h4>LBO</h4><div class="mu">30%만 내고 70%는 이 회사가 빚을 져서 지급합니다.</div><div class="bs">`+[35,50].map(v=>B("LBO +"+v+"% · "+F(base*(1+v/100)*.3),`G.tender(${i},${v},1)`)).join("")+B("프리미엄 직접",`G.aq(${i},'l')`)+`</div>`;
if(ac&&!ac.priv)h+=`<h4>주식교환 합병 (${esc(ac.tk)}가 신주 발행)</h4>`+[15,25,40,60].map(v=>{const q=mQuote(ac,c,v);return `<div class="row" style="padding:5px 0"><span class="mu">프리미엄 ${v}% · 예상 찬성 ${Math.min(99,q.yes).toFixed(0)}% · 합병 후 내 그룹 ${q.my.toFixed(1)}%</span>${B("제안",`G.merge(${i},${v})`,q.yes>50?"p":"")}</div>`}).join("")+`<div class="bs">${B("프리미엄 직접 정하기",`G.aq(${i},'m')`)}</div>`;
else h+=`<div class="mu" style="margin-top:10px">주식교환 합병과 소송은 내가 지배하는 상장사를 거래 주체로 골라야 할 수 있어요.</div>`;
if(own>=8)h+=`<h4>그린메일</h4><div class="mu">${esc(eName(e))} 지분 ${own.toFixed(1)}%를 회사가 프리미엄 25%에 되사도록 압박 (성공 확률 ${Math.min(80,own*4).toFixed(0)}%)</div><div class="bs">${B("그린메일 요구",`G.gm(${i})`,"p")}</div>`;
if(ac)h+=`<h4>소송 (${esc(ac.tk)} 명의)</h4><div class="bs">${B("독점금지 소송 (3억)",`G.sue(${i},'at')`,"",ac.i!==c.i||share(c)<.2)}${B("괴롭힘 소송 (2억)",`G.sue(${i},'hr')`,"d")}</div>`;
return h+`<h4>하드볼</h4><div class="bs">${B("하락 루머 퍼뜨리기 (주목도 +8)",`G.rumor(${i})`,"d")}</div>`}
// ---- v11 financial statements: 8 quarters of income statement, balance sheet, cash flow, ratios with industry comparison ----
let fseg=0;G.fseg=n=>{fseg=n;render()};
const fqL=c=>(c.fq||[]).map(fqo);
// operating cash flow adds back the non-cash charges inside net income: goodwill amortization, depreciation, asset
// impairment (imp) and bank loan write-off (wo, RT-BANK-001-R1); records from before those fields read them as 0.
// '기타·투자 매매' (oth) is what is left of the cash change, so it follows automatically.
// Chapter-11 debt relief moves the debt without any cash (FIN-CF-01): ch11x queues the signed amount R = debt before - debt after
// in c.ncq, earn() confirms it as c.rlf={d,R} just before the quarter record is pushed, and the quarter whose date is exactly
// rlf.d takes it out of the borrowing line (cff = dD + R - dv + iss), so oth no longer absorbs it. A record from before the ledger
// existed (quarter that began before c.cfd, the day the company's ledger started) of a company with a chapter-11 history whose quarter-end equity is about 15% of assets
// (what the reset leaves behind) may hold an unrecorded relief: it is never given an estimated R, the display says 'unconfirmed' (d.unk).
// Share issues, buybacks and cash capital contributions (FIN-CF-02): iss is the cash the company really received or paid, from the ledger
// c.isq[row day] (see eqCash in sim.js), for every quarter whose previous row is AFTER c.isd (the day the company's issue ledger started).
// A previous row ON that day closed before the save was loaded (the first close after loading is the next day), so a trade made after that
// close on the same day, before the save, is missing from the ledger: such a quarter is treated as an older row.
// Splits and stock-merger shares move no cash, so they add nothing. An older row (saved before the ledger) whose share count changed keeps the
// old estimate, share-count change x close price, and is flagged est: the tab shows it with '≈' and a footnote. A row whose share count did
// not change takes the ledger amount (a contribution recorded after loading) or 0.
// Acquisitions and non-cash debt (FIN-CF-03A): c.acr[row day] (see acqAdd in sim.js) holds the debt that came over without cash (taken over
// in an absorption, LBO debt put on the target, hidden debt found): ncA leaves 차입 증감 / 재무활동, so 기타·투자 매매 no longer absorbs it.
// The cash of an absorption is shown on its own rows: 인수 순현금 = cash brought in - cash paid (external), 자회사 흡수·투자회수(순현금) the
// same for a company the acquirer held more than 50% of directly just before (a simplification for the company-by-company statements).
// st: 'old' = the row closed before the ledger started (c.acd; a save made before FIN-CF-03A): no record, shown as before, footnote;
// 'part' = the quarter began before the ledger (load day) and ended after it: what was recorded is used, the cells are marked ◐;
// 'full' = recorded from start to end. Banks' / insurers' growth gr stays in 차입 증감 (FIN-CF-03B).
function fqDerive(c,q,prev){const x=SX[c.i]||SX[0],fin=c.kd,gp=fin?q.rev:Math.max(q.op+q.rd+q.rev*.04,q.rev*x.gm),sga=fin?Math.max(0,q.rev-q.op):gp-q.op-q.rd,cogs=fin?0:q.rev-gp,
pre=q.op-q.it+q.ii-q.ga,dep=fin?0:q.A*.02,cfo=q.ni-q.eq+q.ga+dep+(q.imp||0)+(q.wo||0),capex=fin?0:q.gr+dep,dD=prev?q.D-prev.D:null,led=!!(prev&&c&&c.isd!=null&&prev.d>c.isd),dsh=!!prev&&q.sh!==prev.sh,iss=!prev?0:led||!dsh?(c&&c.isq&&c.isq[q.d]||0):(q.sh-prev.sh)*q.p/1e4,est=!led&&dsh,
nc=prev&&c&&c.rlf&&c.rlf.d===q.d&&isFinite(c.rlf.R)?c.rlf.R:0,unk=prev&&!(c&&c.rlf&&c.rlf.d===q.d)&&c&&c.bk>0&&c.cfd!=null&&prev.d<c.cfd&&q.A>0&&Math.abs(q.A+q.cs+q.gw+q.pv-q.D-.15*q.A)<=3,
st=!prev||!c?null:c.acd==null||prev.d>c.acd?"full":q.d<=c.acd?"old":"part",A3=(st==="part"||st==="full")&&c.acr&&c.acr[q.d]||null,ncA=A3?A3.aD+A3.iD+A3.lD+A3.hD:0,maN=A3?A3.aC-A3.aP:0,inN=A3?A3.iC-A3.iP:0,
cff=prev?dD+nc-ncA-q.dv+iss:null,dc=prev?q.cs-prev.cs:null,oth=prev?dc-cfo+capex-cff-maN-inN:null,bank=fin?0:Math.max(0,q.D-q.bond-q.pa),eq0=q.A+q.cs+q.gw+q.pv-q.D;
return{gp,sga,cogs,pre,dep,cfo,capex,cff,dc,oth,nc,unk:!!unk,est,bank,eqv:eq0,wc:fin?0:q.A*.18,ppe:fin?0:q.A*.82,fcf:cfo-capex,iss,st,ncA,maN,inN,ax:!!(A3&&(A3.aD||A3.aP||A3.aC)),ix:!!(A3&&(A3.iD||A3.iP||A3.iC))}}
function ttm(L,k){if(L.length<4)return null;return L.slice(-4).reduce((a,q)=>a+q[k],0)}
function fRatios(c){const L=fqL(c);if(L.length<1)return null;const q=L[L.length-1],d=fqDerive(c,q,L[L.length-2]),ni=ttm(L,"ni"),op=ttm(L,"op"),rev=ttm(L,"rev"),dv=ttm(L,"dv"),it=ttm(L,"it"),m=mc(c),eqv=Math.max(1e-9,eq(c)),
eps=ni!=null?ni*1e4/c.sh:null,bps=eqv*1e4/c.sh,ya=L.length>=8?L.slice(-8,-4):null,g=(k)=>ya&&ttm(L,k)!=null?(ttm(L,k)/Math.max(1e-9,Math.abs(ya.reduce((a,z)=>a+z[k],0)))-(ya.reduce((a,z)=>a+z[k],0)<0?-1:1))*100:null;
return{per:eps>0?c.p/eps:null,pbr:c.p/Math.max(1e-9,bps),psr:rev?m/rev:null,roe:ni!=null?ni/eqv*100:null,roa:ni!=null?ni/Math.max(1,c.A+c.cs+c.gw+pfv(c))*100:null,opm:rev?op/rev*100:null,npm:rev?ni/rev*100:null,
de:c.D/eqv*100,icr:it?op/it:null,dy:dv!=null&&m?dv/m*100:null,po:ni>0&&dv!=null?dv/ni*100:null,eps,bps,ev:(op!=null?(m+c.D-c.cs)/Math.max(1e-9,op+(c.kd?0:c.A*.08)):null),gRev:g("rev"),gNi:g("ni"),gOp:g("op")}}
function secAvg(i){const a=S.co.filter(c=>!c.dead&&!c.priv&&c.i===i&&c.fq&&c.fq.length>=4).map(fRatios).filter(Boolean),av=k=>{const v=a.map(r=>r[k]).filter(x=>x!=null&&isFinite(x)).sort((p,q)=>p-q);return v.length?v[v.length>>1]:null};
return{per:av("per"),pbr:av("pbr"),roe:av("roe"),opm:av("opm"),de:av("de"),dy:av("dy")}}
const fN=x=>x==null||!isFinite(x)?"–":Math.abs(x)>=1e4?(x/1e4).toFixed(2)+"조":Math.abs(x)>=100?Math.round(x).toLocaleString():x.toFixed(1),fK=x=>x==null||!isFinite(x)?"–":Math.abs(x)>=100?Math.round(x).toLocaleString():x.toFixed(1),fP=x=>x==null||!isFinite(x)?"–":x.toFixed(1)+"%",fX=x=>x==null||!isFinite(x)?"–":x.toFixed(1)+"배";
function qLab(d){const k=d-1,y=(S.y0||2027)+Math.floor(k/360),q=Math.floor((((k%360)+360)%360)/90)+1;return((y%100)+100)%100+"."+q+"Q"}
// FIN-CF-01 cash-flow tab helpers. cfRl: a recorded chapter-11 relief sits in a visible quarter that has a previous quarter to compare with.
const cfRl=c=>!!(c.rlf&&c.rlf.R&&fqL(c).slice(1).some(q=>q.d===c.rlf.d));
// FIN-CF-03A tab helpers. cfAx: some visible quarter (with a previous quarter) has an external deal (k 'ax'), an internal absorption ('ix')
// or non-cash debt ('ncA'). cfM: the cell of a row the ledger touches, '≈' (FIN-CF-02 estimate) and '◐' (partly recorded quarter) in front.
const cfAx=(c,k)=>{const L=fqL(c);return L.some((q,j)=>j&&fqDerive(c,q,L[j-1])[k])},cfM=(d,e,v)=>e||d.st==="part"?(e?"≈":"")+(d.st==="part"?"◐":"")+fN(v):v;
// cfNote: says which quarters are 'unconfirmed', why, and what that cannot tell; or that older quarters of a company with a chapter-11 history may hide one
function cfNote(c){return cfNoteR(c)+cfNoteE(c)+cfNoteA(c)}
// cfNoteA (FIN-CF-03A): names the partly recorded quarters (◐) and the quarters closed before the acquisition ledger, and says what the
// internal-absorption row means
function cfNoteA(c){const L=fqL(c),D=L.map((q,j)=>j?fqDerive(c,q,L[j-1]):null),lab=s=>L.filter((q,j)=>D[j]&&D[j].st===s).map(q=>qLab(q.d)),pt=lab("part"),od=lab("old"),st="margin-top:4px;line-height:1.6",y=(S.y0||2027)+Math.floor((c.acd||0)/360);let h="";if(pt.length)h+=`<div class="mu" style="${st}">※ ◐ 부분 기록 분기(${pt.join(", ")}): 인수·자회사 흡수·LBO·숨은 부채 기록은 저장 데이터를 불러온 ${y}년 ${dLab(c.acd)}부터예요. 그 전 같은 분기에 있었던 거래는 기록이 없어 차입 증감·기타·투자 매매에 섞여 있을 수 있어요. 기록된 거래는 반영했어요.</div>`;if(od.length)h+=`<div class="mu" style="${st}">※ 기록 전 분기(${od.join(", ")}): 인수·LBO·숨은 부채로 현금 없이 늘어난 부채를 기록하기 전에 저장된 데이터예요. 그런 부채가 있었다면 차입 증감에 섞여 있고 기타·투자 매매가 같은 금액을 반대로 떠안았을 수 있어요. 확인되지 않은 금액이라 고치지 않았어요.</div>`;if(cfAx(c,"ix"))h+=`<div class="mu" style="${st}">※ 자회사 흡수·투자회수(순현금): 거래 직전 이 회사가 직접 50% 넘게 가진 회사를 흡수했을 때 들어온 현금에서 낸 현금을 뺀 값이에요. 회사별 현금흐름을 보여 주기 위한 단순화 규칙이고, 회계 기준의 지배력 판단과 같지 않아요.</div>`;return h}
// cfNoteE: names the quarters whose share issue is an estimate at the close price (saved before the issue ledger), so they are not read as recorded amounts
function cfNoteE(c){const L=fqL(c),e=L.filter((q,j)=>j&&fqDerive(c,q,L[j-1]).est).map(q=>qLab(q.d));return e.length?`<div class="mu" style="margin-top:4px;line-height:1.6">※ ≈ 분기 말 주가 기준 추정(${e.join(", ")}): 실제 증자·자사주 금액을 기록하기 전에 저장된 데이터라, 이 분기의 증자·출자(자사주)는 주식 수 변화 × 분기 말 주가로 추정했어요. 기록된 금액이 아니에요. 실제 발행·매입 가격과의 차이는 기타·투자 매매에 섞여 있고, 그 무렵의 현금 출자도 기록이 없어 기타·투자 매매에 들어 있을 수 있어요.</div>`:""}
function cfNoteR(c){const L=fqL(c),Ds=L.map((q,j)=>j?fqDerive(c,q,L[j-1]):null),u=L.filter((q,j)=>Ds[j]&&Ds[j].unk).map(q=>qLab(q.d)),st="margin-top:4px;line-height:1.6";
if(u.length)return `<div class="mu" style="${st}">※ 미확인 분기(${u.join(", ")}): 법정관리의 비현금 부채 감면이 섞여 있을 수 있는데 감면액 기록이 없어 차입 증감·재무활동·기타·투자 매매를 계산하지 않았어요. 판단 근거는 이 회사의 법정관리 이력과 분기 말 자본이 자산의 약 15%라는 점(법정관리 직후의 모습)뿐이라 법정관리 분기라고 확정한 것은 아니에요. 감면액을 기록하기 전에 저장된 데이터라서, 같은 이유로 놓친 분기가 있을 수 있어요.</div>`;
if(c.bk>0&&c.cfd!=null&&L.some((q,j)=>j&&!(c.rlf&&c.rlf.d===q.d)&&L[j-1].d<c.cfd))return `<div class="mu" style="${st}">※ 이 회사는 법정관리 이력이 있어요. 감면액을 기록하기 전 분기는 비현금 부채 감면이 어느 분기의 차입·재무활동·기타에 섞여 있는지 확인되지 않아요.</div>`;
return ""}
function fTable(c,rows,opt){const L=fqL(c),cols=L.slice().reverse(),Ds=cols.map((q,j)=>fqDerive(c,q,cols[j+1]));opt=opt||{};
let h=`<div class="ftw"><table class="ft"><thead><tr><th>${opt.h||"(억)"}</th>${opt.ttm?"<th>최근 4분기</th>":""}${cols.map(q=>`<th>${qLab(q.d)}</th>`).join("")}</tr></thead><tbody>`;
const T={};if(opt.ttm&&cols.length>=4)for(const q of cols.slice(0,4))for(const k in q)if(typeof q[k]==="number")T[k]=(T[k]||0)+q[k];
for(const [lab,f,st,tf] of rows){if(lab==="-"){h+=`<tr class="sep"><td colspan="${cols.length+1+(opt.ttm?1:0)}">${f}</td></tr>`;continue}
const vals=cols.map((q,j)=>f(q,Ds[j],j));let t="";if(opt.ttm&&cols.length>=4){const tv=cols.slice(0,4).map((q,j)=>f(q,Ds[j],j));t=st==="pct"?(tf?tf(T):null):tv.every(v=>v!=null&&isFinite(v))&&st!=="pt"?tv.reduce((a,b)=>a+b,0):null}
h+=`<tr class="${st||""}"><td>${lab}</td>${opt.ttm?`<td>${st==="pt"?"":st==="pct"?(t==null?"–":fP(t)):st==="krw"?fK(t):fN(t)}</td>`:""}${vals.map(v=>`<td class="${v<0?"neg":""}">${typeof v==="string"?v:st==="pct"?fP(v):st==="krw"?fK(v):fN(v)}</td>`).join("")}</tr>`}
return h+`</tbody></table></div>`}
function sFi(c,i){const L=fqL(c),seg=["요약","손익","재무상태","현금흐름","투자지표"].map((t,k)=>B(t,`G.fseg(${k})`,fseg===k?"on":"")).join(""),fin=c.kd;
let h=`<div class="seg" style="margin-top:4px">${seg}</div>`+fiNote(c);if(!L.length)return h+`<div class="card mu" style="line-height:1.6">아직 공시된 분기 실적이 없습니다. 첫 실적 발표는 D-${nxe(c)}에요.</div>`;
if(fseg===0){const r=fRatios(c)||{},sa=secAvg(c.i),cmp=(a,b,lowGood)=>a==null||b==null?"":`<span class="mu"> (업종 ${typeof b==="number"?b.toFixed(1):b}${lowGood?(a<b?" · 더 쌈":" · 더 비쌈"):(a>b?" · 더 좋음":" · 더 낮음")})</span>`;
h+=`<div class="pn"><div class="ph"><b>한눈에 보기</b><span class="mu">최근 4분기 기준</span></div>`+brow("매출",fN(ttm(L,"rev"))+"억"+(r.gRev!=null?` <span class="${r.gRev>=0?"up":"dn"}">${P1(r.gRev)}</span>`:""))+brow("영업이익",fN(ttm(L,"op"))+"억"+(r.gOp!=null?` <span class="${r.gOp>=0?"up":"dn"}">${P1(r.gOp)}</span>`:""))+
brow("순이익",fN(ttm(L,"ni"))+"억"+(r.gNi!=null?` <span class="${r.gNi>=0?"up":"dn"}">${P1(r.gNi)}</span>`:""))+brow("PER",fX(r.per)+cmp(r.per,sa.per,1))+brow("PBR",fX(r.pbr)+cmp(r.pbr,sa.pbr,1))+brow("ROE",fP(r.roe)+cmp(r.roe,sa.roe))+brow("영업이익률",fP(r.opm)+cmp(r.opm,sa.opm))+brow("부채비율",fP(r.de))+brow("배당수익률",fP(r.dy))+`<div class="br mu" style="line-height:1.6;white-space:normal">증감은 1년 전 같은 기간 대비예요. PER·PBR은 낮을수록 싸고, ROE·이익률은 높을수록 돈을 잘 버는 회사예요. ${B("개념서: 재무제표","G.book('fs1')")}</div></div>`;
const ls=L.slice(-8),mx=Math.max(...ls.map(q=>Math.max(Math.abs(q.rev),Math.abs(q.op),Math.abs(q.ni))),1);
h+=`<div class="pn"><div class="ph"><b>분기 매출 · 영업이익 · 순이익</b></div><div style="padding:10px 12px"><svg viewBox="0 0 320 120" width="100%" height="120" role="img" aria-label="분기 실적 막대">${ls.map((q,j)=>{const x0=j*40+4,bar=(v,k,col)=>{const hh=Math.abs(v)/mx*96;return `<rect x="${x0+k*11}" y="${v>=0?104-hh:104}" width="10" height="${Math.max(1,hh)}" fill="${col}" rx="2"/>`};return bar(q.rev,0,"var(--mu)")+bar(q.op,1,"var(--ac)")+bar(q.ni,2,q.ni>=0?"var(--up)":"var(--dn)")+`<text x="${x0+15}" y="117" font-size="9" text-anchor="middle" fill="var(--mu)">${qLab(q.d)}</text>`}).join("")}<line x1="0" x2="320" y1="104" y2="104" stroke="var(--ln)"/></svg><div class="row mu"><span>■ 회색 매출 · 파랑 영업이익 · 순이익</span></div></div></div>`;return h}
if(fseg===1)return h+fTable(c,[["매출액",q=>q.rev],["매출원가",(q,d)=>fin?null:-d.cogs],["매출총이익",(q,d)=>d.gp,"b"],[fin?"영업비용":"판매관리비",(q,d)=>-d.sga],[PSN(c.i)+" 비용",q=>fin?null:-q.rd],["영업이익",q=>q.op,"b"],["이자비용",q=>-q.it],["이자수익",q=>q.ii],["영업권 상각",q=>-q.ga],...(fqL(c).some(q=>q.imp)?[["자산 손상차손",q=>-(q.imp||0)]]:[]),...(fqL(c).some(q=>q.wo)?[["대손상각비",q=>-(q.wo||0)]]:[]),["지분법 이익",q=>q.eq],["배당 수익",q=>q.dr],["법인세",q=>-q.tax],["순이익",q=>q.ni,"b"],
["-","주당·비율"],["EPS (원)",q=>q.ni*1e4/q.sh,"krw"],["영업이익률",q=>q.rev?q.op/q.rev*100:null,"pct",T=>T.rev?T.op/T.rev*100:null],["순이익률",q=>q.rev?q.ni/q.rev*100:null,"pct",T=>T.rev?T.ni/T.rev*100:null],["배당 지급",q=>q.dv]],{ttm:1})+`<div class="mu" style="margin-top:6px;line-height:1.6">매출에서 원가와 판관비를 빼면 영업이익, 여기서 이자·세금 등을 빼면 순이익이에요. 지분법 이익은 20% 이상 가진 회사의 이익 중 내 몫입니다.</div>`;
if(fseg===2)return h+fTable(c,[["현금",q=>q.cs],[fin?"대출·운용 자산":"매출채권·재고",(q,d)=>fin?q.A:d.wc],["유형자산(설비)",(q,d)=>fin?null:d.ppe],["영업권",q=>q.gw],["투자 지분",q=>q.pv],["자산총계",q=>q.A+q.cs+q.gw+q.pv,"b"],["-","부채"],
...(fin?[[c.kd===1?"예금":"보험 부채",q=>q.D]]:[["은행 차입",(q,d)=>d.bank],["회사채",q=>q.bond],["대여금(내가 빌려줌)",q=>q.pa]]),["부채총계",q=>q.D,"b"],["자본총계",(q,d)=>d.eqv,"b"],["부채비율",(q,d)=>d.eqv>0?q.D/d.eqv*100:null,"pct"],["주당순자산 BPS",(q,d)=>d.eqv*1e4/q.sh],["발행주식(만주)",q=>q.sh]])+`<div class="mu" style="margin-top:6px;line-height:1.6">자산 = 부채 + 자본. 부채비율이 높을수록 이자 부담과 파산 위험이 커져요.</div>`;
if(fseg===3)return h+fTable(c,[["순이익",q=>q.ni],["감가상각(비현금)",(q,d)=>d.dep],["지분법·상각 조정",q=>q.ga-q.eq],...(fqL(c).some(q=>q.imp||q.wo)?[["손상·대손상각(비현금 조정)",q=>(q.imp||0)+(q.wo||0)]]:[]),["영업활동 현금흐름",(q,d)=>d.cfo,"b"],["설비투자",(q,d)=>fin?null:-d.capex],["잉여현금흐름 FCF",(q,d)=>fin?null:d.fcf,"b"],["차입 증감",(q,d)=>d.cff==null?null:d.unk?"미확인":cfM(d,0,d.cff+q.dv-d.iss)],["배당 지급",q=>-q.dv],["증자·출자(자사주)",(q,d)=>d.est?"≈"+fN(d.iss):d.iss||null],["재무활동 현금흐름",(q,d)=>d.unk?"미확인":cfM(d,d.est,d.cff),"b"],...(cfAx(c,"ax")?[["인수 순현금",(q,d)=>d.cff!=null&&d.ax?cfM(d,0,d.maN):null]]:[]),...(cfAx(c,"ix")?[["자회사 흡수·투자회수(순현금)",(q,d)=>d.cff!=null&&d.ix?cfM(d,0,d.inN):null]]:[]),["기타·투자 매매",(q,d)=>d.unk?"미확인":cfM(d,d.est,d.oth)],["현금 증감",(q,d)=>d.dc,"b"],...(cfRl(c)?[["└ 법정관리 부채 감면(비현금, 위 차입·재무활동에서 뺌)",(q,d)=>d.nc||null]]:[]),...(cfAx(c,"ncA")?[["└ 인수·흡수·LBO·숨은 부채로 늘어난 부채(비현금, 위 차입·재무활동에서 뺌)",(q,d)=>d.cff!=null&&d.ncA?cfM(d,0,d.ncA):null]]:[])])+`<div class="mu" style="margin-top:6px;line-height:1.6">이익이 나도 현금이 들어오지 않으면 위험해요. 잉여현금흐름(영업현금 − 설비투자)이 배당과 빚 상환의 원천입니다.</div>`+cfNote(c);
const r=fRatios(c)||{},sa=secAvg(c.i);return h+`<div class="pn"><div class="ph"><b>투자지표</b><span class="mu">회사 · 업종 중간값</span></div>`+[["PER (주가/주당순이익)",fX(r.per),fX(sa.per)],["PBR (주가/주당순자산)",fX(r.pbr),fX(sa.pbr)],["PSR (시총/매출)",fX(r.psr),"–"],["EV/EBITDA",fX(r.ev),"–"],["ROE (자기자본이익률)",fP(r.roe),fP(sa.roe)],["ROA (총자산이익률)",fP(r.roa),"–"],["영업이익률",fP(r.opm),fP(sa.opm)],["순이익률",fP(r.npm),"–"],["부채비율",fP(r.de),fP(sa.de)],["이자보상배율",fX(r.icr),"–"],["배당수익률",fP(r.dy),fP(sa.dy)],["배당성향",fP(r.po),"–"],["EPS (연간)",r.eps!=null?W(r.eps):"–","–"],["BPS",W(r.bps||0),"–"],["매출 성장 (1년)",fP(r.gRev),"–"],["순이익 성장 (1년)",fP(r.gNi),"–"]].map(([a,b,s])=>brow(a,`<b>${b}</b> <span class="mu">${s}</span>`)).join("")+`<div class="br mu" style="line-height:1.6;white-space:normal">같은 업종끼리 비교해야 의미가 있어요. 성장이 빠른 업종은 PER이 높아도 비싸지 않을 수 있습니다. ${B("개념서: 가치평가","G.book('val')")}</div></div>`}

function scrList(){const f=scf;return S.co.filter(c=>{if(c.dead||c.priv)return false;if(f.sec>=0&&c.i!==f.sec)return false;if(f.tier>=0&&tn(c)!==f.tier)return false;if(f.tech&&!techOk(c,f.tech))return false;const r=rating(c);
if(f.per&&pe(c)>f.per)return false;if(f.cash&&c.cs/Math.max(1,mc(c))*100<f.cash)return false;if(f.rt<9&&(f.rt<0?r<-f.rt:r>f.rt))return false;if(f.ext<100&&topRival(c,"P")>f.ext)return false;
if(f.ctl==="none"&&c.ctl)return false;if(f.ctl==="ai"&&!(c.ctl&&c.ctl[0]==="c"))return false;if(f.ctl==="rv"&&!(c.ctl&&c.ctl[0]==="r"))return false;if(f.ctl==="me"&&c.ctl!=="P")return false;return true})
.sort([(a,b)=>mc(b)-mc(a),(a,b)=>pe(a)-pe(b),(a,b)=>b.cs/mc(b)-a.cs/mc(a),(a,b)=>a.p/a.tg-b.p/b.tg,(a,b)=>dyv(b)-dyv(a)][f.sort])}
function scrPg(){const f=scf,ch=(lab,k,opts)=>`<div class="mu" style="margin-top:8px">${lab}</div><div class="ch">`+opts.map(([v,t])=>B(t,`G.sf('${k}',${typeof v==="string"?"'"+v+"'":v})`,f[k]===v?"on":"")).join("")+`</div>`,L2=scrList();
return hd("종목 검색기")+`<div class="mu" style="line-height:1.6">원작의 Database Search처럼 조건을 걸어 인수 대상을 찾으세요.</div><div class="bs">${B("인수하기 쉬운 회사","G.sfp(0)")}${B("현금 부자","G.sfp(1)")}${B("저평가 우량주","G.sfp(2)")}${B("부실 기업","G.sfp(3)")}${B("초기화","G.sfp(-1)")}</div>`+
ch("업종","sec",[[-1,"전체"],...SEC.map((s,i)=>[i,s[0]])])+ch("규모","tier",[[-1,"전체"],[0,"대형"],[1,"중형"],[2,"소형"]])+ch("PER 이하","per",[[0,"전체"],[8,"8"],[12,"12"],[20,"20"]])+ch("현금/시총 이상","cash",[[0,"전체"],[20,"20%"],[50,"50%"],[100,"100%"]])+
ch("신용","rt",[[9,"전체"],[2,"A 이상"],[3,"BBB 이상"],[-4,"BB 이하 (부실)"]])+ch("외부 최대 그룹 지분 이하","ext",[[100,"전체"],[10,"10%"],[20,"20%"]])+ch("지배 상태","ctl",[["all","전체"],["none","일반 주주"],["ai","AI 그룹"],["rv","라이벌"],["me","내 그룹"]])+ch("기술적 조건","tech",[["","전체"],["rsi","RSI 30 이하 (과매도)"],["gc","최근 골든크로스"],["up","정배열 상승 추세"],["hi","신고가 근처"],["vol","거래량 급증"]])+ch("정렬","sort",[[0,"시총"],[1,"저PER"],[2,"현금 비율"],[3,"저평가"],[4,"배당"]])+
`<h4>결과 ${L2.length}개</h4>`+L2.slice(0,60).map(c=>row(c)).join("")+(L2.length>60?`<p class="mu">상위 60개만 보여 줍니다. 조건을 좁혀 보세요.</p>`:"")}
// ---- v9 UI: founding wizard, fund transfer, asset market (holding companies may buy) ----
const optB=(on,fn,t,d)=>`<button class="opt${on?" on":""}" onclick="${fn}"><b>${t}</b><span class="mu">${d}</span></button>`;
function fdPg(){if(!FD)fdInit();const f=FD;if(f.fo!=="P"){const x=S.co[f.fo];if(!x||!mine(x)||x.kd===1)f.fo="P"}
const s=f.sec,cost=fCost(s),left=fdLeft(),E=Math.max(0,f.cap-cost),best=INDS.slice().sort((a,b)=>(S.dg[b]-S.cg[b])-(S.dg[a]-S.cg[a]))[0],
fos=["P",...S.co.filter(c=>mine(c)&&c.kd!==1).sort((a,b)=>eAvail(b.id)-eAvail(a.id)).slice(0,15).map(c=>c.id)],caps=(s===12||s===13?[1000,2000,3000,5000]:[50,100,300,1000,3000]).filter(v=>v>=fMin(s)),
own=S.co.filter(c=>c.priv&&!c.dead&&ownerK(c)&&root(ownerK(c))==="P");if(f.fo!=="P"&&!fos.includes(f.fo))fos.push(f.fo);
return hd("회사 설립")+`<div class="mu" style="line-height:1.6">원작의 'Start Up New Corp'입니다. 새 회사는 100% 내 소유의 비상장사로 시작하고, 시즈닝 기간(1년 반)이 지나야 상장하거나 정크본드를 낼 수 있어요. 남은 창업 횟수 <b>${left}회</b> (1년에 2개 · 2년에 3개)</div>
<h4>무엇을 세울까요</h4><div class="opts">${optB(s===HOLD,`G.fdSet('sec',${HOLD})`,"지주회사","현금으로 시작해 다른 회사 지분을 삽니다. 받는 배당 비과세, 설립비 5억")}${optB(isInd(s),`G.fdSet('sec',${isInd(s)?s:best})`,"사업회사","30개 업종 중 하나. 처음 1년 반은 자리 잡느라 이익이 적어요")}${optB(s===12,"G.fdSet('sec',12)","은행","최소 1,000억 · 예금으로 덩치를 키우고 대출 장부로 다른 회사를 흔듭니다")}${optB(s===13,"G.fdSet('sec',13)","보험","최소 1,000억 · 보험료로 쌓인 현금이 인수 자금이 됩니다")}</div>
${isInd(s)?`<div class="ch" style="margin-top:8px">${INDS.slice().sort((a,b)=>grpOf(a)-grpOf(b)||a-b).map(k=>B(SEC[k][0]+(S.dg[k]-S.cg[k]>.005?" ▲":""),`G.fdSet('sec',${k})`,s===k?"on":"")).join("")}</div><div class="mu" style="margin-top:4px;line-height:1.6">${SEC[s][0]} · 수요 성장 ${(S.dg[s]*100).toFixed(1)}% vs 설비 증가 ${(S.cg[s]*100).toFixed(1)}% · ▲는 공급이 모자라 마진이 좋은 업종</div>`:""}
<h4>이름 · 티커</h4><input class="in" id="fdn" maxlength="18" value="${esc(f.nm)}" oninput="FD.nm=this.value;FD.ed=1" aria-label="회사 이름" style="margin-bottom:0"><input class="in" id="fdt" maxlength="5" value="${esc(f.tk)}" oninput="FD.tk=this.value.toUpperCase()" aria-label="티커 (영문 2~5자)" style="text-transform:uppercase">
<h4>자본금</h4><div class="ch">${caps.map(v=>B(F(v),`G.fdSet('cap',${v})`,f.cap===v?"on":"")).join("")}</div><input class="in" id="fdc" type="number" inputmode="numeric" min="${fMin(s)}" value="${f.cap}" oninput="FD.cap=Math.round(+this.value||0)" onchange="G.fdSet('cap',Math.round(+this.value||0))" aria-label="자본금 (억)">
<div class="mu" style="line-height:1.6">설립 비용 ${F(cost)} · 회사 자본 ${F(E)}${s===12?" · 예금을 받아 대출 자산 약 "+F(E*9)+"로 시작":s===13?" · 보험료 적립금 포함 현금 약 "+F(E*1.25)+"로 시작":s===HOLD?" · 전부 현금으로 시작":" · 사업 자산 "+F(E*.85)+" + 현금 "+F(E*.15)}</div>
<h4>설립 국가</h4><div class="opts">${CTRY.map((x,k)=>optB(f.cty===k,`G.fdSet('cty',${k})`,x[0],"법인세 "+Math.round(x[1].tax*100)+"% · "+x[2])).join("")}</div>
${isInd(s)?`<h4>운영 방침</h4><div class="opts">${[["공격 성장","성장률 20% · R&D·광고 연 2%"],["균형","성장률 6% · R&D·광고 연 1%"],["현금 축적","성장 없이 이익을 쌓습니다"]].map((x,k)=>optB(f.pre===k,`G.fdSet('pre',${k})`,x[0],x[1])).join("")}</div>`:""}
<h4>설립 주체 · 돈을 내고 100% 소유합니다</h4><div class="ch">${fos.map(e=>B(e==="P"?"나 · 가용 "+F(eAvail("P")):esc(S.co[e].tk)+" · 가용 "+F(eAvail(e)),`G.fdSet('fo',${e==="P"?"'P'":e})`,f.fo===e?"on":"")).join("")}</div>
<div class="mu" style="margin-top:4px">${f.fo==="P"?"내 돈으로 세우면 내가 직접 100%를 가집니다.":esc(S.co[f.fo].tk)+"의 자회사가 됩니다. 은행은 설립 주체가 될 수 없어요."}</div>
<div class="bs" style="margin-top:16px">${B(left?"설립하기 · "+F(f.cap):"올해 창업 한도를 다 썼어요","G.fdGo()","p wide",!left)}</div>
<h4>내 그룹의 비상장 회사</h4>${own.map(c=>row(c)).join("")||'<p class="mu">아직 없습니다.</p>'}`}
function mvPg(){if(!MV)mvInit();mvFix();const my=S.co.filter(mine).sort((a,b)=>b.cs-a.cs),ents=["P",...my.slice(0,20).map(c=>c.id)];for(const k of ["fr","to"])if(MV[k]!=="P"&&!ents.includes(MV[k]))ents.push(MV[k]);
const nmE=e=>e==="P"?"나":S.co[e].tk,ms=mvMethods(MV.fr,MV.to),T=MV.to==="P"?null:S.co[MV.to],fk=MV.fr==="P"?"P":"c"+MV.fr,
chip=(k,e)=>B(e==="P"?"나 · "+F(S.cash):esc(S.co[e].tk)+" · "+F(S.co[e].cs),`G.mvSet('${k}',${e==="P"?"'P'":e})`,MV[k]===e?"on":""),
DS={cap:"현금을 자본으로 넣습니다. 100% 소유한 회사에만 할 수 있고, 돌려받으려면 배당이나 청산을 해야 해요. 세금은 없습니다.",stk:"보유 주식을 회사로 넘깁니다 (원작의 'Incorporate Yourself'). 세금 없이 장부가가 이어지고, 지주회사에 모아 두면 받는 배당이 비과세예요.",adv:"회사에 돈을 빌려줍니다. 기준금리 이자를 받고 언제든 회수할 수 있어요.",pp:"회사가 신주를 발행하고 보내는 쪽이 삽니다. 지분이 늘어 경영권이 단단해져요.",rec:"빌려준 돈을 돌려받습니다.",div:"회사가 모든 주주에게 지분만큼 배당합니다. 개인은 40% 세금, 지분 80% 이상 모회사와 지주회사는 비과세예요."};
let h=hd("자금 이동")+`<div class="mu" style="line-height:1.6">나와 내 회사들 사이에서 돈과 주식을 옮깁니다. 원작의 자본 투입, 대여금, 사모 증자, 배당 규칙을 따릅니다.</div><h4>보내는 쪽</h4><div class="ch">${ents.map(e=>chip("fr",e)).join("")}</div><h4>받는 쪽</h4><div class="ch">${ents.map(e=>chip("to",e)).join("")}</div>`;
if(!my.length)return h+`<div class="card mu" style="margin-top:10px;line-height:1.6">아직 지배하는 회사가 없습니다. 회사를 세우거나 경영권을 잡으면 자금을 옮길 수 있어요.</div><div class="bs">${B("회사 설립","G.fdOpen()","p")}</div>`;
if(!ms.length)return h+`<div class="card mu" style="margin-top:10px;line-height:1.6">${MV.fr===MV.to?"보내는 쪽과 받는 쪽이 같습니다.":"이 조합은 옮길 방법이 없어요. 출자는 100% 소유한 회사에만, 대여는 나만 할 수 있고, 회사에서 나에게는 대여금 회수나 배당으로만 돈이 옵니다."}</div>`;
h+=`<h4>방법</h4><div class="ch">${ms.map(([k,t])=>B(t,`G.mvSet('how','${k}')`,MV.how===k?"on":"")).join("")}</div><div class="mu" style="margin-top:6px;line-height:1.6">${DS[MV.how]||""}</div>`;
if(MV.how==="stk"){const hs=S.co.filter(c=>!c.dead&&c!==T&&(c.own[fk]||0)>0).sort((a,b)=>hv(b,b.own[fk])-hv(a,a.own[fk]));return h+`<h4>넘길 주식 (${esc(nmE(MV.fr))} 보유)</h4>`+(hs.length?`<div class="ch">${hs.slice(0,30).map(c=>B(esc(c.tk)+" "+c.own[fk].toFixed(1)+"% · "+F(hv(c,c.own[fk])),`G.mvSet('y',${c.id})`,MV.y===c.id?"on":"")).join("")}</div><div class="ch" style="margin-top:6px">${[[.25,"25%"],[.5,"50%"],[1,"전부"]].map(([v,t])=>B(t,`G.mvSet('f',${v})`,MV.f===v?"on":"")).join("")}</div>`:'<p class="mu">넘길 주식이 없습니다.</p>')+`<div class="bs" style="margin-top:14px">${B("현물출자 실행","G.mvGo()","p wide",MV.y<0)}</div>`+mvCard(T,fk)}
h+=`<h4>금액 (억)</h4><input class="in" id="mva" type="number" inputmode="decimal" min="0" value="${esc(MV.amt)}" oninput="MV.amt=this.value" placeholder="예: 100" aria-label="금액 (억)"><div class="ch">${[10,25,50,100].map(p=>B(p===100?"전액":p+"%",`G.mvPct(${p})`)).join("")}</div><div class="mu" style="margin-top:6px">${esc(nmE(MV.fr))} ${MV.how==="rec"?"회수 가능 "+F(mvSrc()):MV.how==="div"?"회사 현금 "+F(mvSrc()):"현금 "+F(eCash(MV.fr))+" · 대출 여력 "+F(eRoom(MV.fr))}</div><div class="bs" style="margin-top:14px">${B("옮기기","G.mvGo()","p wide")}</div>`;
return h+mvCard(T,fk)}
function mvCard(T,fk){return T?`<div class="card" style="margin-top:12px"><div class="g"><span>${esc(T.tk)} 현금</span><span>${F(T.cs)}</span><span>내 그룹 지분</span><span>${grp(T,"P").toFixed(1)}%</span><span>보내는 쪽 지분</span><span>${(T.own[fk]||0).toFixed(1)}%</span><span>내 대여금</span><span>${F(T.pa||0)}</span></div></div>`:""}
function fsPg(){const e=teOK(),c=e==="P"?null:S.co[e];return hd("자산 매물 시장")+`<div class="mu" style="line-height:1.6">자금난에 빠진 회사들이 사업 자산을 장부가보다 싸게 내놓습니다. 같은 업종의 내 회사나 내 지주회사를 거래 주체로 골라야 살 수 있어요. 지주회사가 사면 그 업종의 사업회사가 되고 결손금은 사라집니다(원작 규칙). 매물은 90일 뒤 사라집니다.</div>${entLine()}`+
(S.fs.length?S.fs.map((f,k)=>{const ok=c&&(c.i===f.i||c.i===HOLD);return `<div class="card"><div class="row"><b>${SEC[f.i][0]} 사업 자산 ${F(f.A)}</b><span class="num">${F(f.px)}</span></div><div class="mu">${esc(f.s)} · ${esc(f.why)} · 장부가 대비 ${Math.round((1-f.px/f.A)*100)}% 할인 · ${Math.max(0,f.exp-S.day)}일 남음</div><div class="bs">${B(ok?"사기 ("+esc(c.tk)+" 명의)":"같은 업종 회사나 지주회사를 거래 주체로 고르세요",`G.fsBuy(${k})`,ok?"p":"",!ok)}</div></div>`}).join(""):'<p class="mu">지금은 나온 매물이 없습니다. 은행으로 부실 회사의 대출을 회수하면 매물이 나옵니다.</p>')}

function loanPg(){const b=S.co[lbId];if(!b||b.dead)return hd("대출 장부")+'<p class="mu">은행이 없습니다.</p>';const bo=S.co.filter(x=>!x.dead&&x.ln===b.id).sort((a,b2)=>loanOf(b2)-loanOf(a)),my=mine(b);
return hd(esc(b.tk)+" 대출 장부")+`<div class="card"><div class="g"><span>대출 고객</span><span>${bo.length}곳</span><span>대출 총액</span><span>${F(bo.reduce((a,x)=>a+loanOf(x),0))}</span><span>은행 자본</span><span>${F(eq(b))}</span></div><div class="mu" style="margin-top:6px;line-height:1.6">${my?"신용 BB 이하인 회사의 대출을 50% 회수할 수 있어요. 먼저 신용을 동결하면 다른 데서 빌려 막지 못합니다. 현금이 모자란 회사는 자산을 헐값에 팔고, 그래도 모자라면 법정관리에 들어갑니다.":"내가 지배하는 은행이 아니라 볼 수만 있습니다."}</div></div>`+
bo.slice(0,60).map(x=>{const r=rating(x),ok=my&&!mine(x)&&r>=4&&eq(x)>0&&(x.lc||0)<=S.day;return `<div class="sr"><div style="min-width:0" onclick="G.pick(${x.id})"><b>${esc(x.tk)}</b>${badges(x)} <span class="mu">${RT[r]}${x.frz?" · 동결":""}</span><div class="mu">대출 ${F(loanOf(x))} · 현금 ${F(x.cs)} · ${esc(rootName(x.ctl))}</div></div>${my&&!mine(x)?`<span class="bs" style="margin:0;flex:none">${B(x.frz?"해제":"동결",`G.frz(${b.id},${x.id})`)}${B("회수",`G.lcall(${b.id},${x.id})`,"d",!ok)}${B("매각",`G.lsell(${b.id},${x.id})`)}</span>`:""}</div>`}).join("")}
function acPg(){return hd("미션·업적")+`<h4>미션 ${Math.min(S.ms,MIS.length)}/${MIS.length}</h4>`+MIS.map((m,k)=>`<div class="sr"><span>${k<S.ms?'<b class="gd">완료</b>':k===S.ms?"<b>진행 중</b>":'<span class="mu">대기</span>'} · ${m[0]}${k===S.ms?`<div class="mu">${m[1]}</div>`:""}</span><span class="mu">${m[3]?F(m[3]):""}</span></div>`).join("")+
`<h4>업적 ${Object.keys(S.ach).length}/${AC.length}</h4>`+AC.map(([k,t])=>`<div class="sr"><span>${S.ach[k]?'<b class="gd">달성</b>':'<span class="mu">미달성</span>'} · ${t}</span></div>`).join("")}
function news(){const L2=nf?S.imp||[]:S.log;return `<h3>뉴스</h3><div class="seg">${B("전체","G.nf(0)",!nf?"on":"")}${B("중요 · 내 관련","G.nf(1)",nf?"on":"")}</div><div class="card log">${L2.map(x=>esc(x)).join("<br>")||"아직 없습니다."}</div>
<div class="card"><b>공략 노트</b><div class="log">지분 20% + 최대 그룹이면 경영권. 라이벌이 더 모으면 빼앗기니 사모 유상증자나 포이즌 필로 굳히세요.<br>보험사·은행은 현금이 많아 인수 자금줄이 됩니다.<br>은행을 지배하면 부실 회사의 대출을 회수해 헐값 매물을 만들 수 있어요.<br>금리가 낮을 때 회사채를 발행하면 10년 동안 이자가 고정됩니다.<br>개인 대출로 지분을 사다가 주가가 빠지면 마진콜이 연쇄로 옵니다. 차입은 회사에 맡기세요.</div></div>`}

function srch(v){v=v.trim().toLowerCase();const a=S.co.filter(c=>!c.dead&&(!v||c.tk.toLowerCase().includes(v)||c.n.toLowerCase().includes(v))).slice(0,80);
return a.map(c=>`<div class="sr" onclick="G.pick(${c.id})"><div><b style="font-size:17px">${esc(c.tk)}</b>${badges(c)}<div class="mu">${esc(c.n)} · ${SEC[c.i][0]}</div></div><span class="mu">›</span></div>`).join("")+srX(v)||'<p class="mu">검색 결과가 없습니다.</p>'}
function tree(){const seen=new Set();let h="";const node=(c,d,via)=>{if(seen.has(c.id)||d>4)return;seen.add(c.id);
h+=`<div class="tr" style="--d:${d}" onclick="G.pick(${c.id})"><span class="lk">${d?"└":""}</span>${d?"":logo(c)}<div class="nm"><b>${esc(c.tk)}</b>${badges(c)}<div class="mu">${via}% 보유 · 그룹 ${grp(c,"P").toFixed(1)}% · ${c.priv?"자본 "+F(eq(c)):"시총 "+F(mc(c))}</div></div><div class="r mu num">현금 ${F(c.cs)}</div></div>`;
Object.keys(c.pos).map(t=>S.co[t]).filter(x=>!x.dead&&(x.own["c"+c.id]||0)>=1).sort((a,b)=>b.own["c"+c.id]-a.own["c"+c.id]).forEach(x=>node(x,d+1,x.own["c"+c.id].toFixed(1)))};
S.co.filter(c=>!c.dead&&c.own.P).sort((a,b)=>val(b)-val(a)).forEach(c=>node(c,0,c.own.P.toFixed(1)));return h}
function donut(){const hs=S.co.filter(c=>c.own.P&&!c.dead).map(c=>[c.tk,val(c)]).sort((a,b)=>b[1]-a[1]),it=hs.slice(0,5),rest=hs.slice(5).reduce((a,b)=>a+b[1],0);if(rest>0)it.push(["기타",rest]);const cv=cmv();if(cv>0)it.push(["원자재",cv]);if(S.cash>0)it.push(["현금",S.cash]);
const t=it.reduce((a,b)=>a+b[1],0)||1,pt=(r,a)=>[(150+r*Math.cos(a)).toFixed(1),(130+r*Math.sin(a)).toFixed(1)];let a0=Math.PI,s="",lg="";
it.forEach(([n,v],k)=>{const a1=a0+v/t*Math.PI,[a,b]=pt(110,a0),[c,d]=pt(110,a1),[e,f]=pt(66,a1),[g,h]=pt(66,a0),co=`hsl(${k*55+170},42%,${n==="현금"?36:46}%)`;s+=`<path d="M${a} ${b}A110 110 0 0 1 ${c} ${d}L${e} ${f}A66 66 0 0 0 ${g} ${h}Z" fill="${co}"/>`;lg+=`<span style="margin-right:10px;white-space:nowrap"><i style="display:inline-block;width:9px;height:9px;background:${co};border-radius:2px"></i> ${esc(n)} ${(v/t*100).toFixed(0)}%</span>`;a0=a1});
return `<svg viewBox="0 0 300 140" width="100%" aria-label="보유 비중">${s}</svg><div class="mu">${lg}</div>`}

// ---- v10 UI: W$R-style company overview (balance sheet with inline actions, EPS, borrower status, cash flow, operations), my balance sheet, market indicators, sector heat map ----
const xb=(t,f,cl,dis)=>`<button class="xs${cl?" "+cl:""}" onclick="${f}"${dis?" disabled":""}>${t}</button>`;
function brow(l,v,b){const n=b?(b.match(/<button/g)||[]).length:0;return `<div class="br"><span class="bl">${l}</span>${n&&n<3?`<span class="bb">${b}</span>`:""}<span class="bv num">${v}</span>${n>=3?`<span class="bb w">${b}</span>`:""}</div>`}
const opc=(l,v,b)=>`<div class="op"><span class="mu">${l}</span><span class="ov num">${v}</span>${b?`<span class="bb">${b}</span>`:""}</div>`;
const Wc=n=>{const a=Math.abs(n);return a>=1e8?(n/1e8).toFixed(2)+"억원":a>=1e6?Math.round(n/1e4).toLocaleString()+"만원":a>=1e4?(n/1e4).toFixed(1)+"만원":W(n)};
function epsBars(c){const e=c.eh||[];if(!e.length)return `<div class="mu" style="padding:6px 0">첫 실적 발표 전입니다 · D-${nxe(c)}</div>`;
const W0=320,H0=110,mx=Math.max(0,...e),mn=Math.min(0,...e),rg=Math.max(1e-9,mx-mn),y0=8+mx/rg*(H0-26),bw=W0/8;let s="";
e.forEach((v,k)=>{const h=Math.abs(v)/rg*(H0-26),x=(8-e.length+k)*bw+bw*.2,y=v>=0?y0-h:y0;s+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw*.6).toFixed(1)}" height="${Math.max(1,h).toFixed(1)}" rx="3" fill="${v>=0?"var(--up)":"var(--dn)"}"/>`});
return `<svg viewBox="0 0 ${W0} ${H0}" width="100%" height="${H0}" role="img" aria-label="최근 ${e.length}분기 주당순이익"><line x1="0" x2="${W0}" y1="${y0.toFixed(1)}" y2="${y0.toFixed(1)}" stroke="var(--ln)"/>${s}</svg><div class="row mu num"><span>${e.length}분기 전 → 최근</span><span>최근 ${W(e[e.length-1])} · 연환산 ${W(e[e.length-1]*4)}</span></div>`}
function wOv(c,i){const m=mine(c),e=eq(c),pv=pfv(c),r=rating(c),ok=ownerK(c),er=c.er,fin=!!c.kd,ta=c.A+c.cs+c.gw+pv;
const liq=m&&c.priv&&ok&&root(ok)==="P"?xb(ok==="P"?"청산 (과세)":"흡수 청산 (비과세)",`G.liq(${i})`,"rd"):"";
let h=`<div class="pn"><div class="ph"><b>자산</b>${liq}</div>`+brow("현금",F(c.cs))+
brow(c.kd===1?"대출 자산":c.kd===2?"운용 자산":"사업 자산·설비",F(c.A),m&&!fin?xb("구조조정",`G.mg(${i},'rs')`)+xb("매입","G.pg('fs')","gr")+xb("매각",`G.adj(${i},'asell')`,"rd"):"")+
(c.gw>0?brow("영업권",F(c.gw)):"")+brow("자회사·투자 지분",F(pv),m&&pv>0?xb("보기",`G.stab('m')`):"")+brow("<b>총자산</b>","<b>"+F(ta)+"</b>")+`</div>`;
h+=`<div class="pn"><div class="ph"><b>부채와 자본</b></div>`+(fin?brow(c.kd===1?"예금":"보험 준비금",F(c.D)):
brow("회사채",F(c.bond),m?(c.bond>0?xb("상환",`G.bcall(${i})`):xb("발행",`G.adj(${i},'bond')`,"or")):"")+brow("은행 대출",F(loanOf(c)),m?xb("차입",`G.adj(${i},'borrow')`,"gr")+xb("상환",`G.adj(${i},'repay')`):"")+
((c.pa||0)>0?brow("내 대여금",F(c.pa),m?xb("회수",`G.advR(${i})`):""):""))+brow("<b>부채 합계</b>","<b>"+F(c.D)+"</b>")+brow("<b>자본</b>",`<b${e<0?' class="wr"':""}>${F(e)}</b>`)+`</div>`;
h+=`<div class="pn"><div class="ph"><b>주당순이익 (분기)</b>${xb("실적 보고서",`G.stab('f')`)}</div><div style="padding:8px 12px 10px">${epsBars(c)}</div></div>`;
h+=`<div class="pn"><div class="ph"><b>${fin?"건전성":"차입 현황"}</b>${m&&!fin?xb("은행 변경",`G.bkPick(${i})`):""}</div>`+(fin?brow("부채/자본 (9배 기준)",(c.D/Math.max(1,e)).toFixed(1)+"배")+brow("신용등급",RT[r])+(c.kd===1?brow("대출 고객",S.co.filter(x=>!x.dead&&x.ln===i).length+"곳"):""):
brow("거래 은행",esc(lnm(c))+(c.frz?' <span class="wr">동결</span>':""))+brow("부채/자본",(c.D/Math.max(1,e)).toFixed(2)+"배")+brow("신용등급",RT[r])+brow("대출 여력",F(cRoom(c))))+`</div>`;
if(er){const bd=er.op-er.tax,ad=bd-er.it,est=c.cs+ad-er.dv-(fin?0:c.A*c.g/4);h+=`<div class="pn"><div class="ph"><b>분기 현금흐름</b><span class="mu">${ds(er.d)}</span></div>`+brow("영업이익",F(er.op))+brow("세후 (이자 전)",F(bd))+brow("이자 후",F(ad))+brow("배당 지급",F(er.dv))+brow("3개월 뒤 예상 현금",F(est))+`</div>`}
const dps=er&&c.sh?er.dv*1e4/c.sh:0;
h+=`<div class="pn"><div class="ph"><b>운영</b>${m?xb("자동 경영 "+(c.ap?"켜짐":"꺼짐"),`G.ap(${i})`,c.ap?"gr":""):""}</div><div class="ops">`+opc("배당성향",Math.round(c.pay*100)+"%"+(dps>0?` <span class="mu">주당 ${W(dps)}</span>`:""),m?xb("조정",`G.adj(${i},'pay')`,"gr")+xb("특별",`G.xdiv(${i})`,"gr"):"")+
(c.i===HOLD?"":opc("성장률",Math.round(c.g*100)+"%",m?xb("조정",`G.adj(${i},'g')`):""))+(fin||c.i===HOLD?"":opc(PSN(c.i),(c.ps||0)+"%",m?xb("조정",`G.adj(${i},'ps')`,"or"):""))+`</div></div>`;return h}
function sOv(c,i){const eps=epsT(c);return `<div class="card">${miniChart(c)}${obar(c)}</div>`+whyCard(c)+wOv(c,i)+
`<div class="pn"><div class="ph"><b>주주</b><span class="mu">내 그룹 ${grp(c,"P").toFixed(1)}% · 외부 최대 ${topRival(c,"P").toFixed(1)}%</span></div><div style="padding:4px 12px 10px">${holders(c)}</div></div>
<div class="card"><div class="g"><span>PER</span><span>${eps>0?(c.p/eps).toFixed(1):"적자"}</span><span>적정주가 추정</span><span>${W(c.tg)}</span><span>배당수익률</span><span>${dyv(c).toFixed(1)}%</span><span>다음 실적</span><span>D-${nxe(c)}</span></div></div>${repCard(i)}`+indCard(c)+anaCard(c)+rsCard(c)}
function myBS(){let st=0,bn=0,adv=0,der=0;for(const c of S.co){if(c.dead)continue;if(c.own.P)st+=hv(c,c.own.P);if(c.bh)bn+=bv(c);if(c.pa)adv+=c.pa*(rating(c)<6?1:.3);if(c.sp)der+=spv(c)}for(const o of S.op)der+=opv(o);
const x12=(S.fm||0)+cxv()+ppVal()+etfV()+owVal()+eoVal(),cash=S.cash+gbv(),oth=st+bn+adv+der+cmv()+x12;return `<div class="pn"><div class="ph"><b>내 대차대조표</b>${xb("명세서","G.pg('st')")}</div>`+brow("현금 + 국채",F(cash))+brow("주식 지분",F(st))+brow("채권·대여금·코인·ETF·기타",F(bn+adv+der+cmv()+x12))+brow("총자산",F(cash+oth))+brow("총부채 (개인 대출)",F(S.loan))+brow("<b>순자산</b>","<b>"+F(nw())+"</b>")+`</div>`}
function mktInd(){const h=S.ixh||[],ix0=h.length?ref10(h):S.ix,cell=(n,v,ch,k)=>`<div${k?` onclick="G.chart('${k}')" style="cursor:pointer"`:""}><span class="mu">${n}</span><span class="num mv">${v}${ch==null?"":`<i class="${Math.abs(ch)<.05?"mu":ch>0?"up":"dn"}">${Math.abs(ch)<.05?"–":(ch>0?"▲":"▼")+Math.abs(ch).toFixed(1)+"%"}</i>`}</span></div>`,
cs=[cell("주가지수",S.ix.toFixed(1),(S.ix/ix0-1)*100,"i:ALL"),cell("기준금리",S.prime.toFixed(2)+"%",null,"i:RATE"),cell("공포지수",S.IX&&S.IX.VIX?S.IX.VIX.v.toFixed(1):"–",null,"i:VIX"),cell("국채 가격",S.bp.toFixed(1),null,"i:BOND"),...S.cm.map((m,j)=>cell(m.n,Wc(m.p),(m.p/(m.hist.length?ref10(m.hist):m.p)-1)*100,"m:"+j))];if(cs.length%2)cs.push("<div></div>");
return `<div class="pn"><div class="ph"><b>시장 지표</b><span class="mu">약 10일 변화</span>${xb("은행·경제","G.go('b')")}</div><div class="mi2">${cs.join("")}</div></div>`}
function heat(){const xs=[];SEC.forEach((s,i)=>{const a=S.co.filter(c=>c.i===i&&!c.dead&&!c.priv);if(!a.length)return;let w=0,v=0;for(const c of a){const m0=mc(c);w+=m0;v+=chg(c)*m0}xs.push([i,s[0],v/Math.max(1e-9,w)*100,a.length])});
return `<div class="hm">${xs.map(([i,n,av,k])=>`<button class="hc" style="--hcl:${av>=0?"var(--up)":"var(--dn)"};--hk:${(.12+Math.min(1,Math.abs(av)/8)*.6).toFixed(2)}" onclick="fl=${i};flg=${grpOf(i)};tab='m';mseg=0;G.back()"><b>${n}</b><span class="num">${P1(av)}</span><span class="mu">${k}개</span></button>`).join("")}</div>`}

// ---- v11 charts: indicators, full chart page (canvas), index list, mini chart, technical summary, move reasons ----
const sma=(a,n)=>{const o=new Array(a.length).fill(null);let s=0;for(let i=0;i<a.length;i++){s+=a[i];if(i>=n)s-=a[i-n];if(i>=n-1)o[i]=s/n}return o};
const ema=(a,n)=>{const o=new Array(a.length).fill(null),k=2/(n+1);let e=null;for(let i=0;i<a.length;i++){e=e==null?a[i]:a[i]*k+e*(1-k);if(i>=n-1)o[i]=e}return o};
function rsi(a,n){n=n||14;const o=new Array(a.length).fill(null);let g=0,l=0;for(let i=1;i<a.length;i++){const d=a[i]-a[i-1],u=Math.max(d,0),w=Math.max(-d,0);
if(i<=n){g+=u;l+=w;if(i===n){g/=n;l/=n;o[i]=l?100-100/(1+g/l):100}}else{g=(g*(n-1)+u)/n;l=(l*(n-1)+w)/n;o[i]=l?100-100/(1+g/l):100}}return o}
function macd(a){const e1=ema(a,12),e2=ema(a,26),m=a.map((_,i)=>e2[i]==null?null:e1[i]-e2[i]),st=m.findIndex(x=>x!=null),sg=new Array(a.length).fill(null);
if(st>=0)ema(m.slice(st),9).forEach((x,j)=>sg[st+j]=x);return{m,s:sg,h:m.map((x,i)=>x==null||sg[i]==null?null:x-sg[i])}}
function boll(a,n,k){n=n||20;k=k||2;const mid=sma(a,n),up=[],lo=[];for(let i=0;i<a.length;i++){if(mid[i]==null){up.push(null);lo.push(null);continue}let s=0;for(let j=i-n+1;j<=i;j++)s+=(a[j]-mid[i])**2;const sd=Math.sqrt(s/n);up.push(mid[i]+k*sd);lo.push(mid[i]-k*sd)}return{mid,up,lo}}
function stoch(h,l,c){const raw=c.map((x,i)=>{if(i<13)return null;let hh=-1e18,ll=1e18;for(let j=i-13;j<=i;j++){hh=Math.max(hh,h[j]);ll=Math.min(ll,l[j])}return hh>ll?(x-ll)/(hh-ll)*100:50});
const sm=(a,n)=>a.map((_,i)=>{const w=a.slice(Math.max(0,i-n+1),i+1).filter(x=>x!=null);return w.length<n?null:w.reduce((p,q)=>p+q,0)/n}),k=sm(raw,3);return{k,d:sm(k,3)}}
// ---------- data for a chart key: "c:ID" company, "i:KEY" index, "m:J" commodity ----------
let CH={k:null,per:90,mo:0,ind:{ma:1,bb:0,vol:1,rsi:1,macd:0,stc:0},x:null,ret:null};
function chData(k){k=k||CH.k;if(!k)return null;const [t,id]=k.split(":");
if(t==="c"){const c=S.co[+id];if(!c||c.dead)return null;return{k,t,c,nm:c.tk+" "+c.n,sub:SEC[c.i][0],ser:dSeries(c),mon:(c.hm||[]).concat([c.p]),px:W,unit:"원",last:c.p}}
if(t==="i"){const o=S.IX&&S.IX[id];if(!o)return null;const pc=IXP.includes(id);return{k,t,o,nm:ixName(id),sub:ixSub(id),ser:iSeries(o),mon:(o.hm||[]).concat([o.v]),px:x=>x.toFixed(pc?2:1),unit:"",last:o.v}}
if(t==="m"){const m=S.cm[+id];if(!m)return null;return{k,t,m,nm:m.n,sub:m.k+" · "+m.u+"당",ser:cSeries(m),mon:(m.hm||[]).concat([m.p]),px:Wc,unit:"",last:m.p}}return chData12(t,id,k)}
G.chart=k=>{CH.ret=sel>=0?sel:null;CH.k=k;CH.x=null;sel=-1;pg="chart";render();scrollTo(0,0)};
G.chp=(p,mo)=>{CH.per=p;CH.mo=mo?1:0;CH.x=null;render()};G.chi=k=>{CH.ind[k]=CH.ind[k]?0:1;render()};G.chx=()=>{CH.x=null;drawChart()};
function monBars(cl){const o=[],h=[],l=[],c=[];for(let j=0;j<cl.length;j++){const pv=j?cl[j-1]:cl[j],x=cl[j];o.push(pv);c.push(x);const sp=Math.abs(x-pv)*.4+x*.02;h.push(Math.max(pv,x)+sp*hsh(j,cl.length,9));l.push(Math.min(pv,x)-sp*hsh(j,cl.length,10))}return{o,h,l,c,v:null,n:cl.length,mo:1}}
const dLab=(d,mo)=>{const y=(S.y0||2027)+Math.floor(d/360),r=((d%360)+360)%360,m=Math.floor(r/30)+1;return mo?y+"."+m:m+"월 "+(r%30+1)+"일"};
function chartPg(){const d=chData();if(!d)return hd("차트")+'<p class="mu">차트를 열 수 없습니다.</p>';const s=d.ser,n=s.n,ch1=n>1?(s.c[n-1]/s.c[n-2]-1)*100:0,chP=n>1?(s.c[n-1]/s.c[Math.max(0,n-1-Math.min(CH.per,n-1))]-1)*100:0;
const per=[[30,"1개월"],[90,"3개월"],[180,"6개월"],[DH,"1년"]].map(([p,t])=>B(t,`G.chp(${p},0)`,!CH.mo&&CH.per===p?"on":"")).join("")+B("월봉 전체","G.chp(90,1)",CH.mo?"on":""),
ind=[["ma","이동평균"],["bb","볼린저"],["vol","거래량"],["rsi","RSI"],["macd","MACD"],["stc","스토캐스틱"]].map(([k,t])=>B(t,`G.chi('${k}')`,CH.ind[k]?"on":"")).join("");
let h=hd("차트 분석")+`<div class="row"><span style="min-width:0"><b style="font-size:18px">${esc(d.nm)}</b> <span class="mu">${esc(d.sub)}</span></span>${d.t==="c"?`<button style="flex:none;white-space:nowrap" onclick="G.pick(${d.c.id})">종목 정보</button>`:""}</div>
<div class="row" style="margin-top:4px"><b class="big ${ch1>=0?"up":"dn"}" style="font-size:26px">${d.px(d.last)}${d.unit&&d.px!==W?d.unit:""}</b><span class="num mu" style="text-align:right">오늘 <span class="${ch1>=0?"up":"dn"}">${P1(ch1)}</span><br>${CH.mo?"월봉":CH.per+"일"} <span class="${chP>=0?"up":"dn"}">${P1(chP)}</span></span></div>
<div class="ch" style="margin-top:8px">${per}</div><div class="ch" style="margin-top:6px">${ind}</div>
<div class="cvw"><canvas id="cv" aria-label="${esc(d.nm)} 가격 차트"></canvas><div id="cvi" class="cvi" hidden></div></div><div class="mu" style="margin-top:4px">차트를 손가락으로 밀면 그날의 시가·고가·저가·종가가 보여요. ${d.t==="c"?"▲E는 실적 발표, B·S는 내 매수·매도.":""}</div>`;
if(!CH.mo&&n>30){const ts=techSum(s);h+=`<div class="pn" style="margin-top:12px"><div class="ph"><b>기술적 분석 요약</b><span class="mu">매수 ${ts.b} · 중립 ${ts.z} · 매도 ${ts.s}</span></div>${ts.rows.map(([a,b,sg])=>brow(a,`<span class="${sg>0?"up":sg<0?"dn":""}">${b}</span>`)).join("")}<div class="br mu" style="line-height:1.6">게임 속 가격도 확률로 움직여요. 신호는 참고용이고, 실적과 업황이 결국 주가를 끌고 갑니다. ${B("개념서: 차트 읽기","G.book('chart')")}</div></div>`}
if(d.t==="c")h+=whyCard(d.c);if(d.t==="i"&&d.k!=="i:VIX"&&d.k!=="i:RATE"&&d.k!=="i:BOND")h+=ixMembers(d.k.slice(2));return h}
// ---------- canvas drawing ----------
function cssv(n,f){try{return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||f}catch(e){return f}}
function drawChart(){const cv=$("cv");if(!cv||!cv.getContext)return;const d=chData();if(!d)return;
const full=CH.mo?monBars(d.mon.slice(-120)):d.ser,N=full.n;if(N<2){const x=cv.getContext("2d");return}
const ma=[5,20,60,120].map(p=>sma(full.c,p)),bb=boll(full.c),rs=rsi(full.c),md=macd(full.c),st=stoch(full.h,full.l,full.c),vm=full.v?sma(full.v,20):null;
const vis=CH.mo?N:Math.min(CH.per,N),s0=N-vis,sl=a=>a?a.slice(s0):null;
const o=sl(full.o),h=sl(full.h),l=sl(full.l),c=sl(full.c),v=sl(full.v);
const dpr=window.devicePixelRatio||1,Wd=Math.max(260,cv.clientWidth||cv.parentNode&&cv.parentNode.clientWidth||340),AX=54,pw=Wd-AX;
const panes=[["main",230]];if(CH.ind.vol&&v)panes.push(["vol",64]);if(CH.ind.rsi)panes.push(["rsi",76]);if(CH.ind.macd)panes.push(["macd",84]);if(CH.ind.stc)panes.push(["stc",76]);
const Ht=panes.reduce((a,p)=>a+p[1],0)+22;cv.style.height=Ht+"px";cv.width=Math.round(Wd*dpr);cv.height=Math.round(Ht*dpr);const x=cv.getContext("2d");x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,Wd,Ht);
const UP=cssv("--up","#ff5a5a"),DN=cssv("--dn","#4c9dff"),MU=cssv("--mu","#7f8b9b"),LN=cssv("--ln","#1b2635"),TX=cssv("--tx","#eef2f7"),GD=cssv("--gold","#e9c46a");
const cw=pw/vis,bw=Math.max(1,Math.min(14,cw*.68)),X=i=>i*cw+cw/2;x.font="11px system-ui,sans-serif";x.textBaseline="middle";let y0=0;const fmt=d.px;
const line=(arr,Y,col,wd)=>{x.strokeStyle=col;x.lineWidth=wd||1.3;x.beginPath();let on=0;arr.forEach((val,i)=>{if(val==null){on=0;return}const yy=Y(val);if(!on){x.moveTo(X(i),yy);on=1}else x.lineTo(X(i),yy)});x.stroke()};
const grid=(top,ht,mn,mx,f)=>{x.strokeStyle=LN;x.lineWidth=1;x.fillStyle=MU;x.textAlign="left";for(let k=0;k<=3;k++){const yy=top+6+(ht-12)*k/3;x.beginPath();x.moveTo(0,yy);x.lineTo(pw,yy);x.stroke();x.fillText(f(mx-(mx-mn)*k/3),pw+4,yy)}};
for(const [pn,ph] of panes){const top=y0;y0+=ph;
if(pn==="main"){let mn=Math.min(...l),mx=Math.max(...h);if(CH.ind.bb){sl(bb.lo).forEach(q=>q!=null&&(mn=Math.min(mn,q)));sl(bb.up).forEach(q=>q!=null&&(mx=Math.max(mx,q)))}const pad=(mx-mn)*.06||mx*.02;mn-=pad;mx+=pad;
const Y=val=>top+6+(mx-val)/(mx-mn)*(ph-12);grid(top,ph,mn,mx,fmt);
if(CH.ind.bb){const up=sl(bb.up),lo=sl(bb.lo);x.fillStyle="rgba(138,180,255,.10)";x.beginPath();let st2=-1;up.forEach((q,i)=>{if(q==null)return;if(st2<0){x.moveTo(X(i),Y(q));st2=i}else x.lineTo(X(i),Y(q))});for(let i=lo.length-1;i>=0;i--)if(lo[i]!=null)x.lineTo(X(i),Y(lo[i]));x.closePath();x.fill();line(up,Y,"rgba(138,180,255,.6)",1);line(lo,Y,"rgba(138,180,255,.6)",1)}
for(let i=0;i<vis;i++){const u=c[i]>=o[i],col=u?UP:DN;x.strokeStyle=col;x.fillStyle=col;x.lineWidth=1;x.beginPath();x.moveTo(X(i),Y(h[i]));x.lineTo(X(i),Y(l[i]));x.stroke();const a=Y(Math.max(o[i],c[i])),b2=Y(Math.min(o[i],c[i]));x.fillRect(X(i)-bw/2,a,bw,Math.max(1,b2-a))}
if(CH.ind.ma){const mc4=[GD,"#ff6ad5","#3ddc84","#8ab4ff"];mc4.forEach((col,k)=>line(sl(ma[k]),Y,col,1.4));x.textAlign="left";x.font="bold 10px system-ui,sans-serif";let lx=6;[5,20,60,120].forEach((p,k)=>{const t=(CH.mo?"":"")+p+(CH.mo?"개월":"일");x.fillStyle=mc4[k];x.fillText(t,lx,top+12);lx+=x.measureText(t).width+9});x.font="11px system-ui,sans-serif"}
if(d.t==="c"&&!CH.mo){x.textAlign="center";x.font="bold 10px system-ui,sans-serif";const d0=S.day-vis+1;for(let i=0;i<vis;i++){const dd=d0+i;if(dd%90===d.c.off){x.fillStyle=GD;x.fillText("▲E",X(i),top+ph-8)}}
for(const t of S.tx){if(t.ci!==d.c.id||t.day==null||t.day<d0)continue;const i=t.day-d0;if(i<0||i>=vis)continue;const b=t.t==="매수";if(!b&&t.t!=="매도")continue;x.fillStyle=b?UP:DN;x.fillText(b?"B":"S",X(i),Y(c[i])+(b?14:-14))}x.font="11px system-ui,sans-serif"}
if(CH.x!=null){const i=Math.min(vis-1,CH.x);x.strokeStyle=TX;x.globalAlpha=.5;x.setLineDash([3,3]);x.beginPath();x.moveTo(X(i),0);x.lineTo(X(i),Ht-22);x.moveTo(0,Y(c[i]));x.lineTo(pw,Y(c[i]));x.stroke();x.setLineDash([]);x.globalAlpha=1}}
else if(pn==="vol"){const mx=Math.max(...v)||1;x.fillStyle=MU;x.textAlign="left";x.fillText(d.t==="i"?"거래대금":"거래량",pw+4,top+8);for(let i=0;i<vis;i++){const hh=v[i]/mx*(ph-12);x.fillStyle=c[i]>=o[i]?UP:DN;x.globalAlpha=.55;x.fillRect(X(i)-bw/2,top+ph-4-hh,bw,hh);x.globalAlpha=1}line(sl(vm),q=>top+ph-4-q/mx*(ph-12),GD,1.2);x.strokeStyle=LN;x.beginPath();x.moveTo(0,top);x.lineTo(pw,top);x.stroke()}
else if(pn==="rsi"){const Y=q=>top+4+(100-q)/100*(ph-8);x.strokeStyle=LN;x.beginPath();x.moveTo(0,top);x.lineTo(pw,top);x.stroke();x.setLineDash([3,3]);x.strokeStyle=MU;[70,30].forEach(q=>{x.beginPath();x.moveTo(0,Y(q));x.lineTo(pw,Y(q));x.stroke()});x.setLineDash([]);line(sl(rs),Y,"#c792ea",1.4);x.fillStyle=MU;x.textAlign="left";x.fillText("RSI 70",pw+4,Y(70));x.fillText("30",pw+4,Y(30))}
else if(pn==="macd"){const m=sl(md.m),sg=sl(md.s),hi=sl(md.h),all=[...m,...sg,...hi].filter(q=>q!=null),mx=Math.max(1e-9,...all.map(Math.abs)),Y=q=>top+ph/2-q/mx*(ph/2-6);x.strokeStyle=LN;x.beginPath();x.moveTo(0,top);x.lineTo(pw,top);x.stroke();
hi.forEach((q,i)=>{if(q==null)return;x.fillStyle=q>=0?UP:DN;x.globalAlpha=.5;x.fillRect(X(i)-bw/2,Math.min(Y(q),Y(0)),bw,Math.abs(Y(q)-Y(0)));x.globalAlpha=1});line(m,Y,"#8ab4ff",1.3);line(sg,Y,GD,1.3);x.fillStyle=MU;x.textAlign="left";x.fillText("MACD",pw+4,top+10)}
else if(pn==="stc"){const Y=q=>top+4+(100-q)/100*(ph-8);x.strokeStyle=LN;x.beginPath();x.moveTo(0,top);x.lineTo(pw,top);x.stroke();x.setLineDash([3,3]);x.strokeStyle=MU;[80,20].forEach(q=>{x.beginPath();x.moveTo(0,Y(q));x.lineTo(pw,Y(q));x.stroke()});x.setLineDash([]);line(sl(st.k),Y,"#8ab4ff",1.3);line(sl(st.d),Y,GD,1.3);x.fillStyle=MU;x.textAlign="left";x.fillText("%K %D",pw+4,top+10)}}
// x labels
x.fillStyle=MU;x.textAlign="center";const d0=CH.mo?null:S.day-vis+1,mN=full.n;for(let k=0;k<4;k++){const i=Math.round((vis-1)*(k+.5)/4);const lab=CH.mo?dLab(S.day-(vis-1-i)*30,1):dLab(d0+i);x.fillText(lab,X(i),Ht-10)}
// crosshair readout
const box=$("cvi");if(box){if(CH.x==null){box.hidden=true}else{const i=Math.min(vis-1,CH.x),pv=i?c[i-1]:o[i],cg=(c[i]/pv-1)*100,dd=CH.mo?S.day-(vis-1-i)*30:d0+i;box.hidden=false;
box.innerHTML=`<b>${dLab(dd,CH.mo)}</b> 시 ${fmt(o[i])} 고 ${fmt(h[i])} 저 ${fmt(l[i])} 종 <b>${fmt(c[i])}</b> <span class="${cg>=0?"up":"dn"}">${P1(cg)}</span>${v?" · "+(d.t==="i"?F(v[i]):(v[i]>=1?v[i].toFixed(1)+"만주":Math.round(v[i]*1e4)+"주")):""}${CH.ind.ma&&sl(ma[1])[i]!=null?" · 20일선 "+fmt(sl(ma[1])[i]):""}${CH.ind.rsi&&sl(rs)[i]!=null?" · RSI "+sl(rs)[i].toFixed(0):""} <button class="xs" onclick="G.chx()">닫기</button>`}}
cv.onpointerdown=cv.onpointermove=e=>{if(e.type==="pointermove"&&e.pointerType!=="mouse"&&!e.buttons&&!e.pressure)return;const r=cv.getBoundingClientRect(),i=Math.floor((e.clientX-r.left)/cw);if(i<0||i>=vis)return;if(CH.x!==i){CH.x=i;drawChart()}}}
// ---------- technical summary (beginner wording) ----------
function techSum(s){const c=s.c,n=c.length,last=c[n-1],m5=sma(c,5),m20=sma(c,20),m60=sma(c,60),m120=sma(c,120),r=rsi(c),md=macd(c),bb=boll(c),rows=[];let b=0,z=0,sl=0;const sig=q=>{q>0?b++:q<0?sl++:z++;return q};
const a=[m5[n-1],m20[n-1],m60[n-1],m120[n-1]];if(a.every(q=>q!=null)){const up=a[0]>a[1]&&a[1]>a[2]&&a[2]>a[3],dn=a[0]<a[1]&&a[1]<a[2]&&a[2]<a[3];rows.push(["이동평균 배열",up?"정배열 — 상승 추세":dn?"역배열 — 하락 추세":"혼조 — 방향 탐색 중",sig(up?1:dn?-1:0)])}
else if(m20[n-1]!=null)rows.push(["20일선 대비",last>=m20[n-1]?"20일선 위 — 단기 강세":"20일선 아래 — 단기 약세",sig(last>=m20[n-1]?1:-1)]);
let cr=0;for(let k=Math.max(1,n-5);k<n;k++){if(m5[k-1]!=null&&m20[k-1]!=null){if(m5[k-1]<=m20[k-1]&&m5[k]>m20[k])cr=1;if(m5[k-1]>=m20[k-1]&&m5[k]<m20[k])cr=-1}}
rows.push(["5일선·20일선",cr>0?"최근 골든크로스 — 단기 반등 신호":cr<0?"최근 데드크로스 — 단기 약세 신호":"교차 없음",sig(cr)]);
const R=r[n-1];if(R!=null)rows.push(["RSI(14) "+R.toFixed(0),R>70?"과매수 — 단기 과열, 조정 가능":R<30?"과매도 — 단기 바닥 가능":R>=50?"50 위 — 매수세 우위":"50 아래 — 매도세 우위",sig(R>70?-1:R<30?1:0)]);
const M=md.m[n-1],Sg=md.s[n-1];if(M!=null&&Sg!=null){let x=0;for(let k=Math.max(1,n-3);k<n;k++){if(md.m[k-1]!=null&&md.s[k-1]!=null){if(md.m[k-1]<=md.s[k-1]&&md.m[k]>md.s[k])x=1;if(md.m[k-1]>=md.s[k-1]&&md.m[k]<md.s[k])x=-1}}
rows.push(["MACD",x>0?"시그널선 상향 돌파 — 매수 신호":x<0?"시그널선 하향 돌파 — 매도 신호":M>Sg?"시그널선 위 — 상승 탄력":"시그널선 아래 — 하락 탄력",sig(x||(M>Sg?1:-1))])}
const up=bb.up[n-1],lo=bb.lo[n-1];if(up!=null){const pb=(last-lo)/Math.max(1e-9,up-lo);rows.push(["볼린저밴드",pb>1?"상단 돌파 — 강한 상승 또는 과열":pb<0?"하단 이탈 — 과매도 구간":pb>.8?"상단 근처":pb<.2?"하단 근처":"밴드 중간",sig(pb<0?1:pb>1?-1:0)])}
if(s.v){const va=sma(s.v,20)[n-1];if(va){const k=s.v[n-1]/va;rows.push(["거래량",k>2?"평소의 "+k.toFixed(1)+"배 급증 — 큰 관심":k<.6?"평소보다 한산":"평소 수준",sig(0)])}}
const lb=Math.min(n,250),hh=Math.max(...s.h.slice(-lb)),ll=Math.min(...s.l.slice(-lb));rows.push(["최근 "+lb+"일 범위",s.c[n-1]>=hh*.98?"신고가 근처 — 강한 종목":s.c[n-1]<=ll*1.02?"신저가 근처 — 약한 종목":"고가 대비 "+P1((last/hh-1)*100)+" · 저가 대비 "+P1((last/ll-1)*100),sig(s.c[n-1]>=hh*.98?1:s.c[n-1]<=ll*1.02?-1:0)]);
const sup=Math.min(...s.l.slice(-60)),res=Math.max(...s.h.slice(-60));rows.push(["60일 지지·저항","지지 "+(chData()?chData().px(sup):W(sup))+" · 저항 "+(chData()?chData().px(res):W(res)),sig(0)]);return{rows,b,z,s:sl}}
// ---------- why did it move ----------
function whyCard(c){if(c.priv||!c.wd)return"";const f=x=>P1(x/100),w=c.wd,t=c.w10,sn=SEC[c.i][0],sr=S.sw&&S.sw[c.i],gp=c.tg?(c.p/c.tg-1)*100:0,M=S.mk||{};
const rows=[["시장 (베타 "+(c.be||1).toFixed(2)+")",w[0],t[0],M.why||""],["업종 · "+sn,w[1],t[1],sr||""],["적정가 회귀",w[2],t[2],"적정가 대비 "+P1(gp)+(c.nf&&Math.abs(c.nf)>=.005?" · 시장 기대 "+P1((Math.exp(c.nf)-1)*100):"")],["회사 고유 요인",w[3],t[3],""],["실적·뉴스 이벤트",w[4],t[4],c.sur!=null?"최근 실적 서프라이즈 "+(c.sur>=0?"+":"")+c.sur+"%":""],["매매 수급 (대량 주문)",w[5],t[5],""]];
return `<div class="pn"><div class="ph"><b>왜 움직였나</b><span class="mu">오늘 · 최근 약 10일</span></div>`+rows.map(([a,d1,d10,why])=>`<div class="br"><span class="bl">${a}${why?`<div class="mu" style="white-space:normal">${esc(why)}</div>`:""}</span><span class="bv num"><span class="${d1>=0?"up":"dn"}">${f(d1)}</span> · <span class="${d10>=0?"up":"dn"}">${f(d10)}</span></span></div>`).join("")+
`<div class="br mu" style="line-height:1.6;white-space:normal">주가 = 시장 흐름 × 베타 + 업종 흐름 + 적정가로 끌려가는 힘 + 회사 고유 요인 + 실적·뉴스. 적정가는 최근 4분기 이익(EPS)과 자산(BPS)으로 정해지고, 회사 소식이 쌓인 \'시장 기대\'만큼 위아래로 벌어질 수 있어요(기대는 쉽게 사라지지 않고 아주 천천히 옅어져요). ${c.est!=null?"다음 실적 예상 EPS "+W(c.est)+" (D-"+nxe(c)+").":""}</div></div>`}
// ---------- mini chart (svg) for the overview ----------
function miniChart(c){const nd='<div class="mu" style="padding:18px 0;text-align:center">상장 후 거래 기록이 쌓이면 차트가 보여요.</div>';if(!c.hn||c.hn<5)return nd;const s=dSeries(c,60),n=s.n;if(n<5)return nd;const W0=320,H0=128,VH=26,mx=Math.max(...s.h),mn=Math.min(...s.l),Y=v=>4+(mx-v)/(mx-mn||1)*(H0-VH-10),cw=W0/n,bw=Math.max(1,cw*.62),vm=Math.max(...s.v)||1,m20=sma(dSeries(c,80).c,20).slice(-n);
let g="";for(let i=0;i<n;i++){const u=s.c[i]>=s.o[i],col=u?"var(--up)":"var(--dn)",xx=i*cw+cw/2;g+=`<line x1="${xx.toFixed(1)}" x2="${xx.toFixed(1)}" y1="${Y(s.h[i]).toFixed(1)}" y2="${Y(s.l[i]).toFixed(1)}" stroke="${col}"/><rect x="${(xx-bw/2).toFixed(1)}" y="${Y(Math.max(s.o[i],s.c[i])).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1,Y(Math.min(s.o[i],s.c[i]))-Y(Math.max(s.o[i],s.c[i]))).toFixed(1)}" fill="${col}"/><rect x="${(xx-bw/2).toFixed(1)}" y="${(H0-s.v[i]/vm*VH).toFixed(1)}" width="${bw.toFixed(1)}" height="${(s.v[i]/vm*VH).toFixed(1)}" fill="${col}" opacity=".35"/>`}
const pts=m20.map((v,i)=>v==null?null:(i*cw+cw/2).toFixed(1)+","+Y(v).toFixed(1)).filter(Boolean).join(" ");
return `<div onclick="G.chart('c:${c.id}')" style="cursor:pointer"><svg viewBox="0 0 ${W0} ${H0}" width="100%" height="${H0}" role="img" aria-label="최근 60일 일봉 차트">${g}${pts?`<polyline fill="none" stroke="var(--gold)" stroke-width="1.4" points="${pts}"/>`:""}</svg><div class="row mu"><span>60일 일봉 · 노란선 20일 이동평균</span><span>차트 크게 보기 ›</span></div></div>`}
// ---------- index list ----------
function ixRow(k,lab){const o=S.IX[k];if(!o||!o.hn)return"";const lv=ringGet(o.lv,o.hn,61).map(x=>x/100),n=lv.length,d1=n>1?(lv[n-1]/lv[n-2]-1)*100:0,d10=n>10?(lv[n-1]/lv[n-11]-1)*100:0,pc=IXP.includes(k),pp=pc&&k!=="VIX",dp=j=>(lv[n-1]-lv[Math.max(0,n-1-j)]>=0?"+":"")+(lv[n-1]-lv[Math.max(0,n-1-j)]).toFixed(2)+"%p";
return `<div class="rw" onclick="G.chart('i:${k}')"><div class="nm"><b style="font-size:15px">${esc(lab||ixName(k))}</b><div class="mu">${k==="VIX"?(o.v>30?"공포 — 변동성 큼":o.v<15?"안정 — 변동성 작음":"보통"):"10일 "+(pp?dp(10):P1(d10))}</div></div>${spark(lv.slice(-60),86,28)}<div class="r"><b class="num">${o.v.toFixed(pc?2:1)}</b><div class="mu num ${d1>=0?"up":"dn"}">${pp?dp(1):P1(d1)}</div></div></div>`}
function ixPg(){const ids=SEC.map((_,i)=>i).filter(i=>i!==HOLD&&S.co.some(c=>c.i===i&&!c.dead&&!c.priv));return `<h4>대표 지수</h4>`+["ALL","L50","SML","VIX"].map(k=>ixRow(k)).join("")+`<h4>업종 그룹 지수</h4>`+GRP.map((g,i)=>ixRow("G"+i,g[1]+" ("+g[0]+")")).join("")+
`<h4>업종 지수</h4>`+GRP.map((g,gi)=>ids.filter(i=>grpOf(i)===gi).map(i=>ixRow("S"+i)).join("")).join("")+`<h4>금리 · 채권</h4>`+ixRow("RATE")+ixRow("YS")+ixRow("YL")+ixRow("BOND")+`<h4>거시 지표</h4>`+ixRow("INF")+ixRow("FXR")+`<p class="mu" style="line-height:1.6">지수는 시가총액이 큰 회사일수록 더 크게 반영돼요(시가총액 가중). 대형 50은 시가총액 상위 50개(1년에 한 번 교체, 80위 안이면 유지), 중소형은 나머지입니다. 공포지수는 최근 시장 변동성을 연율로 나타낸 값이에요.</p>`}
function ixMembers(k){let a=[];if(k==="ALL")return"";const L5=new Set(S.l50||[]);a=S.co.filter(c=>!c.dead&&!c.priv&&(k==="L50"?L5.has(c.id):k==="SML"?!L5.has(c.id):k[0]==="G"?grpOf(c.i)===+k.slice(1):c.i===+k.slice(1))).sort((x,y)=>mc(y)-mc(x));const tot=a.reduce((s,c)=>s+mc(c),0)||1;
return `<h4>구성 종목 상위 (비중)</h4>`+a.slice(0,10).map(c=>`<div class="sr" onclick="G.pick(${c.id})"><span><b>${esc(c.tk)}</b> <span class="mu">${esc(c.n)}</span></span><span class="num">${(mc(c)/tot*100).toFixed(1)}% · <span class="${chg(c)>=0?"up":"dn"}">${P1(chg(c)*100)}</span></span></div>`).join("")}
// index items on the ticker tape (like the original's quote bar)
function tapeIx(){if(!S.IX)return"";const it=(n,k)=>{const o=S.IX[k];if(!o||!o.hn)return"";const a=o.lv[(o.hn-1)%DH]/100,b=o.hn>1?o.lv[(o.hn-2)%DH]/100:a,p=(a/b-1)*100;return `<span class="ti"><b>${n}</b> ${o.v.toFixed(k==="VIX"?1:1)} <i class="${p>=0?"up":"dn"}">${p>=0?"▲":"▼"}${Math.abs(p).toFixed(1)}%</i></span>`};
return it("WSR종합","ALL")+it("대형50","L50")+it("공포","VIX")+GRP.map((g,k)=>it(g[0],"G"+k)).join("")}
// screener technical conditions
function techOk(c,k){if(!c.hn||c.hn<30)return false;const s=dSeries(c,130),cl=s.c,n=cl.length;
if(k==="rsi"){const r=rsi(cl);return r[n-1]!=null&&r[n-1]<=30}
if(k==="gc"){const a=sma(cl,5),b=sma(cl,20);for(let j=Math.max(1,n-5);j<n;j++)if(a[j-1]!=null&&b[j-1]!=null&&a[j-1]<=b[j-1]&&a[j]>b[j])return true;return false}
if(k==="hi")return cl[n-1]>=Math.max(...s.h)*.97;
if(k==="vol"){const v=sma(s.v,20);return v[n-1]!=null&&s.v[n-1]>2*v[n-1]}
if(k==="up"){const m=[5,20,60,120].map(p=>sma(cl,p)[n-1]);return m.every(x=>x!=null)&&m[0]>m[1]&&m[1]>m[2]&&m[2]>m[3]}return true}

// ---- v11 개념서: a beginner's guide to markets, written for this game ----
const BK=[
["start","처음 5분 — 이 게임은 무엇을 하나요","목표와 첫 행동",
"<p>이 게임의 목표는 <b>순자산</b>을 키우는 거예요. 순자산 = 내 현금 + 내가 가진 주식·채권·원자재의 값 − 내 빚. 화면 맨 위 '순자산'이 점수입니다.</p><p>돈을 버는 길은 크게 네 가지예요.</p><ul><li><b>싸게 사서 비싸게 팔기</b> — 주가가 오르면 차익이 생겨요.</li><li><b>배당 받기</b> — 회사가 이익의 일부를 주주에게 나눠 줘요.</li><li><b>회사 지배하기</b> — 지분 20% 이상 + 최대 주주가 되면 그 회사를 경영해요. 회사 돈으로 다른 회사를 사며 제국을 키울 수 있어요.</li><li><b>인수합병</b> — 저평가된 회사를 통째로 사서 키우거나 되팔아요.</li></ul><p>처음엔 이렇게 해 보세요: ① 시장 탭에서 마음에 드는 회사를 골라 1~5%만 사 보기 → ② 종목 화면의 차트와 재무 탭 구경하기 → ③ 돈이 모이면 작은 회사의 경영권(20%)에 도전하기.</p>",
"속도 버튼(1x~30x)으로 시간을 흐르게 하고, 정지로 멈춰 생각할 수 있어요. 미션 카드는 따라 하면 되는 길잡이예요(안 해도 됩니다).",[["시장 보기","G.go('m')"],["미션·업적","G.pg('ac')"]]],
["stock","주식, 주가, 시가총액","회사의 한 조각을 산다는 것",
"<p><b>주식</b>은 회사의 소유권을 잘게 나눈 조각이에요. 1% 가지면 그 회사의 1%를 가진 주인입니다.</p><p><b>주가</b>는 한 주의 가격, <b>시가총액</b>은 주가 × 전체 주식 수 = 회사 전체의 시장 가격이에요. 시가총액 1,000억인 회사의 10%를 사려면 약 100억이 듭니다(많이 사면 가격이 올라 더 들어요).</p><p>주가는 결국 회사가 <b>얼마나 돈을 버는지</b>(이익)와 <b>무엇을 가졌는지</b>(자산)를 따라가요. 단기적으로는 시장 분위기, 업종 소식, 수급에 흔들립니다.</p>",
"종목 화면 위쪽에 주가와 시가총액, '10일' 변화율이 보여요. 대형·중형·소형은 시가총액 크기 구분입니다.",[]],
["index","지수 — 시장 전체의 온도계","종합지수, 대형 50, 업종 지수, 공포지수",
"<p>개별 종목만 보면 시장 전체 흐름을 놓쳐요. <b>지수</b>는 여러 종목의 가격을 묶어 하나의 숫자로 만든 거예요.</p><ul><li><b>WSR 종합</b> — 상장된 모든 회사(시가총액이 클수록 비중 큼).</li><li><b>WSR 대형 50</b> — 시가총액 상위 50개(1년에 한 번 바꾸고, 80위 안에 있으면 남겨 둬요). <b>중소형</b>은 나머지. 중소형주는 위기 때 더 크게 빠지고, 분위기가 좋을 땐 더 크게 오르는 편이에요.</li><li><b>업종 그룹·업종 지수</b> — 기술, 소비, 산업재… 와 반도체, 화학 같은 업종별 흐름.</li><li><b>공포지수</b> — 시장이 최근 얼마나 출렁였는지(변동성). 30을 넘으면 공포, 15 아래면 안정이에요.</li></ul><p>내 종목이 떨어졌을 때 지수도 같이 떨어졌다면 '시장 탓', 지수는 오르는데 내 종목만 빠졌다면 '회사나 업종 탓'일 가능성이 커요.</p>",
"시장 탭 → 지수에서 모든 지수의 차트를 볼 수 있어요. 공포지수가 치솟을 때가 싸게 살 기회인 경우가 많습니다.",[["지수 보기","G.go('m');G.seg(2)"]]],
["chart","차트 읽기 1 — 캔들과 거래량","하루를 막대 하나로",
"<p><b>캔들(봉)</b> 하나는 하루의 가격 움직임이에요. 몸통의 아래·위는 시작가(시가)와 마지막 가격(종가), 위아래로 삐죽 나온 꼬리는 그날 최고가(고가)와 최저가(저가)입니다.</p><ul><li><b>양봉</b>: 종가 > 시가 (오른 날). 이 게임 기본 설정에서 빨강.</li><li><b>음봉</b>: 종가 &lt; 시가 (내린 날). 파랑.</li><li>긴 아래꼬리 = 장중에 많이 빠졌다가 회복 → 아래에서 사려는 힘이 강함.</li></ul><p><b>거래량</b>은 그날 사고판 주식 수예요. 큰 상승·하락이 <b>거래량 급증</b>과 함께 나오면 의미가 크고, 거래량 없이 움직이면 금방 되돌아가기 쉬워요. 실적 발표 날에는 거래량이 늘어요.</p>",
"차트 화면에서 손가락으로 차트를 밀면 그날의 시가·고가·저가·종가·거래량이 보여요. ▲E는 실적 발표일, B/S는 내 매수·매도예요.",[["개념서: 이동평균","G.book('chart2')"]]],
["chart2","차트 읽기 2 — 추세, 이동평균, 지지·저항","방향을 읽는 법",
"<p><b>이동평균선</b>은 최근 N일 종가의 평균을 이은 선이에요. 5일선은 짧은 흐름, 20일선은 한 달 흐름, 60·120일선은 큰 흐름을 보여 줘요.</p><ul><li><b>정배열</b>(5 > 20 > 60 > 120): 꾸준한 상승 추세.</li><li><b>역배열</b>: 꾸준한 하락 추세.</li><li><b>골든크로스</b>: 짧은 선이 긴 선을 아래에서 위로 뚫음 → 상승 전환 신호.</li><li><b>데드크로스</b>: 반대 → 하락 전환 신호.</li></ul><p><b>지지선</b>은 여러 번 떨어지다 멈춘 가격대, <b>저항선</b>은 여러 번 오르다 막힌 가격대예요. 저항을 거래량과 함께 뚫으면 새 추세가 시작되기도 해요.</p>",
"차트 아래 '기술적 분석 요약'이 배열, 교차, 지지·저항을 쉬운 말로 알려 줘요.",[["개념서: 보조지표","G.book('chart3')"]]],
["chart3","차트 읽기 3 — RSI, MACD, 볼린저밴드","과열과 침체 재기",
"<ul><li><b>RSI</b>(0~100): 최근 오른 힘과 내린 힘의 비율. 70 위는 '과매수'(너무 많이 올라 쉬어 갈 수 있음), 30 아래는 '과매도'(너무 많이 빠져 반등할 수 있음).</li><li><b>MACD</b>: 짧은 평균(12일)과 긴 평균(26일)의 차이. MACD선이 시그널선을 위로 뚫으면 상승 탄력, 아래로 뚫으면 하락 탄력.</li><li><b>볼린저밴드</b>: 20일선 위아래로 변동성만큼 그린 띠. 띠 밖으로 나가면 평소보다 크게 움직인 것(과열·과매도), 띠가 좁아지면 곧 크게 움직일 수 있어요.</li><li><b>스토캐스틱</b>: 최근 14일 범위에서 지금 가격의 위치(%). 80 위 과열, 20 아래 침체.</li></ul><p>지표는 <b>보조</b>예요. 실적이 나빠지는 회사는 과매도가 계속될 수 있어요. 여러 신호가 같은 방향을 가리킬 때 믿을 만합니다.</p>",
"차트 화면의 지표 칩을 눌러 켜고 끌 수 있어요.",[]],
["fs1","재무제표 1 — 손익계산서","얼마 벌었나",
"<p>손익계산서는 한 분기 동안의 <b>성적표</b>예요. 위에서 아래로 빼 나가요.</p><ul><li><b>매출액</b>: 판 금액 전체.</li><li>− 매출원가 = <b>매출총이익</b></li><li>− 판매관리비·R&D = <b>영업이익</b> (본업으로 번 돈, 가장 중요)</li><li>− 이자비용 + 이자수익 − 법인세 + 지분법 이익 = <b>순이익</b></li></ul><p><b>영업이익률</b> = 영업이익 ÷ 매출. 같은 업종에서 이익률이 높으면 경쟁력이 강한 회사예요. <b>지분법 이익</b>은 20% 이상 가진 다른 회사 이익 중 내 몫이에요(현금이 들어온 건 아님).</p>",
"종목 화면 → 재무 → 손익에서 8분기를 볼 수 있어요. '최근 4분기'는 1년 합계입니다.",[["개념서: 재무상태표","G.book('fs2')"]]],
["fs2","재무제표 2 — 재무상태표","무엇을 가졌고 얼마나 빌렸나",
"<p>재무상태표는 어느 한 시점의 <b>재산 목록</b>이에요. 공식은 하나: <b>자산 = 부채 + 자본</b>.</p><ul><li><b>자산</b>: 현금, 매출채권·재고, 설비(유형자산), 다른 회사 지분, 영업권(인수 때 더 낸 웃돈).</li><li><b>부채</b>: 은행 대출, 회사채, 내가 빌려준 대여금 등 갚아야 할 돈.</li><li><b>자본</b>: 자산에서 부채를 뺀 순수 주주 몫. 주당으로 나누면 <b>BPS</b>.</li></ul><p><b>부채비율</b> = 부채 ÷ 자본. 높으면 이자 부담이 크고 불황에 위험해요. 은행은 원래 예금(부채)이 많아서 9배 기준으로 봐요.</p>",
"재무 → 재무상태에서 확인. 경영 중인 회사라면 개요 탭에서 바로 차입·상환, 회사채 발행을 할 수 있어요.",[["개념서: 현금흐름","G.book('fs3')"]]],
["fs3","재무제표 3 — 현금흐름표","진짜 현금은 어디로",
"<p>이익과 현금은 달라요. 현금흐름표는 돈이 실제로 어디서 들어오고 나갔는지 보여 줘요.</p><ul><li><b>영업활동</b>: 본업으로 들어온 현금(순이익 + 감가상각 등 현금이 안 나간 비용).</li><li><b>투자활동</b>: 설비투자, 지분 매매.</li><li><b>재무활동</b>: 빌리고 갚기, 배당, 증자.</li></ul><p><b>잉여현금흐름(FCF)</b> = 영업현금 − 설비투자. 이게 꾸준히 플러스인 회사가 배당도 늘리고 빚도 갚을 수 있는 튼튼한 회사예요.</p>",
"성장률을 높이면 설비투자가 늘어 FCF가 줄어요. 대신 몇 년 뒤 매출이 커집니다.",[]],
["val","가치평가 — PER, PBR, ROE, 배당수익률","싼지 비싼지 재는 자",
"<ul><li><b>EPS</b>: 주당순이익(최근 4분기 합계). <b>PER</b> = 주가 ÷ EPS. 'PER 10'이면 지금 이익이 10년 쌓여야 주가만큼 된다는 뜻. 낮을수록 싸요.</li><li><b>BPS</b>: 주당순자산. <b>PBR</b> = 주가 ÷ BPS. 1 아래면 장부 가치보다 싸게 팔리는 중.</li><li><b>ROE</b> = 순이익 ÷ 자본. 주주 돈으로 1년에 몇 %를 버는지. 높을수록 좋아요.</li><li><b>배당수익률</b> = 1년 배당 ÷ 주가.</li></ul><p>싸다고 다 좋은 건 아니에요. PER이 낮은데 이익이 줄어드는 회사는 '싼 데는 이유가 있는' 경우가 많아요. <b>같은 업종끼리</b> 비교하고, 성장률과 같이 보세요.</p>",
"재무 → 요약/투자지표에 업종 중간값이 같이 나와요. 종목 검색기로 저PER·고배당 회사를 찾을 수 있어요.",[["종목 검색기","G.pg('scr')"]]],
["why","주가는 왜 움직이나 — 이 게임의 시장 엔진","모든 움직임에는 이유가 있어요",
"<p>이 게임의 주가는 매일 다섯 가지 힘의 합으로 움직여요.</p><ul><li><b>시장</b>: 금리, 경기(GDP), 투자심리, 금융위기 같은 큰 흐름. 회사마다 <b>베타</b>(시장에 얼마나 민감한지)가 달라요. 베타 1.5면 시장이 1% 오를 때 평균 1.5% 움직여요.</li><li><b>업종</b>: 유가·금값·코인 가격, 금리 변화, 업종의 수요와 설비(공급) 균형, 업종 뉴스.</li><li><b>적정가 회귀</b>: 최근 4분기 이익과 자산으로 계산한 적정가에서 멀어질수록 끌려가는 힘. 다만 회사 소식이 쌓이면 시장이 그 회사를 더 좋게(혹은 나쁘게) 보게 되고, 이 <b>시장 기대</b>는 몇 년씩 남아요. 그래서 같은 이익이라도 회사마다 PER이 달라요.</li><li><b>회사 고유 요인</b>: 작은 회사일수록 크게 출렁여요.</li><li><b>이벤트</b>: 실적 발표, 신제품, 회계 의혹 등.</li></ul><p>금리 인상이나 금융위기 같은 충격은 일부가 <b>투자심리</b>로 남아서 하루 만에 회복되지 않고 몇 달~1년에 걸쳐 풀려요. 실제 시장처럼 하락장·상승장이 생기는 이유예요.</p><p><b>실적 발표</b> 때는 예상(컨센서스) EPS와 실제를 비교해요. 예상보다 좋으면 <b>어닝 서프라이즈</b>로 뛰고, 이후 며칠 더 오르는 경향이 있어요.</p>",
"종목 화면 개요의 '왜 움직였나'에서 오늘과 최근 10일의 원인을 볼 수 있어요. 큰 변동이 있는 날은 뉴스에 시황이 올라와요.",[["뉴스 보기","G.go('l')"]]],
["macro","금리와 경기","시장 전체를 움직이는 두 손잡이",
"<ul><li><b>기준금리</b>가 오르면 빚 이자가 늘고, 미래 이익의 현재 가치가 줄어 주가에 부담이에요. 특히 건설·부동산, 전력·가스, 성장주(인터넷, 2차전지)가 민감해요. 은행은 오히려 이익이 늘 수 있어요.</li><li><b>GDP 성장률</b>이 좋으면 경기민감 업종(반도체, 기계, 철강, 화학, 호텔·레저)이 강해요. 식음료, 주류·담배, 통신은 경기를 덜 타요(방어주).</li><li><b>금융위기</b>가 오면 모두 빠지지만, 그때 우량주를 싸게 모으는 사람이 다음 상승장에 큰돈을 벌어요.</li></ul>",
"은행·경제 탭에서 금리와 GDP를, 지수 화면에서 금리 차트를 볼 수 있어요.",[["은행·경제","G.go('b')"]]],
["sector","업종과 원자재","유가가 오르면 누가 웃나",
"<p>이 게임엔 30개 산업 + 은행·보험·지주회사가 있어요. 업종마다 민감한 재료가 달라요.</p><ul><li><b>유가↑</b>: 에너지·조선(일부) 웃음 / 항공·물류, 화학, 농업, 전력·가스 부담.</li><li><b>금값↑</b>: 광업·귀금속.</li><li><b>코인↑</b>: 증권·핀테크.</li><li><b>공급 과잉</b>: 업종 수요 성장보다 회사들의 설비 증가가 빠르면 이익률이 떨어져요. 반대로 공급 부족이면 마진이 좋아져요.</li></ul><p>원작 고수들은 한 업종의 큰 회사들을 지배한 뒤 성장률을 낮춰 공급을 줄이고 업종 전체 마진을 올렸어요(점유율 50% 넘으면 독점 소송 주의).</p>",
"섹터 화면의 히트맵과 수요·설비 수치를 보세요. ▲ 표시는 공급 부족 업종이에요.",[["섹터 보기","G.pg('sc')"]]],
["debt","빚과 신용등급","레버리지는 양날의 검",
"<p>빚(레버리지)을 쓰면 수익도 손실도 커져요. 자기 돈 100에 100을 빌려 200을 투자하면, 10% 오를 때 내 돈은 20% 불고, 10% 빠지면 20% 줄어요.</p><ul><li><b>신용등급</b>(AAA~D)은 부채비율로 정해져요. 등급이 낮으면 이자가 비싸고 대출 한도가 줄어요.</li><li><b>마진콜</b>: 개인 대출이 순자산의 3배를 넘으면 강제로 주식이 팔려요.</li><li><b>대출 회수</b>: 은행을 지배한 라이벌이 BB 이하 회사의 대출을 회수할 수 있어요. 내 은행으로 옮기면 안전해요.</li></ul>",
"경영 탭과 개요의 '차입 현황'에서 등급과 대출 여력을 확인하세요.",[]],
["bond","채권 — 국채와 회사채","이자를 받는 투자",
"<p><b>채권</b>은 돈을 빌려주고 이자를 받는 증서예요. <b>국채</b>는 나라가, <b>회사채</b>는 회사가 발행해요.</p><ul><li>금리가 오르면 이미 있는 채권 가격은 <b>내려가고</b>, 금리가 내리면 올라가요.</li><li>신용이 낮은 회사의 회사채(<b>정크본드</b>)는 이자가 높지만 파산하면 크게 잃어요.</li><li>내 회사는 회사채를 발행해 은행 한도와 별도로 인수 자금을 마련할 수 있어요.</li></ul>",
"은행·경제 탭에서 국채를, 종목 화면 매매 탭에서 회사채를 사요.",[]],
["ctl","경영권 — 20%와 최대 주주","회사를 내 것처럼",
"<p>한 회사의 지분을 <b>20% 이상</b> 갖고 <b>가장 큰 주주 그룹</b>이 되면 경영권을 얻어요. 그러면:</p><ul><li>배당, 성장률, R&D, 차입, 회사채, 자사주, 증자를 정할 수 있어요.</li><li>위쪽 <b>거래 주체</b>를 그 회사로 바꾸면 회사 돈으로 다른 회사를 살 수 있어요. 회사가 회사를 지배하는 <b>피라미드</b>가 원작의 핵심이에요.</li><li>CEO로 취임하면 연봉과 보너스를 받아요.</li></ul><p>라이벌이 지분을 모으면 경영권을 뺏길 수 있으니 '내 그룹' 지분을 넉넉히 유지하세요.</p>",
"종목 화면 매매 탭의 '경영권까지' 버튼, 거래 주체 칩, 제국 탭을 활용하세요.",[["제국 보기","G.go('e')"]]],
["ma","인수합병과 방어","회사를 통째로",
"<ul><li><b>공개매수</b>: 남은 주식 전부를 웃돈(프리미엄)을 얹어 현금으로 사요. 프리미엄이 낮으면 주주들이 거절해요.</li><li><b>LBO</b>: 30%만 내고 나머지는 인수 대상 회사가 빚을 지게 해요. 빚이 많아져 위험해요.</li><li><b>주식교환 합병</b>: 내 회사 신주를 주고 상대를 흡수해요.</li><li><b>그린메일</b>: 지분을 모아 회사에 비싸게 되사라고 압박.</li><li><b>방어</b>: 포이즌 필, 백기사(우호 세력에 신주 배정), 사모 증자로 내 지분 늘리기.</li></ul>",
"종목 화면 인수 탭에서 프리미엄을 1% 단위로 정해 제안할 수 있어요.",[]],
["found","회사 설립과 상장","직접 만들고 키우고 팔기",
"<ul><li><b>설립</b>: 지주회사, 사업회사(30개 업종), 은행·보험을 세울 수 있어요. 1년에 2개, 2년에 3개까지.</li><li><b>시즈닝</b>: 설립 후 1년 반은 상장·정크본드가 막혀요.</li><li><b>상장(IPO)</b>: 40%를 팔아 현금화. 가격은 실적과 장부가로 정해져요.</li><li><b>지주회사 + 현물출자</b>: 내 주식을 지주회사로 옮기면 받는 배당에 세금이 없어 복리로 불어나요(원작의 'Incorporate Yourself').</li></ul>",
"메뉴의 회사 설립과 자금 이동을 보세요.",[["회사 설립","G.fdOpen()"]]],
["deriv","공매도·옵션·선물","하락에도 베팅하기",
"<ul><li><b>공매도</b>: 주식을 빌려 팔고 나중에 사서 갚아요. 떨어지면 이익, 오르면 손실이 끝없이 커질 수 있어요.</li><li><b>콜옵션</b>: 정한 가격에 살 권리. 오를 때 크게 벌고, 안 오르면 옵션값만 잃어요. <b>풋옵션</b>은 반대.</li><li><b>지수선물</b>: 지수 상승·하락에 베팅. 내 포트폴리오 하락을 막는 '보험'(헤지)으로도 써요.</li></ul>",
"매매 탭(공매도·옵션), 파생상품 메뉴(선물)를 보세요.",[]],
["finco","은행과 보험","돈이 돈을 버는 업종",
"<ul><li><b>은행</b>은 예금으로 대출을 해 이자 차이로 벌어요. 은행을 지배하면 대출 장부에서 부실 회사의 대출을 회수해 헐값 매물을 만들 수 있어요.</li><li><b>보험사</b>는 보험료로 쌓인 현금(플로트)이 많아요. 그 현금이 인수 자금이 돼서 첫 지주회사로 인기예요.</li></ul>",
"은행·보험 회사의 경영 탭에서 대출 장부를 볼 수 있어요.",[]],
["tax","세금과 절세","남는 돈이 진짜 돈",
"<ul><li>개인이 받는 <b>배당</b>: 40% 세금.</li><li>개인 <b>매매 차익</b>: 22% (손실은 다음 이익과 상계).</li><li>회사의 법인세는 설립 국가에 따라 10~35%.</li><li>회사가 받는 배당: 지분 80% 이상 모회사와 지주회사는 비과세, 20% 이상 5%, 그 밖 10%.</li></ul><p>그래서 원작 고수들은 개인 명의 대신 지주회사 명의로 주식을 갖고, 배당을 지주회사에 쌓아 재투자했어요.</p>",
"자금 이동 → 주식 현물출자로 시작할 수 있어요.",[["자금 이동","G.mvOpen()"]]],
["risk","리스크 관리 — 망하지 않는 법","살아남는 사람이 이겨요",
"<ul><li>한 종목에 몰빵하지 않기. 업종도 나눠서.</li><li>빚은 감당할 만큼만. 금융위기는 반드시 와요.</li><li>공매도는 손실 한도를 정하고.</li><li>위험한 제안(내부정보, 분식회계)은 감독원 주목도를 올려요. 70 넘으면 구속될 수 있어요.</li><li>공포지수가 높을 땐 차분하게. 좋은 회사를 싸게 살 기회예요.</li></ul>",
"홈 화면의 감독원 주목도 막대를 늘 확인하세요.",[]],
["strat","원작 고수들의 전략","Wall Street Raider 플레이어들의 비법",
"<ul><li><b>현금흐름 눈덩이</b>: 배당 많은 회사 20%씩을 사서 지분법 이익과 배당을 모아 다음 회사를 삽니다.</li><li><b>LBO 후 재상장</b>: 저평가 회사를 LBO로 사서 경영 개선 후 다시 상장.</li><li><b>업종 장악</b>: 한 업종의 큰 회사들을 지배하고 성장률을 낮춰 공급을 줄이면 업종 마진이 올라가요.</li><li><b>은행 장악</b>: 은행을 지배하면 대출 회수로 경쟁 회사를 흔들 수 있어요.</li><li><b>보험사 = 금고</b>: 보험사의 현금으로 인수.</li></ul>",
"원작 매뉴얼의 전략을 이 게임 규칙에 맞게 옮겼어요.",[]]];
const GL=[["주식","회사 소유권의 조각. 1% = 회사의 1% 주인"],["주가","주식 한 주의 가격"],["시가총액","주가 × 전체 주식 수. 회사 전체의 시장 가격"],["지수","여러 종목 가격을 묶어 만든 숫자. 시장 전체 흐름을 봄"],["상장 / 비상장","주식이 시장에서 거래되는지 여부"],
["배당","회사가 이익 일부를 주주에게 나눠 주는 돈"],["배당성향","순이익 중 배당으로 주는 비율"],["배당수익률","1년 배당 ÷ 주가"],["매출","판 금액 전체"],["영업이익","매출 − 원가 − 판관비·R&D. 본업으로 번 돈"],["순이익","이자·세금 등을 모두 뺀 최종 이익"],
["매출총이익","매출 − 매출원가"],["판관비","판매·관리에 드는 비용"],["지분법 이익","20% 이상 가진 회사 이익 중 내 몫(장부상 이익)"],["영업권","인수 때 장부가보다 더 낸 웃돈. 매 분기 조금씩 비용으로 사라짐"],["자본","자산 − 부채. 주주의 몫"],
["부채비율","부채 ÷ 자본. 높을수록 위험"],["이자보상배율","영업이익 ÷ 이자비용. 1 아래면 이자도 못 버는 상태"],["현금흐름","실제로 들어오고 나간 현금"],["FCF","잉여현금흐름. 영업현금 − 설비투자"],["EPS","주당순이익. 최근 4분기 순이익 ÷ 주식 수"],["시장 기대","회사 소식이 쌓여 생긴 프리미엄(또는 할인). 적정가보다 비싸거나 싸게 거래되는 이유. 몇 년에 걸쳐 옅어짐"],
["BPS","주당순자산. 자본 ÷ 주식 수"],["PER","주가 ÷ EPS. 낮을수록 이익 대비 쌈"],["PBR","주가 ÷ BPS. 1 미만이면 장부가보다 쌈"],["ROE","순이익 ÷ 자본. 주주 돈으로 버는 비율"],["ROA","순이익 ÷ 총자산"],
["컨센서스","분석가들이 예상한 실적"],["어닝 서프라이즈","실적이 예상보다 크게 좋거나(서프라이즈) 나쁨(쇼크)"],["캔들","하루 가격을 몸통(시가·종가)과 꼬리(고가·저가)로 그린 막대"],["양봉 / 음봉","오른 날 / 내린 날의 캔들"],["거래량","하루 동안 사고판 주식 수"],
["이동평균선","최근 N일 종가 평균을 이은 선"],["골든크로스","짧은 이동평균이 긴 선을 위로 뚫음. 상승 신호"],["데드크로스","짧은 선이 긴 선을 아래로 뚫음. 하락 신호"],["정배열 / 역배열","이동평균이 짧은 순으로 위에 있으면 정배열(상승), 반대면 역배열"],
["지지 / 저항","하락이 자주 멈춘 가격 / 상승이 자주 막힌 가격"],["RSI","오른 힘과 내린 힘 비율(0~100). 70 위 과매수, 30 아래 과매도"],["MACD","12일과 26일 평균의 차이. 시그널선과의 교차로 탄력 판단"],["볼린저밴드","20일 평균 ± 변동성 띠. 띠 밖이면 과열·침체"],
["스토캐스틱","최근 14일 범위에서 지금 가격의 위치(%)"],["변동성","가격이 출렁이는 정도"],["베타","시장이 1% 움직일 때 이 종목이 평균 몇 % 움직이나"],["공포지수","시장 변동성(연율). 높을수록 불안"],["기준금리","중앙은행이 정하는 금리. 모든 이자의 기준"],
["GDP 성장률","경제가 1년에 얼마나 커지는지"],["신용등급","빚 갚을 능력 등급(AAA~D)"],["레버리지","빚을 써서 투자 규모를 키우는 것"],["마진콜","빚이 너무 많아 강제로 자산이 팔리는 상황"],["국채","나라가 빌린 돈의 증서"],
["회사채","회사가 빌린 돈의 증서"],["정크본드","신용 BB 이하 회사의 고금리 회사채"],["경영권","20% 이상 + 최대 주주 그룹이 갖는 회사 운영 권한"],["거래 주체","나 대신 거래할 내 회사. 그 회사 돈으로 사고팜"],["지주회사","다른 회사 지분을 갖는 것이 본업인 회사"],
["공개매수","남은 주식 전부를 웃돈 주고 사겠다고 공개 제안"],["LBO","인수 대상 회사의 빚으로 인수 대금 대부분을 치르는 인수"],["주식교환 합병","내 회사 신주를 주고 상대 회사를 흡수"],["그린메일","지분을 모아 회사에 비싸게 되사라고 압박"],
["포이즌 필","적대적 인수를 어렵게 만드는 방어책"],["백기사","우호적인 제3자에게 신주를 줘서 적대 세력 지분을 희석"],["스핀오프","가진 자회사 주식을 주주에게 나눠 줌"],["공매도","빌린 주식을 팔고 나중에 사서 갚는 하락 베팅"],["콜옵션 / 풋옵션","정한 가격에 살 / 팔 권리"],
["선물","미래 가격에 미리 약속하는 거래. 이 게임은 지수선물"],["시즈닝","설립 후 상장·정크본드가 막힌 1년 반"],["IPO","비상장 회사의 첫 상장"],["현물출자","현금 대신 주식을 회사에 넣는 것. 세금 없이 장부가 이어짐"],["대여금","내가 회사에 빌려준 돈. 기준금리 이자"],
["감독원 주목도","위험한 행동을 하면 오르는 수치. 높으면 조사·구속"],["독점금지","한 업종 점유율 50% 초과 시 소송·벌금 위험"],["공급 과잉 / 부족","업종 설비 증가가 수요보다 빠르면 과잉(마진↓), 느리면 부족(마진↑)"]];
let BKc=null,glq="";
G.book=id=>{BKc=id||null;CH.ret=null;sel=-1;pg="bk";render();scrollTo(0,0);const s=$("sh");if(s)s.scrollTop=0};
G.glq=v=>{glq=String(v||"");const el=$("gll");if(el)el.innerHTML=glList()};
const glList=()=>{const q=glq.trim();return GL.filter(([t,d])=>!q||t.includes(q)||d.includes(q)).map(([t,d])=>`<div class="sr" style="cursor:default;display:block"><b>${esc(t)}</b><div class="mu" style="white-space:normal;margin-top:3px;font-size:13.5px">${esc(d)}</div></div>`).join("")||'<p class="mu">찾는 용어가 없어요.</p>'};
function bkPg(){if(BKc==="gl")return hd("용어 사전")+`<input class="in" placeholder="용어 검색 (예: PER, 배당)" oninput="G.glq(this.value)" value="${esc(glq)}" aria-label="용어 검색"><div id="gll">${glList()}</div><div class="bs">${B("목차로","G.book()")}</div>`;
const k=BK.findIndex(x=>x[0]===BKc);if(k<0)return hd("개념서")+`<div class="mu" style="line-height:1.7">금융이나 경제를 몰라도 괜찮아요. 이 게임을 하며 필요한 개념만 쉬운 말로 모았어요. 순서대로 읽어도 되고, 궁금한 장만 골라 읽어도 돼요.</div>
<div class="bs" style="margin:10px 0">${B("용어 사전 ("+GL.length+"개)","G.book('gl')","p")}</div>`+BK.map((x,j)=>`<div class="rw" onclick="G.book('${x[0]}')"><span class="lg" style="background:var(--sf2);color:var(--ac)">${j+1}</span><div class="nm"><b style="font-size:15px">${esc(x[1])}</b>${S.qz&&S.qz[x[0]]!=null?' <span class="bd me">퀴즈 ✓</span>':""}<div class="mu">${esc(x[2])}</div></div><span class="mu">›</span></div>`).join("");
const x=BK[k],pv=BK[k-1],nx=BK[k+1];return hd((k+1)+"장")+`<h3 style="margin-top:4px">${esc(x[1])}</h3><div class="bk">${x[3]}</div><div class="card bkg"><b>게임에서는</b><div style="margin-top:4px;line-height:1.65">${x[4]}</div>${x[5].length?`<div class="bs">${x[5].map(([t,f])=>B(t,f)).join("")}</div>`:""}</div>
<div class="bs" style="margin-top:10px">${QZ[x[0]]?B("📝 퀴즈 풀기"+(S.qz&&S.qz[x[0]]!=null?" ✓":" · 보상 크레딧 2"),`G.quiz('${x[0]}')`,"p"):""}</div><div class="row" style="margin-top:12px">${pv?B("‹ "+pv[1].split(" — ")[0],`G.book('${pv[0]}')`):"<span></span>"}${B("목차","G.book()")}${nx?B(nx[1].split(" — ")[0]+" ›",`G.book('${nx[0]}')`,"p"):"<span></span>"}</div>`}
