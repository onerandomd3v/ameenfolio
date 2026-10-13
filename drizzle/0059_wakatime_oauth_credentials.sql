CREATE TABLE "wakatime_oauth_credentials" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"encrypted_tokens" text NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wakatime_oauth_credentials_singleton" CHECK ("wakatime_oauth_credentials"."id" = 1)
);
