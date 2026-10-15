import path from 'node:path';

export type StoreDriver = 'auto' | 'sqlite' | 'file';

export interface ServerConfig {
  port: number;
  host: string;
  dataDir: string;
  storeDriver: StoreDriver;
  /** Enables the admin listing endpoint when set (≥ 24 chars). */
  adminToken: string | null;
  trustProxy: boolean;
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
    trustProxy: /^(1|true|yes)$/i.test(env.TRUST_PROXY ?? ''),
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
