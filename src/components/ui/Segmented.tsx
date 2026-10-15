import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/cn';
import './Segmented.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  /** Optional colour dot (used by the theme switcher). */
  swatch?: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Unique id for the shared sliding indicator. */
  layoutId: string;
  label: string;
  /** "tabs" for tab/filter semantics, "radio" for a single-choice group. */
  kind?: 'tabs' | 'radio';
  /** id of the panel the tabs control (tabs only). */
  controls?: string;
  size?: 'sm' | 'md';
  className?: string;
  stretch?: boolean;
}

/** Segmented control with a spring-animated sliding indicator and arrow-key navigation. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  label,
  kind = 'tabs',
  controls,
  size = 'md',
  className,
  stretch,
}: SegmentedProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = options.length - 1;
    let next = -1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    if (next === -1) return;
    event.preventDefault();
    refs.current[next]?.focus();
    onChange(options[next]!.value);
  };

  return (
    <div
      role={kind === 'tabs' ? 'tablist' : 'radiogroup'}
      aria-label={label}
      className={cn('vx-seg', `vx-seg--${size}`, stretch && 'vx-seg--stretch', className)}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role={kind === 'tabs' ? 'tab' : 'radio'}
            aria-selected={kind === 'tabs' ? selected : undefined}
            aria-checked={kind === 'radio' ? selected : undefined}
            aria-controls={kind === 'tabs' ? controls : undefined}
            tabIndex={selected ? 0 : -1}
            className={cn('vx-seg__option', selected && 'is-selected')}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            data-cursor="link"
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                className="vx-seg__indicator"
                transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                aria-hidden="true"
              />
            )}
            <span className="vx-seg__label">
              {option.swatch && <span className="vx-seg__swatch" style={{ background: option.swatch }} aria-hidden="true" />}
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
