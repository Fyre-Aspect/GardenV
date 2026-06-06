'use client';

import { useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DashboardProps {
  onSignOut: () => void;
}

interface Task {
  id: number;
  plant: string;
  type: string;
  emoji: string;
  done: boolean;
  xp: number;
}

const PLANTS = [
  {
    id: 1,
    name: 'Klaus',
    species: 'Monstera deliciosa',
    emoji: '🌿',
    level: 8,
    status: 'Needs water',
    statusClass: 'text-blue-600 bg-blue-50',
  },
  {
    id: 2,
    name: 'Sandy',
    species: 'Cactus mix',
    emoji: '🌵',
    level: 3,
    status: 'Healthy',
    statusClass: 'text-green-600 bg-green-50',
  },
  {
    id: 3,
    name: 'Lila',
    species: 'Peace Lily',
    emoji: '🌸',
    level: 5,
    status: 'Needs fertilizer',
    statusClass: 'text-orange-600 bg-orange-50',
  },
  {
    id: 4,
    name: 'Frank',
    species: 'Fiddle Leaf Fig',
    emoji: '🍃',
    level: 6,
    status: 'Needs light',
    statusClass: 'text-yellow-700 bg-yellow-50',
  },
];

const INITIAL_TASKS: Task[] = [
  { id: 1, plant: 'Klaus', type: 'Water', emoji: '💧', done: false, xp: 10 },
  { id: 2, plant: 'Lila', type: 'Fertilize', emoji: '🌿', done: false, xp: 20 },
  { id: 3, plant: 'Frank', type: 'Rotate toward light', emoji: '☀️', done: false, xp: 5 },
];

const STREAK = 7;
const XP_TO_NEXT = 300;
const LEVEL = 4;
// How many of the 7 weekday dots to fill. The all-time STREAK can exceed a
// week, so the dot row is driven by a value clamped to the 7-day window.
const DAYS_DONE_THIS_WEEK = Math.min(STREAK, 7);

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function Dashboard({ onSignOut }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [xp, setXp] = useState(240);
  const [xpPop, setXpPop] = useState<string | null>(null);

  function completeTask(id: number, earnedXp: number) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: true } : t)));
    setXp((prev) => prev + earnedXp);
    setXpPop(`+${earnedXp} XP! ⚡`);
    setTimeout(() => setXpPop(null), 1800);
  }

  const completedCount = tasks.filter((t) => t.done).length;
  const allDone = completedCount === tasks.length;
  const xpPct = Math.min((xp / XP_TO_NEXT) * 100, 100);

  return (
    <div className="min-h-screen overflow-x-hidden bg-cream font-sans">
      {/* ── XP POP TOAST ── */}
      <AnimatePresence>
        {xpPop && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center"
          >
            <div className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-black text-yellow-900 shadow-lg">
              {xpPop}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="text-lg font-black text-garden">GardenKeeper</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold text-orange-500">
              <span className="text-lg">🔥</span>
              <span>{STREAK}</span>
            </div>
            <motion.div
              key={xp}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-1.5 font-bold text-yellow-600"
            >
              <span className="text-lg">⚡</span>
              <span>{xp} XP</span>
            </motion.div>
            <button
              onClick={onSignOut}
              className="text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              Sign out
            </button>
          </div>
        </div>
        {/* XP progress bar */}
        <div className="h-1.5 bg-gray-100">
          <motion.div
            className="h-1.5 bg-gradient-to-r from-yellow-400 to-amber-400"
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-28 pt-8">
        {/* ── WELCOME CARD ── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <Card className="mb-6 border-2 border-green-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="mb-1 text-2xl font-black text-gray-900">
                  Good morning, Gardener! 🌞
                </h1>
                <p className="text-gray-500">
                  {allDone ? (
                    "All done! You're crushing it today 🏆"
                  ) : (
                    <>
                      You have{' '}
                      <strong className="text-garden">
                        {tasks.length - completedCount} tasks
                      </strong>{' '}
                      today. Keep that streak alive!
                    </>
                  )}
                </p>
              </div>
              <div className="flex-shrink-0 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-2 text-center">
                <div className="text-2xl">🔥</div>
                <div className="text-xl font-black leading-none text-orange-500">
                  {STREAK}
                </div>
                <div className="text-xs font-medium text-orange-400">days</div>
              </div>
            </div>
            {/* Weekly streak dots */}
            <div className="mt-4 flex gap-1.5">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={`day-${i}`} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      i < DAYS_DONE_THIS_WEEK
                        ? 'bg-orange-400 text-white'
                        : 'bg-gray-100 text-gray-300'
                    }`}
                  >
                    {i < DAYS_DONE_THIS_WEEK ? '✓' : '·'}
                  </div>
                  <span className="text-xs text-gray-400">{day}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* ── LEVEL BADGE ── */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-yellow-100 bg-gradient-to-r from-yellow-50 to-amber-50 p-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-lg font-black text-white shadow-sm">
            {LEVEL}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-black text-gray-900">Level {LEVEL} — Green Thumb</span>
              <span className="text-xs text-gray-400">
                {xp}/{XP_TO_NEXT} XP
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-yellow-100">
              <motion.div
                className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400"
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </div>
          </div>
          <span className="flex-shrink-0 text-2xl">⚡</span>
        </div>

        {/* ── TODAY'S TASKS ── */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-black text-gray-900">Today&apos;s Care Tasks</h2>
          <div className="space-y-3">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                className={`flex items-center gap-4 rounded-2xl border-2 bg-white p-4 transition-colors ${
                  task.done
                    ? 'border-green-200 opacity-60'
                    : 'border-gray-100 shadow-sm hover:border-green-200'
                }`}
              >
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl ${
                    task.done ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  {task.done ? '✅' : task.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-black text-gray-900">
                    {task.type} {task.plant}
                  </div>
                  <div className="text-sm text-gray-400">+{task.xp} XP on completion</div>
                </div>
                {task.done ? (
                  <span className="flex-shrink-0 text-sm font-bold text-green-500">
                    +{task.xp} XP ✓
                  </span>
                ) : (
                  <Button size="sm" onClick={() => completeTask(task.id, task.xp)}>
                    Done
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── MY GARDEN ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900">My Garden</h2>
            <Button variant="secondary" size="sm" className="bg-green-50 text-garden hover:bg-green-100">
              <Plus className="h-4 w-4" /> Add Plant
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {PLANTS.map((plant) => (
              <motion.div
                key={plant.id}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Card className="group cursor-pointer border-2 border-gray-100 p-5 transition-colors hover:border-green-200 hover:shadow-md">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 text-3xl shadow-sm transition-transform group-hover:scale-110">
                      {plant.emoji}
                    </div>
                    <Badge variant="level">Lv.{plant.level}</Badge>
                  </div>
                  <div className="mb-0.5 font-black text-gray-900">{plant.name}</div>
                  <div className="mb-3 text-xs italic text-gray-400">{plant.species}</div>
                  <div
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${plant.statusClass}`}
                  >
                    {plant.status}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* ── FLOATING SCAN BUTTON ── */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-8 right-6 flex h-16 w-16 items-center justify-center rounded-full border-b-4 border-garden-dark bg-garden text-white shadow-2xl transition-[filter] hover:brightness-110 active:border-b-0"
        aria-label="Scan a plant"
      >
        <Search className="h-7 w-7" />
      </motion.button>
    </div>
  );
}
