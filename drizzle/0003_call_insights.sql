ALTER TABLE "calls" ADD COLUMN "insight_status" text DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "calls" ADD COLUMN "insight_intent" text;--> statement-breakpoint
ALTER TABLE "calls" ADD COLUMN "insight_query" text;--> statement-breakpoint
ALTER TABLE "calls" ADD COLUMN "insight_summary" text;--> statement-breakpoint
ALTER TABLE "calls" ADD COLUMN "insight_citation" text;--> statement-breakpoint
ALTER TABLE "calls" ADD COLUMN "insight_grounded" integer;--> statement-breakpoint
ALTER TABLE "calls" ADD COLUMN "insight_tone" integer;--> statement-breakpoint
ALTER TABLE "calls" ADD COLUMN "insight_fit" integer;--> statement-breakpoint
ALTER TABLE "calls" ADD COLUMN "insight_tone_label" text;--> statement-breakpoint
ALTER TABLE "calls" ADD COLUMN "insight_fit_label" text;--> statement-breakpoint
ALTER TABLE "calls" ADD COLUMN "assembly_session_id" text;