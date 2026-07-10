// Shared videos catalog — the single source of truth for the studio's off-site
// video content (YouTube for now). Rendered by /videos (VideosPage grid) and the
// homepage SCREENING ROOM band; add new entries here and both surfaces pick them
// up. The `platform` field keeps the card shape reusable if other platforms join
// later. (Extracted verbatim from VideosPage.astro when the homepage band landed.)
export const CHANNEL_URL = "https://www.youtube.com/@the-luci-studio";

export const VIDEOS = [
  {
    title: "Free 2.5D falling-block puzzle in your browser — Faldrop gameplay",
    href: "https://www.youtube.com/watch?v=40pVuVSa9b8",
    img: "https://i.ytimg.com/vi/40pVuVSa9b8/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Gameplay",
  },
  {
    title: "LeetCode 27. Remove Element in Dart — two pointers, O(n) / O(1)",
    href: "https://www.youtube.com/watch?v=o8rysXvbtqQ",
    img: "https://i.ytimg.com/vi/o8rysXvbtqQ/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
] as const;

export type Video = (typeof VIDEOS)[number];
