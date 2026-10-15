/**
 * VELTRIX orb — a tiny, dependency-free WebGL renderer.
 *
 * A single full-screen triangle runs a ray-marched signed-distance field: a
 * sphere displaced by layered sine fields (cheap "liquid metal"), pulled
 * towards the pointer and rippled by clicks. Shading combines a procedural
 * studio environment, fresnel iridescence and a pointer-driven key light.
 *
 * Performance: bounded by a ray/sphere test, the resolution scale adapts to
 * the measured frame time, and the loop only runs while visible.
 */

const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const fragmentShader = (steps: number) => /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
uniform float uHover;
uniform float uPulse;
uniform float uPulseAge;
uniform float uIntro;
uniform float uScroll;

#define STEPS ${steps}

const vec3 VIOLET = vec3(0.545, 0.361, 0.965);
const vec3 BLUE = vec3(0.220, 0.741, 0.973);
const vec3 MAGENTA = vec3(0.910, 0.475, 0.976);

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float field(vec3 p, float t) {
  float d = sin(p.x * 1.9 + t * 1.1) * sin(p.y * 2.3 - t * 0.8) * sin(p.z * 2.1 + t * 0.7);
  d += 0.55 * sin(p.x * 3.7 - t * 1.4 + p.z * 1.3) * sin(p.y * 3.1 + t * 1.2);
  d += 0.22 * sin(p.y * 6.3 + t * 2.1 + p.x * 2.0) * sin(p.z * 5.7 - t * 1.6);
  return d;
}

vec3 pointerDir() {
  return normalize(vec3(uPointer * 0.85, 0.9));
}

float map(vec3 p) {
  vec3 q = p;
  q.xz *= rot(uTime * 0.11 + uPointer.x * 0.55);
  q.yz *= rot(-uPointer.y * 0.45 + uScroll * 1.4);
  float radius = mix(0.55, 0.98, uIntro);
  float amp = mix(0.34, 0.085, uIntro) + 0.045 * uHover + 0.07 * uScroll;
  float d = length(p) - radius;
  d -= field(q * 1.05, uTime * 0.55) * amp * 0.62;
  float facing = max(dot(normalize(p), pointerDir()), 0.0);
  d -= pow(facing, 7.0) * 0.17 * uHover;
  float wave = sin(facing * 20.0 - uPulseAge * 15.0) * exp(-uPulseAge * 2.0);
  d -= wave * 0.045 * uPulse;
  return d * 0.78;
}

vec3 calcNormal(vec3 p) {
  const float h = 0.0015;
  const vec2 k = vec2(1.0, -1.0);
  return normalize(
    k.xyy * map(p + k.xyy * h) +
    k.yyx * map(p + k.yyx * h) +
    k.yxy * map(p + k.yxy * h) +
    k.xxx * map(p + k.xxx * h)
  );
}

vec3 palette(float t) {
  t = fract(t);
  vec3 c = mix(VIOLET, BLUE, smoothstep(0.0, 0.4, t));
  c = mix(c, MAGENTA, smoothstep(0.4, 0.72, t));
  return mix(c, VIOLET, smoothstep(0.72, 1.0, t));
}

vec3 environment(vec3 r) {
  vec3 col = mix(vec3(0.010, 0.010, 0.018), vec3(0.050, 0.044, 0.085), smoothstep(-1.0, 1.0, r.y));
  vec3 key = normalize(vec3(-0.55, 0.65, 0.55));
  vec3 rim = normalize(vec3(0.85, 0.15, 0.35));
  vec3 bounce = normalize(vec3(0.15, -0.85, 0.35));
  col += vec3(0.62, 0.46, 1.00) * pow(max(dot(r, key), 0.0), 18.0) * 2.2;
  col += vec3(0.24, 0.76, 1.00) * pow(max(dot(r, rim), 0.0), 24.0) * 1.8;
  col += vec3(0.95, 0.42, 0.98) * pow(max(dot(r, bounce), 0.0), 10.0) * 0.55;
  col += vec3(0.85, 0.88, 1.0) * smoothstep(0.06, 0.0, abs(r.y - 0.18 - 0.06 * sin(r.x * 4.0))) * 0.45;
  return col;
}

vec3 shade(vec3 p, vec3 rd) {
  vec3 n = calcNormal(p);
  vec3 v = -rd;
  vec3 r = reflect(rd, n);
  float ndv = clamp(dot(n, v), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 3.0);
  vec3 L = normalize(vec3(uPointer.x * 1.6, uPointer.y * 1.3 + 0.35, 1.1));
  float spec = pow(max(dot(r, L), 0.0), 64.0);
  float diff = max(dot(n, L), 0.0);
  float flow = field(p * 1.35, uTime * 0.4) * 0.5 + 0.5;
  vec3 irid = palette(ndv * 0.9 + flow * 0.32 + uTime * 0.025);

  vec3 col = vec3(0.012, 0.012, 0.02);
  col += environment(r) * (0.5 + 0.9 * fres);
  col += irid * (fres * 0.9 + diff * 0.08);
  col += vec3(1.0) * spec * (0.85 + 0.6 * uHover);
  col += palette(0.15 + uTime * 0.04) * uPulse * exp(-uPulseAge * 1.6) * 0.5 * ndv;
  col = col / (1.0 + col);
  return pow(col, vec3(0.9));
}

void main() {
  float minRes = min(uResolution.x, uResolution.y);
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / minRes;
  vec3 ro = vec3(0.0, 0.0, 3.1);
  vec3 rd = normalize(vec3(uv, -1.0));

  vec4 color = vec4(0.0);
  float b = dot(ro, rd);
  float c = dot(ro, ro) - 1.96;
  float h = b * b - c;
  float pixel = 3.1 / minRes;

  if (h > 0.0) {
    h = sqrt(h);
    float t = -b - h;
    float tFar = -b + h;
    float best = 1e4;
    float tBest = t;
    bool hit = false;
    for (int i = 0; i < STEPS; i++) {
      float d = map(ro + rd * t);
      if (d < best) {
        best = d;
        tBest = t;
      }
      if (d < 0.0008) {
        hit = true;
        break;
      }
      t += d;
      if (t > tFar) break;
    }
    if (hit) {
      color = vec4(shade(ro + rd * t, rd), 1.0);
    } else {
      float coverage = 1.0 - smoothstep(0.0, pixel * 1.6, best);
      if (coverage > 0.0) color = vec4(shade(ro + rd * tBest, rd) * coverage, coverage);
    }
  }

  float dist = length(uv);
  float glow = exp(-max(dist - 0.32, 0.0) * 9.0) * 0.16 * uIntro * (1.0 - color.a);
  vec3 glowCol = mix(VIOLET, BLUE, smoothstep(-0.4, 0.4, uv.x - uv.y * 0.5 + uPointer.x * 0.2));
  color.rgb += glowCol * glow;
  color.a += glow;
  gl_FragColor = color;
}
`;

export interface OrbStats {
  fps: number;
  scale: number;
  engine: 'WebGL 2' | 'WebGL 1';
  /** 'static' when a single frame is rendered (reduced motion). */
  mode: 'live' | 'static';
}

export interface OrbOptions {
  maxDpr: number;
  steps: number;
  reducedMotion: boolean;
  onStats?: (stats: OrbStats) => void;
  onContextLost?: () => void;
  /** Called when even the lowest resolution cannot sustain a smooth frame rate. */
  onUnderperform?: () => void;
}

export interface OrbController {
  setPointer(x: number, y: number): void;
  setHover(active: boolean): void;
  pulse(): void;
  setScroll(progress: number): void;
  setIntro(target: number, duration: number): void;
  start(): void;
  stop(): void;
  resize(): void;
  destroy(): void;
}

type GL = WebGLRenderingContext | WebGL2RenderingContext;

function compile(gl: GL, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

function link(gl: GL, vs: string, fs: string): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to create program');
  const vertex = compile(gl, gl.VERTEX_SHADER, vs);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fs);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    throw new Error(`Program link failed: ${gl.getProgramInfoLog(program)}`);
  }
  return program;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const approach = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

export function createOrbRenderer(canvas: HTMLCanvasElement, options: OrbOptions): OrbController {
  const attributes: WebGLContextAttributes = {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: 'high-performance',
  };
  const gl2 = canvas.getContext('webgl2', attributes);
  const gl: GL | null = gl2 ?? canvas.getContext('webgl', attributes);
  if (!gl) throw new Error('WebGL is not available');
  const engine: OrbStats['engine'] = gl2 ? 'WebGL 2' : 'WebGL 1';

  const program = link(gl, VERTEX_SHADER, fragmentShader(options.steps));
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.clearColor(0, 0, 0, 0);

  const u = {
    resolution: gl.getUniformLocation(program, 'uResolution'),
    time: gl.getUniformLocation(program, 'uTime'),
    pointer: gl.getUniformLocation(program, 'uPointer'),
    hover: gl.getUniformLocation(program, 'uHover'),
    pulse: gl.getUniformLocation(program, 'uPulse'),
    pulseAge: gl.getUniformLocation(program, 'uPulseAge'),
    intro: gl.getUniformLocation(program, 'uIntro'),
    scroll: gl.getUniformLocation(program, 'uScroll'),
  };

  const state = {
    time: 6.5,
    pointer: { x: 0, y: 0, tx: 0, ty: 0 },
    hover: 0,
    hoverTarget: 0,
    pulse: 0,
    pulseAge: 10,
    intro: options.reducedMotion ? 1 : 0,
    introFrom: 0,
    introTo: options.reducedMotion ? 1 : 0,
    introStart: 0,
    introDuration: 0,
    scroll: 0,
    scrollTarget: 0,
    scale: 1,
    running: false,
    raf: 0,
    last: 0,
    // Adaptive quality bookkeeping
    frames: 0,
    frameTime: 0,
    windowStart: 0,
    goodWindows: 0,
    slowWindows: 0,
    statsFrames: 0,
    statsStart: 0,
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr) * state.scale;
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };

  const draw = () => {
    if (gl.isContextLost()) return;
    gl.uniform2f(u.resolution, canvas.width, canvas.height);
    gl.uniform1f(u.time, state.time);
    gl.uniform2f(u.pointer, state.pointer.x, state.pointer.y);
    gl.uniform1f(u.hover, state.hover);
    gl.uniform1f(u.pulse, state.pulse);
    gl.uniform1f(u.pulseAge, state.pulseAge);
    gl.uniform1f(u.intro, state.intro);
    gl.uniform1f(u.scroll, state.scroll);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const adaptQuality = (dt: number, now: number) => {
    state.frames += 1;
    state.frameTime += dt;
    if (!state.windowStart) state.windowStart = now;
    // Evaluate every 45 frames or every second — whichever comes first — so
    // slow devices are rescued within a second instead of after 45 slow frames.
    if (state.frames >= 45 || (state.frames >= 4 && now - state.windowStart >= 1000)) {
      const avg = state.frameTime / state.frames;
      if (avg > 1 / 40 && state.scale > 0.45) {
        state.scale = Math.max(0.45, state.scale * (avg > 1 / 20 ? 0.6 : 0.8));
        state.goodWindows = 0;
        resize();
      } else if (avg > 1 / 24 && state.scale <= 0.45) {
        state.slowWindows += 1;
        if (state.slowWindows >= 3) {
          controller.stop();
          options.onUnderperform?.();
        }
      } else if (avg < 1 / 56 && state.scale < 1) {
        state.slowWindows = 0;
        state.goodWindows += 1;
        if (state.goodWindows >= 4) {
          state.scale = Math.min(1, state.scale * 1.12);
          state.goodWindows = 0;
          resize();
        }
      } else {
        state.goodWindows = 0;
        state.slowWindows = 0;
      }
      state.frames = 0;
      state.frameTime = 0;
      state.windowStart = now;
    }
    state.statsFrames += 1;
    if (now - state.statsStart >= 1000) {
      options.onStats?.({ fps: Math.round((state.statsFrames * 1000) / (now - state.statsStart)), scale: state.scale, engine, mode: 'live' });
      state.statsFrames = 0;
      state.statsStart = now;
    }
  };

  const frame = (now: number) => {
    state.raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0.001, (now - (state.last || now)) / 1000));
    state.last = now;

    state.time += dt;
    state.pointer.x = approach(state.pointer.x, state.pointer.tx, 3.2, dt);
    state.pointer.y = approach(state.pointer.y, state.pointer.ty, 3.2, dt);
    state.hover = approach(state.hover, state.hoverTarget, 4, dt);
    state.scroll = approach(state.scroll, state.scrollTarget, 6, dt);
    if (state.pulse > 0) {
      state.pulseAge += dt;
      state.pulse = Math.max(0, 1 - state.pulseAge / 2.6);
    }
    if (state.introDuration > 0 && state.intro !== state.introTo) {
      const progress = Math.min(1, (now - state.introStart) / (state.introDuration * 1000));
      state.intro = state.introFrom + (state.introTo - state.introFrom) * easeOutCubic(progress);
    }

    adaptQuality(dt, now);
    draw();
  };

  const onContextLost = (event: Event) => {
    event.preventDefault();
    controller.stop();
    options.onContextLost?.();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  const controller: OrbController = {
    setPointer(x, y) {
      state.pointer.tx = x;
      state.pointer.ty = y;
    },
    setHover(active) {
      state.hoverTarget = active ? 1 : 0;
    },
    pulse() {
      if (options.reducedMotion) return;
      state.pulse = 1;
      state.pulseAge = 0;
    },
    setScroll(progress) {
      state.scrollTarget = progress;
    },
    setIntro(target, duration) {
      if (options.reducedMotion || duration <= 0) {
        state.intro = target;
        state.introTo = target;
        state.introDuration = 0;
        if (!state.running) draw();
        return;
      }
      state.introFrom = state.intro;
      state.introTo = target;
      state.introStart = performance.now();
      state.introDuration = duration;
    },
    start() {
      if (state.running) return;
      if (options.reducedMotion) {
        resize();
        draw();
        options.onStats?.({ fps: 0, scale: state.scale, engine, mode: 'static' });
        return;
      }
      state.running = true;
      state.last = 0;
      state.windowStart = 0;
      state.frames = 0;
      state.frameTime = 0;
      state.statsStart = performance.now();
      state.statsFrames = 0;
      state.raf = requestAnimationFrame(frame);
    },
    stop() {
      state.running = false;
      cancelAnimationFrame(state.raf);
    },
    resize() {
      resize();
      if (!state.running) draw();
    },
    destroy() {
      controller.stop();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      if (!gl.isContextLost()) {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
      }
    },
  };

  resize();
  draw();
  return controller;
}

/** Cheap capability check that does not create a context. */
export const hasWebGLApi = () => typeof window !== 'undefined' && 'WebGLRenderingContext' in window;
