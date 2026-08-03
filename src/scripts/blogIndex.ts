import { refreshPostStats } from '../utils/postStats';
import { initPostLikes } from './postLikes';

// /blog index behaviour: topic + search filtering, client-side pagination, the
// like buttons, and the topic-chip row clamp. Lived as a ~340-line inline
// <script> in BlogIndexPage.astro while every comparable page script already
// lived here — moved so the page component is markup + styles only.
//
// Every element is looked up by id from the page's own markup, so this is a
// no-op sentinel-free module: it must only be called from the blog index.
export function initBlogIndex() {
  // Home links: use history.back() if we came from / (preserves scroll)
  document.querySelectorAll<HTMLAnchorElement>('a[href="/"]').forEach(link => {
    link.addEventListener('click', e => {
      try {
        const ref = document.referrer;
        if (ref && new URL(ref).pathname === '/') {
          e.preventDefault();
          history.back();
        }
      } catch (_) {}
    });
  });

  const POSTS_PER_PAGE = 9;
  let currentPage = 1;
  let currentTopic = 'all';

  const grid = document.getElementById('posts-grid')!;
  const allItems = Array.from(grid.querySelectorAll<HTMLElement>('.post-item'));
  const paginationEl = document.getElementById('pagination')!;
  const pageNumbers = document.getElementById('page-numbers')!;
  const prevBtn = document.getElementById('prev-btn') as HTMLButtonElement;
  const nextBtn = document.getElementById('next-btn') as HTMLButtonElement;
  const postsCount = document.getElementById('posts-count')!;
  const emptyState = document.getElementById('empty-state')!;
  const searchInput = document.getElementById('tb-search') as HTMLInputElement | null;
  const tbCount = document.getElementById('tb-count');
  const featuredEl = document.getElementById('tb-featured') as HTMLElement | null;
  const featuredId = featuredEl?.dataset.featuredId;
  let query = '';

  function getMatches(): HTMLElement[] {
    return allItems.filter(item => {
      const topics = JSON.parse(item.dataset.topics || '[]') as string[];
      const okTopic = currentTopic === 'all' || topics.some(t => t.toLowerCase() === currentTopic.toLowerCase());
      const okQuery = !query || (item.dataset.search || '').includes(query);
      return okTopic && okQuery;
    });
  }

  function render() {
    const matches = getMatches();

    // Featured shows only in the default state (All + no search). Excluded from the grid
    // on every page so it never duplicates; displayed only on page 1.
    const featuredMode = !!featuredEl && currentTopic === 'all' && query === '' && matches.length > 0;
    const gridItems = featuredMode ? matches.filter(it => it.dataset.id !== featuredId) : matches;
    const showFeatured = featuredMode && currentPage === 1;
    if (featuredEl) featuredEl.style.display = showFeatured ? '' : 'none';

    if (tbCount) tbCount.textContent = String(matches.length);

    const totalPages = Math.max(1, Math.ceil(gridItems.length / POSTS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    const pageItems = gridItems.slice(start, end);

    allItems.forEach(item => { item.style.display = 'none'; });

    if (matches.length === 0) {
      emptyState.classList.remove('hidden');
      paginationEl.style.display = 'none';
      postsCount.textContent = '';
      return;
    }

    emptyState.classList.add('hidden');
    pageItems.forEach((item, i) => {
      item.style.display = '';
      const card = item.querySelector<HTMLElement>('.tb-card');
      if (card) {
        card.classList.remove('card-visible');
        card.style.opacity = '0';
        card.style.transform = 'translateY(24px)';
        setTimeout(() => {
          card.style.animationDelay = `${(i % 3) * 0.08}s`;
          card.classList.add('card-visible');
        }, 16);
      }
    });

    paginationEl.style.display = totalPages <= 1 ? 'none' : 'flex';
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    buildPageNumbers(totalPages);

    if (gridItems.length === 0) {
      postsCount.textContent = '';
    } else {
      const shownEnd = Math.min(end, gridItems.length);
      const showingTpl = paginationEl.dataset.showingTpl || 'Showing {from}–{to} of {total}';
      const featuredSuffix = paginationEl.dataset.featuredSuffix || ' + featured';
      const showing = showingTpl
        .replace('{from}', String(start + 1))
        .replace('{to}', String(shownEnd))
        .replace('{total}', String(gridItems.length));
      postsCount.textContent = showing + (showFeatured ? featuredSuffix : '');
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      query = searchInput.value.trim().toLowerCase();
      currentPage = 1;
      render();
    });
  }
  document.getElementById('tb-clear')?.addEventListener('click', () => {
    query = '';
    currentTopic = 'all';
    currentPage = 1;
    if (searchInput) searchInput.value = '';
    document.querySelectorAll('.topic-btn').forEach(b => {
      b.classList.toggle('active-filter', (b as HTMLElement).dataset.topic === 'all');
    });
    render();
  });

  function buildPageNumbers(totalPages: number) {
    pageNumbers.innerHTML = '';
    const MAX = 5;
    let s = Math.max(1, currentPage - Math.floor(MAX / 2));
    let e = Math.min(totalPages, s + MAX - 1);
    if (e - s < MAX - 1) s = Math.max(1, e - MAX + 1);

    if (s > 1) {
      pageNumbers.appendChild(makePageBtn(1));
      if (s > 2) pageNumbers.appendChild(makeEllipsis());
    }
    for (let i = s; i <= e; i++) pageNumbers.appendChild(makePageBtn(i));
    if (e < totalPages) {
      if (e < totalPages - 1) pageNumbers.appendChild(makeEllipsis());
      pageNumbers.appendChild(makePageBtn(totalPages));
    }
  }

  function makePageBtn(n: number): HTMLButtonElement {
    const active = n === currentPage;
    const btn = document.createElement('button');
    btn.textContent = String(n);
    btn.setAttribute('style', [
      'width:2.25rem',
      'height:2.25rem',
      'border-radius:9999px',
      `border:1px solid ${active ? 'rgb(var(--accent-rgb) / 0.8)' : 'color-mix(in srgb, var(--text-primary) 16%, transparent)'}`,
      `background:${active ? 'rgb(var(--accent-rgb) / 0.15)' : 'transparent'}`,
      `color:${active ? 'var(--accent)' : 'color-mix(in srgb, var(--text-primary) 55%, transparent)'}`,
      'font-size:0.7rem',
      'font-weight:800',
      'cursor:pointer',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'transition:all 0.2s',
    ].join(';'));
    if (!active) {
      btn.addEventListener('mouseenter', () => {
        btn.style.borderColor = 'rgb(var(--accent-rgb) / 0.5)';
        btn.style.color = 'var(--text-primary)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.borderColor = 'color-mix(in srgb, var(--text-primary) 16%, transparent)';
        btn.style.color = 'color-mix(in srgb, var(--text-primary) 55%, transparent)';
      });
    }
    btn.addEventListener('click', () => {
      currentPage = n;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    return btn;
  }

  function makeEllipsis(): HTMLSpanElement {
    const s = document.createElement('span');
    s.textContent = '…';
    s.setAttribute('style', 'color:color-mix(in srgb, var(--text-primary) 45%, transparent);font-size:0.75rem;padding:0 2px;');
    return s;
  }

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  nextBtn.addEventListener('click', () => {
    if (nextBtn.disabled) return;
    currentPage++; render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.querySelectorAll<HTMLElement>('.topic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active-filter'));
      btn.classList.add('active-filter');
      currentTopic = btn.dataset.topic || 'all';
      currentPage = 1;
      render();
    });
  });

  // Like buttons — shared with the home blog rail (see postLikes.ts).
  initPostLikes();

  render();
  refreshPostStats();

  // Topic chips: clamp to two rows on wide viewports, with a toggle to reveal the rest.
  // Mobile keeps the single horizontal-scroll row (no clamp).
  const chipsEl = document.getElementById('topic-filters');
  const chipsToggle = document.getElementById('chips-toggle') as HTMLButtonElement | null;
  let chipsExpanded = false;

  function clampChips() {
    if (!chipsEl || !chipsToggle) return;
    // Bail until the chips have actually been laid out — otherwise we'd measure a
    // single zero-width row and wrongly conclude there's nothing to clamp.
    if (chipsEl.getBoundingClientRect().width === 0) return;
    chipsEl.classList.remove('is-clamped');
    chipsEl.style.maxHeight = '';
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) { chipsToggle.hidden = true; return; }
    if (chipsExpanded) { chipsToggle.hidden = false; return; }
    const btns = Array.from(chipsEl.querySelectorAll<HTMLElement>('.topic-btn'));
    if (!btns.length) return;
    const tops = [...new Set(btns.map(b => Math.round(b.getBoundingClientRect().top)))].sort((a, b) => a - b);
    if (tops.length <= 2) { chipsToggle.hidden = true; return; }
    const chipH = btns[0].getBoundingClientRect().height;
    chipsEl.style.maxHeight = `${(tops[1] - tops[0]) + chipH + 2}px`;
    chipsEl.classList.add('is-clamped');
    chipsToggle.hidden = false;
    chipsToggle.textContent = chipsToggle.dataset.showAll || 'Show all tags';
  }

  chipsToggle?.addEventListener('click', () => {
    chipsExpanded = !chipsExpanded;
    if (chipsExpanded) {
      chipsEl?.classList.remove('is-clamped');
      if (chipsEl) chipsEl.style.maxHeight = '';
      chipsToggle.textContent = chipsToggle.dataset.showFewer || 'Show fewer tags';
    } else {
      clampChips();
    }
  });

  let chipsResizeTimer: number;
  window.addEventListener('resize', () => {
    window.clearTimeout(chipsResizeTimer);
    chipsResizeTimer = window.setTimeout(() => { if (!chipsExpanded) clampChips(); }, 150);
  });

  // Measure after layout is committed (double rAF), again on full load, and once
  // webfonts settle (chip widths shift the row breaks) — covers every timing.
  const scheduleClamp = () => { if (!chipsExpanded) clampChips(); };
  requestAnimationFrame(() => requestAnimationFrame(scheduleClamp));
  window.addEventListener('load', scheduleClamp);
  if (document.fonts?.ready) document.fonts.ready.then(scheduleClamp);
}
