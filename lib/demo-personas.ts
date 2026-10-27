export type ResumeProfile = {
  src: string;
  name: string;
  firstName: string;
  initials: string;
  role: string;
  handle: string;
  fileName: string;
  skills: string[];
  question: string;
  answer: string;
};

export type DemoExperience = {
  company: string;
  title: string;
  dates: string;
  highlights: string[];
};

export type DemoEducation = {
  school: string;
  degree: string;
  dates: string;
};

export type DemoExchange = {
  question: string;
  answer: string;
};

export type DemoPersona = {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  role: string;
  handle: string;
  fileName: string;
  src: string;
  summary: string;
  bio: string;
  skills: string[];
  education: DemoEducation;
  experience: DemoExperience[];
  exchanges: DemoExchange[];
};

export const demoPersonas: DemoPersona[] = [
  {
    id: "maya",
    name: "Maya Chen",
    firstName: "Maya",
    initials: "MC",
    role: "Founder · Loomstack",
    handle: "maya",
    fileName: "maya-chen.pdf",
    src: "/Resumes-Hero/maya-chen.svg",
    summary: "Product architect for handheld hardware with a type-first eye.",
    bio: "Maya builds consumer devices that feel quieter than the spec sheet. She founded Loomstack after a decade at Verdant Labs, where she led the enclosure and interface for a field tablet that still ships in three markets. She talks in constraints: weight, glare, the last 4mm of a hinge.",
    skills: ["Typography", "Loomstack", "Verdant", "Product", "Hardware"],
    education: {
      school: "Westmere College of Art",
      degree: "BFA, Graphic Form",
      dates: "2004 — 2008",
    },
    experience: [
      {
        company: "Loomstack",
        title: "Founder & Product Architect",
        dates: "2016 — Present",
        highlights: [
          "Shipped the Loom 1 handheld: 312g chassis, matte optical stack, no- lag stylus path.",
          "Built a 40-person hardware and design crew in Lisbon and Taipei.",
          "Closed a $28M Series B to tool the second-gen hinge, not a software pivot.",
        ],
      },
      {
        company: "Verdant Labs",
        title: "Director of Product",
        dates: "2009 — 2016",
        highlights: [
          "Led enclosure and UI for the Fieldleaf tablet used by survey crews.",
          "Cut return rate 18% by fixing glare and button travel, not by adding features.",
        ],
      },
      {
        company: "Halcyon Atelier",
        title: "Resident maker",
        dates: "2008 — 2009",
        highlights: [
          "Night studio on letterspacing and small-run cases. Left when the work turned into catalogs.",
        ],
      },
    ],
    exchanges: [
      {
        question: "Halcyon lasted a year. Why stay for letterforms?",
        answer:
          "The stipend was gone by spring. I kept the night studio because weight and spacing were the only things that felt exact. Eight years later that eye is why Loom 1 does not look like a lab brick. The type on the bezel is still the same family I cut by hand.",
      },
      {
        question: "What actually shipped at Verdant before you left?",
        answer:
          "Fieldleaf. A tablet for people who work outside. We killed the glossy stack after a week in Seville sun, then spent a quarter on button travel. I left when the roadmap became accessories. Loomstack exists because I wanted one object, finished.",
      },
    ],
  },
  {
    id: "dario",
    name: "Dario Reyes",
    firstName: "Dario",
    initials: "DR",
    role: "Founder · Orbital Forge",
    handle: "dario",
    fileName: "dario-reyes.pdf",
    src: "/Resumes-Hero/dario-reyes.svg",
    summary: "Chief engineer for small-lift vehicles and ground power.",
    bio: "Dario runs Orbital Forge, a small-lift shop that treats vehicles as production, not theater. He previously founded Ionvolt (grid storage) and still chairs Drift Robotics. He is blunt about failure: two vehicles tumbled before a clean insertion, and he will walk you through the telemetry.",
    skills: ["Guidance", "Orbital Forge", "Ionvolt", "Energy", "Robotics"],
    education: {
      school: "Calder Technical Institute",
      degree: "B.S. Aerospace Systems",
      dates: "2001 — 2005",
    },
    experience: [
      {
        company: "Orbital Forge",
        title: "Founder & Chief Engineer",
        dates: "2014 — Present",
        highlights: [
          "Kite-4 held a 410 km circular for eleven orbits in 2019 after two lost vehicles.",
          "Harbor logistics contract funded the third pad; headcount is 220 across two sites.",
        ],
      },
      {
        company: "Ionvolt",
        title: "Founder",
        dates: "2010 — 2014",
        highlights: [
          "Shipped a 40 MWh neighborhood storage block; sold the line to keep Forge funded.",
        ],
      },
      {
        company: "Drift Robotics",
        title: "Chair",
        dates: "2018 — Present",
        highlights: [
          "Yard tugs for ports. I do not run the day to day. I still sign the battery spec.",
        ],
      },
    ],
    exchanges: [
      {
        question: "When did Orbital Forge actually make a clean insertion?",
        answer:
          "Kite-2 tumbled on ascent. Kite-3 vented a tank at 70 km. Kite-4 in 2019 held 410 km circular for eleven orbits. We had payroll for one more vehicle. After that the Harbor logistics contract kept the lights on. I still have the range plot on my wall.",
      },
      {
        question: "Why sell Ionvolt if the storage block was working?",
        answer:
          "It was working. It was also eating every weekend. Forge needed a pad, not another board meeting about inverters. We sold the line, kept a small royalty, and I stopped pretending I could run two factories.",
      },
    ],
  },
  {
    id: "violet",
    name: "Violet Rodriguez",
    firstName: "Violet",
    initials: "VR",
    role: "Sr. Software Engineer",
    handle: "violet",
    fileName: "violet-rodriguez.pdf",
    src: "/Resumes-Hero/violet-rodriguez.svg",
    summary: "Full-stack engineer for voice threads and quiet database cutovers.",
    bio: "Violet leads full-stack work at Northpane Systems and maintains Threadwell, an open-source conversation runtime. She previously shipped chatbot flows at Helixline. She prefers boring migrations: dual-write, lag budgets, then a cut you can reverse.",
    skills: ["React", "TypeScript", "AWS", "Postgres", "Threadwell"],
    education: {
      school: "Riverside Polytechnic",
      degree: "B.S. Computer Science",
      dates: "2014 — 2018",
    },
    experience: [
      {
        company: "Northpane Systems",
        title: "Senior Software Engineer",
        dates: "2021 — Present",
        highlights: [
          "Led a zero-downtime Postgres cutover on a 12-node cluster with dual-write.",
          "Owns the React and AWS path for the customer console.",
        ],
      },
      {
        company: "Helixline",
        title: "Software Engineer",
        dates: "2018 — 2021",
        highlights: [
          "Shipped AI chatbot flows for a B2B inbox product.",
          "Open-sourced Threadwell, the session layer those flows still sit on.",
        ],
      },
    ],
    exchanges: [
      {
        question: "Tell me about the chatbot work and the Postgres migration.",
        answer:
          "At Helixline I shipped chatbot flows for a B2B inbox. At Northpane I lead full-stack on React and AWS, including a zero-downtime Postgres cutover with dual-write. Threadwell is the open-source thread through both.",
      },
      {
        question: "Where did replica lag actually hurt you?",
        answer:
          "Reads followed a replica that drifted to 2.1s during a noisy backup window. We dual-wrote for a sprint, then routed lag-aware. The scary part was not the cut. It was proving we could roll back without splitting writes.",
      },
    ],
  },
];

export function toResumeProfile(persona: DemoPersona): ResumeProfile {
  const [first] = persona.exchanges;
  return {
    src: persona.src,
    name: persona.name,
    firstName: persona.firstName,
    initials: persona.initials,
    role: persona.role,
    handle: persona.handle,
    fileName: persona.fileName,
    skills: persona.skills,
    question: first?.question ?? "",
    answer: first?.answer ?? "",
  };
}

export const resumes: ResumeProfile[] = demoPersonas.map(toResumeProfile);
