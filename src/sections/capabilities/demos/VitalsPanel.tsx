import { motion } from 'motion/react';
import { useStore } from '../../../lib/store';
import { vitalsStore, type Vitals } from '../../../lib/vitals';

type Rating = 'good' | 'ni' | 'poor' | 'na';

interface Metric {
  key: 'lcp' | 'cls' | 'inp';
  label: string;
  full: string;
  good: number;
  poor: number;
  format: (v: number) => string;
}

const GAUGES: Metric[] = [
  { key: 'lcp', label: 'LCP', full: 'Largest Contentful Paint', good: 2500, poor: 4000, format: (v) => `${(v / 1000).toFixed(2)} s` },
  { key: 'cls', label: 'CLS', full: 'Cumulative Layout Shift', good: 0.1, poor: 0.25, format: (v) => v.toFixed(3) },
  { key: 'inp', label: 'INP', full: 'Interaction to Next Paint (approx.)', good: 200, poor: 500, format: (v) => `${Math.round(v)} ms` },
];

const RATING_LABEL: Record<Rating, string> = { good: 'Good', ni: 'Needs work', poor: 'Poor', na: 'Waiting' };

function rate(value: number | undefined, good: number, poor: number): Rating {
  if (value === undefined) return 'na';
  if (value <= good) return 'good';
  if (value <= poor) return 'ni';
  return 'poor';
}

function Gauge({ metric, vitals }: { metric: Metric; vitals: Vitals }) {
  const value = vitals[metric.key];
  const rating = rate(value, metric.good, metric.poor);
  const fill = value === undefined ? 0 : Math.max(0.04, Math.min(1, value / (metric.poor * 1.25)));
  return (
    <li className={`vx-vital vx-vital--${rating}`}>
      <svg viewBox="0 0 64 64" className="vx-vital__ring" aria-hidden="true">
        <circle cx="32" cy="32" r="27" className="vx-vital__track" />
        <motion.circle
          cx="32"
          cy="32"
          r="27"
          className="vx-vital__value"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: fill }}
          viewport={{ once: false }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="vx-vital__label" title={metric.full}>
        {metric.label}
      </span>
      <span className="vx-vital__number">{value === undefined ? (metric.key === 'inp' ? 'Interact' : '—') : metric.format(value)}</span>
      <span className="vx-vital__rating">{value === undefined && metric.key === 'inp' ? 'Click anything' : RATING_LABEL[rating]}</span>
    </li>
  );
}

/** Real Core Web Vitals for this page view, via PerformanceObserver. */
export function VitalsPanel() {
  const vitals = useStore(vitalsStore);

  if (!vitals.supported) {
    return <p className="vx-vitals__unsupported">Live performance metrics aren’t exposed by this browser, so nothing is shown rather than made up.</p>;
  }

  return (
    <div className="vx-vitals">
      <ul className="vx-vitals__gauges">
        {GAUGES.map((metric) => (
          <Gauge key={metric.key} metric={metric} vitals={vitals} />
        ))}
      </ul>
      <dl className="vx-vitals__rows">
        <div>
          <dt>First paint</dt>
          <dd>{vitals.fcp !== undefined ? `${(vitals.fcp / 1000).toFixed(2)} s` : '—'}</dd>
        </div>
        <div>
          <dt>Server response</dt>
          <dd>{vitals.ttfb !== undefined ? `${Math.round(vitals.ttfb)} ms` : '—'}</dd>
        </div>
        <div>
          <dt>Transferred</dt>
          <dd>{vitals.transferKb !== undefined ? `${vitals.transferKb} KB` : 'cached'}</dd>
        </div>
      </dl>
      <p className="vx-demo-hint">Measured live in this browser session · updates as you interact</p>
    </div>
  );
}
