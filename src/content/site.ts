export const SITE = {
  name: 'VELTRIX',
  tagline: 'Digital, reimagined.',
  description:
    'VELTRIX is a concept creative-technology studio crafting cinematic websites, full-stack products and interactive brand systems.',
  /** Placeholder address — replace with a real inbox before going live. */
  email: 'hello@veltrix.example',
  year: new Date().getFullYear(),
} as const;

export interface NavItem {
  id: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'work', label: 'Work' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'lab', label: 'Lab' },
  { id: 'process', label: 'Process' },
  { id: 'faq', label: 'FAQ' },
];

/**
 * Social profiles are placeholders. Add real URLs here to turn them into links;
 * while `href` is null the UI labels them as placeholders.
 */
export const SOCIALS: { label: string; handle: string; href: string | null }[] = [
  { label: 'Instagram', handle: '@veltrix', href: null },
  { label: 'LinkedIn', handle: 'veltrix-studio', href: null },
  { label: 'X / Twitter', handle: '@veltrix', href: null },
  { label: 'Dribbble', handle: 'veltrix', href: null },
];

export const MARQUEE_PHRASES = ['Design without limits', 'Engineered to impress', 'Built for the future'];

/** Oversized words drifting behind the hero headline (decorative). */
export const HERO_BACKDROP_WORDS = ['Design', 'Develop', 'Innovate', 'Digital'];

/** Phrases on the conveyor strip directly under the hero copy. */
export const HERO_CONVEYOR_PHRASES = ['Creative development', 'Interactive experiences', 'Digital design', 'Built to stand out'];
