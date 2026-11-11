"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@repo/ui/components/ui";

export function ComplianceReadinessCard() {
  const score = 92;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  // 1. Start with 0 progress
  const [offset, setOffset] = useState(circumference);

  // 2. Trigger animation after initial mount
  useEffect(() => {
    const targetOffset = circumference - (score / 100) * circumference;
    const timer = setTimeout(() => setOffset(targetOffset), 100);
    return () => clearTimeout(timer);
  }, [circumference, score]);

  const criteria = [
    { name: "Care Quality commission", status: "Ready" },
    { name: "Fire Safety", status: "Ready" },
    { name: "Health & safety", status: "Ready" },
    { name: "Medication Audit", status: "Ready" },
  ];

  return (
    <Card className="w-full h-[413px] p-[20px] bg-[#F7F7F7] border-none rounded-2xl flex flex-col justify-between shadow-none box-border shrink-0">
      <div className="w-full flex items-center justify-start">
        <h3 className="font-['Outfit'] font-medium text-[16px] leading-[20px] text-[#141F1E]">
          Compliance Readiness
        </h3>
      </div>

      <div className="relative flex items-center justify-center my-auto py-1">
        <svg className="w-[150px] h-[150px] transform -rotate-90">
          <circle
            cx="75"
            cy="75"
            r={radius}
            className="stroke-[#DEE9E6]"
            strokeWidth="15"
            fill="transparent"
          />
          <circle
            cx="75"
            cy="75"
            r={radius}
            className="stroke-[#4A706A]"
            strokeWidth="15"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="square"
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-['Outfit'] font-medium text-[32px] leading-[36px] text-[#141F1E]">
            {score}%
          </span>
          <span className="font-['Outfit'] font-medium text-[12px] leading-[15px] text-[#141F1E] mt-[2px]">
            Overall Score
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-[12px] gap-x-[16px] w-full mb-[12px] px-[6px]">
        {criteria.map((item, index) => (
          <div key={index} className="flex items-start gap-[8px] min-w-0">
            <CheckCircle2 className="w-[18px] h-[18px] text-[#22973F] shrink-0 mt-[1px]" />
            <div className="flex flex-col min-w-0">
              <span className="font-['Outfit'] font-normal text-[9.3px] leading-[12px] text-[#141F1E] truncate">
                {item.name}
              </span>
              <span className="font-['Outfit'] font-normal text-[7px] leading-[9px] text-[#5D5D5D] mt-[2px]">
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="w-full h-[40px] bg-[#F5F8F7] hover:bg-[#eaf1ee] transition-colors rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
      >
        <span className="font-['outfit'] font-bold text-[12px] leading-[14px] text-[#141F1E]">
          View Compliance Centre
        </span>
      </button>
    </Card>
  );
}