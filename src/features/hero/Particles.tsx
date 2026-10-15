import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { useMediaQuery, usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { createParticleField, type ParticleField } from './particles';

export interface ParticlesHandle {
  setPointer(x: number, y: number): void;
}

/** Canvas of drifting, depth-layered particles behind the hero. */
export function Particles({ ref, className }: { ref?: Ref<ParticlesHandle>; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<ParticleField | null>(null);
  const reduced = usePrefersReducedMotion();
  const constrained = useMediaQuery('(max-width: 767px), (pointer: coarse)');

  useImperativeHandle(ref, () => ({ setPointer: (x, y) => fieldRef.current?.setPointer(x, y) }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let field: ParticleField;
    try {
      field = createParticleField(canvas, { density: constrained ? 0.55 : 1, reducedMotion: reduced });
    } catch {
      return;
    }
    fieldRef.current = field;

    let visible = false;
    const sync = () => (visible && !document.hidden ? field.start() : field.stop());
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      sync();
    });
    let resizeFrame = 0;
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => field.resize());
    });
    intersection.observe(canvas);
    resize.observe(canvas);
    document.addEventListener('visibilitychange', sync);

    return () => {
      cancelAnimationFrame(resizeFrame);
      intersection.disconnect();
      resize.disconnect();
      document.removeEventListener('visibilitychange', sync);
      field.destroy();
      fieldRef.current = null;
    };
  }, [reduced, constrained]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
