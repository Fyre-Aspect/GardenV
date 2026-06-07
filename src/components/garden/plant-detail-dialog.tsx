'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlantAvatar } from '@/components/garden/plant-avatar';
import { ProgressBar } from '@/components/garden/progress-bar';
import { CARE_ICON } from '@/components/garden/icons';
import { CareGame, type CareVerdict } from '@/components/garden/care-game';
import { useGarden } from '@/components/garden-provider';
import {
  CARE_ACTIONS_BY_KIND,
  CARE_META,
  careCooldownRemaining,
  formatCooldown,
  MINIGAME_CARE,
  STATUS_META,
  type CareType,
  type PlantVM,
} from '@/lib/data';
import { cn } from '@/lib/utils';

interface PlantDetailDialogProps {
  plant: PlantVM | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Notify the host so it can surface a toast. */
  onCare?: (message: string) => void;
}

function CareFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/50 p-3">
      <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-black capitalize text-foreground">{value}</div>
    </div>
  );
}

export function PlantDetailDialog({
  plant,
  open,
  onOpenChange,
  onCare,
}: PlantDetailDialogProps) {
  const { plants, logCare, removePlant } = useGarden();
  const [game, setGame] = useState<CareType | null>(null);

  if (!plant) return null;

  // Read the live companion so health/cooldowns refresh right after caring.
  const live = plants.find((p) => p.id === plant.id) ?? plant;
  const status = STATUS_META[live.status];
  const now = Date.now();
  const kind = live.kind ?? 'plant'; // default for any legacy record
  const actions = CARE_ACTIONS_BY_KIND[kind];
  const isPet = kind === 'pet';

  function doCare(type: CareType) {
    // Water and feeding are skill mini-games; anything else is an instant tap.
    if (MINIGAME_CARE[type]) {
      setGame(type);
      return;
    }
    logCare(live.id, type, CARE_META[type].xp);
    onCare?.(`${CARE_META[type].verb} ${live.name} · +${CARE_META[type].xp} XP`);
  }

  function onGameResult(xp: number, verdict: CareVerdict) {
    if (!game) return;
    logCare(live.id, game, xp);
    const verb = CARE_META[game].verb;
    const msg =
      verdict === 'overflow'
        ? `You overdid it on ${live.name} — go easy next time!`
        : `${verb} ${live.name}${xp > 0 ? ` · +${xp} XP` : ''}`;
    onCare?.(msg);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-4">
              <PlantAvatar name={live.name} kind={kind} className="h-14 w-14 text-lg" />
              <div className="min-w-0">
                <DialogTitle>{live.name}</DialogTitle>
                <DialogDescription className="italic">{live.species}</DialogDescription>
              </div>
              <Badge variant="level" className="ml-auto">
                Lv.{live.level}
              </Badge>
            </div>
          </DialogHeader>

          <div className="grid gap-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-bold text-foreground">Health</span>
                <span className="text-muted-foreground">{live.healthScore}/100</span>
              </div>
              <ProgressBar value={live.healthScore} className="bg-primary" />
              <span
                className={cn(
                  'mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold',
                  status.tone
                )}
              >
                {status.label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <CareFact label={isPet ? 'Water' : 'Water'} value={`${live.wateringIntervalDays}d`} />
              <CareFact label={isPet ? 'Feed' : 'Feed'} value={`${live.fertilizingIntervalDays}d`} />
              <CareFact label={isPet ? 'Type' : 'Light'} value={isPet ? 'Pet' : live.light} />
            </div>

            <div
              className={cn(
                'grid gap-2',
                actions.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
              )}
            >
              {actions.map((type) => {
                const Icon = CARE_ICON[type];
                const remaining = careCooldownRemaining(live, type, now);
                const locked = remaining > 0;
                return (
                  <Button
                    key={type}
                    variant="secondary"
                    disabled={locked}
                    onClick={() => doCare(type)}
                    title={locked ? `Recently done — ready in ${formatCooldown(remaining)}` : undefined}
                    className="flex-col gap-1 py-2 h-auto min-h-[3.5rem]"
                  >
                    <span className="flex items-center gap-1.5">
                      {locked ? <Lock className="h-3.5 w-3.5" /> : <Icon className="h-4 w-4" />}
                      {CARE_META[type].verb}
                    </span>
                    {locked && (
                      <span className="text-[10px] font-bold text-muted-foreground">
                        ready in {formatCooldown(remaining)}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {isPet ? 'Care for your pet' : 'Care for your plant'} — but don&apos;t overdo it.
              Each action rests for a while after you use it.
            </p>
            <div className="pt-4 border-t border-border flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  removePlant(live.id);
                  onOpenChange(false);
                }}
              >
                Remove {isPet ? 'Pet' : 'Plant'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CareGame
        open={game !== null}
        onOpenChange={(o) => !o && setGame(null)}
        companionName={live.name}
        careType={game ?? 'water'}
        onResult={onGameResult}
      />
    </>
  );
}
