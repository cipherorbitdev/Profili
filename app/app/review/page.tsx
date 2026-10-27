"use client";

import { MagneticButton } from "@/components/motion/magnetic-button";
import { PageTransition } from "@/components/motion/reveal";
import { Field } from "@/components/ui/field";
import {
  defaultGreeting,
  type OwnerProfileRow,
  type ProfileJson,
} from "@/lib/resume/schema";
import { slugFromName } from "@/lib/resume/sanitize";
import { publicProfileUrl } from "@/lib/site";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <ReviewForm />
    </Suspense>
  );
}

function ReviewForm() {
  const search = useSearchParams();
  const profileId = search.get("id") || "";
  const [profile, setProfile] = useState<OwnerProfileRow | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [greetingDirty, setGreetingDirty] = useState(false);
  const [slugDirty, setSlugDirty] = useState(false);

  const [fullName, setFullName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState("");
  const [slug, setSlug] = useState("");
  const [experience, setExperience] = useState<ProfileJson["experience"]>([]);

  const load = useCallback(async () => {
    if (!profileId) {
      setError("Pick an agent first.");
      return;
    }
    const response = await fetch(`/api/resume/profile?id=${profileId}`);
    const payload = (await response.json()) as {
      profile: OwnerProfileRow | null;
      error?: string;
    };
    if (!response.ok || !payload.profile) {
      setError(payload.error || "Parse a resume first.");
      return;
    }
    const row = payload.profile;
    const json = row.profile_json;
    setProfile(row);
    setFullName(json.full_name || row.full_name);
    setGreeting(row.greeting || defaultGreeting(json.full_name || row.full_name));
    setHeadline(json.headline);
    setSummary(json.summary);
    setSkills(json.skills.join(", "));
    setExperience(json.experience);
    setSlug(row.slug || slugFromName(json.full_name || row.full_name));
  }, [profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  function onName(value: string) {
    setFullName(value);
    if (!greetingDirty) setGreeting(defaultGreeting(value));
    if (!slugDirty) setSlug(slugFromName(value));
  }

  const canContinue = useMemo(
    () => reviewed && fullName.trim().length > 0 && greeting.trim().length > 0 && slug.trim().length > 1,
    [reviewed, fullName, greeting, slug],
  );

  async function continueToVoice() {
    if (!profile) return;
    setSaving(true);
    setError("");
    const response = await fetch("/api/resume/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile_id: profile.id,
        full_name: fullName,
        greeting,
        headline,
        summary,
        experience,
        skills: skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        slug,
        reviewed: true,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(payload.error || "Could not save.");
      return;
    }
    window.location.assign(`/app/create?id=${profile.id}`);
  }

  if (!profile && !error) {
    return <div className="min-h-[40vh]" />;
  }

  if (!profile) {
    return (
      <PageTransition>
        <h1 className="text-[40px] font-bold tracking-tight">Nothing to review yet.</h1>
        <p className="mt-3 text-[16px] text-muted">{error}</p>
        <div className="mt-8">
          <MagneticButton href="/app" arrow>
            Upload a resume
          </MagneticButton>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <h1 className="text-[40px] font-bold tracking-tight">Review your profile.</h1>
      <p className="mt-3 text-[16px] text-muted">
        Edit anything that looks off. Next you will pick a voice and tone.
      </p>

      <div className="mt-10 max-w-2xl space-y-6">
        <Field label="Full name" value={fullName} onChange={(e) => onName(e.target.value)} />
        <Field
          label="Agent greeting"
          value={greeting}
          onChange={(e) => {
            setGreetingDirty(true);
            setGreeting(e.target.value);
          }}
        />
        <Field label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
        <label className="block">
          <span className="label mb-2 block">Summary</span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[15px] text-ink outline-none focus:border-steel/40"
          />
        </label>
        <Field
          label="Skills"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="Go, AWS, Postgres"
        />
        <Field
          label="Public slug"
          value={slug}
          onChange={(e) => {
            setSlugDirty(true);
            setSlug(e.target.value.toLowerCase());
          }}
        />
        <p className="text-[13px] text-muted">
          Link will be {publicProfileUrl(slug || "your-name")}
        </p>
      </div>

      <div className="mt-12 space-y-6">
        <p className="label">Experience</p>
        {experience.map((job, index) => (
          <div key={`${job.company}-${index}`} className="rounded-2xl border border-border bg-surface p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Company"
                value={job.company}
                onChange={(e) => {
                  const next = [...experience];
                  next[index] = { ...job, company: e.target.value };
                  setExperience(next);
                }}
              />
              <Field
                label="Title"
                value={job.title}
                onChange={(e) => {
                  const next = [...experience];
                  next[index] = { ...job, title: e.target.value };
                  setExperience(next);
                }}
              />
            </div>
            <div className="mt-4">
              <Field
                label="Dates"
                value={job.dates}
                onChange={(e) => {
                  const next = [...experience];
                  next[index] = { ...job, dates: e.target.value };
                  setExperience(next);
                }}
              />
            </div>
            <label className="mt-4 block">
              <span className="label mb-2 block">Highlights (one per line)</span>
              <textarea
                value={job.highlights.join("\n")}
                onChange={(e) => {
                  const next = [...experience];
                  next[index] = {
                    ...job,
                    highlights: e.target.value.split("\n").filter((line) => line.trim()),
                  };
                  setExperience(next);
                }}
                rows={4}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[15px] outline-none focus:border-steel/40"
              />
            </label>
          </div>
        ))}
      </div>

      <label className="mt-10 flex cursor-pointer items-start gap-3 text-[15px]">
        <input
          type="checkbox"
          checked={reviewed}
          onChange={(e) => setReviewed(e.target.checked)}
          className="mt-1"
        />
        <span>I&apos;ve reviewed this and it&apos;s accurate</span>
      </label>

      {error && <p className="mt-4 text-[14px] text-danger">{error}</p>}

      <div className="mt-8">
        <MagneticButton disabled={!canContinue || saving} onClick={() => void continueToVoice()} arrow>
          {saving ? "Saving..." : "Continue to voice"}
        </MagneticButton>
      </div>
    </PageTransition>
  );
}
