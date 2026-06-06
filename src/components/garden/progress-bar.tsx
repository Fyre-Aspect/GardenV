'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  /** 0–100. */
  value: number;
  className?: string;
  trackClassName?: string;
}

/** Animated XP/progress fill. Animation is skipped under reduced-motion. */
export function ProgressBar({ value, className, trackClassName }: ProgressBarProps) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(value, 100));
  return (
    <div
      className={cn('h-2 overflow-hidden rounded-full bg-secondary', trackClassName)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={cn('h-full rounded-full bg-reward', className)}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={reduce ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
