import { useState } from 'react';

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

  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* ── XP POP TOAST ── */}
      {xpPop && (
        <div className="fixed top-20 inset-x-0 z-50 flex justify-center pointer-events-none">
          <div className="bg-yellow-400 text-yellow-900 font-black px-5 py-2 rounded-full shadow-lg text-sm animate-pop-in">
            {xpPop}
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="font-black text-garden text-lg">GardenKeeper</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold text-orange-500">
              <span className="text-lg">🔥</span>
              <span>{STREAK}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-yellow-600">
              <span className="text-lg">⚡</span>
              <span>{xp} XP</span>
            </div>
            <button
              onClick={onSignOut}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
        {/* XP progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-1.5 bg-gradient-to-r from-yellow-400 to-amber-400 transition-all duration-700"
            style={{ width: `${Math.min((xp / XP_TO_NEXT) * 100, 100)}%` }}
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 pb-28">
        {/* ── WELCOME CARD ── */}
        <div className="bg-white rounded-3xl p-6 mb-6 border-2 border-green-100 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900 mb-1">
                Good morning, Gardener! 🌞
              </h1>
              <p className="text-gray-500">
                {allDone ? (
                  "All done! You're crushing it today 🏆"
                ) : (
                  <>
                    You have{' '}
                    <strong className="text-garden">{tasks.length - completedCount} tasks</strong>{' '}
                    today. Keep that streak alive!
                  </>
                )}
              </p>
            </div>
            <div className="flex-shrink-0 text-center bg-orange-50 border border-orange-100 rounded-2xl px-4 py-2">
              <div className="text-2xl">🔥</div>
              <div className="font-black text-orange-500 text-xl leading-none">{STREAK}</div>
              <div className="text-xs text-orange-400 font-medium">days</div>
            </div>
          </div>
          {/* Weekly streak dots */}
          <div className="flex gap-1.5 mt-4">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={`day-${i}`} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < STREAK ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-300'
                  }`}
                >
                  {i < STREAK ? '✓' : '·'}
                </div>
                <span className="text-xs text-gray-400">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── LEVEL BADGE ── */}
        <div className="flex items-center gap-3 mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-4 border border-yellow-100">
          <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm flex-shrink-0">
            {LEVEL}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-black text-gray-900 text-sm">
                Level {LEVEL} — Green Thumb
              </span>
              <span className="text-xs text-gray-400">
                {xp}/{XP_TO_NEXT} XP
              </span>
            </div>
            <div className="h-2 bg-yellow-100 rounded-full overflow-hidden">
              <div
                className="h-2 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((xp / XP_TO_NEXT) * 100, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-2xl flex-shrink-0">⚡</span>
        </div>

        {/* ── TODAY'S TASKS ── */}
        <section className="mb-8">
          <h2 className="font-black text-xl text-gray-900 mb-4">Today's Care Tasks</h2>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-4 bg-white rounded-2xl p-4 border-2 transition-all ${
                  task.done
                    ? 'border-green-200 opacity-60'
                    : 'border-gray-100 hover:border-green-200 shadow-sm'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    task.done ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  {task.done ? '✅' : task.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-gray-900">
                    {task.type} {task.plant}
                  </div>
                  <div className="text-sm text-gray-400">+{task.xp} XP on completion</div>
                </div>
                {task.done ? (
                  <span className="text-green-500 font-bold text-sm flex-shrink-0">
                    +{task.xp} XP ✓
                  </span>
                ) : (
                  <button
                    onClick={() => completeTask(task.id, task.xp)}
                    className="flex-shrink-0 px-4 py-2 bg-garden text-white font-bold text-sm rounded-xl border-b-2 border-green-900 hover:brightness-110 active:border-b-0 active:translate-y-0.5 transition-all"
                  >
                    Done
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── MY GARDEN ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-xl text-gray-900">My Garden</h2>
            <button className="flex items-center gap-1.5 text-garden font-bold text-sm bg-green-50 px-3 py-1.5 rounded-xl border border-green-200 hover:bg-green-100 transition-colors">
              <span>+</span> Add Plant
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {PLANTS.map((plant) => (
              <div
                key={plant.id}
                className="bg-white rounded-3xl p-5 border-2 border-gray-100 hover:border-green-200 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform">
                    {plant.emoji}
                  </div>
                  <div className="bg-yellow-100 border border-yellow-200 text-yellow-700 text-xs font-black px-2 py-1 rounded-full">
                    Lv.{plant.level}
                  </div>
                </div>
                <div className="font-black text-gray-900 mb-0.5">{plant.name}</div>
                <div className="text-xs text-gray-400 mb-3 italic">{plant.species}</div>
                <div className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block ${plant.statusClass}`}>
                  {plant.status}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── FLOATING SCAN BUTTON ── */}
      <button className="fixed bottom-8 right-6 w-16 h-16 bg-garden text-white text-3xl rounded-full shadow-2xl border-b-4 border-green-900 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center">
        🔍
      </button>
    </div>
  );
}
