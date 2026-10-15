/**
 * VELTRIX production server — serves the built client from dist/ and the
 * inquiry API from the same origin. Zero runtime dependencies.
 *
 *   npm run build && npm start
 */
import { existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { consoleLogger } from './config.ts';
import { createVeltrixApi } from './middleware.ts';
import { createStaticHandler } from './static.ts';

try {
  process.loadEnvFile();
} catch {
  // No .env file — environment variables or defaults are used.
}

const logger = consoleLogger;
const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(here, '../dist');

if (!existsSync(path.join(distDir, 'index.html'))) {
  logger.error('dist/index.html not found. Run "npm run build" before "npm start".');
  process.exit(1);
}

// Note: no frame-blocking headers so the site can be embedded in previews;
// add `frame-ancestors` to the CSP if you need clickjacking protection.
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

const api = await createVeltrixApi({ logger });
const serveStatic = createStaticHandler(distDir);

const server = http.createServer((req, res) => {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(name, value);

  api
    .handle(req, res)
    .then(async (handled) => {
      if (handled) return;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' }).end('Method not allowed');
        return;
      }
      await serveStatic(req, res);
    })
    .catch((error: unknown) => {
      logger.error(`Request failed: ${(error as Error).stack ?? String(error)}`);
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Internal server error');
      else res.destroy();
    });
});

server.requestTimeout = 15_000;
server.headersTimeout = 10_000;
// Keep idle keep-alive sockets open longer than the platform load balancer does: Node's 5 s
// default makes the proxy reuse sockets we just closed → sporadic 502s / connection resets
// (see Render's troubleshooting guide). On Node ≥ 18 the header/request timeouts above only
// apply while a request is in flight, so they don't cut idle connections short.
server.keepAliveTimeout = 65_000;

server.listen(api.config.port, api.config.host, () => {
  const host = api.config.host.includes(':') ? `[${api.config.host}]` : api.config.host;
  logger.info(`Listening on http://${host}:${api.config.port}`);
  const publicUrl = process.env.RENDER_EXTERNAL_URL?.trim();
  if (publicUrl) logger.info(`Render service URL: ${publicUrl}`);
});

let shuttingDown = false;
function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received — closing server.`);
  setTimeout(() => process.exit(1), 5_000).unref();
  server.close(() => {
    api.close().finally(() => process.exit(0));
  });
  server.closeIdleConnections();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
