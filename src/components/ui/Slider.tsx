import { useId } from 'react';
import './Slider.css';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

/** Native range input (fully keyboard accessible) with a styled track and live value read-out. */
export function Slider({ label, value, min, max, step = 1, unit = '', onChange }: SliderProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="vx-slider">
      <div className="vx-slider__top">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>
          {value}
          {unit}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ '--pct': `${pct}%` } as React.CSSProperties}
        data-cursor="link"
      />
    </div>
  );
}
