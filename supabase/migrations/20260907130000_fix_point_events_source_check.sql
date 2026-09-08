-- The nutrition_adjust source was added to the app (lib/points.ts) but the
-- check constraint on point_events was never updated to match, so every
-- calorie/water/protein point award has been silently failing.

alter table point_events drop constraint point_events_source_check;
alter table point_events add constraint point_events_source_check
  check (source in ('task', 'habit', 'habit_streak', 'goal', 'workout_set', 'body_log', 'meal', 'nutrition_adjust', 'walkaway', 'redemption'));
