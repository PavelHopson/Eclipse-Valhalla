/**
 * Eclipse Valhalla — Clean Processor
 *
 * Strips HTML, removes junk, normalizes whitespace.
 */

import { NewsItem } from '../../../news/newsTypes';
import type { PipelineContext, PipelineStage } from '../pipeline';

export const cleanStage: PipelineStage = async (items, _ctx) => {
  return items.map(item => ({
    ...item,
    title: cleanText(stripHTML(item.title)),
    summary: cleanText(stripHTML(item.summary)).slice(0, 500),
    content: cleanContent(item.content),
    tags: item.tags.map(t => t.toLowerCase().trim()).filter(Boolean),
  }));
};

function stripHTML(html: string): string {
  if (!html) return '';
  // Server-safe: regex-based for environments without DOM
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}

function cleanContent(content: string): string {
  if (!content) return '';
  // Keep some structure but remove scripts/styles
  return content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\s{3,}/g, '\n\n')
    .trim();
}
