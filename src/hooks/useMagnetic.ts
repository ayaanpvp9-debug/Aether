import { useCallback, useRef } from 'react';
import { useSpring, type MotionValue } from 'motion/react';
import { useFinePointer } from './useMediaQuery';

interface Magnetic<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  innerX: MotionValue<number>;
  innerY: MotionValue<number>;
  onPointerMove: (event: React.PointerEvent<T>) => void;
  onPointerLeave: () => void;
}

/**
 * Magnetic pull towards the pointer. The shell and its inner label move by
 * different amounts which creates a subtle layered parallax.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.32, enabled = true): Magnetic<T> {
  const ref = useRef<T>(null);
  const fine = useFinePointer();
  const active = enabled && fine;

  const config = { stiffness: 260, damping: 18, mass: 0.35 };
  const x = useSpring(0, config);
  const y = useSpring(0, config);
  const innerX = useSpring(0, config);
  const innerY = useSpring(0, config);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<T>) => {
      const el = ref.current;
      if (!active || !el) return;
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      x.set(dx * strength);
      y.set(dy * strength);
      innerX.set(dx * strength * 0.45);
      innerY.set(dy * strength * 0.45);
    },
    [active, strength, x, y, innerX, innerY],
  );

  const onPointerLeave = useCallback(() => {
    x.set(0);
    y.set(0);
    innerX.set(0);
    innerY.set(0);
  }, [x, y, innerX, innerY]);

  return { ref, x, y, innerX, innerY, onPointerMove, onPointerLeave };
}
