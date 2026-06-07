import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import type { PlantScanResult } from '@/lib/plant-ai';

// Plant scanning runs server-side so the Gemini API key (GEMINI_API_KEY) stays
// out of the browser bundle. The client POSTs a base64 image; we ask Gemini to
// return strict JSON describing the plant.
export const runtime = 'nodejs';

const MODEL = 'gemini-2.5-flash';

/** Built lazily inside the handler so any SDK/enum issue is caught, not fatal. */
function buildSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      detected: { type: Type.BOOLEAN },
      kind: { type: Type.STRING, enum: ['plant', 'pet'] },
      commonName: { type: Type.STRING },
      species: { type: Type.STRING },
      healthScore: { type: Type.INTEGER },
      status: {
        type: Type.STRING,
        enum: ['healthy', 'water', 'fertilize', 'light', 'feed'],
      },
      summary: { type: Type.STRING },
      issues: { type: Type.ARRAY, items: { type: Type.STRING } },
      careTips: { type: Type.ARRAY, items: { type: Type.STRING } },
      light: { type: Type.STRING, enum: ['low', 'medium', 'bright'] },
      wateringIntervalDays: { type: Type.INTEGER },
      fertilizingIntervalDays: { type: Type.INTEGER },
    },
    required: [
      'detected',
      'kind',
      'commonName',
      'species',
      'healthScore',
      'status',
      'summary',
      'issues',
      'careTips',
      'light',
      'wateringIntervalDays',
      'fertilizingIntervalDays',
    ],
  };
}

const PROMPT = [
  'You are an expert botanist and veterinarian analysing a single photo of a plant OR a pet/animal.',
  'Identify the subject and assess its apparent health and care needs from what is visible.',
  'Respond ONLY with JSON matching the schema. Guidance:',
  '- detected: false if the image has no clear plant or pet; then use empty/zero values elsewhere.',
  '- kind: "plant" for plants, "pet" for animals/pets.',
  '- commonName: everyday name (e.g. "Monstera" or "Golden Retriever").',
  '- species: scientific name for a plant, or breed/animal for a pet; "Unknown" if unsure.',
  '- healthScore: 0–100, where 90+ is thriving and below 60 needs attention.',
  '- status: "healthy" if it looks good; otherwise the single most important action.',
  '  For PLANTS use one of: "water", "fertilize", "light".',
  '  For PETS use one of: "feed", "water".',
  '- summary: one warm, encouraging sentence the owner reads first.',
  '- issues: short phrases for visible problems (empty if healthy).',
  '- careTips: 2–4 concise, actionable care tips appropriate to a plant or pet.',
  '- light: light level a plant prefers; for pets just use "medium".',
  '- wateringIntervalDays: how often to water (plant) or refresh water (pet, usually 1).',
  '- fertilizingIntervalDays: feeding cadence — fertiliser for plants, meals for pets (e.g. 1).',
].join('\n');

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Plant scanning is not configured (missing GEMINI_API_KEY).' },
      { status: 500 }
    );
  }

  let image: string | undefined;
  let mimeType: string | undefined;
  try {
    const body = await request.json();
    image = body.image;
    mimeType = body.mimeType;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!image || !mimeType) {
    return NextResponse.json({ error: 'Missing image data.' }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: PROMPT }, { inlineData: { mimeType, data: image } }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: buildSchema(),
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json({ error: 'The model returned no result.' }, { status: 502 });
    }

    const parsed = JSON.parse(text) as PlantScanResult;
    return NextResponse.json(parsed);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[api/scan] Gemini call failed', detail);
    // 503 = model overloaded; tell the client it's worth retrying.
    const overloaded = /503|overload|UNAVAILABLE|high demand/i.test(detail);
    return NextResponse.json(
      {
        error: overloaded
          ? 'The plant scanner is busy right now. Please try again in a moment.'
          : 'The plant scan failed. Please try again.',
      },
      { status: overloaded ? 503 : 502 }
    );
  }
}
