import type { IncomingMessage, ServerResponse } from 'node:http';
import { createHash, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { HONEYPOT_FIELD, validateInquiry, type InquiryResponse } from '../shared/inquiry.ts';
import type { Logger, ServerConfig } from './config.ts';
import { HttpError, getClientIp, readJsonBody, sendJson } from './http.ts';
import type { RateLimiter } from './rate-limit.ts';
import { DuplicateReferenceError, type InquiryRecord, type InquiryStore } from './store/index.ts';

export interface ApiDeps {
  store: InquiryStore;
  limiter: RateLimiter;
  config: Pick<ServerConfig, 'adminToken' | 'trustProxy' | 'allowedOrigins' | 'bodyLimit'>;
  logger: Logger;
  now?: () => Date;
}

/** Resolves to true when the request was handled (i.e. it targeted /api). */
export type ApiHandler = (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;

type GenericError = { ok: false; error: 'not_found' | 'method_not_allowed' | 'unauthorized'; message: string };

// Unambiguous alphabet: no 0/O, 1/I/L.
const REFERENCE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const STORAGE_LABEL: Record<InquiryStore['driver'], string> = {
  sqlite: 'SQLite database',
  file: 'JSON Lines file',
  memory: 'in-memory store',
};

export function createReference(): string {
  let reference = 'VX-';
  for (let i = 0; i < 6; i += 1) reference += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return reference;
}

function safeEqual(a: string, b: string): boolean {
  const left = createHash('sha256').update(a).digest();
  const right = createHash('sha256').update(b).digest();
  return timingSafeEqual(left, right);
}

function header(req: IncomingMessage, name: string): string {
  const value = req.headers[name];
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

/** Defence in depth on top of the JSON content-type requirement (which already forces a CORS preflight). */
function isForbiddenOrigin(req: IncomingMessage, allowedOrigins: string[]): boolean {
  const origin = header(req, 'origin').replace(/\/$/, '');
  if (allowedOrigins.length > 0) return origin !== '' && !allowedOrigins.includes(origin);

  const fetchSite = header(req, 'sec-fetch-site');
  if (fetchSite) return fetchSite === 'cross-site';
  if (!origin) return false; // Non-browser client (curl, server-to-server).
  if (origin === 'null') return true;
  try {
    const host = header(req, 'x-forwarded-host') || header(req, 'host');
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

export function createApiHandler({ store, limiter, config, logger, now = () => new Date() }: ApiDeps): ApiHandler {
  const methodNotAllowed = (res: ServerResponse, allow: string) =>
    sendJson(res, 405, { ok: false, error: 'method_not_allowed', message: `Use ${allow}.` } satisfies GenericError, { Allow: allow });

  async function submitInquiry(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const reply = (status: number, body: InquiryResponse, headers?: Record<string, string>) => sendJson(res, status, body, headers);

    if (isForbiddenOrigin(req, config.allowedOrigins)) {
      req.resume();
      return reply(403, { ok: false, error: 'forbidden', message: 'Cross-site submissions are not accepted.' });
    }

    if (!/^application\/json\b/i.test(header(req, 'content-type'))) {
      req.resume();
      return reply(415, { ok: false, error: 'unsupported_media_type', message: 'Send the inquiry as application/json.' });
    }

    const limit = limiter.hit(getClientIp(req, config.trustProxy));
    if (!limit.allowed) {
      req.resume();
      return reply(
        429,
        {
          ok: false,
          error: 'rate_limited',
          message: `Too many inquiries from this connection. Try again in ${formatWait(limit.retryAfterSeconds)}.`,
          retryAfter: limit.retryAfterSeconds,
        },
        { 'Retry-After': String(limit.retryAfterSeconds) },
      );
    }

    const body = await readJsonBody(req, config.bodyLimit);

    const honeypot = body && typeof body === 'object' ? (body as Record<string, unknown>)[HONEYPOT_FIELD] : undefined;
    if (typeof honeypot === 'string' && honeypot.trim() !== '') {
      return reply(400, { ok: false, error: 'rejected', message: 'The submission was rejected by spam protection.' });
    }

    const result = validateInquiry(body);
    if (!result.ok) {
      return reply(422, { ok: false, error: 'validation_failed', message: 'Some fields need attention.', fields: result.errors });
    }

    const record: InquiryRecord = { id: randomUUID(), reference: createReference(), createdAt: now().toISOString(), ...result.data };

    for (let attempt = 1; ; attempt += 1) {
      try {
        await store.insert(record);
        break;
      } catch (error) {
        if (error instanceof DuplicateReferenceError && attempt < 4) {
          record.reference = createReference();
          continue;
        }
        logger.error(`Failed to store inquiry: ${(error as Error).message}`);
        return reply(503, {
          ok: false,
          error: 'storage_unavailable',
          message: 'The inquiry could not be saved, so nothing was stored. Please try again shortly.',
        });
      }
    }

    logger.info(`Inquiry ${record.reference} stored (${store.driver}).`);
    return reply(201, { ok: true, reference: record.reference, receivedAt: record.createdAt, storage: STORAGE_LABEL[store.driver] });
  }

  async function listInquiries(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
    // Without a configured token the endpoint does not exist.
    if (!config.adminToken) {
      return sendJson(res, 404, { ok: false, error: 'not_found', message: 'Not found.' } satisfies GenericError);
    }
    const auth = header(req, 'authorization');
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
    if (!token || !safeEqual(token, config.adminToken)) {
      return sendJson(res, 401, { ok: false, error: 'unauthorized', message: 'A valid bearer token is required.' } satisfies GenericError, {
        'WWW-Authenticate': 'Bearer realm="veltrix-admin"',
      });
    }
    const requested = Number.parseInt(url.searchParams.get('limit') ?? '50', 10);
    const limit = Number.isFinite(requested) ? Math.min(200, Math.max(1, requested)) : 50;
    const [items, total] = await Promise.all([store.list(limit), store.count()]);
    return sendJson(res, 200, { ok: true, total, items });
  }

  return async function handle(req, res) {
    const url = new URL(req.url ?? '/', 'http://veltrix.internal');
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    if (pathname !== '/api' && !pathname.startsWith('/api/')) return false;

    const method = (req.method ?? 'GET').toUpperCase();
    try {
      if (pathname === '/api/health') {
        if (method !== 'GET' && method !== 'HEAD') methodNotAllowed(res, 'GET, HEAD');
        else sendJson(res, 200, { ok: true, status: 'ready', storage: STORAGE_LABEL[store.driver], time: now().toISOString() });
      } else if (pathname === '/api/inquiries') {
        if (method === 'POST') await submitInquiry(req, res);
        else if (method === 'GET') await listInquiries(req, res, url);
        else methodNotAllowed(res, 'GET, POST');
      } else {
        sendJson(res, 404, { ok: false, error: 'not_found', message: 'Unknown API route.' } satisfies GenericError);
      }
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(res, error.status, { ok: false, error: error.code, message: error.message });
      } else {
        logger.error(`Unhandled API error: ${(error as Error).stack ?? String(error)}`);
        sendJson(res, 500, { ok: false, error: 'server_error', message: 'Something went wrong on our side. Nothing was stored.' });
      }
    }
    return true;
  };
}
