export type ProjectId = 'perihelion' | 'aurele' | 'kinetic' | 'obsidia';
export type ProjectGroup = 'product' | 'commerce' | 'brand';
export type GalleryVariant = 'cover' | 'detail' | 'mobile';

export interface Project {
  id: ProjectId;
  index: string;
  name: string;
  tagline: string;
  group: ProjectGroup;
  category: string;
  tags: string[];
  year: string;
  accent: string;
  summary: string;
  challenge: string;
  approach: string;
  outcome: string;
  role: string[];
  stack: string[];
  palette: { name: string; hex: string }[];
  gallery: { variant: GalleryVariant; caption: string }[];
}

export const PROJECT_GROUPS: { value: 'all' | ProjectGroup; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'product', label: 'Product' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'brand', label: 'Brand' },
];

/** Fictional concept projects created to demonstrate the studio's range — not client work. */
export const PROJECTS: Project[] = [
  {
    id: 'perihelion',
    index: '01',
    name: 'Perihelion',
    tagline: 'Orbital intelligence, made legible.',
    group: 'product',
    category: 'Data platform',
    tags: ['WebGL', 'Data viz', 'Product UI'],
    year: '2026 · Concept',
    accent: '#38BDF8',
    summary:
      'A concept command surface for an orbital analytics platform: live constellations, telemetry and conjunction alerts distilled into one calm, cinematic interface.',
    challenge:
      'Satellite data is dense, technical and relentless. The concept needed to make thousands of moving objects feel understandable within seconds — without dumbing anything down.',
    approach:
      'A real-time globe anchors the experience while a HUD-inspired type system surfaces only what matters. Motion is used as information: orbits breathe, alerts pulse, idle states rest.',
    outcome:
      'A prototype direction that turns raw telemetry into a narrative, designed to explore how scientific tooling can feel as considered as a consumer product.',
    role: ['Product strategy', 'Interface design', 'WebGL prototyping'],
    stack: ['React', 'WebGL', 'TypeScript', 'Node'],
    palette: [
      { name: 'Deep orbit', hex: '#050B18' },
      { name: 'Signal', hex: '#38BDF8' },
      { name: 'Telemetry', hex: '#7DD3FC' },
      { name: 'Starlight', hex: '#F5F5F7' },
    ],
    gallery: [
      { variant: 'cover', caption: 'Mission overview — the live constellation view' },
      { variant: 'detail', caption: 'HUD detail — telemetry typography system' },
      { variant: 'mobile', caption: 'Field companion — mobile conjunction alerts' },
    ],
  },
  {
    id: 'aurele',
    index: '02',
    name: 'Aurèle',
    tagline: 'Haute parfumerie, poured into pixels.',
    group: 'commerce',
    category: 'Luxury e-commerce',
    tags: ['E-commerce', 'Art direction', 'Motion'],
    year: '2026 · Concept',
    accent: '#E8C48A',
    summary:
      'An editorial storefront concept for a fictional fragrance house — warm light, liquid glass and a checkout flow as unhurried as the products.',
    challenge:
      'Fragrance is invisible. The concept had to translate scent into light, material and rhythm while keeping product discovery and checkout effortless.',
    approach:
      'Each scent receives its own lighting recipe. Caustic gradients, serif typography and slow, liquid transitions build desire, while the purchase path stays two taps short.',
    outcome:
      'A direction for luxury commerce that feels like a boutique visit rather than a catalogue, exploring how restraint can coexist with conversion.',
    role: ['Art direction', 'E-commerce UX', 'Motion design'],
    stack: ['React', 'Headless commerce', 'CSS 3D', 'Edge rendering'],
    palette: [
      { name: 'Ember black', hex: '#0E0A07' },
      { name: 'Champagne', hex: '#E8C48A' },
      { name: 'Amber', hex: '#C2772E' },
      { name: 'Ivory', hex: '#FFF4E0' },
    ],
    gallery: [
      { variant: 'cover', caption: 'Hero composition — N°07 Eau de Lumière' },
      { variant: 'detail', caption: 'Material study — glass, liquid and light' },
      { variant: 'mobile', caption: 'Mobile boutique — product page' },
    ],
  },
  {
    id: 'kinetic',
    index: '03',
    name: 'Kinetic Form',
    tagline: 'An identity that refuses to stand still.',
    group: 'brand',
    category: 'Brand system',
    tags: ['Brand system', 'Kinetic type', 'Guidelines'],
    year: '2026 · Concept',
    accent: '#D7FF3F',
    summary:
      'A kinetic identity concept for a fictional sports-technology label — typography that accelerates, data that sprints and a system built for motion first.',
    challenge:
      'Sports brands shout. The concept needed a voice that felt fast and precise rather than loud, and that could scale from a watch face to a stadium screen.',
    approach:
      'A variable logotype stretches with velocity; an acid accent is reserved for moments of effort. Every component in the system has a defined motion behaviour.',
    outcome:
      'A motion-first brand toolkit concept — logo, type, data visualisation and guidelines — demonstrating how identity can be designed as behaviour.',
    role: ['Brand strategy', 'Identity design', 'Motion system'],
    stack: ['Variable fonts', 'Motion', 'Design tokens', 'Figma to code'],
    palette: [
      { name: 'Carbon', hex: '#0A0A0A' },
      { name: 'Acid', hex: '#D7FF3F' },
      { name: 'Chalk', hex: '#EDEDED' },
      { name: 'Slate', hex: '#3A3A3A' },
    ],
    gallery: [
      { variant: 'cover', caption: 'Identity in motion — the stretch logotype' },
      { variant: 'detail', caption: 'System detail — velocity typography' },
      { variant: 'mobile', caption: 'Training app — live session screen' },
    ],
  },
  {
    id: 'obsidia',
    index: '04',
    name: 'Obsidia',
    tagline: 'Private banking with a pulse.',
    group: 'product',
    category: 'Fintech product',
    tags: ['Full-stack', 'Fintech', 'Product design'],
    year: '2026 · Concept',
    accent: '#C084FC',
    summary:
      'A concept neobank experience: glass cards, living balance charts and a full-stack architecture designed around trust, speed and clarity.',
    challenge:
      'Money apps are either sterile or noisy. The concept explored how a financial product can feel premium and emotionally calm while staying radically transparent.',
    approach:
      'A dark-glass design language, real-time charts and micro-interactions that confirm every action. The architecture concept pairs edge rendering with a strictly typed API.',
    outcome:
      'An end-to-end product concept — interface, component library and API design — exploring what premium, trustworthy fintech can feel like.',
    role: ['Product design', 'Full-stack architecture', 'Design system'],
    stack: ['React', 'TypeScript', 'Node API', 'PostgreSQL'],
    palette: [
      { name: 'Obsidian', hex: '#0D0B14' },
      { name: 'Ultraviolet', hex: '#8B5CF6' },
      { name: 'Orchid', hex: '#E879F9' },
      { name: 'Mist', hex: '#E4E0F5' },
    ],
    gallery: [
      { variant: 'cover', caption: 'Wallet overview — the living balance' },
      { variant: 'detail', caption: 'Card detail — glass and light study' },
      { variant: 'mobile', caption: 'Mobile app — instant transfer flow' },
    ],
  },
];
