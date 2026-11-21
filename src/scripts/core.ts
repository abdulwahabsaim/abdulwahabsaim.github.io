/**
 * Shared motion core: one GSAP + ScrollTrigger + Lenis instance per page.
 * Lenis is desktop-wheel smoothing only; touch keeps native scrolling.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { motion } from '../config/motion';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

let lenis: Lenis | null = null;
/** Edge latch for [data-scroll-inner] areas: the gesture that scrolled them can't spill onto the page. */
const edge = { last: 0, latched: false };
let started = false;

export const getLenis = () => lenis;

const navOffset = () => {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--nav-h');
  return (parseFloat(v) || 64) + 20;
};

export function scrollToTarget(target: Element | number, hash?: string) {
  if (lenis) {
    // Lenis already honours html { scroll-padding-top }, so no extra offset here.
    lenis.scrollTo(target as HTMLElement, { duration: motion.scroll.anchorDuration });
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: prefersReduced() ? 'auto' : 'smooth' });
  } else {
    const top = target.getBoundingClientRect().top + window.scrollY - navOffset();
    window.scrollTo({ top, behavior: prefersReduced() ? 'auto' : 'smooth' });
  }
  if (hash) history.pushState(null, '', hash);
  if (target instanceof HTMLElement) {
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
}

export function lockScroll(lock: boolean) {
  if (lenis) (lock ? lenis.stop() : lenis.start());
  document.documentElement.style.overflow = lock ? 'hidden' : '';
}

function initReveal() {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!('IntersectionObserver' in window) || prefersReduced()) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    // threshold 0 so elements pinned to the very bottom of the page (footer wordmark) still reveal.
    { rootMargin: '0px 0px -6% 0px', threshold: 0 },
  );
  els.forEach((el) => io.observe(el));
}

/** Position dots for phone rails ([data-rail]). */
function initRails() {
  document.querySelectorAll<HTMLElement>('[data-rail]').forEach((rail) => {
    const items = [...rail.children] as HTMLElement[];
    if (items.length < 2 || rail.nextElementSibling?.classList.contains('rail-dots')) return;
    const dots = document.createElement('div');
    dots.className = 'rail-dots';
    dots.setAttribute('aria-hidden', 'true');
    dots.innerHTML = items.map(() => '<span></span>').join('');
    rail.after(dots);
    const marks = [...dots.children];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = items.indexOf(e.target as HTMLElement);
            marks.forEach((m, k) => m.classList.toggle('is-on', k === i));
          }
        });
      },
      { root: rail, threshold: 0.6 },
    );
    items.forEach((it) => io.observe(it));
    marks[0]?.classList.add('is-on');
  });
}

function initAnchors() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!a || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.pathname.replace(/\/$/, '') !== location.pathname.replace(/\/$/, '') || !url.hash) return;
    const target = url.hash === '#top' ? 0 : document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (target === null) return;
    e.preventDefault();
    scrollToTarget(target, url.hash);
  });
}

export function startMotion() {
  if (started) return;
  started = true;
  if (!prefersReduced()) {
    lenis = new Lenis({
      lerp: motion.scroll.lerp,
      smoothWheel: true,
      wheelMultiplier: motion.scroll.wheelMultiplier,
      // Sideways scrollers ([data-hscroll]): hand only clearly horizontal gestures to the browser.
      // A blanket opt-out made fast vertical flicks with a little sideways drift fight Lenis.
      virtualScroll: ({ deltaX, deltaY, event }) => {
        // Inner scroll areas ([data-scroll-inner], e.g. the terminal) scroll natively while they
        // can move in that direction; at their top or bottom the page takes over smoothly.
        const inner = (event.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-scroll-inner]');
        if (inner && Math.abs(deltaY) > Math.abs(deltaX)) {
          const now = performance.now();
          // A pause between wheel events ends a gesture (trackpad inertia keeps the stream going).
          const newGesture = now - edge.last > motion.scroll.innerGestureGap;
          edge.last = now;
          if (newGesture) edge.latched = false;
          const canDown = inner.scrollTop + inner.clientHeight < inner.scrollHeight - 1;
          const canUp = inner.scrollTop > 0;
          if ((deltaY > 0 && canDown) || (deltaY < 0 && canUp)) {
            edge.latched = true; // this gesture belongs to the inner area
            return false;
          }
          if (edge.latched) {
            // Reached the edge mid-gesture: stop here. The next, separate scroll moves the page.
            if (event.cancelable) event.preventDefault();
            return false;
          }
          return true;
        }
        if (Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return true;
        const el = (event.target as HTMLElement | null)?.closest?.('[data-hscroll]');
        return !(el && el.scrollWidth > el.clientWidth);
      },
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis?.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  initAnchors();
  initReveal();
  initRails();

  // Arriving on /#labs from another page: land after layout settles.
  if (location.hash.length > 1) {
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) requestAnimationFrame(() => setTimeout(() => scrollToTarget(el), 60));
  }

  // Fonts and images change layout; keep ScrollTrigger measurements honest.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
