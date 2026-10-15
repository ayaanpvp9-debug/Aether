/**
 * Prints the most recent stored inquiries.
 *   npm run build && npm run inquiries -- 10
 */
import { BUDGETS, PROJECT_TYPES, TIMELINES, labelFor } from '../shared/inquiry.ts';
import { loadConfig, type Logger } from './config.ts';
import { createInquiryStore } from './store/index.ts';

try {
  process.loadEnvFile();
} catch {
  // No .env file.
}

const quiet: Logger = { info: () => {}, warn: (m) => console.warn(m), error: (m) => console.error(m) };
const config = loadConfig(process.env, quiet);
const store = await createInquiryStore({ driver: config.storeDriver, dataDir: config.dataDir, logger: quiet });

const requested = Number.parseInt(process.argv[2] ?? '20', 10);
const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 500) : 20;
const [items, total] = await Promise.all([store.list(limit), store.count()]);

const rule = '─'.repeat(64);
console.log(`\nVELTRIX inquiries — ${total} stored · ${store.driver} · ${store.location}\n${rule}`);
if (items.length === 0) console.log('No inquiries yet. Submit the contact form to create one.');

for (const item of items) {
  console.log(`${item.reference}  ·  ${new Date(item.createdAt).toLocaleString()}`);
  console.log(`  ${item.name} <${item.email}>${item.company ? ` — ${item.company}` : ''}`);
  console.log(`  Type: ${item.projectTypes.map((t) => labelFor(PROJECT_TYPES, t)).join(', ')}`);
  console.log(`  Budget: ${labelFor(BUDGETS, item.budget)}  ·  Timeline: ${labelFor(TIMELINES, item.timeline)}`);
  console.log(`  ${item.message.replace(/\n/g, '\n  ')}`);
  console.log(rule);
}

await store.close();
