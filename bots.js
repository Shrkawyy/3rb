/* HEL LZ native 3rb adapter. Follow/spawn/split/feed controls ported from the
   supplied bot-client workflow; Delta's wire protocol is not used on 3rb. */
(() => {
  'use strict';
  const G=window.HELLZGame;
  if(!G || window.HELLZBots) return;
  class Bot {
    constructor(name) {
      this.name=name;this.state='Waiting';this.cells=new Map();this.own=new Set();this.authSent=false;this.clientReady=false;
      this._shield={};this._shieldQueue={};this._protoWaiting={1:true};this._protoQueue={1:[]};this._protoSend={};this._protoRecv={};this.packetCount={out:0};this.closed=false;
    }
    get wsOpen(){return this.ws?.readyState===WebSocket.OPEN;}
    get isAlive(){return this.own.size>0;}
    get x(){const c=[...this.own].map(id=>this.cells.get(id)).filter(Boolean);return c.length?c.reduce((s,v)=>s+v.x,0)/c.length:0;}
    get y(){const c=[...this.own].map(id=>this.cells.get(id)).filter(Boolean);return c.length?c.reduce((s,v)=>s+v.y,0)/c.length:0;}
    async connect(url) {
      this.ip=url;this.state='Loading transport';
      try {
        if(!window.__SHIELD__?.ready) throw Error('Native shield is not ready');
        await window.__SHIELD__.ready;
        if(this.closed)return;
        this.ws=new WebSocket(url,'d1elnjtfbyzq7a');this.ws.binaryType='arraybuffer';this.shieldEntry(1);
        this.ws.onopen=()=>{
          this.state='Verifying';this.shieldHello(1);
          this._protoTimer1=setTimeout(()=>{this._protoWaiting[1]=false;this.flushProtoQueue(1);},700);
          this.authenticate();
        };
        this.ws.onmessage=e=>{
          try {
            if(typeof e.data==='string'){this.state='Server message: '+e.data.slice(0,120);return;}
            if(this.shieldHandleFrame(e,1))return;
            if(this._protoWaiting[1]&&this.handleProto(e,1))return;
            this.parse(new DataView(e.data));
          } catch(error){this.stop('Protocol error: '+error.message);}
        };
        this.ws.onclose=e=>this.stop('Closed '+e.code+(e.reason?' · '+e.reason:''));
        this.ws.onerror=()=>{this.state='Network error';};
        this.deadline=setTimeout(()=>{if(!this.clientReady)this.stop('Server did not confirm readiness');},90000);
      } catch(error){this.stop(error.message);}
    }
    async authenticate(){
      try {
        this.send(new Uint8Array([255,0,0]),1);
        // One normal, queued Turnstile challenge per new bot. No token reuse.
        const token=await G.WsConnection.getToken(3);
        if(this.closed)return;
        const bytes=new TextEncoder().encode('ts:'+token);
        const packet=new Uint8Array(bytes.length+3);packet[0]=123;packet[1]=6;packet.set(bytes,2);
        this.send(packet,1);this.authSent=true;this.state='Awaiting server';
        this.ping=setInterval(()=>this.send(new Uint8Array([100]),1),1000);
        this.send(new Uint8Array([1]),1);
      }catch(error){this.stop('Verification failed: '+error.message);}
    }
    parse(view){
      const r=new G.DataReader(view);let op=r.readUInt8();
      if(this._protoRecv[1])op=this._protoRecv[1][op];
      if(this.authSent && [16,17,32,65].includes(op)){
        this.clientReady=true;clearTimeout(this.deadline);this.state=this.isAlive?'Alive':'Ready';
      }
      if(op===32){this.own.add(r.readUInt32());this.state='Alive';}
      else if(op===18){this.cells.clear();this.own.clear();}
      else if(op===20){this.own.clear();}
      else if(op===16){
        const eaten=r.readUInt16();
        for(let i=0;i<eaten;i++){r.readUInt32();const id=r.readUInt32();this.cells.delete(id);this.own.delete(id);}
        let id;
        while((id=r.readUInt32())!==0){
          const cell={id,x:r.readInt32(),y:r.readInt32(),radius:r.readUInt16()};
          const flags=r.readUInt16();cell.isVirus=!!(flags&1);
          if(flags&16){r.readUInt32();r.readUInt8();}
          if(flags&64)r.readInt32();
          if(flags&2){r.readUInt8();r.readUInt8();r.readUInt8();}
          if(flags&4)r.readStringZeroUtf8();
          if(flags&8)r.readStringZeroUtf8();
          if(flags&128)r.readStringZeroUtf8();
          this.cells.set(id,cell);
        }
        const removed=r.readUInt16();
        for(let i=0;i<removed;i++){const id=r.readUInt32();this.cells.delete(id);this.own.delete(id);}
        if(this.clientReady)this.state=this.isAlive?'Alive':'Ready';
      }
    }
    spawn(){
      if(!this.clientReady||this.isAlive||Date.now()-(this.lastSpawn||0)<2000)return;
      this.lastSpawn=Date.now();
      const encoded=unescape(encodeURIComponent(this.name));
      const json=JSON.stringify({n:encoded});const p=new Uint8Array(json.length+2);
      for(let i=0;i<json.length;i++)p[i+1]=json.charCodeAt(i);this.send(p,1);this.state='Spawn requested';
    }
    cursor(x,y){if(!this.clientReady||!Number.isFinite(x)||!Number.isFinite(y))return;const v=new DataView(new ArrayBuffer(17));v.setUint8(0,16);v.setFloat64(1,x,true);v.setFloat64(9,y,true);this.send(v.buffer,1);}
    split(){if(this.clientReady&&this.isAlive)this.send(new Uint8Array([17]),1);}
    feed(){if(this.clientReady&&this.isAlive)this.send(new Uint8Array([21]),1);}
    stop(reason='Stopped'){
      if(this.closed)return;this.closed=true;this.clientReady=false;this.state=reason;this.ip=null;
      clearInterval(this.ping);clearTimeout(this.deadline);clearTimeout(this._protoTimer1);
      if(this.ws){this.ws.onopen=this.ws.onmessage=this.ws.onclose=this.ws.onerror=null;try{this.ws.close();}catch{}}
      this.resetShield(1);this._protoQueue[1]=[];this.cells.clear();this.own.clear();
    }
    ["shieldEntry"](slot) {
      if (!this._shield) this._shield = {};
      if (!this._shieldQueue) this._shieldQueue = {};
      if (!this._shield[slot]) {
        this._shield[slot] = { session: null, established: false };
      }
      return this._shield[slot];
    }
    ["shieldReadyPromise"](timeout = 15000) {
      return new Promise((resolve) => {
        if (window.__SHIELD__ && window.__SHIELD__.ready) {
          return resolve(window.__SHIELD__);
        }
        const started = Date.now();
        const poll = () => {
          if (window.__SHIELD__ && window.__SHIELD__.ready) {
            return resolve(window.__SHIELD__);
          }
          if (Date.now() - started > timeout) {
            return resolve(window.__SHIELD__ || null);
          }
          setTimeout(poll, 100);
        };
        poll();
      });
    }
    ["shieldHello"](slot) {
      this.shieldReadyPromise()
        .then((sh) => {
          if (!sh || !sh.ready || !this.ip) return;
          const entry = this._shield && this._shield[slot];
          if (!entry || entry.session) return;
          let session;
          try {
            session = new sh.ShieldSession(sh.shield_build_id());
          } catch (e) {
            console.log("[HELLZ Bots] shield session error (tab " + slot + ")", e);
            return;
          }
          entry.session = session;
          let hello = null;
          try {
            hello = session.hello();
          } catch (e) {
            console.log("[HELLZ Bots] shield hello error (tab " + slot + ")", e);
            return;
          }
          const socket = 1 === slot ? this.ws : 2 === slot ? this.ws2 : this.ws3;
          if (socket && socket.readyState === socket.OPEN) {
            socket.send(hello);
            console.log("[HELLZ Bots] shield hello sent (tab " + slot + ") len=" + hello.length);
          }
        })
        .catch((e) => console.log("[HELLZ Bots] shield hello failed (tab " + slot + ")", e));
    }
    ["flushShieldQueue"](slot) {
      const q = (this._shieldQueue && this._shieldQueue[slot]) || [];
      if (this._shieldQueue) this._shieldQueue[slot] = [];
      for (const p of q) {
        this.send(p, slot);
      }
    }
    ["resetShield"](slot) {
      if (this._shield && this._shield[slot]) {
        const entry = this._shield[slot];
        if (entry.session && entry.session.free) {
          try {
            entry.session.free();
          } catch (e) {}
        }
        this._shield[slot] = null;
      }
      if (this._shieldQueue) this._shieldQueue[slot] = [];
    }
    ["shieldHandleFrame"](ev, slot) {
      const entry = this._shield && this._shield[slot];
      if (!entry || !entry.session) return false;
      const raw = new Uint8Array(ev.data);
      if (!raw.length) return false;
      const first = raw[0];
      if (209 === first) {
        
        try {
          entry.session.onHelloAck(raw, "");
        } catch (e) {
          console.log("[HELLZ Bots] shield onHelloAck error (tab " + slot + ")", e);
          return true;
        }
        entry.established = true;
        if (this._protoWaiting && this._protoWaiting[slot]) {
          this._protoWaiting[slot] = false;
          clearTimeout(this["_protoTimer" + slot]);
          this.flushProtoQueue(slot);
        }
        this.flushShieldQueue(slot);
        console.log("[HELLZ Bots] shield established (tab " + slot + ")");
        if (1 === slot) {
          this.tab1Authed = true;
          /* Each bot has its own connection. */
        }
        return true;
      }
      if (210 === first) {
        
        let inner;
        try {
          inner = entry.session.open(raw);
        } catch (e) {
          console.log("[HELLZ Bots] shield open error (tab " + slot + ")", e);
          return true;
        }
        if (inner && inner.length > 1 && 212 === inner[0]) {
          
          try {
            const sh = window.__SHIELD__;
            const attest = sh.shield_attest(() => 0, inner.subarray(1));
            this.send(attest, slot);
            console.log("[HELLZ Bots] shield attestation answered (tab " + slot + ")");
          } catch (e) {
            console.log("[HELLZ Bots] shield attest error (tab " + slot + ")", e);
          }
          return true;
        }
        if (inner && inner.length && 123 === inner[0]) {
          try {
            JSON.parse(new TextDecoder().decode(inner));
          } catch (e) {}
          return true;
        }
        if (inner && inner.length) {
          const dv = new DataView(inner.buffer, inner.byteOffset, inner.byteLength);
          this.parse(dv);
        }
        return true;
      }
      return false;
    }
    
    
    
    
    
    
    
    ["send"](acr, yj) {
      if (ArrayBuffer.isView(acr)) acr = acr.buffer.slice(acr.byteOffset, acr.byteOffset + acr.byteLength);
      this.packetCount.out++;
      if (this._protoWaiting && this._protoWaiting[yj]) {
        (this._protoQueue[yj] = this._protoQueue[yj] || []).push(acr);
        return;
      }
      let payload = acr;
      if (this._protoSend && this._protoSend[yj]) {
        const remap = new Uint8Array(acr.byteLength);
        remap.set(new Uint8Array(acr));
        remap[0] = this._protoSend[yj][remap[0]];
        payload = remap.buffer;
      }
      
      
      
      const entry = this._shield && this._shield[yj];
      if (entry) {
        if (!entry.session || !entry.established) {
          (this._shieldQueue[yj] = this._shieldQueue[yj] || []).push(payload);
          return;
        }
        try {
          payload = entry.session.seal(new Uint8Array(payload));
        } catch (e) {
          console.log("[HELLZ Bots] shield seal error (tab " + yj + ")", e);
        }
      }
      if (1 === yj && this.wsOpen) {
        this.ws.send(payload);
      } else if (2 === yj && this.ws2Open) {
        this.ws2.send(payload);
      } else if (3 === yj && this.ws3Open) {
        this.ws3.send(payload);
      }
    }
    ["handleProto"](alh, adu) {
      const raw = new Uint8Array(alh.data);
      if (240 !== raw[0] || 546 !== raw.length || 1 !== raw[1]) {
        
        
        this._protoWaiting[adu] = false;
        this._protoSend[adu] = null;
        this._protoRecv[adu] = null;
        clearTimeout(this["_protoTimer" + adu]);
        this.flushProtoQueue(adu);
        console.log("[proto] Tab " + adu + ": legacy (no opcode map)");
        return false;
      }
      
      const sm = new Uint8Array(256);
      const rm = new Uint8Array(256);
      for (let r = 0; r < 256; r++) {
        sm[r] = raw[18 + r];
        rm[raw[274 + r]] = r;
      }
      this._protoSend[adu] = sm;
      this._protoRecv[adu] = rm;
      this._protoWaiting[adu] = false;
      clearTimeout(this["_protoTimer" + adu]);
      console.log("[proto] Tab " + adu + ": MapInit applied, opcode remap active");
      
      
      const ack = new Uint8Array(17);
      ack[0] = 241;
      ack.set(raw.subarray(530, 546), 1);
      const ws = 1 === adu ? this.ws : 2 === adu ? this.ws2 : this.ws3;
      if (ws && ws.readyState === ws.OPEN) {
        ws.send(ack.buffer);
      }
      this.flushProtoQueue(adu);
      return true;
    }
    ["flushProtoQueue"](adu) {
      const q = this._protoQueue[adu] || [];
      this._protoQueue[adu] = [];
      for (const p of q) {
        this.send(p, adu);
      }
    }  }
  const manager={bots:[],generation:0,connecting:false};window.HELLZBots=manager;
  const style=document.createElement('style');style.textContent=`
  #hellz-bots{position:fixed;right:16px;top:90px;z-index:8000000;width:290px;border:1px solid #39505f;background:#101720f2;color:#dcebf4;border-radius:12px;font:12px Arial;box-shadow:0 10px 40px #0009;overflow:hidden}
  #hellz-bots header{display:flex;justify-content:space-between;padding:14px 16px;background:#182431;letter-spacing:2px;color:#82dcec}#hellz-bots button{background:#233848;border:1px solid #426070;color:#dff6ff;border-radius:5px;padding:7px 10px;cursor:pointer}#hellz-bots button:disabled{opacity:.5;cursor:wait}#hellz-bots .hz-controls{padding:14px}#hellz-bots input,#hellz-bots select{background:#0b121b;color:#dff6ff;border:1px solid #364d5e;padding:7px;max-width:130px;border-radius:4px}#hellz-bots label{display:flex;align-items:center;justify-content:space-between;margin:10px 0;gap:8px}#hellz-bots .hz-actions{display:flex;gap:6px;margin:10px 0;flex-wrap:wrap}#hellz-bots .hz-list{max-height:150px;overflow:auto;font:11px monospace;line-height:1.7;color:#a8becb}#hellz-bots .hz-list div{border-top:1px solid #ffffff0d;padding:5px 0}#hellz-bots small{display:block;color:#8096a8;line-height:1.6}`;
  document.head.appendChild(style);
  const root=document.createElement('section');root.id='hellz-bots';root.innerHTML=`<header><strong>HELLZ BOTS</strong><button id="hz-collapse" aria-label="Toggle bot panel">−</button></header><div class="hz-controls"><small>by S · native 3rb transport</small><label>Name<input id="hz-botname" value="HELLZ" maxlength="24"></label><label>Count<input id="hz-count" type="number" min="1" max="10" value="1"></label><label>Follow<select id="hz-follow"><option value="mouse">Mouse</option><option value="player">Player</option><option value="off">Off</option></select></label><label>Auto spawn / respawn<input id="hz-respawn" type="checkbox" checked></label><label>Auto split<input id="hz-split-auto" type="checkbox"></label><div class="hz-actions"><button id="hz-connect">Connect</button><button id="hz-stop">Stop all</button></div><div class="hz-actions"><button id="hz-spawn">Spawn</button><button id="hz-split">Split</button><button id="hz-feed">Feed</button></div><small id="hz-summary">No bots connected</small><div class="hz-list"></div><small>Each connection requires server acceptance and normal verification. Spawn location is chosen by the server.</small></div>`;
  document.body.appendChild(root);const $=id=>root.querySelector('#'+id);
  for(const e of ['mousedown','mouseup','wheel','keydown','keyup','click','dblclick'])root.addEventListener(e,event=>event.stopPropagation());
  $('hz-collapse').onclick=()=>{const body=root.querySelector('.hz-controls');body.hidden=!body.hidden;$('hz-collapse').textContent=body.hidden?'+':'−';};
  const stop=()=>{manager.generation++;manager.connecting=false;$('hz-connect').disabled=false;manager.bots.forEach(b=>b.stop());};
  $('hz-stop').onclick=stop;
  $('hz-connect').onclick=async()=>{
    const url=G.WsConnection.ip;
    if(!url||!G.WsConnection.connected){$('hz-summary').textContent='Join a game server first';return;}
    if(manager.connecting)return;
    manager.connecting=true;$('hz-connect').disabled=true;const generation=++manager.generation;
    manager.bots=manager.bots.filter(b=>!b.closed);
    const count=Math.min(10-manager.bots.length,Math.max(1,Number($('hz-count').value)||1));
    for(let i=0;i<count&&generation===manager.generation;i++){
      const bot=new Bot(($('hz-botname').value||'HELLZ')+' '+(manager.bots.length+1));manager.bots.push(bot);bot.connect(url);
      // Serialize challenges and stop the batch after a rejected connection.
      while(!bot.clientReady&&!bot.closed&&generation===manager.generation)await new Promise(r=>setTimeout(r,250));
      if(bot.closed)break;
    }
    if(generation===manager.generation){manager.connecting=false;$('hz-connect').disabled=false;}
  };
  $('hz-spawn').onclick=()=>manager.bots.forEach(b=>b.spawn());
  $('hz-split').onclick=()=>manager.bots.forEach(b=>b.split());
  $('hz-feed').onclick=()=>manager.bots.forEach(b=>b.feed());
  let step=0;
  setInterval(()=>{
    const current=G.WsConnection.ip;
    for(const b of manager.bots){
      if(b.closed)continue;
      if(b.ip!==current){b.stop('Server changed');continue;}
      if($('hz-respawn').checked)b.spawn();
      const follow=$('hz-follow').value;
      if(follow==='mouse')b.cursor(G.Mouse.canvasX,G.Mouse.canvasY);
      else if(follow==='player'&&G.Player.isAlive)b.cursor(G.Player.x,G.Player.y);
      if($('hz-split-auto').checked&&step%5===0)b.split();
    }
    if(step++%5===0){
      $('hz-summary').textContent=manager.bots.filter(b=>b.clientReady).length+' ready / '+manager.bots.filter(b=>b.isAlive).length+' alive';
      const list=root.querySelector('.hz-list');list.replaceChildren();
      for(const b of manager.bots){const row=document.createElement('div');row.textContent=b.name+' · '+b.state;list.appendChild(row);}
    }
  },100);
  window.addEventListener('beforeunload',stop);
})();
