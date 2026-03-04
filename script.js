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

  // Set crossOrigin for all images
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

  // Animation phases
  let phase = 'blackScreen';
  let phaseTimer = 0;

  // Character positions
  let catX = -100;
  let mouseX = CW + 20;
  const catTargetX = 80;
  const mouseTargetX = 280;

  // Character excitement
  let catBounceOffset = 0;
  let mouseBounceOffset = 0;
  let catJumpVel = 0;
  let mouseJumpVel = 0;
  let catOnGround = true;
  let mouseOnGround = true;

  // Title position (drops from top)
  let titleY = -80;
  const titleTargetY = 20;
  let titleBounceVel = 0;
  let titleBouncing = false;
  let titleScale = 1.0;

  // Menu state
  let menuAlpha = 0;
  let cursorBlink = 0;
  let selectedItem = -1;
  let selectFlashCount = 0;

  // Fade
  let fadeAlpha = 1.0;
  let whiteAlpha = 0;

  // Road scroll offset
  let roadScrollOffset = 0;

  // Clouds for adventure sky
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

  // Birds flying in the sky
  const birds = [];
  for (let i = 0; i < 3; i++) {
    birds.push({
      x: Math.random() * CW,
      y: Math.random() * 40 + 20,
      speed: Math.random() * 0.5 + 0.3,
      wingPhase: Math.random() * Math.PI * 2
    });
  }

  // Flowers/grass decorations
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

  // Sparkle effects
  const sparkles = [];

  // Particle effects for selection
  const particles = [];

  // --- BGM using Web Audio API ---
  let audioCtx = null;
  let bgmStarted = false;

  function startBGM() {
    if (bgmStarted) return;
    bgmStarted = true;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.15;
    masterGain.connect(audioCtx.destination);

    // Adventure melody - upbeat and exciting
    const melody = [
      // Bar 1
      { note: 'C5', start: 0, dur: 0.2 },
      { note: 'E5', start: 0.2, dur: 0.2 },
      { note: 'G5', start: 0.4, dur: 0.2 },
      { note: 'C6', start: 0.6, dur: 0.4 },
      // Bar 2
      { note: 'B5', start: 1.0, dur: 0.2 },
      { note: 'A5', start: 1.2, dur: 0.2 },
      { note: 'G5', start: 1.4, dur: 0.4 },
      { note: 'E5', start: 1.8, dur: 0.2 },
      // Bar 3
      { note: 'F5', start: 2.0, dur: 0.2 },
      { note: 'A5', start: 2.2, dur: 0.2 },
      { note: 'G5', start: 2.4, dur: 0.2 },
      { note: 'F5', start: 2.6, dur: 0.2 },
      { note: 'E5', start: 2.8, dur: 0.2 },
      // Bar 4
      { note: 'D5', start: 3.0, dur: 0.3 },
      { note: 'E5', start: 3.3, dur: 0.3 },
      { note: 'C5', start: 3.6, dur: 0.4 },
      // Bar 5 - repeat with variation
      { note: 'C5', start: 4.0, dur: 0.2 },
      { note: 'E5', start: 4.2, dur: 0.2 },
      { note: 'G5', start: 4.4, dur: 0.2 },
      { note: 'A5', start: 4.6, dur: 0.2 },
      { note: 'B5', start: 4.8, dur: 0.2 },
      // Bar 6
      { note: 'C6', start: 5.0, dur: 0.3 },
      { note: 'B5', start: 5.3, dur: 0.2 },
      { note: 'G5', start: 5.5, dur: 0.5 },
      // Bar 7
      { note: 'A5', start: 6.0, dur: 0.2 },
      { note: 'G5', start: 6.2, dur: 0.2 },
      { note: 'F5', start: 6.4, dur: 0.2 },
      { note: 'E5', start: 6.6, dur: 0.2 },
      { note: 'D5', start: 6.8, dur: 0.2 },
      // Bar 8
      { note: 'C5', start: 7.0, dur: 0.6 },
      { note: 'E5', start: 7.6, dur: 0.4 },
    ];

    // Bass line
    const bass = [
      { note: 'C3', start: 0, dur: 0.4 },
      { note: 'C3', start: 0.5, dur: 0.2 },
      { note: 'G3', start: 0.8, dur: 0.2 },
      { note: 'C3', start: 1.0, dur: 0.4 },
      { note: 'E3', start: 1.5, dur: 0.2 },
      { note: 'G3', start: 1.8, dur: 0.2 },
      { note: 'F3', start: 2.0, dur: 0.4 },
      { note: 'F3', start: 2.5, dur: 0.2 },
      { note: 'A3', start: 2.8, dur: 0.2 },
      { note: 'G3', start: 3.0, dur: 0.4 },
      { note: 'G3', start: 3.5, dur: 0.2 },
      { note: 'B3', start: 3.8, dur: 0.2 },
      { note: 'C3', start: 4.0, dur: 0.4 },
      { note: 'C3', start: 4.5, dur: 0.2 },
      { note: 'G3', start: 4.8, dur: 0.2 },
      { note: 'A3', start: 5.0, dur: 0.4 },
      { note: 'E3', start: 5.5, dur: 0.2 },
      { note: 'G3', start: 5.8, dur: 0.2 },
      { note: 'F3', start: 6.0, dur: 0.4 },
      { note: 'D3', start: 6.5, dur: 0.2 },
      { note: 'G3', start: 6.8, dur: 0.2 },
      { note: 'C3', start: 7.0, dur: 0.8 },
    ];

    // Arpeggio accompaniment
    const arp = [
      { note: 'E4', start: 0, dur: 0.15 },
      { note: 'G4', start: 0.15, dur: 0.15 },
      { note: 'C5', start: 0.3, dur: 0.15 },
      { note: 'G4', start: 0.45, dur: 0.15 },
      { note: 'E4', start: 0.6, dur: 0.15 },
      { note: 'G4', start: 0.75, dur: 0.15 },
      { note: 'E4', start: 1.0, dur: 0.15 },
      { note: 'G4', start: 1.15, dur: 0.15 },
      { note: 'C5', start: 1.3, dur: 0.15 },
      { note: 'G4', start: 1.45, dur: 0.15 },
      { note: 'E4', start: 1.6, dur: 0.15 },
      { note: 'G4', start: 1.75, dur: 0.15 },
      { note: 'F4', start: 2.0, dur: 0.15 },
      { note: 'A4', start: 2.15, dur: 0.15 },
      { note: 'C5', start: 2.3, dur: 0.15 },
      { note: 'A4', start: 2.45, dur: 0.15 },
      { note: 'F4', start: 2.6, dur: 0.15 },
      { note: 'A4', start: 2.75, dur: 0.15 },
      { note: 'G4', start: 3.0, dur: 0.15 },
      { note: 'B4', start: 3.15, dur: 0.15 },
      { note: 'D5', start: 3.3, dur: 0.15 },
      { note: 'B4', start: 3.45, dur: 0.15 },
      { note: 'G4', start: 3.6, dur: 0.15 },
      { note: 'B4', start: 3.75, dur: 0.15 },
      { note: 'E4', start: 4.0, dur: 0.15 },
      { note: 'G4', start: 4.15, dur: 0.15 },
      { note: 'C5', start: 4.3, dur: 0.15 },
      { note: 'G4', start: 4.45, dur: 0.15 },
      { note: 'E4', start: 4.6, dur: 0.15 },
      { note: 'G4', start: 4.75, dur: 0.15 },
      { note: 'A4', start: 5.0, dur: 0.15 },
      { note: 'C5', start: 5.15, dur: 0.15 },
      { note: 'E5', start: 5.3, dur: 0.15 },
      { note: 'C5', start: 5.45, dur: 0.15 },
      { note: 'A4', start: 5.6, dur: 0.15 },
      { note: 'C5', start: 5.75, dur: 0.15 },
      { note: 'F4', start: 6.0, dur: 0.15 },
      { note: 'A4', start: 6.15, dur: 0.15 },
      { note: 'C5', start: 6.3, dur: 0.15 },
      { note: 'A4', start: 6.45, dur: 0.15 },
      { note: 'D4', start: 6.6, dur: 0.15 },
      { note: 'G4', start: 6.75, dur: 0.15 },
      { note: 'E4', start: 7.0, dur: 0.15 },
      { note: 'G4', start: 7.15, dur: 0.15 },
      { note: 'C5', start: 7.3, dur: 0.15 },
      { note: 'G4', start: 7.45, dur: 0.15 },
      { note: 'E4', start: 7.6, dur: 0.15 },
      { note: 'G4', start: 7.75, dur: 0.15 },
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

      // Drum-like percussion with noise
      for (let beat = 0; beat < 16; beat++) {
        const t = startTime + beat * 0.5;
        // Kick on every beat
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

        // Hi-hat on off-beats
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

      // Schedule next loop
      setTimeout(() => {
        if (audioCtx && audioCtx.state === 'running') {
          scheduleLoop(startTime + loopDuration);
        }
      }, (loopDuration - 0.5) * 1000);
    }

    scheduleLoop(audioCtx.currentTime + 0.1);
  }

  // Start BGM on first user interaction
  function initAudio() {
    startBGM();
    document.removeEventListener('click', initAudio);
    document.removeEventListener('touchstart', initAudio);
    document.removeEventListener('keydown', initAudio);
  }
  document.addEventListener('click', initAudio);
  document.addEventListener('touchstart', initAudio);
  document.addEventListener('keydown', initAudio);
  // Also try to auto-start (some browsers allow it)
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
    } else {
      drawFallbackChar(x, y, h, flipH);
    }
  }

  function drawFallbackChar(x, y, h, flipH) {
    const px = Math.floor(x);
    const py = Math.floor(y);
    const s = Math.floor(h / 10);
    ctx.save();
    if (flipH) {
      ctx.translate(px + s * 8, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(s * 2, 0, s * 4, s * 3);
    ctx.fillStyle = '#000';
    ctx.fillRect(s * 3, s, s, s);
    ctx.fillRect(s * 5, s, s, s);
    ctx.fillStyle = '#4488FF';
    ctx.fillRect(s * 1, s * 3, s * 6, s * 4);
    ctx.fillStyle = '#FFD700';
    const legOffset = animFrame === 0 ? 0 : s;
    ctx.fillRect(s * 2 - legOffset, s * 7, s * 2, s * 3);
    ctx.fillRect(s * 4 + legOffset, s * 7, s * 2, s * 3);
    ctx.restore();
  }

  function drawPixelText(text, x, y, size, color, align) {
    ctx.fillStyle = color;
    ctx.font = size + 'px "DotGothic16", sans-serif';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  function drawBackground() {
    // Adventure sky gradient - bright and warm
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#4BA3FF');
    skyGrad.addColorStop(0.3, '#7BC4FF');
    skyGrad.addColorStop(0.6, '#A8DCFF');
    skyGrad.addColorStop(1, '#FFE8A0');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CW, CH);

    // Sun
    const sunX = CW - 70;
    const sunY = 40;
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
    ctx.fill();
    // Sun glow
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 50);
    sunGlow.addColorStop(0, 'rgba(255, 240, 150, 0.4)');
    sunGlow.addColorStop(1, 'rgba(255, 240, 150, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 50, 0, Math.PI * 2);
    ctx.fill();
    // Sun rays (rotating)
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(frameCount * 0.005);
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
      const cx = Math.floor(c.x);
      const cy = Math.floor(c.y);
      ctx.fillRect(cx, cy, c.width, c.height);
      ctx.fillRect(cx + 8, cy - 6, c.width - 16, 6);
      ctx.fillRect(cx + c.width * 0.3, cy - 10, c.width * 0.4, 6);
    });

    // Birds
    birds.forEach(b => {
      b.x -= b.speed;
      if (b.x < -20) b.x = CW + 20;
      b.wingPhase += 0.1;
      const wingY = Math.sin(b.wingPhase) * 3;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x - 4, b.y + wingY);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(b.x + 4, b.y + wingY);
      ctx.stroke();
    });

    // Far hills (green, rolling)
    ctx.fillStyle = '#5BAF5B';
    for (let x = 0; x < CW; x += 2) {
      const h = Math.sin(x * 0.01 + 1) * 25 + Math.sin(x * 0.025) * 15 + 55;
      ctx.fillRect(x, groundY - h, 2, h);
    }
    // Near hills
    ctx.fillStyle = '#4A9E4A';
    for (let x = 0; x < CW; x += 2) {
      const h = Math.sin(x * 0.018 + 3) * 18 + Math.sin(x * 0.01 + 1) * 12 + 38;
      ctx.fillRect(x, groundY - h, 2, h);
    }

    // Trees on hills
    const treePositions = [30, 90, 160, 250, 330, 390];
    treePositions.forEach(tx => {
      const hillH = Math.sin(tx * 0.018 + 3) * 18 + Math.sin(tx * 0.01 + 1) * 12 + 38;
      const treeBase = groundY - hillH + 4;
      // Trunk
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(tx - 2, treeBase - 16, 4, 16);
      // Leaves
      ctx.fillStyle = '#2D7D2D';
      ctx.fillRect(tx - 8, treeBase - 28, 16, 14);
      ctx.fillRect(tx - 6, treeBase - 34, 12, 8);
      ctx.fillRect(tx - 4, treeBase - 38, 8, 6);
    });

    // Ground - dirt road
    ctx.fillStyle = '#6BBF6B';
    ctx.fillRect(0, groundY - 4, CW, CH - groundY + 4);

    // Road (perspective path going forward)
    const roadCenterX = CW / 2;
    ctx.fillStyle = '#C4A46C';
    // Main road surface
    ctx.beginPath();
    ctx.moveTo(roadCenterX - 60, CH);
    ctx.lineTo(roadCenterX + 60, CH);
    ctx.lineTo(roadCenterX + 15, groundY);
    ctx.lineTo(roadCenterX - 15, groundY);
    ctx.closePath();
    ctx.fill();

    // Road dashes (moving to give illusion of walking forward)
    roadScrollOffset = (roadScrollOffset + 0.5) % 16;
    ctx.fillStyle = '#E8D8A8';
    for (let d = 0; d < 8; d++) {
      const t = (d * 16 + roadScrollOffset) / (CH - groundY);
      if (t > 1) continue;
      const y = groundY + t * (CH - groundY);
      const width = 2 + t * 6;
      const dashH = 3 + t * 4;
      ctx.fillRect(roadCenterX - width / 2, y, width, dashH);
    }

    // Road edges
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.moveTo(roadCenterX - 62, CH);
    ctx.lineTo(roadCenterX - 16, groundY);
    ctx.lineTo(roadCenterX - 14, groundY);
    ctx.lineTo(roadCenterX - 58, CH);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(roadCenterX + 62, CH);
    ctx.lineTo(roadCenterX + 16, groundY);
    ctx.lineTo(roadCenterX + 14, groundY);
    ctx.lineTo(roadCenterX + 58, CH);
    ctx.closePath();
    ctx.fill();

    // Grass tufts
    ctx.fillStyle = '#4CAF50';
    for (let x = 0; x < CW; x += 18) {
      if (Math.abs(x - roadCenterX) < 65) continue; // Skip on road
      const gy = groundY + Math.random() * 3;
      ctx.fillRect(x, gy - 6, 2, 6);
      ctx.fillRect(x + 3, gy - 8, 2, 8);
      ctx.fillRect(x + 6, gy - 5, 2, 5);
    }

    // Flowers
    flowers.forEach(f => {
      if (Math.abs(f.x - roadCenterX) < 65) return; // Skip on road
      const sway = Math.sin(frameCount * 0.03 + f.swayPhase) * 1;
      ctx.fillStyle = '#228B22';
      ctx.fillRect(f.x + sway, f.y - f.size * 2, 1, f.size * 2);
      ctx.fillStyle = f.color;
      ctx.fillRect(f.x - f.size / 2 + sway, f.y - f.size * 2.5, f.size, f.size);
    });

    // Ground line highlight
    ctx.fillStyle = '#7ECF7E';
    ctx.fillRect(0, groundY, CW, 2);
  }

  function drawTitle() {
    ctx.save();

    // Title pulse effect
    const pulse = 1 + Math.sin(frameCount * 0.06) * 0.03;
    const scale = titleScale * pulse;

    const titleText = 'にゃんこ先生のFX講座';
    const titleSize = 20;

    ctx.translate(CW / 2, titleY + 20);
    ctx.scale(scale, scale);

    // Title shadow/glow
    ctx.shadowColor = '#FF8C00';
    ctx.shadowBlur = 12 + Math.sin(frameCount * 0.05) * 4;

    // Black outline
    ctx.fillStyle = '#000000';
    for (let ox = -2; ox <= 2; ox++) {
      for (let oy = -2; oy <= 2; oy++) {
        if (ox === 0 && oy === 0) continue;
        drawPixelText(titleText, ox, oy, titleSize, '#000000', 'center');
      }
    }

    // Main title with golden gradient feel
    drawPixelText(titleText, 0, 0, titleSize, '#FFD700', 'center');

    // Highlight pass
    ctx.shadowBlur = 0;
    drawPixelText(titleText, 0, -1, titleSize, '#FFFACD', 'center');

    ctx.restore();

    // Subtitle
    if (phase !== 'blackScreen' && phase !== 'charsEnter' && phase !== 'charsPause') {
      ctx.save();
      const subAlpha = Math.min(1, (phaseTimer > 20 ? (phaseTimer - 20) / 30 : 0));
      ctx.globalAlpha = subAlpha;
      drawPixelText('〜 ぼうけんの はじまり 〜', CW / 2, titleY + 44, 10, '#FFFFFF', 'center');
      ctx.restore();
    }
  }

  function drawMenu() {
    if (menuAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = menuAlpha;

    const menuItems = [
      'ぼうけんを はじめる',
      'つづきから',
      'せってい'
    ];

    const menuX = CW / 2;
    const menuStartY = 110;
    const menuSpacing = 24;

    // Menu window background
    const winW = 200;
    const winH = menuItems.length * menuSpacing + 24;
    const winX = menuX - winW / 2;
    const winY = menuStartY - 16;

    // Adventure-style menu box
    ctx.fillStyle = 'rgba(20, 50, 20, 0.88)';
    ctx.fillRect(winX, winY, winW, winH);
    // Gold border
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 2;
    ctx.strokeRect(winX + 2, winY + 2, winW - 4, winH - 4);
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 1;
    ctx.strokeRect(winX + 5, winY + 5, winW - 10, winH - 10);

    for (let i = 0; i < menuItems.length; i++) {
      const itemY = menuStartY + i * menuSpacing + 4;
      let color = '#77886a';

      if (i === 0) {
        if (selectedItem === 0) {
          color = (selectFlashCount % 2 === 0) ? '#FFFFFF' : '#FFFF00';
        } else {
          color = '#FFFFFF';
        }
      }

      drawPixelText(menuItems[i], menuX + 10, itemY, 16, color, 'center');

      // Cursor arrow for first item
      if (i === 0 && selectedItem === -1) {
        const cursorVisible = Math.floor(cursorBlink / 15) % 2 === 0;
        if (cursorVisible) {
          ctx.fillStyle = '#FFD700';
          const arrowX = winX + 14;
          const arrowY = itemY - 5;
          ctx.fillRect(arrowX, arrowY + 2, 8, 6);
          ctx.fillRect(arrowX + 8, arrowY, 4, 10);
          ctx.fillRect(arrowX + 12, arrowY + 2, 2, 6);
        }
      }
    }

    // "PRESS START" text
    if (selectedItem === -1) {
      const pressAlpha = Math.sin(frameCount * 0.08) * 0.4 + 0.6;
      ctx.globalAlpha = menuAlpha * pressAlpha;
      drawPixelText('▶ PRESS START', menuX, menuStartY + menuItems.length * menuSpacing + 16, 12, '#FFD700', 'center');
    }

    ctx.restore();
  }

  function drawParticles() {
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
      p.vy += 0.1;
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
        x: x + Math.random() * 40 - 20,
        y: y + Math.random() * 20 - 10,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 3 - 2,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        size: Math.random() * 3 + 2,
        r: [255, 255, 100, 255][Math.floor(Math.random() * 4)],
        g: [215, 165, 255, 200][Math.floor(Math.random() * 4)],
        b: [0, 0, 50, 50][Math.floor(Math.random() * 4)]
      });
    }
  }

  function drawSparkles() {
    // Ambient sparkles
    if (phase !== 'blackScreen' && frameCount % 8 === 0) {
      sparkles.push({
        x: Math.random() * CW,
        y: Math.random() * groundY,
        life: 20 + Math.random() * 15,
        maxLife: 35,
        size: Math.random() * 3 + 1
      });
    }
    sparkles.forEach(s => {
      s.life--;
      if (s.life > 0) {
        const alpha = s.life / s.maxLife;
        const twinkle = Math.sin(s.life * 0.5) > 0 ? 1 : 0.3;
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha * twinkle})`;
        ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
        // Cross sparkle
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

  // Excitement animations for characters
  function getCharExcitement(timer) {
    // Small bouncing
    return Math.abs(Math.sin(timer * 0.15)) * 4;
  }

  function drawExcitedEmotes(x, y, charH) {
    // Musical notes floating up
    const noteOffset = (frameCount % 60) / 60;
    const noteY = y - charH - 10 - noteOffset * 20;
    const noteAlpha = 1 - noteOffset;
    if (noteAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = noteAlpha;
      ctx.fillStyle = '#FFD700';
      // Simple music note pixel art
      const nx = x + charH * 0.3 + Math.sin(frameCount * 0.1) * 5;
      ctx.fillRect(nx, noteY, 2, 8);
      ctx.fillRect(nx - 2, noteY - 2, 4, 3);
      ctx.restore();
    }

    // Hearts or stars popping
    if (frameCount % 40 < 20) {
      const starX = x + charH * 0.2;
      const starY = y - charH - 6;
      ctx.fillStyle = '#FF6B6B';
      // Simple star
      ctx.fillRect(starX, starY, 4, 4);
      ctx.fillRect(starX - 1, starY + 1, 6, 2);
      ctx.fillRect(starX + 1, starY - 1, 2, 6);
    }
  }

  function update() {
    frameCount++;
    phaseTimer++;

    stepTimer++;
    if (stepTimer >= 8) {
      stepTimer = 0;
      animFrame = 1 - animFrame;
    }

    switch (phase) {
      case 'blackScreen':
        fadeAlpha = Math.max(0, 1.0 - phaseTimer / 90);
        if (phaseTimer > 100) {
          phase = 'charsEnter';
          phaseTimer = 0;
        }
        break;

      case 'charsEnter':
        if (catX < catTargetX) catX += 3;
        else catX = catTargetX;
        if (mouseX > mouseTargetX) mouseX -= 3;
        else mouseX = mouseTargetX;

        if (catX >= catTargetX && mouseX <= mouseTargetX) {
          if (phaseTimer > 10) {
            phase = 'charsPause';
            phaseTimer = 0;
          }
        }
        break;

      case 'charsPause':
        // Characters get excited - bouncing
        catBounceOffset = getCharExcitement(phaseTimer);
        mouseBounceOffset = getCharExcitement(phaseTimer + 10);

        // Random small jumps
        if (phaseTimer === 10 && catOnGround) {
          catJumpVel = -4;
          catOnGround = false;
        }
        if (phaseTimer === 20 && mouseOnGround) {
          mouseJumpVel = -3;
          mouseOnGround = false;
        }

        if (phaseTimer > 40) {
          phase = 'titleDrop';
          phaseTimer = 0;
          titleBounceVel = 0;
          titleBouncing = true;
        }
        break;

      case 'titleDrop':
        catBounceOffset = getCharExcitement(frameCount);
        mouseBounceOffset = getCharExcitement(frameCount + 10);

        if (titleBouncing) {
          titleBounceVel += 0.5;
          titleY += titleBounceVel;
          if (titleY >= titleTargetY) {
            titleY = titleTargetY;
            titleBounceVel = -titleBounceVel * 0.4;
            if (Math.abs(titleBounceVel) < 1) {
              titleBouncing = false;
              titleY = titleTargetY;
              titleScale = 1.2;
              spawnParticles(CW / 2, titleTargetY + 25, 25);
            }
          }
        }
        // Title scale easing
        if (titleScale > 1.0) {
          titleScale += (1.0 - titleScale) * 0.1;
        }

        if (!titleBouncing && phaseTimer > 60) {
          phase = 'menuAppear';
          phaseTimer = 0;
        }
        break;

      case 'menuAppear':
        catBounceOffset = getCharExcitement(frameCount) * 0.5;
        mouseBounceOffset = getCharExcitement(frameCount + 10) * 0.5;
        menuAlpha = Math.min(1, phaseTimer / 40);
        cursorBlink++;
        if (phaseTimer > 120) {
          phase = 'cursorSelect';
          phaseTimer = 0;
        }
        break;

      case 'cursorSelect':
        catBounceOffset = getCharExcitement(frameCount) * 0.3;
        mouseBounceOffset = getCharExcitement(frameCount + 10) * 0.3;
        cursorBlink++;
        if (phaseTimer > 60) {
          phase = 'selectFlash';
          phaseTimer = 0;
          selectedItem = 0;
          selectFlashCount = 0;
        }
        break;

      case 'selectFlash':
        // Characters jump excitedly
        catBounceOffset = getCharExcitement(frameCount * 2) * 2;
        mouseBounceOffset = getCharExcitement(frameCount * 2 + 5) * 2;

        if (phaseTimer % 6 === 0) {
          selectFlashCount++;
        }
        if (selectFlashCount > 8) {
          spawnParticles(CW / 2, 130, 30);
          spawnParticles(catX + 30, groundY - 40, 15);
          spawnParticles(mouseX + 15, groundY - 20, 15);
          phase = 'fadeOut';
          phaseTimer = 0;
        }
        break;

      case 'fadeOut':
        whiteAlpha = Math.min(1, phaseTimer / 60);
        if (phaseTimer > 120) {
          // Reset and loop
          phase = 'blackScreen';
          phaseTimer = 0;
          fadeAlpha = 1.0;
          whiteAlpha = 0;
          catX = -100;
          mouseX = CW + 20;
          titleY = -80;
          titleScale = 1.0;
          menuAlpha = 0;
          selectedItem = -1;
          selectFlashCount = 0;
          cursorBlink = 0;
          catBounceOffset = 0;
          mouseBounceOffset = 0;
          catJumpVel = 0;
          mouseJumpVel = 0;
          catOnGround = true;
          mouseOnGround = true;
          particles.length = 0;
          sparkles.length = 0;
        }
        break;
    }

    // Update jump physics
    if (!catOnGround) {
      catJumpVel += 0.3;
      catBounceOffset += catJumpVel;
      if (catBounceOffset >= 0) {
        catBounceOffset = 0;
        catOnGround = true;
        catJumpVel = 0;
      }
    }
    if (!mouseOnGround) {
      mouseJumpVel += 0.3;
      mouseBounceOffset += mouseJumpVel;
      if (mouseBounceOffset >= 0) {
        mouseBounceOffset = 0;
        mouseOnGround = true;
        mouseJumpVel = 0;
      }
    }
  }

  function draw() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CW, CH);

    drawBackground();
    drawSparkles();

    // Characters with bounce offset
    const leftCharImg = animFrame === 0 ? images.left1 : images.left2;
    const rightCharImg = animFrame === 0 ? images.right1 : images.right2;

    const catDrawY = groundY - leftCharHeight - catBounceOffset;
    const mouseDrawY = groundY - rightCharHeight - mouseBounceOffset;

    // Character shadows
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(catX + leftCharHeight * 0.4, groundY, leftCharHeight * 0.3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(mouseX + rightCharHeight * 0.4, groundY, rightCharHeight * 0.3, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    drawCharacter(leftCharImg, catX, catDrawY, leftCharHeight, false);
    drawCharacter(rightCharImg, mouseX, mouseDrawY, rightCharHeight, true);

    // Emotes when paused or excited
    if (phase === 'charsPause' || phase === 'titleDrop' || phase === 'selectFlash') {
      drawExcitedEmotes(catX, groundY, leftCharHeight);
      drawExcitedEmotes(mouseX, groundY, rightCharHeight);
    }

    // Exclamation when first meeting
    if (phase === 'charsPause' && phaseTimer < 15) {
      const flashVisible = Math.floor(frameCount / 6) % 2 === 0;
      if (flashVisible) {
        ctx.fillStyle = '#FF4444';
        const ex = catX + leftCharHeight * 0.4;
        ctx.fillRect(ex, groundY - leftCharHeight - 18, 4, 10);
        ctx.fillRect(ex, groundY - leftCharHeight - 6, 4, 4);

        const ex2 = mouseX + rightCharHeight * 0.3;
        ctx.fillRect(ex2, groundY - rightCharHeight - 18, 4, 10);
        ctx.fillRect(ex2, groundY - rightCharHeight - 6, 4, 4);
      }
    }

    // Title
    if (phase !== 'blackScreen' && phase !== 'charsEnter') {
      drawTitle();
    }

    // Menu
    drawMenu();

    // Particles
    drawParticles();

    // Black fade overlay (for intro)
    if (fadeAlpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
      ctx.fillRect(0, 0, CW, CH);
    }

    // White fade overlay (for outro)
    if (whiteAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${whiteAlpha})`;
      ctx.fillRect(0, 0, CW, CH);
    }

    // Scanline effect
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
