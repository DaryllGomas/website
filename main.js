'use strict';

// ================================================
// SCROLL REVEAL
// IntersectionObserver adds .is-visible to .reveal
// elements as they enter the viewport. Once visible,
// the element is unobserved (animate only once).
// ================================================
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(function (el) {
    // Stagger children inside .reveal-stagger containers
    var parent = el.closest('.reveal-stagger');
    if (parent) {
      var siblings = Array.from(parent.querySelectorAll('.reveal'));
      var i = siblings.indexOf(el);
      el.style.setProperty('--reveal-delay', (i * 100) + 'ms');
    }
    observer.observe(el);
  });
}


// ================================================
// NAVIGATION
// - Glass background on scroll
// - Active section highlighting
// - Mobile hamburger toggle
// ================================================
function initNavigation() {
  var header = document.getElementById('nav-header');
  var toggle = document.getElementById('nav-toggle');
  var navLinks = document.getElementById('nav-links');
  var sections = document.querySelectorAll('section[id]');
  var navAnchors = document.querySelectorAll('.nav-links a[data-nav]');

  // Glass effect on scroll
  function updateNavState() {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateNavState, { passive: true });
  updateNavState();

  // Active section tracking
  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var id = entry.target.id;
        navAnchors.forEach(function (link) {
          if (link.dataset.nav === id) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '-60px 0px -40% 0px'
  });

  sections.forEach(function (s) {
    sectionObserver.observe(s);
  });

  // Mobile toggle
  if (toggle) {
    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !isOpen);
      navLinks.classList.toggle('open');
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('open');
      });
    });
  }
}


// ================================================
// AMBIENT CURSOR GLOW
// A very subtle radial highlight that trails the
// mouse cursor. Skipped on touch devices.
// ================================================
function initCursorGlow() {
  if (window.matchMedia('(hover: none)').matches) return;

  var glow = document.createElement('div');
  glow.className = 'cursor-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(glow);

  var mouseX = 0, mouseY = 0;
  var glowX = 0, glowY = 0;

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  function animate() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    glow.style.transform = 'translate(' + glowX + 'px, ' + glowY + 'px)';
    requestAnimationFrame(animate);
  }

  animate();
}


// ================================================
// SKILL MODALS
// Click a skill ring to open its detail modal.
// Click overlay or close button to dismiss.
// ================================================
function initSkillModals() {
  var overlay = document.getElementById('skill-modal-overlay');
  if (!overlay) return;

  var allModals = overlay.querySelectorAll('.skill-modal');
  var skillItems = document.querySelectorAll('.skill-item[data-modal]');

  function openModal(id) {
    // Hide all modals, show the target
    allModals.forEach(function (m) {
      m.style.display = 'none';
    });
    var target = document.getElementById('modal-' + id);
    if (target) {
      target.style.display = 'block';
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Click skill item to open
  skillItems.forEach(function (item) {
    item.addEventListener('click', function () {
      openModal(item.dataset.modal);
    });
  });

  // Click overlay background to close
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // Click close buttons
  overlay.querySelectorAll('.skill-modal-close').forEach(function (btn) {
    btn.addEventListener('click', closeModal);
  });

  // Escape key to close
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeModal();
    }
  });

  // Initialize: hide all modals
  allModals.forEach(function (m) {
    m.style.display = 'none';
  });
}


// ================================================
// CERTIFICATE IMAGE MODALS
// Click a cert card to view the full-size image.
// Click overlay, close button, or Escape to dismiss.
// ================================================
function initCertModals() {
  var overlay = document.getElementById('cert-modal-overlay');
  if (!overlay) return;

  var modalImg = document.getElementById('cert-modal-img');
  var certCards = document.querySelectorAll('.cert-card[data-cert]');

  function openCert(card) {
    var img = card.querySelector('img');
    if (!img) return;
    modalImg.src = img.src;
    modalImg.alt = img.alt;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCert() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  certCards.forEach(function (card) {
    card.addEventListener('click', function () {
      openCert(card);
    });
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
      closeCert();
    }
  });

  overlay.querySelector('.cert-modal-close').addEventListener('click', closeCert);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeCert();
    }
  });
}


// ================================================
// ECOSYSTEM DIAGRAM MODALS
// Click a node in the trading ecosystem diagram
// to open its detail modal.
// ================================================
function initEcoModals() {
  var overlay = document.getElementById('eco-modal-overlay');
  if (!overlay) return;

  var allModals = overlay.querySelectorAll('.skill-modal');
  var nodes = document.querySelectorAll('[data-eco-modal]');

  function openModal(id) {
    allModals.forEach(function (m) {
      m.style.display = 'none';
    });
    var target = document.getElementById('eco-modal-' + id);
    if (target) {
      target.style.display = 'block';
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  nodes.forEach(function (node) {
    node.addEventListener('click', function () {
      openModal(node.dataset.ecoModal);
    });
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
      closeModal();
    }
  });

  overlay.querySelectorAll('.skill-modal-close').forEach(function (btn) {
    btn.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeModal();
    }
  });

  allModals.forEach(function (m) {
    m.style.display = 'none';
  });
}


// ================================================
// INIT
// ================================================
document.addEventListener('DOMContentLoaded', function () {
  initScrollReveal();
  initNavigation();
  initCursorGlow();
  initSkillModals();
  initCertModals();
  initEcoModals();
});
