const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Incremented on every navigation so an older correction can never override a newer one. */
let navigation = 0;

/**
 * Smoothly scrolls to a section (native scrolling — no hijacking) and moves
 * keyboard focus there so assistive tech follows the navigation.
 */
export function scrollToSection(target: string | HTMLElement, { focus = true }: { focus?: boolean } = {}) {
  const el = typeof target === 'string' ? document.getElementById(target.replace(/^#/, '')) : target;
  if (!el) return;
  const smooth = !prefersReducedMotion();
  const id = ++navigation;
  const intended = destinationOf(el);
  el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  if (smooth) reaimWhenSettled(el, id, intended);
  if (focus) {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
}

/** Scroll position that puts `el` at the top (scroll-padding + scroll-margin, like the browser), clamped to the page. */
function destinationOf(el: HTMLElement): number {
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return Math.max(0, Math.min(max, window.scrollY + el.getBoundingClientRect().top - padding - margin));
}

/**
 * Content that grows while a smooth scroll is under way (live demos, late data)
 * can move the target. Once our scroll settles, re-aim once — but only if it
 * ended exactly where it was headed (so the visitor didn't take over with the
 * wheel, touch, keys or the scrollbar), the target has actually moved, and no
 * newer navigation has started since.
 */
function reaimWhenSettled(el: HTMLElement, id: number, intended: number) {
  let cancelled = false;
  const cancel = () => (cancelled = true);
  const inputs = ['wheel', 'touchstart', 'keydown'] as const;
  inputs.forEach((name) => window.addEventListener(name, cancel, { passive: true, once: true }));
  const cleanup = () => inputs.forEach((name) => window.removeEventListener(name, cancel));

  const startY = window.scrollY;
  let lastY = startY;
  let still = 0;
  let frames = 0;
  let moved = false;
  const check = () => {
    if (cancelled || id !== navigation) return cleanup();
    const y = window.scrollY;
    if (Math.abs(y - startY) > 1) moved = true;
    still = Math.abs(y - lastY) < 0.5 ? still + 1 : 0;
    lastY = y;
    // Settled: it travelled and has now been still for ~8 frames (or never needed to move).
    if ((moved && still >= 8) || (!moved && frames > 30)) {
      cleanup();
      const endedWhereHeaded = Math.abs(y - intended) <= 2;
      if (endedWhereHeaded && Math.abs(destinationOf(el) - y) > 4) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (++frames < 360) requestAnimationFrame(check);
    else cleanup();
  };
  requestAnimationFrame(check);
}

export function scrollToTop() {
  navigation += 1;
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}
