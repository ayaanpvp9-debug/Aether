import { useId } from 'react';

const LATITUDES = [-60, -40, -20, 0, 20, 40, 60];
const TILT = 0.38;
const POINTS: Array<[number, number]> = [
  [-62, -48],
  [38, -86],
  [84, 18],
  [-24, 64],
  [-98, 22],
  [12, -14],
];

export function PerihelionArt() {
  const uid = useId().replace(/:/g, '');
  const fill = `peri-fill-${uid}`;
  const halo = `peri-halo-${uid}`;
  const clip = `peri-clip-${uid}`;
  return (
    <div className="pv-peri">
      <div className="pv-peri__sky" />
      <svg className="pv-peri__globe" viewBox="-230 -230 460 460" aria-hidden="true">
        <defs>
          <radialGradient id={fill} cx="38%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#173C69" />
            <stop offset="52%" stopColor="#081A33" />
            <stop offset="100%" stopColor="#030914" />
          </radialGradient>
          <radialGradient id={halo} r="50%">
            <stop offset="62%" stopColor="#38BDF8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </radialGradient>
          <clipPath id={clip}>
            <circle r="150" />
          </clipPath>
        </defs>
        <circle r="228" fill={`url(#${halo})`} />
        <circle r="150" fill={`url(#${fill})`} stroke="rgba(125, 211, 252, 0.5)" strokeWidth="1" />
        <g clipPath={`url(#${clip})`} className="pv-peri__grid">
          {LATITUDES.map((lat) => {
            const phi = (lat * Math.PI) / 180;
            const r = 150 * Math.cos(phi);
            return <ellipse key={lat} cx={0} cy={-150 * Math.sin(phi) * Math.cos(TILT)} rx={r} ry={r * Math.sin(TILT)} />;
          })}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse key={i} className="pv-peri__meridian" rx="150" ry="150" style={{ animationDelay: `${-i * 2}s` }} />
          ))}
        </g>
        <g>
          {POINTS.map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <circle r="2.6" className="pv-peri__dot" />
              <circle r="2.6" className="pv-peri__ping" style={{ animationDelay: `${i * 0.6}s` }} />
            </g>
          ))}
        </g>
        <g transform="rotate(-16)">
          <ellipse rx="198" ry="62" className="pv-peri__orbit" />
          <circle r="5.5" className="pv-peri__sat">
            <animateMotion dur="11s" repeatCount="indefinite" path="M 198 0 A 198 62 0 1 1 -198 0 A 198 62 0 1 1 198 0" />
          </circle>
        </g>
        <g transform="rotate(30)">
          <ellipse rx="176" ry="40" className="pv-peri__orbit pv-peri__orbit--b" />
          <circle r="4" className="pv-peri__sat pv-peri__sat--b">
            <animateMotion dur="7s" repeatCount="indefinite" path="M -176 0 A 176 40 0 1 0 176 0 A 176 40 0 1 0 -176 0" />
          </circle>
        </g>
      </svg>

      <div className="pv-peri__hud">
        <div className="pv-peri__top">
          <span className="pv-peri__logo">Perihelion</span>
          <span className="pv-peri__live">
            <i /> Live · 2,431 objects
          </span>
        </div>
        <div className="pv-peri__readout">
          <span>
            ALT <b>412.6 km</b>
          </span>
          <span>
            INC <b>51.64°</b>
          </span>
          <span>
            VEL <b>7.66 km/s</b>
          </span>
        </div>
        <div className="pv-peri__bars">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${-i * 0.37}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
