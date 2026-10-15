import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { EASE_OUT } from '../../lib/motion';
import { cn } from '../../lib/cn';
import './SectionHeader.css';

interface SectionHeaderProps {
  index: string;
  label: string;
  title: ReactNode;
  /** Plain-text version of the title for assistive tech when `title` contains markup. */
  titleId: string;
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
}

/** Editorial section heading: index + label eyebrow, oversized title, optional lede & aside. */
export function SectionHeader({ index, label, title, titleId, children, aside, className }: SectionHeaderProps) {
  return (
    <header className={cn('vx-sh', className)}>
      <motion.div
        className="vx-sh__meta"
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.8, ease: EASE_OUT }}
      >
        <span className="vx-eyebrow">
          <span className="vx-eyebrow__index">({index})</span>
          <span className="vx-sh__rule" aria-hidden="true" />
          {label}
        </span>
      </motion.div>
      <div className="vx-sh__grid">
        <motion.h2
          id={titleId}
          className="vx-h2 vx-sh__title"
          initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.1, ease: EASE_OUT }}
        >
          {title}
        </motion.h2>
        {(children || aside) && (
          <motion.div
            className="vx-sh__side"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1, ease: EASE_OUT, delay: 0.15 }}
          >
            {children && <div className="vx-lede">{children}</div>}
            {aside}
          </motion.div>
        )}
      </div>
    </header>
  );
}
