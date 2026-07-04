import { invalidatePostStatsCache, refreshPostStats } from '../utils/postStats';

export function initHomeReveals() {
  // EXPERIENCE timeline items — each animates as it scrolls into view
  (function () {
    const items = document.querySelectorAll<HTMLElement>('[data-timeline-item]');
    if (!items.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('tl-visible');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -20px 0px' });
    items.forEach(el => obs.observe(el));
  })();

  // MY STORY section — photo + right-column stagger
  (function () {
    const photo  = document.querySelector<HTMLElement>('[data-story-photo]');
    const badge  = document.querySelector<HTMLElement>('[data-story-badge]');
    const label  = document.querySelector<HTMLElement>('[data-story-label]');
    const paras  = Array.from(document.querySelectorAll<HTMLElement>('[data-story-para]'));

    // Photo slides in from left
    if (photo) {
      const obsPhoto = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          photo.classList.add('story-visible');
          badge?.classList.add('story-visible');
          obsPhoto.disconnect();
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -20px 0px' });
      obsPhoto.observe(photo);
    }

    // Label + paragraphs stagger in from right column
    if (paras.length) {
      const obsPara = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          label?.classList.add('story-visible');
          paras.forEach((p, i) => {
            p.style.animationDelay = `${0.08 + i * 0.13}s`;
            p.classList.add('story-visible');
          });
          obsPara.disconnect();
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });
      obsPara.observe(paras[0]);
    }
  })();

  // Home blog cards now render via <PostCard> and are visible by default
  // (the shared card carries its own hover-lift; no entrance reveal needed here).

  // Portfolio card scroll-triggered stagger reveal (left col first, right col 0.15s later)
  (function () {
    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-project-card]'));
    if (!cards.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const idx = parseInt(el.dataset.projectCard ?? '0', 10);
        el.style.animationDelay = `${(idx % 2) * 0.15}s`;
        el.classList.add('card-visible');
        obs.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });
    cards.forEach(c => obs.observe(c));
  })();

  // Art item scroll-triggered stagger reveal
  (function () {
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-art-card]'));
    if (!items.length) return;

    // Square-cell mosaic: make the cells square by pinning grid-auto-rows to the
    // measured column width (1fr columns are fluid, so this can't be a fixed px), and
    // give each item a whole-cell span from its image ratio — landscape → 2×1
    // (.is-wide), portrait → 1×2 (.is-tall), square → 1×1. The 2×2 features (.is-big)
    // are set server-side and left alone. Dense flow packs it into an aligned grid.
    const grid = items[0].closest<HTMLElement>('.quilt-art-grid');
    if (grid) {
      const sizeRows = () => {
        const cs = getComputedStyle(grid);
        const cols = cs.gridTemplateColumns.split(' ').length;
        const gap = parseFloat(cs.columnGap) || 0;
        const colW = (grid.clientWidth - gap * (cols - 1)) / cols;
        if (colW > 0) grid.style.gridAutoRows = Math.round(colW) + 'px';
      };
      const classify = (item: HTMLElement) => {
        if (item.classList.contains('is-big')) return; // featured 2×2 stays as-is
        const img = item.querySelector<HTMLImageElement>('img');
        if (!img || !img.naturalHeight) return;
        const ratio = img.naturalWidth / img.naturalHeight;
        item.classList.remove('is-wide', 'is-tall');
        if (ratio >= 1.35) item.classList.add('is-wide');
        else if (ratio <= 0.8) item.classList.add('is-tall');
      };
      items.forEach(item => {
        const img = item.querySelector<HTMLImageElement>('img');
        if (!img) return;
        if (img.complete && img.naturalWidth) classify(item);
        else img.addEventListener('load', () => classify(item), { once: true });
      });
      let raf = 0;
      const schedule = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; sizeRows(); }); };
      sizeRows();
      window.addEventListener('resize', schedule, { passive: true });
    }

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

  // Blog tile like buttons
  (function() {
    const API_URL = (document.querySelector('main[data-api-url]') as HTMLElement | null)?.dataset.apiUrl || '';

    function burstHearts(anchor: HTMLElement) {
      const count = 6;
      const rect = anchor.getBoundingClientRect();
      for (let i = 0; i < count; i++) {
        const h = document.createElement('span');
        h.textContent = '♥';
        const angle = (i / count) * 360;
        const dist = 28 + Math.random() * 20;
        const dx = Math.cos((angle * Math.PI) / 180) * dist;
        const dy = Math.sin((angle * Math.PI) / 180) * dist - 18;
        h.style.cssText = `
          position:fixed;
          left:${rect.left + rect.width / 2}px;
          top:${rect.top + rect.height / 2}px;
          font-size:${9 + Math.random() * 7}px;
          color:#f43f5e;
          pointer-events:none;
          z-index:9999;
          transform:translate(-50%,-50%);
          transition:transform 0.6s ease-out,opacity 0.6s ease-out;
          will-change:transform,opacity;
        `;
        document.body.appendChild(h);
        requestAnimationFrame(() => {
          h.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`;
          h.style.opacity = '0';
        });
        setTimeout(() => h.remove(), 650);
      }
    }

    function pulseIcon(icon: HTMLElement) {
      icon.style.transform = 'scale(1.6)';
      icon.style.transition = 'transform 0.15s ease-out';
      setTimeout(() => {
        icon.style.transform = 'scale(1)';
        icon.style.transition = 'transform 0.2s ease-in';
      }, 150);
    }

    document.querySelectorAll('.tile-like-area').forEach(el => {
      const btn = el as HTMLElement;
      const postId = btn.dataset.id;
      const icon = btn.querySelector('.tile-like-icon') as HTMLElement | null;
      const countEl = btn.querySelector('.tile-like-count') as HTMLElement | null;
      const likedKey = `liked_${postId}`;
      let liked = localStorage.getItem(likedKey) === '1';
      let pending = false;

      function applyLikedState(state: boolean) {
        liked = state;
        if (state) {
          icon?.setAttribute('fill', '#f43f5e');
          icon?.setAttribute('stroke', '#f43f5e');
          countEl?.classList.add('text-rose-400');
          countEl?.classList.remove('text-gray-500');
        } else {
          icon?.setAttribute('fill', 'none');
          icon?.setAttribute('stroke', 'currentColor');
          countEl?.classList.remove('text-rose-400');
          countEl?.classList.add('text-gray-500');
        }
      }

      applyLikedState(liked);

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (pending) return;
        btn.dataset.userInteracted = '1';
        const nextLiked = !liked;
        if (nextLiked) {
          burstHearts(btn);
          if (icon) pulseIcon(icon);
        }
        const endpoint = liked ? 'unlike' : 'like';
        pending = true;
        btn.setAttribute('aria-busy', 'true');
        fetch(`${API_URL}/posts/${postId}/${endpoint}`, { method: 'POST' })
          .then(r => r.ok ? r.json() : Promise.reject(new Error(`like ${r.status}`)))
          .then(d => {
            if (d.likes != null && countEl) countEl.textContent = d.likes;
            applyLikedState(nextLiked);
            localStorage.setItem(likedKey, nextLiked ? '1' : '0');
            invalidatePostStatsCache();
            refreshPostStats();
          })
          .catch(() => {})
          .finally(() => {
            pending = false;
            btn.removeAttribute('aria-busy');
          });
      });
    });

    refreshPostStats();
  })();

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

  // HERO PATCH REVEAL — overlay starts as an opaque grid of dark tiles obscuring the hero,
  // then tiles scale + fade out in a random order so the underlying content is revealed in patches.
  (function () {
    const w = window as any;
    const ready = () => w.gsap;
    const run = () => {
      const { gsap } = w;
      const host = document.querySelector<HTMLElement>('[data-hero-patches]');
      if (!host) return;

      // Pick a target tile size in CSS pixels; derive cols/rows from the host's actual size
      // so tiles stay roughly square on any viewport (a fixed grid stretches into rectangles
      // on narrow / tall screens).
      const targetCell = window.innerWidth < 640 ? 50 : 85;
      const cols = Math.max(4, Math.ceil(host.clientWidth / targetCell));
      const rows = Math.max(4, Math.ceil(host.clientHeight / targetCell));
      host.style.display = 'grid';
      host.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      host.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

      const tiles: HTMLElement[] = [];
      // Blue-family neon palette: cyan, light blue, sky blue, electric blue, blue, navy
      const neonHues = [185, 195, 205, 215, 225, 235];
      const pickNeon = () => {
        const hue = neonHues[Math.floor(Math.random() * neonHues.length)] + (Math.random() * 10 - 5);
        const s = 85 + Math.random() * 15;
        const l = 8 + Math.random() * 8;
        return `hsl(${hue}, ${s}%, ${l}%)`;
      };
      for (let i = 0; i < cols * rows; i++) {
        const t = document.createElement('div');
        // Each tile is a linear gradient from pure black into a deep-neon hue at a random angle
        const neon = pickNeon();
        const angle = Math.floor(Math.random() * 360);
        const gradient = `linear-gradient(${angle}deg, #000, ${neon})`;
        // Edge color leans black so gap-cover shadow blends with the darker side of tiles
        const edge = '#000';
        t.style.background = gradient;
        // Mixed opacity: most tiles fully obscure, but ~40% are partially transparent so
        // hints of the underlying hero peek through, giving a "fragmented" obscured look.
        const r = Math.random();
        let initialOpacity = 1;
        if (r < 0.15) initialOpacity = 0.45 + Math.random() * 0.25;       // 15%: 0.45–0.70
        else if (r < 0.4) initialOpacity = 0.75 + Math.random() * 0.15;   // 25%: 0.75–0.90
        t.style.opacity = String(initialOpacity);
        // Extend the tile by 1px in every direction so subpixel grid gaps don't leak
        // the underlying hero background between cells.
        t.style.boxShadow = `0 0 0 1px ${edge}`;
        t.style.willChange = 'transform, opacity';
        tiles.push(t);
        host.appendChild(t);
      }

      gsap.to(tiles, {
        scale: 0,
        opacity: 0,
        duration: 0.55,
        ease: 'power2.inOut',
        stagger: { grid: [rows, cols], from: 'random', amount: 1.4 },
        onComplete: () => host.remove()
      });
    };
    if (ready()) run();
    else {
      const id = setInterval(() => { if (ready()) { clearInterval(id); run(); } }, 30);
    }
  })();

  // ML6 "Beautiful Questions" — word-level mask reveal: each word rises from behind a clip
  // box, no opacity fade. Reads as one elegant gesture instead of letter popcorn.
  (function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const w = window as any;
    const ready = () => w.gsap && w.SplitText;
    const run = () => {
      const { gsap, SplitText } = w;
      gsap.registerPlugin(SplitText);
      const el = document.querySelector('.hero-subtitle') as HTMLElement | null;
      if (!el) return;
      const split = SplitText.create(el, { type: 'lines,words,chars', mask: 'lines', tag: 'span', aria: 'auto' });
      // tag:'span' for valid HTML inside <p>. Force block layout so each line takes its own row
      // and yPercent computes against a real height. Mask wrappers also need block layout.
      split.lines.forEach((line: HTMLElement) => {
        line.style.display = 'block';
        if (line.parentElement?.getAttribute('style')?.includes('overflow')) {
          line.parentElement.style.display = 'block';
        }
      });
      gsap.set(split.lines, { willChange: 'transform' });
      gsap.from(split.lines, {
        yPercent: 110,
        rotate: 4,
        skewY: 3,
        opacity: 0,
        duration: 1.4,
        ease: 'power3.out',
        stagger: 0.18,
        // Start as the patch overlay is mostly cleared so the subtitle reveal is visible
        delay: 1.5
      });
    };
    if (ready()) run();
    else {
      const id = setInterval(() => { if (ready()) { clearInterval(id); run(); } }, 30);
    }
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
