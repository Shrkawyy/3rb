// ==UserScript==
// @name         HELLZ — by S
// @namespace    hellz-3rb
// @version      2.1.0
// @author       HELLZ
// @match        *://3rb.io/*
// @match        *://www.3rb.io/*
// @run-at       document-start
// @noframes
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @connect      3rbio-sigma.vercel.app
// ==/UserScript==
(() => {
  'use strict';
  if (location.pathname !== '/') return;
  window.stop();
  document.open();
  document.write('<!doctype html><html><head><title>HELLZ — by S</title></head><body style="margin:0;background:#080b12;color:#b9efff;display:grid;place-items:center;height:100vh;font:24px Arial"><div style="text-align:center;letter-spacing:8px">HELLZ<div style="font-size:12px;color:#e9ac76;margin-top:12px">by S</div></div></body></html>');
  document.close();
  const fail = message => {
    const box = document.createElement('pre');
    box.style.cssText='position:fixed;bottom:20px;left:20px;white-space:pre-wrap;color:#ffb4a8;font:14px monospace;letter-spacing:0';
    box.textContent='HELLZ: '+message;
    document.body.appendChild(box);
  };
  const launch = code => {
    try {
      new Function('GM_xmlhttpRequest','GM_getValue','GM_setValue','unsafeWindow',code)(GM_xmlhttpRequest,GM_getValue,GM_setValue,unsafeWindow);
    } catch(error) { fail(error.message); }
  };
  const key='hellz-launcher-2.1.0';
  const cached=GM_getValue(key,null);
  if(cached && Date.now()-cached.saved<300000){launch(cached.code);return;}
  GM_xmlhttpRequest({
    method:'GET',
    url:'https://3rbio-sigma.vercel.app/launcher.js?release=2.1.0',
    timeout:20000,
    onload(r){
      if(r.status!==200 || /^\s*</.test(r.responseText||'')){
        fail('Upload the new project files first. launcher.js: HTTP '+r.status);
        return;
      }
      GM_setValue(key,{saved:Date.now(),code:r.responseText});
      launch(r.responseText);
    },
    onerror(){fail('Could not download launcher.js');},
    ontimeout(){fail('launcher.js download timed out');}
  });
})();
