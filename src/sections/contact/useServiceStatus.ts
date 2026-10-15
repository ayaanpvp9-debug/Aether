import { useCallback, useEffect, useState } from 'react';

export type ServiceState =
  | { status: 'checking' }
  | { status: 'online'; storage: string }
  | { status: 'offline'; reason: string };

/** Checks whether the inquiry API is actually reachable from this deployment. */
export function useServiceStatus() {
  const [state, setState] = useState<ServiceState>({ status: 'checking' });

  const check = useCallback(async () => {
    setState({ status: 'checking' });
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 8000);
      const res = await fetch('/api/health', { cache: 'no-store', headers: { Accept: 'application/json' }, signal: controller.signal });
      window.clearTimeout(timer);
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok || !type.includes('application/json')) {
        const reason =
          res.ok || res.status === 404
            ? 'No inquiry API on this host — this looks like a static deployment.'
            : `The API answered with HTTP ${res.status}.`;
        setState({ status: 'offline', reason });
        return;
      }
      const body = (await res.json()) as { ok?: boolean; storage?: string };
      setState(body.ok ? { status: 'online', storage: body.storage ?? 'server storage' } : { status: 'offline', reason: 'The API reported it is not ready.' });
    } catch (error) {
      setState({ status: 'offline', reason: (error as Error).name === 'AbortError' ? 'The API did not respond in time.' : 'The API could not be reached.' });
    }
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => void check());
    return () => cancelAnimationFrame(frame);
  }, [check]);

  return { state, recheck: check };
}
