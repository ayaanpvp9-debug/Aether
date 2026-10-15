import { useEffect, useRef } from 'react';
import { useFinePointer, usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import './Cursor.css';

const INTERACTIVE = 'a, button, [role="button"], [role="tab"], [role="switch"], [role="radio"], [role="option"], [role="combobox"], label, summary, input[type="range"]';

function CursorImpl() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!root || !ring || !dot || !label) return;

    document.documentElement.classList.add('has-custom-cursor');
    const target = { x: -100, y: -100 };
    const current = { x: -100, y: -100 };
    let raf = 0;
    let last = 0;
    let visible = false;

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      // Frame-rate independent interpolation — the ring trails the dot.
      const t = 1 - Math.exp(-18 * dt);
      current.x += (target.x - current.x) * t;
      current.y += (target.y - current.y) * t;
      ring.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      if (Math.abs(target.x - current.x) + Math.abs(target.y - current.y) > 0.1) {
        raf = requestAnimationFrame(render);
      } else {
        raf = 0;
        last = 0;
      }
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      target.x = event.clientX;
      target.y = event.clientY;
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      if (!visible) {
        visible = true;
        current.x = target.x;
        current.y = target.y;
        root.dataset.visible = 'true';
      }
      kick();
    };

    const onOver = (event: PointerEvent) => {
      const el = event.target as Element | null;
      if (!el || typeof el.closest !== 'function') return;
      if (el.closest('input:not([type="range"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]')) {
        root.dataset.state = 'text';
        return;
      }
      const host = el.closest<HTMLElement>(`[data-cursor], ${INTERACTIVE}`);
      if (!host || host.closest('[aria-disabled="true"], :disabled')) {
        root.dataset.state = 'default';
        label.textContent = '';
        return;
      }
      const text = host.dataset.cursorLabel ?? '';
      const kind = host.dataset.cursor ?? 'link';
      label.textContent = text;
      root.dataset.state = text ? 'label' : kind === 'orb' ? 'orb' : 'link';
    };

    const onDown = () => (root.dataset.pressed = 'true');
    const onUp = () => delete root.dataset.pressed;
    const onWindowOut = (event: MouseEvent) => {
      if (!event.relatedTarget) {
        visible = false;
        root.dataset.visible = 'false';
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('mouseout', onWindowOut);

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseout', onWindowOut);
    };
  }, []);

  return (
    <div ref={rootRef} className="vx-cursor" data-visible="false" data-state="default" aria-hidden="true">
      <div ref={ringRef} className="vx-cursor__ring">
        <div className="vx-cursor__circle">
          <span ref={labelRef} className="vx-cursor__label" />
        </div>
      </div>
      <div ref={dotRef} className="vx-cursor__dot" />
    </div>
  );
}

/** Desktop-only interpolated cursor with contextual states. Disabled for touch and reduced motion. */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  if (!fine || reduced) return null;
  return <CursorImpl />;
}
