import { useEffect, useRef } from 'react';
import { isTopOverlay, popOverlay, pushOverlay } from '../lib/modal-stack';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible overlay behaviour: registers in the overlay stack (scroll lock +
 * inert page), traps Tab focus, closes on Escape, restores focus on close.
 */
interface OverlayOptions {
  /** Element to focus after closing (defaults to whatever was focused before opening). */
  restoreFocus?: () => HTMLElement | null | undefined;
}

export function useOverlay<T extends HTMLElement>(active: boolean, onClose: () => void, options: OverlayOptions = {}) {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);
  const restoreRef = useRef(options.restoreFocus);

  useEffect(() => {
    closeRef.current = onClose;
    restoreRef.current = options.restoreFocus;
  });

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    const id = pushOverlay();
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      node
        ? [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
            (el) => el.getAttribute('aria-hidden') !== 'true' && el.getClientRects().length > 0,
          )
        : [];

    const frame = requestAnimationFrame(() => {
      const target = node?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0] ?? node;
      target?.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTopOverlay(id)) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !node) return;
      const list = focusables();
      if (list.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }
      const first = list[0]!;
      const last = list[list.length - 1]!;
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !node.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !node.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      popOverlay(id);
      // Runs after the page is no longer inert, so any target can receive focus.
      const target = restoreRef.current?.() ?? previouslyFocused;
      target?.focus?.({ preventScroll: true });
    };
  }, [active]);

  return ref;
}
