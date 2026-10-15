(() => {
  'use strict';
  if (window.HELLZLoading) return;
  const css = `
  #loading-screen{position:fixed!important;inset:0!important;z-index:9000000!important;display:grid!important;place-items:center!important;background:#080b12!important;color:#eef4ff!important;font-family:Arial,sans-serif!important;overflow:hidden!important}
  #loading-screen::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 25% 25%,#14304580,transparent 52%),radial-gradient(ellipse at 85% 75%,#40231480,transparent 45%),linear-gradient(#ffffff03 1px,transparent 1px),linear-gradient(90deg,#ffffff03 1px,transparent 1px);background-size:auto,auto,64px 64px,64px 64px;pointer-events:none}
  .hz-frame{position:relative;width:min(520px,85vw);text-align:center}.hz-kicker{font:11px monospace;letter-spacing:5px;color:#7a8b9e}.hz-mark{margin:44px auto 30px;width:112px;height:112px;border:1px solid #78dcf588;transform:rotate(45deg);display:grid;place-items:center;box-shadow:0 0 65px #56d6ed18,inset 0 0 30px #56d6ed12}.hz-mark span{transform:rotate(-45deg);font:bold 60px Arial;color:#b9efff;text-shadow:0 0 22px #64e2ff88}.hz-title{font:bold clamp(54px,8vw,92px) Arial;letter-spacing:14px;margin:0 0 6px;padding-left:14px;color:#f1f6ff}.hz-by{font:13px monospace;letter-spacing:6px;color:#e9ac76;margin-bottom:54px}.hz-meta{display:flex;justify-content:space-between;gap:16px;font:12px monospace;color:#8da1b7;text-align:left}.hz-track{height:3px;background:#ffffff12;margin:15px 0 19px;overflow:hidden}.hz-fill{height:100%;width:0;background:linear-gradient(90deg,#5bd4ef,#e8af79);box-shadow:0 0 18px #64d9ff;transition:width .3s}.hz-note{font:11px monospace;color:#62758c;line-height:1.8}.hz-retry{margin-top:18px;padding:10px 22px;background:#ffffff08;border:1px solid #536277;color:white;cursor:pointer}.hz-corner{position:absolute;bottom:24px;left:30px;font:10px monospace;color:#506177;letter-spacing:3px}#cf-turnstile-1,#cf-turnstile-2,#cf-turnstile-3{z-index:9999999!important}
  @media(prefers-reduced-motion:reduce){.hz-fill{transition:none}}
  `;
  let percent = 0, message = 'Preparing client', done = false, timer;
  function mount() {
    if (done) return;
    if (!document.getElementById('hellz-loading-style')) {
      const style = document.createElement('style'); style.id = 'hellz-loading-style'; style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    }
    let root = document.getElementById('loading-screen');
    if (!root) {root = document.createElement('div'); root.id='loading-screen'; (document.body || document.documentElement).appendChild(root);}
    if (!root.querySelector('.hz-frame')) {
      root.innerHTML = '<div class="hz-frame"><div class="hz-kicker">MULTIBOX EXPERIENCE / 3RB</div><div class="hz-mark"><span>H</span></div><h1 class="hz-title">HELLZ</h1><div class="hz-by">by S</div><div class="hz-meta"><span id="ls-message"></span><span id="hz-percent"></span></div><div class="hz-track" role="progressbar" aria-valuemin="0" aria-valuemax="100"><div class="hz-fill"></div></div><div class="hz-note">Preparing your session.<br>Complete the verification below if prompted.</div><button class="hz-retry" hidden>Retry connection</button></div><div class="hz-corner">HELLZ / by S</div>';
      root.querySelector('button').onclick = () => {
        const ws = window.HELLZGame?.WsConnection;
        if (ws?.ip) { const ip=ws.ip; root.querySelector('button').hidden=true; set(80,'Reconnecting'); ws.connect(ip); monitor(); }
        else location.reload();
      };
    }
    root.querySelector('#ls-message').textContent=message;
    root.querySelector('#hz-percent').textContent=percent+'%';
    root.querySelector('.hz-fill').style.width=percent+'%';
    root.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',percent);
  }
  function set(value,text) {if(done)return;percent=Math.max(percent,Math.min(100,value));message=text;mount();}
  function error(text) {set(percent,text);const b=document.querySelector('.hz-retry');if(b)b.hidden=false;}
  function finish() {set(100,'Session ready');done=true;clearInterval(timer);setTimeout(()=>document.getElementById('loading-screen')?.remove(),450);}
  function monitor() {
    clearInterval(timer);const started=Date.now();
    timer=setInterval(()=>{
      const ws=window.HELLZGame?.WsConnection;
      if(ws?.connected) {finish();return;}
      if(ws?.wsOpen) set(88,'Connected · waiting for verification');
      if(Date.now()-started>65000) {clearInterval(timer);error('Connection not ready — retry or inspect Console');}
    },250);
  }
  window.HELLZLoading={mount,set,error,finish,monitor};mount();
})();
