/**
 * Eclipse Valhalla — Content Processor
 *
 * Extracts structured information from raw content:
 * - Auto-generate summary if missing
 * - Extract image URLs
 * - Detect language
 * - Extract keywords for basic tagging
 */

import { NewsItem } from '../../../news/newsTypes';
import type { PipelineStage } from '../pipeline';

export const contentStage: PipelineStage = async (items, _ctx) => {
  return items.map(item => {
    const enhanced = { ...item };

    // Auto-generate summary from content if missing
    if (!enhanced.summary && enhanced.content) {
      enhanced.summary = extractSummary(enhanced.content);
    }

    // Extract image if missing
    if (!enhanced.imageUrl && enhanced.content) {
      enhanced.imageUrl = extractFirstImage(enhanced.content);
    }

    // Auto-tag from title + summary (basic keyword extraction)
    if (enhanced.tags.length === 0) {
      enhanced.tags = extractKeywords(enhanced.title + ' ' + enhanced.summary);
    }

    // Auto-detect category
    if (!enhanced.category) {
      enhanced.category = detectCategory(enhanced.title + ' ' + enhanced.summary + ' ' + enhanced.tags.join(' '));
    }

    return enhanced;
  });
};

// ═══════════════════════════════════════════
// SUMMARY EXTRACTION
// ═══════════════════════════════════════════

function extractSummary(content: string): string {
  // Strip HTML first
  const text = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Take first 2 sentences or 300 chars
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length >= 2) {
    return sentences.slice(0, 2).join(' ').trim().slice(0, 500);
  }
  return text.slice(0, 300);
}

// ═══════════════════════════════════════════
// IMAGE EXTRACTION
// ═══════════════════════════════════════════

function extractFirstImage(html: string): string | undefined {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1]) {
    const src = match[1];
    // Validate it's a real image URL
    if (src.startsWith('http') && /\.(jpg|jpeg|png|gif|webp|svg)/i.test(src)) {
      return src;
    }
    if (src.startsWith('http')) return src;
  }
  return undefined;
}

// ═══════════════════════════════════════════
// KEYWORD EXTRACTION (lightweight, no NLP)
// ═══════════════════════════════════════════

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either',
  'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than',
  'too', 'very', 'just', 'about', 'also', 'new', 'says', 'said',
  'it', 'its', 'this', 'that', 'these', 'those', 'i', 'he', 'she',
  'we', 'they', 'you', 'me', 'him', 'her', 'us', 'them', 'my', 'his',
  'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why',
  'и', 'в', 'на', 'с', 'по', 'из', 'за', 'от', 'до', 'не', 'но',
  'что', 'как', 'это', 'для', 'при', 'все', 'его', 'она', 'они',
]);

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));

  // Count frequency
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  // Return top 5 by frequency
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

// ═══════════════════════════════════════════
// CATEGORY DETECTION
// ═══════════════════════════════════════════

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  technology: ['tech', 'software', 'hardware', 'digital', 'app', 'startup', 'silicon', 'computer', 'device', 'gadget'],
  ai: ['ai', 'artificial', 'intelligence', 'machine', 'learning', 'neural', 'gpt', 'llm', 'model', 'chatbot', 'gemini', 'openai'],
  programming: ['code', 'programming', 'developer', 'javascript', 'python', 'rust', 'github', 'api', 'framework', 'library'],
  business: ['business', 'company', 'market', 'revenue', 'growth', 'profit', 'enterprise', 'ceo', 'startup', 'invest'],
  finance: ['finance', 'stock', 'bank', 'trading', 'investment', 'fund', 'dollar', 'economy', 'inflation', 'rate'],
  crypto: ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'token', 'defi', 'nft', 'web3', 'mining', 'wallet'],
  science: ['science', 'research', 'study', 'discovery', 'experiment', 'physics', 'chemistry', 'biology', 'space', 'nasa'],
  health: ['health', 'medical', 'doctor', 'hospital', 'disease', 'treatment', 'vaccine', 'mental', 'fitness', 'wellness'],
  world: ['war', 'politics', 'government', 'president', 'election', 'country', 'global', 'international', 'united', 'nations'],
  sports: ['sports', 'football', 'basketball', 'tennis', 'soccer', 'championship', 'olympic', 'league', 'match', 'game'],
  design: ['design', 'ui', 'ux', 'interface', 'typography', 'color', 'figma', 'creative', 'visual', 'brand'],
  entertainment: ['movie', 'film', 'music', 'artist', 'album', 'concert', 'entertainment', 'streaming', 'netflix', 'show'],
};

function detectCategory(text: string): string | undefined {
  const lower = text.toLowerCase();
  let bestCategory: string | undefined;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestScore >= 2 ? bestCategory : undefined;
}
