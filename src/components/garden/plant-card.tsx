'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PlantAvatar } from '@/components/garden/plant-avatar';
import { springSoft } from '@/lib/motion';
import { STATUS_META, type PlantVM } from '@/lib/data';
import { cn } from '@/lib/utils';

interface PlantCardProps {
  plant: PlantVM;
  onClick?: () => void;
}

/** A single plant tile. Opens the detail view when clicked. */
export function PlantCard({ plant, onClick }: PlantCardProps) {
  const reduce = useReducedMotion();
  const status = STATUS_META[plant.status];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reduce ? undefined : { y: -3 }}
      transition={springSoft}
      className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-3xl"
      aria-label={`View ${plant.name}, ${plant.species}`}
    >
      <Card className="h-full border-border p-5 transition-colors hover:border-primary/30 hover:shadow-md">
        <div className="mb-4 flex items-start justify-between">
          <PlantAvatar name={plant.name} kind={plant.kind} className="h-12 w-12 text-base" />
          <Badge variant="level">Lv.{plant.level}</Badge>
        </div>
        <div className="font-black text-foreground">{plant.name}</div>
        <div className="mb-3 text-xs italic text-muted-foreground">{plant.species}</div>
        <span
          className={cn(
            'inline-block rounded-full px-2.5 py-1 text-xs font-bold',
            status.tone
          )}
        >
          {status.label}
        </span>
      </Card>
    </motion.button>
  );
}
