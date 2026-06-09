'use client';

import { useMemo } from 'react';
import { Crown, PawPrint, Sprout } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGarden } from '@/components/garden-provider';
import { FAKE_PLANT_PLAYERS, type Kind } from '@/lib/data';
import { cn } from '@/lib/utils';

interface Row {
  id: string;
  name: string;
  owner: string;
  kind: Kind;
  level: number;
  isSelf: boolean;
}

/**
 * Weekly plant-level leaderboard (left rail). Ranks individual companions by
 * the level they've reached this week — yours compete against fixed rival
 * plants and can overtake them with consistent care. Levels reset every Monday.
 */
export function PlantLeaderboard({ className }: { className?: string }) {
  const { plants, displayName } = useGarden();

  const rows = useMemo<Row[]>(() => {
    const mine: Row[] = plants.map((p) => ({
      id: p.id,
      name: p.name,
      owner: displayName,
      kind: p.kind,
      level: p.level,
      isSelf: true,
    }));
    const rivals: Row[] = FAKE_PLANT_PLAYERS.map((p) => ({
      id: p.id,
      name: p.name,
      owner: p.owner,
      kind: p.kind,
      level: p.level,
      isSelf: false,
    }));
    return [...mine, ...rivals]
      .sort((a, b) => b.level - a.level || (a.isSelf ? -1 : 1))
      .slice(0, 5);
  }, [plants, displayName]);

  return (
    <Card className={cn('border-border p-4', className)}>
      <div className="mb-3 flex items-center gap-2">
        <Sprout className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-black tracking-tight text-foreground">Top plants this week</h2>
      </div>
      <ol className="space-y-1.5">
        {rows.map((r, i) => {
          const Icon = r.kind === 'pet' ? PawPrint : Sprout;
          return (
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
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-foreground">{r.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {r.isSelf ? 'you' : r.owner}
                </span>
              </span>
              <Badge variant="level" className="shrink-0">
                Lv.{r.level}
              </Badge>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
