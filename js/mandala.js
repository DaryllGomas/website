'use strict';

// ================================================================
// LIVING MANDALA — WebGL particle hero
// Ported from mockups/living-mandala.html (approved design).
//
// Safety rails: this entire module is a no-op unless WebGL works,
// the user hasn't asked for reduced motion, and the viewport is
// desktop-sized. If any check fails we bail before touching the
// DOM — the original SVG mandala + existing site behavior stays
// exactly as-is.
// ================================================================
(function () {

  function supportsWebGL() {
    try {
      var canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  // ?motion=1 forces the system ON (preview/testing on machines with OS-level
  // reduced-motion, e.g. Windows "Animation effects" off); ?motion=0 forces OFF.
  var motionOverride = null;
  try {
    motionOverride = new URLSearchParams(window.location.search).get('motion');
  } catch (e) { /* ancient browser — no override */ }

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (motionOverride === '1') prefersReducedMotion = false;
  if (motionOverride === '0') prefersReducedMotion = true;
  var isMobileViewport = window.innerWidth < 768;
  var hasDeps = typeof THREE !== 'undefined' &&
    typeof gsap !== 'undefined' &&
    typeof ScrollTrigger !== 'undefined' &&
    typeof Lenis !== 'undefined';

  if (prefersReducedMotion || isMobileViewport || !hasDeps || !supportsWebGL()) {
    return; // do nothing — fallback stays exactly as shipped
  }

  var canvas = document.getElementById('scene');
  if (!canvas) return;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true });
  } catch (e) {
    return; // WebGL context creation failed — leave everything untouched
  }

  // ---- We're committed: boot the system ----
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // transparent — site's ambient-bg shows through

  document.documentElement.classList.add('mandala-active');
  var staticMandala = document.querySelector('.hero .mandala');
  if (staticMandala) staticMandala.classList.add('mandala--static-hidden');

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 50);
  camera.position.z = 3.1;

  // =========================================================
  // Build mandala target positions — reuses the exact geometry
  // generation from the site's own hero SVG (viewBox 800x800),
  // scaled/centered into world space.
  // =========================================================
  var S = 1 / 230;
  var pts = [];
  function ring(cx, cy, r, count, layer, size, z) {
    for (var i = 0; i < count; i++) {
      var a = (i / count) * Math.PI * 2;
      pts.push({
        x: (cx + Math.cos(a) * r - 400) * S,
        y: -(cy + Math.sin(a) * r - 400) * S,
        z: z, layer: layer, size: size
      });
    }
  }
  function ellipsePetal(rx, ry, rotDeg, count, layer, size, z) {
    var rot = rotDeg * Math.PI / 180;
    for (var i = 0; i < count; i++) {
      var a = (i / count) * Math.PI * 2;
      var x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      var xr = x * Math.cos(rot) - y * Math.sin(rot);
      var yr = x * Math.sin(rot) + y * Math.cos(rot);
      pts.push({ x: xr * S, y: -yr * S, z: z, layer: layer, size: size });
    }
  }
  // teardrop lotus petal: quadratic bezier M400,220 Q430,300 400,380 mirrored
  function lotusPetal(rotDeg, count, layer, size, z) {
    var rot = rotDeg * Math.PI / 180;
    for (var i = 0; i < count; i++) {
      var t = i / (count - 1);
      var side = i % 2 === 0 ? 1 : -1;
      var mt = 1 - t;
      var x = mt * mt * 400 + 2 * mt * t * (400 + 30 * side) + t * t * 400;
      var y = mt * mt * 220 + 2 * mt * t * 300 + t * t * 380;
      x -= 400; y -= 400;
      var xr = x * Math.cos(rot) - y * Math.sin(rot);
      var yr = x * Math.sin(rot) + y * Math.cos(rot);
      pts.push({ x: xr * S, y: -yr * S, z: z, layer: layer, size: size });
    }
  }

  // Layer 1 — outer rings (z far back)
  ring(400, 400, 380, 900, 0, 1.0, 0.00);
  ring(400, 400, 360, 700, 0, 0.8, 0.00);
  ring(400, 400, 380, 24, 0, 2.6, 0.00);   // bright dots
  // Layer 2 — petal ring
  ring(400, 400, 290, 600, 1, 0.9, 0.12);
  for (var r1 = 0; r1 < 12; r1++) ellipsePetal(180, 80, r1 * 15, 260, 1, 0.85, 0.12);
  // Layer 3 — inner ring + lotus
  ring(400, 400, 200, 450, 2, 0.9, 0.24);
  ring(400, 400, 180, 400, 2, 0.8, 0.24);
  for (var r2 = 0; r2 < 8; r2++) lotusPetal(r2 * 45, 220, 2, 1.0, 0.24);
  ring(400, 400, 200, 16, 2, 2.2, 0.24);
  // Layer 4 — core
  ring(400, 400, 100, 300, 3, 0.9, 0.36);
  ring(400, 400, 60, 220, 3, 1.0, 0.36);
  ring(400, 400, 30, 140, 3, 1.1, 0.36);
  ring(400, 400, 8, 40, 3, 1.6, 0.36);
  ring(400, 400, 2, 10, 3, 3.0, 0.36);

  var N = pts.length;

  // =========================================================
  // Second target set: ambient constellation the particles
  // morph into after the fly-through, and stay in for the
  // rest of the page.
  // =========================================================
  var targets2 = new Float32Array(N * 3);
  (function () {
    for (var i = 0; i < N; i++) {
      var rr = Math.pow(Math.random(), 0.5);
      var a = Math.random() * Math.PI * 2;
      var spread = 4.2;
      targets2[i * 3] = Math.cos(a) * rr * spread * (0.9 + Math.random() * 0.4);
      targets2[i * 3 + 1] = Math.sin(a) * rr * spread * 0.62;
      targets2[i * 3 + 2] = -1.6 - Math.random() * 1.8;
    }
    var nodes = [[-1.8, 0.9], [-0.6, 1.25], [0.9, 1.1], [1.9, 0.55], [-1.4, -0.85], [0.2, -1.15], [1.5, -0.8]];
    for (var k = 0; k < 2200; k++) {
      var idx = Math.floor(Math.random() * N);
      var nd = nodes[Math.floor(Math.random() * nodes.length)];
      targets2[idx * 3] = nd[0] + (Math.random() - 0.5) * 0.22;
      targets2[idx * 3 + 1] = nd[1] + (Math.random() - 0.5) * 0.22;
      targets2[idx * 3 + 2] = -1.7 - Math.random() * 0.5;
    }
  })();

  // =========================================================
  // Geometry + shader
  // =========================================================
  var geo = new THREE.BufferGeometry();
  var target1 = new Float32Array(N * 3);
  var layers = new Float32Array(N);
  var sizes = new Float32Array(N);
  var seeds = new Float32Array(N);
  var colors = new Float32Array(N * 3);

  var cCyan = new THREE.Color(0x00d4ff);
  var cPurple = new THREE.Color(0x7b2ff2);
  var cWhite = new THREE.Color(0xdff6ff);

  for (var i2 = 0; i2 < N; i2++) {
    var p = pts[i2];
    target1[i2 * 3] = p.x;
    target1[i2 * 3 + 1] = p.y;
    target1[i2 * 3 + 2] = p.z;
    layers[i2] = p.layer;
    sizes[i2] = p.size;
    seeds[i2] = Math.random();

    var rad = Math.min(Math.hypot(p.x, p.y) / 1.68, 1);
    var col = cPurple.clone().lerp(cCyan, rad); // purple core -> cyan edge
    if (Math.random() > 0.93) col.lerp(cWhite, 0.7);
    colors[i2 * 3] = col.r;
    colors[i2 * 3 + 1] = col.g;
    colors[i2 * 3 + 2] = col.b;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(target1, 3)); // required by three
  geo.setAttribute('aTarget1', new THREE.BufferAttribute(target1, 3));
  geo.setAttribute('aTarget2', new THREE.BufferAttribute(targets2, 3));
  geo.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

  var mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uT: { value: 0 },
      uMorph: { value: 0 },
      uMouse: { value: new THREE.Vector2(99, 99) },
      uMouseStr: { value: 1.0 },
      uPx: { value: renderer.getPixelRatio() * window.innerHeight / 800 }
    },
    vertexShader: [
      'attribute vec3 aTarget1;',
      'attribute vec3 aTarget2;',
      'attribute float aLayer;',
      'attribute float aSize;',
      'attribute float aSeed;',
      'attribute vec3 aColor;',
      'uniform float uT;',
      'uniform float uMorph;',
      'uniform vec2 uMouse;',
      'uniform float uMouseStr;',
      'uniform float uPx;',
      'varying vec3 vColor;',
      'varying float vAlpha;',
      '',
      'void main() {',
      '  float dir = mod(aLayer, 2.0) < 1.0 ? 1.0 : -1.0;',
      '  float speed = 0.03 + aLayer * 0.018;',
      '  float ang = uT * speed * dir * (1.0 - uMorph);',
      '  float ca = cos(ang), sa = sin(ang);',
      '',
      '  vec3 p = aTarget1;',
      '  p.xy = mat2(ca, -sa, sa, ca) * p.xy;',
      '',
      '  float breath = 1.0 + 0.022 * sin(uT * 0.7 + aLayer * 1.7);',
      '  p.xy *= breath;',
      '',
      '  p.x += 0.008 * sin(uT * 0.9 + aSeed * 40.0);',
      '  p.y += 0.008 * cos(uT * 1.1 + aSeed * 55.0);',
      '',
      '  p = mix(p, aTarget2, smoothstep(0.0, 1.0, uMorph));',
      '',
      '  float md = distance(p.xy, uMouse);',
      '  float force = exp(-md * 4.2) * 0.30 * uMouseStr;',
      '  vec2 dirv = md > 0.0001 ? normalize(p.xy - uMouse) : vec2(0.0);',
      '  p.xy += dirv * force;',
      '',
      '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
      '  gl_Position = projectionMatrix * mv;',
      '  float persp = 300.0 / max(-mv.z, 0.05);',
      '  gl_PointSize = clamp(aSize * uPx * persp * 0.02, 0.6, 26.0);',
      '',
      '  float tw = 0.75 + 0.25 * sin(uT * (1.0 + aSeed * 3.0) + aSeed * 80.0);',
      '  float near = smoothstep(0.05, 0.45, -mv.z);',
      '  vAlpha = tw * near;',
      '  vColor = aColor;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform float uMorph;',
      'varying vec3 vColor;',
      'varying float vAlpha;',
      'void main() {',
      '  vec2 c = gl_PointCoord - 0.5;',
      '  float d = length(c);',
      '  if (d > 0.5) discard;',
      '  float a = smoothstep(0.5, 0.05, d);',
      // Constellation state renders at ~half the mockup's brightness
      // so page copy (about/skills/achievements/projects/contact)
      // stays readable once the canvas becomes an ambient backdrop.
      '  float ambient = mix(1.0, 0.5, uMorph);',
      '  gl_FragColor = vec4(vColor, a * vAlpha * 0.85 * ambient);',
      '}'
    ].join('\n')
  });

  var points = new THREE.Points(geo, mat);
  scene.add(points);

  // =========================================================
  // Cursor magnetic field — ported 1:1 from the mockup.
  // =========================================================
  var mouseTarget = new THREE.Vector2(99, 99);
  var mouseSmooth = new THREE.Vector2(99, 99);

  function onMouseMove(e) {
    var ndcX = (e.clientX / window.innerWidth) * 2 - 1;
    var ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
    var dist = camera.position.z;
    var halfH = Math.tan((camera.fov * Math.PI / 180) / 2) * dist;
    var halfW = halfH * camera.aspect;
    mouseTarget.set(ndcX * halfW, ndcY * halfH);
  }
  window.addEventListener('mousemove', onMouseMove);

  // =========================================================
  // Lenis smooth scroll wired to ScrollTrigger.
  // =========================================================
  var lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);

  // Nav anchors still need to work — intercept in-page hash links
  // and drive them through Lenis instead of native jump/CSS smooth
  // scroll (main.js has no anchor handler of its own to conflict with).
  var anchors = document.querySelectorAll('a[href^="#"]');
  anchors.forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href.length < 2) return;
    var target = document.querySelector(href);
    if (!target) return;
    a.addEventListener('click', function (e) {
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0 });
    });
  });

  // =========================================================
  // Scroll-driven choreography — progress computed over the
  // hero section only. Past the hero, progress stays clamped
  // at 1 and the mandala remains in its constellation state.
  // =========================================================
  var prog = 0;
  var heroEl = document.getElementById('hero');
  ScrollTrigger.create({
    trigger: heroEl,
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: function (self) { prog = self.progress; }
  });

  // Name entrance — blur-in with letter tracking (keeps the shimmer gradient seamless)
  gsap.fromTo('.hero-name',
    { opacity: 0, scale: 1.18, filter: 'blur(22px)', letterSpacing: '0.35em' },
    { opacity: 1, scale: 1, filter: 'blur(0px)', letterSpacing: '0.01em', duration: 2.0, ease: 'expo.out', delay: 0.5 });
  gsap.fromTo('.hero-greeting, .hero-title, .hero-line, .hero-scroll-indicator',
    { opacity: 0 }, { opacity: 1, duration: 1.6, delay: 1.5, stagger: 0.2 });

  var heroContent = document.querySelector('.hero-content');
  var heroScroll = document.querySelector('.hero-scroll-indicator');

  // =========================================================
  // Render loop — scroll drives: camera dive (0→0.55),
  // morph to constellation (0.5→0.82), hero fade-out (0→0.16)
  // =========================================================
  var t0 = performance.now();
  var rafId = null;
  var isHidden = false;

  document.addEventListener('visibilitychange', function () {
    isHidden = document.hidden;
    if (!isHidden && rafId === null) {
      rafId = requestAnimationFrame(frame);
    }
  });

  function frame() {
    if (isHidden) { rafId = null; return; }

    var t = (performance.now() - t0) / 1000;
    mouseSmooth.lerp(mouseTarget, 0.08);

    // --- camera dive through the core ---
    // Tightened pacing vs the mockup: on the real site the hero shaft is
    // long real-scroll, so the dive completes sooner and the constellation
    // forms AHEAD of the camera while still flying — no dead black stretch.
    var dive = gsap.utils.clamp(0, 1, prog / 0.42);
    var diveEase = dive * dive * (3 - 2 * dive); // smoothstep
    camera.position.z = 3.1 - diveEase * 3.35;   // 3.1 -> -0.25 (through!)

    // after fly-through, pull back to view the constellation
    var settle = gsap.utils.clamp(0, 1, (prog - 0.42) / 0.30);
    var settleEase = settle * settle * (3 - 2 * settle);
    if (settle > 0) camera.position.z = -0.25 + settleEase * 2.45; // -> 2.2

    // --- morph --- (starts mid-dive so stars are already out there)
    mat.uniforms.uMorph.value = gsap.utils.clamp(0, 1, (prog - 0.26) / 0.34);
    mat.uniforms.uT.value = t;
    mat.uniforms.uMouse.value.copy(mouseSmooth);
    mat.uniforms.uMouseStr.value = 1.0 - mat.uniforms.uMorph.value * 0.5;

    // --- hero overlay fade/scale/blur, applied to the pinned
    //     hero-content and the scroll indicator together ---
    var heroFade = gsap.utils.clamp(0, 1, prog / 0.16);
    var heroOpacity = (1 - heroFade).toFixed(3);
    var heroScale = 1 + heroFade * 0.35;
    var heroBlur = (heroFade * 10).toFixed(1);
    if (heroContent) {
      heroContent.style.opacity = heroOpacity;
      heroContent.style.filter = 'blur(' + heroBlur + 'px)';
      heroContent.style.transform = 'translate(-50%, -50%) scale(' + heroScale + ')';
    }
    if (heroScroll) {
      heroScroll.style.opacity = heroOpacity;
      heroScroll.style.filter = 'blur(' + heroBlur + 'px)';
      heroScroll.style.transform = 'translateX(-50%) scale(' + heroScale + ')';
    }

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mat.uniforms.uPx.value = renderer.getPixelRatio() * window.innerHeight / 800;
    ScrollTrigger.refresh();
  });
})();
