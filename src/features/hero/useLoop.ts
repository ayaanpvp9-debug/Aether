import { useEffect, useRef, type RefObject } from 'react';
import { clamp } from '../../lib/math';

export interface LoopOptions {
  /** Travel speed in CSS pixels per second on a 1440px-wide viewport. */
  speed: number;
  /** -1 moves the content right → left, 1 moves it left → right. */
  direction?: -1 | 1;
  /** Starting phase (0–1) so parallel rows never line up. */
  phase?: number;
  /** The loop only exists while this is true (e.g. once the display face is ready). */
  enabled: boolean;
  /** Holds the loop exactly where it is (site-wide "pause moving text"). */
  paused?: boolean;
}

/** On-screen test used alongside IntersectionObserver, which some embedded/preview frames misreport. */
function isOnScreen(el: Element) {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < (window.innerHeight || document.documentElement.clientHeight);
}

/**
 * Seamless infinite horizontal loop for a track built from two identical
 * halves: translating by exactly -50% lands on a pixel-identical frame, so the
 * wrap-around is invisible.
 *
 * It runs on the Web Animations API — a compositor-driven transform with no
 * React re-renders — keeps a constant pixel speed when the track resizes
 * (re-timing without a positional jump), pauses while off-screen and holds its
 * position while `paused`.
 */
export function useLoop(ref: RefObject<HTMLElement | null>, { speed, direction = -1, phase = 0, enabled, paused = false }: LoopOptions) {
  const animationRef = useRef<Animation | null>(null);
  const state = useRef({ visible: true, paused });

  const sync = useRef(() => {
    const animation = animationRef.current;
    if (!animation) return;
    const shouldRun = state.current.visible && !state.current.paused;
    if (shouldRun && animation.playState !== 'running') animation.play();
    else if (!shouldRun && animation.playState === 'running') animation.pause();
  });

  useEffect(() => {
    state.current.paused = paused;
    sync.current();
  }, [paused]);

  useEffect(() => {
    const track = ref.current;
    if (!track || !enabled || typeof track.animate !== 'function') return;

    const start = direction < 0 ? 'translate3d(0, 0, 0)' : 'translate3d(-50%, 0, 0)';
    const end = direction < 0 ? 'translate3d(-50%, 0, 0)' : 'translate3d(0, 0, 0)';

    // Narrow screens travel a little slower so the motion feels the same relative to the viewport.
    const measure = () => {
      const half = track.offsetWidth / 2;
      const pxPerSecond = speed * clamp(window.innerWidth / 1440, 0.62, 1.15);
      return Math.max(2000, (half / pxPerSecond) * 1000);
    };

    let duration = measure();
    const animation = track.animate([{ transform: start }, { transform: end }], {
      duration,
      iterations: Infinity,
      easing: 'linear',
    });
    animation.currentTime = clamp(phase, 0, 1) * duration;
    animationRef.current = animation;
    state.current.visible = isOnScreen(track);
    sync.current();

    const retime = () => {
      const next = measure();
      if (Math.abs(next - duration) < 16) return;
      const elapsed = typeof animation.currentTime === 'number' ? animation.currentTime : 0;
      const progress = (elapsed % duration) / duration;
      animation.effect?.updateTiming({ duration: next });
      animation.currentTime = progress * next;
      duration = next;
    };

    const resize = new ResizeObserver(retime);
    resize.observe(track);
    window.addEventListener('resize', retime, { passive: true });

    const visibility = new IntersectionObserver(([entry]) => {
      state.current.visible = (entry?.isIntersecting ?? false) || isOnScreen(track);
      sync.current();
    });
    visibility.observe(track);

    return () => {
      resize.disconnect();
      visibility.disconnect();
      window.removeEventListener('resize', retime);
      animation.cancel();
      animationRef.current = null;
    };
  }, [ref, speed, direction, phase, enabled]);
}
