-- Core schema for Ben's Improvement App: workouts, habits, goals, tasks, content.
-- Intentionally loose/simple ("temporary data we can clean later") — no RLS,
-- no auth yet, since this is a single-user app with no login built. Add RLS +
-- auth policies before this is ever exposed beyond Ben himself.

-- ── To-Do ──────────────────────────────────────────────────────────────
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  next_action text,
  entity text not null check (entity in ('3TR', 'Blackout', 'Personal')),
  priority text not null check (priority in ('low', 'medium', 'high')),
  due text not null default 'Today', -- 'Today' | 'This week' | free text for now
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Habits ─────────────────────────────────────────────────────────────
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  cadence text not null,
  target_per_week integer not null default 1,
  done_this_week integer not null default 0,
  sort_order integer not null default 0
);

-- ── Goals ──────────────────────────────────────────────────────────────
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  note text,
  metric_kind text not null check (metric_kind in ('count', 'pr', 'habit')),
  current_value numeric not null default 0,
  target_value numeric not null default 1,
  unit text default '',
  habit_id uuid references habits(id) on delete set null
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  note text
);

create table if not exists project_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  status text not null check (status in ('Planned', 'In progress', 'Live')),
  sort_order integer not null default 0
);

-- ── Fitness ────────────────────────────────────────────────────────────
create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0
);

create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  name text not null,
  target_sets integer not null,
  target_reps text not null,
  target_weight text not null,
  sort_order integer not null default 0
);

create table if not exists workout_logs (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises(id) on delete cascade,
  logged_on date not null default current_date,
  actual_reps text not null,
  actual_weight text not null,
  created_at timestamptz not null default now()
);

create table if not exists body_log (
  id uuid primary key default gen_random_uuid(),
  logged_on date not null default current_date,
  weight text not null,
  note text,
  created_at timestamptz not null default now()
);

-- ── Content (YouTube + clients) ───────────────────────────────────────
create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  owner text not null, -- 'Personal' | 'Blackout' | a client name
  title text not null,
  stage text not null,
  editor text default '—',
  format text,
  due text default '—',
  sort_order integer not null default 0
);

create table if not exists idea_bank (
  id uuid primary key default gen_random_uuid(),
  tier text not null check (tier in ('Free', '$100', '$1,000')),
  channel text not null,
  hook text not null
);

-- Everything below is left wide open (no RLS) intentionally for now —
-- single user, no login. Revisit once auth exists.
