CREATE TABLE "transcript_turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"call_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"speaker" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calls" ADD COLUMN "transcript_token" text;--> statement-breakpoint
ALTER TABLE "transcript_turns" ADD CONSTRAINT "transcript_turns_call_id_calls_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "transcript_turns_call_seq" ON "transcript_turns" USING btree ("call_id","seq");--> statement-breakpoint
CREATE INDEX "transcript_turns_call_idx" ON "transcript_turns" USING btree ("call_id");--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_transcript_token_unique" UNIQUE("transcript_token");--> statement-breakpoint

ALTER TABLE public.transcript_turns ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

GRANT SELECT ON public.calls TO authenticated;--> statement-breakpoint
GRANT SELECT ON public.transcript_turns TO authenticated;--> statement-breakpoint

DROP POLICY IF EXISTS "owners read own calls" ON public.calls;--> statement-breakpoint
CREATE POLICY "owners read own calls"
  ON public.calls FOR SELECT
  TO authenticated
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );--> statement-breakpoint

DROP POLICY IF EXISTS "owners read own transcript turns" ON public.transcript_turns;--> statement-breakpoint
CREATE POLICY "owners read own transcript turns"
  ON public.transcript_turns FOR SELECT
  TO authenticated
  USING (
    call_id IN (
      SELECT c.id
      FROM public.calls c
      JOIN public.profiles p ON p.id = c.profile_id
      WHERE p.user_id = auth.uid()
    )
  );--> statement-breakpoint

NOTIFY pgrst, 'reload schema';