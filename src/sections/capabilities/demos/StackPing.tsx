import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import { Activity, LoaderCircle } from 'lucide-react';
import { cn } from '../../../lib/cn';

type Status = 'idle' | 'pending' | 'ok' | 'error';

interface LogLine {
  id: number;
  text: string;
  tone: 'ok' | 'error' | 'muted';
}

const NODES = [
  { label: 'Browser', detail: 'React 19 · Motion' },
  { label: 'Static edge', detail: 'Brotli · immutable assets' },
  { label: 'Node API', detail: 'Validation · rate limits' },
  { label: 'Database', detail: 'SQLite · prepared statements' },
];

let lineId = 0;

/** Live round-trip to this site's own API — real latency, real storage engine, honest failure states. */
export function StackPing() {
  const [status, setStatus] = useState<Status>('idle');
  const [log, setLog] = useState<LogLine[]>([{ id: 0, text: '$ awaiting first request…', tone: 'muted' }]);
  const [burst, setBurst] = useState(0);
  const [response, setResponse] = useState<string | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  const push = (text: string, tone: LogLine['tone']) => setLog((lines) => [...lines.slice(-2), { id: ++lineId, text, tone }]);

  const ping = useCallback(async () => {
    setStatus('pending');
    setBurst((b) => b + 1);
    const started = performance.now();
    try {
      const res = await fetch('/api/health', { cache: 'no-store', headers: { Accept: 'application/json' } });
      const ms = Math.round(performance.now() - started);
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok || !type.includes('application/json')) throw new Error(res.ok ? 'no API on this host' : `HTTP ${res.status}`);
      const body = (await res.json()) as { storage?: string };
      setStatus('ok');
      setResponse(JSON.stringify(body, null, 2));
      setHistory((list) => [...list.slice(-15), ms]);
      push(`GET /api/health · 200 OK · ${ms} ms · ${body.storage ?? 'storage'}`, 'ok');
    } catch (error) {
      setStatus('error');
      setResponse(null);
      push(`GET /api/health · unreachable (${(error as Error).message}) — static deployment?`, 'error');
    }
  }, []);

  useEffect(() => {
    if (!inView) return;
    const frame = requestAnimationFrame(() => void ping());
    return () => cancelAnimationFrame(frame);
  }, [inView, ping]);

  return (
    <div ref={ref} className={cn('vx-stack', `is-${status}`)}>
      <ol className="vx-stack__nodes" key={burst}>
        {NODES.map((node, i) => (
          <li key={node.label} className="vx-stack__node" style={{ '--i': i } as React.CSSProperties}>
            <span className="vx-stack__dot" aria-hidden="true" />
            <span className="vx-stack__label">{node.label}</span>
            <span className="vx-stack__detail">{node.detail}</span>
          </li>
        ))}
      </ol>
      <div className="vx-stack__terminal" role="log" aria-live="polite" aria-label="API request log">
        <AnimatePresence initial={false}>
          {log.map((line) => (
            <motion.p
              key={line.id}
              className={`vx-stack__line vx-stack__line--${line.tone}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
            >
              {line.text}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
      <div className="vx-stack__response">
        <div className="vx-stack__response-head">
          <span>Live response</span>
          <span>
            {history.length > 0
              ? `${history.length} ping${history.length === 1 ? '' : 's'} · avg ${Math.round(history.reduce((a, b) => a + b, 0) / history.length)} ms`
              : 'no data yet'}
          </span>
        </div>
        <pre>{response ?? (status === 'error' ? '// no JSON — the API is not reachable here' : '// waiting for the first round-trip…')}</pre>
        <div className="vx-stack__history" aria-hidden="true">
          {history.map((ms, i) => (
            <i key={i} style={{ height: `${Math.min(100, 10 + (ms / Math.max(...history)) * 90)}%` }} />
          ))}
        </div>
      </div>
      <button type="button" className="vx-demo-btn" onClick={() => void ping()} disabled={status === 'pending'} data-cursor="link">
        {status === 'pending' ? <LoaderCircle size={15} className="vx-btn__spinner" aria-hidden="true" /> : <Activity size={15} aria-hidden="true" />}
        {status === 'pending' ? 'Pinging…' : 'Ping live API'}
      </button>
    </div>
  );
}
