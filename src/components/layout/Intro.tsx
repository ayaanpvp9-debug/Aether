import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react';
import { EASE_IN_OUT, EASE_EXPO } from '../../lib/motion';
import { LogoMark } from '../ui/LogoMark';
import './Intro.css';

import { INTRO_STORAGE_KEY as STORAGE_KEY } from '../../lib/intro';
const DURATION = 1.25;

/**
 * ~1.3s movie-title intro. Any key, click, wheel or touch skips it instantly;
 * it never blocks the page beyond that.
 */
export function Intro({ onReveal }: { onReveal: () => void }) {
  const [visible, setVisible] = useState(true);
  const revealRef = useRef(onReveal);
  const count = useMotionValue(0);
  const countText = useTransform(count, (v) => String(Math.round(v)).padStart(3, '0'));

  useEffect(() => {
    revealRef.current = onReveal;
  }, [onReveal]);

  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      try {
        window.sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {
        // Storage may be unavailable (private mode / sandboxed frames).
      }
      setVisible(false);
      revealRef.current();
    };
    const controls = animate(count, 100, { duration: DURATION - 0.1, ease: [0.65, 0, 0.35, 1] });
    const timer = window.setTimeout(finish, DURATION * 1000);
    const skipEvents = ['keydown', 'pointerdown', 'wheel', 'touchmove'] as const;
    skipEvents.forEach((name) => window.addEventListener(name, finish, { passive: true }));
    return () => {
      controls.stop();
      window.clearTimeout(timer);
      skipEvents.forEach((name) => window.removeEventListener(name, finish));
    };
  }, [count]);

  const letters = [...'VELTRIX'];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="vx-intro"
          aria-hidden="true"
          initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: 0.95, ease: EASE_IN_OUT } }}
        >
          <motion.div className="vx-intro__inner" exit={{ y: -60, opacity: 0, transition: { duration: 0.6, ease: EASE_IN_OUT } }}>
            <div className="vx-intro__corner vx-intro__corner--tl">VX / MMXXVI</div>
            <div className="vx-intro__corner vx-intro__corner--tr">Digital, reimagined.</div>

            <div className="vx-intro__center">
              <motion.span
                className="vx-intro__mark"
                initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.9, ease: EASE_EXPO }}
              >
                <LogoMark size={44} />
              </motion.span>
              <span className="vx-intro__word">
                {letters.map((letter, i) => (
                  <span key={i} className="vx-intro__mask">
                    <motion.span
                      className="vx-intro__letter"
                      initial={{ y: '110%' }}
                      animate={{ y: '0%' }}
                      transition={{ duration: 0.9, ease: EASE_EXPO, delay: 0.12 + i * 0.05 }}
                    >
                      {letter}
                    </motion.span>
                  </span>
                ))}
              </span>
              <motion.span
                className="vx-intro__line"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: DURATION - 0.15, ease: [0.65, 0, 0.35, 1] }}
              />
            </div>

            <div className="vx-intro__corner vx-intro__corner--bl">
              <motion.span className="vx-intro__count">{countText}</motion.span>
            </div>
            <div className="vx-intro__corner vx-intro__corner--br">Initialising experience — press any key to skip</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
