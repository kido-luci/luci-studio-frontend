// Shared videos catalog — the single source of truth for the studio's off-site
// video content (YouTube for now). Rendered by /videos (VideosPage grid) and the
// homepage SCREENING ROOM band; add new entries here and both surfaces pick them
// up. The `platform` field keeps the card shape reusable if other platforms join
// later. (Extracted verbatim from VideosPage.astro when the homepage band landed.)
//
// Order is oldest → newest (upload order): the Faldrop gameplay reel leads, then
// the LeetCode-in-Dart solution series in the order it was published.
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
  {
    title: "LeetCode 222. Count Complete Tree Nodes in Dart — O(log²n)",
    href: "https://www.youtube.com/watch?v=Sx2u1h5uyos",
    img: "https://i.ytimg.com/vi/Sx2u1h5uyos/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 1. Two Sum in Dart — hash map, O(n)",
    href: "https://www.youtube.com/watch?v=iSkKsliNug8",
    img: "https://i.ytimg.com/vi/iSkKsliNug8/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 104. Maximum Depth of Binary Tree in Dart — O(n)",
    href: "https://www.youtube.com/watch?v=WLJOL2Mpsdo",
    img: "https://i.ytimg.com/vi/WLJOL2Mpsdo/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 49. Group Anagrams in Dart — O(n·k)",
    href: "https://www.youtube.com/watch?v=00o3XwLG4Gg",
    img: "https://i.ytimg.com/vi/00o3XwLG4Gg/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 347. Top K Frequent Elements in Dart — bucket sort, O(n)",
    href: "https://www.youtube.com/watch?v=XTTn_Xh9t24",
    img: "https://i.ytimg.com/vi/XTTn_Xh9t24/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 110. Balanced Binary Tree in Dart — O(n)",
    href: "https://www.youtube.com/watch?v=AQrJQnqBq2o",
    img: "https://i.ytimg.com/vi/AQrJQnqBq2o/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 238. Product of Array Except Self in Dart — O(n)",
    href: "https://www.youtube.com/watch?v=tC_HI3pFehw",
    img: "https://i.ytimg.com/vi/tC_HI3pFehw/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 167. Two Sum II - Input Array Is Sorted in Dart — O(n)",
    href: "https://www.youtube.com/watch?v=RoGdyIeBiVo",
    img: "https://i.ytimg.com/vi/RoGdyIeBiVo/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 125. Valid Palindrome in Dart — O(n)",
    href: "https://www.youtube.com/watch?v=NrKglOriGHg",
    img: "https://i.ytimg.com/vi/NrKglOriGHg/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 121. Best Time to Buy and Sell Stock in Dart — O(n)",
    href: "https://www.youtube.com/watch?v=h01rHJNg6KA",
    img: "https://i.ytimg.com/vi/h01rHJNg6KA/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
] as const;

// Both surfaces show newest first, so they share one reversal instead of each
// calling .reverse() and drifting apart. Keep appending new entries at the END
// of VIDEOS above (upload order) and render from this.
export const VIDEOS_NEWEST_FIRST = [...VIDEOS].reverse();

export type Video = (typeof VIDEOS)[number];
