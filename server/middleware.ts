import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApiHandler, type ApiHandler } from './api.ts';
import { loadConfig, type ServerConfig } from './config.ts';

export interface VeltrixApi {
  config: ServerConfig;
  handle: ApiHandler;
  /** Connect-style middleware (used by the Vite dev & preview servers). */
  middleware: (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => void;
}

/** Wires configuration and routing into one unit shared by the production server and Vite. */
export function createVeltrixApi(options: { env?: NodeJS.ProcessEnv } = {}): VeltrixApi {
  const config = loadConfig(options.env ?? process.env);
  const handle = createApiHandler();
  return {
    config,
    handle,
    middleware(req, res, next) {
      handle(req, res)
        .then((handled) => {
          if (!handled) next();
        })
        .catch(next);
    },
  };
}
