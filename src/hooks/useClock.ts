import { useSyncExternalStore } from 'react';

// One shared 1s ticker for every clock on the page.
const listeners = new Set<() => void>();
let timer: number | undefined;
let snapshot = Date.now();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === undefined) {
    timer = window.setInterval(() => {
      snapshot = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

/** Current timestamp, refreshed every second. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, () => snapshot, () => 0);
}

export function formatClock(ms: number): { time: string; zone: string } {
  const date = new Date(ms);
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const zone =
    new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(date).find((p) => p.type === 'timeZoneName')?.value ?? 'LOCAL';
  return { time, zone };
}
