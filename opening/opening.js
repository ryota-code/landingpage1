(function () {
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  canvas.width = 480;
  canvas.height = 270;
  const CW = canvas.width;
  const CH = canvas.height;

  /* ── images ── */
  const images = { l1: new Image(), l2: new Image(), r1: new Image(), r2: new Image() };
  Object.values(images).forEach(i => (i.crossOrigin = 'anonymous'));
  images.l1.src = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/88b01ae-6deb-2436-d70b-707f3b24a4df__1.png';
  images.l2.src = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/4d20d-dbcb-c1a-c0e0-ca740e55d8c0__2.png';
  images.r1.src = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/48c5787-6528-52cc-e7e5-300b1f0fb628__2026-01-29_18.44.19-removebg-preview_1_.png';
  images.r2.src = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/ac1ddf4-6f87-bdf0-7231-4de2b1de87f6__2026-01-29_18.42.51-removebg-preview_1_.png';

  /* ── state ── */
  let f = 0;
  let animFrame = 0;
  let stepTimer = 0;

  const SCENES = [
    { name: 'titleFlash', dur: 210 },
    { name: 'adventure',  dur: 270 },
    { name: 'makai',      dur: 360 },
    { name: 'heaven',     dur: 360 },
    { name: 'boss',       dur: 420 },
    { name: 'titleEnd',   dur: 270 },
  ];
  let sceneIdx = 0;
  let sceneTimer = 0;
  let transAlpha = 0;
  let transColor = '#000';

  const catH = 70;
  const mouseH = 36;
  let catX = 0, catY = 0, mouseX = 0, mouseY = 0;
  let catAngle = 0, mouseAngle = 0; // tilt for expressiveness

  // Boss (メンタル)
  let bossHP = 100;
  let bossShake = 0;
  let bossHit = false;
  let slashFrame = -1;
  let bossX = 0, bossY = 0;

  // レンジ monster state
  let rangeX = 0, rangeDir = 1, rangeHP = 60;
  let rangeHit = false, rangeShake = 0;

  // 強トレンド angel state
  let trendX = 0, trendY = 0;

  const particles = [];
  const makaiFireParticles = [];
  let roadOff = 0;

  function resetScene() {
    catX = 60; catY = 0; mouseX = 130; mouseY = 0;
    catAngle = 0; mouseAngle = 0;
    bossHP = 100; bossShake = 0; bossHit = false; slashFrame = -1;
    bossX = CW - 130; bossY = 0;
    rangeX = CW - 100; rangeDir = 1; rangeHP = 60; rangeHit = false; rangeShake = 0;
    trendX = CW - 120; trendY = 60;
    makaiFireParticles.length = 0;
    particles.length = 0;
  }
  resetScene();

  /* ── Audio (unchanged from previous) ── */
  let audioCtx = null, bgmStarted = false, masterGain = null;
  const NF = {
    'C3':130.81,'D3':146.83,'E3':164.81,'F3':174.61,'G3':196,'A3':220,'B3':246.94,
    'C4':261.63,'D4':293.66,'E4':329.63,'F4':349.23,'G4':392,'A4':440,'B4':493.88,
    'C5':523.25,'D5':587.33,'E5':659.25,'F5':698.46,'G5':783.99,'A5':880,'B5':987.77,
    'C6':1046.5,'D6':1174.66,'E6':1318.51
  };

  function playNote(freq, start, dur, type, vol) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.connect(g); g.connect(masterGain);
    o.start(start); o.stop(start + dur + 0.05);
  }
  function playDrum(start, kind) {
    if (!audioCtx) return;
    if (kind === 'kick') {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, start);
      o.frequency.exponentialRampToValueAtTime(30, start + 0.12);
      g.gain.setValueAtTime(0.5, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      o.connect(g); g.connect(masterGain); o.start(start); o.stop(start + 0.2);
    } else {
      const len = 0.04;
      const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * len, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const n = audioCtx.createBufferSource(); n.buffer = buf;
      const g = audioCtx.createGain();
      const fl = audioCtx.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = 8000;
      g.gain.setValueAtTime(0.2, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + len);
      n.connect(fl); fl.connect(g); g.connect(masterGain); n.start(start); n.stop(start + len + 0.01);
    }
  }
  function startBGM() {
    if (bgmStarted) return; bgmStarted = true;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain(); masterGain.gain.value = 0.18;
    masterGain.connect(audioCtx.destination);
    scheduleBGM(audioCtx.currentTime + 0.1);
  }
  function scheduleBGM(t0) {
    const bpm = 155, beat = 60/bpm, bar = beat*4, bars = 16;
    const mel = [
      [['E5',0,.8],['G5',1,.8],['A5',2,.5],['B5',2.5,.5],['C6',3,1]],
      [['B5',0,.5],['A5',.5,.5],['G5',1,1],['E5',2,.5],['G5',2.5,.5],['A5',3,1]],
      [['G5',0,.8],['A5',1,.8],['B5',2,.5],['C6',2.5,.5],['D6',3,1]],
      [['C6',0,1],['B5',1,.5],['A5',1.5,.5],['G5',2,2]],
      [['E5',0,.8],['G5',1,.8],['A5',2,.5],['B5',2.5,.5],['C6',3,1]],
      [['D6',0,.5],['C6',.5,.5],['B5',1,1],['A5',2,.5],['G5',2.5,.5],['A5',3,1]],
      [['B5',0,.8],['C6',1,.8],['D6',2,1],['E6',3,.5],['D6',3.5,.5]],
      [['C6',0,1.5],['B5',2,.5],['A5',2.5,.5],['G5',3,1]],
      [['A5',0,.5],['A5',.5,.5],['C6',1,1],['A5',2,.5],['G5',2.5,.5],['A5',3,1]],
      [['B5',0,.5],['B5',.5,.5],['D6',1,1],['B5',2,.5],['A5',2.5,.5],['B5',3,1]],
      [['C6',0,1],['D6',1,.5],['E6',1.5,.5],['D6',2,1],['C6',3,1]],
      [['B5',0,1],['A5',1,1],['G5',2,2]],
      [['E5',0,.5],['G5',.5,.5],['A5',1,.5],['B5',1.5,.5],['C6',2,.5],['D6',2.5,.5],['E6',3,1]],
      [['D6',0,1],['C6',1,.5],['B5',1.5,.5],['A5',2,1],['G5',3,1]],
      [['A5',0,1],['B5',1,1],['C6',2,1],['D6',3,1]],
      [['E6',0,2],['C6',2,1],['G5',3,1]],
    ];
    const bass = ['A3','A3','C4','C4','A3','A3','E3','E3','F3','G3','A3','E3','F3','D3','G3','A3'];
    for (let b = 0; b < bars; b++) {
      const bs = t0 + b * bar;
      if (mel[b]) mel[b].forEach(([n,bo,d]) => playNote(NF[n], bs+bo*beat, d*beat, 'square', 0.25));
      const bf = NF[bass[b]];
      for (let bb = 0; bb < 4; bb++) playNote(bf, bs+bb*beat, beat*0.7, 'triangle', 0.35);
      const ar = bf * 2;
      for (let a = 0; a < 8; a++) playNote(ar*[1,1.25,1.5,1.25][a%4], bs+a*beat*0.5, beat*0.4, 'square', 0.08);
      for (let bb = 0; bb < 4; bb++) {
        playDrum(bs+bb*beat, 'kick');
        if (bb%2===1) playDrum(bs+bb*beat, 'hat');
        if (b>=8) playDrum(bs+bb*beat+beat*0.5, 'hat');
      }
    }
    const ld = bars*bar;
    setTimeout(() => { if (audioCtx && audioCtx.state==='running') scheduleBGM(t0+ld); }, (ld-1)*1000);
  }
  function playSFX(type) {
    if (!audioCtx) return; const t = audioCtx.currentTime;
    if (type === 'slash') {
      const o=audioCtx.createOscillator(),g=audioCtx.createGain();
      o.type='sawtooth'; o.frequency.setValueAtTime(800,t); o.frequency.exponentialRampToValueAtTime(100,t+0.15);
      g.gain.setValueAtTime(0.3,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2);
      o.connect(g);g.connect(masterGain);o.start(t);o.stop(t+0.25);
    } else if (type === 'hit') {
      const o=audioCtx.createOscillator(),g=audioCtx.createGain();
      o.type='square'; o.frequency.setValueAtTime(120,t); o.frequency.exponentialRampToValueAtTime(40,t+0.15);
      g.gain.setValueAtTime(0.4,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2);
      o.connect(g);g.connect(masterGain);o.start(t);o.stop(t+0.25);
    } else if (type === 'heaven') {
      [1,1.25,1.5,2].forEach((m,i)=>playNote(440*m,t+i*0.12,0.6,'sine',0.15));
    } else if (type === 'powerup') {
      [1,1.2,1.5,1.8,2].forEach((m,i)=>playNote(523*m,t+i*0.08,0.3,'square',0.12));
    }
  }
  function initAudio(){startBGM();document.removeEventListener('click',initAudio);document.removeEventListener('touchstart',initAudio);}
  document.addEventListener('click',initAudio);
  document.addEventListener('touchstart',initAudio);
  setTimeout(()=>{try{startBGM();}catch(e){}},100);

  /* ── helpers ── */
  function px(text, x, y, size, color, align) {
    ctx.font = size+'px "DotGothic16",sans-serif';
    ctx.textAlign = align||'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    for (let ox=-2;ox<=2;ox++) for (let oy=-2;oy<=2;oy++) if(ox||oy) ctx.fillText(text,x+ox,y+oy);
    ctx.fillStyle = color; ctx.fillText(text,x,y);
  }

  function drawChar(img, x, y, h, flip, angle) {
    if (!img.complete||!img.naturalWidth) return;
    const w = h*(img.width/img.height);
    ctx.save();
    if (angle) { ctx.translate(~~x+w/2, ~~y+h); ctx.rotate(angle); ctx.translate(-w/2,-h); }
    else ctx.translate(~~x, ~~y);
    if (flip) { ctx.translate(w,0); ctx.scale(-1,1); }
    ctx.drawImage(img,0,0,w,h);
    ctx.restore();
  }

  function spawnP(x,y,n,r,g,b,vy0) {
    for(let i=0;i<n;i++)
      particles.push({x:x+Math.random()*20-10,y:y+Math.random()*10-5,
        vx:(Math.random()-0.5)*4,vy:(vy0||0)+(Math.random()-0.5)*3-2,
        life:30+Math.random()*20,ml:50,s:Math.random()*3+2,r,g,b});
  }
  function updateParticles(){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.12;p.life--;if(p.life<=0)particles.splice(i,1);}}
  function drawParticles(){particles.forEach(p=>{ctx.fillStyle=`rgba(${p.r},${p.g},${p.b},${p.life/p.ml})`;ctx.fillRect(~~p.x,~~p.y,p.s,p.s);});}
  function drawShadow(x,gy,h){ctx.fillStyle='rgba(0,0,0,0.15)';ctx.beginPath();ctx.ellipse(x+h*0.35,gy,h*0.3,4,0,0,Math.PI*2);ctx.fill();}
  function drawHeart(x,y,s){ctx.fillRect(x-s,y,s,s);ctx.fillRect(x+1,y,s,s);ctx.fillRect(x-s-1,y-s+1,s,s);ctx.fillRect(x+2,y-s+1,s,s);}

  /* ── Backgrounds ── */
  function drawAdventureBG(gl) {
    const sg=ctx.createLinearGradient(0,0,0,gl);
    sg.addColorStop(0,'#4BA3FF');sg.addColorStop(0.6,'#A8DCFF');sg.addColorStop(1,'#FFE8A0');
    ctx.fillStyle=sg;ctx.fillRect(0,0,CW,CH);
    // Sun
    ctx.fillStyle='#FFF8DC';ctx.beginPath();ctx.arc(CW-60,40,20,0,Math.PI*2);ctx.fill();
    const sg2=ctx.createRadialGradient(CW-60,40,18,CW-60,40,45);
    sg2.addColorStop(0,'rgba(255,240,150,0.3)');sg2.addColorStop(1,'rgba(255,240,150,0)');
    ctx.fillStyle=sg2;ctx.beginPath();ctx.arc(CW-60,40,45,0,Math.PI*2);ctx.fill();
    // Clouds
    ctx.fillStyle='rgba(255,255,255,0.7)';
    [[50+((f*0.3)%CW),25,50],[200+((f*0.2)%CW),15,40],[350+((f*0.25)%CW),35,35]].forEach(([cx,cy,w])=>{
      const rx=cx%(CW+60)-30;ctx.fillRect(rx,cy,w,8);ctx.fillRect(rx+8,cy-5,w-16,5);});
    // Hills
    ctx.fillStyle='#5BAF5B';
    for(let x=0;x<CW;x+=2){const h=Math.sin(x*0.012+1)*20+Math.sin(x*0.025)*12+50;ctx.fillRect(x,gl-h,2,h);}
    ctx.fillStyle='#4A9E4A';
    for(let x=0;x<CW;x+=2){const h=Math.sin(x*0.02+3)*15+Math.sin(x*0.01+1)*10+32;ctx.fillRect(x,gl-h,2,h);}
    // Ground + Road
    ctx.fillStyle='#6BBF6B';ctx.fillRect(0,gl,CW,CH-gl);
    roadOff=(roadOff+0.6)%16;
    ctx.fillStyle='#C4A46C';ctx.beginPath();
    ctx.moveTo(CW/2-50,CH);ctx.lineTo(CW/2+50,CH);ctx.lineTo(CW/2+12,gl);ctx.lineTo(CW/2-12,gl);ctx.closePath();ctx.fill();
    ctx.fillStyle='#E8D8A8';
    for(let d=0;d<8;d++){const t=(d*16+roadOff)/(CH-gl);if(t>1)continue;const y=gl+t*(CH-gl);ctx.fillRect(CW/2-(1+t*4),y,2+t*8,2+t*3);}
  }

  function drawMakaiBG(gl) {
    const sg=ctx.createLinearGradient(0,0,0,CH);
    sg.addColorStop(0,'#1a0011');sg.addColorStop(0.3,'#330022');sg.addColorStop(0.6,'#550000');sg.addColorStop(1,'#220000');
    ctx.fillStyle=sg;ctx.fillRect(0,0,CW,CH);
    // Red moon
    ctx.fillStyle='#880022';ctx.beginPath();ctx.arc(100,50,25,0,Math.PI*2);ctx.fill();
    const mg=ctx.createRadialGradient(100,50,20,100,50,60);
    mg.addColorStop(0,'rgba(200,0,40,0.3)');mg.addColorStop(1,'rgba(200,0,40,0)');
    ctx.fillStyle=mg;ctx.beginPath();ctx.arc(100,50,60,0,Math.PI*2);ctx.fill();
    // Mountains
    ctx.fillStyle='#220011';
    for(let x=0;x<CW;x+=2){const h=Math.abs(Math.sin(x*0.03)*40+Math.sin(x*0.07+2)*20)+30;ctx.fillRect(x,gl-h,2,h);}
    // Ground + lava
    ctx.fillStyle='#330000';ctx.fillRect(0,gl,CW,CH-gl);
    ctx.fillStyle='#FF4400';
    for(let i=0;i<8;i++){const lx=(i*62+f*0.2)%CW;ctx.fillRect(lx,gl+4+Math.sin(lx*0.1)*3,15+Math.sin(f*0.05+i)*5,2);}
    // Fire particles
    if(f%3===0) makaiFireParticles.push({x:Math.random()*CW,y:CH,vy:-1-Math.random()*2,life:40+Math.random()*30,ml:70,s:Math.random()*3+1});
    for(let i=makaiFireParticles.length-1;i>=0;i--){
      const p=makaiFireParticles[i];p.x+=Math.sin(f*0.03+i)*0.5;p.y+=p.vy;p.life--;
      if(p.life<=0){makaiFireParticles.splice(i,1);continue;}
      const a=p.life/p.ml;ctx.fillStyle=`rgba(255,${~~(100*a)},0,${a*0.7})`;ctx.fillRect(~~p.x,~~p.y,p.s,p.s);
    }
    // Ambient glow
    const eg=ctx.createLinearGradient(0,CH-30,0,CH);
    eg.addColorStop(0,'rgba(255,50,0,0)');eg.addColorStop(1,'rgba(255,50,0,0.15)');
    ctx.fillStyle=eg;ctx.fillRect(0,CH-30,CW,30);
  }

  function drawHeavenBG(gl) {
    const sg=ctx.createLinearGradient(0,0,0,CH);
    sg.addColorStop(0,'#FFF8E0');sg.addColorStop(0.3,'#FFE8A0');sg.addColorStop(0.5,'#FFDAA0');sg.addColorStop(0.8,'#E8F4FF');sg.addColorStop(1,'#D0EEFF');
    ctx.fillStyle=sg;ctx.fillRect(0,0,CW,CH);
    // Light beams
    ctx.save();
    for(let i=0;i<5;i++){
      const bx=60+i*90+Math.sin(f*0.005+i)*15;
      ctx.fillStyle=`rgba(255,255,200,${0.08+Math.sin(f*0.02+i*1.5)*0.04})`;
      ctx.beginPath();ctx.moveTo(bx-5,0);ctx.lineTo(bx+5,0);ctx.lineTo(bx+40,CH);ctx.lineTo(bx-40,CH);ctx.closePath();ctx.fill();
    }
    ctx.restore();
    // Cloud ground
    ctx.fillStyle='#FFF';
    for(let x=0;x<CW;x+=2){const h=Math.sin(x*0.02)*10+Math.sin(x*0.05+f*0.01)*5+25;ctx.fillRect(x,gl-h,2,h+CH-gl);}
    ctx.fillStyle='rgba(255,250,230,0.6)';
    for(let x=0;x<CW;x+=2){const h=Math.sin(x*0.03+1)*8+Math.sin(x*0.06+f*0.008)*4+18;ctx.fillRect(x,gl-h,2,h);}
    // Sparkles
    ctx.fillStyle='#FFD700';
    for(let i=0;i<10;i++){
      const sx=(f*0.5+i*50)%CW,sy=20+Math.sin(f*0.02+i*0.7)*15+i*10;
      const sz=2+Math.sin(f*0.05+i);
      if(sz>0){ctx.fillRect(~~sx,~~sy,~~sz,~~sz);ctx.fillRect(~~sx-1,~~sy+1,~~sz+2,1);ctx.fillRect(~~sx+1,~~sy-1,1,~~sz+2);}
    }
    // Rainbow
    ctx.save();ctx.globalAlpha=0.2;
    ['#FF0000','#FF7700','#FFFF00','#00FF00','#0077FF','#4400FF','#8800FF'].forEach((c,i)=>{
      ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.arc(CW/2,gl+60,130-i*4,Math.PI,0);ctx.stroke();});
    ctx.restore();
  }

  function drawBossBG(gl) {
    const sg=ctx.createLinearGradient(0,0,0,CH);
    sg.addColorStop(0,'#0a0a1a');sg.addColorStop(0.5,'#1a1030');sg.addColorStop(1,'#0d0d1a');
    ctx.fillStyle=sg;ctx.fillRect(0,0,CW,CH);
    // Lightning flash
    if(sceneTimer%120<3){ctx.fillStyle=`rgba(200,200,255,${0.3-sceneTimer%120*0.1})`;ctx.fillRect(0,0,CW,CH);}
    if(sceneTimer%120===0){
      ctx.strokeStyle='#AABBFF';ctx.lineWidth=2;ctx.beginPath();
      let lx=Math.random()*CW;ctx.moveTo(lx,0);
      for(let ly=0;ly<gl;ly+=15){lx+=(Math.random()-0.5)*20;ctx.lineTo(lx,ly);}ctx.stroke();
    }
    // Ground
    ctx.fillStyle='#1a1520';ctx.fillRect(0,gl,CW,CH-gl);
    // Magic circles
    ctx.save();ctx.globalAlpha=0.15+Math.sin(f*0.04)*0.05;ctx.strokeStyle='#8844FF';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(CW/2,gl+30,80+Math.sin(f*0.03)*5,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(CW/2,gl+30,60+Math.sin(f*0.04+1)*4,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<5;i++){
      const a1=(i/5)*Math.PI*2+f*0.01,a2=((i+2)/5)*Math.PI*2+f*0.01;
      ctx.beginPath();ctx.moveTo(CW/2+Math.cos(a1)*60,gl+30+Math.sin(a1)*20);ctx.lineTo(CW/2+Math.cos(a2)*60,gl+30+Math.sin(a2)*20);ctx.stroke();
    }
    ctx.restore();
  }

  /* ── Named characters ── */

  // レンジ - a sideways-moving box monster (represents range-bound market)
  function drawRange(x, y) {
    const shake = rangeShake > 0 ? (Math.random()-0.5)*rangeShake : 0;
    ctx.save();
    ctx.translate(~~(x+shake), ~~y);

    // Body - chart-like shape, boxy
    ctx.fillStyle = '#884400';
    ctx.fillRect(-20, -30, 40, 40);
    // Horizontal lines on body (range lines)
    ctx.fillStyle = '#FF6600';
    ctx.fillRect(-18, -25, 36, 3);
    ctx.fillRect(-18, -15, 36, 3);
    ctx.fillRect(-18, -5, 36, 3);
    // Head
    ctx.fillStyle = '#AA5500';
    ctx.fillRect(-15, -45, 30, 18);
    // Eyes - angry
    const ey = Math.sin(f*0.1) > 0 ? 0 : 1;
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(-10, -40+ey, 6, 5);
    ctx.fillRect(4, -40+ey, 6, 5);
    // Mouth - zigzag (like a chart)
    ctx.strokeStyle = '#FF3300';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -30);
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(-8+i*4, i%2===0 ? -28 : -32);
    }
    ctx.stroke();
    // Arms waving (moving side to side)
    const armSwing = Math.sin(f * 0.08) * 10;
    ctx.fillStyle = '#884400';
    ctx.fillRect(-30 + armSwing, -20, 10, 6);
    ctx.fillRect(20 - armSwing, -20, 10, 6);
    // Legs (short stumpy)
    ctx.fillRect(-15, 10, 10, 12);
    ctx.fillRect(5, 10, 10, 12);
    // "レンジ" label above
    ctx.fillStyle = '#FF6600';
    ctx.font = '10px "DotGothic16",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('レンジ', 0, -52);

    // Hit flash
    if (rangeHit) { ctx.globalAlpha=0.6; ctx.fillStyle='#FFF'; ctx.fillRect(-22,-47,44,70); }

    // HP bar
    if (rangeHP < 60) {
      ctx.globalAlpha = 1;
      ctx.fillStyle='#333';ctx.fillRect(-20,-58,40,5);
      ctx.fillStyle='#FF4444';ctx.fillRect(-19,-57,38*(rangeHP/60),3);
    }

    ctx.restore();
  }

  // 強トレンド - a majestic angel with upward arrow motif
  function drawStrongTrend(x, y) {
    ctx.save();
    ctx.translate(~~x, ~~y);

    const hover = Math.sin(f * 0.04) * 4;
    ctx.translate(0, hover);

    // Glow aura
    ctx.save();
    ctx.globalAlpha = 0.2 + Math.sin(f*0.03)*0.1;
    const glow = ctx.createRadialGradient(0,0,15,0,0,60);
    glow.addColorStop(0,'rgba(255,215,0,0.5)');glow.addColorStop(1,'rgba(255,215,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-60,-60,120,120);
    ctx.restore();

    // Wings (large, luminous)
    const wingFlap = Math.sin(f*0.07)*8;
    ctx.fillStyle = 'rgba(255,255,220,0.6)';
    ctx.fillRect(-45, -20+wingFlap, 20, 35);
    ctx.fillRect(25, -20-wingFlap, 20, 35);
    ctx.fillStyle = 'rgba(255,255,200,0.4)';
    ctx.fillRect(-40, -28+wingFlap, 12, 20);
    ctx.fillRect(28, -28-wingFlap, 12, 20);

    // Body (white/gold robe)
    ctx.fillStyle = '#FFFDE8';
    ctx.fillRect(-12, -5, 24, 35);
    // Gold trim
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-12, -5, 24, 3);
    ctx.fillRect(-12, 27, 24, 3);

    // Head
    ctx.fillStyle = '#FFEEDD';
    ctx.fillRect(-10, -22, 20, 18);
    // Eyes (kind, sparkly)
    ctx.fillStyle = '#4488FF';
    ctx.fillRect(-6, -16, 4, 4);
    ctx.fillRect(2, -16, 4, 4);
    // Smile
    ctx.fillStyle = '#CC8866';
    ctx.fillRect(-4, -10, 8, 2);

    // Halo (glowing, rotating)
    ctx.save();
    ctx.globalAlpha = 0.7 + Math.sin(f*0.06)*0.3;
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-8, -28, 16, 3);
    ctx.fillRect(-10, -27, 20, 1);
    ctx.restore();

    // Upward arrow on chest (trend symbol)
    ctx.fillStyle = '#00CC44';
    ctx.fillRect(-2, 5, 4, 15);
    ctx.fillRect(-6, 9, 4, 4);
    ctx.fillRect(2, 9, 4, 4);
    ctx.fillRect(-4, 5, 8, 4);

    // "強トレンド" label
    ctx.fillStyle = '#FFD700';
    ctx.font = '10px "DotGothic16",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('強トレンド', 0, -36);

    ctx.restore();
  }

  // メンタル boss - dark shadow entity (psychological enemy)
  function drawMental(x, y) {
    const shake = bossShake > 0 ? (Math.random()-0.5)*bossShake : 0;
    ctx.save();
    ctx.translate(x+shake, y);

    // Shadow aura (pulsating)
    ctx.save();
    ctx.globalAlpha = 0.25 + Math.sin(f*0.04)*0.1;
    const aura = ctx.createRadialGradient(0,-10,20,0,-10,90);
    aura.addColorStop(0,'rgba(80,0,120,0.6)');aura.addColorStop(1,'rgba(80,0,120,0)');
    ctx.fillStyle = aura; ctx.fillRect(-90,-80,180,160);
    ctx.restore();

    // Shadowy body (amorphous, shifting)
    const wobble1 = Math.sin(f*0.05)*3;
    const wobble2 = Math.cos(f*0.04)*4;
    ctx.fillStyle = '#1A0030';
    ctx.fillRect(-30+wobble1, -30, 60, 65);
    ctx.fillRect(-25+wobble2, -40, 50, 15);
    ctx.fillRect(-35+wobble1, -15, 70, 35);

    // Head
    ctx.fillStyle = '#2A0050';
    ctx.fillRect(-22, -60+wobble2, 44, 35);
    ctx.fillRect(-18, -65+wobble2, 36, 10);

    // Eyes (multiple, shifting, unnerving)
    const eyeP = Math.sin(f*0.08);
    // Main eyes
    ctx.fillStyle = `rgba(255,0,100,${0.7+eyeP*0.3})`;
    ctx.fillRect(-14, -52+wobble2, 10, 8);
    ctx.fillRect(4, -52+wobble2, 10, 8);
    // Third eye (forehead)
    ctx.fillStyle = `rgba(200,0,255,${0.5+Math.sin(f*0.06)*0.3})`;
    ctx.fillRect(-4, -62+wobble2, 8, 6);

    // Mouth (jagged grin)
    ctx.fillStyle = '#FF0066';
    for (let i = 0; i < 7; i++) {
      ctx.fillRect(-14+i*4, -38+wobble2+(i%2)*3, 3, 4);
    }

    // Shadowy tendrils
    ctx.fillStyle = 'rgba(30,0,50,0.6)';
    for (let i = 0; i < 4; i++) {
      const tx = -30 + i * 20;
      const tendrilLen = 20 + Math.sin(f*0.05+i*1.5)*10;
      ctx.fillRect(tx + Math.sin(f*0.03+i)*5, 30, 6, tendrilLen);
    }

    // Dark words floating around (psychological attack visuals)
    ctx.save();
    ctx.globalAlpha = 0.3 + Math.sin(f*0.02)*0.15;
    ctx.fillStyle = '#AA00FF';
    ctx.font = '8px "DotGothic16",sans-serif';
    ctx.textAlign = 'center';
    const words = ['不安','恐怖','損切り','焦り'];
    words.forEach((w,i) => {
      const wx = Math.sin(f*0.015+i*1.5)*55;
      const wy = Math.cos(f*0.02+i*1.2)*35 - 20;
      ctx.fillText(w, wx, wy);
    });
    ctx.restore();

    // "メンタル" label
    px('メンタル', 0, -78, 12, '#CC00FF');

    // HP bar
    ctx.fillStyle='#333';ctx.fillRect(-35,-88,70,6);
    ctx.fillStyle = bossHP>30?'#AA00CC':'#FF0066';
    ctx.fillRect(-34,-87,68*(bossHP/100),4);

    // Hit flash
    if (bossHit) { ctx.globalAlpha=0.5;ctx.fillStyle='#FFF';ctx.fillRect(-40,-70,80,110);ctx.globalAlpha=1; }

    ctx.restore();
  }

  function drawSlash(x, y) {
    if (slashFrame < 0) return;
    ctx.save(); ctx.translate(x,y);
    const p = slashFrame/8;
    ctx.strokeStyle = `rgba(255,255,100,${1-p})`;
    ctx.lineWidth = 4-p*3;
    ctx.beginPath();ctx.moveTo(-30+p*60,-20+p*40);ctx.lineTo(30-p*20,20-p*40);ctx.stroke();
    ctx.beginPath();ctx.moveTo(20-p*40,-25+p*50);ctx.lineTo(-20+p*40,15-p*30);ctx.stroke();
    ctx.restore();
  }

  /* ── Scene-specific text with fade ── */
  function drawSceneTitle(text, color) {
    if (sceneTimer < 90) {
      ctx.save();
      ctx.globalAlpha = sceneTimer<30 ? sceneTimer/30 : (sceneTimer<60 ? 1 : 1-(sceneTimer-60)/30);
      px(text, CW/2, 35, 22, color);
      ctx.restore();
    }
  }

  /* ── UPDATE ── */
  function update() {
    f++; sceneTimer++; stepTimer++;
    if (stepTimer>=8){stepTimer=0;animFrame=1-animFrame;}

    const scene = SCENES[sceneIdx];
    const dur = scene.dur;

    // Transitions
    if (sceneTimer<30) transAlpha = 1-sceneTimer/30;
    else if (sceneTimer>dur-30) transAlpha = (sceneTimer-(dur-30))/30;
    else transAlpha = 0;

    if (sceneTimer >= dur) {
      sceneIdx = (sceneIdx+1)%SCENES.length;
      sceneTimer = 0;
      resetScene();
      transColor = SCENES[sceneIdx].name==='heaven' ? '#FFF' : '#000';
    }

    updateParticles();

    const name = SCENES[sceneIdx].name;
    const gl = 210;
    const t = sceneTimer;

    /* ── titleFlash: run in → jump → pose → wave ── */
    if (name === 'titleFlash') {
      if (t < 40) {
        // Run in from left
        catX = -40 + t * 5;
        mouseX = -20 + t * 5 - 20;
        catY = Math.abs(Math.sin(t*0.3))*10;
        mouseY = Math.abs(Math.sin(t*0.3+1))*6;
      } else if (t < 70) {
        // Arrive and big jump
        catX = 160;
        mouseX = 230;
        const jt = t - 40;
        catY = Math.max(0, 35*Math.sin(jt*0.1) - jt*0.3);
        mouseY = Math.max(0, 25*Math.sin((jt-5)*0.1) - (jt-5)*0.3);
      } else if (t < 120) {
        // Bounce in place, look at each other (tilt)
        catX = 160; mouseX = 230;
        catY = Math.abs(Math.sin(t*0.12))*5;
        mouseY = Math.abs(Math.sin(t*0.12+0.5))*4;
        catAngle = Math.sin(t*0.08)*0.1;
        mouseAngle = -Math.sin(t*0.08)*0.1;
      } else {
        // Wave / nod (bigger bounces)
        catX = 160; mouseX = 230;
        catY = Math.abs(Math.sin(t*0.18))*8;
        mouseY = Math.abs(Math.sin(t*0.18+1.5))*6;
        catAngle = Math.sin(t*0.15)*0.15;
        mouseAngle = Math.sin(t*0.12)*0.12;
        if (t%20===0) spawnP(catX+30, gl-catH-catY-10, 3, 255,215,0);
      }
    }

    /* ── adventure: walk → jog → skip → point forward ── */
    else if (name === 'adventure') {
      if (t < 60) {
        // Slow walk
        catX = 80 + t*0.5; mouseX = catX + 60;
        catY = Math.abs(Math.sin(t*0.12))*4;
        mouseY = Math.abs(Math.sin(t*0.12+1))*3;
      } else if (t < 120) {
        // Jog (faster bounce)
        catX = 110 + (t-60)*1; mouseX = catX + 55;
        catY = Math.abs(Math.sin(t*0.2))*7;
        mouseY = Math.abs(Math.sin(t*0.2+0.8))*5;
        if (t%8===0) spawnP(catX+10, gl, 2, 180,160,120);
      } else if (t < 180) {
        // Skip (alternating high jumps)
        catX = 170 + (t-120)*0.3; mouseX = catX + 50;
        const skipPhase = (t-120)*0.15;
        catY = Math.abs(Math.sin(skipPhase))*15;
        mouseY = Math.abs(Math.sin(skipPhase+Math.PI))*12;
        catAngle = Math.sin(skipPhase)*0.1;
        mouseAngle = Math.sin(skipPhase+Math.PI)*0.08;
      } else {
        // Stop, point forward, look at horizon
        catX = 190; mouseX = 245;
        catY = Math.abs(Math.sin(t*0.06))*2;
        mouseY = Math.abs(Math.sin(t*0.06+0.5))*2;
        catAngle = -0.05; // leaning forward
        mouseAngle = 0;
        // Determination bounce at the end
        if (t > 220) {
          catY = Math.abs(Math.sin((t-220)*0.2))*6;
          mouseY = Math.abs(Math.sin((t-220)*0.2+1))*4;
        }
      }
    }

    /* ── makai: encounter → shocked → レンジ attacks → dodge → fight back ── */
    else if (name === 'makai') {
      if (t < 50) {
        // Walk in cautiously (slow, jittery)
        catX = -30 + t*2.5; mouseX = catX + 50;
        catY = Math.abs(Math.sin(t*0.15))*3;
        mouseY = Math.abs(Math.sin(t*0.15+1))*2;
        catAngle = Math.sin(t*0.3)*0.03; // nervous shaking
        mouseAngle = Math.sin(t*0.35)*0.03;
      } else if (t < 90) {
        // See レンジ → freeze → shocked jump
        catX = 95; mouseX = 145;
        if (t < 65) {
          catY = 0; mouseY = 0; // freeze
        } else {
          // Shocked jump back
          const jt = t - 65;
          catY = Math.max(0, 20 - jt*1.5);
          mouseY = Math.max(0, 15 - (jt-3)*1.5);
          catX = 95 - jt*1.2; mouseX = 145 - jt*1;
          catAngle = -0.2; mouseAngle = -0.15;
        }
      } else if (t < 160) {
        // レンジ attacks (moves side to side aggressively), chars dodge
        catX = 60 + Math.sin(t*0.08)*15;
        mouseX = catX + 45;
        const dodgePhase = Math.floor((t-90)/20) % 3;
        if (dodgePhase === 0) { catY = 20; mouseY = 0; catAngle = 0.15; } // duck
        else if (dodgePhase === 1) { catY = 0; mouseY = 15; mouseAngle = -0.15; catAngle = 0; } // mouse ducks
        else { catY = 10; mouseY = 8; catAngle = 0.1; mouseAngle = -0.1; } // both dodge
        // レンジ charges back and forth
        rangeX = CW - 100 + Math.sin(t*0.06)*60;
      } else if (t < 240) {
        // Fight back!  Cat charges
        catAngle = 0; mouseAngle = 0;
        mouseX = 80; mouseY = Math.abs(Math.sin(t*0.15))*3;
        if (t < 180) {
          // Charge toward レンジ
          catX = 60 + (t-160)*4;
          catY = Math.abs(Math.sin(t*0.25))*8;
        } else if (t === 180) {
          playSFX('slash'); slashFrame = 0;
        } else if (t === 188) {
          rangeHit = true; rangeHP = 30; rangeShake = 6; playSFX('hit');
          spawnP(rangeX, gl-30, 15, 255,100,0);
        } else if (t === 196) {
          rangeHit = false;
        } else if (t < 220) {
          catX = rangeX - 60;
          catY = Math.abs(Math.sin(t*0.2))*5;
        } else {
          // Second attack
          if (t === 220) { playSFX('slash'); slashFrame = 0; }
          if (t === 228) { rangeHit=true; rangeHP=0; rangeShake=10; playSFX('hit'); spawnP(rangeX,gl-40,25,255,150,0); }
          if (t === 236) rangeHit = false;
          catX = rangeX - 60;
          catY = Math.abs(Math.sin(t*0.2))*4;
        }
        rangeX = CW - 100;
      } else {
        // Victory pose, レンジ fading
        catX = 200; mouseX = 260;
        catY = Math.abs(Math.sin(t*0.15))*8;
        mouseY = Math.abs(Math.sin(t*0.15+1.5))*6;
        catAngle = Math.sin(t*0.1)*0.1;
        if (t%12===0) spawnP(catX+20, gl-catH, 3, 255,200,50);
      }
      if (slashFrame>=0) slashFrame++;
      if (slashFrame>10) slashFrame=-1;
      if (rangeShake>0) rangeShake*=0.9;
    }

    /* ── heaven: float in → meet 強トレンド → receive blessing → dance ── */
    else if (name === 'heaven') {
      if (t === 30) playSFX('heaven');
      trendX = CW - 120;
      trendY = 80 + Math.sin(f*0.03)*8;

      if (t < 60) {
        // Float upward slowly
        catX = 40 + t*1.5; mouseX = catX + 55;
        catY = 15 - t*0.15 + Math.sin(t*0.08)*5;
        mouseY = 12 - t*0.12 + Math.sin(t*0.08+0.5)*4;
      } else if (t < 120) {
        // Approach 強トレンド with wonder
        catX = 130 + (t-60)*0.5; mouseX = catX + 50;
        catY = Math.sin(t*0.06)*6;
        mouseY = Math.sin(t*0.06+0.5)*5;
        catAngle = Math.sin(t*0.1)*0.05; // looking around in wonder
        mouseAngle = -Math.sin(t*0.1)*0.05;
      } else if (t < 180) {
        // 強トレンド bestows power (sparkle burst)
        catX = 160; mouseX = 210;
        catY = Math.sin(t*0.08)*4;
        mouseY = Math.sin(t*0.08+0.5)*3;
        if (t === 140) playSFX('powerup');
        if (t > 140 && t < 160) {
          // Power-up levitation
          catY = -10 - (t-140)*0.5 + Math.sin(t*0.2)*3;
          mouseY = -8 - (t-140)*0.4 + Math.sin(t*0.2+1)*2;
          if (t%4===0) {
            spawnP(catX+20, gl-catH+catY, 4, 255,215,0, -1);
            spawnP(mouseX+10, gl-mouseH+mouseY, 3, 255,255,200, -1);
          }
        }
        if (t >= 160) {
          catY = Math.sin(t*0.1)*8;
          mouseY = Math.sin(t*0.1+0.5)*6;
        }
      } else if (t < 260) {
        // Joyful dance / celebration
        const dt = t - 180;
        catX = 150 + Math.sin(dt*0.04)*20;
        mouseX = 220 + Math.sin(dt*0.04+Math.PI)*18;
        catY = Math.abs(Math.sin(dt*0.15))*12 + Math.sin(dt*0.06)*4;
        mouseY = Math.abs(Math.sin(dt*0.15+1.5))*10 + Math.sin(dt*0.06+0.5)*3;
        catAngle = Math.sin(dt*0.12)*0.2; // spinning/twirling
        mouseAngle = Math.sin(dt*0.1)*0.15;
        if (t%8===0) spawnP(catX+20, gl-catH+catY-20, 2, 255,200,100);
        if (t%10===0) spawnP(mouseX+10, gl-mouseH+mouseY-15, 2, 200,255,200);
      } else {
        // Float upward together, wave goodbye
        catX = 160 + (t-260)*0.3;
        mouseX = catX + 45;
        catY = -(t-260)*0.3 + Math.sin(t*0.1)*5;
        mouseY = -(t-260)*0.25 + Math.sin(t*0.1+0.5)*4;
        catAngle = Math.sin(t*0.2)*0.1;
        mouseAngle = -Math.sin(t*0.2)*0.1;
      }
    }

    /* ── boss (メンタル): dramatic entrance → taunts → multi-phase battle ── */
    else if (name === 'boss') {
      catAngle = 0; mouseAngle = 0;
      bossX = CW - 130;
      const bgl = gl;

      if (t < 60) {
        // Heroes walk in cautiously
        catX = -20 + t*2; mouseX = catX + 50;
        catY = Math.abs(Math.sin(t*0.12))*3;
        mouseY = Math.abs(Math.sin(t*0.12+1))*2;
      } else if (t < 100) {
        // メンタル appears (rises from ground)
        catX = 100; mouseX = 150;
        catY = 0; mouseY = 0;
        // Scared shaking
        catAngle = Math.sin(t*0.5)*0.05;
        mouseAngle = Math.sin(t*0.5+1)*0.05;
        bossY = Math.min(0, -(t-60)*2 + 60); // rises up (negative = up from spawn)
        if (t === 70) spawnP(bossX, bgl-20, 20, 100,0,150);
      } else if (t < 140) {
        // メンタル taunts (words swirl), heroes tremble then steel themselves
        catX = 100; mouseX = 150;
        bossY = 0;
        if (t < 120) {
          // Trembling
          catY = Math.random()*3;
          mouseY = Math.random()*2;
          catAngle = Math.sin(t*0.4)*0.08;
          mouseAngle = Math.sin(t*0.4+0.5)*0.06;
        } else {
          // Steel themselves! Stand tall
          catY = 0; mouseY = 0;
          catAngle = 0; mouseAngle = 0;
          catY = Math.abs(Math.sin((t-120)*0.3))*4; // determination bounce
          mouseY = Math.abs(Math.sin((t-120)*0.3+1))*3;
        }
      } else if (t < 200) {
        // Phase 1: Cat charges, first slash
        mouseX = 120; mouseY = Math.abs(Math.sin(t*0.15))*3;
        mouseAngle = 0;
        if (t < 160) {
          catX = 100 + (t-140)*5;
          catY = -Math.abs(Math.sin((t-140)*0.15))*8;
        } else if (t === 160) {
          playSFX('slash'); slashFrame = 0;
        } else if (t === 168) {
          bossHit=true; bossHP=75; bossShake=6; playSFX('hit');
          spawnP(bossX,bgl-40,15,200,100,255);
        } else if (t === 176) { bossHit=false; }
        else {
          // Knocked back
          catX = bossX - 80 - (t-176)*2;
          catY = Math.abs(Math.sin(t*0.2))*5;
        }
        if (t >= 180) catX = Math.max(catX, 100);
      } else if (t < 260) {
        // Phase 2: Boss counter-attacks, heroes dodge
        catX = 100; mouseX = 150;
        bossY = 0;
        const phase2t = t - 200;
        if (phase2t < 20) {
          // Boss lunges forward
          bossX = CW-130 - phase2t*3;
          catY = 0; mouseY = 0;
        } else if (phase2t < 35) {
          // Heroes dodge! Cat rolls left, mouse jumps
          bossX = CW-130-60 + (phase2t-20)*4;
          catX = 100 - (phase2t-20)*3;
          catY = 0;
          catAngle = -(phase2t-20)*0.15; // rolling
          mouseY = -Math.max(0, 25 - (phase2t-20)*2.5);
          mouseX = 150 + (phase2t-20)*2;
        } else if (phase2t < 45) {
          // Recovery
          bossX = CW-130;
          catX = 60 + (phase2t-35)*4;
          catAngle = catAngle * 0.8;
          mouseX = 150;
          mouseY = Math.max(0, mouseY + 2);
          catY = Math.abs(Math.sin(phase2t*0.3))*4;
        } else {
          // Regroup
          catX = 100 + Math.sin(phase2t*0.08)*5;
          mouseX = 150 + Math.sin(phase2t*0.08+1)*5;
          catY = Math.abs(Math.sin(phase2t*0.15))*4;
          mouseY = Math.abs(Math.sin(phase2t*0.15+1))*3;
          catAngle = 0; mouseAngle = 0;
          bossX = CW-130;
        }
      } else if (t < 340) {
        // Phase 3: Combined attack! Both charge together
        bossX = CW - 130;
        const phase3t = t - 260;
        if (phase3t < 20) {
          // Power up together
          catX = 100; mouseX = 140;
          catY = -phase3t*0.5 + Math.sin(phase3t*0.3)*3;
          mouseY = -phase3t*0.4 + Math.sin(phase3t*0.3+1)*2;
          if (phase3t%4===0) { spawnP(catX+20,bgl-catH,4,255,215,0,-1); spawnP(mouseX+10,bgl-mouseH,3,100,200,255,-1); }
        } else if (phase3t < 40) {
          // Cat dashes
          catX = 100 + (phase3t-20)*8;
          catY = -Math.abs(Math.sin(phase3t*0.3))*10;
          mouseX = 140; mouseY = Math.abs(Math.sin(phase3t*0.15))*3;
        } else if (phase3t === 40) {
          playSFX('slash'); slashFrame = 0;
        } else if (phase3t === 48) {
          bossHit=true; bossHP=40; bossShake=8; playSFX('hit');
          spawnP(bossX,bgl-40,20,255,150,200);
        } else if (phase3t === 54) { bossHit=false; }
        else if (phase3t < 65) {
          catX = bossX - 80; catY = Math.abs(Math.sin(phase3t*0.2))*4;
          // Mouse charges next!
          mouseX = 140 + (phase3t-54)*7;
          mouseY = -Math.abs(Math.sin(phase3t*0.3))*8;
        } else if (phase3t === 65) {
          playSFX('slash'); slashFrame = 0;
        } else if (phase3t === 72) {
          bossHit=true; bossHP=10; bossShake=10; playSFX('hit');
          spawnP(bossX,bgl-30,20,200,100,255);
        } else if (phase3t === 78) { bossHit=false; }
        else {
          catX = bossX-80; mouseX = bossX-50;
          catY = Math.abs(Math.sin(phase3t*0.15))*4;
          mouseY = Math.abs(Math.sin(phase3t*0.15+1))*3;
        }
      } else if (t < 380) {
        // Final blow
        const fbt = t - 340;
        bossX = CW-130;
        if (fbt < 15) {
          catX = bossX-120 + fbt*8; mouseX = bossX-100 + fbt*7;
          catY = -15 + fbt; mouseY = -12 + fbt;
        } else if (fbt === 15) {
          playSFX('slash'); slashFrame = 0;
        } else if (fbt === 22) {
          bossHit=true; bossHP=0; bossShake=15; playSFX('hit');
          spawnP(bossX,bgl-50,40,255,200,50);
          spawnP(bossX,bgl-20,30,200,50,255);
        } else if (fbt === 30) { bossHit=false; }
        else {
          catX = 180; mouseX = 240;
          catY = Math.abs(Math.sin(fbt*0.2))*6;
          mouseY = Math.abs(Math.sin(fbt*0.2+1))*4;
        }
      } else {
        // Victory!
        catX = 180; mouseX = 240;
        catY = Math.abs(Math.sin(t*0.18))*10;
        mouseY = Math.abs(Math.sin(t*0.18+1.5))*8;
        catAngle = Math.sin(t*0.12)*0.15;
        mouseAngle = Math.sin(t*0.1)*0.12;
        if (t%8===0) spawnP(Math.random()*CW, Math.random()*100+50, 3, 255,215,0);
      }
      if (slashFrame>=0) slashFrame++;
      if (slashFrame>10) slashFrame=-1;
      if (bossShake>0) bossShake*=0.9;
    }

    /* ── titleEnd: victory celebration ── */
    else if (name === 'titleEnd') {
      const et = t;
      if (et < 60) {
        catX = CW/2-40; mouseX = CW/2+20;
        catY = Math.abs(Math.sin(et*0.15))*10;
        mouseY = Math.abs(Math.sin(et*0.15+1.5))*8;
      } else if (et < 140) {
        // Jump and spin celebration
        catX = CW/2-40 + Math.sin(et*0.04)*30;
        mouseX = CW/2+20 + Math.sin(et*0.04+Math.PI)*25;
        catY = Math.abs(Math.sin(et*0.18))*15;
        mouseY = Math.abs(Math.sin(et*0.18+1))*12;
        catAngle = Math.sin(et*0.12)*0.2;
        mouseAngle = -Math.sin(et*0.1)*0.18;
      } else {
        // Settle, face forward
        catX = CW/2-40; mouseX = CW/2+20;
        catY = Math.abs(Math.sin(et*0.1))*5;
        mouseY = Math.abs(Math.sin(et*0.1+0.5))*4;
        catAngle = Math.sin(et*0.06)*0.05;
        mouseAngle = 0;
      }
      if (et%10===0) spawnP(Math.random()*CW, Math.random()*CH*0.5, 3, 255,215,0);
    }
  }

  /* ── DRAW ── */
  function draw() {
    ctx.fillStyle='#000';ctx.fillRect(0,0,CW,CH);

    const name = SCENES[sceneIdx].name;
    const gl = 210;
    const t = sceneTimer;
    const lImg = animFrame===0?images.l1:images.l2;
    const rImg = animFrame===0?images.r1:images.r2;

    /* ── titleFlash ── */
    if (name === 'titleFlash') {
      drawAdventureBG(gl);
      // Title
      const ta = Math.min(1, t/60);
      ctx.save();ctx.globalAlpha=ta;
      const bounce = t<60 ? Math.sin(t*0.1)*(1-t/60)*10 : 0;
      px('にゃんこ先生のFX講座', CW/2, 50+bounce, 24, '#FFD700');
      px('〜 ぼうけんの はじまり 〜', CW/2, 78, 11, '#FFF');
      ctx.restore();
      if (t>40){ctx.save();ctx.globalAlpha=Math.min(1,(t-40)/30);
        ctx.strokeStyle='#DAA520';ctx.lineWidth=2;ctx.strokeRect(CW/2-140,32,280,56);
        ctx.strokeStyle='#B8860B';ctx.lineWidth=1;ctx.strokeRect(CW/2-137,35,274,50);ctx.restore();}
      drawShadow(catX,gl,catH);drawShadow(mouseX,gl,mouseH);
      drawChar(lImg, catX, gl-catH-Math.max(0,catY), catH, false, catAngle);
      drawChar(rImg, mouseX, gl-mouseH-Math.max(0,mouseY), mouseH, true, mouseAngle);
      // Exclamation
      if (t>60&&t<100){
        const fl=Math.floor(f/6)%2===0;
        if(fl){ctx.fillStyle='#FF4444';
          ctx.fillRect(catX+catH*0.3,gl-catH-Math.max(0,catY)-18,4,10);
          ctx.fillRect(catX+catH*0.3,gl-catH-Math.max(0,catY)-6,4,4);
        }
      }
    }

    /* ── adventure ── */
    else if (name === 'adventure') {
      drawAdventureBG(gl);
      drawShadow(catX,gl,catH);drawShadow(mouseX,gl,mouseH);
      drawChar(lImg,catX,gl-catH-Math.max(0,catY),catH,false,catAngle);
      drawChar(rImg,mouseX,gl-mouseH-Math.max(0,mouseY),mouseH,true,mouseAngle);
      // Text phases
      ctx.save();
      if (t < 80) {
        ctx.globalAlpha = Math.min(1, t/30);
        px('ぼうけんの はじまりだ！', CW/2, 30, 16, '#FFF');
      } else if (t < 160) {
        ctx.globalAlpha = Math.min(1, (t-80)/30);
        px('いくぞ！', CW/2, 30, 18, '#FFDD44');
      } else if (t > 200) {
        ctx.globalAlpha = Math.min(1, (t-200)/20);
        px('この先に 何が待つのか...', CW/2, 30, 14, '#DDD');
      }
      ctx.restore();
      // Dust when jogging
      if (t>60&&t<120&&f%6===0){spawnP(catX+10,gl,2,180,160,120);}
    }

    /* ── makai ── */
    else if (name === 'makai') {
      drawMakaiBG(gl);
      drawSceneTitle('── 魔  界 ──', '#FF3344');

      // レンジ monster
      if (rangeHP > 0 || t < 250) {
        const rAlpha = rangeHP<=0 ? Math.max(0, 1-(t-240)/20) : 1;
        ctx.save();ctx.globalAlpha=rAlpha;
        drawRange(rangeX, gl);
        ctx.restore();
      }
      // Slash effect on レンジ
      if (t>=160&&t<240) drawSlash(rangeX, gl-30);

      // Characters
      drawShadow(catX,gl,catH);drawShadow(mouseX,gl,mouseH);
      drawChar(lImg,catX,gl-catH-Math.max(0,catY),catH,false,catAngle);
      drawChar(rImg,mouseX,gl-mouseH-Math.max(0,mouseY),mouseH,true,mouseAngle);

      // Sweat drops when scared
      if (t>40&&t<90){
        ctx.fillStyle='#88CCFF';
        ctx.fillRect(catX+catH*0.5,gl-catH+5,3,5);
        ctx.fillRect(catX+catH*0.5+1,gl-catH+10,1,2);
      }
      // !? when first seeing レンジ
      if (t>50&&t<80){
        ctx.save();const fl=Math.floor(f/6)%2===0;
        if(fl){px('!?', catX+catH*0.3, gl-catH-20, 14, '#FFDD00');}
        ctx.restore();
      }
      // Victory after defeating レンジ
      if (rangeHP<=0&&t>250){
        ctx.save();ctx.globalAlpha=Math.min(1,(t-250)/20);
        px('レンジを たおした！', CW/2, CH/2-30, 18, '#FFD700');
        ctx.restore();
      }
    }

    /* ── heaven ── */
    else if (name === 'heaven') {
      drawHeavenBG(gl);
      drawSceneTitle('── 天  国 ──', '#FFD700');

      // 強トレンド angel
      drawStrongTrend(trendX, trendY);

      // Characters
      drawChar(lImg,catX,gl-catH-Math.max(0,catY)-20,catH,false,catAngle);
      drawChar(rImg,mouseX,gl-mouseH-Math.max(0,mouseY)-20,mouseH,true,mouseAngle);

      // Hearts
      if (t>40){
        ctx.fillStyle='#FF69B4';
        for(let i=0;i<3;i++){
          const hx=100+i*120+Math.sin(f*0.02+i*2)*15;
          const hy=200-(f*0.3+i*60)%200;
          ctx.save();ctx.globalAlpha=(hy<30?hy/30:1)*0.6;
          drawHeart(hx,hy,4);ctx.restore();
        }
      }

      // Blessing text
      if (t>140&&t<180){
        ctx.save();ctx.globalAlpha=Math.min(1,(t-140)/15)*(t<170?1:(180-t)/10);
        px('強トレンドの ちからを えた！', CW/2, 30, 14, '#FFD700');
        ctx.restore();
      }
      // Dance text
      if (t>200&&t<260){
        ctx.save();ctx.globalAlpha=0.5+Math.sin(f*0.06)*0.3;
        px('♪ ♪ ♪', CW/2, 25, 16, '#FFAACC');
        ctx.restore();
      }
    }

    /* ── boss (メンタル) ── */
    else if (name === 'boss') {
      drawBossBG(gl);
      drawSceneTitle('── 強敵「メンタル」 ──', '#CC00FF');

      // メンタル boss
      if (bossHP>0||t<380){
        const ba = bossHP<=0 ? Math.max(0,1-(t-350)/30) : (t<100 ? Math.min(1,(t-60)/20) : 1);
        ctx.save();ctx.globalAlpha=ba;
        drawMental(bossX, gl-20);
        ctx.restore();
      }

      // Boss defeated explosion
      if (bossHP<=0&&t>350&&t<390){if(t%4===0)spawnP(bossX+Math.random()*60-30,gl-50,8,200,50+Math.random()*150,255);}

      // Slash effects
      drawSlash(bossX, gl-30);

      // Characters
      drawShadow(catX,gl,catH);drawShadow(mouseX,gl,mouseH);
      drawChar(lImg,catX,gl-catH-Math.max(0,catY),catH,false,catAngle);
      drawChar(rImg,mouseX,gl-mouseH-Math.max(0,mouseY),mouseH,true,mouseAngle);

      // Victory text
      if (bossHP<=0&&t>380){
        ctx.save();ctx.globalAlpha=Math.min(1,(t-380)/30);
        px('メンタルに 勝った！', CW/2, CH/2-20, 24, '#FFD700');
        ctx.restore();
      }
    }

    /* ── titleEnd ── */
    else if (name === 'titleEnd') {
      const sg=ctx.createLinearGradient(0,0,0,CH);
      sg.addColorStop(0,'#1a0a2e');sg.addColorStop(0.5,'#2d1b69');sg.addColorStop(1,'#0a0a20');
      ctx.fillStyle=sg;ctx.fillRect(0,0,CW,CH);
      // Stars
      for(let i=0;i<30;i++){
        const sx=(i*17+f*0.1)%CW,sy=(i*11)%(CH*0.6);
        ctx.fillStyle=`rgba(255,255,200,${(Math.sin(f*0.05+i*0.7)>0?1:0.3)*0.8})`;
        ctx.fillRect(~~sx,~~sy,2,2);
      }
      // Title
      ctx.save();ctx.globalAlpha=Math.min(1,t/60);
      ctx.shadowColor='#FFD700';ctx.shadowBlur=15+Math.sin(f*0.05)*5;
      px('にゃんこ先生のFX講座',CW/2,65,26,'#FFD700');
      ctx.shadowBlur=0;
      px('〜 ぼうけんは つづく 〜',CW/2,95,12,'#FFF');
      ctx.restore();
      // Characters
      drawShadow(catX,gl,catH);drawShadow(mouseX,gl,mouseH);
      drawChar(lImg,catX,gl-catH-Math.max(0,catY),catH,false,catAngle);
      drawChar(rImg,mouseX,gl-mouseH-Math.max(0,mouseY),mouseH,true,mouseAngle);
      // Subscribe
      if(t>120){ctx.save();ctx.globalAlpha=Math.min(1,(t-120)/30)*(0.6+Math.sin(f*0.08)*0.4);
        px('チャンネル登録よろしくね！',CW/2,245,14,'#FF6B6B');ctx.restore();}
    }

    drawParticles();

    // Transition overlay
    if(transAlpha>0){
      ctx.fillStyle=transColor==='#FFF'?`rgba(255,255,255,${transAlpha})`:`rgba(0,0,0,${transAlpha})`;
      ctx.fillRect(0,0,CW,CH);
    }
    // Scanlines
    ctx.fillStyle='rgba(0,0,0,0.04)';
    for(let y=0;y<CH;y+=3)ctx.fillRect(0,y,CW,1);
  }

  function loop(){update();draw();requestAnimationFrame(loop);}
  loop();
})();
