/* portfolio-v1 — shared behaviour. Plain JS, no libraries. */
document.documentElement.classList.add('js');

/* Contact: the address is not in the page. Same mechanism as the live site's "Discuss a project":
   it is put together from character codes only after a real click, so email-harvesting bots that read
   the HTML find nothing, and there is no form for bots to submit. No mailto: anywhere.
   Any button with data-talk="<box id>" opens that box. */
(function () {
  var parts = [[100,97,114,121,108,108,46,103,111,109,97,115],[103,109,97,105,108],[99,111,109]];
  function addr() { return String.fromCharCode.apply(null, parts[0]) + '@' + String.fromCharCode.apply(null, parts[1]) + '.' + String.fromCharCode.apply(null, parts[2]); }
  [].forEach.call(document.querySelectorAll('[data-talk]'), function (btn) {
    var box = document.getElementById(btn.getAttribute('data-talk')); if (!box) return;
    btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', box.id);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = box.hidden; box.hidden = !open; btn.setAttribute('aria-expanded', String(open));
      if (open) box.querySelector('.talk-mail').textContent = addr();
    });
    var copy = box.querySelector('.talk-copy');
    if (copy) copy.addEventListener('click', function () {
      var b = this, done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(addr()).then(done, function () {}); else done();
    });
  });
  // Close a floating (header) box on outside click or Escape.
  document.addEventListener('click', function (e) {
    [].forEach.call(document.querySelectorAll('.talk-box.pop:not([hidden])'), function (b) { if (!b.contains(e.target)) b.hidden = true; });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') [].forEach.call(document.querySelectorAll('.talk-box.pop'), function (b) { b.hidden = true; }); });
})();

/* Reveal on scroll: a gentle fade-up, once. */
(function () {
  var els = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) { [].forEach.call(els, function (el) { el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  [].forEach.call(els, function (el) { io.observe(el); });
})();

/* Floating "back to top" (+ Home on inner pages), bottom right. Appears after about one and a half screens.
   Where the page margin is wide enough it sits in the margin and stays; on narrower screens it would cover text,
   so there it only shows while you scroll back up, or at the end of the page. Hidden at the top and under the lightbox. */
(function () {
  var home = document.querySelector('.top .nav-home');
  var fab = document.createElement('div'); fab.className = 'fab'; fab.setAttribute('role', 'group'); fab.setAttribute('aria-label', 'Page shortcuts');
  var house = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.2 12 4.5l8 6.7"/><path d="M6.5 9.5V19.5h4v-5h3v5h4V9.5"/></svg>';
  var up = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5.5M6 11.5l6-6 6 6"/></svg>';
  fab.innerHTML = (home ? '<a class="fab-b" href="' + home.getAttribute('href') + '" aria-label="Home" title="Home">' + house + '</a>' : '') +
    '<button type="button" class="fab-b" aria-label="Back to top" title="Back to top">' + up + '</button>';
  document.body.appendChild(fab);
  fab.querySelector('button').addEventListener('click', function () {
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    var first = document.querySelector('.top a, .top button'); if (first) first.focus({ preventScroll: true });
  });
  var lastY = window.scrollY, dirUp = false, queued = false;
  function update() {
    queued = false;
    var y = window.scrollY, vh = window.innerHeight, docH = document.documentElement.scrollHeight;
    if (Math.abs(y - lastY) > 6) { dirUp = y < lastY; lastY = y; }
    var roomy = window.innerWidth >= 1240;                       // the right margin can hold it without covering text
    var nearEnd = y + vh > docH - vh * 0.35;
    var show = y > vh * 1.5 && !document.documentElement.classList.contains('lb-lock') && (roomy || dirUp || nearEnd) && !overTarget();
    fab.classList.toggle('on', show);
  }
  // Never sit on top of something tappable: if any link, button or field is under the control's box, step aside.
  var TAP = 'a[href], button, input, select, textarea, summary, [role="button"], [role="switch"], [tabindex]:not([tabindex="-1"])';
  function overTarget() {
    var W = window.innerWidth, H = window.innerHeight, cs = getComputedStyle(fab);
    var rt = parseFloat(cs.right) || 16, bt = parseFloat(cs.bottom) || 16, m = 6;
    var x1 = W - rt - fab.offsetWidth - m, x2 = W - rt + m, y2 = H - bt + m, y1 = H - bt - fab.offsetHeight - m;
    var els = document.querySelectorAll(TAP);
    for (var i = 0; i < els.length; i++) {
      var e = els[i]; if (fab.contains(e)) continue;
      var r = e.getBoundingClientRect();
      if (r.width && r.height && r.right > x1 && r.left < x2 && r.bottom > y1 && r.top < y2 && getComputedStyle(e).visibility !== 'hidden') return true;
    }
    return false;
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  addEventListener('scroll', queue, { passive: true }); addEventListener('resize', queue);
  new MutationObserver(queue).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  update();
})();
