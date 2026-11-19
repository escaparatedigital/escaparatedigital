/* Escaparate Digital · web inmersiva */
(function () {
  'use strict';

  var WA = 'https://wa.me/34687393966?text=' + encodeURIComponent('Hola, quiero un presupuesto para mi negocio.');
  document.querySelectorAll('.js-wa').forEach(function (a) { a.href = WA; });

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var mobile = window.innerWidth < 760;
  var hasGsap = typeof gsap !== 'undefined';

  /* ---------- QR de la demo ---------- */
  (function buildQR() {
    var svg = document.getElementById('qr'); if (!svg) return;
    var n = 25, seed = 7, out = '';
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    function finder(x, y) {
      out += '<rect x="' + x + '" y="' + y + '" width="7" height="7"/>';
      out += '<rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" style="fill:#fff"/>';
      out += '<rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3"/>';
    }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var inF = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!inF && rnd() > 0.52) out += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    svg.innerHTML = out;
    var setH = function () { var q = svg.parentNode; q.style.setProperty('--qh', (q.clientHeight - 24) + 'px'); };
    setH(); window.addEventListener('resize', setH);
  })();

  /* ---------- Escena 3D ---------- */
  var scene3d = null;
  function initGL() {
    if (typeof THREE === 'undefined') return null;
    var canvas = document.getElementById('gl');
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(35, 1, 0.05, 100);
    camera.position.set(0, 0, 6.4);

    /* luces */
    scene.add(new THREE.AmbientLight(0xffe9d6, 0.35));
    var key = new THREE.DirectionalLight(0xffb48a, 2.2); key.position.set(3, 4, 5); scene.add(key);
    var rim = new THREE.DirectionalLight(0xff6b35, 2.6); rim.position.set(-4, -1, -3); scene.add(rim);
    var fill = new THREE.PointLight(0xc9a28a, 1.4, 20); fill.position.set(-3, 2, 4); scene.add(fill);

    /* móvil */
    var W = 1.0, H = 2.06, R = 0.17;
    function rrect(w, h, r) {
      var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
    }
    var phone = new THREE.Group();
    var bodyGeo = new THREE.ExtrudeGeometry(rrect(W, H, R), { depth: 0.07, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.025, bevelSegments: 6, curveSegments: 24 });
    bodyGeo.center();
    var bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x241914, metalness: 0.75, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 });
    phone.add(new THREE.Mesh(bodyGeo, bodyMat));

    /* pantalla: una mini web dibujada en canvas */
    var sc = document.createElement('canvas'); sc.width = 600; sc.height = 1250;
    var cx = sc.getContext('2d');
    var tex = new THREE.CanvasTexture(sc);
    tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4;
    var screenGeo = new THREE.ShapeGeometry(rrect(W - 0.07, H - 0.07, R - 0.04), 24);
    var pos = screenGeo.attributes.position, uv = screenGeo.attributes.uv;
    for (var i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + (W - 0.07) / 2) / (W - 0.07), (pos.getY(i) + (H - 0.07) / 2) / (H - 0.07));
    var screenMat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    var screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.z = 0.066; phone.add(screen);
    /* isla */
    var island = new THREE.Mesh(new THREE.ShapeGeometry(rrect(0.26, 0.07, 0.035), 12), new THREE.MeshBasicMaterial({ color: 0x0b0806 }));
    island.position.set(0, H / 2 - 0.12, 0.068); phone.add(island);
    scene.add(phone);

    function rr(x, y, w, h, r, c) { cx.fillStyle = c; cx.beginPath(); cx.roundRect ? cx.roundRect(x, y, w, h, r) : cx.rect(x, y, w, h); cx.fill(); }
    var items = [['Corte y peinado', '28 €'], ['Tinte raíz', '38 €'], ['Mechas', '85 €'], ['Tratamiento', '22 €'], ['Recogido', '40 €'], ['Manicura', '18 €']];
    function drawScreen(t, white) {
      var w = sc.width, h = sc.height;
      cx.fillStyle = '#F3E9DC'; cx.fillRect(0, 0, w, h);
      var off = (t * 38) % 520;
      cx.save(); cx.translate(0, -off * 0.0);
      /* cabecera */
      rr(40, 90, 64, 64, 18, '#FF6B35');
      cx.fillStyle = '#1A120E'; cx.font = '700 34px "Bricolage Grotesque", sans-serif'; cx.fillText('Tu negocio', 124, 135);
      rr(440, 100, 120, 44, 22, '#1A120E');
      cx.fillStyle = '#F3E9DC'; cx.font = '600 22px "Bricolage Grotesque", sans-serif'; cx.fillText('Reservar', 456, 130);
      /* portada */
      var g = cx.createLinearGradient(0, 190, w, 560); g.addColorStop(0, '#A47864'); g.addColorStop(1, '#6E4C3C');
      rr(40, 190, w - 80, 380, 36, g);
      cx.fillStyle = '#F3E9DC'; cx.font = 'italic 400 76px "Instrument Serif", serif'; cx.fillText('Abierto', 76, 330);
      cx.font = '800 92px "Bricolage Grotesque", sans-serif'; cx.fillText('hoy', 76, 420);
      cx.font = '500 26px "Bricolage Grotesque", sans-serif'; cx.globalAlpha = .85; cx.fillText('De 9:30 a 20:00', 76, 475); cx.globalAlpha = 1;
      var pulse = 0.5 + 0.5 * Math.sin(t * 3);
      rr(76, 500, 250, 50, 25, 'rgba(17,12,10,' + (0.85 + pulse * 0.15) + ')');
      cx.fillStyle = '#F3E9DC'; cx.font = '600 22px "Bricolage Grotesque", sans-serif'; cx.fillText('Pedir cita  →', 106, 533);
      /* lista que se desplaza */
      cx.save(); cx.beginPath(); cx.rect(0, 600, w, h - 600); cx.clip();
      cx.fillStyle = '#5B4A40'; cx.font = '600 22px "Bricolage Grotesque", sans-serif'; cx.fillText('SERVICIOS', 44, 640);
      for (var k = 0; k < 12; k++) {
        var it = items[k % items.length], y = 670 + k * 104 - off;
        if (y < 560 || y > h) continue;
        rr(40, y, w - 80, 88, 22, k % 3 === 0 ? '#E8DACA' : '#EFE3D4');
        cx.fillStyle = '#1A120E'; cx.font = '600 28px "Bricolage Grotesque", sans-serif'; cx.fillText(it[0], 72, y + 54);
        cx.fillStyle = '#C2410C'; cx.font = 'italic 400 36px "Instrument Serif", serif'; cx.fillText(it[1], w - 150, y + 56);
      }
      cx.restore();
      cx.restore();
      if (white > 0) { cx.fillStyle = 'rgba(243,233,220,' + white + ')'; cx.fillRect(0, 0, w, h); }
      tex.needsUpdate = true;
    }

    /* partículas */
    var N = mobile ? 1400 : 3200;
    var pg = new THREE.BufferGeometry();
    var pp = new Float32Array(N * 3), pc = new Float32Array(N * 3), ps = new Float32Array(N), pr = new Float32Array(N);
    var cA = new THREE.Color('#FF6B35'), cB = new THREE.Color('#F3E9DC'), cC = new THREE.Color('#A47864');
    for (var j = 0; j < N; j++) {
      var rad = 1.6 + Math.pow(Math.random(), 0.6) * 3.6, ang = Math.random() * Math.PI * 2;
      pp[j * 3] = Math.cos(ang) * rad; pp[j * 3 + 1] = (Math.random() - 0.5) * 1.4 * (rad * 0.35); pp[j * 3 + 2] = Math.sin(ang) * rad;
      var c = Math.random() < 0.3 ? cA : (Math.random() < 0.5 ? cB : cC);
      pc[j * 3] = c.r; pc[j * 3 + 1] = c.g; pc[j * 3 + 2] = c.b;
      ps[j] = Math.random() * 1.0 + 0.35; pr[j] = Math.random();
    }
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    pg.setAttribute('color', new THREE.BufferAttribute(pc, 3));
    pg.setAttribute('size', new THREE.BufferAttribute(ps, 1));
    pg.setAttribute('rnd', new THREE.BufferAttribute(pr, 1));
    var pmat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uSpread: { value: 0 }, uPx: { value: renderer.getPixelRatio() } },
      vertexShader: [
        'attribute float size; attribute float rnd; attribute vec3 color; varying vec3 vC; varying float vA;',
        'uniform float uTime; uniform float uSpread; uniform float uPx;',
        'void main(){ vec3 p=position; float a=uTime*(0.05+rnd*0.06); float c=cos(a), s=sin(a);',
        ' p.xz=mat2(c,-s,s,c)*p.xz; p.y+=sin(uTime*0.6+rnd*12.0)*0.06; p*=1.0+uSpread*(0.8+rnd);',
        ' vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;',
        ' gl_PointSize=size*uPx*(22.0/-mv.z); vC=color; vA=0.35+0.65*fract(rnd*7.0+uTime*0.15); }'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vC; varying float vA;',
        'void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.0,d); gl_FragColor=vec4(vC,a*vA*0.9); }'
      ].join('\n')
    });
    var points = new THREE.Points(pg, pmat);
    points.rotation.x = 0.35;
    scene.add(points);

    /* anillo de luz detrás del móvil */
    var ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.008, 16, 200), new THREE.MeshBasicMaterial({ color: 0xff6b35, transparent: true, opacity: 0.55 }));
    ring.position.z = -0.6; scene.add(ring);
    var ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.004, 16, 200), new THREE.MeshBasicMaterial({ color: 0xc9a28a, transparent: true, opacity: 0.35 }));
    ring2.position.z = -0.9; scene.add(ring2);

    var state = { p: 0 };
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener('pointermove', function (e) { mouse.tx = e.clientX / window.innerWidth - 0.5; mouse.ty = e.clientY / window.innerHeight - 0.5; }, { passive: true });

    function size() {
      var r = canvas.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
    }
    size(); window.addEventListener('resize', size);

    var clock = new THREE.Clock(), running = true, intro = { v: reduce ? 1 : 0 };
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function frame() {
      if (!running) { requestAnimationFrame(frame); return; }
      var t = clock.getElapsedTime();
      mouse.x += (mouse.tx - mouse.x) * 0.06; mouse.y += (mouse.ty - mouse.y) * 0.06;
      var p = state.p;
      var a = ease(Math.min(1, p / 0.45));            // girar al frente
      var b = ease(Math.max(0, (p - 0.45) / 0.55));   // entrar en la pantalla
      var portrait = camera.aspect < 0.9;
      var narrow = !portrait && camera.aspect < 1.45;
      var baseX = portrait ? 0 : (narrow ? 1.0 : 0.5), baseY = portrait ? -0.06 : -0.26;
      var sc0 = portrait ? 0.6 : (narrow ? 0.74 : 0.84);
      phone.position.x = lerp(baseX, 0, a);
      phone.position.y = lerp(baseY, 0, a) + Math.sin(t * 1.1) * 0.04 * (1 - b);
      phone.rotation.y = lerp(-0.55, 0, a) + mouse.x * 0.35 * (1 - b) + Math.sin(t * 0.7) * 0.05 * (1 - a);
      phone.rotation.x = lerp(0.18, 0, a) + mouse.y * 0.25 * (1 - b);
      phone.rotation.z = lerp(0.12, 0, a);
      var s = sc0 * (0.82 + 0.18 * intro.v);
      phone.scale.setScalar(s);
      phone.position.y += (1 - intro.v) * -0.6;
      // la cámara entra hasta que la pantalla llena la vista
      var fillZ = portrait ? 1.75 : 0.62;
      camera.position.z = lerp(6.4, fillZ, b);
      camera.position.x = mouse.x * 0.25 * (1 - b);
      camera.position.y = -mouse.y * 0.18 * (1 - b);
      camera.lookAt(camera.position.x * 0.5, camera.position.y * 0.5, 0);
      ring.position.x = ring2.position.x = phone.position.x; ring.position.y = ring2.position.y = phone.position.y;
      var rk = narrow ? 0.78 : 1; ring.scale.setScalar(s * rk * (1 + b * 2)); ring2.scale.setScalar(s * rk * (1 + b * 2.6));
      ring.rotation.z = t * 0.2; ring2.rotation.z = -t * 0.12;
      ring.material.opacity = 0.55 * intro.v * (1 - b); ring2.material.opacity = 0.35 * intro.v * (1 - b);
      pmat.uniforms.uTime.value = t; pmat.uniforms.uSpread.value = b * 2.2;
      points.position.x = phone.position.x * 0.6;
      points.material.opacity = 1;
      drawScreen(t, Math.max(0, (b - 0.55) / 0.45));
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    /* pausar cuando la portada no se ve */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { running = es[0].isIntersecting; }).observe(document.querySelector('.hero'));
    }
    return { state: state, intro: intro };
  }

  try { scene3d = initGL(); } catch (e) { scene3d = null; }
  if (!scene3d) document.documentElement.classList.add('no-gl');

  /* ---------- sin GSAP o sin movimiento ---------- */
  var loader = document.getElementById('loader');
  if (!hasGsap || reduce) {
    if (loader) loader.remove();
    document.body.classList.remove('is-loading');
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.add('is-live'); });
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  /* ---------- scroll suave ---------- */
  var lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.stop();
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var el = document.querySelector(id); if (!el) return;
        e.preventDefault(); lenis.scrollTo(el, { duration: 1.4 });
      });
    });
  }

  /* ---------- pantalla de carga + entrada ---------- */
  var giant = SplitText.create('.giant span', { type: 'chars', charsClass: 'char' });
  var h1 = SplitText.create('.hero h1', { type: 'lines,words', mask: 'lines' });
  gsap.set(giant.chars, { yPercent: 110, opacity: 0 });
  gsap.set(h1.lines, { yPercent: 100 });
  gsap.set(['.kicker', '.hero__side', '.nav', '.scrollcue'], { autoAlpha: 0, y: 20 });

  var counter = { v: 0 }, countEl = document.getElementById('count'), barEl = document.getElementById('bar');
  var fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  var intro = gsap.timeline({ paused: true });
  intro.to(counter, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: function () {
      var n = Math.round(counter.v); countEl.textContent = (n < 10 ? '00' : n < 100 ? '0' : '') + n; barEl.style.transform = 'scaleX(' + counter.v / 100 + ')';
    } })
    .to('#loader', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '+=0.1')
    .add(function () { document.body.classList.remove('is-loading'); if (lenis) lenis.start(); }, '-=0.4')
    .to(giant.chars, { yPercent: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.045 }, '-=0.55')
    .to(scene3d ? scene3d.intro : {}, { v: 1, duration: 1.6, ease: 'expo.out' }, '<0.1')
    .to(h1.lines, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, '<0.2')
    .to(['.nav', '.kicker', '.hero__side', '.scrollcue'], { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, '<0.1')
    .add(function () { loader.remove(); });
  fontsReady.then(function () { intro.play(); });
  setTimeout(function () { if (!intro.isActive() && intro.progress() === 0) intro.play(); }, 2500);

  /* ---------- portada: scroll ---------- */
  var heroTl = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
  if (scene3d) heroTl.to(scene3d.state, { p: 1, ease: 'none', duration: 1 }, 0);
  heroTl
    .to('.giant__a', { xPercent: -70, ease: 'power2.in', duration: 0.5 }, 0)
    .to('.giant__b', { xPercent: 80, ease: 'power2.in', duration: 0.5 }, 0)
    .to('.giant', { opacity: 0, duration: 0.2 }, 0.32)
    .to('.hero__ui', { y: -60, autoAlpha: 0, duration: 0.25, ease: 'power1.in' }, 0.04)
    .to('.scrollcue', { autoAlpha: 0, duration: 0.1 }, 0)
    .to('.hero__veil', { opacity: 1, duration: 0.12, ease: 'none' }, 0.88);
  if (!scene3d) heroTl.to('.hero__veil', { opacity: 1, duration: 0.3 }, 0.6);

  /* ---------- barra de progreso y nav ---------- */
  gsap.to('#progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
  var nav = document.getElementById('nav'), lastY = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (self) {
    var y = self.scroll();
    nav.classList.toggle('is-scrolled', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 600);
    lastY = y;
  } });

  /* ---------- manifiesto: palabras que se encienden ---------- */
  var mt = SplitText.create('#mtext', { type: 'words', wordsClass: 'word' });
  gsap.fromTo(mt.words, { opacity: 0.12 }, { opacity: 1, ease: 'none', stagger: 0.1,
    scrollTrigger: { trigger: '.manifesto', start: 'top top', end: '+=' + (mobile ? 90 : 120) + '%', scrub: 0.5, pin: true } });
  gsap.from('.manifesto__foot span', { y: 30, opacity: 0, stagger: 0.05, duration: 0.8, ease: 'expo.out',
    scrollTrigger: { trigger: '.manifesto__foot', start: 'top 92%' } });

  /* ---------- servicios: scroll horizontal ---------- */
  var track = document.getElementById('track');
  var svn = document.getElementById('svn');
  var panels = gsap.utils.toArray('.panel');
  function dist() { return track.scrollWidth - window.innerWidth; }
  var hTween = gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
    scrollTrigger: { trigger: '.services', start: 'top top', end: function () { return '+=' + dist(); }, pin: '.services__pin', scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1 } });
  panels.forEach(function (panel, i) {
    var verb = panel.querySelector('.panel__verb');
    gsap.fromTo(verb, { xPercent: 12 }, { xPercent: -12, ease: 'none',
      scrollTrigger: { trigger: panel, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true } });
    gsap.from(panel.querySelector('.demo'), { rotate: -4, scale: 0.92, ease: 'none',
      scrollTrigger: { trigger: panel, containerAnimation: hTween, start: 'left right', end: 'left 30%', scrub: true } });
    ScrollTrigger.create({ trigger: panel, containerAnimation: hTween, start: 'left 60%', end: 'right 40%',
      onToggle: function (self) { panel.classList.toggle('is-live', self.isActive); if (self.isActive) svn.textContent = '0' + (i + 1); } });
  });
  /* título de servicios */
  var svT = SplitText.create('#sv-t', { type: 'lines', mask: 'lines' });
  gsap.from(svT.lines, { yPercent: 100, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.services', start: 'top 70%' } });

  /* ---------- proceso: tarjetas apiladas ---------- */
  var cards = gsap.utils.toArray('.scard');
  cards.forEach(function (card, i) {
    if (i === cards.length - 1) return;
    gsap.to(card, { scale: 0.93, ease: 'none',
      scrollTrigger: { trigger: cards[i + 1], start: 'top 70%', end: 'top ' + (mobile ? '15%' : '20%'), scrub: true } });
  });
  [['#pr-t', '.process'], ['#fq-t', '.faq'], ['#ct-t', '.outro']].forEach(function (x) {
    var s = SplitText.create(x[0], { type: 'lines', mask: 'lines' });
    gsap.from(s.lines, { yPercent: 100, duration: 1.1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: x[1], start: 'top 75%' } });
  });
  gsap.from('.qa', { y: 40, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: '.faq__list', start: 'top 85%' } });

  /* ---------- cierre: marquesina que reacciona al scroll ---------- */
  var mq = document.getElementById('mq');
  var mqX = 0, vel = 0;
  ScrollTrigger.create({ trigger: '.outro', start: 'top bottom', end: 'bottom top', onUpdate: function (self) { vel = self.getVelocity() / 300; } });
  gsap.ticker.add(function () {
    var w = mq.scrollWidth / 2;
    mqX -= 1.1 + Math.abs(vel); vel *= 0.92;
    if (mqX <= -w) mqX += w;
    gsap.set(mq, { x: mqX, skewX: gsap.utils.clamp(-12, 12, -vel * 2) });
  });
  gsap.from('.orb', { scale: 0.6, rotate: -30, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.outro__in', start: 'top 80%' } });

  /* ---------- botones magnéticos ---------- */
  if (fine) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1,0.4)' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1,0.4)' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), k = el.classList.contains('orb') ? 0.35 : 0.25;
        xTo((e.clientX - r.left - r.width / 2) * k); yTo((e.clientY - r.top - r.height / 2) * k);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });

    /* cursor */
    var cur = document.querySelector('.cursor'), dot = cur.querySelector('.cursor__dot'), ringEl = cur.querySelector('.cursor__ring'), label = cur.querySelector('.cursor__label');
    var dX = gsap.quickTo(dot, 'x', { duration: 0.1 }), dY = gsap.quickTo(dot, 'y', { duration: 0.1 });
    var rX = gsap.quickTo(ringEl, 'x', { duration: 0.5, ease: 'power3' }), rY = gsap.quickTo(ringEl, 'y', { duration: 0.5, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { cur.classList.add('is-on'); dX(e.clientX); dY(e.clientY); rX(e.clientX); rY(e.clientY); }, { passive: true });
    document.querySelectorAll('a, button, summary').forEach(function (el) {
      el.addEventListener('pointerenter', function () {
        cur.classList.add('is-hover');
        var l = el.getAttribute('data-cursor'); if (l) { label.textContent = l; cur.classList.add('has-label'); }
      });
      el.addEventListener('pointerleave', function () { cur.classList.remove('is-hover', 'has-label'); });
    });

    /* texto que se desordena al pasar */
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    document.querySelectorAll('[data-scramble]').forEach(function (el) {
      var orig = el.textContent, raf;
      el.addEventListener('pointerenter', function () {
        var f = 0; cancelAnimationFrame(raf);
        (function step() {
          el.textContent = orig.split('').map(function (c, i) { return i < f / 2 ? orig[i] : chars[Math.floor(Math.random() * 26)]; }).join('');
          f++; if (f / 2 < orig.length) raf = requestAnimationFrame(step); else el.textContent = orig;
        })();
      });
    });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
