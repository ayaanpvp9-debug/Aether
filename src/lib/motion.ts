import type { Transition } from 'motion/react';

/** Shared motion language. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const;
export const EASE_EXPO = [0.16, 1, 0.3, 1] as const;

export const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 };
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 };
export const SPRING_MODAL: Transition = { type: 'spring', stiffness: 260, damping: 28, mass: 0.9 };
