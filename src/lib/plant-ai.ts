import type { LightLevel, PlantStatus } from '@/lib/data';

/**
 * Plant scanning client. The actual Gemini call happens server-side in
 * `src/app/api/scan/route.ts` (so the API key never reaches the browser); this
 * just POSTs the captured image there and returns the parsed result.
 */

export interface PlantScanResult {
  /** False when the photo doesn't contain a recognisable plant. */
  isPlant: boolean;
  commonName: string;
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
