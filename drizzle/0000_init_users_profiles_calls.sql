CREATE TYPE "public"."profile_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"visitor_name" text NOT NULL,
	"visitor_purpose" text NOT NULL,
	"visitor_email" text NOT NULL,
	"ip_hash" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slug" text,
	"status" "profile_status" DEFAULT 'draft' NOT NULL,
	"full_name" text DEFAULT '' NOT NULL,
	"greeting" text DEFAULT '' NOT NULL,
	"profile_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"resume_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"full_name" text DEFAULT '' NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calls_profile_started_idx" ON "calls" USING btree ("profile_id","started_at");--> statement-breakpoint
CREATE INDEX "calls_email_started_idx" ON "calls" USING btree ("visitor_email","started_at");--> statement-breakpoint
CREATE INDEX "calls_ip_started_idx" ON "calls" USING btree ("ip_hash","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_slug_unique" ON "profiles" USING btree ("slug") WHERE "profiles"."slug" is not null;--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");