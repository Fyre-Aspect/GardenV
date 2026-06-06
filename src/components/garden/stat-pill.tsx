import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatPillProps {
  icon: LucideIcon;
  value: string;
  label?: string;
  className?: string;
}

/** Compact icon + value chip (hero stats, header counters). */
export function StatPill({ icon: Icon, value, label, className }: StatPillProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-sm',
        className
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="text-left leading-none">
        <div className="text-sm font-black text-foreground">{value}</div>
        {label && <div className="mt-1 text-xs text-muted-foreground">{label}</div>}
      </div>
    </div>
  );
}
