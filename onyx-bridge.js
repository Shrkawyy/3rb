/* ONYX shell on HELLZ native 3rb client. No Senpa assets, JWT, or account tokens are read. */
(() => {
  'use strict';
  if (window.ONYX3RBBridge) return;
  const $ = id => document.getElementById(id);
  const native = id => $(id);
  const menu = $('menu-overlay');
  if (!menu || !native('button-play') || !window.HELLZGame) {
    console.warn('[ONYX bridge] Missing native game interface; ONYX shell not started');
    return;
  }
  // Do not alter the underlying WebSocket, game client, or event handlers.
  const shell = document.createElement('section');
  shell.id = 'onyx-shell';
  shell.setAttribute('aria-label', 'ONYX game menu');
  shell.innerHTML = `
    <div class="ox-stage">
      <div class="ox-bar">
        <button type="button" data-ox-action="settings" aria-label="Settings"><span class="ox-glyph">⚙</span><span>Settings</span></button>
        <div class="ox-nav">
          <button type="button" data-ox-action="play"><span class="ox-glyph">▶</span><span>Play</span></button>
          <button type="button" data-ox-action="spectate"><span class="ox-glyph">◉</span><span>Spectate</span></button>
          <button type="button" data-ox-action="inputs"><span class="ox-glyph">✥</span><span>Inputs</span></button>
          <button type="button" data-ox-action="theme"><span class="ox-glyph">✎</span><span>Theme</span></button>
          <button type="button" data-ox-action="bots"><span class="ox-glyph">⊕</span><span>Bots</span></button>
        </div>
      </div>
      <div class="ox-center-ring"><div class="ox-skin-preview" id="ox-skin-preview" role="img" aria-label="Player skin preview"></div></div>
      <div class="ox-brand">ONYX <small>3RB · ONYX BY S</small></div>
      <form class="ox-fields" id="ox-player-form" autocomplete="off">
        <h3>PLAYER & MULTIBOX</h3>
        <div class="ox-columns"><input id="ox-nick" aria-label="Nick 1" placeholder="Nick 1" maxlength="32" /><input id="ox-nick2" aria-label="Nick 2" placeholder="Nick 2" maxlength="32" /></div>
        <div class="ox-columns" style="margin-top:7px"><input id="ox-skin" aria-label="Skin URL 1" placeholder="Skin URL 1" /><input id="ox-skin2" aria-label="Skin URL 2" placeholder="Skin URL 2" /></div>
        <select class="ox-full" id="ox-servers" aria-label="3rb.io server"><option value="">Loading servers...</option></select>
        <div class="ox-auth" aria-label="Official 3rb.io login">
          <button type="button" data-ox-login="google" data-ox-target="1">Google Connect 1</button>
          <button type="button" data-ox-login="discord" data-ox-target="2">Discord Connect 2</button>
        </div>
        <div id="ox-session" class="ox-session" aria-live="polite">Official 3rb.io session · not signed in</div>
        <div id="ox-tab2-status" class="ox-smallline">Tab 1: none | Tab 2: none</div>
        <div class="ox-subrow"><button class="ox-outline" type="button" data-ox-action="logout">LOG OUT</button></div>
        <p class="ox-help">Google/Discord open 3rb.io official login. A separate game connection requires server acceptance.</p>
      </form>
    </div>`;
  menu.appendChild(shell);
  shell.addEventListener('mousedown', event => event.stopPropagation());
  shell.addEventListener('mouseup', event => event.stopPropagation());
  shell.addEventListener('keydown', event => event.stopPropagation());
  shell.addEventListener('wheel', event => event.stopPropagation());
  $('ox-player-form').addEventListener('submit', e => e.preventDefault());
  const pairs = [ ['ox-nick','nick'],['ox-nick2','nick2'],['ox-skin','skin'],['ox-skin2','skin2'] ];
  for (const [overlayId, originId] of pairs) {
    const shadow=$(overlayId), origin=native(originId);
    if (!shadow || !origin) continue;
    shadow.value = origin.value || '';
    const toOrigin=() => { if(origin.value!==shadow.value){origin.value=shadow.value;origin.dispatchEvent(new Event('input',{bubbles:true}));origin.dispatchEvent(new Event('change',{bubbles:true}));}};
    shadow.addEventListener('input',toOrigin);
    origin.addEventListener('input',()=>{if(document.activeElement!==shadow)shadow.value=origin.value;});
    origin.addEventListener('change',()=>{if(document.activeElement!==shadow)shadow.value=origin.value;});
  }
  function syncSkinPreview() {
    const target=$('ox-skin-preview');
    const source=document.querySelector('#player-data .skin-preview');
    if(!target)return;
    const bg=source ? getComputedStyle(source).backgroundImage : 'none';
    target.style.backgroundImage=(bg && bg!=='none' && !bg.includes('url("")'))
      ? bg : 'url("https://i.imgur.com/nRqSis7.png")';
  }
  for(const id of ['ox-skin','ox-skin2']) {
    $(id)?.addEventListener('blur',()=>{
      const origin=native(id==='ox-skin'?'skin':'skin2');
      if(origin)origin.dispatchEvent(new Event('blur'));
      setTimeout(syncSkinPreview,80);
    });
  }
  syncSkinPreview();
  const shadowServer=$('ox-servers'), originServer=native('servers');
  function copyServers() {
    if (!originServer) return;
    const previous=shadowServer.value;
    const a=Array.from(originServer.options).map(o=>[o.value,o.textContent]);
    const b=Array.from(shadowServer.options).map(o=>[o.value,o.textContent]);
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      shadowServer.replaceChildren(...Array.from(originServer.options).map(o=>o.cloneNode(true)));
    }
    shadowServer.value=originServer.value || previous || '';
  }
  copyServers();
  if (originServer) {
    new MutationObserver(copyServers).observe(originServer,{childList:true,subtree:true,characterData:true,attributes:true});
    originServer.addEventListener('change',copyServers);
  }
  shadowServer.addEventListener('change',()=>{
    if (!originServer)return;
    originServer.value=shadowServer.value;
    originServer.dispatchEvent(new Event('input',{bubbles:true}));
    originServer.dispatchEvent(new Event('change',{bubbles:true}));
  });
  // These two links use the supplied native 3rb client login flow, not Senpa.
  function officialLogin(provider, target) {
    const group=target===2?'account-login2':'account-login';
    const anchor=document.querySelector('#'+group+' a.'+provider);
    if(!anchor) { console.warn('[ONYX bridge] Official '+provider+' login link missing for tab '+target);return false; }
    anchor.click();return true;
  }
  shell.querySelectorAll('[data-ox-login]').forEach(button=>button.addEventListener('click',()=>{
    officialLogin(button.dataset.oxLogin,Number(button.dataset.oxTarget));
  }));
  const actionMap={settings:'button-settings',play:'button-play',spectate:'button-spectate',inputs:'button-inputs',theme:'button-theme'};
  function invokeAction(action) {
    if (actionMap[action])native(actionMap[action])?.click();
    else if(action==='bots'){
      const panel=$('hellz-bots');if(panel){panel.style.display='';panel.querySelector('#hz-collapse')?.click();}
    }
    else if(action==='logout') native('account-status-logout')?.click();
  }
  shell.querySelectorAll('[data-ox-action]').forEach(button=>button.addEventListener('click',()=>invokeAction(button.dataset.oxAction)));
  const botTitle=document.querySelector('#hellz-bots header strong');if(botTitle)botTitle.textContent='ONYX BOTS';
  // MultiSpectate: adds a Mouse > Right click action and a white target box.
  const G=window.HELLZGame;
  const botManager=window.HELLZBots;
  const rightClickOptions=document.querySelector('#mouse .mouse-options[name="rightClick"]');
  if(rightClickOptions && G?.Mouse) {
    if(!rightClickOptions.querySelector('b[value="multiSpectate"]')) {
      const option=document.createElement('b');
      option.setAttribute('value','multiSpectate');
      option.textContent='MultiSpectate';
      const rightArrow=rightClickOptions.querySelector('i.fa-chevron-right');
      rightClickOptions.insertBefore(option,rightArrow||null);
    }
    try { G.Mouse.handleOptions(rightClickOptions,2); } catch(error) { console.warn('[ONYX] Could not refresh right-click options',error); }
  }
  const multiMarker=document.createElement('div');
  multiMarker.id='ox-multispectate-marker';multiMarker.hidden=true;
  document.body.appendChild(multiMarker);
  const multiHud=document.createElement('div');
  multiHud.id='ox-multispectate-hud';multiHud.hidden=true;
  multiHud.textContent='MULTISPECTATE · RIGHT-CLICK TO SET TARGET';
  document.body.appendChild(multiHud);
  const multiActive=()=>G?.Mouse?.rightClick==='multiSpectate';
  document.addEventListener('mousemove',event=>{
    if(multiActive()) {
      multiMarker.hidden=false;multiHud.hidden=false;
      multiMarker.style.left=event.clientX+'px';multiMarker.style.top=event.clientY+'px';
    } else {multiMarker.hidden=true;multiHud.hidden=true;}
  },{passive:true});
  if(G?.Mouse && !G.Mouse.__oxMultiSpectatePatched) {
    const originalMouseClick=G.Mouse.onMouseClick;
    G.Mouse.onMouseClick=function(event) {
      if(event?.which===3 && this.rightClick==='multiSpectate') {
        event.preventDefault();
        this.x=event.clientX;this.y=event.clientY;
        try { this.send(); } catch(error) { console.warn('[ONYX MultiSpectate] Coordinate update failed',error); }
        const x=Number(this.canvasX),y=Number(this.canvasY);
        if(Number.isFinite(x)&&Number.isFinite(y)&&botManager) {
          botManager.target={x,y,screenX:event.clientX,screenY:event.clientY,updatedAt:Date.now()};
          let active=0;
          for(const bot of botManager.bots||[]) {
            if(bot.closed||!bot.clientReady)continue;
            bot.cursor(x,y);active++;
            if(!bot.isAlive && document.getElementById('hz-respawn')?.checked)bot.spawn();
          }
          const status=$('hz-target-status');
          if(status)status.textContent='MultiSpectate target set · '+Math.round(x)+', '+Math.round(y)+' · '+active+' bot(s) updated';
          multiHud.textContent='TARGET SET · '+Math.round(x)+', '+Math.round(y)+' · RIGHT-CLICK TO MOVE';
        } else {
          const status=$('hz-target-status');
          if(status)status.textContent='MultiSpectate: join a game and connect a bot first';
        }
        return;
      }
      return originalMouseClick?.call(this,event);
    };
    G.Mouse.__oxMultiSpectatePatched=true;
  }
  // Session status mirrors only what the native client exposes publicly; no tokens copied.
  setInterval(()=>{
    const originStatus=$('account-status-info'),originTabs=$('account-tab2');
    if(originStatus)$('ox-session').textContent=originStatus.textContent||'Not signed in';
    if(originTabs)$('ox-tab2-status').textContent=originTabs.textContent||'';
    copyServers();
    syncSkinPreview();
  },800);
  window.ONYX3RBBridge={officialLogin,refreshServers:copyServers};
  console.info('[ONYX bridge] Menu enabled; transport remains HELLZ native 3rb, auth remains official 3rb client');
})();
