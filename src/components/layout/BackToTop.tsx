import { useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { scrollToSection } from '../../lib/scroll';
import './BackToTop.css';

/** Floating return-to-top control with a scroll-progress ring. */
export function BackToTop() {
  const { scrollY, scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => {
    const nearBottom = y + window.innerHeight > document.documentElement.scrollHeight - 220;
    setVisible(y > window.innerHeight * 1.2 && !nearBottom);
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          className="vx-top"
          onClick={() => scrollToSection('top')}
          aria-label="Back to top"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          data-cursor="link"
        >
          <svg className="vx-top__ring" viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="24" className="vx-top__track" />
            <motion.circle cx="26" cy="26" r="24" className="vx-top__value" style={{ pathLength: scrollYProgress }} />
          </svg>
          <ArrowUp size={17} aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
