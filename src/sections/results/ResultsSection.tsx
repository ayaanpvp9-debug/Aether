import { useState } from 'react';
import { motion } from 'motion/react';
import { Info } from 'lucide-react';
import { METRICS } from '../../content/results';
import { Counter } from '../../components/ui/Counter';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Switch } from '../../components/ui/Switch';
import { cn } from '../../lib/cn';
import { EASE_OUT } from '../../lib/motion';
import './Results.css';

export function ResultsSection() {
  const [crafted, setCrafted] = useState(true);

  return (
    <section id="results" className="vx-section vx-results" aria-labelledby="results-title">
      <div className="vx-container">
        <SectionHeader
          index="06"
          label="Results"
          titleId="results-title"
          title={
            <>
              Craft that <span className="vx-serif">compounds</span>.
            </>
          }
          aside={
            <span className="vx-notice">
              <Info size={13} aria-hidden="true" /> Illustrative figures — not real client data
            </span>
          }
        >
          A hypothetical scenario showing what tends to move when a generic template becomes a crafted, fast experience. Flip the switch to compare.
        </SectionHeader>

        <div className="vx-results__toggle">
          <button type="button" className={cn('vx-results__option', !crafted && 'is-on')} onClick={() => setCrafted(false)} aria-pressed={!crafted}>
            Generic template
          </button>
          <Switch hideLabel label="Show the crafted scenario" checked={crafted} onChange={setCrafted} />
          <button type="button" className={cn('vx-results__option', crafted && 'is-on')} onClick={() => setCrafted(true)} aria-pressed={crafted}>
            Crafted by VELTRIX
          </button>
        </div>

        <div className="vx-results__grid">
          {METRICS.map((metric, i) => {
            const value = crafted ? metric.crafted : metric.template;
            const max = Math.max(metric.template, metric.crafted);
            return (
              <motion.article
                key={metric.id}
                className={cn('vx-metric', crafted && 'is-crafted')}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.9, ease: EASE_OUT, delay: i * 0.08 }}
              >
                <div className="vx-metric__top">
                  <span className="vx-metric__tag">Illustrative</span>
                  <span className="vx-metric__note">{metric.note}</span>
                </div>
                <Counter value={value} decimals={metric.decimals} suffix={metric.unit} className="vx-metric__value" />
                <h3 className="vx-metric__label">{metric.label}</h3>
                <div className="vx-metric__bars" aria-hidden="true">
                  <div className="vx-metric__bar">
                    <span>Template</span>
                    <motion.i
                      className="vx-metric__fill vx-metric__fill--template"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: metric.template / max }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.2 }}
                    />
                  </div>
                  <div className="vx-metric__bar">
                    <span>Crafted</span>
                    <motion.i
                      className="vx-metric__fill vx-metric__fill--crafted"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: metric.crafted / max }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.35 }}
                    />
                  </div>
                </div>
                <span className="vx-metric__delta">{metric.delta}</span>
              </motion.article>
            );
          })}
        </div>

        <p className="vx-results__footnote">
          * Hypothetical figures for demonstration only. They are not measured results from VELTRIX clients or any real company, and real outcomes
          vary with audience, product and traffic.
        </p>
      </div>
    </section>
  );
}
