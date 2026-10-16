import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApiHandler } from '../server/api.ts';
import { createVeltrixApi } from '../server/middleware.ts';

interface Harness {
  url: string;
  close(): Promise<void>;
}

const FIXED_NOW = new Date('2026-10-16T12:00:00.000Z');

async function startHarness(): Promise<Harness> {
  const handle = createApiHandler({ now: () => FIXED_NOW, uptime: () => 42.4 });
  const server = http.createServer((req, res) => {
    void handle(req, res).then((handled) => {
      if (!handled) res.writeHead(418).end('not api');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

interface ApiBody {
  ok?: boolean;
  status?: string;
  service?: string;
  uptime?: number;
  time?: string;
  error?: string;
}

const json = async (res: Response) => (await res.json()) as ApiBody;

describe('site API', () => {
  let h: Harness;
  beforeAll(async () => {
    h = await startHarness();
  });
  afterAll(() => h.close());

  it('reports health (used by the hosting health check and the live ping demo)', async () => {
    const res = await fetch(`${h.url}/api/health`);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await json(res)).toEqual({ ok: true, status: 'ready', service: 'veltrix', uptime: 42, time: FIXED_NOW.toISOString() });
  });

  it('answers HEAD and tolerates a trailing slash on the health endpoint', async () => {
    expect((await fetch(`${h.url}/api/health`, { method: 'HEAD' })).status).toBe(200);
    expect((await fetch(`${h.url}/api/health/`)).status).toBe(200);
  });

  it('rejects other methods on the health endpoint with 405 + Allow', async () => {
    const res = await fetch(`${h.url}/api/health`, { method: 'POST' });
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, HEAD');
    expect((await json(res)).error).toBe('method_not_allowed');
  });

  it('has no inquiry endpoint — submissions and listings are not accepted', async () => {
    const post = await fetch(`${h.url}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Grace Hopper', email: 'grace@example.com', message: 'Hello' }),
    });
    expect(post.status).toBe(404);
    expect((await json(post)).error).toBe('not_found');

    const list = await fetch(`${h.url}/api/inquiries`, { headers: { Authorization: 'Bearer anything-at-all-0123456789' } });
    expect(list.status).toBe(404);
  });

  it('answers unknown API routes with a JSON 404', async () => {
    for (const route of ['/api', '/api/unknown', '/api/health/extra']) {
      const res = await fetch(`${h.url}${route}`);
      expect(res.status).toBe(404);
      expect(res.headers.get('content-type')).toContain('application/json');
    }
  });

  it('leaves non-API paths to the static server', async () => {
    for (const route of ['/', '/index.html', '/apis', '/assets/app.js']) {
      const res = await fetch(`${h.url}${route}`);
      expect(res.status).toBe(418);
    }
  });
});

describe('connect middleware (Vite dev & preview)', () => {
  it('handles /api routes and passes everything else on', async () => {
    const { middleware } = createVeltrixApi({ env: {} });
    let passedOn = 0;
    const server = http.createServer((req, res) =>
      middleware(req, res, () => {
        passedOn += 1;
        res.writeHead(204).end();
      }),
    );
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    try {
      expect((await fetch(`http://127.0.0.1:${port}/api/health`)).status).toBe(200);
      expect(passedOn).toBe(0);
      expect((await fetch(`http://127.0.0.1:${port}/`)).status).toBe(204);
      expect(passedOn).toBe(1);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
