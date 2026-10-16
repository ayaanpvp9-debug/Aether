import { useEffect, useRef, useState } from 'react';
import { LayoutGroup, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { NAV_ITEMS } from '../../content/site';
import { useScrollSpy } from '../../hooks/useScrollSpy';
import { cn } from '../../lib/cn';
import { EASE_OUT } from '../../lib/motion';
import { scrollToSection, scrollToTop } from '../../lib/scroll';
import { Button } from '../ui/Button';
import { LogoMark } from '../ui/LogoMark';
import { RollText } from '../ui/RollText';
import { MobileMenu } from './MobileMenu';
import './Navbar.css';

const PILL_WIDTH = 1080;
const SPY_IDS = ['top', ...NAV_ITEMS.map((item) => item.id), 'results', 'testimonials'];
const PILL_SPRING = { type: 'spring', stiffness: 420, damping: 36 } as const;

export function Navbar({ ready }: { ready: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuOrigin, setMenuOrigin] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const active = useScrollSpy(SPY_IDS);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    if (y < 640) setHidden(false);
    else if (y > previous + 6) setHidden(true);
    else if (y < previous - 6) setHidden(false);
  });

  // Pre-compute how far the pill shrinks and the edge groups slide (CSS vars → transforms only).
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const observer = new ResizeObserver(() => {
      const width = bar.offsetWidth;
      const target = Math.min(width, PILL_WIDTH);
      bar.style.setProperty('--pill', (target / width).toFixed(4));
      bar.style.setProperty('--shift', `${Math.max(0, (width - target) / 2).toFixed(1)}px`);
    });
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  const openMenu = () => {
    const rect = burgerRef.current?.getBoundingClientRect();
    if (rect) setMenuOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setMenuOpen(true);
  };

  return (
    <>
      <motion.header
        className={cn('vx-nav', scrolled && 'is-scrolled', hidden && !menuOpen && 'is-hidden')}
        initial={{ opacity: 0, y: -24 }}
        animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 }}
        transition={{ duration: 1, ease: EASE_OUT, delay: 0.35 }}
        onFocusCapture={() => setHidden(false)}
      >
        <div ref={barRef} className="vx-nav__bar">
          <a
            href="#top"
            className="vx-nav__brand"
            aria-label="VELTRIX — back to top"
            onClick={(event) => {
              event.preventDefault();
              scrollToTop();
            }}
            data-cursor="link"
          >
            <LogoMark size={26} className="vx-nav__mark" />
            <span className="vx-nav__word" aria-hidden="true">
              VELTRIX
            </span>
          </a>

          <nav className="vx-nav__links" aria-label="Primary">
            <LayoutGroup id="nav">
              <ul onPointerLeave={() => setHovered(null)}>
                {NAV_ITEMS.map((item) => {
                  const isActive = active === item.id;
                  return (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={cn('vx-nav__link vx-roll-host', isActive && 'is-active')}
                        aria-current={isActive ? 'location' : undefined}
                        onPointerEnter={() => setHovered(item.id)}
                        onFocus={() => setHovered(item.id)}
                        onBlur={() => setHovered(null)}
                        onClick={(event) => {
                          event.preventDefault();
                          scrollToSection(item.id);
                        }}
                        data-cursor="link"
                      >
                        {hovered === item.id && <motion.span layoutId="nav-hover" className="vx-nav__hover" transition={PILL_SPRING} />}
                        {isActive && <motion.span layoutId="nav-active" className="vx-nav__active" transition={PILL_SPRING} />}
                        <RollText text={item.label} />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </LayoutGroup>
          </nav>

          <div className="vx-nav__actions">
            <Button href="#work" size="sm" className="vx-nav__cta" cursorLabel="Explore">
              Explore work
            </Button>
            <button
              ref={burgerRef}
              type="button"
              className="vx-nav__burger"
              aria-expanded={menuOpen}
              aria-controls="vx-mobile-menu"
              aria-label="Open menu"
              onClick={openMenu}
              data-cursor="link"
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </motion.header>
      <MobileMenu open={menuOpen} origin={menuOrigin} active={active} onClose={() => setMenuOpen(false)} />
    </>
  );
}
