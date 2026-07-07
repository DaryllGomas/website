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
import { initJourney } from './journey.js';

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
  const rawDpr = window.devicePixelRatio || 1;
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
let journeyAPI = null;
let clock = null;
let rafId = null;

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

  clock = new THREE.Clock();
}

function onResize() {
  if (!renderer || !camera) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
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

  const dt = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.getElapsedTime();

  particleSystem.update(dt, elapsed);
  if (journeyAPI && typeof journeyAPI.update === 'function') {
    journeyAPI.update(dt, elapsed);
  }
  camera.lookAt(camera.userData.lookTarget);

  renderer.render(scene, camera);
  fpsWatchdog(dt);
}

function fpsWatchdog(dt) {
  if (watchdogTriggered || dt <= 0) return;
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
function renderStaticFrame() {
  const tier = pickTier();
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.4, 5.6);
  camera.userData.lookTarget = new THREE.Vector3(0, 0, 0);
  camera.lookAt(camera.userData.lookTarget);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  particleSystem = createParticleSystem(Math.min(tier.count, 60000), 'mandala');
  particleSystem.setDPR(1);
  particleSystem.update(0, 2.0); // settle shimmer/time uniforms for a pleasant static look
  scene.add(particleSystem.object3D);

  renderer.render(scene, camera);
  root.classList.add('mandala-active');

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
  });
}

/* ---------- boot ---------- */
function boot() {
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
