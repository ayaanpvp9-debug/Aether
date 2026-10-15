import { cloneElement, isValidElement, useId, useRef, useState, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../lib/cn';
import './Tooltip.css';

interface TooltipProps {
  content: string;
  children: ReactElement<{ 'aria-describedby'?: string }>;
  side?: 'top' | 'bottom';
  align?: 'center' | 'start' | 'end';
  className?: string;
}

/** Hover / focus tooltip with a short intent delay. Wires aria-describedby onto its trigger. */
export function Tooltip({ content, children, side = 'top', align = 'center', className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const show = (delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };

  const descriptionId = `${id}-desc`;
  const trigger = isValidElement(children) ? cloneElement(children, { 'aria-describedby': descriptionId }) : children;

  return (
    <span
      className={cn('vx-tip', className)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && show(260)}
      onPointerLeave={hide}
      onFocus={() => show(0)}
      onBlur={hide}
      onKeyDown={(e) => e.key === 'Escape' && hide()}
    >
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            aria-hidden="true"
            className={cn('vx-tip__bubble', `vx-tip__bubble--${side}`, `vx-tip__bubble--${align}`)}
            initial={{ opacity: 0, y: side === 'top' ? 6 : -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === 'top' ? 4 : -4, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 32 }}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
      {/* The description is always available to assistive tech; the bubble is purely visual. */}
      <span id={descriptionId} className="sr-only">
        {content}
      </span>
    </span>
  );
}
