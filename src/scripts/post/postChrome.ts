// Article chrome for the post page: the back-to-blog shortcut, the per-code-block
// copy buttons, the share button, the local "save for later" bookmark, and
// keeping the theme icon in sync with the active theme.
//
// Split out of the old postEngagementComments module — none of this touches the
// engagement counters or the comment thread.
export function initPostChrome() {
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
    const read = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
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
  setupCopyButtons();
  setupShare();
  setupBookmark();
  updateThemeIcon();
  document.querySelector('[aria-label="Toggle theme"]')?.addEventListener('click', () => {
    setTimeout(updateThemeIcon, 50);
  });
}
