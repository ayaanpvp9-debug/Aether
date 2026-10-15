import { useRef, type ReactNode } from 'react';
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from 'motion/react';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/cn';
import { useMotionPaused } from '../../lib/motion-pause';
import './Marquee.css';

interface MarqueeProps {
  children: ReactNode;
  /** Percent of one copy travelled per second. */
  speed?: number;
  direction?: 1 | -1;
  className?: string;
  /** Skews and accelerates with scroll velocity. */
  reactive?: boolean;
  label?: string;
}

/**
 * Seamless infinite marquee. Two identical halves translate between 0 and -50%;
 * speed reacts to scroll velocity and slows on hover. With reduced motion it
 * keeps travelling at a calmer pace without the scroll-driven skew/boost, and it
 * holds still while the site-wide "pause moving text" switch is on.
 */
export function Marquee({ children, speed = 2.2, direction = -1, className, reactive = true, label }: MarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { margin: '100px 0px' });
  const reduced = usePrefersReducedMotion();
  const paused = useMotionPaused();
  const reactiveMotion = reactive && !reduced;
  const baseX = useMotionValue(0);
  const hover = useRef(false);
  const hoverFactor = useRef(1);

  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(velocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [-2000, 0, 2000], [-4, 0, 4], { clamp: false });
  const skew = useTransform(smoothVelocity, [-2500, 0, 2500], [6, 0, -6]);

  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);
  const dirRef = useRef<number>(direction);

  useAnimationFrame((_, delta) => {
    if (!inView || paused) return;
    hoverFactor.current += ((hover.current ? 0.2 : 1) - hoverFactor.current) * Math.min(1, delta / 120);
    const vf = reactiveMotion ? velocityFactor.get() : 0;
    // Scrolling up reverses the travel direction; scroll speed adds momentum.
    if (vf < -0.05) dirRef.current = -direction;
    else if (vf > 0.05) dirRef.current = direction;
    const pace = reduced ? 0.5 : 1;
    const moveBy = dirRef.current * speed * pace * (delta / 1000) * hoverFactor.current * (1 + Math.abs(vf));
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div
      ref={rootRef}
      className={cn('vx-marquee', className)}
      onPointerEnter={() => (hover.current = true)}
      onPointerLeave={() => (hover.current = false)}
    >
      {label && <p className="sr-only">{label}</p>}
      <motion.div className="vx-marquee__track" style={{ x, skewX: reactiveMotion ? skew : 0 }} aria-hidden="true">
        <div className="vx-marquee__half">{children}</div>
        <div className="vx-marquee__half" aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
