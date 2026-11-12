/* Project pages: highlight the section you're reading in the contents list.
   "Reading" = the last section whose top has passed a line just under the sticky top bar. Right after a click on an
   entry, that entry stays lit (the last sections can't always scroll up to the line) until the reader scrolls on their own. */
(function () {
  var links = [].slice.call(document.querySelectorAll('.toc a')); if (!links.length) return;
  var secs = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var bar = document.querySelector('.top'), forced = -1, queued = false, lit = -2;
  function line() { return (bar ? bar.getBoundingClientRect().bottom : 0) + 32; }
  function current() {
    var y = line(), n = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= y) n = i; });
    return n;
  }
  function paint() {
    queued = false;
    var n = forced >= 0 ? forced : current(); if (n === lit) return; lit = n;
    links.forEach(function (a, i) { a.classList.toggle('on', i === n); if (i === n) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(paint); } }
  links.forEach(function (a, i) { a.addEventListener('click', function () { forced = i; paint(); }); });
  function release() { if (forced >= 0) { forced = -1; queue(); } }
  ['wheel', 'touchstart', 'pointerdown'].forEach(function (t) { addEventListener(t, function (e) { if (!(e.target.closest && e.target.closest('.toc'))) release(); }, { passive: true }); });
  addEventListener('keydown', function (e) { if (/^(Arrow|Page|Home|End| )/.test(e.key) || e.key === ' ') release(); });
  addEventListener('scroll', queue, { passive: true }); addEventListener('resize', queue);
  paint();
})();
