/* ============================================================
   sysmap.js — the Living System Map (chapter 04).
   The particle field morphs into the Namkuzu-da OS diagram
   (osmap) and, on clicking the brain, blooms into the honest
   44-system inventory (sysbloom). This module owns everything
   the shapes themselves can't express:

     · flow particles streaming along the map's edges (data
       visibly moving in and out of the brain — GPU bezier)
     · DOM labels projected from the same world-space layout
       the ink and particles are built from
     · hover cards fed by systems-data.js
     · the drill-in / back navigation and the list toggle

   Everything keys off particleSystem.currentTarget + isAnimating
   (same contract lines.js uses): UI exists only while a map shape
   is settled, and dissolves the moment the journey moves on.
   ============================================================ */

import * as THREE from 'three';
import { osmapLayout, sysbloomLayout } from './morphs.js';
import { SYSTEMS_DATA } from './systems-data.js';

const FLOW_VERT = /* glsl */ `
  attribute vec3 aA;
  attribute vec3 aC;
  attribute vec3 aB;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aSize;
  uniform float uTime;
  uniform float uDPR;
  varying float vT;
  void main() {
    float t = fract(aPhase + uTime * aSpeed);
    vT = t;
    vec3 p = mix(mix(aA, aC, t), mix(aC, aB, t), t);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * uDPR * (9.0 / max(-mv.z, 0.001)), 1.0, 14.0);
  }
`;

const FLOW_FRAG = /* glsl */ `
  uniform float uOpacity;
  varying float vT;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = smoothstep(0.28, 0.06, d);
    if (core < 0.02) discard;
    // ease in from the start point, ease out into the destination
    float travel = smoothstep(0.0, 0.1, vT) * smoothstep(1.0, 0.92, vT);
    gl_FragColor = vec4(0.62, 0.93, 1.0, core * travel * uOpacity);
  }
`;

function buildFlowPoints(edges, perEdge, sizeRange, speedRange) {
  const n = edges.length * perEdge;
  const aA = new Float32Array(n * 3);
  const aC = new Float32Array(n * 3);
  const aB = new Float32Array(n * 3);
  const aPhase = new Float32Array(n);
  const aSpeed = new Float32Array(n);
  const aSize = new Float32Array(n);
  let i = 0;
  for (const e of edges) {
    for (let k = 0; k < perEdge; k++, i++) {
      aA.set(e.a, i * 3);
      aC.set(e.c, i * 3);
      aB.set(e.b, i * 3);
      aPhase[i] = Math.random();
      aSpeed[i] = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
      aSize[i] = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
    }
  }
  const g = new THREE.BufferGeometry();
  // dummy position attribute so three.js internals have a draw count
  g.setAttribute('position', new THREE.BufferAttribute(aA.slice(), 3));
  g.setAttribute('aA', new THREE.BufferAttribute(aA, 3));
  g.setAttribute('aC', new THREE.BufferAttribute(aC, 3));
  g.setAttribute('aB', new THREE.BufferAttribute(aB, 3));
  g.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
  g.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
  g.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
  return g;
}

export function createSystemsMap({ particleSystem, camera }) {
  const layer = document.getElementById('sysmap-layer');
  const backBtn = document.getElementById('map-back');
  const listBtn = document.getElementById('map-list-toggle');
  const chapter = document.getElementById('chapter-4');
  if (!layer || !chapter) return { object3D: null, update() {} };

  const mapL = osmapLayout();
  const bloomL = sysbloomLayout();
  const nodeInfo = Object.fromEntries(SYSTEMS_DATA.nodes.map((n) => [n.id, n]));
  const systemInfo = Object.fromEntries(SYSTEMS_DATA.systems.map((s) => [s.id, s]));
  const catInfo = Object.fromEntries(SYSTEMS_DATA.categories.map((c) => [c.id, c]));

  /* ---------- flow layer (two prebuilt streams) ---------- */
  const uniforms = {
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uDPR: { value: Math.min(Math.max(window.devicePixelRatio || 1, 1), 2) },
  };
  const flowMaterial = new THREE.ShaderMaterial({
    vertexShader: FLOW_VERT,
    fragmentShader: FLOW_FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mapFlow = new THREE.Points(buildFlowPoints(mapL.edges, 34, [2.4, 4.2], [0.05, 0.13]), flowMaterial);
  const bloomFlow = new THREE.Points(buildFlowPoints(bloomL.spines, 26, [2.0, 3.4], [0.06, 0.15]), flowMaterial);
  mapFlow.frustumCulled = false;
  bloomFlow.frustumCulled = false;
  mapFlow.visible = false;
  bloomFlow.visible = false;
  const object3D = new THREE.Group();
  object3D.add(mapFlow);
  object3D.add(bloomFlow);

  /* ---------- DOM: labels + card ---------- */
  function mkLabel(cls, text) {
    const el = document.createElement('div');
    el.className = 'sysmap-label ' + cls;
    el.textContent = text;
    layer.appendChild(el);
    return el;
  }

  // label spec: {el, x, y, level}
  const labels = [];
  labels.push({ el: mkLabel('sysmap-label--brain', SYSTEMS_DATA.brain.name), x: mapL.brain.x, y: mapL.brain.y - 0.62, level: 'osmap' });
  labels.push({ el: mkLabel('sysmap-label--sub', SYSTEMS_DATA.brain.sub), x: mapL.brain.x, y: mapL.brain.y - 0.8, level: 'osmap' });
  labels.push({ el: mkLabel('sysmap-label--sub', 'INPUTS'), x: mapL.nodes[0].x, y: 1.78, level: 'osmap' });
  labels.push({ el: mkLabel('sysmap-label--sub', 'OUTPUTS'), x: mapL.nodes[4].x, y: 1.78, level: 'osmap' });
  const nodeLabels = {};
  for (const nd of mapL.nodes) {
    const info = nodeInfo[nd.id];
    const lbl = { el: mkLabel('', info ? info.name : nd.id), x: nd.x, y: nd.y + nd.r + 0.17, level: 'osmap' };
    nodeLabels[nd.id] = lbl;
    labels.push(lbl);
  }
  labels.push({ el: mkLabel('sysmap-label--brain', 'THE SYSTEMS INSIDE'), x: bloomL.hub.x, y: bloomL.hub.y - 0.42, level: 'sysbloom' });
  for (const c of bloomL.cats) {
    labels.push({ el: mkLabel('sysmap-label--cat', c.name), x: c.x, y: c.y + c.r + 0.14, level: 'sysbloom' });
  }

  const card = document.createElement('div');
  card.className = 'sysmap-card';
  layer.appendChild(card);

  /* ---------- hover targets ---------- */
  const mapTargets = [
    { kind: 'brain', x: mapL.brain.x, y: mapL.brain.y, r: mapL.brain.r },
    ...mapL.nodes.map((nd) => ({ kind: 'node', id: nd.id, x: nd.x, y: nd.y, r: nd.r })),
  ];
  const bloomTargets = [
    ...bloomL.systems.map((s) => ({ kind: 'system', id: s.id, x: s.x, y: s.y, r: Math.max(s.r, 0.09) })),
    ...bloomL.cats.map((c) => ({ kind: 'cat', id: c.id, x: c.x, y: c.y + c.r + 0.14, r: 0.16 })),
  ];

  /* ---------- state ---------- */
  let uiAlpha = 0;
  let hovered = null;
  const mouse = { x: -1, y: -1, inside: false };
  const proj = new THREE.Vector3();

  window.addEventListener('pointermove', (ev) => {
    mouse.x = ev.clientX;
    mouse.y = ev.clientY;
    mouse.inside = true;
  }, { passive: true });

  function activeName() {
    return particleSystem.currentTarget;
  }
  function settled() {
    return !particleSystem.isAnimating;
  }
  function listMode() {
    return chapter.classList.contains('show-list');
  }
  function mapVisible() {
    const n = activeName();
    return (n === 'osmap' || n === 'sysbloom') && settled() && !listMode();
  }

  function toScreen(x, y) {
    proj.set(x, y, 0);
    particleSystem.object3D.localToWorld(proj);
    proj.project(camera);
    if (proj.z > 1) return null;
    return { x: (proj.x * 0.5 + 0.5) * window.innerWidth, y: (-proj.y * 0.5 + 0.5) * window.innerHeight };
  }

  function pickHover() {
    if (!mouse.inside || !mapVisible()) return null;
    const targets = activeName() === 'osmap' ? mapTargets : bloomTargets;
    let best = null;
    let bestD = 1e9;
    for (const t of targets) {
      const s = toScreen(t.x, t.y);
      if (!s) continue;
      const d = Math.hypot(s.x - mouse.x, s.y - mouse.y);
      const rr = toScreen(t.x + t.r, t.y);
      const rPx = rr ? Math.max(26, Math.abs(rr.x - s.x) * 1.3) : 30;
      if (d < rPx && d < bestD) { best = t; bestD = d; }
    }
    return best;
  }

  function cardHtml(t) {
    if (t.kind === 'brain') {
      const b = SYSTEMS_DATA.brain;
      return `<div class="sysmap-card-name">${b.name} <span class="sysmap-card-status sysmap-card-status--live">live</span></div><div class="sysmap-card-desc">${b.desc}</div>`;
    }
    if (t.kind === 'node') {
      const n = nodeInfo[t.id];
      if (!n) return '';
      return `<div class="sysmap-card-name">${n.name}</div><div class="sysmap-card-desc">${n.desc}</div>`;
    }
    if (t.kind === 'cat') {
      const c = catInfo[t.id];
      const count = SYSTEMS_DATA.systems.filter((s) => s.cat === t.id).length;
      return `<div class="sysmap-card-name">${c.name}</div><div class="sysmap-card-desc">${count} systems in this family — hover the dots to meet them.</div>`;
    }
    const s = systemInfo[t.id];
    if (!s) return '';
    const tags = (s.skills || []).map((k) => `<span class="sysmap-tag">${k}</span>`).join('');
    return `<div class="sysmap-card-name">${s.name} <span class="sysmap-card-status sysmap-card-status--${s.status}">${s.status}</span></div>`
      + `<div class="sysmap-card-desc">${s.desc}</div>`
      + (tags ? `<div class="sysmap-card-tags">${tags}</div>` : '');
  }

  /* ---------- navigation ---------- */
  function goBloom() {
    particleSystem.morphTo('sysbloom');
    if (backBtn) backBtn.hidden = false;
  }
  function goMap() {
    particleSystem.morphTo('osmap');
    if (backBtn) backBtn.hidden = true;
  }

  window.addEventListener('click', (ev) => {
    if (!mapVisible()) return;
    // ignore clicks on real UI (buttons, links, catalog)
    if (ev.target.closest('button, a, .artifact-catalog-wrap')) return;
    mouse.x = ev.clientX;
    mouse.y = ev.clientY;
    mouse.inside = true;
    const t = pickHover();
    if (t && t.kind === 'brain' && activeName() === 'osmap') goBloom();
  });
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && activeName() === 'sysbloom') goMap();
  });
  if (backBtn) backBtn.addEventListener('click', goMap);
  if (listBtn) {
    listBtn.addEventListener('click', () => {
      const on = chapter.classList.toggle('show-list');
      listBtn.setAttribute('aria-pressed', String(on));
      listBtn.textContent = on ? 'Back to the map' : 'Browse as list';
    });
  }

  /* ---------- per-frame ---------- */
  function update(dt) {
    uniforms.uTime.value += dt;

    const name = activeName();
    // leaving the map chapter entirely: reset drill state
    if (name !== 'osmap' && name !== 'sysbloom' && backBtn && !backBtn.hidden) {
      backBtn.hidden = true;
    }

    const target = mapVisible() ? 1 : 0;
    const speed = target > uiAlpha ? 1.6 : 6.0;
    uiAlpha += (target - uiAlpha) * Math.min(dt * speed, 1);
    uniforms.uOpacity.value = uiAlpha * 0.9;

    mapFlow.visible = uiAlpha > 0.02 && name === 'osmap';
    bloomFlow.visible = uiAlpha > 0.02 && name === 'sysbloom';

    // labels: project + fade
    for (const l of labels) {
      const on = uiAlpha > 0.02 && l.level === name;
      if (!on) { l.el.style.opacity = '0'; continue; }
      const s = toScreen(l.x, l.y);
      if (!s) { l.el.style.opacity = '0'; continue; }
      l.el.style.left = s.x + 'px';
      l.el.style.top = s.y + 'px';
      l.el.style.opacity = String(uiAlpha);
    }

    // hover
    const t = uiAlpha > 0.5 ? pickHover() : null;
    if (t !== hovered) {
      hovered = t;
      for (const id in nodeLabels) nodeLabels[id].el.classList.remove('sysmap-label--hot');
      if (t && t.kind === 'node' && nodeLabels[t.id]) nodeLabels[t.id].el.classList.add('sysmap-label--hot');
      if (t) {
        card.innerHTML = cardHtml(t);
        card.style.opacity = '1';
      } else {
        card.style.opacity = '0';
      }
      document.documentElement.style.cursor = (t && (t.kind === 'brain')) ? 'pointer' : '';
    }
    if (hovered && card.style.opacity !== '0') {
      const pad = 18;
      const cw = card.offsetWidth || 300;
      const ch = card.offsetHeight || 120;
      let cx = mouse.x + pad;
      let cy = mouse.y + pad;
      if (cx + cw > window.innerWidth - 12) cx = mouse.x - cw - pad;
      if (cy + ch > window.innerHeight - 12) cy = mouse.y - ch - pad;
      card.style.left = cx + 'px';
      card.style.top = cy + 'px';
    }
  }

  return { object3D, update };
}
