import { useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { NAV_ITEMS, SITE, SOCIALS } from '../../content/site';
import { formatClock, useNow } from '../../hooks/useClock';
import { EASE_OUT } from '../../lib/motion';
import { scrollToSection } from '../../lib/scroll';
import { Button } from '../ui/Button';
import { RollText } from '../ui/RollText';
import './Footer.css';

const EXPLORE = [...NAV_ITEMS, { id: 'results', label: 'Results' }, { id: 'contact', label: 'Contact' }];

function FooterClock() {
  const { time, zone } = formatClock(useNow());
  return (
    <span className="vx-footer__clock">
      {time} {zone}
    </span>
  );
}

export function Footer() {
  const wordRef = useRef<HTMLDivElement>(null);

  // Spotlight follows the pointer across the giant wordmark (CSS vars only).
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = wordRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--sx', `${event.clientX - rect.left}px`);
    el.style.setProperty('--sy', `${event.clientY - rect.top}px`);
  };

  return (
    <footer className="vx-footer" aria-labelledby="footer-title">
      <div className="vx-container">
        <div className="vx-footer__top">
          <motion.div
            className="vx-footer__cta"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1, ease: EASE_OUT }}
          >
            <span className="vx-eyebrow">
              <span className="vx-eyebrow__index">(10)</span> Next chapter
            </span>
            <h2 id="footer-title" className="vx-footer__headline">
              Have something <span className="vx-serif">ambitious</span> in mind?
            </h2>
            <Button href="#contact" cursorLabel="Let’s talk">
              Start a project
            </Button>
          </motion.div>

          <nav className="vx-footer__cols" aria-label="Footer">
            <div className="vx-footer__col">
              <h3>Explore</h3>
              <ul>
                {EXPLORE.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="vx-footer__link vx-roll-host"
                      onClick={(event) => {
                        event.preventDefault();
                        scrollToSection(item.id);
                      }}
                      data-cursor="link"
                    >
                      <RollText text={item.label} />
                      <ArrowUpRight size={14} aria-hidden="true" className="vx-footer__link-icon" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="vx-footer__col">
              <h3>
                Social <span className="vx-footer__badge">Placeholders</span>
              </h3>
              <ul>
                {SOCIALS.map((social) => (
                  <li key={social.label}>
                    {social.href ? (
                      <a href={social.href} className="vx-footer__link vx-roll-host" target="_blank" rel="noreferrer" data-cursor="link">
                        <RollText text={social.label} />
                        <ArrowUpRight size={14} aria-hidden="true" className="vx-footer__link-icon" />
                      </a>
                    ) : (
                      <span className="vx-footer__placeholder">
                        {social.label}
                        <span className="sr-only"> — placeholder, no profile linked yet</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="vx-footer__note">Profiles are not live yet — add real URLs in content/site.ts.</p>
            </div>
            <div className="vx-footer__col">
              <h3>Studio</h3>
              <ul className="vx-footer__info">
                <li>Remote-first · Worldwide</li>
                <li>
                  {SITE.email}
                  <span className="vx-footer__badge">Placeholder</span>
                </li>
                <li>
                  Local time <FooterClock />
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div ref={wordRef} className="vx-footer__wordmark" onPointerMove={onPointerMove} aria-hidden="true">
          <span className="vx-footer__word">VELTRIX</span>
          <span className="vx-footer__word vx-footer__word--lit">VELTRIX</span>
        </div>

        <div className="vx-footer__bottom">
          <p>
            © {SITE.year} VELTRIX — a concept studio experience. Projects, testimonials and figures shown are fictional or illustrative.
          </p>
          <button type="button" className="vx-footer__totop vx-roll-host" onClick={() => scrollToSection('top')} data-cursor="link">
            <RollText text="Back to top" />
            <span className="vx-footer__totop-icon" aria-hidden="true">
              <ArrowUp size={15} />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
