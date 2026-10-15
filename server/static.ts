import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { brotliCompressSync, constants as zlibConstants, gzipSync } from 'node:zlib';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

const COMPRESSIBLE = /^(text\/|application\/(json|manifest\+json|xml)|image\/svg\+xml)/;
const MAX_CACHED_BYTES = 4 * 1024 * 1024;

interface CachedFile {
  body: Buffer;
  type: string;
  etag: string;
  mtimeMs: number;
  br?: Buffer;
  gzip?: Buffer;
}

const NOT_FOUND_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>404 — VELTRIX</title><style>html{background:#07070A;color:#F5F5F7;font-family:system-ui,sans-serif;height:100%}body{display:grid;place-items:center;height:100%;margin:0;text-align:center}h1{font-size:clamp(4rem,18vw,12rem);margin:0;letter-spacing:-.06em;background:linear-gradient(100deg,#8B5CF6,#38BDF8);-webkit-background-clip:text;background-clip:text;color:transparent}a{color:#F5F5F7;text-underline-offset:6px}p{color:#9a9aa6}</style></head><body><main><h1>404</h1><p>This coordinate is outside the VELTRIX map.</p><a href="/">Return home</a></main></body></html>`;

export function createStaticHandler(root: string) {
  const base = path.resolve(root);
  const cache = new Map<string, CachedFile>();

  async function load(filePath: string, mtimeMs: number, size: number): Promise<CachedFile> {
    const cached = cache.get(filePath);
    if (cached && cached.mtimeMs === mtimeMs) return cached;
    const body = await readFile(filePath);
    const entry: CachedFile = {
      body,
      type: MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      etag: `W/"${size.toString(16)}-${Math.floor(mtimeMs).toString(16)}"`,
      mtimeMs,
    };
    if (size <= MAX_CACHED_BYTES) cache.set(filePath, entry);
    return entry;
  }

  function pickEncoding(req: IncomingMessage, file: CachedFile): { encoding?: 'br' | 'gzip'; body: Buffer } {
    if (!COMPRESSIBLE.test(file.type) || file.body.length < 1024) return { body: file.body };
    const accept = String(req.headers['accept-encoding'] ?? '');
    if (/\bbr\b/.test(accept)) {
      file.br ??= brotliCompressSync(file.body, { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 9 } });
      return { encoding: 'br', body: file.br };
    }
    if (/\bgzip\b/.test(accept)) {
      file.gzip ??= gzipSync(file.body, { level: 9 });
      return { encoding: 'gzip', body: file.gzip };
    }
    return { body: file.body };
  }

  return async function serveStatic(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://veltrix.internal').pathname);
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Bad request');
      return;
    }

    let filePath = path.resolve(base, `.${path.posix.normalize(`/${pathname}`)}`);
    if (pathname.includes('\0') || (filePath !== base && !filePath.startsWith(base + path.sep))) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Forbidden');
      return;
    }

    let info = await stat(filePath).catch(() => null);
    if (info?.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      info = await stat(filePath).catch(() => null);
    }

    if (!info || !info.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : NOT_FOUND_PAGE);
      return;
    }

    const file = await load(filePath, info.mtimeMs, info.size);
    const immutable = pathname.startsWith('/assets/');
    const headers: Record<string, string> = {
      'Content-Type': file.type,
      'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
      ETag: file.etag,
      Vary: 'Accept-Encoding',
    };

    if (req.headers['if-none-match'] === file.etag) {
      res.writeHead(304, headers).end();
      return;
    }

    const { encoding, body } = pickEncoding(req, file);
    if (encoding) headers['Content-Encoding'] = encoding;
    headers['Content-Length'] = String(body.length);
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  };
}
