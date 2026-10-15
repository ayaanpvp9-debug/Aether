import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApiHandler, type ApiHandler } from './api.ts';
import { loadConfig, consoleLogger, type Logger, type ServerConfig } from './config.ts';
import { createRateLimiter } from './rate-limit.ts';
import { createInquiryStore, type InquiryStore } from './store/index.ts';

export interface VeltrixApi {
  config: ServerConfig;
  store: InquiryStore;
  handle: ApiHandler;
  /** Connect-style middleware (used by the Vite dev & preview servers). */
  middleware: (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => void;
  close(): Promise<void>;
}

/** Wires configuration, storage, rate limiting and routing into one disposable unit. */
export async function createVeltrixApi(options: { env?: NodeJS.ProcessEnv; logger?: Logger } = {}): Promise<VeltrixApi> {
  const logger = options.logger ?? consoleLogger;
  const config = loadConfig(options.env ?? process.env, logger);
  const store = await createInquiryStore({ driver: config.storeDriver, dataDir: config.dataDir, logger });
  const limiter = createRateLimiter(config.rateLimit);
  const handle = createApiHandler({ store, limiter, config, logger });

  logger.info(`Inquiry storage: ${store.driver} → ${path.relative(process.cwd(), store.location) || store.location}`);
  if (config.adminToken) logger.info('Admin listing enabled at GET /api/inquiries (bearer token).');

  let closed = false;
  return {
    config,
    store,
    handle,
    middleware(req, res, next) {
      handle(req, res)
        .then((handled) => {
          if (!handled) next();
        })
        .catch(next);
    },
    async close() {
      if (closed) return;
      closed = true;
      limiter.dispose();
      await store.close();
    },
  };
}
