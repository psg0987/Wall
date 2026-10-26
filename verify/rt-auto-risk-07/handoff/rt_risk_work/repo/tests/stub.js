const mkEl=()=>({hidden:false,style:{setProperty(){},removeProperty(){}},dataset:{},classList:{toggle(){},add(){},remove(){}},_h:'',set innerHTML(v){this._h=v},get innerHTML(){return this._h},textContent:'',scrollTop:0,focus(){},value:'',addEventListener(){},offsetWidth:0});
const els={};global.document={getElementById:id=>els[id]||(els[id]=mkEl()),querySelectorAll:()=>[],documentElement:mkEl(),addEventListener(){},hidden:false};
const store={};global.localStorage={getItem:k=>k in store?store[k]:null,setItem(k,v){store[k]=String(v)}};
global.scrollTo=()=>{};global.claude=undefined;global.requestAnimationFrame=f=>f();
global.setInterval=()=>0;
