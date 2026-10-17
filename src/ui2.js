// ---- UI part 2: pages, tabs, modal, live updates, boot ----
const hd=t=>`<div class="row" style="margin-bottom:6px">${B("‹ 뒤로","G.back()")}<b style="font-size:16px">${t}</b><span style="width:64px"></span></div>`;
const MENU=[["st","◔","계좌 명세서"],["hx","↺","거래 내역"],["mv","↕","일일 급등락"],["sc","▤","섹터"],["scr","⌕","종목 검색기"],["fs","⇄","자산 매물"],["dv","∑","파생상품"],["ix","📈","지수 · 차트"],["bk","📖","개념서"],["fd","＋","회사 설립"],["xf","⇆","자금 이동"],["rv","♜","라이벌·그룹"],["ac","★","미션·업적"],["ai","◎","AI 시장 생태계"],["adv","?","AI 참모"],["hof","♛","명예의 전당"],["new","↻","새 게임"],["help","i","게임 방법"],["set","⚙","설정"]];
function page6(){
if(pg==="menu")return B("✕ 닫기","G.back()")+MENU.map(([k,i,t])=>`<div class="mi" onclick="G.pg('${k}')"><span class="ic">${i}</span><span class="lb">${t}</span></div>`).join("");
if(pg==="search")return hd("종목 검색")+`<input class="in" id="qi" placeholder="티커 또는 회사명" autocomplete="off" oninput="G.q(this.value)"><div id="sr">${srch("")}</div>`;
if(pg==="st"){const w=nw(),hs=S.co.filter(c=>c.own.P&&!c.dead),sv=hs.reduce((a,c)=>a+val(c),0),T=Math.max(1,sv+Math.max(S.cash,0)+cmv()),tp=[...hs].sort((a,b)=>b.cnt-a.cnt)[0],r=w-S.n0,bn=S.co.reduce((a,c)=>a+(c.bh&&!c.dead?bv(c):0),0),shp=S.co.reduce((a,c)=>a+(c.sp&&!c.dead?spv(c):0),0),opp=S.op.reduce((a,o)=>a+opv(o),0);
return hd("계좌 명세서")+`<div class="big">${F(w)}</div><div class="row"><span class="mu">총 수익</span><span class="${r>=0?"up":"dn"} num">${r>=0?"+":""}${F(r)} (${(r/S.n0*100).toFixed(1)}%)</span></div><h3>개요</h3><div class="g" style="gap:12px">
<span>주식</span><span>${F(sv)}<div class="mu">${(sv/T*100).toFixed(1)}%</div></span><span>현금</span><span>${F(S.cash)}<div class="mu">${(S.cash/T*100).toFixed(1)}%</div></span><span>원자재·코인</span><span>${F(cmv())}</span><span>대출</span><span class="dn">${F(S.loan)}</span><span>국채 / 회사채</span><span>${F(gbv())} / ${F(bn)}</span><span>공매도 손익</span><span class="${shp>=0?"up":"dn"}">${F(shp)}</span><span>옵션 / 선물</span><span>${F(opp)} / ${S.ft.q}계약</span><span>보유 종목</span><span>${hs.length}</span><span>경영권</span><span>${S.co.filter(mine).length}개</span><span>가장 많이 거래</span><span>${tp&&tp.cnt?esc(tp.tk):"-"}</span><span>난이도</span><span>${DIF[S.df].n}</span><span>시작일</span><span>2027년 1월 1일</span></div><h3>보유 비중</h3>`+donut()}
if(pg==="hx")return hd("거래 내역")+(S.tx.length?S.tx.map(t=>`<div class="sr"><div><b>${esc(t.tk)}</b> <span class="mu">${esc(t.t)} · ${esc(t.e)}</span><div class="mu">${t.d}</div></div><span class="num">${F(t.a)}</span></div>`).join(""):'<p class="mu">아직 거래가 없습니다.</p>');
if(pg==="mv"){const cs=S.co.filter(c=>!c.dead&&!c.priv).sort((a,b)=>chg(b)-chg(a));return hd("일일 급등락")+"<h4>급등</h4>"+cs.slice(0,8).map(c=>row(c)).join("")+"<h4>급락</h4>"+cs.slice(-8).reverse().map(c=>row(c)).join("")}
if(pg==="sc")return hd("섹터")+SEC.map((s,i)=>{const a=S.co.filter(c=>c.i===i&&!c.dead&&!c.priv),av=a.reduce((x,c)=>x+chg(c),0)/(a.length||1)*100,ms=myShare(i);return `<div class="card" onclick="fl=${i};tab='m';mseg=0;G.back()"><div class="row"><b>${s[0]}</b><span class="${av>=0?"up":"dn"} num">${P1(av)}</span></div><div class="mu">${a.length}개 상장사 · 수요 ${S.d[i]>.005?"▲ 호황":S.d[i]<-.005?"▼ 불황":"보통"}${ms>0?" · 내 그룹 점유율 "+(ms*100).toFixed(0)+"%":""}</div></div>`}).join("");
if(pg==="dv"){const X=S.ix,q=S.ft.q;return hd("파생상품")+`<div class="card"><b>지수선물</b><div class="mu">1계약 = 지수 1포인트당 1억. 매일 평가손익이 현금으로 정산됩니다. 하락장 헤지에 쓰세요.</div><div class="g" style="margin-top:8px"><span>지수</span><span>${X.toFixed(1)}</span><span>보유</span><span>${q>0?"매수 ":q<0?"매도 ":""}${Math.abs(q)}계약</span><span>필요 증거금 (20%)</span><span>${F(Math.abs(q)*X*.2)}</span></div><div class="bs">${B("+10 매수","G.fut(10)","p")}${B("+50 매수","G.fut(50)")}${B("-10 매도","G.fut(-10)","d")}${B("-50 매도","G.fut(-50)","d")}${B("전량 청산","G.fut(-S.ft.q)")}</div></div><h4>보유 옵션 (${S.op.length}/20)</h4>`+
(S.op.map((o,n)=>{const c=S.co[o.i];return `<div class="card"><b>${esc(c.tk)} ${o.t==="C"?"콜":"풋"}</b> <span class="mu">행사가 ${W(o.k)} · 만기 ${Math.max(0,o.exp-S.day)}일</span><div class="row"><span class="num">평가 ${F(opv(o))} / 매수 ${F(o.pr)}</span>${B("청산",`G.oclose(${n})`)}</div></div>`}).join("")||'<p class="mu">종목 화면에서 콜·풋 옵션을 살 수 있어요.</p>')}
if(pg==="rv"){const D={idx:"인덱스형: 대형주를 조금씩 분산 매집",val:"가치투자형: 저PER 우량주 장기 보유",act:"행동주의: 저평가 중소형 매집 후 적대적 공개매수",mom:"모멘텀형: 오르는 종목 단기 매매"},cnt=r=>S.co.filter(c=>!c.dead&&c.ctl===r).length,
rows=[["나",nw(),"당신",cnt("P")],...S.R.map((r,k)=>[r.n,rnw(k),D[r.s],cnt("r"+k)])].sort((a,b)=>b[1]-a[1]),g={};for(const c of S.co)if(!c.dead&&c.ctl&&c.ctl[0]==="c")g[c.ctl]=(g[c.ctl]||0)+1;
const ag=Object.keys(g).sort((a,b)=>g[b]-g[a]).slice(0,8);
return hd("라이벌·그룹")+rows.map(([n,w,d,k],j)=>`<div class="card"><div class="row"><b>${j+1}. ${esc(n)}</b><span class="num">${F(w)}</span></div><div class="mu">${d} · 경영권 ${k}개</div></div>`).join("")+`<h4>AI 기업 그룹 (회사가 회사를 지배)</h4>`+(ag.map(r=>{const c=S.co[+r.slice(1)];return `<div class="sr" onclick="G.pick(${c.id})"><span><b>${esc(c.tk)}</b> <span class="mu">${esc(c.n)}</span></span><span class="mu">자회사 ${g[r]}개 ›</span></div>`}).join("")||'<p class="mu">없음</p>')}
if(pg==="ac")return hd("업적 "+Object.keys(S.ach).length+"/"+AC.length)+AC.map(([k,t])=>`<div class="sr"><span>${S.ach[k]?'<b class="gd">달성</b>':'<span class="mu">미달성</span>'} · ${t}</span></div>`).join("");
if(pg==="ai")return hd("AI 시장 생태계")+`<div class="card"><div class="g"><span>상장 기업</span><span>${S.co.filter(c=>!c.dead&&!c.priv).length}개</span><span>누적 신규 상장</span><span>${S.st.ipo}</span><span>누적 상장폐지</span><span>${S.st.del}</span><span>누적 인수합병</span><span>${S.st.ma}</span></div><p class="mu"><b>내장 생태계 엔진</b>이 늘 돌아가요 (무료·무제한). 호황 업종에 스타트업이 상장하고, 현금 많은 대기업이 경쟁사를 인수하고, 두 번 파산한 회사는 상장폐지됩니다. 라이벌 4명은 지분을 모으고 적대적 공개매수를 겁니다.</p>${B("Claude로 뉴스 꾸미기 (선택): "+(S.ai?"켜짐":"꺼짐")+(AI?"":" · 이 환경에선 사용 불가"),"G.ai()",S.ai?"p":"")}<div class="mu" style="margin-top:6px">선택 기능이에요. 켜면 분기마다 Claude가 뉴스 문장과 신생 기업 소개를 더 그럴듯하게 써 줘요. 꺼져 있어도 상장·인수합병·상장폐지는 내장 엔진이 계속 만들어요. 처음 쓸 때 권한 요청이 뜨고, 호출마다 사용량이 들 수 있어요.</div></div><h4>생태계 소식</h4><div class="card log">${S.eco.map(x=>esc(x)).join("<br>")||"아직 소식이 없습니다."}</div>`;
if(pg==="adv")return hd("AI 참모")+`<div class="mu">게임 상황을 Claude에게 보내고 전략을 묻습니다. 질문할 때마다 사용량이 들 수 있어요.</div><textarea class="in" id="aq" placeholder="예: 지금 어떤 회사를 인수하면 좋을까?">${esc(aiQ)}</textarea><div class="bs">${B("질문하기","G.aiAsk()","p",!AI)}${["다음에 인수할 만한 회사는?","내 그룹의 가장 큰 위험은?","남는 현금을 어떻게 굴릴까?"].map(q=>B(q,`document.getElementById('aq').value='${q}';G.aiAsk()`,"",!AI)).join("")}</div><div class="card" style="margin-top:10px"><div id="aia" class="ai">${esc(aiTxt.ask||(AI?"답변이 여기에 표시됩니다.":"이 환경에서는 AI 참모를 쓸 수 없습니다."))}</div></div>`;
if(pg==="hof"){const h=hof();return hd("명예의 전당")+(h.length?h.map((x,j)=>`<div class="sr"><div><b>${j+1}. ${F(x.w)}</b> <span class="mu">${esc(x.r)} · ${DIF[x.df]?DIF[x.df].n:""}</span><div class="mu">${esc(x.d)} · ${esc(x.why||"")}</div></div></div>`).join(""):'<p class="mu">아직 기록이 없습니다. 설정에서 은퇴하거나 게임이 끝나면 기록됩니다.</p>')}
if(pg==="help")return hd("게임 방법")+HELP.map(([t,b])=>`<div class="card"><b>${t}</b><div class="mu" style="margin-top:4px;line-height:1.6">${b}</div></div>`).join("")+B("튜토리얼 다시 보기","G.help()","p");
if(pg==="set"){const sl=n=>{let m=null;try{m=JSON.parse(stGet("r6m"+n))}catch(e){}return `<div class="row" style="margin:6px 0"><span class="mu">슬롯 ${n}: ${m?esc(m.d)+" · "+F(m.w):"비어 있음"}</span><span class="bs" style="margin:0">${B("저장",`G.sv(${n})`)}${B("불러오기",`G.ld(${n})`)}</span></div>`};
return hd("설정")+`<div class="card"><div class="bs">${B("가격 색: "+(S.us?"미국식 (상승 초록)":"한국식 (상승 빨강)"),"G.col()")}${B("사건 팝업 (윤리적 선택): "+(S.cheat?"켜짐":"꺼짐"),"G.cheat()")}</div></div><div class="card"><b>저장 슬롯</b>${sl(1)}${sl(2)}${sl(3)}<div class="mu">자동 저장은 5초마다 따로 됩니다.</div></div>
<div class="card"><b>새 게임</b><div class="mu">쉬움 800억 · 보통 500억 · 어려움 300억 (어려울수록 라이벌이 공격적)</div><div class="bs">${B("쉬움","G.reset(0)","d")}${B("보통","G.reset(1)","d")}${B("어려움","G.reset(2)","d")}</div></div><div class="card"><b>은퇴</b><div class="mu">지금 순자산으로 명예의 전당에 기록하고 게임을 끝냅니다.</div><div class="bs">${B("은퇴하기","G.retire()")}</div></div>`}return""}
function repCard(i){const c=S.co[i];return `<div class="card"><div class="row"><b>애널리스트 요약</b><span class="mu">규칙 기반 · 무료</span></div><div class="ai mu" style="margin-top:6px">${esc(ruleRep(c))}</div>`+
qaCard(i)+(S.aiP!=="rule"&&S.aiP!=="local"?`<div class="row" style="margin-top:12px"><b>${aiName()} 심층 리포트</b>${B(aiTxt[i]?"다시 받기":"리포트 받기",`G.aiRep(${i})`,"",!aiOn())}</div><div id="air" class="ai mu" style="margin-top:6px">${esc(aiTxt[i]||(aiOn()?aiName()+"가 이 회사의 재무와 지배구조를 분석해 줍니다.":aiErr({code:S.aiP==="claude"?"na":"off"})))}</div>`:"")+`</div>`}
function setupPg(){const n=NG;if(!n)return"";const opt=(on,f,t,d)=>`<button class="opt${on?" on":""}" onclick="${f}"><b>${t}</b><span class="mu">${d}</span></button>`;
return `<div class="row" style="margin-bottom:4px"><b class="ttl">새 게임</b>${n.first?"":B("취소","G.ngCancel()")}</div><div class="mu" style="line-height:1.6">원작 Wall $treet Raider처럼 상대와 난이도를 고르고 시작하세요.${n.first?"":" 지금 게임은 사라지니 필요하면 먼저 설정에서 저장하세요."}</div>
<h4>그룹 이름 (선택)</h4><input class="in" maxlength="12" value="${esc(n.gn||"")}" oninput="NG.gn=this.value" placeholder="예: 한강 — 직접 세우는 회사 이름에 붙어요" aria-label="그룹 이름" style="margin-top:4px">
<h4>난이도</h4><div class="opts">${DIF.map((d,k)=>opt(n.df===k,`G.ng('df',${k})`,d.n,d.d+" · 시작 "+F(d.cash))).join("")}</div>
<h4>라이벌 AI · ${n.nr}명</h4><div class="ch">${[0,1,2,3,4,5,6,8].map(k=>B(k+"명",`G.ng('nr',${k})`,n.nr===k?"on":"")).join("")}</div>
${n.nr?`<div class="mu" style="margin:8px 0 2px">카드를 누르면 성향이 바뀝니다.</div>`+n.rv.slice(0,n.nr).map((r,j)=>`<button class="rvc" onclick="G.ng('rt',${j})"><span><b>${esc(r[0])}</b><span class="bd${r[1]==="raid"||r[1]==="act"?" rv":""}">${RTY[r[1]][0]}</span></span><span class="mu">${RTY[r[1]][1]}</span></button>`).join("")+`<div class="bs">${B("다시 뽑기","G.ng('rr')")}</div>`:`<div class="mu" style="margin-top:6px">라이벌 없이 시장을 상대합니다. AI 기업들의 인수합병과 상장은 그대로 일어납니다.</div>`}
<h4>시작 자금</h4><div class="ch">${[200,300,500,800,1500].map(v=>B(F(v),`G.ng('cash',${v})`,n.cash===v?"on":"")).join("")}</div>
<h4>게임 모드</h4><div class="seg">${B("자유","G.ng('mode',0)",!n.mode?"on":"")}${B("도전","G.ng('mode',1)",n.mode?"on":"")}</div>
${n.mode?`<div class="opts">${GOALS.map((g,k)=>opt(n.goal===k,`G.ng('goal',${k})`,g[0],"달성하면 명예의 전당에 기록")).join("")}</div>`:`<div class="mu">기한 없이 원하는 만큼 플레이합니다.</div>`}
<h4>경제</h4><div class="opts">${VOL.map((v,k)=>opt(n.vol===k,`G.ng('vol',${k})`,v[0],v[1])).join("")}</div>
${setup12(n)}<h4>기타</h4><div class="bs">${B("윤리적 선택 이벤트: "+(n.eth?"켜짐":"꺼짐"),`G.ng('eth',${n.eth?0:1})`,n.eth?"on":"")}${B("튜토리얼: "+(n.tut?"보기":"건너뛰기"),`G.ng('tut',${n.tut?0:1})`,n.tut?"on":"")}</div>
<div class="mu" style="margin-top:14px;line-height:1.6">금융이 처음이라면 시작한 뒤 메뉴의 📖 개념서부터 읽어 보세요. 주식, 차트, 재무제표를 이 게임 기준으로 쉽게 설명해 둬요.</div><div class="bs" style="margin-top:12px">${B("게임 시작","G.start()","p wide")}</div>`}
function page(){const p12=page12();if(p12!=null)return p12;
if(pg==="new")return setupPg();if(pg==="chart")return chartPg();if(pg==="bk")return bkPg();if(pg==="ix")return hd("지수 · 차트")+ixPg();if(pg==="fd")return fdPg();if(pg==="xf")return mvPg();if(pg==="ac")return acPg();if(pg==="scr")return scrPg();if(pg==="fs")return fsPg();if(pg==="loan")return loanPg();
if(pg==="sc")return hd("섹터")+heat()+`<div class="card mu" style="line-height:1.6">수요 성장이 설비 증가보다 빠르면 업종 마진이 좋아집니다. 업종의 큰 회사들을 지배한 뒤 성장률을 낮추면 업종 전체 수익성이 오릅니다(원작의 '업종 독점' 전략). 점유율 50%를 넘으면 독점금지 소송 위험이 있어요.</div>`+SEC.map((s,i)=>{const a=S.co.filter(c=>c.i===i&&!c.dead&&!c.priv),av=a.reduce((x,c)=>x+chg(c),0)/(a.length||1)*100,ms=myShare(i),gap=S.dg[i]-S.cg[i];
return `<div class="card" onclick="fl=${i};flg=${grpOf(i)};tab='m';mseg=0;G.back()"><div class="row"><b>${s[0]}</b><span class="${av>=0?"up":"dn"} num">${P1(av)}</span></div><div class="mu">${a.length}개 상장사${ms>0?" · 내 그룹 점유율 "+(ms*100).toFixed(0)+"%":""}</div>${i===HOLD?`<div class="mu">자회사 지분과 배당으로 돈을 법니다</div>`:isFin(i)?`<div class="mu">금리와 경기에 따라 이익이 움직입니다</div>`:`<div class="row mu num" style="margin-top:4px"><span>수요 ${(S.dg[i]*100).toFixed(1)}% · 설비 ${(S.cg[i]*100).toFixed(1)}%</span><span class="${gap>.005?"up":gap<-.005?"dn":""}">${gap>.005?"공급 부족 · 마진↑":gap<-.005?"공급 과잉 · 마진↓":"균형"}</span></div>`}</div>`}).join("");
if(pg==="rv"){const cnt=r=>S.co.filter(c=>!c.dead&&c.ctl===r).length,rows=[["나",nw(),null,"P"],...S.R.map((r,k)=>[r.n,rnw(k),r.s,"r"+k])].sort((a,b)=>b[1]-a[1]),g={};
for(const c of S.co)if(!c.dead&&c.ctl&&c.ctl[0]==="c")g[c.ctl]=(g[c.ctl]||0)+1;const ag=Object.keys(g).sort((a,b)=>g[b]-g[a]).slice(0,8);
return hd("라이벌·그룹")+(S.R.length?"":`<p class="mu">이번 게임에는 라이벌이 없습니다.</p>`)+rows.map(([n,w,s,key],j)=>{const th=key!=="P"?S.co.filter(c=>mine(c)&&grp(c,key)>=5).length:0,top=key!=="P"?S.co.filter(c=>!c.dead&&c.ctl===key).slice(0,3).map(c=>c.tk).join(", "):"";
return `<div class="card"><div class="row"><b>${j+1}. ${esc(n)} ${key==="P"?'<span class="bd me">나</span>':'<span class="bd'+(s==="raid"||s==="act"?" rv":"")+'">'+RTY[s][0]+"</span>"}</b><span class="num">${F(w)}</span></div><div class="mu">경영권 ${cnt(key)}개${top?" · "+esc(top):""}${th?' · <span class="wr">내 회사 '+th+"곳에 지분 보유</span>":""}</div>${key!=="P"?`<div class="mu">${RTY[s][1]}</div>`:""}</div>`}).join("")+
`<h4>AI 기업 그룹 (회사가 회사를 지배)</h4>`+(ag.map(r=>{const c=S.co[+r.slice(1)];return `<div class="sr" onclick="G.pick(${c.id})"><span><b>${esc(c.tk)}</b> <span class="mu">${esc(c.n)}</span></span><span class="mu">자회사 ${g[r]}개 ›</span></div>`}).join("")||'<p class="mu">없음</p>')}
if(pg==="adv"){if(S.aiP==="rule"&&!aiTxt.ask)aiTxt.ask=brief();
return hd("AI 참모")+`<div class="mu" style="line-height:1.6">지금 AI: <b>${aiName()}</b> · ${S.aiP==="rule"?"무료 자동 브리핑입니다. 자유 질문은 설정에서 Claude나 제미나이를 켜면 쓸 수 있어요.":"질문할 때마다 사용량이 들 수 있어요."}</div>`+
(S.aiP==="rule"?`<div class="bs">${B("브리핑 새로고침","G.aiAsk()","p")}${B("AI 설정","G.pg('set')")}</div>`:`<textarea class="in" id="aq" placeholder="예: 지금 어떤 회사를 인수하면 좋을까?">${esc(aiQ)}</textarea><div class="bs">${B("질문하기","G.aiAsk()","p")}${["다음에 인수할 만한 회사는?","내 그룹의 가장 큰 위험은?","남는 현금을 어떻게 굴릴까?"].map(q=>B(q,`document.getElementById('aq').value='${q}';G.aiAsk()`)).join("")}</div>`)+
`<div class="card" style="margin-top:10px"><div id="aia" class="ai">${esc(aiTxt.ask||"답변이 여기에 표시됩니다.")}</div></div>`}
if(pg==="set"){const sl=n=>{let m=null;try{m=JSON.parse(stGet("r6m"+n))}catch(e){}return `<div class="row" style="margin:6px 0"><span class="mu">슬롯 ${n}: ${m?esc(m.d)+" · "+F(m.w):"비어 있음"}</span><span class="bs" style="margin:0">${B("저장",`G.sv(${n})`)}${B("불러오기",`G.ld(${n})`)}</span></div>`};
const ai=`<div class="card"><b>AI 설정</b><div class="mu" style="margin:4px 0 8px;line-height:1.6">리포트·참모·시장 엔진에 쓸 AI를 고르세요. 규칙 기반은 무료이고 언제나 작동합니다.</div><div class="seg">${[["rule","규칙 (무료)"],["claude","Claude"],["gemini","제미나이"],["local","폰 안 AI"]].map(([k,t])=>B(t,`G.aiP('${k}')`,S.aiP===k?"on":"")).join("")}</div>`+
(S.aiP==="local"?laiPanel():"")+(S.aiP==="claude"?`<div class="mu">${AI?"이 앱 안에서 Claude를 호출합니다. 호출마다 Claude 사용량이 들 수 있어요.":"이 환경에서는 Claude를 호출할 수 없습니다."}</div>`:"")+
(S.aiP==="gemini"?`<div class="mu" style="line-height:1.6">Google AI Studio에서 발급한 API 키를 넣으세요. 키는 이 브라우저에만 저장됩니다. ${typeof window!=="undefined"&&window.Android?"앱에서는 바로 호출됩니다 (인터넷 필요).":`<b class="wr">claude.ai 안에서는 외부 연결이 막혀 있어 호출이 실패합니다. 앱(APK) 버전에서 작동합니다.</b>`}</div><input class="in" id="gk" type="password" autocomplete="off" placeholder="API 키" value="${esc(gK())}"><input class="in" id="gm" autocomplete="off" placeholder="모델 이름" value="${esc(gM())}"><div class="bs">${B("저장","G.gkey()","p")}${B("연결 확인","G.gtest()")}</div>`:"")+`</div>`;
return hd("설정")+set13()+set12()+`<div class="card"><b>그룹 이름</b><input class="in" maxlength="12" value="${esc(S.gn||"")}" onchange="S.gn=this.value.trim().slice(0,12);render()" placeholder="예: 한강" aria-label="그룹 이름" style="margin-bottom:0"></div><div class="card"><div class="bs">${B("가격 색: "+(S.us?"미국식 (상승 초록)":"한국식 (상승 빨강)"),"G.col()")}${B("사건 팝업 (윤리적 선택): "+(S.cheat?"켜짐":"꺼짐"),"G.cheat()")}${B("새로 지배한 회사 자동 경영: "+(S.apAll?"켜짐":"꺼짐"),"G.apAll()")}${B("미션 카드: "+(S.mh?"숨김":"표시"),"G.mh()")}</div></div>`+ai+
`<div class="card"><b>세이브 백업</b><div class="mu" style="line-height:1.6;white-space:normal">앱을 다시 설치하거나 웹 버전과 앱 사이에서 게임을 옮길 때 씁니다. 내보내면 세이브 코드가 복사돼요. 메모장이나 카톡 나와의 채팅에 붙여 넣어 보관하세요.</div><div class="bs">${B("내보내기 (복사)","G.exp()","p")}${B("가져오기","G.imp()")}</div></div><div class="card"><b>저장 슬롯</b>${sl(1)}${sl(2)}${sl(3)}<div class="mu">자동 저장은 5초마다 따로 됩니다.</div></div><div class="card"><b>새 게임</b><div class="mu">난이도와 라이벌을 고르는 설정 화면으로 갑니다.</div><div class="bs">${B("새 게임 설정","G.newGame()","p")}</div></div><div class="card"><b>은퇴</b><div class="mu">지금 순자산으로 명예의 전당에 기록하고 게임을 끝냅니다.</div><div class="bs">${B("은퇴하기","G.retire()")}</div></div>`}
return page6()}
function home(){const h=home6(),x=[favRow()];if(S.ms<MIS.length&&!S.mh){const m=MIS[S.ms];x.push(`<div class="card"><div class="row"><b>미션 ${S.ms+1}/${MIS.length} · ${m[0]}</b><span class="mu">${m[3]?"보상 "+F(m[3]):""}</span></div><div class="mu" style="margin-top:4px;line-height:1.6">${m[1]}</div><div class="bs">${B("바로 가기","G.misGo()","p")}${B("숨기기","G.mh()")}</div></div>`)}
if(S.cfg&&S.cfg.mode){const g=GOALS[S.cfg.goal],w=nw(),p=Math.max(0,Math.min(100,w/g[2]*100)),left=g[1]-S.day;x.push(`<div class="card"><div class="row"><b>도전: ${g[0]}</b><span class="mu">${S.won===1?"달성!":S.won===-1?"실패":"남은 "+Math.max(0,left/360).toFixed(1)+"년"}</span></div><div class="bar"><i style="width:${p}%;background:var(--gold)"></i></div><div class="mu num">${F(w)} / ${F(g[2])} (${p.toFixed(1)}%)</div></div>`)}
x.push(...home12());if(S.mx){const e=MXE.find(z=>z.id===S.mx.id);x.push(`<div class="card"><b>진행 중인 국면: ${e.n}</b><div class="mu">${esc(e.t.replace(/^\S+\s/,""))} · 남은 ${S.mx.q}분기</div></div>`)}
if(S.qr){const q=S.qr;x.push(`<div class="card" onclick="G.go('l')"><div class="row"><b>${q.t} 결산</b><span class="num ${q.d>=0?"up":"dn"}">${P1(q.p)}</span></div><div class="g" style="margin-top:6px"><span>순자산</span><span>${F(q.nw)}</span><span>배당 수입</span><span>${F(q.div)}</span><span>지배 회사</span><span>${q.ctl}개 (${q.dc>=0?"+":""}${q.dc})</span></div></div>`)}
return h.replace("<h3>보유 종목</h3>",x.join("")+"<h3>보유 종목</h3>")+"<h3>대차대조표 · 시장</h3>"+myBS()+mktInd()}

function home6(){const w=nw(),r=S.rank,nx=RK[r+1],pr=nx?Math.min(100,(w-RK[r][1])/(nx[1]-RK[r][1])*100):100,ho=S.nwh,d=w-S.nm,my=S.co.filter(mine),hs=S.co.filter(c=>c.own.P&&!c.dead).sort((a,b)=>val(b)-val(a)),sh=S.co.filter(c=>c.sp>0&&!c.dead),wl=S.wl.map(i=>S.co[i]).filter(c=>c&&!c.dead),nb=S.co.filter(c=>c.bh>0&&!c.dead).length,inc=income();
let h=`<div class="mu" style="margin-top:6px">포트폴리오 가치</div><div class="big" id="pv">${F(w)}</div><div id="pc" class="num ${d>=0?"up":"dn"}">${d>=0?"▲":"▼"} ${F(Math.abs(d))} (${(d/Math.max(1,Math.abs(S.nm))*100).toFixed(2)}%) <span class="mu">이번 달</span></div>
<div style="margin:8px 0">${spark(ho,320,64).replace('width="320"','width="100%"').replace("<svg ",'<svg preserveAspectRatio="none" ')}</div>
<div class="row"><span class="mu">현금 ${F(S.cash)} · <span class="dn">대출 ${F(S.loan)}</span></span><span class="mu num">하루 ${inc>=0?"+":""}${inc.toFixed(2)}억</span></div>
<div class="row" style="margin-top:12px"><b>${RK[r][0]}</b><span class="mu">${nx?"다음 칭호 "+nx[0]+" · "+F(nx[1]):"최고 칭호"}</span></div><div class="bar"><i style="width:${pr}%;background:var(--ac)"></i></div>`;
if(S.heat>.5)h+=`<div class="row" style="margin-top:10px"><span class="wr">감독원 주목도 ${S.heat.toFixed(0)}/100</span><span class="mu">${S.heat>=70?"구속 위험!":S.heat>30?"조사 가능성 있음":"관찰 중"}</span></div><div class="meter"><i style="width:${Math.min(100,S.heat)}%"></i></div>`;
if(my.length)h+=`<div class="card" style="margin-top:14px" onclick="G.go('e')"><div class="row"><b class="gd">${esc(gName())}</b><span class="mu">제국 보기 ›</span></div><div class="g" style="margin-top:6px"><span>지배 회사</span><span>${my.length}개</span><span>그룹 시총</span><span>${F(my.reduce((a,c)=>a+(c.priv?0:mc(c)),0))}${my.some(c=>c.priv)?` <span class="mu">+ 비상장 자본 ${F(my.reduce((a,c)=>a+(c.priv?Math.max(0,eq(c)):0),0))}</span>`:""}</span><span>그룹 현금</span><span>${F(my.reduce((a,c)=>a+c.cs,0))}</span></div></div>`;
h+=`<h3>보유 종목</h3>`+(hs.length?hs.map(c=>row(c,"h")).join(""):`<div class="card"><div class="mu" style="line-height:1.6">아직 보유 종목이 없습니다. 시장 탭이나 오른쪽 위 검색에서 회사를 골라 지분을 사 보세요. 20%를 넘기고 최대 주주가 되면 경영권을 얻습니다.</div><div class="bs">${B("시장 보기","G.go('m')","p")}${B("게임 방법","G.pg('help')")}</div></div>`);
if(sh.length)h+="<h3>공매도</h3>"+sh.map(c=>`<div class="rw" onclick="G.pick(${c.id})">${logo(c)}<div class="nm"><b>${esc(c.tk)}</b><div class="mu">${c.sp.toFixed(1)}% 공매도</div></div><div class="r"><b class="num ${spv(c)>=0?"up":"dn"}">${F(spv(c))}</b></div></div>`).join("");
if(S.gb>0||nb||S.op.length||S.ft.q||cmv()>0||S.fx.length||S.ow.length||S.pp.length||cxv()>0||etfV()>0||S.irs.length)h+=`<h3>채권·파생·원자재</h3><div class="card" onclick="G.pg('dv')"><div class="g"><span>국채</span><span>${F(gbv())}</span><span>회사채</span><span>${nb}종목</span><span>옵션</span><span>${S.op.length}건</span><span>선물</span><span>${S.ft.q}계약</span><span>원자재·코인</span><span>${F(cmv())}</span></div></div>`;
if(wl.length)h+="<h3>관심종목</h3>"+wl.map(c=>row(c)).join("");return h}
function market(){let h=segBar();if(mseg===2)return h+ixPg();if(mseg===3)return h+coinSeg();if(mseg===4)return h+etfSeg();if(mseg===1)return h+cmSeg();
if(mseg===1){return h+S.cm.map((m,j)=>{const p=(m.p/m.hist[m.hist.length-1]-1)*100,v=m.h*m.p/1e8;return `<div class="card"><div class="row"><span onclick="G.chart('m:${j}')" style="cursor:pointer"><b>${m.n}</b> <span class="mu">${m.k} · ${m.u}당 · 차트 ›</span></span><span class="pl ${p>=0?"u":"d"}">${W(m.p)}</span></div><div class="row"><span class="mu num">${P1(p)} (10일)${v>0?" · 보유 "+F(v)+" · 손익 "+F(v-m.b):""}</span>${spark(m.hist,90)}</div><div class="bs">${B("+10억",`G.cbuy(${j},10)`)}${B("+100억",`G.cbuy(${j},100)`)}${B("절반 매도",`G.csell(${j},.5)`,"",!m.h)}${B("전량 매도",`G.csell(${j},1)`,"",!m.h)}</div></div>`}).join("")+`<p class="mu">유가가 오르면 GDP가 둔화되고 에너지 업종은 웃고 항공·물류는 웁니다. 금융위기 때는 금값이 뜁니다. 매매 차익에는 22% 세금이 붙어요.</p>`}
const chips=B("전체","G.flg(-1)",flg<0&&fl<0?"on":"")+GRP.map((g,k)=>B(g[1],`G.flg(${k})`,flg===k?"on":"")).join("")+(flg>=0?`</div><div class="ch" style="margin-top:4px">`+SEC.map((x,i)=>grpOf(i)===flg?B(x[0],`G.flt(${i})`,fl===i?"on":""):"").join(""):""),tch=["전체","대형","중형","소형"].map((t,k)=>B(t,`G.tf(${k-1})`,tf===k-1?"on":"")).join("");
let a=S.co.filter(c=>!c.dead&&(fl<0||c.i===fl)&&(flg<0||grpOf(c.i)===flg)&&(tf<0||tn(c)===tf));const f=[c=>-mc(c),c=>-chg(c),c=>c.ni>0?c.p/(c.ni*4e4/c.sh):999,c=>-grp(c,"P"),c=>c.p/c.tg,c=>-(c.vd||0)*c.p];a.sort((x,y)=>f[so](x)-f[so](y));
return h+`<div class="ch">${chips}</div><div class="ch" style="margin-top:4px">${tch}</div><div class="row" style="margin-top:6px">${B("정렬: "+["시총순","상승률순","저PER순","내 지분순","저평가순","거래대금순"][so]+" ▾","G.srt()")}<span class="mu">${a.length}개</span></div>`+a.slice(0,lim).map(c=>row(c)).join("")+(a.length>lim?`<div class="bs">${B("더 보기 ("+(a.length-lim)+"개 남음)","G.more()","p")}</div>`:"")}
function empire(){const my=S.co.filter(mine),e=teOK();let h=`<h3>${S.gn?esc(gName()):"나의 제국"}</h3><div class="card"><div class="g"><span>지배 회사</span><span>${my.length}개 (비상장 ${my.filter(c=>c.priv).length})</span><span>그룹 사업자산</span><span>${F(my.reduce((a,c)=>a+c.A,0))}</span><span>그룹 시총</span><span>${F(my.reduce((a,c)=>a+(c.priv?0:mc(c)),0))}${my.some(c=>c.priv)?` <span class="mu">+ 비상장 자본 ${F(my.reduce((a,c)=>a+(c.priv?Math.max(0,eq(c)):0),0))}</span>`:""}</span><span>그룹 현금 / 대출 여력</span><span>${F(my.reduce((a,c)=>a+c.cs,0))} / ${F(my.reduce((a,c)=>a+cRoom(c),0))}</span><span>내 직접 지분 가치</span><span>${F(S.co.reduce((a,c)=>a+(c.dead?0:val(c)),0))}</span><span>거래 주체</span><span class="gd">${esc(eName(e))}</span></div><div class="bs">${B("거래 주체 바꾸기","G.pickTE()","p")}${B("게임 방법","G.pg('help')")}</div></div>
<div class="mu" style="line-height:1.6">나 → 직접 보유한 회사 → 그 회사가 보유한 회사 순으로 펼쳐집니다. 회사가 다른 회사 지분을 20% 이상 가지면 그 회사 이익의 지분율만큼을 자기 이익으로 잡습니다.</div>`;
const t=tree();h+=t?`<div style="margin-top:8px">${t}</div>`:`<div class="card" style="margin-top:10px"><div class="mu" style="line-height:1.6">아직 제국이 없습니다. 회사 하나의 경영권을 잡은 뒤 위쪽 거래 주체를 그 회사로 바꾸고, 그 회사 돈으로 다른 회사를 사 보세요. 보험사는 현금이 많아 첫 지주회사로 좋습니다.</div></div>`;
const sec=SEC.map((s,i)=>[s[0],i!==HOLD?myShare(i):0]).filter(x=>x[1]>.01).sort((a,b)=>b[1]-a[1]);if(sec.length)h+=`<h4>업종 점유율 (50%를 넘으면 독점금지 소송 위험)</h4><div class="card">`+sec.map(([n,s])=>`<div class="row"><span>${n}</span><span class="num ${s>.5?"wr":""}">${(s*100).toFixed(0)}%</span></div><div class="bar"><i style="width:${s*100}%;background:${s>.5?"var(--warn)":"var(--gold)"}"></i></div>`).join("")+"</div>";return h}
function bank(){const cb=S.co.filter(c=>c.bh>0&&!c.dead),o=S.cm[2].p,m=SEC.map((x,i)=>i===HOLD?"":`${x[0]} ${S.d[i]>.005?"▲":S.d[i]<-.005?"▼":"–"}`).filter(Boolean).join(" · ");
return `<h3>은행</h3><div class="card"><div class="mu">개인 대출 금리 ${(S.prime+1.5).toFixed(1)}% · 한도 = 순자산 × ${pLine().toFixed(1)}${ctlBank()?" (은행 지배 보너스 포함)":""} · 대출이 순자산의 3배를 넘으면 마진콜</div><div class="g" style="margin-top:8px"><span>대출</span><span class="dn">${F(S.loan)}</span><span>추가 대출 여력</span><span>${F(pRoom())}</span></div><div class="bs">${B("+50억","G.borrow(50)")}${B("+200억","G.borrow(200)")}${B("한도까지","G.borrow(1e9)","p")}${B("50억 상환","G.repay(50)")}${B("전액 상환","G.repay(1e9)")}</div></div>
<div class="card"><b>국채</b><div class="mu">수익률 ${S.yL.toFixed(2)}% (장기 국채) · 가격 ${S.bp.toFixed(1)} (금리가 오르면 가격이 내려갑니다) · 보유 ${F(S.gb)} (평가 ${F(gbv())})</div><div class="bs">${B("+50억","G.gbuy(50)")}${B("+200억","G.gbuy(200)")}${B("전량 매도","G.gsell(1e9)","",!S.gb)}</div></div>
<div class="card"><b>보유 회사채</b>${cb.map(c=>`<div class="row" onclick="G.pick(${c.id})" style="padding:6px 0"><span>${esc(c.tk)} <span class="mu">${RT[rating(c)]}</span></span><span class="num">${F(c.bh)} <span class="mu">(평가 ${F(bv(c))})</span></span></div>`).join("")||'<div class="mu">종목 화면에서 회사채를 살 수 있어요. 등급이 낮을수록 이자가 높지만 파산하면 크게 잃습니다.</div>'}</div>
${econCard()}
<div class="card"><b>신용등급</b><div class="mu" style="line-height:1.6">부채/자본 비율 기준 (은행·보험은 1/9로 환산): AAA 0.3 미만 · AA 0.6 · A 1.0 · BBB 1.6 · BB 2.5 · 그 이상 B · 자본잠식 D. 등급이 낮으면 이자가 비싸지고 회사 대출 한도가 줄어듭니다.</div></div>`}
let shKey="";
function render(){if(!S)return;const s=$("sh");let sc=s.scrollTop;
TCK="";
document.querySelectorAll("#nav [data-t]").forEach(b=>b.classList.toggle("on",b.dataset.t===tab&&!pg&&sel<0));
let h="";const w=nw();
if(S.over){if(!S.hofd){hofAdd(S.over===1?"파산":S.over===2?"구속":"은퇴");S.hofd=1}h=`<div class="card" style="margin-top:16px"><div class="big" style="font-size:30px">${S.over===1?"파산했습니다":S.over===2?"구속되었습니다":"은퇴했습니다"}</div><p>최종 순자산 ${F(w)} · 칭호 ${RK[S.rank][0]} · ${ds()}</p><p class="mu">기록은 명예의 전당에 남았습니다.</p><div class="bs">${B("새 게임 설정","G.newGame()","p")}${B("명예의 전당","G.pg('hof')")}${B("AI 코치 피드백","G.pg('coach')","p")}</div></div>`}
else h=tab==="h"?(S.cfg&&S.cfg.spec?specHome():home()):tab==="m"?market():tab==="e"?empire():tab==="b"?bank():news();
$("v").innerHTML=h;const o=sel>=0?sheet(sel):pg?page():"",key=sel>=0?"s"+sel:pg;
if(o){const open=s.hidden||key!==shKey;if(key!==shKey)sc=0;s.hidden=false;s.innerHTML='<div class="shi">'+o+"</div>";s.scrollTop=sc;if(pg==="chart")setTimeout(drawChart,0);
if(open&&s.classList){s.classList.remove("anim");void s.offsetWidth;s.classList.add("anim")}
if(pg==="search"&&sel<0){const q=$("qi");if(q&&!q.dataset.f){q.dataset.f=1;q.focus()}}}else s.hidden=true;shKey=o?key:"";
const md=$("md"),mb=$("mdb");if(mdl){const op=md.hidden;md.hidden=false;mb.innerHTML=`<h2>${esc(mdl.t)}</h2><p>${esc(mdl.b)}</p>${mdl.h||""}<div class="bs" style="justify-content:flex-end;margin-top:12px">${mdl.o.map((x,n)=>B(esc(x[0]),`G.mk(${n})`,n===mdl.o.length-1&&mdl.o.length>1?"p":"")).join("")}</div>`;
if(op&&mb.classList){mb.classList.remove("anim");void mb.offsetWidth;mb.classList.add("anim")}}else md.hidden=true;live()}
function live(){if(!S)return;ntBadge();liv13();const w=nw(),e=teOK();$("q").textContent=ds()+" "+qn()+"Q · 순자산 "+F(w);$("ent").innerHTML=`거래 주체 <b>${esc(eName(e))}</b> · ${F(eAvail(e))}`;
const pv=$("pv");if(pv){pv.textContent=F(w);const d=w-S.nm,x=$("pc");x.className="num "+(d>=0?"up":"dn");x.innerHTML=`${d>=0?"▲":"▼"} ${F(Math.abs(d))} (${(d/Math.max(1,Math.abs(S.nm))*100).toFixed(2)}%) <span class="mu">이번 달</span>`}
document.querySelectorAll("[data-pp]").forEach(x=>{const c=S.co[x.dataset.pp];if(c){x.className="pl "+(chg(c)>=0?"u":"d");x.textContent=W(c.p)}});
document.querySelectorAll("[data-pc]").forEach(x=>{const c=S.co[x.dataset.pc];if(c){const p=chg(c)*100;x.className="mu num "+(p>=0?"up":"dn");x.textContent=P1(p)}});
if(sel>=0){const c=S.co[sel],p=chg(c)*100,a=$("sp1"),b=$("sp2");if(a){a.className="big "+(p>=0?"up":"dn");a.textContent=W(c.p);b.innerHTML="오늘 "+P1((c.c1||0)*100)+" · 10일 "+P1(p)+"<br>시총 "+F(mc(c))}}
S.k++;if(S.k%8===0)misChk();if(RM&&S.k%40===0)tape();if(sel<0&&!pg&&tab!=="m"&&!mdl&&S.k%24===0)render()}
function tape(){const t=$("tkt");if(!t||!S)return;const hs=S.co.filter(c=>!c.dead&&!c.priv&&(c.own.P||mine(c))).slice(0,8),mv=S.co.filter(c=>!c.dead&&!c.priv).sort((a,b)=>Math.abs(chg(b))-Math.abs(chg(a))).slice(0,8),set=[...new Set([...hs,...mv])];
const it=tapeIx()+set.map(c=>{const p=chg(c)*100;return `<span class="ti"><b>${esc(c.tk)}</b> ${W(c.p)} <i class="${p>=0?"up":"dn"}">${p>=0?"▲":"▼"}${Math.abs(p).toFixed(1)}%</i></span>`}).join("")+`<span class="ti">${esc(S.log[0]||"")}</span>`;
t.innerHTML=RM?`<span class="ti">${esc(S.log[0]||"")}</span>`:it+it;if(!RM)t.style.animationDuration=Math.max(24,set.length*3.5)+"s"}
// ---- v12 core: seeded world, 30 countries, alert center, new state ----
// Every game has a seed. Each day the general random stream (_R) and separate world streams (market, macro, commodities,
// crypto, IPOs, black swans...) are re-seeded from (seed, day, stream). Two players with the same seed therefore live in the
// same world (macro, market and sector moves, company news and earnings noise) even when their own actions differ.
function mix32(a,b){let h=Math.imul((a|0)^0x9e3779b9,0x85ebca6b)^Math.imul((b|0)+0x632be5ab,0xc2b2ae35);h^=h>>>15;h=Math.imul(h,0x2c1b3c6d);h^=h>>>12;h=Math.imul(h,0x297a2d39);h^=h>>>15;return h>>>0}
function sfc32(a,b,c,d){return()=>{a|=0;b|=0;c|=0;d|=0;const t=(a+b|0)+d|0;d=d+1|0;a=b^b>>>9;b=c+(c<<3)|0;c=c<<21|c>>>11;c=c+t|0;return(t>>>0)/4294967296}}
function mkR(s,k){const a=mix32(s,k),b=mix32(a,k+1),c=mix32(b,k+2),d=mix32(c,k+3),f=sfc32(a,b,c,d);for(let j=0;j<12;j++)f();return f}
const wR=k=>mkR(mix32(S.seed|0,S.day),k);
function wRun(k,f){const g=_R;_R=wR(k);try{return f()}finally{_R=g}}
function dayR(){if(S.seed==null)S.seed=(Math.random()*2147483647)|0;_R=wR(1)}
// counter-based noise for one company on one day: the same seed gives the same company news whatever else happened
const hu=(id,k)=>mix32(mix32(S.seed|0,S.day*131+k),id+7)/4294967296;
function hgn(id,k){let u=hu(id,k);if(u<1e-12)u=1e-12;return Math.sqrt(-2*Math.log(u))*Math.cos(6.283185307179586*hu(id,k+1))}
function hgz(id,k){const z=hgn(id,k);return hu(id,k+2)<.035?z*2.5:z}
const newSeed=()=>(Math.random()*2147483647)|0;
const seedTxt=s=>{s=s>>>0;let t="";for(let k=0;k<6;k++){t+="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[s%32];s=Math.floor(s/32)}return t};
const seedOf=t=>{t=String(t||"").toUpperCase().replace(/[^A-Z0-9]/g,"");if(!t)return null;const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s=0,m=1,ok=t.length===6;for(const ch of t){const k=A.indexOf(ch);if(k<0){ok=false;break}s+=k*m;m*=32}return ok?s:mix32(t.split("").reduce((a,ch)=>a*31+ch.charCodeAt(0)|0,7),99)&0x3fffffff};

// ---- countries: [name, traits, description]; traits: tax, takeover resistance (res, %p), valuation (vm), growth (gr),
// currency/earnings swing (fx), political risk (pol: yearly % chance of a country shock), labor unrest (lab), regulator heat per quarter (reg), region (rg)
const CTD={tax:.35,res:0,vm:1,gr:0,fx:.2,pol:0,lab:1,reg:0,rg:"아시아"};
const ctr=c=>c&&c.cty!=null&&CTRY[c.cty]?CTRY[c.cty][1]:CTD;
const RGN=["아시아","미주","유럽","중동","조세회피처"];
// parody tickers of foreign firms -> country (everything else with an English name defaults to the US, Hangul names to Korea)
const CTMAP={TYMT:4,TSMX:6,ASMR:20,ARMH:16,BMWX:17,MRCD:17,NVSX:19,RSHE:19,SHLF:16,BPXX:16,AIRB:18,MERS:24,BNPX:18,HSBX:16,SANX:25,MUFX:4,ALLZ:17,AXAX:18,CHBB:19,SPTF:23,SHOP:12,SFTB:4,DTEL:17,ARCM:22,BASX:17,BASP:17,SHNX:4,LYBX:20,MTSH:4,ZIMX:27,CATL:5,BABX:5,NESX:19,LVMX:18,ADDX:17,DNSO:4,BOSX:17,MGAX:12,APTV:21,ABBX:19,FANX:4,SMCX:4,BIDU:5,MELI:15,TCHX:5,SNYX:4,PNSX:4,XMIX:5,BHPX:11,RIOX:16,BARX:12,VALX:14,NTRX:12,BUDX:26,DEOX:16,BTIX:16,CNRX:12,NGGX:16,MDTX:21,LNDE:21,CHMB:5};
const hasHangul=s=>/[가-힣]/.test(s);
function ctyPick(n){if(hasHangul(n))return 0;const w=[[1,30],[4,7],[5,7],[16,5],[17,5],[18,4],[12,4],[6,3],[8,4],[11,3],[19,3],[20,3],[2,3],[7,2],[9,2],[10,2],[13,2],[14,2],[21,2],[23,2],[24,1],[25,2],[26,1],[27,2],[28,1],[29,1],[15,1],[22,1],[3,1]];let t=0;for(const x of w)t+=x[1];let r=rnd()*t;for(const x of w){r-=x[1];if(r<=0)return x[0]}return 1}
function ctyAssign(fix){const dbt=new Set(dbForNewGame().flat().map(x=>x[0]));for(const c of S.co){if(c.dead||c.cty!=null)continue;const v0=cvm(c);c.cty=hasHangul(c.n)?0:CTMAP[c.tk]!=null?CTMAP[c.tk]:dbt.has(c.tk)?1:ctyPick(c.n);
if(fix&&c.nf!=null){c.nf-=Math.log(cvm(c)/v0);c.tg=tgCalc(c)}}}

// ---- alert center: notable things land here (and buzz the phone when allowed) ----
function note(t,k){if(!S)return;(S.nt=S.nt||[]).unshift({d:ds(),day:S.day,t:String(t),k:k||"i",r:0});if(S.nt.length>80)S.nt.length=80;
if(S.cfg&&S.cfg.vib&&typeof navigator!=="undefined"&&navigator.vibrate&&!(typeof document!=="undefined"&&document.hidden))try{navigator.vibrate(k==="w"?[70,50,70]:35)}catch(e){}}
const ntN=()=>(S.nt||[]).filter(x=>!x.r).length;
const NTE=/^(⚠|🔔|💥|🦈|🏆|🚨|⚖|🪦|📢|🧪|🦢|💸|🔬|🏛|📉 블랙|🧠)/;

// ---- v12 state: created on new games and on old saves ----
function v12prep(){if(S.seed==null)S.seed=newSeed();if(S.y0==null)S.y0=2027;if(S.nt==null)S.nt=[];if(S.cfg){const c=S.cfg;if(c.evf==null)c.evf=2;if(c.bsf==null)c.bsf=c.vol!=null?[1,2,3][c.vol]:2;if(c.vib==null)c.vib=1;if(!c.evc)c.evc={lab:1,legal:1,ops:1,fin:1,ind:1,ctry:1}}
if(S.inf==null)S.inf=2.6;if(S.yS==null)S.yS=Math.max(.5,S.prime-.4);if(S.yL==null)S.yL=S.prime+.3;if(S.csp==null)S.csp=1.8;if(S.un==null)S.un=4.2;if(S.fxr==null)S.fxr=1350;if(S.fed==null)S.fed=2;if(!S.mh)S.mh=[];if(!S.cyc)S.cyc="확장";if(!S.bsl)S.bsl=[];
if(!S.fx)S.fx=[];if(S.fm==null)S.fm=0;if(!S.pp)S.pp=[];if(!S.ow)S.ow=[];if(!S.irs)S.irs=[];if(!S.eo)S.eo=[];if(!S.rs)S.rs={};if(S.rc==null)S.rc=0;if(!S.qz)S.qz={};if(!S.rl)S.rl=[];
if(!S.icy)S.icy=SEC.map(()=>({ph:rnd()*6.283,a:.5+rnd()*.6}));while(S.icy.length<SEC.length)S.icy.push({ph:rnd()*6.283,a:.7});if(S.uwc==null)S.uwc=0;
if(!S.cx)cxInit();if(!S.etf)etfInit();for(const x of S.cx)if(!x.hr){x.hr=new Array(DH).fill(0);x.hn=0}for(const e of S.etf)if(!e.hr){e.hr=new Array(DH).fill(0);e.hn=0}if(S.ft&&S.ft.q){const q=S.ft.q;S.ft.q=0;const m=futExp("I:ALL",0);S.fx.push({u:"I:ALL",m,q:q*10,px:futPx("I:ALL",m),e:"P",mg:0,dv:0});L("📦 예전 지수선물 "+q+"계약을 새 선물 시스템의 종합지수 선물 "+(q*10)+"계약으로 옮겼습니다",1)}
for(const c of S.co){if(c.dead)continue;if(c.hq==null)hqInit(c);if(c.kd===1&&!c.ba)bankInit(c)}
if(!S.cst)S.cst={mc:0,fl:0,lq:0,lev:0,pk:nw(),dd:0,y:[],tr:[],bs:0,ev:0,evd:0};if(S.cty12==null){S.cty12=1;if(S.day>0)ctyAssign(1)}if(!S.rv12){S.rv12=1;S.R.forEach(r=>rvPrep(r))}}

// ---- v12 macro: inflation, central bank (Taylor rule), yield curve, credit spreads, unemployment, FX, business cycle ----
const clamp=(a,b,x)=>Math.max(a,Math.min(b,x));
const FED=["양적완화","완화","중립","긴축","초긴축"];
const sprM=()=>Math.max(.7,Math.min(2.5,1+((S.csp||1.8)/1.8-1)*.6));
// exporters gain when the won weakens (USD/KRW up), importers lose
[[1,.6],[2,.7],[16,.8],[25,.6],[28,.6],[11,.3],[15,.4],[8,-.7],[24,-.6],[20,-.3],[19,-.2],[23,.2]].forEach(([i,v])=>{if(SX[i])SX[i].fx=v});
function fedOf(){const p=S.prime;return p<=2.6?0:p<6?1:p<9.5?2:p<12.5?3:4}
function cycOf(g0){const g=S.gdp,d=g-g0;return g<.8&&d<=0?"침체":g<2.5&&d>0?"회복":g>=2.5&&d>=0?"확장":"둔화"}
// daily: yields drift to their quarterly anchors, credit spread follows fear, the won floats
function macroD(){const yS0=S.yS,yL0=S.yL;S.yS=Math.max(.05,S.yS+(S.prime-.6-S.yS)*.08+.006*gz());S.yL=Math.max(.2,S.yL+((S.yLt||S.yL)-S.yL)*.03+.012*gz());
const vix=S.IX&&S.IX.VIX?S.IX.VIX.v:17,ct=clamp(.8,12,1.5+1.1*Math.max(0,2.2-S.gdp)/3+2.2*Math.max(0,-S.mood)+Math.max(0,vix-18)*.035+(S.bsw&&S.bsw.cs||0));S.csp+=(ct-S.csp)*.04+.01*gz();
S.bp=Math.max(40,S.bp*(1-7*(S.yL-yL0)/100));const r=S.mk.r||0,f0=S.fxr;S.fxr=clamp(700,3000,S.fxr*Math.exp(.0042*gz()-.22*r+.004*Math.log(1350/S.fxr)-.0002*(S.prime-7.5)));S.fxd=Math.log(S.fxr/f0)}
// quarterly: inflation, Taylor rule, growth, unemployment, mood, crisis (runs on the macro world stream)
function macroQ(){const pp=S.prime,o=S.cm[2].p/Math.max(1,S.cm[2].f),g0=S.gdp,oq=S.oq||o,inv=Math.max(0,S.yS-S.yL);S.oq=o;
const si=S.sci&&S.sci.q>0?(S.sci.q--,S.sci.v):0,sg=S.scg&&S.scg.q>0?(S.scg.q--,S.scg.v):0;S.inf=clamp(-2,18,S.inf+.22*(2.5-S.inf)+.28*(S.gdp-3)+2.2*Math.log(o/oq)+.12*Math.max(0,4.5-S.un)+nz()*.5+si+(S.scr&&S.scr.inf||0)+(S.bsw&&S.bsw.inf||0));
const tgt=clamp(2,19,7.5+1.5*(S.inf-2.5)+.5*(S.gdp-3)+(S.scr&&S.scr.pr||0));S.prime=clamp(2,19,S.prime+.35*(tgt-S.prime)+nz()*.35);
const dP=S.prime-pp;S.dPr=dP;if(Math.abs(dP)>.05){S.mk.j-=2.4*dP/100;S.mk.jw=(dP>0?"기준금리 인상 +":"기준금리 인하 ")+dP.toFixed(2)+"%p"}
S.yLt=clamp(.8,20,7.9+.5*(S.inf-2.5)+.2*(S.prime-7.5)-.25*Math.max(0,3-S.gdp)+(S.fed===0?-.8:0)+nz()*.3);S.bp=Math.max(40,S.bp+(100-S.bp)*.03);
S.gdp=clamp(-8,9,S.gdp+nz()*1.2+(3-S.gdp)*.25-(o-1)*.6-(S.prime-7.5)*.12-.45*inv+sg+(S.scr&&S.scr.g||0)+(S.bsw&&S.bsw.g||0));
S.mk.j+=.004*(S.gdp-g0);if(Math.abs(S.gdp-g0)>.8&&!S.mk.jw)S.mk.jw="GDP 성장률 "+(S.gdp>g0?"호조":"부진")+" ("+S.gdp.toFixed(1)+"%)";
S.un=clamp(2.5,15,S.un+.25*(4.4-S.un)-.22*(S.gdp-3)+nz()*.15);S.fed=fedOf();if(S.fed===0)S.mood+=.04;
S.mood=S.mood*.65+(S.gdp-3)*.06-(S.prime-7.5)*.03-Math.max(0,S.inf-4)*.02+nz()*.1;S.d[5]+=(o-1)*.004;S.d[8]-=(o-1)*.004;S.cyc=cycOf(g0);
if(rnd()<[.025,.05,.1][S.cfg?S.cfg.vol:1]){S.gdp-=3;S.mood-=.3;S.cm[0].p*=1.12;S.mk.j-=.07;S.mk.h=Math.min(.0016,S.mk.h*5);S.mk.jw="글로벌 금융위기";L("📉 글로벌 금융위기! 경기 급랭, 금값 상승",1)}
if(inv>.3&&!S.invw){S.invw=1;eco("📐 장단기 금리 역전 (단기 "+S.yS.toFixed(2)+"% > 장기 "+S.yL.toFixed(2)+"%) — 역사적으로 1~2년 안에 경기 침체가 자주 왔어요")}else if(inv<=0)S.invw=0;
(S.mh=S.mh||[]).push({d:S.day,pr:+S.prime.toFixed(2),ys:+S.yS.toFixed(2),yl:+S.yL.toFixed(2),inf:+S.inf.toFixed(2),g:+S.gdp.toFixed(2),un:+S.un.toFixed(2),cs:+S.csp.toFixed(2),fx:Math.round(S.fxr),ix:+S.ix.toFixed(1)});if(S.mh.length>48)S.mh.shift();
if(S.fed!==S.fed0&&S.fed0!=null)eco("🏦 중앙은행 기조 변경: "+FED[S.fed0]+" → "+FED[S.fed]+" (기준금리 "+S.prime.toFixed(2)+"%, 물가 "+S.inf.toFixed(1)+"%)");S.fed0=S.fed;
if(S.scr&&S.scr.q>0&&--S.scr.q<=0)S.scr=null;ctyQ()}
// country shocks (political risk): capital controls, windfall taxes, nationalisation
function ctyQ(){const by={};for(const c of S.co)if(!c.dead&&!c.priv&&c.cty!=null)(by[c.cty]=by[c.cty]||[]).push(c);
for(const k in by){const t=CTRY[k][1];if(!t.pol||rnd()>t.pol/100)continue;const a=by[k],u=rnd();
if(u<.45){for(const c of a){c.jx=(c.jx||0)-.07;c.nf=(c.nf||0)-.04}eco("🏛 "+CTRY[k][0]+" 자본 통제 발표 — 현지 상장사 일제히 하락");if(a.some(c=>c.own.P||mine(c)))L("🏛 "+CTRY[k][0]+" 자본 통제! 보유 종목이 영향을 받습니다",1)}
else if(u<.8){const v=a.filter(c=>c.i===5||c.i===12||c.i===29);for(const c of v){c.cs-=c.A*.02;if(c.cs<0){c.D-=c.cs;c.cs=0}c.jx=(c.jx||0)-.05}if(v.length)eco("🏛 "+CTRY[k][0]+" 횡재세 도입 — 에너지·은행·광업 이익 환수")}
else{const v=a.filter(c=>!mine(c)&&mc(c)>200);const c=v[rnd()*v.length|0];if(!c)continue;const had=c.own.P>0;eco("🏛 "+CTRY[k][0]+" 정부가 "+c.tk+" "+c.n+"을(를) 국유화 (시가의 60% 보상)");if(had)L("🏛 "+c.tk+" 국유화! 보유 지분은 시가의 60%로 보상됩니다",1);kill(c,.6)}}}
// regulator heat from controlled companies in offshore / lightly regulated places
function ctyHeat(){const s=new Set();for(const c of S.co)if(mine(c)&&c.cty!=null&&CTRY[c.cty][1].reg)s.add(c.cty);let h=0;for(const k of s)h+=CTRY[k][1].reg;if(h){S.heat+=h;if(!S.kmw){S.kmw=1;L("🏝 조세회피처·규제 약한 나라 법인 때문에 감독원 주목도가 분기마다 오릅니다 (+"+h+")",1)}}}

// ---- black swans: rare, huge, mostly unforecastable (Taleb). Each has a market path, sector hits, macro effects and a lesson ----
const BSW=[
{id:"pan",n:"팬데믹",q:6,t:"🦢 블랙 스완: 신종 감염병 팬데믹! 국경 봉쇄, 공장 멈춤",js:[-.07,-.05,-.06,.03,-.08,-.04,.06,.05],sj:{8:-.25,23:-.3,22:.08,4:.1,27:.08,0:.05,19:.04},sn:{8:-.25,23:-.3,4:.12,27:.12,0:.08},g:-3.5,m:-.5,pr:-3.5,cs:2,oil:.55,
d:"사람이 움직이지 못하면 항공·호텔·여행이 가장 먼저 무너지고, 원격 근무·온라인·제약은 살아납니다. 중앙은행이 금리를 0 가까이 내리고 돈을 풀면(양적완화) 주가는 경제보다 먼저 회복하곤 해요."},
{id:"war",n:"전쟁 발발",q:4,t:"🦢 블랙 스완: 대규모 전쟁 발발! 유가·금값 급등",js:[-.05,-.03,.01],sj:{17:.2,5:.12,29:.1,8:-.12,23:-.1,16:-.05},sn:{17:.2,5:.1},g:-1.2,m:-.3,inf:1.5,oil:1.6,gold:1.18,cs:1,
d:"전쟁은 에너지와 원자재 공급을 끊어 물가를 올립니다. 방산·에너지·금은 오르고, 연료비가 큰 항공·물류와 소비는 약해집니다."},
{id:"bank",n:"대형 은행 파산",q:4,t:"🦢 블랙 스완: 초대형 은행 파산! 금융 시스템 공포",js:[-.06,-.05,-.04,-.03,.02,-.03],sj:{12:-.25,13:-.15,3:-.2,9:-.1},sn:{12:-.25,3:-.15},g:-2.2,m:-.45,pr:-2,cs:3.5,fn:"bankFail",
d:"은행은 서로 돈을 빌려주기 때문에 큰 은행 하나가 무너지면 '다음은 누구냐'는 공포가 퍼집니다(전염). 신용 스프레드가 치솟아 빚 많은 회사부터 위험해져요."},
{id:"sov",n:"국가 부도",q:3,t:"🦢 블랙 스완: 국가 부도 사태! 신흥국 자금 이탈",js:[-.04,-.02],m:-.2,cs:1.5,fn:"sovDefault",
d:"나라가 빚을 못 갚으면 그 나라 통화와 기업이 함께 폭락하고, 그 나라에 돈을 빌려준 은행도 손실을 봅니다. 투자 자금은 안전한 곳으로 도망가요."},
{id:"flash",n:"플래시 크래시",q:0,t:"🦢 블랙 스완: 플래시 크래시! 하루 만에 폭락",js:[-.09,.04,.03,.01],m:-.08,
d:"알고리즘 매매와 손절 주문이 연쇄로 터지면 이유 없이 몇 분 만에 폭락하기도 합니다. 펀더멘털이 그대로면 대개 빠르게 회복하니, 레버리지가 없다면 버티는 쪽이 유리할 때가 많아요."},
{id:"cxc",n:"코인 거래소 붕괴",q:4,t:"🦢 블랙 스완: 대형 코인 거래소 파산! 코인 폭락",js:[-.015],sj:{3:-.1},fn:"cxCrash",
d:"고객 돈을 맡은 거래소가 무너지면 그 거래소 토큰은 휴지가 되고, 코인 시장 전체가 '겨울'에 들어갑니다. 거래소에 맡긴 자산은 은행 예금과 달리 보호받지 못해요."},
{id:"tech",n:"기술 혁명",q:8,t:"🦢 블랙 스완(긍정): 범용 AI 돌파구! 기술 혁명 시작",js:[.03,.02,.02],sj:{0:.12,1:.15,27:.12,28:.06},sn:{0:.35,1:.45,27:.3,28:.15,26:.1},g:1.2,m:.35,
d:"블랙 스완이 늘 나쁜 건 아닙니다. 생산성을 확 끌어올리는 기술이 나오면 관련 업종 기대가 폭발해요. 다만 기대가 너무 앞서가면 나중에 거품이 꺼질 수 있습니다."},
{id:"quake",n:"초대형 지진",q:3,t:"🦢 블랙 스완: 초대형 지진·쓰나미! 보험 손실 폭증",js:[-.03,-.01],sj:{13:-.22,9:.1,11:.05},g:-1.4,m:-.15,fn:"quake",
d:"대형 재해는 보험사에 막대한 보험금을 안기지만, 재건 수요로 건설·철강은 오히려 일감이 늘어요. 보험사는 재보험으로 이런 꼬리 위험을 나눠 집니다."},
{id:"infl",n:"인플레이션 쇼크",q:5,t:"🦢 블랙 스완: 물가 폭등! 중앙은행 긴급 금리 인상 예고",js:[-.03,-.02,-.02],sj:{0:-.06,27:-.08,18:-.08,9:-.06},sn:{0:-.15,27:-.18,18:-.15},inf:4.5,m:-.2,pr:3,
d:"물가가 갑자기 뛰면 중앙은행은 금리를 크게 올립니다. 금리가 오르면 먼 미래 이익의 현재 가치가 줄어 성장주가 가장 크게 떨어지고, 채권 가격도 하락해요."},
{id:"cmdty",n:"원자재 슈퍼사이클",q:6,t:"🦢 블랙 스완: 원자재 슈퍼사이클! 자원 가격 폭등",js:[.01],sj:{29:.15,5:.1,30:.1,8:-.08,15:-.06},sn:{29:.3,5:.2,30:.2},inf:1.5,fn:"supercycle",
d:"신흥국 수요와 공급 부족이 겹치면 원자재 가격이 몇 년씩 오릅니다. 광업·에너지·농업 회사의 이익이 폭증하고, 원자재를 사서 쓰는 회사의 마진은 줄어요."},
{id:"sub",n:"서브프라임 붕괴",q:6,t:"🦢 블랙 스완: 서브프라임 모기지 붕괴! 부동산·은행 동반 추락",js:[-.04,-.03,-.03,-.04,-.02,-.03,-.03,.02,-.04],sj:{12:-.3,9:-.25,3:-.2,13:-.12},sn:{12:-.3,9:-.25,3:-.15},g:-3,m:-.5,pr:-3.5,cs:4,mx:"re",sub:6,
d:"신용이 낮은 사람에게 집값 상승만 믿고 빌려준 대출이 한꺼번에 부실해지면, 그 대출을 묶은 증권을 가진 은행들이 큰 손실을 봅니다. 은행 탭의 서브프라임 비중이 높은 은행부터 위험해요."}];
function bsTick(){if(S.bsw){const b=S.bsw;if(b.js&&b.ji<b.js.length){S.mk.j+=b.js[b.ji];S.mk.jw=b.n;b.ji++}if(S.day>=b.end){L("✅ 블랙 스완 '"+b.n+"' 국면이 끝났습니다",1);S.bsw=null}return}
const f=S.cfg?S.cfg.bsf:2;if(!f||S.day<180)return;if(rnd()<[0,.05,.1,.25][f]/360)bsStart(BSW[rnd()*BSW.length|0].id)}
function bsStart(id,quiet){const e=BSW.find(x=>x.id===id);if(!e)return;const b={id:e.id,n:e.n,js:e.js||[],ji:0,end:S.day+Math.max(30,e.q*90),g:(e.g||0)/Math.max(1,e.q),inf:(e.inf||0)/Math.max(1,e.q),cs:e.cs||0,sub:e.sub||0};
S.bsw=b;S.mood+=e.m||0;S.gdp+=e.g?e.g*.5:0;if(e.pr){S.scr=Object.assign(S.scr||{},{pr:e.pr,q:Math.max(2,e.q)})}if(e.oil){S.cm[2].p*=e.oil;S.cm[2].f*=1+(e.oil-1)*.5}if(e.gold)S.cm[0].p*=e.gold;
S.sj=S.sj||[];S.sjw=S.sjw||[];for(const k in e.sj||{}){S.sj[k]=(S.sj[k]||0)+e.sj[k];S.sjw[k]=e.n}for(const k in e.sn||{})S.ns[k]=(S.ns[k]||0)+e.sn[k];S.mk.h=Math.min(.0016,S.mk.h*3);
if(e.mx&&!S.mx){const m=MXE.find(x=>x.id===e.mx);if(m){S.mx={id:m.id,q:m.q};for(const k in m.d)S.mxd[k]+=m.d[k]}}if(e.fn&&BSF[e.fn])BSF[e.fn]();
(S.bsl=S.bsl||[]).unshift({d:ds(),n:e.n});if(S.bsl.length>12)S.bsl.length=12;S.cst&&S.cst.bs++;L(e.t,1);eco(e.t);
if(!quiet&&!mdl){mdl={t:"🦢 "+e.n,b:e.d,h:`<div class="mu" style="line-height:1.6">블랙 스완은 거의 일어나지 않지만 일어나면 시장을 뒤흔드는 사건이에요. 레버리지(대출·선물·코인 레버리지)가 크면 지금이 가장 위험한 순간입니다. 설정에서 빈도를 바꾸거나 끌 수 있어요.</div>`,o:[["개념서: 블랙 스완","bk"],["확인","ok"]],bsx:1};S.sp0=S.spd;S.spd=0}}
const BSF={
bankFail(){const b=S.co.filter(c=>c.kd===1&&!c.dead&&!mine(c)).sort((x,y)=>y.A-x.A).slice(0,3),c=b[rnd()*b.length|0];if(!c)return;const had=c.own.P>0;eco("🏦💥 "+c.tk+" "+c.n+" 파산 — 예금은 정부가 보호, 주주는 전액 손실");if(had)L("💥 보유 중인 "+c.tk+" 은행이 파산했습니다",1);
for(const x of S.co)if(!x.dead&&x.ln===c.id){x.ln=pickBank()}S.st.del++;kill(c,.02)},
sovDefault(){const ks=[...new Set(S.co.filter(c=>!c.dead&&!c.priv&&c.cty!=null&&CTRY[c.cty][1].pol>=.3).map(c=>c.cty))],k=ks[rnd()*ks.length|0];if(k==null)return;S.bsw.cty=k;
for(const c of S.co)if(!c.dead&&!c.priv&&c.cty===k){c.jx=(c.jx||0)-.3;c.nf=(c.nf||0)-.15}for(const c of S.co)if(!c.dead&&c.kd===1)c.jx=(c.jx||0)-.06;S.bsw.n+=" ("+CTRY[k][0]+")";eco("🏛💥 "+CTRY[k][0]+" 국가 부도 선언 — 현지 기업 폭락, 은행 손실")},
cxCrash(){cxShock("exch",-.95,"거래소 파산");cxShock(null,-.35,"거래소 붕괴 여파");S.cxw=S.day+360},
quake(){for(const c of S.co)if(!c.dead&&c.kd===2){const l=c.A*.06;c.cs-=l;if(c.cs<0){c.D-=c.cs;c.cs=0}c.cat=(c.cat||0)+l}},
supercycle(){for(const m of S.cm.slice(0,5))m.f*=1.5}};

// ---- historical scenarios: start a new game in a famous era; the big moments arrive on schedule ----
// each event: [day, kind, value(s), headline]. kinds: j market jump series, s sector jumps {i:x}, n lasting sector re-rating, nm lasting market re-rating,
// mood/g/inf adds, pr policy offset (quarters), oil/gold factor, bs black swan id, mx macro regime, cx crypto factor
const SCN=[
{id:"free",n:"자유 (현재)",y0:2027,d:"정해진 사건 없이 시작합니다."},
{id:"s73",n:"1970년대 스태그플레이션",y0:1973,pr:9,inf:5,d:"오일 쇼크 두 번, 두 자릿수 물가, 금리 20% 근처. 주식은 10년 동안 제자리였어요.",ev:[
[280,"oil",3.2,"⛽ 산유국 석유 금수 조치! 유가 4배"],[285,"j",[-.04,-.03,-.03],"오일 쇼크로 증시 급락"],[290,"inf",3,""],[300,"g",-2.5,""],[400,"j",[-.03,-.03,-.02,-.03],"스태그플레이션 공포"],[420,"pr",3,"물가를 잡기 위한 금리 인상"],
[720,"j",[.03,.02],"바닥 탈출 기대"],[2160,"oil",2.4,"⛽ 2차 오일 쇼크! 유가 다시 폭등"],[2170,"inf",4,""],[2200,"pr",7,"🏦 신임 의장 '물가와의 전쟁' — 기준금리 폭등"],[2260,"g",-3,""],[2300,"j",[-.03,-.02,-.03],"금리 20% 시대"],[2900,"pr",-4,"물가가 잡히자 금리 인하 시작"],[2950,"j",[.04,.03,.03],"대세 상승장 시작"]]},
{id:"s87",n:"1987 블랙 먼데이",y0:1987,pr:8.5,d:"연초부터 뜨겁게 오르던 시장이 10월 19일 하루 만에 22% 넘게 폭락했어요. 그래도 2년 뒤에는 회복했습니다.",ev:[
[1,"mood",.35,"🐂 강세장 — 인수합병 열풍"],[1,"nm",.12,""],[200,"pr",1.5,"금리 상승 우려"],[275,"j",[-.02,-.03,-.025],"달러 약세·금리 우려로 하락"],[289,"j",[-.22,.05,.09],"📉 블랙 먼데이! 하루 만에 -22%"],[290,"pr",-1.5,"🏦 중앙은행 '유동성 무제한 공급' 성명"],[290,"mood",-.4,""],[400,"mood",.3,"회복세"]]},
{id:"s00",n:"2000 닷컴 버블",y0:1999,pr:8,d:"인터넷 회사라면 뭐든 오르던 시절. 2000년 3월 정점 뒤 기술주는 2년 반 동안 75% 넘게 빠졌어요.",ev:[
[1,"n",{0:.35,27:.6,1:.3,7:.2,10:.25},"🌐 인터넷 혁명 — 닷컴 열풍"],[1,"mood",.4,""],[120,"n",{0:.25,27:.4,1:.2,10:.15},"IPO 첫날 주가 몇 배, 거품 경고"],[250,"n",{0:.2,27:.3,1:.15},"닷컴 광풍 절정"],[300,"pr",1.2,"과열 진정을 위한 금리 인상"],
[430,"j",[-.05,-.04,-.03],"📉 기술주 폭락 시작 — 거품 붕괴"],[432,"n",{0:-.45,27:-.75,1:-.35,7:-.25,10:-.35},""],[440,"mood",-.4,""],[600,"g",-2.5,"경기 침체 진입"],[620,"pr",-3,"🏦 연속 금리 인하"],[960,"j",[-.07,-.04,.03],"지정학적 충격으로 급락"],[1100,"n",{0:-.2,27:-.3,1:-.2},"회계 부정 스캔들 연쇄"],[1300,"mood",.4,"바닥 확인, 회복 시작"]]},
{id:"s08",n:"2008 글로벌 금융위기",y0:2007,pr:8.25,d:"집값이 꺾이자 서브프라임 대출이 무너지고, 2008년 9월 대형 투자은행이 파산하며 전 세계가 흔들렸어요.",ev:[
[1,"mood",.2,"🏠 주택 시장 정점 — 대출 호황"],[200,"s",{12:-.08,9:-.1,3:-.08},"서브프라임 부실 첫 경고"],[220,"j",[-.03,-.02],"신용 경색 시작"],[230,"pr",-1,"긴급 금리 인하"],[420,"s",{12:-.15,3:-.2},"대형 증권사 긴급 구제"],
[620,"bs","bank","💥 대형 투자은행 파산! 금융위기 폭발"],[625,"j",[-.05,-.07,-.04,-.08,.06,-.05,-.04,-.03],"공포 확산"],[630,"pr",-4,"🏦 제로 금리 + 양적완화"],[640,"g",-4,"글로벌 경기 침체"],[700,"j",[-.04,-.03,-.03],"투매"],[790,"mood",.5,"📈 바닥 — 회복 랠리 시작"],[800,"nm",.15,""]]},
{id:"s20",n:"2020 팬데믹과 그 이후",y0:2020,pr:6.5,d:"코로나 폭락과 V자 반등, 밈 주식과 코인 광풍, 그리고 2022년 물가 쇼크와 급격한 금리 인상까지.",ev:[
[50,"bs","pan","🦠 팬데믹 선언"],[95,"oil",.45,"⛽ 유가 폭락 — 저장 공간 부족"],[100,"mood",.5,"💸 무제한 양적완화와 재정 부양"],[110,"n",{0:.2,27:.35,1:.2,4:.15},"비대면 수혜주 급등"],[200,"cx",1.8,"₿ 코인 랠리"],
[380,"mood",.3,"🎢 밈 주식·코인 광풍"],[390,"cx",2,"₿ 코인 광풍"],[720,"inf",4,"📈 40년 만의 물가 쇼크"],[740,"pr",1.5,"🏦 0.75%p씩 연속 금리 인상"],[745,"n",{0:-.3,27:-.45,1:-.3,18:-.3},"성장주 급락"],[760,"cx",.5,"₿ 코인 겨울"],[1050,"bs","cxc","💥 대형 코인 거래소 파산"],[1200,"n",{0:.25,1:.4,27:.2},"🤖 AI 붐 시작"]]}];
function scnInit(id){const s=SCN.find(x=>x.id===id);if(!s||s.id==="free")return;S.y0=s.y0;S.scn={id:s.id,n:s.n,i:0};if(s.pr){S.prime=s.pr;S.yS=s.pr-.6;S.yL=s.pr+.3;S.yLt=S.yL}if(s.inf)S.inf=s.inf;
L("📜 시나리오 시작: "+s.n+" — "+s.d,1)}
function scnTick(){const sc=S.scn;if(!sc)return;const s=SCN.find(x=>x.id===sc.id);if(!s||!s.ev)return;while(sc.i<s.ev.length&&s.ev[sc.i][0]<=S.day){const[d,k,v,t]=s.ev[sc.i];sc.i++;
if(k==="j"){const js=v.slice();S.mk.j+=js.shift();S.mk.jw=t||"시나리오";if(js.length)(S.sjq=S.sjq||[]).push(...js.map(j=>[j,t]))}
else if(k==="s"||k==="n"){S.sj=S.sj||[];S.sjw=S.sjw||[];for(const i in v){if(k==="s"){S.sj[i]=(S.sj[i]||0)+v[i];S.sjw[i]=t}else S.ns[i]=(S.ns[i]||0)+v[i]}}
else if(k==="nm")S.mk.nm=(S.mk.nm||0)+v;else if(k==="mood")S.mood+=v;else if(k==="g"){S.gdp+=v*.5;S.scg={v:v*.25,q:4}}else if(k==="inf"){S.inf+=v*.5;S.sci={v:v*.25,q:8}}
else if(k==="pr")S.scr={pr:v,q:4};else if(k==="oil"){S.cm[2].p*=v;S.cm[2].f*=1+(v-1)*.6}else if(k==="bs")bsStart(v,1);else if(k==="cx"){for(const x of S.cx||[])if(!x.dead&&x.cat!=="stable"){x.hy=Math.min(1,(x.hy||0)+(v>1?.3:-.3));x.jx=(x.jx||0)+Math.log(v)*.5}}
if(t){L("📜 "+t,1);eco("📜 "+t)}}}
function sjqTick(){if(S.sjq&&S.sjq.length){const[j,t]=S.sjq.shift();S.mk.j+=j;if(!S.mk.jw)S.mk.jw=t||"시나리오"}}

// ---- v12 instruments: futures (commodity, index, stock), option chain / exercise / writing, interest rate swaps, ETFs ----
// ===== futures =====
// u: "C:GOLD" commodity, "I:ALL"/"I:L50" index, "S:<id>" stock (large-cap 50 only). mult = 억 per price unit per contract.
const FSZ={GOLD:[100,"온스",.06],SILV:[5000,"온스",.08],OIL:[1000,"배럴",.08],COPR:[25,"톤",.06],WHT:[500,"톤",.06]};
function fsp(u){const[t,k]=u.split(":");if(t==="C"){const z=FSZ[k],m=S.cm.find(x=>x.k===k);return{t,k,m,n:m.n+" 선물",unit:z[0].toLocaleString()+z[1],mult:z[0]/1e8,im:z[2],mm:z[2]*.72,fee:.0005,lim:2000,mo:1}}
if(t==="I")return{t,k,n:(k==="ALL"?"WSR 종합":"대형 50")+" 지수선물",unit:"1포인트 = 0.1억",mult:.1,im:.08,mm:.06,fee:.0003,lim:500,mo:0};
const c=S.co[+k];return{t,k,c,n:(c?c.tk:"?")+" 주식선물",unit:"1,000주",mult:1e-5,im:.15,mm:.11,fee:.0003,lim:c?Math.max(1,Math.floor(c.sh*.5)):0,mo:0}}
function fspot(u){const s=fsp(u);return s.t==="C"?s.m.p:s.t==="I"?(s.k==="ALL"?S.ix:S.IX.L50.v):s.c?s.c.p:0}
function futExp(u,k){const q=u[0]==="C"?30:90;return(Math.floor(S.day/q)+1+k)*q}
function futPx(u,m){const s=fsp(u),T=Math.max(0,(m-S.day)/360),sp=fspot(u);if(s.t==="C"){const f=s.m.f*Math.exp(.02*T),cp=.6*(S.yS||6)/100+.01;return(f+(sp-f)*Math.exp(-1.2*T))*Math.exp((cp-.02)*T)}
if(s.t==="I")return sp*Math.exp(((S.yS||6)/100-.02)*T);return sp*Math.exp(((S.yS||6)/100-dyv(s.c)/100)*T)}
const fNot=(p,s)=>Math.abs(p.q)*s.mult*p.px;
function fmgSync(){S.fm=0;for(const c of S.co)if(c.fmg)c.fmg=0;for(const p of S.fx){if(p.e==="P")S.fm+=p.mg;else{const c=S.co[p.e];if(c)c.fmg=(c.fmg||0)+p.mg}}}
function futImpact(s,q,px){if(s.t==="C"){s.m.p*=Math.exp(Math.sign(q)*Math.min(.05,Math.abs(q)*s.mult*px/2e5))}else if(s.t==="S"&&s.c){s.c.jx=(s.c.jx||0)+Math.sign(q)*Math.min(.03,Math.abs(q)*s.mult*px/Math.max(1,mc(s.c))*.5)}}
// open / add / reduce a position for entity e (P or company id)
function futTrade(e,u,m,q){const s=fsp(u);if(!q)return"수량을 정하세요";if(s.t==="S"&&(!s.c||s.c.dead||s.c.priv||!(S.l50||[]).includes(s.c.id)))return"대형 50 종목만 주식선물이 있어요";
if(m<=S.day)return"이미 만기된 계약입니다";const px=futPx(u,m);let p=S.fx.find(x=>x.u===u&&x.m===m&&x.e===e);const q0=p?p.q:0,nq=q0+q;if(Math.abs(nq)>s.lim)return"포지션 한도 "+s.lim.toLocaleString()+"계약을 넘습니다";
const fee=Math.abs(q)*s.mult*px*s.fee,im=Math.abs(nq)*s.mult*px*s.im;if(!p){p={u,m,q:0,px,e,mg:0,dv:0,dep:0};S.fx.push(p)}
if(p.px!==px){p.mg+=p.q*s.mult*(px-p.px);p.px=px}const need=Math.max(0,im-p.mg)+fee;if(Math.abs(nq)>Math.abs(q0)&&!ePay(e,need)){if(!p.q&&!p.mg)S.fx.splice(S.fx.indexOf(p),1);return"증거금 부족: 필요 "+F(need)+", "+eName(e)+" 가용 "+F(eAvail(e))}
if(Math.abs(nq)>Math.abs(q0)){p.mg+=need-fee;p.dep=(p.dep||0)+need-fee}else{ePay(e,Math.min(fee,eAvail(e)));const rel=Math.max(0,p.mg-im);p.mg-=rel;p.dep=(p.dep||0)-rel;if(e==="P")S.cash+=rel;else S.co[e].cs+=rel}
p.q=nq;futImpact(s,q,px);if(!p.q){const x=p.mg;p.mg=0;if(e==="P")S.cash+=x;else S.co[e].cs+=x;S.fx.splice(S.fx.indexOf(p),1);if(x>0&&e==="P")S.fl.fu=1}
rec((q>0?"선물 매수 ":"선물 매도 ")+Math.abs(q),{tk:s.n.split(" ")[0]},Math.abs(q)*s.mult*px,eName(e));fmgSync();return""}
// daily mark-to-market, margin calls (top up from cash/credit or liquidate), expiry (cash settlement or physical delivery)
function futDay(){if(!S.fx.length)return;const out=[];for(const p of S.fx){const s=fsp(p.u);if(s.t==="S"&&(!s.c||s.c.dead)){p.q=0;out.push(p);continue}const px=p.m<=S.day?fspot(p.u):futPx(p.u,p.m);p.mg+=p.q*s.mult*(px-p.px);p.px=px;
if(p.m<=S.day){if(p.dv&&p.q>0&&s.t==="C"){const cost=p.q*s.mult*px,u=p.q*FSZ[s.k][0];if(ePay(p.e==="P"?"P":p.e,Math.max(0,cost-p.mg))){s.m.h+=u;s.m.b+=cost;L("📦 "+s.m.n+" 선물 "+p.q+"계약 실물 인수: "+u.toLocaleString()+FSZ[s.k][1]+" ("+F(cost)+")",1);p.mg=0}}
const x=p.mg;if(p.e==="P"){S.cash+=x;if(x<0&&S.cash<0){S.loan-=S.cash;S.cash=0}}else{const c=S.co[p.e];if(c){c.cs+=x;if(c.cs<0){c.D-=c.cs;c.cs=0}}}if(p.q)L("⌛ "+s.n+" 만기 정산: 증거금 "+F(x)+" 반환",p.e==="P");out.push(p);continue}
const mm=Math.abs(p.q)*s.mult*px*s.mm;if(p.mg<mm){const im=Math.abs(p.q)*s.mult*px*s.im,need=im-p.mg;if(ePay(p.e,need)){p.mg+=need;p.dep=(p.dep||0)+need;if(p.e==="P"){S.cst.mc++;L("📣 "+s.n+" 마진콜: 증거금 "+F(need)+" 추가 납부 (현금·대출 한도에서)",1)}}
else{const fee=Math.abs(p.q)*s.mult*px*s.fee,x=p.mg-fee;futImpact(s,-p.q,px);if(p.e==="P"){S.cash+=x;if(S.cash<0){S.loan-=S.cash;S.cash=0}S.cst.fl++;L("⚠ "+s.n+" 증거금 부족 → 강제 청산! 남은 증거금 "+F(x),1)}else{const c=S.co[p.e];if(c){c.cs+=x;if(c.cs<0){c.D-=c.cs;c.cs=0}if(mine(c))L("⚠ "+c.tk+" 명의 "+s.n+" 강제 청산",1)}}p.mg=0;p.q=0;out.push(p)}}}
if(out.length)S.fx=S.fx.filter(p=>!out.includes(p));fmgSync()}
const futVal=e=>S.fx.reduce((a,p)=>a+(p.e===e?p.mg:0),0);
G.fut=q=>{const e=teOK();const r=futTrade(e,"I:ALL",futExp("I:ALL",0),q*10);toast(r||"종합지수 선물 "+(q>0?"매수 ":"매도 ")+Math.abs(q*10)+"계약");render()};
G.ft2=(u,m,q)=>{if(q===0)return;const r=futTrade(teOK(),u,m,q);toast(r||fsp(u).n+" "+(q>0?"매수 ":"매도 ")+Math.abs(q)+"계약 ("+eName(teOK())+")");render()};
G.ftq=(u,m)=>{const s=fsp(u),px=futPx(u,m),e=teOK(),p=S.fx.find(x=>x.u===u&&x.m===m&&x.e===e),cur=p?p.q:0,mx=Math.max(1,Math.min(s.lim,Math.floor(eAvail(e)/Math.max(1e-9,s.mult*px*(s.im+s.fee)))));
numModal({t:s.n+" · "+futLab(u,m),b:"양수 = 매수(가격 상승에 베팅), 음수 = 매도(하락에 베팅). 1계약 = "+s.unit+", 지금 가격 "+fpx(u,px)+". 매일 손익이 증거금에 정산되고, 유지 증거금 아래로 떨어지면 마진콜이 옵니다.",min:-Math.min(s.lim,mx+Math.max(0,-cur)),max:Math.min(s.lim,mx+Math.max(0,cur)),step:1,val:1,u:"계약",chips:[-10,-1,1,5,10,50].filter(v=>Math.abs(v)<=mx),cf:x=>(x>0?"+":"")+x,ok:"주문",
pv:x=>"계약 가치 "+F(Math.abs(x)*s.mult*px)+" · 필요 증거금 "+F(Math.abs(x)*s.mult*px*s.im)+" ("+(s.im*100).toFixed(0)+"%) · "+eName(e)+" 가용 "+F(eAvail(e))+(cur?" · 지금 보유 "+cur+"계약":""),go:x=>G.ft2(u,m,x)})};
G.ftx=n=>{const p=S.fx[n];if(!p)return;const r=futTrade(p.e,p.u,p.m,-p.q);toast(r||"포지션 청산");render()};
G.ftd=n=>{const p=S.fx[n];if(!p||p.u[0]!=="C"||p.q<=0)return toast("실물 인수는 원자재 매수 포지션만 가능해요");p.dv=p.dv?0:1;toast(p.dv?"만기에 실물로 인수합니다 (전체 대금 필요)":"만기에 현금 정산합니다");render()};
const fpx=(u,x)=>u[0]==="I"?x.toFixed(2):W(x);
const futLab=(u,m)=>{const y=(S.y0||2027)+Math.floor((m-1)/360),mo=Math.floor(((m-1)%360)/30)+1;return y%100+"년 "+mo+"월물"};
function futCurve(u){const s=fsp(u),n=s.mo?6:4,sp=fspot(u),a=[];for(let k=0;k<n;k++){const m=futExp(u,k);a.push([m,futPx(u,m)])}const sl=(a[a.length-1][1]/sp-1)*100;return{a,sp,sl,shape:sl>.4?"콘탱고 (먼 달이 비쌈 — 정상)":sl<-.4?"백워데이션 (먼 달이 쌈 — 시장은 하락을 예상)":"평평함"}}

// ===== options: chain, buying any size, early exercise into shares, writing (covered / naked) =====
const ivOf=c=>c.vol*9;
const optV=(c,t,k,days)=>bs(c.p,k,Math.max(1,days)/360,ivOf(c),S.prime/100,t==="C");
G.opt2=(i,t,d,mny,pct)=>{const c=S.co[i];if(c.dead||c.priv)return;pct=Math.min(10,Math.max(.5,pct||1));if(S.op.length>=30)return toast("보유 옵션은 30건까지예요");const nsh=c.sh*pct/100,k=c.p*mny,pr=nsh*optV(c,t,k,d)/1e4*1.05*1.01;
if(!ePay("P",pr))return toast("프리미엄이 부족합니다: "+F(pr));S.op.push({i,t,k,nsh,exp:S.day+d,pr});rec(t==="C"?"콜옵션 매수":"풋옵션 매수",c,pr,"나");optCp(c,t,pct,k,1);toast(c.tk+" "+(t==="C"?"콜":"풋")+" "+pct+"% 매수 ("+F(pr)+")");render()};
function optCp(c,t,pct,k,buy){const cp=S.co.filter(x=>!x.dead&&!x.priv&&!mine(x)&&(x.kd===2||x.i===3)&&x.cs>20);const x=cp[rnd()*cp.length|0];if(x)eco("🧾 "+x.tk+"가 "+c.tk+" "+(t==="C"?"콜":"풋")+"옵션 "+pct+"%를 "+(buy?"매도(발행)":"매수")+" — 행사가 "+W(k))}
// exercise a call early: pay the strike and receive the shares (a cheap way to build a stake when the call is deep in the money)
G.oex=n=>{const o=S.op[n];if(!o)return;const c=S.co[o.i];if(c.dead)return;const pct=o.nsh/c.sh*100;
if(o.t==="C"){if(c.p<=o.k)return toast("행사가가 주가보다 높아 행사하면 손해예요");if(c.priv)return toast("비상장 회사입니다");if(pub(c)-c.sp-1<pct)return toast("시장에 넘겨받을 주식이 부족합니다");const cost=o.k*o.nsh/1e4;
if(!ePay("P",cost))return toast("행사 대금이 부족합니다: "+F(cost));const was=c.ctl;setOwn(c,"P",(c.own.P||0)+pct);c.bs.P=(c.bs.P||0)+cost+o.pr;S.op.splice(n,1);S.fl.op=1;rec("콜옵션 행사",c,cost,"나");L("📜 "+c.tk+" 콜옵션 행사: 행사가 "+W(o.k)+"에 지분 "+pct.toFixed(2)+"% 인수 (시가 대비 "+P1((o.k/c.p-1)*100)+")",1);afterCtl(c,was)}
else{const v=Math.max(0,o.k-c.p)*o.nsh/1e4;if(v<=0)return toast("행사 가치가 없습니다");S.cash+=v;S.op.splice(n,1);S.fl.op=1;L(c.tk+" 풋옵션 조기 행사 +"+F(v),1)}render()};
G.otk=(i,side)=>{const c=S.co[i];if(c.dead||c.priv)return;OT={i,side,t:"C",d:90,m:1,p:1,cov:side==="w"?1:0};otMd()};
let OT=null;
function otMd(){const o=OT,c=S.co[o.i],k=c.p*o.m,nsh=c.sh*o.p/100,v=nsh*optV(c,o.t,k,o.d)/1e4,w=o.side==="w",prem=w?v*.95*.99:v*1.05*1.01,N=c.p*nsh/1e4,otm=Math.max(0,o.t==="C"?k-c.p:c.p-k)*nsh/1e4,mg=w&&!(o.cov&&o.t==="C")?v+Math.max(.2*N-otm,.1*N):0,cv=covFree(c);
const chip=(lab,key,vals,fmt)=>`<div class="mu" style="margin-top:8px">${lab}</div><div class="ch">`+vals.map(x=>B(fmt(x),`OT.${key}=${typeof x==="string"?"'"+x+"'":x};otMd()`,o[key]===x?"on":"")).join("")+`</div>`;
openMd({t:c.tk+(w?" 옵션 쓰기(매도)":" 옵션 매수"),b:w?"옵션을 팔고 프리미엄을 받습니다. 만기에 상대가 행사하면 의무를 집니다. 커버드 콜은 가진 주식으로 보증해서 증거금이 필요 없어요.":"정한 가격(행사가)에 사거나 팔 권리를 삽니다. 손실은 프리미엄까지만.",
h:chip("종류","t",["C","P"],x=>x==="C"?"콜 (오를 때 이익)":"풋 (내릴 때 이익)")+chip("만기","d",[30,60,90,180,360],x=>x+"일")+chip("행사가 (지금 주가 대비)","m",[.8,.9,1,1.1,1.2,1.3],x=>Math.round(x*100)+"%")+chip("규모 (발행 주식 대비)","p",[.5,1,2,5,10],x=>x+"%")+
(w&&o.t==="C"?chip("담보","cov",[1,0],x=>x?"커버드 (내 주식 담보)":"네이키드 (증거금)"):"")+
`<div class="card" style="margin-top:10px"><div class="g"><span>행사가</span><span>${W(k)}</span><span>${w?"받는 프리미엄":"내는 프리미엄"}</span><span>${F(prem)}</span><span>1%당 비용</span><span>${F(v/o.p)}</span><span>손익분기 주가</span><span>${W(o.t==="C"?k+v*1e4/nsh:k-v*1e4/nsh)}</span>${w?`<span>증거금</span><span>${o.cov&&o.t==="C"?"없음 (커버드)":F(mg)}</span>`:""}</div>${w&&o.cov&&o.t==="C"?`<div class="mu" style="margin-top:6px">담보로 쓸 수 있는 내 직접 지분 ${cv.toFixed(2)}%</div>`:""}</div>`,
o:[["취소","n"],[w?"쓰기":"매수","y"]]});mcb=()=>{const z=OT;if(z.side==="w")G.owr(z.i,z.t,z.d,z.m,z.p,z.t==="C"&&z.cov);else G.opt2(z.i,z.t,z.d,z.m,z.p)}}
const covFree=c=>Math.max(0,(c.own.P||0)-S.ow.filter(o=>o.i===c.id&&o.cov).reduce((a,o)=>a+o.nsh/c.sh*100,0));
G.owr=(i,t,d,mny,pct,cov)=>{const c=S.co[i];if(c.dead||c.priv)return;pct=Math.min(10,Math.max(.5,pct));if(S.ow.length>=20)return toast("쓴 옵션은 20건까지예요");if(mine(c)&&!(cov&&t==="C"))return toast("내가 지배하는 회사에는 커버드 콜만 쓸 수 있어요 (원작 규칙)");
const nsh=c.sh*pct/100,k=c.p*mny,v=nsh*optV(c,t,k,d)/1e4,prem=v*.95*.99,N=c.p*nsh/1e4,otm=Math.max(0,t==="C"?k-c.p:c.p-k)*nsh/1e4;
if(cov&&covFree(c)<pct-1e-9)return toast("커버드 콜을 쓸 직접 지분이 부족합니다 ("+covFree(c).toFixed(2)+"%)");const mg=cov?0:v+Math.max(.2*N-otm,.1*N);
if(!cov&&nw()<(S.ow.filter(o=>!o.cov).reduce((a,o)=>a+owL(o),0)+v)*.5)return toast("순자산이 네이키드 옵션 위험의 50%를 넘어야 해요 (원작 규칙)");
S.cash+=prem;if(mg&&!ePay("P",mg)){S.cash-=prem;return toast("증거금 부족: 필요 "+F(mg))}S.ow.push({i,t,k,nsh,exp:S.day+d,pr:prem,cov:cov?1:0,mg});rec(t==="C"?"콜옵션 쓰기":"풋옵션 쓰기",c,prem,"나");optCp(c,t,pct,k,0);
toast(c.tk+" "+(t==="C"?"콜":"풋")+" "+pct+"% 쓰기 · 프리미엄 "+F(prem)+" 수령");render()};
const owL=o=>{const c=S.co[o.i];return c.dead?0:o.nsh*optV(c,o.t,o.k,o.exp-S.day)/1e4};
G.owx=n=>{const o=S.ow[n];if(!o)return;const L0=owL(o)*1.03;S.cash+=o.mg;if(!ePay("P",L0)){S.cash-=o.mg;return toast("되사는 데 "+F(L0)+"이 필요합니다")}S.ow.splice(n,1);toast("옵션을 되사서 의무를 없앴습니다 ("+F(L0)+")");render()};
// daily: margin maintenance for naked options, expiry and assignment
function optDay(){if(!S.ow.length)return;S.ow=S.ow.filter(o=>{const c=S.co[o.i];if(c.dead)return false;const pct=o.nsh/c.sh*100;
if(o.exp<=S.day){const it=Math.max(0,o.t==="C"?c.p-o.k:o.k-c.p)*o.nsh/1e4;S.cash+=o.mg;
if(it<=0){L("⌛ 쓴 옵션 "+c.tk+" "+(o.t==="C"?"콜":"풋")+" 만기 소멸 — 프리미엄 "+F(o.pr)+" 확정",1);S.fl.op=1;return false}
if(o.t==="C"&&o.cov&&(c.own.P||0)>=pct-1e-9&&!c.priv){const net=sellK(c,"P",pct,o.k*c.sh/100/1e4);ctlAll();L("📜 커버드 콜 행사됨: "+c.tk+" 지분 "+pct.toFixed(2)+"%를 행사가 "+W(o.k)+"에 넘김 ("+F(net)+")",1);return false}
if(o.t==="P"&&!c.priv&&pub(c)-c.sp-1>=pct){const cost=o.k*o.nsh/1e4;if(ePay("P",cost)){const was=c.ctl;setOwn(c,"P",(c.own.P||0)+pct);c.bs.P=(c.bs.P||0)+cost-o.pr;L("📜 풋옵션 행사됨: "+c.tk+" 지분 "+pct.toFixed(2)+"%를 행사가 "+W(o.k)+"에 인수 ("+F(cost)+")",1);afterCtl(c,was);return false}}
S.cash-=it;if(S.cash<0){S.loan-=S.cash;S.cash=0}L("📜 쓴 옵션 "+c.tk+" 행사됨: 차액 "+F(it)+" 지급",1);return false}
if(!o.cov){const N=c.p*o.nsh/1e4,otm=Math.max(0,o.t==="C"?o.k-c.p:c.p-o.k)*o.nsh/1e4,req=owL(o)+Math.max(.2*N-otm,.1*N);if(o.mg<req){const d=req-o.mg;if(ePay("P",d)){o.mg+=d}else{const L0=owL(o)*1.03;S.cash+=o.mg-L0;if(S.cash<0){S.loan-=S.cash;S.cash=0}S.cst.fl++;L("⚠ "+c.tk+" 네이키드 옵션 증거금 부족 → 강제 환매 ("+F(L0)+")",1);return false}}}
return true})}
const owVal=()=>S.ow.reduce((a,o)=>a+o.mg-owL(o),0);

// ===== interest rate swaps =====
const SWT={P:["기준금리","prime"],S:["단기 국채","yS"],L:["장기 국채","yL"]};
const swRate=t=>t==="P"?S.prime:t==="S"?S.yS:S.yL;
function swMid(t,q){const y=q/4,r=swRate(t);return t==="L"?r:r+(S.yL-S.yS)*Math.min(1,y/10)*.6}
function swCp(e){const fin=c=>c.kd===1||c.kd===2||c.i===3;return S.co.filter(c=>!c.dead&&fin(c)&&rating(c)<=3&&(e==="P"?!mine(c):root("c"+c.id)!==root("c"+e))&&c.cs>5).sort((a,b)=>b.A-a.A)[0]}
function swQuote(e,t,dir,q){const ec=e==="P"?null:S.co[e],h=(ec&&(ec.kd||ec.i===3)?.5:1)*(.5+hsh(S.day,q,t.charCodeAt(0))*1),mid=swMid(t,q);return{mid,h,K:+(mid-dir*h).toFixed(2)}}
let SWO=null;
G.swOpen=()=>{const e=teOK();SWO={e,t:"P",dir:1,q:8,N:Math.max(10,Math.round(Math.min(swRoom(e),100)))};swMd()};
const swRoom=e=>Math.max(0,(e==="P"?nw():Math.max(0,eq(S.co[e])))*10-S.irs.filter(x=>x.e===e).reduce((a,x)=>a+x.N,0));
function swMd(){const o=SWO,cp=swCp(o.e),qt=swQuote(o.e,o.t,o.dir,o.q),room=swRoom(o.e),chip=(lab,key,vals,fmt)=>`<div class="mu" style="margin-top:8px">${lab}</div><div class="ch">`+vals.map(x=>B(fmt(x),`SWO.${key}=${typeof x==="string"?"'"+x+"'":x};swMd()`,o[key]===x?"on":"")).join("")+`</div>`;
openMd({t:"금리 스왑 ("+eName(o.e)+" 명의)",b:"고정금리와 변동금리를 서로 바꿔 내는 계약이에요. 원금은 오가지 않고, 분기마다 금리 차이만 정산합니다. '고정 받기'는 금리가 내릴 때, '고정 내기'는 오를 때 이익이에요.",
h:chip("변동금리 기준","t",["P","S","L"],x=>SWT[x][0]+" "+swRate(x).toFixed(2)+"%")+chip("방향","dir",[1,-1],x=>x>0?"고정 받기 (금리 하락 베팅)":"고정 내기 (금리 상승 베팅)")+chip("기간","q",[4,8,12,20],x=>x/4+"년")+chip("명목 원금","N",[50,100,300,1000,3000].filter(v=>v<=room||v===50),x=>F(x))+
`<div class="card" style="margin-top:10px"><div class="g"><span>상대방</span><span>${cp?esc(cp.tk)+" ("+RT[rating(cp)]+")":"없음"}</span><span>시장 중간값</span><span>${qt.mid.toFixed(2)}%</span><span>제시 고정금리</span><span>${qt.K.toFixed(2)}% <span class="mu">(마진 ${qt.h.toFixed(2)}%p)</span></span><span>분기 정산 예시</span><span>${F(o.N*(qt.K-swRate(o.t))/400*o.dir)}</span><span>한도 (순자산 10배)</span><span>${F(room)}</span></div><div class="mu" style="margin-top:6px">상대방은 반대쪽 손익을 자기 실적에 반영합니다. 스왑은 장부 밖(각주)에만 나와요.</div></div>`,o:[["취소","n"],["계약","y"]]});
mcb=()=>{const z=SWO,cp2=swCp(z.e),q2=swQuote(z.e,z.t,z.dir,z.q);if(!cp2)return toast("스왑을 받아 줄 금융회사가 없습니다");if(z.N>swRoom(z.e)+1e-9)return toast("명목 원금 한도를 넘습니다");if(!ePay(z.e,z.N*.0005))return toast("수수료가 부족합니다");
S.irs.push({e:z.e,cp:cp2.id,N:z.N,t:z.t,K:q2.K,dir:z.dir,st:S.day,en:S.day+z.q*90,lp:0,tp:0});rec("금리 스왑",{tk:SWT[z.t][0]},z.N,eName(z.e));L("🔁 "+eName(z.e)+" 금리 스왑 체결: "+F(z.N)+" "+(z.dir>0?"고정 "+q2.K.toFixed(2)+"% 받고 "+SWT[z.t][0]+" 지급":"고정 "+q2.K.toFixed(2)+"% 내고 "+SWT[z.t][0]+" 수취")+" · "+z.q/4+"년 · 상대 "+cp2.tk,1)}}
function swQ(){if(!S.irs.length)return;S.irs=S.irs.filter(x=>{const cp=S.co[x.cp];if(!cp||cp.dead){L("💥 스왑 상대방 "+(cp?cp.tk:"")+" 파산 — 스왑이 종료됐습니다",x.e==="P"||mine(S.co[x.e]));return false}
const fl=swRate(x.t),net=x.N*(x.K-fl)/400*x.dir;x.lp=net;x.tp+=net;if(x.e==="P"){S.cash+=net;if(S.cash<0){S.loan-=S.cash;S.cash=0}}else{const c=S.co[x.e];if(!c||c.dead)return false;c.cs+=net;c.swq=(c.swq||0)+net;if(c.cs<0){c.D-=c.cs;c.cs=0}}
cp.cs-=net;cp.swq=(cp.swq||0)-net;if(cp.cs<0){cp.D-=cp.cs;cp.cs=0}if(Math.abs(net)>Math.max(2,mc(cp)*.003))eco("🔁 "+cp.tk+" 금리 스왑에서 "+(net<0?"이익 ":"손실 ")+F(Math.abs(net))+" ("+qn()+"분기)");
if(x.e==="P"||mine(S.co[x.e]))L("🔁 스왑 정산 "+(net>=0?"+":"")+F(net)+" ("+SWT[x.t][0]+" "+fl.toFixed(2)+"% vs 고정 "+x.K.toFixed(2)+"%)");return S.day<x.en})}
const swFee=x=>{const fl=swRate(x.t),un=Math.max(0,-x.dir*(x.K-fl))*x.N/400,ql=Math.max(0,(x.en-S.day)/90);return Math.max(.005*x.N,2*un)+(ql>4?x.N*(.01+.005*Math.min(4,ql/4)):0)};
const swMtm=x=>{const ql=Math.max(0,(x.en-S.day)/90);return x.dir*x.N*(x.K-swMid(x.t,ql))/400*ql};
G.swEnd=n=>{const x=S.irs[n];if(!x)return;const f=swFee(x);ask("스왑 조기 종료","해지 수수료 "+F(f)+"를 내고 남은 "+Math.max(0,Math.round((x.en-S.day)/90))+"분기를 없앱니다.","종료",()=>{if(!ePay(x.e,f))return toast("수수료가 부족합니다");S.irs.splice(S.irs.indexOf(x),1);L("🔁 금리 스왑 조기 종료 (수수료 "+F(f)+")",1);render()})};

// ===== ETFs =====
const ETFD=[["KALL","WSR 종합 ETF","ix","ALL",1,.1],["K50","대형 50 ETF","ix","L50",1,.1],["KSML","중소형 ETF","ix","SML",1,.2],...GRP.map((g,k)=>["G"+g[0],g[1]+" 섹터 ETF","ix","G"+k,1,.3]),
["BULL","종합 3배 레버리지","ix","ALL",3,.9],["BEAR","종합 -3배 인버스","ix","ALL",-3,.9],["GOVB","장기 국채 ETF","bond","",1,.15],["CMOD","원자재 바스켓 ETF","cmd","",1,.5],["CRYP","코인 지수 ETF","coin","",1,1],
["DIVD","고배당 ETF","fac","div",1,.3],["VALU","가치주 ETF","fac","val",1,.3],["MOMO","모멘텀 ETF","fac","mom",1,.4]];
function etfInit(){const br=S.co.filter(c=>c.i===3&&!c.dead&&!c.priv);S.etf=ETFD.map(([k,n,ty,src,Lv,fee],j)=>{const e={k,n,ty,src,L:Lv,fee,nav:1e4,p:1e4,pc:1e4,mgr:br.length?br[j%br.length].id:-1,af:{KALL:.02,K50:.015,KSML:.006,BULL:.002,BEAR:.001,GOVB:.004,CMOD:.002,CRYP:.004}[k]||.003,fl:.6+rnd()*.8,aum:0,h:0,b:0,hr:new Array(DH).fill(0),hn:0,v:Math.abs(Lv)*.01,w:[],qf:0};return e});
for(const e of S.etf){if(e.ty==="fac")etfReb(e);if(e.ty==="ix"&&S.IX[e.src]){const o=S.IX[e.src],a=ringGet(o.lv,o.hn,DH);let nav=1e4;for(let j=1;j<a.length;j++){const r=Math.log(1+e.L*(a[j]/a[j-1]-1));e.hr[e.hn%DH]=Math.round(r*RU);e.hn++;nav*=Math.exp(r)}}}}
function etfReb(e){const a=S.co.filter(c=>!c.dead&&!c.priv&&mc(c)>300);let s;if(e.src==="div")s=a.filter(c=>c.ni>0).sort((x,y)=>dyv(y)-dyv(x));else if(e.src==="val")s=a.filter(c=>epsT(c)>0).sort((x,y)=>x.p/epsT(x)-y.p/epsT(y));else s=a.filter(c=>c.hn>120).sort((x,y)=>(y.p/closeAgo(y,120))-(x.p/closeAgo(x,120)));e.w=s.slice(0,30).map(c=>c.id)}
function etfRet(e){if(e.ty==="ix"){const o=S.IX[e.src];if(!o||o.hn<2)return 0;return o.lv[(o.hn-1)%DH]/o.lv[(o.hn-2)%DH]-1}
if(e.ty==="bond")return(S.bp/(S.bp0||S.bp)-1)+S.yL/36000;if(e.ty==="cmd"){let s=0;for(const m of S.cm.slice(0,5))s+=m.hn?m.hr[(m.hn-1)%DH]/RU:0;return Math.exp(s/5)-1}
if(e.ty==="coin"){const a=(S.cx||[]).filter(x=>!x.dead&&x.cat!=="stable").sort((x,y)=>cxCap(y)-cxCap(x)).slice(0,10);let s=0,w=0;for(const x of a){const c=cxCap(x);s+=c*(x.r1||0);w+=c}return w?s/w:0}
let s=0,n=0;for(const id of e.w){const c=S.co[id];if(c&&!c.dead&&!c.priv){s+=c.c1||0;n++}}return n?s/n:0}
function etfDay(){if(!S.etf)return;let mT=0;for(const c of S.co)if(!c.dead&&!c.priv)mT+=mc(c);const cT=(S.cx||[]).reduce((s,x)=>s+(x.dead?0:cxCap(x)),0);
for(const e of S.etf){const r=etfRet(e),g=Math.max(-.95,e.L*r)-e.fee/100/360;e.nav*=1+g;const m60=ret1(e,60);e.fl=Math.max(.4,Math.min(2.5,(e.fl||1)*Math.exp(.0015*Math.sign(m60)+.004*gz())));e.aum=Math.max(20,(e.af||.003)*(e.ty==="coin"?Math.min(cT,mT*.25):mT)*e.fl);
if(e.nav<500){e.nav*=20;e.h/=20;e.pc*=20;eco("🧮 "+e.k+" "+e.n+" 20:1 병합 — 순자산가치가 너무 낮아져 다시 시작합니다");if(e.h)L("🧮 보유 중인 "+e.k+" ETF가 20:1 병합됐어요 (가치는 그대로)",1)}
const p0=e.p;e.p=e.nav*(1+.0008*gz());const lr=Math.log(e.p/(e.pc||p0));e.hr[e.hn%DH]=Math.round(lr*RU);e.hn++;e.pc=e.p;e.r1=Math.exp(lr)-1;e.v=e.v*.97+Math.abs(lr)*.03*1.25}S.bp0=S.bp}
function etfQ(){if(!S.etf)return;for(const e of S.etf){if(e.ty==="fac")etfReb(e);let m=S.co[e.mgr];if(!m||m.dead){const br=S.co.filter(c=>c.i===3&&!c.dead);m=br[rnd()*br.length|0];e.mgr=m?m.id:-1}if(m){const inc=(e.aum+etfHv(e))*e.fee/100/4;m.etfq=(m.etfq||0)+inc}}}
const etfHv=e=>e.h*e.p/1e8,etfV=()=>(S.etf||[]).reduce((a,e)=>a+etfHv(e),0);
G.etfB=(k,x)=>{const e=S.etf.find(z=>z.k===k);if(!e)return;if(!ePay("P",x*1.0005))return toast("자금 부족");e.h+=x*1e8/e.p;e.b+=x*1.0005;rec("ETF 매수",{tk:e.k},x,"나");toast(e.k+" "+F(x)+" 매수");render()};
G.etfS=(k,f)=>{const e=S.etf.find(z=>z.k===k);if(!e||e.h<=0)return toast("보유 수량이 없습니다");const u=e.h*f,x=u*e.p/1e8*.9995,b=e.b*f,g=x-b,t=g>0?g*.22:0;S.cash+=x-t;e.h-=u;e.b-=b;if(e.h<1e-9){e.h=0;e.b=0}rec("ETF 매도",{tk:e.k},x,"나");toast(e.k+" 매도 "+F(x-t));render()};
G.etfQ=k=>{const e=S.etf.find(z=>z.k===k);numModal({t:e.k+" 매수",b:e.n+" · 지금 가격 "+W(e.p)+" · 보수 연 "+e.fee+"%"+(e.L!==1?" · 매일 "+e.L+"배를 맞추는 상품이라 오래 들고 있으면 지수와 크게 달라질 수 있어요":""),min:1,max:Math.max(1,Math.floor(eAvail("P"))),step:1,val:Math.min(50,Math.max(1,Math.floor(eAvail("P")))),u:"억",chips:[10,50,100,500].filter(v=>v<=eAvail("P")),cf:x=>x+"억",ok:"매수",pv:x=>"가용 "+F(eAvail("P")),go:x=>G.etfB(k,x)})};
// buy an ETF management contract for a broker you control (W$R: about 10x the yearly fee)
G.etfMgr=k=>{const e=S.etf.find(z=>z.k===k),t=teOK();if(t==="P"||S.co[t].i!==3)return toast("거래 주체를 내가 지배하는 증권사로 바꾸세요");if(e.mgr===t)return toast("이미 운용 중입니다");const fee=(e.aum+etfHv(e))*e.fee/100,cost=fee*10,old=S.co[e.mgr];
ask(e.k+" 운용권 인수",esc(S.co[t].tk)+"가 "+(old?esc(old.tk):"기존 운용사")+"에서 운용권을 "+F(cost)+"(연 보수 "+F(fee)+"의 10배)에 삽니다. 이후 보수 수입이 "+esc(S.co[t].tk)+"의 이익이 됩니다.","인수",()=>{if(!ePay(t,cost))return toast("자금 부족: 필요 "+F(cost));if(old&&!old.dead)old.cs+=cost;e.mgr=t;L("🧮 "+S.co[t].tk+"가 "+e.k+" ETF 운용권 인수 ("+F(cost)+")",1);render()})};

// ===== settle every v12 instrument on a company that is leaving the market (buyout at price multiple m, merger, death) =====
function settleNew(c,m){const px=c.p*m;
S.ow=S.ow.filter(o=>{if(o.i!==c.id)return true;const it=Math.max(0,o.t==="C"?px-o.k:o.k-px)*o.nsh/1e4;S.cash+=o.mg-it;if(S.cash<0){S.loan-=S.cash;S.cash=0}L("📜 "+c.tk+" 상장 폐지·인수로 쓴 옵션 정산: "+F(-it),1);return false});
for(const p of S.fx)if(p.u==="S:"+c.id){const s=fsp(p.u);p.mg+=p.q*s.mult*(px-p.px);p.px=px;p.m=S.day}if(S.fx.some(p=>p.u==="S:"+c.id))futDay();
S.eo=(S.eo||[]).filter(o=>{if(o.i!==c.id)return true;const v=S.day>=o.v?Math.max(0,px-o.k)*c.sh*o.pct/100/1e4:0;if(v>0){S.cash+=v*.6;L("💼 "+c.tk+" 인수로 스톡옵션 현금 정산 세후 "+F(v*.6),1)}return false})}

// ---- v12 crypto: an ecosystem of coins that are born, boom, bust and die; spot trading; perpetual futures with 1~100x leverage ----
// category: [name, beta to BTC, daily vol, yearly rug-pull odds for new coins, notes]
const CXC={store:["가치저장",1,.032,0,"공급이 정해져 있어 '디지털 금'으로 불려요. 반감기(4년마다 채굴 보상 절반)를 앞뒤로 큰 상승장이 오곤 했어요."],
plat:["플랫폼",1.15,.045,.03,"다른 앱이 올라가는 블록체인. 생태계가 커지면 수요가 늘어요."],stable:["스테이블코인",0,.0006,0,"1달러에 고정되도록 설계된 코인. 가끔 고정이 깨지는 '디페그'가 일어나요."],
exch:["거래소 토큰",.9,.04,0,"코인 거래소가 발행한 토큰. 거래소가 무너지면 같이 무너집니다."],defi:["디파이",1.3,.06,.12,"은행 없이 대출·교환을 하는 프로그램. 해킹 위험이 커요."],
meme:["밈",1.5,.085,.3,"쓸모보다 유행으로 움직이는 코인. 폭등도 폭락도 가장 커요."],ai:["AI",1.35,.07,.08,"AI 붐과 함께 움직이는 테마 코인."],game:["게임·메타버스",1.3,.07,.1,"게임 아이템·땅을 거래하는 코인. 유행을 탑니다."],
priv:["프라이버시",.8,.045,0,"거래 추적이 어려운 코인. 규제로 거래소에서 퇴출되기도 해요."],pay:["결제·송금",1,.05,.02,"빠른 송금을 내세운 코인. 소송·규제 이슈가 잦아요."]};
// [ticker, name, category, price 원, market cap 억]
const CX0=[["BTC","비트코인","store",1.2e8,3e5],["ETH","이더리움","plat",5e6,8e4],["SOLN","솔라노","plat",2.5e5,15000],["ADAX","카르다노","plat",1000,4000],["AVLN","아발란시","plat",4e4,3000],
["USDX","테다 달러","stable",1350,2e4],["DAYX","데이 스테이블","stable",1350,3000],["BNBX","바이낸 코인","exch",8e5,12000],["HUOT","후오 토큰","exch",3000,1500],["LINQ","체인링크스","defi",2e4,2500],["UNSW","유니스왑프","defi",1e4,1500],["AAVX","아베 렌딩","defi",1.5e5,1200],
["DOGI","도지","meme",200,3000],["SHBX","시바견","meme",30,1000],["PEPU","페페","meme",15,800],["FETX","페치 AI","ai",2000,800],["RNDX","렌더넷","ai",1e4,700],["AXIX","엑시 월드","game",1e4,300],["SNDX","샌드박스 랜드","game",600,400],
["XMRX","모네라","priv",2.5e5,1200],["XRPP","리플넷","pay",800,30000],["LTCX","라이트코인","pay",1.2e5,900],["XLMX","스텔라넷","pay",400,600]];
const CXN={meme:[["DOGE","PEPE","FROG","CAT","INU","MOON","BONK","WOJK","TRMP","KEKK"],["도지","개구리","고양이","문","봉크","와작","케케","펭귄","하마","오리"]],ai:[["AGNT","NRAL","CRTX","SYNP","MIND"],["에이전트","뉴럴","코텍스","시냅스","마인드"]],
defi:[["SWAP","LEND","YILD","VLTX","FLSH"],["스왑","렌드","일드","볼트","플래시"]],game:[["QUST","ARNA","PIXL","GILD","MECH"],["퀘스트","아레나","픽셀","길드","메카"]],plat:[["CHNX","LAYR","PROT","NETW","ZKPX"],["체인","레이어","프로토","넷웍","제트케이"]],pay:[["PAYX","SEND","RMIT"],["페이","센드","리밋"]],exch:[["EXTK","TRDX"],["엑스체인지","트레이드"]]};
function cxMk(k,n,cat,p,cap){const z=CXC[cat];return{k,n,cat,p,sup:cap*1e8/p,hy:cat==="meme"||cat==="ai"?.5:.25,born:S.day,dead:0,hr:new Array(DH).fill(0),hn:0,pc:p,h:0,b:0,jx:0,v:z[2],be:z[1],rug:0,ath:p,r1:0,lst:1,pg:cat==="stable"?1:0}}
function cxInit(){S.cx=CX0.map(a=>cxMk(...a));S.hv0=-(rnd()*1200|0);S.cxm={};S.cxl=[];S.cxs={b:0,d:0};
const B=S.cx[0],E=S.cx[1],bm=S.cm.find(m=>m.k==="BTC"),em=S.cm.find(m=>m.k==="ETH");if(bm){B.p=bm.p;B.h=bm.h;B.b=bm.b;bm.h=0;bm.b=0;B.ath=B.p}if(em){E.p=em.p;E.h=em.h;E.b=em.b;em.h=0;em.b=0;E.ath=E.p}
for(const x of S.cx){if(bm&&bm.hn&&(x.k==="BTC"||x.k==="ETH")){const m=x.k==="BTC"?bm:em;for(let t=0;t<DH;t++)x.hr[t]=m.hr[t];x.hn=m.hn}else{for(let t=0;t<DH;t++){const rb=bm&&bm.hn?bm.hr[t%DH]/RU:0;x.hr[t]=Math.round((x.cat==="stable"?.0004*gz():x.be*rb+x.v*.75*gz())*RU)}x.hn=DH}x.pc=x.p}}
const cxCap=x=>x.p*x.sup/1e8;
const cxAlive=()=>(S.cx||[]).filter(x=>!x.dead);
function cxPhase(){const ph=(((S.day-(S.hv0||0))%1440)+1440)%1440/1440;return{ph,lab:ph<.08?"반감기 직후":ph<.42?"강세 국면":ph<.7?"크립토 겨울":"반감기 대기",next:Math.round((1-ph)*1440)}}
function cxLog(t,imp){(S.cxl=S.cxl||[]).unshift("["+ds()+"] "+t);if(S.cxl.length>40)S.cxl.length=40;eco(t);if(imp)L(t,1)}
function cxShock(cat,f,why){for(const x of cxAlive()){if(cat&&x.cat!==cat)continue;if(x.cat==="stable"&&!cat)continue;x.jx+=Math.log(Math.max(.01,1+f));if(f<-.9&&x.k!=="BTC"&&x.k!=="ETH"){x.dead={d:S.day,why};cxLog("🪦 "+x.k+" "+x.n+" — "+why,x.h>0||S.pp.some(p=>p.k===x.k))}}}
function cxBorn(bull,mania){const al=cxAlive();if(al.length>=26)return;const W={meme:4*(1+(mania.meme||0)*2),ai:2*(1+(mania.ai||0)*2),defi:1.5,game:1.2*(1+(mania.game||0)),plat:.8,pay:.4,exch:.3};let t=0;for(const k in W)t+=W[k];let r=rnd()*t,cat="meme";for(const k in W){r-=W[k];if(r<=0){cat=k;break}}
const nm=CXN[cat]||CXN.meme,used=new Set(S.cx.map(x=>x.k));let k,n;for(let j=0;j<30;j++){k=nm[0][rnd()*nm[0].length|0];n=nm[1][rnd()*nm[1].length|0]+" "+["코인","토큰","프로토콜","네트워크","월드"][rnd()*5|0];if(j>5)k=k.slice(0,3)+"ABCDEFGHJKLMNPRSTUVWXYZ"[rnd()*23|0];if(!used.has(k))break}if(used.has(k))return;
const cap=Math.round(30+rnd()*(bull?900:300)),p=[5,30,200,1500,9000,40000][rnd()*6|0]*(.6+rnd()*.8),x=cxMk(k,n,cat,p,cap);x.v=CXC[cat][2]*(1.3+rnd()*.6);x.hy=.6+rnd()*.4;x.rug=CXC[cat][3]*(.5+rnd());x.lst=rnd()<.3?1:0;x.pc=p;
for(let t=0;t<DH;t++)x.hr[t]=0;x.hn=0;S.cx.push(x);S.cxs.b++;cxLog("🪙 신규 코인 상장: "+k+" "+n+" ("+CXC[cat][0]+") 시총 "+F(cxCap(x))+(bull?" — 강세장에 새 코인이 쏟아집니다":""))}
// daily: BTC factor (halving cycle, mood, stocks), category manias, coin noise, events; mirrors BTC/ETH into the commodity board
function cxTick(){if(!S.cx)cxInit();const B=S.cx.find(x=>x.k==="BTC"),ph=cxPhase().ph,cyc=ph>.06&&ph<.42?.0014:ph>.45&&ph<.7?-.0016:0,wint=(S.cxw||0)>S.day?-.0012:0,tr=Math.log(B.p/(1.2e8*Math.exp(.12*S.day/360)));
const rB=cyc+wint+S.mood*.002+.35*(S.mk.r||0)+.0001-.0009*tr+.03*gzt();const ma=B.hn>200?ringGet(B.hr,B.hn,200).reduce((a,q)=>a+q,0)/RU:0,bull=ma<.3&&cyc>=0&&S.mood>-.1?1:0;
const man=S.cxm=S.cxm||{};for(const c of ["meme","ai","game"]){const m=man[c]||0;if(m>0){man[c]=m-1/(40+rnd()*50);if(man[c]<=0){man[c]=0;cxLog("💨 "+CXC[c][0]+" 코인 광풍이 꺼졌습니다 — 급락 주의");for(const x of cxAlive())if(x.cat===c){x.jx-=.25;x.hy*=.4}}}
else if(rnd()<(bull?.004:.0012)*(c==="ai"&&S.mx&&S.mx.id==="ai"?4:1)){man[c]=1;cxLog("🚀 "+CXC[c][0]+" 코인 광풍 시작!");for(const x of cxAlive())if(x.cat===c)x.hy=Math.min(1,x.hy+.4)}}
const cf={};for(const c in CXC)cf[c]=(c==="stable"?0:.01*gz())+((man[c]||0)>0?.012*(man[c]):0);const fx=S.fxd||0;
for(const x of S.cx){if(x.dead){if(x.dead.d<S.day-120&&!x.h)x.gone=1;continue}const p0=x.p;let r;
if(x.cat==="stable"){if(x.pg)r=Math.log(S.fxr/x.p)+.0003*gz();else{r=.04*Math.log(S.fxr/x.p)+.004*gz();if(Math.abs(x.p/S.fxr-1)<.01){x.pg=1;cxLog("🔗 "+x.k+" 1달러 고정 회복")}else if(x.dz&&S.day>=x.dz&&x.p<S.fxr*.8){x.dead={d:S.day,why:"디페그 붕괴"};cxLog("🪦 "+x.k+" 디페그 끝에 붕괴",x.h>0)}}}
else{const cp=cxCap(x),sz=x.k==="BTC"?0:cp>3e4?.45:cp>3000?.75:cp>300?1:1.25;r=x.be*rB+cf[x.cat]+x.v*sz*gzt()+(x.hy-.35)*.0012-(x.born>S.day-60&&x.hy>.7?.003:0)}
r+=x.jx;x.jx=0;x.p=Math.max(x.p*.0005,x.p*Math.exp(Math.max(-2.5,Math.min(1.5,r))));x.hy=Math.max(0,Math.min(1,x.hy*.995+.0015+.004*gz()+(r>.15?.08:0)));const core=x.k==="BTC"||x.k==="ETH";
// events
const u=core?1:rnd();if(x.rug&&u<x.rug/360){x.p*=.03;x.dead={d:S.day,why:"러그풀 (개발자 먹튀)"};cxLog("🪦 "+x.k+" 러그풀! 개발팀이 자금을 들고 사라졌습니다 (-97%)",x.h>0)}
else if((x.cat==="defi"||x.cat==="exch"||x.cat==="game")&&u<.0004+x.rug/720){const f=.35+rnd()*.35;x.p*=1-f;cxLog("🏴 "+x.k+" 해킹 피해 — "+(f*100).toFixed(0)+"% 급락",x.h>0)}
else if(!x.lst&&u<.003){x.lst=1;x.p*=1.3;x.hy=Math.min(1,x.hy+.2);cxLog("📈 "+x.k+" 대형 거래소 상장 +30%")}
else if(x.cat==="priv"&&x.lst&&u<.0004){x.lst=0;x.p*=.6;cxLog("⛔ "+x.k+" 규제로 대형 거래소 퇴출 -40%",x.h>0)}
else if(x.cat==="pay"&&u<.0003){x.p*=.75;cxLog("⚖ "+x.k+" 증권성 소송 제기 -25%")}
else if(x.cat==="stable"&&u<.00025){const f=.06+rnd()*rnd()*.8;x.p*=1-f;x.pg=0;cxLog("💥 "+x.k+" 디페그! 1달러 고정이 깨졌습니다 (-"+(f*100).toFixed(0)+"%)",x.h>0);if(f>.4)x.dz=S.day+40}
x.ath=Math.max(x.ath,x.p);if(!x.dead&&!core&&x.cat!=="stable"&&(cxCap(x)<3||x.p<x.ath*.012)){x.dead={d:S.day,why:cxCap(x)<3?"시총 소멸·상장폐지":"고점 대비 -99% 상장폐지"};cxLog("🪦 "+x.k+" 상장폐지 ("+x.dead.why+")",x.h>0)}
const lr=Math.log(x.p/(x.pc||p0));x.hr[x.hn%DH]=Math.round(lr*RU);x.hn++;x.pc=x.p;x.r1=Math.exp(lr)-1;if(x.dead)S.cxs.d++}
if(S.cx.length>60)S.cx=S.cx.filter(x=>!x.gone||x.h||S.pp.some(p=>p.k===x.k));
if(rnd()<.002+.012*bull+.01*((man.meme||0)+(man.ai||0)))cxBorn(bull,man);
const E=S.cx.find(x=>x.k==="ETH"),bm=S.cm.find(m=>m.k==="BTC"),em=S.cm.find(m=>m.k==="ETH");if(bm&&B)bm.p=B.p;if(em&&E)em.p=E.p;ppDay()}
const cxv=()=>(S.cx||[]).reduce((a,x)=>a+(x.dead?0:x.h*x.p/1e8),0);
// spot trading (fee 0.1%, thin coins move a lot when you trade)
G.cxB=(k,x)=>{const c=S.cx.find(z=>z.k===k);if(!c||c.dead)return;if(!ePay("P",x*1.001))return toast("자금 부족");const imp=Math.min(.6,x/Math.max(1,cxCap(c))*.8);const px=c.p*(1+imp/2);c.h+=x*1e8/px;c.b+=x*1.001;c.p*=1+imp;rec("코인 매수",{tk:c.k},x,"나");toast(c.k+" "+F(x)+" 매수"+(imp>.02?" · 시세 +"+(imp*100).toFixed(1)+"%":""));render()};
G.cxS=(k,f)=>{const c=S.cx.find(z=>z.k===k);if(!c||c.h<=0)return toast("보유 수량이 없습니다");if(c.dead)return toast("상장폐지된 코인은 팔 수 없어요");const u=c.h*f,v=u*c.p/1e8,imp=Math.min(.6,v/Math.max(1,cxCap(c))*.8),x=v*(1-imp/2)*.999,b=c.b*f,g=x-b,t=g>0?g*.22:0;
S.cash+=x-t;c.h-=u;c.b-=b;c.p*=1-imp;if(c.h<1e-12){c.h=0;c.b=0}if(g>0)S.fl.cm=1;rec("코인 매도",{tk:c.k},x,"나");toast(c.k+" 매도 "+F(x-t));render()};
G.cxQ=k=>{const c=S.cx.find(z=>z.k===k);numModal({t:c.k+" "+c.n+" 매수",b:"지금 가격 "+Wc(c.p)+" · 시가총액 "+F(cxCap(c))+". 시총이 작은 코인은 내 주문만으로도 가격이 크게 움직여요.",min:.1,max:Math.max(.1,Math.floor(eAvail("P")*10)/10),step:.1,val:Math.min(10,Math.max(.1,Math.floor(eAvail("P")))),u:"억",chips:[1,5,10,50,100].filter(v=>v<=eAvail("P")),cf:x=>x+"억",ok:"매수",pv:x=>"예상 시세 영향 +"+(Math.min(.6,x/Math.max(1,cxCap(c))*.8)*100).toFixed(2)+"% · 가용 "+F(eAvail("P")),go:x=>G.cxB(k,x)})};
// ===== perpetual futures (crypto only): isolated margin, 1~100x leverage, daily funding, liquidation on the intraday wick =====
const ppMMR=k=>k==="BTC"||k==="ETH"?.005:.01;
const ppLiq=p=>p.q>0?p.en*(1-1/p.lev+ppMMR(p.k)):p.en*(1+1/p.lev-ppMMR(p.k));
const ppEq=p=>{const c=S.cx.find(z=>z.k===p.k);return c?p.mg+p.q*(c.p-p.en)/1e8:0};
const ppVal=()=>(S.pp||[]).reduce((a,p)=>a+Math.max(0,ppEq(p)),0);
function ppFund(c){const r7=c.hn>7?ringGet(c.hr,c.hn,7).reduce((a,q)=>a+q,0)/RU:0;return clamp(-.002,.003,.0001+.0016*(c.hy-.35)+.012*r7)}
G.ppOpen=(k,side,mg,lev)=>{const c=S.cx.find(z=>z.k===k);if(!c||c.dead)return;if(c.cat==="stable")return toast("스테이블코인은 선물이 없어요");lev=Math.max(1,Math.min(100,Math.round(lev)));if(S.pp.length>=12)return toast("코인 선물은 12건까지예요");
const N=mg*lev;if(N>cxCap(c)*.03)return toast("포지션이 너무 큽니다 (시총의 3% 이내)");const fee=N*.0005;if(!ePay("P",mg+fee))return toast("증거금 부족");const q=side*N*1e8/c.p;c.p*=1+side*Math.min(.2,N/Math.max(1,cxCap(c))*.4);
S.pp.push({k,q,en:c.p,lev,mg,fd:0,d:S.day});rec((side>0?"롱 ":"숏 ")+lev+"x",{tk:k},N,"나");L("🎢 "+k+" "+(side>0?"롱":"숏")+" "+lev+"배 진입 · 증거금 "+F(mg)+" · 청산가 "+Wc(ppLiq(S.pp[S.pp.length-1])),1);render()};
G.ppClose=n=>{const p=S.pp[n];if(!p)return;const c=S.cx.find(z=>z.k===p.k),N=Math.abs(p.q)*c.p/1e8,x=Math.max(0,ppEq(p)-N*.0005);c.p*=1-Math.sign(p.q)*Math.min(.2,N/Math.max(1,cxCap(c))*.4);S.cash+=x;const g=x-p.mg;if(g>0){S.fl.cm=1;const t=g*.22;S.cash-=t}S.pp.splice(n,1);L("🎢 "+p.k+" 선물 청산: "+(g>=0?"+":"")+F(g),1);render()};
function ppDay(){if(!S.pp||!S.pp.length)return;S.pp=S.pp.filter(p=>{const c=S.cx.find(z=>z.k===p.k);if(!c||c.dead){S.cst.lq++;L("💥 "+p.k+" 상장폐지 — 선물 포지션 증거금 전액 손실",1);return false}
const f=ppFund(c),fd=p.q*c.p/1e8*f;p.mg-=fd;p.fd+=fd;const w=c.v*(.35+.9*hsh(S.day,p.d,17)),lo=c.p*Math.exp(-w),hi=c.p*Math.exp(w),lq=ppLiq(p);
if((p.q>0&&lo<=lq)||(p.q<0&&hi>=lq)||ppEq(p)<=0){S.cst.lq++;L("💥 "+p.k+" "+(p.q>0?"롱":"숏")+" "+p.lev+"배 강제 청산! 증거금 "+F(p.mg)+" 전액 손실 (청산가 "+Wc(lq)+")",1);return false}return true})}

// ---- v12 corporate & market rules: ex-dividend, splits, consolidated tax, going private / squeeze-out, 5% disclosure,
// analyst coverage, investor flows, executive stock options, golden parachute ----
// ex-dividend: the price drops by the dividend per share on payment day (배당락); the value pull lets it drift back only if earnings justify it
function exDiv(c,dv){if(c.priv||dv<=0||!c.p)return;const dps=dv*1e4/c.sh;c.jx=(c.jx||0)+Math.log(Math.max(.5,1-dps/c.p));c.xd=S.day;c.dps=+dps.toFixed(1)}
// stock split (f new shares per old: 2 = 2-for-1) or reverse split (f < 1). Every per-share number is rescaled; the return history is unchanged so charts come out split-adjusted.
function splitDo(c,f,quiet){const d=1/f;c.sh*=f;for(const k of ["p","pc","tg","dh","dl","atp","dps"])if(c[k]!=null)c[k]*=d;if(c.est!=null)c.est=+(c.est*d).toFixed(1);
if(c.eh)c.eh=c.eh.map(x=>+(x*d).toFixed(1));if(c.hm)c.hm=c.hm.map(x=>Math.round(x*d));if(c.hist)c.hist=c.hist.map(x=>Math.round(x*d));if(c.hl)c.hl=c.hl.map(a=>a.map(x=>Math.round(x*d)));
if(c.fq)for(const r of c.fq){r[20]=r1(r[20]*f);r[21]=Math.round(r[21]*d)}if(c.xvd)for(const k in c.xvd)c.xvd[k]*=f;for(const a of S.al)if(a.i===c.id)a.px*=d;
for(const o of S.op)if(o.i===c.id){o.k*=d;o.nsh*=f}for(const o of S.ow)if(o.i===c.id){o.k*=d;o.nsh*=f}for(const o of S.eo||[])if(o.i===c.id)o.k*=d;for(const p of S.fx)if(p.u==="S:"+c.id){p.q*=f;p.px*=d}
const nm=f>=1?f+":1 액면분할":"1:"+Math.round(1/f)+" 주식병합";c.jx=(c.jx||0)+(f>=1?.02:-.03);if(!quiet)eco("✂ "+c.tk+" "+nm+" (주가 "+W(c.p)+")");return nm}
G.split=i=>{const c=S.co[i];if(!mine(c)||c.priv)return;const opts=[[10,"10:1 분할"],[5,"5:1 분할"],[2,"2:1 분할"],[.5,"1:2 병합"],[.2,"1:5 병합"],[.1,"1:10 병합"]];
openMd({t:c.tk+" 액면분할·병합",b:"주가 "+W(c.p)+". 분할하면 주식 수가 늘고 주가가 낮아져 개인 투자자가 사기 쉬워집니다(보통 소폭 호재). 병합은 반대로 주가가 너무 낮을 때 씁니다(보통 소폭 악재). 회사 가치와 지분율은 그대로예요. 비용 0.5억.",
h:`<div class="bs">${opts.map(([f,t])=>B(t+" → "+W(c.p/f),`G.splitGo(${i},${f})`)).join("")}</div>`,o:[["닫기","n"]]})};
G.splitGo=(i,f)=>{const c=S.co[i];closeMd();if(!mine(c)||c.priv)return render();if(!ePay(i,.5))return toast("회사 자금 부족");const nm=splitDo(c,f,1);L("✂ "+c.tk+" "+nm+" 완료 · 새 주가 "+W(c.p)+" · 주식 수 "+Math.round(c.sh).toLocaleString()+"만주",1);render()};
function aiSplits(){for(const c of S.co){if(c.dead||c.priv||mine(c))continue;if(c.p>2e6&&rnd()<.08)splitDo(c,c.p>6e6?10:5);else if(c.p<1000&&c.p>60&&rnd()<.1)splitDo(c,.1)}}
// consolidated tax return: a subsidiary at least 80% owned by a company files with its parent. Profits use the parent's loss carryforward
// (the tax is paid to the parent instead of the government); the subsidiary's losses go to the parent, which pays it the tax benefit.
function cPar(c){for(const k in c.own)if(k[0]==="c"&&c.own[k]>=80){const h=S.co[+k.slice(1)];if(h&&!h.dead)return h}return null}
function cTax(c,pre){const h=cPar(c);c.cpar=h?h.id:-1;
if(pre>0){const u=Math.min(c.nol,pre);c.nol-=u;let tb=pre-u,t=0;if(h&&h.nol>0){const u2=Math.min(h.nol,tb);h.nol-=u2;tb-=u2;const pay=u2*ctax(c);h.cs+=pay;t+=pay;c.ctx=+(pay).toFixed(2)}else c.ctx=0;return t+tb*ctax(c)}
if(h){const ben=-pre*ctax(h);h.nol-=pre;h.cs-=ben;if(h.cs<0){h.D-=h.cs;h.cs=0}c.ctx=-ben;return -ben}c.ctx=0;c.nol-=pre;return 0}
// one group owns 100% (by any route) -> the company leaves the exchange
function privChk(c){if(c.priv||c.dead||pub(c)>.05)return;let r=null;for(const k in c.own){const x=root(k);if(r==null)r=x;else if(x!==r)return}if(!r)return;
settleX(c,1);c.priv=1;c.pt=S.day;c.lim=0;eco("🔒 "+c.tk+" "+c.n+" 상장 폐지 — "+rootName(r)+"가 지분 100% 확보 (비상장 전환)");if(r==="P")L("🔒 "+c.tk+" 지분 100% 확보 → 비상장 회사로 전환됐습니다. 경영 탭에서 다시 상장할 수 있어요",1)}
// squeeze-out: with 90%+ the group may force the remaining shareholders to sell at a 10% premium
G.sqz=i=>{const c=S.co[i],e=teOK(),k=eKey(e);if(c.priv||c.dead)return;const g=grp(c,"P");if(g<90)return toast("내 그룹 지분이 90% 이상이어야 잔여 지분을 강제 매수할 수 있어요");if(root(k)!=="P")return;
let cost=0;const px=mc(c)*1.1/100;for(const h in c.own)if(root(h)!=="P")cost+=c.own[h]*px;cost+=pub(c)*px;
ask(c.tk+" 잔여 지분 강제 매수","남은 소액주주 지분 "+(100-g).toFixed(2)+"%를 시가보다 10% 비싸게("+F(cost)+") "+eName(e)+" 명의로 사들여 100% 비상장 회사로 만듭니다.","강제 매수",()=>{if(!ePay(e,cost))return toast("자금 부족: 필요 "+F(cost));settleX(c,1.1);
let add=pub(c);for(const h of Object.keys(c.own))if(root(h)!=="P"){add+=c.own[h];payK(c,h,c.own[h]*px);setOwn(c,h,0)}setOwn(c,k,(c.own[k]||0)+add);c.bs[k]=(c.bs[k]||0)+cost;c.priv=1;c.pt=S.day;ctlAll();rec("강제 매수",c,cost);L("🔒 "+c.tk+" 잔여 지분 강제 매수 완료 — 100% 비상장 자회사 ("+F(cost)+")",1);render()})};
// 5% rule: crossing 5% and every 1%p move after must be disclosed. Raiders' and the player's filings excite the market (M&A hopes) and invite front-running.
function dscScan(c,quiet){if(c.dead)return;const g={};for(const k in c.own){const r=root(k);g[r]=(g[r]||0)+c.own[k]}const d=c.dsc=c.dsc||{};
for(const r in g){const v=g[r],o=d[r]||0;if((v>=5&&(o<5||Math.abs(v-o)>=1))||(v<5&&o>=5)){d[r]=v>=5?+v.toFixed(2):0;if(!quiet&&!c.priv)dscNews(c,r,v,o)}}for(const r in d)if(!(r in g)){if(d[r]>=5&&!quiet&&!c.priv)dscNews(c,r,0,d[r]);delete d[r]}}
function dscNews(c,r,v,o){const who=r==="P"?gName():rootName(r),up=v>o,rv=r[0]==="r"?S.R[+r.slice(1)]:null,hot=up&&(r==="P"||rv&&(rv.s==="raid"||rv.s==="act"||rv.s==="ag"));
const t="📢 대량보유 공시: "+who+" → "+c.tk+" "+v.toFixed(2)+"% ("+(o?o.toFixed(1)+"% → ":"신규 ")+v.toFixed(1)+"%)";eco(t);
if(hot){c.jx=(c.jx||0)+.015+.035*rnd();c.fr5=S.day+30}if(r==="P")L(t+(hot?" — 시장이 인수 가능성을 눈치챘어요. 30일 동안 추가 매수 비용이 비싸집니다":""),1);else if(mine(c)&&up)L("⚠ "+t+" (내 회사!)",1);else if(c.own.P&&up&&hot)L(t,1)}
const frX=c=>c.fr5>S.day?1.5:1;
// analyst coverage: rating -2..2 and a target price, refreshed at earnings and after big moves. Analysts see public numbers only and lean optimistic.
const ARL=["강력 매도","매도","중립","매수","강력 매수"];
const brk=c=>{const b=S.co.filter(x=>x.i===3&&!x.dead);return b.length?b[(c.id*7+3)%b.length].tk+"증권":"레이더증권"};
function anaUpd(c){if(c.priv||c.dead)return;const cov=Math.min(14,Math.round(mc(c)/350));c.acv=cov;if(!cov){c.ar=null;c.atp=null;return}
const fv=Math.max(1,c.tg)*Math.exp((c.nf||0)*.45+(S.ns[c.i]||0)*.45+.08+.11*hgn(c.id,31)),up=fv/c.p-1,ar=up>.3?2:up>.1?1:up>-.06?0:up>-.18?-1:-2,o=c.ar;c.ar=ar;c.atp=Math.round(fv);
if(o!=null&&ar!==o&&mc(c)>=1500){eco("📊 "+brk(c)+", "+c.tk+" 투자의견 "+ARL[o+2]+" → "+ARL[ar+2]+" · 목표가 "+W(fv));c.jx=(c.jx||0)+(ar-o)*.012}}
// investor flows (외국인 / 기관 / 개인), derived from each day's move: foreigners follow the market and momentum, institutions follow company news, retail takes the other side
function flows(c,n){const s=dSeries(c,n+6),rm=mktRets(n+6),out=[];for(let j=Math.max(5,s.n-n);j<s.n;j++){const r=Math.log(s.c[j]/s.c[j-1]),m=(c.be||1)*rm[j],mo=Math.log(s.c[j-1]/s.c[j-5]),tv=s.v[j]*s.c[j]/1e4,d=s.d0+j;
const fo=tv*.22*Math.tanh(55*m+9*mo+.6*(hsh(c.id,d,21)-.5)),ins=tv*.18*Math.tanh(70*(r-m)+.8*(hsh(c.id,d,22)-.5));out.push([fo,ins,-(fo+ins),d])}return out}
function mktFlows(n){const L5=new Set(S.l50||[]),tot=[];for(let j=0;j<n;j++)tot.push([0,0,0]);for(const c of S.co){if(c.dead||c.priv||!c.hn||c.hn<n+6)continue;if(!L5.has(c.id)&&mc(c)<800)continue;const f=flows(c,n);f.forEach((x,j)=>{const t=tot[j+n-f.length];if(t){t[0]+=x[0];t[1]+=x[1];t[2]+=x[2]}})}return tot}
// executive stock options for the player-CEO: granted each quarter by the board, vest after a year, expire after two
function eoGrant(){const c=ceoCo();if(!c||c.priv)return;const out=(S.eo||[]).filter(o=>o.i===c.id).reduce((a,o)=>a+o.pct,0);if(out>=6)return;
const gr=c.pni>0?(c.ni-c.pni)/c.pni:c.ni>0?1:0,pct=+Math.min(6-out,.25+1.25*Math.max(0,Math.min(1,gr*3+.3))+(grp(c,"P")>=51?.25:0)).toFixed(2);if(pct<.1)return;
(S.eo=S.eo||[]).push({i:c.id,k:Math.round(c.p),pct,g:S.day,v:S.day+360,x:S.day+720});L("💼 "+c.tk+" 이사회가 CEO 스톡옵션 "+pct+"% 부여 · 행사가 "+W(c.p)+" (1년 뒤 행사 가능, 2년 만기)",1)}
const eoV=o=>{const c=S.co[o.i];return !c||c.dead?0:Math.max(0,c.p-o.k)*c.sh*o.pct/100/1e4};
const eoVal=()=>(S.eo||[]).reduce((a,o)=>a+(S.day>=o.v?eoV(o)*.6:0),0);
function eoDay(){if(!S.eo||!S.eo.length)return;S.eo=S.eo.filter(o=>{const c=S.co[o.i];if(!c||c.dead)return false;if(S.day>=o.x){L("⌛ "+c.tk+" 스톡옵션 만기 소멸",1);return false}
if(S.day<o.v&&S.ceo!==o.i){L("💼 "+c.tk+" CEO에서 물러나 미확정 스톡옵션 "+o.pct+"%가 소멸했습니다",1);return false}return true})}
// exercise: pay the strike, the company issues new shares to me — the cheapest way for a CEO to raise a stake
G.eoX=n=>{const o=S.eo[n];if(!o)return;const c=S.co[o.i];if(S.day<o.v)return toast("아직 행사할 수 없어요 ("+(o.v-S.day)+"일 남음)");if(c.p<=o.k)return toast("주가가 행사가보다 낮아 행사하면 손해예요");if(c.priv)return toast("비상장이라 행사할 수 없어요");
const N=c.sh*o.pct/100,cost=o.k*N/1e4;if(!ePay("P",cost))return toast("행사 대금 "+F(cost)+"이 필요합니다");const sh0=c.sh,np=N/(sh0+N)*100;rescale(c,sh0/(sh0+N));c.sh+=N;c.cs+=cost;c.p=(c.p*sh0+o.k*N)/(sh0+N);c.tg*=sh0/(sh0+N)+o.k*N/(sh0+N)/Math.max(1,c.tg);
const was=c.ctl;setOwn(c,"P",(c.own.P||0)+np);c.bs.P=(c.bs.P||0)+cost;S.eo.splice(n,1);rec("스톡옵션 행사",c,cost,"나");L("💼 "+c.tk+" 스톡옵션 행사: 신주 "+np.toFixed(2)+"%를 "+W(o.k)+"에 인수 ("+F(cost)+") → 내 직접 지분 "+c.own.P.toFixed(2)+"%",1);afterCtl(c,was);render()};
G.eoS=n=>{const o=S.eo[n];if(!o)return;const c=S.co[o.i];if(S.day<o.v)return toast("아직 행사할 수 없어요");const v=eoV(o);if(v<=0)return toast("행사 가치가 없습니다");c.cs-=v;c.sbx=(c.sbx||0)+v;if(c.cs<0){c.D-=c.cs;c.cs=0}S.cash+=v*.6;S.eo.splice(n,1);L("💼 "+c.tk+" 스톡옵션을 회사에 되팔았습니다: 세후 "+F(v*.6)+" (회사 비용 처리)",1);render()};
// golden parachute when a raider ousts the player-CEO
function gpara(c){if(!c||c.dead)return;const b=ceoSal(c)*(1+rnd()*2);c.cs-=b;if(c.cs<0){c.D-=c.cs;c.cs=0}S.cash+=b*.6;L("🪂 황금 낙하산: "+c.tk+" 경영권을 잃고 CEO에서 물러나며 퇴직 보상 세후 "+F(b*.6)+"을 받았습니다",1)}
// daily corporate housekeeping
function corpDay(dd){for(const c of S.co){if(c.dead)continue;if(c.oc){c.oc=0;privChk(c);dscScan(c)}if(!c.priv&&Math.abs(c.c1||0)>.1&&c.acv)anaUpd(c)}
if(dd%30===15)aiSplits();eoDay();
for(const c of S.co){if(c.dead||c.priv||!(c.own.P>=1||mine(c)))continue;if(nxe(c)===3){const t="🔔 3일 뒤 "+c.tk+" 실적 발표 (예상 EPS "+(c.est!=null?W(c.est):"-")+")";if(S.nt&&!S.nt.slice(0,30).some(x=>x.t===t))note(t)}}}

// ---- v12 industries: every sector runs on its own business model; banks get a real balance sheet ----
const ARCH={plat:[0,27],cyc:[1,2,11,15,16,18,25,26,28],hit:[4,7],com:[5,29,30],reg:[10,24,32],def:[6,20,22,31],trans:[8,23],defn:[17],cons:[9],retail:[19,21],bank:[12],ins:[13],brk:[3],hold:[14]};
const ARI={};for(const k in ARCH)for(const i of ARCH[k])ARI[i]=k;
const arOf=i=>ARI[i]||"cyc";
const ARN={plat:["플랫폼 · 승자독식","점유율이 높을수록 마진이 커집니다(네트워크 효과). 1등은 이익을 독식하고, 점유율 5% 미만은 적자를 보기 쉬워요. 설비 투자 부담은 작아요."],
cyc:["경기·설비 사이클","수요와 설비 차이가 마진을 두 배로 흔들고, 3~4년 주기의 호황·불황이 옵니다. 주가는 실적보다 먼저 움직여요. 불황 때 감산하면 업종 마진이 회복됩니다."],
hit:["히트 의존형","신약 임상·신작 출시 같은 한 번의 결과가 회사를 바꿉니다. R&D를 늘리면 성공 확률이 올라가요. 작은 회사일수록 결과에 주가가 크게 반응합니다."],
com:["원자재 연동","이익이 원자재 가격(유가·금·구리·곡물)과 함께 움직입니다. 원자재 선물로 헤지할 수 있어요."],
reg:["규제 산업","정부가 허용한 수익률 안에서 안정적으로 벌어요. 실적 변동은 작지만 금리가 오르면 주가가 약합니다(채권 같은 주식)."],
def:["경기 방어","경기와 상관없이 꾸준히 팔려요. 불황에 강하고 호황엔 덜 오릅니다."],
trans:["운송·여행","유가·경기·전염병에 가장 민감합니다. 유가가 오르면 마진이 줄어요."],
defn:["방산","정부 계약으로 움직여요. 대형 수주가 몇 년 치 매출을 정하고, 전쟁·긴장 때 강합니다."],
cons:["건설·부동산","금리에 가장 민감해요. 금리가 내리면 분양과 수주가 살아나고, 오르면 얼어붙습니다."],
retail:["소비·유통","소비 심리와 함께 움직이는 박리다매 사업이에요."],
bank:["은행","예금으로 대출과 채권에 투자해 금리 차이로 법니다. 자산 배분, 대손충당금, BIS 비율 관리가 핵심이에요."],
ins:["보험","보험료를 받아 굴리는(플로트) 사업. 보험 시장 주기(소프트·하드)와 대형 재해가 이익을 흔듭니다."],
brk:["증권·자산운용","거래대금과 시장 분위기, ETF 운용 보수로 법니다. 강세장에 이익이 폭증해요."],
hold:["지주회사","다른 회사 지분을 갖는 것이 사업이에요."]};
// sector cycle (cyclicals): a slow oscillation per sector; prices anticipate it a little each day
const cycV=i=>{const y=S.icy&&S.icy[i];return y?y.a*Math.sin(y.ph):0};
const cycD=i=>arOf(i)==="cyc"&&S.icy&&S.icy[i]?.0002*S.icy[i].a*Math.cos(S.icy[i].ph):0;
// archetype adjustments to quarterly operating profit (non-banks), plus swap / ETF fee / stock-comp flows
function opX(c,op){const a=arOf(c.i),A=c.A,t=ctr(c);let x=0;
if(a==="cyc")x+=A*(.005*cycV(c.i)+.25*(S.dg[c.i]-S.cg[c.i]));
else if(a==="plat"){const s=share(c);x+=s>.3?A*.012*(s-.3):s<.05?-A*.002:0}
else if(a==="com"){const m=c.i===5?[S.cm[2]]:c.i===29?[S.cm[0],S.cm[3]]:[S.cm[4]];let d=0;for(const z of m)d+=z.p/z.f-1;x+=A*.012*Math.max(-.6,Math.min(1.5,d/m.length))}
else if(a==="reg")x+=(A*SEC[c.i][1]-op)*.6;else if(a==="def")x+=(A*SEC[c.i][1]-op)*.35;
else if(a==="cons")x+=A*.003*(7.5-S.prime)/2.5;else if(a==="retail")x+=A*.003*S.mood;
else if(a==="trans")x-=A*.005*Math.max(-.5,S.cm[2].p/S.cm[2].f-1);
else if(a==="ins"){x+=A*.004*(S.uwc||0);if(c.cat){x-=c.cat;c.cat=0}}
else if(a==="brk"){const o=S.IX&&S.IX.ALL;if(o&&o.tv&&o.hn>60){const t60=ringGet(o.tv,o.hn,60).reduce((p,q)=>p+q,0)/60;S.tvA=S.tvA?S.tvA*.97+t60*.03:t60;x+=A*.012*Math.max(-.5,Math.min(1.5,t60/S.tvA-1))}}
if(c.ebk>S.day)x+=A*.003;x+=A*(t.gr||0)*.0008;if(c.swq){x+=c.swq;c.swq=0}if(c.etfq){x+=c.etfq;c.etfq=0}if(c.sbx){x-=c.sbx;c.sbx=0}return op+x}
// quarterly industry life: cycles turn, trials and launches resolve, defense contracts land, the insurance market hardens or softens
function archQ(){if(!S.icy)return;S.icy.forEach((y,i)=>{if(arOf(i)!=="cyc")return;const s0=Math.sin(y.ph);y.ph+=6.2832/14*(.8+rnd()*.4);const s1=Math.sin(y.ph);if(s0<0&&s1>=0)eco("🔄 "+SEC[i][0]+" 업황 바닥 통과 — 사이클 반등 국면");else if(s0>0&&s1<=0)eco("🔄 "+SEC[i][0]+" 업황 정점 통과 — 사이클 하강 국면")});
S.uwc=Math.max(-1,Math.min(1,(S.uwc||0)*.8+.3*gz()+(S.bsw&&S.bsw.id==="quake"?.6:0)));
for(const c of S.co){if(c.dead)continue;const a=arOf(c.i);
if(a==="hit"&&rnd()<(mc(c)<800?.12:.05)){const bio=c.i===4,ok=rnd()<.35+(c.hq||0)*.15+(c.ps||0)*.03+(c.mg||0)*.02,big=mc(c)<800?1:.45,mag=(.12+rnd()*.33)*big;
c.jx=(c.jx||0)+(ok?mag:-mag*1.1);c.nf=(c.nf||0)+(ok?mag:-mag)*.5;c.edge=(c.edge||0)+(ok?.002+rnd()*.004:-.0015);
const t=(bio?(ok?"🧪 "+c.tk+" 임상 3상 성공! 신약 허가 기대":"🧪 "+c.tk+" 임상 실패 — 파이프라인 타격"):(ok?"🎮 "+c.tk+" 신작 흥행 대박!":"🎮 "+c.tk+" 신작 흥행 실패"))+" ("+(ok?"+":"-")+(mag*100).toFixed(0)+"%)";eco(t);if(c.own.P||mine(c))L(t,1)}
if(a==="defn"&&rnd()<(S.bsw&&S.bsw.id==="war"?.25:.06)){c.ebk=S.day+360;c.jx=(c.jx||0)+.06;const t="🛡 "+c.tk+" 대형 방산 수주 — 1년 치 매출 확보";eco(t);if(c.own.P||mine(c))L(t,1)}}}

// ===== banks: asset allocation (fractions of assets that are not business loans), loan-loss reserve, BIS ratio, regulators =====
const BAK=[["mt","우량 주택담보",.35,"기준금리 −1%p, 손실 거의 없음"],["sb","서브프라임",1,"기준금리 +3%p, 경기 침체·주택 붕괴 때 손실 폭증"],["cl","소비자 신용",.75,"기준금리 +4%p, 실업률이 오르면 손실 증가"],["bd","장기 국채",.1,"장기 금리, 금리가 오르면 평가 손실"],["tb","단기채·현금성",0,"단기 금리 −1%p, 가장 안전"]];
const BAP={safe:{mt:.4,sb:0,cl:.1,bd:.25,tb:.25},bal:{mt:.4,sb:.08,cl:.2,bd:.25,tb:.07},agg:{mt:.25,sb:.3,cl:.35,bd:.05,tb:.05}};
function bankInit(c){c.ba=Object.assign({},BAP.bal);c.llr=c.A*.01;c.bm=1;c.byl=S.yL||7.9}
function bankBL(b){let s=0;for(const x of S.co)if(!x.dead&&x.ln===b.id)s+=loanOf(x);return Math.min(s,b.A)}
function bankRisk(){const rec=Math.max(0,2-S.gdp),un=Math.max(0,(S.un||4.5)-5),hous=S.mx&&S.mx.id==="re"?1:0,sub=S.bsw&&S.bsw.sub?1:0;return{BL:.003+.005*rec,mt:.001+.004*hous+.01*sub,sb:.015*(1+rec+4*hous+8*sub),cl:.02*(1+.4*un+.5*rec),bd:0,tb:0}}
function bankY(){return{BL:S.prime+2*sprM(),mt:S.prime-1,sb:S.prime+3,cl:S.prime+4,bd:S.yL,tb:Math.max(0,S.yS-1)}}
function bankOp(c){if(!c.ba)bankInit(c);const BL=bankBL(c),NB=Math.max(0,c.A-BL),a=c.ba,y=bankY(),l=bankRisk();
let inc=BL*y.BL,loss=BL*l.BL;for(const[k]of BAK){inc+=NB*a[k]*y[k];loss+=NB*a[k]*l[k]}inc/=400;loss/=4;
const dY=(S.yL||7.9)-(c.byl||S.yL),bmt=-NB*a.bd*5*dY/100;c.byl=S.yL;const fund=Math.max(0,c.D)*Math.max(.2,S.yS-1)/400,ovh=c.A*.003;
const loans=BL+NB*(a.mt+a.sb+a.cl);c.llr=(c.llr==null?loans*.01:c.llr)-loss;const prov=loss+Math.max(0,loans*.012-c.llr)*.5;c.llr+=prov;
c.bkr={inc,loss,prov,fund,ovh,bmt,BL,NB};return(inc-fund-ovh-prov+bmt+c.A*(c.mg||0)*.0004)*(1+eShock(c,.25)*.3)}
function bisOf(c){if(c.kd!==1||!c.ba)return null;const BL=bankBL(c),NB=Math.max(0,c.A-BL);let rwa=BL;for(const[k,,w]of BAK)rwa+=NB*c.ba[k]*w;return Math.max(-50,eq(c)/Math.max(1,rwa)*100)}
// quarterly: regulators watch capital; AI banks steer their allocation with the cycle
function bankQ(){for(const c of S.co){if(c.dead||c.kd!==1)continue;if(!c.ba)bankInit(c);const b=bisOf(c),me=mine(c);c.bis=+b.toFixed(2);
if(c.bm){const r=S.cyc==="확장"?"agg":S.cyc==="침체"?"safe":"bal",t=BAP[r];for(const k in t)c.ba[k]=c.ba[k]*.7+t[k]*.3}
const was=c.breg;c.breg=b<8?1:0;if(c.breg&&!was){const t="🏦 "+c.tk+" BIS 비율 "+b.toFixed(1)+"% — 금융당국이 신규 대출을 막았습니다";eco(t);if(me)L(t+". 증자하거나 위험 자산을 줄이세요",1)}
const db0=c.dban;c.dban=b<10.5?1:0;if(c.dban&&!db0&&me)L("🏦 "+c.tk+" BIS 비율 "+b.toFixed(1)+"% — 완충 기준 미달로 배당이 금지됐습니다",1);if(!me&&b<9){const iss=mc(c)*.1;if(iss>1&&!c.priv){c.cs+=iss*.9;c.sh*=1.1;rescale(c,1/1.1);c.p*=.95;eco("🏦 "+c.tk+" 자본 확충 위해 유상증자 10%")}c.ba.sb*=.5;c.ba.cl*=.8;c.ba.tb+=.1}
if(b<4&&b>-50&&c.D>0){const w=c.D*.05,p1=Math.min(c.cs,w),rest=w-p1;c.cs-=p1;c.A=Math.max(0,c.A-rest/.9);c.D-=w;c.jx=(c.jx||0)-.2;const t="🏃 "+c.tk+" 뱅크런! 예금 인출이 몰려 자산을 헐값에 팔았습니다";eco(t);if(me||c.own.P)L(t,1)}
const s=Object.values(c.ba).reduce((p,q)=>p+q,0);for(const k in c.ba)c.ba[k]/=s||1}}
// loan trading: sell a borrower's loan at a rating discount, or buy distressed loans cheap (then call them, and own the company through bankruptcy)
const LDISC=[.002,.005,.01,.03,.08,.2,.5];
function loanPx(x){return loanOf(x)*(1-LDISC[rating(x)])}
G.lsell=(b,i)=>{const B0=S.co[b],x=S.co[i];if(!mine(B0)||x.ln!==b)return;const face=loanOf(x),px=loanPx(x),buy=banks().filter(z=>z.id!==b&&!mine(z)&&z.cs>px).sort((p,q)=>q.A-p.A)[0];if(!buy)return toast("대출을 살 은행이 없습니다");
ask(x.tk+" 대출 매각",B0.tk+"가 가진 "+x.tk+" 대출 "+F(face)+"을 "+buy.tk+"에 "+F(px)+" (액면의 "+(px/face*100).toFixed(1)+"%)에 팝니다.","매각",()=>{B0.A-=face;B0.cs+=px;buy.A+=face;buy.cs-=px;x.ln=buy.id;x.frz=0;rec("대출 매각",x,px,B0.tk);L("🏦 "+B0.tk+"가 "+x.tk+" 대출을 "+buy.tk+"에 매각 ("+F(px)+", 손실 "+F(face-px)+")",1);render()})};
G.lbuy=(b,i)=>{const B0=S.co[b],x=S.co[i],L0=S.co[x.ln];if(!mine(B0)||B0.kd!==1)return toast("내가 지배하는 은행이 필요해요");if(!L0||L0.dead||L0.id===b)return;if(mine(L0))return toast("내 그룹 은행끼리는 옮기기만 하면 돼요");
const face=loanOf(x),px=face*(1-Math.min(.75,LDISC[rating(x)]*1.25+.05));ask(x.tk+" 부실 대출 인수",L0.tk+"가 가진 "+x.tk+" 대출 "+F(face)+"을 액면의 "+(px/face*100).toFixed(0)+"% ("+F(px)+")에 삽니다. 이 회사가 법정관리에 들어가면 대출이 지분으로 바뀌어 회사를 차지할 수 있어요 (loan-to-own).","인수",()=>{if(!ePay(b,px))return toast(B0.tk+" 자금 부족");
L0.A-=face;L0.cs+=px;B0.A+=face;x.ln=b;rec("대출 인수",x,px,B0.tk);eco("🏦 "+B0.tk+"가 "+x.tk+" 대출을 "+L0.tk+"에서 액면 "+(px/face*100).toFixed(0)+"%에 인수");L("🏦 "+x.tk+" 대출 "+F(face)+" 인수 완료 ("+F(px)+")",1);render()})};
G.bkAlloc=(i,k)=>{const c=S.co[i];if(!mine(c)||c.kd!==1)return;if(k==="auto"){c.bm=1;toast("자산 배분을 경기에 맞춰 자동으로 조정합니다")}else{c.bm=0;c.ba=Object.assign({},BAP[k]);toast("자산 배분: "+{safe:"보수적",bal:"균형",agg:"공격적"}[k])}render()};
G.bkSet=(i,k)=>{const c=S.co[i];if(!mine(c)||c.kd!==1)return;const r=BAK.find(x=>x[0]===k);numModal({t:c.tk+" "+r[1]+" 비중",b:r[3]+". 다른 항목은 비율대로 줄어들어 합계 100%를 맞춥니다.",min:0,max:90,step:1,val:Math.round(c.ba[k]*100),u:"%",chips:[0,5,10,20,30,50],
pv:x=>{const o=Object.assign({},c.ba),rest=1-o[k];o[k]=x/100;for(const z in o)if(z!==k)o[z]=rest>0?o[z]/rest*(1-x/100):(1-x/100)/4;const cc=Object.assign({},c,{ba:o});return "예상 BIS 비율 "+bisOf(cc).toFixed(1)+"% (8% 미만이면 대출 제한)"},
go:x=>{const rest=1-c.ba[k];c.bm=0;c.ba[k]=x/100;for(const z in c.ba)if(z!==k)c.ba[z]=rest>0?c.ba[z]/rest*(1-x/100):(1-x/100)/4;L(c.tk+" "+r[1]+" 비중 "+x+"%",1);render()}})};

// ---- v12 events: 30 company events with sliders and live odds, decision rights, AI companies' events, delayed consequences ----
// who decides: the player as CEO decides; a controlling owner who is not CEO sees management's plan and may intervene (board vote);
// a minority shareholder only reads the news.
const EVC={lab:"노무·인사",legal:"법률·규제",ops:"운영",fin:"재무·지배구조",ind:"업종 특유",ctry:"국가"};
const evLab=c=>ctr(c).lab||1;
const fxj=(c,x)=>{c.jx=(c.jx||0)+x},fxn=(c,x)=>{c.nf=(c.nf||0)+x},fxc=(c,x)=>{c.cs+=x;if(c.cs<0){c.D-=c.cs;c.cs=0}},fxm=(c,x)=>{c.mg=Math.max(-3,Math.min(4,(c.mg||0)+x))};
const pct0=x=>(x*100).toFixed(0)+"%";
const evQ=(c,days,k,v)=>(S.evq=S.evq||[]).push({d:S.day+days,c:c.id,k,v});
const EV2=[
{id:"strike",cat:"lab",t:"노조 파업 예고",w:c=>1.2*evLab(c),el:c=>!c.kd&&c.i!==HOLD,mk:c=>({dem:Math.round(6+rnd()*7)}),
b:(c,x)=>c.tk+" 노조가 임금 "+x.dem+"% 인상을 요구하며 파업을 예고했습니다. 얼마를 제시할지 정하세요. 노조 성향("+(evLab(c)>1.2?"강경":evLab(c)<.7?"온건":"보통")+")에 따라 파업 확률이 달라져요.",
sl:x=>({lab:"임금 인상 제시",min:0,max:x.dem,step:.5,u:"%"}),sv:(c,x)=>x.dem*.6,
o:[["제시안으로 협상","off"],["요구 전부 수용","all"],["직장 폐쇄 (강경)","lock"]],
pr:(c,x,v)=>{const p=Math.min(.95,Math.max(.03,.85*Math.pow(1-v/x.dem,1.3)*evLab(c)+.04));return["제시안: 파업 확률 "+pct0(p)+" · 인건비 연 약 "+F(c.A*v*.0012),"전부 수용: 파업 0% · 인건비 연 약 "+F(c.A*x.dem*.0012),"직장 폐쇄: 70%는 짧게 끝나지만 30%는 장기 파업"]},
go:(c,x,k,v)=>{if(k==="all"){fxm(c,-x.dem*.035);return c.tk+" 노조 요구 수용 — 임금 "+x.dem+"% 인상"}if(k==="lock"){if(rnd()<.7){c.ru=Math.max(c.ru||0,1);fxj(c,-.03);return c.tk+" 직장 폐쇄 — 노조가 물러섰지만 생산 차질"}c.ru=3;c.A*=.98;fxj(c,-.1);return c.tk+" 직장 폐쇄가 장기 파업으로 번졌습니다!"}
const p=Math.min(.95,Math.max(.03,.85*Math.pow(1-v/x.dem,1.3)*evLab(c)+.04));fxm(c,-v*.035);if(rnd()<p){c.ru=Math.max(c.ru||0,2);c.A*=.99;fxj(c,-.07);return c.tk+" 임금 "+v+"% 제시에도 파업 돌입! 생산 차질"}return c.tk+" 임금 "+v+"% 인상으로 타결"},ai:(c,x)=>["off",x.dem*.6]},
{id:"talent",cat:"lab",t:"핵심 인재 이탈 위기",w:()=>.8,el:c=>c.i!==HOLD,mk:c=>({mx:Math.max(1,Math.round(c.A*.008))}),b:(c,x)=>c.tk+"의 핵심 개발·영업 인력이 경쟁사 스카우트 제의를 받았습니다. 붙잡을 보너스를 정하세요.",
sl:x=>({lab:"잔류 보너스",min:0,max:x.mx,step:Math.max(.1,+(x.mx/20).toFixed(1)),u:"억"}),sv:(c,x)=>x.mx*.4,o:[["보너스 제시","pay"],["보내 준다","no"]],
pr:(c,x,v)=>["잔류 확률 "+pct0(.2+.72*Math.pow(v/x.mx,.7)),"이탈하면 마진과 성장성이 조금 떨어져요"],
go:(c,x,k,v)=>{if(k==="pay"){fxc(c,-v);if(rnd()<.2+.72*Math.pow(v/x.mx,.7))return c.tk+" 핵심 인재 잔류 (보너스 "+F(v)+")"}c.edge=(c.edge||0)-.002;fxj(c,-.03);return c.tk+" 핵심 인재가 경쟁사로 떠났습니다"},ai:(c,x)=>["pay",x.mx*.5]},
{id:"scandal",cat:"lab",t:"임원 스캔들",w:()=>.7,el:c=>true,mk:()=>({}),b:c=>c.tk+" 고위 임원의 부적절한 처신이 언론에 보도됐습니다. 여론이 들끓고 있어요.",
o:[["즉시 해임","fire"],["사과와 쇄신안","sorry"],["회사가 옹호","def"]],pr:()=>["해임: 주가 −2%, 비용 2억, 새 경영진으로 체질 개선","사과·쇄신: 주가 −4%, 준법 비용","옹호: 50% 잠잠해지지만 50%는 더 커져 −12%"],
go:(c,x,k)=>{if(k==="fire"){fxc(c,-2);fxj(c,-.02);fxm(c,.2);return c.tk+" 문제 임원 해임"}if(k==="sorry"){fxc(c,-c.A*.002);fxj(c,-.04);return c.tk+" 대국민 사과와 쇄신안 발표"}if(rnd()<.5){fxj(c,-.03);return c.tk+" 옹호 — 여론이 잠잠해졌습니다"}fxj(c,-.12);fxn(c,-.03);return c.tk+" 옹호가 역풍 — 불매 운동 확산"},ai:()=>["sorry",0]},
{id:"accident",cat:"lab",t:"산업재해 발생",w:()=>.7,el:c=>!c.kd&&c.i!==HOLD&&![0,27,3].includes(c.i),mk:()=>({}),b:c=>c.tk+" 공장에서 중대 산업재해가 발생했습니다. 당국이 조사에 착수했어요.",
o:[["즉시 보상·안전 투자","fix"],["법적으로 다툰다","fight"]],pr:c=>["보상·투자: 비용 "+F(c.A*.006)+", 주가 −2%","다툼: 40% 확률로 벌금 "+F(c.A*.01)+"·주가 −8%·주목도 +3"],
go:(c,x,k)=>{if(k==="fix"){fxc(c,-c.A*.006);fxj(c,-.02);fxm(c,.05);return c.tk+" 피해 보상과 안전 투자 발표"}if(rnd()<.4){fxc(c,-c.A*.01);fxj(c,-.08);if(mine(c))S.heat+=3;return c.tk+" 산업재해 책임 인정 — 벌금과 여론 악화"}fxj(c,-.02);return c.tk+" 산업재해 다툼에서 책임 일부 면제"},ai:()=>["fix",0]},
{id:"patent",cat:"legal",t:"특허 침해 소송 피소",w:()=>.9,el:c=>[0,1,4,7,18,22,26,27,28].includes(c.i),mk:c=>({cl:Math.max(3,Math.round(c.A*(.03+rnd()*.05)))}),
b:(c,x)=>"경쟁사가 "+c.tk+"를 특허 침해로 고소하며 손해배상 "+F(x.cl)+"을 청구했습니다. 합의금을 제시하거나, 로펌을 골라 재판으로 갈 수 있어요.",sl:x=>({lab:"합의금 제시",min:0,max:x.cl,step:Math.max(.5,Math.round(x.cl/20)),u:"억"}),sv:(c,x)=>x.cl*.4,
o:[["합의금 제시","set"],["재판: 저가 로펌 (0.3억)","t0"],["재판: 중견 로펌 (1억)","t1"],["재판: 대형 로펌 (3억)","t2"]],
pr:(c,x,v)=>{const a=Math.min(1,Math.pow(v/x.cl,2)*1.4),h=(c.hq||0)*.1;return["합의 수락 확률 "+pct0(a)+" (거절되면 중견 로펌으로 재판)","저가 로펌 승소 "+pct0(.3+h),"중견 로펌 승소 "+pct0(.45+h),"대형 로펌 승소 "+pct0(.6+h)+" · 지면 "+F(x.cl)+" 배상"]},
go:(c,x,k,v)=>{const h=(c.hq||0)*.1;if(k==="set"){if(rnd()<Math.min(1,Math.pow(v/x.cl,2)*1.4)){fxc(c,-v);fxj(c,-.01);return c.tk+" 특허 소송 합의 ("+F(v)+")"}k="t1"}const t=+k[1],cost=[.3,1,3][t];fxc(c,-cost);if(rnd()<[.3,.45,.6][t]+h){fxj(c,.03);return c.tk+" 특허 소송 승소!"}fxc(c,-x.cl);fxj(c,-.06);return c.tk+" 특허 소송 패소 — "+F(x.cl)+" 배상"},ai:(c,x)=>["set",x.cl*.5]},
{id:"classact",cat:"legal",t:"집단소송 제기",w:()=>.6,el:c=>!c.priv,mk:c=>({cl:Math.max(3,Math.round(mc(c)*.02))}),b:(c,x)=>"주가 하락으로 손해를 봤다는 투자자들이 "+c.tk+"를 상대로 "+F(x.cl)+" 규모의 집단소송을 냈습니다.",
sl:x=>({lab:"합의금",min:0,max:x.cl,step:Math.max(.5,Math.round(x.cl/20)),u:"억"}),sv:(c,x)=>x.cl*.35,o:[["합의","set"],["끝까지 다툰다","fight"]],
pr:(c,x,v)=>["합의 수락 "+pct0(Math.min(1,Math.pow(v/x.cl,1.6)*1.5)),"다투면 50% 승소, 50%면 전액 배상과 주가 −5%"],
go:(c,x,k,v)=>{if(k==="set"&&rnd()<Math.min(1,Math.pow(v/x.cl,1.6)*1.5)){fxc(c,-v);return c.tk+" 집단소송 합의 ("+F(v)+")"}fxc(c,-1);if(rnd()<.5)return c.tk+" 집단소송 승소";fxc(c,-x.cl);fxj(c,-.05);return c.tk+" 집단소송 패소 — "+F(x.cl)+" 배상"},ai:(c,x)=>["set",x.cl*.45]},
{id:"env",cat:"legal",t:"환경 규제 위반 적발",w:()=>.6,el:c=>[5,11,15,16,24,29,30,2].includes(c.i),mk:c=>({f:Math.max(1,Math.round(c.A*.005))}),b:(c,x)=>c.tk+" 공장의 오염물질 배출이 기준을 넘었습니다. 과징금 "+F(x.f)+"이 예고됐어요.",
o:[["과징금 납부·설비 개선","pay"],["행정소송","fight"]],pr:(c,x)=>["납부: "+F(x.f)+" + 설비 개선 "+F(x.f),"소송: 50% 면제, 50%면 2배 과징금과 주목도 +4"],
go:(c,x,k)=>{if(k==="pay"){fxc(c,-x.f*2);return c.tk+" 환경 과징금 납부와 설비 개선"}fxc(c,-.5);if(rnd()<.5)return c.tk+" 환경 소송 승소 — 과징금 취소";fxc(c,-x.f*2);fxj(c,-.04);if(mine(c))S.heat+=4;return c.tk+" 환경 소송 패소 — 과징금 2배"},ai:()=>["pay",0]},
{id:"antitrust",cat:"legal",t:"독과점 조사 착수",w:()=>1.2,el:c=>c.i!==HOLD&&share(c)>.35,mk:()=>({}),b:c=>"공정거래 당국이 업종 점유율 "+(share(c)*100).toFixed(0)+"%인 "+c.tk+"의 시장 지배력 남용 여부를 조사합니다.",
o:[["자진 시정 (자산 8% 매각)","fix"],["정면 대응 (변호 2억)","fight"]],pr:()=>["자진 시정: 사업 자산 8%를 팔고 조사 종결","대응: 55% 무혐의, 45%면 과징금 3%와 자산 10% 강제 매각"],
go:(c,x,k)=>{if(k==="fix"){fsAdd(c,.08,"독과점 시정");return c.tk+" 독과점 자진 시정 — 자산 일부 매각"}fxc(c,-2);if(rnd()<.55)return c.tk+" 독과점 조사 무혐의";fxc(c,-c.A*.03);fsAdd(c,.1,"독과점 강제 매각");fxj(c,-.06);return c.tk+" 독과점 판정 — 과징금과 강제 매각"},ai:()=>["fight",0]},
{id:"recall",cat:"ops",t:"제품 결함 발견",w:()=>.8,el:c=>[2,6,20,21,22,25,28,4,19].includes(c.i),mk:()=>({}),b:c=>c.tk+" 제품에서 안전 결함이 발견됐습니다. 리콜 범위를 정하세요. 범위가 좁으면 돈은 아끼지만 나중에 은폐 논란이 터질 수 있어요.",
sl:()=>({lab:"리콜 범위",min:10,max:100,step:5,u:"%"}),sv:()=>60,o:[["이 범위로 리콜","go"]],pr:(c,x,v)=>["리콜 비용 "+F(c.A*.008*v/100)+" · 나중에 은폐 논란 확률 "+pct0(Math.min(.9,Math.pow(1-v/100,1.5)*.85))],
go:(c,x,k,v)=>{fxc(c,-c.A*.008*v/100);fxj(c,-.025*v/100);if(rnd()<Math.min(.9,Math.pow(1-v/100,1.5)*.85))evQ(c,30+(rnd()*60|0),"cover",{});return c.tk+" 제품 "+v+"% 리콜 실시"},ai:()=>["go",70]},
{id:"fire",cat:"ops",t:"공장 화재",w:()=>.6,el:c=>!c.kd&&c.i!==HOLD&&![0,27,3].includes(c.i),mk:()=>({}),b:c=>c.tk+" 주력 공장에 큰 불이 났습니다. 생산 라인이 멈췄어요.",
o:[["즉시 복구 투자","fix"],["보험금 기다리기","wait"],["생산 기지 이전","move"]],pr:c=>["복구: "+F(c.A*.02)+", 차질 1분기","보험: 차질 3분기, 보험금 "+F(c.A*.012)+"은 석 달 뒤","이전: "+F(c.A*.012)+", 차질 2분기, 이후 효율 개선"],
go:(c,x,k)=>{fxj(c,-.04);if(k==="fix"){fxc(c,-c.A*.02);c.ru=Math.max(c.ru||0,1);return c.tk+" 화재 복구 투자"}if(k==="wait"){c.ru=Math.max(c.ru||0,3);evQ(c,90,"ins",{x:c.A*.012});return c.tk+" 화재 — 보험금으로 복구 예정"}fxc(c,-c.A*.012);c.ru=Math.max(c.ru||0,2);fxm(c,.15);return c.tk+" 생산 기지 이전 결정"},ai:()=>["fix",0]},
{id:"cyber",cat:"ops",t:"랜섬웨어 공격",w:()=>.7,el:c=>true,mk:c=>({mx:Math.max(1,Math.round(c.A*.004))}),b:(c,x)=>"해커가 "+c.tk+" 전산망을 잠그고 몸값 "+F(x.mx)+"을 요구합니다. 협상, 자체 복구, 공개 중 고르세요.",
sl:x=>({lab:"몸값 협상액",min:0,max:x.mx,step:Math.max(.1,+(x.mx/20).toFixed(1)),u:"억"}),sv:(c,x)=>x.mx*.5,o:[["몰래 협상해 지불","pay"],["자체 복구","own"],["공개하고 복구","pub"]],
pr:(c,x,v)=>["복구 확률 "+pct0(.3+.6*v/x.mx)+" · 30% 확률로 나중에 유출 논란","자체 복구: 차질 2분기, 비용 "+F(c.A*.003),"공개: 주가 −4%, 차질 1분기, 뒤탈 없음"],
go:(c,x,k,v)=>{if(k==="pay"){fxc(c,-v);if(rnd()>=.3+.6*v/x.mx)c.ru=Math.max(c.ru||0,2);if(rnd()<.3)evQ(c,40+(rnd()*80|0),"leak",{});return c.tk+" 랜섬웨어 대응 완료"}if(k==="own"){fxc(c,-c.A*.003);c.ru=Math.max(c.ru||0,2);fxj(c,-.02);return c.tk+" 랜섬웨어 자체 복구"}fxj(c,-.04);c.ru=Math.max(c.ru||0,1);return c.tk+" 해킹 피해 공개 후 복구"},ai:()=>["pub",0]},
{id:"supply",cat:"ops",t:"공급망 차질",w:()=>.8,el:c=>!c.kd&&c.i!==HOLD,mk:()=>({}),b:c=>c.tk+"의 핵심 부품 공급사가 생산을 멈췄습니다.",o:[["비싼 대체 공급처","alt"],["감산","cut"],["재고로 버틴다","inv"]],
pr:()=>["대체: 1년간 마진 소폭 하락","감산: 매출 차질 2분기","재고: 50% 무사히 넘기고 50%면 차질 3분기"],go:(c,x,k)=>{if(k==="alt"){fxm(c,-.12);evQ(c,360,"mg",{x:.12});return c.tk+" 대체 공급처 확보"}if(k==="cut"){c.ru=Math.max(c.ru||0,2);return c.tk+" 감산 결정"}if(rnd()<.5)return c.tk+" 재고로 공급 차질을 넘겼습니다";c.ru=Math.max(c.ru||0,3);fxj(c,-.05);return c.tk+" 재고 소진 — 생산 중단"},ai:()=>["alt",0]},
{id:"bid",cat:"ops",t:"대형 수주 입찰",w:()=>.9,el:c=>[2,8,9,11,16,17,24,26,0,22].includes(c.i),mk:()=>({}),b:c=>c.tk+"가 몇 년 치 매출이 걸린 대형 프로젝트 입찰에 참여합니다. 마진을 높게 쓰면 이익은 크지만 따내기 어려워요.",
sl:()=>({lab:"입찰 마진",min:0,max:20,step:1,u:"%"}),sv:()=>8,o:[["입찰","go"],["불참","no"]],pr:(c,x,v)=>["수주 확률 "+pct0(Math.max(.05,Math.min(.9,.9-v*.04)))+" · 수주하면 1년간 이익 +"+F(c.A*(.001+v*.0002)*4),"불참"],
go:(c,x,k,v)=>{if(k==="no")return c.tk+" 입찰 불참";if(rnd()<Math.max(.05,Math.min(.9,.9-v*.04))){c.ebk=S.day+360;c.bkm=v;fxj(c,.04+v*.002);return c.tk+" 대형 프로젝트 수주! (마진 "+v+"%)"}fxj(c,-.02);return c.tk+" 대형 수주 실패"},ai:()=>["go",8]},
{id:"launch",cat:"ops",t:"신제품 출시",w:()=>.9,el:c=>[0,2,6,7,19,20,21,22,27,28,31].includes(c.i),mk:c=>({mx:Math.max(1,Math.round(c.A*.01))}),b:(c,x)=>c.tk+"가 야심작을 출시합니다. 마케팅 예산을 정하세요.",
sl:x=>({lab:"마케팅 예산",min:0,max:x.mx,step:Math.max(.1,+(x.mx/20).toFixed(1)),u:"억"}),sv:(c,x)=>x.mx*.5,o:[["출시","go"]],pr:(c,x,v)=>["흥행 확률 "+pct0(Math.min(.92,.25+.5*Math.pow(v/x.mx,.6)+(c.hq||0)*.1))+" · 흥행하면 마진 상승과 주가 +8%"],
go:(c,x,k,v)=>{fxc(c,-v);if(rnd()<Math.min(.92,.25+.5*Math.pow(v/x.mx,.6)+(c.hq||0)*.1)){fxn(c,.06);c.edge=(c.edge||0)+.002;fxj(c,.08);return c.tk+" 신제품 대박!"}fxj(c,-.05);return c.tk+" 신제품 반응 미지근"},ai:(c,x)=>["go",x.mx*.5]},
{id:"custloss",cat:"ops",t:"핵심 고객 이탈 위기",w:()=>.7,el:c=>!c.kd&&c.i!==HOLD,mk:()=>({}),b:c=>c.tk+" 매출의 큰 몫을 차지하는 고객사가 경쟁사로 옮기려 합니다.",o:[["가격 인하로 붙잡기","price"],["신규 고객 개척","new"]],
pr:c=>["가격 인하: 마진 소폭 하락","개척: 비용 "+F(c.A*.004)+", 55% 성공, 실패하면 매출 차질"],go:(c,x,k)=>{if(k==="price"){fxm(c,-.15);return c.tk+" 가격을 낮춰 고객 유지"}fxc(c,-c.A*.004);if(rnd()<.55)return c.tk+" 신규 고객 확보 성공";c.ru=Math.max(c.ru||0,2);fxj(c,-.06);return c.tk+" 핵심 고객 이탈"},ai:()=>["price",0]},
{id:"cost",cat:"ops",t:"원가 급등",w:()=>.8,el:c=>!c.kd&&c.i!==HOLD,mk:()=>({}),b:c=>c.tk+"의 원재료 가격이 급등했습니다.",o:[["판매가 인상","pass"],["마진 감수","eat"],["원자재 헤지","hedge"]],
pr:()=>["가격 인상: 점유율 일부 손실","감수: 1년간 마진 하락","헤지: 비용 조금, 마진 거의 유지"],go:(c,x,k)=>{if(k==="pass"){c.A*=.98;fxj(c,-.02);return c.tk+" 판매가 인상"}if(k==="eat"){fxm(c,-.2);evQ(c,360,"mg",{x:.2});return c.tk+" 원가 부담을 떠안았습니다"}fxc(c,-c.A*.002);fxm(c,-.05);evQ(c,360,"mg",{x:.05});return c.tk+" 원자재 헤지로 원가 방어"},ai:()=>["hedge",0]},
{id:"activist",cat:"fin",t:"행동주의 펀드 등장",w:()=>1,el:c=>!c.priv&&!c.kd&&(c.cs>mc(c)*.2||c.p<c.tg*.85),mk:c=>({st:+(6+rnd()*4).toFixed(1)}),b:(c,x)=>"행동주의 펀드가 "+c.tk+" 지분 "+x.st+"%를 사들이고 자사주 매입과 배당 확대를 요구합니다. 거부하면 위임장 대결이 벌어져요.",
o:[["요구 수용 (자사주 5% 매입)","yes"],["거부 (위임장 대결)","no"],["백기사 유치 (신주 10%)","wk"]],pr:(c,x)=>{const g=grp(c,"P"),w=Math.min(.95,(g+12)/(g+x.st+25));return["수용: 회사 현금으로 자사주 5% 매입, 주가 +5%","거부: 대결 승리 확률 "+pct0(w)+" (지면 특별배당·이사회 진입)","백기사: 우호 회사에 신주 10% 배정"]},
go:(c,x,k)=>{if(k==="yes"){const x2=mc(c)*.05*1.05;if(c.cs>=x2){c.cs-=x2;c.sh*=.95;rescale(c,1/.95);fxj(c,.05);ctlAll()}return c.tk+" 행동주의 요구 수용 — 자사주 매입"}if(k==="wk"&&mine(c)){G.wk(c.id,10);return c.tk+" 백기사 유치"}
const g=grp(c,"P"),w=Math.min(.95,(g+12)/(g+x.st+25));if(rnd()<w){fxj(c,-.02);return c.tk+" 위임장 대결 승리"}const d=Math.max(0,c.cs*.3);c.cs-=d;payDiv(c,d);fxm(c,-.15);fxj(c,.04);return c.tk+" 위임장 대결 패배 — 특별배당 "+F(d)+", 펀드 측 이사 선임"},ai:()=>["yes",0]},
{id:"offer",cat:"fin",t:"인수 제안 도착",w:()=>.7,el:c=>!c.priv&&!c.kd&&mine(c)&&mc(c)>50,mk:c=>{const a=S.co.filter(z=>!z.dead&&!z.priv&&!mine(z)&&z.i===c.i&&mc(z)>mc(c)*1.5&&z.cs>mc(c)*.3).sort((p,q)=>q.cs-p.cs)[0];return{a:a?a.id:-1,pr:Math.round(25+rnd()*20)}},
b:(c,x)=>{const a=S.co[x.a];return a?a.tk+"가 "+c.tk+"를 주당 "+W(c.p*(1+x.pr/100))+" (프리미엄 "+x.pr+"%)에 통째로 사겠다고 제안했습니다. 수락하면 내 그룹 지분이 현금이 됩니다.":"인수 제안이 철회됐습니다."},
o:[["수락 (매각)","yes"],["거절","no"],["프리미엄 +10%p 역제안","more"]],pr:(c,x)=>["수락: 내 그룹 몫 약 "+F(mc(c)*(1+x.pr/100)*grp(c,"P")/100)+" 현금화","거절: 주가가 제안가 쪽으로 조금 오름","역제안: 50% 확률로 수락"],
go:(c,x,k)=>{const a=S.co[x.a];if(!a||a.dead)return"인수 제안 철회";let pr=x.pr;if(k==="more"){if(rnd()<.5)pr+=10;else{fxj(c,.02);return a.tk+"가 역제안을 거절했습니다"}}else if(k==="no"){fxj(c,.03);return c.tk+" 인수 제안 거절"}
const P=mc(c)*(1+pr/100);settleX(c,1+pr/100);for(const h of Object.keys(c.own)){if(h==="c"+a.id)continue;const v=payK(c,h,c.own[h]/100*P);if(h==="P")L("💰 "+c.tk+" 매각 대금 "+F(v),1)}a.cs-=P*(100-(c.own["c"+a.id]||0))/100;if(a.cs<0){a.D-=a.cs;a.cs=0}for(const h of Object.keys(c.own))if(h!=="c"+a.id)setOwn(c,h,0);S.st.ma++;absorb(a,c,P);ctlAll();return c.tk+"를 "+a.tk+"에 프리미엄 "+pr+"%로 매각했습니다"},ai:()=>["no",0]},
{id:"downgrade",cat:"fin",t:"신용등급 강등 경고",w:()=>1,el:c=>!c.kd&&rating(c)>=3&&rating(c)<6,mk:()=>({}),b:c=>"신용평가사가 "+c.tk+"(현재 "+RT[rating(c)]+")의 등급 강등을 검토 중입니다. 강등되면 이자 부담이 커져요.",
o:[["자산 15% 팔아 빚 갚기","sell"],["유상증자 10%","iss"],["그대로 간다","no"]],pr:()=>["매각: 빚이 줄어 등급 방어","증자: 지분 희석, 등급 방어","무시: 50% 강등 (주가 −5%, 이자 부담↑)"],
go:(c,x,k)=>{if(k==="sell"){const a=c.A*.15;c.A-=a;const r=a*.9;const p=Math.min(r,loanOf(c));c.D-=p;c.cs+=r-p;return c.tk+" 자산 매각으로 부채 축소"}if(k==="iss"&&!c.priv){const r=mc(c)*.1*.95;c.cs+=r;c.sh*=1.1;rescale(c,1/1.1);fxj(c,-.03);ctlAll();return c.tk+" 유상증자로 재무구조 개선"}if(rnd()<.5){fxj(c,-.05);fxm(c,-.1);return c.tk+" 신용등급 강등"}return c.tk+" 신용등급 유지"},ai:()=>["sell",0]},
{id:"payout",cat:"fin",t:"주주총회: 배당 확대 요구",w:()=>.7,el:c=>!c.priv&&c.pay<.25&&c.cs>c.A*.08&&c.ni>0,mk:()=>({}),b:c=>c.tk+" 주주들이 쌓아 둔 현금을 배당으로 돌려 달라고 요구합니다. 배당성향을 정하세요.",
sl:()=>({lab:"배당성향",min:0,max:80,step:5,u:"%"}),sv:()=>30,o:[["이 배당성향으로","go"]],pr:(c,x,v)=>["주주 반발 확률 "+pct0(Math.max(0,.6-v/80))+" (반발하면 주가 −4%) · 지금 "+Math.round(c.pay*100)+"%"],
go:(c,x,k,v)=>{const o=c.pay;c.pay=v/100;fxj(c,(c.pay-o)*.08);if(rnd()<Math.max(0,.6-v/80)){fxj(c,-.04);return c.tk+" 배당성향 "+v+"% — 주주 반발"}return c.tk+" 배당성향 "+v+"%로 결정"},ai:()=>["go",35]},
{id:"buyback",cat:"fin",t:"자사주 매입 제안",w:()=>.7,el:c=>!c.priv&&c.cs>mc(c)*.15&&c.p<c.tg,mk:()=>({}),b:c=>c.tk+" 재무 담당이 주가가 적정가보다 낮다며 자사주 매입을 건의합니다.",sl:()=>({lab:"매입 규모",min:0,max:10,step:1,u:"%"}),sv:()=>5,o:[["매입","go"]],
pr:(c,x,v)=>["비용 약 "+F(mc(c)*v/100*1.05)+" (회사 현금 "+F(c.cs)+") · 남은 주주 지분율 상승"],go:(c,x,k,v)=>{if(!v)return c.tk+" 자사주 매입 보류";const n=Math.min(v,pub(c)-1),x2=mc(c)*n/100*1.05;if(n<=0||c.cs<x2)return c.tk+" 자사주 매입 무산 (현금·물량 부족)";c.cs-=x2;c.sh*=1-n/100;rescale(c,1/(1-n/100));fxj(c,.03);ctlAll();return c.tk+" 자사주 "+n+"% 매입·소각"},ai:()=>["go",4]},
{id:"nation",cat:"ctry",t:"국유화 위협",w:c=>ctr(c).pol*2,el:c=>ctr(c).pol>=.4&&!c.kd,mk:()=>({}),b:c=>CTRY[c.cty][0]+" 정부가 "+c.tk+"를 전략 산업으로 지정하고 지분을 요구합니다.",o:[["협상: 30%를 정부에 매각","deal"],["버티기","hold"],["본사 이전 (싱가포르)","move"]],
pr:c=>["협상: 신주 30%를 시가 70%에 정부에 발행","버티기: "+pct0(ctr(c).pol*.3)+" 확률로 국유화 (시가 50% 보상)","이전: 비용 "+F(c.A*.03)+", 정치 위험 해소"],
go:(c,x,k)=>{if(k==="deal"){const N=c.sh*.3/.7,cash=N*c.p*.7/1e4;rescale(c,.7);c.sh+=N;c.cs+=cash;c.p*=.93;ctlAll();return c.tk+" 정부에 지분 30% 매각"}if(k==="move"){fxc(c,-c.A*.03);c.cty=2;return c.tk+" 본사를 싱가포르로 이전"}if(rnd()<ctr(c).pol*.3){const t=c.tk+" 국유화! 시가의 50% 보상";kill(c,.5);return t}fxj(c,-.03);return c.tk+" 정부 압박을 버텼습니다"},ai:()=>["deal",0]},
{id:"cut",cat:"ind",t:"업황 부진: 감산 결정",w:()=>1.4,el:c=>arOf(c.i)==="cyc"&&cycV(c.i)<-.25,mk:()=>({}),b:c=>SEC[c.i][0]+" 업황이 바닥입니다. "+c.tk+"가 감산하면 업계 공급이 줄어 가격이 회복될 수 있지만, 경쟁사가 안 따라오면 점유율만 잃어요.",
sl:()=>({lab:"감산 폭",min:0,max:20,step:1,u:"%"}),sv:()=>8,o:[["감산","go"]],pr:(c,x,v)=>["경쟁사 동참 확률 "+pct0(.25+v*.025+share(c)*.6)+" · 동참하면 업황 회복이 앞당겨져요"],
go:(c,x,k,v)=>{if(!v)return c.tk+" 감산 없음";c.g=Math.max(-.2,c.g-v/100);c.ru=Math.max(c.ru||0,1);if(rnd()<.25+v*.025+share(c)*.6){S.icy[c.i].ph+=.6;S.ns[c.i]=(S.ns[c.i]||0)+.04;S.d[c.i]+=.004;eco("🔄 "+SEC[c.i][0]+" 업계 동반 감산 — 업황 회복 기대");return c.tk+" 감산 "+v+"% — 경쟁사들도 따라왔습니다"}c.A*=1-v/300;return c.tk+" 감산 "+v+"% — 경쟁사는 버텼습니다"},ai:()=>["go",6]},
{id:"freight",cat:"ind",t:"운임 계약 갱신",w:()=>1,el:c=>arOf(c.i)==="trans"||c.i===16,mk:()=>({}),b:c=>c.tk+"의 주요 운송 계약이 만료됩니다. 장기 고정 계약과 시세(스팟) 계약 중 고르세요.",o:[["장기 고정","fix"],["스팟 운임","spot"]],
pr:()=>["고정: 1년간 이익 안정 (소폭 +)","스팟: 50%면 큰 이익, 50%면 손실"],go:(c,x,k)=>{if(k==="fix"){c.edge=(c.edge||0)+.0008;return c.tk+" 장기 운송 계약 체결"}if(rnd()<.5){c.edge=(c.edge||0)+.004;evQ(c,360,"edge",{x:-.004});fxj(c,.04);return c.tk+" 스팟 운임 급등 수혜"}c.edge=(c.edge||0)-.003;evQ(c,360,"edge",{x:.003});fxj(c,-.04);return c.tk+" 스팟 운임 급락 타격"},ai:()=>["fix",0]},
{id:"reins",cat:"ind",t:"재해 시즌 대비",w:()=>1.2,el:c=>c.kd===2,mk:()=>({}),b:c=>"올해 대형 재해 위험이 높다는 예보입니다. "+c.tk+"는 재보험으로 위험을 나눌 수 있어요.",o:[["재보험 가입","re"],["자체 감당","self"]],
pr:c=>["재보험: 비용 "+F(c.A*.003)+", 재해 손실 절반","자체: 40% 확률로 재해 손실 "+F(c.A*.03)],go:(c,x,k)=>{if(k==="re")fxc(c,-c.A*.003);if(rnd()<.4){const l=c.A*.03*(k==="re"?.5:1);c.cat=(c.cat||0)+l;fxj(c,-.05*(k==="re"?.5:1));return c.tk+" 대형 재해 보험금 "+F(l)}return c.tk+" 재해 시즌 무사히 통과"},ai:()=>["re",0]},
{id:"npl",cat:"ind",t:"부실채권 급증",w:()=>1.2,el:c=>c.kd===1,mk:()=>({}),b:c=>c.tk+" 은행의 연체율이 오르고 있습니다. 충당금을 지금 쌓을지, 미룰지 정하세요.",o:[["충당금 대폭 적립","prov"],["미루기","delay"]],
pr:c=>["적립: 이번 분기 비용 "+F(c.A*.006),"미루기: 45% 확률로 나중에 "+F(c.A*.012)+" 손실·주가 −10%·주목도 +3"],go:(c,x,k)=>{if(k==="prov"){fxc(c,-c.A*.006);c.llr=(c.llr||0)+c.A*.006;fxj(c,-.02);return c.tk+" 대손충당금 선제 적립"}if(rnd()<.45)evQ(c,120,"npl",{});return c.tk+" 충당금 적립 연기"},ai:()=>["prov",0]},
{id:"trial",cat:"ind",t:"임상 3상 진입",w:()=>1.2,el:c=>c.i===4,mk:c=>({mx:Math.max(1,Math.round(c.A*.02))}),b:(c,x)=>c.tk+" 신약 후보가 임상 3상에 들어갑니다. 연구비를 더 쓰면 성공 확률이 올라가요. 결과는 3~6개월 뒤에 나옵니다.",
sl:x=>({lab:"추가 연구비",min:0,max:x.mx,step:Math.max(.1,+(x.mx/20).toFixed(1)),u:"억"}),sv:(c,x)=>x.mx*.5,o:[["진행","go"],["기술 이전 (라이선스 매각)","sell"]],pr:(c,x,v)=>["성공 확률 "+pct0(Math.min(.85,.28+.35*v/x.mx+(c.hq||0)*.15))+" · 성공 +25%, 실패 −20%","라이선스 매각: 현금 "+F(x.mx*.8)+" 확보, 결과와 무관"],
go:(c,x,k,v)=>{if(k==="sell"){fxc(c,x.mx*.8);fxj(c,.02);return c.tk+" 신약 후보 기술 이전 ("+F(x.mx*.8)+")"}fxc(c,-v);evQ(c,90+(rnd()*90|0),"trial",{p:Math.min(.85,.28+.35*v/x.mx+(c.hq||0)*.15)});return c.tk+" 임상 3상 개시"},ai:(c,x)=>["go",x.mx*.4]}];
// decision rights
function evWho(c){if(S.ceo===c.id&&mine(c))return"ceo";if(mine(c))return"own";if((c.own.P||0)>0||grp(c,"P")>0)return"min";return"none"}
const evInt=c=>Math.max(.15,Math.min(.98,.2+(grp(c,"P")-20)*.025+(grp(c,"P")>=50?.3:0)));
// pick an event for one of my companies (player decisions) — frequency and categories come from settings
function pickEvent2(){const cfg=S.cfg||{},my=S.co.filter(c=>mine(c)&&!c.dead),cand=[];for(const c of my)for(const e of EV2){if(!(cfg.evc||{})[e.cat]&&cfg.evc)continue;if(e.el(c))cand.push([e,c,e.w(c)])}
if(S.cheat&&rnd()<.35)return pickEvent();if(!cand.length)return pickEvent();let t=0;for(const x of cand)t+=x[2];let r=rnd()*t,pick=cand[0];for(const x of cand){r-=x[2];if(r<=0){pick=x;break}}
const[e,c]=pick,x=e.mk(c);if(e.id==="offer"&&x.a<0)return;const sl=e.sl?e.sl(x):null;S.ev2={id:e.id,c:c.id,x,v:sl?+(e.sv(c,x)).toFixed(2):0,m:evWho(c)};S.cst&&S.cst.ev++;evMd()}
function evMd(){const ev=S.ev2;if(!ev)return;const e=EV2.find(z=>z.id===ev.id),c=S.co[ev.c];if(!e||!c||c.dead){S.ev2=null;return}
if(ev.m==="own"){const[k,v]=e.ai(c,ev.x),j=e.o.findIndex(o=>o[1]===k),lab=e.o[j]?e.o[j][0]:k;mdl={t:"📋 "+e.t+" · "+c.tk,b:e.b(c,ev.x),h:`<div class="card" style="margin-top:6px"><b>경영진 결정안</b><div style="margin-top:4px">${esc(lab)}${e.sl?" · "+esc(e.sl(ev.x).lab)+" "+(+v).toFixed(1)+e.sl(ev.x).u:""}</div><div class="mu" style="margin-top:4px;line-height:1.55">${esc(e.pr(c,ev.x,v)[Math.max(0,j)]||"")}</div></div><div class="mu" style="line-height:1.6">당신은 ${c.tk}의 지배주주(그룹 ${grp(c,"P").toFixed(1)}%)지만 CEO가 아니에요. 경영진에게 맡기거나, 이사회를 움직여 직접 결정할 수 있어요. 개입 성공 확률 ${pct0(evInt(c))}. CEO가 되면 늘 직접 결정합니다.</div>`,o:[["경영진에게 맡기기","mg"],["개입한다 ("+pct0(evInt(c))+")","int"]],ev2:1};S.sp0=S.spd||S.sp0;S.spd=0;return}
const sl=e.sl?e.sl(ev.x):null,pr=e.pr(c,ev.x,ev.v);mdl={t:(ev.m==="int"?"🗳 ":"⚡ ")+e.t+" · "+c.tk,b:e.b(c,ev.x),h:(sl?`<div class="nmw"><div class="row"><span class="mu">${esc(sl.lab)}</span><b id="evv">${(+ev.v).toFixed(sl.step<1?1:0)}${sl.u}</b></div><input type="range" id="evs" min="${sl.min}" max="${sl.max}" step="${sl.step}" value="${ev.v}" oninput="G.evSl(this.value)" aria-label="${esc(sl.lab)}"></div>`:"")+
`<div id="evp" class="card mu" style="line-height:1.6;white-space:normal">${pr.map((t,j)=>"<b>"+esc(e.o[j]?e.o[j][0]:"")+"</b> — "+esc(t)).join("<br>")}</div><div class="mu">분류: ${EVC[e.cat]} · ${ev.m==="int"?"이사회 승인을 받아 직접 결정합니다":"CEO로서 직접 결정합니다"}</div>`,o:e.o.map(o=>[o[0],o[1]]),ev2:1};S.sp0=S.spd||S.sp0;S.spd=0}
G.evSl=v=>{const ev=S.ev2;if(!ev)return;ev.v=+v;const e=EV2.find(z=>z.id===ev.id),c=S.co[ev.c],sl=e.sl(ev.x),a=$("evv"),p=$("evp");if(a)a.textContent=(+v).toFixed(sl.step<1?1:0)+sl.u;if(p)p.innerHTML=e.pr(c,ev.x,+v).map((t,j)=>"<b>"+esc(e.o[j]?e.o[j][0]:"")+"</b> — "+esc(t)).join("<br>")};
G.ev2Pick=k=>{const ev=S.ev2;if(!ev)return closeMd();const e=EV2.find(z=>z.id===ev.id),c=S.co[ev.c];if(!e||!c||c.dead){S.ev2=null;closeMd();return render()}
if(ev.m==="own"){if(k==="int"){if(rnd()<evInt(c)){ev.m="int";evMd();return render()}const[a,v]=e.ai(c,ev.x);S.ev2=null;closeMd();const t=e.go(c,ev.x,a,v);L("🗳 이사회가 개입을 거부해 경영진 안대로 진행: "+t,1);return render()}const[a,v]=e.ai(c,ev.x);S.ev2=null;closeMd();L("📋 경영진 결정: "+e.go(c,ev.x,a,v),1);return render()}
S.ev2=null;closeMd();const t=e.go(c,ev.x,k,ev.v);S.cst&&(S.cst.evd++);L("⚡ "+t,1);render()};
// AI-run companies live through the same events (management decides); holders of a minority stake hear about it
function aiEvent(){const a=S.co.filter(c=>!c.dead&&!c.priv&&!mine(c));if(!a.length)return;const c=a[rnd()*a.length|0],es=EV2.filter(e=>e.id!=="offer"&&e.el(c));if(!es.length)return;const e=es[rnd()*es.length|0],x=e.mk(c),[k,v]=e.ai(c,x),t=e.go(c,x,k,v);
eco("📰 "+e.t+": "+t);if((c.own.P||0)>0||grp(c,"P")>0)L("📰 보유 종목 "+e.t+" — "+t+" (경영진 결정)",1)}
// delayed consequences
function evqTick(){if(!S.evq||!S.evq.length)return;S.evq=S.evq.filter(q=>{if(q.d>S.day)return true;const c=S.co[q.c];if(!c||c.dead)return false;const me=mine(c)||c.own.P>0;let t="";
if(q.k==="cover"){fxj(c,-.18);fxn(c,-.05);if(mine(c))S.heat+=5;t="🔥 "+c.tk+" 리콜 축소 은폐 논란! 주가 급락"}else if(q.k==="leak"){fxj(c,-.12);if(mine(c))S.heat+=6;t="🔥 "+c.tk+" 해킹 피해 은폐 사실 유출"}
else if(q.k==="ins"){fxc(c,q.v.x);t=c.tk+" 화재 보험금 "+F(q.v.x)+" 수령"}else if(q.k==="mg"){fxm(c,q.v.x)}else if(q.k==="edge"){c.edge=(c.edge||0)+q.v.x}
else if(q.k==="npl"){fxc(c,-c.A*.012);fxj(c,-.1);if(mine(c))S.heat+=3;t="🏦 "+c.tk+" 부실채권 손실 뒤늦게 반영 — 주가 급락"}
else if(q.k==="trial"){const ok=rnd()<q.v.p;fxj(c,ok?.25:-.2);fxn(c,ok?.15:-.1);if(ok)c.edge=(c.edge||0)+.004;t="🧪 "+c.tk+(ok?" 임상 3상 성공! 신약 허가 신청":" 임상 3상 실패")}
if(t){eco(t);if(me)L(t,1)}return false})}

// ---- v12 AI: hidden quality & research, coach (game-over / yearly / company), legend difficulty, investor personas, spectate mode ----
// ===== hidden quality: every company has a future the market can't see yet (13-1). It shows up in earnings over ~3 years. =====
const TBK=["분식회계","숨은 부채","소송 폭탄","품질 은폐"];
function hqInit(c,ipo){c.hq=+Math.max(-1,Math.min(1,(ipo?.7:.45)*gz())).toFixed(3);c.hqb=c.edge||0;if(rnd()<(ipo?.08:.05))c.tb={d:S.day+180+(rnd()*1800|0),s:+(.25+rnd()*.4).toFixed(2),k:TBK[rnd()*4|0]}}
function hqQ(){for(const c of S.co){if(c.dead||c.hq==null)continue;if(!c.kd&&c.i!==HOLD){const t=(c.hqb||0)+c.hq*.006;c.edge=(c.edge||0)+(t-(c.edge||0))*.08;if(!mine(c)&&!c.ap)c.g=Math.max(-.05,Math.min(.25,c.g+(c.hq*.02-(c.g-.04))*.05))}
if(c.tb&&S.day>=c.tb.d){const b=c.tb;c.tb=null;c.jx=(c.jx||0)-b.s;c.nf=(c.nf||0)-b.s*.6;if(b.k==="분식회계"){c.A*=.9;if(mine(c))S.heat+=8}else if(b.k==="숨은 부채")c.D+=c.A*.1;else if(b.k==="소송 폭탄"){c.cs-=c.A*.05;if(c.cs<0){c.D-=c.cs;c.cs=0}}else c.edge-=.003;
const t="💣 "+c.tk+" "+b.k+" 사실이 드러났습니다! 주가 급락 (−"+(b.s*100).toFixed(0)+"%)";eco(t);if(c.own.P||mine(c))L(t,1);S.rs[c.id]&&(S.rs[c.id].bx=1)}}}
// paid research: costs money and time; deeper research sees the hidden future more clearly and finds time bombs
const RST=[["기본 리서치","공개 자료와 업계 탐문",7,.2,.00005,1,.5,.2],["심층 실사","현장 방문·경영진 인터뷰·공급망 조사",30,.8,.0003,3,.25,.6],["전문가 네트워크","전직 임원·업계 전문가 자문과 데이터 분석",60,3,.001,6,.1,.9]];
const rsCost=(c,t)=>RST[t][3]+RST[t][4]*(c.priv?eq(c):mc(c));
G.rsr=(i,t)=>{const c=S.co[i],r=RST[t],cost=rsCost(c,t),cr=S.rc>=r[5];const cur=S.rs[i];if(cur&&cur.d>S.day)return toast("이미 리서치가 진행 중이에요 ("+(cur.d-S.day)+"일 남음)");
if(!cr&&!ePay("P",cost))return toast("리서치 비용 "+F(cost)+"이 필요해요");if(cr)S.rc-=r[5];S.rs[i]={t,d:S.day+r[2],st:S.day};rec(r[0],c,cr?0:cost,"나");toast(c.tk+" "+r[0]+" 의뢰 · "+r[2]+"일 뒤 결과"+(cr?" (크레딧 "+r[5]+" 사용)":""));render()};
function rsTick(){for(const id in S.rs){const r=S.rs[id];if(r.q!=null||r.d>S.day)continue;const c=S.co[id];if(!c||c.dead){delete S.rs[id];continue}const z=RST[r.t];r.q=+Math.max(-1.5,Math.min(1.5,(c.hq||0)+z[6]*gz())).toFixed(2);r.cf=z[6];
r.bomb=c.tb&&rnd()<z[7]?c.tb.k:null;r.dn=S.day;const t="🔬 "+c.tk+" "+z[0]+" 결과: 숨은 경쟁력 "+hqLab(r.q)+(r.bomb?" · ⚠ "+r.bomb+" 의심!":"");L(t,1)}}
const hqLab=q=>q>.6?"매우 강함":q>.25?"강함":q>-.25?"보통":q>-.6?"약함":"매우 약함";

// ===== coach: diagnoses from what actually happened =====
function coachDay(){const s=S.cst;if(!s)return;const w=nw();s.pk=Math.max(s.pk||w,w);s.dd=Math.max(s.dd||0,1-w/Math.max(1,s.pk));s.lev=Math.max(s.lev||0,S.loan/Math.max(1,w));
if(S.day%360===1){s.w0=w;s.i0=S.ix}if(S.day%360===0&&S.day>0){const y=(S.y0||2027)+S.day/360-1;s.y.push({y,w0:s.w0||S.n0,w1:w,i0:s.i0||100,i1:S.ix,ctl:S.co.filter(mine).length});if(s.y.length>30)s.y.shift();if(!S.cfg.spec)note("📅 "+y+"년 연간 리뷰가 도착했어요 — 메뉴의 AI 코치에서 확인하세요")}}
function coachTips(){const w=nw(),s=S.cst||{},out=[],my=S.co.filter(mine),hs=S.co.filter(c=>c.own.P&&!c.dead),tot=hs.reduce((a,c)=>a+val(c),0),top=hs.sort((a,b)=>val(b)-val(a))[0];
const yrs=Math.max(.25,S.day/360),cagr=(Math.pow(Math.max(.01,w)/Math.max(1,S.n0),1/yrs)-1)*100,ixc=(Math.pow(S.ix/100,1/yrs)-1)*100;
out.push(cagr>ixc+3?[0,"시장을 이기고 있어요","연평균 "+cagr.toFixed(1)+"% vs 종합지수 "+ixc.toFixed(1)+"%. 지금 방식이 통하고 있습니다.","strat"]:cagr<ixc-3?[2,"지수보다 못한 성적","연평균 "+cagr.toFixed(1)+"% vs 종합지수 "+ixc.toFixed(1)+"%. 아무것도 안 하고 인덱스 ETF(KALL)만 샀어도 더 나았을 거예요. 거래 비용과 성급한 매매를 줄여 보세요.","etf"]:[1,"시장과 비슷한 성적","연평균 "+cagr.toFixed(1)+"% vs 종합지수 "+ixc.toFixed(1)+"%.","strat"]);
if((s.lev||0)>2)out.push([3,"빚을 너무 많이 썼어요","개인 대출이 한때 순자산의 "+s.lev.toFixed(1)+"배였어요. 3배를 넘으면 마진콜로 바닥에서 강제로 팔립니다. 차입은 회사(신용등급·회사채)에 맡기는 게 원작 고수들의 방식이에요.","risk"]);
if(s.mc||s.fl)out.push([s.fl?3:2,"마진콜 "+(s.mc||0)+"회 · 강제 청산 "+(s.fl||0)+"회","선물·옵션 증거금이 모자라 돈을 더 넣거나 강제로 정리당했어요. 포지션 크기를 순자산의 몇 배 이하로 정해 두세요.","fut2"]);
if(s.lq)out.push([3,"코인 레버리지 청산 "+s.lq+"회","레버리지 50배면 2%만 반대로 움직여도 증거금이 사라집니다. 코인 하루 변동은 3~8%예요.","coin"]);
if((s.dd||0)>.5)out.push([3,"최대 낙폭 "+(s.dd*100).toFixed(0)+"%","한때 고점 대비 절반 넘게 잃었어요. 50%를 잃으면 100%를 벌어야 본전입니다. 분산과 현금 비중으로 낙폭을 줄이세요.","risk"]);
if(top&&tot>0&&val(top)/tot>.6&&hs.length>1)out.push([2,"한 종목 집중","주식의 "+(val(top)/tot*100).toFixed(0)+"%가 "+top.tk+" 하나예요. 경영권을 위한 집중이 아니라면 위험합니다.","risk"]);
if(S.cash>w*.6&&S.day>360)out.push([1,"현금이 놀고 있어요","순자산의 "+(S.cash/Math.max(1,w)*100).toFixed(0)+"%가 현금입니다. 국채·고배당 ETF·우량주로 일하게 하거나, 인수 실탄으로 계획을 세우세요.","bond"]);
const bad=my.filter(c=>rating(c)>=5);if(bad.length)out.push([2,"부실한 자회사","신용 B 이하: "+bad.map(c=>c.tk).join(", ")+". 이자 부담이 이익을 갉아먹어요. 자산 매각·증자로 부채를 줄이세요.","debt"]);
const ms=SEC.map((_,i)=>i!==HOLD?myShare(i):0),mx=Math.max(...ms);if(mx>.45)out.push([2,"독점금지 위험",SEC[ms.indexOf(mx)][0]+" 점유율 "+(mx*100).toFixed(0)+"%. 50%를 넘으면 소송·과징금이 옵니다.","ind"]);
if(S.heat>40)out.push([2,"감독원이 지켜봐요","주목도 "+S.heat.toFixed(0)+". 위험한 제안은 거절하고 조세회피처 법인을 줄이세요.","tax"]);
const dh=S.co.filter(c=>!c.dead&&(c.own.P||0)>=5&&c.pay>0).length;if(dh>=3&&!my.some(c=>c.i===HOLD))out.push([1,"배당세를 줄일 수 있어요","직접 받는 배당에 40% 세금이 붙어요. 지주회사를 세워 현물출자하면 회사 간 배당은 비과세입니다.","tax"]);
const fn=S.fx.filter(p=>p.e==="P").reduce((a,p)=>a+fNot(p,fsp(p.u)),0);if(fn>w*3)out.push([2,"선물 노출이 커요","선물 계약 가치가 순자산의 "+(fn/Math.max(1,w)).toFixed(1)+"배예요. 10% 반대로 움직이면 순자산의 "+(fn/Math.max(1,w)*10).toFixed(0)+"%를 잃습니다.","fut2"]);
if(my.length===0&&S.day>720)out.push([1,"아직 경영권이 없어요","이 게임의 진짜 힘은 회사를 지배해 그 회사 돈으로 다음 회사를 사는 데 있어요. 시총 작은 회사부터 20%를 모아 보세요.","ctl"]);
if(s.bs&&s.lev>1.5)out.push([1,"블랙 스완은 레버리지를 노려요","블랙 스완을 "+s.bs+"번 겪었어요. 드물지만 꼭 옵니다. 빚 없는 사람은 버티고, 빚 많은 사람은 바닥에서 팔려요.","bsw"]);
if(s.ev)out.push([0,"사건 대응 "+s.ev+"회","직접 내린 결정 "+(s.evd||0)+"회. CEO가 되면 모든 사건을 직접 결정할 수 있어요.","aiplay"]);
return out.sort((a,b)=>b[0]-a[0])}
function overWhy(){if(S.over===2)return"감독원 주목도가 100인 상태에서 조사를 받아 구속됐어요. 위험한 제안(내부자 정보·분식·뇌물)을 거절하는 것이 가장 확실한 방어입니다.";if(S.over===3)return"스스로 은퇴했어요.";
const s=S.cst||{};if(s.fl||s.lq)return"파생상품 강제 청산이 연쇄로 일어나며 순자산이 0 아래로 떨어졌어요. 증거금 대비 포지션이 너무 컸습니다.";if((s.lev||0)>2.5)return"개인 대출로 산 주식이 떨어지며 마진콜이 연쇄로 왔어요. 바닥에서 강제로 팔려 회복할 기회를 잃었습니다.";
if(S.co.some(c=>c.sp>0))return"공매도한 주식이 올라 손실이 순자산을 넘었어요. 공매도 손실에는 한계가 없습니다.";return"보유 자산 가치가 빚보다 작아졌어요."}
// company coach for my companies (5): what a good operator would look at next
function coCoach(c){const out=[],a=arOf(c.i),r=rating(c),roe=c.ni*4/Math.max(1,eq(c)),sv=secAvg(c.i)||{},gap=S.dg[c.i]-S.cg[c.i],i=c.id;
out.push([1,ARN[a][0],ARN[a][1],null]);
if(r>=4)out.push([3,"빚이 너무 많아요","신용 "+RT[r]+". 이자율이 높고 은행이 대출을 회수할 수 있어요. 자산 일부를 팔거나 증자로 부채를 줄이세요.",["자산 매각",`G.adj(${i},'asell')`]]);
if(c.cs>c.A*.3&&!c.kd&&c.i!==HOLD)out.push([1,"현금이 많이 쌓였어요","현금 "+F(c.cs)+". 주가가 싸면 자사주 매입, 아니면 배당이나 같은 업종 인수에 쓰세요. 그냥 두면 수익률이 낮아요.",c.p<c.tg?["자사주 매입",`G.adj(${i},'bb')`]:["배당성향 조정",`G.adj(${i},'pay')`]]);
if(!c.kd&&c.i!==HOLD&&gap<-.01&&c.g>.06)out.push([2,"공급 과잉인데 확장 중","업종 수요 성장 "+(S.dg[c.i]*100).toFixed(1)+"% < 설비 증가 "+(S.cg[c.i]*100).toFixed(1)+"%. 성장률 "+Math.round(c.g*100)+"%로 설비를 늘리면 업종 마진이 더 떨어져요.",["성장률 조정",`G.adj(${i},'g')`]]);
if(!c.kd&&c.i!==HOLD&&gap>.01&&c.g<.06&&r<=2)out.push([1,"공급 부족 — 키울 때","수요가 설비보다 빨리 늘고 있어요. 지금 성장률을 올리면 높은 마진으로 점유율을 넓힐 수 있어요.",["성장률 조정",`G.adj(${i},'g')`]]);
if((a==="hit"||a==="plat"||a==="cyc")&&!(c.ps>0)&&!c.kd)out.push([1,PSN(c.i)+" 투자 없음","이 업종은 "+PSN(c.i)+"가 경쟁력의 원천이에요. 연 1~2%만 투자해도 몇 분기 뒤 마진이 올라갑니다.",["투자 설정",`G.adj(${i},'ps')`]]);
if(c.bond>0&&c.cpn>S.prime+SPR[r]+2)out.push([1,"비싼 회사채","쿠폰 "+c.cpn.toFixed(1)+"%인데 지금 새로 내면 약 "+(S.prime+SPR[r]+1).toFixed(1)+"%예요. 조기 상환 후 다시 발행하면 이자를 아낄 수 있어요.",["조기 상환",`G.bcall(${i})`]]);
if(!c.priv&&c.p>c.tg*1.35)out.push([1,"주가가 비싸요","적정가보다 "+P1((c.p/c.tg-1)*100)+" 높아요. 비싼 주식으로 증자하면 적은 지분으로 많은 현금을 모을 수 있어요(주식은 통화다).",["유상증자",`G.adj(${i},'iss')`]]);
if(!c.priv&&c.p<c.tg*.7&&c.cs>mc(c)*.1)out.push([1,"주가가 싸요","적정가보다 "+P1((c.p/c.tg-1)*100)+" 낮아요. 회사 현금으로 자사주를 사면 남은 주주(나)의 몫이 커집니다.",["자사주 매입",`G.adj(${i},'bb')`]]);
if(c.kd===1){const b=bisOf(c);if(b!=null)out.push([b<10.5?3:b<13?1:0,"BIS 비율 "+b.toFixed(1)+"%",b<8?"규제 기준 미달! 대출이 막혔어요. 위험 자산(서브프라임·소비자 대출)을 줄이거나 증자하세요.":b<10.5?"완충 기준(10.5%) 아래라 배당이 막힙니다.":"자본이 충분해요. 남는 자본으로 대출을 늘릴 수 있어요.",null])}
if(c.kd===2&&(S.uwc||0)>.3)out.push([0,"보험료가 비싼 하드 마켓","보험 시장이 하드 마켓이라 보험료가 높아 이익이 좋아요.",null]);
if(roe<.05&&c.i!==HOLD&&!c.kd)out.push([2,"자본 수익률이 낮아요","ROE "+(roe*100).toFixed(1)+"%"+(sv.roe!=null?" (업종 평균 "+sv.roe.toFixed(1)+"%)":"")+". 경영진 교체, 구조조정, 저수익 자산 매각을 검토하세요.",["구조조정",`G.mg(${i},'rs')`]]);
if(ctr(c).pol>=.4)out.push([2,"정치 위험 국가",CTRY[c.cty][0]+" 법인이라 국유화·자본 통제 위험이 있어요.",null]);
if(S.ceo!==i&&!c.priv)out.push([0,"CEO가 되면","CEO가 되면 연봉·보너스와 스톡옵션을 받고, 회사 사건을 늘 직접 결정해요.",["CEO 취임",`G.mg(${i},'ceo')`]]);
return out.sort((x,y)=>y[0]-x[0])}

// ===== investor personas and legend difficulty =====
DIF.push({n:"전설",cash:200,line:.8,rc:2.6,ra:2.4,d:"라이벌이 해마다 배우고 거장의 전략을 씁니다",leg:1});
Object.assign(RTY,{vg:["가치 거장","좋은 회사를 싼값에 사서 경영권을 쥐고 오래 갖고 갑니다. 보험사 현금을 즐겨 써요"],ag:["행동주의 거장","현금 많고 싼 회사 지분을 모아 자사주 매입·배당을 요구하고, 안 들으면 공개매수를 겁니다"],
mg:["매크로 거장","금리·경기·물가 흐름을 읽고 지수선물과 원자재로 크게 베팅합니다"],gg:["성장 거장","이익이 빠르게 느는데 아직 싼 중소형주를 넓게 담습니다"],qg:["퀀트 거장","수많은 종목을 조금씩, 추세 신호로 짧게 사고팝니다"]});
RTK.push("vg","ag","mg","gg","qg");RIV.push(["천년 밸류 파트너스","vg"],["강철 행동주의 펀드","ag"],["폭풍 매크로 캐피탈","mg"],["텐배거 그로스","gg"],["알고리즘 퀀트 랩","qg"]);
const PERS={vg:1,ag:1,mg:1,gg:1,qg:1};
const LSN={vg:"싸고 좋은 회사는 시간이 지나면 제값을 받는다 (가치 투자)",ag:"지분을 모아 경영진을 압박하면 숨은 가치를 끌어낼 수 있다 (행동주의)",mg:"금리·경기 같은 큰 흐름을 먼저 읽으면 시장 전체에 베팅할 수 있다 (매크로)",gg:"이익이 빠르게 늘면 PER이 높아 보여도 싸다 (PEG)",qg:"추세를 따르되 꺾이면 바로 자른다 (퀀트·손절)",idx:"싸게 분산해 오래 들고 가면 시장 평균은 번다 (인덱스)",val:"저PER 우량주를 오래 보유한다",act:"저평가 회사를 모아 공개매수로 차익을 낸다",mom:"오르는 종목을 따라간다",raid:"경영권을 잡은 회사의 돈으로 다음 회사를 산다 (레버리지 인수)"};
function rvPrep(r){if(!r.gn)r.gn={agg:1,th:1,res:S.df>=4?.3:0};if(!r.pos)r.pos={};if(!r.mb)r.mb={q:0,px:0,c:{}};if(r.w0==null)r.w0=r.cash;if(!r.nh)r.nh=[]}
function rlog(r,t,k){(S.rlog=S.rlog||[]).unshift({d:ds(),n:r.n,s:r.s,t,k:k||0});if(S.rlog.length>80)S.rlog.length=80;if(S.cfg&&S.cfg.spec&&k)eco("👁 "+r.n+": "+t)}
function rvSell(r,id,c,s,why){const key="r"+id,h=c.own[key]||0;s=Math.min(h,s);if(s<=0)return;const v=mc(c)*s/100*(1-s/100*.8);setOwn(c,key,h-s);r.cash+=v;c.p*=1-s/100*1.2;c.xv=(c.xv||0)+c.sh*s/100;const e=r.pos[c.id];
if(e&&!(c.own[key]>0)){const g=c.p/e.px-1;delete r.pos[c.id];if(Math.abs(g)>.25){const t=(g>0?"💡 ":"🩹 ")+c.tk+" 정리 "+P1(g*100)+" ("+(why||"")+")";rlog(r,t,1);if(Math.abs(g)>.4)(S.lsn=S.lsn||[]).unshift({d:ds(),n:r.n,s:r.s,t:c.tk+" "+P1(g*100),l:g>0?LSN[r.s]:"실패에서 배우기: "+(why||"")+" — 손실을 빨리 인정했다"});if(S.lsn&&S.lsn.length>30)S.lsn.length=30}}}
function rvBuy(r,id,c,b,why){const ok=rbuy(r,id,c,b,-1);if(ok&&!r.pos[c.id]){r.pos[c.id]={px:c.p,d:S.day,why};if(b>=2)rlog(r,"🛒 "+c.tk+" "+why,mc(c)>800?1:0)}return ok}
// persona brains (called from rivalTick)
function persTick(r,id,ag){rvPrep(r);const key="r"+id,g=r.gn,sk=g.res||0,a=S.co.filter(c=>!c.dead&&!c.priv&&c.pill<S.day);if(!a.length)return;const fund=rnw(id),hold=Object.keys(r.pos).map(k=>S.co[k]).filter(c=>c&&!c.dead&&c.own[key]);
if(r.s==="mg"){mgTick(r,id);if(rnd()>.06*ag)return;}else if(rnd()>.14*ag*g.agg)return;
const sc=(c,f)=>f(c)+sk*(c.hq||0)*.6;
if(r.s==="vg"){for(const c of hold)if(c.p>c.tg*1.7&&rnd()<.3)rvSell(r,id,c,2,"고평가 일부 매도");
const q=a.filter(c=>epsT(c)>0&&c.p/epsT(c)<12*g.th&&c.ni*4/Math.max(1,eq(c))>.11&&rating(c)<=2&&mc(c)>100&&mc(c)*.25<fund).sort((x,y)=>sc(y,c=>c.ni*4/Math.max(1,eq(c))*epsT(c)/c.p)-sc(x,c=>c.ni*4/Math.max(1,eq(c))*epsT(c)/c.p));
const ins=q.find(c=>c.kd===2&&!S.co.some(z=>z.ctl===key&&z.kd===2));const c=ins||q[rnd()*Math.min(5,q.length)|0];if(c&&grp(c,key)<32)rvBuy(r,id,c,2+(rnd()*3|0),"저PER·고ROE 우량주 ("+(c.p/epsT(c)).toFixed(1)+"배)");return}
if(r.s==="ag"){for(const c of hold){const e=r.pos[c.id],st=c.own[key]||0;if(e&&c.p>e.px*1.3)rvSell(r,id,c,st,"요구 관철 후 차익 실현");else if(st>=7&&!e.dm){e.dm=1;if(!mine(c)&&rnd()<.6&&c.cs>mc(c)*.06){const n=Math.min(5,pub(c)-1),x=mc(c)*n/100*1.05;if(c.cs>=x){c.cs-=x;c.sh*=1-n/100;rescale(c,1/(1-n/100));c.jx=(c.jx||0)+.05;ctlAll();rlog(r,"📣 "+c.tk+"에 자사주 매입 요구 → 회사 수용",1)}}else{rlog(r,"📣 "+c.tk+" 경영진이 요구 거부",1);if(mine(c))L("⚠ "+r.n+"이(가) "+c.tk+"에 자사주 매입·배당을 요구합니다 (지분 "+st.toFixed(1)+"%)",1)}}
else if(st>=12&&rnd()<.05*ag&&!mine(c))rtender(r,id,c)}
const q=a.filter(c=>(c.cs>mc(c)*.25||c.p<c.tg*.8)&&mc(c)*.12<fund&&mc(c)>80).sort((x,y)=>sc(y,c=>c.cs/mc(c)+c.tg/c.p)-sc(x,c=>c.cs/mc(c)+c.tg/c.p));const c=q[rnd()*Math.min(6,q.length)|0];if(c&&grp(c,key)<15)rvBuy(r,id,c,2+(rnd()*2|0),"현금 "+(c.cs/mc(c)*100).toFixed(0)+"%·저평가 → 행동주의 표적");return}
if(r.s==="gg"){const gr=c=>{const h=c.eh||[];if(h.length<8)return 0;const a1=h.slice(-4).reduce((p,q)=>p+q,0),a0=h.slice(-8,-4).reduce((p,q)=>p+q,0);return a0>0?a1/a0-1:0};
for(const c of hold){const e=epsT(c),pe=e>0?c.p/e:99,g2=gr(c);if(g2<0||pe/(Math.max(.01,g2)*100)>2.5)rvSell(r,id,c,c.own[key],g2<0?"성장 꺾임":"PEG 과열")}
if(hold.length>=20)return;const q=a.filter(c=>tn(c)>=1&&epsT(c)>0&&gr(c)>.15&&c.p/epsT(c)/(gr(c)*100)<1.1).sort((x,y)=>sc(y,c=>gr(c)/(c.p/epsT(c)))-sc(x,c=>gr(c)/(c.p/epsT(c))));const c=q[rnd()*Math.min(8,q.length)|0];if(c&&(c.own[key]||0)<5)rvBuy(r,id,c,1+(rnd()*2|0),"이익 +"+(gr(c)*100).toFixed(0)+"% · PEG "+(c.p/epsT(c)/(gr(c)*100)).toFixed(2));return}
if(r.s==="qg"){for(const c of hold){const e=r.pos[c.id];if(!e)continue;const ret=c.p/e.px-1;if(ret<-.08||ret>.2||S.day-e.d>70)rvSell(r,id,c,c.own[key],ret<-.08?"손절 신호":ret>.2?"목표 수익":"보유 기간 만료")}
if(hold.length>=40)return;const q=a.filter(c=>c.hn>30&&mc(c)>150).sort((x,y)=>(y.ch||0)-(x.ch||0)).slice(0,25);const c=q[rnd()*q.length|0];if(c&&!(c.own[key]>0))rvBuy(r,id,c,1,"20일 모멘텀 상위");return}}
// macro trader: index futures and gold sized by a macro signal
function mgTick(r,id){const mb=r.mb;if(mb.q){r.cash+=mb.q*.1*(S.ix-mb.px);mb.px=S.ix}for(const k in mb.c){const m=S.cm.find(z=>z.k===k);if(m){r.cash+=mb.c[k].u*(m.p-mb.c[k].px)/1e8;mb.c[k].px=m.p}}
if(S.day%20!==id%20)return;const inv=Math.max(0,S.yS-S.yL),sig=Math.max(-1,Math.min(1,(S.gdp-2.5)*.25+S.mood*1.2-inv*.6-(S.prime-(S.mh&&S.mh.length>2?S.mh[S.mh.length-3].pr:S.prime))*.4+(S.ix/(closeIx(60)||S.ix)-1)*3)),eqv=Math.max(0,rnw(id)),lev=1.5*(r.gn.agg||1);
const tq=Math.round(sig*eqv*lev/(S.ix*.1));if(Math.abs(tq-mb.q)>Math.max(3,Math.abs(mb.q)*.3)){const was=mb.q;mb.q=tq;mb.px=S.ix;r.cash-=Math.abs(tq-was)*S.ix*.1*.0003;if(Math.abs(tq)>Math.abs(was)*1.5||Math.sign(tq)!==Math.sign(was))rlog(r,(tq>0?"📈 지수선물 매수 ":"📉 지수선물 매도 ")+Math.abs(tq)+"계약 (신호 "+sig.toFixed(2)+": "+(sig<0?"경기 둔화·긴축 베팅":"경기 확장 베팅")+")",1)}
const gw=S.inf>4||S.bsw?eqv*.25:0,gm=S.cm[0],cur=mb.c.GOLD?mb.c.GOLD.u*gm.p/1e8:0;if(Math.abs(gw-cur)>eqv*.08){mb.c.GOLD={u:gw*1e8/gm.p,px:gm.p};if(gw>0)rlog(r,"🥇 금 "+F(gw)+" 매수 (물가 "+S.inf.toFixed(1)+"% 헤지)",1)}}
const closeIx=n=>{const o=S.IX&&S.IX.ALL;if(!o||o.hn<=n)return 0;return o.lv[(o.hn-1-n)%DH]/100};
// legend: every year rivals study each other and the player, and get better at research
function rvLearn(){if(!(S.df>=4||S.cfg.spec||S.cfg.learn)||S.R.length<2)return;const R=S.R.map((r,i)=>{rvPrep(r);return{r,i,g:rnw(i)/Math.max(1,r.w0)}}).sort((a,b)=>b.g-a.g);
for(const x of R)x.r.gn.res=Math.min(1.6,(x.r.gn.res||0)+.15);const top=R[0],bot=R[R.length-1];
if(!S.cfg.spec&&top.g>bot.g*1.15&&top.r.s!==bot.r.s&&rnd()<.7){const o=bot.r.s;if(o==="mg"){const mb=bot.r.mb;mb.q=0;mb.c={}}bot.r.s=top.r.s;bot.r.gn={agg:Math.min(2.5,(top.r.gn.agg||1)*(.9+rnd()*.35)),th:(top.r.gn.th||1)*(.9+rnd()*.2),res:bot.r.gn.res};bot.r.pos=bot.r.pos||{};
const t="🧠 "+bot.r.n+"이(가) 1위 "+top.r.n+"의 전략을 학습: "+(RTY[o]?RTY[o][0]:o)+" → "+RTY[top.r.s][0];eco(t);L(t,1);rlog(bot.r,t,1)}
const me=nw();if(!S.cfg.spec&&me>Math.max(...R.map(x=>rnw(x.i)))*1.3){for(const x of R)if(["raid","act","ag","vg"].includes(x.r.s))x.r.gn.agg=Math.min(2.5,(x.r.gn.agg||1)*1.12);L("🧠 라이벌들이 선두인 당신을 분석하고 있습니다. 경영권 방어를 단단히 하세요",1)}
for(const x of R){x.r.w0=rnw(x.i);(x.r.nh=x.r.nh||[]).push(Math.round(rnw(x.i)));if(x.r.nh.length>40)x.r.nh.shift()}}
function rvQ(){for(const [i,r] of S.R.entries()){rvPrep(r);(r.qh=r.qh||[]).push(Math.round(rnw(i)));if(r.qh.length>60)r.qh.shift()}(S.pqh=S.pqh||[]).push(Math.round(nw()));if(S.pqh.length>60)S.pqh.shift()}

// ---- v12 concept book: new chapters, glossary terms and quizzes with rewards ----
function bkIns(after,...xs){const k=BK.findIndex(x=>x[0]===after);BK.splice(k<0?BK.length:k+1,0,...xs)}
bkIns("macro",["macro2","경제의 연결 고리 — 물가, 중앙은행, 금리 곡선, 환율","실제 경제처럼 움직이는 원리",
"<p>이 게임의 경제는 실제 경제처럼 서로 맞물려 움직여요.</p><ul><li><b>물가(인플레이션)</b>: 경기가 뜨겁거나(GDP↑), 유가가 오르거나, 일손이 모자라면(실업률↓) 올라요.</li><li><b>중앙은행</b>은 '테일러 준칙'처럼 움직여요. 물가가 목표(2.5%)보다 높거나 경기가 과열되면 기준금리를 올리고, 반대면 내립니다. 기준금리가 아주 낮아지면 돈을 찍어 푸는 <b>양적완화</b>를 해요.</li><li><b>금리 곡선</b>: 보통은 장기 금리가 단기보다 높아요(돈을 오래 빌려주면 더 받아야 하니까). 중앙은행이 금리를 너무 올리면 단기가 장기보다 높아지는 <b>역전</b>이 생기고, 역사적으로 1~2년 뒤 경기 침체가 자주 왔어요.</li><li><b>신용 스프레드</b>: 회사채 금리 − 국채 금리. 경기가 나쁘고 공포가 크면 벌어져 회사의 이자 부담이 커져요.</li><li><b>환율</b>: 원/달러가 오르면(원화 약세) 수출 기업(반도체·자동차·조선)이 웃고, 연료를 사 오는 항공·전력은 울어요.</li><li><b>경기 국면</b>: 확장 → 둔화 → 침체 → 회복을 돌아요.</li></ul>",
"은행·경제 탭의 경제 지표에서 금리 곡선, 물가, 실업률, 신용 스프레드, 환율과 중앙은행 기조를 보세요. 지수 화면에서 장단기 금리와 환율 차트도 볼 수 있어요.",[["경제 지표","G.pg('econ')"]]],
["bsw","블랙 스완 — 아무도 예상 못한 일","드물지만 시장을 뒤흔드는 사건",
"<p>17세기 유럽 사람들은 백조는 모두 희다고 믿었는데, 호주에서 검은 백조가 발견됐어요. 그래서 <b>블랙 스완</b>은 '일어날 리 없다고 믿었지만 일어나서 모든 걸 바꾸는 사건'을 뜻해요.</p><ul><li>팬데믹, 전쟁, 대형 은행 파산, 국가 부도, 플래시 크래시, 코인 거래소 붕괴, 서브프라임 붕괴 같은 나쁜 사건도 있고, 기술 혁명처럼 좋은 사건도 있어요.</li><li>예측은 거의 불가능해요. 대신 <b>버틸 수 있게</b> 준비해야 해요: 빚을 적게, 한 곳에 몰빵하지 않기, 현금 조금.</li><li>블랙 스완 때 가장 먼저 죽는 사람은 레버리지가 큰 사람이에요. 바닥에서 강제로 팔리니까요.</li><li>살아남은 사람에게는 위기가 곧 기회예요. 좋은 회사가 헐값이 되거든요.</li></ul>",
"설정에서 블랙 스완 빈도(끄기·드물게·보통·자주)를 고를 수 있어요. 새 게임의 역사 시나리오에서 실제 위기를 다시 겪어 볼 수도 있어요.",[]]);
bkIns("sector",["ind","업종마다 다른 사업 모델","반도체와 은행은 다르게 번다",
"<ul><li><b>경기·설비 사이클</b>(반도체·철강·화학·조선·2차전지·자동차·기계·전자): 3~4년마다 호황과 불황이 와요. 주가는 실적보다 먼저 움직여서, 실적이 가장 나쁠 때가 오히려 사기 좋은 때일 수 있어요.</li><li><b>플랫폼</b>(소프트웨어·인터넷): 1등이 다 가져가요. 점유율이 높을수록 마진이 커져요.</li><li><b>히트 의존</b>(제약·바이오, 게임·미디어): 임상 결과나 신작 흥행 하나로 회사 가치가 바뀌어요.</li><li><b>원자재 연동</b>(에너지·광업·농업): 유가·금값·곡물 가격이 곧 이익이에요.</li><li><b>규제 산업</b>(통신·전력·철도): 정부가 정해 준 만큼 안정적으로 벌지만, 금리가 오르면 약해요.</li><li><b>경기 방어</b>(식음료·생활용품·의료기기·주류): 불황에도 팔려요.</li><li><b>금융</b>: 은행은 예대마진과 BIS 비율, 보험은 보험 주기와 재해, 증권은 거래대금과 ETF 보수로 벌어요.</li></ul><p>업종마다 시장 점유율이 어떻게 나뉘었는지(1등이 몇 %인지)도 중요해요. 메뉴의 '점유율 분포'에서 HHI(집중도)와 상위 3개 점유율을 보세요.</p>",
"종목 화면 개요의 '업종 특성' 카드와, 내 회사 경영 탭의 '경영 코치'가 업종에 맞는 조언을 해 줘요.",[["점유율 분포","G.pg('shr')"]]],
["ctry","나라마다 다른 규칙","30개국의 세금, 방어력, 성장, 위험",
"<p>회사가 어느 나라에 세워졌는지에 따라 규칙이 달라져요.</p><ul><li><b>법인세</b>: 9%(아랍에미리트)부터 35%까지.</li><li><b>인수 방어력</b>: 일본·네덜란드·한국처럼 적대적 인수가 어려운 나라, 미국·영국처럼 쉬운 나라.</li><li><b>밸류에이션</b>: 같은 이익이라도 미국·인도·스위스 회사는 비싸게, 아르헨티나·남미 회사는 싸게 거래돼요.</li><li><b>성장</b>: 인도·베트남·중국처럼 경제가 빨리 크는 나라는 회사도 빨리 커요.</li><li><b>정치 위험</b>: 자본 통제·횡재세·국유화가 일어날 수 있어요.</li><li><b>노조</b>: 파업이 잦은 나라와 드문 나라가 있어요.</li><li><b>조세회피처</b>(케이맨·아일랜드·룩셈부르크): 세금은 적지만 감독원 주목도가 올라요.</li></ul>",
"회사 설립에서 나라를 고를 수 있고, 종목 화면에 회사의 국적이 표시돼요.",[["회사 설립","G.fdOpen()"]]]);
bkIns("deriv",["fut2","선물 심화 — 원자재·지수·주식선물","콘탱고, 증거금, 마진콜",
"<ul><li><b>선물</b>은 '정해진 날(만기)에 지금 정한 가격으로 사고팔기로 한 약속'이에요. 실제로는 대부분 만기 전에 반대 거래로 정리해요.</li><li><b>증거금</b>: 계약 가치 전부가 아니라 6~15%만 맡기고 거래해요. 그래서 작은 돈으로 큰 계약을 움직여요(레버리지).</li><li><b>일일 정산</b>: 매일 손익이 증거금에 더해지거나 빠져요. 유지 증거금 아래로 떨어지면 <b>마진콜</b> — 돈을 더 넣거나 강제로 청산당해요.</li><li><b>만기별 가격(곡선)</b>: 보통 먼 달이 더 비싸요(<b>콘탱고</b>, 보관비·이자 때문). 먼 달이 더 싸면(<b>백워데이션</b>) 시장은 지금 가격이 너무 높아 앞으로 떨어질 거라고 보는 거예요.</li><li><b>헤지</b>: 정유사가 원유 선물을 사 두면 유가가 올라도 원가를 고정할 수 있어요. 주식을 많이 가졌다면 지수선물을 팔아 하락에 대비할 수 있어요.</li><li><b>실물 인수</b>: 원자재 선물은 만기에 현금 대신 실물을 받을 수도 있어요(전체 대금 필요).</li></ul>",
"파생상품 메뉴의 선물 탭에서 원자재·지수·주식선물 곡선을 보고 계약을 사고팔 수 있어요. 레버리지를 고를 수 있는 건 코인 선물뿐이에요.",[["파생상품","G.pg('dv')"]]],
["opt2","옵션 심화 — 체인, 쓰기, 행사","보험을 사고팔기",
"<ul><li><b>옵션 체인</b>: 행사가와 만기별로 옵션값을 늘어놓은 표예요. 원작처럼 '1%당 비용'을 보면 비교가 쉬워요.</li><li><b>옵션 쓰기(매도)</b>: 옵션을 팔면 프리미엄을 바로 받아요. 대신 상대가 행사하면 의무를 져요. 보험회사처럼 '대부분은 안 터진다'에 거는 거예요.</li><li><b>커버드 콜</b>: 가진 주식을 담보로 콜을 팔아 추가 수입을 얻어요. 주가가 행사가를 넘으면 주식을 행사가에 넘겨줘요.</li><li><b>네이키드</b>: 담보 없이 팔면 손실이 끝없이 커질 수 있어 증거금이 필요해요.</li><li><b>풋 쓰기로 싸게 사기</b>: 풋을 팔았는데 주가가 떨어지면 행사가에 주식을 사게 돼요. 원래 사고 싶던 가격이라면 프리미엄까지 받는 셈이에요.</li><li><b>콜 행사로 지분 늘리기</b>: 깊이 내가격인 콜을 행사하면 시가보다 싸게 지분을 넘겨받아요.</li></ul>",
"종목 매매 탭의 '옵션 매수·쓰기' 버튼, 파생상품 메뉴에서 보유 옵션을 관리해요.",[]],
["swap","금리 스왑","고정금리와 변동금리를 바꾸기",
"<ul><li>A는 변동금리로 빌렸는데 금리가 오를까 걱정되고, B는 반대예요. 둘이 이자 흐름만 바꾸는 계약이 <b>금리 스왑</b>이에요. 원금은 오가지 않아요.</li><li><b>고정 받기</b>(롱): 고정금리를 받고 변동금리를 내요. 금리가 내리면 이익.</li><li><b>고정 내기</b>(숏): 금리가 오르면 이익. 변동금리 대출의 이자 상승을 막는 헤지예요.</li><li>은행·보험사가 상대방이 되고, 고객에게 불리한 금리(마진)를 붙여요. 내가 지배하는 금융회사가 거래하면 마진이 절반이에요.</li><li>원작처럼 스왑은 장부 밖(각주)에 있어요. 손익은 분기마다 현금으로 정산돼요.</li></ul>",
"파생상품 메뉴의 스왑 탭에서 기준금리·단기 국채·장기 국채 금리로 계약할 수 있어요.",[]],
["etf","ETF와 인덱스 투자","시장을 통째로 사기",
"<ul><li><b>ETF</b>는 여러 종목을 묶은 펀드를 주식처럼 사고파는 상품이에요. 종합지수 ETF 하나면 시장 전체를 사는 셈이에요.</li><li><b>보수</b>: 운용사가 매년 조금씩 떼어 가요(0.1~1%). 운용사(증권사)에게는 안정적인 수입이에요. 원작처럼 내 증권사가 다른 운용사의 운용권을 살 수도 있어요.</li><li><b>레버리지·인버스</b>: BULL은 하루 수익의 3배, BEAR는 −3배를 따라가요. 매일 다시 맞추기 때문에 오르락내리락하면 지수가 제자리여도 가치가 녹아요. 짧게만 쓰세요.</li><li><b>팩터 ETF</b>: 고배당·가치·모멘텀처럼 특정 성질의 종목을 모아요.</li><li>대부분의 전문가도 장기적으로 지수를 이기기 어려워요. 그래서 '그냥 지수를 사라'는 조언이 유명해요.</li></ul>",
"시장 탭의 ETF에서 사고팔 수 있어요.",[["ETF 보기","G.go('m');G.seg(4)"]]],
["coin","코인 생태계와 레버리지","태어나고 사라지는 코인들",
"<ul><li><b>비트코인</b>은 공급이 정해져 있고 4년마다 채굴 보상이 절반이 되는 <b>반감기</b>가 있어요. 반감기 뒤 1년쯤 큰 상승장이 오고, 그 뒤 '크립토 겨울'이 오곤 했어요.</li><li>코인마다 성격이 달라요: 플랫폼, 스테이블코인(1달러 고정), 거래소 토큰, 디파이, 밈, AI, 게임, 프라이버시, 결제.</li><li>강세장에는 새 코인이 쏟아지고, 대부분은 사라져요. <b>러그풀</b>(개발자가 돈을 들고 도망), 해킹, 상장폐지, 디페그가 흔해요.</li><li>시가총액이 작은 코인은 내 주문만으로도 가격이 크게 움직여요.</li><li><b>무기한 선물</b>: 만기가 없는 코인 선물. 1~100배 레버리지를 고를 수 있어요. 롱이 많으면 롱이 숏에게 <b>펀딩비</b>를 내요. 청산가에 닿으면 증거금을 전부 잃어요. 100배면 1%만 반대로 가도 끝!</li></ul>",
"시장 탭의 코인에서 현물과 선물을 거래하고, 생태계(탄생·소멸·광풍)를 볼 수 있어요.",[["코인 보기","G.go('m');G.seg(3)"]]]);
bkIns("finco",["bank2","은행 경영 — 자산 배분과 BIS 비율","은행장이 되어 보기",
"<ul><li>은행은 예금(빚)으로 대출과 채권을 사요. 이익 = 자산 이자 − 예금 이자 − 운영비 − 대손.</li><li><b>자산 배분</b>: 우량 주택담보(안전·저수익), 서브프라임(고수익·고위험), 소비자 신용(고수익·실업에 민감), 장기 국채(금리 오르면 평가손), 단기채(안전).</li><li><b>대손충당금</b>: 떼일 돈을 미리 비용으로 쌓아 두는 것. 미루면 지금 이익은 좋아 보이지만 나중에 한꺼번에 터져요.</li><li><b>BIS 비율</b> = 자본 ÷ 위험가중자산. 위험한 대출일수록 무겁게 쳐요. 10.5% 아래면 배당 금지, 8% 아래면 신규 대출 금지, 4% 아래면 뱅크런이 올 수 있어요.</li><li><b>대출 매매</b>: 부실한 회사의 대출을 다른 은행에서 싸게 사 둔 뒤 회수하면, 그 회사가 법정관리에 갈 때 대출이 지분으로 바뀌어 회사를 가질 수 있어요(loan-to-own).</li></ul>",
"내 은행의 경영 탭에서 자산 배분, BIS 비율, 대출 장부와 부실 대출 시장을 볼 수 있어요.",[]]);
bkIns("found",["corp","기업 행동과 시장 규칙","분할, 5% 공시, 상하한가, 배당락, 스톡옵션",
"<ul><li><b>액면분할</b>: 1주를 여러 주로 쪼개요. 회사 가치는 그대로지만 주가가 낮아져 사기 쉬워져요. <b>병합</b>은 반대.</li><li><b>5% 대량보유 공시</b>: 한 회사 지분을 5% 넘게 가지면(또는 1%p씩 바뀌면) 알려야 해요. 기업사냥꾼이 공시하면 시장은 인수를 기대해 주가가 뛰고, 뒤따라 사는 사람이 생겨 내가 더 사기가 비싸져요.</li><li><b>상한가·하한가</b>: 하루에 ±30%까지만 움직여요. 넘친 힘은 다음 날로 이어져요.</li><li><b>배당락</b>: 배당을 주는 날 주가가 배당만큼 떨어져요. 배당을 받아도 공짜는 아니에요.</li><li><b>연결납세</b>: 80% 이상 가진 자회사는 모회사와 세금을 합쳐 내요. 한쪽 손실로 다른 쪽 이익의 세금을 줄여요.</li><li><b>CEO 스톡옵션</b>: CEO는 분기마다 정해진 가격에 신주를 살 권리를 받아요. 1년 뒤부터 행사하면 시가보다 싸게 지분을 늘릴 수 있어요.</li><li><b>잔여 지분 강제 매수</b>: 90% 넘게 가지면 나머지를 사들여 100% 비상장으로 만들 수 있어요. 100%가 되면 자동으로 상장 폐지돼요.</li></ul>",
"내 회사 경영 탭에서 분할·병합, 강제 매수를, 내가 CEO인 회사에서 스톡옵션을 볼 수 있어요.",[]]);
bkIns("tax",["rsch","리서치 — 숨은 진주와 시한폭탄","남들보다 먼저 아는 법",
"<ul><li>모든 회사에는 시장이 아직 모르는 미래가 있어요. 앞으로 몇 년 동안 이익을 끌어올릴 <b>숨은 경쟁력</b>, 또는 언젠가 터질 <b>시한폭탄</b>(분식회계, 숨은 부채, 소송, 품질 은폐).</li><li>주가는 숨은 미래가 실적으로 드러난 뒤에야 따라가요. 그래서 먼저 아는 사람이 큰돈을 벌어요.</li><li>알아내려면 돈과 시간이 들어요. <b>기본 리서치</b>(싸고 빠름, 부정확), <b>심층 실사</b>(한 달), <b>전문가 네트워크</b>(두 달, 가장 정확).</li><li>애널리스트 의견은 공짜지만 다들 아는 정보이고, 낙관적으로 기울어 있어요.</li><li>개념서 퀴즈를 풀면 리서치 크레딧을 받아요. 공부가 곧 정보력이에요.</li><li>전설 난이도의 라이벌도 해마다 리서치 실력이 늘어요.</li></ul>",
"종목 개요의 리서치 카드에서 의뢰하고, 메뉴의 리서치 센터에서 결과를 모아 봐요.",[["리서치 센터","G.pg('rsc')"]]]);
bkIns("strat",["aiplay","AI 코치·관전·전설 난이도·챌린지","배우고 겨루기",
"<ul><li><b>AI 코치</b>: 해마다, 그리고 파산·은퇴 때 무엇이 잘됐고 무엇이 문제였는지 짚어 줘요. 내 회사 경영 탭에는 업종에 맞는 경영 코치가 있어요.</li><li><b>관전 모드</b>: 가치·행동주의·매크로·성장·퀀트 거장 스타일의 AI들끼리만 경쟁해요. 누가 왜 이겼는지 보고 배울 수 있어요.</li><li><b>전설 난이도</b>: 라이벌이 해마다 서로의 전략을 배우고, 리서치 실력이 늘고, 선두를 집중 공격해요.</li><li><b>챌린지</b>: 같은 시드(세계)를 받은 사람끼리 같은 사건 속에서 실력을 겨뤄요. 순위표와 지금 함께 달리는 사람이 보여요. 한 기기에서 여럿이 번갈아 하는 '같은 세계 대결'도 있어요.</li></ul>",
"메뉴의 AI 코치와 챌린지, 새 게임의 관전 모드와 난이도를 보세요.",[["AI 코치","G.pg('coach')"],["챌린지","G.pg('chl')"]]]);
GL.push(["콘탱고","먼 만기 선물이 가까운 만기보다 비싼 정상 상태"],["백워데이션","먼 만기 선물이 더 싼 상태. 시장이 하락을 예상"],["증거금","선물·옵션 거래 때 맡기는 보증금"],["유지 증거금","이 아래로 떨어지면 마진콜이 오는 기준"],["일일 정산","선물 손익을 매일 증거금에 반영"],
["커버드 콜","가진 주식을 담보로 콜옵션을 파는 전략"],["옵션 쓰기","옵션을 팔아 프리미엄을 받고 의무를 지는 것"],["행사가","옵션으로 사고팔 수 있는 정해진 가격"],["금리 스왑","고정금리와 변동금리 이자 흐름을 맞바꾸는 계약"],["ETF","주식처럼 거래되는 지수·바스켓 펀드"],["운용 보수","ETF 운용사가 매년 떼는 수수료"],
["레버리지 ETF","하루 수익률의 몇 배를 따라가는 ETF. 오래 들면 녹음"],["반감기","비트코인 채굴 보상이 절반이 되는 시점(약 4년마다)"],["스테이블코인","1달러 같은 기준 가치에 고정되도록 만든 코인"],["디페그","스테이블코인이 고정 가치에서 벗어나는 사고"],["러그풀","코인 개발자가 투자금을 들고 사라지는 사기"],
["무기한 선물","만기가 없는 코인 선물. 펀딩비로 현물 가격에 붙어 다님"],["펀딩비","무기한 선물에서 롱과 숏이 주고받는 수수료"],["청산가","레버리지 포지션이 강제로 정리되는 가격"],["인플레이션","물가가 오르는 현상. 돈의 가치가 떨어짐"],["테일러 준칙","물가와 경기에 따라 기준금리를 정하는 규칙"],["양적완화","중앙은행이 돈을 찍어 채권을 사들이는 정책"],
["금리 역전","단기 금리가 장기 금리보다 높아진 상태. 침체 신호로 유명"],["신용 스프레드","회사채 금리와 국채 금리의 차이. 공포가 크면 벌어짐"],["실업률","일하고 싶은데 일자리가 없는 사람의 비율"],["환율","다른 나라 돈과 바꾸는 비율. 원/달러가 오르면 원화 약세"],["경기 국면","확장·둔화·침체·회복의 순환"],["블랙 스완","예측 못했지만 일어나면 모든 걸 바꾸는 사건"],
["BIS 비율","은행 자본 ÷ 위험가중자산. 8% 미만이면 규제"],["대손충당금","떼일 대출을 미리 비용으로 쌓아 둔 돈"],["서브프라임","신용이 낮은 사람에게 내준 고금리 대출"],["loan-to-own","부실 대출을 사서 법정관리 때 지분으로 바꿔 회사를 갖는 전략"],["액면분할","1주를 여러 주로 쪼개는 것"],["주식병합","여러 주를 1주로 합치는 것"],
["대량보유 공시","지분 5% 이상을 갖거나 1%p 이상 바뀌면 알리는 규칙"],["상한가 / 하한가","하루 최대 상승·하락 폭(±30%)"],["배당락","배당 지급일에 주가가 배당만큼 떨어지는 것"],["연결납세","80% 이상 자회사와 모회사가 세금을 합쳐 내는 제도"],["스톡옵션","임원이 정해진 가격에 신주를 살 수 있는 권리"],["황금 낙하산","경영권을 잃은 임원이 받는 거액의 퇴직 보상"],
["잔여 지분 강제 매수","90% 이상 대주주가 남은 주식을 사들여 100%로 만드는 것"],["투자의견","애널리스트의 매수·중립·매도 의견과 목표주가"],["수급","외국인·기관·개인이 사고판 흐름"],["HHI","업종 집중도. 점유율 제곱의 합(만점 10,000). 2,500 넘으면 고집중"],["CR3","상위 3개 회사 점유율 합"],
["숨은 경쟁력","시장이 아직 모르는 미래 이익 개선 요인"],["시한폭탄","언젠가 드러날 숨은 악재(분식·숨은 부채 등)"],["실사","투자 전 회사를 깊이 조사하는 것(due diligence)"],["국유화","정부가 기업을 강제로 사들이는 것"],["자본 통제","정부가 돈의 해외 이동을 막는 조치"],["시드","세계를 만드는 난수의 씨앗. 같으면 같은 세계"]);
// ---- quizzes: three questions per chapter; first pass with 2+ correct earns research credits and a small bonus ----
const QZ={start:[["순자산을 계산하는 식으로 맞는 것은?",["현금 + 보유 자산 − 빚","현금 + 빚","주가 × 주식 수","배당 − 세금"],0,"순자산 = 가진 것 − 빌린 것이에요."],["회사 경영권을 얻는 기준은?",["지분 5%","지분 20% 이상이면서 최대 주주 그룹","지분 10%","주식 1주"],1,"20% 이상 + 최대 그룹이면 경영권이에요."],["회사 돈으로 다른 회사를 사려면?",["거래 주체를 그 회사로 바꾼다","개인 대출을 늘린다","배당을 올린다","CEO를 사임한다"],0,"위쪽 거래 주체 칩으로 회사를 고르면 그 회사 돈으로 거래해요."]],
stock:[["시가총액은?",["주가 × 전체 주식 수","순이익 × 4","자산 − 부채","배당 × 주식 수"],0,"회사 전체의 시장 가격이에요."],["주식 1%를 가지면?",["회사의 1% 주인","회사 빚의 1%를 갚아야 함","매년 1% 이자를 받음","의결권이 없음"],0,"주식은 소유권의 조각이에요."],["상장 회사와 비상장 회사의 차이는?",["시장에서 거래되는지 여부","이익이 나는지 여부","나라","업종"],0,"비상장 회사는 시장에서 사고팔 수 없어요."]],
index:[["시가총액 가중 지수에서 영향력이 큰 종목은?",["시가총액이 큰 종목","주가가 높은 종목","새로 상장한 종목","적자 종목"],0,"큰 회사일수록 지수를 더 움직여요."],["공포지수가 높다는 것은?",["시장 변동성이 크고 불안하다","주가가 반드시 오른다","금리가 낮다","배당이 많다"],0,"변동성을 연율로 나타낸 값이에요."],["대형 50 구성 종목은 언제 바뀌나?",["1년에 한 번, 80위 안이면 유지","매일","매달 무조건","바뀌지 않음"],0,"버퍼를 둬서 자주 바뀌지 않아요."]],
chart:[["캔들의 몸통은 무엇을 나타내나?",["시가와 종가","고가와 저가","거래량","배당"],0,"꼬리가 고가·저가예요."],["거래량이 갑자기 늘면?",["관심이 몰렸다는 신호","주가가 반드시 내린다","회사가 망했다","의미 없음"],0,"큰 움직임에는 거래량이 따라요."],["양봉은?",["종가가 시가보다 높은 날","종가가 시가보다 낮은 날","거래가 없던 날","배당락 날"],0,"오른 날의 캔들이에요."]],
chart2:[["골든크로스는?",["짧은 이동평균이 긴 이동평균을 위로 뚫음","주가가 0이 됨","거래량 감소","배당 증가"],0,"상승 신호로 봐요."],["정배열은?",["5일>20일>60일>120일 이동평균","모든 이평선이 같음","긴 선이 위","주가가 이평선 아래"],0,"상승 추세의 모습이에요."],["지지선은?",["하락이 자주 멈춘 가격대","상승이 막힌 가격대","상장가","목표가"],0,"저항선은 그 반대예요."]],
chart3:[["RSI 30 이하는?",["과매도 — 많이 떨어진 상태","과매수","거래 정지","배당락"],0,"70 이상은 과매수예요."],["볼린저밴드 위로 벗어나면?",["단기 과열일 수 있다","반드시 더 오른다","회사가 망한다","금리가 오른다"],0,"평균 ± 변동성 띠예요."],["기술적 지표는 게임에서?",["참고용, 실적·업황이 결국 주가를 끈다","100% 맞는다","쓸모없다","가격을 정한다"],0,"신호는 확률일 뿐이에요."]],
fs1:[["영업이익은?",["매출 − 원가 − 판관비·R&D","순이익 + 세금","자산 − 부채","배당"],0,"본업으로 번 돈이에요."],["순이익에서 빠지는 것이 아닌 것은?",["배당금","이자비용","세금","영업비용"],0,"배당은 순이익을 나눠 주는 것이에요."],["이자보상배율이 1 아래면?",["영업이익으로 이자도 못 낸다","아주 안전하다","배당을 늘려야 한다","무의미"],0,"위험 신호예요."]],
fs2:[["자본은?",["자산 − 부채","매출 − 비용","현금 + 빚","주가 × 주식 수"],0,"주주의 몫이에요."],["부채비율이 높으면?",["빚이 많아 위험","현금이 많음","이익이 많음","주가가 비쌈"],0,"이자 부담과 파산 위험이 커져요."],["영업권은?",["인수 때 장부가보다 더 낸 웃돈","현금","재고","대출"],0,"매 분기 조금씩 비용으로 사라져요."]],
fs3:[["FCF는?",["영업현금 − 설비투자","매출 − 원가","순이익 × 4","부채 − 현금"],0,"자유롭게 쓸 수 있는 현금이에요."],["이익이 나도 현금이 부족할 수 있는 이유는?",["설비 투자·빚 상환에 현금이 나가서","이익은 항상 현금이라서","세금이 없어서","주가가 올라서"],0,"이익과 현금은 달라요."],["현금흐름표가 중요한 이유는?",["회사가 망하는 건 이익이 아니라 현금이 없어서","주가를 정해서","세금을 줄여서","배당을 정해서"],0,"현금이 바닥나면 흑자 도산도 와요."]],
val:[["PER이 낮다는 것은?",["이익에 비해 주가가 싸다","이익이 없다","주가가 비싸다","배당이 없다"],0,"주가 ÷ 주당순이익이에요."],["PBR 1 미만은?",["장부가보다 싸게 거래","적자","부채 과다","상장 폐지"],0,"자산보다 싸게 팔리는 상태예요."],["ROE는?",["순이익 ÷ 자본","매출 ÷ 자산","주가 ÷ 이익","배당 ÷ 주가"],0,"주주 돈으로 얼마나 버는지예요."]],
why:[["이 게임의 주가 움직임 구성 요소가 아닌 것은?",["주사위","시장 흐름","업종 흐름","적정가 회귀"],0,"모든 움직임에는 이유가 있어요."],["실적이 예상보다 크게 좋으면?",["어닝 서프라이즈로 주가가 뛴다","주가가 반드시 내린다","상장 폐지","배당 중단"],0,"컨센서스와 비교해요."],["시장 기대(nf)는?",["회사 소식이 쌓인 프리미엄·할인","배당","금리","거래량"],0,"몇 년에 걸쳐 옅어져요."]],
macro:[["금리가 오르면 보통 주가는?",["내린다","오른다","상관없다","두 배"],0,"미래 이익의 현재 가치가 줄어요."],["GDP 성장률이 높으면?",["경기가 좋다","경기가 나쁘다","물가가 0","금리가 0"],0,"경제가 빨리 커지는 중이에요."],["금리가 오르면 채권 가격은?",["내린다","오른다","그대로","0이 된다"],0,"반대로 움직여요."]],
macro2:[["물가가 목표보다 높으면 중앙은행은 보통?",["기준금리를 올린다","내린다","돈을 더 푼다","아무것도 안 한다"],0,"테일러 준칙의 핵심이에요."],["장단기 금리 역전은 역사적으로?",["경기 침체의 전조","호황의 신호","의미 없음","물가 하락 확정"],0,"1~2년 뒤 침체가 자주 왔어요."],["원/달러 환율이 오르면(원화 약세) 웃는 쪽은?",["수출 기업","항공사","전력 회사","수입 식품 회사"],0,"같은 달러 매출이 원화로 더 커져요."]],
bsw:[["블랙 스완 대비로 가장 중요한 것은?",["버틸 수 있게 레버리지를 줄이는 것","정확한 날짜 예측","모든 돈을 한 종목에","매일 매매"],0,"예측보다 생존이에요."],["블랙 스완 때 가장 먼저 무너지는 사람은?",["빚이 많은 사람","현금이 많은 사람","분산한 사람","채권을 가진 사람"],0,"바닥에서 강제로 팔리니까요."],["블랙 스완은 항상 나쁜 사건인가?",["아니다, 기술 혁명 같은 좋은 사건도 있다","그렇다","주식에는 영향이 없다","정부가 막는다"],0,"긍정적인 블랙 스완도 있어요."]],
sector:[["유가가 오르면 웃는 업종은?",["에너지","항공","해운 수요자","화학"],0,"에너지 회사의 이익이 늘어요."],["업종 수요보다 설비가 빨리 늘면?",["공급 과잉으로 마진이 준다","마진이 는다","무관","주가가 반드시 오름"],0,"공급과 수요의 균형이에요."],["금값이 오르면 이익이 느는 업종은?",["광업·귀금속","항공","은행","통신"],0,"금광 회사예요."]],
ind:[["경기·설비 사이클 업종에서 주가는 보통?",["실적보다 먼저 움직인다","실적보다 늦게","무관","항상 같다"],0,"그래서 실적이 바닥일 때 사기도 해요."],["플랫폼 업종의 특징은?",["1등이 이익을 독식","모두 똑같이 범","규제로 이익 고정","원자재 연동"],0,"네트워크 효과예요."],["규제 산업 주식은 금리가 오르면?",["약하다(채권 같은 주식)","강하다","무관","상장 폐지"],0,"안정적 배당주는 금리와 경쟁해요."]],
ctry:[["조세회피처 법인의 단점은?",["감독원 주목도가 오른다","세금이 높다","주가가 오른다","인수가 불가능"],0,"세금은 적지만 주목받아요."],["정치 위험이 큰 나라의 위험이 아닌 것은?",["반드시 높은 배당","국유화","자본 통제","횡재세"],0,"국가 리스크예요."],["같은 이익이어도 나라마다 주가가 다른 이유는?",["밸류에이션 프리미엄·할인이 달라서","주식 수가 달라서","무작위","환율이 0이라서"],0,"나라별 vm 특성이에요."]],
debt:[["레버리지의 뜻은?",["빚으로 투자 규모를 키우기","배당 늘리기","자사주 매입","분산 투자"],0,"이익도 손실도 커져요."],["신용등급이 낮으면?",["이자율이 높아진다","이자율이 낮아진다","무관","세금이 준다"],0,"위험할수록 비싸게 빌려요."],["개인 대출이 순자산의 3배를 넘으면?",["마진콜로 강제 매도","보너스","세금 면제","배당 증가"],0,"이 게임의 규칙이에요."]],
bond:[["채권은?",["돈을 빌려주고 이자를 받는 증서","회사 소유권","옵션","선물"],0,"주식은 소유, 채권은 빌려준 돈이에요."],["정크본드는?",["신용 BB 이하의 고금리 회사채","국채","무이자 채권","예금"],0,"위험한 만큼 이자가 높아요."],["금리가 낮을 때 회사채를 발행하면?",["10년간 낮은 이자로 고정","이자가 매일 바뀜","세금이 없음","주가가 0"],0,"고정금리의 장점이에요."]],
ctl:[["경영권을 지키는 방법이 아닌 것은?",["지분을 모두 판다","사모 유상증자로 지분 늘리기","포이즌 필","백기사"],0,"팔면 잃어요."],["내 회사가 가진 지분은?",["내 그룹 표로 합산된다","무시된다","라이벌 표가 된다","사라진다"],0,"피라미드의 원리예요."],["지분법 이익은?",["20% 이상 가진 회사 이익 중 내 몫","배당","주가 상승","세금"],0,"장부상 이익이에요."]],
ma:[["LBO는?",["인수 대상 회사의 빚으로 인수 대금 대부분을 치르는 인수","현금 100% 인수","주식 교환","소송"],0,"30%만 내고 70%는 대상 회사가 빚을 져요."],["공개매수 프리미엄이 낮으면?",["주주들이 거절하기 쉽다","항상 성공","무료","세금 감면"],0,"20% 미만은 거절되기 쉬워요."],["그린메일은?",["지분을 모아 회사에 비싸게 되사라고 압박","녹색 채권","배당","합병"],0,"원작의 전술이에요."]],
found:[["새로 세운 회사의 시즈닝 기간에는?",["상장과 정크본드가 막힌다","세금이 없다","배당 의무","파산 불가"],0,"1년 반이에요."],["지주회사를 세우면 좋은 점은?",["회사 간 배당이 비과세라 재투자에 유리","무조건 이익","인수 불가","주가 두 배"],0,"현물출자와 함께 써요."],["상장하면?",["지분 일부를 팔아 현금을 얻는다","회사가 없어진다","세금이 사라진다","빚이 사라진다"],0,"40%를 팔아요."]],
corp:[["액면분할을 하면 회사 가치는?",["그대로다","두 배","절반","0"],0,"주식 수와 주가만 바뀌어요."],["5% 대량보유 공시 뒤 기업사냥꾼이 사면?",["시장이 인수를 기대해 주가가 뛴다","주가가 반드시 내린다","거래 정지","세금 면제"],0,"그래서 추가 매수가 비싸져요."],["배당락이란?",["배당일에 주가가 배당만큼 떨어지는 것","배당이 두 배","배당 금지","배당 세금 면제"],0,"배당은 공짜가 아니에요."]],
deriv:[["공매도의 최대 손실은?",["이론상 끝이 없다","투자금까지","0","배당만큼"],0,"주가는 끝없이 오를 수 있어요."],["콜옵션 매수자의 최대 손실은?",["낸 프리미엄","무한대","주가 전체","0"],0,"권리만 샀으니까요."],["지수선물 매도는 어떤 용도?",["보유 주식 하락 헤지","배당 받기","세금 줄이기","경영권 확보"],0,"보험 같은 역할이에요."]],
fut2:[["백워데이션(먼 달이 더 쌈)은 무엇을 뜻하나?",["시장이 앞으로 가격 하락을 예상","정상 상태","거래 중단","이자 0"],0,"지금 가격이 너무 높다고 보는 거예요."],["유지 증거금 아래로 떨어지면?",["마진콜 — 돈을 넣거나 강제 청산","보너스 지급","만기 연장","아무 일 없음"],0,"일일 정산의 결과예요."],["이 게임에서 레버리지를 직접 고를 수 있는 선물은?",["코인 무기한 선물","원자재 선물","지수선물","주식선물"],0,"나머지는 정해진 증거금이에요."]],
opt2:[["커버드 콜은?",["가진 주식을 담보로 콜을 파는 것","콜을 두 개 사는 것","풋을 사는 것","선물 매수"],0,"추가 수입 전략이에요."],["풋을 쓴 뒤 주가가 행사가 아래로 떨어지면?",["행사가에 주식을 사게 된다","프리미엄을 돌려줌","아무 일 없음","주식을 받는다 무료"],0,"사고 싶던 가격이면 괜찮은 전략이에요."],["네이키드 옵션 쓰기가 위험한 이유는?",["손실이 매우 커질 수 있다","프리미엄을 못 받는다","세금이 크다","불법이다"],0,"그래서 증거금이 필요해요."]],
swap:[["금리 하락에 베팅하려면 스왑에서?",["고정 받기","고정 내기","원금 교환","아무것도 안 함"],0,"고정금리를 받으면 변동금리가 내릴수록 이익이에요."],["스왑에서 오가는 것은?",["이자 차이","원금 전체","주식","배당"],0,"원금은 오가지 않아요."],["변동금리로 빌린 회사가 금리 상승을 막으려면?",["고정 내기 스왑","고정 받기 스왑","주식 매도","배당 증가"],0,"이자를 고정하는 헤지예요."]],
etf:[["레버리지 ETF를 오래 들고 있으면?",["지수가 제자리여도 가치가 녹을 수 있다","항상 3배 수익","손실 불가","배당이 3배"],0,"매일 다시 맞추기 때문이에요."],["ETF 운용사의 수입은?",["운용 보수","배당 전부","주가 상승분","세금"],0,"AUM × 보수율이에요."],["종합지수 ETF를 사면?",["시장 전체를 조금씩 사는 셈","한 종목만 산다","채권을 산다","코인을 산다"],0,"가장 쉬운 분산이에요."]],
coin:[["레버리지 100배 롱은 가격이 약 몇 % 떨어지면 청산되나?",["약 1%","50%","10%","청산되지 않음"],0,"그래서 매우 위험해요."],["러그풀은?",["개발자가 투자금을 들고 사라지는 것","거래소 상장","반감기","배당"],0,"신규 코인에서 흔해요."],["펀딩비는 보통 누가 내나?",["롱이 많으면 롱이 숏에게","항상 거래소가","정부가","아무도"],0,"현물 가격에 붙어 다니게 하는 장치예요."]],
finco:[["보험사가 인수 자금줄로 인기 있는 이유는?",["보험료로 쌓인 현금(플로트)이 많아서","세금이 없어서","주가가 높아서","빚이 없어서"],0,"원작 고수들의 비법이에요."],["은행을 지배하면 할 수 있는 것은?",["부실 회사 대출 회수","세금 면제","주가 조작","무한 대출"],0,"헐값 매물을 만들 수 있어요."],["은행의 기본 수익원은?",["예대마진(대출 이자 − 예금 이자)","배당","주가","보험료"],0,"금리 차이로 벌어요."]],
bank2:[["BIS 비율이 8% 아래면?",["신규 대출이 막힌다","보너스","배당 증가","세금 면제"],0,"규제 기준 미달이에요."],["서브프라임 비중이 높은 은행은?",["호황엔 많이 벌지만 위기 때 크게 잃는다","항상 안전","이익이 없다","규제가 없다"],0,"고수익 고위험이에요."],["loan-to-own은?",["부실 대출을 싸게 사서 법정관리 때 지분으로 바꾸기","대출을 무료로 주기","예금 늘리기","배당 받기"],0,"원작의 은행 전술이에요."]],
tax:[["개인이 받는 배당의 세율은 이 게임에서?",["40%","0%","10%","22%"],0,"그래서 지주회사가 유리해요."],["80% 이상 자회사가 모회사에 주는 배당은?",["비과세","40%","10%","5%"],0,"그룹 안에서 세금 없이 돈을 옮겨요."],["연결납세의 장점은?",["한 회사 손실로 다른 회사 이익의 세금을 줄인다","세금이 두 배","배당 금지","주가 상승 확정"],0,"80% 이상 자회사와 합쳐 내요."]],
rsch:[["숨은 경쟁력이 주가에 반영되는 때는?",["실적으로 드러난 뒤","리서치를 의뢰하는 순간","절대 안 된다","상장일"],0,"그래서 먼저 아는 사람이 벌어요."],["더 깊은 리서치의 대가는?",["더 많은 돈과 시간","무료","주가 하락","세금 증가"],0,"정보에는 비용이 들어요."],["애널리스트 의견의 약점은?",["모두가 아는 정보이고 낙관적으로 기울어 있다","항상 틀린다","비싸다","비공개다"],0,"참고는 하되 맹신하지 마세요."]],
risk:[["50% 손실 뒤 본전이 되려면 얼마가 올라야 하나?",["100%","50%","25%","75%"],0,"그래서 큰 손실을 피하는 게 중요해요."],["분산 투자의 목적은?",["한 곳의 사고로 전체가 무너지지 않게","수익 극대화 확정","세금 회피","배당 증가"],0,"살아남기 위해서예요."],["감독원 주목도가 높을 때 해야 할 일은?",["위험한 제안을 거절","더 많이 수락","루머 유포","분식회계"],0,"구속 위험을 줄여요."]],
strat:[["'보험사 = 금고' 전략의 핵심은?",["보험사의 현금으로 인수","보험 가입","배당 포기","주식 매도"],0,"플로트를 인수 자금으로 써요."],["업종 장악 전략에서 성장률을 낮추는 이유는?",["공급을 줄여 업종 마진을 올리려고","세금 때문","배당 때문","주가 하락을 위해"],0,"수요 > 설비면 마진이 올라요."],["LBO 후 재상장 전략은?",["싸게 사서 개선 후 비싸게 상장","무조건 손해","불법","배당만 받기"],0,"원작의 단골 전략이에요."]],
aiplay:[["전설 난이도의 라이벌은?",["해마다 서로 배우고 리서치 실력이 는다","절대 변하지 않는다","거래하지 않는다","항상 진다"],0,"자동 학습이에요."],["챌린지에서 같은 시드의 의미는?",["모두 같은 세계와 사건을 겪는다","같은 돈을 번다","같은 회사를 산다","시간이 멈춘다"],0,"실력만으로 겨뤄요."],["관전 모드의 목적은?",["AI 거장들의 전략을 보고 배우기","돈 벌기","치트","튜토리얼 건너뛰기"],0,"다른 관점을 배워요."]]};
let QS=null;
G.quiz=id=>{const q=QZ[id];if(!q)return toast("이 장은 퀴즈가 없어요");QS={id,n:0,ok:0,a:null};qzMd()};
function qzPerm(id,n,k){const a=Array.from({length:k},(_,j)=>j);let s=mix32(id.length*977+id.charCodeAt(0),n*31+7);for(let j=k-1;j>0;j--){s=mix32(s,j);const r=s%(j+1);[a[j],a[r]]=[a[r],a[j]]}return a}
function qzMd(){const q=QZ[QS.id],x=q[QS.n],done=QS.a!=null,pm=qzPerm(QS.id,QS.n,x[1].length);openMd({t:"퀴즈 "+(QS.n+1)+"/"+q.length,b:x[0],h:`<div class="bs" style="flex-direction:column">${pm.map(j=>`<button class="${done?(j===x[2]?"p":j===QS.a?"d":""):""}" style="text-align:left" onclick="G.qa(${j})"${done?" disabled":""}>${esc(x[1][j])}</button>`).join("")}</div>${done?`<div class="card" style="margin-top:8px;line-height:1.6">${QS.a===x[2]?"✅ 정답!":"❌ 아쉬워요."} ${esc(x[3])}</div>`:""}`,o:done?[[QS.n<q.length-1?"다음 문제":"결과 보기","y"]]:[["그만두기","n"]]});
mcb=()=>{if(QS.n<q.length-1){QS.n++;QS.a=null;qzMd()}else qzEnd()}}
G.qa=j=>{if(!QS||QS.a!=null)return;const x=QZ[QS.id][QS.n];QS.a=j;if(j===x[2])QS.ok++;qzMd()};
function qzEnd(){const id=QS.id,ok=QS.ok,n=QZ[id].length,first=!S.qz[id],pass=ok>=Math.ceil(n*.6);let rw="";if(pass&&first){S.qz[id]=ok;S.rc+=2;S.cash+=3;rw=" 보상: 리서치 크레딧 2개 + 현금 3억!"}else if(pass)S.qz[id]=Math.max(S.qz[id]||0,ok);
openMd({t:pass?"🎉 통과!":"다시 도전해 보세요",b:n+"문제 중 "+ok+"개 정답."+(rw||(pass?" (보상은 장마다 한 번)":" "+Math.ceil(n*.6)+"개 이상 맞히면 통과예요.")),h:`<div class="mu">리서치 크레딧 ${S.rc}개 · 크레딧은 회사 리서치 비용 대신 쓸 수 있어요.</div>`,o:[["확인","n"]]});QS=null}

// ---- v12 UI part 1: market segments (commodities, coins, ETFs), coin page, derivatives desk, economy, alerts, ownership, market share, heat map ----
const segBar=()=>`<div class="seg">${[[0,"주식"],[2,"지수"],[1,"원자재"],[3,"코인"],[4,"ETF"]].map(([v,t])=>B(t,"G.seg("+v+")",mseg===v?"on":"")).join("")}</div>`;
const bar1=(v,c)=>`<div class="bar" style="margin:4px 0"><i style="width:${Math.max(0,Math.min(100,v*100)).toFixed(1)}%;background:${c||"var(--ac)"}"></i></div>`;
const ret1=(o,n)=>{if(!o.hn||o.hn<2)return 0;const k=Math.min(n,o.hn-1);let s=0;for(let j=0;j<k;j++)s+=o.hr[(o.hn-1-j)%DH];return Math.exp(s/RU)-1};
// commodities (spot) with a link to their futures curve
function cmSeg(){return S.cm.slice(0,5).map((m,j)=>{const p=ret1(m,10)*100,v=m.h*m.p/1e8,cv=futCurve("C:"+m.k);return `<div class="card"><div class="row"><span onclick="G.chart('m:${j}')" style="cursor:pointer"><b>${m.n}</b> <span class="mu">${m.k} · ${m.u}당 · 차트 ›</span></span><span class="pl ${p>=0?"u":"d"}">${Wc(m.p)}</span></div>
<div class="row"><span class="mu num">${P1(p)} (10일) · 적정 ${Wc(m.f)}${v>0?" · 보유 "+F(v)+" · 손익 "+F(v-m.b):""}</span>${spark(m.hist,90)}</div><div class="mu">선물 곡선: ${cv.shape}</div>
<div class="bs">${B("+10억",`G.cbuy(${j},10)`)}${B("+100억",`G.cbuy(${j},100)`)}${B("절반 매도",`G.csell(${j},.5)`,"",!m.h)}${B("전량 매도",`G.csell(${j},1)`,"",!m.h)}${B("선물 ›",`G.dvGo('f','C:${m.k}')`,"p")}</div></div>`}).join("")+`<p class="mu" style="line-height:1.6">유가가 오르면 물가와 금리가 오르고 GDP가 둔화돼요. 에너지 업종은 웃고 항공·물류는 웁니다. 금융위기 때는 금값이 뜁니다. 매매 차익에는 22% 세금이 붙어요.</p>`}
// crypto board
function cxFG(){const a=cxAlive().filter(x=>x.cat!=="stable");if(!a.length)return 50;const hy=a.reduce((s,x)=>s+x.hy,0)/a.length,B0=S.cx[0],r30=ret1(B0,30);return Math.round(Math.max(0,Math.min(100,50+hy*40-20+r30*120)))}
function coinSeg(){const al=cxAlive().sort((a,b)=>cxCap(b)-cxCap(a)),tot=al.reduce((s,x)=>s+cxCap(x),0),B0=S.cx.find(x=>x.k==="BTC"),ph=cxPhase(),fg=cxFG(),man=Object.keys(S.cxm||{}).filter(k=>S.cxm[k]>0),dead=S.cx.filter(x=>x.dead).slice(-6).reverse(),hv=cxv()+ppVal();
return `<div class="pn"><div class="ph"><b>코인 생태계</b><span class="mu">${al.length}종 상장 · 누적 탄생 ${S.cxs.b} · 소멸 ${S.cxs.d}</span></div><div class="mi2"><div><span class="mu">전체 시총</span><span class="num">${F(tot)}</span></div><div><span class="mu">비트코인 비중</span><span class="num">${(cxCap(B0)/Math.max(1,tot)*100).toFixed(1)}%</span></div><div><span class="mu">반감기</span><span class="num">D-${ph.next}</span></div><div><span class="mu">국면</span><span>${ph.lab}</span></div><div><span class="mu">공포·탐욕</span><span class="num ${fg>=60?"up":fg<=40?"dn":""}">${fg} ${fg>=75?"극단적 탐욕":fg>=60?"탐욕":fg<=25?"극단적 공포":fg<=40?"공포":"중립"}</span></div><div><span class="mu">광풍</span><span>${man.length?man.map(k=>CXC[k][0]).join(", "):"없음"}</span></div></div>
${hv>0?`<div class="br"><span class="bl">내 코인 (현물 + 선물 평가)</span><span class="bv num">${F(hv)}</span></div>`:""}</div>`+
al.map(x=>{const r=x.r1*100,cp=cxCap(x),h=x.h*x.p/1e8;return `<div class="rw" onclick="G.cxOpen('${x.k}')"><div class="lg" style="background:hsl(${(x.k.charCodeAt(0)*37+x.k.charCodeAt(1)*11)%360},45%,30%)">${esc(x.k.slice(0,3))}</div><div class="nm"><b>${esc(x.k)}</b> <span class="bd">${CXC[x.cat][0]}</span>${x.born>S.day-90&&x.born>0?'<span class="bd rv">신규</span>':""}<div class="mu">${esc(x.n)} · 시총 ${F(cp)}${h>0?" · 보유 "+F(h):""}</div>${x.cat==="stable"?"":`<div class="bar" style="margin:3px 0 0;height:4px;max-width:120px"><i style="width:${(x.hy*100).toFixed(0)}%;background:var(--warn)"></i></div>`}</div><div class="r"><span class="pl ${r>=0?"u":"d"}">${Wc(x.p)}</span><div class="mu num ${r>=0?"up":"dn"}">${P1(r)}</div></div></div>`}).join("")+
(dead.length?`<h4>코인 무덤</h4><div class="card log">${dead.map(x=>esc(x.k+" "+x.n+" — "+(x.dead.why||"상장폐지"))).join("<br>")}</div>`:"")+`<h4>코인 뉴스</h4><div class="card log">${(S.cxl||[]).slice(0,10).map(esc).join("<br>")||"아직 없습니다."}</div><div class="bs">${B("개념서: 코인","G.book('coin')")}${B("코인 선물 포지션","G.dvGo('p')")}</div>`}
let CXK="BTC",PPS={s:1,m:10,l:5};
G.cxOpen=k=>{CXK=k;sel=-1;pg="cx";render();scrollTo(0,0)};
function cxPg(){const x=S.cx.find(z=>z.k===CXK);if(!x)return hd("코인")+'<p class="mu">없는 코인입니다.</p>';const z=CXC[x.cat],r=x.r1*100,h=x.h*x.p/1e8,ps=S.pp.map((p,n)=>[p,n]).filter(([p])=>p.k===x.k),f=ppFund(x),lev=PPS.l,mg=PPS.m,liq=x.p*(PPS.s>0?1-1/lev+ppMMR(x.k):1+1/lev-ppMMR(x.k));
return hd(x.k+" "+x.n)+`<div class="row"><span><span class="bd">${z[0]}</span>${x.dead?'<span class="bd rv">상장폐지</span>':""}${x.lst?"":'<span class="bd">소형 거래소</span>'}</span>${B("차트 ›",`G.chart('x:${x.k}')`)}</div>
<div class="row" style="margin-top:6px"><b class="big ${r>=0?"up":"dn"}" style="font-size:28px">${Wc(x.p)}</b><span class="mu num" style="text-align:right">오늘 ${P1(r)} · 30일 ${P1(ret1(x,30)*100)}<br>시총 ${F(cxCap(x))} · 고점 대비 ${P1((x.p/x.ath-1)*100)}</span></div>
<div class="card mu" style="line-height:1.6;margin-top:8px">${z[4]} 비트코인 베타 ${x.be.toFixed(2)} · 하루 변동 약 ${(x.v*100).toFixed(1)}% · 열기 ${(x.hy*100).toFixed(0)}/100${x.born>0?" · "+ds(x.born)+" 상장":""}</div>
<div class="pn"><div class="ph"><b>현물</b><span class="mu">수수료 0.1% · 차익 22% 과세</span></div>${brow("보유",h>0?F(h)+" (손익 "+F(h-x.b)+")":"없음")}<div class="br"><span class="bb w">${xb("매수",`G.cxQ('${x.k}')`,"gr",!!x.dead)}${xb("+1억",`G.cxB('${x.k}',1)`,"gr",!!x.dead)}${xb("+10억",`G.cxB('${x.k}',10)`,"gr",!!x.dead)}${xb("절반 매도",`G.cxS('${x.k}',.5)`,"rd",!x.h||!!x.dead)}${xb("전량 매도",`G.cxS('${x.k}',1)`,"rd",!x.h||!!x.dead)}</span></div></div>`+
(x.cat==="stable"||x.dead?"":`<div class="pn"><div class="ph"><b>무기한 선물 (레버리지 1~100배)</b><span class="mu">펀딩 하루 ${(f*100).toFixed(3)}%</span></div><div style="padding:8px 12px"><div class="seg" style="margin-bottom:6px">${B("롱 (상승)","PPS.s=1;render()",PPS.s>0?"on":"")}${B("숏 (하락)","PPS.s=-1;render()",PPS.s<0?"on":"")}</div>
<div class="mu">증거금</div><div class="ch">${[1,5,10,50,100].map(v=>B(F(v),"PPS.m="+v+";render()",mg===v?"on":"")).join("")}</div><div class="mu" style="margin-top:6px">레버리지 <b>${lev}배</b></div><input type="range" min="1" max="100" step="1" value="${lev}" style="width:100%;accent-color:var(--ac)" oninput="PPS.l=+this.value;G.ppPv()" onchange="render()" aria-label="레버리지">
<div class="ch">${[1,2,5,10,25,50,100].map(v=>B(v+"x","PPS.l="+v+";render()",lev===v?"on":"")).join("")}</div><div id="ppv" class="card" style="margin-top:6px;line-height:1.6">${ppPvTxt(x)}</div><div class="bs">${B(PPS.s>0?"롱 진입":"숏 진입",`G.ppOpen('${x.k}',${PPS.s},${mg},${lev})`,PPS.s>0?"p":"d")}</div></div></div>`)+
(ps.length?`<h4>내 ${x.k} 선물</h4>`+ps.map(([p,n])=>ppCard(p,n)).join(""):"")}
function ppPvTxt(x){const lev=PPS.l,N=PPS.m*lev,liq=x.p*(PPS.s>0?1-1/lev+ppMMR(x.k):1+1/lev-ppMMR(x.k)),mv=Math.abs(liq/x.p-1)*100;return `계약 규모 ${F(N)} · 청산가 <b>${Wc(liq)}</b> (${PPS.s>0?"−":"+"}${mv.toFixed(2)}%)<br><span class="mu">이 코인은 하루 평균 ${(x.v*100).toFixed(1)}% 움직여요. ${mv<x.v*100?"⚠ 하루 변동만으로도 청산될 수 있어요.":mv<x.v*300?"며칠 안에 청산될 수 있어요.":"비교적 여유가 있어요."}</span>`}
G.ppPv=()=>{const x=S.cx.find(z=>z.k===CXK),e=$("ppv");if(x&&e)e.innerHTML=ppPvTxt(x)};
function ppCard(p,n){const c=S.cx.find(z=>z.k===p.k),eq=ppEq(p),pnl=eq-p.mg-0;return `<div class="card"><div class="row"><b>${p.k} ${p.q>0?"롱":"숏"} ${p.lev}배</b><span class="num ${eq>=p.mg?"up":"dn"}">${F(eq)} <span class="mu">(${P1((eq/Math.max(1e-9,p.mg)-1)*100)})</span></span></div><div class="mu num">진입 ${Wc(p.en)} · 현재 ${Wc(c?c.p:0)} · 청산가 ${Wc(ppLiq(p))} · 증거금 ${F(p.mg)} · 누적 펀딩 ${F(-p.fd)}</div><div class="bs">${B("청산",`G.ppClose(${n})`)}</div></div>`}
// ETF board
function etfSeg(){const a=S.etf||[];return `<div class="mu" style="line-height:1.6;margin-bottom:6px">ETF는 지수·바스켓을 주식처럼 사고파는 펀드예요. 운용사(증권사)가 연 보수를 받고, 내 증권사가 운용권을 살 수도 있어요. ${B("개념서: ETF","G.book('etf')")}</div>`+
a.map(e=>{const r=(e.r1||0)*100,m30=ret1(e,30)*100,h=etfHv(e),mg=S.co[e.mgr];return `<div class="card"><div class="row"><span onclick="G.chart('e:${e.k}')" style="cursor:pointer;min-width:0"><b>${e.k}</b> <span class="mu">${esc(e.n)} · 차트 ›</span></span><span class="pl ${r>=0?"u":"d"}">${W(e.p)}</span></div>
<div class="mu num">오늘 ${P1(r)} · 30일 ${P1(m30)} · 운용 ${F(e.aum+h)} · 보수 ${e.fee}%${e.L!==1?" · "+e.L+"배":""} · 운용사 ${mg?esc(mg.tk)+(mine(mg)?" (내 회사)":""):"-"}${h>0?" · 보유 "+F(h)+" (손익 "+F(h-e.b)+")":""}</div>
<div class="bs">${B("매수",`G.etfQ('${e.k}')`)}${B("+10억",`G.etfB('${e.k}',10)`)}${B("절반 매도",`G.etfS('${e.k}',.5)`,"",!e.h)}${B("전량 매도",`G.etfS('${e.k}',1)`,"",!e.h)}${teOK()!=="P"&&S.co[teOK()].i===3&&e.mgr!==teOK()?B("운용권 인수",`G.etfMgr('${e.k}')`,"p"):""}</div></div>`}).join("")}

// ===== derivatives desk =====
let DV={t:"f",u:"C:OIL"};
G.dvGo=(t,u)=>{DV.t=t;if(u)DV.u=u;sel=-1;pg="dv";render();scrollTo(0,0)};
function dvPg(){const tabs=[["f","선물"],["o","옵션"],["s","스왑"],["p","코인 선물"]];let h=hd("파생상품")+`<div class="stb">${tabs.map(([k,t])=>B(t,`DV.t='${k}';render()`,DV.t===k?"on":"")).join("")}</div>`;
if(DV.t==="f"){const us=[...S.cm.slice(0,5).map(m=>["C:"+m.k,m.n]),["I:ALL","종합지수"],["I:L50","대형50"]],cur=DV.u,s=fsp(cur);
h+=`<div class="ch">${us.map(([u,t])=>B(t,`DV.u='${u}';render()`,cur===u?"on":"")).join("")}${B("주식선물","G.sfPick()",cur[0]==="S"?"on":"")}</div>`;
if(cur[0]==="S"&&(!s.c||s.c.dead||!(S.l50||[]).includes(s.c.id)))h+=`<p class="mu">대형 50 종목을 고르세요.</p>`;else{const cv=futCurve(cur),mx=Math.max(...cv.a.map(x=>x[1]),cv.sp),mn=Math.min(...cv.a.map(x=>x[1]),cv.sp),Wd=320,Hd=70,pt=[[0,cv.sp],...cv.a.map((x,j)=>[j+1,x[1]])],xs=j=>8+j/(cv.a.length)*(Wd-16),ys=v=>Hd-8-(v-mn)/Math.max(1e-9,mx-mn)*(Hd-16);
h+=`<div class="pn"><div class="ph"><b>${esc(s.n)}</b><span class="mu">1계약 = ${esc(s.unit)} · 증거금 ${(s.im*100).toFixed(0)}% (유지 ${(s.mm*100).toFixed(1)}%)</span></div>
<svg viewBox="0 0 ${Wd} ${Hd}" width="100%" height="${Hd}" aria-label="선물 곡선"><polyline fill="none" stroke="var(--ac)" stroke-width="2" points="${pt.map(([j,v])=>xs(j).toFixed(1)+","+ys(v).toFixed(1)).join(" ")}"/>${pt.map(([j,v])=>`<circle cx="${xs(j).toFixed(1)}" cy="${ys(v).toFixed(1)}" r="3" fill="${j?"var(--ac)":"var(--gold)"}"/>`).join("")}</svg>
${brow("현물 (지금)",fpx(cur,cv.sp))}${cv.a.map(([m,p])=>brow(futLab(cur,m)+" <span class='mu'>D-"+(m-S.day)+"</span>",fpx(cur,p)+" <span class='mu'>"+P1((p/cv.sp-1)*100)+"</span>",xb("매매",`G.ftq('${cur}',${m})`,"gr"))).join("")}<div class="br mu" style="line-height:1.55">${cv.shape}. ${s.t==="C"?"현물이 적정가("+Wc(s.m.f)+")에서 멀수록 먼 달 가격이 적정가 쪽으로 기울어요.":"이자에서 배당을 뺀 만큼 먼 달이 비싸요."}</div></div>`}
const my=S.fx.map((p,n)=>[p,n]);h+=`<h4>보유 선물 (${my.length})</h4>`+(my.map(([p,n])=>{const s2=fsp(p.u),im=Math.abs(p.q)*s2.mult*p.px*s2.im;return `<div class="card"><div class="row"><b>${esc(s2.n)} ${futLab(p.u,p.m)}</b><span class="num">${p.q>0?"매수 ":"매도 "}${Math.abs(p.q).toFixed(p.q%1?2:0)}계약</span></div>
<div class="mu num">${p.e==="P"?"나":esc(S.co[p.e]?S.co[p.e].tk:"?")} · 정산가 ${fpx(p.u,p.px)} · 계약 가치 ${F(fNot(p,s2))} · 증거금 ${F(p.mg)} (필요 ${F(im)}) · 손익 <span class="${p.mg-(p.dep||0)>=0?"up":"dn"}">${F(p.mg-(p.dep||0))}</span>${p.dv?" · 만기 실물 인수":""}</div><div class="bs">${B("청산",`G.ftx(${n})`)}${p.u[0]==="C"&&p.q>0?B(p.dv?"현금 정산으로":"실물 인수로",`G.ftd(${n})`):""}</div></div>`}).join("")||`<p class="mu">계약의 '매매' 버튼으로 시작하세요. 양수는 매수, 음수는 매도예요. 지금 거래 주체: ${esc(eName(teOK()))}</p>`)}
else if(DV.t==="o"){h+=`<div class="mu" style="line-height:1.6">종목 화면의 매매 탭에서 행사가·만기·규모를 골라 옵션을 사거나 쓸 수 있어요. 깊은 내가격 콜은 행사해서 지분을 싸게 넘겨받을 수 있어요.</div><h4>산 옵션 (${S.op.length}/30)</h4>`+(S.op.map((o,n)=>{const c=S.co[o.i],it=Math.max(0,o.t==="C"?c.p-o.k:o.k-c.p)*o.nsh/1e4;return `<div class="card"><div class="row"><b>${esc(c.tk)} ${o.t==="C"?"콜":"풋"} ${(o.nsh/c.sh*100).toFixed(1)}%</b><span class="num">${F(opv(o))}</span></div><div class="mu num">행사가 ${W(o.k)} · 주가 ${W(c.p)} · 만기 ${Math.max(0,o.exp-S.day)}일 · 낸 돈 ${F(o.pr)} · 내재가치 ${F(it)}</div><div class="bs">${B("팔기",`G.oclose(${n})`)}${it>0?B(o.t==="C"?"행사 (주식 인수)":"조기 행사",`G.oex(${n})`,"p"):""}</div></div>`}).join("")||'<p class="mu">없음</p>')+
`<h4>쓴 옵션 (${S.ow.length}/20)</h4>`+(S.ow.map((o,n)=>{const c=S.co[o.i];return `<div class="card"><div class="row"><b>${esc(c.tk)} ${o.t==="C"?"콜":"풋"} 쓰기 ${(o.nsh/c.sh*100).toFixed(1)}%${o.cov?" · 커버드":""}</b><span class="num dn">−${F(owL(o))}</span></div><div class="mu num">행사가 ${W(o.k)} · 주가 ${W(c.p)} · 만기 ${Math.max(0,o.exp-S.day)}일 · 받은 프리미엄 ${F(o.pr)} · 증거금 ${F(o.mg)}</div><div class="bs">${B("되사기",`G.owx(${n})`)}</div></div>`}).join("")||'<p class="mu">없음</p>')}
else if(DV.t==="s"){h+=`<div class="mu" style="line-height:1.6">금리: 기준 ${S.prime.toFixed(2)}% · 단기 국채 ${S.yS.toFixed(2)}% · 장기 국채 ${S.yL.toFixed(2)}%. 스왑은 장부 밖(각주) 계약이고 손익은 분기마다 정산돼요. 지금 거래 주체: ${esc(eName(teOK()))}</div><div class="bs">${B("새 금리 스왑","G.swOpen()","p")}${B("개념서: 스왑","G.book('swap')")}</div><h4>스왑 (${S.irs.length})</h4>`+
(S.irs.map((x,n)=>{const cp=S.co[x.cp],fl=swRate(x.t);return `<div class="card"><div class="row"><b>${x.e==="P"?"나":esc(S.co[x.e]?S.co[x.e].tk:"?")} · ${F(x.N)} ${x.dir>0?"고정 받기":"고정 내기"}</b><span class="num ${x.tp>=0?"up":"dn"}">누적 ${F(x.tp)}</span></div><div class="mu num">고정 ${x.K.toFixed(2)}% vs ${SWT[x.t][0]} ${fl.toFixed(2)}% · 지난 분기 ${F(x.lp)} · 상대 ${cp?esc(cp.tk):"-"} · 남은 ${Math.max(0,Math.round((x.en-S.day)/90))}분기 · 평가(참고) ${F(swMtm(x))}</div><div class="bs">${B("조기 종료 (수수료 "+F(swFee(x))+")",`G.swEnd(${n})`)}</div></div>`}).join("")||'<p class="mu">아직 없어요.</p>')}
else{h+=`<div class="mu" style="line-height:1.6">코인 무기한 선물은 시장 탭 → 코인에서 코인을 골라 시작해요. 레버리지가 높을수록 청산가가 가까워요.</div>`+(S.pp.map((p,n)=>ppCard(p,n)).join("")||'<p class="mu">보유 포지션 없음</p>')+`<div class="bs">${B("코인 시장","G.go('m');G.seg(3)","p")}</div>`}
return h}
G.sfPick=()=>{const a=(S.l50||[]).map(id=>S.co[id]).filter(c=>c&&!c.dead&&!c.priv).slice(0,50);openMd({t:"주식선물 종목",b:"대형 50 종목만 주식선물이 있어요. 1계약 = 1,000주, 증거금 15%.",h:a.map(c=>`<div class="sr" onclick="DV.u='S:${c.id}';closeMd();render()"><span><b>${esc(c.tk)}</b> <span class="mu">${esc(c.n)}</span></span><span class="num">${W(c.p)}</span></div>`).join(""),o:[["닫기","n"]]})};

// ===== economy =====
const yc=()=>S.yL-S.yS;
function econCard(){const fed=FED[fedOf()],inv=yc()<0,h=S.mh||[],sp=k=>h.length>1?spark(h.map(x=>x[k]),70,22):"",cell=(n,v,k,ch)=>`<div class="cv"${ch?` onclick="G.chart('${ch}')" style="cursor:pointer"`:""}><span class="mu">${n}</span><span class="row"><b class="num">${v}</b>${sp(k)}</span></div>`;
return `<h3>경제</h3><div class="pn"><div class="ph"><b>경제 지표</b><span class="mu">경기 ${S.cyc||"-"} · 중앙은행 ${fed}</span>${xb("자세히","G.pg('econ')")}</div><div class="mi2">${cell("기준금리",S.prime.toFixed(2)+"%","pr","i:RATE")}${cell("물가",S.inf.toFixed(1)+"%","inf","i:INF")}${cell("단기 국채",S.yS.toFixed(2)+"%","ys","i:YS")}${cell("장기 국채",S.yL.toFixed(2)+"%","yl","i:YL")}${cell("GDP 성장",S.gdp.toFixed(1)+"%","g")}${cell("실업률",S.un.toFixed(1)+"%","un")}${cell("신용 스프레드",S.csp.toFixed(2)+"%p","cs")}${cell("원/달러",Math.round(S.fxr).toLocaleString(),"fx","i:FXR")}</div>
<div class="br"><span class="bl">장단기 금리차 (장기 − 단기)</span><span class="bv num ${inv?"dn":""}">${yc()>=0?"+":""}${yc().toFixed(2)}%p${inv?" 역전!":""}</span></div>${S.bsw?`<div class="br"><span class="bl wr">🦢 진행 중인 블랙 스완</span><span class="bv">${esc(S.bsw.n)}</span></div>`:""}${S.scn?`<div class="br"><span class="bl">📜 시나리오</span><span class="bv">${esc(S.scn.n)}</span></div>`:""}</div>
<div class="card mu" style="line-height:1.6">유가 ${W(S.cm[2].p)} · 금 ${Wc(S.cm[0].p)} · 비트코인 ${Wc(S.cm[5].p)}<div class="bs">${B("종합지수","G.chart('i:ALL')")}${B("공포지수","G.chart('i:VIX')")}${B("모든 지수","G.go('m');G.seg(2)")}${B("개념서: 경제","G.book('macro2')")}</div></div>`}
function econPg(){const h=S.mh||[],row=(n,k,u,d)=>{const v=h.map(x=>x[k]);return `<div class="rw" style="cursor:default"><div class="nm"><b style="font-size:15px">${n}</b><div class="mu" style="white-space:normal">${d}</div></div>${v.length>1?spark(v,86,28):""}<div class="r"><b class="num">${v.length?v[v.length-1]:"-"}${u}</b></div></div>`};
const st=fedOf(),dP=S.mh&&S.mh.length>1?S.mh[S.mh.length-1].pr-S.mh[S.mh.length-2].pr:0;
return hd("경제 지표")+`<div class="card"><div class="row"><b>중앙은행: ${FED[st]}</b><span class="mu">${dP>.05?"인상 중 ▲":dP<-.05?"인하 중 ▼":"동결"}</span></div><div class="mu" style="margin-top:4px;line-height:1.6">테일러 준칙 목표 금리 약 ${Math.max(2,7.5+1.5*(S.inf-2.5)+.5*(S.gdp-3)).toFixed(2)}% (물가 목표 2.5%). ${st===0?"금리가 바닥이라 돈을 찍어 푸는 양적완화 중이에요. 자산 가격에 순풍입니다.":st>=3?"물가를 잡으려고 돈줄을 죄는 중이에요. 빚 많은 회사와 성장주에 역풍입니다.":"경기와 물가가 균형에 가까워요."}</div></div>
<div class="card"><b>금리 곡선</b>${ycSvg()}<div class="mu" style="line-height:1.6">${yc()<0?"⚠ 단기 금리가 장기보다 높은 역전 상태예요. 역사적으로 1~2년 안에 침체가 자주 왔어요.":"정상(우상향) 곡선이에요."}</div></div>
<h4>분기별 흐름 (최근 ${h.length}분기)</h4>`+row("기준금리","pr","%","중앙은행이 정하는 금리. 모든 이자의 기준")+row("물가 상승률","inf","%","2.5% 목표. 높으면 금리 인상 압력")+row("GDP 성장률","g","%","경기의 속도. 침체는 0 아래")+row("실업률","un","%","낮으면 임금·물가 압력, 높으면 소비 위축")+row("단기 국채","ys","%","기준금리를 따라가요")+row("장기 국채","yl","%","물가 기대와 성장 전망을 반영")+row("신용 스프레드","cs","%p","공포가 크면 벌어져 기업 이자 부담 증가")+row("원/달러 환율","fx","원","오르면 수출주 유리, 수입·항공 불리")+row("종합지수","ix","","")+
`<h4>나라별 특성 (30개국)</h4>`+RGN.map(rg=>`<div class="mu" style="margin:8px 0 2px">${rg}</div>`+CTRY.map((x,k)=>[x,k]).filter(([x])=>x[1].rg===rg).map(([x,k])=>{const t=x[1],n=S.co.filter(c=>!c.dead&&!c.priv&&c.cty===k).length;return `<div class="sr" style="cursor:default;display:block"><div class="row"><b>${esc(x[0])}</b><span class="mu">상장 ${n} · 법인세 ${(t.tax*100).toFixed(0)}%</span></div><div class="mu" style="white-space:normal">${esc(x[2])} · 방어 ${t.res>=0?"+":""}${t.res} · 밸류 ×${t.vm} · 성장 ${t.gr>=0?"+":""}${t.gr} · 정치 위험 ${t.pol} · 노조 ${t.lab}${t.reg?" · 주목도 +"+t.reg+"/분기":""}</div></div>`}).join("")).join("")+
(S.bsl&&S.bsl.length?`<h4>지나간 블랙 스완</h4><div class="card log">${S.bsl.map(x=>esc(x.d+" "+x.n)).join("<br>")}</div>`:"")}
function ycSvg(){const pts=[["기준",S.prime],["단기",S.yS],["장기",S.yL]],mx=Math.max(...pts.map(x=>x[1]))+.5,mn=Math.max(0,Math.min(...pts.map(x=>x[1]))-.5),W0=300,H0=80,x=j=>30+j*120,y=v=>H0-14-(v-mn)/Math.max(.1,mx-mn)*(H0-28);
return `<svg viewBox="0 0 ${W0} ${H0}" width="100%" height="${H0}" aria-label="금리 곡선"><polyline fill="none" stroke="${yc()<0?"var(--dn)":"var(--ac)"}" stroke-width="2.5" points="${pts.map((p,j)=>x(j)+","+y(p[1]).toFixed(1)).join(" ")}"/>${pts.map((p,j)=>`<circle cx="${x(j)}" cy="${y(p[1]).toFixed(1)}" r="4" fill="var(--ac)"/><text x="${x(j)}" y="${H0-2}" font-size="11" fill="var(--mu)" text-anchor="middle">${p[0]} ${p[1].toFixed(2)}%</text>`).join("")}</svg>`}

// ===== alert center =====
function ntPg(){const a=S.nt||[];const h=hd("알림 센터 🔔")+`<div class="bs">${B("모두 읽음","G.ntRead()")}${B("진동: "+(S.cfg.vib?"켜짐":"꺼짐"),"S.cfg.vib=S.cfg.vib?0:1;render()")}</div><div class="mu" style="margin:6px 0;line-height:1.6">가격 알림, 실적 발표, 마진콜·청산, 리서치 결과, 블랙 스완, 공시가 여기 모여요. 앱이 꺼져 있으면 게임 시간도 멈추기 때문에 휴대폰 시스템 알림 대신 여기서 확인해요.</div>`;
const out=h+(a.map(x=>`<div class="sr" style="cursor:default;display:block;${x.r?"opacity:.6":""}"><div class="mu">${esc(x.d)}${x.r?"":' <span class="bd rv">새 알림</span>'}</div><div style="margin-top:2px;line-height:1.5">${esc(x.t)}</div></div>`).join("")||'<p class="mu">알림이 없어요.</p>');for(const x of a)x.r=1;return out}
G.ntRead=()=>{for(const x of S.nt||[])x.r=1;render()};
function ntBadge(){const e=$("nbn");if(!e)return;const n=ntN();e.textContent=n>9?"9+":n||"";e.hidden=!n}

// ===== ownership map (Who owns what) =====
let OWN="P";
function ownPg(){const ents=[["P","나"],...S.co.filter(mine).map(c=>["c"+c.id,c.tk]),...S.R.map((r,i)=>["r"+i,r.n])],k=OWN;let h=hd("지분 구조도")+`<div class="ch">${ents.slice(0,30).map(([v,t])=>B(esc(t),`OWN='${v}';render()`,k===v?"on":"")).join("")}${B("다른 회사…","G.ownPick()")}</div>`;
if(k==="P"||k[0]==="r")h+=ownGraph(k);
const hs=S.co.filter(c=>!c.dead&&c.own[k]>0).sort((a,b)=>hv(b,b.own[k])-hv(a,a.own[k]));h+=`<h4>주식 지분 (${hs.length})</h4>`+(hs.map(c=>`<div class="sr" onclick="G.pick(${c.id})"><span><b>${esc(c.tk)}</b> <span class="mu">${esc(c.n)}${c.ctl===root(k)?" · 경영권":""}</span></span><span class="num">${c.own[k].toFixed(2)}% · ${F(hv(c,c.own[k]))}</span></div>`).join("")||'<p class="mu">없음</p>');
const e=k==="P"?"P":k[0]==="c"?+k.slice(1):null;if(e!=null){const fx=S.fx.filter(p=>p.e===e),sw=S.irs.filter(x=>x.e===e);if(fx.length)h+=`<h4>선물</h4>`+fx.map(p=>brow(esc(fsp(p.u).n)+" "+futLab(p.u,p.m),(p.q>0?"매수 ":"매도 ")+Math.abs(p.q)+" · 증거금 "+F(p.mg))).join("");if(sw.length)h+=`<h4>금리 스왑 (장부 밖)</h4>`+sw.map(x=>brow(F(x.N)+" "+(x.dir>0?"고정 받기":"고정 내기"),x.K.toFixed(2)+"% vs "+SWT[x.t][0])).join("")}
if(k==="P"){const op=S.op.length+S.ow.length,cx=cxAlive().filter(x=>x.h>0),et=(S.etf||[]).filter(x=>x.h>0),bd=S.co.filter(c=>c.bh>0&&!c.dead);if(op)h+=`<h4>옵션</h4>`+S.op.map(o=>brow(esc(S.co[o.i].tk)+" "+(o.t==="C"?"콜":"풋")+" 매수",F(opv(o)))).join("")+S.ow.map(o=>brow(esc(S.co[o.i].tk)+" "+(o.t==="C"?"콜":"풋")+" 쓰기","−"+F(owL(o)))).join("");
if(cx.length||S.pp.length)h+=`<h4>코인</h4>`+cx.map(x=>brow(x.k,F(x.h*x.p/1e8))).join("")+S.pp.map(p=>brow(p.k+" "+(p.q>0?"롱":"숏")+" "+p.lev+"x",F(ppEq(p)))).join("");if(et.length)h+=`<h4>ETF</h4>`+et.map(x=>brow(x.k,F(etfHv(x)))).join("");
if(bd.length||S.gb)h+=`<h4>채권</h4>`+(S.gb?brow("국채",F(gbv())):"")+bd.map(c=>brow(esc(c.tk)+" 회사채",F(bv(c)))).join("");const pa=S.co.filter(c=>c.pa>0&&!c.dead);if(pa.length)h+=`<h4>대여금</h4>`+pa.map(c=>brow(esc(c.tk),F(c.pa))).join("");if((S.eo||[]).length)h+=`<h4>스톡옵션</h4>`+S.eo.map(o=>brow(esc(S.co[o.i].tk)+" "+o.pct+"% @"+W(o.k),S.day>=o.v?F(eoV(o)):"미확정")).join("")}
if(k[0]==="c"){const c=S.co[+k.slice(1)];h+=`<h4>${esc(c.tk)}의 주주</h4><div class="card">${holders(c)}</div>`}return h}
G.ownPick=()=>openMd({t:"회사 고르기",b:"지분 구조를 볼 회사를 검색하세요.",h:`<input class="in" placeholder="티커 또는 이름" oninput="document.getElementById('owl').innerHTML=ownList(this.value)" aria-label="회사 검색"><div id="owl">${ownList("")}</div>`,o:[["닫기","n"]]});
const ownList=v=>{v=String(v||"").toLowerCase();return S.co.filter(c=>!c.dead&&(!v||c.tk.toLowerCase().includes(v)||c.n.toLowerCase().includes(v))).slice(0,30).map(c=>`<div class="sr" onclick="OWN='c${c.id}';closeMd();render()"><span><b>${esc(c.tk)}</b> <span class="mu">${esc(c.n)}</span></span><span class="mu">›</span></div>`).join("")};
// layered SVG: an entity on top, the companies it controls below, their holdings below that
function ownGraph(k){const lv=[[{k,n:k==="P"?"나":S.R[+k.slice(1)].n}]],seen=new Set([k]),edges=[];for(let d=0;d<3;d++){const nx=[];for(const nd of lv[d]){for(const c of S.co){if(c.dead||seen.has("c"+c.id))continue;const p=c.own[nd.k]||0;if(p>=5){seen.add("c"+c.id);nx.push({k:"c"+c.id,n:c.tk,c});edges.push([nd.k,"c"+c.id,p,c.ctl===root(nd.k)])}}}if(!nx.length)break;lv.push(nx.slice(0,10))}
if(lv.length<2)return'<p class="mu">5% 이상 가진 회사가 없어요.</p>';const W0=Math.max(320,Math.max(...lv.map(l=>l.length))*78),H0=lv.length*74,pos={};lv.forEach((l,d)=>l.forEach((nd,j)=>{pos[nd.k]=[W0*(j+.5)/l.length,30+d*74]}));
let s="";for(const[a,b,p,ct]of edges){if(!pos[a]||!pos[b])continue;const[x1,y1]=pos[a],[x2,y2]=pos[b];s+=`<line x1="${x1.toFixed(0)}" y1="${(y1+14).toFixed(0)}" x2="${x2.toFixed(0)}" y2="${(y2-14).toFixed(0)}" stroke="${ct?"var(--gold)":"var(--ln)"}" stroke-width="${ct?2:1.2}"/><text x="${((x1+x2)/2).toFixed(0)}" y="${((y1+y2)/2+4).toFixed(0)}" font-size="10" fill="var(--mu)" text-anchor="middle">${p.toFixed(0)}%</text>`}
for(const id in pos){const[x,y]=pos[id],nd=lv.flat().find(z=>z.k===id),me=id==="P"||(nd.c&&mine(nd.c));s+=`<g ${nd.c?`onclick="G.pick(${nd.c.id})" style="cursor:pointer"`:""}><rect x="${(x-34).toFixed(0)}" y="${(y-14).toFixed(0)}" width="68" height="28" rx="8" fill="${me?"var(--gold)":"var(--sf2)"}"/><text x="${x.toFixed(0)}" y="${(y+4).toFixed(0)}" font-size="11.5" fill="${me?"#1a1405":"var(--tx)"}" text-anchor="middle" font-weight="700">${esc(String(nd.n).slice(0,7))}</text></g>`}
return `<div style="overflow-x:auto;margin-top:8px" class="card"><svg viewBox="0 0 ${W0} ${H0}" width="${W0}" height="${H0}" style="max-width:none" role="img" aria-label="지분 구조도">${s}</svg><div class="mu">금색 선 = 경영권 · 5% 이상 지분만 표시</div></div>`}

// ===== market share distribution (12) and heat map treemap =====
let SHI=0;
function hhiOf(i){const a=S.co.filter(c=>!c.dead&&c.i===i),t=a.reduce((s,c)=>s+c.A,0)||1;return Math.round(a.reduce((s,c)=>s+(c.A/t*100)**2,0))}
function shrPg(){const ids=INDS.concat([12,13]);if(!ids.includes(SHI))SHI=ids[0];const i=SHI,a=S.co.filter(c=>!c.dead&&c.i===i).sort((x,y)=>y.A-x.A),t=a.reduce((s,c)=>s+c.A,0)||1,hhi=hhiOf(i),cr3=a.slice(0,3).reduce((s,c)=>s+c.A/t,0),g={};
for(const c of a){const r=c.ctl||"pub";g[r]=(g[r]||0)+c.A/t}const gs=Object.entries(g).sort((x,y)=>y[1]-x[1]),col=r=>r==="P"?"var(--gold)":r[0]==="r"?"var(--bad)":r==="pub"?"var(--ln)":"var(--ac)";
let h=hd("업종 점유율 분포")+`<div class="ch">${ids.map(k=>B(SEC[k][0],`SHI=${k};render()`,k===i?"on":"")).join("")}</div>
<div class="pn" style="margin-top:8px"><div class="ph"><b>${SEC[i][0]}</b><span class="mu">${ARN[arOf(i)][0]}</span></div><div class="mi2"><div><span class="mu">HHI 집중도</span><span class="num">${hhi.toLocaleString()} ${hhi>2500?"고집중":hhi>1500?"중간":"경쟁적"}</span></div><div><span class="mu">상위 3개 (CR3)</span><span class="num">${(cr3*100).toFixed(0)}%</span></div><div><span class="mu">회사 수</span><span class="num">${a.length}</span></div><div><span class="mu">내 그룹</span><span class="num">${(myShare(i)*100).toFixed(1)}%</span></div></div>
<div style="padding:8px 12px"><div class="mu">지배 그룹별</div><div class="bar" style="height:14px">${gs.map(([r,v])=>`<i style="width:${(v*100).toFixed(1)}%;background:${col(r)}" title="${esc(r==="pub"?"독립":rootName(r))}"></i>`).join("")}</div><div class="mu num">${gs.slice(0,4).map(([r,v])=>(r==="pub"?"독립 회사":esc(rootName(r)))+" "+(v*100).toFixed(0)+"%").join(" · ")}</div></div></div>
<div class="card">`+a.slice(0,25).map(c=>{const s=c.A/t;return `<div onclick="G.pick(${c.id})" style="cursor:pointer;padding:4px 0"><div class="row"><span><b>${esc(c.tk)}</b> <span class="mu">${esc(c.n)}</span>${mine(c)?'<span class="bd me">내 지배</span>':c.ctl&&c.ctl[0]==="r"?'<span class="bd rv">라이벌</span>':""}</span><span class="num">${(s*100).toFixed(1)}%</span></div><div class="bar" style="margin:3px 0;position:relative"><i style="width:${(s*100).toFixed(1)}%;background:${col(c.ctl||"pub")}"></i></div></div>`}).join("")+`<div class="mu" style="margin-top:6px">점유율 = 업종 사업자산 대비. 한 그룹이 50%를 넘으면 독점금지 소송 위험, 35%를 넘으면 조사 사건이 생길 수 있어요.</div></div>`;
h+=`<h4>전체 업종 집중도</h4>`+ids.map(k=>{const b=S.co.filter(c=>!c.dead&&c.i===k).sort((x,y)=>y.A-x.A),tt=b.reduce((s,c)=>s+c.A,0)||1;return b.length?brow(`<span onclick="SHI=${k};render()" style="cursor:pointer">${SEC[k][0]}</span>`,"HHI "+hhiOf(k).toLocaleString()+" · 1위 "+esc(b[0].tk)+" "+(b[0].A/tt*100).toFixed(0)+"%"+(myShare(k)>0?" · 나 "+(myShare(k)*100).toFixed(0)+"%":"")):""}).join("");return h}
function sqf(items,x,y,w,h){const out=[];let rest=items.filter(z=>z.v>0),X=x,Y=y,Wd=w,Hd=h;while(rest.length){const tot=rest.reduce((a,b)=>a+b.v,0),sh=Math.min(Wd,Hd);let row=[],best=1e12;
for(let k=0;k<rest.length;k++){const r=rest.slice(0,k+1),s=r.reduce((a,b)=>a+b.v,0),side=s/tot*Wd*Hd/sh,worst=Math.max(...r.map(z=>{const o=z.v/tot*Wd*Hd/side;return Math.max(side/o,o/side)}));if(worst<=best){best=worst;row=r}else break}
const s=row.reduce((a,b)=>a+b.v,0),ar=s/tot*Wd*Hd;if(Wd>=Hd){const cw=ar/Hd;let yy=Y;for(const z of row){const hh=z.v/s*Hd;out.push(Object.assign({},z,{x:X,y:yy,w:cw,h:hh}));yy+=hh}X+=cw;Wd-=cw}else{const ch=ar/Wd;let xx=X;for(const z of row){const ww=z.v/s*Wd;out.push(Object.assign({},z,{x:xx,y:Y,w:ww,h:ch}));xx+=ww}Y+=ch;Hd-=ch}rest=rest.slice(row.length)}return out}
let TMK=0;
function tmPg(){const W0=100,H0=140,secs={},top=S.co.filter(c=>!c.dead&&!c.priv).sort((x,y)=>mc(y)-mc(x)).slice(0,90);for(const c of top)(secs[c.i]=secs[c.i]||[]).push(c);const its=Object.keys(secs).map(i=>{const a=secs[i];return{i:+i,a,v:a.reduce((s,c)=>s+mc(c),0)}}).sort((a,b)=>b.v-a.v);
const R=sqf(its,0,0,W0,H0),chg1=c=>TMK?(c.ch||0):(c.c1||0);let s="";for(const r of R){const sub=sqf(r.a.map(c=>({v:mc(c),c})),r.x,r.y,r.w,r.h);for(const t of sub){const p=chg1(t.c)*100,k=Math.min(1,Math.abs(p)/(TMK?12:4));s+=`<div class="tmc" onclick="G.pick(${t.c.id})" style="left:${(t.x/W0*100).toFixed(3)}%;top:${(t.y/H0*100).toFixed(3)}%;width:${(t.w/W0*100).toFixed(3)}%;height:${(t.h/H0*100).toFixed(3)}%;--hcl:${p>=0?"var(--up)":"var(--dn)"};--hk:${(.15+k*.75).toFixed(2)}">${t.w*t.h>70&&t.w>9?`<b>${esc(t.c.tk)}</b><span>${P1(p)}</span>`:t.w*t.h>30&&t.w>7?`<b>${esc(t.c.tk)}</b>`:""}</div>`}
if(r.w*r.h>250&&r.w>18)s+=`<div class="tms" style="left:${(r.x/W0*100).toFixed(3)}%;top:${(r.y/H0*100).toFixed(3)}%">${esc(SEC[r.i][0])}</div>`}
return hd("히트맵")+`<div class="seg">${B("오늘","TMK=0;render()",!TMK?"on":"")}${B("10일","TMK=1;render()",TMK?"on":"")}</div><div class="tmw">${s}</div><div class="mu" style="margin-top:6px">네모 크기 = 시가총액, 색 = 등락률. 시가총액 상위 90개 회사를 업종별로 묶었어요. 누르면 종목으로 가요.</div>`}

// ---- v12 UI part 2: research center, AI coach, portfolio analysis, command console, screener v2, sheet additions ----
// ===== research center =====
function rsCard(c){const r=S.rs[c.id],i=c.id;let h=`<div class="pn"><div class="ph"><b>리서치</b><span class="mu">크레딧 ${S.rc}개</span>${xb("센터","G.pg('rsc')")}</div>`;
if(r&&r.q==null)h+=brow(RST[r.t][0]+" 진행 중","D-"+Math.max(0,r.d-S.day));
if(r&&r.q!=null)h+=brow("숨은 경쟁력 추정 ("+RST[r.t][0]+", "+(S.day-r.dn)+"일 전)",`<b class="${r.q>.25?"up":r.q<-.25?"dn":""}">${hqLab(r.q)}</b> <span class="mu">±${Math.round(r.cf*100)}</span>`)+(r.bomb?brow("<span class='wr'>⚠ 의심 신호</span>",esc(r.bomb)):r.bx?brow("시한폭탄","이미 터짐"):"");
h+=`<div class="br"><span class="bb w">${RST.map((z,t)=>xb(z[0]+" · "+(S.rc>=z[5]?"크레딧 "+z[5]:F(rsCost(c,t)))+" · "+z[2]+"일",`G.rsr(${i},${t})`,t===2?"or":"",r&&r.q==null)).join("")}</span></div><div class="br mu" style="line-height:1.55">시장이 모르는 미래(숨은 경쟁력·시한폭탄)를 돈과 시간을 들여 알아내요. 깊을수록 정확합니다.</div></div>`;return h}
function rscPg(){const ids=Object.keys(S.rs).map(Number).filter(id=>S.co[id]&&!S.co[id].dead),done=ids.filter(id=>S.rs[id].q!=null).sort((a,b)=>S.rs[b].q-S.rs[a].q),run=ids.filter(id=>S.rs[id].q==null);
const row=id=>{const c=S.co[id],r=S.rs[id];return `<div class="sr" onclick="G.pick(${id})"><span><b>${esc(c.tk)}</b> <span class="mu">${esc(c.n)} · ${RST[r.t][0]}</span>${r.bomb?' <span class="bd rv">⚠ '+esc(r.bomb)+'</span>':""}</span><span class="num ${r.q>.25?"up":r.q<-.25?"dn":""}">${r.q==null?"D-"+(r.d-S.day):hqLab(r.q)}</span></div>`};
return hd("리서치 센터 🔬")+`<div class="card"><div class="row"><b>리서치 크레딧 ${S.rc}개</b>${B("개념서 퀴즈로 모으기","G.book()")}</div><div class="mu" style="line-height:1.6;margin-top:4px">퀴즈를 통과하면 장마다 크레딧 2개를 받아요. 크레딧은 리서치 비용 대신 쓸 수 있어요. 숨은 경쟁력이 강한 회사는 앞으로 몇 년 동안 이익이 좋아지고, 시장은 그게 실적으로 보일 때까지 모릅니다.</div></div>`+
(run.length?`<h4>진행 중</h4>`+run.map(row).join(""):"")+`<h4>결과 (${done.length})</h4>`+(done.map(row).join("")||'<p class="mu">종목 화면 개요의 리서치 카드에서 의뢰하세요.</p>')}
// ===== AI coach =====
let coachTxt="";
function coachPg(){const tips=coachTips(),y=(S.cst&&S.cst.y)||[],col=s=>s>=3?"var(--up)":s===2?"var(--warn)":s===1?"var(--ac)":"#3fcf7f";
let h=hd("AI 코치 🧭")+(S.over?`<div class="card"><b>${S.over===1?"파산":"구속"}의 원인</b><div style="margin-top:4px;line-height:1.6">${esc(overWhy())}</div></div>`:"")+`<div class="mu" style="line-height:1.6">실제로 일어난 일(마진콜, 낙폭, 집중도, 지수 대비 성적…)을 근거로 진단해요.</div>`+
tips.map(([s,t,d,bk])=>`<div class="card" style="border-left:4px solid ${col(s)}"><b>${esc(t)}</b><div class="mu" style="margin-top:4px;line-height:1.6;white-space:normal">${esc(d)}</div>${bk?`<div class="bs">${B("개념서: "+(BK.find(x=>x[0]===bk)||[0,bk])[1].split(" — ")[0],`G.book('${bk}')`)}</div>`:""}</div>`).join("");
if(y.length)h+=`<h4>연간 리뷰</h4><div class="card">`+y.slice().reverse().map(r=>{const a=(r.w1/Math.max(1,r.w0)-1)*100,b=(r.i1/Math.max(1,r.i0)-1)*100;return brow(r.y+"년",`<span class="${a>=0?"up":"dn"}">${P1(a)}</span> <span class="mu">vs 지수 ${P1(b)} · 지배 ${r.ctl}개</span>`)}).join("")+`</div>`;
h+=`<h4>${aiName()} 코치의 한마디</h4>`+(S.aiP==="rule"?`<div class="mu">설정에서 Claude나 제미나이를 켜면 위 진단을 바탕으로 맞춤 조언을 써 줘요.</div>`:`<div class="bs">${B(coachTxt?"다시 받기":"조언 받기","G.coachAI()","p",!aiOn())}</div><div id="cai" class="card ai" style="margin-top:8px">${esc(coachTxt||"버튼을 누르면 조언이 여기에 나와요.")}</div>`);return h}
G.coachAI=async()=>{if(!aiOn())return toast(aiErr({code:S.aiP==="claude"?"na":"off"}));if(busy)return toast("AI가 다른 요청을 처리 중입니다");busy=1;coachTxt="생각 중…";upAI("cai",coachTxt);const t=coachTips().map(x=>"- "+x[1]+": "+x[2]).join("\n"),y=((S.cst&&S.cst.y)||[]).map(r=>r.y+"년 "+((r.w1/Math.max(1,r.w0)-1)*100).toFixed(0)+"% (지수 "+((r.i1/Math.max(1,r.i0)-1)*100).toFixed(0)+"%)").join(", ");
const p="너는 Wall $treet Raider 방식 기업 인수 게임의 투자 코치야. 아래 플레이어 기록을 보고 한국어로, 반말 말고 친근한 존댓말로 7문장 이내 조언을 써. 1) 가장 큰 실수나 강점 하나를 콕 집고 2) 다음 1년 동안 할 구체적 행동 3가지를 게임 기능 이름으로 말해. 현실 투자 조언이 아니라 게임 코칭이야.\n"+(S.over?"게임 종료: "+overWhy()+"\n":"")+"순자산 "+F(nw())+", 시작 "+F(S.n0)+", 경과 "+(S.day/360).toFixed(1)+"년, 지배 회사 "+S.co.filter(mine).length+"개, 개인 대출 "+F(S.loan)+"\n연간 성적: "+(y||"없음")+"\n규칙 기반 진단:\n"+t;
try{coachTxt=await llm(p,u=>{coachTxt=u.text;upAI("cai",u.text)})}catch(e){coachTxt=aiErr(e)}finally{busy=0;upAI("cai",coachTxt)}};
// ===== portfolio analysis (16) =====
function paPg(){const w=Math.max(1,nw()),hs=S.co.filter(c=>c.own.P&&!c.dead).map(c=>({c,v:val(c)})),sv=hs.reduce((s,x)=>s+x.v,0),vix=(S.IX&&S.IX.VIX?S.IX.VIX.v:17)/100/Math.sqrt(360);
const fut=S.fx.filter(p=>p.e==="P").map(p=>{const s=fsp(p.u);return{p,s,n:Math.sign(p.q)*fNot(p,s)}}),fIx=fut.filter(x=>x.s.t==="I").reduce((s,x)=>s+x.n,0),fSt=fut.filter(x=>x.s.t==="S").reduce((s,x)=>s+x.n*(x.s.c?x.s.c.be||1:1),0),fCm=fut.filter(x=>x.s.t==="C").reduce((s,x)=>s+x.n,0);
const etf=(S.etf||[]).reduce((s,e)=>s+etfHv(e)*(e.ty==="ix"||e.ty==="fac"?e.L:0),0),coin=cxv(),perp=S.pp.reduce((s,p)=>{const c=S.cx.find(z=>z.k===p.k);return s+(c?p.q*c.p/1e8:0)},0),opD=S.op.reduce((s,o)=>{const c=S.co[o.i];return c.dead?s:s+(o.t==="C"?.5:-.5)*o.nsh*c.p/1e4},0);
const beta=hs.reduce((s,x)=>s+x.v*(x.c.be||1),0)+fIx+fSt+etf+opD-S.co.reduce((s,c)=>s+(c.sp>0&&!c.dead?mc(c)*c.sp/100*(c.be||1):0),0),idio=Math.sqrt(hs.reduce((s,x)=>s+(x.v*(x.c.sg||.015))**2,0)),cvol=Math.sqrt((coin*.035)**2+(perp*.04)**2),cmv2=Math.abs(fCm)*.015+cmv()*.015;
const dsd=Math.sqrt((beta*vix)**2+idio**2+cvol**2+cmv2**2),gross=sv+Math.abs(fIx)+Math.abs(fSt)+Math.abs(fCm)+coin+Math.abs(perp)+etfV()+Math.abs(opD),sec={},cty={};for(const x of hs){sec[x.c.i]=(sec[x.c.i]||0)+x.v;const k=x.c.cty==null?0:x.c.cty;cty[k]=(cty[k]||0)+x.v}
const hhi=sv?Math.round(hs.reduce((s,x)=>s+(x.v/sv*100)**2,0)):0,div=hs.reduce((s,x)=>s+Math.max(0,x.c.ni)*x.c.pay*4*(x.c.own.P/100)*.6,0),st=(n,v)=>brow(n,`<span class="${v>=0?"up":"dn"}">${v>=0?"+":""}${F(v)}</span> <span class="mu">(${P1(v/w*100)})</span>`);
const oilS=hs.reduce((s,x)=>s+x.v*((SX[x.c.i]||{}).oil||0)*.15,0)+fut.filter(x=>x.s.k==="OIL").reduce((s,x)=>s+x.n*.5,0),rate=-hs.reduce((s,x)=>s+x.v*(((SX[x.c.i]||{}).rate||0)*-.06+.04),0)-gbv()*.07-S.irs.filter(x=>x.e==="P").reduce((s,x)=>s+x.dir*x.N*.02*Math.max(0,(x.en-S.day)/360),0);
return hd("포트폴리오 분석")+`<div class="pn"><div class="ph"><b>위험 지표</b><span class="mu">순자산 ${F(w)}</span></div><div class="mi2"><div><span class="mu">총 노출</span><span class="num">${F(gross)} (${(gross/w).toFixed(2)}배)</span></div><div><span class="mu">시장 베타 노출</span><span class="num">${(beta/w).toFixed(2)}</span></div><div><span class="mu">하루 변동 1σ</span><span class="num">${F(dsd)}</span></div><div><span class="mu">VaR 95% (1일)</span><span class="num dn">${F(dsd*1.65)}</span></div><div><span class="mu">대출 / 순자산</span><span class="num">${(S.loan/w).toFixed(2)}배</span></div><div><span class="mu">집중도 (HHI)</span><span class="num">${hhi.toLocaleString()}</span></div><div><span class="mu">연 배당 수입 (세후)</span><span class="num">${F(div)}</span></div><div><span class="mu">최대 낙폭</span><span class="num">${((S.cst&&S.cst.dd||0)*100).toFixed(0)}%</span></div></div></div>
<div class="pn"><div class="ph"><b>스트레스 테스트</b><span class="mu">하루 만에 일어난다면</span></div>${st("시장 −20%",-beta*.2)}${st("금리 +2%p",rate)}${st("유가 +50%",oilS)}${st("코인 −50%",-(coin+perp)*.5)}${st("금융위기 (시장 −35%, 코인 −60%)",-beta*.35-(coin+perp)*.6)}</div>
<h4>업종 비중 (주식 직접 보유)</h4><div class="card">${Object.entries(sec).sort((a,b)=>b[1]-a[1]).map(([i,v])=>`<div class="row"><span>${SEC[i][0]}</span><span class="num">${(v/Math.max(1,sv)*100).toFixed(1)}%</span></div>${bar1(v/Math.max(1,sv))}`).join("")||'<div class="mu">직접 보유한 주식이 없어요.</div>'}</div>
<h4>국가 비중</h4><div class="card">${Object.entries(cty).sort((a,b)=>b[1]-a[1]).map(([k,v])=>brow(esc(CTRY[k][0]),(v/Math.max(1,sv)*100).toFixed(1)+"%")).join("")||'<div class="mu">없음</div>'}</div>
<h4>자산 구성</h4><div class="card">${brow("주식",F(sv))}${brow("현금",F(S.cash))}${brow("국채·회사채",F(gbv()+S.co.reduce((s,c)=>s+(c.bh&&!c.dead?bv(c):0),0)))}${brow("ETF",F(etfV()))}${brow("코인 (현물·선물)",F(coin+ppVal()))}${brow("원자재",F(cmv()))}${brow("선물 증거금",F(S.fm))}${brow("옵션 (산 것 − 쓴 것)",F(S.op.reduce((s,o)=>s+opv(o),0)+owVal()))}${brow("개인 대출",S.loan>0?"−"+F(S.loan):"없음")}</div>
<div class="card mu" style="line-height:1.6">베타 노출 1.0 = 시장이 1% 움직이면 순자산이 1% 움직여요. VaR 95%는 '100일 중 95일은 이보다 덜 잃는다'는 뜻이에요. 지주회사를 통한 간접 보유는 회사 가치로 잡혀 있어요. ${B("AI 코치","G.pg('coach')")}</div>`}
// ===== command console (8) =====
const CMDS=[["BUY","매수","BUY 티커 지분% — 주식 매수"],["SELL","매도","SELL 티커 지분%"],["SHORT","공매도","SHORT 티커 지분% (코인이면 숏 선물)"],["COVER","환매","COVER 티커"],["GO","보기","GO 티커 — 종목 화면"],["CHART","차트","CHART 티커|ALL|L50|VIX|코인|ETF"],["CALL","콜","CALL 티커 [일수] [지분%]"],["PUT","풋","PUT 티커 [일수] [지분%]"],["FUT","선물","FUT GOLD|OIL|ALL|L50|티커 수량 [몇 번째 만기]"],
["COIN","코인","COIN 코인 금액(억) — 현물 매수"],["LONG","롱","LONG 코인 레버리지 증거금(억)"],["ETF","ETF","ETF 코드 금액(억)"],["TE","주체","TE 티커|ME — 거래 주체"],["SPLIT","분할","SPLIT 티커 비율 (2=2:1, 0.5=1:2)"],["RS","리서치","RS 티커 [0|1|2]"],["SPEED","속도","SPEED 0|1|3|10|30"],["PAGE","화면","PAGE 경제|포트|코치|알림|구조|점유율|히트맵|리서치|챌린지"],["HELP","도움","HELP"]];
let CMO=[],CMV="";
const cfind=t=>{t=String(t||"").toUpperCase();return S.co.find(c=>!c.dead&&c.tk===t)};
function cmdPg(){return hd("명령어 입력창 ⌨")+`<div class="mu" style="line-height:1.6">원작 리마스터처럼 명령어로 빠르게 거래해요. 예: <b>BUY NVDE 5</b>, <b>FUT OIL 10</b>, <b>LONG BTC 10 5</b>, <b>CHART ALL</b>. 한글 명령(매수, 매도, 차트…)도 돼요.</div>
<input class="in" id="cmi" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="명령어 (예: BUY NVDE 5)" value="${esc(CMV)}" oninput="G.cmdAc(this.value)" onkeydown="if(event.key==='Enter')G.cmdRun()" aria-label="명령어"><div id="cma" class="ch">${cmdAcH(CMV)}</div><div class="bs">${B("실행","G.cmdRun()","p")}${B("지우기","CMO=[];render()")}</div><div class="card log" style="margin-top:8px;white-space:pre-wrap">${CMO.map(esc).join("\n")||"결과가 여기에 쌓여요."}</div>`}
function cmdAcH(v){const t=String(v||"").trim().split(/\s+/),a=t[0]?t[0].toUpperCase():"";if(t.length<=1)return CMDS.filter(c=>!a||c[0].startsWith(a)||c[1].startsWith(t[0]||"")).slice(0,10).map(c=>`<button onclick="G.cmdSet('${c[0]} ')">${c[0]}</button>`).join("");
const q=(t[1]||"").toUpperCase(),pool=[...S.co.filter(c=>!c.dead&&!c.priv).map(c=>c.tk),...cxAlive().map(x=>x.k),...(S.etf||[]).map(e=>e.k),"GOLD","SILV","OIL","COPR","WHT","ALL","L50"];return pool.filter(k=>k.startsWith(q)).slice(0,10).map(k=>`<button onclick="G.cmdSet('${t[0]} ${k} ')">${k}</button>`).join("")}
G.cmdAc=v=>{CMV=v;const e=$("cma");if(e)e.innerHTML=cmdAcH(v)};
G.cmdSet=v=>{CMV=v;const e=$("cmi");if(e){e.value=v;e.focus()}G.cmdAc(v)};
G.cmdRun=()=>{const e=$("cmi"),v=String(e?e.value:CMV).trim();if(!v)return;CMV="";const out=cmdDo(v);CMO.unshift("> "+v+"\n  "+out);if(CMO.length>30)CMO.length=30;if(pg==="cmd")render()};
function cmdDo(v){const t=v.split(/\s+/),k0=t[0].toUpperCase(),cmd=(CMDS.find(c=>c[0]===k0||c[1]===t[0])||[])[0],a1=(t[1]||"").toUpperCase(),n2=+t[2],n3=+t[3];let msg="";const tt=toast;toast=m=>{msg=m};try{
if(!cmd)return"알 수 없는 명령이에요. HELP를 입력해 보세요.";if(cmd==="HELP")return CMDS.map(c=>c[0]+"("+c[1]+"): "+c[2]).join("\n  ");
if(cmd==="SPEED"){G.spd(+t[1]||0);return"속도 "+(+t[1]||0)+"x"}if(cmd==="PAGE"){const m={경제:"econ",포트:"pa",코치:"coach",알림:"nt",구조:"own",점유율:"shr",히트맵:"tm",리서치:"rsc",챌린지:"chl"}[t[1]]||t[1];G.pg(m);return"화면 이동"}
if(cmd==="TE"){if(a1==="ME"){G.setTE("P");return"거래 주체: 나"}const c=cfind(a1);if(!c||!mine(c))return"내가 지배하는 회사 티커를 넣으세요";G.setTE(c.id);return"거래 주체: "+c.tk}
if(cmd==="COIN"||cmd==="LONG"||(cmd==="SHORT"&&S.cx.some(x=>x.k===a1&&!x.dead))){const x=S.cx.find(z=>z.k===a1&&!z.dead);if(!x)return"없는 코인이에요";if(cmd==="COIN"){G.cxB(x.k,n2||1);return msg}G.ppOpen(x.k,cmd==="LONG"?1:-1,n3||1,n2||10);return"코인 선물 진입 요청"}
if(cmd==="ETF"){const e2=(S.etf||[]).find(z=>z.k===a1);if(!e2)return"없는 ETF예요";G.etfB(e2.k,n2||10);return msg}
if(cmd==="FUT"){const u=FSZ[a1]?"C:"+a1:a1==="ALL"||a1==="L50"?"I:"+a1:cfind(a1)?"S:"+cfind(a1).id:null;if(!u)return"선물 코드: GOLD SILV OIL COPR WHT ALL L50 또는 대형50 티커";const r=futTrade(teOK(),u,futExp(u,Math.max(0,(n3||1)-1)),Math.round(n2||1));return r||fsp(u).n+" "+(n2>0?"매수 ":"매도 ")+Math.abs(Math.round(n2||1))+"계약"}
if(cmd==="CHART"){if(["ALL","L50","SML","VIX","RATE"].includes(a1)){G.chart("i:"+a1);return"차트"}if(S.cx.some(x=>x.k===a1)){G.chart("x:"+a1);return"차트"}if((S.etf||[]).some(e=>e.k===a1)){G.chart("e:"+a1);return"차트"}const c=cfind(a1);if(!c)return"티커를 확인하세요";G.chart("c:"+c.id);return"차트"}
const c=cfind(a1);if(!c)return"티커를 확인하세요 ("+a1+")";
if(cmd==="BUY")G.buy(c.id,n2||1);else if(cmd==="SELL")G.sell(c.id,n2||100);else if(cmd==="SHORT")G.short(c.id,n2||1);else if(cmd==="COVER")G.cover(c.id,100);else if(cmd==="GO"){G.pick(c.id);return"종목 화면"}
else if(cmd==="CALL"||cmd==="PUT")G.opt2(c.id,cmd==="CALL"?"C":"P",n2||90,1,n3||1);else if(cmd==="SPLIT"){if(!mine(c))return"내 회사만 분할할 수 있어요";G.splitGo(c.id,n2||2);return c.tk+" 분할"}else if(cmd==="RS")G.rsr(c.id,Math.max(0,Math.min(2,n2||0)));
return msg||"완료"}finally{toast=tt}}
// ===== screener v2 (13): 40 indicators, presets like the W$R remaster, custom conditions =====
const r12=c=>{const f=c.fq||[];if(f.length<5)return null;return f};
const SCI=[["per","PER",c=>{const e=epsT(c);return e>0?c.p/e:null},1],["pbr","PBR",c=>{const b=eq(c)*1e4/c.sh;return b>0?c.p/b:null},2],["psr","PSR",c=>{const f=c.fq||[];const rv=f.slice(-4).reduce((s,r)=>s+r[1],0);return rv>0?mc(c)/rv:null},2],
["ev","EV/영업이익",c=>{const f=c.fq||[],op=f.slice(-4).reduce((s,r)=>s+r[2],0);return op>0?(mc(c)+c.D-c.cs)/op:null},1],["dy","배당수익률%",c=>dyv(c),1],["peg","PEG",c=>{const e=epsT(c),g=scG(c,10);return e>0&&g>0?c.p/e/(g*100):null},2],
["roe","ROE%",c=>{const e=eq(c);return e>0?c.ni*4/e*100:null},1],["roa","ROA%",c=>c.ni*4/Math.max(1,c.A+c.cs)*100,1],["opm","영업이익률%",c=>{const f=c.fq||[],r=f.slice(-4),rv=r.reduce((s,x)=>s+x[1],0),op=r.reduce((s,x)=>s+x[2],0);return rv>0?op/rv*100:null},1],["npm","순이익률%",c=>{const f=c.fq||[],r=f.slice(-4),rv=r.reduce((s,x)=>s+x[1],0),ni=r.reduce((s,x)=>s+x[10],0);return rv>0?ni/rv*100:null},1],
["grev","매출 성장%",c=>scG(c,1)*100,1],["geps","EPS 성장%",c=>scG(c,10)*100,1],["g","투자 성장률%",c=>c.g*100,0],["de","부채비율",c=>{const e=eq(c);return e>0?c.D/e:null},2],["icr","이자보상배율",c=>{const f=c.fq||[],r=f.slice(-4),op=r.reduce((s,x)=>s+x[2],0),it=r.reduce((s,x)=>s+x[4],0);return it>0?op/it:null},1],
["cash","현금/시총%",c=>c.cs/Math.max(1,mc(c))*100,1],["rt","신용등급(0=AAA)",c=>rating(c),0],["fsc","F-스코어(0~9)",c=>fscore(c),0],["mc","시가총액(억)",c=>mc(c),0],["p","주가(원)",c=>c.p,0],["be","베타",c=>c.be||1,0],["vol","변동성%",c=>(c.sg||0)*100*Math.sqrt(250),0],
["m1","1개월 수익률%",c=>(c.p/closeAgo(c,20)-1)*100,1],["m3","3개월 수익률%",c=>(c.p/closeAgo(c,60)-1)*100,1],["m6","6개월 수익률%",c=>(c.p/closeAgo(c,120)-1)*100,1],["hi","52주 고가 대비%",c=>{if(!c.hn||c.hn<30)return null;const s=dSeries(c,DH);return(c.p/Math.max(...s.h)-1)*100},1],["rsi","RSI(14)",c=>{if(!c.hn||c.hn<30)return null;const s=dSeries(c,40),r=rsi(s.c);return r[r.length-1]},0],
["tv","거래대금(억)",c=>(c.vd||0)*c.p/1e4,0],["myg","내 그룹 지분%",c=>grp(c,"P"),0],["ext","외부 최대 그룹%",c=>topRival(c,"P"),0],["flt","유통 주식%",c=>pub(c),0],["ar","투자의견(-2~2)",c=>c.ar,1],["up","목표가 여력%",c=>c.atp?(c.atp/c.p-1)*100:null,1],
["shr","업종 점유율%",c=>share(c)*100,0],["hhi","업종 HHI",c=>hhiOf(c.i),0],["gap","수요-설비 갭%p",c=>(S.dg[c.i]-S.cg[c.i])*100,1],["cyc","업황 사이클",c=>arOf(c.i)==="cyc"?+cycV(c.i).toFixed(2):null,1],["val","적정가 대비%",c=>(c.p/Math.max(1,c.tg)-1)*100,-1],["rq","리서치 숨은 경쟁력",c=>S.rs[c.id]&&S.rs[c.id].q!=null?S.rs[c.id].q:null,1],["cty","국가",c=>c.cty==null?0:c.cty,0]];
function scG(c,j){const f=c.fq||[];if(f.length<8)return null;const a=f.slice(-4).reduce((s,r)=>s+r[j],0),b=f.slice(-8,-4).reduce((s,r)=>s+r[j],0);return b>0?a/b-1:null}
function fscore(c){const f=c.fq||[];if(f.length<8)return null;const s4=(a,j)=>a.reduce((x,r)=>x+r[j],0),A=f.slice(-4),P=f.slice(-8,-4),ni=s4(A,10),ni0=s4(P,10),rv=s4(A,1),rv0=s4(P,1),op=s4(A,2),op0=s4(P,2),l=A[3],l0=P[3];let s=0;
if(ni>0)s++;if(ni>ni0)s++;if(op>0)s++;if(l[17]/Math.max(1,l[14])<l0[17]/Math.max(1,l0[14]))s++;if(l[13]>l0[13])s++;if(l[20]<=l0[20]*1.001)s++;if(rv>0&&rv0>0&&op/rv>op0/rv0)s++;if(rv/Math.max(1,l[14])>rv0/Math.max(1,l0[14]))s++;if(ni>0&&op>ni*.8)s++;return s}
const SCP=[["가치주",[["per","<",10],["pbr","<",1.2],["roe",">",8]],"per",1],["고배당",[["dy",">",4],["de","<",1.5]],"dy",-1],["성장주",[["grev",">",15],["geps",">",15]],"geps",-1],["우량 대형주",[["mc",">",3000],["rt","<",2],["roe",">",10]],"mc",-1],
["공매도 후보",[["val",">",30],["m3","<",0],["rt",">",3]],"val",-1],["인수 대상",[["cash",">",30],["ext","<",10],["flt",">",60],["mc","<",1500]],"cash",-1],["소형 가치주",[["mc","<",500],["per","<",10],["pbr","<",1]],"per",1],["애널리스트 추천",[["ar",">",.5],["up",">",15]],"up",-1],
["턴어라운드",[["npm","<",0],["pbr","<",1],["fsc",">",4]],"fsc",-1],["모멘텀",[["m3",">",20],["hi",">",-5]],"m3",-1],["퀄리티",[["fsc",">",6],["roe",">",15],["de","<",1]],"roe",-1],["부실 기업",[["rt",">",4]],"rt",-1],["고ROE 저PER",[["roe",">",18],["per","<",12]],"roe",-1],["숨은 진주 (리서치)",[["rq",">",.3]],"rq",-1]];
let SF={cond:[],sk:"mc",sd:-1,sec:-1,pre:""};
function scrList2(){const ind=k=>SCI.find(x=>x[0]===k),cs=SF.cond.map(([k,op,v])=>[ind(k),op,v]).filter(x=>x[0]),sk=ind(SF.sk)||SCI[18];
const a=S.co.filter(c=>!c.dead&&!c.priv&&(SF.sec<0||c.i===SF.sec)).map(c=>{const vals={};for(const[x]of cs)vals[x[0]]=x[2](c);vals[sk[0]]=sk[2](c);return{c,vals}}).filter(r=>cs.every(([x,op,v])=>{const y=r.vals[x[0]];return y!=null&&isFinite(y)&&(op===">"?y>v:y<v)}));
a.sort((p,q)=>{const x=p.vals[sk[0]],y=q.vals[sk[0]];if(x==null)return 1;if(y==null)return -1;return(x-y)*SF.sd});return{a,cs,sk}}
const fmtV=(k,v)=>v==null||!isFinite(v)?"-":k==="mc"||k==="tv"?F(v):k==="p"?W(v):k==="cty"?CTRY[v][0]:k==="rt"?RT[v]:k==="ar"?ARL[v+2]:k==="rq"?hqLab(v):Math.abs(v)>=100?Math.round(v).toLocaleString():(+v).toFixed(Math.abs(v)<10?2:1);
function scrPg2(){const{a,cs,sk}=scrList2(),opt=(sel0)=>SCI.map(x=>`<option value="${x[0]}"${x[0]===sel0?" selected":""}>${esc(x[1])}</option>`).join("");
return hd("종목 검색기")+`<div class="mu" style="line-height:1.6">원작 리마스터의 프리셋처럼 골라 시작하고, 지표 40개로 조건을 더하세요. 정말 크게 오를 회사는 숫자만으로 안 보여요 — 리서치까지 해야 합니다.</div>
<div class="ch" style="margin-top:6px">${SCP.map((p,j)=>B(p[0],`G.sfp2(${j})`,SF.pre===p[0]?"on":"")).join("")}${B("초기화","G.sfp2(-1)")}</div>
<div class="mu" style="margin-top:8px">업종</div><div class="ch">${[[-1,"전체"],...INDS.concat([12,13]).map(i=>[i,SEC[i][0]])].map(([v,t])=>B(t,`SF.sec=${v};render()`,SF.sec===v?"on":"")).join("")}</div>
<h4>조건 (${SF.cond.length}/6)</h4>`+SF.cond.map(([k,op,v],j)=>`<div class="row" style="gap:6px;margin:4px 0"><select class="in" style="margin:0;padding:8px;font-size:13px;flex:2" onchange="SF.cond[${j}][0]=this.value;SF.pre='';render()" aria-label="지표">${opt(k)}</select><button onclick="SF.cond[${j}][1]=SF.cond[${j}][1]==='>'?'<':'>';SF.pre='';render()">${op==='>'?"보다 큼":"보다 작음"}</button><input class="in" style="margin:0;padding:8px;font-size:14px;flex:1;min-width:0" type="number" value="${v}" onchange="SF.cond[${j}][2]=+this.value;SF.pre='';render()" aria-label="값"><button onclick="SF.cond.splice(${j},1);render()" aria-label="조건 삭제">✕</button></div>`).join("")+
`<div class="bs">${SF.cond.length<6?B("＋ 조건 추가","SF.cond.push(['per','<',15]);render()"):""}</div><div class="row" style="margin-top:8px;gap:6px"><span class="mu" style="flex:none">정렬</span><select class="in" style="margin:0;padding:8px;font-size:13px" onchange="SF.sk=this.value;render()" aria-label="정렬 지표">${opt(SF.sk)}</select><button onclick="SF.sd=-SF.sd;render()">${SF.sd<0?"큰 순":"작은 순"}</button></div>
<h4>결과 ${a.length}개</h4>`+a.slice(0,60).map(({c,vals})=>`<div class="rw" onclick="G.pick(${c.id})">${logo(c)}<div class="nm"><b>${esc(c.tk)}</b>${badges(c)}<div class="mu">${esc(c.n)} · ${SEC[c.i][0]}</div></div><div class="r"><b class="num">${fmtV(sk[0],vals[sk[0]])}</b><div class="mu num">${esc(sk[1])}${cs[0]&&cs[0][0][0]!==sk[0]?" · "+esc(cs[0][0][1])+" "+fmtV(cs[0][0][0],vals[cs[0][0][0]]):""}</div></div></div>`).join("")+(a.length>60?`<p class="mu">상위 60개만 보여요.</p>`:"")}
G.sfp2=j=>{if(j<0){SF={cond:[],sk:"mc",sd:-1,sec:-1,pre:""};return render()}const p=SCP[j];SF.cond=p[1].map(x=>x.slice());SF.sk=p[2];SF.sd=p[3];SF.pre=p[0];render()};
// ===== stock sheet additions =====
function anaCard(c){if(c.priv)return"";const ar=c.ar,tp=c.atp;return `<div class="pn"><div class="ph"><b>애널리스트 · 수급</b><span class="mu">${c.acv?c.acv+"곳 커버":"커버 없음"}</span></div>`+(c.acv?brow("투자의견",`<b class="${ar>0?"up":ar<0?"dn":""}">${ARL[ar+2]}</b>`)+brow("목표주가",W(tp)+" <span class='mu'>("+P1((tp/c.p-1)*100)+")</span>"):"")+flowBars(c)+`<div class="br mu" style="line-height:1.55">애널리스트는 공개 정보만 보고 낙관적으로 기울어요. 외국인은 시장·추세를, 기관은 실적을 따라가고 개인은 반대편에 서는 경우가 많아요.</div></div>`}
function flowBars(c){if(!c.hn||c.hn<30)return"";const f=flows(c,20),mx=Math.max(1e-9,...f.map(x=>Math.max(Math.abs(x[0]),Math.abs(x[1]),Math.abs(x[2])))),W0=320,H0=70,bw=W0/f.length,y0=H0/2,tot=[0,0,0];let s="";
f.forEach((x,j)=>{for(let k=0;k<3;k++){tot[k]+=x[k];const h=Math.abs(x[k])/mx*(H0/2-4),xx=j*bw+bw*(.12+k*.26),y=x[k]>=0?y0-h:y0;s+=`<rect x="${xx.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw*.24).toFixed(1)}" height="${Math.max(.5,h).toFixed(1)}" fill="${["#e9c46a","#6aa8ff","#9aa5b1"][k]}"/>`}});
return `<div style="padding:6px 12px 0"><svg viewBox="0 0 ${W0} ${H0}" width="100%" height="${H0}" role="img" aria-label="20일 투자자별 순매수"><line x1="0" x2="${W0}" y1="${y0}" y2="${y0}" stroke="var(--ln)"/>${s}</svg></div>`+brow("20일 순매수",`<span style="color:#e9c46a">외국인 ${F(tot[0])}</span> · <span style="color:#6aa8ff">기관 ${F(tot[1])}</span> · <span class="mu">개인 ${F(tot[2])}</span>`)}
function indCard(c){const a=arOf(c.i),t=ctr(c);return `<div class="pn"><div class="ph"><b>업종 특성 · ${ARN[a][0]}</b><span class="mu">${c.cty!=null?esc(CTRY[c.cty][0])+" 법인":""}</span>${xb("점유율",`SHI=${c.i};G.pg('shr')`)}</div><div class="br mu" style="line-height:1.55;white-space:normal">${ARN[a][1]}${a==="cyc"?" 지금 사이클: "+(cycV(c.i)>.3?"호황":cycV(c.i)<-.3?"불황":"전환기")+".":""}${c.ebk>S.day?" 대형 수주 잔고가 있어요.":""}</div>${brow("업종 점유율 · HHI",(share(c)*100).toFixed(1)+"% · "+hhiOf(c.i).toLocaleString())}${c.cty!=null?brow("국가 특성","법인세 "+(t.tax*100).toFixed(0)+"% · 방어 "+(t.res>=0?"+":"")+t.res+" · 밸류 ×"+t.vm+(t.pol?" · 정치 위험 "+t.pol:"")):""}${c.dps&&!c.priv?brow("최근 배당 · 다음 배당락","주당 "+W(c.dps)+" · D-"+nxe(c)):""}</div>`}
function coachCard(c){const t=coCoach(c).slice(0,5);return `<div class="pn"><div class="ph"><b>경영 코치</b><span class="mu">${esc(ARN[arOf(c.i)][0])}</span></div>`+t.map(([s,ti,d,a])=>`<div class="br" style="display:block"><b class="${s>=3?"up":s===2?"wr":""}">${esc(ti)}</b><div class="mu" style="margin-top:2px;line-height:1.5;white-space:normal">${esc(d)}</div>${a?`<div class="bs" style="margin-top:4px">${xb(a[0],a[1],"gr")}</div>`:""}</div>`).join("")+`</div>`}
function mg12(c,i){let h=coachCard(c);const g=grp(c,"P");h+=`<div class="bs" style="margin-top:6px">${c.priv?"":B("액면분할·병합",`G.split(${i})`)}${!c.priv&&g>=90?B("잔여 지분 강제 매수 → 비상장",`G.sqz(${i})`,"p"):""}</div>`;
const eo=(S.eo||[]).map((o,n)=>[o,n]).filter(([o])=>o.i===i);if(S.ceo===i||eo.length)h+=`<h4>CEO 스톡옵션</h4><div class="mu" style="line-height:1.6">CEO로 있는 동안 분기마다 이사회가 옵션을 줘요(회사당 최대 6%). 1년 뒤부터 행사하면 행사가에 신주를 받아 지분이 늘어요.</div>`+(eo.map(([o,n])=>`<div class="card"><div class="row"><b>${o.pct}% · 행사가 ${W(o.k)}</b><span class="num ${c.p>o.k?"up":"dn"}">${F(eoV(o))}</span></div><div class="mu">${S.day>=o.v?"행사 가능":"행사까지 "+(o.v-S.day)+"일"} · 만기 ${o.x-S.day}일</div><div class="bs">${B("행사 (신주 인수)",`G.eoX(${n})`,"p",S.day<o.v||c.p<=o.k)}${B("회사에 되팔기",`G.eoS(${n})`,"",S.day<o.v||c.p<=o.k)}</div></div>`).join("")||'<p class="mu">다음 분기 초에 첫 옵션이 나와요.</p>');
if(c.kd===1){if(!c.ba)bankInit(c);const b=bisOf(c),bl=bankBL(c),nb=Math.max(0,c.A-bl),r=c.bkr;h+=`<h4>은행 경영</h4><div class="pn"><div class="ph"><b>BIS 비율 ${b.toFixed(1)}%</b><span class="mu">${b<8?"⚠ 규제 미달 — 대출 금지":b<10.5?"완충 미달 — 배당 금지":"양호"}</span></div>${bar1(Math.min(1,b/20),b<8?"var(--up)":b<10.5?"var(--warn)":"#3fcf7f")}
${brow("기업 대출 (대출 장부)",F(bl))}${BAK.map(([k,n,w,d])=>brow(n+" <span class='mu'>위험가중 "+(w*100)+"%</span>",(c.ba[k]*100).toFixed(0)+"% · "+F(nb*c.ba[k]),xb("조정",`G.bkSet(${i},'${k}')`))).join("")}${brow("대손충당금",F(c.llr||0))}${r?brow("지난 분기 이자 수익 / 예금 비용",F(r.inc)+" / "+F(r.fund))+brow("대손 비용 · 채권 평가",F(r.prov)+" · "+F(r.bmt)):""}
<div class="br"><span class="bb w">${xb("보수적","G.bkAlloc("+i+",'safe')")}${xb("균형","G.bkAlloc("+i+",'bal')")}${xb("공격적","G.bkAlloc("+i+",'agg')","or")}${xb("자동"+(c.bm?" ✓":""),"G.bkAlloc("+i+",'auto')","gr")}</span></div></div><div class="bs">${B("대출 장부 · 매각",`G.loanbook(${i})`)}${B("부실 대출 시장",`G.lmkt(${i})`,"p")}</div>`}return h}
G.lmkt=b=>{const B0=S.co[b],a=S.co.filter(x=>!x.dead&&!x.kd&&x.ln!==b&&S.co[x.ln]&&!S.co[x.ln].dead&&!mine(S.co[x.ln])&&rating(x)>=4&&loanOf(x)>5).sort((p,q)=>rating(q)-rating(p)).slice(0,20);
openMd({t:"부실 대출 시장",b:B0.tk+" 명의로 다른 은행이 가진 부실 대출을 싸게 삽니다. 산 뒤 대출 장부에서 회수하면 법정관리 때 지분을 받아요.",h:a.map(x=>{const face=loanOf(x),px=face*(1-Math.min(.75,LDISC[rating(x)]*1.25+.05));return `<div class="sr" onclick="closeMd();G.lbuy(${b},${x.id})"><div><b>${esc(x.tk)}</b> <span class="mu">${RT[rating(x)]} · ${esc(S.co[x.ln].tk)} 보유</span><div class="mu">액면 ${F(face)} → ${F(px)} (${(px/face*100).toFixed(0)}%)</div></div><span class="mu">›</span></div>`}).join("")||'<p class="mu">지금 살 만한 부실 대출이 없어요.</p>',o:[["닫기","n"]]})};
function fiNote(c){const n=[];if(c.cpar>=0&&S.co[c.cpar])n.push("연결납세: 모회사 "+S.co[c.cpar].tk+" (지분 "+(c.own["c"+c.cpar]||0).toFixed(0)+"%)"+(c.ctx?" · 이번 분기 세금 정산 "+F(c.ctx):""));const sw=S.irs.filter(x=>x.e===c.id||x.cp===c.id);if(sw.length)n.push("금리 스왑 (장부 밖) 명목 "+F(sw.reduce((s,x)=>s+x.N,0))+" · "+sw.length+"건");
if(c.kd===1&&c.ba)n.push("BIS 비율 "+(bisOf(c)||0).toFixed(1)+"% · 대손충당금 "+F(c.llr||0));if(c.dps)n.push("최근 주당 배당 "+W(c.dps)+" (배당락 반영)");return n.length?`<div class="card mu" style="margin-top:8px;line-height:1.6"><b>주석</b><br>${n.map(esc).join("<br>")}</div>`:""}

// ---- v12 UI part 3: new-game options, settings, cloud & file saves, challenge / leaderboard / live race / same-world duel, spectate mode, wiring ----
function setup12(n){const o=(on,f,t,d)=>`<button class="opt${on?" on":""}" onclick="${f}"><b>${t}</b><span class="mu">${d}</span></button>`,fq=["끄기","드물게","보통","자주"];
return `<h4>역사 시나리오</h4><div class="opts">${SCN.map(s=>o((n.scn||"free")===s.id,`G.ng('scn','${s.id}')`,s.n,s.id==="free"?"정해진 사건 없이":s.y0+"년부터 · "+s.d)).join("")}</div>
<h4>관전 모드 (AI끼리만 경쟁)</h4><div class="bs">${B(n.spec?"켜짐 — 나는 지켜보기만":"꺼짐",`G.ng('spec',${n.spec?0:1})`,n.spec?"on":"")}</div>${n.spec?`<div class="mu" style="line-height:1.6">가치·행동주의·매크로·성장·퀀트 거장과 기존 라이벌들이 서로 겨뤄요. 누가 왜 이기는지, 배울 점을 홈 화면에서 보여 줘요.</div>`:""}
<h4>회사 사건 빈도</h4><div class="ch">${fq.map((t,k)=>B(t,`G.ng('evf',${k})`,(n.evf==null?2:n.evf)===k?"on":"")).join("")}</div><h4>블랙 스완 빈도</h4><div class="ch">${fq.map((t,k)=>B(t,`G.ng('bsf',${k})`,(n.bsf==null?2:n.bsf)===k?"on":"")).join("")}</div>
<h4>학습하는 라이벌</h4><div class="bs">${B(n.learn||n.df>=4?"켜짐":"꺼짐",`G.ng('learn',${n.learn?0:1})`,n.learn||n.df>=4?"on":"",n.df>=4)}</div><div class="mu">해마다 라이벌끼리 전략을 배우고 리서치 실력이 늘어요. 전설 난이도는 항상 켜져 있어요.</div>
<h4>세계 시드 (선택)</h4><input class="in" maxlength="12" value="${esc(n.seedT||"")}" oninput="NG.seedT=this.value" placeholder="비우면 새 세계 · 친구 시드를 넣으면 같은 세계" aria-label="세계 시드" style="margin-top:4px">`}
function set12(){const fq=["끄기","드물게","보통","자주"],c=S.cfg,app=stApp();return `<div class="card"><b>사건 · 블랙 스완</b><div class="mu" style="margin:4px 0">회사 사건 빈도</div><div class="ch">${fq.map((t,k)=>B(t,`S.cfg.evf=${k};render()`,c.evf===k?"on":"")).join("")}</div>
<div class="mu" style="margin:6px 0 4px">사건 종류</div><div class="ch">${Object.entries(EVC).map(([k,t])=>B(t+(c.evc[k]?" ✓":""),`S.cfg.evc.${k}=S.cfg.evc.${k}?0:1;render()`,c.evc[k]?"on":"")).join("")}</div><div class="mu" style="margin:6px 0 4px">블랙 스완 빈도</div><div class="ch">${fq.map((t,k)=>B(t,`S.cfg.bsf=${k};render()`,c.bsf===k?"on":"")).join("")}</div>
<div class="bs" style="margin-top:8px">${B("알림 진동: "+(c.vib?"켜짐":"꺼짐"),"S.cfg.vib=S.cfg.vib?0:1;render()")}</div></div>
<div class="card"><b>이 세계의 시드</b><div class="row" style="margin-top:4px"><span class="num" style="font-size:20px;letter-spacing:2px">${seedTxt(S.seed)}</span>${B("복사","G.seedCopy()")}</div><div class="mu" style="line-height:1.6">친구가 새 게임에서 이 시드를 넣으면 같은 세계(같은 경제·사건·주가 흐름)에서 시작해요. 내 행동이 만든 차이만 달라집니다.</div></div>
${app?"":`<div class="card"><b>클라우드 저장 (내 claude.ai 계정)</b><div class="mu" style="line-height:1.6;margin:4px 0">이 페이지를 연 어느 기기에서나 이어서 할 수 있어요. 저장은 나만 볼 수 있어요.</div>${[1,2,3].map(k=>{const m=CLDM&&CLDM[k];return `<div class="row" style="margin:6px 0"><span class="mu">클라우드 ${k}: ${m?esc(m.d)+" · "+F(m.w):CLDM?"비어 있음":"…"}</span><span class="bs" style="margin:0">${B("저장",`G.cSave(${k})`)}${B("불러오기",`G.cLoad(${k})`,"",CLDM&&!m)}</span></div>`}).join("")}${CLDM?"":`<div class="bs">${B("클라우드 목록 보기","G.cList()")}</div>`}</div>
<div class="card"><b>파일로 저장 · 불러오기</b><div class="mu" style="line-height:1.6;margin:4px 0">세이브를 .txt 파일로 내려받아 두었다가 다시 불러올 수 있어요. 앱(APK)과 웹 사이를 옮길 때는 세이브 코드 복사도 써요.</div><div class="bs">${B("파일로 저장","G.fSave()")}<label class="btnf"><input type="file" accept=".txt,text/plain" onchange="G.fLoad(this)" hidden>파일 불러오기</label></div></div>`}`}
G.seedCopy=async()=>{const t=seedTxt(S.seed);try{if(window.Android&&Android.copy)Android.copy(t);else await navigator.clipboard.writeText(t);toast("시드 "+t+" 복사됨")}catch(e){toast("시드: "+t)}};
// ---- cloud saves: chunked documents under the viewer's private db subtree ----
let CLD=null,CLDM=null;
async function cldInit(){if(CLD)return CLD;try{if(typeof claude==="undefined"||!claude.use)return null;const[db,u]=await Promise.all([claude.use("db"),claude.use("user")]);if(!db||!u)return null;const uid=await u.id();if(!uid)return null;CLD={db,u,uid}}catch(e){return null}return CLD}
G.cList=async()=>{const c=await cldInit();if(!c)return toast("이 화면에서는 클라우드 저장을 쓸 수 없어요");CLDM={};try{for(const k of [1,2,3]){const d=await c.db.collection("data/users/"+c.uid).doc("s"+k).get();if(d.exists)CLDM[k]=d.data()}}catch(e){toast("클라우드 목록을 못 읽었어요")}render()};
G.cSave=async k=>{const c=await cldInit();if(!c)return toast("이 화면에서는 클라우드 저장을 쓸 수 없어요");toast("클라우드에 저장 중…");try{const t=await packS(1),Z=180000,n=Math.ceil(t.length/Z),col=c.db.collection("data/users/"+c.uid);for(let j=0;j<n;j++)await col.doc("s"+k+"p"+j).set({x:t.slice(j*Z,(j+1)*Z)});
const m={n,d:ds(),w:Math.round(nw()),t:Date.now(),v:12};await col.doc("s"+k).set(m);(CLDM=CLDM||{})[k]=m;toast("클라우드 "+k+"에 저장했어요 ("+Math.round(t.length/1024)+"KB)");render()}catch(e){toast("저장 실패: "+(e&&e.code||"오류"))}};
G.cLoad=async k=>{const c=await cldInit();if(!c)return toast("이 화면에서는 클라우드 저장을 쓸 수 없어요");try{const col=c.db.collection("data/users/"+c.uid),m=await col.doc("s"+k).get();if(!m.exists)return toast("빈 슬롯이에요");const d=m.data();let t="";for(let j=0;j<d.n;j++){const p=await col.doc("s"+k+"p"+j).get();if(!p.exists)throw{code:"조각 누락"};t+=p.data().x}
const s=migrate(await unpackS(t));if(!s||!Array.isArray(s.co))throw{code:"형식 오류"};S=s;v8fix();S.bgs=0;col();secUpd();sel=-1;pg="";tab="h";mdl=null;save();toast("클라우드 "+k+"을 불러왔어요 · "+ds());render()}catch(e){toast("불러오기 실패: "+(e&&e.code||"오류"))}};
G.fSave=async()=>{try{const dl=typeof claude!=="undefined"&&claude.use?await claude.use("downloads"):null,t=await packS(1);if(!dl)return G.exp();await dl.save({filename:"raider-save-"+((S.y0||2027)+Math.floor(S.day/360))+"-"+(Math.floor(S.day%360/30)+1)+".txt",data:t})}catch(e){if(e&&e.code==="declined")return;toast("파일 저장 실패: "+(e&&e.code||"오류"))}};
G.fLoad=inp=>{const f=inp.files&&inp.files[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const s=migrate(await unpackS(String(r.result)));if(!s||!Array.isArray(s.co))throw 0;S=s;v8fix();S.bgs=0;col();secUpd();sel=-1;pg="";tab="h";mdl=null;save();toast("파일을 불러왔어요 · "+ds());render()}catch(e){toast("세이브 파일이 아니에요")}};r.readAsText(f)};
// ---- challenge (10): weekly seed, shared leaderboard (db), live race (room), same-world duel on one device ----
const wkKey=()=>Math.floor((Date.now()/864e5+3)/7);
const chlSeed=w=>mix32(w,20271)&0x3fffffff;
let LB=null,RACE=null,RACEP=[];
function chlPg(){const w=wkKey(),sd=chlSeed(w),on=S.cfg&&S.cfg.chl,hs=hsGet();let h=hd("챌린지 · 대결 🏁")+`<div class="pn"><div class="ph"><b>이번 주 챌린지</b><span class="mu">시드 ${seedTxt(sd)}</span></div><div class="br mu" style="line-height:1.6;white-space:normal">이번 주에 시작한 사람은 모두 같은 세계에서 5년(1,800일)을 겨뤄요. 보통 난이도, 라이벌 4명, 시작 500억. 5년이 끝나는 날의 순자산이 점수예요.</div>
${on?brow("진행 중",(S.cfg.chl===w?"이번 주":"지난 챌린지")+" · D-"+Math.max(0,1800-S.day)+" · "+F(nw())):""}<div class="br"><span class="bb w">${xb(on?"새로 시작":"챌린지 시작","G.chlStart()","gr")}${xb("순위표 새로고침","G.lbLoad()")}</span></div></div>`;
h+=`<h4>순위표 (주 ${w})</h4>`+(LB==null?'<p class="mu">순위표를 불러오려면 새로고침을 누르세요. (claude.ai에서 열었을 때만 작동해요)</p>':LB.length?LB.map((r,j)=>brow((j+1)+". "+esc(r.nm||"플레이어")+(r.me?" (나)":""),F(r.w)+" <span class='mu'>D"+r.d+"</span>")).join(""):'<p class="mu">아직 기록이 없어요. 첫 기록의 주인공이 되세요!</p>');
h+=`<h4>지금 같은 세계를 달리는 사람</h4>`+(RACE?RACEP.length?RACEP.map(p=>brow(esc(p.nm||"플레이어")+(p.isMe?" (나)":""),"D"+(p.d||0)+" · "+F(p.w||0))).join(""):'<p class="mu">지금은 혼자 달리고 있어요.</p>':`<div class="bs">${B("실시간 레이스 참가","G.raceJoin()")}</div>`);
h+=`<h4>같은 세계 대결 (한 기기에서 번갈아)</h4><div class="card"><div class="mu" style="line-height:1.6">친구나 가족과 한 기기로 같은 시드의 세계를 차례로 플레이하고 정해진 기간 뒤 순자산을 비교해요.</div>`+(hs&&hs.pl?`<div style="margin-top:6px">${hs.pl.map((p,j)=>brow(esc(p)+(j===hs.cur&&!hs.done?" ◀ 차례":""),hs.sc[j]!=null?F(hs.sc[j]):"-")).join("")}</div><div class="mu">시드 ${seedTxt(hs.seed)} · ${hs.y}년씩</div><div class="bs">${hs.done?B("새 대결","G.hsNew()","p"):B(hs.cur+1+"번째 플레이어 시작","G.hsGo()","p")}${B("대결 취소","G.hsClear()")}</div>`:`<div class="bs">${B("2명",`G.hsNew(2)`)}${B("3명",`G.hsNew(3)`)}${B("4명",`G.hsNew(4)`)}</div>`)+`</div>`;
return h+`<h4>시드 공유</h4><div class="card mu" style="line-height:1.6">내 세계 시드: <b class="num">${seedTxt(S.seed)}</b>. 새 게임 설정의 '세계 시드'에 친구 시드를 넣으면 같은 세계에서 시작해요.</div>`}
G.chlStart=()=>ask("이번 주 챌린지 시작","지금 게임은 슬롯 3에 백업하고, 챌린지 세계(시드 "+seedTxt(chlSeed(wkKey()))+")로 새 게임을 시작해요.","시작",async()=>{await G.sv(3);const w=wkKey();init(Object.assign(defCfg(),{seed:chlSeed(w),chl:w,tut:0}));sel=-1;pg="";tab="h";L("🏁 이번 주 챌린지 시작! 1,800일 뒤 순자산이 점수예요",1);render()});
function chlTick(){const c=S.cfg;if(!c||!c.chl||S.day!==1800||S.chd)return;S.chd=1;const w=nw();hofAdd("챌린지 주 "+c.chl);mdl={t:"🏁 챌린지 종료",b:"5년 동안의 최종 순자산 "+F(w)+". 순위표에 올리고 계속 자유롭게 플레이할 수 있어요.",o:[["나중에","n"],["순위표에 올리기","y"]]};mcb=()=>G.lbSubmit();S.sp0=S.spd;S.spd=0}
G.lbSubmit=async()=>{const c=await cldInit();if(!c)return toast("claude.ai에서 열었을 때만 순위표를 쓸 수 있어요");try{const ref=c.db.doc("lb/"+c.uid),d=await ref.get(),o=d.exists?Object.assign({},d.data()):{},s=Object.assign({},o.s||{}),k="w"+S.cfg.chl,w=Math.round(nw());if(!s[k]||s[k].w<w)s[k]={w,d:S.day,t:Date.now()};await ref.set({s});toast("순위표에 올렸어요");G.lbLoad()}catch(e){toast("올리기 실패: "+(e&&e.code||"오류"))}};
G.lbLoad=async()=>{const c=await cldInit();if(!c){LB=[];return render()}try{const q=await c.db.collection("lb").get(),k="w"+wkKey(),rows=q.docs.map(d=>{const s=(d.data().s||{})[k];return s?{id:d.id,w:s.w,d:s.d}:null}).filter(Boolean).sort((a,b)=>b.w-a.w).slice(0,20);let ps={};try{ps=await c.u.profiles(rows.map(r=>r.id))}catch(e){}
LB=rows.map(r=>({w:r.w,d:r.d,nm:ps[r.id]&&ps[r.id].name||"",me:r.id===c.uid}))}catch(e){LB=[];toast("순위표를 못 읽었어요")}render()};
G.raceJoin=async()=>{try{const room=typeof claude!=="undefined"&&claude.use?await claude.use("room"):null;if(!room)return toast("claude.ai에서 열었을 때만 레이스에 참가할 수 있어요");const c=await cldInit();RACE=await room.join("wsr-race-"+(S.cfg.chl||seedTxt(S.seed).toLowerCase()));
RACE.onPeers(ch=>{RACEP=ch.peers.map(p=>Object.assign({isMe:p.isMe},p.presence));if(pg==="chl")render()});const tick=()=>{if(RACE)RACE.presence({d:S.day,w:Math.round(nw()),nm:S.gn||""}).catch(()=>{})};tick();setInterval(tick,4000);toast("레이스에 참가했어요")}catch(e){toast("레이스 참가 실패")}};
const hsGet=()=>{try{return JSON.parse(stGet("r12hs")||"null")}catch(e){return null}},hsPut=h=>stSet("r12hs",JSON.stringify(h));
G.hsNew=n=>{if(!n){hsPut(null);return render()}const hs={pl:Array.from({length:n},(_,j)=>"플레이어 "+(j+1)),y:3,seed:newSeed(),cur:0,sc:[],done:0};hsPut(hs);render()};
G.hsClear=()=>{hsPut(null);if(S.cfg)S.cfg.hs=null;render()};
G.hsGo=()=>{const hs=hsGet();if(!hs)return;ask(hs.pl[hs.cur]+" 차례","시드 "+seedTxt(hs.seed)+"의 세계에서 "+hs.y+"년을 플레이해요. 지금 게임은 슬롯 3에 백업돼요.","시작",async()=>{await G.sv(3);init(Object.assign(defCfg(),{seed:hs.seed,tut:0,hs:{i:hs.cur,end:hs.y*360}}));sel=-1;pg="";tab="h";L("🎮 "+hs.pl[hs.cur]+" 차례 — "+hs.y+"년 뒤 순자산으로 겨뤄요",1);render()})};
function hsTick(){const c=S.cfg;if(!c||!c.hs||S.day!==c.hs.end||S.hsd)return;S.hsd=1;const hs=hsGet();if(!hs)return;hs.sc[c.hs.i]=Math.round(nw());hs.cur=c.hs.i+1;if(hs.cur>=hs.pl.length)hs.done=1;hsPut(hs);
const msg=hs.done?"대결 끝! "+hs.pl.map((p,j)=>p+" "+F(hs.sc[j]||0)).join(" · ")+" — 우승: "+hs.pl[hs.sc.indexOf(Math.max(...hs.sc))]:hs.pl[c.hs.i]+" 기록 "+F(nw())+". 다음은 "+hs.pl[hs.cur]+" 차례예요.";mdl={t:"🎮 같은 세계 대결",b:msg,o:[["확인","n"],["챌린지 화면","y"]]};mcb=()=>G.pg("chl");S.sp0=S.spd;S.spd=0}
// ---- spectate mode (4-1): the home screen becomes a commentary desk ----
let SPX="";
function specHome(){const R=S.R.map((r,i)=>({r,i,w:rnw(i),n:S.co.filter(c=>!c.dead&&c.ctl==="r"+i).length})).sort((a,b)=>b.w-a.w),cols=["#e9c46a","#ff6b6b","#6aa8ff","#3fcf7f","#c08aff","#ff9f43","#4dd0e1","#f06292","#aed581","#90a4ae"];
const mx=Math.max(1,...S.R.map(r=>Math.max(...(r.qh||[1])))),n=Math.max(2,...S.R.map(r=>(r.qh||[]).length)),Wd=320,Hd=120;let lines="";S.R.forEach((r,j)=>{const a=r.qh||[];if(a.length<2)return;lines+=`<polyline fill="none" stroke="${cols[j%cols.length]}" stroke-width="2" points="${a.map((v,k)=>(k*(Wd-8)/(n-1)+4).toFixed(1)+","+(Hd-6-v/mx*(Hd-12)).toFixed(1)).join(" ")}"/>`});
return `<h3>👁 관전 모드</h3><div class="mu" style="line-height:1.6">AI 투자자들만 경쟁하는 세계예요. ${ds()} · 종합지수 ${S.ix.toFixed(1)} · 경기 ${S.cyc||"-"}. 속도를 올려 지켜보세요.</div><div class="card"><svg viewBox="0 0 ${Wd} ${Hd}" width="100%" height="${Hd}" role="img" aria-label="라이벌 순자산 추이">${lines}</svg><div class="mu">분기별 순자산 추이</div></div>`+
R.map(({r,i,w,n},j)=>{const top=S.co.filter(c=>!c.dead&&c.own["r"+i]).sort((a,b)=>hv(b,b.own["r"+i])-hv(a,a.own["r"+i])).slice(0,3),g=(w/Math.max(1,r.w0||w)-1)*100;return `<div class="card" style="border-left:4px solid ${cols[S.R.indexOf(r)%cols.length]}"><div class="row"><b>${j+1}. ${esc(r.n)}</b><span class="num">${F(w)}</span></div><div class="mu">${RTY[r.s]?RTY[r.s][0]:r.s} · 경영권 ${n}개 · 올해 ${P1(g)}${r.mb&&r.mb.q?" · 지수선물 "+(r.mb.q>0?"매수 ":"매도 ")+Math.abs(r.mb.q):""}${r.gn&&r.gn.res?" · 리서치 "+(r.gn.res*100).toFixed(0):""}</div>${top.length?`<div class="mu">주요 보유: ${top.map(c=>esc(c.tk)+" "+c.own["r"+i].toFixed(0)+"%").join(", ")}</div>`:""}</div>`}).join("")+
`<h4>배울 점</h4><div class="card log">${(S.lsn||[]).slice(0,8).map(x=>"<b>"+esc(x.n)+"</b> "+esc(x.t)+" — "+esc(x.l)).join("<br>")||"큰 성공과 실패가 나오면 여기에 정리돼요."}</div><h4>전략 일지</h4><div class="card log">${(S.rlog||[]).filter(x=>x.k).slice(0,14).map(x=>esc(x.d+" "+x.n+": "+x.t)).join("<br>")||"아직 없습니다."}</div>
<div class="bs">${B("AI 해설 받기","G.specAI()","p",!aiOn())}${B("새 게임","G.newGame()")}</div>${SPX?`<div class="card ai" id="spx" style="margin-top:8px">${esc(SPX)}</div>`:`<div id="spx"></div>`}`}
G.specAI=async()=>{if(!aiOn())return toast(aiErr({code:S.aiP==="claude"?"na":"off"}));if(busy)return;busy=1;SPX="해설 중…";upAI("spx",SPX);const R=S.R.map((r,i)=>r.n+"("+(RTY[r.s]?RTY[r.s][0]:r.s)+") 순자산 "+F(rnw(i))+", 경영권 "+S.co.filter(c=>!c.dead&&c.ctl==="r"+i).length+"개").join("; ");
const p="너는 가상 투자 대회 해설자야. AI 투자자들의 성적과 최근 전략 일지를 보고, 누가 왜 앞서는지와 시청자가 배울 점 3가지를 한국어로 8문장 이내로 써. 실존 인물 이름은 쓰지 마.\n날짜 "+ds()+", 경기 "+S.cyc+", 기준금리 "+S.prime.toFixed(2)+"%, 물가 "+S.inf.toFixed(1)+"%\n순위: "+R+"\n일지: "+(S.rlog||[]).slice(0,15).map(x=>x.n+": "+x.t).join(" / ");
try{SPX=await llm(p,u=>{SPX=u.text;upAI("spx",u.text)})}catch(e){SPX=aiErr(e)}finally{busy=0;upAI("spx",SPX)}};
const SPEC_BLOCK=["buy","sell","short","cover","ctrl","buyMax","tq","tender","merge","gm","opt","opt2","owr","otk","fut","ft2","ftq","cxB","cxS","cxQ","ppOpen","etfB","etfS","etfQ","gbuy","bbuy","cbuy","borrow","swOpen","rsr","fdOpen","mvOpen","pickTE","split","sqz","sue","rumor","aq","eoX","eoS","wk","pp","mg","adj"];
for(const k of SPEC_BLOCK){const f=G[k];if(typeof f==="function")G[k]=(...a)=>S&&S.cfg&&S.cfg.spec?toast("관전 모드에서는 지켜보기만 할 수 있어요"):f(...a)}
// ---- home additions ----
function home12(){const out=[];if(S.bsw)out.push(`<div class="card" style="border-left:4px solid var(--warn)"><b>🦢 블랙 스완: ${esc(S.bsw.n)}</b><div class="mu">남은 약 ${Math.max(0,Math.round((S.bsw.end-S.day)/30))}개월 · 빚을 줄이고 버티세요</div><div class="bs">${B("개념서","G.book('bsw')")}</div></div>`);
if(S.scn){const s=SCN.find(x=>x.id===S.scn.id),nx=s&&s.ev&&s.ev[S.scn.i];out.push(`<div class="card"><b>📜 ${esc(S.scn.n)}</b><div class="mu">${esc(s?s.d:"")}${nx?" · 다음 큰 사건까지 약 "+Math.max(0,Math.round((nx[0]-S.day)/30))+"개월":""}</div></div>`)}
if(S.cfg&&S.cfg.chl)out.push(`<div class="card" onclick="G.pg('chl')"><div class="row"><b>🏁 챌린지 진행 중</b><span class="mu">D-${Math.max(0,1800-S.day)}</span></div>${bar1(S.day/1800)}</div>`);
if(S.cfg&&S.cfg.hs){const h=S.cfg.hs;out.push(`<div class="card" onclick="G.pg('chl')"><div class="row"><b>🎮 같은 세계 대결</b><span class="mu">D-${Math.max(0,h.end-S.day)}</span></div>${bar1(S.day/h.end)}</div>`)}
const n=ntN();if(n)out.push(`<div class="card" onclick="G.pg('nt')"><div class="row"><b>🔔 새 알림 ${n}개</b><span class="mu">알림 센터 ›</span></div><div class="mu">${esc((S.nt.find(x=>!x.r)||{}).t||"")}</div></div>`);
const y=S.cst&&S.cst.y&&S.cst.y[S.cst.y.length-1];if(y&&S.day-((y.y-(S.y0||2027)+1)*360)<60)out.push(`<div class="card" onclick="G.pg('coach')"><div class="row"><b>📅 ${y.y}년 리뷰</b><span class="num ${y.w1>=y.w0?"up":"dn"}">${P1((y.w1/Math.max(1,y.w0)-1)*100)}</span></div><div class="mu">종합지수 ${P1((y.i1/Math.max(1,y.i0)-1)*100)} · AI 코치의 진단 보기 ›</div></div>`);return out}
// ---- page routing, menu, charts, search ----
function page12(){switch(pg){case"cx":return cxPg();case"dv":return dvPg();case"econ":return econPg();case"nt":return ntPg();case"own":return ownPg();case"shr":return shrPg();case"tm":return tmPg();case"rsc":return rscPg();case"coach":return coachPg();case"pa":return paPg();case"cmd":return cmdPg();case"scr":return scrPg2();case"chl":return chlPg()}return null}
{const ins=(after,...xs)=>{const k=MENU.findIndex(m=>m[0]===after);MENU.splice(k<0?MENU.length:k+1,0,...xs)};MENU.unshift(["nt","🔔","알림 센터"]);ins("st",["pa","◑","포트폴리오 분석"],["own","⛓","지분 구조도"]);ins("sc",["tm","▦","히트맵"],["shr","◧","업종 점유율"]);ins("scr",["rsc","🔬","리서치 센터"]);
ins("dv",["cmd","⌨","명령어 입력창"]);ins("ix",["econ","🌐","경제 지표"]);ins("adv",["coach","🧭","AI 코치"]);ins("hof",["chl","🏁","챌린지 · 대결"])}
function chData12(t,id,k){if(t==="x"){const x=(S.cx||[]).find(z=>z.k===id);if(!x)return null;return{k,t,m:x,nm:x.k+" "+x.n,sub:CXC[x.cat][0]+" 코인",ser:cSeries(x),mon:[x.p],px:Wc,unit:"",last:x.p}}
if(t==="e"){const e=(S.etf||[]).find(z=>z.k===id);if(!e)return null;return{k,t,m:e,nm:e.k+" "+e.n,sub:"ETF · 보수 연 "+e.fee+"%",ser:cSeries(e),mon:[e.p],px:W,unit:"",last:e.p}}return null}
const ixSub=id=>id==="VIX"?"시장 변동성(연율, %)":["RATE","YS","YL","INF"].includes(id)?"%":id==="FXR"?"원":"지수";
const IXP=["VIX","RATE","YS","YL","INF"];
function ixInit(k){return k==="ALL"?S.ix:k==="VIX"?17:k==="RATE"?S.prime:k==="BOND"?S.bp:k==="YS"?(S.yS!=null?S.yS:S.prime-.6):k==="YL"?(S.yL!=null?S.yL:S.prime+.4):k==="FXR"?(S.fxr||1350):k==="INF"?(S.inf!=null?S.inf:2.6):100}
function srX(v){v=v.trim().toLowerCase();if(!v||!S.cx)return"";const a=cxAlive().filter(x=>x.k.toLowerCase().includes(v)||x.n.toLowerCase().includes(v)).slice(0,6),e=(S.etf||[]).filter(x=>x.k.toLowerCase().includes(v)||x.n.toLowerCase().includes(v)).slice(0,6);
return a.map(x=>`<div class="sr" onclick="G.cxOpen('${x.k}')"><div><b style="font-size:17px">${esc(x.k)}</b> <span class="bd">코인</span><div class="mu">${esc(x.n)} · ${CXC[x.cat][0]}</div></div><span class="mu">›</span></div>`).join("")+e.map(x=>`<div class="sr" onclick="G.chart('e:${x.k}')"><div><b style="font-size:17px">${esc(x.k)}</b> <span class="bd">ETF</span><div class="mu">${esc(x.n)}</div></div><span class="mu">›</span></div>`).join("")}
{const b=$("nb");if(b)b.onclick=()=>{G.menu(0);G.pg("nt")}}

// ---- v13: W$R-style clock, command center menu, convenience ----
// The clock: one control holds pause and the four speeds, plus ⏭ fast-forward to the next month, quarter close or
// year end. In W$R the clock keeps running until you stop it, so a stopped clock is shown in amber across the header.
const FFS=60,MFD=["adv","fd","xf","scr","ix","bk"];
const TCI={p:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>',
r:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.3v13.4a.9.9 0 0 0 1.4.75l10.2-6.7a.9.9 0 0 0 0-1.5L9.4 4.55A.9.9 0 0 0 8 5.3z"/></svg>',
f:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 6.4v11.2a.8.8 0 0 0 1.25.66L12.5 12.7a.8.8 0 0 0 0-1.4L4.25 5.74A.8.8 0 0 0 3 6.4zM12 6.4v11.2a.8.8 0 0 0 1.25.66l8.25-5.56a.8.8 0 0 0 0-1.4l-8.25-5.56A.8.8 0 0 0 12 6.4z"/></svg>'};
const tcRun=()=>!!(S&&S.spd>0&&!mdl&&pg!=="new");
function tcBar(){const run=tcRun(),ff=run&&!!S.ff,l=S.spl||1;
return `<div class="tc${run?"":" pz"}" role="group" aria-label="게임 시간"><button class="tcp" onclick="G.tp()" aria-label="${run?"일시정지":"재생"}" title="${run?"일시정지":"재생"} (Space)">${run?TCI.p:TCI.r}</button>${[1,3,10,30].map((v,n)=>`<button class="${ff?"":run&&S.spd===v?"on":!run&&v===l?"lt":""}" onclick="G.spd(${v})" aria-label="${v}배속" title="${v}배속 (${n+1})">${v}×</button>`).join("")}<button class="tcf${ff?" on":""}" onclick="G.ffOpen()" aria-label="빨리 감기" title="빨리 감기 (F)">${TCI.f}</button></div>`}
let TCK="",FZ0=0;
function tcSync(){if(!S)return;const k=[S.spd,S.spl,S.ff?1:0,mdl?1:0,pg==="new"?1:0].join();if(k===TCK)return;TCK=k;const e=$("sp");if(e)e.innerHTML=tcBar()}
function liv13(){tcSync();const q=$("q");if(q&&q.classList)q.classList.toggle("pz",!tcRun());if(!FZ0){FZ0=1;fzApply()}}
G.spd=v=>{if(!S)return;v=+v||0;if(S.spd>0&&!S.ff)S.spl=S.spd;if(v)S.spl=v;S.spd=v;S.sp0=null;S.ff=null;S.acc=0;S.apr="";render()};
G.tp=()=>{if(!S||S.over)return;if(tcRun())G.spd(0);else if(!mdl&&pg!=="new")G.spd(S.spl||1)};
const FFO=[["m","다음 달",()=>(Math.floor(S.day/30)+1)*30],["q","분기 결산",()=>(Math.floor(S.day/90)+1)*90],["y","연말 결산",()=>(Math.floor(S.day/360)+1)*360],["h","6개월 뒤",()=>S.day+180]];
G.ffOpen=()=>{if(!S||S.over||pg==="new"||mdl)return;if(S.ff&&tcRun()){G.spd(0);return toast("⏭ 빨리 감기를 멈췄어요")}
openMd({t:"⏭ 빨리 감기",b:"고른 날짜까지 최고 속도로 시간을 보내요. 결정이 필요한 사건이 생기면 잠깐 멈췄다가 이어 가고, 자동 정지 조건(설정)에 걸리면 그 자리에서 멈춰요.",h:`<div class="ffo">${FFO.filter(x=>!(x[0]==="q"&&x[2]()===FFO[2][2]())).map(([k,t,f])=>{const d=f();return `<button class="opt" onclick="G.ffGo('${k}')"><b>${t}</b><span class="mu">${ds(d)} · ${d-S.day}일</span></button>`}).join("")}</div>`,o:[["취소","n"]]})};
G.ffGo=k=>{const o=FFO.find(x=>x[0]===k);if(!o||!S)return;const to=o[2]();closeMd();if(S.spd>0&&!S.ff)S.spl=S.spd;S.ff={to,k};S.spd=FFS;S.sp0=null;S.acc=0;S.apr="";render();toast("⏭ "+o[1]+"까지 빨리 감기 · "+ds(to))};

// Auto-pause rules. Notable messages pass through note(); these rules stop the clock (and any fast-forward) when one
// matches, with a three-day cooldown per rule so a repeating warning cannot freeze the game.
const AP13=[["pa","가격 알림",/^🔔/],["raid","경영권 위협",/^🦈/],["warn","마진콜·위험 경고",/^(⚠|🚨|🪦)/],["bs","위기·블랙 스완",/^(🦢|💥|📉 블랙)/],["q","분기 결산",null],["y","연말 결산",null]];
const APD={pa:1,raid:1,warn:1,bs:1,q:0,y:0};
function apOn(k){const a=S&&S.cfg&&S.cfg.ap;return a&&a[k]!=null?!!a[k]:!!APD[k]}
function apHit(k,msg){if(!S||S.over||mdl||!(S.spd>0)||pg==="new"||(S.cfg&&S.cfg.spec)||!apOn(k))return;S.apc=S.apc||{};if(S.apc[k]!=null&&S.apc[k]>S.day-3)return;S.apc[k]=S.day;
const fr=!!S.ff,a=AP13.find(x=>x[0]===k);if(!fr)S.spl=S.spd;S.ff=null;S.spd=0;S.sp0=null;S.acc=0;S.apr=a[1];toast(msg,"⏸ 자동 정지 · "+a[1]+(fr?" · 빨리 감기 중단":"")+" — ▶ 눌러 계속")}
function t13(){if(!S)return;
if(S.ff&&S.day>=S.ff.to){S.ff=null;S.spd=0;S.sp0=null;S.acc=0;const q=S.day%90===0&&S.qr;toast(q?"📊 "+S.qr.t+" 결산 · 순자산 "+F(S.qr.nw)+" ("+P1(S.qr.p)+")":"⏭ 도착 · "+ds(),"⏸ 빨리 감기 끝 — ▶ 눌러 계속");return}
if(S.day%360===0&&apOn("y"))apHit("y","🗓 "+((S.y0||2027)+S.day/360-1)+"년 마감 · 순자산 "+F(nw()));
else if(S.day%90===0&&S.qr&&apOn("q"))apHit("q","📊 "+S.qr.t+" 결산 · 순자산 "+F(S.qr.nw)+" ("+P1(S.qr.p)+")")}
{const s0=step;step=function(){s0();try{t13()}catch(e){}}}
{const n0=note;note=function(t,k){n0(t,k);try{const m=String(t);for(const a of AP13)if(a[2]&&a[2].test(m)){apHit(a[0],m);break}}catch(e){}}}

// Toasts: smaller, coloured by kind, tap to dismiss; a burst of messages shows a +n chip that opens the news log.
const TS13={n:0,t:0,m:"",h:0};
toast=function(m,sub){const e=$("ts");if(!e)return;m=String(m);const now=Date.now();if(e.hidden)TS13.n=0;else if(now-TS13.t<6000&&m!==TS13.m)TS13.n++;TS13.t=now;TS13.m=m;
e.className=/^(⚠|💥|🚨|🦈|🪦|🦢|💣)/.test(m)||sub?"w":/^(🏆|🎉|✅|📊|🗓)/.test(m)?"g":"";
e.innerHTML=`<div class="tsb"><div class="tsm">${esc(m)}</div>${sub?`<div class="tss">${esc(sub)}</div>`:""}</div>${TS13.n?`<button class="tsn" onclick="event.stopPropagation();G.tsLog()" aria-label="놓친 메시지 보기">+${TS13.n}</button>`:""}`;
e.hidden=false;clearTimeout(TS13.h);TS13.h=setTimeout(()=>{e.hidden=true;TS13.n=0},Math.min(7000,2300+m.length*30+(sub?1800:0)))};
G.tsLog=()=>{const e=$("ts");if(e)e.hidden=true;TS13.n=0;G.menu(0);sel=-1;pg="";G.go("l")};
{const e=$("ts");if(e)e.onclick=()=>{e.hidden=true;TS13.n=0}}

// Device preferences (menu favourites, recents, text size, trade bar). They live on the device, not in the save.
function uiOK(){try{stApp;return true}catch(e){return false}}
const UIC={};
function uiP(k,d){if(k in UIC)return UIC[k];let v=d;try{const s=stGet(k);if(s!=null&&s!=="")v=JSON.parse(s)}catch(e){}if(uiOK())UIC[k]=v;return v}
function uiS(k,v){UIC[k]=v;try{stSet(k,JSON.stringify(v))}catch(e){}}
function fzApply(){const z=+uiP("r13fz",1)||1;for(const id of["v","sh","md","ts"]){const e=$(id);if(e&&e.style)e.style.zoom=z===1?"":String(z)}}

// Command center. W$R drives everything from a menu bar plus a command line; here the + button opens one panel:
// a prompt that searches menus (including Korean initials), tickers, coins and ETFs and runs console commands, then
// favourites, recents and the menus grouped like W$R's menu bar and coloured like its menus (trading green,
// research orange, corporate red, learning blue).
const MCAT=[["TRADE","거래","wg",["scr","dv","fs","xf","cmd"]],["RESEARCH","분석","wo",["pa","st","hx","mv","sc","tm","shr","rsc","ix","econ"]],["CORPORATE","제국","wr",["own","fd","rv","ai"]],["LEARN","배움 · AI","wb",["bk","coach","adv","help"]],["GAME","게임","wn",["nt","ac","chl","hof","new","set"]]];
const MKW={dv:"선물 옵션 스왑 파생 futures options",scr:"스크리너 조건 검색",econ:"금리 물가 환율 실업 경제 macro",cmd:"명령 콘솔 터미널 command",pa:"포트폴리오 위험 분산 분석",st:"계좌 명세 손익",own:"지분 구조 지배",ix:"지수 차트",tm:"히트맵 heatmap",rsc:"리서치 조사 실사",bk:"개념서 책 퀴즈 공부",coach:"코치 피드백",chl:"챌린지 대결 시드 순위",set:"설정 옵션 자동 정지 글자",nt:"알림",ac:"미션 업적",hof:"명예의 전당 기록",rv:"라이벌 그룹",ai:"AI 생태계 라이벌",fd:"회사 설립 창업",xf:"자금 이동 송금",fs:"자산 매물 매각 인수",mv:"급등 급락",sc:"섹터 업종",shr:"점유율 시장",hx:"거래 내역 기록",adv:"참모 조언",help:"게임 방법 도움말",new:"새 게임 시작"};
const CHO="ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ",cho=s=>[...s].map(ch=>{const c=ch.charCodeAt(0)-44032;return c>=0&&c<11172?CHO[c/588|0]:ch}).join("");
let MQ="",MED=0,MCH=0;
const mI=k=>MENU.find(m=>m[0]===k);
function mCat(k){for(const c of MCAT)if(c[3].includes(k))return c;return null}
function mSub(k){try{switch(k){case"nt":{const n=ntN();return n?"새 알림 "+n+"건":""}
case"dv":{const n=(S.fx||[]).length+(S.op||[]).length+(S.ow||[]).length+(S.pp||[]).length+(S.irs||[]).length;return n?"포지션 "+n+"개":""}
case"econ":return"물가 "+(+S.inf||0).toFixed(1)+"% · 금리 "+(+S.prime||0).toFixed(1)+"%";
case"ac":return S.ms<MIS.length?"미션 "+(S.ms+1)+"/"+MIS.length:"미션 완료";
case"rsc":{let n=0;for(const id in S.rs||{}){const r=S.rs[id];if(r&&r.q==null&&r.d>S.day)n++}return n?"진행 "+n+"건":""}}}catch(e){}return""}
function mTile(k,n){const m=mI(k);if(!m)return"";const c=mCat(k),f=uiP("r13fav",MFD).includes(k),s=mSub(k),dot=k==="nt"&&S?ntN():0;
return `<button class="mt ${c?c[2]:"wn"}" style="--i:${n}" onclick="G.mgo2('${k}')"><span class="ic" aria-hidden="true">${m[1]}</span><span class="lb">${esc(m[2])}</span>${s?`<span class="sb">${esc(s)}</span>`:""}${dot?`<span class="dt">${dot>9?"9+":dot}</span>`:""}${MED?`<span class="st" aria-label="${f?"즐겨찾기됨":"즐겨찾기 아님"}">${f?"★":"☆"}</span>`:""}</button>`}
function mnMatch(q){q=q.trim().toLowerCase();if(!q)return[];const qc=/^[ㄱ-ㅎ]+$/.test(q);return MENU.filter(([k,i,t])=>{const c=mCat(k),s=(t+" "+(MKW[k]||"")+" "+(c?c[0]+" "+c[1]:"")+" "+k).toLowerCase();return s.includes(q)||qc&&cho(s.replace(/\s/g,"")).includes(q)})}
function coMatch(q){q=q.trim().toLowerCase();if(!q||!S||/^[ㄱ-ㅎ]+$/.test(q))return[];return S.co.filter(c=>!c.dead&&(c.tk.toLowerCase().startsWith(q)||c.n.toLowerCase().includes(q))).sort((a,b)=>(b.tk.toLowerCase()===q)-(a.tk.toLowerCase()===q)||(b.priv?0:mc(b))-(a.priv?0:mc(a))).slice(0,5)}
const mCmd=q=>{const w=q.trim().split(/\s+/)[0]||"";return typeof CMDS!=="undefined"?CMDS.find(c=>c[0]===w.toUpperCase()||c[1]===w):null};
function mnRes(){const q=MQ.trim();if(q){const r=mnMatch(q),w0=q.split(/\s+/)[0],cm=mCmd(q),cs=coMatch(w0);let h="";
if(cm)h+=`<div class="mhint"><b>⌨ ${esc(cm[0])}</b> · ${esc(cm[2])} — Enter로 실행</div>`;
if(r.length)h+=`<div class="mgr">${r.map((m,n)=>mTile(m[0],n)).join("")}</div>`;
if(cs.length)h+=`<div class="mcat wn"><b>STOCK</b> 종목</div><div onclick="G.menu(0)">${cs.map(c=>`<div class="mso" onclick="G.pick(${c.id})"><span class="nm"><b>${esc(c.tk)}</b> <span class="mu">${esc(c.n)}</span></span><span class="num ${chg(c)>=0?"up":"dn"}">${c.priv?"비상장":W(c.p)}</span></div>`).join("")}</div>`;
const sx=typeof srX==="function"&&!/^[ㄱ-ㅎ]+$/.test(w0)?srX(w0):"";if(sx)h+=`<div class="mcat wn"><b>MARKET</b> 코인 · ETF</div><div onclick="G.menu(0)">${sx}</div>`;
return h||`<div class="mhint">찾는 메뉴나 종목이 없어요. 명령어 목록은 HELP를 입력해 보세요.</div>`}
const fav=uiP("r13fav",MFD).filter(mI),rc=uiP("r13rc",[]).filter(mI);
let h=`<div class="mhint">${MED?"<b>즐겨찾기 편집</b> — 타일을 눌러 넣거나 빼요. 최대 8개, 홈 바로가기에도 나와요.":"예) 파생 · ㅍㅅ · 티커 · BUY 티커 5"}</div>
<div class="mrw"><button class="mch e${MED?" on":""}" onclick="G.med()">★ ${MED?"완료":"편집"}</button>${fav.map(k=>`<button class="mch" onclick="G.mgo2('${k}')">${mI(k)[1]} ${esc(mI(k)[2])}${MED?" ✕":""}</button>`).join("")||'<span class="mu">즐겨찾기가 없어요</span>'}</div>`;
if(rc.length&&!MED)h+=`<div class="mrw"><span class="mrl">최근</span>${rc.map(k=>`<button class="mch r" onclick="G.mgo2('${k}')">${esc(mI(k)[2])}</button>`).join("")}</div>`;
let n=0;for(const[en,ko,cl,ks]of MCAT){const its=ks.filter(mI);if(its.length)h+=`<div class="mcat ${cl}"><b>${en}</b> ${ko}</div><div class="mgr">${its.map(k=>mTile(k,n++)).join("")}</div>`}
const rest=MENU.filter(m=>!mCat(m[0]));if(rest.length)h+=`<div class="mcat wn"><b>ETC</b> 기타</div><div class="mgr">${rest.map(m=>mTile(m[0],n++)).join("")}</div>`;return h}
function buildMenu(){const l=$("mnl");if(!l||!S)return;l.innerHTML=`<div class="mnh"><button class="cb" onclick="G.menu(0)" aria-label="메뉴 닫기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button><label class="mns"><span class="mnp" aria-hidden="true">&gt;</span><input id="mnq" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="메뉴 · 종목 · 명령어" value="${esc(MQ)}" oninput="G.mq(this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();G.mqGo()}" aria-label="메뉴 · 종목 · 명령어 검색"><span class="mnt" aria-hidden="true">RAIDER</span></label></div><div id="mnr">${mnRes()}</div>`}
G.mq=v=>{MQ=String(v);const r=$("mnr");if(r)r.innerHTML=mnRes()};
G.mqGo=()=>{const q=MQ.trim();if(!q)return;const cm=mCmd(q),r=mnMatch(q);
if(cm&&(/\s/.test(q)||!r.length)){G.menu(0);const out=cmdDo(q);CMO.unshift("> "+q+"\n  "+out);if(CMO.length>30)CMO.length=30;G.pg("cmd");toast(String(out).split("\n")[0]);return}
if(r.length)return G.mgo2(r[0][0]);const c=coMatch(q)[0];if(c){G.menu(0);return G.pick(c.id)}toast("찾는 메뉴나 종목이 없어요")};
{const m0=G.menu;G.menu=o=>{if(o){MQ="";MED=0;buildMenu()}else if(MCH){MCH=0;setTimeout(render,0)}m0(o)}}
G.menuQ=()=>{G.menu(1);setTimeout(()=>{const q=$("mnq");if(q)q.focus()},60)};
G.menuEd=()=>{G.menu(1);MED=1;G.mq("")};
G.med=()=>{MED=MED?0:1;MQ="";const q=$("mnq");if(q)q.value="";G.mq("")};
G.mgo2=k=>{const mn=$("mn"),open=mn&&!mn.hidden;if(MED&&open){const f=uiP("r13fav",MFD).slice(),i=f.indexOf(k);if(i>=0)f.splice(i,1);else{if(f.length>=8)return toast("즐겨찾기는 8개까지예요");f.push(k)}uiS("r13fav",f);MCH=1;return G.mq(MQ)}
const r=uiP("r13rc",[]).filter(x=>x!==k);r.unshift(k);uiS("r13rc",r.slice(0,6));if(k==="new"){G.menu(0);return G.newGame()}G.mgo(k)};
function favRow(){const f=uiP("r13fav",MFD).filter(mI);return `<div class="bs fvr" style="margin-top:12px">${f.map(k=>{const m=mI(k);return B(m[1]+" "+esc(m[2]),`G.mgo2('${k}')`)}).join("")}<button onclick="G.menuEd()" aria-label="바로가기 편집" title="바로가기 편집">✎</button></div>`}

// Stock sheet: a fixed buy/sell bar with the live price, so trading never needs a trip back to the 매매 tab.
{const s0=sheet;sheet=function(i){const h=s0(i);try{return h+qtBar(i)}catch(e){return h}}}
function qtBar(i){const c=S.co[i];if(!c||c.dead||c.priv||!uiP("r13qb",1))return"";const e=teOK(),eo=c.own[eKey(e)]||0;
return `<div class="qtsp"></div><div class="qtb"><div class="qti"><div class="qtl"><span class="pl ${chg(c)>=0?"u":"d"}" data-pp="${i}">${W(c.p)}</span><span class="mu">${esc(eName(e))} ${eo.toFixed(1)}%</span></div><button class="qs" onclick="G.tq(${i},'s')"${eo>0?"":" disabled"}>매도</button><button class="qb" onclick="G.tq(${i},'b')"${e===i?" disabled":""}>매수</button></div></div>`}

// Settings card and input conveniences.
function set13(){const a=AP13.map(([k,t])=>B(t+(apOn(k)?" ✓":""),`G.apT('${k}')`,apOn(k)?"on":"")).join(""),z=+uiP("r13fz",1)||1,qb=uiP("r13qb",1);
return `<div class="card"><b>편의 기능</b><div class="mu" style="margin:4px 0">자동 일시정지 — 이런 일이 생기면 시계를 멈춰요 (빨리 감기도 멈춤)</div><div class="ch" style="flex-wrap:wrap">${a}</div>
<div class="mu" style="margin:8px 0 4px">글자 크기</div><div class="ch">${[[.9,"작게"],[1,"보통"],[1.1,"크게"]].map(([v,t])=>B(t,`G.fz(${v})`,z===v?"on":"")).join("")}</div>
<div class="bs" style="margin-top:8px">${B("종목 화면 매매 바: "+(qb?"켜짐":"꺼짐"),"G.qbT()",qb?"on":"")}${B("바로가기 편집","G.menuEd()")}${B("온디바이스 AI 점검","G.odProbe()")}</div>
<div class="mu" style="margin-top:8px;line-height:1.6">PC 단축키: Space 정지·재생 · 1~4 배속 · F 빨리 감기 · / 또는 Ctrl+K 명령 센터 · Esc 닫기<br>휴대폰: 화면 왼쪽 끝에서 오른쪽으로 밀면 뒤로 가요.</div></div>`}
G.apT=k=>{S.cfg.ap=Object.assign({},APD,S.cfg.ap||{});S.cfg.ap[k]=S.cfg.ap[k]?0:1;render()};
G.fz=v=>{uiS("r13fz",+v);fzApply();render()};
G.qbT=()=>{uiS("r13qb",uiP("r13qb",1)?0:1);render()};
if(typeof document!=="undefined"&&document.addEventListener){
document.addEventListener("keydown",e=>{if(!S||e.altKey)return;const t=e.target,ty=!!t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName||"")||t.isContentEditable),k=e.key;
if((e.ctrlKey||e.metaKey)&&(k==="k"||k==="K")){e.preventDefault();G.menuQ();return}if(e.ctrlKey||e.metaKey||ty||mdl||pg==="new")return;
if(k===" "){e.preventDefault();G.tp()}else if(k>="1"&&k<="4")G.spd([1,3,10,30][k-1]);else if(k==="/"){e.preventDefault();G.menuQ()}else if(k==="f"||k==="F")G.ffOpen()});
const s=$("sh");let x0=-1,y0=0,t0=0;if(s&&s.addEventListener){s.addEventListener("touchstart",e=>{const t=e.touches[0];x0=e.touches.length===1&&t.clientX<24?t.clientX:-1;y0=t.clientY;t0=Date.now()},{passive:true});
s.addEventListener("touchend",e=>{if(x0<0)return;const t=e.changedTouches[0],dx=t.clientX-x0,dy=Math.abs(t.clientY-y0);x0=-1;let app=0;try{app=stApp()}catch(z){}if(dx>64&&dy<dx*.6&&Date.now()-t0<800&&!mdl&&pg!=="new"&&!app)G.back()},{passive:true})}}

// ---- v14: 레이더 참모 — built-in questions, answers and feedback (no language model needed) ----
// The advisor reads a Korean question for tickers, coins, sectors, rivals and glossary words plus intent words
// (사도 돼, 인수, 위험, 현금, 금리, 뭐야 ...), computes the answer from the live game state and phrases it from
// templates. It is free, offline and unlimited. When Claude or Gemini is switched on, the same computed facts are
// handed to that model, so its extra answer stays tied to the game's real numbers.
const QAW={buy:/(사도|살까|사야|살 만|살만|매수|담아|담을|들어가|투자해도)/,sell:/(팔까|팔아|매도|정리할|정리해야|손절|익절|빼야)/,
take:/(인수|m&a|사냥|경영권|공개매수|합병|먹을|먹어|먹고)/,risk:/(위험|리스크|망할|망하|파산|마진|조심|걱정|부채|빚|안전한가)/,
cash:/(현금|남는 돈|여윳돈|돈을 어디|굴리|굴릴|놀고 있|투자처|어디에 투자|돈이 남)/,macro:/(금리|물가|인플레|경기|경제|환율|지수|시장 전망|불황|호황|침체|중앙은행|국채|실업)/,
rival:/(라이벌|경쟁자|경쟁 그룹|상대 그룹)/,coach:/(피드백|평가해|잘하고|못하고|코치|어떻게 하고 있|내 전략|성적|점수|잘한|못한|조언)/,
next:/(다음에|뭐 하|뭘 해|뭐부터|할 일|칭호|미션|목표|어떻게 해야)/,concept:/(뭐야|뭐예요|뭔가요|뭔데|뭐지|뜻|의미|이란|란\?|설명해|개념|무엇)/,
how:/(어떻게|방법|하는 법|하려면|되나요|할 수 있)/,tax:/(세금|법인세|절세|연결납세|조세)/,der:/(선물|옵션|스왑|파생|레버리지)/,
coin:/(코인|비트|이더|크립토|가상화폐|암호화폐)/,div:/(배당)/,short:/(공매도|숏|하락에 베팅|떨어질 종목)/,sec:/(업종|섹터|산업)/,
bank:/(내 은행|bis|대출 장부|예금|뱅크런)/,heat:/(감독원|주목도|구속|불법)/,status:/(현황|요약|브리핑|상황|정리해 줘|정리해줘|지금 어때)/};
const RVSN={raid:"기업 사냥꾼",act:"행동주의",ag:"공격적 인수",val:"가치 투자",mom:"모멘텀",idx:"인덱스",gg:"성장주 거장",mg:"매크로 거장",qg:"퀀트 거장",vg:"가치 거장"};
const qv=(...a)=>a[Math.floor(Math.random()*a.length)];
const pc=x=>(x>=0?"+":"")+(x*100).toFixed(1)+"%";
const lstQ=xs=>xs.length?`<ul>${xs.map(x=>`<li>${x}</li>`).join("")}</ul>`:"";
const coB=c=>`<b>${esc(c.tk)}</b> <span class="mu">${esc(c.n)}</span>`;
function secPE(i){const v=S.co.filter(c=>!c.dead&&!c.priv&&c.i===i).map(c=>{const e=epsT(c);return e>0?c.p/e:null}).filter(x=>x&&x<200).sort((a,b)=>a-b);return v.length?v[v.length>>1]:null}
function qaScore(c){const r=S.rs[c.id],hq=r&&r.q!=null?r.q:null,lev=c.D/Math.max(1,eq(c)),up=c.tg/c.p-1,cyc=(S.dg[c.i]||0)-(S.cg[c.i]||0),f=[];
const uc=Math.max(-.6,Math.min(1.5,up));let s=uc*1.6;f.push([uc*1.6,up>2?"적정가보다 훨씬 싸요 (+200% 이상)":up>0?"적정가보다 "+pc(up)+" 싸요":"적정가보다 "+pc(-up).slice(1)+" 비싸요"]);
s+=cyc*8;f.push([cyc*8,cyc>0?"업종이 공급 부족이라 마진이 좋아지는 중":"업종이 공급 과잉이라 마진이 눌리는 중"]);
if(hq!=null){s+=hq*.4;f.push([hq*.4,"리서치한 숨은 경쟁력 "+hqLab(hq)])}if(c.ar!=null&&c.acv){s+=c.ar*.08;f.push([c.ar*.08,"애널리스트 평균 "+ARL[c.ar+2]])}
if(lev>2){s-=.25;f.push([-.25,"부채가 자본의 "+lev.toFixed(1)+"배"])}if(r&&r.bomb){s-=.8;f.push([-.8,"⚠ 의심 신호: "+r.bomb])}if(rating(c)>=4){s-=.2;f.push([-.2,"신용 "+RT[rating(c)]+"로 낮아요"])}
f.sort((a,b)=>Math.abs(b[0])-Math.abs(a[0]));const v=s>.22?"매수 쪽":s<-.15?"매도 쪽":"관망",sg=v==="매수 쪽"?1:v==="매도 쪽"?-1:0,pro=f.filter(x=>sg?x[0]*sg>0:x[0]>0).slice(0,2).map(x=>x[1]),con=f.filter(x=>sg?x[0]*sg<0:x[0]<0).slice(0,2).map(x=>x[1]);
return{s,v,f:f.slice(0,3).map(x=>x[1]),pro,con,txt:(sg?pro.join(", ")+(con.length?". 반대 신호: "+con.join(", "):""):"좋은 점: "+(pro.join(", ")||"뚜렷한 게 없어요")+" / 걸리는 점: "+(con.join(", ")||"뚜렷한 게 없어요"))}}
function qaEnt(q){const Q=q.toUpperCase(),n=q.toLowerCase(),tk=new Set(Q.match(/[A-Z][A-Z0-9]{1,5}/g)||[]),E={co:[],cx:[],sec:[],gl:[],rv:[]};
for(const c of S.co){if(c.dead)continue;if(tk.has(c.tk.toUpperCase())||(c.n.length>=2&&n.includes(c.n.toLowerCase())))E.co.push(c)}
for(const x of(typeof cxAlive==="function"?cxAlive():[]))if(tk.has(x.k.toUpperCase())||(x.n.length>=2&&n.includes(x.n.toLowerCase())))E.cx.push(x);
SEC.forEach((s,i)=>{if(i!==HOLD&&s[0].split("·").some(p=>p.length>=2&&n.includes(p.toLowerCase())))E.sec.push(i)});
for(const[t,d]of GL)for(const p of t.split(/\s*\/\s*/))for(const v of[p.replace(/\s*\(.*\)\s*/,""),(p.match(/\((.*)\)/)||[])[1]])if(v&&v.length>=2&&n.includes(v.toLowerCase())&&!E.gl.some(g=>g[0]===t))E.gl.push([t,d,v.length]);
E.gl.sort((a,b)=>b[2]-a[2]);S.R.forEach((r,i)=>{const w=r.n.split(" ")[0];if(w.length>=2&&n.includes(w.toLowerCase()))E.rv.push(i)});return E}
function qaCo(c,f){const e=epsT(c),per=e>0?c.p/e:null,sp=secPE(c.i),dg=S.dg[c.i]||0,cg=S.cg[c.i]||0,lev=c.D/Math.max(1,eq(c)),my=grp(c,"P"),out=topRival(c,"P"),r=S.rs[c.id],own=c.own.P||0,sc=qaScore(c),L=[],A=[["종목 화면",`G.qaGo(${c.id})`]];
const head=c.priv?`${coB(c)}는 비상장이라 시장 가격이 없어요. 자본 ${F(eq(c))}, 현금 ${F(c.cs)}.`:`${coB(c)} (${SEC[c.i][0]}) — 지금 ${W(c.p)}, 시총 ${F(mc(c))}, 10일 ${P1(chg(c)*100)}.`;
if(!c.priv){L.push(`밸류: PER ${per?per.toFixed(1):"적자"}${sp?" (업종 중간값 "+sp.toFixed(1)+")":""} · 적정가 추정 ${W(c.tg)} (${pc(c.tg/c.p-1)})`);
L.push(c.acv?`애널리스트 ${c.acv}곳 · 평균 ${ARL[(c.ar||0)+2]} · 목표가 ${W(c.atp||c.tg)}`:"애널리스트가 다루지 않는 작은 회사예요. 남들이 덜 보는 만큼 기회도 있어요.")}
L.push(`업황: 수요 ${pc(dg)} vs 설비 ${pc(cg)} → ${dg>cg+.005?"공급 부족, 이익이 늘기 좋은 때":dg<cg-.005?"공급 과잉, 가격 경쟁이 심해지는 때":"균형"}`);
L.push(`재무: 신용 ${RT[rating(c)]} · 부채/자본 ${lev.toFixed(2)} · 현금 ${F(c.cs)}${c.priv?"":" (시총의 "+Math.round(c.cs/Math.max(1,mc(c))*100)+"%)"}`);
L.push(r&&r.q!=null?`숨은 경쟁력: <b>${hqLab(r.q)}</b> (${RST[r.t][0]} 결과)${r.bomb?" · ⚠ "+esc(r.bomb):""}`:r?`리서치 진행 중 (D-${Math.max(0,r.d-S.day)})`:"숨은 경쟁력은 아직 몰라요. 리서치하면 시장보다 먼저 알 수 있어요.");
if(mine(c))L.push(`경영권: 내가 지배 중 (그룹 ${my.toFixed(1)}% vs 외부 최대 ${out.toFixed(1)}%)${out>my-8?" · ⚠ 차이가 작아서 빼앗길 수 있어요":""}`);
else if(!c.priv){const need=Math.max(0,Math.max(20.5,out+1)-my),cost=need<=pub(c)?cost1(c,need):null,res=CTRY[c.cty]?CTRY[c.cty][1].res:0;
L.push(`경영권: ${cost!=null?"지분 "+need.toFixed(1)+"%p 더, 약 "+F(cost)+" 필요":"시장에 남은 물량이 부족해요"}${res>=10?" · "+CTRY[c.cty][0]+" 법인이라 방어가 강해요":""}${c.pill>S.day?" · 포이즌 필 발동 중":""}`)}
if(own>0)L.push(`내 보유: ${own.toFixed(2)}% · 평가 ${F(val(c))}${c.bs&&c.bs.P?" · 손익 "+(val(c)-c.bs.P>=0?"+":"")+F(val(c)-c.bs.P):""}`);
let v=`참모 판단: <b>${sc.v}</b> — ${sc.txt}.`;
if(f.sell&&own>0)v+=sc.s<0?" 줄이는 걸 권해요. 한 번에 많이 팔면 가격이 밀리니 나눠서 파세요.":" 아직은 들고 가도 괜찮아 보여요.";
else if(f.take&&!mine(c))v+=" 인수한다면 현금이 많을수록, 외부 지분이 적을수록 좋아요. 인수 후 이 회사를 거래 주체로 바꾸면 그 현금으로 다음 회사를 살 수 있어요.";
if(!c.priv){A.push(["매수",`G.tq(${c.id},'b')`]);if(own>0)A.push(["매도",`G.tq(${c.id},'s')`])}if(!r)A.push(["기본 리서치",`G.rsr(${c.id},0)`]);if(f.take&&!mine(c)&&!c.priv)A.push(["경영권까지",`G.qaGo(${c.id},'t')`]);
return{h:`<p>${head}</p>${lstQ(L)}<p>${v}</p>`,a:A}}
function qaTake(){const e=teOK(),av=eAvail(e),X=S.co.filter(c=>!c.dead&&!c.priv&&!mine(c)&&c.i!==HOLD&&mc(c)>0).map(c=>{const my=grp(c,"P"),out=topRival(c,"P"),need=Math.max(0,Math.max(20.5,out+1)-my),cost=need<=pub(c)?cost1(c,need):Infinity,cr=c.cs/mc(c),up=c.tg/c.p-1,def=(CTRY[c.cty]?CTRY[c.cty][1].res:0)+(c.pill>S.day?15:0)+out*.5;return{c,need,cost,cr,up,def,pb:mc(c)/Math.max(1,eq(c)),s:cr*1.2+Math.min(1.5,up)-def/60}}).filter(x=>isFinite(x.cost));
const ok=X.filter(x=>x.cost<=av).sort((a,b)=>b.s-a.s).slice(0,3),pick=ok.length?ok:X.sort((a,b)=>a.cost-b.cost).slice(0,3);
const L=pick.map(x=>`${coB(x.c)} — 경영권까지 약 ${F(x.cost)} (${x.need.toFixed(1)}%p), 현금이 시총의 ${Math.round(x.cr*100)}%, PBR ${x.pb.toFixed(2)}${x.pb<.7?" (자본보다 싸게 거래)":""}${x.def>12?", 방어가 강한 편":""}`);
return{h:`<p>${esc(eName(e))} 가용 자금 ${F(av)} 기준으로 ${ok.length?qv("노려볼 만한 곳이에요.","지금 손이 닿는 후보예요."):"아직 경영권까지 살 수 있는 곳이 없어서, 가장 싼 후보를 보여 줄게요."}</p>${lstQ(L)}<p class="mu">현금 많은 회사를 먹은 뒤 그 회사를 거래 주체로 바꿔 다음 회사를 사는 게 원작의 연쇄 인수 공식이에요.</p>`,a:pick.map(x=>[x.c.tk,`G.qaGo(${x.c.id})`])}}
function qaRisk(){const w=nw(),R=[],my=S.co.filter(mine),hs=S.co.filter(c=>c.own.P&&!c.dead),tot=hs.reduce((a,c)=>a+val(c),0);
if(S.loan>0)R.push([S.loan>w*2?2:S.loan>w?1:0,`개인 대출 ${F(S.loan)} = 순자산의 ${(S.loan/Math.max(1,w)).toFixed(1)}배 (3배를 넘으면 마진콜로 강제 매도)`]);
if(hs.length>1){const t=hs.slice().sort((a,b)=>val(b)-val(a))[0],sh=val(t)/Math.max(1,tot);if(sh>.5)R.push([1,`${esc(t.tk)} 한 종목이 주식 평가액의 ${Math.round(sh*100)}% — 한 회사에 크게 몰려 있어요`])}
const th=my.filter(c=>!c.priv&&topRival(c,"P")>grp(c,"P")-8);if(th.length)R.push([2,`경영권 위협: ${th.slice(0,3).map(c=>esc(c.tk)+" (내 "+grp(c,"P").toFixed(0)+"% vs 외부 "+topRival(c,"P").toFixed(0)+"%)").join(", ")}`]);
const lv=my.filter(c=>c.D>eq(c)*2.5||rating(c)>=4);if(lv.length)R.push([1,`빚이 많은 지배 회사: ${lv.slice(0,3).map(c=>esc(c.tk)+" (신용 "+RT[rating(c)]+")").join(", ")}`]);
const sh=S.co.filter(c=>c.sp>0&&!c.dead);if(sh.length)R.push([1,`공매도 ${sh.length}종목 — 주가가 오르면 손실이 커지고, 순자산이 공매도 평가액의 1/3 아래면 강제 환매돼요`]);
if((S.fx||[]).length||(S.pp||[]).length||(S.ow||[]).length)R.push([1,`파생 포지션 ${(S.fx||[]).length+(S.pp||[]).length+(S.ow||[]).length}개 — 매일 정산되니 증거금을 확인하세요`]);
if(S.heat>30)R.push([S.heat>=60?2:1,`감독원 주목도 ${S.heat.toFixed(0)}/100 — 100이 된 상태에서 조사받으면 구속돼요`]);
if(S.yS>S.yL)R.push([1,"장단기 금리 역전 — 역사적으로 경기 침체 신호였어요"]);if(S.bsw&&S.bsw.end>S.day)R.push([2,`블랙 스완 '${esc(S.bsw.n)}' 진행 중`]);
R.sort((a,b)=>b[0]-a[0]);return{h:R.length?`<p>${qv("지금 눈여겨볼 위험이에요.","위험한 곳부터 짚어 볼게요.")}</p>${lstQ(R.map(([s,t])=>(s>=2?"🔴 ":s?"🟠 ":"🟢 ")+t))}`:`<p>${qv("지금은 큰 위험이 안 보여요.","당장 급한 위험은 없어 보여요.")} 대출·집중·경영권·파생을 다 확인했어요.</p>`,a:[["포트폴리오 분석","G.qaPg('pa')"],["계좌 명세서","G.qaPg('st')"]]}}
function qaCash(){const e=teOK(),av=eAvail(e),L=[`안전하게: 장기 국채 연 ${(+S.yL||S.prime).toFixed(2)}% (은행·경제 탭)`];
const dv=S.co.filter(c=>!c.dead&&!c.priv&&!mine(c)&&c.pay>0&&epsT(c)>0).map(c=>[c,epsT(c)*c.pay/c.p]).sort((a,b)=>b[1]-a[1]).slice(0,3);if(dv.length)L.push("배당: "+dv.map(([c,y])=>esc(c.tk)+" "+(y*100).toFixed(1)+"%").join(", "));
const uv=S.co.filter(c=>!c.dead&&!c.priv&&!mine(c)&&epsT(c)>0&&rating(c)<=3).sort((a,b)=>a.p/a.tg-b.p/b.tg).slice(0,3);if(uv.length)L.push("저평가: "+uv.map(c=>esc(c.tk)+" (적정가 대비 "+pc(c.tg/c.p-1)+")").join(", "));
if(S.loan>0)L.push(`빚 갚기: 개인 대출 금리가 약 ${(S.prime+1.5).toFixed(1)}%라, 갚으면 그만큼 확실한 수익이에요`);
const bb=S.co.filter(c=>mine(c)&&!c.priv&&c.tg>c.p*1.25);if(bb.length)L.push("자사주: "+bb.slice(0,3).map(c=>esc(c.tk)+" (적정가 대비 "+pc(c.tg/c.p-1)+")").join(", ")+" — 싸게 거래되는 내 회사는 자사주 매입도 좋아요");
return{h:`<p>${esc(eName(e))} 가용 자금 ${F(av)}. ${qv("굴릴 곳을 위험이 낮은 순서로 정리했어요.","선택지를 정리해 봤어요.")}</p>${lstQ(L)}`,a:[["인수 후보",`G.qaAsk('인수할 만한 회사는?')`],["은행·경제 탭","G.qaTab('b')"]]}}
function qaMacro(n){n=n||"";const lv=S.IX&&S.IX.RATE&&S.IX.RATE.lv||[],r0=lv.length>6?lv[lv.length-7]/100:null,d=r0!=null?S.prime-r0:0,L=[],hot=INDS.map(i=>[i,(S.dg[i]||0)-(S.cg[i]||0)]).sort((a,b)=>b[1]-a[1]);
L.push(`기준금리 ${S.prime.toFixed(2)}%${Math.abs(d)>.1?(d>0?" (오르는 중)":" (내리는 중)"):""} · 단기 ${(+S.yS).toFixed(2)}% · 장기 ${(+S.yL).toFixed(2)}%${S.yS>S.yL?" · ⚠ 역전":""}`);
L.push(`물가 ${(+S.inf).toFixed(1)}% · 실업률 ${(+S.un).toFixed(1)}% · 환율 ${Math.round(S.fxr||0).toLocaleString()}원 · 경기 국면 ${esc(S.cyc||"-")}`);
if(S.bsw&&S.bsw.end>S.day)L.push(`블랙 스완 '${esc(S.bsw.n)}' 진행 중 (남은 약 ${Math.max(1,Math.round((S.bsw.end-S.day)/30))}개월)`);if(S.mx){const m=MXE.find(z=>z.id===S.mx.id);if(m)L.push(`진행 중인 국면: ${esc(m.n)} (남은 ${S.mx.q}분기)`)}
L.push(`업황 좋은 업종: ${hot.slice(0,2).map(x=>SEC[x[0]][0]).join(", ")} / 나쁜 업종: ${hot.slice(-2).map(x=>SEC[x[0]][0]).join(", ")}`);
const T=[];if(d>.1)T.push("금리가 오르는 중이면 빚 많은 회사와 성장주가 불리하고 은행·보험이 유리해요.");if(d<-.1)T.push("금리가 내려가는 중이면 성장주·부동산·빚 많은 회사가 숨통을 틔워요.");if(S.yS>S.yL)T.push("장단기 역전 뒤에는 침체가 오곤 해서 현금 비중을 늘리는 사람이 많아요.");if(S.inf>4)T.push("물가가 높으면 원자재·에너지가 강하고, 중앙은행이 금리를 더 올릴 수 있어요.");if(/(오르면|올리면|인상|오를까)/.test(n)&&/금리/.test(n))T.unshift("금리가 오르면: 빚 많은 회사의 이자 부담이 커지고, 미래 이익의 현재 가치가 줄어 성장주·부동산이 약해져요. 국채 값은 떨어지고(수익률은 오르고), 은행은 예대마진이 늘어 유리한 편이에요. 내 대출 이자도 늘어요.");if(/(내리면|내려가면|인하|떨어지면)/.test(n)&&/금리/.test(n))T.unshift("금리가 내리면: 빚 많은 회사와 성장주·부동산이 숨통을 틔우고, 국채 값이 올라요. 대신 은행 마진은 줄어요.");if(/물가/.test(n)&&/(오르면|높으면|인플레)/.test(n))T.unshift("물가가 오르면: 원자재·에너지 기업이 강하고, 중앙은행이 금리를 올려 주식 전체가 눌리기 쉬워요.");
return{h:`<p>${qv("지금 경제는 이래요.","경제 상황을 요약할게요.")}</p>${lstQ(L)}${T.length?`<p>${T.join(" ")}</p>`:""}`,a:[["경제 지표","G.qaPg('econ')"]]}}
function qaRival(i){const X=S.R.map((r,k)=>({r,k,w:rnw(k)})).sort((a,b)=>b.w-a.w),my=S.co.filter(mine),one=i!=null?X.filter(x=>x.k===i):X;
const L=one.map(x=>{const n=S.co.filter(c=>!c.dead&&c.ctl==="r"+x.k).length,thr=my.filter(c=>(c.own["r"+x.k]||0)>=5);return `<b>${esc(x.r.n)}</b> (${RVSN[x.r.s]||esc(x.r.s)}) — 순자산 ${F(x.w)}, 지배 ${n}개${thr.length?" · ⚠ 내 회사 "+thr.slice(0,3).map(c=>esc(c.tk)+" "+c.own["r"+x.k].toFixed(0)+"%").join(", ")+" 보유":""}`});
return{h:`<p>내 순자산 ${F(nw())}. ${i!=null?"이 라이벌은 이래요.":"라이벌 순위예요."}</p>${lstQ(L)}<p class="mu">내 회사 지분을 5% 넘게 모은 라이벌이 있으면 경영권 공격의 신호예요. 지분을 늘리거나 포이즌 필로 막으세요.</p>`,a:[["라이벌·그룹","G.qaPg('rv')"]]}}
function qaSec(i){const cs=S.co.filter(c=>!c.dead&&!c.priv&&c.i===i).sort((a,b)=>mc(b)-mc(a)),dg=S.dg[i]||0,cg=S.cg[i]||0,pe=secPE(i),me=cs.reduce((a,c)=>a+val(c),0);
const L=[`수요 ${pc(dg)} vs 설비 ${pc(cg)} → ${dg>cg+.005?"공급 부족 (이익 개선기)":dg<cg-.005?"공급 과잉 (이익 압박기)":"균형"}`,`상장 ${cs.length}곳 · PER 중간값 ${pe?pe.toFixed(1):"-"}`,"대장주: "+cs.slice(0,3).map(c=>esc(c.tk)+" (점유율 "+Math.round(share(c)*100)+"%, 10일 "+P1(chg(c)*100)+")").join(", ")];
if(me>0)L.push(`내 보유 평가액 ${F(me)}`);return{h:`<p><b>${SEC[i][0]}</b> 업종이에요.</p>${lstQ(L)}`,a:cs.slice(0,3).map(c=>[c.tk,`G.qaGo(${c.id})`]).concat([["업종 점유율","G.qaPg('shr')"]])}}
function qaCoach(){const t=(typeof coachTips==="function"?coachTips():[]).slice(0,5);return{h:`<p>${qv("지금까지 플레이를 보고 짚어 볼게요.","솔직하게 피드백할게요.")}</p>${lstQ(t.map(x=>(x[0]>=3?"🔴 ":x[0]===2?"🟠 ":x[0]===1?"🔵 ":"🟢 ")+"<b>"+esc(x[1])+"</b> — "+esc(x[2])))}`,a:[["AI 코치 화면","G.qaPg('coach')"]]}}
function qaNext(){const w=nw(),r=S.rank,nx=RK[r+1],my=S.co.filter(mine),hs=S.co.filter(c=>c.own.P&&!c.dead),L=[];
if(S.ms<MIS.length){const m=MIS[S.ms];L.push(`미션 ${S.ms+1}: <b>${esc(m[0])}</b> — ${esc(m[1])}${m[3]?" (보상 "+F(m[3])+")":""}`)}if(nx)L.push(`다음 칭호 '${nx[0]}'까지 순자산 ${F(Math.max(0,nx[1]-w))} 더`);
if(!hs.length)L.push("시장 탭에서 작은 회사 하나를 골라 1%부터 사 보세요.");else if(!my.length){const t=qaTake().a[0];L.push("시총이 작은 회사의 지분을 20% 넘게 모아 최대 주주가 되면 경영권을 얻어요."+(t?" 후보: "+esc(t[0]):""))}
else L.push("지배 회사 중 현금이 많은 곳을 거래 주체로 바꿔서 다음 인수에 그 현금을 써 보세요. 회사가 늘면 자동 경영을 켜 두면 편해요.");if(S.heat>40)L.push("감독원 주목도가 높으니 한동안 무리한 수는 피하세요.");
return{h:`<p>${qv("지금 할 만한 일이에요.","다음 수를 정리했어요.")}</p>${lstQ(L)}`,a:[["미션 바로 가기","G.qaMis()"],["인수 후보",`G.qaAsk('인수할 만한 회사는?')`]]}}
function qaConcept(G2,n){const t=G2.slice(0,2),L=t.map(([a,b])=>`<b>${esc(a)}</b> — ${esc(b)}`),A=[];
for(const[a]of t){const w=a.split(/\s*\/\s*/)[0].replace(/\s*\(.*\)/,""),k=BK.find(x=>x[1].includes(w))||BK.find(x=>x[2].includes(w))||BK.find(x=>x[3].replace(/<[^>]+>/g,"").includes(w));if(k&&!A.some(z=>z[1].includes(k[0])))A.push(["📖 "+k[1].split(" — ")[0],`G.qaBook('${k[0]}')`])}
const hl=HELP.find(([a])=>t.some(([b])=>a.includes(b.split(" ")[0])));return{h:`<p>${qv("쉽게 말하면 이래요.","개념서에서 찾아왔어요.")}</p>${lstQ(L)}${hl?`<p class="mu">${esc(hl[0])}: ${esc(hl[1])}</p>`:""}`,a:A}}
const HOW=[[/(공매도|숏)/,"종목 화면 › 매매 탭 › '개인 투자 (나 명의)'에서 공매도 1·5·10%를 누르거나 직접 입력해요. 연 2% 대차 수수료가 들고, 순자산이 공매도 평가액의 1/3 아래면 강제 환매돼요.",["공매도 후보","G.qaAsk('공매도 할 만한 종목')"]],
[/(인수|경영권|공개매수)/,"종목 화면 › 매매 탭의 '경영권까지'가 가장 빨라요. 물량이 모자라거나 비싸면 인수 탭에서 공개매수(프리미엄을 붙여 한 번에 사기)를 걸어요. 지분 20% 이상이면서 그룹 합산 최대 주주면 경영권이에요.",["인수 후보","G.qaAsk('인수할 만한 회사는?')"]],
[/(회사 설립|창업|설립)/,"명령 센터(왼쪽 위 ＋) › 회사 설립. 나나 내 회사가 자본금을 내서 비상장 회사를 만들고, 나중에 상장할 수 있어요.",["회사 설립","G.qaPg('fd')"]],
[/(자금 이동|송금|돈 옮|돈을 옮)/,"명령 센터 › 자금 이동. 나와 내 회사들 사이에서 현금을 옮겨요.",["자금 이동","G.qaPg('xf')"]],
[/(거래 주체)/,"위쪽 '거래 주체' 버튼을 눌러 나 또는 내가 지배하는 회사를 고르면, 그 회사 돈으로 사고팔아요. 현금 많은 회사를 고르면 연쇄 인수가 돼요.",["거래 주체 고르기","G.pickTE()"]],
[/(선물|옵션|스왑|파생)/,"명령 센터 › 파생상품에서 원자재·지수·주식 선물과 금리 스왑을, 종목 화면 매매 탭에서 옵션 체인(사기·쓰기)을 다뤄요.",["파생상품","G.qaPg('dv')"]],
[/(리서치|실사|조사하)/,"종목 화면 개요의 '리서치' 카드에서 기본·심층·전문가 리서치를 골라요. 개념서 퀴즈로 받은 크레딧으로도 할 수 있어요.",["리서치 센터","G.qaPg('rsc')"]],
[/(자사주)/,"내가 경영하는 회사의 경영 탭에서 자사주 매입을 써요. 싸게 거래될 때 사면 남은 주주 몫이 커져요.",null],
[/(배당)/,"내가 경영하는 회사의 경영 탭 › 배당성향에서 정해요. 다른 회사 배당은 지분만큼 저절로 들어와요.",null],
[/(대출|빚|상환|갚)/,"은행·경제 탭에서 개인 대출을 받거나 갚아요. 대출이 순자산의 3배를 넘으면 마진콜로 강제 매도돼요.",["은행·경제 탭","G.qaTab('b')"]],
[/(국채|채권)/,"은행·경제 탭에서 국채를 사고팔아요. 회사채는 종목 화면 매매 탭 아래에 있어요.",["은행·경제 탭","G.qaTab('b')"]],
[/(코인|비트|이더)/,"시장 탭 › 코인에서 사고팔아요. 레버리지는 코인 화면의 무기한 선물에서만 고를 수 있어요.",["코인 시장","G.qaTab('m',3)"]],
[/(저장|세이브|이어서|불러오)/,"설정에서 저장 슬롯과 저장 코드(복사·붙여넣기)를 써요. 웹에서는 클라우드 저장도 돼요.",["설정","G.qaPg('set')"]],
[/(속도|배속|빨리 감|멈추|일시정지)/,"위쪽 시계에서 ▶/⏸로 멈추고 1×~30×로 속도를 골라요. ⏭ 빨리 감기는 다음 달·분기 결산·연말까지 한 번에 가요.",null]];
function qaHow(n,E){const h=HOW.find(x=>x[0].test(n));if(!h)return null;const g=E.gl[0];return{h:`<p>${h[1]}</p>${g?`<p class="mu"><b>${esc(g[0])}</b> — ${esc(g[1])}</p>`:""}`,a:h[2]?[h[2]]:[]}}
const QST=new Set(["지금","그럼","어떻게","뭐야","뭐지","어때","하는","하면","해야","있어","없어","좀","이거","그거","내가","나는","제가","알려줘","알려","궁금해","질문"]);
function qaHelp(n){const ws=n.split(/[\s?.!,~]+/).map(w=>w.replace(/(은|는|이|가|을|를|에|의|로|으로|도|만|요|야)$/,"")).filter(w=>w.length>=2&&!QST.has(w));if(!ws.length)return null;
let best=null,bs=0;const sc=(t,b)=>ws.reduce((a,w)=>a+(t.includes(w)?3:0)+(b.includes(w)?1:0),0);
for(const[t,b]of HELP){const s=sc(t,b);if(s>bs){bs=s;best={h:`<p><b>${esc(t)}</b></p><p>${esc(b)}</p>`,a:[["게임 방법","G.qaPg('help')"]]}}}
for(const x of BK){const s=sc(x[1],x[2]+x[3].replace(/<[^>]+>/g,"").slice(0,800));if(s>bs){bs=s;best={h:`<p><b>${esc(x[1])}</b></p><p>${esc(x[2])}. 개념서 이 장에 자세히 나와요.</p>`,a:[["📖 읽기",`G.qaBook('${x[0]}')`]]}}}
for(const[t,d]of GL){const s=sc(t,d);if(s>bs){bs=s;best={h:`<p><b>${esc(t)}</b> — ${esc(d)}</p>`,a:[]}}}return bs>=2?best:null}
function qaCoin(x){const ph=cxPhase();if(x){const ct=CXC[x.cat]||["코인",1,0,0,""],pp=(S.pp||[]).filter(p=>p.k===x.k);
return{h:`<p><b>${esc(x.k)}</b> ${esc(x.n)} (${ct[0]}) — ${Wc(x.p)}${x.ath?" · 최고가 대비 "+pc(x.p/x.ath-1):""}</p>${lstQ([esc(ct[4]||""),`크립토 국면: ${ph.lab} (다음 반감기까지 약 ${Math.round(ph.next/30)}개월)`,x.h?`내 보유 ${x.h.toLocaleString()}개`:"보유 없음",pp.length?`무기한 선물 ${pp.length}개 보유 중 — 레버리지는 청산 위험이 커요`:"레버리지(1~100배)는 무기한 선물에서만 쓸 수 있어요"].filter(Boolean))}`,a:[["코인 화면",`G.qaCx('${x.k}')`]]}}
const al=cxAlive();return{h:`<p>코인 ${al.length}개가 살아 있어요. 크립토 국면은 <b>${ph.lab}</b> (다음 반감기까지 약 ${Math.round(ph.next/30)}개월).</p>${lstQ([`내 코인 평가액 ${F(cxv())}`,"강세 국면엔 새 코인이 생기고, 겨울엔 러그풀·해킹·상장폐지가 늘어요.","BTC·ETH 같은 핵심 코인은 망하지 않지만, 밈·AI 코인은 변동성이 매우 커요."])}`,a:[["코인 시장","G.qaTab('m',3)"]]}}
function qaDer(){const fx=(S.fx||[]).length,op=(S.op||[]).length,ow=(S.ow||[]).length,pp=(S.pp||[]).length,sw=(S.irs||[]).length;
return{h:`<p>내 파생 포지션: 선물 ${fx} · 옵션 매수 ${op} · 옵션 매도 ${ow} · 코인 무기한 ${pp} · 금리 스왑 ${sw}${S.fm?" · 선물 증거금 "+F(S.fm):""}</p>${lstQ(["선물은 매일 손익이 증거금에 정산되고, 유지 증거금 아래로 떨어지면 마진콜이 와요.","옵션을 쓰면(매도) 프리미엄을 바로 받지만, 크게 움직이면 손실이 무제한일 수 있어요. 커버드 콜이 가장 안전해요.","레버리지는 코인 무기한 선물에서만 고를 수 있어요."])}`,a:[["파생상품","G.qaPg('dv')"]]}}
function qaDiv(){const dv=S.co.filter(c=>!c.dead&&!c.priv&&c.pay>0&&epsT(c)>0).map(c=>[c,epsT(c)*c.pay/c.p]).sort((a,b)=>b[1]-a[1]).slice(0,5);
return{h:`<p>배당수익률이 높은 곳이에요${S.qr?" (지난 분기 내 배당 수입 "+F(S.qr.div)+")":""}.</p>${lstQ(dv.map(([c,y])=>`${coB(c)} — ${(y*100).toFixed(1)}% (배당성향 ${Math.round(c.pay*100)}%, 신용 ${RT[rating(c)]})`))}<p class="mu">배당은 지분 그대로 들어와요. 배당받는 회사를 지배하면 그 돈을 다시 인수에 쓸 수 있어요.</p>`,a:dv.slice(0,3).map(([c])=>[c.tk,`G.qaGo(${c.id})`])}}
function qaShort(){const X=S.co.filter(c=>!c.dead&&!c.priv&&!mine(c)).map(c=>{const r=S.rs[c.id];return[c,c.p/c.tg-1+((S.cg[c.i]||0)-(S.dg[c.i]||0))*5+(r&&r.bomb?.5:0)]}).sort((a,b)=>b[1]-a[1]).slice(0,3);
return{h:`<p>떨어질 이유가 많은 후보예요.</p>${lstQ(X.map(([c])=>`${coB(c)} — 적정가 대비 ${pc(c.tg/c.p-1)}, 업황 ${(S.dg[c.i]||0)<(S.cg[c.i]||0)?"공급 과잉":"보통"}${S.rs[c.id]&&S.rs[c.id].bomb?", ⚠ 의심 신호":""}`))}<p class="mu">공매도는 연 2% 대차 수수료가 들고, 순자산이 공매도 평가액의 1/3 아래로 떨어지면 강제 환매돼요.</p>`,a:X.map(([c])=>[c.tk,`G.qaGo(${c.id},'t')`])}}
function qaBank(){const bb=S.co.filter(c=>mine(c)&&c.kd===1);if(!bb.length){const c=S.co.filter(x=>!x.dead&&!x.priv&&x.kd===1&&!mine(x)).sort((a,b)=>mc(a)-mc(b)).slice(0,3);
return{h:`<p>아직 은행이 없어요. 은행을 지배하면 대출 장부를 쥐고, 부실한 회사의 대출을 회수하거나 싸게 사서 그 회사를 차지할 수 있어요(loan-to-own).</p>${lstQ(c.map(x=>`${coB(x)} — 시총 ${F(mc(x))}`))}`,a:c.map(x=>[x.tk,`G.qaGo(${x.id})`])}}
return{h:`<p>내 은행 ${bb.length}곳.</p>${lstQ(bb.map(b=>{const n=S.co.filter(x=>!x.dead&&!mine(x)&&x.ln===b.id&&rating(x)>=4).length;return `${coB(b)} — 자산 ${F(b.A)}, 부실 위험 고객 ${n}곳`}))}<p class="mu">BIS 비율이 규제 아래로 떨어지면 대출이 금지돼요. 경영 탭에서 자산 배분을 관리하세요.</p>`,a:bb.slice(0,3).map(b=>[b.tk,`G.qaGo(${b.id},'m')`])}}
function qaTax(){const my=S.co.filter(mine),L=my.slice(0,4).map(c=>`${esc(c.tk)} — ${CTRY[c.cty]?CTRY[c.cty][0]+" 법인세 "+Math.round(CTRY[c.cty][1].tax*100)+"%":"-"}`),ok=my.filter(c=>Object.keys(c.own).some(k=>k[0]==="c"&&S.co[+k.slice(1)]&&mine(S.co[+k.slice(1)])&&c.own[k]>=80)).length,low=CTRY.map((x,i)=>[x,i]).sort((a,b)=>a[0][1].tax-b[0][1].tax).slice(0,3);
return{h:`<p>${my.length?"내 회사들의 세금이에요.":"아직 지배 회사가 없어요."}</p>${lstQ(L.concat([`연결납세: 지주회사가 자회사를 80% 이상 가지면 손익을 합쳐 세금을 줄여요 (지금 ${ok}곳 해당)`,`세금 낮은 나라: ${low.map(([x])=>x[0]+" "+Math.round(x[1].tax*100)+"%").join(", ")} — 조세회피처는 감독원 주목도가 올라요`]))}`,a:[]}}
function qaHeat(){return{h:`<p>감독원 주목도 ${S.heat.toFixed(0)}/100.</p>${lstQ(["윤리적으로 위험한 제안을 받아들이면 올라가요.","시간이 지나면 천천히 내려가요.","100이 된 상태에서 조사받으면 구속되어 게임이 끝나요."])}`,a:[]}}
function qaStatus(){return{h:lstQ(brief().split("\n\n").map(esc)),a:[["포트폴리오 분석","G.qaPg('pa')"]]}}
function qaFallback(){return{h:`<p>${qv("그건 아직 제가 잘 몰라요.","질문을 잘 못 알아들었어요.")} 이렇게 물어보면 바로 답할 수 있어요.</p>${lstQ(["티커와 함께: <b>"+esc(qaTk())+" 사도 돼?</b>, <b>"+esc(qaTk())+" 팔까?</b>","인수할 만한 회사는? · 내 가장 큰 위험은? · 남는 현금 어떻게 굴릴까?","경제 전망은? · 반도체 업종 어때? · 라이벌 동향은?","PER이 뭐야? · 공매도는 어떻게 해? · 피드백 해줘 · 다음에 뭐 하지?"])}`,a:[]}}
const qaTk=()=>{const c=S.co.filter(x=>!x.dead&&!x.priv).sort((a,b)=>mc(b)-mc(a))[0];return c?c.tk:"티커"};
function qaAnswer(q){const n=q.toLowerCase(),E=qaEnt(q),I=k=>QAW[k].test(n),any=Object.keys(QAW).some(I);
if(E.co.length&&!(I("concept")&&E.gl.length))return qaCo(E.co[0],{buy:I("buy"),sell:I("sell"),take:I("take")});if(E.cx.length)return qaCoin(E.cx[0]);
if(E.gl.length&&(I("concept")||!any))return qaConcept(E.gl,n);if(I("concept")){const h=qaHelp(n);if(h)return h}
if(/(어떻게 ?(해|하|얻|받|사|만들|올리|늘리|줄이|막|써|쓰)|하는 법|방법|하려면|어디서)/.test(n)){const hw=qaHow(n,E);if(hw)return hw;const h=qaHelp(n);if(h){if(I("short"))h.a.push(["공매도 후보",`G.qaAsk('공매도 할 만한 종목')`]);if(I("take"))h.a.push(["인수 후보",`G.qaAsk('인수할 만한 회사는?')`]);return h}}
if(I("risk"))return qaRisk();if(I("take"))return qaTake();if(I("cash"))return qaCash();if(I("tax"))return qaTax();if(I("short"))return qaShort();if(I("der"))return qaDer();if(I("coin"))return qaCoin();if(I("div"))return qaDiv();if(I("bank"))return qaBank();if(I("heat"))return qaHeat();
if(E.rv.length||I("rival"))return qaRival(E.rv[0]);if(E.sec.length)return qaSec(E.sec[0]);if(I("macro"))return qaMacro(n);if(I("coach"))return qaCoach();if(I("next"))return qaNext();if(I("status"))return qaStatus();
const h=qaHelp(n);if(h)return h;if(E.gl.length)return qaConcept(E.gl,n);return qaFallback()}

// ---- chat page ----
const aiNm2=()=>typeof aiNm==="function"?aiNm():aiName(),aiLive2=()=>typeof aiLive==="function"?aiLive():aiOn(),aiErr2=e=>typeof laiErr==="function"?laiErr(e):aiErr(e);
let QAV="";const QCH=["내 상황 요약","인수할 만한 회사는?","내 가장 큰 위험은?","남는 현금 어떻게 굴릴까?","경제 전망은?","피드백 해줘","다음에 뭐 하지?","PER이 뭐야?"];
function qaBub(m){return(m.q?`<div class="qm">${esc(m.q)}</div>`:"")+`<div class="qr${m.s?" llm":""}">${m.s?`<div class="qs">${esc(m.s)}</div>`:""}${m.h}${m.a&&m.a.length?`<div class="qb">${m.a.map(([t,f])=>`<button onclick="${f}">${esc(t)}</button>`).join("")}</div>`:""}</div>`}
function advPg(){const L=S.qa||[];return hd("AI 참모")+`<div class="mu" style="line-height:1.6;margin-bottom:8px">게임에 들어 있는 <b>레이더 참모</b>예요. 무료·무제한·오프라인으로 지금 게임 상황을 계산해서 답해요.${S.aiP!=="rule"?(aiLive2()?` ${aiNm2()}가 켜져 있어서 같은 계산 결과로 한 번 더 자연스럽게 답해요.`:` ${aiNm2()}를 고르셨지만 아직 준비되지 않았어요${S.aiP==="local"?" (설정에서 모델 받기)":""}.`):""}</div>
<div class="qal">${L.length?L.map(qaBub).join(""):`<div class="qr"><p>${qv("무엇이든 물어보세요.","궁금한 걸 물어보세요.")} 종목(티커), 인수, 위험, 현금, 경제, 개념, 피드백까지 답할 수 있어요.</p></div>`}</div>
<div class="ch qch">${QCH.map(q=>B(esc(q),`G.qaAsk('${q}')`)).join("")}</div><div class="qin"><input class="in" id="qai" autocomplete="off" enterkeyhint="send" placeholder="예: ${esc(qaTk())} 사도 돼?" value="${esc(QAV)}" oninput="QAV=this.value" onkeydown="if(event.key==='Enter'){event.preventDefault();G.qaSend()}" aria-label="참모에게 질문"><button class="p" onclick="G.qaSend()">보내기</button></div>${L.length?`<div class="bs">${B("대화 지우기","G.qaClr()")}</div>`:""}`}
const qaTxt=h=>h.replace(/<li>/g,"\n- ").replace(/<\/(p|ul)>/g,"\n").replace(/<[^>]+>/g,"").replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&amp;/g,"&").replace(/\n{3,}/g,"\n\n").trim();
function qaPush(m){S.qa=S.qa||[];S.qa.push(m);if(S.qa.length>16)S.qa.splice(0,S.qa.length-16)}
G.qaSend=q=>{q=String(q!=null?q:($("qai")||{}).value||QAV||"").trim();if(!q)return toast("질문을 입력하세요");QAV="";let r;try{r=qaAnswer(q)}catch(e){r={h:"<p>계산하다가 문제가 생겼어요. 다른 말로 물어봐 주세요.</p>",a:[]}}
qaPush({q,h:r.h,a:r.a});pg="adv";sel=-1;render();qaEnd();if(S.aiP==="local"&&typeof laiWake==="function")laiWake();
if(S.aiP!=="rule"&&aiLive2()&&!busy){busy=1;const p="너는 주식·M&A 시뮬레이션 게임 '레이더 타이쿤'의 참모야. 아래 '게임이 계산한 사실'만 근거로 플레이어 질문에 한국어 해요체로 4~6문장 답해. 사실에 없는 숫자나 회사는 지어내지 말고, 실존 기업과 연결하지 마.\n질문: "+q+"\n게임이 계산한 사실:\n"+qaTxt(r.h);
const m={q:"",h:"<p>생각 중…</p>",a:[],s:aiNm2()},fm=t=>`<p>${esc(String(t||"")).replace(/\n+/g,"</p><p>")}</p>`;qaPush(m);render();qaEnd();llm(p,u=>{m.h=fm(u.text);const el=[...document.querySelectorAll(".qr.llm")].pop();if(el&&pg==="adv"){el.innerHTML=`<div class="qs">${esc(m.s)}</div>`+m.h;qaEnd()}}).then(t=>{m.h=fm(t)}).catch(e=>{m.h=`<p class="mu">${esc(aiErr2(e))}</p>`}).finally(()=>{busy=0;if(pg==="adv"){render();qaEnd()}})}};
function qaEnd(){const s=$("sh");if(s&&s.scrollHeight!=null)s.scrollTop=s.scrollHeight}
G.qaAsk=q=>{G.menu(0);G.qaSend(q)};G.qaClr=()=>{S.qa=[];render()};
G.qaGo=(i,t)=>{pg="";sel=i;stab=t||"o";render()};G.qaPg=k=>{sel=-1;G.pg(k)};G.qaTab=(t,s)=>{pg="";sel=-1;G.go(t);if(s!=null)G.seg(s)};G.qaBook=k=>G.book(k);G.qaCx=k=>{pg="";G.cxOpen(k)};G.qaMis=()=>{pg="";G.misGo()};
{const p0=page12;page12=function(){if(pg==="adv")return advPg();return p0()}}
function qaCard(i){const c=S.co[i];if(!c||c.dead||c.priv)return"";const s=qaScore(c);return `<div class="row" style="margin-top:12px"><b>레이더 참모 의견</b>${B("자세히 묻기",`G.qaAsk('${c.tk} 어때?')`)}</div><div class="mu" style="margin-top:4px;line-height:1.55"><b class="${s.v==="매수 쪽"?"up":s.v==="매도 쪽"?"dn":""}">${s.v}</b> — ${esc(s.txt)}</div>`}

// ---- on-device AI check: what this phone's app engine supports, to decide how a local model could run ----
G.odProbe=async()=>{const r=[],ua=navigator.userAgent||"",cv=(ua.match(/Chrome\/([\d.]+)/)||[])[1]||"?";r.push("엔진: "+(/; wv\)/.test(ua)?"Android WebView ":"브라우저 ")+"Chrome "+cv);
r.push("앱 버전: "+(stApp()&&Android.version?Android.version():"웹"));r.push("CPU 코어 "+(navigator.hardwareConcurrency||"?")+" · 메모리 "+(navigator.deviceMemory?navigator.deviceMemory+"GB+":"알 수 없음"));
let simd=false;try{simd=WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]))}catch(e){}r.push("WebAssembly SIMD: "+(simd?"지원":"미지원"));
r.push("멀티스레드: "+(typeof SharedArrayBuffer!=="undefined"&&self.crossOriginIsolated?"가능":"불가")+" · 보안 컨텍스트: "+(self.isSecureContext?"예":"아니오"));
let g="없음";if(navigator.gpu){try{const a=await navigator.gpu.requestAdapter();if(a){const f=a.info||(a.requestAdapterInfo?await a.requestAdapterInfo():{});g="지원 · "+([f.vendor,f.architecture,f.description].filter(Boolean).join(" ")||"정보 없음")+" · f16 "+(a.features&&a.features.has("shader-f16")?"O":"X")+" · 버퍼 "+Math.round((a.limits.maxBufferSize||0)/1048576)+"MB"}else g="navigator.gpu 있음, 어댑터 없음"}catch(e){g="오류: "+e.message}}r.push("WebGPU: "+g);
try{if(navigator.storage&&navigator.storage.estimate){const s=await navigator.storage.estimate();r.push("저장 공간 한도: "+(s.quota/1073741824).toFixed(1)+"GB")}}catch(e){}
openMd({t:"온디바이스 AI 점검",b:"이 화면을 캡처해서 보내 주면, 폰 안에서 언어모델을 돌릴 방법을 정할 수 있어요.",h:`<div class="card log" style="font-size:12.5px">${r.map(esc).join("<br>")}</div>`,o:[["닫기","n"]]})};

// ---- layout: header divider while scrolled ----
if(typeof addEventListener==="function"){let s0=false;addEventListener("scroll",()=>{const s=scrollY>4;if(s!==s0){s0=s;const e=document.querySelector(".top");if(e)e.classList.toggle("sc",s)}},{passive:true})}

// ---- v18/v19: 폰 안 AI — llama.cpp on the phone's CPU ----
// In the app (1.8+) the engine is native: llama.cpp's llama-server runs as its own process on the phone's big cores
// (multi-threaded, ARM dot-product / int8-matrix kernels). Android's WebView keeps WebAssembly on one core, so the
// WebAssembly engine (wllama) is only the web fallback. GPU offload is gone: on this phone's GPU it either crashed the
// app (llama.cpp) or produced garbage (WebLLM). Models are GGUF files from Hugging Face, downloaded once and kept on the
// device. The model only rephrases facts the built-in advisor computed; each first start runs a short self-test, and
// generation stops as soon as text turns to noise.
const WLL="3.6.1",LMS=[["exaone","한국어 특화 · EXAONE 4.0 1.2B (추천)","약 0.8GB","LGAI-EXAONE/EXAONE-4.0-1.2B-GGUF","EXAONE-4.0-1.2B-Q4_K_M.gguf","LG 라이선스 · 개인·비상업 사용","exaone4",812437792],
["exaone24","더 똑똑함 · EXAONE 3.5 2.4B (앱 전용)","약 1.6GB","LGAI-EXAONE/EXAONE-3.5-2.4B-Instruct-GGUF","EXAONE-3.5-2.4B-Instruct-Q4_K_M.gguf","LG 라이선스 · 개인·비상업 사용","exaone",1644918272],
["qwen","범용 · Qwen2.5 1.5B","약 1.1GB","Qwen/Qwen2.5-1.5B-Instruct-GGUF","qwen2.5-1.5b-instruct-q4_k_m.gguf","Apache 2.0","qwen2",1117320736]];
const LAI={st:"off",p:0,msg:"",w:null,lib:null,mod:"",spd:"",out:"",ac:null,nat:null,eng:"",th:0,log:"",ok:{},rq:0,wake:0,cut:0,fast:1,sp:null,freq:null,tune:null,tb:0};
const zz=ms=>new Promise(r=>setTimeout(r,ms));
// native engine present? (app 1.8+: the AndroidLM bridge and the packaged llama-server)
const lmNat=()=>{if(LAI.nat===null){try{LAI.nat=typeof window!=="undefined"&&!!window.AndroidLM&&JSON.parse(AndroidLM.info()).bin===true}catch(e){LAI.nat=false}}return LAI.nat};
const nInfo=()=>JSON.parse(AndroidLM.info());
const lmList=()=>lmNat()?LMS:LMS.filter(x=>x[0]!=="exaone24");
const lmId=()=>{const v=uiP("r17lm",LMS[0][0]);return lmList().some(x=>x[0]===v)?v:LMS[0][0]};
const lmOf=id=>LMS.find(x=>x[0]===id)||LMS[0];
const lmShort=M=>M[1].split(" · ")[1].replace(/ \(.*\)$/,"");
const lmUrl=M=>(typeof window!=="undefined"&&window.__LMURL||"https://huggingface.co/")+M[3]+"/resolve/main/"+M[4];
const aiNm=()=>S.aiP==="local"?"폰 안 AI":aiName();
const aiLive=()=>S.aiP==="local"?LAI.st==="ready":aiOn();
const lmIso=()=>typeof self!=="undefined"&&self.crossOriginIsolated===true;
const WLB=()=>typeof window!=="undefined"&&window.__WLB?window.__WLB:typeof location!=="undefined"&&location.host==="appassets.androidplatform.net"?"./wllama/":"https://cdn.jsdelivr.net/npm/@wllama/wllama@"+WLL+"/esm/";
const lmCores=()=>{if(!LAI.cores){try{LAI.cores=lmNat()?nInfo().cores:(typeof navigator!=="undefined"&&navigator.hardwareConcurrency)||4}catch(e){LAI.cores=4}}return LAI.cores};
// core clocks from the app (kHz per core); big cores = every core faster than the slowest cluster (8-core phones: 6 of 8)
const lmFreq=()=>{if(!LAI.freq){try{LAI.freq=lmNat()&&nInfo().freq||[]}catch(e){LAI.freq=[]}}return LAI.freq};
const lmKnown=()=>{const f=lmFreq();return f.length===lmCores()&&f.every(x=>x>0)};
const lmBig=()=>{const c=lmCores();if(!lmKnown())return c>=8?6:Math.max(2,c-2);const f=lmFreq(),lo=Math.min(...f),n=f.filter(x=>x>lo).length;return n>=2?n:c};
// the t fastest cores as a hex affinity mask, so the little cores never hold a step back ("" = the system places threads)
const lmMask=t=>{const c=lmCores();if(t>=c||!lmKnown())return"";let m=0;for(const[,i]of lmFreq().map((x,i)=>[x,i]).sort((a,b)=>b[0]-a[0]||b[1]-a[1]).slice(0,t))m+=Math.pow(2,i);return m.toString(16)};
const lmAutoTh=()=>Math.min(uiP("r18best",0)||lmBig(),lmCores());
const lmAutoTb=()=>Math.min(uiP("r18bestb",0)||lmBig(),lmCores());
const lmThreads=()=>{const v=uiP("r18th",0);return v>0?Math.min(v,lmCores()):lmAutoTh()};
// reading the question is compute-bound and may want more cores than writing the answer (memory-bound)
const lmThreadsB=()=>{const v=uiP("r18th",0);return v>0?Math.min(v,lmCores()):lmAutoTb()};
const lmFull=()=>lmKnown()?(Math.pow(2,lmCores())-1).toString(16):"";
// last measured speed per model and core count, kept across launches: g = writing, p = reading the question (tokens/s)
const lmSp=()=>{if(!LAI.sp)LAI.sp=uiP("r18sp",{})||{};return LAI.sp};
const lmSpSet=(id,th,tb,g,p)=>{const s=lmSp();s[id+"|"+th]={g:Math.round(g*10)/10};if(p>0)s[id+"|b"+tb]={p:Math.round(p)};uiS("r18sp",s)};
const lmSpd=(id,th,tb)=>{const s=lmSp(),g=s[id+"|"+th],b=s[id+"|b"+tb];return g?b&&b.p?" · 쓰기 "+g.g+" · 읽기 "+b.p+" 토큰/초":" · "+g.g+" 토큰/초":""};
async function laiLib(){if(!LAI.lib)LAI.lib=await import(WLB()+"index.js");return LAI.lib}
const mb=b=>Math.round(b/1048576);
function laiLine(){const id=lmId(),M=lmOf(id);if(LAI.st==="loading")return Math.round(LAI.p*100)+"% · "+LAI.msg;
if(LAI.st==="ready"&&LAI.mod===id)return"✅ 준비 완료 · "+lmShort(M)+" · "+(LAI.nat?"네이티브 CPU "+LAI.th+"코어"+(LAI.eng==="libllamasrv8.so"?" (i8mm)":"")+lmSpd(id,LAI.th,LAI.tb):"CPU "+(LAI.w&&LAI.w.isMultithread()?lmThreads()+"코어":"1코어")+(LAI.spd?" · "+LAI.spd:""));
return LAI.st==="err"?"⚠ "+LAI.msg:LAI.msg||"아직 켜지 않았어요"}
function laiUI(){const e=$("laip");if(e)e.textContent=laiLine()}
// noise check: two or more unrelated scripts, or too few Korean/Latin/digit characters
function laiBad(t){const s=String(t||"").replace(/\s/g,"");if(s.length<16)return false;let n=0;for(const r of[/[一-鿿]/,/[Ѐ-ӿ]/,/[؀-ۿ]/,/[฀-๿]/,/[぀-ヿ]/,/[ऀ-ॿ]/,/[֐-׿]/])if(r.test(s))n++;
const ok=(s.match(/[가-힣ㄱ-ㅎ0-9A-Za-z.,%()·\-:;!?~'"\/+×…*#→]/g)||[]).length;return n>=2||(s.length>=30&&ok/s.length<.8)}
const laiClean=t=>String(t||"").replace(/<(think|thought)>[\s\S]*?(<\/\1>|$)/g,"").replace(/\[\|[a-z_]+\|\]/g,"").trim();
const LSYS="너는 주식·M&A 게임의 참모야. 반드시 자연스러운 한국어(해요체)로만, 4~6문장으로 짧게 답해. 주어진 사실에 있는 숫자와 회사만 쓰고 새로 지어내지 마.";
const lmBody=(p,o)=>Object.assign({messages:[{role:"system",content:LSYS},{role:"user",content:String(p).slice(0,2400)}],max_tokens:o.max||300,temperature:.5,top_p:.9,top_k:40,stream:true,chat_template_kwargs:{enable_thinking:false}},typeof window!=="undefined"&&window.__LMX||{});

// ---- native engine (app) ----
async function natChat(p,onText,o){o=o||{};if(!LAI.nat||!(LAI.st==="ready"||o.test))throw{code:"local"};
LAI.cut=0;const q=Object.assign(lmBody(p,o),{repeat_penalty:1.08,cache_prompt:true,return_progress:true}),id=AndroidLM.ask(JSON.stringify(q)),t0=Date.now();LAI.rq=id;let r={t:"",d:false,e:""},v="",w="";
try{for(;;){await zz(90);r=JSON.parse(AndroidLM.poll(id));v=laiClean(r.t);if(laiBad(v)){AndroidLM.cancel(id);setTimeout(()=>{try{AndroidLM.poll(id)}catch(e){}},2000);throw{code:"garbage",out:v}}
// until the first word, show that the question is being read (with how far, when the engine reports it)
if(onText){if(v)onText({text:v});else{const sec=Math.floor((Date.now()-t0)/1000),x=sec>=1?"📖 질문 읽는 중… "+sec+"초"+(r.pp>0&&r.pp<1?" ("+Math.round(r.pp*100)+"%)":""):"";if(x&&x!==w){w=x;onText({text:x})}}}if(r.d)break}}
finally{LAI.rq=0}
if(r.e){if(LAI.cut){LAI.cut=0;throw{code:"paused"}}let i=null;try{i=nInfo()}catch(e){}if(i&&!i.run&&LAI.st==="ready"){LAI.st="err";LAI.msg="엔진이 멈췄어요 (코드 "+i.exit+"). 다시 켜 주세요.";LAI.log=i.log.split("\n").slice(-8).join("\n");render()}throw new Error(r.e)}
if(r.s>0){LAI.spd=r.s.toFixed(1)+" 토큰/초";lmSpSet(LAI.mod,LAI.th,LAI.tb,r.s,r.n>=48?r.p:0)}return v}
// wait while the model is downloaded or moved; returns the last info()
async function natWaitDl(fn){for(;;){const i=nInfo(),d=i.dl;if(d.n!==fn||(d.st!=="run"&&d.st!=="scan"))return i;
LAI.p=d.t?d.d/d.t:0;LAI.msg=d.st==="scan"?"전에 받은 모델을 찾는 중…":d.from==="web"?mb(d.d)+" / "+mb(d.t)+"MB 전에 받은 모델을 옮기는 중":mb(d.d)+" / "+mb(d.t)+"MB 받는 중 (처음 한 번만)";laiUI();await zz(400)}}
async function natWaitUp(){const t0=Date.now();for(;;){const i=nInfo(),el=Date.now()-t0;if(i.up||!i.run||el>150000)return i;LAI.p=Math.min(.95,el/8000);LAI.msg="모델을 여는 중… "+Math.round(el/1000)+"초"+(el>10000&&i.herr?" ("+i.herr.slice(0,80)+")":"");laiUI();await zz(250)}}
async function natLoad(quiet,bench){const id=lmId(),M=lmOf(id),fn=M[4];LAI.st="loading";LAI.p=0;LAI.msg="엔진 준비 중…";LAI.out="";LAI.log="";LAI.spd="";render();
try{let i=nInfo();
if(!i.files.some(f=>f.n===fn)){
if(i.dl.st==="run"||i.dl.st==="scan"){if(i.dl.n!==fn)throw new Error("다른 모델을 받는 중이에요. 끝나면 다시 눌러 주세요.")}
else AndroidLM.adopt(fn,M[6]);
i=await natWaitDl(fn);
if(!i.files.some(f=>f.n===fn)){if(i.free<M[7]+(200<<20))throw new Error("저장 공간이 부족해요. 약 "+(M[7]/1e9+.2).toFixed(1)+"GB가 필요해요.");
if(!AndroidLM.download(lmUrl(M),fn))throw new Error("다운로드를 시작하지 못했어요.");i=await natWaitDl(fn);
if(i.dl.st!=="done"||!i.files.some(f=>f.n===fn))throw new Error(i.dl.st==="idle"?"다운로드를 취소했어요.":"다운로드 실패: "+i.dl.e+" (와이파이를 확인하고 다시 눌러 주세요. 이어서 받아요.)")}}
await natRun(id,lmThreads(),lmThreadsB());
if(!LAI.ok[id]||bench){LAI.msg="자가 진단 중…";laiUI();const t=await natChat("인사를 한국어 한 문장으로 해 줘.",null,{max:40,test:1});LAI.out=t.slice(0,60);if(!t||laiBad(t))throw{code:"garbage",out:t};LAI.ok[id]=1}
LAI.st="ready";LAI.msg="";if(!quiet)toast("🧠 폰 안 AI 준비 완료");laiWebDrop(M)}
catch(e){natFail(e)}render()}
// (re)start the server for model id on th cores; returns info() once it answers
async function natRun(id,th,tb){tb=tb||th;const fn=lmOf(id)[4],mk=lmMask(th),mkb=lmMask(tb)||(mk?lmFull():""),go=f=>JSON.parse(AndroidLM.start(fn,th,tb,3072,f,mk,mkb));let r=go(LAI.fast===1);if(!r.ok)throw new Error(r.e);let i=await natWaitUp();
// the int8-matrix build failed to start on this CPU: fall back to the plain dot-product build once
if(!i.up&&r.eng==="libllamasrv8.so"&&!i.run){LAI.fast=0;r=go(false);if(!r.ok)throw new Error(r.e);i=await natWaitUp()}
if(!i.up){try{AndroidLM.stop()}catch(e){}throw{code:"dead",exit:i.exit,log:(i.herr?"health: "+i.herr+"\n":"")+i.log}}
LAI.mod=id;LAI.th=th;LAI.tb=tb;LAI.eng=i.eng;return i}
function natFail(e){const g=e&&e.code==="garbage";try{AndroidLM.stop()}catch(z){}LAI.st="err";LAI.out=g?String(e.out||"").slice(0,60):"";
LAI.msg=g?"자가 진단 실패 (답이 깨짐). 다른 모델을 골라 보세요.":e&&e.code==="dead"?"엔진을 켜지 못했어요 (코드 "+e.exit+")":String(e&&e.message||e).slice(0,200);
LAI.log=e&&e.log?String(e.log).split("\n").slice(-8).join("\n"):""}
// speed tuning: run the same short answer on a few core counts and keep the fastest for this phone (≈5–10 s each)
const LBENCH="주식 투자에서 분산 투자가 왜 중요한지 두 문장으로 설명해 줘.";
// a real advisor question (the facts the game computed), so reading speed is measured at a realistic length
function lmBenchQ(){try{return lmCompact("질문: 내 상황을 요약해 줘\n게임이 계산한 사실:\n"+qaTxt(qaAnswer("내 상황 요약").h)+"\n"+qaTxt(qaAnswer("경제 전망은?").h))}catch(e){return LBENCH}}
G.laiTune=async()=>{if(LAI.st==="loading"||!lmNat())return;const id=lmId(),M=lmOf(id);let i;try{i=nInfo()}catch(e){return}
if(!i.files.some(f=>f.n===M[4]))return toast("먼저 ‘모델 받기 / 켜기’로 모델을 받아 주세요");
const c=lmCores(),cand=[...new Set([4,lmBig(),c])].filter(n=>n>=2&&n<=c).sort((a,b)=>a-b),bq=lmBenchQ(),res={},rd={};LAI.st="loading";LAI.tune=null;LAI.out="";LAI.log="";render();
try{for(let k=0;k<cand.length;k++){const t=cand[k],h="속도 측정 "+(k+1)+"/"+cand.length+" · "+t+"코어";LAI.p=k/cand.length;LAI.msg=h+" 켜는 중";laiUI();await natRun(id,t,t);
LAI.msg=h+"로 읽고 쓰는 중";laiUI();const out=await natChat(bq,null,{max:48,test:1});if(!out||laiBad(out))throw{code:"garbage",out};const s=lmSp(),g=s[id+"|"+t],b=s[id+"|b"+t];res[t]=g?g.g:0;rd[t]=b?b.p:0}
const top=o=>+Object.keys(o).sort((a,b)=>o[b]-o[a])[0],best=top(res),rb=top(rd),bestb=rd[rb]>0&&rd[best]<rd[rb]*.97?rb:best;
uiS("r18best",best);uiS("r18bestb",bestb);uiS("r18th",0);LAI.tune={id,res,rd,best,bestb};
if(LAI.th!==best||LAI.tb!==bestb){LAI.p=.95;LAI.msg="가장 빠른 설정으로 켜는 중";laiUI();await natRun(id,best,bestb)}
LAI.ok[id]=1;LAI.st="ready";LAI.msg="";toast("⚡ 쓰기 "+best+"코어 · 읽기 "+bestb+"코어가 가장 빨라요")}
catch(e){natFail(e)}render()};

// ---- WebAssembly engine (web, or the app without the native engine) ----
async function laiChat(p,onText,o){o=o||{};const w=LAI.w;if(!w)throw{code:"local"};const ac=new AbortController();LAI.ac=ac;let t="",tm=null;
const q=Object.assign(lmBody(p,o),{penalty_repeat:1.08,abortSignal:ac.signal});
try{const s=await w.createChatCompletion(q);for await(const c of s){const d=c.choices&&c.choices[0]&&c.choices[0].delta;t+=d&&d.content||"";if(c.timings)tm=c.timings;const v=laiClean(t);if(laiBad(v)){try{ac.abort()}catch(z){}throw{code:"garbage",out:v}}if(onText)onText({text:v})}}
catch(e){if(e&&e.code)throw e;if(e&&(e.name==="AbortError"||/abort/i.test(String(e))))throw{code:"garbage",out:laiClean(t)};throw e}finally{LAI.ac=null}
if(tm&&tm.predicted_per_second)LAI.spd=tm.predicted_per_second.toFixed(1)+" 토큰/초";return laiClean(t)}
async function webLoad(quiet){const id=lmId();if(LAI.w&&LAI.mod===id&&LAI.st==="ready")return quiet||toast("이미 준비돼 있어요");
LAI.st="loading";LAI.p=0;LAI.msg="엔진을 불러오는 중…";LAI.out="";LAI.spd="";LAI.log="";render();if(laiWipeOnce())await zz(1500);
try{if(LAI.w){try{await LAI.w.exit()}catch(e){}LAI.w=null}try{if(navigator.storage&&navigator.storage.persist)await navigator.storage.persist()}catch(e){}
const m=await laiLib(),w=new m.Wllama({default:WLB()+"wasm/wllama.wasm"},{parallelDownloads:3}),M=lmOf(id),tst=typeof window!=="undefined"&&window.__LMTEST;
const prm={n_ctx:2048,n_threads:lmThreads(),n_gpu_layers:0,jinja:true,progressCallback:({loaded,total})=>{LAI.p=total?loaded/total:0;LAI.msg=mb(loaded)+" / "+mb(total)+"MB 받는 중 (처음 한 번만)";laiUI()}};
if(tst)await w.loadModelFromUrl(tst.url,prm);else await w.loadModelFromHF({repo:M[3],file:M[4]},prm);
LAI.w=w;LAI.mod=id;LAI.msg="자가 진단 중…";laiUI();const t=await laiChat("인사를 한국어 한 문장으로 해 줘.",null,{max:40});LAI.out=t.slice(0,60);if(!t||laiBad(t))throw{code:"garbage",out:t};
LAI.st="ready";LAI.msg="";if(!quiet)toast("🧠 폰 안 AI 준비 완료")}
catch(e){const g=e&&e.code==="garbage";if(LAI.w){try{await LAI.w.exit()}catch(z){}}LAI.w=null;LAI.out=g?String(e.out||"").slice(0,60):"";
LAI.st="err";LAI.msg=g?"자가 진단 실패 (답이 깨짐)":"오류: "+String(e&&e.message||e).slice(0,200)}render()}

G.laiLoad=async(quiet,bench)=>{if(LAI.st==="loading")return;if(uiP("r17gpu",0))uiS("r17gpu",0);if(!lmNat())return webLoad(quiet);
// already running this model on these cores: nothing to do (a restart would cut an answer that is being written)
if(!bench&&LAI.st==="ready"&&LAI.mod===lmId()&&LAI.th===lmThreads()&&LAI.tb===lmThreadsB()){try{if(nInfo().up)return quiet||toast("이미 준비돼 있어요")}catch(e){}}return natLoad(quiet,bench)};
// the system prompt already carries the instructions, so the phone model only gets the question and the facts (shorter prompt = faster first word)
const lmCompact=p=>{p=String(p);const i=p.indexOf("질문:");return(i>0?p.slice(i):p).slice(0,lmNat()?1500:1100)};
{const l0=llm;llm=async function(p,onText,json){if(S.aiP!=="local")return l0(p,onText,json);const t=await(LAI.nat?natChat:laiChat)(lmCompact(p),onText);return json?JSON.parse(t.replace(/^\s*```(json)?/,"").replace(/```\s*$/,"")):t}}
const laiErr=e=>e&&e.code==="local"?"폰 안 AI가 아직 켜지지 않았어요. 설정 › AI 설정에서 켜 주세요.":e&&e.code==="garbage"?"답이 이상해서 멈췄어요. 설정에서 다른 모델을 골라 보세요.":e&&e.code==="paused"?"앱이 뒤로 가서 답을 멈췄어요. 다시 물어봐 주세요.":S.aiP==="local"?"폰 안 AI 오류: "+String(e&&e.message||e).slice(0,140):aiErr(e);
{const p0=G.aiP;G.aiP=v=>{if(v!=="local")return p0(v);S.aiP="local";S.ai=0;aiTxt={};toast("AI: 폰 안 AI");render();laiWake()}}
G.laiPick=k=>{uiS("r17lm",k);if(LAI.st!=="loading"&&LAI.mod!==k&&(LAI.st==="ready"||LAI.st==="switch")){LAI.st="switch";LAI.msg="다른 모델을 골랐어요. ‘모델 받기 / 켜기’를 눌러 주세요."}else if(LAI.st==="err"){LAI.st="off";LAI.msg=""}render()};
G.laiTh=n=>{uiS("r18th",n);if(LAI.st==="ready")G.laiLoad(false,true);else render()};
G.laiStop=()=>{try{AndroidLM.cancelDownload()}catch(e){}};
// safety net: if the native engine cannot run on this phone, the slower WebAssembly engine still can (for this session)
G.laiWeb=()=>{LAI.nat=false;LAI.st="off";LAI.log="";G.laiLoad()};
G.laiOff=()=>{try{if(LAI.nat)AndroidLM.stop()}catch(e){}LAI.st="off";LAI.msg="껐어요. 질문하면 다시 켜져요.";render()};
async function laiCache(){const m=await laiLib();return new m.CacheManager()}
const lmHit=(e,M)=>String(e.metadata&&e.metadata.originalURL||e.name).includes(M[4]);
// the web engine's copy of a model the native engine now has in app storage (app 1.7 kept it in the page's storage)
async function laiWebDrop(M){if(!stApp())return;try{const cm=await laiCache();for(const e of await cm.list())if(!M||lmHit(e,M))await cm.delete(e.name)}catch(e){}}
G.laiDel=async()=>{const M=lmOf(lmId());try{let n=0;if(LAI.nat){if(AndroidLM.del(M[4]))n++;if(LAI.mod===M[0]){LAI.st="off";LAI.mod=""}LAI.ok[M[0]]=0}
else if(LAI.w&&LAI.mod===M[0]){try{await LAI.w.exit()}catch(e){}LAI.w=null;LAI.st="off"}
if(!LAI.nat||stApp()){try{const cm=await laiCache();for(const e of await cm.list())if(lmHit(e,M)){await cm.delete(e.name);n++}}catch(e){if(!LAI.nat)throw e}}
LAI.msg=n?"받은 모델을 지웠어요.":"지울 모델이 없어요.";if(n)toast("🧹 모델을 지웠어요")}catch(e){LAI.msg="지우지 못했어요: "+String(e&&e.message||e).slice(0,120)}render()};
G.laiClean=async()=>{let n=0;try{const M=lmOf(lmId());if(LAI.nat)n+=AndroidLM.clean(M[4]);
try{const cm=await laiCache();for(const e of await cm.list())if(LAI.nat||!lmHit(e,M)){await cm.delete(e.name);n++}}catch(e){if(!LAI.nat)throw e}
LAI.msg=n?"다른 모델 "+n+"개를 지웠어요.":"지울 다른 모델이 없어요."}catch(e){LAI.msg="정리하지 못했어요: "+String(e&&e.message||e).slice(0,120)}render()};
// asking while the model sits on the device but is not running starts it quietly
async function laiWake(){if(!S||S.aiP!=="local"||LAI.st!=="off")return;try{const M=lmOf(lmId());if(lmNat()){if(nInfo().files.some(f=>f.n===M[4]))G.laiLoad(true);return}
if(!stApp())return;const cm=await laiCache();if((await cm.list()).some(e=>lmHit(e,M)))G.laiLoad(true)}catch(e){}}
function laiPanel(){const id=lmId(),web=!stApp(),M=lmOf(id),nat=lmNat(),busy=LAI.st==="loading",rdy=LAI.st==="ready"&&LAI.mod===id;let inf=null;try{if(nat)inf=nInfo()}catch(e){}
const dl=inf&&inf.dl,have=!!inf&&inf.files.some(f=>f.n===M[4]),th=uiP("r18th",0),cores=nat?lmCores():0,tn=LAI.tune&&LAI.tune.id===id?LAI.tune:null;
return `<div class="mu" style="margin:8px 0 4px;line-height:1.6">${nat?"폰의 CPU 큰 코어 여러 개로 llama.cpp를 직접 돌려요(네이티브 엔진).":"폰의 CPU로 llama.cpp 언어모델을 직접 돌려요."} 처음 한 번 와이파이로 받은 뒤에는 인터넷 없이 무료·무제한이에요. 참모가 계산한 사실만 풀어 말하게 해서 숫자를 지어내지 않아요.${web?"<br><span class='wr'>웹(claude.ai)에서는 한 코어만 써서 느리고 다운로드가 막힐 수 있어요. 앱(APK)에서 써 주세요.</span>":!nat?"<br><span class='wr'>이 앱에는 네이티브 엔진이 없어서 느린 웹 엔진으로 돌아요. 최신 APK로 업데이트해 주세요.</span>":""}</div>
<div class="ch" style="flex-wrap:wrap">${lmList().map(([k,t,z])=>B(t+" · "+z,`G.laiPick('${k}')`,k===id?"on":"",busy)).join("")}</div>
<div class="mu" style="margin-top:4px">${esc(M[5])} · 엔진 ${nat?"네이티브 · CPU "+cores+"코어 중 "+(lmThreads()===lmThreadsB()?lmThreads()+"개 사용":"쓰기 "+lmThreads()+"개 · 읽기 "+lmThreadsB()+"개 사용"):lmIso()?"멀티코어 가능":"단일 코어(느림)"}</div>
${nat?`<div class="ch" style="flex-wrap:wrap;margin-top:6px"><span class="mu" style="align-self:center">코어</span>${[[0,"자동("+lmAutoTh()+(lmAutoTb()!==lmAutoTh()?"·"+lmAutoTb():"")+")"]].concat([...new Set([4,lmBig(),6,8])].filter(n=>n<=cores).sort((a,b)=>a-b).map(n=>[n,String(n)])).map(([n,t])=>B(t,`G.laiTh(${n})`,th===n?"on":"",busy)).join("")}</div>
<div class="mu" style="margin-top:2px">자동은 큰 코어만 써요. ‘속도 최적화’를 누르면 답을 쓸 때와 질문을 읽을 때 가장 빠른 코어 수를 이 폰에서 직접 재서 맞춰요(1분쯤).</div>
${tn?`<div class="mu" style="margin-top:4px;line-height:1.6">쓰기: ${Object.keys(tn.res).map(t=>t+"코어 "+tn.res[t]).join(" · ")} 토큰/초 → ${tn.best}코어${tn.rd&&Object.values(tn.rd).some(x=>x>0)?`<br>읽기: ${Object.keys(tn.rd).map(t=>t+"코어 "+tn.rd[t]).join(" · ")} 토큰/초 → ${tn.bestb}코어`:""}</div>`:""}`:""}
<div class="row" style="margin-top:8px"><span class="mu" id="laip" style="min-width:0">${esc(laiLine())}</span></div>
${LAI.out?`<div class="mu" style="margin-top:4px">자가 진단 답: “${esc(LAI.out)}”</div>`:""}
${LAI.log?`<pre class="mu" style="white-space:pre-wrap;word-break:break-all;font-size:11px;line-height:1.4;max-height:10em;overflow:auto;margin:6px 0 0">${esc(LAI.log)}</pre>`:""}
<div class="bs">${B(rdy?"준비됨":busy?"준비 중…":"모델 받기 / 켜기","G.laiLoad()","p",busy||rdy)}${nat&&busy&&dl&&dl.st==="run"?B("받기 취소","G.laiStop()"):""}${B("참모에게 물어보기","G.qaAsk('내 상황 요약')","",!rdy)}${nat&&have&&!busy?B("⚡ 속도 최적화","G.laiTune()"):""}${nat&&rdy?B("끄기","G.laiOff()"):""}${nat&&LAI.st==="err"&&stApp()?B("느린 웹 엔진으로 켜기","G.laiWeb()"):""}${B("이 모델 지우기","G.laiDel()","",busy)}${B("다른 모델 정리","G.laiClean()","",busy)}</div>
<div class="mu" style="margin-top:6px">${nat?"앱이 뒤로 가면 엔진을 잠시 끄고, 돌아오면 다시 켜요. ":""}처음 켤 때 짧은 자가 진단을 하고, 답이 깨지면 바로 멈춰요. 답을 만드는 동안 폰이 따뜻해질 수 있어요.</div>`}
// app lifecycle: free the CPU and memory while the game is in the background, and bring the model back on return
if(typeof window!=="undefined"){const p0=window.andPause,r0=window.andResume;
window.andPause=()=>{try{if(lmNat()&&LAI.st==="ready"){LAI.wake=1;if(LAI.rq)LAI.cut=1;AndroidLM.stop();LAI.st="off";LAI.msg="앱이 뒤로 가서 잠시 껐어요."}}catch(e){}if(p0)p0()};
window.andResume=()=>{if(r0)r0();try{if(LAI.wake){LAI.wake=0;if(S&&S.aiP==="local")setTimeout(()=>{if(LAI.st==="off")G.laiLoad(true)},300)}}catch(e){}}}
// one-time cleanup in the app: the page now runs on a new (isolated) origin, so storage from the old origin, including
// the WebGPU models from 1.5·1.6, can no longer be reached from the page. Wipe it once; saves live in app files and stay.
function laiWipeOnce(){try{if(stApp()&&Android.wipeOld&&!uiP("r17wiped",0)){uiS("r17wiped",1);Android.wipeOld();return true}}catch(e){}return false}
if(typeof setTimeout==="function"){setTimeout(laiWipeOnce,1500);setTimeout(()=>{try{if(lmNat())laiWake()}catch(e){}},2500)}

// ---- boot ----
const RM=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
document.querySelectorAll("#nav [data-t]").forEach(b=>b.onclick=()=>G.go(b.dataset.t));
$("mb").onclick=()=>G.menu($("mn").hidden?1:0);$("sb").onclick=()=>{G.menu(0);G.pg("search")};$("ent").onclick=()=>G.pickTE();buildMenu();
document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;const m=$("mn");if(m&&!m.hidden)G.menu(0);else if(!mdl&&(sel>=0||pg)&&pg!=="new")G.back()});
let boot1=0;
const stApp=()=>typeof window!=="undefined"&&window.Android&&typeof Android.load==="function";
function stGet(k){try{if(stApp()){const v=Android.load(k);if(v)return v}}catch(e){}try{return localStorage.getItem(k)}catch(e){return null}}
function stSet(k,v){try{if(stApp()&&Android.save(k,v))return true}catch(e){}try{localStorage.setItem(k,v);return true}catch(e){return false}}
async function loadStr(x){return migrate(x[0]==="{"?JSON.parse(x):await unpackS(x))}
let saving=0;async function save(){if(saving||!S)return;saving=1;try{stSet("raider7",await packS())}catch(e){}saving=0}
function saveNow(){try{if(stApp())stSet("raider7",JSON.stringify(S));else save()}catch(e){}}
function gameLoop(){if(S.over||!S.spd||mdl||pg==="new")return;S.acc+=S.spd/4;let n=0;const t0=Date.now();while(S.acc>=1&&n<40){S.acc-=1;n++;step();if(mdl||S.over)break;if(n>=4&&Date.now()-t0>170)break}if(S.acc>16)S.acc=16;if(mdl||S.over)render();else live()}
function bootRest(){if(!S){init(defCfg());boot1=1}v8fix();if(S.bgs)S.bgs=0;col();secUpd();
if(boot1){NG=defCfg();NG.first=1;pg="new";S.spd=0}
else if(S.ev&&EV[S.ev.id]){const e=EV[S.ev.id],c=S.co[S.ev.c];mdl={t:e.t,b:e.b.replace("{c}",c?c.tk+" "+c.n:"").replace("{x}",F(S.ev.x)),o:e.o,ev:1}}else if(S.ev2){evMd()}else if(S.tut<TUT.length&&!S.over){mdl=tutMd();if(S.spd){S.sp0=S.spd;S.spd=0}}
render();aiInit();tape();{const t=$("tkt");if(t&&t.addEventListener)t.addEventListener("animationiteration",tape)}
setInterval(gameLoop,250);setInterval(()=>save(),8000);document.addEventListener("visibilitychange",()=>{if(document.hidden)saveNow()});
if(typeof window!=="undefined"&&window.addEventListener)window.addEventListener("resize",()=>{if(pg==="chart")drawChart()})}
const BOOT=(async()=>{let x=null;try{x=stGet("raider7")||localStorage.getItem("raider6")}catch(e){}if(x){try{const s=await loadStr(x);if(s)S=s}catch(e){}}bootRest()})();

