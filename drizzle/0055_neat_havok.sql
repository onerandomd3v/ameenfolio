ALTER TABLE "tech_stack_items" ADD COLUMN "icon_key" text;
UPDATE "tech_stack_items"
SET "icon_key" = 'googlecloud'
WHERE lower("name") = 'gcp' AND "icon_key" IS NULL;
