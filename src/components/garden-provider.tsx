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
  CARE_TO_STATUS,
  deriveProgress,
  initialTotalXp,
  SEED_PLANTS,
  SEED_TASKS,
  STARTING_STREAK,
  type CareType,
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
  light: LightLevel;
}

interface ScanOutcome {
  healthScore: number;
  status: PlantStatus;
  xp: number;
}

interface GardenContextValue {
  plants: PlantVM[];
  tasks: TaskVM[];
  totalXp: number;
  streak: number;
  progress: Progress;
  /** Set to the new level when a level-up just happened; cleared via `acknowledgeLevelUp`. */
  justLeveledUp: number | null;
  completeTask: (taskId: string) => void;
  undoTask: (taskId: string) => void;
  addPlant: (input: NewPlantInput) => PlantVM;
  applyScan: (plantId: string, outcome: ScanOutcome) => void;
  /** Log an ad-hoc care action from the plant detail view: marks healthy + awards XP. */
  carePlant: (plantId: string, type: CareType) => void;
  acknowledgeLevelUp: () => void;
}

interface PersistShape {
  totalXp: number;
  plants: PlantVM[];
  tasks: TaskVM[];
}

/** Firestore document holding one user's whole garden, at `gardens/{uid}`. */
const gardenDoc = (uid: string) => doc(db, 'gardens', uid);

const GardenContext = createContext<GardenContextValue | null>(null);

/**
 * Garden state. Centralises all gamification logic — XP, level-up rollover,
 * task completion, scanning — and persists per-user to Firestore at
 * `gardens/{uid}`.
 *
 * Sync model: a live `onSnapshot` subscription hydrates state and keeps it
 * fresh across devices; local mutations are written back (debounced) via
 * `setDoc`. To avoid an echo loop (our own writes come back as snapshots) we
 * track the JSON of the last value we synced and only write when the current
 * state actually differs from it — value comparison, not a fragile flag.
 * Firestore's offline (IndexedDB) cache, enabled in `lib/firebase.ts`, keeps
 * this working with no network.
 */
export function GardenProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();

  const [plants, setPlants] = useState<PlantVM[]>(SEED_PLANTS);
  const [tasks, setTasks] = useState<TaskVM[]>(SEED_TASKS);
  const [totalXp, setTotalXp] = useState<number>(initialTotalXp);
  const [justLeveledUp, setJustLeveledUp] = useState<number | null>(null);

  // True once the current user's doc has loaded (or been seeded). Gates writes
  // so we never persist the default seed state over real data during load.
  const [hydrated, setHydrated] = useState(false);
  // JSON of the most recent value we know is in sync with Firestore (either
  // just read from a snapshot or just written). Used to suppress redundant /
  // echo writes without ever stranding a genuine local change.
  const lastSyncedRef = useRef<string | null>(null);

  // Subscribe to the signed-in user's garden doc. Seeds a fresh doc for new
  // users from the starter data. Re-runs whenever the account changes, so each
  // user only ever reads and writes their own `gardens/{uid}` document.
  useEffect(() => {
    if (!ready) return;

    if (!user) {
      // Signed out: reset to seed so the next account doesn't see stale data.
      lastSyncedRef.current = null;
      setPlants(SEED_PLANTS);
      setTasks(SEED_TASKS);
      setTotalXp(initialTotalXp());
      setHydrated(false);
      return;
    }

    setHydrated(false);
    lastSyncedRef.current = null;
    const ref = gardenDoc(user.uid);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<PersistShape>;
          const next: PersistShape = {
            totalXp: typeof data.totalXp === 'number' ? data.totalXp : initialTotalXp(),
            plants: Array.isArray(data.plants) ? (data.plants as PlantVM[]) : SEED_PLANTS,
            tasks: Array.isArray(data.tasks) ? (data.tasks as TaskVM[]) : SEED_TASKS,
          };
          lastSyncedRef.current = JSON.stringify(next);
          setTotalXp(next.totalXp);
          setPlants(next.plants);
          setTasks(next.tasks);
          setHydrated(true);
        } else {
          // New user — create their garden from the seed data.
          const seed: PersistShape = {
            totalXp: initialTotalXp(),
            plants: SEED_PLANTS,
            tasks: SEED_TASKS,
          };
          lastSyncedRef.current = JSON.stringify(seed);
          setTotalXp(seed.totalXp);
          setPlants(seed.plants);
          setTasks(seed.tasks);
          setDoc(ref, { ...seed, updatedAt: serverTimestamp() }).catch((err) =>
            console.error('[garden] failed to seed garden doc', err)
          );
          setHydrated(true);
        }
      },
      (err) => console.error('[garden] snapshot listener error', err)
    );

    return unsub;
  }, [user, ready]);

  // Persist local changes back to Firestore (debounced). Only writes when the
  // current state differs from the last value we synced, so our own snapshot
  // echoes don't trigger redundant writes.
  useEffect(() => {
    if (!user || !hydrated) return;
    const payload: PersistShape = { totalXp, plants, tasks };
    const serialized = JSON.stringify(payload);
    if (serialized === lastSyncedRef.current) return;

    const ref = gardenDoc(user.uid);
    const timer = setTimeout(() => {
      lastSyncedRef.current = serialized;
      setDoc(ref, { ...payload, updatedAt: serverTimestamp() }, { merge: true }).catch(
        (err) => console.error('[garden] failed to save garden', err)
      );
    }, 600);
    return () => clearTimeout(timer);
  }, [totalXp, plants, tasks, user, hydrated]);

  const progress = useMemo(() => deriveProgress(totalXp), [totalXp]);

  /** Adjust XP and flag a level-up if the level boundary was crossed upward. */
  const changeXp = useCallback((delta: number) => {
    setTotalXp((prev) => {
      const next = Math.max(0, prev + delta);
      if (delta > 0) {
        const before = deriveProgress(prev).level;
        const after = deriveProgress(next).level;
        if (after > before) setJustLeveledUp(after);
      }
      return next;
    });
  }, []);

  const setPlantStatus = useCallback((plantId: string, status: PlantStatus) => {
    setPlants((prev) =>
      prev.map((p) => (p.id === plantId ? { ...p, status } : p))
    );
  }, []);

  const completeTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => {
        const task = prev.find((t) => t.id === taskId);
        if (!task || task.done) return prev;
        changeXp(task.xp);
        setPlantStatus(task.plantId, 'healthy');
        return prev.map((t) => (t.id === taskId ? { ...t, done: true } : t));
      });
    },
    [changeXp, setPlantStatus]
  );

  const undoTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => {
        const task = prev.find((t) => t.id === taskId);
        if (!task || !task.done) return prev;
        changeXp(-task.xp);
        setPlantStatus(task.plantId, CARE_TO_STATUS[task.type]);
        return prev.map((t) => (t.id === taskId ? { ...t, done: false } : t));
      });
    },
    [changeXp, setPlantStatus]
  );

  const addPlant = useCallback((input: NewPlantInput): PlantVM => {
    const plant: PlantVM = {
      id: `p-${Date.now()}`,
      name: input.name.trim(),
      species: input.species.trim() || 'Unknown species',
      level: 1,
      status: 'healthy',
      healthScore: 90,
      wateringIntervalDays: 7,
      fertilizingIntervalDays: 30,
      light: input.light,
    };
    setPlants((prev) => [...prev, plant]);
    return plant;
  }, []);

  const applyScan = useCallback(
    (plantId: string, outcome: ScanOutcome) => {
      setPlants((prev) =>
        prev.map((p) =>
          p.id === plantId
            ? { ...p, healthScore: outcome.healthScore, status: outcome.status }
            : p
        )
      );
      changeXp(outcome.xp);
    },
    [changeXp]
  );

  const carePlant = useCallback(
    (plantId: string, type: CareType) => {
      setPlantStatus(plantId, 'healthy');
      changeXp(CARE_META[type].xp);
    },
    [changeXp, setPlantStatus]
  );

  const acknowledgeLevelUp = useCallback(() => setJustLeveledUp(null), []);

  const value = useMemo<GardenContextValue>(
    () => ({
      plants,
      tasks,
      totalXp,
      streak: STARTING_STREAK,
      progress,
      justLeveledUp,
      completeTask,
      undoTask,
      addPlant,
      applyScan,
      carePlant,
      acknowledgeLevelUp,
    }),
    [
      plants,
      tasks,
      totalXp,
      progress,
      justLeveledUp,
      completeTask,
      undoTask,
      addPlant,
      applyScan,
      carePlant,
      acknowledgeLevelUp,
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
