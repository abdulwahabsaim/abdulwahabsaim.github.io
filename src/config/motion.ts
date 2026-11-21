/**
 * Every tunable motion and interaction number lives here.
 * Change a value once and every component that uses it follows.
 * Visual tokens (colours, radii, spacing, easing curves for CSS) live in src/styles/tokens.css.
 */
export const motion = {
  /** Lenis smooth scrolling (desktop wheel only). Lower lerp = smoother and slower. */
  // innerGestureGap: ms without wheel events that ends a gesture inside a scroll area (terminal).
  scroll: { lerp: 0.1, wheelMultiplier: 1, anchorDuration: 1.25, innerGestureGap: 220 },

  /** Hero tunnel (codesval-style fly-through of lab topologies). */
  tunnel: {
    depth: 3400, // how far back the furthest card starts (px in 3D space)
    near: 620, // cards fade out once they get this close to the camera
    startBack: 280, // resting depth on page load: higher = the tunnel starts further away and calmer
    perspective: 1000, // keep in sync with .tunnel perspective in Hero.astro
    cardsDesktop: 18,
    cardsMobile: 12,
    radiusX: { desktop: 0.41, mobile: 0.36 }, // ring radius as a share of the viewport
    radiusY: { desktop: 0.37, mobile: 0.37 },
    introDuration: 2.2, // seconds for the entrance rush
    scrollLength: { desktop: 290, mobile: 190 }, // hero height in vh while the tunnel runs (more = slower flight)
    parallax: 10, // % the vanishing point follows the mouse
  },

  /** Dotted topology background (ujjwal-style). */
  dots: {
    gap: { desktop: 26, mobile: 22 },
    radius: 170, // pointer influence radius in px
    linkLength: 120, // max length of a link line from the pointer to a dot
    links: 5, // how many dots link to the pointer
    push: 7, // how far dots are pushed away from the pointer
    rippleSpeed: 0.55, // px per ms for the click "ping"
    rippleLife: 1400, // ms
  },

  /** Custom cursor. */
  cursor: { ringEase: 0.2 },

  /** Sticky stacked project cards. */
  stack: { scaleTo: 0.92, dimTo: 0.35, topOffset: 96, peek: 14 },

  /** Sound effects (Web Audio, synthesized). */
  sound: { master: 0.55, tickThrottle: 55 },

  /** Terminal (saim-shell) pacing, in ms. */
  terminal: { lineDelay: 30, typeDelay: 80, afterType: 220 },
} as const;
