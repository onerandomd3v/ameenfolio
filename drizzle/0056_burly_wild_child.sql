CREATE TABLE "tech_stack_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tech_stack_items" DROP CONSTRAINT "tech_stack_group_key_valid";--> statement-breakpoint
CREATE UNIQUE INDEX "tech_stack_categories_key_idx" ON "tech_stack_categories" USING btree ("key");
--> statement-breakpoint
INSERT INTO "tech_stack_categories" ("key", "name", "display_order")
VALUES
  ('language', 'Language', 0),
  ('frontend', 'Frontend', 1),
  ('backend', 'Backend', 2),
  ('tools', 'Infrastructure', 3),
  ('workflow', 'Workflow', 4),
  ('design', 'Design', 5)
ON CONFLICT ("key") DO NOTHING;
