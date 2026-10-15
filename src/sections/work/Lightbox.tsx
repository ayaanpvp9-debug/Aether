import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Project } from '../../content/projects';
import { useOverlay } from '../../hooks/useOverlay';
import { pad2 } from '../../lib/math';
import { EASE_OUT } from '../../lib/motion';
import { ProjectVisual } from './visuals/ProjectVisual';

interface LightboxProps {
  project: Project;
  index: number | null;
  onChange: (index: number) => void;
  onClose: () => void;
}

const slide: Variants = {
  enter: (direction: number) => ({ x: direction >= 0 ? '30%' : '-30%', opacity: 0, scale: 0.96 }),
  center: { x: '0%', opacity: 1, scale: 1, transition: { duration: 0.6, ease: EASE_OUT } },
  exit: (direction: number) => ({ x: direction >= 0 ? '-30%' : '30%', opacity: 0, scale: 0.96, transition: { duration: 0.35 } }),
};

function LightboxLayer({ project, index, onChange, onClose }: Omit<LightboxProps, 'index'> & { index: number }) {
  const ref = useOverlay<HTMLDivElement>(true, onClose);
  const [direction, setDirection] = useState(0);
  const count = project.gallery.length;
  const item = project.gallery[index]!;
  const goRef = useRef<(delta: number) => void>(() => {});

  const go = (delta: number) => {
    setDirection(delta);
    onChange((index + delta + count) % count);
  };

  useEffect(() => {
    goRef.current = go;
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') goRef.current(1);
      else if (event.key === 'ArrowLeft') goRef.current(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <motion.div
      ref={ref}
      className="vx-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${project.name} gallery`}
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      <div className="vx-lightbox__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="vx-lightbox__top">
        <span className="vx-lightbox__count" aria-live="polite">
          {pad2(index + 1)} / {pad2(count)}
        </span>
        <span className="vx-lightbox__title">{project.name} — fictional concept</span>
        <button type="button" className="vx-icon-btn" onClick={onClose} aria-label="Close gallery" data-autofocus>
          <X size={18} />
        </button>
      </div>

      <div className="vx-lightbox__stage">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.figure
            key={index}
            className="vx-lightbox__figure"
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70 || info.velocity.x < -500) go(1);
              else if (info.offset.x > 70 || info.velocity.x > 500) go(-1);
            }}
            data-cursor-label="Drag"
          >
            <div className="vx-lightbox__frame">
              <ProjectVisual id={project.id} variant={item.variant} accent={project.accent} />
            </div>
            <figcaption>{item.caption}</figcaption>
          </motion.figure>
        </AnimatePresence>
        <button type="button" className="vx-icon-btn vx-lightbox__arrow vx-lightbox__arrow--prev" onClick={() => go(-1)} aria-label="Previous image">
          <ChevronLeft size={20} />
        </button>
        <button type="button" className="vx-icon-btn vx-lightbox__arrow vx-lightbox__arrow--next" onClick={() => go(1)} aria-label="Next image">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="vx-lightbox__thumbs" role="group" aria-label="Gallery images">
        {project.gallery.map((entry, i) => (
          <button
            key={entry.variant}
            type="button"
            className="vx-lightbox__thumb"
            aria-current={i === index ? 'true' : undefined}
            aria-label={`Show image ${i + 1}: ${entry.caption}`}
            onClick={() => {
              setDirection(i > index ? 1 : -1);
              onChange(i);
            }}
          >
            <ProjectVisual id={project.id} variant={entry.variant} accent={project.accent} />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/** Full-screen gallery: arrows, keyboard, swipe/drag, thumbnails, Escape to close. */
export function Lightbox({ project, index, onChange, onClose }: LightboxProps) {
  return createPortal(
    <AnimatePresence>{index !== null && <LightboxLayer project={project} index={index} onChange={onChange} onClose={onClose} />}</AnimatePresence>,
    document.body,
  );
}
