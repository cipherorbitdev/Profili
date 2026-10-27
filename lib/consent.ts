export const LEGAL_EMAIL = "privacy@profili.fyi";
export const LEGAL_UPDATED = "27 September 2026";
export const CONSENT_KEY = "profili-consent";
export const CONSENT_VERSION = 1;
export const THEME_KEY = "profili-theme";
export const WAITLIST_KEY = "profili-waitlist-email";

export type ConsentState = {
  version: number;
  necessary: true;
  functional: boolean;
  decided: boolean;
};

export const defaultConsent: ConsentState = {
  version: CONSENT_VERSION,
  necessary: true,
  functional: false,
  decided: false,
};

export function readConsent(): ConsentState {
  if (typeof window === "undefined") return defaultConsent;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return defaultConsent;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed.version !== CONSENT_VERSION || typeof parsed.functional !== "boolean") {
      return defaultConsent;
    }
    return {
      version: CONSENT_VERSION,
      necessary: true,
      functional: parsed.functional,
      decided: true,
    };
  } catch {
    return defaultConsent;
  }
}

export function writeConsent(functional: boolean): ConsentState {
  const next: ConsentState = {
    version: CONSENT_VERSION,
    necessary: true,
    functional,
    decided: true,
  };
  window.localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
  if (!functional) {
    window.localStorage.removeItem(THEME_KEY);
    window.localStorage.removeItem(WAITLIST_KEY);
  }
  window.dispatchEvent(new CustomEvent("profili-consent", { detail: next }));
  return next;
}

export const CONSENT_OPEN_EVENT = "profili-consent-open";

export function openConsentBanner() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
