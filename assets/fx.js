/* portfolio-v1 — five quiet effects. Plain JS, no libraries, nothing loaded from anywhere else.
   Each effect has start() and stop(); stop() removes every listener, timer, element and animation it made, so an effect
   that is off costs nothing. Under prefers-reduced-motion the moving ones stay off
   (morph, sky, galaxy); the jump menu still works, without animation, and the diagram highlights without fading.
   All five are always on (DGFX.set(id, false) still turns one off cleanly, for testing). Styles: assets/fx.css. */
(function () {
  var me = document.currentScript && document.currentScript.src;
  var ROOT = me ? me.replace(/assets\/fx\.js(\?.*)?$/, '') : '/';
  var reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  function reduced() { return reduceMQ.matches; }
  var FX = {}, ORDER = [];
  function def(id, label, impl) { FX[id] = { label: label, impl: impl, on: false }; ORDER.push(id); }

  window.DGFX = {
    root: ROOT,
    list: function () { return ORDER.map(function (id) { return { id: id, label: FX[id].label, on: FX[id].on, here: FX[id].impl.here() }; }); },
    isOn: function (id) { return !!(FX[id] && FX[id].on); },
    set: function (id, on) {
      var f = FX[id]; on = !!on; if (!f || f.on === on) return;
      f.on = on;
      try { if (on) f.impl.start(); else f.impl.stop(); } catch (e) { if (window.console) console.warn('fx ' + id, e); }
    },
    fx: FX
  };

  /* ================= 1. Morph (cross-document view transitions) =================
     The CSS opt-in (@view-transition) and the shared names (data-morph) are in fx.css. Off = the browser is told to
     skip the transition on the way out, so the next page simply loads. */
  var morphOn = false;
  function skip(vt) { vt.ready.catch(function () {}); vt.finished.catch(function () {}); vt.skipTransition(); }   // a skip rejects "ready"; keep the console clean
  // Only the new pages opt in (home, projects/*, for/*). Going anywhere else (galaxy, case study, résumé, other sites)
  // the browser would abort the transition and log an error, so skip it on the way out.
  function optedIn(url) {
    if (!url) return false;
    var u = new URL(url, location.href), r = new URL(ROOT, location.href);
    if (u.origin !== r.origin || u.pathname.indexOf(r.pathname) !== 0) return false;
    var rest = u.pathname.slice(r.pathname.length);
    return rest === '' || rest === 'index.html' || /^(projects|for)\/[^/]+\/(index\.html)?$/.test(rest);
  }
  addEventListener('pageswap', function (e) {
    if (!e.viewTransition) return;
    var to = e.activation && e.activation.entry && e.activation.entry.url;
    if (!morphOn || reduced() || !optedIn(to)) skip(e.viewTransition);
    else { e.viewTransition.ready.catch(function () {}); e.viewTransition.finished.catch(function () {}); }
  });
  addEventListener('pagereveal', function (e) {
    if (!e.viewTransition) return;
    if (!morphOn || reduced()) { skip(e.viewTransition); return; }
    e.viewTransition.ready.catch(function () {});
    var html = document.documentElement; html.classList.add('vt-in');
    [].forEach.call(document.querySelectorAll('.pcard.rv'), function (el) { el.classList.add('in'); });
    e.viewTransition.finished.finally(function () { html.classList.remove('vt-in'); });
  });
  def('morph', 'Morph: card into page', {
    here: function () { return !!document.querySelector('[data-morph]'); },
    start: function () { morphOn = true; },
    stop: function () { morphOn = false; }
  });

  /* ================= 2. Living diagram =================
     The breakdown cards under a flow diagram are its steps, in order (on the audit page the coverage table is step 1).
     Each diagram column is one step. Scrolling through lights the steps in order; hovering or tapping a card lights its
     part of the diagram. */
  def('diagram', 'Living diagram', (function () {
    var figs = [], onScroll = null, onResize = null, queued = false, cleanups = [];
    function colsOf(svg, wide) {
      return [].slice.call(svg.querySelectorAll('text.col:not(.sub)'))
        .map(function (t) { return +t.getAttribute(wide ? 'x' : 'y'); }).sort(function (a, b) { return a - b; });
    }
    function stageAt(cols, v) { var s = 0; for (var i = 0; i < cols.length; i++) if (v >= cols[i]) s = i; return s; }
    function build(fig) {
      var sec = fig.closest('section') || fig.parentNode;
      var steps = [].slice.call(sec.querySelectorAll('.cov, .break > div'));
      var svgs = [].slice.call(fig.querySelectorAll('svg.flow')).map(function (svg) {
        var wide = svg.classList.contains('wide'), cols = colsOf(svg, wide);
        if (cols.length !== steps.length) return null;
        var by = cols.map(function () { return []; }), coreStage = -1, dogs = [];
        [].forEach.call(svg.querySelectorAll('g.nd'), function (g) {
          var r = g.querySelector('rect'); if (!r) return;
          var c = wide ? +r.getAttribute('x') + r.getAttribute('width') / 2 : +r.getAttribute('y') + r.getAttribute('height') / 2;
          var s = stageAt(cols, c);
          if (g.classList.contains('dog')) { dogs.push(g); return; }
          if (g.classList.contains('core')) coreStage = s;
          by[s].push(g);
        });
        dogs.forEach(function (g) { by[coreStage >= 0 ? coreStage : by.length - 1].push(g); });
        // edges (and the packets that ride them) light with the step they arrive at; the first step lights its outgoing ones
        var cur = null;
        [].forEach.call(svg.querySelectorAll('.edges > *'), function (el) {
          if (el.tagName.toLowerCase() === 'path') {
            var n = (el.getAttribute('d') || '').match(/-?\d+(\.\d+)?/g); if (!n || n.length < 4) { cur = null; return; }
            var a = wide ? +n[0] : +n[1], b = wide ? +n[n.length - 2] : +n[n.length - 1];
            var sa = stageAt(cols, a), sb = stageAt(cols, b);
            cur = { s: sb, s0: sa };
            by[sb].push(el); if (sa === 0 && sb !== 0) by[0].push(el);
          } else if (cur && el.classList.contains('pk')) {
            by[cur.s].push(el); if (cur.s0 === 0 && cur.s !== 0) by[0].push(el);
          }
        });
        return { svg: svg, wide: wide, cols: cols, by: by, vb: svg.viewBox.baseVal };
      }).filter(Boolean);
      if (!svgs.length) return null;
      return { fig: fig, steps: steps, svgs: svgs, scroll: -1, hover: -1, pin: -1, pinY: 0, shown: -2 };
    }
    function visibleSvg(f) { for (var i = 0; i < f.svgs.length; i++) if (f.svgs[i].svg.getBoundingClientRect().height > 0) return f.svgs[i]; return null; }
    function scrollStage(f) {
      var vh = innerHeight, a = vh * 0.6, sv = visibleSvg(f); if (!sv) return -1;
      var n = f.steps.length, r = sv.svg.getBoundingClientRect();
      var first = f.steps[0].getBoundingClientRect(), last = f.steps[n - 1].getBoundingClientRect();
      if (sv.wide) {
        // wide layout: one sweep from the diagram's middle to a third of the way into the last row of cards
        var start = r.top + r.height / 2, end = last.top + last.height * 0.35;
        if (a < start || a > last.bottom || end <= start) return -1;
        return Math.max(0, Math.min(n - 1, Math.floor((a - start) / (end - start) * n)));
      }
      // tall layout (phones): while the diagram is under the reading line, its own bands; then the card under the line
      if (a >= r.top && a <= r.bottom) {
        var y = (a - r.top) / r.height * sv.vb.height + sv.vb.y;
        return stageAt(sv.cols, y);
      }
      if (a < first.top || a > last.bottom) return -1;
      var rows = [];
      f.steps.forEach(function (el, i) {
        var b = el.getBoundingClientRect(), row = rows[rows.length - 1];
        if (row && Math.abs(row.top - b.top) < 8) { row.ix.push(i); row.bottom = Math.max(row.bottom, b.bottom); }
        else rows.push({ top: b.top, bottom: b.bottom, ix: [i] });
      });
      for (var k = 0; k < rows.length; k++) {
        var rw = rows[k], nextTop = rows[k + 1] ? rows[k + 1].top : rw.bottom;
        if (a >= rw.top && a < nextTop) return rw.ix[Math.min(rw.ix.length - 1, Math.floor((a - rw.top) / (nextTop - rw.top) * rw.ix.length))];
      }
      return -1;
    }
    function paint(f) {
      var s = f.hover >= 0 ? f.hover : f.pin >= 0 ? f.pin : f.scroll;
      if (s === f.shown) return; f.shown = s;
      f.svgs.forEach(function (sv) {
        sv.svg.classList.toggle('fx-dim', s >= 0);
        sv.by.forEach(function (list, i) { list.forEach(function (el) { el.classList.toggle('fx-lit', i === s); }); });
        // an element listed under two steps (first-step outgoing edges) must stay lit for either
        if (s >= 0) sv.by[s].forEach(function (el) { el.classList.add('fx-lit'); });
      });
      f.steps.forEach(function (el, i) { el.classList.toggle('fx-lit', i === s); });
    }
    function update() {
      queued = false;
      figs.forEach(function (f) {
        if (f.pin >= 0 && Math.abs(scrollY - f.pinY) > innerHeight * 0.5) f.pin = -1;
        f.scroll = scrollStage(f); paint(f);
      });
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
    return {
      here: function () { return !!document.querySelector('.figure svg.flow'); },
      start: function () {
        figs = [].slice.call(document.querySelectorAll('.figure')).map(build).filter(Boolean);
        figs.forEach(function (f) {
          f.steps.forEach(function (el, i) {
            el.classList.add('fx-step');
            var enter = function (e) { if (e.pointerType === 'mouse') { f.hover = i; paint(f); } };
            var leave = function (e) { if (e.pointerType === 'mouse') { f.hover = -1; paint(f); } };
            var tap = function (e) { if (e.target.closest('a, button')) return; f.pin = f.pin === i ? -1 : i; f.pinY = scrollY; paint(f); };
            el.addEventListener('pointerenter', enter); el.addEventListener('pointerleave', leave); el.addEventListener('click', tap);
            cleanups.push(function () { el.removeEventListener('pointerenter', enter); el.removeEventListener('pointerleave', leave); el.removeEventListener('click', tap); el.classList.remove('fx-step', 'fx-lit'); });
          });
        });
        if (!figs.length) return;
        onScroll = queue; onResize = queue;
        addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onResize);
        update();
      },
      stop: function () {
        if (onScroll) { removeEventListener('scroll', onScroll); removeEventListener('resize', onResize); onScroll = onResize = null; }
        cleanups.forEach(function (c) { c(); }); cleanups = [];
        figs.forEach(function (f) { f.hover = f.pin = f.scroll = -1; f.shown = -2; paint(f); f.svgs.forEach(function (sv) { sv.svg.classList.remove('fx-dim'); }); });
        figs = [];
      }
    };
  })());

  /* ================= 3. Jump menu ================= */
  def('jump', 'Jump menu (Ctrl K)', (function () {
    var I = {
      home: '<path d="M4 11.2 12 4.5l8 6.7"/><path d="M6.5 9.5V19.5h4v-5h3v5h4V9.5"/>',
      doc: '<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M10 12h5M10 15.5h5"/>',
      out: '<path d="M8 16 16 8M9.5 8H16v6.5"/>',
      star: '<path d="M12 4v16M4 12h16M7 7l10 10M17 7 7 17"/>',
      mail: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="m4.5 7 7.5 6 7.5-6"/>',
      dot: '<circle cx="12" cy="12" r="3.5"/>'
    };
    function resumeHref() { var a = document.querySelector('.top a[href*="resume"]'); return a ? a.getAttribute('href') : ROOT + 'resume/'; }
    function items() {
      return [
        { g: 'Go to', t: 'Home', k: 'Page', ic: 'home', href: ROOT, w: 'start front all projects work' },
        { g: 'Go to', t: 'Résumé', k: 'Page', ic: 'doc', href: resumeHref(), w: 'resume cv experience' },
        { g: 'Systems & security', t: 'SENTINEL: monitoring', k: 'Project', ic: 'dot', href: ROOT + 'projects/monitoring/', w: 'sentinel prometheus grafana loki alerts incidents' },
        { g: 'Systems & security', t: 'Network & systems build-out', k: 'Case study', ic: 'doc', href: ROOT + 'systems/', w: 'network vlan firewall virtualization server room' },
        { g: 'Systems & security', t: 'Security audit', k: 'Project', ic: 'dot', href: ROOT + 'projects/security-audit/', w: 'security assessment sweep report findings' },
        { g: 'Systems & security', t: 'Backup that proves itself', k: 'Case study', ic: 'doc', href: ROOT + 'systems/', w: 'backup restore hash nightly' },
        { g: 'Systems & security', t: 'Life OS: Life Control', k: 'Project', ic: 'dot', href: ROOT + 'projects/life-os/', w: 'life os tasks board evidence hermes agents walled boards' },
        { g: 'Systems & security', t: 'Heimdall: remote support', k: 'Project', ic: 'dot', href: ROOT + 'projects/heimdall/', w: 'heimdall remote support rustdesk hardened server passkey approval code tunnel security screen sharing' },
        { g: 'Systems & security', t: 'Invoicing & CRM', k: 'Project', ic: 'dot', href: ROOT + 'projects/invoicing/', w: 'invoicing invoice crm clients billing stripe payments ai agent claude code wrap it up business' },
        { g: 'Design & products', t: 'Swarm AI', k: 'Live site', ic: 'out', href: 'https://swarm.bigpicsolutions.com', w: 'swarm agents mcp' },
        { g: 'Design & products', t: 'Town Hall', k: 'Live site', ic: 'out', href: 'https://townhall.bigpicsolutions.com', w: 'town hall civic' },
        { g: 'Design & products', t: 'The Studio', k: 'Live site', ic: 'out', href: 'https://studio.bigpicsolutions.com', w: 'studio games path junction arcade' },
        { g: 'Design & products', t: 'Ancients', k: 'Live site', ic: 'out', href: 'https://ancients.daryllgomas.com/', w: 'ancients history timeline' },
        { g: 'Design & products', t: 'The Big Picture', k: 'Design concept', ic: 'star', href: ROOT + 'galaxy/', w: 'galaxy webgl concept 3d' },
        { g: 'Contact', t: 'Contact', k: 'Show my email', ic: 'mail', act: 'talk', w: 'email contact get in touch write' }
      ];
    }
    var btn = null, dlg = null, q, list, xBtn, last = null, sel = 0, shown = [], onKey = null, all = [];
    function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    function render() {
      var words = norm(q.value.trim()).split(/\s+/).filter(Boolean);
      shown = all.filter(function (it) { var h = norm(it.t + ' ' + it.k + ' ' + it.w); return words.every(function (w) { return h.indexOf(w) >= 0; }); });
      list.innerHTML = ''; var g = null;
      if (!shown.length) { var none = document.createElement('li'); none.className = 'jm-none'; none.setAttribute('role', 'presentation'); none.textContent = 'Nothing matches. Try another word.'; list.appendChild(none); }
      shown.forEach(function (it, i) {
        if (it.g !== g) { g = it.g; var h = document.createElement('li'); h.className = 'jm-g'; h.setAttribute('role', 'presentation'); h.textContent = g; list.appendChild(h); }
        var li = document.createElement('li'); li.className = 'jm-i'; li.id = 'jm-o' + i; li.setAttribute('role', 'option');
        li.innerHTML = '<span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true">' + I[it.ic] + '</svg></span><b></b><small></small>';
        li.querySelector('b').textContent = it.t; li.querySelector('small').textContent = it.k;
        li.addEventListener('click', function () { go(it); });
        li.addEventListener('pointermove', function () { if (sel !== i) { sel = i; mark(false); } });
        list.appendChild(li);
      });
      sel = 0; mark(true);
    }
    function mark(scroll) {
      [].forEach.call(list.querySelectorAll('.jm-i'), function (li, i) { li.setAttribute('aria-selected', String(i === sel)); });
      var cur = document.getElementById('jm-o' + sel);
      if (cur) { q.setAttribute('aria-activedescendant', cur.id); if (scroll) cur.scrollIntoView({ block: 'nearest' }); } else q.removeAttribute('aria-activedescendant');
    }
    function go(it) {
      close(false);
      if (it.act === 'talk') { var t = document.querySelector('[data-talk="talkTop"]') || document.querySelector('[data-talk]'); if (t) { t.scrollIntoView({ block: 'nearest' }); t.click(); t.focus(); } return; }
      location.href = it.href;
    }
    function build() {
      dlg = document.createElement('div'); dlg.className = 'jm'; dlg.hidden = true;
      dlg.innerHTML = '<div class="jm-in" role="dialog" aria-modal="true" aria-label="Jump to a page">' +
        '<div class="jm-h"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
        '<input class="jm-q" type="search" placeholder="Jump to a project or page…" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="jm-list" aria-label="Jump to">' +
        '<button type="button" class="jm-x" aria-label="Close">Esc</button></div>' +
        '<ul class="jm-list" id="jm-list" role="listbox" aria-label="Pages"></ul>' +
        '<div class="jm-f"><span><kbd>↑</kbd><kbd>↓</kbd>move</span><span><kbd>↵</kbd>open</span><span><kbd>esc</kbd>close</span></div></div>';
      document.body.appendChild(dlg);
      q = dlg.querySelector('.jm-q'); list = dlg.querySelector('.jm-list'); xBtn = dlg.querySelector('.jm-x');
      q.addEventListener('input', render);
      xBtn.addEventListener('click', function () { close(true); });
      dlg.addEventListener('mousedown', function (e) { if (e.target === dlg) e.preventDefault(); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) close(true); });
      dlg.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (shown.length) { sel = (sel + (e.key === 'ArrowDown' ? 1 : shown.length - 1)) % shown.length; mark(true); } }
        else if (e.key === 'Enter' && e.target === q) { e.preventDefault(); if (shown[sel]) go(shown[sel]); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
        else if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === q ? xBtn : q).focus(); }   // focus stays inside
      });
    }
    function open() {
      if (!dlg) build();
      if (!dlg.hidden) return;
      last = document.activeElement; all = items(); q.value = ''; render();
      dlg.hidden = false; dlg.classList.add('open'); document.documentElement.classList.add('fx-lock');
      if (btn) btn.setAttribute('aria-expanded', 'true');
      q.focus();
    }
    function close(restore) {
      if (!dlg || dlg.hidden) return;
      dlg.hidden = true; dlg.classList.remove('open'); document.documentElement.classList.remove('fx-lock');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (restore && last && last.focus) last.focus();
    }
    return {
      here: function () { return true; },
      start: function () {
        var nav = document.querySelector('.top .nav');
        if (nav) {
          var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
          btn = document.createElement('button'); btn.type = 'button'; btn.className = 'nav-jump';
          btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Jump to a page');
          btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg><span>Jump</span><kbd>' + (mac ? '⌘K' : 'Ctrl K') + '</kbd>';
          btn.addEventListener('click', function (e) { e.stopPropagation(); open(); });
          var home = nav.querySelector('.nav-home');
          nav.insertBefore(btn, home ? home.nextSibling : nav.firstChild);
        }
        onKey = function (e) {
          if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault(); if (dlg && !dlg.hidden) close(true); else open();
          }
        };
        document.addEventListener('keydown', onKey);
      },
      stop: function () {
        close(true);
        if (onKey) document.removeEventListener('keydown', onKey); onKey = null;
        if (btn) btn.remove(); btn = null;
        if (dlg) dlg.remove(); dlg = null;
      }
    };
  })());

  /* ================= 4. Drifting sky =================
     The star field drifts over minutes (a CSS animation the compositor runs), leans a few pixels toward the pointer,
     and about once a minute one shooting star crosses. No animation-frame loop. */
  def('sky', 'Drifting sky', (function () {
    var sky, stars, s2 = null, onMove = null, timer = 0, raf = 0, px = 0, py = 0;
    function lean() {
      raf = 0;
      if (stars) stars.style.translate = (px * 6).toFixed(1) + 'px ' + (py * 4).toFixed(1) + 'px';
      if (s2) s2.style.translate = (px * 3).toFixed(1) + 'px ' + (py * 2).toFixed(1) + 'px';
    }
    function shoot() {
      if (!sky || document.hidden) return;
      var el = document.createElement('i'); el.className = 'fx-shoot';
      var w = innerWidth, h = innerHeight;
      el.style.left = (w * (0.35 + Math.random() * 0.55)).toFixed(0) + 'px';
      el.style.top = (h * (0.04 + Math.random() * 0.3)).toFixed(0) + 'px';
      el.style.setProperty('--a', (150 + Math.random() * 18).toFixed(1) + 'deg');     // heading down and to the left
      el.style.setProperty('--d', (Math.min(w, 900) * (0.28 + Math.random() * 0.12)).toFixed(0) + 'px');
      el.addEventListener('animationend', function () { el.remove(); });
      sky.appendChild(el);
    }
    function schedule(first) {
      timer = setTimeout(function () { shoot(); schedule(false); }, first ? 22000 + Math.random() * 20000 : 50000 + Math.random() * 20000);
    }
    return {
      here: function () { return !!document.querySelector('.sky .stars'); },
      shoot: shoot,
      start: function () {
        sky = document.querySelector('.sky'); stars = sky && sky.querySelector('.stars');
        if (!sky || reduced()) { sky = stars = null; return; }
        document.documentElement.classList.add('fx-sky');
        s2 = document.createElement('span'); s2.className = 'fx-stars2'; sky.appendChild(s2);
        onMove = function (e) {
          if (e.pointerType !== 'mouse') return;
          px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5;
          if (!raf) raf = requestAnimationFrame(lean);
        };
        addEventListener('pointermove', onMove, { passive: true });
        schedule(true);
      },
      stop: function () {
        document.documentElement.classList.remove('fx-sky');
        if (onMove) removeEventListener('pointermove', onMove); onMove = null;
        if (raf) cancelAnimationFrame(raf); raf = 0;
        clearTimeout(timer); timer = 0;
        if (stars) stars.style.translate = '';
        if (s2) s2.remove(); s2 = null;
        if (sky) [].forEach.call(sky.querySelectorAll('.fx-shoot'), function (el) { el.remove(); });
        sky = stars = null;
      }
    };
  })());

  /* ================= 5. Galaxy card =================
     The picture is a tilted disc, so a flat spin would look wrong. Instead it moves in the disc's own plane:
     un-tilt, turn, re-tilt, around the bright core. One compositor animation; paused off screen, faster on hover. */
  def('galaxy', 'Galaxy card', (function () {
    var IMG_W = 940, IMG_H = 480, CORE_X = 455, CORE_Y = 320, TILT = -6.5, FLAT = 0.46, POS_X = 0.7, POS_Y = 0.5, SWAY = 9;
    var img = null, card = null, anim = null, io = null, onEnter = null, onLeave = null, onResize = null;
    function frame(a) { return 'rotate(' + TILT + 'deg) scaleY(' + FLAT + ') rotate(' + a + 'deg) scaleY(' + (1 / FLAT).toFixed(5) + ') rotate(' + (-TILT) + 'deg)'; }
    function origin() {
      var w = img.clientWidth, h = img.clientHeight; if (!w || !h) return;
      var s = Math.max(w / IMG_W, h / IMG_H), ox = (w - IMG_W * s) * POS_X, oy = (h - IMG_H * s) * POS_Y;
      img.style.transformOrigin = (ox + CORE_X * s).toFixed(1) + 'px ' + (oy + CORE_Y * s).toFixed(1) + 'px';
    }
    return {
      here: function () { return !!document.querySelector('.card.concept .shot img'); },
      start: function () {
        img = document.querySelector('.card.concept .shot img'); card = img && img.closest('.card');
        if (!img || reduced() || !img.animate) { img = card = null; return; }
        document.documentElement.classList.add('fx-galaxy');
        origin();
        // A flat picture of a tilted disc can't make a full turn: past ~20° its stars smear into streaks. So it sways
        // ±9° in its own plane (stretch under 1.3:1), 40 s each way, easing at the ends.
        anim = img.animate([{ transform: frame(-SWAY) }, { transform: frame(SWAY) }], { duration: 40000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
        anim.currentTime = 20000;   // start level, moving
        anim.pause();
        io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!anim) return; if (e.isIntersecting) anim.play(); else anim.pause(); }); });
        io.observe(card);
        onEnter = function () { if (anim) anim.updatePlaybackRate(3); };
        onLeave = function () { if (anim) anim.updatePlaybackRate(1); };
        onResize = function () { if (img) origin(); };
        card.addEventListener('pointerenter', onEnter); card.addEventListener('pointerleave', onLeave);
        addEventListener('resize', onResize);
      },
      stop: function () {
        if (io) io.disconnect(); io = null;
        if (anim) anim.cancel(); anim = null;
        if (card) { card.removeEventListener('pointerenter', onEnter); card.removeEventListener('pointerleave', onLeave); }
        if (onResize) removeEventListener('resize', onResize); onResize = null;
        if (img) img.style.transformOrigin = '';
        document.documentElement.classList.remove('fx-galaxy');
        img = card = null;
      }
    };
  })());

  // All on by default.
  ORDER.forEach(function (id) { window.DGFX.set(id, true); });
})();
