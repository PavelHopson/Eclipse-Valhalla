# Security

## Authentication

| Aspect | Implementation |
|--------|---------------|
| Provider | Supabase Auth |
| Methods | Email/password. Magic link ready. Social auth architecture ready. |
| Session | Supabase-managed, stored in localStorage, auto-refresh |
| Guest mode | No auth required. Local data only. |
| Sign-out | Non-destructive. Local data preserved. Cloud session cleared. |

## Data Isolation

**Row Level Security (RLS)** on every table:
```sql
CREATE POLICY "Users can CRUD own data"
  ON public.quests FOR ALL USING (auth.uid() = user_id);
```

No user can read, write, or delete another user's data. Enforced at database level regardless of client code.

## Client Security

| Rule | Implementation |
|------|---------------|
| No secrets in client | Only Supabase anon key (public by design) |
| Gemini API key | User-provided, stored in localStorage, never sent to our backend |
| Electron isolation | `contextIsolation: true`, `nodeIntegration: false` |
| Preload bridge | 15 whitelisted methods via `contextBridge` |
| No eval | Content Security Policy compatible |

## Tier Enforcement

**Client-side tier is for UI rendering only.** Critical enforcement:

```
Client: subscriptionService.canUseFeature('X') → show/hide UI
Server: RLS + profiles.tier → actual data access control
```

For true enforcement: Supabase Edge Functions or RLS policies that check `profiles.tier`.

## Data at Rest

- localStorage: unencrypted (browser standard). Acceptable for non-sensitive data.
- Supabase: encrypted at rest by default (AWS infrastructure).
- Passwords: never stored client-side. Supabase Auth handles hashing.

## Known Risks & Mitigations

| Risk | Status | Mitigation |
|------|--------|------------|
| localStorage readable by same-origin | Accepted | No PII beyond email. Sensitive data in Supabase. |
| Gemini API key in localStorage | Accepted | User's own key. Warning in Settings UI. |
| Client-side tier bypass | Known | UI-only gating currently. Server-side enforcement needed for billing. |
| CORS proxy for RSS | Accepted | Third-party proxies (rss2json, allorigins). Consider self-hosted proxy. |
| No rate limiting on frontend | Known | Rely on Supabase rate limits. Add middleware for production. |

## Recommendations for Production

1. **Supabase Edge Functions** for: tier validation, Stripe webhooks, referral acceptance
2. **Self-hosted CORS proxy** to avoid third-party dependency for RSS
3. **Content Security Policy** headers for web deployment
4. **Supabase RLS audit** before public launch
5. **Error tracking** (Sentry) — currently architecture-ready via logService
