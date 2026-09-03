-- Calories tab, real persistence. Everything is event-sourced by day so
-- "starts over at 0" just means filtering to today's rows — no reset job
-- needed. "Today" uses a 2am cutoff (see app code), not midnight.

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  calories integer not null,
  protein integer not null default 0
);

create table if not exists meals_log (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  calories integer not null,
  protein integer not null default 0,
  logged_on date not null default current_date,
  created_at timestamptz not null default now()
);

-- Manual +/- ticks (water/calories/protein buttons). Amount can be negative
-- (the "-" button). Today's total per metric = sum of these + meals_log
-- (for calories/protein only — water has no meal source).
create table if not exists nutrition_adjustments (
  id uuid primary key default gen_random_uuid(),
  metric text not null check (metric in ('water', 'calories', 'protein')),
  amount numeric not null,
  logged_on date not null default current_date,
  created_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array['recipes', 'meals_log', 'nutrition_adjustments']
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "approved users only" on %I for all to authenticated using (public.is_approved()) with check (public.is_approved())',
      t
    );
  end loop;
end $$;

insert into recipes (name, calories, protein) values
  ('Protein shake', 220, 35),
  ('Chicken, rice & broccoli bowl', 620, 52),
  ('Egg white oats', 380, 28),
  ('Greek yogurt + berries', 180, 20);
