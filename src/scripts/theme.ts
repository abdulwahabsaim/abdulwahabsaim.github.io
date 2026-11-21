/**
 * Theme switching with a circular View Transition wipe from the pointer (parthh.in style).
 * Falls back to an instant swap where View Transitions or motion are unavailable.
 */
export type Theme = 'light' | 'dark';

export const currentTheme = (): Theme =>
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

export function applyTheme(theme: Theme, persist = true) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#0b0b0c' : '#f3f3f4';
  if (persist) {
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }
  window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

export async function toggleTheme(x?: number, y?: number) {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => any };
  if (!doc.startViewTransition || reduced) {
    applyTheme(next);
    return;
  }
  const cx = x ?? window.innerWidth - 40;
  const cy = y ?? 40;
  const r = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));
  const root = document.documentElement;
  root.classList.add('theme-wipe');
  const vt = doc.startViewTransition(() => applyTheme(next));
  try {
    await vt.ready;
    root.animate(
      { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${r}px at ${cx}px ${cy}px)`] },
      { duration: 720, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
    );
    await vt.finished;
  } catch {}
  root.classList.remove('theme-wipe');
}

// Follow the OS setting until the visitor picks a theme.
const mq = window.matchMedia('(prefers-color-scheme: dark)');
mq.addEventListener?.('change', (e) => {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem('theme');
  } catch {}
  if (!stored) applyTheme(e.matches ? 'dark' : 'light', false);
});
