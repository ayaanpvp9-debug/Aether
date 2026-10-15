import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import { Check, CodeXml, Compass, PenTool, Rocket } from 'lucide-react';
import { PROCESS_STEPS } from '../../content/process';
import { cn } from '../../lib/cn';
import { EASE_OUT } from '../../lib/motion';
import './Process.css';

const ICONS = [Compass, PenTool, CodeXml, Rocket];

export function ProcessSection() {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 65%', 'end 60%'] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const items = listRef.current?.querySelectorAll<HTMLElement>('[data-step]');
    if (!items) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: '-42% 0px -48% 0px' },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const current = PROCESS_STEPS[active]!;

  return (
    <section id="process" className="vx-section vx-process" aria-labelledby="process-title">
      <div className="vx-container vx-process__layout">
        <div className="vx-process__aside">
          <div className="vx-process__sticky">
            <span className="vx-eyebrow">
              <span className="vx-eyebrow__index">(05)</span>
              <span className="vx-sh__rule" aria-hidden="true" />
              Process
            </span>
            <motion.h2
              id="process-title"
              className="vx-h2 vx-process__title"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1, ease: EASE_OUT }}
            >
              From first signal to <span className="vx-serif">launch</span>.
            </motion.h2>
            <p className="vx-lede">Four phases, overlapping on purpose. Design and engineering move together so nothing gets lost in translation.</p>

            <div className="vx-process__counter" aria-hidden="true">
              <span className="vx-process__zero">0</span>
              <span className="vx-process__roll">
                <motion.span className="vx-process__digits" animate={{ y: `${-active * 25}%` }} transition={{ type: 'spring', stiffness: 160, damping: 22 }}>
                  {PROCESS_STEPS.map((step) => (
                    <span key={step.id}>{Number(step.index)}</span>
                  ))}
                </motion.span>
              </span>
              <span className="vx-process__of">/ 0{PROCESS_STEPS.length}</span>
            </div>
            <div className="vx-process__now" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={current.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                >
                  Now: {current.title} · {current.duration}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <ol ref={listRef} className="vx-process__steps">
          <span className="vx-process__line" aria-hidden="true">
            <motion.span style={{ scaleY: progress }} />
          </span>
          {PROCESS_STEPS.map((step, i) => {
            const Icon = ICONS[i]!;
            return (
              <motion.li
                key={step.id}
                data-step={i}
                className={cn('vx-step', active === i && 'is-active', active > i && 'is-done')}
                initial={{ opacity: 0, y: 56 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1, ease: EASE_OUT }}
              >
                <span className="vx-step__node" aria-hidden="true">
                  <span />
                </span>
                <article className="vx-step__card">
                  <div className="vx-step__top">
                    <span className="vx-step__index">{step.index}</span>
                    <span className="vx-step__duration">{step.duration}</span>
                    <span className="vx-step__icon" aria-hidden="true">
                      <Icon size={18} strokeWidth={1.6} />
                    </span>
                  </div>
                  <h3 className="vx-step__title">{step.title}</h3>
                  <p className="vx-step__summary">{step.summary}</p>
                  <ul className="vx-step__deliverables" aria-label={`${step.title} deliverables`}>
                    {step.deliverables.map((d) => (
                      <li key={d}>
                        <Check size={13} aria-hidden="true" /> {d}
                      </li>
                    ))}
                  </ul>
                </article>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
