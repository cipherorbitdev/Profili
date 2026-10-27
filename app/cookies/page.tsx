import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_EMAIL } from "@/lib/consent";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy · Profili",
  description: "Cookies and local storage Profili uses, and how to change your choice.",
};

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy">
      <p>
        This page lists cookies and similar storage used on{" "}
        <Link href="https://profili.fyi">profili.fyi</Link>. It should be read
        with the <Link href="/privacy">Privacy Policy</Link>. You can change
        your choice any time from Cookie settings in the footer, or from the
        banner.
      </p>

      <section>
        <h2>How we ask</h2>
        <p>
          On your first visit we show a banner. Necessary items run so the site
          can sign you in and remember this choice. Preference storage stays off
          until you Accept all or enable Preferences. We do not use advertising
          cookies, and we do not load analytics scripts today. If that changes,
          we will update this page and ask again.
        </p>
      </section>

      <section>
        <h2>Necessary</h2>
        <p>These are required for the service. The banner cannot turn them off.</p>
        <ul>
          <li>
            <strong>Supabase Auth cookies</strong> (names such as{" "}
            <code className="rounded-md border border-border bg-subtle px-1.5 py-0.5 font-mono text-[13px]">
              sb-*-auth-token
            </code>
            ). HTTP-only session cookies so you stay logged in. Set when you
            sign in. Cleared when you sign out.
          </li>
          <li>
            <strong>profili-consent</strong> (local storage). Stores whether you
            allowed preference storage. Kept so we do not re-prompt on every
            page.
          </li>
          <li>
            <strong>profili-profile:{"{userId}"}</strong> (local storage, signed-in
            only). Agent settings for your workspace on this device.
          </li>
        </ul>
      </section>

      <section>
        <h2>Preferences (optional)</h2>
        <p>Used only if you accept all or enable Preferences.</p>
        <ul>
          <li>
            <strong>profili-theme</strong> (local storage). Light or dark. If
            you refuse, we follow the system setting and do not save a choice.
          </li>
          <li>
            <strong>profili-waitlist-email</strong> (local storage). Remembers
            that you joined the waitlist in this browser. The email is not sent
            to our servers today.
          </li>
        </ul>
      </section>

      <section>
        <h2>Not cookies, but related</h2>
        <ul>
          <li>
            <strong>Microphone.</strong> The browser asks before a live call.
            That permission is not a Profili cookie.
          </li>
          <li>
            <strong>Hashed IP.</strong> When a visitor starts a call we store a
            SHA-256 hash of the IP for rate limits. It is not a cookie.
          </li>
          <li>
            <strong>Third-party processors.</strong> Google (sign-in and Gemini)
            and AssemblyAI (voice) may set their own cookies if you use their
            flows. See their policies.
          </li>
        </ul>
      </section>

      <section>
        <h2>What we do not set</h2>
        <ul>
          <li>Advertising or retargeting cookies.</li>
          <li>Social share trackers on the marketing page.</li>
          <li>Third-party analytics tags.</li>
        </ul>
      </section>

      <section>
        <h2>Embedded agents</h2>
        <p>
          If a voice page loads inside an iframe (<code className="font-mono text-[13px]">?embed=1</code>
          ), we do not show the cookie banner on top of the widget. The host
          site remains responsible for its own cookie notice. The embed still
          uses necessary session pieces if the visitor starts a call.
        </p>
      </section>

      <section>
        <h2>Browser controls</h2>
        <p>
          You can clear site data in your browser. That signs you out and
          removes local storage. Email{" "}
          <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> for questions.
        </p>
      </section>
    </LegalPage>
  );
}
