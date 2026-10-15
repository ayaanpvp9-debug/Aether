import { useEffect, useRef } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'motion/react';
import { EASE_EXPO } from '../../lib/motion';

interface CounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

/** Number that counts up when it enters the viewport and re-animates when `value` changes. */
export function Counter({ value, decimals = 0, prefix = '', suffix = '', duration = 1.6, className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -12% 0px' });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) =>
    `${prefix}${v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`,
  );

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, { duration, ease: EASE_EXPO });
    return () => controls.stop();
  }, [inView, value, duration, mv]);

  return (
    <motion.span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {text}
    </motion.span>
  );
}
