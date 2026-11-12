"use client";

import React from "react";
import { Users, Moon, Sun, Clock } from "lucide-react";
import { Label, Text } from "@repo/ui/components/ui";

export interface CareTypePreset {
  id: string;
  name: string;
  desc: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: number;
  window: string;
}

export const CARE_TYPE_OPTIONS: CareTypePreset[] = [
  {
    id: "Shared Care (Core Support)",
    name: "Shared Care",
    desc: "Core support shared across all house residents",
    badge: "Shared",
    icon: Users,
    duration: 8,
    window: "07:00 - 15:00",
  },
  {
    id: "1:1 Dedicated Support",
    name: "1:1 Support",
    desc: "Direct support assigned to a single resident",
    badge: "1:1",
    icon: Sun,
    duration: 6,
    window: "09:00 - 15:00",
  },
  {
    id: "2:1 Dedicated Support",
    name: "2:1 Support",
    desc: "Two staff members supporting one individual",
    badge: "2:1",
    icon: Users,
    duration: 4,
    window: "10:00 - 14:00",
  },
  {
    id: "Sleep-in (Overnight)",
    name: "Sleep-in",
    desc: "Flat-rate overnight on-call room presence",
    badge: "Sleep-in",
    icon: Moon,
    duration: 9,
    window: "22:00 - 07:00",
  },
  {
    id: "Waking Night",
    name: "Waking Night",
    desc: "Active awake night support and medication rounds",
    badge: "Night",
    icon: Clock,
    duration: 10,
    window: "21:00 - 07:00",
  },
  {
    id: "Off / Rest Day",
    name: "Off / Rest Day",
    desc: "Scheduled rest day / non-working day for staff",
    badge: "Rest",
    icon: Clock,
    duration: 0,
    window: "Off",
  },
];

interface ShiftCareTypePresetCardsProps {
  careType: string;
  onSelectCareType: (preset: CareTypePreset) => void;
}

export function ShiftCareTypePresetCards({
  careType,
  onSelectCareType,
}: ShiftCareTypePresetCardsProps): React.JSX.Element {
  return (
    <div className="space-y-1.5 font-sans">
      <Label className="text-md font-semibold text-slate-800">
        Care Type &amp; Staffing Model
      </Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {CARE_TYPE_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isSelected = careType === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCareType(item)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <Icon
                  className={`size-4 ${isSelected ? "text-primary" : "text-slate-500"
                    }`}
                />
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${isSelected
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {item.badge}
                </span>
              </div>
              <div>
                <p
                  className={`text-sm font-semibold leading-snug ${isSelected ? "text-primary" : "text-slate-900"
                    }`}
                >
                  {item.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
