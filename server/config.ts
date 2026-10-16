export interface ServerConfig {
  port: number;
  host: string;
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

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    port: toInt(env.PORT, 3000, 1, 65535),
    host: (env.HOST ?? '0.0.0.0').trim() || '0.0.0.0',
  };
}
