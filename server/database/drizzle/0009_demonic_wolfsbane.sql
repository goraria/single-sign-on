CREATE TABLE "jwkss" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sso_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"homepage_url" text,
	"icon" text,
	"redirect_uris" text[] NOT NULL,
	"post_logout_redirect_uris" text[],
	"scopes" text[] NOT NULL,
	"grant_types" text[] NOT NULL,
	"response_types" text[] NOT NULL,
	"public" boolean DEFAULT true NOT NULL,
	"require_pkce" boolean DEFAULT true NOT NULL,
	"token_endpoint_auth_method" text DEFAULT 'none' NOT NULL,
	"skip_consent" boolean DEFAULT true NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sso_applications_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "sso_applications_client_id_key" ON "sso_applications" USING btree ("client_id");