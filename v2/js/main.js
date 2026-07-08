/* ============================================================
   main.js — bootstrap
   Owns: renderer, scene, camera, the single RAF render loop,
   resize handling, quality tiering, WebGL/reduced-motion gates,
   pointer tracking, and the FPS watchdog. Delegates the particle
   engine to particles.js and scroll/camera/DOM choreography to
   journey.js — both are called from here each frame.
   ============================================================ */

import * as THREE from 'three';
import { createParticleSystem } from './particles.js';
import { createLineLayer } from './lines.js';
import { createSystemsMap } from './sysmap.js';
import { initJourney } from './journey.js';
import { initArtifacts } from './artifacts.js';

const root = document.documentElement;
const canvas = document.getElementById('v2-scene');

// ?motion=1 forces the full experience, ?motion=0 forces the static
// fallback — overrides the OS-level preference for testing and for
// visitors whose OS setting doesn't reflect what they want here.
const motionOverride = new URLSearchParams(window.location.search).get('motion');
const prefersReducedMotion = motionOverride === '1'
  ? false
  : motionOverride === '0'
    ? true
    : window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function detectWebGL() {
  try {
    const test = document.createElement('canvas');
    const gl = test.getContext('webgl2') || test.getContext('webgl') || test.getContext('experimental-webgl');
    return !!gl;
  } catch (err) {
    return false;
  }
}

function pickTier() {
  const w = window.innerWidth;
  const rawDpr = Math.max(window.devicePixelRatio || 1, 1); // floor: supersample when zoomed out
  if (w < 768) {
    return { count: 50000, dpr: Math.min(rawDpr, 1.5), mobile: true };
  }
  return { count: 200000, dpr: Math.min(rawDpr, 2), mobile: false };
}

const hasWebGL = detectWebGL();

let renderer = null;
let scene = null;
let camera = null;
let particleSystem = null;
let lineLayer = null;
let sysMap = null;
let journeyAPI = null;
let clock = null;
let rafId = null;

// Floor at 1: when the browser is zoomed out devicePixelRatio drops
// below 1 — rendering at ratio 1 supersamples instead of going soft.
function pickDPR() {
  return Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
}

const fpsWindow = [];
let watchdogTriggered = false;

function buildScene(tier) {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.2, 6.2);
  camera.userData.lookTarget = new THREE.Vector3(0, 0, 0);
  camera.lookAt(camera.userData.lookTarget);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(tier.dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  particleSystem = createParticleSystem(tier.count, 'galaxy');
  particleSystem.setDPR(tier.dpr);
  scene.add(particleSystem.object3D);

  // vector ink layer rides inside the particle object so rotation matches
  lineLayer = createLineLayer(particleSystem);
  particleSystem.object3D.add(lineLayer.object3D);

  // Living System Map (chapter 04): flow particles + labels + drill-in
  sysMap = createSystemsMap({ particleSystem, camera });
  if (sysMap.object3D) particleSystem.object3D.add(sysMap.object3D);

  clock = new THREE.Clock();
}

function onResize() {
  if (!renderer || !camera) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  // Browser zoom changes devicePixelRatio — a stale ratio renders the
  // canvas at the wrong resolution and the whole scene goes soft.
  const dpr = pickDPR();
  renderer.setPixelRatio(dpr);
  if (particleSystem) particleSystem.setDPR(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onVisibilityChange() {
  if (document.hidden) {
    stopLoop();
  } else if (!prefersReducedMotion && renderer) {
    startLoop();
  }
}

/* ---------- pointer tracking → world-space repulsion uniform ---------- */
function setupPointer() {
  if (!particleSystem || !camera) return;

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const worldPoint = new THREE.Vector3();

  window.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return; // spec: no pointer repulsion on touch
    ndc.x = (event.clientX / window.innerWidth) * 2 - 1;
    ndc.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.intersectPlane(plane, worldPoint)) {
      particleSystem.setPointer(worldPoint, true);
    }
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    particleSystem.setPointer(worldPoint, false);
  });

  document.addEventListener('pointerup', (event) => {
    if (event.pointerType === 'touch') {
      particleSystem.setPointer(worldPoint, false);
    }
  });
}

/* ---------- render loop ---------- */
function loop() {
  rafId = requestAnimationFrame(loop);

  const rawDt = clock.getDelta();
  const dt = Math.min(rawDt, 0.1);
  const elapsed = clock.getElapsedTime();

  particleSystem.update(dt, elapsed);
  if (lineLayer) lineLayer.update(dt);
  if (sysMap) sysMap.update(dt);
  if (journeyAPI && typeof journeyAPI.update === 'function') {
    journeyAPI.update(dt, elapsed);
  }
  camera.lookAt(camera.userData.lookTarget);

  renderer.render(scene, camera);
  fpsWatchdog(rawDt);
}

function fpsWatchdog(dt) {
  if (watchdogTriggered || dt <= 0) return;
  // Frame gaps > 250ms are browser RAF throttling (occluded window) or
  // one-off hitches, not sustained GPU load — don't let them poison the
  // average and falsely halve quality.
  if (dt > 0.25) return;
  fpsWindow.push(1 / dt);
  if (fpsWindow.length > 120) fpsWindow.shift();
  if (fpsWindow.length >= 120) {
    const avg = fpsWindow.reduce((a, b) => a + b, 0) / fpsWindow.length;
    if (avg < 30) {
      particleSystem.reduceQuality();
      watchdogTriggered = true; // one halving is enough; avoid oscillation
    }
  }
}

function startLoop() {
  if (rafId !== null || !renderer) return;
  clock.start();
  loop();
}

function stopLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/* ---------- reduced-motion: one static frame, no RAF loop ---------- */
function frameStaticCamera() {
  // The mandala lies flat in the XZ plane — the camera must crane
  // overhead or the hero renders as an edge-on smear (the original
  // static frame looked at it from the side). Pull back further on
  // narrow/portrait viewports so the full disc (r≈2.35) stays framed.
  const aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;
  const dist = 6.2 / Math.min(1, Math.max(aspect, 0.45));
  camera.position.set(0, dist, dist * 0.26);
  camera.userData.lookTarget.set(0, 0, 0);
  camera.lookAt(camera.userData.lookTarget);
  camera.updateProjectionMatrix();
}

function renderStaticFrame() {
  const tier = pickTier();
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.userData.lookTarget = new THREE.Vector3(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const dpr = pickDPR();
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  // Static frame renders once — density is cheap here, and the line-art
  // mandala needs it to read as drawn strokes.
  particleSystem = createParticleSystem(Math.min(tier.count, 90000), 'mandala');
  particleSystem.setDPR(dpr);
  particleSystem.update(0, 2.0); // settle shimmer/time uniforms for a pleasant static look
  scene.add(particleSystem.object3D);

  // full-strength vector ink for the hero — this is the crisp layer
  lineLayer = createLineLayer(particleSystem);
  particleSystem.object3D.add(lineLayer.object3D);
  lineLayer.forceShow('mandala');

  frameStaticCamera();
  renderer.render(scene, camera);
  root.classList.add('mandala-active');

  window.addEventListener('resize', () => {
    frameStaticCamera();
    const newDpr = pickDPR();
    renderer.setPixelRatio(newDpr);
    particleSystem.setDPR(newDpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
  });
}

/* ---------- boot ---------- */
function boot() {
  // Chapter-4 accordion is independent of WebGL/motion — wire it in every
  // branch below.
  initArtifacts();

  if (!hasWebGL) {
    root.classList.add('no-webgl');
    // DOM/CSS journey (scroll reveals) still works without particles/camera.
    journeyAPI = initJourney({
      camera: null,
      particleSystem: null,
      reducedMotion: prefersReducedMotion,
      hasWebGL: false,
    });
    return;
  }

  if (prefersReducedMotion) {
    try {
      renderStaticFrame();
    } catch (err) {
      root.classList.add('no-webgl');
    }
    journeyAPI = initJourney({
      camera,
      particleSystem,
      reducedMotion: true,
      hasWebGL: true,
    });
    return;
  }

  try {
    const tier = pickTier();
    buildScene(tier);
  } catch (err) {
    // WebGLRenderer construction failed despite feature detection passing —
    // degrade to the readable no-canvas fallback rather than a blank page.
    root.classList.add('no-webgl');
    journeyAPI = initJourney({
      camera: null,
      particleSystem: null,
      reducedMotion: prefersReducedMotion,
      hasWebGL: false,
    });
    return;
  }

  setupPointer();
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibilityChange);

  root.classList.add('mandala-active');

  journeyAPI = initJourney({
    camera,
    particleSystem,
    reducedMotion: false,
    hasWebGL: true,
  });

  startLoop();
}

boot();

// Debug/tuning handle — harmless in production, invaluable for live tuning.
window.__v2 = {
  get renderer() { return renderer; },
  get scene() { return scene; },
  get camera() { return camera; },
  get particles() { return particleSystem; },
  get journey() { return journeyAPI; },
};
