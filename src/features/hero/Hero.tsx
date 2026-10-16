import { Fragment, useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, type Variants } from 'motion/react';
import { Button } from '../../components/ui/Button';
import { formatClock, useNow } from '../../hooks/useClock';
import { useFinePointer, usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { clamp, damp } from '../../lib/math';
import { EASE_EXPO, EASE_OUT } from '../../lib/motion';
import { useMotionPaused } from '../../lib/motion-pause';
import { scrollToSection } from '../../lib/scroll';
import { HeroBackdrop } from './HeroBackdrop';
import { HeroConveyor } from './HeroConveyor';
import './Hero.css';

const LEDE =
  'VELTRIX is a concept studio for cinematic websites, full-stack products and interactive brand systems — engineered for teams that refuse to blend in.';

const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 1.1, ease: EASE_OUT, delay } }),
};

const fade: Variants = {
  hidden: { opacity: 0 },
  visible: (delay: number = 0) => ({ opacity: 1, transition: { duration: 1.2, ease: EASE_OUT, delay } }),
};

/** Headline lines rise out of their mask and settle from a slight skew — then stay put. */
const lineReveal: Variants = {
  hidden: { y: '112%', skewY: 4, opacity: 0 },
  visible: (delay: number = 0) => ({
    y: '0%',
    skewY: 0,
    opacity: 1,
    transition: {
      y: { duration: 1.45, ease: EASE_EXPO, delay },
      skewY: { duration: 1.45, ease: EASE_EXPO, delay },
      opacity: { duration: 0.75, ease: EASE_OUT, delay },
    },
  }),
};

const wordRise: Variants = {
  hidden: { opacity: 0, y: '0.65em' },
  visible: (delay: number = 0) => ({ opacity: 1, y: '0em', transition: { duration: 0.9, ease: EASE_OUT, delay } }),
};

/** Entrance timeline (seconds after the intro hands over). */
const T = {
  line1: 0.08,
  line2: 0.24,
  topline: 0.5,
  lede: 0.62,
  annotation: 0.85,
  ctas: 0.9,
  scroll: 1.25,
} as const;

function LocalClock() {
  const now = useNow();
  const { time, zone } = formatClock(now);
  return (
    <span className="vx-hero__clock">
      <span className="vx-hero__live" aria-hidden="true" />
      <span className="vx-hero__clock-label">Local</span>
      <time>{time}</time>
      <span className="vx-muted">{zone}</span>
    </span>
  );
}

export function Hero({ ready }: { ready: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  // Reduced motion keeps the hero alive but calmer: loops slow down and the
  // scroll-linked / parallax movement is dropped. "Pause" freezes the loops.
  const reduced = usePrefersReducedMotion();
  const paused = useMotionPaused();
  const pace = reduced ? 0.6 : 1;
  const finePointer = useFinePointer();
  const [fontsReady, setFontsReady] = useState(false);
  const play = ready && fontsReady;
  const animateState = play ? 'visible' : 'hidden';

  // Scroll-linked exit: the copy drifts up and dissolves, the headline lines
  // part horizontally, and the backdrop type moves at its own depths.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const stageY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const stageOpacity = useTransform(scrollYProgress, [0, 0.72], [1, 0]);
  const line1X = useTransform(scrollYProgress, [0, 1], ['0vw', '-7vw']);
  const line2X = useTransform(scrollYProgress, [0, 1], ['0vw', '7vw']);

  // Wait for the display face so nothing reveals in a fallback font.
  useEffect(() => {
    let cancelled = false;
    const done = () => !cancelled && setFontsReady(true);
    const timeout = window.setTimeout(done, 1200);
    document.fonts?.ready.then(done, done);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  // Visibility flag (pauses the CSS loops off-screen) and, on fine pointers,
  // a damped cursor light + parallax variables — all without React re-renders.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let inView = true;
    let raf = 0;
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false;
      section.dataset.inview = String(inView);
      if (inView) kick();
    });
    observer.observe(section);

    const light = lightRef.current;
    const interactive = finePointer && !!light;

    let clientX = 0;
    let clientY = 0;
    let hasPointer = false;
    let last = 0;
    const cur = { x: 0, y: 0, px: 0, py: 0 };

    const tick = (now: number) => {
      raf = 0;
      if (!light || !hasPointer || !inView) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const rect = section.getBoundingClientRect();
      const tx = clientX - rect.left;
      const ty = clientY - rect.top;
      const tpx = clamp((tx / rect.width) * 2 - 1, -1, 1);
      const tpy = clamp((ty / rect.height) * 2 - 1, -1, 1);
      cur.x = damp(cur.x, tx, 7, dt);
      cur.y = damp(cur.y, ty, 7, dt);
      cur.px = damp(cur.px, tpx, 2.6, dt);
      cur.py = damp(cur.py, tpy, 2.6, dt);
      light.style.transform = `translate3d(${cur.x.toFixed(1)}px, ${cur.y.toFixed(1)}px, 0)`;
      section.style.setProperty('--px', cur.px.toFixed(4));
      section.style.setProperty('--py', cur.py.toFixed(4));
      const settled =
        Math.abs(tx - cur.x) < 0.5 && Math.abs(ty - cur.y) < 0.5 && Math.abs(tpx - cur.px) < 0.004 && Math.abs(tpy - cur.py) < 0.004;
      if (settled) last = 0;
      else raf = requestAnimationFrame(tick);
    };

    function kick() {
      if (interactive && hasPointer && !raf) raf = requestAnimationFrame(tick);
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      clientX = event.clientX;
      clientY = event.clientY;
      if (!hasPointer) {
        // Start the light under the pointer, then let it trail smoothly.
        const rect = section.getBoundingClientRect();
        cur.x = clientX - rect.left;
        cur.y = clientY - rect.top;
        hasPointer = true;
        section.dataset.pointer = 'true';
      }
      kick();
    };
    const onLeave = () => {
      hasPointer = false;
      delete section.dataset.pointer;
    };

    if (interactive) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('scroll', kick, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', kick);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      delete section.dataset.pointer;
      section.style.removeProperty('--px');
      section.style.removeProperty('--py');
    };
  }, [finePointer]);

  const words = LEDE.split(' ');

  return (
    <section ref={sectionRef} id="top" className="vx-hero" aria-labelledby="hero-title" data-play={play ? 'true' : 'false'}>
      <div className="vx-hero__bg" aria-hidden="true">
        <div className="vx-hero__aurora vx-hero__aurora--a vx-ambient-loop" />
        <div className="vx-hero__aurora vx-hero__aurora--b vx-ambient-loop" />
        <div className="vx-hero__aurora vx-hero__aurora--c vx-ambient-loop" />
        <HeroBackdrop loop={play} paused={paused} pace={pace} progress={scrollYProgress} parallax={!reduced} />
        <div className="vx-hero__sweep vx-ambient-loop" />
        <div ref={lightRef} className="vx-hero__light" />
        <div className="vx-hero__vignette" />
      </div>

      <motion.div className="vx-hero__stage" style={reduced ? undefined : { y: stageY, opacity: stageOpacity }}>
        <div className="vx-container vx-hero__inner">
          <div className="vx-hero__topline">
            <motion.span className="vx-eyebrow" initial="hidden" animate={animateState} variants={rise} custom={T.topline}>
              <span className="vx-eyebrow__index">[VX—01]</span>
              Concept studio
            </motion.span>
            <motion.span
              className="vx-eyebrow vx-hero__topline-mid"
              initial="hidden"
              animate={animateState}
              variants={rise}
              custom={T.topline + 0.08}
            >
              Creative technology · Est. 2026
            </motion.span>
            <motion.span initial="hidden" animate={animateState} variants={rise} custom={T.topline + 0.16}>
              <LocalClock />
            </motion.span>
          </div>

          <div className="vx-hero__center">
            <h1 id="hero-title" className="vx-hero__title" data-fonts={fontsReady ? 'ready' : 'pending'}>
              <span className="sr-only">Digital, reimagined.</span>
              <motion.span className="vx-hero__line vx-hero__line--1" aria-hidden="true" style={reduced ? undefined : { x: line1X }}>
                <span className="vx-hero__mask">
                  <motion.span className="vx-hero__word" initial="hidden" animate={animateState} variants={lineReveal} custom={T.line1}>
                    DIGITAL,
                  </motion.span>
                </span>
              </motion.span>
              <motion.span className="vx-hero__line vx-hero__line--2" aria-hidden="true" style={reduced ? undefined : { x: line2X }}>
                <span className="vx-hero__mask">
                  <motion.span
                    className="vx-hero__word vx-hero__word--shine vx-ambient-loop"
                    initial="hidden"
                    animate={animateState}
                    variants={lineReveal}
                    custom={T.line2}
                  >
                    REIMAGINED.
                  </motion.span>
                </span>
              </motion.span>
            </h1>

            <motion.p className="vx-hero__annotation" initial="hidden" animate={animateState} variants={rise} custom={T.annotation} aria-hidden="true">
              <span className="vx-serif">(n.)</span> the craft of making the web feel alive
            </motion.p>
          </div>

          <div className="vx-hero__bottom">
            <p className="vx-hero__lede">
              <span className="sr-only">{LEDE}</span>
              <span aria-hidden="true">
                {words.map((word, i) => (
                  <Fragment key={i}>
                    <motion.span className="vx-hero__lede-word" initial="hidden" animate={animateState} variants={wordRise} custom={T.lede + i * 0.014}>
                      {word}
                    </motion.span>
                    {i < words.length - 1 ? ' ' : null}
                  </Fragment>
                ))}
              </span>
            </p>

            <div className="vx-hero__ctas">
              <motion.span className="vx-hero__cta vx-hero__cta--primary" initial="hidden" animate={animateState} variants={rise} custom={T.ctas}>
                <Button href="#work" size="lg" cursorLabel="Explore">
                  Explore work
                </Button>
              </motion.span>
              <motion.span className="vx-hero__cta" initial="hidden" animate={animateState} variants={rise} custom={T.ctas + 0.1}>
                <Button href="#lab" size="lg" variant="ghost" icon="down">
                  Try the lab
                </Button>
              </motion.span>
            </div>

            <motion.button
              type="button"
              className="vx-hero__scroll"
              onClick={() => scrollToSection('work')}
              initial="hidden"
              animate={animateState}
              variants={fade}
              custom={T.scroll}
              data-cursor="link"
              aria-label="Scroll to selected work"
            >
              <span className="vx-hero__scroll-track" aria-hidden="true">
                <span className="vx-hero__scroll-dot" />
              </span>
              <span aria-hidden="true">Scroll</span>
            </motion.button>
          </div>

          <span className="vx-hero__mark vx-hero__mark--tl" aria-hidden="true" />
          <span className="vx-hero__mark vx-hero__mark--tr" aria-hidden="true" />
          <span className="vx-hero__mark vx-hero__mark--bl" aria-hidden="true" />
          <span className="vx-hero__mark vx-hero__mark--br" aria-hidden="true" />
        </div>
      </motion.div>

      <HeroConveyor loop={play} paused={paused} pace={pace} />

      <span className="vx-hero__side" aria-hidden="true">
        VELTRIX® — Concept experience — MMXXVI
      </span>
    </section>
  );
}
