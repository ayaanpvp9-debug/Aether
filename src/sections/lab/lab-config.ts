export type ThemeId = 'obsidian' | 'aurora' | 'ember' | 'mono' | 'bloom';
export type Density = 'compact' | 'comfortable' | 'spacious';
export type TransitionKind = 'wipe' | 'dissolve' | 'zoom' | 'lift';
export type Screen = 'overview' | 'launch';

export interface LabTheme {
  label: string;
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  line: string;
}

export const THEMES: Record<ThemeId, LabTheme> = {
  obsidian: { label: 'Obsidian', bg: '#0A0A10', surface: '#13141C', surface2: '#1A1B25', text: '#F5F5F7', muted: '#8E8E9C', accent: '#8B5CF6', accent2: '#38BDF8', line: '#272836' },
  aurora: { label: 'Aurora', bg: '#04110F', surface: '#0A1D1A', surface2: '#102824', text: '#ECFDF5', muted: '#86A89F', accent: '#2DD4BF', accent2: '#A3E635', line: '#1A3631' },
  ember: { label: 'Ember', bg: '#120A06', surface: '#1E120B', surface2: '#2A1A10', text: '#FFF7ED', muted: '#B29A88', accent: '#FB923C', accent2: '#F43F5E', line: '#3A2618' },
  mono: { label: 'Mono', bg: '#0B0B0C', surface: '#161618', surface2: '#1E1E21', text: '#FAFAFA', muted: '#9A9AA2', accent: '#F5F5F7', accent2: '#A1A1AA', line: '#2A2A2E' },
  bloom: { label: 'Bloom', bg: '#12061A', surface: '#1D0C28', surface2: '#281236', text: '#FDF4FF', muted: '#B497BD', accent: '#E879F9', accent2: '#F472B6', line: '#3A1C4A' },
};

export const THEME_ORDER: ThemeId[] = ['obsidian', 'aurora', 'ember', 'mono', 'bloom'];

export const DENSITY: Record<Density, { label: string; gap: number; pad: number; description: string }> = {
  compact: { label: 'Compact', gap: 8, pad: 12, description: '8 px gaps' },
  comfortable: { label: 'Comfortable', gap: 12, pad: 16, description: '12 px gaps' },
  spacious: { label: 'Spacious', gap: 18, pad: 22, description: '18 px gaps' },
};

export const TRANSITIONS: { value: TransitionKind; label: string; description: string }[] = [
  { value: 'wipe', label: 'Wipe', description: 'Clip-path reveal' },
  { value: 'dissolve', label: 'Dissolve', description: 'Blur crossfade' },
  { value: 'zoom', label: 'Zoom', description: 'Depth push' },
  { value: 'lift', label: 'Lift', description: 'Vertical rise' },
];

export interface ComponentSpec {
  name: string;
  role: string;
  tokens: Array<keyof LabTheme>;
  notes: string;
}

export const SPECS: Record<string, ComponentSpec> = {
  'app-bar': { name: 'AppBar', role: 'Navigation', tokens: ['surface', 'line', 'text'], notes: 'Translucent when glass is enabled.' },
  'nav-tabs': { name: 'NavTabs', role: 'Navigation', tokens: ['accent', 'muted'], notes: 'Shared-layout indicator, arrow-key ready.' },
  'metric-card': { name: 'MetricCard', role: 'Data display', tokens: ['surface', 'accent', 'muted'], notes: 'Sparkline draws on mount.' },
  'area-chart': { name: 'AreaChart', role: 'Data visualisation', tokens: ['accent', 'accent2', 'line'], notes: 'Bars grow with staggered springs.' },
  'activity-list': { name: 'ActivityList', role: 'Feed', tokens: ['surface2', 'text', 'muted'], notes: 'Items enter with a 40 ms stagger.' },
  'primary-button': { name: 'Button / Primary', role: 'Action', tokens: ['accent', 'bg'], notes: 'Idle, loading and success states.' },
  'launch-card': { name: 'LaunchCard', role: 'Status', tokens: ['surface', 'accent', 'accent2'], notes: 'Live countdown + readiness meter.' },
  'settings-list': { name: 'SettingsList', role: 'Form controls', tokens: ['surface2', 'accent', 'line'], notes: 'Each row is a real switch.' },
};

export const SCREEN_COMPONENTS: Record<Screen, string[]> = {
  overview: ['app-bar', 'nav-tabs', 'metric-card', 'area-chart', 'activity-list', 'primary-button'],
  launch: ['app-bar', 'launch-card', 'settings-list', 'primary-button'],
};
