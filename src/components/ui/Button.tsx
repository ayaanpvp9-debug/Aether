import { useState, type MouseEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, ArrowUpRight, LoaderCircle } from 'lucide-react';
import { useMagnetic } from '../../hooks/useMagnetic';
import { cn } from '../../lib/cn';
import { scrollToSection } from '../../lib/scroll';
import './Button.css';

type Variant = 'primary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';
type IconKind = 'arrow' | 'down' | 'none';

interface CommonProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: IconKind | ReactNode;
  magnetic?: boolean;
  loading?: boolean;
  className?: string;
  /** Label shown inside the custom cursor while hovering. */
  cursorLabel?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

type LinkProps = CommonProps & {
  href: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  target?: string;
  rel?: string;
};

type NativeButtonProps = CommonProps & {
  href?: undefined;
  type?: 'button' | 'submit';
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
};

export type ButtonProps = LinkProps | NativeButtonProps;

interface Ripple {
  id: number;
  x: number;
  y: number;
}

let rippleId = 0;

function ButtonIcon({ icon, loading }: { icon: ButtonProps['icon']; loading?: boolean }) {
  if (loading) {
    return (
      <span className="vx-btn__icon" aria-hidden="true">
        <LoaderCircle className="vx-btn__spinner" size={16} strokeWidth={2.2} />
      </span>
    );
  }
  if (icon === 'none' || icon === undefined || icon === null || icon === false) return null;
  const Glyph = icon === 'down' ? ArrowDown : ArrowUpRight;
  if (icon === 'arrow' || icon === 'down') {
    return (
      <span className={cn('vx-btn__icon', icon === 'down' && 'vx-btn__icon--down')} aria-hidden="true">
        <Glyph className="vx-btn__glyph vx-btn__glyph--a" size={16} strokeWidth={2} />
        <Glyph className="vx-btn__glyph vx-btn__glyph--b" size={16} strokeWidth={2} />
      </span>
    );
  }
  return (
    <span className="vx-btn__icon" aria-hidden="true">
      {icon}
    </span>
  );
}

/**
 * Signature VELTRIX button: magnetic pull, liquid fill on hover, rolling label,
 * spring press and a click ripple. Renders an <a> when `href` is provided
 * (in-page hashes scroll smoothly and move focus to the target section).
 */
export function Button(props: ButtonProps) {
  const { children, variant = 'primary', size = 'md', icon = 'arrow', magnetic = true, loading = false, className, cursorLabel } = props;
  const { ref, x, y, innerX, innerY, onPointerMove, onPointerLeave } = useMagnetic<HTMLElement>(size === 'sm' ? 0.22 : 0.3, magnetic);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const addRipple = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const id = ++rippleId;
    // Keyboard activation reports 0,0 — ripple from the centre instead.
    const fromPointer = event.clientX !== 0 || event.clientY !== 0;
    setRipples((list) => [
      ...list,
      { id, x: fromPointer ? event.clientX - rect.left : rect.width / 2, y: fromPointer ? event.clientY - rect.top : rect.height / 2 },
    ]);
  };

  const classes = cn('vx-btn', `vx-btn--${variant}`, `vx-btn--${size}`, icon !== 'none' && 'vx-btn--has-icon', loading && 'is-loading', className);
  const content = (
    <>
      <span className="vx-btn__bg" aria-hidden="true" />
      <motion.span className="vx-btn__inner" style={{ x: innerX, y: innerY }}>
        <span className="vx-btn__label">
          <span className="vx-btn__label-text" data-text={typeof children === 'string' ? children : undefined}>
            {children}
          </span>
        </span>
        <ButtonIcon icon={icon} loading={loading} />
      </motion.span>
      {ripples.map((r) => (
        <span
          key={r.id}
          className="vx-btn__ripple"
          style={{ left: r.x, top: r.y }}
          onAnimationEnd={() => setRipples((list) => list.filter((item) => item.id !== r.id))}
          aria-hidden="true"
        />
      ))}
    </>
  );

  const shared = {
    className: classes,
    style: { x, y },
    onPointerMove,
    onPointerLeave,
    whileTap: { scale: 0.955 },
    transition: { type: 'spring' as const, stiffness: 500, damping: 30 },
    'data-cursor': 'link',
    'data-cursor-label': cursorLabel,
    'aria-label': props['aria-label'],
    'aria-describedby': props['aria-describedby'],
  };

  if (props.href !== undefined) {
    const { href, onClick, target, rel } = props;
    return (
      <motion.a
        {...shared}
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        onClick={(event) => {
          addRipple(event);
          onClick?.(event);
          if (!event.defaultPrevented && href.startsWith('#') && href.length > 1) {
            event.preventDefault();
            scrollToSection(href);
          }
        }}
      >
        {content}
      </motion.a>
    );
  }

  const { type = 'button', onClick, disabled } = props;
  return (
    <motion.button
      {...shared}
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={(event) => {
        addRipple(event);
        onClick?.(event);
      }}
    >
      {content}
    </motion.button>
  );
}
