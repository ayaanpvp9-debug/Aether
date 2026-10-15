import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { EASE_OUT } from '../../lib/motion';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  amount?: number;
  as?: 'div' | 'li' | 'section' | 'article' | 'p';
}

const TAGS = { div: motion.div, li: motion.li, section: motion.section, article: motion.article, p: motion.p };

/** Fade-and-rise entrance when the element scrolls into view (once). */
export function Reveal({ children, className, delay = 0, y = 32, amount = 0.2, as = 'div' }: RevealProps) {
  const Component = TAGS[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 1, ease: EASE_OUT, delay }}
    >
      {children}
    </Component>
  );
}
