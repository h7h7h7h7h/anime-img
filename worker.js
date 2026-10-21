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
const old=async d=>(await fetch(OLD '/?do='+d+'&t='+Date.now())).text();
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
 try{const L=await loras();o+='loras('+L.length '): '+L.slice(0,15).join(' | ')+'\n';}catch(e){o+='loras ERR '+e.message+'\n';}
 for(const m of 