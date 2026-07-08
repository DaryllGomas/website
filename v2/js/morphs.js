/* ============================================================
   morphs.js — procedural morph-target generators
   Each exported function returns a Float32Array of length N*3
   (world-space x,y,z per particle) for a given particle count.
   No THREE dependency — pure math + (for keyhole) 2D canvas
   sampling. Consumed by particles.js, which owns the blending.
   ============================================================ */

/* Deterministic PRNG — shapes that must correspond across two generator
   calls (chip exploded vs assembled) or stay stable across visits
   (glyph ring) seed one of these instead of using Math.random. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- generic reusable shape-from-canvas sampler ---------- */
/**
 * Draws an arbitrary silhouette on an offscreen 2D canvas, samples
 * opaque pixel positions, and maps them into world-space points.
 * Reusable for any future canvas-drawn morph target.
 *
 * @param {(ctx: CanvasRenderingContext2D, size: number) => void} drawFn
 * @param {number} count
 * @param {number} size - canvas resolution (square)
 * @param {number} worldScale - maps canvas [0,size] -> world extent
 * @param {number} zJitter - +/- random depth jitter
 * @returns {Float32Array} length count*3
 */
export function sampleShapeFromCanvas(drawFn, count, size = 512, worldScale = 3.2, zJitter = 0.18) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  drawFn(ctx, size);

  const img = ctx.getImageData(0, 0, size, size).data;
  const points = [];
  const step = size >= 400 ? 2 : 1;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const idx = (y * size + x) * 4;
      if (img[idx + 3] > 128) {
        points.push(
          (x / size - 0.5) * worldScale,
          -(y / size - 0.5) * worldScale
        );
      }
    }
  }

  const arr = new Float32Array(count * 3);
  const pointCount = points.length / 2;
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    if (pointCount === 0) {
      arr[i3] = 0;
      arr[i3 + 1] = 0;
      arr[i3 + 2] = 0;
      continue;
    }
    const pi = (Math.random() * pointCount) | 0;
    arr[i3] = points[pi * 2] + (Math.random() - 0.5) * 0.02;
    arr[i3 + 1] = points[pi * 2 + 1] + (Math.random() - 0.5) * 0.02;
    arr[i3 + 2] = (Math.random() - 0.5) * zJitter;
  }
  return arr;
}

/* ---------- 1. galaxy — spiral disc + halo scatter (hero entry) ---------- */
export function galaxy(count) {
  const arr = new Float32Array(count * 3);
  const arms = 3;
  const haloFraction = 0.22;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    if (Math.random() < haloFraction) {
      const r = 2.1 + Math.random() * 2.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.45;
      arr[i3 + 2] = r * Math.cos(phi);
      continue;
    }

    const t = Math.random();
    const armIndex = (Math.random() * arms) | 0;
    const armOffset = (armIndex / arms) * Math.PI * 2;
    const r = t * 2.5;
    const angle = armOffset + t * 6.5 + (Math.random() - 0.5) * 0.35;
    const spread = (Math.random() - 0.5) * (0.22 * (1.0 - t * 0.5));
    arr[i3] = Math.cos(angle) * r + spread;
    arr[i3 + 1] = (Math.random() - 0.5) * 0.14 * (1.0 - t * 0.6);
    arr[i3 + 2] = Math.sin(angle) * r + spread;
  }
  return arr;
}

/* ---------- 2. mandala — 12-fold sacred-geometry line art ----------
   Built as strokes, not fills: a bindu core, concentric guide rings,
   an 8-petal inner lotus, 24 radial spokes, a 12-petal outer lotus
   with nested veins, and dot accents at the interstices. Jitter is
   kept an order of magnitude below the stroke spacing so every curve
   reads as a drawn line — the old rose-curve fog is what made the
   mandala unreadable. Lies in the XZ plane (cameras crane overhead). */
export function mandala(count) {
  const arr = new Float32Array(count * 3);
  const TAU = Math.PI * 2;

  // relief: gentle radial wave so the disc catches depth without
  // breaking the overhead line-art read
  const relief = (r) => 0.06 * Math.sin(r * 2.4);

  // place a point on an ellipse-outline "petal": ring of petals at
  // radius rc, petal long axis radial (half-length a), width b
  function petalOutline(i3, k, petals, rc, a, b, jitter) {
    const phi = (k / petals) * TAU;
    const s = Math.random() * TAU;
    const lx = Math.cos(s) * a;           // radial offset in petal frame
    const ly = Math.sin(s) * b;           // tangential offset
    const r = rc + lx;
    const cosP = Math.cos(phi);
    const sinP = Math.sin(phi);
    const x = cosP * r - sinP * ly + (Math.random() - 0.5) * jitter;
    const z = sinP * r + cosP * ly + (Math.random() - 0.5) * jitter;
    arr[i3] = x;
    arr[i3 + 2] = z;
    arr[i3 + 1] = relief(Math.sqrt(x * x + z * z)) + (Math.random() - 0.5) * 0.02;
  }

  function ring(i3, R, jitter) {
    const theta = Math.random() * TAU;
    const r = R + (Math.random() - 0.5) * jitter;
    arr[i3] = Math.cos(theta) * r;
    arr[i3 + 2] = Math.sin(theta) * r;
    arr[i3 + 1] = relief(r) + (Math.random() - 0.5) * 0.02;
  }

  function dotCluster(i3, phi, R, spread) {
    const a = Math.random() * TAU;
    const rr = Math.pow(Math.random(), 1.5) * spread;
    const x = Math.cos(phi) * R + Math.cos(a) * rr;
    const z = Math.sin(phi) * R + Math.sin(a) * rr;
    arr[i3] = x;
    arr[i3 + 2] = z;
    arr[i3 + 1] = relief(R) + (Math.random() - 0.5) * 0.015;
  }

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const pick = Math.random();

    if (pick < 0.04) {
      // bindu — dense luminous center
      const r = Math.pow(Math.random(), 1.6) * 0.14;
      const a = Math.random() * TAU;
      arr[i3] = Math.cos(a) * r;
      arr[i3 + 2] = Math.sin(a) * r;
      arr[i3 + 1] = (Math.random() - 0.5) * 0.02;
    } else if (pick < 0.07) {
      ring(i3, 0.3, 0.01); // bindu ring
    } else if (pick < 0.28) {
      // inner lotus — 8 petal outlines
      petalOutline(i3, (Math.random() * 8) | 0, 8, 0.62, 0.34, 0.16, 0.012);
    } else if (pick < 0.32) {
      ring(i3, 1.02, 0.01); // middle guide ring
    } else if (pick < 0.41) {
      // 24 radial spokes between bindu ring and middle ring
      const k = (Math.random() * 24) | 0;
      const phi = (k / 24) * TAU + Math.PI / 24;
      const r = 0.34 + Math.random() * 0.64;
      const tj = (Math.random() - 0.5) * 0.01;
      arr[i3] = Math.cos(phi) * r - Math.sin(phi) * tj;
      arr[i3 + 2] = Math.sin(phi) * r + Math.cos(phi) * tj;
      arr[i3 + 1] = relief(r) + (Math.random() - 0.5) * 0.02;
    } else if (pick < 0.69) {
      // outer lotus — 12 petal outlines
      petalOutline(i3, (Math.random() * 12) | 0, 12, 1.62, 0.55, 0.24, 0.012);
    } else if (pick < 0.77) {
      // nested vein inside each outer petal
      petalOutline(i3, (Math.random() * 12) | 0, 12, 1.55, 0.36, 0.13, 0.01);
    } else if (pick < 0.82) {
      ring(i3, 2.24, 0.01); // outer ring
    } else if (pick < 0.85) {
      ring(i3, 2.34, 0.008); // outermost fine ring
    } else if (pick < 0.89) {
      // 12 dot accents between outer petals
      dotCluster(i3, ((Math.random() * 12 | 0) + 0.5) / 12 * TAU, 2.1, 0.045);
    } else if (pick < 0.92) {
      // 8 dot accents between inner petals
      dotCluster(i3, ((Math.random() * 8 | 0) + 0.5) / 8 * TAU, 1.14, 0.04);
    } else {
      // sparse dust beyond the outermost ring — breath, not fog
      const r = 2.45 + Math.random() * 0.35;
      const theta = Math.random() * TAU;
      arr[i3] = Math.cos(theta) * r;
      arr[i3 + 2] = Math.sin(theta) * r;
      arr[i3 + 1] = (Math.random() - 0.5) * 0.1;
    }
  }
  return arr;
}

/* ---------- 3. shield — SHIELD / cybersecurity chapter ----------
   A heater shield drawn as strokes (line art, matching the mandala's
   language): outer outline, inner offset outline, and a circuit-node
   emblem — a center ring with four traces ending in node dots. */
export function shield(count) {
  return sampleShapeFromCanvas((ctx, size) => {
    const cx = size * 0.5;
    const cy = size * 0.48;
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';

    const outline = (s) => {
      const w = 165 * s;
      const top = cy - 190 * s;
      const waist = cy - 40 * s;
      const tip = cy + 235 * s;
      ctx.beginPath();
      ctx.moveTo(cx - w, top);
      ctx.quadraticCurveTo(cx, top - 18 * s, cx + w, top);
      ctx.quadraticCurveTo(cx + w * 0.92, waist, cx + w * 0.73, waist + 82 * s);
      ctx.quadraticCurveTo(cx + w * 0.45, tip - 60 * s, cx, tip);
      ctx.quadraticCurveTo(cx - w * 0.45, tip - 60 * s, cx - w * 0.73, waist + 82 * s);
      ctx.quadraticCurveTo(cx - w * 0.92, waist, cx - w, top);
      ctx.stroke();
    };

    ctx.lineWidth = 7;
    outline(1.0);
    ctx.lineWidth = 4;
    outline(0.84);

    // circuit-node emblem
    const er = 42;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, er, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 4;
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + k * (Math.PI / 2);
      const x1 = cx + Math.cos(a) * er;
      const y1 = cy + Math.sin(a) * er;
      const x2 = cx + Math.cos(a) * (er + 62);
      const y2 = cy + Math.sin(a) * (er + 62);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x2, y2, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  }, count, 640, 3.3, 0.14);
}

/* ---------- 3b. glyphs — ARTIFACTS chapter ----------
   An ancient ring of runes: two boundary circles, 14 abstract glyphs
   around the ring, a petroglyph spiral at the center. Drawn flat in
   the XZ plane (camera cranes overhead) and seeded so the "script"
   is the same on every visit. */
export function glyphs(count) {
  const rng = mulberry32(0xa27157);
  const arr = sampleShapeFromCanvas((ctx, size) => {
    const cx = size * 0.5;
    const cy = size * 0.5;
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';

    // ring boundaries
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, 356, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 296, 0, Math.PI * 2); ctx.stroke();

    // 14 glyph slots on the band between the circles
    const glyphR = 326;
    for (let g = 0; g < 14; g++) {
      const a = (g / 14) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * glyphR, cy + Math.sin(a) * glyphR);
      ctx.rotate(a + Math.PI / 2);
      ctx.lineWidth = 5;
      const strokes = 2 + ((rng() * 3) | 0);
      for (let s = 0; s < strokes; s++) {
        const kind = (rng() * 5) | 0;
        const ox = (rng() - 0.5) * 26;
        if (kind === 0) {           // vertical bar
          ctx.beginPath(); ctx.moveTo(ox, -20); ctx.lineTo(ox, 20); ctx.stroke();
        } else if (kind === 1) {    // cross bar
          const oy = (rng() - 0.5) * 30;
          ctx.beginPath(); ctx.moveTo(-16, oy); ctx.lineTo(16, oy); ctx.stroke();
        } else if (kind === 2) {    // diagonal
          const d = rng() < 0.5 ? 1 : -1;
          ctx.beginPath(); ctx.moveTo(-14 * d, -18); ctx.lineTo(14 * d, 18); ctx.stroke();
        } else if (kind === 3) {    // arc
          ctx.beginPath();
          ctx.arc(ox * 0.5, 0, 13, rng() * Math.PI, rng() * Math.PI + Math.PI * (0.8 + rng() * 0.9));
          ctx.stroke();
        } else {                    // dot
          ctx.beginPath(); ctx.arc(ox, (rng() - 0.5) * 30, 4.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    // center petroglyph spiral
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let t = 0; t <= 1.001; t += 0.01) {
      const a = t * Math.PI * 6;
      const r = 14 + t * 96;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // four radial ticks between spiral and ring
    ctx.lineWidth = 3;
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + k * (Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 150, cy + Math.sin(a) * 150);
      ctx.lineTo(cx + Math.cos(a) * 240, cy + Math.sin(a) * 240);
      ctx.stroke();
    }
  }, count, 768, 4.6, 0.14);

  // sampler emits upright XY — lay the ring flat into XZ for the crane cam
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const y = arr[i3 + 1];
    arr[i3 + 1] = arr[i3 + 2] * 0.6 + (Math.random() - 0.5) * 0.02;
    arr[i3 + 2] = -y;
  }
  return arr;
}

/* ---------- 4. chip — SYNTHESIS chapter: CoWoS superchip ----------
   The heart of AI as a wireframe CoWoS package: substrate → silicon
   interposer → central compute die flanked by four HBM stacks (with
   layer striations), RDL traces, microbump rows, solder balls.
   `explode` (0..1) lifts each layer apart vertically, exploded-view
   style. Both variants use the SAME seeded RNG so particle i belongs
   to the same component in both — morphing chipExploded → chip makes
   the parts literally slide together into the assembly. */
function buildChip(count, explode) {
  const rng = mulberry32(0xc0405);
  const e = explode;

  // explode lift per layer (world units at e=1)
  const LIFT = { substrate: 0, solder: -0.45, interposer: 0.6, rdl: 0.6, bump: 0.85, die: 1.25, hbm: 1.0 };
  const lift = (layer) => LIFT[layer] * e;

  const segs = [];   // [x1,y1,z1, x2,y2,z2, cumLen]
  let totalLen = 0;
  function seg(x1, y1, z1, x2, y2, z2, layer) {
    const dy = lift(layer);
    const len = Math.hypot(x2 - x1, y2 - y1, z2 - z1);
    totalLen += len;
    segs.push([x1, y1 + dy, z1, x2, y2 + dy, z2, totalLen]);
  }
  function rectLoop(cx, cz, w, d, y, layer) {
    const hw = w / 2, hd = d / 2;
    seg(cx - hw, y, cz - hd, cx + hw, y, cz - hd, layer);
    seg(cx + hw, y, cz - hd, cx + hw, y, cz + hd, layer);
    seg(cx + hw, y, cz + hd, cx - hw, y, cz + hd, layer);
    seg(cx - hw, y, cz + hd, cx - hw, y, cz - hd, layer);
  }
  function verticals(cx, cz, w, d, y1, y2, layer) {
    const hw = w / 2, hd = d / 2;
    seg(cx - hw, y1, cz - hd, cx - hw, y2, cz - hd, layer);
    seg(cx + hw, y1, cz - hd, cx + hw, y2, cz - hd, layer);
    seg(cx + hw, y1, cz + hd, cx + hw, y2, cz + hd, layer);
    seg(cx - hw, y1, cz + hd, cx - hw, y2, cz + hd, layer);
  }

  // substrate (anchor layer)
  rectLoop(0, 0, 3.0, 2.0, -0.52, 'substrate');
  rectLoop(0, 0, 3.0, 2.0, -0.66, 'substrate');
  verticals(0, 0, 3.0, 2.0, -0.66, -0.52, 'substrate');
  // silicon interposer
  rectLoop(0, 0, 2.2, 1.35, -0.40, 'interposer');
  rectLoop(0, 0, 2.2, 1.35, -0.49, 'interposer');
  verticals(0, 0, 2.2, 1.35, -0.49, -0.40, 'interposer');
  // compute die
  rectLoop(0, 0, 0.9, 0.9, -0.10, 'die');
  rectLoop(0, 0, 0.9, 0.9, -0.40, 'die');
  verticals(0, 0, 0.9, 0.9, -0.40, -0.10, 'die');
  // four HBM stacks with layer striations
  const HBM = [[-0.82, -0.36], [-0.82, 0.36], [0.82, -0.36], [0.82, 0.36]];
  for (const [hx, hz] of HBM) {
    rectLoop(hx, hz, 0.52, 0.72, -0.12, 'hbm');
    rectLoop(hx, hz, 0.52, 0.72, -0.40, 'hbm');
    verticals(hx, hz, 0.52, 0.72, -0.40, -0.12, 'hbm');
    for (const sy of [-0.33, -0.26, -0.19]) {
      rectLoop(hx, hz, 0.52, 0.72, sy, 'hbm'); // stacked-die striations
    }
  }
  // RDL traces on the interposer top: die edge → each HBM inner edge
  for (const [hx, hz] of HBM) {
    const sx = Math.sign(hx);
    for (const off of [-0.08, 0, 0.08]) {
      seg(sx * 0.45, -0.395, hz * 0.72 + off, sx * 0.56, -0.395, hz + off, 'rdl');
    }
  }

  // dot emitters: lattices, bump/ball rows
  const dots = [];
  let dotWeight = 0;
  function emitter(w, params) { dotWeight += w; dots.push({ w: dotWeight, ...params }); }
  // die top lattice — dense silicon texture
  emitter(38, { kind: 'lattice', cx: 0, cz: 0, w: 0.82, d: 0.82, y: -0.10, nx: 16, nz: 16, layer: 'die' });
  // HBM top lattices
  for (const [hx, hz] of HBM) {
    emitter(4, { kind: 'lattice', cx: hx, cz: hz, w: 0.44, d: 0.64, y: -0.12, nx: 5, nz: 7, layer: 'hbm' });
  }
  // substrate top sparse guide lattice
  emitter(7, { kind: 'lattice', cx: 0, cz: 0, w: 2.8, d: 1.8, y: -0.52, nx: 15, nz: 10, layer: 'substrate' });
  // microbump rows under die + HBM front edges
  emitter(8, { kind: 'row', x1: -0.42, z1: 0.42, x2: 0.42, z2: 0.42, y: -0.405, n: 26, layer: 'bump' });
  for (const [hx, hz] of HBM) {
    emitter(3, { kind: 'row', x1: hx - 0.22, z1: hz + 0.33, x2: hx + 0.22, z2: hz + 0.33, y: -0.405, n: 12, layer: 'bump' });
  }
  // solder balls under the substrate, two front rows
  emitter(9, { kind: 'row', x1: -1.35, z1: 0.86, x2: 1.35, z2: 0.86, y: -0.70, n: 26, layer: 'solder' });
  emitter(9, { kind: 'row', x1: -1.35, z1: 0.7, x2: 1.35, z2: 0.7, y: -0.70, n: 26, layer: 'solder' });

  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const pick = rng();

    if (pick < 0.56) {
      // wireframe edges, length-weighted
      const target = rng() * totalLen;
      let lo = 0, hi = segs.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (segs[mid][6] < target) lo = mid + 1; else hi = mid; }
      const s = segs[lo];
      const t = rng();
      arr[i3] = s[0] + (s[3] - s[0]) * t + (rng() - 0.5) * 0.008;
      arr[i3 + 1] = s[1] + (s[4] - s[1]) * t + (rng() - 0.5) * 0.008;
      arr[i3 + 2] = s[2] + (s[5] - s[2]) * t + (rng() - 0.5) * 0.008;
    } else if (pick < 0.96) {
      // structured dots
      const target = rng() * dotWeight;
      let d = dots[0];
      for (const cand of dots) { if (cand.w >= target) { d = cand; break; } }
      const dy = lift(d.layer);
      if (d.kind === 'lattice') {
        const ix = (rng() * d.nx) | 0, iz = (rng() * d.nz) | 0;
        arr[i3] = d.cx - d.w / 2 + (ix + 0.5) * (d.w / d.nx) + (rng() - 0.5) * 0.006;
        arr[i3 + 1] = d.y + dy + (rng() - 0.5) * 0.006;
        arr[i3 + 2] = d.cz - d.d / 2 + (iz + 0.5) * (d.d / d.nz) + (rng() - 0.5) * 0.006;
      } else {
        const k = (rng() * d.n) | 0;
        const t = (k + 0.5) / d.n;
        arr[i3] = d.x1 + (d.x2 - d.x1) * t + (rng() - 0.5) * 0.006;
        arr[i3 + 1] = d.y + dy + (rng() - 0.5) * 0.006;
        arr[i3 + 2] = d.z1 + (d.z2 - d.z1) * t + (rng() - 0.5) * 0.006;
      }
    } else {
      // ambient dust shell — the "sand" the superchip forms from
      const r = 2.3 + rng() * 0.6;
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      arr[i3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i3 + 1] = r * Math.cos(phi) * 0.55;
      arr[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
  }
  return arr;
}

export function chip(count) { return buildChip(count, 0); }
export function chipExploded(count) { return buildChip(count, 1); }

/* ---------- 5. enso — hand-drawn zen circle (stillness chapter) ----------
   A single clean brush stroke: thin ring with subtle pressure
   variation, density-tapered tails with a gentle inward curl, and a
   few ink flecks near the opening. */
export function enso(count) {
  const arr = new Float32Array(count * 3);
  const gap = 42 * (Math.PI / 180);
  const start = Math.PI * 0.5 + gap / 2;
  const sweep = Math.PI * 2 - gap;
  const R = 1.75;
  const thickness = 0.13;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    if (Math.random() < 0.025) {
      // ink flecks scattered near the stroke opening
      const a = Math.PI * 0.5 + (Math.random() - 0.5) * 1.2;
      const r = R * (0.82 + Math.random() * 0.34);
      arr[i3] = Math.cos(a) * r;
      arr[i3 + 2] = Math.sin(a) * r;
      arr[i3 + 1] = (Math.random() - 0.5) * 0.05;
      continue;
    }

    // density taper: resample toward mid-stroke so the tails thin out
    let t = Math.random();
    const tail = Math.min(t, 1 - t);
    if (tail < 0.1 && Math.random() > tail / 0.1) {
      t = 0.1 + Math.random() * 0.8;
    }

    let theta = start + sweep * t;
    let r = R + (Math.random() - 0.5) * thickness * (0.65 + 0.35 * Math.sin(t * Math.PI * 4));

    // taper + gentle inward curl at the two tail ends
    const tailT = Math.min(t, 1 - t);
    if (tailT < 0.07) {
      const amt = (0.07 - tailT) / 0.07;
      const dir = t < 0.5 ? -1 : 1;
      theta += amt * dir * 0.9;
      r *= 1 - amt * 0.22;
    }

    arr[i3] = Math.cos(theta) * r;
    arr[i3 + 1] = (Math.random() - 0.5) * thickness * 0.4;
    arr[i3 + 2] = Math.sin(theta) * r;
  }
  return arr;
}

/* ---------- 6. beacon — CONTACT chapter: a signal going out ----------
   A luminous point of contact with crisp concentric ripples expanding
   outward (density fading with distance), radar ticks crossing the
   second ring, and sparse outer dust. Flat in XZ, camera cranes. */
export function beacon(count) {
  const arr = new Float32Array(count * 3);
  const RINGS = [
    { R: 0.5, w: 0.26 },
    { R: 1.0, w: 0.22 },
    { R: 1.5, w: 0.16 },
    { R: 2.0, w: 0.11 },
  ];
  const ringTotal = RINGS.reduce((a, r) => a + r.w, 0);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const pick = Math.random();

    if (pick < 0.09) {
      // the point of contact — dense luminous center
      const r = Math.pow(Math.random(), 1.7) * 0.16;
      const a = Math.random() * Math.PI * 2;
      arr[i3] = Math.cos(a) * r;
      arr[i3 + 2] = Math.sin(a) * r;
      arr[i3 + 1] = (Math.random() - 0.5) * 0.04;
    } else if (pick < 0.84) {
      // concentric ripples
      let sel = Math.random() * ringTotal;
      let ring = RINGS[0];
      for (const cand of RINGS) { sel -= cand.w; if (sel <= 0) { ring = cand; break; } }
      const theta = Math.random() * Math.PI * 2;
      const r = ring.R + (Math.random() - 0.5) * 0.014;
      arr[i3] = Math.cos(theta) * r;
      arr[i3 + 2] = Math.sin(theta) * r;
      arr[i3 + 1] = (Math.random() - 0.5) * 0.02;
    } else if (pick < 0.93) {
      // 12 radar ticks crossing the second ring
      const k = (Math.random() * 12) | 0;
      const phi = (k / 12) * Math.PI * 2;
      const r = 0.92 + Math.random() * 0.16;
      const tj = (Math.random() - 0.5) * 0.01;
      arr[i3] = Math.cos(phi) * r - Math.sin(phi) * tj;
      arr[i3 + 2] = Math.sin(phi) * r + Math.cos(phi) * tj;
      arr[i3 + 1] = (Math.random() - 0.5) * 0.02;
    } else {
      // sparse dust past the last ripple
      const r = 2.2 + Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      arr[i3] = Math.cos(theta) * r;
      arr[i3 + 2] = Math.sin(theta) * r;
      arr[i3 + 1] = (Math.random() - 0.5) * 0.08;
    }
  }
  return arr;
}

export const GENERATORS = { galaxy, mandala, shield, chip, chipExploded, glyphs, enso, beacon };
