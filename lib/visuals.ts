import { resumes, type ResumeProfile } from "@/lib/demo-personas";

export type { ResumeProfile };
export { resumes };

export const visuals = {
  resumes,
  candidate:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80",
  visitor:
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80",
  studio:
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1400&q=80",
  desk:
    "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80",
  mixing:
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1400&q=80",
  meeting:
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
  laptop:
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  handshake:
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
  city:
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80",
  headphones:
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
};

export const gallery = [
  { src: visuals.candidate, label: "Staff engineer voice" },
  { src: visuals.visitor, label: "Live voice session" },
  { src: visuals.studio, label: "Voice studio" },
  { src: visuals.desk, label: "Resume ingest" },
  { src: visuals.mixing, label: "Tone board" },
  { src: visuals.meeting, label: "Team conversation" },
  { src: visuals.laptop, label: "Architecture notes" },
  { src: visuals.headphones, label: "24/7 voice" },
];
