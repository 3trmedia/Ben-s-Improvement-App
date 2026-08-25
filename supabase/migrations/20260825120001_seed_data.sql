-- Temporary seed data, ported from lib/mock-data.ts, so the app has something
-- real to read/write against. Clean up / replace with real entries anytime.

-- Habits
insert into habits (label, cadence, target_per_week, done_this_week, sort_order) values
  ('Gym session', '3–4x / week', 4, 3, 0),
  ('Hike or run club', 'weekly', 1, 1, 1),
  ('Dance night', 'weekly', 1, 0, 2),
  ('Protein target (150–185g)', 'daily', 7, 5, 3),
  ('Meal prep rotation used', 'weekly', 1, 1, 4),
  ('Peptide log', 'daily', 7, 6, 5);

-- Goals
insert into goals (title, note, metric_kind, current_value, target_value, unit) values
  ('Close 2 more revenue-share clients', 'Blind spot: chasing leads reactively instead of a real pipeline cadence.', 'count', 0, 2, 'clients'),
  ('Bench 205 lb by end of quarter', 'Last logged: 185 lb. Pulled from the Fitness log, not re-entered here.', 'pr', 185, 205, 'lb');

insert into goals (title, note, metric_kind, current_value, target_value, unit, habit_id)
select 'Hit gym 3–4x/week without a guilt spiral on off weeks',
       'Systems over motivation — pulled straight from the Habits tab, not tracked twice.',
       'habit', 0, 1, '',
       id
from habits where label = 'Gym session';

-- Auto-Mate project
with p as (
  insert into projects (title, note)
  values ('Auto-Mate build', 'Ship Blackout''s 6-format system consistently before adding more automation on top of it.')
  returning id
)
insert into project_phases (project_id, name, status, sort_order)
select p.id, name, status, sort_order
from p, (values
  ('Lead qualifier', 'Live', 0),
  ('Calendar automation', 'In progress', 1),
  ('Nurture sequences', 'Planned', 2),
  ('Invoicing', 'Planned', 3)
) as phases(name, status, sort_order);

-- Tasks
insert into tasks (title, next_action, entity, priority, due) values
  ('Send Peak Defense the Shopify template draft', 'Export theme + write handoff notes', '3TR', 'high', 'Today'),
  ('Script this week''s Blackout format #3', 'Outline hook + 3 beats', 'Blackout', 'medium', 'Today'),
  ('Log yesterday''s lifts', 'Pull numbers from notes app', 'Personal', 'low', 'Today'),
  ('Follow up with Christian on RNR edit', 'Ask for ETA on cut #2', '3TR', 'high', 'This week'),
  ('Draft Q3 goals doc', 'Block 30 min, no calls', 'Personal', 'medium', 'This week');

-- Workouts + exercises
with w as (
  insert into workouts (name, sort_order) values ('Push Day', 0) returning id
)
insert into exercises (workout_id, name, target_sets, target_reps, target_weight, sort_order)
select w.id, name, target_sets, target_reps, target_weight, sort_order
from w, (values
  ('Bench Press', 4, '6–8', '185 lb', 0),
  ('Overhead Press', 3, '8–10', '95 lb', 1),
  ('Incline DB Press', 3, '10–12', '60 lb', 2),
  ('Lateral Raise', 3, '12–15', '20 lb', 3)
) as ex(name, target_sets, target_reps, target_weight, sort_order);

with w as (
  insert into workouts (name, sort_order) values ('Pull Day', 1) returning id
)
insert into exercises (workout_id, name, target_sets, target_reps, target_weight, sort_order)
select w.id, name, target_sets, target_reps, target_weight, sort_order
from w, (values
  ('Deadlift', 4, '5', '275 lb', 0),
  ('Pull-Up', 4, '8–10', 'BW', 1),
  ('Barbell Row', 3, '8–10', '155 lb', 2),
  ('Face Pull', 3, '15', '40 lb', 3)
) as ex(name, target_sets, target_reps, target_weight, sort_order);

with w as (
  insert into workouts (name, sort_order) values ('Leg Day', 2) returning id
)
insert into exercises (workout_id, name, target_sets, target_reps, target_weight, sort_order)
select w.id, name, target_sets, target_reps, target_weight, sort_order
from w, (values
  ('Back Squat', 4, '6–8', '225 lb', 0),
  ('Romanian Deadlift', 3, '8–10', '185 lb', 1),
  ('Walking Lunge', 3, '12/leg', '40 lb', 2)
) as ex(name, target_sets, target_reps, target_weight, sort_order);

-- A few past workout log entries
insert into workout_logs (exercise_id, logged_on, actual_reps, actual_weight)
select id, date '2026-08-18', '6,6,5,5', '185 lb' from exercises where name = 'Bench Press';
insert into workout_logs (exercise_id, logged_on, actual_reps, actual_weight)
select id, date '2026-08-18', '9,8,8', '95 lb' from exercises where name = 'Overhead Press';
insert into workout_logs (exercise_id, logged_on, actual_reps, actual_weight)
select id, date '2026-08-16', '5,5,5,4', '275 lb' from exercises where name = 'Deadlift';

-- Body log
insert into body_log (logged_on, weight, note) values
  (date '2026-08-19', '182.4 lb', 'Ring recovery: 78'),
  (date '2026-08-12', '183.1 lb', 'Ring recovery: 71');

-- Content
insert into content_items (owner, title, stage, editor, format, due, sort_order) values
  ('Personal', 'Agency pricing myths', 'Editing', 'Christian', 'Talking head', 'Aug 25', 0),
  ('Personal', 'Morning routine breakdown', 'Filmed', '—', 'Vlog cut', 'Aug 28', 1),
  ('Blackout', 'Format #3 — feed teardown', 'Scripted', '—', 'Format 3', 'Today', 0),
  ('Blackout', 'Format #1 — hook study', 'Posted', 'Upwork', 'Format 1', '—', 1),
  ('Peak Defense', 'Shopify launch teaser', 'Delivered', 'Christian', 'Ad cut', '—', 0),
  ('J&C', 'Product spotlight reel', 'Idea', '—', 'Reel', 'Aug 26', 0),
  ('RNR', 'Testimonial cut #2', 'Editor assigned', 'Christian', 'Testimonial', 'Today', 0),
  ('Uptown Drapes', 'Before/after showcase', 'Filmed', '—', 'Showcase', 'Aug 27', 0),
  ('Hoffman Tactical', 'Range day recap', 'Posted', 'Upwork', 'Recap', '—', 0);

-- Idea bank
insert into idea_bank (tier, channel, hook) values
  ('Free', 'DP Ben B', 'Why most agencies underprice discovery calls'),
  ('$100', 'Blackout', '3-format teardown of a competitor''s feed'),
  ('$1,000', '3TR IG', 'Client case study: Peak Defense before/after');
