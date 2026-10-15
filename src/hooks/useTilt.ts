import { useEffect, useRef } from 'react';
import { useFinePointer, usePrefersReducedMotion } from './useMediaQuery';

/**
 * Pointer-reactive 3D tilt + light position, written straight to CSS custom
 * properties (no React re-renders). Consumers read --rx, --ry, --mx, --my.
 */
export function useTilt<T extends HTMLElement>({ max = 7 }: { max?: number } = {}) {
  const ref = useRef<T>(null);
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !fine) return;
    let frame = 0;
    let px = 0.5;
    let py = 0.5;
    const tilt = reduced ? 0 : max;

    const apply = () => {
      frame = 0;
      el.style.setProperty('--rx', `${((0.5 - py) * tilt).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${((px - 0.5) * tilt).toFixed(2)}deg`);
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      px = (event.clientX - rect.left) / rect.width;
      py = (event.clientY - rect.top) / rect.height;
      el.dataset.tilting = 'true';
      schedule();
    };
    const onLeave = () => {
      px = 0.5;
      py = 0.5;
      delete el.dataset.tilting;
      schedule();
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(frame);
    };
  }, [fine, reduced, max]);

  return ref;
}
