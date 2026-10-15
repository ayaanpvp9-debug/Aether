/** Sample testimonials with fictional personas — placeholders for demonstration only. */
export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  hue: number;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    quote:
      'They took a brief that was mostly adjectives and turned it into a site our whole team now shows off in meetings. It feels engineered, not decorated.',
    name: 'Sana K.',
    role: 'Head of Brand · fictional fintech',
    hue: 262,
  },
  {
    id: 't2',
    quote:
      'Every interaction feels considered. Nothing moves without a reason — and somehow it is still fast on a three-year-old phone.',
    name: 'Leo M.',
    role: 'Product Lead · fictional mobility startup',
    hue: 199,
  },
  {
    id: 't3',
    quote:
      'The handover was as polished as the launch: documented components, typed APIs and zero mystery in the codebase.',
    name: 'Ana R.',
    role: 'Engineering Manager · fictional SaaS company',
    hue: 292,
  },
  {
    id: 't4',
    quote: 'We asked for bold. They delivered bold that still converts — and an identity that finally feels like us.',
    name: 'Kofi A.',
    role: 'Founder · fictional commerce label',
    hue: 222,
  },
];
