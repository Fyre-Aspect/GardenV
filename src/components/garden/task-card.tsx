'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CARE_ICON } from '@/components/garden/icons';
import { CARE_META, type TaskVM } from '@/lib/data';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: TaskVM;
  onComplete: () => void;
}

/** A single care task row with a satisfying Done action. */
export function TaskCard({ task, onComplete }: TaskCardProps) {
  const Icon = CARE_ICON[task.type];
  const care = CARE_META[task.type];

  return (
    <motion.div
      layout
      className={cn(
        'flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors',
        task.done ? 'border-primary/20 opacity-60' : 'border-border shadow-sm'
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          task.done ? 'bg-accent text-accent-foreground' : 'bg-secondary text-foreground'
        )}
      >
        {task.done ? (
          <Check className="h-5 w-5" strokeWidth={2.5} />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-black text-foreground">
          {care.verb} {task.plantName}
        </div>
        <div className="text-sm text-muted-foreground">
          {task.done ? 'Completed' : `+${task.xp} XP on completion`}
        </div>
      </div>

      {task.done ? (
        <span className="shrink-0 text-sm font-bold text-primary">+{task.xp} XP</span>
      ) : (
        <Button size="sm" onClick={onComplete}>
          Done
        </Button>
      )}
    </motion.div>
  );
}
