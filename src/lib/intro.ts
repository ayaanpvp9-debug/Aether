export const INTRO_STORAGE_KEY = 'veltrix:intro-seen';

/** Whether the intro should play: once per session, never with reduced motion. */
export function shouldPlayIntro(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return window.sessionStorage.getItem(INTRO_STORAGE_KEY) !== '1';
  } catch {
    return true;
  }
}
