(function() {
  const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/';

  // Twemoji codepoint → SVG URL
  function twUrl(emoji) {
    const cp = [...emoji]
      .map(c => c.codePointAt(0).toString(16))
      .filter(c => c !== 'fe0f')
      .join('-');
    return CDN + cp + '.svg';
  }

  // Read localized strings from the emoji-i18n block (injected by PostDetailPage.astro).
  // Falls back to the English literal if the block is absent or a key is missing.
  function _ei18n(key, fallback) {
    try {
      const el = document.getElementById('emoji-i18n');
      if (el) { const d = JSON.parse(el.textContent); if (d[key] != null) return d[key]; }
    } catch (_) {}
    return fallback;
  }

  const CATS = [
    { icon: '😊', titleKey: 'catSmileys', title: 'Smileys', emojis: ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','🥲','🙂','🤗','🤩','🥳','😏','🙄','😤','🤔','🤫','🤭','😐','😶','😬','🙃','😔','😪','🥺','😢','😭','😠','😡','🤯','😳','🥵','🥶','😱','😰','😓','🫠','😴','🥱','💀','👻','🤖','🥹','😮','😲','🫡','😷','🤒','🤕','🤑','🤠','🥸','🤡','👹','👺','💩'] },
    { icon: '👋', titleKey: 'catGestures', title: 'Gestures', emojis: ['👍','👎','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','🫱','🫲','🫳','🫴','🫶','👋','🤝','🙌','👐','🤲','🙏','💪','🦾','✊','👊','🤜','🤛','🫵','💅','🤳','🦵','🦶','👂','🦻','👃','🫀','🫁','🧠','🦷','🦴','👁️','👅','👄'] },
    { icon: '❤️', titleKey: 'catHearts', title: 'Hearts', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','💕','💞','💓','💗','💖','💘','💝','💟','❣️','✨','🌟','⭐','💫','🔥','🎉','🎊','🎈','🎀','🌈','⚡','🌙','☀️','💯','🏆','👑','🥇','🎯','🎁','🎗️','🪄','🔮','🪅','🎆','🎇','🧨','🎋','🎍','🎎','🎏','🎐','🧧'] },
    { icon: '🐱', titleKey: 'catAnimals', title: 'Animals', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐙','🦋','🐝','🦄','🐧','🐦','🦜','🦆','🦉','🦚','🦩','🐢','🦎','🐬','🐳','🦈','🐡','🦞','🦀','🦑','🪸','🌸','🌺','🌻','🌹','🌷','🍀','🌿','🌱','🌳','🌊','🌋','🏔️','🌅','🌄','🌠','🌌','🌍','🌙','☁️','⛅','🌈','❄️','🌊'] },
    { icon: '🍕', titleKey: 'catFood', title: 'Food', emojis: ['🍕','🍔','🍟','🌮','🌯','🥙','🍜','🍝','🍣','🍱','🍛','🍲','🥘','🥗','🥪','🍞','🥐','🧆','🥚','🍳','🧇','🥞','🍗','🌭','🧀','🥦','🥕','🌽','🍎','🍓','🍇','🍊','🍋','🍒','🍑','🥭','🍍','🥥','🎂','🍰','🧁','🍩','🍪','🍫','🍭','🍬','🧋','☕','🍵','🥤','🧃','🥂','🍺','🧊','🫙','🍿','🧂'] },
    { icon: '💻', titleKey: 'catObjects', title: 'Objects', emojis: ['💻','📱','⌨️','🖥️','🖨️','🖱️','📷','📸','🎮','🕹️','💡','🔋','🔌','📚','📖','📝','✏️','🖊️','🔍','🔑','🗝️','🔒','🔓','💎','💰','💳','🎵','🎶','🎸','🎹','🎺','🥁','🎤','🎧','🎬','🎭','🎨','🛸','🚀','✈️','🚂','⚓','🧭','🏖️','🛋️','🪞','🛁','🪥','🧸','🪆','🖼️','🪄','🔭','🧬','💊','🩺','🩹','🧲','🔧','🔨','⚙️','🗑️','📦','📬','📡'] },
  ];

  // Build picker DOM
  const wrap = document.createElement('div');
  wrap.id = 'emoji-picker-wrap';
  wrap.style.cssText = 'position:fixed;z-index:9998;display:none;width:320px;border-radius:1rem;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid var(--comment-divider,rgba(255,255,255,0.1));flex-direction:column;';

  let activeCat = 0;

  function pickerBg() {
    return document.body.classList.contains('light-mode') ? '#ffffff' : '#18181b';
  }
  function dividerColor() {
    return document.body.classList.contains('light-mode') ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)';
  }
  function textColor() {
    return document.body.classList.contains('light-mode') ? '#374151' : '#a1a1aa';
  }

  function buildPicker() {
    wrap.innerHTML = '';
    wrap.style.background = pickerBg();

    // Category tabs
    const tabs = document.createElement('div');
    tabs.style.cssText = `display:flex;border-bottom:1px solid ${dividerColor()};background:${pickerBg()};`;
    CATS.forEach((cat, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.title = _ei18n(cat.titleKey, cat.title);
      const img = document.createElement('img');
      img.src = twUrl(cat.icon);
      img.width = 18; img.height = 18;
      img.style.cssText = 'pointer-events:none;';
      btn.appendChild(img);
      btn.style.cssText = `flex:1;padding:0.5rem 0;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:${i === activeCat ? 'rgba(124,58,237,0.12)' : 'transparent'};border-bottom:2px solid ${i === activeCat ? '#7c3aed' : 'transparent'};transition:background 0.15s;`;
      btn.addEventListener('click', () => { activeCat = i; buildPicker(); });
      tabs.appendChild(btn);
    });
    wrap.appendChild(tabs);

    // Search
    const searchWrap = document.createElement('div');
    searchWrap.style.cssText = `padding:0.5rem 0.75rem;border-bottom:1px solid ${dividerColor()};background:${pickerBg()};`;
    const search = document.createElement('input');
    search.type = 'text';
    search.placeholder = _ei18n('searchPlaceholder', '🔍  Search emoji…');
    search.style.cssText = `width:100%;padding:0.35rem 0.6rem;border-radius:0.5rem;border:1px solid ${dividerColor()};background:${document.body.classList.contains('light-mode') ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'};color:${textColor()};font-size:0.8rem;outline:none;box-sizing:border-box;`;
    searchWrap.appendChild(search);
    wrap.appendChild(searchWrap);

    // Grid
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(8,1fr);gap:2px;padding:0.5rem;overflow-y:auto;height:240px;';

    function renderGrid(emojis) {
      grid.innerHTML = '';
      emojis.forEach(em => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.title = em;
        btn.dataset.emoji = em;
        btn.style.cssText = 'background:transparent;border:none;cursor:pointer;padding:0.3rem;border-radius:0.4rem;display:flex;align-items:center;justify-content:center;transition:background 0.12s;';
        const img = document.createElement('img');
        img.src = twUrl(em);
        img.width = 24; img.height = 24;
        img.style.cssText = 'pointer-events:none;';
        btn.appendChild(img);
        btn.addEventListener('mouseover', () => { btn.style.background = 'rgba(124,58,237,0.12)'; });
        btn.addEventListener('mouseout', () => { btn.style.background = 'transparent'; });
        btn.addEventListener('click', () => insertEmoji(em));
        grid.appendChild(btn);
      });
    }

    renderGrid(CATS[activeCat].emojis);
    wrap.appendChild(grid);

    // Live search across all categories
    search.addEventListener('input', () => {
      const q = search.value.trim();
      if (!q) { renderGrid(CATS[activeCat].emojis); return; }
      const all = CATS.flatMap(c => c.emojis);
      renderGrid(all); // simple: show all, user can scroll/scan
    });

    // Scrollbar style
    const style = document.getElementById('emoji-picker-scroll-style');
    if (!style) {
      const s = document.createElement('style');
      s.id = 'emoji-picker-scroll-style';
      s.textContent = '#emoji-picker-wrap div[style*="overflow-y"]::-webkit-scrollbar{width:4px}#emoji-picker-wrap div[style*="overflow-y"]::-webkit-scrollbar-track{background:transparent}#emoji-picker-wrap div[style*="overflow-y"]::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.3);border-radius:9999px}';
      document.head.appendChild(s);
    }
  }

  document.body.appendChild(wrap);
  buildPicker();

  // Re-render on theme toggle
  document.querySelector('[aria-label="Toggle theme"]')?.addEventListener('click', () => setTimeout(buildPicker, 60));

  // Save caret position before any emoji-picker-btn steals focus (event delegation
  // covers both the main toolbar and dynamically-created reply toolbars).
  let savedRange = null;
  document.addEventListener('mousedown', e => {
    const btn = e.target.closest('.emoji-picker-btn');
    if (!btn) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      let container = range.commonAncestorContainer;
      if (container.nodeType === 3) container = container.parentElement;
      while (container && container.contentEditable !== 'true') container = container.parentElement;
      if (container) savedRange = range.cloneRange();
    }
  });

  function insertEmoji(em) {
    // Resolve target: walk up from saved range, or fall back to main input
    let el = null;
    if (savedRange) {
      let c = savedRange.commonAncestorContainer;
      if (c.nodeType === 3) c = c.parentElement;
      while (c && c.contentEditable !== 'true') c = c.parentElement;
      el = c;
    }
    if (!el) el = document.getElementById('comment-input');
    if (!el) return;

    const img = document.createElement('img');
    img.src = twUrl(em);
    img.width = 18; img.height = 18;
    img.className = 'twemoji-inline';
    img.dataset.emoji = em;
    img.alt = em;
    img.style.cssText = 'pointer-events:none;';

    el.focus();
    const rangeToUse = savedRange || (window.getSelection()?.rangeCount ? window.getSelection().getRangeAt(0) : null);
    if (rangeToUse) {
      rangeToUse.deleteContents();
      rangeToUse.insertNode(img);
      rangeToUse.setStartAfter(img);
      rangeToUse.setEndAfter(img);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(rangeToUse);
    } else {
      el.appendChild(img);
    }
    savedRange = null;
    el.dispatchEvent(new Event('input'));
    closePicker();
  }

  function positionPicker(btn) {
    const rect = btn.getBoundingClientRect();
    const pH = 340, pW = 320;
    let top = rect.top - pH - 8;
    let left = rect.left;
    if (top < 8) top = rect.bottom + 8;
    if (left + pW > window.innerWidth - 8) left = window.innerWidth - pW - 8;
    wrap.style.top = top + 'px';
    wrap.style.left = left + 'px';
  }

  let open = false;

  function openPicker(btn) {
    buildPicker();
    positionPicker(btn);
    wrap.style.display = 'flex';
    wrap.style.opacity = '0';
    wrap.style.transform = 'scale(0.95) translateY(6px)';
    wrap.style.transition = 'opacity 0.15s ease,transform 0.15s ease';
    requestAnimationFrame(() => { wrap.style.opacity = '1'; wrap.style.transform = 'scale(1) translateY(0)'; });
    open = true;
  }

  function closePicker() {
    wrap.style.opacity = '0';
    wrap.style.transform = 'scale(0.95) translateY(6px)';
    setTimeout(() => { wrap.style.display = 'none'; }, 150);
    open = false;
  }

  // Delegated click handler for all emoji-picker-btn buttons (main + reply toolbars)
  document.addEventListener('click', e => {
    const btn = e.target.closest('.emoji-picker-btn');
    if (btn && !wrap.contains(e.target)) {
      e.stopPropagation();
      open ? closePicker() : openPicker(btn);
      return;
    }
    if (open && !wrap.contains(e.target)) closePicker();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && open) closePicker();
  });
})();
