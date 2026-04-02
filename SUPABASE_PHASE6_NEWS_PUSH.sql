-- ══════════════════════════════════════════════════
-- Eclipse Valhalla — Phase 6 Schema Extension
-- Push Devices + Nexus News Intelligence
-- ══════════════════════════════════════════════════

-- ─── PUSH DEVICES ─────────────────────────────────
create table if not exists public.push_devices (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null,
  token text not null,
  app_version text not null default '2.0.0',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.push_devices enable row level security;
create policy "Users manage own devices"
  on public.push_devices for all using (auth.uid() = user_id);

-- ─── NEWS SOURCES ─────────────────────────────────
create table if not exists public.news_sources (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('rss', 'telegram', 'website')),
  url text not null,
  enabled boolean not null default true,
  categories text[] not null default '{}',
  polling_interval_min integer not null default 30,
  last_fetched_at timestamptz,
  error_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news_sources enable row level security;
create policy "Users manage own sources"
  on public.news_sources for all using (auth.uid() = user_id);

-- ─── NEWS ITEMS ───────────────────────────────────
create table if not exists public.news_items (
  id text primary key,
  source_id text not null references public.news_sources(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  summary text not null default '',
  content text not null default '',
  url text not null default '',
  image_url text,
  published_at timestamptz not null,
  fetched_at timestamptz not null default now(),
  tags text[] not null default '{}',
  category text,
  importance_score integer not null default 50,
  ai_summary text,
  ai_tags text[],
  read boolean not null default false,
  saved boolean not null default false,
  archived boolean not null default false,
  converted_to_quest boolean not null default false,
  dedupe_key text not null,
  created_at timestamptz not null default now()
);

alter table public.news_items enable row level security;
create policy "Users manage own news items"
  on public.news_items for all using (auth.uid() = user_id);

create index idx_news_items_user on public.news_items(user_id, archived, read);
create index idx_news_items_source on public.news_items(source_id);
create index idx_news_items_dedupe on public.news_items(dedupe_key);

-- ─── NEWS PREFERENCES ─────────────────────────────
create table if not exists public.news_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  preferred_topics text[] not null default '{technology,business,science}',
  muted_topics text[] not null default '{}',
  digest_frequency text not null default 'daily',
  min_importance integer not null default 20,
  ai_summaries_enabled boolean not null default false,
  auto_convert_suggestions boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.news_preferences enable row level security;
create policy "Users manage own news preferences"
  on public.news_preferences for all using (auth.uid() = user_id);

-- ─── TRIGGERS ─────────────────────────────────────
create trigger trg_push_devices_updated before update on public.push_devices
  for each row execute function public.update_updated_at();
create trigger trg_news_sources_updated before update on public.news_sources
  for each row execute function public.update_updated_at();
create trigger trg_news_prefs_updated before update on public.news_preferences
  for each row execute function public.update_updated_at();
