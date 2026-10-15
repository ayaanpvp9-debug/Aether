import { useId } from 'react';

const LINE = 'M0,78 C18,74 26,60 44,62 C62,64 70,48 88,46 C106,44 114,58 132,52 C150,46 158,26 176,28 C194,30 204,40 222,30 C240,20 252,14 270,16 C282,17 292,10 300,8';
const AREA = `${LINE} L300,100 L0,100 Z`;

export function ObsidiaArt() {
  const uid = useId().replace(/:/g, '');
  const area = `obs-area-${uid}`;
  return (
    <div className="pv-obs">
      <div className="pv-obs__glow" />
      <div className="pv-obs__panel">
        <span className="pv-obs__label">Total balance</span>
        <span className="pv-obs__balance">
          €24,180<small>.42</small>
        </span>
        <span className="pv-obs__delta">+2.4% this month</span>
        <svg className="pv-obs__chart" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={area} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#C084FC" stopOpacity="0.42" />
              <stop offset="1" stopColor="#C084FC" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={AREA} fill={`url(#${area})`} />
          <path d={LINE} className="pv-obs__line" pathLength={1} />
        </svg>
        <div className="pv-obs__ranges" aria-hidden="true">
          <span>1D</span>
          <span className="is-on">1W</span>
          <span>1M</span>
          <span>1Y</span>
        </div>
      </div>
      <div className="pv-obs__card-wrap">
        <div className="pv-obs__card">
          <span className="pv-obs__brand">OBSIDIA</span>
          <span className="pv-obs__chip" />
          <svg className="pv-obs__nfc" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 7.5a6.5 6.5 0 0 1 0 9M11.5 5a10 10 0 0 1 0 14M15 2.8a13 13 0 0 1 0 18.4" />
          </svg>
          <span className="pv-obs__number">•••• 2049</span>
          <span className="pv-obs__tier">Metal · Virtual</span>
        </div>
      </div>
      <div className="pv-obs__toast">
        <span className="pv-obs__toast-icon" />
        <span>
          <b>+ €1,240.00</b> Salary received
        </span>
      </div>
    </div>
  );
}
