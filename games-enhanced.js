/* Pantalla Focus · Neon Campus 2D
   A small educational adventure engine: central map, avatar customization,
   keyboard/touch movement, running, jump feedback, four cognitive zones,
   animated mission briefings and persistent results. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const menu = $('#game-menu');
  const container = $('#game-container');
  const host = $('#game-canvas-wrap');
  if (!menu || !container || !host) return;

  const zones = {
    attention: {
      title: 'Ciutat de l’Atenció', tag: 'ATENCIÓ', icon: '🎯', color: '#61f5c4',
      desc: 'Troba els senyals objectiu mentre recorres la ciutat i ignora els distractors.',
      skill: 'Atenció selectiva i sostinguda', goal: 'Troba 8 senyals ◆.',
      tip: 'Busca els ◆ verds. Els símbols taronja són distractors.',
    },
    numbers: {
      title: 'Volcà dels Números', tag: 'MEMÒRIA NUMÈRICA', icon: '🔢', color: '#6fe7ff',
      desc: 'Observa una seqüència de números, deixa que desaparegui i reconstrueix-la en ordre.',
      skill: 'Memòria de treball i seqüenciació', goal: 'Repeteix la seqüència sencera.',
      tip: 'Llegeix la seqüència d’esquerra a dreta i agrupa mentalment els números.',
    },
    words: {
      title: 'Illes de Paraules', tag: 'MEMÒRIA VERBAL', icon: '📚', color: '#c79cff',
      desc: 'Memoritza una llista de paraules i recupera-les després d’un petit interval.',
      skill: 'Memòria verbal i recuperació', goal: 'Selecciona totes les paraules recordades.',
      tip: 'Relaciona les paraules amb una història o imatge mental.',
    },
    visual: {
      title: 'Temple dels Patrons', tag: 'SEQÜÈNCIA VISUAL', icon: '🧩', color: '#ffd36f',
      desc: 'Observa un patró de llums i reprodueix-lo en el mateix ordre, com un Simon Says.',
      skill: 'Memòria visual i control de seqüències', goal: 'Completa totes les rondes del patró.',
      tip: 'Repeteix el patró sense pressa. Cada ronda afegeix una casella.',
    }
  };

  const avatars = [
    { id: 'nova', name: 'Nova', emoji: '🧭', body: '#6fe7ff' },
    { id: 'pixel', name: 'Pixel', emoji: '🤖', body: '#7df59b' },
    { id: 'luna', name: 'Luna', emoji: '🚀', body: '#d4a4ff' },
    { id: 'orbit', name: 'Orbit', emoji: '🧠', body: '#ffd36f' }
  ];

  let canvas, ctx, world, overlay;
  let running = false, raf = 0, last = 0, paused = false;
  let keys = new Set(), touchDir = { x: 0, y: 0 }, sprint = false;
  let avatar = avatars[0];
  let player = { x: 0, y: 0, vx: 0, vy: 0, jump: 0, jumpV: 0 };
  let activeZone = null, score = 0, zoneStarted = 0, difficulty = 1;
  let resultsSaved = new Set();

  const worldW = 1600, worldH = 980;
  const portals = [
    { id: 'attention', x: 330, y: 280, w: 250, h: 180, label: 'CIUTAT DE L’ATENCIÓ' },
    { id: 'numbers', x: 1020, y: 275, w: 250, h: 180, label: 'VOLCÀ DELS NÚMEROS' },
    { id: 'words', x: 330, y: 650, w: 250, h: 180, label: 'ILLES DE PARAULES' },
    { id: 'visual', x: 1020, y: 650, w: 250, h: 180, label: 'TEMPLE DELS PATRONS' }
  ];

  const CSS = `
  #pf-world{position:relative;width:100%;min-height:720px;border-radius:24px;overflow:hidden;background:#06101d;color:#effaff;border:1px solid #2c526a;box-shadow:0 25px 80px #0008;isolation:isolate}
  #pf-canvas{display:block;width:100%;height:650px;touch-action:none;background:#06101d}
  .pf-hud{position:absolute;top:12px;left:12px;right:12px;display:flex;align-items:flex-start;gap:8px;z-index:4;pointer-events:none}.pf-hud>*{pointer-events:auto}
  .pf-chip{background:#061422ed;border:1px solid #6de6ff55;border-radius:13px;padding:7px 10px;font-size:10px;backdrop-filter:blur(10px);min-width:94px}.pf-chip b{display:block;color:#7ceaff;font-size:14px;margin-top:2px}
  .pf-hud-spacer{flex:1}.pf-btn{border:1px solid #77e6ff55;background:#0b263ce8;color:#fff;border-radius:11px;padding:9px 12px;font-weight:800;min-height:42px;cursor:pointer}.pf-btn.danger{border-color:#ff8f8f66;background:#2b1620e8}
  .pf-tip{position:absolute;left:50%;top:76px;transform:translateX(-50%);max-width:min(760px,84%);text-align:center;background:#061421e8;border:1px solid #77e6ff44;border-radius:14px;padding:9px 13px;font-size:11px;z-index:3;pointer-events:none}
  .pf-inventory{position:absolute;left:12px;bottom:12px;background:#061422e8;border:1px solid #77e6ff44;border-radius:13px;padding:9px 11px;font-size:11px;z-index:3}.pf-inventory b{color:#7ceaff}
  .pf-controls{position:absolute;right:16px;bottom:15px;display:grid;grid-template-columns:repeat(3,52px);grid-template-rows:repeat(3,52px);gap:7px;z-index:5}.pf-controls button,.pf-action{border:1px solid #7be7ff66;background:#0b263ce8;color:#fff;border-radius:14px;min-width:52px;min-height:52px;font-size:19px;touch-action:none;cursor:pointer;user-select:none}.pf-controls [data-m=up]{grid-column:2}.pf-controls [data-m=left]{grid-column:1;grid-row:2}.pf-controls [data-m=down]{grid-column:2;grid-row:2}.pf-controls [data-m=right]{grid-column:3;grid-row:2}.pf-action{grid-column:1/4;font-size:11px;font-weight:900;letter-spacing:.5px}.pf-sprint{grid-column:1/4;font-size:10px!important}.pf-sprint.active{background:#a6ff5233;border-color:#a6ff52;color:#a6ff52}
  .pf-overlay{position:absolute;inset:0;background:#020a13eF;backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:14px;text-align:center;z-index:20;overflow:auto}.pf-overlay[hidden]{display:none!important}
  .pf-card{width:min(780px,100%);max-height:calc(100% - 8px);overflow:auto;background:linear-gradient(145deg,#112d47,#091626);border:1px solid #6de7ff66;border-radius:24px;padding:20px;box-shadow:0 25px 90px #000b}.pf-avatar-big{font-size:58px;line-height:1;animation:pf-bob 2s ease-in-out infinite}.pf-card h2{font-size:clamp(24px,4vw,36px);margin:8px}.pf-card p{color:#c2d5e4;line-height:1.5}.pf-tag{font-size:10px;letter-spacing:1.6px;font-weight:900;color:#7ceaff;margin-top:8px}.pf-intro-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.pf-step{padding:10px;border-radius:14px;background:#081a2b;border:1px solid #5ddfff2d;min-height:86px;display:flex;flex-direction:column;justify-content:center}.pf-step span{font-size:23px}.pf-step b{display:block;color:#7ceaff;font-size:11px;margin:3px 0}.pf-step small{font-size:10px;color:#c2d5e4}.pf-benefit{background:#081a2b;border:1px solid #5ddfff33;border-radius:14px;padding:10px 12px;margin:10px 0;text-align:left;font-size:12px}.pf-benefit p{margin:4px 0 8px;font-size:11px}.pf-primary{background:linear-gradient(100deg,#18b8c5,#7469f7);border:0;color:#fff;padding:13px 22px;border-radius:14px;font-weight:900;cursor:pointer;min-height:50px;width:min(100%,460px);touch-action:manipulation}.pf-secondary{background:#10283b;border:1px solid #5b7788;color:#fff;padding:11px 18px;border-radius:12px;font-weight:800;cursor:pointer}.pf-actions{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:12px}
  .pf-brief-anim{height:5px;background:#102a40;border-radius:99px;overflow:hidden;margin:9px 0}.pf-brief-anim i{display:block;height:100%;width:35%;background:linear-gradient(90deg,#19d3c5,#806cff);animation:pf-progress 2s ease-in-out infinite}
  .pf-minigame{display:grid;gap:14px}.pf-seq,.pf-word-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:9px}.pf-number,.pf-word{background:#102a42;border:1px solid #5ddfff55;color:#fff;border-radius:11px;padding:11px 14px;min-width:52px;cursor:pointer;font-weight:800}.pf-number:active,.pf-word:active{transform:scale(.97)}.pf-memory-seq{font-size:clamp(27px,6vw,46px);font-weight:900;letter-spacing:9px;color:#7ceaff;min-height:58px;display:grid;place-items:center}.pf-pattern-grid{display:grid;grid-template-columns:repeat(3,72px);gap:10px;justify-content:center}.pf-pattern-cell{width:72px;height:72px;border-radius:16px;border:1px solid #5d7280;background:#102538;cursor:pointer;transition:.12s}.pf-pattern-cell.active{transform:scale(1.06);box-shadow:0 0 30px currentColor;border-color:currentColor}.pf-pattern-cell:disabled{cursor:default;opacity:.8}.pf-big-status{font-weight:900;font-size:17px;min-height:26px}.pf-choice{padding:10px 13px;border-radius:11px;background:#102a42;border:1px solid #5ddfff55;color:#fff;cursor:pointer}.pf-choice.selected{background:#19b8c5;color:#06101d}.pf-progress-bar{height:7px;background:#102a40;border-radius:99px;overflow:hidden}.pf-progress-bar i{display:block;height:100%;background:#7ceaff;width:0;transition:.25s}
  @keyframes pf-bob{50%{transform:translateY(-8px) rotate(3deg)}} @keyframes pf-progress{50%{width:92%}}
  @media(max-width:760px){#pf-world{min-height:760px}#pf-canvas{height:690px}.pf-hud{flex-wrap:wrap}.pf-chip{min-width:76px}.pf-hud-spacer{display:none}.pf-tip{top:118px;max-width:92%}.pf-intro-grid{grid-template-columns:1fr}.pf-step{min-height:58px}.pf-card{padding:14px;border-radius:19px}.pf-controls{right:12px;bottom:12px}.pf-inventory{bottom:12px;max-width:42%}.pf-pattern-grid{grid-template-columns:repeat(3,58px)}.pf-pattern-cell{width:58px;height:58px}}
  @media(prefers-reduced-motion:reduce){.pf-avatar-big,.pf-brief-anim i{animation:none}}
  `;
  const style = document.createElement('style'); style.textContent = CSS; document.head.append(style);

  function makeWorld() {
    world = document.createElement('div'); world.id = 'pf-world';
    world.innerHTML = `
      <canvas id="pf-canvas" aria-label="Mapa interactiu de Pantalla Focus"></canvas>
      <div class="pf-hud">
        <div class="pf-chip">PUNTUACIÓ<b id="pf-score">0</b></div>
        <div class="pf-chip">ZONA<b id="pf-zone">MAPA CENTRAL</b></div>
        <div class="pf-chip">AVATAR<b id="pf-avatar-name">Nova</b></div>
        <div class="pf-hud-spacer"></div>
        <button class="pf-btn" id="pf-pause" type="button">PAUSA</button>
        <button class="pf-btn danger" id="pf-exit" type="button">SORTIR</button>
      </div>
      <div class="pf-tip" id="pf-tip">Explora el campus. Acosta’t a una zona i prem ENTER o toca-la.</div>
      <div class="pf-inventory">🎒 <b>AVATAR</b> · <span id="pf-inventory">Nova · 🧭</span></div>
      <div class="pf-controls" aria-label="Controls tàctils"><button type="button" data-m="up">↑</button><button type="button" data-m="left">←</button><button type="button" data-m="down">↓</button><button type="button" data-m="right">→</button><button type="button" class="pf-action" id="pf-action">ENTRAR / SALTAR</button><button type="button" class="pf-sprint" id="pf-sprint">CORRER</button></div>
      <div class="pf-overlay" id="pf-overlay" hidden></div>
    `;
    host.replaceChildren(world);
    canvas = $('#pf-canvas', world); ctx = canvas.getContext('2d'); overlay = $('#pf-overlay', world);
  }

  function roundRectPath(c,x,y,w,h,r){
    const rr=Math.min(r,w/2,h/2);
    c.beginPath();
    c.moveTo(x+rr,y); c.lineTo(x+w-rr,y); c.quadraticCurveTo(x+w,y,x+w,y+rr);
    c.lineTo(x+w,y+h-rr); c.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);
    c.lineTo(x+rr,y+h); c.quadraticCurveTo(x,y+h,x,y+h-rr);
    c.lineTo(x,y+rr); c.quadraticCurveTo(x,y,x+rr,y);
    c.closePath();
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function shuffleIndexes(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function setTip(t){$('#pf-tip',world).textContent=t;}
  function setOverlay(html, hidden=false){overlay.innerHTML=html; overlay.hidden=hidden;}
  function closeOverlay(){overlay.hidden=true; overlay.innerHTML='';}
  function saveResult(zone, result){
    const key = `${zone}-${Date.now()}`; if(resultsSaved.has(key)) return; resultsSaved.add(key);
    if(window.PF?.data){
      const r={id:Date.now().toString(36),mode:zones[zone].title,score:result.score||0,duration:result.duration||1,hits:result.hits||0,misses:result.misses||0,level:result.level||1,date:new Date().toISOString().slice(0,10),at:new Date().toISOString()};
      window.PF.data.games.push(r); window.PF.addActivity('game','Partida completada',`${zones[zone].title} · ${r.score} punts`); window.PF.save(); window.PF.refreshGameHistory();
    }
  }

  function intro(zone, onStart) {
    const z=zones[zone];
    setOverlay(`<div class="pf-card">
      <div class="pf-avatar-big">${z.icon}</div><div class="pf-tag">${z.tag}</div><h2>${esc(z.title)}</h2>
      <p>${esc(z.desc)}</p>
      <div class="pf-intro-grid"><div class="pf-step"><span>👀</span><b>1 · OBSERVA</b><small>Un assistent t’explica la mecànica.</small></div><div class="pf-step"><span>🎮</span><b>2 · JUGA</b><small>WASD/fletxes, tocar la pantalla i saltar.</small></div><div class="pf-step"><span>🏆</span><b>3 · SUPERACIÓ</b><small>Completa el repte i desa el resultat.</small></div></div>
      <div class="pf-brief-anim"><i></i></div><div class="pf-benefit"><b>🧠 Què entrenes?</b><p>${esc(z.skill)}</p><b>🎯 Objectiu</b><p>${esc(z.goal)}</p></div>
      <div class="pf-actions"><button class="pf-primary" id="pf-start-zone" type="button">COMENÇAR LA MISSIÓ →</button><button class="pf-secondary" id="pf-back-map" type="button">TORNAR AL MAPA</button></div>
    </div>`);
    $('#pf-start-zone',overlay).onclick=()=>{closeOverlay(); onStart();};
    $('#pf-back-map',overlay).onclick=()=>closeOverlay();
  }

  function pauseScreen(){
    if(!running) return;
    paused=!paused; if(paused){setOverlay(`<div class="pf-card"><div class="pf-avatar-big">⏸️</div><h2>Partida en pausa</h2><p>El progrés queda congelat.</p><button class="pf-primary" id="pf-resume">REPRENDRE →</button></div>`);$('#pf-resume',overlay).onclick=()=>{closeOverlay();paused=false;last=performance.now();requestAnimationFrame(loop);};}
    else {closeOverlay();last=performance.now();requestAnimationFrame(loop);}
  }

  function chooseAvatar(){
    setOverlay(`<div class="pf-card"><div class="pf-avatar-big">🧑‍🚀</div><h2>Personalitza el teu avatar</h2><p>Tria el personatge que t’acompanyarà pel campus.</p><div class="pf-word-grid">${avatars.map(a=>`<button class="pf-word ${a.id===avatar.id?'selected':''}" data-avatar="${a.id}">${a.emoji} ${a.name}</button>`).join('')}</div><button class="pf-primary" id="pf-avatar-ok">CONTINUAR →</button></div>`);
    $$('.pf-word',overlay).forEach(b=>b.onclick=()=>{$$('.pf-word',overlay).forEach(x=>x.classList.remove('selected'));b.classList.add('selected');avatar=avatars.find(a=>a.id===b.dataset.avatar)||avatar;});
    $('#pf-avatar-ok',overlay).onclick=()=>{updateAvatarUI();closeOverlay();setTip('Avatar preparat. Explora el campus i entra a qualsevol zona.');};
  }
  function updateAvatarUI(){ $('#pf-avatar-name',world).textContent=avatar.name; $('#pf-inventory',world).textContent=`${avatar.name} · ${avatar.emoji}`; }

  function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.floor(r.width*d));canvas.height=Math.max(1,Math.floor(r.height*d));ctx.setTransform(d,0,0,d,0,0);}
  function viewport(){const w=canvas.clientWidth||900,h=canvas.clientHeight||650;const scale=Math.min(.85,Math.max(.42,Math.max(w/worldW,h/worldH)));return {w,h,scale};}
  function worldPoint(e){const r=canvas.getBoundingClientRect(),v=viewport();const sx=(e.clientX-r.left),sy=(e.clientY-r.top);return {x:(sx-v.w/2)/v.scale+worldW/2,y:(sy-v.h/2)/v.scale+worldH/2};}
  function portalAt(p){return portals.find(z=>p.x>z.x-z.w/2&&p.x<z.x+z.w/2&&p.y>z.y-z.h/2&&p.y<z.y+z.h/2);}
  function nearbyPortal(){return portals.find(z=>dist(player,{x:z.x,y:z.y})<145);}

  function draw(){
    const {w,h,scale}=viewport(); const camX=clamp(player.x, w/(2*scale), worldW-w/(2*scale)); const camY=clamp(player.y,h/(2*scale),worldH-h/(2*scale));
    ctx.clearRect(0,0,w,h); ctx.save(); ctx.translate(w/2,h/2);ctx.scale(scale,scale);ctx.translate(-camX,-camY);
    ctx.fillStyle='#071523';ctx.fillRect(0,0,worldW,worldH);
    // campus grid
    ctx.strokeStyle='#2e596555';ctx.lineWidth=2;for(let x=0;x<worldW;x+=70){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,worldH);ctx.stroke();}for(let y=0;y<worldH;y+=70){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(worldW,y);ctx.stroke();}
    // central plaza and paths
    ctx.fillStyle='#0d2636';ctx.fillRect(600,360,400,260);ctx.fillStyle='#173e4a';ctx.fillRect(735,0,130,980);ctx.fillRect(0,425,1600,130);
    ctx.fillStyle='#2a5e60';ctx.beginPath();ctx.arc(800,490,105,0,Math.PI*2);ctx.fill();ctx.fillStyle='#7ceaff';ctx.globalAlpha=.12;ctx.beginPath();ctx.arc(800,490,75,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.font='bold 28px system-ui';ctx.textAlign='center';ctx.fillStyle='#dffcff';ctx.fillText('NEON CAMPUS',800,490);ctx.font='16px system-ui';ctx.fillStyle='#9bb9c5';ctx.fillText('Explora · Entrena · Aprèn',800,520);
    // zone buildings
    portals.forEach((z,i)=>{const d=zones[z.id];ctx.fillStyle='#0e2435';ctx.strokeStyle=d.color;ctx.lineWidth=5;ctx.shadowColor=d.color;ctx.shadowBlur=18;roundRectPath(ctx,z.x-z.w/2,z.y-z.h/2,z.w,z.h,28);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=d.color;ctx.font='44px system-ui';ctx.fillText(d.icon,z.x,z.y-15);ctx.font='bold 18px system-ui';ctx.fillStyle='#f0fbff';ctx.fillText(zones[z.id].title,z.x,z.y+35);ctx.font='12px system-ui';ctx.fillStyle='#9bb9c5';ctx.fillText('ENTRAR · ENTER',z.x,z.y+60);});
    // decorative trees / lamps
    for(let i=0;i<18;i++){const x=70+(i*137)%1460,y=90+((i*223)%800);if(Math.abs(x-player.x)<80&&Math.abs(y-player.y)<80)continue;ctx.fillStyle='#183d34';ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.fill();ctx.fillStyle='#76e99b';ctx.beginPath();ctx.arc(x,y-8,13,0,Math.PI*2);ctx.fill();}
    // avatar
    const bob=Math.sin(performance.now()/140)*2;const jumpScale=1+player.jump*.08;ctx.save();ctx.translate(player.x,player.y-player.jump*20+bob);ctx.scale(jumpScale,jumpScale);ctx.shadowColor=avatar.body;ctx.shadowBlur=20;ctx.fillStyle=avatar.body;ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.font='31px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(avatar.emoji,0,0);ctx.restore();
    ctx.restore();
    if(running && !paused) raf=requestAnimationFrame(loop);
  }

  function loop(now){if(!running||paused)return;const dt=Math.min(.035,Math.max(.001,(now-last)/1000));last=now;const dx=((keys.has('d')||keys.has('arrowright'))?1:0)-((keys.has('a')||keys.has('arrowleft'))?1:0)+touchDir.x;const dy=((keys.has('s')||keys.has('arrowdown'))?1:0)-((keys.has('w')||keys.has('arrowup'))?1:0)+touchDir.y;const len=Math.hypot(dx,dy)||1;const speed=(sprint||keys.has('shift'))?420:240;player.vx+=(dx/len*speed-player.vx)*Math.min(1,dt*10);player.vy+=(dy/len*speed-player.vy)*Math.min(1,dt*10);if(!dx&&!dy){player.vx*=Math.pow(.001,dt);player.vy*=Math.pow(.001,dt);}player.x=clamp(player.x+player.vx*dt,45,worldW-45);player.y=clamp(player.y+player.vy*dt,45,worldH-45);if(player.jump>0){player.jump=clamp(player.jump+player.jumpV*dt,0,1);player.jumpV-=2.8*dt;if(player.jump===0)player.jumpV=0;}draw();}

  function startCampus(){running=true;paused=false;player={x:800,y:490,vx:0,vy:0,jump:0,jumpV:0};score=0;$('#pf-score',world).textContent='0';$('#pf-zone',world).textContent='MAPA CENTRAL';updateAvatarUI();setTip('Explora el campus. Acosta’t a una zona i prem ENTER o toca-la.');resize();last=performance.now();raf=requestAnimationFrame(loop);}
  function jump(){if(!running||paused)return;if(player.jump===0){player.jump=.01;player.jumpV=3.2;setTip('Salt! Combina moviment i espai per explorar.');}}
  function enterNearby(){const z=nearbyPortal();if(!z){setTip('No hi ha cap zona prou a prop. Apropa’t a un edifici.');return;}intro(z.id,()=>startMinigame(z.id));}
  function startMinigame(zone){activeZone=zone;$('#pf-zone',world).textContent=zones[zone].tag;setTip(zones[zone].tip);const fn={attention:runAttention,numbers:runNumbers,words:runWords,visual:runVisual}[zone];fn();}

  function finishZone(zone,scoreValue,hits,misses,message){running=true;paused=false;score+=scoreValue;$('#pf-score',world).textContent=String(score);const duration=Math.max(1,Math.round((performance.now()-zoneStarted)/1000));saveResult(zone,{score:scoreValue,duration,hits,misses,level:1});setOverlay(`<div class="pf-card"><div class="pf-avatar-big">🏆</div><div class="pf-tag">MISSIÓ COMPLETADA</div><h2>${esc(message)}</h2><p>Puntuació de la zona: <b>${scoreValue}</b> · ${duration}s · encerts ${hits} · errors ${misses}</p><div class="pf-actions"><button class="pf-primary" id="pf-again-zone">TORNAR A JUGAR →</button><button class="pf-secondary" id="pf-map-zone">TORNAR AL MAPA</button></div></div>`);$('#pf-again-zone',overlay).onclick=()=>{closeOverlay();startMinigame(zone);};$('#pf-map-zone',overlay).onclick=()=>{closeOverlay();activeZone=null;$('#pf-zone',world).textContent='MAPA CENTRAL';setTip('Tria una altra zona o continua explorant.');};}

  function runAttention(){zoneStarted=performance.now();const total=6+difficulty;let found=0,miss=0;let cells=Array.from({length:total+10},(_,i)=>({i,target:false,symbol:'●'}));shuffleIndexes(cells);cells.slice(0,total).forEach(c=>{c.target=true;c.symbol='◆';});cells.slice(total).forEach(c=>{c.symbol=['●','■','▲','✚'][Math.floor(Math.random()*4)];});
    setOverlay(`<div class="pf-card"><div class="pf-avatar-big">🎯</div><div class="pf-tag">ATENCIÓ · FASE DE REPTE</div><h2>Caça els ◆</h2><p>Toca només els senyals ◆. Els distractors resten punts.</p><div class="pf-progress-bar"><i id="pf-att-progress"></i></div><div class="pf-word-grid" id="pf-att-grid">${cells.map((c,i)=>`<button class="pf-choice" data-i="${i}">${c.symbol}</button>`).join('')}</div><div class="pf-big-status" id="pf-att-status">0 / ${total}</div></div>`);
    const grid=$('#pf-att-grid',overlay); $$('.pf-choice',grid).forEach(b=>b.onclick=()=>{const c=cells[Number(b.dataset.i)];if(b.disabled)return;b.disabled=true;if(c.target&&c.symbol==='◆'){found++;b.classList.add('selected');}else{miss++;b.style.opacity=.45;}$('#pf-att-progress',overlay).style.width=`${found/total*100}%`;$('#pf-att-status',overlay).textContent=`${found} / ${total}`;if(found>=total){const sc=Math.max(20,120-miss*8);finishZone('attention',sc,found,miss,'Atenció superada!');}});
  }

  function runNumbers(){zoneStarted=performance.now();const len=3+difficulty;const seq=Array.from({length:len},()=>Math.floor(Math.random()*10));let phase='show';let index=0;let shown='';
    setOverlay(`<div class="pf-card"><div class="pf-avatar-big">🔢</div><div class="pf-tag">MEMÒRIA NUMÈRICA · OBSERVA</div><h2>Memoritza la seqüència</h2><p>La seqüència desapareixerà. Després toca els números en ordre.</p><div class="pf-memory-seq" id="pf-num-display">${seq.join(' · ')}</div><div class="pf-big-status" id="pf-num-status">Observa…</div></div>`);
    let idx=0;const show=()=>{if(idx<seq.length){$('#pf-num-display',overlay).textContent=String(seq[idx]);idx++;setTimeout(show,700);}else{setTimeout(()=>{phase='input';index=0;$('#pf-num-display',overlay).textContent='?';$('#pf-num-status',overlay).textContent='Ara toca els números en ordre.';renderNumberPad();},450);}};show();
    function renderNumberPad(){const card=$('.pf-card',overlay);const pad=document.createElement('div');pad.className='pf-seq';for(let n=0;n<10;n++){const b=document.createElement('button');b.className='pf-number';b.textContent=n;b.onclick=()=>{if(phase!=='input')return;if(n!==seq[index]){phase='done';finishZone('numbers',25,index,1,'Quasi! La seqüència s’ha interromput.');return;}index++;b.style.opacity=.45;if(index===seq.length)finishZone('numbers',100,index,0,'Memòria numèrica superada!');};pad.append(b);}card.append(pad);}
  }

  function runWords(){zoneStarted=performance.now();const bank=['calma','planeta','brúixola','muntanya','llum','oceà','llibre','camí'];const words=bank.sort(()=>Math.random()-.5);setOverlay(`<div class="pf-card"><div class="pf-avatar-big">📚</div><div class="pf-tag">MEMÒRIA VERBAL · OBSERVA</div><h2>Memoritza les paraules</h2><p>Tens uns segons. Després hauràs de seleccionar les que recordis.</p><div class="pf-word-grid">${words.map(w=>`<span class="pf-word" style="cursor:default">${w}</span>`).join('')}</div><div class="pf-big-status">Memoritza…</div></div>`);setTimeout(()=>{const distract=['teclat','riu','foc','tren','paper','fusta','rellotge','pont'];const choices=[...words,...distract.slice(0,6)].sort(()=>Math.random()-.5);setOverlay(`<div class="pf-card"><div class="pf-avatar-big">🧠</div><div class="pf-tag">MEMÒRIA VERBAL · RECUPERACIÓ</div><h2>Quines recordes?</h2><p>Selecciona les paraules de la llista original.</p><div class="pf-word-grid" id="pf-word-grid">${choices.map(w=>`<button class="pf-word" data-word="${esc(w)}">${esc(w)}</button>`).join('')}</div><button class="pf-primary" id="pf-check-words">COMPROVAR →</button></div>`);$$('.pf-word',overlay).forEach(b=>b.onclick=()=>b.classList.toggle('selected'));$('#pf-check-words',overlay).onclick=()=>{const selected=new Set($$('.pf-word.selected',overlay).map(b=>b.dataset.word));const good=words.filter(w=>selected.has(w)).length;const wrong=[...selected].filter(w=>!words.includes(w)).length;finishZone('words',Math.max(10,good*15-wrong*5),good,wrong,`Has recordat ${good} de ${words.length}.`);};},4200);}

  function runVisual(){zoneStarted=performance.now();let sequence=[];let round=1;const maxRounds=2+difficulty;let input=[];let locked=true;const make=()=>{sequence.push(Math.floor(Math.random()*9));input=[];locked=true;setOverlay(`<div class="pf-card"><div class="pf-avatar-big">🧩</div><div class="pf-tag">SEQÜÈNCIA VISUAL · RONDA ${round}</div><h2>Observa el patró</h2><p>Mira les caselles il·luminades i després repeteix-les.</p><div class="pf-pattern-grid" id="pf-pattern-grid">${Array.from({length:9},(_,i)=>`<button class="pf-pattern-cell" data-i="${i}" disabled></button>`).join('')}</div><div class="pf-big-status" id="pf-visual-status">Observa…</div></div>`);const cells=$$('.pf-pattern-cell',overlay);let i=0;const light=()=>{if(i<sequence.length){const c=cells[sequence[i]];c.classList.add('active');c.style.color=zones.visual.color;setTimeout(()=>c.classList.remove('active'),300);i++;setTimeout(light,500);}else{locked=false;cells.forEach(c=>c.disabled=false);$('#pf-visual-status',overlay).textContent='Ara repeteix el patró.';}};light();cells.forEach(c=>c.onclick=()=>{if(locked)return;const idx=Number(c.dataset.i);if(idx!==sequence[input.length]){locked=true;finishZone('visual',Math.max(10,round*15),input.length,1,'Patró interromput. Torna-ho a intentar!');return;}c.classList.add('active');setTimeout(()=>c.classList.remove('active'),180);input.push(idx);if(input.length===sequence.length){if(round>=maxRounds){finishZone('visual',120,sequence.length,0,'Seqüència visual completada!');}else{round++;setTimeout(make,550);}}});};make();}

  makeWorld();
  updateAvatarUI();
  $('#pf-pause',world).onclick=pauseScreen;
  $('#pf-exit',world).onclick=()=>{running=false;paused=false;cancelAnimationFrame(raf);closeOverlay();container.classList.add('hidden');menu.classList.remove('hidden');};
  $('#pf-action',world).onclick=()=>{if(nearbyPortal())enterNearby();else jump();};
  $('#pf-sprint',world).onclick=()=>{sprint=!sprint;$('#pf-sprint',world).classList.toggle('active',sprint);setTip(sprint?'Corrent activat.':'Corrent desactivat.');};
  $$('[data-m]',world).forEach(b=>{const set=(down)=>{const m=b.dataset.m;touchDir={x:m==='left'?-1:m==='right'?1:0,y:m==='up'?-1:m==='down'?1:0};if(!down)touchDir={x:0,y:0};};b.addEventListener('pointerdown',e=>{e.preventDefault();set(true);b.setPointerCapture?.(e.pointerId);});b.addEventListener('pointerup',()=>set(false));b.addEventListener('pointercancel',()=>set(false));});
  canvas.addEventListener('pointerup',e=>{if(!running||paused)return;const p=worldPoint(e);const z=portalAt(p);if(z)intro(z.id,()=>startMinigame(z.id));});
  window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','shift',' '].includes(k))e.preventDefault();if(k===' '){jump();return;}if(k==='enter'){enterNearby();return;}if(k==='escape'){if(overlay.hidden)pauseScreen();else closeOverlay();return;}keys.add(k);});
  window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  window.addEventListener('resize',()=>{if(running)resize();});
  window.addEventListener('blur',()=>{keys.clear();touchDir={x:0,y:0};sprint=false;});

  // Add a small avatar button to the world by clicking the inventory.
  $('.pf-inventory',world).addEventListener('click',chooseAvatar);
  $('.pf-inventory',world).style.cursor='pointer';

  $$('.mode-card').forEach(b=>b.addEventListener('click',()=>{
    const map={free:'attention',attention:'numbers',sequence:'words',maze:'visual'};const z=map[b.dataset.mode]||'attention';
    $$('.mode-card').forEach(x=>x.classList.toggle('selected',x===b));
    const desc=zones[z]; const hint=$('.game-menu-content p.small.muted'); if(hint)hint.textContent=`Zona seleccionada: ${desc.title}. Entra al campus i juga amb ${avatar.name}.`;
  }));

  $('#launch-game').addEventListener('click',e=>{e.preventDefault();difficulty=Math.max(1,Math.min(3,Number($('#game-difficulty').value)||1));menu.classList.add('hidden');container.classList.remove('hidden');requestAnimationFrame(()=>{container.scrollIntoView({behavior:'smooth',block:'start'});startCampus();});},{capture:true});
  renderIntroFromMenu();

  function renderIntroFromMenu(){
    // The old menu remains the launcher; the actual game always opens at the central campus.
    const small=$('.game-menu-content p.small.muted');if(small)small.textContent='Ordinador: WASD/fletxes + ESPAI per saltar + SHIFT per córrer. Mòbil: controls tàctils. Acosta’t a una zona i prem ENTER.';
  }
})();
