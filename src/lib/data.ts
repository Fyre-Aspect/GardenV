/**
 * Mock data + view-model types for the demo UI.
 *
 * These are intentionally lighter than the Firestore-facing shapes in
 * `src/types/plant.ts` (which carry Firebase `Timestamp`s). When the backend is
 * wired up, the garden provider can map Firestore docs onto these view models so
 * the components don't need to change.
 */

export type CareType = 'water' | 'fertilize' | 'light';
export type PlantStatus = 'healthy' | 'water' | 'fertilize' | 'light';
export type LightLevel = 'low' | 'medium' | 'bright';

export interface PlantVM {
  id: string;
  name: string;
  species: string;
  level: number;
  status: PlantStatus;
  healthScore: number; // 0–100
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  light: LightLevel;
}

export interface TaskVM {
  id: string;
  plantId: string;
  plantName: string;
  type: CareType;
  done: boolean;
  xp: number;
}

// ── Gamification constants ────────────────────────────────────────────────
export const STARTING_XP = 240;
export const STARTING_LEVEL = 4;
export const STARTING_STREAK = 7;

/** XP needed to advance from a given level. Gently scales so it always feels reachable. */
export function xpForLevel(level: number): number {
  return 200 + level * 50;
}

export interface Progress {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
}

/** Derive level + within-level progress from a single cumulative XP total. */
export function deriveProgress(totalXp: number): Progress {
  let level = 1;
  let into = Math.max(0, Math.floor(totalXp));
  while (into >= xpForLevel(level)) {
    into -= xpForLevel(level);
    level += 1;
  }
  return { level, xpIntoLevel: into, xpForNext: xpForLevel(level) };
}

/** Cumulative XP that corresponds to the starting level + within-level XP. */
export function initialTotalXp(): number {
  let total = STARTING_XP;
  for (let l = 1; l < STARTING_LEVEL; l++) total += xpForLevel(l);
  return total;
}

// ── Care metadata ─────────────────────────────────────────────────────────
export const CARE_META: Record<
  CareType,
  { verb: string; label: string; xp: number }
> = {
  water: { verb: 'Water', label: 'Watering', xp: 10 },
  fertilize: { verb: 'Fertilize', label: 'Feeding', xp: 20 },
  light: { verb: 'Move to light', label: 'Light', xp: 5 },
};

export const STATUS_META: Record<
  PlantStatus,
  { label: string; tone: string }
> = {
  healthy: { label: 'Healthy', tone: 'bg-accent text-accent-foreground' },
  water: { label: 'Needs water', tone: 'bg-secondary text-secondary-foreground' },
  fertilize: { label: 'Needs feeding', tone: 'bg-reward-soft text-reward-foreground' },
  light: { label: 'Needs light', tone: 'bg-muted text-muted-foreground' },
};

/** A care task maps 1:1 to the plant status it resolves. */
export const CARE_TO_STATUS: Record<CareType, PlantStatus> = {
  water: 'water',
  fertilize: 'fertilize',
  light: 'light',
};

// ── Avatar palette ────────────────────────────────────────────────────────
// Soft, muted tints. Each plant gets one stable colour (picked by name hash),
// so the set reads as calm and cohesive rather than a rainbow.
const AVATAR_TONES = [
  'bg-emerald-100 text-emerald-700',
  'bg-teal-100 text-teal-700',
  'bg-lime-100 text-lime-700',
  'bg-amber-100 text-amber-700',
  'bg-stone-200 text-stone-700',
  'bg-green-100 text-green-700',
];

export function avatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Seed data ─────────────────────────────────────────────────────────────
export const SEED_PLANTS: PlantVM[] = [
  {
    id: 'p1',
    name: 'Klaus',
    species: 'Monstera deliciosa',
    level: 8,
    status: 'water',
    healthScore: 86,
    wateringIntervalDays: 7,
    fertilizingIntervalDays: 30,
    light: 'medium',
  },
  {
    id: 'p2',
    name: 'Sandy',
    species: 'Cactus mix',
    level: 3,
    status: 'healthy',
    healthScore: 94,
    wateringIntervalDays: 21,
    fertilizingIntervalDays: 60,
    light: 'bright',
  },
  {
    id: 'p3',
    name: 'Lila',
    species: 'Peace Lily',
    level: 5,
    status: 'fertilize',
    healthScore: 78,
    wateringIntervalDays: 5,
    fertilizingIntervalDays: 21,
    light: 'low',
  },
  {
    id: 'p4',
    name: 'Frank',
    species: 'Fiddle Leaf Fig',
    level: 6,
    status: 'light',
    healthScore: 71,
    wateringIntervalDays: 9,
    fertilizingIntervalDays: 30,
    light: 'bright',
  },
];

export const SEED_TASKS: TaskVM[] = [
  { id: 't1', plantId: 'p1', plantName: 'Klaus', type: 'water', done: false, xp: CARE_META.water.xp },
  { id: 't2', plantId: 'p3', plantName: 'Lila', type: 'fertilize', done: false, xp: CARE_META.fertilize.xp },
  { id: 't3', plantId: 'p4', plantName: 'Frank', type: 'light', done: false, xp: CARE_META.light.xp },
];
