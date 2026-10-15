import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, type Variants } from 'motion/react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { TESTIMONIALS } from '../../content/testimonials';
import { useMotionPaused } from '../../lib/motion-pause';
import { cn } from '../../lib/cn';
import { pad2 } from '../../lib/math';
import { EASE_OUT } from '../../lib/motion';
import './Testimonials.css';

const AUTOPLAY_MS = 7000;

const slide: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 60, filter: 'blur(8px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE_OUT } },
  exit: (direction: number) => ({ opacity: 0, x: direction * -40, filter: 'blur(6px)', transition: { duration: 0.35 } }),
};

function QuoteBody({ testimonial }: { testimonial: (typeof TESTIMONIALS)[number] }) {
  return (
    <>
      <blockquote className="vx-quotes__text">“{testimonial.quote}”</blockquote>
      <figcaption className="vx-quotes__person">
        <span
          className="vx-quotes__avatar"
          style={{ background: `linear-gradient(135deg, hsl(${testimonial.hue} 80% 65%), hsl(${testimonial.hue + 50} 85% 55%))` }}
          aria-hidden="true"
        >
          {testimonial.name
            .split(' ')
            .map((part) => part[0])
            .join('')}
        </span>
        <span>
          <strong>{testimonial.name}</strong>
          <span className="vx-quotes__role">{testimonial.role}</span>
        </span>
        <span className="vx-quotes__sample">Sample · fictional</span>
      </figcaption>
    </>
  );
}

export function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const inView = useInView(rootRef, { amount: 0.35 });
  const motionPaused = useMotionPaused();
  const count = TESTIMONIALS.length;
  const paused = hovered || focused || !inView || motionPaused;
  const current = TESTIMONIALS[index]!;

  const go = (delta: number) => {
    setDirection(delta);
    setIndex((i) => (i + delta + count) % count);
  };

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, count]);

  return (
    <section
      ref={rootRef}
      id="testimonials"
      className="vx-section vx-quotes"
      aria-labelledby="testimonials-title"
      aria-roledescription="carousel"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false);
      }}
    >
      <div className="vx-container vx-quotes__layout">
        <div className="vx-quotes__intro">
          <span className="vx-eyebrow">
            <span className="vx-eyebrow__index">(07)</span>
            <span className="vx-sh__rule" aria-hidden="true" />
            Voices
          </span>
          <motion.h2
            id="testimonials-title"
            className="vx-h2"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1, ease: EASE_OUT }}
          >
            Said in the <span className="vx-serif">front row</span>.
          </motion.h2>
          <span className="vx-notice">
            <Info size={13} aria-hidden="true" /> Sample testimonials — fictional personas, not real customers
          </span>

          <div className="vx-quotes__controls">
            <button type="button" className="vx-icon-btn" onClick={() => go(-1)} aria-label="Previous testimonial" data-cursor="link">
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="vx-icon-btn" onClick={() => go(1)} aria-label="Next testimonial" data-cursor="link">
              <ChevronRight size={18} />
            </button>
            <div className="vx-quotes__dots" role="tablist" aria-label="Choose a testimonial">
              {TESTIMONIALS.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-controls="vx-quote-panel"
                  aria-label={`Testimonial ${i + 1} of ${count}`}
                  className={cn('vx-quotes__dot', i === index && 'is-active')}
                  onClick={() => {
                    setDirection(i > index ? 1 : -1);
                    setIndex(i);
                  }}
                  data-cursor="link"
                >
                  {i === index && (
                    <span key={index} className="vx-quotes__fill" style={{ animationDuration: `${AUTOPLAY_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }} />
                  )}
                </button>
              ))}
            </div>
            <span className="vx-quotes__count" aria-hidden="true">
              {pad2(index + 1)} / {pad2(count)}
            </span>
          </div>
        </div>

        <div className="vx-quotes__stage" id="vx-quote-panel" role="tabpanel" aria-live={paused ? 'polite' : 'off'}>
          <svg className="vx-quotes__mark" viewBox="0 0 64 48" aria-hidden="true">
            <path d="M0 48V28C0 12 8 2 24 0l3 7C18 10 14 16 14 24h12v24H0zm36 0V28c0-16 8-26 24-28l3 7c-9 3-13 9-13 17h12v24H36z" />
          </svg>
          <div className="vx-quotes__viewport">
            {/* Invisible stack of every quote: reserves the tallest height so autoplay never shifts the page. */}
            <div className="vx-quotes__sizer" aria-hidden="true">
              {TESTIMONIALS.map((t) => (
                <figure key={t.id} className="vx-quotes__figure">
                  <QuoteBody testimonial={t} />
                </figure>
              ))}
            </div>
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.figure
              key={current.id}
              className="vx-quotes__figure"
              custom={direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.35}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(1);
                else if (info.offset.x > 60) go(-1);
              }}
              data-cursor-label="Drag"
            >
              <QuoteBody testimonial={current} />
            </motion.figure>
          </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
