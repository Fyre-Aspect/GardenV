'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGarden } from '@/components/garden-provider';
import type { LightLevel } from '@/lib/data';
import { cn } from '@/lib/utils';

const LIGHT_OPTIONS: { value: LightLevel; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'bright', label: 'Bright' },
];

interface AddPlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: (name: string) => void;
}

export function AddPlantDialog({ open, onOpenChange, onAdded }: AddPlantDialogProps) {
  const { addPlant } = useGarden();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [light, setLight] = useState<LightLevel>('medium');

  function reset() {
    setName('');
    setSpecies('');
    setLight('medium');
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addPlant({ name, species, light });
    onAdded?.(name.trim());
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a plant</DialogTitle>
          <DialogDescription>
            Give it a name and we&apos;ll start tracking its care.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="plant-name">Name</Label>
            <Input
              id="plant-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Klaus"
              autoFocus
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="plant-species">Species</Label>
            <Input
              id="plant-species"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="e.g. Monstera deliciosa"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Light</Label>
            <div className="grid grid-cols-3 gap-2">
              {LIGHT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLight(opt.value)}
                  className={cn(
                    'h-10 rounded-xl border text-sm font-bold transition-colors',
                    light === opt.value
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border bg-background text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Add plant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
