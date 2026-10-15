import { motion } from 'motion/react';
import { EASE_IN_OUT } from '../../lib/motion';

/** Hairline that draws itself across the container when scrolled into view. */
export function Divider({ className }: { className?: string }) {
  return (
    <motion.div
      className={className ? `vx-hairline ${className}` : 'vx-hairline'}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 1 }}
      transition={{ duration: 1.4, ease: EASE_IN_OUT }}
      aria-hidden="true"
    />
  );
}
