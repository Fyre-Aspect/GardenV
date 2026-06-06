import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface StreakDotsProps {
  /** How many of the 7 weekday dots are filled (clamped to 0–7). */
  filled: number;
  className?: string;
}

/** Week-at-a-glance streak row. Filled = days completed this week. */
export function StreakDots({ filled, className }: StreakDotsProps) {
  const count = Math.max(0, Math.min(filled, 7));
  return (
    <div className={cn('flex gap-1.5', className)}>
      {DAYS.map((day, i) => {
        const on = i < count;
        return (
          <div key={`day-${i}`} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                on ? 'bg-reward text-white' : 'bg-secondary text-muted-foreground/50'
              )}
            >
              {on ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
            </div>
            <span className="text-xs text-muted-foreground">{day}</span>
          </div>
        );
      })}
    </div>
  );
}
