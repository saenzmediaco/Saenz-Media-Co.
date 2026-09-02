/* ==========================================================================
   SAENZ MEDIA CO. — shared site behavior
   Every block below checks for its target element(s) before running, so
   this single file is safe to include on every page regardless of which
   components that page actually has.
   ========================================================================== */

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

(function heroSlideshow(){
  const media = document.getElementById('heroMedia');
  if(!media) return;
  const slides = media.querySelectorAll('img');
  if (slides.length < 2) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let current = Array.from(slides).findIndex(s => s.classList.contains('active'));
  if (current < 0) current = 0;
  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
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

  function openLightbox(tile){
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
    lightbox.classList.add('active');
  }
  function closeLightbox(){
    lightbox.classList.remove('active');
    lightboxImg.src = '';
  }

  document.querySelectorAll('.g-tile').forEach(tile => {
    tile.addEventListener('click', () => openLightbox(tile));
  });
  const closeBtn = document.getElementById('lightboxClose');
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
})();

/* ---------- Booking form → mailto ---------- */
(function bookForm(){
  const form = document.getElementById('bookForm');
  if(!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    const f = e.target;
    const sessionType = f.sessionType.value || 'General';
    const lines = [
      'Name: ' + f.name.value,
      'Email: ' + f.email.value,
      'Phone: ' + (f.phone.value || 'N/A'),
      'Session type: ' + sessionType,
      'Preferred date: ' + (f.date.value || 'N/A'),
      'Location / venue: ' + (f.location.value || 'N/A'),
      '',
      'Details:',
      f.details.value || 'N/A'
    ];
    const subject = encodeURIComponent('Booking Request - ' + sessionType);
    const body = encodeURIComponent(lines.join('\n'));
    window.location.href = 'mailto:saenzmediaco@gmail.com?subject=' + subject + '&body=' + body;
  });
})();
