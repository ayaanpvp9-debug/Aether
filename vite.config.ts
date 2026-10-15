/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createVeltrixApi, type VeltrixApi } from './server/middleware.ts';
import type { Logger } from './server/config.ts';

/**
 * Mounts the real inquiry API (server/) inside Vite's dev and preview servers,
 * so `npm run dev` is a complete full-stack environment in a single process.
 */
function veltrixApi(env: Record<string, string>): Plugin {
  let api: VeltrixApi | undefined;

  const mount = async (
    middlewares: { use: (fn: VeltrixApi['middleware']) => void },
    httpServer: { once(event: 'close', listener: () => void): unknown } | null,
    logger: { info(msg: string): void; warn(msg: string): void; error(msg: string): void },
  ) => {
    const log: Logger = {
      info: (m) => logger.info(`[veltrix] ${m}`),
      warn: (m) => logger.warn(`[veltrix] ${m}`),
      error: (m) => logger.error(`[veltrix] ${m}`),
    };
    api = await createVeltrixApi({ env: { ...env, ...process.env }, logger: log });
    middlewares.use(api.middleware);
    httpServer?.once('close', () => void api?.close());
  };

  return {
    name: 'veltrix-api',
    async configureServer(server) {
      await mount(server.middlewares, server.httpServer, server.config.logger);
    },
    async configurePreviewServer(server) {
      await mount(server.middlewares, server.httpServer, server.config.logger);
    },
  };
}

/** Preloads the critical font files (hashed names are read from the final bundle). */
function preloadCriticalFonts(patterns: RegExp[]): Plugin {
  return {
    name: 'veltrix-preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        if (!ctx.bundle) return;
        return Object.keys(ctx.bundle)
          .filter((file) => patterns.some((pattern) => pattern.test(file)))
          .map((file) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${file}`, crossorigin: '' },
            injectTo: 'head' as const,
          }));
      },
    },
  };
}

export default defineConfig(({ mode, isSsrBuild }) => {
  // Load every variable from .env files (not only VITE_*) for the server-side API.
  // Nothing here is exposed to client code: only VITE_* vars reach import.meta.env.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      veltrixApi(env),
      preloadCriticalFonts([/unbounded-latin-wght-normal-[\w-]+\.woff2$/, /geist-latin-wght-normal-[\w-]+\.woff2$/]),
    ],
    // The server bundle must not receive a copy of public/.
    publicDir: isSsrBuild ? false : 'public',
    server: {
      host: true,
      port: 5173,
      allowedHosts: ['.e2b.app', ...(env.DEV_ALLOWED_HOSTS?.split(',').map((h) => h.trim()).filter(Boolean) ?? [])],
    },
    preview: {
      host: true,
      port: 4173,
      allowedHosts: ['.e2b.app'],
    },
    build: isSsrBuild
      ? {
          ssr: true,
          outDir: 'dist-server',
          emptyOutDir: true,
          target: 'node22',
          minify: false,
          rolldownOptions: {
            input: {
              index: 'server/index.ts',
              'list-inquiries': 'server/list-inquiries.ts',
            },
          },
        }
      : {
          target: 'es2022',
          cssTarget: ['chrome111', 'edge111', 'firefox115', 'safari16.4'],
          assetsInlineLimit: 2048,
          chunkSizeWarningLimit: 700,
          rolldownOptions: {
            output: {
              // Long-lived vendor chunks: app deploys don't invalidate cached React/Motion.
              codeSplitting: {
                groups: [
                  { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
                  { name: 'motion', test: /node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/ },
                ],
              },
            },
          },
        },
    test: {
      environment: 'node',
      include: ['tests/**/*.test.ts'],
    },
  };
});
