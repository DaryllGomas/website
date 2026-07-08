/* ============================================================
   artifacts.js — Chapter 04 "Artifacts" catalog interaction.

   The full ~35-project catalog is static HTML in index.html — every
   category panel and every row is already in the DOM, and each header
   button ships with aria-expanded="true" in the markup. That means with
   zero JavaScript every category renders fully expanded: nothing here is
   load-bearing for content visibility, only for the collapsed-by-default
   accordion behavior and its animation.

   This module is a pure progressive enhancement:
     1. Flips on html.js-artifacts, which is what makes v2.css collapse
        panels by default (see the html.js-artifacts rules in v2.css).
     2. Wires each header button to toggle its panel, updating
        aria-expanded and animating open/close via inline max-height
        (the transition itself lives in CSS).
     3. Keeps open panels' max-height in sync on resize, since text
        reflow changes scrollHeight.
   ============================================================ */

export function initArtifacts() {
  const catalog = document.getElementById('artifact-catalog');
  if (!catalog) return;

  const groups = Array.from(catalog.querySelectorAll('.artifact-group'));
  if (!groups.length) return;

  // Only now do we collapse panels by default — see the CSS comment above
  // html.js-artifacts .artifact-group-panel in v2.css.
  document.documentElement.classList.add('js-artifacts');

  groups.forEach((group) => {
    const header = group.querySelector('.artifact-group-header');
    const panel = group.querySelector('.artifact-group-panel');
    if (!header || !panel) return;

    // Static markup ships aria-expanded="true" (the fully-visible no-JS
    // default) — collapse it now that this script owns the open/close
    // state and animation.
    header.setAttribute('aria-expanded', 'false');
    panel.style.maxHeight = '0px';

    header.addEventListener('click', () => {
      const isOpen = group.classList.toggle('is-open');
      header.setAttribute('aria-expanded', String(isOpen));
      panel.style.maxHeight = isOpen ? `${panel.scrollHeight}px` : '0px';
    });
  });

  // Open panels' content can rewrap (viewport resize, font load, etc.),
  // changing scrollHeight — resync so an open panel never clips or leaves
  // a stale gap.
  window.addEventListener('resize', () => {
    groups.forEach((group) => {
      if (!group.classList.contains('is-open')) return;
      const panel = group.querySelector('.artifact-group-panel');
      if (panel) panel.style.maxHeight = `${panel.scrollHeight}px`;
    });
  });
}
