import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadConfig } from '../server/config.ts';

describe('loadConfig (hosting-related variables)', () => {
  it('uses the platform PORT and binds all interfaces by default', () => {
    const config = loadConfig({ PORT: '10000' });
    expect(config.port).toBe(10000);
    expect(config.host).toBe('0.0.0.0');
  });

  it('falls back to safe defaults for missing or invalid values', () => {
    expect(loadConfig({}).port).toBe(3000);
    expect(loadConfig({ PORT: 'banana' }).port).toBe(3000);
    expect(loadConfig({ PORT: '99999' }).port).toBe(65535);
    expect(loadConfig({ HOST: '  ' }).host).toBe('0.0.0.0');
    expect(loadConfig({ HOST: '127.0.0.1' }).host).toBe('127.0.0.1');
  });
});

describe('render.yaml', () => {
  const blueprint = readFileSync(new URL('../render.yaml', import.meta.url), 'utf8');

  it('builds, starts and health-checks the single web service', () => {
    expect(blueprint).toMatch(/^\s+buildCommand: npm ci --include=dev && npm run build$/m);
    expect(blueprint).toMatch(/^\s+startCommand: node dist-server\/index\.js$/m);
    expect(blueprint).toMatch(/^\s+healthCheckPath: \/api\/health$/m);
  });

  it('no longer configures inquiry storage or the admin token', () => {
    expect(blueprint).not.toMatch(/ADMIN_TOKEN|DATA_DIR|CLIENT_IP_HEADER|disk:/);
  });
});
