import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';

/**
 * Will files written to DATA_DIR survive a restart?
 *
 * - `persistent` — DATA_DIR sits on a dedicated disk (e.g. a Render persistent disk).
 * - `ephemeral`  — DATA_DIR sits on the platform's throwaway filesystem; data is lost on
 *                  every redeploy, restart and (Render free plan) idle spin-down.
 * - `unknown`    — not on a platform we can reason about; no claim is made.
 */
export type StoragePersistence = 'persistent' | 'ephemeral' | 'unknown';

interface MountEntry {
  mountPoint: string;
  fsType: string;
}

/** Filesystem types that never outlive the container. */
const VOLATILE_FS = new Set(['tmpfs', 'ramfs', 'overlay', 'aufs']);

/** Mount paths in mountinfo escape whitespace and backslashes as octal (\040 = space). */
function unescapeMountPath(value: string): string {
  return value.replace(/\\([0-7]{3})/g, (_, octal: string) => String.fromCharCode(Number.parseInt(octal, 8)));
}

/** Parses /proc/self/mountinfo (see proc(5)) into mount points and filesystem types. */
export function parseMountInfo(text: string): MountEntry[] {
  const mounts: MountEntry[] = [];
  for (const line of text.split('\n')) {
    const fields = line.trim().split(' ');
    // 6 fixed fields, optional fields, a lone "-", then fs type, source and super options.
    const separator = fields.indexOf('-', 6);
    if (fields.length < 10 || separator === -1 || !fields[separator + 1]) continue;
    mounts.push({ mountPoint: unescapeMountPath(fields[4]!), fsType: fields[separator + 1]! });
  }
  return mounts;
}

const isWithin = (child: string, parent: string) =>
  parent === '/' || child === parent || child.startsWith(`${parent}/`);

function resolveReal(target: string): string {
  try {
    return realpathSync(target);
  } catch {
    return path.resolve(target);
  }
}

/**
 * Best-effort persistence check. It is only evaluated on Render (RENDER=true), where the
 * whole filesystem is ephemeral except a persistent disk. Data counts as persistent only when
 * it lives on a dedicated, non-volatile mount that does not also hold the application itself.
 */
export function detectStoragePersistence(
  dataDir: string,
  options: { env?: NodeJS.ProcessEnv; mountInfo?: string; appDir?: string } = {},
): StoragePersistence {
  const env = options.env ?? process.env;
  if (env.RENDER !== 'true') return 'unknown';

  let mounts: MountEntry[];
  try {
    mounts = parseMountInfo(options.mountInfo ?? readFileSync('/proc/self/mountinfo', 'utf8'));
  } catch {
    return 'unknown';
  }
  if (mounts.length === 0) return 'unknown';

  const target = resolveReal(dataDir);
  const appDir = resolveReal(options.appDir ?? process.cwd());

  // The mount that actually holds DATA_DIR is the longest matching mount point
  // (later entries shadow earlier ones mounted at the same path).
  let owner: MountEntry | undefined;
  for (const mount of mounts) {
    if (isWithin(target, mount.mountPoint) && (!owner || mount.mountPoint.length >= owner.mountPoint.length)) {
      owner = mount;
    }
  }

  if (!owner || owner.mountPoint === '/') return 'ephemeral';
  if (VOLATILE_FS.has(owner.fsType)) return 'ephemeral';
  if (isWithin(appDir, owner.mountPoint)) return 'ephemeral'; // Same volume as the deployed app.
  return 'persistent';
}
