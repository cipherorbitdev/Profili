CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"call_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"body" text NOT NULL,
	"intent" text,
	"visitor_name" text NOT NULL,
	"visitor_email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notified_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	CONSTRAINT "messages_call_id_unique" UNIQUE("call_id")
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_call_id_calls_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_profile_created_idx" ON "messages" USING btree ("profile_id","created_at");--> statement-breakpoint

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON public.messages FROM anon, authenticated;--> statement-breakpoint
GRANT SELECT, UPDATE ON public.messages TO authenticated;--> statement-breakpoint

DROP POLICY IF EXISTS "owners read own messages" ON public.messages;--> statement-breakpoint
CREATE POLICY "owners read own messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );--> statement-breakpoint

DROP POLICY IF EXISTS "owners update own message read_at" ON public.messages;--> statement-breakpoint
CREATE POLICY "owners update own message read_at"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.messages_freeze_except_read_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.call_id IS DISTINCT FROM OLD.call_id
    OR NEW.profile_id IS DISTINCT FROM OLD.profile_id
    OR NEW.body IS DISTINCT FROM OLD.body
    OR NEW.intent IS DISTINCT FROM OLD.intent
    OR NEW.visitor_name IS DISTINCT FROM OLD.visitor_name
    OR NEW.visitor_email IS DISTINCT FROM OLD.visitor_email
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
    OR NEW.notified_at IS DISTINCT FROM OLD.notified_at
  THEN
    RAISE EXCEPTION 'Only read_at can be updated on messages';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS messages_freeze_except_read_at ON public.messages;--> statement-breakpoint
CREATE TRIGGER messages_freeze_except_read_at
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE PROCEDURE public.messages_freeze_except_read_at();--> statement-breakpoint

NOTIFY pgrst, 'reload schema';