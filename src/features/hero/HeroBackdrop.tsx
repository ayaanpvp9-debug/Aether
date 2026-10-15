import { useRef } from 'react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import { HERO_BACKDROP_WORDS } from '../../content/site';
import { useLoop } from './useLoop';

interface Row {
  id: 'a' | 'b' | 'c';
  words: string[];
  /** px / second — rows travel at different speeds for a parallax feel. */
  speed: number;
  direction: -1 | 1;
  phase: number;
  /** Scroll parallax (px) across the hero's scroll range. */
  shiftX: number;
  shiftY: number;
}

const rotate = (list: string[], by: number) => [...list.slice(by), ...list.slice(0, by)];

const ROWS: Row[] = [
  { id: 'a', words: HERO_BACKDROP_WORDS, speed: 24, direction: -1, phase: 0.18, shiftX: -90, shiftY: 40 },
  { id: 'b', words: rotate(HERO_BACKDROP_WORDS, 3), speed: 15, direction: 1, phase: 0.57, shiftX: 120, shiftY: 120 },
  { id: 'c', words: rotate(HERO_BACKDROP_WORDS, 2), speed: 34, direction: -1, phase: 0.33, shiftX: -160, shiftY: -40 },
];

interface LayerProps {
  /** Run the horizontal loops (the display face is ready). */
  loop: boolean;
  /** Site-wide "pause moving text" switch. */
  paused: boolean;
  /** Speed multiplier — calmer when the system asks for reduced motion. */
  pace: number;
  /** Hero scroll progress (0 → 1) used for the vertical/horizontal parallax. */
  progress: MotionValue<number>;
  parallax: boolean;
}

function BackdropRow({ row, loop, paused, pace, progress, parallax }: LayerProps & { row: Row }) {
  const trackRef = useRef<HTMLDivElement>(null);
  useLoop(trackRef, { speed: row.speed * pace, direction: row.direction, phase: row.phase, enabled: loop, paused });
  const x = useTransform(progress, [0, 1], [0, row.shiftX]);
  const y = useTransform(progress, [0, 1], [0, row.shiftY]);

  return (
    <motion.div className={`vx-hero__row vx-hero__row--${row.id}`} style={parallax ? { x, y } : undefined}>
      <div className="vx-hero__row-depth">
        <div ref={trackRef} className="vx-hero__row-track">
          {[0, 1].map((half) => (
            <div key={half} className="vx-hero__row-half">
              {row.words.map((word) => (
                <span key={word} className="vx-hero__row-word">
                  {word}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Oversized, low-contrast words drifting behind the headline at three speeds
 * and depths. Purely decorative — the parent background is aria-hidden.
 */
export function HeroBackdrop(props: LayerProps) {
  return (
    <div className="vx-hero__backdrop">
      {ROWS.map((row) => (
        <BackdropRow key={row.id} row={row} {...props} />
      ))}
    </div>
  );
}
