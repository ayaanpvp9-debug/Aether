import type { InquiryData } from '../../shared/inquiry.ts';

export interface InquiryRecord extends InquiryData {
  id: string;
  reference: string;
  createdAt: string;
}

export interface InquiryStore {
  readonly driver: 'sqlite' | 'file' | 'memory';
  /** Human-readable location (file path) — never sent to clients. */
  readonly location: string;
  insert(record: InquiryRecord): Promise<void>;
  /** Most recent first. */
  list(limit: number): Promise<InquiryRecord[]>;
  count(): Promise<number>;
  close(): Promise<void>;
}

export class DuplicateReferenceError extends Error {
  constructor() {
    super('Duplicate inquiry reference');
  }
}
