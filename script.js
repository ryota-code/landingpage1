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
    right2: new Image(),
    titleLogo: new Image(),
    moonImage: new Image()
  };

  const tintedLogoCanvas = document.createElement('canvas');
  let isLogoReady = false;

  images.titleLogo.onload = () => {
    tintedLogoCanvas.width = images.titleLogo.width;
    tintedLogoCanvas.height = images.titleLogo.height;
    const tCtx = tintedLogoCanvas.getContext('2d');
    tCtx.drawImage(images.titleLogo, 0, 0);
    tCtx.globalCompositeOperation = 'source-in';
    tCtx.fillStyle = '#FFFFFF';
    tCtx.fillRect(0, 0, tintedLogoCanvas.width, tintedLogoCanvas.height);
    isLogoReady = true;
  };

  // Set crossOrigin for all images
  Object.values(images).forEach(img => { img.crossOrigin = 'anonymous'; });

  images.left1.src = "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/88b01ae-6deb-2436-d70b-707f3b24a4df__1.png";
  images.left2.src = "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/4d20d-dbcb-c1a-c0e0-ca740e55d8c0__2.png";
  images.right1.src = "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/48c5787-6528-52cc-e7e5-300b1f0fb628__2026-01-29_18.44.19-removebg-preview_1_.png";
  images.right2.src = "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/ac1ddf4-6f87-bdf0-7231-4de2b1de87f6__2026-01-29_18.42.51-removebg-preview_1_.png";
  images.titleLogo.src = "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/5c026b3-ae8-2638-db00-64a27ba65088_ee9d6b42-5a8c-498b-ab9a-ace525915297.png";
  images.moonImage.src = "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/286e7fc-3008-ef3-fbe2-5efcd180e4d__.png";

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
  // 1: blackScreen - fade in from black
  // 2: charsEnter - characters walk in from sides
  // 3: charsPause - characters stop, face each other
  // 4: titleDrop - title logo drops in with bounce
  // 5: menuAppear - menu fades in
  // 6: cursorMove - cursor blinks on "冒険を始める"
  // 7: selectFlash - selection flash effect
  // 8: fadeOut - fade to white then done
  let phase = 'blackScreen';
  let phaseTimer = 0;

  // Character positions
  let catX = -100;
  let mouseX = CW + 20;
  const catTargetX = 80;
  const mouseTargetX = 280;

  // Title position (drops from top)
  let titleY = -80;
  const titleTargetY = 30;
  let titleBounceVel = 0;
  let titleBouncing = false;

  // Menu state
  let menuAlpha = 0;
  let cursorBlink = 0;
  let selectedItem = -1; // -1 = none, 0 = 冒険を始める
  let selectFlashCount = 0;

  // Fade
  let fadeAlpha = 1.0; // start fully black
  let whiteAlpha = 0;

  // Stars for background
  const stars = [];
  for (let i = 0; i < 30; i++) {
    stars.push({
      x: Math.random() * CW,
      y: Math.random() * (groundY - 20),
      twinkle: Math.random() * 100
    });
  }

  // Clouds
  const clouds = [];
  for (let i = 0; i < 4; i++) {
    clouds.push({
      x: Math.random() * CW,
      y: Math.random() * 40 + 15,
      width: Math.random() * 40 + 40,
      speed: Math.random() * 0.2 + 0.1
    });
  }

  // Particle effects for selection
  const particles = [];

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
      // Fallback pixel character
      drawFallbackChar(x, y, h, flipH);
    }
  }

  function drawFallbackChar(x, y, h, flipH) {
    const px = Math.floor(x);
    const py = Math.floor(y);
    const s = Math.floor(h / 10); // pixel scale
    ctx.save();
    if (flipH) {
      ctx.translate(px + s * 8, py);
      ctx.scale(-1, 1);
      ctx.translate(0, 0);
    } else {
      ctx.translate(px, py);
    }
    // Head
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(s * 2, 0, s * 4, s * 3);
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(s * 3, s, s, s);
    ctx.fillRect(s * 5, s, s, s);
    // Body
    ctx.fillStyle = '#4488FF';
    ctx.fillRect(s * 1, s * 3, s * 6, s * 4);
    // Legs
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
    // Night sky with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, groundY);
    gradient.addColorStop(0, '#000022');
    gradient.addColorStop(0.6, '#000044');
    gradient.addColorStop(1, '#001133');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CW, CH);

    // Stars
    stars.forEach(s => {
      const brightness = Math.sin((frameCount + s.twinkle) * 0.05) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.8 + 0.2})`;
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), 2, 2);
    });

    // Mountains (dark silhouette)
    ctx.fillStyle = '#0a0a2e';
    // Back mountain range
    for (let x = 0; x < CW; x += 2) {
      const h = Math.sin(x * 0.015) * 30 + Math.sin(x * 0.008) * 20 + 50;
      ctx.fillRect(x, groundY - h, 2, h);
    }
    // Front mountain range
    ctx.fillStyle = '#0d0d3a';
    for (let x = 0; x < CW; x += 2) {
      const h = Math.sin(x * 0.02 + 1) * 20 + Math.sin(x * 0.01 + 2) * 15 + 35;
      ctx.fillRect(x, groundY - h, 2, h);
    }

    // Ground
    ctx.fillStyle = '#0a2a0a';
    ctx.fillRect(0, groundY - 4, CW, CH - groundY + 4);
    ctx.fillStyle = '#0d3d0d';
    ctx.fillRect(0, groundY, CW, 3);
    ctx.fillStyle = '#061a06';
    ctx.fillRect(0, groundY + 8, CW, 2);
    ctx.fillStyle = '#1a0a00';
    ctx.fillRect(0, groundY + 14, CW, CH - groundY - 14);

    // Clouds (dark, subtle)
    clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x + c.width < -10) c.x = CW + 10;
      ctx.fillStyle = 'rgba(100, 100, 150, 0.3)';
      ctx.fillRect(Math.floor(c.x), Math.floor(c.y), Math.floor(c.width), 12);
      ctx.fillRect(Math.floor(c.x) + 8, Math.floor(c.y) - 6, Math.floor(c.width) - 20, 6);
    });
  }

  function drawTitleLogo() {
    if (isLogoReady) {
      const logoH = 50;
      const aspect = tintedLogoCanvas.width / tintedLogoCanvas.height;
      const logoW = logoH * aspect;
      const logoX = (CW - logoW) / 2;

      ctx.shadowColor = '#4488ff';
      ctx.shadowBlur = 15 + Math.sin(frameCount * 0.05) * 5;
      ctx.drawImage(tintedLogoCanvas, logoX, titleY, logoW, logoH);
      ctx.shadowBlur = 0;
    } else {
      // Fallback: draw title as text
      ctx.shadowColor = '#4488ff';
      ctx.shadowBlur = 15 + Math.sin(frameCount * 0.05) * 5;
      drawPixelText('PIXEL ADVENTURE', CW / 2, titleY + 25, 22, '#FFFFFF', 'center');
      ctx.shadowBlur = 0;
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
    const menuStartY = 120;
    const menuSpacing = 24;

    // Menu window background
    const winW = 200;
    const winH = menuItems.length * menuSpacing + 24;
    const winX = menuX - winW / 2;
    const winY = menuStartY - 16;

    ctx.fillStyle = 'rgba(0, 0, 40, 0.85)';
    ctx.fillRect(winX, winY, winW, winH);
    // Border
    ctx.strokeStyle = '#6688cc';
    ctx.lineWidth = 2;
    ctx.strokeRect(winX + 2, winY + 2, winW - 4, winH - 4);
    ctx.lineWidth = 1;
    ctx.strokeRect(winX + 5, winY + 5, winW - 10, winH - 10);

    for (let i = 0; i < menuItems.length; i++) {
      const itemY = menuStartY + i * menuSpacing + 4;
      let color = '#888899';

      if (i === 0) {
        // "冒険を始める" is selectable
        if (selectedItem === 0) {
          // Flashing when selected
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
          // Pixel arrow cursor
          ctx.fillStyle = '#FFFFFF';
          const arrowX = winX + 14;
          const arrowY = itemY - 5;
          ctx.fillRect(arrowX, arrowY + 2, 8, 6);
          ctx.fillRect(arrowX + 8, arrowY, 4, 10);
          ctx.fillRect(arrowX + 12, arrowY + 2, 2, 6);
        }
      }
    }

    // "PRESS START" text at bottom
    if (selectedItem === -1) {
      const pressAlpha = Math.sin(frameCount * 0.08) * 0.4 + 0.6;
      ctx.globalAlpha = menuAlpha * pressAlpha;
      drawPixelText('▶ PRESS START', menuX, menuStartY + menuItems.length * menuSpacing + 16, 12, '#88aadd', 'center');
    }

    ctx.restore();
  }

  function drawParticles() {
    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
      p.vy += 0.1;
      if (p.life > 0) {
        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.life / p.maxLife})`;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      }
    });
    // Remove dead particles
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
        vy: (Math.random() - 0.5) * 3 - 1,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        size: Math.random() * 3 + 2,
        r: Math.random() > 0.5 ? 255 : 100,
        g: Math.random() > 0.5 ? 255 : 200,
        b: 50 + Math.floor(Math.random() * 200)
      });
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
        // Fade in from black over 90 frames (1.5 sec)
        fadeAlpha = Math.max(0, 1.0 - phaseTimer / 90);
        if (phaseTimer > 100) {
          phase = 'charsEnter';
          phaseTimer = 0;
        }
        break;

      case 'charsEnter':
        // Characters walk in
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
        // Brief pause, characters face each other
        if (phaseTimer > 40) {
          phase = 'titleDrop';
          phaseTimer = 0;
          titleBounceVel = 0;
          titleBouncing = true;
        }
        break;

      case 'titleDrop':
        // Title drops from top with bounce
        if (titleBouncing) {
          titleBounceVel += 0.5;
          titleY += titleBounceVel;
          if (titleY >= titleTargetY) {
            titleY = titleTargetY;
            titleBounceVel = -titleBounceVel * 0.4;
            if (Math.abs(titleBounceVel) < 1) {
              titleBouncing = false;
              titleY = titleTargetY;
              // Spawn particles on landing
              spawnParticles(CW / 2, titleTargetY + 25, 20);
            }
          }
        }
        if (!titleBouncing && phaseTimer > 60) {
          phase = 'menuAppear';
          phaseTimer = 0;
        }
        break;

      case 'menuAppear':
        // Menu fades in
        menuAlpha = Math.min(1, phaseTimer / 40);
        cursorBlink++;
        if (phaseTimer > 120) {
          phase = 'cursorSelect';
          phaseTimer = 0;
        }
        break;

      case 'cursorSelect':
        // Cursor blinks then selects
        cursorBlink++;
        if (phaseTimer > 60) {
          phase = 'selectFlash';
          phaseTimer = 0;
          selectedItem = 0;
          selectFlashCount = 0;
        }
        break;

      case 'selectFlash':
        // Flash the selected item
        if (phaseTimer % 6 === 0) {
          selectFlashCount++;
        }
        if (selectFlashCount > 8) {
          // Spawn celebration particles
          spawnParticles(CW / 2, 130, 30);
          phase = 'fadeOut';
          phaseTimer = 0;
        }
        break;

      case 'fadeOut':
        // Fade to white
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
          menuAlpha = 0;
          selectedItem = -1;
          selectFlashCount = 0;
          cursorBlink = 0;
          particles.length = 0;
        }
        break;
    }
  }

  function draw() {
    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CW, CH);

    // Background
    drawBackground();

    // Characters
    const leftCharImg = animFrame === 0 ? images.left1 : images.left2;
    const rightCharImg = animFrame === 0 ? images.right1 : images.right2;

    // Characters face each other
    drawCharacter(leftCharImg, catX, groundY - leftCharHeight, leftCharHeight, false);
    drawCharacter(rightCharImg, mouseX, groundY - rightCharHeight, rightCharHeight, true);

    // Emotes when paused
    if (phase === 'charsPause') {
      // Exclamation marks
      const flashVisible = Math.floor(frameCount / 8) % 2 === 0;
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

    // Title logo
    if (phase !== 'blackScreen' && phase !== 'charsEnter') {
      drawTitleLogo();
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

    // Scanline effect (subtle CRT look)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
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
