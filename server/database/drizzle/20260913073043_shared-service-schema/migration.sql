CREATE TYPE "audit_outcome_enum" AS ENUM('success', 'failure');--> statement-breakpoint
CREATE TYPE "authentication_event_type_enum" AS ENUM('sign_up', 'sign_in', 'sign_out', 'password_change', 'password_reset', 'email_verified', 'mfa_challenge', 'account_linked', 'account_unlinked');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_user_id" uuid,
	"organization_id" uuid,
	"action" varchar(128) NOT NULL,
	"outcome" "audit_outcome_enum" NOT NULL,
	"resource_type" varchar(128),
	"resource_id" text,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authentication_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"session_id" uuid,
	"type" "authentication_event_type_enum" NOT NULL,
	"provider" varchar(128),
	"success" boolean DEFAULT true NOT NULL,
	"failure_reason" text,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_role" (
	"member_id" uuid,
	"role_id" uuid,
	CONSTRAINT "member_role_pkey" PRIMARY KEY("member_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "permission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"resource" varchar(128) NOT NULL,
	"action" varchar(128) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid,
	"key" varchar(128) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permission" (
	"role_id" uuid,
	"permission_id" uuid,
	CONSTRAINT "role_permission_pkey" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"team_id" uuid,
	"member_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_member_pkey" PRIMARY KEY("team_id","member_id")
);
--> statement-breakpoint
CREATE INDEX "audit_log_actor_user_id_idx" ON "audit_log" ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_log_organization_id_idx" ON "audit_log" ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" ("created_at");--> statement-breakpoint
CREATE INDEX "authentication_event_user_id_idx" ON "authentication_event" ("user_id");--> statement-breakpoint
CREATE INDEX "authentication_event_created_at_idx" ON "authentication_event" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "permission_resource_action_key" ON "permission" ("resource","action");--> statement-breakpoint
CREATE UNIQUE INDEX "role_organization_key_key" ON "role" ("organization_id","key");--> statement-breakpoint
CREATE INDEX "role_organization_id_idx" ON "role" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_organization_slug_key" ON "team" ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "team_organization_id_idx" ON "team" ("organization_id");--> statement-breakpoint
CREATE INDEX "team_member_member_id_idx" ON "team_member" ("member_id");--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "authentication_event" ADD CONSTRAINT "authentication_event_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "authentication_event" ADD CONSTRAINT "authentication_event_session_id_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "member_role" ADD CONSTRAINT "member_role_member_id_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member_role" ADD CONSTRAINT "member_role_role_id_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role" ADD CONSTRAINT "role_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_member_id_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE;