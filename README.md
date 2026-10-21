# daryllgomas.com

Daryll's personal site: "The Big Picture", one continuous scroll from the galaxy down to the atom (WebGL only, by
Daryll's choice: no fallback page. If the 3D context drops, the page reloads in place and the galaxy restarts).

- **Runs on:** GitHub Pages from `github.com/DaryllGomas/website` (`CNAME` = daryllgomas.com). Pushing `main` deploys.
  Push only on Daryll's say-so.
- **Preview locally:** `python3 -m http.server 8811 --bind 127.0.0.1`, then open http://127.0.0.1:8811/
- **The page:** everything lives in `index.html` (styles, markup and the scene script) plus `systems/` (the case study,
  opened as a pop-up). Old versions (`legacy.html`, `v2/`, `v3-mockups/`, `backup/`, old css/js/sass/fonts) were removed
  on 2026-10-20 after a leak review; they remain in git history.
- **Drive docs:** `~/BigPic/_Income/Online Presence/README.md` (the plan for all public surfaces) and
  `~/BigPic/_Income/Expert Work/Master Profile.md` (the one source for bios and claims).

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
