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
export type CareType = 'water' | 'fertilize' | 'light' | 'feed';
export type PlantStatus = 'healthy' | 'water' | 'fertilize' | 'light' | 'feed';
export type LightLevel = 'low' | 'medium' | 'bright';

export interface PlantVM {
  id: string;
  name: string;
  species: string;
  kind: Kind;
  /** Display level for this week, derived from `weeklyXp` (see `plantLevel`). */
  level: number;
  /** XP this companion has earned toward its level this week (resets Mondays). */
  weeklyXp?: number;
  /** weekKey the `weeklyXp` belongs to; a mismatch means it has reset to 0. */
  levelWeek?: string;
  status: PlantStatus;
  healthScore: number; // 0–100
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  light: LightLevel;
  /** Epoch-ms of the last time each care action was performed (drives cooldowns). */
  lastCare?: Partial<Record<CareType, number>>;
  /** User-assigned photo (downscaled data URL) for extra context on the card. */
  photoUrl?: string;
  /**
   * weekKey of the last photo health check. Health is judged only from these
   * check-ins — never from watering/feeding — and one is prompted each week.
   */
  lastHealthCheckWeek?: string;
}

/** Kindred cares for plants *and* pets; `CompanionVM` reads better for pets. */
export type CompanionVM = PlantVM;

export interface TaskVM {
  id: string;
  plantId: string;
  plantName: string;
  type: CareType;
  done: boolean;
  xp: number;
}

// ── Plant leveling (per-plant, resets every week) ──────────────────────────
// XP no longer belongs to the user. Each plant or pet earns XP from the care
// you give it and levels up on its own — but only while it's thriving. Care for
// a neglected (< 90% health) companion still keeps your streak, it just doesn't
// move its level. Levels reset every Monday so each week is a fresh race.

/** A companion must be at least this healthy for care to count toward leveling. */
export const HEALTHY_LEVEL_MIN = 90;

/** XP to advance a plant from `level` to the next. Gentle so a week of care climbs a few. */
export function plantXpForLevel(level: number): number {
  return 40 + level * 20;
}

export interface PlantProgress {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
}

/** Derive a plant's level + within-level progress from its XP earned this week. */
export function plantProgress(weeklyXp: number): PlantProgress {
  let level = 1;
  let into = Math.max(0, Math.floor(weeklyXp));
  while (into >= plantXpForLevel(level)) {
    into -= plantXpForLevel(level);
    level += 1;
  }
  return { level, xpIntoLevel: into, xpForNext: plantXpForLevel(level) };
}

/** A plant's current level from its XP earned this week. */
export function plantLevel(weeklyXp: number): number {
  return plantProgress(weeklyXp).level;
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
};

/** A care task maps 1:1 to the status it resolves. */
export const CARE_TO_STATUS: Record<CareType, PlantStatus> = {
  water: 'water',
  fertilize: 'fertilize',
  light: 'light',
  feed: 'feed',
};

// ── Kinds & per-kind care ──────────────────────────────────────────────────
export const KIND_META: Record<Kind, { label: string; noun: string }> = {
  plant: { label: 'Plant', noun: 'plant' },
  pet: { label: 'Pet', noun: 'pet' },
};

/** Care actions each kind supports — drives the detail-view action buttons. */
export const CARE_ACTIONS_BY_KIND: Record<Kind, CareType[]> = {
  plant: ['water', 'fertilize'],
  pet: ['feed', 'water'],
};

/** Care actions that play a skill mini-game (the rest are instant taps). */
export const MINIGAME_CARE: Record<CareType, 'water' | 'food' | null> = {
  water: 'water',
  fertilize: 'food',
  feed: 'food',
  light: null,
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

// ── Leaderboards (rivals) ──────────────────────────────────────────────────
// Two side boards. The streak board ranks people by their daily streak; the
// plant board ranks individual companions by the level they've reached this
// week. Both are seeded with fixed rival players so a new gardener starts near
// the bottom and can climb past them with consistent care.

/** A rival on the streak board. Streaks are fixed and high so you start last. */
export interface RivalStreak {
  id: string;
  name: string;
  streak: number;
}

export const FAKE_STREAK_PLAYERS: RivalStreak[] = [
  { id: 'rival-parth', name: 'Parth.P', streak: 47 },
  { id: 'rival-ishaan', name: 'Ishaan.D', streak: 33 },
  { id: 'rival-arnav', name: 'Arnav.M', streak: 21 },
  { id: 'rival-jeevithan', name: 'Jeevithan', streak: 12 },
];

/** A rival companion on the weekly plant-level board. Beatable in a diligent week. */
export interface RivalPlant {
  id: string;
  owner: string;
  name: string;
  kind: Kind;
  level: number;
}

export const FAKE_PLANT_PLAYERS: RivalPlant[] = [
  { id: 'rplant-parth', owner: 'Parth.P', name: 'Monstera', kind: 'plant', level: 13 },
  { id: 'rplant-ishaan', owner: 'Ishaan.D', name: 'Biscuit', kind: 'pet', level: 10 },
  { id: 'rplant-arnav', owner: 'Arnav.M', name: 'Fiddle Fig', kind: 'plant', level: 7 },
  { id: 'rplant-jeevithan', owner: 'Jeevithan', name: 'Aloe', kind: 'plant', level: 4 },
];

// ── Streak & week helpers ───────────────────────────────────────────────────
/** Local YYYY-MM-DD key for a date. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Key for the Monday-started week a date falls in (used to reset weekly XP). */
export function weekKey(d: Date = new Date()): string {
  const date = new Date(d);
  const offset = (date.getDay() + 6) % 7; // Mon = 0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offset);
  return dayKey(date);
}

/** Streak milestones worth a celebration. */
export const STREAK_MILESTONES = [3, 7, 10, 14, 30, 50, 100, 200, 365];

export function isStreakMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak);
}

/**
 * Next streak value given the last active day. Same day → unchanged; yesterday
 * → +1; any larger gap (or first ever) → reset to 1.
 */
export function nextStreak(prevStreak: number, lastActiveDay: string | undefined, today = dayKey()): number {
  if (lastActiveDay === today) return prevStreak || 1;
  const yesterday = dayKey(new Date(Date.now() - 86_400_000));
  if (lastActiveDay === yesterday) return prevStreak + 1;
  return 1;
}

// ── Daily care needs (exact amounts) ────────────────────────────────────────
// Care is purely for in-app progress (XP, streaks) — it never moves a
// companion's health. Health comes only from the weekly photo check below.

/** Days between performing a given care action (0 if the companion never needs it). */
export function careIntervalDays(plant: PlantVM, type: CareType): number {
  if (type === 'water') return plant.wateringIntervalDays;
  if (type === 'fertilize' || type === 'feed') return plant.fertilizingIntervalDays;
  return 0;
}

/**
 * Whole days until `type` is next due. `0` or negative means it's needed today
 * (negative = overdue); `Infinity` for actions a companion doesn't schedule.
 */
export function careDueInDays(plant: PlantVM, type: CareType, now: number = Date.now()): number {
  const interval = careIntervalDays(plant, type);
  if (!interval) return Infinity;
  const last = plant.lastCare?.[type];
  if (!last) return 0; // never done → due now
  const elapsedDays = (now - last) / 86_400_000;
  return Math.ceil(interval - elapsedDays);
}

/** The exact amount to give for a care action, phrased for the companion's kind. */
export function careAmount(plant: PlantVM, type: CareType): string {
  switch (type) {
    case 'water': {
      const ml = plant.kind === 'pet' ? 400 : plant.light === 'bright' ? 300 : 200;
      return `about ${ml} ml of water`;
    }
    case 'feed':
      return '1 full portion';
    case 'fertilize':
      return 'a half-strength dose of feed';
    case 'light':
      return 'a few hours of bright, indirect light';
  }
}

export interface CareNeed {
  type: CareType;
  /** ≤ 0 means needed today. */
  dueInDays: number;
  /** Exact amount to give, e.g. "about 200 ml of water". */
  amount: string;
}

/** Today's full care plan for a companion: what to do, how much, and when. */
export function dailyCareNeeds(plant: PlantVM, now: number = Date.now()): CareNeed[] {
  return CARE_ACTIONS_BY_KIND[plant.kind ?? 'plant'].map((type) => ({
    type,
    dueInDays: careDueInDays(plant, type, now),
    amount: careAmount(plant, type),
  }));
}

// ── Weekly photo health check ───────────────────────────────────────────────
/**
 * A photo health check is due once per week (Monday-started, matching the
 * weekly level reset). Until one is taken, the companion's health is treated as
 * unknown and the user is nudged to snap a fresh photo.
 */
export function healthCheckDue(plant: PlantVM, now: Date = new Date()): boolean {
  return plant.lastHealthCheckWeek !== weekKey(now);
}
