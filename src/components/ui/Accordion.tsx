import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../lib/cn';
import { EASE_OUT } from '../../lib/motion';
import { pad2 } from '../../lib/math';
import './Accordion.css';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

/** Single-expand accordion with animated height, morphing icon and arrow-key navigation. */
export function Accordion({ items, defaultOpen = null }: { items: AccordionItem[]; defaultOpen?: string | null }) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(defaultOpen);
  const triggers = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1;
    let next = -1;
    if (event.key === 'ArrowDown') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowUp') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    if (next === -1) return;
    event.preventDefault();
    triggers.current[next]?.focus();
  };

  return (
    <div className="vx-acc">
      {items.map((item, index) => {
        const open = openId === item.id;
        const triggerId = `${baseId}-${item.id}-trigger`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div key={item.id} className={cn('vx-acc__item', open && 'is-open')}>
            <h3 className="vx-acc__heading">
              <button
                ref={(node) => {
                  triggers.current[index] = node;
                }}
                id={triggerId}
                type="button"
                className="vx-acc__trigger"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : item.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
                data-cursor="link"
              >
                <span className="vx-acc__index">{pad2(index + 1)}</span>
                <span className="vx-acc__title">{item.title}</span>
                <span className="vx-acc__icon" aria-hidden="true">
                  <span />
                  <span />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className="vx-acc__panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1, transition: { height: { duration: 0.5, ease: EASE_OUT }, opacity: { duration: 0.35, delay: 0.08 } } }}
                  exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.4, ease: EASE_OUT }, opacity: { duration: 0.2 } } }}
                >
                  <motion.div
                    className="vx-acc__content"
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    exit={{ y: -6 }}
                    transition={{ duration: 0.45, ease: EASE_OUT }}
                  >
                    {item.content}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
