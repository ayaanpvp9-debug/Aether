import { seeded } from '../../lib/math';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  twinkle: number;
  sprite: number;
}

export interface ParticleField {
  setPointer(x: number, y: number): void;
  start(): void;
  stop(): void;
  resize(): void;
  destroy(): void;
}

function makeSprite(rgb: string): HTMLCanvasElement {
  const size = 32;
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = size;
  const ctx = sprite.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, `rgba(${rgb},1)`);
    g.addColorStop(0.25, `rgba(${rgb},0.55)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  return sprite;
}

/**
 * Ambient depth-layered dust. Pre-rendered sprites + drawImage keep it cheap;
 * the loop pauses whenever the hero is off-screen.
 */
export function createParticleField(canvas: HTMLCanvasElement, { density = 1, reducedMotion = false } = {}): ParticleField {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');

  const sprites = [makeSprite('245,245,247'), makeSprite('167,139,250'), makeSprite('56,189,248')];
  let particles: Particle[] = [];
  let width = 0;
  let height = 0;
  let raf = 0;
  let running = false;
  let last = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  const seed = () => {
    const rand = seeded(1337);
    const count = Math.round(Math.min(130, Math.max(28, ((width * height) / 11000) * density)));
    particles = Array.from({ length: count }, () => {
      const r = rand();
      return {
        x: rand() * width,
        y: rand() * height,
        z: 0.15 + rand() * 0.85,
        vx: (rand() - 0.5) * 0.08,
        vy: -(0.04 + rand() * 0.2),
        twinkle: rand() * Math.PI * 2,
        sprite: r < 0.1 ? 1 : r < 0.18 ? 2 : 0,
      };
    });
  };

  const draw = (dt: number) => {
    ctx.clearRect(0, 0, width, height);
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 2.5);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 2.5);
    const step = dt * 60;
    for (const p of particles) {
      p.x += p.vx * step * p.z;
      p.y += p.vy * step * p.z;
      p.twinkle += dt * (0.5 + p.z);
      if (p.y < -12) {
        p.y = height + 12;
        p.x = Math.random() * width;
      }
      if (p.x < -12) p.x = width + 12;
      else if (p.x > width + 12) p.x = -12;

      const size = (0.7 + p.z * 2.3) * (p.sprite === 0 ? 1 : 1.5);
      const ox = pointer.x * p.z * 28;
      const oy = -pointer.y * p.z * 18;
      ctx.globalAlpha = (0.14 + p.z * 0.5) * (0.6 + 0.4 * Math.sin(p.twinkle));
      ctx.drawImage(sprites[p.sprite]!, p.x + ox - size * 2, p.y + oy - size * 2, size * 4, size * 4);
    }
    ctx.globalAlpha = 1;
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    draw(dt);
  };

  const field: ParticleField = {
    setPointer(x, y) {
      pointer.tx = x;
      pointer.ty = y;
    },
    start() {
      if (running) return;
      if (reducedMotion) {
        draw(0);
        return;
      }
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      draw(0);
    },
    destroy() {
      field.stop();
      particles = [];
    },
  };

  field.resize();
  return field;
}
