import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { MousePointerClick, RotateCcw, ScanSearch, Wand2 } from 'lucide-react';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Segmented';
import { Select } from '../../components/ui/Select';
import { Slider } from '../../components/ui/Slider';
import { Switch } from '../../components/ui/Switch';
import { useToast } from '../../components/ui/toast-context';
import { cn } from '../../lib/cn';
import { EASE_IN_OUT, EASE_OUT } from '../../lib/motion';
import {
  DENSITY,
  SCREEN_COMPONENTS,
  SPECS,
  THEMES,
  THEME_ORDER,
  TRANSITIONS,
  type Density,
  type Screen,
  type ThemeId,
  type TransitionKind,
} from './lab-config';
import { LabScreen } from './LabPreview';
import './Lab.css';

interface Box {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: string;
  padding?: string;
  tag?: string;
}

const DEFAULTS = {
  theme: 'obsidian' as ThemeId,
  glass: true,
  glow: true,
  grid: false,
  motion: true,
  radius: 14,
  density: 'comfortable' as Density,
  transition: 'wipe' as TransitionKind,
};

const SCREEN_VARIANTS: Record<TransitionKind, Variants> = {
  wipe: {
    initial: { clipPath: 'inset(0% 100% 0% 0%)' },
    animate: { clipPath: 'inset(0% 0% 0% 0%)' },
    exit: { clipPath: 'inset(0% 0% 0% 100%)' },
  },
  dissolve: {
    initial: { opacity: 0, filter: 'blur(14px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(14px)' },
  },
  zoom: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.08 },
  },
  lift: {
    initial: { opacity: 0, y: 48 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -36 },
  },
};

export function LabSection() {
  const toast = useToast();
  const [theme, setTheme] = useState<ThemeId>(DEFAULTS.theme);
  const [glass, setGlass] = useState(DEFAULTS.glass);
  const [glow, setGlow] = useState(DEFAULTS.glow);
  const [grid, setGrid] = useState(DEFAULTS.grid);
  const [motionOn, setMotionOn] = useState(DEFAULTS.motion);
  const [radius, setRadius] = useState(DEFAULTS.radius);
  const [density, setDensity] = useState<Density>(DEFAULTS.density);
  const [transition, setTransition] = useState<TransitionKind>(DEFAULTS.transition);
  const [screen, setScreen] = useState<Screen>('overview');
  const [inspect, setInspect] = useState(false);
  const [hovered, setHovered] = useState<Box | null>(null);
  const [selected, setSelected] = useState<Box | null>(null);
  const [flash, setFlash] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const hoveredEl = useRef<Element | null>(null);

  const palette = THEMES[theme];
  const spacing = DENSITY[density];

  const measure = useCallback((el: Element, key: string): Box | null => {
    const viewport = viewportRef.current;
    if (!viewport) return null;
    const vr = viewport.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    // The preview is scaled down on small screens: convert on-screen pixels back to its own CSS pixels
    // (works whether the engine reports zoomed or unzoomed rects, and for transforms too).
    const ownWidth = parseFloat(getComputedStyle(viewport).width);
    const k = vr.width > 0 && ownWidth > 0 ? ownWidth / vr.width : 1;
    return {
      key,
      x: (r.left - vr.left) * k,
      y: (r.top - vr.top) * k,
      w: r.width * k,
      h: r.height * k,
      radius: style.borderTopLeftRadius,
      padding: `${parseFloat(style.paddingTop)} / ${parseFloat(style.paddingLeft)} px`,
      tag: el.tagName.toLowerCase(),
    };
  }, []);

  const selectKey = useCallback(
    (key: string) => {
      const el = viewportRef.current?.querySelector(`[data-inspect="${key}"]`);
      setSelected(el ? measure(el, key) : null);
    },
    [measure],
  );

  // Keep the selection box glued to its component as tokens, screens and sizes change.
  useEffect(() => {
    if (!selected) return;
    const key = selected.key;
    const remeasure = () => {
      if (!SCREEN_COMPONENTS[screen].includes(key)) {
        setSelected(null);
        return;
      }
      selectKey(key);
    };
    const frame = requestAnimationFrame(remeasure);
    const settle = window.setTimeout(remeasure, 700);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-measure only when layout inputs change
  }, [screen, radius, density, theme, glass, selectKey]);

  const onPointerMove = (event: React.PointerEvent) => {
    if (!inspect) return;
    const el = (event.target as Element).closest('[data-inspect]');
    if (el === hoveredEl.current) return;
    hoveredEl.current = el;
    setHovered(el ? measure(el, el.getAttribute('data-inspect') ?? '') : null);
  };

  const onClickCapture = (event: React.MouseEvent) => {
    if (!inspect) return;
    const el = (event.target as Element).closest('[data-inspect]');
    event.preventDefault();
    event.stopPropagation();
    if (el) setSelected(measure(el, el.getAttribute('data-inspect') ?? ''));
  };

  const changeTheme = (value: ThemeId) => {
    setTheme(value);
    setFlash((f) => f + 1);
  };

  const reset = () => {
    setTheme(DEFAULTS.theme);
    setGlass(DEFAULTS.glass);
    setGlow(DEFAULTS.glow);
    setGrid(DEFAULTS.grid);
    setMotionOn(DEFAULTS.motion);
    setRadius(DEFAULTS.radius);
    setDensity(DEFAULTS.density);
    setTransition(DEFAULTS.transition);
    setScreen('overview');
    setInspect(false);
    setSelected(null);
    setHovered(null);
    toast.push({ title: 'Lab reset', description: 'All tokens restored to the VELTRIX defaults.', tone: 'info' });
  };

  const deviceStyle = {
    '--lab-bg': palette.bg,
    '--lab-surface': palette.surface,
    '--lab-surface-2': palette.surface2,
    '--lab-text': palette.text,
    '--lab-muted': palette.muted,
    '--lab-accent': palette.accent,
    '--lab-accent-2': palette.accent2,
    '--lab-line': palette.line,
    '--lab-radius': `${radius}px`,
    '--lab-gap': `${spacing.gap}px`,
    '--lab-pad': `${spacing.pad}px`,
  } as React.CSSProperties;

  const spec = selected ? SPECS[selected.key] : null;
  const componentOptions = SCREEN_COMPONENTS[screen].map((key) => ({ value: key, label: SPECS[key]!.name, description: SPECS[key]!.role }));

  return (
    <section id="lab" className="vx-section vx-lab" aria-labelledby="lab-title">
      <div className="vx-container">
        <SectionHeader
          index="04"
          label="Interactive lab"
          titleId="lab-title"
          title={
            <>
              Touch the <span className="vx-serif">system</span>.
            </>
          }
        >
          Switch themes, bend design tokens, inspect components and trigger transitions. Every control rewires the live interface in real time.
        </SectionHeader>

        <motion.div
          className="vx-lab__frame"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 1, ease: EASE_OUT }}
        >
          <div className="vx-lab__stage">
            <div
              className={cn('vx-lab__device', !motionOn && 'is-still')}
              style={deviceStyle}
              data-glass={glass}
              data-glow={glow}
              data-grid={grid}
              data-inspect-mode={inspect}
            >
              <div className="vx-lab__chrome" aria-hidden="true">
                <span />
                <span />
                <span />
                <span className="vx-lab__url">lab.veltrix.app/{screen}</span>
                <span className="vx-lab__theme-name">{palette.label}</span>
              </div>
              <div
                ref={viewportRef}
                className="vx-lab__viewport"
                onPointerMove={onPointerMove}
                onPointerLeave={() => {
                  hoveredEl.current = null;
                  setHovered(null);
                }}
                onClickCapture={onClickCapture}
                data-cursor-label={inspect ? 'Inspect' : undefined}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={screen}
                    className="vx-lab__screen"
                    variants={SCREEN_VARIANTS[transition]}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: motionOn ? 0.6 : 0, ease: EASE_IN_OUT }}
                  >
                    <LabScreen screen={screen} />
                  </motion.div>
                </AnimatePresence>

                {flash > 0 && motionOn && (
                  <motion.span
                    key={flash}
                    className="vx-lab__flash"
                    initial={{ opacity: 0.5, scale: 0 }}
                    animate={{ opacity: 0, scale: 2.6 }}
                    transition={{ duration: 0.9, ease: EASE_OUT }}
                    aria-hidden="true"
                  />
                )}

                {inspect && hovered && hovered.key !== selected?.key && (
                  <motion.span
                    className="vx-lab__outline"
                    initial={false}
                    animate={{ x: hovered.x, y: hovered.y, width: hovered.w, height: hovered.h }}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    aria-hidden="true"
                  >
                    <span className="vx-lab__outline-label">
                      {SPECS[hovered.key]?.name} · {Math.round(hovered.w)}×{Math.round(hovered.h)}
                    </span>
                  </motion.span>
                )}
                {inspect && selected && (
                  <motion.span
                    className="vx-lab__outline vx-lab__outline--selected"
                    initial={false}
                    animate={{ x: selected.x, y: selected.y, width: selected.w, height: selected.h }}
                    transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                    aria-hidden="true"
                  >
                    <span className="vx-lab__outline-label">{SPECS[selected.key]?.name}</span>
                  </motion.span>
                )}
              </div>
            </div>
          </div>

          <div className="vx-lab__panel" role="group" aria-label="Lab controls">
            <div className="vx-lab__group">
              <h3 className="vx-lab__heading">
                <span>01</span> Theme
              </h3>
              <Segmented
                kind="radio"
                size="sm"
                className="vx-lab__themes"
                options={THEME_ORDER.map((id) => ({ value: id, label: THEMES[id].label, swatch: THEMES[id].accent }))}
                value={theme}
                onChange={changeTheme}
                layoutId="lab-theme"
                label="Interface theme"
              />
            </div>

            <div className="vx-lab__group">
              <h3 className="vx-lab__heading">
                <span>02</span> Surfaces
              </h3>
              <Switch label="Glass surfaces" description="Translucency + backdrop blur" checked={glass} onChange={setGlass} />
              <Switch label="Ambient glow" description="Accent-tinted light field" checked={glow} onChange={setGlow} />
              <Switch label="Layout grid" description="12-column overlay" checked={grid} onChange={setGrid} />
              <Switch label="Motion" description="Micro-animations & transitions" checked={motionOn} onChange={setMotionOn} />
            </div>

            <div className="vx-lab__group">
              <h3 className="vx-lab__heading">
                <span>03</span> Tokens
              </h3>
              <Slider label="Corner radius" min={0} max={28} value={radius} unit=" px" onChange={setRadius} />
              <Select
                compact
                label="Density"
                options={(Object.keys(DENSITY) as Density[]).map((key) => ({ value: key, label: DENSITY[key].label, description: DENSITY[key].description }))}
                value={density}
                onChange={setDensity}
              />
            </div>

            <div className="vx-lab__group">
              <h3 className="vx-lab__heading">
                <span>04</span> Transition
              </h3>
              <Select compact label="Style" options={TRANSITIONS} value={transition} onChange={setTransition} />
              <Button
                size="sm"
                icon={<Wand2 size={15} />}
                onClick={() => setScreen((s) => (s === 'overview' ? 'launch' : 'overview'))}
                magnetic={false}
              >
                {screen === 'overview' ? 'Trigger transition' : 'Transition back'}
              </Button>
            </div>

            <div className="vx-lab__group">
              <h3 className="vx-lab__heading">
                <span>05</span> Inspect
              </h3>
              <Switch
                label="Inspect mode"
                description="Hover or tap a component in the preview"
                checked={inspect}
                onChange={(on) => {
                  setInspect(on);
                  if (!on) {
                    setSelected(null);
                    setHovered(null);
                  }
                }}
              />
              <AnimatePresence initial={false}>
                {inspect && (
                  <motion.div
                    className="vx-lab__inspect"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE_OUT }}
                  >
                    <Select
                      compact
                      label="Component"
                      placeholder="Choose a component…"
                      options={componentOptions}
                      value={selected?.key ?? ''}
                      onChange={selectKey}
                    />
                    {spec && selected ? (
                      <div className="vx-inspector" aria-live="polite">
                        <div className="vx-inspector__head">
                          <strong>{spec.name}</strong>
                          <span className="vx-tag">{spec.role}</span>
                        </div>
                        <dl className="vx-inspector__props">
                          <div>
                            <dt>Size</dt>
                            <dd>
                              {Math.round(selected.w)} × {Math.round(selected.h)} px
                            </dd>
                          </div>
                          <div>
                            <dt>Radius</dt>
                            <dd>{selected.radius}</dd>
                          </div>
                          <div>
                            <dt>Padding</dt>
                            <dd>{selected.padding}</dd>
                          </div>
                          <div>
                            <dt>Element</dt>
                            <dd>&lt;{selected.tag}&gt;</dd>
                          </div>
                        </dl>
                        <ul className="vx-inspector__tokens">
                          {spec.tokens.map((token) => (
                            <li key={token}>
                              <span className="vx-inspector__chip" style={{ background: palette[token] }} />
                              <span>{token}</span>
                              <code>{palette[token]}</code>
                            </li>
                          ))}
                        </ul>
                        <p className="vx-inspector__note">{spec.notes}</p>
                      </div>
                    ) : (
                      <p className="vx-lab__hint">
                        <MousePointerClick size={14} aria-hidden="true" /> Click a component in the preview, or pick one above.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button type="button" className="vx-lab__reset" onClick={reset} data-cursor="link">
              <RotateCcw size={14} aria-hidden="true" /> Reset lab
            </button>
            <p className="vx-lab__foot">
              <ScanSearch size={13} aria-hidden="true" /> Everything here runs client-side — no data leaves your browser.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
