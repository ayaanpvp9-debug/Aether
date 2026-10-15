import { motion } from 'motion/react';
import { ArrowUpRight, FlaskConical } from 'lucide-react';
import type { Project } from '../../content/projects';
import { useTilt } from '../../hooks/useTilt';
import { cn } from '../../lib/cn';
import { EASE_OUT } from '../../lib/motion';
import { ProjectVisual } from './visuals/ProjectVisual';

export type CardSpan = 'wide' | 'narrow' | 'full';

interface ProjectCardProps {
  project: Project;
  span: CardSpan;
  offset?: boolean;
  order: number;
  onOpen: () => void;
}

export function ProjectCard({ project, span, offset, order, onOpen }: ProjectCardProps) {
  const tiltRef = useTilt<HTMLElement>({ max: 4 });

  return (
    <motion.li
      layout
      className={cn('vx-pcard', `vx-pcard--${span}`, offset && 'vx-pcard--offset')}
      data-project-card={project.id}
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
      transition={{
        layout: { type: 'spring', stiffness: 180, damping: 26 },
        opacity: { duration: 0.8, delay: (order % 2) * 0.12 },
        y: { duration: 1, ease: EASE_OUT, delay: (order % 2) * 0.12 },
      }}
    >
      <article ref={tiltRef} className="vx-pcard__inner" style={{ '--accent': project.accent } as React.CSSProperties}>
        <div className="vx-pcard__media">
          <div className="vx-pcard__visual">
            <ProjectVisual id={project.id} />
          </div>
          <span className="vx-pcard__glare" aria-hidden="true" />
        </div>
        <div className="vx-pcard__meta">
          <div className="vx-pcard__heading">
            <span className="vx-pcard__index" aria-hidden="true">
              {project.index}
            </span>
            <h3 className="vx-pcard__title">
              <button type="button" className="vx-pcard__trigger" onClick={onOpen} data-cursor="view" data-cursor-label="View">
                {project.name}
                <span className="sr-only">, fictional concept — open details</span>
              </button>
            </h3>
            <span className="vx-pcard__arrow" aria-hidden="true">
              <ArrowUpRight size={18} />
            </span>
          </div>
          <p className="vx-pcard__tagline">{project.tagline}</p>
          <div className="vx-pcard__info">
            <span className="vx-pcard__cat">{project.category}</span>
            <span className="vx-pcard__concept">
              <FlaskConical size={12} aria-hidden="true" /> Fictional concept
            </span>
          </div>
          <ul className="vx-pcard__tags" aria-label="Disciplines">
            {project.tags.map((tag) => (
              <li key={tag} className="vx-tag">
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </article>
    </motion.li>
  );
}
