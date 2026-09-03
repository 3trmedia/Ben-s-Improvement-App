-- Full reset of the Growth tab, per Ben's explicit request ("wipe the data,
-- give me a fresh start"). Scoped to exactly the tables that tab touches —
-- nothing in Fitness, Content, Calories, or auth is affected.
delete from project_phases;
delete from projects;
delete from goals;
delete from habits;
delete from tasks;
delete from walkaways;
