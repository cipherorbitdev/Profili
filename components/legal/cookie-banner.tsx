"use client";

import { CONSENT_OPEN_EVENT } from "@/lib/consent";
import { useConsent } from "@/lib/consent-context";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CookieBannerInner() {
  const { consent, ready, acceptAll, rejectOptional, save } = useConsent();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [functional, setFunctional] = useState(false);

  const embed = searchParams.get("embed") === "1" || searchParams.get("embed") === "true";

  useEffect(() => {
    if (!ready || embed) return;
    setOpen(!consent.decided);
    setFunctional(consent.functional);
  }, [ready, consent.decided, consent.functional, embed]);

  useEffect(() => {
    const onOpen = () => {
      setFunctional(consent.functional);
      setCustomize(true);
      setOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, [consent.functional]);

  if (
    !ready ||
    embed ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/presentation") ||
    !open
  )
    return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-copy"
      className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface p-5 shadow-(--shadow-lg) sm:p-6">
        <p id="cookie-banner-title" className="text-[16px] font-semibold tracking-tight text-ink">
          Cookies on Profili
        </p>
        <p id="cookie-banner-copy" className="mt-2 text-[14px] leading-relaxed text-muted">
          We use necessary cookies to keep you signed in. With your OK we also store
          preferences in this browser, such as theme and waitlist status. We do not
          set advertising cookies. Read the{" "}
          <Link href="/cookies" className="font-medium text-ink underline underline-offset-4">
            Cookie Policy
          </Link>
          ,{" "}
          <Link href="/privacy" className="font-medium text-ink underline underline-offset-4">
            Privacy Policy
          </Link>
          , and{" "}
          <Link href="/terms" className="font-medium text-ink underline underline-offset-4">
            Terms of Service
          </Link>
          .
        </p>

        {customize ? (
          <div className="mt-4 space-y-3 rounded-xl border border-border bg-subtle p-4">
            <label className="flex items-start justify-between gap-4">
              <span>
                <span className="block text-[14px] font-medium text-ink">Necessary</span>
                <span className="mt-0.5 block text-[13px] text-muted">
                  Sign-in cookies and this consent choice. Always on.
                </span>
              </span>
              <input type="checkbox" checked disabled className="mt-1 h-4 w-4" />
            </label>
            <label className="flex items-start justify-between gap-4">
              <span>
                <span className="block text-[14px] font-medium text-ink">Preferences</span>
                <span className="mt-0.5 block text-[13px] text-muted">
                  Theme and remembering that you joined the waitlist on this device.
                </span>
              </span>
              <input
                type="checkbox"
                checked={functional}
                onChange={(event) => setFunctional(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[#01497C]"
              />
            </label>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={() => {
              acceptAll();
              setOpen(false);
              setCustomize(false);
            }}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-btn px-5 text-sm font-medium text-btn-fg transition-colors hover:bg-btn-hover"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={() => {
              rejectOptional();
              setOpen(false);
              setCustomize(false);
            }}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-5 text-sm font-medium text-ink transition-colors hover:bg-subtle"
          >
            Necessary only
          </button>
          {customize ? (
            <button
              type="button"
              onClick={() => {
                save(functional);
                setOpen(false);
                setCustomize(false);
              }}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-medium text-ink transition-colors hover:bg-subtle"
            >
              Save choices
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCustomize(true)}
              className="inline-flex h-11 items-center justify-center px-3 text-sm font-medium text-ink underline underline-offset-4"
            >
              Customize
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CookieBanner() {
  return (
    <Suspense fallback={null}>
      <CookieBannerInner />
    </Suspense>
  );
}
