import { appendFile, readFile } from 'node:fs/promises';
import type { InquiryStore, InquiryRecord } from './types.ts';

/**
 * Append-only JSON Lines store. Portable fallback when SQLite is unavailable.
 * Writes are serialised through a promise chain so lines never interleave.
 */
export function createFileStore(file: string): InquiryStore {
  let queue: Promise<unknown> = Promise.resolve();

  const readAll = async (): Promise<InquiryRecord[]> => {
    let raw: string;
    try {
      raw = await readFile(file, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
    const records: InquiryRecord[] = [];
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        records.push(JSON.parse(line) as InquiryRecord);
      } catch {
        // Skip a corrupted line rather than failing the whole read.
      }
    }
    return records;
  };

  return {
    driver: 'file',
    location: file,
    insert(record) {
      const write = queue.then(() => appendFile(file, `${JSON.stringify(record)}\n`, { encoding: 'utf8', mode: 0o600 }));
      queue = write.catch(() => undefined);
      return write;
    },
    async list(limit) {
      await queue;
      return (await readAll()).reverse().slice(0, limit);
    },
    async count() {
      await queue;
      return (await readAll()).length;
    },
    async close() {
      await queue;
    },
  };
}
