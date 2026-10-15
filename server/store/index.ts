import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { StoreDriver, Logger } from '../config.ts';
import type { InquiryStore } from './types.ts';
import { createFileStore } from './file.ts';
import { createSqliteStore } from './sqlite.ts';

export type { InquiryStore, InquiryRecord } from './types.ts';
export { DuplicateReferenceError } from './types.ts';

export async function createInquiryStore(options: { driver: StoreDriver; dataDir: string; logger: Logger }): Promise<InquiryStore> {
  const { driver, dataDir, logger } = options;
  await mkdir(dataDir, { recursive: true, mode: 0o700 });

  if (driver === 'file') return createFileStore(path.join(dataDir, 'inquiries.jsonl'));

  try {
    return await createSqliteStore(path.join(dataDir, 'veltrix.db'));
  } catch (error) {
    if (driver === 'sqlite') throw error;
    logger.warn(`SQLite unavailable (${(error as Error).message}); falling back to the JSON Lines file store.`);
    return createFileStore(path.join(dataDir, 'inquiries.jsonl'));
  }
}
