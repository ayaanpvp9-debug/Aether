/**
 * Illustrative, hypothetical figures used to demonstrate the kind of impact
 * craft and performance can have. NOT measured results from real clients.
 */
export interface Metric {
  id: string;
  label: string;
  unit: string;
  prefix?: string;
  decimals: number;
  template: number;
  crafted: number;
  /** Whether a lower value is better (e.g. bounce rate). */
  lowerIsBetter?: boolean;
  note: string;
  /** Human-readable comparison, e.g. "+171% vs template". */
  delta: string;
}

export const METRICS: Metric[] = [
  { id: 'engagement', label: 'Avg. engagement time', unit: 's', decimals: 0, template: 52, crafted: 141, note: 'Seconds per session', delta: '+171% vs template' },
  { id: 'conversion', label: 'Conversion rate', unit: '%', decimals: 1, template: 1.4, crafted: 3.6, note: 'Visitors to inquiries', delta: '2.6× the template rate' },
  { id: 'bounce', label: 'Bounce rate', unit: '%', decimals: 0, template: 61, crafted: 34, lowerIsBetter: true, note: 'Single-page sessions', delta: '−27 pts vs template' },
  { id: 'performance', label: 'Lighthouse performance', unit: '', decimals: 0, template: 64, crafted: 98, note: 'Mobile lab score', delta: '+34 points vs template' },
];
