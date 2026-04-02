-- ══════════════════════════════════════════════════
-- Eclipse Valhalla — Cross-Device Sync Schema
-- ══════════════════════════════════════════════════

-- ─── USER PROGRESS (one row per user) ─────────────
create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  streak integer not null default 0,
  last_active_date text,
  completed_today integer not null default 0,
  total_completed integer not null default 0,
  total_failed integer not null default 0,
  escape_count integer not null default 0,
  focus_sessions integer not null default 0,
  discipline_mode text not null default 'hardcore',
  rare_moments_shown text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;
create policy "Users manage own progress"
  on public.user_progress for all using (auth.uid() = user_id);

-- ─── UPDATED_AT TRIGGER ──────────────────────────
create trigger trg_user_progress_updated before update on public.user_progress
  for each row execute function public.update_updated_at();

-- ─── ENABLE REALTIME ──────────────────────────────
-- Run this in Supabase Dashboard → SQL Editor:
-- alter publication supabase_realtime add table public.quests;
-- alter publication supabase_realtime add table public.user_progress;
