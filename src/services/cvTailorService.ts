/**
 * Eclipse Valhalla — CV Tailor Service
 *
 * Uses the provider-agnostic AI system to rewrite a user's base CV so it
 * matches a specific job posting: reorders sections, reworks experience
 * bullets, emphasises relevant skills. Returns the tailored CV, a summary
 * of the key changes and a 0–100 match score.
 *
 * Facts are preserved — the prompt explicitly forbids inventing experience.
 */

import { ai } from '../ai';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface CVTailorInput {
  baseCV: string;          // user's generic CV text
  jobTitle: string;
  jobCompany: string;
  jobDescription: string;
  emphasize?: string;      // optional: skills to emphasise
}

export interface CVTailorResult {
  tailoredCV: string;
  keyChanges: string[];    // bullet points of what was changed/emphasised
  matchScore: number;      // 0–100 estimate
}

// ═══════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════

function buildPrompt(input: CVTailorInput): string {
  return `You are an expert career coach and resume writer. Tailor the following CV for a specific job posting.

CURRENT CV:
${input.baseCV}

TARGET JOB:
Company: ${input.jobCompany}
Position: ${input.jobTitle}
Description: ${input.jobDescription}
${input.emphasize ? `User wants to emphasize: ${input.emphasize}` : ''}

TASK:
1. Rewrite the CV to match this job — reorder sections, reword experience bullets, emphasize relevant skills
2. Keep the same facts (don't invent experience)
3. Use the same language as the original CV
4. Output JSON with this exact shape:
{
  "tailoredCV": "...full rewritten CV text...",
  "keyChanges": ["change 1", "change 2", "..."],
  "matchScore": 85
}

Return ONLY valid JSON, no markdown fences, no commentary.`;
}

// ═══════════════════════════════════════════
// JSON EXTRACTION
// ═══════════════════════════════════════════

/**
 * Strip markdown code fences if the model wrapped the JSON in them and
 * extract the first balanced JSON object. Defensive against slightly
 * malformed responses from different providers.
 */
function extractJsonPayload(raw: string): string {
  let text = raw.trim();

  // Strip ```json … ``` or ``` … ``` fences
  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // If there's still noise before/after, grab the first balanced {...}
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    text = text.slice(first, last + 1);
  }

  return text;
}

function clampScore(n: unknown): number {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Sends a structured prompt to the configured AI provider and returns a
 * parsed CVTailorResult. Throws a descriptive Error on provider failure
 * or unparseable output.
 */
export async function tailorCV(input: CVTailorInput): Promise<CVTailorResult> {
  if (!input.baseCV?.trim()) {
    throw new Error('Base CV is empty.');
  }
  if (!input.jobTitle?.trim() || !input.jobDescription?.trim()) {
    throw new Error('Job title and description are required.');
  }

  const prompt = buildPrompt(input);

  // Valhalla AI chain: ai.chat([{ role, content }], capability)
  const response = await ai.chat(
    [
      {
        role: 'system',
        content:
          'You are a precise JSON-only assistant. Always return valid JSON matching the requested shape.',
      },
      { role: 'user', content: prompt },
    ],
    'analysis',
  );

  const raw = response.content ?? '';
  if (!raw.trim()) {
    throw new Error('AI returned an empty response.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonPayload(raw));
  } catch {
    throw new Error('AI response was not valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI response had the wrong shape.');
  }

  const obj = parsed as Record<string, unknown>;
  const tailoredCV = typeof obj.tailoredCV === 'string' ? obj.tailoredCV.trim() : '';
  const rawChanges = Array.isArray(obj.keyChanges) ? obj.keyChanges : [];
  const keyChanges = rawChanges
    .map((c) => (typeof c === 'string' ? c.trim() : ''))
    .filter((c) => c.length > 0);
  const matchScore = clampScore(obj.matchScore);

  if (!tailoredCV) {
    throw new Error('AI response did not include a tailored CV.');
  }

  return { tailoredCV, keyChanges, matchScore };
}
