'use client';

import { useRef, useState } from 'react';
import { Camera, ImagePlus, Lock } from 'lucide-react';
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
  dailyCareNeeds,
  formatCooldown,
  healthCheckDue,
  HEALTHY_LEVEL_MIN,
  MINIGAME_CARE,
  plantProgress,
  STATUS_META,
  type CareType,
  type PlantVM,
} from '@/lib/data';
import { downscaleDataUrl, fileToDataUrl } from '@/lib/image';
import { cn } from '@/lib/utils';

interface PlantDetailDialogProps {
  plant: PlantVM | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Notify the host so it can surface a toast. */
  onCare?: (message: string) => void;
  /** Asked when the user wants to take this week's photo health check. */
  onHealthCheck?: (plant: PlantVM) => void;
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
  onHealthCheck,
}: PlantDetailDialogProps) {
  const { plants, logCare, removePlant, setPlantPhoto } = useGarden();
  const [game, setGame] = useState<CareType | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!plant) return null;

  // Read the live companion so health/cooldowns refresh right after caring.
  const live = plants.find((p) => p.id === plant.id) ?? plant;
  const status = STATUS_META[live.status];
  const now = Date.now();
  const kind = live.kind ?? 'plant'; // default for any legacy record
  const actions = CARE_ACTIONS_BY_KIND[kind];
  const isPet = kind === 'pet';
  const checkDue = healthCheckDue(live);
  const needs = dailyCareNeeds(live, now);
  const lvl = plantProgress(live.weeklyXp ?? 0);
  const canLevel = live.healthScore >= HEALTHY_LEVEL_MIN;

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
        ? `You overdid it on ${live.name}, go easy next time!`
        : `${verb} ${live.name}${xp > 0 ? ` · +${xp} XP` : ''}`;
    onCare?.(msg);
  }

  async function onPhotoPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    try {
      const raw = await fileToDataUrl(file);
      const thumb = await downscaleDataUrl(raw, 400, 0.78);
      setPlantPhoto(live.id, thumb);
      onCare?.(`Photo added to ${live.name}`);
    } catch {
      onCare?.("That image couldn't be read. Try another.");
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-4">
              {live.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={live.photoUrl}
                  alt={live.name}
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <PlantAvatar name={live.name} kind={kind} className="h-14 w-14 text-lg" />
              )}
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
            {/* ── HEALTH (from photo check-ins only) ── */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-bold text-foreground">Health</span>
                <span className="text-muted-foreground">{live.healthScore}/100</span>
              </div>
              <ProgressBar value={live.healthScore} className="bg-primary" />
              {checkDue ? (
                <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-reward/40 bg-reward-soft/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-bold text-reward-foreground">
                    Weekly health check due, snap a photo to update health.
                  </span>
                  <Button
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onHealthCheck?.(live);
                    }}
                  >
                    <Camera className="h-4 w-4" />
                    Take photo
                  </Button>
                </div>
              ) : (
                <span
                  className={cn(
                    'mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold',
                    status.tone
                  )}
                >
                  {status.label} · checked this week
                </span>
              )}
            </div>

            {/* ── LEVEL (per-plant, resets weekly) ── */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-bold text-foreground">Level {lvl.level} this week</span>
                <span className="text-muted-foreground">
                  {lvl.xpIntoLevel}/{lvl.xpForNext} XP
                </span>
              </div>
              <ProgressBar value={(lvl.xpIntoLevel / lvl.xpForNext) * 100} className="bg-reward" />
              {!canLevel && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Below 90% health, care keeps your streak but won&apos;t level up until it recovers.
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <CareFact label="Water" value={`${live.wateringIntervalDays}d`} />
              <CareFact label="Feed" value={`${live.fertilizingIntervalDays}d`} />
              <CareFact label={isPet ? 'Type' : 'Light'} value={isPet ? 'Pet' : live.light} />
            </div>

            {/* ── TODAY'S CARE (exact amounts) ── */}
            <div className="rounded-2xl border border-border bg-secondary/40 p-3">
              <div className="mb-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                What {live.name} needs
              </div>
              <ul className="space-y-1.5">
                {needs.map((need) => {
                  const due = need.dueInDays <= 0;
                  return (
                    <li key={need.type} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-foreground">{CARE_META[need.type].verb}</span>
                      <span className={cn('text-right', due ? 'text-primary font-bold' : 'text-muted-foreground')}>
                        {due
                          ? `Today: ${need.amount}`
                          : `in ${need.dueInDays} ${need.dueInDays === 1 ? 'day' : 'days'}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
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
                    title={locked ? `Recently done, ready in ${formatCooldown(remaining)}` : undefined}
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
              Caring keeps your streak and levels up this plant while it&apos;s healthy
              (≥90%). Health only changes from the weekly photo check.
            </p>

            <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
              <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()}>
                <ImagePlus className="h-4 w-4" />
                {live.photoUrl ? 'Change photo' : 'Add photo'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  removePlant(live.id);
                  onOpenChange(false);
                }}
              >
                Remove {isPet ? 'pet' : 'plant'}
              </Button>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={onPhotoPicked}
            />
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
