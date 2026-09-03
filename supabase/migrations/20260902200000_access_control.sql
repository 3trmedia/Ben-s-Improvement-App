-- Access control: Google sign-in via Supabase Auth, gated by an approval
-- allowlist Ben controls directly (Supabase Table Editor, or SQL) — no
-- separate emailed "key" needed. Ben's own email is auto-approved on first
-- sign-in; everyone else lands as 'pending' until Ben flips their status.

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz
);

alter table app_users enable row level security;

-- A signed-in user may only ever see their own row (to check their own status).
create policy "read own row" on app_users
  for select
  to authenticated
  using (auth_user_id = (select auth.uid()));

-- Auto-creates an app_users row whenever someone completes Google sign-in.
-- SECURITY DEFINER is required here — this must run regardless of the new
-- user's own RLS access (they have none yet) — but it does nothing beyond
-- inserting one bootstrap row scoped to the triggering auth.users id.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (auth_user_id, email, status, decided_at)
  values (
    new.id,
    new.email,
    case when new.email = 'empowertherebel@gmail.com' then 'approved' else 'pending' end,
    case when new.email = 'empowertherebel@gmail.com' then now() else null end
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Reusable check used by every app table's policy below.
create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_users
    where auth_user_id = (select auth.uid())
    and status = 'approved'
  );
$$;

-- Shared-workspace model: every approved user sees the same data (this isn't
-- multi-tenant — Ben is inviting people into one shared app instance), so a
-- single "is_approved()" policy per table is the correct model here, not
-- per-row ownership.
do $$
declare
  t text;
begin
  foreach t in array array[
    'tasks', 'habits', 'goals', 'projects', 'project_phases',
    'workouts', 'exercises', 'workout_logs', 'body_log',
    'content_items', 'idea_bank', 'walkaways', 'health_metrics', 'inbox'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "approved users only" on %I for all to authenticated using (public.is_approved()) with check (public.is_approved())',
      t
    );
  end loop;
end $$;
