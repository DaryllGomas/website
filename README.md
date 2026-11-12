# daryllgomas.com

Daryll's personal site. Since 2026-11-12 it is a project-first portfolio:

| Address | What |
|---|---|
| `/` (`index.html`) | Plain home: who he is, then projects on two shelves with filters and search |
| `/projects/<slug>/` | One page per project from one template (problem, what I built, diagram, tools, proof, tested, next). So far: `monitoring`, `security-audit` |
| `/galaxy/` | "The Big Picture", the earlier site, kept as a design concept: one scroll from the galaxy to the atom (WebGL only; no fallback page) |
| `/resume/` | Résumé page (look "Scan rail"); PDF and Word beside it come from the Résumé project's PUBLIC master |
| `/systems/`, `/security/` | Network case study and the SAMPLE security report (fictional business); also opened as pop-ups from the galaxy |

Shared files for the new pages: `assets/site.css`, `site.js`, `project.css`, `toc.js`, `lightbox.js`, `fx.js`, `fx.css`,
`assets/img/`. The mockup, the fact checks behind every number (`notes/claims-check.md`, `notes/final-audit.md`) and the
handoff live in `~/Projects/sites/_mockups/portfolio-v1/`. **Every number on a public page must trace to a file or a
measurement.** The galaxy sections below describe `/galaxy/`.

- **Runs on:** GitHub Pages from `github.com/DaryllGomas/website` (`CNAME` = daryllgomas.com). Pushing `master` deploys.
  Push only on Daryll's say-so.
- **Preview locally:** `python3 -m http.server 8811 --bind 127.0.0.1`, then open http://127.0.0.1:8811/
- **The page:** everything lives in `index.html` (styles, markup and the scene script) plus `systems/` (the case study,
  opened as a pop-up). Old versions (`legacy.html`, `v2/`, `v3-mockups/`, `backup/`, old css/js/sass/fonts) were removed
  on 2026-10-20 after a leak review; they remain in git history.
- **Drive docs:** `~/BigPic/_Income/Online Presence/README.md` (the plan for all public surfaces) and
  `~/BigPic/_Income/Expert Work/Master Profile.md` (the one source for bios and claims).

## The first screen, v2 (live 2026-11-11)
Rebuilt with Daryll (mockup: `~/Projects/sites/_mockups/daryllgomas-hero/v1`). A visitor knows who he is at a glance:
photo and name with "AI systems builder · 25 years in IT", the pitch "Designing and implementing systems that use the
right tools for the right job", two buttons, then **technical work first** (network build-out, security audit sample),
then the picture cards (Swarm AI, Town Hall, The Studio, Ancients), "What I do" and links.
- **"Discuss a project"** reveals his personal Gmail (his choice, 2026-10-29 and 11-12) only after a click (assembled in JS; no form, no
  `mailto:`), so harvesting bots find nothing in the HTML.
- **`security/`** is a SAMPLE report for a FICTIONAL dental office, built by `~/Projects/tools/security-sweep/report.py`.
  Never publish a real scan here.
- **`resume/`** is built by the Résumé project (`~/Projects/business/resume/web/build_web.py`) from its PUBLIC master
  (no phone number). Don't hand-edit it; rebuild and copy.
- **One scroll:** when the first panel is taller than the screen, the page's own scroll slides its contents up, then
  carries on into the descent (no scroll inside a scroll). On phones the journey is shorter (`.track` 800vh).
- **Tests** (on Atlas, `~/render`): `qa-hero.mjs` (six sizes), `phone-journey.mjs` (touch swipes top to bottom),
  `phone-taps.mjs` (every main control).

## The first screen (2026-10-20)
Everything that matters is on the first screen, in a tall column: photo, name, the bio from X, the tagline
"Imagine it. Build it. Share it.", the live projects ("Building now"), and links (X, GitHub, BigPic, email). The
galaxy descent starts when you scroll.

## Systems case study (2026-10-20)
`systems/index.html` (daryllgomas.com/systems/): an anonymized network and systems build-out, linked from the first
screen. Roles only: no hostnames, addresses, internal domains, accounts, ports, firmware versions or known gaps.
Facts come from `~/BigPic/BigPic - Technology/Infrastructure/` and `~/Projects/systems/control-plane/docs/`.
Before changing it, re-check the never-show list (top comment in the file).

## Plan: the galaxy's "Selected work" (Daryll, 2026-10-20)
The imagination section (the 3D star graph, `const CATS` in index.html) gets rebuilt and **thinned out** so it's easy
to navigate. Every item on the first screen maps to a star in a matching sector. Clicking an item on the first
screen flies the camera into that sector and lists it there, for the deeper view.
**No standalone pages** (Daryll, 2026-10-20): every deeper view, including the systems case study now at
`systems/`, becomes a **modal pop-up over the galaxy**, designed to flow with the rest of the site (same type, hairlines,
amber accents, starfield showing through). `systems/` stays only until its content moves into a modal. The graph today has 38 stars in
7 groups, many archived; it should hold only what's live and worth showing.

## To do
- [ ] **Before going live:** the public GitHub history still holds the old pages (an internal address, service ports,
  a business email). Decide with Daryll: publish from a fresh history, or accept it.
- [ ] **Markets (off the site entirely, 2026-10-21):** Daryll took the Markets orbit off for now (The House moved into The Studio; nothing links to the markets site):
  "too much work that needs to be done. I'll come back." What he wants it to become: a public, easy-to-digest daily
  report that shares the important market information he gets, run so cheaply (in tokens) that he'd barely notice it.
- [x] **Certifications:** "Network+" relabeled "Network+ course" (Daryll, 10-20: passed the course, never took the CompTIA exam).
- [x] **Contact email:** keep the Gmail (Daryll, 10-20).
- [x] Thin Selected work: 15 live projects in 5 constellations (2026-10-20).
- [x] Orbits (2026-10-20): each constellation circles its hub; clicking a hub, a star or a first-screen item opens its orbit pop-up (list + a detail card per project). Content lives in `ORBITS` near the end of index.html.
- [ ] Optional: fly the camera into the sector before the pop-up opens.
- [x] Codex follow-ups (2026-10-20): hidden chapters inert; orbit buttons in Selected work (keyboard + no-WebGL access); flat-mode galaxy art redrawn; reduced motion turns off smooth scroll, camera drift and orbit motion; chapters left alone after a fall back to flat mode.
- [x] Systems case study opens as a pop-up (iframe of `systems/`), not a page visit.
- [x] Hero shade feathered (no hard box against the galaxy).
