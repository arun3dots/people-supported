"use client";

import { Button, Input, Text } from "@repo/ui/components/ui";
import type {
  PreAdmissionAdlChecklistDTO,
  PreAdmissionAdlAssistanceLevel,
} from "@repo/schema";
import { PRE_ADMISSION_ADL_ACTIVITIES } from "@repo/schema";
import { PartCard } from "../../pre-admission/shared/PartCard";

interface KatzMatrixCardProps {
  value: PreAdmissionAdlChecklistDTO;
  onChange: (value: PreAdmissionAdlChecklistDTO) => void;
}

const KATZ_DOMAINS = PRE_ADMISSION_ADL_ACTIVITIES;

const KATZ_LEVELS = [
  "Independent",
  "Supervision",
  "Partial assistance",
  "Total assistance",
] as const satisfies PreAdmissionAdlAssistanceLevel[];

export function KatzMatrixCard({
  value,
  onChange,
}: KatzMatrixCardProps) {
  return (
    <PartCard
      title="F · Activities of Daily Living (ADLs)"
      description="Record the support needed for each activity and add comments where helpful."
    >
      <div className="overflow-x-auto rounded-xl border border-slate-200/70 bg-white">
        <table className="w-full min-w-[900px] text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50">
              <Text as="th" size="sm" weight="bold" className="p-3.5 text-left">Activity</Text>
              {KATZ_LEVELS.map((lvl) => (
                <Text as="th" key={lvl} size="sm" weight="semibold" className="p-3.5 text-center text-slate-600">
                  {lvl}
                </Text>
              ))}
              <Text as="th" size="sm" weight="semibold" className="p-3.5 text-left text-slate-600">
                Comments and notes
              </Text>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {KATZ_DOMAINS.map((domain) => {
              const activity = value[domain.key];
              const currentLvl = activity?.assistanceLevel;
              return (
                <tr key={domain.key} className="hover:bg-slate-50/60 transition-colors">
                  <Text as="td" size="sm" weight="semibold" className="p-3.5 text-slate-800">
                    {domain.label}
                  </Text>
                  {KATZ_LEVELS.map((lvl) => {
                    const isSelected = currentLvl === lvl;
                    return (
                      <td key={lvl} className="p-3.5 text-center">
                        <Button
                          type="button"
                          variant={isSelected ? "primary" : "outline"}
                          size="sm"
                          aria-label={`${domain.label}: ${lvl}`}
                          aria-pressed={isSelected}
                          onClick={() =>
                            onChange({
                              ...value,
                              [domain.key]: {
                                ...activity,
                                  assistanceLevel:
                                    currentLvl === lvl ? null : lvl,
                              },
                            })
                          }
                          className={`size-7 p-0 rounded-sm inline-flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-emerald-800 border-emerald-800 text-white shadow-xs"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {isSelected ? "✓" : ""}
                        </Button>
                      </td>
                    );
                  })}
                  <td className="p-2">
                    <Input
                      aria-label={`${domain.label} comments and notes`}
                      value={activity?.comments ?? ""}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          [domain.key]: {
                            ...activity,
                            comments: event.target.value,
                          },
                        })
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PartCard>
  );
}
