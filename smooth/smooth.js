(function () {
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  canvas.width = 960;
  canvas.height = 540;
  const W = canvas.width, H = canvas.height;

  /* ── images ── */
  const img = { l1: new Image(), l2: new Image(), r1: new Image(), r2: new Image() };
  Object.values(img).forEach(i => (i.crossOrigin = 'anonymous'));
  img.l1.src = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/88b01ae-6deb-2436-d70b-707f3b24a4df__1.png';
  img.l2.src = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/4d20d-dbcb-c1a-c0e0-ca740e55d8c0__2.png';
  img.r1.src = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/48c5787-6528-52cc-e7e5-300b1f0fb628__2026-01-29_18.44.19-removebg-preview_1_.png';
  img.r2.src = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2164865391/settings_images/ac1ddf4-6f87-bdf0-7231-4de2b1de87f6__2026-01-29_18.42.51-removebg-preview_1_.png';

  /* ── easing ── */
  function easeInOut(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
  function easeOut(t) { return 1 - Math.pow(1-t,3); }
  function easeIn(t) { return t*t*t; }
  function lerp(a,b,t) { return a+(b-a)*Math.max(0,Math.min(1,t)); }
  function smoothstep(a,b,t) { return lerp(a,b,easeInOut(Math.max(0,Math.min(1,t)))); }

  /* ── timing ── */
  let time = 0;           // seconds
  let dt = 0;
  let lastTS = 0;
  const catH = 140, mouseH = 72;

  /* Scenes (in seconds) */
  const SCENES = [
    { name: 'intro',      dur: 5 },
    { name: 'adventure',  dur: 6 },
    { name: 'makai',      dur: 7 },
    { name: 'heaven',     dur: 7 },
    { name: 'boss',       dur: 8 },
    { name: 'finale',     dur: 6 },
  ];
  let sceneIdx = 0, sceneTime = 0, totalTime = 0;
  let transAlpha = 0, transTarget = '#000';

  /* character smooth state */
  let cat = { x: 0, y: 0, rot: 0, scale: 1, img: 0, flipH: false };
  let mouse = { x: 0, y: 0, rot: 0, scale: 1, img: 0, flipH: true };

  /* particles */
  const parts = [];
  function emit(x,y,n,opts) {
    for (let i=0;i<n;i++) {
      const a = Math.random()*Math.PI*2;
      const spd = (opts.speed||2)*(0.5+Math.random());
      parts.push({
        x, y, vx: Math.cos(a)*spd + (opts.vx||0), vy: Math.sin(a)*spd + (opts.vy||0),
        life: (opts.life||1)*(0.7+Math.random()*0.6), maxLife: opts.life||1,
        size: (opts.size||4)*(0.5+Math.random()),
        r: opts.r||255, g: opts.g||255, b: opts.b||255,
        grav: opts.grav||0, drag: opts.drag||0.98,
        glow: opts.glow||false,
      });
    }
  }

  /* ── Audio ── */
  let audioCtx=null,bgmStarted=false,masterGain=null;
  const NF={C3:130.81,D3:146.83,E3:164.81,F3:174.61,G3:196,A3:220,B3:246.94,C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99,A5:880,B5:987.77,C6:1046.5};
  function pn(freq,start,dur,type,vol){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,start);g.gain.exponentialRampToValueAtTime(0.001,start+dur);o.connect(g);g.connect(masterGain);o.start(start);o.stop(start+dur+.05);}
  function drum(s,k){if(!audioCtx)return;if(k==='kick'){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(150,s);o.frequency.exponentialRampToValueAtTime(30,s+.12);g.gain.setValueAtTime(.5,s);g.gain.exponentialRampToValueAtTime(.001,s+.15);o.connect(g);g.connect(masterGain);o.start(s);o.stop(s+.2);}else{const l=.04,buf=audioCtx.createBuffer(1,audioCtx.sampleRate*l,audioCtx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const n=audioCtx.createBufferSource();n.buffer=buf;const g=audioCtx.createGain(),fl=audioCtx.createBiquadFilter();fl.type='highpass';fl.frequency.value=8000;g.gain.setValueAtTime(.2,s);g.gain.exponentialRampToValueAtTime(.001,s+l);n.connect(fl);fl.connect(g);g.connect(masterGain);n.start(s);n.stop(s+l+.01);}}
  function startBGM(){if(bgmStarted)return;bgmStarted=true;audioCtx=new(window.AudioContext||window.webkitAudioContext)();masterGain=audioCtx.createGain();masterGain.gain.value=.16;masterGain.connect(audioCtx.destination);schBGM(audioCtx.currentTime+.1);}
  function schBGM(t0){const bpm=140,beat=60/bpm,bar=beat*4,bars=16;
    const mel=[[['E5',0,.8],['G5',1,.8],['A5',2,.5],['B5',2.5,.5],['C6',3,1]],[['B5',0,.5],['A5',.5,.5],['G5',1,1],['E5',2,.5],['G5',2.5,.5],['A5',3,1]],[['G5',0,.8],['A5',1,.8],['B5',2,.5],['C6',2.5,.5],['D6',3,1]],[['C6',0,1],['B5',1,.5],['A5',1.5,.5],['G5',2,2]],[['E5',0,.8],['G5',1,.8],['A5',2,.5],['B5',2.5,.5],['C6',3,1]],[['D6',0,.5],['C6',.5,.5],['B5',1,1],['A5',2,.5],['G5',2.5,.5],['A5',3,1]],[['B5',0,.8],['C6',1,.8],['D6',2,1],['E6',3,.5],['D6',3.5,.5]],[['C6',0,1.5],['B5',2,.5],['A5',2.5,.5],['G5',3,1]],[['A5',0,.5],['A5',.5,.5],['C6',1,1],['A5',2,.5],['G5',2.5,.5],['A5',3,1]],[['B5',0,.5],['B5',.5,.5],['D6',1,1],['B5',2,.5],['A5',2.5,.5],['B5',3,1]],[['C6',0,1],['D6',1,.5],['E6',1.5,.5],['D6',2,1],['C6',3,1]],[['B5',0,1],['A5',1,1],['G5',2,2]],[['E5',0,.5],['G5',.5,.5],['A5',1,.5],['B5',1.5,.5],['C6',2,.5],['D6',2.5,.5],['E6',3,1]],[['D6',0,1],['C6',1,.5],['B5',1.5,.5],['A5',2,1],['G5',3,1]],[['A5',0,1],['B5',1,1],['C6',2,1],['D6',3,1]],[['E6',0,2],['C6',2,1],['G5',3,1]]];
    const bass=['A3','A3','C4','C4','A3','A3','E3','E3','F3','G3','A3','E3','F3','D3','G3','A3'];
    for(let b=0;b<bars;b++){const bs=t0+b*bar;if(mel[b])mel[b].forEach(([n,bo,d])=>pn(NF[n],bs+bo*beat,d*beat,'square',.2));const bf=NF[bass[b]];for(let bb=0;bb<4;bb++)pn(bf,bs+bb*beat,beat*.7,'triangle',.3);for(let a=0;a<8;a++)pn(bf*2*[1,1.25,1.5,1.25][a%4],bs+a*beat*.5,beat*.4,'sine',.05);for(let bb=0;bb<4;bb++){drum(bs+bb*beat,'kick');if(bb%2===1)drum(bs+bb*beat,'hat');if(b>=8)drum(bs+bb*beat+beat*.5,'hat');}}
    const ld=bars*bar;setTimeout(()=>{if(audioCtx&&audioCtx.state==='running')schBGM(t0+ld);},(ld-1)*1000);}
  function sfx(type){if(!audioCtx)return;const t=audioCtx.currentTime;if(type==='slash'){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(800,t);o.frequency.exponentialRampToValueAtTime(100,t+.15);g.gain.setValueAtTime(.3,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);g.connect(masterGain);o.start(t);o.stop(t+.25);}else if(type==='hit'){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='square';o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(40,t+.15);g.gain.setValueAtTime(.4,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);g.connect(masterGain);o.start(t);o.stop(t+.25);}else if(type==='heaven'){[1,1.25,1.5,2].forEach((m,i)=>pn(440*m,t+i*.12,.6,'sine',.12));}else if(type==='powerup'){[1,1.2,1.5,1.8,2].forEach((m,i)=>pn(523*m,t+i*.08,.3,'sine',.1));}}
  let sfxPlayed = {};
  function sfxOnce(key,type){ if(!sfxPlayed[key]){sfxPlayed[key]=true;sfx(type);} }
  function initAudio(){startBGM();document.removeEventListener('click',initAudio);document.removeEventListener('touchstart',initAudio);}
  document.addEventListener('click',initAudio);document.addEventListener('touchstart',initAudio);
  setTimeout(()=>{try{startBGM();}catch(e){}},100);

  /* ── draw helpers ── */
  function drawImg(image,x,y,h,flipH,rot,scale,alpha){
    if(!image.complete||!image.naturalWidth)return;
    const sc=scale||1; const w=h*(image.width/image.height)*sc; const fh=h*sc;
    ctx.save();
    if(alpha!==undefined) ctx.globalAlpha=alpha;
    ctx.translate(x+w/2, y+fh);
    if(rot) ctx.rotate(rot);
    ctx.scale(flipH?-1:1, 1);
    ctx.drawImage(image, -w/2, -fh, w, fh);
    ctx.restore();
  }

  function drawText(text,x,y,size,color,alpha,blur){
    ctx.save();
    ctx.globalAlpha = alpha===undefined?1:alpha;
    ctx.font = `900 ${size}px "Noto Sans JP",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if(blur){ctx.shadowColor=color;ctx.shadowBlur=blur;}
    // Outline
    ctx.strokeStyle='rgba(0,0,0,0.8)';ctx.lineWidth=size*0.12;ctx.lineJoin='round';
    ctx.strokeText(text,x,y);
    ctx.fillStyle=color;ctx.fillText(text,x,y);
    ctx.restore();
  }

  function drawShadow(x,y,w){
    ctx.save();ctx.globalAlpha=0.2;
    ctx.fillStyle='#000';
    ctx.beginPath();ctx.ellipse(x,y,w*0.4,6,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  /* ── Backgrounds (smooth, gradient-rich) ── */
  function bgAdventure(t){
    // Sky
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#2E7DD9');g.addColorStop(0.5,'#7EC8E3');g.addColorStop(0.8,'#C5E8F7');g.addColorStop(1,'#E8D5A3');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // Sun
    const sunG=ctx.createRadialGradient(W-130,80,15,W-130,80,90);
    sunG.addColorStop(0,'rgba(255,250,200,1)');sunG.addColorStop(0.3,'rgba(255,230,150,0.6)');sunG.addColorStop(1,'rgba(255,200,80,0)');
    ctx.fillStyle=sunG;ctx.beginPath();ctx.arc(W-130,80,90,0,Math.PI*2);ctx.fill();
    // Clouds (smooth motion)
    ctx.save();ctx.globalAlpha=0.6;
    [[totalTime*20,50,100,20],[totalTime*15+200,30,80,16],[totalTime*18+400,65,70,14]].forEach(([cx,cy,cw,ch])=>{
      const x=(cx%((W+cw*2)))-cw;
      ctx.fillStyle='#fff';
      ctx.beginPath();ctx.ellipse(x,cy,cw/2,ch/2,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(x-cw*0.25,cy+ch*0.15,cw*0.35,ch*0.4,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(x+cw*0.25,cy+ch*0.2,cw*0.3,ch*0.35,0,0,Math.PI*2);ctx.fill();
    });
    ctx.restore();
    // Distant hills
    ctx.fillStyle='#5BAF5B';
    ctx.beginPath();ctx.moveTo(0,H);
    for(let x=0;x<=W;x+=4){const y=380-Math.sin(x*0.006+0.5)*40-Math.sin(x*0.015)*20;ctx.lineTo(x,y);}
    ctx.lineTo(W,H);ctx.fill();
    ctx.fillStyle='#4A9E4A';ctx.beginPath();ctx.moveTo(0,H);
    for(let x=0;x<=W;x+=4){const y=400-Math.sin(x*0.01+2)*25-Math.sin(x*0.005)*15;ctx.lineTo(x,y);}
    ctx.lineTo(W,H);ctx.fill();
    // Ground
    const gg=ctx.createLinearGradient(0,420,0,H);
    gg.addColorStop(0,'#6BBF6B');gg.addColorStop(1,'#4A8A4A');
    ctx.fillStyle=gg;ctx.fillRect(0,420,W,H-420);
  }

  function bgMakai(t){
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#0D0008');g.addColorStop(0.3,'#2A0015');g.addColorStop(0.7,'#400000');g.addColorStop(1,'#1A0000');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // Red moon
    const mx=200,my=100;
    const mg=ctx.createRadialGradient(mx,my,20,mx,my,100);
    mg.addColorStop(0,'rgba(200,30,50,0.8)');mg.addColorStop(0.3,'rgba(150,0,30,0.4)');mg.addColorStop(1,'rgba(100,0,20,0)');
    ctx.fillStyle=mg;ctx.beginPath();ctx.arc(mx,my,100,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#881122';ctx.beginPath();ctx.arc(mx,my,35,0,Math.PI*2);ctx.fill();
    // Jagged mountains
    ctx.fillStyle='#180008';ctx.beginPath();ctx.moveTo(0,H);
    for(let x=0;x<=W;x+=3){const y=380-Math.abs(Math.sin(x*0.015)*70+Math.sin(x*0.04+2)*30);ctx.lineTo(x,y);}
    ctx.lineTo(W,H);ctx.fill();
    // Lava ground
    const lg=ctx.createLinearGradient(0,420,0,H);
    lg.addColorStop(0,'#2A0000');lg.addColorStop(1,'#1A0000');
    ctx.fillStyle=lg;ctx.fillRect(0,420,W,H-420);
    // Lava glow
    ctx.save();ctx.globalAlpha=0.15+Math.sin(totalTime*2)*0.05;
    const lgg=ctx.createLinearGradient(0,H-40,0,H);
    lgg.addColorStop(0,'rgba(255,80,0,0)');lgg.addColorStop(1,'rgba(255,60,0,0.3)');
    ctx.fillStyle=lgg;ctx.fillRect(0,H-40,W,40);
    ctx.restore();
    // Floating embers
    for(let i=0;i<15;i++){
      const ex=(i*73+totalTime*30)%(W+40)-20;
      const ey=H-50-((totalTime*40+i*60)%200);
      const ea=Math.max(0,1-((totalTime*40+i*60)%200)/200);
      ctx.save();ctx.globalAlpha=ea*0.7;
      ctx.fillStyle=`rgb(255,${Math.floor(100+Math.sin(totalTime+i)*50)},0)`;
      ctx.beginPath();ctx.arc(ex+Math.sin(totalTime*2+i)*8,ey,2+Math.sin(totalTime*3+i),0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
  }

  function bgHeaven(t){
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#FFFCE8');g.addColorStop(0.3,'#FFE8A0');g.addColorStop(0.6,'#E8F0FF');g.addColorStop(1,'#D0E8FF');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // Light rays
    ctx.save();
    for(let i=0;i<7;i++){
      const bx=80+i*130+Math.sin(totalTime*0.3+i)*20;
      const a=0.06+Math.sin(totalTime*0.8+i*1.5)*0.03;
      ctx.fillStyle=`rgba(255,255,200,${a})`;
      ctx.beginPath();ctx.moveTo(bx-8,0);ctx.lineTo(bx+8,0);ctx.lineTo(bx+60,H);ctx.lineTo(bx-60,H);ctx.closePath();ctx.fill();
    }
    ctx.restore();
    // Cloud floor
    ctx.fillStyle='rgba(255,255,255,0.9)';
    ctx.beginPath();ctx.moveTo(0,H);
    for(let x=0;x<=W;x+=4){const y=400-Math.sin(x*0.01)*15-Math.sin(x*0.025+totalTime*0.5)*8-20;ctx.lineTo(x,y);}
    ctx.lineTo(W,H);ctx.fill();
    ctx.fillStyle='rgba(255,250,235,0.5)';
    ctx.beginPath();ctx.moveTo(0,H);
    for(let x=0;x<=W;x+=4){const y=410-Math.sin(x*0.015+1)*12-Math.sin(x*0.03+totalTime*0.4)*6-15;ctx.lineTo(x,y);}
    ctx.lineTo(W,H);ctx.fill();
    // Sparkles
    for(let i=0;i<12;i++){
      const sx=(totalTime*25+i*80)%W;
      const sy=40+Math.sin(totalTime*0.8+i*0.7)*20+i*15;
      const sa=Math.sin(totalTime*2+i)*0.5+0.5;
      ctx.save();ctx.globalAlpha=sa*0.8;
      ctx.fillStyle='#FFD700';
      ctx.beginPath();ctx.arc(sx,sy,2+Math.sin(totalTime*3+i),0,Math.PI*2);ctx.fill();
      // Cross sparkle
      ctx.fillRect(sx-4,sy-0.5,8,1);ctx.fillRect(sx-0.5,sy-4,1,8);
      ctx.restore();
    }
  }

  function bgBoss(t){
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#060618');g.addColorStop(0.5,'#10082A');g.addColorStop(1,'#080810');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // Lightning
    if(Math.sin(totalTime*3)>0.95){
      ctx.save();ctx.globalAlpha=0.3;ctx.fillStyle='#8888FF';ctx.fillRect(0,0,W,H);ctx.restore();
    }
    // Magic circle
    ctx.save();
    ctx.globalAlpha=0.12+Math.sin(totalTime*1.5)*0.04;
    ctx.strokeStyle='#8844FF';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(W/2,440,160+Math.sin(totalTime)*8,30,0,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.ellipse(W/2,440,120+Math.sin(totalTime*1.3+1)*6,22,0,0,Math.PI*2);ctx.stroke();
    // Rotating runes
    for(let i=0;i<6;i++){
      const a=totalTime*0.5+i*Math.PI/3;
      const rx=W/2+Math.cos(a)*140,ry=440+Math.sin(a)*28;
      ctx.fillStyle='#8844FF';ctx.font='12px sans-serif';ctx.textAlign='center';
      ctx.fillText(['◆','★','●','◇','☆','○'][i],rx,ry);
    }
    ctx.restore();
    // Ground
    ctx.fillStyle='#120E1A';ctx.fillRect(0,420,W,H-420);
  }

  function bgFinale(t){
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#0A0520');g.addColorStop(0.4,'#1A1060');g.addColorStop(1,'#080818');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // Stars
    for(let i=0;i<50;i++){
      const sx=(i*19+totalTime*3)%W;
      const sy=(i*23)%300;
      const tw=Math.sin(totalTime*2+i*0.7)*0.4+0.6;
      ctx.save();ctx.globalAlpha=tw*0.8;
      ctx.fillStyle='#FFEEDD';
      ctx.beginPath();ctx.arc(sx,sy,1+Math.sin(totalTime+i)*0.5,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
  }

  /* ── Named enemy characters (smooth versions) ── */
  function drawRange(x,y,scale,alpha,friendly){
    ctx.save();ctx.translate(x,y);ctx.scale(scale||1,scale||1);
    if(alpha!==undefined)ctx.globalAlpha=alpha;
    // Body glow
    ctx.save();ctx.globalAlpha*=0.2;
    const rg=ctx.createRadialGradient(0,-20,10,0,-20,60);
    rg.addColorStop(0,friendly?'rgba(50,200,50,0.5)':'rgba(255,100,0,0.5)');rg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=rg;ctx.beginPath();ctx.arc(0,-20,60,0,Math.PI*2);ctx.fill();ctx.restore();
    // Body
    ctx.fillStyle=friendly?'#886633':'#774400';
    ctx.beginPath();ctx.roundRect(-25,-45,50,55,8);ctx.fill();
    // Chart lines
    ctx.strokeStyle=friendly?'#44DD44':'#FF6600';ctx.lineWidth=3;
    for(let i=0;i<3;i++){const ly=-35+i*15;ctx.beginPath();ctx.moveTo(-18,ly);ctx.lineTo(18,ly);ctx.stroke();}
    // Head
    ctx.fillStyle=friendly?'#997744':'#885500';
    ctx.beginPath();ctx.roundRect(-20,-68,40,26,6);ctx.fill();
    // Eyes
    if(friendly){
      ctx.strokeStyle='#222';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(-8,-58,4,Math.PI,0);ctx.stroke();
      ctx.beginPath();ctx.arc(8,-58,4,Math.PI,0);ctx.stroke();
    } else {
      ctx.fillStyle='#FF2200';
      ctx.beginPath();ctx.arc(-8,-58,4,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(8,-58,4,0,Math.PI*2);ctx.fill();
    }
    // Smile/mouth
    if(friendly){
      ctx.strokeStyle='#664422';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-48,6,0.2,Math.PI-0.2);ctx.stroke();
    }
    // Label
    ctx.fillStyle=friendly?'#88DD44':'#FF8800';ctx.font='bold 14px "Noto Sans JP",sans-serif';ctx.textAlign='center';ctx.fillText('レンジ',0,-78);
    ctx.restore();
  }

  function drawMental(x,y,scale,alpha,phase){
    // phase: 0=menacing, 1=defeated
    ctx.save();ctx.translate(x,y);ctx.scale(scale||1,scale||1);
    if(alpha!==undefined)ctx.globalAlpha=alpha;
    const wobble=Math.sin(totalTime*2)*4;
    // Dark aura
    ctx.save();ctx.globalAlpha*=(0.25+Math.sin(totalTime*1.5)*0.1);
    const ag=ctx.createRadialGradient(0,-20,15,0,-20,100);
    ag.addColorStop(0,'rgba(100,0,180,0.5)');ag.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ag;ctx.beginPath();ctx.arc(0,-20,100,0,Math.PI*2);ctx.fill();ctx.restore();
    // Body (amorphous)
    ctx.fillStyle='#1A0030';
    ctx.beginPath();ctx.ellipse(wobble,-10,35,40,0,0,Math.PI*2);ctx.fill();
    // Head
    ctx.fillStyle='#250045';
    ctx.beginPath();ctx.ellipse(wobble*0.5,-55,28,22,0,0,Math.PI*2);ctx.fill();
    // Eyes
    const eg=0.6+Math.sin(totalTime*3)*0.3;
    ctx.fillStyle=`rgba(255,0,120,${eg})`;
    ctx.beginPath();ctx.ellipse(-10+wobble*0.5,-58,6,4,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(10+wobble*0.5,-58,6,4,0,0,Math.PI*2);ctx.fill();
    // Third eye
    ctx.fillStyle=`rgba(200,0,255,${0.4+Math.sin(totalTime*2.5)*0.3})`;
    ctx.beginPath();ctx.arc(wobble*0.5,-72,5,0,Math.PI*2);ctx.fill();
    // Tendrils
    ctx.strokeStyle='rgba(40,0,60,0.5)';ctx.lineWidth=4;
    for(let i=0;i<4;i++){
      ctx.beginPath();ctx.moveTo(-25+i*18,25);
      const tx=-25+i*18+Math.sin(totalTime*2+i)*10;
      const ty=25+20+Math.sin(totalTime*1.5+i*1.5)*12;
      ctx.quadraticCurveTo(tx+Math.sin(totalTime+i)*5,(25+ty)/2+10,tx,ty);ctx.stroke();
    }
    // Floating words
    ctx.save();ctx.globalAlpha=0.3+Math.sin(totalTime)*0.15;ctx.fillStyle='#AA00FF';
    ctx.font='12px "Noto Sans JP",sans-serif';ctx.textAlign='center';
    ['不安','恐怖','損切り','焦り'].forEach((w,i)=>{
      const wx=Math.sin(totalTime*0.7+i*1.5)*70;const wy=Math.cos(totalTime*0.9+i*1.2)*40-30;
      ctx.fillText(w,wx,wy);
    });ctx.restore();
    // Label
    drawText('メンタル',0,-95,16,'#CC00FF',1,10);
    ctx.restore();
  }

  function drawTrend(x,y,scale,alpha){
    ctx.save();ctx.translate(x,y);ctx.scale(scale||1,scale||1);
    if(alpha!==undefined)ctx.globalAlpha=alpha;
    const hover=Math.sin(totalTime*1.5)*6;ctx.translate(0,hover);
    // Golden glow
    ctx.save();ctx.globalAlpha*=(0.3+Math.sin(totalTime)*0.1);
    const gg=ctx.createRadialGradient(0,-15,10,0,-15,80);
    gg.addColorStop(0,'rgba(255,215,0,0.5)');gg.addColorStop(1,'rgba(255,200,0,0)');
    ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,-15,80,0,Math.PI*2);ctx.fill();ctx.restore();
    // Wings
    const wf=Math.sin(totalTime*2.5)*10;
    ctx.fillStyle='rgba(255,255,230,0.5)';
    ctx.beginPath();ctx.ellipse(-40,-15+wf,18,30,-.2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(40,-15-wf,18,30,.2,0,Math.PI*2);ctx.fill();
    // Body
    const bg2=ctx.createLinearGradient(0,-30,0,30);
    bg2.addColorStop(0,'#FFFDE8');bg2.addColorStop(1,'#FFF5CC');
    ctx.fillStyle=bg2;ctx.beginPath();ctx.roundRect(-16,-25,32,50,8);ctx.fill();
    // Gold trim
    ctx.fillStyle='#FFD700';ctx.fillRect(-16,-25,32,4);ctx.fillRect(-16,21,32,4);
    // Head
    ctx.fillStyle='#FFEEDD';ctx.beginPath();ctx.arc(0,-38,14,0,Math.PI*2);ctx.fill();
    // Eyes
    ctx.fillStyle='#4488FF';ctx.beginPath();ctx.arc(-5,-40,3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(5,-40,3,0,Math.PI*2);ctx.fill();
    // Smile
    ctx.strokeStyle='#CC8866';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,-34,5,0.2,Math.PI-0.2);ctx.stroke();
    // Halo
    ctx.save();ctx.globalAlpha=0.7+Math.sin(totalTime*2)*0.2;
    ctx.strokeStyle='#FFD700';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,-56,12,4,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    // Arrow
    ctx.fillStyle='#00CC44';
    ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(-6,0);ctx.lineTo(-3,0);ctx.lineTo(-3,12);ctx.lineTo(3,12);ctx.lineTo(3,0);ctx.lineTo(6,0);ctx.closePath();ctx.fill();
    // Label
    ctx.fillStyle='#FFD700';ctx.font='bold 14px "Noto Sans JP",sans-serif';ctx.textAlign='center';ctx.fillText('強トレンド',0,-65);
    ctx.restore();
  }

  /* ── SCENE UPDATE + DRAW ── */
  function tick(ts){
    if(!lastTS) lastTS=ts;
    dt = Math.min((ts-lastTS)/1000, 0.05);
    lastTS=ts;
    time+=dt; totalTime+=dt; sceneTime+=dt;

    const scene=SCENES[sceneIdx];
    // Transition
    if(sceneTime<0.5) transAlpha=1-sceneTime/0.5;
    else if(sceneTime>scene.dur-0.5) transAlpha=(sceneTime-(scene.dur-0.5))/0.5;
    else transAlpha=0;

    if(sceneTime>=scene.dur){
      sceneIdx=(sceneIdx+1)%SCENES.length;
      sceneTime=0;sfxPlayed={};
      transTarget=SCENES[sceneIdx].name==='heaven'?'#FFF':'#000';
    }

    // Update particles
    for(let i=parts.length-1;i>=0;i--){
      const p=parts[i];
      p.x+=p.vx*dt*60; p.y+=p.vy*dt*60; p.vy+=p.grav*dt*60;
      p.vx*=p.drag; p.vy*=p.drag; p.life-=dt;
      if(p.life<=0) parts.splice(i,1);
    }

    // ── Draw ──
    ctx.clearRect(0,0,W,H);
    const name=SCENES[sceneIdx].name;
    const t=sceneTime;
    const gl=420;

    const lI = Math.floor(totalTime*3)%2===0 ? img.l1 : img.l2;
    const rI = Math.floor(totalTime*3)%2===0 ? img.r1 : img.r2;

    /* ─── INTRO ─── */
    if(name==='intro'){
      bgAdventure(t);
      // Characters run in
      const runP = easeOut(Math.min(1,t/2));
      cat.x = lerp(-200, 280, runP);
      mouse.x = lerp(-100, 420, runP);
      cat.y = -Math.abs(Math.sin(t*4))*20*(t<2?1:Math.max(0,1-(t-2)/0.5));
      mouse.y = -Math.abs(Math.sin(t*4+1))*14*(t<2?1:Math.max(0,1-(t-2)/0.5));
      cat.rot = Math.sin(t*6)*0.08*(t<2?1:0);
      mouse.rot = Math.sin(t*6+1)*0.06*(t<2?1:0);
      // After landing, subtle breathing
      if(t>2.5){
        cat.y=Math.sin(t*2)*3;
        mouse.y=Math.sin(t*2+0.5)*2;
        cat.rot=Math.sin(t*1.5)*0.02;
        mouse.rot=Math.sin(t*1.5+0.5)*0.015;
      }
      // Sparkle particles on arrival
      if(t>1.8&&t<2.2) emit(cat.x+50,gl-70,2,{r:255,g:215,b:0,speed:3,life:0.8,size:4,grav:1,vy:-2});
      drawShadow(cat.x+catH*0.35, gl, catH*0.6);
      drawShadow(mouse.x+mouseH*0.35, gl, mouseH*0.5);
      drawImg(lI, cat.x, gl-catH+cat.y, catH, false, cat.rot);
      drawImg(rI, mouse.x, gl-mouseH+mouse.y, mouseH, true, mouse.rot);
      // Title (smooth fade + scale)
      const titleA = easeInOut(Math.min(1,t/1.5));
      const titleScale = lerp(1.3,1,easeOut(Math.min(1,t/2)));
      ctx.save();ctx.translate(W/2,100);ctx.scale(titleScale,titleScale);
      drawText('にゃんこ先生のFX講座',0,0,42,'#FFD700',titleA,20);
      ctx.restore();
      if(t>1.5){
        const subA=easeInOut(Math.min(1,(t-1.5)/1));
        drawText('〜 ぼうけんの はじまり 〜',W/2,155,18,'#FFFFFF',subA,8);
      }
      // Decorative frame
      if(t>1){
        ctx.save();ctx.globalAlpha=easeInOut(Math.min(1,(t-1)/1));
        ctx.strokeStyle='#DAA520';ctx.lineWidth=3;ctx.shadowColor='#FFD700';ctx.shadowBlur=10;
        ctx.beginPath();ctx.roundRect(W/2-250,65,500,110,12);ctx.stroke();
        ctx.restore();
      }
    }

    /* ─── ADVENTURE ─── */
    else if(name==='adventure'){
      bgAdventure(t);
      // Walk → jog → skip → look forward
      if(t<1.5){
        cat.x=200+t*40; mouse.x=cat.x+120;
        cat.y=-Math.abs(Math.sin(t*5))*8; mouse.y=-Math.abs(Math.sin(t*5+1))*5;
      } else if(t<3){
        cat.x=260+(t-1.5)*80; mouse.x=cat.x+110;
        cat.y=-Math.abs(Math.sin(t*7))*14; mouse.y=-Math.abs(Math.sin(t*7+0.8))*10;
        cat.rot=Math.sin(t*7)*0.06; mouse.rot=Math.sin(t*7+0.8)*0.04;
        if(Math.floor(t*8)%2===0) emit(cat.x+20,gl,1,{r:180,g:160,b:120,speed:1,life:0.5,size:3,grav:0.5,vy:-1});
      } else if(t<4.5){
        const sk=t*5;
        cat.x=380+(t-3)*20; mouse.x=cat.x+100;
        cat.y=-Math.abs(Math.sin(sk))*30; mouse.y=-Math.abs(Math.sin(sk+Math.PI))*25;
        cat.rot=Math.sin(sk)*0.12; mouse.rot=Math.sin(sk+Math.PI)*0.1;
      } else {
        cat.x=410; mouse.x=520;
        cat.y=Math.sin(t*2)*3; mouse.y=Math.sin(t*2+0.5)*2;
        cat.rot=-0.05; mouse.rot=0;
      }
      drawShadow(cat.x+catH*0.35,gl,catH*0.5);drawShadow(mouse.x+mouseH*0.35,gl,mouseH*0.4);
      drawImg(lI,cat.x,gl-catH+cat.y,catH,false,cat.rot);
      drawImg(rI,mouse.x,gl-mouseH+mouse.y,mouseH,true,mouse.rot);
      // Text
      if(t<2.5) drawText('ぼうけんの はじまりだ！',W/2,60,24,'#FFF',easeInOut(Math.min(1,t/0.8)),10);
      else if(t>3&&t<5) drawText('いくぞ！',W/2,60,28,'#FFDD44',easeInOut(Math.min(1,(t-3)/0.5))*(t<4.5?1:easeOut(1-(t-4.5)/0.5)),10);
    }

    /* ─── MAKAI ─── */
    else if(name==='makai'){
      bgMakai(t);
      // Title
      if(t<2){const a=t<0.8?easeInOut(t/0.8):(t<1.5?1:easeOut(1-(t-1.5)/0.5));drawText('── 魔  界 ──',W/2,70,36,'#FF3344',a,15);}

      // レンジ enemy
      const rangeAlive = t<5.5;
      if(rangeAlive){
        const rx = t<1.5 ? W-180 : (t<3 ? W-180+Math.sin(t*2.5)*80 : W-180);
        const ry = gl+Math.abs(Math.sin(t*3))*5;
        drawRange(rx,ry,1,t>5?Math.max(0,1-(t-5)/0.5):1);
        // Slash effects
        if(t>3.5&&t<3.8){ ctx.save();ctx.globalAlpha=1-(t-3.5)/0.3;ctx.strokeStyle='#FFFF88';ctx.lineWidth=4;ctx.shadowColor='#FFD700';ctx.shadowBlur=15;
          ctx.beginPath();ctx.moveTo(rx-40,ry-60);ctx.lineTo(rx+40,ry+10);ctx.stroke();ctx.restore();sfxOnce('s1','slash');}
        if(t>3.7&&t<3.9){sfxOnce('h1','hit');if(t>3.7&&t<3.75)emit(rx,ry-30,15,{r:255,g:150,b:0,speed:4,life:0.6,size:5,grav:2,vy:-3});}
        if(t>4.8&&t<5.1){ctx.save();ctx.globalAlpha=1-(t-4.8)/0.3;ctx.strokeStyle='#FFFF88';ctx.lineWidth=5;ctx.shadowColor='#FFD700';ctx.shadowBlur=20;
          ctx.beginPath();ctx.moveTo(rx+30,ry-70);ctx.lineTo(rx-30,ry);ctx.stroke();ctx.beginPath();ctx.moveTo(rx-30,ry-60);ctx.lineTo(rx+30,ry-10);ctx.stroke();ctx.restore();sfxOnce('s2','slash');}
        if(t>5&&t<5.1){sfxOnce('h2','hit');emit(rx,ry-40,30,{r:255,g:200,b:50,speed:5,life:0.8,size:6,grav:2,vy:-4});}
      }
      // Characters
      if(t<1){cat.x=lerp(-100,140,easeOut(t));mouse.x=cat.x+110;}
      else if(t<2){cat.x=140;mouse.x=250;cat.y=Math.sin(t*4)*3;mouse.y=Math.sin(t*4+0.5)*2;cat.rot=Math.sin(t*8)*0.03;}
      else if(t<3){
        cat.x=140+Math.sin(t*3)*20;mouse.x=cat.x+100;
        const dodge=Math.floor((t-2)*3)%3;
        cat.y=dodge===0?-20:0;mouse.y=dodge===1?-15:0;
        cat.rot=dodge===0?0.15:-0.05;mouse.rot=dodge===1?-0.12:0;
      } else if(t<5.5){
        cat.x=lerp(140,W-280,easeInOut(Math.min(1,(t-3)/0.8)));mouse.x=180;
        cat.y=-Math.abs(Math.sin(t*6))*12;mouse.y=Math.abs(Math.sin(t*3))*3;
        cat.rot=Math.sin(t*6)*0.08;
      } else {
        cat.x=350;mouse.x=460;
        cat.y=-Math.abs(Math.sin(t*4))*15;mouse.y=-Math.abs(Math.sin(t*4+1))*10;
        cat.rot=Math.sin(t*3)*0.1;
      }
      drawShadow(cat.x+catH*0.35,gl,catH*0.5);drawShadow(mouse.x+mouseH*0.35,gl,mouseH*0.4);
      drawImg(lI,cat.x,gl-catH+cat.y,catH,false,cat.rot);
      drawImg(rI,mouse.x,gl-mouseH+mouse.y,mouseH,true,mouse.rot);
      if(t>5.5) drawText('レンジを たおした！',W/2,H/2-40,28,'#FFD700',easeInOut(Math.min(1,(t-5.5)/0.5)),15);
    }

    /* ─── HEAVEN ─── */
    else if(name==='heaven'){
      bgHeaven(t);
      if(t<2){const a=t<0.8?easeInOut(t/0.8):(t<1.5?1:easeOut(1-(t-1.5)/0.5));drawText('── 天  国 ──',W/2,70,36,'#FFD700',a,15);}
      sfxOnce('hv','heaven');
      // 強トレンド
      const trendAlpha=t<1?easeInOut(t):1;
      drawTrend(W-200,gl-60-Math.sin(totalTime*1.5)*10,1,trendAlpha);

      if(t<2){cat.x=lerp(80,250,easeOut(t/2));mouse.x=cat.x+100;}
      else if(t<3.5){cat.x=250;mouse.x=350;cat.y=Math.sin(t*2)*10;mouse.y=Math.sin(t*2+0.5)*8;}
      else if(t<4.5){
        // Power-up!
        sfxOnce('pu','powerup');
        cat.y=-15+Math.sin(t*5)*5;mouse.y=-12+Math.sin(t*5+1)*4;
        if(Math.floor(t*10)%2===0){emit(cat.x+50,gl-catH+cat.y,2,{r:255,g:215,b:0,speed:3,life:0.6,size:4,grav:-0.5,vy:-3});emit(mouse.x+30,gl-mouseH+mouse.y,2,{r:255,g:255,b:200,speed:2,life:0.5,size:3,grav:-0.5,vy:-2});}
      } else {
        // Dance!
        const d=t-4.5;
        cat.x=250+Math.sin(d*1.5)*40;mouse.x=380+Math.sin(d*1.5+Math.PI)*35;
        cat.y=-Math.abs(Math.sin(d*4))*25;mouse.y=-Math.abs(Math.sin(d*4+1.5))*20;
        cat.rot=Math.sin(d*3)*0.2;mouse.rot=-Math.sin(d*2.5)*0.15;
        if(Math.floor(t*5)%3===0)emit(cat.x+40,gl-60,1,{r:255,g:200,b:100,speed:2,life:0.6,size:3,grav:0.5,vy:-2});
      }
      drawShadow(cat.x+catH*0.35,gl,catH*0.5);drawShadow(mouse.x+mouseH*0.35,gl,mouseH*0.4);
      drawImg(lI,cat.x,gl-catH+cat.y-30,catH,false,cat.rot);
      drawImg(rI,mouse.x,gl-mouseH+mouse.y-30,mouseH,true,mouse.rot);
      // Hearts
      if(t>2){ctx.fillStyle='#FF69B4';
        for(let i=0;i<5;i++){const hx=120+i*160+Math.sin(totalTime+i*2)*20;const hy=H*0.7-(totalTime*30+i*50)%(H*0.6);
          ctx.save();ctx.globalAlpha=(hy<40?hy/40:1)*0.5;ctx.beginPath();ctx.arc(hx,hy,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(hx+7,hy,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(hx-5,hy+3);ctx.lineTo(hx+3.5,hy+12);ctx.lineTo(hx+12,hy+3);ctx.fill();ctx.restore();}}
      if(t>3.5&&t<4.5) drawText('強トレンドの ちからを えた！',W/2,60,20,'#FFD700',easeInOut(Math.min(1,(t-3.5)/0.4))*(t<4.2?1:(4.5-t)/0.3),10);
    }

    /* ─── BOSS ─── */
    else if(name==='boss'){
      bgBoss(t);
      if(t<2){const a=t<0.8?easeInOut(t/0.8):(t<1.5?1:easeOut(1-(t-1.5)/0.5));drawText('── 強敵「メンタル」──',W/2,60,32,'#CC00FF',a,15);}
      // Boss
      const bossAlive=t<6.5;
      const bossA=bossAlive?Math.min(1,easeInOut(Math.min(1,(t-0.5)/1))):(t<7?Math.max(0,1-(t-6.5)/0.5):0);
      if(bossA>0){
        const bx=W-200+(t>5.5&&t<6?Math.random()*10:0)+(t>6&&t<6.5?Math.random()*20:0);
        drawMental(bx,gl-30,1,bossA);
        // HP bar
        let hp=1;
        if(t>3)hp=0.65; if(t>4.5)hp=0.3; if(t>6)hp=0;
        ctx.save();ctx.globalAlpha=bossA;
        ctx.fillStyle='#222';ctx.beginPath();ctx.roundRect(W-270,gl-130,140,10,5);ctx.fill();
        ctx.fillStyle=hp>0.3?'#AA00CC':'#FF0066';ctx.beginPath();ctx.roundRect(W-268,gl-128,136*hp,6,3);ctx.fill();
        ctx.restore();
      }
      // Battle sequence
      if(t<1.5){cat.x=lerp(-100,160,easeOut(t/1.5));mouse.x=cat.x+100;}
      else if(t<2.5){cat.x=160;mouse.x=260;cat.rot=Math.sin(t*10)*0.04;mouse.rot=Math.sin(t*10+1)*0.03;}
      else if(t<3.5){
        // Charge 1
        cat.x=lerp(160,W-320,easeInOut((t-2.5)/0.8));mouse.x=260;cat.y=-Math.abs(Math.sin(t*8))*15;cat.rot=Math.sin(t*8)*0.1;
        if(t>3&&t<3.3){ctx.save();ctx.globalAlpha=1-(t-3)/0.3;ctx.strokeStyle='#FFFF88';ctx.lineWidth=5;ctx.shadowColor='#FFDD00';ctx.shadowBlur=20;ctx.beginPath();ctx.moveTo(W-240,gl-80);ctx.lineTo(W-160,gl);ctx.stroke();ctx.restore();sfxOnce('bs1','slash');}
        if(t>3.1&&t<3.2){sfxOnce('bh1','hit');emit(W-200,gl-40,20,{r:200,g:100,b:255,speed:5,life:0.7,size:5,grav:2,vy:-3});}
      } else if(t<4.5){
        // Boss counter → dodge
        cat.x=lerp(W-320,120,(t-3.5)/0.5);cat.y=Math.sin(t*6)*10;cat.rot=-(t-3.5)*2;
        mouse.x=260;mouse.y=t>4?-25*(1-(t-4)/0.5):0;
      } else if(t<5.5){
        // Power-up
        cat.x=160;mouse.x=200;cat.rot=0;
        cat.y=-Math.sin((t-4.5)*5)*8;mouse.y=-Math.sin((t-4.5)*5+1)*6;
        if(Math.floor(t*10)%2===0){emit(cat.x+50,gl-80,2,{r:255,g:215,b:0,speed:3,life:0.6,size:5,grav:-0.5,vy:-3});emit(mouse.x+25,gl-40,2,{r:100,g:200,b:255,speed:2,life:0.5,size:4,grav:-0.5,vy:-2});}
        sfxOnce('bpu','powerup');
      } else if(t<6.5){
        // Combined final attack!
        const ft=t-5.5;
        cat.x=lerp(160,W-300,easeIn(ft));mouse.x=lerp(200,W-280,easeIn(Math.max(0,ft-0.2)));
        cat.y=-20+Math.sin(ft*12)*5;mouse.y=-15+Math.sin(ft*12+1)*4;
        if(ft>0.4&&ft<0.7){
          ctx.save();ctx.globalAlpha=1-(ft-0.4)/0.3;ctx.strokeStyle='#FFFF88';ctx.lineWidth=6;ctx.shadowColor='#FFD700';ctx.shadowBlur=25;
          ctx.beginPath();ctx.moveTo(W-250,gl-100);ctx.lineTo(W-150,gl+10);ctx.stroke();
          ctx.beginPath();ctx.moveTo(W-150,gl-90);ctx.lineTo(W-250,gl);ctx.stroke();ctx.restore();sfxOnce('bs2','slash');
        }
        if(ft>0.5&&ft<0.6){sfxOnce('bh2','hit');emit(W-200,gl-50,40,{r:255,g:200,b:50,speed:6,life:1,size:6,grav:2,vy:-4});emit(W-200,gl-30,30,{r:200,g:50,b:255,speed:5,life:0.8,size:5,grav:2,vy:-3});}
      } else {
        cat.x=320;mouse.x=420;
        cat.y=-Math.abs(Math.sin(t*3.5))*20;mouse.y=-Math.abs(Math.sin(t*3.5+1))*15;
        cat.rot=Math.sin(t*2.5)*0.15;mouse.rot=-Math.sin(t*2)*0.12;
        if(Math.floor(t*3)%2===0)emit(Math.random()*W,100+Math.random()*200,2,{r:255,g:215,b:0,speed:2,life:0.8,size:4,grav:1,vy:-1});
      }
      drawShadow(cat.x+catH*0.35,gl,catH*0.5);drawShadow(mouse.x+mouseH*0.35,gl,mouseH*0.4);
      drawImg(lI,cat.x,gl-catH+cat.y,catH,false,cat.rot);
      drawImg(rI,mouse.x,gl-mouseH+mouse.y,mouseH,true,mouse.rot);
      if(t>7) drawText('メンタルに 勝った！',W/2,H/2-40,36,'#FFD700',easeInOut(Math.min(1,(t-7)/0.5)),20);
    }

    /* ─── FINALE ─── */
    else if(name==='finale'){
      bgFinale(t);
      // Title
      const ta=easeInOut(Math.min(1,t/1.5));
      ctx.save();ctx.translate(W/2,110);
      const ts=lerp(1.2,1,easeOut(Math.min(1,t/2)));ctx.scale(ts,ts);
      drawText('にゃんこ先生のFX講座',0,0,40,'#FFD700',ta,25);ctx.restore();
      if(t>1.5) drawText('〜 ぼうけんは つづく 〜',W/2,160,16,'#FFFFFF',easeInOut(Math.min(1,(t-1.5)/1)),8);

      cat.x=W/2-80;mouse.x=W/2+50;
      cat.y=-Math.abs(Math.sin(t*3))*12;mouse.y=-Math.abs(Math.sin(t*3+1))*10;
      cat.rot=Math.sin(t*2)*0.1;mouse.rot=-Math.sin(t*2)*0.08;
      drawShadow(cat.x+catH*0.35,gl,catH*0.5);drawShadow(mouse.x+mouseH*0.35,gl,mouseH*0.4);
      drawImg(lI,cat.x,gl-catH+cat.y,catH,false,cat.rot);
      drawImg(rI,mouse.x,gl-mouseH+mouse.y,mouseH,true,mouse.rot);

      // Subscribe
      if(t>3){
        const subA=easeInOut(Math.min(1,(t-3)/0.5))*(0.6+Math.sin(totalTime*3)*0.4);
        drawText('チャンネル登録よろしくね！',W/2,H-45,20,'#FF6B6B',subA,10);
      }
      if(t%0.15<dt) emit(Math.random()*W,Math.random()*300,1,{r:255,g:215,b:0,speed:1.5,life:1,size:3,grav:0.3,vy:-1});
    }

    // Draw particles
    parts.forEach(p=>{
      const a=Math.max(0,p.life/p.maxLife);
      ctx.save();
      if(p.glow){ctx.shadowColor=`rgb(${p.r},${p.g},${p.b})`;ctx.shadowBlur=10;}
      ctx.globalAlpha=a*0.8;
      ctx.fillStyle=`rgb(${p.r},${p.g},${p.b})`;
      ctx.beginPath();ctx.arc(p.x,p.y,p.size*a,0,Math.PI*2);ctx.fill();
      ctx.restore();
    });

    // Transition overlay
    if(transAlpha>0){
      const c=transTarget==='#FFF'?'255,255,255':'0,0,0';
      ctx.fillStyle=`rgba(${c},${transAlpha})`;ctx.fillRect(0,0,W,H);
    }

    // Vignette
    const vg=ctx.createRadialGradient(W/2,H/2,W*0.35,W/2,H/2,W*0.75);
    vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.3)');
    ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
