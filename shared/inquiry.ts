/**
 * Project inquiry contract — shared by the browser (instant feedback) and the
 * server (authoritative validation). Pure TypeScript, no runtime dependencies.
 */

export const PROJECT_TYPES = [
  { value: 'web-design', label: 'Creative web design' },
  { value: 'full-stack', label: 'Full-stack build' },
  { value: 'interactive', label: 'Interactive experience' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'brand', label: 'Brand system' },
  { value: 'performance', label: 'Performance' },
] as const;

export const BUDGETS = [
  { value: 'under-25k', label: '< $25k', hint: 'Focused launch' },
  { value: '25k-50k', label: '$25–50k', hint: 'Signature site' },
  { value: '50k-100k', label: '$50–100k', hint: 'Flagship build' },
  { value: '100k-plus', label: '$100k+', hint: 'Platform & system' },
] as const;

export const TIMELINES = [
  { value: 'asap', label: 'As soon as possible' },
  { value: '1-3-months', label: 'Within 1–3 months' },
  { value: '3-6-months', label: 'Within 3–6 months' },
  { value: 'flexible', label: 'Flexible — exploring' },
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number]['value'];
export type Budget = (typeof BUDGETS)[number]['value'];
export type Timeline = (typeof TIMELINES)[number]['value'];

export interface InquiryData {
  name: string;
  email: string;
  company: string;
  projectTypes: ProjectType[];
  budget: Budget;
  timeline: Timeline;
  message: string;
}

export type InquiryField = keyof InquiryData;
export type InquiryErrors = Partial<Record<InquiryField, string>>;

export type InquiryValidation =
  | { ok: true; data: InquiryData }
  | { ok: false; errors: InquiryErrors };

export const INQUIRY_LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 254 },
  company: { max: 100 },
  message: { min: 20, max: 2000 },
} as const;

/** Name of the hidden anti-spam field. Humans never see or fill it. */
export const HONEYPOT_FIELD = 'website';

/** Shape of the JSON returned by POST /api/inquiries. */
export type InquiryResponse =
  | { ok: true; reference: string; receivedAt: string; storage: string }
  | {
      ok: false;
      error: 'validation_failed' | 'invalid_json' | 'payload_too_large' | 'unsupported_media_type'
        | 'rate_limited' | 'forbidden' | 'rejected' | 'storage_unavailable' | 'server_error';
      message: string;
      fields?: InquiryErrors;
      retryAfter?: number;
    };

const PROJECT_TYPE_VALUES = new Set<string>(PROJECT_TYPES.map((p) => p.value));
const BUDGET_VALUES = new Set<string>(BUDGETS.map((b) => b.value));
const TIMELINE_VALUES = new Set<string>(TIMELINES.map((t) => t.value));

// C0/C1 control characters (keeping \t and \n for multiline text), zero-width
// characters and bidirectional overrides (used for spoofing / "Trojan Source").
// eslint-disable-next-line no-control-regex -- matching control characters is the whole point of this sanitiser.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const INVISIBLE_CHARS = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;
const HTML_TAGS = /<\/?[a-z][^>]*>/gi;

/** Normalises a single-line field: NFKC, strips invisible/control chars and markup, collapses whitespace. */
export function cleanSingleLine(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFKC')
    .replace(CONTROL_CHARS, ' ')
    .replace(INVISIBLE_CHARS, '')
    .replace(HTML_TAGS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalises multi-line text: keeps paragraphs, strips invisible/control chars, trims trailing space. */
export function cleanMultiline(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS, '')
    .replace(INVISIBLE_CHARS, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:".]+(\.[^\s@<>()[\]\\,;:".]+)*\.[a-z]{2,}$/i;

export function isValidEmail(email: string): boolean {
  if (email.length > INQUIRY_LIMITS.email.max) return false;
  const [local] = email.split('@');
  if (!local || local.length > 64) return false;
  return EMAIL_PATTERN.test(email);
}

/** Validates one (already cleaned) field. Returns an error message or undefined. */
export function validateField<F extends InquiryField>(field: F, value: InquiryData[F] | unknown): string | undefined {
  switch (field) {
    case 'name': {
      const v = typeof value === 'string' ? value : '';
      if (!v) return 'Tell us who we’re talking to.';
      if (v.length < INQUIRY_LIMITS.name.min) return 'Name looks a little short.';
      if (v.length > INQUIRY_LIMITS.name.max) return `Keep it under ${INQUIRY_LIMITS.name.max} characters.`;
      return undefined;
    }
    case 'email': {
      const v = typeof value === 'string' ? value : '';
      if (!v) return 'An email is required so the brief can be answered.';
      if (!isValidEmail(v)) return 'That email address doesn’t look valid.';
      return undefined;
    }
    case 'company': {
      const v = typeof value === 'string' ? value : '';
      if (v.length > INQUIRY_LIMITS.company.max) return `Keep it under ${INQUIRY_LIMITS.company.max} characters.`;
      return undefined;
    }
    case 'projectTypes': {
      const list = Array.isArray(value) ? value : [];
      if (list.length === 0) return 'Pick at least one project type.';
      if (list.some((item) => typeof item !== 'string' || !PROJECT_TYPE_VALUES.has(item))) return 'Unknown project type selected.';
      return undefined;
    }
    case 'budget': {
      if (typeof value !== 'string' || !value) return 'Choose a budget range.';
      if (!BUDGET_VALUES.has(value)) return 'Unknown budget range.';
      return undefined;
    }
    case 'timeline': {
      if (typeof value !== 'string' || !value) return 'Choose a timeline.';
      if (!TIMELINE_VALUES.has(value)) return 'Unknown timeline.';
      return undefined;
    }
    case 'message': {
      const v = typeof value === 'string' ? value : '';
      if (!v) return 'Share a few lines about the project.';
      if (v.length < INQUIRY_LIMITS.message.min) return `A little more detail, please (at least ${INQUIRY_LIMITS.message.min} characters).`;
      if (v.length > INQUIRY_LIMITS.message.max) return `Keep it under ${INQUIRY_LIMITS.message.max} characters.`;
      return undefined;
    }
    default:
      return undefined;
  }
}

/** Cleans every field of an untrusted payload into the canonical shape (without validating). */
export function cleanInquiry(input: unknown): InquiryData {
  const source = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const rawTypes = Array.isArray(source.projectTypes) ? source.projectTypes : [];
  const projectTypes = [...new Set(rawTypes.filter((t): t is string => typeof t === 'string').map((t) => t.trim()))]
    .slice(0, PROJECT_TYPES.length + 2) as ProjectType[];

  return {
    name: cleanSingleLine(source.name),
    email: cleanSingleLine(source.email).toLowerCase(),
    company: cleanSingleLine(source.company),
    projectTypes,
    budget: cleanSingleLine(source.budget) as Budget,
    timeline: cleanSingleLine(source.timeline) as Timeline,
    message: cleanMultiline(source.message),
  };
}

export const INQUIRY_FIELDS: InquiryField[] = ['name', 'email', 'company', 'projectTypes', 'budget', 'timeline', 'message'];

/** Full validation of an untrusted payload. */
export function validateInquiry(input: unknown): InquiryValidation {
  const data = cleanInquiry(input);
  const errors: InquiryErrors = {};
  for (const field of INQUIRY_FIELDS) {
    const error = validateField(field, data[field]);
    if (error) errors[field] = error;
  }
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, data };
}

export function labelFor<T extends { value: string; label: string }>(list: readonly T[], value: string): string {
  return list.find((item) => item.value === value)?.label ?? value;
}
