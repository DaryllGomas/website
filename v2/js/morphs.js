/* ============================================================
   morphs.js — procedural morph-target generators
   Each exported function returns a Float32Array of length N*3
   (world-space x,y,z per particle) for a given particle count.
   No THREE dependency — pure math + (for keyhole) 2D canvas
   sampling. Consumed by particles.js, which owns the blending.
   ============================================================ */

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

/* ---------- 2. mandala — layered polar rose curves ---------- */
export function mandala(count) {
  const arr = new Float32Array(count * 3);
  const rings = [
    { R: 1.0, k: 6, n: 0 },
    { R: 1.65, k: 8, n: 1 },
    { R: 2.3, k: 12, n: 2 },
  ];
  const coreFraction = 0.12;
  const golden = 137.508 * (Math.PI / 180);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    if (Math.random() < coreFraction) {
      const r = Math.random() * 0.26;
      const a = Math.random() * Math.PI * 2;
      arr[i3] = Math.cos(a) * r;
      arr[i3 + 1] = (Math.random() - 0.5) * 0.05;
      arr[i3 + 2] = Math.sin(a) * r;
      continue;
    }

    const ring = rings[(Math.random() * rings.length) | 0];
    const theta = Math.random() * Math.PI * 2 + ring.n * golden;
    const rose = 0.55 + 0.45 * Math.cos(ring.k * theta);
    const jitter = (Math.random() - 0.5) * 0.04;
    const r = ring.R * rose + jitter;

    arr[i3] = Math.cos(theta) * r;
    arr[i3 + 1] = 0.16 * Math.sin(r * 1.3) + (Math.random() - 0.5) * 0.02;
    arr[i3 + 2] = Math.sin(theta) * r;
  }
  return arr;
}

/* ---------- 3. keyhole — cyber/shield chapter ---------- */
export function keyhole(count) {
  return sampleShapeFromCanvas((ctx, size) => {
    ctx.fillStyle = '#fff';
    const cx = size * 0.5;
    const cy = size * 0.36;
    const r = size * 0.155;

    // circular bow
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // flared stem
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.32, cy + r * 0.72);
    ctx.lineTo(cx + r * 0.32, cy + r * 0.72);
    ctx.lineTo(cx + r * 1.05, size * 0.86);
    ctx.lineTo(cx - r * 1.05, size * 0.86);
    ctx.closePath();
    ctx.fill();
  }, count, 512, 3.4, 0.2);
}

/* ---------- 4. network — AI / synthesis chapter ---------- */
export function network(count) {
  const nodeCount = 40;
  const nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    const r = 1.5 + Math.random() * 0.9;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    nodes.push([
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    ]);
  }

  const edgeCount = 55;
  const edges = [];
  for (let i = 0; i < edgeCount; i++) {
    edges.push([
      nodes[(Math.random() * nodeCount) | 0],
      nodes[(Math.random() * nodeCount) | 0],
    ]);
  }

  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    if (Math.random() < 0.7) {
      const node = nodes[(Math.random() * nodeCount) | 0];
      const g = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.09;
      arr[i3] = node[0] + g();
      arr[i3 + 1] = node[1] + g();
      arr[i3 + 2] = node[2] + g();
    } else {
      const [a, b] = edges[(Math.random() * edgeCount) | 0];
      const t = Math.random();
      arr[i3] = a[0] + (b[0] - a[0]) * t;
      arr[i3 + 1] = a[1] + (b[1] - a[1]) * t;
      arr[i3 + 2] = a[2] + (b[2] - a[2]) * t;
    }
  }
  return arr;
}

/* ---------- 5. enso — hand-drawn zen circle (stillness chapter) ---------- */
export function enso(count) {
  const arr = new Float32Array(count * 3);
  const gap = 40 * (Math.PI / 180);
  const start = Math.PI * 0.5 + gap / 2;
  const sweep = Math.PI * 2 - gap;
  const R = 1.75;
  const thickness = 0.24;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const t = Math.random();
    let theta = start + sweep * t;
    let r = R + (Math.random() - 0.5) * thickness * (0.6 + 0.4 * Math.sin(t * Math.PI * 5));

    // taper + spiral drift near the two tail ends of the brush stroke
    const tailT = Math.min(t, 1 - t);
    if (tailT < 0.08) {
      const spiralAmt = (0.08 - tailT) / 0.08;
      const dir = t < 0.5 ? -1 : 1;
      theta += spiralAmt * dir * 2.6;
      r *= 1 - spiralAmt * 0.55;
    }

    arr[i3] = Math.cos(theta) * r;
    arr[i3 + 1] = (Math.random() - 0.5) * thickness * 0.5;
    arr[i3 + 2] = Math.sin(theta) * r;
  }
  return arr;
}

/* ---------- 6. core — contact chapter: dense sphere + orbiting shell ---------- */
export function core(count) {
  const arr = new Float32Array(count * 3);
  const coreFraction = 0.55;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    if (Math.random() < coreFraction) {
      const r = Math.pow(Math.random(), 1.5) * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i3 + 2] = r * Math.cos(phi);
    } else {
      const r = 1.4 + Math.random() * 0.55;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2 - 1) * 0.6);
      arr[i3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i3 + 1] = r * Math.cos(phi) * 0.4;
      arr[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
  }
  return arr;
}

export const GENERATORS = { galaxy, mandala, keyhole, network, enso, core };
