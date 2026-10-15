import { motion, type Variants } from 'motion/react';
import { cn } from '../../lib/cn';
import { EASE_EXPO } from '../../lib/motion';
import './TextReveal.css';

type Tag = 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';

interface TextRevealProps {
  text: string;
  as?: Tag;
  className?: string;
  /** Split granularity. */
  by?: 'chars' | 'words';
  delay?: number;
  stagger?: number;
  duration?: number;
  /** 'inView' animates when scrolled into view; otherwise controlled by `play`. */
  trigger?: 'inView' | 'controlled';
  play?: boolean;
  id?: string;
  /** Purely visual copy (e.g. when the parent already provides accessible text). */
  decorative?: boolean;
}

const MOTION_TAGS = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
  div: motion.div,
};

/**
 * Masked, staggered text reveal. Screen readers get the plain string from a
 * visually-hidden copy; the split glyphs are aria-hidden.
 */
export function TextReveal({
  text,
  as = 'span',
  className,
  by = 'words',
  delay = 0,
  stagger,
  duration = 1,
  trigger = 'inView',
  play = true,
  id,
  decorative = false,
}: TextRevealProps) {
  const Component = MOTION_TAGS[as];
  const step = stagger ?? (by === 'chars' ? 0.022 : 0.06);

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: step, delayChildren: delay } },
  };
  const item: Variants = {
    hidden: { y: '115%', rotate: by === 'chars' ? 8 : 4 },
    visible: { y: '0%', rotate: 0, transition: { duration, ease: EASE_EXPO } },
  };

  const words = text.split(' ');
  const inViewProps =
    trigger === 'inView'
      ? { initial: 'hidden' as const, whileInView: 'visible' as const, viewport: { once: true, amount: 0.4 } }
      : { initial: 'hidden' as const, animate: play ? ('visible' as const) : ('hidden' as const) };

  return (
    <Component id={id} className={cn('vx-reveal', className)} aria-hidden={decorative || undefined} variants={container} {...inViewProps}>
      {!decorative && <span className="sr-only">{text}</span>}
      {words.map((word, wi) => (
        <span className="vx-reveal__word" key={`${word}-${wi}`} aria-hidden="true">
          {by === 'chars' ? (
            [...word].map((char, ci) => (
              <span className="vx-reveal__mask" key={ci}>
                <motion.span className="vx-reveal__glyph" variants={item}>
                  {char}
                </motion.span>
              </span>
            ))
          ) : (
            <span className="vx-reveal__mask">
              <motion.span className="vx-reveal__glyph" variants={item}>
                {word}
              </motion.span>
            </span>
          )}
        </span>
      ))}
    </Component>
  );
}
