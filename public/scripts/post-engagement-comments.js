  // Back to Blog: use history.back() if we came from /blog (preserves scroll)
  document.querySelectorAll('a[href="/blog"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      try {
        var ref = document.referrer;
        if (ref && new URL(ref).pathname === '/blog') {
          e.preventDefault();
          history.back();
        }
      } catch (_) {}
    });
  });

  // Handle copy functionality
  function setupCopyButtons() {
    const containers = document.querySelectorAll('.code-block-container');
    
    containers.forEach(container => {
      const code = container.querySelector('code');
      if (!code) return;

      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        Copy
      `;

      btn.addEventListener('click', async () => {
        const text = code.innerText;
        try {
          await navigator.clipboard.writeText(text);
          btn.classList.add('copied');
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Copied!
          `;
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Copy
            `;
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      });

      container.appendChild(btn);
    });
  }

  // Handle share functionality
  function setupShare() {
    const doShare = () => {
      if (navigator.share) {
        navigator.share({ title: document.title, url: window.location.href });
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    };
    document.querySelectorAll('[data-share-trigger]').forEach(btn => btn.addEventListener('click', doShare));
  }

  // Local "save for later" bookmark — persists per post id in localStorage.
  function setupBookmark() {
    const btn = document.getElementById('bd-bookmark');
    const main = document.querySelector('main[data-post-id]');
    const id = main instanceof HTMLElement ? main.dataset.postId : undefined;
    if (!btn || !id) return;
    const KEY = 'luci_saved_posts';
    const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
    const sync = () => btn.classList.toggle('is-saved', read().includes(id));
    sync();
    btn.addEventListener('click', () => {
      const list = read();
      const next = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      sync();
    });
  }

  // Theme icon sync
  function updateThemeIcon() {
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
  }

  // View & like tracking
  function setupEngagement() {
    const main = document.querySelector('main[data-post-id]');
    if (!main) return;
    const postId = main.dataset.postId;
    const apiUrl = main.dataset.apiUrl;

    function applyEngagementCounts(d) {
      document.querySelectorAll('#view-count').forEach(el => { if (d.views != null) el.textContent = d.views; });
      if (d.likes != null) {
        const likeEl = document.getElementById('like-count');
        const floatingEl = document.getElementById('floating-like-count');
        const headerEl = document.getElementById('like-count-header');
        if (likeEl) likeEl.textContent = d.likes;
        if (floatingEl) floatingEl.textContent = d.likes;
        if (headerEl) headerEl.textContent = d.likes;
      }
    }

    function refreshEngagementCounts() {
      return fetch(`${apiUrl}/posts/stats?t=${Date.now()}`, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : Promise.reject(new Error(`stats ${r.status}`)))
        .then(stats => {
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
        .then(d => {
          if (d && d.views != null) {
            document.querySelectorAll('#view-count').forEach(el => { el.textContent = d.views; });
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

    function updateAllCounts(n) {
      if (likeCount) likeCount.textContent = n;
      if (floatingCount) floatingCount.textContent = n;
      const headerCount = document.getElementById('like-count-header');
      if (headerCount) headerCount.textContent = n;
    }

    function burstHearts(anchor) {
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

    function pulseIcon(icon) {
      icon.classList.remove('liked-pulse');
      void icon.offsetWidth; // reflow to restart animation
      icon.classList.add('liked-pulse');
      setTimeout(() => icon.classList.remove('liked-pulse'), 1200);
    }

    function setLiked(state) {
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
      if (countLabel) countLabel.style.color = state ? 'rgba(244,63,94,0.5)' : '';
      // Re-evaluate floating button visibility on small screens
      onScroll();
    }

    setLiked(liked);

    function handleLikeClick(btn, icon) {
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

  function bootEngagement() {
    setupCopyButtons();
    setupShare();
    setupBookmark();
    updateThemeIcon();
    setupEngagement();
    document.querySelector('[aria-label="Toggle theme"]')?.addEventListener('click', () => {
      setTimeout(updateThemeIcon, 50);
    });
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootEngagement);
  } else {
    bootEngagement();
  }

  // ── Custom confirm dialog ───────────────────────────────────────────────
  function showConfirm({ message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);opacity:0;transition:opacity 0.2s ease;';

      const box = document.createElement('div');
      box.style.cssText = 'background:var(--bg-secondary,#18181b);border:1px solid var(--comment-divider,rgba(255,255,255,0.1));border-radius:1rem;padding:1.5rem;width:100%;max-width:22rem;box-shadow:0 24px 64px rgba(0,0,0,0.5);transform:scale(0.95) translateY(8px);transition:transform 0.2s ease,opacity 0.2s ease;opacity:0;';

      box.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
          <div style="width:2rem;height:2rem;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${danger ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)'};">
            ${danger
              ? `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>`
              : `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
            }
          </div>
          <p style="font-size:0.9rem;color:var(--text-primary);font-weight:500;margin:0;line-height:1.4;">${message}</p>
        </div>
        <div style="display:flex;gap:0.5rem;justify-content:flex-end;">
          <button id="confirm-cancel" style="padding:0.5rem 1.1rem;border-radius:0.5rem;font-size:0.8rem;font-weight:600;background:transparent;border:1px solid var(--comment-divider,rgba(255,255,255,0.12));color:var(--text-secondary);cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='transparent'">${cancelText}</button>
          <button id="confirm-ok" style="padding:0.5rem 1.1rem;border-radius:0.5rem;font-size:0.8rem;font-weight:600;border:none;cursor:pointer;transition:background 0.15s;background:${danger ? '#ef4444' : '#7c3aed'};color:#fff;" onmouseover="this.style.background='${danger ? '#dc2626' : '#6d28d9'}'" onmouseout="this.style.background='${danger ? '#ef4444' : '#7c3aed'}'">${confirmText}</button>
        </div>
      `;

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        box.style.opacity = '1';
        box.style.transform = 'scale(1) translateY(0)';
      });

      function close(result) {
        overlay.style.opacity = '0';
        box.style.opacity = '0';
        box.style.transform = 'scale(0.95) translateY(8px)';
        setTimeout(() => overlay.remove(), 200);
        resolve(result);
      }

      box.querySelector('#confirm-ok').addEventListener('click', () => close(true));
      box.querySelector('#confirm-cancel').addEventListener('click', () => close(false));
      overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
      document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') { close(false); document.removeEventListener('keydown', handler); }
        if (e.key === 'Enter') { close(true); document.removeEventListener('keydown', handler); }
      });
    });
  }

  // ── Comments & Google Auth ──────────────────────────────────────────────
  (function() {
    const main = document.querySelector('main');
    const API_URL = main?.dataset.apiUrl || '';
    const postID = main?.dataset.postId || '';
    const TOKEN_KEY = 'user_token';

    // --- Token helpers ---
    function getToken() { return localStorage.getItem(TOKEN_KEY); }
    function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
    function clearToken() { localStorage.removeItem(TOKEN_KEY); }

    function parseJWT(token) {
      try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        // atob gives Latin-1 bytes; decode as UTF-8 to handle Vietnamese and other multi-byte chars
        const bytes = atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('');
        return JSON.parse(decodeURIComponent(bytes));
      } catch { return null; }
    }

    function isTokenValid(token) {
      if (!token) return false;
      const p = parseJWT(token);
      return p && p.role === 'user' && p.exp > Math.floor(Date.now() / 1000);
    }

    // --- Grab token from URL fragment after OAuth redirect ---
    // The OAuth callback returns the token ONLY in the URL fragment (#user_token=…),
    // never the query string, so it never reaches servers, proxies, or access logs.
    // Read it exclusively from the fragment: honoring a ?user_token= query param too
    // would let a crafted link seed an attacker-chosen token into a victim's
    // localStorage (token fixation). Validate before storing so a malformed or
    // expired token is never persisted (the server still re-validates every call).
    const fragmentParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const urlToken = fragmentParams.get('user_token');
    if (urlToken) {
      if (isTokenValid(urlToken)) {
        setToken(urlToken);
      }
      fragmentParams.delete('user_token');
      const newHash = fragmentParams.toString();
      window.history.replaceState({}, '', window.location.pathname + window.location.search + (newHash ? '#' + newHash : ''));
    }

    // --- UI elements ---
    const signInPrompt = document.getElementById('sign-in-prompt');
    const loggedInArea = document.getElementById('logged-in-area');
    const commentForm = document.getElementById('comment-form');
    const commentList = document.getElementById('comment-list');
    const loadingEl = document.getElementById('comments-loading');
    const countBadge = document.getElementById('comment-count-badge');
    const charCount = document.getElementById('char-count');

    // Serialize contenteditable div → plain text (text nodes + emoji data-emoji attrs)
    function getCommentText(el) {
      let text = '';
      (function walk(node) {
        if (node.nodeType === 3) { text += node.textContent; return; }
        if (node.nodeName === 'IMG') { text += node.dataset.emoji || ''; return; }
        if (node.nodeName === 'BR') { text += '\n'; return; }
        node.childNodes.forEach(walk);
      })(el);
      return text.replace(/\n$/, '');
    }

    // Char counter + placeholder visibility
    if (charCount) charCount.textContent = '0/500';
    document.getElementById('comment-input')?.addEventListener('input', function() {
      const len = getCommentText(this).length;
      this.dataset.empty = len === 0 ? 'true' : 'false';
      if (!charCount) return;
      charCount.textContent = `${len}/500`;
      charCount.style.color = len >= 500 ? '#f87171' : len > 460 ? '#fb923c' : 'var(--text-tertiary)';
    });

    function renderAuthUI() {
      const token = getToken();
      if (isTokenValid(token)) {
        const payload = parseJWT(token);
        signInPrompt.classList.add('hidden');
        loggedInArea.classList.remove('hidden');
        const avatarEl = document.getElementById('user-avatar');
        const nameEl = document.getElementById('user-name');
        const avatarFallback = document.getElementById('user-avatar-fallback');
        const initial = (payload.name || '?')[0].toUpperCase();
        if (avatarEl) {
          avatarEl.style.display = '';
          avatarEl.src = payload.avatar || '';
          avatarEl.alt = payload.name || '';
          avatarEl.onerror = () => {
            avatarEl.style.display = 'none';
            if (avatarFallback) { avatarFallback.textContent = initial; avatarFallback.style.display = 'flex'; }
          };
        }
        if (avatarFallback) { avatarFallback.textContent = initial; avatarFallback.style.display = 'none'; }
        if (nameEl) nameEl.textContent = payload.name || '';
      } else {
        clearToken();
        signInPrompt.classList.remove('hidden');
        loggedInArea.classList.add('hidden');
      }
    }

    // --- Google sign-in ---
    document.getElementById('google-sign-in-btn')?.addEventListener('click', () => {
      const returnTo = encodeURIComponent(window.location.href);
      window.location.href = `${API_URL}/auth/google?return_to=${returnTo}`;
    });

    // --- Format buttons ---
    // Prevent B/I/U buttons from stealing focus away from any contenteditable input.
    // Uses event delegation so it also covers dynamically-created reply toolbars.
    document.addEventListener('mousedown', e => {
      if (e.target.closest('.fmt-btn')) e.preventDefault();
    });

    function applyFormat(el, marker) {
      if (!el) return;
      el.focus();
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (!range.collapsed) {
        const selectedText = range.toString();
        range.deleteContents();
        const node = document.createTextNode(marker + selectedText + marker);
        range.insertNode(node);
        range.setStartAfter(node);
        range.setEndAfter(node);
      } else {
        const node = document.createTextNode(marker + marker);
        range.insertNode(node);
        range.setStart(node, marker.length);
        range.setEnd(node, marker.length);
      }
      sel.removeAllRanges();
      sel.addRange(range);
      el.dispatchEvent(new Event('input'));
    }
    document.getElementById('fmt-bold')?.addEventListener('click', () => applyFormat(document.getElementById('comment-input'), '**'));
    document.getElementById('fmt-italic')?.addEventListener('click', () => applyFormat(document.getElementById('comment-input'), '*'));
    document.getElementById('fmt-underline')?.addEventListener('click', () => applyFormat(document.getElementById('comment-input'), '__'));

    // --- Contenteditable: paste as plain text + convert emojis to Twemoji ---
    document.getElementById('comment-input')?.addEventListener('paste', function(e) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      if (window.twemoji) {
        const tmp = document.createElement('div');
        tmp.textContent = text;
        twemoji.parse(tmp, { folder: 'svg', ext: '.svg', base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@v14.0.2/assets/', className: 'twemoji-inline' });
        tmp.querySelectorAll('img.twemoji-inline').forEach(img => { img.dataset.emoji = img.alt; img.style.pointerEvents = 'none'; });
        const frag = document.createDocumentFragment();
        while (tmp.firstChild) frag.appendChild(tmp.firstChild);
        range.insertNode(frag);
      } else {
        range.insertNode(document.createTextNode(text));
      }
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      this.dispatchEvent(new Event('input'));
    });

    // --- Contenteditable: normalize Enter to <br> for consistent serialization ---
    document.getElementById('comment-input')?.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const br = document.createElement('br');
        range.insertNode(br);
        range.setStartAfter(br);
        range.setEndAfter(br);
        sel.removeAllRanges();
        sel.addRange(range);
        this.dispatchEvent(new Event('input'));
      }
    });

    // --- Sign out ---
    document.getElementById('sign-out-btn')?.addEventListener('click', async () => {
      const ok = await showConfirm({ message: 'Sign out of your account?', confirmText: 'Sign out', cancelText: 'Cancel' });
      if (!ok) return;
      clearToken();
      renderAuthUI();
    });

    // --- Relative time ---
    function timeAgo(iso) {
      const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diff < 60) return 'just now';
      if (diff < 3600) { const m = Math.floor(diff / 60); return `${m} minute${m !== 1 ? 's' : ''} ago`; }
      if (diff < 86400) { const h = Math.floor(diff / 3600); return `${h} hour${h !== 1 ? 's' : ''} ago`; }
      if (diff < 2592000) { const d = Math.floor(diff / 86400); return `${d} day${d !== 1 ? 's' : ''} ago`; }
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    // --- Render comment text with simple markdown ---
    function escapeHtml(str) {
      return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderCommentText(text) {
      return escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/gs, '<em>$1</em>')
        .replace(/__(.+?)__/gs, '<u>$1</u>');
    }

    // --- Apply Twemoji to a DOM element ---
    function applyTwemoji(el) {
      if (!window.twemoji) return;
      twemoji.parse(el, {
        folder: 'svg',
        ext: '.svg',
        base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@v14.0.2/assets/',
        className: 'twemoji-inline',
      });
    }

    // Thread line color shared by the ╰ arm and parent connector
    const THREAD_LINE = '#7c3aed';

    // Tracks the current user's reactions for this page session: commentID → 'like'|'dislike'|''
    const reactionState = new Map();

    // --- Render a single comment node ---
    function buildCommentEl(c, isReply, hasReplies) {
      const wrap = document.createElement('div');
      wrap.dataset.commentId = c.id;

      if (isReply) {
        // position:relative so the arm can be absolutely placed
        wrap.style.cssText = 'position:relative;display:flex;gap:0.75rem;padding:0.75rem 0 0.75rem 1.5rem;';

        // ╰ curved arm:
        //   top:-9999px makes it extend far above this item.
        //   overflow:hidden on .replies-wrap clips it at the container top.
        //   Every reply's arm overlaps in the vertical section → one continuous line.
        //   The border-bottom-left-radius creates the smooth curve at avatar level.
        //   height = 9999px above + padding-top (0.75rem) + half avatar (1rem) = avatar center.
        const arm = document.createElement('div');
        arm.style.cssText = `position:absolute;left:0;top:-9999px;width:1.375rem;height:calc(9999px + 1.75rem);border-left:1.5px solid ${THREAD_LINE};border-bottom:1.5px solid ${THREAD_LINE};border-bottom-left-radius:12px;box-sizing:border-box;pointer-events:none;`;
        wrap.appendChild(arm);
      } else {
        if (hasReplies) {
          // No bottom padding — replies-wrap follows immediately so the connector bridges flush.
          wrap.style.cssText = 'position:relative;display:flex;gap:0.75rem;padding:1rem 0 0 0;';
          // Vertical connector from avatar center down to the bottom of this wrap.
          // left:1.25rem matches the replies-wrap margin-left so the line aligns with reply arms.
          // top: padding-top(1rem) + half avatar(1.25rem) = avatar vertical center.
          const connector = document.createElement('div');
          connector.style.cssText = `position:absolute;left:1.25rem;top:3.5rem;bottom:0;width:0;border-left:1.5px solid ${THREAD_LINE};pointer-events:none;`;
          wrap.appendChild(connector);
        } else {
          wrap.style.cssText = 'display:flex;gap:0.75rem;padding:1rem 0;';
        }
      }

      const avatarSize = isReply ? '2rem' : '2.5rem';
      const initial = (c.user.name || '?')[0].toUpperCase();
      const makeCommentAvatarFallback = () => {
        const d = document.createElement('div');
        d.style.cssText = `width:${avatarSize};height:${avatarSize};border-radius:50%;background:rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.8rem;font-weight:900;color:#818cf8;`;
        d.textContent = initial;
        return d;
      };
      const avatarNode = (() => {
        if (!c.user.avatar) return makeCommentAvatarFallback();
        const img = document.createElement('img');
        img.src = c.user.avatar;
        img.alt = c.user.name || '';
        img.style.cssText = `width:${avatarSize};height:${avatarSize};border-radius:50%;object-fit:cover;flex-shrink:0;`;
        img.onerror = () => img.replaceWith(makeCommentAvatarFallback());
        return img;
      })();
      // Placeholder used in innerHTML; replaced with avatarNode after parsing.
      const avatarHTML = `<span class="avatar-slot"></span>`;

      const token = getToken();
      const payload = token ? parseJWT(token) : null;
      const isOwner = payload && String(payload.sub) === String(c.user_id || c.user?.id);

      const contentHTML = c.recalled
        ? `<p style="font-size:0.875rem;font-style:italic;color:var(--text-tertiary);margin:0 0 0.625rem 0;">Message recalled</p>`
        : `<p style="font-size:${isReply ? '0.875rem' : '0.9rem'};color:var(--text-secondary);line-height:1.65;white-space:pre-wrap;word-break:break-word;margin:0 0 0.625rem 0;">${renderCommentText(c.content)}</p>`;

      const recallBtn = isOwner && !c.recalled
        ? `<button class="recall-btn" type="button" data-id="${c.id}" style="display:flex;align-items:center;gap:0.3rem;font-size:0.75rem;color:var(--text-tertiary);background:transparent;border:none;cursor:pointer;padding:0;transition:color 0.15s;" onmouseover="this.style.color='#f87171'" onmouseout="this.style.color='var(--text-tertiary)'">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
              Recall
            </button>`
        : '';

      const replyBtnHTML = `<button class="reply-btn" type="button" style="display:flex;align-items:center;gap:0.3rem;font-size:0.75rem;color:var(--text-tertiary);background:transparent;border:none;cursor:pointer;padding:0;transition:color 0.15s;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-tertiary)'">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Reply
            </button>`;

      const curReaction = reactionState.get(String(c.id)) || '';
      const likeActive = curReaction === 'like';
      const dislikeActive = curReaction === 'dislike';
      const reactBtns = `
        <button class="react-btn" data-rtype="like" style="display:flex;align-items:center;gap:0.3rem;font-size:0.75rem;color:${likeActive ? '#7c3aed' : 'var(--text-tertiary)'};background:transparent;border:none;cursor:pointer;padding:0;transition:color 0.15s;font-weight:${likeActive ? '700' : '400'};">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="${likeActive ? '#7c3aed' : 'none'}" stroke="${likeActive ? '#7c3aed' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
          <span class="like-count">${c.likes || 0}</span>
        </button>
        <button class="react-btn" data-rtype="dislike" style="display:flex;align-items:center;gap:0.3rem;font-size:0.75rem;color:${dislikeActive ? '#f87171' : 'var(--text-tertiary)'};background:transparent;border:none;cursor:pointer;padding:0;transition:color 0.15s;font-weight:${dislikeActive ? '700' : '400'};">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="${dislikeActive ? '#f87171' : 'none'}" stroke="${dislikeActive ? '#f87171' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
          <span class="dislike-count">${c.dislikes || 0}</span>
        </button>`;

      // For reply items, content is appended to the already-positioned wrap (arm is first child)
      const contentWrap = document.createElement('div');
      contentWrap.innerHTML = `
        ${avatarHTML}
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:baseline;gap:0.5rem;margin-bottom:0.3rem;">
            <span style="font-size:${isReply ? '0.875rem' : '0.9rem'};font-weight:700;color:var(--text-primary);">${escapeHtml(c.user.name)}</span>
            <span style="font-size:0.72rem;color:var(--text-tertiary);">${timeAgo(c.created_at)}</span>
          </div>
          ${contentHTML}
          <div class="comment-actions" style="display:flex;align-items:center;gap:1rem;">
            ${replyBtnHTML}
            ${reactBtns}
            ${recallBtn}
          </div>
        </div>
      `;
      // Replace the avatar placeholder with the real DOM node, then move children into wrap.
      contentWrap.querySelector('.avatar-slot')?.replaceWith(avatarNode);
      while (contentWrap.firstChild) wrap.appendChild(contentWrap.firstChild);

      wrap.querySelector('.recall-btn')?.addEventListener('click', async () => {
        const ok = await showConfirm({ message: 'Recall this comment? It cannot be undone.', confirmText: 'Recall', cancelText: 'Cancel', danger: true });
        if (!ok) return;
        const t = getToken();
        if (!isTokenValid(t)) return;
        const res = await fetch(`${API_URL}/posts/${postID}/comments/${c.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${t}` },
        });
        if (res.ok || res.status === 204) {
          const p = wrap.querySelector('p');
          if (p) { p.textContent = 'Message recalled'; p.style.fontStyle = 'italic'; p.style.color = 'var(--text-tertiary)'; p.style.fontSize = '0.875rem'; }
          wrap.querySelector('.recall-btn')?.remove();
        }
      });

      wrap.querySelector('.reply-btn')?.addEventListener('click', () => {
        if (isReply) {
          // Replies can't nest — post to the same parent thread.
          // The root comment wrap is the sibling before our replies-wrap container.
          const rootWrap = wrap.parentElement?.previousElementSibling;
          if (rootWrap) toggleReplyForm(rootWrap, c.parent_id, c.user.name);
        } else {
          toggleReplyForm(wrap, c.id, c.user.name);
        }
      });

      function applyReactionUI(userReaction, likes, dislikes) {
        wrap.querySelectorAll('.react-btn').forEach(b => {
          const bt = b.dataset.rtype;
          const active = userReaction === bt;
          const activeColor = bt === 'like' ? '#7c3aed' : '#f87171';
          b.style.color = active ? activeColor : 'var(--text-tertiary)';
          b.style.fontWeight = active ? '700' : '400';
          const svg = b.querySelector('svg');
          if (svg) {
            svg.setAttribute('fill', active ? activeColor : 'none');
            svg.setAttribute('stroke', active ? activeColor : 'currentColor');
          }
          const countEl = b.querySelector(bt === 'like' ? '.like-count' : '.dislike-count');
          if (countEl) countEl.textContent = bt === 'like' ? likes : dislikes;
        });
      }

      wrap.querySelectorAll('.react-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const t = getToken();
          if (!isTokenValid(t)) {
            const returnTo = encodeURIComponent(window.location.href);
            window.location.href = `${API_URL}/auth/google?return_to=${returnTo}`;
            return;
          }
          const rtype = btn.dataset.rtype;
          if (btn.disabled) return;
          btn.disabled = true;

          // Optimistic update
          const prevReaction = reactionState.get(String(c.id)) || '';
          const newReaction = prevReaction === rtype ? '' : rtype;
          const likeEl = wrap.querySelector('.like-count');
          const dislikeEl = wrap.querySelector('.dislike-count');
          const prevLikes = parseInt(likeEl?.textContent || '0');
          const prevDislikes = parseInt(dislikeEl?.textContent || '0');
          let optLikes = prevLikes, optDislikes = prevDislikes;
          if (rtype === 'like') {
            optLikes += newReaction === 'like' ? 1 : -1;
            if (prevReaction === 'dislike') optDislikes -= 1;
          } else {
            optDislikes += newReaction === 'dislike' ? 1 : -1;
            if (prevReaction === 'like') optLikes -= 1;
          }
          reactionState.set(String(c.id), newReaction);
          applyReactionUI(newReaction, optLikes, optDislikes);

          try {
            const res = await fetch(`${API_URL}/posts/${postID}/comments/${c.id}/react`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
              body: JSON.stringify({ type: rtype }),
            });
            if (res.status === 401 || res.status === 403) { clearToken(); renderAuthUI(); return; }
            if (!res.ok) throw new Error();
            const data = await res.json();
            // Reconcile with server truth
            reactionState.set(String(c.id), data.user_reaction);
            applyReactionUI(data.user_reaction, data.likes, data.dislikes);
          } catch {
            // Revert on failure
            reactionState.set(String(c.id), prevReaction);
            applyReactionUI(prevReaction, prevLikes, prevDislikes);
          } finally {
            btn.disabled = false;
          }
        });
      });

      return wrap;
    }

    // --- Inline reply form ---
    function toggleReplyForm(parentWrap, parentCommentId, parentUserName) {
      const existing = parentWrap.querySelector('.reply-form-wrap');
      if (existing) { existing.remove(); return; }

      const token = getToken();
      const payload = token ? parseJWT(token) : null;

      const formWrap = document.createElement('div');
      formWrap.className = 'reply-form-wrap';
      formWrap.style.cssText = 'margin-top:0.75rem;padding:0.75rem;border-radius:0.75rem;border:1px solid var(--comment-divider,rgba(255,255,255,0.08));background:var(--comment-box-bg,rgba(255,255,255,0.02));';

      if (!isTokenValid(token)) {
        formWrap.innerHTML = `<p style="font-size:0.8rem;color:var(--text-tertiary);margin:0;">
          <button type="button" id="reply-sign-in" style="color:#7c3aed;font-weight:700;background:none;border:none;cursor:pointer;font-size:0.8rem;padding:0;">Sign in with Google</button> to reply.
        </p>`;
        parentWrap.querySelector('.comment-actions').after(formWrap);
        formWrap.querySelector('#reply-sign-in')?.addEventListener('click', () => {
          const returnTo = encodeURIComponent(window.location.href);
          window.location.href = `${API_URL}/auth/google?return_to=${returnTo}`;
        });
        return;
      }

      // Build avatar as a real DOM element so onerror is a JS function, not an HTML attribute.
      const _rInitial = (payload.name || '?')[0].toUpperCase();
      const makeAvatarFallback = (size, fontSize) => {
        const d = document.createElement('div');
        d.style.cssText = `width:${size};height:${size};border-radius:50%;background:rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:${fontSize};font-weight:900;color:#818cf8;`;
        d.textContent = _rInitial;
        return d;
      };
      const avatarNode = (() => {
        if (!payload.avatar) return makeAvatarFallback('1.75rem', '0.75rem');
        const img = document.createElement('img');
        img.src = payload.avatar;
        img.alt = '';
        img.style.cssText = 'width:1.75rem;height:1.75rem;border-radius:50%;object-fit:cover;flex-shrink:0;';
        img.onerror = () => img.replaceWith(makeAvatarFallback('1.75rem', '0.75rem'));
        return img;
      })();

      formWrap.innerHTML = `
        <div class="reply-form-inner" style="display:flex;gap:0.5rem;align-items:flex-start;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.7rem;color:var(--text-tertiary);margin-bottom:0.375rem;">Replying to <span style="color:#818cf8;font-weight:600;">@${escapeHtml(parentUserName)}</span></div>
            <div class="reply-input" contenteditable="true" role="textbox" aria-multiline="true" data-empty="true"
              style="width:100%;padding:0.5rem 0.75rem;font-size:0.875rem;background:transparent;border:1px solid var(--comment-divider,rgba(255,255,255,0.08));border-radius:0.5rem;outline:none;color:var(--text-primary);box-sizing:border-box;transition:border-color 0.15s;min-height:2.8rem;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;line-height:1.6;cursor:text;"
              onfocus="this.style.borderColor='rgba(124,58,237,0.4)'" onblur="this.style.borderColor='var(--comment-divider,rgba(255,255,255,0.08))'"></div>
            <div style="border-top:1px solid var(--comment-divider,rgba(255,255,255,0.06));display:flex;align-items:center;gap:0.375rem;padding:0.375rem 0.25rem 0;margin-top:0.375rem;">
              <button type="button" class="reply-fmt-bold fmt-btn" title="Bold" style="padding:0.2rem 0.35rem;border-radius:0.3rem;font-size:0.7rem;font-weight:700;background:transparent;border:none;cursor:pointer;color:var(--text-secondary);transition:background 0.15s;" onmouseover="this.style.background='rgba(99,102,241,0.1)'" onmouseout="this.style.background='transparent'"><b>B</b></button>
              <button type="button" class="reply-fmt-italic fmt-btn" title="Italic" style="padding:0.2rem 0.35rem;border-radius:0.3rem;font-size:0.7rem;font-weight:700;font-style:italic;background:transparent;border:none;cursor:pointer;color:var(--text-secondary);transition:background 0.15s;" onmouseover="this.style.background='rgba(99,102,241,0.1)'" onmouseout="this.style.background='transparent'">I</button>
              <button type="button" class="reply-fmt-underline fmt-btn" title="Underline" style="padding:0.2rem 0.35rem;border-radius:0.3rem;font-size:0.7rem;font-weight:700;text-decoration:underline;background:transparent;border:none;cursor:pointer;color:var(--text-secondary);transition:background 0.15s;" onmouseover="this.style.background='rgba(99,102,241,0.1)'" onmouseout="this.style.background='transparent'">U</button>
              <div style="width:1px;height:0.875rem;background:var(--comment-divider,rgba(255,255,255,0.1));margin:0 0.25rem;"></div>
              <button type="button" class="emoji-picker-btn" title="Emoji" style="padding:0.2rem 0.3rem;border-radius:0.3rem;background:transparent;border:none;cursor:pointer;transition:background 0.15s;display:flex;align-items:center;" onmouseover="this.style.background='rgba(99,102,241,0.1)'" onmouseout="this.style.background='transparent'"><img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@v14.0.2/assets/svg/1f60a.svg" width="16" height="16" alt="😊" style="pointer-events:none;"></button>
              <div style="flex:1;"></div>
              <span class="reply-char-count" style="font-size:0.65rem;color:var(--text-tertiary);"></span>
              <button class="reply-cancel" type="button"
                style="padding:0.375rem 0.875rem;border-radius:0.5rem;font-size:0.78rem;font-weight:600;background:transparent;border:1px solid var(--comment-divider,rgba(255,255,255,0.12));color:var(--text-secondary);cursor:pointer;transition:background 0.15s;"
                onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='transparent'">Cancel</button>
              <button class="reply-submit" type="button"
                style="padding:0.375rem 0.875rem;border-radius:0.5rem;font-size:0.78rem;font-weight:700;background:#7c3aed;color:#fff;border:none;cursor:pointer;transition:background 0.2s;"
                onmouseover="this.style.background='#6d28d9'" onmouseout="this.style.background='#7c3aed'">Reply</button>
            </div>
          </div>
        </div>
      `;
      formWrap.querySelector('.reply-form-inner').prepend(avatarNode);

      parentWrap.querySelector('.comment-actions').after(formWrap);
      const replyInput = formWrap.querySelector('.reply-input');
      const replyCharCount = formWrap.querySelector('.reply-char-count');
      replyInput.focus();
      replyCharCount.textContent = '0/500';

      // Char counter + placeholder toggle
      replyInput.addEventListener('input', function() {
        const len = getCommentText(this).length;
        this.dataset.empty = len === 0 ? 'true' : 'false';
        replyCharCount.textContent = `${len}/500`;
        replyCharCount.style.color = len >= 500 ? '#f87171' : len > 460 ? '#fb923c' : 'var(--text-tertiary)';
      });

      // Format buttons
      formWrap.querySelector('.reply-fmt-bold').addEventListener('click', () => applyFormat(replyInput, '**'));
      formWrap.querySelector('.reply-fmt-italic').addEventListener('click', () => applyFormat(replyInput, '*'));
      formWrap.querySelector('.reply-fmt-underline').addEventListener('click', () => applyFormat(replyInput, '__'));

      // Paste: strip HTML, convert emojis to Twemoji
      replyInput.addEventListener('paste', function(e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        range.deleteContents();
        if (window.twemoji) {
          const tmp = document.createElement('div');
          tmp.textContent = text;
          twemoji.parse(tmp, { folder: 'svg', ext: '.svg', base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@v14.0.2/assets/', className: 'twemoji-inline' });
          tmp.querySelectorAll('img.twemoji-inline').forEach(img => { img.dataset.emoji = img.alt; img.style.pointerEvents = 'none'; });
          const frag = document.createDocumentFragment();
          while (tmp.firstChild) frag.appendChild(tmp.firstChild);
          range.insertNode(frag);
        } else {
          range.insertNode(document.createTextNode(text));
        }
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        this.dispatchEvent(new Event('input'));
      });

      // Enter → <br>
      replyInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          const sel = window.getSelection();
          if (!sel || !sel.rangeCount) return;
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const br = document.createElement('br');
          range.insertNode(br);
          range.setStartAfter(br);
          range.setEndAfter(br);
          sel.removeAllRanges();
          sel.addRange(range);
          this.dispatchEvent(new Event('input'));
        }
      });

      formWrap.querySelector('.reply-cancel').addEventListener('click', () => formWrap.remove());

      formWrap.querySelector('.reply-submit').addEventListener('click', async () => {
        const t = getToken();
        if (!isTokenValid(t)) { renderAuthUI(); formWrap.remove(); return; }
        const content = getCommentText(replyInput).trim();
        if (!content) return;

        const submitBtn = formWrap.querySelector('.reply-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting…';

        try {
          const res = await fetch(`${API_URL}/posts/${postID}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
            body: JSON.stringify({ content, parent_id: parentCommentId }),
          });

          if (res.status === 401 || res.status === 403) { clearToken(); renderAuthUI(); return; }
          if (!res.ok) { const txt = await res.text(); alert(txt || 'Failed to post reply'); return; }

          const reply = await res.json();
          const p = parseJWT(t);
          reply.user = { id: p.sub, name: p.name, email: p.email, avatar: p.avatar || '' };
          trackLocalComment(reply);

          // Find or create replies container
          let repliesWrap = parentWrap.nextElementSibling;
          if (!repliesWrap || !repliesWrap.classList.contains('replies-wrap')) {
            repliesWrap = document.createElement('div');
            repliesWrap.className = 'replies-wrap';
            repliesWrap.style.cssText = 'margin-left:1.25rem;position:relative;overflow:hidden;margin-bottom:0.25rem;';
            parentWrap.after(repliesWrap);
            // first reply: convert parent to connector style (no divider, no bottom padding)
            parentWrap.style.borderBottom = 'none';
            parentWrap.style.paddingBottom = '0';
            parentWrap.style.position = 'relative';
            const connector = document.createElement('div');
            connector.style.cssText = `position:absolute;left:1.25rem;top:3.5rem;bottom:0;width:0;border-left:1.5px solid ${THREAD_LINE};pointer-events:none;`;
            parentWrap.appendChild(connector);
          }
          const replyEl = buildCommentEl(reply, true);
          applyTwemoji(replyEl);
          repliesWrap.appendChild(replyEl);
          formWrap.remove();

          const current = parseInt(countBadge?.textContent) || 0;
          updateCountBadge(current + 1);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Reply';
        }
      });
    }

    function updateCountBadge(count) {
      if (!countBadge) return;
      if (count > 0) {
        countBadge.textContent = count;
        countBadge.style.display = 'inline-block';
      } else {
        countBadge.style.display = 'none';
      }
    }

    // --- Fetch and render comments ---
    let cachedComments = [];
    let sortOrder = 'newest'; // 'newest' | 'oldest'

    // Pagination state. The server pages top-level comments (newest first);
    // each page carries its replies. commentOffset counts top-level comments.
    const COMMENT_PAGE = 20;
    let commentOffset = 0;
    let commentsHasMore = false;
    let commentsLoading = false;
    const seenCommentIds = new Set();

    // Merge a fetched page into cachedComments, skipping anything already held
    // (a freshly posted comment shifts server offsets, so a later page can
    // re-return a row we already have — dedupe keeps the list clean).
    function mergeComments(list) {
      for (const c of list) {
        if (seenCommentIds.has(c.id)) continue;
        seenCommentIds.add(c.id);
        cachedComments.push(c);
        if (c.user_reaction) reactionState.set(String(c.id), c.user_reaction);
      }
    }

    // Track a comment created in this session so re-renders (sort, load-more)
    // keep it instead of dropping it.
    function trackLocalComment(c) {
      if (seenCommentIds.has(c.id)) return;
      seenCommentIds.add(c.id);
      cachedComments.push(c);
    }

    async function fetchCommentsPage(offset) {
      const t = getToken();
      const headers = isTokenValid(t) ? { 'Authorization': `Bearer ${t}` } : {};
      const res = await fetch(`${API_URL}/posts/${postID}/comments?limit=${COMMENT_PAGE}&offset=${offset}`, { headers });
      if (!res.ok) throw new Error();
      const list = await res.json();
      const total = parseInt(res.headers.get('X-Total-Count')) || list.length;
      const hasMore = res.headers.get('X-Has-More') === 'true';
      return { list, total, hasMore };
    }

    function updateLoadMoreBtn() {
      const btn = document.getElementById('load-more-comments');
      if (!btn) return;
      btn.style.display = commentsHasMore ? 'inline-flex' : 'none';
      btn.disabled = commentsLoading;
      btn.textContent = commentsLoading ? 'Loading…' : 'Load more comments';
    }

    function renderComments(all) {
      if (!all.length) {
        commentList.innerHTML = '<p id="comments-empty" style="padding:2.5rem 0;text-align:center;font-size:0.75rem;color:var(--text-tertiary);">No comments yet. Be the first!</p>';
        return;
      }
      commentList.innerHTML = '';
      const repliesMap = {};
      all.filter(c => c.parent_id).forEach(c => {
        if (!repliesMap[c.parent_id]) repliesMap[c.parent_id] = [];
        repliesMap[c.parent_id].push(c);
      });
      const toplevel = all.filter(c => !c.parent_id).sort((a, b) =>
        sortOrder === 'newest'
          ? new Date(b.created_at) - new Date(a.created_at)
          : new Date(a.created_at) - new Date(b.created_at)
      );
      toplevel.forEach(c => {
        const replies = repliesMap[c.id];
        commentList.appendChild(buildCommentEl(c, false, replies && replies.length > 0));
        if (replies && replies.length) {
          const repliesWrap = document.createElement('div');
          repliesWrap.className = 'replies-wrap';
          repliesWrap.style.cssText = 'margin-left:1.25rem;position:relative;overflow:hidden;margin-bottom:0.25rem;';
          replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          replies.forEach(r => repliesWrap.appendChild(buildCommentEl(r, true)));
          commentList.appendChild(repliesWrap);
        }
      });
      applyTwemoji(commentList);
    }

    async function loadComments() {
      try {
        const { list, total, hasMore } = await fetchCommentsPage(0);
        cachedComments = [];
        seenCommentIds.clear();
        mergeComments(list);
        commentOffset = COMMENT_PAGE;
        commentsHasMore = hasMore;
        loadingEl?.remove();
        updateCountBadge(total);
        renderComments(cachedComments);
        updateLoadMoreBtn();
      } catch {
        if (loadingEl) loadingEl.querySelector('p').textContent = 'Failed to load comments.';
      }
    }

    async function loadMoreComments() {
      if (commentsLoading || !commentsHasMore) return;
      commentsLoading = true;
      updateLoadMoreBtn();
      try {
        const { list, total, hasMore } = await fetchCommentsPage(commentOffset);
        mergeComments(list);
        commentOffset += COMMENT_PAGE;
        commentsHasMore = hasMore;
        updateCountBadge(total);
        renderComments(cachedComments);
      } catch {
        // Leave the button visible so the user can retry.
      } finally {
        commentsLoading = false;
        updateLoadMoreBtn();
      }
    }

    document.getElementById('load-more-comments')?.addEventListener('click', loadMoreComments);

    document.getElementById('sort-toggle')?.addEventListener('click', () => {
      sortOrder = sortOrder === 'newest' ? 'oldest' : 'newest';
      document.getElementById('sort-label').textContent = sortOrder === 'newest' ? 'Newest first' : 'Oldest first';
      if (cachedComments) renderComments(cachedComments);
    });

    // --- Submit comment ---
    commentForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = getToken();
      if (!isTokenValid(token)) { renderAuthUI(); return; }

      const input = document.getElementById('comment-input');
      const content = getCommentText(input).trim();
      if (!content) return;

      const submitBtn = commentForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Posting…';

      try {
        const res = await fetch(`${API_URL}/posts/${postID}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ content }),
        });

        if (res.status === 401 || res.status === 403) { clearToken(); renderAuthUI(); return; }
        if (!res.ok) { const t = await res.text(); alert(t || 'Failed to post comment'); return; }

        const comment = await res.json();
        const payload = parseJWT(token);
        comment.user = { id: payload.sub, name: payload.name, email: payload.email, avatar: payload.avatar || '' };
        trackLocalComment(comment);
        const empty = document.getElementById('comments-empty');
        if (empty) empty.remove();
        const newEl = buildCommentEl(comment);
        applyTwemoji(newEl);
        commentList.prepend(newEl);
        input.innerHTML = '';
        input.dataset.empty = 'true';
        if (charCount) charCount.textContent = '0/500';
        const current = parseInt(countBadge?.textContent) || 0;
        updateCountBadge(current + 1);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    });

    renderAuthUI();
    loadComments();
  })();
