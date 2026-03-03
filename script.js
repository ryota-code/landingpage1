(function() {
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  const messageInput = document.getElementById('messageInput');
  const timeButtons = document.querySelectorAll('#timeButtons button');

  canvas.width = 426;
  canvas.height = 240;

  const timePalettes = {
    dawn: {
      skyGradient: { top: '#AFEEEE', bottom: '#FFDAB9' },
      mountBack: '#6B8E23', mountFront: '#556B2F',
      groundBase: '#9ACD32', groundPattern: '#6B8E23', dirt: '#654321',
      isNight: false, sunX: 10, sunY: 175, sunColor: '#FF4500'
    },
    morning: {
      sky: '#87CEEB',
      mountBack: '#3CB371', mountFront: '#2E8B57',
      groundBase: '#7CFC00', groundPattern: '#32CD32', dirt: '#8B4513',
      isNight: false, sunX: 100, sunY: 60, sunColor: '#FFD700'
    },
    noon: {
      sky: '#00BFFF',
      mountBack: '#2E8B57', mountFront: '#006400',
      groundBase: '#32CD32', groundPattern: '#228B22', dirt: '#8B4513',
      isNight: false, sunX: 193, sunY: 20, sunColor: '#FFD700'
    },
    evening: {
      sky: '#FF7F50',
      mountBack: '#8B4513', mountFront: '#A0522D',
      groundBase: '#B8860B', groundPattern: '#DAA520', dirt: '#5C4033',
      isNight: false, sunX: 320, sunY: 170, sunColor: '#FF4500'
    },
    night: {
      sky: '#000033',
      mountBack: '#191970', mountFront: '#000080',
      groundBase: '#004d00', groundPattern: '#003300', dirt: '#1a1a1a',
      isNight: true, moonX: 340, moonY: 40
    }
  };

  let currentTime = 'morning';

  timeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      timeButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentTime = e.target.getAttribute('data-time');
    });
  });

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

  const moonCacheCanvas = document.createElement('canvas');
  let isMoonReady = false;
  const moonImageSize = 40;

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

  images.moonImage.onload = () => {
    moonCacheCanvas.width = moonImageSize;
    moonCacheCanvas.height = moonImageSize;
    const mCtx = moonCacheCanvas.getContext('2d');
    mCtx.drawImage(images.moonImage, 0, 0, images.moonImage.width, images.moonImage.height, 0, 0, moonImageSize, moonImageSize);
    isMoonReady = true;
  };

  images.left1.src = "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/88b01ae-6deb-2436-d70b-707f3b24a4df__1.png";
  images.left2.src = "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/4d20d-dbcb-c1a-c0e0-ca740e55d8c0__2.png";
  images.right1.src = "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/48c5787-6528-52cc-e7e5-300b1f0fb628__2026-01-29_18.44.19-removebg-preview_1_.png";
  images.right2.src = "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/ac1ddf4-6f87-bdf0-7231-4de2b1de87f6__2026-01-29_18.42.51-removebg-preview_1_.png";
  images.titleLogo.src = "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/5c026b3-ae8-2638-db00-64a27ba65088_ee9d6b42-5a8c-498b-ab9a-ace525915297.png";
  images.moonImage.src = "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/286e7fc-3008-ef3-fbe2-5efcd180e4d__.png";

  let frameCount = 0;
  let state = 'enter1';
  const START_CAT_X = -100;
  const START_MOUSE_X = canvas.width + 20;

  let catX = START_CAT_X;
  let mouseX = START_MOUSE_X;

  const catTargetX1 = 44, mouseTargetX1 = 302;
  const catTargetX2 = 108, mouseTargetX2 = 238;
  const groundY = 200;
  const leftCharHeight = 80;
  const rightCharHeight = 40;

  let animFrame = 0;
  let stepTimer = 0;
  let pauseTimer = 0;

  const clouds = [];
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: Math.random() * canvas.width,
      y: Math.random() * 50 + 10,
      width: Math.random() * 40 + 40,
      speed: Math.random() * 0.3 + 0.1,
      isCat: false
    });
  }
  clouds.push({ x: Math.random() * canvas.width, y: 25, width: 60, speed: 0.2, isCat: true });

  const logoCloud = { x: canvas.width + 10, y: 35, width: 0, speed: 0.2, scale: 0.7 };

  const stars = [
    { x: 50, y: 30 }, { x: 120, y: 80 }, { x: 200, y: 40 },
    { x: 280, y: 90 }, { x: 380, y: 60 }, { x: 400, y: 20 }
  ];

  // 向き合う時間を追加（約30フレーム＝0.5秒）
  const ADDED_STARE_PAUSE = 30;

  function drawCharacter(img, x, y, h, flipH) {
    if (!img.complete) return;
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

  function drawEmote(x, y, charH, type, shouldFlash) {
    if (shouldFlash && Math.floor(frameCount / 10) % 2 === 0) return;

    if (type === '!') {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(x + charH / 2 - 2, y - 16, 4, 10);
      ctx.fillRect(x + charH / 2 - 2, y - 4, 4, 4);
    } else if (type === 'sweat') {
      const sweatStartX = x + charH * 0.2;
      const sweatStartY = y - charH * 0.1;

      const currentPause = pauseTimer - ADDED_STARE_PAUSE;
      if (currentPause < 0) return;

      const dropPos1 = { x: sweatStartX, y: sweatStartY + currentPause * 0.8 };
      const dropPos2 = { x: sweatStartX - 5, y: sweatStartY + (currentPause - 8) * 0.8 + 10 };
      const dropPos3 = { x: sweatStartX + 5, y: sweatStartY + (currentPause - 16) * 0.8 + 20 };

      ctx.fillStyle = '#00BFFF';
      if (currentPause > 0 && currentPause < 50) ctx.fillRect(dropPos1.x, dropPos1.y, 4, 7);
      if (currentPause > 8 && currentPause < 60) ctx.fillRect(dropPos2.x, dropPos2.y, 4, 7);
      if (pauseTimer > 16 && currentPause < 70) ctx.fillRect(dropPos3.x, dropPos3.y, 4, 7);
    }
  }

  function update() {
    frameCount++;

    if (isLogoReady) {
      if (logoCloud.width === 0) {
        const aspect = tintedLogoCanvas.width / tintedLogoCanvas.height;
        logoCloud.width = (leftCharHeight + 60) / 2 * aspect * logoCloud.scale;
      }
      logoCloud.x -= logoCloud.speed;
      if (logoCloud.x + logoCloud.width < -10) logoCloud.x = canvas.width + 10;
    }

    clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x + c.width < -20) c.x = canvas.width + 20;
    });

    if (state === 'pause' || state === 'pause_mid' || state === 'stare') {
      pauseTimer++;
      let waitTime = 60;
      if (state === 'pause_mid') waitTime = 40;
      if (state === 'stare') waitTime = 50 + ADDED_STARE_PAUSE;

      if (pauseTimer > waitTime) {
        if (state === 'pause_mid') state = 'enter2';
        else if (state === 'pause') state = 'chase';
        else if (state === 'stare') state = 'runaway1';
        stepTimer = 0;
      }
      return;
    }

    let currentStepInterval = (state === 'chase') ? 12 : 8;
    stepTimer++;
    if (stepTimer >= currentStepInterval) {
      stepTimer = 0;
      animFrame = 1 - animFrame;

      if (state === 'enter1') {
        if (catX < catTargetX1) catX += 8;
        if (mouseX > mouseTargetX1) mouseX -= 8;
        if (catX >= catTargetX1 && mouseX <= mouseTargetX1) {
          catX = catTargetX1; mouseX = mouseTargetX1;
          state = 'pause_mid'; pauseTimer = 0; animFrame = 0;
        }
      } else if (state === 'enter2') {
        if (catX < catTargetX2) catX += 8;
        if (mouseX > mouseTargetX2) mouseX -= 8;
        if (catX >= catTargetX2 && mouseX <= mouseTargetX2) {
          catX = catTargetX2; mouseX = mouseTargetX2;
          state = 'pause'; pauseTimer = 0; animFrame = 0;
        }
      } else if (state === 'chase') {
        catX += 8; mouseX += 4;
        if (mouseX - catX < 70 || mouseX > 320) {
          state = 'stare'; pauseTimer = 0; animFrame = 0; stepTimer = 0;
        }
      } else if (state === 'runaway1') {
        catX += 14; mouseX += 14;
        if (catX > canvas.width + 100) {
          state = 'runaway2'; catX = -120; mouseX = -40; stepTimer = 0;
        }
      } else if (state === 'runaway2') {
        catX += 14; mouseX += 14;
        if (catX > canvas.width + 100) {
          state = 'enter1'; catX = START_CAT_X; mouseX = START_MOUSE_X; stepTimer = 0;
        }
      }
    }
  }

  function draw() {
    const palette = timePalettes[currentTime];

    // Sky
    if (currentTime === 'dawn') {
      const gradient = ctx.createLinearGradient(0, 0, 0, groundY);
      gradient.addColorStop(0, palette.skyGradient.top);
      gradient.addColorStop(1, palette.skyGradient.bottom);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = palette.sky;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Stars (night only)
    if (palette.isNight) {
      ctx.fillStyle = '#FFFFFF';
      stars.forEach(s => {
        if (Math.random() > 0.1) ctx.fillRect(s.x, s.y, 2, 2);
      });
    }

    // Sun / Moon
    if (palette.isNight && isMoonReady) {
      ctx.drawImage(moonCacheCanvas, palette.moonX, palette.moonY, moonImageSize, moonImageSize);
    } else if (!palette.isNight) {
      ctx.fillStyle = palette.sunColor;
      const sunBodySize = 40;
      ctx.fillRect(palette.sunX + (50 - sunBodySize) / 2, palette.sunY, sunBodySize, sunBodySize);
      ctx.fillRect(palette.sunX, palette.sunY + (sunBodySize - 10) / 2, 50, 10);
      ctx.fillRect(palette.sunX + (50 - 10) / 2, palette.sunY - (50 - sunBodySize) / 2, 10, 50);
    }

    // Clouds
    const cloudColor = palette.isNight ? '#888888' : '#FFFFFF';
    ctx.fillStyle = cloudColor;

    if (isLogoReady) {
      ctx.drawImage(tintedLogoCanvas, logoCloud.x, logoCloud.y, logoCloud.width, logoCloud.width / (tintedLogoCanvas.width / tintedLogoCanvas.height));
    }

    clouds.forEach(c => {
      if (c.isCat) {
        let cx = Math.floor(c.x);
        let cy = Math.floor(c.y);
        ctx.fillRect(cx, cy, 40, 16);
        ctx.fillRect(cx + 4, cy - 6, 32, 6);
        ctx.fillRect(cx + 6, cy - 12, 6, 6);
        ctx.fillRect(cx + 28, cy - 12, 6, 6);
        ctx.fillRect(cx + 40, cy + 4, 10, 6);
        ctx.fillRect(cx + 46, cy - 2, 6, 6);
      } else {
        ctx.fillRect(Math.floor(c.x), Math.floor(c.y), Math.floor(c.width), 16);
        ctx.fillRect(Math.floor(c.x) + 8, Math.floor(c.y) - 8, Math.floor(c.width) - 24, 8);
        ctx.fillRect(Math.floor(c.x) + 16, Math.floor(c.y) + 16, Math.floor(c.width) - 24, 8);
      }
    });

    // Ground
    ctx.fillStyle = palette.groundBase;
    ctx.fillRect(0, groundY - 5, canvas.width, canvas.height - (groundY - 5));
    ctx.fillStyle = palette.groundPattern;
    ctx.fillRect(0, groundY, canvas.width, 4);
    ctx.fillRect(0, groundY + 10, canvas.width, 2);
    ctx.fillStyle = palette.dirt;
    ctx.fillRect(0, groundY + 16, canvas.width, canvas.height - (groundY + 16));

    // Message window
    const winWidth = 280;
    const winHeight = 60;
    const winX = (canvas.width - winWidth) / 2;
    const winY = 20;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(winX, winY, winWidth, winHeight);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(winX + 2, winY + 2, winWidth - 4, winHeight - 4);
    ctx.lineWidth = 1;
    ctx.strokeRect(winX + 6, winY + 6, winWidth - 12, winHeight - 12);

    const customMessage = messageInput.value.trim();
    if (customMessage) {
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '22px "DotGothic16", sans-serif';
      ctx.fillText(customMessage, winX + winWidth / 2, winY + winHeight / 2 + 2, winWidth - 20);
    }

    // Characters
    const leftCharImg = animFrame === 0 ? images.left1 : images.left2;
    const rightCharImg = animFrame === 0 ? images.right1 : images.right2;
    drawCharacter(leftCharImg, catX, groundY - leftCharHeight, leftCharHeight, false);
    drawCharacter(rightCharImg, mouseX, groundY - rightCharHeight, rightCharHeight, !(state === 'runaway1' || state === 'runaway2'));

    // Emotes
    if (state === 'pause') {
      drawEmote(catX, groundY - leftCharHeight, leftCharHeight, '!', true);
      drawEmote(mouseX, groundY - rightCharHeight, rightCharHeight, '!', true);
    } else if (state === 'stare') {
      drawEmote(mouseX, groundY - rightCharHeight, rightCharHeight, 'sweat', false);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
