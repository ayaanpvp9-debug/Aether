import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useOverlay } from '../../hooks/useOverlay';
import { cn } from '../../lib/cn';
import { SPRING_MODAL } from '../../lib/motion';
import './Modal.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  className?: string;
  /** Called after the exit animation completes. */
  onExited?: () => void;
  variant?: 'panel' | 'fullscreen';
}

function ModalLayer({ onClose, labelledBy, children, className, variant = 'panel' }: Omit<ModalProps, 'open' | 'onExited'>) {
  const panelRef = useOverlay<HTMLDivElement>(true, onClose);
  return (
    <motion.div className={cn('vx-modal', `vx-modal--${variant}`)} initial="hidden" animate="visible" exit="hidden">
      <motion.div
        className="vx-modal__backdrop"
        onClick={onClose}
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        transition={{ duration: 0.4 }}
        aria-hidden="true"
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn('vx-modal__panel', className)}
        variants={{
          hidden: { opacity: 0, y: 48, scale: 0.965, transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } },
          visible: { opacity: 1, y: 0, scale: 1, transition: SPRING_MODAL },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Portal modal: blurred backdrop, spring entrance, Escape & backdrop close, focus trap and restore. */
export function Modal({ open, onExited, ...rest }: ModalProps) {
  return createPortal(<AnimatePresence onExitComplete={onExited}>{open && <ModalLayer {...rest} />}</AnimatePresence>, document.body);
}
