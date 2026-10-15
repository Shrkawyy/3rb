(async () => {
  'use strict';
  const page=unsafeWindow;
  const BASE='https://3rbio-sigma.vercel.app/';
  const VERSION='hellz-2.0.0';
  const FILES=['index.html','v.js','shield.js','m.js','bots.js'];
  const earlyUI="(() => {\n  'use strict';\n  if (window.HELLZLoading) return;\n  const css = `\n  #loading-screen{position:fixed!important;inset:0!important;z-index:9000000!important;display:grid!important;place-items:center!important;background:#080b12!important;color:#eef4ff!important;font-family:Arial,sans-serif!important;overflow:hidden!important}\n  #loading-screen::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 25% 25%,#14304580,transparent 52%),radial-gradient(ellipse at 85% 75%,#40231480,transparent 45%),linear-gradient(#ffffff03 1px,transparent 1px),linear-gradient(90deg,#ffffff03 1px,transparent 1px);background-size:auto,auto,64px 64px,64px 64px;pointer-events:none}\n  .hz-frame{position:relative;width:min(520px,85vw);text-align:center}.hz-kicker{font:11px monospace;letter-spacing:5px;color:#7a8b9e}.hz-mark{margin:44px auto 30px;width:112px;height:112px;border:1px solid #78dcf588;transform:rotate(45deg);display:grid;place-items:center;box-shadow:0 0 65px #56d6ed18,inset 0 0 30px #56d6ed12}.hz-mark span{transform:rotate(-45deg);font:bold 60px Arial;color:#b9efff;text-shadow:0 0 22px #64e2ff88}.hz-title{font:bold clamp(54px,8vw,92px) Arial;letter-spacing:14px;margin:0 0 6px;padding-left:14px;color:#f1f6ff}.hz-by{font:13px monospace;letter-spacing:6px;color:#e9ac76;margin-bottom:54px}.hz-meta{display:flex;justify-content:space-between;gap:16px;font:12px monospace;color:#8da1b7;text-align:left}.hz-track{height:3px;background:#ffffff12;margin:15px 0 19px;overflow:hidden}.hz-fill{height:100%;width:0;background:linear-gradient(90deg,#5bd4ef,#e8af79);box-shadow:0 0 18px #64d9ff;transition:width .3s}.hz-note{font:11px monospace;color:#62758c;line-height:1.8}.hz-retry{margin-top:18px;padding:10px 22px;background:#ffffff08;border:1px solid #536277;color:white;cursor:pointer}.hz-corner{position:absolute;bottom:24px;left:30px;font:10px monospace;color:#506177;letter-spacing:3px}#cf-turnstile-1,#cf-turnstile-2,#cf-turnstile-3{z-index:9999999!important}\n  @media(prefers-reduced-motion:reduce){.hz-fill{transition:none}}\n  `;\n  let percent = 0, message = 'Preparing client', done = false, timer;\n  function mount() {\n    if (done) return;\n    if (!document.getElementById('hellz-loading-style')) {\n      const style = document.createElement('style'); style.id = 'hellz-loading-style'; style.textContent = css;\n      (document.head || document.documentElement).appendChild(style);\n    }\n    let root = document.getElementById('loading-screen');\n    if (!root) {root = document.createElement('div'); root.id='loading-screen'; (document.body || document.documentElement).appendChild(root);}\n    if (!root.querySelector('.hz-frame')) {\n      root.innerHTML = '<div class=\"hz-frame\"><div class=\"hz-kicker\">MULTIBOX EXPERIENCE / 3RB</div><div class=\"hz-mark\"><span>H</span></div><h1 class=\"hz-title\">HELLZ</h1><div class=\"hz-by\">by S</div><div class=\"hz-meta\"><span id=\"ls-message\"></span><span id=\"hz-percent\"></span></div><div class=\"hz-track\" role=\"progressbar\" aria-valuemin=\"0\" aria-valuemax=\"100\"><div class=\"hz-fill\"></div></div><div class=\"hz-note\">Preparing your session.<br>Complete the verification below if prompted.</div><button class=\"hz-retry\" hidden>Retry connection</button></div><div class=\"hz-corner\">HELLZ / by S</div>';\n      root.querySelector('button').onclick = () => {\n        const ws = window.HELLZGame?.WsConnection;\n        if (ws?.ip) { const ip=ws.ip; root.querySelector('button').hidden=true; set(80,'Reconnecting'); ws.connect(ip); monitor(); }\n        else location.reload();\n      };\n    }\n    root.querySelector('#ls-message').textContent=message;\n    root.querySelector('#hz-percent').textContent=percent+'%';\n    root.querySelector('.hz-fill').style.width=percent+'%';\n    root.querySelector('[role=\"progressbar\"]').setAttribute('aria-valuenow',percent);\n  }\n  function set(value,text) {if(done)return;percent=Math.max(percent,Math.min(100,value));message=text;mount();}\n  function error(text) {set(percent,text);const b=document.querySelector('.hz-retry');if(b)b.hidden=false;}\n  function finish() {set(100,'Session ready');done=true;clearInterval(timer);setTimeout(()=>document.getElementById('loading-screen')?.remove(),450);}\n  function monitor() {\n    clearInterval(timer);const started=Date.now();\n    timer=setInterval(()=>{\n      const ws=window.HELLZGame?.WsConnection;\n      if(ws?.connected) {finish();return;}\n      if(ws?.wsOpen) set(88,'Connected \u00b7 waiting for verification');\n      if(Date.now()-started>65000) {clearInterval(timer);error('Connection not ready \u2014 retry or inspect Console');}\n    },250);\n  }\n  window.HELLZLoading={mount,set,error,finish,monitor};mount();\n})();\n";
  const run=(code,name)=>page.Function(code+'\n//# sourceURL=hellz-'+name).call(page);
  const mount=(html)=>{
    const parsed=new DOMParser().parseFromString(html,'text/html');
    for(const id of ['canvas','loading-screen','menu-overlay','minimap-nodes'])if(!parsed.getElementById(id))throw Error('index.html is missing #'+id);
    document.replaceChild(document.importNode(parsed.documentElement,true),document.documentElement);
  };
  function request(name){return new Promise((resolve,reject)=>GM_xmlhttpRequest({
    method:'GET',url:BASE+name+'?release='+VERSION,timeout:20000,
    onload:r=>{
      if(r.status!==200)return reject(Error(name+': HTTP '+r.status));
      const text=r.responseText||'';
      if(!text.trim()||(name.endsWith('.js')&&/^\s*</.test(text)))return reject(Error(name+': invalid file'));
      resolve(text);
    },onerror:()=>reject(Error(name+': network error')),ontimeout:()=>reject(Error(name+': timeout'))
  }));}
  try{
    run(earlyUI,'loading-ui.js');
    const ui=page.HELLZLoading;ui.set(5,'Loading client files');
    const cache=GM_getValue(VERSION,null);let assets;
    if(cache&&Date.now()-cache.saved<300000&&FILES.every(n=>typeof cache.assets?.[n]==='string')){
      assets=cache.assets;ui.set(55,'Cached client ready');
    }else{
      let finished=0;const entries=await Promise.all(FILES.map(async name=>{
        const text=await request(name);ui.set(5+Math.round(++finished/FILES.length*50),'Loaded '+name);return[name,text];
      }));
      assets=Object.fromEntries(entries);GM_setValue(VERSION,{saved:Date.now(),assets});
    }
    mount(assets['index.html']);ui.mount();ui.set(60,'Building interface');
    run(assets['v.js'],'v.js');ui.set(68,'Libraries ready');
    run(assets['shield.js'],'shield.js');
    await Promise.race([page.__SHIELD__.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Transport initialization timed out')),25000))]);
    ui.set(76,'Transport ready');
    run(assets['m.js'],'m.js');
    if(!page.HELLZGame||typeof page.onload!=='function')throw Error('Client startup is missing');
    const init=page.onload;let started=false;
    page.onload=function(event){if(started)return;started=true;try{init.call(page,event);}catch(error){ui.error(error.message);console.error('[HELLZ]',error);}};
    page.onload(new page.Event('load'));
    run(assets['bots.js'],'bots.js');ui.set(82,'Connecting to game server');ui.monitor();
    page.addEventListener('error',e=>{console.error('[HELLZ]',e.message);if(document.getElementById('loading-screen'))ui.error(e.message);});
  }catch(error){
    console.error('[HELLZ]',error);
    if(page.HELLZLoading)page.HELLZLoading.error(error.message);
    else{const p=document.createElement('pre');p.textContent='HELLZ: '+error.message;(document.body||document.documentElement).appendChild(p);}
  }
})();
