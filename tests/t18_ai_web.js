let errs=0,fails=0;const T=async(n,f)=>{try{await f()}catch(e){errs++;console.log('ERR',n,e&&e.stack?e.stack.split('\n').slice(0,4).join(' | '):e)}};
const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m)}};const bad=h=>/NaN|undefined|Infinity|\[object/.exec(h);const sl=ms=>new Promise(r=>setTimeout(r,ms));
const html=()=>document.getElementById('v').innerHTML+document.getElementById('sh').innerHTML+document.getElementById('mdb').innerHTML;
global.navigator={hardwareConcurrency:8,storage:{persist:async()=>true}};
const G1='betont(u Raptors بلا Thíchпку دادن保持不变 forstå蒙古影响力的 exprimandex_sd埃ートの niezwykle十九_clip';
class FW{constructor(c,o){this.c=c;FW.made=(FW.made||0)+1}async loadModelFromHF(h,p){FW.h=h;FW.p=p;p.progressCallback({loaded:400*1048576,total:812*1048576});if(FW.fail)throw new Error('HTTP 401')}async loadModelFromUrl(u,p){return this.loadModelFromHF({url:u},p)}
 isMultithread(){return false}async exit(){FW.exits=(FW.exits||0)+1}
 async createChatCompletion(q){FW.q=q;const txt=FW.bad?G1:FW.text;return{[Symbol.asyncIterator]:async function*(){for(const w of txt.split(' ')){if(q.abortSignal.aborted){const e=new Error('aborted');e.name='AbortError';throw e}yield{choices:[{delta:{content:w+' '}}]}}yield{choices:[{delta:{content:''}}],timings:{predicted_per_second:3.7}}}}}}
class FCM{async list(){return FCM.items}async delete(n){FCM.items=FCM.items.filter(e=>e.name!==n)}}
(async()=>{init(Object.assign(defCfg(),{tut:0}));mdl=null;for(let d=0;d<120;d++){step();if(mdl)G.mk(mdl.o.length-1)}
LAI.lib={Wllama:FW,CacheManager:FCM};FW.text='안녕하세요! 오늘도 좋은 투자 하세요.';uiS('r17gpu',1);
await T('web panel',async()=>{pg='set';G.aiP('local');const h=html();ok(lmNat()===false,'no native on web');ok(/EXAONE 4.0 1.2B/.test(h)&&/Qwen2.5 1.5B/.test(h)&&!/2.4B/.test(h),'web lists 2 models');ok(!/GPU/.test(h),'no GPU button');ok(/단일 코어/.test(h)&&/모델 받기/.test(h),'panel');ok(!bad(h),'panel clean')});
await T('web load',async()=>{await G.laiLoad();ok(LAI.st==='ready','ready '+LAI.st+' '+LAI.msg);ok(uiP('r17gpu',0)===0,'old gpu pref cleared');ok(FW.h.repo==='LGAI-EXAONE/EXAONE-4.0-1.2B-GGUF'&&FW.h.file==='EXAONE-4.0-1.2B-Q4_K_M.gguf','hf params');
 ok(FW.p.n_gpu_layers===0&&FW.p.jinja===true&&FW.p.n_ctx===2048,'load params '+JSON.stringify(FW.p));ok(/CPU 1코어/.test(laiLine())&&/3.7 토큰\/초/.test(laiLine()),'status '+laiLine());ok(/안녕하세요/.test(LAI.out),'selftest out');ok(FW.q.chat_template_kwargs.enable_thinking===false&&FW.q.stream===true&&FW.q.penalty_repeat===1.08,'chat params')});
await T('web advisor',async()=>{pg='';S.qa=[];G.qaSend('경제 전망은?');await sl(40);const m=S.qa[S.qa.length-1];ok(m.s==='폰 안 AI'&&/좋은 투자/.test(m.h),'local bubble '+(m&&m.h));ok(busy===0,'busy free');ok(/^질문:/.test(FW.q.messages[1].content)&&FW.q.messages[1].content.length<=1100,'compact prompt')});
await T('web noise',async()=>{FW.bad=1;G.qaSend('경제 전망은?');await sl(40);const m=S.qa[S.qa.length-1];ok(/답이 이상해서 멈췄어요/.test(m.h),'garbage msg '+m.h);FW.bad=0;ok(busy===0,'busy free 2')});
await T('web selftest fail',async()=>{G.laiPick('qwen');FW.bad=1;await G.laiLoad();ok(LAI.st==='err'&&/자가 진단 실패/.test(LAI.msg),'err '+LAI.msg);pg='set';render();ok(/자가 진단 답/.test(html()),'panel shows answer');FW.bad=0;G.laiPick('exaone')});
await T('web load error',async()=>{FW.fail=1;await G.laiLoad();ok(LAI.st==='err'&&/HTTP 401/.test(LAI.msg),'net err '+LAI.msg);FW.fail=0});
await T('web pick 2.4B ignored',async()=>{G.laiPick('exaone24');ok(lmId()==='exaone','web falls back to exaone');G.laiPick('exaone')});
await T('web cache mgmt',async()=>{FCM.items=[{name:'a_EXAONE-4.0-1.2B-Q4_K_M.gguf',metadata:{originalURL:'https://huggingface.co/LGAI-EXAONE/EXAONE-4.0-1.2B-GGUF/resolve/main/EXAONE-4.0-1.2B-Q4_K_M.gguf'}},{name:'b_q.gguf',metadata:{originalURL:'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf'}}];
 await G.laiClean();ok(FCM.items.length===1&&/EXAONE/.test(FCM.items[0].name),'clean keeps current');await G.laiDel();ok(FCM.items.length===0,'delete current')});
await T('rule unaffected',async()=>{G.aiP('rule');S.qa=[];G.qaSend('경제 전망은?');ok(S.qa.length===1,'rule only')});
console.log('errs',errs,'fails',fails);process.exit(0)})();
