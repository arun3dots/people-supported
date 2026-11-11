"use client";

import React, { useState, useEffect } from "react";
import { Card, CardTitle } from "@repo/ui/components/ui/Card";

// ==========================================
// 1. SKILLS WIDGET (Expands to fill column space)
// ==========================================
const DEFAULT_SKILLS = [
  "Medication Trained",
  "Dementia Care",
  "PEG Fooding",
  "End-of-Life Care",
  "Diabetes Care",
  "Wound Care",
];

interface SkillsWidgetProps {
  skills?: string[];
}

export function SkillsWidget({ skills = DEFAULT_SKILLS }: SkillsWidgetProps) {
  return (
    <Card className="bg-surface-card-grey rounded-2xl border-none p-5 w-full h-full flex flex-col justify-start shadow-none font-sans">
      <CardTitle className="text-base font-semibold text-slate-900 leading-tight mb-3">
        Skills & Competencies
      </CardTitle>

      {/* Dynamic pill tags wrapping across space */}
      <div className="flex flex-wrap items-center gap-1.5 w-full">
        {skills.map((skill) => (
          <div
            key={skill}
            className="px-2.5 py-1 bg-emerald-50 border border-emerald-300 rounded-full flex items-center justify-center shrink-0"
          >
            <span className="text-md font-medium text-emerald-800 whitespace-nowrap">
              {skill}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ==========================================
// 2. COMPLIANCE WIDGET (With Smooth Ring Animation)
// ==========================================
interface ComplianceWidgetProps {
  score?: number;
  lastUpdated?: string;
}

export function ComplianceWidget({
  score = 96,
  lastUpdated = "Today, 10:24 AM",
}: ComplianceWidgetProps) {
  const radius = 42;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  // Track state and mounting to trigger visual CSS transition reliably
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate target stroke offset based on percentage score
  const targetOffset = circumference - (score / 100) * circumference;

  // Start at full circle offset until mounted, then animate to targetOffset
  const strokeDashoffset = mounted ? targetOffset : circumference;

  return (
    <Card className="bg-surface-card-grey rounded-2xl border-none p-5 flex flex-col items-center w-full shadow-none font-sans">
      {/* Title Header */}
      <CardTitle className="w-full text-base font-semibold text-slate-900 text-left leading-tight mb-3">
        Training Compliance
      </CardTitle>

      {/* Circle Gauge & Status */}
      <div className="flex flex-col items-center gap-2.5">
        <div className="relative size-26 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 104 104">
            {/* Background Circle */}
            <circle
              cx="52"
              cy="52"
              r={radius}
              className="text-slate-200"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="none"
            />
            {/* Animated Ring Arc */}
            <circle
              cx="52"
              cy="52"
              r={radius}
              className="text-emerald-800"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
              stroke="currentColor"
              fill="none"
              style={{
                transition: "stroke-dashoffset 1s ease-out",
              }}
            />
          </svg>
          <span className="absolute text-xl font-bold text-slate-900">
            {score}%
          </span>
        </div>

        {/* Status Indicator */}
        <span className="text-md font-bold text-emerald-800 text-center">
          Compliant
        </span>
      </div>

      {/* Timestamp Footer */}
      <div className="mt-4 text-md font-normal text-slate-500 text-center">
        Last updated: {lastUpdated}
      </div>
    </Card>
  );
}

// ==========================================
// 3. CERTIFICATION STATUS
// ==========================================
interface StatusProps {
  status: string;
}

export function CertificationStatus({ status }: StatusProps) {
  const getStatusColor = (statusName: string) => {
    switch (statusName) {
      case "Completed":
      case "Valid":
        return "bg-[#34C759]";
      case "In-progress":
      case "Expiring Soon":
        return "bg-[#FAEF8E]";
      case "Not Started":
      case "Expired":
      default:
        return "bg-[#D9D9D9]";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full inline-block shrink-0 ${getStatusColor(status)}`} />
      <span className="text-md font-normal text-[#141F1E] whitespace-nowrap font-['Outfit',sans-serif]">
        {status}
      </span>
    </div>
  );
}