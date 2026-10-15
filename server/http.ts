import type { IncomingMessage, ServerResponse } from 'node:http';
import { isIP } from 'node:net';
import type { ClientIpConfig } from './config.ts';

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): void {
  if (res.headersSent) return;
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(payload);
}

/** Reads and parses a JSON body, enforcing a byte limit while streaming. */
export async function readJsonBody(req: IncomingMessage, limit: number): Promise<unknown> {
  const declared = Number(req.headers['content-length'] ?? 0);
  if (declared > limit) {
    req.resume();
    throw new HttpError(413, 'payload_too_large', 'The inquiry is larger than the server accepts.');
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer);
    size += buffer.length;
    if (size > limit) {
      throw new HttpError(413, 'payload_too_large', 'The inquiry is larger than the server accepts.');
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) throw new HttpError(400, 'invalid_json', 'Request body is empty.');
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'invalid_json', 'Request body is not valid JSON.');
  }
}

/**
 * Resolves the client IP used as the rate-limit key.
 *
 * 1. `header` — a header the hosting edge always overwrites (Render: `true-client-ip`).
 * 2. `trustedProxies` — X-Forwarded-For read from the RIGHT: each trusted proxy appends the
 *    address it received the request from, so everything further left is client-controlled
 *    and must never be trusted (a leftmost-entry lookup is trivially spoofable).
 * 3. Otherwise the TCP peer address.
 */
export function getClientIp(req: IncomingMessage, options: ClientIpConfig): string {
  if (options.header) {
    const raw = req.headers[options.header];
    const value = (Array.isArray(raw) ? raw[raw.length - 1] : raw)?.trim();
    if (value && isIP(value)) return value;
  }
  if (options.trustedProxies > 0) {
    const raw = req.headers['x-forwarded-for'];
    // Node joins repeated X-Forwarded-For headers with ", " in arrival order.
    const hops = (Array.isArray(raw) ? raw.join(',') : (raw ?? ''))
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    const candidate = hops[hops.length - options.trustedProxies];
    if (candidate && isIP(candidate)) return candidate;
  }
  return req.socket.remoteAddress ?? 'unknown';
}
