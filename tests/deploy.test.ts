import { describe, expect, it } from 'vitest';
import type { IncomingMessage } from 'node:http';
import { loadConfig, type ClientIpConfig, type Logger } from '../server/config.ts';
import { getClientIp } from '../server/http.ts';
import { detectStoragePersistence, parseMountInfo } from '../server/persistence.ts';

const silent: Logger = { info: () => {}, warn: () => {}, error: () => {} };

describe('loadConfig (hosting-related variables)', () => {
  it('uses the platform PORT and binds all interfaces by default', () => {
    const config = loadConfig({ PORT: '10000' }, silent);
    expect(config.port).toBe(10000);
    expect(config.host).toBe('0.0.0.0');
  });

  it('parses TRUST_PROXY as a trusted hop count', () => {
    const hops = (value?: string) => loadConfig({ TRUST_PROXY: value }, silent).clientIp.trustedProxies;
    expect(hops(undefined)).toBe(0);
    expect(hops('false')).toBe(0);
    expect(hops('true')).toBe(1);
    expect(hops('YES')).toBe(1);
    expect(hops('2')).toBe(2);
    expect(hops('banana')).toBe(0);
    expect(hops('99')).toBe(0);
  });

  it('normalises CLIENT_IP_HEADER and rejects junk', () => {
    expect(loadConfig({ CLIENT_IP_HEADER: ' True-Client-IP ' }, silent).clientIp.header).toBe('true-client-ip');
    expect(loadConfig({ CLIENT_IP_HEADER: 'bad header!' }, silent).clientIp.header).toBeNull();
    expect(loadConfig({}, silent).clientIp.header).toBeNull();
  });
});

describe('getClientIp', () => {
  const request = (headers: Record<string, string | string[]>) =>
    ({ headers, socket: { remoteAddress: '10.1.2.3' } }) as unknown as IncomingMessage;
  const off: ClientIpConfig = { header: null, trustedProxies: 0 };

  it('uses the TCP peer when nothing is trusted (forwarded headers are ignored)', () => {
    expect(getClientIp(request({ 'x-forwarded-for': '1.2.3.4', 'true-client-ip': '5.6.7.8' }), off)).toBe('10.1.2.3');
  });

  it('prefers a valid edge header and falls back when it is missing or not an IP', () => {
    const edge: ClientIpConfig = { header: 'true-client-ip', trustedProxies: 0 };
    expect(getClientIp(request({ 'true-client-ip': '203.0.113.7' }), edge)).toBe('203.0.113.7');
    expect(getClientIp(request({ 'true-client-ip': '2001:db8::1' }), edge)).toBe('2001:db8::1');
    expect(getClientIp(request({ 'true-client-ip': 'not-an-ip' }), edge)).toBe('10.1.2.3');
    expect(getClientIp(request({}), edge)).toBe('10.1.2.3');
  });

  it('reads X-Forwarded-For from the right, never the spoofable left', () => {
    const xff = { 'x-forwarded-for': '6.6.6.6, 203.0.113.9, 172.71.0.1' };
    expect(getClientIp(request(xff), { header: null, trustedProxies: 1 })).toBe('172.71.0.1');
    expect(getClientIp(request(xff), { header: null, trustedProxies: 2 })).toBe('203.0.113.9');
    // More trusted hops than entries: don't guess.
    expect(getClientIp(request(xff), { header: null, trustedProxies: 5 })).toBe('10.1.2.3');
  });
});

describe('detectStoragePersistence', () => {
  const ROOT = '22 1 0:50 / / rw,relatime master:1 - overlay overlay rw,lowerdir=/l,upperdir=/u,workdir=/w';
  const PROC = '23 22 0:52 / /proc rw,nosuid - proc proc rw';
  const DISK = '30 22 259:3 / /var/data rw,relatime - ext4 /dev/nvme1n1 rw';
  const TMP = '31 22 0:60 / /tmp rw,nosuid - tmpfs tmpfs rw';
  const APP = '/opt/render/project/src';
  const render = { RENDER: 'true' };
  const detect = (dataDir: string, lines: string[]) =>
    detectStoragePersistence(dataDir, { env: render, mountInfo: lines.join('\n'), appDir: APP });

  it('makes no claim outside Render', () => {
    expect(detectStoragePersistence('/anything', { env: {}, mountInfo: ROOT, appDir: APP })).toBe('unknown');
  });

  it('flags the default ./data on Render without a disk as ephemeral', () => {
    expect(detect(`${APP}/data`, [ROOT, PROC])).toBe('ephemeral');
    expect(detect('/var/data', [ROOT, PROC])).toBe('ephemeral'); // DATA_DIR set but no disk attached
  });

  it('recognises a persistent disk at, above or inside the project directory', () => {
    expect(detect('/var/data', [ROOT, PROC, DISK])).toBe('persistent');
    expect(detect('/var/data/veltrix', [ROOT, PROC, DISK])).toBe('persistent');
    const projectDisk = `40 22 259:4 / ${APP}/data rw - ext4 /dev/nvme2n1 rw`;
    expect(detect(`${APP}/data`, [ROOT, projectDisk])).toBe('persistent');
  });

  it('treats tmpfs and the volume holding the app itself as ephemeral', () => {
    expect(detect('/tmp/veltrix', [ROOT, TMP])).toBe('ephemeral');
    const appVolume = '41 22 259:5 / /opt/render/project rw - ext4 /dev/nvme3n1 rw';
    expect(detect(`${APP}/data`, [ROOT, appVolume])).toBe('ephemeral');
  });

  it('parses escaped mount paths and ignores malformed lines', () => {
    const mounts = parseMountInfo(['garbage', '50 22 259:6 / /mnt/my\\040disk rw shared:9 - xfs /dev/sdb rw'].join('\n'));
    expect(mounts).toEqual([{ mountPoint: '/mnt/my disk', fsType: 'xfs' }]);
    expect(detectStoragePersistence('/x', { env: render, mountInfo: '', appDir: APP })).toBe('unknown');
  });
});
