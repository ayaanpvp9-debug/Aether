import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, X } from 'lucide-react';
import { NAV_ITEMS, SOCIALS } from '../../content/site';
import { useOverlay } from '../../hooks/useOverlay';
import { formatClock, useNow } from '../../hooks/useClock';
import { cn } from '../../lib/cn';
import { EASE_IN_OUT, EASE_OUT } from '../../lib/motion';
import { pad2 } from '../../lib/math';
import { scrollToSection } from '../../lib/scroll';
import { Button } from '../ui/Button';
import { LogoMark } from '../ui/LogoMark';
import './MobileMenu.css';

interface MobileMenuProps {
  open: boolean;
  origin: { x: number; y: number };
  active: string | null;
  onClose: () => void;
}

const LINKS = NAV_ITEMS;

function MenuClock() {
  const { time, zone } = formatClock(useNow());
  return (
    <span className="vx-menu__clock">
      {time} <span>{zone}</span>
    </span>
  );
}

interface MenuLayerProps extends Omit<MobileMenuProps, 'open'> {
  onNavigate: (id: string) => void;
  focusTarget: () => HTMLElement | null;
}

function MenuLayer({ origin, active, onClose, onNavigate, focusTarget }: MenuLayerProps) {
  const ref = useOverlay<HTMLDivElement>(true, onClose, { restoreFocus: focusTarget });
  const radius = typeof window === 'undefined' ? 2000 : Math.hypot(window.innerWidth, window.innerHeight) * 1.1;
  const at = `at ${origin.x}px ${origin.y}px`;

  return (
    <motion.div
      ref={ref}
      id="vx-mobile-menu"
      className="vx-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      tabIndex={-1}
      initial={{ clipPath: `circle(0px ${at})` }}
      animate={{ clipPath: `circle(${radius}px ${at})` }}
      exit={{ clipPath: `circle(0px ${at})` }}
      transition={{ duration: 0.75, ease: EASE_IN_OUT }}
    >
      <div className="vx-menu__glow" aria-hidden="true" />
      <div className="vx-menu__top">
        <span className="vx-menu__brand">
          <LogoMark size={24} />
          <span>VELTRIX</span>
        </span>
        <button type="button" className="vx-menu__close" onClick={onClose} aria-label="Close menu" data-autofocus>
          <X size={20} />
        </button>
      </div>

      <nav className="vx-menu__nav" aria-label="Mobile">
        <ol>
          {LINKS.map((item, index) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 48 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT, delay: 0.2 + index * 0.055 } }}
              exit={{ opacity: 0, y: 16, transition: { duration: 0.2 } }}
            >
              <a
                href={`#${item.id}`}
                className={cn('vx-menu__link', active === item.id && 'is-active')}
                aria-current={active === item.id ? 'location' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate(item.id);
                }}
              >
                <span className="vx-menu__index">{pad2(index + 1)}</span>
                <span className="vx-menu__label">{item.label}</span>
                <ArrowUpRight className="vx-menu__arrow" size={22} aria-hidden="true" />
              </a>
            </motion.li>
          ))}
        </ol>
      </nav>

      <motion.div
        className="vx-menu__footer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.55, duration: 0.7, ease: EASE_OUT } }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
      >
        <Button
          href="#work"
          onClick={(event) => {
            event.preventDefault();
            onNavigate('work');
          }}
        >
          Explore work
        </Button>
        <div className="vx-menu__meta">
          <MenuClock />
          <span className="vx-menu__socials">
            {SOCIALS.map((s) => s.label).join(' · ')} <em>(placeholders)</em>
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Full-screen mobile navigation revealed with a circular wipe from the menu button. */
export function MobileMenu({ open, origin, active, onClose }: MobileMenuProps) {
  const pending = useRef<string | null>(null);

  const navigate = (id: string) => {
    pending.current = id;
    // Programmatic scrolling still works while the overlay locks user scrolling,
    // so the page glides into place underneath the closing wipe.
    scrollToSection(id, { focus: false });
    onClose();
  };

  // After navigating, hand focus to the destination section instead of the menu button.
  const focusTarget = () => {
    const id = pending.current;
    pending.current = null;
    const el = id ? document.getElementById(id) : null;
    if (el && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    return el;
  };

  return createPortal(
    <AnimatePresence>
      {open && <MenuLayer origin={origin} active={active} onClose={onClose} onNavigate={navigate} focusTarget={focusTarget} />}
    </AnimatePresence>,
    document.body,
  );
}
