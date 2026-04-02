# Intelligence Engine (Nexus)

## Pipeline Architecture

```
Source → Adapter → FETCH → CLEAN → NORMALIZE → CONTENT → ENRICH → DEDUPE → RANK → STORE
```

### Stage Details

| # | Stage | File | Input | Output | Key Logic |
|---|-------|------|-------|--------|-----------|
| 1 | Fetch | `fetchJob.ts` | Source config | Raw items | Adapter dispatch, 15s timeout |
| 2 | Clean | `cleanProcessor.ts` | Raw items | Cleaned items | Strip HTML/scripts, decode entities, normalize whitespace |
| 3 | Normalize | `normalizeProcessor.ts` | Cleaned items | Normalized items | Validate fields, fix dates, generate IDs, strip UTM params, compute dedupe keys |
| 4 | Content | `contentProcessor.ts` | Normalized items | Enriched items | Auto-summary (first 2 sentences), image extraction, keyword extraction (120+ stop words), category detection (13 categories) |
| 5 | Enrich | `enrichJob.ts` | Items | AI-enriched items | Gemini: summary + tags + category + importance. Batch of 5. Graceful fallback |
| 6 | Dedupe | `dedupeJob.ts` | All items | Unique items | Exact key, exact URL, Jaccard trigram similarity >0.85, against existing DB |
| 7 | Rank | `rankJob.ts` | Unique items | Scored items | 6-factor weighted scoring (0-100) |
| 8 | Store | `ingestionService.ts` | Scored items | Persisted | Merge with existing, cap at 500, localStorage + async Supabase |

### Ranking Formula

```
Score = Recency(30) + TopicMatch(25) + SourcePriority(15) + CrossMention(15) + CategoryBoost(10) + MutedPenalty(-50)
```

| Factor | Weight | Calculation |
|--------|--------|-------------|
| Recency | 30 | Linear decay over 48 hours |
| Topic Match | 25 | User preferred topics ∩ item tags |
| Source Priority | 15 | Source category specificity (0-3 categories) |
| Cross-Mention | 15 | Same dedupeKey across multiple sources |
| Category Boost | 10 | Item category ∈ preferred topics |
| Muted Penalty | -50 | Item tags ∩ muted topics |

## Adapters

| Adapter | Primary Strategy | Fallback |
|---------|-----------------|----------|
| RSS | rss2json API (JSON) | CORS proxy → DOMParser (XML) |
| Telegram | RSShub bridge → RSS | Backend integration (future) |
| Website | Probe 8 common paths | Detect `<link>` in HTML → RSS |

### Website Feed Discovery Paths
```
/feed, /rss, /rss.xml, /atom.xml, /feed.xml,
/feeds/posts/default, /index.xml, /?feed=rss2
```

## Adding a Source Adapter

```typescript
// 1. Create adapter: src/backend/ingestion/adapters/myAdapter.ts
export async function fetchMySource(source: NewsSource, userId: string): Promise<NewsItem[]> {
  // Fetch and return raw NewsItem[]
}

// 2. Register in fetchJob.ts:
case 'my_type': return fetchMySource(source, userId);

// 3. Add type: newsTypes.ts
export type SourceType = 'rss' | 'telegram' | 'website' | 'my_type';
```

Pipeline stages (clean → normalize → content → enrich → dedupe → rank) handle the rest.

## Scheduler

- Default interval: 10 minutes
- Per-source configurable (`pollingIntervalMin`)
- Max concurrent fetches: 3
- Pauses when previous cycle still running
- Error count tracking per source

## Category Detection

13 categories, each with 10 keyword signals:
```
technology, ai, programming, business, finance, crypto,
science, health, world, sports, design, entertainment
```

Minimum 2 keyword matches required for classification.
