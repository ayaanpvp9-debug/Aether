import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, LoaderCircle } from 'lucide-react';
import { useNow } from '../../hooks/useClock';
import { cn } from '../../lib/cn';
import type { Screen } from './lab-config';

const KPIS = [
  { label: 'Active users', value: '18.4k', delta: '+12%', points: '0,22 10,18 20,20 30,12 40,14 50,6 60,8' },
  { label: 'Conversion', value: '3.9%', delta: '+0.6', points: '0,20 10,21 20,15 30,16 40,10 50,11 60,4' },
  { label: 'Avg. session', value: '4m 12s', delta: '+18%', points: '0,18 10,14 20,16 30,10 40,12 50,7 60,9' },
];
const BARS = [38, 52, 44, 68, 58, 80, 72, 92, 76, 88, 70, 96];
const ACTIVITY = [
  { who: 'MK', text: 'Published “Spring launch”', time: '2m' },
  { who: 'JS', text: 'Merged checkout redesign', time: '18m' },
  { who: 'AL', text: 'Invited 3 teammates', time: '1h' },
];

type ActionState = 'idle' | 'loading' | 'done';

/** Button with a real idle → loading → done state machine. */
function ActionButton({ label, doneLabel }: { label: string; doneLabel: string }) {
  const [state, setState] = useState<ActionState>('idle');
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const run = () => {
    if (state !== 'idle') return;
    setState('loading');
    timers.current.push(
      window.setTimeout(() => setState('done'), 900),
      window.setTimeout(() => setState('idle'), 2600),
    );
  };

  return (
    <button type="button" className={cn('lab-btn lab-btn--primary', `is-${state}`)} data-inspect="primary-button" onClick={run} aria-live="polite">
      {state === 'loading' && <LoaderCircle size={14} className="vx-btn__spinner" aria-hidden="true" />}
      {state === 'done' && <Check size={14} aria-hidden="true" />}
      {state === 'idle' ? label : state === 'loading' ? 'Working…' : doneLabel}
    </button>
  );
}

function MiniSwitch({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="lab-setting">
      <span>{label}</span>
      <button type="button" role="switch" aria-checked={on} aria-label={label} className={cn('lab-switch', on && 'is-on')} onClick={() => setOn(!on)}>
        <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 34 }} />
      </button>
    </div>
  );
}

function AppBar({ tab, onTab }: { tab: string; onTab?: (tab: string) => void }) {
  const tabs = ['Overview', 'Reports', 'Team'];
  return (
    <header className="lab-bar" data-inspect="app-bar">
      <span className="lab-logo">
        <i /> pulse
      </span>
      <nav className="lab-tabs" data-inspect="nav-tabs" aria-label="Preview navigation">
        {tabs.map((t) => (
          <button key={t} type="button" className={cn('lab-tab', tab === t && 'is-active')} onClick={() => onTab?.(t)} aria-pressed={tab === t}>
            {tab === t && <motion.span layoutId="lab-tab" className="lab-tab__pill" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
            <span>{t}</span>
          </button>
        ))}
      </nav>
      <span className="lab-avatar" aria-hidden="true">
        VX
      </span>
    </header>
  );
}

export function OverviewScreen() {
  const [tab, setTab] = useState('Overview');
  return (
    <div className="lab-app">
      <AppBar tab={tab} onTab={setTab} />
      <div className="lab-kpis">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="lab-card lab-kpi" data-inspect="metric-card">
            <span className="lab-kpi__label">{kpi.label}</span>
            <span className="lab-kpi__value">{kpi.value}</span>
            <span className="lab-kpi__delta">{kpi.delta}</span>
            <svg viewBox="0 0 60 26" className="lab-kpi__spark" aria-hidden="true">
              <polyline points={kpi.points} pathLength={1} />
            </svg>
          </div>
        ))}
      </div>
      <div className="lab-row">
        <div className="lab-card lab-chart" data-inspect="area-chart">
          <div className="lab-card__head">
            <span>Sessions · {tab}</span>
            <span className="lab-muted">12 weeks</span>
          </div>
          <div className="lab-bars" aria-hidden="true">
            {BARS.map((h, i) => (
              <span key={i} style={{ '--h': `${h}%`, '--i': i } as React.CSSProperties} />
            ))}
          </div>
        </div>
        <div className="lab-card lab-activity" data-inspect="activity-list">
          <div className="lab-card__head">
            <span>Activity</span>
          </div>
          <ul>
            {ACTIVITY.map((item, i) => (
              <li key={item.text} style={{ '--i': i } as React.CSSProperties}>
                <span className="lab-avatar lab-avatar--sm">{item.who}</span>
                <span className="lab-activity__text">{item.text}</span>
                <span className="lab-muted">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="lab-actions">
        <ActionButton label="Create report" doneLabel="Report queued" />
      </div>
    </div>
  );
}

export function LaunchScreen() {
  const now = useNow();
  // Counts down to the next full hour — a live value, not a fake number.
  const remaining = 3600 - (Math.floor(now / 1000) % 3600);
  const hh = String(Math.floor(remaining / 3600)).padStart(2, '0');
  const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const progress = 1 - remaining / 3600;

  return (
    <div className="lab-app">
      <AppBar tab="Overview" />
      <div className="lab-card lab-launch" data-inspect="launch-card">
        <div className="lab-launch__ring" aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" className="lab-launch__track" />
            <circle cx="50" cy="50" r="42" className="lab-launch__value" pathLength={1} style={{ strokeDashoffset: 1 - progress }} />
          </svg>
          <span>
            T−{hh}:{mm}:{ss}
          </span>
        </div>
        <div className="lab-launch__info">
          <span className="lab-muted">Launch window</span>
          <strong>Next release train</strong>
          <div className="lab-meter" aria-hidden="true">
            <span style={{ width: '86%' }} />
          </div>
          <span className="lab-muted">Readiness 86%</span>
        </div>
      </div>
      <div className="lab-card lab-settings" data-inspect="settings-list">
        <MiniSwitch label="Notify team" defaultOn />
        <MiniSwitch label="Auto-deploy on green" defaultOn={false} />
        <MiniSwitch label="Public status page" defaultOn />
      </div>
      <div className="lab-actions">
        <ActionButton label="Go live" doneLabel="Live (demo)" />
      </div>
    </div>
  );
}

export function LabScreen({ screen }: { screen: Screen }) {
  return screen === 'overview' ? <OverviewScreen /> : <LaunchScreen />;
}
