-- Snowflake Journal — Supabase schema
-- Paste this entire file into the Supabase SQL editor and run it.

-- ─── entries ─────────────────────────────────────────────────────────────────
create table if not exists entries (
  id          text        primary key,
  user_id     uuid        not null references auth.users on delete cascade,
  date        text        not null,
  timestamp   timestamptz not null,
  area        text        not null,
  tokens      integer     not null default 1,
  note        text,
  task_id     text,
  updated_at  timestamptz not null default now()
);

alter table entries enable row level security;

create policy "users own their entries"
  on entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── tasks ───────────────────────────────────────────────────────────────────
create table if not exists tasks (
  id          text        primary key,
  user_id     uuid        not null references auth.users on delete cascade,
  name        text        not null,
  area        text        not null,
  tokens      integer     not null default 1,
  updated_at  timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "users own their tasks"
  on tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── custom_badges ───────────────────────────────────────────────────────────
create table if not exists custom_badges (
  id            text        primary key,
  user_id       uuid        not null references auth.users on delete cascade,
  name          text        not null,
  icon          text        not null,
  description   text,
  metric        text        not null,
  area          text,
  threshold     integer,
  unlocked      boolean     not null default false,
  unlocked_date text,
  updated_at    timestamptz not null default now()
);

alter table custom_badges enable row level security;

create policy "users own their custom badges"
  on custom_badges for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── user_vocab ──────────────────────────────────────────────────────────────
create table if not exists user_vocab (
  id          text        primary key,
  user_id     uuid        not null references auth.users on delete cascade,
  term        text        not null,
  definition  text        not null,
  example     text,
  updated_at  timestamptz not null default now()
);

alter table user_vocab enable row level security;

create policy "users own their vocab"
  on user_vocab for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── user_settings ───────────────────────────────────────────────────────────
-- One row per user. Stores small scalar/array settings.
create table if not exists user_settings (
  user_id              uuid        primary key references auth.users on delete cascade,
  sound_on             boolean     not null default true,
  unlocked_builtin_ids text[]      not null default '{}',
  user_quotes          text[]      not null default '{}',
  updated_at           timestamptz not null default now()
);

alter table user_settings enable row level security;

create policy "users own their settings"
  on user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
