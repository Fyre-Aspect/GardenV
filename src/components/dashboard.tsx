'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Camera, Leaf, Plus, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useGarden } from '@/components/garden-provider';
import { SectionHeader } from '@/components/garden/section-header';
import { StreakDots } from '@/components/garden/streak-dots';
import { PlantCard } from '@/components/garden/plant-card';
import { PlantAvatar } from '@/components/garden/plant-avatar';
import { Toast, type ToastState } from '@/components/garden/toast';
import { AddPlantDialog } from '@/components/garden/add-plant-dialog';
import { ScanDialog } from '@/components/garden/scan-dialog';
import { PlantDetailDialog } from '@/components/garden/plant-detail-dialog';
import { LevelUpCelebration } from '@/components/garden/level-up-celebration';
import { MilestoneCelebration } from '@/components/garden/milestone-celebration';
import { PlantLeaderboard } from '@/components/garden/plant-leaderboard';
import { StreakLeaderboard } from '@/components/garden/streak-leaderboard';
import {
  CARE_META,
  dailyCareNeeds,
  healthCheckDue,
  weekKey,
  type CareNeed,
  type PlantVM,
} from '@/lib/data';

interface DashboardProps {
  onSignOut: () => void;
}

interface DueCareItem {
  plant: PlantVM;
  need: CareNeed;
}

export default function Dashboard({ onSignOut }: DashboardProps) {
  const { plants, streak } = useGarden();

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const [addOpen, setAddOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState<PlantVM | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<PlantVM | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | 'unsupported'>('unsupported');

  function showToast(message: string, action?: { label: string; fn: () => void }) {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, actionLabel: action?.label, onAction: action?.fn });
    toastTimer.current = window.setTimeout(() => setToast(null), action ? 4000 : 2200);
  }

  function openPlant(plant: PlantVM) {
    setSelectedPlant(plant);
    setDetailOpen(true);
  }

  function startHealthCheck(plant: PlantVM) {
    setDetailOpen(false);
    setScanTarget(plant);
    setScanOpen(true);
  }

  function openScanNew() {
    setScanTarget(null);
    setScanOpen(true);
  }

  // ── Derived: what's due right now, and which companions need a health check ──
  const careItems = useMemo<DueCareItem[]>(() => {
    const now = Date.now();
    const items: DueCareItem[] = [];
    for (const plant of plants) {
      for (const need of dailyCareNeeds(plant, now)) {
        if (need.dueInDays <= 0) items.push({ plant, need });
      }
    }
    return items;
  }, [plants]);

  const checkDue = useMemo(() => plants.filter((p) => healthCheckDue(p)), [plants]);
  const dueNames = checkDue.map((p) => p.name).join(', ');
  const allCaredFor = careItems.length === 0;

  // Detect notification support / permission on mount.
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPerm(Notification.permission);
    }
  }, []);

  // Fire one local notification per week when checks are due (if allowed).
  useEffect(() => {
    if (notifPerm !== 'granted' || checkDue.length === 0) return;
    const key = `kindred:hc-notif:${weekKey()}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
      new Notification('Kindred · weekly health check', {
        body: `Time for a photo health check: ${dueNames}.`,
      });
    } catch {
      /* notifications are best-effort */
    }
  }, [notifPerm, checkDue.length, dueNames]);

  function enableReminders() {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    Notification.requestPermission().then(setNotifPerm);
  }

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
      <MilestoneCelebration />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-black tracking-tight text-foreground">Kindred</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-bold text-foreground" aria-label={`${streak} day streak`}>
              {streak}
              <span className="ml-1 font-medium text-muted-foreground">
                day{streak === 1 ? '' : 's'}
              </span>
            </div>
            <button
              onClick={onSignOut}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── BODY: rails (desktop) / stacked boards above garden (mobile) ── */}
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-start">
        {/* LEFT rail — weekly plant-level board */}
        <aside className="order-1 lg:sticky lg:top-20 lg:w-64 lg:shrink-0">
          <PlantLeaderboard />
        </aside>

        {/* CENTER — the garden */}
        <main className="order-3 min-w-0 flex-1 pb-20 lg:order-2">
          {/* ── WELCOME ── */}
          <Card className="mb-6 border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  Good morning, Gardener
                </h1>
                <p className="mt-1 text-muted-foreground">
                  {allCaredFor
                    ? 'All cared for today. Nicely kept.'
                    : `${careItems.length} ${careItems.length === 1 ? 'thing' : 'things'} need attention today.`}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-border bg-secondary/50 px-5 py-3">
                <div className="text-2xl font-black leading-none text-foreground">{streak}</div>
                <div className="mt-1 text-xs font-medium text-muted-foreground">
                  day{streak === 1 ? '' : 's'} streak
                </div>
              </div>
            </div>
            <StreakDots filled={Math.min(streak, 7)} className="mt-5" />
          </Card>

          {/* ── WEEKLY HEALTH CHECK ── */}
          {checkDue.length > 0 && (
            <Card className="mb-8 border-reward/30 bg-reward-soft/40 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-reward/15 text-reward">
                  <Camera className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-black text-foreground">Weekly health check</div>
                  <p className="text-sm text-muted-foreground">
                    Health is judged from photos, not watering. Snap a fresh picture to update it.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {checkDue.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => startHealthCheck(p)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-reward/40 bg-background px-3 py-1.5 text-sm font-bold text-foreground transition-colors hover:bg-reward-soft"
                      >
                        <Camera className="h-3.5 w-3.5 text-reward" />
                        {p.name}
                      </button>
                    ))}
                  </div>
                  {notifPerm === 'default' && (
                    <button
                      onClick={enableReminders}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-reward-foreground/80 transition-colors hover:text-reward-foreground"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      Turn on weekly reminders
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* ── TODAY'S CARE (exact amounts) ── */}
          <section className="mb-10">
            <SectionHeader title="Today's care" />
            {allCaredFor ? (
              <Card className="border-border p-6 text-center text-sm text-muted-foreground">
                Nothing due today, your companions are all set.
              </Card>
            ) : (
              <div className="space-y-3">
                {careItems.map(({ plant, need }) => (
                  <button
                    key={`${plant.id}-${need.type}`}
                    onClick={() => openPlant(plant)}
                    className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/30"
                  >
                    {plant.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={plant.photoUrl}
                        alt={plant.name}
                        className="h-11 w-11 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <PlantAvatar name={plant.name} kind={plant.kind} className="h-11 w-11 text-sm" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-foreground">
                        {CARE_META[need.type].verb} {plant.name}
                      </div>
                      <div className="text-sm text-muted-foreground">Give {need.amount}</div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-primary">Care →</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ── GARDEN ── */}
          <section>
            <SectionHeader title="My garden">
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </SectionHeader>
            {plants.length === 0 ? (
              <Card className="border-border p-8 text-center text-sm text-muted-foreground">
                No companions yet. Add a plant or pet, or scan one with the camera.
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                {plants.map((plant) => (
                  <PlantCard key={plant.id} plant={plant} onClick={() => openPlant(plant)} />
                ))}
              </div>
            )}
          </section>
        </main>

        {/* RIGHT rail — streak board */}
        <aside className="order-2 lg:order-3 lg:sticky lg:top-20 lg:w-64 lg:shrink-0">
          <StreakLeaderboard />
        </aside>
      </div>

      {/* ── SCAN FAB ── */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={openScanNew}
        className="fixed bottom-8 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Scan a plant or pet"
      >
        <ScanLine className="h-6 w-6" />
      </motion.button>

      {/* ── DIALOGS ── */}
      <AddPlantDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={(name) => showToast(`${name} added to your garden`)}
        onRequestScan={openScanNew}
      />
      <ScanDialog
        open={scanOpen}
        onOpenChange={(o) => {
          setScanOpen(o);
          if (!o) setScanTarget(null);
        }}
        target={scanTarget}
        onScanned={(info) => showToast(`${info.name}: ${info.message} (+${info.xp} XP)`)}
      />
      <PlantDetailDialog
        plant={selectedPlant}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onCare={(message) => showToast(message)}
        onHealthCheck={startHealthCheck}
      />
    </div>
  );
}
