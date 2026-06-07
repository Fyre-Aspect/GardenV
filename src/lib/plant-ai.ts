import type { Kind, LightLevel, PlantStatus } from '@/lib/data';

/** Result of identifying a companion from typed text (no photo). */
export interface TextIdentifyResult {
  /** True when the typed text is specific enough for accurate care info. */
  confident: boolean;
  /** Why a photo is (or isn't) needed — shown to the user when not confident. */
  reason: string;
  kind: Kind;
  commonName: string;
  species: string;
  status: PlantStatus;
  healthScore: number;
  summary: string;
  careTips: string[];
  light: LightLevel;
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
}

/**
 * Companion scanning client. The actual Gemini call happens server-side in
 * `src/app/api/scan/route.ts` (so the API key never reaches the browser); this
 * just POSTs the captured image there and returns the parsed result. Works for
 * both plants and pets.
 */

export interface PlantScanResult {
  /** False when the photo contains no recognisable plant or pet. */
  detected: boolean;
  /** Whether the subject is a plant or a pet. */
  kind: Kind;
  commonName: string;
  /** Scientific name (plant) or breed/animal (pet). */
  species: string;
  /** 0–100. */
  healthScore: number;
  status: PlantStatus;
  /** A short, friendly one-liner summarising the finding. */
  summary: string;
  issues: string[];
  careTips: string[];
  light: LightLevel;
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
}

/**
 * Analyse a plant photo. `base64` must be the raw base64 (no data-URL prefix).
 * Throws with a friendly message if the scan fails — callers should surface it
 * and offer a retry.
 */
export async function scanPlant(
  base64: string,
  mimeType: string
): Promise<PlantScanResult> {
  const res = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ image: base64, mimeType }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `Scan failed (${res.status})`);
  }

  return (await res.json()) as PlantScanResult;
}

/**
 * Identify a companion from typed text. Returns `confident: false` when the
 * input is too vague (e.g. just "dog") and a photo would help.
 */
export async function identifyByText(
  name: string,
  species: string,
  kind: Kind
): Promise<TextIdentifyResult> {
  const res = await fetch('/api/identify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, species, kind }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `Identification failed (${res.status})`);
  }

  return (await res.json()) as TextIdentifyResult;
}
