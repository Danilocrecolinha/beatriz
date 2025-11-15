// romance.js — versão completa atualizada
(function(){
  'use strict';

  // Helpers
  const $ = s => document.querySelector(s);
  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));

  // DOM elements
  const threeCanvas = $('#three-canvas');
  const effectsCanvas = $('#effects-canvas');
  const compEl = $('#compliment');
  const audioToggle = $('#audio-toggle');
  const audio = $('#bg-audio');

  if (!threeCanvas || !effectsCanvas) {
    console.error('Erro: canvases não encontrados.');
    return;
  }

  // State
  let sparklesEnabled = true;

  // Canvas size
  function setCanvasSize(){
    const w = Math.max(1, Math.floor(window.innerWidth));
    const h = Math.max(1, Math.floor(window.innerHeight));
    threeCanvas.width = effectsCanvas.width = w;
    threeCanvas.height = effectsCanvas.height = h;
  }
  setCanvasSize();

  // ---------- THREE.js starfield + comets ----------
  let scene, camera, renderer, starsMesh, cometGroup, clock;

  function initThree(){
    if (typeof THREE === 'undefined') return;

    scene = new THREE.Scene();
    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(60, threeCanvas.width / threeCanvas.height, 0.1, 2000);
    camera.position.z = 250;

    renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, alpha:true, antialias:true });
    renderer.setSize(threeCanvas.width, threeCanvas.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));

    // Stars
    const starCount = 900;
    const positions = new Float32Array(starCount*3);
    for(let i=0;i<starCount;i++){
      const r = THREE.MathUtils.randFloat(20,900);
      const theta = Math.random()*Math.PI*2;
      const phi = Math.acos(THREE.MathUtils.randFloat(-1,1));
      positions[i*3] = r*Math.sin(phi)*Math.cos(theta);
      positions[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
      positions[i*3+2] = r*Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions,3));
    const starMat = new THREE.PointsMaterial({ color:0xffffff, size:1.4, transparent:true, opacity:0.9, depthWrite:false, blending:THREE.AdditiveBlending });
    starsMesh = new THREE.Points(starGeo, starMat);
    scene.add(starsMesh);

    // Comets
    cometGroup = new THREE.Group();
    scene.add(cometGroup);
    createComets(5);

    scene.add(new THREE.AmbientLight(0xaaaaaa,0.6));
  }

  function createComets(n=5){
    if (typeof THREE==='undefined' || !cometGroup) return;
    cometGroup.clear();
    for(let i=0;i<n;i++){
      const geom = new THREE.BufferGeometry();
      const sx = THREE.MathUtils.randFloatSpread(800);
      const sy = THREE.MathUtils.randFloat(100,600);
      const sz = THREE.MathUtils.randFloatSpread(400);
      const pts = new Float32Array([sx,sy,sz, sx-THREE.MathUtils.randFloat(70,260), sy-THREE.MathUtils.randFloat(30,160), sz+THREE.MathUtils.randFloat(-40,40)]);
      geom.setAttribute('position', new THREE.BufferAttribute(pts,3));
      const mat = new THREE.LineBasicMaterial({ color:0xffc3e0, transparent:true, opacity:0.6 });
      const line = new THREE.Line(geom, mat);
      line.userData = { speed: THREE.MathUtils.randFloat(6,18), life: THREE.MathUtils.randFloat(3,9), t: Math.random()*10 };
      cometGroup.add(line);
    }
  }

  function animateThree(){
    if(typeof THREE==='undefined'||!renderer||!clock) return;
    const t = clock.getElapsedTime();
    if(starsMesh) starsMesh.rotation.y = t*0.01;

    cometGroup.children.forEach(line=>{
      line.userData.t += clock.getDelta();
      const u = line.userData.t;
      line.position.x += Math.cos(u*0.8)*0.2*(line.userData.speed*0.02);
      line.position.y -= 0.6*(line.userData.speed*0.02);
      line.material.opacity = 0.6*(0.9+0.1*Math.sin(u*1.3));
      if(line.position.y<-600){
        const a = line.geometry.attributes.position.array;
        a[0] = THREE.MathUtils.randFloatSpread(800);
        a[1] = THREE.MathUtils.randFloat(200,700);
        a[2] = THREE.MathUtils.randFloatSpread(400);
        a[3] = a[0]-THREE.MathUtils.randFloat(70,260);
        a[4] = a[1]-THREE.MathUtils.randFloat(30,160);
        a[5] = a[2]+THREE.MathUtils.randFloat(-40,40);
        line.geometry.attributes.position.needsUpdate = true;
        line.position.y = 0;
      }
    });

    renderer.render(scene,camera);
    requestAnimationFrame(animateThree);
  }

  // ---------- FX canvas ----------
  const fx = effectsCanvas.getContext('2d');
  let fxW = effectsCanvas.width, fxH = effectsCanvas.height;
  function resizeFx(){
    fxW = effectsCanvas.width = effectsCanvas.clientWidth||window.innerWidth;
    fxH = effectsCanvas.height = effectsCanvas.clientHeight||window.innerHeight;
  }
  resizeFx();

  const floatHearts = [];
  function spawnFloatHeart(){
    floatHearts.push({
      x: Math.random()*fxW,
      y: fxH + 20,
      size: Math.random()*28+12,
      speed: Math.random()*0.9+0.5,
      rot: Math.random()*360
    });
  }
  setInterval(spawnFloatHeart,420);

  const sparkles = [];
  function createSparkles(x,y,count=6){
    if(!sparklesEnabled) return;
    for(let i=0;i<count;i++){
      sparkles.push({
        x,y,
        vx:(Math.random()-0.5)*2.6,
        vy:-Math.random()*1.2-0.2,
        r: Math.random()*2.2+0.8,
        life: Math.random()*0.9+0.6,
        age:0
      });
    }
  }

  // heart particles
  const heartParticles=[];
  const HEART_SETTINGS={length:2200,duration:3.6,velocity:70,effect:-1.3,size:9};

  function buildHeartImage(size=HEART_SETTINGS.size){
    const c=document.createElement('canvas');
    c.width=c.height=size;
    const g=c.getContext('2d');
    g.fillStyle='#ff2d2d';
    g.beginPath();
    let t=-Math.PI;
    const to=(tt)=>{
      const x=160*Math.pow(Math.sin(tt),3);
      const y=130*Math.cos(tt)-50*Math.cos(2*tt)-20*Math.cos(3*tt)-10*Math.cos(4*tt)+25;
      return {x:size/2+(x*size)/350, y:size/2-(y*size)/350};
    };
    let pt=to(t);
    g.moveTo(pt.x,pt.y);
    while(t<Math.PI){ t+=0.02; pt=to(t); g.lineTo(pt.x,pt.y); }
    g.closePath(); g.fill();
    const img=new Image(); img.src=c.toDataURL(); return img;
  }
  const heartImage=buildHeartImage();

  function addHeartParticle(x,y,dx,dy){
    heartParticles.push({x,y,vx:dx,vy:dy,ax:dx*HEART_SETTINGS.effect,ay:dy*HEART_SETTINGS.effect,age:0,life:HEART_SETTINGS.duration});
    if(heartParticles.length>HEART_SETTINGS.length) heartParticles.splice(0,heartParticles.length-HEART_SETTINGS.length);
  }

  function pointOnHeart(t){
    return {
      x:160*Math.pow(Math.sin(t),3),
      y:130*Math.cos(t)-50*Math.cos(2*t)-20*Math.cos(3*t)-10*Math.cos(4*t)+25
    };
  }

  function spawnHeartBurst(amount=120){
    for(let i=0;i<amount;i++){
      const t=Math.PI-2*Math.PI*Math.random();
      const pt=pointOnHeart(t);
      const dir={x:pt.x*HEART_SETTINGS.velocity/350, y:-pt.y*HEART_SETTINGS.velocity/350};
      addHeartParticle(fxW/2+pt.x, fxH/2-pt.y, dir.x, dir.y);
    }
  }
  setTimeout(()=>spawnHeartBurst(120),600);

  // FX loop
  let lastFx=performance.now()/1000;
  function animateFx(){
    const now=performance.now()/1000;
    const dt=Math.min(0.055, now-lastFx);
    lastFx=now;

    fx.fillStyle='rgba(3,1,6,0.08)';
    fx.fillRect(0,0,fxW,fxH);

    for(let i=floatHearts.length-1;i>=0;i--){
      const h=floatHearts[i];
      h.y-=h.speed*(60*dt);
      h.rot+=1.2;
      fx.save();
      fx.translate(h.x,h.y);
      fx.rotate(h.rot*Math.PI/180);
      fx.font=`${h.size}px Arial`;
      fx.textAlign='center';
      fx.fillText('💖',0,0);
      fx.restore();
      if(Math.random()<0.06) createSparkles(h.x,h.y,4);
      if(h.y+h.size<-40) floatHearts.splice(i,1);
    }

    for(let i=sparkles.length-1;i>=0;i--){
      const s=sparkles[i];
      s.vy+=0.02*(dt*60);
      s.x+=s.vx*(dt*60);
      s.y+=s.vy*(dt*60);
      s.age+=dt;
      const alpha=clamp(1-s.age/s.life,0,1);
      fx.globalAlpha=alpha;
      fx.beginPath();
      fx.arc(s.x,s.y,s.r,0,Math.PI*2);
      fx.fillStyle='#ff7aa0';
      fx.fill();
      fx.globalAlpha=1;
      if(s.age>=s.life) sparkles.splice(i,1);
    }

    if(heartImage){
      for(let i=heartParticles.length-1;i>=0;i--){
        const p=heartParticles[i];
        p.x+=p.vx*(dt*60);
        p.y+=p.vy*(dt*60);
        p.vx+=p.ax*dt;
        p.vy+=p.ay*dt;
        p.age+=dt;
        const lifeRatio=clamp(p.age/p.life,0,1);
        const ease=t=>(--t)*t*t+1;
        const size=heartImage.width*ease(1-lifeRatio);
        fx.globalAlpha=1-lifeRatio;
        fx.drawImage(heartImage,p.x-size/2,p.y-size/2,size,size);
        fx.globalAlpha=1;
        if(p.age>=p.life) heartParticles.splice(i,1);
      }
    }

    requestAnimationFrame(animateFx);
  }

  // Interactions
  threeCanvas.addEventListener('click',e=>{
    if(typeof THREE!=='undefined' && cometGroup){
      const geom=new THREE.BufferGeometry();
      const sx=THREE.MathUtils.randFloatSpread(800);
      const sy=THREE.MathUtils.randFloat(100,700);
      const pts=new Float32Array([sx,sy,0,sx-180,sy-80,0]);
      geom.setAttribute('position',new THREE.BufferAttribute(pts,3));
      const mat=new THREE.LineBasicMaterial({color:0xffc0d8,transparent:true,opacity:0.9});
      const line=new THREE.Line(geom,mat);
      line.userData={speed:14,life:2,t:0};
      cometGroup.add(line);
    }

    const rect=effectsCanvas.getBoundingClientRect();
    const cx=e.clientX-rect.left;
    const cy=e.clientY-rect.top;
    for(let i=0;i<80;i++){
      const t=Math.PI-2*Math.PI*Math.random();
      const pt=pointOnHeart(t);
      const dir={x:pt.x*HEART_SETTINGS.velocity/350, y:-pt.y*HEART_SETTINGS.velocity/350};
      addHeartParticle(cx+pt.x*0.12, cy+pt.y*0.12, dir.x*0.4, dir.y*0.4);
    }
    createSparkles(cx,cy,10);
  });

  document.addEventListener('mousemove',e=>{
    const nx=e.clientX/window.innerWidth-0.5;
    const ny=e.clientY/window.innerHeight-0.5;
    if(camera){
      camera.position.x+=(-nx*30-camera.position.x)*0.02;
      camera.position.y+=(ny*30-camera.position.y)*0.02;
    }
  });

  // Compliments
  const compliments=[
    "Você ilumina meu mundo ✨",
    "Me impressiona a cada manhã 💫",
    "Com você tudo é melhor 🌟",
    "Seu jeito me encanta todos os dias 💕",
    "Você é a mulher mais linda do mundo 💖",
    "Você é a mais perfeita do mundo ☀️",
    "Cada segundo com você é incrivel ✨",
    "Você faz meu coração bater mais forte 💗",
    "Com você tudo se torna especial 🌹",
    "Meu coração é seu sempre princesa kk 💓"

];
  let compIndex=0;
  function showNextCompliment(initial=false){
    if(!compEl) return;
    const text=compliments[compIndex];
    compEl.textContent=text;
    if(window.gsap){
      if(!initial) gsap.fromTo(compEl,{y:18,autoAlpha:0},{y:0,autoAlpha:1,duration:0.85,ease:"power2.out"});
      else gsap.fromTo(compEl,{autoAlpha:0},{autoAlpha:1,duration:0.9});
    }
    compIndex=(compIndex+1)%compliments.length;
  }
  showNextCompliment(true);
  setInterval(showNextCompliment,4200);

  // Audio button
  if(audioToggle && audio){
    audioToggle.addEventListener('click',()=>{
      if(audio.paused){
        audio.play().catch(()=>{});
        audioToggle.textContent='🔊 Música';
      } else {
        audio.pause();
        audioToggle.textContent='🔈 Música';
      }
    });
  }

  // Init
  function initAll(){
    setCanvasSize();
    resizeFx();
    initThree();
    if(typeof THREE!=='undefined' && renderer) animateThree();
    animateFx();
    window.addEventListener('resize',()=>{ setCanvasSize(); resizeFx(); onWindowResize(); });
  }

  function onWindowResize(){
    if(typeof THREE!=='undefined' && camera && renderer){
      camera.aspect = threeCanvas.width / threeCanvas.height;
      camera.updateProjectionMatrix();
      renderer.setSize(threeCanvas.width,threeCanvas.height);
    }
  }

  setTimeout(initAll,50);

})();
const audioToggle = document.getElementById('audio-toggle');
const audio = document.getElementById('bg-audio');

if (audioToggle && audio) {
  let musicStarted = false;

  audioToggle.addEventListener('click', () => {
    if (!musicStarted) {
      audio.play().catch(err => {
        console.warn('Falha ao reproduzir áudio:', err);
      });
      musicStarted = true;
      audioToggle.textContent = '🔊 Música';
    }
  });
}
