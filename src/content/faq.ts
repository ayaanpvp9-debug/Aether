export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'real',
    question: 'Is VELTRIX a real studio?',
    answer:
      'VELTRIX is a demonstration brand. This website is a fully working concept experience: the projects, testimonials and metrics are fictional or illustrative and are labelled as such. The interactions, the inquiry API and the database behind the contact form are real.',
  },
  {
    id: 'engagement',
    question: 'What does a typical engagement look like?',
    answer:
      'A focused discovery phase, followed by design and engineering running in parallel, then a choreographed launch. Most flagship websites in this model take roughly 8–14 weeks, depending on scope and content readiness.',
  },
  {
    id: 'stack',
    question: 'Which technologies power experiences like this one?',
    answer:
      'This site runs on React 19, TypeScript and Motion, with compositor-driven typography loops in the hero and a dependency-free Node API backed by SQLite. The principle is always the same: the smallest stack that delivers the experience.',
  },
  {
    id: 'performance',
    question: 'Won’t all this motion make the site slow?',
    answer:
      'Not when it is engineered carefully. Animations use transforms and opacity, the hero’s moving type runs on the compositor and pauses when off-screen, and everything calms down if your system requests reduced motion.',
  },
  {
    id: 'accessibility',
    question: 'How do you approach accessibility?',
    answer:
      'Semantic HTML, full keyboard support, visible focus states, readable contrast and reduced-motion alternatives are part of the baseline — not an afterthought. Overlays trap focus and close with Escape.',
  },
  {
    id: 'inquiry',
    question: 'What happens when I send the inquiry form?',
    answer:
      'Your brief is validated in the browser, validated again on the server, sanitised and stored in the site’s database with a unique reference code. No email is sent in this demo, and the site never claims delivery unless the server confirms storage.',
  },
  {
    id: 'startups',
    question: 'Do you work with early-stage teams?',
    answer:
      'The model works for ambitious teams of any size. For early-stage products, a focused launch scope usually delivers the most impact per dollar — the budget selector in the form is a good place to start the conversation.',
  },
];
