CREATE TABLE "project_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"endpoint_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"trusted_origins" jsonb NOT NULL,
	"social_providers" jsonb NOT NULL,
	"email_provider" jsonb,
	"email_and_password" jsonb,
	"allow_localhost" boolean NOT NULL,
	"plugin_configs" jsonb,
	"webhook_config" jsonb
);
--> statement-breakpoint
ALTER TABLE "accounts" RENAME TO "account";--> statement-breakpoint
ALTER TABLE "invitations" RENAME TO "invitation";--> statement-breakpoint
ALTER TABLE "jwkss" RENAME TO "jwks";--> statement-breakpoint
ALTER TABLE "members" RENAME TO "member";--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" RENAME TO "oauth_access_token";--> statement-breakpoint
ALTER TABLE "oauth_client_assertions" RENAME TO "oauth_client_assertion";--> statement-breakpoint
ALTER TABLE "oauth_client_resources" RENAME TO "oauth_client_resource";--> statement-breakpoint
ALTER TABLE "oauth_clients" RENAME TO "oauth_client";--> statement-breakpoint
ALTER TABLE "oauth_consents" RENAME TO "oauth_consent";--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" RENAME TO "oauth_refresh_token";--> statement-breakpoint
ALTER TABLE "oauth_resources" RENAME TO "oauth_resource";--> statement-breakpoint
ALTER TABLE "organizations" RENAME TO "organization";--> statement-breakpoint
ALTER TABLE "sessions" RENAME TO "session";--> statement-breakpoint
ALTER TABLE "sso_providers" RENAME TO "sso_provider";--> statement-breakpoint
ALTER TABLE "users" RENAME TO "user";--> statement-breakpoint
ALTER TABLE "verifications" RENAME TO "verification";--> statement-breakpoint
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_team_id_teams_id_fk";--> statement-breakpoint
DROP TABLE "team_members";--> statement-breakpoint
DROP TABLE "teams";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "banned_until" TO "ban_expires";--> statement-breakpoint
ALTER INDEX "accounts_user_id_idx" RENAME TO "account_user_id_idx";--> statement-breakpoint
ALTER INDEX "accounts_provider_account_key" RENAME TO "account_provider_account_key";--> statement-breakpoint
ALTER INDEX "accounts_issuer_account_id_key" RENAME TO "account_issuer_account_id_key";--> statement-breakpoint
ALTER INDEX "invitations_organization_id_idx" RENAME TO "invitation_organization_id_idx";--> statement-breakpoint
ALTER INDEX "invitations_email_idx" RENAME TO "invitation_email_idx";--> statement-breakpoint
ALTER INDEX "members_organization_id_idx" RENAME TO "member_organization_id_idx";--> statement-breakpoint
ALTER INDEX "members_user_id_idx" RENAME TO "member_user_id_idx";--> statement-breakpoint
ALTER INDEX "members_organization_user_key" RENAME TO "member_organization_user_key";--> statement-breakpoint
ALTER INDEX "oauth_access_tokens_token_key" RENAME TO "oauth_access_token_token_key";--> statement-breakpoint
ALTER INDEX "oauth_access_tokens_client_id_idx" RENAME TO "oauth_access_token_client_id_idx";--> statement-breakpoint
ALTER INDEX "oauth_access_tokens_session_id_idx" RENAME TO "oauth_access_token_session_id_idx";--> statement-breakpoint
ALTER INDEX "oauth_access_tokens_user_id_idx" RENAME TO "oauth_access_token_user_id_idx";--> statement-breakpoint
ALTER INDEX "oauth_access_tokens_refresh_id_idx" RENAME TO "oauth_access_token_refresh_id_idx";--> statement-breakpoint
ALTER INDEX "oauth_access_tokens_authorization_code_id_idx" RENAME TO "oauth_access_token_authorization_code_id_idx";--> statement-breakpoint
ALTER INDEX "oauth_client_resources_client_id_idx" RENAME TO "oauth_client_resource_client_id_idx";--> statement-breakpoint
ALTER INDEX "oauth_client_resources_resource_id_idx" RENAME TO "oauth_client_resource_resource_id_idx";--> statement-breakpoint
ALTER INDEX "oauth_client_resources_client_resource_key" RENAME TO "oauth_client_resource_client_resource_key";--> statement-breakpoint
ALTER INDEX "oauth_clients_user_id_idx" RENAME TO "oauth_client_user_id_idx";--> statement-breakpoint
ALTER INDEX "oauth_consents_client_id_idx" RENAME TO "oauth_consent_client_id_idx";--> statement-breakpoint
ALTER INDEX "oauth_consents_user_id_idx" RENAME TO "oauth_consent_user_id_idx";--> statement-breakpoint
ALTER INDEX "oauth_refresh_tokens_token_key" RENAME TO "oauth_refresh_token_token_key";--> statement-breakpoint
ALTER INDEX "oauth_refresh_tokens_client_id_idx" RENAME TO "oauth_refresh_token_client_id_idx";--> statement-breakpoint
ALTER INDEX "oauth_refresh_tokens_session_id_idx" RENAME TO "oauth_refresh_token_session_id_idx";--> statement-breakpoint
ALTER INDEX "oauth_refresh_tokens_user_id_idx" RENAME TO "oauth_refresh_token_user_id_idx";--> statement-breakpoint
ALTER INDEX "oauth_refresh_tokens_authorization_code_id_idx" RENAME TO "oauth_refresh_token_authorization_code_id_idx";--> statement-breakpoint
ALTER INDEX "organizations_slug_key" RENAME TO "organization_slug_key";--> statement-breakpoint
ALTER INDEX "sessions_token_key" RENAME TO "session_token_key";--> statement-breakpoint
ALTER INDEX "sessions_user_id_idx" RENAME TO "session_user_id_idx";--> statement-breakpoint
ALTER INDEX "sso_providers_provider_id_key" RENAME TO "sso_provider_provider_id_key";--> statement-breakpoint
ALTER INDEX "sso_providers_user_id_idx" RENAME TO "sso_provider_user_id_idx";--> statement-breakpoint
ALTER INDEX "users_username_key" RENAME TO "user_username_key";--> statement-breakpoint
ALTER INDEX "users_status_idx" RENAME TO "user_status_idx";--> statement-breakpoint
ALTER INDEX "users_last_active_at_idx" RENAME TO "user_last_active_at_idx";--> statement-breakpoint
ALTER INDEX "verifications_identifier_idx" RENAME TO "verification_identifier_idx";--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "active_team_id";--> statement-breakpoint
ALTER TABLE "invitation" DROP COLUMN "team_id";--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "access_token_expires_at" SET DATA TYPE timestamp with time zone USING "access_token_expires_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "refresh_token_expires_at" SET DATA TYPE timestamp with time zone USING "refresh_token_expires_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invitation" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone USING "expires_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invitation" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jwks" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jwks" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone USING "expires_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "member" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone USING "expires_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ALTER COLUMN "revoked" SET DATA TYPE timestamp with time zone USING "revoked"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_client_assertion" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone USING "expires_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_client_resource" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_consent" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_consent" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone USING "expires_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "revoked" SET DATA TYPE timestamp with time zone USING "revoked"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "auth_time" SET DATA TYPE timestamp with time zone USING "auth_time"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "rotated_at" SET DATA TYPE timestamp with time zone USING "rotated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "rotation_replay_expires_at" SET DATA TYPE timestamp with time zone USING "rotation_replay_expires_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_resource" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_resource" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organization" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone USING "expires_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "ban_expires" SET DATA TYPE timestamp with time zone USING "ban_expires"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone USING "deleted_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "banned_at" SET DATA TYPE timestamp with time zone USING "banned_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "last_sign_in_at" SET DATA TYPE timestamp with time zone USING "last_sign_in_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "last_active_at" SET DATA TYPE timestamp with time zone USING "last_active_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone USING "expires_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "project_config_endpoint_id_key" ON "project_config" ("endpoint_id");