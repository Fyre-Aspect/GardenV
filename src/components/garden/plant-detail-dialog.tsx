'use client';

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
import { useGarden } from '@/components/garden-provider';
import { STATUS_META, type CareType, type PlantVM } from '@/lib/data';
import { cn } from '@/lib/utils';

interface PlantDetailDialogProps {
  plant: PlantVM | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCare?: (type: CareType) => void;
}

const CARE_ACTIONS: { type: CareType; label: string }[] = [
  { type: 'water', label: 'Water' },
  { type: 'fertilize', label: 'Feed' },
];

function CareFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/50 p-3">
      <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-black text-foreground">{value}</div>
    </div>
  );
}

export function PlantDetailDialog({
  plant,
  open,
  onOpenChange,
  onCare,
}: PlantDetailDialogProps) {
  const { carePlant } = useGarden();
  if (!plant) return null;

  const status = STATUS_META[plant.status];

  function handleCare(type: CareType) {
    if (!plant) return;
    carePlant(plant.id, type);
    onCare?.(type);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-4">
            <PlantAvatar name={plant.name} className="h-14 w-14 text-lg" />
            <div className="min-w-0">
              <DialogTitle>{plant.name}</DialogTitle>
              <DialogDescription className="italic">{plant.species}</DialogDescription>
            </div>
            <Badge variant="level" className="ml-auto">
              Lv.{plant.level}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid gap-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-bold text-foreground">Health</span>
              <span className="text-muted-foreground">{plant.healthScore}/100</span>
            </div>
            <ProgressBar value={plant.healthScore} className="bg-primary" />
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
            <CareFact label="Water" value={`${plant.wateringIntervalDays}d`} />
            <CareFact label="Feed" value={`${plant.fertilizingIntervalDays}d`} />
            <CareFact label="Light" value={plant.light} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {CARE_ACTIONS.map((action) => {
              const Icon = CARE_ICON[action.type];
              return (
                <Button
                  key={action.type}
                  variant="secondary"
                  onClick={() => handleCare(action.type)}
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
