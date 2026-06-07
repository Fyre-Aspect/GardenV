'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  CARE_META,
  dayKey,
  deriveProgress,
  isStreakMilestone,
  leagueForXp,
  nextStreak,
  weekKey,
  type CareType,
  type Kind,
  type League,
  type LightLevel,
  type PlantStatus,
  type PlantVM,
  type Progress,
  type TaskVM,
} from '@/lib/data';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';

interface NewPlantInput {
  name: string;
  species: string;
  kind: Kind;
  light: LightLevel;
}

interface ScannedPlantInput {
  name: string;
  species: string;
  kind: Kind;
  status: PlantStatus;
  healthScore: number;
  light: LightLevel;
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  /** Set when the companion was added from an actual photo. */
  photoUrl?: string;
}

/** Result of a weekly photo health check on an existing companion. */
interface HealthCheckInput {
  healthScore: number;
  status: PlantStatus;
  photoUrl?: string;
  light?: LightLevel;
  wateringIntervalDays?: number;
  fertilizingIntervalDays?: number;
}

interface GardenContextValue {
  plants: PlantVM[];
  tasks: TaskVM[];
  totalXp: number;
  /** XP earned in the current week (drives the league + leaderboard). */
  weeklyXp: number;
  league: League;
  streak: number;
  progress: Progress;
  /** Public name shown on the leaderboard. */
  displayName: string;
  /** Set to the new level on a level-up; cleared via `acknowledgeLevelUp`. */
  justLeveledUp: number | null;
  /** Set to the streak count when a milestone is hit; cleared via `acknowledgeStreak`. */
  justHitStreak: number | null;
  completeTask: (taskId: string) => void;
  undoTask: (taskId: string) => void;
  addPlant: (input: NewPlantInput) => PlantVM;
  addScannedPlant: (input: ScannedPlantInput) => PlantVM;
  removePlant: (id: string) => void;
  /** Record a care action: stamps the cooldown + awards `xp` (never touches health). */
  logCare: (plantId: string, type: CareType, xp: number) => void;
  /** Attach or replace a companion's photo. */
  setPlantPhoto: (id: string, photoUrl: string) => void;
  /** Record this week's photo health check — the only thing that moves health. */
  recordHealthCheck: (id: string, input: HealthCheckInput) => void;
  acknowledgeLevelUp: () => void;
  acknowledgeStreak: () => void;
}

interface PersistShape {
  totalXp: number;
  plants: PlantVM[];
  tasks: TaskVM[];
  streak: number;
  lastActiveDay: string;
  weeklyXp: number;
  weekKey: string;
}

/**
 * Bump to force a one-time wipe of every existing garden. On load, any doc
 * whose `version` doesn't match is reset to an empty garden.
 */
const SCHEMA_VERSION = 3;

const EMPTY_GARDEN: PersistShape = {
  totalXp: 0,
  plants: [],
  tasks: [],
  streak: 0,
  lastActiveDay: '',
  weeklyXp: 0,
  weekKey: '',
};

/** XP awarded for scanning and cataloguing a new companion. */
export const SCAN_XP = 25;
/** XP awarded for completing a weekly photo health check. */
export const HEALTH_CHECK_XP = 15;

const gardenDoc = (uid: string) => doc(db, 'gardens', uid);
/** Public leaderboard mirror — one doc per user, readable by all. */
const leaderboardDoc = (uid: string) => doc(db, 'leaderboard', uid);

const GardenContext = createContext<GardenContextValue | null>(null);

export function GardenProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();

  const [plants, setPlants] = useState<PlantVM[]>(EMPTY_GARDEN.plants);
  const [tasks, setTasks] = useState<TaskVM[]>(EMPTY_GARDEN.tasks);
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastActiveDay, setLastActiveDay] = useState('');
  const [weeklyXp, setWeeklyXp] = useState(0);
  const [weekKeyState, setWeekKeyState] = useState('');
  const [justLeveledUp, setJustLeveledUp] = useState<number | null>(null);
  const [justHitStreak, setJustHitStreak] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const lastSyncedRef = useRef<string | null>(null);

  // Refs mirror the latest state so event callbacks read fresh values without
  // nesting side effects inside setState updaters (StrictMode double-invokes those).
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const streakRef = useRef(streak);
  streakRef.current = streak;
  const lastActiveRef = useRef(lastActiveDay);
  lastActiveRef.current = lastActiveDay;
  const weekRef = useRef(weekKeyState);
  weekRef.current = weekKeyState;

  const displayName = useMemo(
    () => user?.displayName || user?.email?.split('@')[0] || 'Gardener',
    [user]
  );

  // ── Subscribe to the user's garden doc ───────────────────────────────────
  useEffect(() => {
    if (!ready) return;

    if (!user) {
      lastSyncedRef.current = null;
      setPlants([]);
      setTasks([]);
      setTotalXp(0);
      setStreak(0);
      setLastActiveDay('');
      setWeeklyXp(0);
      setWeekKeyState('');
      setHydrated(false);
      return;
    }

    setHydrated(false);
    lastSyncedRef.current = null;
    const ref = gardenDoc(user.uid);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists()
          ? (snap.data() as Partial<PersistShape> & { version?: number })
          : null;

        if (!data || data.version !== SCHEMA_VERSION) {
          lastSyncedRef.current = JSON.stringify(EMPTY_GARDEN);
          setPlants([]);
          setTasks([]);
          setTotalXp(0);
          setStreak(0);
          setLastActiveDay('');
          setWeeklyXp(0);
          setWeekKeyState('');
          setDoc(ref, {
            ...EMPTY_GARDEN,
            version: SCHEMA_VERSION,
            updatedAt: serverTimestamp(),
          }).catch((err) => console.error('[garden] failed to initialise garden doc', err));
          setHydrated(true);
          return;
        }

        const next: PersistShape = {
          totalXp: typeof data.totalXp === 'number' ? data.totalXp : 0,
          plants: Array.isArray(data.plants) ? (data.plants as PlantVM[]) : [],
          tasks: Array.isArray(data.tasks) ? (data.tasks as TaskVM[]) : [],
          streak: typeof data.streak === 'number' ? data.streak : 0,
          lastActiveDay: typeof data.lastActiveDay === 'string' ? data.lastActiveDay : '',
          weeklyXp: typeof data.weeklyXp === 'number' ? data.weeklyXp : 0,
          weekKey: typeof data.weekKey === 'string' ? data.weekKey : '',
        };
        lastSyncedRef.current = JSON.stringify(next);
        setTotalXp(next.totalXp);
        setPlants(next.plants);
        setTasks(next.tasks);
        setStreak(next.streak);
        setLastActiveDay(next.lastActiveDay);
        setWeeklyXp(next.weeklyXp);
        setWeekKeyState(next.weekKey);
        setHydrated(true);
      },
      (err) => console.error('[garden] snapshot listener error', err)
    );

    return unsub;
  }, [user, ready]);

  // ── Persist garden changes (debounced) ───────────────────────────────────
  useEffect(() => {
    if (!user || !hydrated) return;
    const payload: PersistShape = {
      totalXp,
      plants,
      tasks,
      streak,
      lastActiveDay,
      weeklyXp,
      weekKey: weekKeyState,
    };
    const serialized = JSON.stringify(payload);
    if (serialized === lastSyncedRef.current) return;

    const ref = gardenDoc(user.uid);
    const timer = setTimeout(() => {
      lastSyncedRef.current = serialized;
      setDoc(
        ref,
        { ...payload, version: SCHEMA_VERSION, updatedAt: serverTimestamp() },
        { merge: true }
      ).catch((err) => console.error('[garden] failed to save garden', err));
    }, 600);
    return () => clearTimeout(timer);
  }, [totalXp, plants, tasks, streak, lastActiveDay, weeklyXp, weekKeyState, user, hydrated]);

  // Weekly XP only counts if it's still the same week; otherwise it's last
  // week's total and the league shows as reset until new XP comes in.
  const currentWeek = weekKey();
  const effectiveWeeklyXp = weekKeyState === currentWeek ? weeklyXp : 0;
  const league = useMemo(() => leagueForXp(effectiveWeeklyXp), [effectiveWeeklyXp]);

  // ── Mirror to the public leaderboard (debounced) ─────────────────────────
  useEffect(() => {
    if (!user || !hydrated) return;
    const timer = setTimeout(() => {
      setDoc(
        leaderboardDoc(user.uid),
        {
          name: displayName,
          totalXp,
          weeklyXp: effectiveWeeklyXp,
          league: league.key,
          week: currentWeek,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((err) => console.error('[garden] failed to update leaderboard', err));
    }, 800);
    return () => clearTimeout(timer);
  }, [user, hydrated, displayName, totalXp, effectiveWeeklyXp, league.key, currentWeek]);

  const progress = useMemo(() => deriveProgress(totalXp), [totalXp]);

  /** Adjust total XP (level-up detection) and roll the weekly-XP total. */
  const changeXp = useCallback((delta: number) => {
    setTotalXp((prev) => {
      const next = Math.max(0, prev + delta);
      if (delta > 0 && deriveProgress(next).level > deriveProgress(prev).level) {
        setJustLeveledUp(deriveProgress(next).level);
      }
      return next;
    });
    if (delta > 0) {
      const cur = weekKey();
      if (weekRef.current !== cur) {
        weekRef.current = cur;
        setWeekKeyState(cur);
        setWeeklyXp(delta);
      } else {
        setWeeklyXp((w) => w + delta);
      }
    }
  }, []);

  /** Count today as an active day and bump the streak (once per day). */
  const registerActivity = useCallback(() => {
    const today = dayKey();
    if (lastActiveRef.current === today) return;
    const ns = nextStreak(streakRef.current, lastActiveRef.current, today);
    streakRef.current = ns;
    lastActiveRef.current = today;
    setStreak(ns);
    setLastActiveDay(today);
    if (isStreakMilestone(ns)) setJustHitStreak(ns);
  }, []);

  const completeTask = useCallback(
    (taskId: string) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task || task.done) return;
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: true } : t)));
      // Care only stamps the cooldown/schedule — health is left untouched.
      setPlants((prev) =>
        prev.map((p) =>
          p.id === task.plantId
            ? { ...p, lastCare: { ...p.lastCare, [task.type]: Date.now() } }
            : p
        )
      );
      changeXp(task.xp);
      registerActivity();
    },
    [changeXp, registerActivity]
  );

  const undoTask = useCallback(
    (taskId: string) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task || !task.done) return;
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: false } : t)));
      changeXp(-task.xp);
    },
    [changeXp]
  );

  const addPlant = useCallback((input: NewPlantInput): PlantVM => {
    const plant: PlantVM = {
      id: `p-${Date.now()}`,
      name: input.name.trim(),
      species:
        input.species.trim() || (input.kind === 'pet' ? 'Unknown breed' : 'Unknown species'),
      kind: input.kind,
      level: 1,
      status: 'healthy',
      healthScore: 90,
      wateringIntervalDays: 7,
      fertilizingIntervalDays: input.kind === 'pet' ? 1 : 30,
      light: input.light,
      lastCare: {},
    };
    setPlants((prev) => [...prev, plant]);
    return plant;
  }, []);

  const removePlant = useCallback((id: string) => {
    setPlants((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.filter((t) => t.plantId !== id));
  }, []);

  const setPlantPhoto = useCallback((id: string, photoUrl: string) => {
    setPlants((prev) => prev.map((p) => (p.id === id ? { ...p, photoUrl } : p)));
  }, []);

  const recordHealthCheck = useCallback(
    (id: string, input: HealthCheckInput) => {
      setPlants((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                healthScore: Math.max(0, Math.min(100, Math.round(input.healthScore))),
                status: input.status,
                photoUrl: input.photoUrl ?? p.photoUrl,
                light: input.light ?? p.light,
                wateringIntervalDays: input.wateringIntervalDays ?? p.wateringIntervalDays,
                fertilizingIntervalDays: input.fertilizingIntervalDays ?? p.fertilizingIntervalDays,
                lastHealthCheckWeek: weekKey(),
              }
            : p
        )
      );
      changeXp(HEALTH_CHECK_XP);
      registerActivity();
    },
    [changeXp, registerActivity]
  );

  const logCare = useCallback(
    (plantId: string, type: CareType, xp: number) => {
      // Care only resets the schedule + awards XP. Health is unaffected — it's
      // judged solely by the weekly photo check.
      setPlants((prev) =>
        prev.map((p) =>
          p.id === plantId
            ? { ...p, lastCare: { ...p.lastCare, [type]: Date.now() } }
            : p
        )
      );
      if (xp) changeXp(xp);
      registerActivity();
    },
    [changeXp, registerActivity]
  );

  const addScannedPlant = useCallback(
    (input: ScannedPlantInput): PlantVM => {
      const id = `p-${Date.now()}`;
      const plant: PlantVM = {
        id,
        name: input.name.trim() || (input.kind === 'pet' ? 'New pet' : 'New plant'),
        species:
          input.species.trim() || (input.kind === 'pet' ? 'Unknown breed' : 'Unknown species'),
        kind: input.kind,
        level: 1,
        status: input.status,
        healthScore: input.healthScore,
        wateringIntervalDays: input.wateringIntervalDays,
        fertilizingIntervalDays: input.fertilizingIntervalDays,
        light: input.light,
        lastCare: {},
        photoUrl: input.photoUrl,
        // A photo at add-time counts as this week's health check; a text-only
        // add (no photo) leaves the weekly check due so we prompt for one.
        lastHealthCheckWeek: input.photoUrl ? weekKey() : undefined,
      };
      setPlants((prev) => [...prev, plant]);

      changeXp(SCAN_XP);
      registerActivity();
      return plant;
    },
    [changeXp, registerActivity]
  );

  const acknowledgeLevelUp = useCallback(() => setJustLeveledUp(null), []);
  const acknowledgeStreak = useCallback(() => setJustHitStreak(null), []);

  const value = useMemo<GardenContextValue>(
    () => ({
      plants,
      tasks,
      totalXp,
      weeklyXp: effectiveWeeklyXp,
      league,
      streak,
      progress,
      displayName,
      justLeveledUp,
      justHitStreak,
      completeTask,
      undoTask,
      addPlant,
      addScannedPlant,
      removePlant,
      logCare,
      setPlantPhoto,
      recordHealthCheck,
      acknowledgeLevelUp,
      acknowledgeStreak,
    }),
    [
      plants,
      tasks,
      totalXp,
      effectiveWeeklyXp,
      league,
      streak,
      progress,
      displayName,
      justLeveledUp,
      justHitStreak,
      completeTask,
      undoTask,
      addPlant,
      addScannedPlant,
      removePlant,
      logCare,
      setPlantPhoto,
      recordHealthCheck,
      acknowledgeLevelUp,
      acknowledgeStreak,
    ]
  );

  return <GardenContext.Provider value={value}>{children}</GardenContext.Provider>;
}

export function useGarden() {
  const ctx = useContext(GardenContext);
  if (!ctx) {
    throw new Error('useGarden must be used within a GardenProvider');
  }
  return ctx;
}

export const careLabel = (type: CareType) => CARE_META[type];
