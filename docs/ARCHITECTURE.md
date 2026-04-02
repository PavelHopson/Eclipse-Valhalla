# Architecture

Eclipse Valhalla system design.

---

## Principle

```
Local-first. Cloud-synced. Pipeline-driven. AI-augmented.
```

Every interaction follows:

```
Signal → Processing → Storage → UI → Action
```

---

## Layer Model

```
┌────────────────────────────────────────────┐
│  PRESENTATION                              │
│  React components · Design system · Brand  │
├────────────────────────────────────────────┤
│  APPLICATION                               │
│  Services · Context · State (Zustand)      │
├────────────────────────────────────────────┤
│  DOMAIN                                    │
│  Entities · Types · Business rules         │
├────────────────────────────────────────────┤
│  INFRASTRUCTURE                            │
│  Repositories · Supabase · localStorage    │
│  Ingestion pipeline · Adapters             │
├────────────────────────────────────────────┤
│  PLATFORM                                  │
│  Electron · Capacitor · Service Worker     │
└────────────────────────────────────────────┘
```

---

## Data Flow

### Quest Lifecycle

```
User creates quest
  → storageService saves to localStorage
  → syncService pushes to Supabase (if signed in)
  → widgetManager evaluates auto-spawn rules
  → notificationService schedules escalation
  → gamificationService awards XP on completion
```

### Nexus Intelligence

```
Source configured by user
  → scheduler triggers fetchJob
  → adapter fetches raw data (RSS/Telegram/Website)
  → pipeline: clean → normalize → content → enrich → dedupe → rank
  → newsRepository stores items
  → UI reads from local cache
  → cloud sync (async)
```

### Oracle Interaction

```
User sends message
  → oracleService builds context (quests, stats, history)
  → Gemini API processes with system prompt
  → response rendered in OracleView
  → optional: Oracle suggests quests from analysis
```

---

## Module Boundaries

| Module | Owns | Does NOT own |
|--------|------|-------------|
| `backend/` | Supabase, repos, ingestion pipeline | UI rendering |
| `services/` | Business logic, state management | Database access (uses repos) |
| `components/` | React UI, user interaction | Business logic |
| `widgets/` | Widget state, drag engine | Network requests |
| `news/` | Frontend news API | RSS parsing (delegated to ingestion) |
| `brand/` | Visual motifs, sigils | Component logic |
| `design/` | Tokens, theme, motion | Content |

---

## Security Model

- **Client**: Only Supabase anon key (public)
- **Auth**: Supabase Auth with session persistence
- **RLS**: All tables enforce `user_id = auth.uid()`
- **Tier**: Stored in `profiles.tier`, validated server-side
- **Secrets**: Never in client bundle. API keys via env or Settings UI
- **Electron**: `contextIsolation: true`, no `nodeIntegration`
