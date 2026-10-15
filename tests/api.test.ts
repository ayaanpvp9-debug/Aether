import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createApiHandler } from '../server/api.ts';
import { createRateLimiter, type RateLimiter } from '../server/rate-limit.ts';
import { createInquiryStore } from '../server/store/index.ts';
import { createMemoryStore } from '../server/store/memory.ts';
import type { InquiryStore } from '../server/store/types.ts';
import type { ClientIpConfig, Logger } from '../server/config.ts';

const silent: Logger = { info: () => {}, warn: () => {}, error: () => {} };
const ADMIN_TOKEN = 'test-admin-token-0123456789abcdef';

const validInquiry = {
  name: 'Grace Hopper',
  email: 'grace@example.com',
  company: '',
  projectTypes: ['full-stack'],
  budget: '25k-50k',
  timeline: 'flexible',
  message: 'We need a fast, accessible product site with a real backend.',
};

interface Harness {
  url: string;
  store: InquiryStore;
  limiter: RateLimiter;
  close(): Promise<void>;
}

async function startHarness(
  options: { store?: InquiryStore; max?: number; adminToken?: string | null; clientIp?: ClientIpConfig; ephemeralStorage?: boolean } = {},
): Promise<Harness> {
  const store = options.store ?? createMemoryStore();
  const limiter = createRateLimiter({ max: options.max ?? 50, windowMs: 60_000 });
  const handle = createApiHandler({
    store,
    limiter,
    logger: silent,
    ephemeralStorage: options.ephemeralStorage,
    config: {
      adminToken: options.adminToken ?? null,
      clientIp: options.clientIp ?? { header: null, trustedProxies: 0 },
      allowedOrigins: [],
      bodyLimit: 16 * 1024,
    },
  });
  const server = http.createServer((req, res) => {
    handle(req, res).then((handled) => {
      if (!handled) res.writeHead(418).end('not api');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    store,
    limiter,
    close: () =>
      new Promise<void>((resolve) => {
        limiter.dispose();
        server.close(() => resolve());
      }),
  };
}

interface ApiBody {
  ok?: boolean;
  status?: string;
  storage?: string;
  persistent?: boolean;
  error?: string;
  reference?: string;
  fields?: Record<string, string>;
  total?: number;
  items?: unknown[];
}

const json = async (res: Response) => (await res.json()) as ApiBody;

const postJson = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${url}/api/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('inquiry API', () => {
  let h: Harness;
  beforeAll(async () => {
    h = await startHarness({ adminToken: ADMIN_TOKEN });
  });
  afterAll(() => h.close());
  afterEach(() => h.limiter.reset());

  it('reports health', async () => {
    const res = await fetch(`${h.url}/api/health`);
    expect(res.status).toBe(200);
    expect(await json(res)).toMatchObject({ ok: true, status: 'ready' });
  });

  it('stores a valid inquiry and returns a reference', async () => {
    const before = await h.store.count();
    const res = await postJson(h.url, validInquiry);
    expect(res.status).toBe(201);
    const body = await json(res);
    expect(body.ok).toBe(true);
    expect(body.reference).toMatch(/^VX-[2-9A-HJKMNP-Z]{6}$/);
    expect(await h.store.count()).toBe(before + 1);
    const [latest] = await h.store.list(1);
    expect(latest).toMatchObject({ reference: body.reference, email: 'grace@example.com', projectTypes: ['full-stack'] });
  });

  it('returns field errors for invalid data (422) without storing', async () => {
    const before = await h.store.count();
    const res = await postJson(h.url, { ...validInquiry, email: 'bad', message: 'short' });
    expect(res.status).toBe(422);
    const body = await json(res);
    expect(body.error).toBe('validation_failed');
    expect(Object.keys(body.fields ?? {}).sort()).toEqual(['email', 'message']);
    expect(await h.store.count()).toBe(before);
  });

  it('rejects malformed JSON (400)', async () => {
    const res = await postJson(h.url, '{"name": ');
    expect(res.status).toBe(400);
    expect((await json(res)).error).toBe('invalid_json');
  });

  it('rejects non-JSON content types (415)', async () => {
    const res = await fetch(`${h.url}/api/inquiries`, { method: 'POST', body: 'name=x', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    expect(res.status).toBe(415);
  });

  it('rejects oversized payloads (413)', async () => {
    const res = await postJson(h.url, { ...validInquiry, message: 'x'.repeat(20_000) });
    expect(res.status).toBe(413);
  });

  it('rejects honeypot submissions (400)', async () => {
    const res = await postJson(h.url, { ...validInquiry, website: 'https://spam.example' });
    expect(res.status).toBe(400);
    expect((await json(res)).error).toBe('rejected');
  });

  it('rejects cross-site browser requests (403)', async () => {
    const res = await postJson(h.url, validInquiry, { 'Sec-Fetch-Site': 'cross-site' });
    expect(res.status).toBe(403);
  });

  it('answers unknown routes and methods correctly', async () => {
    expect((await fetch(`${h.url}/api/nope`)).status).toBe(404);
    const del = await fetch(`${h.url}/api/inquiries`, { method: 'DELETE' });
    expect(del.status).toBe(405);
    expect(del.headers.get('allow')).toBe('GET, POST');
    expect((await fetch(`${h.url}/not-api`)).status).toBe(418);
  });

  it('protects the admin listing with a bearer token', async () => {
    expect((await fetch(`${h.url}/api/inquiries`)).status).toBe(401);
    expect((await fetch(`${h.url}/api/inquiries`, { headers: { Authorization: 'Bearer wrong-token' } })).status).toBe(401);
    const ok = await fetch(`${h.url}/api/inquiries?limit=5`, { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } });
    expect(ok.status).toBe(200);
    const body = await json(ok);
    expect(body.total).toBeGreaterThan(0);
    expect(Array.isArray(body.items)).toBe(true);
  });
});

describe('API hardening', () => {
  it('hides the admin listing entirely when no token is configured', async () => {
    const h = await startHarness({ adminToken: null });
    expect((await fetch(`${h.url}/api/inquiries`)).status).toBe(404);
    await h.close();
  });

  it('rate limits repeated submissions (429 + Retry-After)', async () => {
    const h = await startHarness({ max: 2 });
    expect((await postJson(h.url, validInquiry)).status).toBe(201);
    expect((await postJson(h.url, validInquiry)).status).toBe(201);
    const limited = await postJson(h.url, validInquiry);
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0);
    await h.close();
  });

  it('reports storage failures honestly (503)', async () => {
    const broken: InquiryStore = {
      ...createMemoryStore(),
      insert: async () => {
        throw new Error('disk full');
      },
    };
    const h = await startHarness({ store: broken });
    const res = await postJson(h.url, validInquiry);
    expect(res.status).toBe(503);
    expect((await json(res)).error).toBe('storage_unavailable');
    await h.close();
  });
});

describe('hosting behaviour (Render)', () => {
  it('fails the health check (503) when the store cannot answer a query', async () => {
    const broken: InquiryStore = {
      ...createMemoryStore(),
      count: async () => {
        throw new Error('disk detached');
      },
    };
    const h = await startHarness({ store: broken });
    const res = await fetch(`${h.url}/api/health`);
    expect(res.status).toBe(503);
    expect(await json(res)).toMatchObject({ ok: false, status: 'unavailable' });
    await h.close();
  });

  it('labels storage as temporary on an ephemeral filesystem — in health and in the success reply', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'veltrix-ephemeral-'));
    const store = await createInquiryStore({ driver: 'file', dataDir: dir, logger: silent });

    const durable = await startHarness({ store });
    expect(await json(await fetch(`${durable.url}/api/health`))).toMatchObject({ storage: 'JSON Lines file', persistent: true });
    await durable.close();

    const temporary = await startHarness({ store, ephemeralStorage: true });
    expect(await json(await fetch(`${temporary.url}/api/health`))).toMatchObject({ storage: 'temporary JSON Lines file', persistent: false });
    const created = await postJson(temporary.url, validInquiry);
    expect(created.status).toBe(201);
    expect((await json(created)).storage).toBe('temporary JSON Lines file');
    await temporary.close();

    await store.close();
    await rm(dir, { recursive: true, force: true });
  });

  it('rate limits per visitor using the edge client-IP header (true-client-ip)', async () => {
    const h = await startHarness({ max: 1, clientIp: { header: 'true-client-ip', trustedProxies: 0 } });
    const from = (ip: string) => postJson(h.url, validInquiry, { 'True-Client-IP': ip });
    expect((await from('203.0.113.10')).status).toBe(201);
    expect((await from('203.0.113.10')).status).toBe(429);
    // A different visitor behind the same proxy is not blocked by someone else's quota.
    expect((await from('203.0.113.11')).status).toBe(201);
    await h.close();
  });

  it('ignores spoofed leftmost X-Forwarded-For entries when trusting proxies', async () => {
    const h = await startHarness({ max: 1, clientIp: { header: null, trustedProxies: 1 } });
    const via = (xff: string) => postJson(h.url, validInquiry, { 'X-Forwarded-For': xff });
    expect((await via('198.51.100.1, 203.0.113.50')).status).toBe(201);
    // Changing the client-controlled (left) part must not mint a fresh rate-limit bucket.
    expect((await via('198.51.100.2, 203.0.113.50')).status).toBe(429);
    await h.close();
  });
});

describe('persistent stores', () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'veltrix-test-'));
  });
  afterAll(() => rm(dir, { recursive: true, force: true }));

  it.each(['sqlite', 'file'] as const)('%s store persists across reopen', async (driver) => {
    const dataDir = path.join(dir, driver);
    const store = await createInquiryStore({ driver, dataDir, logger: silent });
    expect(store.driver).toBe(driver);
    const h = await startHarness({ store });
    const res = await postJson(h.url, validInquiry);
    const { reference } = await json(res);
    await h.close();
    await store.close();

    const reopened = await createInquiryStore({ driver, dataDir, logger: silent });
    expect(await reopened.count()).toBe(1);
    expect((await reopened.list(10))[0]?.reference).toBe(reference);
    await reopened.close();

    if (driver === 'file') {
      const raw = await readFile(path.join(dataDir, 'inquiries.jsonl'), 'utf8');
      expect(raw.trim().split('\n')).toHaveLength(1);
    }
  });
});
