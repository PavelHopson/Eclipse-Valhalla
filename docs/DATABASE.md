# Database

## Engine
PostgreSQL via Supabase.

## Schema Files
- `SUPABASE_SCHEMA.sql` — Core tables (10)
- `SUPABASE_PHASE6_NEWS_PUSH.sql` — News + Push tables (4)

## Tables

| Table | Primary Key | Key Columns | RLS |
|-------|------------|-------------|-----|
| `profiles` | `id` (uuid, FK auth.users) | email, display_name, tier, locale | ✓ |
| `quests` | `id` (text) | user_id, title, status, priority, due_at, subtasks (JSONB) | ✓ |
| `notes` | `id` (text) | user_id, content, color, position, z_index | ✓ |
| `widget_configs` | `id` (text) | user_id, quest_id (nullable FK), type, position, locked | ✓ |
| `focus_sessions` | `id` (text) | user_id, quest_id (nullable), duration_sec, completed | ✓ |
| `gamification_profiles` | `user_id` (uuid) | xp, level, streak_days, discipline_score | ✓ |
| `notification_preferences` | `user_id` (uuid) | in_app, push, email, sms, escalation, quiet_hours | ✓ |
| `app_settings` | `user_id` (uuid) | accent_theme, reduced_motion, glow_intensity, locale | ✓ |
| `oracle_sessions` | `id` (text) | user_id, title | ✓ |
| `oracle_messages` | `id` (text) | session_id (FK), role, content | ✓ (via session) |
| `push_devices` | `id` (text) | user_id, platform, token, enabled | ✓ |
| `news_sources` | `id` (text) | user_id, name, type, url, categories (array), polling_interval | ✓ |
| `news_items` | `id` (text) | source_id (FK), user_id, title, importance_score, dedupe_key | ✓ |
| `news_preferences` | `user_id` (uuid) | preferred_topics (array), digest_frequency, min_importance | ✓ |

## Indexes

```sql
idx_quests_user_id      ON quests(user_id)
idx_quests_status       ON quests(user_id, status)
idx_news_items_user     ON news_items(user_id, archived, read)
idx_news_items_source   ON news_items(source_id)
idx_news_items_dedupe   ON news_items(dedupe_key)
```

## RLS Policy Pattern

All tables: `auth.uid() = user_id`

Oracle messages: join through session ownership:
```sql
session_id IN (SELECT id FROM oracle_sessions WHERE user_id = auth.uid())
```

## Auto-Updated Timestamps

Trigger `update_updated_at()` on: profiles, quests, notes, widget_configs, gamification_profiles, app_settings, oracle_sessions, news_sources, news_preferences, push_devices.

## Soft Delete

Quests use `archived_at` (timestamptz, nullable). Queries filter `WHERE archived_at IS NULL`.

## Scaling Considerations

- JSONB `subtasks` column: consider normalizing if subtasks exceed 100 per quest
- `news_items`: partition by user_id or date if exceeding 1M rows
- Add `read` index on news_items for unread-count queries
- Consider materialized view for discipline_score computation
