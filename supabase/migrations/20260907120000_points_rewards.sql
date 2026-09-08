-- Points/Rewards system. 1 point = $0.10 (tracked as points, not dollars).
-- Completing tasks/habits/goals and logging fitness/nutrition activity earns
-- points; points are spent on rewards Ben defines himself (an image + a
-- point cost he uploads through the app). Ledger-based (point_events)
-- rather than a stored running counter, so un-completing something reverses
-- cleanly by deleting the matching event instead of guessing at a total.

alter table tasks add column if not exists points integer not null default 5;

create table if not exists point_events (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('task', 'habit', 'goal', 'workout_set', 'body_log', 'meal', 'walkaway', 'redemption')),
  source_id text,
  points integer not null,
  label text,
  created_at timestamptz not null default now()
);

create table if not exists rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  cost integer not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array['point_events', 'rewards']
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "approved users only" on %I for all to authenticated using (public.is_approved()) with check (public.is_approved())',
      t
    );
  end loop;
end $$;

-- Running balance as a function rather than summing the whole ledger
-- client-side every time -- point_events only grows over time.
create or replace function public.point_balance()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(points), 0)::integer from point_events;
$$;

-- Storage bucket for reward images. Public read (just images, nothing
-- sensitive) so an <img> tag can load them directly by URL; writes gated to
-- approved users same as every other table.
insert into storage.buckets (id, name, public)
values ('reward-images', 'reward-images', true)
on conflict (id) do nothing;

create policy "public read reward images" on storage.objects
  for select
  to public
  using (bucket_id = 'reward-images');

create policy "approved users manage reward images" on storage.objects
  for all
  to authenticated
  using (bucket_id = 'reward-images' and public.is_approved())
  with check (bucket_id = 'reward-images' and public.is_approved());
