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
  {
    title: "LeetCode 11. Container With Most Water in Dart — two pointers, O(n)",
    href: "https://www.youtube.com/watch?v=xITEoY8xXUc",
    img: "https://i.ytimg.com/vi/xITEoY8xXUc/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 209. Minimum Size Subarray Sum in Dart — sliding window, O(n)",
    href: "https://www.youtube.com/watch?v=rS18KO-ovGY",
    img: "https://i.ytimg.com/vi/rS18KO-ovGY/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 1004. Max Consecutive Ones III in Dart — sliding window, O(n)",
    href: "https://www.youtube.com/watch?v=-_8RO-3EASo",
    img: "https://i.ytimg.com/vi/-_8RO-3EASo/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 34. Find First and Last Position of Element in Sorted Array in Dart — O(log n)",
    href: "https://www.youtube.com/watch?v=99AHRlM_tBk",
    img: "https://i.ytimg.com/vi/99AHRlM_tBk/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 3. Longest Substring Without Repeating Characters in Dart — sliding window, O(n)",
    href: "https://www.youtube.com/watch?v=xDI4Tv-LT6k",
    img: "https://i.ytimg.com/vi/xDI4Tv-LT6k/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 424. Longest Repeating Character Replacement in Dart — sliding window, O(n)",
    href: "https://www.youtube.com/watch?v=pQL00WjO_CY",
    img: "https://i.ytimg.com/vi/pQL00WjO_CY/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 1493. Longest Subarray of 1's After Deleting One Element in Dart — O(n)",
    href: "https://www.youtube.com/watch?v=-zXqnQWBLiY",
    img: "https://i.ytimg.com/vi/-zXqnQWBLiY/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 42. Trapping Rain Water in Dart — O(n)",
    href: "https://www.youtube.com/watch?v=UAfL7DUaWfY",
    img: "https://i.ytimg.com/vi/UAfL7DUaWfY/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 76. Minimum Window Substring in Dart — O(n + m)",
    href: "https://www.youtube.com/watch?v=GM1HyK7MFVA",
    img: "https://i.ytimg.com/vi/GM1HyK7MFVA/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 15. 3Sum in Dart — O(n²)",
    href: "https://www.youtube.com/watch?v=dYTyL4KazXo",
    img: "https://i.ytimg.com/vi/dYTyL4KazXo/maxresdefault.jpg",
    platform: "YouTube",
    host: "youtube.com",
    tag: "Coding",
  },
  {
    title: "LeetCode 20. Valid Parentheses in Dart — 3 stack solutions",
    href: "https://www.youtube.com/watch?v=iyMeDlUTmVY",
    img: "https://i.ytimg.com/vi/iyMeDlUTmVY/maxresdefault.jpg",
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

// Shorts catalog — vertical (9:16) clips, kept separate from VIDEOS so the
// homepage SCREENING ROOM band (which slices VIDEOS) is unaffected. Same
// convention: upload order oldest → newest, append new entries at the END.
// `id` is the bare YouTube video id — /videos builds both the thumbnail
// (i.ytimg.com …/oar2.jpg, the 1080×1920 vertical thumb) and the click-to-play
// embed URL from it.
export const SHORTS = [
  {
    id: "PR1Bdf8Uhl4",
    title: "[1,1,1] answers 2, not 3 — LeetCode 1493 in Dart",
  },
  {
    id: "8-SK0PtJ2bE",
    title: "LeetCode 209: 1196 ms vs under 1 ms — sliding window in Dart",
  },
  {
    id: "Za4OoUKrpqs",
    title: "The wall is the pointer — LeetCode 42 in Dart",
  },
  {
    id: "d3UHNQxsKlY",
    title: "MATCH counts filled slots, not letters — LeetCode 76 in Dart",
  },
  {
    id: "mYvKW-IA5uw",
    title: "Sorting is the deduplication, not the speed-up — LeetCode 15 in Dart",
  },
  {
    id: "dgIHuDAIWJ4",
    title: "Match brackets by subtracting them — LeetCode 20 in Dart",
  },
  {
    id: "UTyW52Ut3cM",
    title: "The two tallest lines are a decoy — LeetCode 11 in Dart",
  },
  {
    id: "YvHnScHsawo",
    title: "It passes all three examples LeetCode prints — LeetCode 3 in Dart",
  },
  {
    id: "pVDij37hyv0",
    title: "The maximum is allowed to be wrong — LeetCode 424 in Dart",
  },
  {
    id: "cKTuVFZmaCA",
    title: "Nothing is ever flipped — LeetCode 1004 in Dart",
  },
  {
    id: "ycvC7guVhTY",
    title: "A match is not an answer — LeetCode 34 in Dart",
  },
  {
    id: "OLcpqWQw_z0",
    title: "Ask first, write after — LeetCode 1 in Dart",
  },
  {
    id: "2F5MMqGJNgA",
    title: "The map vanishes when the shelf is sorted — LeetCode 167 in Dart",
  },
  {
    id: "VAvQAnJCyPM",
    title: "Some steps compare nothing at all — LeetCode 125 in Dart",
  },
  {
    id: "YDRZrLS6H6k",
    title: "The tallest day is worth almost nothing — LeetCode 121 in Dart",
  },
  {
    id: "MjyaRCYI-g0",
    title: "Written twice, divided never — LeetCode 238 in Dart",
  },
] as const;

export const SHORTS_NEWEST_FIRST = [...SHORTS].reverse();

export type Short = (typeof SHORTS)[number];
