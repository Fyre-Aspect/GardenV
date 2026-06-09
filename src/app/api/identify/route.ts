import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import type { TextIdentifyResult } from '@/lib/plant-ai';

// Text-only identification. Given a typed name/breed/species, Gemini decides
// whether it's specific enough to give accurate care info — or whether we need
// a photo (e.g. just "dog"). Runs server-side to keep the API key off the client.
export const runtime = 'nodejs';

const MODEL = 'gemini-2.5-flash';

function buildSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      confident: { type: Type.BOOLEAN },
      reason: { type: Type.STRING },
      kind: { type: Type.STRING, enum: ['plant', 'pet'] },
      commonName: { type: Type.STRING },
      species: { type: Type.STRING },
      status: { type: Type.STRING, enum: ['healthy', 'water', 'fertilize', 'light', 'feed'] },
      healthScore: { type: Type.INTEGER },
      summary: { type: Type.STRING },
      careTips: { type: Type.ARRAY, items: { type: Type.STRING } },
      light: { type: Type.STRING, enum: ['low', 'medium', 'bright'] },
      wateringIntervalDays: { type: Type.INTEGER },
      fertilizingIntervalDays: { type: Type.INTEGER },
    },
    required: [
      'confident',
      'reason',
      'kind',
      'commonName',
      'species',
      'status',
      'healthScore',
      'summary',
      'careTips',
      'light',
      'wateringIntervalDays',
      'fertilizingIntervalDays',
    ],
  };
}

const PROMPT = [
  'A user is cataloguing a plant or pet they own, by typing text only (no photo).',
  'Decide whether what they typed is SPECIFIC enough to give accurate care info.',
  'A generic word — e.g. "dog", "cat", "fish", "bird", "plant", "flower", "tree", "succulent", "herb" — is NOT specific enough: set confident=false and, in `reason`, briefly say a photo would help you identify it exactly and check its health.',
  'A specific species or breed — e.g. "Monstera deliciosa", "Golden Retriever", "Siamese cat", "Snake plant" — IS specific: set confident=true and fill in accurate care info.',
  'There is no photo, so you cannot assess current health: when confident, set status="healthy" and healthScore=85 (assume well).',
  'kind = "plant" or "pet". commonName = everyday name. species = scientific name (plant) or breed/animal (pet).',
  'careTips: 2–4 concise tips. light: a plant’s preferred light (use "medium" for pets).',
  'wateringIntervalDays: watering cadence (plant) or fresh-water (pet, ~1). fertilizingIntervalDays: feeding cadence.',
  'When not confident, still set kind as best you can and leave other fields as reasonable placeholders.',
].join('\n');

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Identification is not configured (missing GEMINI_API_KEY).' },
      { status: 500 }
    );
  }

  let name = '';
  let species = '';
  let kind = '';
  try {
    const body = await request.json();
    name = String(body.name ?? '');
    species = String(body.species ?? '');
    kind = String(body.kind ?? '');
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!name && !species) {
    return NextResponse.json({ error: 'Nothing to identify.' }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${PROMPT}\n\nUser input — name: "${name}", type/species: "${species}", chosen kind: "${kind}".`,
            },
          ],
        },
      ],
      config: { responseMimeType: 'application/json', responseSchema: buildSchema() },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json({ error: 'The model returned no result.' }, { status: 502 });
    }
    return NextResponse.json(JSON.parse(text) as TextIdentifyResult);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[api/identify] Gemini call failed', detail);
    const overloaded = /503|overload|UNAVAILABLE|high demand/i.test(detail);
    return NextResponse.json(
      { error: overloaded ? 'The identifier is busy. Try again in a moment.' : 'Identification failed.' },
      { status: overloaded ? 503 : 502 }
    );
  }
}
