-- "Times I walked away" counter — logged as timestamped rows (not a single
-- number) so it can be broken down by day/week later without a schema change.
create table if not exists walkaways (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now()
);

-- Sets of 3 per exercise per day, instead of one log entry per exercise.
alter table workout_logs add column if not exists set_number integer not null default 1;

-- Generic ingestion table for Health Connect Webhook data (RingConn + Galaxy
-- Watch via Samsung Health, both already synced to Android's Health Connect).
-- Kept loose/generic on purpose since the exact metrics sent aren't fixed yet.
create table if not exists health_metrics (
  id uuid primary key default gen_random_uuid(),
  source text not null,      -- e.g. 'ringconn', 'samsung_health'
  metric text not null,      -- e.g. 'sleep', 'heart_rate', 'steps', 'recovery'
  value numeric,
  unit text,
  recorded_at timestamptz not null default now(),
  raw jsonb,                 -- full original payload, in case value/unit don't capture it
  received_at timestamptz not null default now()
);
