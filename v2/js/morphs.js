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
