const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Smoothly scrolls to a section (native scrolling — no hijacking) and moves
 * keyboard focus there so assistive tech follows the navigation.
 */
export function scrollToSection(target: string | HTMLElement, { focus = true }: { focus?: boolean } = {}) {
  const el = typeof target === 'string' ? document.getElementById(target.replace(/^#/, '')) : target;
  if (!el) return;
  const smooth = !prefersReducedMotion();
  el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  if (smooth) reaimWhenSettled(el);
  if (focus) {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
}

/**
 * Content that grows while a smooth scroll is under way (live demos, late data)
 * can move the target. Once the scroll settles, re-aim once if it drifted —
 * unless the user has taken over with wheel, touch or keys.
 */
function reaimWhenSettled(el: HTMLElement) {
  let cancelled = false;
  const cancel = () => (cancelled = true);
  const inputs = ['wheel', 'touchstart', 'keydown'] as const;
  inputs.forEach((name) => window.addEventListener(name, cancel, { passive: true, once: true }));
  const cleanup = () => inputs.forEach((name) => window.removeEventListener(name, cancel));

  const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const startY = window.scrollY;
  let lastY = startY;
  let still = 0;
  let frames = 0;
  let moved = false;
  const check = () => {
    if (cancelled) return cleanup();
    const y = window.scrollY;
    if (Math.abs(y - startY) > 1) moved = true;
    still = Math.abs(y - lastY) < 0.5 ? still + 1 : 0;
    lastY = y;
    // Settled: it travelled and has now been still for ~8 frames (or never needed to move).
    if ((moved && still >= 8) || (!moved && frames > 30)) {
      cleanup();
      if (Math.abs(el.getBoundingClientRect().top - offset) > 4) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (++frames < 360) requestAnimationFrame(check);
    else cleanup();
  };
  requestAnimationFrame(check);
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}
