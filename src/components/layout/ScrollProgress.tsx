import { motion, useScroll, useSpring } from 'motion/react';
import './ScrollProgress.css';

/** Hairline reading-progress indicator pinned to the top edge. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return <motion.div className="vx-progress" style={{ scaleX }} aria-hidden="true" />;
}
