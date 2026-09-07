ALTER TABLE "sso_applications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "sso_applications" CASCADE;--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ALTER COLUMN "scopes" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "oauth_clients" ALTER COLUMN "scopes" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "oauth_consents" ALTER COLUMN "scopes" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ALTER COLUMN "scopes" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_client_id_oauth_clients_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("client_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "oauth_consents" ADD CONSTRAINT "oauth_consents_client_id_oauth_clients_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("client_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_client_id_oauth_clients_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("client_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "confirmed_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "confirmation_sent_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_anonymous";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_sso_user";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "invited_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "last_sign_in_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "raw_app_meta_data";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "raw_user_meta_data";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "providers";--> statement-breakpoint
DROP TYPE "public"."oauth_scope_enum";--> statement-breakpoint
DROP TYPE "public"."provider_enum";