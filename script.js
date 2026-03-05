(function() {
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');

  canvas.width = 426;
  canvas.height = 240;

  // --- Images ---
  const images = {
    left1: new Image(),
    left2: new Image(),
    right1: new Image(),
    right2: new Image()
  };

  Object.values(images).forEach(img => { img.crossOrigin = 'anonymous'; });

  images.left1.src = "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/88b01ae-6deb-2436-d70b-707f3b24a4df__1.png";
  images.left2.src = "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/4d20d-dbcb-c1a-c0e0-ca740e55d8c0__2.png";
  images.right1.src = "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/48c5787-6528-52cc-e7e5-300b1f0fb628__2026-01-29_18.44.19-removebg-preview_1_.png";
  images.right2.src = "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/ac1ddf4-6f87-bdf0-7231-4de2b1de87f6__2026-01-29_18.42.51-removebg-preview_1_.png";

  // --- Constants ---
  const groundY = 200;
  const leftCharHeight = 80;
  const rightCharHeight = 40;
  const CW = canvas.width;
  const CH = canvas.height;

  // --- State ---
  let frameCount = 0;
  let animFrame = 0;
  let stepTimer = 0;

  // Animation phases (compact ~3.5s total at 60fps ≈ 210 frames)
  // blackScreen:   0-20   (0.33s) - quick fade in
  // charsEnter:   20-50   (0.50s) - characters slide in fast
  // titleDrop:    50-100  (0.83s) - title drops + bounce
  // titleHold:   100-160  (1.00s) - title shines, chars bounce
  // fadeOut:     160-210  (0.83s) - white flash out
  let phase = 'blackScreen';
  let phaseTimer = 0;

  // Character positions
  let catX = -100;
  let mouseX = CW + 20;
  const catTargetX = 80;
  const mouseTargetX = 280;

  // Character bounce
  let catBounceOffset = 0;
  let mouseBounceOffset = 0;

  // Title
  let titleY = -80;
  const titleTargetY = 20;
  let titleBounceVel = 0;
  let titleBouncing = false;
  let titleScale = 1.0;

  // Fade
  let fadeAlpha = 1.0;
  let whiteAlpha = 0;

  // Road scroll
  let roadScrollOffset = 0;

  // Clouds
  const clouds = [];
  for (let i = 0; i < 6; i++) {
    clouds.push({
      x: Math.random() * CW,
      y: Math.random() * 50 + 10,
      width: Math.random() * 50 + 30,
      height: Math.random() * 10 + 8,
      speed: Math.random() * 0.3 + 0.15
    });
  }

  // Birds
  const birds = [];
  for (let i = 0; i < 3; i++) {
    birds.push({
      x: Math.random() * CW,
      y: Math.random() * 40 + 20,
      speed: Math.random() * 0.5 + 0.3,
      wingPhase: Math.random() * Math.PI * 2
    });
  }

  // Flowers
  const flowers = [];
  for (let i = 0; i < 12; i++) {
    flowers.push({
      x: Math.random() * CW,
      y: groundY + Math.random() * 6 - 2,
      color: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF8ED4'][Math.floor(Math.random() * 5)],
      size: Math.random() * 3 + 2,
      swayPhase: Math.random() * Math.PI * 2
    });
  }

  // Sparkles & particles
  const sparkles = [];
  const particles = [];

  // --- BGM (Web Audio) ---
  let audioCtx = null;
  let bgmStarted = false;

  function startBGM() {
    if (bgmStarted) return;
    bgmStarted = true;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.15;
    masterGain.connect(audioCtx.destination);

    const melody = [
      { note: 'C5', start: 0, dur: 0.2 }, { note: 'E5', start: 0.2, dur: 0.2 },
      { note: 'G5', start: 0.4, dur: 0.2 }, { note: 'C6', start: 0.6, dur: 0.4 },
      { note: 'B5', start: 1.0, dur: 0.2 }, { note: 'A5', start: 1.2, dur: 0.2 },
      { note: 'G5', start: 1.4, dur: 0.4 }, { note: 'E5', start: 1.8, dur: 0.2 },
      { note: 'F5', start: 2.0, dur: 0.2 }, { note: 'A5', start: 2.2, dur: 0.2 },
      { note: 'G5', start: 2.4, dur: 0.2 }, { note: 'F5', start: 2.6, dur: 0.2 },
      { note: 'E5', start: 2.8, dur: 0.2 },
      { note: 'D5', start: 3.0, dur: 0.3 }, { note: 'E5', start: 3.3, dur: 0.3 },
      { note: 'C5', start: 3.6, dur: 0.4 },
      { note: 'C5', start: 4.0, dur: 0.2 }, { note: 'E5', start: 4.2, dur: 0.2 },
      { note: 'G5', start: 4.4, dur: 0.2 }, { note: 'A5', start: 4.6, dur: 0.2 },
      { note: 'B5', start: 4.8, dur: 0.2 },
      { note: 'C6', start: 5.0, dur: 0.3 }, { note: 'B5', start: 5.3, dur: 0.2 },
      { note: 'G5', start: 5.5, dur: 0.5 },
      { note: 'A5', start: 6.0, dur: 0.2 }, { note: 'G5', start: 6.2, dur: 0.2 },
      { note: 'F5', start: 6.4, dur: 0.2 }, { note: 'E5', start: 6.6, dur: 0.2 },
      { note: 'D5', start: 6.8, dur: 0.2 },
      { note: 'C5', start: 7.0, dur: 0.6 }, { note: 'E5', start: 7.6, dur: 0.4 },
    ];

    const bass = [
      { note: 'C3', start: 0, dur: 0.4 }, { note: 'C3', start: 0.5, dur: 0.2 },
      { note: 'G3', start: 0.8, dur: 0.2 }, { note: 'C3', start: 1.0, dur: 0.4 },
      { note: 'E3', start: 1.5, dur: 0.2 }, { note: 'G3', start: 1.8, dur: 0.2 },
      { note: 'F3', start: 2.0, dur: 0.4 }, { note: 'F3', start: 2.5, dur: 0.2 },
      { note: 'A3', start: 2.8, dur: 0.2 }, { note: 'G3', start: 3.0, dur: 0.4 },
      { note: 'G3', start: 3.5, dur: 0.2 }, { note: 'B3', start: 3.8, dur: 0.2 },
      { note: 'C3', start: 4.0, dur: 0.4 }, { note: 'C3', start: 4.5, dur: 0.2 },
      { note: 'G3', start: 4.8, dur: 0.2 }, { note: 'A3', start: 5.0, dur: 0.4 },
      { note: 'E3', start: 5.5, dur: 0.2 }, { note: 'G3', start: 5.8, dur: 0.2 },
      { note: 'F3', start: 6.0, dur: 0.4 }, { note: 'D3', start: 6.5, dur: 0.2 },
      { note: 'G3', start: 6.8, dur: 0.2 }, { note: 'C3', start: 7.0, dur: 0.8 },
    ];

    const arp = [
      { note: 'E4', start: 0, dur: 0.15 }, { note: 'G4', start: 0.15, dur: 0.15 },
      { note: 'C5', start: 0.3, dur: 0.15 }, { note: 'G4', start: 0.45, dur: 0.15 },
      { note: 'E4', start: 0.6, dur: 0.15 }, { note: 'G4', start: 0.75, dur: 0.15 },
      { note: 'E4', start: 1.0, dur: 0.15 }, { note: 'G4', start: 1.15, dur: 0.15 },
      { note: 'C5', start: 1.3, dur: 0.15 }, { note: 'G4', start: 1.45, dur: 0.15 },
      { note: 'E4', start: 1.6, dur: 0.15 }, { note: 'G4', start: 1.75, dur: 0.15 },
      { note: 'F4', start: 2.0, dur: 0.15 }, { note: 'A4', start: 2.15, dur: 0.15 },
      { note: 'C5', start: 2.3, dur: 0.15 }, { note: 'A4', start: 2.45, dur: 0.15 },
      { note: 'F4', start: 2.6, dur: 0.15 }, { note: 'A4', start: 2.75, dur: 0.15 },
      { note: 'G4', start: 3.0, dur: 0.15 }, { note: 'B4', start: 3.15, dur: 0.15 },
      { note: 'D5', start: 3.3, dur: 0.15 }, { note: 'B4', start: 3.45, dur: 0.15 },
      { note: 'G4', start: 3.6, dur: 0.15 }, { note: 'B4', start: 3.75, dur: 0.15 },
      { note: 'E4', start: 4.0, dur: 0.15 }, { note: 'G4', start: 4.15, dur: 0.15 },
      { note: 'C5', start: 4.3, dur: 0.15 }, { note: 'G4', start: 4.45, dur: 0.15 },
      { note: 'E4', start: 4.6, dur: 0.15 }, { note: 'G4', start: 4.75, dur: 0.15 },
      { note: 'A4', start: 5.0, dur: 0.15 }, { note: 'C5', start: 5.15, dur: 0.15 },
      { note: 'E5', start: 5.3, dur: 0.15 }, { note: 'C5', start: 5.45, dur: 0.15 },
      { note: 'A4', start: 5.6, dur: 0.15 }, { note: 'C5', start: 5.75, dur: 0.15 },
      { note: 'F4', start: 6.0, dur: 0.15 }, { note: 'A4', start: 6.15, dur: 0.15 },
      { note: 'C5', start: 6.3, dur: 0.15 }, { note: 'A4', start: 6.45, dur: 0.15 },
      { note: 'D4', start: 6.6, dur: 0.15 }, { note: 'G4', start: 6.75, dur: 0.15 },
      { note: 'E4', start: 7.0, dur: 0.15 }, { note: 'G4', start: 7.15, dur: 0.15 },
      { note: 'C5', start: 7.3, dur: 0.15 }, { note: 'G4', start: 7.45, dur: 0.15 },
      { note: 'E4', start: 7.6, dur: 0.15 }, { note: 'G4', start: 7.75, dur: 0.15 },
    ];

    const noteFreqs = {
      'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
      'C6': 1046.50
    };

    const loopDuration = 8.0;

    function playNote(noteData, baseTime, type, gainVal) {
      const freq = noteFreqs[noteData.note];
      if (!freq) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(gainVal, baseTime + noteData.start);
      gain.gain.exponentialRampToValueAtTime(0.001, baseTime + noteData.start + noteData.dur);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(baseTime + noteData.start);
      osc.stop(baseTime + noteData.start + noteData.dur + 0.05);
    }

    function scheduleLoop(startTime) {
      melody.forEach(n => playNote(n, startTime, 'square', 0.3));
      bass.forEach(n => playNote(n, startTime, 'triangle', 0.5));
      arp.forEach(n => playNote(n, startTime, 'square', 0.12));

      for (let beat = 0; beat < 16; beat++) {
        const t = startTime + beat * 0.5;
        const kickOsc = audioCtx.createOscillator();
        const kickGain = audioCtx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(150, t);
        kickOsc.frequency.exponentialRampToValueAtTime(30, t + 0.1);
        kickGain.gain.setValueAtTime(0.4, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        kickOsc.connect(kickGain);
        kickGain.connect(masterGain);
        kickOsc.start(t);
        kickOsc.stop(t + 0.2);

        if (beat % 2 === 1) {
          const hatLen = 0.05;
          const bufferSize = audioCtx.sampleRate * hatLen;
          const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
          const data = noiseBuffer.getChannelData(0);
          for (let j = 0; j < bufferSize; j++) data[j] = Math.random() * 2 - 1;
          const noise = audioCtx.createBufferSource();
          noise.buffer = noiseBuffer;
          const hatGain = audioCtx.createGain();
          const hatFilter = audioCtx.createBiquadFilter();
          hatFilter.type = 'highpass';
          hatFilter.frequency.value = 8000;
          hatGain.gain.setValueAtTime(0.2, t + 0.25);
          hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25 + hatLen);
          noise.connect(hatFilter);
          hatFilter.connect(hatGain);
          hatGain.connect(masterGain);
          noise.start(t + 0.25);
          noise.stop(t + 0.25 + hatLen + 0.01);
        }
      }

      setTimeout(() => {
        if (audioCtx && audioCtx.state === 'running') {
          scheduleLoop(startTime + loopDuration);
        }
      }, (loopDuration - 0.5) * 1000);
    }

    scheduleLoop(audioCtx.currentTime + 0.1);
  }

  function initAudio() {
    startBGM();
    document.removeEventListener('click', initAudio);
    document.removeEventListener('touchstart', initAudio);
    document.removeEventListener('keydown', initAudio);
  }
  document.addEventListener('click', initAudio);
  document.addEventListener('touchstart', initAudio);
  document.addEventListener('keydown', initAudio);
  setTimeout(() => { try { startBGM(); } catch(e) {} }, 100);

  function drawCharacter(img, x, y, h, flipH) {
    if (img.complete && img.naturalWidth > 0) {
      const aspect = img.width / img.height;
      const w = h * aspect;
      ctx.save();
      if (flipH) {
        ctx.translate(Math.floor(x) + w, Math.floor(y));
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, w, h);
      } else {
        ctx.drawImage(img, Math.floor(x), Math.floor(y), w, h);
      }
      ctx.restore();
    }
  }

  function drawPixelText(text, x, y, size, color, align) {
    ctx.fillStyle = color;
    ctx.font = size + 'px "DotGothic16", sans-serif';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  function drawBackground() {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#4BA3FF');
    skyGrad.addColorStop(0.3, '#7BC4FF');
    skyGrad.addColorStop(0.6, '#A8DCFF');
    skyGrad.addColorStop(1, '#FFE8A0');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CW, CH);

    // Sun
    const sunX = CW - 70, sunY = 40;
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath(); ctx.arc(sunX, sunY, 22, 0, Math.PI * 2); ctx.fill();
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 50);
    sunGlow.addColorStop(0, 'rgba(255, 240, 150, 0.4)');
    sunGlow.addColorStop(1, 'rgba(255, 240, 150, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath(); ctx.arc(sunX, sunY, 50, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(sunX, sunY); ctx.rotate(frameCount * 0.005);
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = 'rgba(255, 240, 150, 0.2)';
      ctx.fillRect(-2, 24, 4, 14);
    }
    ctx.restore();

    // Clouds
    clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x + c.width < -10) c.x = CW + 10;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const cx = Math.floor(c.x), cy = Math.floor(c.y);
      ctx.fillRect(cx, cy, c.width, c.height);
      ctx.fillRect(cx + 8, cy - 6, c.width - 16, 6);
      ctx.fillRect(cx + c.width * 0.3, cy - 10, c.width * 0.4, 6);
    });

    // Birds
    birds.forEach(b => {
      b.x -= b.speed; if (b.x < -20) b.x = CW + 20;
      b.wingPhase += 0.1;
      const wingY = Math.sin(b.wingPhase) * 3;
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(b.x - 4, b.y + wingY); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x + 4, b.y + wingY); ctx.stroke();
    });

    // Hills
    ctx.fillStyle = '#5BAF5B';
    for (let x = 0; x < CW; x += 2) {
      const h = Math.sin(x * 0.01 + 1) * 25 + Math.sin(x * 0.025) * 15 + 55;
      ctx.fillRect(x, groundY - h, 2, h);
    }
    ctx.fillStyle = '#4A9E4A';
    for (let x = 0; x < CW; x += 2) {
      const h = Math.sin(x * 0.018 + 3) * 18 + Math.sin(x * 0.01 + 1) * 12 + 38;
      ctx.fillRect(x, groundY - h, 2, h);
    }

    // Trees
    [30, 90, 160, 250, 330, 390].forEach(tx => {
      const hillH = Math.sin(tx * 0.018 + 3) * 18 + Math.sin(tx * 0.01 + 1) * 12 + 38;
      const treeBase = groundY - hillH + 4;
      ctx.fillStyle = '#6B4226'; ctx.fillRect(tx - 2, treeBase - 16, 4, 16);
      ctx.fillStyle = '#2D7D2D';
      ctx.fillRect(tx - 8, treeBase - 28, 16, 14);
      ctx.fillRect(tx - 6, treeBase - 34, 12, 8);
      ctx.fillRect(tx - 4, treeBase - 38, 8, 6);
    });

    // Ground + road
    ctx.fillStyle = '#6BBF6B';
    ctx.fillRect(0, groundY - 4, CW, CH - groundY + 4);
    const roadCenterX = CW / 2;
    ctx.fillStyle = '#C4A46C';
    ctx.beginPath(); ctx.moveTo(roadCenterX - 60, CH); ctx.lineTo(roadCenterX + 60, CH);
    ctx.lineTo(roadCenterX + 15, groundY); ctx.lineTo(roadCenterX - 15, groundY); ctx.closePath(); ctx.fill();
    roadScrollOffset = (roadScrollOffset + 0.5) % 16;
    ctx.fillStyle = '#E8D8A8';
    for (let d = 0; d < 8; d++) {
      const t = (d * 16 + roadScrollOffset) / (CH - groundY);
      if (t > 1) continue;
      const y = groundY + t * (CH - groundY);
      const width = 2 + t * 6, dashH = 3 + t * 4;
      ctx.fillRect(roadCenterX - width / 2, y, width, dashH);
    }
    ctx.fillStyle = '#8B7355';
    ctx.beginPath(); ctx.moveTo(roadCenterX - 62, CH); ctx.lineTo(roadCenterX - 16, groundY);
    ctx.lineTo(roadCenterX - 14, groundY); ctx.lineTo(roadCenterX - 58, CH); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(roadCenterX + 62, CH); ctx.lineTo(roadCenterX + 16, groundY);
    ctx.lineTo(roadCenterX + 14, groundY); ctx.lineTo(roadCenterX + 58, CH); ctx.closePath(); ctx.fill();

    // Grass
    ctx.fillStyle = '#4CAF50';
    for (let x = 0; x < CW; x += 18) {
      if (Math.abs(x - roadCenterX) < 65) continue;
      const gy = groundY + Math.random() * 3;
      ctx.fillRect(x, gy - 6, 2, 6); ctx.fillRect(x + 3, gy - 8, 2, 8); ctx.fillRect(x + 6, gy - 5, 2, 5);
    }

    // Flowers
    flowers.forEach(f => {
      if (Math.abs(f.x - roadCenterX) < 65) return;
      const sway = Math.sin(frameCount * 0.03 + f.swayPhase) * 1;
      ctx.fillStyle = '#228B22'; ctx.fillRect(f.x + sway, f.y - f.size * 2, 1, f.size * 2);
      ctx.fillStyle = f.color; ctx.fillRect(f.x - f.size / 2 + sway, f.y - f.size * 2.5, f.size, f.size);
    });

    ctx.fillStyle = '#7ECF7E'; ctx.fillRect(0, groundY, CW, 2);
  }

  function drawTitle() {
    ctx.save();
    const pulse = 1 + Math.sin(frameCount * 0.06) * 0.03;
    const scale = titleScale * pulse;
    ctx.translate(CW / 2, titleY + 20);
    ctx.scale(scale, scale);
    ctx.shadowColor = '#FF8C00';
    ctx.shadowBlur = 12 + Math.sin(frameCount * 0.05) * 4;
    ctx.fillStyle = '#000000';
    for (let ox = -2; ox <= 2; ox++) {
      for (let oy = -2; oy <= 2; oy++) {
        if (ox === 0 && oy === 0) continue;
        drawPixelText('にゃんこ先生のFX講座', ox, oy, 20, '#000000', 'center');
      }
    }
    drawPixelText('にゃんこ先生のFX講座', 0, 0, 20, '#FFD700', 'center');
    ctx.shadowBlur = 0;
    drawPixelText('にゃんこ先生のFX講座', 0, -1, 20, '#FFFACD', 'center');
    ctx.restore();

    // Subtitle (appears quickly after title lands)
    if (phase === 'titleHold' || phase === 'fadeOut') {
      ctx.save();
      const subAlpha = Math.min(1, phaseTimer / 15);
      ctx.globalAlpha = subAlpha;
      drawPixelText('〜 ぼうけんの はじまり 〜', CW / 2, titleY + 44, 10, '#FFFFFF', 'center');
      ctx.restore();
    }
  }

  function drawParticles() {
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= 1; p.vy += 0.1;
      if (p.life > 0) {
        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.life / p.maxLife})`;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      }
    });
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
  }

  function spawnParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x + Math.random() * 40 - 20, y: y + Math.random() * 20 - 10,
        vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 3 - 2,
        life: 30 + Math.random() * 20, maxLife: 50,
        size: Math.random() * 3 + 2,
        r: [255, 255, 100, 255][Math.floor(Math.random() * 4)],
        g: [215, 165, 255, 200][Math.floor(Math.random() * 4)],
        b: [0, 0, 50, 50][Math.floor(Math.random() * 4)]
      });
    }
  }

  function drawSparkles() {
    if (phase !== 'blackScreen' && frameCount % 8 === 0) {
      sparkles.push({ x: Math.random() * CW, y: Math.random() * groundY, life: 20 + Math.random() * 15, maxLife: 35, size: Math.random() * 3 + 1 });
    }
    sparkles.forEach(s => {
      s.life--;
      if (s.life > 0) {
        const alpha = s.life / s.maxLife;
        const twinkle = Math.sin(s.life * 0.5) > 0 ? 1 : 0.3;
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha * twinkle})`;
        ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
        if (s.size > 2) {
          ctx.fillRect(Math.floor(s.x) - 1, Math.floor(s.y) + 1, s.size + 2, 1);
          ctx.fillRect(Math.floor(s.x) + 1, Math.floor(s.y) - 1, 1, s.size + 2);
        }
      }
    });
    for (let i = sparkles.length - 1; i >= 0; i--) {
      if (sparkles[i].life <= 0) sparkles.splice(i, 1);
    }
  }

  function getCharExcitement(timer) {
    return Math.abs(Math.sin(timer * 0.15)) * 4;
  }

  // ─── COMPACT UPDATE (~3.5s total) ───
  function update() {
    frameCount++;
    phaseTimer++;

    stepTimer++;
    if (stepTimer >= 8) { stepTimer = 0; animFrame = 1 - animFrame; }

    switch (phase) {
      // Phase 1: Quick fade from black (20 frames = 0.33s)
      case 'blackScreen':
        fadeAlpha = Math.max(0, 1.0 - phaseTimer / 15);
        if (phaseTimer > 20) {
          phase = 'charsEnter';
          phaseTimer = 0;
        }
        break;

      // Phase 2: Characters slide in fast (30 frames = 0.5s)
      case 'charsEnter':
        // Fast ease-out slide
        const enterProgress = Math.min(1, phaseTimer / 25);
        const eased = 1 - Math.pow(1 - enterProgress, 3); // ease-out cubic
        catX = -100 + (catTargetX - (-100)) * eased;
        mouseX = (CW + 20) + (mouseTargetX - (CW + 20)) * eased;

        if (phaseTimer > 28) {
          phase = 'titleDrop';
          phaseTimer = 0;
          titleBounceVel = 0;
          titleBouncing = true;
          // Small landing particles
          spawnParticles(catX + 30, groundY - 10, 5);
          spawnParticles(mouseX + 15, groundY - 5, 5);
        }
        break;

      // Phase 3: Title drops + quick bounce (50 frames = 0.83s)
      case 'titleDrop':
        catBounceOffset = getCharExcitement(frameCount);
        mouseBounceOffset = getCharExcitement(frameCount + 10);

        if (titleBouncing) {
          titleBounceVel += 0.8; // faster gravity
          titleY += titleBounceVel;
          if (titleY >= titleTargetY) {
            titleY = titleTargetY;
            titleBounceVel = -titleBounceVel * 0.35;
            if (Math.abs(titleBounceVel) < 1.5) {
              titleBouncing = false;
              titleY = titleTargetY;
              titleScale = 1.2;
              spawnParticles(CW / 2, titleTargetY + 25, 20);
            }
          }
        }
        if (titleScale > 1.0) titleScale += (1.0 - titleScale) * 0.15;

        if (!titleBouncing && phaseTimer > 45) {
          phase = 'titleHold';
          phaseTimer = 0;
        }
        break;

      // Phase 4: Title shines, chars bounce happily (60 frames = 1.0s)
      case 'titleHold':
        catBounceOffset = getCharExcitement(frameCount * 1.5) * 1.5;
        mouseBounceOffset = getCharExcitement(frameCount * 1.5 + 8) * 1.5;

        // Characters do small jumps
        if (phaseTimer === 10) catBounceOffset = -8;
        if (phaseTimer === 25) mouseBounceOffset = -6;
        if (phaseTimer === 40) { catBounceOffset = -10; mouseBounceOffset = -8; }

        if (phaseTimer > 55) {
          spawnParticles(CW / 2, titleTargetY + 25, 15);
          spawnParticles(catX + 30, groundY - 40, 10);
          spawnParticles(mouseX + 15, groundY - 20, 10);
          phase = 'fadeOut';
          phaseTimer = 0;
        }
        break;

      // Phase 5: White flash out (50 frames = 0.83s)
      case 'fadeOut':
        catBounceOffset = getCharExcitement(frameCount * 2) * 2;
        mouseBounceOffset = getCharExcitement(frameCount * 2 + 5) * 2;
        whiteAlpha = Math.min(1, phaseTimer / 35);

        if (phaseTimer > 50) {
          // Reset and loop
          phase = 'blackScreen';
          phaseTimer = 0;
          fadeAlpha = 1.0;
          whiteAlpha = 0;
          catX = -100;
          mouseX = CW + 20;
          titleY = -80;
          titleScale = 1.0;
          catBounceOffset = 0;
          mouseBounceOffset = 0;
          particles.length = 0;
          sparkles.length = 0;
        }
        break;
    }
  }

  function draw() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CW, CH);

    drawBackground();
    drawSparkles();

    const leftCharImg = animFrame === 0 ? images.left1 : images.left2;
    const rightCharImg = animFrame === 0 ? images.right1 : images.right2;
    const catDrawY = groundY - leftCharHeight - catBounceOffset;
    const mouseDrawY = groundY - rightCharHeight - mouseBounceOffset;

    // Shadows
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath(); ctx.ellipse(catX + leftCharHeight * 0.4, groundY, leftCharHeight * 0.3, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(mouseX + rightCharHeight * 0.4, groundY, rightCharHeight * 0.3, 3, 0, 0, Math.PI * 2); ctx.fill();

    drawCharacter(leftCharImg, catX, catDrawY, leftCharHeight, false);
    drawCharacter(rightCharImg, mouseX, mouseDrawY, rightCharHeight, true);

    // Emotes during titleHold
    if (phase === 'titleHold' || phase === 'titleDrop') {
      const noteOffset = (frameCount % 40) / 40;
      const noteY = groundY - leftCharHeight - 10 - noteOffset * 20;
      const noteAlpha = 1 - noteOffset;
      if (noteAlpha > 0) {
        ctx.save(); ctx.globalAlpha = noteAlpha; ctx.fillStyle = '#FFD700';
        const nx = catX + leftCharHeight * 0.3 + Math.sin(frameCount * 0.1) * 5;
        ctx.fillRect(nx, noteY, 2, 8); ctx.fillRect(nx - 2, noteY - 2, 4, 3); ctx.restore();
      }
      if (frameCount % 30 < 15) {
        const starX = mouseX + rightCharHeight * 0.2;
        const starY = groundY - rightCharHeight - 6;
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(starX, starY, 4, 4);
        ctx.fillRect(starX - 1, starY + 1, 6, 2);
        ctx.fillRect(starX + 1, starY - 1, 2, 6);
      }
    }

    // Title
    if (phase !== 'blackScreen' && phase !== 'charsEnter') {
      drawTitle();
    }

    drawParticles();

    // Fade overlays
    if (fadeAlpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
      ctx.fillRect(0, 0, CW, CH);
    }
    if (whiteAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${whiteAlpha})`;
      ctx.fillRect(0, 0, CW, CH);
    }

    // Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let y = 0; y < CH; y += 3) {
      ctx.fillRect(0, y, CW, 1);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
