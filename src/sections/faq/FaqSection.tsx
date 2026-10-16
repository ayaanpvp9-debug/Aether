import { motion } from 'motion/react';
import { FAQ_ITEMS } from '../../content/faq';
import { Accordion } from '../../components/ui/Accordion';
import { EASE_OUT } from '../../lib/motion';
import './Faq.css';

export function FaqSection() {
  return (
    <section id="faq" className="vx-section vx-faq" aria-labelledby="faq-title">
      <div className="vx-container vx-faq__layout">
        <div className="vx-faq__intro">
          <span className="vx-eyebrow">
            <span className="vx-eyebrow__index">(08)</span>
            <span className="vx-sh__rule" aria-hidden="true" />
            FAQ
          </span>
          <motion.h2
            id="faq-title"
            className="vx-h2"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1, ease: EASE_OUT }}
          >
            Questions, <span className="vx-serif">answered</span>.
          </motion.h2>
          <p className="vx-lede">Straight answers about how this studio concept works — including what is real and what is illustrative.</p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1, ease: EASE_OUT, delay: 0.1 }}
        >
          <Accordion items={FAQ_ITEMS.map((item) => ({ id: item.id, title: item.question, content: <p>{item.answer}</p> }))} defaultOpen="real" />
        </motion.div>
      </div>
    </section>
  );
}
