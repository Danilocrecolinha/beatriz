/* script.js — pétalas nítidas, realistas, sem blur invasivo */

(() => {
  // Three.js setup (mantive seu código funcional)
  const canvas = document.getElementById('galaxy');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.z = 220;

  // starfield
  const starCount = 4500;
  const positions = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  for (let i=0;i<starCount;i++){
    positions[i*3] = (Math.random()-0.5) * 1400;
    positions[i*3+1] = (Math.random()-0.5) * 800;
    positions[i*3+2] = (Math.random()-0.5) * 1200;
    sizes[i] = Math.random()*1.2 + 0.2;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const mat = new THREE.PointsMaterial({ color: 0xffd6ff, size: 1.2, transparent:true, opacity:0.9, depthWrite:false, blending:THREE.AdditiveBlending });
  const points = new THREE.Points(geom, mat);
  scene.add(points);

  // subtle comet group (lines)
  const cometGroup = new THREE.Group();
  scene.add(cometGroup);

  function makeComet(){
    const geom = new THREE.BufferGeometry();
    const sx = THREE.MathUtils.randFloatSpread(1200);
    const sy = THREE.MathUtils.randFloat(200, 800);
    const sz = THREE.MathUtils.randFloatSpread(400);
    const pts = new Float32Array([sx,sy,sz, sx-THREE.MathUtils.randFloat(80,260), sy-THREE.MathUtils.randFloat(30,200), sz+THREE.MathUtils.randFloat(-40,40)]);
    geom.setAttribute('position', new THREE.BufferAttribute(pts,3));
    const matL = new THREE.LineBasicMaterial({ color: 0xffb6e6, transparent:true, opacity:0.5 });
    const line = new THREE.Line(geom, matL);
    line.userData = { speed: THREE.MathUtils.randFloat(8,22), life: THREE.MathUtils.randFloat(3,9), t: Math.random()*10 };
    cometGroup.add(line);
  }
  for(let i=0;i<4;i++) makeComet();

  const clock = new THREE.Clock();
  function render(){
    requestAnimationFrame(render);
    const t = clock.getElapsedTime() * 0.06;
    points.rotation.y = t * 0.6;
    cometGroup.children.forEach(line=>{
      line.userData.t += clock.getDelta();
      const u = line.userData.t;
      line.position.x += Math.cos(u*0.8) * 0.04 * (line.userData.speed*0.02);
      line.position.y -= 0.4 * (line.userData.speed*0.02);
      line.material.opacity = 0.45 * (0.9 + 0.1*Math.sin(u*1.3));
      if (line.position.y < -900) {
        const a = line.geometry.attributes.position.array;
        a[0] = THREE.MathUtils.randFloatSpread(1200);
        a[1] = THREE.MathUtils.randFloat(200,800);
        a[2] = THREE.MathUtils.randFloatSpread(400);
        a[3] = a[0] - THREE.MathUtils.randFloat(80,260);
        a[4] = a[1] - THREE.MathUtils.randFloat(30,200);
        a[5] = a[2] + THREE.MathUtils.randFloat(-40,40);
        line.geometry.attributes.position.needsUpdate = true;
        line.position.y = 0;
      }
    });
    renderer.render(scene, camera);
  }
  render();

  // handle resize
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
  });

  /* ================= PETALS: SVG-based falling petals (NÍTIDAS) ================= */
  const petalsLayer = document.getElementById('petals-layer');

  // ensure layer styles (keeps petals above canvas but below UI container)
  petalsLayer.style.position = 'fixed';
  petalsLayer.style.left = '0';
  petalsLayer.style.top = '0';
  petalsLayer.style.width = '100%';
  petalsLayer.style.height = '100%';
  petalsLayer.style.pointerEvents = 'none';
  petalsLayer.style.overflow = 'hidden';
  petalsLayer.style.zIndex = '12';

  const MAX_PETALS = 90; // cap for performance

  // create crisp SVG petal element
  function makePetalElement(colorStops = null) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox','0 0 100 100');
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    svg.classList.add('petal');
    svg.style.position = 'absolute';
    svg.style.willChange = 'transform, opacity';
    svg.setAttribute('aria-hidden', 'true');

    // defs + linearGradient
    const defs = document.createElementNS(ns, 'defs');
    const gradId = `g${Math.random().toString(36).slice(2,9)}`;
    const grad = document.createElementNS(ns, 'linearGradient');
    grad.setAttribute('id', gradId);
    grad.setAttribute('x1', '20%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '80%'); grad.setAttribute('y2', '100%');

    const stopA = document.createElementNS(ns, 'stop');
    stopA.setAttribute('offset','0%');
    stopA.setAttribute('stop-color', colorStops ? colorStops[0] : '#ffd6ea');
    stopA.setAttribute('stop-opacity','1');

    const stopB = document.createElementNS(ns, 'stop');
    stopB.setAttribute('offset','100%');
    stopB.setAttribute('stop-color', colorStops ? colorStops[1] : '#ff9ecf');
    stopB.setAttribute('stop-opacity','1');

    grad.appendChild(stopA);
    grad.appendChild(stopB);
    defs.appendChild(grad);
    svg.appendChild(defs);

    // main petal path (refined shape)
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d','M50 8 C66 18 86 34 82 54 C78 74 60 90 50 92 C40 90 22 74 18 54 C14 34 34 18 50 8 Z');
    path.setAttribute('fill', `url(#${gradId})`);
    // sharpen rendering
    path.setAttribute('shape-rendering','geometricPrecision');
    path.setAttribute('stroke','rgba(0,0,0,0.06)');
    path.setAttribute('stroke-width','0.6');
    svg.appendChild(path);

    // tiny highlight for gloss (subtle)
    const highlight = document.createElementNS(ns, 'path');
    highlight.setAttribute('d','M45 18 C52 22 61 28 62 36 C54 30 47 24 45 18 Z');
    highlight.setAttribute('fill','rgba(255,255,255,0.08)');
    highlight.setAttribute('shape-rendering','geometricPrecision');
    svg.appendChild(highlight);

    // ensure crisp visuals in CSS (non-scaling stroke)
    path.setAttribute('vector-effect','non-scaling-stroke');

    return svg;
  }

  // spawn a falling petal (no per-size blur)
  function spawnPetal(opts = {}) {
    if (petalsLayer.children.length >= MAX_PETALS) return null;

    const size = opts.size || (Math.random()*40 + 18);
    const left = (opts.x != null) ? opts.x : Math.random() * window.innerWidth;
    const startY = (opts.y != null) ? opts.y : (-60 - Math.random() * 80);
    const endY = window.innerHeight + 140 + Math.random() * 160;
    const drift = (Math.random() - 0.5) * (160 + size * 0.6);
    const baseRotate = (Math.random() - 0.5) * 60;
    const spin = (Math.random() - 0.5) * 360;
    const fallDuration = (opts.duration) || (5.5 + Math.random()*5.5); // 5.5 - 11s
    const color1 = `rgb(255, ${120 + Math.floor(Math.random()*60)}, ${160 + Math.floor(Math.random()*80)})`;
    const color2 = `rgb(${245 - Math.floor(Math.random()*8)}, ${100 + Math.floor(Math.random()*80)}, ${150 + Math.floor(Math.random()*100)})`;
    const svg = makePetalElement([color1, color2]);

    svg.style.width = `${size}px`;
    svg.style.height = `${size}px`;
    svg.style.left = `${left}px`;
    svg.style.top = `${startY}px`;
    // use translate3d for GPU compositing and crisp transform
    const depthScale = 0.86 + (size / 110);
    svg.style.transform = `translate3d(0,0,0) scale(${depthScale})`;
    svg.style.backfaceVisibility = 'hidden';

    petalsLayer.appendChild(svg);

    // main falling tween (GSAP)
    gsap.to(svg, {
      y: endY,
      x: `+=${drift}`,
      rotation: baseRotate + spin,
      duration: fallDuration,
      ease: "power1.in",
      onComplete() { try{ svg.remove(); }catch(e){} }
    });

    // sway & rotation oscillation for natural flutter
    const swayAmt = 12 + Math.random()*24;
    const swayDur = 1.6 + Math.random()*1.6;
    gsap.to(svg, {
      x: `+=${swayAmt}`,
      repeat: Math.ceil(fallDuration / swayDur),
      yoyo: true,
      ease: "sine.inOut",
      duration: swayDur,
      delay: 0.02
    });

    const rotAmt = 10 + Math.random()*22;
    const rotDur = 0.8 + Math.random()*1.0;
    gsap.to(svg, {
      rotation: `+=${(Math.random() > 0.5 ? 1 : -1) * rotAmt}`,
      repeat: Math.ceil(fallDuration / rotDur),
      yoyo: true,
      ease: "sine.inOut",
      duration: rotDur
    });

    // soft fade near the end
    gsap.to(svg, { opacity: 0, delay: fallDuration * 0.78, duration: fallDuration * 0.22, ease: "power1.out" });

    return svg;
  }

  // ambient spawn using requestAnimationFrame rhythm (safer que setInterval)
  let ambientRunning = true;
  function ambientLoop() {
    if (!ambientRunning) return;
    // randomized spawn chance per frame (keeps rate controllable)
    if (Math.random() < 0.018) { // ~ 1.8% per frame -> ~1-2 petals/sec at 60fps
      const count = Math.random() > 0.87 ? 2 : 1;
      for (let i=0;i<count;i++) spawnPetal({ size: 12 + Math.random()*46, x: Math.random()*window.innerWidth });
    }
    requestAnimationFrame(ambientLoop);
  }
  ambientLoop();

  function stopAmbientPetals() { ambientRunning = false; }
  function startAmbientPetals() { if (!ambientRunning) { ambientRunning = true; ambientLoop(); } }

  // initial gentle burst
  for(let i=0;i<7;i++) spawnPetal({ x: Math.random()*window.innerWidth, size: 20 + Math.random()*44 });

  /* Pointer interactions */
  function onPointerTrigger(clientX, clientY) {
    const rect = petalsLayer.getBoundingClientRect();
    const lx = clientX - rect.left;
    const ly = clientY - rect.top;
    for (let i=0;i<10;i++){
      const jitterX = lx + (Math.random()-0.5) * 90;
      const jitterY = ly + (Math.random()-0.5) * 60 - 60;
      spawnPetal({ x: Math.max(0, Math.min(window.innerWidth, jitterX)), y: Math.max(-120, jitterY), size: 12 + Math.random()*36 });
    }

    // small 3D comet on click (kept)
    const geom = new THREE.BufferGeometry();
    const localX = THREE.MathUtils.randFloatSpread(800);
    const localY = THREE.MathUtils.randFloat(100,700);
    const pts = new Float32Array([ localX, localY, 0, localX - 180, localY - 80, 0 ]);
    geom.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const matL = new THREE.LineBasicMaterial({ color: 0xffc3e0, transparent:true, opacity:0.95 });
    const line = new THREE.Line(geom, matL);
    line.userData = { speed: 14, life: 2, t: 0 };
    cometGroup.add(line);
    setTimeout(()=>{ try{ cometGroup.remove(line); }catch(e){} }, 4200);
  }

  window.addEventListener('click', (e) => onPointerTrigger(e.clientX, e.clientY));
  window.addEventListener('touchstart', (e) => { if (!e.touches) return; const t = e.touches[0]; onPointerTrigger(t.clientX, t.clientY); }, {passive:true});

  // camera parallax (kept)
  document.addEventListener('mousemove', (e) => {
    const nx = (e.clientX / window.innerWidth - 0.5);
    const ny = (e.clientY / window.innerHeight - 0.5);
    gsap.to(camera.position, { x: -nx * 40, y: ny * 30, duration: 0.9, ease: "power1.out" });
  });

  // visibility handling
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAmbientPetals();
    else startAmbientPetals();
  });

  // cleanup on resize
  window.addEventListener('resize', () => {
    Array.from(petalsLayer.children).forEach(node => {
      const t = node.getBoundingClientRect();
      if (t.top > window.innerHeight + 1200 || t.bottom < -1200) try{ node.remove(); }catch(e){}
    });
  });

})();
/* SEU CÓDIGO ORIGINAL AQUI... */

/* ----------------------------------- */
/* TRANSIÇÃO PARA A PÁGINA PREMIUM     */
/* ----------------------------------- */

const premiumButton = document.getElementById('premiumBtn');

premiumButton.addEventListener('click', function (e) {
    e.preventDefault();

    document.body.classList.add('fade-out');

    setTimeout(() => {
        window.location.href = "premium.html";
    }, 1200);
});
