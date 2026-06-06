'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
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

const STORAGE_KEY = 'gardenkeeper.garden';

const GardenContext = createContext<GardenContextValue | null>(null);

/**
 * Garden state. Mirrors the persistence approach of `auth-provider.tsx`
 * (React state mirrored to localStorage) and centralises all gamification
 * logic — XP, level-up rollover, task completion, scanning — so the swap to
 * Firestore later only touches this file.
 */
export function GardenProvider({ children }: { children: React.ReactNode }) {
  const [plants, setPlants] = useState<PlantVM[]>(SEED_PLANTS);
  const [tasks, setTasks] = useState<TaskVM[]>(SEED_TASKS);
  const [totalXp, setTotalXp] = useState<number>(initialTotalXp);
  const [justLeveledUp, setJustLeveledUp] = useState<number | null>(null);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<PersistShape>;
        if (typeof saved.totalXp === 'number') setTotalXp(saved.totalXp);
        if (Array.isArray(saved.plants) && saved.plants.length) setPlants(saved.plants);
        if (Array.isArray(saved.tasks)) setTasks(saved.tasks);
      }
    } catch {
      /* corrupt or unavailable storage — fall back to seed data */
    }
  }, []);

  // Persist on change.
  useEffect(() => {
    try {
      const payload: PersistShape = { totalXp, plants, tasks };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [totalXp, plants, tasks]);

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
