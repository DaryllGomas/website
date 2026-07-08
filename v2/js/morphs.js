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

/* ============================================================
   Shared structure infrastructure — a shape is a list of straight
   segments (its vector skeleton) plus dot emitters. Particles are
   sampled FROM the skeleton (length-weighted, small jitter) and the
   very same skeleton renders as crisp 1px GPU lines via lines.js —
   SVG-sharp at rest, particle-alive in motion.
   ============================================================ */

function addSeg(st, x1, y1, z1, x2, y2, z2) {
  const len = Math.hypot(x2 - x1, y2 - y1, z2 - z1);
  st.totalLen += len;
  st.segs.push([x1, y1, z1, x2, y2, z2, st.totalLen]);
}

function addPolyline(st, pts, closed = false) {
  for (let i = 1; i < pts.length; i++) {
    addSeg(st, pts[i - 1][0], pts[i - 1][1], pts[i - 1][2], pts[i][0], pts[i][1], pts[i][2]);
  }
  if (closed && pts.length > 2) {
    const a = pts[pts.length - 1], b = pts[0];
    addSeg(st, a[0], a[1], a[2], b[0], b[1], b[2]);
  }
}

/* circle in the XZ plane (y via relief fn) or XY plane */
function addCircle(st, R, n, opts = {}) {
  const { plane = 'xz', y = 0, relief = null, cx = 0, cy = 0 } = opts;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    if (plane === 'xz') {
      pts.push([Math.cos(a) * R, relief ? relief(R) : y, Math.sin(a) * R]);
    } else {
      pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R, 0]);
    }
  }
  addPolyline(st, pts);
}

/* radially-oriented ellipse outline (petal) in the XZ plane */
function addPetal(st, k, petals, rc, a, b, n, relief) {
  const phi = (k / petals) * Math.PI * 2;
  const cosP = Math.cos(phi), sinP = Math.sin(phi);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * Math.PI * 2;
    const lx = Math.cos(s) * a, ly = Math.sin(s) * b;
    const r = rc + lx;
    const x = cosP * r - sinP * ly;
    const z = sinP * r + cosP * ly;
    pts.push([x, relief ? relief(Math.hypot(x, z)) : 0, z]);
  }
  addPolyline(st, pts);
}

function newStructure() {
  return { segs: [], totalLen: 0, dots: [], dotWeight: 0 };
}

function addDots(st, w, params) {
  st.dotWeight += w;
  st.dots.push({ w: st.dotWeight, ...params });
}

/**
 * Sample `count` particles from a structure: fractions of skeleton
 * segments (length-weighted), dot emitters, and ambient dust.
 */
function pointsFromStructure(st, count, opts = {}) {
  const {
    rng = Math.random,
    segFrac = 0.78, dotFrac = 0.16,
    auraFrac = 0, // same strokes, ~10× jitter: diffuse glow without saturating the line
    jitter = 0.012, depthJitter = 0,
    dust = null, // {rMin, rMax, yAmp, behind}  behind: push dust past the shape plane (-z)
  } = opts;
  const arr = new Float32Array(count * 3);
  const segEnd = segFrac, auraEnd = segFrac + auraFrac, dotEnd = auraEnd + dotFrac;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const pick = rng();

    if (pick < auraEnd && st.segs.length) {
      const aura = pick >= segEnd;
      const j = aura ? jitter * 10 : jitter;
      const dj = aura ? (depthJitter || jitter) * 6 : (depthJitter || jitter);
      const target = rng() * st.totalLen;
      let lo = 0, hi = st.segs.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (st.segs[mid][6] < target) lo = mid + 1; else hi = mid; }
      const s = st.segs[lo];
      const t = rng();
      arr[i3] = s[0] + (s[3] - s[0]) * t + (rng() - 0.5) * j;
      arr[i3 + 1] = s[1] + (s[4] - s[1]) * t + (rng() - 0.5) * j;
      arr[i3 + 2] = s[2] + (s[5] - s[2]) * t + (rng() - 0.5) * dj;
    } else if (pick < dotEnd && st.dots.length) {
      const target = rng() * st.dotWeight;
      let d = st.dots[0];
      for (const cand of st.dots) { if (cand.w >= target) { d = cand; break; } }
      const a = rng() * Math.PI * 2;
      const rr = Math.pow(rng(), 1.5) * d.spread;
      if (d.plane === 'xy') {
        // upright shapes: cluster spreads in the XY plane, depth jitter in z
        arr[i3] = d.x + Math.cos(a) * rr;
        arr[i3 + 1] = d.y + Math.sin(a) * rr;
        arr[i3 + 2] = (d.z || 0) + (rng() - 0.5) * (d.zSpread || 0.05);
      } else {
        arr[i3] = d.x + Math.cos(a) * rr;
        arr[i3 + 1] = d.y + (rng() - 0.5) * (d.ySpread || 0.01);
        arr[i3 + 2] = d.z + Math.sin(a) * rr;
      }
    } else if (dust) {
      const r = dust.rMin + rng() * (dust.rMax - dust.rMin);
      const theta = rng() * Math.PI * 2;
      arr[i3] = Math.cos(theta) * r;
      arr[i3 + 1] = (rng() - 0.5) * dust.yAmp;
      // starfield depth: keep ambience BEHIND the shape plane so it reads
      // as space, not as foreground blur floating over the diagram
      const z = Math.sin(theta) * r;
      arr[i3 + 2] = dust.behind ? -Math.abs(z) - 0.6 : z;
    } else if (st.segs.length) {
      // no dust configured — put the remainder on the skeleton
      const s = st.segs[(rng() * st.segs.length) | 0];
      const t = rng();
      arr[i3] = s[0] + (s[3] - s[0]) * t + (rng() - 0.5) * jitter;
      arr[i3 + 1] = s[1] + (s[4] - s[1]) * t + (rng() - 0.5) * jitter;
      arr[i3 + 2] = s[2] + (s[5] - s[2]) * t + (rng() - 0.5) * (depthJitter || jitter);
    }
  }
  return arr;
}

/* skeleton → flat Float32Array of segment endpoints for LineSegments */
function segsToPositions(st) {
  const out = new Float32Array(st.segs.length * 6);
  st.segs.forEach((s, i) => {
    out[i * 6] = s[0]; out[i * 6 + 1] = s[1]; out[i * 6 + 2] = s[2];
    out[i * 6 + 3] = s[3]; out[i * 6 + 4] = s[4]; out[i * 6 + 5] = s[5];
  });
  return out;
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
   A heater shield as a vector skeleton (upright, XY plane): outer +
   inner outlines, circuit-node emblem (center ring, four traces,
   small node rings). Particles sample the skeleton; the same
   skeleton renders as crisp lines. */
function quadPts(p0, c, p1, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const mt = 1 - t;
    pts.push([
      mt * mt * p0[0] + 2 * mt * t * c[0] + t * t * p1[0],
      mt * mt * p0[1] + 2 * mt * t * c[1] + t * t * p1[1],
      0,
    ]);
  }
  return pts;
}

export function shieldStructure() {
  const st = newStructure();
  const W = 0.85, TOP = 0.98, WAIST = 0.21, TIP = -1.21;

  for (const s of [1.0, 0.84]) {
    const w = W * s, top = TOP * s, waist = WAIST * s, tip = TIP * s;
    const outline = [
      ...quadPts([-w, top], [0, top + 0.09 * s], [w, top], 22),
      ...quadPts([w, top], [w * 0.92, waist], [w * 0.73, waist - 0.42 * s], 14),
      ...quadPts([w * 0.73, waist - 0.42 * s], [w * 0.45, tip + 0.31 * s], [0, tip], 18),
      ...quadPts([0, tip], [-w * 0.45, tip + 0.31 * s], [-w * 0.73, waist - 0.42 * s], 18),
      ...quadPts([-w * 0.73, waist - 0.42 * s], [-w * 0.92, waist], [-w, top], 14),
    ];
    addPolyline(st, outline);
  }

  // circuit-node emblem
  addCircle(st, 0.22, 44, { plane: 'xy' });
  addCircle(st, 0.035, 10, { plane: 'xy' });
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + k * (Math.PI / 2);
    addSeg(st,
      Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0,
      Math.cos(a) * 0.54, Math.sin(a) * 0.54, 0);
    addCircle(st, 0.04, 12, { plane: 'xy', cx: Math.cos(a) * 0.54, cy: Math.sin(a) * 0.54 });
  }
  return st;
}

export function shield(count) {
  return pointsFromStructure(shieldStructure(), count, {
    segFrac: 0.3, auraFrac: 0.44, dotFrac: 0,
    jitter: 0.012, depthJitter: 0.09,
    dust: { rMin: 1.6, rMax: 3.4, yAmp: 2.6, behind: true },
  });
}

/* ---------- 3b. The Living System Map — ARTIFACTS chapter ----------
   Two levels, both upright (XY plane, facing the level camera):

   osmap    — the Namkuzu-da OS diagram: four INPUT nodes feeding the
              Claude brain, four OUTPUT nodes flowing out. Edges are
              quadratic curves; sysmap.js streams flow particles along
              the same curves and anchors DOM labels/cards to the same
              layout, so everything shares one source of truth here.
   sysbloom — the drill-in: 7 category rings around a hub, holding all
              44 real systems from the honest inventory. */
import { SYSTEMS_DATA } from './systems-data.js';

export function osmapLayout() {
  const CX = 0.55;
  const YS = [1.32, 0.44, -0.44, -1.32];
  const brain = { x: CX, y: 0, r: 0.42, r2: 0.34 };
  const inIds = ['voice', 'market', 'web', 'cloud'];
  const outIds = ['intel', 'kb', 'control', 'alerts'];
  const nodes = [];
  const edges = []; // quadratic {a, c, b} — flow runs a → b

  inIds.forEach((id, i) => {
    const x = CX - 2.35, y = YS[i];
    nodes.push({ id, x, y, r: 0.24, side: 'in' });
    edges.push({
      a: [x + 0.24, y, 0],
      c: [(x + CX) / 2 - 0.2, y * 0.62, 0],
      b: [CX - brain.r - 0.03, y * 0.18, 0],
    });
  });
  outIds.forEach((id, i) => {
    const x = CX + 2.35, y = YS[i];
    nodes.push({ id, x, y, r: 0.24, side: 'out' });
    edges.push({
      a: [CX + brain.r + 0.03, y * 0.18, 0],
      c: [(x + CX) / 2 + 0.2, y * 0.62, 0],
      b: [x - 0.24, y, 0],
    });
  });
  return { brain, nodes, edges };
}

export function sysbloomLayout() {
  const CX = 0.45;
  const hub = { x: CX, y: 0, r: 0.2 };
  const cats = SYSTEMS_DATA.categories.map((c, k) => {
    const a = -Math.PI / 2 + (k / SYSTEMS_DATA.categories.length) * Math.PI * 2;
    return { id: c.id, name: c.name, x: CX + Math.cos(a) * 2.0, y: Math.sin(a) * 1.28, r: 0.5 };
  });
  const byCat = {};
  cats.forEach((c) => { byCat[c.id] = []; });
  SYSTEMS_DATA.systems.forEach((s) => { (byCat[s.cat] || (byCat[s.cat] = [])).push(s); });

  const systems = [];
  const GOLDEN = 2.39996;
  for (const c of cats) {
    const list = byCat[c.id] || [];
    list.forEach((s, i) => {
      const rr = 0.36 * Math.sqrt((i + 0.5) / list.length);
      const aa = i * GOLDEN;
      systems.push({
        id: s.id, cat: c.id, status: s.status,
        x: c.x + Math.cos(aa) * rr,
        y: c.y + Math.sin(aa) * rr * 0.9,
        r: 0.055,
      });
    });
  }
  const spines = cats.map((c) => {
    const dx = c.x - hub.x, dy = c.y - hub.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    return {
      a: [hub.x + ux * hub.r, hub.y + uy * hub.r, 0],
      c: [hub.x + dx * 0.5, hub.y + dy * 0.5, 0],
      b: [c.x - ux * c.r, c.y - uy * c.r, 0],
    };
  });
  return { hub, cats, systems, spines };
}

function addQuadEdge(st, e, n) {
  addPolyline(st, quadPts([e.a[0], e.a[1]], [e.c[0], e.c[1]], [e.b[0], e.b[1]], n));
}

export function osmapStructure() {
  const st = newStructure();
  const L = osmapLayout();
  addCircle(st, L.brain.r, 60, { plane: 'xy', cx: L.brain.x, cy: L.brain.y });
  addCircle(st, L.brain.r2, 50, { plane: 'xy', cx: L.brain.x, cy: L.brain.y });
  addDots(st, 10, { plane: 'xy', x: L.brain.x, y: L.brain.y, z: 0, spread: 0.17, zSpread: 0.1 });
  for (const nd of L.nodes) {
    addCircle(st, nd.r, 40, { plane: 'xy', cx: nd.x, cy: nd.y });
    addDots(st, 1.1, { plane: 'xy', x: nd.x, y: nd.y, z: 0, spread: 0.05, zSpread: 0.06 });
  }
  for (const e of L.edges) addQuadEdge(st, e, 20);
  return st;
}

export function osmap(count) {
  return pointsFromStructure(osmapStructure(), count, {
    segFrac: 0.26, auraFrac: 0.34, dotFrac: 0.28,
    jitter: 0.012, depthJitter: 0.09,
    dust: { rMin: 2.8, rMax: 4.2, yAmp: 2.8, behind: true },
  });
}

export function sysbloomStructure() {
  const st = newStructure();
  const L = sysbloomLayout();
  addCircle(st, L.hub.r, 40, { plane: 'xy', cx: L.hub.x, cy: L.hub.y });
  addDots(st, 4, { plane: 'xy', x: L.hub.x, y: L.hub.y, z: 0, spread: 0.09, zSpread: 0.08 });
  for (const c of L.cats) addCircle(st, c.r, 60, { plane: 'xy', cx: c.x, cy: c.y });
  for (const e of L.spines) addQuadEdge(st, e, 14);
  for (const s of L.systems) {
    addCircle(st, s.r, 12, { plane: 'xy', cx: s.x, cy: s.y });
    // live systems burn brighter than descriptive/experimental ones
    addDots(st, s.status === 'live' ? 0.5 : 0.22, { plane: 'xy', x: s.x, y: s.y, z: 0, spread: 0.02, zSpread: 0.04 });
  }
  return st;
}

export function sysbloom(count) {
  return pointsFromStructure(sysbloomStructure(), count, {
    segFrac: 0.26, auraFrac: 0.3, dotFrac: 0.32,
    jitter: 0.01, depthJitter: 0.07,
    dust: { rMin: 2.8, rMax: 4.2, yAmp: 2.6, behind: true },
  });
}

/* ---------- 4. chip — SYNTHESIS chapter: CoWoS superchip ----------
   The heart of AI as a wireframe CoWoS package: substrate → silicon
   interposer → central compute die flanked by four HBM stacks (with
   layer striations), RDL traces, microbump rows, solder balls.
   `explode` (0..1) lifts each layer apart vertically, exploded-view
   style. Both variants use the SAME seeded RNG so particle i belongs
   to the same component in both — morphing chipExploded → chip makes
   the parts literally slide together into the assembly. */
export function chipStructure(explode) {
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
  // silicon interposer — top loop + verticals only; from the raised 3/4
  // camera a bottom loop projects just inside the top one and reads as a
  // smeared double line (same for die/HBM below: hidden-edge clutter)
  rectLoop(0, 0, 2.2, 1.35, -0.40, 'interposer');
  verticals(0, 0, 2.2, 1.35, -0.49, -0.40, 'interposer');
  // compute die
  rectLoop(0, 0, 0.9, 0.9, -0.10, 'die');
  verticals(0, 0, 0.9, 0.9, -0.40, -0.10, 'die');
  // four HBM stacks with layer striations
  const HBM = [[-0.82, -0.36], [-0.82, 0.36], [0.82, -0.36], [0.82, 0.36]];
  for (const [hx, hz] of HBM) {
    rectLoop(hx, hz, 0.52, 0.72, -0.12, 'hbm');
    verticals(hx, hz, 0.52, 0.72, -0.40, -0.12, 'hbm');
    // stacked-die striations on the camera-facing (+z) face only —
    // full loops through all four faces X-ray into visual soup
    for (const sy of [-0.33, -0.26, -0.19]) {
      seg(hx - 0.26, sy, hz + 0.36, hx + 0.26, sy, hz + 0.36, 'hbm');
    }
  }
  // RDL traces on the interposer top: die edge → each HBM inner edge
  for (const [hx, hz] of HBM) {
    const sx = Math.sign(hx);
    for (const off of [-0.08, 0, 0.08]) {
      seg(sx * 0.45, -0.395, hz * 0.72 + off, sx * 0.56, -0.395, hz + off, 'rdl');
    }
  }

  // dot emitters: lattices, bump/ball rows (explode lift baked into y)
  const dots = [];
  let dotWeight = 0;
  function emitter(w, params) {
    dotWeight += w;
    dots.push({ ...params, w: dotWeight, y: params.y + lift(params.layer) });
  }
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

  return { segs, totalLen, dots, dotWeight };
}

function buildChip(count, explode) {
  const rng = mulberry32(0xc0405);
  const { segs, totalLen, dots, dotWeight } = chipStructure(explode);

  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const pick = rng();

    if (pick < 0.58) {
      // wireframe edges, length-weighted — tight core line (< 0.30) or
      // diffuse aura around the same strokes (0.30–0.58). Branch constants
      // must stay identical between explode variants (rng correspondence).
      const j = pick < 0.3 ? 0.008 : 0.07;
      const target = rng() * totalLen;
      let lo = 0, hi = segs.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (segs[mid][6] < target) lo = mid + 1; else hi = mid; }
      const s = segs[lo];
      const t = rng();
      arr[i3] = s[0] + (s[3] - s[0]) * t + (rng() - 0.5) * j;
      arr[i3 + 1] = s[1] + (s[4] - s[1]) * t + (rng() - 0.5) * j;
      arr[i3 + 2] = s[2] + (s[5] - s[2]) * t + (rng() - 0.5) * j;
    } else if (pick < 0.96) {
      // structured dots
      const target = rng() * dotWeight;
      let d = dots[0];
      for (const cand of dots) { if (cand.w >= target) { d = cand; break; } }
      if (d.kind === 'lattice') {
        const ix = (rng() * d.nx) | 0, iz = (rng() * d.nz) | 0;
        arr[i3] = d.cx - d.w / 2 + (ix + 0.5) * (d.w / d.nx) + (rng() - 0.5) * 0.006;
        arr[i3 + 1] = d.y + (rng() - 0.5) * 0.006;
        arr[i3 + 2] = d.cz - d.d / 2 + (iz + 0.5) * (d.d / d.nz) + (rng() - 0.5) * 0.006;
      } else {
        const k = (rng() * d.n) | 0;
        const t = (k + 0.5) / d.n;
        arr[i3] = d.x1 + (d.x2 - d.x1) * t + (rng() - 0.5) * 0.006;
        arr[i3 + 1] = d.y + (rng() - 0.5) * 0.006;
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

/* ============================================================
   Vector skeletons for shapes whose particle generators are custom
   (mandala / enso / beacon keep their handcrafted distributions;
   these skeletons trace the same geometry for the line layer).
   Constants MUST match the generators above.
   ============================================================ */
const mandalaRelief = (r) => 0.06 * Math.sin(r * 2.4);

export function mandalaStructure() {
  const st = newStructure();
  for (const R of [0.3, 1.02, 2.24, 2.34]) {
    addCircle(st, R, R > 2 ? 170 : 110, { relief: mandalaRelief });
  }
  for (let k = 0; k < 8; k++) addPetal(st, k, 8, 0.62, 0.34, 0.16, 56, mandalaRelief);
  for (let k = 0; k < 12; k++) {
    addPetal(st, k, 12, 1.62, 0.55, 0.24, 64, mandalaRelief);
    addPetal(st, k, 12, 1.55, 0.36, 0.13, 44, mandalaRelief);
  }
  for (let k = 0; k < 24; k++) {
    const phi = (k / 24) * Math.PI * 2 + Math.PI / 24;
    addSeg(st,
      Math.cos(phi) * 0.34, mandalaRelief(0.34), Math.sin(phi) * 0.34,
      Math.cos(phi) * 0.98, mandalaRelief(0.98), Math.sin(phi) * 0.98);
  }
  return st;
}

export function ensoStructure() {
  // Plain centerline arc, stopped short of the brush tails — the
  // particle stroke wobbles and curls around it; a wobbling skeleton
  // fights the brush instead of anchoring it.
  const st = newStructure();
  const gap = 42 * (Math.PI / 180);
  const start = Math.PI * 0.5 + gap / 2;
  const sweep = Math.PI * 2 - gap;
  const pts = [];
  for (let i = 0; i <= 130; i++) {
    const t = 0.05 + (i / 130) * 0.9;
    const theta = start + sweep * t;
    pts.push([Math.cos(theta) * 1.75, 0, Math.sin(theta) * 1.75]);
  }
  addPolyline(st, pts);
  return st;
}

export function beaconStructure() {
  const st = newStructure();
  addCircle(st, 0.5, 90, {});
  addCircle(st, 1.0, 120, {});
  addCircle(st, 1.5, 150, {});
  addCircle(st, 2.0, 170, {});
  for (let k = 0; k < 12; k++) {
    const phi = (k / 12) * Math.PI * 2;
    addSeg(st, Math.cos(phi) * 0.92, 0, Math.sin(phi) * 0.92, Math.cos(phi) * 1.08, 0, Math.sin(phi) * 1.08);
  }
  return st;
}

export const GENERATORS = { galaxy, mandala, shield, chip, chipExploded, osmap, sysbloom, enso, beacon };

/* Crisp line-layer specs: skeleton builder + settled opacity per shape.
   galaxy stays pure particle cloud — no skeleton (that's the point). */
export const LINES = {
  mandala:  { build: () => segsToPositions(mandalaStructure()), opacity: 0.5 },
  shield:   { build: () => segsToPositions(shieldStructure()), opacity: 0.7 },
  chip:     { build: () => segsToPositions(chipStructure(0)), opacity: 0.65 },
  osmap:    { build: () => segsToPositions(osmapStructure()), opacity: 0.8 },
  sysbloom: { build: () => segsToPositions(sysbloomStructure()), opacity: 0.75 },
  enso:     { build: () => segsToPositions(ensoStructure()), opacity: 0.3 },
  beacon:   { build: () => segsToPositions(beaconStructure()), opacity: 0.55 },
};
