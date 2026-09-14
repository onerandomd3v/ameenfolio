UPDATE "tech_stack_items" SET "group_key" = 'language' WHERE lower("name") = 'python';--> statement-breakpoint
UPDATE "tech_stack_items" SET "group_key" = 'backend' WHERE lower("name") IN ('express', 'bullmq');
