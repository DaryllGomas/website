/* ============================================================
   particles.js — the particle engine
   Geometry (aFrom/aTo/aSeed), custom ShaderMaterial, and morph
   blending/queueing. main.js owns the renderer + RAF loop and
   calls update(dt, elapsed) once per frame; journey.js calls
   morphTo(name) on chapter transitions.
   ============================================================ */

import * as THREE from 'three';
import { GENERATORS } from './morphs.js';

const VERTEX_SHADER = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aSeed;

  uniform float uProgress;
  uniform float uTime;
  uniform vec3 uPointer;
  uniform float uPointerActive;
  uniform float uSize;
  uniform float uDPR;
  uniform float uPulseAmt;

  varying float vSeed;
  varying float vRadius;
  varying float vDepthAtten;

  void main() {
    vSeed = aSeed;

    // per-particle staggered morph — ripple instead of snap
    float staggerT = clamp(uProgress * 1.4 - aSeed * 0.4, 0.0, 1.0);
    float e = smoothstep(0.0, 1.0, staggerT);
    vec3 pos = mix(aFrom, aTo, e);

    // gentle ambient drift — amplitude must stay well below the finest
    // structural detail in the morph targets (rings/petals jitter ~0.01),
    // or the drift smears the geometry into fog. Life, not blur.
    float driftT = uTime * 0.12 + aSeed * 6.2831853;
    pos.x += sin(driftT + aSeed * 3.1) * 0.028;
    pos.y += cos(driftT * 1.3 + aSeed * 5.7) * 0.028;
    pos.z += sin(driftT * 0.7 + aSeed * 2.4) * 0.02;

    // radial breathing pulse — ramped in/out per chapter via uPulseAmt
    float pulse = 1.0 + sin(uTime * 0.6) * 0.035 * uPulseAmt;
    pos.xz *= pulse;

    // cursor repulsion (world-space radial falloff push)
    vec3 toPos = pos - uPointer;
    float dist = length(toPos);
    float falloff = smoothstep(1.4, 0.0, dist);
    pos += normalize(toPos + 0.0001) * falloff * 0.55 * uPointerActive;

    vRadius = length(pos.xz);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Scene scale is small (particles sit ~4-9 units from camera), so the
    // attenuation reference distance is tuned to that range, not the
    // hundreds-of-units convention used for large open scenes.
    float depthAtten = 9.0 / max(-mvPosition.z, 0.001);
    gl_PointSize = clamp(uSize * uDPR * depthAtten, 1.0, 48.0);
    vDepthAtten = clamp(depthAtten, 0.15, 2.5);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;

  varying float vSeed;
  varying float vRadius;
  varying float vDepthAtten;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    // Star profile: bright crisp core + faint wide halo. A single soft
    // falloff (the old profile) turns 200k additive points into bloom
    // soup; the hard core is what keeps fine geometry legible.
    float core = smoothstep(0.18, 0.05, d);
    float halo = smoothstep(0.5, 0.14, d) * 0.3;
    float alpha = core + halo;
    if (alpha < 0.02) discard;

    float mixT = clamp(vRadius / 3.2, 0.0, 1.0);
    float shimmer = 0.5 + 0.5 * sin(uTime * 0.6 + vSeed * 12.0);
    vec3 color = mix(uColorA, uColorB, mixT) + shimmer * 0.05;

    gl_FragColor = vec4(color, alpha * 0.9 * clamp(vDepthAtten, 0.2, 1.0));
  }
`;

/**
 * @param {number} count - particle count (also the allocated buffer size;
 *   quality-tier and FPS-watchdog reductions only shrink drawRange).
 * @param {string} initialTarget - key into GENERATORS, e.g. 'galaxy'
 */
export function createParticleSystem(count, initialTarget = 'galaxy') {
  const generate = GENERATORS[initialTarget] || GENERATORS.galaxy;
  const seedArray = new Float32Array(count);
  for (let i = 0; i < count; i++) seedArray[i] = Math.random();

  const fromArray = generate(count);
  const toArray = fromArray.slice();

  const geometry = new THREE.BufferGeometry();
  // 'position' shares the aFrom buffer purely so three.js internals
  // (drawRange/dataCount) have a valid attribute to read; the shader
  // never reads gl_Position from it — aFrom/aTo drive everything.
  const positionAttr = new THREE.BufferAttribute(fromArray, 3);
  const fromAttr = new THREE.BufferAttribute(fromArray, 3);
  const toAttr = new THREE.BufferAttribute(toArray, 3);
  const seedAttr = new THREE.BufferAttribute(seedArray, 1);

  geometry.setAttribute('position', positionAttr);
  geometry.setAttribute('aFrom', fromAttr);
  geometry.setAttribute('aTo', toAttr);
  geometry.setAttribute('aSeed', seedAttr);
  geometry.setDrawRange(0, count);

  const uniforms = {
    uProgress: { value: 1 },
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector3(9999, 9999, 9999) },
    uPointerActive: { value: 0 },
    // Sized for the star profile above: the visible core is ~1/3 of the
    // point sprite, so the sprite runs larger than the old soft-blob tuning.
    uSize: { value: 3.0 },
    uDPR: { value: 1 },
    uPulseAmt: { value: 0 },
    uColorA: { value: new THREE.Color('#00d4ff') },
    uColorB: { value: new THREE.Color('#7b2ff2') },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  let currentTargetName = initialTarget;
  let pendingTarget = null;
  let animating = false;
  let animT = 0;
  const ANIM_DURATION = 2.2; // seconds — one blend in flight, per spec

  function startMorph(name) {
    const gen = GENERATORS[name];
    if (!gen) return;
    const nextArr = gen(count);
    toAttr.array.set(nextArr);
    toAttr.needsUpdate = true;
    uniforms.uProgress.value = 0;
    animating = true;
    animT = 0;
    currentTargetName = name;
  }

  function morphTo(name) {
    if (!GENERATORS[name]) return;
    if (name === currentTargetName && !animating) {
      pendingTarget = null;
      return;
    }
    if (animating) {
      pendingTarget = name;
      return;
    }
    startMorph(name);
  }

  function update(dt, elapsed) {
    uniforms.uTime.value = elapsed;
    if (!animating) return;

    animT += dt / ANIM_DURATION;
    if (animT >= 1) {
      uniforms.uProgress.value = 1;
      // swap aTo into aFrom — the completed shape becomes the new base
      fromAttr.array.set(toAttr.array);
      fromAttr.needsUpdate = true;
      animating = false;
      if (pendingTarget) {
        const next = pendingTarget;
        pendingTarget = null;
        startMorph(next);
      }
    } else {
      uniforms.uProgress.value = animT;
    }
  }

  function setPointer(vec3, active) {
    uniforms.uPointer.value.copy(vec3);
    uniforms.uPointerActive.value = active ? 1 : 0;
  }

  function setDPR(dpr) {
    uniforms.uDPR.value = dpr;
  }

  /** Halve the visible particle count without touching buffers. Returns new count. */
  function reduceQuality() {
    const cur = geometry.drawRange.count === Infinity ? count : geometry.drawRange.count;
    const next = Math.max(4000, Math.floor(cur / 2));
    geometry.setDrawRange(0, next);
    return next;
  }

  return {
    object3D: points,
    geometry,
    material,
    uniforms,
    count,
    morphTo,
    update,
    setPointer,
    setDPR,
    reduceQuality,
    get currentTarget() {
      return currentTargetName;
    },
  };
}
