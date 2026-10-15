import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { useMediaQuery, usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { createOrbRenderer, hasWebGLApi, type OrbController, type OrbStats } from './orb-renderer';

export interface OrbHandle {
  setPointer(x: number, y: number): void;
  setHover(active: boolean): void;
  pulse(): void;
  setScroll(progress: number): void;
}

interface OrbCanvasProps {
  ref?: Ref<OrbHandle>;
  play: boolean;
  onStats?: (stats: OrbStats | null) => void;
}

/**
 * Mounts the WebGL orb, keeps it sized, pauses it off-screen / in background
 * tabs, and swaps to a CSS-only orb if WebGL is unavailable or the context is lost.
 */
export function OrbCanvas({ ref, play, onStats }: OrbCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<OrbController | null>(null);
  const playRef = useRef(play);
  const statsRef = useRef(onStats);
  const [failed, setFailed] = useState(() => !hasWebGLApi());
  const reduced = usePrefersReducedMotion();
  const constrained = useMediaQuery('(max-width: 767px), (pointer: coarse)');

  useEffect(() => {
    playRef.current = play;
    statsRef.current = onStats;
  });

  useImperativeHandle(
    ref,
    () => ({
      setPointer: (x, y) => controllerRef.current?.setPointer(x, y),
      setHover: (active) => controllerRef.current?.setHover(active),
      pulse: () => controllerRef.current?.pulse(),
      setScroll: (progress) => controllerRef.current?.setScroll(progress),
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (failed || !canvas) return;

    let controller: OrbController;
    try {
      controller = createOrbRenderer(canvas, {
        maxDpr: constrained ? 1.25 : 1.6,
        steps: constrained ? 40 : 60,
        reducedMotion: reduced,
        onStats: (stats) => statsRef.current?.(stats),
        onContextLost: () => setFailed(true),
        onUnderperform: () => {
          console.info('[veltrix] Orb switched to the CSS renderer to keep scrolling smooth on this device.');
          setFailed(true);
        },
      });
    } catch (error) {
      console.warn('[veltrix] WebGL orb unavailable, using CSS fallback.', error);
      const frame = requestAnimationFrame(() => setFailed(true));
      return () => cancelAnimationFrame(frame);
    }

    controllerRef.current = controller;
    if (playRef.current) controller.setIntro(1, 0);

    let visible = false;
    const sync = () => (visible && !document.hidden ? controller.start() : controller.stop());
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      sync();
    });
    const resize = new ResizeObserver(() => controller.resize());
    intersection.observe(canvas);
    resize.observe(canvas);
    document.addEventListener('visibilitychange', sync);

    return () => {
      intersection.disconnect();
      resize.disconnect();
      document.removeEventListener('visibilitychange', sync);
      controller.destroy();
      controllerRef.current = null;
    };
  }, [failed, reduced, constrained]);

  useEffect(() => {
    if (play) controllerRef.current?.setIntro(1, 2.2);
  }, [play]);

  useEffect(() => {
    if (failed) statsRef.current?.(null);
  }, [failed]);

  if (failed) {
    return (
      <div className="vx-orb-fallback" aria-hidden="true">
        <span className="vx-orb-fallback__core" />
        <span className="vx-orb-fallback__ring" />
        <span className="vx-orb-fallback__shine" />
      </div>
    );
  }

  return <canvas ref={canvasRef} className="vx-orb-canvas" aria-hidden="true" />;
}
