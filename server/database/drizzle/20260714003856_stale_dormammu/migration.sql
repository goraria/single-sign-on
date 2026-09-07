CREATE TYPE "public"."oauth_grant_type_enum" AS ENUM('authorization_code', 'refresh_token', 'client_credentials');--> statement-breakpoint
CREATE TYPE "public"."oauth_response_type_enum" AS ENUM('code');--> statement-breakpoint
CREATE TYPE "public"."oauth_scope_enum" AS ENUM('openid', 'profile', 'email', 'offline_access');--> statement-breakpoint
CREATE TYPE "public"."oauth_subject_type_enum" AS ENUM('public', 'pairwise');--> statement-breakpoint
CREATE TYPE "public"."oauth_token_endpoint_auth_method_enum" AS ENUM('none', 'client_secret_basic', 'client_secret_post');--> statement-breakpoint
CREATE TYPE "public"."user_role_enum" AS ENUM('user', 'moderator', 'administrator');--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ALTER COLUMN "scopes" SET DATA TYPE "public"."oauth_scope_enum"[] USING "scopes"::"public"."oauth_scope_enum"[];--> statement-breakpoint
ALTER TABLE "oauth_clients" ALTER COLUMN "subject_type" SET DATA TYPE "public"."oauth_subject_type_enum" USING "subject_type"::"public"."oauth_subject_type_enum";--> statement-breakpoint
ALTER TABLE "oauth_clients" ALTER COLUMN "scopes" SET DATA TYPE "public"."oauth_scope_enum"[] USING "scopes"::"public"."oauth_scope_enum"[];--> statement-breakpoint
ALTER TABLE "oauth_clients" ALTER COLUMN "token_endpoint_auth_method" SET DATA TYPE "public"."oauth_token_endpoint_auth_method_enum" USING "token_endpoint_auth_method"::"public"."oauth_token_endpoint_auth_method_enum";--> statement-breakpoint
ALTER TABLE "oauth_clients" ALTER COLUMN "grant_types" SET DATA TYPE "public"."oauth_grant_type_enum"[] USING "grant_types"::"public"."oauth_grant_type_enum"[];--> statement-breakpoint
ALTER TABLE "oauth_clients" ALTER COLUMN "response_types" SET DATA TYPE "public"."oauth_response_type_enum"[] USING "response_types"::"public"."oauth_response_type_enum"[];--> statement-breakpoint
ALTER TABLE "oauth_consents" ALTER COLUMN "scopes" SET DATA TYPE "public"."oauth_scope_enum"[] USING "scopes"::"public"."oauth_scope_enum"[];--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ALTER COLUMN "scopes" SET DATA TYPE "public"."oauth_scope_enum"[] USING "scopes"::"public"."oauth_scope_enum"[];--> statement-breakpoint
ALTER TABLE "sso_applications" ALTER COLUMN "scopes" SET DATA TYPE "public"."oauth_scope_enum"[] USING "scopes"::"public"."oauth_scope_enum"[];--> statement-breakpoint
ALTER TABLE "sso_applications" ALTER COLUMN "grant_types" SET DATA TYPE "public"."oauth_grant_type_enum"[] USING "grant_types"::"public"."oauth_grant_type_enum"[];--> statement-breakpoint
ALTER TABLE "sso_applications" ALTER COLUMN "response_types" SET DATA TYPE "public"."oauth_response_type_enum"[] USING "response_types"::"public"."oauth_response_type_enum"[];--> statement-breakpoint
ALTER TABLE "sso_applications" ALTER COLUMN "token_endpoint_auth_method" SET DEFAULT 'none'::"public"."oauth_token_endpoint_auth_method_enum";--> statement-breakpoint
ALTER TABLE "sso_applications" ALTER COLUMN "token_endpoint_auth_method" SET DATA TYPE "public"."oauth_token_endpoint_auth_method_enum" USING "token_endpoint_auth_method"::"public"."oauth_token_endpoint_auth_method_enum";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."user_role_enum";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role_enum" USING "role"::"public"."user_role_enum";