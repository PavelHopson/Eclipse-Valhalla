/**
 * Eclipse Valhalla — Enrich Job
 *
 * AI-powered enrichment using Gemini.
 * Generates: summary, tags, category, importance estimate.
 * Graceful fallback when AI is unavailable.
 */

import { NewsItem } from '../../../news/newsTypes';
import type { PipelineStage } from '../pipeline';

export const enrichStage: PipelineStage = async (items, ctx) => {
  if (!ctx.aiAvailable) {
    // No AI — use content processor results as-is
    return items;
  }

  // Enrich in batches of 5 to avoid rate limits
  const enriched: NewsItem[] = [];
  const batchSize = 5;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(item => enrichSingleItem(item))
    );

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        enriched.push(result.value);
      } else {
        enriched.push(batch[idx]); // Keep original on failure
      }
    });
  }

  return enriched;
};

/**
 * Enrich a single news item with AI.
 */
async function enrichSingleItem(item: NewsItem): Promise<NewsItem> {
  let apiKey = '';
  try {
    const providers = JSON.parse(localStorage.getItem('eclipse_ai_providers') || '[]');
    const gemini = providers.find((p: any) => p.type === 'gemini' && p.enabled);
    if (gemini) apiKey = gemini.apiKey;
  } catch {}
  if (!apiKey) return item;

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Analyze this news article and respond in JSON format only.

Title: "${item.title}"
Content: "${(item.summary || item.content).slice(0, 1000)}"

Respond with exactly this JSON structure:
{
  "summary": "2-3 sentence summary",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "one of: technology, ai, programming, business, finance, crypto, science, health, world, sports, design, entertainment",
  "importance": 50
}

importance is 0-100 based on: impact, urgency, novelty, relevance to tech/business professionals.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-20',
      contents: [{ parts: [{ text: prompt }] }],
    });

    const text = response.text || '';
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        ...item,
        aiSummary: parsed.summary || item.summary,
        aiTags: Array.isArray(parsed.tags) ? parsed.tags : item.tags,
        category: parsed.category || item.category,
        importanceScore: typeof parsed.importance === 'number'
          ? Math.max(0, Math.min(100, parsed.importance))
          : item.importanceScore,
      };
    }
  } catch (e) {
    console.warn('[Enrich] AI enrichment failed for:', item.title, e);
  }

  return item;
}

/**
 * Check if AI enrichment is available.
 */
export function isAIAvailable(): boolean {
  try {
    const providers = JSON.parse(localStorage.getItem('eclipse_ai_providers') || '[]');
    return providers.some((p: any) => p.type === 'gemini' && p.enabled && p.apiKey);
  } catch {
    return false;
  }
}
