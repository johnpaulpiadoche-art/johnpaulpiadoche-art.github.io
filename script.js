(() => {
  'use strict';

  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  document.addEventListener('DOMContentLoaded', () => {
    // Mobile navigation
    const menuBtn = qs('#menuBtn');
    const navMenu = qs('#navMenu');
    if (menuBtn && navMenu) {
      menuBtn.addEventListener('click', () => {
        const open = navMenu.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', String(open));
      });
      qsa('#navMenu a').forEach(a => a.addEventListener('click', () => navMenu.classList.remove('open')));
    }

    const year = qs('#year');
    if (year) year.textContent = new Date().getFullYear();

    // ------------------------------------------------------------
    // ADMINISTRATIVE VA — reliable phone-like slider
    // ------------------------------------------------------------
    const viewport = qs('#vaViewport');
    const track = qs('#vaTrack');
    const slides = qsa('.va-slide', track || document);
    const prev = qs('#vaPrev');
    const next = qs('#vaNext');
    const counter = qs('#vaCounter');
    const dots = qs('#vaDots');

    let current = 0;
    let startX = 0;
    let startY = 0;
    let dragging = false;
    let moved = false;

    function updateSlider(animate = true) {
      if (!track || !slides.length) return;
      track.style.transition = animate ? 'transform .42s cubic-bezier(.2,.75,.2,1)' : 'none';
      track.style.transform = `translate3d(${-current * 100}%, 0, 0)`;
      if (counter) counter.textContent = `${String(current + 1).padStart(2, '0')} / ${slides.length}`;
      qsa('.dot', dots || document).forEach((dot, i) => dot.classList.toggle('active', i === current));
    }

    function goTo(index) {
      if (!slides.length) return;
      current = ((index % slides.length) + slides.length) % slides.length;
      updateSlider(true);
    }

    if (dots && slides.length) {
      dots.innerHTML = '';
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `dot${i === 0 ? ' active' : ''}`;
        dot.setAttribute('aria-label', `Go to sample ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dots.appendChild(dot);
      });
    }

    prev?.addEventListener('click', e => { e.preventDefault(); goTo(current - 1); });
    next?.addEventListener('click', e => { e.preventDefault(); goTo(current + 1); });

    if (viewport) {
      // Touch/swipe — horizontal gestures only; vertical page scrolling remains natural.
      viewport.addEventListener('touchstart', e => {
        if (!e.touches.length) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        moved = false;
      }, { passive: true });

      viewport.addEventListener('touchmove', e => {
        if (!e.touches.length) return;
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) moved = true;
      }, { passive: true });

      viewport.addEventListener('touchend', e => {
        if (!e.changedTouches.length) return;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
          goTo(current + (dx < 0 ? 1 : -1));
        }
        startX = startY = 0;
      }, { passive: true });

      // Desktop drag support.
      viewport.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (e.target.closest('button, a')) return;
        dragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
      });

      viewport.addEventListener('pointermove', e => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) moved = true;
      });

      const finishPointer = e => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        dragging = false;
        try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
          goTo(current + (dx < 0 ? 1 : -1));
        }
      };
      viewport.addEventListener('pointerup', finishPointer);
      viewport.addEventListener('pointercancel', () => { dragging = false; });
    }

    // Keep slider stable after responsive resize.
    window.addEventListener('resize', () => updateSlider(false));
    updateSlider(false);

    // ------------------------------------------------------------
    // Fullscreen image viewer — Creative, Gundam, and VA samples
    // ------------------------------------------------------------
    const modal = qs('#sampleModal');
    const preview = qs('#samplePreview');
    const title = qs('#sampleTitle');
    const viewerPrev = qs('#viewerPrev');
    const viewerNext = qs('#viewerNext');
    if (!modal || !preview) return;

    let viewerItems = [];
    let viewerIndex = 0;
    let viewerStartX = 0;

    function itemsFor(source) {
      if (source.classList.contains('sample-btn') || source.closest('.va-slide')) {
        return qsa('.sample-btn');
      }
      if (source.closest('#creativeGallery')) {
        return qsa('#creativeGallery [data-gallery-image]');
      }
      return qsa('.gundam-gallery [data-gallery-image]');
    }

    function renderViewer() {
      const item = viewerItems[viewerIndex];
      if (!item) return;
      const image = item.dataset.image || item.dataset.galleryImage;
      const itemTitle = item.dataset.title || item.dataset.galleryTitle || 'Portfolio Image';
      if (title) title.textContent = itemTitle;
      preview.classList.remove('loaded');
      preview.alt = itemTitle;

      const loader = new window.Image();
      loader.onload = () => {
        preview.src = loader.src;
        preview.classList.add('loaded');
      };
      loader.onerror = () => {
        preview.src = image;
        preview.classList.add('loaded');
      };
      loader.src = image;
    }

    function openViewer(source) {
      viewerItems = itemsFor(source);
      viewerIndex = Math.max(0, viewerItems.indexOf(source));
      // If an image inside a VA slide was clicked, use that slide's sample button.
      if (viewerIndex < 0 && source.closest('.va-slide')) {
        const button = qs('.sample-btn', source.closest('.va-slide'));
        viewerIndex = Math.max(0, viewerItems.indexOf(button));
      }
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      renderViewer();
    }

    function moveViewer(step) {
      if (!viewerItems.length) return;
      viewerIndex = (viewerIndex + step + viewerItems.length) % viewerItems.length;
      renderViewer();
    }

    function closeViewer() {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (!modal.classList.contains('show')) {
          preview.src = '';
          preview.classList.remove('loaded');
        }
      }, 150);
    }

    qsa('.sample-btn').forEach(btn => btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openViewer(btn);
    }));

    qsa('[data-gallery-image]').forEach(el => el.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openViewer(el);
    }));

    qsa('.va-slide-image img').forEach(img => img.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const btn = qs('.sample-btn', img.closest('.va-slide'));
      if (btn) openViewer(btn);
    }));

    viewerPrev?.addEventListener('click', e => { e.preventDefault(); moveViewer(-1); });
    viewerNext?.addEventListener('click', e => { e.preventDefault(); moveViewer(1); });
    qsa('[data-close-modal]').forEach(el => el.addEventListener('click', closeViewer));

    modal.addEventListener('touchstart', e => {
      if (e.touches.length) viewerStartX = e.touches[0].clientX;
    }, { passive: true });
    modal.addEventListener('touchend', e => {
      if (!e.changedTouches.length) return;
      const dx = e.changedTouches[0].clientX - viewerStartX;
      if (Math.abs(dx) > 45) moveViewer(dx < 0 ? 1 : -1);
    }, { passive: true });

    document.addEventListener('keydown', e => {
      if (!modal.classList.contains('show')) return;
      if (e.key === 'Escape') closeViewer();
      else if (e.key === 'ArrowRight') moveViewer(1);
      else if (e.key === 'ArrowLeft') moveViewer(-1);
    });
  });
})();
