# Nexus Intelligence System

Backend-driven news ingestion and ranking pipeline.

---

## Pipeline

```
SOURCE → FETCH → CLEAN → NORMALIZE → CONTENT → ENRICH → DEDUPE → RANK → STORE
```

### Stages

| Stage | File | Purpose |
|-------|------|---------|
| Fetch | `jobs/fetchJob.ts` | Adapter dispatch, 15s timeout |
| Clean | `processors/cleanProcessor.ts` | Strip HTML, decode entities |
| Normalize | `processors/normalizeProcessor.ts` | Fix dates, generate IDs, compute dedupe keys |
| Content | `processors/contentProcessor.ts` | Auto-summary, image extraction, keyword tagging, category detection |
| Enrich | `jobs/enrichJob.ts` | Gemini AI: summary, tags, category, importance |
| Dedupe | `jobs/dedupeJob.ts` | Exact key + URL + Jaccard similarity (>0.85) |
| Rank | `jobs/rankJob.ts` | 6-factor scoring (0-100) |

### Ranking Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Recency | 30 | Decay over 48 hours |
| Topic match | 25 | User preferred topics |
| Source priority | 15 | Source specificity |
| Cross-mention | 15 | Same story across sources |
| Category boost | 10 | Preferred category |
| Muted penalty | -50 | Muted topic detected |

---

## Source Adapters

| Adapter | Strategy |
|---------|----------|
| RSS | rss2json API → XML fallback via CORS proxy |
| Telegram | RSShub bridge → RSS adapter |
| Website | Probe 8 common feed paths → detect `<link>` in HTML → RSS fallback |

### Adding a new adapter

```typescript
// 1. Create: src/backend/ingestion/adapters/myAdapter.ts
export async function fetchMySource(source, userId): Promise<NewsItem[]> { ... }

// 2. Register in fetchJob.ts:
case 'my_type': return fetchMySource(source, userId);

// 3. Add type to newsTypes.ts:
export type SourceType = 'rss' | 'telegram' | 'website' | 'my_type';
```

Pipeline stages handle the rest automatically.

---

## News → Quest

```typescript
convertNewsToQuest(item, userId)
// Returns: { title, description, priority, category, dueAt }
// Priority inferred from importanceScore
// Due: tomorrow 6pm default
```
