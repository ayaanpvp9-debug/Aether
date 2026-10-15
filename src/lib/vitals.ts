import { createStore } from './store';

/** Live Core Web Vitals for the current page view (ms, except CLS). */
export interface Vitals {
  supported: boolean;
  lcp?: number;
  cls?: number;
  inp?: number;
  fcp?: number;
  ttfb?: number;
  transferKb?: number;
  updatedAt?: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface EventEntry extends PerformanceEntry {
  interactionId?: number;
}

export const vitalsStore = createStore<Vitals>({ supported: false });

let started = false;

/** Starts PerformanceObservers once (buffered, so late subscribers still see early entries). */
export function startVitals() {
  if (started || typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;
  started = true;
  const types = PerformanceObserver.supportedEntryTypes ?? [];
  let state: Vitals = { supported: types.length > 0 };
  const update = (patch: Partial<Vitals>) => {
    state = { ...state, ...patch, updatedAt: Date.now() };
    vitalsStore.set(state);
  };

  const observe = (type: string, callback: (entries: PerformanceEntry[]) => void, extra: Record<string, unknown> = {}) => {
    if (!types.includes(type)) return;
    try {
      new PerformanceObserver((list) => callback(list.getEntries())).observe({ type, buffered: true, ...extra } as PerformanceObserverInit);
    } catch {
      // Some engines reject options they do not know — skip that metric.
    }
  };

  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (nav) update({ ttfb: Math.max(0, nav.responseStart) });

  observe('paint', (entries) => {
    const fcp = entries.find((e) => e.name === 'first-contentful-paint');
    if (fcp) update({ fcp: fcp.startTime });
  });

  observe('largest-contentful-paint', (entries) => {
    const last = entries[entries.length - 1];
    if (last) update({ lcp: last.startTime });
  });

  let cls = 0;
  observe('layout-shift', (entries) => {
    for (const entry of entries as LayoutShiftEntry[]) if (!entry.hadRecentInput) cls += entry.value;
    update({ cls });
  });
  if (types.includes('layout-shift')) update({ cls: 0 });

  let inp = 0;
  observe(
    'event',
    (entries) => {
      for (const entry of entries as EventEntry[]) if (entry.interactionId) inp = Math.max(inp, entry.duration);
      if (inp > 0) update({ inp });
    },
    { durationThreshold: 16 },
  );

  const measureTransfer = () => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const bytes =
      resources.filter((r) => r.initiatorType === 'script' || r.initiatorType === 'link' || r.initiatorType === 'css').reduce((sum, r) => sum + (r.transferSize || 0), 0) +
      (nav?.transferSize ?? 0);
    if (bytes > 0) update({ transferKb: Math.round(bytes / 1024) });
  };
  if (document.readyState === 'complete') measureTransfer();
  else window.addEventListener('load', () => setTimeout(measureTransfer, 0), { once: true });
}
