import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApiHandler, type ApiHandler } from './api.ts';
import { loadConfig, consoleLogger, type Logger, type ServerConfig } from './config.ts';
import { detectStoragePersistence, type StoragePersistence } from './persistence.ts';
import { createRateLimiter } from './rate-limit.ts';
import { createInquiryStore, type InquiryStore } from './store/index.ts';

export interface VeltrixApi {
  config: ServerConfig;
  store: InquiryStore;
  persistence: StoragePersistence;
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
  const persistence = detectStoragePersistence(config.dataDir, { env: options.env ?? process.env });
  const limiter = createRateLimiter(config.rateLimit);
  const handle = createApiHandler({ store, limiter, config, logger, ephemeralStorage: persistence === 'ephemeral' });

  const relative = path.relative(process.cwd(), store.location);
  const shownLocation = relative && !relative.startsWith('..') && !path.isAbsolute(relative) ? relative : store.location;
  logger.info(`Inquiry storage: ${store.driver} → ${shownLocation}`);
  if (persistence === 'ephemeral') {
    logger.warn(
      'Inquiry storage is on an EPHEMERAL filesystem: stored inquiries are lost on every redeploy, restart and ' +
        'free-plan spin-down. To keep them, attach a persistent disk and set DATA_DIR to its mount path (README → Deploying to Render).',
    );
  } else if (persistence === 'persistent') {
    logger.info('Inquiry storage is on a persistent disk.');
  }
  if (config.adminToken) logger.info('Admin listing enabled at GET /api/inquiries (bearer token).');
  if (config.clientIp.header) logger.info(`Client IPs for rate limiting are read from the "${config.clientIp.header}" header.`);

  let closed = false;
  return {
    config,
    store,
    persistence,
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
