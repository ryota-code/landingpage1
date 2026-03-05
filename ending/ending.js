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

  /* Scene structure:
     1. sunset   (300f/5s) - Sunset battlefield → enemies appear as friends
     2. gather   (360f/6s) - Everyone gathers, holds hands, jumps with joy
     3. campfire (360f/6s) - Campfire scene, sitting together, stars
     4. dawn     (360f/6s) - Dawn breaks, new adventure begins
     5. credits  (300f/5s) - Credits / ending title
  */
  const SCENES = [
    { name: 'sunset',   dur: 300 },
    { name: 'gather',   dur: 360 },
    { name: 'campfire', dur: 360 },
    { name: 'dawn',     dur: 360 },
    { name: 'credits',  dur: 600 },
  ];
  let sceneIdx = 0;
  let sceneTimer = 0;
  let transAlpha = 0;
  let transColor = '#000';

  // Character positions
  let catX = 0, catY = 0, mouseX = 0, mouseY = 0;
  let catAngle = 0, mouseAngle = 0;
  // Named characters
  let rangeX = 0, rangeY = 0, rangeAngle = 0;
  let mentalX = 0, mentalY = 0, mentalAngle = 0;
  let trendX = 0, trendY = 0, trendAngle = 0;

  const particles = [];
  const fireParticles = [];
  const starField = [];
  // Pre-generate stars
  for (let i = 0; i < 60; i++) {
    starField.push({ x: Math.random()*CW, y: Math.random()*CH*0.5, s: Math.random()*2+1, sp: Math.random()*0.03+0.01 });
  }

  function resetScene() {
    catX = 60; catY = 0; mouseX = 120; mouseY = 0;
    catAngle = 0; mouseAngle = 0;
    rangeX = CW-120; rangeY = 0; rangeAngle = 0;
    mentalX = CW-80; mentalY = 0; mentalAngle = 0;
    trendX = CW-160; trendY = 0; trendAngle = 0;
    particles.length = 0;
    fireParticles.length = 0;
  }
  resetScene();

  /* ── Audio ── */
  let audioCtx = null, bgmStarted = false, masterGain = null;
  const NF = {
    'C3':130.81,'D3':146.83,'E3':164.81,'F3':174.61,'G3':196,'A3':220,'B3':246.94,
    'C4':261.63,'D4':293.66,'E4':329.63,'F4':349.23,'G4':392,'A4':440,'B4':493.88,
    'C5':523.25,'D5':587.33,'E5':659.25,'F5':698.46,'G5':783.99,'A5':880,'B5':987.77,
    'C6':1046.5,'D6':1174.66,'E6':1318.51
  };
  function playNote(freq,start,dur,type,vol){
    if(!audioCtx)return;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type;o.frequency.value=freq;
    g.gain.setValueAtTime(vol,start);g.gain.exponentialRampToValueAtTime(0.001,start+dur);
    o.connect(g);g.connect(masterGain);o.start(start);o.stop(start+dur+0.05);
  }
  function startBGM(){
    if(bgmStarted)return;bgmStarted=true;
    audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    masterGain=audioCtx.createGain();masterGain.gain.value=0.15;
    masterGain.connect(audioCtx.destination);
    scheduleEndingBGM(audioCtx.currentTime+0.1);
  }
  function scheduleEndingBGM(t0){
    const bpm=120,beat=60/bpm,bar=beat*4,bars=16;
    // Gentle, emotional ending melody
    const mel=[
      [['C5',0,1],['E5',1,1],['G5',2,1],['E5',3,1]],
      [['F5',0,1],['A5',1,1],['G5',2,2]],
      [['E5',0,1],['D5',1,1],['C5',2,1],['E5',3,1]],
      [['D5',0,2],['C5',2,2]],
      // Second phrase - warmer
      [['C5',0,.5],['D5',.5,.5],['E5',1,1],['G5',2,1],['A5',3,1]],
      [['G5',0,1],['F5',1,1],['E5',2,1],['D5',3,1]],
      [['E5',0,1.5],['G5',2,1],['A5',3,1]],
      [['G5',0,2],['E5',2,2]],
      // Third phrase - hopeful, ascending
      [['A5',0,1],['B5',1,1],['C6',2,2]],
      [['G5',0,1],['A5',1,1],['B5',2,1],['C6',3,1]],
      [['D6',0,1],['C6',1,1],['B5',2,1],['A5',3,1]],
      [['G5',0,2],['A5',2,2]],
      // Final phrase - triumphant resolution
      [['C6',0,1],['B5',1,.5],['A5',1.5,.5],['G5',2,1],['A5',3,1]],
      [['B5',0,1],['C6',1,1],['D6',2,2]],
      [['E6',0,1.5],['D6',2,.5],['C6',2.5,.5],['B5',3,1]],
      [['C6',0,4]],
    ];
    const bass=['C3','F3','G3','C3','A3','F3','C3','G3','A3','E3','F3','G3','A3','G3','F3','C3'];
    for(let b=0;b<bars;b++){
      const bs=t0+b*bar;
      if(mel[b])mel[b].forEach(([n,bo,d])=>playNote(NF[n],bs+bo*beat,d*beat,'sine',0.22));
      // Warm bass
      const bf=NF[bass[b]];
      for(let bb=0;bb<4;bb++) playNote(bf,bs+bb*beat,beat*0.8,'triangle',0.28);
      // Gentle arpeggio
      const ar=bf*2;
      for(let a=0;a<8;a++){
        playNote(ar*[1,1.2,1.5,1.2][a%4],bs+a*beat*0.5,beat*0.45,'sine',0.06);
      }
    }
    const ld=bars*bar;
    setTimeout(()=>{if(audioCtx&&audioCtx.state==='running')scheduleEndingBGM(t0+ld);},(ld-1)*1000);
  }
  function playSFX(type){
    if(!audioCtx)return;const t=audioCtx.currentTime;
    if(type==='chime'){
      [1,1.25,1.5,2,2.5].forEach((m,i)=>playNote(523*m,t+i*0.15,0.8,'sine',0.12));
    } else if(type==='sparkle'){
      [1,1.5,2].forEach((m,i)=>playNote(880*m,t+i*0.08,0.3,'sine',0.08));
    } else if(type==='horn'){
      playNote(NF['C5'],t,0.6,'sawtooth',0.1);
      playNote(NF['E5'],t+0.05,0.55,'sawtooth',0.08);
      playNote(NF['G5'],t+0.1,0.5,'sawtooth',0.08);
    }
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
  function drawChar(img,x,y,h,flip,angle){
    if(!img.complete||!img.naturalWidth)return;
    const w=h*(img.width/img.height);
    ctx.save();
    if(angle){ctx.translate(~~x+w/2,~~y+h);ctx.rotate(angle);ctx.translate(-w/2,-h);}
    else ctx.translate(~~x,~~y);
    if(flip){ctx.translate(w,0);ctx.scale(-1,1);}
    ctx.drawImage(img,0,0,w,h);ctx.restore();
  }
  function spawnP(x,y,n,r,g,b,vy0){
    for(let i=0;i<n;i++)
      particles.push({x:x+Math.random()*20-10,y:y+Math.random()*10-5,
        vx:(Math.random()-0.5)*3,vy:(vy0||0)+(Math.random()-0.5)*2-1.5,
        life:40+Math.random()*30,ml:70,s:Math.random()*3+1.5,r,g,b});
  }
  function updateParticles(){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;p.life--;if(p.life<=0)particles.splice(i,1);}}
  function drawParticles(){particles.forEach(p=>{ctx.fillStyle=`rgba(${p.r},${p.g},${p.b},${p.life/p.ml})`;ctx.fillRect(~~p.x,~~p.y,p.s,p.s);});}
  function drawShadow(x,gy,h){ctx.fillStyle='rgba(0,0,0,0.12)';ctx.beginPath();ctx.ellipse(x+h*0.35,gy,h*0.3,3,0,0,Math.PI*2);ctx.fill();}
  function drawHeart(x,y,s){ctx.fillRect(x-s,y,s,s);ctx.fillRect(x+1,y,s,s);ctx.fillRect(x-s-1,y-s+1,s,s);ctx.fillRect(x+2,y-s+1,s,s);ctx.fillRect(x-Math.floor(s/2),y+s,1,1);}

  /* ── Named character draw functions ── */

  // レンジ (now friendly)
  function drawRangeFriendly(x,y,angle){
    ctx.save();
    ctx.translate(~~x,~~y);
    if(angle){ctx.translate(0,-15);ctx.rotate(angle);ctx.translate(0,15);}
    // Body
    ctx.fillStyle='#AA6622';
    ctx.fillRect(-15,-25,30,32);
    // Friendly horizontal lines (green now = profitable range)
    ctx.fillStyle='#44CC44';
    ctx.fillRect(-13,-20,26,3);
    ctx.fillRect(-13,-12,26,3);
    ctx.fillRect(-13,-4,26,3);
    // Head
    ctx.fillStyle='#BB7733';
    ctx.fillRect(-12,-38,24,15);
    // Happy eyes (arched)
    ctx.fillStyle='#222';
    ctx.fillRect(-8,-33,5,2);
    ctx.fillRect(3,-33,5,2);
    ctx.fillRect(-9,-34,2,2);
    ctx.fillRect(7,-34,2,2);
    // Smile
    ctx.fillStyle='#CC6600';
    ctx.fillRect(-5,-25,10,2);
    ctx.fillRect(-6,-26,2,2);
    ctx.fillRect(4,-26,2,2);
    // Arms raised happily
    ctx.fillStyle='#AA6622';
    ctx.fillRect(-25,-20,10,5);
    ctx.fillRect(-27,-28,6,10);
    ctx.fillRect(15,-20,10,5);
    ctx.fillRect(21,-28,6,10);
    // Legs
    ctx.fillRect(-10,7,8,10);
    ctx.fillRect(2,7,8,10);
    // Label
    ctx.fillStyle='#88DD44';
    ctx.font='9px "DotGothic16",sans-serif';ctx.textAlign='center';
    ctx.fillText('レンジ',0,-44);
    ctx.restore();
  }

  // メンタル (now friendly - lighter, calmer form)
  function drawMentalFriendly(x,y,angle){
    ctx.save();
    ctx.translate(~~x,~~y);
    if(angle){ctx.translate(0,-20);ctx.rotate(angle);ctx.translate(0,20);}
    // Gentle aura
    ctx.save();ctx.globalAlpha=0.15+Math.sin(f*0.03)*0.05;
    const aura=ctx.createRadialGradient(0,-10,10,0,-10,50);
    aura.addColorStop(0,'rgba(150,100,255,0.3)');aura.addColorStop(1,'rgba(150,100,255,0)');
    ctx.fillStyle=aura;ctx.fillRect(-50,-55,100,100);
    ctx.restore();
    // Body (now lighter purple, more solid form)
    ctx.fillStyle='#5530AA';
    ctx.fillRect(-20,-25,40,45);
    ctx.fillRect(-15,-35,30,12);
    // Head (calmer)
    ctx.fillStyle='#6644BB';
    ctx.fillRect(-16,-50,32,28);
    // Friendly eyes (two, not three)
    ctx.fillStyle='#DDAAFF';
    ctx.fillRect(-10,-44,7,6);
    ctx.fillRect(3,-44,7,6);
    // Pupils
    ctx.fillStyle='#8855CC';
    ctx.fillRect(-8,-42,3,3);
    ctx.fillRect(5,-42,3,3);
    // Gentle smile
    ctx.fillStyle='#CC99FF';
    ctx.fillRect(-6,-34,12,2);
    ctx.fillRect(-7,-35,2,2);
    ctx.fillRect(5,-35,2,2);
    // Peaceful words floating
    ctx.save();ctx.globalAlpha=0.3+Math.sin(f*0.02)*0.1;
    ctx.fillStyle='#BB88FF';ctx.font='7px "DotGothic16",sans-serif';ctx.textAlign='center';
    const goodWords=['安心','自信','冷静','成長'];
    goodWords.forEach((w,i)=>{
      const wx=Math.sin(f*0.012+i*1.5)*35;
      const wy=Math.cos(f*0.015+i*1.2)*20-20;
      ctx.fillText(w,wx,wy);
    });
    ctx.restore();
    // Arms
    ctx.fillStyle='#5530AA';
    ctx.fillRect(-30,-15,10,5);
    ctx.fillRect(20,-15,10,5);
    // Legs (more defined now)
    ctx.fillRect(-14,20,10,12);
    ctx.fillRect(4,20,10,12);
    // Label
    ctx.fillStyle='#CC99FF';ctx.font='9px "DotGothic16",sans-serif';ctx.textAlign='center';
    ctx.fillText('メンタル',0,-58);
    ctx.restore();
  }

  // 強トレンド (angel ally)
  function drawTrendFriendly(x,y,angle){
    ctx.save();
    ctx.translate(~~x,~~y);
    if(angle){ctx.translate(0,-15);ctx.rotate(angle);ctx.translate(0,15);}
    const hover=Math.sin(f*0.04)*3;
    ctx.translate(0,hover);
    // Glow
    ctx.save();ctx.globalAlpha=0.2+Math.sin(f*0.03)*0.08;
    const glow=ctx.createRadialGradient(0,0,10,0,0,45);
    glow.addColorStop(0,'rgba(255,215,0,0.4)');glow.addColorStop(1,'rgba(255,215,0,0)');
    ctx.fillStyle=glow;ctx.fillRect(-45,-50,90,100);
    ctx.restore();
    // Wings
    const wf=Math.sin(f*0.06)*6;
    ctx.fillStyle='rgba(255,255,220,0.5)';
    ctx.fillRect(-38,-15+wf,16,28);
    ctx.fillRect(22,-15-wf,16,28);
    ctx.fillStyle='rgba(255,255,200,0.35)';
    ctx.fillRect(-34,-22+wf,10,16);
    ctx.fillRect(24,-22-wf,10,16);
    // Body
    ctx.fillStyle='#FFFDE8';
    ctx.fillRect(-10,-3,20,28);
    ctx.fillStyle='#FFD700';
    ctx.fillRect(-10,-3,20,2);
    ctx.fillRect(-10,23,20,2);
    // Head
    ctx.fillStyle='#FFEEDD';
    ctx.fillRect(-8,-18,16,16);
    // Eyes
    ctx.fillStyle='#4488FF';
    ctx.fillRect(-5,-13,3,3);
    ctx.fillRect(2,-13,3,3);
    // Smile
    ctx.fillStyle='#CC8866';
    ctx.fillRect(-3,-8,6,2);
    // Halo
    ctx.save();ctx.globalAlpha=0.7+Math.sin(f*0.05)*0.2;
    ctx.fillStyle='#FFD700';
    ctx.fillRect(-6,-23,12,2);ctx.fillRect(-8,-22,16,1);
    ctx.restore();
    // Up arrow
    ctx.fillStyle='#00CC44';
    ctx.fillRect(-1,7,2,10);ctx.fillRect(-4,9,3,3);ctx.fillRect(1,9,3,3);
    // Arms
    ctx.fillStyle='#FFFDE8';
    ctx.fillRect(-20,-3,10,4);
    ctx.fillRect(10,-3,10,4);
    // Label
    ctx.fillStyle='#FFD700';ctx.font='9px "DotGothic16",sans-serif';ctx.textAlign='center';
    ctx.fillText('強トレンド',0,-30);
    ctx.restore();
  }

  /* ── Backgrounds ── */
  function drawSunsetBG(gl){
    const sg=ctx.createLinearGradient(0,0,0,CH);
    sg.addColorStop(0,'#1a0533');
    sg.addColorStop(0.2,'#4a1566');
    sg.addColorStop(0.4,'#cc4400');
    sg.addColorStop(0.6,'#ff7722');
    sg.addColorStop(0.8,'#ffaa44');
    sg.addColorStop(1,'#332200');
    ctx.fillStyle=sg;ctx.fillRect(0,0,CW,CH);
    // Big sunset
    const sunY=gl-30+Math.sin(f*0.003)*5;
    const sg2=ctx.createRadialGradient(CW/2,sunY,30,CW/2,sunY,120);
    sg2.addColorStop(0,'rgba(255,200,50,0.8)');sg2.addColorStop(0.3,'rgba(255,120,20,0.4)');sg2.addColorStop(1,'rgba(255,50,0,0)');
    ctx.fillStyle=sg2;ctx.beginPath();ctx.arc(CW/2,sunY,120,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#FFCC44';ctx.beginPath();ctx.arc(CW/2,sunY,28,0,Math.PI*2);ctx.fill();
    // Silhouette hills
    ctx.fillStyle='#221100';
    for(let x=0;x<CW;x+=2){const h=Math.sin(x*0.015)*25+Math.sin(x*0.03+1)*15+40;ctx.fillRect(x,gl-h,2,h);}
    // Ground
    ctx.fillStyle='#1a1000';ctx.fillRect(0,gl,CW,CH-gl);
    // Warm light reflection on ground
    const rg=ctx.createLinearGradient(0,gl,0,CH);
    rg.addColorStop(0,'rgba(255,150,50,0.1)');rg.addColorStop(1,'rgba(255,100,20,0)');
    ctx.fillStyle=rg;ctx.fillRect(0,gl,CW,CH-gl);
  }

  function drawCampfireBG(gl){
    const sg=ctx.createLinearGradient(0,0,0,CH);
    sg.addColorStop(0,'#050520');sg.addColorStop(0.5,'#0a0a30');sg.addColorStop(1,'#0d0815');
    ctx.fillStyle=sg;ctx.fillRect(0,0,CW,CH);
    // Stars
    starField.forEach(s=>{
      const tw=Math.sin(f*s.sp+s.x)*0.5+0.5;
      ctx.fillStyle=`rgba(255,255,220,${tw*0.9})`;
      ctx.fillRect(~~s.x,~~s.y,~~s.s,~~s.s);
    });
    // Shooting star occasionally
    if(f%300<8){
      const sx=100+f%200,sy=20+f%40;
      ctx.strokeStyle=`rgba(255,255,200,${1-f%300/8})`;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx-30-f%300*4,sy+15+f%300*2);ctx.stroke();
    }
    // Ground
    ctx.fillStyle='#1a1508';ctx.fillRect(0,gl,CW,CH-gl);
    // Grass tufts
    ctx.fillStyle='#2a2510';
    for(let i=0;i<20;i++){const gx=i*25+10;ctx.fillRect(gx,gl-2,8,4);ctx.fillRect(gx+2,gl-5,4,4);}
    // Moon
    ctx.fillStyle='#EEEEDD';ctx.beginPath();ctx.arc(380,40,18,0,Math.PI*2);ctx.fill();
    const mg=ctx.createRadialGradient(380,40,15,380,40,40);
    mg.addColorStop(0,'rgba(238,238,200,0.2)');mg.addColorStop(1,'rgba(238,238,200,0)');
    ctx.fillStyle=mg;ctx.beginPath();ctx.arc(380,40,40,0,Math.PI*2);ctx.fill();
  }

  function drawCampfire(cx,cy){
    // Log
    ctx.fillStyle='#442200';
    ctx.fillRect(cx-15,cy+2,30,8);
    ctx.fillRect(cx-12,cy+8,24,5);
    ctx.fillStyle='#331800';
    ctx.fillRect(cx-18,cy+5,36,4);
    // Fire
    const ff=f*0.1;
    ctx.fillStyle='#FF4400';
    ctx.fillRect(cx-6+Math.sin(ff)*2,cy-12,4,14);
    ctx.fillRect(cx+2+Math.sin(ff+1)*2,cy-10,4,12);
    ctx.fillStyle='#FF8800';
    ctx.fillRect(cx-3+Math.sin(ff+0.5)*2,cy-18,3,10);
    ctx.fillRect(cx+1+Math.sin(ff+1.5)*2,cy-15,3,8);
    ctx.fillStyle='#FFCC00';
    ctx.fillRect(cx-2+Math.sin(ff+0.3)*1,cy-22,2,8);
    ctx.fillRect(cx+1+Math.sin(ff+1.2)*1,cy-20,2,6);
    // Warm light circle
    ctx.save();ctx.globalAlpha=0.08+Math.sin(f*0.05)*0.03;
    const fg=ctx.createRadialGradient(cx,cy-5,5,cx,cy-5,100);
    fg.addColorStop(0,'rgba(255,150,30,0.3)');fg.addColorStop(1,'rgba(255,100,0,0)');
    ctx.fillStyle=fg;ctx.beginPath();ctx.arc(cx,cy-5,100,0,Math.PI*2);ctx.fill();
    ctx.restore();
    // Sparks
    if(f%8===0) fireParticles.push({x:cx+Math.random()*10-5,y:cy-15,vx:(Math.random()-0.5)*1.5,vy:-1-Math.random()*2,life:25+Math.random()*15,ml:40});
    for(let i=fireParticles.length-1;i>=0;i--){
      const p=fireParticles[i];p.x+=p.vx;p.y+=p.vy;p.vx*=0.98;p.life--;
      if(p.life<=0){fireParticles.splice(i,1);continue;}
      const a=p.life/p.ml;
      ctx.fillStyle=`rgba(255,${~~(200*a)},50,${a})`;ctx.fillRect(~~p.x,~~p.y,2,2);
    }
  }

  function drawDawnBG(gl,progress){
    // Sky transitions from dark to bright
    const sg=ctx.createLinearGradient(0,0,0,CH);
    const p=Math.min(1,progress);
    // Dark → bright
    const r1=5+p*70,g1=5+p*100,b1=30+p*180;
    const r2=10+p*200,g2=80+p*120,b2=20+p*80;
    sg.addColorStop(0,`rgb(${~~r1},${~~g1},${~~b1})`);
    sg.addColorStop(0.4,`rgb(${~~(r1*1.5)},${~~(g1*1.3)},${~~(b1*0.9)})`);
    sg.addColorStop(0.7,`rgb(${~~r2},${~~g2},${~~b2})`);
    sg.addColorStop(1,`rgb(${~~(r2*0.3)},${~~(g2*0.3)},${~~(b2*0.3)})`);
    ctx.fillStyle=sg;ctx.fillRect(0,0,CW,CH);
    // Rising sun
    const sunY=gl-20+60*(1-p);
    const sunR=20+p*15;
    if(p>0.2){
      const sg2=ctx.createRadialGradient(CW*0.7,sunY,sunR*0.5,CW*0.7,sunY,sunR*4);
      sg2.addColorStop(0,`rgba(255,220,100,${p*0.6})`);sg2.addColorStop(1,'rgba(255,200,50,0)');
      ctx.fillStyle=sg2;ctx.beginPath();ctx.arc(CW*0.7,sunY,sunR*4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=`rgba(255,240,180,${p})`;ctx.beginPath();ctx.arc(CW*0.7,sunY,sunR,0,Math.PI*2);ctx.fill();
    }
    // Stars fade as dawn breaks
    if(p<0.6){
      starField.forEach(s=>{
        const tw=Math.sin(f*s.sp+s.x)*0.3+0.3;
        ctx.fillStyle=`rgba(255,255,220,${tw*(1-p/0.6)*0.7})`;
        ctx.fillRect(~~s.x,~~s.y,~~s.s,~~s.s);
      });
    }
    // Hills with dawn light
    const hillColor=`rgb(${~~(20+p*40)},${~~(40+p*80)},${~~(15+p*30)})`;
    ctx.fillStyle=hillColor;
    for(let x=0;x<CW;x+=2){const h=Math.sin(x*0.012+1)*22+Math.sin(x*0.025)*14+45;ctx.fillRect(x,gl-h,2,h);}
    // Ground
    ctx.fillStyle=`rgb(${~~(20+p*60)},${~~(50+p*100)},${~~(15+p*40)})`;
    ctx.fillRect(0,gl,CW,CH-gl);
    // Road leading to horizon
    if(p>0.4){
      ctx.save();ctx.globalAlpha=p-0.4;
      ctx.fillStyle='#C4A46C';ctx.beginPath();
      ctx.moveTo(CW/2-40,CH);ctx.lineTo(CW/2+40,CH);ctx.lineTo(CW/2+8,gl);ctx.lineTo(CW/2-8,gl);ctx.closePath();ctx.fill();
      ctx.restore();
    }
  }

  /* ── Holding hands effect (connecting line between characters) ── */
  function drawHandLink(x1,y1,x2,y2,color){
    ctx.strokeStyle=color;ctx.lineWidth=2;
    ctx.beginPath();
    const mx=(x1+x2)/2, my=Math.min(y1,y2)-5;
    ctx.moveTo(x1,y1);ctx.quadraticCurveTo(mx,my,x2,y2);ctx.stroke();
    // Small sparkle at midpoint
    if(f%12<6){
      ctx.fillStyle=color;
      ctx.fillRect(~~mx-1,~~my-1,3,3);
    }
  }

  /* ── UPDATE ── */
  function update(){
    f++;sceneTimer++;stepTimer++;
    if(stepTimer>=10){stepTimer=0;animFrame=1-animFrame;}

    const scene=SCENES[sceneIdx];
    const dur=scene.dur;

    if(sceneTimer<30)transAlpha=1-sceneTimer/30;
    else if(sceneTimer>dur-30)transAlpha=(sceneTimer-(dur-30))/30;
    else transAlpha=0;

    if(sceneTimer>=dur){
      sceneIdx=(sceneIdx+1)%SCENES.length;
      sceneTimer=0;resetScene();
      transColor=(SCENES[sceneIdx].name==='campfire'||SCENES[sceneIdx].name==='dawn')?'#000':'#000';
    }
    updateParticles();

    const name=SCENES[sceneIdx].name;
    const t=sceneTimer;
    const gl=210;

    /* sunset: heroes stand → enemies approach as friends */
    if(name==='sunset'){
      // Heroes stand looking at sunset
      catX=120;mouseX=170;
      catY=Math.sin(f*0.05)*2;mouseY=Math.sin(f*0.05+0.5)*2;

      if(t<80){
        // Standing peacefully
        catAngle=0;mouseAngle=0;
      } else if(t<150){
        // Turn around - enemies approach from right
        rangeX=CW+20-(t-80)*2.5;
        mentalX=CW+60-(t-80)*2.3;
        trendX=CW+100-(t-80)*2.8;
        rangeY=Math.abs(Math.sin(t*0.12))*4;
        mentalY=Math.abs(Math.sin(t*0.12+1))*3;
        trendY=Math.sin(t*0.05)*5;
        // Cat and mouse notice, turn
        if(t>100){catAngle=0.1;mouseAngle=0.08;}
        if(t===105)playSFX('sparkle');
      } else if(t<220){
        // All standing together, looking at each other
        rangeX=260;mentalX=310;trendX=360;
        rangeY=Math.abs(Math.sin(t*0.08))*3;
        mentalY=Math.abs(Math.sin(t*0.08+1))*2;
        trendY=Math.sin(t*0.05)*4;
        catAngle=Math.sin(t*0.06)*0.05;
        mouseAngle=Math.sin(t*0.06+0.5)*0.04;
        // Nod animation
        if(t>170&&t<190){
          catY=Math.abs(Math.sin((t-170)*0.3))*6;
          rangeY=Math.abs(Math.sin((t-175)*0.3))*5;
        }
      } else {
        // Joy! Everyone bounces
        rangeX=260;mentalX=310;trendX=360;
        catY=Math.abs(Math.sin(t*0.15))*8;
        mouseY=Math.abs(Math.sin(t*0.15+1))*6;
        rangeY=Math.abs(Math.sin(t*0.15+2))*7;
        mentalY=Math.abs(Math.sin(t*0.15+3))*5;
        trendY=Math.sin(t*0.08)*6;
        catAngle=Math.sin(t*0.12)*0.1;
        if(t%15===0)spawnP(CW/2,gl-40,4,255,215,0,-1);
      }
    }

    /* gather: circle up, hold hands, big jump */
    else if(name==='gather'){
      const cx=CW/2,baseY=gl;
      if(t<80){
        // Move into circle formation
        const p=t/80;
        catX=lerp(120,cx-80,p);mouseX=lerp(170,cx-30,p);
        rangeX=lerp(260,cx+20,p);mentalX=lerp(310,cx+70,p);
        trendX=lerp(360,cx+120,p);
        catY=Math.abs(Math.sin(t*0.12))*4;mouseY=Math.abs(Math.sin(t*0.12+1))*3;
        rangeY=Math.abs(Math.sin(t*0.12+2))*4;mentalY=Math.abs(Math.sin(t*0.12+3))*3;
        trendY=Math.sin(t*0.06)*4;
      } else if(t<160){
        // In formation, gentle sway together
        catX=cx-80;mouseX=cx-30;rangeX=cx+20;mentalX=cx+70;trendX=cx+120;
        const sw=Math.sin(t*0.04)*3;
        catY=sw;mouseY=sw;rangeY=sw;mentalY=sw;trendY=sw+Math.sin(t*0.05)*2;
        catAngle=Math.sin(t*0.06)*0.05;mouseAngle=Math.sin(t*0.06+0.5)*0.04;
        rangeAngle=Math.sin(t*0.06+1)*0.05;mentalAngle=Math.sin(t*0.06+1.5)*0.04;
        if(t===100)playSFX('chime');
      } else if(t<240){
        // Big synchronized jump!
        catX=cx-80;mouseX=cx-30;rangeX=cx+20;mentalX=cx+70;trendX=cx+120;
        const jt=t-160;
        const jumpCycle=jt%40;
        let jy=0;
        if(jumpCycle<20) jy=Math.sin(jumpCycle/20*Math.PI)*25;
        catY=jy;mouseY=jy;rangeY=jy;mentalY=jy;trendY=jy+Math.sin(t*0.06)*3;
        // Arms up at jump peak
        if(jumpCycle>5&&jumpCycle<15){
          catAngle=0.15;mouseAngle=-0.12;rangeAngle=0.1;mentalAngle=-0.1;
        } else {
          catAngle=0;mouseAngle=0;rangeAngle=0;mentalAngle=0;
        }
        if(jumpCycle===18)spawnP(cx,baseY,8,255,220,100,-2);
        if(jumpCycle===1&&jt>0)spawnP(cx,baseY,6,200,200,255,-1);
      } else {
        // Celebration dance
        catX=cx-80+Math.sin(t*0.03)*10;mouseX=cx-30+Math.sin(t*0.03+1)*8;
        rangeX=cx+20+Math.sin(t*0.03+2)*10;mentalX=cx+70+Math.sin(t*0.03+3)*8;
        trendX=cx+120+Math.sin(t*0.03+4)*6;
        catY=Math.abs(Math.sin(t*0.18))*10;mouseY=Math.abs(Math.sin(t*0.18+1))*8;
        rangeY=Math.abs(Math.sin(t*0.18+2))*9;mentalY=Math.abs(Math.sin(t*0.18+3))*7;
        trendY=Math.sin(t*0.08)*6+Math.abs(Math.sin(t*0.16))*5;
        catAngle=Math.sin(t*0.12)*0.15;mouseAngle=-Math.sin(t*0.1)*0.12;
        rangeAngle=Math.sin(t*0.11)*0.13;mentalAngle=-Math.sin(t*0.1)*0.1;
        if(t%6===0)spawnP(cx+Math.random()*200-100,gl-60,2,255,Math.floor(150+Math.random()*100),100,-1);
      }
    }

    /* campfire: sitting around fire, peaceful */
    else if(name==='campfire'){
      const cx=CW/2;
      // Everyone sitting around campfire
      catX=cx-100;mouseX=cx-55;rangeX=cx+45;mentalX=cx+90;trendX=cx+135;
      if(t<60){
        // Settle in
        catY=Math.abs(Math.sin(t*0.08))*3;mouseY=Math.abs(Math.sin(t*0.08+1))*2;
        rangeY=Math.abs(Math.sin(t*0.08+2))*3;mentalY=Math.abs(Math.sin(t*0.08+3))*2;
        trendY=Math.sin(t*0.05)*4;
      } else if(t<200){
        // Peaceful swaying, watching fire
        const sw=Math.sin(t*0.03)*2;
        catY=sw+1;mouseY=sw+1;rangeY=sw;mentalY=sw;trendY=sw+Math.sin(t*0.04)*2;
        catAngle=Math.sin(t*0.04)*0.03;mouseAngle=Math.sin(t*0.04+0.5)*0.02;
        rangeAngle=Math.sin(t*0.04+1)*0.03;mentalAngle=Math.sin(t*0.04+1.5)*0.02;
        // Occasional nod
        if(t%80>70){
          catAngle+=Math.sin((t%80-70)*0.5)*0.08;
        }
        if((t+40)%80>70){
          rangeAngle+=Math.sin(((t+40)%80-70)*0.5)*0.08;
        }
      } else {
        // Look up at stars together
        catY=Math.sin(t*0.03)*2;mouseY=Math.sin(t*0.03+0.5)*2;
        rangeY=Math.sin(t*0.03+1)*2;mentalY=Math.sin(t*0.03+1.5)*2;
        trendY=Math.sin(t*0.04)*3;
        catAngle=-0.05;mouseAngle=-0.04;rangeAngle=-0.05;mentalAngle=-0.04;
        if(t%20===0)spawnP(Math.random()*CW,10,1,255,255,200,-0.5);
      }
    }

    /* dawn: new adventure begins */
    else if(name==='dawn'){
      const cx=CW/2;
      if(t<80){
        // Standing in a line, facing dawn
        catX=cx-80;mouseX=cx-30;rangeX=cx+20;mentalX=cx+70;trendX=cx+120;
        catY=Math.sin(t*0.05)*2;mouseY=Math.sin(t*0.05+0.5)*2;
        rangeY=Math.sin(t*0.05+1)*2;mentalY=Math.sin(t*0.05+1.5)*2;
        trendY=Math.sin(t*0.04)*3;
      } else if(t<160){
        // Look at each other, nod
        catX=cx-80;mouseX=cx-30;rangeX=cx+20;mentalX=cx+70;trendX=cx+120;
        catY=Math.abs(Math.sin(t*0.1))*4;mouseY=Math.abs(Math.sin(t*0.1+1))*3;
        rangeY=Math.abs(Math.sin(t*0.1+2))*4;mentalY=Math.abs(Math.sin(t*0.1+3))*3;
        trendY=Math.sin(t*0.06)*4;
        catAngle=Math.sin(t*0.08)*0.08;mouseAngle=-Math.sin(t*0.08)*0.06;
        if(t===120)playSFX('horn');
      } else if(t<280){
        // Start walking toward horizon (into the new adventure)
        const wt=t-160;
        const speed=0.5+wt*0.005;
        catX=cx-80+wt*speed;mouseX=cx-30+wt*speed;
        rangeX=cx+20+wt*speed*0.9;mentalX=cx+70+wt*speed*0.85;
        trendX=cx+120+wt*speed*0.8;
        catY=Math.abs(Math.sin(wt*0.15))*6;mouseY=Math.abs(Math.sin(wt*0.15+1))*4;
        rangeY=Math.abs(Math.sin(wt*0.15+2))*5;mentalY=Math.abs(Math.sin(wt*0.15+3))*4;
        trendY=Math.sin(wt*0.08)*5+Math.abs(Math.sin(wt*0.12))*3;
        catAngle=Math.sin(wt*0.12)*0.08;mouseAngle=Math.sin(wt*0.12+0.5)*0.06;
        rangeAngle=Math.sin(wt*0.12+1)*0.07;mentalAngle=Math.sin(wt*0.12+1.5)*0.06;
        if(wt%10===0)spawnP(catX+10,gl,2,180,160,120);
      } else {
        // Walking off into distance (shrinking)
        const wt=t-280;
        catX=CW/2+wt*0.5;mouseX=catX+15;rangeX=catX+5;mentalX=catX+20;trendX=catX+10;
        catY=Math.abs(Math.sin(wt*0.2))*3;mouseY=Math.abs(Math.sin(wt*0.2+1))*2;
        rangeY=Math.abs(Math.sin(wt*0.2+2))*3;mentalY=Math.abs(Math.sin(wt*0.2+3))*2;
        trendY=Math.sin(wt*0.1)*3;
      }
    }

    /* credits - YouTube end screen style */
    else if(name==='credits'){
      // Cat in center bottom, bouncing happily
      catX=CW/2-30;mouseX=CW/2+20;
      catY=Math.abs(Math.sin(t*0.1))*8;mouseY=Math.abs(Math.sin(t*0.1+1))*6;
      catAngle=Math.sin(t*0.06)*0.08;mouseAngle=-Math.sin(t*0.06)*0.06;
      // No other characters in this scene (clean end screen)
      rangeX=-999;mentalX=-999;trendX=-999;
      if(t%15===0)spawnP(CW/2+Math.random()*60-30,gl-50,2,255,215,0,-1);
    }
  }

  function lerp(a,b,t){return a+(b-a)*Math.max(0,Math.min(1,t));}

  /* ── DRAW ── */
  function draw(){
    ctx.fillStyle='#000';ctx.fillRect(0,0,CW,CH);

    const name=SCENES[sceneIdx].name;
    const gl=210;
    const t=sceneTimer;
    const catH2=70,mouseH2=36;
    const lImg=animFrame===0?images.l1:images.l2;
    const rImg=animFrame===0?images.r1:images.r2;

    /* sunset */
    if(name==='sunset'){
      drawSunsetBG(gl);
      drawSceneTitle('すべての たたかいの あと...','#FFCC66');

      // Draw all characters
      drawShadow(catX,gl,catH2);drawShadow(mouseX,gl,mouseH2);
      drawChar(lImg,catX,gl-catH2-Math.max(0,catY),catH2,false,catAngle);
      drawChar(rImg,mouseX,gl-mouseH2-Math.max(0,mouseY),mouseH2,true,mouseAngle);

      if(t>80){
        drawRangeFriendly(rangeX,gl-Math.max(0,rangeY),rangeAngle);
        drawMentalFriendly(mentalX,gl-Math.max(0,mentalY),mentalAngle);
        drawTrendFriendly(trendX,gl-Math.max(0,trendY)-15,trendAngle);
      }

      // Reconciliation text
      if(t>150&&t<220){
        ctx.save();ctx.globalAlpha=Math.min(1,(t-150)/20)*(t<200?1:(220-t)/20);
        px('みんな なかまだ！',CW/2,30,16,'#FFD700');
        ctx.restore();
      }
      // Hearts when joyful
      if(t>220){
        ctx.fillStyle='#FF69B4';
        for(let i=0;i<4;i++){
          const hx=100+i*90+Math.sin(f*0.02+i*1.5)*15;
          const hy=180-(f*0.4+i*40)%180;
          ctx.save();ctx.globalAlpha=(hy<20?hy/20:1)*0.6;
          drawHeart(hx,hy,4);ctx.restore();
        }
      }
    }

    /* gather */
    else if(name==='gather'){
      drawSunsetBG(gl);
      drawSceneTitle('ちからを あわせて','#FFD700');

      // Hand links when in formation
      if(t>80){
        const baseHandY=gl-15;
        drawHandLink(catX+45,baseHandY-Math.max(0,catY),mouseX+5,baseHandY-Math.max(0,mouseY),'rgba(255,215,0,0.5)');
        drawHandLink(mouseX+25,baseHandY-Math.max(0,mouseY),rangeX-5,baseHandY-Math.max(0,rangeY),'rgba(255,215,0,0.5)');
        drawHandLink(rangeX+15,baseHandY-Math.max(0,rangeY),mentalX-10,baseHandY-Math.max(0,mentalY),'rgba(200,150,255,0.5)');
        drawHandLink(mentalX+15,baseHandY-Math.max(0,mentalY),trendX-10,baseHandY-Math.max(0,trendY)-15,'rgba(255,220,100,0.5)');
      }

      drawShadow(catX,gl,catH2);drawShadow(mouseX,gl,mouseH2);
      drawChar(lImg,catX,gl-catH2-Math.max(0,catY),catH2,false,catAngle);
      drawChar(rImg,mouseX,gl-mouseH2-Math.max(0,mouseY),mouseH2,true,mouseAngle);
      drawRangeFriendly(rangeX,gl-Math.max(0,rangeY),rangeAngle);
      drawMentalFriendly(mentalX,gl-Math.max(0,mentalY),mentalAngle);
      drawTrendFriendly(trendX,gl-Math.max(0,trendY)-15,trendAngle);

      // Big text during jump
      if(t>160&&t<240){
        ctx.save();
        ctx.globalAlpha=0.5+Math.sin(f*0.08)*0.3;
        px('やったー！！',CW/2,50,28,'#FFD700');
        ctx.restore();
      }
    }

    /* campfire */
    else if(name==='campfire'){
      drawCampfireBG(gl);
      drawCampfire(CW/2,gl-5);

      if(t<90){
        drawSceneTitle('たき火を かこんで','#FFAA44');
      }

      // Characters around fire
      drawShadow(catX,gl,catH2);drawShadow(mouseX,gl,mouseH2);
      // Left side characters face right
      drawChar(lImg,catX,gl-catH2-Math.max(0,catY),catH2,false,catAngle);
      drawChar(rImg,mouseX,gl-mouseH2-Math.max(0,mouseY),mouseH2,false,mouseAngle);
      // Right side characters face left
      drawRangeFriendly(rangeX,gl-Math.max(0,rangeY),rangeAngle);
      drawMentalFriendly(mentalX,gl-Math.max(0,mentalY),mentalAngle);
      drawTrendFriendly(trendX,gl-Math.max(0,trendY)-15,trendAngle);

      // Warm glow on everyone
      ctx.save();ctx.globalAlpha=0.05+Math.sin(f*0.04)*0.02;
      ctx.fillStyle='#FF8800';ctx.fillRect(0,0,CW,CH);
      ctx.restore();

      // Story text
      if(t>100&&t<200){
        ctx.save();ctx.globalAlpha=Math.min(1,(t-100)/30)*(t<180?1:(200-t)/20);
        px('おもいでを かたりあう...',CW/2,25,13,'#FFCC88');
        ctx.restore();
      }
      if(t>220&&t<320){
        ctx.save();ctx.globalAlpha=Math.min(1,(t-220)/30)*(t<300?1:(320-t)/20);
        px('この なかまと なら...',CW/2,25,13,'#FFEEBB');
        ctx.restore();
      }
    }

    /* dawn */
    else if(name==='dawn'){
      const dawnProgress=t/360;
      drawDawnBG(gl,dawnProgress);

      if(t<90){
        drawSceneTitle('あたらしい よあけ','#FFCC88');
      }

      // Scale shrinks as they walk into distance
      let scale=1;
      if(t>280) scale=Math.max(0.3,1-(t-280)/120);

      const ch2=catH2*scale,mh2=mouseH2*scale;

      if(scale>0.3){
        drawShadow(catX,gl,ch2);drawShadow(mouseX,gl,mh2);
        drawChar(lImg,catX,gl-ch2-Math.max(0,catY)*scale,ch2,false,catAngle);
        drawChar(rImg,mouseX,gl-mh2-Math.max(0,mouseY)*scale,mh2,true,mouseAngle);
        // Allies walking too
        ctx.save();ctx.scale(scale,scale);ctx.translate((1-scale)*CW/2/scale,(1-scale)*gl/scale);
        drawRangeFriendly(rangeX/scale,gl/scale-Math.max(0,rangeY),rangeAngle);
        drawMentalFriendly(mentalX/scale,gl/scale-Math.max(0,mentalY),mentalAngle);
        drawTrendFriendly(trendX/scale,(gl-15)/scale-Math.max(0,trendY),trendAngle);
        ctx.restore();
      }

      // "New adventure" text
      if(t>160&&t<280){
        ctx.save();ctx.globalAlpha=Math.min(1,(t-160)/40)*(t<260?1:(280-t)/20);
        px('そして あらたな ぼうけんへ...',CW/2,35,16,'#FFD700');
        ctx.restore();
      }
      if(t>300){
        ctx.save();ctx.globalAlpha=Math.min(1,(t-300)/30);
        px('To Be Continued...',CW/2,CH/2-10,20,'#FFFFFF');
        ctx.restore();
      }
    }

    /* credits - YouTube end screen style */
    else if(name==='credits'){
      // Warm cream/yellow background like the screenshot
      const sg=ctx.createLinearGradient(0,0,0,CH);
      sg.addColorStop(0,'#F5EDD0');sg.addColorStop(0.5,'#F0E8C0');sg.addColorStop(1,'#E8DFB0');
      ctx.fillStyle=sg;ctx.fillRect(0,0,CW,CH);

      // Trees background (like the screenshot)
      drawEndScreenTrees(gl);

      // Ground
      ctx.fillStyle='#C8D8A0';ctx.fillRect(0,gl,CW,CH-gl);
      ctx.fillStyle='#B0C890';ctx.fillRect(0,gl,CW,3);

      // Small animals on the ground
      drawEndScreenAnimals(gl);

      // Characters in center
      const allGl=gl;
      drawShadow(catX,allGl,catH2);drawShadow(mouseX,allGl,mouseH2);
      drawChar(lImg,catX,allGl-catH2-Math.max(0,catY),catH2,false,catAngle);
      drawChar(rImg,mouseX,allGl-mouseH2-Math.max(0,mouseY),mouseH2,true,mouseAngle);

      // "チャンネル登録よろしくな！" text in center
      if(t>20){
        ctx.save();ctx.globalAlpha=Math.min(1,(t-20)/30);
        px('チャンネル登録',CW/2,gl-catH2-30,18,'#2D7D2D');
        px('よろしくな！',CW/2,gl-catH2-10,18,'#2D7D2D');
        ctx.restore();
      }

      // Video recommendation cards (YouTube end screen style)
      if(t>40){
        const cardAlpha=Math.min(1,(t-40)/30);
        ctx.save();ctx.globalAlpha=cardAlpha;

        // Left card - video recommendation
        drawVideoCard(18, 22, 160, 90, 'おすすめ動画', '#8855CC', '#6633AA');

        // Right card - video recommendation / playlist
        drawVideoCard(CW-178, 22, 160, 90, 'おすすめ動画', '#DD6622', '#BB4400');

        ctx.restore();
      }
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

  /* ── End screen helpers ── */
  function drawEndScreenTrees(gl){
    // Far trees (dark green, small)
    ctx.fillStyle='#5A8A3A';
    for(let i=0;i<24;i++){
      const tx=i*22-5+Math.sin(i*1.3)*8;
      const th=30+Math.sin(i*0.7)*10;
      // Triangle tree
      ctx.beginPath();ctx.moveTo(tx,gl-th);ctx.lineTo(tx-8,gl);ctx.lineTo(tx+8,gl);ctx.closePath();ctx.fill();
    }
    // Near trees (lighter, bigger)
    ctx.fillStyle='#6BA04A';
    for(let i=0;i<16;i++){
      const tx=i*32+10+Math.sin(i*2.1)*12;
      const th=40+Math.sin(i*0.9)*12;
      // Trunk
      ctx.fillStyle='#886644';ctx.fillRect(tx-2,gl-12,4,12);
      // Leaves (layered triangles)
      ctx.fillStyle='#6BA04A';
      ctx.beginPath();ctx.moveTo(tx,gl-th);ctx.lineTo(tx-12,gl-12);ctx.lineTo(tx+12,gl-12);ctx.closePath();ctx.fill();
      ctx.fillStyle='#5A9040';
      ctx.beginPath();ctx.moveTo(tx,gl-th+8);ctx.lineTo(tx-10,gl-8);ctx.lineTo(tx+10,gl-8);ctx.closePath();ctx.fill();
    }
  }

  function drawEndScreenAnimals(gl){
    const groundY=gl+8;
    // Turtle (left side)
    const tx=50+Math.sin(f*0.01)*3;
    ctx.fillStyle='#557744';ctx.fillRect(tx,groundY-8,14,8); // shell
    ctx.fillStyle='#668855';ctx.fillRect(tx+1,groundY-10,12,4); // shell top
    ctx.fillStyle='#88AA66';ctx.fillRect(tx+3,groundY-9,3,2);ctx.fillRect(tx+8,groundY-9,3,2); // pattern
    ctx.fillStyle='#779955';ctx.fillRect(tx-3,groundY-4,4,5); // head
    ctx.fillRect(tx+13,groundY-2,3,3); // tail
    ctx.fillStyle='#222';ctx.fillRect(tx-2,groundY-3,1,1); // eye
    ctx.fillRect(tx,groundY,3,3);ctx.fillRect(tx+10,groundY,3,3); // legs

    // Bird (center-left)
    const bx=140,by=groundY-5;
    ctx.fillStyle='#6688AA'; // body
    ctx.fillRect(bx,by,8,7);
    ctx.fillStyle='#7799BB';ctx.fillRect(bx+2,by-3,6,4); // head
    ctx.fillStyle='#FFAA44';ctx.fillRect(bx+7,by-2,3,2); // beak
    ctx.fillStyle='#222';ctx.fillRect(bx+5,by-2,1,1); // eye
    ctx.fillRect(bx+1,by+7,2,3);ctx.fillRect(bx+5,by+7,2,3); // legs
    // Wing flap
    if(f%40<20){ctx.fillStyle='#5577AA';ctx.fillRect(bx-2,by+1,3,4);}
    else{ctx.fillStyle='#5577AA';ctx.fillRect(bx-2,by-2,3,4);}

    // Crocodile (right side)
    const cx=CW-110+Math.sin(f*0.008)*2,cy=groundY-4;
    ctx.fillStyle='#448844'; // body
    ctx.fillRect(cx,cy,28,6);
    ctx.fillStyle='#336633';ctx.fillRect(cx+2,cy-2,24,3); // back ridges
    ctx.fillStyle='#559955';
    ctx.fillRect(cx+22,cy-4,10,5); // head
    ctx.fillStyle='#E8E8CC';ctx.fillRect(cx+28,cy-2,5,2); // snout
    ctx.fillStyle='#222';ctx.fillRect(cx+27,cy-3,1,1); // eye
    ctx.fillRect(cx-4,cy+3,6,2); // tail
    ctx.fillRect(cx+5,cy+6,3,3);ctx.fillRect(cx+15,cy+6,3,3); // legs
    // Teeth
    ctx.fillStyle='#FFF';
    ctx.fillRect(cx+29,cy,1,1);ctx.fillRect(cx+31,cy,1,1);
  }

  function drawVideoCard(x,y,w,h,label,color1,color2){
    // Card background with rounded-corner feel
    ctx.fillStyle='rgba(0,0,0,0.12)';
    ctx.fillRect(x+2,y+2,w,h); // shadow

    // Card bg
    const cg=ctx.createLinearGradient(x,y,x,y+h);
    cg.addColorStop(0,color1);cg.addColorStop(1,color2);
    ctx.fillStyle=cg;
    ctx.fillRect(x,y,w,h);

    // Inner border
    ctx.strokeStyle='rgba(255,255,255,0.25)';ctx.lineWidth=1;
    ctx.strokeRect(x+2,y+2,w-4,h-4);

    // Play button triangle
    const pcx=x+w/2, pcy=y+h/2-5;
    ctx.fillStyle='rgba(255,255,255,0.8)';
    ctx.beginPath();ctx.moveTo(pcx-8,pcy-10);ctx.lineTo(pcx-8,pcy+10);ctx.lineTo(pcx+10,pcy);ctx.closePath();ctx.fill();

    // Label at bottom
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(x,y+h-18,w,18);
    ctx.fillStyle='#FFF';ctx.font='10px "DotGothic16",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(label,x+w/2,y+h-9);

    // Pulsing border to attract attention
    const pulse=Math.sin(f*0.06)*0.3+0.7;
    ctx.strokeStyle=`rgba(255,255,255,${pulse*0.5})`;ctx.lineWidth=2;
    ctx.strokeRect(x-1,y-1,w+2,h+2);
  }

  function drawSceneTitle(text,color){
    if(sceneTimer<90){
      ctx.save();
      ctx.globalAlpha=sceneTimer<30?sceneTimer/30:(sceneTimer<60?1:1-(sceneTimer-60)/30);
      px(text,CW/2,35,16,color);
      ctx.restore();
    }
  }

  function loop(){update();draw();requestAnimationFrame(loop);}
  loop();
})();
