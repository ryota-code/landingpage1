(function () {
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  // Game Boy resolution
  canvas.width = 160;
  canvas.height = 144;
  const CW = 160, CH = 144;

  // Original Game Boy colors: white background, black logo
  const BG_COLOR = '#CADC9F';   // slightly warm off-white (real GB LCD tint)
  const LOGO_COLOR = '#000000'; // black text/logo like the real thing

  // Cat image
  const catImg = new Image();
  catImg.crossOrigin = 'anonymous';
  catImg.src = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/ac01243-5ea7-ebaa-868-05c5c7f02fd3_dccacd1f-0fa3-4be5-a60e-43821d5c7a94.png';

  // ── State ──
  let f = 0;
  let phase = 'blank';     // blank -> drop -> land -> ding -> fadeout -> done
  let phaseTimer = 0;
  let logoY = -30;          // logo starts above screen
  const logoTargetY = 62;   // center of screen
  let dingSounded = false;
  let screenAlpha = 1;

  // ── Audio ──
  let audioCtx = null;
  function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Game Boy startup chime
  function playDing() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;

    const o1 = audioCtx.createOscillator();
    const g1 = audioCtx.createGain();
    o1.type = 'square';
    o1.frequency.setValueAtTime(1048, t);
    g1.gain.setValueAtTime(0.15, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o1.connect(g1); g1.connect(audioCtx.destination);
    o1.start(t); o1.stop(t + 0.5);

    const o2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    o2.type = 'square';
    o2.frequency.setValueAtTime(524, t + 0.05);
    g2.gain.setValueAtTime(0, t);
    g2.gain.setValueAtTime(0.12, t + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    o2.connect(g2); g2.connect(audioCtx.destination);
    o2.start(t + 0.05); o2.stop(t + 0.9);

    const o3 = audioCtx.createOscillator();
    const g3 = audioCtx.createGain();
    o3.type = 'sine';
    o3.frequency.setValueAtTime(2096, t);
    g3.gain.setValueAtTime(0.04, t);
    g3.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o3.connect(g3); g3.connect(audioCtx.destination);
    o3.start(t); o3.stop(t + 0.7);
  }

  // ── Draw "にゃんこ先生" logo ──
  function drawLogo(centerY) {
    const text = 'にゃんこ先生';
    ctx.font = 'bold 14px "DotGothic16", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(text);
    const textW = metrics.width;
    const textLeft = CW / 2 - textW / 2;
    const textRight = CW / 2 + textW / 2;

    // Text
    ctx.fillStyle = LOGO_COLOR;
    ctx.fillText(text, CW / 2, centerY);

    // ® mark
    ctx.font = '5px "DotGothic16", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('®', textRight + 2, centerY - 10);

    // Cat clinging to the text - hanging from the top line
    if (catImg.complete && catImg.naturalWidth) {
      const catDrawH = 30;
      const catDrawW = catDrawH * (catImg.width / catImg.height);
      // Position: right side of text, cat's "hands" at the top bar level
      // Cat body hangs below, paws gripping the top line
      const catX = textRight - catDrawW * 0.3;
      const catBaseY = centerY - 12 - catDrawH * 0.15; // paws at top bar
      ctx.drawImage(catImg, catX, catBaseY, catDrawW, catDrawH);
    }
  }

  // ── Main loop ──
  function loop() {
    f++;
    phaseTimer++;

    if (!audioCtx) {
      try { initAudio(); } catch (e) {}
    }

    // ── Phase transitions ──
    if (phase === 'blank' && phaseTimer > 40) {
      phase = 'drop';
      phaseTimer = 0;
      logoY = -30;
    }
    else if (phase === 'drop') {
      // Slower drop: ~2.5 seconds (150 frames at 60fps)
      const progress = Math.min(phaseTimer / 150, 1);
      // Smooth ease - slow at start, accelerate, then decelerate near end
      const eased = progress < 0.7
        ? progress * progress * 1.2
        : 1 - Math.pow(1 - progress, 3) * 0.4;
      logoY = -30 + (logoTargetY + 30) * Math.min(eased, 1);

      if (progress >= 1) {
        logoY = logoTargetY;
        phase = 'land';
        phaseTimer = 0;
      }
    }
    else if (phase === 'land') {
      if (phaseTimer <= 6) {
        logoY = logoTargetY - (3 - Math.abs(phaseTimer - 3));
      } else {
        logoY = logoTargetY;
        if (phaseTimer > 10) {
          phase = 'ding';
          phaseTimer = 0;
        }
      }
    }
    else if (phase === 'ding') {
      if (!dingSounded) {
        playDing();
        dingSounded = true;
      }
      if (phaseTimer > 120) {
        phase = 'fadeout';
        phaseTimer = 0;
      }
    }
    else if (phase === 'fadeout') {
      screenAlpha = Math.max(0, 1 - phaseTimer / 40);
      if (phaseTimer > 60) {
        phase = 'done';
        phaseTimer = 0;
      }
    }
    else if (phase === 'done') {
      if (phaseTimer > 30) {
        phase = 'blank';
        phaseTimer = 0;
        logoY = -30;
        dingSounded = false;
        screenAlpha = 1;
      }
    }

    // ── Draw ──
    // Background - real GB LCD-ish off-white
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CW, CH);

    if (phase === 'done') {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CW, CH);
      requestAnimationFrame(loop);
      return;
    }

    ctx.save();
    ctx.globalAlpha = screenAlpha;

    if (phase === 'drop') {
      drawLogo(logoY);
    }
    else if (phase !== 'blank') {
      drawLogo(logoY);
    }

    ctx.restore();

    requestAnimationFrame(loop);
  }

  function startWithAudio() {
    initAudio();
    document.removeEventListener('click', startWithAudio);
    document.removeEventListener('touchstart', startWithAudio);
  }
  document.addEventListener('click', startWithAudio);
  document.addEventListener('touchstart', startWithAudio);

  loop();
})();
