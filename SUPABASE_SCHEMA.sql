-- ══════════════════════════════════════════════════
-- Eclipse Valhalla — Supabase Database Schema
-- ══════════════════════════════════════════════════
-- Run this in the Supabase SQL Editor to create tables.
-- All tables use RLS. Policies need to be added separately.
-- ══════════════════════════════════════════════════

-- ─── PROFILES ─────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default 'Warrior',
  avatar_url text,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  locale text not null default 'en',
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ─── QUESTS ───────────────────────────────────────
create table if not exists public.quests (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'pending' check (status in ('pending','active','completed','failed','archived')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  category text not null default 'personal',
  repeat text not null default 'none',
  due_at timestamptz not null,
  completed_at timestamptz,
  archived_at timestamptz,
  subtasks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quests enable row level security;

create policy "Users can CRUD own quests"
  on public.quests for all using (auth.uid() = user_id);

create index idx_quests_user_id on public.quests(user_id);
create index idx_quests_status on public.quests(user_id, status);

-- ─── NOTES ────────────────────────────────────────
create table if not exists public.notes (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  color text not null default 'yellow',
  position_x real not null default 0,
  position_y real not null default 0,
  width real not null default 200,
  height real not null default 200,
  z_index integer not null default 0,
  minimized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Users can CRUD own notes"
  on public.notes for all using (auth.uid() = user_id);

-- ─── WIDGET CONFIGS ───────────────────────────────
create table if not exists public.widget_configs (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_id text references public.quests(id) on delete set null,
  type text not null check (type in ('quest','focus','blocker')),
  position_x real not null default 60,
  position_y real not null default 60,
  width real not null default 300,
  height real not null default 140,
  locked boolean not null default false,
  opacity real not null default 1.0,
  visible boolean not null default true,
  priority text not null default 'medium',
  desktop_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.widget_configs enable row level security;

create policy "Users can CRUD own widgets"
  on public.widget_configs for all using (auth.uid() = user_id);

-- ─── FOCUS SESSIONS ───────────────────────────────
create table if not exists public.focus_sessions (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_id text references public.quests(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_sec integer not null default 0,
  completed boolean not null default false
);

alter table public.focus_sessions enable row level security;

create policy "Users can CRUD own focus sessions"
  on public.focus_sessions for all using (auth.uid() = user_id);

-- ─── GAMIFICATION PROFILES ────────────────────────
create table if not exists public.gamification_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  xp integer not null default 0,
  level integer not null default 1,
  streak_days integer not null default 0,
  discipline_score integer not null default 50,
  total_completed integer not null default 0,
  total_failed integer not null default 0,
  focus_sessions integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.gamification_profiles enable row level security;

create policy "Users can CRUD own gamification"
  on public.gamification_profiles for all using (auth.uid() = user_id);

-- ─── NOTIFICATION PREFERENCES ─────────────────────
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  in_app_enabled boolean not null default true,
  push_enabled boolean not null default true,
  email_enabled boolean not null default false,
  sms_enabled boolean not null default false,
  escalation_enabled boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "Users can CRUD own notification prefs"
  on public.notification_preferences for all using (auth.uid() = user_id);

-- ─── APP SETTINGS ─────────────────────────────────
create table if not exists public.app_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  accent_theme text not null default 'ice',
  reduced_motion boolean not null default false,
  widget_transparency real not null default 100,
  atmosphere_level real not null default 80,
  compact_mode boolean not null default false,
  glow_intensity real not null default 70,
  locale text not null default 'en',
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "Users can CRUD own settings"
  on public.app_settings for all using (auth.uid() = user_id);

-- ─── ORACLE SESSIONS ──────────────────────────────
create table if not exists public.oracle_sessions (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Oracle Session',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.oracle_sessions enable row level security;

create policy "Users can CRUD own oracle sessions"
  on public.oracle_sessions for all using (auth.uid() = user_id);

-- ─── ORACLE MESSAGES ──────────────────────────────
create table if not exists public.oracle_messages (
  id text primary key,
  session_id text not null references public.oracle_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.oracle_messages enable row level security;

create policy "Users can read own oracle messages"
  on public.oracle_messages for all
  using (
    session_id in (
      select id from public.oracle_sessions where user_id = auth.uid()
    )
  );

-- ─── UPDATED_AT TRIGGER ──────────────────────────
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger trg_quests_updated before update on public.quests
  for each row execute function public.update_updated_at();
create trigger trg_notes_updated before update on public.notes
  for each row execute function public.update_updated_at();
create trigger trg_widget_configs_updated before update on public.widget_configs
  for each row execute function public.update_updated_at();
create trigger trg_gamification_updated before update on public.gamification_profiles
  for each row execute function public.update_updated_at();
create trigger trg_app_settings_updated before update on public.app_settings
  for each row execute function public.update_updated_at();
create trigger trg_oracle_sessions_updated before update on public.oracle_sessions
  for each row execute function public.update_updated_at();
