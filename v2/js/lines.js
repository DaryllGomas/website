/* ============================================================
   lines.js — the crisp vector "ink" layer.
   Each settled shape's skeleton renders as real 1px GPU hairlines
   (THREE.LineSegments) — SVG-sharp, like the original v1 mandala.
   While the particle system is morphing, the ink fades out and the
   particles carry the motion; when the shape settles, its skeleton
   fades back in. Added as a CHILD of the particle object so ambient
   rotation and facing-easing stay perfectly in sync.
   ============================================================ */

import * as THREE from 'three';
import { LINES } from './morphs.js';

const CYAN = new THREE.Color('#00d4ff');
const VIOLET = new THREE.Color('#7b2ff2');
const tmp = new THREE.Color();

/* vertex colors mirror the particle shader's radius blend, lifted
   toward white so hairlines read bright over the dark void */
function colorsFor(positions) {
  const colors = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const r = Math.hypot(positions[i], positions[i + 2]);
    const t = Math.min(Math.max(r / 3.2, 0), 1);
    tmp.copy(CYAN).lerp(VIOLET, t).lerp(new THREE.Color('#ffffff'), 0.35);
    colors[i] = tmp.r; colors[i + 1] = tmp.g; colors[i + 2] = tmp.b;
  }
  return colors;
}

export function createLineLayer(particleSystem) {
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const object3D = new THREE.LineSegments(geometry, material);
  object3D.frustumCulled = false;
  object3D.visible = false;

  let builtFor = null;
  let settledOpacity = 0;

  function buildFor(name) {
    const spec = LINES[name];
    const positions = spec.build();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorsFor(positions), 3));
    geometry.computeBoundingSphere();
    builtFor = name;
    settledOpacity = spec.opacity;
  }

  function update(dt) {
    const name = particleSystem.currentTarget;
    const spec = LINES[name];
    let target = 0;

    if (spec && !particleSystem.isAnimating) {
      if (builtFor !== name) {
        buildFor(name);
        material.opacity = 0;
      }
      target = settledOpacity;
    }

    // fade out fast (shape is dissolving), breathe in slow (ink settling)
    const speed = target > material.opacity ? 1.4 : 5.0;
    material.opacity += (target - material.opacity) * Math.min(dt * speed, 1);
    object3D.visible = material.opacity > 0.015;

    // The mandala chapter breathes the particles radially (uPulseAmt in
    // the vertex shader). The ink must breathe in perfect sync or the
    // particle rings slide off the vector rings — a visible double image.
    const u = particleSystem.uniforms;
    const pulse = 1 + Math.sin(u.uTime.value * 0.6) * 0.035 * u.uPulseAmt.value;
    object3D.scale.set(pulse, 1, pulse);
  }

  /* static (reduced-motion) mode: show a shape's ink at full strength
     immediately — there is no RAF loop to fade it in */
  function forceShow(name) {
    if (!LINES[name]) return;
    buildFor(name);
    material.opacity = settledOpacity;
    object3D.visible = true;
  }

  return { object3D, update, forceShow };
}
