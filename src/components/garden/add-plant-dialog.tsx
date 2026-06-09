'use client';

import { useState } from 'react';
import { Camera, Sparkles } from 'lucide-react';
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
import { PlantLoader } from '@/components/garden/plant-loader';
import { useGarden } from '@/components/garden-provider';
import { identifyByText } from '@/lib/plant-ai';
import type { Kind, LightLevel } from '@/lib/data';
import { cn } from '@/lib/utils';

const LIGHT_OPTIONS: { value: LightLevel; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'bright', label: 'Bright' },
];

const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: 'plant', label: '🪴 Plant' },
  { value: 'pet', label: '🐾 Pet' },
];

interface AddPlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: (name: string) => void;
  /** Asked when the typed input is too vague and a photo is needed. */
  onRequestScan?: () => void;
}

export function AddPlantDialog({
  open,
  onOpenChange,
  onAdded,
  onRequestScan,
}: AddPlantDialogProps) {
  const { addPlant, addScannedPlant } = useGarden();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [kind, setKind] = useState<Kind>('plant');
  const [light, setLight] = useState<LightLevel>('medium');
  const [pending, setPending] = useState(false);
  const [needPhoto, setNeedPhoto] = useState<string | null>(null);

  const isPet = kind === 'pet';

  function reset() {
    setName('');
    setSpecies('');
    setKind('plant');
    setLight('medium');
    setPending(false);
    setNeedPhoto(null);
  }

  function close() {
    reset();
    onOpenChange(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || pending) return;
    setNeedPhoto(null);
    setPending(true);
    try {
      const result = await identifyByText(name.trim(), species.trim(), kind);
      if (result.confident) {
        addScannedPlant({
          name: name.trim(),
          species: result.species,
          kind: result.kind,
          status: result.status,
          healthScore: Math.max(0, Math.min(100, Math.round(result.healthScore))),
          light: result.light,
          wateringIntervalDays: result.wateringIntervalDays,
          fertilizingIntervalDays: result.fertilizingIntervalDays,
        });
        onAdded?.(name.trim());
        close();
      } else {
        // Too vague (e.g. "dog") — ask for a photo to identify accurately.
        setNeedPhoto(
          result.reason ||
            `“${species.trim() || name.trim()}” isn’t specific enough, a photo helps me identify it and check its health.`
        );
        setPending(false);
      }
    } catch {
      // AI unavailable — let them add manually rather than getting stuck.
      setNeedPhoto(
        'I couldn’t verify that just now. Add a photo for accurate info, or add the basics for now.'
      );
      setPending(false);
    }
  }

  function addBasic() {
    addPlant({ name: name.trim(), species, kind, light });
    onAdded?.(name.trim());
    close();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (pending) return;
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        {pending ? (
          <>
            <DialogHeader className="items-center text-center">
              <DialogTitle>Identifying…</DialogTitle>
              <DialogDescription>Checking what we know about your {isPet ? 'pet' : 'plant'}.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-6">
              <PlantLoader />
            </div>
          </>
        ) : needPhoto ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                A photo would help
              </DialogTitle>
              <DialogDescription>{needPhoto}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-2 flex-col gap-2 sm:flex-row">
              <Button variant="ghost" onClick={addBasic}>
                Add basic anyway
              </Button>
              <Button
                onClick={() => {
                  reset();
                  onOpenChange(false);
                  onRequestScan?.();
                }}
              >
                <Camera className="h-4 w-4" />
                Take a photo
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add to your garden</DialogTitle>
              <DialogDescription>
                Add a plant or a pet, we’ll identify it and start tracking its care.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {KIND_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setKind(opt.value)}
                      className={cn(
                        'h-10 rounded-xl border text-sm font-bold transition-colors',
                        kind === opt.value
                          ? 'border-primary bg-accent text-accent-foreground'
                          : 'border-border bg-background text-muted-foreground hover:bg-secondary'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="plant-name">Name</Label>
                <Input
                  id="plant-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isPet ? 'e.g. Rex' : 'e.g. Klaus'}
                  autoFocus
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="plant-species">{isPet ? 'Breed / animal' : 'Species'}</Label>
                <Input
                  id="plant-species"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  placeholder={isPet ? 'e.g. Golden Retriever' : 'e.g. Monstera deliciosa'}
                />
              </div>

              {!isPet && (
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
              )}

              <DialogFooter className="mt-2">
                <Button type="button" variant="ghost" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!name.trim()}>
                  <Sparkles className="h-4 w-4" />
                  Identify &amp; add
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
