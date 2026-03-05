(function () {
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  canvas.width = 480;
  canvas.height = 270;
  const CW = canvas.width, CH = canvas.height;

  /* ── images ── */
  const images = { l1: new Image(), l2: new Image(), r1: new Image(), r2: new Image() };
  Object.values(images).forEach(i => (i.crossOrigin = 'anonymous'));
  images.l1.src = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/88b01ae-6deb-2436-d70b-707f3b24a4df__1.png';
  images.l2.src = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/4d20d-dbcb-c1a-c0e0-ca740e55d8c0__2.png';
  images.r1.src = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/48c5787-6528-52cc-e7e5-300b1f0fb628__2026-01-29_18.44.19-removebg-preview_1_.png';
  images.r2.src = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/ac1ddf4-6f87-bdf0-7231-4de2b1de87f6__2026-01-29_18.42.51-removebg-preview_1_.png';

  let f = 0, animFrame = 0, stepTimer = 0;
  const particles = [];
  const gl = 210; // ground line
  const catH = 70, mouseH = 36;

  /* ── Audio ── */
  let audioCtx = null, bgmStarted = false, masterGain = null;
  const NF = {
    'C3':130.81,'D3':146.83,'E3':164.81,'F3':174.61,'G3':196,'A3':220,'B3':246.94,
    'C4':261.63,'D4':293.66,'E4':329.63,'F4':349.23,'G4':392,'A4':440,'B4':493.88,
    'C5':523.25,'D5':587.33,'E5':659.25,'F5':698.46,'G5':783.99,'A5':880,'B5':987.77,
    'C6':1046.5
  };
  function pn(freq,start,dur,type,vol){
    if(!audioCtx)return;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type;o.frequency.value=freq;
    g.gain.setValueAtTime(vol,start);g.gain.exponentialRampToValueAtTime(0.001,start+dur);
    o.connect(g);g.connect(masterGain);o.start(start);o.stop(start+dur+0.05);
  }
  function startBGM(){
    if(bgmStarted)return;bgmStarted=true;
    audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    masterGain=audioCtx.createGain();masterGain.gain.value=0.12;
    masterGain.connect(audioCtx.destination);
    schBGM(audioCtx.currentTime+0.1);
  }
  function schBGM(t0){
    const bpm=100,beat=60/bpm,bar=beat*4,bars=8;
    const mel=[
      [['C5',0,1],['E5',1,1],['G5',2,1],['E5',3,1]],
      [['F5',0,1],['A5',1,1],['G5',2,2]],
      [['E5',0,1],['D5',1,1],['C5',2,1],['E5',3,1]],
      [['D5',0,2],['C5',2,2]],
      [['C5',0,.5],['D5',.5,.5],['E5',1,1],['G5',2,1],['A5',3,1]],
      [['G5',0,1],['F5',1,1],['E5',2,1],['D5',3,1]],
      [['E5',0,1.5],['G5',2,1],['A5',3,1]],
      [['G5',0,2],['C5',2,2]],
    ];
    const bass=['C3','F3','G3','C3','A3','F3','C3','C3'];
    for(let b=0;b<bars;b++){
      const bs=t0+b*bar;
      if(mel[b])mel[b].forEach(([n,bo,d])=>pn(NF[n],bs+bo*beat,d*beat,'sine',0.18));
      const bf=NF[bass[b]];
      for(let bb=0;bb<4;bb++) pn(bf,bs+bb*beat,beat*0.8,'triangle',0.22);
      for(let a=0;a<8;a++) pn(bf*2*[1,1.2,1.5,1.2][a%4],bs+a*beat*0.5,beat*0.45,'sine',0.04);
    }
    const ld=bars*bar;
    setTimeout(()=>{if(audioCtx&&audioCtx.state==='running')schBGM(t0+ld);},(ld-1)*1000);
  }
  function initAudio(){startBGM();document.removeEventListener('click',initAudio);document.removeEventListener('touchstart',initAudio);}
  document.addEventListener('click',initAudio);
  document.addEventListener('touchstart',initAudio);
  setTimeout(()=>{try{startBGM();}catch(e){}},100);

  /* ── helpers ── */
  function px(text,x,y,size,color,align){
    ctx.font=size+'px "DotGothic16",sans-serif';
    ctx.textAlign=align||'center';ctx.textBaseline='middle';
    ctx.fillStyle='#000';
    for(let ox=-2;ox<=2;ox++)for(let oy=-2;oy<=2;oy++)if(ox||oy)ctx.fillText(text,x+ox,y+oy);
    ctx.fillStyle=color;ctx.fillText(text,x,y);
  }

  function drawChar(img,x,y,h,flip){
    if(!img.complete||!img.naturalWidth)return;
    const w=h*(img.width/img.height);
    ctx.save();ctx.translate(~~x,~~y);
    if(flip){ctx.translate(w,0);ctx.scale(-1,1);}
    ctx.drawImage(img,0,0,w,h);ctx.restore();
  }

  function spawnP(x,y,n,r,g,b,vy0){
    for(let i=0;i<n;i++)
      particles.push({x:x+Math.random()*20-10,y:y+Math.random()*10-5,
        vx:(Math.random()-0.5)*3,vy:(vy0||0)+(Math.random()-0.5)*2-1.5,
        life:40+Math.random()*30,ml:70,s:Math.random()*3+1.5,r,g,b});
  }

  /* ── Background ── */
  function drawBG(){
    // Warm cream gradient
    const sg=ctx.createLinearGradient(0,0,0,CH);
    sg.addColorStop(0,'#F5EDD0');sg.addColorStop(0.5,'#F0E8C0');sg.addColorStop(1,'#E8DFB0');
    ctx.fillStyle=sg;ctx.fillRect(0,0,CW,CH);

    // Far trees
    ctx.fillStyle='#5A8A3A';
    for(let i=0;i<24;i++){
      const tx=i*22-5+Math.sin(i*1.3)*8;
      const th=30+Math.sin(i*0.7)*10;
      ctx.beginPath();ctx.moveTo(tx,gl-th);ctx.lineTo(tx-8,gl);ctx.lineTo(tx+8,gl);ctx.closePath();ctx.fill();
    }
    // Near trees
    for(let i=0;i<16;i++){
      const tx=i*32+10+Math.sin(i*2.1)*12;
      const th=40+Math.sin(i*0.9)*12;
      ctx.fillStyle='#886644';ctx.fillRect(tx-2,gl-12,4,12);
      ctx.fillStyle='#6BA04A';
      ctx.beginPath();ctx.moveTo(tx,gl-th);ctx.lineTo(tx-12,gl-12);ctx.lineTo(tx+12,gl-12);ctx.closePath();ctx.fill();
      ctx.fillStyle='#5A9040';
      ctx.beginPath();ctx.moveTo(tx,gl-th+8);ctx.lineTo(tx-10,gl-8);ctx.lineTo(tx+10,gl-8);ctx.closePath();ctx.fill();
    }

    // Ground
    ctx.fillStyle='#C8D8A0';ctx.fillRect(0,gl,CW,CH-gl);
    ctx.fillStyle='#B0C890';ctx.fillRect(0,gl,CW,3);
  }

  /* ── Video card ── */
  function drawVideoCard(x,y,w,h,label,color1,color2){
    ctx.fillStyle='rgba(0,0,0,0.12)';ctx.fillRect(x+2,y+2,w,h);
    const cg=ctx.createLinearGradient(x,y,x,y+h);
    cg.addColorStop(0,color1);cg.addColorStop(1,color2);
    ctx.fillStyle=cg;ctx.fillRect(x,y,w,h);
    ctx.strokeStyle='rgba(255,255,255,0.25)';ctx.lineWidth=1;ctx.strokeRect(x+2,y+2,w-4,h-4);
    // Play button
    const pcx=x+w/2,pcy=y+h/2-5;
    ctx.fillStyle='rgba(255,255,255,0.8)';
    ctx.beginPath();ctx.moveTo(pcx-8,pcy-10);ctx.lineTo(pcx-8,pcy+10);ctx.lineTo(pcx+10,pcy);ctx.closePath();ctx.fill();
    // Label bar
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(x,y+h-18,w,18);
    ctx.fillStyle='#FFF';ctx.font='10px "DotGothic16",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(label,x+w/2,y+h-9);
    // Pulse border
    const pulse=Math.sin(f*0.06)*0.3+0.7;
    ctx.strokeStyle=`rgba(255,255,255,${pulse*0.5})`;ctx.lineWidth=2;
    ctx.strokeRect(x-1,y-1,w+2,h+2);
  }

  /* ── Main loop ── */
  function loop(){
    f++;stepTimer++;
    if(stepTimer>=10){stepTimer=0;animFrame=1-animFrame;}

    // Update particles
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;p.life--;
      if(p.life<=0)particles.splice(i,1);
    }

    // Spawn sparkles
    if(f%20===0)spawnP(CW/2+Math.random()*80-40,gl-60,2,255,215,0,-1);

    // ── Draw ──
    drawBG();

    // Characters in center-bottom
    const catX=CW/2-30, mouseX=CW/2+20;
    const catY=Math.abs(Math.sin(f*0.1))*8;
    const mouseY=Math.abs(Math.sin(f*0.1+1))*6;
    const lImg=animFrame===0?images.l1:images.l2;
    const rImg=animFrame===0?images.r1:images.r2;

    // Shadows
    ctx.fillStyle='rgba(0,0,0,0.12)';
    ctx.beginPath();ctx.ellipse(catX+catH*0.35,gl,catH*0.3,3,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(mouseX+mouseH*0.35,gl,mouseH*0.3,2,0,0,Math.PI*2);ctx.fill();

    drawChar(lImg,catX,gl-catH-catY,catH,false);
    drawChar(rImg,mouseX,gl-mouseH-mouseY,mouseH,true);

    // "チャンネル登録よろしくな！" - large, high-visibility banner
    const textAlpha=Math.min(1,f/60);
    ctx.save();ctx.globalAlpha=textAlpha;
    // Background banner
    const bannerY=gl+10, bannerH=42;
    const bannerGrad=ctx.createLinearGradient(0,bannerY,0,bannerY+bannerH);
    bannerGrad.addColorStop(0,'rgba(220,40,40,0.92)');bannerGrad.addColorStop(1,'rgba(180,20,20,0.92)');
    ctx.fillStyle=bannerGrad;
    ctx.fillRect(CW/2-180,bannerY,360,bannerH);
    // Banner border highlight
    ctx.strokeStyle='#FFD700';ctx.lineWidth=2;
    ctx.strokeRect(CW/2-180,bannerY,360,bannerH);
    // Pulsing glow
    const glowPulse=Math.sin(f*0.08)*0.4+0.6;
    ctx.shadowColor='#FFD700';ctx.shadowBlur=12*glowPulse;
    // Text
    ctx.font='bold 22px "DotGothic16",sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#000';
    for(let ox=-2;ox<=2;ox++)for(let oy=-2;oy<=2;oy++)if(ox||oy)ctx.fillText('チャンネル登録よろしくな！',CW/2+ox,bannerY+bannerH/2+oy);
    ctx.fillStyle='#FFFFFF';
    ctx.fillText('チャンネル登録よろしくな！',CW/2,bannerY+bannerH/2);
    ctx.shadowBlur=0;
    ctx.restore();

    // Video cards (top-left & top-right) - positioned clearly above characters
    const cardAlpha=Math.min(1,f/60);
    ctx.save();ctx.globalAlpha=cardAlpha;
    drawVideoCard(18, 15, 155, 88, 'おすすめ動画', '#8855CC', '#6633AA');
    drawVideoCard(CW-173, 15, 155, 88, 'おすすめ動画', '#DD6622', '#BB4400');
    ctx.restore();

    // Particles
    particles.forEach(p=>{
      ctx.fillStyle=`rgba(${p.r},${p.g},${p.b},${p.life/p.ml})`;
      ctx.fillRect(~~p.x,~~p.y,p.s,p.s);
    });

    // Scanlines
    ctx.fillStyle='rgba(0,0,0,0.04)';
    for(let y=0;y<CH;y+=3)ctx.fillRect(0,y,CW,1);

    requestAnimationFrame(loop);
  }
  loop();
})();
