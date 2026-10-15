import { Fragment, useRef } from 'react';
import { Pause, Play } from 'lucide-react';
import { HERO_CONVEYOR_PHRASES } from '../../content/site';
import { setMotionPaused } from '../../lib/motion-pause';
import { useLoop } from './useLoop';

/** Phrase sets per half — each half must out-span the widest viewport. */
const SETS_PER_HALF = 3;

interface ConveyorProps {
  /** Run the loop (the display face is ready). */
  loop: boolean;
  /** Site-wide "pause moving text" switch. */
  paused: boolean;
  /** Speed multiplier — calmer when the system asks for reduced motion. */
  pace: number;
}

/**
 * Full-bleed typographic conveyor under the hero copy. The visible belt is a
 * duplicated, aria-hidden track looping right → left at a constant speed;
 * assistive tech reads the phrases once from the visually hidden copy. The
 * round control at the end pauses every looping motion on the site.
 */
export function HeroConveyor({ loop, paused, pace }: ConveyorProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  useLoop(trackRef, { speed: 62 * pace, direction: -1, enabled: loop, paused });

  const sequence = Array.from({ length: SETS_PER_HALF }, () => HERO_CONVEYOR_PHRASES).flat();

  return (
    <div className="vx-hero__conveyor">
      <p className="sr-only">{HERO_CONVEYOR_PHRASES.map((phrase) => `${phrase}.`).join(' ')}</p>
      <div className="vx-hero__belt" aria-hidden="true">
        <div className="vx-hero__belt-reveal">
          <div ref={trackRef} className="vx-hero__belt-track">
            {[0, 1].map((half) => (
              <div key={half} className="vx-hero__belt-half">
                {sequence.map((phrase, i) => (
                  <Fragment key={i}>
                    <span className={i % 2 ? 'vx-hero__belt-item vx-hero__belt-item--serif' : 'vx-hero__belt-item'}>{phrase}</span>
                    <span className={i % 2 ? 'vx-hero__belt-sep vx-hero__belt-sep--open' : 'vx-hero__belt-sep'} />
                  </Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        className="vx-hero__motion"
        onClick={() => setMotionPaused(!paused)}
        aria-pressed={paused}
        aria-label="Pause moving text"
        data-cursor-label={paused ? 'Play' : 'Pause'}
      >
        {paused ? <Play size={13} strokeWidth={2} aria-hidden="true" /> : <Pause size={13} strokeWidth={2} aria-hidden="true" />}
      </button>
    </div>
  );
}
