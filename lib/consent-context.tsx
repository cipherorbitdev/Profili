"use client";

import {
  CONSENT_OPEN_EVENT,
  defaultConsent,
  readConsent,
  writeConsent,
  type ConsentState,
} from "@/lib/consent";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ConsentContextValue = {
  consent: ConsentState;
  ready: boolean;
  acceptAll: () => void;
  rejectOptional: () => void;
  save: (functional: boolean) => void;
  reopen: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(defaultConsent);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    setReady(true);
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<ConsentState>).detail;
      if (detail) setConsent(detail);
      else setConsent(readConsent());
    };
    window.addEventListener("profili-consent", onChange);
    return () => window.removeEventListener("profili-consent", onChange);
  }, []);

  const save = useCallback((functional: boolean) => {
    setConsent(writeConsent(functional));
  }, []);

  const reopen = useCallback(() => {
    window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
  }, []);

  const value = useMemo(
    () => ({
      consent,
      ready,
      acceptAll: () => save(true),
      rejectOptional: () => save(false),
      save,
      reopen,
    }),
    [consent, ready, save, reopen],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
}
