-- Auth FK, triggers, RLS, public view, storage. Not modeled in Drizzle schema.
ALTER TABLE "users" ADD CONSTRAINT "users_id_auth_users_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS users_set_updated_at ON public.users;--> statement-breakpoint
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();--> statement-breakpoint

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;--> statement-breakpoint
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.handle_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb;
  name text;
  avatar text;
BEGIN
  meta := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
  name := coalesce(meta->>'full_name', meta->>'name', '');
  avatar := coalesce(meta->>'avatar_url', meta->>'picture', null);

  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, name, avatar)
  ON CONFLICT (id) DO UPDATE
    SET email = excluded.email,
        full_name = CASE
          WHEN excluded.full_name <> '' THEN excluded.full_name
          ELSE public.users.full_name
        END,
        avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
        updated_at = now();

  RETURN NEW;
END;
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_auth_user();--> statement-breakpoint

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;--> statement-breakpoint
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE OF email, raw_user_meta_data ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_auth_user();--> statement-breakpoint

INSERT INTO public.users (id, email, full_name, avatar_url)
SELECT
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
FROM auth.users u
ON CONFLICT (id) DO UPDATE
  SET email = excluded.email,
      full_name = CASE
        WHEN excluded.full_name <> '' THEN excluded.full_name
        ELSE public.users.full_name
      END,
      avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
      updated_at = now();--> statement-breakpoint

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

DROP POLICY IF EXISTS "users read self" ON public.users;--> statement-breakpoint
CREATE POLICY "users read self"
  ON public.users FOR SELECT
  TO authenticated
  USING (id = auth.uid());--> statement-breakpoint

DROP POLICY IF EXISTS "users insert self" ON public.users;--> statement-breakpoint
CREATE POLICY "users insert self"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());--> statement-breakpoint

DROP POLICY IF EXISTS "users update self" ON public.users;--> statement-breakpoint
CREATE POLICY "users update self"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());--> statement-breakpoint

DROP POLICY IF EXISTS "owners read own profiles" ON public.profiles;--> statement-breakpoint
CREATE POLICY "owners read own profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());--> statement-breakpoint

DROP POLICY IF EXISTS "owners insert own profiles" ON public.profiles;--> statement-breakpoint
CREATE POLICY "owners insert own profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());--> statement-breakpoint

DROP POLICY IF EXISTS "owners update own profiles" ON public.profiles;--> statement-breakpoint
CREATE POLICY "owners update own profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());--> statement-breakpoint

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false)
AS
SELECT id, slug, full_name, greeting, profile_json
FROM public.profiles
WHERE status = 'published';--> statement-breakpoint

GRANT USAGE ON SCHEMA public TO anon, authenticated;--> statement-breakpoint
GRANT SELECT ON public.public_profiles TO anon, authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;--> statement-breakpoint
REVOKE ALL ON public.calls FROM anon, authenticated;--> statement-breakpoint

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('resumes', 'resumes', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['application/pdf'];--> statement-breakpoint

DROP POLICY IF EXISTS "users read own resumes" ON storage.objects;--> statement-breakpoint
CREATE POLICY "users read own resumes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND split_part(name, '/', 1) = auth.uid()::text
  );--> statement-breakpoint

DROP POLICY IF EXISTS "users upload own resumes" ON storage.objects;--> statement-breakpoint
CREATE POLICY "users upload own resumes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND split_part(name, '/', 1) = auth.uid()::text
  );--> statement-breakpoint

DROP POLICY IF EXISTS "users update own resumes" ON storage.objects;--> statement-breakpoint
CREATE POLICY "users update own resumes"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND split_part(name, '/', 1) = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'resumes'
    AND split_part(name, '/', 1) = auth.uid()::text
  );--> statement-breakpoint

DROP POLICY IF EXISTS "users delete own resumes" ON storage.objects;--> statement-breakpoint
CREATE POLICY "users delete own resumes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND split_part(name, '/', 1) = auth.uid()::text
  );--> statement-breakpoint

NOTIFY pgrst, 'reload schema';
