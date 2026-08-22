import { Minus, Plus } from 'lucide-react';

export function QuantityStepper({ value, onChange, min = 1, max = 20, label = 'Số lượng' }) {
  const update = (next) => onChange(Math.max(min, Math.min(max, Number(next) || min)));
  return (
    <div
      className="inline-grid h-11 grid-cols-[2.75rem_3rem_2.75rem] border border-border bg-background"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => update(value - 1)}
        disabled={value <= min}
        className="grid place-items-center border-r border-border transition-colors hover:bg-secondary disabled:opacity-35"
        aria-label="Giảm số lượng"
      >
        <Minus className="size-3.5" />
      </button>
      <input
        value={value}
        onChange={(event) => update(event.target.value)}
        className="min-w-0 border-0 bg-transparent text-center text-sm outline-none"
        inputMode="numeric"
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => update(value + 1)}
        disabled={value >= max}
        className="grid place-items-center border-l border-border transition-colors hover:bg-secondary disabled:opacity-35"
        aria-label="Tăng số lượng"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
