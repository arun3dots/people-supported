"use client";

import React from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";

const REQUIRED_SKILLS = [
  "Medication Administration",
  "Moving & Handling",
  "Dementia Care",
  "Infection Control",
  "Mental Health",
  "Safeguarding",
  "PEG Feeding",
  "Catheter Care",
  "End-of-Life Care",
  "Behaviour Support",
];

const MANDATORY_CERTIFICATIONS = [
  "NMC Registration",
  "Medication Training",
  "First Aid",
  "Fire Safety",
  "Mental Health Training",
  "Manual Handling",
  "DBS Check",
];

export function ShiftRequirementsCard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Card 1: Skills Required */}
      <div className="bg-[#F8FAF9]/80 border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
        <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span>Skills Required for this Shift</span>
        </h3>

        <div className="flex flex-wrap gap-2.5">
          {REQUIRED_SKILLS.map((skill) => (
            <div
              key={skill}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/60 text-emerald-800 text-md font-semibold shadow-2xs transition-all hover:bg-emerald-100/60"
            >
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
              <span>{skill}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card 2: Mandatory Certifications */}
      <div className="bg-[#F8FAF9]/80 border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
        <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span>Mandatory Certifications</span>
        </h3>

        <div className="flex flex-wrap gap-2.5">
          {MANDATORY_CERTIFICATIONS.map((cert) => (
            <div
              key={cert}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50/80 border border-amber-200/70 text-amber-900 text-md font-semibold shadow-2xs transition-all hover:bg-amber-100/60"
            >
              <ShieldCheck className="size-3.5 text-amber-600 shrink-0" />
              <span>{cert}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
