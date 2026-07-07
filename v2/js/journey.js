/* ============================================================
   journey.js — Lenis + ScrollTrigger wiring, camera choreography,
   DOM chapter reveals. Consumed by main.js, which owns the RAF
   loop and calls the returned update(dt, elapsed) once per frame.

   Reduced-motion: returns a no-op API immediately — the page uses
   plain scrolling with the CSS-only stacked-chapter fallback.
   Missing GSAP/ScrollTrigger/Lenis (CDN failure): same no-op
   fallback, logged to console.
   ============================================================ */

export function initJourney({ camera, particleSystem, reducedMotion }) {
  if (reducedMotion) {
    return { update() {} };
  }

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const LenisCtor = window.Lenis;

  if (!gsap || !ScrollTrigger || !LenisCtor) {
    console.warn('[journey] GSAP / ScrollTrigger / Lenis unavailable — plain scroll fallback active.');
    return { update() {} };
  }

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('js-journey');

  const lenis = new LenisCtor({ duration: 1.15, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* id matches data-chapter on .spacer / .chapter / .rail-dot.
     morph: null means "keep current shape" (ARTIFACTS pulls the
     camera back + slows into an orbital read of whatever shape
     is already settled, per spec — no new morph target). */
  const CHAPTERS = [
    { id: 0, morph: 'galaxy',  cam: { pos: [0.00, 0.20, 6.20], look: [0, 0.00, 0] } },
    /* mandala + enso lie in the XZ plane (like the galaxy disc) — the
       camera cranes overhead for those chapters so the geometry reads
       face-on instead of edge-on. Keyhole is upright (XY), level cam. */
    { id: 1, morph: 'mandala', cam: { pos: [0.00, 5.60, 1.90], look: [-0.70, 0.00, 0] } },
    { id: 2, morph: 'keyhole', cam: { pos: [0.55, 0.10, 4.60], look: [0, 0.10, 0] } },
    { id: 3, morph: 'network', cam: { pos: [-0.60, 0.30, 4.90], look: [0, 0.00, 0] } },
    { id: 4, morph: null,      cam: { pos: [0.00, 0.15, 7.60], look: [0, 0.00, 0] } },
    { id: 5, morph: 'enso',    cam: { pos: [0.20, 4.40, 1.60], look: [-0.50, 0.00, 0] } },
    { id: 6, morph: 'core',    cam: { pos: [0.00, 0.10, 5.50], look: [0, 0.00, 0] } },
  ];

  const chapterEls = CHAPTERS.map((c) => document.querySelector(`.chapter[data-chapter="${c.id}"]`));
  const spacerEls = CHAPTERS.map((c) => document.querySelector(`.spacer[data-chapter="${c.id}"]`));
  const railDots = Array.from(document.querySelectorAll('.rail-dot'));
  const spacersContainer = document.querySelector('.scroll-spacers');

  chapterEls.forEach((el, i) => {
    if (!el) return;
    gsap.set(el, {
      autoAlpha: i === 0 ? 1 : 0,
      y: i === 0 ? 0 : 16,
      pointerEvents: i === 0 ? 'auto' : 'none',
    });
  });
  if (railDots[0]) railDots[0].classList.add('is-active');

  let activeIndex = 0;

  function goToChapter(index) {
    if (index === activeIndex) return;
    const prevEl = chapterEls[activeIndex];
    const nextEl = chapterEls[index];

    // Swap interactivity immediately so the outgoing chapter's links
    // can't be clicked mid-fade and the incoming one is clickable at once.
    if (prevEl) gsap.set(prevEl, { pointerEvents: 'none' });
    if (nextEl) gsap.set(nextEl, { pointerEvents: 'auto' });

    if (prevEl) gsap.to(prevEl, { autoAlpha: 0, y: -16, duration: 0.6, ease: 'power2.out' });
    if (nextEl) gsap.fromTo(nextEl, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' });

    railDots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    activeIndex = index;

    const chapter = CHAPTERS[index];
    if (particleSystem) {
      if (chapter.morph) particleSystem.morphTo(chapter.morph);
      // mandala breathing: radial pulse ramps in only for chapter 01, out otherwise
      gsap.to(particleSystem.uniforms.uPulseAmt, {
        value: chapter.id === 1 ? 1 : 0,
        duration: 1.2,
        ease: 'power2.out',
        overwrite: true,
      });
    }
  }

  spacerEls.forEach((spacer, i) => {
    if (!spacer) return;
    ScrollTrigger.create({
      trigger: spacer,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => goToChapter(i),
      onEnterBack: () => goToChapter(i),
    });
  });

  /* ---------- camera choreography: continuous scroll-progress lerp ---------- */
  const basePos = { x: CHAPTERS[0].cam.pos[0], y: CHAPTERS[0].cam.pos[1], z: CHAPTERS[0].cam.pos[2] };
  const baseLook = { x: CHAPTERS[0].cam.look[0], y: CHAPTERS[0].cam.look[1], z: CHAPTERS[0].cam.look[2] };

  const smoothstep = (t) => {
    const x = Math.min(Math.max(t, 0), 1);
    return x * x * (3 - 2 * x);
  };
  const lerp = (a, b, t) => a + (b - a) * t;

  if (spacersContainer && camera) {
    ScrollTrigger.create({
      trigger: spacersContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const floatIndex = self.progress * (CHAPTERS.length - 1);
        const i0 = Math.floor(floatIndex);
        const i1 = Math.min(i0 + 1, CHAPTERS.length - 1);
        const t = smoothstep(floatIndex - i0);
        const a = CHAPTERS[i0].cam;
        const b = CHAPTERS[i1].cam;
        basePos.x = lerp(a.pos[0], b.pos[0], t);
        basePos.y = lerp(a.pos[1], b.pos[1], t);
        basePos.z = lerp(a.pos[2], b.pos[2], t);
        baseLook.x = lerp(a.look[0], b.look[0], t);
        baseLook.y = lerp(a.look[1], b.look[1], t);
        baseLook.z = lerp(a.look[2], b.look[2], t);
      },
    });
  }

  /* ---------- slow ambient rotation — doubles as ARTIFACTS "orbital ring" read ---------- */
  function applyRotation(dt) {
    if (particleSystem && particleSystem.object3D) {
      particleSystem.object3D.rotation.y += dt * 0.025;
    }
  }

  /* ---------- mouse parallax — fine pointers only, per spec ---------- */
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;
  const parallax = { x: 0, y: 0 };
  const parallaxTarget = { x: 0, y: 0 };

  if (isFinePointer) {
    window.addEventListener('pointermove', (event) => {
      parallaxTarget.x = (event.clientX / window.innerWidth - 0.5) * 2;
      parallaxTarget.y = (event.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  function update(dt) {
    applyRotation(dt);
    if (!camera) return;

    const lerpSpeed = Math.min(dt * 2.5, 1);
    parallax.x += (parallaxTarget.x - parallax.x) * lerpSpeed;
    parallax.y += (parallaxTarget.y - parallax.y) * lerpSpeed;

    const px = isFinePointer ? parallax.x * 0.18 : 0;
    const py = isFinePointer ? -parallax.y * 0.12 : 0;

    camera.position.set(basePos.x + px, basePos.y + py, basePos.z);
    camera.userData.lookTarget.set(baseLook.x, baseLook.y, baseLook.z);
  }

  return { update, goToChapter };
}
