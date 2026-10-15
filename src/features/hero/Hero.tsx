import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type Variants } from 'motion/react';
import { Button } from '../../components/ui/Button';
import { TextReveal } from '../../components/ui/TextReveal';
import { formatClock, useNow } from '../../hooks/useClock';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { clamp } from '../../lib/math';
import { EASE_OUT } from '../../lib/motion';
import { scrollToSection } from '../../lib/scroll';
import { createStore, useStore, type Store } from '../../lib/store';
import { OrbCanvas, type OrbHandle } from './OrbCanvas';
import { Particles, type ParticlesHandle } from './Particles';
import type { OrbStats } from './orb-renderer';
import './Hero.css';

const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 1.1, ease: EASE_OUT, delay } }),
};

const fade: Variants = {
  hidden: { opacity: 0 },
  visible: (delay: number = 0) => ({ opacity: 1, transition: { duration: 1.4, ease: EASE_OUT, delay } }),
};

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

function RenderPanel({ store }: { store: Store<OrbStats | null | undefined> }) {
  const stats = useStore(store);
  const engine = stats === null ? 'CSS fallback' : (stats?.engine ?? 'Starting…');
  return (
    <dl className="vx-hero__panel-rows">
      <div>
        <dt>Engine</dt>
        <dd>{engine}</dd>
      </div>
      <div>
        <dt>Frame rate</dt>
        <dd>{stats ? (stats.mode === 'static' ? 'Static (reduced motion)' : `${stats.fps} fps`) : '—'}</dd>
      </div>
      <div>
        <dt>Resolution</dt>
        <dd>{stats ? `${stats.scale.toFixed(2)}×` : '—'}</dd>
      </div>
    </dl>
  );
}

function OrbitRing() {
  const ticks = Array.from({ length: 72 }, (_, i) => i);
  return (
    <svg className="vx-hero__ring" viewBox="0 0 400 400" aria-hidden="true">
      <circle cx="200" cy="200" r="196" className="vx-hero__ring-line" />
      {ticks.map((i) => {
        const angle = (i / ticks.length) * Math.PI * 2;
        const long = i % 6 === 0;
        const r1 = 196;
        const r2 = long ? 186 : 191;
        return (
          <line
            key={i}
            x1={200 + Math.cos(angle) * r1}
            y1={200 + Math.sin(angle) * r1}
            x2={200 + Math.cos(angle) * r2}
            y2={200 + Math.sin(angle) * r2}
            className={long ? 'vx-hero__tick vx-hero__tick--long' : 'vx-hero__tick'}
          />
        );
      })}
    </svg>
  );
}

export function Hero({ ready }: { ready: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const orbWrapRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<OrbHandle>(null);
  const particlesRef = useRef<ParticlesHandle>(null);
  const reduced = usePrefersReducedMotion();
  const [statsStore] = useState(() => createStore<OrbStats | null | undefined>(undefined));
  const [fontsReady, setFontsReady] = useState(false);
  const play = ready && fontsReady;

  const coordX = useMotionValue(0);
  const coordY = useMotionValue(0);
  const coordXText = useTransform(coordX, (v) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(3)}`);
  const coordYText = useTransform(coordY, (v) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(3)}`);

  // Scroll-linked exit: the stage drifts up and dissolves while the orb sinks.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const stageY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const stageOpacity = useTransform(scrollYProgress, [0, 0.72], [1, 0]);
  const orbScale = useTransform(scrollYProgress, [0, 1], [1, 0.78]);
  const orbY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  useMotionValueEvent(scrollYProgress, 'change', (v) => orbRef.current?.setScroll(v));

  // Wait for the display face so the headline never reveals in a fallback font.
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

  // Pointer → orb, particles, coordinates and CSS parallax (no React re-renders).
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let inView = true;
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false;
    });
    observer.observe(section);

    const onMove = (event: PointerEvent) => {
      const wrap = orbWrapRef.current;
      if (!inView || !wrap) return;
      const rect = wrap.getBoundingClientRect();
      const nx = clamp((event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2), -1.6, 1.6);
      const ny = clamp(-(event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2), -1.6, 1.6);
      orbRef.current?.setPointer(nx, ny);
      orbRef.current?.setHover(Math.hypot(nx, ny) < 0.72);
      particlesRef.current?.setPointer(nx / 1.6, ny / 1.6);
      coordX.set(nx);
      coordY.set(ny);
      section.style.setProperty('--px', (nx / 1.6).toFixed(3));
      section.style.setProperty('--py', (ny / 1.6).toFixed(3));
    };
    const onLeave = () => orbRef.current?.setHover(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      observer.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [coordX, coordY]);

  const animateState = play ? 'visible' : 'hidden';

  return (
    <section ref={sectionRef} id="top" className="vx-hero" aria-labelledby="hero-title">
      <div className="vx-hero__bg" aria-hidden="true">
        <div className="vx-hero__aurora vx-hero__aurora--a" />
        <div className="vx-hero__aurora vx-hero__aurora--b" />
        <div className="vx-hero__aurora vx-hero__aurora--c" />
        <div className="vx-hero__grid" />
        <Particles ref={particlesRef} className="vx-hero__particles" />
        <div className="vx-hero__vignette" />
      </div>

      <motion.div className="vx-hero__stage" style={reduced ? undefined : { y: stageY, opacity: stageOpacity }}>
        <div className="vx-container vx-hero__inner">
          <motion.div className="vx-hero__topline" initial="hidden" animate={animateState} variants={rise} custom={0.5}>
            <span className="vx-eyebrow">
              <span className="vx-eyebrow__index">[VX—01]</span>
              Concept studio
            </span>
            <span className="vx-eyebrow vx-hero__topline-mid">Creative technology · Est. 2026</span>
            <LocalClock />
          </motion.div>

          <div className="vx-hero__center">
            <motion.div
              ref={orbWrapRef}
              className="vx-hero__orb"
              style={reduced ? undefined : { scale: orbScale, y: orbY }}
              initial={{ opacity: 0 }}
              animate={{ opacity: play ? 1 : 0 }}
              transition={{ duration: 1.6, ease: EASE_OUT }}
              onPointerDown={() => orbRef.current?.pulse()}
              data-cursor="orb"
              data-cursor-label="Pulse"
            >
              <div className="vx-hero__orb-glow" aria-hidden="true" />
              <OrbitRing />
              <OrbCanvas ref={orbRef} play={play} onStats={(s) => statsStore.set(s)} />
              <motion.div className="vx-hero__coords" initial="hidden" animate={animateState} variants={fade} custom={1.4} aria-hidden="true">
                <span className="vx-hero__coords-label">Pointer</span>
                <span>
                  X <motion.span className="vx-hero__coords-value">{coordXText}</motion.span>
                </span>
                <span>
                  Y <motion.span className="vx-hero__coords-value">{coordYText}</motion.span>
                </span>
              </motion.div>
            </motion.div>

            <h1 id="hero-title" className="vx-hero__title" data-fonts={fontsReady ? 'ready' : 'pending'}>
              <span className="sr-only">Digital, reimagined.</span>
              <span className="vx-hero__line vx-hero__line--1" aria-hidden="true">
                <TextReveal text="DIGITAL," by="chars" trigger="controlled" play={play} delay={0.1} stagger={0.045} duration={1.3} decorative />
              </span>
              <span className="vx-hero__line vx-hero__line--2" aria-hidden="true">
                <TextReveal text="REIMAGINED." by="chars" trigger="controlled" play={play} delay={0.32} stagger={0.04} duration={1.3} decorative />
              </span>
            </h1>

            <motion.p className="vx-hero__annotation" initial="hidden" animate={animateState} variants={fade} custom={1.2} aria-hidden="true">
              <span className="vx-serif">(n.)</span> the craft of making the web feel alive
            </motion.p>
          </div>

          <div className="vx-hero__bottom">
            <div className="vx-hero__copy">
              <motion.p className="vx-hero__lede" initial="hidden" animate={animateState} variants={rise} custom={0.75}>
                VELTRIX is a concept studio for cinematic websites, full-stack products and interactive brand systems — engineered for
                teams that refuse to blend in.
              </motion.p>
              <motion.div className="vx-hero__ctas" initial="hidden" animate={animateState} variants={rise} custom={0.9}>
                <Button href="#contact" size="lg" cursorLabel="Let’s talk">
                  Start a project
                </Button>
                <Button href="#work" size="lg" variant="ghost" icon="down">
                  Explore work
                </Button>
              </motion.div>
            </div>

            <motion.button
              type="button"
              className="vx-hero__scroll"
              onClick={() => scrollToSection('work')}
              initial="hidden"
              animate={animateState}
              variants={fade}
              custom={1.3}
              data-cursor="link"
              aria-label="Scroll to selected work"
            >
              <span className="vx-hero__scroll-track" aria-hidden="true">
                <span className="vx-hero__scroll-dot" />
              </span>
              <span aria-hidden="true">Scroll</span>
            </motion.button>

            <motion.aside className="vx-hero__panel" initial="hidden" animate={animateState} variants={rise} custom={1.1} aria-label="Live render statistics">
              <span className="vx-hero__panel-title">
                <span className="vx-hero__live" aria-hidden="true" /> Realtime render
              </span>
              <RenderPanel store={statsStore} />
              <span className="vx-hero__panel-hint">Move to steer · click the orb</span>
            </motion.aside>
          </div>

          <span className="vx-hero__mark vx-hero__mark--tl" aria-hidden="true" />
          <span className="vx-hero__mark vx-hero__mark--tr" aria-hidden="true" />
          <span className="vx-hero__mark vx-hero__mark--bl" aria-hidden="true" />
          <span className="vx-hero__mark vx-hero__mark--br" aria-hidden="true" />
        </div>
      </motion.div>

      <span className="vx-hero__side" aria-hidden="true">
        VELTRIX® — Concept experience — MMXXVI
      </span>
    </section>
  );
}
