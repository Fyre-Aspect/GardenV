'use client';

import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Crown, Trophy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProgressBar } from '@/components/garden/progress-bar';
import { useAuth } from '@/components/auth-provider';
import { useGarden } from '@/components/garden-provider';
import { db } from '@/lib/firebase';
import { LEAGUES, leagueForXp, nextLeague, weekKey } from '@/lib/data';
import { cn } from '@/lib/utils';

interface Entry {
  id: string;
  name: string;
  weeklyXp: number;
}

interface LeaderboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaderboardDialog({ open, onOpenChange }: LeaderboardDialogProps) {
  const { user } = useAuth();
  const { league, weeklyXp, displayName } = useGarden();
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (!open) return;
    const q = query(collection(db, 'leaderboard'), orderBy('weeklyXp', 'desc'), limit(50));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const thisWeek = weekKey();
        const rows = snap.docs
          .map((d) => {
            const data = d.data() as { name?: string; weeklyXp?: number; week?: string };
            return {
              id: d.id,
              name: data.name ?? 'Gardener',
              weeklyXp: typeof data.weeklyXp === 'number' ? data.weeklyXp : 0,
              week: data.week,
            };
          })
          // Only this week's standings count.
          .filter((r) => r.week === thisWeek);
        setEntries(rows.map(({ id, name, weeklyXp }) => ({ id, name, weeklyXp })));
      },
      (err) => console.error('[leaderboard] listen failed', err)
    );
    return unsub;
  }, [open]);

  // Make sure the current player always appears, even before their first sync.
  const hasSelf = entries.some((e) => e.id === user?.uid);
  const merged = hasSelf
    ? entries
    : [...entries, { id: user?.uid ?? 'me', name: displayName, weeklyXp }].sort(
        (a, b) => b.weeklyXp - a.weeklyXp
      );

  const up = nextLeague(league);
  const span = up ? up.min - league.min : Math.max(1, league.min);
  const into = Math.min(span, Math.max(0, weeklyXp - league.min));
  const toNext = up ? Math.max(0, up.min - weeklyXp) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {league.name} League
          </DialogTitle>
          <DialogDescription>
            Earn XP this week to climb. Standings reset every Monday.
          </DialogDescription>
        </DialogHeader>

        {/* League tier strip */}
        <div className="flex items-center justify-between gap-1">
          {LEAGUES.map((l) => (
            <div
              key={l.key}
              title={l.name}
              className={cn(
                'h-1.5 flex-1 rounded-full',
                l.min <= weeklyXp ? 'bg-primary' : 'bg-secondary'
              )}
            />
          ))}
        </div>

        {/* Progress to next league */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className={cn('rounded-full px-2.5 py-0.5 font-black', league.badge)}>
              {league.name}
            </span>
            <span className="text-muted-foreground">
              {up ? `${toNext} XP to ${up.name}` : 'Top league!'}
            </span>
          </div>
          <ProgressBar value={(into / span) * 100} className="bg-primary" />
        </div>

        {/* Standings */}
        <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {merged.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No XP earned yet this week. Be the first, go care for something!
            </p>
          )}
          {merged.map((e, i) => {
            const isSelf = e.id === user?.uid || (!hasSelf && e.id === (user?.uid ?? 'me'));
            const rankLeague = leagueForXp(e.weeklyXp);
            return (
              <div
                key={e.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-2.5',
                  isSelf ? 'border-primary/40 bg-accent/50' : 'border-border bg-card'
                )}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center text-sm font-black text-muted-foreground">
                  {i === 0 ? (
                    <Crown className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-foreground">
                    {e.name}
                    {isSelf && <span className="text-muted-foreground"> (you)</span>}
                  </div>
                  <div className={cn('text-xs font-bold', rankLeague.text)}>{rankLeague.name}</div>
                </div>
                <div className="shrink-0 text-sm font-black text-foreground">
                  {e.weeklyXp} XP
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
