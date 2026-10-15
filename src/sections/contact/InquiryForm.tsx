import { useId, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { CircleAlert, Copy, RefreshCcw, RotateCcw, Send } from 'lucide-react';
import {
  BUDGETS,
  HONEYPOT_FIELD,
  INQUIRY_LIMITS,
  PROJECT_TYPES,
  TIMELINES,
  cleanInquiry,
  labelFor,
  validateField,
  validateInquiry,
  type Budget,
  type InquiryErrors,
  type InquiryField,
  type InquiryResponse,
  type ProjectType,
  type Timeline,
} from '../../../shared/inquiry';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/toast-context';
import { copyText } from '../../lib/clipboard';
import { cn } from '../../lib/cn';
import { EASE_OUT } from '../../lib/motion';
import type { ServiceState } from './useServiceStatus';

interface Values {
  name: string;
  email: string;
  company: string;
  projectTypes: ProjectType[];
  budget: Budget | '';
  timeline: Timeline | '';
  message: string;
  [HONEYPOT_FIELD]: string;
}

const INITIAL: Values = { name: '', email: '', company: '', projectTypes: [], budget: '', timeline: '', message: '', [HONEYPOT_FIELD]: '' };
const FIELD_ORDER: InquiryField[] = ['name', 'email', 'company', 'projectTypes', 'budget', 'timeline', 'message'];

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface Success {
  reference: string;
  receivedAt: string;
  storage: string;
}

interface Failure {
  title: string;
  message: string;
  /** Network/hosting failures: nothing reached the server. */
  offline?: boolean;
}

class OfflineError extends Error {}

function briefText(values: Values) {
  return [
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    values.company ? `Company: ${values.company}` : null,
    `Project: ${values.projectTypes.map((t) => labelFor(PROJECT_TYPES, t)).join(', ')}`,
    `Budget: ${values.budget ? labelFor(BUDGETS, values.budget) : '—'}`,
    `Timeline: ${values.timeline ? labelFor(TIMELINES, values.timeline) : '—'}`,
    '',
    values.message,
  ]
    .filter((line) => line !== null)
    .join('\n');
}

export function InquiryForm({ service }: { service: ServiceState }) {
  const uid = useId();
  const id = (field: string) => `${uid}-${field}`;
  const toast = useToast();
  const [values, setValues] = useState<Values>(INITIAL);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [touched, setTouched] = useState<Partial<Record<InquiryField, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [success, setSuccess] = useState<Success | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [scope, animate] = useAnimate();
  const formRef = useRef<HTMLFormElement>(null);

  const revalidate = (field: InquiryField, next: Values) => {
    const cleaned = cleanInquiry(next);
    setErrors((current) => ({ ...current, [field]: validateField(field, cleaned[field]) }));
  };

  const update = <K extends keyof Values>(field: K, value: Values[K]) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (field !== HONEYPOT_FIELD && touched[field as InquiryField]) revalidate(field as InquiryField, next);
  };

  const blur = (field: InquiryField) => {
    setTouched((t) => ({ ...t, [field]: true }));
    revalidate(field, values);
  };

  const toggleType = (type: ProjectType) => {
    const list = values.projectTypes.includes(type) ? values.projectTypes.filter((t) => t !== type) : [...values.projectTypes, type];
    setTouched((t) => ({ ...t, projectTypes: true }));
    const next = { ...values, projectTypes: list };
    setValues(next);
    revalidate('projectTypes', next);
  };

  const focusField = (field: InquiryField) => {
    const target =
      field === 'projectTypes' || field === 'budget'
        ? formRef.current?.querySelector<HTMLInputElement>(`[name="${field}"]`)
        : document.getElementById(id(field));
    target?.focus();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (status === 'submitting') return;

    const check = validateInquiry(values);
    if (!check.ok) {
      setErrors(check.errors);
      setTouched(Object.fromEntries(FIELD_ORDER.map((f) => [f, true])));
      const first = FIELD_ORDER.find((f) => check.errors[f]);
      const count = Object.keys(check.errors).length;
      setAnnouncement(`${count} field${count === 1 ? ' needs' : 's need'} attention.`);
      if (first) focusField(first);
      void animate(scope.current, { x: [0, -10, 10, -6, 6, 0] }, { duration: 0.45 });
      return;
    }

    setStatus('submitting');
    setFailure(null);
    setAnnouncement('Sending your brief…');

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...check.data, [HONEYPOT_FIELD]: values[HONEYPOT_FIELD] }),
        signal: controller.signal,
      });
      const type = res.headers.get('content-type') ?? '';
      if (!type.includes('application/json')) {
        throw new OfflineError(
          res.status === 404 || res.status === 405 || res.status === 501
            ? 'This deployment has no inquiry API (static hosting), so the brief could not be delivered.'
            : `The server answered unexpectedly (HTTP ${res.status}).`,
        );
      }
      const body = (await res.json()) as InquiryResponse;
      if (res.ok && body.ok) {
        setSuccess({ reference: body.reference, receivedAt: body.receivedAt, storage: body.storage });
        setStatus('success');
        setAnnouncement(`Brief stored. Your reference is ${body.reference}.`);
        return;
      }
      if (!body.ok) {
        if (body.fields) {
          setErrors(body.fields);
          setTouched(Object.fromEntries(FIELD_ORDER.map((f) => [f, true])));
        }
        const title =
          body.error === 'rate_limited'
            ? 'Slow down a little'
            : body.error === 'validation_failed'
              ? 'The server spotted a problem'
              : 'Your brief was not stored';
        setFailure({ title, message: body.message });
        setStatus('error');
        setAnnouncement(`${title}. ${body.message}`);
      }
    } catch (error) {
      const message =
        error instanceof OfflineError
          ? error.message
          : (error as Error).name === 'AbortError'
            ? 'The server took too long to respond.'
            : 'The network request failed — check your connection.';
      setFailure({ title: 'Nothing was sent', message, offline: true });
      setStatus('error');
      setAnnouncement(`Nothing was sent. ${message}`);
    } finally {
      window.clearTimeout(timer);
    }
  };

  const reset = () => {
    setValues(INITIAL);
    setErrors({});
    setTouched({});
    setFailure(null);
    setSuccess(null);
    setStatus('idle');
    setAnnouncement('Form cleared.');
  };

  const copyBrief = async () => {
    const ok = await copyText(briefText(values));
    toast.push(ok ? { title: 'Brief copied', description: 'Paste it into an email — nothing was sent automatically.', tone: 'success' } : { title: 'Copy failed', description: 'Clipboard access was blocked.', tone: 'error' });
  };

  const fieldError = (field: InquiryField) => (touched[field] ? errors[field] : undefined);
  const describedBy = (field: InquiryField, extra?: string) => [fieldError(field) ? id(`${field}-error`) : null, extra].filter(Boolean).join(' ') || undefined;

  const errorText = (field: InquiryField) => (
    <AnimatePresence initial={false}>
      {fieldError(field) && (
        <motion.span
          id={id(`${field}-error`)}
          className="vx-field__error"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
        >
          <CircleAlert size={13} aria-hidden="true" /> {fieldError(field)}
        </motion.span>
      )}
    </AnimatePresence>
  );

  if (status === 'success' && success) {
    return (
      <motion.div
        className="vx-form vx-form--success"
        initial={{ opacity: 0, scale: 0.97, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
        role="status"
        aria-live="polite"
      >
        <svg className="vx-success__check" viewBox="0 0 64 64" aria-hidden="true">
          <motion.circle cx="32" cy="32" r="29" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: EASE_OUT }} />
          <motion.path d="M20 33l8 8 16-17" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.6, ease: EASE_OUT }} />
        </svg>
        <h3 className="vx-success__title">Brief received and stored.</h3>
        <p className="vx-success__text">
          The server validated your inquiry and saved it to its {success.storage} at{' '}
          {new Date(success.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Keep your reference:
        </p>
        <div className="vx-success__ref">
          <code>{success.reference}</code>
          <button
            type="button"
            className="vx-icon-btn"
            onClick={async () => {
              const ok = await copyText(success.reference);
              toast.push(ok ? { title: 'Reference copied', tone: 'success' } : { title: 'Copy failed', tone: 'error' });
            }}
            aria-label="Copy reference code"
          >
            <Copy size={16} />
          </button>
        </div>
        <p className="vx-success__note">
          Honest note: this demo stores inquiries but does not send email or notifications. Connect a mail provider or CRM to be alerted to new
          briefs.
        </p>
        <Button variant="ghost" icon={<RotateCcw size={15} />} onClick={reset} magnetic={false}>
          Send another brief
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={scope}
      className="vx-form-shell"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 1, ease: EASE_OUT }}
    >
      <form ref={formRef} className="vx-form" onSubmit={submit} noValidate aria-describedby={id('form-note')}>
        <div className="vx-form__row">
          <div className={cn('vx-field', fieldError('name') && 'has-error')}>
            <label className="vx-field__label" htmlFor={id('name')}>
              Your name <span aria-hidden="true">*</span>
            </label>
            <input
              id={id('name')}
              className="vx-input"
              name="name"
              autoComplete="name"
              placeholder="Ada Lovelace"
              maxLength={INQUIRY_LIMITS.name.max + 20}
              value={values.name}
              onChange={(e) => update('name', e.target.value)}
              onBlur={() => blur('name')}
              aria-invalid={fieldError('name') ? true : undefined}
              aria-describedby={describedBy('name')}
              aria-required="true"
            />
            {errorText('name')}
          </div>
          <div className={cn('vx-field', fieldError('email') && 'has-error')}>
            <label className="vx-field__label" htmlFor={id('email')}>
              Email <span aria-hidden="true">*</span>
            </label>
            <input
              id={id('email')}
              className="vx-input"
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              placeholder="ada@studio.com"
              value={values.email}
              onChange={(e) => update('email', e.target.value)}
              onBlur={() => blur('email')}
              aria-invalid={fieldError('email') ? true : undefined}
              aria-describedby={describedBy('email')}
              aria-required="true"
            />
            {errorText('email')}
          </div>
        </div>

        <div className={cn('vx-field', fieldError('company') && 'has-error')}>
          <label className="vx-field__label" htmlFor={id('company')}>
            Company <span className="vx-field__optional">optional</span>
          </label>
          <input
            id={id('company')}
            className="vx-input"
            name="company"
            autoComplete="organization"
            placeholder="Analytical Engines Ltd."
            value={values.company}
            onChange={(e) => update('company', e.target.value)}
            onBlur={() => blur('company')}
            aria-invalid={fieldError('company') ? true : undefined}
            aria-describedby={describedBy('company')}
          />
          {errorText('company')}
        </div>

        <fieldset className={cn('vx-fieldset', fieldError('projectTypes') && 'has-error')} aria-describedby={describedBy('projectTypes')}>
          <legend className="vx-field__label">
            Project type <span aria-hidden="true">*</span> <span className="vx-field__optional">choose one or more</span>
          </legend>
          <div className="vx-chips">
            {PROJECT_TYPES.map((type) => {
              const checked = values.projectTypes.includes(type.value);
              return (
                <label key={type.value} className={cn('vx-chip', checked && 'is-checked')} data-cursor="link">
                  <input type="checkbox" name="projectTypes" value={type.value} checked={checked} onChange={() => toggleType(type.value)} />
                  <span className="vx-chip__box" aria-hidden="true">
                    <svg viewBox="0 0 12 12">
                      <path d="M2.5 6.2l2.3 2.3 4.7-5" />
                    </svg>
                  </span>
                  {type.label}
                </label>
              );
            })}
          </div>
          {errorText('projectTypes')}
        </fieldset>

        <fieldset className={cn('vx-fieldset', fieldError('budget') && 'has-error')} aria-describedby={describedBy('budget')}>
          <legend className="vx-field__label">
            Budget <span aria-hidden="true">*</span>
          </legend>
          <div className="vx-budgets">
            {BUDGETS.map((budget) => {
              const checked = values.budget === budget.value;
              return (
                <label key={budget.value} className={cn('vx-budget', checked && 'is-checked')} data-cursor="link">
                  <input
                    type="radio"
                    name="budget"
                    value={budget.value}
                    checked={checked}
                    onChange={() => {
                      setTouched((t) => ({ ...t, budget: true }));
                      const next = { ...values, budget: budget.value };
                      setValues(next);
                      revalidate('budget', next);
                    }}
                  />
                  {checked && <motion.span layoutId={`${uid}-budget`} className="vx-budget__glow" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                  <span className="vx-budget__label">{budget.label}</span>
                  <span className="vx-budget__hint">{budget.hint}</span>
                </label>
              );
            })}
          </div>
          {errorText('budget')}
        </fieldset>

        <Select
          id={id('timeline')}
          label="Timeline *"
          placeholder="When should it launch?"
          options={TIMELINES}
          value={values.timeline}
          onChange={(value) => {
            setTouched((t) => ({ ...t, timeline: true }));
            const next = { ...values, timeline: value };
            setValues(next);
            revalidate('timeline', next);
          }}
          onBlur={() => blur('timeline')}
          error={fieldError('timeline')}
        />

        <div className={cn('vx-field', fieldError('message') && 'has-error')}>
          <label className="vx-field__label" htmlFor={id('message')}>
            Tell us about it <span aria-hidden="true">*</span>
          </label>
          <textarea
            id={id('message')}
            className="vx-input vx-textarea"
            name="message"
            rows={5}
            placeholder="Goals, audience, what success looks like, links you love…"
            value={values.message}
            onChange={(e) => update('message', e.target.value)}
            onBlur={() => blur('message')}
            aria-invalid={fieldError('message') ? true : undefined}
            aria-describedby={describedBy('message', id('message-count'))}
            aria-required="true"
          />
          <div className="vx-field__meta">
            {errorText('message')}
            <span
              id={id('message-count')}
              className={cn('vx-field__count', values.message.trim().length > INQUIRY_LIMITS.message.max && 'is-over')}
              aria-live="off"
            >
              {values.message.trim().length} / {INQUIRY_LIMITS.message.max}
            </span>
          </div>
        </div>

        {/* Honeypot — invisible to people, tempting to bots. */}
        <div className="vx-hp" aria-hidden="true">
          <label htmlFor={id('website')}>Website</label>
          <input
            id={id('website')}
            name={HONEYPOT_FIELD}
            tabIndex={-1}
            autoComplete="off"
            value={values[HONEYPOT_FIELD]}
            onChange={(e) => update(HONEYPOT_FIELD, e.target.value)}
          />
        </div>

        <AnimatePresence>
          {failure && (
            <motion.div
              className={cn('vx-form__alert', failure.offline && 'is-offline')}
              role="alert"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <CircleAlert size={18} aria-hidden="true" />
              <div>
                <strong>{failure.title}</strong>
                <p>{failure.message}</p>
                {failure.offline && (
                  <div className="vx-form__alert-actions">
                    <button type="button" className="vx-demo-btn" onClick={copyBrief}>
                      <Copy size={14} aria-hidden="true" /> Copy brief
                    </button>
                    <button type="submit" className="vx-demo-btn vx-demo-btn--ghost">
                      <RefreshCcw size={14} aria-hidden="true" /> Retry
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="vx-form__submit">
          <Button type="submit" size="lg" loading={status === 'submitting'} icon={<Send size={16} />} cursorLabel="Send">
            {status === 'submitting' ? 'Sending brief…' : 'Send brief'}
          </Button>
          <p id={id('form-note')} className="vx-form__note">
            {service.status === 'offline'
              ? 'Heads-up: the inquiry service is unreachable from this host, so sending will fail until a backend is connected.'
              : 'Stored in this site’s database with a reference code. Used only to reply — no marketing, no email is sent by this demo.'}
          </p>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </form>
    </motion.div>
  );
}
