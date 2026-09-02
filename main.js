/* ==========================================================================
   SAENZ MEDIA CO. — shared site behavior
   Every block below checks for its target element(s) before running, so
   this single file is safe to include on every page regardless of which
   components that page actually has.
   ========================================================================== */

function track(event, params){
  if (typeof gtag === 'function') gtag('event', event, params || {});
}

(function ctaTracking(){
  document.querySelectorAll('a[href="book.html"], a[href^="book.html#"]').forEach(el => {
    el.addEventListener('click', () => {
      track('start_project_click', {
        link_text: el.textContent.trim(),
        page_location: window.location.pathname
      });
    });
  });
})();

(function stickyNav(){
  const nav = document.querySelector('.site-nav');
  if(!nav) return;
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });
})();

(function mobileMenu(){
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');
  if(!toggle || !menu) return;
  const close = () => {
    menu.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  const open = () => {
    menu.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  toggle.addEventListener('click', () => {
    menu.classList.contains('open') ? close() : open();
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

(function stickyCtaVisibility(){
  const cta = document.querySelector('.sticky-cta');
  const hero = document.querySelector('.hero');
  if(!cta || !hero) return;
  const onScroll = () => {
    const heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;
    cta.classList.toggle('visible', window.scrollY > heroBottom - 120);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });
})();

(function heroSlideshow(){
  const media = document.getElementById('heroMedia');
  if(!media) return;
  const slides = media.querySelectorAll('img');
  if (slides.length < 2) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const preload = (img) => {
    if (img && img.dataset.src && !img.src) img.src = img.dataset.src;
  };

  let current = Array.from(slides).findIndex(s => s.classList.contains('active'));
  if (current < 0) current = 0;

  // Give the first slide's own resources (fonts, CSS, itself) room to land
  // before spending bandwidth on the next slide in line.
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 1200));
  idle(() => preload(slides[(current + 1) % slides.length]));

  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
    preload(slides[(current + 1) % slides.length]);
  }, 4200);
})();

(function scrollReveal(){
  const targets = document.querySelectorAll('.reveal');
  if(!targets.length) return;
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  targets.forEach((el, i) => {
    el.style.transitionDelay = Math.min(i % 4, 3) * 80 + 'ms';
    io.observe(el);
  });
})();

/* ---------- Homepage rotating banner (3 boxes, staggered cross-fade) ---------- */
(function heroBanner(){
  const banner = document.getElementById('banner');
  if(!banner) return;
  const timers = [];

  function initTile(tile, i){
    const slides = tile.querySelectorAll('.tile-slide');
    if (slides.length < 2) return;
    let current = Array.from(slides).findIndex(s => s.classList.contains('active'));
    if (current < 0) current = 0;
    timers[i] = setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 4200);
  }

  banner.querySelectorAll('.banner-tile').forEach((tile, i) => {
    setTimeout(() => initTile(tile, i), i * 1400);
  });

  banner.addEventListener('mouseenter', () => timers.forEach(t => clearInterval(t)));
  banner.addEventListener('mouseleave', () => {
    banner.querySelectorAll('.banner-tile').forEach(initTile);
  });
})();

/* ---------- Gallery: category filters + lightbox ---------- */
(function gallery(){
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.category-group').forEach(group => {
          group.style.display = (filter === 'all' || group.dataset.group === filter) ? '' : 'none';
        });
      });
    });
  }

  document.querySelectorAll('.g-tile img').forEach(img => {
    const markIfWide = () => {
      if (img.naturalWidth > img.naturalHeight) img.closest('.g-tile').classList.add('wide');
    };
    if (img.complete) markIfWide();
    else img.addEventListener('load', markIfWide);
  });

  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCap = document.getElementById('lightboxCap');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');

  let visibleTiles = [];
  let currentIndex = -1;

  function renderTile(tile){
    const img = tile.querySelector('img');
    const cap = tile.querySelector('.cap');
    const thumbSrc = img.getAttribute('src');
    const fullBase = thumbSrc.replace('images/', 'images/full/').replace(/\.(jpg|jpeg|png)$/i, '');
    const exts = ['jpg', 'png', 'jpeg'];
    let i = 0;
    function tryNextExt(){
      if (i >= exts.length){ lightboxImg.onerror = null; lightboxImg.src = thumbSrc; return; }
      lightboxImg.onerror = () => { i++; tryNextExt(); };
      lightboxImg.src = fullBase + '.' + exts[i];
    }
    tryNextExt();
    lightboxImg.alt = img.alt;
    lightboxCap.textContent = cap ? cap.textContent : '';
  }

  function openLightbox(tile){
    visibleTiles = Array.from(document.querySelectorAll('.category-group'))
      .filter(g => g.style.display !== 'none')
      .flatMap(g => Array.from(g.querySelectorAll('.g-tile')));
    currentIndex = visibleTiles.indexOf(tile);
    renderTile(tile);
    lightbox.classList.add('active');
  }
  function closeLightbox(){
    lightbox.classList.remove('active');
    lightboxImg.src = '';
  }
  function step(dir){
    if (!visibleTiles.length) return;
    currentIndex = (currentIndex + dir + visibleTiles.length) % visibleTiles.length;
    renderTile(visibleTiles[currentIndex]);
  }

  document.querySelectorAll('.g-tile').forEach(tile => {
    tile.addEventListener('click', () => openLightbox(tile));
  });
  const closeBtn = document.getElementById('lightboxClose');
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (prevBtn) prevBtn.addEventListener('click', e => { e.stopPropagation(); step(-1); });
  if (nextBtn) nextBtn.addEventListener('click', e => { e.stopPropagation(); step(1); });
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  let touchStartX = null;
  lightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive:true });
  lightbox.addEventListener('touchend', e => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) step(dx > 0 ? -1 : 1);
    touchStartX = null;
  }, { passive:true });
})();

/* ---------- Pre-fill booking form from ?type=&package= (service page "Inquire" links) ---------- */
(function prefillBookForm(){
  const form = document.getElementById('bookForm');
  if(!form) return;
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  const pkg = params.get('package');
  if (type && form.sessionType) {
    const match = Array.from(form.sessionType.options).find(o => o.value === type);
    if (match) form.sessionType.value = type;
  }
  if (pkg && form.details && !form.details.value) {
    form.details.value = `Interested in the ${pkg} package.`;
  }
})();

/* ---------- Booking form → Web3Forms ---------- */
(function bookForm(){
  const form = document.getElementById('bookForm');
  if(!form) return;
  const submitBtn = form.querySelector('.submit');
  const status = document.getElementById('formStatus');

  const setStatus = (msg, kind) => {
    if(!status) return;
    status.textContent = msg;
    status.className = 'form-status' + (kind ? ' ' + kind : '');
  };

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (form.botcheck && form.botcheck.checked) return;

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';
    setStatus('', '');
    const sessionType = form.sessionType.value;

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          form.reset();
          form.hidden = true;
          setStatus("Thanks, that's in. We'll follow up within 1-2 business days.", 'success');
          track('generate_lead', { method: 'website_form', session_type: sessionType });
        } else {
          throw new Error(data.message || 'Submission failed');
        }
      })
      .catch(() => {
        setStatus('Something went wrong sending that. Please email us directly at saenzmediaco@gmail.com.', 'error');
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      });
  });
})();
