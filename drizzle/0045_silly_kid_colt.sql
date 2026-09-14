DROP INDEX "experiences_public_order_idx";--> statement-breakpoint
ALTER TABLE "experiences" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "experiences_single_pinned_idx" ON "experiences" USING btree ("pinned") WHERE "experiences"."pinned" = true;--> statement-breakpoint
CREATE INDEX "experiences_public_order_idx" ON "experiences" USING btree ("published","pinned","display_order","start_date");