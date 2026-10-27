import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_EMAIL } from "@/lib/consent";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service · Profili",
  description: "Rules for using Profili accounts, voice pages, and embeds.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms govern use of Profili at{" "}
        <Link href="https://profili.fyi">profili.fyi</Link>. By creating an
        account, publishing a voice page, embedding the agent, or talking to a
        published page, you agree to them. Privacy details live in the{" "}
        <Link href="/privacy">Privacy Policy</Link>. Cookies are described in
        the <Link href="/cookies">Cookie Policy</Link>.
      </p>

      <section>
        <h2>The service</h2>
        <p>
          Profili turns a resume into a shareable voice agent. The product is in
          private beta. Features, limits, and availability can change. Voice
          answers are generated from the published profile. They can be wrong or
          incomplete. Do not treat them as legal, medical, or hiring advice.
        </p>
      </section>

      <section>
        <h2>Accounts</h2>
        <ul>
          <li>You must be 16 or older.</li>
          <li>You may sign in with email or Google. Google Sign-In is only used to identify your account.</li>
          <li>You are responsible for the resume and profile you publish.</li>
          <li>Do not upload content you do not have the right to use.</li>
          <li>Do not attempt to break rate limits, scrape other users, or impersonate someone else.</li>
        </ul>
      </section>

      <section>
        <h2>Public pages and embeds</h2>
        <p>
          A published slug is reachable at /participant/{"{slug}"} and can be embedded on
          another site. Anyone with the link can start a voice call, subject to
          rate limits. You decide when a profile is published. Take it down if
          you no longer want it public.
        </p>
      </section>

      <section>
        <h2>Visitors</h2>
        <p>
          If you talk to someone else&apos;s agent, you provide a name, purpose,
          and email so the owner can see who called. Microphone access is
          granted in the browser. Do not share secrets you do not want stored in
          a transcript. The profile owner can read that conversation and its
          insights.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <ul>
          <li>No malware, harassment, or illegal content in resumes or spoken sessions.</li>
          <li>No using the agent to collect others&apos; data under false pretenses.</li>
          <li>No reverse engineering except as allowed by law.</li>
        </ul>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>
          You keep rights in your resume and profile. You grant Profili a
          license to store, parse, and serve that content so the product can
          work. Profili branding and the product itself remain ours.
        </p>
      </section>

      <section>
        <h2>Disclaimer and liability</h2>
        <p>
          The service is provided as is, during beta, without warranties. To the
          extent the law allows, Profili is not liable for lost offers, hiring
          decisions, or downtime. Our total liability for a claim is limited to
          the amount you paid us in the 12 months before the claim, or zero if
          the product is free.
        </p>
      </section>

      <section>
        <h2>Termination</h2>
        <p>
          You can stop using Profili at any time. We can suspend accounts that
          break these terms or that put the service at risk. Email{" "}
          <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> to request deletion.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>
        </p>
      </section>
    </LegalPage>
  );
}
