import clsx from 'clsx';

interface ConfidenceMeterProps {
  confidence: number;          // 0 – 1
  prediction: 'REAL' | 'FAKE';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ConfidenceMeter({
  confidence,
  prediction,
  showLabel = true,
  size = 'md',
}: ConfidenceMeterProps) {
  const pct = Math.round(confidence * 100);
  const isReal = prediction === 'REAL';

  const barColor = isReal
    ? 'bg-gradient-to-r from-green-400 to-green-500'
    : 'bg-gradient-to-r from-orange-400 to-orange-500';

  const heights = { sm: 'h-2', md: 'h-3', lg: 'h-4' };
  const labelSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

  return (
    <div className="w-full space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={clsx('font-medium text-slate-600 dark:text-slate-400', labelSize[size])}>
            Confidence
          </span>
          <span
            className={clsx(
              'font-bold tabular-nums',
              labelSize[size],
              isReal ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
            )}
          >
            {pct}%
          </span>
        </div>
      )}

      {/* Track */}
      <div className={clsx('w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden', heights[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-700 ease-out', barColor)}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Confidence: ${pct}%`}
        />
      </div>

      {/* Tick marks */}
      {size !== 'sm' && (
        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-600 px-0.5">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
}
