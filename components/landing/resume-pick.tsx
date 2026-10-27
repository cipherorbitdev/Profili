"use client";

import { resumes, type ResumeProfile } from "@/lib/visuals";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ResumePickValue = {
  pick: ResumeProfile;
  setPick: (next: ResumeProfile) => void;
};

const ResumePickContext = createContext<ResumePickValue>({
  pick: resumes[0],
  setPick: () => {},
});

export function ResumePickProvider({ children }: { children: ReactNode }) {
  const [pick, setPick] = useState<ResumeProfile>(resumes[0]);

  useEffect(() => {
    setPick(resumes[Math.floor(Math.random() * resumes.length)]);
  }, []);

  return (
    <ResumePickContext.Provider value={{ pick, setPick }}>
      {children}
    </ResumePickContext.Provider>
  );
}

export function useResumePick() {
  return useContext(ResumePickContext).pick;
}

export function useSetResumePick() {
  return useContext(ResumePickContext).setPick;
}
