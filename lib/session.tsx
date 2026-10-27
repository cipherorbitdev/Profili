"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { greetingFor, handleFromName } from "./mock";
import { isSupabaseConfigured } from "./supabase/env";
import type { Profile } from "./types";

type SessionContextValue = {
  user: Profile | null;
  ready: boolean;
  update: (patch: Partial<Profile>) => void;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function extrasKey(userId: string) {
  return `profili-profile:${userId}`;
}

type ProfileExtras = Partial<
  Pick<
    Profile,
    | "name"
    | "handle"
    | "role"
    | "skills"
    | "voice"
    | "language"
    | "personality"
    | "formality"
    | "verbosity"
    | "greeting"
    | "hasResume"
    | "hasAgent"
    | "fileName"
    | "agentId"
  >
>;

function readExtras(userId: string): ProfileExtras {
  try {
    const raw = localStorage.getItem(extrasKey(userId));
    return raw ? (JSON.parse(raw) as ProfileExtras) : {};
  } catch {
    localStorage.removeItem(extrasKey(userId));
    return {};
  }
}

function writeExtras(userId: string, extras: ProfileExtras) {
  localStorage.setItem(extrasKey(userId), JSON.stringify(extras));
}

function profileFromUser(authUser: User): Profile {
  const extras = readExtras(authUser.id);
  const meta = authUser.user_metadata ?? {};
  const name =
    extras.name ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    authUser.email?.split("@")[0] ||
    "You";
  const handle = extras.handle || handleFromName(name);

  return {
    name,
    email: authUser.email ?? "",
    handle,
    role: extras.role ?? "",
    skills: extras.skills ?? [],
    voice: extras.voice ?? "Alex",
    language: extras.language ?? "en",
    personality: extras.personality ?? "professional",
    formality: extras.formality ?? 0.3,
    verbosity: extras.verbosity ?? 0.5,
    greeting: extras.greeting ?? greetingFor(name),
    hasResume: extras.hasResume ?? false,
    hasAgent: extras.hasAgent ?? false,
    fileName: extras.fileName,
    agentId: extras.agentId ?? handle,
  };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true);
      return;
    }

    let cancelled = false;
    let unsubscribe = () => {};

    (async () => {
      const { createClient } = await import("./supabase/client");
      const supabase = createClient();

      const {
        data: { user: current },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setAuthUser(current);
      setUser(current ? profileFromUser(current) : null);
      setReady(true);

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        const next = session?.user ?? null;
        setAuthUser(next);
        setUser(next ? profileFromUser(next) : null);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const update = useCallback(
    (patch: Partial<Profile>) => {
      if (!authUser) return;
      const merged = { ...readExtras(authUser.id), ...patch };
      writeExtras(authUser.id, merged);
      setUser(profileFromUser(authUser));
    },
    [authUser],
  );

  const logout = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setAuthUser(null);
      setUser(null);
      return;
    }
    const { createClient } = await import("./supabase/client");
    await createClient().auth.signOut({ scope: "global" });
    setAuthUser(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, update, logout }),
    [user, ready, update, logout],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
