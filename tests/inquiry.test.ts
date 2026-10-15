import { describe, expect, it } from 'vitest';
import { cleanMultiline, cleanSingleLine, isValidEmail, validateField, validateInquiry } from '../shared/inquiry.ts';

const valid = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  company: 'Analytical Engines',
  projectTypes: ['web-design', 'interactive'],
  budget: '50k-100k',
  timeline: '1-3-months',
  message: 'We want a cinematic launch site for a new product line.',
};

describe('validateInquiry', () => {
  it('accepts a complete inquiry and returns cleaned data', () => {
    const result = validateInquiry({ ...valid, name: '  Ada   Lovelace ', email: 'ADA@Example.com ' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe('Ada Lovelace');
      expect(result.data.email).toBe('ada@example.com');
      expect(result.data.projectTypes).toEqual(['web-design', 'interactive']);
    }
  });

  it('reports every missing required field', () => {
    const result = validateInquiry({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['budget', 'email', 'message', 'name', 'projectTypes', 'timeline']);
    }
  });

  it('rejects values outside the allowed option lists', () => {
    const result = validateInquiry({ ...valid, budget: '1m', timeline: 'yesterday', projectTypes: ['web-design', 'hack'] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.budget).toBeDefined();
      expect(result.errors.timeline).toBeDefined();
      expect(result.errors.projectTypes).toBeDefined();
    }
  });

  it('enforces length limits', () => {
    const result = validateInquiry({ ...valid, name: 'A', message: 'too short', company: 'x'.repeat(101) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toMatch(/short/);
      expect(result.errors.message).toMatch(/at least/);
      expect(result.errors.company).toMatch(/under/);
    }
  });

  it('ignores non-object payloads safely', () => {
    expect(validateInquiry(null).ok).toBe(false);
    expect(validateInquiry('nope').ok).toBe(false);
    expect(validateInquiry([1, 2]).ok).toBe(false);
  });

  it('de-duplicates project types', () => {
    const result = validateInquiry({ ...valid, projectTypes: ['brand', 'brand', 'performance'] });
    expect(result.ok && result.data.projectTypes).toEqual(['brand', 'performance']);
  });
});

describe('sanitisation', () => {
  it('strips control characters, bidi overrides, zero-width chars and tags from single-line text', () => {
    expect(cleanSingleLine('Ev\u202Eil\u200B <b>Corp</b>\u0007')).toBe('Evil Corp');
  });

  it('keeps paragraphs but trims noise from multi-line text', () => {
    expect(cleanMultiline('Line one  \r\n\r\n\r\n\r\nLine two\u0000')).toBe('Line one\n\nLine two');
  });

  it('returns empty strings for non-string input', () => {
    expect(cleanSingleLine(42)).toBe('');
    expect(cleanMultiline({})).toBe('');
  });
});

describe('email validation', () => {
  it.each(['a@b.co', 'first.last+tag@sub.domain.io'])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });
  it.each(['plainaddress', 'a@b', 'a@b.c', 'a b@c.com', '<a>@b.com', `${'x'.repeat(65)}@b.com`])('rejects %s', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
  it('produces a friendly message', () => {
    expect(validateField('email', 'nope')).toMatch(/valid/);
  });
});
