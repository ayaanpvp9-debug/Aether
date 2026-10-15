import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';
import './Select.css';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface SelectProps<T extends string> {
  label: string;
  options: readonly SelectOption<T>[];
  value: T | '';
  onChange: (value: T) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  onBlur?: () => void;
  className?: string;
  id?: string;
  compact?: boolean;
}

/**
 * Custom listbox dropdown following the WAI-ARIA select-only combobox pattern:
 * Arrow keys, Home/End, Enter/Space, Escape, Tab and type-ahead are supported.
 */
export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  error,
  hint,
  onBlur,
  className,
  id: idProp,
  compact,
}: SelectProps<T>) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const typeahead = useRef({ text: '', timer: 0 });

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, onBlur]);

  const openList = (index = selectedIndex >= 0 ? selectedIndex : 0) => {
    setActive(index);
    setOpen(true);
  };

  const commit = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        openList(event.key === 'ArrowUp' ? (selectedIndex >= 0 ? selectedIndex : last) : undefined);
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        event.preventDefault();
        setActive(0);
        break;
      case 'End':
        event.preventDefault();
        setActive(last);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commit(active);
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          const state = typeahead.current;
          window.clearTimeout(state.timer);
          state.text += event.key.toLowerCase();
          state.timer = window.setTimeout(() => (state.text = ''), 600);
          const match = options.findIndex((o) => o.label.toLowerCase().startsWith(state.text));
          if (match >= 0) setActive(match);
        }
    }
  };

  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined;

  return (
    <div ref={rootRef} className={cn('vx-select', open && 'is-open', error && 'has-error', compact && 'vx-select--compact', className)}>
      <span id={`${id}-label`} className="vx-field__label">
        {label}
      </span>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-labelledby={`${id}-label ${id}`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="vx-select__trigger"
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node)) {
            setOpen(false);
            onBlur?.();
          }
        }}
        data-cursor="link"
      >
        <span className={cn('vx-select__value', !selected && 'is-placeholder')}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className="vx-select__chevron" size={16} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={`${id}-listbox`}
            role="listbox"
            aria-labelledby={`${id}-label`}
            className="vx-select__list"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.16 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 34 }}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <motion.li
                  key={option.value}
                  id={`${id}-opt-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  className={cn('vx-select__option', index === active && 'is-active', isSelected && 'is-selected')}
                  onPointerEnter={() => setActive(index)}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => commit(index)}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: index * 0.025 } }}
                  data-cursor="link"
                >
                  <span className="vx-select__option-text">
                    <span>{option.label}</span>
                    {option.description && <small>{option.description}</small>}
                  </span>
                  <Check className="vx-select__check" size={15} aria-hidden="true" />
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {hint && !error && (
        <span id={`${id}-hint`} className="vx-field__hint">
          {hint}
        </span>
      )}
      <AnimatePresence>
        {error && (
          <motion.span
            id={`${id}-error`}
            className="vx-field__error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
