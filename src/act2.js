// ---- actions part 2: management, M&A, lawsuits, events, AI, system ----
function rescale(c,f){for(const k of Object.keys(c.own))setOwn(c,k,c.own[k]*f)}
const ownerK=c=>{for(const k in c.own)if(c.own[k]>=99.9)return k;return null};
G.mg=(i,k,v)=>{const c=S.co[i];if(!mine(c))return toast("경영권이 있어야 합니다");
if(k==="pay"){c.pay=v;L(c.tk+" 배당성향 "+v*100+"%",1)}
else if(k==="g"){c.g=v;L(c.tk+" 성장률 "+Math.round(v*100)+"%",1)}
else if(k==="mgr"){c.cs-=2;c.mg=rnd()<.7?Math.min(3,c.mg+1+rnd()*1.5):c.mg-1;L(c.tk+" 경영진 교체 → 경영능력 "+c.mg.toFixed(1),1)}
else if(k==="rs"){const w=c.A*.05;c.A-=w;c.nol+=w;c.mg=Math.min(4,c.mg+1.5);L(c.tk+" 구조조정: "+F(w)+" 상각, 수익성 개선 기대",1)}
else if(k==="ceo"){S.ceo=S.ceo===i?-1:i;S.ceoD=S.day;L(S.ceo<0?"CEO에서 물러났습니다":c.tk+" CEO 취임 · 연봉 "+F(ceoSal(c))+" (회사가 매일 나눠 지급, 이익이 해마다 15% 넘게 늘면 연말 보너스)",1)}
else if(k==="iss"){if(c.priv)return toast("비상장 회사는 먼저 상장해야 해요");const f=v||.1,r=mc(c)*f*.95;c.cs+=r;eqCash(c,r);c.sh*=1+f;rescale(c,1/(1+f));c.p*=1-f*.3;L(c.tk+" 유상증자 "+F(r)+" 조달 (지분 희석)",1);afterCtl(c,"P")}
else if(k==="xd"){const a=Math.max(0,eq(c)*.4);c.D+=a;payDiv(c,a);L(c.tk+" 차입 특별배당 "+F(a)+" (내 몫 세후 "+F(a*(c.own.P||0)/100*.6)+"). 부채 급증!",1)}
else if(k==="bb"){if(c.priv)return;const n=Math.min(v||5,pub(c)-1);if(n<=0)return toast("시장에 남은 물량이 없습니다");const x=mc(c)*n/100*1.05;if(!ePay(i,x))return toast(c.tk+" 자금 부족: 필요 "+F(x));eqCash(c,-x);c.sh*=1-n/100;rescale(c,1/(1-n/100));c.p*=1.03;L(c.tk+" 자사주 "+n.toFixed(1)+"% 매입·소각 ("+F(x)+")",1);ctlAll()}
else if(k==="sw"){c.sweep=c.sweep===2?1:2;toast(c.sweep===2?"남는 현금으로 부채를 자동 상환합니다":"현금을 쌓아 인수 자금으로 씁니다")}
else if(k==="pill"){if(!ePay(i,5))return toast("5억이 필요합니다");c.pill=S.day+180;L(c.tk+" 포이즌 필 발동 (180일간 적대적 매집·공개매수 차단)",1)}
render()};
G.spin=(i,t)=>{const c=S.co[i],x=S.co[t],p=x.own["c"+i]||0;if(!mine(c)||p<=0)return;const v=hv(x,p),b=x.bs["c"+i]||0;setOwn(x,"c"+i,0);
for(const k of Object.keys(c.own)){if(k==="c"+t)continue;setOwn(x,k,(x.own[k]||0)+p*c.own[k]/100);x.bs[k]=(x.bs[k]||0)+b*c.own[k]/100}
if(x.priv&&held(x)<99.9){x.priv=0;x.p=Math.max(60,Math.max(eq(x),1)*1e4/x.sh*1.2);x.tg=x.p}
c.p*=Math.max(.3,1-v/Math.max(1,mc(c))*.9);c.tg=c.p;L(c.tk+"가 보유한 "+x.tk+" 지분 "+p.toFixed(1)+"%를 주주에게 나눠 줬습니다 (스핀오프)",1);ctlAll();render()};
function mQuote(a,t,prem){const ao=t.own["c"+a.id]||0,pv=mc(t)*(1+prem/100),nv=(100-ao)/100*pv,N=nv*1e4/a.p,ns=a.sh+N;let my=0;
for(const k in a.own)if(root(k)==="P")my+=a.own[k]*a.sh/ns;for(const k in t.own)if(k!=="c"+a.id&&root(k)==="P")my+=t.own[k]/100*pv*1e4/a.p/ns*100;
let ap=Math.max(0,Math.min(1,(prem-5-cres(t))/30));if(mc(t)>mc(a)*1.5)ap*=.4;if(rating(a)>=5)ap*=.2;let oth=0;for(const k in t.own)if(root(k)!=="P")oth+=t.own[k];
const op=prem>25?Math.min(1,(prem-25)/40):0;return{nv,N,my,yes:grp(t,"P")+pub(t)*ap+oth*op,ap,op}}
G.merge=(t,prem)=>{const e=teOK(),x=S.co[t];if(e==="P")return toast("거래 주체를 내가 지배하는 상장사로 바꿔야 합니다");const a=S.co[e];
if(a.priv)return toast("비상장 회사는 합병 주체가 될 수 없어요");if(x.dead||x.priv||x===a)return;
const q=mQuote(a,x,prem);let yes=grp(x,"P")+pub(x)*q.ap*(.85+rnd()*.3);for(const k in x.own)if(root(k)!=="P"&&rnd()<q.op)yes+=x.own[k];
const anti=S.imm<S.day&&!mine(x)&&x.i!==HOLD&&myShare(x.i)+share(x)>.5&&rnd()<.5,gov=rnd()<(a.kd===1&&x.kd===1?.6:.06);
if(yes<=50||anti||gov){const f=mc(x)*.005;a.cs-=f;if(a.cs<0){a.D-=a.cs;a.cs=0}L(x.tk+" 합병 실패"+(anti?" (독점금지 당국 차단)":gov?" (정부 승인 거부)":" (찬성 "+Math.min(100,yes).toFixed(0)+"%)")+", 자문 비용 "+F(f),1);return render()}
settleX(x,1+prem/100);const ns=a.sh+q.N,adds={};
for(const k in x.own)if(k!=="c"+a.id)adds[k]=[x.own[k]/100*mc(x)*(1+prem/100)*1e4/a.p/ns*100,x.bs[k]||0];
for(const k of Object.keys(x.own))if(k!=="c"+a.id)setOwn(x,k,0);rescale(a,a.sh/ns);a.sh=ns;
for(const k in adds){setOwn(a,k,(a.own[k]||0)+adds[k][0]);a.bs[k]=(a.bs[k]||0)+adds[k][1]}
absorb(a,x,q.nv,0);a.p*=.97;S.fl.mg=1;S.st.ma++;eco("🧬 "+a.tk+"가 "+x.tk+" "+x.n+" 흡수합병 (프리미엄 "+prem+"%)");ctlAll();rec("합병",x,q.nv);
L("합병 완료! "+a.tk+" 내 그룹 지분 "+grp(a,"P").toFixed(1)+"%"+(mine(a)?"":" — 경영권을 잃었습니다!"),1);render()};
function vote(c,prem){if(prem<20+cres(c)&&rnd()<.7)return"주주 거부";if(topRival(c,"P")>=10&&prem<35)return"외부 대주주 반대";if(S.imm<S.day&&!mine(c)&&c.i!==HOLD&&myShare(c.i)+share(c)>.5&&rnd()<.5)return"독점금지 당국 차단";if(c.pill>S.day&&!mine(c))return"포이즌 필";return""}
G.tender=(i,prem,lbo)=>{const c=S.co[i],e=teOK(),bk=eKey(e);if(c.priv||c.dead)return;if(e===i)return toast("자기 회사는 공개매수할 수 없어요");
if(lbo&&c.kd)return toast("은행·보험사는 LBO로 인수할 수 없어요");const own=c.own[bk]||0,P=mc(c)*(1+prem/100)*(100-own)/100,need=lbo?P*.3:P;if(eAvail(e)<need)return toast("자금 부족: 필요 "+F(need)+", "+eName(e)+" 가용 "+F(eAvail(e)));
const why=vote(c,prem);if(why){const f=mc(c)*.01;ePay(e,Math.min(f,eAvail(e)));L(c.tk+(lbo?" LBO":" 공개매수")+" 실패 ("+why+"), 수수료 "+F(f),1);return render()}
ePay(e,need);if(lbo){c.gw+=Math.max(0,mc(c)*(1+prem/100)-eq(c));const lb=P*.7;c.D+=lb;acqAdd(c,"lD",lb)}settleX(c,1+prem/100);
for(const k of Object.keys(c.own)){if(k===bk)continue;payK(c,k,c.own[k]/100*mc(c)*(1+prem/100));setOwn(c,k,0)}
setOwn(c,bk,100);c.bs[bk]=(c.bs[bk]||0)+need;c.priv=1;c.pt=S.day;c.p*=1+prem/100*.6;S.fl.tn=1;if(lbo)S.fl.lb=1;ctlAll();rec(lbo?"LBO":"공개매수",c,need);
L(c.tk+(lbo?" LBO 성공! 인수가의 70%를 회사 부채로 떠안겼습니다":" 공개매수 성공! 100% 비상장 자회사로 전환")+" ("+eName(e)+" 명의, "+F(need)+")",1);render()};
G.gm=i=>{const c=S.co[i],e=teOK(),k=eKey(e),own=c.own[k]||0;if(c.priv||own<8||mine(c))return toast("경영권이 없는 회사에 지분 8% 이상이 있어야 합니다");
if(rnd()<Math.min(.8,own/25)){const pr=mc(c)*own/100*1.25;c.cs-=pr;if(c.cs<0){c.D-=c.cs;c.cs=0}eqCash(c,-pr);const net=payK(c,k,pr);setOwn(c,k,0);c.sh*=1-own/100;rescale(c,1/(1-own/100));S.fl.gm=1;rec("그린메일",c,pr);L(c.tk+" 그린메일 성공! 지분 "+own.toFixed(1)+"%를 프리미엄 25%에 넘기고 "+F(net)+" 수령",1);ctlAll()}
else{ePay(e,Math.min(3,eAvail(e)));S.heat+=3;L(c.tk+" 그린메일 거절 — 소송비 3억",1)}render()};
G.ipoMy=i=>{const c=S.co[i],k=ownerK(c);if(!c.priv||!k||root(k)!=="P")return toast("내 그룹이 100% 가진 비상장 회사만 상장할 수 있어요");if(c.sz>S.day)return toast("시즈닝 기간입니다. 설립 후 1년 반이 지나야 상장할 수 있어요 ("+(c.sz-S.day)+"일 남음)");if(S.day-(c.pt||0)<180)return toast("인수·설립 후 180일이 지나야 상장할 수 있어요 ("+(180-(S.day-c.pt))+"일 남음)");
c.p=ipoPx(c);c.tg=c.p;c.priv=0;const net=sellK(c,k,40,mc(c)/100*.93);if(c.fo)S.fl.ip=1;rec("상장",c,net,hName(k));L("🔔 "+c.tk+" 상장! 지분 40%를 팔아 "+F(net)+" 확보 ("+hName(k)+")",1);ctlAll();render()};
G.liq=i=>{const c=S.co[i],k=ownerK(c);if(!c.priv||!k||root(k)!=="P")return toast("내 그룹이 100% 가진 비상장 회사만 청산할 수 있어요");
if(k==="P"){const x=c.A*.88+c.cs+pfv(c)*.97-c.D;if(x<0)return toast("부채가 자산보다 많아 청산할 수 없어요");const net=payK(c,"P",x);setOwn(c,"P",0);rec("청산",c,x,"나");kill(c,1,1);S.fl.lq=1;L(c.tk+" 청산: 세후 "+F(net)+" 회수",1)}
else{const h=S.co[+k.slice(1)],same=h.i===c.i,nol=c.nol;absorb(h,c,-hv(c,100),0);if(same)h.nol+=nol*.5;S.fl.lq=1;L(c.tk+"를 "+h.tk+"에 흡수 청산했습니다 (비과세"+(same?", 이월결손금 전액 승계":"")+")",1)}sel=-1;render()};
G.sue=(t,ty)=>{const e=teOK(),x=S.co[t];if(e==="P")return toast("소송은 내 회사를 거래 주체로 골라야 걸 수 있어요");const a=S.co[e];if(x.dead||x===a)return;
if(x.lit>S.day)return toast("이 회사와는 이미 소송 중입니다 ("+(x.lit-S.day)+"일 남음)");
if(ty==="at"){if(a.i!==x.i)return toast("독점금지 소송은 같은 업종 회사에만 걸 수 있어요");if(share(x)<.2)return toast("업종 점유율 20% 이상인 회사만 대상이 됩니다");
if(!ePay(e,3))return toast("소송비 3억이 필요합니다");x.lit=S.day+90;if(rnd()<Math.max(.1,Math.min(.7,share(x)*1.2-.1))){const d=x.A*.02;x.cs-=d;if(x.cs<0){x.D-=x.cs;x.cs=0}a.cs+=d;x.p*=.95;S.fl.lw=1;L("⚖ "+a.tk+" 독점금지 소송 승소! "+x.tk+"에게서 손해배상 "+F(d),1)}else{ePay(e,Math.min(3,eAvail(e)));L("⚖ "+a.tk+" 독점금지 소송 패소, 추가 비용 3억",1)}}
else{if(!ePay(e,2))return toast("소송비 2억이 필요합니다");x.lit=S.day+60;x.p*=.96;x.tg*=.98;S.heat+=3;if(rnd()<.25){ePay(e,Math.min(5,eAvail(e)));S.heat+=5;L("⚖ "+x.tk+"가 맞소송! "+a.tk+" 배상 5억",1)}else L("⚖ "+x.tk+" 상대 괴롭힘 소송으로 주가 압박",1)}render()};
G.rumor=i=>{const c=S.co[i];if(c.dead||c.priv)return;if(S.day-c.rm<60)return toast("이 회사엔 60일 안에 다시 쓸 수 없어요");c.rm=S.day;c.p*=.94;c.tg*=.97;S.heat+=8;
if(rnd()<.35){S.cash-=5;S.heat+=10;toast("루머 유포 적발! 벌금 5억, 주목도 +18")}else toast(c.tk+" 루머로 주가 하락 (주목도 +8)");render()};
G.evPick=o=>{const ev=S.ev;S.ev=null;closeMd();if(!ev)return render();const c=ev.c>=0?S.co[ev.c]:null,x=ev.x,y=o==="buy",no=()=>{toast("현금이 부족해 무산됐습니다");render()};
if(c&&c.dead)return render();
if(ev.id==="ins"){if(y){if(!ePay("P",x))return no();c.surp=.3;S.heat+=25;L("🤫 "+c.tk+" 내부 정보 입수: 약 "+((c.off-S.day%90+90)%90)+"일 뒤 실적 서프라이즈",1)}else S.hon++}
else if(ev.id==="brb"){if(y){if(!ePay("P",x))return no();S.imm=S.day+360;S.heat+=30;L("1년 동안 독점 규제를 피할 수 있습니다",1)}else S.hon++}
else if(ev.id==="cook"){if(y){c.cook=1;S.heat+=35;L(c.tk+" 다음 실적을 '조정'하기로 했습니다",1)}else S.hon++}
else if(ev.id==="pr"){if(y){if(!ePay("P",x))return no();c.p*=.85;c.tg*=.92;S.heat+=15;L(c.tk+" 악성 기사 보도, 주가 급락",1)}else S.hon++}
else if(ev.id==="front"){if(y){c.cs+=x;S.heat+=20;L(c.tk+" 선행매매로 "+F(x)+" 추가 이익",1)}else S.hon++}
else if(ev.id==="gift"){if(y){if(!ePay("P",x))return no();if(rnd()<.6){S.heat=Math.max(0,S.heat-30);L("접대가 통했습니다. 주목도 하락",1)}else{S.heat+=25;L("접대 시도가 들통났습니다! 주목도 급등",1)}}}
else if(ev.id==="strike"){if(y){c.mg-=.5;L(c.tk+" 임금 인상 합의",1)}else if(rnd()<.5){c.A*=.97;c.p*=.9;L(c.tk+" 파업 강행! 생산 차질, 주가 하락",1)}else L(c.tk+" 노조가 물러섰습니다",1)}
else if(ev.id==="bail"&&y){c.cs+=x;eqCash(c,x);c.sh/=.7;rescale(c,.7);L(c.tk+" 구제금융 "+F(x)+" 수령, 신주 발행",1);ctlAll()}
render()};
const upAI=(id,t)=>{const e=$(id);if(e)e.textContent=t};
// ---- AI providers: rule (free, built in) / claude (artifact sample) / gemini (own API key, works outside claude.ai) ----
const gK=()=>{try{return localStorage.getItem("r7gk")||""}catch(e){return""}};
const gM=()=>{try{return localStorage.getItem("r7gm")||"gemini-3.5-flash-lite"}catch(e){return"gemini-3.5-flash-lite"}};
const aiOn=()=>S.aiP==="claude"?!!AI:S.aiP==="gemini";
const aiName=()=>S.aiP==="claude"?"Claude":S.aiP==="gemini"?"제미나이":"규칙 기반";
async function llm(p,onText,json){
if(S.aiP==="claude"){if(!AI)throw{code:"na"};if(json)return AI.json(p,{modelTier:"quick",cache:false});const r=await AI(p,{modelTier:"quick",onText});return r.text}
if(S.aiP==="gemini"){const k=gK();if(!k)throw{code:"nokey"};let r;
try{r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(gM())+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":k},body:JSON.stringify({contents:[{parts:[{text:p}]}],generationConfig:json?{responseMimeType:"application/json"}:{}})})}catch(e){throw{code:"blocked"}}
if(!r.ok)throw{code:"http",status:r.status};const d=await r.json(),t=((d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts)||[]).map(x=>x.text||"").join("");
if(onText)onText({text:t});return json?JSON.parse(t.replace(/^\s*```(json)?/,"").replace(/```\s*$/,"")):t}
throw{code:"off"}}
const aiErr=e=>!e?"AI 호출에 실패했습니다.":e.code==="blocked"?"claude.ai 안에서는 외부 AI(제미나이) 연결이 막혀 있어요. 앱(APK) 버전에서 작동합니다.":e.code==="nokey"?"설정에서 제미나이 API 키를 넣어 주세요.":e.code==="http"?"제미나이 응답 오류 ("+e.status+"). 키와 모델 이름을 확인하세요.":e.code==="not_granted"?"AI 사용 권한이 거절되었습니다.":e.code==="na"?"이 환경에서는 Claude를 쓸 수 없습니다.":e.code==="off"?"설정에서 AI를 켜 주세요.":"AI 호출에 실패했습니다. 잠시 후 다시 시도하세요.";
function ruleRep(c){const eps=epsT(c),per=eps>0?c.p/eps:0,up=c.tg/c.p-1,r=rating(c),sec=S.co.filter(x=>x.i===c.i&&!x.dead&&!x.priv&&epsT(x)>0),sp=sec.length?sec.reduce((a,x)=>a+x.p/epsT(x),0)/sec.length:0,
gap=S.dg[c.i]-S.cg[c.i],tr=topRival(c,"P"),need=Math.max(0,Math.max(20,tr+1)-grp(c,"P")),cost=need>0&&!c.priv?cost1(c,Math.max(.1,Math.min(need,pub(c)-c.sp-4))):0,dy=c.pay*Math.max(0,c.ni)*4/Math.max(1,mc(c))*100;
return[`투자의견 ${up>.15?"매수":up<-.1?"매도":"중립"} · 목표주가 ${W(c.tg)} (${P1(up*100)})`,
`밸류: PER ${per?per.toFixed(1):"적자"}${sp?" (업종 평균 "+sp.toFixed(1)+")":""}, 배당수익률 ${dy.toFixed(1)}%.`,
`재무: 신용 ${RT[r]}, 부채/자본 ${(c.D/Math.max(1,eq(c))).toFixed(2)}, 현금 ${F(c.cs)} (시총의 ${(c.cs/Math.max(1,mc(c))*100).toFixed(0)}%).`,
c.kd?`업황: 금융업은 금리와 경기에 민감합니다. 기준금리 ${S.prime.toFixed(1)}%.`:`업황: 수요 성장 ${(S.dg[c.i]*100).toFixed(1)}% vs 설비 증가 ${(S.cg[c.i]*100).toFixed(1)}% → ${gap>.005?"공급 부족, 마진 개선":gap<-.005?"공급 과잉, 마진 압박":"균형"}.${c.ni<c.pni?" 직전 분기보다 이익 감소.":" 이익 증가 추세."}`,
mine(c)?`경영: 내 그룹 ${grp(c,"P").toFixed(1)}%로 지배 중. 외부 최대 그룹 ${tr.toFixed(1)}%${tr>grp(c,"P")-8?" — 경영권 방어가 필요합니다.":"."}`:`인수: 경영권까지 약 ${need.toFixed(1)}%p, 예상 비용 ${F(cost)}. 외부 최대 그룹 ${tr.toFixed(1)}%${c.pill>S.day?", 포이즌 필 발동 중":""}.`].join("\n")}
function brief(){const w=nw(),out=[],my=S.co.filter(mine);
if(S.loan>w*2)out.push("⚠ 개인 대출이 순자산의 "+(S.loan/Math.max(1,w)).toFixed(1)+"배입니다. 3배를 넘으면 마진콜이 옵니다. 일부 상환을 권합니다.");
const th=my.filter(c=>!c.priv&&topRival(c,"P")>grp(c,"P")-8);if(th.length)out.push("🛡 경영권 위협: "+th.slice(0,3).map(c=>c.tk+" (내 "+grp(c,"P").toFixed(0)+"% vs 외부 "+topRival(c,"P").toFixed(0)+"%)").join(", ")+". 지분을 늘리거나 포이즌 필을 쓰세요.");
const ins=S.co.filter(c=>!c.dead&&!c.priv&&!mine(c)&&c.cs>mc(c)*.4).sort((a,b)=>b.cs/mc(b)-a.cs/mc(a)).slice(0,3);if(ins.length)out.push("💰 현금 많은 인수 후보 (현금/시총): "+ins.map(c=>c.tk+" "+(c.cs/mc(c)*100).toFixed(0)+"%").join(", ")+". 경영권을 잡으면 그 현금으로 다음 인수를 할 수 있어요.");
const uv=S.co.filter(c=>!c.dead&&!c.priv&&!mine(c)&&c.ni>0).sort((a,b)=>a.p/a.tg-b.p/b.tg).slice(0,3);out.push("📉 저평가 상위: "+uv.map(c=>c.tk+" (목표가 대비 "+P1((c.tg/c.p-1)*100)+")").join(", "));
const hot=INDS.map(i=>[SEC[i][0],S.dg[i]-S.cg[i]]).sort((a,b)=>b[1]-a[1]);out.push("🏭 업황 좋은 업종: "+hot.slice(0,2).map(x=>x[0]).join(", ")+" / 나쁜 업종: "+hot.slice(-2).map(x=>x[0]).join(", "));
out.push(my.length?"🏢 내 그룹 현금 "+F(my.reduce((a,c)=>a+c.cs,0))+". 거래 주체를 현금 많은 회사로 바꿔 인수 자금으로 쓰세요.":"🎯 첫 목표: 시총이 작은 회사의 지분 20% 이상을 사서 경영권을 잡으세요. 보험사는 현금이 많아 좋은 첫 지주회사입니다.");
{const bb=S.co.filter(b=>mine(b)&&b.kd===1);if(bb.length){const n=S.co.filter(x=>!x.dead&&!mine(x)&&bb.some(b=>b.id===x.ln)&&rating(x)>=4&&eq(x)>0).length;if(n)out.push("🏦 내 은행 대출 고객 중 신용 BB 이하 "+n+"곳 — 대출 회수로 흔들어 헐값 매물을 만들 수 있어요.")}}{const dh=S.co.filter(c=>!c.dead&&(c.own.P||0)>=5&&c.pay>0).length;if(dh>=3&&!S.co.some(c=>mine(c)&&c.i===HOLD))out.push("🏛 배당 받는 직접 지분이 "+dh+"곳이에요. 지주회사를 세워 현물출자하면 배당에 세금(40%)이 붙지 않습니다.")}if(S.heat>30)out.push("🚔 감독원 주목도 "+S.heat.toFixed(0)+". 위험한 제안은 당분간 거절하세요.");
if(S.mx){const e=MXE.find(x=>x.id===S.mx.id);out.push("🌐 진행 중인 국면: "+e.n+" (남은 "+S.mx.q+"분기)")}
const rv=S.R.map((r,i)=>[r.n,rnw(i)]).sort((a,b)=>b[1]-a[1])[0];if(rv)out.push("🏁 선두 라이벌: "+rv[0]+" "+F(rv[1])+" (내 순자산 "+F(w)+")");return out.join("\n\n")}
G.aiRep=async i=>{const c=S.co[i];if(!aiOn())return toast(aiErr({code:S.aiP==="claude"?"na":"off"}));if(busy)return toast("AI가 다른 요청을 처리 중입니다");busy=1;aiTxt[i]="분석 중…";upAI("air",aiTxt[i]);const eps=epsT(c);
const p="너는 가상 주식시장 게임 속 증권사 애널리스트야. 아래 가상 기업 데이터를 보고 한국어로 짧은 리포트를 써. 형식: 첫 줄에 투자의견(매수/중립/매도)과 목표주가, 이어서 근거 3줄, 마지막 줄에 경영권 인수 관점 한 줄. 250자 이내. 실존 기업과 연결하지 마.\n"+
`종목 ${c.tk} ${c.n}, 업종 ${SEC[c.i][0]}, 주가 ${W(c.p)}, 적정가 추정 ${W(c.tg)}, 시총 ${F(mc(c))}, PER ${eps>0?(c.p/eps).toFixed(1):"적자"}, 사업자산 ${F(c.A)}, 현금 ${F(c.cs)}, 부채 ${F(c.D)}, 자본 ${F(eq(c))}, 신용 ${RT[rating(c)]}, 분기순이익 ${F(c.ni)}, 성장률 ${Math.round(c.g*100)}%, 배당성향 ${c.pay*100}%, 업종점유율 ${(share(c)*100).toFixed(0)}%, 업종 수요성장 ${(S.dg[c.i]*100).toFixed(1)}% vs 설비증가 ${(S.cg[c.i]*100).toFixed(1)}%, 경영권 ${rootName(c.ctl)}, 외부 최대 그룹 지분 ${topRival(c,"P").toFixed(0)}%, 기준금리 ${S.prime.toFixed(1)}%`;
try{aiTxt[i]=await llm(p,u=>{aiTxt[i]=u.text;upAI("air",u.text)})}catch(e){aiTxt[i]=aiErr(e)}finally{busy=0;upAI("air",aiTxt[i])}};
G.aiAsk=async()=>{if(S.aiP==="rule"){aiTxt.ask=brief();return upAI("aia",aiTxt.ask)}const q=($("aq")||{}).value||"";if(!q.trim())return toast("질문을 입력하세요");if(!aiOn())return toast(aiErr({code:"na"}));if(busy)return toast("AI가 다른 요청을 처리 중입니다");busy=1;aiQ=q;aiTxt.ask="생각 중…";upAI("aia",aiTxt.ask);
const my=S.co.filter(mine).slice(0,12).map(c=>c.tk+"("+SEC[c.i][0]+", 그룹지분 "+grp(c,"P").toFixed(0)+"%, 시총 "+F(mc(c))+", 현금 "+F(c.cs)+", 신용 "+RT[rating(c)]+")").join(", ")||"없음";
const hd=S.co.filter(c=>c.own.P&&!c.dead).sort((a,b)=>val(b)-val(a)).slice(0,10).map(c=>c.tk+" "+c.own.P.toFixed(1)+"%").join(", ")||"없음";
const p="너는 Wall $treet Raider 방식 기업 인수 게임에서 플레이어의 전략 참모야. 규칙 요약: 지분 20% 이상이면서 최대 그룹이면 경영권, 지배 회사 지분은 그룹 표로 합산, 개인 대출이 순자산 3배를 넘으면 마진콜, 공개매수·LBO·주식교환 합병·그린메일·창업·상장·청산·스핀오프·소송 가능, 업종 수요가 설비 증가보다 빠르면 마진 개선, 개인 배당세 40%·양도세 22%·법인세 35%. 아래 상태를 보고 질문에 한국어로 6문장 이내로, 구체적인 종목과 행동을 들어 답해. 현실 투자 조언이 아니라 게임 전략이야.\n"+
`날짜 ${ds()}, 순자산 ${F(nw())}, 현금 ${F(S.cash)}, 개인대출 ${F(S.loan)} (추가 한도 ${F(pRoom())}), 기준금리 ${S.prime.toFixed(1)}%, GDP ${S.gdp.toFixed(1)}%, 감독원 주목도 ${S.heat.toFixed(0)}, 지배 회사: ${my}, 직접 보유: ${hd}\n참고 브리핑:\n${brief()}\n질문: ${q}`;
try{aiTxt.ask=await llm(p,u=>{aiTxt.ask=u.text;upAI("aia",u.text)})}catch(e){aiTxt.ask=aiErr(e)}finally{busy=0;upAI("aia",aiTxt.ask)}};
// ---- system: navigation, modal, saves ----
let mcb=null;
function openMd(o){mdl=o;if(S.spd){S.sp0=S.spd;S.spd=0}render()}
function closeMd(){mdl=null;mcb=null;if(S.sp0!=null){S.spd=S.sp0;S.sp0=null}const m=$("md");if(m)m.hidden=true}
function ask(t,b,yes,f){openMd({t,b,o:[["취소","n"],[yes,"y"]]});mcb=f}
const tutMd=()=>{const t=TUT[Math.min(S.tut,TUT.length-1)];return{t:t[0],b:t[1],tut:1,o:[["건너뛰기","skip"],[S.tut<TUT.length-1?"다음 ("+(S.tut+1)+"/"+TUT.length+")":"시작하기","next"]]}};
G.mk=n=>{const m=mdl;if(!m)return;const v=m.o[n][1];if(m.ev)return G.evPick(v);if(m.ev2)return G.ev2Pick(v);if(m.bsx){closeMd();if(v==="bk")return G.book("bsw");return render()}
if(m.tut){if(v==="next"&&S.tut<TUT.length-1){S.tut++;mdl=tutMd();return render()}S.tut=99;closeMd();return render()}const f=mcb;closeMd();if(f&&v==="y")f();render()};
G.pickTE=()=>{const my=S.co.filter(mine).sort((a,b)=>eAvail(b.id)-eAvail(a.id)).slice(0,40),r=(e,t,s)=>`<div class="sr" onclick="G.setTE(${e==="P"?"'P'":e})"><div><b>${t}</b><div class="mu">${s}</div></div><span class="mu">${S.te===e?"선택됨":"›"}</span></div>`;
openMd({t:"거래 주체 선택",b:"누구의 돈으로 거래할지 고르세요. 회사를 고르면 그 회사의 현금과 대출 한도로 주식을 사고, 합병·소송·창업을 그 회사 명의로 합니다.",
h:r("P","나 (개인)","현금 "+F(S.cash)+" · 대출 여력 "+F(pRoom()))+my.map(c=>r(c.id,esc(c.tk)+" "+esc(c.n),"현금 "+F(c.cs)+" · 대출 여력 "+F(cRoom(c))+" · 그룹지분 "+grp(c,"P").toFixed(0)+"%")).join("")+(my.length?"":`<p class="mu">아직 경영권을 가진 회사가 없습니다. 회사를 직접 세워도 돼요.</p>`)+`<div class="bs" style="margin-top:10px">${B("⇆ 자금 이동","G.mvOpen()")}${B("＋ 회사 설립","G.fdOpen()")}</div>`,o:[["닫기","n"]]})};
G.spd=v=>{S.spd=v;S.sp0=null;render()};
G.go=t=>{tab=t;sel=-1;pg="";render();scrollTo(0,0)};G.pick=i=>{sel=i;render()};G.pg=p=>{pg=p;sel=-1;render()};G.back=()=>{const r=pg==="chart"&&CH.ret!=null&&S.co[CH.ret]&&!S.co[CH.ret].dead?CH.ret:-1;pg="";sel=r;CH.ret=null;render()};
G.flt=i=>{fl=i;lim=120;render()};G.srt=()=>{so=(so+1)%6;render()};G.tf=v=>{tf=v;lim=120;render()};G.more=()=>{lim+=120;render()};G.seg=v=>{mseg=v;render()};
G.col=()=>{S.us=S.us?0:1;col();render()};G.cheat=()=>{S.cheat=S.cheat?0:1;render()};
G.ai=()=>{if(!aiOn())return toast(aiErr({code:S.aiP==="claude"?"na":"off"}));S.ai=S.ai?0:1;if(S.ai)aiTick(true);render()};
G.q=v=>{$("sr").innerHTML=srch(v)};
G.sv=async n=>{try{const t=await packS();if(!stSet("r6s"+n,t))throw 0;stSet("r6m"+n,JSON.stringify({d:ds(),w:Math.round(nw())}));toast("슬롯 "+n+"에 저장했습니다")}catch(e){toast("저장 실패: 저장 공간이 부족합니다")}render()};
G.ld=async n=>{try{const x=stGet("r6s"+n);if(!x)return toast("빈 슬롯입니다");const s=await loadStr(x);if(!s||!Array.isArray(s.co)||!s.co.length)return toast("호환되지 않는 저장 데이터입니다");await rsCommit(s,0);toast("슬롯 "+n+"을 불러왔습니다")}catch(e){toast("불러오기에 실패했습니다")}try{render()}catch(e){}};   // RT-SAVE-ATOMIC-01: all or nothing
let NG=null,ngPrev=0,mnT=0;
G.reset=()=>G.newGame();
G.newGame=()=>{NG=JSON.parse(JSON.stringify(S&&S.cfg||defCfg()));NG.tut=0;NG.first=0;ngPrev=S?S.spd:0;if(S)S.spd=0;sel=-1;pg="new";G.menu(0);render()};
G.ng=(k,v)=>{const n=NG;if(!n)return;
if(k==="df"){n.df=v;n.cash=DIF[v].cash}
else if(k==="nr"){n.nr=v;while(n.rv.length<v){const u=new Set(n.rv.map(x=>x[0])),f=RIV.filter(x=>!u.has(x[0]));if(!f.length)break;n.rv.push(f[rnd()*f.length|0].slice())}}
else if(k==="rr")n.rv=RIV.map(x=>x.slice()).sort(()=>rnd()-.5).slice(0,8);
else if(k==="rt"){const r=n.rv[v];r[1]=RTK[(RTK.indexOf(r[1])+1)%RTK.length]}
else n[k]=v;render()};
G.start=()=>{const c=NG;if(!c)return;NG=null;init(c);sel=-1;pg="";tab="h";shKey="";aiTxt={};if(S.tut<TUT.length){mdl=tutMd();S.sp0=S.spd;S.spd=0}render();scrollTo(0,0)};
G.ngCancel=()=>{NG=null;pg="";if(S)S.spd=ngPrev;render()};
G.menu=o=>{const m=$("mn");if(!m)return;clearTimeout(mnT);try{document.documentElement.classList.toggle("mnlk",!!o)}catch(e){}if(o){m.hidden=false;m.scrollTop=0;requestAnimationFrame(()=>requestAnimationFrame(()=>m.classList.add("open")));$("mb").classList.add("rot")}
else{if(m.hidden)return;m.classList.remove("open");$("mb").classList.remove("rot");mnT=setTimeout(()=>{m.hidden=true},240)}};
G.mgo=k=>{G.pg(k);G.menu(0)};
G.aiP=v=>{S.aiP=v;if(v==="rule")S.ai=0;aiTxt={};toast("AI: "+aiName());render()};
G.gkey=()=>{const k=($("gk")||{}).value||"",m=($("gm")||{}).value||"";try{localStorage.setItem("r7gk",k.trim());localStorage.setItem("r7gm",m.trim()||"gemini-3.5-flash-lite");toast("이 브라우저에만 저장했습니다")}catch(e){toast("저장할 수 없습니다")}render()};
G.gtest=async()=>{if(busy)return;busy=1;toast("제미나이 연결을 확인하는 중…");const prev=S.aiP;S.aiP="gemini";try{const t=await llm("한 단어로만 답해: 안녕");toast("연결 성공: "+String(t).slice(0,20))}catch(e){toast(aiErr(e))}finally{S.aiP=prev;busy=0}};
const hof=()=>{try{return JSON.parse(localStorage.getItem("r6hof")||"[]")}catch(e){return[]}};
function hofAdd(why){const h=hof();h.push({d:ds(),w:Math.round(nw()),r:RK[S.rank][0],df:S.df,why});h.sort((a,b)=>b.w-a.w);try{localStorage.setItem("r6hof",JSON.stringify(h.slice(0,10)))}catch(e){}}
G.retire=()=>ask("은퇴하기","순자산 "+F(nw())+"으로 명예의 전당에 기록하고 이 게임을 끝냅니다.","은퇴",()=>{hofAdd("은퇴");S.hofd=1;S.over=3;S.spd=0});
G.help=()=>{tab="h";S.tut=0;openMd(tutMd())};

// ---- v8 actions: corporate finance, banking powers, assets, productivity, autopilot, screener ----
let stab="o",lbId=-1,nf=0;const scf0=()=>({sec:-1,tier:-1,per:0,cash:0,rt:9,ext:100,ctl:"all",sort:0});let scf=scf0();

G.stab=t=>{stab=t;render();const s=$("sh");if(s)s.scrollTop=0};
G.ps=(i,v)=>{const c=S.co[i];if(!mine(c)||c.kd)return;c.ps=v;L(c.tk+" "+PSN(c.i)+" 연 "+v+"% (사업자산 대비)",1);render()};
G.ap=i=>{const c=S.co[i];if(!mine(c))return;c.ap=c.ap?0:1;if(c.ap)autop(c);toast(c.tk+" 자동 경영 "+(c.ap?"켜짐":"꺼짐"));render()};
G.apAll=()=>{S.apAll=S.apAll?0:1;render()};
// RT-AUTO-UX-01: explicit bulk actions only (never automatic cash transfers, M&A, or new growth rules).
let autoPage=0;
G.autoPage=n=>{autoPage=Math.max(0,n|0);render()};
G.autoBulk=on=>{
  if(on!==0&&on!==1)return;
  const companies=S.co.filter(mine);
  let changed=0;
  for(const c of companies){if((!!c.ap)===(!!on))continue;
    c.ap=on;
    if(on)autop(c);
    changed++;
  }
  // RT-PREMERGE-FIX-01: 전체 ON/OFF acts on the companies held now; S.apAll (companies controlled later) is separate — say so when they differ
  toast("지배 회사 "+changed+"곳 자동경영 "+(on?"켜짐":"꺼짐")+(!on&&S.apAll?" · 앞으로 새로 지배하는 회사는 자동경영이 켜집니다 (설정에서 바꿀 수 있어요)":on&&!S.apAll?" · 앞으로 새로 지배하는 회사는 꺼진 상태로 시작합니다":""));render();
};
G.bissue=(i,f)=>{const c=S.co[i];if(!mine(c)||c.kd)return;if(c.bond>0)return toast("회사채는 한 번에 한 종류만 발행할 수 있어요. 먼저 상환하세요");const x=Math.max(0,eq(c))*f;if(x<5)return toast("자본이 작아 발행할 수 없어요");if(c.sz>S.day&&rating(c)>=4)return toast("시즈닝 기간에는 정크본드(BB 이하)를 낼 수 없어요 ("+(c.sz-S.day)+"일 남음)");
c.D+=x;const r=rating(c);c.cs+=x*.985;c.bond=x;c.cpn=S.prime+SPR[r]+1;c.bmat=S.day+3600;S.fl.bond=1;rec("회사채 발행",c,x);L(c.tk+" 회사채 "+F(x)+" 발행 (쿠폰 "+c.cpn.toFixed(1)+"%, 10년"+(r>=4?", 정크본드":"")+")",1);render()};
G.bcall=i=>{const c=S.co[i];if(!mine(c)||c.bond<=0)return;const px=Math.min(1.05,bd(c)*1.02),face=c.bond,cost=face*px;if(!ePay(i,cost))return toast(c.tk+" 자금 부족: 필요 "+F(cost));
if(c.bh){S.cash+=c.bh*px;c.bh=0}const g=face-cost;c.D-=face;if(g>0)c.nol=Math.max(0,c.nol-g);c.bond=0;c.cpn=0;rec("회사채 상환",c,cost);L(c.tk+" 회사채 "+F(face)+" 조기 상환 (가격 "+(px*100).toFixed(0)+")"+(g>0?" · 할인 매입 이익 "+F(g):""),1);render()};
G.pp=(i,pct)=>{const c=S.co[i],e=teOK();if(!mine(c)||c.priv)return;if(e===i)return toast("거래 주체를 나 또는 다른 내 회사로 바꾸세요");const N=c.sh*pct/(100-pct),cost=N*c.p*.98/1e4;if(!ePay(e,cost))return toast(eName(e)+" 자금 부족: 필요 "+F(cost));
const k=eKey(e);rescale(c,(100-pct)/100);setOwn(c,k,(c.own[k]||0)+pct);c.bs[k]=(c.bs[k]||0)+cost;c.sh+=N;c.cs+=cost;eqCash(c,cost);c.p*=.98;ctlAll();S.fl.pp=1;rec("사모증자",c,cost);L(c.tk+" 사모 유상증자: "+eName(e)+"에 신주 "+pct+"% 배정 ("+F(cost)+") → 내 그룹 "+grp(c,"P").toFixed(1)+"%",1);render()};
G.wk=(i,pct)=>{const c=S.co[i];if(!mine(c)||c.priv)return;const N=c.sh*pct/(100-pct),cost=N*c.p*.95/1e4,w=S.co.filter(x=>!x.dead&&!x.priv&&!x.ctl&&x.id!==i&&!x.kd&&x.cs>=cost&&!c.own["c"+x.id]).sort((a,b)=>b.cs-a.cs)[0];
if(!w)return toast("백기사를 맡을 만큼 현금 많은 중립 회사가 없습니다");w.cs-=cost;rescale(c,(100-pct)/100);setOwn(c,"c"+w.id,pct);c.bs["c"+w.id]=cost;c.sh+=N;c.cs+=cost;eqCash(c,cost);c.p*=.97;ctlAll();L(c.tk+" 백기사 "+w.tk+"에 신주 "+pct+"% 배정 ("+F(cost)+"). 라이벌 지분이 희석됩니다",1);render()};
G.advP=(i,x)=>{const c=S.co[i];if(!mine(c))return;if(!ePay("P",x))return toast("개인 자금 부족");c.pa=(c.pa||0)+x;c.D+=x;c.cs+=x;L("개인 자금 "+F(x)+"을 "+c.tk+"에 대여 (기준금리 이자)",1);render()};
G.advR=i=>{const c=S.co[i],x=Math.min(c.pa||0,c.cs);if(x<=0)return toast("회수할 대여금이나 회사 현금이 없습니다");c.pa-=x;c.D-=x;c.cs-=x;S.cash+=x;L(c.tk+" 대여금 "+F(x)+" 회수",1);render()};
G.asell=(i,f)=>{const c=S.co[i];if(!mine(c)||c.kd)return;const a=c.A*f;c.A-=a;c.cs+=a*.9;c.nol+=a*.1;rec("자산 매각",c,a*.9);L(c.tk+" 사업 자산 "+F(a)+" 매각 → 현금 "+F(a*.9)+" (매각 비용 10%)",1);render()};
G.fsBuy=k=>{const f=S.fs[k],e=teOK();if(!f)return;if(e==="P")return toast("같은 업종의 내 회사나 지주회사를 거래 주체로 고르세요");const c=S.co[e];if(c.i!==f.i&&c.i!==HOLD)return toast(SEC[f.i][0]+" 업종 회사나 지주회사만 살 수 있어요");
if(!ePay(e,f.px))return toast(c.tk+" 자금 부족: 필요 "+F(f.px));c.A+=f.A;S.fs.splice(k,1);if(c.i===HOLD){c.i=f.i;c.nol=0;c.ru=0;L(c.tk+" 지주회사가 "+SEC[f.i][0]+" 사업에 진출했습니다 (결손금 소멸)",1)}rec("자산 매입",c,f.px);L(c.tk+"가 "+f.s+"의 사업 자산 "+F(f.A)+"을 "+F(f.px)+"에 인수",1);render()};
G.lcall=(b,x)=>{const B0=S.co[b],c=S.co[x];if(!mine(B0)||B0.kd!==1)return toast("내가 지배하는 은행이어야 합니다");if(c.ln!==b)return toast("이 은행의 대출 고객이 아닙니다");if(mine(c))return toast("내 그룹 회사의 대출은 회수할 수 없어요");
if(rating(c)<4)return toast("신용 BBB 이상인 회사의 대출은 회수할 수 없어요");if(eq(c)<=0)return toast("자본잠식 상태라 법정관리 보호를 받습니다");if((c.lc||0)>S.day)return toast("최근에 회수했습니다 ("+(c.lc-S.day)+"일 뒤 가능)");
const p=callLoan(B0,c,.5);S.fl.call=1;L("🏦 "+B0.tk+" 은행이 "+c.tk+" 대출 "+F(p)+" 회수"+(c.dead?" — 결국 상장폐지":held(c)<.1?" — 법정관리 돌입":""),1);render()};
G.frz=(b,x)=>{const B0=S.co[b],c=S.co[x];if(!mine(B0)||c.ln!==b||mine(c))return;c.frz=c.frz?0:b+1;L(c.tk+" 신용 "+(c.frz?"동결":"동결 해제")+" ("+B0.tk+" 은행)",1);render()};
G.chbank=(i,b)=>{const c=S.co[i],B0=S.co[b];if(!mine(c)||!B0||B0.dead||B0.kd!==1||c.ln===b)return;if(B0.ctl==="?")return toast(B0.tk+" 은행은 지배권 판정 보류 중이라 새 거래 은행으로 고를 수 없어요");const fee=loanOf(c)*.005;c.cs-=fee;if(c.cs<0){c.D-=c.cs;c.cs=0}c.ln=b;c.frz=0;L(c.tk+" 거래 은행을 "+B0.tk+"(으)로 변경 (수수료 "+F(fee)+")",1);render()};
G.loanbook=b=>{lbId=b;sel=-1;pg="loan";render()};
G.sf=(k,v)=>{scf[k]=v;render()};
G.sfp=n=>{scf=Object.assign(scf0(),[{ext:10,ctl:"none",sort:1},{cash:50,sort:2},{per:12,rt:2,sort:3},{rt:-4,sort:2}][n]);render()};
G.misGo=()=>{const m=MIS[S.ms];if(!m)return;const g=m[4];if(g==="te")G.pickTE();else if(g==="m"||g==="e")G.go(g);else G.pg(g||"help")};
G.mh=()=>{S.mh=S.mh?0:1;render()};
G.nf=v=>{nf=v;render()};

// ---- v9 actions: founding wizard, rename, fund transfers ----
let FD=null,MV=null;
const nmOK=s=>/^[\w가-힣 &.\-]{1,18}$/.test(s),tkOK=s=>/^[A-Z0-9]{2,5}$/.test(s);
function fdName(s){const g=(S.gn||"").trim();return(g||KP[rnd()*KP.length|0])+(s===HOLD?"홀딩스":KS[s][rnd()*3|0])}
function fdTk(nm){const used=new Set(S.co.map(c=>c.tk)),base=nm.replace(/[^A-Za-z]/g,"").toUpperCase().slice(0,3);if(base.length<2)return tkGen(used);
for(let k=0;k<30;k++){const t=k?base+"ABCDEFGHJKLMNPRSTUVWXYZ"[rnd()*23|0]:base+"H";if(!used.has(t))return t}return tkGen(used)}
function fdInit(){const nm=fdName(HOLD),e=teOK();FD={nm,tk:fdTk(nm),sec:HOLD,cap:100,cty:0,fo:e!=="P"&&S.co[e].kd!==1?e:"P",pre:1,ed:0}}
G.fdOpen=()=>{fdInit();sel=-1;pg="fd";G.menu(0);closeMd();render()};
G.fdSet=(k,v)=>{if(!FD)fdInit();FD[k]=v;if(k==="sec"){if(!FD.ed){FD.nm=fdName(v);FD.tk=fdTk(FD.nm)}FD.cap=Math.max(FD.cap,fMin(v))}render()};
G.fdGo=()=>{const f=FD;if(!f)return;const n0=$("fdn"),t0=$("fdt"),c0=$("fdc");if(n0&&n0.value)f.nm=n0.value;if(t0&&t0.value)f.tk=t0.value;if(c0&&c0.value)f.cap=+c0.value;
const nm=String(f.nm||"").trim(),tk=String(f.tk||"").trim().toUpperCase(),cap=Math.round(+f.cap||0),fo=f.fo,s=f.sec;
if(!nmOK(nm))return toast("회사 이름은 1~18자 (한글·영문·숫자·공백·&.-)로 지어 주세요");if(!tkOK(tk))return toast("티커는 영문 대문자·숫자 2~5자로 정해 주세요");
if(S.co.some(c=>c.tk===tk))return toast("이미 쓰는 티커입니다: "+tk);if(cap<fMin(s))return toast("자본금은 최소 "+F(fMin(s))+"입니다");
if(!fdLeft())return toast("창업은 1년에 2개, 2년에 3개까지 할 수 있어요 (원작 규칙)");
if(fo!=="P"&&(!S.co[fo]||!mine(S.co[fo])||S.co[fo].kd===1))return toast("설립 주체는 나 또는 은행이 아닌 내 회사여야 합니다");
if(!ePay(fo,cap))return toast(eName(fo)+" 자금 부족: 필요 "+F(cap)+", 가용 "+F(eAvail(fo)));
const cost=fCost(s),E=cap-cost,c=addCo(mk(tk,nm,s,Math.max(10,cap),1));
if(s===12){c.A=E*9;c.cs=c.A*.08;c.D=c.A+c.cs-E}else if(s===13){c.A=E*5;c.cs=c.A*.25;c.D=c.A+c.cs-E}else if(s===HOLD){c.A=Math.max(.5,E*.01);c.cs=E-c.A;c.D=0}else{c.A=E*.85;c.cs=E*.15;c.D=0}
c.gw=0;c.sh=Math.max(10,E/2);c.p=Math.max(60,eq(c)*1e4/c.sh);c.tg=c.p;c.hist=[Math.round(c.p)];c.hl=[[c.hist[0],c.hist[0]]];c.dh=c.dl=c.p;c.ni=0;c.pni=0;
c.nol=cost;c.edge=isInd(s)?(rnd()-.45)*.008:0;c.mg=.5;c.vol=c.kd?.022:.035;c.ru=isInd(s)?6:0;c.cty=f.cty;c.sz=S.day+540;c.pt=S.day;c.fo=1;c.priv=1;c.pay=0;
const P=[[.2,2],[.06,1],[0,0]][f.pre]||[.06,1];c.g=s===HOLD?0:isFin(s)?.05:P[0];c.ps=isInd(s)?P[1]:0;
const k=eKey(fo);setOwn(c,k,100);c.bs[k]=cap;S.fd=(S.fd||[]).filter(d=>S.day-d<720);S.fd.push(S.day);S.fl.fd=1;if(s===HOLD)S.fl.hd=1;ctlAll(c.id);rec("회사 설립",c,cap,eName(fo));
L("🏗 "+eName(fo)+" 명의로 "+c.tk+" "+c.n+" 설립 · "+SEC[s][0]+" · "+CTRY[c.cty][0]+" 법인 · 자본금 "+F(cap)+" (설립 비용 "+F(cost)+")"+(s===HOLD?". 자금 이동에서 보유 주식을 현물출자하거나, 거래 주체를 이 회사로 바꿔 지분을 사 보세요":""),1);
FD=null;sel=c.id;stab="m";pg="";render()};
G.rename=i=>{const c=S.co[i];if(!mine(c))return;openMd({t:"이름·티커 변경",b:"법률 비용 1억이 회사 현금에서 나갑니다.",h:`<input class="in" id="rnn" maxlength="18" value="${esc(c.n)}" aria-label="회사 이름"><input class="in" id="rnt" maxlength="5" value="${esc(c.tk)}" aria-label="티커" style="text-transform:uppercase">`,o:[["취소","n"],["변경","y"]]});mcb=()=>G.renameGo(i)};
G.renameGo=i=>{const c=S.co[i],nm=String(($("rnn")||{}).value||"").trim(),tk=String(($("rnt")||{}).value||"").trim().toUpperCase();if(!mine(c))return;
if(!nmOK(nm))return toast("회사 이름은 1~18자로 지어 주세요");if(!tkOK(tk))return toast("티커는 영문 대문자·숫자 2~5자입니다");if(tk!==c.tk&&S.co.some(x=>x.tk===tk))return toast("이미 쓰는 티커입니다");
if(nm===c.n&&tk===c.tk)return;const o=c.tk;c.n=nm;c.tk=tk;c.cs-=1;if(c.cs<0){c.D-=c.cs;c.cs=0}rec("이름 변경",c,1);L(o+" → "+tk+" "+nm+" (이름 변경)",1);render()};
// ---- fund transfers between me and my companies (manual: capital contribution to 100% subs, advances, private offering, dividends) ----
function mvMethods(fr,to){const out=[];if(fr===to)return out;const T=to==="P"?null:S.co[to],Fc=fr==="P"?null:S.co[fr],fk=fr==="P"?"P":"c"+fr;
if(T){if((T.own[fk]||0)>=99.9)out.push(["cap","현금 출자"],["stk","주식 현물출자"]);if(fr==="P")out.push(["adv","대여"]);if(!T.priv)out.push(["pp","신주 인수"]);if(Fc&&(Fc.own["c"+T.id]||0)>0)out.push(["div","특별배당"])}
else if(Fc){if((Fc.pa||0)>0)out.push(["rec","대여금 회수"]);if((Fc.own.P||0)>0)out.push(["div","특별배당"])}return out}
function mvInit(i){const my=S.co.filter(mine).sort((a,b)=>b.cs-a.cs);MV={fr:"P",to:i!=null&&i!=="P"?i:my[0]?my[0].id:"P",how:"",amt:"",y:-1,f:1};mvFix()}
function mvFix(){const ok=e=>e==="P"||(S.co[e]&&mine(S.co[e]));if(!ok(MV.fr))MV.fr="P";if(!ok(MV.to))MV.to="P";const m=mvMethods(MV.fr,MV.to);if(!m.some(x=>x[0]===MV.how))MV.how=m[0]?m[0][0]:""}
G.mvOpen=i=>{mvInit(i);sel=-1;pg="xf";G.menu(0);closeMd();render()};
G.mvSet=(k,v)=>{if(!MV)mvInit();MV[k]=v;if(k==="fr"||k==="to"){MV.y=-1;MV.amt=""}if(k==="how")MV.amt="";mvFix();render()};
const mvSrc=()=>MV.how==="rec"?Math.min(S.co[MV.fr].pa||0,S.co[MV.fr].cs):eCash(MV.fr);
G.mvPct=p=>{MV.amt=String(Math.floor(mvSrc()*p/100*100)/100);render()};
G.mvGo=()=>{if(!MV)return;mvFix();const a0=$("mva");if(a0&&a0.value!=null&&a0.value!=="")MV.amt=a0.value;
const{fr,to,how}=MV,T=to==="P"?null:S.co[to],Fc=fr==="P"?null:S.co[fr],fk=fr==="P"?"P":"c"+fr,x=Math.round((+MV.amt||0)*100)/100;
if(!how)return toast("이 조합으로는 옮길 수 있는 방법이 없습니다");
if(how==="stk"){const Y=S.co[MV.y];if(!Y||Y.dead||Y===T)return toast("넘길 주식을 고르세요");const own=Y.own[fk]||0,p=own*MV.f,b=(Y.bs[fk]||0)*MV.f,tk2="c"+T.id;if(p<=0)return toast("보유 지분이 없습니다");
const v=hv(Y,p);setOwn(Y,fk,own-p);if(Y.own[fk])Y.bs[fk]-=b;setOwn(Y,tk2,(Y.own[tk2]||0)+p);Y.bs[tk2]=(Y.bs[tk2]||0)+b;T.bs[fk]=(T.bs[fk]||0)+b;ctlAll();S.fl.inc=1;rec("현물출자",Y,v,eName(fr));
L("주식 현물출자: "+eName(fr)+"의 "+Y.tk+" 지분 "+p.toFixed(1)+"% ("+F(v)+")를 "+T.tk+"로 이전. 세금 없음, 장부가 승계",1);MV.y=-1;return render()}
if(!(x>0))return toast("금액을 입력하세요");
if(how==="cap"){if(!ePay(fr,x))return toast(eName(fr)+" 자금 부족: 가용 "+F(eAvail(fr)));T.cs+=x;eqCash(T,x);T.bs[fk]=(T.bs[fk]||0)+x;rec("출자",T,x,eName(fr));L(eName(fr)+" → "+T.tk+" 현금 출자 "+F(x),1)}
else if(how==="adv"){if(!ePay("P",x))return toast("개인 자금 부족: 가용 "+F(eAvail("P")));T.pa=(T.pa||0)+x;T.D+=x;T.cs+=x;rec("대여",T,x,"나");L("개인 자금 "+F(x)+"을 "+T.tk+"에 대여 (기준금리 이자)",1)}
else if(how==="pp"){const N=x*1e4/(T.p*.98),pct=N/(T.sh+N)*100;if(!ePay(fr,x))return toast(eName(fr)+" 자금 부족: 가용 "+F(eAvail(fr)));rescale(T,(100-pct)/100);setOwn(T,fk,(T.own[fk]||0)+pct);T.bs[fk]=(T.bs[fk]||0)+x;T.sh+=N;T.cs+=x;eqCash(T,x);T.p*=.98;ctlAll();S.fl.pp=1;rec("신주 인수",T,x,eName(fr));L(T.tk+" 신주 "+pct.toFixed(1)+"%를 "+eName(fr)+"가 인수 ("+F(x)+") → 내 그룹 "+grp(T,"P").toFixed(1)+"%",1)}
else if(how==="rec"){const y=Math.min(x,Fc.pa||0,Fc.cs);if(y<=0)return toast("회수할 대여금이나 회사 현금이 없습니다");Fc.pa-=y;Fc.D-=y;Fc.cs-=y;S.cash+=y;rec("대여금 회수",Fc,y,"나");L(Fc.tk+" 대여금 "+F(y)+" 회수",1)}
else if(how==="div"){if(x>Fc.cs+1e-9)return toast("배당은 회사 현금("+F(Fc.cs)+") 안에서만 할 수 있어요");const p=to==="P"?Fc.own.P||0:Fc.own["c"+to]||0,h=to==="P"?null:S.co[to],t=h?(h.i===HOLD||p>=80?0:p>=20?.05:.1):.4,me=p*x/100*(1-t);
Fc.cs-=x;payDiv(Fc,x);rec("특별배당",Fc,x,Fc.tk);L(Fc.tk+" 특별배당 "+F(x)+" → "+(h?h.tk:"내")+" 몫 "+F(me)+(t?" (세후)":" (비과세)")+(p<99.9?" · 나머지는 다른 주주에게":""),1)}
MV.amt="";render()};

// ---- v10 actions: quick adjust, extraordinary dividend, switch banks, save backup, Android app hooks ----
const qn=d=>((d==null?S.day:d)%360/90|0)+1;
G.cyc=(i,k)=>{const c=S.co[i];if(!mine(c))return;const L0={pay:[0,.3,.6,1],g:[-.1,0,.04,.1,.2],ps:[0,1,2,3]}[k],cur=k==="ps"?c.ps||0:c[k],j=L0.findIndex(v=>Math.abs(v-cur)<1e-9),nx=L0[(j+1)%L0.length];if(k==="ps")G.ps(i,nx);else G.mg(i,k,nx)};
G.xdiv=i=>{const c=S.co[i];if(!mine(c))return;let to=null;if((c.own.P||0)>0)to="P";else{let b=0;for(const k in c.own)if(k[0]==="c"&&root(k)==="P"&&c.own[k]>b){b=c.own[k];to=+k.slice(1)}}
if(to==null)return toast("배당을 받을 내 그룹 주주가 없습니다");mvInit();MV.fr=i;MV.to=to;MV.how="div";mvFix();sel=-1;pg="xf";render()};
G.bkPick=i=>{const c=S.co[i];if(!mine(c)||c.kd)return;const bs=banks().filter(b=>b.id!==c.ln).sort((a,b)=>(mine(b)-mine(a))||b.A-a.A).slice(0,12);
openMd({t:"거래 은행 변경",b:"대출을 다른 은행으로 옮깁니다. 수수료는 대출의 0.5% ("+F(loanOf(c)*.005)+"). 라이벌이 지배하는 은행은 대출을 회수할 수 있어요.",
h:bs.map(b=>`<div class="sr" onclick="G.bkGo(${i},${b.id})"><div><b>${esc(b.tk)} ${esc(b.n)}</b><div class="mu">${mine(b)?"내 은행":b.ctl==="?"?"판정 보류":b.ctl&&b.ctl[0]==="r"?"⚠ 라이벌 지배":"중립"} · 신용 ${RT[rating(b)]} · 자산 ${F(b.A)}</div></div><span class="mu">›</span></div>`).join("")||'<p class="mu">옮길 수 있는 은행이 없습니다.</p>',o:[["닫기","n"]]})};
G.bkGo=(i,b)=>{closeMd();G.chbank(i,b)};
// save backup: gzip + base64 when the browser supports CompressionStream
async function packS(strip){const js=strip?JSON.stringify(S,(k,v)=>k==="hr"||k==="hv"||k==="fq"||k==="IX"||k==="hm"||k==="w10"||k==="wd"?undefined:v):JSON.stringify(S);if(typeof CompressionStream==="function"){const st=new Blob([js]).stream().pipeThrough(new CompressionStream("gzip")),u=new Uint8Array(await new Response(st).arrayBuffer());let s="";for(let k=0;k<u.length;k+=8192)s+=String.fromCharCode.apply(null,u.subarray(k,k+8192));return "WSR1:"+btoa(s)}
return "WSR0:"+btoa(unescape(encodeURIComponent(js)))}
async function unpackS(t){t=String(t||"").replace(/\s+/g,"");if(t.startsWith("WSR1:")){const b=atob(t.slice(5)),u=new Uint8Array(b.length);for(let k=0;k<b.length;k++)u[k]=b.charCodeAt(k);const st=new Blob([u]).stream().pipeThrough(new DecompressionStream("gzip"));return JSON.parse(await new Response(st).text())}
if(t.startsWith("WSR0:"))return JSON.parse(decodeURIComponent(escape(atob(t.slice(5)))));return JSON.parse(t)}
G.exp=async()=>{try{const t=await packS(1);let ok=false;if(window.Android&&Android.copy)ok=!!Android.copy(t);else if(navigator.clipboard&&navigator.clipboard.writeText)try{await navigator.clipboard.writeText(t);ok=true}catch(e){}
if(ok)toast("세이브 코드를 복사했어요 ("+Math.max(1,Math.round(t.length/1024))+"KB). 메모장이나 나와의 채팅에 붙여 넣어 두세요");
else openMd({t:"세이브 코드",b:"아래 코드를 길게 눌러 전체 선택한 뒤 복사하세요.",h:`<textarea class="in" id="xpt" readonly style="min-height:160px">${esc(t)}</textarea>`,o:[["닫기","n"]]})}catch(e){toast("내보내기 실패: "+(e&&e.message||e))}};
G.imp=()=>{openMd({t:"세이브 가져오기",b:"복사해 둔 세이브 코드(WSR1:로 시작)를 붙여 넣으세요. 지금 게임은 이 세이브로 바뀝니다.",h:`<textarea class="in" id="ipt" style="min-height:140px" placeholder="WSR1:..." aria-label="세이브 코드"></textarea>`,o:[["취소","n"],["불러오기","y"]]});
mcb=async()=>{const el=$("ipt"),t=el?el.value:"";if(!t.trim())return toast("세이브 코드를 붙여 넣어 주세요");try{const s=migrate(await unpackS(t));if(!s||!Array.isArray(s.co)||!s.co.length)throw new Error("세이브 형식이 아니에요");await rsCommit(s,1);toast("세이브를 불러왔어요 · "+ds())}catch(e){toast("불러오기 실패: "+(e&&(e.message||e.code)||e))}}};   // RT-SAVE-ATOMIC-01: all or nothing
// Android app hooks (called from the APK's Activity)
let bk0=0;
function andQuit(){const t=Date.now();if(t-bk0<2000){try{saveNow()}catch(e){}if(window.Android&&Android.exit)Android.exit()}else{bk0=t;toast("뒤로 버튼을 한 번 더 누르면 종료돼요")}}
if(typeof window!=="undefined"){
window.andBack=()=>{const m=$("mn");if(m&&!m.hidden){G.menu(0);return}if(mdl){if(!mdl.ev&&!mdl.tut)G.mk(0);return}if(pg==="new"){if(NG&&!NG.first)G.ngCancel();else andQuit();return}if(sel>=0||pg){G.back();return}if(tab!=="h"){G.go("h");return}andQuit()};
window.andPause=()=>{try{if(S&&S.spd&&!S.over){S.bgs=S.spd;S.spd=0}saveNow()}catch(e){}};
window.andResume=()=>{try{if(S&&S.bgs){S.spd=S.bgs;S.bgs=0;render()}}catch(e){}}}

// ---- v11 fine controls: one stepper/slider dialog for every percentage or amount ----
let NMd=null;
function numModal(o){NMd=o;const v=o.val;openMd({t:o.t,b:o.b||"",h:`<div class="nmw"><div class="row"><button class="cb" onclick="NM(-1)" aria-label="줄이기">−</button><input class="in" id="nmi" type="number" inputmode="decimal" step="${o.step}" min="${o.min}" max="${o.max}" value="${v}" oninput="NMs(this.value,1)" aria-label="${esc(o.t)}"><span class="nmu">${o.u||""}</span><button class="cb" onclick="NM(1)" aria-label="늘리기">+</button></div>
<input type="range" id="nmr" min="${o.min}" max="${o.max}" step="${o.step}" value="${v}" oninput="NMs(this.value)" aria-label="${esc(o.t)} 슬라이더"><div class="ch">${(o.chips||[]).map(x=>`<button onclick="NMs(${x})">${o.cf?o.cf(x):x+(o.u||"")}</button>`).join("")}</div><div class="mu" id="nmp" style="margin-top:8px;min-height:2.8em;line-height:1.55;white-space:normal"></div></div>`,o:[["취소","n"],[o.ok||"적용","y"]]});
mcb=()=>{const x=NMv();if(x!=null)o.go(x)};NMp()}
function NMv(){const e=$("nmi");let x=+(e&&e.value!==""?e.value:NMd.val);if(!isFinite(x))return null;x=Math.min(NMd.max,Math.max(NMd.min,x));x=Math.round(x/NMd.step)*NMd.step;return +x.toFixed(4)}
function NMs(v,typed){const e=$("nmi"),r=$("nmr");if(e&&!typed)e.value=v;if(r)r.value=v;NMp()}
function NM(d){const x=(NMv()==null?NMd.val:NMv())+d*NMd.step;NMs(+Math.min(NMd.max,Math.max(NMd.min,x)).toFixed(4))}
function NMp(){const p=$("nmp");if(p&&NMd&&NMd.pv){const x=NMv();p.textContent=x==null?"":NMd.pv(x)}}
// management settings for one of my companies
G.adj=(i,k)=>{const c=S.co[i];if(!mine(c))return toast("경영권이 있어야 합니다");
if(k==="pay")return numModal({t:c.tk+" 배당성향",b:"분기 이익 중 주주에게 나눠 줄 비율이에요. 0이면 이익을 회사에 쌓아 둡니다.",min:0,max:100,step:1,val:Math.round(c.pay*100),u:"%",chips:[0,10,25,40,60,100],
pv:x=>{const e=c.er||{},base=Math.max(0,(e.op||0)-(e.it||0)-(e.tax||0)+(e.dr||0)),dv=base*x/100;return "지난 분기 기준 배당 약 "+F(dv)+" (주당 "+W(dv*1e4/c.sh)+")"+(c.own.P?" · 내 몫 세후 "+F(dv*c.own.P/100*.6):"")},go:x=>G.mg(i,"pay",x/100)});
if(k==="g")return numModal({t:c.tk+" 성장률",b:"1년 동안 사업 자산을 늘리는 속도예요. 투자금은 회사 현금에서 나가고 모자라면 빚을 집니다. 업종 설비 증가율에도 반영돼요.",min:-20,max:30,step:1,val:Math.round(c.g*100),u:"%",chips:[-10,0,4,8,12,20],
pv:x=>{const q=c.A*x/400,gap=S.dg[c.i]-S.cg[c.i];return "분기 투자 "+F(q)+" (현금 "+F(c.cs)+") · 1년 뒤 사업 자산 약 "+F(c.A*(1+x/100))+" · 업종 수요 성장 "+(S.dg[c.i]*100).toFixed(1)+"% vs 설비 "+(S.cg[c.i]*100).toFixed(1)+"%"+(gap<-.005&&x>4?" — 공급 과잉이라 마진이 줄 수 있어요":"")},go:x=>G.mg(i,"g",x/100)});
if(k==="ps")return numModal({t:c.tk+" "+PSN(c.i),b:"사업 자산 대비 연간 투자 비율이에요. 당장은 이익이 줄지만 몇 분기 뒤 수익성이 오릅니다.",min:0,max:6,step:.5,val:c.ps||0,u:"%",chips:[0,1,2,3,4,6],
pv:x=>"분기 비용 "+F(c.A*x*.0025)+" · 지금 효율 +"+((c.q||0)*400).toFixed(1)+"%p (최대 +3.6%p까지 쌓임)",go:x=>G.ps(i,x)});
if(k==="bond")return numModal({t:c.tk+" 회사채 발행",b:"자본 대비 비율로 10년 고정금리 회사채를 냅니다. 신용이 BB 이하면 정크본드예요.",min:5,max:60,step:1,val:20,u:"%",chips:[10,20,30,40,60],
pv:x=>"발행액 약 "+F(Math.max(0,eq(c))*x/100)+" · 쿠폰 약 "+(S.prime+SPR[rating(c)]+1).toFixed(1)+"%",go:x=>G.bissue(i,x/100)});
if(k==="pp")return numModal({t:c.tk+" 사모 유상증자",b:"거래 주체("+eName(teOK())+")에게 신주를 배정합니다. 지분이 늘어 경영권이 단단해져요.",min:1,max:30,step:1,val:10,u:"%",chips:[5,10,15,20,30],
pv:x=>"필요 자금 "+F(c.sh*x/(100-x)*c.p*.98/1e4)+" · 거래 주체 가용 "+F(eAvail(teOK())),go:x=>G.pp(i,x)});
if(k==="wk")return numModal({t:c.tk+" 백기사 배정",b:"중립적인 현금 많은 회사에 신주를 배정해 라이벌 지분을 희석합니다.",min:1,max:30,step:1,val:10,u:"%",chips:[5,10,20,30],pv:x=>"신주 "+x+"% 배정 · 조달 약 "+F(c.sh*x/(100-x)*c.p*.95/1e4),go:x=>G.wk(i,x)});
if(k==="iss")return numModal({t:c.tk+" 공모 유상증자",b:"시장에 신주를 팔아 현금을 마련합니다. 내 지분율은 줄어요.",min:1,max:30,step:1,val:10,u:"%",chips:[5,10,20,30],pv:x=>"조달 약 "+F(mc(c)*x/100*.95)+" · 내 그룹 지분 "+grp(c,"P").toFixed(1)+"% → "+(grp(c,"P")/(1+x/100)).toFixed(1)+"%",go:x=>G.mg(i,"iss",x/100)});
if(k==="bb")return numModal({t:c.tk+" 자사주 매입·소각",b:"회사 돈으로 시장 주식을 사서 없앱니다. 남은 주주의 지분율이 올라가요.",min:1,max:15,step:1,val:5,u:"%",chips:[2,5,10,15],pv:x=>"비용 약 "+F(mc(c)*x/100*1.05)+" · 회사 가용 "+F(eAvail(i))+" · 내 그룹 지분 → "+(grp(c,"P")/(1-x/100)).toFixed(1)+"%",go:x=>G.mg(i,"bb",x)});
if(k==="asell")return numModal({t:c.tk+" 사업 자산 매각",b:"설비를 팔아 현금을 만듭니다. 매각 비용 10%, 업종 설비도 줄어요.",min:1,max:60,step:1,val:10,u:"%",chips:[5,10,25,50],pv:x=>"매각 "+F(c.A*x/100)+" → 현금 "+F(c.A*x/100*.9),go:x=>G.asell(i,x/100)});
if(k==="borrow")return numModal({t:c.tk+" 은행 차입",b:"거래 은행에서 빌립니다. 신용등급이 낮으면 금리가 높아요.",min:0,max:Math.max(1,Math.floor(cRoom(c))),step:1,val:Math.min(50,Math.floor(cRoom(c))),u:"억",chips:[10,50,100,200].filter(v=>v<=cRoom(c)),cf:x=>x+"억",pv:x=>"대출 여력 "+F(cRoom(c))+" · 금리 약 "+(S.prime+SPR[rating(c)]).toFixed(1)+"%",go:x=>G.cborrow(i,x)});
if(k==="repay"){const mx=Math.max(1,Math.floor(Math.min(c.cs,c.kd?c.D:loanOf(c))));return numModal({t:c.tk+" 대출 상환",b:"회사 현금으로 은행 대출을 갚습니다.",min:0,max:mx,step:1,val:Math.min(50,mx),u:"억",chips:[10,50,100,mx],cf:x=>x+"억",pv:x=>"현금 "+F(c.cs)+" · 은행 대출 "+F(loanOf(c)),go:x=>G.crepay(i,x)})}};
// trade ticket: any % (0.1 step) for buy / sell / short, with live cost
G.tq=(i,side)=>{const c=S.co[i],e=teOK(),k=eKey(e),own=c.own[k]||0,room=Math.max(0,pub(c)-c.sp-4);if(c.priv||c.dead)return;
if(side==="b"){let mx=Math.min(room,99);const a=eAvail(e);if(cost1(c,mx)>a){let lo=0,hi=mx;for(let j=0;j<30;j++){const m=(lo+hi)/2;cost1(c,m)<=a?lo=m:hi=m}mx=lo}mx=Math.floor(mx*10)/10;if(mx<.1)return toast("자금이 부족하거나 남은 물량이 없어요");
return numModal({t:c.tk+" 매수",b:eName(e)+" 명의로 지분을 삽니다. 많이 살수록 가격이 올라가요(시장 충격).",min:.1,max:mx,step:.1,val:Math.min(1,mx),u:"%",chips:[.5,1,2,5,10,20].filter(v=>v<=mx).concat([mx]),cf:x=>x===mx?"최대":x+"%",ok:"매수",
pv:x=>{const ng=grp(c,"P")+(root(k)==="P"?x:0),tr=topRival(c,"P");return "비용 약 "+F(cost1(c,x))+" (가용 "+F(eAvail(e))+") · 매수 후 내 그룹 "+ng.toFixed(1)+"%"+(ng>=20&&ng>tr?" → 경영권 확보 가능":ng<20?" · 경영권까지 "+Math.max(20,tr+1).toFixed(0)+"% 필요":"")},go:x=>G.buy(i,x)})}
if(side==="s"){if(own<=0)return toast(eName(e)+" 명의 보유 지분이 없습니다");const mx=Math.floor(own*10)/10||own;return numModal({t:c.tk+" 매도",b:eName(e)+" 명의 지분을 팝니다. 많이 팔수록 가격이 내려가요.",min:.1,max:+mx.toFixed(1),step:.1,val:Math.min(1,+mx.toFixed(1)),u:"%",chips:[1,5,10].filter(v=>v<mx).concat([+mx.toFixed(1)]),cf:x=>x>=mx?"전부":x+"%",ok:"매도",
pv:x=>"받을 돈 약 "+F(mc(c)/100*(1-x/100*1.2)*.99*x)+" (세전) · 매도 후 "+(own-x).toFixed(1)+"%"+(mine(c)&&grp(c,"P")-x<20?" — 경영권을 잃을 수 있어요":""),go:x=>G.sell(i,x)})}
if(side==="x"){const mx=Math.floor(Math.min(room,30)*2)/2;if(mx<.5)return toast("공매도할 물량이 없습니다");return numModal({t:c.tk+" 공매도",b:"주식을 빌려 팔고 나중에 사서 갚습니다. 오르면 손실이 끝없이 커질 수 있어요. 연 2% 대차 수수료.",min:.5,max:mx,step:.5,val:Math.min(1,mx),u:"%",chips:[1,2,5,10].filter(v=>v<=mx),ok:"공매도",
pv:x=>"매도 금액 약 "+F(mc(c)*x/100*(1-x/100*1.2))+" · 순자산 "+F(nw()),go:x=>G.short(i,x)})}};
// acquisition offers with any premium
G.aq=(i,kind)=>{const c=S.co[i],e=teOK(),own=c.own[eKey(e)]||0,base=mc(c)*(100-own)/100;if(kind==="t"||kind==="l")return numModal({t:c.tk+(kind==="l"?" LBO":" 공개매수"),b:kind==="l"?"30%만 내고 70%는 대상 회사가 빚을 져서 지급합니다.":"남은 주식 전부를 현금으로 삽니다. 프리미엄이 낮으면 주주들이 거절해요.",min:0,max:100,step:1,val:35,u:"%",chips:[20,30,35,50,70],cf:x=>"+"+x+"%",ok:"제안",
pv:x=>(kind==="l"?"내가 낼 돈 ":"총 비용 ")+F(base*(1+x/100)*(kind==="l"?.3:1))+" · 가용 "+F(eAvail(e))+(topRival(c,"P")>=10&&x<35?" · 외부 대주주가 있어 35% 이상 권장":x<20?" · 20% 미만은 거절되기 쉬워요":""),go:x=>G.tender(i,x,kind==="l"?1:0)});
const a=e!=="P"?S.co[e]:null;if(kind==="m"&&a&&!a.priv)return numModal({t:a.tk+" ← "+c.tk+" 주식교환 합병",b:"상대 주주에게 "+a.tk+" 신주를 주고 흡수합니다.",min:0,max:100,step:1,val:25,u:"%",chips:[15,25,40,60],cf:x=>"+"+x+"%",ok:"제안",
pv:x=>{const q=mQuote(a,c,x);return "예상 찬성 "+Math.min(99,q.yes).toFixed(0)+"% (50% 넘어야 성공) · 합병 후 내 그룹 "+q.my.toFixed(1)+"%"},go:x=>G.merge(i,x)})};

let flg=-1;G.flg=k=>{flg=k;fl=-1;lim=120;render()};
