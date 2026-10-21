// ctl v2 — RunPod操作 + ComfyUI操作 + LoRA読込
const OLD='https://little-frost-d979.sute-trial174.workers.dev';
const JH={'Content-Type':'application/javascript; charset=utf-8'};
const TX={'Content-Type':'text/plain; charset=utf-8'};
function out(v,qs){
 const s=(typeof v==='string')?v:JSON.stringify(v);
 const cb=qs.get('cb');
 if(cb)return new Response('window['+JSON.stringify(cb)+']='+JSON.stringify(s)+';',{headers:JH});
 return new Response(s,{headers:TX});
}
const old=async d=>(await fetch(OLD+'/?do='+d+'&t='+Date.now())).text();
async function pid(){
 const s=await old('status');
 const m=/id=([A-Za-z0-9]+)/.exec(s);
 if(!m)throw new Error('pod id不明: '+s.slice(0,140));
 return m[1];
}
async function pod(p,o,ms){
 const c=new AbortController(),to=setTimeout(()=>c.abort(),ms||25000);
 try{
  const r=await fetch('https://'+(await pid())+'-8188.proxy.runpod.net'+p,Object.assign({signal:c.signal},o||{}));
  return {s:r.status,b:await r.text()};
 }catch(e){return {s:0,b:'ERR '+e.message};}
 finally{clearTimeout(to);}
}
const pg=(p,ms)=>pod(p,null,ms);
const pp=(p,j,ms)=>pod(p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(j)},ms);
function b64(b){const u=new Uint8Array(b);let s='';const C=0x8000;for(let i=0;i<u.length;i+=C)s+=String.fromCharCode.apply(null,u.subarray(i,i+C));return btoa(s);}
async function oinfo(c){const r=await pg('/object_info/'+c);if(r.s!==200)throw new Error(c+' '+r.s+' '+r.b.slice(0,80));return JSON.parse(r.b);}
const ckpt=async()=>(await oinfo('CheckpointLoaderSimple')).CheckpointLoaderSimple.input.required.ckpt_name[0][0];
const loras=async()=>(await oinfo('LoraLoader')).LoraLoader.input.required.lora_name[0];
function wf(a){
 const n={};
 n['1']={class_type:'CheckpointLoaderSimple',inputs:{ckpt_name:a.ck}};
 let M=['1',0],C=['1',1];
 if(a.lora){n['2']={class_type:'LoraLoader',inputs:{lora_name:a.lora,strength_model:a.lw,strength_clip:a.lw,model:M,clip:C}};M=['2',0];C=['2',1];}
 n['3']={class_type:'CLIPTextEncode',inputs:{text:a.p,clip:C}};
 n['4']={class_type:'CLIPTextEncode',inputs:{text:a.n,clip:C}};
 n['5']={class_type:'EmptyLatentImage',inputs:{width:a.w,height:a.h,batch_size:1}};
 n['6']={class_type:'KSampler',inputs:{seed:a.seed,steps:a.steps,cfg:a.cfg,sampler_name:a.sm,scheduler:'normal',denoise:1,model:M,positive:['3',0],negative:['4',0],latent_image:['5',0]}};
 n['7']={class_type:'VAEDecode',inputs:{samples:['6',0],vae:['1',2]}};
 n['8']={class_type:'SaveImage',inputs:{filename_prefix:a.f,images:['7',0]}};
 return n;
}
async function gen(qs){
 const a={
  p:qs.get('p')||'hitori gotoh, bocchi the rock',
  n:qs.get('neg')||'lowres, bad anatomy, worst quality, jpeg artifacts',
  lora:qs.get('lora')||'',
  lw:parseFloat(qs.get('lw')||'0.8'),
  w:parseInt(qs.get('w')||'832'),h:parseInt(qs.get('h')||'1216'),
  steps:parseInt(qs.get('steps')||'28'),cfg:parseFloat(qs.get('cfg')||'6'),
  sm:qs.get('sm')||'euler_ancestral',
  seed:parseInt(qs.get('seed')||String(Math.floor(Math.random()*1e9))),
  f:qs.get('f')||'bot',
  ck:qs.get('ck')||await ckpt()
 };
 const r=await pp('/prompt',{prompt:wf(a),client_id:'ctl'});
 if(r.s!==200)return 'ERR '+r.s+' '+r.b.slice(0,300);
 return JSON.parse(r.b).prompt_id;
}
async function hist(id){
 const r=await pg('/history/'+id);
 if(r.s!==200)return {done:false,msg:r.b.slice(0,120)};
 const e=JSON.parse(r.b)[id];
 if(!e)return {done:false};
 const f=[];
 for(const k in e.outputs)(e.outputs[k].images||[]).forEach(im=>f.push(im.filename));
 return {done:true,files:f};
}
async function view(name){
 const c=new AbortController(),to=setTimeout(()=>c.abort(),30000);
 try{
  const r=await fetch('https://'+(await pid())+'-8188.proxy.runpod.net/view?filename='+encodeURIComponent(name),{signal:c.signal});
  return 'data:'+(r.headers.get('Content-Type')||'image/png')+';base64,'+b64(await r.arrayBuffer());
 }catch(e){return 'ERR '+e.message;}
 finally{clearTimeout(to);}
}
async function diag(){
 let o='';
 try{o+='pod: '+(await old('status'))+'\n';}catch(e){o+='pod ERR '+e.message+'\n';}
 o+='ready: '+(await pg('/system_stats',8000)).s+'\n';
 try{o+='ckpt: '+(await ckpt())+'\n';}catch(e){o+='ckpt ERR '+e.message+'\n';}
 try{const L=await loras();o+='loras('+L.length+'): '+L.slice(0,15).join(' | ')+'\n';}catch(e){o+='loras ERR '+e.message+'\n';}
 for(const m of ['/manager/version','/api/manager/version','/manager/queue/status']){
  const r=await pg(m,8000);o+=m+' -> '+r.s+' '+String(r.b).slice(0,60)+'\n';
 }
 return o;
}
async function loradl(url,name){
 if(!url)return 'no url';
 const body={url:url,type:'loras',filename:name||''};
 let o='';
 for(const p of ['/manager/queue/install_model','/manager/install_model','/api/manager/queue/install_model']){
  const r=await pp(p,body,20000);
  o+=p+' -> '+r.s+' '+String(r.b).slice(0,160)+'\n';
  if(r.s===200)break;
 }
 return o;
}
const UI=`<!doctype html><html lang=ja><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>ctl</title><style>body{margin:0;padding:10px;background:#0d0d12;color:#e9e9f2;font:14px/1.5 system-ui,sans-serif}button{padding:11px 4px;border:1px solid #262634;border-radius:10px;background:#17171f;color:#e9e9f2;font-size:13px;flex:1 1 30%}.hot{background:#1b2947;border-color:#39559c}.row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}textarea,input{width:100%;box-sizing:border-box;background:#111119;color:#dbe3ff;border:1px solid #262634;border-radius:10px;padding:8px;font-size:12px;margin-bottom:6px}pre{background:#08080d;border:1px solid #1e1e28;border-radius:10px;padding:8px;font-size:11px;white-space:pre-wrap;word-break:break-all;max-height:200px;overflow:auto}</style></head><body><h3 style="color:#8fa8ff">CTL</h3><div class=row><button onclick="A(\'status\')">状態</button><button class=hot onclick="A(\'start\')">起動</button><button onclick="A(\'ready\')">起動確認</button><button onclick="A(\'stop\')">停止</button><button onclick="A(\'rebuild\')">作り直し</button></div><div class=row><button class=hot onclick="A(\'diag\')">診断</button><button onclick="A(\'loras\')">LoRA一覧</button></div><textarea id=p>hitori gotoh, bocchi the rock, pink hair, blue eyes, yellow hair bow, dog ears headband, black collar, leash, nude, large breasts, glossy skin, wet, sweat, blush</textarea>
<input id=lora placeholder="LoRA名">
<input id=lw value="0.8">
<div class=row><button class=hot onclick="GO(1)">生成 1枚</button><button class=hot onclick="GO(5)">生成 5枚</button><button onclick="LOAD()">画像更新</button></div>
<input id=lurl placeholder="LoRAのDL URL">
<div class=row><button onclick="LD()">LoRA読込</button><button onclick="A(\'clean\')">KV整理</button></div>
<pre id=log>ready</pre>
<div id=g style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:6px"></div>
<script>
function log(t){var l=document.getElementById('log');l.textContent=t+"\\n"+l.textContent;}
async function A(d){log('... '+d);try{var r=await fetch('/?do='+d);log(await r.text());}catch(e){log('ERR '+e.message);}}
async function GO(n){for(var i=0;i<n;i++){var r=await fetch('/?do=gen&p='+encodeURIComponent(document.getElementById('p').value)+'&lora='+encodeURIComponent(document.getElementById('lora').value)+'&lw='+document.getElementById('lw').value);var t=await r.text();log(t);if(t.indexOf('ERR')===0)return;poll(t);await new Promise(function(x){setTimeout(x,400)});}}
function poll(id){fetch('/?do=img&id='+encodeURIComponent(id)).then(function(r){return r.text()}).then(function(t){var j={};try{j=JSON.parse(t)}catch(e){log(t);return}if(!j.done){setTimeout(function(){poll(id)},4000);return}log('done: '+j.files.join(', '));PUSH(j.files.slice());});}
function PUSH(fs){var f=fs.shift();if(!f)return;fetch('/?do=push&name='+encodeURIComponent(f)).then(function(r){return r.text()}).then(function(t){log(t);if(t.indexOf('OK')===0){var u=t.split(' ')[1];var a=document.createElement('a');a.href=u;a.target='_blank';var im=document.createElement('img');im.loading='lazy';im.src=u;im.style.width='100%';a.appendChild(im);var g=document.getElementById('g');g.insertBefore(a,g.firstChild);}PUSH(fs);});}
function LOAD(){fetch('/?do=list').then(function(r){return r.text()}).then(function(t){var j={};try{j=JSON.parse(t)}catch(e){log(t);return}var f=(j.files||[]).slice().reverse(),g=document.getElementById('g');g.innerHTML='';f.forEach(function(n){var u='https://little-frost-d979.sute-trial174.workers.dev/?do=file&name='+encodeURIComponent(n);var a=document.createElement('a');a.href=u;a.target='_blank';var im=document.createElement('img');im.loading='lazy';im.src=u;im.style.width='100%';a.appendChild(im);g.appendChild(a);});log('画像 '+f.length+'枚');});}
function LD(){var u=document.getElementById('lurl').value;if(!u)return log('URLなし');fetch('/?do=loradl&url='+encodeURIComponent(u)).then(function(r){return r.text()}).then(log);}
LOAD();
<\/script></body></html>`;
export default {
 async fetch(req){
  const qs=new URL(req.url).searchParams;
  const d=(qs.get('do')||'ui').toLowerCase();
  try{
   switch(d){
    case 'ui': return new Response(UI,{headers:{'Content-Type':'text/html; charset=utf-8'}});
    case 'status': case 'start': case 'ready': case 'stop': case 'rebuild':
     return out(await old(d),qs);
    case 'clean': return out(await old('prune'),qs);
    case 'last': return out(await old('last'),qs);
    case 'diag': return out(await diag(),qs);
    case 'loras': { try{ return out(JSON.stringify(await loras()),qs); }catch(e){ return out('ERR '+e.message,qs); } }
    case 'ckpt': { try{ return out(await ckpt(),qs); }catch(e){ return out('ERR '+e.message,qs); } }
    case 'gen': return out(await gen(qs),qs);
    case 'img': return out(JSON.stringify(await hist(qs.get('id'))),qs);
    case 'push': return out(await old('push&name='+encodeURIComponent(qs.get('name')||'')),qs);
    case 'list': return out(await old('list'),qs);
    case 'file': return out(await view(qs.get('name')),qs);
    case 'loradl': return out(await loradl(qs.get('url'),qs.get('name')),qs);
    default: return out('unknown: '+d,qs);
   }
  }catch(e){ return out('ERR '+(e&&e.message?e.message:e),qs); }
 }
};