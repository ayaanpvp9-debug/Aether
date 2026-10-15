import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useToast } from '../../../components/ui/toast-context';
import { cn } from '../../../lib/cn';

const FINISHES = [
  { id: 'violet', label: 'Violet', color: '#8B5CF6' },
  { id: 'ice', label: 'Ice', color: '#38BDF8' },
  { id: 'rose', label: 'Rose', color: '#E879F9' },
] as const;

type FinishId = (typeof FINISHES)[number]['id'];

interface Flyer {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: string;
}

let flyerId = 0;

/** Product card with variant swatches, a fly-to-bag animation and a working (local) demo bag. */
export function CommerceDemo() {
  const toast = useToast();
  const [finish, setFinish] = useState<FinishId>('violet');
  const [bag, setBag] = useState<FinishId[]>([]);
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState(false);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const bagRef = useRef<HTMLButtonElement>(null);
  const addedTimer = useRef<number | undefined>(undefined);
  const current = FINISHES.find((f) => f.id === finish)!;

  useEffect(() => () => window.clearTimeout(addedTimer.current), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.querySelector('.vx-shop__bagwrap')?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        bagRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const addToBag = (event: React.MouseEvent<HTMLButtonElement>) => {
    const root = rootRef.current?.getBoundingClientRect();
    const target = bagRef.current?.getBoundingClientRect();
    const source = event.currentTarget.getBoundingClientRect();
    if (root && target) {
      setFlyers((list) => [
        ...list,
        {
          id: ++flyerId,
          x: source.left + source.width / 2 - root.left,
          y: source.top + source.height / 2 - root.top,
          tx: target.left + target.width / 2 - root.left,
          ty: target.top + target.height / 2 - root.top,
          color: current.color,
        },
      ]);
    }
    setBag((items) => [...items, finish]);
    setAdded(true);
    window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setAdded(false), 1400);
  };

  const counts = FINISHES.map((f) => ({ ...f, count: bag.filter((b) => b === f.id).length })).filter((f) => f.count > 0);

  return (
    <div ref={rootRef} className="vx-shop" style={{ '--lamp': current.color } as React.CSSProperties}>
      <div className="vx-shop__top">
        <div>
          <span className="vx-shop__name">Halo — ambient lamp</span>
          <span className="vx-shop__sub">Demo product · local cart only</span>
        </div>
        <div className="vx-shop__bagwrap">
          <button
            ref={bagRef}
            type="button"
            className="vx-shop__bag"
            aria-label={`Demo bag, ${bag.length} item${bag.length === 1 ? '' : 's'}`}
            aria-expanded={open}
            aria-controls="vx-shop-bag"
            onClick={() => setOpen((v) => !v)}
            data-cursor="link"
          >
            <ShoppingBag size={18} aria-hidden="true" />
            <AnimatePresence>
              {bag.length > 0 && (
                <motion.span
                  key={bag.length}
                  className="vx-shop__count"
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.3, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                >
                  {bag.length}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                id="vx-shop-bag"
                className="vx-shop__popover"
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              >
                {counts.length === 0 ? (
                  <p className="vx-shop__empty">Your demo bag is empty.</p>
                ) : (
                  <>
                    <ul>
                      {counts.map((item) => (
                        <li key={item.id}>
                          <span className="vx-shop__chip" style={{ background: item.color }} aria-hidden="true" />
                          Halo · {item.label}
                          <span className="vx-shop__qty">×{item.count}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="vx-shop__total">
                      Total <strong>${bag.length * 240}</strong>
                    </p>
                    <button
                      type="button"
                      className="vx-shop__clear"
                      onClick={() => {
                        setBag([]);
                        setOpen(false);
                        bagRef.current?.focus();
                        toast.push({ title: 'Demo bag cleared', description: 'Nothing was charged — this storefront is a concept.', tone: 'info' });
                      }}
                    >
                      <Trash2 size={14} aria-hidden="true" /> Clear bag
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="vx-shop__stage" aria-hidden="true">
        <div className="vx-lamp">
          <span className="vx-lamp__glow" />
          <span className="vx-lamp__orb" />
          <span className="vx-lamp__stem" />
          <span className="vx-lamp__base" />
        </div>
      </div>

      <div className="vx-shop__row">
        <div className="vx-shop__swatches" role="radiogroup" aria-label="Lamp finish">
          {FINISHES.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={finish === f.id}
              aria-label={f.label}
              className={cn('vx-shop__swatch', finish === f.id && 'is-active')}
              style={{ '--c': f.color } as React.CSSProperties}
              onClick={() => setFinish(f.id)}
              data-cursor="link"
            />
          ))}
          <span className="vx-shop__finish">{current.label}</span>
        </div>
        <span className="vx-shop__price">$240</span>
      </div>

      <button type="button" className={cn('vx-shop__add', added && 'is-added')} onClick={addToBag} data-cursor="link">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={added ? 'added' : 'add'}
            className="vx-shop__add-label"
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {added ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            {added ? 'Added to demo bag' : 'Add to bag'}
          </motion.span>
        </AnimatePresence>
      </button>

      {flyers.map((f) => (
        <motion.span
          key={f.id}
          className="vx-shop__flyer"
          style={{ background: f.color }}
          initial={{ x: f.x, y: f.y, scale: 1, opacity: 1 }}
          animate={{ x: [f.x, (f.x + f.tx) / 2, f.tx], y: [f.y, Math.min(f.y, f.ty) - 70, f.ty], scale: [1, 1.3, 0.35], opacity: [1, 1, 0.2] }}
          transition={{ duration: 0.75, ease: 'easeInOut' }}
          onAnimationComplete={() => setFlyers((list) => list.filter((item) => item.id !== f.id))}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
