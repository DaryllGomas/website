# daryllgomas.com

Daryll Gomas's personal site: a project-first portfolio.

| Address | What |
|---|---|
| `/` | Home: who he is, then projects on two shelves with filters and search |
| `/projects/<name>/` | One page per project, all from one template: problem, what I built, how it works, tools, proof, tested and run, next, skills |
| `/galaxy/` | "The Big Picture", an earlier version of the site, kept as a design concept (WebGL) |
| `/resume/` | Résumé page, with PDF and Word downloads |
| `/systems/`, `/security/` | An anonymized network case study, and a sample security report for a fictional business |

## How it's built
Plain HTML, CSS and JavaScript. No build step, no frameworks, no trackers. Shared styles and scripts are in `assets/`.

## Preview
`python3 -m http.server 8811 --bind 127.0.0.1`, then open http://127.0.0.1:8811/

## Deploy
GitHub Pages serves this repository at daryllgomas.com. Pushing `master` publishes it.

## Rules for this repository
- **Everything here is public.** Every file is served by the site and visible on GitHub. No working notes, plans, internal
  paths or private details: not in files, not in HTML comments.
- Every number on a page traces to a source or a measurement.
- Examples and samples are labeled as such. No client names, no private data.
- Project pages stay alike: the same eight sections in the same order, shared blocks from `assets/project.css`, and every
  flow diagram drawn on the same canvas so its text is the same size on every page.
