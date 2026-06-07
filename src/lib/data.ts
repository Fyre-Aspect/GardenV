/**
 * Mock data + view-model types for the demo UI.
 *
 * These are intentionally lighter than the Firestore-facing shapes in
 * `src/types/plant.ts` (which carry Firebase `Timestamp`s). When the backend is
 * wired up, the garden provider can map Firestore docs onto these view models so
 * the components don't need to change.
 */

/** A cared-for living thing is either a plant or a pet. */
export type Kind = 'plant' | 'pet';
export type CareType = 'water' | 'fertilize' | 'light' | 'feed' | 'play';
export type PlantStatus = 'healthy' | 'water' | 'fertilize' | 'light' | 'feed' | 'play';
export type LightLevel = 'low' | 'medium' | 'bright';

export interface PlantVM {
  id: string;
  name: string;
  species: string;
  kind: Kind;
  level: number;
  status: PlantStatus;
  healthScore: number; // 0–100
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  light: LightLevel;
  /** Epoch-ms of the last time each care action was performed (drives cooldowns). */
  lastCare?: Partial<Record<CareType, number>>;
}

/** Garden V cares for plants *and* pets; `CompanionVM` reads better for pets. */
export type CompanionVM = PlantVM;

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
  feed: { verb: 'Feed', label: 'Feeding', xp: 15 },
  play: { verb: 'Play with', label: 'Play', xp: 15 },
};

export const STATUS_META: Record<
  PlantStatus,
  { label: string; tone: string }
> = {
  healthy: { label: 'Healthy', tone: 'bg-accent text-accent-foreground' },
  water: { label: 'Needs water', tone: 'bg-secondary text-secondary-foreground' },
  fertilize: { label: 'Needs feeding', tone: 'bg-reward-soft text-reward-foreground' },
  light: { label: 'Needs light', tone: 'bg-muted text-muted-foreground' },
  feed: { label: 'Hungry', tone: 'bg-reward-soft text-reward-foreground' },
  play: { label: 'Wants to play', tone: 'bg-secondary text-secondary-foreground' },
};

/** A care task maps 1:1 to the status it resolves. */
export const CARE_TO_STATUS: Record<CareType, PlantStatus> = {
  water: 'water',
  fertilize: 'fertilize',
  light: 'light',
  feed: 'feed',
  play: 'play',
};

// ── Kinds & per-kind care ──────────────────────────────────────────────────
export const KIND_META: Record<Kind, { label: string; noun: string }> = {
  plant: { label: 'Plant', noun: 'plant' },
  pet: { label: 'Pet', noun: 'pet' },
};

/** Care actions each kind supports — drives the detail-view action buttons. */
export const CARE_ACTIONS_BY_KIND: Record<Kind, CareType[]> = {
  plant: ['water', 'fertilize'],
  pet: ['feed', 'water', 'play'],
};

/**
 * Caring again within this window counts as "overdoing it" and is blocked — a
 * short, forgiving cooldown rather than a hard per-schedule lock.
 */
export const CARE_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

/** Remaining cooldown (ms) before `type` may be performed on a companion again. */
export function careCooldownRemaining(
  companion: Pick<PlantVM, 'lastCare'>,
  type: CareType,
  now: number = Date.now()
): number {
  const last = companion.lastCare?.[type];
  if (!last) return 0;
  return Math.max(0, CARE_COOLDOWN_MS - (now - last));
}

/** Compact remaining-cooldown label, e.g. "5h" or "12m". */
export function formatCooldown(ms: number): string {
  const mins = Math.ceil(ms / 60000);
  return mins >= 60 ? `${Math.ceil(mins / 60)}h` : `${mins}m`;
}

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
