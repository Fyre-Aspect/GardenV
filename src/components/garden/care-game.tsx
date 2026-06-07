'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CARE_ICON } from '@/components/garden/icons';
import { CARE_META, MINIGAME_CARE, type CareType } from '@/lib/data';
import { cn } from '@/lib/utils';

/**
 * Skill mini-game shared by watering and feeding. Hold the button to fill —
 * the level rises. Release inside the green "just right" zone for max XP; stop
 * short for less; fill past the top and you've overdone it (no XP). XP is
 * reported back so the caller can award it. The `variant` (derived from the
 * care type) only changes the theme and copy; the mechanic is identical.
 */

const ZONE_MIN = 68;
const ZONE_MAX = 90;
const ZONE_MID = (ZONE_MIN + ZONE_MAX) / 2;
const OVERFLOW = 100;
const MAX_LEVEL = 116;
const FILL_RATE = 46; // % per second

export type CareVerdict = 'perfect' | 'much' | 'short' | 'overflow';

interface Result {
  xp: number;
  verdict: CareVerdict;
}

function evaluate(level: number): Result {
  if (level > OVERFLOW) return { xp: 0, verdict: 'overflow' };
  if (level >= ZONE_MIN && level <= ZONE_MAX) {
    const closeness = 1 - Math.abs(level - ZONE_MID) / ((ZONE_MAX - ZONE_MIN) / 2);
    return { xp: Math.round(12 + closeness * 8), verdict: 'perfect' };
  }
  if (level > ZONE_MAX) return { xp: 6, verdict: 'much' };
  return { xp: Math.max(0, Math.round((level / ZONE_MIN) * 10)), verdict: 'short' };
}

type Variant = 'water' | 'food';

const COPY: Record<
  Variant,
  {
    hold: string;
    fill: string; // tailwind gradient for the fill
    verdicts: Record<CareVerdict, { title: string; note: string; good: boolean }>;
  }
> = {
  water: {
    hold: 'Hold to pour',
    fill: 'from-sky-500/80 to-sky-400/70',
    verdicts: {
      perfect: { title: 'Perfectly watered!', note: 'Right in the sweet spot. Lovely pour.', good: true },
      much: { title: 'A touch much', note: 'Just over — ease off a hair next time.', good: true },
      short: { title: 'A little light', note: 'Not quite enough — give a bit more next time.', good: false },
      overflow: { title: 'Whoa — overwatered!', note: 'You drowned it. Go gently on the pour.', good: false },
    },
  },
  food: {
    hold: 'Hold to serve',
    fill: 'from-amber-500/80 to-amber-400/70',
    verdicts: {
      perfect: { title: 'Perfect portion!', note: 'Exactly the right amount. Well judged.', good: true },
      much: { title: 'A bit generous', note: 'Slightly too much — scale back next time.', good: true },
      short: { title: 'A small serving', note: 'A little light — a touch more next time.', good: false },
      overflow: { title: 'Too much food!', note: 'Don’t overfeed — that does more harm than good.', good: false },
    },
  },
};

interface CareGameProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companionName: string;
  careType: CareType;
  onResult: (xp: number, verdict: CareVerdict) => void;
}

export function CareGame({
  open,
  onOpenChange,
  companionName,
  careType,
  onResult,
}: CareGameProps) {
  const variant: Variant = MINIGAME_CARE[careType] === 'food' ? 'food' : 'water';
  const copy = COPY[variant];
  const Icon = CARE_ICON[careType];

  const [level, setLevel] = useState(0);
  const [done, setDone] = useState<Result | null>(null);

  const levelRef = useRef(0);
  const pouringRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const tsRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    levelRef.current = 0;
    pouringRef.current = false;
    tsRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setLevel(0);
    setDone(null);
  }, []);

  useEffect(() => {
    if (open) reset();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [open, reset]);

  const finish = useCallback(
    (lvl: number) => {
      pouringRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      const result = evaluate(lvl);
      setDone(result);
      onResult(result.xp, result.verdict);
    },
    [onResult]
  );

  const tick = useCallback(
    (t: number) => {
      if (!pouringRef.current) return;
      const last = tsRef.current ?? t;
      tsRef.current = t;
      let next = levelRef.current + (FILL_RATE * (t - last)) / 1000;
      if (next >= MAX_LEVEL) {
        next = MAX_LEVEL;
        levelRef.current = next;
        setLevel(next);
        finish(next);
        return;
      }
      levelRef.current = next;
      setLevel(next);
      rafRef.current = requestAnimationFrame(tick);
    },
    [finish]
  );

  const start = useCallback(() => {
    if (done || pouringRef.current) return;
    pouringRef.current = true;
    tsRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
  }, [done, tick]);

  const stop = useCallback(() => {
    if (!pouringRef.current) return;
    finish(levelRef.current);
  }, [finish]);

  const fillPct = Math.min(100, level);
  const overflowing = level > OVERFLOW;
  const verdict = done ? copy.verdicts[done.verdict] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {CARE_META[careType].verb} {companionName}
          </DialogTitle>
          <DialogDescription>
            {done
              ? 'Here’s how you did.'
              : `${copy.hold} — release when it reaches the green zone.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <div
            className={cn(
              'relative h-56 w-28 overflow-hidden rounded-b-3xl rounded-t-xl border-2 bg-secondary/40 transition-colors',
              overflowing ? 'border-destructive' : 'border-border'
            )}
          >
            <div
              className="absolute inset-x-0 border-y-2 border-dashed border-primary/70 bg-primary/15"
              style={{ top: `${100 - ZONE_MAX}%`, height: `${ZONE_MAX - ZONE_MIN}%` }}
            />
            <div
              className={cn(
                'absolute inset-x-0 bottom-0 bg-gradient-to-t',
                overflowing ? 'from-destructive/80 to-destructive/60' : copy.fill
              )}
              style={{ height: `${fillPct}%` }}
            />
            {overflowing && (
              <div className="absolute inset-x-0 top-1 text-center text-xs font-black text-destructive">
                TOO MUCH!
              </div>
            )}
          </div>
        </div>

        {!done ? (
          <Button
            size="lg"
            className="w-full select-none"
            onPointerDown={(e) => {
              e.preventDefault();
              start();
            }}
            onPointerUp={stop}
            onPointerLeave={stop}
            onPointerCancel={stop}
          >
            <Icon className="h-4 w-4" />
            {copy.hold}
          </Button>
        ) : (
          verdict && (
            <>
              <div
                className={cn(
                  'flex items-start gap-3 rounded-2xl border p-4',
                  verdict.good ? 'border-primary/30 bg-accent/50' : 'border-border bg-secondary/50'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    verdict.good
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-reward-soft text-reward-foreground'
                  )}
                >
                  {verdict.good ? (
                    <Sparkles className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-black text-foreground">{verdict.title}</div>
                  <div className="text-sm text-muted-foreground">{verdict.note}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-reward-soft px-2.5 py-0.5 text-xs font-black text-reward-foreground">
                    <Sparkles className="h-3 w-3" />
                    {done!.xp > 0 ? `+${done!.xp} XP` : 'No XP'}
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-1">
                <Button onClick={() => onOpenChange(false)}>Done</Button>
              </DialogFooter>
            </>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
