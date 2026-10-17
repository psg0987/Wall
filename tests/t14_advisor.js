let errs=0,fails=0;const T=(n,f)=>{try{f()}catch(e){errs++;console.log('ERR',n,e.stack.split('\n').slice(0,4).join(' | '))}};
const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m)}};
const bad=h=>/NaN|undefined|Infinity|\[object/.exec(h);
const html=()=>document.getElementById('v').innerHTML+document.getElementById('sh').innerHTML+document.getElementById('mdb').innerHTML;
init(Object.assign(defCfg(),{tut:0}));mdl=null;sel=-1;pg='';tab='h';
for(let d=0;d<400;d++){step();if(mdl){if(mdl.ev2)G.mk(0);else G.mk(mdl.o.length-1)}}S.spd=0;
const big=S.co.filter(c=>!c.dead&&!c.priv).sort((a,b)=>mc(b)-mc(a))[0];G.buy(big.id,2);
const small=S.co.filter(c=>!c.dead&&!c.priv&&!c.kd&&mc(c)<3000).sort((a,b)=>mc(b)-mc(a))[0];G.ctrl(small.id);
const cx=cxAlive()[0];
const Q=[[big.tk+' 사도 돼?',/참모 판단/],[big.tk.toLowerCase()+' 팔까',/참모 판단/],[big.n+' 어때?',/참모 판단/],[small.tk+' 인수하고 싶어',/참모 판단/],['인수할 만한 회사는?',/경영권까지/],['내 가장 큰 위험은?',/./],['남는 현금 어떻게 굴릴까?',/국채/],
['경제 전망은?',/기준금리/],['금리 오르면 어떻게 돼?',/금리/],['피드백 해줘',/<li>/],['다음에 뭐 하지?',/<li>/],['PER이 뭐야?',/PER/],['배당이 뭐야',/배당/],['반도체 업종 어때?',/반도체/],['라이벌 동향은?',new RegExp(S.R[0].n.split(' ')[0])],
[cx.k+' 어때?',new RegExp(cx.k)],['코인 시장 어때',/국면/],['선물 옵션 위험해?',/선물|위험/],['배당 높은 종목 알려줘',/배당/],['공매도 할 만한 종목',/공매도|떨어질/],['공매도는 어떻게 해?',/공매도/],['세금 줄이는 법',/세금|법인세/],
['내 은행 상태',/은행/],['감독원 주목도',/주목도/],['내 상황 요약',/<li>/],['asdfgh',/물어보면/]];
T('answers',()=>{for(const[q,re]of Q){const t0=Date.now();const r=qaAnswer(q),ms=Date.now()-t0;const b=bad(r.h+JSON.stringify(r.a));ok(!b,q+' clean '+(b?r.h.slice(Math.max(0,b.index-60),b.index+30):''));ok(re.test(r.h),q+' -> '+r.h.replace(/<[^>]+>/g,' ').slice(0,100));ok(ms<80,q+' slow '+ms)}});
T('chat page',()=>{pg='';sel=-1;G.qaAsk(big.tk+' 사도 돼?');ok(pg==='adv'&&S.qa.length===1,'pushed');G.qaSend('인수할 만한 회사는?');ok(S.qa.length===2,'two');const h=html();ok(/class="qm"/.test(h)&&/class="qr"/.test(h),'bubbles');ok(!bad(h),'chat clean');
 for(let k=0;k<20;k++)G.qaSend('경제 전망은?');ok(S.qa.length===16,'cap 16 '+S.qa.length);G.qaClr();ok(S.qa.length===0,'clear')});
T('actions run',()=>{const r=qaAnswer(big.tk+' 사도 돼?');for(const[t,f]of r.a){if(/G\.tq/.test(f))continue;try{eval(f)}catch(e){ok(0,'action '+t+' '+e.message)}if(mdl)G.mk(0)}pg='';sel=-1;
 const r2=qaAnswer('인수할 만한 회사는?');for(const[t,f]of r2.a){eval(f);ok(sel>=0,'open '+t)}sel=-1;render()});
T('overview card + sheet band',()=>{G.pick(big.id);G.stab('o');const h=html();ok(/레이더 참모 의견/.test(h),'qa card');ok(/class="stw"/.test(h),'tab band');ok(!bad(h),'sheet clean');G.pick(-1)});
T('home + eco + set',()=>{tab='h';pg='';sel=-1;render();const h=html();ok(/G.mgo2\('adv'\)/.test(h),'home shortcut adv');ok(!bad(h),'home clean');pg='ai';render();ok(/내장 생태계 엔진/.test(html()),'eco text');pg='set';render();ok(/온디바이스 AI 점검/.test(html()),'probe button');pg='';render()});
T('save',()=>{G.qaSend('경제 전망은?');const j=JSON.stringify(S);S=migrate(JSON.parse(j));v8fix();pg='adv';render();ok(S.qa.length>=1&&/기준금리/.test(html()),'chat survives save');pg=''});
T('fresh game no holdings',()=>{init(Object.assign(defCfg(),{tut:0}));mdl=null;for(const[q]of Q){const r=qaAnswer(q);const b=bad(r.h);ok(!b,'fresh '+q+(b?' '+r.h.slice(b.index-50,b.index+20):''))}});
console.log('errs',errs,'fails',fails);
