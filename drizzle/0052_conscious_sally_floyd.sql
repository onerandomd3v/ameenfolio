ALTER TABLE "tech_stack_items" DROP CONSTRAINT "tech_stack_group_key_valid";--> statement-breakpoint
ALTER TABLE "tech_stack_items" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "tech_stack_items"
SET "group_key" = CASE lower("name")
  WHEN 'javascript' THEN 'language'
  WHEN 'typescript' THEN 'language'
  WHEN 'react' THEN 'frontend'
  WHEN 'next.js' THEN 'frontend'
  WHEN 'tailwind css' THEN 'frontend'
  WHEN 'zustand' THEN 'frontend'
  WHEN 'node.js' THEN 'backend'
  WHEN 'nestjs' THEN 'backend'
  WHEN 'postgresql' THEN 'backend'
  WHEN 'mongodb' THEN 'backend'
  WHEN 'redis' THEN 'backend'
  WHEN 'prisma' THEN 'backend'
  ELSE 'frontend'
END
WHERE "group_key" = 'core';--> statement-breakpoint
UPDATE "tech_stack_items" SET "featured" = true WHERE "group_key" IN ('language', 'frontend', 'backend');--> statement-breakpoint
ALTER TABLE "tech_stack_items" ADD CONSTRAINT "tech_stack_group_key_valid" CHECK ("tech_stack_items"."group_key" in ('language', 'frontend', 'backend', 'tools', 'workflow', 'design'));
