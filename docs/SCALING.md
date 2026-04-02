# Scaling

## Growth Stages

### Stage 1: 0 → 1,000 Users
**Current architecture handles this.**

- localStorage + Supabase Free tier
- Client-side ingestion
- Single Supabase project
- No infrastructure needed

### Stage 2: 1,000 → 10,000 Users

**Additions needed:**
- Supabase Pro plan ($25/mo)
- Self-hosted CORS proxy for RSS (Cloudflare Worker, ~$5/mo)
- Background ingestion via Supabase Edge Functions
- Database indexes audit
- Error tracking (Sentry)

**Architecture changes:**
```
Client RSS fetch → Move to Edge Function
localStorage news → IndexedDB
Sync → Optimistic with queue
```

### Stage 3: 10,000 → 100,000 Users

**Additions needed:**
- Dedicated Supabase instance or self-hosted
- News ingestion worker service (separate deployment)
- Redis for caching (news feed, user state)
- CDN for static assets
- Monitoring (Grafana/Datadog)

**Architecture changes:**
```
Ingestion: Client → Server-side workers (cron jobs)
Database: Connection pooling (PgBouncer)
News: Shared cache layer (many users, same sources)
Auth: Rate limiting middleware
```

### Stage 4: 100,000+ Users

**Full production infrastructure:**
- Kubernetes or serverless fleet for ingestion
- Message queue (Bull/BullMQ or SQS) for pipeline jobs
- Separate read/write databases
- Multi-region deployment
- AI proxy service (batch Gemini requests)
- Real-time sync via Supabase Realtime or custom WebSocket

## Component Scaling Map

| Component | Current | 10K | 100K |
|-----------|---------|-----|------|
| Ingestion | Client-side | Edge Functions | Worker fleet |
| Database | Supabase Free | Supabase Pro | Dedicated Postgres |
| Auth | Supabase Auth | Same | Same + rate limits |
| Storage | localStorage | IndexedDB + cloud | Cloud-first |
| AI | Direct Gemini | Same + caching | Proxy service |
| Notifications | Client push | Supabase triggers | Push service (FCM/APNs) |
| Sync | Polling | Realtime subscriptions | Custom sync engine |

## Cost Projections

| Users | Supabase | Infra | AI | Total/mo |
|-------|----------|-------|----|----------|
| 1K | Free | $5 | $0* | ~$5 |
| 10K | $25 | $50 | $50 | ~$125 |
| 100K | $400 | $500 | $300 | ~$1,200 |

*AI costs borne by users (own API keys) until server-side proxy.
