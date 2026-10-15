export interface ProcessStep {
  id: string;
  index: string;
  title: string;
  duration: string;
  summary: string;
  deliverables: string[];
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 'discover',
    index: '01',
    title: 'Discover',
    duration: 'Weeks 01 — 02',
    summary:
      'We interrogate the brief, the audience and the competition until the real problem is impossible to ignore. Strategy before pixels, always.',
    deliverables: ['Stakeholder workshops', 'Audience & market audit', 'Experience strategy', 'Success metrics'],
  },
  {
    id: 'design',
    index: '02',
    title: 'Design',
    duration: 'Weeks 03 — 06',
    summary:
      'Art direction, interaction design and motion principles evolve together. Prototypes, not static mockups, so decisions are made in context.',
    deliverables: ['Art direction', 'Interactive prototypes', 'Motion language', 'Design system'],
  },
  {
    id: 'develop',
    index: '03',
    title: 'Develop',
    duration: 'Weeks 05 — 10',
    summary:
      'Engineering starts early and runs in parallel. Typed, tested, accessible code with performance budgets enforced from the very first commit.',
    deliverables: ['Front-end engineering', 'APIs & integrations', 'CMS & content model', 'QA across devices'],
  },
  {
    id: 'launch',
    index: '04',
    title: 'Launch',
    duration: 'Week 11 onward',
    summary:
      'A choreographed release, monitored in real time. Then we measure, learn and refine — launch is the beginning of the story, not the end.',
    deliverables: ['Launch plan', 'Performance monitoring', 'Analytics review', 'Iteration roadmap'],
  },
];
