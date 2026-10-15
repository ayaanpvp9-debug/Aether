import { createStore, useStore } from './store';

const STORAGE_KEY = 'veltrix:motion-paused';

function readInitial(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function reflect(paused: boolean) {
  if (typeof document !== 'undefined') document.documentElement.toggleAttribute('data-motion-paused', paused);
}

/**
 * Site-wide "pause moving content" switch (WCAG 2.2.2). Looping, auto-moving
 * content — the hero type, the conveyor, the marquee band, testimonial autoplay
 * — stops while it is on. The choice persists, and `html[data-motion-paused]`
 * lets CSS-only loops follow along without any React work.
 */
const store = createStore<boolean>(readInitial());
reflect(store.get());

export function setMotionPaused(paused: boolean) {
  store.set(paused);
  reflect(paused);
  try {
    if (paused) window.localStorage.setItem(STORAGE_KEY, '1');
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode / sandboxed frames) — the switch still works for this visit.
  }
}

export const useMotionPaused = () => useStore(store);
