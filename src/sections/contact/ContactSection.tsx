import { motion } from 'motion/react';
import { CircleCheck, CircleDashed, Database, RefreshCcw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { SITE } from '../../content/site';
import { EASE_OUT } from '../../lib/motion';
import { InquiryForm } from './InquiryForm';
import { useServiceStatus } from './useServiceStatus';
import './Contact.css';

export function ContactSection() {
  const { state, recheck } = useServiceStatus();

  return (
    <section id="contact" className="vx-section vx-contact" aria-labelledby="contact-title">
      <div className="vx-contact__glow" aria-hidden="true" />
      <div className="vx-container vx-contact__layout">
        <div className="vx-contact__intro">
          <span className="vx-eyebrow">
            <span className="vx-eyebrow__index">(09)</span>
            <span className="vx-sh__rule" aria-hidden="true" />
            Contact
          </span>
          <motion.h2
            id="contact-title"
            className="vx-contact__title"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1, ease: EASE_OUT }}
          >
            Let’s build something <span className="vx-serif">unforgettable</span>.
          </motion.h2>
          <p className="vx-lede">Share the ambition, the audience and the constraints. A few honest sentences beat a perfect brief.</p>

          <div className={`vx-status vx-status--${state.status}`} role="status" aria-live="polite">
            <span className="vx-status__icon" aria-hidden="true">
              {state.status === 'online' ? <CircleCheck size={16} /> : state.status === 'offline' ? <TriangleAlert size={16} /> : <CircleDashed size={16} className="vx-btn__spinner" />}
            </span>
            <span className="vx-status__text">
              {state.status === 'checking' && 'Checking the inquiry service…'}
              {state.status === 'online' && (
                <>
                  <strong>Inquiry service online.</strong> Briefs are validated and stored in a {state.storage}.
                </>
              )}
              {state.status === 'offline' && (
                <>
                  <strong>Inquiry service unreachable.</strong> {state.reason}
                </>
              )}
            </span>
            {state.status === 'offline' && (
              <button type="button" className="vx-status__retry" onClick={() => void recheck()} aria-label="Check the inquiry service again">
                <RefreshCcw size={14} />
              </button>
            )}
          </div>

          <ol className="vx-contact__steps">
            <li>
              <ShieldCheck size={18} aria-hidden="true" />
              <span>
                <strong>Validated twice.</strong> Checked as you type, then re-validated and sanitised on the server.
              </span>
            </li>
            <li>
              <Database size={18} aria-hidden="true" />
              <span>
                <strong>Stored with a reference.</strong> Saved to this site’s database — you get a code like VX-7K2M9Q.
              </span>
            </li>
            <li>
              <CircleCheck size={18} aria-hidden="true" />
              <span>
                <strong>No false promises.</strong> This demo sends no email; it only confirms what the server actually stored.
              </span>
            </li>
          </ol>

          <p className="vx-contact__direct">
            Prefer email? <span className="vx-contact__email">{SITE.email}</span>
            <span className="vx-footer__badge">Placeholder</span>
          </p>
        </div>

        <InquiryForm service={state} />
      </div>
    </section>
  );
}
