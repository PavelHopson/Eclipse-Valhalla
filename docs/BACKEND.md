# Backend

## Stack

- **Supabase**: Auth, Postgres, RLS, Realtime (ready)
- **Client**: `@supabase/supabase-js` with graceful fallback
- **Pattern**: Repository layer abstracts all DB access

## Client Initialization

```typescript
// Returns null if env vars not set (local-only mode)
const client = getSupabase();
```

Environment:
```
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Without these: app runs in guest mode, all data in localStorage.

## Repository Layer

| Repository | Entities | Operations |
|-----------|----------|------------|
| `questRepository` | Quests | getLocal, saveLocal, fetchCloud, upsertCloud, deleteCloud (soft), syncPull, syncPush |
| `userRepository` | Profiles | getLocal, saveLocal, fetchCloud, upsertCloud |
| `gamificationRepository` | Discipline | getLocal, saveLocal, fetchCloud, upsertCloud, sync |
| `settingsRepository` | App settings | getLocal, saveLocal, fetchCloud, upsertCloud |
| `newsRepository` | Sources, items, prefs | Local + cloud dual-layer, ingestion adapter factory |
| `pushRepository` | Push devices | registerCloud, unregisterCloud, getActive |

### Pattern

Every repository follows dual-layer:
```
Read:  localStorage (instant) → Supabase sync (background)
Write: localStorage (instant) → Supabase push (async, fire-and-forget)
```

## Ingestion Backend

```
src/backend/ingestion/
├── pipeline.ts           Stage runner, composable
├── scheduler.ts          Per-source interval scheduling
├── ingestionService.ts   Orchestrator: init, runSource, runAll
├── jobs/                 fetch, dedupe, rank, enrich
├── adapters/             RSS, Telegram, Website
└── processors/           clean, normalize, content
```

The ingestion service accepts a pluggable `IngestionStorage` adapter — currently backed by localStorage + Supabase, but replaceable with any backend.

## Mappers

Convert between domain entities and Supabase row format:
```
questMapper:        fromRow, toInsert, fromLegacyReminder
noteMapper:         fromRow, toInsert, fromLegacyNote
gamificationMapper: fromRow, toRow
```

## Auth

- Guest mode: local-only, no cloud
- Cloud mode: Supabase Auth (email/password)
- Session persistence: Supabase handles via localStorage
- `initAuth()`: restores session → cloud profile → legacy session → guest

## Migration

`migrationService.ts` handles local → cloud data transfer:
1. Detect local data (scan localStorage keys)
2. Export as domain entities (with legacy format conversion)
3. Push to cloud (with merge strategy: local_wins / cloud_wins / newest_wins)
4. One-time flag prevents re-migration
