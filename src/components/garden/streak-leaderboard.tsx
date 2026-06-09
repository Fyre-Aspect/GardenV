'use client';

import { useMemo } from 'react';
import { Crown, Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useGarden } from '@/components/garden-provider';
import { FAKE_STREAK_PLAYERS } from '@/lib/data';
import { cn } from '@/lib/utils';

interface Row {
  id: string;
  name: string;
  streak: number;
  isSelf: boolean;
}

/**
 * Streak leaderboard (right rail). Ranks people by their daily streak only.
 * Seeded with fixed rival players so a new gardener starts near the bottom and
 * can climb past them by keeping the streak alive. Updates live as your streak
 * changes.
 */
export function StreakLeaderboard({ className }: { className?: string }) {
  const { streak, displayName } = useGarden();

  const rows = useMemo<Row[]>(() => {
    const all: Row[] = [
      ...FAKE_STREAK_PLAYERS.map((p) => ({ ...p, isSelf: false })),
      { id: 'self', name: displayName, streak, isSelf: true },
    ];
    all.sort((a, b) => b.streak - a.streak || (a.isSelf ? 1 : -1));
    return all.slice(0, 5);
  }, [streak, displayName]);

  return (
    <Card className={cn('border-border p-4', className)}>
      <div className="mb-3 flex items-center gap-2">
        <Flame className="h-4 w-4 text-reward" />
        <h2 className="text-sm font-black tracking-tight text-foreground">Streak leaders</h2>
      </div>
      <ol className="space-y-1.5">
        {rows.map((r, i) => (
          <li
            key={r.id}
            className={cn(
              'flex items-center gap-2.5 rounded-xl border p-2',
              r.isSelf ? 'border-primary/40 bg-accent/50' : 'border-transparent bg-secondary/40'
            )}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-xs font-black text-muted-foreground">
              {i === 0 ? <Crown className="h-4 w-4 text-yellow-500" /> : i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">
              {r.name}
              {r.isSelf && <span className="font-medium text-muted-foreground"> (you)</span>}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-black text-foreground">
              {r.streak}
              <Flame className="h-3.5 w-3.5 text-reward" />
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
