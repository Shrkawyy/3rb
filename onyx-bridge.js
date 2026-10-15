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
      <div class="ox-center-ring"><img src="https://3rbio-sigma.vercel.app/onyx-assets/ryuten-logo-full.webp" alt="ONYX emblem" /></div>
      <div class="ox-brand">ONYX <small>3RB · ONYX BY S</small></div>
      <form class="ox-fields" id="ox-player-form" autocomplete="off">
        <h3>PLAYER & MULTIBOX</h3>
        <div class="ox-columns"><input id="ox-nick" aria-label="Nick 1" placeholder="Nick 1" maxlength="32" /><input id="ox-nick2" aria-label="Nick 2" placeholder="Nick 2" maxlength="32" /></div>
        <div class="ox-columns" style="margin-top:7px"><input id="ox-skin" aria-label="Skin URL 1" placeholder="Skin URL 1" /><input id="ox-skin2" aria-label="Skin URL 2" placeholder="Skin URL 2" /></div>
        <select class="ox-full" id="ox-servers" aria-label="3rb.io server"><option value="">Loading servers...</option></select>
        <div class="ox-auth" aria-label="Official 3rb.io login">
          <button type="button" data-ox-login="google" data-ox-target="1">Google / Main</button>
          <button type="button" data-ox-login="discord" data-ox-target="1">Discord / Main</button>
          <button type="button" data-ox-login="google" data-ox-target="2">Google / Tab 2</button>
          <button type="button" data-ox-login="discord" data-ox-target="2">Discord / Tab 2</button>
        </div>
        <div id="ox-session" class="ox-session" aria-live="polite">Official 3rb.io session · not signed in</div>
        <div id="ox-tab2-status" class="ox-smallline">Tab 1: none | Tab 2: none</div>
        <div class="ox-subrow"><button class="ox-outline" type="button" data-ox-action="accounts">BOT ACCOUNTS · 30</button><button class="ox-outline" type="button" data-ox-action="logout">LOG OUT</button></div>
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
  // These four links belong to the supplied native 3rb client, not Senpa.
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
    else if(action==='accounts') openAccounts();
    else if(action==='logout') native('account-status-logout')?.click();
  }
  shell.querySelectorAll('[data-ox-action]').forEach(button=>button.addEventListener('click',()=>invokeAction(button.dataset.oxAction)));
  const accounts=document.createElement('section');
  accounts.id='onyx-accounts';accounts.hidden=true;accounts.setAttribute('role','dialog');accounts.setAttribute('aria-modal','true');accounts.setAttribute('aria-label','ONYX bot account slots');
  accounts.innerHTML=`<div class="oxa-dialog" role="document"><header><h2>ONYX · ACCOUNTS 30</h2><button id="oxa-close" type="button">CLOSE ✕</button></header>
    <p>15 Google + 15 Discord account positions. These are placeholders, not authenticated bot accounts. Official login in this browser may replace the currently signed-in game account. No passwords, cookies, or tokens are collected here.</p>
    <h3>GOOGLE · 01 — 15</h3><div class="oxa-grid" id="oxa-google"></div>
    <h3>DISCORD · 16 — 30</h3><div class="oxa-grid" id="oxa-discord"></div>
    <div class="oxa-footer"><p id="oxa-feedback" aria-live="polite">Slots are not authenticated. Bot connections remain controlled by the game's session and server policy.</p></div></div>`;
  document.body.appendChild(accounts);
  accounts.querySelector('#oxa-close').addEventListener('click',()=>accounts.hidden=true);
  accounts.addEventListener('mousedown',e=>e.stopPropagation());
  accounts.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')accounts.hidden=true;});
  accounts.addEventListener('click',e=>{if(e.target===accounts)accounts.hidden=true;e.stopPropagation();});
  for (let id=1;id<=30;id++) {
    const provider=id<=15?'google':'discord';
    const row=document.createElement('div');row.className='oxa-slot';
    const label=document.createElement('span');label.className='oxa-label';label.textContent=provider.toUpperCase()+' · '+String(id).padStart(2,'0');
    const status=document.createElement('span');status.className='oxa-status';status.textContent='No verified bot session';
    const btn=document.createElement('button');btn.type='button';btn.textContent='Official sign-in';
    btn.addEventListener('click',()=>{
      const opened=officialLogin(provider,1);
      status.textContent=opened?'Official login opened; not linked to bot':'Login unavailable';
      accounts.querySelector('#oxa-feedback').textContent=opened
        ? '3rb.io sign-in was opened. This browser does not provide 30 independently verified account sessions through this flow; no bot was connected.'
        : 'Official login could not be opened. Please check the console and popup settings.';
    });
    row.append(label,status,btn);accounts.querySelector('#oxa-'+provider).appendChild(row);
  }
  function openAccounts(){accounts.hidden=false;accounts.querySelector('#oxa-close').focus();}
  // Provide a single entry point in existing bot panel instead of a second fake login manager.
  const oldPane=document.querySelector('#hellz-bots .hz-accounts');
  if(oldPane){oldPane.innerHTML='';const b=document.createElement('button');b.type='button';b.textContent='OPEN 30 GOOGLE / DISCORD SLOTS';b.style.margin='14px';b.addEventListener('click',openAccounts);oldPane.appendChild(b);
    const p=document.createElement('p');p.className='hz-accounts-note';p.textContent='15 Google + 15 Discord. Official game login only; individual bot authentication is not implemented.';oldPane.appendChild(p);}
  const botTitle=document.querySelector('#hellz-bots header strong');if(botTitle)botTitle.textContent='ONYX BOTS';
  // Session status mirrors only what the native client exposes publicly; no tokens copied.
  setInterval(()=>{
    const originStatus=$('account-status-info'),originTabs=$('account-tab2');
    if(originStatus)$('ox-session').textContent=originStatus.textContent||'Not signed in';
    if(originTabs)$('ox-tab2-status').textContent=originTabs.textContent||'';
    copyServers();
  },1200);
  window.ONYX3RBBridge={openAccounts,officialLogin,refreshServers:copyServers};
  console.info('[ONYX bridge] Menu enabled; transport remains HELLZ native 3rb, auth remains official 3rb client');
})();
