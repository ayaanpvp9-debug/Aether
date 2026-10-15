import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../../hooks/useMediaQuery';

interface Dot {
  ox: number;
  oy: number;
  dx: number;
  dy: number;
}

/**
 * Pointer-reactive dot matrix. Dots ease away from the pointer and ride
 * ripple waves on click/tap. The loop sleeps whenever the field is at rest.
 */
export function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let dots: Dot[] = [];
    const pointer = { x: -1e4, y: -1e4, active: false };
    const ripples: Array<{ x: number; y: number; age: number }> = [];
    let raf = 0;
    let last = 0;
    let running = false;

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gap = width < 420 ? 18 : 20;
      dots = [];
      for (let y = gap / 2; y < height; y += gap) {
        for (let x = gap / 2; x < width; x += gap) dots.push({ ox: x, oy: y, dx: 0, dy: 0 });
      }
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const d of dots) {
        const disp = Math.min(1, Math.hypot(d.dx, d.dy) / 16);
        const size = 1.3 + disp * 1.9;
        ctx.globalAlpha = 0.16 + disp * 0.84;
        ctx.fillStyle = disp > 0.08 ? (d.ox / width < 0.5 ? '#a78bfa' : '#7dd3fc') : '#f5f5f7';
        ctx.fillRect(d.ox + d.dx - size / 2, d.oy + d.dy - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    };

    const step = (dt: number) => {
      let energy = 0;
      const ease = 1 - Math.exp(-10 * dt);
      for (const r of ripples) r.age += dt;
      for (let i = ripples.length - 1; i >= 0; i -= 1) if (ripples[i]!.age > 1.4) ripples.splice(i, 1);

      for (const d of dots) {
        let tx = 0;
        let ty = 0;
        if (pointer.active) {
          const vx = d.ox - pointer.x;
          const vy = d.oy - pointer.y;
          const dist = Math.hypot(vx, vy) || 1;
          if (dist < 96) {
            const force = Math.pow(1 - dist / 96, 2) * 24;
            tx += (vx / dist) * force;
            ty += (vy / dist) * force;
          }
        }
        for (const r of ripples) {
          const vx = d.ox - r.x;
          const vy = d.oy - r.y;
          const dist = Math.hypot(vx, vy) || 1;
          const band = Math.abs(dist - r.age * 340);
          if (band < 34) {
            const force = (1 - band / 34) * 12 * (1 - r.age / 1.4);
            tx += (vx / dist) * force;
            ty += (vy / dist) * force;
          }
        }
        d.dx += (tx - d.dx) * ease;
        d.dy += (ty - d.dy) * ease;
        energy += Math.abs(tx - d.dx) + Math.abs(ty - d.dy) + Math.abs(d.dx) * 0.02;
      }
      return energy;
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      const energy = step(dt);
      draw();
      if (pointer.active || ripples.length > 0 || energy > 0.6) {
        raf = requestAnimationFrame(loop);
      } else {
        running = false;
        last = 0;
      }
    };

    const kick = () => {
      if (reduced) return;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    const local = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const onMove = (event: PointerEvent) => {
      const p = local(event);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = true;
      kick();
    };
    const onLeave = () => {
      pointer.active = false;
      kick();
    };
    const onDown = (event: PointerEvent) => {
      const p = local(event);
      ripples.push({ ...p, age: 0 });
      if (event.pointerType !== 'mouse') {
        pointer.x = p.x;
        pointer.y = p.y;
        pointer.active = true;
      }
      kick();
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') onLeave();
    };

    const resize = new ResizeObserver(build);
    resize.observe(canvas);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onLeave);
    };
  }, [reduced]);

  return (
    <div className="vx-dots">
      <canvas ref={canvasRef} className="vx-dots__canvas" aria-label="Interactive dot field. Move the pointer or tap to create ripples." role="img" data-cursor-label="Ripple" />
      <span className="vx-demo-hint vx-dots__hint">
        <span className="vx-only-hover">Move · click to ripple</span>
        <span className="vx-only-touch">Drag · tap to ripple</span>
      </span>
    </div>
  );
}
