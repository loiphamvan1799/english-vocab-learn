type ProgressBarProps = {
  value: number;
  label: string;
  max?: number;
};

export function ProgressBar({ value, label, max = 100 }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percentage = (clamped / max) * 100;

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200" aria-label={label}>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={clamped}
          className="h-full rounded-full bg-blue-600 transition-all duration-200"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
