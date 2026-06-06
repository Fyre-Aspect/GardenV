'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Loader2, ScanLine } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlantAvatar } from '@/components/garden/plant-avatar';
import { useGarden } from '@/components/garden-provider';
import { type PlantStatus } from '@/lib/data';
import { cn } from '@/lib/utils';

type Phase = 'pick' | 'analyzing' | 'result';

const SCAN_XP = 15;

// Mock diagnosis outcomes — a stand-in for the future Gemini call.
const OUTCOMES: { healthScore: number; status: PlantStatus; headline: string; note: string }[] = [
  {
    healthScore: 92,
    status: 'healthy',
    headline: 'Looking healthy',
    note: 'Strong colour and firm leaves. Keep up the current routine.',
  },
  {
    healthScore: 74,
    status: 'water',
    headline: 'Slightly thirsty',
    note: 'Early signs of underwatering. A drink in the next day should help.',
  },
  {
    healthScore: 68,
    status: 'fertilize',
    headline: 'Could use feeding',
    note: 'Pale new growth suggests a light feed would help it along.',
  },
];

interface ScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (xp: number) => void;
}

export function ScanDialog({ open, onOpenChange, onComplete }: ScanDialogProps) {
  const { plants, applyScan } = useGarden();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('pick');
  const [plantId, setPlantId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<(typeof OUTCOMES)[number] | null>(null);

  // Reset whenever the dialog is (re)opened.
  useEffect(() => {
    if (open) {
      setPhase('pick');
      setPlantId(null);
      setOutcome(null);
    }
  }, [open]);

  function startScan(id: string) {
    setPlantId(id);
    setPhase('analyzing');
    const result = OUTCOMES[Math.floor(Math.random() * OUTCOMES.length)];
    window.setTimeout(
      () => {
        applyScan(id, { healthScore: result.healthScore, status: result.status, xp: SCAN_XP });
        setOutcome(result);
        setPhase('result');
        onComplete?.(SCAN_XP);
      },
      reduce ? 400 : 1700
    );
  }

  const plant = plants.find((p) => p.id === plantId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            Scan a plant
          </DialogTitle>
          <DialogDescription>
            {phase === 'pick' && 'Choose a plant to run an AI health check.'}
            {phase === 'analyzing' && 'Analysing leaf colour, shape and health markers…'}
            {phase === 'result' && 'Here’s what the scan found.'}
          </DialogDescription>
        </DialogHeader>

        {phase === 'pick' && (
          <div className="grid max-h-72 gap-2 overflow-y-auto py-1">
            {plants.map((p) => (
              <button
                key={p.id}
                onClick={() => startScan(p.id)}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left transition-colors hover:border-primary/30 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PlantAvatar name={p.name} className="h-10 w-10 text-sm" />
                <div className="min-w-0">
                  <div className="font-black text-foreground">{p.name}</div>
                  <div className="truncate text-xs italic text-muted-foreground">
                    {p.species}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {phase === 'analyzing' && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <motion.div
              animate={reduce ? undefined : { scale: [1, 1.06, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent"
            >
              {plant && <PlantAvatar name={plant.name} className="h-12 w-12 text-base" />}
            </motion.div>
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analysing {plant?.name}…
            </div>
          </div>
        )}

        {phase === 'result' && outcome && (
          <div className="py-1">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/60 p-4">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                  outcome.healthScore >= 85
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-reward-soft text-reward-foreground'
                )}
              >
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="font-black text-foreground">{outcome.headline}</div>
                <div className="text-sm text-muted-foreground">
                  Health score {outcome.healthScore}/100
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{outcome.note}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-reward-soft px-3 py-1 text-xs font-black text-reward-foreground">
              +{SCAN_XP} XP earned
            </div>
          </div>
        )}

        {phase !== 'analyzing' && (
          <DialogFooter className="mt-2">
            <Button
              variant={phase === 'result' ? 'default' : 'ghost'}
              onClick={() => (phase === 'result' ? onOpenChange(false) : onOpenChange(false))}
            >
              {phase === 'result' ? 'Done' : 'Cancel'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
