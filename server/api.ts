import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from './http.ts';

export interface ApiDeps {
  now?: () => Date;
  /** Seconds since the process started (injectable for tests). */
  uptime?: () => number;
}

/** Resolves to true when the request was handled (i.e. it targeted /api). */
export type ApiHandler = (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;

type ApiError = { ok: false; error: 'not_found' | 'method_not_allowed'; message: string };

/**
 * The site's only API: a health endpoint, used by the hosting platform's health
 * check and by the live "Ping live API" demo in the Capabilities section.
 * VELTRIX is a showcase — there is no form endpoint and nothing is stored, so
 * every other /api route answers 404.
 */
export function createApiHandler({ now = () => new Date(), uptime = () => process.uptime() }: ApiDeps = {}): ApiHandler {
  return (req, res) => {
    const url = new URL(req.url ?? '/', 'http://veltrix.internal');
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    if (pathname !== '/api' && !pathname.startsWith('/api/')) return Promise.resolve(false);

    const method = (req.method ?? 'GET').toUpperCase();
    if (pathname === '/api/health') {
      if (method === 'GET' || method === 'HEAD') {
        sendJson(res, 200, { ok: true, status: 'ready', service: 'veltrix', uptime: Math.round(uptime()), time: now().toISOString() });
      } else {
        sendJson(res, 405, { ok: false, error: 'method_not_allowed', message: 'Use GET, HEAD.' } satisfies ApiError, { Allow: 'GET, HEAD' });
      }
    } else {
      sendJson(res, 404, { ok: false, error: 'not_found', message: 'Unknown API route.' } satisfies ApiError);
    }
    return Promise.resolve(true);
  };
}
