(function () {
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  // Game Boy resolution
  canvas.width = 160;
  canvas.height = 144;
  const CW = 160, CH = 144;

  // Game Boy 4-color palette
  const GB = {
    lightest: '#9BBC0F',
    light:    '#8BAC0F',
    dark:     '#306230',
    darkest:  '#0F380F',
  };

  // Cat image
  const catImg = new Image();
  catImg.crossOrigin = 'anonymous';
  catImg.src = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/ac01243-5ea7-ebaa-868-05c5c7f02fd3_dccacd1f-0fa3-4be5-a60e-43821d5c7a94.png';

  // ── State ──
  let f = 0;
  let phase = 'blank';     // blank -> drop -> land -> ding -> hold -> fadeout
  let phaseTimer = 0;
  let logoY = -30;          // logo starts above screen
  const logoTargetY = 58;   // center of screen (approx)
  let dingSounded = false;
  let screenAlpha = 1;

  // ── Audio ──
  let audioCtx = null;
  function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Game Boy startup "ding" sound - the iconic two-note chime
  function playDing() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;

    // First note - higher pitch ping
    const o1 = audioCtx.createOscillator();
    const g1 = audioCtx.createGain();
    o1.type = 'square';
    o1.frequency.setValueAtTime(1048, t);  // C6-ish
    g1.gain.setValueAtTime(0.15, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o1.connect(g1); g1.connect(audioCtx.destination);
    o1.start(t); o1.stop(t + 0.5);

    // Second note - slightly lower, slight delay
    const o2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    o2.type = 'square';
    o2.frequency.setValueAtTime(524, t + 0.05);  // C5-ish
    g2.gain.setValueAtTime(0, t);
    g2.gain.setValueAtTime(0.12, t + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    o2.connect(g2); g2.connect(audioCtx.destination);
    o2.start(t + 0.05); o2.stop(t + 0.9);

    // Harmony shimmer
    const o3 = audioCtx.createOscillator();
    const g3 = audioCtx.createGain();
    o3.type = 'sine';
    o3.frequency.setValueAtTime(2096, t);
    g3.gain.setValueAtTime(0.04, t);
    g3.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o3.connect(g3); g3.connect(audioCtx.destination);
    o3.start(t); o3.stop(t + 0.7);
  }

  // ── Registered mark (R) ──
  function drawR(x, y) {
    ctx.fillStyle = GB.darkest;
    ctx.font = '5px "DotGothic16", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('®', x, y);
  }

  // ── Draw the scrolling black bar (like real GB) ──
  function drawScrollBar(y) {
    // The black bar that scrolls down with the logo
    const barH = 8;
    ctx.fillStyle = GB.darkest;
    ctx.fillRect(0, y - barH / 2, CW, barH);
  }

  // ── Draw "にゃんこ先生" logo in Game Boy style ──
  function drawLogo(centerY) {
    const text = 'にゃんこ先生';
    ctx.font = 'bold 14px "DotGothic16", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Measure text for positioning
    const metrics = ctx.measureText(text);
    const textW = metrics.width;
    const textLeft = CW / 2 - textW / 2;
    const textRight = CW / 2 + textW / 2;

    // Draw horizontal lines above and below (like Nintendo logo box)
    ctx.fillStyle = GB.darkest;
    ctx.fillRect(textLeft - 4, centerY - 12, textW + 8, 2);
    ctx.fillRect(textLeft - 4, centerY + 10, textW + 8, 2);

    // Draw text
    ctx.fillStyle = GB.darkest;
    ctx.fillText(text, CW / 2, centerY);

    // Draw registered mark
    drawR(textRight + 2, centerY - 10);

    // Draw cat clinging to the right side of the text
    if (catImg.complete && catImg.naturalWidth) {
      const catDrawH = 28;
      const catDrawW = catDrawH * (catImg.width / catImg.height);
      // Cat hangs on the right edge, slightly overlapping
      const catX = textRight + 4;
      const catBaseY = centerY - catDrawH / 2 - 2;
      ctx.drawImage(catImg, catX, catBaseY, catDrawW, catDrawH);
    }
  }

  // ── Main loop ──
  function loop() {
    f++;
    phaseTimer++;

    // Try to init audio on any frame (some browsers need user gesture)
    if (!audioCtx) {
      try { initAudio(); } catch (e) {}
    }

    // ── Phase transitions ──
    if (phase === 'blank' && phaseTimer > 30) {
      // After ~0.5s blank, start logo drop
      phase = 'drop';
      phaseTimer = 0;
      logoY = -30;
    }
    else if (phase === 'drop') {
      // Logo drops down - accelerating like real GB
      const progress = Math.min(phaseTimer / 60, 1); // ~1 second drop
      // Ease-in (accelerating drop)
      const eased = progress * progress;
      logoY = -30 + (logoTargetY + 30) * eased;

      if (progress >= 1) {
        logoY = logoTargetY;
        phase = 'land';
        phaseTimer = 0;
      }
    }
    else if (phase === 'land') {
      // Small bounce effect
      if (phaseTimer <= 6) {
        logoY = logoTargetY - (3 - Math.abs(phaseTimer - 3));
      } else {
        logoY = logoTargetY;
        if (phaseTimer > 8) {
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
        // Hold for 2 seconds then fade
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
      // Loop back
      if (phaseTimer > 30) {
        phase = 'blank';
        phaseTimer = 0;
        logoY = -30;
        dingSounded = false;
        screenAlpha = 1;
      }
    }

    // ── Draw ──
    // Game Boy lightest green background
    ctx.fillStyle = GB.lightest;
    ctx.fillRect(0, 0, CW, CH);

    if (phase === 'done') {
      // Black screen between loops
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CW, CH);
      requestAnimationFrame(loop);
      return;
    }

    ctx.save();
    ctx.globalAlpha = screenAlpha;

    if (phase === 'drop') {
      // Draw the scrolling bar effect (like real GB boot)
      const barY = logoY + 2;
      // Top portion darker (already scrolled through)
      ctx.fillStyle = GB.light;
      ctx.fillRect(0, 0, CW, Math.max(0, barY - 15));

      drawLogo(logoY);
    }
    else if (phase !== 'blank') {
      // Logo at rest position
      drawLogo(logoY);
    }

    // TM line at bottom
    if (phase === 'ding' || phase === 'fadeout') {
      ctx.fillStyle = GB.dark;
      ctx.font = '7px "DotGothic16", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('にゃんこ先生のFX講座', CW / 2, CH - 20);
    }

    ctx.restore();

    requestAnimationFrame(loop);
  }

  // Start on user interaction (for audio) or immediately (visual)
  function startWithAudio() {
    initAudio();
    document.removeEventListener('click', startWithAudio);
    document.removeEventListener('touchstart', startWithAudio);
  }
  document.addEventListener('click', startWithAudio);
  document.addEventListener('touchstart', startWithAudio);

  loop();
})();
