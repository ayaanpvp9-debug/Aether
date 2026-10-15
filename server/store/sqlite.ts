import type { DatabaseSync } from 'node:sqlite';
import type { InquiryStore, InquiryRecord } from './types.ts';
import { DuplicateReferenceError } from './types.ts';

type SqliteModule = typeof import('node:sqlite');

/**
 * node:sqlite is still flagged "experimental" on Node 22 and prints a warning
 * the first time it loads. We silence only that specific warning.
 */
async function importSqlite(): Promise<SqliteModule> {
  const original = process.emitWarning;
  process.emitWarning = ((warning: string | Error, ...rest: unknown[]) => {
    const text = typeof warning === 'string' ? warning : warning?.message;
    if (typeof text === 'string' && text.includes('SQLite')) return;
    return (original as (...args: unknown[]) => void).call(process, warning, ...rest);
  }) as typeof process.emitWarning;
  try {
    return await import('node:sqlite');
  } finally {
    process.emitWarning = original;
  }
}

interface Row {
  id: string;
  reference: string;
  name: string;
  email: string;
  company: string;
  project_types: string;
  budget: string;
  timeline: string;
  message: string;
  created_at: string;
}

function parseTypes(json: string): InquiryRecord['projectTypes'] {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as InquiryRecord['projectTypes']) : [];
  } catch {
    return [];
  }
}

function toRecord(row: Row): InquiryRecord {
  const projectTypes = parseTypes(row.project_types);
  return {
    id: row.id,
    reference: row.reference,
    name: row.name,
    email: row.email,
    company: row.company,
    projectTypes,
    budget: row.budget as InquiryRecord['budget'],
    timeline: row.timeline as InquiryRecord['timeline'],
    message: row.message,
    createdAt: row.created_at,
  };
}

export async function createSqliteStore(file: string): Promise<InquiryStore> {
  const { DatabaseSync: Database } = await importSqlite();
  const db: DatabaseSync = new Database(file);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 3000;
    CREATE TABLE IF NOT EXISTS inquiries (
      id            TEXT PRIMARY KEY,
      reference     TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL,
      company       TEXT NOT NULL DEFAULT '',
      project_types TEXT NOT NULL,
      budget        TEXT NOT NULL,
      timeline      TEXT NOT NULL,
      message       TEXT NOT NULL,
      created_at    TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS inquiries_created_at ON inquiries (created_at DESC);
  `);

  // Prepared statements: values are always bound, never interpolated.
  const insertStmt = db.prepare(`
    INSERT INTO inquiries (id, reference, name, email, company, project_types, budget, timeline, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const listStmt = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC, rowid DESC LIMIT ?');
  const countStmt = db.prepare('SELECT COUNT(*) AS total FROM inquiries');

  let closed = false;

  return {
    driver: 'sqlite',
    location: file,
    async insert(record) {
      try {
        insertStmt.run(
          record.id,
          record.reference,
          record.name,
          record.email,
          record.company,
          JSON.stringify(record.projectTypes),
          record.budget,
          record.timeline,
          record.message,
          record.createdAt,
        );
      } catch (error) {
        if (error instanceof Error && /UNIQUE constraint failed: inquiries\.reference/.test(error.message)) {
          throw new DuplicateReferenceError();
        }
        throw error;
      }
    },
    async list(limit) {
      return (listStmt.all(limit) as unknown as Row[]).map(toRecord);
    },
    async count() {
      const row = countStmt.get() as { total: number | bigint } | undefined;
      return Number(row?.total ?? 0);
    },
    async close() {
      if (closed) return;
      closed = true;
      db.close();
    },
  };
}
