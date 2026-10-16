import { useCallback, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { BackToTop } from './components/layout/BackToTop';
import { Cursor } from './components/layout/Cursor';
import { Footer } from './components/layout/Footer';
import { Intro } from './components/layout/Intro';
import { Navbar } from './components/layout/Navbar';
import { ScrollProgress } from './components/layout/ScrollProgress';
import { SectionBoundary } from './components/layout/SectionBoundary';
import { ToastProvider } from './components/ui/ToastProvider';
import { Hero } from './features/hero/Hero';
import { shouldPlayIntro } from './lib/intro';
import { EASE_OUT } from './lib/motion';
import { CapabilitiesSection } from './sections/capabilities/CapabilitiesSection';
import { FaqSection } from './sections/faq/FaqSection';
import { LabSection } from './sections/lab/LabSection';
import { MarqueeSection } from './sections/marquee/MarqueeSection';
import { ProcessSection } from './sections/process/ProcessSection';
import { ResultsSection } from './sections/results/ResultsSection';
import { TestimonialsSection } from './sections/testimonials/TestimonialsSection';
import { WorkSection } from './sections/work/WorkSection';

export function App() {
  const [playIntro] = useState(shouldPlayIntro);
  const [ready, setReady] = useState(!playIntro);
  const reveal = useCallback(() => setReady(true), []);

  return (
    <MotionConfig reducedMotion="never" transition={{ duration: 0.6, ease: EASE_OUT }}>
      <ToastProvider>
        <a className="vx-skip" href="#main">
          Skip to content
        </a>
        {playIntro && <Intro onReveal={reveal} />}
        <Cursor />
        <ScrollProgress />
        <div id="app" className="vx-app">
          <Navbar ready={ready} />
          <main id="main" tabIndex={-1}>
            <SectionBoundary name="hero">
              <Hero ready={ready} />
            </SectionBoundary>
            <SectionBoundary name="marquee">
              <MarqueeSection />
            </SectionBoundary>
            <SectionBoundary name="work">
              <WorkSection />
            </SectionBoundary>
            <SectionBoundary name="capabilities">
              <CapabilitiesSection />
            </SectionBoundary>
            <SectionBoundary name="lab">
              <LabSection />
            </SectionBoundary>
            <SectionBoundary name="process">
              <ProcessSection />
            </SectionBoundary>
            <SectionBoundary name="results">
              <ResultsSection />
            </SectionBoundary>
            <SectionBoundary name="testimonials">
              <TestimonialsSection />
            </SectionBoundary>
            <SectionBoundary name="FAQ">
              <FaqSection />
            </SectionBoundary>
          </main>
          <Footer />
        </div>
        <BackToTop />
        <div className="vx-grain" aria-hidden="true" />
      </ToastProvider>
    </MotionConfig>
  );
}
