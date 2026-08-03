import { invalidatePostStatsCache, refreshPostStats } from '../utils/postStats';

// Post like buttons — the single implementation behind every `.tile-like-area`
// (PostCard renders the markup; the home blog rail and the /blog list both wire
// it up). This lived twice in near-identical copies — inline in BlogIndexPage
// and again in homeReveals — so a fix to one silently missed the other.
//
// Gallery/art tiles (`.art-like-area`) deliberately do NOT use this: they hit a
// different endpoint, key localStorage separately and skip the heart burst.

// Six hearts fanned out from the button's centre, fixed-positioned so a card
// with `overflow:hidden` can't clip them. Self-removing after the transition.
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
        h.setAttribute('style', `position:fixed;left:${rect.left + rect.width / 2}px;top:${rect.top + rect.height / 2}px;font-size:${9 + Math.random() * 7}px;color:#f43f5e;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:transform 0.6s ease-out,opacity 0.6s ease-out;will-change:transform,opacity;`);
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

// Wires every `.tile-like-area` on the page. Safe to call when there are none.
// The liked flag is client-only (`liked_<id>` in localStorage) — the backend
// counts likes but doesn't know who pressed them.
export function initPostLikes() {
    const API_URL = document.querySelector<HTMLElement>('main[data-api-url]')?.dataset.apiUrl || '';

    document.querySelectorAll<HTMLElement>('.tile-like-area').forEach(el => {
        const postId = el.dataset.id;
        const icon = el.querySelector<HTMLElement>('.tile-like-icon');
        const countEl = el.querySelector<HTMLElement>('.tile-like-count');
        const likedKey = `liked_${postId}`;
        let liked = localStorage.getItem(likedKey) === '1';
        let pending = false;

        function applyLiked(state: boolean) {
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

        applyLiked(liked);

        el.addEventListener('click', (e) => {
            // The button sits inside the card's link — swallow the navigation.
            e.preventDefault();
            e.stopPropagation();
            if (pending) return;
            // Marks this tile as user-touched so a later stats refresh won't
            // overwrite the optimistic count (see refreshPostStats).
            el.dataset.userInteracted = '1';
            const nextLiked = !liked;
            if (nextLiked) {
                burstHearts(el);
                if (icon) pulseIcon(icon);
            }
            const endpoint = liked ? 'unlike' : 'like';
            pending = true;
            el.setAttribute('aria-busy', 'true');
            fetch(`${API_URL}/posts/${postId}/${endpoint}`, { method: 'POST', cache: 'no-store' })
                .then(r => r.ok ? r.json() : Promise.reject(new Error(`like ${r.status}`)))
                .then(d => {
                    if (d.likes != null && countEl) countEl.textContent = String(d.likes);
                    applyLiked(nextLiked);
                    localStorage.setItem(likedKey, nextLiked ? '1' : '0');
                    invalidatePostStatsCache();
                    refreshPostStats();
                })
                .catch(() => {})
                .finally(() => {
                    pending = false;
                    el.removeAttribute('aria-busy');
                });
        });
    });
}
