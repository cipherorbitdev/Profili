import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_EMAIL } from "@/lib/consent";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy · Profili",
  description: "What Profili collects, why, and how you can ask us to delete it.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy describes how Profili (<Link href="https://profili.fyi">profili.fyi</Link>)
        handles personal data. It covers the marketing site, accounts, resume
        processing, public voice pages, and embeds. Questions:{" "}
        <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
      </p>

      <section>
        <h2>Who this applies to</h2>
        <ul>
          <li>Visitors to the marketing site, including the waitlist.</li>
          <li>People who create a Profili account (professionals).</li>
          <li>People who talk to a published voice page (visitors).</li>
        </ul>
      </section>

      <section>
        <h2>What we collect</h2>
        <p>We only keep what the product needs to run.</p>
        <h3 className="mt-5 text-[18px] font-semibold">Account</h3>
        <ul>
          <li>Name, email, and password hash if you sign up with email (handled by Supabase Auth).</li>
          <li>If you choose Continue with Google: your Google account id, name, email, and profile photo if Google provides one.</li>
          <li>Profile fields you edit: display name, slug, greeting, parsed resume JSON, publish status.</li>
          <li>The resume file you upload, stored in private object storage.</li>
        </ul>
        <h3 className="mt-5 text-[18px] font-semibold">Voice calls on a published page</h3>
        <ul>
          <li>Visitor name, stated purpose, and email (you type these before the call).</li>
          <li>A one-way hash of your IP address, used only to rate-limit abuse.</li>
          <li>Call start and end times, duration, and a random transcript token.</li>
          <li>Transcript turns (who spoke, and the text).</li>
          <li>Derived insight fields: intent, query, summary, citation, and scores.</li>
          <li>AssemblyAI session id so we can fetch the timeline after the call. We do not store recording URLs.</li>
        </ul>
        <h3 className="mt-5 text-[18px] font-semibold">Waitlist</h3>
        <p>
          The landing waitlist currently stores your email in this browser only
          (<code className="rounded-md border border-border bg-subtle px-1.5 py-0.5 font-mono text-[13px]">profili-waitlist-email</code>
          ). It is not sent to our servers until we add a waitlist backend. If
          you choose Necessary only, we will not keep that value.
        </p>
        <h3 className="mt-5 text-[18px] font-semibold">Preferences on this device</h3>
        <ul>
          <li>Theme (light / dark), if you allow preference storage.</li>
          <li>Your cookie choice (<code className="rounded-md border border-border bg-subtle px-1.5 py-0.5 font-mono text-[13px]">profili-consent</code>).</li>
          <li>Signed-in workspace extras in local storage, needed to keep agent settings on this device.</li>
        </ul>
        <h3 className="mt-5 text-[18px] font-semibold">Hosting logs</h3>
        <p>
          Vercel and our database host may log IP address, user agent, and request
          metadata for security and uptime. We do not run advertising pixels or
          third-party analytics scripts today.
        </p>
      </section>

      <section>
        <h2>Google account data</h2>
        <p>
          Profili uses Google Sign-In so you can create or open an account
          without a password. The Google OAuth consent screen lists the same
          scopes we request: basic profile, email, and OpenID. That is the only
          Google user data we access.
        </p>
        <ul>
          <li>
            <strong>What we receive:</strong> name, email address, a stable
            Google user id, and an optional profile photo URL.
          </li>
          <li>
            <strong>What we do not request:</strong> Gmail, Drive, Calendar,
            Contacts, YouTube, or any other Google product data.
          </li>
          <li>
            <strong>How we use it:</strong> to create and authenticate your
            Profili account, show your name in the workspace, and email you
            about your account. We do not sell Google user data. We do not use
            it for advertising. We do not use it to train unrelated models.
          </li>
          <li>
            <strong>How we store it:</strong> in our authentication provider
            (Supabase Auth) and our users table, on infrastructure we control.
          </li>
          <li>
            <strong>How we share it:</strong> only with processors needed to
            run sign-in and hosting (Supabase, Vercel). We do not share Google
            user data with other apps.
          </li>
        </ul>
        <p>
          Use of information received from Google APIs will adhere to the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
      </section>

      <section>
        <h2>Why we use it</h2>
        <ul>
          <li>Create and secure your account, including Google Sign-In when you choose it.</li>
          <li>Parse a resume into a draft profile (Google Gemini). The parse step is instructed to strip phone numbers, street addresses, and emails from the structured profile.</li>
          <li>Run the public voice agent (AssemblyAI) using published profile JSON as context.</li>
          <li>Show the profile owner call insights after a conversation.</li>
          <li>Limit call spam (hashed IP and visitor email windows).</li>
          <li>Remember theme and waitlist state on this device, if you allow it.</li>
        </ul>
      </section>

      <section>
        <h2>Processors</h2>
        <p>We use these providers to operate the service:</p>
        <ul>
          <li>Supabase: authentication, Postgres, and file storage (EU region when configured that way).</li>
          <li>Vercel: hosting and edge delivery.</li>
          <li>Google (Gemini and, if you choose it, Google sign-in).</li>
          <li>AssemblyAI: live speech to text and voice agent sessions.</li>
          <li>Inngest: background jobs (resume parse, call finalize, open-call close).</li>
        </ul>
        <p>
          Audio leaves the browser for AssemblyAI during a live call. Resume text
          and call transcripts are sent to Gemini to produce structured JSON and
          insights. Those vendors process data under their own terms.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          See the <Link href="/cookies">Cookie Policy</Link> and the banner on
          first visit. Necessary cookies keep you signed in. Preference storage
          is optional.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <ul>
          <li>Account, resume, and profile data: until you delete the account or we delete it at your request.</li>
          <li>Calls, transcripts, and insights: until the owner deletes the profile or account, or we delete them on request.</li>
          <li>Hashed IP rate-limit buckets: short rolling windows (about an hour).</li>
          <li>Browser waitlist and theme: until you clear the site data or switch those preferences off.</li>
        </ul>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          Depending on where you live, you can ask for access, correction,
          deletion, export, or restriction. Email{" "}
          <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> from the address we
          have on file. You can also close your account from the product when
          that control ships; until then, email us. You may lodge a complaint
          with your local data protection authority.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>Profili is for people 16 or older. We do not knowingly collect data from children.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          If this policy changes in a material way, we will update the date at
          the top of this page.
        </p>
      </section>
    </LegalPage>
  );
}
