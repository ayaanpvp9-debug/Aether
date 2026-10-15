import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { Segmented } from '../../../components/ui/Segmented';
import { usePrefersReducedMotion } from '../../../hooks/useMediaQuery';

type Layout = 'editorial' | 'gallery' | 'split';

const LAYOUTS: { value: Layout; label: string }[] = [
  { value: 'editorial', label: 'Editorial' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'split', label: 'Split' },
];

const BLOCKS = ['title', 'hero', 'imgA', 'imgB', 'text', 'cta'] as const;

/** Six layout blocks that physically recompose between presets using shared layout springs. */
export function LayoutShuffle() {
  const [layout, setLayout] = useState<Layout>('editorial');
  const [auto, setAuto] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!auto || !inView || reduced) return;
    const timer = window.setInterval(() => {
      setLayout((current) => LAYOUTS[(LAYOUTS.findIndex((l) => l.value === current) + 1) % LAYOUTS.length]!.value);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [auto, inView, reduced]);

  return (
    <div ref={ref} className="vx-shuffle">
      <div className="vx-browser">
        <div className="vx-browser__bar" aria-hidden="true">
          <span />
          <span />
          <span />
          <span className="vx-browser__url">veltrix.studio/{layout}</span>
        </div>
        <div className={`vx-shuffle__canvas vx-shuffle__canvas--${layout}`} aria-hidden="true">
          {BLOCKS.map((block) => (
            <motion.div key={block} layout className={`vx-shuffle__block vx-shuffle__block--${block}`} transition={{ type: 'spring', stiffness: 240, damping: 28 }}>
              {block === 'title' && (
                <>
                  <i />
                  <i />
                </>
              )}
              {block === 'text' && (
                <>
                  <i />
                  <i />
                  <i />
                </>
              )}
              {block === 'cta' && <b />}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="vx-shuffle__controls">
        <Segmented
          size="sm"
          kind="radio"
          options={LAYOUTS}
          value={layout}
          onChange={(value) => {
            setAuto(false);
            setLayout(value);
          }}
          layoutId="shuffle-layout"
          label="Layout preset"
        />
        <span className="vx-demo-hint">{auto && !reduced ? 'Auto-cycling — pick one' : 'Manual'}</span>
      </div>
    </div>
  );
}
