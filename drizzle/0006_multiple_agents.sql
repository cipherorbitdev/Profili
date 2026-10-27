ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_user_id_unique";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_user_id_idx" ON "profiles" USING btree ("user_id");--> statement-breakpoint
DROP POLICY IF EXISTS "owners delete own profiles" ON public.profiles;--> statement-breakpoint
CREATE POLICY "owners delete own profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
