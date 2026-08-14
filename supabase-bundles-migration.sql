-- Snowflake Journal — Bundles feature migration
-- Paste this into the Supabase SQL editor and run it.
-- Run AFTER the original supabase-migration.sql.

-- ─── Add bundle columns to entries ───────────────────────────────────────────
alter table entries
  add column if not exists bundle_id      text,
  add column if not exists bundle_task_id text;

-- ─── bundles ─────────────────────────────────────────────────────────────────
create table if not exists bundles (
  id           text        primary key,
  user_id      uuid        not null references auth.users on delete cascade,
  name         text        not null,
  bonus_tokens integer     not null default 15,
  updated_at   timestamptz not null default now()
);

alter table bundles enable row level security;

create policy "users own their bundles"
  on bundles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── bundle_tasks ─────────────────────────────────────────────────────────────
create table if not exists bundle_tasks (
  id         text        primary key,
  bundle_id  text        not null references bundles on delete cascade,
  user_id    uuid        not null references auth.users on delete cascade,
  name       text        not null,
  area       text        not null,
  tokens     integer     not null default 10,
  sort_order integer     not null default 0,
  updated_at timestamptz not null default now()
);

alter table bundle_tasks enable row level security;

create policy "users own their bundle tasks"
  on bundle_tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── bundle_completions ───────────────────────────────────────────────────────
create table if not exists bundle_completions (
  id           text        primary key,
  bundle_id    text        not null references bundles on delete cascade,
  user_id      uuid        not null references auth.users on delete cascade,
  date         text        not null,
  week_key     text        not null,
  bonus_tokens integer     not null default 0,
  updated_at   timestamptz not null default now(),
  unique (bundle_id, user_id, date)
);

alter table bundle_completions enable row level security;

create policy "users own their bundle completions"
  on bundle_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
