// View and like tracking for the post page: bumps the view count once per
// session, and drives the footer + floating like buttons (optimistic count,
// heart burst, liked state in localStorage).
//
// Split out of the old postEngagementComments module.

// The engagement counters the backend returns from GET /posts/stats and from the
// view / like / unlike endpoints. Only the fields this page renders.
interface EngagementCounts {
  id?: string | number;
  views?: number | null;
  likes?: number | null;
}

export function initPostEngagement() {
  // View & like tracking
  function setupEngagement() {
    const main = document.querySelector<HTMLElement>('main[data-post-id]');
    if (!main) return;
    const postId = main.dataset.postId;
    const apiUrl = main.dataset.apiUrl;

    function applyEngagementCounts(d: EngagementCounts) {
      document.querySelectorAll('#view-count').forEach(el => { if (d.views != null) el.textContent = String(d.views); });
      if (d.likes != null) {
        const likeEl = document.getElementById('like-count');
        const floatingEl = document.getElementById('floating-like-count');
        const headerEl = document.getElementById('like-count-header');
        if (likeEl) likeEl.textContent = String(d.likes);
        if (floatingEl) floatingEl.textContent = String(d.likes);
        if (headerEl) headerEl.textContent = String(d.likes);
      }
    }

    function refreshEngagementCounts() {
      return fetch(`${apiUrl}/posts/stats?t=${Date.now()}`, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : Promise.reject(new Error(`stats ${r.status}`)))
        .then((stats: EngagementCounts[]) => {
          if (!Array.isArray(stats)) return;
          const current = stats.find(s => String(s.id) === String(postId));
          if (current) applyEngagementCounts(current);
        })
        .catch(() => {});
    }

    // Increment view once per session
    const sessionKey = `viewed_${postId}`;
    if (!sessionStorage.getItem(sessionKey)) {
      fetch(`${apiUrl}/posts/${postId}/view`, { method: 'POST', cache: 'no-store' })
        .then(r => r.ok ? r.json() : Promise.reject(new Error(`view ${r.status}`)))
        .then((d: EngagementCounts) => {
          if (d && d.views != null) {
            document.querySelectorAll('#view-count').forEach(el => { el.textContent = String(d.views); });
          }
          sessionStorage.setItem(sessionKey, '1');
          try { localStorage.removeItem('postStatsCache.v1'); } catch {}
          refreshEngagementCounts();
        })
        .catch(() => { refreshEngagementCounts(); });
    } else {
      refreshEngagementCounts();
    }

    // Like button — footer + floating share the same state
    const likeBtn = document.getElementById('like-btn');
    const likeIcon = document.getElementById('like-icon');
    const likeCount = document.getElementById('like-count');
    const floatingBtn = document.getElementById('floating-like-btn');
    const floatingIcon = document.getElementById('floating-like-icon');
    const floatingCount = document.getElementById('floating-like-count');
    const floatingEl = document.getElementById('floating-like');
    if (!likeBtn) return;

    const likedKey = `liked_${postId}`;
    let liked = localStorage.getItem(likedKey) === '1';
    let likePending = false;

    // Show/hide floating button based on scroll position
    const header = document.querySelector('header[data-reveal]');
    function isSmallScreen() { return window.innerWidth < 768; }
    function onScroll() {
      if (!floatingEl || !header) return;
      const past = window.scrollY > header.getBoundingClientRect().bottom + window.scrollY + 40;
      const hide = !past || (isSmallScreen() && liked);
      if (hide) {
        floatingEl.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
      } else {
        floatingEl.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    function updateAllCounts(n: number) {
      if (likeCount) likeCount.textContent = String(n);
      if (floatingCount) floatingCount.textContent = String(n);
      const headerCount = document.getElementById('like-count-header');
      if (headerCount) headerCount.textContent = String(n);
    }

    function burstHearts(anchor: Element) {
      const count = 6;
      const rect = anchor.getBoundingClientRect();
      for (let i = 0; i < count; i++) {
        const h = document.createElement('span');
        h.textContent = '♥';
        const angle = (i / count) * 360;
        const dist = 30 + Math.random() * 25;
        const dx = Math.cos((angle * Math.PI) / 180) * dist;
        const dy = Math.sin((angle * Math.PI) / 180) * dist - 20;
        h.style.cssText = `
          position:fixed;
          left:${rect.left + rect.width / 2}px;
          top:${rect.top + rect.height / 2}px;
          font-size:${10 + Math.random() * 8}px;
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
      icon.classList.remove('liked-pulse');
      void icon.offsetWidth; // reflow to restart animation
      icon.classList.add('liked-pulse');
      setTimeout(() => icon.classList.remove('liked-pulse'), 1200);
    }

    function setLiked(state: boolean) {
      liked = state;
      localStorage.setItem(likedKey, state ? '1' : '0');
      const fill = state ? '#f43f5e' : 'none';
      const stroke = state ? '#f43f5e' : 'currentColor';
      for (const icon of [likeIcon, floatingIcon]) {
        if (!icon) continue;
        icon.setAttribute('fill', fill);
        icon.setAttribute('stroke', stroke);
        state ? icon.classList.add('scale-110') : icon.classList.remove('scale-110');
      }
      // Ring + glow on main CTA
      const ring = document.getElementById('like-ring');
      const ringBorder = document.getElementById('like-ring-border');
      if (ring) ring.style.opacity = state ? '1' : '0';
      if (ringBorder) ringBorder.style.borderColor = state ? 'rgba(244,63,94,0.35)' : 'rgba(244,63,94,0)';
      // Glow on floating pill
      const floatingGlow = document.getElementById('floating-glow');
      if (floatingGlow) floatingGlow.style.opacity = state ? '1' : '0';
      // Count color
      if (likeCount) likeCount.style.color = state ? '#f43f5e' : '';
      const countLabel = likeCount?.nextElementSibling;
      if (countLabel instanceof HTMLElement) countLabel.style.color = state ? 'rgba(244,63,94,0.5)' : '';
      // Re-evaluate floating button visibility on small screens
      onScroll();
    }

    setLiked(liked);

    function handleLikeClick(btn: HTMLElement, icon: HTMLElement | null) {
      if (likePending) return;
      const nextLiked = !liked;
      const isLiking = nextLiked;
      if (isLiking) {
        burstHearts(btn);
        if (icon) pulseIcon(icon);
      }
      const endpoint = liked ? 'unlike' : 'like';
      likePending = true;
      likeBtn?.setAttribute('aria-busy', 'true');
      floatingBtn?.setAttribute('aria-busy', 'true');
      fetch(`${apiUrl}/posts/${postId}/${endpoint}`, { method: 'POST', cache: 'no-store' })
        .then(r => r.ok ? r.json() : Promise.reject(new Error(`like ${r.status}`)))
        .then(d => {
          if (d.likes != null) updateAllCounts(d.likes);
          setLiked(nextLiked);
          try { localStorage.removeItem('postStatsCache.v1'); } catch {}
        })
        .catch(() => {})
        .finally(() => {
          likePending = false;
          likeBtn?.removeAttribute('aria-busy');
          floatingBtn?.removeAttribute('aria-busy');
        });
    }

    likeBtn.addEventListener('click', () => handleLikeClick(likeBtn, likeIcon));
    floatingBtn?.addEventListener('click', () => handleLikeClick(floatingBtn, floatingIcon));
  }
  setupEngagement();
}
