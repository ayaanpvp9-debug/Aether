import { useRef } from 'react';
import { useInView } from 'motion/react';
import type { GalleryVariant, ProjectId } from '../../../content/projects';
import { cn } from '../../../lib/cn';
import { AureleArt } from './Aurele';
import { KineticArt } from './Kinetic';
import { ObsidiaArt } from './Obsidia';
import { PerihelionArt } from './Perihelion';
import './visuals.css';

const ART = {
  perihelion: PerihelionArt,
  aurele: AureleArt,
  kinetic: KineticArt,
  obsidia: ObsidiaArt,
} as const;

/** Design-spec annotations shown on the "detail" framing of each concept. */
const DETAIL_NOTES: Record<ProjectId, { origin: string; notes: string[] }> = {
  perihelion: { origin: '22% 82%', notes: ['Telemetry — Geist Mono 500', 'Signal · #38BDF8', 'HUD grid · 8 pt'] },
  aurele: { origin: '50% 56%', notes: ['Serif — Instrument Italic', 'Champagne · #E8C48A', 'Caustic sweep · 6 s'] },
  kinetic: { origin: '78% 34%', notes: ['Display — Unbounded 800', 'Acid · #D7FF3F', 'Velocity skew · −12°'] },
  obsidia: { origin: '74% 46%', notes: ['Glass + metal card', 'Ultraviolet · #8B5CF6', 'Radius 18 · blur 24'] },
};

interface ProjectVisualProps {
  id: ProjectId;
  variant?: GalleryVariant;
  className?: string;
  accent?: string;
}

/** Renders a concept's bespoke composition in one of three framings. Animations pause off-screen. */
export function ProjectVisual({ id, variant = 'cover', className, accent }: ProjectVisualProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '120px 0px' });
  const Art = ART[id];

  return (
    <div ref={ref} className={cn('pv', `pv--${variant}`, !inView && 'is-paused', className)} aria-hidden="true">
      {variant === 'cover' && <Art />}
      {variant === 'detail' && (
        <div className="pv-detail" style={{ '--origin': DETAIL_NOTES[id].origin } as React.CSSProperties}>
          <div className="pv-detail__zoom">
            <Art />
          </div>
          <div className="pv-detail__grid" />
          <ul className="pv-detail__notes">
            {DETAIL_NOTES[id].notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <span className="pv-detail__tag">Detail · 2.0×</span>
        </div>
      )}
      {variant === 'mobile' && (
        <div className="pv-phone-stage" style={{ '--accent': accent ?? '#8B5CF6' } as React.CSSProperties}>
          <div className="pv-phone">
            <div className="pv-phone__screen">
              <Art />
            </div>
            <span className="pv-phone__island" />
          </div>
        </div>
      )}
    </div>
  );
}
