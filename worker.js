let E,P0,PU='',PUT=0;
const A='https://little-frost-d979.sute-trial174.workers.dev',PID='2d1fyzegcjnguu',H={'Content-Type':'text/html; charset=utf-8'};
const F=q=>E&&E.OLD?E.OLD.fetch('https://a/?'+q):fetch(A '/?'+q);
const G=async d=>(await F('do='+d '&t='+Date.now())).text();
async function ID(){if(P0)return P0;try{const s=await G('status'),m=/id=([A-Za-z0-9]+)/.exec(s);if(m)return m[1]}catch(e){}return PID}
async function PD(p,o,ms){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms||25000);try{const r=await fetch('https://'+(await ID())+'-8188.proxy.runpod.net'+p,Object.assign({signal:c.signal},o||{}));return{s:r.status,b:await r.text()}}catch(e){return{s:0,b:'ERR '+e.message}}finally{clearTimeout(t)}}
const PG=(p,ms)=>PD(p,null,ms),PJ=(p,b,ms)=>PD(p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)},ms);
async function OI(c){const r=await PG('/object_info/'+c);if(r.s!=200)throw Error(c ' ' r.s);return JSON.parse(r.b)}
const CK=async()=>(await OI('CheckpointLoaderSimple')).CheckpointLoaderSimple.input.required.ckpt_name[0