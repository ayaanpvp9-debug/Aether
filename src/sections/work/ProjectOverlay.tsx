import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Copy, FlaskConical, Maximize2, X } from 'lucide-react';
import { PROJECTS, type Project, type ProjectId } from '../../content/projects';
import { useOverlay } from '../../hooks/useOverlay';
import { copyText } from '../../lib/clipboard';
import { pad2 } from '../../lib/math';
import { EASE_IN_OUT, EASE_OUT } from '../../lib/motion';
import { useToast } from '../../components/ui/toast-context';
import { Lightbox } from './Lightbox';
import { ProjectVisual } from './visuals/ProjectVisual';

interface OverlayContext {
  /** Returns the on-screen rect of the card the overlay should expand from / collapse into. */
  rect: () => DOMRect | null;
}

function clipFor(rect: DOMRect | null): string {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!rect || rect.bottom < 0 || rect.top > vh) {
    return `inset(${vh * 0.12}px ${vw * 0.12}px ${vh * 0.12}px ${vw * 0.12}px round 32px)`;
  }
  return `inset(${Math.max(0, rect.top)}px ${Math.max(0, vw - rect.right)}px ${Math.max(0, vh - rect.bottom)}px ${Math.max(0, rect.left)}px round 26px)`;
}

const shell: Variants = {
  initial: (ctx: OverlayContext) => ({ clipPath: clipFor(ctx.rect()), opacity: ctx.rect() ? 1 : 0 }),
  enter: { clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1, transition: { duration: 0.85, ease: EASE_IN_OUT } },
  exit: (ctx: OverlayContext) => ({
    clipPath: clipFor(ctx.rect()),
    opacity: ctx.rect() ? 1 : 0,
    transition: { duration: 0.7, ease: EASE_IN_OUT },
  }),
};

const stagger: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT, delay: 0.25 + i * 0.07 } }),
};

function ProjectBody({ project, onNavigate }: { project: Project; onNavigate: (id: ProjectId) => void }) {
  const toast = useToast();
  const [lightbox, setLightbox] = useState<number | null>(null);
  const index = PROJECTS.findIndex((p) => p.id === project.id);
  const next = PROJECTS[(index + 1) % PROJECTS.length]!;

  const copy = async (hex: string, name: string) => {
    const ok = await copyText(hex);
    toast.push(ok ? { title: `${hex} copied`, description: `${name} — ${project.name} palette`, tone: 'success' } : { title: 'Copy failed', description: 'Your browser blocked clipboard access.', tone: 'error' });
  };

  return (
    <motion.article
      className="vx-project__body"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } }}
      exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
    >
      <motion.div className="vx-project__hero" variants={stagger} initial="hidden" animate="visible" custom={0}>
        <ProjectVisual id={project.id} />
      </motion.div>

      <div className="vx-project__intro">
        <motion.div className="vx-project__heading" variants={stagger} initial="hidden" animate="visible" custom={1}>
          <span className="vx-eyebrow">
            <span className="vx-eyebrow__index">{project.index}</span> {project.category} · {project.year}
          </span>
          <h2 id="vx-project-title" className="vx-project__title">
            {project.name}
          </h2>
          <p className="vx-project__tagline vx-serif">{project.tagline}</p>
        </motion.div>
        <motion.div className="vx-project__summary" variants={stagger} initial="hidden" animate="visible" custom={2}>
          <span className="vx-notice">
            <FlaskConical size={13} aria-hidden="true" /> Fictional concept — self-initiated, not client work
          </span>
          <p>{project.summary}</p>
        </motion.div>
      </div>

      <motion.dl className="vx-project__facts" variants={stagger} initial="hidden" animate="visible" custom={3}>
        <div>
          <dt>Role</dt>
          <dd>{project.role.join(', ')}</dd>
        </div>
        <div>
          <dt>Stack</dt>
          <dd>{project.stack.join(', ')}</dd>
        </div>
        <div>
          <dt>Disciplines</dt>
          <dd>{project.tags.join(', ')}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{project.year}</dd>
        </div>
      </motion.dl>

      <div className="vx-project__story">
        {(
          [
            ['Challenge', project.challenge],
            ['Approach', project.approach],
            ['Outcome (illustrative)', project.outcome],
          ] as const
        ).map(([title, text], i) => (
          <motion.section
            key={title}
            className="vx-project__chapter"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: i * 0.08 }}
          >
            <h3>
              <span>{pad2(i + 1)}</span>
              {title}
            </h3>
            <p>{text}</p>
          </motion.section>
        ))}
      </div>

      <section className="vx-project__palette" aria-labelledby="vx-project-palette">
        <h3 id="vx-project-palette" className="vx-project__label">
          Palette <span>— click a swatch to copy</span>
        </h3>
        <ul>
          {project.palette.map((swatch) => (
            <li key={swatch.hex}>
              <button type="button" className="vx-swatch" onClick={() => copy(swatch.hex, swatch.name)} data-cursor-label="Copy">
                <span className="vx-swatch__chip" style={{ background: swatch.hex }} />
                <span className="vx-swatch__name">{swatch.name}</span>
                <span className="vx-swatch__hex">
                  {swatch.hex} <Copy size={12} aria-hidden="true" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="vx-project__gallery" aria-labelledby="vx-project-gallery">
        <h3 id="vx-project-gallery" className="vx-project__label">
          Gallery <span>— {project.gallery.length} views</span>
        </h3>
        <ul>
          {project.gallery.map((item, i) => (
            <li key={item.variant}>
              <button type="button" className="vx-gallery-tile" onClick={() => setLightbox(i)} data-cursor-label="Open">
                <span className="vx-gallery-tile__media">
                  <ProjectVisual id={project.id} variant={item.variant} accent={project.accent} />
                </span>
                <span className="vx-gallery-tile__caption">
                  <span>{item.caption}</span>
                  <Maximize2 size={14} aria-hidden="true" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <button type="button" className="vx-project__next" onClick={() => onNavigate(next.id)} data-cursor-label="Next">
        <span className="vx-eyebrow">Next concept</span>
        <span className="vx-project__next-name">
          {next.name}
          <ArrowUpRight className="vx-project__next-icon" aria-hidden="true" />
        </span>
      </button>

      <Lightbox project={project} index={lightbox} onChange={setLightbox} onClose={() => setLightbox(null)} />
    </motion.article>
  );
}

interface OverlayLayerProps {
  project: Project;
  context: OverlayContext;
  onClose: () => void;
  onNavigate: (id: ProjectId) => void;
}

function OverlayLayer({ project, context, onClose, onNavigate }: OverlayLayerProps) {
  const ref = useOverlay<HTMLDivElement>(true, onClose);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const index = PROJECTS.findIndex((p) => p.id === project.id);
  const prev = PROJECTS[(index - 1 + PROJECTS.length) % PROJECTS.length]!;
  const next = PROJECTS[(index + 1) % PROJECTS.length]!;

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [project.id]);

  return (
    <motion.div
      ref={ref}
      className="vx-project"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vx-project-title"
      tabIndex={-1}
      custom={context}
      variants={shell}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      <div ref={scrollerRef} className="vx-project__scroller">
        <div className="vx-project__bar">
          <div className="vx-project__crumbs">
            <span className="vx-project__counter">
              {project.index} <span>/ {pad2(PROJECTS.length)}</span>
            </span>
            <span className="vx-project__crumb">{project.name}</span>
          </div>
          <div className="vx-project__actions">
            <button type="button" className="vx-icon-btn" onClick={() => onNavigate(prev.id)} aria-label={`Previous concept: ${prev.name}`}>
              <ArrowLeft size={18} />
            </button>
            <button type="button" className="vx-icon-btn" onClick={() => onNavigate(next.id)} aria-label={`Next concept: ${next.name}`}>
              <ArrowRight size={18} />
            </button>
            <button type="button" className="vx-icon-btn vx-icon-btn--solid" onClick={onClose} aria-label="Close project" data-autofocus>
              <X size={18} />
            </button>
          </div>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <ProjectBody key={project.id} project={project} onNavigate={onNavigate} />
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface ProjectOverlayProps {
  openId: ProjectId | null;
  onClose: () => void;
  onNavigate: (id: ProjectId) => void;
  /** Rect of the card that was clicked, used for the expand transition. */
  getOriginRect: (id: ProjectId) => DOMRect | null;
}

/** Full-screen case-study view that expands out of (and collapses back into) its card. */
export function ProjectOverlay({ openId, onClose, onNavigate, getOriginRect }: ProjectOverlayProps) {
  const project = PROJECTS.find((p) => p.id === openId) ?? null;
  const lastId = useRef<ProjectId | null>(openId);

  useEffect(() => {
    if (openId) lastId.current = openId;
  }, [openId]);

  const context: OverlayContext = {
    rect: () => {
      const id = openId ?? lastId.current;
      return id ? getOriginRect(id) : null;
    },
  };

  return createPortal(
    <AnimatePresence custom={context}>
      {project && <OverlayLayer key="project-overlay" project={project} context={context} onClose={onClose} onNavigate={onNavigate} />}
    </AnimatePresence>,
    document.body,
  );
}
