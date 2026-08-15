// Click-to-play facade for the /videos Shorts rail: each card renders as a
// plain vertical thumbnail and the YouTube iframe is only created on click, so
// the page loads with zero third-party embeds (same link-out-weight model as
// the rest of the page, until the visitor opts in). The play overlay is the
// card's one <button>; the iframe is appended to the media region as its
// sibling and the button removed, so interactive content is never nested
// inside a button (a11y). The iframe is styled inline because Astro scoped CSS
// never matches JS-created elements.
export function initShortsEmbed(): void {
  const cards = document.querySelectorAll<HTMLElement>("[data-short-embed]");
  cards.forEach((card) => {
    const play = card.querySelector<HTMLButtonElement>(".short-card-play");
    const media = card.querySelector<HTMLElement>("[data-short-media]");
    if (!play || !media) return;
    // The oar2.jpg vertical thumb can be missing/CORP-blocked on some YouTube
    // CDN edges for freshly uploaded Shorts. Fall back to frame0.jpg (always
    // generated, vertical, lower-res). The img may have already failed before
    // this module ran, so check complete+naturalWidth too, not just onerror.
    const img = media.querySelector<HTMLImageElement>("img");
    const imgId = card.dataset.shortEmbed;
    if (img && imgId) {
      const fallback = () => {
        if (img.dataset.fallback) return;
        img.dataset.fallback = "1";
        img.src = `https://i.ytimg.com/vi/${imgId}/frame0.jpg`;
      };
      img.addEventListener("error", fallback);
      if (img.complete && img.naturalWidth === 0) fallback();
    }
    play.addEventListener("click", () => {
      if (card.dataset.playing) return;
      const id = card.dataset.shortEmbed;
      if (!id) return;
      card.dataset.playing = "1";
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;
      iframe.title = card.dataset.shortTitle || "YouTube Short";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;border:0;z-index:3;";
      media.appendChild(iframe);
      play.remove();
      iframe.focus();
    });
  });
}
