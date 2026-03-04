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
  let f = 0;               // global frame counter
  let animFrame = 0;
  let stepTimer = 0;

  // Scene list and timing (frames @ 60 fps)
  const SCENES = [
    { name: 'titleFlash',   dur: 180 },   // 3 s  – title intro
    { name: 'adventure',    dur: 240 },   // 4 s  – walking along road
    { name: 'makai',        dur: 300 },   // 5 s  – 魔界
    { name: 'heaven',       dur: 300 },   // 5 s  – 天国
    { name: 'boss',         dur: 360 },   // 6 s  – ボス対峙
    { name: 'titleEnd',     dur: 240 },   // 4 s  – ending title
  ];
  let sceneIdx = 0;
  let sceneTimer = 0;
  let transAlpha = 0;       // transition overlay alpha
  let transDir = 0;          // 1 = fading out, -1 = fading in
  let transColor = '#000';

  // Character state
  const catH = 70;
  const mouseH = 36;
  let catX, catY, mouseX, mouseY;
  let catVY = 0, mouseVY = 0;
  let catGround = true, mouseGround = true;

  // Boss
  let bossHP = 100;
  let bossShake = 0;
  let bossHit = false;
  let slashFrame = -1;

  // Particles
  const particles = [];

  function resetCharPositions() {
    catX = 60; catY = 0; mouseX = 130; mouseY = 0;
    catVY = 0; mouseVY = 0;
    catGround = true; mouseGround = true;
  }
  resetCharPositions();

  /* ── Audio ── */
  let audioCtx = null;
  let bgmStarted = false;
  let masterGain = null;

  const noteFreqs = {
    'C3':130.81,'D3':146.83,'E3':164.81,'F3':174.61,'G3':196,'A3':220,'B3':246.94,
    'C4':261.63,'D4':293.66,'E4':329.63,'F4':349.23,'G4':392,'A4':440,'B4':493.88,
    'C5':523.25,'D5':587.33,'E5':659.25,'F5':698.46,'G5':783.99,'A5':880,'B5':987.77,
    'C6':1046.5,'D6':1174.66,'E6':1318.51
  };

  function playNote(freq, start, dur, type, vol) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.connect(g); g.connect(masterGain);
    o.start(start); o.stop(start + dur + 0.05);
  }

  function playDrum(start, kind) {
    if (!audioCtx) return;
    if (kind === 'kick') {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, start);
      o.frequency.exponentialRampToValueAtTime(30, start + 0.12);
      g.gain.setValueAtTime(0.5, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      o.connect(g); g.connect(masterGain);
      o.start(start); o.stop(start + 0.2);
    } else {
      const len = 0.04;
      const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * len, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const n = audioCtx.createBufferSource(); n.buffer = buf;
      const g = audioCtx.createGain();
      const filt = audioCtx.createBiquadFilter();
      filt.type = 'highpass'; filt.frequency.value = 8000;
      g.gain.setValueAtTime(0.2, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + len);
      n.connect(filt); filt.connect(g); g.connect(masterGain);
      n.start(start); n.stop(start + len + 0.01);
    }
  }

  function startBGM() {
    if (bgmStarted) return;
    bgmStarted = true;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.18;
    masterGain.connect(audioCtx.destination);
    scheduleBGMLoop(audioCtx.currentTime + 0.1);
  }

  function scheduleBGMLoop(t0) {
    const bpm = 155;
    const beat = 60 / bpm;
    const bar = beat * 4;
    const loopBars = 16;

    // Epic adventure melody (two 8-bar phrases)
    const melodyBars = [
      // Phrase 1 – heroic ascending
      [['E5',0,0.8],['G5',1,0.8],['A5',2,0.5],['B5',2.5,0.5],['C6',3,1]],
      [['B5',0,0.5],['A5',0.5,0.5],['G5',1,1],['E5',2,0.5],['G5',2.5,0.5],['A5',3,1]],
      [['G5',0,0.8],['A5',1,0.8],['B5',2,0.5],['C6',2.5,0.5],['D6',3,1]],
      [['C6',0,1],['B5',1,0.5],['A5',1.5,0.5],['G5',2,2]],
      // Phrase 1 repeat with variation
      [['E5',0,0.8],['G5',1,0.8],['A5',2,0.5],['B5',2.5,0.5],['C6',3,1]],
      [['D6',0,0.5],['C6',0.5,0.5],['B5',1,1],['A5',2,0.5],['G5',2.5,0.5],['A5',3,1]],
      [['B5',0,0.8],['C6',1,0.8],['D6',2,1],['E6',3,0.5],['D6',3.5,0.5]],
      [['C6',0,1.5],['B5',2,0.5],['A5',2.5,0.5],['G5',3,1]],
      // Phrase 2 – intense battle
      [['A5',0,0.5],['A5',0.5,0.5],['C6',1,1],['A5',2,0.5],['G5',2.5,0.5],['A5',3,1]],
      [['B5',0,0.5],['B5',0.5,0.5],['D6',1,1],['B5',2,0.5],['A5',2.5,0.5],['B5',3,1]],
      [['C6',0,1],['D6',1,0.5],['E6',1.5,0.5],['D6',2,1],['C6',3,1]],
      [['B5',0,1],['A5',1,1],['G5',2,2]],
      // Phrase 2 climax
      [['E5',0,0.5],['G5',0.5,0.5],['A5',1,0.5],['B5',1.5,0.5],['C6',2,0.5],['D6',2.5,0.5],['E6',3,1]],
      [['D6',0,1],['C6',1,0.5],['B5',1.5,0.5],['A5',2,1],['G5',3,1]],
      [['A5',0,1],['B5',1,1],['C6',2,1],['D6',3,1]],
      [['E6',0,2],['C6',2,1],['G5',3,1]],
    ];

    // Bass progression
    const bassNotes = [
      'A3','A3','C4','C4','A3','A3','E3','E3',
      'F3','G3','A3','E3','F3','D3','G3','A3'
    ];

    for (let b = 0; b < loopBars; b++) {
      const barStart = t0 + b * bar;

      // Melody
      if (melodyBars[b]) {
        melodyBars[b].forEach(([note, beatOff, dur]) => {
          playNote(noteFreqs[note], barStart + beatOff * beat, dur * beat, 'square', 0.25);
        });
      }

      // Bass
      const bassFreq = noteFreqs[bassNotes[b]];
      for (let bb = 0; bb < 4; bb++) {
        playNote(bassFreq, barStart + bb * beat, beat * 0.7, 'triangle', 0.35);
      }

      // Arpeggio harmony
      const arpRoot = bassFreq * 2;
      for (let a = 0; a < 8; a++) {
        const arpFreq = arpRoot * [1, 1.25, 1.5, 1.25][a % 4];
        playNote(arpFreq, barStart + a * beat * 0.5, beat * 0.4, 'square', 0.08);
      }

      // Drums
      for (let bb = 0; bb < 4; bb++) {
        playDrum(barStart + bb * beat, 'kick');
        if (bb % 2 === 1) playDrum(barStart + bb * beat, 'hat');
        if (b >= 8) playDrum(barStart + bb * beat + beat * 0.5, 'hat'); // faster hats in battle
      }
    }

    const loopDur = loopBars * bar;
    setTimeout(() => {
      if (audioCtx && audioCtx.state === 'running') scheduleBGMLoop(t0 + loopDur);
    }, (loopDur - 1) * 1000);
  }

  function playSFX(type) {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    if (type === 'slash') {
      // Swoosh sound
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(800, t);
      o.frequency.exponentialRampToValueAtTime(100, t + 0.15);
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(g); g.connect(masterGain);
      o.start(t); o.stop(t + 0.25);
    } else if (type === 'hit') {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(120, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(g); g.connect(masterGain);
      o.start(t); o.stop(t + 0.25);
    } else if (type === 'heaven') {
      [1, 1.25, 1.5, 2].forEach((m, i) => {
        playNote(440 * m, t + i * 0.12, 0.6, 'sine', 0.15);
      });
    }
  }

  // Init audio on interaction
  function initAudio() {
    startBGM();
    document.removeEventListener('click', initAudio);
    document.removeEventListener('touchstart', initAudio);
  }
  document.addEventListener('click', initAudio);
  document.addEventListener('touchstart', initAudio);
  setTimeout(() => { try { startBGM(); } catch(e){} }, 100);

  /* ── helpers ── */
  function px(text, x, y, size, color, align) {
    ctx.font = size + 'px "DotGothic16", sans-serif';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    // outline
    ctx.fillStyle = '#000';
    for (let ox = -2; ox <= 2; ox++)
      for (let oy = -2; oy <= 2; oy++)
        if (ox || oy) ctx.fillText(text, x + ox, y + oy);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function drawChar(img, x, y, h, flip) {
    if (!img.complete || !img.naturalWidth) return;
    const w = h * (img.width / img.height);
    ctx.save();
    if (flip) { ctx.translate(~~x + w, ~~y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, h); }
    else ctx.drawImage(img, ~~x, ~~y, w, h);
    ctx.restore();
  }

  function spawnP(x, y, n, r, g, b) {
    for (let i = 0; i < n; i++)
      particles.push({ x: x + Math.random()*20-10, y: y+Math.random()*10-5,
        vx:(Math.random()-0.5)*4, vy:(Math.random()-0.5)*3-2,
        life:30+Math.random()*20, ml:50, s:Math.random()*3+2, r, g, b });
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  function drawParticles() {
    particles.forEach(p => {
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.life/p.ml})`;
      ctx.fillRect(~~p.x, ~~p.y, p.s, p.s);
    });
  }

  /* ── scene backgrounds ── */
  let roadOff = 0;
  const makaiFireParticles = [];

  function drawAdventureBG(groundLine) {
    // Sky
    const sg = ctx.createLinearGradient(0, 0, 0, groundLine);
    sg.addColorStop(0, '#4BA3FF');
    sg.addColorStop(0.6, '#A8DCFF');
    sg.addColorStop(1, '#FFE8A0');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, CW, CH);

    // Sun
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath(); ctx.arc(CW-60, 40, 20, 0, Math.PI*2); ctx.fill();
    const sg2 = ctx.createRadialGradient(CW-60, 40, 18, CW-60, 40, 45);
    sg2.addColorStop(0, 'rgba(255,240,150,0.3)'); sg2.addColorStop(1, 'rgba(255,240,150,0)');
    ctx.fillStyle = sg2;
    ctx.beginPath(); ctx.arc(CW-60, 40, 45, 0, Math.PI*2); ctx.fill();

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    [[50+((f*0.3)%CW), 25, 50], [200+((f*0.2)%CW), 15, 40], [350+((f*0.25)%CW), 35, 35]].forEach(([cx,cy,w]) => {
      const rx = cx % (CW+60) - 30;
      ctx.fillRect(rx, cy, w, 8);
      ctx.fillRect(rx+8, cy-5, w-16, 5);
    });

    // Hills
    ctx.fillStyle = '#5BAF5B';
    for (let x = 0; x < CW; x += 2) {
      const h = Math.sin(x*0.012+1)*20 + Math.sin(x*0.025)*12 + 50;
      ctx.fillRect(x, groundLine-h, 2, h);
    }
    ctx.fillStyle = '#4A9E4A';
    for (let x = 0; x < CW; x += 2) {
      const h = Math.sin(x*0.02+3)*15 + Math.sin(x*0.01+1)*10 + 32;
      ctx.fillRect(x, groundLine-h, 2, h);
    }

    // Ground
    ctx.fillStyle = '#6BBF6B'; ctx.fillRect(0, groundLine, CW, CH-groundLine);

    // Road
    roadOff = (roadOff + 0.6) % 16;
    ctx.fillStyle = '#C4A46C';
    ctx.beginPath();
    ctx.moveTo(CW/2-50, CH); ctx.lineTo(CW/2+50, CH);
    ctx.lineTo(CW/2+12, groundLine); ctx.lineTo(CW/2-12, groundLine);
    ctx.closePath(); ctx.fill();
    // Dashes
    ctx.fillStyle = '#E8D8A8';
    for (let d = 0; d < 8; d++) {
      const t = (d*16+roadOff)/(CH-groundLine);
      if (t > 1) continue;
      const y = groundLine + t*(CH-groundLine);
      ctx.fillRect(CW/2 - (1+t*4), y, 2+t*8, 2+t*3);
    }
  }

  function drawMakaiBG(groundLine) {
    // Dark gradient sky
    const sg = ctx.createLinearGradient(0, 0, 0, CH);
    sg.addColorStop(0, '#1a0011');
    sg.addColorStop(0.3, '#330022');
    sg.addColorStop(0.6, '#550000');
    sg.addColorStop(1, '#220000');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, CW, CH);

    // Ominous red moon
    const moonX = 100, moonY = 50;
    ctx.fillStyle = '#880022';
    ctx.beginPath(); ctx.arc(moonX, moonY, 25, 0, Math.PI*2); ctx.fill();
    const mg = ctx.createRadialGradient(moonX, moonY, 20, moonX, moonY, 60);
    mg.addColorStop(0, 'rgba(200,0,40,0.3)'); mg.addColorStop(1, 'rgba(200,0,40,0)');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(moonX, moonY, 60, 0, Math.PI*2); ctx.fill();

    // Dark jagged mountains
    ctx.fillStyle = '#220011';
    for (let x = 0; x < CW; x += 2) {
      const h = Math.abs(Math.sin(x*0.03)*40 + Math.sin(x*0.07+2)*20) + 30;
      ctx.fillRect(x, groundLine - h, 2, h);
    }

    // Lava rivers on ground
    ctx.fillStyle = '#330000'; ctx.fillRect(0, groundLine, CW, CH - groundLine);
    // Lava cracks
    ctx.fillStyle = '#FF4400';
    for (let i = 0; i < 8; i++) {
      const lx = (i * 62 + f * 0.2) % CW;
      const ly = groundLine + 4 + Math.sin(lx * 0.1) * 3;
      ctx.fillRect(lx, ly, 15 + Math.sin(f*0.05+i)*5, 2);
    }

    // Fire particles rising
    if (f % 3 === 0) {
      makaiFireParticles.push({
        x: Math.random() * CW, y: CH,
        vy: -1 - Math.random() * 2,
        life: 40 + Math.random() * 30,
        ml: 70, s: Math.random() * 3 + 1
      });
    }
    for (let i = makaiFireParticles.length - 1; i >= 0; i--) {
      const p = makaiFireParticles[i];
      p.x += Math.sin(f * 0.03 + i) * 0.5;
      p.y += p.vy; p.life--;
      if (p.life <= 0) { makaiFireParticles.splice(i, 1); continue; }
      const a = p.life / p.ml;
      const r = 255, g = Math.floor(100 * a), b = 0;
      ctx.fillStyle = `rgba(${r},${g},${b},${a * 0.7})`;
      ctx.fillRect(~~p.x, ~~p.y, p.s, p.s);
    }

    // Demon silhouettes in background
    const demonX1 = 350 + Math.sin(f * 0.02) * 5;
    const demonX2 = 420 + Math.sin(f * 0.025 + 1) * 5;
    drawDemonSilhouette(demonX1, groundLine - 50, 0.7);
    drawDemonSilhouette(demonX2, groundLine - 35, 0.5);

    // Floating skulls
    ctx.fillStyle = 'rgba(200,180,180,0.2)';
    for (let i = 0; i < 3; i++) {
      const sx = (100 + i * 150 + Math.sin(f * 0.01 + i * 2) * 20) % CW;
      const sy = 40 + i * 20 + Math.sin(f * 0.02 + i) * 8;
      // Simple skull shape
      ctx.fillRect(sx, sy, 8, 6);
      ctx.fillRect(sx + 1, sy + 6, 6, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(sx + 1, sy + 2, 2, 2);
      ctx.fillRect(sx + 5, sy + 2, 2, 2);
      ctx.fillStyle = 'rgba(200,180,180,0.2)';
    }

    // Eerie ambient glow at bottom
    const eg = ctx.createLinearGradient(0, CH - 30, 0, CH);
    eg.addColorStop(0, 'rgba(255,50,0,0)');
    eg.addColorStop(1, 'rgba(255,50,0,0.15)');
    ctx.fillStyle = eg; ctx.fillRect(0, CH - 30, CW, 30);
  }

  function drawDemonSilhouette(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(20,0,10,0.7)';
    // Body
    ctx.fillRect(-10, 0, 20, 30);
    // Head
    ctx.fillRect(-8, -12, 16, 14);
    // Horns
    ctx.fillRect(-12, -18, 4, 8);
    ctx.fillRect(8, -18, 4, 8);
    // Wings
    ctx.fillRect(-28, -5, 18, 20);
    ctx.fillRect(10, -5, 18, 20);
    // Eyes (red glow)
    ctx.fillStyle = `rgba(255,0,0,${0.5 + Math.sin(f * 0.08) * 0.3})`;
    ctx.fillRect(-4, -8, 3, 3);
    ctx.fillRect(2, -8, 3, 3);
    ctx.restore();
  }

  function drawHeavenBG(groundLine) {
    // Heavenly sky gradient
    const sg = ctx.createLinearGradient(0, 0, 0, CH);
    sg.addColorStop(0, '#FFF8E0');
    sg.addColorStop(0.3, '#FFE8A0');
    sg.addColorStop(0.5, '#FFDAA0');
    sg.addColorStop(0.8, '#E8F4FF');
    sg.addColorStop(1, '#D0EEFF');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, CW, CH);

    // Light beams from above
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const bx = 60 + i * 90 + Math.sin(f * 0.005 + i) * 15;
      const alpha = 0.08 + Math.sin(f * 0.02 + i * 1.5) * 0.04;
      ctx.fillStyle = `rgba(255,255,200,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(bx - 5, 0);
      ctx.lineTo(bx + 5, 0);
      ctx.lineTo(bx + 40, CH);
      ctx.lineTo(bx - 40, CH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Fluffy clouds as ground
    ctx.fillStyle = '#FFF';
    for (let x = 0; x < CW; x += 2) {
      const h = Math.sin(x * 0.02) * 10 + Math.sin(x * 0.05 + f * 0.01) * 5 + 25;
      ctx.fillRect(x, groundLine - h, 2, h + CH - groundLine);
    }
    ctx.fillStyle = 'rgba(255,250,230,0.6)';
    for (let x = 0; x < CW; x += 2) {
      const h = Math.sin(x * 0.03 + 1) * 8 + Math.sin(x * 0.06 + f * 0.008) * 4 + 18;
      ctx.fillRect(x, groundLine - h, 2, h);
    }

    // Floating halos / golden sparkles
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 10; i++) {
      const sx = (f * 0.5 + i * 50) % CW;
      const sy = 20 + Math.sin(f * 0.02 + i * 0.7) * 15 + i * 10;
      const sparkSize = 2 + Math.sin(f * 0.05 + i) * 1;
      if (sparkSize > 0) {
        ctx.fillRect(~~sx, ~~sy, ~~sparkSize, ~~sparkSize);
        ctx.fillRect(~~sx - 1, ~~sy + 1, ~~sparkSize + 2, 1);
        ctx.fillRect(~~sx + 1, ~~sy - 1, 1, ~~sparkSize + 2);
      }
    }

    // Angel silhouettes
    drawAngelSilhouette(380, 60 + Math.sin(f * 0.015) * 10, 0.6);
    drawAngelSilhouette(80, 45 + Math.sin(f * 0.02 + 1) * 8, 0.4);

    // Rainbow bridge
    ctx.save();
    ctx.globalAlpha = 0.2;
    const colors = ['#FF0000','#FF7700','#FFFF00','#00FF00','#0077FF','#4400FF','#8800FF'];
    colors.forEach((c, i) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(CW / 2, groundLine + 60, 130 - i * 4, Math.PI, 0);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawAngelSilhouette(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    // Body
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(-8, 0, 16, 24);
    // Head
    ctx.fillRect(-6, -10, 12, 12);
    // Wings
    ctx.fillStyle = 'rgba(255,255,220,0.4)';
    ctx.fillRect(-24, -4, 16, 16);
    ctx.fillRect(8, -4, 16, 16);
    ctx.fillRect(-20, -8, 8, 8);
    ctx.fillRect(12, -8, 8, 8);
    // Halo
    ctx.fillStyle = `rgba(255,215,0,${0.5 + Math.sin(f * 0.05) * 0.2})`;
    ctx.fillRect(-5, -15, 10, 3);
    ctx.fillRect(-7, -14, 14, 1);
    ctx.restore();
  }

  function drawBossBG(groundLine) {
    // Dark stormy sky
    const sg = ctx.createLinearGradient(0, 0, 0, CH);
    sg.addColorStop(0, '#0a0a1a');
    sg.addColorStop(0.5, '#1a1030');
    sg.addColorStop(1, '#0d0d1a');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, CW, CH);

    // Lightning flash
    if (sceneTimer % 120 < 3) {
      ctx.fillStyle = `rgba(200,200,255,${0.3 - sceneTimer % 120 * 0.1})`;
      ctx.fillRect(0, 0, CW, CH);
    }

    // Lightning bolt occasionally
    if (sceneTimer % 120 === 0 || sceneTimer % 120 === 80) {
      ctx.strokeStyle = '#AABBFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let lx = Math.random() * CW;
      ctx.moveTo(lx, 0);
      for (let ly = 0; ly < groundLine; ly += 15) {
        lx += (Math.random() - 0.5) * 20;
        ctx.lineTo(lx, ly);
      }
      ctx.stroke();
    }

    // Dark arena ground
    ctx.fillStyle = '#1a1520';
    ctx.fillRect(0, groundLine, CW, CH - groundLine);
    // Purple magic circles on ground
    ctx.save();
    ctx.globalAlpha = 0.15 + Math.sin(f * 0.04) * 0.05;
    ctx.strokeStyle = '#8844FF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(CW / 2, groundLine + 30, 80 + Math.sin(f * 0.03) * 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(CW / 2, groundLine + 30, 60 + Math.sin(f * 0.04 + 1) * 4, 0, Math.PI * 2);
    ctx.stroke();
    // Inner pentagram-like lines
    for (let i = 0; i < 5; i++) {
      const angle1 = (i / 5) * Math.PI * 2 + f * 0.01;
      const angle2 = ((i + 2) / 5) * Math.PI * 2 + f * 0.01;
      ctx.beginPath();
      ctx.moveTo(CW/2 + Math.cos(angle1)*60, groundLine+30 + Math.sin(angle1)*20);
      ctx.lineTo(CW/2 + Math.cos(angle2)*60, groundLine+30 + Math.sin(angle2)*20);
      ctx.stroke();
    }
    ctx.restore();

    // Ground cracks
    ctx.strokeStyle = '#442266';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(CW/2 + (i-3) * 40, groundLine + 2);
      ctx.lineTo(CW/2 + (i-3) * 50 + Math.sin(i)*10, CH);
      ctx.stroke();
    }
  }

  /* ── boss monster ── */
  function drawBoss(x, y) {
    const shake = bossShake > 0 ? (Math.random() - 0.5) * bossShake : 0;
    ctx.save();
    ctx.translate(x + shake, y);

    // Body (dark purple dragon-like)
    ctx.fillStyle = '#2A0845';
    ctx.fillRect(-25, -20, 50, 55); // torso
    ctx.fillRect(-30, -10, 60, 35); // wider body

    // Head
    ctx.fillStyle = '#3A1055';
    ctx.fillRect(-18, -50, 36, 32);
    // Jaw
    ctx.fillRect(-15, -20, 30, 10);

    // Horns
    ctx.fillStyle = '#444';
    ctx.fillRect(-22, -60, 6, 14);
    ctx.fillRect(16, -60, 6, 14);
    ctx.fillRect(-24, -66, 4, 8);
    ctx.fillRect(20, -66, 4, 8);

    // Eyes (menacing, glowing)
    const eyeGlow = 0.7 + Math.sin(f * 0.1) * 0.3;
    ctx.fillStyle = `rgba(255,50,50,${eyeGlow})`;
    ctx.fillRect(-12, -44, 8, 6);
    ctx.fillRect(4, -44, 8, 6);
    // Pupils
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(-10, -42, 4, 4);
    ctx.fillRect(6, -42, 4, 4);

    // Teeth
    ctx.fillStyle = '#DDD';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(-12 + i * 6, -22, 4, 5);
    }

    // Arms/claws
    ctx.fillStyle = '#2A0845';
    ctx.fillRect(-40, -5, 12, 30);
    ctx.fillRect(28, -5, 12, 30);
    // Claws
    ctx.fillStyle = '#666';
    ctx.fillRect(-42, 22, 4, 8);
    ctx.fillRect(-38, 24, 4, 8);
    ctx.fillRect(34, 22, 4, 8);
    ctx.fillRect(38, 24, 4, 8);

    // Wings
    ctx.fillStyle = 'rgba(50,10,80,0.8)';
    const wingFlap = Math.sin(f * 0.06) * 5;
    ctx.fillRect(-60, -40 + wingFlap, 22, 40);
    ctx.fillRect(38, -40 - wingFlap, 22, 40);
    ctx.fillRect(-55, -30 + wingFlap, 15, 30);
    ctx.fillRect(40, -30 - wingFlap, 15, 30);

    // Legs
    ctx.fillStyle = '#2A0845';
    ctx.fillRect(-20, 30, 14, 20);
    ctx.fillRect(6, 30, 14, 20);
    // Feet
    ctx.fillStyle = '#333';
    ctx.fillRect(-24, 46, 18, 6);
    ctx.fillRect(6, 46, 18, 6);

    // Tail
    ctx.fillStyle = '#2A0845';
    const tailWag = Math.sin(f * 0.04) * 8;
    ctx.fillRect(25, 20, 20, 8);
    ctx.fillRect(42, 16 + tailWag, 18, 6);
    ctx.fillRect(57, 12 + tailWag * 1.2, 12, 5);
    // Tail spike
    ctx.fillStyle = '#444';
    ctx.fillRect(66, 10 + tailWag * 1.3, 8, 4);

    // Aura
    ctx.save();
    ctx.globalAlpha = 0.15 + Math.sin(f * 0.05) * 0.05;
    const aura = ctx.createRadialGradient(0, 0, 20, 0, 0, 80);
    aura.addColorStop(0, 'rgba(150,0,200,0.4)');
    aura.addColorStop(1, 'rgba(150,0,200,0)');
    ctx.fillStyle = aura;
    ctx.fillRect(-80, -70, 160, 140);
    ctx.restore();

    // HP bar
    ctx.fillStyle = '#333';
    ctx.fillRect(-30, -75, 60, 6);
    ctx.fillStyle = bossHP > 30 ? '#FF2222' : '#FF6600';
    ctx.fillRect(-29, -74, 58 * (bossHP / 100), 4);

    // Hit flash
    if (bossHit) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#FFF';
      ctx.fillRect(-35, -55, 70, 90);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  // Slash effect
  function drawSlash(x, y) {
    if (slashFrame < 0) return;
    ctx.save();
    ctx.translate(x, y);
    const progress = slashFrame / 8;
    ctx.strokeStyle = `rgba(255,255,100,${1 - progress})`;
    ctx.lineWidth = 4 - progress * 3;
    ctx.beginPath();
    ctx.moveTo(-30 + progress * 60, -20 + progress * 40);
    ctx.lineTo(30 - progress * 20, 20 - progress * 40);
    ctx.stroke();
    // Second slash
    ctx.beginPath();
    ctx.moveTo(20 - progress * 40, -25 + progress * 50);
    ctx.lineTo(-20 + progress * 40, 15 - progress * 30);
    ctx.stroke();
    ctx.restore();
  }

  /* ── scene update & draw ── */
  function update() {
    f++;
    sceneTimer++;
    stepTimer++;
    if (stepTimer >= 8) { stepTimer = 0; animFrame = 1 - animFrame; }

    // Handle transitions
    const scene = SCENES[sceneIdx];
    const dur = scene.dur;

    // Transition in (first 30 frames)
    if (sceneTimer < 30) {
      transAlpha = 1 - sceneTimer / 30;
    }
    // Transition out (last 30 frames)
    else if (sceneTimer > dur - 30) {
      transAlpha = (sceneTimer - (dur - 30)) / 30;
    } else {
      transAlpha = 0;
    }

    // Scene switch
    if (sceneTimer >= dur) {
      sceneIdx = (sceneIdx + 1) % SCENES.length;
      sceneTimer = 0;
      resetCharPositions();
      bossHP = 100;
      bossShake = 0;
      bossHit = false;
      slashFrame = -1;
      makaiFireParticles.length = 0;
      particles.length = 0;
      transColor = (SCENES[sceneIdx].name === 'heaven') ? '#FFF' : '#000';
    }

    updateParticles();

    // Scene-specific updates
    const name = SCENES[sceneIdx].name;
    const gl = 210;

    if (name === 'titleFlash') {
      // Characters run in from sides
      if (catX < 150) catX += 2.5;
      if (mouseX < 220) mouseX += 2.5;
      // Bounce
      catY = Math.abs(Math.sin(f * 0.12)) * 8;
      mouseY = Math.abs(Math.sin(f * 0.12 + 1)) * 5;
    }
    else if (name === 'adventure') {
      // Walking animation - characters moving right
      catX = 100; mouseX = 170;
      catY = Math.abs(Math.sin(f * 0.15)) * 4;
      mouseY = Math.abs(Math.sin(f * 0.15 + 1)) * 3;
    }
    else if (name === 'makai') {
      catX = 80; mouseX = 140;
      catY = Math.abs(Math.sin(f * 0.1)) * 3;
      mouseY = Math.abs(Math.sin(f * 0.1 + 1)) * 2;
      // Occasional scared jump
      if (sceneTimer === 80 || sceneTimer === 180) {
        catY = -15; mouseY = -12;
      }
    }
    else if (name === 'heaven') {
      catX = 120; mouseX = 190;
      // Floating effect
      catY = Math.sin(f * 0.05) * 8 + 5;
      mouseY = Math.sin(f * 0.05 + 0.5) * 6 + 5;
      if (sceneTimer === 30) playSFX('heaven');
    }
    else if (name === 'boss') {
      catX = 80; mouseX = 130;
      catY = Math.abs(Math.sin(f * 0.15)) * 3;
      mouseY = Math.abs(Math.sin(f * 0.15 + 1)) * 2;

      // Battle sequence
      if (sceneTimer === 100) { slashFrame = 0; playSFX('slash'); }
      if (sceneTimer === 110) { bossHit = true; bossHP = 70; bossShake = 6; spawnP(CW - 140, gl - 30, 15, 255, 100, 255); playSFX('hit'); }
      if (sceneTimer === 118) { bossHit = false; }
      if (sceneTimer === 180) { slashFrame = 0; playSFX('slash'); }
      if (sceneTimer === 190) { bossHit = true; bossHP = 35; bossShake = 8; spawnP(CW - 140, gl - 30, 20, 255, 150, 50); playSFX('hit'); }
      if (sceneTimer === 198) { bossHit = false; }
      if (sceneTimer === 260) { slashFrame = 0; playSFX('slash'); }
      if (sceneTimer === 270) {
        bossHit = true; bossHP = 0; bossShake = 12;
        spawnP(CW - 140, gl - 50, 40, 255, 200, 50);
        spawnP(CW - 140, gl - 20, 30, 255, 100, 100);
        playSFX('hit');
      }
      if (sceneTimer === 285) { bossHit = false; }

      if (slashFrame >= 0) slashFrame++;
      if (slashFrame > 10) slashFrame = -1;
      if (bossShake > 0) bossShake *= 0.9;
    }
    else if (name === 'titleEnd') {
      catX = 150; mouseX = 220;
      catY = Math.abs(Math.sin(f * 0.15)) * 6;
      mouseY = Math.abs(Math.sin(f * 0.15 + 1)) * 4;
      // Victory sparkles
      if (sceneTimer % 10 === 0) spawnP(Math.random() * CW, Math.random() * CH * 0.6, 3, 255, 215, 0);
    }
  }

  function draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CW, CH);

    const name = SCENES[sceneIdx].name;
    const gl = 210;
    const leftImg = animFrame === 0 ? images.l1 : images.l2;
    const rightImg = animFrame === 0 ? images.r1 : images.r2;

    if (name === 'titleFlash') {
      drawAdventureBG(gl);
      // Title appearing
      const titleAlpha = Math.min(1, sceneTimer / 60);
      ctx.save(); ctx.globalAlpha = titleAlpha;
      const bounce = sceneTimer < 60 ? Math.sin(sceneTimer * 0.1) * (1 - sceneTimer / 60) * 10 : 0;
      px('にゃんこ先生のFX講座', CW / 2, 50 + bounce, 24, '#FFD700');
      px('〜 ぼうけんの はじまり 〜', CW / 2, 78, 11, '#FFF');
      ctx.restore();

      // Decorative frame
      if (sceneTimer > 40) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, (sceneTimer - 40) / 30);
        ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 2;
        ctx.strokeRect(CW/2-140, 32, 280, 56);
        ctx.strokeStyle = '#B8860B'; ctx.lineWidth = 1;
        ctx.strokeRect(CW/2-137, 35, 274, 50);
        ctx.restore();
      }

      // Characters
      drawShadow(catX, gl, catH);
      drawShadow(mouseX, gl, mouseH);
      drawChar(leftImg, catX, gl - catH - catY, catH, false);
      drawChar(rightImg, mouseX, gl - mouseH - mouseY, mouseH, true);

      // Exclamation marks
      if (sceneTimer > 60 && sceneTimer < 100) {
        drawExclaim(catX + catH * 0.3, gl - catH - catY - 15);
        drawExclaim(mouseX + mouseH * 0.3, gl - mouseH - mouseY - 15);
      }
    }
    else if (name === 'adventure') {
      drawAdventureBG(gl);
      // Walking along the road
      drawShadow(catX, gl, catH);
      drawShadow(mouseX, gl, mouseH);
      drawChar(leftImg, catX, gl - catH - catY, catH, false);
      drawChar(rightImg, mouseX, gl - mouseH - mouseY, mouseH, true);

      // Text overlay
      ctx.save(); ctx.globalAlpha = Math.min(1, sceneTimer / 40);
      px('ぼうけんの はじまりだ！', CW / 2, 30, 16, '#FFF');
      ctx.restore();

      // Dust particles when walking
      if (f % 6 === 0) {
        spawnP(catX + 20, gl, 2, 180, 160, 120);
        spawnP(mouseX + 10, gl, 2, 180, 160, 120);
      }
    }
    else if (name === 'makai') {
      drawMakaiBG(gl);

      // Scene title
      if (sceneTimer < 90) {
        ctx.save();
        ctx.globalAlpha = sceneTimer < 30 ? sceneTimer / 30 : (sceneTimer < 60 ? 1 : 1 - (sceneTimer - 60) / 30);
        px('── 魔  界 ──', CW / 2, 40, 22, '#FF3344');
        ctx.restore();
      }

      // Characters (scared animation)
      drawShadow(catX, gl, catH);
      drawShadow(mouseX, gl, mouseH);
      drawChar(leftImg, catX, gl - catH - catY, catH, false);
      drawChar(rightImg, mouseX, gl - mouseH - mouseY, mouseH, true);

      // Sweat drop when scared
      if ((sceneTimer > 70 && sceneTimer < 100) || (sceneTimer > 170 && sceneTimer < 200)) {
        ctx.fillStyle = '#88CCFF';
        const swX = catX + catH * 0.5;
        const swY = gl - catH - catY + 5;
        ctx.fillRect(swX, swY, 3, 5);
        ctx.fillRect(swX + 1, swY + 5, 1, 2);
      }

      // "!?" when seeing demons
      if (sceneTimer > 50 && sceneTimer < 80) {
        drawExclaim(catX + catH * 0.3, gl - catH - 20);
        const qx = mouseX + mouseH * 0.3;
        const qy = gl - mouseH - 20;
        ctx.fillStyle = '#FFDD00';
        px('!?', qx + 2, qy, 12, '#FFDD00');
      }
    }
    else if (name === 'heaven') {
      drawHeavenBG(gl);

      // Scene title
      if (sceneTimer < 90) {
        ctx.save();
        ctx.globalAlpha = sceneTimer < 30 ? sceneTimer / 30 : (sceneTimer < 60 ? 1 : 1 - (sceneTimer - 60) / 30);
        px('── 天  国 ──', CW / 2, 40, 22, '#FFD700');
        ctx.restore();
      }

      // Characters floating
      drawChar(leftImg, catX, gl - catH - catY - 20, catH, false);
      drawChar(rightImg, mouseX, gl - mouseH - mouseY - 20, mouseH, true);

      // Musical notes
      if (f % 15 === 0) {
        spawnP(catX + 30, gl - catH - catY - 30, 2, 255, 215, 0);
        spawnP(mouseX + 15, gl - mouseH - mouseY - 25, 2, 255, 255, 200);
      }

      // Hearts floating up
      if (sceneTimer > 40) {
        ctx.fillStyle = '#FF69B4';
        for (let i = 0; i < 3; i++) {
          const hx = 100 + i * 120 + Math.sin(f * 0.02 + i * 2) * 15;
          const hy = (200 - (f * 0.3 + i * 60) % 200);
          const a = hy < 30 ? hy / 30 : 1;
          ctx.save(); ctx.globalAlpha = a * 0.6;
          drawHeart(hx, hy, 4);
          ctx.restore();
        }
      }
    }
    else if (name === 'boss') {
      drawBossBG(gl);

      // Scene title
      if (sceneTimer < 90) {
        ctx.save();
        ctx.globalAlpha = sceneTimer < 30 ? sceneTimer / 30 : (sceneTimer < 60 ? 1 : 1 - (sceneTimer - 60) / 30);
        px('── 強敵、現る ──', CW / 2, 30, 20, '#FF4444');
        ctx.restore();
      }

      // Boss
      if (bossHP > 0 || sceneTimer < 300) {
        const bossAlpha = bossHP <= 0 ? Math.max(0, 1 - (sceneTimer - 270) / 30) : 1;
        ctx.save(); ctx.globalAlpha = bossAlpha;
        drawBoss(CW - 140, gl - 20);
        ctx.restore();
      }

      // Boss defeated explosion
      if (bossHP <= 0 && sceneTimer > 270 && sceneTimer < 310) {
        if (sceneTimer % 4 === 0) spawnP(CW - 140 + Math.random()*60-30, gl - 50, 8, 255, Math.floor(Math.random()*200), 50);
      }

      // Slash effect
      drawSlash(CW - 140, gl - 30);

      // Characters
      drawShadow(catX, gl, catH);
      drawShadow(mouseX, gl, mouseH);

      // Cat charges forward during attack
      let drawCatX = catX;
      if ((sceneTimer >= 95 && sceneTimer <= 115) ||
          (sceneTimer >= 175 && sceneTimer <= 195) ||
          (sceneTimer >= 255 && sceneTimer <= 275)) {
        drawCatX = catX + Math.min((sceneTimer % 100) * 6, 150);
      }
      drawChar(leftImg, drawCatX, gl - catH - catY, catH, false);
      drawChar(rightImg, mouseX, gl - mouseH - mouseY, mouseH, true);

      // Victory text
      if (bossHP <= 0 && sceneTimer > 300) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, (sceneTimer - 300) / 30);
        px('勝利！！', CW / 2, CH / 2 - 20, 28, '#FFD700');
        ctx.restore();
      }
    }
    else if (name === 'titleEnd') {
      // Gradient background
      const sg = ctx.createLinearGradient(0, 0, 0, CH);
      sg.addColorStop(0, '#1a0a2e');
      sg.addColorStop(0.5, '#2d1b69');
      sg.addColorStop(1, '#0a0a20');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, CW, CH);

      // Stars
      for (let i = 0; i < 30; i++) {
        const sx = (i * 17 + f * 0.1) % CW;
        const sy = (i * 11) % (CH * 0.6);
        const twink = Math.sin(f * 0.05 + i * 0.7) > 0 ? 1 : 0.3;
        ctx.fillStyle = `rgba(255,255,200,${twink * 0.8})`;
        ctx.fillRect(~~sx, ~~sy, 2, 2);
      }

      // Title
      const titleAlpha = Math.min(1, sceneTimer / 60);
      ctx.save(); ctx.globalAlpha = titleAlpha;

      // Glow effect
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15 + Math.sin(f * 0.05) * 5;
      px('にゃんこ先生のFX講座', CW / 2, 70, 26, '#FFD700');
      ctx.shadowBlur = 0;

      px('〜 ぼうけんは つづく 〜', CW / 2, 100, 12, '#FFF');
      ctx.restore();

      // Characters
      const groundEnd = 210;
      drawShadow(catX, groundEnd, catH);
      drawShadow(mouseX, groundEnd, mouseH);
      drawChar(leftImg, catX, groundEnd - catH - catY, catH, false);
      drawChar(rightImg, mouseX, groundEnd - mouseH - mouseY, mouseH, true);

      // Subscribe text
      if (sceneTimer > 100) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, (sceneTimer - 100) / 30) * (0.6 + Math.sin(f * 0.08) * 0.4);
        px('チャンネル登録よろしくね！', CW / 2, 240, 14, '#FF6B6B');
        ctx.restore();
      }
    }

    drawParticles();

    // Scene transition overlay
    if (transAlpha > 0) {
      ctx.fillStyle = transColor === '#FFF'
        ? `rgba(255,255,255,${transAlpha})`
        : `rgba(0,0,0,${transAlpha})`;
      ctx.fillRect(0, 0, CW, CH);
    }

    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    for (let y = 0; y < CH; y += 3) ctx.fillRect(0, y, CW, 1);
  }

  // Utility draw helpers
  function drawShadow(x, gy, h) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(x + h * 0.35, gy, h * 0.3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawExclaim(x, y) {
    const flash = Math.floor(f / 6) % 2 === 0;
    if (!flash) return;
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(x, y, 4, 10);
    ctx.fillRect(x, y + 12, 4, 4);
  }

  function drawHeart(x, y, s) {
    ctx.fillRect(x - s, y, s, s);
    ctx.fillRect(x + 1, y, s, s);
    ctx.fillRect(x - s - 1, y - s + 1, s, s);
    ctx.fillRect(x + 2, y - s + 1, s, s);
    ctx.fillRect(x - Math.floor(s/2), y + s, 1, 1);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
