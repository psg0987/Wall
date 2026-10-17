global.window=global;
const FL={freq:[2265600,2265600,2956800,2956800,3148800,3148800,3148800,3393600],th:0,tpsBy:null,files:[],dl:{st:'idle',n:'',from:'',d:0,t:0,e:''},run:false,up:false,exit:-999,model:'',eng:'',cores:8,free:50e9,log:'',web:{exaone4:true},reqs:{},nid:1,calls:[],store:{},text:'안녕하세요! 오늘도 좋은 투자 하세요.',tps:31.5,bad:0,dlFail:0,deadFast:0,deadAll:0,slow:10};
global.AndroidLM={
 info(){return JSON.stringify({v:3,freq:FL.freq,bin:true,fast:true,cores:FL.cores,free:FL.free,run:FL.run,up:FL.up&&FL.run,exit:FL.exit,model:FL.model,eng:FL.eng,files:FL.files.map(n=>({n,s:1})),dl:FL.dl,log:FL.log})},
 adopt(n,arch){FL.calls.push(['adopt',n,arch]);if(FL.dl.st==='run'||FL.dl.st==='scan')return false;FL.dl={st:'scan',n,from:'web',d:0,t:0,e:''};setTimeout(()=>{if(FL.web[arch]){FL.dl.st='run';FL.dl.t=812e6;setTimeout(()=>{FL.dl.d=812e6;FL.dl.st='done';FL.files.push(n)},30)}else FL.dl.st='none'},20);return true},
 download(u,n){FL.calls.push(['download',u,n]);if(FL.dl.st==='run')return false;FL.dl={st:'run',n,from:'net',d:0,t:812e6,e:''};setTimeout(()=>{if(FL.dl.st!=='run')return;if(FL.dlFail){FL.dl.st='err';FL.dl.e='HTTP 404'}else{FL.dl.d=812e6;FL.dl.st='done';FL.files.push(n)}},FL.dlMs||40);return true},
 cancelDownload(){FL.calls.push(['cancelDownload']);FL.dl.st='idle';FL.dl.e='cancelled'},
 del(n){FL.calls.push(['del',n]);if(n===FL.model)AndroidLM.stop();const had=FL.files.includes(n);FL.files=FL.files.filter(x=>x!==n);return had},
 clean(keep){FL.calls.push(['clean',keep]);const n=FL.files.filter(x=>x!==keep&&x!==FL.model).length;FL.files=FL.files.filter(x=>x===keep||x===FL.model);return n},
 start(n,t,tb,c,fast,mask,maskb){FL.calls.push(['start',n,t,c,fast,mask,tb,maskb]);FL.th=t;FL.tb=tb;FL.run=false;FL.up=false;if(!FL.files.includes(n))return '{"ok":false,"e":"model missing"}';FL.run=true;FL.model=n;FL.exit=-999;FL.eng=fast?'libllamasrv8.so':'libllamasrv.so';
  if(FL.deadAll||(fast&&FL.deadFast))setTimeout(()=>{FL.run=false;FL.exit=132;FL.log='line1\nline2\nIllegal instruction'},30);else setTimeout(()=>{FL.up=true},30);return JSON.stringify({ok:true,port:1234,eng:FL.eng})},
 stop(){FL.calls.push(['stop']);FL.run=false;FL.up=false;FL.model=''},
 ask(b){const q=JSON.parse(b);FL.q=q;FL.asks=(FL.asks||0)+1;const id=FL.nid++;const r={t:'',d:false,e:'',s:0,p:0};FL.reqs[id]=r;if(!FL.up||!FL.run){r.d=true;r.e='Connection refused';return id}
  const ws=(FL.bad?'betont(u Raptors بلا Thíchпку دادن保持不变 forstå蒙古影响力的 exprimandex_sd埃ートの niezwykle十九_clip':FL.text).split(' ');let k=0;
  r.pp=0;const tick=()=>{if(FL.readMs&&!r.rd0){r.rd0=1;r.pp=.5;return setTimeout(tick,FL.readMs)}if(r.cancel){r.d=true;return}if(!FL.up||!FL.run){r.d=true;r.e='unexpected end of stream';return}if(k<ws.length){r.t+=(k?' ':'')+ws[k++];setTimeout(tick,FL.slow)} else{r.d=true;r.s=FL.tpsBy&&FL.tpsBy[FL.th]||FL.tps;r.p=FL.ppsBy&&FL.ppsBy[FL.tb]||95;r.n=80;r.pp=1}};setTimeout(tick,FL.slow);return id},
 poll(id){const r=FL.reqs[id];if(!r)return JSON.stringify({t:'',d:true,e:'no request',s:0,p:0});const s=JSON.stringify({t:r.t,d:r.d,e:r.e,s:r.s,p:r.p||0,n:r.n||0,pp:r.pp==null?-1:r.pp});if(r.d)delete FL.reqs[id];return s},
 cancel(id){FL.calls.push(['cancel',id]);const r=FL.reqs[id];if(r)r.cancel=true}};
global.Android={load:k=>FL.store[k]||'',save:(k,v)=>{FL.store[k]=v;return true},wipeOld(){FL.wiped=1},exit(){}};
