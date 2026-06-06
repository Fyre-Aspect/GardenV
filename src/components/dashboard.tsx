'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Plus, ScanLine, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useGarden } from '@/components/garden-provider';
import { SectionHeader } from '@/components/garden/section-header';
import { StreakDots } from '@/components/garden/streak-dots';
import { ProgressBar } from '@/components/garden/progress-bar';
import { PlantCard } from '@/components/garden/plant-card';
import { TaskCard } from '@/components/garden/task-card';
import { Toast, type ToastState } from '@/components/garden/toast';
import { AddPlantDialog } from '@/components/garden/add-plant-dialog';
import { ScanDialog } from '@/components/garden/scan-dialog';
import { PlantDetailDialog } from '@/components/garden/plant-detail-dialog';
import { LevelUpCelebration } from '@/components/garden/level-up-celebration';
import type { PlantVM } from '@/lib/data';

interface DashboardProps {
  onSignOut: () => void;
}

export default function Dashboard({ onSignOut }: DashboardProps) {
  const {
    plants,
    tasks,
    streak,
    progress,
    completeTask,
    undoTask,
  } = useGarden();

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const [addOpen, setAddOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<PlantVM | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  function showToast(message: string, action?: { label: string; fn: () => void }) {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, actionLabel: action?.label, onAction: action?.fn });
    toastTimer.current = window.setTimeout(() => setToast(null), action ? 4000 : 2200);
  }

  function handleComplete(taskId: string, xp: number) {
    completeTask(taskId);
    showToast(`+${xp} XP`, { label: 'Undo', fn: () => undoTask(taskId) });
  }

  function openPlant(plant: PlantVM) {
    setSelectedPlant(plant);
    setDetailOpen(true);
  }

  const remaining = tasks.filter((t) => !t.done).length;
  const allDone = remaining === 0;
  const xpPct = (progress.xpIntoLevel / progress.xpForNext) * 100;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-sans">
      <Toast
        toast={toast}
        onAction={() => {
          toast?.onAction?.();
          setToast(null);
        }}
      />
      <LevelUpCelebration />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-black tracking-tight text-foreground">GardenKeeper</span>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-1.5 text-sm font-bold text-reward-foreground"
              aria-label={`${streak} day streak`}
            >
              <Sparkles className="h-4 w-4 text-reward" aria-hidden />
              <span aria-hidden>{streak}</span>
            </div>
            <motion.div
              key={progress.xpIntoLevel}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-1.5 text-sm font-bold text-foreground"
              aria-label={`${progress.xpIntoLevel} XP toward level ${progress.level + 1}`}
            >
              <Zap className="h-4 w-4 text-reward" aria-hidden />
              <span aria-hidden>{progress.xpIntoLevel} XP</span>
            </motion.div>
            <button
              onClick={onSignOut}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
        <ProgressBar value={xpPct} className="rounded-none" trackClassName="h-1 rounded-none bg-secondary" />
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-28 pt-8">
        {/* ── WELCOME ── */}
        <Card className="mb-6 border-border p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Good morning, Gardener
              </h1>
              <p className="mt-1 text-muted-foreground">
                {allDone
                  ? "All done for today. Nicely kept."
                  : `You have ${remaining} ${remaining === 1 ? 'task' : 'tasks'} today. Keep the streak alive.`}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-center rounded-2xl border border-border bg-reward-soft/60 px-4 py-2.5">
              <Sparkles className="h-5 w-5 text-reward" />
              <div className="text-lg font-black leading-none text-reward-foreground">
                {streak}
              </div>
              <div className="text-xs font-medium text-reward-foreground/70">days</div>
            </div>
          </div>
          <StreakDots filled={Math.min(streak, 7)} className="mt-5" />
        </Card>

        {/* ── LEVEL ── */}
        <Card className="mb-8 flex items-center gap-4 border-border bg-secondary/40 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground">
            {progress.level}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-black text-foreground">
                Level {progress.level} — Green Thumb
              </span>
              <span className="text-xs text-muted-foreground">
                {progress.xpIntoLevel}/{progress.xpForNext} XP
              </span>
            </div>
            <ProgressBar value={xpPct} />
          </div>
        </Card>

        {/* ── TASKS ── */}
        <section className="mb-10">
          <SectionHeader title="Today's care" />
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={() => handleComplete(task.id, task.xp)}
              />
            ))}
          </div>
        </section>

        {/* ── GARDEN ── */}
        <section>
          <SectionHeader title="My garden">
            <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add plant
            </Button>
          </SectionHeader>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {plants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} onClick={() => openPlant(plant)} />
            ))}
          </div>
        </section>
      </main>

      {/* ── SCAN FAB ── */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setScanOpen(true)}
        className="fixed bottom-8 right-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Scan a plant"
      >
        <ScanLine className="h-6 w-6" />
      </motion.button>

      {/* ── DIALOGS ── */}
      <AddPlantDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={(name) => showToast(`${name} added to your garden`)}
      />
      <ScanDialog
        open={scanOpen}
        onOpenChange={setScanOpen}
        onComplete={(xp) => showToast(`+${xp} XP from scan`)}
      />
      <PlantDetailDialog
        plant={selectedPlant}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onCare={() => showToast('Care logged')}
      />
    </div>
  );
}
