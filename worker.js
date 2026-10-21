let E,P0;
const A='https://little-frost-d979.sute-trial174.workers.dev',PID='vac2c5ymyt823h',H={'Content-Type':'text/html; charset=utf-8'};
const F=q=>E&&E.OLD?E.OLD.fetch('https://a/?'+q):fetch(A+'/?'+q);
const G=async d=>(await F('do='+d+'&t='+Date.now())).text();
async function ID(){if(P0)return P0;try{const s=await G('status'),m=/id=([A-Za-z0-9]+)/.exec(s);if(m)return m[1]}catch(e){}return PID}
async function PD(p,o,ms){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms||25000);try{const r=await fetch('https://'+(await ID())+'-8188.proxy.runpod.net'+p,Object.assign({signal:c.signal},o||{}));return{s:r.status,b:await r.text()}}catch(e){return{s:0,b:'ERR '+e.message}}finally{clearTimeout(t)}}
const PG=(p,ms)=>PD(p,null,ms),PJ=(p,b,ms)=>PD(p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)},ms);
async function OI(c){const r=await PG('/object_info/'+c);if(r.s!=200)throw Error(c+' '+r.s);return JSON.parse(r.b)}
const CK=async()=>(await OI('CheckpointLoaderSimple')).CheckpointLoaderSimple.input.required.ckpt_name[0][0];
const LR=async()=>(await OI('LoraLoader')).LoraLoader.input.required.lora_name[0];
function WF(a){const n={};n[1]={class_type:'CheckpointLoaderSimple',inputs:{ckpt_name:a.ck}};let M=[1,0],C=[1,1];if(a.lora){n[2]={class_type:'LoraLoader',inputs:{lora_name:a.lora,strength_model:a.lw,strength_clip:a.lw,model:M,clip:C}};M=[2,0];C=[2,1]}n[3]={class_type:'CLIPTextEncode',inputs:{text:a.p,clip:C}};n[4]={class_type:'CLIPTextEncode',inputs:{text:a.n,clip:C}};n[5]={class_type:'EmptyLatentImage',inputs:{width:a.w,height:a.h,batch_size:1}};n[6]={class_type:'KSampler',inputs:{seed:a.sd,steps:a.st,cfg:a.cfg,sampler_name:a.sm,scheduler:'normal',denoise:1,model:M,positive:[3,0],negative:[4,0],latent_image:[5,0]}};n[7]={class_type:'VAEDecode',inputs:{samples:[6,0],vae:[1,2]}};n[8]={class_type:'SaveImage',inputs:{filename_prefix:a.f,images:[7,0]}};return n}
async function GEN(q){const a={p:q.get('p')||'hitori gotoh, bocchi the rock',n:q.get('neg')||'lowres, bad anatomy, worst quality',lora:q.get('lora')||'bocchi_gotoh_xl.safetensors',lw:+(q.get('lw')||0.85),w:+(q.get('w')||832),h:+(q.get('h')||1216),st:+(q.get('steps')||28),cfg:+(q.get('cfg')||6),sm:q.get('sm')||'euler_ancestral',sd:+(q.get('seed')||Math.floor(Math.random()*1e9)),f:q.get('f')||'bot',ck:q.get('ck')||await CK()};const r=await PJ('/prompt',{prompt:WF(a),client_id:'c'});if(r.s!=200)return 'ERR '+r.s+'+'+r.b.slice(0,200);return JSON.parse(r.b).prompt_id}
async function HS(i){const r=await PG('/history/'+i);if(r.s!=200)return{d:0};const e=JSON.parse(r.b)[i];if(!e)return{d:0};const f=[];for(const k in e.outputs)(e.outputs[k].images||[]).forEach(x=>f.push(x.filename));return{d:1,f:f}}
const PV=(p,n)=>'https://'+p+'-8188.proxy.runpod.net/view?filename='+encodeURIComponent(n);
const IM=(p,n)=>'<a target=_blank href="'+PV(p,n)+'"><img src="'+PV(p,n)+'" style="width:31%;margin:1%"></a>';
const HD='<meta name=viewport content="width=device-width,initial-scale=1"><body style="margin:8px;background:#0d0d12;color:#e9e9f2;font:14px system-ui"><h3 style=color:#8fa8ff>CTL</h3>';
const BK='<p><a style=color:#8fa8ff href="?do=ui">戻る</a>';
async function GO(q){const n=Math.min(+(q.get('n')||1),10),p=await ID();let o='';for(let i=0;i<n;i++){const id=await GEN(q);if(id.indexOf('ERR')==0){o+=id+'<br>';break}for(let k=0;k<80;k++){const h=await HS(id);if(h.d){for(const f of h.f){o+='<img src="'+A+'/?do=push&name='+encodeURIComponent(f)+'" width=1 height=1>'+IM(p,f)}break}await new Promise(x=>setTimeout(x,3000))}o+='<br>'}return HD+o+BK}
const U=HD+'<a href="?do=status">状態</a> <a href="?do=start">起動</a> <a href="?do=ready">確認</a> <a href="?do=stop">停止</a> <a href="?do=diag">診断</a> <a href="?do=loras">LoRA</a> <a href="'+A+'/">一覧</a><p><textarea id=p style="width:100%;height:80px;background:#111119;color:#dbe3ff;border:1px solid #262634;border-radius:8px;padding:6px">hitori gotoh, bocchi the rock, pink hair, blue eyes, yellow hair bow, glossy skin, blush</textarea><p><button onclick=gg(1)>生成1</button> <button onclick=gg(5)>生成5</button><script>var PID="";function cbp(v){var m=/id=([A-Za-z0-9]+)/.exec(v);if(m)PID=m[1]}function gg(n){location.href="?do=g&n="+n+"&p="+encodeURIComponent(p.value)+(PID?"&pid="+PID:"")}</script><script src="'+A+'/?do=status&cb=cbp"></script>'+BK;
async function DIA(){let o='pid '+(await ID())+'\n';o+='ready '+(await PG('/system_stats',8000)).s+'\n';try{o+='ckpt '+(await CK())+'\n'}catch(e){o+='ckpt ERR\n'}try{const L=await LR();o+='loras '+L.length+' '+L.slice(0,20).join(',')}catch(e){o+='loras ERR'}return o}
async function LDL(u){if(!u)return 'no url';for(const p of ['/manager/queue/install_model','/api/manager/queue/install_model']){if((await PJ(p,{url:u,type:'loras'},20000)).s==200)return 'OK'}return 'ERR'}
export default{async fetch(e,env){E=env;const q=new URL(e.url).searchParams,d=(q.get('do')||'ui').toLowerCase();P0=q.get('pid')||'';try{switch(d){
case 'ui':return new Response(U,H);
case 'g':return new Response(await GO(q),H);
case 'diag':return new Response(await DIA());
case 'loras':return new Response(JSON.stringify(await LR()));
case 'ckpt':return new Response(await CK());
case 'gen':return new Response(await GEN(q));
case 'loradl':return new Response(await LDL(q.get('url')));
default:return Response.redirect(A+'/?'+q.toString(),302);
}}catch(x){return new Response('ERR '+x.message)}}}