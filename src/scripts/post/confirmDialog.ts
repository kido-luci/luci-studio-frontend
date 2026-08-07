// Themed confirm dialog — a promise-returning replacement for window.confirm,
// styled with the blueprint tokens. Used by the comment thread for signing out
// and for recalling a comment.
//
// Split out of the old postEngagementComments module.
export function showConfirm({ message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }: {
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}) {
  return new Promise<boolean>(resolve => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);opacity:0;transition:opacity 0.2s ease;';

    const box = document.createElement('div');
    // Modal contract: alertdialog (not dialog) because this interrupts to ask a
    // question, and aria-modal so assistive tech treats the rest of the page as
    // inert while it is open.
    box.setAttribute('role', 'alertdialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', message);
    box.style.cssText = 'background:var(--bp-panel);border:1px solid var(--bp-hair);border-radius:14px;padding:1.5rem;width:100%;max-width:22rem;box-shadow:0 24px 64px rgba(0,0,0,0.5);transform:scale(0.95) translateY(8px);transition:transform 0.2s ease,opacity 0.2s ease;opacity:0;';

    box.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
        <div style="width:2rem;height:2rem;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${danger ? 'rgba(239,68,68,0.12)' : 'rgb(var(--accent-rgb) / 0.12)'};">
          ${danger
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" style="stroke:var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
          }
        </div>
        <p style="font-size:0.9rem;color:var(--bp-ink);font-weight:500;margin:0;line-height:1.4;">${message}</p>
      </div>
      <div style="display:flex;gap:0.5rem;justify-content:flex-end;">
        <button id="confirm-cancel" style="padding:0.5rem 1.1rem;border-radius:8px;font-family:var(--bp-mono);font-size:0.68rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;background:transparent;border:1px solid var(--bp-hair);color:var(--bp-muted);cursor:pointer;transition:background 0.15s,color 0.15s;" onmouseover="this.style.background='color-mix(in srgb, var(--bp-ink) 6%, transparent)'" onmouseout="this.style.background='transparent'">${cancelText}</button>
        <button id="confirm-ok" style="padding:0.5rem 1.1rem;border-radius:8px;font-family:var(--bp-mono);font-size:0.68rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;border:none;cursor:pointer;transition:filter 0.2s;background:${danger ? '#ef4444' : 'var(--bp-acc)'};color:${danger ? '#fff' : 'var(--accent-ink)'};" onmouseover="this.style.filter='brightness(1.08)'" onmouseout="this.style.filter='none'">${confirmText}</button>
      </div>
    `;

    overlay.appendChild(box);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.appendChild(overlay);

    const okBtn = box.querySelector<HTMLButtonElement>('#confirm-ok');
    const cancelBtn = box.querySelector<HTMLButtonElement>('#confirm-cancel');
    // Open on the non-destructive action, so a reflexive Enter or Space cancels
    // rather than confirms.
    cancelBtn?.focus();

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      box.style.opacity = '1';
      box.style.transform = 'scale(1) translateY(0)';
    });

    function close(result: boolean) {
      // Every close path runs through here, which is the only place the document
      // listener is removed — closing by button or backdrop used to leave it
      // attached, leaking one listener per dialog for the life of the page.
      document.removeEventListener('keydown', onKeydown);
      overlay.style.opacity = '0';
      box.style.opacity = '0';
      box.style.transform = 'scale(0.95) translateY(8px)';
      setTimeout(() => overlay.remove(), 200);
      previouslyFocused?.focus();
      resolve(result);
    }

    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); close(false); return; }
      // Enter is deliberately NOT handled here. Both actions are <button>s, so
      // the browser already activates whichever one has focus — Enter on Cancel
      // cancels, Enter on Confirm confirms. Handling it at the document level
      // instead would override the focused button: it used to resolve true even
      // while Cancel held focus, and (before that) it confirmed destructive
      // dialogs outright. Since focus opens on Cancel, confirming always takes a
      // deliberate Tab or click.
      if (e.key === 'Tab' && okBtn && cancelBtn) {
        // Keep Tab inside the dialog — with two buttons the trap is just a swap.
        e.preventDefault();
        (document.activeElement === cancelBtn ? okBtn : cancelBtn).focus();
      }
    }

    okBtn?.addEventListener('click', () => close(true));
    cancelBtn?.addEventListener('click', () => close(false));
    overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
    document.addEventListener('keydown', onKeydown);
  });
}
