ALTER TABLE "oauth_access_tokens" DROP CONSTRAINT "oauth_access_tokens_client_id_oauth_clients_client_id_fk";
--> statement-breakpoint
ALTER TABLE "oauth_consents" DROP CONSTRAINT "oauth_consents_client_id_oauth_clients_client_id_fk";
--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" DROP CONSTRAINT "oauth_refresh_tokens_client_id_oauth_clients_client_id_fk";
--> statement-breakpoint
DROP INDEX "oauth_clients_client_id_key";--> statement-breakpoint
ALTER TABLE "oauth_clients" ADD CONSTRAINT "oauth_clients_client_id_unique" UNIQUE("client_id");