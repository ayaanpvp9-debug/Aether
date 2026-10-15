import { useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/cn';
import './Switch.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  /** Visually hide the label (it stays available to assistive tech). */
  hideLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

/** Accessible switch (role="switch") with a springy thumb. */
export function Switch({ checked, onChange, label, description, hideLabel, className, size = 'md' }: SwitchProps) {
  const id = useId();
  return (
    <div className={cn('vx-switch-row', hideLabel && 'vx-switch-row--bare', className)}>
      <span className={hideLabel ? 'sr-only' : 'vx-switch-row__text'}>
        <span id={`${id}-label`} className="vx-switch-row__label">
          {label}
        </span>
        {description && (
          <span id={`${id}-desc`} className="vx-switch-row__desc">
            {description}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        className={cn('vx-switch', `vx-switch--${size}`, checked && 'is-on')}
        onClick={() => onChange(!checked)}
        data-cursor="link"
      >
        <span className="vx-switch__track" aria-hidden="true" />
        <motion.span
          className="vx-switch__thumb"
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 34 }}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
