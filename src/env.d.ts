/// <reference types="astro/client" />

// Globals that come from <script> tags, not npm. GSAP, its plugins and Lenis
// load from jsDelivr (Layout.astro, HomePage.astro) and are typed loosely; each
// is missing until its deferred script has run, so every use polls for it with
// whenReady first. toggleTheme and setScheme are set by scripts/layout/theme.ts
// for the nav's theme toggle and scheme picker.
interface Window {
    gsap?: any;
    ScrollTrigger?: any;
    SplitText?: any;
    ScrambleTextPlugin?: any;
    Lenis?: any;
    toggleTheme?: () => void;
    setScheme?: (name: string) => void;
}
