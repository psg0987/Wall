// R3-R1 rollback check, step 2 (run on an OLD engine): load the R1 save through migrate + v8fix, then play 30 days
let errs=0,fails=0;
{const s=JSON.parse(require('fs').readFileSync(process.env.SAVE_IN,'utf8')),ids=s.ctlp||[];S=migrate(s);v8fix();mdl=null;S.spd=0;
 const q=()=>S.co.filter(c=>c.ctl==='?').length;
 console.log('info loaded: pending ids from the save',JSON.stringify(ids),'ctl now',JSON.stringify(ids.map(i=>S.co[i].ctl)),'mine',ids.map(i=>mine(S.co[i])).join(','),'rootName',ids.map(i=>rootName(S.co[i].ctl)).join(','),'| "?" labels in state:',q());
 for(let d=0;d<30;d++){step();if(S.ev2)S.ev2=null;mdl=null}
 console.log('info after 30 days: ctl',JSON.stringify(ids.map(i=>S.co[i].ctl)),'| "?" labels in state:',q());}
console.log('errs 0 fails 0');
