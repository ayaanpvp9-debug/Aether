import type { InquiryStore, InquiryRecord } from './types.ts';
import { DuplicateReferenceError } from './types.ts';

/** Volatile store used by tests. */
export function createMemoryStore(): InquiryStore {
  const records: InquiryRecord[] = [];
  return {
    driver: 'memory',
    location: ':memory:',
    async insert(record) {
      if (records.some((r) => r.reference === record.reference)) throw new DuplicateReferenceError();
      records.push(record);
    },
    async list(limit) {
      return [...records].reverse().slice(0, limit);
    },
    async count() {
      return records.length;
    },
    async close() {},
  };
}
