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
     3. Enforces one-open-at-a-time: opening a group closes whichever
        other group was open, so the chapter never stacks multiple tall
        panels at once.
     4. Opens the first group (Trading Ecosystem) by default once panels
        are collapsed, so JS visitors never see a wall of closed gray
        rows on arrival — only no-JS visitors get the all-expanded state.
     5. Keeps open panels' max-height in sync on resize and on web-font
        load, since text reflow changes scrollHeight.

   A non-obvious wrinkle in (4)/(5): this init runs at page boot, while
   chapter-4 is still the *inactive* chapter — journey.js/GSAP puts
   inactive chapters at `visibility: hidden` (in addition to opacity: 0)
   until the user scrolls to them. Changing max-height on an element
   inside a visibility:hidden subtree while a CSS transition is declared
   on it leaves the transition "stuck": Chrome keeps reporting the
   pre-change computed height (0px) indefinitely, even though the inline
   style is correctly set — because the transition never gets a paint
   tick to resolve while hidden, and it doesn't reliably catch up once the
   chapter becomes visible either. Verified by testing directly against
   the live page. The fix is to apply the *initial* open/resync heights
   with the transition briefly disabled (setPanelHeight's `instant`
   path) — no animation is visible anyway before the user has scrolled
   here. Genuine user clicks always happen while the chapter is already
   visible, so those keep the normal animated transition.
   ============================================================ */

function setPanelHeight(panel, px, { instant = false } = {}) {
  if (!instant) {
    panel.style.maxHeight = `${px}px`;
    return;
  }
  const prevTransition = panel.style.transition;
  panel.style.transition = 'none';
  panel.style.maxHeight = `${px}px`;
  void panel.offsetHeight; // force a reflow so the disabled transition is committed first
  panel.style.transition = prevTransition;
}

export function initArtifacts() {
  const catalog = document.getElementById('artifact-catalog');
  if (!catalog) return;

  const groups = Array.from(catalog.querySelectorAll('.artifact-group'));
  if (!groups.length) return;

  // Only now do we collapse panels by default — see the CSS comment above
  // html.js-artifacts .artifact-group-panel in v2.css.
  document.documentElement.classList.add('js-artifacts');

  function closeGroup(group, opts) {
    const header = group.querySelector('.artifact-group-header');
    const panel = group.querySelector('.artifact-group-panel');
    if (!header || !panel) return;
    group.classList.remove('is-open');
    header.setAttribute('aria-expanded', 'false');
    setPanelHeight(panel, 0, opts);
  }

  function openGroup(group, opts) {
    const header = group.querySelector('.artifact-group-header');
    const panel = group.querySelector('.artifact-group-panel');
    if (!header || !panel) return;
    group.classList.add('is-open');
    header.setAttribute('aria-expanded', 'true');
    setPanelHeight(panel, panel.scrollHeight, opts);
  }

  groups.forEach((group) => {
    const header = group.querySelector('.artifact-group-header');
    const panel = group.querySelector('.artifact-group-panel');
    if (!header || !panel) return;

    // Static markup ships aria-expanded="true" (the fully-visible no-JS
    // default) — collapse it now that this script owns the open/close
    // state and animation. Instant: this all happens before the user has
    // seen the chapter, nothing to animate yet.
    closeGroup(group, { instant: true });

    header.addEventListener('click', () => {
      const isOpen = group.classList.contains('is-open');
      if (isOpen) {
        closeGroup(group);
        return;
      }
      // One open at a time — close any other open group before opening
      // this one, so both animate via the same max-height transition.
      groups.forEach((other) => {
        if (other !== group && other.classList.contains('is-open')) {
          closeGroup(other);
        }
      });
      openGroup(group);
    });
  });

  // First group open by default (JS-active state only — no-JS visitors
  // already see everything expanded via the static markup). Instant, for
  // the same reason as the initial close above.
  openGroup(groups[0], { instant: true });

  // Open panels' content can rewrap (viewport resize, font load, etc.),
  // changing scrollHeight — resync so an open panel never clips or leaves
  // a stale gap. Both triggers can fire before the chapter is ever shown,
  // so these are instant too rather than visibly animating unprompted.
  function resyncOpenPanels() {
    groups.forEach((group) => {
      if (!group.classList.contains('is-open')) return;
      const panel = group.querySelector('.artifact-group-panel');
      if (panel) setPanelHeight(panel, panel.scrollHeight, { instant: true });
    });
  }

  window.addEventListener('resize', resyncOpenPanels);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(resyncOpenPanels);
  }
}
