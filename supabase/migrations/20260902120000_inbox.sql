-- Voice-capture landing table. Claude (mobile/desktop, via a Supabase
-- connector) writes raw dictated text here; a later pass (manual ask, or a
-- Cowork scheduled task) reads unprocessed rows and files them into the real
-- tables (tasks, content_items, habits, workout_logs, etc.), then flips
-- status to 'processed'. No RLS, matching the rest of this single-user app.
create table if not exists inbox (
  id uuid primary key default gen_random_uuid(),
  captured_at timestamptz not null default now(),
  raw_text text not null,
  status text not null default 'unprocessed' check (status in ('unprocessed', 'processed')),
  processed_at timestamptz
);
