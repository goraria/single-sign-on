CREATE TYPE "public"."oauth_application_type_enum" AS ENUM('web', 'native');--> statement-breakpoint
CREATE TABLE "oauth_client_assertions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_client_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"name" text NOT NULL,
	"access_token_ttl" integer,
	"refresh_token_ttl" integer,
	"signing_algorithm" text,
	"signing_key_id" text,
	"allowed_scopes" text[],
	"custom_claims" jsonb,
	"dpop_bound_access_tokens_required" boolean DEFAULT false NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"policy_version" integer DEFAULT 1 NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "oauth_resources_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts_identity_backup_20260821" AS
SELECT "id", "user_id", "account_id", "provider_id"
FROM "accounts";--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "issuer" text;--> statement-breakpoint
UPDATE "accounts"
SET
	"issuer" = CASE
		WHEN "provider_id" = 'credential' THEN 'local:credential'
		WHEN "provider_id" = 'google' THEN 'https://accounts.google.com'
		ELSE 'local:oauth:' || "provider_id"
	END,
	"account_id" = CASE
		WHEN "provider_id" = 'credential' THEN "user_id"::text
		ELSE "account_id"
	END;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "accounts" WHERE "issuer" IS NULL OR "issuer" = '') THEN
		RAISE EXCEPTION 'Better Auth 1.7 account issuer backfill is incomplete';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "accounts"
		GROUP BY "issuer", "account_id"
		HAVING COUNT(*) > 1
	) THEN
		RAISE EXCEPTION 'Better Auth 1.7 account identity backfill produced duplicates';
	END IF;
END
$$;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "issuer" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD COLUMN "authorization_code_id" text;--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD COLUMN "resources" text[];--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD COLUMN "requested_user_info_claims" text[];--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD COLUMN "revoked" timestamp;--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD COLUMN "confirmation" jsonb;--> statement-breakpoint
ALTER TABLE "oauth_clients" ADD COLUMN "client_discovery_id" text;--> statement-breakpoint
ALTER TABLE "oauth_clients" ADD COLUMN "client_credentials_scopes" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_clients" ADD COLUMN "backchannel_logout_uri" text;--> statement-breakpoint
ALTER TABLE "oauth_clients" ADD COLUMN "backchannel_logout_session_required" boolean;--> statement-breakpoint
ALTER TABLE "oauth_clients" ADD COLUMN "application_type" "oauth_application_type_enum";--> statement-breakpoint
ALTER TABLE "oauth_clients" ADD COLUMN "jwks" text;--> statement-breakpoint
ALTER TABLE "oauth_clients" ADD COLUMN "jwks_uri" text;--> statement-breakpoint
ALTER TABLE "oauth_clients" ADD COLUMN "dpop_bound_access_tokens" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_consents" ADD COLUMN "resources" text[];--> statement-breakpoint
ALTER TABLE "oauth_consents" ADD COLUMN "requested_user_info_claims" text[];--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD COLUMN "authorization_code_id" text;--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD COLUMN "resources" text[];--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD COLUMN "requested_user_info_claims" text[];--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD COLUMN "rotated_at" timestamp;--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD COLUMN "rotation_replay_response" text;--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD COLUMN "rotation_replay_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD COLUMN "confirmation" jsonb;--> statement-breakpoint
ALTER TABLE "oauth_client_resources" ADD CONSTRAINT "oauth_client_resources_client_id_oauth_clients_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("client_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "oauth_client_resources" ADD CONSTRAINT "oauth_client_resources_resource_id_oauth_resources_identifier_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."oauth_resources"("identifier") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "oauth_client_resources_client_id_idx" ON "oauth_client_resources" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oauth_client_resources_resource_id_idx" ON "oauth_client_resources" USING btree ("resource_id");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_client_resources_client_resource_key" ON "oauth_client_resources" USING btree ("client_id","resource_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_issuer_account_id_key" ON "accounts" USING btree ("issuer","account_id");--> statement-breakpoint
CREATE INDEX "oauth_access_tokens_authorization_code_id_idx" ON "oauth_access_tokens" USING btree ("authorization_code_id");--> statement-breakpoint
CREATE INDEX "oauth_refresh_tokens_authorization_code_id_idx" ON "oauth_refresh_tokens" USING btree ("authorization_code_id");
