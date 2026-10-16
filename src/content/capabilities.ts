export type CapabilityId = 'web' | 'stack' | 'interactive' | 'commerce' | 'brand' | 'performance';

export interface Capability {
  id: CapabilityId;
  index: string;
  title: string;
  summary: string;
  tags: string[];
}

export const CAPABILITIES: Capability[] = [
  {
    id: 'web',
    index: '01',
    title: 'Creative web design',
    summary: 'Art-directed, editorial websites with a point of view — layouts that recompose like a magazine spread. Try the presets.',
    tags: ['Art direction', 'Editorial layout', 'Motion'],
  },
  {
    id: 'stack',
    index: '02',
    title: 'Full-stack development',
    summary: 'Typed front-ends, fast APIs and dependable data. This card pings the real API behind this site.',
    tags: ['React', 'Node', 'SQL'],
  },
  {
    id: 'interactive',
    index: '03',
    title: 'Interactive experiences',
    summary: 'WebGL, canvas and physics-driven interfaces that answer every gesture without dropping frames.',
    tags: ['WebGL', 'Canvas', 'Creative coding'],
  },
  {
    id: 'commerce',
    index: '04',
    title: 'E-commerce experiences',
    summary: 'Storefronts where discovery feels like a showroom and checkout feels effortless.',
    tags: ['Headless', 'Conversion', 'Merchandising'],
  },
  {
    id: 'brand',
    index: '05',
    title: 'Brand systems',
    summary: 'Identities engineered as tokens, type and motion rules — consistent from favicon to billboard.',
    tags: ['Identity', 'Design tokens', 'Guidelines'],
  },
  {
    id: 'performance',
    index: '06',
    title: 'Performance optimization',
    summary: 'Core Web Vitals treated as a design constraint. The numbers here are measured live, in your browser, right now.',
    tags: ['Core Web Vitals', 'Budgets', 'Monitoring'],
  },
];
