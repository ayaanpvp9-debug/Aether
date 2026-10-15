import { useId } from 'react';

const ROWS = [
  { text: 'KINETIC FORM — ', tone: 'dim', dur: 26, dir: 1 },
  { text: 'MOTION FIRST — ', tone: 'solid', dur: 18, dir: -1 },
  { text: 'KINETIC FORM — ', tone: 'acid', dur: 14, dir: 1 },
  { text: 'BUILT FOR SPEED — ', tone: 'solid', dur: 22, dir: -1 },
  { text: 'KINETIC FORM — ', tone: 'dim', dur: 30, dir: 1 },
] as const;

export function KineticArt() {
  const uid = useId().replace(/:/g, '');
  const ringPath = `kin-ring-${uid}`;
  return (
    <div className="pv-kin">
      <div className="pv-kin__stripes" />
      <div className="pv-kin__rows">
        {ROWS.map((row, i) => (
          <div
            key={i}
            className={`pv-kin__row pv-kin__row--${row.tone}`}
            style={{ '--dur': `${row.dur}s`, '--dir': row.dir === 1 ? 'normal' : 'reverse' } as React.CSSProperties}
          >
            <div className="pv-kin__track">
              <span>{row.text.repeat(3)}</span>
              <span>{row.text.repeat(3)}</span>
            </div>
          </div>
        ))}
      </div>
      <svg className="pv-kin__lane" viewBox="0 0 400 220" preserveAspectRatio="none" aria-hidden="true">
        <path d="M -20 190 C 110 190, 170 60, 420 70" className="pv-kin__path" />
        <path d="M -20 205 C 120 205, 185 80, 420 92" className="pv-kin__path pv-kin__path--ghost" />
      </svg>
      <div className="pv-kin__badge">
        <svg className="pv-kin__ring" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <path id={ringPath} d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
          </defs>
          <text>
            <textPath href={`#${ringPath}`}>MOTION FIRST · KINETIC FORM · 2026 ·</textPath>
          </text>
        </svg>
        <span className="pv-kin__mono">K/F</span>
      </div>
      <div className="pv-kin__data">
        <span>
          Cadence <b>182 spm</b>
        </span>
        <span>
          Pace <b>+4.2%</b>
        </span>
      </div>
    </div>
  );
}
