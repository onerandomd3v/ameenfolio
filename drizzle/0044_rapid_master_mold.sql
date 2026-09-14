CREATE TABLE "experience_highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"experience_id" uuid NOT NULL,
	"body" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"location" text,
	"icon_name" text DEFAULT 'briefcase' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "experiences_icon_name_valid" CHECK ("experiences"."icon_name" in ('briefcase', 'building', 'cloud', 'code', 'globe', 'palette', 'search', 'terminal')),
	CONSTRAINT "experiences_date_order_valid" CHECK ("experiences"."end_date" is null or "experiences"."end_date" >= "experiences"."start_date")
);
--> statement-breakpoint
ALTER TABLE "experience_highlights" ADD CONSTRAINT "experience_highlights_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "experience_highlights_order_idx" ON "experience_highlights" USING btree ("experience_id","display_order");--> statement-breakpoint
CREATE INDEX "experiences_public_order_idx" ON "experiences" USING btree ("published","display_order","start_date");