import { useState } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Shuffle } from 'lucide-react';
import { useToast } from '../../../components/ui/toast-context';
import { copyText } from '../../../lib/clipboard';

interface Swatch {
  name: string;
  hex: string;
}

const DEFAULT_PALETTE: Swatch[] = [
  { name: 'Ultraviolet', hex: '#8B5CF6' },
  { name: 'Laser', hex: '#38BDF8' },
  { name: 'Orchid', hex: '#E879F9' },
  { name: 'Graphite', hex: '#101116' },
  { name: 'Paper', hex: '#F5F5F7' },
];

const HUE_NAMES: Array<[number, string]> = [
  [15, 'Ember'],
  [45, 'Saffron'],
  [70, 'Citron'],
  [150, 'Jade'],
  [190, 'Lagoon'],
  [225, 'Cobalt'],
  [265, 'Indigo'],
  [300, 'Orchid'],
  [335, 'Magenta'],
  [360, 'Ember'],
];

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

const hueName = (h: number) => HUE_NAMES.find(([limit]) => ((h % 360) + 360) % 360 <= limit)?.[1] ?? 'Signal';

function generatePalette(): Swatch[] {
  const base = Math.floor(Math.random() * 360);
  const accent = (base + 35 + Math.floor(Math.random() * 30)) % 360;
  const highlight = (base + 300 + Math.floor(Math.random() * 40)) % 360;
  return [
    { name: hueName(base), hex: hslToHex(base, 82, 64) },
    { name: hueName(accent), hex: hslToHex(accent, 88, 60) },
    { name: hueName(highlight), hex: hslToHex(highlight, 78, 72) },
    { name: 'Ink', hex: hslToHex(base, 18, 8) },
    { name: 'Paper', hex: hslToHex(base, 22, 96) },
  ];
}

/** Variable-type specimen with a palette generator and click-to-copy swatches. */
export function BrandSpecimen() {
  const toast = useToast();
  const [palette, setPalette] = useState<Swatch[]>(DEFAULT_PALETTE);
  const isDefault = palette === DEFAULT_PALETTE;

  const copy = async (swatch: Swatch) => {
    const ok = await copyText(swatch.hex);
    toast.push(ok ? { title: `${swatch.hex} copied`, description: `${swatch.name} is on your clipboard.`, tone: 'success' } : { title: 'Copy failed', description: 'Clipboard access was blocked.', tone: 'error' });
  };

  return (
    <div className="vx-brand" style={{ '--c1': palette[0]!.hex, '--c2': palette[1]!.hex, '--c3': palette[2]!.hex } as React.CSSProperties}>
      <div className="vx-brand__specimen">
        <span className="vx-brand__aa" aria-hidden="true">
          Aa
        </span>
        <div className="vx-brand__meta">
          <span>Unbounded</span>
          <span>wght 200 — 900</span>
          <span className="vx-demo-hint">Hover to change weight</span>
        </div>
      </div>
      <ul className="vx-brand__swatches" aria-label="Palette — click a colour to copy its hex code">
        {palette.map((swatch, i) => (
          <motion.li key={`${swatch.hex}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <button type="button" className="vx-brand__swatch" style={{ background: swatch.hex }} onClick={() => copy(swatch)} aria-label={`Copy ${swatch.name} ${swatch.hex}`} data-cursor-label="Copy">
              <span className="vx-brand__hex">{swatch.hex}</span>
            </button>
          </motion.li>
        ))}
      </ul>
      <div className="vx-brand__actions">
        <button type="button" className="vx-demo-btn" onClick={() => setPalette(generatePalette())} data-cursor="link">
          <Shuffle size={15} aria-hidden="true" /> Generate palette
        </button>
        {!isDefault && (
          <button type="button" className="vx-demo-btn vx-demo-btn--ghost" onClick={() => setPalette(DEFAULT_PALETTE)} data-cursor="link">
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        )}
      </div>
    </div>
  );
}
