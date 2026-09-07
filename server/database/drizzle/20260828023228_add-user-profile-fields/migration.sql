ALTER TABLE "users" ADD COLUMN "username" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" varchar(128);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar(128);--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_key" ON "users" USING btree ("username");