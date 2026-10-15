import path from 'node:path';

export type StoreDriver = 'auto' | 'sqlite' | 'file';

/** How the client IP used for rate limiting is derived (see `getClientIp`). */
export interface ClientIpConfig {
  /**
   * Header set by the hosting edge that always overwrites any client-sent value
   * (e.g. `true-client-ip` on Render). Lower-case; null to disable.
   */
  header: string | null;
  /** Number of trusted reverse proxies that append to X-Forwarded-For (0 = ignore the header). */
  trustedProxies: number;
}

export interface ServerConfig {
  port: number;
  host: string;
  dataDir: string;
  storeDriver: StoreDriver;
  /** Enables the admin listing endpoint when set (≥ 24 chars). */
  adminToken: string | null;
  clientIp: ClientIpConfig;
  allowedOrigins: string[];
  rateLimit: { max: number; windowMs: number };
  /** Maximum accepted request body in bytes. */
  bodyLimit: number;
}

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export const consoleLogger: Logger = {
  info: (m) => console.log(`[veltrix] ${m}`),
  warn: (m) => console.warn(`[veltrix] ${m}`),
  error: (m) => console.error(`[veltrix] ${m}`),
};

function toInt(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

/** TRUST_PROXY: unset/false → 0, true/yes → 1, or an explicit hop count (1–10). */
function parseTrustedProxies(value: string | undefined, logger: Logger): number {
  const raw = (value ?? '').trim().toLowerCase();
  if (raw === '' || raw === 'false' || raw === 'no' || raw === '0') return 0;
  if (raw === 'true' || raw === 'yes') return 1;
  const hops = Number(raw);
  if (Number.isInteger(hops) && hops >= 1 && hops <= 10) return hops;
  logger.warn(`Ignoring TRUST_PROXY="${value}" — use false, true or a proxy count between 1 and 10.`);
  return 0;
}

function parseClientIpHeader(value: string | undefined, logger: Logger): string | null {
  const raw = (value ?? '').trim().toLowerCase();
  if (raw === '') return null;
  if (/^[a-z0-9-]{1,64}$/.test(raw)) return raw;
  logger.warn(`Ignoring CLIENT_IP_HEADER="${value}" — expected a header name such as true-client-ip.`);
  return null;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env, logger: Logger = consoleLogger): ServerConfig {
  const driver = (env.INQUIRY_STORE ?? 'auto').trim().toLowerCase();
  const storeDriver: StoreDriver = driver === 'sqlite' || driver === 'file' ? driver : 'auto';

  let adminToken: string | null = (env.ADMIN_TOKEN ?? '').trim() || null;
  if (adminToken && adminToken.length < 24) {
    logger.warn('ADMIN_TOKEN is shorter than 24 characters — the admin endpoint stays disabled.');
    adminToken = null;
  }

  return {
    port: toInt(env.PORT, 3000, 1, 65535),
    host: (env.HOST ?? '0.0.0.0').trim() || '0.0.0.0',
    dataDir: path.resolve(env.DATA_DIR?.trim() || 'data'),
    storeDriver,
    adminToken,
    clientIp: {
      header: parseClientIpHeader(env.CLIENT_IP_HEADER, logger),
      trustedProxies: parseTrustedProxies(env.TRUST_PROXY, logger),
    },
    allowedOrigins: (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim().replace(/\/$/, ''))
      .filter(Boolean),
    rateLimit: {
      max: toInt(env.RATE_LIMIT_MAX, 8, 1, 10_000),
      windowMs: toInt(env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000, 1_000, 24 * 60 * 60 * 1000),
    },
    bodyLimit: 16 * 1024,
  };
}
