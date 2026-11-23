/* Click to enlarge. Plain JS, no libraries. Any button with data-lightbox="<element id>" opens a full-screen
   copy of that element; close with the button, a click on the backdrop, or Escape. Focus returns to the opener. */
(function () {
  var openers = document.querySelectorAll('[data-lightbox]'); if (!openers.length) return;
  var lb = document.createElement('div'); lb.className = 'lb'; lb.hidden = true;
  lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Enlarged diagram');
  lb.innerHTML = '<button type="button" class="lb-x" aria-label="Close">Close <span aria-hidden="true">✕</span></button><div class="lb-in"></div>';
  document.body.appendChild(lb);
  var inner = lb.querySelector('.lb-in'), x = lb.querySelector('.lb-x'), last = null;
  function close() { lb.classList.remove('on'); document.documentElement.classList.remove('lb-lock'); setTimeout(function () { lb.hidden = true; inner.innerHTML = ''; }, 220); if (last) last.focus(); }
  [].forEach.call(openers, function (b) {
    b.addEventListener('click', function () {
      var src = document.getElementById(b.getAttribute('data-lightbox')); if (!src) return;
      last = b; inner.innerHTML = ''; inner.appendChild(src.cloneNode(true)).removeAttribute('id');
      [].forEach.call(inner.querySelectorAll('.fx-dim, .fx-lit'), function (el) { el.classList.remove('fx-dim', 'fx-lit'); });   // a copy of a flow diagram shows whole, not mid-highlight
      lb.hidden = false; document.documentElement.classList.add('lb-lock');
      requestAnimationFrame(function () { lb.classList.add('on'); x.focus(); });
      var sc = inner.firstChild; if (sc.scrollWidth > sc.clientWidth) sc.scrollLeft = sc.querySelector('svg.flow') ? 0 : (sc.scrollWidth - sc.clientWidth) * 0.62;   // flow diagrams read left to right: start at the left
    });
  });
  x.addEventListener('click', close);
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === inner) close(); });
  document.addEventListener('keydown', function (e) { if (!lb.hidden && e.key === 'Escape') close(); });
  // Phones: start the in-page sideways-scroll diagram centred on SENTINEL's row
  [].forEach.call(document.querySelectorAll('.netmap-scroll'), function (s) { if (s.scrollWidth > s.clientWidth) s.scrollLeft = (s.scrollWidth - s.clientWidth) * 0.62; });
})();
