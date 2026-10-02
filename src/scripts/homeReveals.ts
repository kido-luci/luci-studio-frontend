import { refreshPostStats } from '../utils/postStats';
import { initPostLikes } from './postLikes';

export function initHomeReveals() {
  // Art item scroll-triggered stagger reveal
  (function () {
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-art-card]'));
    if (!items.length) return;

    // (Tile sizing is pure CSS now — the .art-mosaic justified rows are
    // hardcoded server-side; nothing to measure or classify at runtime.)
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const idx = items.indexOf(el);
        el.style.animationDelay = `${(idx % 4) * 0.09}s`;
        el.classList.add('card-visible');
        obs.unobserve(el);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
    items.forEach(i => obs.observe(i));
  })();

  // Blog tile like buttons — shared with the /blog list (see postLikes.ts).
  initPostLikes();
  refreshPostStats();

  // Art tile like buttons
  (function() {
    const API_URL = (document.querySelector('main[data-api-url]') as HTMLElement | null)?.dataset.apiUrl || '';

    document.querySelectorAll('.art-like-area').forEach(el => {
      const btn = el as HTMLElement;
      const postId = btn.dataset.id;
      const icon = btn.querySelector('.art-like-icon') as HTMLElement | null;
      const countEl = btn.querySelector('.art-like-count') as HTMLElement | null;
      const likedKey = `liked_gallery_${postId}`;
      let liked = localStorage.getItem(likedKey) === '1';
      let pending = false;

      function apply(state: boolean) {
        liked = state;
        if (state) {
          icon?.setAttribute('fill', '#f43f5e');
          icon?.setAttribute('stroke', '#f43f5e');
          countEl?.classList.add('text-rose-400');
          countEl?.classList.remove('text-white/60');
        } else {
          icon?.setAttribute('fill', 'none');
          icon?.setAttribute('stroke', 'currentColor');
          countEl?.classList.remove('text-rose-400');
          countEl?.classList.add('text-gray-500');
        }
      }

      apply(liked);

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (pending) return;
        const nextLiked = !liked;
        const endpoint = liked ? 'unlike' : 'like';
        icon && (icon.style.transform = 'scale(1.5)');
        setTimeout(() => { if (icon) icon.style.transform = 'scale(1)'; }, 150);
        pending = true;
        btn.setAttribute('aria-busy', 'true');
        fetch(`${API_URL}/gallery/${postId}/${endpoint}`, { method: 'POST' })
          .then(r => r.ok ? r.json() : Promise.reject(new Error(`gallery like ${r.status}`)))
          .then(d => {
            if (d.likes != null && countEl) countEl.textContent = d.likes;
            apply(nextLiked);
            localStorage.setItem(likedKey, nextLiked ? '1' : '0');
          })
          .catch(() => {})
          .finally(() => {
            pending = false;
            btn.removeAttribute('aria-busy');
          });
      });
    });
  })();

  // Art lightbox — clicking an art tile opens it as a popup (replaces the old
  // /art/[slug] detail page). Tracks a view on open, like the detail page did.
  (function() {
    const lightbox = document.getElementById('art-lightbox');
    if (!lightbox) return;
    const API_URL = lightbox.dataset.apiUrl || '';
    const bgEl = lightbox.querySelector<HTMLElement>('[data-art-bgimg]');
    const imgEl = lightbox.querySelector<HTMLImageElement>('[data-art-img]');
    const titleEl = lightbox.querySelector<HTMLElement>('[data-art-cap-title]');
    const dateEl = lightbox.querySelector<HTMLElement>('[data-art-cap-date]');
    const viewsEl = lightbox.querySelector<HTMLElement>('[data-art-cap-views]');
    const likesEl = lightbox.querySelector<HTMLElement>('[data-art-cap-likes]');
    const closeBtn = lightbox.querySelector<HTMLElement>('[data-art-close]');
    let lastFocused: HTMLElement | null = null;
    // Bumped on every open/close so a slow GET/POST from a previously shown
    // artwork can't overwrite the caption counts of the one now on screen.
    let openToken = 0;

    function open(trigger: HTMLElement) {
      const token = ++openToken;
      lastFocused = document.activeElement as HTMLElement | null;
      const { img, title, date, views, likes, id } = trigger.dataset;
      if (imgEl) { imgEl.src = img || ''; imgEl.alt = title || ''; }
      if (bgEl) bgEl.style.backgroundImage = img ? `url('${img}')` : 'none';
      if (titleEl) titleEl.textContent = title || '';
      if (dateEl) dateEl.textContent = date || '';
      if (viewsEl) viewsEl.textContent = views ?? '—';
      if (likesEl) likesEl.textContent = likes ?? '—';

      lightbox!.classList.add('is-open');
      lightbox!.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      // visibility flips to visible instantly (0s) on open, so the dialog is
      // focusable right away — move focus to the close button.
      closeBtn?.focus();

      if (!id || !API_URL) return;
      const sessionKey = `viewed_gallery_${id}`;
      const alreadyViewed = !!sessionStorage.getItem(sessionKey);

      // Likes always come from the GET; views come from the GET only when no
      // /view POST will run, so the POST's incremented count is never clobbered
      // by a stale GET that resolves after it.
      fetch(`${API_URL}/gallery/${id}`)
        .then(r => r.ok ? r.json() : Promise.reject(new Error(`gallery ${r.status}`)))
        .then(d => {
          if (token !== openToken) return; // a newer artwork is showing now
          if (likesEl && d.likes != null) likesEl.textContent = d.likes;
          if (alreadyViewed && viewsEl && d.views != null) viewsEl.textContent = d.views;
        })
        .catch(() => {});

      if (!alreadyViewed) {
        // Guard BEFORE posting so a rapid re-open in the same session can't
        // fire a second view POST; release the guard if the POST actually fails.
        sessionStorage.setItem(sessionKey, '1');
        fetch(`${API_URL}/gallery/${id}/view`, { method: 'POST' })
          .then(r => r.ok ? r.json() : Promise.reject(new Error(`gallery view ${r.status}`)))
          .then(d => {
            if (token !== openToken) return; // stale response, ignore
            if (viewsEl && d.views != null) viewsEl.textContent = d.views;
          })
          .catch(() => { sessionStorage.removeItem(sessionKey); });
      }
    }

    function close() {
      openToken++; // invalidate any in-flight responses for the artwork being closed
      lightbox!.classList.remove('is-open');
      lightbox!.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (imgEl) imgEl.src = '';
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
      lastFocused = null;
    }

    document.querySelectorAll<HTMLElement>('[data-art-open]').forEach(btn => {
      btn.addEventListener('click', () => open(btn));
    });

    closeBtn?.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => {
      // Backdrop click (anywhere outside the figure) closes.
      if (!(e.target as HTMLElement).closest('.art-lightbox-figure')) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox!.classList.contains('is-open')) close();
    });
    // Trap Tab within the open dialog so focus can't drift to background controls.
    lightbox.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !lightbox!.classList.contains('is-open')) return;
      const focusables = lightbox!.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  })();

  // Theme Toggle Icon Update
  const updateThemeIcon = () => {
    const isLight = document.body.classList.contains('light-mode');
    const darkIcon = document.querySelector('.dark-icon');
    const lightIcon = document.querySelector('.light-icon');

    if (isLight) {
      darkIcon?.classList.add('hidden');
      lightIcon?.classList.remove('hidden');
    } else {
      darkIcon?.classList.remove('hidden');
      lightIcon?.classList.add('hidden');
    }
  };

  // Update icon on page load
  updateThemeIcon();

  // Listen for theme changes
  const themeToggleBtn = document.getElementById('theme-toggle');
  themeToggleBtn?.addEventListener('click', () => {
    setTimeout(updateThemeIcon, 50);
  });
}
