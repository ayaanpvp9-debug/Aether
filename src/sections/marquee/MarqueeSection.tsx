import { Fragment, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { MARQUEE_PHRASES } from '../../content/site';
import { Marquee } from '../../components/ui/Marquee';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import './Marquee.css';

const STACK = ['React 19', 'TypeScript', 'WebGL', 'Motion', 'Node', 'SQLite', 'Accessibility', 'Core Web Vitals', 'Design systems', 'Art direction'];

function Spark() {
  return (
    <svg className="vx-band__spark vx-ambient-loop" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0c.8 6.4 5.6 11.2 12 12-6.4.8-11.2 5.6-12 12-.8-6.4-5.6-11.2-12-12C6.4 11.2 11.2 6.4 12 0z" />
    </svg>
  );
}

/** Kinetic tape between the hero and the work: tilts with scroll, reacts to scroll velocity. */
export function MarqueeSection() {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-3.2, 1.2]);
  const rotateB = useTransform(scrollYProgress, [0, 1], [2.4, -1]);

  return (
    <section ref={ref} className="vx-band" aria-label="VELTRIX principles">
      <motion.div className="vx-band__tape vx-band__tape--main" style={reduced ? undefined : { rotate }}>
        <Marquee speed={2.4} direction={-1} label={MARQUEE_PHRASES.join('. ') + '.'}>
          {[0, 1].map((copy) => (
            <Fragment key={copy}>
              {MARQUEE_PHRASES.map((phrase, i) => (
                <span key={`${copy}-${phrase}`} className="vx-band__item">
                  <span className={i % 2 === 1 ? 'vx-band__text vx-band__text--serif' : 'vx-band__text'}>{phrase}</span>
                  <Spark />
                </span>
              ))}
            </Fragment>
          ))}
        </Marquee>
      </motion.div>
      <motion.div className="vx-band__tape vx-band__tape--micro" style={reduced ? undefined : { rotate: rotateB }} aria-hidden="true">
        <Marquee speed={1.6} direction={1} reactive={false}>
          {[0, 1, 2].map((copy) => (
            <Fragment key={copy}>
              {STACK.map((item) => (
                <span key={`${copy}-${item}`} className="vx-band__micro">
                  {item}
                  <i />
                </span>
              ))}
            </Fragment>
          ))}
        </Marquee>
      </motion.div>
    </section>
  );
}
