-- Content tab removed from this app entirely — Ben is building it as a
-- separate, dedicated app and didn't want the two conflated. Both tables
-- were confirmed 100% unedited seed data before this drop (see memory:
-- project_bens_content_pipeline_spec.md for the full design if rebuilding).
drop table if exists content_items;
drop table if exists idea_bank;
