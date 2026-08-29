ALTER TYPE "public"."user_role_enum" ADD VALUE IF NOT EXISTS 'admin';--> statement-breakpoint
ALTER TYPE "public"."user_role_enum" ADD VALUE IF NOT EXISTS 'vice';--> statement-breakpoint
ALTER TYPE "public"."user_role_enum" ADD VALUE IF NOT EXISTS 'master';
