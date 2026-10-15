import './RollText.css';

/**
 * Per-character rolling label for links. The parent element should carry the
 * `vx-roll-host` class so hovering anywhere on it triggers the roll.
 */
export function RollText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className ? `vx-roll ${className}` : 'vx-roll'}>
      <span className="sr-only">{text}</span>
      <span className="vx-roll__chars" aria-hidden="true">
        {[...text].map((char, i) => (
          <span key={i} className="vx-roll__char" data-char={char === ' ' ? '\u00A0' : char} style={{ '--i': i } as React.CSSProperties}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    </span>
  );
}
