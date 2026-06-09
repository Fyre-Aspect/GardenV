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
  HEALTHY_LEVEL_MIN,
  dayKey,
  isStreakMilestone,
  nextStreak,
  plantLevel,
  weekKey,
  type CareType,
  type Kind,
  type LightLevel,
  type PlantStatus,
  type PlantVM,
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

/** A plant just hit a new level — drives the celebration card. */
interface PlantLevelUp {
  name: string;
  level: number;
}

interface GardenContextValue {
  /** Companions, each with its level + weekly XP already resolved for display. */
  plants: PlantVM[];
  tasks: TaskVM[];
  streak: number;
  /** Public name shown on the streak leaderboard. */
  displayName: string;
  /** Set when a plant levels up; cleared via `acknowledgeLevelUp`. */
  justLeveledUp: PlantLevelUp | null;
  /** Set to the streak count when a milestone is hit; cleared via `acknowledgeStreak`. */
  justHitStreak: number | null;
  completeTask: (taskId: string) => void;
  undoTask: (taskId: string) => void;
  addPlant: (input: NewPlantInput) => PlantVM;
  addScannedPlant: (input: ScannedPlantInput) => PlantVM;
  removePlant: (id: string) => void;
  /** Record a care action: stamps the cooldown + awards the plant XP (if healthy). */
  logCare: (plantId: string, type: CareType, xp: number) => void;
  /** Attach or replace a companion's photo. */
  setPlantPhoto: (id: string, photoUrl: string) => void;
  /** Record this week's photo health check — the only thing that moves health. */
  recordHealthCheck: (id: string, input: HealthCheckInput) => void;
  acknowledgeLevelUp: () => void;
  acknowledgeStreak: () => void;
}

interface PersistShape {
  plants: PlantVM[];
  tasks: TaskVM[];
  streak: number;
  lastActiveDay: string;
}

/**
 * Bump to force a one-time wipe of every existing garden. On load, any doc
 * whose `version` doesn't match is reset to an empty garden. Bumped to 4 when
 * XP moved from the user onto individual plants.
 */
const SCHEMA_VERSION = 4;

const EMPTY_GARDEN: PersistShape = {
  plants: [],
  tasks: [],
  streak: 0,
  lastActiveDay: '',
};

/** XP awarded for scanning and cataloguing a new companion. */
export const SCAN_XP = 25;
/** XP awarded for completing a weekly photo health check. */
export const HEALTH_CHECK_XP = 15;

const gardenDoc = (uid: string) => doc(db, 'gardens', uid);

const clampHealth = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** A plant's XP for the current week (0 if its stored XP belongs to a past week). */
function currentWeekXp(p: PlantVM): number {
  return p.levelWeek === weekKey() ? p.weeklyXp ?? 0 : 0;
}

/**
 * Add `delta` XP to a plant's weekly total, resetting first if the stored XP is
 * from a previous week. Care only counts toward leveling while the companion is
 * thriving (≥ 90% health); a neglected plant is returned unchanged.
 */
function addXpToPlant(p: PlantVM, delta: number): PlantVM {
  if (delta > 0 && p.healthScore < HEALTHY_LEVEL_MIN) return p;
  const cur = weekKey();
  const base = p.levelWeek === cur ? p.weeklyXp ?? 0 : 0;
  return { ...p, weeklyXp: Math.max(0, base + delta), levelWeek: cur };
}

/** Reset a plant's weekly XP if it belongs to a past week (Monday rollover). */
function normalizeWeek(p: PlantVM): PlantVM {
  const cur = weekKey();
  return p.levelWeek === cur ? p : { ...p, weeklyXp: 0, levelWeek: cur };
}

const GardenContext = createContext<GardenContextValue | null>(null);

export function GardenProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();

  const [plants, setPlants] = useState<PlantVM[]>(EMPTY_GARDEN.plants);
  const [tasks, setTasks] = useState<TaskVM[]>(EMPTY_GARDEN.tasks);
  const [streak, setStreak] = useState(0);
  const [lastActiveDay, setLastActiveDay] = useState('');
  const [justLeveledUp, setJustLeveledUp] = useState<PlantLevelUp | null>(null);
  const [justHitStreak, setJustHitStreak] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const lastSyncedRef = useRef<string | null>(null);

  // Refs mirror the latest state so event callbacks read fresh values without
  // nesting side effects inside setState updaters (StrictMode double-invokes those).
  const plantsRef = useRef(plants);
  plantsRef.current = plants;
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const streakRef = useRef(streak);
  streakRef.current = streak;
  const lastActiveRef = useRef(lastActiveDay);
  lastActiveRef.current = lastActiveDay;

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
      setStreak(0);
      setLastActiveDay('');
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
          setStreak(0);
          setLastActiveDay('');
          setDoc(ref, {
            ...EMPTY_GARDEN,
            version: SCHEMA_VERSION,
            updatedAt: serverTimestamp(),
          }).catch((err) => console.error('[garden] failed to initialise garden doc', err));
          setHydrated(true);
          return;
        }

        const next: PersistShape = {
          plants: Array.isArray(data.plants)
            ? (data.plants as PlantVM[]).map(normalizeWeek)
            : [],
          tasks: Array.isArray(data.tasks) ? (data.tasks as TaskVM[]) : [],
          streak: typeof data.streak === 'number' ? data.streak : 0,
          lastActiveDay: typeof data.lastActiveDay === 'string' ? data.lastActiveDay : '',
        };
        lastSyncedRef.current = JSON.stringify(next);
        setPlants(next.plants);
        setTasks(next.tasks);
        setStreak(next.streak);
        setLastActiveDay(next.lastActiveDay);
        setHydrated(true);
      },
      (err) => console.error('[garden] snapshot listener error', err)
    );

    return unsub;
  }, [user, ready]);

  // ── Persist garden changes (debounced) ───────────────────────────────────
  useEffect(() => {
    if (!user || !hydrated) return;
    const payload: PersistShape = { plants, tasks, streak, lastActiveDay };
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
  }, [plants, tasks, streak, lastActiveDay, user, hydrated]);

  /** Fire the level-up celebration if `after` reached a higher level than `before`. */
  const detectLevelUp = useCallback((before: PlantVM, after: PlantVM) => {
    const gained = plantLevel(currentWeekXp(after)) - plantLevel(currentWeekXp(before));
    if (gained > 0) {
      setJustLeveledUp({ name: after.name, level: plantLevel(currentWeekXp(after)) });
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

  const logCare = useCallback(
    (plantId: string, type: CareType, xp: number) => {
      const plant = plantsRef.current.find((p) => p.id === plantId);
      if (!plant) return;
      // Care stamps the cooldown/schedule and, if the plant is healthy, levels it.
      const stamped = { ...plant, lastCare: { ...plant.lastCare, [type]: Date.now() } };
      const updated = xp ? addXpToPlant(stamped, xp) : stamped;
      setPlants((prev) => prev.map((p) => (p.id === plantId ? updated : p)));
      detectLevelUp(plant, updated);
      registerActivity();
    },
    [detectLevelUp, registerActivity]
  );

  const completeTask = useCallback(
    (taskId: string) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task || task.done) return;
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: true } : t)));

      const plant = plantsRef.current.find((p) => p.id === task.plantId);
      if (plant) {
        const stamped = {
          ...plant,
          lastCare: { ...plant.lastCare, [task.type]: Date.now() },
        };
        const updated = addXpToPlant(stamped, task.xp);
        setPlants((prev) => prev.map((p) => (p.id === task.plantId ? updated : p)));
        detectLevelUp(plant, updated);
      }
      registerActivity();
    },
    [detectLevelUp, registerActivity]
  );

  const undoTask = useCallback((taskId: string) => {
    const task = tasksRef.current.find((t) => t.id === taskId);
    if (!task || !task.done) return;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: false } : t)));
    // Reverse the XP on that plant (an undo, so not health-gated).
    setPlants((prev) =>
      prev.map((p) => {
        if (p.id !== task.plantId) return p;
        const cur = weekKey();
        const base = p.levelWeek === cur ? p.weeklyXp ?? 0 : 0;
        return { ...p, weeklyXp: Math.max(0, base - task.xp), levelWeek: cur };
      })
    );
  }, []);

  const addPlant = useCallback((input: NewPlantInput): PlantVM => {
    const plant: PlantVM = {
      id: `p-${Date.now()}`,
      name: input.name.trim(),
      species:
        input.species.trim() || (input.kind === 'pet' ? 'Unknown breed' : 'Unknown species'),
      kind: input.kind,
      level: 1,
      weeklyXp: 0,
      levelWeek: weekKey(),
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
      const plant = plantsRef.current.find((p) => p.id === id);
      if (!plant) return;
      const healed: PlantVM = {
        ...plant,
        healthScore: clampHealth(input.healthScore),
        status: input.status,
        photoUrl: input.photoUrl ?? plant.photoUrl,
        light: input.light ?? plant.light,
        wateringIntervalDays: input.wateringIntervalDays ?? plant.wateringIntervalDays,
        fertilizingIntervalDays: input.fertilizingIntervalDays ?? plant.fertilizingIntervalDays,
        lastHealthCheckWeek: weekKey(),
      };
      const updated = addXpToPlant(healed, HEALTH_CHECK_XP);
      setPlants((prev) => prev.map((p) => (p.id === id ? updated : p)));
      detectLevelUp(plant, updated);
      registerActivity();
    },
    [detectLevelUp, registerActivity]
  );

  const addScannedPlant = useCallback(
    (input: ScannedPlantInput): PlantVM => {
      const id = `p-${Date.now()}`;
      const base: PlantVM = {
        id,
        name: input.name.trim() || (input.kind === 'pet' ? 'New pet' : 'New plant'),
        species:
          input.species.trim() || (input.kind === 'pet' ? 'Unknown breed' : 'Unknown species'),
        kind: input.kind,
        level: 1,
        weeklyXp: 0,
        levelWeek: weekKey(),
        status: input.status,
        healthScore: clampHealth(input.healthScore),
        wateringIntervalDays: input.wateringIntervalDays,
        fertilizingIntervalDays: input.fertilizingIntervalDays,
        light: input.light,
        lastCare: {},
        // A photo at add-time counts as this week's health check; a text-only
        // add (no photo) leaves both fields off so the weekly check stays due.
        ...(input.photoUrl
          ? { photoUrl: input.photoUrl, lastHealthCheckWeek: weekKey() }
          : {}),
      };
      const seeded = addXpToPlant(base, SCAN_XP);
      setPlants((prev) => [...prev, seeded]);
      detectLevelUp(base, seeded);
      registerActivity();
      return seeded;
    },
    [detectLevelUp, registerActivity]
  );

  const acknowledgeLevelUp = useCallback(() => setJustLeveledUp(null), []);
  const acknowledgeStreak = useCallback(() => setJustHitStreak(null), []);

  // Resolve each plant's level + weekly XP for display (reset-aware).
  const resolvedPlants = useMemo(
    () =>
      plants.map((p) => {
        const wx = currentWeekXp(p);
        return { ...p, weeklyXp: wx, levelWeek: weekKey(), level: plantLevel(wx) };
      }),
    [plants]
  );

  const value = useMemo<GardenContextValue>(
    () => ({
      plants: resolvedPlants,
      tasks,
      streak,
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
      resolvedPlants,
      tasks,
      streak,
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
