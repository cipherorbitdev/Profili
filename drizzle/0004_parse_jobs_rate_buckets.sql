CREATE TABLE "call_rate_buckets" (
	"kind" text NOT NULL,
	"bucket_key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"n" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "call_rate_buckets_kind_bucket_key_window_start_pk" PRIMARY KEY("kind","bucket_key","window_start")
);
--> statement-breakpoint
ALTER TABLE "calls" ADD COLUMN "insight_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "parse_status" text DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "parse_error" text;

UPDATE "profiles"
SET "parse_status" = 'ready'
WHERE "parse_status" = 'idle'
  AND "status" IN ('draft', 'published')
  AND "profile_json" IS NOT NULL
  AND "profile_json" <> '{}'::jsonb;--> statement-breakpoint

ALTER TABLE public.call_rate_buckets ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON public.call_rate_buckets FROM anon, authenticated;--> statement-breakpoint

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;--> statement-breakpoint

NOTIFY pgrst, 'reload schema';